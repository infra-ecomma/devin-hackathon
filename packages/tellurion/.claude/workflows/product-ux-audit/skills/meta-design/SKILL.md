---
name: meta-design
description: Product-aware UI and craft review. Audits the visual substrate of an application — design tokens, typography, vertical rhythm, hierarchy, contrast, density, alignment, visual state system, motion, iconography, imagery/data viz, empty/error/loading treatments, dark mode parity, responsive/mobile craft, and brand coherence — and produces findings with file paths, rendered-screen references, and theory-bank tag citations. Unlike `product-ux-review` (which grades flows, heuristics, and data utilization), `meta-design` grades the physical craft of the interface — whether the tokens, spacing, type, and states add up to a product a paying customer would trust. Triggers on: UI review, design review, craft audit, visual audit, design token audit, improve the UI, the design feels off, why does this look cheap, does this feel premium, brand audit, responsive audit, dark mode audit. Also fires as Phase 5b of `/product-ux-audit` alongside `product-ux-review` (Phase 5a).
version: 2.0
maintainer: Wassim / TBK Labs
updated: 2026-04-07
---

# meta-design — UI & Craft Review (v2)

## 1. Why this skill exists

A product can have a correct information architecture, a working flow, and a plausible data model, and still feel cheap enough that a paying customer cancels in week one. The reverse is also true — a visually immaculate product with a broken flow will never earn the second session. Craft and UX are a joint distribution, not alternatives. `meta-design` exists to grade the craft axis with the same rigor `product-ux-review` grades the experience axis.

The single-pass heuristic audits that Claude runs by default catch the obvious failures (missing hover states, tiny touch targets, a clash between two greys) and miss the structural ones (a six-token palette claimed by a code base that actually hard-codes thirty-one hex values; a type scale declared in tailwind config but bypassed by arbitrary `text-[13px]` classes; a light-mode skin retrofitted with a dark-mode override that silently swaps the brand accent for a muddy off-teal). `meta-design` v2 fixes those three failure modes by insisting on:

- **Token audit-by-grep**, not audit-by-screenshot. Every token gets enumerated from the config, then grep-verified against the code base. Values-outside-tokens are logged as findings.
- **Dimension-by-dimension protocol**, not "vibes." Each of the fifteen dimensions has a written audit protocol an auditor must follow — the procedure is the deliverable, the finding is the artefact.
- **Theory-bank tag citation** on every P0 and P1, so severities trace back to a cited law or heuristic (Bringhurst on type, Müller-Brockmann on grid, Tufte on data-ink, WCAG 2.2 on contrast, Norman on affordance) instead of auditor preference.

This skill runs as Phase 5b of the `/product-ux-audit` workflow immediately after `product-ux-review` (Phase 5a) and shares its calibration input (Axis A, Axis B, commercial state, three peer references). It can also be invoked standalone for a pure UI pass.

## 2. How meta-design relates to product-ux-review

They are siblings, not alternatives. They share a calibration (Phase 0 of the workflow), share a theory bank (`theory-bank.md`), and share a severity formula (F × I × P × R). They differ in what they grade.

| Concern | product-ux-review | meta-design |
|---|---|---|
| Information architecture | Yes — routes, navigation, hierarchy of pages | No — stops at visual hierarchy of a page |
| Flow & heuristic walkthrough | Yes — Nielsen, Shneiderman, cognitive walkthrough | No |
| Data utilization / schema parity | Yes — dead schema, buried data | No |
| Domain playbook (canonical loop) | Yes — Phase 4 of the workflow | No |
| Retention narrative (Day 1/7/30) | Yes — Phase 6 of the workflow | Contributes craft evidence only |
| Design token system | Touches lightly (primitives dimension) | **Primary owner** |
| Typography system | Touches lightly (copy dimension) | **Primary owner** |
| Vertical rhythm, alignment, hierarchy | No | **Primary owner** |
| Contrast / WCAG | Touches (accessibility dimension) | **Primary owner** |
| Visual state system (hover/focus/disabled/loading/error/empty) | Touches (empty/error states) | **Primary owner** — all 9 states, all interactive elements |
| Motion & transitions | No | **Primary owner** |
| Iconography, imagery, data viz | No | **Primary owner** |
| Dark mode parity | No | **Primary owner** |
| Responsive & touch craft | Touches (mobile dimension) | **Primary owner** |
| Brand & tone coherence | Touches (copy dimension) | **Primary owner** |

Findings discovered jointly (e.g. a button that has the wrong hierarchy from a UX standpoint *and* the wrong affordance from a craft standpoint) are tagged `LENS = both` when the workflow merges Phase 5a and 5b outputs.

## 3. Hard gates (non-negotiable)

These gates mirror the workflow's gates and extend them with craft-specific constraints. A `meta-design` audit that fails any gate stops and escalates.

1. **Phase 0 gate (inherited from the workflow).** Refuse to audit any product whose Axis A, Axis B, commercial state, and three peer references have not been declared. Phase 0 is the P0 ceiling: a strategy platform gets no P0 for a low-fidelity dashboard if the peers it competes with ship the same fidelity.
2. **Token audit gate.** Refuse to write any dimension finding until the design token system (Dimension 1) has been enumerated from the config and grep-verified. Every other dimension leans on tokens; auditing type before auditing the type tokens produces double-counting.
3. **Theory-bank citation gate.** Every P0 and P1 finding must carry at least one tag from `theory-bank.md` (e.g. `[bringhurst, grid]` for a type-and-alignment finding). Findings without tags are rejected in the self-eval pass.
4. **Screenshot or rendered-evidence gate.** Every P0 finding must cite either (a) a file and line number, or (b) a screenshot reference describing exactly what the auditor saw. "The buttons look cheap" without a screenshot citation is not a finding.
5. **Peer comparison gate (inherited).** Every P0 finding must include a peer comparison ("peer X ships the correct behavior; we do not").
6. **Dark mode gate.** If the product ships a dark mode toggle, Dimension 13 (Dark Mode Parity) runs as a hard requirement, not a nice-to-have. A light-only product skips Dimension 13 cleanly; a product with a broken dark mode cannot.

## 4. Severity formula (inherited from `/product-ux-audit`)

Score = **F × I × P × R**, each 1–5.

- **F — Frequency.** How often does the user hit the failure? 1 = once per lifetime; 5 = every session.
- **I — Impact.** What breaks when they hit it? 1 = cosmetic annoyance; 5 = blocks the promised first-value moment or shatters trust at first impression.
- **P — Persistence.** Does the user route around it? 1 = learned workaround; 5 = no workaround, friction every time.
- **R — Reversibility.** Can the user recover? 1 = trivial; 5 = lost trust, churn, or perceptual damage (e.g. brand looks fake once, stays fake forever).

Buckets:

- **P0** score ≥ 48, **and** the failure either blocks the promised first-value moment or causes a named peer-comparison deficit at first impression, **and** Phase 0 permits it. The first impression clause is a craft-specific extension: a product whose first screen triggers a "this feels cheap" reaction has a P0 craft bug even if no flow is broken, because first impression drives week-one churn.
- **P1** 24–47. Erodes trust over a session without killing it at first glance.
- **P2** < 24. Polish and debt.

Phase 0 remains the ceiling: a `meta-design` audit cannot raise a P0 for "insufficient visual polish" if the product is a beta-stage dev tool whose peers all ship the same fidelity. The peer reference is the calibration anchor.

## 5. The audit loop

The operator of this skill runs the following loop once per audit, regardless of whether the audit is standalone or part of `/product-ux-audit` Phase 5b.

1. **Inherit Phase 0.** Read the Phase 0 block of the workflow's audit document (Axis A, Axis B, commercial state, three peers, promise, non-promise). If the skill is being run standalone, demand these inputs before proceeding.
2. **Enumerate tokens (Dimension 1).** Grep the Tailwind config, CSS custom properties, Figma token export, or equivalent. Produce the canonical palette, spacing scale, radius scale, shadow scale, type scale, and motion scale.
3. **Grep values-outside-tokens.** For every raw hex, rem, px, ms, or rgba value in the code base, verify it corresponds to a declared token. Log every escape as a Dimension 1 finding.
4. **Run Dimensions 2–15 in order.** Each dimension has an audit protocol in Section 6 below. Follow it literally.
5. **Merge findings with `product-ux-review` output if in workflow mode.** Assign each finding a LENS = P / M / both label.
6. **Self-eval.** Walk the checklist in Section 8. Reject any finding that fails a gate.
7. **Output.** Produce the findings table fragment expected by the workflow's Phase 5 step, or — if standalone — produce a dated `meta-design-review-YYYY-MM-DD.md` in the project root.

