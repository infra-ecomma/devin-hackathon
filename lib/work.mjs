// The attribution record: which files were touched, and which commits landed,
// WHILE a given plan step was the step in hand.
//
// This existed in memory and had no consumer and no persistence, so it died with
// the process and nothing on screen or on disk could ever use it. It is the join
// the whole architecture rests on, and it is the only honest way to answer "which
// step does this verdict belong to" — a judge's receipt names FILES, a plan names
// STEPS, and this is the record that connects them.
//
// The claim it makes is deliberately narrow, and it is a claim about WHEN, not a
// guess about what any words mean: this file was written while that step was in
// hand. That is why it holds up on a plan hand-written in whatever language the
// operator likes.

import fs from 'node:fs';
import path from 'node:path';
import { writeJsonAtomic } from './atomic.mjs';

export const WORK_FILE = 'work.json';
export const workPathFor = (root) => path.join(root, '.tellurion', WORK_FILE);

const clean = (s, n = 400) => String(s == null ? '' : s).slice(0, n);

export function readWork(root) {
  try {
    const raw = JSON.parse(fs.readFileSync(workPathFor(root), 'utf8'));
    const out = {};
    for (const [id, w] of Object.entries(raw && raw.work ? raw.work : {})) {
      if (!id || !w || typeof w !== 'object') continue;
      out[clean(id, 60)] = {
        paths: (Array.isArray(w.paths) ? w.paths : []).slice(-400).map((p) => clean(p)),
        entities: (Array.isArray(w.entities) ? w.entities : []).slice(-80).map((p) => clean(p, 80)),
        commits: (Array.isArray(w.commits) ? w.commits : []).slice(-80).map((p) => clean(p, 60)),
        first: Number(w.first) || 0,
        last: Number(w.last) || 0,
      };
    }
    return out;
  } catch { return {}; }
}

// Merged, never replaced. A restart must not erase what an earlier session
// recorded about a step that is still in hand.
export function writeWork(root, stepWork) {
  const merged = readWork(root);
  for (const [id, w] of Object.entries(stepWork || {})) {
    const prev = merged[id];
    if (!prev) { merged[id] = w; continue; }
    merged[id] = {
      paths: [...new Set([...prev.paths, ...w.paths])].slice(-400),
      entities: [...new Set([...prev.entities, ...w.entities])].slice(-80),
      commits: [...new Set([...prev.commits, ...w.commits])].slice(-80),
      first: Math.min(prev.first || w.first, w.first || prev.first),
      last: Math.max(prev.last || 0, w.last || 0),
    };
  }
  writeJsonAtomic(workPathFor(root), { work: merged });
  return merged;
}

// Which step does a set of judged files belong to?
//
// UNAMBIGUOUS OR NOTHING. If the files a judge looked at overlap the recorded
// work of two different steps, this returns null and says why. Guessing here
// would put a real verdict on the wrong step, which is the same class of hole as
// letting a stale sign-off land on a step that reused an id — and it would be
// worse, because it would be wearing a judge's name.
export function stepForFiles(work, files, { root = '' } = {}) {
  const rels = (files || []).map((f) => {
    let s = String(f || '').replace(/\\/g, '/');
    if (root && s.startsWith(root)) s = s.slice(root.length).replace(/^\//, '');
    return s;
  }).filter(Boolean);
  if (!rels.length) return { step: null, why: 'the receipt named no files' };

  const hits = [];
  for (const [id, w] of Object.entries(work || {})) {
    const matched = rels.filter((r) => w.paths.some((p) => p === r || r.endsWith('/' + p) || p.endsWith('/' + r)));
    if (matched.length) hits.push({ id, matched });
  }
  if (!hits.length) return { step: null, why: 'no step has any of those files on its record' };
  if (hits.length > 1) {
    return { step: null, why: `those files span ${hits.length} steps (${hits.map((h) => h.id).join(', ')}), so which one was judged is not knowable` };
  }
  return { step: hits[0].id, matched: hits[0].matched, why: null };
}
