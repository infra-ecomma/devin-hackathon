---
name: design-engine
description: "Takes any design task — logo, interface, layout, image generation, review, export — and executes it through the full TBK Labs design skill stack with discipline. Scans installed skills, classifies the task, builds a category-appropriate chain, runs a brief first, generates multip."
  Takes any design task — logo, interface, layout, image generation, review, export — and executes it through the full TBK Labs design skill stack with discipline. Scans installed skills, classifies the task, builds a category-appropriate chain, runs a brief first, generates multiple variants in parallel, checkpoints with the user, iterates on the chosen variant with objective measurement, and gates the output through quality checks (WCAG contrast, legibility, responsive, brand alignment) before delivering an export package. Refuses to ship output that fails the quality gates.
category: design
triggers:
  - "/design-engine"
  - "help with design-engine"
user_invocable: true
---

> **CHAIN:** After this workflow → quality-gate

# Design Autopilot

## Purpose

Takes any design task — logo, interface, layout, image generation, review, export — and executes it through the full TBK Labs design skill stack with discipline. Scans installed skills, classifies the task, builds a category-appropriate chain, runs a brief first, generates multiple variants in parallel, checkpoints with the user, iterates on the chosen variant with objective measurement, and gates the output through quality checks (WCAG contrast, legibility, responsive, brand alignment) before delivering an export package. Refuses to ship output that fails the quality gates.

## Prerequisites

- Installed skills: brainstorm, logo-brand-identity, design-shotgun, svg-generator, ai-studio-image, image-analysis, interface-design, design-html, design-critique, responsive-design, design-qa (all 11 core skills)
- A clear design task (logo, UI component, layout, image, review, token audit, or export)
- User acceptance that workflow starts with a brief (brief-first is non-negotiable)
- An iteration budget (default: 15 total, hard stop at 20)

## Phase 1 — Skill Inventory & Task Classification

**Goal:** Map available skills and classify the design task into a predefined chain

**Actions:**
1. Scan ~/.claude/skills/ and ~/Documents/Organizing Claude Code/skills/Curated/ for design skills
2. Build mental map of which skills exist: brainstorm, logo-brand-identity, design-shotgun, svg-generator, ai-studio-image, image-analysis, interface-design, design-html, design-critique, responsive-design, design-qa
3. Classify task into category: Logo/Brand Identity, UI/Interface, Layout/Page, Image Generation, Design Review, Token Audit, or Export
4. Select predefined chain for that category (e.g., brainstorm → logo-brand-identity → design-shotgun → svg-generator → design-qa)

**Gate:** At least 6 core skills must be available; missing skills degrade the chain

**Output:** Selected skill chain and classification documented

## Phase 2 — Brief (Brainstorm First)

**Goal:** Establish the brief before any generation

**Actions:**
1. Run brainstorm skill to capture brief
2. Document: goal, audience, tone & positioning, constraints, success criteria
3. If user says "just pick something," ask three forcing questions before proceeding
4. Do not skip this phase — a brief takes 5 minutes and saves 45

**Gate:** Brief explicitly approved by user before proceeding

**Output:** Brief document with goal, audience, tone, constraints, success criteria

## Phase 3 — Generate Variants in Parallel

**Goal:** Produce 3–5 distinct directions in parallel (not variations of one idea)

**Actions:**
1. Run design-shotgun (or category equivalent like logo-brand-identity) to generate variants
2. Each variant explores a different design hypothesis
3. Each variant is complete enough to evaluate (not a sketch)
4. Variants are visually diverse on axes like form, color, tone, density

**Gate:** Minimum 3 variants generated; variants must be genuinely different, not tweaks

**Output:** 3–5 visual variants with descriptive labels explaining each direction

## Phase 4 — User Checkpoint & Selection

**Goal:** Get user selection before iterating on any variant

**Actions:**
1. Present variants side by side to user
2. User picks: winner to iterate, merge (combine elements from multiple variants), or rejection (go back to brief)
3. Do not iterate before user selection
4. If user rejects all, loop back to Phase 2 and refine the brief

**Gate:** User explicitly selects a direction or approves a merge

**Output:** Selected variant(s) documented with rationale

## Phase 5 — Iterate the Winner with Objective Measurement

**Goal:** Refine the chosen direction using image-analysis for objective measurement

**Actions:**
1. For each iteration, make explicit deltas (e.g., "Tighten serif on E, reduce x-height 5%, shift color to #0B4FC7")
2. Not "make it better" — be specific
3. Use image-analysis skill to measure against brief
4. Stop iterating as soon as output matches the brief

**Gate:** Iteration count ≤ 15 total; stop immediately when brief is met

**Output:** Refined design with iteration trail documenting all deltas

