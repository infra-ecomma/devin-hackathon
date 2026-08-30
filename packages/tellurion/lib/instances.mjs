// Discovery of the editor instances you could point this at.
//
// A "instance" here is one Claude Code session, because that is the thing that
// actually has a cwd, a branch and a live tail. The transcript says which
// surface it belongs to in its own `entrypoint` field: `claude-vscode` is a VS
// Code window, `claude-desktop` is the desktop app, anything else is a terminal.
//
// Read only, and cheap on purpose: a head read for identity, a tail read for
// what it is doing now. Never the whole file, which can be tens of megabytes.

import fs from 'node:fs';
import path from 'node:path';

const HEAD_BYTES = 24_000;
const TAIL_BYTES = 64_000;
const MAX_BACK_BYTES = 900_000;   // cap the backwards walk; a picker row is not worth more

const readChunk = (file, from, len) => {
  let fd;
  try {
    fd = fs.openSync(file, 'r');
    const n = Math.max(0, len);
    const buf = Buffer.allocUnsafe(n);
    const got = fs.readSync(fd, buf, 0, n, from);
    return buf.subarray(0, got).toString('utf8');
  } catch { return ''; }
  finally { if (fd != null) try { fs.closeSync(fd); } catch {} }
};

const lines = (text) => text.split('\n').filter((l) => l.trim());

function parseEach(text, fn) {
  for (const l of lines(text)) {
    let o; try { o = JSON.parse(l); } catch { continue; }
    fn(o);
  }
}

// The last human turn, which is the only label that makes a session
// recognisable to the person who was sitting in it. Claude Code delivers hook
// output, system reminders and injected context as "user" turns too, so the
// human's own words have to be separated out rather than the whole turn thrown
// away: the first text block is what they typed, everything appended after it
// is machinery.
const STRIP = [
  /<system-reminder>[\s\S]*?<\/system-reminder>/gi,
  /<[^>]{1,80}>/g,
];

const clean = (s) => {
  let t = String(s || '');
  for (const re of STRIP) t = t.replace(re, ' ');
  return t.replace(/\s+/g, ' ').trim();
};

