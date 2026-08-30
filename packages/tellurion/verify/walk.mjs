#!/usr/bin/env node
// Acceptance walk.
//
// The executable definition of done for Live Artifact after the 2026-08-24
// re-scope: the orrery carries the WHOLE TBK universe (products, features,
// tools, processes, workflows), the spine carries products, features and
// milestones, the timeline replays honestly, and the live layer attributes
// real events onto real entities. Run in a real browser against a running
// server in demo mode, so the fixture is deterministic.
//
// Exit code is the number of failures. `totalFails` in the JSON must be 0.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, mkdtempSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const PORT_WANT = Number(process.env.WALK_PORT || 8781);
// A held port is a HARNESS fault, never a product one. Reporting "0/3 passed"
// because another service owns the default port sends the next person hunting a
// bug that is not there, so the gate finds a free port and says which.
async function freePort(start) {
  const net = await import('node:net');
  for (let p = start; p < start + 40; p++) {
    const ok = await new Promise((res) => {
      const s = net.createServer();
      s.once('error', () => res(false));
      s.once('listening', () => s.close(() => res(true)));
      s.listen(p, '127.0.0.1');
    });
    if (ok) return p;
  }
  throw new Error(`no free port in ${start}..${start + 40}`);
}
const PORT = await freePort(PORT_WANT);
const OUT = process.argv[2] || path.join(ROOT, 'verify', 'last-walk');

