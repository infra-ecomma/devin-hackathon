#!/usr/bin/env node
// propose-plan — draft a .tellurion/plan.json for a project from sources that
// already exist, so applying Tellurion to a repo is one command plus an edit
// rather than hand-authoring JSON.
//
// Measured 2026-08-28: the reader discovers 22 projects on this machine and
// exactly ONE has a plan. Without a plan the instrument falls back to drawing
// directories as planets and files as moons, which is the model the operator
// rejected. This closes the gap between "a repo exists" and "the instrument
// draws its products".
//
// It NEVER invents. Every product and every feature it writes cites the file it
// was read from, and anything it cannot source is left for the operator rather
// than filled in. A draft you must edit is the point: the plan is a declaration,
// and only a person can declare.
//
//   node bin/propose-plan.mjs <project-path>              # print the draft
//   node bin/propose-plan.mjs <project-path> --write       # write .tellurion/plan.json
//   node bin/propose-plan.mjs <project-path> --write --force
//
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const has = (f) => argv.includes('--' + f);
const val = (f, d) => { const i = argv.indexOf('--' + f); return i >= 0 && argv[i + 1] ? argv[i + 1] : d; };
const ROOT = path.resolve(argv.find((a) => !a.startsWith('--')) || process.cwd());
const MAX_FEATURES = Number(val('max-features', 40));

if (!fs.existsSync(ROOT)) { console.error('no such project: ' + ROOT); process.exit(2); }

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
const read = (p) => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const firstExisting = (...rels) => rels.map((r) => path.join(ROOT, r)).find((p) => fs.existsSync(p)) || null;

// ---------- products: from the spec's own declaration, never from directories ----------
function specFile() {
  const direct = firstExisting('docs/PRODUCT-SPEC.md', 'PRODUCT-SPEC.md', 'docs/product-spec.md');
  if (direct) return direct;
  const dir = path.join(ROOT, 'product');
  if (fs.existsSync(dir)) {
    const hit = fs.readdirSync(dir).find((f) => /product-spec\.md$/i.test(f));
    if (hit) return path.join(dir, hit);
  }
  return null;
}

// A slug that must be short: cut at the last word boundary inside the limit
// rather than mid-word — this id is written into a file a person reads.
const shortSlug = (s, n = 24) => {
  const t = slug(s).slice(0, n);
  const cut = t.lastIndexOf('-');
  return (cut > 8 ? t.slice(0, cut) : t) || 'step';
};

// The strongest source a spec can carry: the two sections inception's spec
// stage writes and the operator approves — "## Products" (what is being built,
// each with the directory that will hold it) and "## Build story" (the phases
// and steps in the order a person would tell the build). A spec written in
// this shape is already a declaration, so the parse is exact rather than
// mined: every product id, home, phase, step and binding traces to the line
// the operator read and approved.
function section(txt, name) {
  const m = new RegExp('^##\\s+' + name + '\\s*$', 'im').exec(txt);
  if (!m) return null;
  const rest = txt.slice(m.index + m[0].length);
  const end = /^##\s/m.exec(rest);
  return end ? rest.slice(0, end.index) : rest;
}

