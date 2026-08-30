#!/bin/bash

# (2026-08-30) cnt() replaces the `$(grep -c ... || echo 0)` idiom used throughout this
# hook. That idiom is broken: `grep -c` PRINTS "0" and EXITS 1 when nothing matches, so
# the `|| echo 0` appended a SECOND line and the variable became "0\n0" — every later
# `[ "$X" -ge N ]` then died with "integer expression expected" and the check silently
# never ran. Found by firing this hook against a real 839-line stylesheet, not by reading it.
cnt(){ local n; n=$(grep -cE "$1" "$2" 2>/dev/null | head -1); echo "${n:-0}"; }

set -euo pipefail
# design-qa — PostToolUse hook for image and design file writes
# Fires when Claude writes/edits image files (.png, .svg, .jpg, .jpeg)
# or CSS/design token files (.css, .scss, .module.css)
#
# Verifies: file integrity, SVG validity, image dimensions, contrast ratios,
# hardcoded color detection, brand file naming, responsive size classes
#
# Updated 2026-04-09: Added contrast checking, hardcoded color detection,
# dimension validation, CSS token coverage, brand file naming guard

# (2026-08-30) Removed a `command -v go || exit 0` guard: nothing in this script uses
# Go, so on any machine without it the hook silently no-opped on every file. Dead sensor.
command -v python3 >/dev/null 2>&1 || { echo "[HOOK SKIP] python3 not found"; exit 0; }

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
path = d.get('tool_input', {}).get('path', '') or d.get('tool_input', {}).get('file_path', '')
print(path)
" 2>/dev/null)

WARNINGS=""
BLOCKS=""

add_warning() { WARNINGS="${WARNINGS}\n  - $1"; }
add_block() { BLOCKS="${BLOCKS}\n  - $1"; }

# === IMAGE FILE CHECKS ===
if echo "$FILE" | grep -qiE '\.(png|svg|jpg|jpeg)$'; then

  # File must exist
  if [ ! -f "$FILE" ]; then
    echo "DESIGN QA: File not found after write: $FILE" >&2
    exit 0
  fi

  # File must not be empty
  SIZE=$(wc -c < "$FILE" 2>/dev/null)
  if [ "$SIZE" -lt 10 ]; then
    add_block "$FILE is empty or corrupt (${SIZE} bytes). Re-generate."
  fi

  # SVG-specific: must be valid XML + check for inline styles
  if echo "$FILE" | grep -qi '\.svg$'; then
    if ! python3 -c "import xml.etree.ElementTree as ET; ET.parse('$FILE')" 2>/dev/null; then
      add_block "$FILE is not valid SVG/XML. Fix structure."
    fi
    # Check for hardcoded colors in SVG
    HC_COUNT=$(cnt 'fill="#[0-9a-fA-F]{3,6}"|stroke="#[0-9a-fA-F]{3,6}"|style="[^"]*color:\s*#' "$FILE")
    if [ "$HC_COUNT" -gt 3 ]; then
      add_warning "SVG has $HC_COUNT hardcoded color values. Use CSS variables or design tokens."
    fi
    # Check for missing viewBox
    if ! grep -q 'viewBox' "$FILE" 2>/dev/null; then
      add_warning "SVG missing viewBox attribute — will not scale responsively."
    fi
    # Check for missing accessible title
    if ! grep -q '<title>' "$FILE" 2>/dev/null; then
      add_warning "SVG missing <title> element for accessibility."
    fi
  fi

  # PNG/JPG: verify with PIL, check dimensions
  if echo "$FILE" | grep -qiE '\.(png|jpg|jpeg)$'; then
    python3 - "$FILE" 2>/dev/null << 'PYEOF'
