**TBK Labs** · Curated Kit

---

# Visual Verification Gate

_Inspect the visual media a run produces and block any completion claim until it checks out_

**CATEGORY** Skills · Testing  •  **TRIGGER** `visual-verify, visual-verification-gate, watch before claiming`  •  **RATING** ★★★★☆ (provisional)  •  **STATUS** Curated · reconstructed 2026-05-27

---

## Why It Earns the Curated Bar

- Closes a hard dependency of `/fix`: it is the companion gate to real-user-walk in Phase 2.5 and backs the launch condition "visual-diff under threshold at every contract page by every breakpoint."
- Makes "it works, see the screenshot" mean something: per RULES/03, no completion claim is valid until the produced media is actually inspected and corroborates the claim.
- Degrades honestly: with no design source it runs the watch-before-claiming check only; with no renderer it marks the contract diff skipped rather than passing it silently.

> Reconstructed 2026-05-27 from the contract stated in `/fix` and the SKILL-INVOCATION-MAP (cascadia-audit cohort, locked 2026-05-10). Rating is provisional pending field validation.

---

## What It Does

Acts as a pass/fail gate on visual correctness. Whenever a run produces an `mp4`, `webm`, `png`, or `gif` (a PostToolUse Bash hook fires it), it inspects each artifact and confirms the screen or interaction shown is in a correct state, not blank, not an error, not broken layout. When the project has a binding design source it also renders each contract page at every responsive breakpoint and pixel-diffs against the shipped UI at a 5%-per-viewport threshold. It writes `.fix/visual-verification-<iso>.md` with a verdict per artifact and a single gate result of PASS or FAIL. On FAIL the completion claim is blocked; under Rule 0 every failing artifact or over-threshold page is handed back to be fixed and re-verified.

---

## How to Use

1. **Gate a session**: `/visual-verify` — inspect all media produced this session and gate the claim.
2. **Run the contract diff too**: `/visual-verify --contract` — also pixel-diff every contract page at every breakpoint.
3. **Gate a directory**: `/visual-verify .fix/findings/screenshots/`.
4. **Read the verdict**: `.fix/visual-verification-<iso>.md` — PASS or FAIL with proof-image paths.

---

## What NOT to Do

- **Do not claim done on a green log alone**: a passing test log and a correct rendered screen are different things. This gate judges the screen.
- **Do not silently pass a skipped check**: if the renderer is unavailable, mark the contract diff skipped, do not treat it as a pass.
- **Do not use it to fix anything**: it gates only. Fixes come from `cascadia-retrofit` / `/fix`.

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | visual-verification-gate |
| **Category** | Skills · Testing |
| **Rating** | ★★★★☆ (provisional) |
| **Command** | visual-verify, watch before claiming |
| **Bundle** | `SKILL.md` + `README.md` + `visual-verification-gate.docx` |

---

**TBK Labs** · Curated Kit · 2026-05-27

Vault note: [[skill-visual-verification-gate]]
