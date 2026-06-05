---
description: Show your adventurer profile — level, EXP, progress to next level, unlocked badges, and locked badges with progress counters.
---

# Quest XP

Display your adventurer profile for this project.

## Step 1: Read profile

Read `.claude/quest-xp/profile.md`.

If it does not exist:
"No adventurer profile found. Run /init-xp to create one without affecting your active quest." Stop.

Extract from YAML frontmatter:
- `adventurer`, `level`, `total-exp`, `quests-completed`, `total-expeditions`
- `total-dangers-mapped`, `total-oaths-sworn`, `total-splits`, `badges`, `derived-from-events`

## Step 1.5: Self-heal the cache from the event log

If `.claude/quest-xp/events.log` exists and its line count ≠ the profile's
`derived-from-events` (or that key is missing), the cache is stale: fold the WHOLE
log (SKILL.md -> "XP derivation (the fold)"), rewrite `profile.md` (all 7 numeric
keys + adventurer + badges UNION + `derived-from-events`), and use the recomputed
values below. If `events.log` is absent, render the profile as-is.

## Step 2: Calculate level progress

Levels run 1–50. The total EXP to reach level N (no file lookup needed):

```
threshold(N)   = 150 * N * (N - 1)                  # 0 at level 1
current level  = highest L in 1..50 with threshold(L) <= total-exp
exp_this_level = total-exp - threshold(current level)
exp_to_next    = 300 * current level                # = threshold(L+1) - threshold(L)
progress_pct   = exp_this_level / exp_to_next
```

Build a 20-character ASCII progress bar:
- Filled chars: `█` × floor(progress_pct × 20)
- Empty chars: `░` × remaining

## Step 3: Determine title

Titles are tiered every 5 levels, ranked `I`–`V` within the tier:

```
tier_titles = [Apprentice Coder, Journeyman Developer, Skilled Developer,
               Senior Developer, Expert Architect, Master Builder, Grand Master,
               Legendary Coder, Mythic Developer, Transcendent Engineer]
tier  = tier_titles[ floor((level - 1) / 5) ]
rank  = [I, II, III, IV, V][ (level - 1) mod 5 ]
title = "{tier} {rank}"          # e.g. level 1 = "Apprentice Coder I"
```

## Step 4: Build badge list

All badges:

| Badge | Name               | Unlock condition                          |
|-------|--------------------|-------------------------------------------|
| 🗡️    | First Blood        | Complete your first quest                 |
| 📜    | Scroll Keeper      | Complete 5 quests                         |
| ⚔️    | Veteran            | Complete 10 quests                        |
| 🏆    | Legend             | Complete 25 quests                        |
| 🕵️    | Danger Mapper      | Map 10 total dangers                      |
| ☠️    | Danger Hoarder     | Map 50 total dangers                      |
| 🤝    | Oath Keeper        | Swear 10 total oaths                      |
| 📚    | Lore Master        | Swear 50 total oaths                      |
| 🚀    | Speed Runner       | Complete a quest in ≤ 3 expeditions       |
| 🧘    | Marathoner         | Log 50 total expeditions                  |
| 🔥    | Unstoppable        | Log 200 total expeditions                 |
| ✨    | Clean Sweep        | Complete a quest with zero open riddles   |
| 📂    | Split Master       | Trigger 5 scroll splits                   |
| 🌟    | Rising Star        | Reach level 5                             |
| 💎    | Diamond            | Reach level 10                            |

Split badges into two groups:
- **Unlocked**: badges listed in the `badges` frontmatter array
- **Locked**: all others

For locked badges, calculate progress counters where applicable:
- Scroll Keeper: {quests-completed}/5
- Veteran: {quests-completed}/10
- Legend: {quests-completed}/25
- Danger Mapper: {total-dangers-mapped}/10
- Danger Hoarder: {total-dangers-mapped}/50
- Oath Keeper: {total-oaths-sworn}/10
- Lore Master: {total-oaths-sworn}/50
- Marathoner: {total-expeditions}/50
- Unstoppable: {total-expeditions}/200
- Split Master: {total-splits}/5

## Step 5: Output

```
╔══════════════════════════════════════════════╗
║  ⚔️  {adventurer}                              ║
║  Level {level} — {title}                      ║
╚══════════════════════════════════════════════╝

EXP: {total-exp}
{progress bar}  {exp_this_level} / {exp_to_next} to Level {level+1}

Stats:
  Quests completed:    {quests-completed}
  Total expeditions:   {total-expeditions}
  Dangers mapped:      {total-dangers-mapped}
  Oaths sworn:         {total-oaths-sworn}
  Scroll splits:       {total-splits}

Badges ({unlocked count}/{total count}):
```

If unlocked badges exist, list them:
```
  ✅  🗡️  First Blood          — Completed your first quest
  ✅  🕵️  Danger Mapper        — Mapped 10 total dangers
```

Then list locked badges with progress:
```
  🔒  📜  Scroll Keeper        — Complete 5 quests  ({quests-completed}/5)
  🔒  ☠️  Danger Hoarder       — Map 50 dangers  ({total-dangers-mapped}/50)
```

If level is 50: replace the progress bar section with:
```
  ✨  MAX LEVEL — Transcendent Engineer V  ✨
```
