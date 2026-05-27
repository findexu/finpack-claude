---
description: Show your adventurer profile — level, EXP, progress to next level, unlocked badges, and locked badges with progress counters.
---

# Quest XP

Display your adventurer profile for this project.

## Step 1: Read profile

Read `.claude/quest-xp/profile.md`.

If it does not exist:
"No adventurer profile found. Run /new-quest to start your first quest and create a profile." Stop.

Extract from YAML frontmatter:
- `adventurer`, `level`, `total-exp`, `quests-completed`, `total-expeditions`
- `total-dangers-mapped`, `total-oaths-sworn`, `total-splits`, `badges`

## Step 2: Calculate level progress

Look up the current level and next level EXP thresholds from the level table
in `.claude/skills/quest-system/SKILL.md` section `## XP system`.

```
exp_this_level = total-exp - threshold[current level]
exp_to_next    = threshold[current level + 1] - threshold[current level]
progress_pct   = exp_this_level / exp_to_next
```

Build a 20-character ASCII progress bar:
- Filled chars: `█` × floor(progress_pct × 20)
- Empty chars: `░` × remaining

## Step 3: Determine title

Look up title for current level from the level table.

## Step 4: Build badge list

Split badges into two groups:
- **Unlocked**: badges listed in the `badges` frontmatter array
- **Locked**: all other badges from the badge table in SKILL.md

For locked badges, calculate progress counters where applicable:
- Scroll Keeper: {quests-completed}/5
- Veteran Adventurer: {quests-completed}/10
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

If level is 10: replace the progress bar section with:
```
  ✨  MAX LEVEL — Transcendent Engineer  ✨
```
