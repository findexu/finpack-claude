import type { AgentActivity } from "../types";

// agents.log is an append-only sibling of lifecycle.log, written by the
// PostToolUse(Agent|Task) hook on every sub-agent completion:
//   {YYYY-MM-DD}|agent|{quest-or--}|type={subagent_type};desc={description}
// The hook sanitizes newlines and `|` out of the type/desc fields, so a line
// splits cleanly on `|` into exactly [date, "agent", quest, fields]. `desc`
// may itself contain `;`/`=`, so it is read as the rest of the line after
// `desc=` rather than split on `;`. Malformed lines are skipped (fail soft).
//
// Returns entries in file order (oldest first); the caller reverses/caps for
// "most recent" display.
export function parseAgentsLog(text: string | null): AgentActivity[] {
  if (text === null) {
    return [];
  }
  const out: AgentActivity[] = [];
  for (const line of text.split("\n")) {
    const parts = line.split("|");
    if (parts.length < 4 || parts[1].trim() !== "agent") {
      continue;
    }
    // Rejoin any stray `|` in the field section (defensive; the hook strips them).
    const fields = parts.slice(3).join("|");
    const match = /^type=(.*?);desc=(.*)$/.exec(fields);
    if (match === null) {
      continue;
    }
    const type = match[1].trim();
    if (type === "") {
      continue;
    }
    out.push({
      date: parts[0].trim(),
      quest: parts[2].trim(),
      type,
      desc: match[2],
    });
  }
  return out;
}
