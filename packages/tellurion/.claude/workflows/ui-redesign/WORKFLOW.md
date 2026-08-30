---
name: ui-redesign
description: "Chains six skills in sequence: classification → intent extraction → pattern selection → interface design → code generation → critique. Each phase constrains the next. Classification Card is the source of truth for all downstream decisions. Three branches: full redesign (all 6 ste."
  Chains six skills in sequence with context flowing forward. Each skill is independently callable, but this workflow runs them as a pipeline with checkpoints between phases. The Classification Card produced in Step 1 constrains every downstream decision. The pipeline has three branches: full redesign (all 6 steps), component-level (skip classification if Card exists), and incremental fix (skip to code gen + critique).
category: design
triggers:
  - "/ui-redesign"
  - "help with ui-redesign"
user_invocable: true
---

> **CHAIN:** After this workflow → quality-gate

# Ui Redesign

## Purpose

Chains six skills in sequence: classification → intent extraction → pattern selection → interface design → code generation → critique. Each phase constrains the next. Classification Card is the source of truth for all downstream decisions. Three branches: full redesign (all 6 steps), component-level (scoped with existing Card), incremental fix (Card + critique-only).

## Prerequisites

- Codebase with .claude/ directory
- Access to package.json, schema, TypeScript types, existing components, globals.css
- Optional: reference images or templates for principle extraction
- Scope: dashboard/component/page name (defaults to full dashboard)

## Step 1 — Product Classification (HARD GATE)

**Goal:** Classify product across 8 dimensions to constrain all downstream decisions

**Actions:**
1. Read: README, package.json, schema, TypeScript types, existing components, globals.css
2. Classify across 8 dimensions:
   - Product type (SaaS dashboard, consumer app, dev tool, marketplace, etc.)
   - Domain (analytics, CRM, marketing, operations, etc.)
   - Archetype (analytical, operational, creative, exploratory, etc.)
   - User profile (domain expert, generalist, technical, non-technical, etc.)
   - Data architecture (time-series, dimensional, event, transactional, etc.)
   - Decision velocity (real-time, daily, weekly, offline analysis)
   - Density band (sparse to dense on information density spectrum)
   - Tenancy model (single-tenant, multi-tenant, partner-mode)
3. Extract Primary Metrics (ordered by domain importance)
4. Extract Comparison Axes (what users compare across)
5. Produce CLASSIFICATION.md with all dimensions and derived constraints

**Checkpoint:** Present Classification Card to user; confirm accuracy before proceeding

**Skip condition:** Card exists and user confirms it's still accurate

**Gate:** Card must exist and pass user confirmation; missing or inaccurate Card = workflow fails

**Output:** .claude/CLASSIFICATION.md with full 8-dimension classification

## Step 2 — Design Intent Extraction (if references exist)

**Goal:** Extract design principles from reference images, filtered through Classification Card

**Actions:**
1. Check for reference images: ls Dashboards/ references/ assets/references/ design-refs/
2. For each reference, extract principles: spacing logic, hierarchy strategy, density approach, interaction patterns
3. Filter extracted principles through Classification Card constraints
4. Classify as: Adopted (matches product type), Overridden (conflicts, document why)
5. Produce INTENT_[source].md for each reference with Extracted → Adopted → Overridden logic

**Checkpoint:** Present adopted vs. overridden principles; user confirms

**Skip condition:** No references provided OR Intent Documents already exist and current

**Gate:** If references provided, both principles extraction and adoption logic must be shown

**Output:** .claude/INTENT_[source].md per reference

## Step 3 — Pattern Selection

**Goal:** Select layout template, component density, navigation, spacing from domain-pattern-library

**Actions:**
1. Using Classification Card's Derived Constraints, select:
   - Layout template (A through E based on archetype + data architecture)
   - Component density variants (based on density band)
   - Navigation pattern (based on tenancy + hierarchy depth)
   - Interaction patterns (based on decision velocity)
   - Spacing grid and typography scale (based on density band)
2. Present selected patterns to user
3. This is the structural blueprint before any design decisions

**Checkpoint:** User confirms layout and pattern choices make sense

**Gate:** Pattern selections must be visible and user-confirmed

**Output:** Pattern selections in working memory (not persisted; guides Step 4)

## Step 4 — Interface Design

**Goal:** Execute design decisions constrained by Classification Card and selected patterns

