---
name: design-intent-extraction
description: "Extract design principles from reference images, templates, and examples — capturing the spirit, not the pixels. Produces a Design Intent Document that maps extracted principles to the current project's classification and tokens. Triggers on: reference image, design reference, template, example UI, inspiration, based on this design, like this, similar to"
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Agent
version: 2.0
maintainer: TBK Labs
updated: 2026-04-09
---

> **CHAIN:** Next in workflow → domain-pattern-library


# design-intent-extraction — Principles Over Pixels

## 1. Why this skill exists

When a user shares a reference image or template, Claude defaults to pixel-for-pixel replication. This produces two failures:

1. **Literal copying** — the output looks like a bad clone of the reference instead of an original product informed by the reference's principles.
2. **Context mismatch** — the reference's density, color scheme, or layout may be wrong for the current project's classification, but Claude applies it anyway because it's "what the user showed."

This skill extracts the PRINCIPLES behind a reference — its spacing system, hierarchy logic, density strategy, color approach, interaction model — and maps those principles through the current project's Product Classification Card to produce constraints that are appropriate for THIS product.

The output is a Design Intent Document, not a wireframe to copy.

## 2. Hard gates

**Gate 1.** Never reproduce a reference pixel-for-pixel. If the output looks like the reference with different colors, the extraction failed. The reference informs principles; the Classification Card determines application.

**Gate 2.** A Product Classification Card must exist for the current project. If no Card exists, run `product-classification` first. The Intent Document is useless without a Card to filter it through.

**Gate 3.** Every extracted principle must be translated to the current project's context. "The reference uses 4px grid" must become "Our project uses 8px grid (per Classification Card: Medium density), so we adopt the reference's consistent grid discipline but at our grid size."

## 3. The extraction process

### Phase 1: Observe the Reference

For each reference image or template, analyze these seven dimensions. Be specific — cite visual evidence, not impressions.

**A. Spacing System**
- What's the base grid? (Measure padding, margins, gaps between repeated elements)
- Is spacing consistent or variable?
- What's the ratio between card padding and card gap?
- How much whitespace exists relative to content?

**B. Information Hierarchy**
- What's the largest element? (This is what the designer considers most important)
- What's the scanning order? (Top-left first? Hero metric? Alert banner?)
- How many levels of visual weight exist? (Count distinct size/emphasis tiers)
- What's de-emphasized or hidden? (What did the designer choose NOT to show prominently?)

**C. Density Strategy**
- How many discrete data points are visible?
- How is density managed? (Cards? Sections? Progressive disclosure? Tabs?)
- What's the whitespace-to-content ratio?
- Does the density feel comfortable or strained?

**D. Color Strategy**
- How many distinct hues are used? (Not shades — hues)
- What's the dominant neutral? (Background color)
- What's the accent color? (Used for interactive/highlight elements)
- Are colors semantic (meaning-carrying) or decorative?
- Is the palette warm, cool, or neutral?

**E. Typography**
- How many distinct text sizes are visible? (Count carefully)
- What's the approximate ratio between largest and smallest?
- What weights are used? (Light, regular, medium, semibold, bold)
- Is text uppercase anywhere? (Headers? Labels? Badges?)
- Are numbers tabular (monospaced) or proportional?

**F. Component Patterns**
- What recurring UI components exist? (Cards, tables, charts, badges, etc.)
- Are components consistent with each other? (Same padding, same radius, same border treatment?)
- What interaction affordances are visible? (Hover states, click targets, buttons, links?)
- What states are shown? (Active, disabled, selected, empty?)

**G. Interaction Model**
- What's the implied user flow? (What would the user do first, second, third?)
- Is the layout fixed (monitoring) or explorable (drill-down)?
- Are there filters, controls, or configuration visible?
- What's the navigation pattern? (Sidebar? Tabs? Breadcrumbs?)

### Phase 2: Extract Principles with the Principle Extraction Test

Distill the observations into abstract principles. This is the critical step — move from "what does this look like" to "what design philosophy does this express."

**THE PRINCIPLE EXTRACTION TEST:** A principle is VALID if it can be stated as a rule that applies across different visual implementations. If it only describes ONE specific visual choice in ONE place, it's an observation, not a principle.

Format each principle as:

```
PRINCIPLE: [Name]
OBSERVATION: [What you saw in the reference]
UNDERLYING RULE: [The design principle at work — must be testable across different contexts]
APPLICABILITY: [How broadly this applies — universal, density-specific, domain-specific]
CONFIDENCE: [High/Medium/Low based on how clearly the principle is demonstrated]
```

