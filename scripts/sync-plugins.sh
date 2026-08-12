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

# JSON keywords array derived from a description: significant lowercase words,
# stopwords and short words dropped, deduped in order, capped at 8. Purely
# deterministic so re-running sync never churns the generated manifests.
keywords_json() {
  local w out=""
  while IFS= read -r w; do
    out="$out${out:+, }\"$w\""
  done < <(printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '\n' |
    awk 'length($0) >= 3 && !seen[$0]++ && $0 !~ /^(the|and|for|with|that|this|from|into|are|not|its|your|any|all|one|per|via|use|used|uses|when|then|also|has|have|only|can|non|out|but|nine|focused|every|each|both|you|get|like|real|step|first)$/' |
    head -8)
  printf '[%s]' "$out"
}

# displayName from a plugin name: "quest-system" -> "Quest System"; "fp" stays
# an acronym ("fp-agents" -> "FP Agents").
display_name() {
  local w out=""
  for w in ${1//-/ }; do
    if [ "$w" = "fp" ]; then w="FP"; else w="$(printf '%s' "${w:0:1}" | tr '[:lower:]' '[:upper:]')${w:1}"; fi
    out="$out${out:+ }$w"
  done
  printf '%s' "$out"
}

# 1. Sync agents: agents/fp-*.md -> plugins/fp-agents/agents/ — ONE consolidated
#    plugin carrying the whole agent suite (the 9 per-agent fp-* plugins were
#    retired 2026-08-12; installed agent names become fp-agents:fp-<name>).
#    The manifest is (re)generated every sync; its version comes from
#    agents/VERSION — bump that file to ship an agent change. The agents dir is
#    removed first so agents deleted from agents/ drop out of the mirror too.
rm -rf "plugins/fp-agents/agents"
mkdir -p "plugins/fp-agents/agents" "plugins/fp-agents/.claude-plugin"
for f in agents/*.md; do
  name="$(basename "$f" .md)"
  [ "$name" = "README" ] && continue
  cp "$f" "plugins/fp-agents/agents/$name.md"
  echo "  agent  fp-agents <- $name"
done
agents_ver="$( { tr -d '[:space:]' < agents/VERSION; } 2>/dev/null || true)"
agents_ver="${agents_ver:-1.0.0}"
agents_desc="Nine focused engineering agents: code/security/performance/doc/plan review, frontend + SwiftUI design, architecture, exploration."
cat > "plugins/fp-agents/.claude-plugin/plugin.json" <<JSON
{
  "name": "fp-agents",
  "displayName": "$(display_name fp-agents)",
  "version": "$agents_ver",
  "description": "$agents_desc",
  "keywords": $(keywords_json "$agents_desc"),
  "author": { "name": "findexu" },
  "license": "MIT",
  "homepage": "https://github.com/findexu/finpack-claude",
  "repository": "https://github.com/findexu/finpack-claude"
}
JSON

# 2. Sync skills: skills/<name>/SKILL.md -> plugins/<name>/skills/<name>/SKILL.md
#    Also sync skills/<name>/commands/*.md -> plugins/<name>/skills/<name>/commands/*.md
#    The per-plugin skills dir is removed first so files deleted from skills/
#    disappear from the committed mirror too (deletion-safe, like the template).
#    The plugin manifest is (re)generated from the SKILL.md frontmatter so
#    .claude-plugin/plugin.json never drifts from the skill it describes.
for d in skills/*/; do
  name="$(basename "$d")"
  [ -f "${d}SKILL.md" ] || continue
  rm -rf "plugins/$name/skills" "plugins/$name/commands"
  mkdir -p "plugins/$name/skills/$name" "plugins/$name/.claude-plugin"
  cp "${d}SKILL.md" "plugins/$name/skills/$name/SKILL.md"
  # Frontmatter description: single-line `description: value` or a folded
  # `description: >` block (continuation lines joined with spaces); JSON-escape it.
  desc="$(awk '
    NR==1 && $0=="---" { fm=1; next }
    fm && !fold && /^description:[[:space:]]*>-?[[:space:]]*$/ { fold=1; next }
    fm && !fold && /^description:/ { line=$0; sub(/^description:[[:space:]]*/, "", line); print line; done=1; exit }
    fold && /^[[:space:]]/ { t=$0; gsub(/^[[:space:]]+|[[:space:]]+$/, "", t); buf = buf (buf ? " " : "") t; next }
    fold { done=1; exit }
    fm && $0=="---" { exit }
    END { if (!done && buf != "") print buf; else if (done && fold) print buf }
  ' "${d}SKILL.md" | sed 's/\\/\\\\/g; s/"/\\"/g')"
  # Version from the skill frontmatter (default 0.1.0). Stamped into plugin.json so
  # `claude plugin update` can detect changes; bump the frontmatter `version:` to ship.
  ver="$(sed -n 's/^version:[[:space:]]*//p' "${d}SKILL.md" | head -1)"; ver="${ver:-0.1.0}"
  # The two quest-system wrappers operate on an installed quest-system, so they
  # declare it as a plugin dependency (validated shape: array of names —
  # `claude plugin validate --strict`, CLI 2.1.228).
  deps=""
  case "$name" in
    install-quest-system|update-quest-system) deps='
  "dependencies": ["quest-system"],' ;;
  esac
  cat > "plugins/$name/.claude-plugin/plugin.json" <<JSON
{
  "name": "$name",
  "displayName": "$(display_name "$name")",
  "version": "$ver",
  "description": "$desc",
  "keywords": $(keywords_json "$desc"),$deps
  "author": { "name": "findexu" },
  "license": "MIT",
  "homepage": "https://github.com/findexu/finpack-claude",
  "repository": "https://github.com/findexu/finpack-claude"
}
JSON
  echo "  skill  $name"
  if [ -d "${d}commands" ]; then
    # nullglob makes an empty commands/ expand to nothing; guard so `cp` is not
    # called with only a destination arg (exit 64 would abort the whole sync).
    cmd_files=("${d}commands/"*.md)
    if [ ${#cmd_files[@]} -gt 0 ]; then
      mkdir -p "plugins/$name/skills/$name/commands"
      cp "${cmd_files[@]}" "plugins/$name/skills/$name/commands/"
      # Also mirror to the PLUGIN ROOT commands/ — the only location Claude Code
      # registers as native slash commands (/<plugin>:<command>). The skill-dir
      # copy stays: SKILL.md references its templates skill-relative, and the
      # install script copies from there for repo-copy (non-plugin) installs.
      mkdir -p "plugins/$name/commands"
      cp "${cmd_files[@]}" "plugins/$name/commands/"
      echo "  commands  $name (skill + plugin root)"
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
#      Removed first so agents deleted from agents/ drop out of the bundle too.
if [ -d "plugins/quest-system" ]; then
  rm -rf "plugins/quest-system/agents"
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
