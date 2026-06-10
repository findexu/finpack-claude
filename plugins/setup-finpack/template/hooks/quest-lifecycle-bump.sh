#!/usr/bin/env bash
# PostToolUse(Edit|Write) — activity-driven lifecycle bump for quest-system.
#
# Advances the dashboard phase to `embarked` the moment real expedition work
# starts (the first code edit), instead of relying on the model remembering to
# run /embark's manual lifecycle append. That manual append is gated on plan
# approval and buried mid-command, so a skipped step or an interrupted session
# left the dashboard stuck on the previous phase (planning / at-camp). This hook
# is the deterministic backstop.
#
# Idempotent: appends only when the active quest's last recorded phase is NOT
# already `embarked`. Edits to planning artifacts (quest scrolls under
# .ai-context/, .claude/ config) are not expedition work and never bump.
# Silent and zero-token on every path.

set -euo pipefail

command -v jq >/dev/null 2>&1 || exit 0

INPUT=$(cat)
FILE_PATH=$(printf '%s' "$INPUT" | jq -r '.tool_input.file_path // empty')
[ -n "$FILE_PATH" ] || exit 0

# Planning artifacts are not expedition work — never bump on them.
case "$FILE_PATH" in
  */.ai-context/*|.ai-context/*|*/.claude/*|.claude/*) exit 0 ;;
esac

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
ACTIVE_QUEST_FILE="$PROJECT_DIR/.claude/active-quest.txt"
LIFECYCLE_LOG="$PROJECT_DIR/.claude/quest-xp/lifecycle.log"

# No active quest -> nothing to track.
[ -f "$ACTIVE_QUEST_FILE" ] || exit 0

# First non-empty line is the quest folder path; its basename is the quest name
# (matches the lifecycle/XP event format keyed by the quest folder leaf).
QUEST_PATH=$(grep -m1 -v '^[[:space:]]*$' "$ACTIVE_QUEST_FILE" 2>/dev/null || true)
[ -n "$QUEST_PATH" ] || exit 0
QUEST_NAME=$(basename "$QUEST_PATH")

# Last recorded phase for this quest (last matching `state` line wins).
LAST_PHASE=""
if [ -f "$LIFECYCLE_LOG" ]; then
  LAST_PHASE=$(awk -F'|' -v q="$QUEST_NAME" '
    $2 == "state" && $3 == q { fields = $4 }
    END {
      n = split(fields, parts, ";")
      for (i = 1; i <= n; i++) {
        if (parts[i] ~ /^phase=/) { sub(/^phase=/, "", parts[i]); print parts[i] }
      }
    }' "$LIFECYCLE_LOG")
fi

[ "$LAST_PHASE" = "embarked" ] && exit 0

mkdir -p "$(dirname "$LIFECYCLE_LOG")"
printf '%s\n' "$(date +%F)|state|${QUEST_NAME}|phase=embarked" >> "$LIFECYCLE_LOG"
exit 0