## 6. The fifteen craft dimensions

Each dimension below is a complete audit unit. Dimensions are ordered so that earlier dimensions feed later ones: tokens before type, type before rhythm, rhythm before hierarchy, hierarchy before state.

---

### Dimension 1 — Design Token System  `[tokens]`

**What it audits.** The single source of truth for every repeated visual value in the product: colors (semantic and raw), spacing scale (usually a 4 or 8 multiple), radius scale, shadow scale, type scale, motion durations, z-index layers. The token system is audited at three levels: (a) declaration — is there a config? (b) coverage — does the config cover every value class the product uses? (c) adherence — does the code base actually reach for tokens, or does it hard-code values?

**Why it matters.** A product without a token system has no mechanism to stay consistent under growth. Every new component is a new chance to introduce a fourth shade of grey. The cost is invisible until the thirtieth component, when the palette has forty-one colors and the brand looks uncanny. Token systems are the craft equivalent of typed schemas: they make consistency structurally easy and inconsistency structurally hard.

**Phase 0 calibration.** A dev tool at beta can get away with raw Tailwind defaults. A fintech app at paid commercial state cannot — trust in a financial brand collapses the moment two greys disagree. A measurement product needs tokenized chart colors specifically because charts are the product.

**Audit protocol.**

1. Grep the config file. Tailwind: `tailwind.config.{ts,js}`, specifically the `theme.extend` block. CSS: `:root` custom properties. Figma export: the tokens JSON. Enumerate every color, spacing step, radius step, shadow level, and motion duration.
2. Grep raw hex values: `'#[0-9a-fA-F]{3,8}'` across the code base, excluding the config file itself. Every match is either a declared token reference (ok) or an escape (finding).
3. Grep raw rem/px spacing: `'(p|m|gap|space)-\[' ` and `'style=\"[^\"]*padding'`. Arbitrary Tailwind values bypass the scale; they are findings unless the designer has declared a fluid type or spacing intent (rare).
4. Grep raw transition durations: `'duration-\['`, `'transition-duration'`, `'[0-9]+ms'`. Verify against the motion token scale.
5. For each escape, classify: is the value a one-off intentional exception (e.g. brand logo color on a marketing page), or a leaked primitive?

**Ready-to-use findings.**

- **P0.** The product declares a six-color palette in `tailwind.config.ts` (`brand.50..900`), but the code base hard-codes **N distinct non-brand hex values** across `apps/web/src/components`, several within 3 lab-units of an existing brand token. This is a token system in name only. The practical effect is that any future palette change (including dark mode) will have to touch raw strings across the code base, not the config. Fix: grep every hex, replace with the nearest token, and add a pre-commit lint rule. Peer X ships a single token file and zero escapes. `[tokens, jakobs]`
- **P1.** Spacing uses a mix of Tailwind scale classes (`p-4`, `gap-6`) and arbitrary values (`p-[13px]`, `mt-[22px]`). **M call sites** use arbitrary values. Each one is a future inconsistency lever. Fix: extend the scale if the arbitrary values are reasonable, else round them into the scale. `[tokens, grid]`
- **P2.** Shadow scale is declared as `sm / md / lg` but four components reach for raw `shadow-[0_4px_12px_rgba(0,0,0,0.08)]`. Fold into the scale. `[tokens]`

**Theory-bank tags.** `[tokens]` (primary), `[jakobs]` (consistency as the core UX guarantee), `[aesthetic-usability]`.

**Common misapplications.**

- Counting every raw hex as a finding without checking if the file is a branded marketing page where one-offs are legitimate.
- Calling a "token system" present just because `tailwind.config.ts` has a `theme.extend` block — must also check adherence.
- Missing fluid type declarations as legitimate token escapes (they aren't escapes, they're a deliberate scaling contract).

**Overlaps with product-ux-review.** Dimension 1 overlaps with the "Primitives and Design Tokens Bypass" lens in `product-ux-review` v2. When both lenses fire, `meta-design` owns the finding and `product-ux-review` cites it.

---

### Dimension 2 — Typography System  `[type]`

**What it audits.** The type scale (how many steps, what ratio), the family stack (one or two families, loaded via `next/font` or `@font-face`), weight usage (how many weights are actually loaded vs called), line-height per step, letter-spacing per step, fluid or static sizing, and pairing coherence if two families are used.

**Why it matters.** Typography is the single highest-leverage craft dimension. Bringhurst's rule of thumb — a product's type quality is inversely proportional to the number of unmotivated type sizes on a page — is the cleanest predictor of perceived craft. A product with eight sizes in eight places on one screen cannot read as premium no matter how polished the color palette is.

**Phase 0 calibration.** A long-form reading product (analytics dashboards with reports, blog publishing, docs sites) bears Bringhurst's weight fully. A transactional utility (payment, checkout, calendar) can survive with a shorter scale and still feel premium. Measurement products need scale for numbers — the numeric type size is usually a dedicated track.

**Audit protocol.**

1. Enumerate the declared type scale from the config. Count the steps. Note the ratio (1.25 major third, 1.333 perfect fourth, 1.5 perfect fifth, 1.618 golden, 1.125 major second). A declared scale with no ratio is a red flag.
2. Enumerate font families loaded. Grep `next/font`, `@font-face`, and `<link rel="preload">`. Count weights loaded. Count weights actually used in the code (grep `font-weight` and tailwind `font-{weight}`). Loaded-but-unused weights are a performance finding and a discipline signal.
3. Enumerate arbitrary sizes: `text-\[`. Every arbitrary size is a finding unless justified.
4. Walk the rendered homepage (or Phase 0 first-value page) and list every visibly distinct type size on that screen. Count. The count is the upper bound on the scale steps that screen needs.
5. Check line-height per scale step. A `text-4xl` with `leading-normal` (1.5) is nearly always wrong — display sizes want tighter leading. A `text-sm` with `leading-tight` (1.25) is nearly always wrong — body sizes want looser leading. Mismatches are findings.
6. Check letter-spacing (tracking). Display sizes tighten; UI text at small sizes loosens. Declared? Or defaulted?
7. If two families are used, check pairing: do they share an x-height? Optical size mismatch is a perceptual tax.

**Ready-to-use findings.**

- **P0.** The home page renders **N visually distinct type sizes** in a single viewport (counted: 12px / 13px / 14px / 15px / 16px / 18px / 20px / 24px). The declared scale has 7 steps but `text-[Npx]` arbitrary values appear 14 times. Bringhurst: a page with more than three to five live type sizes stops reading as typographically intentional. The current density puts the product at eight. Fix: collapse arbitraries into the scale, drop one of the redundant body sizes (either 13 or 14, not both). `[bringhurst, miller]`
- **P0.** Two families are loaded (`Inter` and `Geist`) but no visible pairing logic — both are used for body copy on different pages, and neither is used exclusively for display. The effect is that pages look like they came from different products. Fix: assign one family to display and one to body, or drop to one family. Peer X uses a single family. `[bringhurst, jakobs]`
- **P1.** `text-4xl` uses `leading-normal` (1.5), producing a visually loose display heading that reads closer to a stretched body paragraph. Tighten to `leading-tight` (1.1–1.2). Grep finds **M call sites**. `[bringhurst]`
- **P1.** Four font weights are loaded (`400`, `500`, `600`, `700`) but only two (`400`, `600`) are referenced in code. Drop the unused weights from the `next/font` config. Saves ~36 KB. `[tokens, type]`
- **P2.** Body copy letter-spacing uses the browser default at 14px, which is on the tight side for the chosen family. Consider `tracking-[0.01em]` for small UI text. `[bringhurst]`

**Theory-bank tags.** `[bringhurst]` (primary), `[miller]` (seven-plus-or-minus-two ties to scale step count), `[jakobs]`, `[tokens]`.

