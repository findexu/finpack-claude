#!/usr/bin/env bash
# Versioning discipline gate: any change under skills/<name>/ must come with a
# `version:` change in that skill's SKILL.md frontmatter, and any change under
# agents/ must come with an agents/VERSION change — sync-plugins.sh stamps
# those versions into the plugin manifests, so an unbumped change is invisible
# to `claude plugin update`. Scope is skills/ + agents/ ONLY (rules/, hooks/,
# scripts/ carry no version source). Diff base: merge-base with main; SKIPs
# cleanly when no main ref is reachable (e.g. shallow CI checkout).
# Diffs base..working-tree so violations surface before commit.
# Exit 0 on pass/skip, 1 on any fail.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

base=""
for ref in main origin/main; do
  base="$(git merge-base HEAD "$ref" 2>/dev/null)" && break
done
if [ -z "$base" ]; then
  echo "  SKIP  version-bump-check (no main merge-base available)"
  exit 0
fi

fails=""

# skills/<name>/** (files inside a skill dir; skills/README.md is docs)
for s in $(git diff --name-only "$base" -- skills/ | awk -F/ 'NF>=3 {print $2}' | sort -u); do
  [ -f "skills/$s/SKILL.md" ] || continue  # skill removed entirely — nothing left to version
  if ! git diff "$base" -- "skills/$s/SKILL.md" | grep -qE '^[+-]version:'; then
    fails="$fails\n  skills/$s changed without a SKILL.md frontmatter version bump"
  fi
done

# agents/** -> agents/VERSION must change too
if [ -n "$(git diff --name-only "$base" -- agents/)" ]; then
  if [ -z "$(git diff --name-only "$base" -- agents/VERSION)" ]; then
    fails="$fails\n  agents/ changed without an agents/VERSION bump"
  fi
fi

if [ -n "$fails" ]; then
  echo "  FAIL  version-bump-check"
  # shellcheck disable=SC2059  # $fails deliberately carries \n escapes for printf to expand
  printf "$fails\n" | sed 's/^/       /'
  exit 1
fi
echo "  PASS  version-bump-check: every changed skills/agents source carries a version bump"
