---
name: product-ux-audit
description: "Replaces single-pass auditing with a ten-phase pipeline that fixes three failure modes: miscalibration (product type determines severity), shallow discovery (four parallel Explore agents), missing 'so what' (Day-1/7/30 retention narrative). Output: dated `ux-audit-YYYY-MM-DD.md`."
  Replaces single-pass auditing with a ten-phase pipeline: classify → parallel discover → grep-verify → schema parity → domain playbook → dual-skill review → retention narrative → verification → corrections → deliver → (conditional) implement. The output is a dated `ux-audit-YYYY-MM-DD.md` audit plus a TBK Labs house-style `.docx` companion, each containing a Phase 0 block, a corrections-to-prior-audit header when applicable, a Missing/Broken/Exists-but-Not-Wired findings table with file+line citations and theory-bank tags, a Day-1/7/30 retention narrative, and a self-eval checklist. When the user explicitly says "fix all" after delivery, Phase 10 kicks in: preflight → cluster findings by change kind → parallel implementation → typecheck between clusters → single commit with implementation summary.
category: design
triggers:
  - "/product-ux-audit"
  - "help with product-ux-audit"
user_invocable: true
---

> **CHAIN:** After this workflow → quality-gate

# Product Ux Audit

## Purpose

Replaces single-pass auditing with a ten-phase pipeline that fixes three failure modes: miscalibration (product type determines severity), shallow discovery (four parallel Explore agents), missing "so what" (Day-1/7/30 retention narrative). Output: dated `ux-audit-YYYY-MM-DD.md` + house-style `.docx` + retention narrative + optional Phase 10 implementation.

## Prerequisites

- Codebase with git history (for Phase 2 grep-verification)
- Access to domain logic, schema, components, and config
- Product type classification (functional axis, vertical, commercial state, three peer references)
- Willing to invest 2–4 hours (full app) to complete the full audit

## Why It Earns the Curated Bar

The standalone `product-ux-review` skill produces heuristic findings in a single pass. That is useful for a 5-page app and actively misleading for anything larger. The workflow wraps the skill in a 10-phase pipeline that fixes the three failure modes the single-pass approach keeps repeating:

1. **Miscalibration.** Without a product-type classification, a strategy platform gets graded as if it were an execution platform, and "no live telemetry" becomes a false P0. Phase 0 is a hard gate that refuses to proceed until the product is typed and three peers are named.
2. **Shallow discovery.** A single reader, regardless of how careful, cannot hold routes, components, forms, domain logic, schema, and business model in one head at once. Phase 1 forces at least four parallel Explore agents on orthogonal lenses, and Phase 2 grep-verifies every count they report because agents drift.
3. **Missing the "so what."** A findings table does not tell an exec whether a paying customer will churn by day 7. Phase 6 writes a Day-1/7/30 retention narrative with named churn risks, minimum-viable fixes, and cost estimates. This is the part that gets read.

The workflow is dual-skilled by design. Phase 5a runs `product-ux-review` for the user-experience spine (flows, heuristics, data utilization, discoverability, freshness). Phase 5b runs `meta-design` for the craft spine (tokens, typography, rhythm, hierarchy, motion). UX without UI is a whitepaper; UI without UX is a brochure. Both ship together or neither ships.

v2.2 (2026-04-08) adds **Dimension 17 — Journey-Level Boundary Audit**, which invokes the standalone `journey-audit` skill to trace user journeys across every system boundary. This catches the class of bug that file-level dimensions structurally miss: implicit data contracts, race conditions at handoff points, silent failure modes under production timing, and state that leaks or vanishes at boundary crossings. Dimension 17 is mandatory for any product with a payment flow or multi-step onboarding.

Every finding is tagged against `theory-bank.md`, so severities trace back to a cited law or heuristic instead of vibes. A P0 that does not name its governing principle is rejected in Phase 7.

The workflow earned Curated after live runs on TBK Ads (2026-04-07) and TBK Legacy (2026-04-07, dogfood v2), both of which exposed gaps the single-pass skill would have missed and both of which the hardened workflow caught on the first run.

---

## Severity Formula

Every P0/P1/P2 label must be justified against this formula. No "feels like a P0" findings ship.

**Severity score = F × I × P × R**, where each factor is 1–5:

- **F — Frequency.** How often does the user hit this? 1 = once per account lifetime; 5 = every session.
- **I — Impact.** What breaks when they hit it? 1 = cosmetic annoyance; 5 = blocks the promised first-value moment.
- **P — Persistence.** Does the user route around it or keep hitting it? 1 = learned workaround in one try; 5 = friction every single time, no workaround.
- **R — Reversibility.** Can the user recover after hitting it? 1 = trivial to recover; 5 = data loss, lost trust, or churn-triggering.

**Mapping to severity buckets:**

