#!/usr/bin/env node
// Live Artifact server.
//
// Read only by design. It carries the TBK entity graph (data/world-static.json),
// watches a project tree, the Claude Code transcripts and git, folds what it sees
// into one world, and streams it.
//
// The browser gets a snapshot once and then event envelopes, and replays them
// through the SAME reducer module the server uses. One set of semantics, not two.

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as W from './lib/state.mjs';
import { scanProject, watchProject, watchSessions, watchGit, sessionDirFor } from './lib/sources.mjs';
import { discoverInstances, readInstance, discoverProjects, gitRootOf } from './lib/instances.mjs';
import { readPlan, writePlan, watchPlan, planPathFor, PlanWriteRefused } from './lib/plan.mjs';
import { draftPlan, reconcileHomes } from './lib/plan-llm.mjs';
import { readUsage, writeUsage } from './lib/usage.mjs';
import { readSignoffs, accept, unaccept, acceptedPathFor, verdictsPathFor, withdrawnPathFor, noteWithdrawals, AcceptRefused, orphanSignoffs } from './lib/signoff.mjs';
import { readWork, writeWork, workPathFor } from './lib/work.mjs';
import { runDemo } from './lib/demo.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Identity, not just liveness. The 2026-08-28 escape: "the instrument is up"
// passed because SOME process answered the port while ours served nothing. A 200
// proves something is answering; pid + version + startedAt prove it is THIS one.
const VERSION = JSON.parse(fs.readFileSync(path.join(HERE, 'package.json'), 'utf8')).version;
const BOOT_AT = Date.now();

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const has = (k) => argv.includes(`--${k}`);

let ROOT = path.resolve(arg('project', process.cwd()));
const PORT = Number(arg('port', process.env.LIVE_ARTIFACT_PORT || 8768));
// Loopback by default. This server can rewrite a project's declared plan, accept
// work in the operator's name, re-point the instrument, and list every project on
// the machine together with the last thing he typed in each one. Reaching the
// network with all of that is a decision, so it is spelled out (--host 0.0.0.0)
// rather than assumed.
const HOST = arg('host', '127.0.0.1');
const LOOPBACK = ['127.0.0.1', 'localhost', '::1'].includes(HOST);

// Exposed to the network, the endpoints that WRITE or that enumerate his work
// carry a key. Reading the world he chose to publish stays open, so a tab he
// already has up keeps rendering. The key is stable across restarts, so the
// link he bookmarked once keeps working.
const KEY_FILE = path.join(os.homedir(), '.tellurion', 'key');
function resolveKey() {
  const given = arg('key', process.env.LIVE_ARTIFACT_KEY || '');
  if (given) return given;
  if (LOOPBACK) return '';
  try { const k = fs.readFileSync(KEY_FILE, 'utf8').trim(); if (k) return k; } catch {}
  const k = crypto.randomBytes(18).toString('base64url');
  try { fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true }); fs.writeFileSync(KEY_FILE, k + '\n', { mode: 0o600 }); } catch {}
  return k;
}
const KEY = resolveKey();
// Every door that carries his WORK, not just the ones that enumerate or write.
// /api/world and /events ship project.following.title — the last thing he typed
// in that project — and the whole prompt ticker, so guarding the picker while
// leaving those open protected the copy and published the original.
// Subpaths ride the same guards: /api/plan/draft and /api/plan/reconcile are as
// mutating, and as guarded, as /api/plan itself.
const GUARDED = /^\/(api\/(projects|instances|watch|plan|accept|world|work)(\/|$)|events)$/;
const MUTATING = /^\/api\/(watch|plan|accept)(\/|$)/;

// A browser will send a simple cross-site POST with no preflight, so any page he
// visits could write to a loopback instrument that trusts loopback. A write must
// come from this instrument's own page, or carry the key.
function sameSite(req) {
  const site = String(req.headers['sec-fetch-site'] || '');
  // "same-site" is NOT enough: two localhost ports are one site, so any page any
  // other local process serves could write to a keyless loopback instrument.
  // The instrument's own page is always same-origin, however it is framed.
  if (site) return site === 'same-origin' || site === 'none';
  const o = req.headers.origin;
  if (!o) return true;                       // curl and the like carry no Origin
  try { return new URL(o).port === String(PORT); } catch { return false; }
}
function authed(req, url) {
  if (!KEY) return true;
  const h = String(req.headers.authorization || '');
  return h === 'Bearer ' + KEY || url.searchParams.get('k') === KEY;
}

