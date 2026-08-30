// The four live feeds. Everything here is read only: this tool observes work,
// it never touches it.
//
//   scanProject     one pass over the tree, to seed the dust belts
//   watchProject    directory level fs.watch, so a hand edit in the editor counts too
//   watchSessions   tails the Claude Code transcripts for tools, todos and writes
//   watchGit        polls for commits, branch and head
//
// Note on watching: a recursive fs.watch over a mature monorepo also watches
// node_modules and can exhaust the inotify limit. So the watcher walks once and
// subscribes per directory, skipping the ignore set, and picks up new
// directories as they appear.

import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';

export const IGNORED_DIRS = new Set([
  '.git', 'node_modules', '.next', 'dist', 'build', 'out', 'coverage', '.turbo',
  '__pycache__', '.venv', 'venv', '.mypy_cache', '.pytest_cache', '.ruff_cache',
  '.cache', '.parcel-cache', 'target', 'vendor', '.gradle', '.idea', '.vscode-test',
  '.playwright-mcp', '.terraform', 'tmp', '_tmp', 'Pods', '.DS_Store', '.svelte-kit',
]);

const IGNORED_FILE = /(^|\/)(\.DS_Store|Thumbs\.db|\.gitkeep)$|\.(lock|log|pyc|class|o|so|dylib|map)$|(^|\/)package-lock\.json$|~$|\.sw[po]$|\.tmp$/;

export const isIgnoredPath = (rel) => {
  const segs = rel.split('/');
  if (segs.some((s) => IGNORED_DIRS.has(s))) return true;
  if (segs.some((s) => s.startsWith('.') && s !== '.claude' && s !== '.github' && s !== '.env')) return true;
  return IGNORED_FILE.test(rel);
};

/* ------------------------------------------------------------------ scan */

export function scanProject(root, { maxFiles = 60_000, maxDepth = 12 } = {}) {
  const out = [];
  const dirs = [];
  const stack = [{ dir: root, depth: 0 }];
  while (stack.length && out.length < maxFiles) {
    const { dir, depth } = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    dirs.push(dir);
    for (const e of entries) {
      const full = path.join(dir, e.name);
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (isIgnoredPath(rel)) continue;
      if (e.isDirectory()) { if (depth < maxDepth) stack.push({ dir: full, depth: depth + 1 }); continue; }
      if (!e.isFile()) continue;
      let bytes = 0;
      try { bytes = fs.statSync(full).size; } catch {}
      out.push({ rel, bytes });
      if (out.length >= maxFiles) break;
    }
  }
  return { files: out, dirs };
}

/* ----------------------------------------------------------------- watch */

export function watchProject(root, onFile, { maxWatch = 4000 } = {}) {
  const watchers = new Map();
  const pending = new Map();
  const seen = new Set();

  const subscribe = (dir) => {
    if (watchers.has(dir) || watchers.size >= maxWatch) return;
    let w;
    try { w = fs.watch(dir, { persistent: true }); } catch { return; }
    w.on('error', () => { try { w.close(); } catch {} watchers.delete(dir); });
    w.on('change', (_evt, name) => {
      if (!name) return;
      const full = path.join(dir, String(name));
      const rel = path.relative(root, full).split(path.sep).join('/');
      if (!rel || rel.startsWith('..') || isIgnoredPath(rel)) return;
      // Debounce: an editor save fires several times for one write.
      clearTimeout(pending.get(rel));
      pending.set(rel, setTimeout(() => {
        pending.delete(rel);
        let st = null;
        try { st = fs.statSync(full); } catch {}
        if (!st) { if (seen.has(rel)) { seen.delete(rel); onFile({ rel, removed: true }); } return; }
        if (st.isDirectory()) {
          // Walk INTO it, do not merely subscribe. `mkdir -p a/b` creates both
          // before this watcher exists, so subscribing to `a` alone left `b` and
          // everything ever written under it permanently invisible.
          const { files: inner, dirs: innerDirs } = scanProject(full);
          for (const d of innerDirs) subscribe(d);
          for (const f of inner) {
            const r = path.relative(root, path.join(full, f.rel)).split(path.sep).join('/');
            if (!r || isIgnoredPath(r) || seen.has(r)) continue;
            seen.add(r);
            onFile({ rel: r, bytes: f.bytes, created: true, source: 'fs' });
          }
          return;
        }
        if (!st.isFile()) return;
        const created = !seen.has(rel);
        seen.add(rel);
        onFile({ rel, bytes: st.size, created, source: 'fs' });
      }, 160));
    });
    watchers.set(dir, w);
  };

  const { files, dirs } = scanProject(root);
  for (const f of files) seen.add(f.rel);
  for (const d of dirs) subscribe(d);

  return {
    files,
    watching: watchers.size,
    close() { for (const w of watchers.values()) { try { w.close(); } catch {} } watchers.clear(); },
  };
}

/* -------------------------------------------------------------- sessions */

export const slugForRoot = (root) => root.replace(/[^A-Za-z0-9]/g, '-');

export function sessionDirFor(root, home = process.env.HOME) {
  return path.join(home, '.claude', 'projects', slugForRoot(root));
}

