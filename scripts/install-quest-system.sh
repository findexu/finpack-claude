#!/usr/bin/env bash
# Install quest-system slash commands and hooks into .claude/ of the current project.
#
# Local use (from finpack-claude clone):
#   bash /path/to/finpack-claude/scripts/install-quest-system.sh
#
# Remote use (curl):
#   curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash

set -euo pipefail

REPO="https://raw.githubusercontent.com/findexu/finpack-claude/main"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-install-quest-system.sh}")" 2>/dev/null && pwd || echo "")"
LOCAL_COMMANDS="$SCRIPT_DIR/../skills/quest-system/commands"
LOCAL_HOOKS="$SCRIPT_DIR/../hooks"
COMMANDS_DEST=".claude/commands"
HOOKS_DEST=".claude/hooks"

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

HOOKS=(
  session-start.sh
)

mkdir -p "$COMMANDS_DEST" "$HOOKS_DEST"

UPDATED=0

if [ -d "$LOCAL_COMMANDS" ]; then
  # Local install — copy from finpack-claude clone
  for cmd in "${COMMANDS[@]}"; do
    src="$LOCAL_COMMANDS/$cmd"
    if [ -f "$src" ]; then
      cp "$src" "$COMMANDS_DEST/$cmd"
      echo "  $cmd"
      UPDATED=$((UPDATED + 1))
    else
      echo "  SKIP (not found): $cmd" >&2
    fi
  done
  for hook in "${HOOKS[@]}"; do
    src="$LOCAL_HOOKS/$hook"
    if [ -f "$src" ]; then
      cp "$src" "$HOOKS_DEST/$hook"
      chmod +x "$HOOKS_DEST/$hook"
      echo "  hooks/$hook"
      UPDATED=$((UPDATED + 1))
    else
      echo "  SKIP (not found): hooks/$hook" >&2
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
    if curl -fsSL "$url" -o "$COMMANDS_DEST/$cmd"; then
      echo "  $cmd"
      UPDATED=$((UPDATED + 1))
    else
      echo "  FAIL: $cmd (HTTP error)" >&2
    fi
  done
  for hook in "${HOOKS[@]}"; do
    url="$REPO/hooks/$hook"
    if curl -fsSL "$url" -o "$HOOKS_DEST/$hook"; then
      chmod +x "$HOOKS_DEST/$hook"
      echo "  hooks/$hook"
      UPDATED=$((UPDATED + 1))
    else
      echo "  FAIL: hooks/$hook (HTTP error)" >&2
    fi
  done
fi

echo ""
echo "quest-system: $UPDATED files installed (commands → $COMMANDS_DEST, hooks → $HOOKS_DEST)"
echo "Restart Claude Code if commands don't appear immediately."
