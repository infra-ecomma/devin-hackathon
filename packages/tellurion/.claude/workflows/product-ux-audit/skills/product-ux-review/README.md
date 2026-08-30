**TBK Labs** · Curated Kit

---

# Product UX Review

_UX audit at product level: information architecture, interaction patterns, error prevention, accessibility, cognitive load._

**CATEGORY** Skills · Design  •  **TRIGGER** `/product-ux-review`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- Audits at product level, not component level. Maps data models to displayed UI. Checks information architecture (is related content grouped?), cognitive load (too many options?), error prevention (can users undo?).
- Produces findings with code locations. Not "improve error messages" but "file X component Y validation message should say '{expected}', not '{actual}'".
- Focuses on usability impact. Measures information hierarchy, task flow efficiency, accessibility compliance, error recovery.

## What It Does

This skill audits product UX by reading code, mapping data to UI, testing interactions, and identifying usability issues.

**Phase 1: Code Audit** — Read UI code (React, Vue, HTML). Check: component hierarchy naming clarity, accessibility attributes (aria-*, alt text), CSS interaction states.

**Phase 2: Information Architecture** — Verify information is organized logically. Check: related content grouped? Density appropriate? Critical actions obvious? Navigation clear?

**Phase 3: Accessibility** — Check WCAG 2.1 AA: color contrast ratios, keyboard navigation, screen reader compatibility, form labels, alt text, focus management.

**Phase 4: Interaction & States** — Test interactions: hover states, focus states, error states, loading states, empty states, disabled states. Verify visual feedback is clear.

**Phase 5: Task Flow** — Trace user task from start to completion. Count steps. Identify friction points. Check: forms scannable? CTAs clear? Undo possible?

**Phase 6: Error Prevention & Recovery** — Check: validation rules clear? Error messages specific? Undo available? Destructive actions confirmed?

**Phase 7: Cognitive Load** — Check: too many options on page? Choices obvious? Defaults sensible? Information hierarchy clear?

**Phase 8: Report** — Produce findings (with file/line references and code changes) organized by severity and impact.

## How to Use

This skill is invoked by the `/product-ux-audit` workflow.

1. Workflow calls this skill after meta-design audit.
2. Skill audits code, information architecture, accessibility, interactions, task flow, error recovery, cognitive load.
3. Skill produces findings with code file paths and suggested changes.
4. Findings combined with meta-design findings in final report.

## What NOT to Do

- **Don't audit mockups** — Audit actual code and product behavior.
- **Don't audit component in isolation** — Audit product-level flows and architecture.
- **Don't confuse preference with usability** — "I don't like this layout" is preference; "modal blocks escape key" is usability.
- **Don't ignore accessibility** — It's a usability requirement, not optional.

## Quick Reference

| Property | Value |
|---|---|
| **Skill name** | product-ux-review |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ |
| **Scope** | 8 audit phases (code, IA, accessibility, interactions, task flow, error recovery, cognitive load, report) |
| **Output** | Findings with code file/line paths and suggested changes, organized by severity |
| **Part Of** | `/product-ux-audit` workflow |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-product-ux-review]]