// The address this instrument answers on from OTHER machines, so the page can
// carry its own door out: framed in an editor panel it offers "open in a
// browser", and that link must name a host the browser's machine can reach,
// which the loopback or forwarded address it was loaded through never is. A
// loopback-only instrument has no such address; its page keeps the one it was
// loaded from.
function selfUrl() {
  if (LOOPBACK) return '';
  try {
    const j = JSON.parse(execFileSync('tailscale', ['status', '--json'], { timeout: 2500, stdio: ['ignore', 'pipe', 'ignore'] }).toString());
    const name = String(j && j.Self && j.Self.DNSName || '').replace(/\.$/, '');
    if (name) return `http://${name}:${PORT}/`;
  } catch {}
  for (const list of Object.values(os.networkInterfaces())) {
    for (const ni of list || []) {
      if (ni.family === 'IPv4' && !ni.internal && ni.address.startsWith('100.')) return `http://${ni.address}:${PORT}/`;
    }
  }
  return '';
}
const SELF_URL = selfUrl();

let NAME = arg('name', path.basename(ROOT));

if (!fs.existsSync(ROOT)) { console.error(`live-artifact: no such project: ${ROOT}`); process.exit(1); }

const OCC_ROOT = path.dirname(HERE);
// An explicit --genesis / --universe is a DECISION, so it outlives a switch.
// Recomputing the mode from the path on every retarget silently threw the
// operator's own flag away the first time he changed project.
const MODE_FLAG = has('genesis') ? 'genesis' : has('universe') ? 'universe' : null;
const modeFor = (root) => (MODE_FLAG ? MODE_FLAG === 'genesis' : path.resolve(root) !== OCC_ROOT);
let GENESIS = modeFor(ROOT);
const baked = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'world-static.json'), 'utf8'));
const stat = GENESIS
  ? { genesis: true, planets: [], features: [], milestones: [], tools: baked.tools, processes: baked.processes, workflows: baked.workflows, attribution: [] }
  : baked;
let world = W.createWorld(NAME, ROOT, stat);
world.project.startedAt = Date.now();
world.project.genesis = GENESIS;
if (SELF_URL) world.url = SELF_URL;
W.applyPlan(world, readPlan(ROOT), readSignoffs(ROOT));
const clients = new Set();

/* ------------------------------------------------------------ broadcast */

function emit(type, payload) {
  const frame = `event: delta\ndata: ${JSON.stringify({ type, payload, at: Date.now() })}\n\n`;
  for (const res of clients) { try { res.write(frame); } catch {} }
}

/* ------------------------------------------------------------- ingestion */

let started = false;

function ingestFile({ rel, bytes = 0, created = false, removed = false, at = Date.now() }) {
  if (removed) return;
  W.applyFile(world, { path: rel, bytes, created, at });
  if (world.activeStep) workDirty = true;
  if (started) emit('file', { path: rel, created, at });
}

function ingestRecord(rec) {
  const at = rec.at || Date.now();
  // A watcher tags the records from its first backlog drain with `seeding`:
  // history, not live work. The reducer still builds the graph, the attribution
  // record and the usage counts from them, but the ticker and the drive gauge
  // stay dark (both claim "now"), and nothing is emitted — a late sweep attach
  // would otherwise stream hours-old rows to every connected page as live
  // deltas. This is the session feed's half of what `pre` already does for git.
  const quiet = !!rec.seeding;
  const prevQuiet = world.quiet;
  if (quiet) world.quiet = true;
  const live = () => started && !quiet;
  try {
  switch (rec.kind) {
    case 'todos': {
      W.applyTodos(world, { todos: rec.todos, at });
      if (live()) emit('todos', { todos: rec.todos, at });
      break;
    }
    case 'write': {
      const rel = relOf(rec.file) || String(rec.file || '');
      if (!rel) break;
      W.applyFile(world, { path: rel, created: !!rec.created, at });
      if (live()) emit('file', { path: rel, created: !!rec.created, at });
      break;
    }
    case 'tool': {
      W.applyTool(world, { name: rec.name, input: rec.input, at });
      if (live()) emit('tool', { name: rec.name, input: slim(rec.name, rec.input), at });
      break;
    }
    case 'fault': {
      W.applyFault(world, { label: rec.label, detail: rec.detail, at });
      if (live()) emit('fault', { label: rec.label, detail: rec.detail, at });
      break;
    }
    case 'prompt': {
      W.applyPrompt(world, { text: rec.text, at });
      if (live()) emit('prompt', { text: String(rec.text || '').replace(/\s+/g, ' ').slice(0, 180), at });
      break;
    }
    case 'commit': {
      W.applyCommit(world, { sha: rec.sha, subject: rec.subject, at, pre: false });
      if (live()) emit('commit', { sha: rec.sha, subject: rec.subject, at, pre: false });
      break;
    }
  }
  } finally {
    if (quiet) { if (prevQuiet === undefined) delete world.quiet; else world.quiet = prevQuiet; }
  }
}