- **P0** ≥ 48 and blocks the promised first-value moment **and** a named peer ships the correct behavior. If any of those three conditions fails, downgrade.
- **P1** 24–47, or anything that erodes day-7 retention without blocking first value.
- **P2** < 24, polish and debt. Ship in batches, never as headline findings.

**Phase 0 override.** A finding cannot be P0 if it targets a capability the product does not promise. A strategy platform gets no P0 for missing execution APIs; a single-player tool gets no P0 for missing team features. The product's own positioning is the ceiling.

---

## Theory-Bank Integration

`theory-bank.md` (co-located in this folder) is the single source of truth for every law, heuristic, and framework an audit cites.

**Rules:**

- Every P0 and P1 finding MUST carry at least one theory-bank tag in its footer line.
- The tag citation format is `[tag]` at the end of the finding's fix line — e.g. `[fitts, hick]`.
- If no tag fits, the finding is either (a) not actually a UX finding, or (b) evidence the theory bank needs a new entry. Both cases escalate to the auditor.
- The Phase 7 verification pass grep-checks every citation against `theory-bank.md` tag list and rejects unknown tags.

---

## Phase 0 — Product Type Classification (HARD GATE)

**Goal:** Declare product dimensions and calibration anchors before reading any code

**Actions:**
1. Write into audit doc: Axis A (Planning, Execution, Measurement, Hybrid, Collaboration, etc.)
2. Write Axis B (vertical: paid ads, analytics, CRM, support, fintech, e-commerce, etc.)
3. Write commercial state (pre-revenue, beta, paid, enterprise)
4. Name THREE peer references (these are P0 calibration anchors)
5. One sentence: "This product promises [X]" + one sentence: "It explicitly does not promise [Y]"

**Gate:** Must have all five elements in writing before proceeding to Phase 1

**Output:** Phase 0 block in audit document with clear classification

## Phase 1 — Parallel Discovery with Four Explore Agents (HARD GATE)

**Goal:** Capture orthogonal views of the codebase in parallel (not serial)

**Actions:**
1. Dispatch FOUR agents in a SINGLE message on these lenses:
   - Agent 1: Routes, IA, Navigation, Middleware, Layouts
   - Agent 2: Components, Design Tokens, Primitives, CSS & Tailwind config
   - Agent 3: Forms, Mobile, Accessibility, Input primitives, Error states
   - Agent 4: Domain UX (canonical loop for Axis B)
2. Each agent cites file:line and classifies findings as Missing / Broken / Exists-but-Not-Wired with P0/P1/P2 severity
3. Collect receipts — visible four distinct agent invocations in conversation

**Gate:** Must see four distinct agent invocations; "I would have run them" does not count

**Output:** Four discovery reports (one per agent) with file:line citations

## Phase 2 — Grep Verification (rule D2, HARD GATE)

**Goal:** Verify every count, path, and line number agents reported before drafting findings

**Actions:**
1. For each count, path, and line number any agent reported, grep-verify from actual codebase
2. Use verified numbers, not agent numbers
3. If agent reported "0 imports," grep first before believing it
4. Log corrections in "Corrections to Agent Drift" section
5. Document which agent claims were right and which drifted

**Gate:** Must have zero-drift report or documented drift corrections

**Output:** Verified findings table with agent drift corrections documented

## Phase 3 — Schema-vs-UI Parity Protocol

**Goal:** Enumerate every database column and compare to UI layer

**Actions:**
1. Extract all Drizzle/Prisma/SQL columns and enums
2. Grep each column against UI layer
3. Classify as: Read-and-displayed, Read-but-buried, or Never-read
4. Dead schema is always a finding (severity depends on Phase 0)

**Output:** Schema parity table with read status per column

## Phase 4 — Domain Playbook

**Goal:** Grade each stage of the canonical loop (e.g., brief → structure → keyword → creative → budget → launch → measure → optimize)

**Actions:**
1. Select playbook for Axis B: paid ads, analytics, CRM, support, fintech, healthtech, e-commerce, dev tools, or measurement
2. Grade each stage: Present / Partial / Stub / Missing
3. Missing stages become findings, severity calibrated to Phase 0

**Output:** Domain playbook audit with stage status

## Phase 5 — Dual-Skill Review (HARD GATE)

**Goal:** Run both UX spine and UI/craft spine on same findings

**Actions:**
1. Phase 5a: Run product-ux-review skill (16 dimensions: flows, heuristics, data utilization, discoverability, empty/error/loading states, retention machinery)
2. Phase 5b: Run meta-design skill (tokens, typography, hierarchy, contrast, motion, responsive)
3. Tag each with LENS column (P for product-ux-review, M for meta-design, or both)
4. Merge both into single findings table

**Gate:** Both skills must be run; UX without UI or UI without UX = half-audit

**Output:** Merged findings table with dual-skill provenance tagged

## Phase 6 — Retention Narrative (Executive Summary)

**Goal:** Write three prose sections for non-engineer executive (5-minute read)

