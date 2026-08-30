#!/usr/bin/env node
// Sentinel -> Tellurion. Turns the judge's own receipts into the middle rung of
// the ladder, so `verified` fills itself instead of being typed by hand.
//
//   node bin/sentinel-ingest.mjs --project <path> [--receipts <dir>] [--dry]
//
// THE INTEGRITY PROBLEM, and why this is careful.
// A Sentinel receipt names FILES and a verdict. A plan names STEPS. Nothing in
// the receipt says which step it judged, so something has to map one onto the
// other — and if that mapping is wrong, a real judge's name lands on work the
// judge never looked at. That is the same class of hole as a stale sign-off
// landing on a step that reused an id, and it is worse, because it is wearing
// somebody's signature.
//
// So the mapping is UNAMBIGUOUS OR NOTHING. The join is the attribution record
// (.tellurion/work.json): which files were written while a given step was the
// step in hand. If a receipt's files overlap exactly one step's record, that is
// the step. If they overlap two, this refuses and says so. If they overlap none,
// it refuses and says so. It never picks the best match.
//
// Every row it writes carries its provenance — the receipt it came from and the
// files that matched — so the inference is auditable rather than asserted, and
// the fingerprint is computed from the step AS IT IS NOW, so the existing
// staleness rules apply the moment anyone edits it.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readPlan } from '../lib/plan.mjs';
import { fingerprint } from '../lib/tiers.mjs';
import { writeJsonAtomic } from '../lib/atomic.mjs';
import { readWork, stepForFiles } from '../lib/work.mjs';
import { verdictsPathFor } from '../lib/signoff.mjs';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const has = (k) => argv.includes(`--${k}`);

const ROOT = path.resolve(arg('project', process.cwd()));
const RECEIPTS = arg('receipts', '/var/log/sentinel-tripwire/receipts');
const DRY = has('dry');
const JUDGE = arg('judge', 'Sentinel');

// The receipts are root owned on Forge. Read them without sudo where possible and
// fall back to one non-interactive sudo; never prompt, and say plainly when the
// directory cannot be read rather than reporting an empty judge.
function listReceipts() {
  try { return fs.readdirSync(RECEIPTS).filter((f) => f.endsWith('.json')).map((f) => path.join(RECEIPTS, f)); }
  catch {}
  try {
    const out = execFileSync('sudo', ['-n', 'ls', '-1', RECEIPTS], { encoding: 'utf8' });
    return out.split('\n').filter((f) => f.endsWith('.json')).map((f) => path.join(RECEIPTS, f));
  } catch { return null; }
}
function readReceipt(file) {
  let txt = null;
  try { txt = fs.readFileSync(file, 'utf8'); }
  catch { try { txt = execFileSync('sudo', ['-n', 'cat', file], { encoding: 'utf8' }); } catch { return null; } }
  try { return JSON.parse(txt); } catch { return null; }
}

const files = listReceipts();
if (files === null) {
  console.error(`sentinel-ingest: cannot read ${RECEIPTS}. Nothing was written.`);
  console.error('  This is a MISSING JUDGE, not a clean run. Point --receipts at a readable directory.');
  process.exit(2);
}

const plan = readPlan(ROOT);
if (!plan.exists || plan.error) {
  console.error(`sentinel-ingest: ${ROOT} has no readable plan (${plan.error || 'no .tellurion/plan.json'}). Nothing to attach a verdict to.`);
  process.exit(2);
}
const steps = new Map(plan.phases.flatMap((ph) => ph.steps).map((st) => [st.id, st]));
const work = readWork(ROOT);

const vFile = verdictsPathFor(ROOT);
let existing = [];
let ingested = [];
try {
  const raw = JSON.parse(fs.readFileSync(vFile, 'utf8'));
  existing = Array.isArray(raw) ? raw : (raw.verdicts || []);
  ingested = Array.isArray(raw && raw.ingested) ? raw.ingested : [];
} catch {}
// The consumed receipts are recorded in their OWN list, not inferred from the
// rows that happen to have survived. Inferring it meant that the moment a later
// verdict superseded an earlier one, the earlier receipt looked unread again and
// was re-ingested on every run — stable in outcome, but it re-did the work and
// printed a WROTE line for something already consumed.
const seenReceipts = new Set(ingested);

