**TBK Labs** · Curated Kit

---

# AI Command Center Design

_5-phase design workflow for AI agent dashboards / consoles / control planes. Persona → use cases → layout → component library → wireframe spec. **Distinct from generic admin dashboards — built for human oversight of autonomous agents.**_

**CATEGORY** Workflows · Product  •  **TRIGGER** `/ai-command-center`, `design AI agent console`, `agent dashboard layout`  •  **RATING** ★★★★☆ (9/10)  •  **STATUS** Curated

---

## Why It Earns the Curated Bar

- **Persona-driven (operator vs developer vs auditor).** Names canonical "we designed one dashboard for all, ops users drowned in dev details, devs missed ops signals" persona-blind failure.
- **Approval/intervention surface first.** Names canonical "agents ran autonomously, ops had no easy way to intervene, paged everyone at 2am" no-intervention-surface failure.
- **Real-time monitoring native.** Names canonical "we built daily-batch dashboards, agents had been failing for 6h before anyone noticed" no-real-time failure.

---

## What It Does

5-phase command-center design pipeline:

**Phase 1 — Persona Mapping.**
Identify primary personas:
- Operator (24/7 oversight, intervenes on alerts)
- Developer (debugs agent behavior, tunes prompts)
- Auditor (reviews decisions for compliance)

**Phase 2 — Use Case Catalog.**
Per persona, top 5 use cases:
- Operator: monitor active runs / approve human-in-loop / kill runaway agent / acknowledge alert / review last 24h
- Developer: drill into trace / view tool calls / replay failed run / compare prompt versions / inspect logs
- Auditor: filter by decision type / export decisions / verify compliance / track approvals / generate report

**Phase 3 — Layout Sketches.**
- 3-pane vs 2-pane decision
- Real-time updates section
- Drill-down navigation pattern

**Phase 4 — Component Library.**
- Run cards (status / progress / metrics)
- Decision timeline (trace view)
- Alert banner (severity + action)
- Approval modals
- Filters + search
- Export controls

**Phase 5 — Wireframe Spec.**
- Per persona: dashboard layout
- Component placement
- Interaction map (clicks, drills, exports)
- Real-time refresh strategy

**Hard rules:**
- Persona-first (not one-size-fits-all).
- Intervention surface in every persona view.
- Real-time updates default.
- Audit trail accessible.

---

## How to Use

1. Specify product context (what agents do).
2. Invoke `/ai-command-center`.
3. Workflow walks 5 phases.
4. Output: wireframe spec ready for implementation.

---

## What NOT to Do

- **Don't design one-dashboard-for-all.** Persona mismatch destroys UX.
- **Don't bury intervention behind 3 clicks.** Operators need 1-click.
- **Don't batch updates.** Real-time required.
- **Don't conflate with generic admin dashboard.** AI agent oversight has unique requirements.

---

## Sample Output (command center for customer-support agent system)

```
[Product: 3-agent customer support system (triage / resolver / escalator)]

Phase 1 — Personas
  Operator (CS lead): monitors agents, intervenes on escalations
  Developer (eng): tunes agent prompts, debugs failures
  Auditor (QA + legal): reviews agent decisions for accuracy + compliance

Phase 2 — Use Cases
  Operator (top 5):
    1. See active ticket queue in real-time
    2. View pending escalations + assign human
    3. Acknowledge alert (rate-limit, low confidence, etc.)
    4. Kill runaway agent (rare but needed)
    5. Review last 24h ticket throughput

Phase 3 — Layout
  3-pane:
    Left: queue (real-time ticket list with agent status)
    Center: focused ticket (agent reasoning + chosen response)
    Right: action panel (approve / override / escalate)

Phase 4 — Components
  TicketCard (status badge / agent confidence / waiting time)
  AgentTrace (timeline of decisions with tool calls)
  ConfidenceMeter (low/med/high with color coding)
  EscalationButton (1-click to human queue)
  KillSwitch (modal-confirmed; logs reason)
  AlertBanner (top of page, dismissible per alert)

Phase 5 — Wireframe Spec
  Per persona, output a wireframe + interaction map:
  
  Operator dashboard:
    Top: AlertBanner (active alerts, 1-click dismiss)
    Left pane: TicketCard list (real-time, sorted by waiting time)
    Center: selected TicketCard expanded with AgentTrace
    Right: action buttons (Approve / Override / Escalate / Kill)
    Bottom: throughput chart (last 24h)
  
  Developer dashboard:
    Different layout, focused on traces + tool calls + log inspection
    Replay button per failed run
  
  Auditor dashboard:
    Decision-filtered list (by type, date, agent)
    Export controls (PDF / CSV / JSON)
    Compliance flags column
  
  Real-time: WebSocket updates < 2 sec latency
  Refresh: incremental + visual indicator on update
```

```bash
# Invoke
> /ai-command-center product=customer-support agents=[triage,resolver,escalator]
```

5-phase command-center design: 3 personas + 15 use cases + 3-pane layout + 6 components + per-persona wireframe spec. Operator gets 1-click intervention; developer gets trace replay; auditor gets compliance filters.

---

## Quick Reference

| Property | Value |
|---|---|
| **Workflow name** | ai-command-center-design |
| **Category** | Workflows · Product |
| **Rating** | ★★★★☆ (9/10) |
| **Trigger** | `/ai-command-center` |
| **Phases** | 5 (Personas / Use Cases / Layout / Components / Wireframe Spec) |
| **Default Personas** | Operator / Developer / Auditor |
| **Hard Gates** | Persona-first / 1-click intervention / real-time updates / audit trail |
| **Bundle** | `WORKFLOW.md` + `README.md` + `ai-command-center-design.docx` |
| **Pairs With** | `dashboard-decision-tree` workflow · `persona-decision-tree` workflow · `product-ux-audit` workflow · `set-up-multi-agent-config` workflow · `datadog-ai-agents-console` plugin |

---

**TBK Labs** · Curated Kit · 2026-05-14

Vault note: [[workflow-ai-command-center-design]]
