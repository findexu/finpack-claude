---
description: Opt in to viewing your .ai-context/ scrolls as an Obsidian vault. Writes a committed .obsidian/ config plus starter Bases/Dataview dashboards (dangers, decisions, quest status) over your EXISTING frontmatter — zero retrofit. Gated by an explicit opt-in marker; running any other quest command without it changes nothing.
argument-hint: "[--force]"
---

# Setup Obsidian

Turn `.ai-context/` into an Obsidian vault so the scrolls become filterable
dashboards AND a connected graph. This is PURELY OPT-IN: it does something only when
you run it, it writes a consent marker, and no other quest-system command reads that
marker or changes behavior because of it. Two views come out of it:
- **Dashboards** — Obsidian **Bases** (core since v1.9, no plugin) renders the
  existing frontmatter as filterable tables. The primary view for machine data.
- **Graph** — edges come from a QUOTED frontmatter wikilink property
  (`related: ["[[X]]"]`), which creates native graph edges + backlinks since
  Obsidian **1.4** and, living in the YAML block, does NOT put `[[brackets]]` in
  GitHub-rendered prose. So we get a real graph without a prose-wikilink retrofit.

This command resolves NO active quest — it is vault-wide (see SKILL.md; it is the
Obsidian-setup utility, not a quest lifecycle command).

## Step 1: Locate the vault root

The vault is `.ai-context/` in the project. If it does not exist:
"No `.ai-context/` found — run a quest first (/new-quest), then re-run." Stop.

If `.ai-context/.obsidian-enabled` already exists and `--force` was NOT passed,
report "Obsidian already set up. Re-run with --force to regenerate config/dashboards."
and skip to Step 5 (report only). With `--force`, regenerate everything below.

## Step 2: Write the consent marker

Write `.ai-context/.obsidian-enabled`:
```
mode: dashboard
enabled: 2026-07-03
```
`mode: dashboard` is the default. (A future `mode: links` would let make-camp /
complete-quest emit quoted `related:` frontmatter for native-graph edges — NOT
implemented here; documentation only. Do not edit make-camp/complete-quest.)

## Step 3: Write the `.obsidian/` config

Create `.ai-context/.obsidian/` with these files.

`.obsidian/core-plugins.json` (enable Bases + the reading essentials):
```json
{
  "file-explorer": true,
  "global-search": true,
  "graph": true,
  "backlink": true,
  "outgoing-link": true,
  "tag-pane": true,
  "properties": true,
  "page-preview": true,
  "search": true,
  "bases": true
}
```

`.obsidian/app.json`:
```json
{
  "showInlineTitle": true,
  "showFrontmatter": true,
  "propertiesInDocument": "visible"
}
```

`.obsidian/graph.json`: `{}` (defaults; the graph is not the point here).

`.obsidian/.gitignore` (the churny, machine-local files — keep the stable config
committable so teammates get the dashboards):
```
workspace.json
workspace-mobile.json
cache
```

## Step 4: Write the starter dashboards

Our scroll frontmatter keys (confirm by reading one scroll —
e.g. any `.ai-context/quests/*/TOME_OF_DANGERS.md`): `quest`, `realm`, `scroll`,
`last-updated`. Do NOT hardcode a month/date filter — keep views date-agnostic so
scrolls created in any month stay visible.

Write three **Bases** files at the vault root. Bases (`.base`, YAML) render
frontmatter as tables with zero retrofit. Use these, adapting the property names
to what the scrolls actually carry:

`.ai-context/Quest Status.base`:
```yaml
filters:
  and:
    - 'scroll == "STRATEGY_SCROLL"'
views:
  - type: table
    name: Quests
    order:
      - quest
      - realm
      - last-updated
```

`.ai-context/Dangers by Quest.base`:
```yaml
filters:
  and:
    - 'scroll == "TOME_OF_DANGERS"'
views:
  - type: table
    name: Danger scrolls
    order:
      - quest
      - realm
      - last-updated
```

`.ai-context/Decisions.base`:
```yaml
filters:
  and:
    - 'file.name == "DECISIONS_LOG"'
views:
  - type: table
    name: Decision logs
    order:
      - last-updated
```

