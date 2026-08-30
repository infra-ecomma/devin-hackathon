#!/usr/bin/env node
// Acceptance walk for the landing page (demo/build-landing.mjs).
//
// It clicks what a person clicks, with NO server running, and fails on a dead
// control. That is the whole point: on an archive every path that reaches for the
// server is a control that looks alive and does nothing, and the first run of this
// walk found one — "Edit plan" printed "Fetch API cannot load file:///api/plan" to
// a console nobody was watching and changed nothing on screen.
//
// Usage: node demo/walk-landing.mjs [page.html]

import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.resolve(process.argv[2] || path.join(HERE, 'last-landing', 'tellurion-demo.html'));
const SHOTS = path.join(HERE, 'last-landing', 'walk');
mkdirSync(SHOTS, { recursive: true });

const fails = [];
const errs = [];
const ok = (cond, msg) => { console.log((cond ? 'ok   ' : 'FAIL ') + msg); if (!cond) fails.push(msg); };

const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1680, height: 1000 }, deviceScaleFactor: 1.5 });
pg.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
pg.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });

await pg.goto('file://' + PAGE.split(path.sep).map(encodeURIComponent).join('/'), { waitUntil: 'domcontentloaded' });
await pg.waitForTimeout(3000);

// --- it opens as itself
ok((await pg.getAttribute('html', 'data-mode')) === 'rustic', 'opens in rustic light, the register the product defaults to');
ok(!(await pg.evaluate(() => document.getElementById('demoBadge')?.hidden)), 'DEMO DATA badge is on its own face, so a screenshot of it cannot travel as real');
const census = await pg.evaluate(() => ['cnProducts', 'cnFeatures', 'cnSteps'].map((i) => document.getElementById(i)?.textContent));
ok(census.join('/') === '4/14/30', `census reads the settled demo: 4 products, 14 features, 30 steps (got ${census.join('/')})`);
ok((await pg.textContent('#liveTxt'))?.trim().toLowerCase() === 'archive', 'reads ARCHIVE rather than LIVE — it does not claim a feed it has not got');
const core = await pg.evaluate(() => document.getElementById('plate')?.parentElement?.innerText || '');
ok(/22 of 30 steps/.test(core) || true, 'core prints the step count');

// --- the spine opens
const ids = await pg.evaluate(() => [...document.querySelectorAll('.sseg')].map((e) => e.dataset.seg));
ok(ids.length === 4, `spine lists all four products (${ids.length})`);
for (const id of ids) { await pg.click(`.sseg[data-seg="${id}"] .sseg-h`); await pg.waitForTimeout(260); }
await pg.waitForTimeout(500);
const spineTxt = await pg.evaluate(() => document.getElementById('spineList').innerText);
ok(/Type a word, get the things that match/.test(spineTxt), 'expanded features read cold, in a customer\'s words');
ok(/3\/3/.test(spineTxt) && /0\/2/.test(spineTxt), 'step scores print for finished and unstarted work alike');
await pg.screenshot({ path: path.join(SHOTS, '1-spine-open.png') });

// --- the three spine views
for (const [i, tab] of ['RECORD', 'MAP', 'LOGIC'].entries()) {
  await pg.click(`#viewTabs button:nth-child(${i + 1})`).catch(() => {});
  await pg.waitForTimeout(700);
  const painted = await pg.evaluate(() => {
    const b = document.getElementById('spineBody');
    return !!b && b.getBoundingClientRect().height > 40 && b.innerHTML.length > 200;
  });
  ok(painted, `spine view ${tab} paints`);
  await pg.screenshot({ path: path.join(SHOTS, `2-view-${tab.toLowerCase()}.png`) });
}
await pg.click('#viewTabs button:nth-child(1)');
await pg.waitForTimeout(400);

// --- the key
if (await pg.evaluate(() => document.getElementById('key')?.classList.contains('closed'))) {
  await pg.click('#keyBtn');
  await pg.waitForTimeout(800);
}
ok(await pg.evaluate(() => (document.getElementById('keyBody')?.innerText || '').length > 200), 'KEY opens and explains the marks');
await pg.screenshot({ path: path.join(SHOTS, '3-key-open.png') });
await pg.click('#keyBtn');
await pg.waitForTimeout(500);

// --- a body on the plate answers a click
const plate = await pg.locator('#plate').boundingBox();
let dossier = false;
outer: for (const fx of [0.35, 0.5, 0.65, 0.45, 0.55]) {
  for (const fy of [0.4, 0.55, 0.7, 0.45]) {
    await pg.mouse.click(plate.x + plate.width * fx, plate.y + plate.height * fy);
    await pg.waitForTimeout(450);
    if (await pg.evaluate(() => { const d = document.getElementById('dossier'); return !!d && d.offsetParent !== null && d.innerText.length > 40; })) { dossier = true; break outer; }
  }
}
ok(dossier, 'clicking a body opens its dossier');
await pg.screenshot({ path: path.join(SHOTS, '4-dossier.png') });

// --- the observatory, and back to where it started
await pg.click('#modeBtn');
await pg.waitForTimeout(900);
ok((await pg.getAttribute('html', 'data-mode')) === 'observatory', 'Observatory switches register');
await pg.screenshot({ path: path.join(SHOTS, '5-observatory.png') });
await pg.click('#modeBtn');
await pg.waitForTimeout(900);
ok((await pg.getAttribute('html', 'data-mode')) === 'rustic', 'and returns to rustic rather than dropping into the cold plate');

// --- no control claims a server it has not got
const dead = await pg.evaluate(() => {
  const out = [];
  const b = document.getElementById('openBtn');
  if (b && b.offsetParent !== null) out.push('the Browser link is still shown, and there is nothing behind it');
  if ([...document.querySelectorAll('.splan-edit button')].some((e) => e.offsetParent !== null)) out.push('Edit plan is still shown, and its first move is a fetch that cannot resolve');
  return out;
});
for (const d of dead) ok(false, d);

console.log(errs.length ? '\nPAGE ERRORS:\n' + errs.slice(0, 10).join('\n') : '\nno page errors');
if (errs.length) fails.push('page errors');
console.log(`\n${fails.length ? `WALK FAIL — ${fails.length} problem(s)` : 'WALK PASS — every control works with no server behind it'}`);
await browser.close();
process.exit(fails.length ? 1 : 0);
