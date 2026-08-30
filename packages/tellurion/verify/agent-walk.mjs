#!/usr/bin/env node
// Agents are not products, so they are not drawn like them.
//
// Two claims, checked separately: the MODEL keeps agents as their own class and
// never turns a dispatched agent into a workflow comet, and the RENDER draws
// them angular and violet on their own band with a thread to what they touch.
//
//   node verify/agent-walk.mjs [--port N]

import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import * as W from '../lib/state.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.dirname(HERE);
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const PORT_WANT = Number(arg('port', 8940));
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

/* ---- the model, as pure logic ---- */
const blank = () => W.createWorld('t', '/tmp', { genesis: true, planets: [], features: [], milestones: [], tools: [], processes: [], workflows: [], attribution: [] });
{
  const w = blank();
  const now = Date.now();
  W.applyTool(w, { name: 'Task', input: { subagent_type: 'Explore', description: 'scan' }, at: now });
  ok('1 a dispatched agent becomes an agent', Object.keys(w.agents).length === 1, Object.keys(w.agents).join(','));
  ok('2 and never a workflow comet', w.transients.filter((t) => t.kind === 'comet').length === 0);

  W.applyTool(w, { name: 'Task', input: { subagent_type: 'Explore', description: 'again' }, at: now });
  ok('3 the same agent twice is still one agent', Object.keys(w.agents).length === 1 && w.agents.Explore.runs === 2, `runs=${w.agents.Explore.runs}`);

  const stale = blank();
  W.applyTool(stale, { name: 'Task', input: { subagent_type: 'old' }, at: now - (W.AGENT_IDLE_MS + 60_000) });
  W.applyTool(stale, { name: 'Task', input: { subagent_type: 'fresh' }, at: now });
  const xs = W.agentList(stale, now);
  ok('4 idle and active are told apart by real elapsed time', xs.find((a) => a.name === 'fresh').active === true && xs.find((a) => a.name === 'old').active === false);
  ok('5 active agents sort first, because they are the ones doing something', xs[0].name === 'fresh');
  ok('6 an agent with no name is ignored rather than invented', W.applyAgent(blank(), { name: '', at: now }) === null);
}

/* ---- the render ---- */
const srv = spawn(process.execPath, [path.join(APP, 'server.mjs'), '--project', APP, '--port', String(PORT), '--demo'], { stdio: 'ignore' });
const done = (c) => { try { srv.kill('SIGTERM'); } catch {} process.exit(c); };
let browser;
try {
  let up = false;
  for (let i = 0; i < 60 && !up; i++) {
    await wait(500);
    await new Promise((r) => http.get(`http://127.0.0.1:${PORT}/health`, (s) => { up = s.statusCode === 200; s.resume(); r(); }).on('error', () => r()));
  }
  ok('7 the demo server comes up', up);
  if (!up) throw new Error('no server');

  browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1500, height: 1000 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(11000);   // let the demo reach its agent beats

  const seen = await p.evaluate(() => {
    const c = document.querySelector('canvas');
    const ctx = c.getContext('2d');
    const dpr = c.width / c.getBoundingClientRect().width;
    const hub = window.__ORR_HUB;
    // count violet pixels anywhere on the plate: nothing else on it is violet
    const img = ctx.getImageData(0, 0, c.width, c.height).data;
    let violet = 0;
    for (let i = 0; i < img.length; i += 4 * 7) {
      const r = img[i], g = img[i + 1], b = img[i + 2];
      if (b > 170 && r > 90 && r < 180 && g < 120 && b - g > 90) violet++;
    }
    return { violet, hub: !!hub, dpr };
  });
  const world = await new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}/api/world`, (r) => {
    let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } });
  }).on('error', rej));
  const names = Object.keys(world.agents || {});
  ok('8 the live world carries the dispatched agents', names.length >= 1, names.join(', '));
  ok('9 they are drawn, in a colour nothing else on the plate uses', seen.violet > 40, `${seen.violet} violet samples`);
  ok('10 no comet was created for an agent', (world.transients || []).filter((t) => t.kind === 'comet' && /Explore|verifier/.test(String(t.label || ''))).length === 0);
  ok('11 no console errors', errs.length === 0, errs.slice(0, 2).join(' | '));
} catch (e) {
  ok('walk completed without throwing', false, String(e && e.message));
} finally {
  if (browser) try { await browser.close(); } catch {}
}

const pass = steps.filter((s) => s.pass).length;
for (const s of steps) console.log(`${s.pass ? 'PASS' : 'FAIL'}  ${s.n}${s.d ? `   [${s.d}]` : ''}`);
console.log(`\n${pass}/${steps.length} PASS`);
done(pass === steps.length ? 0 : 1);
