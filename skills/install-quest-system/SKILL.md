---
name: install-quest-system
version: 0.2.0
description: >
  Bootstrap quest-system in the current project. Copies all command files to
  .claude/commands/ so /new-quest, /counsel-quest, /embark, /make-camp,
  /quest-log, /change-quest, /complete-quest, /summon-witch-doctor,
  /ask-sages, /counsel-prompt, and /counsel-plan become available.
  It also installs a stable verifier hook and a project-local permission
  override so the verification step does not keep triggering ad hoc approval
  prompts. Run once per project. Safe to re-run — confirms before overwriting.
---

# Install Quest System

Copy the quest-system command files into this project's `.claude/commands/`
so all quest-system slash commands become available. A one-page overview
lives at https://findexu.github.io/finpack-claude/ — no install needed.
The install also writes a stable verifier hook at
`.claude/hooks/quest-system-verify.sh` and adds a local permissions override
for that one helper when needed.

## Step 1: Check for existing installation

Look for `.claude/commands/new-quest.md`.

If it exists:
```
quest-system is already installed.
  Installed commands: {list .claude/commands/ files matching quest-system commands}
  Reinstall and overwrite? (y/n)
```
Stop if n.

## Step 2: Locate source files

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

Copy EVERY `*.md` file from `{source}/commands/` to `.claude/commands/` — enumerate the
source directory, do not work from a memorized list (a hand-maintained list drifts and is
exactly how commands like `/start-quest` went missing for new installs). If you cannot
list the directory (remote install), fall back to the canonical set below.

Canonical command set (also the fallback list — keep in sync with
`skills/quest-system/commands/`; `hooks/tests/quest-system-smoke.sh` enforces parity):

- `set-bounty.md`
- `new-quest.md`
- `start-quest.md`
- `counsel-quest.md`
- `embark.md`
- `make-camp.md`
- `quest-log.md`
- `change-quest.md`
- `complete-quest.md`
- `summon-witch-doctor.md`
- `quest-help.md`
- `ask-sages.md`
- `counsel-prompt.md`
- `counsel-plan.md`
- `hunt-bugs.md`
- `setup-obsidian.md`
- `open-obsidian.md`

For each file: read content from source path, write to `.claude/commands/{filename}`.
Report each file as it is written.

Skip any file not found at `{source}` — do not error, just skip and note it.

## Step 4.5: Install update skill

Try these source paths in order:

1. `.claude/skills/update-quest-system/SKILL.md`
2. `skills/update-quest-system/SKILL.md`

If found, write to `.claude/skills/update-quest-system/SKILL.md`.
Create parent directories if needed.
If not found, skip silently.

## Step 4.6: Install stable verifier hook and local permission override

Copy `hooks/quest-system-verify.sh` to `.claude/hooks/quest-system-verify.sh`
when present. If `.claude/settings.local.json` does not already exist, copy
`settings.local.json.example` to `.claude/settings.local.json`, then add the
allow rule for `.claude/hooks/quest-system-verify.sh` so the verifier can run
without repeated approval prompts.

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
  /counsel-quest       — lock implementation decisions before execution
  /embark              — start of every work session
  /make-camp           — end of every work session — DO NOT SKIP
  /quest-log           — quick status check, no session needed
  /change-quest        — switch quest or realm
  /complete-quest      — distill + archive when feature ships
  /summon-witch-doctor — health check for scroll files
  /ask-sages           — summon three specialist sages for a second opinion
  /counsel-prompt      — rewrite a rough prompt into a sharp copyable Claude prompt
  /counsel-plan        — review a plan.md and produce copyable structured feedback

Installed skills:
  /update-quest-system   — update to the latest version after pulling finpack-claude

Docs (one-page overview, no install needed):
  https://findexu.github.io/finpack-claude/

Next steps:
  /new-quest {name} {realm} — start your first quest
```

Note: restart Claude Code if the new commands do not appear immediately.
