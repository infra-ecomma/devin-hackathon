# Theory Bank — UX / UI Audit Reference

**Version:** 1.0 · **Created:** 2026-04-07 · **Maintainer:** Wassim / TBK Labs
**Primary consumers:** `product-ux-review` skill, `meta-design` skill, `/product-ux-audit` workflow
**Scope:** This is an operational reference, not a textbook. Every entry exists because it has earned at least one real audit citation, not because it is a famous law. The bar for inclusion is: *can an auditor point at a specific finding and say "this is a violation of X, and here is the mitigation"?*

> **Canonical location.** This file is the canonical theory bank. A byte-identical mirror exists at `.claude/commands/product-ux-audit/theory-bank.md` because the `/product-ux-audit` trigger is registered in both the command and workflow trees. Edit this file; the mirror must be kept in sync by hand (or by a future sync script). See audit entry P2.5 in `audits/AUDIT-2026-04-16.md` for background.

---

## 0 · How to use this bank

The theory bank is consulted during **Phase 5** of `/product-ux-audit`, after discovery (Phase 1), grep-verification (Phase 2), schema-vs-UI parity (Phase 3), and domain playbook application (Phase 4). Its job is to **elevate a raw symptom into a principled finding** so the fix is defensible and the severity is calibrated.

The auditor's loop when using the bank is:

1. Take a raw finding from discovery (e.g., "the primary CTA on the dashboard is an 18×18 px icon-only button in the top-right corner").
2. Scan the bank's tag taxonomy to identify candidate principles (`cognitive-motor`, `interaction`, `perceptual-attention`).
3. Open the candidate entry and check the **Audit trigger** section — does the symptom match?
4. If it matches, rewrite the finding using the entry's **Example finding phrasing** template, cite the tag (e.g., `[fitts]`), and use the entry's heuristic to suggest the fix.
5. If the same finding lights up more than one entry (most do), pick the strongest causal principle as primary and list the others as secondary tags.
6. Severity calibration uses the **Frequency × Impact × Persistence × Reversibility** formula from the workflow, not the theory bank — but the theory entry often contains guidance for the Impact axis.

**Cardinal rule:** Do not cite a principle you cannot explain in one sentence without looking at the entry. If the entry feels like decoration, delete the citation.

---

## Tag taxonomy

Tags are the routing index. Every entry carries one or more tags. The workflow uses these tags to match findings to principles.

| Tag | Meaning |
|---|---|
| `cognitive-motor` | Physical/motor interaction cost (pointing, targeting, dragging) |
| `cognitive-decision` | Decision-making cost under options |
| `cognitive-memory` | Working memory, recall, chunking |
| `cognitive-learning` | Learning and knowledge acquisition load |
| `cognitive-temporal` | Time perception, response latency, waiting |
| `perceptual` | Pre-attentive visual perception (Gestalt) |
| `perceptual-attention` | Attention capture and orienting |
| `interaction` | Affordance, signifier, feedback |
| `mental-model` | User's expectations about how things work |
| `system-design` | System-level complexity allocation |
| `robustness` | Forgiving input, graceful degradation |
| `perception` | How beauty/polish affects perceived usability |
| `memory-experience` | How events are remembered after the fact |
| `motivation` | Why users start and finish tasks |
| `behavior-change` | Designing for behavior formation |
| `persuasion` | Legitimate influence techniques |
| `decision-making` | Behavioral-economic distortions |
| `product-strategy` | Framing what the product should be |
| `navigation` | Wayfinding and information scent |
| `scanning` | Reading and skim patterns |
| `layout-reading` | Page-level visual flow |
| `typography` | Type system, hierarchy, measure |
| `layout` | Grid, spacing, rhythm |
| `data-viz` | Charts, tables, dashboards |
| `interaction-physical` | Touch targets, gesture affordance |
| `a11y` | Accessibility requirements and patterns |
| `ethics` | Dark patterns, manipulation |
| `heuristic-core` | Top-level heuristic framework |

---

## Index

**Part 1 — Cognitive & Perceptual Laws**
1. Fitts' Law
2. Hick-Hyman Law
3. Miller's Law
4. Gestalt Principles of Perceptual Organization
5. Serial Position Effect
6. Von Restorff (Isolation) Effect
7. Sweller's Cognitive Load Theory
8. Doherty Threshold
9. Goal-Gradient Hypothesis
10. Zeigarnik Effect

**Part 2 — UX Heuristics & Frameworks**
11. Nielsen's 10 Usability Heuristics
12. Shneiderman's 8 Golden Rules of Interface Design
13. Norman's Affordance & Signifier Theory
14. Jakob's Law
15. Tesler's Law of Conservation of Complexity
16. Postel's Law Applied to UX
17. Aesthetic-Usability Effect
18. Peak-End Rule

**Part 3 — Behavioral Economics & Persuasion**
19. Fogg Behavior Model (B = MAP)
20. Cialdini's Seven Principles of Influence
21. Prospect Theory & Loss Aversion
22. Anchoring Effect
23. Default Bias / Status Quo Bias
24. Hyperbolic Discounting

**Part 4 — Product Strategy Frameworks**
25. Jobs-to-be-Done
26. Kano Model
27. Pareto Principle (applied to feature surfacing)

**Part 5 — Information Architecture & Wayfinding**
28. Information Foraging Theory
29. F-Pattern & Z-Pattern Reading
30. Gutenberg Diagram

**Part 6 — Visual & Typographic Principles**
31. Bringhurst's Typographic Principles
32. Müller-Brockmann Grid Systems
33. Tufte's Data-Ink Ratio & Chartjunk
34. Touch Target Minimums (HIG / Material / WCAG)

**Part 7 — Accessibility**
35. POUR & WCAG 2.2 AA Core Criteria

**Part 8 — Anti-Patterns & Ethics**
36. Brignull's Dark Pattern Taxonomy

**Part 9 — Cross-reference matrix** (which audit dimensions each entry supports)

---

# Part 1 — Cognitive & Perceptual Laws

---

### 1. Fitts' Law — `[fitts]` `cognitive-motor`

**Origin.** Paul M. Fitts, 1954, *Journal of Experimental Psychology*, "The information capacity of the human motor system in controlling the amplitude of movement." Later extended to 2D pointing by MacKenzie (1992).

**What it says.** The time required to move a pointer to a target is a logarithmic function of the distance to the target divided by the target's size along the axis of motion: `T = a + b · log₂(2D/W)`. Doubling the size of a target cuts movement time more than doubling the distance cuts it; shrinking a target below a comfortable threshold causes a superlinear increase in error rate, not just time. Targets at screen edges and corners have effectively infinite size along the off-screen axis (the pointer cannot overshoot them) — this is why the Mac menu bar lives at the top edge and why Windows taskbar is at the bottom.

**Why it matters in audits.** Fitts' Law is the first principle to check whenever a finding touches a click target, a drag source, a drop zone, or any interactive region. It is the cheapest and most reliably violated law in the bank: designers habitually shrink CTAs for visual elegance and then wonder why conversion drops.

