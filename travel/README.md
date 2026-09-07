# Namaste, November 🛫 — Europe → South India travel planner

**A clean, animated, single-page travel plan for a group flying from Frankfurt or Zurich to
Bengaluru in November.**

Live site (once GitHub Pages is enabled): `https://rohitranjan-codes.github.io/europe-india-travel-planner/`

## What's inside

- **Animated hero** with a route map — planes flying FRA / ZRH → Bengaluru → Goa / Kochi.
- **Why November** — temperature and honest verdicts for every region (including where *not* to go).
- **Flights** — nonstop and one-stop options from Frankfurt and Zurich, arrival guide for BLR
  airport, and a table of onward flights, trains and road connections.
- **Three day-by-day itineraries** — *Sun & Spice* (Goa), *Tea Hills & Backwaters*
  (Munnar · Thekkady · Alleppey houseboat · Fort Kochi) and *Heritage & Coffee*
  (Mysuru · Coorg · Hampi).
- **22 destinations from Bengaluru**, filterable by mood — beaches, hills & tea, culture,
  wildlife, cities and "beyond South India" (Andamans, Golden Triangle, Sri Lanka, Maldives).
  Each has things to do, food, hotels at three budgets, travel time from BLR and suggested nights.
- **Interactive cost planner** — group size, trip length, travel style, departure city and route,
  shown per person and for the whole group in EUR or INR with an animated breakdown.
- **Safety & practical guide** — e-Visa, health, insurance, emergency numbers, money, SIMs,
  culture, scams — plus a 16-item pre-departure checklist saved in the browser.
- **Useful links** — official visa portal, German/Swiss travel advice, airlines, trains, hotels,
  ride-hailing, tourism boards.
- Dark mode, sticky glass navigation, scroll progress, reveal animations, responsive layout.

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
| `destinations` | Destination cards & modals (`type` drives the filter buttons) |
| `routes`       | The tabbed day-by-day itineraries                             |
| `costModel`    | Per-person prices by travel style, origin and route           |
| `safety`       | Safety cards                                                  |
| `links`        | Useful links, grouped                                         |

Fonts come from Google Fonts; everything else is self-contained.

## Publish on GitHub Pages

**Settings → Pages → Deploy from a branch → `main` / `/ (root)`**. A `.nojekyll` file is included
so nothing is post-processed.

> All prices are approximate planning estimates written for a November trip — verify before
> booking. Not affiliated with any airline, hotel or booking site.
