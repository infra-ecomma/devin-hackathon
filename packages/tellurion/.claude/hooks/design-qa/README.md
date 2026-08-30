---
name: design-qa
description: "PostToolUse hook that validates image and CSS file integrity on every write or edit. For images it checks SVG XML validity, hardcoded color counts, viewBox presence, accessibility titles, and PNG dimensions. For CSS it detects hardcoded colors versus token references, excessive pixel values, important-declaration abuse, missing reduced-motion preferences, and absent responsive breakpoints. You install it to catch corrupted assets and CSS hygiene issues at edit time before they reach review."
---

**TBK Labs** · Curated Kit

---

# Design QA

_PostToolUse hook on Write/Edit of image (`.png`/`.svg`/`.jpg`/`.jpeg`) and CSS (`.css`/`.scss`/`.module.css`) files. **Image checks: emptiness, SVG XML validity + hardcoded colors + viewBox + title, PNG/JPG dimensions + 4M-pixel threshold + logo blurry warning. CSS checks: hardcoded colors vs tokens, hardcoded pixels, `!important` abuse, missing `prefers-reduced-motion`, no responsive breakpoints.**_

**CATEGORY** Hooks · Testing  •  **TRIGGER** PostToolUse (Write/Edit on .png/.svg/.jpg/.jpeg/.css/.scss)  •  **EVENTS** PostToolUse  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Image validity + CSS hygiene in one hook.** Names canonical "we shipped a corrupted SVG with bad XML, viewer hung, nobody caught it before PR review" no-validity failure.
- **Detects 5 CSS anti-patterns.** Names canonical "we had 18 `!important` declarations, nobody noticed the specificity disaster" CSS-hygiene failure.
- **Design Push Gate cross-reference.** Names canonical "we wrote brand/logo.svg, gate approval expired 30 min ago, hook didn't catch" cross-hook failure. Design-QA reads the same marker.

---

## What It Does

PostToolUse hook with two parallel check tracks based on file extension:

**Phase 1 — Image checks (.png/.svg/.jpg/.jpeg):**
- File must exist and be ≥10 bytes (else BLOCK: corrupt)
- SVG: XML validity via `xml.etree.ElementTree.parse` (BLOCK on invalid)
- SVG: hardcoded colors count (>3 → WARN)
- SVG: viewBox attribute (missing → WARN)
- SVG: `<title>` element for a11y (missing → WARN)
- PNG/JPG via PIL: dimensions, ≥4M pixels → WARN (too large)
- Logo files <100x100 → WARN (blurry at display size)
- Brand/logo files: cross-check `.claude/.push-gate-approved` mtime; expired (>600s) → WARN

**Phase 2 — CSS checks (.css/.scss/.module.css):**

| Check | Threshold | Severity |
|-------|-----------|----------|
| Hardcoded colors vs var(--*) tokens | `HC_COLORS > 5 AND HC > tokens` | WARN |
| Hardcoded px in spacing (margin/padding/gap) | > 10 | WARN |
| `!important` abuse | > 3 | WARN |
| Animations without `prefers-reduced-motion` | any animation, 0 preference query | WARN |
| Missing `@media` breakpoints | file > 100 lines AND 0 media queries | WARN |

**Phase 3 — Report.**
- Blocks → exit 2 with `DESIGN QA FAILED: ...`
- Warnings only → exit 0 with `DESIGN QA WARNINGS: ...` to stderr
- All clean → silent (exit 0)

**Hard rules:**
- MIXED — BLOCKING on integrity (empty/corrupt/invalid XML), ADVISORY on quality.
- Two parallel tracks (image + CSS) based on extension.
- Cross-references design-push-gate marker for brand files.
- PIL graceful: image checks skip if PIL missing.

---

## How to Use

1. Install via `.claude/settings.json` PostToolUse hook config.
2. Write/edit images or CSS.
3. Image integrity issues block; quality issues warn.
4. Address each warning per the message.
5. For brand files: ensure design-push-gate approval is fresh.

