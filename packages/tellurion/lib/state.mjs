// The world model and its reducer. One module, imported by the server AND by the
// browser (the server serves /lib/*.mjs), so both sides run the same semantics.
// The world is static truth (the entity graph in world.stat) plus a live overlay:
// pulses, transients, commits, ticker, drive. Everything serializes.

import { makeAttributor } from './attribute.mjs';
import { tierFor, tierRank, TIERS } from './tiers.mjs';

let SEQ = 1;
export function seedSeq(n) { SEQ = Math.max(SEQ, n); }
function nextId() { return 'x' + (SEQ++).toString(36); }

export function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const ATTR = new WeakMap();
function attributor(world) {
  let a = ATTR.get(world.stat);
  if (!a) { a = makeAttributor(world.stat); ATTR.set(world.stat, a); }
  return a;
}

export function createWorld(name, root, stat) {
  return {
    v: 2,
    project: { name, root, branch: '', head: '', startedAt: 0 },
    drive: { energy: 0, rpm: 0.42, lastEventAt: 0, totalEvents: 0 },
    stat,
    pulses: {},        // entityId -> { n, lastAt, kind }  (session only)
    usage: {},         // entityId -> { n, lastAt }  PERSISTED: what this project has used
    transients: [],    // { id, kind, target, targetKind, label, at, ttl }
    notches: [],       // commits { sha, short, subject, at, pre, entity }
    session: { todoTotal: 0, todoDone: 0, active: '' },
    agents: {},        // name -> { name, lastAt, target, targetKind, runs }
    activeStep: null,  // the declared plan step currently in hand
    stepWork: {},      // stepId -> { paths: [], entities: [], commits: [], first, last }


    ticker: [],        // { at, kind, text } — a ring buffer, capped at TICKER_CAP
    tickerSeq: 0,      // monotonic count of pushes; the cap makes length useless
    counts: { files: 0, edits: 0, tools: 0, commits: 0, faults: 0, events: 0 },
  };
}

// ---------- drive ----------
const TAU = 75000;
export function bumpDrive(world, at, amount = 8) {
  // world.quiet: the server sets it while a transcript BACKLOG is draining.
  // History builds the graph and the attribution record, but it is not live
  // work, and the gauge's whole claim is "the rate the fleet is working NOW".
  // Git history already carries `pre` for the same reason; this is the session
  // feed's half of that rule.
  if (world.quiet) return;
  decayDrive(world, at);
  const d = world.drive;
  d.energy = Math.min(140, d.energy + amount);
  d.lastEventAt = at;
  d.totalEvents++;
  d.rpm = rpmOf(d.energy);
}
export function decayDrive(world, now) {
  const d = world.drive;
  if (!d.lastEventAt) return;
  const dt = Math.max(0, now - d.lastEventAt);
  if (dt > 0) d.energy = d.energy * Math.exp(-dt / TAU);
  d.rpm = rpmOf(d.energy);
}
function rpmOf(e) { return +(0.42 + 5.6 * (1 - Math.exp(-e / 26))).toFixed(3); }

// ---------- overlay helpers ----------
const TTL = { ring: 2600, comet: 9000, spark: 3000, fault: 8000 };

function pulse(world, id, kind, at) {
  if (!id) return;
  // Every pulse is also a durable record that this project has used the thing.
  const u = world.usage[id] || (world.usage[id] = { n: 0, lastAt: 0 });
  u.n++; u.lastAt = Date.now(); world.usageDirty = true;
  const p = world.pulses[id] || (world.pulses[id] = { n: 0, lastAt: 0, kind });
  p.n++; p.lastAt = at;
  world.transients.push({ id: nextId(), kind: 'ring', target: id, targetKind: kind, label: '', at, ttl: TTL.ring });
}

// The ticker is a RING BUFFER, so its length is not a change signal: once it is
// full, length sits at the cap forever while the contents keep moving. A client
// that watched the length therefore stopped repainting at event 240 and showed a
// frozen line with a frozen timestamp, which reads as "nothing is happening"
// rather than as a stall. The sequence is what actually counts events, so that
// is what both sides watch.
export const TICKER_CAP = 240;

