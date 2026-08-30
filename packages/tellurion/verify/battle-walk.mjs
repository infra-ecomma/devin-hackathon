#!/usr/bin/env node
// The battle gate. Every assertion here is a defect that was LIVE, found by
// using this instrument the way its operator would on a new project, and each
// one is written as the invariant rather than as the shape of the fix, so it
// keeps biting when the code moves.
//
//   node verify/battle-walk.mjs
//
// Groups, in the order they cost him:
//   A  the screen tells the truth over time   (the ticker, the noise)
//   B  day zero                                (the on-ramp, the census, the feed)
//   C  the chain of custody, on the glass      (tiers, in hand, cards)
//   D  the plan file survives being edited     (destruction, ids, trouble said)
//   E  the instrument is not a write primitive (the key)
//   F  the legend and the rulebook are true    (the key panel, the Logic tab)

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import * as W from '../lib/state.mjs';
import * as P from '../lib/plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.dirname(HERE);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function freePort(start) {
  const net = await import('node:net');
  for (let p = start; p < start + 60; p++) {
    const ok = await new Promise((res) => {
      const s = net.createServer();
      s.once('error', () => res(false));
      s.once('listening', () => s.close(() => res(true)));
      s.listen(p, '127.0.0.1');
    });
    if (ok) return p;
  }
  throw new Error('no free port');
}

