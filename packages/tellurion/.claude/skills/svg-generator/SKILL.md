---
name: svg-generator
description: "Builds precise, production-quality SVG files programmatically from geometric primitives — no guessing, no pixel drift. It constructs SVGs from circles, rectangles, paths, and text-to-path conversion, manages color systems via CSS custom properties, exports to multiple formats (SVG, PNG at 7 sizes, favicon, social OG image), and optimizes the final output. Reach for it when you need a logo, icon, brand mark, or any vector graphic that must render identically at any size. The output is a set of optimized SVG and PNG files ready for production use."
user_invocable: true
argument: spec - Description of what to build (e.g. 'circular icon with letter B, primary color #2E74B5')
allowed-tools: Bash, Read, Write, Edit
---

> **CHAIN:** After this skill → design-critique, quality-gate, web-design-review, responsive-design, web-accessibility


# SVG Builder — Programmatic SVG Construction


## When to use

- When you need a logo, icon, brand mark, or any vector graphic that must render identically at any size

## Overview

Build precise, production-quality SVG files programmatically. No guessing, no pixel drift — geometric primitives that render identically at any size.

Build precise, production-quality SVG files programmatically. No guessing,
no pixel drift — geometric primitives that render identically at any size.

## Why This Exists

AI-generated images can't match exact brand colors or geometric precision.
Programmatic SVG can. This skill handles construction patterns, color systems,
multi-format export, and optimization — the full pipeline from spec to production asset.

## Dependencies

```bash
pip install svgwrite cairosvg pillow
npm install -g svgo  # optional, for optimization
```

## Core Construction Patterns

### Basic Structure

```python
import svgwrite

def create_svg(filename, width=400, height=200, viewBox=None):
    """Create an SVG with proper structure."""
    vb = viewBox or f"0 0 {width} {height}"
    dwg = svgwrite.Drawing(
        filename,
        size=(f'{width}px', f'{height}px'),
        viewBox=vb,
        profile='full'
    )
    dwg.defs.add(dwg.style("""
        :root {
            --color-primary: #2E74B5;
            --color-secondary: #1a1a1a;
            --color-accent: #E8F4FD;
        }
    """))
    return dwg
```

### Geometric Primitives

```python
def add_shapes(dwg):
    """Common shape patterns for logo construction."""

    # Rectangle with rounded corners
    dwg.add(dwg.rect(
        insert=(20, 20), size=(80, 80),
        rx=8, ry=8,
        fill='#2E74B5', stroke='none'
    ))

    # Circle / ellipse
    dwg.add(dwg.circle(
        center=(200, 100), r=45,
        fill='none', stroke='#2E74B5', stroke_width=4
    ))

    # Path (for complex shapes)
    # M=moveto, L=lineto, C=curveto, Z=closepath
    dwg.add(dwg.path(
        d='M 100 50 L 150 150 L 50 150 Z',
        fill='#2E74B5', opacity=0.8
    ))

    # Polygon (hexagon example)
    import math
    points = [(200+40*math.cos(math.pi/3*i),
               100+40*math.sin(math.pi/3*i))
              for i in range(6)]
    dwg.add(dwg.polygon(points=points, fill='#2E74B5'))
```

### Text Elements

```python
def add_text(dwg):
    """Text patterns for wordmarks and labels."""

    # Basic wordmark
    dwg.add(dwg.text(
        'BRAND',
        insert=(120, 115),
        font_family='Arial, Helvetica, sans-serif',
        font_weight='700',
        font_size='48',
        letter_spacing='4',
        fill='#1a1a1a'
    ))

    # Tagline / subtitle
    dwg.add(dwg.text(
        'Your Tagline Here',
        insert=(120, 140),
        font_family='Arial, Helvetica, sans-serif',
        font_weight='300',
        font_size='14',
        letter_spacing='2',
        fill='#666666'
    ))

    # Text on path (for circular logos)
    path = dwg.path(d='M 100 150 A 80 80 0 1 1 300 150', id='curve', fill='none')
    dwg.defs.add(path)
    txt = dwg.text('')
    txt.add(dwg.textPath(href='#curve', text='CIRCULAR TEXT HERE'))
    dwg.add(txt)
```

### Color System Management

```python
def build_with_color_system(dwg, primary, secondary, accent):
    """Build SVG with CSS custom properties for easy theming."""
    style = f"""
        :root {{
            --primary: {primary};
            --secondary: {secondary};
            --accent: {accent};
        }}
        .primary {{ fill: var(--primary); }}
        .secondary {{ fill: var(--secondary); }}
        .accent {{ fill: var(--accent); }}
        .primary-stroke {{ stroke: var(--primary); fill: none; }}
    """
    dwg.defs.add(dwg.style(style))

    # Use classes instead of hardcoded colors
    dwg.add(dwg.circle(center=(100, 100), r=50, class_='primary'))
    dwg.add(dwg.rect(insert=(60, 60), size=(80, 80), class_='accent'))
```

