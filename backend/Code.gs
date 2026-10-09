/**
 * Westboory back end — a Google Sheet that stores sign-ups.
 *
 * Paste this whole file into Extensions → Apps Script of your Google Sheet,
 * then follow SETUP.md. Everything people submit lands in three tabs:
 *
 *   Treat Houses    – public: shown on the map and street list
 *   Candy Requests  – PRIVATE: names/addresses for the volunteer drop-off
 *   Not This Year   – just a tally of "no" answers
 *
 * To take a house off the map, untick its "Show on map" box (or delete the row).
 */

// Email you (the sheet owner) whenever someone asks for free candy.
var EMAIL_ME_ON_CANDY_REQUEST = true;

// A generous box around Westbury. Addresses that land outside it are kept
// in the sheet but left off the map until you check them.
var AREA = { south: 29.630, west: -95.510, north: 29.680, east: -95.450 };

var TABS = {
  houses: {
    name: 'Treat Houses',
    headers: ['Signed up', 'House #', 'Street', 'Teal pumpkin', 'Show on map',
              'Latitude', 'Longitude', 'Matched address', 'Note']
  },
  candy: {
    name: 'Candy Requests',
    headers: ['Requested', 'Name', 'House #', 'Street', 'Phone',
              'Also on map', 'Delivered', 'Volunteer']
  },
  no: {
    name: 'Not This Year',
    headers: ['Answered']
  }
};

var H = { time: 1, num: 2, street: 3, teal: 4, show: 5, lat: 6, lng: 7, matched: 8, note: 9 };
var CACHE_KEY = 'houses-v1';

/** Run once from the editor: creates the tabs and asks for permissions. */
function setup() {
  getTab_(TABS.houses);
  getTab_(TABS.candy);
  getTab_(TABS.no);
  // Touch the geocoder and mail service so their permissions are granted now.
  Maps.newGeocoder().geocode('Houston, TX');
  if (EMAIL_ME_ON_CANDY_REQUEST) MailApp.getRemainingDailyQuota();
}

/** GET → the list of houses for the map and street list. */
function doGet() {
  var cache = CacheService.getScriptCache();
  var cached = cache.get(CACHE_KEY);
  if (cached) return json_(JSON.parse(cached));

  var sheet = getTab_(TABS.houses);
  var rows = sheet.getLastRow() > 1
    ? sheet.getRange(2, 1, sheet.getLastRow() - 1, TABS.houses.headers.length).getValues()
    : [];
  var houses = [];
  rows.forEach(function (r) {
    if (r[H.show - 1] !== true || !r[H.num - 1] || !r[H.street - 1]) return;
    houses.push({
      n: String(r[H.num - 1]),
      s: String(r[H.street - 1]),
      teal: r[H.teal - 1] === true,
      lat: typeof r[H.lat - 1] === 'number' ? r[H.lat - 1] : null,
      lng: typeof r[H.lng - 1] === 'number' ? r[H.lng - 1] : null
    });
  });
  var body = { ok: true, houses: houses };
  cache.put(CACHE_KEY, JSON.stringify(body), 60);
  return json_(body);
}

/** POST → a sign-up. Body is JSON sent as text/plain (avoids CORS preflight). */
function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, error: 'Bad request' });
  }
  // Honeypot: real people never see or fill this field.
  if (data.website) return json_({ ok: true });

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    if (data.type === 'no') {
      getTab_(TABS.no).appendRow([new Date()]);
      return json_({ ok: true });
    }

    var num = clean_(data.number, 8).toUpperCase();
    var street = clean_(data.street, 60);
    if (!/^\d{1,6}[A-Z]?$/.test(num) || street.length < 2) {
      return json_({ ok: false, error: 'Please enter your house number and street.' });
    }

    if (data.type === 'yes') {
      var house = upsertHouse_(num, street, data.teal === true);
      CacheService.getScriptCache().remove(CACHE_KEY);
      return json_({ ok: true, house: house });
    }

    if (data.type === 'candy') {
      var name = clean_(data.name, 80);
      var phone = clean_(data.phone, 30);
      if (!name) return json_({ ok: false, error: 'Please enter your name.' });
      var addToMap = data.addToMap === true;
      var placed = addToMap ? upsertHouse_(num, street, false) : null;
      if (placed) CacheService.getScriptCache().remove(CACHE_KEY);

      var sheet = getTab_(TABS.candy);
      sheet.appendRow([new Date(), name, num, placed ? placed.s : tidyStreet_(street),
                       phone, addToMap, false, '']);
      sheet.getRange(sheet.getLastRow(), 6, 1, 2).insertCheckboxes();
      sheet.getRange(sheet.getLastRow(), 6).setValue(addToMap);

      if (EMAIL_ME_ON_CANDY_REQUEST) {
        try {
          MailApp.sendEmail(Session.getEffectiveUser().getEmail(),
            'Westboory: candy drop-off request from ' + name,
            name + ' asked for a free bucket of candy.\n\n' +
            'Address: ' + num + ' ' + (placed ? placed.s : tidyStreet_(street)) + '\n' +
            'Phone: ' + (phone || '(none given)') + '\n\n' +
            'See the "Candy Requests" tab of your sheet.');
        } catch (mailErr) { /* never fail the request over an email */ }
      }
      return json_({ ok: true, house: placed });
    }

    return json_({ ok: false, error: 'Unknown request' });
  } finally {
    lock.releaseLock();
  }
}

