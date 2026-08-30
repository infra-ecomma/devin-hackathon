# Standing Operator Rules

enforced_by: templates/.claude/hooks/pin-feedback-memory.sh
**Status:** locked 2026-05-23 (agent-forcing-functions implementation)
**Family:** agent reliability / forcing-functions
**Source:** `dev_docs/kit-feedback/pending/2026-05-23-agent-forcing-functions-hooks-impl.md`
**Enforced by:** `templates/.claude/hooks/pin-feedback-memory.sh` (SessionStart, reads this file as canonical source)

---

## Purpose

These 7 rules are injected at the start of every Claude Code session by the `pin-feedback-memory.sh` SessionStart hook. They exist because the documentation layer (memory files, CLAUDE.md, agents.md) is read inconsistently — the agent "rushes, assumes, jumps to conclusions" without checking what it wrote the session before.

The hook injects these rules as `additionalContext` so they appear in every session regardless of whether the agent chooses to read any file.

**This file is the canonical source.** The hook reads from `$CLAUDE_HOME/STANDING-RULES.md` (user override) or this file (kit default). Do not bake these rules inline in the hook — edit this file instead.

---

## The 7 Standing Rules

1. **10/10 only.** Always recommend the BEST fix. Never offer cheap fallbacks. Reject band-aids when a product fix exists. Soft-fails on client-facing surfaces = forbidden.

2. **Never claim certainty without evidence.** Before saying "verified", "confirmed", "legitimate", "acceptable", "I know", "this is": name THREE verification artifacts (file:line, commit SHA, command + output). Otherwise say "I have not verified".

3. **Frustration signals (CAPS / multiple !!! / "frustration"/"angry"/"wasted") → same turn: ack + kit-feedback file + then act.** Do NOT write more memory files in response — that is the anti-pattern.

4. **HALTED/STOP/no-commits-30min during /loop = debug session, not status report.** Test accts, tail jsonls, kill stale processes, commit uncommitted fixes manually, relaunch.

5. **Pattern judgments require N≥3 instances + cross-reference to prior memory.** Do not declare a single commit "legitimate" without checking the trend.

6. **ScheduleWakeup is NOT an SLA.** Do not promise specific re-check intervals. Build self-healing into the system; do not depend on agent re-check cadence.

7. **Named skill unavailable → escalate, don't substitute.** When the operator names a specific slash-skill (`/first-look`, `/kit`, `/gsd`, …), resolve it against the invocable set FIRST. If it returns `Unknown skill` / is not invocable, STOP and say so plainly in that same turn — emit `SKILL-UNAVAILABLE: <name>` plus the alternative path — BEFORE producing any large substitute artifact. NEVER hand-build a version of a named-but-uninvocable skill's deliverable, even faithfully to its convention: that reads as passing off a substitute as the skill's output and destroys trust. A one-line convention note buried under a big build is NOT an acknowledgement.

---

## Why these rules exist

Operator verbatim 2026-05-23T15:10Z: "inserting things into memory.md and claude.md and agents.md doesn't really help. because you never read. this is my problem with you. you rush, you don't read, you assume, you jump to conclusion, you are always veeeery eager to jump and say 'I know' while 80% of the time you don't know you're just assuming."

The agent had written 17 `feedback_*.md` memory files over 24 hours naming the same reliability gaps. The documentation layer had plateaued — the agent kept making the same mistakes because it wasn't reading what it had written. The hook (Fix D) closes this loop mechanically.

---

## Mechanical enforcement

| Mechanism | Event | Effect |
|-----------|-------|--------|
| `templates/.claude/hooks/pin-feedback-memory.sh` | SessionStart | Injects these rules + 5 most-recent `feedback_*.md` entries into every session as `additionalContext` |
| `templates/.claude/hooks/epistemic-gate.sh` | PreToolUse (Bash) | Advisory reminder when Bash description contains certainty language ("verified", "confirmed", "I know", etc.) |

Both hooks ship in `Master-Starter-Kit/templates/.claude/hooks/` and are wired via `Master-Starter-Kit/templates/.claude/settings.json` (the kit's settings template).

---

## How to override per project

1. Copy `Master-Starter-Kit/templates/.claude/hooks/pin-feedback-memory.sh` to `<project>/.claude/hooks/`.
2. Create `~/.claude/STANDING-RULES.md` (user-level) — the hook checks this path first and uses it if present.
3. Or, edit this file (`Master-Starter-Kit/RULES/STANDING-OPERATOR-RULES.md`) to update the kit-wide defaults.

Projects that need additional standing rules should append them to the user-level `STANDING-RULES.md` rather than editing this file, so kit updates flow through cleanly.

---

## Related

- Proposal: `dev_docs/kit-feedback/pending/2026-05-23-rules-not-read-need-forcing-functions.md`
- Implementation record: `dev_docs/kit-feedback/pending/2026-05-23-agent-forcing-functions-hooks-impl.md`
- Kit-feedback cross-references: May-22/May-23 filings all name the same gap from different angles
