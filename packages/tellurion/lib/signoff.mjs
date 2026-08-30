// The chain of custody on a piece of work.
//
//   open           nobody has said anything yet
//   claimed        THE BUILDER says it is done. The agent that wrote it.
//   verified       THE JUDGE says it is proven. Sentinel, or whatever gate ran.
//   fully-verified THE OPERATOR says he accepts it. A human, once, by hand.
//
// Three different parties, and the rule that makes the ladder mean anything:
// NO PARTY CAN GRANT ITS OWN TIER FROM ITS OWN FILE.
//
// So the three live in three places. The plan carries claims, because the plan
// is what the builder writes. Verdicts come from the judge's own file. And
// acceptance comes from a deliberate act by the operator, recorded with who and
// when. If all three were one file, editing that file would forge the whole
// chain, and a badge you can type is not evidence of anything.

import fs from 'node:fs';
import path from 'node:path';
export { TIERS, tierRank, tierFor, fingerprint } from './tiers.mjs';
import { fingerprint } from './tiers.mjs';
import { writeJsonAtomic } from './atomic.mjs';

export const VERDICTS_FILE = 'verdicts.json';   // written by the judge
export const ACCEPTED_FILE = 'accepted.json';   // written by the operator

const dirFor = (root) => path.join(root, '.tellurion');
export const verdictsPathFor = (root) => path.join(dirFor(root), VERDICTS_FILE);
export const acceptedPathFor = (root) => path.join(dirFor(root), ACCEPTED_FILE);

const readJson = (file) => {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
};

const clean = (s, n = 120) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);

// A verdict is only a verdict if it names WHO judged it and PASSES. A file full
// of failures must not read as a file full of sign-offs, and an unsigned entry
// is not a judgement, it is an assertion.
export function readVerdicts(root) {
  const raw = readJson(verdictsPathFor(root));
  const out = new Map();
  if (!raw) return out;
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw.verdicts) ? raw.verdicts : [];
  for (const r of rows) {
    if (!r || typeof r !== 'object') continue;
    const step = clean(r.step || r.id, 60);
    if (!step) continue;
    const pass = r.pass === true || r.verdict === 'PASS' || r.result === 'pass';
    const by = clean(r.by || r.judge, 60);
    if (!by) continue;   // unsigned is an assertion, not a judgement
    // A FAIL is kept. Dropping it made "the judge failed this" and "no judge has
    // looked at this" the same thing from here on, so the instrument told him in
    // a full sentence that nobody had checked work a judge had just rejected —
    // on the exact claim the product exists to prove.
    out.set(step, {
      by, pass, at: clean(r.at, 40), fp: clean(r.fp, 20) || undefined,
      note: clean(r.note, 200) || undefined,
      via: clean(r.via, 40) || undefined,
      matched: Array.isArray(r.matched) ? r.matched.slice(0, 8).map((x) => clean(x, 200)) : undefined,
    });
  }
  return out;
}

// Acceptance is a human act, so it records the human. An entry with no `by` is
// not treated as acceptance: the whole point of the top tier is that a person
// put their name to it.
export function readAccepted(root) {
  const raw = readJson(acceptedPathFor(root));
  const out = new Map();
  if (!raw) return out;
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw.accepted) ? raw.accepted : [];
  for (const r of rows) {
    const o = typeof r === 'string' ? { step: r } : r;
    if (!o || typeof o !== 'object') continue;
    const step = clean(o.step || o.id, 60);
    const by = clean(o.by, 60);
    if (!step || !by) continue;
    out.set(step, {
      by, at: clean(o.at, 40),
      fp: clean(o.fp, 20) || undefined,
      onVerdict: clean(o.onVerdict, 40) || undefined,
      note: clean(o.note, 200) || undefined,
    });
  }
  return out;
}

export class AcceptRefused extends Error {
  constructor(msg, code) { super(msg); this.code = code; }
}

// Acceptance is the top of the ladder, so it is refused with a REASON rather
// than performed as a silent no-op. It used to answer ok:true for a step that
// was not in the plan at all, and for one no judge had passed — both wrote a row
// and changed nothing on screen, which reads as the instrument being broken.
// What an id addresses. Custody moved to FEATURES on 2026-08-30 (decision D3),
// so acceptance has to resolve a feature id as readily as a step id, and both
// have to produce the same shape or the fingerprint written here will not match
// the one state.mjs computes when it reads the row back.
//
// A feature is claimed when every step under it is done; a feature nobody has
// written a step for yet falls back to its own declared status. Steps keep
// resolving exactly as before, so an older row addressed to one still applies.
export function resolveTarget(plan, id) {
  const wanted = clean(id, 60);
  if (!plan || !wanted) return null;
  const steps = (plan.phases || []).flatMap((ph) => ph.steps || []);
  for (const pr of (plan.products || [])) {
    const f = (pr.features || []).find((x) => x.id === wanted);
    if (!f) continue;
    const mine = steps.filter((st) => st.produces && st.produces.feature === wanted);
    return {
      kind: 'feature', id: f.id, title: f.name,
      claimed: mine.length ? mine.every((st) => st.status === 'done') : f.status === 'done',
      what: `feature "${f.name}"`,
    };
  }
  const st = steps.find((x) => x.id === wanted);
  if (st) return { kind: 'step', id: st.id, title: st.title, claimed: st.status === 'done', what: `"${st.title}"` };
  return null;
}

