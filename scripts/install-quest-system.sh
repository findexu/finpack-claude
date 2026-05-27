#!/usr/bin/env bash
# Install quest-system slash commands into .claude/commands/ of the current project.
#
# Local use (from dotclaude clone):
#   bash /path/to/dotclaude/scripts/install-quest-system.sh
#
# Remote use (curl):
#   curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash

set -euo pipefail

REPO="https://raw.githubusercontent.com/findexu/finpack-claude/main"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-install-quest-system.sh}")" 2>/dev/null && pwd || echo "")"
LOCAL_SOURCE="$SCRIPT_DIR/../skills/quest-system/commands"
DEST=".claude/commands"

COMMANDS=(
  new-quest.md
  embark.md
  make-camp.md
  quest-log.md
  change-quest.md
  complete-quest.md
  summon-witch-doctor.md
  quest-xp.md
  ask-sages.md
  init-xp.md
  counsel-prompt.md
  counsel-plan.md
)

mkdir -p "$DEST"

UPDATED=0

if [ -d "$LOCAL_SOURCE" ]; then
  # Local install — copy from dotclaude clone
  for cmd in "${COMMANDS[@]}"; do
    src="$LOCAL_SOURCE/$cmd"
    if [ -f "$src" ]; then
      cp "$src" "$DEST/$cmd"
      echo "  $cmd"
      UPDATED=$((UPDATED + 1))
    else
      echo "  SKIP (not found): $cmd" >&2
    fi
  done
else
  # Remote install — download from GitHub
  if ! command -v curl &>/dev/null; then
    echo "Error: curl not found. Install curl or clone the repo and run locally." >&2
    exit 1
  fi
  for cmd in "${COMMANDS[@]}"; do
    url="$REPO/skills/quest-system/commands/$cmd"
    if curl -fsSL "$url" -o "$DEST/$cmd"; then
      echo "  $cmd"
      UPDATED=$((UPDATED + 1))
    else
      echo "  FAIL: $cmd (HTTP error)" >&2
    fi
  done
fi

echo ""
echo "quest-system: $UPDATED commands → $DEST"
echo "Restart Claude Code if commands don't appear immediately."
