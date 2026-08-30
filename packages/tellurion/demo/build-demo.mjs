#!/usr/bin/env node
// Builds the demo project's sign-off and usage files.
//
// These are written by a script rather than by hand for one reason: a verdict
// carries a FINGERPRINT of the thing it signed, and state.mjs recomputes that
// fingerprint when it reads the row back. A hand-typed hash that is one
// character out does not fail loudly — it reads as STALE, and the plate quietly
// drops a fully-verified feature to claimed. So the same function that checks
// them is the one that writes them.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { fingerprint } from '../lib/tiers.mjs';
import { normalisePlan } from '../lib/plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJ = path.join(HERE, 'project');
const TEL = path.join(PROJ, '.tellurion');

const plan = normalisePlan(JSON.parse(fs.readFileSync(path.join(TEL, 'plan.json'), 'utf8')), 'Lantern');
const world = JSON.parse(fs.readFileSync(path.join(HERE, 'data', 'world-static.json'), 'utf8'));

// A feature's fingerprint is taken over { id, title: name } — the same shape
// applyPlan builds when it looks the row back up.
const feats = new Map();
for (const pr of plan.products) for (const f of (pr.features || [])) feats.set(f.id, { id: f.id, title: f.name });

const fpOf = (id) => {
  const f = feats.get(id);
  if (!f) throw new Error(`demo: no such feature "${id}" — the plan and this script have drifted`);
  return fingerprint(f);
};

const iso = (daysAgo, h = 11) => {
  const d = new Date('2026-08-30T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(h, (daysAgo * 7) % 60, 0, 0);
  return d.toISOString();
};

// ---------------------------------------------------------------- verdicts
// The judge. Five passes, one honest rejection. The rejection is the point of
// the whole instrument, so it is stated in words an audience reads once:
// the feature was claimed done, a second model looked, and it was not.
const VERDICTS = [
  { step: 'product-search', by: 'Judge', pass: true, at: iso(9), via: 'customer-walk',
    matched: ['typed "milk", got 14 matching items', 'typed "zzzz", got the empty-shelf message'] },
  { step: 'photo-gallery', by: 'Judge', pass: true, at: iso(8),  via: 'customer-walk',
    matched: ['swiped through 4 photos on 3 items', 'tapped a photo, it opened full size'] },
  { step: 'stock-levels', by: 'Judge', pass: true, at: iso(7), via: 'full-check',
    matched: ['sold-out items are greyed out and cannot be added'] },
  { step: 'save-for-later', by: 'Judge', pass: true, at: iso(6), via: 'customer-walk',
    matched: ['saved 3 items, all 3 were on the saved page after a sign-out'] },
  { step: 'card-payment', by: 'Judge', pass: true, at: iso(5), via: 'full-check',
    matched: ['a real test card was charged and the money moved', 'a declined card showed the retry message'] },
  { step: 'discount-codes', by: 'Judge', pass: true, at: iso(3), via: 'customer-walk',
    matched: ['a real code took 10% off', 'an invented code was refused'] },
  { step: 'live-map', by: 'Judge', pass: true, at: iso(2), via: 'customer-walk',
    matched: ['the driver dot moved along the street for 4 minutes'] },
  // The rejection. Claimed by the builder, rejected by the judge.
  { step: 'receipt-email', by: 'Judge', pass: false, at: iso(1),
    note: 'The email arrives and the total is right, but it lists the items from the previous order.' },
];

// ---------------------------------------------------------------- accepted
// The operator. Only what a judge already passed, and deliberately fewer rows
// than there are passes: the top tier is a person putting their name to it, and
// a demo where everything is accepted teaches the audience nothing about a
// ladder that is climbed one rung at a time.
const ACCEPTED = [
  { step: 'product-search', by: 'Wassim', at: iso(8, 17) },
  { step: 'photo-gallery', by: 'Wassim', at: iso(8, 17) },
  { step: 'stock-levels', by: 'Wassim', at: iso(6, 16) },
  { step: 'save-for-later', by: 'Wassim', at: iso(6, 16) },
  { step: 'card-payment', by: 'Wassim', at: iso(4, 10) },
];

const vRows = VERDICTS.map((v) => ({ ...v, fp: fpOf(v.step) }));
const vAt = new Map(vRows.map((v) => [v.step, v.at]));
const aRows = ACCEPTED.map((a) => ({ ...a, fp: fpOf(a.step), onVerdict: vAt.get(a.step) }));

// A row the ladder would refuse is a bug in this file, not a demo state, so it
// is caught here rather than shown as a silently missing halo.
for (const a of aRows) {
  const v = vRows.find((x) => x.step === a.step);
  if (!v || v.pass !== true) throw new Error(`demo: "${a.step}" is accepted but no judge passed it`);
}

// ------------------------------------------------------------------- usage
// What this project has actually reached for. Not everything: the belt drawing
// only what was used is a real behaviour of the instrument, and a demo that
// lights all of it would hide that.
const UNUSED = new Set(['t18', 't21', 't22', 't27', 'w-tidyup']);
const used = {};
let n = 0;
for (const k of ['tools', 'processes', 'workflows']) {
  for (const x of world[k]) {
    if (UNUSED.has(x.id)) continue;
    // Counts vary so the plate has texture; the heavy ring arcs are reached for
    // most, which is what makes them heavy.
    const w = Number(x.weight) || 1;
    used[x.id] = { n: 2 + ((n * 7) % 11) + w * 6, lastAt: Date.now() - ((n * 37) % 400) * 60000 };
    n++;
  }
}

fs.writeFileSync(path.join(TEL, 'verdicts.json'), JSON.stringify({ verdicts: vRows }, null, 2) + '\n');
fs.writeFileSync(path.join(TEL, 'accepted.json'), JSON.stringify({ accepted: aRows }, null, 2) + '\n');
fs.writeFileSync(path.join(TEL, 'usage.json'), JSON.stringify({ updated: new Date().toISOString(), used }, null, 2) + '\n');

console.log(`demo: ${vRows.length} verdicts (${vRows.filter((v) => v.pass).length} pass, ${vRows.filter((v) => !v.pass).length} fail), ${aRows.length} accepted, ${Object.keys(used).length} bench items used`);
