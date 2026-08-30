// Wiring. One world object, one reducer (shared with the server), two instruments.
import * as W from '/lib/state.mjs';
import { initOrrery } from '/orrery.js';
import { initSpine } from '/spine.js';

const $ = (id) => document.getElementById(id);

// The key, when this instrument is exposed to the network. It arrives once in the
// link the server prints, and the page keeps it, so nothing has to be typed twice.
// It STAYS in the address bar on purpose: the whole point of the browser link is
// that the page it lands on is bookmarkable, and a bookmark made after a strip
// would silently lose the key (localStorage only covers this one browser).
// One name per thing. The legend's open/closed state and the bearer key were
// both written to localStorage['la-key'], so opening the legend once overwrote
// the key with the word "open" and every guarded call answered 401 from then on.
const KEY = (() => {
  try {
    const q = new URL(location.href).searchParams.get('k');
    if (q) { localStorage.setItem('la-key', q); return q; }
    return localStorage.getItem('la-key') || '';
  } catch { return ''; }
})();
const keyed = (u) => (KEY ? u + (u.includes('?') ? '&' : '?') + 'k=' + encodeURIComponent(KEY) : u);
const authFetch = (u, o = {}) => fetch(u, { ...o, headers: { ...(o.headers || {}), ...(KEY ? { authorization: 'Bearer ' + KEY } : {}) } });
window.__laKeyed = keyed; window.__laFetch = authFetch;

// Set by the inline script in index.html when the page is framed (the editor
// panel). Embed mode draws the plan alone and skips the orrery's frame work.
const EMBED = document.documentElement.dataset.embed === '1';

// The door out. The server names the address this instrument answers on from
// other machines; the page appends the key it already holds, so the link that
// lands in a browser is the full working one, worth bookmarking. An archive
// page has no live address behind it, so the control is removed, not pointed
// at itself: a control that cannot do anything is worse than no control.
const openBtn = $('openBtn');
function wireOpenBtn() {
  if (!openBtn || openBtn.dataset.wired || !world) return;
  const base = world.url || '';
  if (!base) {
    if (window.__EMBEDDED_WORLD__) { openBtn.remove(); return; }
    openBtn.href = location.origin + '/' + (KEY ? '?k=' + encodeURIComponent(KEY) : '');
  } else {
    openBtn.href = base + (KEY ? '?k=' + encodeURIComponent(KEY) : '');
  }
  openBtn.dataset.wired = '1';
}

// Framed by a VS Code webview, a plain target=_blank click goes nowhere: the
// webview drops a new-window request from inside a nested frame without a word.
// The framed page asks the extension instead, and the extension opens the link
// in the real browser. Anywhere else the anchor behaves as a normal link.
const IN_VSCODE = EMBED && (() => {
  try { return [...location.ancestorOrigins].some((o) => o.includes('vscode')); } catch { return false; }
})();
if (openBtn) openBtn.addEventListener('click', (ev) => {
  if (!IN_VSCODE) return;
  ev.preventDefault();
  window.parent.postMessage({ __tellurion: 'open', href: openBtn.href }, '*');
});
const canvas = $('plate');
const spineList = $('spineList');
const sminimap = $('sminimap');
const nerves = $('nerves');
const tip = $('tip');
const dossier = $('dossier');

let world = null;
let view = { scrubT: null, hover: null, focus: null, pinned: null };

/* ------------------------------------------------------------- spine + orrery */

const spine = initSpine(spineList, sminimap, {
  onHoverSeg(segId) {
    if (view.pinned) return;
    spine.setHot(segId);
    view.focus = segId;
    orrery.setView({ focus: segId });
    if (segId) showDossierFor(segId); else hideDossier();
  },
  onHoverVb() { /* rows carry their full text; no tooltip to cover them */ },
});
const orrery = initOrrery(canvas);

/* ------------------------------------------------------------- census + key */

// ONE census, read by the bar AND the key. They used to count separately, three
// inches apart: fillCensus dropped undeclared products and deferred to the plan's
// totals, buildKey did neither and read world.plan.totals without the exists and
// error guards. So a project with a plan could print "5 products" in the bar and
// "planet - a product from your plan  7" in the legend, and a BROKEN plan could
// put step totals on the core that the bar had already refused. That is decision
// D5's defect one layer down, and it takes D5's fix: anything that counts a body
// counts it HERE, once, or the screen gets two answers to one question again.
function census() {
  const s = world.stat;
  // A product nobody declared is a typo wearing a body. It is drawn, so the
  // operator can see and fix it, and it is counted as NEITHER a product nor a
  // project: calling it a project would only move the false statement rather
  // than remove it.
  const real = s.planets.filter(p => p.declared !== false);
  const flag = real.filter(p => p.tier === 'flagship').length;
  // WHEN A PLAN EXISTS, THE COUNT IS THE PLAN'S (decision D5, 2026-08-30).
  // It used to count everything the instrument had discovered anywhere, so the
  // bar read "14 products, 86 features" beside a spine reading 21/25. Products,
  // features and steps are the three the plan actually declares.
  const t = (world.plan && world.plan.exists && !world.plan.error && world.plan.totals) || null;
  return {
    products: t ? t.products : flag,
    // Minor planets are the discovered non-flagship bodies. No plan declares one,
    // so this figure comes from discovery whether a plan exists or not.
    projects: real.length - flag,
    // FEATURES, NOT STEPS. plan.mjs builds these as two different totals and
    // state.mjs is emphatic about why (a feature is a noun on the product, a step
    // is a verb under it). Reading one for the other is the bug that made the
    // spine read as a worklog.
    features: t ? t.features : s.features.length,
    // Steps are the work under the features, and the one thing the plan declares
    // that the other two do not already say. The chat's to-do rows are not the
    // plan and are excluded wherever they are counted.
    steps: t ? t.steps : s.milestones.filter(m => m.entity !== 'plan').length,
    stepsDone: t ? t.stepsDone : 0,
  };
}

function fillCensus() {
  const n = census();
  $('cnProducts').textContent = n.products;
  $('cnFeatures').textContent = n.features;
  // projects, tools, processes and workflows are no longer in the bar: they are
  // not this project, and they are what pushed it into the drive gauge
  $('cnSteps').textContent = n.steps;
  // The entity graph says whether it is invented; the bar repeats it. Read from
  // the data rather than from a launch flag, so the badge cannot be switched off
  // while the demo graph is still loaded.
  $('demoBadge').hidden = !(world && world.stat && world.stat.demo);
}