**Audit trigger — check when:**
- The primary CTA on a page is visually smaller than any secondary or tertiary action on the same page.
- Icon-only buttons under ~24×24 CSS px carry destructive or commit actions.
- A frequently-used action lives in the floating center of a scroll region rather than anchored to an edge or corner.
- The cursor has to travel across a wide page (dense toolbar → distant submit) for a common action.
- Mobile touch targets are below the platform minimum (see entry #34).

**Heuristic to apply.** Measure or estimate every interactive target's hit box (not its visual size — the full clickable region including padding) and the linear distance a user's cursor or thumb travels from its most common origin to that target. Rank the product's interactive elements by frequency × movement cost. The top of that list should be the largest and closest-to-home targets. Where it isn't, that's a finding.

**Example finding phrasing.**
> *Primary "Save Analysis" button violates Fitts' Law `[fitts]`. The button is 96×32 px at the bottom-right of a 1200-px-wide form, while the secondary "Cancel" link is a 180-px text link at the top. The most frequent action requires the longest travel to the smallest target. Fix: swap the proportions — make "Save Analysis" the dominant 240-px primary button anchored at the bottom-left, collapse "Cancel" to a 120-px secondary link at the bottom-right. Expected CTR lift is moderate (15–30%) based on Fitts' literature.*

**Common misapplications.**
- Treating Fitts' Law as "bigger is always better." Fitts predicts logarithmic return on size — past a point, further enlargement wastes screen and crowds neighbors.
- Citing Fitts for purely visual hierarchy complaints. If the button is large enough and close enough but merely ugly, that's an Aesthetic-Usability (#17) issue, not Fitts.

**See also:** #17 Aesthetic-Usability, #34 Touch Target Minimums, #13 Norman's Affordance.

---

### 2. Hick-Hyman Law — `[hick]` `cognitive-decision`

**Origin.** W. E. Hick, 1952, "On the rate of gain of information," *Quarterly Journal of Experimental Psychology*; Ray Hyman, 1953, "Stimulus information as a determinant of reaction time." The two papers independently established the logarithmic form.

**What it says.** The time a person takes to make a decision between *n* equally likely options is a logarithmic function of *n*: `RT = a + b · log₂(n + 1)`. The logarithmic base means going from 2 to 4 options is cheaper than going from 16 to 18, because the user chunks options and navigates the chunk tree — but this only holds when the options are *organized* (categorized, ranked, filtered). When they are unorganized, the relationship degrades toward linear.

**Why it matters in audits.** Hick-Hyman is the law behind navigation design, menu structure, onboarding flow, and pricing-page layout. It is the law most often *misused* to justify aggressive feature cuts — the correct application is not "always reduce options" but "organize options so the log₂ relationship holds."

**Audit trigger — check when:**
- A top-level navigation has more than ~7 peer items with no visible grouping or hierarchy.
- A pricing page shows more than 4 plan cards in the same row without a clear recommended default.
- An onboarding flow asks the user to pick from a flat list of 10+ roles, industries, or use cases.
- A dropdown or select has 20+ items with no search, no sectioning, and no typeahead.
- A dashboard has 15+ widgets with no prioritization or collapse state.

**Heuristic to apply.** Count the cognitive branch points on every primary surface. A branch point is any moment the user must choose between ≥2 paths. For each branch point, ask: is the choice organized? (Chunks, sections, recommended defaults, filters, search, progressive disclosure.) If not, either reduce the branch count or organize it.

**Example finding phrasing.**
> *Onboarding role picker at `/register` violates Hick-Hyman Law `[hick]`. The user is presented with a flat 14-item list ("Driver," "Tuner," "Shop Owner," "Dyno Operator," "Enthusiast," ...) with no grouping and no recommended default. Hick-Hyman predicts a ~35% increase in decision time versus a 3-option top-level choice ("I tune my own car," "I tune for clients," "I'm just exploring") with sub-options on the next screen. Fix: two-level selection with three top-level buckets and progressive disclosure.*

**Common misapplications.**
- Removing features to reduce Hick cost when the fix is reorganization. Tesler's Law (#15) points out that complexity removed from the UI gets absorbed elsewhere — usually by the user.
- Ignoring that experts *want* more visible options and are hurt by progressive disclosure. Calibrate by user type.

**See also:** #15 Tesler's Law, #3 Miller's Law, #25 JTBD.

---

### 3. Miller's Law — `[miller]` `cognitive-memory`

**Origin.** George A. Miller, 1956, "The magical number seven, plus or minus two: some limits on our capacity for processing information," *Psychological Review*, 63(2), 81–97. Widely misquoted; Miller's actual claim was narrower than the popular version.

**What it says.** The average person can hold about 7 ± 2 distinct *chunks* in working memory at once, where a chunk is a meaningful unit (a word, a familiar acronym, a remembered pattern) rather than a raw data point. The law is about chunking as much as it is about the number seven: experts effectively expand memory by chunking, and designers effectively expand user capacity by helping the user chunk. Later research (Cowan, 2001) refined the working-memory limit downward to ~4 chunks for truly novel information.

**Why it matters in audits.** Miller's Law governs any surface where the user must hold state in their head while performing a task: multi-step forms, wizard flows, comparison shopping, branching decision paths, and any situation where an error message forces the user to remember the form state while reading the error.

**Audit trigger — check when:**
- A form is more than 7 fields without sectioning or progressive disclosure.
- A wizard has more than 5 steps without a persistent progress indicator showing past state.
- A comparison view shows more than 4 columns of dense data without row-level anchoring.
- An error message references state the user can no longer see (e.g., "The file size exceeded the limit" after the file field has been cleared).
- A multi-step checkout forces the user to re-enter information already collected.

**Heuristic to apply.** For every multi-step surface, identify the moments where the user must *remember* something from a previous step to act in the current one. Each such moment is a memory debit. Count the debits. If the count exceeds 4, either surface the remembered state visibly (sticky summary panel, persistent breadcrumb, inline recap) or restructure the flow to eliminate the debit.

**Example finding phrasing.**
> *Upload → Analyze → Share flow at `/upload` violates Miller's Law `[miller]`. The user names the log, picks a vehicle, picks a tuning context, and fills three optional metadata fields, then clicks Analyze. On the `/analysis/[id]` page that follows, none of the metadata the user just entered is shown, forcing them to remember which vehicle and which context they picked in order to interpret the findings. Fix: persistent "Context" panel on the analysis page recapping vehicle, date, tune version, and context tags.*

**Common misapplications.**
- Taking "7 ± 2" as a hard limit for menu or list lengths. Miller was describing working memory for novel information, not long-term recognition of familiar items. A 30-item navigation is fine if the user recognizes the labels; a 5-item form is not fine if the fields demand retained context from each other.
- Using Miller to justify aggressive hiding of UI elements. Hiding does not eliminate the memory cost; it often adds a recall cost.

**See also:** #7 Cognitive Load, #2 Hick-Hyman.

---

### 4. Gestalt Principles of Perceptual Organization — `[gestalt]` `perceptual`

**Origin.** Max Wertheimer, 1923, "Untersuchungen zur Lehre von der Gestalt" ("Laws of Organization in Perceptual Forms"); developed through the 1920s–30s by Wolfgang Köhler and Kurt Koffka. Translated into English and popularized in design literature via Koffka's 1935 *Principles of Gestalt Psychology*.

**What it says.** The human visual system groups elements into higher-order structures before conscious attention engages. The principles — **proximity** (close things group), **similarity** (alike things group), **continuity** (aligned things group), **closure** (incomplete shapes are completed), **figure-ground** (the eye separates foreground from background), **common fate** (things moving together group), **common region** (things in a shared bounded area group), and **uniform connectedness** (things joined by lines or shared backgrounds group) — are pre-attentive. They operate faster than reading and faster than conscious thought, which means they determine what the user perceives *before* any label or copy has influence.

**Why it matters in audits.** Gestalt principles are the foundation of every layout decision. When a user says a page "feels cluttered" or "feels disorganized," they are almost always describing Gestalt violations — spacing that contradicts grouping intent, border treatments that defeat common region, or inconsistent alignment that breaks continuity. Gestalt findings are the highest-leverage visual fixes because they cost nothing and affect first impressions.

**Audit trigger — check when:**
- Related form fields are not closer together than unrelated fields.
- A card layout uses borders on some cards and shadows on others (inconsistent figure-ground).
- Section headings do not sit visibly closer to their section than to the preceding section (violation of proximity).
- A button group mixes filled and outlined button styles without semantic reason (similarity failure).
- Data-dense tables lack row-striping or grouping lines (continuity failure).
- Destructive actions share visual styling with safe actions (similarity failure with dangerous consequences).

**Heuristic to apply.** Squint at the page. Literally — defocus your eyes and observe what the pre-attentive system groups. The groups your unfocused eye forms should match the semantic groups in the product. Wherever they diverge, that's a Gestalt finding. The fix is almost always a spacing adjustment (proximity), a background/border normalization (common region), or an alignment correction (continuity). Gestalt rarely requires new UI; it almost always requires existing UI arranged differently.

**Example finding phrasing.**
> *Dashboard widgets on `/dashboard` violate the Gestalt principle of proximity `[gestalt]`. The "Health Score" widget is 12 px from the "Recent Logs" widget (different semantic groups) and also 12 px from the "Vehicle Summary" widget (same semantic group). The pre-attentive system cannot distinguish the intended groupings. Fix: enforce a two-tier spacing system — 8 px within groups, 24 px between groups — via the Tailwind spacing scale.*

**Common misapplications.**
- Treating Gestalt as a label for "visual hierarchy." Gestalt is about grouping, not hierarchy. Hierarchy is typography (#31) and Von Restorff (#6).
- Applying only the famous three (proximity, similarity, continuity) and ignoring common region and common fate, which are often the most actionable in component systems.

**See also:** #31 Bringhurst, #32 Müller-Brockmann, #6 Von Restorff.

---

### 5. Serial Position Effect — `[serial-position]` `cognitive-memory`

**Origin.** Hermann Ebbinghaus, 1885, *Über das Gedächtnis* (*On Memory*); later formalized as the primacy and recency components by cognitive psychology through the mid-20th century.

**What it says.** Items at the beginning and end of a sequence are remembered better than items in the middle. **Primacy** works because early items get more rehearsal into long-term memory before working memory fills. **Recency** works because late items are still in working memory at test time. The middle of a list is a memory dead zone. The effect is robust across lists, menus, narrative sequences, and onboarding flows, and it holds even when the user is told to pay equal attention to all items.

**Why it matters in audits.** This is the law that governs ordering — not just in navigation but in pricing tables, onboarding sequences, feature walkthroughs, and any list where some items are more important than others. The auditor's question: *is the product exploiting the primacy and recency slots or wasting them?*

**Audit trigger — check when:**
- The most important navigation item is in the middle of the menu.
- The default-recommended pricing plan is not in position 1 or position 3 of a three-card layout (where the middle gets extra attention via contrast, not serial position).
- The onboarding carousel starts and ends with generic welcome/thank-you screens while the genuinely important setup steps are buried in the middle.
- A feature-comparison table lists headline features in the middle rows.

**Heuristic to apply.** For every ordered list the user scans, identify the items in positions 1, 2, 3, n−2, n−1, and n. Check whether the product's most important items land in those slots. If the middle of the list contains anything critical to the user's goal, restructure.

**Example finding phrasing.**
> *Pricing page plan ordering violates the Serial Position Effect `[serial-position]`. The three plans are ordered Free · Pro · Tuner Pro left-to-right, placing the highest-ARPU plan (Tuner Pro) in the recency position (strong) but the most conversion-friendly plan (Pro) in the middle dead zone. Given that Pro is the majority-conversion plan per tier analytics, it should occupy either position 1 (primacy) or position 3 (recency), and the ordering should be Free · Tuner Pro · Pro with Pro styled as "Most Popular."*

**Common misapplications.**
- Treating all positions as equal after applying a visual highlight. A visual "Most Popular" badge partially offsets the middle dead zone but does not eliminate it.
- Ignoring that list length matters: the effect is stronger in longer lists (>7 items) than shorter ones.

**See also:** #6 Von Restorff, #18 Peak-End Rule.

---

### 6. Von Restorff (Isolation) Effect — `[von-restorff]` `perceptual-attention`

**Origin.** Hedwig von Restorff, 1933, "Über die Wirkung von Bereichsbildungen im Spurenfeld" ("The effects of field formation in the trace field"), *Psychologische Forschung*.

**What it says.** An item that visually breaks from a uniform set is remembered disproportionately well. The isolation can be any dimension — color, size, shape, weight, position, motion — as long as the isolated item is a clear outlier. The effect is *isolation*, not *emphasis*; adding a red border to every item removes the effect, because nothing is isolated. Von Restorff is the scientific backbone of "most popular" highlighting, sale badges, and urgent-status indicators.

**Why it matters in audits.** This is the law behind intentional disruption of visual consistency. Gestalt (#4) tells you what groups; Von Restorff tells you what breaks a group on purpose. The auditor's job is to check that the things breaking the group are worth breaking it for.

**Audit trigger — check when:**
- A page has more than one "most important" visual treatment. Two primary CTAs on one screen defeat Von Restorff.
- Urgent/destructive indicators share color with routine indicators.
- Every card in a grid has a "new" badge (nothing is new if everything is).
- The product's primary differentiator is not visually emphasized at all.
- Error messages use the same color as warning messages.

**Heuristic to apply.** For each screen, count the elements that break the prevailing visual consistency. If the count is 0, the design is failing to direct attention. If the count is 1, the break is doing maximum work. If the count is 2–3, the breaks should be hierarchical (one dominant, others subordinate). If the count exceeds 3, Von Restorff has been destroyed and the screen has no focal point.

**Example finding phrasing.**
> *Dashboard primary actions violate Von Restorff `[von-restorff]`. The "Upload Log" button, "Share Report" button, and "New Vehicle" button all use the same `bg-tbk-accent` treatment, competing for the primacy slot. The user's eye has no focal point. Fix: reserve the accent fill exclusively for "Upload Log" (the Day-1 primary action); demote "Share Report" to the outline variant and "New Vehicle" to a text link.*

**Common misapplications.**
- Using Von Restorff to justify every bit of visual noise. Every isolated element steals from another isolated element; the budget is small.
- Forgetting accessibility: if the isolation is color-only, it fails for color-blind users. Isolate on two dimensions (color + icon, color + weight) for robustness.

**See also:** #5 Serial Position, #4 Gestalt, #13 Norman's Signifiers.

---

### 7. Sweller's Cognitive Load Theory — `[load]` `cognitive-learning`

**Origin.** John Sweller, 1988, "Cognitive load during problem solving: Effects on learning," *Cognitive Science*, 12(2), 257–285. Foundational paper for instructional design; later extended to UI/UX through the 1990s–2000s.

**What it says.** Working memory has three types of load operating on it simultaneously. **Intrinsic load** is imposed by the inherent difficulty of the task itself — it cannot be designed away, only scaffolded. **Extraneous load** is imposed by the way the task is presented — poor layout, irrelevant elements, distracting chrome, ambiguous labels. This is the designer's enemy and the sole category that can be reduced without changing the task. **Germane load** is the effort the user is willing to invest in building schemas (learning patterns that turn novel tasks into familiar ones) — this is desirable load, and good onboarding invests it rather than avoids it. The designer's job is to strip extraneous load to near zero so that the user's working memory is available for intrinsic + germane.

**Why it matters in audits.** Cognitive Load Theory is the diagnostic framework for any finding that begins with "the user is confused." It separates three different confusions with three different fixes: the task is genuinely hard (intrinsic — scaffold it), the UI is in the way (extraneous — cut it), or the user is learning and needs more practice surface (germane — design for it).

**Audit trigger — check when:**
- The user must parse more than one novel concept per screen in an onboarding flow.
- A form asks for information the user must compute from other information (e.g., "enter your monthly budget" when the user knows their annual budget).
- Chrome, decoration, or navigation dominates the viewport over the actual task surface.
- Labels force the user to translate (e.g., "SKU" when the user thinks "product code").
- Error messages explain *what* went wrong but not *how to fix it*, forcing the user to hold the error in mind while searching for the fix.

**Heuristic to apply.** For each important task surface, split the visual elements into three piles: *needed for the task* (intrinsic/germane), *helpful for learning the task* (germane), *present for other reasons* (extraneous). The third pile is the finding. Common extraneous load sources: decorative illustrations above critical forms, redundant navigation on task pages, marketing copy on authenticated surfaces, premature upsell during first-time-value flows.

**Example finding phrasing.**
> *The "Run Analysis" form on `/upload/page.tsx:286` carries significant extraneous cognitive load `[load]`. Above the 4-field form, a 180-px decorative illustration and a 2-paragraph "What happens next?" panel compete for working memory with the form fields themselves. Germane load (learning the system) is better spent *after* first value, not before. Fix: collapse the decorative elements to a single one-line tagline above the form; move the "What happens next?" content to a post-submit loading state where the user has already committed.*

**Common misapplications.**
- Treating all reduction as good. Cutting germane load (teaching moments during onboarding) to reduce total load harms long-term retention.
- Confusing extraneous load with minimalism. The goal is *removing the irrelevant*, not removing the visually rich.

**See also:** #3 Miller's Law, #11 Nielsen Heuristic #8 (aesthetic and minimalist design), #15 Tesler's Law.

---

### 8. Doherty Threshold — `[doherty]` `cognitive-temporal`

**Origin.** Walter J. Doherty and Arvind J. Thadani, 1982, "The Economic Value of Rapid Response Time," IBM technical report GE20-0752-0. Based on empirical studies at IBM research labs.

**What it says.** Productivity does not merely degrade as system response time increases — it collapses at thresholds. Below ~400 ms, users operate in a fluid, exploratory mode and productivity rises superlinearly with reduced latency. Above that threshold, users shift to an interruptive, context-switching mode where each response wait costs not just the wait itself but also the mental-context cost of re-engaging. Doherty showed that cutting response time from 1.5 s to below 400 ms delivered productivity gains vastly exceeding the latency reduction — users stayed in flow, tried more things, and made better decisions.

**Why it matters in audits.** This is the principle behind every perceived-performance technique: skeleton loaders, optimistic UI, server-side rendering, streaming responses, prefetching. It is also the principle that justifies *hiding* latency when it cannot be eliminated — showing progress, showing the next screen's shell, or showing the previous screen's result persistently during re-fetches.

**Audit trigger — check when:**
- Any common interaction takes longer than ~400 ms from click to meaningful feedback.
- Loading states are generic spinners instead of skeletons matching the eventual layout (CLS risk + Doherty violation).
- The UI goes blank during server-side navigation in Next.js App Router (no `loading.tsx` Suspense boundaries).
- Form submissions display no optimistic state, forcing the user to wait for server confirmation before seeing the result.
- Search results repaint from scratch on each keystroke instead of progressively refining.

**Heuristic to apply.** Identify every interaction the user performs more than once per session. For each, measure or estimate the time-to-meaningful-feedback. Targets: click-to-visual-response under 100 ms, meaningful content under 400 ms, full-state-settled under 1000 ms. Every interaction above those thresholds is a finding, graded by frequency: a 2-second response on a once-per-session action is a P2; a 2-second response on a per-keystroke action is a P0.

**Example finding phrasing.**
> *The log upload → analysis transition on `/upload/page.tsx` violates the Doherty Threshold `[doherty]`. After clicking "Analyze," the browser shows a generic spinner for 3–8 seconds (depending on file size) before the `/analysis/[id]` page paints. This breaks flow — users either refresh or tab-switch. Fix: stream analysis progress via Server-Sent Events or Next.js streaming Suspense, showing parse → analyze → score stages as they complete. If the backend is synchronous (it is — `maxDuration = 60s`), at minimum paint a skeleton of the analysis page shell immediately on click and replace sections as data arrives.*

**Common misapplications.**
- Citing Doherty without measuring. "The page feels slow" is a complaint, not a finding. Use the browser performance panel or Lighthouse to get real numbers.
- Assuming mobile networks obey desktop thresholds. On 3G, 400 ms is often physically impossible for round trips; in that case, Doherty shifts the fix from "be faster" to "be optimistic" (show local state before server confirmation).

**See also:** #17 Aesthetic-Usability, #11 Nielsen Heuristic #1 (visibility of system status).

---

### 9. Goal-Gradient Hypothesis — `[goal-gradient]` `motivation`

**Origin.** Clark L. Hull, 1932, "The goal-gradient hypothesis and maze learning," *Psychological Review*. Originally formulated in animal learning research; extended to consumer behavior by Kivetz, Urminsky & Zheng (2006), "The goal-gradient hypothesis resurrected," *Journal of Marketing Research*.

**What it says.** Motivation and effort accelerate as a goal is approached. In animals, rats run faster through maze sections closer to the reward. In humans, the same acceleration appears in loyalty programs (coffee cards with pre-stamped rewards show higher redemption rates than identical cards requiring the same number of net purchases), incomplete checklists (users finish a list faster when they can see the end), and task completion (users who have finished 9 of 10 steps are far more likely to finish than those who have finished 1 of 2). The effect is stronger when the distance to the goal is both *visible* and *quantified*.

**Why it matters in audits.** Goal-gradient is the principle behind progress bars, onboarding checklists, multi-step wizards with visible step counts, and profile-completeness meters. The auditor's question: *are the product's long tasks visibly progressing, and is the progress framed to exploit goal-gradient?*

**Audit trigger — check when:**
- A multi-step form or onboarding flow lacks a visible step counter or progress bar.
- A profile-completeness, verification, or setup task has no surface showing what's done and what's left.
- A long-running process (analysis, export, report generation) shows only a spinner and no granular progress.
- A loyalty or usage-tier progression (e.g., "unlock X after 10 uploads") has no visible accumulator.

**Heuristic to apply.** For every task that requires more than 2 user actions or more than 2 seconds of system work, ask: *can the user see, right now, how close they are to the goal?* If not, add a progress surface. Second-order improvement: if the task has a fixed count (e.g., 5 onboarding steps), front-load the first step with auto-completion so the user starts at 1-of-5, not 0-of-5 — Kivetz's "endowed progress" effect.

**Example finding phrasing.**
> *The verified-report generation flow violates goal-gradient `[goal-gradient]`. The user clicks "Generate Verified Report" and waits 8–12 seconds with only a spinner. There is no indication of progress stages (parsing, scoring, rendering, hashing, publishing). Fix: stream the five stages as a vertical checklist with completing states. Endowed-progress variant: start the list with "Analysis verified ✓" already checked (since it was verified on the previous page), so the user feels they're 1-of-5 complete the moment the flow begins.*

**Common misapplications.**
- Fake progress. Progress bars that don't reflect real state trigger immediate distrust once the user catches on.
- Progress on tasks the user doesn't care about. Goal-gradient only motivates when the goal is valued; meter completion for its own sake is annoying.

**See also:** #10 Zeigarnik Effect, #19 Fogg Behavior Model.

---

### 10. Zeigarnik Effect — `[zeigarnik]` `cognitive-memory`

**Origin.** Bluma Zeigarnik, 1927, "Das Behalten erledigter und unerledigter Handlungen" ("On finished and unfinished tasks"), *Psychologische Forschung*. A student of Kurt Lewin at Berlin, Zeigarnik observed that waiters remembered unpaid orders in detail but forgot them immediately once paid.

**What it says.** People remember interrupted or incomplete tasks more vividly than completed ones. The mental system maintains an open loop for unfinished work that draws working memory until resolved. The effect is cognitive (memory for the task is better) and motivational (the incompleteness creates mild tension that motivates completion). Once a task is resolved, the loop closes and recall rapidly fades.

**Why it matters in audits.** Zeigarnik is the backbone of "resume where you left off" features, draft auto-saving, onboarding re-entry prompts, and notification re-engagement. It is also the reason unfinished profile setup, incomplete checklists, and "draft" badges are so effective — they create cognitive tension the user is motivated to resolve. And it is the reason *losing* a user's progress (a refresh that nukes form state) is disproportionately painful — the tension was already active, and it turns into frustration rather than motivation.

**Audit trigger — check when:**
- A user can lose form progress to navigation, refresh, or error without recovery.
- Drafts, in-progress configurations, or saved-but-not-published items have no visible re-entry surface.
- Onboarding flows that are abandoned leave no trace — no email follow-up, no dashboard prompt, no visual reminder that the task is incomplete.
- The product shows users their completed milestones more prominently than their open loops (inverted Zeigarnik).

**Heuristic to apply.** For every flow longer than one action, ask: *if the user stops halfway, does the product keep the loop open?* "Keeping it open" means: the state is preserved server-side, the user has a clear re-entry path, and that path is surfaced in a location the user will see. If all three aren't true, that's a finding.

**Example finding phrasing.**
> *Draft verified-reports violate the Zeigarnik Effect `[zeigarnik]`. A user who starts a verified report and navigates away loses all form state. On return, there is no "You have an in-progress verified report" prompt on the dashboard. The open loop has been forcibly closed by the product. Fix: persist form state to `verified_report_drafts` on blur; show a dashboard card "Resume your verified report — 3 of 7 fields complete" with a one-click continue.*

**Common misapplications.**
- Weaponizing Zeigarnik for dark patterns (see #36): nagging re-engagement notifications that exploit the open-loop tension without offering genuine value are manipulation, not motivation.
- Creating loops the user cannot close. A "finish your profile" prompt that cannot be dismissed is worse than no prompt.

**See also:** #9 Goal-Gradient, #19 Fogg Behavior Model, #36 Dark Patterns.

---

# Part 2 — UX Heuristics & Frameworks

---

### 11. Nielsen's 10 Usability Heuristics — `[nielsen-10]` `heuristic-core`

**Origin.** Jakob Nielsen and Rolf Molich, 1990, "Heuristic evaluation of user interfaces," CHI '90 Proceedings. Refined by Nielsen to the canonical 10 in 1994, "Enhancing the explanatory power of usability heuristics," CHI '94. The 10 have remained stable since and are the most-cited heuristic set in UX practice.

**What it says.** A set of 10 broad principles that experienced evaluators can apply to identify usability problems without user testing. They are deliberately *heuristics*, not rules — guidelines that require judgment — and they map to the categories of problems that users most commonly encounter.

1. **Visibility of system status.** Keep users informed about what is going on through appropriate feedback within reasonable time.
2. **Match between system and the real world.** Speak the users' language — words, phrases, and concepts familiar to them — rather than system-oriented terms.
3. **User control and freedom.** Support undo and redo; provide a clearly marked "emergency exit" from states entered by mistake.
4. **Consistency and standards.** Follow platform and industry conventions; don't make users wonder whether different words, situations, or actions mean the same thing.
5. **Error prevention.** Better than good error messages is careful design that prevents problems from occurring in the first place.
6. **Recognition rather than recall.** Minimize memory load by making objects, actions, and options visible; instructions should be visible or easily retrievable.
7. **Flexibility and efficiency of use.** Allow users to tailor frequent actions; support accelerators for experts invisible to novices.
8. **Aesthetic and minimalist design.** Dialogues should not contain information which is irrelevant or rarely needed — every extra unit competes with the relevant units.
9. **Help users recognize, diagnose, and recover from errors.** Express errors in plain language, precisely indicate the problem, and constructively suggest a solution.
10. **Help and documentation.** Ideally, the system should be usable without documentation; when documentation is needed, it should be easy to search and focused on the user's task.

**Why it matters in audits.** The 10 are the default heuristic lens — if a finding doesn't fit one of the more specialized laws, it almost always fits one of these. They are also the common vocabulary: "Nielsen #1" is understood by every UX practitioner, which makes findings portable across audiences.

**Audit trigger — check when:** Any finding that feels like "general usability" rather than a specific cognitive, visual, or domain issue. Reach for Nielsen as the first lens and only escalate to a more specific principle if the fit is exact.

**Heuristic to apply.** Walk through a primary surface with the 10 in a checklist. For each, rate compliance 0 (absent), 1 (partial), 2 (full). Any 0 or 1 is a candidate finding. Cluster findings by heuristic rather than by surface — it's usually the same heuristic failing in the same way across multiple screens, which raises severity.

**Example finding phrasing.**
> *The log-parse error state on `/upload` violates Nielsen #9 (help users recognize, diagnose, and recover from errors) `[nielsen-10]`. When parsing fails, the UI shows "Error: parse failed" with a red icon and no further context. The user cannot distinguish a corrupted file from an unsupported format from a network issue, and has no suggested recovery path. Fix: differentiate error categories in the parser response, show the specific failure reason in plain language, and offer contextual recovery ("Try re-exporting from HP Tuners with the verbose flag" for low-sample-rate failures).*

**Common misapplications.**
- Citing Nielsen as decoration. "This violates Nielsen #4" without saying *how* is worthless.
- Treating Nielsen as exhaustive. The 10 are broad but not complete — they don't cover performance (use Doherty), persuasion (use Cialdini), or ethics (use Brignull).

**See also:** #12 Shneiderman, #13 Norman, #7 Cognitive Load.

---

### 12. Shneiderman's 8 Golden Rules of Interface Design — `[shneiderman-8]` `heuristic-core`

**Origin.** Ben Shneiderman, 1987, *Designing the User Interface: Strategies for Effective Human-Computer Interaction*, first edition. The 8 rules have been refined across six editions, most recently with Plaisant, Cohen, Jacobs, Elmqvist, and Diakopoulos.

**What it says.** Eight principles that overlap with Nielsen's 10 but emphasize different aspects — notably expert efficiency, error handling, and internal locus of control.

1. **Strive for consistency.** Consistent sequences of actions for similar situations; identical terminology throughout.
2. **Seek universal usability.** Recognize the needs of diverse users — novices to experts, disabilities, technology variations.
3. **Offer informative feedback.** Every user action should produce system feedback, modest for minor actions and substantial for major ones.
4. **Design dialogs to yield closure.** Sequences of actions should have a beginning, middle, and end; informative feedback at the end gives satisfaction.
5. **Prevent errors.** Design so that users cannot make serious errors, and when they do, provide simple constructive recovery.
6. **Permit easy reversal of actions.** Relieve anxiety; encourage exploration.
7. **Keep users in control (internal locus of control).** Make users the initiators of actions rather than the responders.
8. **Reduce short-term memory load.** Keep displays simple; allow sufficient training time for action codes and sequences.

**Why it matters in audits.** Shneiderman's set is most useful as a complement to Nielsen's when the finding concerns power-user flow, error handling, or dialogue closure — the three areas where Shneiderman is more explicit than Nielsen. Rule 4 (design dialogs to yield closure) in particular has no direct Nielsen equivalent and is often the missing diagnosis when a flow "works" but feels unsatisfying.

**Audit trigger — check when:**
- A long task completes without any moment of acknowledgment or celebration (violation of closure, rule 4).
- The user cannot easily undo a non-destructive action (violation of reversal, rule 6).
- The product "talks to" the user via popups, modals, and interruptions rather than letting the user drive (violation of internal locus, rule 7).
- Expert shortcuts are absent or hidden so deeply that they are effectively novice-only (rule 2).

**Heuristic to apply.** Use Shneiderman alongside Nielsen as a cross-check. When a finding lands on Nielsen, check whether Shneiderman adds a sharper angle. Rules 4, 6, and 7 are the three most distinctive — always check those first.

**Example finding phrasing.**
> *The verified-report publishing flow violates Shneiderman Rule 4 (design dialogs to yield closure) `[shneiderman-8]`. After the report is published, the user is returned to the dashboard with no acknowledgment that the report succeeded beyond a small toast. There is no "You just published a verified report — here's the link, here's a preview, here's what to do next" closing screen. Closure moments build satisfaction and retention (per Peak-End Rule, #18). Fix: add a dedicated "Report Published" confirmation screen with copy-link, preview, and share options, and use it as the peak-end moment for the flow.*

**Common misapplications.**
- Using Shneiderman as a replacement for Nielsen rather than a complement. They were designed to overlap intentionally.
- Treating "internal locus of control" as "remove all notifications." Some notifications are informative feedback (rule 3), not loss of control.

**See also:** #11 Nielsen-10, #18 Peak-End Rule, #13 Norman.

---

### 13. Norman's Affordance & Signifier Theory — `[affordance]` `interaction`

**Origin.** Donald A. Norman, 1988, *The Psychology of Everyday Things* (later retitled *The Design of Everyday Things*). Norman adapted the term **affordance** from perceptual psychologist J. J. Gibson's 1977 "The Theory of Affordances." In later editions (1999 onward) and *Living with Complexity* (2010), Norman refined the framework by introducing the term **signifier** to distinguish *what the object affords* (a physical or functional possibility) from *what the object advertises* (a perceptual cue that tells the user it affords it).

**What it says.** An **affordance** is a relationship between an object and a user that permits an action — a door handle affords pulling; a flat plate affords pushing. Affordances are real properties, not perceptions. A **signifier** is a cue that communicates an affordance to the user — the horizontal bar on a "push" door, the shaped handle on a "pull" door. The distinction matters because **bad design is usually a signifier failure, not an affordance failure**: the object *could* be used correctly, but the signifier gives the wrong cue, and the user gets it wrong. In digital interfaces, every clickable element has an affordance (the click handler exists) but the signifier (cursor change, underline, raised appearance, hover state) is what the user perceives. A button that doesn't look clickable is a signifier failure; a button without a click handler is an affordance failure.

**Why it matters in audits.** This is the most reliable framework for finding "invisible" interaction bugs — elements that work if you happen to click them but don't signal that they are clickable. It also catches the inverse: decorative elements that *look* clickable but aren't, which violates user expectation and erodes trust in signifiers across the product.

**Audit trigger — check when:**
- An element is clickable but has no hover state, cursor change, underline, or raised appearance.
- An element looks clickable (styled like a button, underlined like a link) but is purely decorative.
- Drag handles exist but do not signify draggability (no grip icon, no cursor change).
- A card is clickable on the whole surface but only the title visually suggests the link.
- Disabled states are styled identically to enabled states except for a subtle opacity shift.

**Heuristic to apply.** For each screen, do two passes. **Signifier pass:** look at every element and ask "does this look clickable / draggable / typeable?" — note the answers. **Affordance pass:** tab through the page with keyboard and observe what is actually interactive. Any element where the two passes disagree is a finding. The inverse finding (decorative element signifying interactivity) is often worse than the direct one because it erodes the user's trust in all other signifiers on the page.

**Example finding phrasing.**
> *The analysis-findings cards on `/analysis/[id]` have an affordance-signifier mismatch `[affordance]`. Each card is clickable (expands to show rule details), but the card surface has no hover state, no cursor change, and no right-chevron signifier. Users who happen to click discover the expansion; users who don't, never see it. Fix: add `hover:bg-tbk-bg-subtle cursor-pointer` on the card, add a chevron-right icon that rotates on expand, and make the card role="button" with aria-expanded for keyboard and screen-reader discoverability.*

**Common misapplications.**
- Conflating affordance with signifier. Norman himself called this the most common misuse in practice. If the element *can* be clicked but doesn't *look* clickable, that's a signifier problem.
- Cargo-culting shadows and raised appearances. Material Design's "elevation" is a signifier convention, not an affordance — in a flat design system, other signifiers (color, underline, border) must do the same work.

**See also:** #11 Nielsen #6 (recognition rather than recall), #35 WCAG focus indicators, #17 Aesthetic-Usability.

---

### 14. Jakob's Law — `[jakobs]` `mental-model`

**Origin.** Jakob Nielsen, 2000, Nielsen Norman Group article "End of Web Design." Originally expressed as: "Users spend most of their time on other sites. This means that users prefer your site to work the same way as all the other sites they already know."

**What it says.** Users develop mental models of interface conventions based on the cumulative exposure to all other products they use, not just yours. When your product departs from convention, the user pays a re-learning cost that the product must earn back through some other benefit. Novelty is not inherently bad — sometimes the convention is genuinely wrong and a better pattern deserves to replace it — but novelty has a cost, and the cost is usually larger than designers estimate because they forget they are a biased sample (they know their product too well).

**Why it matters in audits.** Jakob's Law is the principle behind "use the standard pattern unless you have a specific reason not to." It is the law most relevant to patterns like navigation placement (top bar vs. side bar vs. hamburger), checkout flows, login forms, search behavior, keyboard shortcuts, and content-action chrome on common element types. It is also the principle behind Peer Comparison (a hardening rule of the audit workflow): *what does the convention in this category look like, and does the product comply unless deliberately diverging?*

**Audit trigger — check when:**
- The product inverts a common pattern (e.g., putting destructive actions on the left, placing the primary CTA top-left instead of bottom-right of a modal, using a hamburger on desktop).
- Search exists but does not behave like search: no typeahead, no keyboard shortcut (`/` or `⌘K`), no recent queries.
- Login/signup departs from the platform convention (e.g., two-factor before password instead of after).
- Keyboard shortcuts are custom without respecting platform norms (⌘+S saves vs. custom Alt+S).
- A standard gesture (swipe to dismiss, pull to refresh) is mapped to a non-standard action.

**Heuristic to apply.** For every major pattern in the product, ask: *what do the three peer references (from Phase 0 classification) do here?* If the product matches, no finding. If the product diverges, ask: *does the divergence earn its cost?* If yes, log it as a deliberate design decision (non-finding). If no or unclear, log as a Jakob's Law finding with the peer comparison as evidence.

**Example finding phrasing.**
> *The global search in the top bar violates Jakob's Law `[jakobs]`. HP Tuners desktop, DataZap, and Virtual Dyno all support `⌘K` as a universal search shortcut and show typeahead results on the first keystroke. The TBK Labs search requires the user to click into the field and type the full query before seeing any suggestions. Fix: add `⌘K` keyboard shortcut that focuses the search input, implement typeahead against logs/vehicles/clients with a 150ms debounce, and surface recent queries on first focus.*

**Common misapplications.**
- Using Jakob's Law to justify never innovating. The law says convention is a *default*, not a constraint — divergence is fine when it earns its cost.
- Applying Jakob's Law across product categories. A CRM should look like other CRMs, not like other B2C e-commerce sites.

**See also:** #13 Norman's Signifiers, #11 Nielsen #4 (consistency and standards), Phase 0 peer comparison (workflow).

---

### 15. Tesler's Law of Conservation of Complexity — `[tesler]` `system-design`

**Origin.** Larry Tesler, developed during his work at Xerox PARC and Apple in the late 1970s and 1980s. Also known as the "law of conservation of complexity." Tesler's formulation: "Every application must have an inherent amount of irreducible complexity. The only question is: who will have to deal with it?"

**What it says.** Every system — a product, a workflow, a UI — has a minimum amount of complexity that cannot be eliminated without changing what the system does. You can move the complexity around, but you cannot make it disappear. Specifically: every unit of complexity removed from the user interface lands on either (a) the engineers maintaining the system, (b) the server performing inference on the user's behalf, or (c) the user themselves in the form of extra steps or missing features. The designer's job is not to eliminate complexity but to *allocate* it deliberately, putting it where it does the least harm.

**Why it matters in audits.** Tesler's Law is the check on aggressive minimalism. When a finding recommends "remove this option," the follow-up question is *where does the complexity go?* If the answer is "onto the user," that's not a fix — it's a shift. Good Tesler fixes move complexity from the user to the engineer (e.g., "the user shouldn't pick between 12 timezone formats; detect it automatically server-side"). Bad Tesler fixes move complexity from the designer onto the user ("remove the timezone picker and let the user figure out their own display").

**Audit trigger — check when:**
- A "simple" onboarding flow hides steps that the user later has to perform anyway, in a harder place.
- A minimalist settings page lacks controls the user needs, forcing them to contact support.
- A feature was removed for "clarity" but workarounds multiplied in its place.
- A wizard auto-selects defaults that are wrong for a meaningful fraction of users, shifting complexity from the wizard to post-hoc correction.

**Heuristic to apply.** For every finding that recommends removal, name the destination of the complexity. If the destination is the server (automation, inference, smart defaults), the fix is good. If the destination is the engineer (more tests, more edge-case handling), the fix is acceptable if the engineer-cost is bounded. If the destination is the user (extra steps, missing features, undocumented expectations), the fix is *not* a fix — reframe the finding as an allocation question instead.

**Example finding phrasing.**
> *The vehicle-profile form omits turbo-specific fields (inducer size, outlet size, compressor map) to stay "clean" — a misallocation per Tesler's Law `[tesler]`. The complexity has been pushed onto the user, who must manually enter mod notes in a free-text field, and onto the analysis engine, which must guess turbo behavior from log data alone rather than from vehicle specs. Fix: re-introduce the turbo fields as an expandable "Advanced" section on the vehicle profile, populated by a catalog-backed picker (moving complexity from user to server — catalog lookup — and from guesswork to ground truth).*

**Common misapplications.**
- Invoking Tesler to justify bloat. The law does not say "add complexity freely." It says "allocate irreducible complexity deliberately."
- Ignoring that some complexity is genuinely reducible through a different approach entirely (e.g., eliminating a field by using a single-sign-on identity).

**See also:** #7 Cognitive Load, #11 Nielsen #8 (aesthetic and minimalist design), #2 Hick-Hyman.

---

### 16. Postel's Law Applied to UX — `[postel]` `robustness`

**Origin.** Jon Postel, 1980, RFC 761 / 793, specifying TCP: "Be conservative in what you send, be liberal in what you accept." Originally a principle of network protocol design; adopted into UX vocabulary by Nielsen, Norman, and others from the early 2000s onward.

**What it says.** Interfaces should accept a generous range of user input formats and normalize internally, while producing output in a strict, consistent format. Applied to forms: phone numbers with or without dashes, spaces, or country codes; dates in regional formats; email addresses with leading/trailing whitespace; case-insensitive usernames. Applied to search: typos, partial queries, synonyms, alternate spellings. Applied to file uploads: multiple formats accepted, internally converted. The design of the system should absorb user variability rather than punishing the user for it.

**Why it matters in audits.** Postel's Law is the principle behind most "forgiving input" findings. It is the lens that separates "the user typed it wrong" (user blame) from "the system was too strict" (design blame). The vast majority of validation errors are Postel violations — the input was perfectly meaningful, and the system refused it on a trivial technicality.

**Audit trigger — check when:**
- A phone number field rejects input with spaces, dashes, or `+` country-code prefixes.
- A date picker accepts only one format and errors on common regional variants.
- Email validation rejects leading/trailing whitespace instead of trimming it.
- Username matching is case-sensitive when the user community is not.
- File upload rejects near-format files that could be converted (e.g., accepting .xlsx but not .xls, accepting .csv but not .tsv, accepting .jpg but not .jpeg).
- Search rejects queries with typos when a fuzzy match would clearly recover.

**Heuristic to apply.** For every input field and every search surface, ask: *what is the minimum the user must get exactly right for the system to succeed?* Every unit of strictness above the true minimum is a Postel violation. The fix is almost always client-side normalization before validation — trim, lowercase, strip separators, infer format.

**Example finding phrasing.**
> *The log-upload file-type check violates Postel's Law `[postel]`. The parser accepts `.log` files but rejects `.csv` exports from DataZap even though DataZap's CSV format is structurally identical to `.log`. The user sees "Unsupported file format" with no recovery path. Fix: accept both extensions at upload, detect actual format by sniffing the first 128 bytes, and route to the correct parser. User-visible error only if the content itself is unreadable.*

**Common misapplications.**
- Using Postel to justify accepting dangerous input. "Be liberal" does not mean "skip security validation." Sanitization and normalization are different from trust.
- Inconsistent outputs as a side effect of liberal inputs. Postel's second half matters: normalize aggressively *and* produce strict output.

**See also:** #11 Nielsen #5 (error prevention), #11 Nielsen #9 (error recovery).

---

### 17. Aesthetic-Usability Effect — `[aesthetic-usability]` `perception`

**Origin.** Masaaki Kurosu and Kaori Kashimura, 1995, "Apparent usability vs. inherent usability," CHI '95 conference companion. Their experiment showed that users rated more visually pleasing ATM interfaces as more usable, even when objective usability was controlled. Later replicated and refined by Noam Tractinsky (1997, 2000) and extended by Lindgaard et al. (2006) showing the effect forms within 50 ms.

**What it says.** Users perceive aesthetically pleasing designs as more usable than less attractive designs, even when the underlying usability is objectively identical. The effect is immediate (formed within the first 50 ms of visual exposure), persistent (it biases subsequent judgments during the entire session), and forgiving (users will tolerate minor usability failures in beautiful products that they would not tolerate in ugly ones). The effect is not magic — it does not convert a broken product into a working one — but it provides a *margin of forgiveness* that allows a beautiful product to ship with a few edges rough.

**Why it matters in audits.** This is the principle that connects UI craft to UX outcomes. A finding that "the type system is inconsistent" or "the spacing scale is arbitrary" can be dismissed by engineering as cosmetic — the Aesthetic-Usability Effect is the citation that reframes it as a retention and trust issue. It is also the principle behind the decision to fix the top 5 visual issues before shipping a new feature: those fixes buy forgiveness for everything else.

**Audit trigger — check when:**
- The product has good IA and flow but users report it "feels clunky" or "feels cheap."
- Visual craft is inconsistent within a single surface (mixed type hierarchies, mismatched spacing, inconsistent button styles).
- Major brand surfaces (landing page, pricing, login) are polished but authenticated surfaces drop in craft.
- The product compares poorly to peer references on pure visual craft, independent of feature parity.

**Heuristic to apply.** Do two walkthroughs of the primary surfaces. **First pass:** note your gut reaction in the first 2 seconds of each screen — beautiful, neutral, or ugly. **Second pass:** identify the top 3 visual craft issues per screen (type, color, spacing, alignment, state design). The first-pass ugly screens are where the Aesthetic-Usability margin is negative — users will judge those screens as *less* usable than they truly are, and every interaction there will be harder than it should be. Fixing the top 3 craft issues per ugly screen typically moves the screen from "ugly" to "neutral" and recovers the forgiveness margin.

**Example finding phrasing.**
> *The `/settings` page exhibits a negative Aesthetic-Usability margin `[aesthetic-usability]`. First-impression gut check: cluttered, mixed type weights, three different form field heights, inconsistent button alignment. Users coming from the polished `/dashboard` hit a visual cliff. Per Kurosu-Kashimura, this cliff causes users to rate the settings flow as harder than it actually is, measurably reducing completion of profile setup. Fix: rebuild the settings page against the meta-design dimensions 1–4 (type, color, grid, tokens) before worrying about any functional improvement.*

**Common misapplications.**
- Using Aesthetic-Usability as a shield against fixing real usability problems. It buys margin, not immunity.
- Equating "aesthetic" with "minimalist." A dense, information-rich interface can be beautiful (Bloomberg terminal); a sparse, empty interface can be ugly (a poorly designed empty state).

**See also:** #18 Peak-End Rule, #31 Bringhurst, #32 Müller-Brockmann.

---

### 18. Peak-End Rule — `[peak-end]` `memory-experience`

**Origin.** Daniel Kahneman, Barbara L. Fredrickson, Charles A. Schreiber, and Donald A. Redelmeier, 1993, "When more pain is preferred to less: Adding a better end," *Psychological Science*, 4(6), 401–405. Refined in Kahneman's 2011 *Thinking, Fast and Slow* as part of the "remembering self vs experiencing self" distinction.

**What it says.** People do not remember experiences as an integral of their duration and intensity. They remember them by two moments: the **peak** (the most intense point, positive or negative) and the **end**. The average of those two moments dominates the remembered assessment. An experience that is long and mostly good but ends badly is remembered worse than a shorter experience that was moderate throughout and ended well. Duration itself has almost no effect on remembered quality — Kahneman's term for this is "duration neglect."

**Why it matters in audits.** Peak-End Rule changes which moments of a product you should obsess over. You should spend disproportionate design effort on:
1. The moment of first success (the activation peak).
2. The moment of task completion (the end).
3. The moment of failure recovery (a potential negative peak that, if handled well, becomes a neutral).
4. The cancellation flow (the literal end of the product relationship).
5. The checkout or billing confirmation (the end of a commercial interaction).

Screens in the middle of a flow — that are visited often but are neither peak nor end — deserve less polish. This is counterintuitive because those screens get the most traffic. Peak-End says traffic is not the metric; remembered quality is.

**Audit trigger — check when:**
- The product has no identifiable "first success" moment — just a flat ramp from empty state to routine use.
- Task completion is acknowledged with a 2-second toast and nothing else.
- Error recovery is functional but bleak (no apology, no reassurance, no celebration of recovery).
- The cancellation flow is more polished than the signup flow (wrong priority — the end matters, but the end of the *relationship* matters less than the end of each *session* if the user returns).
- The billing confirmation screen is a receipt, not a celebration.

**Heuristic to apply.** Map the primary task flows. For each, identify the peak (the moment the user gets the value they came for) and the end (the moment the task concludes). Rate the emotional design of those two moments. If they are under-designed relative to the middle, reallocate design effort.

**Example finding phrasing.**
> *The verified-report publish flow under-invests in its peak and end per the Peak-End Rule `[peak-end]`. The peak moment — when the user sees their verified report for the first time — is a plain redirect to the report page with no reveal, no "Your report is ready ✓" celebration, and no explanation of what the hash verification means. The end moment — closing the flow — is a passive return to the dashboard. Fix: insert a dedicated reveal screen with a progress-to-completion animation (ties to Goal-Gradient, #9), a celebratory headline, a copy-link affordance, a share preview, and next-action prompts ("Post to your shop's site," "Send to your client"). This is the memory the user will keep of the entire product.*

**Common misapplications.**
- Applying Peak-End to every screen. The rule is specifically about moments that bookend experiences, not all moments.
- Confusing peak-end design with fake positivity. A peak that the user doesn't actually care about (confetti on a routine action) generates annoyance, not memory.

**See also:** #9 Goal-Gradient, #11 Nielsen #1 (visibility of system status), #19 Fogg Behavior Model.

---

# Part 3 — Behavioral Economics & Persuasion

---

### 19. Fogg Behavior Model (B = MAP) — `[fogg]` `behavior-change`

**Origin.** B. J. Fogg, Stanford Persuasive Technology Lab, 2009, "A behavior model for persuasive design," Persuasive '09. Originally formulated as B = MAT (Motivation, Ability, Trigger); renamed to B = MAP (Prompt) in Fogg's 2019 *Tiny Habits* to emphasize that "trigger" was being confused with aversive connotations in the wild.

**What it says.** A behavior (B) occurs when three factors converge at the same moment: **Motivation** (the user wants to do it), **Ability** (the user can do it easily enough), and a **Prompt** (something tells them to do it now). All three are necessary; any one missing kills the behavior. The model's power is that it identifies the specific cause of each failed behavior: *low motivation* (the user doesn't want to), *low ability* (the task is too hard or the friction is too high), or *missing prompt* (the user would want to but didn't know now was the time). Each cause has a different remedy.

Fogg also articulated the **ability-motivation tradeoff**: when motivation is low, you must make the behavior trivially easy; when motivation is high, the user will tolerate friction. The worst product state is low motivation plus high friction — nothing will happen there. The best leverage is often *increasing ability* (reducing friction), because it is usually cheaper than increasing motivation.

**Why it matters in audits.** Fogg is the diagnostic framework for "why don't users do X?" Every behavior the product wants and isn't getting is a failure of M, A, P, or some combination. The audit question for each unwanted gap: *which of the three is broken?*

**Audit trigger — check when:**
- A feature exists and is discoverable but has low engagement — check Motivation (do users actually want this?) and Prompt (does anything tell them to use it at the right moment?).
- A task is started but abandoned — check Ability (too many steps, too much friction, too much uncertainty).
- A user re-engagement pattern (re-upload, re-analysis) is absent — check Prompt (email, dashboard reminder, notification).
- Users who have strong motivation (paying customers asking support for a feature) still don't use the feature — check Ability or Prompt.

**Heuristic to apply.** For each desired behavior, score M, A, P from 1 to 5. Identify the weakest axis. Design the fix against that axis first. If A is the weakness, the fix is usually an ability increase (reduce steps, add defaults, increase discoverability). If P is the weakness, add a prompt at the right time (not always — wrong-time prompts are worse than no prompts). If M is the weakness, reconsider whether this feature should exist at all, or reframe it in JTBD terms (#25) to match a job the user actually cares about.

**Example finding phrasing.**
> *The "Compare two logs" feature has low engagement per Fogg Model `[fogg]` analysis. Motivation is high (users explicitly ask for comparison in support tickets). Ability is low (the feature is hidden behind a `/compare` route not in the sidebar, requires URL parameters, and produces underwhelming output — see Finding 1 in the dogfood audit). Prompt is entirely missing (no dashboard surface, no post-analysis CTA, no email). Fix order by leverage: first increase Ability (surface the feature in analysis page as "Compare with previous log" button, fix the diff logic), then add a Prompt after each successful analysis ("We noticed this is your 2nd log for this vehicle — want to see what changed?").*

**Common misapplications.**
- Treating "low motivation" as a permanent verdict. Motivation can be built through demonstrated value — the first success (see Peak-End, #18) often converts low to high.
- Using Fogg to justify manipulation. The model is a diagnostic tool; it does not license dark patterns. See #36.

**See also:** #9 Goal-Gradient, #10 Zeigarnik, #36 Dark Patterns.

---

### 20. Cialdini's Seven Principles of Influence — `[cialdini]` `persuasion`

**Origin.** Robert B. Cialdini, 1984, *Influence: The Psychology of Persuasion*. Originally six principles; Cialdini added the seventh, **Unity**, in his 2016 *Pre-Suasion*.

**What it says.** Seven principles describe the most reliable ways to legitimately influence decisions. Each has a specific psychological mechanism, a specific UI manifestation, and specific ethical limits.

1. **Reciprocity.** People feel obligated to return favors. In product: free trials, free value given before the ask, generous default states.
2. **Commitment and Consistency.** People want to act consistently with their prior commitments. In product: micro-commitments early in a flow that the user later honors (saving a preference, creating a profile, naming a project).
3. **Social Proof.** People look to what others are doing to guide their own behavior. In product: "X customers use this feature," user counts, testimonials, recent activity feeds.
4. **Authority.** People defer to credible experts. In product: expert endorsements, certifications, credentialed testimonials, published research citations.
5. **Liking.** People are more influenced by people and brands they like. In product: relatable copy, genuine voice, human faces, shared identity with the target user.
6. **Scarcity.** People value things more when they are rare. In product: limited-time offers, low-stock indicators, cohort-based launches — all of which are legitimate *only when genuine*.
7. **Unity.** People are more influenced by those they identify with as part of a shared identity. In product: "for developers, by developers," community language, in-group signaling.

**Why it matters in audits.** Cialdini is the framework for auditing any conversion surface — signup, pricing, upgrade flows, feature adoption prompts. Every persuasion surface should be checked against the seven for two things: (a) are the legitimate principles deployed where they naturally fit? (b) are any of the principles deployed deceptively — fake scarcity, fabricated social proof, hollow authority? Deceptive deployment is a dark pattern (#36).

**Audit trigger — check when:**
- A pricing page has no social proof (user counts, testimonials, logos of customers).
- A signup flow asks for payment before any reciprocal value has been given.
- Authority signals are absent on a product where expertise is a buying criterion (legal, medical, financial, automotive safety).
- Scarcity cues are present but not backed by real scarcity ("Only 3 left!" on an unlimited digital product).
- The product has a strong in-group identity it does not exploit — unity left on the table.

**Heuristic to apply.** Walk through every conversion surface with the seven in a checklist. For each, ask: *deployed / absent / deceptively deployed.* Absent principles on the right surfaces are legitimate improvement opportunities. Deceptive deployments are P0 findings (ethics). Overdeployed principles (every surface screaming scarcity) are equally problematic — they erode trust in the principles across the product.

**Example finding phrasing.**
> *The `/pricing` page underuses Social Proof and Authority per Cialdini `[cialdini]`. The page lists plan features and prices but carries no customer count ("12,000+ tuners trust TBK Labs"), no testimonials from named professional tuners, and no authority signals (third-party verification, published case studies, expert endorsements). These are legitimate persuasion surfaces that are currently empty. Fix: add a social-proof strip below the hero (user count, four representative logos, one-line quote from a recognizable tuner), and an authority strip above the CTA (certification badge, published research citation, professional association membership). Check strictly that all claims are genuine — fabricated numbers are a dark pattern (#36).*

**Common misapplications.**
- Using Cialdini to justify any persuasion tactic. Cialdini's book explicitly distinguishes "legitimate influence" from "compliance weapons" — the latter is manipulation.
- Over-deploying a single principle across every screen. Scarcity on every offer stops working as scarcity.

**See also:** #21 Prospect Theory, #36 Dark Patterns, #11 Nielsen #2 (match between system and real world).

---

### 21. Prospect Theory & Loss Aversion — `[prospect]` `decision-making`

**Origin.** Daniel Kahneman and Amos Tversky, 1979, "Prospect theory: An analysis of decision under risk," *Econometrica*, 47(2), 263–291. Foundational paper of behavioral economics; Kahneman received the 2002 Nobel Prize in Economics for this and related work (Tversky had died in 1996; Nobel Prizes are not awarded posthumously).

**What it says.** People evaluate gains and losses relative to a reference point, not in absolute terms, and they experience losses roughly twice as strongly as equivalent gains (the "loss aversion" coefficient is typically estimated at 2.0–2.5). A $100 gain delivers about half the emotional impact of a $100 loss. Consequently, people are risk-averse for potential gains (they prefer a sure $50 over a 50% shot at $100) and risk-seeking for potential losses (they prefer a 50% shot at losing $100 over a sure loss of $50). This asymmetry is not economic irrationality — it is a stable feature of human cognition and should be designed around, not against.

**Why it matters in audits.** Loss aversion is the most actionable behavioral-econ finding in product work. Framing a proposal as "don't lose X" is roughly twice as persuasive as framing it as "gain X." This applies to upgrade flows, cancellation retention, feature adoption, and any risk-based decision. It also explains why users are so reluctant to delete drafts, abandon in-progress tasks, or cancel subscriptions — the framing is a loss, and losses are twice the weight of the equivalent gain from doing so.

**Audit trigger — check when:**
- Upgrade CTAs are framed as "Gain access to X" rather than "Don't lose access to X" (when the user is already getting limited access on a trial).
- Cancellation flows fail to enumerate what the user will lose (vehicles, logs, shared reports, team members).
- Feature adoption prompts emphasize the gain without acknowledging the risk of not adopting.
- Free-tier limits are presented as "What you get" rather than "What you'll miss."
- Referral programs frame the upside ("earn $10") without the downside ("your friend is missing out").

**Heuristic to apply.** For every high-stakes decision surface, write out the decision in two framings — gain-framed and loss-framed — and pick the loss-framed version if the framing would be honest. *Honest* is the key qualifier: loss-aversion framing is legitimate when the loss is real. When the loss is manufactured ("If you don't upgrade, you'll lose the chance to ever upgrade again" — untrue scarcity), it's a dark pattern.

**Example finding phrasing.**
> *The trial-expiry warning email is gain-framed per Prospect Theory `[prospect]`. The current copy reads "Upgrade now to keep unlimited uploads" — emphasizing the gain. Loss-framed rewording: "Your 14-day trial ends tomorrow. You'll lose access to unlimited uploads and the 23 logs you've already saved will become read-only." This is honest (the loss is real) and roughly 2× more persuasive per Kahneman-Tversky loss-aversion coefficient.*

**Common misapplications.**
- Inventing losses that aren't real. Dark pattern.
- Using prospect theory to scare users about a trivial loss. The framing has to match the actual stakes.

**See also:** #20 Cialdini, #22 Anchoring, #36 Dark Patterns.

---

### 22. Anchoring Effect — `[anchor]` `decision-making`

**Origin.** Amos Tversky and Daniel Kahneman, 1974, "Judgment under uncertainty: Heuristics and biases," *Science*, 185, 1124–1131. One of the most replicated effects in behavioral psychology; the anchor does not need to be relevant or even meaningful to influence judgment.

**What it says.** When forming an estimate or making a decision under uncertainty, people's judgments are pulled toward whatever reference number or comparison they have most recently encountered. The anchor can be completely arbitrary — Kahneman's classic experiment anchored judgments to a wheel-of-fortune spin unrelated to the question — and still exerts measurable influence. Anchoring is especially strong for pricing: the first price a user sees on a page becomes the reference point for every subsequent price, and the perceived value of the cheaper options is set by the anchor.

**Why it matters in audits.** Anchoring is the principle behind three-tier pricing, "strikethrough" prices, "most popular" plans, and product-comparison layouts. It is also why the order in which features are listed matters — the first feature sets the category for everything below it. The audit question: *what anchors is the product setting (deliberately or accidentally), and are they working in the product's favor?*

**Audit trigger — check when:**
- A pricing page puts the cheapest plan on the left, anchoring users to low expectations.
- A feature list leads with a minor feature, anchoring the user's sense of scope to something small.
- An upgrade upsell mentions the free tier before the paid tier, anchoring comparison against free.
- A time estimate for a task is given too optimistically, anchoring user expectations low and creating disappointment.
- A numerical input field has no placeholder or default, missing a chance to anchor the user's input in a reasonable range.

**Heuristic to apply.** Identify every surface where the user is forming a numerical or comparative judgment. For each, identify the first reference point the user will encounter. Ask: *is this reference point working for the product or against it?* If against, reorder. If the surface has no anchor and should, add one.

**Example finding phrasing.**
> *The pricing page ordering works against Prospect Theory + Anchoring `[anchor]`. Plans are ordered Free · Pro · Tuner Pro left-to-right (low to high). The user anchors on $0, which makes Pro feel expensive and Tuner Pro feel absurd. Standard anchoring fix: lead with Tuner Pro (highest), then Pro as the relatively-affordable middle, then Free as the "limited" bottom. Combine with Serial Position (#5) by placing the conversion target (Pro) in position 2 with a "Most Popular" visual break (Von Restorff, #6). This single reordering typically shifts plan mix by 5–15% toward higher-ARPU plans.*

**Common misapplications.**
- Anchoring so aggressively that the anchor itself loses credibility. A $10,000 plan anchoring a $99 plan works; a $10,000,000 plan just looks like a typo.
- Ignoring that anchors decay over session — the first anchor is strong, but returning users bring their own reference points.

**See also:** #5 Serial Position, #21 Prospect Theory, #20 Cialdini (scarcity).

---

### 23. Default Bias / Status Quo Bias — `[default]` `decision-making`

**Origin.** Status-quo bias: William Samuelson and Richard Zeckhauser, 1988, "Status quo bias in decision making," *Journal of Risk and Uncertainty*, 1(1), 7–59. Default bias as a policy tool: Richard Thaler and Cass Sunstein, 2008, *Nudge*. The organ donor comparison between opt-in and opt-out countries (Johnson & Goldstein, 2003, *Science*) is the canonical case — opt-out countries have donor rates of ~85–99%, opt-in countries ~4–27%, with no difference in underlying willingness.

**What it says.** When people face a decision with a default option, they stick with the default far more often than objective analysis of the choice would predict. The effect operates through three mechanisms: (a) the default is perceived as the "recommended" choice by the presenter, (b) changing the default requires an explicit action that triggers loss aversion, and (c) the default is cognitively cheaper, so it wins on cognitive-load grounds alone. Defaults are among the most powerful design choices available — sometimes *the* most powerful — and they carry an ethical weight because they are not "neutral," no matter how much designers want them to be.

**Why it matters in audits.** Defaults are everywhere in a product: checkbox states, form pre-fills, notification preferences, privacy settings, onboarding selections, plan recommendations. Every default is a behavioral nudge. The audit question: *is each default aligned with the user's interest, or with the product's short-term metrics?* When the two align (user benefits from the default the product would also choose), defaults are pure wins. When they diverge (the product's preferred default would harm the user), the default is a dark pattern.

**Audit trigger — check when:**
- Notification preferences default to "all on" without the user asking.
- Privacy settings default to the least-private option.
- Auto-renewal defaults to on without clear acknowledgment during signup.
- A marketing-consent checkbox is pre-checked.
- A paid add-on is pre-selected during checkout ("bundle savings" pre-applied).
- A useful feature is off by default because the designer was afraid to choose for the user, leaving the user to never turn it on.

**Heuristic to apply.** Enumerate every default decision the product makes on the user's behalf. For each, evaluate: *does this default benefit the user, the product, both, or neither?* Both-benefit defaults are ideal. User-benefit defaults are legitimate. Product-only defaults at user expense are dark patterns. Neither-benefit defaults are timid engineering and should be replaced with an actively-chosen default.

**Example finding phrasing.**
> *The vehicle-profile form leaves all unit-preference fields blank by default, a weak-default finding per Status Quo Bias `[default]`. Users are shown empty dropdowns for pressure (PSI vs kPa vs bar), temperature (F vs C), and torque (lb-ft vs Nm). The designer's reluctance to choose for the user creates three low-leverage decision points per vehicle. Fix: default to the units implied by the user's country (detected from browser locale or IP) with a single "Change unit preferences" surface under settings. This is a both-benefit default: users get a sensible starting state, and the product gets higher completion rates on vehicle setup.*

**Common misapplications.**
- Treating defaults as neutral. There is no such thing as a neutral default — every default is a choice.
- Using defaults to force behaviors the user actively rejects in a clearly-expressed preference. That's manipulation, not persuasion.

**See also:** #20 Cialdini (commitment), #36 Dark Patterns, #11 Nielsen #6 (recognition rather than recall).

---

### 24. Hyperbolic Discounting — `[hyperbolic]` `decision-making`

**Origin.** George Ainslie, 1975, "Specious reward: A behavioral theory of impulsiveness and impulse control," *Psychological Bulletin*. Refined by Laibson (1997) in economics with the β-δ ("quasi-hyperbolic") formulation.

**What it says.** People discount future rewards at a rate that is not exponential (as classical economics assumes) but hyperbolic — steeper in the near term and flatter in the long term. The practical consequence is a present bias: immediate rewards are valued disproportionately over delayed rewards, and people will frequently make inconsistent choices over time (preferring $100 now to $110 tomorrow, but preferring $110 in 31 days to $100 in 30 days — the same 1-day wait is valued differently depending on whether it is near or far). This is the formal basis of procrastination, impulsive purchases, and the difficulty of saving for retirement.

**Why it matters in audits.** Hyperbolic discounting explains why immediate-value moments matter so much more than delayed-value promises. "You'll love this feature once you finish setting it up" is a hyperbolic loser: the delay kills the perceived value. "Here's your first insight in 10 seconds" is a hyperbolic winner. The audit question: *does the product deliver value quickly enough that the hyperbolic discount doesn't kill it?*

**Audit trigger — check when:**
- Onboarding requires extensive setup before any value is delivered (the value is "waiting behind a door").
- A feature's benefit compounds over weeks but no short-term reward is visible.
- Free trial terms require the user to believe they will get value "eventually" rather than showing first-value on day 1.
- Retention features (badges, streaks, long-term reports) have no immediate hook to get the user started.

**Heuristic to apply.** Time-to-first-value is the single most important number a product can measure through a hyperbolic-discounting lens. Estimate or measure it for the primary use case. If it's under 60 seconds, the product is well-aligned with hyperbolic discounting. If it's 60 seconds to 5 minutes, it's marginal and needs strong anticipatory cues ("one more step, then your first insight"). Beyond 5 minutes, the product is fighting hyperbolic discounting and will bleed new users.

**Example finding phrasing.**
> *The TBK Labs onboarding has a time-to-first-value of ~4 minutes, too long for hyperbolic discounting comfort `[hyperbolic]`. A new user must: register, verify email, pick plan, add vehicle (7 fields), upload log (30–60 s wait), wait for analysis (3–8 s), then finally see a finding. By the vehicle-profile step, many new users abandon because the promised value is too far in the future. Fix: invert the flow — let the user upload a log immediately from the landing page, run analysis against a stub vehicle profile, show the first real finding in under 60 seconds, then prompt to create a full account to save the analysis. This is the "wow before the paywall" pattern used by Figma, Typeform, and Linear.*

**Common misapplications.**
- Confusing hyperbolic discounting with laziness. Users are not lazy; they are behaving rationally given a documented cognitive discount rate.
- Using hyperbolic thinking to justify infinite shortcuts. Some tasks genuinely require setup; the answer is to make the setup itself deliver incremental value, not to skip it.

**See also:** #19 Fogg (ability axis), #9 Goal-Gradient, #18 Peak-End.

---

# Part 4 — Product Strategy Frameworks

---

### 25. Jobs-to-be-Done — `[jtbd]` `product-strategy`

**Origin.** Theodore Levitt's 1960 "people don't want a quarter-inch drill, they want a quarter-inch hole" is the foundational intuition. Formalized as a product-strategy framework by Clayton Christensen (most directly in the 2003 *The Innovator's Solution*, chapter 3), and operationalized for product work by Tony Ulwick (2005, *What Customers Want*). Bob Moesta and Chris Spiek developed the "switch interview" method in the late 2000s that made JTBD actionable in practice.

**What it says.** Customers do not buy products — they "hire" products to do a specific job. The job is the progress the customer is trying to make in a specific circumstance, with functional, emotional, and social dimensions. The job is stable over time; the products hired to do it are not. The framework's actionable core: *when you understand the job your product is hired for, you understand which features matter (they advance the job) and which don't (they decorate the product without advancing anything).*

Crucially, JTBD reframes "missing features" findings. A competitor has Feature X; the audit says "we're missing Feature X." JTBD forces the question: *what job does Feature X do, and is that job one we are hired for?* If yes, we should deliver it (possibly in a different form). If no, copying Feature X is cargo-culting and will cost us cohesion without benefit.

**Why it matters in audits.** JTBD is the lens that turns a product-UX audit from a checklist ("missing this, missing that") into a strategic document ("missing these because they advance the core job; deliberately not building these because they belong to a different job"). It forces Phase 0 classification to be specific: *what job is this product hired for, concretely, by what kind of user, in what circumstance?*

**Audit trigger — check when:**
- The audit is producing "missing feature" findings without a framework for which missing features matter.
- The product's feature set shows drift across multiple jobs (doing three jobs badly instead of one well).
- User research is in user language ("I want a button for X") rather than job language ("I am trying to accomplish X in order to Y").
- Onboarding does not reflect the job. A vehicle-tuning product with onboarding that asks "what is your goal?" and then doesn't map the answer to subsequent UI is failing at the job level.
- The product's marketing copy names features instead of jobs. "We have real-time log analysis" is a feature. "Get diagnostic answers on your car's latest tune in under a minute" is a job.

**Heuristic to apply.** Before producing findings, write out the top three jobs the product is hired for, in this format: *When [situation], I want to [motivation], so I can [expected outcome]*. For each finding the audit produces, map it to one or more jobs. Findings that don't map to any job are candidates for deletion — they are distracting the product from its hires. Findings that map to multiple jobs are high-leverage.

**Example finding phrasing.**
> *Using JTBD `[jtbd]` to reframe the TBK Labs audit: the product is hired for three jobs. **Job 1 (driver):** "When I've just installed a new mod or tune, I want to know if it worked without guessing, so I can decide whether to keep it, tweak it, or roll back." **Job 2 (tuner):** "When I've tuned a client's car, I want to produce evidence the tune is safe and effective, so I can show the client, charge confidently, and protect myself from liability." **Job 3 (buyer):** "When I'm buying a modified car, I want to know if it was tuned correctly and what its current health is, so I can pay a fair price and avoid a lemon." The compare-tool finding (Finding 1 of the dogfood audit) maps to Job 1 strongly. The white-label finding (Finding 2) maps to Job 2 strongly. The verified-report missing from nav (Finding 8) maps to Job 3 strongly. All three are P0 because they each sit on a core job. Findings that would be P0 for a different product — "add real-time data streaming" — do not map to any of these jobs and are deliberately out of scope.*

**Common misapplications.**
- Writing jobs in product language ("the user wants to use our analysis engine"). That's a feature, not a job.
- Inventing jobs to justify features you've already built.
- Treating one job as the only job. Most products do 2–4 jobs; mature products do 5–8.

**See also:** #26 Kano, Phase 0 product classification (workflow).

---

### 26. Kano Model — `[kano]` `product-strategy`

**Origin.** Noriaki Kano, Nobuhiko Seraku, Fumio Takahashi, and Shinichi Tsuji, 1984, "Attractive Quality and Must-Be Quality," *Journal of the Japanese Society for Quality Control*. Foundational model in Japanese quality management; imported into software product work through the 1990s–2000s.

**What it says.** Product features fall into three primary categories (plus two minor ones), each with a different satisfaction curve.

- **Basic / Must-be features.** Their presence does not increase satisfaction, but their absence causes strong dissatisfaction. (Hotel: a clean room.) These are the ante. Failing on them disqualifies the product.
- **Performance / One-dimensional features.** Satisfaction rises linearly with the quality of the feature. (Hotel: the room's size.) More is better; less is worse.
- **Excitement / Attractive features.** Their absence causes no dissatisfaction (users do not miss them) but their presence generates disproportionate delight. (Hotel: a handwritten note welcoming you by name.) These are differentiators.
- **Indifferent features.** No effect on satisfaction in either direction. (Hotel: the color of the interior paint, for most guests.) Candidates for removal.
- **Reverse features.** Their presence actively decreases satisfaction. (Hotel: aggressive upselling at check-in.) Must be removed.

Features also migrate over time: excitement features become performance features become basic features as the market catches up. A smartphone camera was excitement in 2007, performance in 2012, basic in 2020.

**Why it matters in audits.** Kano forces a severity calibration that pure Nielsen-style heuristics can't provide. A Must-Be failure is *always* a P0 regardless of how "small" it looks — missing from the audit's dashboard but devastating to the user. An Attractive feature is *never* a P0 — it's a differentiator. Performance gaps are graded by degree. And Indifferent or Reverse features are findings by *removal*, not addition.

**Audit trigger — check when:**
- The audit has flagged features as P0 or P1 without asking what Kano category they occupy.
- The product has many Attractive features but is failing on Must-Be. Common in demo-driven companies.
- The product has no Attractive features at all — it is on par with competitors on performance features and will be beaten by whoever adds one.
- Features that were once Attractive are aging into Performance/Basic but the product hasn't updated its prioritization.

**Heuristic to apply.** For each of the audit's findings, classify the underlying feature as Must-Be, Performance, Attractive, Indifferent, or Reverse. Must-Be failures are automatically P0. Performance failures are graded by the magnitude of the gap (1-5 step). Attractive opportunities are never P0 but are high-leverage P1s. Indifferent features are removal candidates. Reverse features are immediate removal P0s.

**Example finding phrasing.**
> *Applying Kano `[kano]` to the dogfood audit: the white-label-not-applied finding (Finding 2) is a **Must-Be** failure for the Job-2 tuner audience — tuner_pro customers bought it *specifically* for branding, so its absence is disqualifying. Automatic P0. The compare-tool-doesn't-diff finding (Finding 1) is **Performance** — users expect comparison, they use comparison, and the quality of comparison linearly affects satisfaction. The aiSummary-not-populated finding (Finding 3) is a migrated **Attractive**-to-**Performance** feature: AI summaries were Attractive in 2023, are Performance in 2026. P0 because they are degraded into non-delivery. None of the audit's findings fall into Indifferent or Reverse. If they did, the remediation would be deletion, not improvement.*

**Common misapplications.**
- Treating "Attractive" as "not important." Attractive features are the product's differentiation from commodity peers; losing them means becoming a commodity.
- Failing to revisit classifications over time. Features migrate.

**See also:** #25 JTBD, #20 Cialdini, Phase 0 workflow classification.

---

### 27. Pareto Principle (applied to feature surfacing) — `[pareto]` `product-strategy`

**Origin.** Vilfredo Pareto, 1896 economic observation in Italy that ~80% of land was owned by ~20% of the population; generalized by Joseph Juran in the 1940s into the "vital few vs trivial many" management principle. Applied to software usage by numerous studies showing similar 80/20 distributions of feature usage.

**What it says.** In most products, roughly 80% of usage is concentrated in roughly 20% of the features. The exact ratio varies — some products see 90/10, some 70/30 — but the long-tail distribution is remarkably consistent across domains. The actionable consequence: *the surface area a feature gets should be proportional to its usage and its strategic importance, not to its engineering cost or its internal advocate's volume.*

Most products have the proportion inverted. Features built early get prime real estate that their usage no longer justifies. Features built in a sprint of political momentum for a single customer occupy navigation slots while core features hide in submenus.

**Why it matters in audits.** Pareto is the framework for the "why is X buried?" and "why is Y prominent?" questions. It turns a navigation audit into a usage-weighted question. If the product has usage telemetry, the audit can be literal: rank features by usage, compare to surface-area prominence, flag divergences. If there is no telemetry, the auditor estimates and flags the top-N and bottom-N suspected features for explicit re-evaluation.

**Audit trigger — check when:**
- Legacy features occupy top-level navigation slots while recently-added core features live in settings.
- Usage telemetry (if available) shows a sharp head with a long tail, but the UI does not reflect that head.
- Multiple features compete for primary CTA status on the same screen (Von Restorff violation, #6, often with a Pareto cause).
- The product has a "second drawer" of infrequently used features that are exposed as equals to the top-5.

**Heuristic to apply.** If usage data is available, rank features by weekly active usage and plot them. If not, estimate. Compare the top-20% vs bottom-80% against the navigation, the dashboard, and the primary CTAs. The top 20% should own the top 80% of real estate. Where they don't, redistribute.

**Example finding phrasing.**
> *TBK Labs navigation shows a Pareto inversion `[pareto]`. Based on the absence of usage telemetry and rough heuristic estimation, the top-3 features by usage are (1) Upload Log, (2) View Analysis, (3) Recent Dashboard. These occupy 1, 0, and 1 top-level nav slots respectively. Meanwhile, legacy/rarely-used features like "Mod Path" and "Tuner Financials" occupy top-level slots equal to core features. Fix: audit with actual usage data; restructure top-level nav into a 5-item main set (Upload · Dashboard · Analyses · Vehicles · Share) with everything else under a collapsible "More" or settings surface.*

**Common misapplications.**
- Aggressive cutting of the long tail. Long-tail features serve expert users and create depth; the Pareto lesson is *surface allocation*, not feature deletion.
- Measuring usage without measuring strategic importance. A feature used by 1% of users but paid for by 40% of revenue is not a long-tail feature.

**See also:** #2 Hick-Hyman, #6 Von Restorff, #25 JTBD.

---

# Part 5 — Information Architecture & Wayfinding

---

### 28. Information Foraging Theory — `[foraging]` `navigation`

**Origin.** Peter Pirolli and Stuart Card, 1995–1999, at Xerox PARC. Formalized in the 1999 *Psychological Review* paper "Information foraging" and extended in Pirolli's 2007 *Information Foraging Theory: Adaptive Interaction with Information*. The theory adapts optimal foraging models from behavioral ecology (how animals decide when to stay in a food patch vs. move to a new one) to human search for information.

**What it says.** Users searching for information behave like predators foraging for prey. They follow **information scent** — the cues in a link, preview, or search result that suggest how likely the target is to contain what they want. They stay in an information "patch" (a page, a search result set, a menu) as long as the scent remains strong, and they leave when the scent weakens faster than the expected payoff justifies. The theory makes testable predictions: high-scent links get clicked more often; low-scent links are skipped even when they lead to the right content; users are bad at evaluating scent when labels are ambiguous, and they give up quickly when scent is weak across multiple links in a row.

The practical levers: label clarity, preview quality (snippets, thumbnails, metadata), scannability, and the order of results — all of which either reinforce or weaken scent.

**Why it matters in audits.** Foraging theory is the framework behind every "users can't find X" finding. It reframes the problem from "the user is lost" to "the product is not giving off scent for X." The fix is usually not to move X to a new location but to *improve the scent* — better labels, better previews, better search results — so that the user's existing foraging behavior leads them to it.

**Audit trigger — check when:**
- A feature exists and is in a reasonable location but users cannot find it in user testing.
- Link labels are vague ("Click here," "More," "Settings," "Details") — all are scent-free.
- Search results show only titles, no snippets or metadata.
- Menu items are ordered alphabetically when they should be ordered by frequency or relevance.
- Breadcrumbs are missing or do not show scent (just "Home > Settings > Preferences").

**Heuristic to apply.** For every important destination, walk the scent trail from a typical starting point (dashboard, homepage, search) to the destination. At each step, ask: *does this label, preview, or cue tell the user they are getting closer to what they want?* Any step with weak or ambiguous scent is a finding. The fix is usually label rewriting, preview addition, or ordering by relevance — not restructuring the site.

**Example finding phrasing.**
> *The "Tune Recommendations" aggregated page has weak information scent `[foraging]` from the analysis page. After completing an analysis, the user sees individual recommendations on `/analysis/[id]` but nothing links out to the aggregated `/tune-recommendations` page. The only scent is the sidebar item — which has no preview, no count, and no recency indicator. Fix: (a) add a "View all 14 recommendations across your 3 vehicles →" CTA at the bottom of the per-analysis recommendations section, with the count as the scent signal; (b) enhance the sidebar item with a count badge when there are unresolved recommendations; (c) restructure the `/tune-recommendations` page to lead with the most recent and most severe, not alphabetical.*

**Common misapplications.**
- Confusing scent with SEO. Foraging scent is about the user's scan-and-decide behavior, not about search engines.
- Overloading scent signals. Adding too many preview metadata items per result reduces scannability and slows scent assessment.

**See also:** #2 Hick-Hyman, #29 F-Pattern, #11 Nielsen #6.

---

### 29. F-Pattern & Z-Pattern Reading — `[f-pattern]` `scanning`

**Origin.** F-Pattern: Jakob Nielsen, Nielsen Norman Group, 2006, "F-Shaped Pattern For Reading Web Content" — based on eye-tracking study of 232 users. Updated 2017 with "F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant" clarifying the pattern's scope. Z-Pattern: less empirically grounded, generally attributed to print-design observation of Western reading order (Arnold's Gutenberg Diagram, 1950s, is the direct ancestor); popularized as a layout guideline for lightly-populated pages.

**What it says.** When scanning text-heavy content (search results, article pages, product descriptions), users' eye movements trace an **F-shape**: one full horizontal sweep along the top, a shorter horizontal sweep partway down, then a vertical scan down the left edge. The F is not literal — Nielsen's 2017 update emphasized it is a *family* of scan patterns, all characterized by heavy left-edge focus and diminishing attention as the eye moves right and down.

The **Z-pattern** applies to sparse, visually-led pages (landing pages, dashboards with few elements): the eye starts top-left, sweeps to top-right, then diagonally down to bottom-left, then across to bottom-right. It is weaker evidence than the F-pattern but useful as a heuristic for element placement on sparse pages.

The consequence for design: the *first few words* of a headline, paragraph, or list item carry disproportionate weight. Content along the left edge gets read; content in the middle and right is increasingly likely to be skipped. Elements placed along the Z-pattern path on sparse pages get seen; elements off the path often don't.

**Why it matters in audits.** These patterns explain why some content is "invisible" despite being present. A critical message in the middle of a paragraph's third line may be factually visible but effectively unread. A CTA in the bottom-middle of a sparse page is off the Z-path and will underperform the same CTA in bottom-right.

**Audit trigger — check when:**
- Critical information is buried mid-paragraph instead of front-loaded.
- List items start with filler words before the content-bearing word ("We provide a way to...") instead of leading with the payoff ("Analyze logs in under a minute...").
- Primary CTAs are centered horizontally on sparse pages when bottom-right would catch the Z-pattern.
- Dashboard widgets with the most important metrics are placed bottom-right of the viewport instead of top-left.
- Article headlines are subtitled-first and title-second, burying the scent.

**Heuristic to apply.** For each text-heavy surface, check front-loading: does every scannable element's first 3–5 words carry the meaning? For each sparse surface, sketch the Z-path and check whether primary elements land on it. On dashboards, the top-left quadrant is the highest-attention zone and should carry the most important single metric.

**Example finding phrasing.**
> *The dashboard widgets on TBK Labs violate F-pattern scanning `[f-pattern]`. The Health Score widget — the single most important metric on the page — is positioned in the bottom-right quadrant. The top-left quadrant is occupied by "Recent Activity," a feed of secondary importance. In eye-tracking terms, users entering the dashboard will scan the "Recent Activity" feed first, exhaust their left-edge attention, and frequently never reach Health Score. Fix: swap the two — Health Score at top-left with large typography; Recent Activity at bottom-right as a scannable list. Expected result: Health Score recall and engagement rise measurably.*

**Common misapplications.**
- Treating the F-pattern as a universal law. Nielsen's 2017 update explicitly noted that the F-pattern applies to *text-heavy* content and does not describe all reading on the web.
- Using Z-pattern analysis on dense pages where the pattern doesn't apply.

**See also:** #30 Gutenberg Diagram, #28 Information Foraging, #6 Von Restorff.

---

### 30. Gutenberg Diagram — `[gutenberg]` `layout-reading`

**Origin.** Edmund C. Arnold, 1950s–1960s, American newspaper layout theorist; formalized in his books on modern newspaper design. The diagram is named after Johannes Gutenberg (the printer) but was not developed by him.

**What it says.** When looking at a homogeneous display of information (a newspaper page, a dense dashboard, a table of results), the eye follows a natural reading gravity from top-left to bottom-right, creating four quadrants with distinct attention values:

- **Primary Optical Area (top-left):** where the eye enters. Highest attention.
- **Strong Fallow Area (top-right):** minimal attention unless something specific draws the eye there.
- **Weak Fallow Area (bottom-left):** low attention; the eye has usually already passed through.
- **Terminal Area (bottom-right):** where the eye leaves. Medium attention and a natural place for closing CTAs.

The diagram is most valid for **homogeneous displays** — pages without visual hierarchy. When a strong visual hierarchy is present (large hero images, bold type, color blocks), the hierarchy overrides Gutenberg. The diagram is therefore most useful as a guide for dense information surfaces where Von Restorff breaks aren't being used.

**Why it matters in audits.** Gutenberg is the principle behind the convention of "logo top-left, primary CTA top-right or bottom-right" that dominates Western web design. It also applies to dashboard widget placement, table layout, and card-grid ordering. It is a weaker tool than the F-pattern for text-heavy content but a useful first-pass placement heuristic for sparse or grid-based surfaces.

**Audit trigger — check when:**
- A sparse page has its primary CTA in the bottom-left (the weak fallow area).
- A dashboard places its most important widget bottom-left.
- A landing hero has its key message middle-center but the eye is drawn to an irrelevant image in the top-left.
- A table's summary row is top-left when the user's reading gravity would naturally seek it bottom-right.

**Heuristic to apply.** On homogeneous or sparse surfaces, overlay the four quadrants mentally and check that high-importance elements live in the primary optical area (top-left) or the terminal area (bottom-right), and that the two fallow areas don't carry anything critical. When visual hierarchy is strong, Gutenberg yields to the hierarchy and should not be over-applied.

**Example finding phrasing.**
> *The `/pricing` page layout places its primary CTA ("Start 14-day trial") in the bottom-left of each plan card, violating Gutenberg `[gutenberg]`. The bottom-left is the weak fallow area — the user's eye has already passed through on its way down-and-right. Fix: move the CTA to the bottom-right or bottom-center of each card, aligned as the terminal area, matching the reading gravity the user has been following through the plan details above.*

**Common misapplications.**
- Over-applying to pages where visual hierarchy is the dominant force. Gutenberg is background, not foreground, when hero elements are present.
- Treating it as a universal law for right-to-left reading cultures. Arabic and Hebrew reverse the pattern.

**See also:** #29 F-Pattern, #32 Müller-Brockmann grid.

---

# Part 6 — Visual & Typographic Principles

---

### 31. Bringhurst's Typographic Principles — `[bringhurst]` `typography`

**Origin.** Robert Bringhurst, 1992 (first edition), *The Elements of Typographic Style*. Now in its 4.3 edition (2019), widely regarded as the canonical modern treatment of typography, successor in spirit to Jan Tschichold's *The New Typography* and Stanley Morison's *First Principles of Typography*.

**What it says.** Typography has first principles that govern legibility, reading comfort, and visual harmony. The most actionable for UI work:

- **Measure (line length).** Comfortable reading measure is 45–75 characters per line, with 66 as the traditional ideal. Shorter lines cause too-frequent line breaks that disrupt rhythm; longer lines cause return-sweep errors where the eye loses its place. On the web, this translates to a max-width on body-text containers of roughly `65ch`.
- **Leading (line-height).** Leading should be proportional to measure and type size. Rule of thumb: leading ~1.4–1.6× font size for body text; tighter (~1.1–1.25×) for display type; looser for long reading contexts. Tighter leading on long body text causes fatigue; looser leading on display type creates lagoons.
- **Hierarchy via scale.** Use a modular scale — each level multiplied by a consistent ratio such as 1.125 (major second), 1.250 (major third), 1.333 (perfect fourth), 1.500 (perfect fifth), 1.618 (golden). The ratio creates harmony; arbitrary sizes ("18px, 23px, 29px") create dissonance.
- **Weight and rhythm.** Weight contrasts should be meaningful (at least 300 apart on the weight axis — 400 and 700 work, 400 and 500 barely register). Vertical rhythm should align to a baseline grid where possible.
- **Numerals.** Use old-style (text) numerals in body text; use lining numerals in tables for alignment.
- **Punctuation.** Hang punctuation at margins; use proper quote characters (`"`, `"`, `'`, `'`) not straight quotes; use em and en dashes correctly.

**Why it matters in audits.** Typography is the single most common source of "ugly" verdicts, and most type problems are solvable by applying a handful of Bringhurst rules. A product that nails measure, leading, and modular scale will almost always clear the Aesthetic-Usability (#17) bar on typography alone.

**Audit trigger — check when:**
- Body text container exceeds ~75ch or collapses below ~45ch at common viewport widths.
- Line-height values are unitless default (1.2) on paragraph text, producing cramped reading.
- Font-size values in the codebase are arbitrary (18, 22, 26, 31) instead of on a modular scale.
- Display text and body text share the same leading (body's 1.5× makes headlines feel far apart; display's 1.1× makes body feel suffocated).
- Straight quotes (`"`) instead of curly quotes (`"`) in content.
- Fewer than 3 distinct weight levels used across the product, or weights spaced too close (400/500).

**Heuristic to apply.** For every type surface, check: (a) body measure at `65ch` max-width, (b) leading at 1.4–1.6× for body, (c) font sizes on a modular scale with a stated ratio, (d) weight contrasts of at least 300 on the weight axis for meaningful distinctions, (e) proper punctuation characters. Any violation is a finding. Fix via design-token updates, not per-component.

**Example finding phrasing.**
> *TBK Labs typography violates measure and modular scale per Bringhurst `[bringhurst]`. Body text container is `max-w-none` at 1200+ px wide, producing ~140 characters per line on large viewports — well beyond the 45–75ch comfortable zone, causing return-sweep errors. Font sizes in `tailwind.config.ts` are defined as `text-xs: 12, text-sm: 14, text-base: 16, text-lg: 18, text-xl: 20, text-2xl: 24, text-3xl: 30` — no consistent ratio (12→14 is 1.166, 14→16 is 1.143, 16→18 is 1.125, 18→20 is 1.111 — drifting). Fix: set body container to `max-w-prose` (~65ch); rebuild the type scale on a 1.250 ratio (12.8, 16, 20, 25, 31.25, 39.06...) rounded to integers (13, 16, 20, 25, 31, 39) for mathematical harmony.*

**Common misapplications.**
- Treating Bringhurst as dogma. The rules are defaults for print-rooted reading contexts; some UI contexts (dense dashboards, data tables) legitimately need tighter measure and looser rules.
- Using the golden ratio by reflex when smaller ratios (1.125, 1.250) are more practical for UI.

**See also:** #17 Aesthetic-Usability, #32 Müller-Brockmann grid, #4 Gestalt (continuity).

---

### 32. Müller-Brockmann Grid Systems — `[grid]` `layout`

**Origin.** Josef Müller-Brockmann, 1981, *Grid Systems in Graphic Design* (*Raster Systeme für die visuelle Gestaltung*). The canonical treatment of the modernist grid, drawing on the Swiss Style tradition of the 1950s–60s (Josef Müller-Brockmann, Emil Ruder, Armin Hofmann, Max Bill).

**What it says.** A grid is not a decoration but an organizational system. A well-designed grid provides:

- **Alignment.** Elements snap to invisible tracks that create visual order without being explicitly seen.
- **Proportion.** Spaces between elements follow a consistent scale (4/8 px base is web convention; 12-column grids are newspaper inheritance).
- **Rhythm.** Vertical spacing and horizontal placement create a cadence the eye follows comfortably.
- **Flexibility.** A grid is a *system*, not a template — it accommodates content variation while maintaining order. A grid that cannot flex to content is too rigid; one that flexes arbitrarily has ceased to be a grid.
- **Hierarchy by breaking the grid.** Deliberate grid-breaks (an element that spans two columns, a hero that defies the scale) create emphasis that only works because the rest of the page obeys the grid. If the grid is violated everywhere, the violations mean nothing.

The Swiss-style grid's practical artifacts in web/UI work: column systems (12-column, 16-column), baseline grids for vertical rhythm, spacing tokens on 4/8 px scales, consistent margin/padding systems. Müller-Brockmann's rules are the theoretical justification for every modern design system's spacing scale.

**Why it matters in audits.** Grid discipline is the difference between a UI that feels professional and one that feels slapdash, even when all individual components look fine. Inconsistent spacing (12 px here, 14 px there, 16 px somewhere else) is the most common symptom of grid failure, and it is also the most costly — it cannot be fixed in one place; it requires establishing the system and migrating components to it.

**Audit trigger — check when:**
- Spacing values in the codebase are unpredictable (arbitrary pixel values rather than scale tokens).
- Components align vertically on screen 1 but drift on screen 2 because the grid doesn't flex consistently.
- Gutters between cards vary by container (24 px on dashboard, 20 px on vehicles, 16 px on settings).
- Content containers use arbitrary max-widths rather than a standard grid's breakpoint widths.
- The product lacks a stated spacing scale (4/8 px, or Material's 8dp, or Tailwind's default spacing).

**Heuristic to apply.** Grep the spacing values used in the codebase. Classify into (a) scale-conformant tokens, (b) arbitrary pixel values. The ratio of (a) to (b) is the grid discipline score. Below 80% is a finding — the product has a spacing scale but isn't using it. Below 50% is a P0 — the grid effectively doesn't exist. Fix: establish canonical scale, lint against arbitrary values, migrate incrementally.

**Example finding phrasing.**
> *TBK Labs grid discipline is failing per Müller-Brockmann `[grid]`. A grep across `apps/web/src` for pixel values not matching the Tailwind 4/8 px scale found 87 arbitrary values (e.g., `p-[14px]`, `mt-[18px]`, `gap-[13px]`). The product has a scale (`tailwind.config.ts`) but 60%+ of spacing declarations bypass it. Grid-break emphasis becomes meaningless — nothing is emphasized because everything drifts. Fix: add an ESLint rule banning arbitrary spacing values outside a documented exception list, migrate the 87 instances over two sprints, rebuild the spacing scale in `tailwind.config.ts` to include a tight ladder (2, 4, 8, 12, 16, 24, 32, 48, 64) on a 4-px base.*

**Common misapplications.**
- Grid worship. A grid is a tool, not an end. If the content legitimately needs a break, break it intentionally.
- Confusing grid with uniformity. A good grid *permits* variation within system; a bad "grid" is uniformity.

**See also:** #31 Bringhurst, #4 Gestalt (proximity, continuity), meta-design dimension 3.

---

### 33. Tufte's Data-Ink Ratio & Chartjunk — `[tufte]` `data-viz`

**Origin.** Edward R. Tufte, 1983, *The Visual Display of Quantitative Information* (2nd edition 2001). Followed by *Envisioning Information* (1990), *Visual Explanations* (1997), and *Beautiful Evidence* (2006). Tufte is the dominant modern voice on information design and data visualization.

**What it says.** In a chart, the **data-ink ratio** is the proportion of ink (or pixels) used to represent the actual data, vs. decoration, chrome, and non-data elements. Tufte's imperative: **maximize data-ink, minimize non-data-ink, erase non-data-ink wherever possible without loss of information.** The corollary is **chartjunk** — Tufte's term for non-functional decoration (3D effects, drop shadows, gradient fills, unnecessary legends, ornamental grid lines, background images, clip art). Chartjunk not only adds nothing — it actively obscures the data and signals a lack of seriousness about the information.

Tufte's other relevant principles:

- **Small multiples.** Many small, consistently-designed charts together beat one large chart with many series.
- **Direct labeling.** Label lines and points directly, not via a legend in the corner that forces eye jumps.
- **Sparkline.** Word-sized, inline charts that encode a trend in the reading flow rather than in a separate chart block.
- **Lie Factor.** The ratio of "effect shown in graphic" to "effect shown in data." Any lie factor far from 1.0 is a distortion that misleads the reader.

**Why it matters in audits.** Dashboards, analytics pages, and report surfaces live or die on their data visualization. A product that charges for insights and produces ugly, misleading, or chartjunk-laden charts is undermining its own value proposition. Tufte is the lens for every chart audit.

**Audit trigger — check when:**
- Charts have gradient fills, drop shadows, 3D extrusions, or ornamental backgrounds.
- Legends are in the corner when direct labeling would work.
- Multiple dense charts are shown when small multiples would present the same data more clearly.
- Gridlines are dark and heavy, competing with data lines for attention.
- Y-axis scales are truncated or stretched to exaggerate change (lie factor violation).
- Pie charts are used for more than 3 categories (Tufte: pie charts are the worst common chart; bar charts almost always beat them for category comparison).
- Trends that belong inline with text are pulled into separate chart blocks, breaking reading flow (missed sparkline opportunity).

**Heuristic to apply.** For each chart in the product, ask: *if I erase everything that isn't data, does the chart still communicate?* If yes, the non-data parts should be erased. Rank charts by data-ink ratio and fix the worst first. Special attention to any chart that appears multiple times — fixes to a reusable chart component pay compound dividends.

**Example finding phrasing.**
> *The Health Trend chart on `/dashboard` violates Tufte's data-ink principle `[tufte]`. The chart uses (a) a dark gradient background fill, (b) a legend in the top-right with 5 items the user must cross-reference back to 5 lines in the chart, (c) major and minor grid lines at equal visual weight, and (d) a drop shadow on the chart container. Erasing the gradient, minor grid lines, and drop shadow would lose no information. Moving the legend to direct-label endpoints would eliminate a cross-reference step. The resulting chart would have ~2× the data-ink ratio and communicate faster. Fix across all 23 chart components (many share a wrapper) via `packages/ui/src/charts/ChartContainer.tsx`.*

**Common misapplications.**
- Applying Tufte dogmatically to contexts where ornament is the point (brand moments, marketing hero charts). The principles are for information charts; decorative charts are a different genre.
- Treating sparklines as always the answer. Sparklines work only when the reader is already in a reading flow that benefits from inline visualization.

**See also:** #31 Bringhurst, #4 Gestalt, meta-design dimension 15 (performance as craft — fewer chart elements = faster paint).

---

### 34. Touch Target Minimums (HIG / Material / WCAG) — `[targets]` `interaction-physical`

**Origin.** Apple Human Interface Guidelines (2010 iPhone HIG onward): 44×44 pt minimum. Google Material Design (2014 onward): 48×48 dp minimum with 8 dp spacing. WCAG 2.2 SC 2.5.5 (Target Size — Enhanced, 2023): 24×24 CSS px minimum for AA; 44×44 for AAA. The three standards reflect empirical research on adult finger pad sizes (~10–14 mm) plus device pixel densities plus an error-rate curve that rises sharply below the minimums.

**What it says.** Touch targets smaller than the platform minimum produce disproportionately high error rates and user frustration. Above the minimum, error rates flatten — targets much larger than 48 dp don't significantly improve accuracy. The minimums exist because empirical studies show a sharp knee in the error curve, not a smooth ramp. Below the knee, every pixel of target size cut costs more errors than you'd expect; above, increasing size buys diminishing returns.

Spacing matters almost as much as target size: two 44-pt targets with 2 pt between them behave as a single ambiguous target. Material's guideline of 8 dp minimum inter-target spacing exists for this reason.

**Why it matters in audits.** Mobile touch targets are one of the most routinely violated standards in products built desktop-first. The audit question: *is every interactive target on the product at or above the platform minimum, including spacing?*

**Audit trigger — check when:**
- Icon buttons or links are below 44×44 pt on iOS / 48×48 dp on Android.
- Adjacent interactive elements have less than 8 dp separation.
- Desktop-designed forms are shipped responsive without resizing touch targets (a 32-px desktop button becomes a 32-px mobile button, well below the minimum).
- Close-buttons on modals are tiny icons in the top-right corner with no padding to extend the hit box.
- Dropdown triggers are the text only (not the icon + text + padding), making the effective target smaller than the apparent one.

**Heuristic to apply.** On a mobile viewport, grep for all interactive elements (`<button>`, `<a>`, `role="button"`, `onClick` on divs) and measure their computed bounding box. Any element under 44×44 CSS px is a finding. Any pair of adjacent elements with less than 8 px between their bounding boxes is also a finding. Fix by adding padding (the hit box grows without the visual changing) or by increasing the visual size.

**Example finding phrasing.**
> *Mobile touch targets in the dashboard action row violate platform minimums per HIG/Material/WCAG `[targets]`. Three action buttons ("Re-analyze," "Share," "Export") are rendered as 32×24 px icon buttons with 4 px gaps at the mobile breakpoint. Every one is below the 44×44 pt HIG minimum and the 24×24 px WCAG AA minimum. The 4 px gap is below Material's 8 dp recommendation. Fix: enforce a minimum touch target size in the Button primitive when `variant="icon"` on mobile — at least 44×44 with padding, and use a minimum gap token of 12 px in the action-row layout. Consolidate the three secondary actions into an overflow menu if the horizontal budget doesn't accommodate them.*

**Common misapplications.**
- Designing large touch targets at the expense of content density. The fix is padding inside a layout that accommodates it, not ballooning the visual.
- Ignoring that WCAG 2.5.5 applies to web generally, not only mobile. Desktop keyboard+mouse users also benefit from adequate target sizes.

**See also:** #1 Fitts' Law, #35 WCAG, meta-design dimension 12 (responsive craft).

---

# Part 7 — Accessibility

---

### 35. POUR & WCAG 2.2 AA Core Criteria — `[wcag]` `a11y`

**Origin.** POUR principles: W3C WCAG 2.0, 2008. WCAG 2.1: 2018. WCAG 2.2: October 2023. The POUR acronym (Perceivable, Operable, Understandable, Robust) organizes the ~50 success criteria across the three conformance levels (A, AA, AAA).

**What it says.** Accessibility requirements are organized around four principles:

- **Perceivable.** Information and UI components must be presentable in ways users can perceive — this includes text alternatives for non-text content (SC 1.1.1), captions and transcripts for media (SC 1.2), resizable text up to 200% (SC 1.4.4), contrast ratios of 4.5:1 for normal text and 3:1 for large text (SC 1.4.3), and content that does not rely on color alone to convey meaning (SC 1.4.1).
- **Operable.** UI must be operable — keyboard accessible without traps (SC 2.1.1, 2.1.2), sufficient time (SC 2.2), no content that induces seizures (SC 2.3.1), bypass blocks/skip links (SC 2.4.1), focus order logical (SC 2.4.3), focus visible (SC 2.4.7), touch targets ≥24×24 CSS px (SC 2.5.5, new in 2.2), drag alternatives (SC 2.5.7, new in 2.2).
- **Understandable.** Content and operation must be understandable — language of page specified (SC 3.1.1), consistent navigation and identification (SC 3.2.3, 3.2.4), error identification with suggestions (SC 3.3.1, 3.3.3), labels or instructions for inputs (SC 3.3.2), accessible authentication that doesn't require cognitive function tests (SC 3.3.8, new in 2.2).
- **Robust.** Content must be robust enough to be interpreted reliably by a wide variety of assistive technologies — valid name/role/value (SC 4.1.2), status messages programmatically determinable (SC 4.1.3).

**AA is the practical minimum** for a paid product in most jurisdictions. EAA (European Accessibility Act, enforcement mid-2025) requires AA conformance for covered products serving EU consumers. ADA Title III lawsuits in the US routinely cite WCAG AA as the de facto standard despite no formal adoption.

**Why it matters in audits.** Accessibility findings are often severity-downgraded ("we'll get to a11y later") but this is usually wrong. A11y failures are (a) legal risk in many markets, (b) immediate exclusion of 10–25% of users depending on the product category, (c) good UX for everyone — keyboard navigation, visible focus, and error clarity help all users, not only disabled ones, and (d) they compound: an a11y-broken product is much more expensive to fix retroactively than to build right.

**Audit trigger — check when:**
- `outline: none` or `outline: 0` without a replacement focus indicator — SC 2.4.7 failure.
- Color contrast below 4.5:1 for text under 18 pt — SC 1.4.3 failure.
- Icons without `aria-label` conveying meaningful interactive purpose — SC 4.1.2 failure.
- Forms without associated labels (label-for, aria-label, aria-labelledby) — SC 3.3.2 failure.
- Keyboard traps (focus enters a component and cannot exit with keyboard alone) — SC 2.1.2 failure.
- Dynamic error messages not announced to screen readers (missing `aria-live`) — SC 4.1.3 failure.
- Touch targets below 24×24 CSS px — SC 2.5.5 failure.
- Drag-only interactions without an alternative — SC 2.5.7 failure.
- Modal/dialog without focus management (focus not moved into the modal, or not restored on close).

**Heuristic to apply.** Run an automated scan first (axe DevTools, Lighthouse a11y audit, or `axe-core` in CI) — it catches the machine-checkable 30% of failures. Then do a keyboard-only walkthrough of primary flows, noting every stuck focus, invisible focus, and unreachable element. Then do a screen-reader walkthrough (VoiceOver or NVDA) of the same flows, noting anything unannounced or mis-announced. The three passes together catch most practical failures; full WCAG audits require a specialist.

**Example finding phrasing.**
> *Focus visibility is broken on primary form buttons per WCAG 2.4.7 `[wcag]`. The base Button component in `packages/ui/src/Button.tsx` uses `focus:outline-none focus:ring-0` without a replacement focus indicator. Keyboard users cannot see where focus is. This is a WCAG AA failure, a legal-risk item under EAA, and a universal-usability failure. Fix: replace with `focus-visible:ring-2 focus-visible:ring-tbk-accent focus-visible:ring-offset-2 focus-visible:outline-none` — uses `focus-visible` so mouse-click focus is invisible but keyboard focus is obvious. Apply across all interactive primitives in `packages/ui`.*

**Common misapplications.**
- Treating a11y as a lint pass. Automated tools catch <30% of failures; the rest require keyboard and screen-reader walkthroughs.
- Assuming color contrast alone is the whole visual accessibility story. Contrast is necessary but not sufficient — non-color indicators, text size, and focus indicators all matter.

**See also:** #34 Touch Targets, #13 Norman's Signifiers, meta-design dimension 13 (visual a11y).

---

# Part 8 — Anti-Patterns & Ethics

---

### 36. Brignull's Dark Pattern Taxonomy — `[dark-pattern]` `ethics`

**Origin.** Harry Brignull, 2010, founded darkpatterns.org (now deceptive.design) and defined the original dark-pattern taxonomy. Expanded by Mathur, Acar, Friedman, Lucherini, Mayer, Chetty & Narayanan (2019, "Dark Patterns at Scale") with an empirical study of 11,000 shopping sites identifying ~1,818 dark-pattern instances. Further formalized by the EU Digital Services Act (2022) and the FTC's September 2022 staff report, which explicitly identify specific categories as regulated deceptive practices.

**What it says.** A dark pattern is a design choice that uses knowledge of human cognition — often drawing from the same behavioral-economics research as legitimate persuasion — to manipulate the user into a decision they would not have made with full information and equal cognitive effort. Brignull's original taxonomy and its successors identify recurring categories:

- **Sneak into Basket.** Items added to cart automatically (often cross-sells, insurance, warranties) without explicit user action.
- **Bait and Switch.** The user expects one outcome and gets another (e.g., Windows 10 upgrade X becoming an upgrade button).
- **Hidden Costs.** Costs revealed only at the end of checkout that should have been visible earlier.
- **Misdirection.** Visual emphasis drawing attention to one option while the user's actual interest is steered toward another.
- **Confirmshaming.** The opt-out is phrased to make the user feel guilty ("No thanks, I don't want to save money").
- **Disguised Ads.** Advertisements styled to look like native content.
- **Forced Continuity.** A free trial that rolls silently into paid billing with no reminder.
- **Friend Spam.** The user unknowingly grants permission to contact their entire address book.
- **Privacy Zuckering.** Tricking users into sharing more personal data than intended via confusing or inverted defaults.
- **Roach Motel.** Easy to get into; hard to get out of. Common in subscription cancellation.
- **Price Comparison Prevention.** Making it hard to compare prices across options.
- **Trick Questions.** Questions phrased so that the user's intended answer requires counter-intuitive checkbox states.
- **Fake Scarcity / Social Proof.** "Only 3 left!" or "5 people are viewing this" when untrue.
- **Nagging.** Repeatedly interrupting the user with the same request until they comply.

**The EU DSA (2022) explicitly prohibits several categories**, and the FTC has taken enforcement action in the US against others. This is no longer purely an ethics question — dark patterns are a legal liability.

**Why it matters in audits.** Every audit needs a dark-pattern pass. The auditor's job is not just to find usability problems but to verify the product is not manipulating its users. A product with high usability scores that exploits dark patterns is worse than a product with usability flaws, because the dark patterns are a deliberate betrayal of trust.

**Audit trigger — check when:**
- Subscription cancellation is behind multiple confirm-you-really-want-to-cancel screens (Roach Motel).
- Pricing page shows per-month pricing that becomes per-year at checkout (Hidden Costs).
- Opt-out copy uses guilt-inducing language ("No, I don't care about saving money") (Confirmshaming).
- Free trial has no clear expiry reminder and rolls silently (Forced Continuity).
- Notification-preferences page inverts the conventional labeling ("Uncheck to receive notifications") (Trick Questions).
- Scarcity or social-proof indicators are present but not grounded in real data (Fake Scarcity/Social Proof).
- Account deletion is harder than account creation (universal Roach Motel).
- A feature is named in a way that makes the alternative ("off") sound like failure.

**Heuristic to apply.** Walk through every conversion, retention, and data-collection surface with the taxonomy as a checklist. Ask of each: *am I using a technique from this list? If yes, is every element of it honest and necessary?* The honesty test is the key: Cialdini's scarcity (#20) is legitimate when the scarcity is real. "Only 3 slots left" on an unlimited digital product is a dark pattern. The difference is not the technique, it is the honesty.

**Example finding phrasing.**
> *The TBK Labs account deletion flow exhibits a Roach Motel anti-pattern `[dark-pattern]`. Account creation takes one screen and ~45 seconds. Account deletion requires: (1) navigating to /settings, (2) scrolling to a "Danger Zone" panel, (3) clicking a button that opens a modal, (4) typing the literal word DELETE to confirm, (5) confirming a second "Are you sure?" modal, (6) being redirected to a 7-day "grace period" screen where deletion is queued but not final. Six steps for cancel vs one step for creation. This is also a Forced Continuity pattern if the user is mid-subscription and the deletion does not immediately stop billing. Fix: make deletion parity-equal with creation (one clearly-surfaced action, one confirmation, immediate execution), clearly state billing cessation, and remove the dark-pattern chrome ("Danger Zone" framing is itself a Confirmshaming variant).*

**Common misapplications.**
- Conflating all persuasion with dark patterns. Cialdini legitimately applies; fake scarcity does not. The difference is honesty.
- Treating dark patterns as "what competitors do that we should copy." Regulatory risk is real; reputation risk is real.

**See also:** #20 Cialdini, #21 Prospect Theory, #23 Default Bias.

---

# Part 9 — Cross-Reference Matrix

This matrix maps each theory entry to the audit dimensions it most directly supports. The matrix is consulted during Phase 5 of the workflow to route findings to the right principle, and during Phase 7 verification to catch findings that should have cited a principle but didn't.

**Legend:** `P` = product-ux-review dimension, `M` = meta-design dimension.

| Entry | Dimensions supported |
|---|---|
| #1 Fitts | P: interactions, affordance; M: touch targets, button design |
| #2 Hick-Hyman | P: IA, navigation, onboarding; M: menu design |
| #3 Miller | P: forms, wizards, comparison, multi-step flows |
| #4 Gestalt | M: layout, grid, component grouping, visual hierarchy |
| #5 Serial Position | P: navigation order, pricing order, onboarding sequence |
| #6 Von Restorff | M: emphasis, primary CTA isolation, state design |
| #7 Cognitive Load | P: onboarding, forms, error handling, documentation |
| #8 Doherty | P: performance as UX, loading states; M: skeleton design |
| #9 Goal-Gradient | P: onboarding, long tasks, completion flows |
| #10 Zeigarnik | P: draft persistence, re-engagement, resume flows |
| #11 Nielsen | P: all; M: all — universal lens |
| #12 Shneiderman | P: error recovery, closure, expert flows |
| #13 Norman (affordance) | P: interactions; M: signifier design, state |
| #14 Jakob | P: IA, navigation, convention compliance |
| #15 Tesler | P: system design, onboarding, allocation decisions |
| #16 Postel | P: forms, validation, search, upload |
| #17 Aesthetic-Usability | M: all (lens for translating visual findings to outcomes) |
| #18 Peak-End | P: onboarding, task completion, cancellation, activation |
| #19 Fogg | P: engagement analysis, feature adoption, retention |
| #20 Cialdini | P: conversion surfaces, pricing, signup, retention |
| #21 Prospect Theory | P: upgrade flows, cancellation copy, framing |
| #22 Anchoring | P: pricing, onboarding defaults, estimates |
| #23 Default Bias | P: all settings, checkouts, privacy defaults |
| #24 Hyperbolic Discounting | P: onboarding, time-to-first-value |
| #25 JTBD | P: Phase 0 framing, severity calibration |
| #26 Kano | P: Phase 0, severity calibration |
| #27 Pareto | P: navigation, surface allocation |
| #28 Foraging | P: navigation, search, discoverability |
| #29 F-Pattern | M: text layout, scan patterns |
| #30 Gutenberg | M: sparse-page layout, dashboard widget placement |
| #31 Bringhurst | M: typography (dimension 1) |
| #32 Müller-Brockmann | M: grid, spacing (dimension 3) |
| #33 Tufte | M: data viz, dashboards |
| #34 Touch Targets | M: interaction-physical, mobile craft |
| #35 WCAG POUR | M: accessibility (dimension 13); P: error handling |
| #36 Dark Patterns | P: ethics pass (new dimension in v3); M: conversion surfaces |

---

## Version history

- **1.0** (2026-04-07) — Initial bank, 36 entries, co-located with `/product-ux-audit` workflow. Primary consumers: `product-ux-review` skill v2+ and `meta-design` skill v2+. Candidates for v1.1: Parkinson's Law, Occam's Razor, Confirmation Bias, Endowment Effect, Jobs-to-be-Done interview protocol, Brad Frost atomic design, Inclusive Components patterns by Heydon Pickering, Refactoring UI (Wathan/Schoger), Apple HIG motion spec, Material motion principles.

## Maintenance rules

1. **No entry is added without an audit citation.** An entry earns its place by being cited in at least one audit of a real product, not by being famous.
2. **Every entry must have Example finding phrasing.** Without it, the entry is decorative rather than operational.
3. **Citations in findings must use the tag, not the name.** `[fitts]`, `[gestalt]`, `[wcag]` — short, greppable, and stable across renames.
4. **Remove entries that accumulate zero audit citations after three uses of the bank.** Dead theory is worse than missing theory.
