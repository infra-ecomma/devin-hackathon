---
description: Run a full product UX+UI audit via the Product-UX-Audit workflow (10 phases, 6 hard gates, dual skill, theory-bank tagged)
---

# /product-ux-audit

Run the **Product-UX-Audit** workflow (v2, 2026-04-07) from TBK Labs Curated Kit. This is NOT the single-pass `product-ux-review` skill — it is the 10-phase dual-skill orchestrated workflow that wraps both `product-ux-review` and `meta-design`, with six hard gates and theory-bank tag citations.

Canonical spec: `~/Documents/Organizing Claude Code/workflows/Curated/Product-UX-Audit/README.md`
Theory bank: `~/Documents/Organizing Claude Code/workflows/Curated/Product-UX-Audit/theory-bank.md`

## TBK Ads calibration hint

This product is a **Planning/Strategy + Measurement hybrid** for the paid-ads vertical. Execution gaps on Google Ads / Meta Ads are NOT automatic P0s — the product does not promise to execute. Do not grade strategy platforms as if they were execution platforms.

## Execute these phases in order. Hard gates cannot be skipped.

### Phase 0 — Product Type Classification (HARD GATE)
Before reading any code, declare in the audit doc:
- **Axis A** (functional): Planning/Strategy · Execution · Measurement · Hybrid · Collaboration · Creation · Marketplace · Dev Tool
- **Axis B** (vertical): paid ads · analytics · CRM · support · fintech · healthtech · dev tools · e-commerce · measurement/diagnostic · other
- **Commercial state**: pre-revenue · beta · paid · enterprise
- **Three peer references** this product competes with — these are the P0 calibration anchors
- **What the product promises** (one sentence) and **what it explicitly does NOT promise** (one sentence)

Refuse to enter Phase 1 until all five are written.

### Phase 1 — Parallel Discovery (rule D1, HARD GATE)
Dispatch **at least 4 Explore agents in a single message** along orthogonal lenses:
1. Routes / IA / Navigation / Middleware / Layouts
2. Components / Design tokens / Primitives / Tailwind config
3. Forms / Mobile / Accessibility / Input primitives / Error states
4. Domain UX (paid-ads loop: brief → structure → keyword/audience → creative → budget → launch → measure → optimize)
5. (Optional) Business Model / Multi-Tenancy / Quotas / Permissions

Each agent cites `file:line` and classifies findings as **Missing / Broken / Exists-but-Not-Wired** with tentative P0/P1/P2 calibrated to Phase 0.

### Phase 2 — Grep Verification (rule D2, HARD GATE)
Grep-verify every count, path, and line the agents reported. Log drift corrections in a **Corrections to Agent Drift** section. Use the verified number, never the agent's number.

### Phase 3 — Schema-vs-UI Parity
Enumerate every Drizzle column/enum. Grep each against the UI. Classify as Read-and-displayed / Read-but-buried / Never-read. Dead schema is always a finding.

### Phase 4 — Apply Paid-Ads Domain Playbook
Grade each stage of the canonical loop as Present / Partial / Stub / Missing. Use the playbook shipped with `product-ux-review` v2.

### Phase 5 — Dual-Skill Review (HARD GATE)
Run **both** skills back-to-back on the Phase 1–4 findings:
- **5a — `product-ux-review` v2** (UX spine): 16 dimensions, heuristics, data utilization, retention machinery
- **5b — `meta-design` v2** (UI craft spine): tokens, typography, rhythm, hierarchy, motion, responsive

Merge outputs into one findings table with a LENS column (P / M / both). Every P0 and P1 carries at least one `theory-bank.md` tag in `[tag]` form.

### Phase 6 — Retention Narrative
- **Day 1**: first-session first-value walk
- **Day 7**: name exactly three gaps that would churn a paying customer, each with user story + finding number + minimum fix + eng-day cost
- **Day 30**: power-user pull, value accumulation, retention machinery

### Phase 7 — Verification Pass (HARD GATE)
Run the checklist from the canonical README. Every P0 must carry:
- a theory-bank tag
- a peer comparison ("peer X ships this; we do not")
- a F × I × P × R severity score (each 1–5, product ≥ 48)
- defensibility against Phase 0 promise

Downgrade anything that fails.

### Phase 8 — Corrections to Prior Audit (rule D4)
If a prior `ux-audit-*.md` exists, open the new report with a **Corrections to Prior Audit** section: wrong counts, components that exist, miscalibrations, missed findings.

### Phase 9 — Deliver (HARD GATE)
- Save as `audits/ux-audit-YYYY-MM-DD.md` in project root (create `audits/` directory if needed)
- Generate `.docx` companion via the `docx` skill in TBK Labs house style and save to `audits/ux-audit-YYYY-MM-DD.docx`
- Archive any prior audit to `audits/_house-style-backups/` first
- Return both paths in chat and summarize the three Day-7 risks inline
- **Stop here** unless the user explicitly says "fix all" / "implement" / "apply". Phases 10a–10e only run on that signal.

