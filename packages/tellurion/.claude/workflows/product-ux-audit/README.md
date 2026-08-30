**TBK Labs** · Curated Kit

---

# Product UX Audit

_10-phase product audit combining experience lens (`product-ux-review`) and craft lens (`meta-design`). **Phase 0 classification gate (Axis A type + Axis B vertical + commercial state + 3 peer refs) before ANY review runs. Every P0/P1 carries theory-bank citation + file:line evidence + peer comparison.**_

**CATEGORY** Workflows · Audits  •  **TRIGGER** `/product-ux-audit <target>`, `audit this product`, `full UX + craft review`  •  **RATING** ★★★★★ (10/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Phase 0 classification gate.** Names canonical "we audited a 'fintech app' generically, missed bank-grade compliance norms specific to that category" no-classification failure.
- **Theory-bank-cited findings.** Names canonical "findings list said 'feels confusing' with no theoretical basis, stakeholder dismissed" no-theory failure.
- **Peer comparison required.** Names canonical "P0 said 'this is bad' without 'peer Y ships correct behavior'; product team rejected" no-peer-comparison failure.

---

## What It Does

10-phase audit pipeline with 9 hard gates:

**Phase 0 — Classification.**
Required before any review:
- Axis A: functional type (consumer SaaS / B2B / marketplace / fintech / etc.)
- Axis B: vertical (healthcare / finance / education / etc.)
- Commercial state: pre-revenue / early / mature
- 3 named peer references (best-in-class in this Axis A × B)

**Phase 1-4 — Discovery + Setup.**
- Reachable surface area mapping
- Schema audit (data model vs UI utilization)
- Domain playbook lookup
- Acceptance criteria + scoring rubric

**Phase 5a — `product-ux-review` skill (Experience lens).**
- IA / flows / heuristics
- Data utilization vs schema
- Domain playbook compliance
- Retention narrative (Day 1 / Day 7 / Day 30)
- Copy / microcopy / empty states

**Phase 5b — `meta-design` skill (Craft lens, 15 dimensions).**
- Tokens first (gate), then typography, rhythm, contrast, states, motion, iconography, imagery, dark mode, responsive, brand coherence
- Token audit ALWAYS first (hard gate)

**Phase 6-8 — Merge + Verify + Deliver.**
- Merge findings from 5a + 5b
- Tag overlapping `LENS = both`
- Severity formula: `Score = F × I × P × R` (Frequency × Impact × Persistence × Reach), each 1-5
- P0 ≥ 48 AND blocks first-value OR first-impression
- P1 24-47
- P2 < 24

**Phase 10 — Implementation Playbook (on "fix all" / "implement"):**
- 10a Preflight: `git status` clean + re-read audit from disk + baseline `tsc --noEmit`
- 10b Cluster findings by change kind (ARIA / hex→token / skeleton / route payload / button-state / dead-code / schema-coupled)
- 10c Parallel implementation per cluster
- 10d Per-cluster `tsc --noEmit` between clusters
- 10e Single commit per cluster + summary

**Hard gates (9 total):**
1. Phase 0 classification (no Axis A/B/state/peers → refuse)
2. Token-audit-first (Dim 1 before others)
3. Theory-bank citation (every P0/P1)
4. Evidence gate (file:line or screenshot per P0)
5. Peer comparison ("peer X ships correct; we don't")
6. Dark-mode gate (if dark mode toggle exists, Dim 13 runs)
7. Phase 10 preflight clean
8. Phase 10 cluster-before-edit
9. Phase 10 per-cluster typecheck

---

## How to Use

1. Invoke `/product-ux-audit <target>` (URL or app name).
2. Phase 0 runs first — provide Axis A, Axis B, commercial state, 3 peer refs.
3. Phases 5a + 5b execute in parallel.
4. Findings merged with severity scores.
5. If you say "fix all": Phase 10 Implementation Playbook runs.
6. Output: report + implementation diff (if requested).

---

## What NOT to Do

- **Don't skip Phase 0.** Generic audits fail commercial-state validation.
- **Don't grade dimensions before tokens.** Dim 1 first.
- **Don't issue P0 without peer comparison.** Stakeholders dismiss.
- **Don't bypass Phase 10 preflight.** Dirty git state = bad implementation diff.
- **Don't edit before clustering.** Per-cluster typecheck = bisection-friendly.
- **Don't conflate with simple `/audit` command.** product-ux-audit is the full pipeline.

---

## Sample Output (B2B SaaS dashboard audit)

```
[User: /product-ux-audit acme-dashboard.com]

Phase 0 — Classification
  Axis A: B2B Analytics SaaS
  Axis B: Marketing operations
  Commercial state: Series A (revenue >$2M ARR)
  Peer references: Mixpanel, Amplitude, Heap
  ✓ Gate passes

Phase 1-4 — Discovery
  Surface area: 14 screens reachable from /dashboard
  Schema audit: 23 entities, 87% surfaced in UI
  Domain playbook: marketing-analytics-playbook v3.2 loaded
  Acceptance: Mixpanel-baseline parity + craft polish

Phase 5a — product-ux-review (Experience lens, 28 min)
  Findings: 14 (6 P0, 5 P1, 3 P2)
  Each P0 carries: theory-bank tag + file:line + peer comparison

  Example P0:
    [P0] Empty state on /reports omits recovery action
    Theory: [theory:empty-state-recovery] + [theory:next-step-affordance]
    File: src/screens/Reports/EmptyState.tsx:42
    Peer: Mixpanel shows "Create your first report" CTA + 3 templates;
          we show only "No reports yet."
    Score: F=4 × I=5 × P=4 × R=5 = 80

Phase 5b — meta-design (Craft lens, 18 min)
  Dim 1 Tokens: 23 hex literals not tokenized (P0)
  Dim 2 Typography: 4 system fonts mixed; should be 1-2
  Dim 13 Dark mode: SHIPS dark mode → audited
    Found 8 contrast failures + 3 token-mismatch errors

  Total: 12 findings (4 P0, 6 P1, 2 P2)

Phase 6-8 — Merge + Verify + Deliver
  Total: 26 findings (10 P0, 11 P1, 5 P2)
  LENS=both: 3 findings (overlapping concerns)
  Output: dev_docs/audits/2026-05-14-product-ux-audit.md

[User: "implement P0 fixes"]

Phase 10 — Implementation Playbook
  10a Preflight: git clean ✓, baseline tsc clean ✓
  10b Cluster:
    - hex→token cluster (4 findings)
    - ARIA cluster (2 findings)
    - empty-state cluster (1 finding)
    - skeleton-loader cluster (2 findings)
    - schema-coupled cluster (1 finding)
  10c Parallel implementation per cluster
  10d Per-cluster typecheck:
    hex→token: ✓
    ARIA: ✓
    empty-state: ✓
    skeleton: ✓ (no type errors)
    schema-coupled: ✓
  10e 5 commits + final summary
    Each commit: "fix(cluster): <change kind> [resolves AUDIT-FINDING-X]"

Final: 10 P0 findings closed across 5 commits. Audit report linked.
```

```bash
# Full audit (top of stack)
> /product-ux-audit acme-dashboard.com

# Lens-only invocations
> /product-ux-review acme-dashboard.com     # experience only
> /meta-design acme-dashboard.com           # craft only

# With implementation
> /product-ux-audit acme-dashboard.com fix=all
```

10-phase audit on B2B SaaS dashboard: Phase 0 classification + 5a experience + 5b craft (15 dimensions) → 26 findings (10 P0 with theory + evidence + peer comparison) → Phase 10 cluster-based implementation across 5 commits with per-cluster typecheck.

---

## Quick Reference

| Property | Value |
|---|---|
| **Workflow name** | product-ux-audit |
| **Category** | Workflows · Audits |
| **Rating** | ★★★★★ (10/10) |
| **Trigger** | `/product-ux-audit <target>` (also `/product-ux-review`, `/meta-design` for single-lens) |
| **Phases** | 10 (Classification / Discovery × 4 / Review-5a / Review-5b / Merge / Verify / Deliver / Implementation Playbook) |
| **Hard Gates** | 9 (classification, tokens-first, theory cite, evidence, peer, dark-mode, preflight, cluster, per-cluster tc) |
| **Severity** | F × I × P × R (1-5 each), P0 ≥ 48 + blocks first-value/impression |
| **Skills** | product-ux-review (experience lens) + meta-design (15 craft dimensions) |
| **Pairs With** | `omega-audit` workflow · `security-audit` workflow · `full-code-review` workflow · `design-engine` skill · `theory-bank` reference |
| **Bundle** | `WORKFLOW.md` + `INSTALL.md` + `README.md` + `theory-bank.md` + `commands/` + `skills/` + `product-ux-audit.docx` |

---

**TBK Labs** · Curated Kit · 2026-05-14

Vault note: [[workflow-product-ux-audit]]
