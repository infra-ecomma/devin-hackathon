#!/bin/bash
# proof-artifact-check
# Warns when committing tasks that have test-requirement cards but no test-results manifest.
# Event: PreToolUse | Matcher: Bash | Blocking: false
#
# PREREQUISITE: These directories and files are created by the GSD testing pipeline.
# - dev_docs/enforcement-proofs/${TASK_ID}-test-card.md (test requirements)
# - test-results/${TASK_ID}-manifest.json (proof artifacts manifest)
# - scripts/verify-proof-artifacts.sh (validation script)
#
# If they don't exist, the hook warns but does not block.
# See: 08-quality-testing/enforcement/ for the proof artifact specification.
#
# This script handles missing directories gracefully (doesn't error out).
#
INPUT=$(cat)
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null)
echo "$CMD" | grep -q "git commit" || exit 0
# Extract task ID from commit message
TASK_ID=$(echo "$CMD" | grep -oE '(feat|fix|chore)\(([A-Z]+-[0-9]+)\)' | grep -oE '[A-Z]+-[0-9]+' | head -1)
[ -z "$TASK_ID" ] && exit 0
# Check if test card exists
[ ! -f "dev_docs/enforcement-proofs/${TASK_ID}-test-card.md" ] && exit 0
# Check if manifest exists
if [ ! -f "test-results/${TASK_ID}-manifest.json" ]; then
  echo "{\"systemMessage\": \"WARNING: Task $TASK_ID has a Test Requirements Card but no proof artifacts. Run /test-verify $TASK_ID.\"}"
  exit 0
fi
# Run validator if it exists
if [ -f "scripts/verify-proof-artifacts.sh" ]; then
  bash scripts/verify-proof-artifacts.sh "$TASK_ID" > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "{\"systemMessage\": \"WARNING: Proof artifact validation failed for $TASK_ID. Run /test-verify $TASK_ID.\"}"
  fi
fi
exit 0