### Phase 10a — Implementation Preflight (HARD GATE, only if user says "fix all")
Before touching any file:
1. `git status` — if the working tree is dirty, list the unrelated files and ask the user to stash/commit them first. Do not mix audit fixes with pre-existing dirt.
2. Re-read the saved `audits/ux-audit-YYYY-MM-DD.md` from disk. Do NOT trust a compaction summary's claim of where implementation left off — the summary loses findings. The audit file on disk is the source of truth.
3. Build an explicit remaining-findings list from the disk audit: `[F1, F2, ..., Fn]` minus any already-closed. Print it in the chat before any edit.
4. Run `tsc --noEmit` once to baseline the starting TypeScript state. Implementation cannot make the baseline worse.

### Phase 10b — Cluster Findings by Type (MANDATORY before edits)
Do NOT process findings in audit-doc order (F1 → F2 → F3 …). That is almost always the wrong order: it serializes independent work. Instead, bucket findings into clusters by the KIND of change they are:
- **ARIA / a11y attributes** — all findings that add aria-* attributes, role, id, focus management
- **Hex literal → token replacements** — all findings that swap hardcoded colors for `CHART_THEME` / token references
- **Loading/empty/error states (skeletons)** — all findings that add skeleton / empty / error treatments
- **Route payload extensions** — all findings that extend a public route to return new fields (e.g. tuner_branding across three share routes)
- **Button/state refinements** — disabled states, saving states, toast states
- **Dead code deletions** — findings that delete unused primitives (D3 "Exists-but-Not-Wired" misses)

Each cluster becomes a single sub-task. Independent clusters can be parallelized via `Agent (Explore)` for discovery + `Edit ×N` for application. Dependent clusters (e.g. route payload → client render of that field) must stay serial.

### Phase 10c — Parallel Implementation
For each independent cluster, issue the cluster's Edit calls in a single message (Claude supports parallel tool calls). Example: the ARIA cluster applies 8 edits across 5 files in one parallel batch rather than 8 sequential turns. **Rule:** if two findings edit the same file at the same line range, serialize them; otherwise parallelize. The TBK Legacy 2026-04-08 implementation run was ~70% sequential when ~55% of the work was independent. This phase closes that gap.

### Phase 10d — Typecheck Between Clusters (HARD GATE)
After each cluster finishes, run `tsc --noEmit` on the affected app root. Block the next cluster if the baseline has regressed. This is the same rule the `Pre-Commit-Quality` hook enforces at commit time, but run per-cluster during implementation so a bad cluster is caught at the 5-minute mark instead of the 45-minute mark. Context: TBK Legacy 2026-04-08 commit `c28a876` failed Vercel because a stale `analysisRow.engine_code` reference survived a cluster-level SELECT edit; a per-cluster typecheck would have surfaced it before the commit.

### Phase 10e — Single Commit + Summary (HARD GATE)
1. `git add <explicit paths only>` — never `git add -A` during an audit fix-all; the dirty tree from Phase 10a may still have unrelated files.
2. One commit with message `fix(audit): implement all N UX-audit findings from audits/ux-audit-YYYY-MM-DD` (no amending).
3. `git push`.
4. Append an **Implementation summary** block to the audit `.md` file on disk at `audits/ux-audit-YYYY-MM-DD.md` listing each finding's status: DONE / DEFERRED (reason) / NOT-NEEDED (reason) / BROKEN (rolled back).
5. Report to chat: commit SHA, files changed, findings closed, findings deferred, any regressions found and rolled back.

## Severity formula (mandatory per P0/P1)

**Score = F × I × P × R**, each 1–5:
- **F**requency (1 = lifetime-once, 5 = every session)
- **I**mpact (1 = cosmetic, 5 = blocks promised first-value)
- **P**ersistence (1 = workaround in one try, 5 = friction every time)
- **R**eversibility (1 = trivial, 5 = churn-triggering / data loss)

**Mapping:** P0 ≥ 48 AND blocks first-value AND a named peer ships the correct behavior. P1 24–47. P2 < 24. Phase 0 promise is the ceiling — no P0 for unpromised capabilities.

## References
- Canonical workflow: `~/Documents/Organizing Claude Code/workflows/Curated/Product-UX-Audit/README.md`
- Theory bank: `~/Documents/Organizing Claude Code/workflows/Curated/Product-UX-Audit/theory-bank.md`
- Skill: `.claude/skills/product-ux-review/SKILL.md` (v2)
- Sibling skill: `.claude/skills/meta-design/SKILL.md` (v2)
- Global audit rules: `~/.claude/CLAUDE.md` (D1–D4, Meta-Design Implementation Spec)
