---
name: proof-artifact-check
description: "PreToolUse hook that fires on git commits referencing a tracked task ID, warning when the task has a Test Requirements Card but no proof manifest in the test-results directory. It extracts the task ID from conventional-commit messages, checks for the card and manifest, and delegates to an optional validator script. The hook is non-blocking by design — it prints a visible warning but never refuses the commit, preserving user agency while making test-skip gaps impossible to miss."
---

**TBK Labs** · Curated Kit

---

# Proof Artifact Check

_PreToolUse Bash hook that warns when a git-commit references a task with a Test Requirements Card but no proof manifest in test-results/._

**CATEGORY** Hooks · Testing  •  **TRIGGER** `git commit on a tracked task`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Catches the test-skip drift at exactly the moment it happens — the `git commit` event, before the bad commit becomes a published claim that "the work is done." Earlier (PreEdit) is too aggressive; later (PostCommit) is too late to course-correct.
- Non-blocking by design — the hook prints a `systemMessage` JSON line that the user sees but never refuses the commit. Hard-blocking commits creates the wrong incentive (commit-message tweaks to avoid detection); a visible warning preserves user agency while making the gap impossible to miss.
- Graceful when the testing pipeline is absent — if the test-card directory, manifest path, or validator script doesn't exist, the hook exits 0 silently. Projects that haven't adopted GSD's proof-artifact specification are not penalized; the hook only fires when the upstream commitment was made.

## What It Does

The hook reads the tool-call payload from stdin and uses `jq` to pull the `tool_input.command` field. If the command doesn't contain `git commit`, the hook exits 0 immediately — every other Bash invocation is out of scope. This narrow trigger is the reason the hook can run on every PreToolUse Bash event without becoming background noise.

For matching commits, the hook extracts the task ID from the commit message using a conventional-commit regex: `(feat|fix|chore)\(([A-Z]+-[0-9]+)\)`. The captured task ID (e.g., `ABC-123`) becomes the lookup key for the rest of the checks. Commits that don't follow conventional format have no task ID and the hook exits 0 — no task ID, no claim that this commit closes a tracked task, nothing to verify.

With a task ID in hand, the hook checks for `dev_docs/enforcement-proofs/${TASK_ID}-test-card.md`. The Test Requirements Card is the upstream artifact that says "this task has tests we expect to see." If the card doesn't exist, this task was never enrolled in the proof regime and the hook exits 0 — verifying tests for a task that didn't promise them is out of scope. If the card exists, the hook checks for `test-results/${TASK_ID}-manifest.json`. Missing manifest produces the warning `Task X has a Test Requirements Card but no proof artifacts. Run /test-verify X.`

If the manifest exists, the hook delegates to `scripts/verify-proof-artifacts.sh` if that validator script is present in the project. The validator's stdout and stderr are silenced; only the exit code matters. Non-zero means the manifest is structurally invalid or claims artifacts that don't exist on disk, in which case the hook prints `Proof artifact validation failed for X. Run /test-verify X.` In either warning case the hook still exits 0 — the warning is informational, not blocking.

## How to Use

1. Register the hook in `.claude/settings.json` under PreToolUse with a Bash matcher: `{"event": "PreToolUse", "matcher": "Bash", "hook": "proof-artifact-check/hook.sh"}`.
2. Adopt conventional commit format with task IDs: `feat(ABC-123): description`. Without the parenthesized ID the hook cannot scope its checks and silently passes.
3. Maintain Test Requirement Cards under `dev_docs/enforcement-proofs/` for tasks that promise tests. Cards without manifests are exactly the case this hook surfaces.
4. When you see the warning, run `/test-verify <TASK_ID>` to either generate the manifest or surface why validation is failing.

## What NOT to Do

- Don't make this hook blocking by changing the exit code or adding a non-zero exit. The current design preserves user agency — the warning fires, the user decides. A blocking version would push the same problem (commits without proofs) into a different place (commits with fake test-card stubs to dodge the gate).
- Don't extend the regex beyond `feat|fix|chore` without a deliberate reason. The narrow scope mirrors the conventional-commits subset that the rest of the kit treats as task-tracking commits. `docs` and `chore`-adjacent prefixes are intentionally excluded because they shouldn't carry test promises.
- Don't put the validator script anywhere other than `scripts/verify-proof-artifacts.sh`. The path is hard-coded and the hook degrades to manifest-existence-only check if the validator is missing — which is the opposite of what you want when running the hook to enforce validator output.

## Quick Reference

| Property | Value |
|---|---|
| **Hook name** | proof-artifact-check |
| **Category** | Hooks · Testing |
| **Rating** | ★★★★☆ (8/10) |
| **Bundle** | `hook.sh` + `README.md` + `proof-artifact-check.docx` |
| **Event** | `PreToolUse` |
| **Matcher** | `Bash` |
| **Blocking** | No |
| **Trigger pattern** | `git commit` in the command |
| **Task ID regex** | `(feat\|fix\|chore)\(([A-Z]+-[0-9]+)\)` |
| **Inputs checked** | `dev_docs/enforcement-proofs/${TASK_ID}-test-card.md`, `test-results/${TASK_ID}-manifest.json` |
| **Validator** | `scripts/verify-proof-artifacts.sh` (optional) |
| **Output** | `systemMessage` JSON line on warning |
| **Pairs With** | GSD testing pipeline, `/test-verify` command, Test Requirement Card spec under `08-quality-testing/enforcement/` |

---

**TBK Labs** · Curated Kit · 2026-04-26

Vault note: [[hook-proof-artifact-check]]
