/* ------------------------------------------------------------------
   Procedural SVG scene illustrations for destination covers.
   Real photos: put img/<id>.jpg in the repo and list the id in
   TRIP.photos (data.js). The illustration stays as the fallback.
   ------------------------------------------------------------------ */
(function () {
  const colorsOf = (hue) => (hue.match(/#[0-9a-f]{6}/gi) || ['#f59e0b', '#ef4444']);
  // simple deterministic pseudo-random from a string
  const rng = (seed) => { let h = 2166136261; for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h += 0x6D2B79F5; let t = Math.imul(h ^ (h >>> 15), 1 | h); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  const W = 400, H = 220;
  const stars = (r, n) => Array.from({ length: n }, () => `<circle cx="${(r() * W).toFixed(0)}" cy="${(r() * H * .45).toFixed(0)}" r="${(r() * 1.4 + .4).toFixed(1)}" fill="#fff" opacity="${(r() * .6 + .3).toFixed(2)}"/>`).join('');
  const birds = (r, n) => Array.from({ length: n }, () => { const x = r() * W, y = 30 + r() * 60, s = 6 + r() * 6; return `<path d="M${x} ${y} q${s / 2} -${s / 2} ${s} 0 q${s / 2} -${s / 2} ${s} 0" fill="none" stroke="#fff" stroke-width="1.5" opacity=".7"/>`; }).join('');
  const hill = (y, amp, seg, fill, r, op = 1) => { let d = `M0 ${H} L0 ${y}`; for (let x = 0; x <= W; x += seg) d += ` Q${x + seg / 2} ${y - amp * (0.4 + r())} ${x + seg} ${y + amp * (r() - .5) * .6}`; return `<path d="${d} L${W} ${H} Z" fill="${fill}" opacity="${op}"/>`; };
  const palm = (x, y, h, flip) => { const s = flip ? -1 : 1; return `<g transform="translate(${x} ${y}) scale(${s} 1)"><path d="M0 0 q6 -${h * .5} 4 -${h}" stroke="#1c1917" stroke-width="3" fill="none" stroke-linecap="round"/>` + [0, 40, 80, 120, 160, 200].map((a) => `<path d="M4 -${h} q${18 * Math.cos(a * Math.PI / 180)} ${-6 + 14 * Math.sin(a * Math.PI / 180)} ${34 * Math.cos(a * Math.PI / 180)} ${10 + 22 * Math.sin(a * Math.PI / 180)}" stroke="#1c1917" stroke-width="3.5" fill="none" stroke-linecap="round"/>`).join('') + '</g>'; };
  const temple = (x, base, w, h, fill) => `<g fill="${fill}"><rect x="${x}" y="${base - h * .35}" width="${w}" height="${h * .35}"/><path d="M${x} ${base - h * .35} L${x + w * .5} ${base - h} L${x + w} ${base - h * .35} Z"/>` + [.2, .4, .6, .8].map((f, i) => `<rect x="${x + w * f - 3}" y="${base - h * (.62 - i % 2 * .1)}" width="6" height="${h * .3}"/>`).join('') + `<rect x="${x + w * .5 - 2}" y="${base - h - 12}" width="4" height="14"/></g>`;
  const fort = (x, base, w, h, fill) => `<g fill="${fill}"><rect x="${x}" y="${base - h}" width="${w}" height="${h}"/>` + Array.from({ length: Math.floor(w / 14) }, (_, i) => `<rect x="${x + i * 14 + 2}" y="${base - h - 8}" width="8" height="8"/>`).join('') + `<rect x="${x + w * .3}" y="${base - h - 26}" width="${w * .4}" height="26"/><path d="M${x + w * .3} ${base - h - 26} q${w * .2} -18 ${w * .4} 0z"/></g>`;
  const skyline = (r, base, fill) => { let g = `<g fill="${fill}">`; for (let x = 0; x < W; x += 22 + r() * 18) { const h = 30 + r() * 90, w = 16 + r() * 22; g += `<rect x="${x}" y="${base - h}" width="${w}" height="${h}"/>`; for (let wy = base - h + 8; wy < base - 6; wy += 12) for (let wx = x + 3; wx < x + w - 4; wx += 7) if (r() > .45) g += `<rect x="${wx}" y="${wy}" width="3" height="5" fill="#fde68a" opacity=".85"/>`; } return g + '</g>'; };
  const waves = (r, y, fill) => { let g = ''; for (let i = 0; i < 4; i++) { let d = `M0 ${y + i * 14}`; for (let x = 0; x <= W; x += 40) d += ` q20 -${5 + r() * 4} 40 0`; g += `<path d="${d}" fill="none" stroke="${fill}" stroke-width="2" opacity="${.55 - i * .1}"/>`; } return g; };
  const tea = (r, y, fill) => { let g = ''; for (let i = 0; i < 6; i++) { let d = `M-10 ${y + i * 9}`; for (let x = 0; x <= W + 10; x += 24) d += ` q12 -${3 + r() * 3} 24 0`; g += `<path d="${d}" fill="none" stroke="${fill}" stroke-width="3" opacity=".5"/>`; } return g; };
  const boulders = (r, base, fill) => Array.from({ length: 9 }, () => { const x = r() * W, rx = 12 + r() * 30, ry = 8 + r() * 18; return `<ellipse cx="${x}" cy="${base - ry * .6}" rx="${rx}" ry="${ry}" fill="${fill}"/>`; }).join('');
  const animal = (x, base, fill) => `<g fill="${fill}" transform="translate(${x} ${base})"><ellipse cx="0" cy="-22" rx="26" ry="16"/><rect x="-22" y="-14" width="8" height="16"/><rect x="12" y="-14" width="8" height="16"/><circle cx="26" cy="-30" r="11"/><path d="M30 -22 q10 14 2 26" stroke="${fill}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M36 -34 q10 -6 6 8" stroke="${fill}" stroke-width="3" fill="none"/></g>`;

  function scene(id, type, hue) {
    const [c1, c2] = colorsOf(hue);
    const r = rng(id);
    const dark = '#1c1917';
    const sunX = 80 + r() * 240, sunY = 50 + r() * 50;
    let body = `<defs><linearGradient id="g-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient><radialGradient id="s-${id}"><stop offset="0" stop-color="#fff7d6"/><stop offset="1" stop-color="#fff7d6" stop-opacity="0"/></radialGradient></defs>`;
    body += `<rect width="${W}" height="${H}" fill="url(#g-${id})"/>`;
    body += `<circle cx="${sunX}" cy="${sunY}" r="70" fill="url(#s-${id})" opacity=".8"/><circle class="sun" cx="${sunX}" cy="${sunY}" r="22" fill="#fff5cc" opacity=".95"/>`;
    body += stars(r, 12) + birds(r, 3);
    switch (type) {
      case 'beach':
        body += hill(120, 30, 90, 'rgba(0,0,0,.18)', r) + `<rect x="0" y="140" width="${W}" height="80" fill="rgba(255,255,255,.22)"/>` + waves(r, 150, '#ffffff') + `<path d="M0 ${H} L0 190 Q200 175 ${W} 195 L${W} ${H}Z" fill="#fde9c4"/>` + palm(60, 200, 90, false) + palm(340, 205, 75, true);
        break;
      case 'hills':
        body += hill(110, 40, 80, 'rgba(0,0,0,.14)', r) + hill(140, 36, 70, 'rgba(0,0,0,.26)', r) + hill(170, 26, 60, 'rgba(0,0,0,.42)', r) + tea(r, 172, '#ffffff') + `<path d="M0 ${H} L0 205 Q200 195 ${W} 208 L${W} ${H}Z" fill="${dark}" opacity=".7"/>`;
        break;
      case 'wildlife':
        body += hill(120, 30, 90, 'rgba(0,0,0,.14)', r) + `<rect x="0" y="150" width="${W}" height="70" fill="rgba(0,0,0,.28)"/>` + Array.from({ length: 5 }, () => { const x = r() * W; return `<path d="M${x} 150 q14 -30 30 0" fill="${dark}" opacity=".8"/>`; }).join('') + animal(200, 178, dark) + `<rect x="0" y="178" width="${W}" height="42" fill="${dark}" opacity=".85"/>`;
        break;
      case 'culture':
        body += hill(130, 24, 100, 'rgba(0,0,0,.14)', r) + boulders(r, 175, 'rgba(0,0,0,.22)') + temple(150, 178, 100, 110, dark) + temple(40, 180, 50, 60, dark) + temple(310, 180, 60, 70, dark) + `<rect x="0" y="178" width="${W}" height="42" fill="${dark}" opacity=".85"/>`;
        break;
      case 'city':
        body += skyline(r, 175, 'rgba(0,0,0,.35)') + skyline(r, 200, dark) + `<rect x="0" y="200" width="${W}" height="20" fill="${dark}"/>`;
        break;
      case 'far':
        body += hill(100, 50, 70, 'rgba(255,255,255,.18)', r) + hill(130, 40, 90, 'rgba(0,0,0,.18)', r) + fort(120, 180, 160, 50, dark) + fort(20, 180, 60, 30, dark) + fort(320, 180, 60, 36, dark) + `<rect x="0" y="180" width="${W}" height="40" fill="${dark}" opacity=".85"/>`;
        break;
      default:
        body += hill(130, 30, 80, 'rgba(0,0,0,.2)', r);
    }
    return `<svg class="scene" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${body}</svg>`;
  }

  window.coverHTML = (d, extra = '') => `<div class="cover" style="background:${d.hue}">${scene(d.id, d.type, d.hue)}${(window.TRIP.photos || []).includes(d.id) ? `<img class="photo" src="img/${d.id}.jpg" alt="" loading="lazy">` : ''}<span class="emoji-badge">${d.emoji}</span>${extra}</div>`;
  window.sceneSVG = scene;
})();
