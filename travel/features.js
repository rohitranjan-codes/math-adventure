/* ------------------------------------------------------------------
   Engagement features: language, stamps, quiz, map, food, trip
   builder, dates/festivals/packing, live rate, confetti, print.
   Depends on window.APP (app.js), TRIP (data.js), CONTENT (content.js).
   ------------------------------------------------------------------ */
(function () {
  const A = window.APP, T = window.TRIP, C = window.CONTENT;
  const { $, $$, esc, store, t } = A;
  const byId = (id) => T.destinations.find((d) => d.id === id);
  const on = (name, fn) => addEventListener(name, fn);
  const emit = (name, detail) => dispatchEvent(new CustomEvent(name, { detail }));

  /* ---------- Language toggle ---------- */
  const langBtn = $('#langBtn');
  const paintLang = () => { langBtn.textContent = A.LANG.cur === 'de' ? 'EN' : 'DE'; langBtn.title = A.LANG.cur === 'de' ? 'Switch to English' : 'Auf Deutsch umschalten'; };
  langBtn.addEventListener('click', () => { A.LANG.cur = A.LANG.cur === 'de' ? 'en' : 'de'; store.set('lang', A.LANG.cur); A.applyLang(); paintLang(); });
  paintLang();

  /* ---------- Confetti ---------- */
  function confetti(count = 160) {
    const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
    const ctx = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cols = ['#e8590c', '#d4a017', '#0f766e', '#f43f5e', '#6366f1', '#22c55e'];
    const ps = Array.from({ length: count }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * .5, r: 4 + Math.random() * 6, vx: (Math.random() - .5) * 3, vy: 2 + Math.random() * 4, rot: Math.random() * 6, vr: (Math.random() - .5) * .3, col: cols[Math.floor(Math.random() * cols.length)] }));
    let frames = 0;
    (function tick() {
      ctx.clearRect(0, 0, c.width, c.height);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vy += .03; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col; ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * .6); ctx.restore(); });
      if (++frames < 260) requestAnimationFrame(tick); else c.remove();
    })();
  }
  on('checklistdone', () => confetti());

  /* ---------- Passport stamps ---------- */
  const stamps = new Set(store.get('stamps', []));
  const stampCount = $('#stampCount'), passport = $('#passport');
  function renderStamps() {
    stampCount.textContent = `${stamps.size}/${T.destinations.length}`;
    passport.innerHTML = `<div class="passport-head"><b>🛂 ${esc(A.LANG.cur === 'de' ? C.de['stamps.title'] : 'Your passport')}</b><span>${stamps.size} ${t('stamps.of')} ${T.destinations.length} · ${esc(A.LANG.cur === 'de' ? C.de['stamps.sub'] : 'Every destination you open earns a stamp.')}</span></div>
      <div class="stamp-row">${T.destinations.map((d) => `<button class="stamp-mini ${stamps.has(d.id) ? 'got' : ''}" data-id="${d.id}" title="${esc(d.name)}" style="--c:${(d.hue.match(/#[0-9a-f]{6}/i) || ['#e8590c'])[0]}">${stamps.has(d.id) ? d.emoji : ''}</button>`).join('')}</div>`;
  }
  passport.addEventListener('click', (e) => { const b = e.target.closest('.stamp-mini'); if (b) A.openDest(b.dataset.id); });
  $('#stampsBtn').addEventListener('click', () => $('#destinations').scrollIntoView({ behavior: 'smooth' }));
  on('destopened', (e) => {
    const id = e.detail, fresh = !stamps.has(id);
    stamps.add(id); store.set('stamps', [...stamps]); renderStamps();
    const cover = $('#modal .sheet .cover'); if (!cover) return;
    const d = byId(id);
    const el = document.createElement('div'); el.className = 'stamp' + (fresh ? ' slam' : '');
    el.innerHTML = `<span>${t('stamps.stamped')}</span><b>${esc(d.name.toUpperCase())}</b><small>NOV 2026 · BLR</small>`;
    cover.appendChild(el);
    if (fresh && stamps.size === T.destinations.length) confetti(240);
  });
  renderStamps();

  /* ---------- Quiz ---------- */
  const quizBox = $('#quizBox');
  let qi = 0, scores = {};
  function quizIntro() {
    qi = 0; scores = {};
    quizBox.innerHTML = `<div class="quiz-intro"><div class="quiz-emoji">🧭</div><h3>${A.LANG.cur === 'de' ? 'Welche Reise passt zu euch?' : 'Which trip is you?'}</h3><p>${A.LANG.cur === 'de' ? 'Fünf Fragen. Keine falschen Antworten.' : 'Five questions. No wrong answers.'}</p><button class="btn btn-primary" id="quizStart">${t('quiz.start')} →</button></div>`;
    $('#quizStart').addEventListener('click', quizQuestion);
  }
  function quizQuestion() {
    const q = C.quiz.questions[qi];
    quizBox.innerHTML = `<div class="quiz-q">
      <div class="quiz-progress"><span>${t('quiz.next')} ${qi + 1} ${t('quiz.of')} ${C.quiz.questions.length}</span><div class="track"><div class="fill" style="width:${(qi / C.quiz.questions.length) * 100}%"></div></div></div>
      <h3>${esc(q.q)}</h3>
      <div class="quiz-answers">${q.a.map((a, i) => `<button class="quiz-a" data-i="${i}" style="--i:${i}">${esc(a.t)}</button>`).join('')}</div></div>`;
    $$('.quiz-a', quizBox).forEach((b) => b.addEventListener('click', () => {
      Object.entries(q.a[+b.dataset.i].s).forEach(([k, v]) => { scores[k] = (scores[k] || 0) + v; });
      qi++; if (qi < C.quiz.questions.length) quizQuestion(); else quizResult();
    }));
  }
  function quizResult() {
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    const r = C.quiz.results[top], route = T.routes.find((x) => x.id === r.route);
    const share = encodeURIComponent(`${r.title}! ${r.text} Our route: ${route.name}. Take the quiz: ${location.origin}${location.pathname}#quiz`);
    quizBox.innerHTML = `<div class="quiz-result">
      <div class="quiz-emoji">${route.emoji}</div>
      <span class="badge" style="background:${route.accent}22;color:${route.accent}">${esc(A.LANG.cur === 'de' ? 'Euer Ergebnis' : 'Your result')}</span>
      <h3>${esc(r.title)}</h3><p>${esc(r.text)}</p>
      <div class="quiz-picks"><b>${t('quiz.picks')}</b><div>${r.picks.map((id) => { const d = byId(id); return `<button class="pick" data-id="${id}">${d.emoji} ${esc(d.name)}</button>`; }).join('')}</div></div>
      <div class="quiz-actions"><button class="btn btn-primary" id="quizRoute">${t('quiz.route')}: ${esc(route.name)} →</button><a class="btn btn-ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${share}">💬 ${t('quiz.share')}</a><button class="btn btn-ghost" id="quizAgain">↻ ${t('quiz.again')}</button></div></div>`;
    confetti(90);
    $('#quizRoute').addEventListener('click', () => { A.renderRoute(route.id); A.setRoute(route.id); $('#routes').scrollIntoView({ behavior: 'smooth' }); });
    $('#quizAgain').addEventListener('click', quizIntro);
    $$('.pick', quizBox).forEach((b) => b.addEventListener('click', () => A.openDest(b.dataset.id)));
  }
  quizIntro();

  /* ---------- Map ---------- */
  const TYPE_COLORS = { beach: '#0ea5e9', hills: '#10b981', culture: '#f59e0b', wildlife: '#65a30d', city: '#8b5cf6', far: '#ef4444' };
  const mapEl = $('#mapEl');
  if (window.L && mapEl) {
    const map = L.map(mapEl, { scrollWheelZoom: false, zoomControl: true });
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>', maxZoom: 18 }).addTo(map);
    const blr = byId('bengaluru');
    const lines = {};
    T.destinations.forEach((d) => {
      if (d.id !== 'bengaluru') lines[d.id] = L.polyline([[blr.lat, blr.lng], [d.lat, d.lng]], { color: TYPE_COLORS[d.type], weight: 1.5, opacity: .35, dashArray: '4 6' }).addTo(map);
      const icon = L.divIcon({ className: 'pin-wrap', html: `<div class="pin ${d.id === 'bengaluru' ? 'hub' : ''}" style="--c:${TYPE_COLORS[d.type]}">${d.emoji}</div>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -18] });
      const m = L.marker([d.lat, d.lng], { icon }).addTo(map);
      m.bindPopup(() => `<div class="pop"><b>${d.emoji} ${esc(d.name)}</b><span>${esc(d.tag)}</span><div class="pop-meta">🛫 ${esc(d.from)}<br>💶 ${esc(d.perDay)}/day · 🛏 ${esc(d.nights)}</div><div class="pop-actions"><button data-open="${d.id}">${t('map.explore')}</button><button data-add="${d.id}" class="alt">+ ${t('map.add')}</button></div></div>`, { closeButton: false });
      m.on('mouseover', () => { if (lines[d.id]) lines[d.id].setStyle({ weight: 3, opacity: .9, dashArray: null }); });
      m.on('mouseout', () => { if (lines[d.id]) lines[d.id].setStyle({ weight: 1.5, opacity: .35, dashArray: '4 6' }); });
    });
    map.fitBounds([[7.5, 71], [31, 93.5]], { padding: [10, 10] });
    map.on('popupopen', (e) => {
      const el = e.popup.getElement();
      el.querySelector('[data-open]')?.addEventListener('click', (ev) => A.openDest(ev.target.dataset.open));
      el.querySelector('[data-add]')?.addEventListener('click', (ev) => { addStop(ev.target.dataset.add); map.closePopup(); $('#builder').scrollIntoView({ behavior: 'smooth' }); });
    });
    let tileWarned = false;
    map.on('tileerror', () => { if (!tileWarned) { tileWarned = true; $('#mapNote').textContent = t('map.fail'); } });
    $('#mapLegend').innerHTML = Object.entries(TYPE_COLORS).map(([k, c]) => `<span><i style="background:${c}"></i>${esc(A.TYPES[k].label)}</span>`).join('');
    new IntersectionObserver((es) => es.forEach((x) => x.isIntersecting && map.invalidateSize()), { threshold: .1 }).observe(mapEl);
  } else if (mapEl) { mapEl.innerHTML = `<p class="tip">${t('map.fail')}</p>`; }

  /* ---------- Food gallery ---------- */
  $('#foodGrid').innerHTML = C.food.map((f, i) => `
    <article class="dish" style="--i:${i}">
      <div class="dish-emoji">${f.emoji}</div>
      <div class="dish-body">
        <div class="dish-top"><h3>${esc(f.name)}</h3><span class="dish-price">${esc(f.price)}</span></div>
        <div class="dish-meta"><span>📍 ${esc(f.region)}</span><span>${f.veg ? '🟢 veg' : '🔴 non-veg'}</span><span title="spice level">${'🌶️'.repeat(f.spice) || '🧊 mild'}</span></div>
        <p>${esc(f.text)}</p>
      </div>
    </article>`).join('');

  /* ---------- Trip builder ---------- */
  const PRESETS = {
    goa: [['bengaluru', 2], ['goa', 5], ['bengaluru', 1]],
    kerala: [['bengaluru', 2], ['munnar', 3], ['thekkady', 1], ['kochi', 2], ['bengaluru', 1]],
    heritage: [['bengaluru', 2], ['mysuru', 2], ['coorg', 2], ['hampi', 2], ['bengaluru', 1]],
  };
  let plan = [];
  const parseHash = () => { const m = location.hash.match(/plan=([a-z0-9.\-]+)/i); if (!m) return null; const p = m[1].split('-').map((s) => s.split('.')).filter(([id, n]) => byId(id) && +n >= 0).map(([id, n]) => ({ id, nights: +n })); const pp = location.hash.match(/p=(\d+)/), st = location.hash.match(/s=(\w+)/); if (pp) A.state.people = Math.min(12, Math.max(1, +pp[1])); if (st && A.M.styles[st[1]]) A.state.style = st[1]; return p; };
  plan = parseHash() || store.get('plan', null) || PRESETS.goa.map(([id, nights]) => ({ id, nights }));
  const planUrl = () => `${location.origin}${location.pathname}#plan=${plan.map((s) => `${s.id}.${s.nights}`).join('-')}&p=${A.state.people}&s=${A.state.style}`;
  const perDay = (d) => { const [lo, hi] = (d.perDay.match(/\d+/g) || [40, 100]).map(Number); return { budget: lo, comfort: (lo + hi) / 2, luxury: hi * 1.3 }[A.state.style]; };
  function planCost() {
    const s = A.M.styles[A.state.style], o = A.M.origins[A.state.origin];
    const factor = { budget: .8, comfort: 1, luxury: 1.6 }[A.state.style];
    const stay = plan.reduce((a, st) => a + st.nights * perDay(byId(st.id)), 0);
    const transfers = plan.reduce((a, st) => a + byId(st.id).transfer * factor, 0);
    const fixed = A.M.fixed.visa + A.M.fixed.insurance + A.M.fixed.sim;
    return (s.intl + o.adj + stay + transfers + fixed) * (1 + A.M.bufferPct);
  }
  const nights = () => plan.reduce((a, s) => a + s.nights, 0);
  const hours = () => plan.reduce((a, s) => a + byId(s.id).hours, 0);
  function tripDates(i) {
    const d0 = $('#tripDate').value; if (!d0) return '';
    let start = new Date(d0 + 'T00:00:00'); start.setDate(start.getDate() + 1);
    for (let k = 0; k < i; k++) start.setDate(start.getDate() + plan[k].nights);
    const end = new Date(start); end.setDate(end.getDate() + plan[i].nights);
    const f = (d) => d.toLocaleDateString(A.LANG.cur === 'de' ? 'de-DE' : 'en-GB', { day: 'numeric', month: 'short' });
    return `${f(start)} → ${f(end)}`;
  }
  function savePlan() { store.set('plan', plan); history.replaceState(null, '', planUrl()); emit('planchange', plan); }
  function addStop(id, n) { const d = byId(id); plan.push({ id, nights: n ?? (parseInt(d.nights) || 2) }); renderBuilder(); savePlan(); }
  function renderPool(type = poolType) {
    poolType = type;
    $$('.filter', $('#poolFilters')).forEach((b) => b.classList.toggle('active', b.dataset.type === type));
    $('#builderPool').innerHTML = T.destinations.filter((d) => type === 'all' || d.type === type).map((d) => `<button class="pool-chip" draggable="true" data-id="${d.id}" style="--c:${TYPE_COLORS[d.type]}"><span>${d.emoji}</span><b>${esc(d.name)}</b><small>${esc(d.from)}</small></button>`).join('');
  }
  let poolType = 'all';
  $('#poolFilters').innerHTML = ['all', ...Object.keys(TYPE_COLORS)].map((k) => `<button class="filter small" data-type="${k}">${k === 'all' ? '🧭' : A.TYPES[k].icon}</button>`).join('');
  $('#poolFilters').addEventListener('click', (e) => { const b = e.target.closest('.filter'); if (b) renderPool(b.dataset.type); });
  $('#builderPool').addEventListener('click', (e) => { const b = e.target.closest('.pool-chip'); if (b) { addStop(b.dataset.id); b.classList.add('added'); setTimeout(() => b.classList.remove('added'), 500); } });
  $('#builderPool').addEventListener('dragstart', (e) => { const b = e.target.closest('.pool-chip'); if (b) { e.dataTransfer.setData('text/plain', 'add:' + b.dataset.id); e.dataTransfer.effectAllowed = 'copy'; } });
  $('#builderPresets').innerHTML = T.routes.map((r) => `<button class="tab small" data-preset="${r.id}">${r.emoji} ${esc(r.name)}</button>`).join('');
  $('#builderPresets').addEventListener('click', (e) => { const b = e.target.closest('[data-preset]'); if (b) { plan = PRESETS[b.dataset.preset].map(([id, nights]) => ({ id, nights })); renderBuilder(); savePlan(); } });

  const timeline = $('#builderTimeline');
  function renderBuilder() {
    if (!plan.length) timeline.innerHTML = `<div class="drop-empty">${t('builder.empty')}</div>`;
    else timeline.innerHTML = plan.map((s, i) => { const d = byId(s.id); return `
      <div class="stop" draggable="true" data-i="${i}" style="--i:${i};--c:${TYPE_COLORS[d.type]}">
        <div class="stop-cover">${window.sceneSVG(d.id, d.type, d.hue)}<span>${d.emoji}</span></div>
        <div class="stop-body">
          <div class="stop-title"><b>${esc(d.name)}</b><small>${esc(d.from)}${tripDates(i) ? ' · 📅 ' + tripDates(i) : ''}</small></div>
          <div class="stop-cost">≈ €${Math.round(s.nights * perDay(d))} ${t('builder.perPerson')}</div>
        </div>
        <div class="stop-nights"><button data-act="minus" aria-label="fewer nights">−</button><b>${s.nights}</b><span>${t('builder.nights')}</span><button data-act="plus" aria-label="more nights">+</button></div>
        <div class="stop-tools"><button data-act="up" ${i === 0 ? 'disabled' : ''}>↑</button><button data-act="down" ${i === plan.length - 1 ? 'disabled' : ''}>↓</button><button data-act="remove" class="danger">✕</button></div>
      </div>`; }).join('') + `<div class="drop-target">＋ ${t('builder.pool')}</div>`;
    renderSummary();
  }
  function renderSummary() {
    const total = planCost(), days = nights() + 2;
    const stops = plan.filter((s) => s.id !== 'bengaluru').length;
    $('#builderSummary').innerHTML = `
      <div class="sum-grid">
        <div><b>${days}</b><span>${t('builder.days')}</span></div>
        <div><b>${nights()}</b><span>${t('builder.nights')}</span></div>
        <div><b>${stops}</b><span>${t('builder.stops')}</span></div>
        <div><b>${Math.round(hours())}</b><span>${t('builder.travel')}</span></div>
      </div>
      <div class="sum-cost"><div><span class="label">${t('builder.perPerson')}</span><b>${plan.length ? A.fmtNum(total) : '—'}</b></div><div><span class="label">${t('builder.group')} · ${A.state.people}</span><b>${plan.length ? A.fmtNum(total * A.state.people) : '—'}</b></div></div>
      <div class="sum-controls">
        <div class="seg small" id="bStyle">${Object.entries(A.M.styles).map(([k, v]) => `<button data-v="${k}" class="${A.state.style === k ? 'active' : ''}">${esc(v.label)}</button>`).join('')}</div>
        <div class="people-ctl"><button data-p="-1">−</button><b>${A.state.people} 👤</b><button data-p="1">+</button></div>
      </div>
      <div class="route-string">${plan.map((s) => `${byId(s.id).emoji} ${esc(byId(s.id).name)} <small>${s.nights}n</small>`).join(' <i>→</i> ')}</div>`;
    $('#bStyle').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; A.state.style = b.dataset.v; A.syncInputs(); A.calc(); renderBuilder(); savePlan(); });
    $('.people-ctl', $('#builderSummary')).addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; A.state.people = Math.min(12, Math.max(1, A.state.people + +b.dataset.p)); A.syncInputs(); A.calc(); renderSummary(); savePlan(); });
  }
  timeline.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    const i = +b.closest('.stop').dataset.i, act = b.dataset.act;
    if (act === 'minus') plan[i].nights = Math.max(0, plan[i].nights - 1);
    if (act === 'plus') plan[i].nights = Math.min(14, plan[i].nights + 1);
    if (act === 'remove') plan.splice(i, 1);
    if (act === 'up' && i > 0) [plan[i - 1], plan[i]] = [plan[i], plan[i - 1]];
    if (act === 'down' && i < plan.length - 1) [plan[i + 1], plan[i]] = [plan[i], plan[i + 1]];
    renderBuilder(); savePlan();
  });
  // drag & drop: reorder stops or drop new destinations from the pool / map
  let dragIdx = null;
  timeline.addEventListener('dragstart', (e) => { const s = e.target.closest('.stop'); if (s) { dragIdx = +s.dataset.i; e.dataTransfer.setData('text/plain', 'move:' + dragIdx); e.dataTransfer.effectAllowed = 'move'; s.classList.add('dragging'); } });
  timeline.addEventListener('dragend', (e) => { e.target.closest?.('.stop')?.classList.remove('dragging'); $$('.stop.over', timeline).forEach((x) => x.classList.remove('over')); });
  timeline.addEventListener('dragover', (e) => { e.preventDefault(); const s = e.target.closest('.stop'); $$('.stop.over', timeline).forEach((x) => x.classList.remove('over')); if (s) s.classList.add('over'); timeline.classList.add('drag-over'); });
  timeline.addEventListener('dragleave', (e) => { if (!timeline.contains(e.relatedTarget)) timeline.classList.remove('drag-over'); });
  timeline.addEventListener('drop', (e) => {
    e.preventDefault(); timeline.classList.remove('drag-over');
    const data = e.dataTransfer.getData('text/plain'); const target = e.target.closest('.stop'); const to = target ? +target.dataset.i : plan.length;
    if (data.startsWith('add:')) { const d = byId(data.slice(4)); plan.splice(to, 0, { id: d.id, nights: parseInt(d.nights) || 2 }); }
    else if (data.startsWith('move:')) { const from = +data.slice(5); const [item] = plan.splice(from, 1); plan.splice(to > from ? to - 1 : to, 0, item); }
    renderBuilder(); savePlan();
  });
  $('#clearPlan').addEventListener('click', () => { plan = [{ id: 'bengaluru', nights: 2 }]; renderBuilder(); savePlan(); });
  const shareText = () => `${A.LANG.cur === 'de' ? 'Unser Indien-Plan' : 'Our India plan'} (${nights() + 2} ${t('builder.days')}): ${plan.map((s) => `${byId(s.id).name} ${s.nights}n`).join(' → ')} · ≈ ${A.fmtNum(planCost())} ${t('builder.perPerson')}. ${planUrl()}`;
  $('#shareWa').addEventListener('click', () => open('https://wa.me/?text=' + encodeURIComponent(shareText()), '_blank', 'noopener'));
  $('#copyLink').addEventListener('click', async (e) => { try { await navigator.clipboard.writeText(planUrl()); } catch { prompt('Copy this link', planUrl()); } const b = e.currentTarget, old = b.textContent; b.textContent = '✓ ' + t('builder.copied'); setTimeout(() => { b.textContent = old; }, 1600); });
  $('#printPlan').addEventListener('click', () => {
    const d0 = $('#tripDate').value;
    $('#printArea').innerHTML = `<h1>🛫 Europe → South India · ${nights() + 2} ${t('builder.days')}</h1><p>${d0 ? 'Departure ' + d0 + ' · ' : ''}${A.state.people} ${A.LANG.cur === 'de' ? 'Reisende' : 'travellers'} · ${A.M.styles[A.state.style].label} · ≈ ${A.fmtNum(planCost())} ${t('builder.perPerson')}</p>
      <table><thead><tr><th>#</th><th>Stop</th><th>Nights</th><th>Dates</th><th>Getting there</th><th>Highlights</th></tr></thead><tbody>${plan.map((s, i) => { const d = byId(s.id); return `<tr><td>${i + 1}</td><td><b>${esc(d.name)}</b><br><small>${esc(d.tag)}</small></td><td>${s.nights}</td><td>${tripDates(i)}</td><td>${esc(d.from)}</td><td>${d.todo.slice(0, 3).map(esc).join(' · ')}</td></tr>`; }).join('')}</tbody></table>
      <h2>Packing list</h2><ul>${packingItems().map((x) => `<li>☐ ${esc(x)}</li>`).join('')}</ul>
      <p class="fine">${location.href}</p>`;
    print();
  });
  renderPool('all'); renderBuilder();
  on('costchange', renderSummary);
  window.addStop = addStop;

  /* ---------- Dates: countdown, festivals, packing ---------- */
  const dateEl = $('#tripDate');
  dateEl.value = store.get('tripDate', '2026-11-07');
  dateEl.addEventListener('change', () => { store.set('tripDate', dateEl.value); renderDates(); renderBuilder(); });
  function packingItems() {
    const types = new Set(plan.map((s) => byId(s.id).type)), ids = new Set(plan.map((s) => s.id));
    const out = [...C.packing.base];
    Object.entries(C.packing).forEach(([k, items]) => { if (k !== 'base' && (types.has(k) || ids.has(k))) out.push(...items); });
    return [...new Set(out)];
  }
  function renderDates() {
    const d0 = dateEl.value ? new Date(dateEl.value + 'T00:00:00') : null;
    const cd = $('#countdown');
    if (!d0) { cd.innerHTML = ''; } else {
      const diff = Math.ceil((d0 - new Date().setHours(0, 0, 0, 0)) / 86400000);
      cd.innerHTML = diff > 0 ? `<b>${diff}</b><span>${t('dates.days')}</span>` : `<b>✈️</b><span>${diff === 0 ? t('dates.today') : t('dates.gone')}</span>`;
    }
    const days = nights() + 2, end = d0 ? new Date(d0.getTime() + days * 86400000) : null;
    const list = C.festivals.filter((f) => { if (!d0) return true; const fd = new Date(f.date + 'T00:00:00'); return fd >= d0 && fd <= end; });
    $('#festivalList').innerHTML = list.length ? list.map((f) => { const fd = new Date(f.date + 'T00:00:00'); return `<div class="fest"><div class="fest-date"><b>${fd.getDate()}</b><span>${fd.toLocaleDateString(A.LANG.cur === 'de' ? 'de-DE' : 'en-GB', { month: 'short' })}</span></div><div><b>${esc(f.name)}${f.approx ? ` <em>(${t('dates.approx')})</em>` : ''}</b><small>📍 ${esc(f.where)}</small><p>${esc(f.text)}</p></div></div>`; }).join('') : `<p class="tip">${t('dates.none')}</p>`;
    const packed = new Set(store.get('packed', []));
    $('#packingList').innerHTML = packingItems().map((x) => `<label class="pack"><input type="checkbox" value="${esc(x)}" ${packed.has(x) ? 'checked' : ''}><span>${esc(x)}</span></label>`).join('');
  }
  $('#packingList').addEventListener('change', (e) => { const packed = new Set(store.get('packed', [])); e.target.checked ? packed.add(e.target.value) : packed.delete(e.target.value); store.set('packed', [...packed]); if ($$('input', $('#packingList')).every((i) => i.checked)) confetti(120); });
  renderDates();
  on('planchange', renderDates);

  /* ---------- Live exchange rate ---------- */
  const rateLabel = $('#rateLabel');
  rateLabel.textContent = t('rate.fixed');
  fetch('https://api.frankfurter.app/latest?from=EUR&to=INR', { cache: 'no-store' }).then((r) => r.json()).then((j) => {
    const v = j && j.rates && j.rates.INR; if (!v) return;
    T.eurToInr = Math.round(v * 10) / 10; $('#rate').textContent = T.eurToInr; rateLabel.textContent = `${t('rate.live')} · ${j.date}`; A.calc(); renderSummary();
  }).catch(() => {});

  /* ---------- Language change: re-render dynamic bits ---------- */
  on('langchange', () => { paintLang(); renderStamps(); quizIntro(); renderPool(); renderBuilder(); renderDates(); rateLabel.textContent = rateLabel.textContent.includes('·') ? rateLabel.textContent.replace(/^[^·]+/, t('rate.live') + ' ') : t('rate.fixed'); if ($('#mapLegend')) $('#mapLegend').innerHTML = Object.entries(TYPE_COLORS).map(([k, c]) => `<span><i style="background:${c}"></i>${esc(A.TYPES[k].label)}</span>`).join(''); });

  // deep link: #quiz
  if (location.hash === '#quiz') setTimeout(() => $('#quiz').scrollIntoView(), 300);
})();