**Valid vs Invalid Extractions — Examples from Each Dimension:**

**A. Spacing System**
- BAD: "The sidebar is 240px wide with 16px padding" (observation of one element)
- GOOD: "Padding scales with container type — primary containers use 2x base grid, secondary use 1x base grid" (applies across multiple containers)
- BAD: "Cards have 16px padding and 24px gap" (specific measurement)
- GOOD: "Spacing ratio between internal padding and inter-card gaps follows 1:1.5 ratio for consistent visual rhythm" (applies to any card system at any base size)

**B. Information Hierarchy**
- BAD: "The KPI value is 56px and the label is 12px" (specific measurement)
- GOOD: "Primary metrics use 4-5x the text size of supporting labels to create instant visual dominance" (ratio applies regardless of absolute size)
- BAD: "Alerts appear at the top of the viewport" (specific placement)
- GOOD: "Critical information that requires immediate action appears before explorable content in the scanning flow" (applies to any alert severity)

**C. Density Strategy**
- BAD: "The reference shows 8 metrics per row in a 3-row grid" (specific layout)
- GOOD: "Data density is managed through bounded containers rather than raw compression — denser content stays comfortable through consistent containment" (applies at any density level)
- BAD: "Whitespace takes up 35% of the viewport" (specific percentage)
- GOOD: "Whitespace between sections equals at least 1.5x the internal card padding to separate content groupings" (proportional rule)

**D. Color Strategy**
- BAD: "The accent color is #0066FF" (specific value)
- GOOD: "A single accent hue guides interactive affordances across all surfaces, creating consistent call-to-action recognition" (applies to any hue)
- BAD: "Status uses green, yellow, and red" (specific implementation)
- GOOD: "Semantic color coding matches common user mental models for status (positive/neutral/negative) regardless of specific hues chosen" (principle applies cross-culturally)

**E. Typography**
- BAD: "Headers are 28px bold and body is 14px regular" (specific measurements)
- GOOD: "Text hierarchy is built on size ratios (headline:body = 2:1) rather than weight variation alone" (ratio applies at any base size)
- BAD: "Numbers in tables are monospaced" (specific treatment)
- GOOD: "Numeric alignment uses consistent character widths for quick column scanning in data-heavy tables" (applies to any tabular context)

**F. Component Patterns**
- BAD: "Buttons have 12px padding, 4px radius, 2px border" (specific measurement)
- GOOD: "Interactive components use consistent padding and radius ratios — border treatment matches the density band (1px for tight, 2px for relaxed)" (rule scales)
- BAD: "Cards have a shadow underneath" (specific visual treatment)
- GOOD: "Card elevation is communicated through subtle depth treatment that's readable at any zoom level without becoming distracting" (principle applies regardless of shadow implementation)

**G. Interaction Model**
- BAD: "The sidebar has 8 navigation items" (specific count)
- GOOD: "Primary navigation is persistent and scannable in <2 seconds, grouping related actions to reduce cognitive load" (applies to any nav scale)
- BAD: "Filters collapse when you click the button" (specific behavior)
- GOOD: "Advanced controls are tucked behind toggles until needed, preventing interface overwhelm for casual users while keeping power users efficient" (principle applies across different UI patterns)

### Phase 3: Filter Through Classification Card with Override Rules

This is where extraction becomes useful rather than generic. For each extracted principle, apply the override decision matrix.

**OVERRIDE DECISION MATRIX:**

| Condition | Spacing/Sizing Principles | Domain-Specific Principles | Interaction/Hierarchy Principles | Visual Principles (Color, Typography) |
|-----------|---------------------------|---------------------------|--------------------------------|--------------------------------------|
| **Density band differs by >1 level** | OVERRIDE | ADOPT with adaptation | ADOPT with adaptation | ADOPT |
| **Domain differs** (e.g., fintech reference for internal tool) | ADOPT structure | OVERRIDE vocabulary/metrics | OVERRIDE workflows | ADOPT |
| **Archetype differs** (e.g., consumer vs enterprise) | ADAPT to density | OVERRIDE interaction patterns | OVERRIDE entirely | ADOPT with tone shift |
| **Primary question differs** (from Classification Card) | ADAPT grid scale | OVERRIDE metric selection | OVERRIDE scanning order | ADOPT |

**For each extracted principle, determine:**

1. **Reference Characteristic:** What is the reference's density band, domain, primary archetype, primary question?
2. **Our Classification:** What is our density band, domain, archetype, primary question?
3. **Application Rule:** Use matrix above to determine ADOPT / OVERRIDE / ADAPT

