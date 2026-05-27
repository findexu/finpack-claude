---
name: update-quest-system
description: >
  Update quest-system to the latest version. Overwrites all installed command
  files, the tutorial skill, and the verifier hook with the current source.
  Run after pulling finpack-claude updates to pick up new or changed commands.
  Requires quest-system to already be installed (/install-quest-system).
---

# Update Quest System

Update installed quest-system files to the latest version from source.

## Step 1: Check installation

Look for `.claude/commands/new-quest.md`.

If not found:
```
quest-system is not installed in this project.
Run /install-quest-system first.
```
Stop.

## Step 2: Find source

Try these locations in order — use the first that contains `new-quest.md`:

1. `.claude/skills/quest-system/commands/` — present if you ran `/setup-finpack`
2. `skills/quest-system/commands/` — present if running inside the finpack-claude repo itself

Record the found path as `{source}`.

If neither contains `new-quest.md`:
```
Source not found. Cannot update.
Pull the latest finpack-claude and try again.

Expected locations:
  .claude/skills/quest-system/commands/
  skills/quest-system/commands/
```
Stop.

## Step 3: Show what will be updated and confirm

Output:
```
Updating quest-system from: {source}

Command files (13):
  new-quest, counsel-quest, embark, make-camp, quest-log,
  change-quest, complete-quest, summon-witch-doctor, quest-xp,
  ask-sages, init-xp, counsel-prompt, counsel-plan

Also updating:
  .claude/skills/quest-system-tutorial/SKILL.md
  .claude/skills/update-quest-system/SKILL.md
  .claude/hooks/quest-system-verify.sh  (if source found)

Update all? (y/n)
```

Stop if n.

## Step 4: Update command files

For each file below, read from `{source}` and write to `.claude/commands/`:

- `new-quest.md`
- `counsel-quest.md`
- `embark.md`
- `make-camp.md`
- `quest-log.md`
- `change-quest.md`
- `complete-quest.md`
- `summon-witch-doctor.md`
- `quest-xp.md`
- `ask-sages.md`
- `init-xp.md`
- `counsel-prompt.md`
- `counsel-plan.md`

Skip any file not found at `{source}` — note it, don't error.

## Step 5: Update tutorial skill

Try these source paths in order:
1. `.claude/skills/quest-system-tutorial/SKILL.md`
2. `skills/quest-system-tutorial/SKILL.md`

If found, write to `.claude/skills/quest-system-tutorial/SKILL.md`.
If not found, skip silently and note it.

## Step 6: Update this skill

Try these source paths in order:
1. `.claude/skills/update-quest-system/SKILL.md`
2. `skills/update-quest-system/SKILL.md`

If found, write to `.claude/skills/update-quest-system/SKILL.md`.
If not found, skip silently.

## Step 7: Update verifier hook

Try source path `hooks/quest-system-verify.sh`.
If found, write to `.claude/hooks/quest-system-verify.sh`.
If not found, skip silently.

## Step 8: Confirm

```
✅ quest-system updated.

Updated {N} command files → .claude/commands/
{if tutorial updated:       "Updated quest-system-tutorial skill"}
{if self updated:           "Updated update-quest-system skill"}
{if hook updated:           "Updated quest-system-verify.sh hook"}
{if any skipped:            "Skipped (not found at source): {list}"}

Note: restart Claude Code if updated commands do not take effect immediately.
```
