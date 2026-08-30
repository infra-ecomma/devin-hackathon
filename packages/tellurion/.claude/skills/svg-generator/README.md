**TBK Labs** · Curated Kit

---

# SVG Builder

_Build production SVGs from code, export at 7 sizes plus favicon with token-managed colors._

**CATEGORY** Skills · Design  •  **TRIGGER** `SVG`  •  **RATING** ★★★★☆  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Geometric precision at any scale**: Programmatic SVG construction via primitives (rect, circle, path, polygon) renders identically at 16×16 favicon through 1200×1200 hero—no pixel drift, no rasterization artifacts.
- **Brand color system integration**: SVG uses CSS custom properties (`fill="var(--brand-primary)"`) so logo color changes sync with your design system; recolor the entire brand package by changing one token.
- **Multi-format export pipeline**: One source SVG generates PNG at 7 standard sizes (16, 32, 64, 128, 256, 512, 1024) plus favicon, plus optimized SVG—no manual exports, consistent across all formats.

## What It Does



The SVG Builder skill constructs production-ready SVGs from code primitives (rect, circle, path, polygon), managing geometric precision at any scale and integrating with your design token system for brand-managed colors. The skill builds SVGs programmatically rather than through UI tools, enabling precise control, version control integration, and automated export pipelines that generate PNG at seven standard sizes plus favicon plus optimized SVG.

Programmatic SVG construction renders identically at any scale: a logo designed through code is perfectly crisp at 16×16 favicon, 32×32 app icon, 128×128 toolbar icon, and 1200×1200 hero hero image with no pixel drift or rasterization artifacts. This precision is impossible to achieve with exported PNGs from design tools—a design that looks good at 512×512 often looks fuzzy at 16×16 because the export process introduces pixel-snapping errors. Building from geometric primitives eliminates this problem.

Brand color system integration uses CSS custom properties (`fill="var(--brand-primary)"`) so SVG colors stay synchronized with your design system. Change the primary brand color in one place, and every SVG using that token automatically updates. This is particularly valuable for products shipping dark mode: a single SVG with semantic color tokens works in both light and dark mode, recoloring automatically. No separate dark-mode SVG needed, no manual color management, no color-mismatch bugs.

The export pipeline generates seven standard sizes: 16 (favicon), 32, 64, 128, 256, 512, 1024 pixels. Each size is generated via SVG-to-PNG conversion, ensuring perfect rendering at each scale. The favicon is extracted separately. The optimized SVG is generated with reduced precision and removed unused attributes. All exports go to `generated/brand-package/`, never cluttering the project root. This consistency across sizes and formats means you have a complete brand icon package ready for any context without manual work.

The skill chains with design-critique, quality-gate, web-design-review, responsive-design, and web-accessibility for complete design validation. Output is version-controlled SVG source plus PNG exports, making it easy to audit design changes and maintain consistency across releases.


## What NOT to Do

- Do not audit without understanding the product's commercial context and intended audience.
- Do not raise design findings without concrete evidence (file paths, screenshots, measurements).
- Do not apply design opinions that contradict the project's established design system.

## Quick Reference

| Property | Value |
|----------|-------|
| **Skill name** | svg-generator |
| **Category** | Skills · Design |
| **Rating** | ★★★★☆ |
| **Bundle** | `SKILL.md` + `README.md` + `svg-generator.docx` |

---

**TBK Labs** · Curated Kit · 2026-04-14

Vault note: [[skill-svg-generator]]
