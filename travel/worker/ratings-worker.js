/**
 * Ratings service for the travel planner — a Cloudflare Worker (free tier).
 *
 * Looks up a place on Google Places API (New) "Text Search" and returns its
 * rating and review count, so the site can filter hotels and restaurants to
 * 4.0+ with 100+ reviews. Responses are cached at the edge for 7 days, so a
 * whole month of visits costs a few dozen Places calls — well inside Google's
 * free monthly allowance.
 *
 * Deploy (once):
 *   1. Google Cloud → enable "Places API (New)", create an API key restricted
 *      to that API. Billing must be enabled, but usage stays in the free tier.
 *   2. npm i -g wrangler && wrangler login
 *   3. wrangler secret put GOOGLE_PLACES_KEY          (paste the key)
 *   4. wrangler deploy                                (see wrangler.toml)
 *   5. Put the worker URL in data.js → ratingsEndpoint.
 *
 * Request:  GET /?q=Taj%20West%20End%20Bengaluru|Karavalli%20Bengaluru
 * Response: { results: [{ q, name, rating, count, url }] }
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json; charset=utf-8',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'GET') return new Response(JSON.stringify({ error: 'GET only' }), { status: 405, headers: cors });
    if (!env.GOOGLE_PLACES_KEY) return new Response(JSON.stringify({ error: 'GOOGLE_PLACES_KEY secret not set' }), { status: 500, headers: cors });

    const url = new URL(request.url);
    const queries = (url.searchParams.get('q') || '').split('|').map((s) => s.trim()).filter(Boolean).slice(0, 25);
    if (!queries.length) return new Response(JSON.stringify({ error: 'pass ?q=place one|place two' }), { status: 400, headers: cors });

    const results = await Promise.all(queries.map((q) => lookup(q, env)));
    return new Response(JSON.stringify({ results, at: new Date().toISOString() }), { headers: { ...cors, 'Cache-Control': 'public, max-age=86400' } });
  },
};

async function lookup(q, env) {
  const cache = caches.default;
  const key = new Request('https://ratings-cache.invalid/' + encodeURIComponent(q.toLowerCase()));
  const hit = await cache.match(key);
  if (hit) return hit.json();

  let out = { q, name: null, rating: null, count: null, url: null };
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_PLACES_KEY,
        'X-Goog-FieldMask': 'places.displayName,places.rating,places.userRatingCount,places.googleMapsUri',
      },
      body: JSON.stringify({ textQuery: q, maxResultCount: 1, languageCode: 'en' }),
    });
    const j = await r.json();
    const p = j.places && j.places[0];
    if (p) out = { q, name: (p.displayName && p.displayName.text) || null, rating: p.rating ?? null, count: p.userRatingCount ?? null, url: p.googleMapsUri || null };
  } catch (e) {
    out.error = String(e);
  }
  if (!out.error) await cache.put(key, new Response(JSON.stringify(out), { headers: { 'Cache-Control': 'public, max-age=604800' } }));
  return out;
}
