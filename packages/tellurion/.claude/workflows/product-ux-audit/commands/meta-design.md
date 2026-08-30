---
description: "Run the meta-design craft audit (15 dimensions, 6 hard gates) — standalone or as Phase 5b of /product-ux-audit"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
---

# /meta-design

You are running the **meta-design** skill — product-aware UI and craft review. This is the sibling lens to `product-ux-review`. Where product-ux-review grades the experience axis (flows, heuristics, data utilization, retention), meta-design grades the craft axis (tokens, type, rhythm, hierarchy, contrast, density, grid, states, motion, icons, imagery, empty states, dark mode, responsive, brand).

## Immediate Actions

1. **Read the canonical skill:** `.claude/skills/meta-design/SKILL.md` — 709-line operational spec. Follow it exactly.
2. **Read the sibling skill reference:** `.claude/skills/product-ux-review/SKILL.md` — needed for the cross-reference table (section 9) to avoid double-counting.
3. **Read the theory bank:** If present in the workflow folder, open `workflows/Curated/Product-UX-Audit/theory-bank.md`. Every P0 and P1 finding must carry at least one theory-bank tag.

## Branching logic — DO NOT skip

### Branch A — Task argument present (`/meta-design <target>`)
Run the full standalone audit:
1. **Phase 0 calibration (HARD GATE).** State Axis A (functional type), Axis B (vertical), commercial state, and three peer references. Refuse to audit without these four.
2. **Dimension 1 first (HARD GATE).** Enumerate the declared design tokens, then grep the code base for every raw hex, rem, px, ms, and font-family value. Log every token escape. No other dimension may be graded until this is done.
3. **Dimensions 2–15.** Run each dimension's audit protocol from SKILL.md. Every finding cites file+line or screenshot reference, a theory-bank tag, a peer comparison, and an F × I × P × R score.
4. **Cross-reference against product-ux-review.** Use SKILL.md section 9 to assign ownership. Joint findings are tagged `LENS = both`.
5. **Self-eval.** Every P0 passes all 6 hard gates or it is downgraded.
6. **Deliver.** Standalone output: `meta-design-review-YYYY-MM-DD.md` with Phase 0 block, dimension-by-dimension narrative, findings table, and closing craft narrative paragraph.

### Branch B — No task argument (AUTO-REVIEW MODE)
Do NOT ask "what do you want audited?". Default is to auto-review recent design work in the session.
1. Scan the last 30 turns for edits to components, tokens, CSS, Tailwind configs, SVGs, or image assets.
2. If found, apply a scoped meta-design pass to that work: tokens, contrast, states, responsive, hierarchy. P0/P1/P2 tags with file:line references and one-line fixes.
3. If nothing recent found, then — and only then — ask: "No recent design work found in this session. What would you like me to audit?"

## The 15 Craft Dimensions
1. Design Token System · 2. Typography System · 3. Vertical Rhythm & Baseline Grid · 4. Hierarchy & Visual Weight · 5. Color Contrast & Accessibility · 6. Density, Info Density, White Space · 7. Alignment, Grid, Layout · 8. Visual State System (9 states) · 9. Motion & Transitions · 10. Iconography · 11. Imagery, Illustration, Data Viz · 12. Empty / Error / Loading · 13. Dark Mode Parity · 14. Responsive & Mobile Touch · 15. Brand & Tone Coherence

## 6 Hard Gates
1. **Phase 0 gate** — no audit without Axis A, Axis B, commercial state, 3 peers.
2. **Token audit gate** — Dimension 1 must be complete before any other dimension is graded.
3. **Theory-bank citation gate** — every P0 and P1 carries at least one `[tag]` from theory-bank.md.
4. **Evidence gate** — every P0 cites a file+line or screenshot reference.
5. **Peer comparison gate** — every P0 includes "peer X ships the correct behavior; we do not."
6. **Dark mode gate** — if the product ships a dark-mode toggle, Dimension 13 runs as a hard requirement.

## Severity formula
`Score = F × I × P × R` each 1–5. **P0** ≥ 48 + blocks first-value or first-impression + Phase 0 permits. **P1** 24–47. **P2** < 24.

## TBK Ads calibration hint (for auto-review in this project)
Axis A = Planning/Strategy + Measurement hybrid. Axis B = Advertising/marketing ops. Commercial state = paid beta. Peer references: Madgicx, Motion (motionapp.com), Northbeam. Use these unless the user overrides.

## References
- Canonical skill: `.claude/skills/meta-design/SKILL.md`
- Sibling skill: `.claude/skills/product-ux-review/SKILL.md`
- Workflow: `.claude/workflows/product-ux-audit/WORKFLOW.md` (or Org CC Curated location)
- Theory bank: `workflows/Curated/Product-UX-Audit/theory-bank.md`
- Global rules: `~/.claude/CLAUDE.md` (audit structure rules, D1–D4 discovery rules)
