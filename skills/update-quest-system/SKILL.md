---
name: update-quest-system
description: >
  Update quest-system to the latest version by running the install script
  (install is idempotent — same script installs and updates). Prefers a local
  finpack-claude clone, otherwise runs the allow-listed curl one-liner. The
  script self-cleans renamed/removed commands and agents via its manifest. Run
  after pulling finpack-claude updates. Requires quest-system to already be
  installed (/install-quest-system).
---

# Update Quest System

The install script is idempotent — it installs AND updates, prunes orphaned
command/agent files (manifest-diff), refreshes permissions, and retries on
transient network errors. Updating just means re-running it. This skill picks
the right invocation and runs it; it does NOT copy files itself.

## Step 1: Check installation

Look for `.claude/commands/new-quest.md`.

If not found:
```
quest-system is not installed in this project.
Run /install-quest-system first.
```
Stop.

## Step 2: Record installed version (for the after-report)

Read `.claude/commands/.quest-system-version`.
- If found: record as `{installed-version}`.
- If not found: `{installed-version}` = "unknown (pre-versioning install)".

## Step 3: Pick the install-script invocation

Use the FIRST that exists:

1. `scripts/install-quest-system.sh` — running inside the finpack-claude repo.
   Command: `bash scripts/install-quest-system.sh`
2. `.claude/skills/quest-system/scripts/install-quest-system.sh` — a clone
   vendored under the project (rare).
   Command: `bash .claude/skills/quest-system/scripts/install-quest-system.sh`
3. No local script — use the curl one-liner (registered as an exact allow-rule
   by the installer, so it runs without a permission prompt). Run it VERBATIM:
   ```bash
   curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash
   ```

Record the chosen command as `{install-cmd}`.

## Step 4: Run it

Run `{install-cmd}` once. The script prints each file it writes, every orphan it
prunes, and a final `quest-system <version>: <N> files installed` line.

Do NOT loop, re-run, or copy files individually. One invocation is the whole
update. If it exits non-zero or prints `FAIL:` lines, report them verbatim — a
transient network error already got 3 retries, so a failure here is real.

## Step 4.5: Offer XP-remnant cleanup (v2.0.0 migration, opt-in)

quest-system 2.0.0 removed the XP/gamification system but KEEPS the lifecycle
phase record. `.claude/quest-xp/` is NOT inert — `quest-lifecycle-bump.sh`
writes `.claude/quest-xp/lifecycle.log`, so never touch the directory itself or
`lifecycle.log`. Check for these dead remnants and, if any exist, OFFER (never
auto-delete; skip this step silently when none are found):

1. Dead XP data files — `.claude/quest-xp/events.log`, `.claude/quest-xp/profile.md`,
   `.claude/quest-xp/agents.log`, `.claude/quest-xp/quest-history.md`. Offer to
   delete exactly these files, nothing else.
2. The retired sub-agent trace hook — `.claude/hooks/quest-agent-trace.sh` is the
   live writer that recreates `agents.log` on the next agent call. Offer to delete
   the file AND strip its PostToolUse (`Agent|Task` matcher) registration from
   `.claude/settings.json` and `.claude/settings.local.json` (remove only the hook
   entry whose command ends in `quest-agent-trace.sh`; if its matcher group is
   left empty, remove the group).

List what was found, ask once ("Remove these retired XP remnants? (y/n)"), and
act only on an explicit yes. Report what was deleted or that everything was kept.

## Step 5: Report

Read `.claude/commands/.quest-system-version` again for `{new-version}`, then:
```
quest-system updated: {installed-version} -> {new-version}

{paste the script's summary line and any "pruned orphan" / "FAIL:" lines}

Restart Claude Code if updated commands do not take effect immediately.
```

If `{installed-version}` equals `{new-version}`, say so plainly — the re-run
still refreshed files, permissions, and pruned orphans, which is harmless.