// Tool inputs can be enormous (a Write payload, a long Bash script). Only the
// fields attribution actually reads cross the wire.
const KEEP = ['skill', 'args', 'subagent_type', 'description', 'command', 'file_path', 'pattern', 'path', 'query', 'url', 'name', 'title'];
function slim(name, input = {}) {
  const o = {};
  for (const k of KEEP) if (input[k] != null) o[k] = String(input[k]).slice(0, 200);
  return o;
}

const relOf = (abs) => {
  if (!abs) return '';
  const r = path.relative(ROOT, String(abs));
  return !r || r.startsWith('..') || path.isAbsolute(r) ? '' : r.split(path.sep).join('/');
};

/* ----------------------------------------------------------------- boot */

// Demo mode REPLACES the live feeds rather than joining them, so the fixture
// the acceptance walk asserts against stays deterministic.
const DEMO = has('demo');
world.project.demo = DEMO;

// Every live feed for the current target, held so the whole set can be torn
// down and rebuilt when you point this at a different editor window.
let bound = { sessions: null, files: null, git: null, plan: null, signoff: null, scanMs: 0, watching: 0, fileCount: 0, sessionDirs: [] };
let following = null;   // the project being followed, or null before boot resolves one

const SESSION_SWEEP_MS = Number(process.env.LIVE_ARTIFACT_SWEEP_MS || 15_000);

// Which project is this, as discovery sees it. Discovery only knows a project
// once a chat has been opened on it, so this legitimately returns null on a
// brand new repo and has to be asked again later.
const DISCOVER_TTL = 4000;
const discoverCache = new Map();
function cachedDiscover(opts) {
  const k = JSON.stringify(opts);
  const hit = discoverCache.get(k);
  if (hit && Date.now() - hit.at < DISCOVER_TTL) return hit.v;
  const v = discoverProjects(opts);
  discoverCache.set(k, { at: Date.now(), v });
  return v;
}

function resolveFollowing() {
  try {
    const root = gitRootOf(ROOT);
    return cachedDiscover({ max: 200 }).find((pr) => pr.path === root) || null;
  } catch { return null; }
}

function sessionDirsFor(proj) {
  const dirs = new Set();
  for (const cwd of (proj && proj.cwds && proj.cwds.length ? proj.cwds : [ROOT])) {
    const d = sessionDirFor(cwd);
    if (fs.existsSync(d)) dirs.add(d);
  }
  return [...dirs];
}

function unbind() {
  for (const k of ['sessions', 'files', 'git', 'plan', 'signoff']) {
    const h = bound[k];
    if (h && typeof h.close === 'function') { try { h.close(); } catch {} }
    bound[k] = null;
  }
}

// The attribution record survives a restart now. It used to live only in memory,
// so every restart erased which files were written while a step was in hand —
// and that record is the only honest way to answer which step a judge's receipt
// belongs to.
let workDirty = false;
function persistWork() {
  if (DEMO) return;
  if (workDirty) { workDirty = false; try { writeWork(ROOT, world.stepWork); } catch {} }
  // Bench usage rides the same timer. Without persistence the "only what you
  // use" filter would forget everything on restart and empty the belt.
  // One flag, set by the reducer where the pulse actually happens. A second
  // module-level copy here would drift the moment either side was edited.
  if (world.usageDirty) { world.usageDirty = false; try { writeUsage(ROOT, world.usage); } catch {} }
}

