---
name: install-quest-system
description: >
  Bootstrap quest-system in the current project. Copies all ten command files
  to .claude/commands/ so /new-quest, /embark, /make-camp, /quest-log,
  /change-quest, /complete-quest, /summon-witch-doctor, /quest-xp,
  /ask-sages, and /init-xp become available. Run once per project. Safe to
  re-run — confirms before overwriting.
---

# Install Quest System

Copy the quest-system command files into this project's `.claude/commands/`
so all ten slash commands become available.

## Step 1: Check for existing installation

Look for `.claude/commands/new-quest.md`.

If it exists:
```
quest-system is already installed.
  Installed commands: {list .claude/commands/ files matching quest-system commands}
  Reinstall and overwrite? (y/n)
```
Stop if n.

## Step 2: Locate source command files

Try these locations in order — use the first one that contains `new-quest.md`:

1. `.claude/skills/quest-system/commands/` — present if you ran `/setup-finpack`
   or copied the finpack-claude repo manually into `.claude/`
2. `skills/quest-system/commands/` — present if you are running this inside
   the finpack-claude repo itself

Record which location was found as `{source}`.

If neither location contains `new-quest.md`, skip to Step 5.

## Step 3: Create .claude/commands/ if needed

Check if `.claude/commands/` exists. Create it if not.

## Step 4: Copy all command files

Read each of the following files from `{source}` and write to `.claude/commands/`:

- `new-quest.md`
- `embark.md`
- `make-camp.md`
- `quest-log.md`
- `change-quest.md`
- `complete-quest.md`
- `summon-witch-doctor.md`
- `quest-xp.md`
- `ask-sages.md`
- `init-xp.md`

For each file: read content from source path, write to `.claude/commands/{filename}`.
Report each file as it is written.

Skip any file not found at `{source}` — do not error, just skip and note it.

## Step 5: Source not found

If no source location was found in Step 2:

```
Command source files not found automatically.

Manual install:
  Find your finpack-claude installation and run:

  cp /path/to/finpack-claude/skills/quest-system/commands/*.md .claude/commands/

  Common locations:
    ~/dotfiles/finpack-claude/skills/quest-system/commands/
    /tmp/finpack-claude/skills/quest-system/commands/

Then run /install-quest-system again to verify.
```
Stop.

## Step 6: Verify

After writing, confirm each file exists at `.claude/commands/`:

```
✅ quest-system installed

Commands now available:
  /new-quest           — create a feature quest (run this first)
  /embark              — start of every work session
  /make-camp           — end of every work session — DO NOT SKIP
  /quest-log           — quick status check, no session needed
  /change-quest        — switch quest or realm
  /complete-quest      — distill + archive when feature ships
  /summon-witch-doctor — health check for scroll files
  /quest-xp            — view XP, level, and badge progress
  /ask-sages           — summon three specialist sages for a second opinion
  /init-xp             — bootstrap XP profile on migrated/existing projects

Next steps:
  /quest-system-tutorial   — see a dry-run of the full workflow
  /new-quest {name} {realm} — start your first quest
```

Note: restart Claude Code if the new commands do not appear immediately.