function buildKey() {
  const s = world.stat;
  const n = census();
  const c = 'stroke="currentColor" fill="none"';
  const g = (svg) => `<svg viewBox="0 0 26 18">${svg}</svg>`;
  // A row that counts something the plate is not drawing is a legend lying about
  // the picture beside it. With the bench filtered to what this project has USED,
  // "a fleet tool 60" sat next to a plate showing two. Bench rows now read
  // "used of total", and a row whose count is zero is not shown at all.
  const row = (glyph, name, n, cls = '') =>
    (n === 0 ? '' : `<div class="key-row ${cls}">${glyph}<span class="kr-name">${name}</span><span class="kr-n">${n === '' ? '' : n}</span></div>`);
  // Custody rungs are the exception to "hide a row at zero": the legend is the
  // rulebook for the ladder, and a rung nobody occupies is still a rung. Hiding
  // it meant the three-party grammar was unteachable until it first occurred,
  // which is exactly what F2 in battle-walk guards against.
  const rung = (glyph, name, n, cls = '') =>
    `<div class="key-row ${cls}">${glyph}<span class="kr-name">${name}</span><span class="kr-n">${n}</span></div>`;
  const usedN = (list) => list.filter((x) => world.usage && world.usage[x.id]).length;
  const benchRow = (glyph, name, list, cls = '') => {
    const u = orrery.getBench() === 'all' ? list.length : usedN(list);
    return row(glyph, name, u === list.length ? String(u) : `${u}<span class="kr-of"> of ${list.length}</span>`, cls);
  };
  const sec = (t) => `<div class="key-sec">${t}</div>`;

  // A row for something the instrument CANNOT DETECT says so, rather than
  // sitting at zero where it reads as "you have never used one". The two are
  // opposite facts and the reader cannot tell them apart from a bare 0.
  // "there should be a place where all this is explained. as in what each one is.
  // maybe a small button that has a section. i dont want it to be big, just
  // there." - Wassim, 2026-08-30 on the processes, and one line earlier on the
  // belt families: "i need to know what those are." So the explanation sits ON
  // the row that raises the question, folded behind a small opener, rather than
  // as a wall of text the legend would have to carry open at all times.
  const opener = (id, label) => `<button class="kr-what" data-what="${id}" aria-expanded="false">${label}</button>`;
  const whatRow = (name, note, cls = '') =>
    `<div class="kw-row ${cls}"><span class="kw-name">${name}</span><span class="kw-note">${note}</span></div>`;
  const whatPanel = (id, body) => `<div class="key-what" id="kw-${id}" hidden>${body}</div>`;

  // Each line is read off the family's ACTUAL members in world-static, never
  // invented: fleet is the thirteen tbk-* machine commands, ledgers is the
  // troubleshooting appender plus the five tracker scripts, engines is the
  // model-routing set, and so on.
  const FAMILY_SAID = {
    fleet: 'the tbk-* commands that know which machine you are on and reach the others',
    guardrails: 'hooks and gates that stop or reroute a call before it runs',
    engines: 'which model a session is on, and which pool still has quota',
    ledgers: 'appenders that write one durable row &mdash; the troubleshooting sheet, the skill tracker',
    publishing: 'through the Cloudflare Access wall and out to a public URL',
    ops: 'upkeep on the machines themselves &mdash; identity, memory, stuck processes, keeping WSL awake',
    bench: 'everything else that earned a place: readers, generators, project scripts',
  };

  // THE BELT IS SEVEN FAMILIES, AND "FLEET" IS ONE OF THEM.
  // The row used to read "belt diamond - a fleet tool" over a count of all 60
  // tools, but only 13 carry group:fleet (tbk-open, tbk-whoami, tbk-human-at and
  // the rest of the machine-level commands). The other 47 are guardrails,
  // engines, ledgers, publishing, ops and bench. The plate has always drawn these
  // as seven separate group arcs (orrery GROUP_ORDER), so the label disagreed
  // with the picture beside it as well as with the data under both. The families
  // are named here, where the question the old label raised is raised.
  const TOOL_FAMILIES = ['fleet', 'guardrails', 'engines', 'ledgers', 'publishing', 'ops', 'bench'];
  const familyLine = () => {
    const all = orrery.getBench() === 'all';
    const parts = TOOL_FAMILIES.map((fam) => {
      const list = (s.tools || []).filter((x) => (x.group || 'bench') === fam);
      if (!list.length) return '';
      const u = all ? list.length : usedN(list);
      return `${fam} <b>${u}</b>/${list.length}`;
    }).filter(Boolean);
    if (!parts.length) return '';
    return `<div class="key-sub">${parts.join(' &middot; ')} ${opener('fam', 'what these are')}</div>` +
      whatPanel('fam', TOOL_FAMILIES.map((fam) => {
        const list = (s.tools || []).filter((x) => (x.group || 'bench') === fam);
        return list.length
          ? whatRow(`${esc(fam)} <span class="kw-rule">${list.length}</span>`, FAMILY_SAID[fam] || '')
          : '';
      }).join(''));
  };

  // THE ELEVEN, AND THE TWO OF THEM NOTHING CAN SEE. Wassim kept eleven of the
  // thirteen scraped from OCC (K3 process-scope, 2026-08-30) and took Ship to
  // Vault and the OCC Cascade off the plate. Two survivors are blind by
  // construction - AutoSync runs on a timer and the brand gate is a pre-commit
  // hook - so the row names them, rather than letting a permanently dark arc
  // read as "you never do this".
  const blindProcs = (s.processes || []).filter((p) => !p.detect);
  const procPanel = () => whatPanel('proc',
    (s.processes || []).slice()
      .sort((a, b) => (Number(b.weight) || 1) - (Number(a.weight) || 1))
      .map((p) => whatRow(
        esc(p.name) + (p.rule ? ` <span class="kw-rule">rule ${esc(p.rule)}</span>` : ''),
        esc(p.plain || p.one_liner || '') + (p.blind ? ` <em>&mdash; ${esc(p.blind)}</em>` : ''),
        (Number(p.weight) || 1) > 1 ? 'kw-heavy' : '',
      )).join('') +
    '<div class="kw-foot">A wider arc on the plate is how much one matters to you, set in the data. ' +
    'It is not a measurement of anything.</div>');

  const fs = s.features;
  const nHand = fs.filter(f => f.inHand).length;
  const nOpen = fs.filter(f => f.status === 'open' && !f.inHand).length;
  const nClaim = fs.filter(f => f.status === 'claimed').length;
  const nVer = fs.filter(f => f.status === 'verified').length;
  const nAcc = fs.filter(f => f.status === 'fully-verified').length;
  // Agents idle. Counting every one ever seen and calling them all "at work"
  // overstated the fleet the moment a session finished.
  const AGENT_IDLE = 4 * 60_000;
  const nAgents = Object.values(world.agents || {}).filter(a => (Date.now() - a.lastAt) < AGENT_IDLE).length;
  // Commits this session, which is what a shooting star is drawn for. Git
  // history carries `pre`, and history does not streak: replaying a backlog
  // must not claim the fleet committed forty times a moment ago.
  const nCommits = (world.notches || []).filter((x) => !x.pre).length;
  // A process may declare a satellite: a mechanism that runs over its output.
  // Read from the data, so adding one is a data edit and the legend follows.
  const sats = (s.processes || []).filter((p) => p.satellite && (orrery.getBench() === 'all' || (world.usage && world.usage[p.id])));
  const satelliteRows = () => sats.map((p) => {
    const nBroken = fs.filter((f) => f.failedBy).length;
    return `<div class="key-row ${nBroken ? 'k-fault' : ''}">` +
      g(`<circle cx="13" cy="9" r="6.4" ${c} stroke-width=".6" stroke-dasharray="2 2.5" opacity=".7"/>` +
        `<circle cx="19.4" cy="9" r="2.5" ${c} stroke-width="1.2"/><circle cx="19.4" cy="9" r=".9" fill="currentColor"/>`) +
      `<span class="kr-name"><b>${esc(p.satellite.name)}</b> &middot; ${esc(p.satellite.plain || p.satellite.one_liner || '')}</span>` +
      `<span class="kr-n">${nBroken}</span></div>` +
      `<div class="key-sub">It orbits <b>${esc(p.name)}</b> because that is what it reads. A thread from it to a moon means that part was claimed done and a judge then rejected it.</div>`;
  }).join('');
  // The rim is a date scrubber only where there are dates to scrub. In genesis
  // mode there are none and the control is inert, so the legend must not tell
  // him to drag it: an instruction for a disabled control is worse than silence.
  const rimLive = !s.genesis;

  // Every row below describes what this plate ACTUALLY draws today. The ratified
  // grammar has more classes than are built, and those are named as not built
  // rather than quietly listed, because a legend that describes a version that
  // does not exist is the same defect as a screen that reports work nobody did.
  $('keyBody').innerHTML =
    sec('The bodies') +
    // THE CORE IS FIRST BECAUSE THE CORE IS THE PROJECT. Wassim, 2026-08-30:
    // "the project should be listed first, it's the core!". It sat fifth of
    // nine, under three classes of body that only exist because it does, so the
    // legend opened on the periphery and buried its own subject.
    row(g(`<circle cx="13" cy="9" r="3.4" fill="currentColor"/><path d="M13 2.2 A 6.8 6.8 0 0 1 19.8 9" ${c} stroke-width="1.8"/>`), 'the core &middot; this project, ringed by its plan', n.stepsDone + '/' + n.steps) +
    row(g(`<circle cx="13" cy="9" r="6.5" ${c} stroke-width="1.2"/><path d="M7.5 6.8h11M6.6 9h12.8M7.5 11.2h11" ${c} stroke-width=".6" opacity=".5"/>`), 'planet &middot; a product from your plan', n.products) +
    row(g(`<circle cx="13" cy="9" r="3.6" ${c} stroke-width="1"/><circle cx="13" cy="9" r="1.4" ${c} stroke-width=".5" opacity=".5"/>`), 'minor planet &middot; a project', n.projects) +
    // A MOON IS A FEATURE, NOT A STEP. state.mjs says so in capitals and gives
    // the reason: a step is a unit of work and reads as a verb ("Resolve a
    // project to its git root"), a feature is a part of the product and reads as
    // a noun ("Project discovery"). Promoting every step into a feature is the
    // exact bug that made the spine read as a worklog, and it was fixed in the
    // reducer while this row went on describing it.
    row(g(`<circle cx="13" cy="9" r="2" fill="currentColor"/><circle cx="13" cy="9" r="5.6" ${c} stroke-width=".7" opacity=".55"/>`), 'moon &middot; a feature of that product', n.features, 'k-pink') +
    row(g(`<path d="M13 3.4 L17.4 9 L13 14.6 L8.6 9 Z" ${c} stroke-width="1.1"/>`), 'chevron &middot; an agent at work now', nAgents, 'k-purple') +
    // Neither a product nor a part of one, and it can never climb the ladder,
    // because there is nothing of ours in it to sign off. Hollow on a dotted
    // shell so it cannot be read as a planet.
    row(g(`<circle cx="13" cy="9" r="6.6" ${c} stroke-width=".6" stroke-dasharray="1.5 2.5"/><circle cx="13" cy="9" r="3.6" ${c} stroke-width="1.2"/><circle cx="13" cy="9" r="1.1" fill="currentColor"/>`),
        'outside service &middot; something this product leans on and does not own', (s.services || []).length) +
    ((s.services || []).length
      ? `<div class="key-sub">Its thread runs to the product that DEPENDS on it, which is the only question anyone asks about a dependency: what of ours stops if theirs does.</div>`
      : '') +
    benchRow(g(`<rect x="10.8" y="6.8" width="4.4" height="4.4" transform="rotate(45 13 9)" ${c} stroke-width="1"/>`), 'belt diamond &middot; a standing tool', s.tools, 'k-bench') +
    familyLine() +
    // THE RING CARRIES A READING NOW. This row said "detection not built" and sat
    // hardcoded at 0 because attribute.mjs had three branches and no fourth:
    // Skill to a workflow, Agent to an unnamed comet, Bash to a belt tool, and
    // no path at all that could return a process. Each process now carries its
    // own signature in the data and the reducer has the fourth branch, so a
    // decision page written, a septa review run or a relay packet routed lights
    // its own arc. The two no session can reach are named on the line below
    // rather than buried inside the count.
    benchRow(g(`<path d="M3 13 A 11 11 0 0 1 23 13" ${c} stroke-width="1.6"/>`), 'ring arc &middot; a governance process', s.processes, 'k-amber') +
    `<div class="key-sub">${blindProcs.length
      ? `${blindProcs.map((p) => esc(p.name)).join(' and ')} cannot be seen from a session and draw dashed, never amber. `
      : ''}${opener('proc', 'what these are')}</div>` +
    procPanel() +
    // A satellite orbits a ring arc rather than the core, because its subject is
    // that arc's OUTPUT rather than the project. Only drawn where a process
    // declares one, so the row is absent rather than sitting at zero on a plate
    // that has none.
    satelliteRows() +
    benchRow(g(`<circle cx="19" cy="6" r="2" fill="currentColor"/><path d="M17 7.5 Q 12 11 4 13" ${c} stroke-width=".9" opacity=".6"/>`), 'comet &middot; a workflow', s.workflows, 'k-purple') +
    // A commit is the one thing here that is over the instant it happens, so it
    // is the one mark that exists only while it is happening. Named because the
    // legend's whole claim is that nothing on the plate is decoration.
    row(g(`<circle cx="19.5" cy="5.5" r="1.8" fill="currentColor"/><path d="M18 6.8 L5 13" ${c} stroke-width="1.3" opacity=".55" stroke-linecap="round"/>`), 'shooting star &middot; a commit landing', nCommits) +
    row(g(`<path d="M8 5.5 Q 13 8 18 5.5 Q 19.5 9 18 12.5 Q 13 10 8 12.5 Q 6.5 9 8 5.5 Z" ${c} stroke-width="1"/><circle cx="13" cy="9" r="1.2" fill="currentColor"/>`), 'vertebra &middot; a dated milestone', s.milestones.length) +
    `<div class="key-note">The belt, the ring arcs and the comets are the <b>standing fleet bench</b>. They are the same on every project and they are not yours to build.</div>` +

    sec('The chain of custody &middot; three parties, in order') +
    rung(g(`<circle cx="13" cy="9" r="2.3" ${c} stroke-width="1.1"/><path d="M13 3.6 A 5.4 5.4 0 0 1 17.8 6.6" stroke="currentColor" fill="none" stroke-width="1.4" stroke-linecap="round" opacity=".9"/>`), '<b>in hand</b> &middot; you are working on it now', nHand, 'k-live') +
    rung(g(`<circle cx="13" cy="9" r="2" ${c} stroke-width=".9"/>`), '<b>open</b> &middot; nobody has spoken for it', nOpen, 'k-pink') +
    rung(g(`<circle cx="13" cy="9" r="2" fill="currentColor"/>`), '<b>claimed</b> &middot; the builder says it is done', nClaim, 'k-pink') +
    rung(g(`<circle cx="13" cy="9" r="2" fill="currentColor"/><circle cx="13" cy="9" r="4" ${c} stroke-width=".7"/>`), '<b>verified</b> &middot; a judge passed it', nVer, 'k-pink') +
    rung(g(`<circle cx="13" cy="9" r="2" fill="currentColor"/><circle cx="13" cy="9" r="4" ${c} stroke-width=".8"/><circle cx="13" cy="9" r="6.2" ${c} stroke-width=".6" opacity=".6"/>`), '<b>accepted</b> &middot; you put your name to it', nAcc, 'k-pink') +
    `<div class="key-note">A product wears the same rings as its moons, and it sits at its <b>least advanced</b> one: a single unexamined part keeps the whole product short of the tier above. No party can grant its own tier, which is why the three live in three files.</div>` +

    sec('How it moves &middot; every movement is a reading') +
    `<table class="key-motion"><thead><tr><th>Class</th><th>What moves</th><th>What stillness means</th></tr></thead><tbody>
      <tr><td>The core</td><td>A charge runs the completed arc of the plan.</td><td>Nothing has been claimed yet.</td></tr>
      <tr><td>Features</td><td>They orbit their product; the step in hand carries a turning arc.</td><td>Only under reduced motion. A feature never stops on its own.</td></tr>
      <tr><td>Agents</td><td>A pulse ring while working, on a thread to what they are touching.</td><td>Idle. The one class where stillness is normal.</td></tr>
      <tr><td>Any body</td><td>A blue ring and a lime dot the moment it is touched.</td><td>Nothing has landed on it recently.</td></tr>
      <tr class="k-todo"><td>Products</td><td>Shading turns, rings precess, at a rate set by recency.</td><td colspan="1">not built yet</td></tr>
      <tr class="k-todo"><td>Ledgers</td><td>A new entry drops in and settles; older layers darken.</td><td>not built yet</td></tr>
      <tr class="k-todo"><td>Scheduled jobs</td><td>One turn of the diamond per cycle, at its real cadence.</td><td>not built yet</td></tr>
      <tr class="k-todo"><td>Scars</td><td>A slow pulse for as long as the fault is open.</td><td>not built yet</td></tr>
    </tbody></table>
    <div class="key-note">Reduced motion stops all of it and settles every mark on its resting frame, so the plate reads correctly with no animation at all.</div>` +

    sec('The numbers') +
    `<div class="key-note">planet size = milestones plus half-weight features, square-rooted and capped &middot;
     hatched outline = not built by the date you are replaying<br/>
     <em>lime = happening right now</em>, always with a blue pulse ring<br/>
     drive gauge = the pace of live events, decaying at rest` +
     (rimLive ? '<br/>drag the jewel on the rim to replay the record day by day' : '') +
     `<br/><b>Orbit and angle carry nothing.</b> Which ring a body sits on is composition, not data. Trust size, form, fill, rings, and spine order.</div>`;
}
// Delegated on the body, not bound per button: buildKey() rewrites keyBody's
// innerHTML on every repaint, so any listener attached to a button inside it is
// discarded the next time the world ticks.
document.getElementById('keyBody').addEventListener('click', (e) => {
  const b = e.target.closest('.kr-what');
  if (!b) return;
  e.stopPropagation();
  const panel = document.getElementById('kw-' + b.dataset.what);
  if (!panel) return;
  panel.hidden = !panel.hidden;
  b.setAttribute('aria-expanded', String(!panel.hidden));
  b.textContent = panel.hidden ? 'what these are' : 'hide';
});

