# Tellurion

Named by the operator 2026-08-24 (repo folder stays `live-artifact`). A live
instrument in two halves. The hub at the center always carries the name of what
it is watching. It runs in two modes:

- **Universe mode** (this repo): the whole TBK Labs build universe, from the
  mined entity graph below.
- **Genesis mode** (any other `--project` path, automatic): a brand-new project
  starts with an empty sky and the standing machinery (tools belt, process
  ring, workflow comets), then grows in real time as you build: every top-level
  directory you touch becomes a planet, every file you create becomes one of
  its moons, and your session plan (the to-do list) IS the spine, completing
  vertebra by vertebra. The rim becomes a session clock from START to NOW.

Static archive: `node bin/build-static.mjs [worldUrlOrFile] [out.html]` bakes a
single self-contained HTML snapshot (badge reads "archive"); the current one is
published at https://shares.tbk-labs.dev/tbk/tellurion.html

**The Orrery** is the universe. Every body on the plate is something real, and its
form tells you what kind of thing it is before any label does:

| form | entity | count today |
| --- | --- | --- |
| planet (engraved disc, blue equator when live) | product — Shakeeb, Zangetsu, Yatagarasu, Tetsujin, Prometheus, Sentinel, Features Ledger, Fusion, Agentic Loop, OCC Canon | 10 |
| minor planet | project — DeSlop, The Brain, Fleet Deck, Ecomma Agent, Qwen Relay, and the rest of the fleet's build surfaces | 15 |
| moon (hollow = open, filled = claimed, haloed = verified) | feature, orbiting the product that owns it | 61 |
| belt diamond, clustered by trade | tool — tbk-open, delegation-router, tracker_*, the fleet bench | 60 |
| outer ring arc, labeled with its rule number | process — Ship to Shares, Verification Protocol, Brand Gate… | 13 |
| comet on an eccentric orbit | workflow — apex, inception, genesis, design-engine… | 15 |

The outermost rim is the **timeline**: an engraved arc from the first recorded
milestone (2026-07-06) to now, with a notch for every dated milestone. Drag it
and the whole instrument replays honestly: products not yet begun collapse to
dashed ghost seats, the spine re-hatches, the counts fall to what was true that
day. Release (or press "now") and the present returns.

**The Spine** is the build record: all 69 milestones as vertebrae in one
continuous column, grouped into product segments ordered by when each product's
record began. Done vertebrae carry bone fill and a tick; in-progress ones glow
blue with a halo; planned ones wear engraving hatch. One luminous cord runs from
the first vertebra exactly as far as reality has reached. Features feather out of
their segment to the left as fine nerves (hollow tip = open, filled = claimed,
haloed = verified); dissection-style callouts fan to the right rail.

The two halves are joined: hover a planet and its spine segment heats; hover a
segment and its planet and moons take focus; a nerve thread crosses the divide.
Click a body to pin its dossier — one-liner, milestone score with dates, features,
home path.

**Lime marks only what is happening right now.** The live layer tails the Claude
Code transcripts, watches the tree, and polls git; a write under `sentinel/`
pulses the Sentinel planet, a `Skill: apex` call flies the apex comet, a commit
notches the record and pulses the product named in its subject. The rev/min
gauge in the header is the drive: every live event injects energy, energy
decays, the plate turns at the pace the fleet is working.


## Canonical document

**https://shares.tbk-labs.dev/tbk/tellurion.html** is the canonical HTML: purpose, strategy,
how it works, components, the ratified model, and a dated change history. Source in this repo:
`docs/tellurion-canonical.html`. Update it, and add a dated changelog row, in the same session
as any change to what Tellurion is or does.

The baked instrument (the app itself, one self-contained file from `bin/build-static.mjs`) is a
DIFFERENT artifact and lives at https://shares.tbk-labs.dev/tbk/tellurion-plate.html.


## Data provenance — nothing is a mock

The entity graph lives in `data/world-static.json`, normalized from
`data/inventory.json`, which was mined from the OCC repo itself (products from
the canonical docs and agent homes, features from the Features Ledger logs,
tools from `tools/` and `governance/fleet/`, processes from the governance
rulebook, workflows from the skill arsenal, milestones from version-stamped
commits, `verification/` folders, STATUS and handoff). Every count in the header
is a real count; the acceptance walk fails if the screen and the graph disagree.

## Architecture