function bind() {
  const t0 = Date.now();
  const scan = scanProject(ROOT);
  if (!DEMO) { try { world.stepWork = { ...readWork(ROOT), ...world.stepWork }; } catch {} }
  if (!DEMO) { try { world.usage = { ...readUsage(ROOT), ...(world.usage || {}) }; } catch {} }
  bound.scanMs = Date.now() - t0;
  bound.fileCount = scan.files.length;

  if (!DEMO) {
    // Every editor session on this project feeds it, because a chat is a
    // fragment and the project is the thing with a story. Following one
    // transcript would bind the instrument to an arbitrary slice of it.
    //
    // And the set is RE-RESOLVED on a sweep rather than decided once. A brand
    // new project has no transcript directory at boot because no chat has ever
    // been opened on it, so binding once left the editor feed — the headline
    // capability — silently dead for the whole life of that project, with
    // nothing on screen saying so.
    const handles = new Map();
    const attach = (d) => { if (!handles.has(d)) handles.set(d, watchSessions(d, ingestRecord, { maxFiles: 6 })); };
    for (const d of sessionDirsFor(following)) attach(d);
    bound.sessionDirs = [...handles.keys()];
    const sweep = setInterval(() => {
      if (!following) {
        const f = resolveFollowing();
        if (f) { following = f; world.project.following = publicInstance(f); if (started) pushWorld(); }
      }
      let added = 0;
      for (const d of sessionDirsFor(following)) if (!handles.has(d)) { attach(d); added++; }
      if (added) { bound.sessionDirs = [...handles.keys()]; if (started) pushWorld(); }
    }, SESSION_SWEEP_MS);
    sweep.unref?.();
    bound.sessions = { sweep, get count() { return handles.size; }, close() { clearInterval(sweep); for (const h of handles.values()) { try { h.close(); } catch {} } handles.clear(); } };
    // The plan is the one thing here a person writes by hand, so it answers to
    // the hand: editing plan.json in the editor moves the spine with no reload.
    // The judge writes verdicts.json and the operator writes accepted.json.
    // Both move the plate the moment they change, so a Sentinel pass appears
    // without anyone reloading anything.
    const soFiles = [verdictsPathFor(ROOT), acceptedPathFor(ROOT), withdrawnPathFor(ROOT)];
    const soHandles = soFiles.map((f) => watchPlan(ROOT, () => {
      refreshPlan();
      if (started) pushWorld();
    }, { pollMs: 1200, file: f }));
    bound.signoff = { close() { for (const h of soHandles) { try { h.close(); } catch {} } } };
    bound.plan = watchPlan(ROOT, (pl) => {
      refreshPlan();
      if (started) {
        // The graph changed, not just a count: the plan declares the bodies, so
        // a rename in the file renames the moon. Clients get a fresh snapshot
        // rather than a delta they would have to reconcile by hand.
        W.decayDrive(world, Date.now());
        const frame = `event: snapshot\ndata: ${JSON.stringify(world)}\n\n`;
        for (const res of clients) { try { res.write(frame); } catch {} }
        emit('plan', { totals: pl.totals, exists: pl.exists, error: pl.error || null });
      }
    });
    const gitRoot = ROOT;
    bound.git = watchGit(gitRoot, (g) => onGit(g, gitRoot));
    bound.files = watchProject(ROOT, ingestFile);
    bound.watching = bound.files && bound.files.watching ? bound.files.watching : scan.dirs.length;
  }
  return scan;
}

function onGit({ branch, head, commits }, forRoot = null) {
  // A poll started before a switch used to land afterwards, filing the previous
  // repository's commit into the new project's record.
  if (forRoot && forRoot !== ROOT) return;
  world.project.branch = branch;
  world.project.head = head;
  const horizon = world.project.startedAt - 48 * 3600_000;
  for (const c of commits.slice().reverse()) {
    if (!c.sha || c.at < horizon) continue;
    const pre = c.at < world.project.startedAt;
    const entity = W.applyCommit(world, { sha: c.sha, subject: c.subject, at: c.at, pre });
    if (world.activeStep) workDirty = true;
    if (entity !== null && started) emit('commit', { sha: c.sha, subject: c.subject, at: c.at, pre });
  }
}

// Point every feed at a different editor window, without a restart. The world
// is rebuilt from scratch on purpose: carrying the previous project's bodies
// across would show you a sky that never existed.
function refreshPlan() {
  const pl = readPlan(ROOT);
  let sos = readSignoffs(ROOT);
  // Record the moment a claim is taken back on something already accepted. It is
  // observed here because it is a fact about history that no file can carry: the
  // step's id and wording are identical either side of the flip.
  const pulled = (pl.phases || []).flatMap((ph) => ph.steps || [])
    .filter((st) => st.status !== 'done' && sos.accepted.has(st.id))
    .map((st) => st.id);
  if (pulled.length && noteWithdrawals(ROOT, pulled)) sos = readSignoffs(ROOT);
  W.applyPlan(world, pl, sos);
  world.plan.orphans = orphanSignoffs(pl, sos);
  return pl;
}