document.querySelector('#key .key-head').addEventListener('click', () => {
  const k = $('key');
  k.classList.toggle('closed');
  $('keyBtn').textContent = k.classList.contains('closed') ? '+' : '\u2212';
  try { localStorage.setItem('la-legend', k.classList.contains('closed') ? 'closed' : 'open'); } catch {}
});

// Click anywhere else and the open panels close. Wassim, 2026-08-28: "when I
// expand the key at the bottom right and click somewhere else, it doesn't
// automatically minimize. Whenever I click outside of that area, it should."
// Escape closes them too, because a panel you opened with one click should not
// need a second aimed one to be rid of.
function closeKey() {
  const k = $('key');
  if (!k || k.classList.contains('closed')) return;
  k.classList.add('closed');
  $('keyBtn').textContent = '+';
  try { localStorage.setItem('la-legend', 'closed'); } catch {}
}
function closeViewMenu() { const m = document.getElementById('viewMenu'); if (m) m.hidden = true; }
document.addEventListener('click', (ev) => {
  if (!ev.target.closest('#key')) closeKey();
  if (!ev.target.closest('.viewwrap')) closeViewMenu();
});
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  closeKey(); closeViewMenu();
});
try { if (localStorage.getItem('la-legend') === 'open') { $('key').classList.remove('closed'); $('keyBtn').textContent = '\u2212'; } } catch {}
for (const b of document.querySelectorAll('#viewTabs .vt')) {
  b.addEventListener('click', () => {
    for (const x of document.querySelectorAll('#viewTabs .vt')) x.classList.toggle('on', x === b);
    spine.setViewMode(b.dataset.view);
    spine.render({ scrubT: view.scrubT });
    updateSpineScore();
    try { localStorage.setItem('la-spineview', b.dataset.view); } catch {}
  });
}
try {
  const sv = localStorage.getItem('la-spineview');
  if (sv === 'map') { document.querySelector('#viewTabs .vt[data-view=map]').classList.add('on'); document.querySelector('#viewTabs .vt[data-view=record]').classList.remove('on'); spine.setViewMode('map'); }
} catch {}

