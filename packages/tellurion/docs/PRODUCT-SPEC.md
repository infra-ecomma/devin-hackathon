# Live Artifact, product spec

Status: v1.0, rebuilt 2026-08-24 after the operator rejected v0.1 and re-scoped
it ("the orrery needs to be a combination of products, features, tools,
processes, workflows; the spine needs to be products, features, and
milestones"). Behaviour below is what the code does today.

## What it is for

One screen that shows the whole TBK Labs operation as a living instrument, so
the state of everything being built is something you look at rather than
something you ask about. It is a competition entry judged 50% on usefulness and
50% on beauty and innovation, and it is built to win both halves at once.

It answers four questions at a glance:

1. What does TBK Labs consist of — every product, project, feature, tool,
   process and workflow, as one populated universe.
2. What state is each product in — its milestone score, its features and their
   claim status, live or building or dormant.
3. What happened when — 69 dated milestones on a scrubbable timeline that
   replays the record honestly back to any day.
4. What is the fleet touching right now — live events attributed onto the exact
   entities they concern.

## Who it is for

The operator, on a second screen. Not a report and not a dashboard of metrics:
an instrument. Also, explicitly, a competition jury seeing it for sixty seconds.

## The two components

### The Orrery, the universe

The governing rule survives from v0.1: **every body on the plate indicates its
kind by form alone**, so the taxonomy reads at 6px and in peripheral vision. The
kinds changed to what the operator ruled:

- **Products are planets** on engraved orbits, mass from their real record
  (milestones + features), engraved latitudes, a blue equator when live, dashed
  ghost when dormant. Ten flagships, hand-seated for composition.
- **Projects are minor planets** on the outer bands: the fleet's other build
  surfaces, fifteen of them.
- **Features are moons**, orbiting the product that owns them. Hollow = open,
  filled = claimed, haloed = verified, which is the Zangetsu distinction drawn
  in orbit.
- **Tools are the belt**, **processes the outer ring**, **workflows comets**.
  **Only where the project has used them** (amended 2026-08-28). The whole
  standing kit used to be painted on every project from the first second, so a
  plate spent most of its space on 88 things the operator had never touched.
  Usage is recorded per project in `.tellurion/usage.json` so it survives a
  restart, and a `Bench: used / all` toggle shows the whole kit on demand. With
  nothing used, neither band is drawn at all and the product region expands to
  take the room.
- **Ring labels are short**: "FEAT. LEDGER", not "Features Ledger capture" over
  "RULE 39". The full name and the rule number are on the body, in the dossier.
- **The rim is the timeline**: a 320° arc from the first recorded milestone to
  now, one notch per dated milestone, month-graduated, with an alidade you drag
  to replay the record. Products not yet born at the chosen date collapse to
  dashed seats; counts and the spine follow. Nothing is interpolated: only
  recorded dates move anything.

### The Spine, the project plan (rebuilt 2026-08-28)

**One section per PRODUCT, collapsed, opening to its features.** It was built
from the plan's PHASES, which is how work was sequenced rather than what the
project IS, and that is why it never read as a project. Every step already
declares `produces.of` and the plan already lists `products`, so the grouping key
was the only thing wrong.

The spine, the plate, the header and the map tab all carry **the same set of
products**. They did not: the header counted flagship planets, the spine counted
anything with a milestone, and the map built its own union, so one screen read 14
products, 16 sections and 25 branches. A product with nothing under it says
"nothing yet"; steps naming no product land in a holding area that is styled
apart and is not counted as a product.

### The Spine, the build record (historical description)

All 69 milestones as vertebrae in one continuous sagittal column, grouped into
product segments ordered by first milestone. Done = bone fill + tick;
in-progress = blue glow + halo; planned and not-yet (during replay) = engraving
hatch. One cord lights from the first vertebra exactly as far as reality has
reached. Features feather left as nerves; dissection-style callouts fan right on
a single rail (a colliding label is dropped or re-anchored, never stacked). The
halves join: hover a planet and its segment heats; a nerve thread crosses the
divide; click pins the dossier.

### The live layer

Read-only feeds (transcript tail, per-directory watcher, git poll) reduce into
pulses attributed by `lib/attribute.mjs`: path prefix → planet, skill → comet,
command token → belt tool, commit subject → product. Lime marks ONLY this layer.
The rev/min drive gauge turns at the pace of live events and decays at rest.

## Data provenance

`data/inventory.json` was mined from the repo (canonical docs, agent homes,
Features Ledger logs, governance rulebook, skill arsenal, version-stamped
commits, verification folders) on 2026-08-24 and normalized into
`data/world-static.json`, which the server loads at boot. Every number on
screen is a count of that graph; the acceptance walk fails on any disagreement.

## Project mode, the intended daily use (added 2026-08-24, model ratified 2026-08-28)

Point it at any project that is not the OCC repo and it starts from an empty
sky. The standing bench appears only as the project uses it, so on the first
morning the plate is genuinely empty and fills as work lands. The rim is a session clock;
the timeline scrub is disabled because a new project has no dated record yet.
The hub carries the project's name. Both sides run the same reducer, so the
browser grows the same world the server does.

### The ratified ladder (2026-08-28)

The operator ruled on the hierarchy against a ten-frame walkthrough of the real
Maximus Desktop repo, and chose PROJECT MODE as the view to build:

| Level | Drawn as | Is |
| --- | --- | --- |
| Project | the hub | the repo being watched |
| Product | a planet | a named surface a person opens (Stations, Creative Library, Voice) |
| Feature | a moon on its planet | something that surface can now DO |
| Milestone | a tick on the rim | earned by the features under it, never declared |
| Tools, processes, workflows | the outer belt | the standing bench, identical on every project |

Two tests decide product from feature: could you stop building it without
stopping the others, and would a person name it when saying what they use.
"Multi-select attach" fails both; "Creative Library" passes both.

A feature is phrased as what the product can now do ("forks a conversation at
any reply into its own window"), never as a user action ("click Branch"). This
is the `plain` field's existing shape in `data/world-static.json`.

**Zoom is part of the model and must be stated on screen.** The same object is a
planet in the estate view and the hub in its own view, which is legitimate the
way a city is a dot on one map and the whole of another. It is only legitimate
if the instrument says which map you are on. The estate zoom is PARKED, not
discarded.

### What project mode actually does, measured 2026-08-28

**With a declared plan, project mode already implements the ladder above.**
`.tellurion/plan.json` declares `products`, and `applyPlan` (`lib/state.mjs`)
builds one planet per declared product and one moon per plan step, joined by the
step's `produces.of`. The `planDrivesGraph` guard then stops a directory or a
file inventing anything alongside the declaration, because guessing beside a
declaration is how the two come to disagree. Verified live on this repo: the
four declared products (The Reader, The Plan, The Plate, The Grammar) are the
four planets drawn.

An earlier draft of this spec said genesis mode grows planets from directories
and moons from files, full stop. That was written from the 2026-08-24 prose and
is wrong: it is the FALLBACK, used only when a project has declared no plan at
all. Corrected 2026-08-28 after reading the code and the live graph.

### The real defect found the same day: a typo invents a product

`normalisePlan` deliberately keeps a step whose `produces.of` names a product
that was never declared, because losing work to a typo is worse than carrying a
product with a plain name. It did so by INVENTING that product, and the invention
was drawn as an ordinary planet. Measured on this repo's own plan: five steps
named `the-plan` and `the-plate` while the declared ids were `plan` and `plate`,
so the plate carried **six product planets against four in the file** and nothing
on screen said which two were a typo.

Fixed the same day. The reference still survives, and now:

- the plan carries an `undeclared` list of the ids and how many steps name each;
- the invented product is drawn **dormant**, the plate's existing dashed-ghost
  form, and its caption reads "not declared in products; named by N steps";
- its tier rollup is skipped, so a typo can never wear the "claimed" badge a
  real product earns;
- it is counted as **neither** a product nor a project, because calling it a
  project would move the false statement rather than remove it.

## Non goals

- Not a metrics dashboard. No charts, no time series, no burndown.
- Not a project manager. It observes the record, it does not edit it.
- Not a writer. It never modifies anything it draws.
- Not automatic inventory: the graph is a deliberate, mined snapshot, refreshed
  by re-running the recon, not a filesystem guess.

## Design constraints it is built to

- Light theme by default (standing preference). The register is ink on paper:
  an engraved chart, alive. Observatory (dark) is a toggle, not the default.
- Deep Blue `#0077FF` is the only brand colour. Graphite navy is the engraving.
  Lime `#9DFF00` marks only what is happening right now.
- Orbitron for display, Inter for body, JetBrains Mono for labels and paths.
- No em dashes anywhere in the interface.
- The TBK mark is copied from the canonical template, never redrawn.
- Labels never stack: one priority pass (flagships, ring, minors, comets,
  trades), candidates re-anchor, a loser is dropped, a flagship name always
  renders.

## What would make it a false positive

If the operator cannot tell a product's state (live, building, dormant, score)
from the plate without clicking, the encoding has failed. If a body's kind is
not readable from its form alone, the taxonomy has failed. If the replay ever
shows a state the record cannot support, the instrument is lying and must be
fixed before anything else.

## Kill criterion

If it is running and the operator stops glancing at it within a week, it is
decoration and should be deleted rather than maintained.

## Open, for the operator to rule on

- ~~The name~~ RESOLVED 2026-08-24: the operator adopted **Tellurion**.
- Whether the feature moons should someday carry dates (the ledger does not
  record them today, so the replay deliberately leaves moons in place).
- Whether a fleet-wide live feed (all machines, not just this host's
  transcripts) is wanted.
