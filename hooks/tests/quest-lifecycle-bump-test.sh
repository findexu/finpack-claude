#!/usr/bin/env bash
# Unit tests for hooks/quest-lifecycle-bump.sh (activity-driven phase bump).
# Builds a throwaway project dir, drives the hook via stdin + CLAUDE_PROJECT_DIR,
# and asserts the resulting lifecycle.log tail. Exit 0 on all pass, 1 on any fail.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HOOK="$ROOT/quest-lifecycle-bump.sh"

pass=0; fail=0; failed=()

# run_hook <project-dir> <edited-file-path> -> runs the hook with that input
run_hook() {
  local proj="$1" file="$2"
  printf '{"tool_input":{"file_path":"%s"}}' "$file" \
    | CLAUDE_PROJECT_DIR="$proj" bash "$HOOK" >/dev/null 2>&1
}

# new_project -> echoes a fresh temp project dir with .claude/quest-xp set up
new_project() {
  local d; d=$(mktemp -d)
  mkdir -p "$d/.claude/quest-xp"
  printf '%s\n' ".ai-context/quests/dragon-hunt" "ios" > "$d/.claude/active-quest.txt"
  echo "$d"
}

last_line() { tail -n1 "$1/.claude/quest-xp/lifecycle.log" 2>/dev/null || true; }
line_count() { wc -l < "$1/.claude/quest-xp/lifecycle.log" 2>/dev/null | tr -d ' ' || echo 0; }

check() {
  local name="$1" actual="$2" expected="$3"
  if [ "$actual" = "$expected" ]; then
    printf '  PASS  lifecycle-bump :: %s\n' "$name"; pass=$((pass+1))
  else
    printf '  FAIL  lifecycle-bump :: %s\n' "$name"
    printf '        expected: %s\n        actual:   %s\n' "$expected" "$actual"
    fail=$((fail+1)); failed+=("$name")
  fi
}

# 1. Code edit with at-camp last phase -> appends embarked.
P=$(new_project)
printf '%s\n' "2026-06-01|state|dragon-hunt|phase=at-camp" > "$P/.claude/quest-xp/lifecycle.log"
run_hook "$P" "$P/src/App.swift"
check "code edit after at-camp bumps to embarked" \
  "$(last_line "$P" | cut -d'|' -f2-)" "state|dragon-hunt|phase=embarked"
rm -rf "$P"

# 2. Already embarked -> no duplicate append (idempotent).
P=$(new_project)
printf '%s\n' "2026-06-01|state|dragon-hunt|phase=embarked" > "$P/.claude/quest-xp/lifecycle.log"
run_hook "$P" "$P/src/App.swift"
check "no duplicate when already embarked" "$(line_count "$P")" "1"
rm -rf "$P"

# 3. Edit of a quest scroll (.ai-context) -> never bumps.
P=$(new_project)
printf '%s\n' "2026-06-01|state|dragon-hunt|phase=planning" > "$P/.claude/quest-xp/lifecycle.log"
run_hook "$P" "$P/.ai-context/quests/dragon-hunt/STRATEGY_SCROLL.md"
check "scroll edit does not bump" "$(last_line "$P" | cut -d'|' -f2-)" "state|dragon-hunt|phase=planning"
rm -rf "$P"

# 4. Edit of .claude config -> never bumps.
P=$(new_project)
printf '%s\n' "2026-06-01|state|dragon-hunt|phase=at-camp" > "$P/.claude/quest-xp/lifecycle.log"
run_hook "$P" "$P/.claude/settings.local.json"
check ".claude edit does not bump" "$(last_line "$P" | cut -d'|' -f2-)" "state|dragon-hunt|phase=at-camp"
rm -rf "$P"

# 5. No active quest -> no log written at all.
P=$(mktemp -d); mkdir -p "$P/.claude/quest-xp"
run_hook "$P" "$P/src/App.swift"
check "no active quest writes nothing" "$([ -f "$P/.claude/quest-xp/lifecycle.log" ] && echo exists || echo none)" "none"
rm -rf "$P"

# 6. Active quest but empty log -> first code edit seeds embarked.
P=$(new_project)
run_hook "$P" "$P/src/App.swift"
check "first edit with no prior log seeds embarked" \
  "$(last_line "$P" | cut -d'|' -f2-)" "state|dragon-hunt|phase=embarked"
rm -rf "$P"

# 7. Interleaved other-quest state lines do not mask this quest's last phase.
P=$(new_project)
printf '%s\n' \
  "2026-06-01|state|dragon-hunt|phase=embarked" \
  "2026-06-02|state|other-quest|phase=at-camp" > "$P/.claude/quest-xp/lifecycle.log"
run_hook "$P" "$P/src/App.swift"
check "other-quest at-camp does not trigger duplicate" "$(line_count "$P")" "2"
rm -rf "$P"

echo
echo "lifecycle-bump: $pass passed, $fail failed"
if [ "$fail" -gt 0 ]; then printf 'Failed: %s\n' "${failed[@]}"; exit 1; fi
exit 0
