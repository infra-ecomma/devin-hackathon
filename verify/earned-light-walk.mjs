#!/usr/bin/env node
// The executable definition of done for the Earned Light engine (global rule 38).
// Builds a throwaway git repo with a real plan, drives the compiled engine through
// the full law of light, and exits non-zero on the first broken assertion.
// Run: npm run compile && node verify/earned-light-walk.mjs

import { execSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = join(fileURLToPath(import.meta.url), "..", "..");
const engine = await import(join(here, "out", "core", "engine", "index.js"));
const { computeVentureState, runCheck, revoke } = engine;

let step = 0;
const passed = [];
function ok(cond, label) {
  step++;
  if (!cond) {
    console.error(`WALK FAIL at step ${step}: ${label}`);
    console.error(`passed so far:\n  ${passed.join("\n  ")}`);
    process.exit(1);
  }
  passed.push(`${step}. ${label}`);
  console.log(`ok ${step} · ${label}`);
}

const root = mkdtempSync(join(tmpdir(), "earned-light-walk-"));
const sh = (cmd) => execSync(cmd, { cwd: root, stdio: ["ignore", "pipe", "pipe"] }).toString();
sh("git init -q -b main");
sh("git config user.email walk@tellurion.local && git config user.name Walk");

mkdirSync(join(root, ".tellurion"), { recursive: true });
for (const d of ["src/auth/login", "src/auth/reset", "src/checkout/cart", "src/checkout/promo"]) {
  mkdirSync(join(root, d), { recursive: true });
}
writeFileSync(join(root, ".tellurion", "plan.json"), JSON.stringify({
  name: "walk-venture",
  products: [
    {
      id: "auth", name: "Auth", category: "auth",
      walk: { command: "node -e \"process.exit(0)\"" },
      features: [
        { id: "login", name: "Signs a user in", paths: ["src/auth/login"],
          check: { command: "node -e \"process.exit(0)\"" } },
        { id: "reset", name: "Resets a password", paths: ["src/auth/reset"],
          check: { command: "node -e \"process.exit(0)\"" } }
      ]
    },
    {
      id: "checkout", name: "Checkout", category: "api",
      features: [
        { id: "cart", name: "Totals a cart", paths: ["src/checkout/cart"],
          check: { command: "node -e \"process.exit(1)\"" } },
        { id: "promo", name: "Applies promo codes", paths: ["src/checkout/promo"],
          check: { command: "node -e \"process.exit(0)\"" } }
      ]
    }
  ]
}, null, 2));
sh("git add -A && git commit -qm plan");

// Act I · the empty sky: a plan alone puts nothing in the sky.
let s = await computeVentureState(root);
ok(s.products.length === 2, "both declared products are known to the state");
ok(s.productsInSky === 0 && s.products.every(p => !p.started), "no work started: zero planets drawn");
ok(s.featuresInSky === 0, "no work started: zero moons drawn");
ok(s.planProblems.length === 0, "the plan parses with no problems");

// Act II · appear on work: the first commit touching a feature births its bodies.
writeFileSync(join(root, "src/auth/login/index.js"), "exports.login = () => true;\n");
sh("git add -A && git commit -qm 'auth: login work begins'");
s = await computeVentureState(root);
const auth = () => s.products.find(p => p.id === "auth");
const feat = (pid, fid) => s.products.find(p => p.id === pid).features.find(f => f.id === fid);
ok(auth().started && s.productsInSky === 1, "auth planet appears when its first feature starts");
ok(feat("auth", "login").state === "in-progress", "login moon appears dashed in-progress");
ok(feat("auth", "reset").state === "not-started", "untouched reset stays out of the sky");
ok(!auth().productVerified, "a forming product is not verified");

// Act III · light is earned: only a recorded exit 0 flips a moon.
let r = await runCheck(root, "auth", "login");
ok(r.exitCode === 0, "login check executes and exits 0");
s = await computeVentureState(root);
ok(feat("auth", "login").state === "verified", "login moon flips to verified on exit 0");
ok(feat("auth", "login").evidence.sha === s.headSha, "evidence is pinned to the current HEAD");
ok(!auth().productVerified, "one verified feature does not verify the product");

// Act IV · proof rots: a commit touching the paths decays verified to stale.
writeFileSync(join(root, "src/auth/login/rotate.js"), "exports.rotate = () => 2;\n");
sh("git add -A && git commit -qm 'auth: rotate tokens'");
s = await computeVentureState(root);
ok(feat("auth", "login").state === "stale", "new commit on its paths decays login to stale");
ok(feat("auth", "login").behind >= 1, "stale carries how many commits behind the proof is");

// Act V · failure is loud: a non-zero check is failing, never hidden.
writeFileSync(join(root, "src/checkout/cart/index.js"), "exports.total = () => 0;\n");
writeFileSync(join(root, "src/checkout/promo/index.js"), "exports.apply = () => 0;\n");
sh("git add -A && git commit -qm 'checkout: cart and promo work begins'");
r = await runCheck(root, "checkout", "cart");
ok(r.exitCode !== 0, "cart check really fails");
s = await computeVentureState(root);
ok(feat("checkout", "cart").state === "failing", "cart moon shows failing on exit 1");
ok(s.productsInSky === 2, "checkout planet appeared with its started features");

// Act VI · the corona: all features verified AND the product walk passing.
await runCheck(root, "auth", "login");
writeFileSync(join(root, "src/auth/reset/index.js"), "exports.reset = () => true;\n");
sh("git add -A && git commit -qm 'auth: reset work begins'");
await runCheck(root, "auth", "login");   // re-earn login at the new HEAD
await runCheck(root, "auth", "reset");
s = await computeVentureState(root);
ok(feat("auth", "login").state === "verified" && feat("auth", "reset").state === "verified",
  "both auth moons verified at HEAD");
ok(!auth().productVerified, "all moons alone do not ignite the corona: the walk is missing");
r = await runCheck(root, "auth", "__walk__");
ok(r.exitCode === 0, "the auth product walk executes and exits 0");
s = await computeVentureState(root);
ok(auth().productVerified, "corona: all features verified plus the walk at HEAD");
ok(s.productsVerified === 1, "venture counts exactly one verified product");

// Act VII · honesty runs backwards: revoke returns the moon to unproven.
await revoke(root, "auth", "reset");
s = await computeVentureState(root);
ok(feat("auth", "reset").state === "in-progress", "revoke strips verified without touching git");
ok(!auth().productVerified, "the corona retracts when any feature falls out of verified");

// Act IX (placed before the identity checks so the final state includes it):
// merged history cannot hide from staleness. A side-branch commit with an OLD
// commit date lands via merge; date-ordered log scans would sort it below the
// evidence commit and keep unearned light lit. Ancestry must decay it.
await runCheck(root, "auth", "reset");           // re-earn reset after the revoke
await runCheck(root, "auth", "login");
await runCheck(root, "auth", "__walk__");
s = await computeVentureState(root);
ok(auth().productVerified, "corona re-earned before the merge test");
const oldEnv = {
  ...process.env,
  GIT_AUTHOR_DATE: "2020-01-01T00:00:00Z",
  GIT_COMMITTER_DATE: "2020-01-01T00:00:00Z",
};
sh("git checkout -q -b side");
writeFileSync(join(root, "src/auth/login/merged.js"), "exports.merged = () => true;\n");
execSync("git add -A && git commit -qm 'side: old-dated login change'", { cwd: root, env: oldEnv, shell: "/bin/bash" });
sh("git checkout -q main");
sh("git merge -q --no-ff -m 'merge side' side");
s = await computeVentureState(root);
ok(feat("auth", "login").state === "stale",
  "merged old-dated commit on login paths decays verified to stale (ancestry, not log order)");
ok(!auth().productVerified, "the corona retracts on merged unproven code");

// Act VIII · the sky never lies about freshness or identity.
ok(typeof s.headSha === "string" && s.headSha.length >= 7, "state carries the real HEAD sha");
ok(s.branch === "main", "state carries the real branch");
ok(auth().orbitIndex === 0 && s.products.find(p => p.id === "checkout").orbitIndex === 1,
  "orbit index is formation order and stable");

console.log(`\nWALK PASS · ${step} steps · the law of light holds`);
rmSync(root, { recursive: true, force: true });
