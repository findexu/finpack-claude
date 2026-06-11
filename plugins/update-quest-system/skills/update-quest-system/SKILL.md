---
name: update-quest-system
description: >
  Update quest-system to the latest version. Shows installed vs available
  version, then overwrites all command files, skills, the fp- agent suite, and
  the verifier hook from source. Run after pulling finpack-claude updates.
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

## Step 2: Read installed version

Read `.claude/commands/.quest-system-version`.
- If found: record as `{installed-version}`.
- If not found: `{installed-version}` = "unknown (pre-versioning install)".

## Step 3: Find source

Try these locations in order — use the first that contains `new-quest.md`:

1. `.claude/skills/quest-system/commands/` — present if you ran `/setup-finpack`
2. `skills/quest-system/commands/` — present if running inside the finpack-claude repo itself

Record the found path as `{source}`.
Read `{source}/../VERSION` for `{source-version}`. If absent: `{source-version}` = "unknown".

If neither location contains `new-quest.md`, go to Step 4 (no local source).

## Step 4: No local source — check GitHub version first

Run this command silently to fetch the available version from GitHub. The
`Cache-Control`/`Pragma` headers force raw.githubusercontent to revalidate —
without them its CDN serves a stale VERSION for up to ~5 min after a release,
which makes this check wrongly report "already up to date". Run it VERBATIM:
the installer registers this exact command as the permission allow-rule (no
trailing wildcard, so it cannot be abused to chain other commands), so any
deviation will trigger a permission prompt instead of auto-approving.
```bash
curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/skills/quest-system/VERSION -H 'Cache-Control: no-cache' -H 'Pragma: no-cache' 2>/dev/null | tr -d '[:space:]'
```

Record result as `{github-version}`. If curl fails or returns empty: `{github-version}` = "unknown".

If the result still looks stale (matches your installed version right after a
known release), the CDN has not revalidated yet — skip the version gate and run
the install script directly (it reinstalls unconditionally):
`curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash`

Output:
```
Installed: {installed-version}
Available: {github-version}  (GitHub)
```

If `{installed-version}` equals `{github-version}`:
```
Already up to date. Re-run install script anyway? (y/n)
```
If n: stop.

If versions differ (or either is unknown):
```
The marketplace plugin update only refreshes the plugin registry — it does
not copy source files to disk.

Run curl install script to update? (y/n)
```
If n: stop.

If y: run this bash command and then stop (report output to commander):
```bash
curl -fsSL https://raw.githubusercontent.com/findexu/finpack-claude/main/scripts/install-quest-system.sh | bash
```

## Step 5: Show version diff and confirm

Output:
```
Installed: {installed-version}
Available: {source-version}
Source:    {source}

Will update:
  16 command files  → .claude/commands/
  update-quest-system skill
  fp- agent suite  → .claude/agents/  (if source found)
  quest-system-verify.sh hook  (if found)
  .quest-system-version

Update all? (y/n)
```

If `{installed-version}` equals `{source-version}`, add before the prompt:
```
(already up to date — update anyway?)
```

Stop if n.

## Step 6: Update command files

Read from `{source}`, write to `.claude/commands/`:

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
- `start-quest.md`
- `side-quest.md`
- `close-side-quest.md`

Skip any file not found at `{source}` — note it, don't error.

## Step 7: Update VERSION file

Copy `{source}/../VERSION` to `.claude/commands/.quest-system-version`.
If source VERSION absent, skip silently.

## Step 8: Update this skill

Try in order:
1. `.claude/skills/update-quest-system/SKILL.md` (source copy, not destination)
2. `skills/update-quest-system/SKILL.md`

If found, write to `.claude/skills/update-quest-system/SKILL.md`.

## Step 9: Update verifier hook

Try `hooks/quest-system-verify.sh`.
If found, write to `.claude/hooks/quest-system-verify.sh`.

## Step 9.5: Remove retired tutorial skill

The quest-system-tutorial skill is retired — the interactive tutorial lives at
https://findexu.github.io/finpack-claude/ (no install needed).

If `.claude/skills/quest-system-tutorial/` exists, delete the directory and
note it for the confirm output. This step runs AFTER the verifier-hook refresh
(Step 9) on purpose: the old hook still checks for the tutorial, so deleting
first would fail verification if the update aborted between the two steps.

## Step 10: Update agents

Resolve `{agents-source}` — the first directory that exists:
1. `{source}/../../../agents/` — repo layout (commands live in `skills/quest-system/commands/`)
2. `agents/` — present when running inside the finpack-claude repo

If neither exists, skip this step silently — consumers without a local agents
source receive agents via the curl install-script path (Step 4), which ships
the full suite.

If found, copy each of these from `{agents-source}` to `.claude/agents/`
(skip any not found, note it, don't error):

- `fp-code-architect.md`
- `fp-code-explorer.md`
- `fp-code-reviewer.md`
- `fp-plan-reviewer.md`
- `fp-security-reviewer.md`
- `fp-performance-reviewer.md`
- `fp-doc-reviewer.md`
- `fp-frontend-designer.md`
- `fp-swiftui-designer.md`

## Step 11: Confirm

```
✅ quest-system updated: {installed-version} → {source-version}

Updated {N} command files → .claude/commands/
{if self updated:      "  update-quest-system skill"}
{if agents updated:    "  {M} agents → .claude/agents/"}
{if hook updated:      "  quest-system-verify.sh hook"}
{if tutorial removed:  "  retired quest-system-tutorial skill removed — tutorial now at https://findexu.github.io/finpack-claude/"}
{if any skipped:       "Skipped (not found): {list}"}

Note: restart Claude Code if updated commands do not take effect immediately.
```