// Oldest first, by the receipt's OWN timestamp rather than its filename, so the
// newest judgement is the one that stands. Sorting by name would let a stale PASS
// land on top of a later FAIL the day the naming convention changes.
const ordered = files
  .map((f) => ({ f, r: readReceipt(f) }))
  .sort((a, b) => String((a.r && a.r.timestamp) || '').localeCompare(String((b.r && b.r.timestamp) || '')));

const wrote = [], skipped = [];
for (const { f, r: pre } of ordered) {
  if (seenReceipts.has(path.basename(f))) continue;      // idempotent
  const r = pre;
  if (!r) { skipped.push([path.basename(f), 'unreadable']); continue; }
  // The real schema, read off this machine's own receipts rather than assumed:
  // the verdict is `judged-pass` / `judged-fail`, and `judged` holds ABSOLUTE
  // paths. `PASS` / `FAIL` are kept so a different judge can feed this too.
  const raw = String(r.verdict || '').toLowerCase();
  const v = (raw === 'judged-pass' || raw === 'pass') ? 'PASS'
    : (raw === 'judged-fail' || raw === 'fail') ? 'FAIL' : null;
  if (!v) { skipped.push([path.basename(f), `verdict is "${r.verdict}", not a judgement`]); continue; }
  const list = (x) => (Array.isArray(x) ? x.map((j) => (typeof j === 'string' ? j : (j && (j.path || j.file)) || '')).filter(Boolean) : []);
  const judged = list(r.judged);
  // `judged_unchanged` means the file carries a STANDING pass and was not
  // re-examined. That is a real fact, but the judgement behind it belongs to an
  // earlier receipt, and treating it as fresh would let one old pass re-assert
  // itself on every later run. It is named rather than used.
  if (!judged.length) {
    const unchanged = list(r.judged_unchanged);
    skipped.push([path.basename(f), unchanged.length
      ? `${v}, but it re-examined nothing (${unchanged.length} file(s) carried a standing pass); the judgement behind those belongs to an earlier receipt`
      : `${v}, but it named no files`]);
    continue;
  }
  const hit = stepForFiles(work, judged, { root: ROOT });
  if (!hit.step) { skipped.push([path.basename(f), hit.why]); continue; }
  const st = steps.get(hit.step);
  if (!st) { skipped.push([path.basename(f), `step "${hit.step}" is no longer in the plan`]); continue; }
  existing = existing.filter((e) => e && (e.step || e.id) !== hit.step);
  existing.push({
    step: hit.step,
    by: String(r.judge || JUDGE).slice(0, 60),
    pass: v === 'PASS',
    at: String(r.timestamp || new Date().toISOString()).slice(0, 40),
    fp: fingerprint(st),
    ...(r.note ? { note: String(r.note).replace(/\s+/g, ' ').slice(0, 200) } : {}),
    // provenance: how this row came to exist, so the inference can be checked
    via: 'sentinel-receipt',
    receipt: path.basename(f),
    matched: hit.matched.slice(0, 8),
  });
  ingested.push(path.basename(f));
  wrote.push([hit.step, v, st.title, hit.matched.length]);
}

if (!DRY && wrote.length) {
  writeJsonAtomic(vFile, { verdicts: existing, ingested: ingested.slice(-2000) });
}

console.log(`sentinel-ingest  ${ROOT}`);
console.log(`  ${files.length} receipt(s) read from ${RECEIPTS}`);
for (const [step, v, title, n] of wrote) console.log(`  ${DRY ? 'would write' : 'WROTE'}  ${v.padEnd(4)} ${step}  "${title}"  (${n} file(s) matched)`);
// Every refusal is printed. A judge whose verdict could not be placed is a fact
// worth knowing, and counting it silently is how a verification gap goes unseen.
for (const [f, why] of skipped) console.log(`  skipped   ${f}: ${why}`);
if (!wrote.length) console.log('  nothing new to attach');
