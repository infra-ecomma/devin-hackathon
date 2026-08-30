---
name: design-shotgun
description: "Generate 3-5 fundamentally different design directions with structured decision data (pros/cons/tradeoffs/effort/risk). Compare via mandatory comparison tables and tradeoff analysis, then converge on the winning direction through data-driven selection."
allowed-tools: Bash, Read, Write, Edit
---

## When to use

Generate 3-5 design directions, compare them with structured decision data, and converge on the winner. The fastest way to explore design space — b...
Generate 3-5 fundamentally different design directions with structured decision data
(pros/cons/tradeoffs/effort/risk), compare via mandatory comparison tables and tradeoff
analysis, and converge on the winner. Each direction is a defensible proposal, not a
color swap. Triggers on: design options, design variants, compare designs, A/B design,
design exploration, logo variants, redesign directions, "show me options".

> **CHAIN:** After this skill → design-critique, quality-gate, web-design-review, responsive-design, web-accessibility


# Design Shotgun


## Overview

converge on the winner. The fastest way to explore design space — but exploration without comparison infrastructure is just noise.

Generate 3-5 design directions, compare them with structured decision data, and
converge on the winner. The fastest way to explore design space — but exploration
without comparison infrastructure is just noise.

## Why This Skill Exists

Design is subjective — the first idea is rarely the best one. Instead of perfecting
one design, generate several directions quickly, compare them with structured data,
and converge. "Shotgun" means breadth first, not random.

**The key distinction: Directions, not variations.** Each direction must differ in a
fundamental design philosophy, not just a color or font swap. "Conservative" vs.
"Bold" is a start but not enough — each needs a name that captures its personality,
a complete color palette, typography choice, layout approach, and clear trade-offs.

---

## Process

### Step 1: Understand the Brief

Before generating anything, extract:
- What is being designed? (page, component, layout, brand, full app)
- What constraints exist? (brand colors, existing design system, accessibility reqs)
- Who is the audience? (operators, consumers, mixed)
- What's the emotional target? (professional, playful, minimal, bold, technical)
- What's the competitive context? (who are the 2-3 closest competitors?)

### Step 2: Define Direction Axes

Choose TWO dimensions that create meaningful tension. These become the axes of your
exploration space. Good axis pairs:

| Axis 1 | Axis 2 | Creates tension for |
|--------|--------|-------------------|
| Dense / Spacious | Warm / Cool | SaaS dashboards, data tools |
| Technical / Approachable | Minimal / Rich | Developer tools, APIs |
| Bold / Subtle | Structured / Organic | Brand identity, marketing |
| Playful / Professional | Light / Dark | Consumer apps, social |
| Editorial / Utilitarian | Flat / Dimensional | Content sites, blogs |

**Why axes matter:** Without axes, you get three variations of the same idea. With
axes, each direction occupies a different quadrant of the design space, giving the
user genuine choice.

### Step 3: Generate 3-5 Directions

Each direction MUST include the following. **A direction without this data is a vibe,
not a proposal.**

#### Direction Template (MANDATORY — every field required)

```
NAME: [Distinctive, evocative name — not "Option A" or "Conservative"]
      Examples: "Command" / "Meridian" / "Beacon" / "Foundry" / "Atlas"

SUMMARY: [1 sentence capturing the core design philosophy]

VISUAL IDENTITY KEYWORDS: [3-5 descriptive words]
    Examples: "dense, dark, utilitarian, technical, grid-heavy"
              "warm, editorial, spacious, serif-forward, organic"
              "bright, modular, card-based, geometric, playful"

COLOR PALETTE:
    Primary:     #XXXXXX — [what it's used for]
    Secondary:   #XXXXXX — [what it's used for]
    Accent:      #XXXXXX — [what it's used for]
    Background:  #XXXXXX
    Surface:     #XXXXXX — [cards, panels, elevated elements]
    Text primary:   #XXXXXX
    Text secondary: #XXXXXX
    Success: #XXXXXX  Warning: #XXXXXX  Error: #XXXXXX

TYPOGRAPHY:
    Headings: [Font name], [weights used], [size scale e.g. 32/24/20/16]
    Body: [Font name], [weight], [size], [line-height]
    Mono: [Font name] (if applicable)
    Why this pairing: [1 sentence — what does this combination communicate?]

LAYOUT APPROACH:
    Grid: [e.g., 12-column, CSS grid with named areas]
    Density: [compact / default / spacious]
    Navigation: [sidebar / top bar / hybrid — with width/height]
    Whitespace: [philosophy — e.g., "generous between sections, tight within cards"]
    Key structural decision: [What makes this layout different from the others?]

PROS: (minimum 3)
    1. [Specific advantage with reasoning]
    2. [Specific advantage with reasoning]
    3. [Specific advantage with reasoning]

CONS: (minimum 3)
    1. [Specific disadvantage with reasoning]
    2. [Specific disadvantage with reasoning]
    3. [Specific disadvantage with reasoning]

RISK ASSESSMENT:
    [What could go wrong? What assumptions is this direction making?
     What user group might this alienate?]

EFFORT ESTIMATE:
    [Hours for full implementation — break into: structure, styling, components, testing]

BEST FOR:
    [Which specific audience or use case this direction serves best]
```

