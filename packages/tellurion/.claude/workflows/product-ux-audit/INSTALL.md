# product-ux-audit — Install & Share

This folder is **self-sufficient**. Zip it, share it, drop it into any Claude Code project — everything the workflow needs is bundled inside.

## What's in the box

```
Product-UX-Audit/
├── README.md                          ← workflow spec (entry doc)
├── INSTALL.md                         ← this file
├── theory-bank.md                     ← 36-entry theory layer (cited by every P0/P1)
├── Product-UX-Audit.docx              ← TBK Labs house-style companion
├── research-memo-skill-vs-workflow.md ← architectural rationale
├── skills/
│   ├── product-ux-review/             ← Phase 5a — experience lens
│   │   ├── SKILL.md                   (1301 lines, v2.1)
│   │   ├── README.md
│   │   ├── product-ux-review.docx
│   │   └── commands/ux-review.md      (legacy alias)
│   └── meta-design/                   ← Phase 5b — craft lens
│       ├── SKILL.md                   (709 lines, v2.0)
│       ├── README.md
│       └── meta-design.docx
└── commands/
    ├── product-ux-audit.md            ← /product-ux-audit  (top-of-stack call)
    ├── product-ux-review.md           ← /product-ux-review (experience-lens only)
    └── meta-design.md                 ← /meta-design       (craft-lens only)
```

No external dependencies. The two skills, the slash commands, and the theory bank are all colocated.

## Install into a Claude Code project

From the project root (the directory that contains your `.claude/` folder):

```bash
PROJECT="."   # or the absolute path to your project
BUNDLE="path/to/Product-UX-Audit"

# Skills
mkdir -p "$PROJECT/.claude/skills"
cp -r "$BUNDLE/skills/product-ux-review" "$PROJECT/.claude/skills/"
cp -r "$BUNDLE/skills/meta-design"        "$PROJECT/.claude/skills/"

# Slash commands
mkdir -p "$PROJECT/.claude/commands"
cp "$BUNDLE/commands/product-ux-audit.md"  "$PROJECT/.claude/commands/"
cp "$BUNDLE/commands/product-ux-review.md" "$PROJECT/.claude/commands/"
cp "$BUNDLE/commands/meta-design.md"       "$PROJECT/.claude/commands/"

# Theory bank — keep colocated with the workflow doc so the skills can cite it
mkdir -p "$PROJECT/.claude/workflows/product-ux-audit"
cp "$BUNDLE/README.md"      "$PROJECT/.claude/workflows/product-ux-audit/WORKFLOW.md"
cp "$BUNDLE/theory-bank.md" "$PROJECT/.claude/workflows/product-ux-audit/theory-bank.md"
```

After installing, restart Claude Code (or reload the session). The skill loader will pick up `meta-design` and `product-ux-review`, and the three slash commands will be available.

## How to invoke

| Call | When to use |
|---|---|
| `/product-ux-audit <target>` | Top-of-stack. Full audit. Runs Phase 0 → discovery → Phase 5a `product-ux-review` → Phase 5b `meta-design` → merge → verify → deliver. If the user explicitly says **"fix all"** or **"implement"**, Phase 10 Implementation Playbook runs: 10a preflight, 10b cluster by change kind, 10c parallel implementation, 10d per-cluster typecheck, 10e single commit + summary. **Use this for any serious review.** |
| `/product-ux-review <target>` | Experience lens only. IA, flows, heuristics, data utilization, retention. Skips token / type / contrast / dark-mode work. |
| `/meta-design <target>` | Craft lens only. 15 visual dimensions. Skips IA / flow / retention work. |

## Hard rules carried by the bundle

1. **Phase 0 classification gate** — no audit without Axis A (functional type), Axis B (vertical), commercial state, and 3 peer references.
2. **Token-audit-first gate** — `meta-design` Dimension 1 (design tokens) must complete before any other dimension is graded.
3. **Theory-bank citation gate** — every P0 and P1 finding carries at least one `[tag]` from `theory-bank.md`.
4. **Evidence gate** — every P0 cites a file:line or screenshot reference.
5. **Peer comparison gate** — every P0 includes "peer X ships the correct behavior; we do not."
6. **Dark-mode gate** — if the product ships a dark-mode toggle, `meta-design` Dimension 13 runs as a hard requirement.
7. **Phase 10 preflight gate** — `git status` clean + re-read audit from disk (never from compaction summary) + baseline `tsc --noEmit` before any implementation begins.
8. **Phase 10 cluster gate** — findings grouped by change kind (ARIA / hex→token / skeleton / route payload / button-state / dead-code / schema-coupled) before any Edit fires.
9. **Phase 10 per-cluster typecheck gate** — `tsc --noEmit` runs between clusters, not just at commit time.

## Severity formula

`Score = F × I × P × R` (Frequency × Impact × Persistence × Reach), each scored 1–5.

- **P0** ≥ 48 AND blocks first-value or first-impression AND Phase 0 commercial state permits the bar
- **P1** 24–47
- **P2** < 24

## Versioning

- Workflow: v2.1 (Phase 10 added 2026-04-08) / v2 (2026-04-07)
- `product-ux-review` skill: v2.1 (2026-04-07) — adds `meta-design` cross-cite + theory-bank tag convention
- `meta-design` skill: v2.0 (2026-04-07) — 15 craft dimensions, 6 hard gates

## License & attribution

Authored by Wassim / TBK Labs. Use freely inside your own projects. If you publish derivatives, keep the theory-bank citations and the F × I × P × R formula intact — they are the calibration spine of the workflow.