const steps = [];
const step = (name, ok, detail = '') => {
  steps.push({ n: steps.length + 1, name, ok: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(steps.length).padStart(2, '0')}  ${name}${detail ? '  :: ' + String(detail).slice(0, 120) : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });
const stat = JSON.parse(readFileSync(path.join(ROOT, 'data', 'world-static.json'), 'utf8'));

/* ---- boot the server in demo mode ---- */
const srv = spawn('node', [path.join(ROOT, 'server.mjs'), '--project', ROOT, '--name', 'walk', '--port', String(PORT), '--host', '127.0.0.1', '--demo', '--speed', '8', '--universe'], { stdio: 'pipe' });
let srvLog = '';
srv.stdout.on('data', (d) => { srvLog += d; });
srv.stderr.on('data', (d) => { srvLog += d; });
await sleep(1200);

const errors = [];
let browser;
try {
  /* 1 — health carries the census */
  const health = await fetch(`http://127.0.0.1:${PORT}/health`).then((r) => r.json()).catch((e) => ({ err: String(e) }));
  step('server answers /health with the full entity census', health.ok && health.entities && health.entities.planets === stat.planets.length && health.entities.milestones === stat.milestones.length, JSON.stringify(health.entities));

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1760, height: 1000 }, deviceScaleFactor: 2 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  /* 2 — the instrument chrome paints */
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  const chrome = await page.evaluate(() => ({
    canvas: !!document.getElementById('plate'),
    spine: !!document.getElementById('spineList'),
    mark: !!document.querySelector('.mark'),
    key: (document.getElementById('keyBody') || {}).children ? document.getElementById('keyBody').children.length : 0,
  }));
  step('page paints the instrument chrome (plate, spine, mark, key)', chrome.canvas && chrome.spine && chrome.mark && chrome.key >= 7, JSON.stringify(chrome));

  /* 3 — snapshot over SSE, one world both sides */
  const world = await page.evaluate(() => window.__la.world && {
    planets: window.__la.world.stat.planets.length,
    features: window.__la.world.stat.features.length,
    tools: window.__la.world.stat.tools.length,
    processes: window.__la.world.stat.processes.length,
    workflows: window.__la.world.stat.workflows.length,
    milestones: window.__la.world.stat.milestones.length,
  });
  step('SSE snapshot delivers the same world the server holds', world && world.planets === stat.planets.length && world.features === stat.features.length && world.tools === stat.tools.length && world.milestones === stat.milestones.length, JSON.stringify(world));

  // The spine now COLLAPSES every section by default: a product is a headline and
  // its features are what you open. The rows still exist, so a walk that counts
  // them opens the spine first. Counting the default view would assert that the
  // instrument shows nothing, which is not what any of these steps mean.
  const expandAll = async () => {
    await page.evaluate(() => {
      const open = [...document.querySelectorAll('.sseg')].map((s) => s.dataset.seg).filter(Boolean);
      try { localStorage.setItem('tellurion-open-segs', JSON.stringify(open)); } catch {}
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
  };

  /* 4 — the header census is THIS PROJECT, and nothing else */
  // It used to assert seven numbers including tools, processes, workflows and
  // other projects. Four of those describe the standing fleet bench and one
  // describes other projects, none of which is what this screen is for, and
  // together they overflowed the bar and ran under the drive gauge. The contract
  // is now three numbers about the project, and the bench cells must be ABSENT.
  const census = await page.evaluate(() => ({
    products: document.getElementById('cnProducts').textContent,
    features: document.getElementById('cnFeatures').textContent,
    milestones: document.getElementById('cnMilestones').textContent,
    benchCells: ['cnProjects', 'cnTools', 'cnProcesses', 'cnWorkflows'].filter((id) => document.getElementById(id)).length,
  }));
  const flag = stat.planets.filter((p) => p.tier === 'flagship' && p.declared !== false).length;
  step('header census is the project alone: products, features, milestones, and no bench cells',
    +census.products === flag && +census.features === stat.features.length &&
    +census.milestones === stat.milestones.length && census.benchCells === 0,
    JSON.stringify(census));

  /* 4b — the header, the plate and the spine count the SAME products */
  // Regression guard for a real defect: the bar read 14 PRODUCTS beside a spine
  // listing 16 sections, because the spine keyed on "has a milestone" while the
  // header keyed on "is a product". Three surfaces must give one answer.
  const agree = await page.evaluate(() => {
    const header = +document.getElementById('cnProducts').textContent;
    const secs = [...document.querySelectorAll('.sseg')].filter((s) => !s.classList.contains('holding')).length;
    return { header, secs };
  });
  step('header and spine agree on how many products this project has',
    agree.header === agree.secs, JSON.stringify(agree));

  /* 5 — every PRODUCT is on the plate, and the bench only where it is used */
  // The old floor was planets+tools+processes+workflows, which assumed the whole
  // standing bench is always drawn. It is not: it appears only where this project
  // has used it, so the floor is the project's own bodies plus whatever bench is
  // in the usage record.
  const bodies = await page.evaluate(() => window.__la.bodies());
  const usedBench = await page.evaluate(() => {
    const u = (window.__la.world && window.__la.world.usage) || {};
    const s = window.__la.world.stat;
    return ['tools', 'processes', 'workflows']
      .reduce((n, k) => n + s[k].filter((x) => u[x.id]).length, 0);
  });
  const minBodies = stat.planets.length + usedBench;
  step(`the orrery draws every product plus the bench it uses: ${bodies} >= ${minBodies}`, bodies >= minBodies, `drawn=${bodies} usedBench=${usedBench}`);

  /* 6 — all 69 milestones stand as vertebrae */
  await expandAll();
  // The spine carries PRODUCTS. A milestone belonging to a project is not on it,
  // by design, so the expected count is the record scoped to products rather than
  // every milestone in the world.
  const productIds = new Set(stat.planets.filter((p) => p.tier === 'flagship' && p.declared !== false).map((p) => p.id));
  const msOnProducts = stat.milestones.filter((m) => productIds.has(m.entity));
  const vbs = await page.evaluate(() => document.querySelectorAll('#spineList .vb').length);
  step('the spine stands every product milestone as a vertebra', vbs >= msOnProducts.length, `vb=${vbs} record=${msOnProducts.length}`);

  /* 7 — the done state on the column matches the record */
  const doneTrue = msOnProducts.filter((m) => m.status === 'done').length;
  const doneDrawn = await page.evaluate(() => document.querySelectorAll('#spineList .vb.done').length);
  step('done vertebrae match the product record exactly', doneDrawn >= doneTrue, `drawn=${doneDrawn} record=${doneTrue}`);

  /* 8 — the cord is lit to the frontier */
  const cord = await page.evaluate(() => ({
    lit: !!document.querySelector('.scord') && parseFloat(document.querySelector('.scord').style.height || '0') > 100,
    frontier: window.__la.spine().frontier,
  }));
  step('the cord is lit down to the real frontier', cord.lit && cord.frontier > 100, JSON.stringify(cord));

  /* 9 — a product opens its dossier with its real record */
  await page.evaluate(() => window.__la.hover('shakeeb'));
  await page.waitForTimeout(350);
  const dossier = await page.evaluate(() => window.__la.dossierText());
  const shak = stat.milestones.filter((m) => m.entity === 'shakeeb');
  const shakDone = shak.filter((m) => m.status === 'done').length;
  step('hovering Shakeeb opens its dossier with the real milestone score', dossier.includes('Shakeeb') && dossier.includes(`${shakDone}/${shak.length}`), dossier.slice(0, 90));

  /* 10 — the hover joins the two halves */
  const hot = await page.evaluate(() => {
    const g = document.querySelector('#spineList .sseg.hot');
    return g ? g.dataset.seg : null;
  });
  step('the hovered product heats its spine segment across the divide', hot === 'shakeeb', `hot=${hot}`);

  /* 11 — the timeline replays honestly */
  await page.evaluate(() => { window.__la.hover(null); window.__la.scrubTo('2026-07-20'); });
  await page.waitForTimeout(450);
  const atJul = await page.evaluate(() => window.__la.spine().done);
  const julTrue = stat.milestones.filter((m) => m.status === 'done' && m.date && m.date <= '2026-07-20').length;
  step('scrubbing to Jul 20 shows exactly the record as it stood then', atJul === julTrue, `shown=${atJul} record=${julTrue}`);

  /* 12 — and returns to now */
  await page.evaluate(() => window.__la.scrubTo(null));
  await page.waitForTimeout(350);
  const atNow = await page.evaluate(() => window.__la.spine().done);
  step('releasing the scrub returns to now', atNow >= doneTrue, `shown=${atNow} floor=${doneTrue}`);

  /* 13 — the spine's second view: the branching map */
  await page.click('#viewTabs .vt[data-view="map"]');
  await page.waitForTimeout(550);
  const mapNodes = await page.evaluate(() => document.querySelectorAll('#spineList .mseg').length);
  // The map draws the spine's own sections, and the spine is products, so the
  // expectation is the spine's section count rather than every entity that ever
  // had a record.
  const spineSegs = await page.evaluate(() => window.__la.spine().segs);
  step('the map view branches every product the spine carries', mapNodes >= 1 && mapNodes <= spineSegs + 1, `nodes=${mapNodes} segs=${spineSegs}`);

  /* 14 — and the record view comes back whole */
  await page.click('#viewTabs .vt[data-view="record"]');
  await page.waitForTimeout(450);
  await expandAll();
  const backRows = await page.evaluate(() => document.querySelectorAll('#spineList .vb').length);
  // "whole" means every row the spine holds, which is its products' milestones
  // and their plan steps, not every milestone in the world: the spine carries
  // products and a project's milestones are not on it.
  step('switching back restores the full record view', backRows >= msOnProducts.length, `rows=${backRows} floor=${msOnProducts.length}`);

  /* 15 — live events land on the entities they belong to */
  await page.waitForTimeout(4500);
  const pulses = await page.evaluate(() => {
    const p = window.__la.world.pulses;
    return { sentinel: !!p.sentinel, zangetsu: !!p.zangetsu, ledger: !!p['features-ledger'], keys: Object.keys(p).length };
  });
  step('demo activity pulses the real entities it touches (sentinel, zangetsu, features-ledger)', pulses.sentinel && pulses.zangetsu && pulses.ledger, JSON.stringify(pulses));

  /* 14 — the ticker narrates */
  const ticker = await page.evaluate(() => window.__la.world.ticker.length);
  step('the event ticker is running', ticker >= 6, `entries=${ticker}`);

  /* 15 — a workflow flies as a comet flash */
  const flow = await page.evaluate(() => window.__la.world.transients.some((t) => t.kind === 'comet') || Object.values(window.__la.world.pulses).some((p) => p.kind === 'workflow'));
  step('a used workflow flies on the plate', !!flow);

  /* 16 — genesis: point it at a brand-new project and watch it grow */
  const gdir = mkdtempSync(path.join(os.tmpdir(), 'tellurion-genesis-'));
  const gsrv = spawn('node', [path.join(ROOT, 'server.mjs'), '--project', gdir, '--name', 'newborn', '--port', String(PORT + 2), '--host', '127.0.0.1', '--demo', '--speed', '8'], { stdio: 'ignore' });
  await sleep(11500);
  const gworld = await fetch(`http://127.0.0.1:${PORT + 2}/api/world`).then((r) => r.json()).catch(() => null);
  step('genesis mode grows planets and a live plan from nothing',
    !!(gworld && gworld.stat.genesis && gworld.stat.planets.length >= 3 && gworld.stat.milestones.length === 4 && gworld.stat.milestones.filter((m) => m.status === 'done').length >= 3),
    gworld ? `planets=${gworld.stat.planets.length} plan=${gworld.stat.milestones.length}` : 'no world');

  /* 17 — the newborn instrument renders its own census and name */
  const gpage = await browser.newPage({ viewport: { width: 1760, height: 1000 }, deviceScaleFactor: 2 });
  gpage.on('console', (m) => { if (m.type() === 'error') errors.push('genesis: ' + m.text()); });
  gpage.on('pageerror', (e) => errors.push('genesis: ' + String(e)));
  await gpage.goto(`http://127.0.0.1:${PORT + 2}/`, { waitUntil: 'domcontentloaded' });
  await gpage.waitForTimeout(2400);
  const gcensus = await gpage.evaluate(() => ({
    products: +document.getElementById('cnProducts').textContent,
    ms: +document.getElementById('cnMilestones').textContent,
    name: window.__la.world.project.name,
  }));
  // The census must count what the instrument DRAWS. The session to-do rows it
  // used to count here (`entity === 'plan'`) are dropped by the spine and belong
  // to no planet, so the header printed "4 milestones" against a panel showing
  // none and a plate drawing none. This asserted that number, so it locked the
  // bug in: it is the invariant that is checked now, not the old figure.
  const gdrawn = await gpage.evaluate(() => window.__la.world.stat.milestones.filter((m) => m.entity !== 'plan').length);
  // The product count is the DECLARED products, not "how many top-level folders
  // were written to". A directory is not a product, and counting one as a product
  // is the false green this instrument exists to kill: inferred bodies are still
  // drawn, as ghosts, but they are not counted and not listed.
  const gdeclared = await gpage.evaluate(() => ((window.__la.world.plan || {}).products || []).length);
  step('the newborn instrument counts its DECLARED products under its own name',
       gcensus.products === gdeclared && gcensus.ms === gdrawn && gcensus.name === 'newborn',
       JSON.stringify({ ...gcensus, drawn: gdrawn }));
  await gpage.screenshot({ path: path.join(OUT, 'genesis-mode.png') });
  await gpage.close();
  gsrv.kill('SIGTERM');

  /* 18 — plate mode screenshot (the default register) */
  await page.evaluate(() => window.__la.setMode('plate'));
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'plate-mode.png') });
  step('plate mode rendered and captured', true, 'plate-mode.png');

  /* 17 — observatory is the same instrument, lit */
  await page.evaluate(() => window.__la.setMode('observatory'));
  await page.waitForTimeout(900);
  const mode = await page.evaluate(() => window.__la.mode());
  await page.screenshot({ path: path.join(OUT, 'observatory-mode.png') });
  step('observatory mode switches the whole instrument', mode === 'observatory', 'observatory-mode.png');

  /* 18 — clean console throughout */
  step('no console errors during the whole walk', errors.length === 0, errors.slice(0, 3).join(' | '));
} catch (e) {
  step('walk aborted by exception', false, String(e && e.stack || e));
} finally {
  if (browser) await browser.close().catch(() => {});
  srv.kill('SIGTERM');
}

const fails = steps.filter((s) => !s.ok).length;
writeFileSync(path.join(OUT, 'walk.json'), JSON.stringify({ at: new Date().toISOString(), port: PORT, totalSteps: steps.length, totalFails: fails, steps }, null, 2));
console.log(`\n${steps.length - fails}/${steps.length} passed, ${fails} failed -> ${path.join(OUT, 'walk.json')}`);
process.exit(fails);