### Step 4: Build Each Direction as HTML

Create each as a standalone HTML file with full implementation of the design language:

Each HTML file must demonstrate the direction's design language across multiple UI
patterns: header/nav, content area, card/data component, form elements, and a CTA.
Don't just show a hero section — show enough surface area to evaluate the system.

### Step 5: Produce the Comparison Table (MANDATORY)

After generating all directions, produce a structured comparison. **This table is
the core deliverable — directions without comparison data are not useful for
decision-making.**

```markdown
| Dimension | Direction 1: [Name] | Direction 2: [Name] | Direction 3: [Name] |
|-----------|-------------------|-------------------|-------------------|
| Visual density | ... | ... | ... |
| Color palette | [hex list] | [hex list] | [hex list] |
| Typography | [font names] | [font names] | [font names] |
| Accessibility (WCAG) | [contrast scores] | [contrast scores] | [contrast scores] |
| Brand alignment | [1-10 + reason] | [1-10 + reason] | [1-10 + reason] |
| Mobile adaptability | [1-10 + reason] | [1-10 + reason] | [1-10 + reason] |
| Development effort | [hours] | [hours] | [hours] |
| Scalability | [1-10 + reason] | [1-10 + reason] | [1-10 + reason] |
| Learning curve | [1-10 + reason] | [1-10 + reason] | [1-10 + reason] |
| Best for | [audience] | [audience] | [audience] |
```

### Step 6: Produce the Tradeoff Analysis (MANDATORY)

For each pair of directions, state what you gain and lose:

```markdown
### Direction 1 vs. Direction 2
- **Gain by choosing 1 over 2:** [specific advantages]
- **Lose by choosing 1 over 2:** [specific disadvantages]
- **Choose 1 when:** [specific scenario]
- **Choose 2 when:** [specific scenario]
```

### Step 7: Present for Decision

Create a comparison board (single HTML file with all variants side by side).

### Step 8: Collect Structured Feedback

Ask structured questions — not "which do you like?":

1. Which direction's **layout** feels closest to what you want?
2. Which direction's **color system** feels right?
3. Which direction's **typography** communicates the right personality?
4. Are there elements from OTHER directions you want to pull into the winner?
5. What's missing from all directions?

### Step 9: Synthesize and Iterate

Take the winning direction + cherry-picked elements from others → create the final
version. Document what was kept, what was borrowed, and what was changed.

---

## Output Checklist

Before presenting to the user, verify:

- [ ] Each direction has a distinctive name (not "Option A/B/C")
- [ ] Each direction has complete color palette with hex values
- [ ] Each direction has typography with specific font names
- [ ] Each direction has 3+ pros AND 3+ cons
- [ ] Each direction has a risk assessment
- [ ] Each direction has an effort estimate in hours
- [ ] Comparison table exists across all directions
- [ ] Tradeoff analysis exists for every pair
- [ ] HTML files demonstrate multiple UI patterns (not just a hero)
- [ ] Comparison board HTML file works in browser

**If any box is unchecked, the deliverable is incomplete.**

---

## Anti-Patterns

1. **"Option A / Option B / Option C"** — These are not names. If the direction doesn't
   have a personality worth naming, it's not differentiated enough.

2. **Color swaps as "directions"** — Changing the primary color from blue to green is
   not a different direction. It's a variant. Directions differ in layout, density,
   typography philosophy, and emotional target.

3. **Missing tradeoffs** — "This direction is modern and clean" is marketing copy, not
   analysis. Every direction has cons. If you can't find 3 cons, you haven't thought
   hard enough.

4. **Vague effort estimates** — "This would take some time to implement" is not an
   estimate. Break it down: structure (X hrs), styling (X hrs), components (X hrs),
   testing (X hrs).

5. **Hero-only demos** — Showing just a hero section doesn't demonstrate a design
   system. Show nav, content, cards, forms, and at least one interactive state.

---

## Kit Integration

- **Step 6.1** — invoked by design-engine for Category A (logos) and Category C (full pages) to generate variant directions
- **During creative-director** — used as the variant exploration step after the tribunal produces a creative brief
- **During GSD** — invoked when a UI task calls for exploring multiple approaches before committing
- **On demand** — triggered by "design options", "compare designs", "explore directions"




---

## Example Session

```
User: Design-shotgun the FleetCraft logo

5 directions produced (named, distinct, fully different):
  D1 — "Stenciled wordmark with accent stripe" — industrial stencil + safety-orange underline
  D2 — "FC monogram in shield" — strong, military feel (eliminated: too military)
  D3 — "Compass rose + truck" — too literal
  D4 — "Hub-and-spoke schematic" — reads as logistics agency, not SaaS
  D5 — "Route polyline ASCII" — too cute, unscalable

Each direction: SVG sketch + 1-sentence "what it says"
Comparison rubric: industry fit / scalability / distinctness / brand-brief alignment

Recommendation: D1 chosen (best fit with industrial brief)
Variants of D1 explored (color, weight, stripe placement)

Output: dev_docs/design/shotgun-logo.md + 5 SVG sketches in /assets/design/shotgun/
Chain → design-critique, logo-brand-identity, quality-gate
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
