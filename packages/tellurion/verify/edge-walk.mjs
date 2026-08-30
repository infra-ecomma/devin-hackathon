#!/usr/bin/env node
// Edge-case walk — the fail-first reproductions for the 2026-08-29 edge hunt.
// Each step names the defect it pins. Written RED against the pre-fix code; the
// same file is the regression gate once the fixes land.
//
//   E1  retarget() drops world.url, so the Browser link loses the tailnet
//       address after a project switch
//   E2  custody files write non-atomically; a torn write reads back as an
//       EMPTY chain of custody, silently
//   E3  propose-plan's id fallback never fires: 'f-' + x || y — every row
//       without an itemId gets the same id "f-"
//   E4  build-static never bundles tiers.mjs though state.mjs imports it, and
//       crashes with a bare TypeError when handed something that is not a world
//   E7  session backlog replay lights the ticker and the drive gauge with
//       history; git history already carries the `pre` flag, sessions ignore
//       their own `seeding` flag
//   E8  sameSite() allows sec-fetch-site "same-site", so any page on any other
//       localhost port can write to a keyless loopback instrument
//   E9  /health carried no identity, so "the instrument is up" passed for a
//       portless zombie while another project's instrument owned the port
//       (2026-08-28); the 200 must pair with the listening pid
//
// Exit code is the number of failures.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');

const steps = [];
const step = (name, ok, detail = '') => {
  steps.push({ n: steps.length + 1, name, ok: !!ok, detail: String(detail).slice(0, 300) });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${String(steps.length).padStart(2, '0')}  ${name}${detail ? '  :: ' + String(detail).slice(0, 140) : ''}`);
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
  throw new Error(`no free port near ${start}`);
}

function boot(args, { waitMs = 1600 } = {}) {
  const srv = spawn('node', [path.join(ROOT, 'server.mjs'), ...args], { stdio: 'pipe' });
  let log = '';
  srv.stdout.on('data', (d) => { log += d; });
  srv.stderr.on('data', (d) => { log += d; });
  return { srv, log: () => log, ready: sleep(waitMs) };
}

const cleanup = [];
const fixture = (name) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), name));
  cleanup.push(() => { try { fs.rmSync(d, { recursive: true, force: true }); } catch {} });
  return d;
};

/* ---------------------------------------------------------------- E8: sameSite */
// A keyless loopback instrument must take writes only from its own page (or
// header-less curl). "same-site" is any other localhost port — the hole.
{
  const proj = fixture('edge-e8-');
  const port = await freePort(8830);
  const { srv, ready } = boot(['--project', proj, '--name', 'e8', '--port', String(port), '--host', '127.0.0.1']);
  await ready;
  const plan = { project: 'e8', products: [{ id: 'core', name: 'Core' }], phases: [{ id: 'p1', title: 'P', steps: [{ id: 's1', title: 'one', status: 'planned', produces: { of: 'core' } }] }] };
  const post = (headers) => fetch(`http://127.0.0.1:${port}/api/plan`, {
    method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(plan),
  }).then((r) => r.status).catch(() => 0);

  const sameSiteStatus = await post({ 'sec-fetch-site': 'same-site' });
  step('E8: a POST from another localhost port (sec-fetch-site: same-site) is refused', sameSiteStatus === 403, `status=${sameSiteStatus}`);

  const sameOriginStatus = await post({ 'sec-fetch-site': 'same-origin' });
  step('E8 control: the instrument’s own page (same-origin) still writes', sameOriginStatus === 200, `status=${sameOriginStatus}`);

  const curlStatus = await post({});
  step('E8 control: a header-less client (curl) still writes', curlStatus === 200, `status=${curlStatus}`);

  srv.kill('SIGTERM');
  await sleep(300);
}