// Deterministic connection check (ADR-0134, T4), run on every plan write so the
// panel can answer "does the spine still connect to the project?" without a
// model. Per product: the declared home exists in the repo, else a distinctive
// name word matches a top-level entry, else unmatched (LLM proposals come from
// /api/plan/reconcile and only ever fill that last bucket).
function planConnections(plan) {
  let top = [];
  try {
    top = fs.readdirSync(ROOT, { withFileTypes: true })
      .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules')
      .map((e) => e.name.toLowerCase() + (e.isDirectory() ? '/' : ''));
  } catch {}
  const exists = (rel) => {
    try { return fs.existsSync(path.join(ROOT, String(rel))); } catch { return false; }
  };
  return (plan.products || []).map((p) => {
    const home = String(p.home || '').replace(/\\/g, '/').replace(/^\.+\//, '').replace(/\/+$/, '');
    if (home && exists(home)) return { product: { id: p.id, name: p.name, note: p.note }, matched: true, via: 'home', home };
    const words = String(p.name || '').toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const hit = top.find((e) => words.some((w) => e.includes(w)));
    if (hit) return { product: { id: p.id, name: p.name, note: p.note }, matched: true, via: 'name', home: null, entry: hit };
    return { product: { id: p.id, name: p.name, note: p.note }, matched: false, home: home || null };
  });
}


function pushWorld() {
  W.decayDrive(world, Date.now());
  const frame = `event: snapshot\ndata: ${JSON.stringify(world)}\n\n`;
  for (const res of clients) { try { res.write(frame); } catch {} }
}

function retarget(proj) {
  unbind();
  started = false;
  following = proj;
  ROOT = proj.path;
  NAME = proj.name || path.basename(proj.path);
  GENESIS = modeFor(ROOT);
  const nextStat = GENESIS
    ? { genesis: true, planets: [], features: [], milestones: [], tools: baked.tools, processes: baked.processes, workflows: baked.workflows, attribution: [] }
    : baked;
  world = W.createWorld(NAME, ROOT, nextStat);
  world.project.startedAt = Date.now();
  world.project.demo = DEMO;
  world.project.genesis = GENESIS;
  // The door out survives the switch. Boot sets this on the first world; a
  // retarget built a fresh one without it, and the page's Browser link fell
  // back to the address it was loaded through — which, framed in an editor
  // panel on another machine, is one the browser's machine cannot reach.
  if (SELF_URL) world.url = SELF_URL;
  W.applyPlan(world, readPlan(ROOT), readSignoffs(ROOT));
  world.project.following = publicInstance(proj);
  bind();
  started = true;
  W.decayDrive(world, Date.now());
  const frame = `event: snapshot\ndata: ${JSON.stringify(world)}\n\n`;
  for (const res of clients) { try { res.write(frame); } catch {} }
  emit('retarget', { to: publicInstance(proj) });
  return world.project.following;
}

const publicInstance = (p) => p && ({
  id: p.id, path: p.path, name: p.name, project: p.name, branch: p.branch,
  surfaces: p.surfaces || [], sessions: p.sessions || 0, liveSessions: p.liveSessions || 0,
  title: p.title, lastAt: p.lastAt, live: p.live, git: !!p.git,
});

// Boot already following something: the most recent window open on this
// project. Without this the bar says "choose a window" while the tail is in
// fact draining four transcripts at once, which is both a wrong label and a
// mixed signal.
if (!DEMO) {
  const mine = resolveFollowing();
  if (mine) { following = mine; world.project.following = publicInstance(mine); }
}

const scan = bind();
if (DEMO) runDemo((rec) => ingestRecord(rec), { speed: Number(arg('speed', 6)) });
const scanMs = bound.scanMs;
const watcher = { get watching() { return bound.watching; }, close: unbind };
started = true;

setInterval(() => { const now = Date.now(); W.decayDrive(world, now); W.prune(world, now); }, 2000).unref?.();
setInterval(persistWork, 5000).unref?.();

/* ----------------------------------------------------------------- http */

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };

