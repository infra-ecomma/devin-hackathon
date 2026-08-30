#!/usr/bin/env bash
# Keep the standalone tellurion repo identical to OCC's live-artifact copy.
# Ruled 2026-08-30: OCC/live-artifact is the working source; the standalone
# repo mirrors it one way (OCC -> repo). The repo copy on GitHub is never
# edited by hand; anything to change changes here first and rides this script.
# Runs hourly from ~/.config/systemd/user/tellurion-mirror.timer on Forge.
set -euo pipefail
OCC="$HOME/projects/Organizing-Claude-Code"
REPO="$HOME/projects/tellurion"
SRC="$OCC/live-artifact"

if [ ! -d "$REPO/.git" ]; then
  git clone git@github.com:TBK-Labs/tellurion.git "$REPO" 2>/dev/null \
    || gh repo clone TBK-Labs/tellurion "$REPO"
fi

cd "$REPO"
git fetch -q origin main
git reset -q --hard origin/main        # take GitHub first...
rsync -a --delete --exclude .git "$SRC/" "$REPO/"   # ...then OCC content always wins
if ! git diff --quiet HEAD || [ -n "$(git status --porcelain)" ]; then
  git add -A
  git -c user.name="Wassim Moumneh" commit -q -m "sync: mirror OCC live-artifact ($(date -u +%F))"
  git push -q origin main
  echo "$(date -u +%FT%TZ) tellurion mirror: committed and pushed"
else
  echo "$(date -u +%FT%TZ) tellurion mirror: identical, nothing to do"
fi
