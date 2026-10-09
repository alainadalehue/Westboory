(function () {
  "use strict";

  var C = window.WESTBOORY || {};
  var API = (C.apiUrl || "").trim();
  var PREVIEW = !API;

  // Roughly the whole Westbury area (used for "Show all of Westbury").
  var WESTBURY_BOUNDS = [[29.637, -95.497], [29.668, -95.462]];

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  var houses = [];
  var sortMode = "az";

  /* ───────── Settings → page ───────── */
  $$("[data-config]").forEach(function (el) {
    var v = C[el.getAttribute("data-config")];
    if (v) el.textContent = v;
  });
  if (C.organizerEmail) {
    var a = $("#organizer-email");
    a.href = "mailto:" + C.organizerEmail;
    a.textContent = C.organizerEmail;
    $("#footer-contact").hidden = false;
  }
  var dl = $("#street-list");
  (C.streets || []).forEach(function (s) {
    var o = document.createElement("option");
    o.value = s;
    dl.appendChild(o);
  });
  if (PREVIEW) $("#preview-banner").hidden = false;

  /* ───────── Helpers ───────── */
  var SUFFIXES = { drive: "Dr", dr: "Dr", street: "St", st: "St", road: "Rd", rd: "Rd",
    lane: "Ln", ln: "Ln", boulevard: "Blvd", blvd: "Blvd", avenue: "Ave", ave: "Ave",
    court: "Ct", ct: "Ct", circle: "Cir", cir: "Cir", way: "Way", place: "Pl", pl: "Pl" };

  function tidyStreet(s) {
    var words = String(s).replace(/[.,]/g, " ").trim().split(/\s+/);
    return words.map(function (w, i) {
      var lower = w.toLowerCase();
      if (i === words.length - 1 && SUFFIXES[lower]) return SUFFIXES[lower];
      if (lower === "w" || lower === "west") return i === 0 ? "W" : "West";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join(" ");
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pumpkinSvg() {
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><use href="#pumpkin"/></svg>';
  }

  function api(method, payload) {
    if (method === "GET") {
      return fetch(API + (API.indexOf("?") < 0 ? "?" : "&") + "t=" + Date.now())
        .then(function (r) { return r.json(); });
    }
    return fetch(API, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); });
  }

  /* ───────── Preview mode (no back end yet) ───────── */
  var SAMPLE = [
    ["5214", "Arboles Dr", 0, 0], ["5226", "Arboles Dr", 0, 1], ["5310", "Arboles Dr", 0, 4],
    ["5207", "Belrose Dr", 1, 0, true], ["5331", "Belrose Dr", 1, 5], ["5222", "McKnight St", -1, 1],
    ["5418", "McKnight St", -1, 7, true], ["11930", "Ashcroft Dr", 2, -3], ["5303", "Burlinghall Dr", 2, 4],
    ["5755", "Cartagena St", 4, 8], ["5815", "Dryad Dr", 7, 6], ["11102", "Endicott Ln", -6, 14]
  ];
  function previewHouses() {
    var base = C.mapCenter || [29.6537, -95.4813];
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem("westboory-preview") || "[]"); } catch (e) {}
    return SAMPLE.map(function (h) {
      return { n: h[0], s: h[1], teal: !!h[4], lat: base[0] - h[2] * 0.0011, lng: base[1] + h[3] * 0.0009 };
    }).concat(saved);
  }
  function previewSubmit(payload) {
    return new Promise(function (resolve) {
      setTimeout(function () {
        var house = null;
        if (payload.type === "yes" || (payload.type === "candy" && payload.addToMap)) {
          house = { n: payload.number, s: tidyStreet(payload.street), teal: !!payload.teal, lat: null, lng: null };
          try {
            var saved = JSON.parse(localStorage.getItem("westboory-preview") || "[]");
            saved.push(house);
            localStorage.setItem("westboory-preview", JSON.stringify(saved));
          } catch (e) {}
        }
        resolve({ ok: true, house: house });
      }, 500);
    });
  }

  function submit(payload) {
    return PREVIEW ? previewSubmit(payload) : api("POST", payload);
  }

  /* ───────── Choices ───────── */
  var answeredNo = false;

  function openPanel(btn) {
    var panel = document.getElementById(btn.getAttribute("aria-controls"));
    if (btn.closest("#choices")) {
      $$("#choices .choice").forEach(function (b) {
        b.setAttribute("aria-expanded", String(b === btn));
        document.getElementById(b.getAttribute("aria-controls")).hidden = b !== btn;
      });
    } else {
      btn.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    }
    return panel;
  }

  $$("[data-choice]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var choice = btn.getAttribute("data-choice");
      var panel = openPanel(btn);
      if (choice === "no") {
        if (!answeredNo) {
          answeredNo = true;
          submit({ type: "no" }).catch(function () {});
        }
        $(".done", panel).focus();
      } else {
        var first = $("input", panel);
        // Focusing on mobile pops up the keyboard; give the panel a moment to appear first.
        setTimeout(function () {
          panel.scrollIntoView({ behavior: "smooth", block: "center" });
          if (first && window.matchMedia("(min-width: 700px)").matches) first.focus({ preventScroll: true });
        }, 50);
      }
    });
  });

  /* ───────── Forms ───────── */
  function showError(form, msg, field) {
    var box = $(".form__error", form);
    box.textContent = msg;
    box.hidden = false;
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  function wireForm(form, type) {
    form.addEventListener("input", function (e) {
      e.target.removeAttribute("aria-invalid");
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      $(".form__error", form).hidden = true;

      var f = form.elements;
      var number = f.number.value.replace(/\s+/g, "").toUpperCase();
      var street = f.street.value.trim();
      var payload = { type: type, number: number, street: street, website: f.website.value };

      if (type === "candy") {
        payload.name = f.name.value.trim();
        payload.phone = f.phone.value.trim();
        payload.addToMap = f.addToMap.checked;
        if (!payload.name) return showError(form, "Please enter your name.", f.name);
      } else {
        payload.teal = f.teal.checked;
      }
      if (!/^\d{1,6}[A-Z]?$/.test(number)) {
        return showError(form, "Please enter your house number (just the numbers, like 5422).", f.number);
      }
      if (street.length < 2) {
        return showError(form, "Please enter your street name.", f.street);
      }

      var btn = $("button[type=submit]", form);
      var label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Sending…";

      submit(payload).then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || "failed");
        var done = form.parentNode.querySelector(".done");
        var addr = $(".done__address", done);
        if (addr) {
          addr.textContent = (res.house ? res.house.n + " " + res.house.s : number + " " + tidyStreet(street));
        }
        // The map lookup couldn't place the house: say so honestly.
        var title = $(".done__title", done);
        if (title && res.house && typeof res.house.lat !== "number" && !PREVIEW) {
          title.textContent = "Thank you — you're signed up!";
          $(".done__more", done).textContent = "We'll double-check the address and get your pumpkin on the map. On Halloween, turn your porch light on so families know to stop by.";
        }
        form.hidden = true;
        done.hidden = false;
        done.focus();
        // Lock the other top-level answer once someone has said yes.
        if (type === "yes") $('[data-choice="no"]').disabled = true;
        loadHouses();
      }).catch(function (err) {
        var msg = err && err.message && err.message !== "failed" && err.message.indexOf("fetch") < 0
          ? err.message
          : "Sorry — that didn't go through. Please check your internet connection and try again.";
        if (C.organizerEmail) msg += " You can also email " + C.organizerEmail + ".";
        showError(form, msg);
      }).then(function () {
        btn.disabled = false;
        btn.textContent = label;
      });
    });
  }
  wireForm($("#form-yes"), "yes");
  wireForm($("#form-candy"), "candy");

  /* ───────── Map ───────── */
  var map = null, layer = null, meMarker = null;

  function initMap() {
    if (!window.L) return;
    map = L.map("leaflet-map", { scrollWheelZoom: false, tap: true, zoomSnap: 0.5 })
      .setView(C.mapCenter || [29.6537, -95.4813], C.mapZoom || 15);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      maxZoom: 20,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);

    var syncZoomClass = function () {
      map.getContainer().classList.toggle("zoomed-out", map.getZoom() < 15);
    };
    map.on("zoomend", syncZoomClass);
    syncZoomClass();

    // Scroll-wheel zoom only after the map is clicked, so the page scrolls normally.
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.getContainer().addEventListener("mouseleave", function () { map.scrollWheelZoom.disable(); });
  }

  function renderMap(fit) {
    if (!map) return;
    layer.clearLayers();
    var pts = [];
    houses.forEach(function (h) {
      if (typeof h.lat !== "number" || typeof h.lng !== "number") return;
      var icon = L.divIcon({
        className: "",
        html: '<div class="pin' + (h.teal ? " pin--teal" : "") + '">' + pumpkinSvg() +
              '<span class="pin__num">' + esc(h.n) + "</span></div>",
        iconSize: [60, 54],
        iconAnchor: [30, 20],
        popupAnchor: [0, -18]
      });
      var addr = h.n + " " + h.s;
      var dest = encodeURIComponent(addr + ", Houston, TX");
      L.marker([h.lat, h.lng], { icon: icon, title: addr, alt: addr, riseOnHover: true })
        .bindPopup('<span class="popup__addr">' + esc(addr) + "</span>" +
          (h.teal ? '<span class="popup__teal">Has non-candy treats too</span><br>' : "") +
          '<a href="https://www.google.com/maps/dir/?api=1&travelmode=walking&destination=' + dest +
          '" target="_blank" rel="noopener">Walking directions</a>')
        .addTo(layer);
      pts.push([h.lat, h.lng]);
    });
    if (fit) {
      if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 17 });
      else map.fitBounds(WESTBURY_BOUNDS);
    }
  }

  $("#btn-all").addEventListener("click", function () {
    if (!map) return;
    var pts = houses.filter(function (h) { return typeof h.lat === "number"; })
      .map(function (h) { return [h.lat, h.lng]; });
    var b = L.latLngBounds(WESTBURY_BOUNDS);
    pts.forEach(function (p) { b.extend(p); });
    map.fitBounds(b, { padding: [10, 10] });
  });

  $("#btn-locate").addEventListener("click", function () {
    var btn = this;
    if (!map || !navigator.geolocation) return;
    btn.textContent = "Finding you…";
    navigator.geolocation.getCurrentPosition(function (pos) {
      var ll = [pos.coords.latitude, pos.coords.longitude];
      if (meMarker) meMarker.remove();
      meMarker = L.marker(ll, {
        icon: L.divIcon({ className: "", html: '<div class="me-dot"></div>', iconSize: [20, 20], iconAnchor: [10, 10] }),
        title: "You are here", zIndexOffset: 1000
      }).addTo(map);
      map.setView(ll, 17);
      btn.textContent = "Where am I?";
    }, function () {
      btn.textContent = "Location unavailable";
      setTimeout(function () { btn.textContent = "Where am I?"; }, 3000);
    }, { enableHighAccuracy: true, timeout: 10000 });
  });

  /* ───────── Street list ───────── */
  function houseNum(n) { return parseInt(n, 10) || 0; }

  function renderList() {
    var view = $("#street-list-view");
    var byStreet = {};
    houses.forEach(function (h) {
      (byStreet[h.s] = byStreet[h.s] || []).push(h);
    });
    var streets = Object.keys(byStreet);
    if (!streets.length) {
      view.innerHTML = '<div class="empty"><strong>No houses yet</strong>Be the first on your street — tap “Yes! Count me in” above.</div>';
      return;
    }
    streets.sort(function (a, b) {
      if (sortMode === "most" && byStreet[b].length !== byStreet[a].length) {
        return byStreet[b].length - byStreet[a].length;
      }
      return a.localeCompare(b);
    });
    view.innerHTML = streets.map(function (s) {
      var list = byStreet[s].sort(function (a, b) { return houseNum(a.n) - houseNum(b.n) || a.n.localeCompare(b.n); });
      var count = list.length === 1 ? "1 house" : list.length + " houses";
      return '<article class="street"><div class="street__head"><h3 class="street__name">' + esc(s) +
        '</h3><span class="street__count">' + count + '</span></div><ul class="nums">' +
        list.map(function (h) {
          return '<li class="num' + (h.teal ? " num--teal" : "") + '"' +
            (h.teal ? ' title="Also has non-candy treats"' : "") + ">" + esc(h.n) +
            (h.teal ? '<svg viewBox="0 0 48 48" class="is-teal" aria-label="non-candy treats"><use href="#pumpkin"/></svg>' : "") +
            "</li>";
        }).join("") + "</ul></article>";
    }).join("");
  }

  $$(".segmented__btn").forEach(function (b) {
    b.addEventListener("click", function () {
      sortMode = b.getAttribute("data-sort");
      $$(".segmented__btn").forEach(function (x) {
        x.classList.toggle("is-active", x === b);
        x.setAttribute("aria-pressed", String(x === b));
      });
      renderList();
    });
  });
  $("#btn-print").addEventListener("click", function () { window.print(); });

  /* ───────── Load data ───────── */
  function renderCount() {
    var n = houses.length;
    var streets = Object.keys(houses.reduce(function (m, h) { m[h.s] = 1; return m; }, {})).length;
    $("#map-count").innerHTML = n
      ? "<strong>" + n + (n === 1 ? " house" : " houses") + "</strong> on " + streets +
        (streets === 1 ? " street" : " streets") + " handing out treats — and counting!"
      : "No houses yet — be the first!";
  }

  var firstLoad = true;
  function loadHouses() {
    var p = PREVIEW ? Promise.resolve({ ok: true, houses: previewHouses() }) : api("GET");
    return p.then(function (res) {
      houses = (res && res.houses) || [];
      renderCount();
      renderList();
      renderMap(firstLoad);
      firstLoad = false;
    }).catch(function () {
      $("#map-count").textContent = "We couldn't load the map just now. Please refresh the page.";
      if (firstLoad) renderList();
    });
  }

  /* ───────── Tabs: highlight the section in view ───────── */
  var links = $$(".tabs__link");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (l) {
          l.classList.toggle("is-current", l.getAttribute("href") === "#" + en.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main .section").forEach(function (s) { io.observe(s); });
  }

  initMap();
  loadHouses();
})();
