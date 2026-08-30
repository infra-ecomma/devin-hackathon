**TBK Labs** · Curated Kit

---

# Generation Contract v1

_A UI output is **GENERATIVE** (not cosmetic) if it satisfies ALL of the following criteria._

**CATEGORY** Contracts · Design  •  **STATUS** Active  •  **EFFECTIVE** 2026-04-11  •  **REVIEW** Quarterly

---

## Why This Contract Exists

The UI-Redesign workflow promises "generative, not patching" output. But without a formal definition of "generative," success is subjective. Three independent reviewers (structural, adversarial, generative) all flagged this gap: cosmetic redesigns — same layout, new colors — pass human review and get delivered as generative work. This contract makes generation objectively verifiable.

## Structural Novelty Requirements (MUST meet 4 of 5)

### Axis 1: KPI Strip Metrics
**Check**: Did metric count or order change from the original?

| Condition | Verdict |
|---|---|
| Metrics changed from original, now match Classification Card Primary Metrics order | **PASS** |
| Same metric names AND same order as original | **FAIL** (cosmetic) |
| Metric count changed but doesn't match Classification Card | **FAIL** (arbitrary, not classification-driven) |

### Axis 2: Widget Grid Layout
**Check**: Did column count or aspect ratio change?

| Condition | Verdict |
|---|---|
| Grid dimensions changed per Density Band (e.g., 4 cols → 2 cols) | **PASS** |
| Same column count AND same card size as original | **FAIL** (cosmetic) |

### Axis 3: Information Hierarchy
**Check**: Did above/below-fold content shift?

| Condition | Verdict |
|---|---|
| Content reordered per Decision Map, new components added/removed | **PASS** |
| Same components in same positions as original | **FAIL** (cosmetic) |

### Axis 4: Navigation Structure
**Check**: Did navigation model change?

| Condition | Verdict |
|---|---|
| Navigation layout or hierarchy changed (tabs → tree, flat → hierarchical) | **PASS** |
| Same nav structure, just restyled | **FAIL** (cosmetic) |

### Axis 5: Component Semantics
**Check**: Did domain-specific components replace generic ones?

| Condition | Verdict |
|---|---|
| New semantic components replace generic ones (StatCard → CampaignPerformanceCard) | **PASS** |
| Same component types, just CSS/styling changes | **FAIL** (cosmetic) |

## Semantic Alignment Requirements (MUST meet all 3)

### Axis 6: Data Model Alignment
Component props and TypeScript interfaces must reflect Classification Card domain. No generic "Item" types — use domain types (Campaign, Metric, Dimension). All component interfaces must be domain-specific.

### Axis 7: Decision Map Implementation
Content flow must reflect Primary/Secondary/Tertiary questions from the Classification Card:
- Primary Question → Above fold (KPI strip, alerts, status)
- Secondary Question → Main area (details, drill-down)
- Tertiary Question → Below fold (trends, historical)

### Axis 8: Design Decisions Implemented
All 7 signature decisions from DESIGN_DECISIONS.md must be present and verifiable in the generated code.

## Failure Cases (Any = COSMETIC, not GENERATIVE)

- Same KPI metric names and order, new design tokens (re-theming)
- Same widget positions, different padding/margin (polish)
- Same information hierarchy, new colors (re-styling)
- Same component tree, refactored CSS (technical cleanup)
- Same data model, new typography scale (typography upgrade)
- All metrics correct but layout unchanged (bug fix)

## Verification Workflow

This contract is checked in Step 6, Layer 0 (Structural Novelty Check) of design-critique:

1. Evaluate output against Structural Novelty (Axes 1-5) and Semantic Alignment (Axes 6-8)
2. If fewer than 4 of 5 structural axes pass → **REJECT** (P0 failure, return to Step 5)
3. If all 3 semantic axes pass → **APPROVE**
4. Generate `.claude/NOVELTY_DIFF.md` documenting which axes passed/failed

## Examples

### Example 1: GENERATIVE ✓
**Original**: Sidebar + KPI strip (4 generic metrics) + Card grid (3×4)
**Generated**: Account selector + KPI strip (6 domain metrics from Classification) + Hierarchical campaign table + Trend chart
**Score**: 5/5 structural + 3/3 semantic → **GENERATIVE**

### Example 2: COSMETIC ✗
**Original**: Sidebar + KPI strip + Card grid
**Generated**: Sidebar + KPI strip + Card grid (same structure, new spacing/colors/fonts)
**Score**: 0/5 structural → **COSMETIC, REJECT**

### Example 3: PARTIAL ⚠️
**Original**: Sidebar + KPI strip (4 metrics) + Card grid
**Generated**: Sidebar + KPI strip (6 metrics from Classification) + Card grid (same grid)
**Score**: 1/5 structural (KPIs only) → **PARTIAL, requires clarification**

---

**Approved by**: Trifecta Review Consensus (Structural + Adversarial + Generative)
**Effective**: 2026-04-11
**Review Frequency**: Quarterly or when workflow changes

---

**TBK Labs** · Curated Kit · Generation Contract v1 · 2026-04-11