let pass = 0, fail = 0;
const ok = (n, cond, note = '') => {
  if (cond) { pass++; console.log(`PASS  ${n}${note ? '   [' + String(note).slice(0, 110) + ']' : ''}`); }
  else { fail++; console.log(`FAIL  ${n}${note ? '  :: ' + String(note).slice(0, 200) : ''}`); }
};

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tellurion-battle-'));
const kids = [];
const boot = async (root, extra = []) => {
  const port = await freePort(19400 + kids.length * 3);
  const s = spawn('node', [path.join(APP, 'server.mjs'), '--project', root, '--port', String(port), ...extra],
    { stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  s.stdout.on('data', (b) => { log += b; });
  s.stderr.on('data', (b) => { log += b; });
  kids.push(s);
  for (let i = 0; i < 60; i++) {
    await wait(120);
    try { await fetch(`http://127.0.0.1:${port}/health`); return { port, proc: s, log: () => log }; } catch {}
  }
  throw new Error('server never answered: ' + log.slice(0, 300));
};
const get = (port, p) => fetch(`http://127.0.0.1:${port}${p}`).then((r) => r.json());
const post = (port, p, body, headers = {}) =>
  fetch(`http://127.0.0.1:${port}${p}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) })
    .then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }));

function repo(name, plan) {
  const d = path.join(TMP, name);
  fs.mkdirSync(path.join(d, 'src'), { recursive: true });
  fs.writeFileSync(path.join(d, 'README.md'), '# ' + name + '\n');
  try {
    execFileSync('git', ['init', '-q'], { cwd: d });
    execFileSync('git', ['config', 'user.email', 't@t.co'], { cwd: d });
    execFileSync('git', ['config', 'user.name', 'T'], { cwd: d });
    execFileSync('git', ['add', '-A'], { cwd: d });
    execFileSync('git', ['commit', '-qm', 'first'], { cwd: d });
  } catch {}
  if (plan) {
    fs.mkdirSync(path.join(d, '.tellurion'), { recursive: true });
    fs.writeFileSync(path.join(d, '.tellurion', 'plan.json'), JSON.stringify(plan, null, 2));
  }
  return d;
}

const PLAN = {
  project: 'Kettle',
  products: [{ id: 'kettle', name: 'The Kettle' }, { id: 'dial', name: 'The Dial' }],
  phases: [
    { id: 'heat', title: 'Make it heat', steps: [
      { id: 'element', title: 'Drive the element', status: 'done', produces: { of: 'kettle' } },
      { id: 'probe', title: 'Read the probe', status: 'planned', produces: { of: 'kettle' } },
      { id: 'cutoff', title: 'Cut off at the target', status: 'active', produces: { of: 'kettle' } },
      { id: 'lid', title: 'Latch the lid', status: 'done', produces: { of: 'kettle' } },
    ] },
    { id: 'control', title: 'Make it controllable', steps: [
      { id: 'knob', title: 'Turn the knob', status: 'planned', produces: { of: 'dial' } },
    ] },
  ],
};

let browser;
try {
browser = await chromium.launch();
const page = async (url, ms = 3200) => {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const pg = await ctx.newPage();
  const errs = [];
  pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  pg.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await pg.goto(url, { waitUntil: 'domcontentloaded' });
  await wait(ms);
  pg.__errs = errs;
  return pg;
};

/* ---------------------------------------------------- A. truth over time */

{
  // Pure logic first: the ticker is a ring buffer, so a client keyed on its
  // LENGTH stops repainting the moment it fills. It froze at 240 with a frozen
  // clock, which reads as "nothing is happening" rather than as a stall.
  const w = W.createWorld('x', '/t', { genesis: true, planets: [], features: [], milestones: [], tools: [], processes: [], workflows: [], attribution: [] });
  let seen = -1, repaints = 0;
  for (let i = 0; i < 520; i++) {
    W.applyFile(w, { path: 'src/f' + i + '.js', created: true, at: Date.now() + i });
    if (w.tickerSeq !== seen) { seen = w.tickerSeq; repaints++; }
  }
  ok('A1 the ticker keeps reporting past its own cap', repaints >= 520, `${repaints} repaints over 520 events, ticker holds ${w.ticker.length}`);
  ok('A2 the cap still bounds memory', w.ticker.length === W.TICKER_CAP, `${w.ticker.length}`);

  const before = w.tickerSeq;
  W.push(w, 'prompt', '> <command-message>engine</command-message> switch', Date.now());
  W.push(w, 'prompt', '> a real question about the kettle', Date.now());
  ok('A3 harness plumbing never reaches the wire', w.tickerSeq === before + 1 && !w.ticker.some((t) => /command-message/.test(t.text)),
     w.ticker.slice(-1)[0].text);
  ok('A4 and a real line still does', w.ticker.slice(-1)[0].text.includes('real question'));
}

/* ------------------------------------------------------------ B. day zero */

const fresh = repo('fresh');
const s1 = await boot(fresh, ['--sweep-hint-unused']);
{
  const h = await get(s1.port, '/health');
  ok('B1 a brand new project is honest that no chat has been opened on it', h.sessions === false && h.transcriptDirs.length === 0);
  const pg = await page(`http://127.0.0.1:${s1.port}/`);
  const spine = (await pg.textContent('#spineList')).replace(/\s+/g, ' ');
  ok('B2 day zero says what to do instead of drawing an empty rail', /No plan declared yet/.test(spine) && /\.tellurion\/plan\.json/.test(spine), spine.slice(0, 70));
  ok('B3 and the on-ramp is a control, not an instruction, with no invented products',
     await pg.locator('#planDraft').count() === 1 && await pg.locator('#planEdit').count() === 1 &&
     !/first thing you are building/i.test(spine));
  const groups = await pg.$$eval('.census .cn', (e) => e.map((x) => x.className));
  // The bench cells were REMOVED from the bar (a6dbc116): they counted the
  // standing fleet, not this project, and they overflowed into the drive gauge.
  // The bar now carries the project's three counts and the bench lives in the
  // key panel. walk.mjs step 4 is the ratified contract; this asserts the same.
  ok('B4 the census counts this project alone — the bench lives in the key, not the bar',
     groups.length === 3 && !groups.some((c) => c.includes('cn-bench')) && (await pg.locator('.cn-rule').count()) === 0,
     `${groups.length} census cells, ${groups.filter((c) => c.includes('cn-bench')).length} bench`);
  // F1 (honest card) replaced the one-click starter write with the hand door:
  // the operator's path from day zero is Edit by hand -> blank editor -> save.
  await pg.click('#planEdit');
  await pg.click('.pedit-products .pedit-add button');
  await pg.fill('.pedit-prow .p-name', 'The real thing');
  await pg.click('.pedit-phases > .pedit-add button');
  await pg.fill('.pedit-phase .ph-title', 'First phase');
  await pg.click('.pedit-phase .pedit-steps .pedit-add button');
  await pg.fill('.pedit-srow .s-title', 'Build it');
  await pg.selectOption('.pedit-srow .s-of', 'The real thing');
  await pg.click('.pedit [data-a="save"]');
  await wait(2600);
  const after = (await pg.textContent('#spineList')).replace(/\s+/g, ' ');
  // The spine groups by PRODUCT, not phase: the filled rail opens on the
  // declared product header with its step count. Assert on what renders.
  ok('B5 the hand door writes the plan and the spine fills, with no reload',
     /The real thing/.test(after) && /0\/1/.test(after), after.slice(0, 70));
  ok('B6 no console errors on day zero', pg.__errs.length === 0, pg.__errs.join(' | '));
  await pg.close();
}
{
  // The editor feed is the headline capability. It used to bind once at boot, so
  // a project whose first chat opened afterwards was watched by nothing, for the
  // whole life of that project, with nothing on screen saying so.
  const slug = '-' + fresh.replace(/^\//, '').replace(/[/_.]/g, '-');
  const sdir = path.join(os.homedir(), '.claude', 'projects', slug);
  fs.mkdirSync(sdir, { recursive: true });
  fs.writeFileSync(path.join(sdir, 'battle.jsonl'), JSON.stringify({
    type: 'user', cwd: fresh, gitBranch: 'main', entrypoint: 'claude-vscode',
    timestamp: new Date().toISOString(), message: { role: 'user', content: [{ type: 'text', text: 'make the kettle whistle' }] },
  }) + '\n');
  let h = null;
  for (let i = 0; i < 30; i++) { await wait(1000); h = await get(s1.port, '/health'); if (h.sessions) break; }
  ok('B7 a chat opened after boot is picked up without a restart', !!(h && h.sessions), JSON.stringify(h && h.transcriptDirs));
  ok('B8 and the bar stops saying "choose a project" once it knows', !!(h && h.following), h && h.following && h.following.name);
  try { fs.rmSync(sdir, { recursive: true, force: true }); } catch {}
}

/* --------------------------------------- C. the chain of custody, on glass */

const planned = repo('planned', PLAN);
const s2 = await boot(planned);
{
  const pg = await page(`http://127.0.0.1:${s2.port}/`);
  const probe = await pg.evaluate(() => {
    const feats = window.__la.world.stat.features;
    const cards = {};
    for (const f of feats) { window.__la.hover(f.id); cards[f.id] = window.__la.dossierText().replace(/\s+/g, ' '); }
    window.__la.hover(null);
    return { ids: feats.map((f) => f.id), cards, inHand: feats.filter((f) => f.inHand).map((f) => f.id),
             stale: window.__la.dossierText(),
             hub: window.__ORR_HUB };
  });
  // Two ways this used to lie about an empty feature list. It THREW, because
  // cards[ids[0]] is undefined and JSON.stringify(undefined) is not a string, so
  // one failure upstream ended the run as a Node stack trace and the ~70
  // assertions below it were never reported at all. And [].every() is true, so
  // guarding only the throw would have made this PASS on zero features — a
  // vacuous green on the one check that is supposed to prove features exist.
  // The walk has declared a feature by this point; none is a failure, not a pass.
  ok('C1 every feature is a body you can point at and name',
     probe.ids.length > 0 && probe.ids.every((id) => (probe.cards[id] || '').length > 20),
     probe.ids.length ? JSON.stringify(probe.cards[probe.ids[0]] || '').slice(0, 90) : 'no features on the plate');
  ok('C2 a feature card names WHICH PARTY signed it',
     /the builder/.test(probe.cards['step:element'] || '') && /Nobody has spoken/.test(probe.cards['step:probe'] || ''));
  // The count strip that used to say "1 in hand" is gone (a6dbc116); the state
  // lives on the dossier card and on the body's inHand flag now.
  ok('C3 the step in hand is not filed with the untouched ones',
     /in hand/.test(probe.cards['step:cutoff'] || '') && probe.inHand.length === 1 && probe.inHand[0] === 'step:cutoff',
     `${probe.inHand.join(',') || 'none'} · ${(probe.cards['step:cutoff'] || '').slice(0, 60)}`);
  ok('C4 pointing at nothing clears the card rather than leaving the last one up', probe.stale === '');
  ok('C5 the plan ring carries one segment per step', probe.hub && probe.hub.planN === 5, JSON.stringify(probe.hub));
  ok('C6 no console errors', pg.__errs.length === 0, pg.__errs.join(' | '));
  await pg.close();
}
{
  // The lit segments must be the steps that are DONE, in plan order. Lighting the
  // first N put the light in the wrong place whenever the finished steps were not
  // the first ones, and position is the strongest channel this plate has.
  const pg = await page(`http://127.0.0.1:${s2.port}/`);
  const lit = await pg.evaluate(() => {
    const h = window.__ORR_HUB, c = document.getElementById('plate');
    const g = c.getContext('2d', { willReadFrequently: true }), d = h.dpr;
    const flat = window.__la.world.plan.phases.flatMap((p) => p.steps);
    const n = flat.length, TAU = Math.PI * 2;
    const out = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (i + 0.5) * (TAU / n);
      const x = Math.round((h.cx + Math.cos(a) * h.planR) * d);
      const y = Math.round((h.cy + Math.sin(a) * h.planR) * d);
      // Measure against the real tokens, never a hand-rolled hue rule. The unlit
      // stroke is near-black ink (0,16,51) whose blue channel also exceeds its
      // red, so "blue beats red" called every unlit segment lit — the gate was
      // wrong about the pixels, and a gate that misreads them is worse than none.
      const p = g.getImageData(x, y, 1, 1).data;      // lit #0077FF, in hand #9DFF00
      const near = (r, gg, bb) => Math.abs(p[0] - r) < 40 && Math.abs(p[1] - gg) < 40 && Math.abs(p[2] - bb) < 40;
      const best = near(0, 119, 255) ? 1 : near(157, 255, 0) ? 2 : 0;
      out.push({ status: flat[i].status, drawn: best, rgb: [p[0], p[1], p[2]] });
    }
    return out;
  });
  const done = lit.filter((r) => r.status === 'done');
  const planned2 = lit.filter((r) => r.status === 'planned');
  const active = lit.filter((r) => r.status === 'active');
  ok('C7 the lit segments are the steps actually done, in plan order',
     done.every((r) => r.drawn === 1) && planned2.every((r) => r.drawn === 0),
     JSON.stringify(lit));
  ok('C8 the step in hand is marked on the ring too', active.every((r) => r.drawn === 2), JSON.stringify(active));
  await pg.close();
}
{
  // A product wears its moons' grammar. Before this a fully accepted product and
  // one nobody had touched were the same disc.
  const w = W.createWorld('x', planned, { genesis: true, planets: [], features: [], milestones: [], tools: [], processes: [], workflows: [], attribution: [] });
  const mk = (verd, acc) => {
    const pl = P.normalisePlan({ products: [{ id: 'p', name: 'P' }], phases: [{ id: 'a', title: 'A', steps: [{ id: 's', title: 'S', status: 'done', produces: { of: 'p' } }] }] });
    W.applyPlan(w, pl, { verdicts: new Map(verd ? [['s', { by: 'Sentinel' }]] : []), accepted: new Map(acc ? [['s', { by: 'Wassim' }]] : []) });
    return w.stat.planets.find((x) => x.id === 'plan:p').status;
  };
  ok('C9 a product carries the tier of its least advanced part',
     mk(false, false) === 'claimed' && mk(true, false) === 'verified' && mk(true, true) === 'fully-verified',
     [mk(false, false), mk(true, false), mk(true, true)].join(' -> '));
}

/* ------------------------------------------ D. the plan survives being edited */

{
  const before = fs.readFileSync(path.join(planned, '.tellurion', 'plan.json'), 'utf8');
  const r = await post(s2.port, '/api/plan', { oops: true });
  const after = fs.readFileSync(path.join(planned, '.tellurion', 'plan.json'), 'utf8');
  ok('D1 a body with no steps in it cannot erase a plan that has some', r.status === 409 && after === before, `HTTP ${r.status}`);
  ok('D2 and the refusal says what it refused and how to mean it', /refusing to replace a plan of 5 step/.test((r.body || {}).error || ''), (r.body || {}).error);
  const f = await post(s2.port, '/api/plan', { force: true, phases: [] });
  ok('D3 a deliberate emptying still works, and leaves the old file beside it',
     f.status === 200 && fs.existsSync(path.join(planned, '.tellurion', 'plan.json.bak')));
  fs.writeFileSync(path.join(planned, '.tellurion', 'plan.json'), before);
  await wait(1600);
}
{
  const p = P.normalisePlan({ products: [{ id: 'p', name: 'P' }], phases: [
    { id: 'dup', title: 'A', steps: [{ id: 'same', title: 'one', status: 'done', produces: { of: 'p' } }, { id: 'same', title: 'two', status: 'done', produces: { of: 'p' } }] },
    { id: 'dup', title: 'B', steps: [] }] });
  const ids = p.phases.flatMap((ph) => ph.steps.map((s) => s.id));
  ok('D4 two steps can never share an id, because a sign-off is addressed by id',
     new Set(ids).size === ids.length && new Set(p.phases.map((x) => x.id)).size === p.phases.length, ids.join(','));
  ok('D5 and the collision is reported rather than silently renamed', (p.collisions || []).length === 2, JSON.stringify(p.collisions));

  const bad = repo('bad', null);
  fs.mkdirSync(path.join(bad, '.tellurion'), { recursive: true });
  fs.writeFileSync(path.join(bad, '.tellurion', 'plan.json'), '{ "phases": [');
  const s3 = await boot(bad);
  const pg = await page(`http://127.0.0.1:${s3.port}/`);
  const txt = (await pg.textContent('#spineList')).replace(/\s+/g, ' ');
  ok('D6 an unreadable plan says so, instead of looking like a project with none',
     /could not be read/.test(txt) && /not valid JSON/.test(txt), txt.slice(0, 80));
  await pg.close();
}

/* ------------------------------------ E. not a write primitive on the network */

{
  const exposed = await boot(repo('exposed', PLAN), ['--host', '0.0.0.0']);
  const log = exposed.log();
  const key = (log.match(/\?k=([A-Za-z0-9_-]+)/) || [])[1];
  ok('E1 reaching the network mints a key and prints the link', !!key, key ? key.slice(0, 8) + '…' : log.slice(0, 120));
  const anon = await Promise.all([
    post(exposed.port, '/api/plan', { force: true, phases: [] }),
    post(exposed.port, '/api/accept', { step: 'element', by: 'someone else' }),
    post(exposed.port, '/api/watch', { id: APP }),
    fetch(`http://127.0.0.1:${exposed.port}/api/projects`).then((r) => ({ status: r.status })),
  ]);
  ok('E2 an anonymous caller can neither write nor enumerate his work',
     anon.every((r) => r.status === 401), anon.map((r) => r.status).join(','));
  // This deliberately CHANGED. /api/world and /events carry project.following.title
  // — the last thing he typed in that project — and the whole prompt ticker, so
  // leaving reads open protected the picker and published the original. The cost
  // is real and is stated rather than hidden: a tab already open on the tailnet
  // stops streaming until it is reloaded from the link the server prints.
  const w = await fetch(`http://127.0.0.1:${exposed.port}/api/world`);
  const ev = await fetch(`http://127.0.0.1:${exposed.port}/events`);
  ok('E3 the doors that carry his typed words are guarded too, not just the picker',
     w.status === 401 && ev.status === 401, `world ${w.status}, events ${ev.status}`);
  const wk = await fetch(`http://127.0.0.1:${exposed.port}/api/world?k=${key}`);
  ok('E3b and the key opens them', wk.status === 200, `HTTP ${wk.status}`);
  const keyed = await fetch(`http://127.0.0.1:${exposed.port}/api/projects?k=${key}`);
  ok('E4 the key opens it', keyed.status === 200);
  const loopback = await boot(repo('loop', PLAN));
  const lb = await post(loopback.port, '/api/accept', { step: 'nope', by: 'x' });
  ok('E5 on loopback nothing is in the way', lb.status !== 401, `HTTP ${lb.status}`);
  // A browser sends a simple cross-site POST with no preflight, so any page he
  // visits could write to a loopback instrument that trusts loopback.
  const evil = await fetch(`http://127.0.0.1:${loopback.port}/api/plan`, {
    method: 'POST', headers: { 'content-type': 'text/plain;charset=UTF-8', origin: 'https://evil.example' },
    body: JSON.stringify({ force: true, phases: [] }) });
  const own = await fetch(`http://127.0.0.1:${loopback.port}/api/accept`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin' },
    body: JSON.stringify({ step: 'element', by: 'Wassim', force: true }) });
  ok('E5b but a write from another website is refused, even with no key in play',
     evil.status === 403 && own.status === 200, `evil ${evil.status}, own page ${own.status}`);
}
{
  const r1 = await post(s2.port, '/api/accept', { step: 'not-a-step', by: 'Wassim' });
  const r2 = await post(s2.port, '/api/accept', { step: 'knob', by: 'Wassim' });
  const r3 = await post(s2.port, '/api/accept', { step: 'element', by: 'Wassim' });
  ok('E6 accepting a step that is not in the plan is refused, by name', r1.status === 404 && /no step "not-a-step"/.test((r1.body || {}).error || ''), (r1.body || {}).error);
  ok('E7 accepting what nobody claimed is refused, by name', r2.status === 409 && /nothing to accept/.test((r2.body || {}).error || ''), (r2.body || {}).error);
  ok('E8 accepting what no judge passed is refused, and the ladder is explained', r3.status === 409 && /climbed in order/.test((r3.body || {}).error || ''), (r3.body || {}).error);
  const r4 = await post(s2.port, '/api/accept', { step: 'element', by: 'Wassim', force: true });
  ok('E9 a forced acceptance reports the tier it ACTUALLY reached', r4.status === 200 && r4.body.tier === 'claimed', JSON.stringify(r4.body));
  fs.writeFileSync(path.join(planned, '.tellurion', 'verdicts.json'), JSON.stringify({ verdicts: [{ step: 'element', by: 'Sentinel', pass: true }] }));
  await wait(2200);
  const wl = await get(s2.port, '/api/world');
  const el = wl.stat.features.find((f) => f.id === 'step:element');
  ok('E10 and it takes effect the moment the judge lands, as promised', el && el.status === 'fully-verified' && el.signedBy === 'Wassim', JSON.stringify(el));
}

/* ---------------------------------- F. the legend and the rulebook are true */

{
  const pg = await page(`http://127.0.0.1:${s2.port}/`);
  await pg.click('#key .key-head');
  await wait(500);
  const k = await pg.evaluate(() => ({
    rows: [...document.querySelectorAll('.key-row .kr-name')].map((e) => e.textContent),
    body: document.getElementById('keyBody').textContent,
    motion: [...document.querySelectorAll('.key-motion tbody tr')].map((r) => r.children[0].textContent),
    todo: [...document.querySelectorAll('.key-motion tr.k-todo')].length,
    w: document.getElementById('key').getBoundingClientRect().width,
    liveAgents: Object.values((window.__la.world && window.__la.world.agents) || {}).filter((a) => Date.now() - a.lastAt < 4 * 60_000).length,
  }));
  // Rows for unused classes are hidden by design ("a row that counts something
  // the plate is not drawing is a legend lying"), so a class is NAMED when it
  // appears either in a row or in the bench note that explains their absence.
  // The chevron follows the same rule: named only while an agent is at work.
  const named = (k.rows.join(' | ') + ' ' + k.body).toLowerCase();
  ok('F1 the legend names every class the plate can draw',
     ['planet', 'moon', 'core', 'belt', 'ring arc', 'comet'].every((t) => named.includes(t))
     && (k.liveAgents === 0 || named.includes('chevron')),
     `${k.rows.length} rows, ${k.liveAgents} live agents`);
  ok('F2 and every rung of the ladder, in words that name the party',
     ['in hand', 'nobody has spoken', 'the builder', 'a judge', 'you put your name'].every((t) => named.includes(t)));
  ok('F3 the motion table he asked for is in it', k.motion.length >= 6, k.motion.join(','));
  ok('F4 and it marks what is not built rather than describing a version that is not there', k.todo >= 1, `${k.todo} rows marked`);
  ok('F5 it is a small button at rest and a panel when opened', k.w > 380);

  await pg.click('.vt[data-view=logic]');
  await wait(600);
  const logic = (await pg.textContent('#spineList')).replace(/\s+/g, ' ');
  ok('F6 the rulebook no longer describes a version that does not exist',
     !/Features Ledger/.test(logic) && !/10 flagships/.test(logic) && !/one row per to-do/.test(logic));
  ok('F7 it is derived from what is actually on this plate', /\.tellurion\/plan\.json/.test(logic) && /STANDING FLEET/.test(logic));
  ok('F8 and it names what is NOT built', /NOT built yet/.test(logic) && /scars/.test(logic));
  await pg.close();
}
{
  // /health described the target it had LEFT: the entity block was captured at
  // boot and never reassigned, so the one endpoint you would check to answer
  // "what is this following" answered about the previous project.
  const s = await boot(fresh, ['--universe']);
  const h0 = await get(s.port, '/health');
  const list = await get(s.port, '/api/projects?max=40');
  const target = (list.projects || []).find((p) => p.path !== fresh);
  if (target) {
    await post(s.port, '/api/watch', { id: target.id });
    await wait(1800);
    const h1 = await get(s.port, '/health');
    const w1 = await get(s.port, '/api/world');
    ok('F9 /health describes the CURRENT target after a switch, not the boot one',
       h1.entities.planets === w1.stat.planets.length && h1.entities.milestones === w1.stat.milestones.length,
       `health ${h1.entities.planets}/${h1.entities.milestones} vs world ${w1.stat.planets.length}/${w1.stat.milestones.length}`);
    ok('F10 an explicit --universe survives a switch, because it was a decision',
       h1.mode === 'universe', `${h0.mode} -> ${h1.mode}`);
  } else { ok('F9 /health freshness', false, 'no second project to switch to'); ok('F10 mode flag survives', false, 'skipped'); }
}
{
  // The score is the one figure on the panel that must never give way. The
  // strip that used to crowd it is gone; the neighbour to check now is the
  // title/tabs block on the left of the same head row.
  const widths = [1920, 1440, 1280];
  const bad = [];
  for (const wpx of widths) {
    const ctx = await browser.newContext({ viewport: { width: wpx, height: 900 } });
    const pg = await ctx.newPage();
    await pg.goto(`http://127.0.0.1:${s2.port}/`, { waitUntil: 'domcontentloaded' });
    await wait(2400);
    const clipped = await pg.evaluate(() => {
      const p = document.querySelector('.spinewrap').getBoundingClientRect();
      const sc = document.querySelector('.spine-score').getBoundingClientRect();
      const tb = document.querySelector('.spine-head > div').getBoundingClientRect();
      const crowded = tb.right > sc.left - 16 && !(tb.bottom <= sc.top || sc.bottom <= tb.top);
      return sc.right > p.right + 0.6 || sc.left < p.left || crowded;
    });
    if (clipped) bad.push(wpx);
    await pg.close();
  }
  ok('F11 the headline score is never clipped, at any width he uses', bad.length === 0, bad.join(','));
}

/* ----------------------------------------- G. it stays up and keeps watching */

{
  const g = await boot(repo('rely', PLAN));
  // A Host header is attacker text and URL() throws on a bad one, so one
  // unauthenticated request used to take the whole instrument down.
  const net = await import('node:net');
  await new Promise((res) => {
    const c = net.connect(g.port, '127.0.0.1', () => {
      c.write('GET / HTTP/1.1\r\nHost: a b c\r\nConnection: close\r\n\r\n');
    });
    c.on('data', () => {}); c.on('error', () => res()); c.on('close', () => res());
    setTimeout(res, 1500);
  });
  await wait(600);
  const alive = await fetch(`http://127.0.0.1:${g.port}/health`).then((r) => r.status).catch(() => 0);
  ok('G1 a malformed Host header cannot take the instrument down', alive === 200, `HTTP ${alive}`);

  // mkdir -p a/b creates both before the parent's watcher exists, so subscribing
  // to `a` alone left `b`, and everything ever written under it, invisible.
  const root = g.proc.spawnargs[g.proc.spawnargs.indexOf('--project') + 1];
  fs.mkdirSync(path.join(root, 'a', 'b'), { recursive: true });
  await wait(500);
  fs.writeFileSync(path.join(root, 'a', 'b', 'deep.js'), '// deep\n');
  let saw = false;
  for (let i = 0; i < 20; i++) {
    await wait(400);
    const w = await get(g.port, '/api/world');
    if ((w.ticker || []).some((t) => /deep\.js/.test(t.text))) { saw = true; break; }
  }
  ok('G2 a directory made after boot is walked, not just noticed', saw);

  // An open event-stream kept the socket alive forever, so the process outlived
  // every stop and restart and orphans piled up.
  const ac = new AbortController();
  fetch(`http://127.0.0.1:${g.port}/events`, { signal: ac.signal }).catch(() => {});
  await wait(700);
  g.proc.kill('SIGTERM');
  let dead = false;
  for (let i = 0; i < 25; i++) { await wait(200); if (g.proc.exitCode !== null || g.proc.signalCode) { dead = true; break; } }
  ac.abort();
  ok('G3 SIGTERM stops it even with a tab attached', dead, `exit ${g.proc.exitCode} / ${g.proc.signalCode}`);
}

/* --------------------------------- H. custody survives the file being edited */

{
  const { fingerprint } = await import('../lib/tiers.mjs');
  const root = repo('custody', PLAN);
  const stepOf = (id) => P.readPlan(root).phases.flatMap((ph) => ph.steps).find((x) => x.id === id);
  fs.writeFileSync(path.join(root, '.tellurion', 'verdicts.json'), JSON.stringify({
    verdicts: [{ step: 'element', by: 'Sentinel', pass: true, at: '2026-08-27T10:00:00Z', fp: fingerprint(stepOf('element')) }] }));
  const h = await boot(root);
  const tier = async () => {
    const w = await get(h.port, '/api/world');
    return (w.stat.features || []).find((f) => f.id === 'step:element') || {};
  };
  await post(h.port, '/api/accept', { step: 'element', by: 'Wassim' });
  await wait(900);
  ok('H1 the ladder still reaches the top when all three parties act', (await tier()).status === 'fully-verified');

  const setStatus = (v) => {
    const f = path.join(root, '.tellurion', 'plan.json');
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const ph of d.phases) for (const st of ph.steps) if (st.id === 'element') st.status = v;
    fs.writeFileSync(f, JSON.stringify(d, null, 2));
  };
  setStatus('planned'); await wait(2400);
  ok('H2 withdrawing the claim drops it all the way back', (await tier()).status === 'open');
  setStatus('done'); await wait(2400);
  const back = await tier();
  ok('H3 the BUILDER alone cannot restore the operator\'s tier by re-claiming',
     back.status === 'verified' && back.staleAccept === true, `${back.status} / staleAccept ${back.staleAccept}`);
  await post(h.port, '/api/accept', { step: 'element', by: 'Wassim' });
  await wait(900);
  ok('H4 and the operator looking again restores it', (await tier()).status === 'fully-verified');

  // He was promised that renaming a step renames its moon. So renaming has to
  // KEEP the step's identity, and the sign-off given for the old wording has to
  // stop applying — loudly, rather than by evaporating.
  const f = path.join(root, '.tellurion', 'plan.json');
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const ph of d.phases) for (const st of ph.steps) if (st.id === 'element') st.title = 'Drive the heating element';
  fs.writeFileSync(f, JSON.stringify(d, null, 2));
  await wait(2400);
  const rn = await tier();
  ok('H5 a rename keeps the moon, so the two halves stay one record', rn.id === 'step:element' && rn.name === 'Drive the heating element', `${rn.id} / ${rn.name}`);
  ok('H6 but the sign-off for the old wording stops applying, and says so',
     rn.status === 'claimed' && rn.staleVerdict === true, `${rn.status} / staleVerdict ${rn.staleVerdict}`);

  const pg = await page(`http://127.0.0.1:${h.port}/`);
  const said = (await pg.textContent('#spineList')).replace(/\s+/g, ' ');
  ok('H7 and the screen says it, rather than leaving it in a JSON field', /no longer match/.test(said), said.slice(0, 100));
  await pg.close();

  // A file save is not a builder claiming completion.
  const wNoPlan = W.createWorld('x', '/t', { genesis: true, planets: [], features: [], milestones: [], tools: [], processes: [], workflows: [], attribution: [] });
  W.applyFile(wNoPlan, { path: 'src/new.js', created: true, at: Date.now() });
  ok('H8 the filesystem cannot grant the first rung of the ladder',
     (wNoPlan.stat.features[0] || {}).status === 'open', (wNoPlan.stat.features[0] || {}).status);

  // A product is only as far along as its least advanced part, INCLUDING the
  // steps nobody wired to a product.
  const w2 = W.createWorld('x', '/t', { genesis: true, planets: [], features: [], milestones: [], tools: [], processes: [], workflows: [], attribution: [] });
  const pl2 = P.normalisePlan({ products: [{ id: 'p', name: 'P' }], phases: [{ id: 'a', title: 'A', steps: [
    { id: 's1', title: 'wired', status: 'done', produces: { of: 'p' } },
    { id: 's2', title: 'not wired, not started' }] }] });
  W.applyPlan(w2, pl2, { verdicts: new Map([['s1', { by: 'S' }]]), accepted: new Map([['s1', { by: 'W' }]]), withdrawn: new Map() });
  ok('H9 a product cannot read finished while part of it has not started',
     w2.stat.planets.find((x) => x.id === 'plan:p').status === 'building', w2.stat.planets.find((x) => x.id === 'plan:p').status);

  // Deleting the declaration must take its bodies with it.
  W.applyPlan(w2, P.normalisePlan({ phases: [] }), null);
  ok('H10 deleting the plan takes its bodies off the plate',
     !w2.stat.planets.some((x) => String(x.id).startsWith('plan:')) && !w2.stat.features.some((x) => String(x.id).startsWith('step:')));
}