**Common misapplications.**

- Counting `text-xs` and `text-sm` as two sizes without checking whether they both appear on the same screen (they might be correctly scoped to different contexts).
- Flagging an arbitrary `text-[13px]` when the designer has locked a fluid type scale where 13 is an in-between step — verify intent.
- Reporting a pairing "failure" when one family is a monospace used only for code blocks (a legitimate third family).

**Overlaps with product-ux-review.** Type readability for body copy overlaps with the "copy" lens in `product-ux-review`. meta-design owns the scale, family, weight, and rhythm; product-ux-review owns the words and voice.

---

### Dimension 3 — Vertical Rhythm & Baseline Grid  `[rhythm]`

**What it audits.** Whether spacing values compose into a consistent vertical cadence. The classic test: every margin, padding, gap, and line-height in the interface should resolve to a multiple of a base unit (usually 4px or 8px). Rhythm is what makes "tidy" feel tidy without the user being able to name why.

**Why it matters.** A product whose spacing values are 4/8/12/16/24/32 reads as deliberate. A product whose spacing values are 3/7/13/22/33 reads as a sequence of private decisions. The user cannot articulate the difference; they can only feel it. Rhythm is the craft equivalent of a shared build system.

**Phase 0 calibration.** Dense utility products (spreadsheets, terminals) can run on a 4px base with a shorter scale. Content-heavy products (reading apps, long forms, dashboards with text) want an 8px base and a longer scale. Marketing surfaces want wider spacing multiples. A fintech home cannot afford rhythm misses.

**Audit protocol.**

1. Infer the base unit. 8px is the modern default. 4px is acceptable for dense tools. Anything else is a finding by default.
2. Enumerate the spacing scale from the token audit (Dimension 1). Confirm every step is a multiple of the base.
3. Grep arbitrary spacing. Every arbitrary value is checked against the base. `p-[13px]` on an 8-base is a rhythm finding (13 is neither 8 nor 16).
4. Walk the homepage and measure gaps between major visual groups (header to hero to nav to content). If the page uses Tailwind, the measurement is the scale class. Note inconsistencies: a 24px gap between header and hero but a 20px gap between hero and nav is a rhythm miss.
5. Check line-height contributions. A `text-base` with `leading-6` contributes 24 to the rhythm. A `text-base` with `leading-7` contributes 28 and breaks rhythm unless the base is 4.
6. Check card internals. Cards frequently violate rhythm internally (16px padding, 10px gap between title and body, 12px gap to footer — three different values).

**Ready-to-use findings.**

- **P0.** The dashboard header uses `py-5` (20px), the nav uses `py-6` (24px), the card grid gap is `gap-5` (20px), and the card internal padding is `p-[18px]` (arbitrary). The product has no baseline rhythm; each component was spaced in isolation. Fix: pick 8px or 4px, round every spacing to the nearest multiple, re-measure the page. Peer X runs a clean 8-grid. `[rhythm, grid, tokens]`
- **P1.** The analysis page uses `gap-3` (12px) and `gap-3.5` (14px) in the same card component. Pick one. Grep: M call sites. `[rhythm, tokens]`
- **P2.** The marketing home header uses `py-20` and the feature section uses `py-24`. Unify to one or the other — the adjacency reads as asymmetric. `[rhythm, grid]`

**Theory-bank tags.** `[rhythm]`, `[grid]` (Müller-Brockmann on modular grids), `[bringhurst]` (leading as rhythmic contribution), `[tokens]`.

**Common misapplications.**

- Flagging a `py-1` (4px) on an 8-base as "broken rhythm" when it's legitimate half-step spacing used inside a dense control.
- Measuring rhythm on the marketing home and applying the finding to the app shell — they can legitimately use different bases.
- Treating every fractional Tailwind class (`space-1.5`, `p-0.5`) as an escape. 0.5, 1.5, 2.5 are legitimate half-steps on a 4-base.

**Overlaps with product-ux-review.** None directly. Dimension 3 is a pure craft lens.

---

### Dimension 4 — Hierarchy & Visual Weight  `[hierarchy]`

**What it audits.** Whether the page tells the eye what to look at first, second, third. Hierarchy is created by size, weight, color, position, and whitespace. A hierarchy failure is any page where two or more elements fight for first-look attention, or where the element that *should* be first is not.

**Why it matters.** Jakob's law ("users spend most of their time on other sites") means users expect to be told where to look. Peak-end rule means the first-look element is what they will remember. A page with no hierarchy has no memory.

**Phase 0 calibration.** A strategy platform whose product is "see the plan" must give the plan first-look dominance. A measurement product must give the latest result first-look dominance. An execution product must give the primary action first-look dominance. Phase 0's "what the product promises" determines what first-look *must* be.

**Audit protocol.**

1. Screenshot the Phase 0 first-value page. Squint at it until the shapes blur. The first element that remains visible at squint-test is the dominant. Name it.
2. Compare the dominant to what Phase 0 says the product promises. Mismatch is a P0.
3. Walk through the h1/h2/h3 DOM order. Does the semantic hierarchy match the visual hierarchy? Mismatches are findings.
4. Check primary action button prominence against secondary and tertiary actions. Equal-weight buttons are a failure unless the page is a decision form with symmetrical options.
5. Grep button variants. If `variant="primary"` appears alongside `variant="secondary"` at similar frequency, verify visually that primary buttons dominate.
6. Check color-as-hierarchy. A grey primary button on a grey background is invisible regardless of label size.

**Ready-to-use findings.**

- **P0.** The dashboard's first-value answer (the latest analysis verdict) is rendered at `text-base` alongside four cards of equal visual weight. The user cannot tell what is the answer and what is context. Fix: render the verdict at display size (`text-4xl` or larger) with a color accent, and demote the four context cards to secondary. Peer X anchors its dashboard with a large central metric. `[hierarchy, peak-end]`
- **P0.** The "connect an account" CTA is rendered as a tertiary text link below the fold on the onboarding page. The product's Phase 0 promise is "connect, see insights in 30 seconds." The CTA must be the visual anchor. Fix: promote to primary button above the fold. `[hierarchy, fitts, goal-gradient]`
- **P1.** The settings page uses two equally-weighted buttons ("Save" and "Cancel") where "Save" is the promised action. Elevate "Save" to primary and demote "Cancel" to a text button. `[hierarchy, default]`
- **P1.** H1 and h2 both render at `text-2xl font-semibold` with no visible size delta. Widen the gap. `[hierarchy, bringhurst]`
- **P2.** The "forgot password" link on the sign-in page is the same weight as the primary action. Fine but debatable. `[hierarchy]`

**Theory-bank tags.** `[hierarchy]`, `[peak-end]`, `[fitts]`, `[jakobs]`, `[bringhurst]` (type size as hierarchy), `[gestalt]` (visual dominance).

**Common misapplications.**

- Naming the logo as the dominant element at squint-test and calling it a hierarchy failure. Logos are legitimately top-left and not the first-look target.
- Applying the "primary must dominate" rule to a page where the user has already committed and the task is a symmetrical confirm.
- Missing hierarchy wins — a page whose hierarchy is correct often goes unaudited. Celebrate it, move on.

**Overlaps with product-ux-review.** Hierarchy is where meta-design and product-ux-review collaborate most tightly. product-ux-review asks "does the hierarchy match the flow?" meta-design asks "does the page render the claimed hierarchy?" When both lenses fire, the finding is LENS = both.

---

### Dimension 5 — Color Contrast & Accessibility  `[contrast, wcag]`

**What it audits.** Every text-to-background pair, every UI control-to-background pair, every focus ring, every data viz color against WCAG 2.2 AA at minimum (4.5:1 normal text, 3:1 large text and UI components). APCA is checked as a secondary lens where the product targets high craft. Color-blind safety is checked for data viz and status indicators.

**Why it matters.** WCAG is not a nice-to-have — it is the floor. A product that fails AA is non-negotiably broken for the 10–20% of users who will notice. More subtly, contrast failures correlate with the "this feels cheap" perceptual trigger: a 3.8:1 grey-on-white body looks blurry to everyone, not just users with low vision.

