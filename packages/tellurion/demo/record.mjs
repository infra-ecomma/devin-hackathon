#!/usr/bin/env node
// Records the demo: an orrery drawing itself, then a tour of the instrument.
//
// It boots its own server on a free port with demo/story.mjs running --once, so
// the recording is reproducible and never depends on whatever happens to be
// listening. The story writes the plan and the sign-offs on disk exactly as a
// working session would; this file only watches and drives the chrome.
//
//   node demo/record.mjs                 rustic light, 1600x1000, ~2 min
//   node demo/record.mjs --skin plate    the cold register
//   node demo/record.mjs --speed 2       the story at double time
//
// Output: demo/last-recording/ — the video, plus stills at the beats worth
// having as slides, plus a JSON record of what the plate actually held at each
// one. The stills exist because a video cannot be checked at a glance and a
// still can: if the JSON says four planets and the picture shows three, the
// recording is wrong and it is meant to be obvious.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT = path.join(HERE, 'last-recording');

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const SKIN = arg('skin', 'rustic');
const SPEED = arg('speed', '1');
const W = Number(arg('width', 1600));
const H = Number(arg('height', 1000));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function freePort(start) {
  for (let p = start; p < start + 60; p++) {
    const ok = await new Promise((res) => {
      const s = net.createServer();
      s.once('error', () => res(false));
      s.listen(p, '127.0.0.1', () => s.close(() => res(true)));
    });
    if (ok) return p;
  }
  throw new Error('no free port');
}

const shots = [];
async function still(page, name, note) {
  const file = path.join(OUT, `${String(shots.length + 1).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, scale: 'css' });
  const state = await page.evaluate(() => {
    const w = window.__la.world;
    const feats = (w.stat.features || []).filter((f) => String(f.id).startsWith('feat:'));
    const tally = (s) => feats.filter((f) => f.status === s).length;
    return {
      products: (w.stat.planets || []).filter((p) => String(p.id).startsWith('plan:')).length,
      features: feats.length,
      open: tally('open'), claimed: tally('claimed'),
      verified: tally('verified'), fullyVerified: tally('fully-verified'),
      rejected: feats.filter((f) => f.failedBy).length,
      inHand: feats.filter((f) => f.inHand).length,
      agents: Object.keys(w.agents || {}),
      demo: !!w.stat.demo,
    };
  });
  shots.push({ name, note, file: path.basename(file), state });
  console.log(`  ${String(shots.length).padStart(2)}. ${name.padEnd(22)} ${state.products}p ${state.features}f ` +
    `· open ${state.open} claimed ${state.claimed} verified ${state.verified} accepted ${state.fullyVerified} rejected ${state.rejected}` +
    (state.agents.length ? ` · ${state.agents.length} agents` : ''));
  return state;
}

// A still of a page that is NOT the instrument. The Inception story carries no
// __la hook, and reading one off it would throw rather than report an empty
// state, so the prologue's frames record their note and nothing else.
async function stillPlain(page, name, note) {
  const file = path.join(OUT, `${String(shots.length + 1).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, scale: 'css' });
  shots.push({ name, note, file: path.basename(file), state: null });
  console.log(`  ${String(shots.length).padStart(2)}. ${name.padEnd(22)} ${note}`);
}

