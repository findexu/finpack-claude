---
description: Diagnose the health of the active quest's scrolls. Checks for missing files, missing sections, invalid frontmatter, template drift, and split state. Offers repair if issues are found.
---

# Summon Witch Doctor

Inspect every scroll in the active quest and report their health.
No files are modified unless you confirm repair.

## Step 1: Read active quest

Read `.claude/active-quest.txt`.
Line 1 = quest folder path. Line 2 = realm.

If not found: "No active quest. Run /new-quest first." Stop.

## Step 2: Check active-quest.txt validity

Verify:
- File has exactly 2 non-empty lines
- Quest folder path on line 1 exists on disk

If either check fails, report as CORRUPT and stop — cannot proceed without valid active quest.

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
Read the required headings for this scroll type from
`.claude/skills/quest-system/SKILL.md` — section `## Scroll templates`.
Flag each missing heading as WARN.

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

## Step 4: Output report

```
Quest: {quest-name}  |  Realm: {realm}

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
- `WARN` — exists but has issues (missing headings, missing frontmatter keys)
- `MISSING` — file does not exist
- `EMPTY` — file exists with no content
- `SPLIT` — correctly split into subfiles
- `SPLIT_NEEDED` — over 500 lines, not yet split

If all scrolls are OK or SPLIT: "All scrolls healthy. No repair needed." Stop.

## Step 5: Offer repair

If any scroll has status WARN or MISSING:

Ask: "Repair affected scrolls? (y/n)"

If n: stop.

If y, for each affected scroll:
- **MISSING**: recreate from the template in `.claude/skills/quest-system/SKILL.md`.
  Fill in quest name, realm, scroll type, and today's date.
- **WARN — missing frontmatter keys**: add the missing keys with placeholder values
  and append `<!-- repaired by /summon-witch-doctor -->`.
- **WARN — missing headings**: append the missing headings at the end of the file
  with their empty template content and append `<!-- repaired by /summon-witch-doctor -->`.

Never rewrite existing content. Never touch OK or SPLIT scrolls.
Never merge or reorganize split subfiles.

Confirm each repaired file.
