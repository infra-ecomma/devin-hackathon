# Tellurion — battle test, 2026-08-27

Run from the operator's seat: a brand new repo, a hand-written plan, hostile files, a real
browser, and the network. Three passes — my own walk, a six-lens parallel hunt (81 findings),
and a fresh audit against the already-fixed code (22 bugs + 11 edge cases).

**The single worst thing found:** hovering a step the judge had FAILED, the instrument said in a
full sentence *"The builder says it is done. Nobody has checked it."* A judge had checked it, and
rejected it. `readVerdicts` dropped every non-pass row, so from that line on "the judge failed
this" and "no judge has looked" were the same thing. That is the screen stating the opposite of
the truth on the exact claim the product exists to prove.

**Second worst, and it is a whole class:** on a brand new project the instrument was a mandala of
88 TBK Labs fleet entities and zero marks belonging to him, with the header counting them as his
project's census, and a right-hand panel that rendered as a single blue `!` glyph.

---

## What was fixed, and how each is held

Every item below has an assertion in `verify/battle-walk.mjs` (72 checks). Four had negative
controls run and recorded: the length-based ticker guard, the first-N ring lighting, the removed
plan-write refusal, and the removed network guard each fail exactly their own assertions.

### A. The screen stops telling the truth over time
| # | What it did | Root cause |
|---|---|---|
| 1 | The ticker froze at event 240 forever, with a frozen clock, while `LIVE` stayed lit. Proven in a browser: 520 events in, the strip still read `12:19:35 built f239.js`. | The ticker is a ring buffer, so its length stops changing when it fills. The client watched the length. |
| 2 | Harness plumbing (`<command-message>`, hook output, interruption notices) travelled the wire and reached the published archive. | Filtered in the browser only. Now refused in the reducer both sides run. |
| 3 | Every fault read `fault: tool error`. | `label \|\| detail` where `label` is always the literal `'tool error'`, so the detail arm was unreachable. |
| 4 | Two thirds of the ticker was the word `Bash`. | It named the tool instead of the work. |

### B. Day zero
| # | What it did | Root cause |
|---|---|---|
| 5 | A new project rendered 88 fleet entities and 0 of his, with `60 TOOLS 13 PROCESSES 15 WORKFLOWS` in the header as project counts. | The standing bench is imported unconditionally and was presented in one undivided row. Now ruled into two groups, labelled `FLEET BENCH`. |
| 6 | The spine was a lone blue `!` — a 10px cord stub with nothing on it. | No empty state. Now an on-ramp that names the file, shows a starter plan, and writes it on one press. |
| 7 | The editor feed never attached on a new project, for the life of that project, with nothing saying so. | Session directories were resolved once at boot; a project with no chat yet has none. Now swept. |
| 8 | The bar said `Choose a project` while following one. | Same cause. |

### C. The chain of custody — the product's central claim
| # | What it did | Root cause |
|---|---|---|
| 9 | A judge's FAIL was indistinguishable from silence, and the note was thrown away. | `readVerdicts` dropped every non-pass row. |
| 10 | The spine — the panel he actually reads — carried no custody at all. | Plan phase segments were built with `feats: []`. Now every row wears the tier mark. |
| 11 | Renaming a step silently voided its verdict and acceptance. He was promised a rename renames the moon, so renaming is a normal act. | Ids were derived from the title. Now derived from position; the sign-off goes stale **loudly** instead of evaporating. |
| 12 | The BUILDER alone could restore the operator's top tier by flipping a step `done → planned → done`. | The acceptance row survives, and no hash can see a claim withdrawn and re-made. Now the server records the withdrawal it observes. |
| 13 | Two steps sharing an id shared one sign-off. | Ids were not made unique. Now uniqued and the collision reported. |
| 14 | Saving a file minted the `claimed` tier. | Genesis features were created `claimed`. The filesystem is not a builder. |
| 15 | A product read `fully-verified` with two thirds of it not started; steps with no `produces` were outside the ladder entirely and `/api/accept` answered `tier: null`. | Those steps got no body. Now every step in a phase that plainly belongs to a product gets one. |
| 16 | `POST /api/accept` answered `ok:true` for a step not in the plan, and for one no judge had passed — writing a row and changing nothing. | No validation. Now 404 / 409 with the reason, and `force:true` reports the tier it actually reached. |
| 17 | The top rung — his own act — could only be reached by curl or by hand-editing JSON. | Never wired to a control. Now a button on the feature card. |