// - **Reader** (`reader`) — discovers projects. Home: `lib/reader/`.
// The id and the home are optional; the name is not. A home that does not
// exist in the tree is dropped, never carried (a path is verified or absent).
function productsSection(txt) {
  const sec = section(txt, 'Products');
  if (!sec) return [];
  const out = [];
  for (const ln of sec.split('\n')) {
    const b = /^\s*[-*]\s+\*\*(.+?)\*\*\s*(?:\(`([^`]+)`\))?\s*(?:[—–-]\s*(.*))?$/.exec(ln);
    if (!b) continue;
    const name = b[1].replace(/\s*\(.*?\)\s*$/, '').trim();
    if (!name || name.length >= 60) continue;
    let note = (b[3] || '').trim();
    let home;
    const h = /Home:\s*`([^`]+)`/.exec(note);
    if (h) {
      home = h[1].replace(/\/+$/, '');
      note = note.replace(h[0], '').replace(/\s{2,}/g, ' ').replace(/[\s.]+$/, '').trim();
      if (home && !fs.existsSync(path.join(ROOT, home))) home = undefined; // verified or absent
    }
    out.push({ id: slug(b[2] || name), name, note: note || undefined, home, fromSpec: true });
  }
  return out;
}

// ### Phase 1: Foundation            (the "Phase N:" prefix is optional)
// 1. Discover projects from the tree → `reader`
// A step binds to its product with a trailing arrow and the product's id in
// backticks; a step without an arrow is kept unbound rather than dropped.
function buildStorySection(txt) {
  const sec = section(txt, 'Build story');
  if (!sec) return [];
  const phases = [];
  let cur = null;
  for (const ln of sec.split('\n')) {
    const h = /^###\s+(?:Phase\s+\d+[.:]\s*)?(.+?)\s*$/.exec(ln);
    if (h) { cur = { id: slug(h[1]), title: h[1].trim(), steps: [] }; phases.push(cur); continue; }
    const s = /^\s*(?:[-*]|\d+\.)\s+(.+?)\s*$/.exec(ln);
    if (!s || !cur) continue;
    let title = s[1];
    let of;
    const bind = /\s*(?:→|->)\s*`([^`]+)`\s*$/.exec(title);
    if (bind) { of = bind[1].trim(); title = title.slice(0, bind.index).trim(); }
    const step = { id: shortSlug(title), title: title.slice(0, 160), status: 'planned' };
    if (of) step.produces = { of };
    cur.steps.push(step);
  }
  // De-dupe step ids; two steps may slug to the same words.
  const used = new Set();
  for (const ph of phases) for (const st of ph.steps) {
    let id = st.id;
    for (let n = 2; used.has(id); n++) id = st.id + '-' + n;
    st.id = id; used.add(id);
  }
  return phases.filter((p) => p.steps.length);
}

function productsFrom(file) {
  const txt = read(file);
  if (!txt) return [];
  const lines = txt.split('\n');
  // A "### 4.1 Name" run under a heading that calls them pillars or products is
  // the strongest signal a repo can give about what its products ARE.
  let inProductSection = false;
  const out = [];
  lines.forEach((ln, i) => {
    const h2 = /^##\s+(.*)$/.exec(ln);
    if (h2) inProductSection = /pillar|product/i.test(h2[1]) && !/^#{3}/.test(ln);
    // The NUMBER is the signal. A spec that numbers its pillars 4.1, 4.2, 4.3 is
    // telling you which headings are products; the unnumbered ones under them
    // ("Page zoom") are amendments and features, and taking those produced 28
    // "products" for a repo that has about 18. A letter suffix (4.2b, 4.2c) is a
    // later amendment to the pillar above it, not a pillar of its own.
    const h3 = /^###\s+(\d+)\.(\d+)([a-z]?)\s+(.+?)\s*$/.exec(ln);
    if (h3 && inProductSection && !h3[3]) {
      const name = h3[4].replace(/\s*\(.*?\)\s*$/, '').trim();
      if (name && name.length < 60) out.push({ id: slug(name), name, note: `from ${path.relative(ROOT, file)}:${i + 1}` });
    }
  });
  return out;
}

// ---------- features: from the Features Ledger, which already records them ----------
function featuresFrom() {
  const f = firstExisting('features-ledger/ledger.jsonl');
  if (!f) return { rows: [], source: null };
  const claimed = new Set();
  const rows = [];
  for (const ln of read(f).split('\n')) {
    if (!ln.trim()) continue;
    let r; try { r = JSON.parse(ln); } catch { continue; }
    if (r.type === 'claim' && r.itemId) claimed.add(r.itemId);
    if (r.type === 'capture' && r.kind === 'feature' && r.content) rows.push(r);
  }
  for (const r of rows) r.done = claimed.has(r.itemId);
  return { rows, source: path.relative(ROOT, f) };
}

const specPath = specFile();
const specTxt = specPath ? read(specPath) : null;
// The approved-sections shape outranks mining: when the spec declares its
// products and its build story outright, that IS the operator-approved plan,
// and parsing it is exact. The pillar headings and the ledger remain the
// fallback for specs written before the shape existed.
const specProducts = specTxt ? productsSection(specTxt) : [];
const specStory = specTxt ? buildStorySection(specTxt) : [];
const products = specProducts.length ? specProducts : (specPath ? productsFrom(specPath) : []);
const { rows: featRows, source: featSource } = featuresFrom();

// ---------- assignment: match on the product's own words, never a guess ----------
const stop = new Set(['the', 'a', 'an', 'and', 'of', 'for', 'to', 'in', 'on', 'with', 'per']);
const keysFor = (p) => p.name.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !stop.has(w));
const assign = (text) => {
  const t = text.toLowerCase();
  let best = null, bestN = 0;
  for (const p of products) {
    const n = keysFor(p).filter((k) => t.includes(k)).length;
    if (n > bestN) { best = p; bestN = n; }
  }
  return bestN > 0 ? best.id : null;
};

let phases;
if (specStory.length) {
  // The build story is already phases and steps in story order. Steps whose
  // binding names a product the Products section did not declare still land:
  // the plan normaliser infers that product from the reference and marks it
  // undeclared, which is the honest rendering of a spec the operator approved.
  phases = specStory;
} else {
  const picked = featRows.slice(-MAX_FEATURES);
  const byProduct = new Map();
  const unassigned = [];
  const usedIds = new Set();
  const stepId = (r) => {
    const cut = String(r.itemId || '').slice(0, 8);
    // 'f-' plus the ledger item's id when it has one, the row's own words when it
    // does not. Written as 'f-' + cut || slug the fallback could never fire —
    // 'f-' alone is already truthy — and every id-less row was named 'f-'.
    const base = cut ? 'f-' + cut : shortSlug(r.content);
    let id = base;
    // Two rows can share a truncated slug. A repeated id would let one sign-off
    // cover two different steps, so the draft de-dupes before the file exists.
    for (let n = 2; usedIds.has(id); n++) id = base + '-' + n;
    usedIds.add(id);
    return id;
  };
  for (const r of picked) {
    const of = assign(r.content);
    const step = {
      id: stepId(r),
      title: r.content.slice(0, 160),
      status: r.done ? 'done' : 'planned',
    };
    if (of) { step.produces = { of }; (byProduct.get(of) || byProduct.set(of, []).get(of)).push(step); }
    else unassigned.push(step);
  }

  phases = products
    .filter((p) => byProduct.has(p.id))
    .map((p) => ({ id: slug(p.name), title: p.name, steps: byProduct.get(p.id) }));
  if (unassigned.length) {
    phases.push({
      id: 'unassigned',
      title: 'Not yet assigned to a product',
      steps: unassigned,
    });
  }
}

const plan = {
  project: path.basename(ROOT),
  note: `Drafted by propose-plan on ${new Date().toISOString().slice(0, 10)}. EDIT THIS: `
      + (specStory.length
        ? `products and the build story came from ${path.relative(ROOT, specPath)} (## Products, ## Build story), the sections the spec stage wrote and the operator approved`
        : `products came from ${specPath ? path.relative(ROOT, specPath) : 'no product spec found'}, features from ${featSource || 'no features ledger found'}`)
      + `. Nothing here was invented, and nothing here is declared until you have read it.`,
  // fromSpec is bookkeeping for this run's report, never written into the file.
  products: products.map(({ fromSpec, ...p }) => p),
  phases,
  updated: new Date().toISOString().slice(0, 10),
};

// ---------- report, then write only if asked ----------
const rel = (p) => (p ? path.relative(ROOT, p) : null);
const stepCount = phases.reduce((n, ph) => n + ph.steps.length, 0);
console.error(`propose-plan  ${ROOT}`);
console.error(`  products : ${products.length}${specPath ? '  from ' + rel(specPath) + (specProducts.length ? ' (## Products)' : '') : '  (NO product spec found — you must name them yourself)'}`);
if (specStory.length) {
  console.error(`  story    : ${phases.length} phases, ${stepCount} steps  from ## Build story (exact parse, all planned)`);
} else {
  const unassignedN = (phases.find((p) => p.id === 'unassigned') || { steps: [] }).steps.length;
  console.error(`  features : ${stepCount} of ${featRows.length}${featSource ? '  from ' + featSource : '  (NO features ledger found)'}`);
  console.error(`  assigned : ${stepCount - unassignedN} to a product, ${unassignedN} left for you`);
}
if (!products.length) console.error(`  NOTE     : with no products declared the instrument cannot draw the ratified model. Add them by hand.`);

if (!has('write')) { console.log(JSON.stringify(plan, null, 2)); process.exit(0); }
const out = path.join(ROOT, '.tellurion', 'plan.json');
if (fs.existsSync(out) && !has('force')) {
  console.error(`  REFUSED  : ${rel(out)} already exists. Re-run with --force to overwrite it.`);
  process.exit(3);
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(plan, null, 2) + '\n');
console.error(`  written  : ${rel(out)}`);