// Waits for a condition on the live world rather than on a stopwatch: the story
// is paced in real time and a fixed sleep drifts out of step with it the moment
// --speed changes or a machine is loaded.
async function until(page, fn, { timeout = 120000, label = 'state', arg = undefined } = {}) {
  const t0 = Date.now();
  let lastErr = null;
  for (;;) {
    const got = await page.evaluate(fn, arg).catch((e) => { lastErr = e; return null; });
    if (got) return got;
    if (Date.now() - t0 > timeout) {
      // A swallowed evaluate error and a condition that is genuinely still
      // false look identical from here, and the first one sent a whole run
      // chasing a story that was working perfectly. Say which it was.
      throw new Error(`timed out waiting for ${label}` + (lastErr ? ` (last evaluate threw: ${lastErr.message})` : ''));
    }
    await sleep(220);
  }
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  const port = await freePort(8830);
  console.log(`recording demo on :${port} (skin ${SKIN}, speed ${SPEED})\n`);

  // ---------------------------------------------------------------- prologue
  // The Inception story runs FIRST and in the same page, so the recording is one
  // continuous take rather than two clips someone has to join: a plan being born,
  // and then the same plan being built and checked. It also has to run before the
  // server starts, because the orrery story begins the moment the server does and
  // the recorder would otherwise miss the blank sky it opens on.
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('  ! page error:', e.message));

  const incept = pathToFileURL(path.join(HERE, 'inception', 'index.html')).href;
  await page.goto(incept, { waitUntil: 'load' });
  await sleep(1200);
  await stillPlain(page, 'inception-open', 'Inception: seven stages from a raw idea to a published product.');
  await page.click('[data-inc4-play]');
  // Seven stages at 1500ms each, then the receipt. Stepped through by watching
  // which tab is selected rather than by a stopwatch, so a slower machine cannot
  // desynchronise the stills from the stages they are meant to show.
  for (let i = 1; i < 7; i++) {
    await until(page, (n) => document.querySelector(`#inc4-tab-${n}`)?.getAttribute('aria-selected') === 'true',
      { label: `inception stage ${i + 1}`, arg: i, timeout: 20000 });
    if (i === 3) await stillPlain(page, 'inception-mid', 'Stage 4 of 7: every stage names the evidence it owes.');
  }
  await until(page, () => document.querySelector('[data-inc4-view="receipt"]')?.offsetParent !== null,
    { label: 'the inception receipt', timeout: 20000 });
  await sleep(1600);
  await stillPlain(page, 'inception-receipt', 'The receipt: what was agreed, what was created, what was checked.');
  await sleep(1800);

  // ------------------------------------------------------------- the instrument
  const server = spawn(process.execPath, [
    path.join(ROOT, 'server.mjs'),
    '--project', path.join(HERE, 'project'),
    '--world', path.join(HERE, 'data', 'world-static.json'),
    '--story', path.join(HERE, 'story.mjs'),
    '--name', 'Lantern', '--port', String(port), '--speed', SPEED, '--once',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  server.stderr.on('data', (b) => process.stderr.write(`[server] ${b}`));
  await sleep(2500);

  await page.goto(`http://127.0.0.1:${port}/?skin=${SKIN}`, { waitUntil: 'domcontentloaded' });
  await until(page, () => !!(window.__la && window.__la.world), { label: 'first world' });
  // Names on, so an audience can read the bodies without a cursor.
  await page.evaluate(() => window.__la.setLabels('all'));

  /* ---------------------------------------------------------------- act 1 */
  await until(page, () => window.__la.world.stat.planets.filter((p) => String(p.id).startsWith('plan:')).length === 0,
    { label: 'the blank sky' });
  await still(page, 'blank-sky', 'No plan declared. The bench is standing; the project is not.');

  for (const n of [1, 2, 3, 4]) {
    await until(page, (want) => window.__la.world.stat.planets.filter((p) => String(p.id).startsWith('plan:')).length >= want,
      { label: `${n} products`, arg: n });
    await sleep(700);
    await still(page, `plan-${n}-products`, `${n} of 4 products declared. Parts exist before any of them is built.`);
  }

  /* ---------------------------------------------------------------- act 2 */
  await until(page, () => Object.keys(window.__la.world.agents || {}).length >= 3, { label: 'agents at work' });
  await still(page, 'agents-dispatched', 'Agents threaded to what they are touching.');

  await until(page, () => window.__la.world.stat.features.some((f) => f.inHand), { label: 'work in hand' });
  await still(page, 'work-in-hand', 'A moon with a turning arc is work happening right now.');

  await until(page, () => window.__la.world.stat.features.filter((f) => f.status === 'claimed').length >= 8,
    { label: 'eight claims' });
  await still(page, 'builder-claims', 'Eight parts claimed done. Nobody has checked one of them.');

  /* ---------------------------------------------------------------- act 3 */
  await until(page, () => window.__la.world.stat.features.some((f) => f.status === 'verified'), { label: 'first verdict' });
  await still(page, 'judge-passes', 'A ring lands on a moon: a judge looked, and passed it.');

  await until(page, () => window.__la.world.stat.features.some((f) => f.failedBy), { label: 'the rejection' });
  await sleep(2200);
  await still(page, 'broken-promise', 'Broken Promises found one. Claimed done, judge said no.');

  await until(page, () => window.__la.world.stat.features.filter((f) => f.status === 'fully-verified').length >= 5,
    { label: 'operator acceptance' });
  await sleep(1200);
  await still(page, 'operator-accepts', 'Two rings: a judge passed it and a person put their name to it.');

  /* ------------------------------------------------- act 4: the instrument */
  // The story has settled. Everything from here is the tour: the spine's three
  // readings of the same plan, then the key that names every mark on the plate.
  await sleep(1500);

  for (const [view, note] of [
    ['record', 'The Spine, Record: the plan as declared, product by product.'],
    ['map', 'The Spine, Map: the same plan laid out as a shape.'],
    ['logic', 'The Spine, Logic: what has to be true before what.'],
  ]) {
    await page.click(`#viewTabs .vt[data-view="${view}"]`);
    await sleep(1400);
    await still(page, `spine-${view}`, note);
    // A slow read down the panel, so the audience sees there is more than fits.
    await page.evaluate(() => {
      const b = document.getElementById('spineBody');
      if (b) b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' });
    });
    await sleep(1800);
    await page.evaluate(() => {
      const b = document.getElementById('spineBody');
      if (b) b.scrollTo({ top: 0, behavior: 'smooth' });
    });
    await sleep(1100);
  }
  await page.click('#viewTabs .vt[data-view="record"]');
  await sleep(900);

  // The key: open it, read down the whole legend, close it.
  await page.click('#key .key-head');
  await sleep(1200);
  await still(page, 'key-open', 'The Key: every mark on the plate, named.');

  const keyScroll = await page.evaluate(() => {
    const b = document.getElementById('keyBody');
    return b ? { h: b.scrollHeight, view: b.clientHeight } : null;
  });
  console.log(`  key legend: ${keyScroll.h}px of content in a ${keyScroll.view}px panel`);

  // Stepped rather than one smooth run to the bottom: a legend is read, and a
  // single 6-second glide past it shows motion instead of content.
  const STEPS = 7;
  for (let i = 1; i <= STEPS; i++) {
    await page.evaluate((frac) => {
      const b = document.getElementById('keyBody');
      b.scrollTo({ top: (b.scrollHeight - b.clientHeight) * frac, behavior: 'smooth' });
    }, i / STEPS);
    await sleep(1250);
    if (i === 3) await still(page, 'key-mid', 'The bench: the standing tools and the governance ring.');
    if (i === STEPS) await still(page, 'key-bottom', 'The ladder, and what each kind of motion means.');
  }
  await sleep(900);
  await page.evaluate(() => {
    const b = document.getElementById('keyBody');
    b.scrollTo({ top: 0, behavior: 'smooth' });
  });
  await sleep(1100);
  await page.click('#key .key-head');
  await sleep(1400);
  await still(page, 'closed-full-plate', 'The finished plate: four products, one broken promise still on it.');
  await sleep(2200);

  /* ------------------------------------------------------------- teardown */
  const video = page.video();
  await ctx.close();
  await browser.close();
  server.kill();

  let videoFile = null;
  if (video) {
    videoFile = path.join(OUT, `tellurion-demo-${SKIN}.webm`);
    try { fs.renameSync(await video.path(), videoFile); } catch { videoFile = await video.path(); }
  }

  // What the recording is allowed to claim. Checked here rather than eyeballed,
  // because every one of these is a thing an audience will be told out loud.
  const last = shots[shots.length - 1].state;
  // Found by NAME, never by index. The prologue was inserted in front of the
  // orrery and every positional check silently started reading the wrong frame:
  // shots[0] became an Inception still with no state at all, so "the sky started
  // empty" was about to throw rather than fail.
  const byName = (n) => shots.find((s) => s.name === n);
  const blank = byName('blank-sky');
  const checks = [
    ['four products on the finished plate', last.products === 4],
    ['fourteen features on the finished plate', last.features === 14],
    ['five carry an operator signature', last.fullyVerified === 5],
    ['exactly one rejected promise', last.rejected === 1],
    ['the sky started empty', !!blank && blank.state.products === 0],
    ['at least five agents appeared', shots.some((s) => s.state && s.state.agents.length >= 5)],
    ['the graph declares itself invented', last.demo === true],
    ['the Inception prologue played to its receipt', !!byName('inception-receipt')],
  ];
  const failed = checks.filter(([, ok]) => !ok);
  fs.writeFileSync(path.join(OUT, 'recording.json'), JSON.stringify({
    at: new Date().toISOString(), skin: SKIN, speed: SPEED, viewport: { w: W, h: H },
    video: videoFile && path.basename(videoFile),
    keyLegendPx: keyScroll && keyScroll.h,
    checks: checks.map(([name, ok]) => ({ name, ok })),
    totalFails: failed.length,
    shots,
  }, null, 2) + '\n');

  console.log('');
  for (const [name, ok] of checks) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
  console.log(`\n  ${shots.length} stills + video -> ${OUT}`);
  if (videoFile) console.log(`  video: ${videoFile}`);
  process.exit(failed.length);
})().catch((e) => { console.error(e); process.exit(1); });
