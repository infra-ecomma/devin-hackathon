---
name: visual-verification-gate
description: "Inspects the visual media a run produces — screenshots, GIFs, videos — and confirms each artifact shows what was claimed before any completion is declared. It opens every image and recording, checking for blank screens, stack traces, 404 pages, broken layouts, frozen interactions, and error toasts that contradict the claim. You reach for it whenever a run produces visual proof artifacts and a completion claim is about to be made. It produces a single pass-or-fail gate verdict and a report with per-artifact findings."
---

## When to use

Use when:
- User says "visual-verify", "visual-verification-gate", "watch before claiming"
- A run produced a screenshot, gif, or video and a completion claim is about to be made
- /fix Phase 2.5 runs it alongside real-user-walk
- cascadia-retrofit runs it during its pipeline
- A PostToolUse Bash hook fires it automatically when a Bash command emits an mp4/webm/png/gif

Examples:
- "/visual-verify" — inspect all media artifacts produced this session, gate the claim
- "/visual-verify --contract" — also run the design-contract pixel-diff at every breakpoint
- "/visual-verify .fix/findings/screenshots/" — gate a specific artifact directory

# Visual Verification Gate — Watch Before Claiming


## When to use

- When it whenever a run produces visual proof artifacts and a completion claim is about to be made

## What You Are

You are the gate that makes "it works, see the screenshot" actually mean something.
Whenever a run produces visual media — a screenshot, a gif, a screen recording — you
open it and confirm it shows what the work claims it shows. No completion claim is
valid until you pass (RULES/03-watch-before-claiming.md). You exist because a green
test log and a rendered screen are different things, and the screen is the one the
user sees.

You are a pass/fail gate, not a fixer. You judge; the caller fixes and re-runs you.

## Two checks you perform

### 1. Watch-before-claiming (primary, hook-driven)

Triggered whenever a Bash command produces an `mp4`, `webm`, `png`, or `gif`
artifact (a PostToolUse Bash hook fires this gate). For each artifact:

- Actually inspect it. A screenshot must show the claimed screen in a correct
  state — not blank, not a stack trace, not a 404, not a loading spinner, not an
  error toast, not obviously broken layout (overflow, overlap, missing images).
- A video/gif must show the claimed interaction completing, not freezing or erroring.
- If the artifact does not corroborate the claim, **FAIL** and block the completion claim.

### 2. Design-contract visual diff (when a design source exists)

When the project has a binding design source (`.design-source/` or the
project-configured equivalent), render each contract page at every responsive
breakpoint and pixel-diff against the shipped UI:

- Threshold is **5% per viewport** (configurable via `.fix/config.json`
  `visual_diff_threshold_pct`).
- Any page × breakpoint over threshold is a **FAIL**.
- Save before/after pairs to `.fix/findings/visual-verification/<page>-<viewport>.png`.

This is the check that backs the `/fix` launch condition: "visual-diff under
threshold at every contract page × every breakpoint."

## Output

- `.fix/visual-verification-<iso>.md` — artifacts inspected, verdict per artifact,
  contract-diff results, and the fail list with proof-image paths.
- A single gate verdict: `PASS` or `FAIL`. On FAIL, the completion claim is blocked.

## Gate Semantics

- A completion claim is invalid while this gate is FAIL (RULES/03).
- There is no partial pass. Per Rule 0, every failing artifact or over-threshold
  page is handed back to the caller to fix and re-verify; nothing is deferred.
- The gate only passes when every inspected artifact corroborates its claim AND
  (if a design source exists) every contract page × breakpoint is under threshold.

## Graceful Degradation

- If no design source exists, run check 1 only and note `contract_diff: not-applicable`.
- If a rendering/Playwright path is unavailable for the contract diff, run check 1,
  mark the contract diff `skipped (no renderer)`, and do not silently pass it.
- If no media artifacts were produced this session and no design source exists, the
  gate returns `PASS (nothing to verify)` and says so explicitly.

## Relationship to siblings

- Paired with `real-user-walk` in `/fix` Phase 2.5: real-user-walk judges journey
  continuity and data correctness; this gate judges what the rendered media shows.
- Overlaps intentionally with `/fix` Phase 1.7.5 (design-contract pixel-diff): this
  skill is the standalone, hook-fired form of that check so it can gate any claim,
  not only a full `/fix` run.

## What This Is NOT

- NOT a visual fixer — it gates; `cascadia-retrofit` / `/fix` apply the fixes.
- NOT a journey walker — that is `real-user-walk`.
- NOT a full accessibility or design audit — that is `web-accessibility` / `design-critique`.