/**
 * Tails every recently active transcript for the project. Several concurrent
 * sessions feed one plate on purpose: it is the operator's work either way.
 *
 * onRecord({ kind, ... }) gets normalised records:
 *   { kind:'tool', name, input, at }
 *   { kind:'todos', todos, at }
 *   { kind:'write', file, at, created }
 *   { kind:'fault', label, detail, at }
 *   { kind:'prompt', text, at }
 */
export function watchSessions(dir, onRecord, { recentMs = 6 * 3600_000, maxFiles = 4, pollMs = 400, only = null } = {}) {
  const offsets = new Map();
  let stopped = false;
  let seeding = true;

  const pick = () => {
    // Following ONE chosen instance: drain exactly that transcript and nothing
    // else, so a second window in the same project can never bleed into it.
    if (only) { try { return fs.existsSync(only) ? [only] : []; } catch { return []; } }
    let names = [];
    try { names = fs.readdirSync(dir).filter((n) => n.endsWith('.jsonl')); } catch { return []; }
    const now = Date.now();
    return names
      .map((n) => { const p = path.join(dir, n); let m = 0; try { m = fs.statSync(p).mtimeMs; } catch {} return { p, m }; })
      .filter((f) => now - f.m < recentMs)
      .sort((a, b) => b.m - a.m)
      .slice(0, maxFiles)
      .map((f) => f.p);
  };

  const drain = (file) => {
    let st;
    try { st = fs.statSync(file); } catch { return; }
    const from = offsets.has(file) ? offsets.get(file) : 0;
    if (st.size <= from) { if (st.size < from) offsets.set(file, 0); return; }
    let buf;
    try {
      const fd = fs.openSync(file, 'r');
      const len = st.size - from;
      buf = Buffer.allocUnsafe(len);
      fs.readSync(fd, buf, 0, len, from);
      fs.closeSync(fd);
    } catch { return; }
    offsets.set(file, st.size);
    const text = buf.toString('utf8');
    const lines = text.split('\n');
    // A partial trailing line is normal on a live append. Rewind to its start.
    if (!text.endsWith('\n') && lines.length) {
      const tail = lines.pop();
      offsets.set(file, st.size - Buffer.byteLength(tail, 'utf8'));
    }
    for (const line of lines) {
      if (!line.trim()) continue;
      let o; try { o = JSON.parse(line); } catch { continue; }
      for (const rec of normalise(o)) onRecord({ ...rec, seeding });
    }
  };

  const tick = () => {
    if (stopped) return;
    for (const f of pick()) drain(f);
    seeding = false;
  };

  tick();
  const timer = setInterval(tick, pollMs);
  return { close() { stopped = true; clearInterval(timer); } };
}

function normalise(o) {
  const out = [];
  const at = Date.parse(o.timestamp || '') || Date.now();
  const type = o.type;
  const msg = o.message || {};

  if (type === 'assistant' && Array.isArray(msg.content)) {
    for (const b of msg.content) {
      if (!b || b.type !== 'tool_use') continue;
      const name = b.name;
      const input = b.input || {};
      if (name === 'TodoWrite' && Array.isArray(input.todos)) { out.push({ kind: 'todos', todos: input.todos, at }); continue; }
      if (name === 'Write' || name === 'Edit' || name === 'MultiEdit' || name === 'NotebookEdit') {
        if (input.file_path) out.push({ kind: 'write', file: input.file_path, created: name === 'Write', at });
        continue;
      }
      out.push({ kind: 'tool', name, input, at });
    }
  }

  if (type === 'user' && Array.isArray(msg.content)) {
    for (const b of msg.content) {
      if (b && b.type === 'tool_result' && b.is_error) {
        out.push({ kind: 'fault', label: 'tool error', detail: firstLine(b.content), at });
      }
    }
  }

  if (type === 'user' && typeof msg.content === 'string' && msg.content.trim()) {
    out.push({ kind: 'prompt', text: msg.content.slice(0, 400), at });
  }
  if (type === 'system' && o.level === 'error') {
    out.push({ kind: 'fault', label: o.subtype || 'system', detail: firstLine(o.error || ''), at });
  }
  return out;
}

const firstLine = (c) => {
  const s = typeof c === 'string' ? c : Array.isArray(c) ? (c.find((x) => x && x.type === 'text') || {}).text || '' : String(c ?? '');
  return String(s).split('\n')[0].slice(0, 160);
};

/* ------------------------------------------------------------------- git */

const git = (root, args) => new Promise((res) => {
  execFile('git', ['-C', root, ...args], { timeout: 8000, maxBuffer: 4 << 20 }, (err, stdout) => res(err ? '' : String(stdout)));
});

export function watchGit(root, onGit, { pollMs = 6000 } = {}) {
  let stopped = false;
  const tick = async () => {
    if (stopped) return;
    const [branch, log, head] = await Promise.all([
      git(root, ['rev-parse', '--abbrev-ref', 'HEAD']),
      git(root, ['log', '-40', '--pretty=%H%x1f%s%x1f%ct']),
      git(root, ['rev-parse', 'HEAD']),
    ]);
    const commits = log.split('\n').filter(Boolean).map((l) => {
      const [sha, subject, ct] = l.split('\x1f');
      return { sha, subject, at: (Number(ct) || 0) * 1000 };
    });
    onGit({ branch: branch.trim(), head: head.trim(), commits });
  };
  tick();
  const timer = setInterval(tick, pollMs);
  return { close() { stopped = true; clearInterval(timer); } };
}
