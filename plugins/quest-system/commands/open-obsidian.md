---
description: Open this project's .ai-context/ vault in Obsidian from the CLI. Registers the folder as a vault the first time (headless), then opens it via the obsidian:// URI or the official Obsidian CLI. Pairs with /setup-obsidian.
argument-hint: "[--graph]"
---

# Open Obsidian

Open the project's `.ai-context/` scrolls as an Obsidian vault without leaving the
terminal. Resolves no active quest — it is a vault utility (like /setup-obsidian).

## Step 1: Preconditions

The vault is `.ai-context/` in the project. If it does not exist:
"No `.ai-context/` — run a quest first, then /setup-obsidian." Stop.

Recommend (do not require) that `/setup-obsidian` has been run so the `.obsidian/`
config + dashboards exist. If `.ai-context/.obsidian-enabled` is absent, note:
"Tip: run /setup-obsidian first for the dashboards; opening anyway."

Let `VAULT` = the absolute path to `.ai-context/`.

## Step 2: Open (prefer the official CLI, else the URI)

**A. Official Obsidian CLI (Obsidian 1.12+, CLI enabled in Settings -> General).**
If an `obsidian` binary is on PATH AND `~/Library/Application Support/obsidian/obsidian.json`
has `"cli": true`, this is the supported path — it registers-and-opens by path:
```bash
obsidian open --vault "$VAULT" 2>/dev/null || (cd "$VAULT" && obsidian open .)
```
If that succeeds, go to Step 3.

**B. `obsidian://` URI.** The URI opens a vault by REGISTERED name/id; `?path=` only
resolves inside an already-registered vault. So register first if needed, then open:
```bash
CFG="$HOME/Library/Application Support/obsidian/obsidian.json"
# already registered?
if ! python3 -c "import json,sys;d=json.load(open(sys.argv[1]));import os;\
p=os.path.abspath(sys.argv[2]);\
sys.exit(0 if any(os.path.abspath(v.get('path',''))==p for v in d.get('vaults',{}).values()) else 1)" "$CFG" "$VAULT" 2>/dev/null; then
  # Not registered: Obsidian rewrites obsidian.json on exit, so it MUST be quit
  # before editing or the edit is clobbered. Back up, register, relaunch.
  cp "$CFG" "$CFG.bak" 2>/dev/null
  osascript -e 'tell application "Obsidian" to quit' 2>/dev/null
  for i in $(seq 1 20); do pgrep -x Obsidian >/dev/null || break; done
  python3 - "$CFG" "$VAULT" <<'PY'
import json,sys,time,secrets,os,pathlib
cfg,target=pathlib.Path(sys.argv[1]),os.path.abspath(sys.argv[2])
d=json.loads(cfg.read_text()) if cfg.exists() else {}
vaults=d.setdefault("vaults",{})
for v in vaults.values(): v["open"]=False
vid=next((k for k,v in vaults.items() if os.path.abspath(v.get("path",""))==target), secrets.token_hex(8))
vaults[vid]={"path":target,"ts":int(time.time()*1000),"open":True}
cfg.write_text(json.dumps(d,indent=2)); print("registered",vid)
PY
  open -a Obsidian
else
  # Registered: open by URL-encoded path (resolves to its vault).
  open "obsidian://open?path=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "$VAULT")"
fi
```

## Step 3: --graph (optional)

If `--graph` was passed, after opening, trigger the graph view via URI so the user
lands on the relationship view:
```bash
open "obsidian://open?path=$(python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "$VAULT")" && \
  echo "Opened. Use the Graph View ribbon (left) — related: frontmatter links draw the edges."
```
(There is no stable URI to focus the graph pane directly; the ribbon is one click.)

## Step 4: Report

```
Opened .ai-context/ in Obsidian.
  Dashboards: open any .base file (Bases, core plugin).
  Graph: left ribbon -> Graph view. Edges come from `related:` frontmatter
         (run /setup-obsidian to (re)emit them if the graph looks sparse).
```

Note: for programmatic READ/WRITE of the vault from Claude Code (not just opening),
the supported route is the Obsidian Local REST API plugin's built-in MCP server —
`claude mcp add --transport http obsidian https://127.0.0.1:27124/mcp/ --header "Authorization: Bearer <key>"`.
That is out of scope for this command, which only opens the vault.
