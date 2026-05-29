---
quest: vs-code-QS-plugin
realm: app
scroll: ADVENTURERS_HANDBOOK
last-updated: 2026-05-29
---
# Adventurer's Handbook — How to Use the Scrolls

Read this scroll if you are unsure what belongs where.
These scrolls are the party's shared memory.
Never rely on conversation history — always inscribe to the scrolls.

## WORLD_MAP.md
The map of the realm — how the codebase is structured.
Inscribe: module map, navigation flow, data flow, key files, retired files.
Do NOT inscribe: decisions, constraints, expedition history.
Update when: any structural or navigational change is made.

## STRATEGY_SCROLL.md
The agreed battle plan — what we are building and why.
Inscribe: battle status, implementation sequence, oaths, fallen strategies,
scouting findings, open riddles.
Do NOT inscribe: realm structure, dangers, expedition history.
Update when: step conquered, oath sworn, strategy falls, riddle resolved.

## ADVENTURE_JOURNAL.md
Append-only chronicle. Format every entry as:
## Expedition [DATE]
### Conquered
### Oaths Sworn
### Cursed / Uncertain
### The Road Ahead
Update when: end of every expedition, no exceptions.

## TOME_OF_DANGERS.md
Every confirmed danger, curse, and trap encountered.
Inscribe: safe paths, known dangers, remedies, fallen strategies,
unsolved riddles, safe limits.
Update when: new danger found, remedy validated, assumption confirmed.
STOP mid-expedition and inscribe immediately when a new danger is found.

## Sacred Laws
- Not in the scrolls = does not exist as shared knowledge
- TOME_OF_DANGERS.md prevents fighting the same monster twice — keep it current
- ADVENTURE_JOURNAL.md is append-only — history is sacred