**ADOPT:** Use the principle as-is, scaled to our tokens.
**OVERRIDE:** Reject the principle; substitute the approach from our Classification Card.
**ADAPT:** Use the principle's philosophy but reframe for our context.

**Example filtering:**

Reference principle: "4px base grid with 8px card padding"
Reference characteristic: High density, fintech
Our classification: Medium density band (8px base grid)
**Matrix lookup:** Density differs by 1+ level → OVERRIDE spacing/sizing
**Decision:** OVERRIDE. Adopt the reference's grid discipline principle, but our grid is 8px (not 4px), so card padding is 16px (2x base), card gap is 24px (3x base).

Reference principle: "Ultra-high density with 60+ metrics visible"
Reference characteristic: High density, Expert Operator (real-time monitoring)
Our classification: Medium density, Domain Professional (30-60 min sessions)
**Matrix lookup:** Archetype differs → OVERRIDE interaction patterns
**Decision:** OVERRIDE. The reference's density strategy doesn't match our user session length. We keep 10-20 primary metrics with drill-down to detail.

Reference principle: "KPI-first scanning order with fixed metrics set"
Reference characteristic: Fintech dashboard
Our classification: Ad management (same domain)
**Matrix lookup:** Domain matches → ADOPT with adaptation
**Decision:** ADOPT. The KPI-first principle applies to our domain. We adapt the metric set to our Classification Card's Decision Map metrics: Spend vs Budget (pacing), ROAS, Total Conversions, Avg CPA.

### Phase 4: Produce the Design Intent Document File

Output MUST be written to a file at `.claude/INTENT_[source_name].md` where `[source_name]` is the reference image filename (or a short descriptor if no filename provided).

Each adopted principle's Implementation field MUST include SPECIFIC design tokens from `.claude/globals.css` or the project's token system.

**Output format:**

```markdown
# Design Intent Document: [Reference Source]

**Reference:** [filename or description]
**Project:** [project name]
**Classification:** [summary of Card — Product Type + Domain + Density Band]
**Extraction Date:** [date]

## Adopted Principles

### 1. [Principle Name]

**From reference:** [specific observation from Phase 1 dimension]

**Underlying rule:** [principle from Phase 2]

**Applied to our context:** [how it translates given our Classification Card]

**Implementation:**
- Grid discipline: 8px base grid (var(--base-grid, 8px))
- Card padding: 16px (var(--card-padding, 16px))
- Card gap: 24px (var(--card-gap, 24px))
- Applies to: [which components or screens use this principle]

**Confidence:** [High/Medium/Low]

### 2. [Next principle]
...

## Overridden Principles

### 1. [Principle Name]

**From reference:** [observation]

**Why overridden:** [which Classification Card constraint conflicts; use matrix reason]

**Instead:** [what our classification says to do]

**Tokens to use:** [specific tokens that implement the override]

## Open Questions

1. [Principle where the right choice is ambiguous — ask the user to resolve]
2. [Another open question requiring human judgment]

---
*Generated by design-intent-extraction skill*
```

**Key implementation requirements:**
- Every token reference must be verifiable in `.claude/globals.css`
- If a token doesn't exist, note it as an implementation gap: "TODO: Add var(--missing-token) to globals.css"
- Implementation section must be copy-paste-ready for developers
- Example implementation for Medium density: "Applied as: Medium density grid. Implementation: card padding var(--card-padding, 16px), card gap 24px, section gap var(--section-gap, 2rem), grid base 8px with 2:3 internal:external spacing ratio"

### Phase 5: Merge Multiple Intent Documents

When multiple reference images exist, produce a MERGED Intent Document at `.claude/INTENT_MERGED.md` that synthesizes all individually extracted Intent Documents.

**Merging process:**

1. **List all extracted principles from each reference** (Phase 2 outputs)
2. **Identify convergent principles** — principles that appear in 2 or more references, even if worded differently
3. **Identify divergent principles** — principles that conflict across references
4. **For convergent principles:** Mark as HIGH confidence; use the merged principle in ADOPTED section
5. **For divergent principles:** Keep both versions with their reference sources; add to OPEN QUESTIONS section with "User must choose between Reference A approach and Reference B approach"
6. **Resolve conflicts using Classification Card** — if the Card clearly favors one approach, move to ADOPTED with the reason noted

**INTENT_MERGED.md format:**

