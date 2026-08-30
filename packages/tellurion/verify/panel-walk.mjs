#!/usr/bin/env node
// Panel-walk — the executable definition of done for the 2026-08-30 wrapper work.
//
// The defect class it pins: the VS Code panel framed the instrument BLIND, so a
// dead server, a dropped port-forward, or another project's instrument on the
// port all rendered as the same blank white square (reported three times across
// 2026-08-29/30). The wrapper page now verifies before it frames and names every
// failure. This walk loads the REAL wrapper (vscode-ext/wrapper.js, no copy) in
// real Chromium against a real instrument and asserts each end state.
//
//   P1  live instrument + matching root  -> the frame appears, no card stays up
//   P2  dead port                        -> the unreachable card names the URL
//   P3  live instrument + wrong root     -> the mismatch card names BOTH roots
//   P4  live instrument + matching root  -> the frame src is carried verbatim
//   P5  the page's CSP lets its own probe fetch /health (else everything reads
//       as unreachable — the loudest false alarm this page could raise)
//
// Exit code is the number of failures.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import wrapperPkg from '../vscode-ext/wrapper.js';

const { wrapperHtml } = wrapperPkg;
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

const cleanup = [];
const fixture = (name) => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), name));
  cleanup.push(() => { try { fs.rmSync(d, { recursive: true, force: true }); } catch {} });
  return d;
};

let browser;
try {
  // One real instrument watching a throwaway project.
  const proj = fixture('panel-walk-');
  const port = await freePort(8890);
  const origin = `http://127.0.0.1:${port}`;
  const srv = spawn('node', [path.join(ROOT, 'server.mjs'), '--project', proj, '--name', 'panel-walk', '--port', String(port), '--host', '127.0.0.1'], { stdio: 'pipe' });
  let srvLog = '';
  srv.stdout.on('data', (d) => { srvLog += d; });
  srv.stderr.on('data', (d) => { srvLog += d; });
  cleanup.push(() => { try { srv.kill('SIGKILL'); } catch {} });
  await sleep(1800);

  browser = await chromium.launch();
  const page = await browser.newPage();

  const writeWrapper = (name, args) => {
    const f = path.join(os.tmpdir(), name);
    fs.writeFileSync(f, wrapperHtml(args));
    cleanup.push(() => { try { fs.rmSync(f, { force: true }); } catch {} });
    return f;
  };
  const cardVisible = (id) => page.evaluate((x) => {
    const el = document.getElementById(x);
    return !!el && !el.hidden;
  }, id);

  /* --------------------------------------------- P1/P4: live + matching root */
  {
    const frameUrl = `${origin}/`;
    const f = writeWrapper('tellurion-p1.html', { frameUrl, origin, expectedRoot: proj });
    await page.goto('file://' + f);
    await page.waitForSelector('iframe', { timeout: 8000 });
    const src = await page.evaluate(() => document.querySelector('iframe').src);
    step('P1: a live instrument watching THIS folder gets framed', await cardVisible('connecting') === false && await cardVisible('unreachable') === false && await cardVisible('mismatch') === false);
    step('P4: the frame src is carried verbatim', src === frameUrl, src);
  }

  /* ------------------------------------------------------- P2: a dead port */
  {
    const deadPort = await freePort(8990);
    const deadOrigin = `http://127.0.0.1:${deadPort}`;
    const f = writeWrapper('tellurion-p2.html', { frameUrl: `${deadOrigin}/`, origin: deadOrigin, expectedRoot: proj });
    await page.goto('file://' + f);
    await page.waitForFunction(() => !document.getElementById('unreachable').hidden, null, { timeout: 12000 });
    const text = await page.evaluate(() => document.getElementById('unreachable').innerText);
    step('P2: a dead port shows the unreachable card, naming the URL', text.includes(deadOrigin), text.slice(0, 120).replace(/\n/g, ' '));
    step('P2: no frame is left up against a dead port', (await page.evaluate(() => document.querySelectorAll('iframe').length)) === 0);
  }

  /* ------------------------------------------- P3: live + a different root */
  {
    const f = writeWrapper('tellurion-p3.html', { frameUrl: `${origin}/`, origin, expectedRoot: '/home/wassim/projects/some-other-project' });
    await page.goto('file://' + f);
    await page.waitForFunction(() => !document.getElementById('mismatch').hidden, null, { timeout: 8000 });
    const text = await page.evaluate(() => document.getElementById('mismatch').innerText);
    step('P3: another project\'s instrument on the port shows the mismatch card', text.includes('some-other-project'), text.slice(0, 120).replace(/\n/g, ' '));
    step('P3: the card names what IS being watched', text.includes('panel-walk-'), text.slice(0, 160).replace(/\n/g, ' '));
  }

  /* ------------------------------------------------------ P5: the probe can cross origins */
  {
    const html = wrapperHtml({ frameUrl: `${origin}/`, origin, expectedRoot: proj });
    const idRes = await fetch(`${origin}/api/identity`);
    step('P5: the CSP carries connect-src for the instrument origin', html.includes(`connect-src ${origin}`));
    step('P5: /api/identity answers CORS-open (a webview-origin probe can read it)',
      idRes.headers.get('access-control-allow-origin') === '*',
      `acao=${idRes.headers.get('access-control-allow-origin')}`);
    const id = await idRes.json();
    step('P5: /api/identity carries identity and nothing sensitive',
      id.instrument === 'tellurion' && id.root === proj && !('following' in id),
      `keys=${Object.keys(id).join(',')}`);
  }

  const fails = steps.filter((s) => !s.ok);
  const out = path.join(ROOT, 'verify', 'last-panel-walk.json');
  fs.writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), totalFails: fails.length, steps, srvLogTail: srvLog.slice(-400) }, null, 2));
  console.log(`\n${fails.length} failing of ${steps.length}  ->  ${out}`);
  process.exitCode = fails.length;
} finally {
  if (browser) await browser.close().catch(() => {});
  for (const c of cleanup.reverse()) c();
}
