#!/usr/bin/env bash
# Unit tests for scripts/quest-xp-fold.sh (the XP-fold oracle).
# Feeds fixture event logs and asserts the derived KEY=VALUE output.
# Exit 0 on all pass, 1 on any fail.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FOLD="$ROOT/scripts/quest-xp-fold.sh"

pass=0; fail=0; failed=()

# assert_line <log-content> <case-name> <expected KEY=VALUE> ...
assert_line() {
  local log="$1" name="$2"; shift 2
  local tmp out ok=1
  tmp=$(mktemp); printf '%s' "$log" > "$tmp"
  out=$(bash "$FOLD" "$tmp"); rm -f "$tmp"
  local exp
  for exp in "$@"; do
    grep -qxF -- "$exp" <<< "$out" || { ok=0; printf '    missing: %s\n' "$exp"; }
  done
  if [ $ok -eq 1 ]; then printf '  PASS  xp-fold :: %s\n' "$name"; pass=$((pass+1))
  else printf '  FAIL  xp-fold :: %s\n' "$name"; printf '%s\n' "$out" | sed 's/^/        /'; fail=$((fail+1)); failed+=("$name"); fi
}

# 1. seed + expedition continuity; badges preserved by UNION (Speed Runner / Clean
#    Sweep are NOT counter-derivable here, so only the seed keeps them).
assert_line \
"2026-06-04|seed|-|total-exp=2855;quests-completed=2;total-expeditions=13;total-dangers-mapped=18;total-oaths-sworn=41;total-splits=0;badges=First Blood,Oath Keeper,Clean Sweep,Rising Star,Danger Mapper,Speed Runner
2026-06-04|expedition|main|dangers=0;oaths=1;split=0" \
"seed+expedition continuity, badge union" \
"total-exp=2870" "level=4" "total-expeditions=14" "total-oaths-sworn=42" "derived-from-events=2"

# badge union must retain the non-derivable seed badges
assert_line \
"2026-06-04|seed|-|total-exp=2855;quests-completed=2;total-expeditions=13;total-dangers-mapped=18;total-oaths-sworn=41;total-splits=0;badges=First Blood,Oath Keeper,Clean Sweep,Rising Star,Danger Mapper,Speed Runner
2026-06-04|expedition|main|dangers=0;oaths=1;split=0" \
"badge union keeps Speed Runner + Clean Sweep" \
"badges=First Blood,Oath Keeper,Clean Sweep,Rising Star,Danger Mapper,Speed Runner"

# 2. fresh fold, no seed: one expedition with a danger → 5 + 10 = 15.
assert_line \
"2026-06-04|expedition|x|dangers=2;oaths=0;split=0" \
"fresh expedition reward (base + dangers)" \
"total-exp=15" "level=1" "total-expeditions=1" "total-dangers-mapped=2" "total-oaths-sworn=0" "derived-from-events=1"

# 3. quest-complete bonuses; counters NOT double-added (only quests-completed).
#    100 + 4*25 + 3*10 + 6*15 + 2*20 + 1*50 + 75(clean) + 50(speed) = 535
assert_line \
"2026-06-04|quest-complete|x|modules=4;expeditions=3;dangers=6;oaths=2;splits=1;clean=1;speed=1" \
"quest-complete reward + bonuses, no counter double-count" \
"total-exp=535" "quests-completed=1" "total-expeditions=0" "total-dangers-mapped=0" "total-splits=0"

# quest-complete with flags unlocks Speed Runner + Clean Sweep + First Blood
assert_line \
"2026-06-04|quest-complete|x|modules=0;expeditions=2;dangers=0;oaths=0;splits=0;clean=1;speed=1" \
"quest-complete flags unlock Speed Runner/Clean Sweep/First Blood" \
"badges=First Blood,Speed Runner,Clean Sweep"

# 4. level + Rising Star derive from total-exp crossing the level-5 threshold (3000).
assert_line \
"2026-06-04|seed|-|total-exp=3000;quests-completed=1;total-expeditions=1;total-dangers-mapped=0;total-oaths-sworn=0;total-splits=0;badges=First Blood" \
"level 5 + Rising Star derived at 3000 exp" \
"level=5" "title=Apprentice Coder V" "badges=First Blood,Rising Star"

# 5. malformed line is skipped (still counted in derived-from-events? no — only valid
#    types accumulate; a junk line is ignored but read). Assert it does not crash and
#    the valid expedition still scores.
assert_line \
"garbage line with no pipes
2026-06-04|expedition|x|dangers=0;oaths=0;split=0" \
"malformed line skipped, valid line still folds" \
"total-exp=5" "total-expeditions=1"

echo
echo "xp-fold: $pass passed, $fail failed"
[ $fail -eq 0 ] || { printf 'Failed: %s\n' "${failed[@]}"; exit 1; }
exit 0