/* ------------------------------------------------------------- dossier */

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

const TIER_SAID = {
  'in-hand': 'This is the step in hand. Nobody has signed it yet, because it is not finished.',
  open: 'Nobody has spoken for this yet.',
  claimed: 'The builder says it is done. Nobody has checked it.',
  verified: 'A judge passed it. You have not accepted it yet.',
  'fully-verified': 'You accepted it. This is as far as the ladder goes.',
};

function showDossierFor(id) {
  // Framed in a panel, the card pops over the plan it is meant to summarize and
  // covers it, and the rows already expand their milestones inline. The dossier
  // is plate furniture; the panel has no plate.
  if (EMBED) return;
  const s = world.stat;
  const p = s.planets.find(x => x.id === id);
  const pr = s.processes.find(x => x.id === id);
  const tl = s.tools.find(x => x.id === id);
  const wf = s.workflows.find(x => x.id === id);
  const ft = s.features.find(x => x.id === id);
  const ag = String(id).startsWith('agent:') && (world.agents || {})[String(id).slice(6)];
  let html = '';
  // A feature is the unit this whole instrument is built on, and it had no card
  // at all: you could see a moon and never learn its name or who signed it.
  if (ft) {
    const owner = s.planets.find(x => x.id === ft.parent);
    dossier.innerHTML = `<div class="do-kind">Feature${owner ? ' of ' + esc(owner.name) : ''}</div>
      <div class="do-name">${esc(ft.name || ft.plain || ft.id)}</div>
      <span class="do-status ${esc(ft.failedBy ? 'failed' : ft.inHand ? 'in-hand' : ft.status)}">${ft.failedBy ? 'failed' : ft.inHand ? 'in hand' : esc(ft.status)}</span>
      <div class="do-line">${ft.failedBy
        ? `<b>${esc(ft.failedBy)} looked at this and FAILED it.</b>${ft.failedNote ? ' ' + esc(ft.failedNote) : ''}`
        : esc(TIER_SAID[ft.inHand ? 'in-hand' : ft.status] || '')}</div>
      ${ft.signedBy && !ft.failedBy ? `<div class="do-item"><span class="di-dot pink"></span><span class="di-txt">signed off by ${esc(ft.signedBy)}</span></div>` : ''}
      ${ft.staleVerdict ? '<div class="do-item"><span class="di-dot pink"></span><span class="di-txt">a judge passed an EARLIER version of this step; the wording changed since</span></div>' : ''}
      ${ft.staleAccept ? '<div class="do-item"><span class="di-dot pink"></span><span class="di-txt">you accepted an EARLIER version of this step; it has been re-judged or re-worded since</span></div>' : ''}
      ${workBlock(ft)}
      ${acceptControl(ft)}`;
    dossier.hidden = false;
    wireAccept(ft);
    return;
  }
  if (ag) {
    dossier.innerHTML = `<div class="do-kind">Agent</div>
      <div class="do-name">${esc(ag.name)}</div>
      <span class="do-status ${(Date.now() - ag.lastAt) < 240000 ? 'live' : 'dormant'}">${(Date.now() - ag.lastAt) < 240000 ? 'working' : 'idle'}</span>
      <div class="do-line">${ag.runs} run${ag.runs === 1 ? '' : 's'}${ag.target ? ' · last on ' + esc(String(ag.target).replace(/^(dir|plan):/, '')) : ''}</div>`;
    dossier.hidden = false;
    return;
  }
  if (p) {
    const ms = s.milestones.filter(m => m.entity === id);
    const fs = s.features.filter(f => f.parent === id);
    const recent = ms.slice(-4).reverse();
    html = `<div class="do-kind">${p.tier === 'flagship' ? 'Product' : 'Project'}</div>
      <div class="do-name">${esc(p.name)}</div>
      <span class="do-status ${p.status}">${p.status}</span>
      <div class="do-line">${esc(p.one_liner || '')}</div>`;
    if (recent.length) {
      html += `<div class="do-sec">Milestones · ${ms.filter(m => m.status === 'done').length}/${ms.length}</div>`;
      for (const m of recent) html += `<div class="do-item ${m.status === 'done' ? '' : 'ghost'}"><span class="di-dot"></span><span class="di-date">${m.date ? m.date.slice(5).replace('-', '.') : ''}</span><span class="di-txt">${esc(m.plain || m.label)}</span></div>`;
    }
    if (fs.length) {
      html += `<div class="do-sec">Features · ${fs.length}</div>`;
      for (const f of fs.slice(0, 5)) html += `<div class="do-item ${f.status === 'open' ? 'ghost' : ''}"><span class="di-dot pink"></span><span class="di-txt">${esc(f.plain || f.name)}</span></div>`;
      if (fs.length > 5) html += `<div class="do-item ghost"><span class="di-txt">+ ${fs.length - 5} more</span></div>`;
    }
    if (p.home) {
      let hp = p.home.replace('/home/wassim/projects/', '');
      if (hp.length > 46) hp = '…/' + hp.slice(hp.length - 44).split('/').slice(1).join('/');
      html += `<div class="do-home">${esc(hp)}</div>`;
    }
  } else if (pr) {
    html = `<div class="do-kind">Process${pr.rule ? ' · Rule ' + pr.rule : ''}</div>
      <div class="do-name">${esc(pr.name)}</div>
      <div class="do-line">${esc(pr.plain || pr.one_liner || '')}</div>
      ${pr.home ? `<div class="do-home">${esc(pr.home)}</div>` : ''}`;
  } else if (tl) {
    html = `<div class="do-kind">Tool · ${esc(tl.group)}</div>
      <div class="do-name">${esc(tl.name)}</div>
      <div class="do-line">${esc(tl.plain || tl.one_liner || '')}</div>`;
  } else if (wf) {
    html = `<div class="do-kind">Workflow</div>
      <div class="do-name">${esc(wf.name)}</div>
      <div class="do-line">${esc(wf.plain || wf.one_liner || '')}</div>`;
  } else {
    // Nothing matched. Clear it: returning early left the PREVIOUS body's card
    // on screen while you hovered something else, so the card described a thing
    // you were not pointing at.
    dossier.innerHTML = '';
    dossier.hidden = true;
    return;
  }
  dossier.innerHTML = html;
  dossier.hidden = false;
}
// What was actually done while this step was in hand. The reducer has recorded
// this from the beginning — which files were written, which commits landed — and
// nothing has ever drawn it, so the join between the plan and the work existed
// only as a field in a JSON snapshot. It is also what a judge's receipt is
// matched against, so showing it is what makes that inference checkable.
function workBlock(f) {
  // A feature's work is the work of every step under it. Work is recorded
  // against the step that was in hand, so a feature has none of its own and this
  // block would have gone silent on every body the plate draws once features
  // stopped being steps.
  const ids = Array.isArray(f.steps) && f.steps.length
    ? f.steps.map((s) => s.id)
    : [String(f.step || f.id).replace(/^(step|feat):/, '')];
  const sw = world.stepWork || {};
  const w = ids.length === 1 ? sw[ids[0]] : {
    paths: ids.flatMap((i) => (sw[i] && sw[i].paths) || []),
    commits: ids.flatMap((i) => (sw[i] && sw[i].commits) || []),
  };
  const notes = [];
  if (w && w.paths && w.paths.length) {
    const shown = w.paths.slice(-4).reverse();
    notes.push(`<div class="do-sec">Done while this was in hand &middot; ${w.paths.length} file${w.paths.length === 1 ? '' : 's'}</div>` +
      shown.map((p) => `<div class="do-item"><span class="di-dot"></span><span class="di-txt">${esc(p)}</span></div>`).join('') +
      (w.paths.length > shown.length ? `<div class="do-item ghost"><span class="di-txt">+ ${w.paths.length - shown.length} more</span></div>` : ''));
  }
  if (w && w.commits && w.commits.length) {
    const byShaSubject = new Map((world.notches || []).map((n) => [n.sha, n.subject]));
    const shown = w.commits.slice(-3).reverse();
    notes.push(`<div class="do-sec">Commits &middot; ${w.commits.length}</div>` +
      shown.map((sha) => `<div class="do-item"><span class="di-dot"></span><span class="di-txt"><b>${esc(String(sha).slice(0, 8))}</b> ${esc(byShaSubject.get(sha) || '')}</span></div>`).join(''));
  }
  // Where a verdict came from. A judge's name on a step is only worth something
  // if you can see what it was given for.
  if (f.verdictVia === 'sentinel-receipt' && f.verdictMatched && f.verdictMatched.length) {
    notes.push(`<div class="do-item"><span class="di-dot pink"></span><span class="di-txt">judged from ${esc(f.verdictMatched.slice(0, 3).join(', '))}</span></div>`);
  }
  if (!notes.length && f.inHand) notes.push('<div class="do-item ghost"><span class="di-txt">nothing recorded against this yet</span></div>');
  return notes.join('');
}

