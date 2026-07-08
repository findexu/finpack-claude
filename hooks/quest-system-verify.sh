#!/usr/bin/env bash
# Verify that quest-system files were installed into the current project.

set -euo pipefail

COMMANDS_DEST=".claude/commands"
HOOKS_DEST=".claude/hooks"

required_commands=(
  ask-sages.md
  set-bounty.md
  change-quest.md
  complete-quest.md
  counsel-plan.md
  counsel-prompt.md
  counsel-quest.md
  embark.md
  init-xp.md
  make-camp.md
  new-quest.md
  quest-log.md
  quest-xp.md
  quest-help.md
  side-quest.md
  close-side-quest.md
  start-quest.md
  summon-witch-doctor.md
  hunt-bugs.md
  setup-obsidian.md
  open-obsidian.md
)

missing=0

for cmd in "${required_commands[@]}"; do
  if [ ! -f "$COMMANDS_DEST/$cmd" ]; then
    echo "Missing command: $COMMANDS_DEST/$cmd" >&2
    missing=1
  fi
done

for hook in session-start.sh quest-system-verify.sh; do
  if [ ! -f "$HOOKS_DEST/$hook" ]; then
    echo "Missing hook: $HOOKS_DEST/$hook" >&2
    missing=1
  fi
done

if [ "$missing" -ne 0 ]; then
  exit 1
fi

echo "quest-system verification passed"