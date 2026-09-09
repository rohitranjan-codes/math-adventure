# Namaste, India 🛫 — Europe → India travel planner

**A safe, comfortable, single-page trip planner from any European airport to all of India.**
Pick your origin, home country, arrival and departure gateway, month, group size, style and
currency — every section adapts.

Live site (once GitHub Pages is enabled): `https://rohitranjan-codes.github.io/europe-india-travel-planner/`

## What's inside

- **Trip settings bar** — 29 European origin airports with their nonstop links, 20 home countries,
  8 Indian gateways (arrive in one, leave from another), departure date, travellers, style and
  currency (EUR, CHF, GBP, SEK, NOK, DKK, PLN, CZK, HUF, INR with live rates). Everything is
  saved and encoded in the URL, so a shared link carries the whole setup.
- **Three styles, no backpacking** — Comfort (4★), Premium (5★) and Luxury (palaces, business
  class). Costs, hotel picks, transfers and flight classes follow the style.
- **Any month** — every destination carries a 12-month rating; the "when to go" strip, cards,
  builder and weather history follow the chosen month.
- **Geo engine** — any leg between two stops is estimated from coordinates: named day trains where
  they exist, flights when both ends have airports and the road is long, otherwise a private car
  with driver — with hours and cost per person.
- **Safety & comfort cards** — nearest good hospital, comfort score and practical notes for every
  destination, plus a per-country card with official travel advice, trip registration, embassy,
  consulates near your gateway and health sources.

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
- **Curated picks** — 4 to 6 hotels per destination across budget, comfort and luxury, each with a
  one-line reason and links to its live Google and Booking.com reviews (no ratings are stored, so
  nothing goes stale or gets invented), plus the cab apps, car-hire, ferry, train and activity
  operators that work in each place.
- **Live rating filter (4.0+ with 100+ Google reviews)** — hotels and restaurants in every guide
  are checked against live Google ratings and only places that pass are shown; a "show N hidden"
  link reveals the rest. Needs the small ratings service in `worker/` (Cloudflare Worker, free
  tier, one-time setup — see `worker/README.md`). Without it the lists are shown unfiltered with a
  note. All Booking.com links also carry Booking's own "review score 8+" filter.
- **Restaurants** — 2 to 6 named restaurants and cafés per destination with area, why, and links to
  Google and Zomato, rated through the same filter.
- **Booking desk** — reads the trip plan and departure date and lists everything to book in order:
  international flights, every domestic hop or road transfer, every hotel stay with dates and room
  count, and activities that need advance booking. Every link opens Google Flights, Skyscanner,
  Booking.com, Google Hotels, 12Go or the operator already filled in. Tick items off; progress is
  saved.
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
| `gateways`     | Indian arrival/departure airports and which destination city they map to |
| `destinations` | Cards, map pins & builder stops (`region`, `airport`/`via`, `months[12]`, `priceIndex`, `comfort`) |
| `photos`       | Ids that have a real photo at `img/<id>.jpg` (replaces the illustration) |
| `ratingsEndpoint` | URL of the deployed ratings worker (empty = filter off)                |
| `ratingFilter` | `{ min: 4.0, minCount: 100 }` — the rating threshold                        |
| `routes`       | The tabbed day-by-day itineraries                             |
| `costModel`    | Per-person prices by travel style, origin and route           |
| `safety`       | Safety cards                                                  |
| `links`        | Useful links, grouped                                         |

Quiz questions, the food gallery, festivals, packing rules and German strings live in
**`content.js`**. Hotel picks, restaurants and operators live in **`guide.js`**. European origins, per-country
safety sources and currencies are in **`europe.js`**; the leg estimator in **`geo.js`**; the
settings bar and everything it drives in **`settings.js`**. The ratings client is `ratings.js`;
the service is in `worker/`. Cover illustrations are generated in the browser by `illustrations.js`.

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