export function accept(root, { step, by, note, force = false, plan = null, verdicts = null }) {
  const stepId = clean(step, 60);
  const who = clean(by, 60);
  if (!stepId) throw new AcceptRefused('accept needs a step', 'no-step');
  if (!who) throw new AcceptRefused('accept needs a name: the top tier is a person putting their name to it', 'no-name');
  let target = null;
  if (plan) {
    target = resolveTarget(plan, stepId);
    if (!target) throw new AcceptRefused(`nothing called "${stepId}" in this project's plan`, 'unknown-step');
    const st = target;
    if (!target.claimed && !force) {
      throw new AcceptRefused(`${target.what} is not claimed done yet, so there is nothing to accept`, 'not-claimed');
    }
    if (verdicts && !verdicts.get(stepId) && !force) {
      throw new AcceptRefused(
        `no judge has passed "${st.title}" yet, so accepting it would not move it. ` +
        'The ladder is climbed in order. Send force:true to record your acceptance anyway; ' +
        'it takes effect the moment a verdict lands.', 'no-verdict');
    }
  }
  const file = acceptedPathFor(root);
  const raw = readJson(file);
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw && raw.accepted) ? raw.accepted : [];
  const next = rows.filter((r) => clean((r && (r.step || r.id)) || r, 60) !== stepId);
  // Record WHAT was accepted and WHICH verdict it rode on. Without both, the row
  // outlives the thing it signed: flipping a step back and forth restored the
  // operator's own tier without him, and a re-judgement never invalidated it.
  const stepRec = target ? { id: target.id, title: target.title } : null;
  const v = verdicts ? verdicts.get(stepId) : null;
  next.push({
    step: stepId, by: who, at: new Date().toISOString(),
    ...(stepRec ? { fp: fingerprint(stepRec) } : {}),
    ...(v && v.at ? { onVerdict: v.at } : {}),
    ...(note ? { note: clean(note, 200) } : {}),
  });
  writeJsonAtomic(file, { accepted: next });
  clearWithdrawal(root, stepId);   // he has looked at it again; the retirement is answered
  return next.find((r) => r.step === stepId);
}

export function unaccept(root, step) {
  const stepId = clean(step, 60);
  const file = acceptedPathFor(root);
  const raw = readJson(file);
  const rows = Array.isArray(raw) ? raw : Array.isArray(raw && raw.accepted) ? raw.accepted : [];
  const next = rows.filter((r) => clean((r && (r.step || r.id)) || r, 60) !== stepId);
  writeJsonAtomic(file, { accepted: next });
  return true;
}

// GENERATED, not hand written. The server records here, and only here, the
// moment it observes the builder taking a claim back on a step the operator had
// already accepted. It grants nothing: it retires something, which is the one
// direction a watcher is allowed to move the ladder.
export const WITHDRAWN_FILE = 'withdrawn.json';
export const withdrawnPathFor = (root) => path.join(dirFor(root), WITHDRAWN_FILE);

export function readWithdrawn(root) {
  const raw = readJson(withdrawnPathFor(root));
  const out = new Map();
  for (const r of (raw && Array.isArray(raw.withdrawn) ? raw.withdrawn : [])) {
    const step = clean(r && (r.step || r.id), 60);
    const at = clean(r && r.at, 40);
    if (step && at) out.set(step, at);
  }
  return out;
}

// Returns true when it wrote something, so the caller knows the world moved.
export function noteWithdrawals(root, stepIds) {
  const cur = readWithdrawn(root);
  const add = stepIds.filter((id) => !cur.has(id));
  if (!add.length) return false;
  const at = new Date().toISOString();
  for (const id of add) cur.set(id, at);
  writeJsonAtomic(withdrawnPathFor(root), { withdrawn: [...cur].map(([step, a]) => ({ step, at: a })) });
  return true;
}

export function clearWithdrawal(root, stepId) {
  const cur = readWithdrawn(root);
  if (!cur.delete(clean(stepId, 60))) return false;
  writeJsonAtomic(withdrawnPathFor(root), { withdrawn: [...cur].map(([step, a]) => ({ step, at: a })) });
  return true;
}

export function readSignoffs(root) {
  return { verdicts: readVerdicts(root), accepted: readAccepted(root), withdrawn: readWithdrawn(root) };
}

// A sign-off for a step that is no longer in the plan is not nothing: it is a
// judgement, or the operator's own signature, pointing at work that has been
// deleted or renumbered. Silently ignoring it is how a stale row later lands on
// a brand new step that happens to reuse the id.
export function orphanSignoffs(plan, signoffs) {
  // FEATURES COUNT AS LIVE. Custody moved to features on 2026-08-30, so a set
  // built from step ids alone reported every correctly addressed sign-off as
  // pointing at deleted work — the panel led with four false alarms about the
  // only rows that were right.
  const live = new Set([
    ...((plan && plan.phases) || []).flatMap((ph) => (ph.steps || []).map((s) => s.id)),
    ...((plan && plan.products) || []).flatMap((pr) => (pr.features || []).map((f) => f.id)),
  ]);
  const out = [];
  for (const [id, v] of (signoffs && signoffs.verdicts) || []) if (!live.has(id)) out.push(`a verdict by ${v.by} points at "${id}", which is not a feature or a step in the plan`);
  for (const [id, a] of (signoffs && signoffs.accepted) || []) if (!live.has(id)) out.push(`your acceptance of "${id}" points at something that is not in the plan`);
  return out;
}
