/* ------------------------------------------------------------------
   Live ratings filter. Talks to the ratings service (worker/), caches
   answers in localStorage for 7 days, and applies TRIP.ratingFilter
   (default: 4.0+ with 100+ reviews) to any element marked
   <... class="rated" data-q="Place name City">.
   Without TRIP.ratingsEndpoint the lists stay unfiltered and say so.
   ------------------------------------------------------------------ */
(function () {
  const T = window.TRIP;
  const endpoint = () => (window.RATINGS_ENDPOINT_OVERRIDE || T.ratingsEndpoint || '').replace(/\/$/, '');
  const filter = () => Object.assign({ min: 4.0, minCount: 100 }, T.ratingFilter || {});
  const TTL = 7 * 24 * 60 * 60 * 1000;
  const load = () => { try { return JSON.parse(localStorage.getItem('ratings') || '{}'); } catch { return {}; } };
  const save = (c) => { try { localStorage.setItem('ratings', JSON.stringify(c)); } catch { /* ignore */ } };
  const inflight = new Map();

  async function fetchBatch(qs) {
    const url = `${endpoint()}/?q=${qs.map(encodeURIComponent).join('|')}`;
    const r = await fetch(url, { cache: 'no-store' });
    if (!r.ok) throw new Error('ratings ' + r.status);
    const j = await r.json();
    return j.results || [];
  }

  /** Resolve ratings for a list of queries → { [q]: {rating,count,url,name} | null } */
  async function get(queries) {
    const out = {}, cache = load(), need = [];
    queries.forEach((q) => { const c = cache[q]; if (c && Date.now() - c.at < TTL) out[q] = c.v; else need.push(q); });
    if (need.length && endpoint()) {
      const key = need.join('|');
      let p = inflight.get(key);
      if (!p) { p = fetchBatch(need).finally(() => inflight.delete(key)); inflight.set(key, p); }
      const res = await p;
      res.forEach((x) => { const v = x && x.rating != null ? { rating: x.rating, count: x.count || 0, url: x.url, name: x.name } : null; out[x.q] = v; cache[x.q] = { v, at: Date.now() }; });
      need.forEach((q) => { if (!(q in out)) { out[q] = null; cache[q] = { v: null, at: Date.now() }; } });
      save(cache);
    }
    return out;
  }

  const passes = (v) => { const f = filter(); return !!v && v.rating >= f.min && v.count >= f.minCount; };
  const badge = (v) => `<span class="rating-badge" title="Google rating · ${v.count.toLocaleString('en-GB')} reviews">★ ${v.rating.toFixed(1)} <small>(${v.count.toLocaleString('en-GB')})</small></span>`;

  /**
   * Apply the filter to all .rated[data-q] elements inside `root`.
   * Adds a badge to passing rows, hides the rest, and writes a summary into
   * root.querySelector('.rating-summary') if present.
   */
  async function apply(root) {
    const rows = [...root.querySelectorAll('.rated[data-q]')];
    const summary = root.querySelector('.rating-summary');
    const f = filter();
    const t = (window.APP && window.APP.t) || ((k) => k);
    if (!rows.length) return;
    if (!endpoint()) {
      if (summary) summary.innerHTML = `<span class="rs-off">${t('rating.off').replace('{min}', f.min.toFixed(1)).replace('{count}', f.minCount)}</span>`;
      return;
    }
    if (summary) summary.innerHTML = `<span class="rs-loading">${t('rating.loading')}</span>`;
    let map;
    try { map = await get(rows.map((r) => r.dataset.q)); }
    catch { if (summary) summary.innerHTML = `<span class="rs-off">${t('rating.fail')}</span>`; return; }
    if (!root.isConnected) return;
    let hidden = 0, shown = 0;
    rows.forEach((r) => {
      const v = map[r.dataset.q];
      r.querySelector('.rating-slot')?.remove();
      if (passes(v)) { shown++; r.classList.remove('rating-hidden'); r.querySelector('b')?.insertAdjacentHTML('afterend', `<span class="rating-slot">${badge(v)}${v.url ? ` <a class="rating-link" target="_blank" rel="noopener" href="${v.url}">Google ↗</a>` : ''}</span>`); }
      else { hidden++; r.classList.add('rating-hidden'); if (v) r.querySelector('b')?.insertAdjacentHTML('afterend', `<span class="rating-slot dim">${badge(v)}</span>`); else r.querySelector('b')?.insertAdjacentHTML('afterend', `<span class="rating-slot dim"><span class="rating-badge none">${t('rating.none')}</span></span>`); }
    });
    if (summary) {
      summary.innerHTML = `<span class="rs-on">✓ ${t('rating.on').replace('{min}', f.min.toFixed(1)).replace('{count}', f.minCount)}</span>${hidden ? ` · <button class="rs-toggle" type="button">${t('rating.hidden').replace('{n}', hidden)}</button>` : ''}`;
      summary.querySelector('.rs-toggle')?.addEventListener('click', (e) => { root.classList.toggle('show-hidden'); e.target.textContent = root.classList.contains('show-hidden') ? t('rating.hide').replace('{n}', hidden) : t('rating.hidden').replace('{n}', hidden); });
    }
    root.dispatchEvent(new CustomEvent('ratingsapplied', { bubbles: true, detail: { shown, hidden } }));
  }

  window.RATINGS = { get, apply, passes, badge, enabled: () => !!endpoint(), filter };
})();
