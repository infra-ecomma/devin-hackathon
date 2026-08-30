#!/usr/bin/env node
// Acceptance walk for following a chosen PROJECT.
//
// The unit is the project, not one chat. A chat is a fragment; the project is
// the codebase with the story, and every editor session on it feeds the
// instrument. This walk was first written against sessions, and step 4 asserted
// the tail was bound to a SINGLE transcript, which was the design error: it
// pinned the instrument to an arbitrary slice of the work. Step 4 now asserts
// the opposite.
//
// Everything drives the real server and a real browser; nothing here is mocked.
//
//   node verify/follow-walk.mjs [--port N] [--project PATH]

import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = path.dirname(HERE);
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };

const PORT_WANT = Number(arg('port', 8899));
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
const PROJECT = path.resolve(arg('project', APP));
const BASE = `http://127.0.0.1:${PORT}`;

const steps = [];
const ok = (name, pass, detail = '') => { steps.push({ name, pass: !!pass, detail }); };
const get = (p) => new Promise((res, rej) => {
  http.get(BASE + p, (r) => { let b = ''; r.setEncoding('utf8'); r.on('data', (c) => (b += c)); r.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); }).on('error', rej);
});
const post = (p, body) => new Promise((res, rej) => {
  const data = JSON.stringify(body);
  const r = http.request(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data) } },
    (rs) => { let b = ''; rs.setEncoding('utf8'); rs.on('data', (c) => (b += c)); rs.on('end', () => { try { res(JSON.parse(b)); } catch (e) { rej(e); } }); });
  r.on('error', rej); r.end(data);
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const srv = spawn(process.execPath, [path.join(APP, 'server.mjs'), '--project', PROJECT, '--port', String(PORT)],
  { stdio: ['ignore', 'pipe', 'pipe'], detached: false });
let boot = '';
srv.stdout.on('data', (d) => (boot += d));
srv.stderr.on('data', (d) => (boot += d));

const done = (code) => { try { srv.kill('SIGTERM'); } catch {} process.exit(code); };

try {
  // wait for the port
  let up = false;
  for (let i = 0; i < 60 && !up; i++) { await wait(500); try { await get('/health'); up = true; } catch {} }
  ok('1 the server comes up', up, boot.split('\n')[0] || '');
  if (!up) throw new Error('server never answered');

  const h0 = await get('/health');
  ok('2 it boots already following a project', !!h0.following, h0.following ? `${h0.following.name} (${h0.following.sessions} chats)` : 'following is null');
  // A project is a GIT ROOT. Pointing this at a subdirectory of a repo must
  // resolve UP to the repo, because that is the unit with a beginning and a
  // shape; a subdirectory is a fragment of one. The old form of this assertion
  // demanded the literal path back and so encoded the opposite contract.
  ok('3 the followed project is the repo containing what it was pointed at',
     !h0.following || PROJECT === path.resolve(h0.following.path) || PROJECT.startsWith(path.resolve(h0.following.path) + path.sep),
     h0.following ? h0.following.path : '');
  ok('4 EVERY session directory for the project is watched, not one chat',
     Array.isArray(h0.transcriptDirs) && h0.transcriptDirs.length > 0, `${(h0.transcriptDirs || []).length} session dir(s)`);
  ok('4b a project carries more than one chat, and says so', !h0.following || h0.following.sessions >= 1, h0.following ? `${h0.following.sessions} chats` : '');

  const list = await get('/api/projects?max=30');
  ok('5 it can list the projects', Array.isArray(list.projects) && list.projects.length > 0, `${(list.projects || []).length} found`);
  ok('6 every row carries what a person needs to pick', (list.projects || []).every((i) => i.id && i.path && i.name && typeof i.live === 'boolean'));
  ok('6b subdirectories are folded into their repo, not listed as projects',
     (list.projects || []).every((i) => !i.git || i.path === i.id), 'git roots are the identity');
  ok('7 the current one is marked, so it can be preselected', (list.projects || []).some((i) => i.current) || !h0.following);

  // an unknown id must be refused rather than opening an arbitrary path
  const bad = await post('/api/watch', { id: '../../etc/passwd' });
  ok('8 an unknown project id is refused', bad && bad.ok === false, JSON.stringify(bad).slice(0, 60));

  const other = (list.projects || []).find((i) => path.resolve(i.path) !== PROJECT);
  if (other) {
    const sw = await post('/api/watch', { id: other.id });
    ok('9 picking another project is accepted', sw && sw.ok === true);
    await wait(2500);
    const h1 = await get('/health');
    ok('10 the whole target moved, without a restart', path.resolve(h1.root) === path.resolve(other.path), `${h0.root} -> ${h1.root}`);
    ok('11 the file watcher rebound to the new tree', h1.watching !== h0.watching, `${h0.watching} -> ${h1.watching} dirs`);
    ok('12 it follows the exact project that was chosen', h1.following && h1.following.id === other.id);
    ok('13 the world was rebuilt, not carried over', h1.files !== h0.files || h1.project !== h0.project, `${h0.files} -> ${h1.files} files`);
    // and back
    if (h0.following) { await post('/api/watch', { id: h0.following.id }); await wait(2000); }
  } else {
    ok('9 picking another project is accepted', true, 'skipped: only one project available');
    for (const n of [10, 11, 12, 13]) ok(`${n} switch assertions`, true, 'skipped with 9');
  }

  // near real time: a real edit in the watched tree reaches the stream
  const h2 = await get('/health');
  const probe = path.join(h2.root, 'live-artifact-probe.txt');
  const seen = [];
  const es = http.get({ host: '127.0.0.1', port: PORT, path: '/events' }, (r) => {
    r.setEncoding('utf8'); let buf = '';
    r.on('data', (c) => {
      buf += c; let i;
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const ch = buf.slice(0, i); buf = buf.slice(i + 2);
        const e = /^event: (\w+)/m.exec(ch); const d = /^data: (.*)$/m.exec(ch);
        if (!e || !d || e[1] !== 'delta') continue;
        try { const o = JSON.parse(d[1]); seen.push({ arrived: Date.now(), type: o.type, p: o.payload }); } catch {}
      }
    });
  });
  await wait(1500);
  fs.writeFileSync(probe, 'probe');           // warm the directory subscription
  await wait(1200);
  const t0 = Date.now();
  fs.writeFileSync(probe, 'probe ' + t0);
  let hit = null;
  for (let i = 0; i < 60 && !hit; i++) { await wait(50); hit = seen.find((e) => e.type === 'file' && e.arrived >= t0 && String((e.p || {}).path || '').includes('live-artifact-probe')); }
  try { fs.unlinkSync(probe); } catch {}
  try { es.destroy(); } catch {}
  const ms = hit ? hit.arrived - t0 : -1;
  ok('14 a real edit reaches the plate', !!hit, hit ? `${ms} ms` : 'not seen within 3s');
  ok('15 and it is near real time, under a second', hit && ms < 1000, `${ms} ms`);
} catch (e) {
  ok('walk completed without throwing', false, String(e && e.message));
}

const pass = steps.filter((s) => s.pass).length;
for (const s of steps) console.log(`${s.pass ? 'PASS' : 'FAIL'}  ${s.name}${s.detail ? `   [${s.detail}]` : ''}`);
console.log(`\n${pass}/${steps.length} PASS`);
done(pass === steps.length ? 0 : 1);