/* ------------------------------------------------- E7: seeding is not "live" */
{
  const proj = fixture('edge-e7-');
  spawnSync('git', ['init'], { cwd: proj, stdio: 'ignore' });
  // The transcript dir this project's sessions would live in, planted with an
  // hour-old backlog: a prompt, a tool call, a to-do list.
  const slug = proj.replace(/[^A-Za-z0-9]/g, '-');
  const sdir = path.join(os.homedir(), '.claude', 'projects', slug);
  fs.mkdirSync(sdir, { recursive: true });
  cleanup.push(() => { try { fs.rmSync(sdir, { recursive: true, force: true }); } catch {} });
  const hrAgo = new Date(Date.now() - 3600_000).toISOString();
  const lines = [
    { type: 'user', timestamp: hrAgo, cwd: proj, message: { content: 'build the fixture thing' } },
    { type: 'assistant', timestamp: hrAgo, cwd: proj, message: { content: [{ type: 'tool_use', name: 'Bash', input: { command: 'npm test', description: 'run the tests' } }] } },
    { type: 'assistant', timestamp: hrAgo, cwd: proj, message: { content: [{ type: 'tool_use', name: 'TodoWrite', input: { todos: [{ content: 'set up fixture', status: 'in_progress', activeForm: 'Setting up fixture' }] } }] } },
  ];
  fs.writeFileSync(path.join(sdir, 'session-one.jsonl'), lines.map((l) => JSON.stringify(l)).join('\n') + '\n');

  const port = await freePort(8870);
  const { srv, ready, log } = boot(['--project', proj, '--name', 'e7', '--port', String(port), '--host', '127.0.0.1']);
  await ready;
  const world = await fetch(`http://127.0.0.1:${port}/api/world`).then((r) => r.json()).catch(() => null);
  step('E7: a fresh boot replays history without lighting the drive gauge', !!world && world.drive.energy === 0,
    world ? `energy=${world.drive.energy} rpm=${world.drive.rpm}` : 'no world');
  step('E7: history does not enter the ticker at boot', !!world && world.ticker.length === 0,
    world ? `ticker=${world.ticker.length}${world.ticker[0] ? ' first="' + world.ticker[0].text.slice(0, 50) + '"' : ''}` : 'no world');
  step('E7 control: seeded state still applies (the to-do list arrived)',
    !!world && world.session && world.session.todoTotal === 1,
    world ? `todoTotal=${world.session && world.session.todoTotal}` : 'no world');
  if (!world) console.log('server log so far:\n' + log());
  srv.kill('SIGTERM');
  await sleep(300);
}

/* ------------------------------------------- E1: retarget keeps the door out */
{
  const proj = fixture('edge-e1-');
  spawnSync('git', ['init'], { cwd: proj, stdio: 'ignore' });
  const port = await freePort(8910);
  const { srv, ready, log } = boot(['--project', proj, '--name', 'e1', '--port', String(port), '--host', '0.0.0.0']);
  await ready;
  let key = '';
  try { key = fs.readFileSync(path.join(os.homedir(), '.tellurion', 'key'), 'utf8').trim(); } catch {}
  const auth = { authorization: 'Bearer ' + key };
  const w0 = await fetch(`http://127.0.0.1:${port}/api/world`, { headers: auth }).then((r) => r.json()).catch(() => null);
  if (!w0 || !w0.url) {
    step('E1: non-loopback boot publishes its own network address', false, `world.url=${w0 && w0.url} (needs tailscale up; log: ${log().slice(0, 200)})`);
  } else {
    step('E1 control: boot publishes its own network address', true, w0.url);
    const list = await fetch(`http://127.0.0.1:${port}/api/projects?max=60`, { headers: auth }).then((r) => r.json()).catch(() => null);
    const other = list && (list.projects || []).find((p) => p.path !== proj);
    if (!other) {
      step('E1: another project exists to switch to', false, 'discovery returned nothing else');
    } else {
      const w = await fetch(`http://127.0.0.1:${port}/api/watch`, {
        method: 'POST', headers: { 'content-type': 'application/json', ...auth }, body: JSON.stringify({ id: other.id }),
      }).then((r) => r.json()).catch((e) => ({ err: String(e) }));
      await sleep(700);
      const w1 = await fetch(`http://127.0.0.1:${port}/api/world`, { headers: auth }).then((r) => r.json()).catch(() => null);
      step('E1: after a project switch the world still carries its network address',
        !!(w && w.ok && w1 && w1.url === w0.url),
        `watch=${w && w.ok} before=${w0.url} after=${w1 && w1.url}`);
    }
  }
  srv.kill('SIGTERM');
  await sleep(300);
}

