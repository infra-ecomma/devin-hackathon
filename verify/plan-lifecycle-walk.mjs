#!/usr/bin/env node
// Acceptance walk for the plan lifecycle ruling of 2026-08-29 (ADR-0134,
// extended the same day by the inception ruling): a plan is born four ways —
// the Initialize button (the project's own harness drafts it), /inception (the
// approved spec's Products and Build story sections become the plan, parsed
// exactly), init-tbk (an operator-gated proposal), and by hand — and in every
// state the plan stays editable from the panel, with the instrument connecting
// the spine to the repo after each change.
//
// Drives a real (headless) Chromium against a real server bound to a scratch
// project. The draft step spawns the project's own harness and honestly waits
// for it — this walk takes minutes by design. Exit code is the failure count.

import { chromium } from '../../node_modules/playwright/index.mjs';
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, existsSync, rmSync, readdirSync, renameSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

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
  throw new Error('no free port');
}
const PORT = await freePort(8790);
const OUT = process.argv[2] || path.join(ROOT, 'verify', 'last-plan-walk');

const steps = [];
const step = (name, ok, detail = '') => {
  steps.push({ n: steps.length + 1, name, ok: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(steps.length).padStart(2, '0')}  ${name}${detail ? '  :: ' + String(detail).slice(0, 140) : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });
// A stale recording from a previous run would race the GUID rename at the end.
for (const f of readdirSync(OUT)) if (f.endsWith('.webm')) rmSync(path.join(OUT, f), { force: true });

/* ---- a scratch project with real evidence and no plan ---- */
const PROJ = path.join(os.tmpdir(), 'tellurion-plan-walk');
rmSync(PROJ, { recursive: true, force: true });
mkdirSync(path.join(PROJ, 'dashboard'), { recursive: true });
mkdirSync(path.join(PROJ, 'api'), { recursive: true });
mkdirSync(path.join(PROJ, 'docs'), { recursive: true });
writeFileSync(path.join(PROJ, 'README.md'), '# Nimbus Ledger\nBookkeeping for freelancers. Dashboard shows MRR and overdue invoices; the API serves invoice CRUD.\n');
writeFileSync(path.join(PROJ, 'docs', 'roadmap.md'), '# Roadmap\n1. Invoice CRUD (done) 2. Dashboard MRR chart (in progress) 3. PDF export (planned)\n');
writeFileSync(path.join(PROJ, 'package.json'), JSON.stringify({ name: 'nimbus-ledger', description: 'freelancer bookkeeping', scripts: { dev: 'node server.js' } }));

const KEY = readFileSync(path.join(os.homedir(), '.tellurion', 'key'), 'utf8').trim();
const srv = spawn('node', [path.join(ROOT, 'server.mjs'), '--project', PROJ, '--name', 'nimbus-ledger', '--port', String(PORT), '--host', '127.0.0.1'], { stdio: 'pipe' });
let srvLog = '';
srv.stdout.on('data', (d) => { srvLog += d; });
srv.stderr.on('data', (d) => { srvLog += d; });
await sleep(1400);

let browser, context;
const fails = () => steps.filter((s) => !s.ok).length;
try {
  browser = await chromium.launch();
  // The UI category's bar is a RECORDED walk: the context carries recordVideo so the
  // whole run lands as a .webm in OUT (finalised on context.close()).
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${PORT}/?k=${encodeURIComponent(KEY)}`, { waitUntil: 'domcontentloaded' });
  await sleep(2500);

  /* 1 — the empty state offers all three ways and names them honestly */
  const emptyText = await page.evaluate(() => (document.querySelector('.sempty') || {}).textContent || '');
  step('empty state offers the draft button, the hand edit, the shared birth, and no invented products',
    /Draft it with the instrument/.test(emptyText) && /Edit by hand/.test(emptyText)
    && /\/inception/.test(emptyText) && !/first thing you are building/i.test(emptyText)
    && /tools/.test(emptyText), emptyText.slice(0, 80));
  await page.screenshot({ path: path.join(OUT, '01-empty-state.png') });

  /* 2 — edit by hand opens the editor even before any plan exists */
  await page.click('#planEdit');
  await sleep(700);
  step('edit-by-hand opens the editor on an empty plan', !!(await page.$('.pedit-overlay')), '');
  await page.screenshot({ path: path.join(OUT, '02-editor-empty.png') });

  /* 3 — add a product, a phase and a step by hand, then save */
  await page.click('.pedit-products .pedit-add button');
  await page.locator('.pedit-prow').last().locator('.p-name').fill('Walk Product');
  await page.locator('.pedit-prow').last().locator('.p-home').fill('dashboard');
  await page.locator('.pedit-phases > .pedit-add > button').click(); // + phase
  await page.locator('.pedit-phase').last().locator('.ph-title').fill('Walk Phase');
  await page.locator('.pedit-phase').last().locator('.pedit-steps > .pedit-add > button').click(); // + step
  await page.locator('.pedit-srow').last().locator('.s-title').fill('Walk the first step');
  await page.click('[data-a="save"]');
  await sleep(1200);
  const onDisk = JSON.parse(readFileSync(path.join(PROJ, '.tellurion', 'plan.json'), 'utf8'));
  step('hand edit writes .tellurion/plan.json with the product, phase and step',
    onDisk.products?.[0]?.name === 'Walk Product' && onDisk.products?.[0]?.home === 'dashboard' && onDisk.phases?.[0]?.steps?.[0]?.title === 'Walk the first step',
    JSON.stringify({ products: onDisk.products?.length, steps: onDisk.phases?.[0]?.steps?.length }));
  await page.screenshot({ path: path.join(OUT, '03-editor-saved.png') });

  /* 4 — the connection report runs after the save and connects the home */
  const connText = await page.evaluate(() => (document.querySelector('.pedit-conn') || {}).textContent || '');
  step('connection report connects the declared home to the repo', /Walk Product/.test(connText) && /dashboard/.test(connText) && /connects|→/.test(connText), connText.slice(0, 120));

  /* 5 — the spine now draws the declared product */
  await page.click('[data-a="cancel"]');
  await sleep(1500);
  const spineText = await page.evaluate(() => document.body.textContent || '');
  step('the spine draws the declared product after the save', /Walk Product/.test(spineText), '');
  await page.screenshot({ path: path.join(OUT, '04-spine-with-plan.png') });

  /* 6 — a second edit renames the step; the file follows */
  await page.click('.splan-edit button');
  await sleep(700);
  await page.locator('.pedit-srow').last().locator('.s-title').fill('Walk the renamed step');
  await page.click('[data-a="save"]');
  await sleep(1200);
  const onDisk2 = JSON.parse(readFileSync(path.join(PROJ, '.tellurion', 'plan.json'), 'utf8'));
  step('a rename in the editor lands in the file', onDisk2.phases?.[0]?.steps?.[0]?.title === 'Walk the renamed step', onDisk2.phases?.[0]?.steps?.[0]?.title);
  await page.click('[data-a="cancel"]');

  /* 7 — the draft refuses to pave a declaration without force */
  const refused = await page.evaluate(async () => {
    const r = await window.__laFetch('/api/plan/draft', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    return { status: r.status, body: await r.json() };
  });
  step('draft over an existing plan is refused without force', refused.status === 409 && /already exists/.test(refused.body.error || ''), String(refused.status));

  /* 8 — the harness re-drafts with force: 202 now, done when the file lands */
  const started = await page.evaluate(async () => {
    const r = await window.__laFetch('/api/plan/draft', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"force":true}' });
    return { status: r.status, body: await r.json() };
  });
  step('force re-draft answers 202 immediately', started.status === 202 && started.body.started === true, String(started.status));

  let done = null;
  for (let i = 0; i < 60 && !done; i++) {
    await sleep(5000);
    const w = await page.evaluate(async () => (await (await window.__laFetch('/api/world')).json()));
    const d = w.project && w.project.draft;
    if (d && (d.state === 'done' || d.state === 'failed')) done = { d, totals: (w.plan && w.plan.totals) || {} };
  }
  step('the harness draft lands and reports done', done && done.d.state === 'done' && done.totals.steps > 0, done ? JSON.stringify(done).slice(0, 140) : 'timed out waiting');
  const drafted = JSON.parse(readFileSync(path.join(PROJ, '.tellurion', 'plan.json'), 'utf8'));
  step('the drafted plan declares real products with honest statuses',
    (drafted.products || []).length >= 1 && (drafted.phases || []).some((ph) => (ph.steps || []).some((s) => s.status === 'done')),
    `${(drafted.products || []).length} products, ${(drafted.phases || []).length} phases`);
  await sleep(2500);
  await page.screenshot({ path: path.join(OUT, '05-after-draft.png') });

  /* 9 — the spine follows the drafted plan without any reload */
  const spineText2 = await page.evaluate(() => document.body.textContent || '');
  const anyProduct = (drafted.products || []).some((p) => p.name && spineText2.includes(p.name));
  step('the spine draws the drafted products (the watcher lifted the file)', anyProduct, (drafted.products || []).map((p) => p.name).join(', ').slice(0, 120));

  /* 10 — proposals are offered for whatever the matcher could not connect */
  const rec = await page.evaluate(async () => {
    const r = await window.__laFetch('/api/plan/reconcile', { method: 'POST' });
    return { status: r.status, body: await r.json() };
  });
  step('reconcile answers with proposals or an honest all-connected note',
    rec.status === 200 && rec.body.ok === true && (Array.isArray(rec.body.proposals) || !!rec.body.note),
    JSON.stringify(rec.body).slice(0, 140));

  /* ---- birth two: init-tbk. A FRESH harness reads the skill's new steps and
     executes them on a second scratch project, the way a real init-tbk run with
     an approved Tellurion pick would. The skill text is the thing under test. */
  const PROJ2 = path.join(os.tmpdir(), 'tellurion-plan-walk-init');
  rmSync(PROJ2, { recursive: true, force: true });
  mkdirSync(path.join(PROJ2, 'web'), { recursive: true });
  mkdirSync(path.join(PROJ2, 'workers'), { recursive: true });
  writeFileSync(path.join(PROJ2, 'README.md'), '# Shopfront\nA tiny storefront. web/ is the storefront UI; workers/ syncs orders.\n');
  writeFileSync(path.join(PROJ2, 'package.json'), JSON.stringify({ name: 'shopfront', description: 'tiny storefront' }));

  const SKILL = '/home/wassim/projects/Organizing-Claude-Code/project-starter/.claude/skills/kit/init-tbk/SKILL.md';
  const HBIN = [path.join(os.homedir(), '.local', 'bin', 'claude'), '/usr/local/bin/claude'].find((b) => existsSync(b)) || 'claude';
  const plan2Path = path.join(PROJ2, '.tellurion', 'plan.json');
  const plan2Ready = () => {
    try {
      const j = JSON.parse(readFileSync(plan2Path, 'utf8'));
      return Array.isArray(j.phases) && j.phases.some((ph) => (ph.steps || []).length);
    } catch { return false; }
  };
  // A real init-tbk run happens INSIDE the operator's own session, so the child
  // harness inherits the session's working model route (ANTHROPIC_* stays). What
  // must go are the nested-session markers (CLAUDE*, TBK_RELAY*), which make a
  // child refuse to run. Scrubbing ANTHROPIC_* instead dropped the child onto the
  // account default (fable-5: no credits) and the birth failed for an env reason
  // no operator session ever has. Measured 2026-08-29: env intact -> OK.
  const env2 = { ...process.env };
  for (const k of Object.keys(env2)) {
    if (k === 'CLAUDE_CONFIG_DIR') continue;
    if (/^(CLAUDE(CODE)?|TBK_RELAY)/i.test(k)) delete env2[k];
  }
  const harness2 = spawn(HBIN, ['-p',
    `You are finishing an init-tbk bootstrap run for the repo you are sitting in. The operator ran init-tbk, reached the Phase 4 decision page, and APPROVED the Tellurion spine. Read ${SKILL} — the Phase 3 item that drafts .init-tbk/tellurion-plan-proposal.json, the Phase 4 Tellurion decision text, and Step 5.3c — and do exactly what those steps instruct for the approved case: draft the proposal from this repo's real evidence, then write the final .tellurion/plan.json per Step 5.3c and validate that it parses. Reply with one short paragraph and stop.`,
    '--permission-mode', 'acceptEdits', '--max-turns', '30'], { cwd: PROJ2, env: env2, stdio: ['ignore', 'pipe', 'pipe'] });
  let h2err = '', h2out = '';
  harness2.stderr.on('data', (d) => { h2err += d; });
  harness2.stdout.on('data', (d) => { h2out += d; }); // a quota/auth refusal lands on stdout; stderr alone reported nothing
  let born = false;
  for (let i = 0; i < 84 && !born; i++) { await sleep(5000); born = plan2Ready(); }
  try { harness2.kill('SIGTERM'); } catch {}
  step('init-tbk: a harness following the skill writes a valid .tellurion/plan.json', born, born ? '' : (h2err + h2out).slice(-160));

  /* 14 — a fresh server on that project draws the init-tbk-born spine */
  const PORT2 = await freePort(8830);
  const srv2 = spawn('node', [path.join(ROOT, 'server.mjs'), '--project', PROJ2, '--name', 'shopfront', '--port', String(PORT2), '--host', '127.0.0.1'], { stdio: 'pipe' });
  await sleep(1600);
  await page.goto(`http://127.0.0.1:${PORT2}/?k=${encodeURIComponent(KEY)}`, { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  const plan2 = born ? JSON.parse(readFileSync(plan2Path, 'utf8')) : { products: [] };
  const spineText3 = await page.evaluate(() => document.body.textContent || '');
  const bornDrawn = (plan2.products || []).some((p) => p.name && spineText3.includes(p.name));
  step('init-tbk: the panel draws the skill-born plan without any hand edit', bornDrawn, (plan2.products || []).map((p) => p.name).join(', ').slice(0, 120));
  await page.screenshot({ path: path.join(OUT, '06-init-tbk-born-spine.png') });

  /* 15 — and the connection report runs on it like any other declaration.
     Never POST a fallback plan: if the birth failed, the file stays absent. */
  const conn2 = born
    ? await page.evaluate(async (plan) => {
        const r = await window.__laFetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(plan) });
        return { status: r.status, body: await r.json() };
      }, plan2)
    : { status: 0, body: {} };
  const conns2 = (conn2.body && conn2.body.connections) || [];
  step('init-tbk: the skill-born plan gets a connection report', born && conn2.status === 200 && conns2.length === (plan2.products || []).length && conns2.some((c) => c.matched), born ? JSON.stringify(conns2).slice(0, 140) : 'no plan was born');
  srv2.kill();

  /* ---- birth three: inception. The spec the brainstorm stage writes carries
     ## Products and ## Build story in the fixed shape; approving the spec is
     the plan approval, and propose-plan turns those two sections into
     .tellurion/plan.json exactly — no model, no mining. The assertions here are
     about ACCURACY, not existence: every product, home, phase, step and binding
     in the plan must trace to the spec the operator approved. */
  const PROJ3 = path.join(os.tmpdir(), 'tellurion-plan-walk-inception');
  rmSync(PROJ3, { recursive: true, force: true });
  mkdirSync(path.join(PROJ3, 'docs'), { recursive: true });
  mkdirSync(path.join(PROJ3, 'lib', 'reader'), { recursive: true });
  mkdirSync(path.join(PROJ3, 'public', 'plate'), { recursive: true });
  // 'ghost' deliberately has NO directory: a home that does not exist must be
  // omitted from the plan, never carried as a path that lies.
  writeFileSync(path.join(PROJ3, 'docs', 'PRODUCT-SPEC.md'), `# Ledger Light — product spec

## Overview
Pocket bookkeeping for market stalls.

## Products

- **Reader** (\`reader\`) — reads the day book from disk. Home: \`lib/reader/\`.
- **Plate** (\`plate\`) — the stall owner's daily screen. Home: \`public/plate/\`.
- **Ghost** (\`ghost\`) — a planned export, no code yet. Home: \`lib/ghost/\`.

## Build story

### Phase 1: Foundation
1. Read the day book from disk → \`reader\`
2. Draw an empty daily screen → \`plate\`

### Phase 2: Join
1. Bind the day book to the screen → \`plate\`
2. Round the totals the stall way

## Risks
The day book format changes upstream.
`);

  const gen = spawnSync('node', [path.join(ROOT, 'bin', 'propose-plan.mjs'), PROJ3, '--write'], { encoding: 'utf8' });
  const plan3Path = path.join(PROJ3, '.tellurion', 'plan.json');
  step('inception: propose-plan turns the approved spec into .tellurion/plan.json',
    gen.status === 0 && existsSync(plan3Path), (gen.stderr || '').trim().split('\n').pop() || '');

  const plan3 = existsSync(plan3Path) ? JSON.parse(readFileSync(plan3Path, 'utf8')) : { products: [], phases: [] };
  const p3 = (id) => (plan3.products || []).find((p) => p.id === id);
  step('inception: every spec product lands with its id and note, homes verified against the tree',
    p3('reader') && p3('reader').home === 'lib/reader' && /day book/.test(p3('reader').note || '')
    && p3('plate') && p3('plate').home === 'public/plate'
    && p3('ghost') && !p3('ghost').home, // no such directory — omitted, not carried
    (plan3.products || []).map((p) => p.id + (p.home ? '@' + p.home : '')).join(', '));

  const ph3 = plan3.phases || [];
  step('inception: the build story lands in story order with every binding intact',
    ph3.length === 2 && ph3[0].title === 'Foundation' && ph3[1].title === 'Join'
    && ph3[0].steps.map((s) => s.title).join('|') === 'Read the day book from disk|Draw an empty daily screen'
    && ph3[0].steps[0].produces?.of === 'reader' && ph3[0].steps[1].produces?.of === 'plate'
    && ph3[1].steps[0].produces?.of === 'plate' && !ph3[1].steps[1].produces,
    ph3.map((p) => p.title + ':' + p.steps.length).join(', '));

  step('inception: a newborn project is honestly all-planned, and the note cites the spec',
    ph3.every((p) => p.steps.every((s) => s.status === 'planned')) && /PRODUCT-SPEC\.md/.test(plan3.note || ''),
    (plan3.note || '').slice(0, 110));

  /* a fresh server draws the inception-born spine: declared products as the
     census, story steps as the vertebrae, homes connecting to the real tree */
  const PORT3 = await freePort(8860);
  const srv3 = spawn('node', [path.join(ROOT, 'server.mjs'), '--project', PROJ3, '--name', 'ledger-light', '--port', String(PORT3), '--host', '127.0.0.1'], { stdio: 'pipe' });
  await sleep(1600);
  await page.goto(`http://127.0.0.1:${PORT3}/?k=${encodeURIComponent(KEY)}`, { waitUntil: 'domcontentloaded' });
  await sleep(2500);
  const world3 = await page.evaluate(async () => (await (await window.__laFetch('/api/world')).json()));
  const drawn3 = (world3.plan && world3.plan.totals) || {};
  step('inception: the panel draws the spec-born plan — 3 products, 2 phases, 4 steps, nothing invented',
    drawn3.products === 3 && drawn3.phases === 2 && drawn3.steps === 4 && drawn3.stepsDone === 0,
    JSON.stringify(drawn3));

  /* The spine lists products collapsed; a person reading the story clicks each
     product open. The walk does the same, then reads the step titles off the
     page. Each click re-renders the rail, so re-query fresh handles each pass. */
  await page.evaluate(async () => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    for (let i = 0; i < 12; i++) {
      const closed = [...document.querySelectorAll('.sseg-h.clickable')].filter((h) => !h.classList.contains('open'));
      if (!closed.length) break;
      closed[0].click();
      await nap(150);
    }
  });
  await sleep(400);
  const spineText4 = await page.evaluate(() => document.body.textContent || '');
  step('inception: the spine shows the story the operator approved, product and step names verbatim',
    ['Reader', 'Plate', 'Ghost', 'Read the day book from disk', 'Round the totals the stall way'].every((t) => spineText4.includes(t)),
    ['Reader', 'Plate', 'Ghost', 'Read the day book from disk', 'Round the totals the stall way'].filter((t) => !spineText4.includes(t)).join(' missing|'));
  await page.screenshot({ path: path.join(OUT, '07-inception-born-spine.png') });

  const conn3 = await page.evaluate(async (plan) => {
    const r = await window.__laFetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(plan) });
    return { status: r.status, body: await r.json() };
  }, plan3);
  const conns3 = (conn3.body && conn3.body.connections) || [];
  step('inception: the connection report connects every homed product to the real tree',
    conn3.status === 200 && conns3.length === 3 && conns3.filter((c) => c.matched).length === 2 && !conns3.find((c) => c.product.id === 'ghost')?.matched,
    JSON.stringify(conns3.map((c) => (c.product.id || '?') + ':' + (c.matched ? 'ok' : 'open'))).slice(0, 140));
  srv3.kill();
} catch (e) {
  step('walk ran to completion without a harness error', false, String(e && e.message).slice(0, 200));
} finally {
  if (context) await context.close(); // finalises the recorded .webm
  if (browser) await browser.close();
  srv.kill();
}

// The recording lands under a Playwright GUID name; settle it to a stable one.
try {
  const vid = readdirSync(OUT).find((f) => f.endsWith('.webm'));
  if (vid) {
    renameSync(path.join(OUT, vid), path.join(OUT, 'plan-lifecycle-walk.webm'));
    console.log('video: plan-lifecycle-walk.webm');
  } else {
    console.log('video: NONE RECORDED');
  }
} catch (e) { console.log('video: rename failed: ' + e.message); }

writeFileSync(path.join(OUT, 'plan-lifecycle-walk.json'), JSON.stringify({ when: new Date().toISOString(), steps }, null, 2));
console.log(`\n${steps.length - fails()}/${steps.length} passed`);
process.exit(fails());
