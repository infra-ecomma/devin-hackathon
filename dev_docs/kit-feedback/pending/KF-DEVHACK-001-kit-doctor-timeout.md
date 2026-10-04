---
id: KF-DEVHACK-001
title: kit-doctor times out during reference-mode connection verification
type: kit-feedback
status: pending
sanitized: true
category: tooling
severity: medium
summary: >
  /kit-connect Step 7b requires running kit-doctor before reporting success.
  In this session kit-doctor consistently exceeded the 10-minute tool timeout
  and its own 390-second runtime budget without writing a report. The script
  appears to hang on a check rather than self-terminating at the budget.
  Workaround: verify wiring via targeted checks (mcp-entrypoint-exists,
  command-surface) and acknowledge the full kit-doctor pass is pending.
improvement: >
  Add a hard timeout/fork inside kit-doctor that kills the slowest checks
  when the budget is exceeded, or split the full validator into a fast
  consumer-wiring pass plus a slow kit-internal lint pass so /kit-connect
  can gate on the consumer pass alone.
---
