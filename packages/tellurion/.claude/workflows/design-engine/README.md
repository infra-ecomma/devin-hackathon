**TBK Labs** · Curated Kit

---

# Design Engine

_Multi-phase brand + visual design orchestrator. Phase 0a medium classification → Phase 0b brand-tokens load → Phase 1-3 design generation → Phase 4 acceptance scoring → Phase 4.5 Design Push Gate → ship. **Image generation FORBIDDEN for code/SVG work (medium classification gate).**_

**CATEGORY** Workflows · Orchestration  •  **TRIGGER** `/design-engine`, `design X`, `brand work for Y`  •  **RATING** ★★★★★ (10/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Medium classification at Phase 0a.** Names canonical "agent generated raster images for an SVG logo task, broke whole design pipeline" wrong-medium failure.
- **Brand-tokens loaded BEFORE generation.** Names canonical "we generated 'on-brand' designs, didn't match actual brand colors, redo from scratch" no-tokens failure.
- **Design Push Gate at Phase 4.5.** Names canonical "we shipped a redesign with the wrong logo, brand consistency dead" no-approval-gate failure.

---

## What It Does

Multi-phase brand + design pipeline:

**Phase 0a — Medium Classification (GATE).**
- Determine: CODE (SVG / React / Tailwind) vs RASTER (PNG / JPG / illustration)
- If code: image generation FORBIDDEN
- If raster: image generation allowed

**Phase 0b — Brand Tokens Load.**
- Load brand colors / typography / spacing / shadows from existing tokens
- Document tokens in active context

**Phase 1-3 — Design Generation.**
- Per phase 0a medium:
  - CODE: write SVG / React components using tokens
  - RASTER: generate via FLUX / Gemini with token constraints
- Iterate per acceptance criteria

**Phase 4 — Acceptance Scoring.**
- Image-analysis (for raster) or visual-diff (for SVG/components)
- Score against acceptance criteria (e.g. "logo renders at 24px without artifacts")

**Phase 4.5 — Design Push Gate (CRITICAL).**
- Render preview at canonical sizes (16, 32, 64, 128, 256, 512)
- Side-by-side comparison with reference
- Present "Design Push Gate — approval required" block
- Wait for explicit user approval
- On approval: `touch .claude/.push-gate-approved` (valid 10 min)

**Phase 5 — Ship.**
- Within 10-min approval window
- Apply changes
- Approval marker auto-expires; new changes need new approval

**Hard rules:**
- Medium classification (Phase 0a) FIRST — forbids wrong-medium generation
- Brand tokens loaded BEFORE generation
- Design Push Gate (Phase 4.5) BEFORE ship
- 10-min approval window for push gate

---

## How to Use

1. Invoke `/design-engine` with target.
2. Phase 0a classification → forces correct medium.
3. Phase 0b loads tokens.
4. Iterate generation → scoring.
5. Phase 4.5 Push Gate (user approves).
6. Ship within 10 min approval window.

---

## What NOT to Do

- **Don't skip Phase 0a.** Medium classification is the load-bearing gate.
- **Don't generate without tokens loaded.** Off-brand results.
- **Don't bypass Phase 4.5 Push Gate.** Forced human approval for brand work.
- **Don't ship outside the 10-min approval window.** Marker expires; redo approval.
- **Don't use image generation for SVG/component work.** Medium classification forbids.

---

## Sample Output (logo redesign for new brand identity)

```
[Target: redesign acme-logo across 6 canonical sizes]

Phase 0a — Medium Classification
  Asset: SVG (acme-logo.svg) + React component (Brand/Logo.tsx)
  → MEDIUM = CODE
  → image generation FORBIDDEN for this task

Phase 0b — Brand Tokens
  Loaded:
    --color-leaf-primary: #2E7D32
    --color-leaf-accent: #66BB6A
    --stroke-1: 1.5px
    --radius-md: 8px
  
  Documented in active context for Phase 1+

Phase 1-3 — Generation
  Wrote SVG directly (not image-gen):
    <svg viewBox="0 0 24 24" stroke="var(--color-leaf-primary)" ...>
      <path d="M..." />
    </svg>
  
  React component Brand/Logo.tsx wraps SVG with sizing prop

Phase 4 — Acceptance Scoring
  Acceptance: logo renders at 24px without anti-aliasing artifacts
  Rendered at 16, 32, 64, 128, 256, 512 px
  Visual-diff vs reference: 96% match (acceptable >90%)

Phase 4.5 — Design Push Gate (CRITICAL)
  Renders shown to user (6 sizes side-by-side + reference)
  
  Block presented:
  ┌─────────────────────────────────────────────────┐
  │ Design Push Gate — approval required            │
  │ Asset: acme-logo SVG + React component          │
  │ Tokens used: leaf-primary, leaf-accent, stroke-1│
  │ Acceptance score: 96%                           │
  │ Apply changes? Reply 'approve' to proceed.      │
  └─────────────────────────────────────────────────┘
  
  User: "approve"
  $ touch .claude/.push-gate-approved (valid 10 min)

Phase 5 — Ship
  Within 10 min window:
    Wrote acme-logo.svg + Brand/Logo.tsx
    Updated Brand/Logo.stories.tsx
    git commit -m "feat(brand): logo redesign (approved push gate 2026-05-14)"
  
  Approval marker auto-deletes after 10 min.

[Output: logo redesigned, shipped within approval window]
```

```bash
# Invoke
> /design-engine target=acme-logo medium=code
```

Multi-phase logo redesign: Phase 0a classified as CODE (image gen forbidden), tokens loaded, SVG generated using vars, 96% acceptance score, Push Gate approved by user, shipped within 10-min window.

---

## Quick Reference

| Property | Value |
|---|---|
| **Workflow name** | design-engine |
| **Category** | Workflows · Orchestration |
| **Rating** | ★★★★★ (10/10) |
| **Trigger** | `/design-engine` |
| **Phases** | 6+ (0a Medium / 0b Tokens / 1-3 Generation / 4 Scoring / 4.5 Push Gate / 5 Ship) |
| **Hard Gates** | Medium classification / tokens loaded / Push Gate approval / 10-min window |
| **Forbidden** | Image generation for CODE-medium work |
| **Approval Marker** | `.claude/.push-gate-approved` (10-min TTL) |
| **Bundle** | `WORKFLOW.md` + `README.md` + `design-engine.docx` |
| **Pairs With** | `meta-design` skill · `design-push-gate` hook · `design-qa` hook · `ui-redesign` workflow · `compact-preserve` hook |

---

**TBK Labs** · Curated Kit · 2026-05-14

Vault note: [[workflow-design-engine]]
