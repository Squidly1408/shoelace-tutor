/* Tie My Shoes! - vanilla JS shoelace tutor. No build step. */
(() => {
  'use strict';

  const NS = 'http://www.w3.org/2000/svg';
  const N = 64; // points per lace after resampling
  const COLORS = {
    red: { main: '#e63946', dark: '#a4161a', name: 'red' },
    blue: { main: '#1d6fd8', dark: '#0b3d91', name: 'blue' },
  };
  const reducedMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- geometry helpers ---------------- */
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function catmull(p0, p1, p2, p3, t) {
    const t2 = t * t, t3 = t2 * t;
    return [0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t +
      (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
      (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
  }
  function densify(c) {
    const out = [];
    for (let i = 0; i < c.length - 1; i++) {
      const p0 = c[i - 1] || c[i], p1 = c[i], p2 = c[i + 1], p3 = c[i + 2] || c[i + 1];
      for (let s = 0; s < 12; s++) out.push(catmull(p0, p1, p2, p3, s / 12));
    }
    out.push(c[c.length - 1]);
    return out;
  }
  function resample(ctrl) {
    const d = densify(ctrl);
    const cum = [0];
    for (let i = 1; i < d.length; i++) cum.push(cum[i - 1] + dist(d[i], d[i - 1]));
    const total = cum[cum.length - 1];
    const out = [];
    let j = 0;
    for (let k = 0; k < N; k++) {
      const target = total * k / (N - 1);
      while (j < d.length - 2 && cum[j + 1] < target) j++;
      const seg = (cum[j + 1] - cum[j]) || 1;
      const u = clamp((target - cum[j]) / seg, 0, 1);
      out.push([lerp(d[j][0], d[j + 1][0], u), lerp(d[j][1], d[j + 1][1], u)]);
    }
    return out;
  }
  const mir = pts => pts.map(p => [400 - p[0], p[1]]);
  const pathD = pts => 'M' + pts.map(p => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');

  /* ---------------- lace keyframes ----------------
     Shoe seen from above, toe at the top. Red lace leaves the LEFT top eyelet,
     blue lace leaves the RIGHT top eyelet. K is where the knot sits. */
  const L = [175, 238], R = [225, 238], K = [200, 218];

  function S(def) {
    return {
      red: resample(def.red),
      blue: resample(def.blue || mir(def.red)),
      top: def.top || 'red',
      over: def.over || null,
      knot: def.knot || 0,
    };
  }

  const redRest = [L, [140, 250], [100, 275], [70, 322], [58, 372]];
  const REST = S({ red: redRest });
  const HOLD = S({ red: [L, [135, 240], [95, 228], [52, 205]] });
  const CROSS = S({
    red: [L, [188, 222], [212, 198], [245, 172], [285, 150]],
    blue: [R, [212, 222], [188, 198], [155, 172], [115, 150]],
    top: 'red',
  });
  const TUCK = S({
    red: [L, [190, 222], [210, 204], [226, 214], [216, 238], [194, 248], [165, 242]],
    blue: [R, [212, 222], [194, 205], [165, 182], [125, 162]],
    top: 'blue', over: { lace: 'red', a: 0.05, b: 0.3 },
  });
  const TIGHT = S({ red: [L, K, [160, 208], [115, 196], [70, 185]], knot: 1 });

  const redLoop = [L, K, [170, 200], [130, 160], [112, 118], [135, 96], [162, 118], [178, 165], [192, 206], [170, 240], [140, 268]];
  const EARS1 = S({ red: redLoop, blue: TIGHT_blue(), knot: 1 });
  const EARS2 = S({ red: redLoop, knot: 1 });
  const crossRed = [L, K, [185, 195], [200, 160], [230, 115], [262, 98], [274, 126], [242, 168], [205, 208], [170, 240], [140, 268]];
  const EARS3 = S({ red: crossRed, top: 'red', knot: 1 });
  const tuckRed = [L, K, [215, 228], [238, 258], [234, 292], [208, 304], [192, 274], [200, 238], [170, 248], [140, 270]];
  const EARS4 = S({ red: tuckRed, blue: mir(crossRed), top: 'blue', knot: 1 });
  const bowRed = [L, K, [170, 208], [130, 192], [96, 172], [88, 145], [118, 138], [158, 170], [194, 214], [172, 258], [152, 306]];
  const BOW = S({ red: bowRed, top: 'red', knot: 1.25 });

  const SWOOP = S({
    red: redLoop,
    blue: [R, K, [240, 205], [242, 172], [205, 156], [160, 158], [134, 176], [152, 198], [200, 200], [240, 216], [278, 238]],
    top: 'red', over: { lace: 'blue', a: 0.2, b: 0.52 }, knot: 1,
  });
  const smallRedLoop = [L, K, [172, 202], [140, 170], [124, 136], [142, 118], [164, 134], [180, 172], [193, 208], [170, 242], [142, 270]];
  const PUSH = S({
    red: smallRedLoop,
    blue: [R, K, [190, 200], [172, 190], [182, 176], [214, 176], [252, 148], [286, 114], [304, 138], [274, 170], [228, 202], [232, 242], [262, 270]],
    top: 'red', knot: 1,
  });

  function TIGHT_blue() { return mir([L, K, [160, 208], [115, 196], [70, 185]]); }

  /* ---------------- lessons ---------------- */
  const commonStart = [
    { text: 'Hold one lace in each hand. Red is left, blue is right!', ptext: 'Pick up the laces! Drag the red end to the star.',
      frames: [HOLD], move: { lace: 'red', from: [58, 372], to: [52, 205] } },
    { text: 'Cross the red lace over the blue lace to make an X.', ptext: 'Drag the red lace over to make an X.',
      frames: [CROSS], move: { lace: 'red', from: [52, 205], to: [285, 150] } },
    { text: 'Tuck the red lace under and through the hole.', ptext: 'Tuck the red lace under. Drag it to the star.',
      frames: [TUCK], move: { lace: 'red', from: [285, 150], to: [165, 242] } },
    { text: 'Pull both laces tight. That is the first knot!', ptext: 'Pull the blue lace tight! Drag it to the star.',
      frames: [TIGHT], move: { lace: 'blue', from: [125, 162], to: [330, 185] } },
  ];

  const METHODS = {
    bunny: {
      name: 'Bunny Ears', sticker: '🐰', practiceSticker: '🥕',
      rhyme: 'Criss-cross, tuck it under,\npull it tight, you little wonder!\nBunny ear, bunny ear, standing up tall,\ncross them, tuck them, pull them... that\'s all!',
      steps: [
        ...commonStart,
        { text: 'Make a loop with the red lace. A bunny ear!', ptext: 'Make a red bunny ear! Drag the red lace up to the star.',
          frames: [EARS1], move: { lace: 'red', from: [70, 185], to: [122, 100] } },
        { text: 'Make a loop with the blue lace. Two bunny ears!', ptext: 'Now a blue bunny ear! Drag the blue lace up.',
          frames: [EARS2], move: { lace: 'blue', from: [330, 185], to: [278, 100] } },
        { text: 'Cross the bunny ears to make an X.', ptext: 'Cross the ears! Drag the red ear to the star.',
          frames: [EARS3], move: { lace: 'red', from: [122, 100], to: [268, 106] } },
        { text: 'Tuck the red ear under and through the hole.', ptext: 'Tuck the red ear down through the hole.',
          frames: [EARS4], move: { lace: 'red', from: [268, 106], to: [212, 300] } },
        { text: 'Pull both ears out tight. Hooray, a bow!', ptext: 'Pull the blue ear tight to make a bow!',
          frames: [BOW], move: { lace: 'blue', from: [134, 106], to: [308, 148] } },
      ],
    },
    loop: {
      name: 'Loop, Swoop & Pull', sticker: '🌀', practiceSticker: '🚀',
      rhyme: 'Make a loop and hold it tight,\nswoop the blue lace round... that\'s right!\nPush it through the little door,\npull both loops... now tie some more!',
      steps: [
        ...commonStart,
        { text: 'Make one loop with the red lace and hold it.', ptext: 'Make a red loop! Drag the red lace up to the star.',
          frames: [EARS1], move: { lace: 'red', from: [70, 185], to: [122, 100] } },
        { text: 'Swoop the blue lace all the way around the loop.', ptext: 'Swoop! Drag the blue lace around the red loop.',
          frames: [SWOOP], move: { lace: 'blue', from: [330, 185], to: [138, 180] } },
        { text: 'Push the blue lace through the hole to make a loop.', ptext: 'Push the blue lace through to make a loop.',
          frames: [PUSH], move: { lace: 'blue', from: [278, 238], to: [296, 122] } },
        { text: 'Pull both loops tight. You tied a bow!', ptext: 'Pull the red loop tight to finish the bow!',
          frames: [BOW], move: { lace: 'red', from: [132, 124], to: [92, 150] } },
      ],
    },
  };

  const stateBefore = (method, i) => (i === 0 ? REST : last(METHODS[method].steps[i - 1].frames));
  const last = a => a[a.length - 1];

  function lerpState(a, b, t) {
    return {
      red: a.red.map((p, i) => [lerp(p[0], b.red[i][0], t), lerp(p[1], b.red[i][1], t)]),
      blue: a.blue.map((p, i) => [lerp(p[0], b.blue[i][0], t), lerp(p[1], b.blue[i][1], t)]),
      top: t < 0.5 ? a.top : b.top,
      over: t < 0.5 ? a.over : b.over,
      knot: lerp(a.knot, b.knot, t),
    };
  }
  function stateAt(prev, frames, t) {
    const seq = [prev, ...frames];
    const n = frames.length;
    const u = clamp(t, 0, 1) * n;
    const i = Math.min(Math.floor(u), n - 1);
    return lerpState(seq[i], seq[i + 1], ease(u - i));
  }

  /* ---------------- SVG scene ---------------- */
  const SHOE = `
  <defs>
    <linearGradient id="knotGrad" x1="0" x2="1"><stop offset=".5" stop-color="#e63946"/><stop offset=".5" stop-color="#1d6fd8"/></linearGradient>
    <radialGradient id="shoeGrad" cx="50%" cy="38%" r="72%"><stop offset="0" stop-color="#ffe98a"/><stop offset="1" stop-color="#ffc21a"/></radialGradient>
  </defs>
  <ellipse cx="200" cy="436" rx="130" ry="9" fill="rgba(43,35,80,.12)"/>
  <path d="M200,14 C292,14 328,92 326,172 C324,252 308,300 308,352 C308,414 266,432 200,432 C134,432 92,414 92,352 C92,300 76,252 74,172 C72,92 108,14 200,14Z" fill="#fff" stroke="#3d2f6b" stroke-width="5"/>
  <path d="M200,26 C282,26 314,96 312,172 C310,248 296,296 296,350 C296,404 258,420 200,420 C142,420 104,404 104,350 C104,296 90,248 88,172 C86,96 118,26 200,26Z" fill="url(#shoeGrad)" stroke="#3d2f6b" stroke-width="3"/>
  <path d="M106,118 C110,58 156,30 200,30 C244,30 290,58 294,118 C262,98 138,98 106,118Z" fill="#ff8c42" stroke="#3d2f6b" stroke-width="3"/>
  <circle cx="150" cy="70" r="7" fill="#fff" opacity=".7"/><circle cx="250" cy="70" r="7" fill="#fff" opacity=".7"/><circle cx="200" cy="56" r="7" fill="#fff" opacity=".7"/>
  <ellipse cx="200" cy="350" rx="80" ry="60" fill="#ff8c42" stroke="#3d2f6b" stroke-width="3"/>
  <ellipse cx="200" cy="356" rx="62" ry="44" fill="#6b4a3a"/>
  <ellipse cx="200" cy="362" rx="50" ry="34" fill="#c9f0d9" stroke="#3d2f6b" stroke-width="2"/>
  <path d="M168,98 C168,84 232,84 232,98 L238,300 C238,312 162,312 162,300Z" fill="#fff4bf" stroke="#3d2f6b" stroke-width="3"/>
  <path d="M146,104 L176,104 L182,252 L150,252 C144,200 142,150 146,104Z" fill="#ffb703" stroke="#3d2f6b" stroke-width="3"/>
  <path d="M254,104 L224,104 L218,252 L250,252 C256,200 258,150 254,104Z" fill="#ffb703" stroke="#3d2f6b" stroke-width="3"/>
  <g stroke-linecap="round" stroke-width="8" fill="none" opacity=".4">
    <line x1="164" y1="118" x2="200" y2="118" stroke="#e63946"/><line x1="200" y1="118" x2="236" y2="118" stroke="#1d6fd8"/>
    <line x1="164" y1="118" x2="236" y2="158" stroke="#1d6fd8"/><line x1="236" y1="118" x2="164" y2="158" stroke="#e63946"/>
    <line x1="164" y1="158" x2="234" y2="198" stroke="#1d6fd8"/><line x1="236" y1="158" x2="166" y2="198" stroke="#e63946"/>
    <line x1="166" y1="198" x2="225" y2="238" stroke="#1d6fd8"/><line x1="234" y1="198" x2="175" y2="238" stroke="#e63946"/>
  </g>
  <g fill="#fff" stroke="#3d2f6b" stroke-width="3">
    <circle cx="164" cy="118" r="7"/><circle cx="164" cy="158" r="7"/><circle cx="166" cy="198" r="7"/><circle cx="175" cy="238" r="7"/>
    <circle cx="236" cy="118" r="7"/><circle cx="236" cy="158" r="7"/><circle cx="234" cy="198" r="7"/><circle cx="225" cy="238" r="7"/>
  </g>`;

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  class Scene {
    constructor(svg) {
      this.svg = svg;
      svg.setAttribute('viewBox', '24 58 352 340');
      svg.innerHTML = SHOE;
      this.laceLayer = el('g', {}, svg);
      this.laces = { red: this.makeLace('red'), blue: this.makeLace('blue') };
      this.overG = this.makeLace('red', true);
      this.knot = el('ellipse', { cx: K[0], cy: K[1], rx: 21, ry: 14, fill: 'url(#knotGrad)', stroke: '#3d2f6b', 'stroke-width': 3 }, svg);
      this.fx = el('g', {}, svg);
      // motion arrow + hand hint
      el('defs', {}, svg).innerHTML = '<marker id="ah-' + svg.id + '" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10z" fill="#7b5cd6"/></marker>';
      this.arrow = el('path', { class: 'motion-arrow', fill: 'none', stroke: '#7b5cd6', 'stroke-width': 6, 'stroke-dasharray': '4 12', 'stroke-linecap': 'round', 'marker-end': 'url(#ah-' + svg.id + ')', opacity: 0 }, this.fx);
      this.hand = el('g', { class: 'hand-hint', opacity: 0 }, svg);
      el('circle', { r: 24, fill: '#fff', 'fill-opacity': .9, stroke: '#7b5cd6', 'stroke-width': 5 }, this.hand);
      const t = el('text', { 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 26, y: 1 }, this.hand);
      t.textContent = '👆';
      this.gen = 0;
    }
    makeLace(color, isOver) {
      const g = el('g', { fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, this.laceLayer);
      const c = COLORS[color];
      const o = {
        g,
        outline: el('path', { stroke: c.dark, 'stroke-width': 15 }, g),
        main: el('path', { stroke: c.main, 'stroke-width': 10 }, g),
        tex: el('path', { stroke: '#fff', 'stroke-width': 2.5, 'stroke-dasharray': '3 9', opacity: .55 }, g),
      };
      if (!isOver) {
        o.aglet = el('path', { stroke: '#8a8fa3', 'stroke-width': 13 }, g);
        o.agletShine = el('path', { stroke: '#d9dce6', 'stroke-width': 4 }, g);
      }
      return o;
    }
    render(s) {
      for (const c of ['red', 'blue']) {
        const o = this.laces[c], pts = s[c], d = pathD(pts);
        o.outline.setAttribute('d', d); o.main.setAttribute('d', d); o.tex.setAttribute('d', d);
        const ag = pathD(pts.slice(N - 4));
        o.aglet.setAttribute('d', ag); o.agletShine.setAttribute('d', ag);
      }
      const bottom = s.top === 'red' ? 'blue' : 'red';
      this.laceLayer.appendChild(this.laces[bottom].g);
      this.laceLayer.appendChild(this.laces[s.top].g);
      if (s.over) {
        const pts = s[s.over.lace].slice(Math.floor(s.over.a * N), Math.ceil(s.over.b * N));
        const c = COLORS[s.over.lace], d = pathD(pts);
        this.overG.outline.setAttribute('stroke', c.dark); this.overG.main.setAttribute('stroke', c.main);
        [this.overG.outline, this.overG.main, this.overG.tex].forEach(p => p.setAttribute('d', d));
        this.overG.g.style.display = '';
        this.laceLayer.appendChild(this.overG.g);
      } else {
        this.overG.g.style.display = 'none';
      }
      const k = s.knot;
      this.knot.setAttribute('opacity', clamp(k, 0, 1));
      this.knot.setAttribute('rx', 14 + 7 * k); this.knot.setAttribute('ry', 9 + 5 * k);
    }
    stop() { this.gen++; }
    /** Run tick(now) every frame until it returns false. rAF with a timer fallback so
        animations still finish if the page is throttled in the background. */
    loop(tick) {
      const g = ++this.gen;
      const step = () => {
        let fired = false;
        const run = () => {
          if (fired) return; fired = true;
          if (g !== this.gen) return;
          if (tick(performance.now()) !== false) step();
        };
        requestAnimationFrame(run); setTimeout(run, 50);
      };
      step();
    }
    setArrow(move, show) {
      if (!move) { this.arrow.setAttribute('opacity', 0); return; }
      const [a, b] = [move.from, move.to];
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      const bend = Math.min(60, len * 0.25);
      const cx = mx - dy / len * bend, cy = my + dx / len * bend;
      this.arrow.setAttribute('d', `M${a[0]} ${a[1]} Q${cx} ${cy} ${b[0]} ${b[1]}`);
      this.arrow.setAttribute('opacity', show ? .75 : 0);
      this.arrowCurve = { a, c: [cx, cy], b };
    }
    handAt(t) {
      const q = this.arrowCurve; if (!q) return;
      const u = 1 - t;
      const x = u * u * q.a[0] + 2 * u * t * q.c[0] + t * t * q.b[0];
      const y = u * u * q.a[1] + 2 * u * t * q.c[1] + t * t * q.b[1];
      this.hand.setAttribute('transform', `translate(${x + 14} ${y + 18})`);
    }
    /** Animate a step from prev state through frames. */
    play(prev, frames, move, opts = {}) {
      this.stop();
      const dur = (opts.dur || 1500) * frames.length;
      const t0 = performance.now() + (opts.delay || 0);
      this.setArrow(move, true);
      this.hand.setAttribute('opacity', move ? 1 : 0);
      this.render(prev); this.handAt(0);
      const tick = now => {
        const t = clamp((now - t0) / dur, 0, 1);
        this.render(stateAt(prev, frames, t));
        if (move) this.handAt(ease(t));
        if (t >= 1) {
          this.hand.setAttribute('opacity', 0);
          const g = this.gen;
          setTimeout(() => { if (g === this.gen) this.arrow.setAttribute('opacity', opts.keepArrow ? .35 : 0); }, 500);
          opts.done && opts.done();
          return false;
        }
      };
      this.loop(tick);
    }
  }

  /* ---------------- storage ---------------- */
  const KEY = 'shoelace-tutor-v1';
  const store = (() => {
    let data = { stars: { bunny: 0, loop: 0 }, stickers: {}, muted: false };
    try { Object.assign(data, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* ignore */ }
    data.stars = Object.assign({ bunny: 0, loop: 0 }, data.stars);
    data.stickers = data.stickers || {};
    return {
      data,
      save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignore */ } },
    };
  })();

  /* ---------------- speech + sound ---------------- */
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voice = null;
  function pickVoice() {
    if (!synth) return;
    const vs = synth.getVoices().filter(v => /^en/i.test(v.lang));
    voice = vs.find(v => /female|samantha|google uk english female|zira|aria|jenny/i.test(v.name)) || vs[0] || null;
  }
  if (synth) { pickVoice(); synth.addEventListener && synth.addEventListener('voiceschanged', pickVoice); }
  function speak(text) {
    if (!synth || store.data.muted) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\n/g, ' '));
    if (voice) u.voice = voice;
    u.rate = 0.88; u.pitch = 1.15;
    synth.speak(u);
  }
  let actx = null;
  function chime(good = true) {
    if (store.data.muted) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = good ? [660, 880, 1320] : [440, 392];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        const t = actx.currentTime + i * 0.11;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.4);
      });
    } catch (e) { /* no audio */ }
  }

  /* ---------------- UI plumbing ---------------- */
  const $ = s => document.querySelector(s);
  const screens = ['home', 'lesson', 'practice', 'stickers', 'tips'];
  let current = 'home';

  function show(name) {
    if (synth) synth.cancel();
    lessonScene.stop(); practiceScene.stop();
    screens.forEach(s => { $('#' + s).hidden = s !== name; });
    current = name;
    $('#homeBtn').hidden = name === 'home';
    window.scrollTo(0, 0);
    const h = $('#' + name + ' h1');
    if (h) h.focus({ preventScroll: true });
    if (name === 'home') refreshHome();
    if (name === 'stickers') renderStickers();
  }

  function totalStars() { return store.data.stars.bunny + store.data.stars.loop; }
  function refreshHome() {
    $('#starCount').textContent = totalStars();
    $('#starsBtn').setAttribute('aria-label', `My stickers. ${totalStars()} stars.`);
    document.querySelectorAll('[data-stars]').forEach(p => {
      const n = store.data.stars[p.dataset.stars];
      p.textContent = n ? '⭐'.repeat(Math.min(n, 5)) + (n > 5 ? ` ×${n}` : '') : 'No stars yet';
      p.setAttribute('aria-label', `${n} star${n === 1 ? '' : 's'}`);
    });
  }

  function setMuteUI() {
    const m = store.data.muted;
    $('#muteIcon').textContent = m ? '🔇' : '🔊';
    $('#muteBtn').setAttribute('aria-pressed', String(m));
    $('#muteBtn').setAttribute('aria-label', m ? 'Voice is off. Turn voice on' : 'Voice is on. Mute voice');
  }

  function dots(ol, total, i) {
    ol.innerHTML = '';
    for (let k = 0; k < total; k++) {
      const li = document.createElement('li');
      if (k < i) li.className = 'done';
      if (k === i) li.className = 'now';
      ol.appendChild(li);
    }
  }

  function confetti() {
    if (reducedMotion) return;
    const box = $('#confetti');
    const cols = ['#e63946', '#1d6fd8', '#ffcf3f', '#22a55b', '#7b5cd6', '#ff8c42'];
    for (let i = 0; i < 70; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = cols[i % cols.length];
      c.style.animationDuration = 2 + Math.random() * 2 + 's';
      c.style.animationDelay = Math.random() * 0.6 + 's';
      box.appendChild(c);
    }
    setTimeout(() => { box.innerHTML = ''; }, 5000);
  }

  /* ---------------- lesson ---------------- */
  const lessonScene = new Scene($('#lessonSvg'));
  const lesson = { method: 'bunny', i: 0 };

  function startLesson(method) {
    lesson.method = method; lesson.i = 0;
    const m = METHODS[method];
    $('#lessonTitle').textContent = m.name;
    $('#lessonRhyme').textContent = m.rhyme;
    show('lesson');
    showStep();
  }
  function showStep() {
    const m = METHODS[lesson.method], steps = m.steps, i = lesson.i, step = steps[i];
    dots($('#lessonDots'), steps.length, i);
    $('#lessonCount').textContent = `Step ${i + 1} of ${steps.length}`;
    $('#lessonText').textContent = step.text;
    $('#backBtn').disabled = i === 0;
    const lastStep = i === steps.length - 1;
    $('#nextLabel').textContent = lastStep ? 'Finish!' : 'Next';
    $('#nextBtn').setAttribute('aria-label', lastStep ? 'Finish and get a star' : 'Next step');
    speak(step.text);
    lessonScene.play(stateBefore(lesson.method, i), step.frames, step.move, { delay: 250, dur: reducedMotion ? 1700 : 1600 });
  }

  $('#nextBtn').addEventListener('click', () => {
    const steps = METHODS[lesson.method].steps;
    if (lesson.i < steps.length - 1) { lesson.i++; showStep(); }
    else finish('lesson');
  });
  $('#backBtn').addEventListener('click', () => { if (lesson.i > 0) { lesson.i--; showStep(); } });
  $('#replayBtn').addEventListener('click', showStep);
  $('#rhymeBtn').addEventListener('click', () => speak(METHODS[lesson.method].rhyme));

  /* ---------------- practice ---------------- */
  const practiceScene = new Scene($('#practiceSvg'));
  const practice = { method: 'bunny', i: 0, busy: false, selected: false };
  const pfx = el('g', {}, $('#practiceSvg'));
  const star = el('g', {}, pfx);
  const starShape = el('polygon', {
    class: 'target-star',
    points: starPoints(0, 0, 26, 12),
    fill: '#ffcf3f', stroke: '#c98a00', 'stroke-width': 4, 'stroke-linejoin': 'round',
  }, star);
  star.setAttribute('role', 'img'); star.setAttribute('aria-label', 'Star target');
  const hitStar = el('circle', { r: 46, fill: 'transparent' }, star);
  const handles = { red: makeHandle('red'), blue: makeHandle('blue') };
  const dragLine = el('path', { stroke: '#7b5cd6', 'stroke-width': 4, 'stroke-dasharray': '2 10', 'stroke-linecap': 'round', fill: 'none', opacity: 0 }, pfx);
  pfx.insertBefore(dragLine, star);

  function starPoints(cx, cy, R1, R2) {
    const p = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? R2 : R1, a = -Math.PI / 2 + k * Math.PI / 5;
      p.push((cx + r * Math.cos(a)).toFixed(1) + ',' + (cy + r * Math.sin(a)).toFixed(1));
    }
    return p.join(' ');
  }
  function makeHandle(color) {
    const g = el('g', { class: 'handle', tabindex: 0, role: 'button' }, pfx);
    const c = COLORS[color];
    el('circle', { class: 'pulse', r: 30, fill: c.main }, g);
    el('circle', { class: 'ring', r: 22, fill: '#fff', stroke: c.main, 'stroke-width': 6 }, g);
    el('circle', { r: 11, fill: c.main }, g);
    el('circle', { r: 44, fill: 'transparent' }, g); // big touch target
    g.dataset.color = color;
    return g;
  }
  const place = (g, p) => g.setAttribute('transform', `translate(${p[0]} ${p[1]})`);

  function startPractice(method) {
    practice.method = method; practice.i = 0;
    $('#practiceTitle').textContent = 'Practice: ' + METHODS[method].name;
    show('practice');
    setupTask(true);
  }
  function setupTask(sayIt) {
    const steps = METHODS[practice.method].steps, step = steps[practice.i];
    practice.busy = false; practice.selected = false;
    practice.base = stateBefore(practice.method, practice.i);
    practiceScene.stop();
    practiceScene.setArrow(null);
    practiceScene.render(practice.base);
    dots($('#practiceDots'), steps.length, practice.i);
    $('#practiceText').textContent = step.ptext;
    setFeedback('', '');
    const mv = step.move, other = mv.lace === 'red' ? 'blue' : 'red';
    place(handles[mv.lace], mv.from);
    handles[mv.lace].querySelector('.pulse').style.display = '';
    handles[mv.lace].setAttribute('aria-label', `Glowing ${mv.lace} lace. Press Enter to move it to the star.`);
    const op = last(practice.base[other]);
    place(handles[other], op);
    handles[other].querySelector('.pulse').style.display = 'none';
    handles[other].setAttribute('aria-label', `${other} lace`);
    handles[other].style.display = dist(op, mv.from) < 50 ? 'none' : '';
    handles[mv.lace].style.display = '';
    pfx.appendChild(handles[other]); pfx.appendChild(handles[mv.lace]);
    place(star, mv.to); star.style.display = '';
    starShape.classList.remove('hot');
    if (sayIt) speak(step.ptext);
  }
  function setFeedback(text, kind) {
    const f = $('#practiceFeedback');
    f.textContent = text; f.className = 'feedback ' + (kind || '');
  }
  function svgPoint(e) {
    const svg = $('#practiceSvg');
    const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    return [p.x, p.y];
  }
  const curStep = () => METHODS[practice.method].steps[practice.i];

  function oops(color) {
    const mv = curStep().move;
    const h = handles[color];
    h.classList.remove('wiggle'); void h.getBBox(); h.classList.add('wiggle');
    const msg = `Nice try! Let's use the glowing ${mv.lace} lace first.`;
    setFeedback(msg, 'oops'); speak(msg); chime(false);
  }

  function success() {
    if (practice.busy) return;
    practice.busy = true;
    const step = curStep(), mv = step.move;
    star.style.display = 'none';
    handles.red.style.display = handles.blue.style.display = 'none';
    dragLine.setAttribute('opacity', 0);
    const from = practice.progress || 0;
    practice.progress = 0;
    const cheers = ['Great job!', 'Super!', 'You did it!', 'Wow, well done!', 'Brilliant!', 'Fantastic!'];
    const cheer = cheers[Math.floor(Math.random() * cheers.length)];
    setFeedback('⭐ ' + cheer, 'good'); chime(true); speak(cheer);
    // finish the move from where the finger left it
    const t0 = performance.now(), dur = 900 * step.frames.length;
    const tick = now => {
      const t = clamp((now - t0) / dur, 0, 1);
      practiceScene.render(stateAt(practice.base, step.frames, from + (1 - from) * ease(t)));
      if (t < 1) return;
      setTimeout(() => {
        if (current !== 'practice') return;
        if (practice.i < METHODS[practice.method].steps.length - 1) { practice.i++; setupTask(true); }
        else finish('practice');
      }, 1300);
      return false;
    };
    practiceScene.loop(tick);
  }

  function springBack(from) {
    const step = curStep(), mv = step.move;
    const t0 = performance.now();
    const tick = now => {
      const t = clamp((now - t0) / 400, 0, 1);
      const p = from * (1 - ease(t));
      practiceScene.render(stateAt(practice.base, step.frames, p));
      const hp = [lerp(practice.dragPos[0], mv.from[0], ease(t)), lerp(practice.dragPos[1], mv.from[1], ease(t))];
      place(handles[mv.lace], hp);
      return t < 1;
    };
    practiceScene.loop(tick);
  }

  // Pointer handling
  let drag = null;
  Object.values(handles).forEach(h => {
    h.addEventListener('pointerdown', e => {
      if (practice.busy) return;
      e.preventDefault();
      const mv = curStep().move;
      if (h.dataset.color !== mv.lace) { oops(h.dataset.color); return; }
      practiceScene.stop();
      try { h.setPointerCapture(e.pointerId); } catch (err) { /* synthetic events */ }
      drag = { id: e.pointerId, start: svgPoint(e), moved: false };
      practice.dragPos = mv.from.slice();
    });
    h.addEventListener('pointermove', e => {
      if (!drag || drag.id !== e.pointerId) return;
      const step = curStep(), mv = step.move, p = svgPoint(e);
      if (dist(p, drag.start) > 8) drag.moved = true;
      if (!drag.moved) return;
      practice.dragPos = p;
      place(h, p);
      const total = dist(mv.from, mv.to) || 1;
      const prog = clamp(1 - dist(p, mv.to) / total, 0, 1);
      practice.progress = prog * 0.85;
      practiceScene.render(stateAt(practice.base, step.frames, practice.progress));
      dragLine.setAttribute('d', `M${mv.from[0]} ${mv.from[1]} L${p[0]} ${p[1]}`);
      dragLine.setAttribute('opacity', .6);
      starShape.classList.toggle('hot', dist(p, mv.to) < 55);
    });
    const end = e => {
      if (!drag || drag.id !== e.pointerId) return;
      const mv = curStep().move, wasMoved = drag.moved;
      drag = null;
      dragLine.setAttribute('opacity', 0);
      if (!wasMoved) {
        practice.selected = true;
        const msg = 'Good! Now tap the star, or drag me there.';
        setFeedback(msg, ''); speak(msg);
        return;
      }
      if (dist(practice.dragPos, mv.to) < 58) success();
      else {
        const msg = 'Almost! Bring it all the way to the star.';
        setFeedback(msg, 'oops'); speak(msg);
        starShape.classList.remove('hot');
        springBack(practice.progress || 0);
        practice.progress = 0;
      }
    };
    h.addEventListener('pointerup', end);
    h.addEventListener('pointercancel', end);
    h.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (practice.busy) return;
      if (h.dataset.color !== curStep().move.lace) oops(h.dataset.color);
      else { practice.progress = 0; success(); }
    });
  });
  star.addEventListener('pointerdown', e => {
    if (practice.busy) return;
    e.preventDefault();
    if (practice.selected) { practice.progress = 0; success(); }
    else {
      const msg = `First touch the glowing ${curStep().move.lace} lace.`;
      setFeedback(msg, ''); speak(msg);
    }
  });

  $('#hintBtn').addEventListener('click', () => {
    if (practice.busy) return;
    const step = curStep();
    practice.busy = true;
    handles.red.style.display = handles.blue.style.display = 'none';
    setFeedback('Watch me!', '');
    speak(step.text);
    practiceScene.play(practice.base, step.frames, step.move, {
      dur: 1500,
      done: () => setTimeout(() => {
        if (current !== 'practice') return;
        setupTask(false);
        setFeedback('Your turn!', ''); speak('Your turn!');
      }, 800),
    });
  });
  $('#restartBtn').addEventListener('click', () => { practice.i = 0; setupTask(true); });

  /* ---------------- rewards ---------------- */
  let lastFinish = null;
  function finish(kind) {
    const method = kind === 'lesson' ? lesson.method : practice.method;
    const m = METHODS[method];
    const id = method + '-' + kind;
    const isNew = !store.data.stickers[id];
    store.data.stickers[id] = (store.data.stickers[id] || 0) + 1;
    store.data.stars[method] += 1;
    store.save();
    refreshHome();
    lastFinish = { kind, method };
    const sticker = kind === 'lesson' ? m.sticker : m.practiceSticker;
    $('#celSticker').textContent = sticker;
    $('#celTitle').textContent = kind === 'lesson' ? 'You did it!' : 'Practice star!';
    $('#celText').textContent = isNew ? `You earned a star and a new ${m.name} sticker!` : 'You earned another star!';
    $('#celRhyme').textContent = m.rhyme;
    confetti(); chime(true);
    speak((isNew ? 'Hooray! You earned a star and a new sticker! ' : 'Hooray! Another star! ') + 'Want to say the rhyme?');
    const d = $('#celebrate');
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function closeCel() { const d = $('#celebrate'); if (d.close) d.close(); else d.removeAttribute('open'); }
  $('#celRhymeBtn').addEventListener('click', () => speak(METHODS[lastFinish.method].rhyme));
  $('#celAgainBtn').addEventListener('click', () => {
    closeCel();
    lastFinish.kind === 'lesson' ? startLesson(lastFinish.method) : startPractice(lastFinish.method);
  });
  $('#celHomeBtn').addEventListener('click', () => { closeCel(); show('home'); });

  const STICKERS = [
    { id: 'bunny-lesson', em: '🐰', label: 'Bunny Ears', how: 'Finish the lesson' },
    { id: 'bunny-practice', em: '🥕', label: 'Bunny Practice', how: 'Finish practice' },
    { id: 'loop-lesson', em: '🌀', label: 'Loop & Swoop', how: 'Finish the lesson' },
    { id: 'loop-practice', em: '🚀', label: 'Swoop Practice', how: 'Finish practice' },
  ];
  function renderStickers() {
    const grid = $('#stickerGrid');
    grid.innerHTML = '';
    STICKERS.forEach(s => {
      const n = store.data.stickers[s.id] || 0;
      const li = document.createElement('li');
      li.className = 'sticker' + (n ? ' got' : '');
      li.innerHTML = `<span class="em" aria-hidden="true">${s.em}</span><span class="lbl">${s.label}</span><span class="st">${n ? `Done ${n} time${n === 1 ? '' : 's'}!` : s.how}</span>`;
      li.setAttribute('aria-label', `${s.label} sticker: ${n ? 'earned' : 'not earned yet. ' + s.how}`);
      grid.appendChild(li);
    });
    const t = totalStars();
    $('#starSummary').textContent = t ? `You have ${t} star${t === 1 ? '' : 's'}! ${'⭐'.repeat(Math.min(t, 10))}` : 'Finish a lesson or practice to earn stars and stickers!';
  }
  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all stars and stickers?')) return;
    store.data.stars = { bunny: 0, loop: 0 }; store.data.stickers = {};
    store.save(); renderStickers(); refreshHome();
  });

  /* ---------------- wiring ---------------- */
  document.querySelectorAll('[data-learn]').forEach(b => b.addEventListener('click', () => startLesson(b.dataset.learn)));
  document.querySelectorAll('[data-practice]').forEach(b => b.addEventListener('click', () => startPractice(b.dataset.practice)));
  document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => show(b.dataset.go)));
  $('#homeBtn').addEventListener('click', () => show('home'));
  $('#starsBtn').addEventListener('click', () => show('stickers'));
  $('#muteBtn').addEventListener('click', () => {
    store.data.muted = !store.data.muted; store.save(); setMuteUI();
    if (store.data.muted && synth) synth.cancel();
    else speak('Voice on!');
  });
  document.addEventListener('keydown', e => {
    if (current !== 'lesson' || e.target.closest('button, [tabindex]') && e.key === ' ') return;
    if (e.key === 'ArrowRight') $('#nextBtn').click();
    if (e.key === 'ArrowLeft' && !$('#backBtn').disabled) $('#backBtn').click();
  });

  setMuteUI();
  refreshHome();
  lessonScene.render(REST);
  practiceScene.render(REST);

  // test hook (harmless): lets automated checks jump to a lesson state
  window.__tutor = { METHODS, startLesson, startPractice, stateAt, lessonScene, REST };
})();