/* ---------------------------- I. what the second audit found, once fixed */

{
  const { fingerprint } = await import('../lib/tiers.mjs');
  // The scenario is: the builder claims it done, and the judge then rejects it.
  // A verdict against a step nobody has claimed is a different (and stranger)
  // state, and it was masking what this group is here to check.
  const claimed = JSON.parse(JSON.stringify(PLAN));
  for (const ph of claimed.phases) for (const st of ph.steps) if (st.id === 'probe') st.status = 'done';
  const root = repo('judged', claimed);
  const S = P.readPlan(root).phases.flatMap((ph) => ph.steps);
  const fpOf = (id) => fingerprint(S.find((x) => x.id === id));
  fs.writeFileSync(path.join(root, '.tellurion', 'verdicts.json'), JSON.stringify({ verdicts: [
    { step: 'element', by: 'Sentinel', pass: true, at: '2026-08-27T10:00:00Z', fp: fpOf('element') },
    { step: 'probe', by: 'Sentinel', pass: false, note: 'FAILS: reads 0C in ice water', at: '2026-08-27T10:05:00Z', fp: fpOf('probe') },
  ] }));
  const j = await boot(root);
  const pg = await page(`http://127.0.0.1:${j.port}/`);
  // Spine sections render their rows only when opened, and closed is the rest
  // state — so the marks exist only after a reader opens the sections, which is
  // exactly the path being asserted.
  await pg.$$eval('.sseg-h.clickable', (hs) => hs.forEach((h) => h.click()));
  await wait(500);
  const probe = await pg.evaluate(() => {
    window.__la.hover('step:probe');
    const card = window.__la.dossierText().replace(/\s+/g, ' ');
    window.__la.hover(null);
    return { card, marks: [...document.querySelectorAll('.stier')].map((e) => e.className.replace('stier ', '')) };
  });
  // The headline of the second audit: the instrument told him in a full sentence
  // that nobody had checked work a judge had just rejected.
  ok('I1 a judge that FAILED something is never reported as nobody having checked',
     /FAILED it/.test(probe.card) && /ice water/.test(probe.card) && !/Nobody has checked/.test(probe.card), probe.card.slice(0, 110));
  ok('I2 the spine carries the chain of custody, not only the plate',
     probe.marks.includes('t-failed') && probe.marks.includes('t-verified') && probe.marks.includes('t-in-hand'), probe.marks.join(','));
  // The legend's open/closed state and the bearer key shared one localStorage
  // name, so opening the legend once destroyed the key.
  await pg.click('#key .key-head');
  await wait(300);
  const kept = await pg.evaluate(() => { try { return localStorage.getItem('la-key'); } catch { return 'ERR'; } });
  ok('I3 opening the legend cannot destroy the key', kept === null || /^[A-Za-z0-9_-]{16,}$/.test(kept), String(kept));
  await pg.close();
}
{
  // Valid JSON is not a valid plan. null, [] and "a string" all parsed cleanly
  // and rendered as "no plan declared yet", under a button offering to write a
  // starter plan over the top of them.
  const { readPlan } = P;
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'shape-'));
  fs.mkdirSync(path.join(d, '.tellurion'), { recursive: true });
  const said = {};
  for (const [n, body] of [['null', 'null'], ['list', '[]'], ['string', '"x"'], ['no keys', '{"hello":1}'], ['empty', '{"project":"x","phases":[]}']]) {
    fs.writeFileSync(path.join(d, '.tellurion', 'plan.json'), body);
    said[n] = !!readPlan(d).error;
  }
  ok('I4 a file that parses but is not a plan says so', said.null && said.list && said.string && said['no keys'], JSON.stringify(said));
  ok('I5 and a deliberately empty plan is still a plan', said.empty === false);

  fs.writeFileSync(path.join(d, '.tellurion', 'plan.json'), '{ "phases": [');
  const bad = await boot(d);
  const r = await post(bad.port, '/api/plan', { phases: [{ title: 'x', steps: [{ title: 'y' }] }] });
  ok('I6 a write never lands on a file that could not be read', r.status === 409, `HTTP ${r.status}`);
  const pg = await page(`http://127.0.0.1:${bad.port}/`);
  const txt = (await pg.textContent('#spineList')).replace(/\s+/g, ' ');
  ok('I7 and the broken-file message is not stacked with an offer to overwrite it',
     /could not be read/.test(txt) && !/Write this starter plan/.test(txt), txt.slice(0, 90));
  await pg.close();
}
{
  const w = W.createWorld('x', '/t', { genesis: true, planets: [], features: [], milestones: [], tools: [], processes: [], workflows: [], attribution: [] });
  const pl = P.normalisePlan({ products: [{ id: 'p', name: 'P' }], phases: [{ id: 'a', title: 'A', steps: [
    { id: 's1', title: 'wired', status: 'done', produces: { of: 'p' } },
    { id: 's2', title: 'names no product', status: 'done' }] }] });
  W.applyPlan(w, pl, { verdicts: new Map(), accepted: new Map(), withdrawn: new Map() });
  ok('I8 every step in the plan gets a body, so none sits outside the ladder',
     w.stat.features.length === 2, `${w.stat.features.length} of 2`);
  W.applyFault(w, { label: 'tool error', detail: "ENOENT: no such file or directory, open '/etc/shadow'", at: Date.now() });
  ok('I9 a fault says what broke, not the word "fault"',
     /ENOENT/.test(w.ticker.slice(-1)[0].text), w.ticker.slice(-1)[0].text);
}

