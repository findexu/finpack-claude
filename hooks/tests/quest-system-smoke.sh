#!/usr/bin/env bash
# Static integrity checks for the quest-system plugin (no LLM runtime needed):
#   1. sync drift  — skills/ source matches the generated plugins/ copy
#   2. registration parity — every command is in all FOUR hardcoded registries
#      (install REMOTE_COMMANDS, install-quest-system SKILL list, verify
#       required_commands, quest-system SKILL.md table). The update-quest-system
#       skill is NOT a registry — it delegates to the install script — so it is
#       intentionally excluded here.
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
INSTALL_SKILL="skills/install-quest-system/SKILL.md"
VERIFY="hooks/quest-system-verify.sh"
SKILL="$SRC/SKILL.md"
missing=""
for f in "$SRC"/commands/*.md; do
  cmd=$(basename "$f")
  slash="/${cmd%.md}"   # e.g. /start-quest — the form used in the SKILL.md commands table
  grep -qF -- "$cmd" "$INSTALL"       || missing="$missing\n  $cmd absent from install REMOTE_COMMANDS"
  grep -qF -- "$cmd" "$INSTALL_SKILL" || missing="$missing\n  $cmd absent from install-quest-system SKILL list"
  grep -qF -- "$cmd" "$VERIFY"        || missing="$missing\n  $cmd absent from verify required_commands"
  grep -qF -- "\`$slash\`" "$SKILL"   || missing="$missing\n  $slash absent from quest-system SKILL.md commands table"
done
[ -z "$missing" ] && ok "registration parity: every command in install(script+skill)+verify+SKILL-table" \
  || bad "registration parity" "$(printf "$missing")"

# 3. Spec lint ------------------------------------------------------------------
# Every command that READS the active quest must reference the canonical rule.
# Writers (new/start/change) and the pointer-display in change-quest are exempt.
lint_miss=""
for f in "$SRC"/commands/*.md; do
  b=$(basename "$f")
  case "$b" in new-quest.md|start-quest.md|change-quest.md|quest-xp.md|init-xp.md|quest-help.md|side-quest.md|close-side-quest.md|setup-obsidian.md|open-obsidian.md) continue ;; esac
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

# 4. Plan-reviewer wiring -------------------------------------------------------
AGENT="agents/fp-plan-reviewer.md"
RUBRIC_SENTINEL="The verdict is a pure function of"

# SHIP GUARD: the agent must reach both new installs and updaters. Both paths
# now run install-quest-system.sh, so guarding its AGENTS array covers both.
if grep -qF "fp-plan-reviewer.md" "$INSTALL"; then
  ok "ship: fp-plan-reviewer in install AGENTS array"
else
  bad "ship: fp-plan-reviewer.md absent from install AGENTS array"
fi

# DRIFT GUARD: the rubric is single-source — it lives in the agent and must NOT
# be restated in any command (the commands delegate to the agent).
if [ -f "$AGENT" ] && grep -qF "$RUBRIC_SENTINEL" "$AGENT"; then
  dup=""
  for f in "$SRC"/commands/*.md; do
    grep -qF "$RUBRIC_SENTINEL" "$f" && dup="$dup\n  rubric duplicated in $(basename "$f")"
  done
  [ -z "$dup" ] && ok "drift: rubric single-sourced in fp-plan-reviewer agent" \
    || bad "drift: rubric duplicated in a command" "$(printf "$dup")"
else
  bad "drift: rubric sentinel missing from $AGENT"
fi

# SYNC GUARD: the agent must be bundled into the quest-system plugin copy.
QS_AGENT="plugins/quest-system/agents/fp-plan-reviewer.md"
if [ -f "$QS_AGENT" ]; then
  d=$(diff "$AGENT" "$QS_AGENT" 2>&1)
  [ -z "$d" ] && ok "sync: fp-plan-reviewer bundled in quest-system plugin" \
    || bad "sync: quest-system plugin agent copy stale — run sync-plugins.sh" "$d"
else
  bad "sync: fp-plan-reviewer.md not bundled in quest-system plugin ($QS_AGENT)"
fi

echo
echo "qs-smoke: $pass passed, $fail failed"
[ $fail -eq 0 ] || { printf 'Failed: %s\n' "${failed[@]}"; exit 1; }
exit 0
