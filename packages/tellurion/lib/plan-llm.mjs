// Plan drafting and spine reconciliation by the project's OWN harness
// (ADR-0134, T1 and T4; engine ruling 2026-08-29).
//
// The ruling: a plan may be DRAFTED by a model from the repo's real evidence,
// with logic rather than strict sourcing — a missing product spec does not mean
// a missing product. The model that drafts it is the harness already working in
// the project: the server spawns `claude -p` headless in the project root, and
// that agent reads the repo with its own tools instead of trusting a capped
// evidence pack. Subscription auth, no API keys anywhere in this file.
//
// The draft always lands editable and is not declared until the operator reads
// it. Reconciliation proposes `home` paths for products the deterministic
// matcher cannot connect; it proposes, it never silently rewrites.

import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';
import { spawn } from 'node:child_process';

const MODEL = process.env.TELLURION_DRAFT_MODEL || ''; // empty = the harness's own default
const TIMEOUT_MS = Number(process.env.TELLURION_DRAFT_TIMEOUT_MS || 420_000); // a real repo reads slower than a scratch one
const MAX_TURNS = Number(process.env.TELLURION_DRAFT_MAX_TURNS || 30);

// systemd's PATH is thin; resolve the harness once, from the stable symlink first.
function harnessBin() {
  for (const c of [path.join(os.homedir(), '.local', 'bin', 'claude'), '/usr/local/bin/claude']) {
    try { fs.accessSync(c, fs.constants.X_OK); return c; } catch {}
  }
  return 'claude'; // last resort: whatever PATH the server was born with
}

// A headless run of the project's own harness. The env passes through minus the
// nested-session markers, so a server started from inside a Claude session does
// not spawn children that refuse to run.
//
// settleWhen: the harness's own exit is not the success signal — hooks can hold
// a -p session open long after the work is on disk (measured 2026-08-29: the
// plan landed at ~100 s; the process was still alive at ~300 s). When a caller
// passes a settle check, landing it starts a short grace for the agent's own
// validation pass, then the child is asked to stop and the run resolves.
function runHarness(prompt, cwd, { settleWhen = null, graceMs = 10_000 } = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env };
    for (const k of Object.keys(env)) if (/^CLAUDE(CODE)?/i.test(k) && k !== 'CLAUDE_CONFIG_DIR') delete env[k];
    const args = ['-p', prompt, '--permission-mode', 'acceptEdits', '--max-turns', String(MAX_TURNS)];
    if (MODEL) args.push('--model', MODEL);
    const child = spawn(harnessBin(), args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '', err = '', killed = false, settled = false;
    const timer = setTimeout(() => { killed = true; child.kill('SIGTERM'); }, TIMEOUT_MS);
    if (timer.unref) timer.unref();
    let settlePoll = null;
    if (settleWhen) {
      settlePoll = setInterval(async () => {
        if (settled) return;
        let hit = false;
        try { hit = await settleWhen(); } catch {}
        if (!hit) return;
        settled = true;
        clearInterval(settlePoll);
        setTimeout(() => { try { child.kill('SIGTERM'); } catch {} }, graceMs).unref();
      }, 5000);
      if (settlePoll.unref) settlePoll.unref();
    }
    child.stdout.on('data', (d) => { out += d; if (out.length > 200_000) child.kill('SIGTERM'); });
    child.stderr.on('data', (d) => { err += d; if (err.length > 40_000) err = err.slice(-40_000); });
    child.on('error', (e) => { clearTimeout(timer); if (settlePoll) clearInterval(settlePoll); reject(new Error('could not start the harness: ' + e.message)); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (settlePoll) clearInterval(settlePoll);
      if (settled) return resolve(out.trim()); // the work landed; the process was only asked to catch up
      if (killed) return reject(new Error(`the harness draft ran past ${Math.round(TIMEOUT_MS / 1000)}s and was stopped`));
      if (code !== 0) return reject(new Error('the harness exited ' + code + ': ' + (err || out).trim().slice(-300)));
      resolve(out.trim());
    });
  });
}

const SCHEMA_NOTE = `The plan file schema, exactly:
{
  "project": "<repo name>",
  "products": [{ "id": "<kebab>", "name": "<plain name>", "note": "<what it is, one line>", "home": "<repo-relative path where it lives>",
                 "features": [{ "id": "<kebab>", "name": "<the part of the product, a noun>", "note": "<one line>" }] }],
  "phases": [{ "id": "<kebab>", "title": "<phase title>", "steps": [{ "id": "<kebab>", "title": "<what is or was done>", "status": "planned|active|done", "produces": { "of": "<product id>", "feature": "<feature id>" } }] }]
}`;

let running = false; // one draft at a time per server; a second click gets told

