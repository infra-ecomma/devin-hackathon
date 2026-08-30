**TBK Labs** · Curated Kit

---

# UI Redesign

_Multi-phase UI redesign pipeline with anti-preservation enforcement (Gate 9). Audit current → design new → generate NEW files (never patch existing) → typecheck → review → ship. **Hard gate against in-place edits during code-generation phase — paired with `ui-redesign-gate9` hook.**_

**CATEGORY** Workflows · Product  •  **TRIGGER** `/ui-redesign`, `redesign this page`, `replace existing UI`  •  **RATING** ★★★★☆ (9/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Anti-preservation Gate 9.** Names canonical "we 'redesigned' 3 times by patching same page.tsx, no real structural change, scores stagnated 21→33" preservation-trap failure.
- **Generation contract enforced.** Names canonical "agent wrote sed scripts to edit existing files, bypassed gate" bash-bypass failure.
- **State-machine workflow.** Names canonical "we lost track of which phase, did design before audit" no-state failure.

---

## What It Does

Multi-phase redesign pipeline (state machine via `.claude/UI-REDESIGN-STATE.md`):

| Phase | Purpose |
|-------|---------|
| 1-2 Audit | Current state + acceptance criteria |
| 3-4 Design | New design + token system |
| 5-7 Spec | Wireframes / components / interactions |
| 8 Preflight | git clean + baseline tsc |
| **9 Code Generation** | **GATE 9 ACTIVE — new files only, no patching** |
| 10 Typecheck | tsc clean before review |
| 11 Review | Visual QA + design-engine alignment |
| 12 Ship | Replace old files (cutover) |

**Gate 9 enforcement (via `ui-redesign-gate9` hook):**
- During Phase 9: blocks Edit / Write-overwrite / Bash-with-sed on page.tsx / page.jsx / /components/
- Allows: `.claude/`, `globals.css`, `tailwind.config`, `tokens*`, `.generated`
- Bash bypass detection (sed / awk / cat >> / echo > on source files)
- Force NEW file generation (page.generated.tsx) not in-place edit

**Hard rules:**
- State machine controls phase (.claude/UI-REDESIGN-STATE.md)
- Gate 9 ACTIVE during Phase 9 (mode=full + phase=code-generation)
- Bypass = disable Gate 9 by removing `mode: full`
- Cutover at Phase 12 (rename .generated → final)

---

## How to Use

1. Invoke `/ui-redesign` with target page.
2. Workflow advances through phases.
3. Phase 8 preflight: git clean check.
4. Phase 9 activates Gate 9 → write NEW files (page.generated.tsx).
5. Phase 12 cutover: rename old → .old, rename new → final, commit.

---

## What NOT to Do

- **Don't patch existing files during Phase 9.** Gate 9 blocks.
- **Don't bypass via sed/awk.** Bash detection catches.
- **Don't skip Phase 8 preflight.** Dirty git state = bad diff.
- **Don't conflate with smaller refactors.** Use refactor-legacy-code for those.

---

## Sample Output (homepage redesign)

```
[Target: /app/(marketing)/page.tsx redesign]

Phase 1-2 Audit + Acceptance
  Current: 8 sections, 1240 LOC, mixed naming
  Acceptance: new hero, simplified pricing display, +CTA testimonials

Phase 3-4 Design + Tokens
  New design system: --color-primary-* / --space-* / --radius-*
  Component primitives: Hero / Section / Card / Pricing

Phase 5-7 Spec
  Wireframes (12 screens), component spec, interaction map

Phase 8 Preflight
  git status: clean ✓
  tsc --noEmit: 0 errors baseline ✓
  State machine: mode=full, phase=code-generation
  GATE 9 NOW ACTIVE

Phase 9 Code Generation
  Generate: app/(marketing)/page.generated.tsx (new) ← ALLOWED
  Generate: src/components/marketing/Hero.generated.tsx ← ALLOWED
  Generate: src/components/marketing/Pricing.generated.tsx ← ALLOWED
  
  Attempted: Edit app/(marketing)/page.tsx ← BLOCKED by Gate 9
  Attempted: sed -i s/old/new/ src/components/Hero.tsx ← BLOCKED
  
  All new files generated to .generated.tsx variants.

Phase 10 Typecheck
  tsc --noEmit on .generated files: 0 errors

Phase 11 Review
  Visual QA: Playwright screenshots vs design spec → match
  design-engine review: 92% adherence to tokens

Phase 12 Ship
  Cutover commit:
    $ git mv app/(marketing)/page.tsx app/(marketing)/page.old.tsx
    $ git mv app/(marketing)/page.generated.tsx app/(marketing)/page.tsx
    [Same for Hero + Pricing components]
    $ git commit -m "feat(redesign): homepage cutover"
  
  Old files retained as .old.tsx for 7 days (rollback window)

[State machine: mode cleared; Gate 9 deactivated for normal work]
```

```bash
# Invoke
> /ui-redesign target=app/(marketing)/page.tsx

# Gate 9 active during Phase 9; deactivate to disable:
$ rm .claude/UI-REDESIGN-STATE.md
```

12-phase redesign with Gate 9 anti-preservation enforcement: forced new-file generation, blocked 2 in-place edit attempts + 1 sed bypass. Cutover via git mv; old files retained 7d.

---

## Quick Reference

| Property | Value |
|---|---|
| **Workflow name** | ui-redesign |
| **Category** | Workflows · Product |
| **Rating** | ★★★★☆ (9/10) |
| **Trigger** | `/ui-redesign` |
| **Phases** | 12+ (Audit / Design / Spec / Preflight / Code Gen / Typecheck / Review / Ship) |
| **State Machine** | `.claude/UI-REDESIGN-STATE.md` |
| **Gate 9** | Anti-preservation hook enforces NEW files during Phase 9 |
| **Allowed Paths** | `.claude/`, tokens, globals.css, tailwind.config, `.generated` |
| **Cutover** | Phase 12 git mv (old → .old; new → final) |
| **Bundle** | `WORKFLOW.md` + `INSTALL.md` + `README.md` + `GENERATION_CONTRACT.md` + `ui-redesign.docx` |
| **Pairs With** | `ui-redesign-gate9` hook · `design-push-gate` hook · `design-engine` skill · `meta-design` skill · `product-ux-audit` workflow |

---

**TBK Labs** · Curated Kit · 2026-05-14

Vault note: [[workflow-ui-redesign]]