// The top rung is HIS act, and there was no way to perform it anywhere on the
// page: the legend promised "two rings = you accepted it" against a ladder whose
// last step could only be climbed by hand-editing a JSON file. Offered only when
// it would actually move: the API refuses the rest, and a button that always
// answers "no" teaches you to stop pressing it.
const acceptControl = (f) => {
  if (f.status === 'verified' || f.staleAccept) {
    return `<button class="do-act" data-accept="${esc(String(f.step || f.id).replace(/^(step|feat):/, ''))}">${f.staleAccept ? 'Accept this version' : 'Accept this'}</button><span class="do-act-say"></span>`;
  }
  if (f.status === 'fully-verified') {
    return `<button class="do-act undo" data-unaccept="${esc(String(f.step || f.id).replace(/^(step|feat):/, ''))}">Take my acceptance back</button><span class="do-act-say"></span>`;
  }
  if (f.status === 'claimed') return '<div class="do-act-note">A judge has to pass this before you can accept it. The ladder is climbed in order.</div>';
  return '';
};

function wireAccept(f) {
  const btn = dossier.querySelector('.do-act');
  if (!btn) return;
  const say = dossier.querySelector('.do-act-say');
  btn.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    btn.disabled = true;
    say.textContent = '…';
    const undo = btn.hasAttribute('data-unaccept');
    const step = btn.getAttribute(undo ? 'data-unaccept' : 'data-accept');
    try {
      const r = await (window.__laFetch || fetch)('/api/accept', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(undo ? { step, undo: true } : { step, by: acceptor() }),
      });
      const d = await r.json();
      say.textContent = d && d.ok ? (undo ? 'taken back' : 'accepted') : (d && d.error ? String(d.error).slice(0, 90) : 'refused');
    } catch { say.textContent = 'the server did not answer'; }
    btn.disabled = false;
  });
  void f;
}

// Who is signing. Asked once and kept, because an unsigned acceptance is not
// acceptance and the server refuses one outright.
function acceptor() {
  let who = '';
  try { who = localStorage.getItem('la-who') || ''; } catch {}
  if (!who) {
    who = (prompt('Accepting is you putting your name to this. What name should it record?') || '').trim();
    if (who) { try { localStorage.setItem('la-who', who); } catch {} }
  }
  return who;
}

function hideDossier() { if (!view.pinned) dossier.hidden = true; }

/* ------------------------------------------------------------- tip */

function placeTip(x, y) {
  const wrap = $('plateWrap').getBoundingClientRect();
  tip.hidden = false;
  const tb = tip.getBoundingClientRect();
  let lx = x - wrap.left + 14, ly = y - wrap.top + 12;
  if (lx + tb.width > wrap.width - 10) lx = x - wrap.left - tb.width - 10;
  if (ly + tb.height > wrap.height - 10) ly = y - wrap.top - tb.height - 8;
  tip.style.left = lx + 'px'; tip.style.top = ly + 'px';
}

/* ------------------------------------------------------------- canvas interactions */

let scrubbing = false;