// Initialize (T1): draft the spine from the repo itself and WRITE the plan file.
// The server's file watcher lifts it onto the plate; the caller re-reads it.
export async function draftPlan(root) {
  if (running) throw new Error('a draft is already running for this project');
  running = true;
  try {
    const prompt = `You are drafting the initial plan for this project, the repo you are sitting in right now. The plan is read by a live instrument that draws the project as an orrery: declared products become planets, and plan steps that produce them become moons.

Read the repo with your own tools first — README, docs, STATUS.md, handoff notes, package files, directory layout, recent git history, whatever is actually here — and draft the plan the way a thoughtful engineer would after that read. A missing product spec file does NOT mean there are no products; infer them from the evidence. Use logic, not strict sourcing rules.

If .tellurion/plan.json already exists, read it too: it is the operator's previous declaration, evidence about intent. Keep what is still true, but never shrink the world to it — the repo as it actually is today outranks the old plan, and a re-draft exists precisely for when the two have drifted.

${SCHEMA_NOTE}

Rules:
- Products are the things this project is building or maintaining. Give each a "home": the repo-relative directory or file where it lives. Verify each home exists before you write it; if no path honestly fits, omit "home".
- FEATURES are the parts a product is made of, and they are what the instrument leads with, so they carry the most weight here. A feature is a PART you could draw a box around and point at: the plan spine, the live bridge, the render farm, the dispatch rail.
- THE TEST, and it is stricter than "use a noun": the name must read naturally after the word "the". "The render farm" works. "The project discovery" does not, because that is an activity, not a part. An activity noun built out of a step's verb ("Discover every project" becoming "Project discovery") is still that step wearing a costume, and it will read as a worklog on the screen exactly as the raw verb did. When a name fails the test, ask what THING does the work and name that instead: not "project discovery" but "the project index".
- A feature normally gathers SEVERAL steps. One feature per step means the layer is carrying no information: either the features are too small or the steps are written at capability size rather than work size. Prefer fewer, larger features and let each one hold the steps that build it.
- Declare a feature for work that has not started yet, wherever the repo's evidence says it is intended. A plan exists to say what the product WILL have; a feature with no steps under it is normal and correct.
- 2 to 6 phases, 3 to 12 steps each, describing real work — past, current, and planned — in the order a person would tell the story.
- status "done" only where the repo's own evidence says it happened (docs, commits, working code); "active" for clearly in-flight work; otherwise "planned".
- Every step names the product it builds in produces.of AND the feature it builds in produces.feature. A step whose feature you genuinely cannot place may omit "feature"; it is then shown separately as unplaced, so use that rather than inventing a feature to hold it.
- How many products and how many features is entirely up to the repo. Do not aim for a number.

Write the finished plan as JSON to the file .tellurion/plan.json in this repo (create the directory). Then validate it parses (for example with node -e 'JSON.parse(require("fs").readFileSync(".tellurion/plan.json","utf8"))') and fix it if not. The moment the file validates, reply with one short paragraph summarising what you wrote and STOP — the write is the work; do not keep exploring afterwards.`;
    // Settle when a NEW parseable plan with real steps is on disk — the file is
    // the work, and the process is only asked to catch up to it. On a re-draft
    // a plan file already exists, so the settle marker is the CONTENT CHANGING,
    // not the file existing (without this the poll saw the old file at second
    // five and killed the harness before it had read a thing).
    const file = path.join(root, '.tellurion', 'plan.json');
    const read = () => { try { return fs.readFileSync(file, 'utf8'); } catch { return ''; } };
    const before = read();
    const landed = () => {
      const now = read();
      if (!now || now === before) return false;
      try {
        const j = JSON.parse(now);
        // A plan with steps but no features is the old shape, and settling on it
        // would stop the agent before it wrote the half the spine leads with.
        const hasSteps = Array.isArray(j.phases) && j.phases.some((ph) => Array.isArray(ph.steps) && ph.steps.length);
        const hasFeats = Array.isArray(j.products) && j.products.some((p) => Array.isArray(p.features) && p.features.length);
        return hasSteps && hasFeats;
      } catch { return false; }
    };
    try {
      await runHarness(prompt, root, { settleWhen: landed });
    } catch (e) {
      // A timeout after the file landed is still a draft: the caller judges by
      // what reads from disk, so only a genuinely absent file is a failure here.
      if (!landed()) throw e;
    }
    if (!fs.existsSync(path.join(root, '.tellurion', 'plan.json'))) {
      throw new Error('the harness finished but wrote no .tellurion/plan.json');
    }
  } finally {
    running = false;
  }
}

// Reconcile (T4): propose a real repo path as the `home` of each product the
// deterministic matcher could not connect. The agent answers with JSON only;
// the server drops any proposed home that does not exist before the panel ever
// sees it. Proposals only — nothing is written here.
export async function reconcileHomes(root, plan, unmatched) {
  const list = unmatched.map((p) => `- id "${p.id}", name "${p.name}"${p.note ? `, note "${p.note}"` : ''}`).join('\n');
  const prompt = `In this repo, connect declared products to real paths. These products have no deterministic connection to the repository yet:

${list}

For each, find the single most likely repo-relative "home" (a directory or file where that product lives). Look with your own tools (ls, find, grep) and verify the path exists. If nothing honestly fits, answer null for that product.

Reply with ONLY this JSON object and nothing else:
{ "proposals": [{ "id": "<product id>", "home": "<repo-relative path>" | null, "why": "<one line>" }] }`;
  const out = await runHarness(prompt, root);
  const m = out.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('the harness returned no JSON');
  const parsed = JSON.parse(m[0]);
  const proposals = Array.isArray(parsed && parsed.proposals) ? parsed.proposals : [];
  const exists = (rel) => { try { return fs.existsSync(path.join(root, String(rel))); } catch { return false; } };
  return proposals
    .filter((pr) => pr && typeof pr.id === 'string')
    .map((pr) => ({
      id: pr.id,
      home: pr.home ? String(pr.home).replace(/\\/g, '/').replace(/^\.+\//, '').replace(/\/+$/, '') : null,
      why: String(pr.why || '').slice(0, 200),
    }))
    // The agent is asked to verify; the filesystem still vetoes.
    .map((pr) => (pr.home && !exists(pr.home) ? { ...pr, home: null, why: (pr.why + ' (proposed path was not real; dropped)').trim() } : pr));
}