Also write a Dataview fallback note for users who prefer Dataview over Bases,
`.ai-context/Dashboards.md` (Dataview is a community plugin; the note degrades to
plain text if it is not installed):
```
# Quest Dashboards

> Requires the Dataview plugin. The `.base` files render natively without it.

## Quests
```dataview
TABLE realm, last-updated FROM "quests" WHERE scroll = "STRATEGY_SCROLL"
```

## Dangers
```dataview
TABLE quest, realm, last-updated WHERE scroll = "TOME_OF_DANGERS"
```
```

## Step 4.5: Emit graph links (connect the vault)

Inject a `related:` property into each scroll so the graph has edges (idempotent):

- For each `.md` under `.ai-context/quests/<quest>/`, set `related:` to the OTHER
  scrolls in the same quest folder as vault-root-relative quoted wikilinks
  (e.g. `"[[quests/<quest>/TOME_OF_DANGERS]]"` — the full path disambiguates
  same-named scrolls across quests) PLUS `"[[DECISIONS_LOG]]"` and
  `"[[DANGER_REGISTRY]]"`.
- Link `DECISIONS_LOG.md` and `DANGER_REGISTRY.md` to each other.
- SKIP any scroll that already has a `related:` key (do not duplicate).

This turns the graph from disconnected dots into per-quest clusters around the two
shared registry hubs. It edits scroll frontmatter, but ONLY under the opt-in flag —
a user who never runs `/setup-obsidian` keeps byte-for-byte identical scrolls. The
quoted-wikilink form is required: unquoted `[[X]]` is invalid YAML.

## Step 4.6: Check for the MCP integration (guide toward live connectivity)

The `related:` links written above are a ONE-TIME snapshot. To keep the graph connected
as the quest grows — and to let Claude read/search/update scrolls directly — pair the
vault with the Obsidian MCP (the "Local REST API with MCP" plugin's built-in server).
Detect its state and guide accordingly (do NOT auto-install the plugin — installing a
plugin + opening a localhost API to the vault is the commander's security decision):

```bash
PLUG=.ai-context/.obsidian/plugins/obsidian-local-rest-api
KEY=$(python3 -c "import json;print(json.load(open('$PLUG/data.json')).get('apiKey',''))" 2>/dev/null)
PLUGGED=$([ -f "$PLUG/main.js" ] && echo yes || echo no)
UP=$(curl -s --max-time 2 -o /dev/null -w '%{http_code}' http://127.0.0.1:27123/ -H "Authorization: Bearer $KEY" 2>/dev/null)
REG=$(claude mcp get obsidian >/dev/null 2>&1 && echo yes || echo no)
```

- If `PLUGGED=yes`, `UP=200`, and `REG=yes`:
  "✓ Obsidian MCP connected — Claude can maintain notes connectivity (`related:` links) and
  read/search/patch scrolls live via `mcp__obsidian__*`."
- Otherwise, print the guided setup and its payoff:
  ```
  Enable live connectivity via MCP (optional but recommended):
    1. Obsidian → Community plugins → install "Local REST API with MCP" → Enable.
    2. Settings → Local REST API → turn ON the non-encrypted (HTTP) server — it is
       loopback-only and key-protected, and avoids the self-signed-TLS handshake that
       blocks the MCP client on the HTTPS port. Copy the API key.
    3. Register, then reload Claude Code (restart / VS Code "Developer: Reload Window"):
         claude mcp add --transport http --scope user obsidian \
           http://127.0.0.1:27123/mcp/ --header "Authorization: Bearer <key>"
  Why: with MCP, Claude keeps the `related:` graph current as scrolls change and can
  read/search/patch the vault directly. Without it, the links above are a one-time
  snapshot you (or a future /setup-obsidian --force) must refresh manually.
  ```

The insecure port note is deliberate: the MCP http client verifies TLS, so the plugin's
self-signed cert on 27124 fails to connect; the loopback HTTP port (27123) is the
supported path for a local agent.

## Step 5: Report

```
Obsidian vault ready at .ai-context/
  Consent marker: .obsidian-enabled (mode: dashboard)
  Config: .obsidian/ (Bases enabled; workspace/cache gitignored)
  Dashboards: Quest Status.base, Dangers by Quest.base, Decisions.base (+ Dashboards.md)
  Graph: related: links emitted into scroll frontmatter (open the Graph view)
  MCP: {✓ connected — Claude maintains connectivity live | not set up — see the steps above to enable}

Next: run /open-obsidian (or Open folder as vault -> .ai-context/) and confirm the
dashboards populate + the graph shows clusters. Decline anytime by deleting
.obsidian-enabled — no other command depends on it.
```
