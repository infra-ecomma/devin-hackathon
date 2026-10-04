# devin-hackathon / Agents.md — agent instruction bundle

## 🛑 FAN-OUT DISCIPLINE — dispatch sub-agents, NEVER serialize 3+ units (added 2026-09-09)

When work decomposes into **3+ independent, parallelizable units**, invoke the **Agent** tool in a **single message** with multiple parallel tool uses. Do NOT serialize.

- **Sub-agent providers = NON-CLAUDE only.** Front agent = relay (qwen3.7-plus primary); worker bench = z.ai (glm-5.2), OpenRouter z-ai/glm-5.2. **Claude is harness gateway ONLY — forbidden as a sub-agent** (operator standing rule 2026-09-09).
- Front agent escalates → main thread fans out → sub-agents do the bounded work.
- For each delegation, label the slice: "slice N of M" in the prompt per Rule 55.
- Frontier reasoning never moves to a cheap model; only bounded worker assignments do.
- Verified path 2026-09-09: marker `<<<KIT-SUBAGENT:qwen3.7-plus:<nonce>>>` OR `cc_is_subagent=true` in system block; sub-agent POST returned 200 in <2s.
- Relay/process: `127.0.0.1:8788` (kit-subagent-proxy systemd unit).
- Memory: `~/.claude/projects/-home-rabih-projects-General-setup/memory/feedback_claude_only_as_harness_gateway.md`.

AGENTS: this rule binds **you too** — read and obey it. CLAUDE.md gets one copy of the rule; Agents.md gets it again because sub-agents read the latter, not the former.