canvas.addEventListener('pointermove', (ev) => {
  if (!world) return;
  const b = canvas.getBoundingClientRect();
  const mx = ev.clientX - b.left, my = ev.clientY - b.top;
  if (scrubbing) { doScrub(mx, my); return; }
  const hit = orrery.hitTest(mx, my);
  canvas.style.cursor = hit ? 'pointer' : orrery.nearRim(mx, my) ? 'ew-resize' : 'default';
  if (hit && hit.kind !== 'rim') {
    view.hover = hit;
    orrery.setView({ hover: hit, focus: view.pinned || hit.id });
    tip.innerHTML = `<div class="t-name">${esc(hit.label)}</div><div class="t-sub">${hit.kind}</div>`;
    placeTip(ev.clientX, ev.clientY);
    if (!view.pinned) {
      showDossierFor(hit.id);
      const seg = spine.segAnchor(hit.id);
      spine.setHot(seg ? hit.id : null);
    }
  } else {
    view.hover = null;
    orrery.setView({ hover: null, focus: view.pinned });
    tip.hidden = true;
    if (!view.pinned) { spine.setHot(null); hideDossier(); }
  }
});

canvas.addEventListener('pointerdown', (ev) => {
  const b = canvas.getBoundingClientRect();
  const mx = ev.clientX - b.left, my = ev.clientY - b.top;
  const hit = orrery.hitTest(mx, my);
  if ((!hit || hit.kind === 'rim') && orrery.nearRim(mx, my)) {
    scrubbing = true;
    canvas.setPointerCapture(ev.pointerId);
    doScrub(mx, my);
    return;
  }
  if (hit) {
    view.pinned = view.pinned === hit.id ? null : hit.id;
    orrery.setView({ focus: view.pinned || hit.id });
    if (view.pinned) showDossierFor(view.pinned); else { dossier.hidden = true; }
  } else {
    view.pinned = null;
    dossier.hidden = true;
    orrery.setView({ focus: null });
  }
});
canvas.addEventListener('pointerup', () => { scrubbing = false; });
canvas.addEventListener('pointerleave', () => { tip.hidden = true; if (!view.pinned) { spine.setHot(null); hideDossier(); } });

function doScrub(mx, my) {
  const t = orrery.dateAtPoint(mx, my);
  if (t == null) return;
  const span = orrery.span();
  const atEnd = span && (span.max - t) < (span.max - span.min) * 0.01;
  setScrub(atEnd ? null : t);
}

function setScrub(T) {
  view.scrubT = T;
  orrery.setView({ scrubT: T });
  spine.invalidate();
  spine.render({ scrubT: T });
  updateSpineScore();
  const ro = $('scrubReadout');
  if (T == null) { ro.hidden = true; }
  else {
    ro.hidden = false;
    $('scrubDate').textContent = new Date(T).toISOString().slice(0, 10);
  }
}
$('scrubReset').addEventListener('click', () => setScrub(null));

/* ------------------------------------------------------------- mode */

// Which LIGHT register the Observatory button returns to. There are two now
// (plate and rustic), so a hardcoded 'plate' would silently throw the skin away
// the first time anyone looked at the observatory and came back. Declared above
// setMode rather than beside its listener: `let` is in the temporal dead zone
// until its own line runs, so a setMode call from anywhere earlier would throw.
let lightMode = 'plate';

function setMode(m) {
  document.documentElement.dataset.mode = m;
  if (m !== 'observatory') lightMode = m;
  $('modeBtn').textContent = m === 'observatory' ? (lightMode === 'rustic' ? 'Rustic' : 'Plate') : 'Observatory';
  orrery.retheme();
  spine.invalidate();
  spine.render({ scrubT: view.scrubT });
  try { localStorage.setItem('la-mode', m); } catch {}
}
$('modeBtn').addEventListener('click', () => setMode(
  document.documentElement.dataset.mode === 'observatory' ? lightMode : 'observatory'));

/* ---------------------------------------------------------------- the View menu
   One control for what the plate draws. It replaces the project picker, which
   made no sense once an instance is tied to a single project, and it absorbs the
   Bench and Names buttons so the bar carries three controls instead of five. */
// The number beside a kind is what the plate DRAWS, not what exists. Bench kinds
// are filtered to what this project has used, so printing the whole kit here
// would repeat the exact defect the legend had: a count that disagrees with the
// picture it is describing.
const usedOf = (list) => {
  if (orrery.getBench() === 'all') return String(list.length);
  const u = list.filter((x) => world.usage && world.usage[x.id]).length;
  return u === list.length ? String(u) : `${u} of ${list.length}`;
};
const VIEW_KINDS = [
  ['products', 'Products', (s) => String(s.planets.filter((p) => p.tier === 'flagship' && p.declared !== false).length)],
  ['features', 'Features', (s) => String(s.features.length)],
  ['milestones', 'Milestones', (s) => String(s.milestones.length)],
  ['tools', 'Tools', (s) => usedOf(s.tools)],
  ['processes', 'Processes', (s) => usedOf(s.processes)],
  ['workflows', 'Workflows', (s) => usedOf(s.workflows)],
  ['agents', 'Agents', () => ''],
  // Only offered where the graph has any, so the menu never lists a control for
  // a class this plate cannot draw.
  ['services', 'Outside services', (s) => String((s.services || []).length)],
];
let hiddenKinds = new Set();
try { hiddenKinds = new Set(JSON.parse(localStorage.getItem('tellurion-hidden') || '[]')); } catch {}
function applyHidden() {
  orrery.setHidden([...hiddenKinds]);
  try { localStorage.setItem('tellurion-hidden', JSON.stringify([...hiddenKinds])); } catch {}
  spine.invalidate();
}
function buildViewMenu() {
  if (!world) return;
  const m = $('viewMenu');
  const rows = VIEW_KINDS.filter(([k]) => k !== 'services' || (world.stat.services || []).length).map(([k, label, count]) => {
    const n = count(world.stat);
    return `<div class="vm-row ${hiddenKinds.has(k) ? '' : 'on'}" data-kind="${k}">
      <span class="vm-box"></span><span>${label}</span><span class="vm-n">${n === '' ? '' : n}</span></div>`;
  }).join('');
  m.innerHTML = `<div class="vm-sec">Show on the plate</div>${rows}`
    + `<div class="vm-sec">Bench</div>`
    + `<div class="vm-row ${orrery.getBench() === 'used' ? 'on' : ''}" data-opt="bench"><span class="vm-box"></span><span>Only what this project used</span></div>`
    + `<div class="vm-sec">Names</div>`
    + `<div class="vm-row ${orrery.getLabels() === 'all' ? 'on' : ''}" data-opt="labels"><span class="vm-box"></span><span>Always show names</span></div>`;
  m.querySelectorAll('.vm-row').forEach((r) => r.addEventListener('click', (ev) => {
    ev.stopPropagation();
    const k = r.dataset.kind;
    if (k) { hiddenKinds.has(k) ? hiddenKinds.delete(k) : hiddenKinds.add(k); applyHidden(); }
    else if (r.dataset.opt === 'bench') setBenchMode(orrery.getBench() === 'used' ? 'all' : 'used');
    else if (r.dataset.opt === 'labels') setLabelMode(orrery.getLabels() === 'all' ? 'hover' : 'all');
    buildViewMenu();
  }));
}
$('viewBtn').addEventListener('click', (ev) => {
  ev.stopPropagation();
  const m = $('viewMenu');
  if (m.hidden) { buildViewMenu(); m.hidden = false; } else m.hidden = true;
});

// Names on the plate: hover by default, all on demand. The choice is REMEMBERED,
// because it is a preference about how you read the instrument rather than a
// state of the project, and being asked again every reload is its own annoyance.
function setLabelMode(m) {
  orrery.setLabels(m);
  const lb = document.getElementById('labelBtn'); if (lb) lb.textContent = m === 'all' ? 'Names: all' : 'Names: hover';
  try { localStorage.setItem('tellurion-labels', m); } catch {}
}


