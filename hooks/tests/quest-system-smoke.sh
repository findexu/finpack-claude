#!/usr/bin/env bash
# Static integrity checks for the quest-system plugin (no LLM runtime needed):
#   1. sync drift  — skills/ source matches the generated plugins/ copy
#   2. registration parity — every command is in all THREE hardcoded lists
#      (install REMOTE_COMMANDS, verify required_commands, update-quest-system list)
#   3. spec lint  — quest-context commands resolve via SKILL.md; NOTE dates quoted
# Exit 0 on all pass, 1 on any fail.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

pass=0; fail=0; failed=()
ok()   { printf '  PASS  qs-smoke :: %s\n' "$1"; pass=$((pass+1)); }
bad()  { printf '  FAIL  qs-smoke :: %s\n' "$1"; [ -n "${2:-}" ] && printf '%s\n' "$2" | sed 's/^/        /'; fail=$((fail+1)); failed+=("$1"); }

SRC="skills/quest-system"
DST="plugins/quest-system/skills/quest-system"

# 1. Sync drift -----------------------------------------------------------------
if [ -d "$DST" ]; then
  d=$(diff -r "$SRC" "$DST" 2>&1)
  [ -z "$d" ] && ok "sync drift: source == plugins copy" || bad "sync drift: run sync-plugins.sh" "$d"
else
  bad "sync drift: plugins copy missing ($DST)"
fi

# 2. Registration parity --------------------------------------------------------
INSTALL="scripts/install-quest-system.sh"
VERIFY="hooks/quest-system-verify.sh"
UPDATE="skills/update-quest-system/SKILL.md"
missing=""
for f in "$SRC"/commands/*.md; do
  cmd=$(basename "$f")
  grep -qF -- "$cmd" "$INSTALL" || missing="$missing\n  $cmd absent from install REMOTE_COMMANDS"
  grep -qF -- "$cmd" "$VERIFY"  || missing="$missing\n  $cmd absent from verify required_commands"
  grep -qF -- "$cmd" "$UPDATE"  || missing="$missing\n  $cmd absent from update-quest-system list"
done
[ -z "$missing" ] && ok "registration parity: every command in install+verify+update lists" \
  || bad "registration parity" "$(printf "$missing")"

# update-quest-system command count matches the actual command count
cmd_count=$(ls "$SRC"/commands/*.md | wc -l | tr -d ' ')
if grep -qF "$cmd_count command files" "$UPDATE"; then
  ok "update-quest-system count says $cmd_count command files"
else
  bad "update-quest-system count mismatch (expected '$cmd_count command files')"
fi

# 3. Spec lint ------------------------------------------------------------------
# Every command that READS the active quest must reference the canonical rule.
# Writers (new/start/change) and the pointer-display in change-quest are exempt.
lint_miss=""
for f in "$SRC"/commands/*.md; do
  b=$(basename "$f")
  case "$b" in new-quest.md|start-quest.md|change-quest.md|quest-xp.md|init-xp.md|side-quest.md|close-side-quest.md) continue ;; esac
  grep -qF 'Active-quest selection' "$f" || lint_miss="$lint_miss\n  $b missing 'Active-quest selection' reference"
done
[ -z "$lint_miss" ] && ok "spec lint: quest-context readers reference the resolution rule" \
  || bad "spec lint: resolution reference" "$(printf "$lint_miss")"

# NOTE template date must be quoted (YAML coerces unquoted ISO dates to Date).
if grep -qF 'created: "{YYYY-MM-DD}"' "$SRC/commands/side-quest.md"; then
  ok "spec lint: side-quest NOTE created date is quoted"
else
  bad "spec lint: side-quest NOTE created date must be quoted"
fi

echo
echo "qs-smoke: $pass passed, $fail failed"
[ $fail -eq 0 ] || { printf 'Failed: %s\n' "${failed[@]}"; exit 1; }
exit 0
