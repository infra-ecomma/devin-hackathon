**TBK Labs** · Curated Kit

---

# Typeset

_Audit typography: fonts, hierarchy, sizing, readability, consistency. Replace generic with intentional._

**CATEGORY** Skills · Design  •  **TRIGGER** `typography`  •  **RATING** ★★★★☆  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Detects AI-slop patterns**: Generic system font stacks (-apple-system, ui-sans-serif) and inconsistent sizing are the telltale signs of AI-generated UI; this skill flags both immediately.
- **Enforces systematic interaction between five typographic dimensions**: Font families, sizing scale, line-height, letter-spacing, and measure (width) all interact; changing one without adjusting the others produces illegible output. This skill audits all five together.
- **Produces consumable improvement spec**: Not "make the typography better," but "change H1 from 48px/1.1 to 56px/1.0; add 0.02em letter-spacing; set body measure to 60–75 characters per line."

## What It Does

Typography audit that evaluates five interacting dimensions: font family choices (how many fonts?

are they intentional or defaults?), hierarchy (do H1–H4 form a coherent scale or jump randomly?), sizing scale (is 12px body, 16px lead, 32px H3 arbitrary or geometric?), line-height (does it vary by context, or is it one-size-fits-all?), and measure (how many characters per line, and does this support readability?).

The skill audits by reading your codebase for defined fonts and CSS rules, capturing screenshots of each text style in context, and measuring readability metrics (contrast, character count, line-height ratio).

Then it flags failures: "Primary font is -apple-system (default), not intentional," "H2 at 32px/1.2 and H3 at 20px/1.3 don't form a coherent scale," "Body text at 14px is too small for comfort reading." The skill then produces an improvement spec: specific font pairings with rationales, a sizing scale (often 12, 14, 16, 20, 24, 32, 48, 64 or geometric progression), line-height rules by context (1.4–1.6 for body, 1.2–1.3 for headings, 1.0–1.15 for large display), letter-spacing rules (tighter for large text, looser for small), and measure guidance (60–75 characters for body paragraphs). Output is a typography spec file and CSS rule changes ready to implement.

## How to Use

1. **Capture typographic states**: Take screenshots of every text style—heading levels, body, captions, buttons, labels.
2. **Audit the codebase**: The skill greps for font definitions, CSS rules, and component usage.
3. **Measure readability**: Character counts per line, current line-heights, contrast ratios.
4. **Review findings**: Which fonts are defaults? Which sizes feel random? Which line-heights don't match context?
5. **Apply improvements**: Update CSS with new font stack, sizing scale, line-height rules per context.
6. **Test readability**: Verify H1–H4 form a coherent scale, body text is comfortable to read, hierarchy is immediate.

## What NOT to Do

- Don't override typographic tokens with raw pixel values or inline styles — every bypass erodes the type scale's coherence and creates drift that the next audit will flag as a P1.
- Don't apply typeset recommendations without verifying vertical rhythm against the project's actual spacing scale — a typographically correct line-height that misaligns with the 4px grid creates visual dissonance worse than the original problem.
- Don't treat typeset findings as font-swap suggestions — the skill audits scale ratios, measure, leading, tracking, and hierarchy, not typeface aesthetics.

---

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | typeset |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ |
| **Bundle** | `SKILL.md` + `README.md` + `typeset.docx` |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-typeset]]
