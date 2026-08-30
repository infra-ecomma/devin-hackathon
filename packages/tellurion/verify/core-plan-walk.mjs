#!/usr/bin/env node
// The core is the plan: one segment per plan step, lit as steps land.
//
// Asserted against the DRAWN PIXELS rather than the numbers that produced them,
// because the whole claim is about what the operator can see at the centre of
// the plate. Runs against a scratch project carrying a DECLARED plan, because
// the plan is a declaration in the repo and not a chat's to-do list.
//
//   node verify/core-plan-walk.mjs [--port N]

import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.dirname(HERE);
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const PORT_WANT = Number(arg('port', 8908));
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

// A scratch project with a plan of 8 steps, 3 of them done. Written fresh so
// the ratio the render is checked against cannot drift.
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), 'tellurion-plan-'));
fs.mkdirSync(path.join(SCRATCH, '.tellurion'), { recursive: true });
fs.writeFileSync(path.join(SCRATCH, '.tellurion', 'plan.json'), JSON.stringify({
  project: 'scratch',
  phases: [
    { title: 'Foundations', steps: [{ title: 'one', status: 'done' }, { title: 'two', status: 'done' }, { title: 'three', status: 'done' }] },
    { title: 'Build', steps: [{ title: 'four', status: 'active' }, { title: 'five' }, { title: 'six' }] },
    { title: 'Ship', steps: [{ title: 'seven' }, { title: 'eight' }] },
  ],
}, null, 2));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const steps = [];
const ok = (n, pass, d = '') => steps.push({ n, pass: !!pass, d });

const srv = spawn(process.execPath, [path.join(APP, 'server.mjs'), '--project', SCRATCH, '--port', String(PORT)], { stdio: 'ignore' });
const done = (c) => { try { srv.kill('SIGTERM'); } catch {} try { fs.rmSync(SCRATCH, { recursive: true, force: true }); } catch {} process.exit(c); };

let browser;
try {
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    await wait(500);
    await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/health`, (s) => { up = s.statusCode === 200; s.resume(); r(); }).on('error', () => r()));
  }
  ok('1 the server comes up on a project with a declared plan', up);
  if (!up) throw new Error('no server');

  const readWorld = () => new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}/api/world`, (r) => {
    let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } });
  }).on('error', rej));

  browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(5200);

  const world = await readWorld();
  const total = (world.plan && world.plan.totals.steps) | 0;
  const doneN = (world.plan && world.plan.totals.stepsDone) | 0;
  ok('2 the project carries a DECLARED plan', total > 0, `${doneN} of ${total} steps`);
  ok('3 the plan is partly complete, so lit and unlit can be told apart', doneN > 0 && doneN < total, `${doneN}/${total}`);

  // Sample the plan ring itself. A lit segment is drawn in the brand blue; an
  // unlit one in faint ink. Counting them proves the ring encodes the plan
  // rather than merely existing.
  const sample = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    const hub = window.__ORR_HUB;
    if (!hub) return { error: 'no hub seam' };
    const ctx = c.getContext('2d');
    const dpr = c.width / c.getBoundingClientRect().width;
    const cx = hub.cx * dpr, cy = hub.cy * dpr, R = hub.planR * dpr;
    let blue = 0, ink = 0, blank = 0;
    const N = 720;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const d = ctx.getImageData(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R), 1, 1).data;
      const [r, g, b] = d;
      if (b > 150 && b - r > 90) blue++;
      else if (r < 215 && g < 220 && b < 230) ink++;
      else blank++;
    }
    return { blue, ink, blank, N, planN: hub.planN, planDone: hub.planDone };
  });
  ok('3b the drawing exposes what it drew', !sample.error, sample.error || `hub says ${sample.planDone}/${sample.planN}`);

  const lit = sample.blue / sample.N;
  const expect = sample.planN ? sample.planDone / sample.planN : 0;
  ok('4 the plan ring is actually drawn', sample.blue + sample.ink > sample.N * 0.5, JSON.stringify(sample));
  ok('5 the lit share matches the plan', Math.abs(lit - expect) < 0.18, `drawn ${(lit * 100).toFixed(0)}% lit, plan is ${(expect * 100).toFixed(0)}%`);
  ok('6 unlit steps are still visible, so the whole plan is countable', sample.ink > sample.N * 0.05, `${sample.ink} unlit samples`);
  ok('7 no console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
} catch (e) {
  ok('walk completed without throwing', false, String(e && e.message));
} finally {
  if (browser) try { await browser.close(); } catch {}
}

const pass = steps.filter((s) => s.pass).length;
for (const s of steps) console.log(`${s.pass ? 'PASS' : 'FAIL'}  ${s.n}${s.d ? `   [${s.d}]` : ''}`);
console.log(`\n${pass}/${steps.length} PASS`);
done(pass === steps.length ? 0 : 1);
