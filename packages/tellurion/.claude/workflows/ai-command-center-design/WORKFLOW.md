---
name: ai-command-center-design
description: "Reference architecture for embedding an AI assistant in a dashboard — Claude Agent SDK with 12 PM tools, slide-out chat panel, SSE streaming, ChatMessage Prisma persistence. Triggers on: AI command center, embedded AI assistant, Claude Agent SDK in dashboard, AI chat panel, AI tool use design, agent SDK architecture."
phase: 5c
status: Reference Architecture
depends_on: 5a-dashboard-app
intentional_template: true
---

# ai-command-center-design — AI Assistant in a Dashboard (Reference Architecture)

**Date:** 2026-03-31
**Status:** Approved
**Phase:** Universal Planning Engine — Phase 5c (sub-phase 3 of 4)
**Location:** `Master-Starter-Kit/65-dashboard/` (extends existing app)
**Depends on:** Phase 5a (dashboard app) — COMPLETE

## Summary

An AI-powered project management assistant embedded in the dashboard as a slide-out chat panel. Uses the Claude Agent SDK with 12 project management tools. Streaming responses via SSE. The agent can read project data, trigger syncs, manage risks/milestones, and advise on document generation and research — all through natural language.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| SDK | Claude Agent SDK | Structured agent loop with tool use, multi-turn conversations |
| Tools | 12 project management tools | Covers read/write for all project entities + advisory actions |
| Chat UI | Slide-out panel | Available from any dashboard page, doesn't disrupt workflow |
| Streaming | SSE via API route | Real-time token + tool result streaming, good UX |
| Persistence | ChatMessage model in Prisma | Conversation history per project |

## Architecture

```
65-dashboard/src/
├── app/api/ai/
│   └── chat/route.ts                  # Streaming API — Agent SDK loop
├── lib/ai/
│   ├── agent.ts                       # Agent config (model, system prompt, tools)
│   ├── system-prompt.ts               # Dynamic system prompt with project context
│   └── tools/
│       ├── index.ts                   # Tool registry
│       ├── project-status.ts          # get_project_status
│       ├── sync-project.ts            # sync_project
│       ├── list-documents.ts          # list_documents
│       ├── generate-document.ts       # generate_documents (advisory)
│       ├── list-communications.ts     # list_communications
│       ├── send-communication.ts      # send_communication
│       ├── list-risks.ts              # list_risks
│       ├── update-risk.ts             # update_risk_status
│       ├── list-milestones.ts         # list_milestones
│       ├── update-milestone.ts        # update_milestone
│       ├── research.ts                # research_topic (advisory)
│       └── run-kit-command.ts         # get_kit_status
├── components/ai/
│   ├── chat-panel.tsx                 # Slide-out panel (client)
│   ├── chat-messages.tsx              # Message list with streaming
│   ├── chat-input.tsx                 # Input + send button
│   ├── tool-result-card.tsx           # Inline tool result display
│   └── chat-toggle.tsx                # Header toggle button
```

**New files: ~18. Modified: schema.prisma, layout header.**

---

## 1. Database Addition

```prisma
model ChatMessage {
  id        String   @id @default(cuid())
  role      String   // user | assistant | tool
  content   String
  toolName  String?
  toolInput String?
  projectId String
  project   Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
```

Add `chatMessages ChatMessage[]` relation to Project model.

---

## 2. Agent Configuration

### System Prompt (`lib/ai/system-prompt.ts`)

Dynamic system prompt built from project context:

```
You are the AI Command Center for {{PROJECT_NAME}}, a {{PROJECT_TYPE}} project in the {{DOMAIN}} domain.

Current status:
- Progress: {{PROGRESS}}%
- Budget: {{BUDGET_SPENT}} of {{BUDGET_TOTAL}} ({{BURN_RATE}}% burn)
- Timeline: {{TIMELINE_STATUS}}
- Risk Level: {{RISK_LEVEL}} ({{CRITICAL_COUNT}} critical, {{HIGH_COUNT}} high)
- Work Areas: {{WORK_AREA_COUNT}} ({{COMPLETE_COUNT}} complete)
- Documents: {{DOC_COUNT}} exported
- Communications: {{COMMS_COUNT}} ({{DRAFT_COUNT}} drafts pending)

You can help the user by:
- Reading and summarizing project data
- Triggering filesystem syncs to refresh dashboard data
- Managing risks (updating status)
- Managing milestones (marking complete)
- Managing communications (marking as sent)
- Advising on document generation and research

Always be concise and actionable. When you use a tool, explain what you did and what the result means.
```

### Agent Setup (`lib/ai/agent.ts`)

```typescript
import Anthropic from "@anthropic-ai/sdk";

// Configure agent with:
// - model: claude-sonnet-4-6 (fast, capable enough for tool use)
// - max_tokens: 4096
// - tools: all 12 from tools/index.ts
// - system: dynamic prompt from system-prompt.ts
// - streaming: true
```

