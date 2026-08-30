// The project plan: declared, checked in, and hand editable.
//
// The spine used to be built from a chat's TodoWrite list, which is a session
// artifact: it dies with the chat and every row carries the date it was typed.
// On an existing project that produced a "plan" of thirty one steps all dated
// the same day, which is not a plan, it is a transcript of one afternoon.
//
// A plan is a DECLARATION. It lives in the repo at .tellurion/plan.json, it is
// edited by hand or through the instrument, and it is the same plan tomorrow.
// A project with no plan file gets an EMPTY spine and an invitation to write
// one. It never gets a guessed one, because a guessed plan is the exact false
// green this instrument exists to kill.

import fs from 'node:fs';
import path from 'node:path';
import { writeJsonAtomic } from './atomic.mjs';

export const PLAN_DIR = '.tellurion';
export const PLAN_FILE = 'plan.json';
export const STATUSES = ['planned', 'active', 'done'];

export const planPathFor = (root) => path.join(root, PLAN_DIR, PLAN_FILE);

const slug = (s, i) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `s${i}`;
const clean = (s, n = 200) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, n);
const statusOf = (s) => (STATUSES.includes(String(s)) ? String(s) : 'planned');

// Normalising is deliberately forgiving: this file is meant to be edited by
// hand, so a missing id, a bare string instead of an object, or a typo'd status
// must not blank the spine. What it will NOT do is invent steps.
export function normalisePlan(raw, projectName = '') {
  const src = raw && typeof raw === 'object' ? raw : {};
  const phasesIn = Array.isArray(src.phases) ? src.phases : [];
  const phases = phasesIn.map((ph, i) => {
    const p = typeof ph === 'string' ? { title: ph } : (ph && typeof ph === 'object' ? ph : {});
    const title = clean(p.title || p.name || `Phase ${i + 1}`, 120);
    const stepsIn = Array.isArray(p.steps) ? p.steps : [];
    const steps = stepsIn.map((st, j) => {
      const s = typeof st === 'string' ? { title: st } : (st && typeof st === 'object' ? st : {});
      const t = clean(s.title || s.content || `Step ${j + 1}`, 200);
      // A step may DECLARE what it produces. That declaration is what joins the
      // two views: the step and the body it produces are ONE record with one id
      // and one name, so renaming it in the plan renames it on the map. Without
      // this they are two copies of a name and they drift apart on the first
      // edit.
      const prod = s.produces && typeof s.produces === 'object' ? s.produces : (s.product ? { of: s.product } : null);
      return {
        // Derived from POSITION, never from the title. A title-derived id changed
        // on every wording edit and took the step's whole chain of custody with
        // it. Position is stable under the edit people actually make.
        id: clean(s.id, 60) || `${slug(title, i)}-${j + 1}`,
        title: t,
        status: statusOf(s.status),
        note: clean(s.note, 400) || undefined,
        // `of` is the product, `feature` is the part of it this step builds.
        // `feature` is the join that makes the spine read as a product rather
        // than as a worklog: without it every step is its own headline, which
        // is what "weird steps in there" was looking at.
        produces: prod ? {
          kind: clean(prod.kind, 20) || 'feature',
          of: clean(prod.of || prod.product, 60) || undefined,
          feature: clean(prod.feature, 60) || undefined,
        } : undefined,
      };
    });
    // A phase with every step done is done, whatever the file claims: the steps
    // are the evidence and the phase heading is a summary of them.
    const derived = steps.length
      ? (steps.every((s) => s.status === 'done') ? 'done'
        : steps.some((s) => s.status !== 'planned') ? 'active' : 'planned')
      : statusOf(p.status);
    return { id: clean(p.id, 60) || slug(title, i), title, status: derived, steps };
  });

  // Ids must be UNIQUE, because a sign-off is addressed by id. Two steps sharing
  // one id meant one judge verdict, or one acceptance, silently covered two
  // different pieces of work — a hole straight through the chain of custody,
  // opened by nothing worse than a copy-pasted line. Collisions are made unique
  // and reported, never dropped: losing a step to a typo is worse than carrying
  // a renamed one.
  const collisions = [];
  const uniq = (taken, id, what) => {
    if (!taken.has(id)) { taken.add(id); return id; }
    let n = 2;
    while (taken.has(`${id}-${n}`)) n++;
    const next = `${id}-${n}`;
    collisions.push(`${what} id "${id}" appears more than once; the later one is "${next}"`);
    taken.add(next);
    return next;
  };
  const phaseIds = new Set();
  const stepIds = new Set();
  for (const ph of phases) {
    ph.id = uniq(phaseIds, ph.id, 'phase');
    for (const st of ph.steps) st.id = uniq(stepIds, st.id, 'step');
  }

  const allSteps = phases.flatMap((p) => p.steps);

  // Products are declared once and referenced by id. A step that names a
  // product nobody declared still counts: the product is inferred from the
  // reference rather than dropped, because losing a step because of a typo is
  // worse than carrying a product with a plain name.
  const declared = new Map();
  for (const pr of (Array.isArray(src.products) ? src.products : [])) {
    const o = typeof pr === 'string' ? { name: pr } : (pr && typeof pr === 'object' ? pr : {});
    const name = clean(o.name || o.title, 120);
    if (!name) continue;
    const id = clean(o.id, 60) || slug(name, declared.size);
    // `home` is the repo-relative path the product lives at. Attribution lights
    // the planet when work lands under it, which is the spine's connection to
    // the project itself (ADR-0134, T4). Optional; empty means name-matching only.
    // A FEATURE is a part of the product. It is declared here, by name, so it
    // can be listed before any work on it exists — which is the whole reason a
    // plan is written ahead of the work. Steps point AT a feature; they are no
    // longer silently relabelled as one (that was `features.push({ id: 'step:'
    // + st.id })` in state.mjs, and it is why the spine printed verbs).
    // Forgiving on purpose: a bare string is a feature name, same as everywhere
    // else in this hand-edited file.
    const feats = [];
    const rawFeats = Array.isArray(o.features) ? o.features : [];
    rawFeats.forEach((fr, k) => {
      const f = typeof fr === 'string' ? { name: fr } : (fr && typeof fr === 'object' ? fr : {});
      const fname = clean(f.name || f.title, 120);
      if (!fname) return;
      feats.push({
        id: clean(f.id, 60) || slug(fname, k),
        name: fname,
        note: clean(f.note, 400) || undefined,
        // A feature may carry its own status for a project that tracks it
        // directly; with steps under it the steps decide, so this is a floor.
        status: STATUSES.includes(String(f.status)) ? String(f.status) : undefined,
      });
    });
    declared.set(id, { id, name, note: clean(o.note, 400) || undefined, home: clean(o.home, 200) || undefined, declared: true, features: feats });
  }
  const undeclared = new Map();
  for (const st of allSteps) {
    const of = st.produces && st.produces.of;
    if (!of || declared.has(of)) continue;
    undeclared.set(of, (undeclared.get(of) || 0) + 1);
  }
  // Keeping the step is right: losing work to a typo is worse than carrying a
  // product with a plain name. Drawing the invention as an ORDINARY product was
  // not. Measured 2026-08-28 on this repo's own plan, five steps named `the-plan`
  // and `the-plate` while the declared ids were `plan` and `plate`, so the plate
  // carried SIX product planets against four in the file and nothing on screen
  // said which two were a typo. The reference survives; it is now marked.
  for (const [of, steps] of undeclared) {
    declared.set(of, { id: of, name: of.replace(/-/g, ' '), declared: false, steps, features: [] });
  }
  // Feature ids are unique among FEATURES. They deliberately do NOT share the
  // step id space: a feature and the step that builds it are usually named after
  // the same thing ("Legend" / "legend"), so sharing one space renamed perfectly
  // good features to "legend-2" and reported it as an error on a correct file.
  // Custody stays unambiguous because resolveTarget() in signoff.mjs looks a
  // feature up FIRST, and a feature is the unit sign-off now addresses.
  const featIds = new Set();
  for (const pr of declared.values()) {
    for (const f of (pr.features || [])) f.id = uniq(featIds, f.id, 'feature');
  }
  const products = [...declared.values()];
  const allFeatures = products.flatMap((p) => p.features || []);

  return {
    project: clean(src.project || projectName, 120),
    collisions: collisions.length ? collisions : undefined,
    undeclared: undeclared.size
      ? [...undeclared.entries()].map(([id, steps]) => ({ id, steps }))
      : undefined,
    products,
    note: clean(src.note, 400) || undefined,
    updated: clean(src.updated, 40) || undefined,
    phases,
    totals: {
      products: products.length,
      features: allFeatures.length,
      phases: phases.length,
      phasesDone: phases.filter((p) => p.status === 'done').length,
      steps: allSteps.length,
      stepsDone: allSteps.filter((s) => s.status === 'done').length,
      stepsActive: allSteps.filter((s) => s.status === 'active').length,
    },
  };
}

