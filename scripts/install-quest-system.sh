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
# Retry transient network failures (timeouts, 5xx) so a flaky connection does not
# half-install. --retry-delay grows with backoff; portable to macOS's bundled curl.
CURL=(curl -fsSL --retry 3 --retry-delay 2)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-install-quest-system.sh}")" 2>/dev/null && pwd || echo "")"
LOCAL_COMMANDS="$SCRIPT_DIR/../skills/quest-system/commands"
LOCAL_HOOKS="$SCRIPT_DIR/../hooks"
LOCAL_UPDATE_SKILL="$SCRIPT_DIR/../skills/update-quest-system/SKILL.md"
LOCAL_VERSION="$SCRIPT_DIR/../skills/quest-system/VERSION"
LOCAL_SETTINGS_EXAMPLE="$SCRIPT_DIR/../settings.local.json.example"
LOCAL_AGENTS="$SCRIPT_DIR/../agents"
COMMANDS_DEST=".claude/commands"
HOOKS_DEST=".claude/hooks"
AGENTS_DEST=".claude/agents"
UPDATE_SKILL_DEST=".claude/skills/update-quest-system/SKILL.md"
VERSION_DEST=".claude/commands/.quest-system-version"
SETTINGS_LOCAL_DEST=".claude/settings.local.json"
# Manifests record exactly which command/agent files THIS script installed last
# run. On update we delete files listed in the old manifest but absent from the
# new ship list (renamed/removed upstream) — and only those, so a user's own
# custom commands or agents are never touched.
CMD_MANIFEST=".claude/commands/.quest-system-manifest"
AGENT_MANIFEST=".claude/agents/.quest-system-manifest"

# Fallback list used for remote installs where directory listing is unavailable.
REMOTE_COMMANDS=(
  ask-sages.md
  set-bounty.md
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
  quest-help.md
  start-quest.md
  summon-witch-doctor.md
  hunt-bugs.md
  setup-obsidian.md
  open-obsidian.md
)

# Commands shipped by older versions that have since been renamed or removed.
# These are pruned from .claude/commands/ on every install/update so a stale
# command file can never linger. SAFE: only these exact, quest-system-owned
# names are deleted — never a user's own custom slash commands. Add a name here
# whenever a command file is removed or renamed in skills/quest-system/commands/.
RETIRED_COMMANDS=(
  campaign.md
  side-quest.md
  close-side-quest.md
)

# Legacy file names used before the manifest existed, seeded into a MISSING
# manifest so the first update of a pre-manifest install still self-heals (the
# manifest-diff prune below then removes any that are no longer shipped). The
# agents gained an `fp-` prefix; commands were never renamed or removed.
LEGACY_COMMANDS=(
)
LEGACY_AGENTS=(
  code-architect.md
  code-explorer.md
  code-reviewer.md
  doc-reviewer.md
  frontend-designer.md
  performance-reviewer.md
  security-reviewer.md
)

HOOKS=(
  session-start.sh
  quest-system-verify.sh
  quest-lifecycle-bump.sh
  quest-agent-trace.sh
)

# The full fp- agent suite quest-system can summon: counsel-quest spawns
# architect+explorer; make-camp/complete-quest summon the reviewers; UI quests
# summon the designers; counsel-plan/embark summon the plan reviewer. Shipping
# all keeps every command's agents available.
AGENTS=(
  fp-code-architect.md
  fp-code-explorer.md
  fp-code-reviewer.md
  fp-plan-reviewer.md
  fp-security-reviewer.md
  fp-performance-reviewer.md
  fp-doc-reviewer.md
  fp-frontend-designer.md
  fp-swiftui-designer.md
)

mkdir -p "$COMMANDS_DEST" "$HOOKS_DEST" "$AGENTS_DEST" "$(dirname "$UPDATE_SKILL_DEST")"

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
  for agent in "${AGENTS[@]}"; do
    src="$LOCAL_AGENTS/$agent"
    if [ -f "$src" ]; then
      cp "$src" "$AGENTS_DEST/$agent"
      echo "  agents/$agent"
      UPDATED=$((UPDATED + 1))
    else
      echo "  SKIP (not found): agents/$agent" >&2
    fi
  done

  if [ -f "$LOCAL_UPDATE_SKILL" ]; then
    cp "$LOCAL_UPDATE_SKILL" "$UPDATE_SKILL_DEST"
    echo "  skills/update-quest-system/SKILL.md"
    UPDATED=$((UPDATED + 1))
  else
    echo "  SKIP (not found): skills/update-quest-system/SKILL.md" >&2
  fi

  if [ -f "$LOCAL_VERSION" ]; then
    cp "$LOCAL_VERSION" "$VERSION_DEST"
    echo "  .quest-system-version ($(tr -d '[:space:]' < "$LOCAL_VERSION"))"
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
    "Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/skills/quest-system/VERSION -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' 2>/dev/null | tr -d '[:space:]')",
    'Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash)',
]