const serveFile = (res, abs) => {
  fs.readFile(abs, (err, buf) => {
    if (err) { res.writeHead(404, { 'content-type': 'text/plain' }); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(abs)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(buf);
  });
};

const server = http.createServer((req, res) => {
  // A Host header is attacker-controlled text and URL() throws on a bad one, so
  // this line used to take the whole instrument down on a single unauthenticated
  // request. It parses against a fixed base instead: nothing here reads the host.
  let url;
  try { url = new URL(req.url, 'http://tellurion.local'); }
  catch { res.writeHead(400, { 'content-type': 'text/plain' }); return res.end('bad request'); }
  const p = url.pathname;

  // NOT excused by authed(): on loopback there is no key, so authed() answers
  // true for everyone and the check never fired. Only a request carrying a REAL
  // key may skip the origin test.
  if (MUTATING.test(p) && req.method === 'POST' && !sameSite(req) && !(KEY && authed(req, url))) {
    res.writeHead(403, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: 'a write has to come from this instrument\'s own page' }));
  }
  if (GUARDED.test(p) && !authed(req, url)) {
    res.writeHead(401, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ ok: false, error: 'this instrument is on the network, so writing to it needs its key. Open the link the server printed at boot, once.' }));
  }




  // The top tier is a person putting their name to something, so it is its own
  // deliberate act with its own file. It cannot be reached by editing the plan.
  if (p === '/api/accept' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 8000) req.destroy(); });
    req.on('end', () => {
      let want = {};
      try { want = JSON.parse(body || '{}'); } catch {}
      try {
        const sos = readSignoffs(ROOT);
        if (want.undo) unaccept(ROOT, String(want.step || ''));
        else accept(ROOT, {
          step: String(want.step || ''), by: String(want.by || ''), note: want.note,
          force: want.force === true, plan: readPlan(ROOT), verdicts: sos.verdicts,
        });
        refreshPlan();
        pushWorld();
        // Say what tier it actually reached, so a request that changed nothing
        // can never come back looking like one that changed something.
        // Custody is addressed to a feature now, and to a step for anything
        // signed before that. The answer has to look up both or a successful
        // acceptance comes back reporting tier:null, which reads as a no-op.
        const wantId = String(want.step || '');
        const f = (world.stat.features || []).find((x) => x.id === 'feat:' + wantId)
          || (world.stat.features || []).find((x) => x.id === 'step:' + wantId);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, step: String(want.step || ''), tier: f ? f.status : null, signedBy: f ? f.signedBy : null, accepted: acceptedPathFor(ROOT) }));
      } catch (e) {
        const code = e instanceof AcceptRefused ? e.code : null;
        res.writeHead(code === 'unknown-step' ? 404 : code ? 409 : 400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, code, error: String(e && e.message).slice(0, 300) }));
      }
    });
    return;
  }

  // The declared plan for the project being followed. Editable here or by hand
  // in the repo; both write the same file.
  if (p === '/api/plan' && req.method === 'GET') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' });
    return res.end(JSON.stringify({ ...readPlan(ROOT), root: ROOT, path: planPathFor(ROOT) }));
  }
  if (p === '/api/plan' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 400_000) req.destroy(); });
    req.on('end', () => {
      let want;
      try { want = JSON.parse(body || '{}'); } catch {
        res.writeHead(400, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'body is not valid JSON' }));
      }
      try {
        const saved = writePlan(ROOT, want, { force: want.force === true });
        refreshPlan();
        emit('plan', { totals: saved.totals, exists: saved.exists, error: saved.error || null });
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, plan: saved, path: planPathFor(ROOT), connections: planConnections(saved) }));
      } catch (e) {
        const refused = e instanceof PlanWriteRefused;
        res.writeHead(refused ? 409 : 500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e && e.message).slice(0, 240) }));
      }
    });
    return;
  }

  // Initialize (ADR-0134, T1): the project's OWN harness drafts the plan from
  // the repo it is sitting in and writes the plan file itself. The click must
  // not hang on a careful read (measured 2026-08-29: ~40 s for the harness to
  // boot and answer one word; minutes for a real read), so the route answers
  // immediately and the FILE LANDING is the success signal: the watcher and
  // this refresh lift it onto the plate, and the state rides the snapshot as
  // world.project.draft. Refused when a real plan already exists unless the
  // caller sends force:true — a draft must never pave a declaration.
  if (p === '/api/plan/draft' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 8000) req.destroy(); });
    req.on('end', () => {
      let want = {};
      try { want = JSON.parse(body || '{}'); } catch {}
      const prev = readPlan(ROOT);
      if (prev.exists && !prev.error && prev.totals.steps > 0 && want.force !== true) {
        res.writeHead(409, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: `a plan with ${prev.totals.steps} steps already exists; send force:true to replace it with a draft` }));
      }
      if (world.project.draft && world.project.draft.state === 'running') {
        res.writeHead(409, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'a draft is already running for this project' }));
      }
      world.project.draft = { state: 'running', at: new Date().toISOString() };
      pushWorld();
      res.writeHead(202, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, started: true }));
      (async () => {
        let spawnError = null;
        try { await draftPlan(ROOT); } catch (e) { spawnError = String(e && e.message).slice(0, 300); }
        const saved = refreshPlan();
        // Judge by what READS, not by how the spawn ended: a harness that wrote
        // the file and then idled into the timeout still drafted the plan.
        if (saved.exists && !saved.error && saved.totals.steps > 0) {
          world.project.draft = { state: 'done', at: new Date().toISOString(), steps: saved.totals.steps, products: saved.totals.products };
        } else {
          world.project.draft = { state: 'failed', at: new Date().toISOString(), error: saved.error || spawnError || 'the harness finished but wrote no plan' };
        }
        emit('plan', { totals: saved.totals, exists: saved.exists, error: saved.error || null });
        pushWorld();
      })();
    });
    return;
  }

  // Reconcile (ADR-0134, T4): propose a real repo path as the `home` of every
  // product the deterministic matcher could not connect. Proposals only; the
  // panel shows them and the operator accepts. Nothing is written here.
  if (p === '/api/plan/reconcile' && req.method === 'POST') {
    req.on('data', () => {});
    req.on('end', async () => {
      try {
        const plan = readPlan(ROOT);
        const unmatched = planConnections(plan).filter((c) => !c.matched).map((c) => c.product);
        if (!unmatched.length) {
          res.writeHead(200, { 'content-type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, proposals: [], note: 'every declared product is already connected' }));
        }
        const proposals = await reconcileHomes(ROOT, plan, unmatched);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, proposals }));
      } catch (e) {
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e && e.message).slice(0, 240) }));
      }
    });
    return;
  }

  // Discovery walks the transcript tree synchronously, so a burst of calls used
  // to block the event loop and freeze the live screen for seconds. One short
  // cache turns a flood into a single walk; it is well under the time it takes a
  // person to open the picker twice.
  // Which PROJECTS could this follow. A project is a codebase, and it carries
  // every editor session on it: chats are fragments, the project has the story.
  if (p === '/api/projects' || p === '/api/instances') {
    const list = cachedDiscover({
      windowMs: Number(url.searchParams.get('windowMs') || 30 * 24 * 3600_000),
      max: Number(url.searchParams.get('max') || 40),
    }).map((pr) => ({
      id: pr.id, path: pr.path, name: pr.name, branch: pr.branch, git: pr.git,
      surfaces: pr.surfaces, sessions: pr.sessions, liveSessions: pr.liveSessions, dirs: pr.dirs,
      title: pr.title, lastAt: pr.lastAt, ageMs: pr.ageMs, live: pr.live,
      current: !!(world.project.following && world.project.following.id === pr.id),
    }));
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' });
    return res.end(JSON.stringify({ projects: list, instances: list, following: world.project.following || null, root: ROOT }));
  }

  // Follow one of them. The id is a path, and it is matched against what
  // discovery just returned, so a caller can never hand us an arbitrary one.
  if (p === '/api/watch' && req.method === 'POST') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 4000) req.destroy(); });
    req.on('end', () => {
      let want = {};
      try { want = JSON.parse(body || '{}'); } catch {}
      const id = String(want.id || want.project || want.path || '');
      const found = cachedDiscover({ windowMs: 365 * 24 * 3600_000, max: 500 }).find((pr) => pr.id === id);
      if (!found) {
        res.writeHead(404, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'no such project' }));
      }
      // A throw here (an unreadable target, a watcher that cannot attach) used
      // to escape the handler entirely — no answer for the caller, and the
      // process at the mercy of whatever the runtime does with it.
      try {
        const following = retarget(found);
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: true, following }));
      } catch (e) {
        console.error(`live-artifact: retarget to ${found.path} failed:`, e);
        res.writeHead(500, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e && e.message).slice(0, 240) }));
      }
    });
    return;
  }

  // The attribution record, and what a judge's receipt would map onto. Read only.
  if (p === '/api/work') {
    res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' });
    return res.end(JSON.stringify({ root: ROOT, file: workPathFor(ROOT), activeStep: world.activeStep, work: world.stepWork }));
  }

  // A minimal, CORS-open identity card. The VS Code panel's wrapper page probes
  // it before framing (its origin is vscode-webview://…, so a plain /health
  // fetch is CORS-blocked, which would read as "unreachable" beside a healthy
  // server). It carries NOTHING sensitive on purpose: /health stays CORS-closed
  // because it exposes the last thing he typed, and any web page he visits could
  // read it if it were not.
  if (p === '/api/identity') {
    res.writeHead(200, { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'cache-control': 'no-cache' });
    return res.end(JSON.stringify({ ok: true, instrument: 'tellurion', project: NAME, root: ROOT, pid: process.pid, version: VERSION, startedAt: BOOT_AT }));
  }

  if (p === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true, project: NAME, root: ROOT, pid: process.pid, version: VERSION, startedAt: BOOT_AT,
      mode: GENESIS ? 'genesis' : 'universe', scanMs: bound.scanMs, files: bound.fileCount,
      watching: watcher.watching,
      // The handle now always exists (it carries the sweep), so its presence
      // proves nothing. What matters is whether anything is actually being
      // tailed, and a new project legitimately answers zero.
      sessions: !!(bound.sessions && bound.sessions.count),
      transcriptDirs: bound.sessionDirs || [],
      plan: world.plan ? { exists: world.plan.exists, ...world.plan.totals, error: world.plan.error || null } : null,
      followingOne: !!following,
      following: world.project.following || null,
      // Read from the LIVE world, never the boot-time `stat` const: that const is
      // never reassigned on a retarget, so /health went on describing a target
      // the instrument had already left.
      entities: {
        planets: world.stat.planets.length, features: world.stat.features.length, tools: world.stat.tools.length,
        processes: world.stat.processes.length, workflows: world.stat.workflows.length, milestones: world.stat.milestones.length,
      },
      sessionCount: bound.sessions ? bound.sessions.count : 0,
      url: SELF_URL || null,
    }));
  }

  if (p === '/api/world') { W.decayDrive(world, Date.now()); world.agentList = W.agentList(world, Date.now()); res.writeHead(200, { 'content-type': 'application/json', 'cache-control': 'no-cache' }); return res.end(JSON.stringify(world)); }

  if (p === '/events') {
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
    W.decayDrive(world, Date.now());
    world.agentList = W.agentList(world, Date.now());
    res.write(`event: snapshot\ndata: ${JSON.stringify(world)}\n\n`);
    clients.add(res);
    const hb = setInterval(() => { try { res.write(`: hb ${Date.now()}\n\n`); } catch {} }, 15_000);
    req.on('close', () => { clearInterval(hb); clients.delete(res); });
    return;
  }

  // Static: the browser imports lib/*.mjs directly so it runs the same reducer.
  let file = p === '/' ? '/public/index.html' : p;
  if (!file.startsWith('/public/') && !file.startsWith('/lib/') && !file.startsWith('/data/')) file = '/public' + file;
  const abs = path.join(HERE, path.normalize(file).replace(/^(\.\.[/\\])+/, ''));
  if (!abs.startsWith(HERE)) { res.writeHead(403); return res.end('no'); }
  serveFile(res, abs);
});