/* --------------------------------------- E2: custody writes are all-or-nothing */
// A torn JSON file reads back as an EMPTY map in every reader here, so a kill
// mid-write silently forgets the whole chain of custody. The fix is tmp+rename
// at every writer; this step watches the syscalls and refuses any direct write
// to a custody file's final path.
{
  const dir = fixture('edge-e2-');
  const writes = [];
  const realWrite = fs.writeFileSync;
  fs.writeFileSync = function (p, ...rest) { writes.push(String(p)); return realWrite.apply(this, [p, ...rest]); };
  let threw = null;
  try {
    const so = await import(path.join(ROOT, 'lib', 'signoff.mjs'));
    const work = await import(path.join(ROOT, 'lib', 'work.mjs'));
    const planMod = await import(path.join(ROOT, 'lib', 'plan.mjs'));
    const plan = { project: 'e2', products: [{ id: 'core', name: 'Core' }], phases: [{ id: 'p1', title: 'P', steps: [{ id: 's1', title: 'one', status: 'done', produces: { of: 'core' } }] }] };
    planMod.writePlan(dir, plan, { force: true });
    const verdicts = new Map([['s1', { by: 'judge', pass: true, at: '2026-08-29T00:00:00Z' }]]);
    so.accept(dir, { step: 's1', by: 'Wassim', plan: planMod.readPlan(dir), verdicts });
    so.unaccept(dir, 's1');
    so.noteWithdrawals(dir, ['s1']);
    so.clearWithdrawal(dir, 's1');
    work.writeWork(dir, { s1: { paths: ['a.js'], entities: [], commits: [], first: 1, last: 2 } });
  } catch (e) { threw = e; }
  fs.writeFileSync = realWrite;
  if (threw) step('E2: custody writers run under the syscall watch', false, String(threw && threw.message));
  const finals = writes.filter((p) => /[\\/]\.tellurion[\\/](verdicts|accepted|withdrawn|work|plan)\.json$/.test(p));
  step('E2: no custody file is ever written in place (every write lands on a .tmp sibling)',
    writes.length >= 6 && finals.length === 0,
    `${writes.length} writes, ${finals.length} direct: ${finals.map((p) => path.basename(p)).join(',') || 'none'}`);
  // and the files themselves are intact and parseable afterwards
  const ok = ['accepted.json', 'withdrawn.json', 'work.json', 'plan.json']
    .every((f) => { try { JSON.parse(fs.readFileSync(path.join(dir, '.tellurion', f), 'utf8')); return true; } catch { return false; } });
  step('E2 control: every custody file on disk parses after the writes', ok);
  // sentinel-ingest is a CLI, so the syscall watch cannot reach it: source check.
  const ing = fs.readFileSync(path.join(ROOT, 'bin', 'sentinel-ingest.mjs'), 'utf8');
  step('E2: sentinel-ingest writes verdicts through the atomic helper', /writeJsonAtomic\(/.test(ing));
}

/* ------------------------------------------------ E3: propose-plan step ids */
{
  const dir = fixture('edge-e3-');
  fs.mkdirSync(path.join(dir, 'features-ledger'), { recursive: true });
  const rows = [
    { type: 'capture', kind: 'feature', content: 'alpha feature without an id' },
    { type: 'capture', kind: 'feature', content: 'beta feature also without an id' },
    { type: 'capture', kind: 'feature', itemId: 'ledger-12345', content: 'gamma with an id' },
  ];
  fs.writeFileSync(path.join(dir, 'features-ledger', 'ledger.jsonl'), rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const run = spawnSync('node', [path.join(ROOT, 'bin', 'propose-plan.mjs'), dir], { encoding: 'utf8' });
  let ids = [];
  try { ids = (JSON.parse(run.stdout).phases || []).flatMap((p) => (p.steps || []).map((s) => s.id)); } catch {}
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  step('E3: rows without an itemId get real, unique ids (not every one "f-")',
    ids.length === 3 && dupes.length === 0 && !ids.includes('f-'),
    `ids=${JSON.stringify(ids)}`);
  step('E3 control: a row with an itemId keeps it', ids.includes('f-ledger-1'), `ids=${JSON.stringify(ids)}`);
}

/* ------------------------------------- E4: build-static bundles what it ships */
{
  const dir = fixture('edge-e4-');
  const worldFile = path.join(dir, 'world.json');
  fs.writeFileSync(worldFile, JSON.stringify({
    project: { name: 'archive-fixture' }, drive: { energy: 1, rpm: 1 }, transients: [{}], pulses: {},
    stat: { planets: [], features: [], milestones: [], tools: [], processes: [], workflows: [] },
    plan: null, agents: {}, ticker: [], usage: {}, session: {}, notches: [],
  }));
  const out = path.join(dir, 'archive.html');
  const okRun = spawnSync('node', [path.join(ROOT, 'bin', 'build-static.mjs'), worldFile, out], { encoding: 'utf8' });
  const html = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : '';
  step('E4: the archive bundles tiers.mjs, which state.mjs imports',
    okRun.status === 0 && /function tierFor/.test(html),
    okRun.status === 0 ? (/function tierFor/.test(html) ? 'bundled' : 'MISSING tierFor in bundle') : `build failed: ${(okRun.stderr || '').slice(0, 120)}`);

  const bogus = path.join(dir, 'bogus.json');
  fs.writeFileSync(bogus, JSON.stringify({ error: 'this instrument is on the network, so writing to it needs its key' }));
  const badRun = spawnSync('node', [path.join(ROOT, 'bin', 'build-static.mjs'), bogus, path.join(dir, 'bad.html')], { encoding: 'utf8' });
  step('E4: a non-world answer (a 401 error body) fails with a clear message, not a TypeError',
    badRun.status !== 0 && !/TypeError/.test(badRun.stderr || '') && /world/i.test(badRun.stderr || ''),
    `exit=${badRun.status} stderr=${(badRun.stderr || '').slice(0, 120)}`);
}

/* -------------- E9: a 200 on the port is OUR process, not just SOME process */
// The 2026-08-28 escape: "the instrument is up" passed for four days because a
// portless zombie answered the cheap checks while a SECOND project's instrument
// owned the port. The lesson written into the log was "pair the 200 with the
// listening pid" — /health now carries pid, version and startedAt so the pair
// can be checked, and this step is the standing check.
{
  const proj = fixture('edge-e9-');
  const port = await freePort(8960);
  const { srv, ready } = boot(['--project', proj, '--name', 'e9', '--port', String(port), '--host', '127.0.0.1']);
  await ready;
  const health = await fetch(`http://127.0.0.1:${port}/health`).then((r) => r.json()).catch(() => null);
  step('E9: /health names the pid that is actually answering', !!health && health.pid === srv.pid,
    `health.pid=${health && health.pid} spawned=${srv.pid}`);
  const wantVersion = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version;
  step('E9: /health names the running code\'s version', !!health && health.version === wantVersion,
    `health.version=${health && health.version} package=${wantVersion}`);
  step('E9: /health names when this process booted', !!health && typeof health.startedAt === 'number' && health.startedAt <= Date.now(),
    `startedAt=${health && health.startedAt}`);
  srv.kill('SIGTERM');
  await sleep(300);
}

const fails = steps.filter((s) => !s.ok).length;
console.log(`\n${steps.length - fails}/${steps.length} passed, ${fails} failed`);
for (const fn of cleanup) fn();
process.exit(fails);
