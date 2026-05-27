---
description: Switch to a different quest or change the active realm.
argument-hint: "[quest-folder-path] [realm]"
---

# Change Quest

Switch the active quest or realm.

## Step 1: Show current quest

Read `.claude/active-quest.txt` if it exists.
Show: "Current quest: {quest-name} | Realm: {realm}"
If not found, show: "No active quest set."

## Step 2: Find available quests

Scan `docs/dev/` for subdirectories that contain a `STRATEGY_SCROLL.md` file.
List them as numbered options with their realm (read from YAML frontmatter).

Example:
```
Available quests:
  1. scan-alignment-floor-annotation  (realm: WeScanX)
  2. onboarding-redesign               (realm: WeScanX)
  3. backend-auth-refactor             (realm: CoreAPI)
```

If `docs/dev/` does not exist or is empty, report: "No quests found in docs/dev/."

## Step 3: Get selection

If $ARGUMENTS provided: parse first token as quest folder path, optional second token as realm.
Otherwise: ask the commander to pick a number from the list, enter a path manually,
or type "realm only" to change just the realm without switching quest.

**Realm-only switch:** ask for the new realm name, skip folder validation.

## Step 4: Validate (quest switch only)

Check that the selected quest folder exists on disk.
Check that it contains `STRATEGY_SCROLL.md`.

If not found: "Quest not found at {path}. Run /new-quest to create it." Stop.

## Step 5: Update active quest

Rewrite `.claude/active-quest.txt`:
```
{quest-folder-path}
{realm}
```

## Step 6: Confirm

```
✅ Active quest: {quest-name}  |  Realm: {realm}
Run /embark to start an expedition.
```
