# Ratings service (optional)

The site filters hotels and restaurants to **4.0+ rating with 100+ reviews** using live Google
ratings. Google's key cannot sit in a static page, so this tiny Cloudflare Worker (free tier)
holds the key, calls **Google Places API (New)** and caches every answer for 7 days.

## Cost

- Cloudflare Workers free plan: 100,000 requests/day — far more than needed.
- Google Places API (New) Text Search: the site sends one lookup per hotel/restaurant name, and
  the worker caches each for a week, so a month of traffic is a few hundred lookups at most.
  That sits inside Google's monthly free allowance for this SKU. Billing must be enabled on the
  Google Cloud project, but with caching the expected bill is €0.

## Deploy

```bash
# 1. Google Cloud Console → APIs & Services → enable "Places API (New)"
#    → Credentials → create API key → restrict it to Places API (New)
# 2.
npm i -g wrangler
cd worker
wrangler login
wrangler secret put GOOGLE_PLACES_KEY     # paste the key when prompted
wrangler deploy                            # prints https://india-trip-ratings.<you>.workers.dev
```

Then open `data.js` and set:

```js
ratingsEndpoint: 'https://india-trip-ratings.<you>.workers.dev',
ratingFilter: { min: 4.0, minCount: 100 },
```

Redeploy the site. Hotels and restaurants below the threshold disappear from the guides; a small
"N hidden by your filter" note lets readers reveal them. Without an endpoint the site shows the
curated lists unfiltered and says so.

## Test it

```
https://india-trip-ratings.<you>.workers.dev/?q=Taj%20West%20End%20Bengaluru
→ {"results":[{"q":"Taj West End Bengaluru","name":"Taj West End","rating":4.6,"count":12345,"url":"https://maps.google.com/?cid=..."}]}
```
