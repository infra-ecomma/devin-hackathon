#!/usr/bin/env node
// The declared plan, and the join between the spine and the orrery.
//
// The plan is a DECLARATION in the repo, hand editable, and it is the same plan
// tomorrow. The spine row and the body on the plate are ONE record seen twice,
// so renaming a step in the file renames its moon. Two copies of a name would
// drift apart on the first edit, which is the whole reason this is structured.
//
// The rule the plan may not break: it can carry a feature as far as CLAIMED and
// no further. `done` in a plan is the operator saying it is finished, which is a
// claim. The halo is independent evidence and cannot be typed into a file.
//
//   node verify/plan-walk.mjs [--port N]

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as W from '../lib/state.mjs';
import * as P from '../lib/plan.mjs';
import * as SO from '../lib/signoff.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.dirname(HERE);
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const PORT_WANT = Number(arg('port', 8830));
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
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const steps = [];
const ok = (n, pass, d = '') => steps.push({ n, pass: !!pass, d });

const blank = () => W.createWorld('t', '/tmp', { genesis: true, planets: [], features: [], milestones: [], tools: [], processes: [], workflows: [], attribution: [] });
const PLAN = {
  project: 'scratch',
  products: [{ id: 'reader', name: 'The reader' }],
  phases: [{ title: 'Build', steps: [
    { id: 's1', title: 'Discover projects', status: 'done', produces: { of: 'reader' } },
    { id: 's2', title: 'Follow one live', status: 'active', produces: { of: 'reader' } },
    { id: 's3', title: 'Handle a broken plan', produces: { of: 'reader' } },
  ] }],
};

/* ---- the model ---- */
{
  const w = blank();
  W.applyPlan(w, P.normalisePlan(PLAN));
  ok('1 a declared product becomes a planet', w.stat.planets.some((p) => p.id === 'plan:reader' && p.name === 'The reader'));
  ok('2 a step that produces a feature becomes a moon of it', w.stat.features.filter((f) => f.parent === 'plan:reader').length === 3);
  ok('3 the moon carries the STEP id, so the two are one record', w.stat.features.some((f) => f.id === 'step:s1'));

  // the structural claim
  const renamed = JSON.parse(JSON.stringify(PLAN));
  renamed.phases[0].steps[0].title = 'Find every project';
  renamed.products[0].name = 'The project reader';
  W.applyPlan(w, P.normalisePlan(renamed));
  ok('4 renaming the step in the plan renames its moon',
     w.stat.features.find((f) => f.id === 'step:s1').name === 'Find every project');
  ok('5 renaming the product renames its planet',
     w.stat.planets.find((p) => p.id === 'plan:reader').name === 'The project reader');
  ok('6 and it is still ONE record, not a second copy',
     w.stat.features.filter((f) => f.id === 'step:s1').length === 1 && w.stat.planets.filter((p) => p.id === 'plan:reader').length === 1);

  ok('7 a plan alone reaches CLAIMED and no further',
     w.stat.features.every((f) => f.status === 'open' || f.status === 'claimed') && w.stat.features.some((f) => f.status === 'claimed'));

  // the chain of custody: three parties, and nobody grants their own tier
  const so = { verdicts: new Map([['s1', { by: 'Sentinel' }]]), accepted: new Map() };
  W.applyPlan(w, P.normalisePlan(PLAN), so);
  ok('7a the judge lifts a claim to verified, and is named',
     w.stat.features.find((f) => f.id === 'step:s1').status === 'verified'
     && w.stat.features.find((f) => f.id === 'step:s1').signedBy === 'Sentinel');
  so.accepted.set('s1', { by: 'Wassim' });
  W.applyPlan(w, P.normalisePlan(PLAN), so);
  ok('7b the operator lifts it to fully-verified, and is named',
     w.stat.features.find((f) => f.id === 'step:s1').status === 'fully-verified'
     && w.stat.features.find((f) => f.id === 'step:s1').signedBy === 'Wassim');
  const skip = { verdicts: new Map(), accepted: new Map([['s1', { by: 'Wassim' }]]) };
  W.applyPlan(w, P.normalisePlan(PLAN), skip);
  ok('7c the ladder cannot be skipped: accepted without a judge stays claimed',
     w.stat.features.find((f) => f.id === 'step:s1').status === 'claimed');
  const unbuilt = { verdicts: new Map([['s3', { by: 'Sentinel' }]]), accepted: new Map() };
  W.applyPlan(w, P.normalisePlan(PLAN), unbuilt);
  ok('7d a verdict on work nobody claimed promotes nothing',
     w.stat.features.find((f) => f.id === 'step:s3').status === 'open');
  W.applyPlan(w, P.normalisePlan(PLAN), { verdicts: new Map([['s1', { by: 'Sentinel' }]]), accepted: new Map() });
  ok('7e a product is held at its LEAST advanced feature',
     w.stat.planets.find((p) => p.id === 'plan:reader').status === 'building',
     'one open moon keeps the whole product back');

  ok('8 the active step is tracked from the plan', w.activeStep === 's2');
  W.applyFile(w, { path: 'lib/reader.mjs', created: true, at: Date.now() });
  ok('9 work landing now is credited to the step in hand',
     (W.stepWorkOf(w, 's2') || { paths: [] }).paths.includes('lib/reader.mjs'));

  const w2 = blank();
  W.applyPlan(w2, P.emptyPlan('none'));
  W.applyFile(w2, { path: 'src/thing.mjs', created: true, at: Date.now() });
  ok('10 with no plan, a directory may still grow a planet', w2.stat.planets.length > 0, `${w2.stat.planets.length} planets`);
  const w3 = blank();
  W.applyPlan(w3, P.normalisePlan(PLAN));
  const before = w3.stat.planets.length;
  W.applyFile(w3, { path: 'unrelated/thing.mjs', created: true, at: Date.now() });
  ok('11 with a plan, a directory NEVER invents one: declared beats guessed',
     w3.stat.planets.length === before, `${before} planets before and after`);
}

