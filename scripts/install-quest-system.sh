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
LOCAL_TUTORIAL_SKILL="$SCRIPT_DIR/../skills/quest-system-tutorial/SKILL.md"
COMMANDS_DEST=".claude/commands"
HOOKS_DEST=".claude/hooks"
TUTORIAL_SKILL_DEST=".claude/skills/quest-system-tutorial/SKILL.md"

# Fallback list used for remote installs where directory listing is unavailable.
REMOTE_COMMANDS=(
  ask-sages.md
  change-quest.md
  complete-quest.md
  counsel-plan.md
  counsel-prompt.md
  new-quest.md
  counsel-quest.md
  embark.md
  init-xp.md
  make-camp.md
  quest-log.md
  quest-xp.md
  summon-witch-doctor.md
)

HOOKS=(
  session-start.sh
)

mkdir -p "$COMMANDS_DEST" "$HOOKS_DEST" "$(dirname "$TUTORIAL_SKILL_DEST")"

UPDATED=0
COMMANDS=()

if [ -d "$LOCAL_COMMANDS" ]; then
  # Local install — discover commands from the local quest-system directory.
  while IFS= read -r cmd; do
    COMMANDS+=("$cmd")
  done < <(find "$LOCAL_COMMANDS" -maxdepth 1 -type f -name '*.md' -print | sed 's#.*/##' | sort)

  if [ ${#COMMANDS[@]} -eq 0 ]; then
    echo "Error: no command files found in $LOCAL_COMMANDS" >&2
    exit 1
  fi

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

  if [ -f "$LOCAL_TUTORIAL_SKILL" ]; then
    cp "$LOCAL_TUTORIAL_SKILL" "$TUTORIAL_SKILL_DEST"
    echo "  skills/quest-system-tutorial/SKILL.md"
    UPDATED=$((UPDATED + 1))
  else
    echo "  SKIP (not found): skills/quest-system-tutorial/SKILL.md" >&2
  fi
else
  # Remote install — download from GitHub
  COMMANDS=("${REMOTE_COMMANDS[@]}")

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

  tutorial_url="$REPO/skills/quest-system-tutorial/SKILL.md"
  if curl -fsSL "$tutorial_url" -o "$TUTORIAL_SKILL_DEST"; then
    echo "  skills/quest-system-tutorial/SKILL.md"
    UPDATED=$((UPDATED + 1))
  else
    echo "  FAIL: skills/quest-system-tutorial/SKILL.md (HTTP error)" >&2
  fi
fi

echo ""
echo "quest-system: $UPDATED files installed (commands → $COMMANDS_DEST, hooks → $HOOKS_DEST, tutorial skill → $(dirname "$TUTORIAL_SKILL_DEST"))"
echo "Restart Claude Code if commands don't appear immediately."