---

## What NOT to Do

- **Don't lower threshold for !important.** 3 is generous.
- **Don't strip PIL fallback.** Some environments lack it; graceful skip preserves UX.
- **Don't disable for sprite sheets.** Sprite sheets can be 4M+ pixels legitimately; document the exception, don't disable.
- **Don't ignore brand-file gate warnings.** Cross-hook signal means the push gate noticed too.
- **Don't write CSS with no @media queries past 100 lines.** Responsive is mandatory.
- **Don't conflate with `design-enforcement`.** That's JSX/TSX patterns; this is image+CSS.

---

## Sample Output (3 scenarios)

```
Scenario 1: SVG with 5 hardcoded colors, missing viewBox, no <title> (3 WARNINGS)
$ # Write src/icons/leaf.svg

[PostToolUse hook fires]
File: src/icons/leaf.svg
  XML valid ✓
  Hardcoded colors: 5 → WARN
  viewBox: missing → WARN
  <title>: missing → WARN

DESIGN QA WARNINGS:
  - SVG has 5 hardcoded color values. Use CSS variables or design tokens.
  - SVG missing viewBox attribute — will not scale responsively.
  - SVG missing <title> element for accessibility.

Exit 0 → write proceeds with warnings.

---

Scenario 2: Empty PNG (BLOCK)
$ # Write src/images/banner.png with 0 bytes (oops)

[PostToolUse hook fires]
File: src/images/banner.png
  Size: 0 bytes → BLOCK

DESIGN QA FAILED:
  - src/images/banner.png is empty or corrupt (0 bytes). Re-generate.

Exit 2 → write blocked.

---

Scenario 3: CSS with 18 hardcoded colors, 8 !important, animations no motion-pref (3 WARNINGS)
$ # Edit src/styles/dashboard.css (250 lines)

[PostToolUse hook fires]
File: src/styles/dashboard.css
  Hardcoded colors: 18, var(--*) refs: 4 → WARN (18 > 5 AND 4 < 18)
  !important: 8 → WARN
  Animations: 3, prefers-reduced-motion: 0 → WARN

DESIGN QA WARNINGS:
  - CSS has 18 hardcoded colors vs 4 token references. Use design tokens.
  - CSS has 8 !important declarations — specificity issue.
  - CSS has animations but no prefers-reduced-motion media query.

Exit 0 → write proceeds with warnings.
```

```bash
# .claude/settings.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": { "tool": "Write|Edit" },
      "hooks": [{
        "type": "command",
        "command": "bash .claude/hooks/testing/design-qa/hook.sh"
      }]
    }]
  }
}
```

3 scenarios: SVG with 3 quality warnings (proceeds), empty PNG blocks, CSS with 3 hygiene warnings (proceeds). Cross-references design-push-gate marker for brand files. PIL graceful-skip preserves UX.

---

## Quick Reference

| Property | Value |
|---|---|
| **Hook name** | design-qa |
| **Category** | Hooks · Testing |
| **Rating** | ★★★★☆ (8/10) |
| **Events** | PostToolUse (Write/Edit) |
| **Mode** | MIXED — BLOCKING on integrity, ADVISORY on quality |
| **Image Extensions** | .png / .svg / .jpg / .jpeg |
| **CSS Extensions** | .css / .scss / .module.css |
| **Image Checks** | 6 (size / SVG XML / SVG colors / SVG viewBox / SVG title / PNG dimensions + logo blur) |
| **CSS Checks** | 5 (token coverage / hardcoded px / !important / motion preference / responsive breakpoints) |
| **Cross-hook** | Reads `.claude/.push-gate-approved` for brand files |
| **Pairs With** | `design-enforcement` hook · `design-push-gate` hook · `ui-redesign-gate9` hook · `compact-preserve` hook · `design-engine` skill |
| **Bundle** | `hook.sh` + `README.md` + `design-qa.docx` |

---

**TBK Labs** · Curated Kit · 2026-05-14