/* ---- the file, live ---- */
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'tellurion-planwalk-'));
fs.mkdirSync(path.join(SCRATCH, '.tellurion'), { recursive: true });
const planFile = path.join(SCRATCH, '.tellurion', 'plan.json');
fs.writeFileSync(planFile, JSON.stringify(PLAN, null, 2));

const srv = spawn(process.execPath, [path.join(APP, 'server.mjs'), '--project', SCRATCH, '--port', String(PORT)], { stdio: 'ignore' });
const done = (c) => { try { srv.kill('SIGTERM'); } catch {} try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch {} process.exit(c); };
const get = (p) => new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}${p}`, (r) => {
  let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } });
}).on('error', rej));

try {
  let up = false;
  for (let i = 0; i < 60 && !up; i++) { await wait(500); try { await get('/health'); up = true; } catch {} }
  ok('12 the server comes up on a project with a declared plan', up);
  if (!up) throw new Error('no server');

  const w0 = await get('/api/world');
  ok('13 the live graph is the plan', w0.stat.planets.some((p) => p.name === 'The reader'));

  // the hand edit, which is the point of a declared plan
  const d = JSON.parse(fs.readFileSync(planFile, 'utf8'));
  d.phases[0].steps[0].title = 'Find every project';
  fs.writeFileSync(planFile, JSON.stringify(d, null, 2));
  await wait(2600);
  const w1 = await get('/api/world');
  ok('14 a HAND EDIT to the file moves the plate, with no reload',
     w1.stat.features.find((f) => f.id === 'step:s1').name === 'Find every project');

  // the three parties, through their three real files
  fs.writeFileSync(planFile, JSON.stringify({ ...PLAN, phases: [{ title: 'Build', steps: PLAN.phases[0].steps.map((x) => ({ ...x, status: 'done' })) }] }, null, 2));
  await wait(2600);
  const c0 = await get('/api/world');
  ok('16 with only the builder speaking, everything is claimed',
     c0.stat.features.every((f) => f.status === 'claimed'));
  fs.writeFileSync(path.join(SCRATCH, '.tellurion', 'verdicts.json'),
    JSON.stringify({ verdicts: [{ step: 's1', pass: true, by: 'Sentinel' }, { step: 's2', pass: false, by: 'Sentinel' }] }, null, 2));
  await wait(2800);
  const c1 = await get('/api/world');
  ok('17 a judge PASS lifts one to verified', c1.stat.features.find((f) => f.id === 'step:s1').status === 'verified');
  ok('18 a judge FAIL lifts nothing: a file of failures is not a file of sign-offs',
     c1.stat.features.find((f) => f.id === 'step:s2').status === 'claimed');
  SO.accept(SCRATCH, { step: 's1', by: 'Wassim' });
  await wait(2800);
  const c2 = await get('/api/world');
  ok('19 the operator accepting lifts it to fully-verified, live',
     c2.stat.features.find((f) => f.id === 'step:s1').status === 'fully-verified');
  ok('20 and the record names who accepted it',
     c2.stat.features.find((f) => f.id === 'step:s1').signedBy === 'Wassim');
  let refused = false;
  try { SO.accept(SCRATCH, { step: 's3' }); } catch { refused = true; }
  ok('21 acceptance with no name is refused: the top tier is a person signing', refused);

  // a broken file must never look like "no plan yet"
  fs.writeFileSync(planFile, '{ not json');
  await wait(2600);
  const pl = await get('/api/plan');
  ok('15 a broken plan is reported, not silently emptied', pl.exists === true && !!pl.error, String(pl.error || '').slice(0, 50));
} catch (e) {
  ok('walk completed without throwing', false, String(e && e.message));
}

const pass = steps.filter((s) => s.pass).length;
for (const s of steps) console.log(`${s.pass ? 'PASS' : 'FAIL'}  ${s.n}${s.d ? `   [${s.d}]` : ''}`);
console.log(`\n${pass}/${steps.length} PASS`);
done(pass === steps.length ? 0 : 1);