// Whole turns that are machinery rather than speech, judged AFTER stripping.
const MACHINE = /^(stop hook feedback|\[image|\[request interrupted|caveat:|the user sent a new message|this is how claude code surfaces|another claude session sent|\[[a-z-]+ honesty check\]|\[verification-gate\])/i;
const isHumanTurn = (t) => t.length >= 3 && !MACHINE.test(t) && !/toolu_[A-Za-z0-9]{10}/.test(t);

function humanText(o) {
  const m = o && o.message;
  if (!m || m.role !== 'user') return '';
  const c = m.content;
  if (typeof c === 'string') return clean(c);
  if (!Array.isArray(c)) return '';
  // The first text block is what the person typed; later blocks are appended context.
  const t = c.find((x) => x && x.type === 'text' && typeof x.text === 'string');
  return t ? clean(t.text) : '';
}

export function readInstance(file) {
  let st;
  try { st = fs.statSync(file); } catch { return null; }
  if (!st.isFile() || st.size === 0) return null;

  const inst = {
    id: path.basename(file, '.jsonl'),
    file,
    bytes: st.size,
    lastAt: st.mtimeMs,
    entrypoint: '', cwd: '', branch: '', version: '', title: '',
  };

  parseEach(readChunk(file, 0, Math.min(HEAD_BYTES, st.size)), (o) => {
    if (o.entrypoint && !inst.entrypoint) inst.entrypoint = String(o.entrypoint);
    if (o.cwd && !inst.cwd) inst.cwd = String(o.cwd);
    if (o.version && !inst.version) inst.version = String(o.version);
    if (o.gitBranch) inst.branch = String(o.gitBranch);
  });

  // Walk backwards in chunks until a human turn turns up. A busy session can
  // put tens of thousands of tool records between two things the person said,
  // so a single fixed tail read finds nothing and the row renders unlabelled.
  let scanned = 0;
  while (scanned < MAX_BACK_BYTES && scanned < st.size) {
    const want = Math.min(TAIL_BYTES, st.size - scanned);
    const from = Math.max(0, st.size - scanned - want);
    const text = readChunk(file, from, st.size - scanned - from);
    scanned = st.size - from;
    parseEach(text, (o) => {
      if (o.entrypoint) inst.entrypoint = String(o.entrypoint);
      if (o.cwd) inst.cwd = String(o.cwd);
      if (o.gitBranch) inst.branch = String(o.gitBranch);
      if (o.timestamp) { const t = Date.parse(o.timestamp); if (t) inst.lastAt = Math.max(inst.lastAt, t); }
      const u = humanText(o);
      if (u && isHumanTurn(u)) inst.title = u.slice(0, 120);
    });
    if (inst.title) break;
    if (from === 0) break;
  }

  if (!inst.cwd) return null;                       // no working directory, nothing to watch
  if (!fs.existsSync(inst.cwd)) return null;        // the folder is gone
  inst.project = path.basename(inst.cwd);
  inst.surface = inst.entrypoint === 'claude-vscode' ? 'vscode'
               : inst.entrypoint === 'claude-desktop' ? 'desktop'
               : 'terminal';
  return inst;
}

export function discoverInstances({
  home = process.env.HOME,
  windowMs = 24 * 3600_000,
  liveMs = 6 * 60_000,
  max = 40,
} = {}) {
  const base = path.join(home, '.claude', 'projects');
  let dirs = [];
  try { dirs = fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()); } catch { return []; }

  const now = Date.now();
  const cands = [];
  for (const d of dirs) {
    const dir = path.join(base, d.name);
    let names = [];
    try { names = fs.readdirSync(dir).filter((n) => n.endsWith('.jsonl')); } catch { continue; }
    for (const n of names) {
      const p = path.join(dir, n);
      let m = 0;
      try { m = fs.statSync(p).mtimeMs; } catch { continue; }
      if (now - m > windowMs) continue;
      cands.push({ p, m });
    }
  }
  cands.sort((a, b) => b.m - a.m);

  const out = [];
  for (const c of cands.slice(0, max * 2)) {
    const inst = readInstance(c.p);
    if (!inst) continue;
    inst.ageMs = Math.max(0, now - inst.lastAt);
    inst.live = inst.ageMs < liveMs;
    out.push(inst);
    if (out.length >= max) break;
  }
  // Live first, then most recent. A live window is what you are sitting in.
  out.sort((a, b) => (b.live - a.live) || (b.lastAt - a.lastAt));
  return out;
}

/* ------------------------------------------------------------- projects */

// The thing worth following is the PROJECT, not one chat.
//
// A chat is a fragment: it opens, it does a piece of work, it ends, and the
// next one continues the same codebase. Binding the instrument to a single
// transcript therefore binds it to an arbitrary slice of the story and loses
// the rest. A project is what has a beginning, a middle and a shape.
//
// So a project here is a codebase path, and it carries EVERY recent editor
// session on it. The sessions are detail inside the project, never the unit of
// choice.

// A codebase is a repository, not whatever directory a chat happened to open
// in. Without this, `Ecomma Agent/Maximus-Desktop/agent-host/stakeholders`
// becomes its own "project" and the real one is split into pieces.
export function gitRootOf(dir) {
  let cur = path.resolve(dir);
  for (let i = 0; i < 24; i++) {
    try { if (fs.existsSync(path.join(cur, '.git'))) return cur; } catch {}
    const up = path.dirname(cur);
    if (!up || up === cur) break;
    cur = up;
  }
  return path.resolve(dir);   // not in a repo: the directory is the project
}

export function discoverProjects(opts = {}) {
  const {
    windowMs = 30 * 24 * 3600_000,   // a project you touched last week is still a project
    liveMs = 6 * 60_000,
    max = 40,
  } = opts;

  const sessions = discoverInstances({ ...opts, windowMs, liveMs, max: 400 });
  const byPath = new Map();

  for (const s of sessions) {
    const key = gitRootOf(s.cwd);
    let p = byPath.get(key);
    if (!p) {
      p = {
        id: key,                       // the path IS the identity: stable across chats
        path: key,
        name: path.basename(key),
        branch: s.branch,
        surfaces: new Set(),
        sessions: 0,
        liveSessions: 0,
        lastAt: 0,
        title: '',
        git: fs.existsSync(path.join(key, '.git')),
        dirs: new Set(),
      };
      byPath.set(key, p);
    }
    p.sessions += 1;
    p.dirs.add(path.resolve(s.cwd));
    if (s.live) p.liveSessions += 1;
    if (s.surface) p.surfaces.add(s.surface);
    if (s.lastAt > p.lastAt) {
      p.lastAt = s.lastAt;
      p.branch = s.branch || p.branch;
      if (s.title) p.title = s.title;   // the newest chat's words describe the project now
    }
    if (!p.title && s.title) p.title = s.title;
  }

  const now = Date.now();
  const out = [...byPath.values()].map((p) => ({
    ...p,
    surfaces: [...p.surfaces],
    cwds: [...p.dirs],
    dirs: p.dirs.size,
    ageMs: Math.max(0, now - p.lastAt),
    live: (now - p.lastAt) < liveMs,
  }));

  out.sort((a, b) => (b.live - a.live) || (b.lastAt - a.lastAt));
  return out.slice(0, max);
}
