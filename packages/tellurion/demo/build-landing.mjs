#!/usr/bin/env node
// Builds the click-through landing page: ONE self-contained HTML file holding the
// finished Lantern demo, opening in rustic light, with no server behind it.
//
// This is the demo you hand to someone who is not standing next to you. record.mjs
// makes a video of the story happening; this makes the thing a person can click.
//
// Usage:
//   node demo/build-landing.mjs                      # -> demo/last-landing/tellurion-demo.html
//   node demo/build-landing.mjs out.html             # somewhere else
//   node demo/build-landing.mjs --skin plate         # the cold register instead
//
// WHY IT ASSEMBLES ITS OWN FIXTURE INSTEAD OF READING demo/project/
// story.mjs writes plan.json, verdicts.json and accepted.json as it plays, so that
// directory holds whatever frame the last run stopped on, and it is committed in
// that state as often as not. Both failure modes were real within one hour:
// a build taken mid-story showed "15 of 30 steps", and a build taken from
// `git show HEAD:` showed 0 of 30 with an empty verdict list, because a commit had
// swept up the story's blank opening. Neither looked broken — an undersold demo
// looks exactly like an honest one.
//
// So the fixture is assembled from the two things the story never touches:
// plan-full.json, the master plan carrying the settled step statuses (22 done, 2
// active, 6 planned), and build-demo.mjs, which derives the sign-off rows from it
// with the same fingerprint function state.mjs checks them against.

import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TEL = path.resolve(HERE, '..');
const REPO = path.resolve(TEL, '..', '..');

const argv = process.argv.slice(2);
const si = argv.indexOf('--skin');
const skin = si >= 0 && argv[si + 1] ? argv[si + 1] : 'rustic';
if (si >= 0) argv.splice(si, 2);
const OUT = argv[0] ? path.resolve(argv[0]) : path.join(HERE, 'last-landing', 'tellurion-demo.html');
const PORT = Number(process.env.PORT || 8831);

const WORK = path.join(HERE, 'last-landing');
const FIX = path.join(WORK, 'fixture');
mkdirSync(path.dirname(OUT), { recursive: true });

// ---------------------------------------------------------------- the fixture
// Every file, every time. A leftover from a previous build is exactly the stale
// half-state this whole script exists to avoid.
rmSync(FIX, { recursive: true, force: true });
mkdirSync(path.join(FIX, 'project', '.tellurion'), { recursive: true });

copyFileSync(path.join(HERE, 'plan-full.json'), path.join(FIX, 'project', '.tellurion', 'plan.json'));
copyFileSync(path.join(HERE, 'project', '.tellurion', 'DEMO-PROJECT'), path.join(FIX, 'project', '.tellurion', 'DEMO-PROJECT'));
copyFileSync(path.join(HERE, 'data', 'world-static.json'), path.join(FIX, 'world-static.json'));

// The judge's rows, the operator's signatures and the bench usage, derived from
// that plan by the same code that writes them for the story. A verdict carries a
// fingerprint of what it signed and state.mjs recomputes it on read, so a row
// assembled any other way reads as STALE and quietly drops a verified feature
// back to claimed.
execFileSync(process.execPath, [path.join(HERE, 'build-demo.mjs'), path.join(FIX, 'project')], { stdio: 'inherit' });

// ---------------------------------------------------------------- the snapshot
// Serve the fixture just long enough to read one world off it. The archive embeds
// what the REAL reducer built, so a broken instrument yields a page that shows it
// broken rather than a page that hides it.
const srv = spawn(process.execPath, [
  path.join(TEL, 'server.mjs'),
  '--project', path.join(FIX, 'project'),
  '--world', path.join(FIX, 'world-static.json'),
  '--story', path.join(HERE, 'crew.mjs'), '--once',
  '--name', 'Lantern', '--port', String(PORT),
], { cwd: TEL, stdio: ['ignore', 'pipe', 'pipe'] });

let log = '';
srv.stdout.on('data', (d) => { log += d; });
srv.stderr.on('data', (d) => { log += d; });
const stop = () => { try { srv.kill(); } catch {} };
process.on('exit', stop);

const api = `http://127.0.0.1:${PORT}/api/world`;
let up = false;
for (let i = 0; i < 60 && !up; i++) {
  await new Promise((r) => setTimeout(r, 250));
  up = await fetch(api).then((r) => r.ok).catch(() => false);
}
if (!up) { stop(); console.error(`build-landing: the server never answered on ${PORT}.\n${log}`); process.exit(1); }

// The crew arrives through the ordinary ingest a moment after boot, so the
// snapshot waits for it. Without this the page is built in the gap and ships with
// an empty sky — which is exactly what it looks like when it is working, so it
// is waited for explicitly rather than slept past.
let crew = 0;
for (let i = 0; i < 40 && crew < 6; i++) {
  await new Promise((r) => setTimeout(r, 250));
  crew = await fetch(api).then((r) => r.json()).then((w) => Object.keys(w.agents || {}).length).catch(() => 0);
}
if (crew < 6) { stop(); console.error(`build-landing: only ${crew} of 6 agents reached the world.\n${log}`); process.exit(1); }
console.log(`build-landing: ${crew} agents on the plate`);

execFileSync(process.execPath, [path.join(TEL, 'bin', 'build-static.mjs'), api, OUT, '--skin', skin], { stdio: 'inherit' });
stop();
