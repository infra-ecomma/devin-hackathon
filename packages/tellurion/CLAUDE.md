# Tellurion — project rules

Local rules for this repo. They override the global `~/.claude/CLAUDE.md` where they conflict.
Read `README.md` for what the instrument is; this file is how to work on it.

## What this is, in one line

A live instrument — a canvas orrery plus an SVG spine — that draws the TBK Labs build
universe from a mined entity graph and pulses it in real time. It is a **competition entry
judged 50% on usefulness and 50% on beauty and innovation** (`docs/PRODUCT-SPEC.md`), seen
by a jury for about sixty seconds. Visual craft is not polish here; it is half the score.

## Hard constraints — do not break these

- **Zero dependencies, Node 20+.** No npm installs. No React, no Tailwind, no build step.
  If a skill suggests a library, take its *principles* and implement them by hand.
- **Read only by design.** It watches, it never writes to what it draws (`lib/sources.mjs`).
- **Nothing is a mock.** Every body on the plate is a real entity from `data/world-static.json`.
  The acceptance walk fails if the screen and the graph disagree. Never fake a count to make
  a screenshot look better.
- **One set of semantics.** The browser imports the same reducer the server uses
  (`lib/state.mjs`, served directly). Do not fork the logic into a second copy.

## The surfaces

| file | what it is | reach for |
| --- | --- | --- |
| `public/orrery.js` | canvas plate — planets, moons, belt, comets, rim | `rendering-performance`, `motion-design` |
| `public/spine.js` | SVG column — vertebrae, nerves, callouts | `svg-generator`, `typeset` |
| `public/app.css` | 839 lines, the whole visual language | `color-strategy`, `design-token-guide` |
| `public/app.js` | SSE wiring, hover joins, dossier, scrub | `ui-hardening`, `onboarding-ux` |
| `lib/attribute.mjs` | maps live activity onto entities | — |
| `data/world-static.json` | the entity graph | — |

## Which skill to reach for

- **Making it move** — `motion-design` first (easing discipline, `prefers-reduced-motion`),
  `premium-animation-toolkit` for CSS-only technique, `rendering-performance` when it janks.
- **Making it read** — `color-strategy` and `design-token-guide` for the palette,
  `typeset` for the engraved labels, `svg-generator` for anything vector.
- **Trying a different direction** — `design-shotgun` gives 3-5 genuinely different options
  with tradeoffs rather than one guess. `design-intent-extraction` and `design-mirror` when
  working from a reference. `design-prototype` for a throwaway single-file comparison.
- **The empty state** — `onboarding-ux`. Genesis mode's first-run screen is onboarding, and
  a new project never passing through an empty state is a stated product goal.
- **Before it ships** — `design-validation` (5 breakpoints, dark mode, keyboard),
  `visual-verification-gate` (does the screenshot actually show what was claimed),
  `responsive-testing`, `accessibility-tests`, `web-accessibility`, `ui-hardening`.

Skills that assume React, Tailwind, mobile or a Classification Card were deliberately left
out of this kit. If one seems needed, it probably means the constraint above is being broken.

## Definition of done (global rule 38)

`verify/` holds nine acceptance walks. A change to what the instrument shows is done when a
walk passes **and** the result was looked at — not when the build is green.

```bash
cd tellurion && npm run walk          # verify/walk.mjs, the core walk
node verify/plan-lifecycle-walk.mjs   # plan birth -> spine, writes PNGs + video
```

Walks write PNGs and video under `verify/last-*`. Look at them before claiming anything
renders. `npm start` serves on `node server.mjs`.

## Hooks that fire here

Wired in `.claude/settings.json`, all repaired 2026-08-30 before wiring (each had a defect
that silently disabled it — see `verification/2026-08-30-visual-kit-install/`):

- **design-qa** (PostToolUse on Edit/Write) — SVG validity, viewBox, `<title>`, CSS token
  ratio, `!important`, missing `prefers-reduced-motion`. Blocks only on a corrupt image or
  invalid SVG XML.
- **design-enforcement** (PostToolUse) — anti-pattern scan. Advisory here; its blocking check
  is gated on a Classification Card this project does not have.
- **proof-artifact-check** (PreToolUse on Bash) — inert until `dev_docs/enforcement-proofs/`
  exists. Wired so it starts working the day that pipeline lands.

**What the repaired sensor caught, and what happened to it:** `public/app.css` had 22
animations and transitions and zero `prefers-reduced-motion` queries. Fixed 2026-08-30 —
the guard sits at the end of `app.css`. `orrery.js` already honoured the preference on the
canvas (it reads `REDUCED` at four animated terms); the CSS layer did not, and now does.
Verified in a real browser: every transition collapses to one near-zero duration and
`livepulse` drops from 2.2s infinite to a single near-zero iteration.

The guard's four `!important` declarations trip design-qa's own ">3 `!important`" advisory.
That is expected and deliberate — a universal selector loses on specificity to `.live i` and
friends. Do not chase that warning.

## Canonical document

`https://shares.tbk-labs.dev/tbk/tellurion.html` — source `docs/tellurion-canonical.html`.
Update it, with a dated changelog row, in the same session as any change to what Tellurion is
or does. The baked instrument is a different artifact: `.../tbk/tellurion-plate.html`.

## Repo

`.claude/settings.local.json` carries the TBK Relay auth token and is gitignored. Never commit it.