**Actions:**
1. Establish 3 signature design decisions (from interface-design Phase 1, using Classification Card and patterns as constraints)
2. Define navigation structure (from Classification Card's hierarchy + tenancy)
3. Make 7 table decisions (columns, density, sorting, filtering, pagination, cell state, comparison mode — using domain-pattern-library table variant)
4. Define form patterns if applicable (from interface-design Phase 4)
5. Define density and information architecture (from Classification Card's density band)
6. Produce DESIGN_DECISIONS.md with all decisions documented

**Checkpoint:** User confirms design decisions

**Gate:** All signature decisions must trace back to Classification Card; no free-form guessing

**Output:** .claude/DESIGN_DECISIONS.md with signature decisions, navigation structure, table decisions

## Step 5 — Code Generation & Blueprint

**Goal:** Generate complete page files from Classification Card and pattern selections

**Actions:**
1. **Phase 5a — Dashboard Blueprint:** Map Classification Card Primary Metrics to page positions, ordered by domain importance. Produce DASHBOARD_BLUEPRINT.md with KPI strip, above-fold hierarchy, chart type mapping, widget grouping
2. **Phase 5b — Structural Audit (HARD GATE):** Before generation, verify generation is needed: (1) Will layout structure differ? (2) Will information hierarchy shift? (3) Will navigation change? If NO to all 3, skip to Step 6 (don't regenerate)
3. **Phase 5c — Code Generation:** Generate complete page files using code-generation skill with 8-phase process: framework detection, design token generation, component code with all states, TypeScript interfaces, Storybook stories, test scaffolds, data contract generation, linting
4. **Phase 5d — Diff Review:** Produce NOVELTY_DIFF.md showing what was replaced (and why each traces to Classification Card) and what was preserved
5. **Phase 5e — Accessibility & Responsive Validation (HARD GATE):** Verify WCAG AA compliance, responsive at 1440px/768px/375px, keyboard navigation. All must pass
6. **Phase 5f — Version Control Setup:** Create git baseline with tag redesign-v1-start, create REDESIGN_METADATA.md with classification dimensions, blueprint timestamp, baseline hash

**Checkpoint:** Present blueprint, audit pass/fail, accessibility report, and diff to user

**Gate:** Phase 5b (structural audit) must confirm generation is needed; Phase 5e (accessibility) must pass before proceeding

**Output:** Complete generated page files + .claude/DASHBOARD_BLUEPRINT.md + .claude/NOVELTY_DIFF.md + .claude/REDESIGN_METADATA.md

## Step 6 — Design Critique

**Goal:** Score generated code against Classification Card and adopted principles

**Actions:**
1. Run design-critique skill on generated code
2. Evaluate against: Classification Card constraints, adopted principles from Step 2, Nielsen heuristics, design token adherence
3. Classify findings: P0 (fix immediately), P1 (present to user with fixes), P2 (log for later)
4. Produce CRITIQUE_[date].md with scored evaluation

**Checkpoint:** P0 findings fixed and re-critiqued before delivery

**Gate:** P0 findings block delivery; must be fixed and re-critiqued

**Output:** CRITIQUE_[date].md with scored findings

## Branching Logic

**Branch A — Full Redesign:** Run all 6 steps. Re-validate at Step 1: does Classification Card exist? If yes, is it still accurate for this redesign? If user says no, re-run Step 1. If yes, proceed to Step 2.

**Branch B — Component-Level:** Classification Card exists? Yes → scope patterns to component type. Skip Step 1. Proceed to Step 3 (pattern selection for specific component), then Steps 4-6 scoped to that component.

**Branch C — Incremental Fix:** Classification Card exists but inaccurate? Run Step 1 first. Card accurate? Extract P0/P1 from prior CRITIQUE_*.md. Skip Steps 2-4. Jump to Step 5 (code generation focused on addressing P0/P1 findings), then Step 6 to verify fixes.

## Hard Gates

1. **Classification-first gate.** No design decisions without a Classification Card. If no Card exists and user refuses to classify, workflow stops.
2. **Checkpoint gate.** User confirmation required between Steps 1, 2, 3, 5.
3. **Intent-not-pixels gate.** If references provided, extract principles; never copy template pixel-for-pixel.
4. **Enforcement gate.** design-enforcement hook fires on every code write. Issues are addressed before critique.
5. **Generation contract gate.** Step 5 must produce Dashboard Blueprint mapping Primary Metrics to page positions and generate complete page files. If output is only CSS tweaks, the step has failed.
6. **Pre-generation structural audit gate (Phase 5b).** Verify generation is actually needed (layout structure change, information hierarchy shift, navigation change). If no to all 3, skip to Step 6.
7. **Accessibility gate (Phase 5e).** WCAG AA compliance + responsive at 3 breakpoints + keyboard navigation. All must pass.
8. **P0-fix gate.** P0 findings from critique must be fixed and re-critiqued before delivery.

## Chain Dispatch

| Next Skill | Condition |
|---|---|
| quality-gate | After Step 6 critique complete |

## What NOT to Do

- **Don't skip classification.** Jumping to patterns without understanding product's data model, user archetype, decision velocity is the root cause of every bad AI dashboard.
- **Don't copy a template pixel-for-pixel.** Extract principles; understand why choices were made for that product, then apply to yours.
- **Don't patch instead of generate.** Classification identifies domain metrics correctly, but Step 5 edits existing layout instead of generating new one. Result: same layout, better typography (cosmetic, not a redesign).

## Usage

Invoke with `/ui-redesign` for full redesign, `/ui-redesign [component]` for scoped redesign, `/ui-redesign --fix` for incremental improvement. Include business/product context in first message for fastest setup.


---

<!-- AUDIT-2026-04-26 batch-3: appended sections from MSK/plugin/ui-redesign -->


## Skill Dependencies

This workflow chains six skills. All must be present in `.claude/skills/`:

| Skill | Role | Output |
|---|---|---|
| `product-classification` | Classify the product across 8 dimensions | `.claude/CLASSIFICATION.md` |
| `design-intent-extraction` | Extract principles from reference images | `.claude/INTENT_[source].md` |
| `domain-pattern-library` | Select layout template + component variants | Working memory (pattern selections) |
| `interface-design` | Make signature design decisions | Design decisions document |
| `design-html` | Generate production component code | `.tsx`, `.jsx`, `.html`, `.css` files |
| `design-critique` | Score and evaluate the generated UI | Critique report with P0/P1/P2 findings |

The `design-enforcement` hook (`.claude/hooks/design-enforcement.sh`) fires automatically during Step 5 on every `.tsx/.jsx/.html/.css` write.

**Skill Verification (Phase 0):** Before proceeding, verify all required skills are installed:
1. Run: `ls ~/.claude/skills/` or check COMPONENT-REGISTRY.md
2. For each skill listed above, confirm the .md file exists
3. If any skill is missing (D1 classification), note it and proceed with available skills only
4. Missing skills reduce workflow coverage but do not block execution

## Immediate Actions

1. **Read every skill in the chain** before doing anything:
   - `.claude/skills/product-classification/SKILL.md`
   - `.claude/skills/design-intent-extraction/SKILL.md`
   - `.claude/skills/domain-pattern-library/SKILL.md`
   - `.claude/skills/interface-design/SKILL.md`
   - `.claude/skills/design-html/SKILL.md`
   - `.claude/skills/design-critique/SKILL.md`
2. **Check for existing artifacts** — a Classification Card or Intent Documents may already exist from a prior run:
   ```bash
   cat .claude/CLASSIFICATION.md 2>/dev/null
   ls .claude/INTENT_*.md 2>/dev/null
   ```
   If they exist and are still current, skip to the step that needs them. Don't redo classification for a product that hasn't changed.

## Procedure

### Step 1 — Product Classification

**Skill:** `product-classification`
**Produces:** `.claude/CLASSIFICATION.md` (Product Classification Card)

Classify the product across all 8 dimensions. Read the codebase systematically: README, package.json, database schema, TypeScript types, existing components, globals.css. Produce the Card with Domain Data Model and Decision Map.

**Checkpoint:** Present the Classification Card to the user. Get confirmation before proceeding. The Card constrains everything downstream — if it's wrong, everything else will be wrong.

**Skip condition:** Card already exists and the user confirms it's still accurate.

### Step 2 — Design Intent Extraction (if references exist)

**Skill:** `design-intent-extraction`
**Produces:** `.claude/INTENT_[source].md` (Design Intent Documents)

Check for reference images, templates, or examples:
```bash
ls Dashboards/ references/ assets/references/ design-refs/ 2>/dev/null
```
Also check if the user provided references in the conversation.

If references exist, extract principles from each, filter through the Classification Card, produce Intent Documents.

If NO references exist, skip this step. The Classification Card alone provides sufficient constraints.

**Checkpoint:** Present adopted vs. overridden principles. User confirms.

**Skip condition:** No references provided or Intent Documents already exist.

### Step 3 — Pattern Selection

**Skill:** `domain-pattern-library`
**Produces:** Selected layout template + component variants (in working memory, not a file)

Using the Classification Card's Derived Constraints, look up:
- Layout template (A through E) based on dashboard archetype + data architecture
- Component density variants based on density band
- Navigation pattern based on tenancy + hierarchy depth
- Interaction patterns based on decision velocity
- Spacing grid and typography scale based on density band

Present the selected patterns to the user. This is the structural blueprint.

**Checkpoint:** User confirms the layout and pattern choices make sense for their product.

### Step 4 — Interface Design

**Skill:** `interface-design`
**Produces:** Design decisions document + signature decisions

Execute interface-design's process with the Classification Card and selected patterns as hard constraints:
- Establish 3 signature design decisions (from interface-design Phase 1)
- Define navigation structure (from Classification Card's hierarchy + tenancy)
- Make the 7 table decisions (from interface-design Phase 3, using domain-pattern-library table variant)
- Define form patterns if applicable (from interface-design Phase 4)
- Define density and information architecture (from Classification Card's density band)

**Checkpoint:** User confirms the design decisions.

### Step 5 — Code Generation (GENERATIVE, NOT PATCHING)

**Skill:** `design-html`
**Produces:** Complete new page files + Dashboard Blueprint (.claude/dashboard-blueprint.md)

This step GENERATES complete pages from the Classification Card and pattern selections. It does NOT patch existing code. The distinction matters: patching preserves the existing structure (which may be wrong). Generation builds the correct structure from the classification.

**Phase 5a: Dashboard Blueprint**
Before writing any code, design-html produces a concrete blueprint that maps:
- Classification Card's Primary Metrics → KPI strip positions (ordered by domain importance)
- Classification Card's Decision Map → information hierarchy (what's above the fold)
- Data architecture → chart types (time-series → line charts, snapshot → stat tiles)
- Comparison axes → table columns and widget grouping

Present the blueprint to the user. This is the structural plan for the page.

**Phase 5b: Page Generation**
Generate COMPLETE page files:
- Read domain-pattern-library for layout template, density, spacing
- Read globals.css for design tokens
- Produce the full page component with imports, data fetching, and composition
- Reuse existing components where they fit (StatCard, DashboardGrid, etc.)
- Replace components that don't match the classification (e.g., status-count tiles replaced with domain-performance tiles)

**Hard gate:** If the KPI strip would show generic status counts instead of the Classification Card's Primary Metrics, STOP and fix the blueprint. This was the root cause of the TBK Ads failure: the workflow produced cosmetic CSS patches while the KPI tiles displayed campaign pipeline counts instead of advertising performance metrics (ROAS, CPA, Conversions, Spend).

**Phase 5c: Diff Review**
After generation, produce a structured diff showing:
- What was replaced and why (e.g., "KPI tile 1: 'Needs Attention' count → 'Total Spend MTD' because Classification Card Primary Metrics lists Monthly Budget first")
- What was preserved and why (e.g., "Sidebar unchanged — already matches Classification Card's hierarchical navigation pattern")

The design-enforcement hook fires automatically on each file write.

**Checkpoint:** Present the blueprint and diff to the user. Get confirmation before finalizing.

### Step 6 — Design Critique

**Skill:** `design-critique`
**Produces:** Scored evaluation with findings and fix list

Run design-critique against the generated code, evaluating against:
- The Classification Card's constraints (is density appropriate? is interaction model right?)
- The adopted principles from Intent Documents (if applicable)
- Nielsen heuristics (standard evaluation)
- The project's design token adherence

Any P0 findings: fix immediately, then re-critique.
P1 findings: present to user with recommended fixes.
P2 findings: log for later.

**Final output:** The generated/modified code files + critique report.

## Context Flow Diagram

```
[Classification Card] ──────────────────────────────────────┐
        │                                                     │
        ▼                                                     │
[Intent Documents] ──┐                                        │
        │            │                                        │
        ▼            ▼                                        ▼
[Pattern Selection] ──→ [Interface Design] ──→ [Code Gen] ──→ [Critique]
                                                    │              │
                                                    │              ▼
                                              [Enforcement    [Fix P0s]
                                               Hook fires]        │
                                                                   ▼
                                                              [Re-critique]
                                                                   │
                                                                   ▼
                                                              [Deliver]
```