**Phase 0 calibration.** A healthtech or fintech product at paid commercial state must target WCAG AA as an absolute hard floor and AAA where feasible. A beta dev tool can target AA with known waivers. No product gets below AA as a P1 or lower.

**Audit protocol.**

1. Enumerate text colors and background colors from Dimension 1 tokens. Compute every ratio. Any ratio below 4.5:1 for body text or 3:1 for large/UI is a P0 by default (Phase 0 cannot waive WCAG).
2. Grep `text-gray-400` on `bg-white` and similar patterns — the default Tailwind grey-400 on white is 3.18:1, failing AA for body.
3. Check focus ring contrast. `ring-blue-500` on `bg-blue-50` may fall below 3:1. Focus rings below AA are access blockers.
4. Check hover state contrast. A button that dims on hover may drop below AA during the hover window.
5. Check data viz palette against color-blind simulation. Red-green combinations without shape or texture differentiation are a finding.
6. Check icon-on-background contrast. Icons are UI components at 3:1.
7. Check error/success/warning colors. Status colors are usually tuned for saturation, not contrast, and often fail.

**Ready-to-use findings.**

- **P0.** Body copy on `bg-white` uses `text-gray-500` (Tailwind default: hex 6b7280), which is 4.6:1 — passes narrowly. But every instance of `text-gray-400` on white (hex 9ca3af, 3.18:1) fails AA. Grep finds **M call sites** including the entire settings page description text. Fix: replace with `text-gray-600` (5.7:1) minimum. `[wcag, contrast]`
- **P0.** The primary button uses `bg-brand-400 text-white` (computed ratio 3.1:1). AA for UI is 3:1, but AA for text on a control is 4.5:1. The button fails for text. Fix: move to `bg-brand-500` or darker. `[wcag, contrast]`
- **P0.** The focus ring on form inputs is `ring-brand-200` on `bg-brand-50` (1.6:1). Focus is invisible to keyboard users. Fix: `ring-brand-600` or add a secondary outline. `[wcag, affordance]`
- **P1.** Data viz uses red and green as the only distinguishers for up/down metrics. Fails color-blind safety. Add an arrow or shape marker. `[wcag, tufte]`
- **P2.** Disabled text uses `text-gray-300` (2.1:1). WCAG exempts disabled controls from contrast, so this is technically allowed, but it reads cheap. Consider `text-gray-400` with `cursor-not-allowed` instead. `[contrast, affordance]`

**Theory-bank tags.** `[wcag]` (primary), `[contrast]`, `[tufte]` (chart color), `[affordance]` (focus rings as affordance).

**Common misapplications.**

- Computing contrast between text and a gradient background by sampling one point — check worst-case on the darkest and lightest gradient stops.
- Treating semi-transparent overlays (`bg-black/50`) as fully opaque when checking ratios.
- Failing `text-white` on brand primary without checking it was measured against the brand color in use, not the default blue.
- Missing that WCAG 2.2 added "focus not obscured" (SC 2.4.11) — check focus isn't hidden behind sticky headers or modals.

**Overlaps with product-ux-review.** Accessibility overlaps directly with product-ux-review's a11y dimension. meta-design owns quantitative contrast numbers; product-ux-review owns keyboard nav order, screen reader labels, and ARIA semantics.

---

### Dimension 6 — Density, Information Density, White Space  `[density, tufte]`

**What it audits.** How much information the product puts on one screen and how much air surrounds it. Tufte's data-ink ratio (maximize information per pixel without crossing into noise) is the core lens. Density failures go both ways: a product that crams too much (fintech terminals often) and a product that cushions too much (marketing-style SaaS homes often).

**Why it matters.** Density is positioning. A dense product signals "power user, fast, comprehensive." A spacious product signals "premium, accessible, confident." Mismatched density (dense product with spacious home, or spacious product with crammed settings page) is a trust signal failure.

**Phase 0 calibration.** Power-user dev tools and financial terminals want density. Consumer subscription products want air. Measurement products want density for numbers and air around narrative. The peer references set the ceiling and floor.

**Audit protocol.**

1. Screenshot the Phase 0 first-value page. Count the number of distinct information regions (cards, rows, metrics) visible in the first viewport.
2. Compare to peer X's equivalent page. Higher density than peer X in a consumer product is a finding; lower density than peer X in a power-user product is a finding.
3. Count the number of distinct typographic "voices" in a viewport (body, caption, metric, label, link). More than five is usually a noise finding.
4. Check data tables. Row density: are rows readable at 14px, 16px, or too crammed? Column count: does the table scroll horizontally on a 13" laptop?
5. Check white space adjacency to content. Are groups of related content adjacent, with unrelated content separated by air? Proximity is the primary Gestalt lever for density.
6. Walk through one full user flow. Do the pages breathe consistently, or does the hero breathe while the next step suffocates?

**Ready-to-use findings.**

- **P0.** The analysis result page renders **N distinct cards** across **two rows** with no visual grouping. The user is forced to scan the entire page to find the verdict. Peer X groups verdict + three supporting facts above the fold and hides detail behind expansion. Fix: regroup into a verdict hero + supporting details + optional deep-dive. `[density, gestalt, miller]`
- **P1.** The settings page uses `max-w-prose` on controls, leaving huge unused whitespace on either side. Controls breathe but the page feels empty. Narrow to `max-w-2xl` or fill with secondary content. `[density, foraging]`
- **P1.** Data tables render 15-row viewports at default density. Peer X renders 25 rows. Tighten row height. `[density, tufte]`
- **P2.** The home hero uses 80vh for a single sentence. Trim to 60vh, reclaim below-the-fold real estate. `[density]`

**Theory-bank tags.** `[density]`, `[tufte]`, `[gestalt]`, `[foraging]`, `[miller]` (short-term memory as the density ceiling).

**Common misapplications.**

- Grading a marketing home by app-shell density standards.
- Calling a dev tool "cluttered" when the density is an intentional power-user signal.
- Missing hidden density — a page that *looks* spacious but holds 40 hidden interactions in hover menus is denser than it appears.

**Overlaps with product-ux-review.** product-ux-review's "information architecture" lens addresses which pages exist; meta-design Dimension 6 addresses how much each page tries to do. When both fire, findings belong to IA, not craft.

---

### Dimension 7 — Alignment, Grid, Layout  `[grid, alignment]`

**What it audits.** Whether the product uses a column grid, whether elements align to it optically (not merely mathematically), and whether the layout obeys the grid under all conditions (desktop, tablet, mobile). Müller-Brockmann's modular grid principles are the reference.

**Why it matters.** Grid alignment is the craft axis users can detect at the squint test without being able to name. Misaligned elements register as "off" even when individually they look correct. A product that respects a column grid looks designed; a product that doesn't looks assembled.

**Phase 0 calibration.** Marketing and content-heavy products need rigorous grids. Dense tools can run on narrower grids with higher rigor. Mobile-first products need a grid that survives the breakpoint.

**Audit protocol.**

1. Identify the column grid from the layout components. Next.js apps typically declare a container width (`max-w-7xl`) and a gutter. Infer column count from the use of `grid-cols-N`.
2. Screenshot the first-value page at the target breakpoint. Overlay the grid in Figma or DevTools. Check every major element for alignment.
3. Check optical vs mathematical alignment. Round shapes (icons, pill buttons) usually need to sit slightly outside the mathematical line to look aligned. A mathematical alignment on a circular logo reads as too-far-left.
4. Check text alignment. Left-aligned body copy aligned to a label that is right-aligned creates a jagged optical channel.
5. Check column gutters. Are they consistent? Does the gutter between two columns match the gutter between the card and the page edge?
6. Check column count changes at breakpoint. Does a 3-col grid become a 2-col grid at md? Or does it become a 1-col stack too early?

**Ready-to-use findings.**

