# The demo

A two-minute story an audience can follow with no context: a plan being born, then
the same plan being built, claimed, checked, rejected and accepted, drawn live on the
orrery.

Every file under `demo/` holds invented data. None of it describes a real project, and
the plate says so on its own face: the entity graph carries `"demo": true` and the bar
prints a DEMO DATA badge whenever it is loaded.

## Run it

```bash
cd packages/tellurion

# live, looping — for a screen behind a stand
node server.mjs --project demo/project --world demo/data/world-static.json \
                --story demo/story.mjs --name Lantern --port 8805 --host 0.0.0.0

# then open  http://<this-host>:8805/?skin=rustic

# record it: Inception prologue plus the orrery, one continuous take
node demo/record.mjs                    # rustic light (default)
node demo/record.mjs --skin plate       # the cold register
node demo/record.mjs --speed 2          # the story at double time
```

`record.mjs` writes `demo/last-recording/`: the video, 21 stills at the beats worth
having as slides, and `recording.json` carrying what the plate actually held at each
one. It exits non-zero if any of its eight checks fail, so a recording that shows the
wrong thing is a failure rather than a file somebody has to notice.

## What is in it

| file | what it is |
| --- | --- |
| `plan-full.json` | the master plan: 4 products, 14 features, 30 steps |
| `project/.tellurion/` | what the story writes: plan, verdicts, acceptances, usage |
| `data/world-static.json` | the invented standing bench: 29 tools, 11 ring arcs, 7 comets |
| `story.mjs` | the timeline, about 78 seconds, four acts |
| `record.mjs` | boots its own server, drives the browser, checks its own output |
| `inception/index.html` | the Inception seven-stage story, used as the prologue |
| `build-demo.mjs` | regenerates the settled sign-off files outside the story |

Lantern is a grocery-delivery app. Its products are things a customer would name (Shop
Front, Checkout, Delivery Tracker, Customer Account). Its features are parts of those
things: Product search, Card payment, Live map. Its steps are the work: "Draw the
search box", "Hold the chosen hour so nobody else takes it". That is the whole naming
rule. Someone meeting this project for the first time should be able to read any body
on the plate and know what it is.

## The story is not an animation

This matters more than anything else here. `story.mjs` writes the files a real session
writes, `plan.json` and `verdicts.json` and `accepted.json`, and feeds the record
shapes a real transcript feeds. The server's ordinary watchers pick them up and the
browser receives ordinary deltas. No body on the plate is drawn from a script.

So if the instrument were broken, the demo would show it broken. That is the property
that makes a demo worth showing, and it is why the story writes real files rather than
posing the picture.

Because it writes, it is fenced. `--story` refuses to run in any directory without a
`.tellurion/DEMO-PROJECT` marker, so pointing it at a real repo stops it rather than
overwriting somebody's plan.

## The four acts

1. A blank sky. No plan declared. The standing bench is there and the project is not.
2. The plan, product by product. Four writes, four planets. Every feature is declared
   before any of it is built, which is the point of writing a plan at all.
3. The work. Six agents dispatched, steps taken in hand and finished, commits landing
   as shooting stars, one fault, the Features Ledger lighting on every to-do.
4. The ladder. The builder claims eleven parts. A judge passes seven and rejects one:
   the receipt email, which arrives with the right total and the previous order's
   items. Broken Promises turns red and reaches for it. The operator then signs five,
   and the plate ends holding one broken promise in plain view.

The rejection is the whole demo. An instrument that reports green because a builder
said green has told you nothing. This one shows what happened when somebody checked.
