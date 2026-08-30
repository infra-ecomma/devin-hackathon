#!/bin/bash

# (2026-08-30) cnt() replaces the `$(grep -c ... || echo 0)` idiom used throughout this
# hook. That idiom is broken: `grep -c` PRINTS "0" and EXITS 1 when nothing matches, so
# the `|| echo 0` appended a SECOND line and the variable became "0\n0" — every later
# `[ "$X" -ge N ]` then died with "integer expression expected" and the check silently
# never ran. Found by firing this hook against a real 839-line stylesheet, not by reading it.
cnt(){ local n; n=$(grep -cE "$1" "$2" 2>/dev/null | head -1); echo "${n:-0}"; }

set -euo pipefail
# ─────────────────────────────────────────────────────────
# WHAT THIS DOES: Post-write validation during UI-Redesign Step 5.
#   Catches common AI design anti-patterns before code reaches critique.
# HOW IT WORKS: Runs after each .tsx/.jsx/.html/.css file write during
#   code-generation phase. Checks for generic patterns, default palettes,
#   uniform styling, and Classification Card compliance.
# WHY: Referenced in UI-Redesign workflow (lines 44, 155, 217) but was
#   previously undefined. Trifecta review P1.1 created this implementation.
# ─────────────────────────────────────────────────────────

# ── portable JSON field extraction (2026-07-22) ──────────────────────────────
# The old `command -v jq || exit 0` guard silently no-opped this hook on any
# machine without jq (live-found on forge) — a dead sensor that looked
# installed. jq stays primary; python3 stdlib json is the fallback; only with
# NEITHER parser does the hook skip, loudly.
if ! command -v jq >/dev/null 2>&1 && ! command -v python3 >/dev/null 2>&1; then
  echo "[HOOK SKIP] no JSON parser (jq or python3) on this machine" >&2
  exit 0
fi
# json_field <dot.path> [<fallback.dot.path> ...] — first non-empty wins; reads $INPUT.
json_field() {
  if command -v jq >/dev/null 2>&1; then
    local expr="" p
    for p in "$@"; do expr="${expr:+${expr} // }.${p}"; done
    echo "$INPUT" | jq -r "${expr} // empty" 2>/dev/null || true
  else
    echo "$INPUT" | python3 -c '
import sys, json
try:
    d = json.load(sys.stdin)
except Exception:
    sys.exit(0)
for arg in sys.argv[1:]:
    v = d
    for k in arg.split("."):
        v = v.get(k) if isinstance(v, dict) else None
    if isinstance(v, str) and v:
        print(v)
        break
' "$@" 2>/dev/null || true
  fi
}

INPUT=$(cat)

# Only trigger on Write/Edit to UI files
TOOL=$(json_field tool_name)
[[ "$TOOL" != "Write" && "$TOOL" != "Edit" && "$TOOL" != "MultiEdit" ]] && exit 0

FILE=$(json_field tool_input.file_path)
[ -z "$FILE" ] && exit 0

# Only check UI files
[[ "$FILE" != *.tsx && "$FILE" != *.jsx && "$FILE" != *.html && "$FILE" != *.css ]] && exit 0

# Skip design artifacts and configs
[[ "$FILE" == *".claude/"* ]] && exit 0
[[ "$FILE" == *"node_modules/"* ]] && exit 0

echo "=== Design Enforcement Hook ===" >&2
echo "File: $FILE" >&2

CHECKS_FAILED=0
P0_FAILED=0

# --- P1 Checks (Warnings) ---

