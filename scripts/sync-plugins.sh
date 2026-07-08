#!/usr/bin/env bash
# Sync source agents/ and skills/ into per-plugin directories, and bundle the
# full finpack-claude template into plugins/setup-finpack/template/ so that plugin
# can bootstrap .claude/ from scratch in any project.
#
# Plugins must be self-contained (Claude Code copies each plugin to a cache
# on install and paths can't escape the plugin root), so each agent/skill
# physically lives inside its plugin folder.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

shopt -s nullglob

# 1. Sync agents: agents/<name>.md -> plugins/<name>/agents/<name>.md
#    Also (re)generate the plugin manifest from the agent's frontmatter so the
#    .claude-plugin/plugin.json never drifts from the agent it describes.
for f in agents/*.md; do
  name="$(basename "$f" .md)"
  [ "$name" = "README" ] && continue
  mkdir -p "plugins/$name/agents" "plugins/$name/.claude-plugin"
  cp "$f" "plugins/$name/agents/$name.md"
  # Pull the first `description:` value from the agent frontmatter; JSON-escape it.
  desc="$(sed -n 's/^description:[[:space:]]*//p' "$f" | head -1 | sed 's/\\/\\\\/g; s/"/\\"/g')"
  # Version from the agent frontmatter (default 0.1.0). Stamped into plugin.json so
  # `claude plugin update` can detect changes; bump the frontmatter `version:` to ship.
  ver="$(sed -n 's/^version:[[:space:]]*//p' "$f" | head -1)"; ver="${ver:-0.1.0}"
  cat > "plugins/$name/.claude-plugin/plugin.json" <<JSON
{
  "name": "$name",
  "version": "$ver",
  "description": "$desc",
  "author": { "name": "findexu" },
  "license": "MIT",
  "homepage": "https://github.com/findexu/finpack-claude",
  "repository": "https://github.com/findexu/finpack-claude"
}
JSON
  echo "  agent  $name"
done

# 2. Sync skills: skills/<name>/SKILL.md -> plugins/<name>/skills/<name>/SKILL.md
#    Also sync skills/<name>/commands/*.md -> plugins/<name>/skills/<name>/commands/*.md
for d in skills/*/; do
  name="$(basename "$d")"
  [ -f "${d}SKILL.md" ] || continue
  mkdir -p "plugins/$name/skills/$name"
  cp "${d}SKILL.md" "plugins/$name/skills/$name/SKILL.md"
  echo "  skill  $name"
  if [ -d "${d}commands" ]; then
    # nullglob makes an empty commands/ expand to nothing; guard so `cp` is not
    # called with only a destination arg (exit 64 would abort the whole sync).
    cmd_files=("${d}commands/"*.md)
    if [ ${#cmd_files[@]} -gt 0 ]; then
      mkdir -p "plugins/$name/skills/$name/commands"
      cp "${cmd_files[@]}" "plugins/$name/skills/$name/commands/"
      echo "  commands  $name"
    fi
  fi
  if [ -f "${d}VERSION" ]; then
    cp "${d}VERSION" "plugins/$name/skills/$name/VERSION"
  fi
done

# 2.5. Bundle the full fp- agent suite into the quest-system plugin. Plugins are
#      self-contained on install, so quest-system must carry every agent it can
#      summon: counsel-quest spawns architect+explorer; make-camp/complete-quest
#      summon the reviewers; UI quests summon the designers.
if [ -d "plugins/quest-system" ]; then
  mkdir -p "plugins/quest-system/agents"
  for f in agents/fp-*.md; do
    dep="$(basename "$f")"
    cp "$f" "plugins/quest-system/agents/$dep"
    echo "  dep    quest-system <- $dep"
  done
fi

# 3. Bundle the full finpack-claude template into the setup-finpack plugin
#    so it can bootstrap .claude/ in any project at install time.
TEMPLATE="plugins/setup-finpack/template"
rm -rf "$TEMPLATE"
mkdir -p "$TEMPLATE"

cp settings.json                   "$TEMPLATE/"
[ -f settings.local.json.example ] && cp settings.local.json.example "$TEMPLATE/"
cp CLAUDE.md                       "$TEMPLATE/"
cp CLAUDE.local.md.example         "$TEMPLATE/"
cp -r rules                        "$TEMPLATE/"
cp -r skills                       "$TEMPLATE/"
cp -r agents                       "$TEMPLATE/"
cp -r hooks                        "$TEMPLATE/"
rm -f "$TEMPLATE/hooks/quest-system-verify.sh"
rm -rf "$TEMPLATE/hooks/tests"

echo "  bundle setup-finpack/template (full finpack-claude content)"
echo "Done."
