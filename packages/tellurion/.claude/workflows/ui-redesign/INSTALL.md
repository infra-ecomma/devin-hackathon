# ui-redesign — Install & Share

Self-sufficient bundle. Requires 6 companion skills and 1 hook.

## What's in the box

```
UI-Redesign/
├── README.md              ← workflow spec
├── INSTALL.md             ← this file
└── UI-Redesign.docx       ← TBK Labs house-style companion
```

## Skill Dependencies

These must be installed in `.claude/skills/` for the workflow to function:

| Skill | Install from |
|---|---|
| product-classification | `skills/Curated/product-classification/` |
| design-intent-extraction | `skills/Curated/design-intent-extraction/` |
| domain-pattern-library | `skills/Curated/domain-pattern-library/` |
| interface-design | `skills/Curated/interface-design/` |
| design-html | `skills/Curated/design-html/` |
| design-critique | `skills/Curated/design-critique/` |

## Hook Dependency

The `design-enforcement` hook must be installed at `.claude/hooks/design-enforcement.sh`.

## Install

```bash
PROJECT="."
BUNDLE="path/to/UI-Redesign"
mkdir -p "$PROJECT/.claude/workflows"
cp "$BUNDLE/README.md" "$PROJECT/.claude/workflows/ui-redesign.md"
cp "$BUNDLE/UI-Redesign.docx" "$PROJECT/.claude/workflows/"
```

## Invoke

Tell Claude: **"/ui-redesign"** for a full redesign, **"/ui-redesign sidebar"** for a specific component, or **"/ui-redesign --fix"** for incremental improvements. The workflow will read all 6 skills, classify the product, and chain through the pipeline with checkpoints at each phase.

## Hard gates

5 gates. See README.md for details.
