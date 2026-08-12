---
description: Diagnose the health of the active quest's scrolls. Checks for missing files, missing sections, invalid frontmatter, split state, legacy pre-expedition terminology, and legacy storage layout (pre-v1.6.0). Offers repair if issues are found.
argument-hint: "[--quest <name>] [--realm <realm>]"
---

# Summon Witch Doctor

Inspect every scroll in the active quest and report their health.
No files are modified unless you confirm repair.

## Step 0: Global multi-tasking checks (run even with NO active quest)

These are project-scoped, not tied to any one quest. Run them first so they work
on a quest-less project too, then continue to Step 1 (skip the rest only if Step 1
reports no active quest).

- **Stale locks:** if `.claude/locks/*.lock` exists, flag `STALE_LOCK` (repair:
  offer manual `rmdir` — never auto-break; another chat may hold it legitimately).

## Step 1: Resolve the active quest

Resolve the quest for THIS chat (SKILL.md -> "Active-quest selection"): a `--quest
<name-or-path>` argument wins — diagnose THAT quest (realm from its `STRATEGY_SCROLL.md`
frontmatter unless `--realm <realm>` was also passed); otherwise read
`.claude/active-quest.txt` (line 1 = quest folder path, line 2 = realm).

All checks below apply to the RESOLVED quest folder (not necessarily the pointer).
`{quest-name}` is the basename of the resolved folder path.

If not found: "No active quest. Run /new-quest first." Stop.

## Step 2: Check active-quest.txt validity

Verify:
- File has exactly 2 non-empty lines
- Quest folder path on line 1 exists on disk

If either check fails, report as CORRUPT and stop — cannot proceed without valid active quest.

## Step 2b: Check storage layout (legacy migration)

Before inspecting scrolls, check for legacy storage layout from pre-v1.6.0.
These are project-level checks, not per-scroll checks. Accumulate as LAYOUT issues.

### LEGACY_DIGESTS
Check if any of these files exist at `.ai-context/` root:
- `.ai-context/quest.md`
- `.ai-context/dangers.md`
- `.ai-context/decisions.md`

If found: flag `LAYOUT WARN — LEGACY_DIGESTS: quest.md/dangers.md/decisions.md found at .ai-context/ root (replaced by context.md inside quest folder)`

### LEGACY_QUEST_PATH
Check the quest folder path from `active-quest.txt` line 1.
If it matches `.ai-context/{name}` (i.e. directly under `.ai-context/`, not under `.ai-context/quests/`):
flag `LAYOUT WARN — LEGACY_QUEST_PATH: quest folder should be at .ai-context/quests/{name}`

Also scan `.ai-context/` for any subdirectories that contain a `STRATEGY_SCROLL.md`
but are NOT under `.ai-context/quests/` — flag each one.

### LEGACY_REGISTRIES
Check for project-level registry files under `docs/dev/` or `Docs/dev/`:
- `docs/dev/DANGER_REGISTRY.md` or `Docs/dev/DANGER_REGISTRY.md`
- `docs/dev/DECISIONS_LOG.md` or `Docs/dev/DECISIONS_LOG.md`

If found: flag `LAYOUT WARN — LEGACY_REGISTRIES: DANGER_REGISTRY.md/DECISIONS_LOG.md found under docs/dev/ (should be at .ai-context/)`

Also check for `docs/dev/archived/` or `Docs/dev/archived/` — flag same way.

## Step 3: Inspect each scroll

For each of the five scrolls in the quest folder:
`WORLD_MAP.md`, `STRATEGY_SCROLL.md`, `ADVENTURE_JOURNAL.md`,
`TOME_OF_DANGERS.md`, `ADVENTURERS_HANDBOOK.md`

Run these checks and accumulate issues:

### 3a. Existence and content
- MISSING: file does not exist
- EMPTY: file exists but has no content beyond frontmatter

### 3b. YAML frontmatter
Read the block between the opening and closing `---` markers.
Flag as WARN if any of these keys are absent: `quest`, `realm`, `scroll`, `last-updated`.

### 3c. Required headings
Check for required headings per scroll type (flag each missing one as WARN):

- **WORLD_MAP.md**: `## Realm`, `## Module Map`, `## Navigation Flow`, `## Data Flow`, `## Key Files`, `## Retired Files`
- **STRATEGY_SCROLL.md**: `## Battle Status`, `## Oaths Sworn (Resolved Decisions)`, `## Fallen Strategies (Rejected Approaches)`, `## Scouting Findings (Audit Results)`, `## Open Riddles (Decisions Needed)`, `## The Battle Plan (Implementation Sequence)`
- **ADVENTURE_JOURNAL.md**: no required headings (append-only, content varies)
- **TOME_OF_DANGERS.md**: `## Confirmed Safe Paths`, `## Known Dangers`, `## Fallen Strategies (Tried and Abandoned)`, `## Unsolved Riddles (Open Verification Items)`
- **ADVENTURERS_HANDBOOK.md**: `## WORLD_MAP.md`, `## STRATEGY_SCROLL.md`, `## ADVENTURE_JOURNAL.md`, `## TOME_OF_DANGERS.md`, `## Sacred Laws`

