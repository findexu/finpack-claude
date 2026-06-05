#!/usr/bin/env bash
# Reference implementation of the quest-system XP fold (SKILL.md -> "XP derivation").
# Folds an append-only events.log into the derived profile values.
#
# This is the AUTHORITATIVE oracle for the fold algorithm and the regression test
# target. The LLM-executed commands (make-camp / complete-quest / quest-xp) perform
# the same fold per the SKILL.md prose; keep this script and that prose in lockstep.
#
# Usage:   quest-xp-fold.sh [events.log]      (default: .claude/quest-xp/events.log)
# Output:  KEY=VALUE lines on stdout (easy to assert), e.g.
#            total-exp=2870
#            level=4
#            title=Apprentice Coder IV
#            quests-completed=2
#            total-expeditions=14
#            total-dangers-mapped=18
#            total-oaths-sworn=42
#            total-splits=0
#            badges=First Blood,Oath Keeper,...
#            derived-from-events=7
#
# Event line format (pipe-delimited):  {date}|{type}|{quest}|{k=v;k=v;...}
#   seed           total-exp;quests-completed;total-expeditions;total-dangers-mapped;
#                  total-oaths-sworn;total-splits;badges=A,B,C
#   expedition     dangers;oaths;split
#   quest-complete modules;expeditions;dangers;oaths;splits;clean;speed

set -uo pipefail

LOG="${1:-.claude/quest-xp/events.log}"

total_exp=0
quests_completed=0
total_expeditions=0
total_dangers_mapped=0
total_oaths_sworn=0
total_splits=0
any_speed=0
any_clean=0
lines=0
# Badge set as newline-delimited string (order preserved, dedup on add).
badges=""

NL=$'\n'
has_badge() { printf '%s\n' "$badges" | grep -qxF -- "$1"; }
add_badge() { [ -n "$1" ] || return 0; has_badge "$1" || badges="${badges:+$badges$NL}$1"; }

# Pull a key's value out of a "k=v;k=v" field. Returns "" if absent.
field() { # $1=fields  $2=key
  printf '%s' "$1" | tr ';' '\n' | sed -n "s/^$2=//p" | head -1
}

num() { case "$1" in ''|*[!0-9]*) echo 0 ;; *) echo "$1" ;; esac; }

while IFS= read -r line || [ -n "$line" ]; do
  [ -n "$line" ] || continue
  lines=$((lines+1))
  type=$(printf '%s' "$line" | cut -d'|' -f2)
  data=$(printf '%s' "$line" | cut -d'|' -f4-)
  case "$type" in
    seed)
      total_exp=$(( total_exp + $(num "$(field "$data" total-exp)") ))
      quests_completed=$(( quests_completed + $(num "$(field "$data" quests-completed)") ))
      total_expeditions=$(( total_expeditions + $(num "$(field "$data" total-expeditions)") ))
      total_dangers_mapped=$(( total_dangers_mapped + $(num "$(field "$data" total-dangers-mapped)") ))
      total_oaths_sworn=$(( total_oaths_sworn + $(num "$(field "$data" total-oaths-sworn)") ))
      total_splits=$(( total_splits + $(num "$(field "$data" total-splits)") ))
      seedbadges=$(field "$data" badges)
      if [ -n "$seedbadges" ]; then
        IFS=',' read -ra _bs <<< "$seedbadges"
        for b in "${_bs[@]}"; do add_badge "$(printf '%s' "$b" | sed 's/^ *//;s/ *$//')"; done
      fi
      ;;
    expedition)
      d=$(num "$(field "$data" dangers)"); o=$(num "$(field "$data" oaths)"); s=$(num "$(field "$data" split)")
      total_expeditions=$(( total_expeditions + 1 ))
      total_dangers_mapped=$(( total_dangers_mapped + d ))
      total_oaths_sworn=$(( total_oaths_sworn + o ))
      total_splits=$(( total_splits + s ))
      total_exp=$(( total_exp + 5 ))
      [ "$d" -gt 0 ] && total_exp=$(( total_exp + 10 ))
      [ "$o" -gt 0 ] && total_exp=$(( total_exp + 10 ))
      ;;
    quest-complete)
      m=$(num "$(field "$data" modules)"); e=$(num "$(field "$data" expeditions)")
      d=$(num "$(field "$data" dangers)"); o=$(num "$(field "$data" oaths)")
      s=$(num "$(field "$data" splits)"); c=$(num "$(field "$data" clean)"); sp=$(num "$(field "$data" speed)")
      quests_completed=$(( quests_completed + 1 ))
      total_exp=$(( total_exp + 100 + m*25 + e*10 + d*15 + o*20 + s*50 ))
      [ "$c" -gt 0 ] && { total_exp=$(( total_exp + 75 )); any_clean=1; }
      [ "$sp" -gt 0 ] && { total_exp=$(( total_exp + 50 )); any_speed=1; }
      ;;
    *) : ;;  # skip malformed/unknown line
  esac
done < "$LOG" 2>/dev/null

# Level: 1..50, threshold(N) = 150*N*(N-1). Title is tiered every 5 levels (rank I-V).
tier_titles=("Apprentice Coder" "Journeyman Developer" "Skilled Developer" "Senior Developer" \
        "Expert Architect" "Master Builder" "Grand Master" "Legendary Coder" \
        "Mythic Developer" "Transcendent Engineer")
ranks=(I II III IV V)
level=1
for n in $(seq 1 50); do
  if [ "$total_exp" -ge $(( 150 * n * (n - 1) )) ]; then level=$n; fi
done
title="${tier_titles[$(( (level - 1) / 5 ))]} ${ranks[$(( (level - 1) % 5 ))]}"

# Derived badges (UNION with seed badges already in $badges).
[ "$quests_completed" -ge 1 ]  && add_badge "First Blood"
[ "$quests_completed" -ge 5 ]  && add_badge "Scroll Keeper"
[ "$quests_completed" -ge 10 ] && add_badge "Veteran"
[ "$quests_completed" -ge 25 ] && add_badge "Legend"
[ "$total_dangers_mapped" -ge 10 ] && add_badge "Danger Mapper"
[ "$total_dangers_mapped" -ge 50 ] && add_badge "Danger Hoarder"
[ "$total_oaths_sworn" -ge 10 ] && add_badge "Oath Keeper"
[ "$total_oaths_sworn" -ge 50 ] && add_badge "Lore Master"
[ "$total_expeditions" -ge 50 ]  && add_badge "Marathoner"
[ "$total_expeditions" -ge 200 ] && add_badge "Unstoppable"
[ "$total_splits" -ge 5 ] && add_badge "Split Master"
[ "$level" -ge 5 ]  && add_badge "Rising Star"
[ "$level" -ge 10 ] && add_badge "Diamond"
[ "$any_speed" -eq 1 ] && add_badge "Speed Runner"
[ "$any_clean" -eq 1 ] && add_badge "Clean Sweep"

badges_csv=$(printf '%s' "$badges" | paste -sd, - 2>/dev/null | sed 's/^,//')

echo "total-exp=$total_exp"
echo "level=$level"
echo "title=$title"
echo "quests-completed=$quests_completed"
echo "total-expeditions=$total_expeditions"
echo "total-dangers-mapped=$total_dangers_mapped"
echo "total-oaths-sworn=$total_oaths_sworn"
echo "total-splits=$total_splits"
echo "badges=$badges_csv"
echo "derived-from-events=$lines"