export const emptyPlan = (projectName = '') => normalisePlan({ project: projectName, phases: [] }, projectName);

export function readPlan(root) {
  const file = planPathFor(root);
  let txt;
  try { txt = fs.readFileSync(file, 'utf8'); } catch { return { ...emptyPlan(path.basename(root)), exists: false, file }; }
  let raw;
  try { raw = JSON.parse(txt); } catch (e) {
    // A broken file is reported, never silently replaced with an empty plan:
    // silently emptying it would look identical to "no plan yet" and would hide
    // a typo that just deleted the operator's work from the screen.
    return { ...emptyPlan(path.basename(root)), exists: true, file, error: 'plan.json is not valid JSON: ' + String(e.message).slice(0, 120) };
  }
  // Parsing is not the test. `null`, `[]` and `"a string"` all parse, and all
  // three used to come back as a perfectly valid plan with zero steps — which
  // renders identically to a project that has never declared one, and offers a
  // button to write a starter plan over the top of it. This file's own comment
  // says silently emptying "would look identical to no plan yet"; that is what
  // it did, one layer up.
  const shaped = raw && typeof raw === 'object' && !Array.isArray(raw);
  if (!shaped) {
    const what = raw === null ? 'null' : Array.isArray(raw) ? 'a list' : typeof raw;
    return { ...emptyPlan(path.basename(root)), exists: true, file,
      error: `plan.json is valid JSON but it is not a plan: the file contains ${what}, and a plan is an object with a "phases" list.` };
  }
  if (!('phases' in raw) && !('products' in raw)) {
    return { ...emptyPlan(path.basename(root)), exists: true, file,
      error: 'plan.json has no "phases" and no "products", so there is nothing in it a plan is made of. Nothing has been changed.' };
  }
  return { ...normalisePlan(raw, path.basename(root)), exists: true, file };
}