### 3d. Split state
Check whether the scroll's split subfolder exists on disk:
- `TOME_OF_DANGERS.md` → `dangers/`
- `STRATEGY_SCROLL.md` → `strategy/`
- `ADVENTURE_JOURNAL.md` → `journal/`
- `WORLD_MAP.md` → `map/`

If split subfolder exists:
- Report status as SPLIT (informational, not an error)
- Verify: at least one subfile exists, each subfile is non-empty,
  index has a `## Content Index` section
- If any subfile check fails, report as WARN

If no split subfolder but file exceeds 500 lines:
- Report as SPLIT_NEEDED with line count

### 3e. Expedition migration checks (legacy format detection)
Check scroll content for legacy pre-expedition wording that should be migrated:

- **ADVENTURE_JOURNAL.md**: headings that begin with `## Session ` or
  `## Work Session ` (legacy entries should be `## Expedition `)
- **WORLD_MAP.md**: placeholders containing `Phase 1 scouting`
- **STRATEGY_SCROLL.md**: placeholders containing `after Phase 3`

If found, report `WARN` with issue `MIGRATION_NEEDED: legacy phase/session terms detected`.

## Step 4: Output report

```
Quest: {quest-name}  |  Realm: {realm}

Layout
──────────────────────────────────────────────────────────────────────────────
{LAYOUT issues from Step 2b, or "OK — storage layout is current (v1.6.0+)"}

Scrolls
Scroll                   Status        Issues
─────────────────────────────────────────────────────────────────────────────
WORLD_MAP.md             {status}      {issues or blank}
STRATEGY_SCROLL.md       {status}      {issues or blank}
ADVENTURE_JOURNAL.md     {status}      {issues or blank}
TOME_OF_DANGERS.md       {status}      {issues or blank}
ADVENTURERS_HANDBOOK.md  {status}      {issues or blank}

📁 Split scrolls: {list or "None — all scrolls within threshold"}
```

Status values:
- `OK` — all checks passed
- `WARN` — exists but has issues (missing headings, missing frontmatter keys, or migration needed)
- `MISSING` — file does not exist
- `EMPTY` — file exists with no content
- `SPLIT` — correctly split into subfiles
- `SPLIT_NEEDED` — over 500 lines, not yet split

If all scrolls are OK or SPLIT and no layout issues: "All scrolls healthy. No repair needed." Stop.

## Step 5: Offer repair

If any LAYOUT issues or scroll WARN/MISSING were found:

Ask: "Repair issues? (y/n)"

If n: stop.

If y:

### Layout repairs (run first, before scroll repairs)

**LEGACY_QUEST_PATH** — migrate quest folder to new location:
1. Create `.ai-context/quests/` if it does not exist
2. Move `{quest-folder}` → `.ai-context/quests/{quest-name}/`
3. Rewrite `.claude/active-quest.txt` line 1 to `.ai-context/quests/{quest-name}`
4. Update `{quest-folder}` variable for all subsequent scroll repairs
5. Announce: "📦 Quest folder moved: {old-path} → .ai-context/quests/{quest-name}/"

Repeat for any other orphan quest folders found under `.ai-context/` root.

**LEGACY_REGISTRIES** — migrate registry files:
1. Move `docs/dev/DANGER_REGISTRY.md` → `.ai-context/DANGER_REGISTRY.md`
   (skip if `.ai-context/DANGER_REGISTRY.md` already exists — do not overwrite)
2. Move `docs/dev/DECISIONS_LOG.md` → `.ai-context/DECISIONS_LOG.md`
   (skip if already exists)
3. If `docs/dev/archived/` exists: move → `.ai-context/archived/`
   (skip if `.ai-context/archived/` already exists)
4. If `docs/dev/` is now empty: remove it
5. Announce: "📦 Registries migrated: docs/dev/ → .ai-context/"

**LEGACY_DIGESTS** — remove stale digest files:
1. Delete `.ai-context/quest.md` if it exists
2. Delete `.ai-context/dangers.md` if it exists
3. Delete `.ai-context/decisions.md` if it exists
4. Create `{quest-folder}/context.md` placeholder:
   `# Quest Context\n(run /embark to populate)`
5. Announce: "🗑️  Legacy digest files removed. context.md placeholder created — run /embark to populate."

### Scroll repairs

- **MISSING**: recreate the scroll from SKILL.md -> "Scroll templates" (the template
  for that scroll type), filling in quest name, realm, and today's date.
- **WARN — missing frontmatter keys**: add the missing keys with placeholder values
  and append `<!-- repaired by /summon-witch-doctor -->`.
- **WARN — missing headings**: append the missing headings at the end of the file
  with their empty template content and append `<!-- repaired by /summon-witch-doctor -->`.
- **WARN — migration needed**: apply targeted terminology migrations in-place,
  then append `<!-- repaired by /summon-witch-doctor -->`:
  - In `ADVENTURE_JOURNAL.md`: `## Session ` -> `## Expedition `;
    `## Work Session ` -> `## Expedition `
  - In `WORLD_MAP.md`: `Phase 1 scouting` -> `first expedition scouting`
  - In `STRATEGY_SCROLL.md`: `after Phase 3` -> `before the next expedition`

These migrations are intentionally narrow. Do not rewrite unrelated prose.

Never rewrite unrelated content. Never touch OK or SPLIT scrolls.
Never merge or reorganize split subfiles.

Confirm each repaired file.
