# design-engine — Install & Share

Self-sufficient bundle. Requires the 11 dependent design skills.

## What's in the box

```
Design-Autopilot/
├── README.md               ← workflow spec
├── INSTALL.md              ← this file
└── Design-Autopilot.docx   ← TBK Labs house-style companion
```

Plus the 11 core skills (install separately from `Organizing Claude Code/skills/Curated/`):

- brainstorm
- logo-brand-identity
- design-shotgun
- svg-generator
- ai-studio-image
- image-analysis
- interface-design
- design-html
- design-critique
- responsive-design
- design-qa

Optional: OpenTabs / Claude-in-Chrome for Figma access and live page inspection.

## Install

```bash
PROJECT="."
BUNDLE="path/to/Design-Autopilot"
CURATED="$HOME/Documents/Organizing Claude Code/skills/Curated"

# Workflow spec
mkdir -p "$PROJECT/.claude/workflows/design-engine"
cp "$BUNDLE/README.md" "$PROJECT/.claude/workflows/design-engine/WORKFLOW.md"
cp "$BUNDLE/Design-Autopilot.docx" "$PROJECT/.claude/workflows/design-engine/"

# Dependent skills (copy all 11)
mkdir -p "$PROJECT/.claude/skills"
for s in brainstorm logo-brand-identity design-shotgun svg-generator \
         ai-studio-image image-analysis interface-design design-html \
         design-critique responsive-design design-qa; do
  cp -r "$CURATED/$s" "$PROJECT/.claude/skills/"
done
```

## Invoke

Tell Claude: **"/design-engine"** — or any design task ("design a logo", "review this UI", "make a landing page"). Claude will inventory skills, classify the task, run `brainstorm` first, generate 3–5 parallel variants, checkpoint with you, iterate the winner, gate the output through WCAG/legibility/responsive/brand checks, and deliver a full export package.

## Hard gates

1. Brief-first — `brainstorm` before any generation
2. Parallel variance — ≥3 variants side by side before iteration
3. User checkpoint before iteration begins
4. WCAG AA contrast required on final
5. Escalation ladder after 3 failed iterations

## Versioning

- v1 (2026-04-07)

## License

Authored by Wassim / TBK Labs.
