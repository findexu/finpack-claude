---
description: Switch to a different quest or change the active realm. Saves expedition state before switching (optional mini make-camp), then activates the target quest and guides to next step.
argument-hint: "[quest-folder-path] [realm]"
---

# Change Quest

Switch the active quest or realm. Optionally save current state before switching.

## Step 1: Show current quest and offer state-save

Read `.claude/active-quest.txt` if it exists.

If an active quest is found:
Show: "Current quest: {quest-name} | Realm: {realm}"

Ask: "Save expedition state before switching? (y/n)"

If **y** — run mini make-camp:
1. Ask: "Anything conquered this expedition before we switch?"
2. Ask: "Any new dangers discovered?"
3. Ask: "Road ahead when this quest resumes?"
4. Write abbreviated journal entry to `{quest-folder}/ADVENTURE_JOURNAL.md`
   (or `journal/{YYYY-MM}.md` if split):
   ```
   ## Expedition {YYYY-MM-DD} (interrupted — quest switch)
   ### Conquered
   {conquered items, or "none"}
   ### New Dangers
   {new dangers, or "none"}
   ### The Road Ahead
   {road ahead}
   ```
5. If any conquered items: update battle status table in STRATEGY_SCROLL.md
6. If any new dangers: add to TOME_OF_DANGERS.md Known Dangers table
7. Update `last-updated` frontmatter in any modified scrolls
8. Refresh `.ai-context/` if it exists (same format as /make-camp Step 8)

If **n**: skip to Step 2 immediately.

If no active quest found: show "No active quest set." and proceed to Step 2.

## Step 2: Find available quests

Scan `.ai-context/quests/` for subdirectories that contain a `STRATEGY_SCROLL.md` file.
List them as numbered options with their realm (read from YAML frontmatter).

Example:
```
Available quests:
  1. scan-alignment-floor-annotation  (realm: WeScanX)
  2. onboarding-redesign               (realm: WeScanX)
  3. backend-auth-refactor             (realm: CoreAPI)
```

If `.ai-context/quests/` does not exist or is empty, report: "No quests found. Run /new-quest to create one."

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

## Step 6: Brief and guide

Read the new quest's scroll state:
- `STRATEGY_SCROLL.md` — battle status, open riddles, whether The Battle Plan is populated
- `ADVENTURE_JOURNAL.md` — count `## Expedition` entries

Output:
```
✅ Active quest: {quest-name}  |  Realm: {realm}

Battle Status:
{battle status table from STRATEGY_SCROLL}
```

Then guide to next step (same logic as /start-quest Step 6):

- No battle plan → "Run /counsel-quest to plan before embarking."
- Plan exists, no expeditions → "Run /embark or /counsel-quest to refine."
- Open riddles → "Run /counsel-quest to resolve {N} open riddle(s), or /embark to continue."
- No open riddles → "Run /embark to continue, or /quest-log for full status."
```
