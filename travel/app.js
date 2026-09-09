/* ------------------------------------------------------------------
   Europe → South India · November — page logic
   ------------------------------------------------------------------ */
(function () {
  const T = window.TRIP;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  /* ---------- i18n ---------- */
  const C = window.CONTENT || { de: {}, en: {}, deJs: {} };
  const LANG = { cur: store.get('lang', 'en') };
  const t = (k) => (LANG.cur === 'de' ? (C.deJs[k] ?? C.en[k]) : C.en[k]) ?? k;
  function applyLang() {
    document.documentElement.lang = LANG.cur;
    $$('[data-i18n]').forEach((el) => {
      const k = el.dataset.i18n;
      if (el.dataset.en == null) el.dataset.en = el.innerHTML;
      el.innerHTML = LANG.cur === 'de' && C.de[k] ? C.de[k] : el.dataset.en;
    });
    Object.entries(TYPES).forEach(([k, v]) => { v.label = LANG.cur === 'de' ? v.de : v.en; });
    dispatchEvent(new CustomEvent('langchange'));
  }
  const TYPES = {
    all: { en: 'All', de: 'Alle', icon: '🧭' }, beach: { en: 'Beaches', de: 'Strände', icon: '🏖️' }, hills: { en: 'Hills & tea', de: 'Berge & Tee', icon: '🍃' },
    culture: { en: 'Culture & heritage', de: 'Kultur & Erbe', icon: '🏛️' }, wildlife: { en: 'Wildlife', de: 'Wildtiere', icon: '🐘' }, city: { en: 'Cities', de: 'Städte', icon: '🏙️' }, far: { en: 'Further afield in India', de: 'Weiter weg in Indien', icon: '🧳' },
  };
  Object.values(TYPES).forEach((v) => { v.label = LANG.cur === 'de' ? v.de : v.en; });

  /* ---------- Shared trip state (settings.js extends it) ---------- */
  const M = T.costModel;
  const state = Object.assign({ people: 4, days: 10, style: 'comfort', origin: 'FRA', country: 'DE', gateway: 'BLR', gateway2: '', month: 11, route: 'goa', currency: 'EUR', showInr: false }, store.get('cost', {}));
  if (!M.styles[state.style]) state.style = 'comfort';
  if (({ fra: 'FRA', zrh: 'ZRH', other: 'FRA' })[state.origin]) state.origin = ({ fra: 'FRA', zrh: 'ZRH', other: 'FRA' })[state.origin];
  if (!(window.EUROPE && window.EUROPE.currencies[state.currency])) state.currency = 'EUR';
  const fmtNum = (eur) => {
    const cur = state.showInr ? 'INR' : state.currency;
    const rate = (window.RATES && window.RATES[cur]) ?? (cur === 'INR' ? T.eurToInr : 1);
    const cfg = (window.EUROPE && window.EUROPE.currencies[cur]) || { sym: cur + ' ' };
    const v = eur * rate;
    const rounded = cur === 'INR' ? Math.round(v / 100) * 100 : rate > 20 ? Math.round(v / 10) * 10 : Math.round(v);
    return cfg.sym + rounded.toLocaleString(cur === 'INR' ? 'en-IN' : 'en-GB');
  };

  /* ---------- Theme ---------- */
  const root = document.documentElement;
  const applyTheme = (t) => { root.dataset.theme = t; $('#themeBtn').textContent = t === 'dark' ? '☀️' : '🌙'; };
  applyTheme(store.get('theme', matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  $('#themeBtn').addEventListener('click', () => { const t = root.dataset.theme === 'dark' ? 'light' : 'dark'; applyTheme(t); store.set('theme', t); });

  /* ---------- Nav ---------- */
  const nav = $('.nav');
  $('#burger').addEventListener('click', () => nav.classList.toggle('open'));
  $$('.nav-links a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));
  let lastY = 0;
  const toTop = $('#toTop');
  const progress = $('#progress');
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('hidden', y > lastY && y > 300 && !nav.classList.contains('open'));
    lastY = y;
    toTop.classList.toggle('show', y > 600);
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
  }, { passive: true });
  toTop.addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));

  // Active section highlighting
  const sections = $$('section[id]');
  const navLinks = $$('.nav-links a');
  new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-40% 0px -55% 0px' }).observe && sections.forEach((s) => {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); });
    }, { rootMargin: '-40% 0px -55% 0px' }).observe(s);
  });

  /* ---------- Hero tilt ---------- */
  const tilt = $('.flight-card');
  if (tilt && matchMedia('(hover: hover)').matches) {
    tilt.addEventListener('mousemove', (e) => {
      const r = tilt.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      tilt.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateZ(0)`;
    });
    tilt.addEventListener('mouseleave', () => { tilt.style.transform = ''; });
  }

  /* ---------- Weather ---------- */
  $('#weatherRow').innerHTML = T.weather.map((w, i) => `
    <div class="weather-card reveal" data-delay="${(i % 5) + 1}">
      <span class="icon" style="animation-delay:${i * .3}s">${w.icon}</span>
      <b>${esc(w.place)}</b>
      <div class="temp">${esc(w.temp)}</div>
      <div class="live" data-wx="${w.id}"></div>
      <p>${esc(w.note)}</p>
      <span class="badge ${w.rating}">${w.rating === 'great' ? 'Perfect' : w.rating === 'good' ? 'Good' : 'Skip in Nov'}</span>
    </div>`).join('');


  /* ---------- Routes / itinerary ---------- */
  const tabs = $('#routeTabs'), panel = $('#routePanel');
  const routesFor = () => { const list = T.routes.filter((r) => !r.gateway || r.gateway === state.gateway); return list.length ? list : T.routes; };
  function renderTabs() {
    tabs.innerHTML = routesFor().map((r) => `
      <button class="tab" data-id="${r.id}"><span class="emoji">${r.emoji}</span><span>${esc(r.name)}<small>${r.days} ${t('builder.days')} · ${esc(r.subtitle)}</small></span></button>`).join('');
  }
  function renderRoute(id) {
    const list = routesFor();
    const r = list.find((x) => x.id === id) || list[0];
    $$('.tab', tabs).forEach((b) => b.classList.toggle('active', b.dataset.id === r.id));
    panel.style.setProperty('--route-accent', r.accent);
    panel.innerHTML = `
      <aside class="route-summary">
        <span class="badge" style="background:${r.accent}22;color:${r.accent}">${r.days}-day plan</span>
        <h3>${r.emoji} ${esc(r.name)}</h3>
        <div class="sub">${esc(r.subtitle)}</div>
        <p>${esc(r.summary)}</p>
        <div class="route-stats">
          <div><b>${esc(r.stats.flights)}</b><span>Flights</span></div>
          <div><b>${esc(r.stats.pace)}</b><span>Pace</span></div>
          <div><b>${esc(r.stats.cost)}</b><span>Estimated cost incl. Europe flights</span></div>
        </div>
        <a class="btn btn-primary" style="margin-top:18px;width:100%;justify-content:center" href="#costs" data-route="${r.id}">Estimate this trip →</a>
      </aside>
      <div class="timeline">
        ${r.itinerary.map((d, i) => `
          <div class="day" data-day="${d.day}" style="--i:${i}">
            <div class="where">${esc(d.place)}</div>
            <h4>${esc(d.title)}</h4>
            <p>${esc(d.text)}</p>
            <div class="tags">${d.tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
          </div>`).join('')}
      </div>`;
    $('[data-route]', panel).addEventListener('click', () => setRoute(r.id));
  }
  tabs.addEventListener('click', (e) => { const b = e.target.closest('.tab'); if (b) { renderRoute(b.dataset.id); store.set('route', b.dataset.id); } });
  renderTabs(); renderRoute(store.get('route', 'goa'));
  addEventListener('settingschange', () => { renderTabs(); renderRoute(store.get('route', 'goa')); });

  /* ---------- Destinations ---------- */
  const grid = $('#destGrid');
  const filters = $('#destFilters');
  let destType = store.get('destType', 'all');
  function renderFilters() {
    filters.innerHTML = Object.entries(TYPES).map(([k, v]) => {
      const n = k === 'all' ? T.destinations.length : T.destinations.filter((d) => d.type === k).length;
      return `<button class="filter ${destType === k ? 'active' : ''}" data-type="${k}">${v.icon} ${esc(v.label)} <b>${n}</b></button>`;
    }).join('');
  }
  const bestOnly = $('#bestOnly'); bestOnly.checked = !!store.get('bestOnly', false);
  bestOnly.addEventListener('change', () => { store.set('bestOnly', bestOnly.checked); renderDests(); });
  const legFromGateway = (d) => { const AP = window.APP || {}; const gd = AP.gatewayDest && AP.gatewayDest(); return gd && window.GEO && gd.id !== d.id ? { gd, leg: window.GEO.leg(gd, d, state.style, state.people) } : null; };
  const nightPrice = (d) => M.styles[state.style].hotel * 2 * (d.priceIndex || 1);
  function renderDests(type = destType) {
    destType = type; renderFilters();
    const mr = (window.APP || {}).monthRating || (() => 2);
    const list = T.destinations.filter((d) => (type === 'all' || d.type === type) && (!bestOnly.checked || mr(d) === 3));
    grid.innerHTML = list.map((d, i) => { const lg = legFromGateway(d); return `
      <article class="dest" style="--i:${i}" data-id="${d.id}" tabindex="0" role="button" aria-label="Open ${esc(d.name)}">
        ${window.coverHTML(d, `<em class="type-pill">${TYPES[d.type].icon} ${esc(TYPES[d.type].label)}</em>`)}
        <div class="body">
          <h3>${esc(d.name)}</h3>
          <div class="tag">${esc(d.tag)}</div>
          <div class="month-line">${(window.APP || {}).monthBadge ? (window.APP || {}).monthBadge(d) : ''}<span>${(window.APP || {}).monthName ? (window.APP || {}).monthName() : ''}</span></div>
          <div class="meta">
            <span>${lg ? `${window.GEO.MODE_ICON[lg.leg.mode]} ${lg.leg.hours} h · ${fmtNum(lg.leg.cost)} ${t('desk.from')} ${esc(lg.gd.name)}` : '🛫 ' + esc(d.from)}</span>
            <span>🏥 ${esc(d.comfort.hospital.split('·')[0].trim())} · ${t('comfort.score')} ${d.comfort.score}/5</span>
            <span><b class="cost">${fmtNum(nightPrice(d))}</b>/night · ${M.styles[state.style].stars} · ${esc(d.nights)}</span>
          </div>
          <span class="more">Explore</span>
        </div>
      </article>`; }).join('');
    $('#destCount').textContent = list.length + ' ' + (list.length === 1 ? t('dest.place') : t('dest.places'));
  }
  filters.addEventListener('click', (e) => { const b = e.target.closest('.filter'); if (b) { renderDests(b.dataset.type); store.set('destType', b.dataset.type); } });
  renderDests();
  addEventListener('langchange', () => renderDests());
  addEventListener('settingschange', () => renderDests());
  const modal = $('#modal');
  function openDest(id) {
    const d = T.destinations.find((x) => x.id === id); if (!d) return;
    $('.sheet', modal).innerHTML = `
      <button class="close" aria-label="Close">✕</button>
      ${window.coverHTML(d)}
      <div class="content">
        <h3>${esc(d.name)}</h3>
        <div class="tag">${esc(d.tag)} · 🌡 ${esc(d.weather)}</div>
        <div class="live modal-live" data-wx="${d.id}"></div>
        ${(() => { const lg = legFromGateway(d); return `<div class="chip-row" style="margin-top:10px">${lg ? `<span class="chip warm">${window.GEO.MODE_ICON[lg.leg.mode]} ${esc(lg.leg.label)} · ${lg.leg.hours} h · ${fmtNum(lg.leg.cost)} pp ${t('desk.from')} ${esc(lg.gd.name)}</span>` : ''}<span class="chip">🛏 ${esc(d.nights)}</span>${(window.APP || {}).monthBadge ? (window.APP || {}).monthBadge(d) : ''}</div>`; })()}
        <div class="month-strip" title="${t('month.best')} / ${t('month.good')} / ${t('month.ok')} / ${t('month.avoid')}">${(d.months || []).map((r, i) => `<span class="r${r} ${(window.APP || {}).month && (window.APP || {}).month() === i + 1 ? 'cur' : ''}">${'JFMAMJJASOND'[i]}</span>`).join('')}</div>
        <div class="comfort-card">
          <h4>🛡️ ${t('comfort.title')} <span class="score">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= d.comfort.score ? 'on' : ''}"></i>`).join('')}</span></h4>
          <p><b>${t('comfort.hospital')}:</b> ${esc(d.comfort.hospital)}</p>
          <ul>${d.comfort.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul>
        </div>
        <p class="intro">${esc(d.intro)}</p>
        <div class="cols">
          <div>
            <h4>✨ Things to do</h4><ul>${d.todo.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <h4>🍛 ${t('guide.eat')}</h4>
            <p class="rating-summary"></p>
            <div class="picks">${(window.GUIDE?.eat[d.id] || []).length ? (window.GUIDE.eat[d.id]).map((p) => `
              <div class="pick-row rated" data-q="${esc(p.n + ' ' + (window.GUIDE.searchCity[d.id] || d.name))}">
                <span class="tier tier-eat">🍽️</span>
                <div><b>${esc(p.n)}</b><small>${esc(p.area)}</small><p>${esc(p.why)}</p>
                  <div class="pick-links"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(p.n + ' ' + (window.GUIDE.searchCity[d.id] || d.name))}">Google ↗</a><a target="_blank" rel="noopener" href="https://www.zomato.com/search?q=${encodeURIComponent(p.n)}">Zomato ↗</a></div>
                </div>
              </div>`).join('') : `<p class="picks-note">${t('guide.eatNone')}</p>`}</div>
            <h4 style="margin-top:14px">🥘 Dishes to try</h4><ul>${d.food.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
          </div>
          <div>
            <h4>🛏️ ${t('guide.picks')}</h4>
            <p class="picks-note">${t('guide.picksNote')}</p>
            <p class="rating-summary"></p>
            <div class="picks">${(window.GUIDE?.picks[d.id] || []).map((p) => `
              <div class="pick-row rated" data-q="${esc(p.n + ' ' + (window.GUIDE.searchCity[d.id] || d.name))}">
                <span class="tier tier-${p.tier}">${t('tier.' + p.tier)}</span>
                <div><b>${esc(p.n)}</b><small>${esc(p.area)}</small><p>${esc(p.why)}</p>
                  <div class="pick-links"><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(p.n + ' ' + (window.GUIDE.searchCity[d.id] || d.name))}">Google ↗</a><a target="_blank" rel="noopener" href="https://www.booking.com/searchresults.html?ss=${encodeURIComponent(p.n + ' ' + (window.GUIDE.searchCity[d.id] || d.name))}">Booking.com ↗</a></div>
                </div>
              </div>`).join('')}</div>
            <div class="chip-row" style="margin-top:12px">
              <a class="chip" target="_blank" rel="noopener" href="https://www.booking.com/searchresults.html?ss=${encodeURIComponent((window.GUIDE?.searchCity[d.id] || d.name) + ', India')}">${t('guide.allHotels')} ↗</a>
              <a class="chip warm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(d.name + ' India')}">${t('guide.maps')} ↗</a>
            </div>
            <h4 style="margin-top:20px">🧭 ${t('guide.around')}</h4>
            <p style="color:var(--ink-2);font-size:.93rem">${esc(d.area)}</p>
            <div class="ops">${(window.GUIDE?.ops[d.id] || []).map((o) => `
              <a class="op" target="_blank" rel="noopener" href="${esc(o.url)}"><span class="op-kind">${({ cab: '🚕', car: '🚗', bus: '🚌', boat: '⛵', train: '🚆', activity: '🎟️' })[o.kind] || '🔗'}</span><div><b>${esc(o.n)} ↗</b><small>${esc(o.why)}</small></div></a>`).join('')}</div>
          </div>
        </div>
      </div>`;
    modal.classList.add('open'); document.body.style.overflow = 'hidden';
    $('.close', modal).addEventListener('click', closeModal);
    dispatchEvent(new CustomEvent('destopened', { detail: d.id }));
    if (window.RATINGS) $$('.picks', modal).forEach((box) => window.RATINGS.apply(box.parentElement));
  }
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }
  grid.addEventListener('click', (e) => { const c = e.target.closest('.dest'); if (c) openDest(c.dataset.id); });
  grid.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { const c = e.target.closest('.dest'); if (c) { e.preventDefault(); openDest(c.dataset.id); } } });
  $('.backdrop', modal).addEventListener('click', closeModal);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Cost planner ---------- */
  const peopleEl = $('#people'), daysEl = $('#days');
  peopleEl.value = state.people; daysEl.value = state.days;
  function buildSeg(id, options, key) {
    const el = $(id);
    el.innerHTML = Object.entries(options).map(([k, v]) => `<button data-v="${k}" class="${state[key] === k ? 'active' : ''}">${esc(v.label || v)}</button>`).join('');
    el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state[key] = b.dataset.v; $$('button', el).forEach((x) => x.classList.toggle('active', x === b)); calc(); });
  }
  buildSeg('#styleSeg', M.styles, 'style');
  function renderRouteSeg() {
    const list = routesFor(); if (!list.some((r) => r.id === state.route)) state.route = list[0].id;
    buildSeg('#routeSeg', Object.fromEntries(list.map((r) => [r.id, `${r.emoji} ${r.name}`])), 'route');
  }
  renderRouteSeg();
  function setRoute(id) { state.route = id; $$('#routeSeg button').forEach((b) => b.classList.toggle('active', b.dataset.v === id)); calc(); }
  peopleEl.addEventListener('input', () => { state.people = +peopleEl.value; calc(); });
  daysEl.addEventListener('input', () => { state.days = +daysEl.value; calc(); });
  $('#currencyToggle').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state.showInr = b.dataset.c === 'INR'; syncInputs(); calc(); dispatchEvent(new CustomEvent('costchange')); });

  const animated = {};
  function animateNumber(el, target, render) {
    const from = animated[el.id] || 0; const start = performance.now(); const dur = 700;
    const step = (now) => { const p = Math.min(1, (now - start) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = render(from + (target - from) * e); if (p < 1) requestAnimationFrame(step); else animated[el.id] = target; };
    requestAnimationFrame(step);
  }
  function calc() {
    const s = M.styles[state.style], r = M.routes[state.route] || M.routes.goa;
    const nights = Math.max(1, state.days - 2);
    const parts = {
      'Europe ↔ India flights': s.intl,
      'Hotels (shared double)': s.hotel * nights,
      'Food & drinks': s.food * nights,
      'Domestic flights & cars': r.transport * (state.style === 'luxury' ? 1.4 : 1),
      'Local transport': s.local * nights,
      'Activities & entries': r.activities * s.actFactor,
      'Visa, insurance, SIM': M.fixed.visa + M.fixed.insurance + M.fixed.sim,
    };
    const sub = Object.values(parts).reduce((a, b) => a + b, 0);
    parts['Buffer (10 %)'] = sub * M.bufferPct;
    const total = sub * (1 + M.bufferPct);
    $('#peopleOut').textContent = state.people + (state.people === 1 ? ' traveller' : ' travellers');
    $('#daysOut').textContent = state.days + ' days · ' + nights + ' nights';
    animateNumber($('#perPerson'), total, fmtNum);
    animateNumber($('#groupTotal'), total * state.people, fmtNum);
    $('#perDay').textContent = fmtNum(total / state.days) + ' per person per day';
    const max = Math.max(...Object.values(parts));
    const bd = $('#breakdown');
    const html = Object.entries(parts).map(([k, v]) => `<div class="bar"><span>${esc(k)}</span><div class="track"><div class="fill" data-w="${(v / max) * 100}"></div></div><span class="amt">${fmtNum(v)}</span></div>`).join('');
    bd.innerHTML = html;
    requestAnimationFrame(() => $$('.fill', bd).forEach((f) => { f.style.width = f.dataset.w + '%'; }));
    $('#styleNote').textContent = s.desc;
    store.set('cost', state);
    dispatchEvent(new CustomEvent('costchange'));
  }
  function syncInputs() {
    peopleEl.value = state.people; daysEl.value = state.days;
    $$('#styleSeg button').forEach((b) => b.classList.toggle('active', b.dataset.v === state.style));
    renderRouteSeg();
    const home = $('#currencyToggle [data-c="home"]'); if (home) home.textContent = state.currency;
    $$('#currencyToggle button').forEach((x) => x.classList.toggle('active', (x.dataset.c === 'INR') === !!state.showInr));
  }
  addEventListener('ratechange', () => calc());
  calc();

  /* ---------- Safety ---------- */
  $('#safetyGrid').innerHTML = T.safety.map((s, i) => `
    <article class="safe reveal" data-delay="${(i % 3) + 1}">
      <div class="icon">${s.icon}</div>
      <h3>${esc(s.title)}</h3>
      <p>${esc(s.text)}</p>
      ${s.link ? `<a href="${esc(s.link.url)}" target="_blank" rel="noopener">${esc(s.link.label)} ↗</a>` : ''}
    </article>`).join('');

  // Checklist with persistence
  const checks = store.get('checks', {});
  const list = $('#checklist');
  const items = $$('input', list);
  let wasDone = false;
  const updateProgress = () => { const done = items.filter((i) => i.checked).length; $('#checkFill').style.width = (done / items.length) * 100 + '%'; $('#checkCount').textContent = done === items.length ? t('check.all') : `${done} / ${items.length} ${t('check.done')}`; if (done === items.length && !wasDone && items.some((i) => i.dataset.touched)) dispatchEvent(new CustomEvent('checklistdone')); wasDone = done === items.length; };
  items.forEach((i) => { i.checked = !!checks[i.value]; i.addEventListener('change', () => { i.dataset.touched = '1'; checks[i.value] = i.checked; store.set('checks', checks); updateProgress(); }); });
  updateProgress();

  /* ---------- Links ---------- */
  $('#linksGrid').innerHTML = T.links.map((g, i) => `
    <div class="link-group reveal" data-delay="${(i % 4) + 1}">
      <h3>${esc(g.group)}</h3>
      ${g.items.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener"><span>${esc(l.label)} ↗</span><small>${esc(l.note)}</small></a>`).join('')}
    </div>`).join('');

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.reveal').forEach((el) => io.observe(el));

  /* ---------- Hero counters ---------- */
  const heroStats = $$('.stat b[data-count]');
  const heroIo = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (!e.isIntersecting) return; heroIo.unobserve(e.target);
    const target = +e.target.dataset.count, suffix = e.target.dataset.suffix || '', start = performance.now();
    const step = (now) => { const p = Math.min(1, (now - start) / 1400); const v = Math.round(target * (1 - Math.pow(1 - p, 3))); e.target.textContent = v.toLocaleString('en-GB') + suffix; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .5 });
  heroStats.forEach((el) => heroIo.observe(el));

  $('#year').textContent = new Date().getFullYear();
  $('#rate').textContent = T.eurToInr;

  window.APP = { $, $$, esc, store, t, LANG, applyLang, TYPES, openDest, closeModal, setRoute, renderRoute, renderTabs, renderDests, calc, syncInputs, state, M, fmtNum, routesFor };
  if (LANG.cur === 'de') applyLang();
})();