/** Adds a house, or updates it if the same address signed up before. */
function upsertHouse_(num, typedStreet, teal) {
  var geo = geocode_(num, typedStreet);
  var street = geo.street || tidyStreet_(typedStreet);
  var key = num + '|' + streetKey_(street);

  var sheet = getTab_(TABS.houses);
  var width = TABS.houses.headers.length;
  var last = sheet.getLastRow();
  var rowIndex = 0;
  if (last > 1) {
    var existing = sheet.getRange(2, 1, last - 1, width).getValues();
    for (var i = 0; i < existing.length; i++) {
      if (String(existing[i][H.num - 1]).toUpperCase() + '|' + streetKey_(existing[i][H.street - 1]) === key) {
        rowIndex = i + 2;
        break;
      }
    }
  }

  // Clearly-outside addresses wait for the organizer to tick "Show on map".
  var show = !geo.outside;
  var row = [new Date(), num, street, teal, show,
             geo.lat === null ? '' : geo.lat, geo.lng === null ? '' : geo.lng,
             geo.matched || '', geo.note || ''];
  if (rowIndex) {
    // Keep the organizer's "Show on map" choice and an existing teal "yes".
    var prev = sheet.getRange(rowIndex, 1, 1, width).getValues()[0];
    row[H.show - 1] = prev[H.show - 1];
    row[H.teal - 1] = teal || prev[H.teal - 1] === true;
    sheet.getRange(rowIndex, 1, 1, width).setValues([row]);
  } else {
    sheet.appendRow(row);
    rowIndex = sheet.getLastRow();
    sheet.getRange(rowIndex, H.teal, 1, 2).insertCheckboxes();
    sheet.getRange(rowIndex, H.teal, 1, 2).setValues([[row[H.teal - 1], show]]);
  }
  return { n: num, s: street, teal: row[H.teal - 1] === true, lat: geo.lat, lng: geo.lng,
           listed: row[H.show - 1] === true };
}

/** Finds the house on the map using Google's geocoder (free inside Apps Script). */
function geocode_(num, street) {
  var out = { lat: null, lng: null, street: '', matched: '', note: '', outside: false };
  try {
    var res = Maps.newGeocoder()
      .setBounds(AREA.south, AREA.west, AREA.north, AREA.east)
      .setRegion('us')
      .geocode(num + ' ' + street + ', Houston, TX');
    var hit = (res.results || [])[0];
    if (!hit) { out.note = 'Address not found — please check'; return out; }

    var hasNumber = hit.address_components.some(function (c) {
      return c.types.indexOf('street_number') >= 0;
    });
    var route = hit.address_components.filter(function (c) {
      return c.types.indexOf('route') >= 0;
    })[0];
    var loc = hit.geometry.location;
    var inArea = loc.lat >= AREA.south && loc.lat <= AREA.north &&
                 loc.lng >= AREA.west && loc.lng <= AREA.east;

    if (!hasNumber || !route) { out.note = 'Only a rough match — please check'; return out; }
    if (!inArea) { out.note = 'Outside Westbury — please check'; out.outside = true; return out; }

    out.lat = loc.lat;
    out.lng = loc.lng;
    out.street = route.short_name;
    out.matched = hit.formatted_address;
  } catch (err) {
    out.note = 'Map lookup failed — please check';
  }
  return out;
}

/* ---------- small helpers ---------- */

var SUFFIXES = { drive: 'Dr', dr: 'Dr', street: 'St', st: 'St', road: 'Rd', rd: 'Rd',
                 lane: 'Ln', ln: 'Ln', boulevard: 'Blvd', blvd: 'Blvd', avenue: 'Ave',
                 ave: 'Ave', court: 'Ct', ct: 'Ct', circle: 'Cir', cir: 'Cir',
                 way: 'Way', place: 'Pl', pl: 'Pl' };

/** "arboles drive" → "Arboles Dr" */
function tidyStreet_(s) {
  var words = String(s).replace(/[.,]/g, ' ').trim().split(/\s+/);
  return words.map(function (w, i) {
    var lower = w.toLowerCase();
    if (i === words.length - 1 && SUFFIXES[lower]) return SUFFIXES[lower];
    if (lower === 'w' || lower === 'west') return i === 0 ? 'W' : 'West';
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }).join(' ');
}

function streetKey_(s) {
  return tidyStreet_(s).toLowerCase();
}

function clean_(v, max) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
}

function getTab_(def) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(def.name);
  if (!sheet) {
    sheet = ss.insertSheet(def.name);
    sheet.getRange(1, 1, 1, def.headers.length).setValues([def.headers])
      .setFontWeight('bold').setBackground('#fbe3cf');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