- **P0.** The dashboard uses `grid-cols-3` on desktop and `grid-cols-1` on mobile with no intermediate `md:grid-cols-2` stop. At tablet widths (768–1024px), the 3-col grid compresses to unusable 230px-wide cards. Fix: add `md:grid-cols-2`. `[grid, responsive]`
- **P0.** The marketing home aligns the hero headline to `max-w-7xl` but the feature section aligns to `max-w-6xl`. The edge-to-edge scan-line shifts between sections. Unify the container. `[grid, alignment]`
- **P1.** The primary button inside a card has `justify-end` against the card edge, but the card edge has 24px padding and the button mathematical edge lands exactly on the padding — it reads as touching. Pull back 4px or use optical alignment. `[alignment]`
- **P2.** Icon + label pairs use `gap-2` (8px), but the icon stroke weight makes the gap read as 10. Widen to `gap-2.5`. `[alignment, optical]`

**Theory-bank tags.** `[grid]` (Müller-Brockmann), `[alignment]`, `[gestalt]` (proximity), `[rhythm]`.

**Common misapplications.**

- Calling a deliberately asymmetric hero a grid violation when the asymmetry is the design intent.
- Missing that a mobile layout's container width is a grid decision (`px-4` vs `px-6` changes every grid computation).

**Overlaps with product-ux-review.** None directly. Dimension 7 is a pure craft lens.

---

### Dimension 8 — Visual State System  `[states, affordance]`

**What it audits.** Every interactive element is checked for the full nine-state set: **default, hover, focus-visible, active (pressed), disabled, loading, error, success, empty**. The audit is exhaustive: every button, link, input, select, checkbox, radio, toggle, card-acting-as-button, and keyboard-interactive element gets the checklist applied.

**Why it matters.** Missing states are the most frequent craft failure. Norman's affordance principle says users need feedback that their action was perceived. A button that changes nothing on click is a broken button. A form input with no error state is a form that silently rejects. A loading button that doesn't lock out double-clicks is a duplicate-charge bug. The nine-state set is the floor.

**Phase 0 calibration.** Every product gets this dimension. No calibration. A pre-revenue prototype can have states-are-planned debt; a paid product cannot.

**Audit protocol.**

1. Grep `cursor-pointer` on non-interactive elements (`div`, `span` without role). Each is a finding: either add the role or remove the cursor.
2. Grep `:hover` and `hover:` in CSS/Tailwind. Count interactive components. Ratio of hover states to interactive components should be ~1. If lower, count missing hover states.
3. Grep `focus-visible:` and `focus:`. Every interactive element must have a visible focus state. Tab through the app and verify.
4. Grep `:active` and `active:`. Pressed state for buttons. Less critical than hover and focus but still a finding if missing on high-use elements.
5. Grep `:disabled` and `disabled:`. Every control that can be disabled should have a clear disabled visual state, and a `cursor-not-allowed`.
6. Grep `isLoading`, `loading`, `isPending`, `pending`. For every loading state, verify: is the control locked? Is there a spinner or skeleton? Is the label preserved to prevent layout shift?
7. Grep `error:`, `isError`, form error props. For every error state: is it visible? Is it colored? Is it announced to screen readers?
8. Check success states. Are they present? Do they auto-dismiss? Do they confirm what was saved?
9. Check empty states. Grep `no data`, `no results`. Are empty states designed or default?

**Ready-to-use findings.**

- **P0.** The dashboard has **N clickable cards** (onClick handlers, `cursor-pointer`) but **zero** hover states. The user has no feedback that the card is interactive until they click. Fix: add `hover:bg-gray-50 transition-colors` and `hover:shadow-md`. `[states, affordance, doherty]`
- **P0.** Form inputs have no `focus-visible` ring. Keyboard users cannot see where they are. Fix: global `focus-visible:ring-2 focus-visible:ring-brand-500`. `[states, wcag, affordance]`
- **P0.** The "Save" button has a `loading` prop but the button is not locked on loading — a user double-clicking triggers the submit twice. Fix: `disabled={loading}` on the button plus a spinner. `[states, reversibility]`
- **P1.** Disabled buttons use `opacity-50` but no `cursor-not-allowed`. Users expect the pointer cue. Add it. `[states, affordance, jakobs]`
- **P1.** The data table shows "No results" as bare text with no illustration, no CTA, no explanation. Design an empty state that explains what's missing and offers a next action. `[states, empty]`
- **P2.** Success toast auto-dismisses in 3 seconds — too fast for longer confirmations. Extend to 5. `[states, peak-end]`

**Theory-bank tags.** `[states]`, `[affordance]`, `[wcag]`, `[doherty]` (feedback latency), `[peak-end]`, `[jakobs]`.

**Common misapplications.**

