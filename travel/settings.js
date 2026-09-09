/* ------------------------------------------------------------------
   Trip settings: origin airport, home country, gateways, date/month,
   travellers, style, currency. Owns the settings bar, the URL params,
   currency rates, and every section that depends purely on settings
   (hero labels, flights, when-to-go, country safety card).
   ------------------------------------------------------------------ */
(function () {
  const A = window.APP, T = window.TRIP, E = window.EUROPE, C = window.CONTENT;
  const { $, $$, esc, store, t } = A;
  const state = A.state;
  const byId = (id) => T.destinations.find((d) => d.id === id);
  const origin = () => E.origins.find((o) => o.code === state.origin) || E.origins.find((o) => o.code === 'FRA');
  const gw = (code) => T.gateways.find((g) => g.code === code) || T.gateways[0];
  const gateway = () => gw(state.gateway);
  const gateway2 = () => gw(state.gateway2 || state.gateway);
  const gatewayDest = () => byId(gateway().dest);
  const month = () => state.month; // 1–12
  const country = () => E.countries[state.country] || E.countries.DE;
  const monthName = (m = month()) => (A.LANG.cur === 'de' ? ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'] : T.monthNames)[m - 1];
  const RATING = { 3: { k: 'month.best', cls: 'best' }, 2: { k: 'month.good', cls: 'good' }, 1: { k: 'month.ok', cls: 'ok' }, 0: { k: 'month.avoid', cls: 'avoid' } };
  const monthRating = (d, m = month()) => d.months ? d.months[m - 1] : 2;
  const monthBadge = (d, m = month()) => { const r = RATING[monthRating(d, m)]; return `<span class="mbadge ${r.cls}">${t(r.k)}</span>`; };
  Object.assign(A, { origin, gateway, gateway2, gatewayDest, month, country, monthName, monthRating, monthBadge, RATING });

  /* ---------- URL & persistence ---------- */
  function readUrl() {
    const h = location.hash;
    const get = (k) => { const m = h.match(new RegExp('[#&]' + k + '=([^&]+)')); return m ? decodeURIComponent(m[1]) : null; };
    const o = get('o'); if (o && E.origins.some((x) => x.code === o)) state.origin = o;
    const c = get('c'); if (c && E.countries[c]) state.country = c;
    const g = get('g'); if (g && T.gateways.some((x) => x.code === g)) state.gateway = g;
    const g2 = get('g2'); if (g2 && T.gateways.some((x) => x.code === g2)) state.gateway2 = g2;
    const d = get('d'); if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) store.set('tripDate', d);
    const cur = get('cur'); if (cur && E.currencies[cur]) state.currency = cur;
  }
  function writeUrl() {
    const keep = (location.hash.match(/plan=[^&]+/) || [''])[0];
    const parts = [keep, `o=${state.origin}`, `c=${state.country}`, `g=${state.gateway}`, state.gateway2 && state.gateway2 !== state.gateway ? `g2=${state.gateway2}` : '', `d=${store.get('tripDate', '')}`, `p=${state.people}`, `s=${state.style}`, `cur=${state.currency}`].filter(Boolean);
    history.replaceState(null, '', '#' + parts.join('&'));
  }
  A.writeUrl = writeUrl;

  /* ---------- Currency ---------- */
  window.RATES = Object.fromEntries(Object.entries(E.currencies).map(([k, v]) => [k, v.rate]));
  fetch('https://api.frankfurter.app/latest?from=EUR&to=' + Object.keys(E.currencies).filter((k) => k !== 'EUR').join(','), { cache: 'no-store' })
    .then((r) => r.json()).then((j) => { if (j && j.rates) { Object.assign(window.RATES, j.rates); T.eurToInr = Math.round(j.rates.INR * 10) / 10; $('#rate').textContent = T.eurToInr; $('#rateLabel').textContent = `${t('rate.live')} · ${j.date}`; A.calc(); dispatchEvent(new CustomEvent('ratechange')); } }).catch(() => {});

  /* ---------- Settings bar ---------- */
  const bar = $('#settingsBar');
  function renderBar() {
    const o = origin(), byCountry = {};
    E.origins.forEach((x) => { (byCountry[x.country] = byCountry[x.country] || []).push(x); });
    const opt = (v, label, sel) => `<option value="${v}" ${sel ? 'selected' : ''}>${esc(label)}</option>`;
    bar.innerHTML = `
      <div class="set"><label>${t('set.origin')}</label><select id="setOrigin">${Object.entries(byCountry).map(([cc, list]) => `<optgroup label="${esc(E.countries[cc]?.name || cc)}">${list.map((x) => opt(x.code, `${x.city} (${x.code})`, x.code === state.origin)).join('')}</optgroup>`).join('')}</select></div>
      <div class="set"><label>${t('set.country')}</label><select id="setCountry">${Object.entries(E.countries).map(([cc, c]) => opt(cc, c.name, cc === state.country)).join('')}</select></div>
      <div class="set"><label>${t('set.arrive')}</label><select id="setGateway">${T.gateways.map((g) => opt(g.code, `${g.city} (${g.code})`, g.code === state.gateway)).join('')}</select></div>
      <div class="set"><label>${t('set.depart')}</label><select id="setGateway2">${opt('', t('set.same'), !state.gateway2 || state.gateway2 === state.gateway)}${T.gateways.map((g) => opt(g.code, `${g.city} (${g.code})`, state.gateway2 === g.code && g.code !== state.gateway)).join('')}</select></div>
      <div class="set"><label>${t('set.date')}</label><input type="date" id="tripDate" min="2026-09-01" max="2028-12-31" value="${esc(store.get('tripDate', '2026-11-07'))}"></div>
      <div class="set"><label>${t('set.people')}</label><select id="setPeople">${Array.from({ length: 12 }, (_, i) => opt(i + 1, i + 1, state.people === i + 1)).join('')}</select></div>
      <div class="set"><label>${t('set.style')}</label><select id="setStyle">${Object.entries(A.M.styles).map(([k, v]) => opt(k, `${v.label} · ${v.stars}`, state.style === k)).join('')}</select></div>
      <div class="set"><label>${t('set.currency')}</label><select id="setCurrency">${Object.keys(E.currencies).map((k) => opt(k, k, state.currency === k)).join('')}</select></div>`;
    $('#setOrigin').addEventListener('change', (e) => { state.origin = e.target.value; state.country = origin().country; state.currency = E.countries[state.country]?.currency || 'EUR'; commit(true); });
    $('#setCountry').addEventListener('change', (e) => { state.country = e.target.value; state.currency = E.countries[state.country]?.currency || state.currency; commit(true); });
    $('#setGateway').addEventListener('change', (e) => { state.gateway = e.target.value; if (state.gateway2 === state.gateway) state.gateway2 = ''; commit(true, true); });
    $('#setGateway2').addEventListener('change', (e) => { state.gateway2 = e.target.value; commit(); });
    $('#tripDate').addEventListener('change', (e) => { if (e.target.value) { store.set('tripDate', e.target.value); state.month = +e.target.value.slice(5, 7); } commit(); });
    $('#setPeople').addEventListener('change', (e) => { state.people = +e.target.value; commit(); });
    $('#setStyle').addEventListener('change', (e) => { state.style = e.target.value; commit(); });
    $('#setCurrency').addEventListener('change', (e) => { state.currency = e.target.value; commit(); });
  }
  function commit(rerenderBar = false, gatewayChanged = false) {
    store.set('cost', state); writeUrl();
    if (rerenderBar) renderBar();
    A.syncInputs(); A.calc();
    renderHero(); renderFlights(); renderWhenToGo(); renderCountryCard();
    dispatchEvent(new CustomEvent('settingschange', { detail: { gatewayChanged } }));
  }
  A.commitSettings = commit;

  /* ---------- Hero ---------- */
  function renderHero() {
    const o = origin(), g = gateway(), gd = gatewayDest();
    const best = T.destinations.filter((d) => monthRating(d) === 3).length;
    $('#heroEyebrow').textContent = `${o.city} → ${g.city} · ${monthName()} ${store.get('tripDate', '2026-11-07').slice(0, 4)}`;
    $('#svgOrigin').textContent = o.city.split(' ')[0].toUpperCase();
    $('#svgGateway').textContent = g.city.toUpperCase();
    const nonstop = o.nonstop[g.code];
    $('#statHours').textContent = `${nonstop ? o.hours : o.hours + 3} h`; $('#statHoursLabel').textContent = nonstop ? `${t('flights.nonstop')} ${o.code} → ${g.code}` : `${o.code} → ${g.code}, 1 stop`;
    $('#statBest').textContent = best; $('#statBestLabel').textContent = `${t('month.best')} ${t('month.in')} ${monthName()}`;
    $('#statDest').textContent = T.destinations.length;
    $('#statFrom').textContent = A.fmtNum(A.M.styles.comfort.intl + 5 * 120 + 150);
    $('#statFromLabel').textContent = A.LANG.cur === 'de' ? `pro Person ab (${A.M.styles.comfort.label})` : `per person from (${A.M.styles.comfort.label})`;
    const near = T.destinations.filter((d) => d.id !== gd.id && d.region === gd.region).sort((a, b) => window.GEO.km(gd, a) - window.GEO.km(gd, b)).slice(0, 2);
    $('#svgSpoke1').textContent = (near[0]?.name || '').toUpperCase(); $('#svgSpoke2').textContent = (near[1]?.name || '').toUpperCase();
  }

  /* ---------- Flights ---------- */
  function renderFlights() {
    const o = origin(), g = gateway(), g2 = gateway2();
    const tz = { GB: 5.5, IE: 5.5, PT: 5.5, TR: 2.5, GR: 3.5, FI: 3.5 }[o.country] ?? 4.5;
    const cards = [];
    const nonstop = o.nonstop[g.code];
    if (nonstop) cards.push({ from: o.city, to: g.city, code: g.code, type: t('flights.nonstop'), duration: `≈ ${o.hours} h`, airlines: nonstop.join(' · '), price: `${A.fmtNum(650)} – ${A.fmtNum(1100)} economy · ${A.fmtNum(2600)} – ${A.fmtNum(4500)} business`, tip: t('flights.arriveNote') });
    else cards.push({ from: o.city, to: g.city, code: g.code, type: `${t('flights.none')} ${o.hubs.map((h) => E.hubs[h] || h).join(', ')}`, duration: `${o.hours + 2.5} – ${o.hours + 5} h`, airlines: o.hubs.map((h) => (E.hubs[h] || h).replace(/.*\((.*)\)/, '$1')).join(' · '), price: `${A.fmtNum(600)} – ${A.fmtNum(1000)} economy · ${A.fmtNum(2400)} – ${A.fmtNum(4200)} business`, tip: t('flights.arriveNote') });
    // other gateways with nonstop from this origin
    const others = T.gateways.filter((x) => x.code !== g.code && o.nonstop[x.code]);
    others.slice(0, 2).forEach((x) => cards.push({ from: o.city, to: x.city, code: x.code, type: t('flights.nonstop'), duration: `≈ ${o.hours} h`, airlines: o.nonstop[x.code].join(' · '), price: `${A.fmtNum(650)} – ${A.fmtNum(1100)} economy`, tip: x.note }));
    if (g2.code !== g.code) cards.push({ from: g2.city, to: o.city, code: o.code, type: o.nonstop[g2.code] ? t('flights.nonstop') : `${t('flights.onestop')} ${o.hubs.slice(0, 2).map((h) => E.hubs[h] || h).join(' / ')}`, duration: o.nonstop[g2.code] ? `≈ ${o.hours + 0.5} h` : `${o.hours + 3} – ${o.hours + 5} h`, airlines: (o.nonstop[g2.code] || o.hubs.map((h) => (E.hubs[h] || h).replace(/.*\((.*)\)/, '$1'))).join(' · '), price: A.LANG.cur === 'de' ? 'Gabelflug: meist nur wenig teurer als Hin- und Rückflug' : 'Open-jaw ticket: usually only slightly more than a return', tip: A.LANG.cur === 'de' ? `Rückflug ab ${g2.city} — kein Rückweg nach ${g.city} nötig.` : `Return from ${g2.city} — no need to travel back to ${g.city}.` });
    $('#flightGrid').innerHTML = cards.map((f, i) => `
      <article class="card reveal in" style="--i:${i}">
        <div class="route-line"><span>${esc(f.from.split(' ')[0])}</span><span class="arrow"></span><span>${esc(f.code)}</span></div>
        <div class="chip-row"><span class="chip warm">${esc(f.type)}</span><span class="chip">${esc(f.duration)}</span></div>
        <small>${esc(f.airlines)}</small>
        <div class="price">${esc(f.price)}</div>
        <div class="tip">💡 ${esc(f.tip)}</div>
      </article>`).join('');
    $('#flightsTitle').textContent = A.LANG.cur === 'de' ? `${o.city} nach ${g.city}` : `${o.city} to ${g.city}`;
    $('#tzNote').textContent = `${t('flights.time')}: IST = ${o.country === 'GB' || o.country === 'IE' || o.country === 'PT' ? 'GMT' : 'CET'} + ${tz} h`;
    // arrival card
    const gd = gatewayDest();
    $('#arrivalCard').innerHTML = `<h3 style="font-size:1.3rem;margin-bottom:10px">🛬 ${gd.name} (${g.code})</h3>
      <div class="chip-row"><span class="chip">${A.LANG.cur === 'de' ? 'e-Visum ausgedruckt + Rückflugticket' : 'Printed e-Visa + return ticket'}</span><span class="chip">${A.LANG.cur === 'de' ? 'SIM-Schalter in der Ankunftshalle' : 'SIM counters in arrivals'}</span><span class="chip warm">${A.LANG.cur === 'de' ? 'Hotelabholung vorbestellen' : 'Pre-book the hotel pickup'}</span><span class="chip warm">${esc(gd.comfort.hospital.split('·')[0].trim())}</span></div>
      <p style="color:var(--ink-2);font-size:.95rem">${esc(g.note)} ${esc(gd.area)}</p>`;
    // onward connections from the gateway
    const legs = T.destinations.filter((d) => d.id !== gd.id).map((d) => ({ d, l: window.GEO.leg(gd, d, state.style, state.people) })).sort((a, b) => a.l.hours - b.l.hours);
    $('#onwardTitle').textContent = A.LANG.cur === 'de' ? `Weiterreise ab ${gd.name}` : `Onward from ${gd.name}`;
    $('#domesticBody').innerHTML = legs.map(({ d, l }) => `<tr><td><b>${d.emoji} ${esc(d.name)}</b><span class="note">${esc(d.tag)} · ${monthBadge(d)}</span></td><td>${window.GEO.MODE_ICON[l.mode]} ${esc(l.label)}</td><td>${l.hours} h</td><td><b>${A.fmtNum(l.cost)}</b> pp</td></tr>`).join('');
  }

  /* ---------- When to go (month strip) ---------- */
  function renderWhenToGo() {
    const m = month();
    const groups = [3, 2, 1, 0].map((r) => ({ r, list: T.destinations.filter((d) => monthRating(d, m) === r) }));
    $('#whenToGo').innerHTML = `<div class="wtg-head"><b>${monthName()}</b><span>${A.LANG.cur === 'de' ? 'Wählt oben ein anderes Datum, um den Monat zu ändern.' : 'Change the departure date above to see another month.'}</span></div>` +
      groups.filter((g) => g.list.length).map((g) => `<div class="wtg-row"><span class="mbadge ${RATING[g.r].cls}">${t(RATING[g.r].k)}</span><div class="wtg-chips">${g.list.map((d) => `<button class="wtg-chip" data-id="${d.id}">${d.emoji} ${esc(d.name)}</button>`).join('')}</div></div>`).join('');
    $('#weatherRow').hidden = m !== 11; $('#weatherNovNote').hidden = m !== 11;
  }
  $('#whenToGo').addEventListener('click', (e) => { const b = e.target.closest('.wtg-chip'); if (b) A.openDest(b.dataset.id); });

  /* ---------- Country safety card ---------- */
  function renderCountryCard() {
    const c = country(), g = gateway();
    const near = c.consulates.includes(g.city) ? g.city : null;
    $('#countryCard').innerHTML = `
      <div class="icon">🛂</div>
      <h3>${t('safety.country')} ${esc(c.name)}</h3>
      <ul class="country-links">
        <li><a target="_blank" rel="noopener" href="${esc(c.advice)}">${t('safety.advice')} ↗</a></li>
        <li><a target="_blank" rel="noopener" href="${esc(c.register.u)}">${t('safety.register')}: ${esc(c.register.n)} ↗</a></li>
        <li><a target="_blank" rel="noopener" href="${esc(c.embassy)}">${t('safety.embassy')} ↗</a></li>
        <li><a target="_blank" rel="noopener" href="${esc(c.health.u)}">${t('safety.health')}: ${esc(c.health.n)} ↗</a></li>
      </ul>
      <p>${near ? `${t('safety.consulates')} ${esc(c.consulates.join(', '))} — <b>${esc(near)}</b> ${A.LANG.cur === 'de' ? 'ist euer Gateway.' : 'is your gateway.'}` : (c.consulates.length ? `${t('safety.consulates')} ${esc(c.consulates.join(', '))}. ` : '') + t('safety.noneNear')}</p>`;
  }

  /* ---------- init ---------- */
  readUrl();
  if (!store.get('tripDate', null)) store.set('tripDate', '2026-11-07');
  state.month = +store.get('tripDate', '2026-11-07').slice(5, 7) || 11;
  renderBar(); A.syncInputs(); renderHero(); renderFlights(); renderWhenToGo(); renderCountryCard(); writeUrl();
  dispatchEvent(new CustomEvent('settingschange', { detail: { init: true } }));
  addEventListener('langchange', () => { renderBar(); renderHero(); renderFlights(); renderWhenToGo(); renderCountryCard(); });
  addEventListener('ratechange', () => { renderHero(); renderFlights(); });
})();
