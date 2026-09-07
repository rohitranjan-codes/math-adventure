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
      <p>${esc(w.note)}</p>
      <span class="badge ${w.rating}">${w.rating === 'great' ? 'Perfect' : w.rating === 'good' ? 'Good' : 'Skip in Nov'}</span>
    </div>`).join('');

  /* ---------- Flights ---------- */
  $('#flightGrid').innerHTML = T.flights.map((f, i) => `
    <article class="card reveal" data-delay="${i + 1}">
      <div class="route-line"><span>${esc(f.from.split(' (')[0])}</span><span class="arrow"></span><span>BLR</span></div>
      <div class="chip-row"><span class="chip warm">${esc(f.type)}</span><span class="chip">${esc(f.duration)}</span></div>
      <small>${esc(f.airlines)}</small>
      <div class="price">${esc(f.price)}</div>
      <div class="tip">💡 ${esc(f.tip)}</div>
    </article>`).join('');
  $('#domesticBody').innerHTML = T.domestic.map((d) => `
    <tr><td><b>${esc(d.route)}</b><span class="note">${esc(d.note)}</span></td><td>${esc(d.time)}</td><td><b>${esc(d.price)}</b></td><td>${esc(d.carriers)}</td></tr>`).join('');

  /* ---------- Routes / itinerary ---------- */
  const tabs = $('#routeTabs'), panel = $('#routePanel');
  tabs.innerHTML = T.routes.map((r) => `
    <button class="tab" data-id="${r.id}"><span class="emoji">${r.emoji}</span><span>${esc(r.name)}<small>${r.days} days · ${esc(r.subtitle)}</small></span></button>`).join('');
  function renderRoute(id) {
    const r = T.routes.find((x) => x.id === id) || T.routes[0];
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
  renderRoute(store.get('route', 'goa'));

  /* ---------- Destinations ---------- */
  const grid = $('#destGrid');
  grid.innerHTML = T.destinations.map((d, i) => `
    <article class="dest reveal" data-delay="${(i % 4) + 1}" data-id="${d.id}" tabindex="0" role="button" aria-label="Open ${esc(d.name)}">
      <div class="cover" style="background:${d.hue}"><span>${d.emoji}</span></div>
      <div class="body">
        <h3>${esc(d.name)}</h3>
        <div class="tag">${esc(d.tag)}</div>
        <div class="meta"><span>🌡 ${esc(d.weather)}</span><span class="cost">${esc(d.perDay)}/day</span></div>
        <span class="more">Explore</span>
      </div>
    </article>`).join('');
  const modal = $('#modal');
  function openDest(id) {
    const d = T.destinations.find((x) => x.id === id); if (!d) return;
    $('.sheet', modal).innerHTML = `
      <button class="close" aria-label="Close">✕</button>
      <div class="cover" style="background:${d.hue}"><span>${d.emoji}</span></div>
      <div class="content">
        <h3>${esc(d.name)}</h3>
        <div class="tag">${esc(d.tag)} · 🌡 ${esc(d.weather)}</div>
        <p class="intro">${esc(d.intro)}</p>
        <div class="cols">
          <div>
            <h4>✨ Things to do</h4><ul>${d.todo.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
            <h4>🍛 Eat & drink</h4><ul>${d.food.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          </div>
          <div>
            <h4>🛏️ Where to stay</h4>
            <div class="stay-tier"><b>Budget</b><span>${esc(d.stay.budget)}</span></div>
            <div class="stay-tier"><b>Comfort</b><span>${esc(d.stay.mid)}</span></div>
            <div class="stay-tier"><b>Luxury</b><span>${esc(d.stay.lux)}</span></div>
            <h4 style="margin-top:18px">🧭 Getting there & around</h4>
            <p style="color:var(--ink-2);font-size:.93rem">${esc(d.area)}</p>
            <div class="chip-row" style="margin-top:16px">
              <a class="chip" target="_blank" rel="noopener" href="https://www.booking.com/searchresults.html?ss=${encodeURIComponent(d.name + ', India')}">Hotels on Booking.com ↗</a>
              <a class="chip warm" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(d.name + ' India')}">Open in Maps ↗</a>
            </div>
          </div>
        </div>
      </div>`;
    modal.classList.add('open'); document.body.style.overflow = 'hidden';
    $('.close', modal).addEventListener('click', closeModal);
  }
  function closeModal() { modal.classList.remove('open'); document.body.style.overflow = ''; }
  grid.addEventListener('click', (e) => { const c = e.target.closest('.dest'); if (c) openDest(c.dataset.id); });
  grid.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { const c = e.target.closest('.dest'); if (c) { e.preventDefault(); openDest(c.dataset.id); } } });
  $('.backdrop', modal).addEventListener('click', closeModal);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------- Cost planner ---------- */
  const M = T.costModel;
  const state = Object.assign({ people: 4, days: 10, style: 'comfort', origin: 'fra', route: 'goa', currency: 'EUR' }, store.get('cost', {}));
  const peopleEl = $('#people'), daysEl = $('#days');
  peopleEl.value = state.people; daysEl.value = state.days;
  function buildSeg(id, options, key) {
    const el = $(id);
    el.innerHTML = Object.entries(options).map(([k, v]) => `<button data-v="${k}" class="${state[key] === k ? 'active' : ''}">${esc(v.label || v)}</button>`).join('');
    el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state[key] = b.dataset.v; $$('button', el).forEach((x) => x.classList.toggle('active', x === b)); calc(); });
  }
  buildSeg('#styleSeg', M.styles, 'style');
  buildSeg('#originSeg', M.origins, 'origin');
  buildSeg('#routeSeg', Object.fromEntries(T.routes.map((r) => [r.id, `${r.emoji} ${r.name}`])), 'route');
  function setRoute(id) { state.route = id; $$('#routeSeg button').forEach((b) => b.classList.toggle('active', b.dataset.v === id)); calc(); }
  peopleEl.addEventListener('input', () => { state.people = +peopleEl.value; calc(); });
  daysEl.addEventListener('input', () => { state.days = +daysEl.value; calc(); });
  $('#currencyToggle').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; state.currency = b.dataset.c; $$('#currencyToggle button').forEach((x) => x.classList.toggle('active', x === b)); calc(); });
  $$('#currencyToggle button').forEach((x) => x.classList.toggle('active', x.dataset.c === state.currency));

  const fmt = (eur) => {
    const v = state.currency === 'INR' ? eur * T.eurToInr : eur;
    return state.currency === 'INR' ? '₹' + Math.round(v / 100) * 100 .toLocaleString('en-IN') : '€' + Math.round(v).toLocaleString('en-GB');
  };
  const fmtNum = (eur) => state.currency === 'INR' ? '₹' + (Math.round(eur * T.eurToInr / 100) * 100).toLocaleString('en-IN') : '€' + Math.round(eur).toLocaleString('en-GB');
  const animated = {};
  function animateNumber(el, target, render) {
    const from = animated[el.id] || 0; const start = performance.now(); const dur = 700;
    const step = (now) => { const p = Math.min(1, (now - start) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = render(from + (target - from) * e); if (p < 1) requestAnimationFrame(step); else animated[el.id] = target; };
    requestAnimationFrame(step);
  }
  function calc() {
    const s = M.styles[state.style], o = M.origins[state.origin], r = M.routes[state.route];
    const nights = Math.max(1, state.days - 2);
    const parts = {
      'Europe ↔ India flights': s.intl + o.adj,
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
    $('#styleNote').textContent = ({ budget: 'Hostels & homestays, trains and local buses, street food and thalis.', comfort: '3–4★ hotels and boutique stays, domestic flights, private car in the hills, good restaurants.', luxury: 'Business-class flights, 5★ heritage hotels and resorts, private drivers everywhere.' })[state.style];
    store.set('cost', state);
  }
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
  const updateProgress = () => { const done = items.filter((i) => i.checked).length; $('#checkFill').style.width = (done / items.length) * 100 + '%'; $('#checkCount').textContent = `${done} / ${items.length} done`; };
  items.forEach((i) => { i.checked = !!checks[i.value]; i.addEventListener('change', () => { checks[i.value] = i.checked; store.set('checks', checks); updateProgress(); }); });
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
})();
