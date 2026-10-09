# Westboory
Trick-or-treating hub for the Westbury neighborhood in Houston.

Neighbors use the site to:

- say **"Yes! Count me in"** and put their house on the trick-or-treat map,
- say **"Not this year"**, or
- ask for a **free bucket of candy**, which a volunteer drops off for neighbors who can't get to the store.

Families can see the participating houses on a **map** (a pumpkin with the house number on each one) or as a **list by street** that can be printed.

**To put it online, follow [SETUP.md](SETUP.md).**

## What's in here

| File | What it is |
|---|---|
| `index.html` | The page |
| `css/styles.css` | Design: colors, fonts, layout |
| `js/config.js` | **Settings you edit:** web app URL, date and time, email, street list |
| `js/app.js` | Sign-up forms, map, and street list |
| `backend/Code.gs` | Google Apps Script that saves sign-ups to a Google Sheet |
| `vendor/leaflet/` | Map library (Leaflet 1.9.4, BSD-2 license) |

It's a static site with no build step. To preview it on your computer, run `python3 -m http.server` in this folder and open http://localhost:8000. While `apiUrl` is empty, the site runs in **preview mode**: it shows sample houses and doesn't save anything.

Map data © OpenStreetMap contributors. Map tiles © CARTO.
