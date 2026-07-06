#!/usr/bin/env bash
# PostToolUse(Agent|Task) — append a sub-agent trace line for the dashboard.
#
# Fires after the orchestrator session finishes an Agent (a.k.a. Task, renamed in
# Claude Code v2.1.63) tool call, i.e. once a sub-agent completes. Records which
# agent type ran and its one-line description so the quest-dashboard can surface
# recent sub-agent activity — data nothing else on disk captures. Keyed to the
# active quest (or `-` when none), in a SEPARATE append-only log so it can never
# perturb the XP fold (events.log) or the phase log (lifecycle.log).
#
# Silent, jq-guarded, zero-token on every path.

set -euo pipefail

command -v jq >/dev/null 2>&1 || exit 0

INPUT=$(cat)

# subagent_type is the launch identity; without it this was not an agent launch.
# `jq -j` (no trailing newline) so a value never gains a stray space when tr maps
# newlines to spaces below.
TYPE=$(printf '%s' "$INPUT" | jq -j '.tool_input.subagent_type // empty')
[ -n "$TYPE" ] || exit 0

# One-line description (fallback to the prompt). Sanitize the field delimiters the
# log format reserves: newlines and `|`. `;`/`=` inside desc are fine — the parser
# reads desc as the rest of the line after `desc=`.
DESC=$(printf '%s' "$INPUT" | jq -j '.tool_input.description // .tool_input.prompt // empty' \
  | tr '\n\r|' '  /' | cut -c1-120)

# Sanitize the type the same way (defensive; it should already be a bare slug).
TYPE=$(printf '%s' "$TYPE" | tr '\n\r|' '  /' | cut -c1-60)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$PWD}"
ACTIVE_QUEST_FILE="$PROJECT_DIR/.claude/active-quest.txt"
AGENTS_LOG="$PROJECT_DIR/.claude/quest-xp/agents.log"

QUEST_NAME="-"
if [ -f "$ACTIVE_QUEST_FILE" ]; then
  QUEST_PATH=$(grep -m1 -v '^[[:space:]]*$' "$ACTIVE_QUEST_FILE" 2>/dev/null || true)
  if [ -n "$QUEST_PATH" ]; then
    QUEST_NAME=$(basename "$QUEST_PATH")
    # Replace the field delimiter `|` (legal in a Unix folder name) so it can't
    # add a field and make the parser drop the line. Param expansion, not tr, to
    # avoid tr turning basename's trailing newline into a trailing space.
    QUEST_NAME=${QUEST_NAME//|//}
  fi
fi

mkdir -p "$(dirname "$AGENTS_LOG")"
printf '%s\n' "$(date +%F)|agent|${QUEST_NAME}|type=${TYPE};desc=${DESC}" >> "$AGENTS_LOG"
exit 0