Zero dependencies, Node 20+. One `node:http` server (`server.mjs`) streams a
snapshot then deltas over SSE. The browser imports the SAME reducer module the
server uses (`/lib/state.mjs` served directly), so there is one set of
semantics rather than two that drift. Four read-only feeds (`lib/sources.mjs`):
boot tree scan, per-directory fs watcher, transcript tail, git poll.
`lib/attribute.mjs` maps live activity onto the entity graph (path prefix →
planet, skill name → workflow comet, command token → belt tool, commit subject →
product). `public/orrery.js` is the canvas plate; `public/spine.js` is the SVG
column; `public/app.js` wires SSE, hover joins, the dossier, the scrub, and the
mode toggle. Read only by design: it watches, it never writes to what it draws.


## Applying it to a project

Measured 2026-08-28: the reader discovers 22 projects on this machine and one had a plan.
Without a plan the instrument falls back to drawing directories as planets, and a directory
is not a product — that fallback is the false green this instrument exists to kill.

A new project never passes through the empty state. `/inception` asks "Watch this project
live in Tellurion?" at intake, the spec stage writes `## Products` and `## Build story`
sections into `docs/PRODUCT-SPEC.md` in the shape `propose-plan` parses exactly, and approving
the spec births the plan in the same beat:

```bash
node live-artifact/bin/propose-plan.mjs ~/projects/<project> --write   # run by the spec gate, not by you
```

Every product, home, phase, step and binding in that file traces to a line of the spec you
approved; a home that does not exist in the tree is omitted, never carried. All steps start
`planned` — a newborn project has built nothing, and the file says so. It stays editable by
hand and from the panel forever after.

An existing repo gets the same two steps as before:

```bash
# 1. draft the plan from sources that already exist, then EDIT it
node live-artifact/bin/propose-plan.mjs ~/projects/<project>            # print the draft
node live-artifact/bin/propose-plan.mjs ~/projects/<project> --write    # write .tellurion/plan.json

# 2. point an instrument at it
node live-artifact/server.mjs --project ~/projects/<project> --name "<Name>" --port 8770 --host 0.0.0.0
```

`propose-plan` never invents. When the spec declares its products and build story outright it
parses those sections exactly; otherwise products come from the numbered pillar headings of a
product spec, features from `features-ledger/ledger.jsonl`, and every draft cites the file it
read. Anything it cannot source is left in a "Not yet assigned to a product" phase for you.
The plan is a declaration, so the draft is a starting point you edit rather than an answer.

Worked example, Maximus Desktop: 26 products from `product/Maximus-Desktop-Product-Spec.md`,
40 features from the ledger, 20 auto-assigned and 20 left to assign.


## Run

```bash
# the TBK universe (as deployed on Forge :8769, supervised — see systemd/tellurion.service)
#   systemctl --user status tellurion    # the deployed instance; start it this way, not by hand
node server.mjs --project /home/wassim/projects/Organizing-Claude-Code --name "TBK Labs" --universe --port 8769

# the Fleet Deck instrument (genesis mode, :8768, also supervised)
#   systemctl --user status tellurion-fleet-deck
# QUOTE a --name containing a space, or the parser takes only its first word.
node server.mjs --project ~/projects/fleet-deck --name "Fleet Deck" --port 8768 --host 0.0.0.0

# a brand-new project, watched from its first minute (genesis mode, automatic)
node /home/wassim/projects/Organizing-Claude-Code/live-artifact/server.mjs --project ~/projects/my-new-thing --port 8770

# demo fixture (deterministic, used by the walk): add --demo --speed 6
```

Plate (light) is the default per the standing design preference; Observatory
(dark) is the toggle, remembered per browser.

## Verify

`node verify/walk.mjs` boots a demo server, opens a real Chromium, and walks 18
steps end to end: census equals graph, 69 vertebrae, done counts exact, honest
scrub to a past date and back, live attribution onto sentinel/zangetsu/ledger,
both modes rendered and captured, zero console errors. `totalFails` must be 0.
Latest run: 18/18, evidence in `verify/last-walk/` and
`verification/2026-08-24-live-artifact-rebuild/`.

## Regenerate the graph

The inventory is a point-in-time mining of the repo (generated 2026-08-24). To
refresh: re-run the recon (products, features, tools, processes, workflows,
milestones) into `data/inventory.json`, then `node` the normalizer (see
`data/world-static.json` header) — or edit `world-static.json` directly; the
server loads it at boot.

## Following a project

The unit is the **project**, never one chat. A chat is a fragment: it opens,
does a piece of work and ends, and the next one carries on the same codebase.
The project is the thing with a beginning, a middle and a shape, so that is
what the instrument follows.