// The bench: only what this project has used, or the whole kit on demand.
function setBenchMode(m) {
  orrery.setBench(m);
  const bb = document.getElementById('benchBtn'); if (bb) bb.textContent = m === 'all' ? 'Bench: all' : 'Bench: used';
  try { localStorage.setItem('tellurion-bench', m); } catch {}
}
try { setBenchMode(localStorage.getItem('tellurion-bench') || 'used'); } catch { setBenchMode('used'); }
try { setLabelMode(localStorage.getItem('tellurion-labels') || 'hover'); } catch { setLabelMode('hover'); }
// ?skin= wins over the saved preference and does NOT overwrite it, so opening
// the demo link on the operator's own browser cannot leave his instrument in a
// register he never chose. Only names the stylesheet defines are honoured.
const SKINS = new Set(['plate', 'rustic', 'observatory']);
const wantSkin = new URLSearchParams(location.search).get('skin');
if (wantSkin && SKINS.has(wantSkin)) {
  document.documentElement.dataset.mode = wantSkin;
  if (wantSkin !== 'observatory') lightMode = wantSkin;
  $('modeBtn').textContent = wantSkin === 'observatory' ? (lightMode === 'rustic' ? 'Rustic' : 'Plate') : 'Observatory';
  orrery.retheme(); spine.invalidate(); spine.render({ scrubT: view.scrubT });
} else {
  try { const saved = localStorage.getItem('la-mode'); if (saved) setMode(saved); } catch {}
}

/* ------------------------------------------------------------- ticker + readouts */

// Watch the SEQUENCE, never the length: the ticker is a capped ring buffer, so
// its length stops changing the moment it fills and the strip froze there, with
// a frozen clock, while work carried on behind it.
let tickerSeen = -1;
function syncTicker() {
  if (world.tickerSeq === tickerSeen) return;
  tickerSeen = world.tickerSeq;
  const track = $('tickTrack');
  const items = world.ticker.slice(-28);   // the reducer already refused the noise
  track.innerHTML = items.slice().reverse().map((t, i) => {
    const d = new Date(t.at);
    const hh = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') + ':' + String(d.getSeconds()).padStart(2, '0');
    return `<span class="tk ${t.kind}${i === 0 ? ' fresh' : ''}"><i></i><time>${hh}</time>${esc(t.text)}</span>`;
  }).join('');
}

function fillFeatStrip() {
  const fs = world.stat.features;
  // The step in hand is counted apart from the untouched ones. Folding it into
  // "open" said the work he is doing right now and the work nobody has started
  // are the same thing, which is the one distinction he most wants on screen.
  const hand = fs.filter(f => f.inHand).length;
  const o = fs.filter(f => f.status === 'open' && !f.inHand).length;
  const cl = fs.filter(f => f.status === 'claimed').length;
  const v = fs.filter(f => f.status === 'verified').length;
  const fv = fs.filter(f => f.status === 'fully-verified').length;
  // Each number names WHO said so, because the whole ladder is about which
  // party signed. "verified" alone hid the difference between a judge passing
  // something and him accepting it.
  // Short forms. The long version wrapped to two lines and collided with the
  // score's label, and five spelled-out words to carry five numbers is exactly
  // the filler that costs the panel its space.
  // The strip is gone. Its feature count was already in the bar next to the
  // wordmark, and the rest was five more numbers on a panel that is meant to be
  // read: the per-product scores carry the same information where it applies.
  const strip = document.getElementById('featStrip');
  if (strip) strip.textContent = '';
}

function updateSpineScore() {
  const done = spine.doneCount(view.scrubT);
  const tot = spine.total();
  $('spineDone').textContent = done;
  $('spineTotal').textContent = tot;
  $('spineFill').style.width = tot ? (100 * done / tot).toFixed(1) + '%' : '0%';
}

/* ------------------------------------------------------------- nerve overlay */

function drawNerveOverlay() {
  const focus = view.pinned || (view.hover && view.hover.id);
  nerves.innerHTML = '';
  if (!focus) return;
  const seg = spine.segAnchor(focus);
  const p = orrery.posOf(focus);
  if (!seg || !seg.el || !p) return;
  const stage = document.querySelector('.stage').getBoundingClientRect();
  const cb = canvas.getBoundingClientRect();
  const r2 = seg.el.getBoundingClientRect();
  const x1 = cb.left - stage.left + p.x, y1 = cb.top - stage.top + p.y;
  const x2 = r2.left - stage.left + 4;
  const y2 = Math.min(Math.max(r2.top - stage.top + r2.height / 2, 12), stage.height - 12);
  nerves.setAttribute('viewBox', `0 0 ${stage.width} ${stage.height}`);
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', `M ${x1} ${y1} C ${x1 + (x2 - x1) * 0.5} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`);
  path.setAttribute('stroke-width', '1.3');
  nerves.appendChild(path);
  if (!dossier.hidden) {
    const db = dossier.getBoundingClientRect();
    const cardX = db.left - stage.left + 14;
    const cardY = db.top - stage.top;
    const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p2.setAttribute('d', `M ${x1} ${y1} C ${x1} ${y1 + 40}, ${cardX} ${cardY - 40}, ${cardX} ${cardY}`);
    p2.setAttribute('stroke-width', '0.9');
    p2.setAttribute('stroke-dasharray', '3 3');
    nerves.appendChild(p2);
  }
}

/* ------------------------------------------------------------- SSE */

// The subline used to be hardcoded to "what TBK Labs builds", which was a lie
// the moment this followed anything else. It names the real target now.
// The spine's headline counts the DECLARED plan when there is one, because that
// is what the panel is showing; calling plan steps "milestones" mislabels them.
function paintSpineHead() {
  const lab = document.querySelector('.ss-lab');
  if (!lab || !world) return;
  const t = world.plan && world.plan.totals;
  // updateSpineScore already counts the plan rows, so only the WORD is wrong.
  lab.textContent = 'done'; // the number is beside it; the sentence was filler
}

// paintSubline is GONE with the masthead subline it wrote to. It selected
// '.subline', and the spine's feature strip carries that same class, so once the
// masthead element was removed this function would have overwritten
// "86 feat · 26 open · ..." with the project name. The project is named in the
// picker beside the gauge, which is the one place it needs to be.

function bootFromWorld() {
  W.seedSeq(400000);
  tickerSeen = -1;   // a fresh world carries its own sequence, which may be lower
  orrery.setWorld(world);
  spine.setWorld(world);
  fillCensus();
  fillFeatStrip();
  buildKey();
  spine.render({ scrubT: view.scrubT });
  updateSpineScore();
  syncTicker();
}

let es = null, retry = 800;
function connect() {
  if (window.__EMBEDDED_WORLD__) {
    world = window.__EMBEDDED_WORLD__;
    wireOpenBtn();
    paintSpineHead();
    world.transients = []; world.pulses = {}; world.drive.energy = 0; world.drive.rpm = 0.42;
    $('liveTxt').textContent = 'archive';
    $('liveDot').classList.add('demo');
    // An archive has no server behind it, so the project picker has nothing to
    // switch to and its fetch would only raise an error on a page that is
    // supposed to open cleanly from a file. It is removed, not disabled: a
    // control that cannot do anything is worse than no control.
    const ib = document.getElementById('instBtn');
    if (ib) ib.remove();
    const ip = document.getElementById('instPanel');
    if (ip) ip.remove();
    bootFromWorld();
    return;
  }
  es = new EventSource(keyed('/events'));   // EventSource cannot carry a header
  es.addEventListener('snapshot', (ev) => {
    world = JSON.parse(ev.data);
    wireOpenBtn();
    paintSpineHead();
    if (window.__paintFollowing) window.__paintFollowing((world.project && world.project.following) || null);
    retry = 800;
    if (world.project.demo) {
      $('liveTxt').textContent = 'rehearsal';
      $('liveDot').classList.add('demo');
    } else {
      $('liveTxt').textContent = 'live';
      $('liveDot').classList.remove('demo');
    }
    $('liveDot').classList.remove('down');
    bootFromWorld();
  });
  es.addEventListener('delta', (ev) => {
    if (!world) return;
    const { type, payload } = JSON.parse(ev.data);
    apply(type, payload);
  });
  es.onerror = () => {
    $('liveTxt').textContent = 'reconnecting';
    $('liveDot').classList.add('down');
    es.close();
    setTimeout(connect, retry);
    retry = Math.min(8000, retry * 1.7);
  };
}

