// What of the standing bench this project has ACTUALLY used, and when.
//
// The bench was drawn in full on every project from the first second: 60 tools,
// 13 processes, 15 workflows, whether or not the project had ever touched one of
// them. Wassim, 2026-08-28: "ship to vault. I'm probably not gonna use it very
// much, if at all, so then it never appears."
//
// Pulses already record a touch, and they died with the process, so a filter
// built on them alone would forget everything on restart and the belt would
// empty itself every time the service bounced. This is the persistent half:
// entity id -> how many times, and when last. Append-only in spirit; nothing is
// ever removed, because "used once in July" is still used.

import fs from 'node:fs';
import path from 'node:path';
import { writeJsonAtomic } from './atomic.mjs';

export const USAGE_FILE = 'usage.json';
export const usagePathFor = (root) => path.join(root, '.tellurion', USAGE_FILE);

export function readUsage(root) {
  try {
    const raw = JSON.parse(fs.readFileSync(usagePathFor(root), 'utf8'));
    const src = raw && raw.used ? raw.used : {};
    const out = {};
    for (const [id, u] of Object.entries(src)) {
      if (!id || !u || typeof u !== 'object') continue;
      const n = Number(u.n) || 0;
      const lastAt = Number(u.lastAt) || 0;
      if (n > 0) out[String(id).slice(0, 80)] = { n, lastAt };
    }
    return out;
  } catch { return {}; }
}

export function writeUsage(root, used) {
  const out = {};
  for (const [id, u] of Object.entries(used || {})) {
    if (!u || !u.n) continue;
    out[id] = { n: u.n, lastAt: u.lastAt || 0 };
  }
  writeJsonAtomic(usagePathFor(root), { updated: new Date().toISOString(), used: out });
}

// One place decides what counts as "on the bench", so the filter and the census
// can never disagree about it.
export function benchIdsOf(stat) {
  const ids = new Set();
  for (const k of ['tools', 'processes', 'workflows']) {
    for (const x of (stat && stat[k]) || []) if (x && x.id) ids.add(x.id);
  }
  return ids;
}
