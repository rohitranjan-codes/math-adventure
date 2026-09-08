# Namaste, November 🛫 — Europe → South India travel planner

**A clean, animated, single-page travel plan for a group flying from Frankfurt or Zurich to
Bengaluru in November.**

Live site (once GitHub Pages is enabled): `https://rohitranjan-codes.github.io/europe-india-travel-planner/`

## What's inside

- **Animated hero** with a route map — planes flying FRA / ZRH → Bengaluru → Goa / Kochi.
- **Why November** — temperature and honest verdicts for every region (including where *not* to go).
- **Flights** — nonstop and one-stop options from Frankfurt and Zurich, arrival guide for BLR
  airport, and a table of onward flights, trains and road connections.
- **"Which trip is you?" quiz** — five questions that recommend a route and three destinations,
  with a WhatsApp share button.
- **Three day-by-day itineraries** — *Sun & Spice* (Goa), *Tea Hills & Backwaters*
  (Munnar · Thekkady · Alleppey houseboat · Fort Kochi) and *Heritage & Coffee*
  (Mysuru · Coorg · Hampi).
- **Interactive map** (Leaflet + OpenStreetMap/CARTO tiles, no API key) — pins for every
  destination, route lines from Bengaluru on hover, popups that open the guide or add the place
  to your plan.
- **24 Indian destinations from Bengaluru**, filterable by mood — beaches, hills & tea, culture,
  wildlife, cities and "further afield in India" (Golden Triangle, Rajasthan, Varanasi,
  Rishikesh). Each has an illustrated cover, things to do, food, hotels at three budgets, travel
  time from BLR and suggested nights.
- **Passport stamps** — every destination you open earns a stamp; collect all 24.
- **Food gallery** — sixteen dishes with region, veg/non-veg, spice rating and where to eat them.
- **Trip builder** — tap or drag destinations into a timeline, set nights, reorder, load one of
  the three routes as a template. Computes days, transfer hours and cost per person / group. The
  plan is encoded in the URL, so it can be shared on WhatsApp, copied, or printed to PDF.
- **Cost planner** — sliders for group size, trip length, travel style, departure city and route,
  in EUR or INR. Uses a live EUR→INR rate from the free Frankfurter API when online.
- **Dates** — departure-date picker with countdown, November 2026 festival calendar filtered to
  your trip window, and a packing list generated from your plan.
- **Safety & practical guide** plus a saved pre-departure checklist (confetti when complete).
- **Useful links** — official visa portal, German/Swiss travel advice, airlines, trains, hotels.
- **German / English toggle** for the interface, dark mode, responsive layout.

## Run it

No build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
npx --yes http-server -p 8080 -c-1
```

## Customise

Everything editable lives in **`data.js`**:

| Key            | What it controls                                              |
| -------------- | ------------------------------------------------------------- |
| `eurToInr`     | Exchange rate used by the cost planner                        |
| `weather`      | November weather cards                                        |
| `flights`      | Europe → Bengaluru options                                    |
| `domestic`     | Onward flights / trains / road table                          |
| `destinations` | Destination cards, map pins & builder stops (`type`, `lat`/`lng`, `hours`, `transfer`) |
| `photos`       | Ids that have a real photo at `img/<id>.jpg` (replaces the illustration) |
| `routes`       | The tabbed day-by-day itineraries                             |
| `costModel`    | Per-person prices by travel style, origin and route           |
| `safety`       | Safety cards                                                  |
| `links`        | Useful links, grouped                                         |

Quiz questions, the food gallery, festivals, packing rules and German strings live in
**`content.js`**. Cover illustrations are generated in the browser by `illustrations.js`.

### Adding real photos

Put a JPEG at `img/<destination id>.jpg` (e.g. `img/goa.jpg`, ~1200 px wide) and add the id to
`photos` in `data.js`. Free sources with attribution-friendly licences: Unsplash, Pexels,
Wikimedia Commons. Keep a `CREDITS.md` if the licence needs attribution.

Fonts come from Google Fonts and map tiles from CARTO/OpenStreetMap; everything else is
self-contained (Leaflet is vendored in `vendor/`).

## Publish on GitHub Pages

**Settings → Pages → Deploy from a branch → `main` / `/ (root)`**. A `.nojekyll` file is included
so nothing is post-processed.

> All prices are approximate planning estimates written for a November trip — verify before
> booking. Not affiliated with any airline, hotel or booking site.