# Stale rules from older installs to prune (e.g. the loose trailing-wildcard
# VERSION rule, replaced by the exact-command rule above).
DEPRECATED = [
    'Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/skills/quest-system/VERSION *)',
]

BUMP_CMD = "$CLAUDE_PROJECT_DIR/.claude/hooks/quest-lifecycle-bump.sh"

path = pathlib.Path(sys.argv[1])
data = json.loads(path.read_text())
allow = data.setdefault("permissions", {}).setdefault("allow", [])
allow[:] = [r for r in allow if r not in DEPRECATED]
for rule in RULES:
    if rule not in allow:
        allow.insert(0, rule)

# Wire the activity-driven lifecycle bump as a PostToolUse(Edit|Write) hook so
# the dashboard phase advances to `embarked` on the first real edit. Idempotent:
# only added when no group already runs the command.
post = data.setdefault("hooks", {}).setdefault("PostToolUse", [])
already = any(
    h.get("command") == BUMP_CMD
    for group in post
    for h in group.get("hooks", [])
)
if not already:
    target = next((g for g in post if g.get("matcher") == "Edit|Write"), None)
    if target is None:
        target = {"matcher": "Edit|Write", "hooks": []}
        post.append(target)
    target.setdefault("hooks", []).append({
        "type": "command",
        "command": BUMP_CMD,
        "timeout": 5000,
        "statusMessage": "Updating quest phase...",
    })

# Wire the sub-agent trace as a PostToolUse(Agent|Task) hook so the dashboard can
# surface recent sub-agent activity. Task was renamed Agent in CC v2.1.63; match
# both. Idempotent: only added when no group already runs the command.
TRACE_CMD = "$CLAUDE_PROJECT_DIR/.claude/hooks/quest-agent-trace.sh"
trace_already = any(
    h.get("command") == TRACE_CMD
    for group in post
    for h in group.get("hooks", [])
)
if not trace_already:
    tgt = next((g for g in post if g.get("matcher") == "Agent|Task"), None)
    if tgt is None:
        tgt = {"matcher": "Agent|Task", "hooks": []}
        post.append(tgt)
    tgt.setdefault("hooks", []).append({
        "type": "command",
        "command": TRACE_CMD,
        "timeout": 5000,
        "statusMessage": "Recording sub-agent...",
    })

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
    if "${CURL[@]}" "$url" -o "$COMMANDS_DEST/$cmd"; then
      echo "  $cmd"
      UPDATED=$((UPDATED + 1))
    else
      echo "  FAIL: $cmd (HTTP error)" >&2
    fi
  done
  for hook in "${HOOKS[@]}"; do
    url="$REPO/hooks/$hook"
    if "${CURL[@]}" "$url" -o "$HOOKS_DEST/$hook"; then
      chmod +x "$HOOKS_DEST/$hook"
      echo "  hooks/$hook"
      UPDATED=$((UPDATED + 1))
    else
      echo "  FAIL: hooks/$hook (HTTP error)" >&2
    fi
  done
  for agent in "${AGENTS[@]}"; do
    url="$REPO/agents/$agent"
    if "${CURL[@]}" "$url" -o "$AGENTS_DEST/$agent"; then
      echo "  agents/$agent"
      UPDATED=$((UPDATED + 1))
    else
      echo "  FAIL: agents/$agent (HTTP error)" >&2
    fi
  done

  update_url="$REPO/skills/update-quest-system/SKILL.md"
  if "${CURL[@]}" "$update_url" -o "$UPDATE_SKILL_DEST"; then
    echo "  skills/update-quest-system/SKILL.md"
    UPDATED=$((UPDATED + 1))
  else
    echo "  FAIL: skills/update-quest-system/SKILL.md (HTTP error)" >&2
  fi

  # Cache-Control/Pragma force raw.githubusercontent to revalidate; its CDN
  # otherwise serves a stale VERSION for ~5 min after a release.
  if "${CURL[@]}" -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' "$REPO/skills/quest-system/VERSION" -o "$VERSION_DEST"; then
    echo "  .quest-system-version ($(tr -d '[:space:]' < "$VERSION_DEST"))"
    UPDATED=$((UPDATED + 1))
  else
    echo "  FAIL: skills/quest-system/VERSION (HTTP error)" >&2
  fi

  if [ ! -f "$SETTINGS_LOCAL_DEST" ]; then
    if "${CURL[@]}" "$REPO/settings.local.json.example" -o "$SETTINGS_LOCAL_DEST"; then
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
    "Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/skills/quest-system/VERSION -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' 2>/dev/null | tr -d '[:space:]')",
    'Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash)',
]

# Stale rules from older installs to prune (e.g. the loose trailing-wildcard
# VERSION rule, replaced by the exact-command rule above).
DEPRECATED = [
    'Bash(curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/skills/quest-system/VERSION *)',
]

BUMP_CMD = "$CLAUDE_PROJECT_DIR/.claude/hooks/quest-lifecycle-bump.sh"

