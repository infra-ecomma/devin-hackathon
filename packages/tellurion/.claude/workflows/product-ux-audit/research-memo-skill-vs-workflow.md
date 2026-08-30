# Research Memo: Product-UX as Skill vs. Workflow

**Date:** 2026-04-07
**Author:** Claude (Cowork)
**Decision:** Promote to full workflow AND keep skill. Skill becomes one stage of the workflow chain.
**Status:** Decided and executed (v2 skill + workflow scaffold shipped same day)

---

## The Question

After auditing TBK Ads on 2026-04-07 using the standalone `product-ux-review` skill, the skill produced a technically-correct-but-miscalibrated audit: it misread a strategy platform as an execution platform, missed dead schema fields (the entire alerts table), had no business-model or multi-tenancy lens, and produced a findings table with no retention narrative an exec could act on. The skill was 914 lines — already near its context budget — and the fixes needed were substantial enough to suggest it needed to become something bigger than a single skill file.

The question: should we expand the skill in place (keep it as a single SKILL.md, 2–3x its current size), or promote it to a workflow that orchestrates the skill as one component?

## The Three Options Considered

### Option A — Expand skill in place only

**Pros:** Single file, single invocation, no orchestration layer to maintain. Matches the pattern of most existing skills. User can invoke with a natural-language trigger.

**Cons:** Would push SKILL.md to ~2500+ lines, past the point where Claude can reliably follow every instruction. Mixes three different levels of concern into one file: heuristic methodology (Nielsen + cognitive walkthrough), discovery orchestration (parallel agents + grep verification), and output generation (report structure + retention narrative + docx export). No clean way to invoke a slash command. No way to separate the parts that need to run every audit from the parts that only apply to specific product types or verticals.

### Option B — Promote to full workflow, retire the skill

**Pros:** Cleanest separation of concerns. Command-triggerable (`/product-ux-audit`). Workflow can orchestrate the sub-skills that already exist (design-critique, meta-design, docx, etc.).

**Cons:** Loses the ability to invoke the skill directly for small single-screen reviews. Loses the value of the existing 914 lines of heuristic methodology, severity calibration, ARIA quick-check, and dimension definitions. Fragments the work across multiple files and slows edit cycles. The skill content is actually good — it just needs extensions, not a rewrite.

### Option C — Workflow wraps the skill (CHOSEN)

**Pros:** Workflow handles orchestration (Phase 0 classification, parallel agents, grep verification, report export) and domain-specific content (playbooks, retention narrative, corrections-to-prior-audit). Skill stays focused on heuristic methodology and severity scoring. Both can be invoked independently — workflow for full audits, skill for quick reviews. Matches the Design-Autopilot pattern (workflow orchestrates 16 design skills). Lets the skill grow naturally via the v2 addendum without blowing its context budget. Preserves all 914 lines of existing content.

**Cons:** Two files to maintain instead of one. Minor duplication risk (the workflow's phase list overlaps with the skill's phase list). Requires the cascade step — any skill edit that should apply to the workflow invocation path needs to propagate.

## Decision

**Option C.** Implemented on 2026-04-07 as:

1. **`product-ux-review` skill v2** — appended a 379-line v2 addendum to the existing 914-line SKILL.md. Adds Phase 0 (product type classification), Dimensions 9–16, parallel-discovery mandate (rule D1 baked in), 8 domain playbooks, schema-vs-UI parity protocol, business model audit, multi-tenancy audit, primitives library audit, copy/microcopy audit, discoverability audit, data freshness audit, Day-1/7/30 retention narrative requirement, and a corrections-to-v1 section explaining what v1 got wrong. Cascaded to all 5 mirror locations. Total: 1293 lines.

2. **`Product-UX-Audit` workflow (new, Curated)** — 9-phase orchestration at `Organizing Claude Code/workflows/Curated/Product-UX-Audit/`. Command: `/product-ux-audit`. Invokes the skill as the heuristic backbone and handles everything around it: classification, parallel agent dispatch, grep verification, domain playbook selection, retention narrative generation, docx export, and corrections-to-prior-audit headers.

3. **Excel master sheet** — new entry row 48, `Curated Workflows` tab, entry #30 "Product UX Audit", 5-star rating.

4. **workflows/Curated/README.md** — count bumped from 28 to 29, new row added.

5. **Full Directory stub** — `workflows/Full Directory/Product-UX-Audit/README.md` with rationale for promotion.

## Next Steps (Not Yet Done)

- **Docx companion** for the workflow (hard gate for Curated per house rules). Deferred to a follow-up session because it requires the `docx` skill and the TBK Labs house style template pass.
- **Slash command shim** at `.claude/commands/product-ux-audit.md` in target projects. Deferred — users can invoke the workflow by natural-language trigger until the shim ships.
- **Cascade the workflow file** to any existing project `.claude/workflows/` directory. No projects currently have a workflows subfolder; not urgent.
- **Dogfood the v2 skill** on a second codebase (non-TBK) to validate the Phase 0 classification catches the right calibration issues. TBK Legacy is the obvious next target.

## Failure Modes To Watch

1. **Skill/workflow drift.** Any future edit to the skill that should also apply to the workflow's orchestration path must be propagated. Add a note to the skill's changelog when changes are skill-only vs. workflow-only.
2. **Playbook staleness.** The 8 domain playbooks embedded in the v2 skill will go stale as the named competitors ship new features. Schedule a review every 6 months.
3. **Over-reliance on parallel agents.** Rule D1 is powerful but expensive. For small audits (<3 pages) the workflow should fall back to single-pass. The workflow README documents this but Claude may not respect it.
4. **Skipping Phase 0.** The single biggest failure mode the v2 addendum fixes. If Claude skips Phase 0 and jumps to discovery, the whole audit miscalibrates. The workflow README marks Phase 0 as MANDATORY but Claude has been known to skip mandatory steps when they feel like ceremony.