**Actions:**
1. **Day 1 — First-session first-value:** Walk happy path from landing to promised value. Name what works and what blunts it.
2. **Day 7 — Three churn risks:** Name exactly three gaps causing paying customer to cancel. Each gets user story, underlying finding #, minimum-viable fix, cost estimate in eng-days.
3. **Day 30 — Power-user pull:** What keeps power user coming back? What value accumulates across sessions? What retention machinery exists but is invisible in UI?

**Gate:** Must have three specific Day-7 risks with fixes and costs (no hedging)

**Output:** Three prose sections (Day 1, 7, 30 narrative)

## Phase 7 — Verification Pass (HARD GATE)

**Goal:** Re-read entire audit with hard checklist

**Actions:**
1. Every P0 has a theory-bank.md tag
2. Every P0 has a Phase 0 peer comparison
3. Every P0 has a Frequency × Impact × Persistence × Reversibility score
4. Every P0 is defensible against what product actually promises
5. Every file+line citation has been re-grepped
6. Retention narrative names three specific Day-7 risks with fixes and costs
7. Both Phase 5 skills have been run and merged
8. All theory-bank tags are valid entries

**Gate:** Downgrade anything that fails; delete anything that can't be rescued

**Output:** Verified audit document with all gates confirmed

## Phase 8 — Corrections to Prior Audit

**Goal:** If prior audit exists, surface what changed

**Actions:**
1. If prior ux-audit-*.md exists in audits/ folder, open new report with "Corrections to Prior Audit" section
2. List: wrong counts, components claimed dead but wired, miscalibrated findings, gaps prior audit missed
3. Archive prior audit to audits/_house-style-backups/ before overwriting

**Output:** Corrections section documenting prior audit learnings

## Phase 9 — Deliver (HARD GATE)

**Goal:** Save audit and .docx companion, deliver to user

**Actions:**
1. Save as audits/ux-audit-YYYY-MM-DD.md
2. Generate .docx companion in TBK Labs house style (blue #0B4FC7, Arial, Heading1/Heading2 overrides, dated footer)
3. Summarize three Day-7 churn risks in chat (so user sees them without opening doc)
4. Return both file paths as clickable links
5. STOP here unless user explicitly says "fix all" / "implement" / "apply"

**Gate:** Both .md and .docx must exist and be verified on disk before marking complete

**Output:** audits/ux-audit-YYYY-MM-DD.md + audits/ux-audit-YYYY-MM-DD.docx + chat summary

## Phase 10 — Implementation Playbook (Conditional, fires only on "fix all")

**Goal:** Implement all findings systematically if user explicitly requests

**Actions:**
1. **Phase 10a Preflight:** git status (tree must be clean), re-read audit from disk (not summary), tsc --noEmit (baseline)
2. **Phase 10b Cluster by type:** Group by change kind (ARIA, hex-token, skeleton, payload, button-state, dead-code, schema-coupled) not audit order
3. **Phase 10c Parallel implementation:** Issue Edit calls per cluster in single message (batch independent changes)
4. **Phase 10d Typecheck between clusters:** After each cluster, tsc --noEmit; block next if baseline regressed
5. **Phase 10e Single commit:** git add with explicit paths (never -A), commit once with all findings, git push, append Implementation Summary to audit .md

**Gate:** Phase 10 only fires on explicit "fix all" signal; preflight must pass; per-cluster typecheck must pass

**Output:** Single fix: commit with implementation summary appended to audit

## Hard Gates Summary

1. **Phase 0 gate:** Product type, three peers, promises/non-promises in writing before Phase 1
2. **Phase 1 gate (rule D1):** Four visible agent invocations in single dispatch
3. **Phase 2 gate (rule D2):** Grep-verify every count before drafting findings
4. **Phase 5 gate:** Both product-ux-review and meta-design run (never one without the other)
5. **Phase 7 gate:** Every P0 has theory-bank tag, peer comparison, and F×I×P×R score
6. **Delivery gate:** Both .md and .docx generated; prior audit archived
7. **Phase 10 preflight gate (fix-all only):** Clean tree, re-read from disk, baseline typecheck
8. **Phase 10 per-cluster typecheck gate (fix-all only):** tsc passes after each cluster

## Chain Dispatch

| Next Skill | Condition |
|---|---|
| quality-gate | Always (after Phase 9 delivery) |

## What NOT to Do

- **Don't skip Phase 0.** Miscalibration (treating execution platform as strategy platform) is the most expensive mistake.
- **Don't run discovery single-threaded.** Rule D1 requires four parallel agents in one dispatch.
- **Don't trust agent counts.** Rule D2 is mandatory; log every drift in "Corrections to Agent Drift."
- **Don't run only one Phase 5 skill.** UX without UI ships a half-audit; UI without UX ships a brochure.

## Usage

Invoke with `/product-ux-audit` or describe the product and what you want audited. Provide business context (Axis A, B, state, peers) in the first message for fastest setup.