## Multi-Format Export

```python
import cairosvg
import os
import shutil

def export_full_package(svg_path, output_dir, brand_name):
    """
    Export complete brand asset package from one SVG master.
    Produces: SVG, PNG at 7 sizes, favicon, social OG image.
    """
    os.makedirs(output_dir, exist_ok=True)
    base = os.path.join(output_dir, brand_name)

    # SVG master (copy as-is)
    shutil.copy(svg_path, f'{base}-master.svg')

    # Standard PNG sizes
    sizes = {
        '16': (16, 16), '32': (32, 32), '64': (64, 64),
        '128': (128, 128), '256': (256, 256),
        '512': (512, 512), '1024': (1024, 1024),
    }
    for label, (w, h) in sizes.items():
        out = f'{base}-{label}px.png'
        cairosvg.svg2png(url=svg_path, write_to=out, output_width=w, output_height=h)

    # Favicon (32x32)
    cairosvg.svg2png(url=svg_path, write_to=f'{base}-favicon.png',
                     output_width=32, output_height=32)

    # Social / OG image (1200x630 — logo centered on white)
    from PIL import Image
    logo = Image.open(f'{base}-256px.png').convert('RGBA')
    social = Image.new('RGBA', (1200, 630), (255, 255, 255, 255))
    x = (1200 - logo.width) // 2
    y = (630 - logo.height) // 2
    social.paste(logo, (x, y), logo)
    social.convert('RGB').save(f'{base}-social-og.png')

    print(f"Package complete: {output_dir}/")
    print(f"Files: master SVG, 7x PNG, favicon, social OG")
```

## SVG Optimization

```bash
# Install SVGO
npm install -g svgo

# Optimize (removes metadata, minifies paths)
svgo input.svg -o output-optimized.svg

# Optimize entire directory
svgo generated/brand-package/ --recursive
```

Or via Python if SVGO unavailable:

```python
import re

def optimize_svg_basic(svg_path, output_path):
    """Basic SVG optimization without SVGO."""
    with open(svg_path, 'r') as f:
        content = f.read()

    content = re.sub(r'<!--.*?-->', '', content, flags=re.DOTALL)
    content = re.sub(r'<metadata>.*?</metadata>', '', content, flags=re.DOTALL)
    content = re.sub(r'<g[^>]*>\s*</g>', '', content)
    content = re.sub(r'\s+', ' ', content)
    content = content.replace('> <', '><')

    with open(output_path, 'w') as f:
        f.write(content.strip())

    import os
    original = os.path.getsize(svg_path)
    optimized = os.path.getsize(output_path)
    print(f"Optimized: {original}B -> {optimized}B ({(1-optimized/original)*100:.0f}% reduction)")
```

## Quality Checklist

Before marking a logo/icon done:

- [ ] Renders correctly at 16px (smallest use case)
- [ ] Renders correctly at 512px+ (large format)
- [ ] Colors match brand palette (check with image-analysis skill)
- [ ] No hardcoded pixel values that break at different sizes (use viewBox)
- [ ] Text converted to paths OR uses system-safe fonts with fallbacks
- [ ] SVG optimized (metadata removed, paths clean)
- [ ] Exported to all required formats
- [ ] Saved to `generated/brand-package/`

## Output Location

All outputs go to `generated/brand-package/`. Never in project root.

---

## Kit Integration

- **Step 6.1** — generates logo/icon assets during brand identity work (Category A chain)
- **During design-engine** — part of Category A (Logo) and Category G (Export) chains
- **During GSD** — invoked for any task requiring SVG icon or brand asset generation
- **On demand** — triggered by "SVG", "vector graphic", "build SVG", "create icon"




---

## Example Session

```
User: Generate SVG icon set for FleetCraft dispatch board

Inputs:
  Brand: graphite + cadmium orange
  Style: rounded-square stroke icons, 24×24 viewBox, stroke-width 1.5
  Icons needed: truck, driver, route, fuel, alert, ELD-log, dispatch-board, calendar, gear

Generated 12 icons:
  All as SVG with currentColor (inherits from parent)
  Optimized via SVGO (each ~ 600 bytes)
  Accessible: aria-hidden on decorative; role="img" + title on standalone
  Both stroke and fill variants per icon

Wired as React components:
  apps/web/src/components/icons/{Truck,Driver,Route,...}.tsx
  Tree-shakeable named exports
  Storybook story showcasing all 12 in light + dark mode

Output: web/src/components/icons/* + dev_docs/design/icon-set.md
Chain → design-critique, web-design-review
```

---

## Chain Dispatch

### Always invoke after this skill:
Skill: design-critique
Skill: quality-gate

### If UI was touched, also invoke:
Skill: web-design-review
Skill: responsive-design
Skill: web-accessibility