## Phase 6 — Escalation Ladder

**Goal:** If an approach fails after 3 iterations, escalate rather than grinding

**Actions:**
1. Failed after 3 iterations on AI image generation → move to SVG hand-crafted
2. SVG hand-crafted fails → move to HTML/CSS
3. HTML/CSS fails → move to Hybrid (SVG + CSS animation)
4. Hybrid fails → STOP (surface to user: "approach isn't converging, revisit brief or try different direction")

**Gate:** Do not continue silent grinding without escalation

**Output:** Escalation decision documented

## Phase 7 — Quality Gates (Mandatory)

**Goal:** Gate output through six depth checks before shipping

**Actions:**
1. Run design-qa skill for automated checks
2. Manually verify all of:
   - WCAG AA contrast: text ≥4.5:1 normal, ≥3:1 large (no exceptions)
   - Legibility at icon size: stroke widths readable at 16px minimum
   - Responsive scaling: verify at 1x, 2x, 3x (no pixel artifacts)
   - Visual hierarchy: primary > secondary > tertiary (not flat)
   - Accessibility: parseable without color alone
   - Brand alignment: matches brief tone and positioning

**Gate:** All six gates must pass; P0 failures (e.g., WCAG) block delivery

**Output:** Quality gate report with pass/fail on each dimension

## Phase 8 — Export & Deliver

**Goal:** Produce full asset package (SVG + PNG + favicon + social)

**Actions:**
1. Use svg-generator to produce complete export package:
   - SVG (primary vector)
   - PNG at 7 standard sizes (1x, 2x, 3x, favicon 16/32/64, social 1200x630)
   - Favicon bundle (ICO + PNGs)
   - Social previews (OG image, Twitter card)
2. If OpenTabs running and Cloudinary/S3/Figma target exists, push directly
3. Otherwise deliver as zip in workspace folder

**Output:** Complete asset package with all formats

## Phase 9 — Handoff

**Goal:** Produce one-page summary for delivery

**Actions:**
1. Capture brief (from Phase 2)
2. Document chosen direction and why
3. Include iteration trail (all deltas)
4. Include quality gate results
5. List all exported assets with paths

**Gate:** All artifacts present and paths verified

**Output:** Handoff document ready for delivery, git commit with design: prefix

## Hard Gates

1. **Brief-first.** No generation before brainstorm. Tasks without briefs are rejected.
2. **Parallel-variance.** Minimum 3 variants generated in parallel before user selection.
3. **User checkpoint.** User selects a direction before iteration begins.
4. **WCAG-AA.** Final output must pass WCAG AA contrast; failures block delivery.
5. **Escalation-ladder.** 3 failed iterations triggers escalation (SVG → HTML → Hybrid). No silent grinding.

## Chain Dispatch

| Next Skill | Condition |
|---|---|
| quality-gate | Always |

## Deliverable Format

A design deliverable package containing:

- The final SVG + PNG bundle + favicons + social previews
- The brief used (from Phase 2)
- The iteration trail (all deltas from Phase 5)
- Quality gate report (contrast, legibility, responsive, accessibility, hierarchy, brand)
- A one-page handoff document (from Phase 9)

Plus a `design:` commit (if the project tracks assets in git) or an uploaded asset URL bundle.

## Verification

```bash
# Brief was captured
test -f design-brief.md

# Variants were generated
ls variants/ | wc -l   # should be >= 3

# WCAG contrast passes on final
./scripts/check-contrast.sh final.svg

# Export package is complete
ls exports/ | grep -c -E "svg|png|ico"
```

## What NOT to Do

- **Don't skip brainstorm.** Generation without a brief converges on nothing. A five-minute brief saves forty-five minutes of iteration.
- **Don't iterate serially on one variant.** Ten cycles of "generate → critique → regenerate" converge on a local optimum. Parallel variance finds global optima.
- **Don't polish past the brief.** Once output matches the brief, stop. Over-polishing burns iteration budget for no gain.
- **Don't skip quality gates.** Shipping WCAG-failing output because "it looks fine to me" is unacceptable. Run design-qa before delivery.
- **Don't grind without escalating.** If an approach fails after 3 iterations, escalate up the ladder (AI → SVG → HTML → Hybrid). Silent grinding burns the iteration budget for nothing.
- **Don't forget the export package.** Delivering the SVG without the PNG/favicon/social bundle means the user has to do it themselves later.
- **Don't let skills atrophy.** The workflow is installed but nobody updates the chain when new skills are added. Periodically re-inventory (Phase 1 exists for this reason).

## Usage

Invoke with `/design-engine` or describe the task in natural language. Include the design task type (logo, UI component, layout, image, review, token audit, or export).