### D. The plan file
| # | What it did | Root cause |
|---|---|---|
| 18 | `POST /api/plan {"oops":true}` deleted the whole declaration and returned `ok:true`. | No guard. Now 409 with the count it refused to erase, plus a `.bak` on every write. |
| 19 | `null`, `[]` and `"a string"` parsed cleanly and rendered as "no plan declared yet", under a button offering to overwrite them. | Only `JSON.parse` throwing was guarded. |
| 20 | A broken-file banner and the starter-plan offer stacked together, and the offer was live on the one file that must never be overwritten. | Both branches ran. |
| 21 | Plan trouble was never said anywhere on screen. | Computed, never rendered. |

### E. Not a write primitive on the network
| # | What it did |
|---|---|
| 22 | Bound `0.0.0.0` by default, with no authentication anywhere. Anyone on the tailnet could enumerate all 31 project paths **plus the last thing he typed in each**, overwrite any `.tellurion/plan.json`, re-point the instrument, and accept work in his name. Demonstrated: wrote `"project": "PWNED"` into a real plan. |
| 23 | `/api/world` and `/events` carried the same prompts, so guarding the picker protected the copy and published the original. |
| 24 | Any website he visited could write to the loopback instrument with a simple cross-site POST. |
| 25 | Opening the legend destroyed the API key — the toggle and the key shared `localStorage['la-key']`. *(Introduced by me during this session and caught by the second audit.)* |
| 26 | A 401 rendered as "No projects worked on recently" — he was told his work did not exist. |

**Now:** loopback by default; `--host 0.0.0.0` mints a stable key, prints the link, and guards
every door that carries his work; writes require his own page or the key. Path traversal was
tested and **holds** — five encoded attempts all 404.

### F. It stays up, and keeps watching
| # | What it did |
|---|---|
| 27 | One unauthenticated request with a malformed `Host` header killed the whole instrument. |
| 28 | `SIGTERM` never stopped it while a tab was open, so restarts left zombies. |
| 29 | `mkdir -p a/b` made `b` permanently invisible — nothing under it was ever seen again. |
| 30 | Switching projects mid-poll filed the previous repo's commit into the new one. |
| 31 | 60 concurrent `/api/projects` calls froze the live screen for 15.3 seconds. |

### G. Numbers that contradicted each other
| # | What it did |
|---|---|
| 32 | The same screen read `76/90 plan steps done` and `15/20` three inches apart. |
| 33 | The header counted milestones the spine deliberately refuses to draw. |
| 34 | The legend counted every agent ever seen and called them all "at work". |
| 35 | The plan ring lit the FIRST N segments, so it named the wrong steps as finished, and the charge painted over unstarted work. |
| 36 | The Logic tab — the one surface whose job is to be trustworthy — hardcoded "10 flagships", "the Features Ledger" and directories becoming planets. None had been true since the plan took over. |
| 37 | The Key omitted agents, the core's plan ring, the step in hand, and the motion table he asked for. It also told him to drag a rim jewel that genesis mode disables. |
| 38 | The header overprinted the census at 1280x800; the spine score was clipped and then crowded. |

### H. The gates themselves
| # | What it did |
|---|---|
| 39 | `walk.mjs` failed with "0/3 passed" because another service held its hardcoded port — a harness fault reported as a product failure. All five gates now find a free port. |
| 40 | Two assertions encoded bugs: `follow-walk` step 3 demanded the literal path back (against the ratified "a project is a git root"), and `walk` step 19 asserted a milestone count that nothing draws. |

