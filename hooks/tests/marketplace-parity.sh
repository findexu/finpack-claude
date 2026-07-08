#!/usr/bin/env bash
# Marketplace delivery parity — guarantees a shipped skill/agent actually reaches
# users. Fails if any source skill/agent is not (a) in .claude-plugin/marketplace.json,
# (b) synced into plugins/, or (c) backed by a plugin.json carrying a `version`
# (without which `claude plugin update` cannot detect changes). Also verifies every
# marketplace entry points at a real, versioned, installable plugin.
# Exit 0 on all pass, 1 on any fail.

set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

python3 - <<'PY'
import json, glob, os, sys
fails = []
mk = {p["name"]: p for p in json.load(open(".claude-plugin/marketplace.json"))["plugins"]}

# 1. every marketplace entry is installable + versioned (update-detectable)
for name, p in mk.items():
    src = p.get("source", "").replace("./", "")
    if not src or not os.path.isdir(src):
        fails.append(f"marketplace '{name}': source dir missing ({src})"); continue
    pj = os.path.join(src, ".claude-plugin", "plugin.json")
    if not os.path.isfile(pj):
        fails.append(f"'{name}': no plugin.json at {pj}"); continue
    d = json.load(open(pj))
    if "version" not in d:
        fails.append(f"'{name}': plugin.json has no `version` (breaks `plugin update`)")
    if d.get("name") != name:
        fails.append(f"'{name}': plugin.json name is '{d.get('name')}'")

# 2. every source skill is wired (marketplace entry + synced copy)
for f in glob.glob("skills/*/SKILL.md"):
    n = os.path.basename(os.path.dirname(f))
    if n not in mk:
        fails.append(f"skill '{n}': no marketplace entry (new users won't get it)")
    if not os.path.isfile(f"plugins/{n}/skills/{n}/SKILL.md"):
        fails.append(f"skill '{n}': not synced to plugins/ (run sync-plugins.sh)")

# 3. every source agent is wired (README is docs, not an agent)
for f in glob.glob("agents/*.md"):
    n = os.path.basename(f)[:-3]
    if n == "README":
        continue
    if n not in mk:
        fails.append(f"agent '{n}': no marketplace entry")
    if not os.path.isfile(f"plugins/{n}/agents/{n}.md"):
        fails.append(f"agent '{n}': not synced to plugins/ (run sync-plugins.sh)")

if fails:
    print("  FAIL  marketplace-parity")
    for x in fails:
        print("       ", x)
    sys.exit(1)
print(f"  PASS  marketplace-parity: {len(mk)} plugins installable + versioned; every skill/agent wired")
PY