---

## 3. The 12 Tools

Each tool is a TypeScript file exporting: name, description, input_schema (JSON Schema), and an execute function.

| # | Tool | Input | Output | DB Operation |
|---|------|-------|--------|-------------|
| 1 | `get_project_status` | `{ projectId }` | Project overview with all metrics | Read |
| 2 | `sync_project` | `{ projectId }` | Sync result summary (files scanned, records updated) | Read+Write |
| 3 | `list_documents` | `{ projectId, format? }` | Array of documents with status | Read |
| 4 | `generate_documents` | `{ projectId, milestone }` | Instructions for running document engine (advisory) | None |
| 5 | `list_communications` | `{ projectId, type?, status? }` | Array of communications | Read |
| 6 | `send_communication` | `{ communicationId }` | Updated communication record | Write |
| 7 | `list_risks` | `{ projectId, severity? }` | Array of risks | Read |
| 8 | `update_risk_status` | `{ riskId, status }` | Updated risk record | Write |
| 9 | `list_milestones` | `{ projectId, status? }` | Array of milestones | Read |
| 10 | `update_milestone` | `{ milestoneId, status, actualDate? }` | Updated milestone record | Write |
| 11 | `research_topic` | `{ topic, dataType }` | Instructions for using research engine (advisory) | None |
| 12 | `get_kit_status` | `{ projectId }` | Kit version, init date, project type, config | Read |

**Advisory tools** (4, 11): Don't execute the action directly. They return instructions the user can follow in Claude Code. This is because the document engine and research engine run in Claude Code, not in the web dashboard.

---

## 4. Streaming API Route

`POST /api/ai/chat`

**Request:**
```json
{
  "projectId": "abc123",
  "message": "What's the current risk level?"
}
```

**Response:** Server-Sent Events stream with chunks:
```
data: {"type":"text","content":"Let me check"}
data: {"type":"tool_use","name":"list_risks","input":{"projectId":"abc123"}}
data: {"type":"tool_result","name":"list_risks","result":{...}}
data: {"type":"text","content":"You have 6 risks: 1 Critical..."}
data: {"type":"done"}
```

**Flow:**
1. Auth check (session required)
2. Load project, verify ownership
3. Load conversation history from ChatMessage table (last 20 messages for context)
4. Build system prompt with current project data
5. Call Agent SDK with message + history + tools
6. Stream response — for each chunk:
   - Text delta → send as SSE `text` event
   - Tool use → execute tool, send `tool_use` then `tool_result` events
7. After completion, persist all new messages to ChatMessage table
8. Send `done` event

---

## 5. Chat Panel UI

### ChatPanel (`components/ai/chat-panel.tsx`)

- Slide-out from right edge, w-[28rem], full height
- Dark header: "AI Command Center" + project name + close button
- Message area: scrollable, auto-scrolls to bottom on new messages
- Input area: text input + send button at bottom
- "Clear conversation" button in header
- Transition: slide-in/out with backdrop

### ChatMessages (`components/ai/chat-messages.tsx`)

- User messages: right-aligned, blue background
- Assistant messages: left-aligned, grey background, supports markdown rendering
- Tool result messages: rendered as ToolResultCard components
- Streaming: assistant message updates character-by-character
- Loading: typing indicator (three dots animation) while waiting

### ChatInput (`components/ai/chat-input.tsx`)

- Text input with placeholder "Ask about your project..."
- Send button (arrow icon)
- Disabled during streaming
- Enter to send, Shift+Enter for newline

### ToolResultCard (`components/ai/tool-result-card.tsx`)

- Compact card showing: tool name, key result data
- Collapsible detail section for full JSON
- Color-coded by tool type: green for reads, orange for writes

### ChatToggle (`components/ai/chat-toggle.tsx`)

- Button in dashboard header (sparkle/AI icon)
- Badge showing unread count or "AI" label
- Toggles ChatPanel open/closed

---

## 6. Integration with Existing Dashboard

- Add ChatToggle to the dashboard header component
- Add ChatPanel to the dashboard layout (renders at root level, positioned fixed)
- Chat is project-scoped — panel shows conversation for the currently viewed project
- When user navigates between projects, chat loads that project's conversation
- API key for Claude stored in `.env` as `ANTHROPIC_API_KEY`

---

## 7. Non-Goals (Phase 5c)

- **Multi-user chat** — single user conversations only
- **File uploads** — agent reads from DB/filesystem, no file upload in chat
- **Voice input** — text only
- **Custom tool creation** — fixed set of 12 tools
- **Agent autonomy** — agent responds to user messages, doesn't act autonomously
- **Cost tracking** — no token usage tracking/limits (future)