/* ------------- J. the middle rung fills itself, and the join that lets it */

{
  const { execFileSync } = await import('node:child_process');
  const { readWork } = await import('../lib/work.mjs');
  const root = repo('bridge', PLAN);
  const rc = path.join(TMP, 'receipts');
  fs.mkdirSync(rc, { recursive: true });
  const receipt = (name, o) => fs.writeFileSync(path.join(rc, name), JSON.stringify(o));
  const ingest = (extra = []) => execFileSync('node',
    [path.join(APP, 'bin', 'sentinel-ingest.mjs'), '--project', root, '--receipts', rc, ...extra],
    { encoding: 'utf8' });

  const br = await boot(root);
  // 'cutoff' is the step in hand in the fixture. Work done now is credited to it.
  fs.writeFileSync(path.join(root, 'src', 'cutoff.js'), '// cut\n');
  await wait(1200);
  fs.writeFileSync(path.join(root, 'src', 'relay.js'), '// relay\n');
  await wait(7000);
  const w1 = readWork(root);
  ok('J1 the attribution record is written down, not just held in memory',
     (w1.cutoff && w1.cutoff.paths || []).length >= 2, JSON.stringify(w1.cutoff && w1.cutoff.paths));
  // The git poll replays 48 hours at boot; none of that is this step's work.
  ok('J2 only commits that land while the step is in hand are credited to it',
     (w1.cutoff && w1.cutoff.commits || []).length === 0, `${(w1.cutoff && w1.cutoff.commits || []).length} credited`);

  // A judge's receipt names FILES. A plan names STEPS. The record joins them.
  const f = path.join(root, '.tellurion', 'plan.json');
  const d = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const ph of d.phases) for (const st of ph.steps) if (st.id === 'cutoff') st.status = 'done';
  fs.writeFileSync(f, JSON.stringify(d, null, 2));
  await wait(2200);
  const tier = async () => {
    const wd = await get(br.port, '/api/world');
    return (wd.stat.features || []).find((x) => x.id === 'step:cutoff') || {};
  };
  ok('J3a the builder claims it, and it stops there', (await tier()).status === 'claimed');

  receipt('tripwire-01.json', { timestamp: '2026-08-27T12:00:00.000Z', verdict: 'PASS', judge: 'Sentinel', judged: ['src/cutoff.js'], note: 'walk green' });
  const out1 = ingest();
  await wait(2400);
  const t3 = await tier();
  ok('J3 a judge\'s own receipt lifts it to verified, with nobody typing anything',
     t3.status === 'verified' && t3.signedBy === 'Sentinel', `${t3.status} / ${t3.signedBy}`);
  ok('J4 and the row records what it was judged from, so the inference is checkable',
     t3.verdictVia === 'sentinel-receipt' && (t3.verdictMatched || []).includes('src/cutoff.js'), JSON.stringify(t3.verdictMatched));

  // Unambiguous or nothing. Guessing here would put a real judge's name on work
  // the judge never looked at.
  fs.writeFileSync(path.join(root, '.tellurion', 'work.json'), JSON.stringify({ work: {
    cutoff: { paths: ['src/cutoff.js'], entities: [], commits: [], first: 1, last: 2 },
    knob: { paths: ['src/knob.js'], entities: [], commits: [], first: 1, last: 2 },
  } }));
  receipt('tripwire-02.json', { timestamp: '2026-08-27T12:30:00.000Z', verdict: 'PASS', judged: ['src/cutoff.js', 'src/knob.js'] });
  receipt('tripwire-03.json', { timestamp: '2026-08-27T12:40:00.000Z', verdict: 'PASS', judged: ['src/never-seen.js'] });
  const out2 = ingest();
  ok('J5 a receipt spanning two steps is refused, and says which two',
     /tripwire-02\.json: those files span 2 steps/.test(out2), (out2.match(/tripwire-02[^\n]*/) || [''])[0]);
  ok('J6 a receipt naming files no step recorded is refused, and says so',
     /tripwire-03\.json: no step has any of those files/.test(out2), (out2.match(/tripwire-03[^\n]*/) || [''])[0]);

  receipt('tripwire-04.json', { timestamp: '2026-08-27T13:00:00.000Z', verdict: 'FAIL', judge: 'Sentinel', judged: ['src/cutoff.js'], note: 'cuts off 4 degrees late' });
  ingest();
  await wait(2400);
  const t4 = await tier();
  ok('J7 a later FAIL from the judge supersedes the earlier pass',
     t4.status === 'claimed' && t4.failedBy === 'Sentinel' && /4 degrees/.test(t4.failedNote || ''), `${t4.status} / ${t4.failedBy} / ${t4.failedNote}`);

  const again = ingest();
  ok('J8 running it twice writes nothing twice', /nothing new to attach/.test(again), again.split('\n').slice(-2)[0]);

  // A judge that cannot be read is a MISSING judge, not a clean run.
  let code = 0;
  try { execFileSync('node', [path.join(APP, 'bin', 'sentinel-ingest.mjs'), '--project', root, '--receipts', '/nope/nothing/here'], { encoding: 'utf8', stdio: 'pipe' }); }
  catch (e) { code = e.status; }
  ok('J9 an unreadable receipts directory exits non-zero rather than reporting a quiet judge', code === 2, `exit ${code}`);

  const pg = await page(`http://127.0.0.1:${br.port}/`);
  const card = await pg.evaluate(() => { window.__la.hover('step:cutoff'); const t = window.__la.dossierText().replace(/\s+/g, ' '); window.__la.hover(null); return t; });
  ok('J10 the card shows what was done while the step was in hand',
     /Done while this was in hand/.test(card) && /cutoff\.js/.test(card), card.slice(0, 110));
  await pg.close();
  void out1;
}

} finally {
  for (const k of kids) { try { k.kill(); } catch {} }
  if (browser) await browser.close();
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch {}
}

console.log(`\n${pass}/${pass + fail} PASS${fail ? `  ${fail} FAILED` : ''}`);
process.exit(fail ? 1 : 0);