---

## Not fixed, named rather than glossed

- **400 features on one product draw a hairball** that swallows the core. Moons have two shells and no cap.
- **The replay half of the instrument is dead** for every project except the OCC root: `nearRim` and `dateAtPoint` both return null in genesis mode, which is every real target.
- **`world.notches`, `world.stepWork` and `session.todo*`** are computed, deduped and shipped in every snapshot, and drawn nowhere. `stepWork` is the attribution join the architecture is built on.
- **Agent labels collide** with the process ring labels; agent threads bury the planet they point at.
- **Ultrawide does not scale** — at 3440x1440 the mandala is the same size as at 1920 and 61% of the plate is blank.
- **1024x768 is unusable**; there is no breakpoint between 1024 and 1180.
- **Partial plan loss is accepted** — only total erasure is refused, so a body that drops 4 of 5 steps writes cleanly.
- **`world.agents` and `world.stepWork` are never pruned**, so the snapshot only grows.
- **Genesis stops at 12 features per directory** silently.
- **Deleted files never leave the plate**; the 48-hour commit horizon is silent.
- **Product motion, ledgers, scars and job cadence** are in the ratified grammar and are not built. The legend now says so on its own face rather than describing them as though they were.

---

## Evidence

- `verify/battle-walk.mjs` — 72 assertions, all green
- Full suite: `plan-walk 26` · `follow-walk 17` · `core-plan-walk 8` · `agent-walk 11` · `walk 22` · `battle-walk 72` = **156**
- Negative controls recorded for the ticker guard, the ring lighting, the plan-write refusal and the network guard; all four files restored byte-identical (`md5sum -c`)

---

## Follow-on, same day: the middle rung fills itself

Three of the "not fixed" items above turned out to be one piece of work. The chain of custody
stopped at `claimed` unless somebody hand-edited JSON, and the record that could place a real
verdict — which files were written while a given step was in hand — lived only in memory, died
with the process, and was drawn nowhere.

- **`lib/work.mjs`** makes the attribution record a real artefact at `.tellurion/work.json`,
  merged rather than replaced across restarts. It answers the one question a bridge needs:
  which step do these files belong to. **Unambiguous or nothing** — a receipt whose files span
  two steps is refused with both named, because guessing there puts a real judge's name on work
  the judge never looked at.
- **`bin/sentinel-ingest.mjs`** reads Sentinel's own receipts and writes `verdicts.json`. Every
  row carries its provenance (the receipt, the files that matched), and the fingerprint is taken
  from the step **as it is now**, so the staleness rules fire the moment anyone edits it.
- **The feature card draws all of it** — the files, the commits, and what the judge was given.

**Reading against this machine's 4,788 real receipts corrected two assumptions I had made from a
fixture.** The verdict values are `judged-pass` / `judged-fail`, not `PASS` / `FAIL`. And
`judged_unchanged` is a separate list carrying a **standing** pass from an earlier receipt — used
as fresh evidence it would let one old judgement re-assert itself on every run, so it is named in
the refusals instead of consumed. Of the 4,788: 3,363 `no-claim`, 762 `claim-nothing-to-judge`,
1 `judge-unreachable`, 424 that re-examined nothing, and **238 real judgements naming 649 files**.
The judge has covered **87 files under this repo**, so those will place themselves as soon as a
step is marked active and work accumulates against it.

**One real attribution error fixed alongside it:** the git poll replays 48 hours of history at
boot, and every one of those commits was being credited to whatever step happened to be active.
Survivable while nothing read the record. Not survivable once a judge's verdict routes through it.

Gate: `battle-walk` group J, 11 assertions (83 in that file, **167 across the suite**). Negative
control recorded — letting the join pick a best match instead of refusing fails exactly J5, file
restored byte-identical.