path = pathlib.Path(sys.argv[1])
data = json.loads(path.read_text())
allow = data.setdefault("permissions", {}).setdefault("allow", [])
allow[:] = [r for r in allow if r not in DEPRECATED]
for rule in RULES:
    if rule not in allow:
        allow.insert(0, rule)

# Wire the activity-driven lifecycle bump as a PostToolUse(Edit|Write) hook so
# the dashboard phase advances to `embarked` on the first real edit. Idempotent:
# only added when no group already runs the command.
post = data.setdefault("hooks", {}).setdefault("PostToolUse", [])
already = any(
    h.get("command") == BUMP_CMD
    for group in post
    for h in group.get("hooks", [])
)
if not already:
    target = next((g for g in post if g.get("matcher") == "Edit|Write"), None)
    if target is None:
        target = {"matcher": "Edit|Write", "hooks": []}
        post.append(target)
    target.setdefault("hooks", []).append({
        "type": "command",
        "command": BUMP_CMD,
        "timeout": 5000,
        "statusMessage": "Updating quest phase...",
    })

# Wire the sub-agent trace as a PostToolUse(Agent|Task) hook so the dashboard can
# surface recent sub-agent activity. Task was renamed Agent in CC v2.1.63; match
# both. Idempotent: only added when no group already runs the command.
TRACE_CMD = "$CLAUDE_PROJECT_DIR/.claude/hooks/quest-agent-trace.sh"
trace_already = any(
    h.get("command") == TRACE_CMD
    for group in post
    for h in group.get("hooks", [])
)
if not trace_already:
    tgt = next((g for g in post if g.get("matcher") == "Agent|Task"), None)
    if tgt is None:
        tgt = {"matcher": "Agent|Task", "hooks": []}
        post.append(tgt)
    tgt.setdefault("hooks", []).append({
        "type": "command",
        "command": TRACE_CMD,
        "timeout": 5000,
        "statusMessage": "Recording sub-agent...",
    })

path.write_text(json.dumps(data, indent=2) + "\n")
PY
    echo "  settings.local.json"
  fi
fi

# Prune retired commands from older installs (renamed/removed upstream). Scoped
# to the explicit RETIRED_COMMANDS list — never touches a user's own commands.
# Belt-and-suspenders for installs that predate the manifest below.
# Guard the expansion: an empty array under `set -u` is unbound in bash 3.2 (macOS).
if [ ${#RETIRED_COMMANDS[@]} -gt 0 ]; then
  for old in "${RETIRED_COMMANDS[@]}"; do
    if [ -f "$COMMANDS_DEST/$old" ]; then
      rm -f "$COMMANDS_DEST/$old"
      echo "  pruned retired command: $old"
      UPDATED=$((UPDATED + 1))
    fi
  done
fi

# Manifest-diff orphan prune. Removes only files THIS script recorded installing
# on a previous run that are no longer in the current ship list — so renamed or
# removed commands/agents self-clean, while a user's own files (never in the
# manifest) are left untouched. Then rewrite the manifest with the current set.
prune_orphans() {
  local manifest="$1" dest="$2"; shift 2
  if [ -f "$manifest" ]; then
    while IFS= read -r old; do
      [ -z "$old" ] && continue
      local keep=0 cur
      for cur in "$@"; do
        [ "$cur" = "$old" ] && { keep=1; break; }
      done
      if [ "$keep" -eq 0 ] && [ -f "$dest/$old" ]; then
        rm -f "$dest/$old"
        echo "  pruned orphan: $dest/$old"
        UPDATED=$((UPDATED + 1))
      fi
    done < "$manifest"
  fi
  printf '%s\n' "$@" > "$manifest"
}

# Seed a MISSING manifest with the legacy names so a pre-manifest install's first
# update can still prune renamed files. Guard empty arrays for bash 3.2 + set -u.
seed_manifest() {
  local manifest="$1"; shift
  [ -f "$manifest" ] && return 0   # real manifest already present — leave it
  [ "$#" -gt 0 ] && printf '%s\n' "$@" > "$manifest"
}
if [ ${#LEGACY_COMMANDS[@]} -gt 0 ]; then seed_manifest "$CMD_MANIFEST" "${LEGACY_COMMANDS[@]}"; fi
if [ ${#LEGACY_AGENTS[@]} -gt 0 ]; then seed_manifest "$AGENT_MANIFEST" "${LEGACY_AGENTS[@]}"; fi

prune_orphans "$CMD_MANIFEST" "$COMMANDS_DEST" "${COMMANDS[@]}"
prune_orphans "$AGENT_MANIFEST" "$AGENTS_DEST" "${AGENTS[@]}"

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
  # the legacy `serena-mcp-server` binary (unverified flags). The registration
  # is per-project (local scope), so each consumer repo runs install once;
  # --project-from-cwd keeps the server itself project-agnostic.
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
echo "Interactive tutorial (no install needed): https://findexu.github.io/finpack-claude/"
echo "Restart Claude Code if commands don't appear immediately."
