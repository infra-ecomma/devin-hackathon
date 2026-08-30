---
name: design-enforcement
description: "PostToolUse hook that scans TSX, JSX, HTML, and CSS files for seven AI-design anti-patterns the moment they are written. Five advisory checks catch generic grid-of-cards layouts, indigo-to-purple gradients, uniform rounding, decorative shadows, and hardcoded colors. Two blocking checks enforce that KPI components reference the project's Classification Card metrics and that prop types use domain types rather than any or generic Item arrays. You install it to prevent the default AI-generated visual aesthetic from reaching production."
---

**TBK Labs** · Curated Kit

---

# Design Enforcement

_PostToolUse hook on Write/Edit/MultiEdit for `.tsx`/`.jsx`/`.html`/`.css` files. Catches 5 P1 (advisory) AI-design anti-patterns and 2 P0 (blocking) classification-compliance violations: generic grid-of-cards, indigo→purple gradients, uniform rounding, decorative shadows, hardcoded colors; KPI components must reference Classification Card metrics; generic prop types forbidden._

**CATEGORY** Hooks · Testing  •  **TRIGGER** PostToolUse (Write/Edit/MultiEdit on .tsx/.jsx/.html/.css)  •  **EVENTS** PostToolUse  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Names 7 specific AI-design anti-patterns.** Names canonical "we shipped 3 indigo-to-purple gradients in 2 sprints because 'looked clean'" generic-AI-design failure.
- **P0/P1 split.** Names canonical "every check was a warning, agent ignored all of them" flat-severity failure. P0 blocks, P1 advisories.
- **Classification Card enforcement.** Names canonical "KPI component used generic 'Metric' type when the project has a CLASSIFICATION.md naming primary metrics" no-domain-binding failure.

---

## What It Does

PostToolUse hook with three phases:

**Phase 1 — Activation gate.**
- Tool must be Write / Edit / MultiEdit
- File extension must be `.tsx` / `.jsx` / `.html` / `.css`
- Skip `.claude/` and `node_modules/` paths

**Phase 2 — Run 7 checks.**

**P1 (advisory) checks (≥1 failure → exit 0 with warning count):**

| Check | Pattern | Why |
|-------|---------|-----|
| Generic grid-of-cards | `grid.*gap.*p-4 \| grid-cols-3.*card \| box-flex.*flex-1` | The "3-feature box" template = AI tell |
| Indigo→purple gradient | `from-indigo.*to-purple` etc. | Default AI palette |
| Uniform rounding | ≥5 instances of `rounded-lg` | No visual variation |
| Decorative shadows | `shadow-lg/xl/drop-shadow` without elevation/focus/dialog/modal context | Shadows = elevation, not decoration |
| Hardcoded colors | ≥3 hex/rgb/rgba literals | Use design tokens |

**P0 (blocking) checks (≥1 failure → exit 2):**

| Check | Activation | Required |
|-------|------------|----------|
| KPI Classification compliance | File path includes `kpi\|dashboard\|metric\|stat` | Must reference `PRIMARY_METRICS`, `Primary.Metrics`, `primary_metrics`, `CLASSIFICATION`, or `classification` |
| Generic prop types | File contains `interface.*Props` | Must NOT use `data: any`, `items: any`, or `Item[]` (use domain types from Classification) |

**Phase 3 — Report.**
- P0 failed: print `❌ Design Enforcement: N P0 failure(s) — fix before proceeding.`, exit 2
- P1 failed only: print `⚠️ Design Enforcement: N P1 warning(s) — review and adjust.`, exit 0
- Clean: print `✓ All design enforcement checks passed.`, exit 0

**Hard rules:**
- MIXED — BLOCKING on P0, ADVISORY on P1.
- Output to stderr (won't pollute stdout pipelines).
- 7 checks total (5 P1 + 2 P0).
- Skip-paths include `.claude/` and `node_modules/`.

---

## How to Use

1. Install via `.claude/settings.json` PostToolUse hook config (matcher: Write|Edit|MultiEdit).
2. Author UI files.
3. Save → 7 checks run.
4. P0 failures block; P1 warns.
5. Reference `.claude/CLASSIFICATION.md` for project-specific metrics + types.

---

## What NOT to Do

- **Don't relax P0 to allow generic types.** Domain types catch entire classes of bugs.
- **Don't disable to ship the indigo gradient.** Use tokens; agent-detected patterns become brand.
- **Don't downgrade KPI check to P1.** That's the load-bearing rule.
- **Don't add P0 for `5+ rounded-lg`.** Uniform rounding is aesthetic preference, not bug.
- **Don't strip the elevation-context check.** It prevents false-positives on legitimate `shadow-lg` in dropdown/modal.
- **Don't skip CSS files.** Hardcoded colors apply there too.

---

## Sample Output (component failing 1 P0 + 2 P1)

```
$ # Write src/components/Dashboard/MetricCard.tsx with:
$ # interface Props { data: any[]; }   # generic prop type
$ # const colors = ['#3B82F6', '#10B981', '#F59E0B'];   # 3 hardcoded
$ # className="bg-gradient-to-r from-indigo-500 to-purple-500"

[PostToolUse fires]

=== Design Enforcement Hook ===
File: src/components/Dashboard/MetricCard.tsx

⚠️  P1: Default AI color palette (indigo→purple). Use tokens from design system.
⚠️  P1: 3 hardcoded color values. Use CSS custom properties or design tokens.

❌ P0: KPI/Dashboard component must reference Classification Card Primary Metrics.
   Add import or comment referencing .claude/CLASSIFICATION.md

❌ P0: Generic prop types (data: any, items: Item[]). Use domain-specific types from Classification.

❌ Design Enforcement: 2 P0 failure(s) — fix before proceeding.

Exit 2 → blocked.

---

[After fix: import PRIMARY_METRICS from .claude/CLASSIFICATION, type Props = { metrics: PrimaryMetrics[] }, 
 colors moved to design tokens, gradient removed]

[Re-save]
=== Design Enforcement Hook ===
File: src/components/Dashboard/MetricCard.tsx

✓ All design enforcement checks passed.
Exit 0 → write proceeds.
```

```bash
# .claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": { "tool": "Write|Edit|MultiEdit" },
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/testing/design-enforcement/hook.sh"
      }]
    }]
  }
}
```

7-check enforcement: 2 P1 warnings (indigo gradient, 3 hardcoded colors) + 2 P0 blocks (no Classification reference, generic prop types). After fixes referencing CLASSIFICATION.md and domain types, all 7 pass.

---

## Quick Reference

| Property | Value |
|---|---|
| **Hook name** | design-enforcement |
| **Category** | Hooks · Testing |
| **Rating** | ★★★★☆ (8/10) |
| **Events** | PostToolUse (Write/Edit/MultiEdit) |
| **Mode** | MIXED — P0 BLOCKING, P1 ADVISORY |
| **Activation Extensions** | .tsx / .jsx / .html / .css |
| **Skip Paths** | `.claude/` / `node_modules/` |
| **P1 Checks** | 5 (grid-of-cards / indigo-purple / uniform rounded / decorative shadow / hardcoded color) |
| **P0 Checks** | 2 (KPI Classification reference / generic prop types forbidden) |
| **Classification Source** | `.claude/CLASSIFICATION.md` |
| **Pairs With** | `design-qa` hook · `design-push-gate` hook · `ui-redesign-gate9` hook · `compact-preserve` hook · `design-engine` skill |
| **Bundle** | `hook.sh` + `README.md` + `design-enforcement.docx` |

---

**TBK Labs** · Curated Kit · 2026-05-14