// Harness plumbing is not work. Hook output, system reminders, tool-result
// envelopes and interruption notices all arrive on the same feed as real
// activity, and they used to be filtered in the BROWSER only, so the raw text
// still travelled the wire and still landed in a published archive. It is
// refused at the door now, in the one reducer both sides run.
export const NOISE = /<(system-reminder|command-message|command-name|local-command|task-notification|persisted-output)|\[Image|\[Request interrupted|Multiply coordinates|hook feedback|hook success|STOP BLOCKED|Caveat: The messages below|This is how Claude Code surfaces/i;

export function push(world, kind, text, at = 0) {
  const t = String(text == null ? '' : text);
  if (!t.trim() || NOISE.test(t)) return;
  // The ticker is the LIVE stream. During a backlog drain (world.quiet) the
  // record still lands — graph, attribution, usage — but hours-old rows do not
  // scroll past as though they just happened.
  if (world.quiet) return;
  world.ticker.push({ at, kind, text: t.slice(0, 160) });
  world.tickerSeq = (world.tickerSeq || 0) + 1;
  if (world.ticker.length > TICKER_CAP) world.ticker.splice(0, world.ticker.length - TICKER_CAP);
}

export function prune(world, now) {
  world.transients = world.transients.filter(t => now - t.at < t.ttl);
  if (world.notches.length > 80) world.notches.splice(0, world.notches.length - 80);
}

// ---------- genesis: a new project grows its own graph from activity ----------
function genesisPlanet(world, dir) {
  // With a declared plan the graph is declared, so a directory never invents a
  // planet. Guessing alongside a declaration is how the two disagree.
  if (world.planDrivesGraph) return null;
  let p = world.stat.planets.find(pl => pl.id === 'dir:' + dir);
  if (!p) {
    // A DIRECTORY IS NOT A PRODUCT. This is the fallback for a project that has
    // declared no plan. It stays visible, because something to look at before
    // you declare a plan is useful, and it is marked `declared: false` so every
    // surface already treats it honestly: the header does not count it as a
    // product, the spine does not list it, and the plate draws it as a dashed
    // ghost rather than a real body. (An earlier version of this comment
    // attributed the no-invention rule to an operator ruling of 2026-08-24. No
    // such ruling exists; the attribution was an LLM assumption. ADR-0134.)
    p = { id: 'dir:' + dir, name: dir, tier: 'flagship', status: 'dormant', declared: false,
          one_liner: 'a directory, not a declared product', home: '' };
    world.stat.planets.push(p);
  }
  return p;
}

function genesisFile(world, { path, created, at }) {
  const norm = String(path || '').replace(/\\/g, '/').replace(/^\.\//, '');
  const dir = norm.includes('/') ? norm.split('/')[0] : '(root)';
  const p = genesisPlanet(world, dir);
  world.counts[created ? 'files' : 'edits']++;
  world.counts.events++;
  bumpDrive(world, at, created ? 10 : 6);
  // With a declared plan the graph is declared, so a stray file still counts as
  // activity but grows nothing. It has no planet to belong to, and inventing one
  // beside the declaration is how the two come to disagree.
  if (!p) {
    push(world, created ? 'file' : 'edit', (created ? 'built ' : 'edit ') + norm.split('/').pop(), at);
    return null;
  }
  if (created) {
    const fid = 'file:' + norm;
    const already = world.stat.features.some(f => f.id === fid);
    const nFor = world.stat.features.filter(f => f.parent === p.id).length;
    if (!already && nFor < 12) {
      const base = norm.split('/').pop();
      // 'open', never 'claimed'. Saving a file is not a builder saying the work
      // is done, and the server granting the first rung of the ladder by itself
      // is exactly what the three-file split exists to prevent.
      world.stat.features.push({ id: fid, name: base, plain: base, parent: p.id, status: 'open' });
    }
  }
  pulse(world, p.id, 'planet', at);
  push(world, created ? 'file' : 'edit', (created ? 'built ' : 'edit ') + norm.split('/').pop(), at);
  return p.id;
}

// ---------- reducer verbs ----------
// The spine and the orrery are joined by ATTRIBUTION, and the claim it makes is
// deliberately narrow: this body was produced while that step was in hand. It is
// a record of WHEN, not a guess about what the words mean, which is why it holds
// up when the plan is hand written in whatever language the operator likes.
// The declared plan IS the entity graph when one exists. A product becomes a
// planet and a step that produces a feature becomes a moon of it, carrying the
// STEP'S OWN id and title. So the spine row and the body on the plate are one
// record seen twice, and renaming the step renames the moon. Two copies of a
// name would drift apart on the first edit.
//
// A plan can carry a feature as far as CLAIMED and no further. `done` in a plan
// is the operator saying it is finished, which is a claim; the halo is
// independent evidence and cannot be typed into a file.
// Which product a phase plainly belongs to: the one every step in it that says
// anything says. A phase whose steps name two different products names none.
function phaseOwnerOf(plan, ph) {
  const of = (ph.steps || []).map((st) => st.produces && st.produces.of).filter(Boolean);
  if (!of.length) {
    // A phase that names nothing at all still belongs somewhere when the plan
    // declares exactly one product; there is no ambiguity to protect against.
    return (plan.products || []).length === 1 ? plan.products[0].id : null;
  }
  return of.every((x) => x === of[0]) ? of[0] : null;
}

export function applyPlan(world, plan, signoffs = null) {
  world.plan = plan;
  const active = (plan && plan.phases || []).flatMap((ph) => ph.steps).find((st) => st.status === 'active');
  world.activeStep = active ? active.id : null;
  if (!plan || !plan.products || !plan.products.length) {
    // Delete the plan, or break it with a typo, and the bodies it declared used
    // to stay on the plate forever — including moons still wearing their rings.
    // A body whose declaration is gone is not evidence of anything.
    world.planDrivesGraph = false;
    world.stat.planets = (world.stat.planets || []).filter((x) => !String(x.id).startsWith('plan:'));
    world.stat.features = (world.stat.features || []).filter((x) => !String(x.id).startsWith('step:') && !String(x.id).startsWith('feat:'));
    return world;
  }

  world.planDrivesGraph = true;
  const keep = (world.stat.planets || []).filter((p) => !String(p.id).startsWith('plan:'));
  const planets = plan.products.map((pr) => ({
    id: 'plan:' + pr.id,
    name: pr.name,
    tier: 'flagship',
    // A product nobody declared is drawn DORMANT, which is the plate's existing
    // dashed-ghost form, so a typo can never again sit on the plate wearing the
    // same body as a real product.
    status: pr.declared === false ? 'dormant' : 'building',
    declared: pr.declared !== false,
    one_liner: pr.declared === false
      ? `not declared in products; named by ${pr.steps || 1} step${pr.steps === 1 ? '' : 's'}`
      : (pr.note || 'declared in the plan'),
    // The product's repo-relative home, when the plan declares one. Attribution
    // lights this planet for work under that path (ADR-0134, T4).
    home: pr.home || '',
  }));
  world.stat.planets = planets.concat(keep);

  // FEATURES COME FROM THE PLAN, NOT FROM THE STEPS.
  // This block used to be `feats.push({ id: 'step:' + st.id, name: st.title })`:
  // every plan step was relabelled a feature, so "feature" was a display label
  // for "step" and nothing else. A step is a unit of work and reads as a verb
  // ("Resolve a project to its git root"); a feature is a part of the product
  // and reads as a noun ("Project discovery"). Printing the first where the
  // second belongs is what made the spine read as a worklog rather than as a
  // product. A feature is now DECLARED on its product, so it exists before any
  // step targets it, which is what lets the spine show work not yet started.
  const feats = [];
  const loose = new Map(); // product id -> steps that name no feature

  // Per-step custody stays STEP-addressed. The nested view still shows who
  // signed each piece of work, and every sign-off already on disk keeps working.
  const stepRow = (ph, st) => {
    const v = signoffs && signoffs.verdicts ? signoffs.verdicts.get(st.id) : null;
    const a = signoffs && signoffs.accepted ? signoffs.accepted.get(st.id) : null;
    const wd = signoffs && signoffs.withdrawn ? signoffs.withdrawn.get(st.id) : null;
    const t = tierFor(st.status, v, a, st, wd);
    return {
      id: st.id, title: st.title, status: t.tier, planStatus: st.status,
      signedBy: t.by || undefined, inHand: st.status === 'active' || undefined,
      staleVerdict: t.staleVerdict, staleAccept: t.staleAccept,
      failedBy: t.failedBy, failedNote: t.failedNote,
      verdictVia: v && v.via, verdictMatched: v && v.matched, phase: ph.id,
    };
  };

  const stepsOfFeature = new Map();
  for (const ph of plan.phases) {
    for (const st of ph.steps) {
      // A step that names no product joins the one its phase plainly belongs to.
      const owner = (st.produces && st.produces.of) || phaseOwnerOf(plan, ph);
      if (!owner) continue;
      const row = stepRow(ph, st);
      row.product = owner;
      const fid = st.produces && st.produces.feature;
      if (fid) {
        if (!stepsOfFeature.has(fid)) stepsOfFeature.set(fid, []);
        stepsOfFeature.get(fid).push(row);
      } else {
        if (!loose.has(owner)) loose.set(owner, []);
        loose.get(owner).push(row);
      }
    }
  }

  // Custody is addressed to the FEATURE (decision D3, 2026-08-30: "has to be
  // feature ... a visual cue that something has been verified is a key
  // highlight of this project"). Every sign-off already on disk is keyed by
  // STEP id, so rather than voiding them, a feature with no verdict of its own
  // INHERITS one when every step under it was passed. The inherited row carries
  // no fingerprint, which tiers.mjs already honours as predating the scheme, so
  // nothing signed before this change is lost.
  const rollup = (map, steps) => {
    if (!map || !steps.length) return null;
    const rows = steps.map((x) => map.get(x.id));
    if (rows.some((r) => !r)) return null;                       // not every step was signed
    const bad = rows.find((r) => r.pass === false);
    if (bad) return { ...bad, inherited: true };                 // one rejection sinks the feature
    const by = [...new Set(rows.map((r) => r.by).filter(Boolean))].join(', ');
    const at = rows.map((r) => r.at).filter(Boolean).sort().pop();
    return { by: by || 'the judge', pass: true, at, inherited: true };
  };

  for (const pr of plan.products) {
    for (const f of (pr.features || [])) {
      const steps = stepsOfFeature.get(f.id) || [];
      // The builder claims a feature when the work under it is done. A feature
      // with no steps yet has only its own declared status to go on.
      const claimed = steps.length ? steps.every((x) => x.planStatus === 'done') : f.status === 'done';
      const key = { id: f.id, title: f.name };
      const sg = signoffs || {};
      const v = (sg.verdicts && sg.verdicts.get(f.id)) || rollup(sg.verdicts, steps);
      const a = (sg.accepted && sg.accepted.get(f.id)) || rollup(sg.accepted, steps);
      const wd = sg.withdrawn ? sg.withdrawn.get(f.id) : null;
      const t = tierFor(claimed ? 'done' : 'planned', v, a, key, wd);
      feats.push({
        id: 'feat:' + f.id, feature: f.id, parent: 'plan:' + pr.id,
        name: f.name, title: f.name, plain: f.note || f.name,
        status: t.tier, signedBy: t.by || undefined,
        // In hand is a different axis from the ladder: it says work is happening
        // right now, which no sign-off can express.
        inHand: steps.some((x) => x.planStatus === 'active') || undefined,
        staleVerdict: t.staleVerdict, staleAccept: t.staleAccept,
        failedBy: t.failedBy, failedNote: t.failedNote,
        verdictVia: v && v.via, verdictMatched: v && v.matched,
        inherited: (v && v.inherited) || undefined,
        steps, stepsDone: steps.filter((x) => x.planStatus === 'done').length,
      });
    }
  }

  // Steps naming a product but no feature are NOT promoted into features: that
  // promotion is the bug this change removes. They hang off the product so no
  // work is lost and the gap stays visible instead of being disguised.
  for (const pl of planets) {
    pl.loose = loose.get(String(pl.id).slice('plan:'.length)) || [];
  }

  const kept = (world.stat.features || []).filter((f) => !String(f.id).startsWith('step:') && !String(f.id).startsWith('feat:'));
  world.stat.features = feats.concat(kept);

  // A product is only as far along as its LEAST advanced feature. One unproven
  // part is enough to hold the whole product short of the tier above it: a
  // product is not finished while a piece of it is unexamined.
  for (const pl of planets) {
    // An undeclared product keeps its dormant ghost form. Rolling its work up
    // into a tier would hand a typo the same badge a real product earns.
    if (pl.declared === false) continue;
    const mine = feats.filter((f) => f.parent === pl.id).map((f) => f.status);
    if (!mine.length) { pl.status = 'building'; continue; }
    const low = Math.min(...mine.map((x) => tierRank(x)));
    pl.status = TIERS[low] === 'open' ? 'building' : TIERS[low];
  }
  return world;
}

export function setActiveStep(world, id) {
  world.activeStep = id || null;
  return world.activeStep;
}

function creditStep(world, { path: rel, entity, sha, at }) {
  const id = world.activeStep;
  if (!id) return null;
  const w = world.stepWork[id] || (world.stepWork[id] = { paths: [], entities: [], commits: [], first: at, last: at });
  w.last = at;
  if (rel && !w.paths.includes(rel)) { w.paths.push(rel); if (w.paths.length > 400) w.paths.shift(); }
  if (entity && !w.entities.includes(entity)) w.entities.push(entity);
  if (sha && !w.commits.includes(sha)) w.commits.push(sha);
  return w;
}

export function stepWorkOf(world, id) { return world.stepWork[id] || null; }

export function applyFile(world, { path, created, removed, at }) {
  if (removed) return null;
  if (world.stat.genesis) {
    const g = genesisFile(world, { path, created, at });
    creditStep(world, { path, entity: g, at });
    return g;
  }
  const entity = attributor(world).planetForPath(path);
  creditStep(world, { path, entity, at });
  world.counts[created ? 'files' : 'edits']++;
  world.counts.events++;
  bumpDrive(world, at, created ? 10 : 6);
  if (entity) pulse(world, entity, 'planet', at);
  const base = String(path || '').split('/').pop();
  push(world, created ? 'file' : 'edit', (created ? 'built ' : 'edit ') + base, at);
  return entity;
}

// An agent is not a workflow and is not a product. It carries no features and
// is never drawn like one: all it reports is that it exists, whether it is
// working, and what it is working on. Anything else would be inventing detail
// the transcript does not have.
export const AGENT_IDLE_MS = 4 * 60_000;

export function applyAgent(world, { name, target, targetKind, at }) {
  if (!name) return null;
  const key = String(name).slice(0, 60);
  const a = world.agents[key] || (world.agents[key] = { name: key, lastAt: 0, target: null, targetKind: null, runs: 0 });
  a.lastAt = at;
  a.runs += 1;
  if (target) { a.target = target; a.targetKind = targetKind || 'planet'; }
  push(world, 'agent', key + ' working' + (target ? ' on ' + String(target).replace(/^dir:/, '') : ''), at);
  return a;
}

export function agentList(world, now) {
  return Object.values(world.agents || {})
    .map((a) => ({ ...a, active: (now - a.lastAt) < AGENT_IDLE_MS }))
    .sort((x, y) => (y.active - x.active) || (y.lastAt - x.lastAt));
}

export function applyTool(world, { name, input, at }) {
  world.counts.tools++;
  world.counts.events++;
  bumpDrive(world, at, 5);

  // A dispatched agent takes the agent path, never the comet path: a comet said
  // "a workflow ran", which is a different claim and the wrong shape.
  const sub = input && input.subagent_type;
  if (sub || String(name) === 'Task') {
    const who = sub || 'agent';
    const desc = (input && (input.description || input.title)) || '';
    const guess = attributor(world).planetForSubject(desc || who);
    applyAgent(world, { name: who, target: guess || null, targetKind: 'planet', at });
    if (guess) pulse(world, guess, 'planet', at);
    return { kind: 'agent', id: who };
  }

  const hit = attributor(world).forTool(name, input);
  if (hit && hit.kind === 'workflow') {
    if (hit.id) pulse(world, hit.id, 'workflow', at);
    world.transients.push({
      id: nextId(), kind: 'comet', target: hit.id, targetKind: 'workflow',
      label: (input && (input.skill || input.subagent_type)) || String(name), at, ttl: TTL.comet,
    });
    push(world, 'flow', 'workflow ' + ((input && (input.skill || input.subagent_type)) || name), at);
  } else if (hit && hit.kind === 'tool') {
    pulse(world, hit.id, 'tool', at);
    push(world, 'tool', 'ran ' + (world.stat.tools.find(t => t.id === hit.id) || { name }).name, at);
  } else {
    // Name what happened, not which tool did it. Two thirds of the ticker was the
    // literal word "Bash" repeated, which is the tool's name and never the work.
    const what = input && (input.description || input.command || input.file_path || input.pattern || input.query || input.url || input.skill);
    const said = what ? `${String(name).toLowerCase()} ${String(what).replace(/\s+/g, ' ').slice(0, 90)}` : String(name);
    world.transients.push({ id: nextId(), kind: 'spark', target: null, targetKind: null, label: String(name), at, ttl: TTL.spark });
    push(world, 'tool', said, at);
  }
  return hit;
}

export function applyTodos(world, { todos, at }) {
  if (!Array.isArray(todos)) return;
  if (world.stat.genesis) {
    // the session plan IS the spine: one milestone per plan item, statuses live
    const day = new Date(at).toISOString().slice(0, 10);
    const seen = new Set();
    for (const t of todos) {
      const key = 'g' + hash32(String(t.content || ''));
      seen.add(key);
      let m = world.stat.milestones.find(x => x.id === key);
      const status = t.status === 'completed' ? 'done' : t.status === 'in_progress' ? 'in-progress' : 'planned';
      if (!m) world.stat.milestones.push({ id: key, entity: 'plan', label: t.content, plain: t.content, date: day, status, at });
      else if (m.status !== status) { m.status = status; if (status === 'done') m.at = at; }
    }
    world.stat.milestones = world.stat.milestones.filter(m => m.entity !== 'plan' || seen.has(m.id) || m.status === 'done');
  }
  world.session.todoTotal = todos.length;
  world.session.todoDone = todos.filter(t => t.status === 'completed').length;
  const act = todos.find(t => t.status === 'in_progress');
  world.session.active = act ? (act.activeForm || act.content || '') : '';
  world.counts.events++;
  bumpDrive(world, at, 4);
  if (act) push(world, 'plan', 'working: ' + (act.activeForm || act.content), at);
  return null;
}

export function applyFault(world, { label, detail, at }) {
  world.counts.faults++;
  world.counts.events++;
  bumpDrive(world, at, 3);
  // `label` is always the literal "tool error", so the `|| detail` arm could
  // never be reached and every fault in the ticker read the same six words. On
  // the one class of event that matters when something breaks, the screen said
  // nothing about what broke.
  const said = String(detail || label || 'fault').replace(/\s+/g, ' ').trim();
  world.transients.push({ id: nextId(), kind: 'fault', target: null, targetKind: null, label: said.slice(0, 40), at, ttl: TTL.fault });
  push(world, 'fault', 'fault: ' + said.slice(0, 110), at);
  return null;
}

export function applyPrompt(world, { text, at }) {
  world.counts.events++;
  bumpDrive(world, at, 6);
  push(world, 'prompt', '> ' + String(text || '').slice(0, 120), at);
  return null;
}

export function applyCommit(world, { sha, subject, at, pre }) {
  // Only commits that land WHILE the step is in hand are credited to it. The
  // git poll replays up to 48 hours of history at boot, and this used to credit
  // every one of those to whatever step happened to be active at the time — so
  // the attribution record claimed work done days earlier. That was survivable
  // while nothing read the record; it is not, now that a judge's verdict is
  // placed on a step by matching against it.
  if (!pre) creditStep(world, { sha, at });
  if (world.notches.some(n => n.sha === sha)) return null;
  const entity = attributor(world).planetForSubject(subject);
  world.notches.push({ sha, short: String(sha).slice(0, 8), subject, at, pre: !!pre, entity });
  if (!pre) {
    world.counts.commits++;
    world.counts.events++;
    bumpDrive(world, at, 12);
    if (entity) pulse(world, entity, 'planet', at);
    push(world, 'commit', 'commit ' + String(sha).slice(0, 8) + ' ' + String(subject).slice(0, 70), at);
  }
  return entity;
}