# Check 1: Generic grid-of-cards pattern (3-feature box)
if grep -q "grid.*gap.*p-4\|grid-cols-3.*card\|box-flex.*flex-1" "$FILE" 2>/dev/null; then
  echo "⚠️  P1: Generic grid-of-cards pattern detected. Use domain-specific layouts from Dashboard Blueprint." >&2
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 2: Default AI color palettes (indigo-to-purple gradient)
if grep -q "from-indigo.*to-purple\|bg-indigo-500.*bg-purple-500\|gradient.*indigo.*purple" "$FILE" 2>/dev/null; then
  echo "⚠️  P1: Default AI color palette (indigo→purple). Use tokens from design system." >&2
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 3: Uniform rounding (excessive rounded-lg)
ROUNDED_COUNT=$(cnt "rounded-lg" "$FILE")
if [ "$ROUNDED_COUNT" -ge 5 ]; then
  echo "⚠️  P1: $ROUNDED_COUNT instances of rounded-lg. Vary rounding by component context." >&2
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# Check 4: Decorative shadows without semantic purpose
if grep -q "shadow-lg\|shadow-xl\|drop-shadow" "$FILE" 2>/dev/null; then
  if ! grep -q "elevation\|focus\|dialog\|modal\|popover\|dropdown" "$FILE" 2>/dev/null; then
    echo "⚠️  P1: Shadows detected without semantic context. Shadows indicate elevation, not decoration." >&2
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
  fi
fi

# Check 5: Hardcoded colors instead of design tokens
# (2026-08-30) Made ratio-aware, matching design-qa. The old absolute ">= 3" fired on
# every edit to any real stylesheet (Tellurion's app.css: 68 hex, 269 var(--) refs), so
# the warning became permanent noise and stopped carrying information. Now it fires only
# when hardcoded values actually OUTNUMBER token references.
HARDCODED=$(cnt "#[0-9a-fA-F]{6}\b|rgb\(|rgba\(" "$FILE")
TOKENREFS=$(cnt "var\(--" "$FILE")
if [ "$HARDCODED" -ge 3 ] && [ "$TOKENREFS" -lt "$HARDCODED" ]; then
  echo "⚠️  P1: $HARDCODED hardcoded colors vs $TOKENREFS token refs. Use CSS custom properties." >&2
  CHECKS_FAILED=$((CHECKS_FAILED + 1))
fi

# --- P0 Checks (Blocking) ---

# Check 6: KPI/Dashboard components MUST reference Classification Card metrics
# (2026-08-30) Gated on the Classification Card EXISTING. Previously this blocked
# (exit 2) any file named *kpi*/*dashboard*/*metric*/*stat* for not referencing a
# card that no project without one can possibly have — an unsatisfiable block.
if echo "$FILE" | grep -qi "kpi\|dashboard\|metric\|stat"; then
  if ! grep -q "PRIMARY_METRICS\|Primary.Metrics\|primary_metrics\|CLASSIFICATION\|classification" "$FILE" 2>/dev/null; then
    if [ -f ".claude/CLASSIFICATION.md" ]; then
      echo "❌ P0: KPI/Dashboard component must reference Classification Card Primary Metrics." >&2
      echo "   Add import or comment referencing .claude/CLASSIFICATION.md" >&2
      P0_FAILED=$((P0_FAILED + 1))
    else
      echo "⚠️  P1: metric-ish filename and no Classification Card in this project — advisory only." >&2
      CHECKS_FAILED=$((CHECKS_FAILED + 1))
    fi
  fi
fi

# Check 7: Generated components must not use generic prop names
if grep -q "interface.*Props" "$FILE" 2>/dev/null; then
  if grep -q "data:\s*any\|items:\s*any\|Item\[\]" "$FILE" 2>/dev/null; then
    echo "❌ P0: Generic prop types (data: any, items: Item[]). Use domain-specific types from Classification." >&2
    P0_FAILED=$((P0_FAILED + 1))
  fi
fi

# --- Report ---
echo "" >&2
if [ $P0_FAILED -gt 0 ]; then
  echo "❌ Design Enforcement: $P0_FAILED P0 failure(s) — fix before proceeding." >&2
  exit 2
elif [ $CHECKS_FAILED -gt 0 ]; then
  echo "⚠️  Design Enforcement: $CHECKS_FAILED P1 warning(s) — review and adjust." >&2
  exit 0
else
  echo "✓ All design enforcement checks passed." >&2
  exit 0
fi
