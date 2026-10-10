/*
 * ─────────────────────────────────────────────────────────────
 *  WESTBOORY SETTINGS — the only file you need to edit.
 *  Change the text between the quote marks, save, and re-publish.
 * ─────────────────────────────────────────────────────────────
 */
window.WESTBOORY = {
  // Paste your Google Apps Script "Web app URL" here (see SETUP.md, step 2).
  // While this is empty the site runs in PREVIEW MODE: it shows sample
  // houses and sign-ups are NOT saved.
  apiUrl: "",

  // Shown at the top of the page.
  eventDate: "Saturday, October 31",
  eventTime: "5:30 – 8:30 pm",

  // Where neighbors can reach you with questions or to remove their house.
  // Leave empty to hide.
  organizerEmail: "",

  // The free candy drop-off: last day to ask.
  candyRequestDeadline: "Sunday, October 25",

  // Map starting view (center of Westbury) and zoom level.
  mapCenter: [29.6537, -95.4813],
  mapZoom: 15,

  // Street names suggested as people type. Spelling matters here, so
  // please double-check and add any missing streets (especially in your
  // own section). People can still type a street that isn't listed.
  streets: [
    "Arboles Dr", "Ashcroft Dr", "Atwell Dr", "Bankside Dr", "Belrose Dr",
    "Benning Dr", "Braewick Dr", "Briarbend Dr", "Burdine St",
    "Burlinghall Dr", "Cartagena St", "Cedarhurst Dr", "Chimney Rock Rd",
    "Claridge Dr", "Creekbend Dr", "Dawnridge Dr", "Dodd St", "Dryad Dr",
    "Dunlap St", "Effingham Dr", "Endicott Ln", "Ettrick Dr", "Farwell Dr",
    "Gasmer Dr", "Greencraig Dr", "Hummingbird St", "Kingfisher Dr",
    "Kinglet St", "Landsdowne Dr", "McKnight St", "Portal Dr", "Rampart St",
    "Redstart St", "Sanford Rd", "Spellman Rd", "Starkridge Dr",
    "Stillbrooke Dr", "Vickijohn Dr", "Warm Springs Rd", "Waycross Dr",
    "Willowbend Blvd"
  ]
};
