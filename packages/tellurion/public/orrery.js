// The Orrery. Canvas plate of the whole TBK universe:
//   planets   products and projects, mass from their real record
//   moons     features, orbiting the product that owns them
//   belt      tools, an instrument belt clustered by trade
//   ring      processes, the engraved governance ring that encloses everything
//   comets    workflows, cutting across every orbit
//   rim       the timeline, a scrubbable arc of every dated milestone
// Everything is drawn from the world object; nothing here invents data.
// Labels go through one priority pass: flagships first, then the ring, then
// minors, then comets, then belt trades. A colliding label is dropped, never stacked.

const TAU = Math.PI * 2;
const rad = (deg) => (deg * Math.PI) / 180;

// Reduced motion is honoured live, not just at load: someone can turn it on
// while the instrument is open. Every animated term reads this, so the plate
// settles on its resting frame rather than simply slowing down.
const RM_QUERY = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
let REDUCED = !!(RM_QUERY && RM_QUERY.matches);
if (RM_QUERY) {
  const onRM = (e) => { REDUCED = !!e.matches; };
  if (RM_QUERY.addEventListener) RM_QUERY.addEventListener('change', onRM);
  else if (RM_QUERY.addListener) RM_QUERY.addListener(onRM);
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
const frac = (id, salt = 0) => mulberry32(hash32(id) + salt)();

// Hand-tuned flagship placement: ring fraction of R, phase in degrees.
// Composition, not physics: the giants get room, neighbours get separation.
const FLAGSHIP_SEAT = {
  'fusion':          { ring: 0.205, phase: 348 },
  'agentic-loop':    { ring: 0.205, phase: 168 },
  'zangetsu':        { ring: 0.285, phase: 258 },
  'features-ledger': { ring: 0.285, phase: 84 },
  'sentinel':        { ring: 0.365, phase: 196 },
  'yatagarasu':      { ring: 0.365, phase: 318 },
  'prometheus':      { ring: 0.365, phase: 80 },
  'shakeeb':         { ring: 0.447, phase: 24 },
  'tetsujin':        { ring: 0.447, phase: 206 },
  'occ':             { ring: 0.527, phase: 122 },
};
const RING_FRACS = [0.205, 0.285, 0.365, 0.447, 0.527];
const MINOR_BAND = [0.588, 0.626];
const BELT_BAND = [0.678, 0.716];
const PROC_R = 0.792;
const RIM_R = 0.872;

const GROUP_ORDER = ['fleet', 'guardrails', 'engines', 'ledgers', 'publishing', 'ops', 'bench'];
const MARQUEE_FLOWS = new Set(['apex', 'inception', 'genesis', 'design-engine', 'real-user-walk', 'deep-audit']);

export function initOrrery(canvas) {
  const ctx = canvas.getContext('2d');
  let world = null;
  let view = { scrubT: null, hover: null, focus: null };
  let css = {};
  let W = 0, H = 0, DPR = 1, CX = 0, CY = 0, R = 100;
  let dateSpan = null;
  const pos = new Map();
  let bodiesDrawn = 0;
  let labelQueue = [];
  let RADIAL_LABELS = false; // set per frame from the product count
  // Filtering the bench to what a project uses freed the whole outer half of the
  // plate, and the products stayed squeezed into the inner third looking at it.
  // The product region expands to take the room when nothing is out there.
  let PLATE_SCALE = 1;
  let LBLI = 1;              // label entrance alpha
  let introStart = null;     // entrance choreography clock
  const t0 = performance.now();
  const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

  function retheme() {
    const s = getComputedStyle(document.documentElement);
    const v = (n) => s.getPropertyValue(n).trim();
    css = {
      ink: v('--ink'), ink70: v('--ink-70'), ink45: v('--ink-45'), ink28: v('--ink-28'),
      line: v('--line'), lineFaint: v('--line-faint'),
      blue: v('--blue'), blueDeep: v('--blue-deep'), blueMid: v('--blue-mid'), blueSoft: v('--blue-soft'),
      live: v('--live'), fault: v('--fault'), ghost: v('--ghost'),
      card: v('--card'), paper: v('--paper'),
      pink: v('--pink'), purple: v('--purple'), purpleSoft: v('--purple-soft'), amber: v('--amber'),
      dark: document.documentElement.dataset.mode === 'observatory',
      // From the stylesheet, so a register the canvas has never heard of still
      // knocks its labels out against its own paper. The literal stays as the
      // fallback for a stylesheet that predates the token.
      halo: v('--halo') || (document.documentElement.dataset.mode === 'observatory' ? 'rgba(3,10,28,.82)' : 'rgba(245,247,251,.85)'),
    };
  }

  function resize() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    const b = canvas.getBoundingClientRect();
    W = b.width; H = b.height;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    // The plate caption and the rim words are gone, so the margin they needed
    // goes back to the drawing: the orrery is the thing on this half of the
    // screen and it should take the room.
    CX = W * 0.5; CY = H * 0.5;
    R = Math.min(W, H) * 0.5 - 4;
  }

  // WHEN EACH BODY ARRIVED, as its own clock.
  //
  // The entrance used to be one global stopwatch reset by setWorld, and setWorld
  // runs on every snapshot — which the server sends whenever the plan or a
  // sign-off file changes. So on any project being actively worked, the whole
  // plate restarted its entrance several times a minute: every planet re-swept
  // into its seat, every arc redrew itself, and the labels (which fade in at
  // 1250ms) never survived long enough to be readable. The plate looked busiest
  // exactly when it had the most to say.
  //
  // A body's entrance belongs to the BODY, not to the frame it first appeared
  // in. First sighting is stamped here and never reset, so a new product sweeps
  // in while everything already on the plate stays exactly where it was.
  const births = new Map();
  let worldKey = null;
  function stampBirths(w) {
    const now = performance.now();
    const ids = [];
    for (const p of (w.stat.planets || [])) ids.push(p.id);
    for (const f of (w.stat.features || [])) ids.push(f.id);
    for (const x of (w.stat.tools || [])) ids.push(x.id);
    for (const x of (w.stat.processes || [])) ids.push(x.id);
    for (const x of (w.stat.workflows || [])) ids.push(x.id);
    for (const id of ids) if (!births.has(id)) births.set(id, now);
  }
  // The clock an entrance is measured from. A body that has been on the plate
  // since before this snapshot returns its own, older stamp, so easeOut has
  // long since reached 1 and it simply stays put.
  const bornAt = (id) => (births.has(id) ? births.get(id) : (introStart == null ? -1e9 : introStart));
  const entrance = (id, delay, dur) => easeOut((performance.now() - bornAt(id) - delay) / dur);

  function setWorld(w) {
    // A DIFFERENT PROJECT is a new plate and earns the full entrance; the same
    // project sending its 40th snapshot of the afternoon does not.
    const key = (w.project && w.project.root) || '';
    if (key !== worldKey) { worldKey = key; introStart = performance.now(); births.clear(); }
    world = w;
    stampBirths(w);
    const dated = w.stat.milestones.filter(m => m.date).map(m => +new Date(m.date + 'T12:00:00Z'));
    dateSpan = dated.length ? { min: Math.min(...dated), max: Math.max(...dated) } : null;
    retheme();
  }
  const setView = (v) => { view = { ...view, ...v }; };
  // Names on the plate are OPT-IN, not drawn by default. Wassim, 2026-08-28:
  // "I don't think the name issue is much of a problem because I think they
  // could just appear on hover." He is right, and it dissolves the layout
  // problem rather than working around it: 26 names cannot collide if 25 of
  // them are not drawn. 'all' keeps the old behaviour for anyone who wants the
  // whole plate legible at once.
  let labelMode = 'hover';
  const setLabels = (m) => { labelMode = m === 'all' ? 'all' : 'hover'; };
  const getLabels = () => labelMode;
  // The bench is drawn only where this project has actually USED it. It used to
  // be drawn in full on every project from the first second, so a plate spent
  // most of its space on 88 things the operator had never touched.
  // What the plate draws, by KIND. "I should be able to remove a workflow or
  // workflows in general to have them not appear here, if I want to."
  let hidden = new Set();
  const setHidden = (arr) => { hidden = new Set(arr || []); };
  const getHidden = () => [...hidden];
  const shows = (k) => !hidden.has(k);
  let benchMode = 'used';
  const setBench = (m) => { benchMode = m === 'all' ? 'all' : 'used'; };
  const getBench = () => benchMode;
  const usedHere = (id) => benchMode === 'all' || !!(world && world.usage && world.usage[id]);

  /* ------------------------------------------------- derived */

  function msOf(pid) { return world.stat.milestones.filter(m => m.entity === pid); }
  function featsOf(pid) { return world.stat.features.filter(f => f.parent === pid); }

  function bornBy(pid, T) {
    const ms = msOf(pid).filter(m => m.date);
    if (!ms.length) return true;
    const first = Math.min(...ms.map(m => +new Date(m.date + 'T12:00:00Z')));
    return first <= T;
  }
  function massOf(pid, T) {
    const ms = msOf(pid).filter(m => m.status !== 'planned');
    const n = T == null ? ms.length : ms.filter(m => m.date && +new Date(m.date + 'T12:00:00Z') <= T).length;
    return { ms: n, feats: featsOf(pid).length };
  }
  function planetRadius(p, T) {
    const { ms, feats } = massOf(p.id, T);
    const base = p.tier === 'flagship' ? 9 : 5;
    const k = p.tier === 'flagship' ? 2.5 : 1.5;
    return Math.min(23, base + k * Math.sqrt(ms + feats * 0.55));
  }

  function planetAngle(p, i, t, dyn) {
    const seat = FLAGSHIP_SEAT[p.id];
    const rpm = world ? world.drive.rpm : 0.42;
    const flow = 1 + rpm / 9;
    if (seat) {
      const ringIx = RING_FRACS.indexOf(seat.ring);
      const period = 95 + ringIx * 55;
      return rad(seat.phase) + ((t / 1000) / period) * TAU * flow;
    }
    if (dyn) {
      const ringIx = i % RING_FRACS.length;
      const period = 95 + ringIx * 55;
      return rad(137.508 * i + 40) + ((t / 1000) / period) * TAU * flow;
    }
    const band = i % 2;
    const period = 380 + band * 46;
    return rad((i * 360) / 15 + 11 + frac(p.id, 3) * 14) + ((t / 1000) / period) * TAU * flow;
  }
  function planetRing(p, i, dyn) {
    const seat = FLAGSHIP_SEAT[p.id];
    const k = PLATE_SCALE;
    if (seat) return seat.ring * R * k;
    if (dyn) return RING_FRACS[i % RING_FRACS.length] * R * k;
    return MINOR_BAND[i % 2] * R * k;
  }

  /* --------------------------------------------------------- primitives */

  // A token at a chosen opacity. Canvas gradients need a colour STRING per
  // stop — globalAlpha applies to the whole stroke and cannot fade one end of
  // it — so a token has to be reopened rather than dimmed. Handles the two
  // forms the stylesheet actually produces, hex and rgb/rgba, and falls back to
  // the colour untouched rather than to a wrong one.
  function withAlpha(c, a) {
    const s = String(c || '').trim();
    let r, g, b, base = 1;
    if (s[0] === '#') {
      const h = s.length === 4 ? s[1] + s[1] + s[2] + s[2] + s[3] + s[3] : s.slice(1, 7);
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    } else {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return s;
      const p = m[1].split(',').map(parseFloat);
      r = p[0]; g = p[1]; b = p[2]; if (p.length > 3) base = p[3];
    }
    if (![r, g, b].every(Number.isFinite)) return s;
    return `rgba(${r},${g},${b},${+(base * a).toFixed(3)})`;
  }

  function line(x1, y1, x2, y2, stroke, w = 1, dash = null) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = stroke; ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke(); ctx.setLineDash([]);
  }
  function circle(x, y, r, { stroke, fill, w = 1, dash = null, alpha = 1 } = {}) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  }
  function arc(x, y, r, a0, a1, { stroke, w = 1, dash = null, alpha = 1 } = {}) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.beginPath(); ctx.arc(x, y, r, a0, a1);
    ctx.strokeStyle = stroke; ctx.lineWidth = w;
    if (dash) ctx.setLineDash(dash);
    ctx.stroke(); ctx.restore(); ctx.setLineDash([]);
  }
  function text(str, x, y, { font = '9px "JetBrains Mono"', fill, align = 'left', spacing = 0, alpha = 1 } = {}) {
    ctx.save(); ctx.globalAlpha *= alpha;
    ctx.font = font; ctx.fillStyle = fill || css.ink;
    ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
    if (spacing) {
      let cx0 = x;
      const total = [...str].reduce((a, ch) => a + ctx.measureText(ch).width + spacing, -spacing);
      if (align === 'center') cx0 = x - total / 2;
      if (align === 'right') cx0 = x - total;
      ctx.textAlign = 'left';
      for (const ch of str) { ctx.fillText(ch, cx0, y); cx0 += ctx.measureText(ch).width + spacing; }
    } else ctx.fillText(str, x, y);
    ctx.restore();
  }

  // label allocator: coarse boxes, priority pass, colliding labels are DROPPED
  let claimed = [];
  function claimBox(x, y, w, h) {
    const box = { x: x - 3, y: y - 3, w: w + 6, h: h + 6 };
    for (const b of claimed) {
      if (box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y) return false;
    }
    claimed.push(box);
    return true;
  }
  // each label brings CANDIDATE anchors; the first that claims cleanly wins.
  // Labels avoid every drawn planet and tool EXCEPT their own body.
  function queueLabel(pr, cands, owner = null) { labelQueue.push({ pr, owner, cands: Array.isArray(cands) ? cands : [cands] }); }
  function flushLabels() {
    const bodyBoxes = [];
    for (const [id, p] of pos) {
      if (p.kind !== 'product' && p.kind !== 'project' && p.kind !== 'tool') continue;
      const br = (p.blockR || p.r) * 0.82;
      bodyBoxes.push({ owner: id, x: p.x - br, y: p.y - br, w: br * 2, h: br * 2 });
    }
    const hitsBody = (box, owner) => bodyBoxes.some(b =>
      b.owner !== owner &&
      box.x < b.x + b.w && box.x + box.w > b.x && box.y < b.y + b.h && box.y + box.h > b.y);
    if (LBLI < 0.02) { labelQueue = []; return; }
    labelQueue.sort((a, b) => a.pr - b.pr);
    for (const L of labelQueue) {
      let placed = false;
      for (const c of L.cands) {
        if (!c.force && hitsBody(c.box, L.owner)) continue;
        if (claimBox(c.box.x, c.box.y, c.box.w, c.box.h)) { c.draw(); placed = true; break; }
      }
      if (!placed && L.cands.some(c => c.force)) {
        const c = L.cands.find(cc => cc.force);
        claimed.push({ x: c.box.x - 3, y: c.box.y - 3, w: c.box.w + 6, h: c.box.h + 6 });
        c.draw();
      }
    }
    labelQueue = [];
  }

  /* --------------------------------------------------------- the frame */

  function frame(nowMs) {
    if (!world) return;
    const t = performance.now() - t0;
    const T = view.scrubT;
    pos.clear();
    claimed = [];
    labelQueue = [];
    bodiesDrawn = 0;

    ctx.save();
    ctx.scale(DPR, DPR);
    ctx.clearRect(0, 0, W, H);

    const hot = view.focus || (view.hover && view.hover.id) || null;
    const dim = (id) => hot && id !== hot;
    const ti = introStart == null ? 1e9 : performance.now() - introStart;
    const ip = (d, dur) => easeOut((ti - d) / dur);
    LBLI = ip(1250, 480);

    /* -- ground -- */
    if (css.dark) {
      const rs = mulberry32(77);
      for (let i = 0; i < 150; i++) {
        const a = rs() * TAU, rr = Math.sqrt(rs()) * R * 1.04;
        const tw = 0.25 + 0.5 * Math.abs(Math.sin(t / 1400 + i));
        circle(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, rs() < 0.12 ? 1.1 : 0.55, { fill: css.ink45, alpha: 0.28 * tw });
      }
    }
    if (!css.dark) {
      const wash = ctx.createRadialGradient(CX, CY, 0, CX, CY, R * 0.55);
      wash.addColorStop(0, css.blueSoft);
      wash.addColorStop(1, 'rgba(0,119,255,0)');
      ctx.save(); ctx.globalAlpha = 0.5;
      ctx.fillStyle = wash;
      ctx.beginPath(); ctx.arc(CX, CY, R * 0.55, 0, TAU); ctx.fill();
      ctx.restore();
    }
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      line(CX + Math.cos(a) * R * 0.085, CY + Math.sin(a) * R * 0.085, CX + Math.cos(a) * RIM_R * R, CY + Math.sin(a) * RIM_R * R, css.lineFaint, 0.55);
    }
    // chart furniture: corner register marks
    for (const [x, y] of [[14, 14], [W - 14, 14], [14, H - 14], [W - 14, H - 14]]) {
      line(x - 5, y, x + 5, y, css.ink28, 0.7);
      line(x, y - 5, x, y + 5, css.ink28, 0.7);
    }
    // The plate caption is gone: a line of engraving-shop flavour on a screen
    // that is fighting for space.

    /* -- orbits, drawing themselves in -- */
    RING_FRACS.forEach((f, ri) => {
      const sw = ip(80 + ri * 70, 550);
      if (sw > 0.01) arc(CX, CY, f * R, rad(-90), rad(-90) + TAU * sw, { stroke: css.line, w: 0.85 });
    });
    MINOR_BAND.forEach((f, ri) => {
      const sw = ip(320 + ri * 80, 550);
      if (sw > 0.01) arc(CX, CY, f * R, rad(-90), rad(-90) + TAU * sw, { stroke: css.lineFaint, w: 0.7 });
    });
    // vernier ticks on the second ring: instrument, not decoration free-hand
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * TAU;
      const rr = RING_FRACS[1] * R;
      line(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, CX + Math.cos(a) * (rr + (i % 6 === 0 ? 3.6 : 1.8)), CY + Math.sin(a) * (rr + (i % 6 === 0 ? 3.6 : 1.8)), css.ink28, 0.5);
    }

    /* -- hub: the core IS the plan, and it grows --------------------------
       The spine is the plan, so the ring around the core carries one segment
       per plan step and lights them as they land. The core itself swells a
       little as the plan fills, and only a little: it must never crowd the
       bodies it sits among. */
    // The DECLARED plan, never the chat's to-do list. A session list dies with
    // the chat and dates every row the day it was typed, so a core built on it
    // reports an afternoon and calls it a plan. No plan declared means no ring:
    // the honest state is silence, not a guess.
    const pl = world.plan && world.plan.totals;
    const planN = Math.max(0, (pl && pl.steps) | 0);
    const planDone = Math.max(0, Math.min(planN, (pl && pl.stepsDone) | 0));
    const planFrac = planN ? planDone / planN : 0;
    const hubR = 8 + 3.4 * planFrac;

    circle(CX, CY, hubR, { fill: css.dark ? css.blue : css.ink });
    if (css.dark) circle(CX, CY, hubR, { stroke: css.blueMid, w: 6, alpha: 0.35 });
    circle(CX, CY, 14, { stroke: css.ink70, w: 1.1 });

    if (planN > 0) {
      // One segment per plan step, in PLAN ORDER, each lit by its OWN status.
      // Lighting the first N segments instead put the light in the wrong place
      // whenever the finished steps were not the first ones, so the ring implied
      // an order of completion that had not happened. Position is the strongest
      // channel this plate has; it is not allowed to say something untrue.
      const rs = 18.5;
      const flat = ((world.plan && world.plan.phases) || []).flatMap((ph) => ph.steps || []);
      const step = TAU / planN;
      const gap = Math.min(step * 0.22, 0.10);
      for (let i = 0; i < planN; i++) {
        const a0 = -Math.PI / 2 + i * step + gap / 2;
        const a1 = -Math.PI / 2 + (i + 1) * step - gap / 2;
        const st = flat[i];
        const lit = st ? st.status === 'done' : i < planDone;
        const inHand = !!(st && st.status === 'active');
        if (inHand) {
          ctx.beginPath();
          ctx.arc(CX, CY, rs, a0, a1);
          ctx.strokeStyle = css.live; ctx.lineWidth = 3.4; ctx.lineCap = 'round'; ctx.stroke();
          continue;
        }
        ctx.beginPath();
        ctx.arc(CX, CY, rs, a0, a1);
        ctx.strokeStyle = lit ? css.blue : css.ink28;
        ctx.lineWidth = lit ? 3.4 : 2.2;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      // A charge travels the done segments, so the centre is never still while
      // the plan is moving. It rides the LIT ones only: the old form ran a
      // continuous head across the first planDone segments of the ring, which
      // painted blue over a step nobody had finished whenever the done steps
      // were not the first ones. A brighter mark on an unstarted step is a lie
      // in the strongest channel this plate has.
      if (planDone > 0 && !REDUCED) {
        const doneIx = [];
        for (let i = 0; i < planN; i++) if (flat[i] ? flat[i].status === 'done' : i < planDone) doneIx.push(i);
        const phase = (t / 1400) % doneIx.length;
        const which = doneIx[Math.floor(phase)];
        const frac = phase - Math.floor(phase);
        const a0 = -Math.PI / 2 + which * step + gap / 2;
        const a1 = -Math.PI / 2 + (which + 1) * step - gap / 2;
        const head = a0 + frac * (a1 - a0);
        ctx.beginPath();
        ctx.arc(CX, CY, rs, Math.max(a0, head - 0.16), head);
        ctx.strokeStyle = css.dark ? '#fff' : css.blueDeep;
        ctx.lineWidth = 3.4; ctx.lineCap = 'round';
        ctx.globalAlpha = 0.85; ctx.stroke(); ctx.globalAlpha = 1;
      }
    } else {
      circle(CX, CY, 21.5, { stroke: css.line, w: 0.8 });
      for (let i = 0; i < 60; i++) {
        const a = (i / 60) * TAU;
        const l = i % 5 === 0 ? 4 : 2;
        line(CX + Math.cos(a) * 21.5, CY + Math.sin(a) * 21.5, CX + Math.cos(a) * (21.5 - l), CY + Math.sin(a) * (21.5 - l), css.ink45, 0.6);
      }
    }
    circle(CX, CY, 26, { stroke: css.lineFaint, w: 0.6 });
    circle(CX, CY, 29.5, { stroke: css.lineFaint, w: 0.5 });
    // Test seam: the plan ring is the one claim that has to be checked against
    // drawn pixels, and a walker cannot know where the hub is otherwise.
    window.__ORR_HUB = { cx: CX, cy: CY, planR: 18.5, planN, planDone, dpr: (window.devicePixelRatio || 1) };

    const hubName = (world.project.name || 'TBK Labs').toUpperCase();
    const hubTxt = hubName.length > 14 ? hubName : hubName.split('').join(' ');
    text(hubTxt, CX, CY + 43, { font: '7.5px "JetBrains Mono"', fill: css.ink45, align: 'center' });
    if (planN > 0) {
      text(`${planDone} of ${planN} steps`, CX, CY + 54, { font: '7.5px "JetBrains Mono"', fill: css.ink28, align: 'center' });
    } else if (world.plan && !world.plan.exists) {
      text('no plan declared', CX, CY + 54, { font: '7.5px "JetBrains Mono"', fill: css.ink28, align: 'center' });
    }

    /* -- bodies -- */
    drawComets(t, dim);
    const planets = world.stat.planets;
    let minorIx = 0, dynIx = 0;
    // How many products this project HAS decides how their names are set. Below
    // the threshold a name sits beside its planet, which reads best. Above it,
    // horizontal names cannot fit round one orbit and the flagship force-draw
    // (a name always renders) stacks them into a smear: measured on Maximus
    // Desktop, 26 products, where "Subagents" landed on "Visible learning".
    // Past the threshold each name is set RADIALLY along its own spoke, where
    // collision is impossible by construction rather than by testing for it.
    RADIAL_LABELS = planets.filter((q) => q.tier === 'flagship').length > 14;
    const benchDrawn = (shows('tools') && world.stat.tools.some((x) => usedHere(x.id)))
      || (shows('processes') && world.stat.processes.some((x) => usedHere(x.id)))
      || (shows('workflows') && world.stat.workflows.some((x) => usedHere(x.id)));
    PLATE_SCALE = benchDrawn ? 1 : 1.2;
    for (const p of (shows('products') ? planets : [])) {
      if (FLAGSHIP_SEAT[p.id]) drawPlanet(p, 0, t, T, dim, false);
      else if (p.tier === 'flagship') drawPlanet(p, dynIx++, t, T, dim, true);
      else drawPlanet(p, minorIx++, t, T, dim, false);
    }
    if (shows('tools')) drawBelt(t, dim);
    if (shows('processes')) drawProcessRing(t, dim);
    if (shows('agents')) drawAgents(t, dim);
    drawRim(T);
    flushLabels();
    // Above the labels: a streak is the newest thing on the plate by definition,
    // and one passing behind a name reads as a rendering fault rather than as a
    // commit landing.
    drawShootingStars();
    drawTransients(nowMs);

    ctx.restore();
  }

  function drawPlanet(p, i, t, T, dim, dyn = false) {
    const born = T == null ? true : bornBy(p.id, T);
    const a = planetAngle(p, i, t, dyn);
    const orbR = planetRing(p, i, dyn);
    const x = CX + Math.cos(a) * orbR;
    const y = CY + Math.sin(a) * orbR;
    const r = planetRadius(p, T == null ? null : T);
    const { ms, feats } = massOf(p.id, T == null ? null : T);
    pos.set(p.id, { x, y, r, kind: p.tier === 'flagship' ? 'product' : 'project', label: p.name });
    bodiesDrawn++;

    const seatIx = FLAGSHIP_SEAT[p.id] ? RING_FRACS.indexOf(FLAGSHIP_SEAT[p.id].ring) : 5;
    const iw = entrance(p.id, 300 + seatIx * 90, 480);
    const faded = (dim(p.id) ? 0.32 : 1) * Math.max(0.001, iw);
    ctx.save();
    ctx.globalAlpha = faded;

    if (!born) {
      circle(x, y, Math.max(3.6, r * 0.55), { stroke: css.ink28, w: 0.9, dash: [2.5, 2.5] });
      ctx.restore();
      return;
    }

    const pulse = world.pulses[p.id];
    const fresh = pulse && (Date.now() - pulse.lastAt) < 4200;

    if (p.status === 'dormant') {
      circle(x, y, r, { stroke: css.ink45, w: 1.2, dash: [3.2, 2.8], fill: css.dark ? 'transparent' : css.paper });
      circle(x, y, r * 0.45, { stroke: css.ink28, w: 0.7, dash: [2, 2.4] });
    } else if (p.tier === 'flagship') {
      // shadowed disc with engraved latitudes, blue equator when live
      circle(x, y, r, { fill: css.card, stroke: css.ink, w: 1.5 });
      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r - 0.8, 0, TAU); ctx.clip();
      for (let k = -3; k <= 3; k++) {
        const yy = y + k * (r / 3.4);
        const half = Math.sqrt(Math.max(0, r * r - (yy - y) * (yy - y)));
        line(x - half, yy, x + half, yy, css.ink45, k === 0 ? 0 : 0.55);
      }
      // terminator: engraved shade on the south-east limb
      ctx.beginPath();
      ctx.arc(x, y, r, rad(-24), rad(140));
      ctx.arc(x + r * 0.28, y - r * 0.18, r * 1.06, rad(132), rad(-18), true);
      ctx.closePath();
      ctx.fillStyle = css.dark ? 'rgba(0,0,0,.30)' : 'rgba(0,16,51,.075)';
      ctx.fill();
      ctx.restore();
      // A product wears the same grammar as its moons, because a product IS its
      // features: an equator once the builder claims the whole of it, one ring
      // when a judge has passed every part, two when the operator has accepted
      // them. Before this, a fully verified product and one nobody had touched
      // were the same disc, so the chain of custody stopped at the moon layer.
      const RINGS = { live: 0, claimed: 0, verified: 1, 'fully-verified': 2 };
      if (p.status in RINGS) {
        ctx.save();
        ctx.beginPath(); ctx.ellipse(x, y, r * 0.98, r * 0.34, 0, 0, TAU);
        ctx.strokeStyle = css.blue; ctx.lineWidth = 1.1; ctx.stroke();
        ctx.restore();
        for (let k = 1; k <= RINGS[p.status]; k++) {
          circle(x, y, r + 3.2 + k * 3.4, { stroke: k === 1 ? css.blue : css.blueMid, w: 1.0, alpha: 0.9 });
        }
      }
      circle(x - r * 0.32, y - r * 0.34, r * 0.14, { fill: css.dark ? css.blueDeep : '#fff', alpha: css.dark ? 0.9 : 0.9 });
    } else {
      circle(x, y, r, { fill: css.card, stroke: css.ink70, w: 1.1 });
      circle(x, y, r * 0.45, { stroke: css.ink28, w: 0.65 });
    }
    if (fresh) {
      circle(x, y, r + 3.5, { stroke: css.blue, w: 1.3, alpha: 0.85 });
      circle(x, y, 2, { fill: css.live });
    }
    if (css.dark && (p.status === 'live' || p.status === 'fully-verified')) circle(x, y, r + 1, { stroke: css.blueMid, w: 3.5, alpha: 0.3 });

    // moons
    const fs = featsOf(p.id);
    const shell0 = r + 8, shell1 = r + 14.5;
    ctx.globalAlpha = faded * entrance(p.id, 750, 380);
    if (fs.length) circle(x, y, shell0, { stroke: css.line, w: 0.6 });
    if (fs.length > 6) circle(x, y, shell1, { stroke: css.line, w: 0.6 });
    fs.forEach((f, k) => {
      void k;
      const shell = k < 6 ? shell0 : shell1;
      const nIn = Math.min(fs.length, 6);
      const count = k < 6 ? nIn : fs.length - 6;
      const idx = k < 6 ? k : k - 6;
      const per = k < 6 ? 26 : 42;
      const ma = (idx / count) * TAU + (t / 1000 / per) * TAU + frac(f.id) * 0.9;
      const mx = x + Math.cos(ma) * shell;
      const my = y + Math.sin(ma) * shell;
      bodiesDrawn++;
      // A moon is the unit the whole grammar is built on, and it was the one
      // body never registered here: unhoverable, unnamed, with no dossier and
      // no thread to its own row on the spine. It is a body like any other now.
      pos.set(f.id, { x: mx, y: my, r: 5.5, kind: 'feature', label: f.name || f.plain || f.id, parent: p.id });
      // The rings COUNT THE SIGN-OFFS, so the chain of custody is legible from
      // across the room: hollow means nobody has spoken, filled means the
      // builder claims it, one ring means a judge passed it, two rings means the
      // operator accepted it. Each ring is a different party, and no party can
      // draw its own.
      if (f.inHand) {
        // in hand: hollow like an unclaimed moon, because nobody has signed it,
        // with a live arc turning on it so the eye finds the work in progress.
        circle(mx, my, 2.3, { stroke: css.pink, w: 1.2, fill: css.dark ? 'transparent' : css.paper });
        ctx.save();
        ctx.beginPath();
        const sweep = REDUCED ? 0 : (t / 900) % TAU;
        ctx.arc(mx, my, 4.6, sweep, sweep + 1.5);
        ctx.strokeStyle = css.live; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.stroke();
        ctx.restore();
      } else if (f.status === 'open') {
        circle(mx, my, 2.3, { stroke: css.pink, w: 1, fill: css.dark ? 'transparent' : css.paper });
      } else if (f.status === 'fully-verified') {
        circle(mx, my, 2.4, { fill: css.pink });
        circle(mx, my, 4.2, { stroke: css.blue, w: 1.1 });
        circle(mx, my, 6.4, { stroke: css.blueMid, w: 1.0 });
      } else if (f.status === 'verified') {
        circle(mx, my, 2.4, { fill: css.pink });
        circle(mx, my, 4.2, { stroke: css.blueMid, w: 0.9 });
      } else {
        circle(mx, my, 2.3, { fill: css.pink });
      }
    });

    ctx.globalAlpha = faded;
    // label request: candidate anchors clear of the moon shells, leader tick to the winner
    const shellMax = fs.length > 6 ? shell1 : fs.length ? shell0 : r;
    const posEntry = pos.get(p.id);
    if (posEntry) posEntry.blockR = shellMax + 2;
    const clearance = shellMax + 9;
    if (p.tier === 'flagship') {
      const nm = p.name.toUpperCase();
      const allMs = msOf(p.id);
      const doneMs = allMs.filter(mm => mm.status === 'done' && (T == null || (mm.date && +new Date(mm.date + 'T12:00:00Z') <= T))).length;
      const bits = [];
      if (allMs.length) bits.push(doneMs + '/' + allMs.length + ' milestones');
      if (feats) bits.push(feats + ' feat');
      bits.push(p.status);
      const sub = bits.join(' · ');
      ctx.font = '8px "JetBrains Mono"';
      const wSub = ctx.measureText(sub).width;
      ctx.font = '600 11px Orbitron';
      const wpx = Math.max(ctx.measureText(nm).width, wSub);
      const mk = (dA, extra, force) => {
        const la = a + dA;
        const cl = clearance + extra;
        const lx = x + Math.cos(la) * cl;
        const ly = y + Math.sin(la) * cl;
        const right = Math.cos(la) >= 0;
        const bx = right ? lx + 6 : lx - 6 - wpx;
        return {
          force,
          box: { x: bx, y: ly - 10, w: wpx, h: 26 },
          draw: () => {
            ctx.save(); ctx.globalAlpha = faded * LBLI;
            line(x + Math.cos(la) * (r + 1.5), y + Math.sin(la) * (r + 1.5), lx + (right ? 3 : -3), ly - 3, css.ink28, 0.6);
            const hx = right ? lx + 3 : lx - 3 - wpx - 6;
            ctx.fillStyle = css.halo;
            ctx.fillRect(hx, ly - 11, wpx + 9, 26);
            text(nm, right ? lx + 6 : lx - 6, ly, { font: '600 11px Orbitron', fill: css.ink, align: right ? 'left' : 'right' });
            text(sub, right ? lx + 6 : lx - 6, ly + 11.5, { font: '8px "JetBrains Mono"', fill: css.ink45, align: right ? 'left' : 'right' });
            ctx.restore();
          },
        };
      };
      // In hover mode only the body you are pointing at, or have pinned, is named.
      const named = labelMode === 'all' || view.focus === p.id
        || (view.hover && view.hover.id === p.id);
      if (!named) { /* no label this frame */ }
      else if (RADIAL_LABELS) {
        // Drawn straight rather than queued: a spoke label cannot collide with
        // another spoke label, so there is nothing for the allocator to test,
        // and putting it through the allocator would only let it be DROPPED.
        const flip = Math.cos(a) < 0;
        const lx = x + Math.cos(a) * (clearance + 3);
        const ly = y + Math.sin(a) * (clearance + 3);
        ctx.save();
        ctx.globalAlpha = faded * LBLI;
        ctx.translate(lx, ly);
        ctx.rotate(flip ? a + Math.PI : a);
        ctx.textAlign = flip ? 'right' : 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '600 10px Orbitron';
        ctx.fillStyle = css.ink;
        ctx.fillText(nm, 0, -5);
        ctx.font = '7.5px "JetBrains Mono"';
        ctx.fillStyle = css.ink45;
        ctx.fillText(sub, 0, 5);
        ctx.restore();
      } else {
        const angles = [0, 0.55, -0.55, 1.1, -1.1];
        const cands = [
          ...angles.map(dA => mk(dA, 0, false)),
          ...angles.map(dA => mk(dA, 18, false)),
          mk(0, 4, true), // a flagship name always renders
        ];
        queueLabel(0, cands, p.id);
      }
    } else {
      ctx.font = '8.5px "JetBrains Mono"';
      const wpx = ctx.measureText(p.name).width;
      const cands = [0, 0.7, -0.7, 1.4, -1.4].map((dA) => {
        const la = a + dA;
        const lx = x + Math.cos(la) * clearance;
        const ly = y + Math.sin(la) * clearance;
        const right = Math.cos(la) >= 0;
        const bx = right ? lx + 2 : lx - 2 - wpx;
        return {
          box: { x: bx, y: ly - 6, w: wpx, h: 12 },
          draw: () => {
            ctx.save(); ctx.globalAlpha = faded * LBLI;
            ctx.fillStyle = css.halo;
            ctx.fillRect(bx - 2, ly - 6, wpx + 4, 12);
            text(p.name, right ? lx + 2 : lx - 2, ly + 3, { font: '8.5px "JetBrains Mono"', fill: css.ink45, align: right ? 'left' : 'right' });
            ctx.restore();
          },
        };
      });
      if (labelMode === 'all' || view.focus === p.id || (view.hover && view.hover.id === p.id)) {
        queueLabel(fs.length >= 4 ? 1 : 2, cands, p.id);
      }
    }
    ctx.restore();
  }

  function drawBelt(t, dim) {
    const tools = world.stat.tools.filter((tl) => usedHere(tl.id));
    if (!tools.length) return; // no empty ruled band for tools that are not there
    const groups = new Map();
    for (const g of GROUP_ORDER) groups.set(g, []);
    for (const tl of tools) (groups.get(tl.group) || groups.get('bench')).push(tl);

    circle(CX, CY, BELT_BAND[0] * R, { stroke: css.lineFaint, w: 0.6, dash: [1, 4] });
    circle(CX, CY, BELT_BAND[1] * R, { stroke: css.lineFaint, w: 0.6, dash: [1, 4] });

    const GAP = rad(5);
    const total = tools.length;
    const active = GROUP_ORDER.filter(k => groups.get(k).length);
    let a0 = rad(-64);
    for (const g of active) {
      const items = groups.get(g);
      const span = (TAU - GAP * active.length) * (items.length / total);
      items.forEach((tl, k) => {
        const a = a0 + (span * (k + 0.5)) / items.length;
        const rr = (BELT_BAND[0] + (BELT_BAND[1] - BELT_BAND[0]) * frac(tl.id, 5)) * R;
        const x = CX + Math.cos(a) * rr;
        const y = CY + Math.sin(a) * rr;
        const s = 3.4 + 1.8 * frac(tl.id, 9);
        pos.set(tl.id, { x, y, r: s + 3, kind: 'tool', label: tl.name });
        bodiesDrawn++;
        const pulse = world.pulses[tl.id];
        const freshT = pulse && (Date.now() - pulse.lastAt) < 5000;
        ctx.save();
        let na = a % TAU; if (na < 0) na += TAU;
        ctx.globalAlpha = (dim(tl.id) ? 0.3 : 1) * Math.max(0.001, entrance(tl.id, 600 + (na / TAU) * 550, 320));
        ctx.translate(x, y); ctx.rotate(a + Math.PI / 4);
        ctx.beginPath(); ctx.rect(-s / 2, -s / 2, s, s);
        if (freshT) { ctx.fillStyle = css.blue; ctx.fill(); }
        else if (frac(tl.id, 2) < 0.32) { ctx.fillStyle = css.ink70; ctx.fill(); }
        else { ctx.strokeStyle = css.ink70; ctx.lineWidth = 0.9; ctx.stroke(); }
        ctx.restore();
        if (freshT) { circle(x, y, s + 4, { stroke: css.blueMid, w: 1 }); circle(x, y, 1.5, { fill: css.live }); }
      });
      const mid = a0 + span / 2;
      const lr2 = (BELT_BAND[1] + 0.026) * R;
      const lx = CX + Math.cos(mid) * lr2;
      const ly = CY + Math.sin(mid) * lr2;
      queueLabel(4, {
        box: { x: lx - 24, y: ly - 6, w: 48, h: 12 },
        draw: () => {
          ctx.save();
          ctx.translate(lx, ly);
          let rot = mid + Math.PI / 2;
          if (Math.sin(mid) > 0) rot += Math.PI;
          ctx.rotate(rot);
          text(g.toUpperCase(), 0, 0, { font: '7.5px "JetBrains Mono"', fill: css.ink28, align: 'center', spacing: 2 });
          ctx.restore();
        },
      });
      a0 += span + GAP;
    }
  }

  // The ring had room for a name, and it was being handed a sentence.
  // "FEATURES LEDGER CAPTURE" over "RULE 39" is three words and a citation for
  // something that needs to read as one label at a glance. Wassim, 2026-08-28:
  // "There is no reason to include the expanded name, family history, and
  // ancestry of every damn thing. Instead of features ledger capture, you can
  // put 'Feat. Ledger'." Short names on the ring; the full name and the rule
  // number are on the body, which is what the dossier is for.
  const SKIP = new Set(['TO', 'THE', 'OF', 'AND', 'FOR', 'A']);
  function ringLabel(name) {
    const up = String(name || '').toUpperCase();
    if (up.length <= 16) return up;
    const words = up.split(/[\s]+/).filter((w) => !SKIP.has(w));
    const head = words.slice(0, 2).map((w, i) => (i === 0 && w.length > 6 ? w.slice(0, 4) + '.' : w));
    const out = head.join(' ');
    return out.length <= 16 ? out : out.slice(0, 15) + '.';
  }

  function drawProcessRing(t, dim) {
    const procs = world.stat.processes.filter((pr) => usedHere(pr.id));
    // Nothing used, nothing drawn. The two guide circles used to be painted
    // regardless, leaving an empty ruled band around a plate that has no
    // processes on it: chrome for content that is not there.
    if (!procs.length) return;
    const rr = PROC_R * R;
    const GAP = rad(2.6);
    // THE SLICES ARE NOT EQUAL. Wassim, 2026-08-30: "this should not be equally
    // sized... Features ledger, septa review, autosync, decision page,
    // troubleshooting ledger, these should be a fair bit more prominent." Arc
    // width is a WEIGHT carried in the data (processes[].weight), which is his
    // ordering of what matters and NOT a measurement of anything. The key says
    // that in as many words, because an unequal arc that looked measured would
    // be the plate telling a lie about its own numbers.
    const wOf = (p) => Math.max(1, Number(p.weight) || 1);
    const wSum = procs.reduce((n, p) => n + wOf(p), 0);
    const free = TAU - GAP * procs.length;
    let a0 = rad(-90) + GAP / 2;
    circle(CX, CY, rr - 4, { stroke: css.lineFaint, w: 0.7 });
    circle(CX, CY, rr + 4, { stroke: css.lineFaint, w: 0.7 });
    for (const p of procs) {
      const heavy = wOf(p) > 1;
      const a1 = a0 + free * (wOf(p) / wSum);
      const pulse = world.pulses[p.id];
      const freshP = pulse && (Date.now() - pulse.lastAt) < 5000;
      const faded = dim(p.id) ? 0.3 : 1;
      // A BLIND PROCESS IS DRAWN AS BLIND, not as unused. TBK-AutoSync runs on a
      // timer and the brand gate is a pre-commit hook, so nothing a session does
      // can ever light either one. Amber would claim it is waiting to be used;
      // a dashed grey arc says the instrument cannot see it from here, which is
      // the true statement and the one the key repeats.
      const blind = !p.detect;
      const psw = entrance(p.id, 850 + procs.indexOf(p) * 35, 450);
      if (psw > 0.01) arc(CX, CY, rr, a0, a0 + (a1 - a0) * psw, {
        // A BLIND ARC STAYS DASHED AND GREY - that is the honest reading, and it
        // must never be mistaken for amber "in use". But weight still applies to
        // it: TBK-AutoSync is one of the five he called out, so a heavy blind arc
        // gets the wider span AND a heavier stroke, rather than being flattened
        // to a hairline by a fact about detection.
        stroke: blind ? css.ink28 : freshP ? css.blue : css.amber,
        w: blind ? (heavy ? 2.4 : 1.4) : freshP ? (heavy ? 3.6 : 2.8) : (heavy ? 3.2 : 2.1),
        dash: blind ? [3, 4] : null,
        alpha: faded,
      });
      for (const aa of [a0, a1]) {
        line(CX + Math.cos(aa) * (rr - 5.5), CY + Math.sin(aa) * (rr - 5.5), CX + Math.cos(aa) * (rr + 5.5), CY + Math.sin(aa) * (rr + 5.5), css.ink45, 0.8);
      }
      const mid = (a0 + a1) / 2;
      const mx = CX + Math.cos(mid) * rr;
      const my = CY + Math.sin(mid) * rr;
      pos.set(p.id, { x: mx, y: my, r: 13, kind: 'process', label: p.name, arc: [a0, a1, rr] });
      bodiesDrawn++;

      // A process may carry a SATELLITE: a second mechanism that runs over the
      // first one's output rather than beside it. Broken Promises reads the
      // Features Ledger back and names the promises the product never kept, so
      // it is drawn orbiting the ledger — the only body on the plate whose
      // subject is another body. It cannot be a ring arc of its own, because an
      // arc claims a process runs on the project; this one runs on the ledger.
      if (p.satellite && psw > 0.99) drawSatellite(p, p.satellite, mid, rr, t, faded);
      // The ring's own strokes used to run straight through its labels. The tick
      // marks reach rr+5.5 and the outer guide circle sits at rr+4, and the label
      // band started at rr+13, so a name overlapped both. It now starts clear of
      // them and knocks out its own background, so nothing can cross a glyph.
      const lr = rr + 21;
      const plx = CX + Math.cos(mid) * lr;
      const ply = CY + Math.sin(mid) * lr;
      const flipped = Math.sin(mid) > 0;
      const nm = ringLabel(p.name);
      ctx.font = (heavy ? '600 8.5px' : '8px') + ' "JetBrains Mono"';
      const nmW = ctx.measureText(nm).width + nm.length * 1.2;
      queueLabel(1, {
        // the real measured width, not a fixed 80px guess: "TROUBLESHOOTING
        // LEDGER" is about 135px, so the old box let it collide undetected
        box: { x: plx - nmW / 2, y: ply - 8, w: nmW, h: 16 },
        draw: () => {
          ctx.save();
          ctx.globalAlpha = faded * LBLI;
          ctx.translate(plx, ply);
          let rot = mid + Math.PI / 2;
          if (flipped) rot += Math.PI;
          ctx.rotate(rot);
          // In the rotated frame local +y points INWARD on the top half and
          // OUTWARD on the bottom, because of the flip. The rule number has to
          // follow the name outward in both, or it lands back on the ring.
          // OPAQUE. The shared halo token is 85% paper, which lets the ring's
          // own arcs bleed faintly through the glyphs.
          ctx.fillStyle = css.paper;
          ctx.fillRect(-nmW / 2 - 5, -8, nmW + 10, 16);
          text(nm, 0, 0, {
            font: (heavy ? '600 8.5px' : '8px') + ' "JetBrains Mono"',
            fill: blind ? (heavy ? css.ink45 : css.ink28) : freshP ? css.blue : heavy ? css.ink70 : css.ink45,
            align: 'center', spacing: 1.2,
          });
          ctx.restore();
        },
      });
      a0 = a1 + GAP;
    }
  }

  // A satellite of a ring arc: it orbits the arc's own seat, inside the ring so
  // it can never be mistaken for a body of the project. Its whole meaning is
  // that it AUDITS the thing it orbits, so it is drawn as a lens sweeping a
  // circle rather than as a mark sitting still, and when it finds something it
  // reaches for it. Being found is what a red thread means here; the moon at the
  // other end is a feature a judge rejected after it was promised.
  function drawSatellite(host, sat, mid, rr, t, faded) {
    const orbit = 15.5;
    // Inward of the ring: outward is the label band, and a body there collides
    // with the process names on every frame.
    const ox = CX + Math.cos(mid) * (rr - 15);
    const oy = CY + Math.sin(mid) * (rr - 15);
    const sweep = REDUCED ? rad(-55) : (t / 4200) % TAU;
    const sx = ox + Math.cos(sweep) * orbit;
    const sy = oy + Math.sin(sweep) * orbit;

    ctx.save();
    ctx.globalAlpha = faded;
    circle(ox, oy, orbit, { stroke: css.ink28, w: 0.7, dash: [2, 3], alpha: faded * 0.75 });

    // Whatever it is currently naming. A broken promise is a feature the
    // builder claimed and a judge then rejected, which the reducer already
    // computes as failedBy — this reads that, it does not decide it.
    const broken = (world.stat.features || []).filter((f) => f.failedBy);
    for (const f of broken) {
      const target = pos.get(f.id);
      if (!target) continue;
      const beat = REDUCED ? 0.55 : 0.5 + 0.5 * Math.sin(t / 620);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      const mx2 = (sx + target.x) / 2, my2 = (sy + target.y) / 2;
      const vx = mx2 - CX, vy = my2 - CY, vl = Math.hypot(vx, vy) || 1;
      ctx.quadraticCurveTo(mx2 + (vx / vl) * 34, my2 + (vy / vl) * 34, target.x, target.y);
      ctx.strokeStyle = css.fault;
      ctx.lineWidth = 1.1;
      ctx.globalAlpha = faded * (0.22 + 0.34 * beat);
      ctx.setLineDash([2, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = faded;
      circle(target.x, target.y, 7.5 + beat * 2.5, { stroke: css.fault, w: 1.2, alpha: faded * (0.7 - beat * 0.3) });
    }

    // The lens: hollow, because it asserts nothing of its own — it only reports
    // what it read back. Red only while it is holding something.
    const hot = broken.length > 0;
    circle(sx, sy, 3.6, { stroke: hot ? css.fault : css.ink70, w: 1.4, fill: css.paper });
    circle(sx, sy, 1.3, { fill: hot ? css.fault : css.ink70 });
    pos.set(sat.id, { x: sx, y: sy, r: 7, kind: 'process', label: sat.name, host: host.id });
    bodiesDrawn++;

    const nm = sat.name.toUpperCase();
    ctx.font = '7.5px "JetBrains Mono"';
    const nw = ctx.measureText(nm).width + nm.length * 1.1;
    // Set on the inward side of the orbit, where there is open plate. Queued so
    // it yields to a moon label rather than printing over one.
    const lx = ox - Math.cos(mid) * (orbit + 7);
    const ly = oy - Math.sin(mid) * (orbit + 7);
    const right = Math.cos(mid) < 0;
    queueLabel(2, {
      box: { x: right ? lx : lx - nw, y: ly - 7, w: nw, h: 14 },
      draw: () => {
        ctx.save();
        ctx.globalAlpha = faded * LBLI;
        ctx.fillStyle = css.halo;
        ctx.fillRect((right ? lx : lx - nw) - 3, ly - 7, nw + 6, 14);
        text(nm, lx, ly + 3, {
          font: '7.5px "JetBrains Mono"',
          fill: hot ? css.fault : css.ink45, align: right ? 'left' : 'right', spacing: 1.1,
        });
        ctx.restore();
      },
    });
    ctx.restore();
  }

  // Agents: angular, featureless, and threaded to whatever they are touching.
  // Deliberately built unlike a planet: no body, no moons, no size that means
  // anything. Presence, activity and target, and nothing else.
  function drawAgents(t, dim) {
    const now = Date.now();
    const AGENT_IDLE_MS = 4 * 60000;
    const src = (world.agents && Object.values(world.agents)) || [];
    const list = src
      .map((a) => ({ ...a, active: (now - a.lastAt) < AGENT_IDLE_MS }))
      .sort((x, y) => (y.active - x.active) || (y.lastAt - x.lastAt))
      .slice(0, 10);
    if (!list.length) return;
    // Their own band, outside every planet belt. An agent that lands among the
    // bodies reads as one of them, which is the whole thing this class exists
    // to avoid.
    const band = RING_FRACS[RING_FRACS.length - 1] * R + 0.055 * R + 26;
    const n = list.length;
    list.forEach((a, i) => {
      const ang = rad(-90 + (360 / Math.max(n, 6)) * i + 12);
      const x = CX + Math.cos(ang) * band;
      const y = CY + Math.sin(ang) * band;
      const active = a.active;
      const alpha = dim && dim(a.name) ? 0.3 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;

      // the thread: where this agent is working, bowed clear of the core
      const tgt = a.target ? pos.get(a.target) : null;
      if (tgt) {
        const mx = (x + tgt.x) / 2, my = (y + tgt.y) / 2;
        const vx = mx - CX, vy = my - CY, vl = Math.hypot(vx, vy) || 1;
        const bow = 46;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(mx + (vx / vl) * bow, my + (vy / vl) * bow, tgt.x, tgt.y);
        ctx.strokeStyle = active ? css.blue : css.ink28;
        ctx.lineWidth = 1.3;
        ctx.globalAlpha = alpha * (active ? 0.8 : 0.3);
        ctx.setLineDash([2, 5]);
        if (active && !REDUCED) ctx.lineDashOffset = -((t / 26) % 140);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = alpha;
      }

      // the mark itself
      const sz = 11.5;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(0, -sz);
      ctx.lineTo(sz * 0.72, sz * 0.55);
      ctx.lineTo(0, sz * 0.30);
      ctx.lineTo(-sz * 0.72, sz * 0.55);
      ctx.closePath();
      ctx.fillStyle = active ? css.purple : css.paper;
      ctx.strokeStyle = active ? css.purple : css.purpleSoft;
      ctx.lineWidth = 1.4;
      ctx.fill(); ctx.stroke();
      ctx.restore();

      if (active && !REDUCED) {
        const k = ((t / 2300) % 1);
        circle(x, y, sz * (0.7 + k * 1.0), { stroke: css.purple, w: 1.3, alpha: alpha * 0.7 * (1 - k) });
      } else if (active) {
        circle(x, y, sz * 1.7, { stroke: css.purple, w: 1.3, alpha: alpha * 0.5 });
      }

      // Near the vertical the radial offset alone puts a left-aligned label on
      // top of its own mark, so the anchor follows the angle rather than a
      // fixed rule.
      const cosA = Math.cos(ang);
      const lx = CX + cosA * (band + sz + 16);
      const ly = CY + Math.sin(ang) * (band + sz + 16);
      const align = Math.abs(cosA) < 0.35 ? 'center' : (cosA > 0 ? 'left' : 'right');
      text(a.name, lx, ly + (Math.sin(ang) < -0.35 ? -2 : 9), { font: '9px "JetBrains Mono"', fill: css.ink45, align });
      pos.set('agent:' + a.name, { x, y, r: sz, kind: 'agent', label: a.name });
      ctx.restore();
    });
  }

  function drawComets(t, dim) {
    const flows = shows('workflows') ? world.stat.workflows.filter((wf) => usedHere(wf.id)) : [];
    flows.forEach((w) => {
      const rot = frac(w.id, 1) * TAU;
      const aMaj = (0.30 + 0.34 * frac(w.id, 2)) * R;
      const ecc = 0.45 + 0.25 * frac(w.id, 3);
      const bMin = aMaj * Math.sqrt(1 - ecc * ecc);
      const per = 50 + 85 * frac(w.id, 4);
      const th = (t / 1000 / per) * TAU + frac(w.id, 5) * TAU;
      const px = (xx, yy) => {
        const fx = xx - aMaj * ecc;
        return {
          x: CX + fx * Math.cos(rot) - yy * Math.sin(rot),
          y: CY + fx * Math.sin(rot) + yy * Math.cos(rot),
        };
      };
      const p0 = px(Math.cos(th) * aMaj, Math.sin(th) * bMin);
      const pulse = world.pulses[w.id];
      const freshW = pulse && (Date.now() - pulse.lastAt) < 9000;
      const faded = (dim(w.id) ? 0.3 : 1) * Math.max(0.001, entrance(w.id, 1000 + flows.indexOf(w) * 45, 420));
      ctx.save();
      ctx.globalAlpha = faded;
      ctx.beginPath();
      for (let k = 0; k <= 90; k++) {
        const a = (k / 90) * TAU;
        const q = px(Math.cos(a) * aMaj, Math.sin(a) * bMin);
        k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
      }
      ctx.strokeStyle = css.line; ctx.lineWidth = 0.6; ctx.setLineDash([1, 5.5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const a = th - (k / 30) * 0.85;
        const q = px(Math.cos(a) * aMaj, Math.sin(a) * bMin);
        k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
      }
      ctx.strokeStyle = freshW ? css.blue : css.purple;
      ctx.lineWidth = freshW ? 1.8 : 1.1;
      ctx.stroke();
      // head: a teardrop pointed along the motion
      const pAhead = px(Math.cos(th + 0.05) * aMaj, Math.sin(th + 0.05) * bMin);
      const hd = Math.atan2(pAhead.y - p0.y, pAhead.x - p0.x);
      const hr = freshW ? 3.6 : 2.8;
      ctx.save();
      ctx.translate(p0.x, p0.y); ctx.rotate(hd);
      ctx.beginPath();
      ctx.moveTo(hr * 1.9, 0);
      ctx.arc(0, 0, hr, Math.PI / 3.2, -Math.PI / 3.2, false);
      ctx.closePath();
      ctx.fillStyle = freshW ? css.blue : css.purple;
      ctx.fill();
      ctx.restore();
      if (freshW) { circle(p0.x, p0.y, 6.5, { stroke: css.blueMid, w: 1 }); circle(p0.x, p0.y, 1.4, { fill: css.live }); }
      pos.set(w.id, { x: p0.x, y: p0.y, r: 8, kind: 'workflow', label: w.name });
      bodiesDrawn++;
      const distHub = Math.hypot(p0.x - CX, p0.y - CY);
      if ((MARQUEE_FLOWS.has(w.name) || freshW) && distHub > 0.24 * R) {
        ctx.font = '8.5px "JetBrains Mono"';
        const wpx = ctx.measureText(w.name).width;
        queueLabel(3, {
          box: { x: p0.x + 6, y: p0.y - 13, w: wpx, h: 12 },
          draw: () => {
            ctx.save(); ctx.globalAlpha = faded * LBLI;
            ctx.fillStyle = css.halo;
            ctx.fillRect(p0.x + 4, p0.y - 14, wpx + 4, 12);
            text(w.name, p0.x + 6, p0.y - 5, { font: '8.5px "JetBrains Mono"', fill: freshW ? css.blue : css.purple });
            ctx.restore();
          },
        });
      }
      ctx.restore();
    });
  }

  function drawRim(T) {
    const genesis = world.stat.genesis;
    let span = dateSpan;
    if (genesis) {
      const start = world.project.startedAt || Date.now() - 60000;
      span = { min: start, max: Math.max(Date.now(), start + 30 * 60000) };
    }
    if (!span) return;
    const rr = RIM_R * R;
    const A0 = rad(-90);
    const SWEEP = rad(320);
    const A1 = A0 + SWEEP;
    const rsw = introStart == null ? 1 : easeOut((performance.now() - introStart - 350) / 750);
    if (rsw < 0.01) return;
    // In project mode the rim is a SESSION CLOCK, not a record of dated
    // milestones, and at full weight it was the darkest thing on a plate whose
    // real content is lighter: the eye went to a clock instead of the work.
    // It reads as a track there, and keeps its weight where it carries dates.
    const rimInk = genesis ? css.ink28 : css.ink45;
    arc(CX, CY, rr, A0, A0 + SWEEP * rsw, { stroke: rimInk, w: genesis ? 0.8 : 1.1 });
    arc(CX, CY, rr - 3.5, A0, A0 + SWEEP * rsw, { stroke: css.lineFaint, w: 0.6 });

    const { min, max } = span;
    const angFor = (ms) => A0 + SWEEP * ((ms - min) / Math.max(1, max - min));

    if (genesis) {
      // session clock: a tick every ten minutes, a longer one on the hour
      const TICK = 10 * 60000;
      for (let d = min; d <= max; d += TICK) {
        const a = angFor(d);
        const onHour = new Date(d).getMinutes() < 10;
        const l = onHour ? 6.5 : 3;
        line(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, CX + Math.cos(a) * (rr + l), CY + Math.sin(a) * (rr + l), css.ink28, 0.6);
      }

      for (const m of world.stat.milestones) {
        if (!m.at || m.status !== 'done') continue;
        const a = angFor(m.at);
        line(CX + Math.cos(a) * (rr - 9), CY + Math.sin(a) * (rr - 9), CX + Math.cos(a) * (rr - 3.5), CY + Math.sin(a) * (rr - 3.5), css.ink70, 1.3);
      }
      const aNowG = A1 + rad(19);

      return;
    }

    const DAY = 86400000;
    const start = new Date(min); start.setUTCHours(12, 0, 0, 0);
    for (let d = +start; d <= max + DAY / 2; d += DAY) {
      const dt = new Date(d);
      const a = angFor(d);
      const isMon = dt.getUTCDay() === 1;
      const isFirst = dt.getUTCDate() === 1;
      const l = isFirst ? 9 : isMon ? 6 : 2.6;
      line(CX + Math.cos(a) * rr, CY + Math.sin(a) * rr, CX + Math.cos(a) * (rr + l), CY + Math.sin(a) * (rr + l), isFirst ? css.ink70 : css.ink28, isFirst ? 1 : 0.6);
      if (isFirst) {
        const lx = CX + Math.cos(a) * (rr + 20);
        const ly = CY + Math.sin(a) * (rr + 20);
        text(dt.toLocaleString('en', { month: 'short', timeZone: 'UTC' }).toUpperCase(), lx, ly + 3, { font: '600 9px Orbitron', fill: css.ink45, align: 'center', spacing: 1.5 });
      }
    }
    // endpoints of the record
    const e0 = new Date(min), e1 = new Date(max);
    const cap = (d) => d.toLocaleString('en', { month: 'short', timeZone: 'UTC' }).toUpperCase() + ' ' + String(d.getUTCDate()).padStart(2, '0');
    text(cap(e0), CX + Math.cos(A0) * (rr + 20), CY + Math.sin(A0) * (rr + 20) + 3, { font: '7.5px "JetBrains Mono"', fill: css.ink45, align: 'center' });

    for (const m of world.stat.milestones) {
      if (!m.date) continue;
      const msT = +new Date(m.date + 'T12:00:00Z');
      const a = angFor(msT);
      const future = T != null && msT > T;
      const col = m.status === 'done' ? (future ? css.ink28 : css.ink70) : m.status === 'in-progress' ? css.blue : css.ink28;
      line(CX + Math.cos(a) * (rr - 9), CY + Math.sin(a) * (rr - 9), CX + Math.cos(a) * (rr - 3.5), CY + Math.sin(a) * (rr - 3.5), col, future ? 0.7 : 1.3);
    }

    // the scrub jewel: a short radial stub and a grabbable knob, no chord across the plate
    const tNow = T == null ? max : T;
    const aArm = angFor(Math.min(Math.max(tNow, min), max));
    const ax = CX + Math.cos(aArm) * (rr - 1);
    const ay = CY + Math.sin(aArm) * (rr - 1);
    line(CX + Math.cos(aArm) * (rr - 14), CY + Math.sin(aArm) * (rr - 14), CX + Math.cos(aArm) * (rr + 8), CY + Math.sin(aArm) * (rr + 8), T == null ? css.ink45 : css.blue, T == null ? 0.9 : 1.4);
    circle(ax, ay, 6, { fill: css.card, stroke: T == null ? css.ink70 : css.blue, w: 1.5 });
    circle(ax, ay, 2.6, { fill: T == null ? css.ink70 : css.blue });
    // drag affordance: chevrons flanking the knob along the arc
    const tang = aArm + Math.PI / 2;
    for (const dir of [-1, 1]) {
      const bxx = ax + Math.cos(tang) * 13 * dir;
      const byy = ay + Math.sin(tang) * 13 * dir;
      ctx.save();
      ctx.translate(bxx, byy); ctx.rotate(tang + (dir > 0 ? 0 : Math.PI));
      ctx.beginPath(); ctx.moveTo(-2, -3); ctx.lineTo(2, 0); ctx.lineTo(-2, 3);
      ctx.strokeStyle = css.ink45; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    if (T != null) {
      const dlx = ax + Math.cos(aArm) * 22;
      const dly = ay + Math.sin(aArm) * 22;
      ctx.fillStyle = css.halo;
      ctx.fillRect(dlx - 24, dly - 7, 48, 13);
      text(new Date(T).toISOString().slice(5, 10).replace('-', '.'), dlx, dly + 3.5, { font: '600 9px Orbitron', fill: css.blue, align: 'center' });
    }
    pos.set('__rim__', { x: ax, y: ay, r: 18, kind: 'rim', label: 'timeline' });

    const aNow = A1 + rad(19);

    text(cap(e1), CX + Math.cos(aNow) * (rr - 18), CY + Math.sin(aNow) * (rr - 18) + 3, { font: '7.5px "JetBrains Mono"', fill: css.ink45, align: 'center' });
  }

  // Shooting stars: one per COMMIT landing. Every other mark on this plate is a
  // standing thing that persists; a commit is the opposite, a single instant
  // that is over as soon as it happens, and the rim notch it leaves behind is a
  // record of it rather than the event itself. So it gets the one form on the
  // plate that exists only while it is happening. It is not decoration and the
  // key says what it is: nothing draws one but a commit arriving.
  //
  // History is excluded on purpose. A backlog drain replays hours of commits in
  // seconds, and a sky full of streaks for work finished last Tuesday would say
  // the fleet was working now, which is the exact lie the drive gauge's `pre`
  // flag already exists to prevent.
  const STAR_MS = 1500;
  const stars = [];
  const starsSeen = new Set();
  function launchStars() {
    const now = Date.now();
    for (const n of (world.notches || [])) {
      if (!n || !n.sha || n.pre) continue;
      if (starsSeen.has(n.sha)) continue;
      starsSeen.add(n.sha);
      if (now - (n.at || 0) > 4000) continue;   // seeded history, not a live landing
      const a = frac(n.sha, 3) * TAU;
      stars.push({ at: now, a, drift: (frac(n.sha, 4) - 0.5) * 0.55, subject: n.subject || '', short: n.short || '' });
    }
    // Bounded, because a burst of commits must not become a permanent particle
    // system; and the seen-set is trimmed with the notch ring buffer it mirrors.
    if (stars.length > 8) stars.splice(0, stars.length - 8);
    if (starsSeen.size > 400) starsSeen.clear();
  }
  function drawShootingStars() {
    launchStars();
    if (REDUCED) { stars.length = 0; return; }   // a streak IS the motion; there is no resting frame
    const now = Date.now();
    for (let i = stars.length - 1; i >= 0; i--) {
      const s = stars[i];
      const k = (now - s.at) / STAR_MS;
      if (k >= 1) { stars.splice(i, 1); continue; }
      // In from beyond the rim, across the plate, out the other side. The head
      // is bright, the tail is what the eye actually reads as direction.
      const a = s.a + s.drift * k;
      const rFrom = R * 1.16, rTo = R * 0.14;
      const rr = rFrom + (rTo - rFrom) * easeOut(k);
      const x = CX + Math.cos(a) * rr;
      const y = CY + Math.sin(a) * rr;
      const tailR = Math.min(rFrom, rr + 46 + 30 * (1 - k));
      const tx = CX + Math.cos(a - s.drift * 0.35) * tailR;
      const ty = CY + Math.sin(a - s.drift * 0.35) * tailR;
      const fade = k < 0.12 ? k / 0.12 : (1 - k) / 0.88;
      const g = ctx.createLinearGradient(tx, ty, x, y);
      g.addColorStop(0, withAlpha(css.blue, 0));
      g.addColorStop(1, withAlpha(css.blue, 0.85 * fade));
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(tx, ty); ctx.lineTo(x, y);
      ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      ctx.stroke();
      circle(x, y, 2.1, { fill: css.live, alpha: fade });
      if (k < 0.62 && s.short) {
        text(s.short, x + 7, y - 5, { font: '8px "JetBrains Mono"', fill: css.blue, alpha: fade * 0.9 });
      }
      ctx.restore();
    }
  }

  function drawTransients(nowMs) {
    const now = Date.now();
    for (const tr of world.transients) {
      const age = now - tr.at;
      if (age < 0 || age > tr.ttl) continue;
      const k = age / tr.ttl;
      if (tr.kind === 'ring' && tr.target && pos.has(tr.target)) {
        const p = pos.get(tr.target);
        circle(p.x, p.y, p.r + 3 + k * 26, { stroke: css.blue, w: 1.5 * (1 - k), alpha: 0.8 * (1 - k) });
        if (k < 0.4) circle(p.x, p.y, 2.1, { fill: css.live, alpha: 1 - k / 0.4 });
      } else if (tr.kind === 'comet') {
        const a = rad(-40) + k * rad(150);
        const rr = (0.32 + 0.22 * frac(tr.id)) * R;
        const x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr;
        circle(x, y, 2.8, { fill: css.blue, alpha: 1 - k });
        arc(CX, CY, rr, a - rad(28 * (1 - k)), a, { stroke: css.blueMid, w: 1.3, alpha: 0.7 * (1 - k) });
        if (tr.label) text(String(tr.label), x + 6, y - 5, { font: '8.5px "JetBrains Mono"', fill: css.blue, alpha: 1 - k });
      } else if (tr.kind === 'spark') {
        const a = frac(tr.id) * TAU;
        const rr = (0.10 + 0.05 * frac(tr.id, 2)) * R;
        const x = CX + Math.cos(a) * rr, y = CY + Math.sin(a) * rr;
        const s = 3 * (1 - k);
        line(x - s, y, x + s, y, css.blue, 0.9);
        line(x, y - s, x, y + s, css.blue, 0.9);
      } else if (tr.kind === 'fault') {
        const x = CX - 60, y = H - 34;
        const s = 3.6;
        ctx.save(); ctx.globalAlpha = 1 - k;
        ctx.fillStyle = css.halo;
        ctx.fillRect(x - 8, y - 9, 200, 18);
        line(x - s, y - s, x + s, y + s, css.fault, 1.4);
        line(x - s, y + s, x + s, y - s, css.fault, 1.4);
        if (tr.label) text('fault · ' + String(tr.label).slice(0, 30), x + 9, y + 3.5, { font: '9px "JetBrains Mono"', fill: css.fault });
        ctx.restore();
      }
    }
  }

  /* --------------------------------------------------------- hit + api */

  function hitTest(mx, my) {
    let best = null, bestD = 1e9;
    for (const [id, p] of pos) {
      const d = Math.hypot(mx - p.x, my - p.y) - p.r;
      if (d < 6 && d < bestD) { bestD = d; best = { id, ...p }; }
    }
    return best;
  }

  function dateAtPoint(mx, my) {
    if (!dateSpan || (world && world.stat.genesis)) return null;
    const a = Math.atan2(my - CY, mx - CX);
    const A0 = rad(-90), SWEEP = rad(320);
    let rel = a - A0;
    while (rel < 0) rel += TAU;
    if (rel > SWEEP) rel = rel < SWEEP + rad(20) ? SWEEP : 0;
    return dateSpan.min + (rel / SWEEP) * (dateSpan.max - dateSpan.min);
  }
  const nearRim = (mx, my) => !(world && world.stat.genesis) && Math.abs(Math.hypot(mx - CX, my - CY) - RIM_R * R) < 22;

  return {
    setWorld, setView, setLabels, getLabels, setBench, getBench, setHidden, getHidden, retheme, resize, frame, hitTest, dateAtPoint, nearRim,
    posOf: (id) => pos.get(id) || null,
    stats: () => ({ bodiesDrawn }),
    span: () => dateSpan,
  };
}
