---
description: Bootstrap the adventurer XP profile for an existing project without creating a new quest. Use when quest-system was installed or migrated but no profile.md exists yet.
---

# Init XP

Create the adventurer profile for this project without touching any quest scrolls or active-quest.txt.

## Step 1: Check for existing profile

Read `.claude/quest-xp/profile.md`.

If it already exists:
```
Adventurer profile already exists. Run /quest-xp to view it.
```
Stop.

## Step 2: Get adventurer name

Run `git config user.name`. If unavailable or empty, use "Adventurer".

## Step 3: Create profile

Create `.claude/quest-xp/` directory if it does not exist.

Create `.claude/quest-xp/profile.md`:
```
---
adventurer: {git-user-name}
level: 1
total-exp: 0
quests-completed: 0
total-expeditions: 0
total-dangers-mapped: 0
total-oaths-sworn: 0
total-splits: 0
badges: []
---
# {git-user-name}'s Adventurer Profile

Complete quests, log expeditions, and map dangers to earn EXP.
Run /quest-xp to view your profile.
```

Create `.claude/quest-xp/quest-history.md` if it does not exist:
```
# Quest History

Append-only EXP log. One entry per completed quest.
```

## Step 4: Update .gitignore

Read `.gitignore` if it exists.
If `.claude/quest-xp/` is not already present, append it.
If `.gitignore` does not exist, create it with that single line.

## Step 5: Confirm

```
⚔️  Adventurer profile created.

Name:  {git-user-name}
Level: 1 — Apprentice Coder
EXP:   0

Run /quest-xp to view your profile.
```