server.listen(PORT, HOST, () => {
  console.log(`tellurion  project=${NAME}  root=${ROOT}  mode=${GENESIS ? 'genesis' : 'universe'}${DEMO ? '  [demo]' : ''}`);
  console.log(`               entities: ${stat.planets.length} planets, ${stat.features.length} features, ${stat.tools.length} tools, ${stat.processes.length} processes, ${stat.workflows.length} workflows, ${stat.milestones.length} milestones`);
  console.log(`               scanned ${scan.files.length} files in ${scanMs}ms, watching ${watcher.watching} directories`);
  const nDirs = (bound.sessionDirs || []).length;
  console.log(`               transcripts: ${DEMO ? 'demo mode' : nDirs ? `${nDirs} session dir(s) for this project` : `none yet — re-checking every ${Math.round(SESSION_SWEEP_MS / 1000)}s`}`);
  console.log(`               http://${HOST}:${PORT}${KEY ? `/?k=${KEY}` : ''}`);
  if (KEY) console.log(`               key required for writes (stored at ${KEY_FILE}); open the link above once and the page keeps it`);
});

// An open event-stream keeps the socket alive forever, so server.close() waited
// on a browser tab that was never going to disconnect and the process outlived
// every stop and restart. The streams are ended first, and a short hard deadline
// covers whatever else is holding a socket.
function shutdown() {
  persistWork();
  watcher.close();
  for (const res of clients) { try { res.end(); } catch {} }
  clients.clear();
  server.closeAllConnections?.();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1500).unref?.();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