function apply(type, payload) {
  switch (type) {
    case 'file': W.applyFile(world, payload); break;
    case 'tool': W.applyTool(world, payload); break;
    case 'todos': W.applyTodos(world, payload); break;
    case 'fault': W.applyFault(world, payload); break;
    case 'prompt': W.applyPrompt(world, payload); break;
    case 'commit': W.applyCommit(world, payload); break;
  }
  if (world.stat.genesis && (type === 'todos' || (type === 'file' && payload.created))) {
    spine.setWorld(world);
    spine.invalidate();
    spine.render({ scrubT: view.scrubT });
    updateSpineScore();
    fillCensus();
    fillFeatStrip();
  }
  syncTicker();
}

/* ------------------------------------------------------------- frame loop */

function resizeAll() {
  orrery.resize();
  spine.invalidate();
  if (world) spine.render({ scrubT: view.scrubT });
}
window.addEventListener('resize', resizeAll);
resizeAll();
connect();

function loop(nowMs) {
  if (world) {
    const now = Date.now();
    W.decayDrive(world, now);
    W.prune(world, now);
    if (!EMBED) {
      $('rpm').textContent = world.drive.rpm.toFixed(2);
      orrery.frame(nowMs);
      drawNerveOverlay();
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ------------------------------------------------------------- test hook */

window.__la = {
  get world() { return world; },
  bodies: () => orrery.stats().bodiesDrawn,
  spine: () => ({ ...spine.stats(), done: spine.doneCount(view.scrubT), total: spine.total() }),
  hover: (id) => { view.pinned = id; orrery.setView({ focus: id }); spine.setHot(id); if (id) showDossierFor(id); else dossier.hidden = true; },
  scrubTo: (dateStr) => setScrub(dateStr ? +new Date(dateStr + 'T12:00:00Z') : null),
  mode: () => document.documentElement.dataset.mode,
  setMode,
  // Names are opt-in and live behind the View menu, which a walk would have to
  // open and click through to reach. Both modes are reachable here so a
  // screenshot can be taken with every body named without simulating a menu.
  setLabels: (m) => setLabelMode(m),
  setBench: (m) => setBenchMode(m),
  dossierText: () => (dossier.hidden ? '' : dossier.textContent),
};

/* ------------------------------------------------- the project picker
   The unit is the PROJECT, never one chat. A chat is a fragment: it opens, does
   a piece of work and ends, and the next one carries on the same codebase. The
   project is the thing with a beginning, a middle and a shape, so that is what
   the instrument follows, and every editor session on it feeds it.

   Picking re-points every feed on the server; the fresh snapshot arrives on the
   existing stream, so nothing here rebuilds the view by hand. */
(function instancePicker() {
  const btn = document.getElementById('instBtn');
  const panel = document.getElementById('instPanel');
  const list = document.getElementById('instList');
  const foot = document.getElementById('instFoot');
  const lab = document.getElementById('instLab');
  const close = document.getElementById('instClose');
  if (!btn || !panel) return;

  const ago = (ms) => {
    const s = Math.round(ms / 1000);
    if (s < 60) return s + 's ago';
    const m = Math.round(s / 60);
    if (m < 60) return m + 'm ago';
    const h = m / 60;
    return (h < 24 ? h.toFixed(h < 10 ? 1 : 0) + 'h' : Math.round(h / 24) + 'd') + ' ago';
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function paintButton(f) {
    if (!f) { lab.textContent = 'Choose a project'; btn.classList.remove('on'); return; }
    lab.textContent = f.name || f.project || 'Following';
    btn.classList.toggle('on', !!f.live);
    const chats = f.sessions ? `${f.sessions} chat${f.sessions === 1 ? '' : 's'}` : '';
    btn.title = `Following ${f.path || f.name}${chats ? ', ' + chats : ''}. Click to follow a different project.`;
  }

  async function load() {
    list.innerHTML = '<div class="inst-empty">Looking for projects&hellip;</div>';
    let d;
    try {
      const r = await authFetch('/api/projects?max=30', { cache: 'no-store' });
      // r.ok was never read, so a 401 body with no `projects` array fell through
      // to the empty state and told him his projects do not exist. Being locked
      // out and having nothing are completely different facts.
      if (r.status === 401) {
        list.innerHTML = '<div class="inst-empty">This instrument is on the network, so it needs its key.<br/>Open the link the server printed at boot, once.</div>';
        foot.textContent = '';
        return;
      }
      if (!r.ok) {
        list.innerHTML = `<div class="inst-empty">The server answered ${r.status}.</div>`;
        foot.textContent = '';
        return;
      }
      d = await r.json();
    } catch {
      list.innerHTML = '<div class="inst-empty">Could not reach the server.</div>';
      return;
    }
    paintButton(d.following);
    const xs = d.projects || [];
    if (!xs.length) {
      list.innerHTML = '<div class="inst-empty">No projects worked on recently.</div>';
      foot.textContent = '';
      return;
    }
    list.innerHTML = xs.map((i) => {
      const chats = `${i.sessions} chat${i.sessions === 1 ? '' : 's'}`;
      const liveBit = i.liveSessions ? ` &middot; ${i.liveSessions} open now` : '';
      return `
      <button class="inst-row${i.live ? ' is-live' : ''}" data-id="${esc(i.id)}" aria-current="${i.current ? 'true' : 'false'}">
        <span class="inst-i"></span>
        <span>
          <span class="inst-name">${esc(i.name)}</span>
          <span class="inst-meta">${esc(i.branch || 'no branch')} &middot; ${chats}${liveBit}${i.git ? '' : ' &middot; not a repo'}${i.current ? ' &middot; following' : ''}</span>
          ${i.title ? `<span class="inst-title">${esc(i.title)}</span>` : ''}
        </span>
        <span class="inst-age">${i.live ? 'live' : ago(i.ageMs)}</span>
      </button>`;
    }).join('');
    const live = xs.filter((i) => i.live).length;
    foot.textContent = `${xs.length} projects worked on recently, ${live} live now`;
    // the one already being followed is preselected, and scrolled to
    const cur = list.querySelector('[aria-current="true"]');
    if (cur) { cur.scrollIntoView({ block: 'nearest' }); cur.focus({ preventScroll: true }); }
  }

  async function choose(id) {
    list.innerHTML = '<div class="inst-empty">Re-pointing every feed&hellip;</div>';
    try {
      const r = await authFetch('/api/watch', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }),
      });
      if (r.status === 401) { list.innerHTML = '<div class="inst-empty">Not authorised to switch. Open the link the server printed at boot.</div>'; return; }
      const d = await r.json();
      if (d && d.ok) { paintButton(d.following); shut(); return; }
      list.innerHTML = `<div class="inst-empty">${(d && d.error) ? String(d.error).slice(0, 120) : 'That project is no longer available.'}</div>`;
    } catch {
      list.innerHTML = '<div class="inst-empty">Could not switch. The server did not answer.</div>';
    }
  }

  const open = () => { panel.hidden = false; load(); };
  const shut = () => { panel.hidden = true; };
  btn.addEventListener('click', () => (panel.hidden ? open() : shut()));
  close.addEventListener('click', shut);
  list.addEventListener('click', (e) => {
    const row = e.target.closest('.inst-row');
    if (row) choose(row.getAttribute('data-id'));
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) shut(); });
  document.addEventListener('mousedown', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && !btn.contains(e.target)) shut();
  });

  // The bar must never claim to follow something it no longer follows. An
  // archive has no server, so it never asks.
  if (window.__EMBEDDED_WORLD__) return;
  authFetch('/api/projects?max=1', { cache: 'no-store' })
    .then((r) => r.json()).then((d) => paintButton(d.following)).catch(() => {});
  window.__paintFollowing = paintButton;
})();