// The plan is the one artefact here a PERSON writes by hand, and it is the thing
// the whole spine is built on. So a write that would erase it is refused rather
// than performed: a body the normaliser cannot find any steps in used to replace
// five real steps with an empty file and answer ok:true. Every write also leaves
// the previous file beside it, because there is no other copy of his intent.
export class PlanWriteRefused extends Error {}

export function writePlan(root, plan, { force = false } = {}) {
  const file = planPathFor(root);
  const norm = normalisePlan(plan, path.basename(root));
  const prev = readPlan(root);
  // A file we could not READ is the one file a write must never land on: its
  // contents are unknown, so "this would erase five steps" cannot be computed
  // and the erase guard silently passes.
  if (!force && prev.exists && prev.error) {
    throw new PlanWriteRefused(
      'refusing to write over a plan.json that could not be read. ' +
      `Fix the file first, or send force:true to replace it. (${prev.error})`);
  }
  if (!force && prev.exists && !prev.error && prev.totals.steps > 0 && norm.totals.steps === 0) {
    throw new PlanWriteRefused(
      `refusing to replace a plan of ${prev.totals.steps} step(s) with an empty one. ` +
      'Send force:true if that is genuinely what you meant.');
  }
  if (prev.exists) { try { fs.copyFileSync(file, file + '.bak'); } catch {} }
  const out = {
    project: norm.project,
    note: norm.note,
    updated: new Date().toISOString().slice(0, 10),
    // only products the operator actually declared are written back; inferred
    // ones are derived on read, so the file stays what he wrote
    products: norm.products.filter((p) => p.declared).map((p) => ({ id: p.id, name: p.name, ...(p.note ? { note: p.note } : {}), ...(p.home ? { home: p.home } : {}) })),
    phases: norm.phases.map((p) => ({
      id: p.id, title: p.title,
      steps: p.steps.map((s) => ({
        id: s.id, title: s.title, status: s.status,
        ...(s.note ? { note: s.note } : {}),
        ...(s.produces ? { produces: s.produces } : {}),
      })),
    })),
  };
  writeJsonAtomic(file, out);
  // Ids are written back explicitly, so once a plan has passed through here it
  // says who each step is and can be reordered without moving anyone's sign-off.
  return { ...readPlan(root) };
}

// Watching the file directly, so editing it in the editor moves the spine
// without a reload. The plan is the one thing here a person writes by hand, so
// it has to answer to the hand.
export function watchPlan(root, onChange, { pollMs = 900, file: overrideFile = null } = {}) {
  const file = overrideFile || planPathFor(root);
  let last = '';
  let stopped = false;
  const tick = () => {
    if (stopped) return;
    let sig = '';
    try { const st = fs.statSync(file); sig = st.mtimeMs + ':' + st.size; } catch { sig = 'none'; }
    if (sig !== last) { last = sig; onChange(readPlan(root)); }
  };
  tick();
  const timer = setInterval(tick, pollMs);
  if (timer.unref) timer.unref();
  return { close() { stopped = true; clearInterval(timer); } };
}
