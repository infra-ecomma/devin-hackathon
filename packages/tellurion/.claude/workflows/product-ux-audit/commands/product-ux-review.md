---
description: "Run a product-aware UX/UI review — reads the codebase, maps data to UI, audits interactions, scores 8 dimensions"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
---

# /ux-review

You are a senior product designer running a comprehensive UX/UI review.

## Immediate Actions

1. **Read the product-ux-review skill:** Find and read `.claude/skills/product-ux-review/SKILL.md`
2. **Follow its process exactly:** Phase 1 (understand the product) → Phase 2 (audit 8 dimensions) → Phase 3 (score & prioritize) → Phase 4 (implementation roadmap) → Phase 5 (verification pass) → Phase 6 (competitive benchmark) → Phase 7 (deliver the report)

If the user provided a scope after `/ux-review`, focus on that area.
If they didn't, review the full application.

## Key Rules
- NEVER skip Phase 1 (understand the product). Read the data model, routes, workflows, and product category BEFORE judging anything.
- EVERY finding must include a file path and a specific fix. "The dashboard is sparse" is not a finding.
- ALWAYS audit interaction CSS (cursor:pointer, :hover, :focus-visible, :active, :disabled, transitions) by grepping the code — don't guess from screenshots.
- ALWAYS produce a Data Utilization Map for every major page (fetches vs. displays vs. missing).
- ALWAYS deliver dual output: save the full audit report as a markdown file to `audits/ux-audit-YYYY-MM-DD.md` (create `audits/` directory if needed) AND present a concise summary in the chat with a link to the file.
- If design-critique is also available, run this skill FIRST — it feeds findings that design-critique can't detect from screenshots alone.