```markdown
# Design Intent Document: MERGED

**References:** [list all source filenames]
**Project:** [project name]
**Classification:** [summary of Card]
**Merged Date:** [date]
**Number of references:** [count]

## Convergent Principles (High Confidence)

Principles found in 2+ references — these are strong signals about what matters.

### 1. [Principle Name]

**Found in:** Reference A, Reference B, Reference C (3/3 sources)

**Principle:** [merged statement]

**Applied to our context:** [translation]

**Implementation:** [tokens]

---

## Divergent Principles (Requires User Choice)

Principles that conflict across references — user input needed to choose direction.

### 1. [Principle Name]

**Reference A says:** [approach with token implementation]
**Reference B says:** [conflicting approach with tokens]
**Our Classification says:** [does the Card resolve this? if not, ask user]

**Recommendation:** [if Card clearly favors one, recommend it; otherwise ask user]

---

## Overridden Principles

[Include only overrides that appear across multiple references, or overrides where Classification Card is unambiguous]

---

## Open Questions

1. For Reference A's [principle]: Does this apply at our density level? User to confirm.
2. For conflicting [principle]: Should we favor [Reference A approach] or [Reference B approach]?
3. [Other open questions]

---

## Implementation Checklist

- [ ] Convergent principles reviewed and approved
- [ ] Divergent principle choices made (see Open Questions)
- [ ] All tokens from Implementation sections added to globals.css
- [ ] Design Intent Document incorporated into interface-design briefing

---
*Merged from: [list filenames]*
```

### After Phase 5: Update or Create globals.css Reference

As Intent Documents are produced, capture any newly-referenced tokens in a summary so developers know what must be added to globals.css before implementation can begin.

## 4. Common misapplications

**Misapplication 1: Describing instead of extracting.** "The reference has a blue sidebar with white text and 4 cards" is description. "The reference uses a persistent navigation spine with high-contrast text, organizing content into bounded, equal-weight containers" is extraction. Always extract, never describe.

**Misapplication 2: Adopting everything.** A reference may have excellent typography but inappropriate density for our product. Extract each dimension independently. Adopt what fits; override what doesn't. Use the override matrix in Phase 3 to make deterministic decisions.

**Misapplication 3: Ignoring what's MISSING.** What the reference chose NOT to show is as informative as what it shows. If the reference has no sidebar despite deep hierarchy, that's a deliberate navigation decision. Extract the absence too. If no explicit override exists in Phase 3, ask in Open Questions.

**Misapplication 4: Extracting from off-category references without adjustment.** A consumer fitness app reference applied to a B2B analytics tool will produce wrong density, wrong interaction patterns, and wrong information hierarchy. The Classification Card filter (Phase 3) with the override matrix exists specifically to catch this.

**Misapplication 5: Treating the Intent Document as optional.** If a reference was provided, the Intent Document must be produced BEFORE generation begins. Do not read the reference, internalize it, and then generate from memory. The Document externalizes the reasoning so it can be reviewed and challenged.

**Misapplication 6: Using observations instead of principles in Phase 2.** The Principle Extraction Test exists to prevent this. If a principle only applies to one element in one reference, it fails the test. Rewrite it as a rule that generalizes across implementations.

**Misapplication 7: Skipping the override matrix in Phase 3.** Saying "this doesn't fit" without consulting the matrix creates arbitrary decisions. Every override must cite which matrix condition triggered it.

## 5. Downstream integration

- **interface-design** reads the Intent Document alongside the Classification Card to select layout and components
- **design-engine** checks for Intent Documents when references are present
- **design-critique** compares output against adopted principles in the Intent Document
- **meta-design** verifies that adopted principles are actually reflected in the generated output
- **globals.css** is updated with all new tokens referenced in Intent Documents before implementation begins


---

## Example Session

```
User: Extract design intent from 3 references provided for FleetCraft

References inspected:
  Linear app (https://linear.app)
  Vercel docs (https://vercel.com/docs)
  IBM Carbon (https://carbondesignsystem.com)

Intent Document built per reference:
  Linear → keyboard-first density, status indicators in plain dots, fast page transitions
  Vercel → mono font for code/data, dense table layouts, strong hierarchy
  IBM Carbon → grid-based layouts, structured spacing scale, industrial color palette

Principles adopted (3 from 3 refs):
  P1 — keyboard-first density (Linear)
  P2 — mono for data + display for headers (Vercel-influenced)
  P3 — structured 4/8/12px spacing scale (Carbon)

Tokens identified to add to globals.css:
  --space-grid-unit: 4px
  --font-mono: Söhne Mono
  --color-status-dot: graphite-500

Output: dev_docs/design/intent-document.md
Chain → domain-pattern-library, design-system-architect
```

---

## Chain Dispatch

### Workflow positions:
- **ui-redesign** — This is Step 2. Next: Skill: domain-pattern-library