- Counting `hover:underline` on links as insufficient (it's a legitimate minimal hover state for links).
- Missing that `focus:` without `focus-visible:` shows the focus ring on mouse click too, which is a different finding.
- Calling a "no empty state" finding on a page the user never reaches empty in practice (still a finding, but lower severity).

**Overlaps with product-ux-review.** Empty/error/loading states overlap with product-ux-review's empty-states lens. meta-design owns the craft of the state (is it visually complete); product-ux-review owns whether the state explains the right thing.

---

### Dimension 9 — Motion & Transition Design  `[motion]`

**What it audits.** Every animation in the product — transitions (hover, state change, route change), entrances (modal open, toast appear), exits, loading spinners, skeleton shimmers, and scroll-triggered animations. Motion is checked for purpose, timing, easing, and reduced-motion compliance.

**Why it matters.** Motion is the single highest-leverage perceived-quality signal after typography. A product with zero motion feels static and dead. A product with over-eager motion feels toy-like. A product with purposeful, calibrated motion feels alive and responsive. Doherty's threshold (400ms) is the ceiling for transitions that users perceive as "instant."

**Phase 0 calibration.** Utility products and dev tools use motion sparingly and functionally. Consumer and premium products can afford richer motion. Accessibility-forward products must honor `prefers-reduced-motion` absolutely.

**Audit protocol.**

1. Grep `transition`, `animate`, `@keyframes`. Enumerate every animation in the system.
2. Check durations. Transitions ≥ 400ms are suspect (Doherty). UI state transitions (hover, focus) should be 100–200ms. Route transitions can go longer if accompanied by a skeleton.
3. Check easing. `ease-linear` on UI transitions is a finding — UI wants `ease-out` (fast start, slow finish) for entrances and `ease-in` for exits.
4. Check purpose. Every animation should either orient (tell the user where something came from), delight (reward an action), or feedback (confirm the action registered). Animations that do none of these are noise.
5. Check `prefers-reduced-motion`. Grep `@media (prefers-reduced-motion)`. Every non-trivial animation should respect it.
6. Check loading animations. Skeletons should pulse or shimmer, not rotate. Spinners should spin at a calibrated speed (too fast reads as panic, too slow reads as frozen).

**Ready-to-use findings.**

- **P0.** Zero `prefers-reduced-motion` support across the product. Users with vestibular disorders cannot use the animated entrance on every modal. Fix: global `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }`. `[motion, wcag]`
- **P1.** Button hover transition is `transition-all duration-300` (300ms). Too slow — feels laggy. Tighten to 150ms. Grep: 23 call sites. `[motion, doherty]`
- **P1.** Modal entrance uses `ease-linear` on a scale transform. Swap to `ease-out`. `[motion]`
- **P1.** Skeleton loading uses a rotating spinner for a data-heavy table. Replace with a shimmer that matches the final row shape. `[motion, states]`
- **P2.** Page route transitions are snap-cut with no fade. Adding a 120ms fade improves perceived polish without cost. `[motion, peak-end]`

**Theory-bank tags.** `[motion]`, `[doherty]`, `[peak-end]`, `[wcag]` (reduced-motion), `[affordance]`.

**Common misapplications.**

- Flagging `duration-300` as too slow when applied to a large layout transition (route change with skeleton is fine at 300ms).
- Treating a rotating spinner as always a finding — some loading states legitimately need a spinner because there's no row shape to skeleton.

**Overlaps with product-ux-review.** Motion is a pure craft lens. No overlap.

---

### Dimension 10 — Iconography  `[icons]`

**What it audits.** The icon set in use (Lucide, Heroicons, Phosphor, Feather, custom), consistency of stroke weight and grid, optical sizing, metaphor clarity, and accessibility (aria-labels on icon-only buttons).

**Why it matters.** Icons are high-frequency UI elements. Inconsistent iconography is an instant craft tell. A product that mixes stroke-1 and stroke-2 icons, or mixes outline and filled variants without a clear rule, reads as "assembled from stock." A product with a consistent icon family reads as curated.

**Phase 0 calibration.** Every product gets this dimension. Icon density is higher in power-user tools and lower in consumer products.

**Audit protocol.**

1. Identify the icon library. Grep imports: `lucide-react`, `@heroicons/react`, `phosphor-icons`, etc. A single library is a pass; mixing libraries is a finding.
2. Check stroke weight consistency. Grep `stroke-width`, `strokeWidth`. Verify all icons use the same weight.
3. Check variant consistency. `Heart` and `HeartFilled` have different metaphors (unfilled = save for later, filled = saved). Inconsistent usage is a finding.
4. Check size consistency. Grep `size-N`, `w-N h-N` applied to icons. Verify icon sizes are a small set (typically 16, 20, 24, 32).
5. Check optical sizing. A 16px icon with stroke-1.5 reads thinner than a 24px icon with the same stroke — consider stroke-1.75 for small sizes.
6. Check icon-only buttons for `aria-label`. Every one needs a label.
7. Check metaphor clarity. An icon whose meaning is ambiguous (a gear vs a cog vs a sliders icon for "settings") should be tested with a label. If the product uses the icon alone and the metaphor is not immediate, add a label.

**Ready-to-use findings.**

- **P0.** The icon set mixes Lucide (stroke-2) and Heroicons (stroke-1.5). Grep: **N imports** of Lucide, **M imports** of Heroicons. Pick one. `[icons, jakobs]`
- **P1.** Icon-only buttons on the toolbar have no `aria-label`. Screen reader users hear nothing. Add labels to 12 buttons. `[icons, wcag, affordance]`
- **P1.** The "delete" action uses a trash icon in one place and an X icon in another. Unify to one metaphor. `[icons, jakobs]`
- **P2.** The `w-5 h-5` icon in the primary button reads slightly small relative to the 16px label. Bump to `w-5 h-5` with `stroke-2` or up to `w-[18px]`. `[icons, optical]`

**Theory-bank tags.** `[icons]`, `[jakobs]`, `[wcag]`, `[affordance]`.

**Common misapplications.**

- Treating a second icon library as always a finding when the second library is a brand-specific one (e.g. a custom logo set).
- Flagging icon size inconsistencies inside data tables where dense density legitimately uses 14 or 12px icons.

**Overlaps with product-ux-review.** Icon clarity for metaphor overlaps with discoverability in product-ux-review. meta-design owns the craft; product-ux-review owns whether the label + icon combo answers the user's "what does this do?" question.

---

### Dimension 11 — Imagery, Illustration, Data Visualization  `[imagery, tufte]`

**What it audits.** Every rendered image (product photos, marketing photography, user avatars, brand imagery), every illustration (empty states, feature callouts, marketing), and every chart or data viz component. Checked for style consistency, brand alignment, color palette coherence, and Tufte principles on data viz specifically.

**Why it matters.** Imagery is the fastest "this feels cheap" trigger. Stock photos on a B2B home, AI-generated illustrations with extra fingers, a chart whose palette is `text-green-500` and `text-red-500` while the brand is blue and purple — all read instantly as amateur. Imagery consistency is the craft multiplier for the rest of the product.

**Phase 0 calibration.** Measurement products live or die on chart craft. E-commerce lives or dies on product photography. Consumer subscription apps need coherent illustrations. B2B can survive on purposeful spot illustration.

**Audit protocol.**

1. Enumerate every image source. Grep `<img>`, `<Image>`, `background-image`, Next.js `/public` folder. Note source: stock, custom, AI-generated, user-uploaded.
2. Check style consistency. Do all illustrations come from the same family (line art, filled, isometric, flat)? Mixing styles is a finding.
3. Check palette alignment. Do illustrations use brand colors? An illustration set with its own palette unrelated to the app is a finding.
4. Check photography quality. Pixelation, compression artifacts, inconsistent crops, inconsistent aspect ratios — all findings.
5. Check data viz. Enumerate chart colors. Verify against Dimension 1 tokens. A chart whose colors are outside the token system is always a P0 or P1 in a measurement product.
6. Check chart craft. Gridlines — necessary or noise? Data-ink ratio. Legend placement. Tooltip fidelity. Axis labels. Zero-baseline or windowed.
7. Check color-blind safety of charts (cross-references Dimension 5).
8. Check fallback treatments. `<img onError>` fallback? Broken user avatars?

**Ready-to-use findings.**

- **P0.** The analysis page renders charts with `#14b8a6` as the primary series color, but the brand accent is `#84cc16`. Grep: the chart theme file declares a standalone palette unrelated to the brand tokens. A measurement product's charts must match brand identity. Fix: import brand tokens into the chart theme. `[imagery, tokens, tufte]`
- **P1.** Empty-state illustrations come from a mixed set (two spot illustrations from undraw.co, one custom SVG, two stock line-art). Standardize. `[imagery, jakobs]`
- **P1.** Product screenshots on the marketing home are compressed to 150 KB each and show visible JPEG artifacts. Re-export at 90% JPEG quality + WebP fallback. `[imagery]`
- **P2.** Data viz tooltips use a `bg-gray-900` dark style against light-mode charts. Works but could match the chart style better. `[imagery, dark-mode]`

**Theory-bank tags.** `[imagery]`, `[tufte]`, `[tokens]`, `[jakobs]`, `[wcag]` (color-blind safety).

**Common misapplications.**

- Flagging AI-generated illustrations on quality alone — if the illustrations are consistent and on-brand, they're a valid choice for many products.
- Grading data viz against Tufte's strictest data-ink ratio when the product is aimed at executives who want more chart chrome, not less.

**Overlaps with product-ux-review.** Data viz utility (is it showing the right number?) overlaps with product-ux-review's data utilization lens. meta-design owns the chart craft; product-ux-review owns whether the chart answers the user's question.

---

### Dimension 12 — Empty, Error, Loading Visual Treatments  `[empty, states]`

**What it audits.** The visual quality of the three most-neglected states: empty (no data yet), error (something went wrong), loading (work in progress). These are the moments when the product's polish is most visible, because they cannot be populated with mock content — the designer had to deliberately think about them.

**Why it matters.** Users see empty states first (on day one before they have data), error states when the product is most frustrating (so perception is amplified), and loading states every single interaction. A product with beautiful filled states and bare empty/error/loading states is a product whose craft collapses at the edges.

**Phase 0 calibration.** Products where the user spends significant time in empty states (new-signup apps, reporting tools before data, dashboards pre-connection) need exceptional empty states. Products where errors are common (fintech with rejected transactions, payment flows) need exceptional error states. Dimension 12 is scoped by how often the user hits each state.

**Audit protocol.**

1. Enumerate every empty state. Grep `no data`, `no results`, `empty`, `<Empty`, and check every page that can render zero items. Screenshot each.
2. For each empty state, check: Does it have an illustration? A clear explanation? A primary CTA? Does the CTA lead somewhere actionable? Is it designed, or is it `<p>No results.</p>`?
3. Enumerate error states. Grep `error`, `catch`, `toast.error`, form error slots. Screenshot each.
4. For each error state, check: Is it visible? Is it colored (red is standard but not mandatory)? Does it explain what went wrong? Does it suggest recovery? Is it announced to screen readers?
5. Enumerate loading states. Grep `loading`, `isPending`, `<Skeleton>`, `animate-pulse`. Screenshot each.
6. For each loading state, check: Is it a skeleton (preferred) or a spinner? Does it match the final content shape? Does it preserve layout to prevent shift?
7. Check the transitions between states. A snap from loading to filled is jarring; a fade is gentler.

**Ready-to-use findings.**

- **P0.** The dashboard's first-time-user empty state is `<p className="text-gray-500">No analyses yet.</p>`. No illustration, no CTA, no explanation of what an analysis is. The user arrives, sees this, and leaves. Fix: build a proper empty state with an illustration, one sentence of orientation, and a primary CTA ("Upload your first log"). Peer X has a six-item checklist-style onboarding empty state. `[empty, states, peak-end, onboarding]`
- **P0.** Network errors display "Something went wrong." with no detail and no retry button. The user has no recovery path. Fix: show the error code, suggest a cause ("check your connection"), and expose a retry button. `[states, doherty, reversibility]`
- **P1.** Loading state for the analysis results page is a 24px spinner in the center of a blank page. Users see a 2-second blank. Replace with a content-shaped skeleton. `[states, doherty]`
- **P1.** Form validation errors appear below the form as a single red paragraph listing all errors. Users cannot find which field is wrong. Inline the errors per field. `[states, affordance]`
- **P2.** Toast auto-dismisses after 2 seconds on errors, which is too fast for the user to read the cause. Extend to 6 seconds for errors only. `[states, peak-end]`

**Theory-bank tags.** `[empty]`, `[states]`, `[peak-end]`, `[doherty]`, `[affordance]`, `[reversibility]`.

**Common misapplications.**

- Calling a minimal empty state a finding when the product is a power-user tool where the user reaches empty state rarely.
- Grading error states on pages the user almost never errors on (low frequency — lower severity).

**Overlaps with product-ux-review.** Empty/error/loading is a shared territory. product-ux-review asks "does the state explain the right thing?" meta-design asks "does the state look complete?" Both run on this dimension.

---

### Dimension 13 — Dark Mode Parity  `[dark-mode]`

**What it audits.** If the product ships a dark mode, every dimension above is re-run in dark mode. Parity is checked: contrast holds, tokens flip correctly via a semantic layer, brand colors remain brand (not muddy), images and illustrations either swap or tolerate the background, focus rings and state colors remain visible.

**Why it matters.** Dark mode is where token systems collapse. A product with a six-color palette and a thoughtless dark mode retrofit ends up with two palettes of thirty colors each — twice the consistency surface and twice the maintenance. A product with a semantic token layer (`text-foreground`, `bg-surface`, `border-subtle`) flips automatically; a product with raw tokens requires per-component overrides that will drift.

**Phase 0 calibration.** Not every product ships dark mode. This dimension only runs if dark mode exists. But if it exists at any fidelity, it must pass as a hard gate — a broken dark mode is worse than no dark mode.

**Audit protocol.**

1. Verify semantic tokens exist. Grep for `text-foreground`, `bg-background`, `bg-surface`, `border-subtle` or equivalent. A product with raw tokens (`text-gray-900`) and `.dark` overrides per component is a finding.
2. Run every Dimension 5 contrast check in dark mode. Ratios flip direction; a pair that was 4.5:1 light can be 2:1 dark. Most common failure.
3. Check brand colors. A `brand-500` that looks saturated on white often looks muddy on dark-neutral backgrounds. Some brands need a dedicated dark-mode brand shade.
4. Check illustrations. Do SVGs use `currentColor` or hard-coded fills? Hard-coded light-mode fills will look wrong in dark mode.
5. Check shadows. Shadows in dark mode need to either flip to subtle glows or be suppressed entirely — a black shadow on a near-black background does nothing.
6. Check images. Photos on dark backgrounds need a subtle border or gradient to prevent edge bleeding.
7. Check borders. Border colors usually need to be lifted in dark mode (`border-gray-800` becomes `border-gray-700`).

**Ready-to-use findings.**

- **P0.** The product ships a dark mode toggle in settings but the implementation uses raw Tailwind greys with `.dark` overrides on **N components**. The semantic layer does not exist. Every new component must remember to ship a `.dark` variant, and half of them will forget. Fix: introduce a semantic token layer (`bg-surface`, `text-foreground`) and refactor one component at a time. `[dark-mode, tokens, jakobs]`
- **P0.** Primary brand color `brand-500` (#3B82F6) is readable on white but reads washed-out on dark-mode `#0b0b0c`. No dark-mode brand variant exists. Fix: introduce `brand-400` for dark mode (lighter and more saturated). `[dark-mode, contrast]`
- **P1.** Chart background in dark mode is the page background (`bg-background`) but the chart gridlines are a light-mode grey (`#e5e7eb`) that was not flipped. Gridlines are nearly invisible. `[dark-mode, tufte]`
- **P1.** Toast notifications use `bg-white text-black` unconditionally and do not flip. Fix: semantic `bg-surface text-foreground`. `[dark-mode, states]`
- **P2.** Illustration on empty state is a light-mode SVG with white background — shows as a bright square on dark mode. Add `fill="currentColor"` or ship two versions. `[dark-mode, imagery]`

**Theory-bank tags.** `[dark-mode]`, `[tokens]`, `[wcag]`, `[jakobs]`.

**Common misapplications.**

- Grading dark mode parity when the product ships only light mode (skip the dimension cleanly).
- Calling `dark:` overrides a finding when they're the intended pattern (they're only a finding when combined with the *absence* of a semantic layer).

**Overlaps with product-ux-review.** Dark mode is pure craft. No overlap.

---

### Dimension 14 — Responsive Breakpoint Craft & Mobile Touch  `[responsive, targets]`

**What it audits.** The product's behavior across breakpoints (mobile, tablet, laptop, desktop, wide). Not just "does it work," but "does it feel designed at each stop." Also checked: touch target sizes, safe-area handling on mobile, mobile-specific patterns (sheet dialogs, swipe gestures, mobile navigation).

**Why it matters.** Mobile is not a smaller desktop. A product that works on mobile by shrinking its desktop layout feels secondhand. A product that was considered at every breakpoint feels native. Touch targets smaller than 44×44px (Apple HIG) or 48×48dp (Material) are a usability failure that the auditor can grep.

**Phase 0 calibration.** Consumer and field-use products need exceptional mobile. Desktop-first power-user tools can tolerate imperfect mobile. Phase 0 names the expected primary device; grade accordingly.

**Audit protocol.**

1. Enumerate breakpoints from the Tailwind config (sm, md, lg, xl, 2xl) or CSS media queries. Note which are actually used (grep `sm:`, `md:`, etc.).
2. Screenshot the first-value page at each breakpoint. Squint-test each. Is the hierarchy preserved? Is the grid sensible? Is anything truncated?
3. Check touch targets on mobile. Grep buttons and links. Minimum target size is 44×44px. Grep `h-8` (32px) on buttons — usually a finding on mobile.
4. Check mobile navigation. Is there a hamburger? A bottom tab bar? A hybrid? Is it thumb-reachable?
5. Check tables on mobile. Tables that require horizontal scroll are a finding unless the product explicitly targets tablet-and-up.
6. Check forms on mobile. Do inputs trigger the right keyboard? (`type="email"`, `inputmode="numeric"`) Do date pickers use the native picker?
7. Check safe-area support. `env(safe-area-inset-bottom)` for bottom bars on notched phones.
8. Check orientation. Does landscape hold up? Most products ignore it — usually fine, but note landscape failures.

**Ready-to-use findings.**

- **P0.** Primary CTA button on the mobile home is `h-8` (32px × variable width). Below the 44px minimum. Grep: **N call sites**. Fix: `h-11` on mobile (44px). `[targets, wcag, fitts]`
- **P0.** Data tables on mobile overflow horizontally with no indication the user can scroll. Tables should collapse into card layouts on mobile or add a scroll hint. `[responsive, affordance]`
- **P1.** Mobile navigation is a hamburger menu that opens from the top — requires a two-hand thumb reach. Move primary actions to a bottom tab bar or add a bottom CTA. `[responsive, fitts]`
- **P1.** No `md:` breakpoint on a 3-col grid — layout jumps from 3 columns at `lg` to 1 column at the default. Add `md:grid-cols-2`. `[responsive, grid]`
- **P2.** Bottom-pinned elements on iOS don't respect `safe-area-inset-bottom`. Add the inset. `[responsive]`

**Theory-bank tags.** `[responsive]`, `[targets]` (touch target guidelines), `[fitts]`, `[wcag]`.

**Common misapplications.**

- Grading mobile severity on a product whose Phase 0 explicitly says "desktop-first, mobile is read-only."
- Calling a `h-9` button (36px) a failure without checking if the product uses generous padding that extends the hit area beyond the visible button.

**Overlaps with product-ux-review.** Mobile flows (can a user actually complete the task on mobile?) belong to product-ux-review. Mobile craft (are the elements reachable and sized correctly?) belongs to meta-design.

---

### Dimension 15 — Brand & Tone Coherence  `[brand]`

**What it audits.** Whether the craft of the product adds up to a single brand voice. The test is: if someone saw the product without the logo, would they know which product it is? The answer should be yes for any product that has been positioned with intent. The opposite — a product that looks like five different products glued together — is a brand failure, and brand failures are positioning failures.

**Why it matters.** Brand is not the logo. Brand is the accumulated craft signals: palette, type, spacing rhythm, motion style, illustration family, photographic treatment, copy tone, iconography. Products with coherent brand signals can charge more because they feel more. Products with incoherent signals cannot, no matter what the logo says.

**Phase 0 calibration.** Commercial state determines the ceiling. A paid SaaS competing with premium peers cannot afford brand incoherence. A beta dev tool can ship inconsistency as debt, but must have a plan.

**Audit protocol.**

1. Screenshot five pages of the product: marketing home, sign-in, onboarding, first-value page, settings. Line them up.
2. Squint at each. Do they all feel like the same product? If one looks like a different product (usually marketing vs app shell, or settings vs everywhere else), that's a finding.
3. Walk the color, type, motion, imagery, and copy tone across the five screenshots. Where do they diverge? Each divergence is a finding.
4. Compare to Phase 0's three peers. Does the brand coherence match the expected ceiling for this commercial state? Is the product punching above or below?
5. Check copy tone (craft surface only — voice belongs to product-ux-review). Is the headline voice the same as the body voice? Is the CTA voice the same as the error voice?
6. Check density and pacing. Does the marketing site breathe differently from the app? (Legitimate if intentional and branded; a finding if accidental.)

**Ready-to-use findings.**

- **P0.** The marketing site uses a display serif (Fraunces), a friendly illustration style (spot illustrations in brand colors), generous spacing, and a confident voice. The app shell uses Inter, no illustrations, dense spacing, and error-heavy copy. A user moving from marketing to app feels they've arrived at a different product. Fix: decide which is the brand, align the other. `[brand, jakobs, peak-end]`
- **P1.** Settings page uses a `gray-50` background but every other page uses `bg-white`. No obvious reason. Fix: unify. `[brand, tokens]`
- **P1.** Onboarding emails use a warmer voice ("Welcome aboard!") than in-app onboarding ("Upload a file to begin"). Align the voice across surfaces. `[brand]`
- **P2.** The marketing home uses a custom cursor on interactive elements. The app shell does not. Decide and unify. `[brand, affordance]`

**Theory-bank tags.** `[brand]`, `[jakobs]`, `[peak-end]`, `[aesthetic-usability]`.

**Common misapplications.**

- Grading marketing and app separately against each other when the product has an intentional two-surface brand (e.g. a consumer app with a B2B admin).
- Calling every divergence a finding — some are legitimate brand extension, not incoherence.

**Overlaps with product-ux-review.** Copy voice overlaps with product-ux-review's copy lens. meta-design owns visual brand; product-ux-review owns verbal brand. When both fire, finding is LENS = both.

---

## 7. The findings table format

When running as Phase 5b of `/product-ux-audit`, meta-design emits findings in the same format as product-ux-review, so the workflow's merge step can combine them without reshaping. The format is:

| # | Dimension | Class | Severity | F×I×P×R | File(s) + Line(s) | Fix | Peer | Tags |
|---|---|---|---|---|---|---|---|---|
| 1 | 1. Tokens | Exists-but-Not-Wired | P0 | 5×4×5×3=300 | `tailwind.config.ts`, 42 hex values across `apps/web/src/components/**` | Replace raw hex with token references, add lint rule | Linear uses one token file, zero escapes | `[tokens, jakobs]` |
| ... |

The `Class` column uses the Missing / Broken / Exists-but-Not-Wired taxonomy from rule D3. The `Severity` and `F×I×P×R` columns both appear; the score justifies the severity label. The `Peer` column is mandatory on every P0. The `Tags` column is mandatory on every P0 and P1.

When running standalone, meta-design additionally produces:

- A Phase 0 echo block (copied from the workflow doc or demanded at start).
- A dimension-by-dimension narrative section, not just the table — each dimension gets a 2–3 paragraph prose summary of what was found and what the product looks like overall.
- A "Craft narrative" closing section: in one page, what is the perceived-quality trajectory of this product? Does it feel cheaper than its peers or more premium? Why? This closes the audit with a single executive-readable paragraph.

## 8. Self-eval checklist (run before delivery)

- [ ] Phase 0 block present or inherited. Three peers named.
- [ ] Dimension 1 (tokens) audited first. All escapes logged.
- [ ] Every dimension run in order. No dimension skipped without a written reason.
- [ ] Every P0 has a theory-bank tag, a peer comparison, a F×I×P×R score, and a file+line or screenshot reference.
- [ ] Every P1 has a theory-bank tag and a file+line or screenshot reference.
- [ ] No P0 for a capability the product does not promise (Phase 0 ceiling).
- [ ] Dark mode (Dimension 13) run if the product ships it. Skipped cleanly if not.
- [ ] Responsive (Dimension 14) run against the Phase 0 primary device.
- [ ] Brand (Dimension 15) includes the squint-test five-page comparison.
- [ ] Findings table uses the Missing / Broken / Exists-but-Not-Wired taxonomy.
- [ ] Standalone runs include the closing craft narrative paragraph.
- [ ] All tags used are valid entries in `theory-bank.md` (grep-verify).

## 9. Cross-reference to product-ux-review

When meta-design runs as Phase 5b, the following finding cases require merging with product-ux-review output:

| Case | product-ux-review would say | meta-design would say | Merged LENS |
|---|---|---|---|
| Dead schema field with no UI | "Data utilization failure — column exists, UI never reads" | (silent — not a craft issue) | P |
| Primary button that is neither dominant nor labeled correctly | "CTA discoverability failure" (labels, IA) | "Hierarchy failure" (Dimension 4, size/weight) | both |
| Empty state with no illustration and no CTA | "No recovery path from empty" | "Empty state visual treatment failure" (Dimension 12) | both |
| Form error that's both invisible and un-announced | "Accessibility — announce errors" | "State system — error state missing" (Dimension 8) | both |
| Icon-only button with no label and ambiguous metaphor | "Discoverability — icon metaphor unclear" | "Icon accessibility — aria-label missing" (Dimension 10) | both |
| Dark mode contrast failure | (silent — not a UX flow issue) | "Dark mode parity failure" (Dimension 13) | M |
| Dashboard whose primary metric is buried | "Hierarchy mismatch with promised value" | "Hierarchy failure" (Dimension 4) | both |
| Type scale has eight sizes on one screen | (silent) | "Typography scale overflow" (Dimension 2) | M |
| CTA below fold on onboarding | "Goal gradient broken — CTA not discoverable" | "Hierarchy failure" (Dimension 4) | both |
| Motion disabled by `prefers-reduced-motion` not honored | (silent) | "Motion accessibility" (Dimension 9) | M |

## 10. Quick reference

| Property | Value |
|---|---|
| **Skill name** | meta-design |
| **Version** | v2 |
| **Runs as** | Phase 5b of `/product-ux-audit` (sibling to `product-ux-review` in Phase 5a), or standalone for UI-only reviews |
| **Dimensions** | 15 (tokens, type, rhythm, hierarchy, contrast, density, grid, states, motion, icons, imagery, empty/error/loading, dark mode, responsive, brand) |
| **Hard gates** | Phase 0 inheritance, token audit first, theory-bank tag on every P0/P1, peer comparison on every P0, dark mode enforcement if present |
| **Severity formula** | F × I × P × R, each 1–5. P0 ≥ 48 + first-impression clause + peer + Phase 0. P1 24–47. P2 < 24. |
| **Theory bank** | `~/Documents/Organizing Claude Code/workflows/Curated/Product-UX-Audit/theory-bank.md` (36 entries, 9 parts) |
| **Output (workflow mode)** | Findings table fragment merged into workflow Phase 5 output |
| **Output (standalone)** | `meta-design-review-YYYY-MM-DD.md` with Phase 0 block, dimension-by-dimension narrative, findings table, closing craft narrative |

---

**TBK Labs** · Curated Kit · meta-design v2 · 2026-04-07