Following a project means both halves at once: the **codebase** (its file tree
and its git history) and **every editor chat on it**, which is where the live
changes come from.

- A project is identified by its **git root**, so `repo/sub/dir` is folded into
  `repo` rather than listed as its own project.
- **Boot** follows the project it was pointed at and watches **all** of that
  project's session directories. `/health` lists them under `transcriptDirs`.
- **The picker** (the button in the bar) lists projects worked on recently, live
  ones first, the current one preselected, each showing its branch, how many
  chats it carries, how many are open now, and the last thing the person
  actually typed. Hook output, system reminders and tool ids are filtered out,
  because none of them is something a person said.
- **Picking one re-points every feed** with no restart: the file watcher, the
  transcript tail and the git poll are all torn down and rebound, and the world
  is rebuilt from scratch. Carrying the previous project's bodies across would
  show a sky that never existed.
- A window is identified by its transcript's own `entrypoint` field:
  `claude-vscode` is a VS Code window, `claude-desktop` the desktop app, anything
  else a terminal.

Measured on Forge, 2026-08-27: discovery of 40 windows takes **38 ms**, a real
edit in the watched tree reaches the browser in **160 ms**, and a transcript
record reaches it **1 ms** after it lands (400 ms poll ceiling).

    GET  /api/projects      what could be followed
    POST /api/watch {id}    follow one of them (the id is the project path)
    node verify/follow-walk.mjs --project <path>    the acceptance walk

An id that discovery did not just return is refused, so a caller can never hand
the server an arbitrary path to open. `/api/instances` is kept as an alias.

## The plan, and the join between the two halves

The spine used to be built from a chat's TodoWrite list. That is a session
artifact: it dies with the chat and every row carries the date it was typed, so
on an existing project it produced a "plan" of thirty one steps all dated the
same day, which is a transcript of one afternoon rather than a plan.

The plan is a **declaration** now. It lives in the repo at
`.tellurion/plan.json`, it is edited by hand or through the instrument, and it
is the same plan tomorrow.

    {
      "products": [{ "id": "reader", "name": "The reader" }],
      "phases": [{ "title": "Build", "steps": [
        { "id": "s1", "title": "Discover projects", "status": "done",
          "produces": { "of": "reader" } }
      ]}]
    }

**The two halves are one record.** A declared product is a planet. A step that
produces a feature is a moon of it, carrying the STEP'S OWN id and title. So
renaming a step in the file renames its moon on the plate, live, with no reload.
Two copies of a name would drift apart on the first edit.

**Declared beats guessed.** With a plan, a directory never invents a planet.
Without one the spine is honestly empty and the core says `no plan declared`; it
is never given a plan it does not have.

## The chain of custody

Three parties, three tiers, and **the rings count the sign-offs**:

| mark | tier | who said so |
| --- | --- | --- |
| hollow | open | nobody has spoken yet |
| filled | claimed | **the builder**, the agent that wrote it |
| one ring | verified | **the judge**, Sentinel or whatever gate ran |
| two rings | fully-verified | **the operator**, a human, by hand |

**No party can grant its own tier**, so the three live in three files.
`.tellurion/plan.json` carries claims, because the plan is what the builder
writes. `.tellurion/verdicts.json` is the judge's own record. `.tellurion/accepted.json`
is a deliberate act by the operator, stamped with who and when. If all three
were one file, editing it would forge the whole chain, and a badge you can type
is not evidence of anything.

**The ladder is climbed in order and never skipped.** A judge cannot verify what
nobody claimed; the operator cannot accept what no judge passed. A stray verdict
file can never promote work that was never built. A verdict that does not PASS,
or does not name its judge, is not a sign-off.

**A product sits at its LEAST advanced feature.** One unproven moon keeps the
whole product back, which is the point: a product is not finished while a part
of it is unexamined.

    POST /api/accept {step, by}          the operator signs
    POST /api/accept {step, undo:true}   and can take it back

**Attribution joins them in time.** Whatever step is `active` is the step in
hand, and work landing while it is in hand is credited to it. The claim is
deliberately narrow: this body was produced while that step was active. It is a
record of when, not a guess about what the words mean, which is why it holds up
when the plan is written in whatever language the operator likes.

    GET  /api/plan          the declared plan
    POST /api/plan          save it (writes the same file you would edit)
    node verify/plan-walk.mjs      the acceptance walk
