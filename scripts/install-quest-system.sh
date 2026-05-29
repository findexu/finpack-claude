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
LOCAL_UPDATE_SKILL="$SCRIPT_DIR/../skills/update-quest-system/SKILL.md"
LOCAL_VERSION="$SCRIPT_DIR/../skills/quest-system/VERSION"
LOCAL_SETTINGS_EXAMPLE="$SCRIPT_DIR/../settings.local.json.example"
COMMANDS_DEST=".claude/commands"
HOOKS_DEST=".claude/hooks"
TUTORIAL_SKILL_DEST=".claude/skills/quest-system-tutorial/SKILL.md"
UPDATE_SKILL_DEST=".claude/skills/update-quest-system/SKILL.md"
VERSION_DEST=".claude/commands/.quest-system-version"
SETTINGS_LOCAL_DEST=".claude/settings.local.json"
VERIFY_RULE='Bash(.claude/hooks/quest-system-verify.sh *)'

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
  quest-system-verify.sh
)

mkdir -p "$COMMANDS_DEST" "$HOOKS_DEST" "$(dirname "$TUTORIAL_SKILL_DEST")" "$(dirname "$UPDATE_SKILL_DEST")"

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

  if [ -f "$LOCAL_UPDATE_SKILL" ]; then
    cp "$LOCAL_UPDATE_SKILL" "$UPDATE_SKILL_DEST"
    echo "  skills/update-quest-system/SKILL.md"
    UPDATED=$((UPDATED + 1))
  else
    echo "  SKIP (not found): skills/update-quest-system/SKILL.md" >&2
  fi

  if [ -f "$LOCAL_VERSION" ]; then
    cp "$LOCAL_VERSION" "$VERSION_DEST"
    echo "  .quest-system-version ($(cat "$LOCAL_VERSION" | tr -d '[:space:]'))"
    UPDATED=$((UPDATED + 1))
  else
    echo "  SKIP (not found): skills/quest-system/VERSION" >&2
  fi

  if [ -f "$LOCAL_SETTINGS_EXAMPLE" ] && [ ! -f "$SETTINGS_LOCAL_DEST" ]; then
    cp "$LOCAL_SETTINGS_EXAMPLE" "$SETTINGS_LOCAL_DEST"
  fi

  if [ -f "$SETTINGS_LOCAL_DEST" ]; then
    python3 - "$SETTINGS_LOCAL_DEST" <<'PY'
import json
import pathlib
import sys

RULES = [
    'Bash(.claude/hooks/quest-system-verify.sh *)',
    'Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/skills/quest-system/VERSION *)',
    'Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash)',
]

path = pathlib.Path(sys.argv[1])
data = json.loads(path.read_text())
allow = data.setdefault("permissions", {}).setdefault("allow", [])
for rule in RULES:
    if rule not in allow:
        allow.insert(0, rule)
path.write_text(json.dumps(data, indent=2) + "\n")
PY
    echo "  settings.local.json"
    UPDATED=$((UPDATED + 1))
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

  update_url="$REPO/skills/update-quest-system/SKILL.md"
  if curl -fsSL "$update_url" -o "$UPDATE_SKILL_DEST"; then
    echo "  skills/update-quest-system/SKILL.md"
    UPDATED=$((UPDATED + 1))
  else
    echo "  FAIL: skills/update-quest-system/SKILL.md (HTTP error)" >&2
  fi

  if curl -fsSL "$REPO/skills/quest-system/VERSION" -o "$VERSION_DEST"; then
    echo "  .quest-system-version ($(cat "$VERSION_DEST" | tr -d '[:space:]'))"
    UPDATED=$((UPDATED + 1))
  else
    echo "  FAIL: skills/quest-system/VERSION (HTTP error)" >&2
  fi

  if [ ! -f "$SETTINGS_LOCAL_DEST" ]; then
    if curl -fsSL "$REPO/settings.local.json.example" -o "$SETTINGS_LOCAL_DEST"; then
      UPDATED=$((UPDATED + 1))
    fi
  fi

  if [ -f "$SETTINGS_LOCAL_DEST" ]; then
    python3 - "$SETTINGS_LOCAL_DEST" <<'PY'
import json
import pathlib
import sys

RULES = [
    'Bash(.claude/hooks/quest-system-verify.sh *)',
    'Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/skills/quest-system/VERSION *)',
    'Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash)',
]

path = pathlib.Path(sys.argv[1])
data = json.loads(path.read_text())
allow = data.setdefault("permissions", {}).setdefault("allow", [])
for rule in RULES:
    if rule not in allow:
        allow.insert(0, rule)
path.write_text(json.dumps(data, indent=2) + "\n")
PY
    echo "  settings.local.json"
  fi
fi

# Optional: auto-connect Serena MCP if its runtime is already installed.
# Only registers when a real serena binary is on PATH — never triggers a uvx
# build, never fails the install. Skip with QUEST_SKIP_SERENA=1.
connect_serena() {
  [ "${QUEST_SKIP_SERENA:-0}" = "1" ] && return 0
  command -v claude &>/dev/null || return 0

  # Already registered? Leave the user's config untouched.
  if claude mcp get serena &>/dev/null; then
    echo "  serena MCP: already configured (left as-is)"
    return 0
  fi

  # Only register the modern `serena` CLI entry point. We deliberately do NOT
  # fall back to `uvx --from git+...` (would build serena on first launch) nor to
  # the legacy `serena-mcp-server` binary (unverified flags). --project-from-cwd
  # makes serena activate whichever project the session runs in, so one
  # registration works across every consumer repo.
  command -v serena &>/dev/null || return 0  # not installed — stay silent

  if claude mcp add serena --scope local -- serena start-mcp-server --context=claude-code --project-from-cwd &>/dev/null; then
    echo "  serena MCP: detected and connected (scope: local)"
  else
    echo "  serena MCP: detected but 'claude mcp add' failed — connect manually" >&2
  fi
}

connect_serena

INSTALLED_VERSION="$(cat "$VERSION_DEST" 2>/dev/null | tr -d '[:space:]' || echo "unknown")"
echo ""
echo "quest-system $INSTALLED_VERSION: $UPDATED files installed"
echo "Restart Claude Code if commands don't appear immediately."