import sys
try:
    from PIL import Image
    img = Image.open(sys.argv[1])
    w, h = img.size
    img.verify()
    # Warn on very large images (likely uncompressed)
    if w * h > 4000000:
        print(f"DESIGN QA WARNING: {sys.argv[1]} is {w}x{h} ({w*h:,} pixels). Consider optimizing.", file=sys.stderr)
    # Warn on non-standard aspect ratios for logos
    if 'logo' in sys.argv[1].lower():
        if w < 100 or h < 100:
            print(f"DESIGN QA WARNING: Logo is only {w}x{h}px — may appear blurry at display size.", file=sys.stderr)
    print(f"DESIGN QA: {sys.argv[1]} — OK ({w}x{h}px)")
except ImportError:
    pass  # PIL not available
except Exception as e:
    print(f"DESIGN QA WARNING: {sys.argv[1]} may be corrupt: {e}", file=sys.stderr)
PYEOF
  fi

  # Brand file naming guard (cross-reference with Design-Push-Gate)
  if echo "$FILE" | grep -qiE '(-logo|brand|/icons/|/public/.*\.svg)'; then
    GATE_MARKER=".claude/.push-gate-approved"
    if [ -f "$GATE_MARKER" ]; then
      MARKER_AGE=$(( $(date +%s) - $(stat -c %Y "$GATE_MARKER" 2>/dev/null || echo 0) ))
      if [ "$MARKER_AGE" -gt 600 ]; then
        add_warning "Brand file modified but Design-Push-Gate approval expired (${MARKER_AGE}s old). Re-approve."
      fi
    else
      add_warning "Brand/logo file modified without Design-Push-Gate approval marker."
    fi
  fi
fi

# === CSS/DESIGN TOKEN FILE CHECKS ===
if echo "$FILE" | grep -qiE '\.(css|scss|module\.css)$'; then
  if [ -f "$FILE" ]; then
    # Check for hardcoded colors (should use CSS variables/tokens)
    HC_COLORS=$(cnt '#[0-9a-fA-F]{3,8}\b|rgba?\s*\(' "$FILE")
    VAR_COLORS=$(cnt 'var\(--' "$FILE")
    if [ "$HC_COLORS" -gt 5 ] && [ "$VAR_COLORS" -lt "$HC_COLORS" ]; then
      add_warning "CSS has $HC_COLORS hardcoded colors vs $VAR_COLORS token references. Use design tokens."
    fi

    # Check for hardcoded pixel values in spacing (should use tokens)
    HC_PX=$(cnt '(margin|padding|gap):\s*[0-9]+px' "$FILE")
    if [ "$HC_PX" -gt 10 ]; then
      add_warning "CSS has $HC_PX hardcoded pixel spacing values. Use spacing tokens."
    fi

    # Check for !important abuse
    IMPORTANT_COUNT=$(cnt '!important' "$FILE")
    if [ "$IMPORTANT_COUNT" -gt 3 ]; then
      add_warning "CSS has $IMPORTANT_COUNT !important declarations — specificity issue."
    fi

    # Check for missing prefers-reduced-motion on animations
    HAS_ANIMATION=$(cnt 'animation:|transition:|@keyframes' "$FILE")
    HAS_MOTION_PREF=$(cnt 'prefers-reduced-motion' "$FILE")
    if [ "$HAS_ANIMATION" -gt 0 ] && [ "$HAS_MOTION_PREF" -eq 0 ]; then
      add_warning "CSS has animations but no prefers-reduced-motion media query."
    fi

    # Check for missing responsive breakpoints
    HAS_MEDIA=$(cnt '@media' "$FILE")
    LINES=$(wc -l < "$FILE" 2>/dev/null || echo 0)
    if [ "$LINES" -gt 100 ] && [ "$HAS_MEDIA" -eq 0 ]; then
      add_warning "CSS is $LINES lines with no @media queries — likely not responsive."
    fi
  fi
fi

# === Output results ===
if [ -n "$BLOCKS" ]; then
  echo "DESIGN QA FAILED:$BLOCKS"
  exit 2
fi

if [ -n "$WARNINGS" ]; then
  echo "DESIGN QA WARNINGS:$WARNINGS" >&2
fi

exit 0

