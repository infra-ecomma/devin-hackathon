**TBK Labs** · Curated Kit

---

# Color Strategy

_Assign semantic meaning to every color decision—brand, status, hierarchy, action—instead of adding color by decoration._

**CATEGORY** Skills · Design  •  **TRIGGER** `color`  •  **RATING** ★★★★☆ (8/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Eliminates decorative color debt**: Every color gets a defined role (brand, semantic, neutral) before placement, preventing "colorful but meaningless" designs.
- **Enforces WCAG compliance systematically**: Tests and documents contrast ratios for every text/background pair, catching failures that manual review misses.
- **Removes decision fatigue**: The 60/30/10 rule and OKLCH color space replace guesswork—dominant neutral (60%), secondary (30%), accent (10%)—with measurable constraints.

## What It Does

This skill audits and strategically applies color to designs by treating color as a communication tool, not decoration. It starts by inventorying existing colors—what semantic roles are active (error, success, warning), which colors are brand vs.

neutral, and which are doing double duty (confusing the user). The skill then establishes a color system with defined roles: background, surface, text (primary/secondary/muted), brand, brand secondary, and semantic colors (success, warning, error, info).

This prevents ad-hoc color sprawl. The framework applies the 60/30/10 rule—60% dominant neutral, 30% secondary color, 10% accent—to ensure visual hierarchy isn't drowned by too much color.

All custom colors are defined in OKLCH, a perceptually uniform color space where stepping lightness produces equal visual steps (unlike HSL). This enables consistent accent scales and dark mode variants without manual tweaking. The skill audits all text/background combinations against WCAG minimum ratios (3:1 for components, 4.5:1 for small text, 7:1 for best practice) and flags failures. The skill also bans specific anti-patterns: purple-blue gradients (overused to meaninglessness), gray text on colored backgrounds (fails contrast), vibrant color everywhere (dilutes hierarchy), and opacity-based variants (unpredictable on different backgrounds).

## How to Use

1. **Audit existing color**: List all distinct colors currently in use, categorize as semantic/brand/neutral, and identify double-duty colors.
2. **Establish roles**: Assign every color a defined role from the standardized set (background, surface, text levels, brand, semantic).
3. **Apply 60/30/10**: Measure visible area and ensure accent color appears in ~10%, secondary in ~30%, neutral in ~60%.
4. **Use OKLCH**: Define custom colors in OKLCH format; create accent scales using consistent lightness steps.
5. **Test contrast**: For every unique text/background pair, verify WCAG minimum ratios using tools like WebAIM Contrast Checker or Figma.
6. **Plan dark mode**: Define dark mode tokens as a separate layer (not inverted); reduce chroma and test contrast on dark surfaces.

## What NOT to Do

- Do not use purple-blue gradients as a "premium" shortcut—they signal AI-generated design and carry no meaning.
- Do not place gray text on colored backgrounds without contrast testing—this combination commonly fails WCAG.
- Do not add color to fix flatness—address hierarchy and layout first; color should reinforce, not create structure.
- Do not use opacity-based variants like `rgba(accent, 0.5)` in place of explicit tints; they produce unpredictable results on different backgrounds.
- Do not assign semantic colors to multiple roles—if blue is brand, it cannot also be "info"; reserve semantics for error/success/warning.

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | color-strategy |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ (8/10) |
| **Command** | `color` / `palette` / `color system` / `contrast` |
| **Bundle** | `SKILL.md` + `README.md` + `color-strategy.docx` |
| **Pairs with** | design-system-architect, design-critique, web-design-review |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-color-strategy]]
