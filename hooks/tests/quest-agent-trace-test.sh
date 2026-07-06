#!/usr/bin/env bash
# Unit tests for hooks/quest-agent-trace.sh (sub-agent trace emitter).
# Builds a throwaway project dir, drives the hook via stdin + CLAUDE_PROJECT_DIR,
# and asserts the resulting agents.log tail. Exit 0 on all pass, 1 on any fail.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK="$ROOT/quest-agent-trace.sh"

pass=0; fail=0; failed=()

# run_agent <project-dir> <subagent_type> <description>
run_agent() {
  local proj="$1" type="$2" desc="$3"
  jq -n --arg t "$type" --arg d "$desc" '{tool_input:{subagent_type:$t, description:$d}}' \
    | CLAUDE_PROJECT_DIR="$proj" bash "$HOOK" >/dev/null 2>&1
}

new_project() {
  local d; d=$(mktemp -d)
  mkdir -p "$d/.claude/quest-xp"
  printf '%s\n' ".ai-context/quests/dragon-hunt" "ios" > "$d/.claude/active-quest.txt"
  echo "$d"
}

last_line() { tail -n1 "$1/.claude/quest-xp/agents.log" 2>/dev/null || true; }
line_count() { wc -l < "$1/.claude/quest-xp/agents.log" 2>/dev/null | tr -d ' ' || echo 0; }

check() {
  local name="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    printf '  PASS  agent-trace :: %s\n' "$name"; pass=$((pass+1))
  else
    printf '  FAIL  agent-trace :: %s\n' "$name"
    printf '        expected: %s\n        actual:   %s\n' "$expected" "$actual"
    fail=$((fail+1)); failed+=("$name")
  fi
}

# 1. Agent launch with an active quest -> one trace line, quest-keyed.
P=$(new_project)
run_agent "$P" "fp-code-reviewer" "Review the diff"
check "logs an agent launch keyed to the active quest" \
  "$(last_line "$P" | cut -d'|' -f2-)" "agent|dragon-hunt|type=fp-code-reviewer;desc=Review the diff"
rm -rf "$P"

# 2. No subagent_type (not an agent launch) -> nothing written.
P=$(new_project)
jq -n '{tool_input:{description:"no type here"}}' | CLAUDE_PROJECT_DIR="$P" bash "$HOOK" >/dev/null 2>&1
check "no subagent_type writes nothing" \
  "$([ -f "$P/.claude/quest-xp/agents.log" ] && echo exists || echo none)" "none"
rm -rf "$P"

# 3. No active quest -> still logs, keyed to `-`.
P=$(mktemp -d); mkdir -p "$P/.claude/quest-xp"
run_agent "$P" "fp-code-explorer" "scout the code"
check "no active quest keys the trace to -" \
  "$(last_line "$P" | cut -d'|' -f2-)" "agent|-|type=fp-code-explorer;desc=scout the code"
rm -rf "$P"

# 4. Newline + pipe in the description are sanitized (single line, no `|`).
P=$(new_project)
run_agent "$P" "general-purpose" "$(printf 'line1\nline2|piped')"
check "newline/pipe in desc are sanitized to one clean line" \
  "$(last_line "$P" | cut -d'|' -f2-)" "agent|dragon-hunt|type=general-purpose;desc=line1 line2/piped"
check "sanitized desc does not split into two log lines" "$(line_count "$P")" "1"
rm -rf "$P"

# 5. Semicolons/equals in desc survive (parser reads desc as rest-of-line).
P=$(new_project)
run_agent "$P" "fp-plan-reviewer" "fix x=1; then retry"
check "desc preserves ; and = for rest-of-line parsing" \
  "$(last_line "$P" | cut -d'|' -f2-)" "agent|dragon-hunt|type=fp-plan-reviewer;desc=fix x=1; then retry"
rm -rf "$P"

echo
echo "agent-trace: $pass passed, $fail failed"
if [ "$fail" -gt 0 ]; then printf 'Failed: %s\n' "${failed[@]}"; exit 1; fi
exit 0
