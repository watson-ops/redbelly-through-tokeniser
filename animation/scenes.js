/*
 * From Fund to Token: scene builder and deterministic renderer.
 *
 * Every visual state is a pure function of time t (seconds). The renderer calls
 * window.seek(t) once per frame, so a render is frame exact and repeatable.
 * Cue times come from window.TIMELINE, which tools/build_voiceover.py writes from
 * the measured voiceover, so motion stays locked to the words.
 */
(function () {
  'use strict';

  const TL = window.TIMELINE;
  const stage = document.getElementById('stage');

  // ---------- palette (see brand/tokens.css) ----------
  const C = {
    ink: '#343740', ink2: '#4b4f5d', muted: '#5e6270', soft: '#bdc1cb', hair: '#e1e4e8',
    fill: '#eef0f2', well: '#f7f8f9', paper: '#ffffff', mint: '#a2ffc8', teal: '#009c9c',
    red: '#ff5050', slate: '#283a46', navy: '#142530', cloud: '#ecebec', grey: '#848b91',
    darkCard: '#1d3140', darkEdge: '#34444f', darkText: '#f1f5f8',
  };

  // ---------- maths ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, k) => a + (b - a) * k;
  const easeOut = k => 1 - Math.pow(1 - k, 3);
  const easeInOut = k => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
  const prog = (t, a, d) => clamp((t - a) / d);
  const ein = (t, a, d = 0.6) => easeOut(prog(t, a, d));
  const eio = (t, a, d = 0.6) => easeInOut(prog(t, a, d));
  const bell = (t, a, d) => Math.sin(Math.PI * prog(t, a, d));

  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function mix(a, b, k) {
    const x = hexRgb(a), y = hexRgb(b);
    return `rgb(${x.map((v, i) => Math.round(lerp(v, y[i], k))).join(',')})`;
  }
  function cubic(p0, p1, p2, p3, k) {
    const u = 1 - k;
    return [0, 1].map(i => u * u * u * p0[i] + 3 * u * u * k * p1[i] + 3 * u * k * k * p2[i] + k * k * k * p3[i]);
  }

  // ---------- timeline lookups ----------
  const lineById = Object.fromEntries(TL.lines.map(l => [l.id, l]));
  const sceneById = Object.fromEntries(TL.scenes.map(s => [s.id, s]));
  const L = id => lineById[id];
  const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  window.__missingWords = [];
  // Start time of a spoken word, so motion lands on the word itself.
  function W(id, word, nth = 0) {
    const l = L(id);
    const target = norm(word);
    let hits = l.words.filter(w => norm(w.word) === target);
    if (!hits.length) hits = l.words.filter(w => norm(w.word).startsWith(target));
    if (hits.length > nth) return hits[nth].start;
    window.__missingWords.push(`${id}:${word}`);
    return l.start;
  }

  // ---------- icons (drawn for this project, 24 x 24 grid) ----------
  const ICONS = {
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-5.8 6.5-5.8s6.5 2.2 6.5 5.8"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.6c2.1.7 3.5 2.6 3.5 5.4"/>',
    fund: '<path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z"/><path d="M15 3.2a8.5 8.5 0 0 1 5.8 5.8H15z"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M3 14.5h18M9 9v11"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 2"/>',
    doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
    pen: '<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>',
    shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
    shieldCheck: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    x: '<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    unlock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 7.6-1.8"/>',
    wallet: '<path d="M4 7.5V6a2 2 0 0 1 2-2h11v3.5"/><rect x="3" y="7.5" width="18" height="12.5" rx="2"/><circle cx="16.5" cy="13.8" r="1.3"/>',
    idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2.2"/><path d="M5.8 16.2c.6-1.6 1.8-2.4 3.2-2.4s2.6.8 3.2 2.4M14 10h4.5M14 13.5h3"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    badge: '<circle cx="12" cy="9" r="5.5"/><path d="M8.6 13.4L7 21l5-2.6 5 2.6-1.6-7.6"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.8 3.8 5.8 3.8 9s-1.2 6.2-3.8 9c-2.6-2.8-3.8-5.8-3.8-9S9.4 5.8 12 3z"/>',
    hourglass: '<path d="M6 3h12M6 21h12"/><path d="M7.5 3v2.5c0 2.5 4.5 4 4.5 6.5s-4.5 4-4.5 6.5V21M16.5 3v2.5c0 2.5-4.5 4-4.5 6.5s4.5 4 4.5 6.5V21"/>',
    layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 17l9 5 9-5"/>',
    final: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>',
    proof: '<path d="M12 2.8l8 4.6v9.2L12 21.2l-8-4.6V7.4z"/><path d="M8.6 12.2l2.4 2.4 4.4-4.8"/>',
    research: '<path d="M2.5 9.5L12 4.5l9.5 5-9.5 5z"/><path d="M6.5 11.6v4.6c1.5 1.4 3.3 2.1 5.5 2.1s4-.7 5.5-2.1v-4.6M21.5 9.5v5"/>',
    bank: '<path d="M3 9.5L12 4l9 5.5"/><path d="M5 10.5v7.5M9.6 10.5v7.5M14.4 10.5v7.5M19 10.5v7.5M3 20.5h18"/>',
    userCheck: '<circle cx="10" cy="8" r="4"/><path d="M3 21c0-4.2 3.1-6.8 7-6.8 1.4 0 2.7.3 3.8.9"/><path d="M15 18l2 2 4-4.5"/>',
  };

  // ---------- DOM helpers ----------
  function el(tag, cls, parent, style, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) Object.assign(e.style, style);
    if (text != null) { e.textContent = text; e.classList.add('tx'); }
    (parent || stage).appendChild(e);
    return e;
  }
  const px = v => `${v}px`;
  function box(parent, x, y, w, h, cls, style) {
    return el('div', cls || 'abs', parent, Object.assign({ left: px(x), top: px(y), width: px(w), height: px(h) }, style || {}));
  }
  function txt(parent, x, y, s, size, weight, color, style) {
    return el('div', 'abs', parent, Object.assign({
      left: px(x), top: px(y), fontSize: px(size), fontWeight: weight || 400,
      color: color || C.ink, whiteSpace: 'nowrap', lineHeight: 1.2,
    }, style || {}), s);
  }
  function mono(parent, x, y, s, size, color) {
    const e = txt(parent, x, y, s, size, 500, color || C.muted);
    e.classList.add('mono');
    return e;
  }
  function svgIcon(name, size, color, sw) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${sw || 1.8}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;
  }
  function icon(parent, name, x, y, size, color, sw) {
    const d = box(parent, x, y, size, size, 'icon');
    d.innerHTML = svgIcon(name, size, color, sw);
    return d;
  }
  function disc(parent, name, x, y, d, bg, color, isz, sw) {
    const c = box(parent, x, y, d, d, 'abs', { borderRadius: '50%', background: bg });
    if (name) icon(c, name, (d - isz) / 2, (d - isz) / 2, isz, color, sw);
    return c;
  }
  function card(parent, x, y, w, h, dark) {
    return box(parent, x, y, w, h, dark ? 'card dark' : 'card');
  }
  function chip(parent, x, y, s, kind, size) {
    const c = el('div', 'chip' + (kind ? ' ' + kind : ''), parent, { left: px(x), top: px(y), fontSize: px(size || 20) });
    el('span', null, c, null, s);
    return c;
  }
  function token(parent, size) {
    const t = el('div', 'token', parent, {
      width: px(size), height: px(size), left: '0px', top: '0px',
      background: 'radial-gradient(circle at 34% 30%, #e2fff0 0%, #a2ffc8 52%, #78e3a6 100%)',
      boxShadow: `inset 0 0 0 ${Math.max(2, size * 0.03)}px rgba(52,55,64,0.85)`,
    });
    box(t, size * 0.21, size * 0.21, size * 0.58, size * 0.58, 'abs', {
      borderRadius: '50%', border: `${Math.max(1.5, size * 0.028)}px solid rgba(52,55,64,0.7)`,
    });
    const d = size * 0.17;
    box(t, (size - d) / 2, (size - d) / 2, d, d, 'abs', { background: C.ink, transform: 'rotate(45deg)', borderRadius: '2px' });
    t._size = size;
    return t;
  }
  function place(e, cx, cy) {
    const s = e._size || e.offsetWidth;
    e.style.left = px(cx - s / 2);
    e.style.top = px(cy - s / 2);
  }
  function svgLayer(parent) {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('width', 1920); s.setAttribute('height', 1080);
    s.style.position = 'absolute'; s.style.left = '0'; s.style.top = '0'; s.style.overflow = 'visible';
    parent.appendChild(s);
    return s;
  }
  function path(svg, d, color, w, dash) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d); p.setAttribute('fill', 'none'); p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', w || 2); p.setAttribute('stroke-linecap', 'round');
    if (dash) p.setAttribute('stroke-dasharray', dash);
    svg.appendChild(p);
    p._len = p.getTotalLength();
    return p;
  }
  function draw(p, k) {
    p.style.strokeDasharray = `${p._len}`;
    p.style.strokeDashoffset = `${p._len * (1 - k)}`;
  }
  // Fade and slide an element in. k runs 0 to 1.
  function show(e, k, dy, dx, s0) {
    e.style.opacity = k;
    const sc = s0 == null ? 1 : lerp(s0, 1, k);
    e.style.transform = `translate(${(1 - k) * (dx || 0)}px, ${(1 - k) * (dy == null ? 18 : dy)}px) scale(${sc})`;
  }
  function setDisc(d, bg) { d.style.background = bg; }

  // ---------- backgrounds and chrome ----------
  const bgLight = el('div', 'layer', stage); bgLight.id = 'bgLight';
  const bgDark = el('div', 'layer', stage); bgDark.id = 'bgDark';
  const grid = el('div', 'layer', stage, {
    backgroundImage: 'radial-gradient(circle, rgba(52,55,64,0.10) 1.3px, transparent 1.6px)',
    backgroundSize: '40px 40px',
  });
  const gridDark = el('div', 'layer', stage, {
    backgroundImage: 'radial-gradient(circle, rgba(236,235,236,0.08) 1.3px, transparent 1.6px)',
    backgroundSize: '40px 40px', opacity: 0,
  });

  const SCENES = [];
  function scene(id, build) {
    const root = el('div', 'scene', stage);
    root.dataset.scene = id;
    const render = build(root, sceneById[id]);
    SCENES.push({ id, root, render });
  }

  // =====================================================================
  // S01  The fund
  // =====================================================================
  scene('S01', (root) => {
    const q = box(root, 0, 128, 1920, 80, 'abs', { textAlign: 'center', fontSize: '56px', fontWeight: 500, letterSpacing: '-0.02em', whiteSpace: 'nowrap' });
    q.dataset.tx = 'How does it become a token on Redbelly?';
    el('span', null, q).textContent = 'How does it become ';
    const hl = el('span', null, q, {
      backgroundImage: `linear-gradient(${C.mint}, ${C.mint})`, backgroundRepeat: 'no-repeat',
      backgroundPosition: '0 88%', backgroundSize: '0% 34%', padding: '0 4px',
    });
    hl.textContent = 'a token';
    el('span', null, q).textContent = ' on Redbelly?';

    const fund = card(root, 150, 300, 560, 330);
    disc(fund, 'fund', 40, 40, 96, C.mint, C.ink, 48);
    txt(fund, 40, 160, 'Wholesale fund', 46, 500);
    chip(fund, 40, 248, 'Australia');
    chip(fund, 172, 248, 'Unit trust');

    const svg = svgLayer(root);
    const ys = [270, 395, 520, 645];
    const units = [3, 2, 4, 1];
    const links = ys.map(y => path(svg, `M710 465 C 790 465, 780 ${y + 36}, 860 ${y + 36}`, '#c9ced4', 2));
    const people = ys.map((y, i) => {
      const g = box(root, 860, y, 420, 80);
      disc(g, 'user', 0, 0, 72, C.fill, C.ink2, 36);
      txt(g, 96, 4, `Investor ${'ABCD'[i]}`, 26, 500);
      const u = box(g, 96, 46, 200, 20);
      for (let j = 0; j < units[i]; j++) box(u, j * 26, 0, 18, 18, 'abs', { background: '#cfd4da', borderRadius: '3px' });
      return { g, u };
    });
    const label = txt(root, 860, 214, 'Investors hold units', 22, 500, C.muted);

    const reg = card(root, 1330, 250, 450, 470);
    txt(reg, 32, 28, 'Unit register', 30, 500);
    txt(reg, 32, 88, 'Investor', 18, 400, C.muted);
    txt(reg, 280, 88, 'Units', 18, 400, C.muted);
    const rows = [0, 1, 2, 3].map(i => {
      const r = box(reg, 0, 128 + i * 78, 450, 78);
      box(r, 32, 0, 386, 1, 'abs', { background: C.fill });
      txt(r, 32, 24, `Investor ${'ABCD'[i]}`, 22, 400, C.ink2);
      box(r, 280, 32, units[i] * 36, 12, 'abs bar');
      return r;
    });

    const wInv = W('L01', 'investors');
    const wUnits = W('L01', 'units');
    const wReg = W('L01', 'register');
    return (t) => {
      show(fund, ein(t, 0.25, 0.8), 24);
      links.forEach((p, i) => draw(p, eio(t, wInv - 0.1 + i * 0.1, 0.7)));
      show(label, ein(t, wInv - 0.2, 0.6));
      people.forEach(({ g, u }, i) => {
        show(g, ein(t, wInv + 0.25 + i * 0.1, 0.6), 0, -18);
        show(u, ein(t, wUnits - 0.1 + i * 0.08, 0.5), 8);
      });
      show(reg, ein(t, wReg - 0.25, 0.7), 24);
      rows.forEach((r, i) => show(r, ein(t, wReg + i * 0.08, 0.5), 10));
      show(q, ein(t, L('L02').start - 0.15, 0.7), 20);
      hl.style.backgroundSize = `${eio(t, W('L02', 'token') - 0.1, 0.5) * 100}% 34%`;
    };
  });

  // =====================================================================
  // S02  Today
  // =====================================================================
  scene('S02', (root) => {
    const title = txt(root, 150, 150, 'Today', 52, 500);
    const data = [['table', 'Registry'], ['grid', 'Spreadsheets'], ['mail', 'Emails']];
    const finalX = [210, 780, 1350];
    const boxes = data.map(([ic, name]) => {
      const c = card(root, 780, 300, 360, 230);
      disc(c, ic, 32, 32, 72, C.fill, C.ink2, 36);
      txt(c, 32, 140, name, 32, 500, C.ink2);
      return c;
    });
    const svg = svgLayer(root);
    const breaks = [570, 1140].map(x0 => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      svg.appendChild(g);
      path(g, `M${x0 + 12} 415 H${x0 + 92}`, '#bdc1cb', 2, '6 8');
      path(g, `M${x0 + 118} 415 H${x0 + 198}`, '#bdc1cb', 2, '6 8');
      path(g, `M${x0 + 98} 427 L${x0 + 106} 403`, '#9aa0aa', 2);
      path(g, `M${x0 + 106} 427 L${x0 + 114} 403`, '#9aa0aa', 2);
      return g;
    });
    const manual = card(root, 210, 600, 360, 130);
    disc(manual, 'pen', 28, 33, 64, C.fill, C.ink2, 30);
    txt(manual, 110, 46, 'Manual checks', 28, 500, C.ink2);

    const settle = card(root, 780, 600, 930, 130);
    disc(settle, 'clock', 28, 33, 64, C.fill, C.ink2, 30);
    txt(settle, 110, 26, 'Settlement: two business days or longer', 28, 500, C.ink2);
    const track = box(settle, 110, 84, 780, 10, 'abs', { background: C.fill, borderRadius: '5px' });
    const fill = box(track, 0, 0, 780, 10, 'abs', { background: C.soft, borderRadius: '5px', transformOrigin: '0 0' });

    const l = L('L03');
    const wSep = W('L03', 'separate');
    const wChecks = W('L03', 'checks');
    const wSettle = W('L03', 'settlement');
    return (t) => {
      show(title, ein(t, l.start - 0.4, 0.6));
      const spread = eio(t, wSep - 0.1, 0.9);
      boxes.forEach((b, i) => {
        b.style.left = px(lerp(780 + (i - 1) * 14, finalX[i], spread));
        b.style.top = px(lerp(300 + (i - 1) * 10, 300, spread));
        b.style.opacity = ein(t, l.start - 0.3 + i * 0.05, 0.5);
        b.style.zIndex = i === 1 ? 3 : 2;
      });
      breaks.forEach(g => { g.style.opacity = ein(t, wSep + 0.6, 0.5); });
      show(manual, ein(t, wChecks - 0.15, 0.6));
      show(settle, ein(t, wSettle - 0.2, 0.6));
      fill.style.transform = `scaleX(${0.66 * easeOut(prog(t, wSettle + 0.2, 3.5))})`;
    };
  });

  // =====================================================================
  // S03  Step 1: Legal review
  // =====================================================================
  scene('S03', (root) => {
    const doc = card(root, 200, 180, 560, 650);
    icon(doc, 'doc', 36, 32, 40, C.ink2);
    txt(doc, 92, 32, 'Trust deed', 34, 500);
    const widths = [470, 430, 488, 400, 460, 0, 452, 410, 470, 380];
    const bars = widths.map((w, i) => box(doc, 40, 128 + i * 50, w || 488, 12, 'abs', { background: '#e6e9ec', borderRadius: '6px' }));
    const hl = box(doc, 24, 128 + 5 * 50 - 26, 512, 64, 'abs', { background: C.mint, borderRadius: '6px', overflow: 'hidden' });
    icon(hl, 'check', 16, 18, 28, C.ink, 2.4);
    txt(hl, 56, 18, 'On-chain ownership records permitted', 21, 500);
    const scan = box(doc, 24, 120, 512, 3, 'abs', { background: C.teal, boxShadow: '0 0 18px 4px rgba(0,156,156,0.25)', borderRadius: '2px' });

    const lic = card(root, 900, 230, 820, 200);
    disc(lic, 'shieldCheck', 36, 52, 96, C.mint, C.ink, 48);
    txt(lic, 160, 50, 'Existing AFSL covers it', 36, 500);
    txt(lic, 160, 108, 'Covers issuance of tokenised fund interests', 22, 400, C.muted);

    const none = card(root, 900, 470, 820, 120);
    disc(none, 'x', 32, 28, 64, C.fill, C.ink2, 30);
    txt(none, 120, 40, 'No separate tokenisation licence', 30, 500);

    const l4 = L('L04');
    const wReview = W('L04', 'review');
    const wAllows = W('L04', 'allows');
    const wSep = W('L05', 'separate');
    return (t) => {
      show(doc, ein(t, l4.start - 0.5, 0.8), 24);
      const sk = prog(t, wReview - 0.2, 1.8);
      scan.style.top = px(lerp(110, 640, easeInOut(sk)));
      scan.style.opacity = bell(t, wReview - 0.2, 1.8);
      const h = eio(t, wAllows - 0.05, 0.7);
      hl.style.clipPath = `inset(0 ${(1 - h) * 100}% 0 0 round 6px)`;
      hl.style.opacity = h > 0 ? 1 : 0;
      bars[5].style.opacity = 1 - h;
      show(lic, ein(t, L('L05').start - 0.15, 0.7), 20);
      show(none, ein(t, wSep - 0.2, 0.7), 20);
    };
  });

  // =====================================================================
  // S04  Step 2: Set the rules
  // =====================================================================
  scene('S04', (root) => {
    const app = card(root, 180, 180, 880, 640);
    box(app, 0, 76, 880, 1, 'abs', { background: '#e8eaed' });
    txt(app, 32, 22, 'Tokeniser', 26, 600);
    box(app, 182, 26, 1, 28, 'abs', { background: '#d9dde2' });
    txt(app, 200, 25, 'Fund setup', 22, 400, C.muted);
    const kick = txt(app, 32, 108, 'Compliance rules', 20, 600, C.teal, { letterSpacing: '0.12em', textTransform: 'uppercase' });
    kick.dataset.tx = 'Compliance rules';
    const spec = [['users', 'Investor eligibility'], ['globe', 'Foreign ownership limit'], ['hourglass', 'Lock-up period']];
    const rows = spec.map(([ic, name], i) => {
      const r = box(app, 32, 156 + i * 140, 816, 116, 'abs', { background: C.well, border: '1px solid #e8eaed', borderRadius: '8px' });
      const d = disc(r, ic, 24, 26, 64, C.fill, C.ink2, 30);
      txt(r, 112, 38, name, 28, 500);
      const tr = box(r, 708, 38, 76, 40, 'abs', { borderRadius: '20px', background: '#d9dde2' });
      const kn = box(tr, 4, 4, 32, 32, 'abs', { borderRadius: '16px', background: '#ffffff' });
      const val = i === 0 ? chip(r, 520, 36, 'Wholesale') : null;
      return { r, d, tr, kn, val };
    });

    const tk = token(root, 300);
    place(tk, 1420, 440);
    const ring = box(root, 1420 - 190, 440 - 190, 380, 380, 'abs', { borderRadius: '50%', border: `2px solid ${C.mint}` });
    const fly = spec.map(([ic]) => disc(root, ic, 0, 0, 52, C.mint, C.ink, 26));
    const cap = txt(root, 1120, 640, 'Rules written into the token', 30, 500, C.ink, { width: '600px', textAlign: 'center' });

    const on = [W('L06', 'invest'), W('L06', 'foreign'), W('L06', 'lockup')];
    const l7 = L('L07');
    return (t) => {
      show(app, ein(t, L('L06').start - 0.5, 0.8), 24);
      rows.forEach((o, i) => {
        const k = eio(t, on[i] - 0.1, 0.45);
        o.r.style.opacity = lerp(0.55, 1, k);
        o.tr.style.background = mix('#d9dde2', C.mint, k);
        o.kn.style.left = px(lerp(4, 40, k));
        o.kn.style.background = mix('#ffffff', C.ink, k);
        setDisc(o.d, mix(C.fill, C.mint, k));
        if (o.val) { o.val.style.background = mix(C.fill, C.mint, k); o.val.style.color = mix(C.ink2, C.ink, k); }
      });
      const tIn = ein(t, l7.start - 0.35, 0.7);
      show(tk, tIn, 0, 0, 0.85);
      fly.forEach((f, i) => {
        const k = eio(t, l7.start - 0.2 + i * 0.14, 0.8);
        const sx = 180 + 32 + 708 + 38, sy = 180 + 156 + i * 140 + 58;
        place(f, lerp(sx, 1420, k), lerp(sy, 440, k) - Math.sin(Math.PI * k) * 60);
        f.style.opacity = k <= 0 ? 0 : (k < 0.85 ? 1 : (1 - k) / 0.15);
      });
      const pulse = prog(t, l7.start + 0.7, 1.0);
      ring.style.opacity = pulse > 0 && pulse < 1 ? (1 - pulse) : 0;
      ring.style.transform = `scale(${lerp(0.8, 1.15, pulse)})`;
      show(cap, ein(t, l7.start + 0.4, 0.6), 14);
    };
  });

  // =====================================================================
  // S05  Step 3: Verify investors
  // =====================================================================
  scene('S05', (root) => {
    const inv = card(root, 160, 180, 760, 650);
    disc(inv, 'user', 40, 40, 96, C.fill, C.ink2, 46);
    txt(inv, 160, 50, 'Investor', 36, 500);
    txt(inv, 160, 100, 'Digital onboarding', 22, 400, C.muted);
    const spec = [['idcard', 'Identity'], ['search', 'AML screening'], ['badge', 'Investor classification']];
    const rows = spec.map(([ic, name], i) => {
      const r = box(inv, 40, 190 + i * 132, 680, 108, 'abs', { background: C.well, border: '1px solid #e8eaed', borderRadius: '8px' });
      disc(r, ic, 22, 22, 64, C.fill, C.ink2, 30);
      txt(r, 104, 36, name, 27, 500);
      const pend = box(r, 600, 32, 44, 44, 'abs', { borderRadius: '50%', border: '2px dashed #bdc1cb' });
      const done = disc(r, 'check', 600, 32, 44, C.mint, C.ink, 24, 2.6);
      const val = i === 2 ? chip(r, 430, 32, 'Wholesale') : null;
      return { pend, done, val };
    });

    function walletCard(y, addr) {
      const c = card(root, 1020, y, 720, 250);
      disc(c, 'wallet', 32, 32, 72, C.fill, C.ink2, 34);
      txt(c, 128, 34, 'Wallet', 30, 500);
      mono(c, 128, 80, addr, 22);
      const off = box(c, 32, 168, 400, 40);
      icon(off, 'lock', 0, 4, 28, C.muted);
      txt(off, 40, 6, 'Not verified', 22, 500, C.muted);
      return { c, off };
    }
    const A = walletCard(200, '0x7a3f…c21e');
    const aOn = box(A.c, 32, 168, 400, 40);
    disc(aOn, 'check', 0, 2, 32, C.mint, C.ink, 18, 2.6);
    txt(aOn, 44, 6, 'Wallet verified', 22, 500, C.ink);
    const aTok = token(root, 64);

    const B = walletCard(520, '0x91be…04d7');
    const bTok = token(root, 64);
    const blocked = chip(B.c, 400, 166, 'Blocked', 'ink');
    const bLock = disc(root, 'lock', 0, 0, 40, C.ink, '#ffffff', 22);
    bLock._size = 40;

    const verT = TL.chimes.find(c => c.label === 'wallet verified').time;
    const wTrig = [W('L08', 'identity'), W('L08', 'anti'), W('L08', 'classification')];
    const l9 = L('L09');
    const wTokens = W('L09', 'tokens');
    return (t) => {
      show(inv, ein(t, L('L08').start - 0.5, 0.8), 24);
      rows.forEach((o, i) => {
        const k = eio(t, wTrig[i] - 0.05, 0.4);
        o.done.style.opacity = k; o.done.style.transform = `scale(${lerp(0.6, 1, k)})`;
        o.pend.style.opacity = 1 - k;
        if (o.val) { o.val.style.background = mix(C.fill, C.mint, k); o.val.style.color = mix(C.ink2, C.ink, k); }
      });
      show(A.c, ein(t, L('L08').start - 0.3, 0.8), 24);
      const v = eio(t, verT, 0.4);
      A.off.style.opacity = 1 - v;
      aOn.style.opacity = v;
      const ak = eio(t, verT + 0.15, 0.7);
      place(aTok, lerp(1830, 1660, ak), 200 + 190);
      aTok.style.opacity = ein(t, verT, 0.3);

      show(B.c, ein(t, l9.start - 0.25, 0.7), 24);
      const bk = eio(t, wTokens - 0.3, 0.6);
      const bump = Math.sin(Math.PI * prog(t, wTokens + 0.3, 0.35)) * 10;
      place(bTok, lerp(1850, 1700, bk) + bump, 520 + 190);
      bTok.style.opacity = ein(t, l9.start, 0.3);
      place(bLock, 1660, 520 + 190);
      show(bLock, ein(t, wTokens + 0.25, 0.3), 0, 0, 0.6);
      show(blocked, ein(t, wTokens + 0.35, 0.4), 0, 12);
    };
  });

  // =====================================================================
  // S06  Step 4: Issue on Redbelly
  // =====================================================================
  scene('S06', (root) => {
    const bar = card(root, 180, 180, 820, 110);
    txt(bar, 32, 36, 'Tokeniser', 26, 600);
    const btn = box(bar, 568, 24, 220, 62, 'abs', { background: C.mint, borderRadius: '4px' });
    txt(btn, 0, 15, 'Issue tokens', 24, 500, C.ink, { width: '220px', textAlign: 'center' });

    const band = box(root, 180, 390, 820, 120, 'abs', { background: C.slate, borderRadius: '8px', border: '1px solid #34444f' });
    const iso = el('img', 'abs', band, { left: '32px', top: '33px', height: '54px' });
    iso.src = '../brand/logos/redbelly-isotype-red.svg';
    txt(band, 100, 40, 'Redbelly Network', 30, 500, C.cloud);
    const bsvg = svgLayer(band);
    const nodes = [[540, 40], [600, 78], [660, 36], [720, 82], [770, 46]];
    for (let i = 0; i < nodes.length - 1; i++) path(bsvg, `M${nodes[i][0]} ${nodes[i][1]} L${nodes[i + 1][0]} ${nodes[i + 1][1]}`, 'rgba(236,235,236,0.25)', 1.5);
    const dots = nodes.map(([x, y]) => box(band, x - 5, y - 5, 10, 10, 'abs', { borderRadius: '50%', background: 'rgba(236,235,236,0.6)' }));
    const flash = box(band, -1, -1, 820, 120, 'abs', { borderRadius: '8px', boxShadow: `0 0 0 2px ${C.red}, 0 0 28px rgba(255,80,80,0.35)` });

    const addrs = ['0x7a3f…c21e', '0x3c58…9a10', '0x5d2e…b7f4'];
    const wallets = addrs.map((a, i) => {
      const c = card(root, 180 + i * 285, 610, 250, 180);
      disc(c, 'wallet', 24, 24, 52, C.fill, C.ink2, 26);
      mono(c, 24, 92, a, 20);
      const s = box(c, 24, 134, 200, 30);
      box(s, 0, 9, 10, 10, 'abs', { borderRadius: '5px', background: C.teal });
      txt(s, 20, 2, 'Verified', 20, 500, C.ink2);
      return c;
    });
    const toks = addrs.map(() => token(root, 56));

    const reg = card(root, 1100, 180, 640, 470);
    txt(reg, 32, 30, 'Unit register', 30, 500);
    const live = box(reg, 500, 34, 120, 40);
    const liveDot = box(live, 0, 13, 14, 14, 'abs', { borderRadius: '7px', background: C.teal });
    const livePulse = box(live, -8, 5, 30, 30, 'abs', { borderRadius: '15px', border: `2px solid ${C.teal}` });
    mono(live, 32, 6, 'Live', 22, C.ink);
    txt(reg, 32, 100, 'Wallet', 18, 400, C.muted);
    txt(reg, 420, 100, 'Units', 18, 400, C.muted);
    const rw = [150, 110, 180];
    const rows = addrs.map((a, i) => {
      const r = box(reg, 0, 140 + i * 90, 640, 90);
      box(r, 32, 0, 576, 1, 'abs', { background: C.fill });
      mono(r, 32, 30, a, 22, C.ink2);
      box(r, 420, 38, rw[i], 14, 'abs', { background: C.mint, borderRadius: '7px', boxShadow: 'inset 0 0 0 1px rgba(52,55,64,0.25)' });
      return r;
    });

    const s = sceneById.S06;
    const wIssued = W('L10', 'issued');
    const l11 = L('L11');
    const DUR = 1.35;
    const starts = [0, 1, 2].map(i => wIssued - 0.15 + i * 0.32);
    return (t) => {
      show(bar, ein(t, s.start + 0.1, 0.7), 20);
      show(band, ein(t, W('L10', 'redbelly') - 0.6, 0.7), 20);
      wallets.forEach((w, i) => show(w, ein(t, s.start + 0.35 + i * 0.1, 0.7), 20));
      show(reg, ein(t, s.start + 0.5, 0.8), 20);
      const press = bell(t, wIssued - 0.25, 0.3);
      btn.style.transform = `scale(${1 - press * 0.05})`;
      btn.style.boxShadow = `0 0 0 ${press * 6}px rgba(162,255,200,0.5)`;
      let crossing = 0;
      toks.forEach((tk, i) => {
        const k = eio(t, starts[i], DUR);
        const wx = 180 + i * 285 + 190;
        const p = cubic([858, 300], [858, 470], [wx, 430], [wx, 666], k);
        place(tk, p[0], p[1]);
        tk.style.opacity = clamp(k / 0.12);
        crossing = Math.max(crossing, bell(t, starts[i] + DUR * 0.32, DUR * 0.36));
      });
      flash.style.opacity = crossing;
      dots.forEach((d, i) => { d.style.background = mix('#9fa3a6', C.red, crossing * (i % 2 === 0 ? 1 : 0.4)); });
      rows.forEach((r, i) => show(r, ein(t, starts[i] + DUR - 0.1, 0.45), 0, -14));
      show(live, ein(t, l11.start - 0.1, 0.4), 0, 0, 0.8);
      const lp = ((t - l11.start) % 1.2 + 1.2) % 1.2 / 1.2;
      livePulse.style.opacity = t > l11.start ? 0.8 * (1 - lp) : 0;
      livePulse.style.transform = `scale(${lerp(0.5, 1.6, lp)})`;
      liveDot.style.opacity = 1;
    };
  });

  // =====================================================================
  // S07  Step 5: Transfers
  // =====================================================================
  scene('S07', (root) => {
    const svg = svgLayer(root);
    const pA = path(svg, 'M540 490 H930', '#c9ced4', 2.5);
    const pB = path(svg, 'M990 490 C 1200 490, 1200 330, 1400 330', '#c9ced4', 2.5);
    const pC = path(svg, 'M990 490 C 1200 490, 1200 675, 1400 675', '#c9ced4', 2.5);
    const hB = path(svg, 'M990 490 C 1200 490, 1200 330, 1400 330', C.ink2, 3);
    const hC = path(svg, 'M990 490 C 1200 490, 1200 675, 1400 675', C.teal, 3);

    const snd = card(root, 140, 385, 400, 210);
    disc(snd, 'wallet', 28, 28, 64, C.fill, C.ink2, 30);
    txt(snd, 108, 30, 'Investor A', 28, 500);
    mono(snd, 108, 72, '0x7a3f…c21e', 20);
    const s1 = box(snd, 28, 150, 200, 30);
    box(s1, 0, 9, 10, 10, 'abs', { borderRadius: '5px', background: C.teal });
    txt(s1, 20, 2, 'Verified', 20, 500, C.ink2);

    const gateHead = box(root, 760, 214, 400, 60);
    icon(gateHead, 'shield', 96, 8, 40, C.ink2);
    txt(gateHead, 148, 12, 'Rule check', 28, 500);
    const gate = box(root, 930, 300, 60, 380, 'abs', { background: C.paper, border: '1px solid #e1e4e8', borderRadius: '30px', overflow: 'hidden' });
    const scanLine = box(gate, 0, 0, 60, 4, 'abs', { background: C.teal, boxShadow: '0 0 16px 4px rgba(0,156,156,0.35)' });
    const resN = disc(root, null, 924, 454, 72, C.fill);
    const resX = disc(root, 'x', 924, 454, 72, C.ink, '#ffffff', 34, 2.6);
    const resV = disc(root, 'check', 924, 454, 72, C.mint, C.ink, 34, 2.6);
    const rules = box(root, 660, 712, 600, 50);
    const rl = [['users', 'Eligibility', 0], ['globe', 'Ownership limit', 178], ['hourglass', 'Lock-up', 410]].map(([ic, name, x]) => {
      const c = box(rules, x, 0, name.length * 11 + 72, 46, 'abs', { background: C.fill, borderRadius: '4px' });
      icon(c, ic, 14, 11, 24, C.ink2);
      txt(c, 48, 11, name, 19, 500, C.ink2);
      return c;
    });

    function recv(y, name, addr) {
      const c = card(root, 1400, y, 380, 230);
      disc(c, 'wallet', 28, 28, 64, C.fill, C.ink2, 30);
      txt(c, 108, 30, name, 28, 500);
      mono(c, 108, 72, addr, 20);
      return c;
    }
    const rB = recv(215, 'Investor B', '0x91be…04d7');
    const nb = box(rB, 28, 150, 300, 30);
    disc(nb, 'x', 0, 0, 30, C.fill, C.ink2, 16, 2.4);
    txt(nb, 42, 3, 'Not eligible', 20, 500, C.muted);
    const rC = recv(560, 'Investor C', '0x3c58…9a10');
    const vc = box(rC, 28, 140, 300, 30);
    box(vc, 0, 9, 10, 10, 'abs', { borderRadius: '5px', background: C.teal });
    txt(vc, 20, 2, 'Verified', 20, 500, C.ink2);
    const settled = box(rC, 28, 140, 330, 30);
    disc(settled, 'check', 0, 0, 30, C.mint, C.ink, 16, 2.6);
    txt(settled, 42, 3, 'Settled in seconds', 20, 500, C.ink);
    const upd = box(rC, 28, 182, 330, 30);
    box(upd, 0, 9, 10, 10, 'abs', { borderRadius: '5px', background: C.teal });
    txt(upd, 20, 2, 'Register updated', 20, 500, C.ink2);

    const rejected = chip(root, 588, 404, 'Rejected: not eligible', 'ink');

    const t1 = token(root, 52), t2 = token(root, 52);
    const s = sceneById.S07;
    const wChecked = W('L12', 'checked');
    const l13 = L('L13'), l14 = L('L14');
    const land = TL.chimes.find(c => c.label === 'transfer settled').time;
    const bez = d => d.split(/[ ,MCH]+/).filter(Boolean).map(Number);
    const B = bez('990 490 1200 490 1200 330 1400 330');
    const Cc = bez('990 490 1200 490 1200 675 1400 675');
    const at = (arr, k) => cubic([arr[0], arr[1]], [arr[2], arr[3]], [arr[4], arr[5]], [arr[6], arr[7]], k);
    return (t) => {
      show(snd, ein(t, s.start + 0.1, 0.7), 20);
      show(gateHead, ein(t, s.start + 0.3, 0.7), 14);
      show(gate, ein(t, s.start + 0.3, 0.7), 14);
      show(rules, ein(t, s.start + 0.5, 0.7), 14);
      show(rB, ein(t, s.start + 0.4, 0.7), 20);
      show(rC, ein(t, s.start + 0.5, 0.7), 20);
      draw(pA, eio(t, s.start + 0.3, 0.8));
      draw(pB, eio(t, s.start + 0.6, 0.8));
      draw(pC, eio(t, s.start + 0.7, 0.8));
      resN.style.opacity = ein(t, s.start + 0.5, 0.5);

      // Token 1: checked, then rejected and returned.
      const go = eio(t, wChecked - 0.45, 0.9);
      const tryB = eio(t, l13.start - 0.1, 0.55);
      const back = eio(t, l13.start + 0.75, 0.7);
      let x1 = lerp(500, 900, go), y1 = 490;
      if (tryB > 0 && back === 0) { const p = at(B, tryB * 0.28); x1 = lerp(900, p[0], tryB); y1 = lerp(490, p[1], tryB); }
      if (back > 0) { const p = at(B, 0.28); x1 = lerp(p[0], 500, back); y1 = lerp(p[1], 490, back); }
      place(t1, x1, y1);
      t1.style.opacity = ein(t, s.start + 0.6, 0.4) * (1 - prog(t, l13.start + 1.25, 0.25));
      const scanK = prog(t, wChecked, 1.4);
      scanLine.style.top = px(lerp(-4, 380, easeInOut(scanK)));
      scanLine.style.opacity = scanK > 0 && scanK < 1 ? 1 : 0;
      rl.forEach((c, i) => {
        const a = bell(t, wChecked + i * 0.3, 0.9);
        c.style.background = mix(C.fill, C.mint, a);
      });
      const rej = bell(t, l13.start + 0.3, 1.8);
      resX.style.opacity = rej;
      hB.style.opacity = 0.0;
      show(rejected, ein(t, l13.start + 0.35, 0.4) * (1 - prog(t, l14.start - 0.2, 0.3)), 0, 12);

      // Token 2: passes and settles.
      const k2 = prog(t, l14.start - 0.25, land - (l14.start - 0.25));
      let x2, y2;
      if (k2 < 0.45) { const k = easeInOut(k2 / 0.45); x2 = lerp(500, 960, k); y2 = 490; }
      else { const p = at(Cc, easeInOut((k2 - 0.45) / 0.55)); x2 = p[0]; y2 = p[1]; }
      if (k2 >= 1) { x2 = 1400 + 330; y2 = 560 + 60; }
      place(t2, x2, y2);
      t2.style.opacity = t > l14.start - 0.3 ? 1 : 0;
      const pass = eio(t, l14.start + 0.15, 0.25);
      resV.style.opacity = pass;
      draw(hC, k2 > 0.45 ? easeInOut((Math.min(k2, 1) - 0.45) / 0.55) : 0);
      hC.style.opacity = k2 > 0.45 ? 0.9 : 0;
      const done = eio(t, land, 0.4);
      vc.style.opacity = 1 - done;
      settled.style.opacity = done;
      show(upd, ein(t, land + 0.25, 0.4), 0, -10);
    };
  });

  // =====================================================================
  // S08  The Redbelly layer
  // =====================================================================
  scene('S08', (root) => {
    const logo = el('img', 'abs', root, { left: '140px', top: '118px', height: '72px' });
    logo.src = '../brand/logos/redbelly-horizontal-negative.svg';
    logo.dataset.tx = 'Redbelly Network';

    const tkl = card(root, 140, 300, 720, 120);
    txt(tkl, 32, 24, 'Tokeniser', 30, 600);
    const k1 = txt(tkl, 32, 70, 'Issue', 18, 600, C.teal, { letterSpacing: '0.12em', textTransform: 'uppercase' });
    k1.dataset.tx = 'Issue';
    const tkt = token(tkl, 64);
    place(tkt, 640, 60);

    const arrows = svgLayer(root);
    const a1 = path(arrows, 'M420 428 V 450', 'rgba(236,235,236,0.6)', 2);
    const a2 = path(arrows, 'M580 428 V 450', 'rgba(236,235,236,0.6)', 2);

    const rbl = box(root, 140, 458, 720, 340, 'abs', { background: C.slate, border: '1px solid #34444f', borderRadius: '8px', overflow: 'hidden' });
    txt(rbl, 32, 24, 'Redbelly Network', 30, 500, C.cloud);
    const k2 = txt(rbl, 32, 70, 'Settle', 18, 600, 'rgba(236,235,236,0.75)', { letterSpacing: '0.12em', textTransform: 'uppercase' });
    k2.dataset.tx = 'Settle';
    const nsvg = svgLayer(rbl);
    const pts = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) pts.push([64 + c * 112 + (r % 2) * 56, 150 + r * 64]);
    const edges = [];
    pts.forEach((p, i) => pts.forEach((q, j) => {
      if (j <= i) return;
      const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
      if (d < 130) edges.push(path(nsvg, `M${p[0]} ${p[1]} L${q[0]} ${q[1]}`, 'rgba(236,235,236,0.22)', 1.5));
    }));
    const red = new Set([2, 7, 9, 15]);
    const nodes = pts.map(([x, y], i) => box(rbl, x - 7, y - 7, 14, 14, 'abs', { borderRadius: '50%', background: red.has(i) ? C.red : 'rgba(236,235,236,0.75)' }));

    const facts = [
      ['layers', 'Public digital token infrastructure'],
      ['userCheck', 'Identity verified at protocol level'],
      ['final', 'Confirmed transactions cannot be reversed'],
      ['proof', 'Formally verified consensus'],
      ['research', 'Born from University of Sydney and CSIRO research'],
      ['bank', "Chosen by Australia's central bank for Project Acacia"],
    ];
    const chips = facts.map(([ic, s], i) => {
      const c = box(root, 960, 205 + i * 100, 820, 84, 'abs', { background: C.darkCard, border: `1px solid ${C.darkEdge}`, borderRadius: '8px' });
      disc(c, ic, 18, 16, 52, C.slate, C.cloud, 28);
      box(c, 58, 18, 8, 8, 'abs', { borderRadius: '4px', background: C.red });
      txt(c, 88, 24, s, 27, 500, C.darkText);
      return c;
    });

    const s = sceneById.S08;
    const cue = [
      W('L15', 'public'),
      W('L16', 'identity'),
      W('L16', 'confirmed'),
      W('L17', 'formally'),
      W('L17', 'verified') + 0.9,
      W('L17', 'central'),
    ];
    return (t) => {
      show(logo, ein(t, s.start + 0.2, 0.8), 14);
      show(tkl, ein(t, s.start + 0.3, 0.7), -30);
      const rise = eio(t, W('L15', 'redbelly') - 0.4, 0.9);
      rbl.style.opacity = rise;
      rbl.style.transform = `translateY(${(1 - rise) * 120}px)`;
      [a1, a2].forEach((a, i) => draw(a, eio(t, W('L15', 'underneath') + i * 0.1, 0.5)));
      edges.forEach((e, i) => draw(e, eio(t, W('L15', 'redbelly') + (i % 9) * 0.06, 0.8)));
      nodes.forEach((n, i) => {
        const ph = Math.sin((t * 1.6) + i * 1.3);
        n.style.opacity = rise * (0.75 + 0.25 * ph);
        n.style.transform = `scale(${red.has(i) ? 1 + 0.12 * ph : 1})`;
      });
      chips.forEach((c, i) => show(c, ein(t, cue[i] - 0.15, 0.6), 0, 26));
    };
  });

  // =====================================================================
  // S09  Close and end card
  // =====================================================================
  scene('S09', (root) => {
    const words = ['Same fund.', 'Same strategy.', 'Same licence.'];
    const head = box(root, 0, 150, 1920, 80, 'abs', { display: 'flex', justifyContent: 'center', gap: '28px' });
    const ws = words.map(w => el('div', null, head, { position: 'relative', fontSize: '54px', fontWeight: 500, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }, w));

    const fund = card(root, 370, 340, 560, 330);
    disc(fund, 'fund', 40, 40, 96, C.mint, C.ink, 48);
    txt(fund, 40, 160, 'Wholesale fund', 46, 500);
    chip(fund, 40, 248, 'Australia');
    chip(fund, 172, 248, 'Unit trust');
    const ys = [300, 425, 550, 675];
    const svg = svgLayer(root);
    ys.forEach(y => path(svg, `M930 505 C 1020 505, 1010 ${y + 36}, 1100 ${y + 36}`, '#c9ced4', 2));
    const units = [3, 2, 4, 1];
    const morph = [];
    ys.forEach((y, i) => {
      const g = box(root, 1100, y, 520, 80);
      disc(g, 'user', 0, 0, 72, C.fill, C.ink2, 36);
      txt(g, 96, 4, `Investor ${'ABCD'[i]}`, 26, 500);
      for (let j = 0; j < units[i]; j++) {
        const sq = box(g, 96 + j * 30, 46, 18, 18, 'abs', { background: '#cfd4da', borderRadius: '3px' });
        const tk = token(g, 24);
        tk.style.left = px(96 + j * 30 - 3); tk.style.top = px(43);
        morph.push({ sq, tk, i, j });
      }
    });
    const on = chip(root, 370, 700, 'Compliant tokens on Redbelly', 'mint', 22);

    // End card
    const end = box(root, 0, 0, 1920, 1080, 'abs', { background: C.ink });
    const name = txt(end, 0, 300, 'Tokeniser', 120, 500, C.mint, { width: '1920px', textAlign: 'center', letterSpacing: '-0.02em' });
    const url = txt(end, 0, 470, 'tokeniser.com', 40, 400, '#ffffff', { width: '1920px', textAlign: 'center' });
    const rule = box(end, 900, 566, 120, 2, 'abs', { background: '#5e6270' });
    const built = box(end, 0, 610, 1920, 80, 'abs', { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '24px' });
    el('div', null, built, { fontSize: '26px', color: C.soft }, 'Built on');
    const lg = el('img', null, built, { height: '70px' });
    lg.src = '../brand/logos/redbelly-horizontal-negative.svg';
    lg.dataset.tx = 'Redbelly Network';
    const disc1 = txt(end, 0, 950, 'Illustrative example. General information only, and not financial or legal advice.', 20, 400, C.soft, { width: '1920px', textAlign: 'center' });

    const l18 = L('L18'), l19 = L('L19');
    const cues = [W('L18', 'fund'), W('L18', 'strategy'), W('L18', 'licence')];
    const wTokens = W('L19', 'tokens');
    const endT = l19.end + 0.35;
    return (t) => {
      ws.forEach((w, i) => show(w, ein(t, cues[i] - 0.2, 0.5), 16));
      show(fund, ein(t, l18.start - 0.5, 0.8), 20);
      morph.forEach(({ sq, tk, i, j }) => {
        const k = eio(t, wTokens - 0.2 + i * 0.08 + j * 0.04, 0.5);
        sq.style.opacity = 1 - k;
        tk.style.opacity = k;
        tk.style.transform = `scale(${lerp(0.4, 1, k)})`;
      });
      show(on, ein(t, W('L19', 'redbelly') - 0.2, 0.5), 12);
      const e = eio(t, endT, 0.8);
      end.style.transform = `translateY(${(1 - e) * 1080}px)`;
      show(name, ein(t, endT + 0.45, 0.7), 20);
      show(url, ein(t, endT + 0.65, 0.7), 16);
      rule.style.opacity = ein(t, endT + 0.8, 0.6);
      show(built, ein(t, endT + 0.95, 0.7), 14);
      disc1.style.opacity = ein(t, endT + 1.2, 0.7);
    };
  });

  // ---------- chrome: step tracker and illustrative tag ----------
  const steps = ['Legal review', 'Set the rules', 'Verify investors', 'Issue on Redbelly', 'Transfers'];
  const stepper = el('div', null, stage); stepper.id = 'stepper';
  const pills = steps.map((s, i) => {
    const p = el('div', 'step', stepper);
    const n = el('div', 'num', p);
    const nt = el('span', null, n, null, String(i + 1));
    const ck = el('span', null, n, { position: 'absolute', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    ck.innerHTML = svgIcon('check', 20, C.ink, 2.6);
    n.style.position = 'relative';
    el('span', null, p, null, s);
    return { p, n, nt, ck };
  });
  const tag = el('div', null, stage); tag.id = 'tag';
  el('div', 'dot', tag);
  el('span', null, tag, null, 'Illustrative example');
  tag.style.left = '64px'; tag.style.right = 'auto';

  const stepScenes = ['S03', 'S04', 'S05', 'S06', 'S07'].map(id => sceneById[id]);

  function chrome(t) {
    const s3 = sceneById.S03, s8 = sceneById.S08, s9 = sceneById.S09;
    const vis = ein(t, s3.start - 0.2, 0.6) * (1 - eio(t, s8.start - 0.3, 0.6));
    stepper.style.opacity = vis;
    stepper.style.transform = `translateY(${(1 - ein(t, s3.start - 0.2, 0.6)) * -16}px)`;
    pills.forEach((o, i) => {
      const sc = stepScenes[i];
      const a = eio(t, sc.start - 0.25, 0.5) * (1 - eio(t, sc.end - 0.25, 0.5));
      const done = eio(t, sc.end - 0.25, 0.5);
      o.p.style.background = mix('#ffffff', C.ink, a);
      o.p.style.borderColor = mix('#e1e4e8', C.ink, a);
      o.p.style.color = mix(C.muted, '#ffffff', a);
      o.n.style.background = mix(C.fill, C.mint, Math.max(a, done));
      o.n.style.color = C.ink;
      o.nt.style.opacity = 1 - done;
      o.ck.style.opacity = done;
    });
    const dark = eio(t, s8.start - 0.3, 0.8) * (1 - eio(t, s9.start - 0.3, 0.8));
    bgDark.style.opacity = dark;
    gridDark.style.opacity = dark;
    grid.style.opacity = 1 - dark;
    const drift = (t * 6) % 40;
    grid.style.backgroundPosition = `${drift}px ${drift * 0.5}px`;
    gridDark.style.backgroundPosition = `${drift}px ${drift * 0.5}px`;
    const endT = L('L19').end + 0.35;
    tag.style.opacity = (1 - dark) * (1 - eio(t, endT, 0.5)) * ein(t, 0.2, 0.6);
  }

  // ---------- frame entry point ----------
  const last = TL.scenes[TL.scenes.length - 1].id;
  window.seek = function seek(t) {
    for (const sc of SCENES) {
      const s = sceneById[sc.id];
      // Outgoing scene clears just before the cut, incoming scene builds just after it.
      const kin = s.start <= 0 ? 1 : eio(t, s.start - 0.05, 0.45);
      const kout = sc.id === last ? 1 : 1 - eio(t, s.end - 0.4, 0.4);
      const k = Math.min(kin, kout);
      if (k <= 0.001) { sc.root.style.display = 'none'; continue; }
      sc.root.style.display = 'block';
      sc.root.style.opacity = k;
      sc.root.style.transform = `translateY(${(1 - kin) * 26 - (1 - kout) * 26}px)`;
      sc.render(t);
    }
    chrome(t);
  };

  // On screen text per scene, for the script consistency check.
  window.collectText = function collectText() {
    const out = {};
    const add = (key, e) => {
      const s = (e.dataset.tx || e.textContent).trim();
      if (!s) return;
      (out[key] = out[key] || new Set()).add(s);
    };
    for (const sc of SCENES) sc.root.querySelectorAll('.tx,[data-tx]').forEach(e => add(sc.id, e));
    stepper.querySelectorAll('.tx').forEach(e => add('chrome', e));
    tag.querySelectorAll('.tx').forEach(e => add('chrome', e));
    return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, [...v]]));
  };
})();
