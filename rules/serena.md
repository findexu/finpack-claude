# Serena (semantic code tools)

Applies only when the Serena MCP server is connected (tools named `mcp__serena__*` are present). If they are absent, ignore this rule and use the built-in tools.

- Prefer Serena for code navigation and structure over Read + scroll: `get_symbols_overview` (map a file's symbols), `find_symbol` (locate a definition), `find_referencing_symbols` (find callers and usages). They return exact symbol locations without loading whole files.
- Use `search_for_pattern` for code-aware search across the project.
- Keep Grep/Glob for plain-text matches — config keys, log strings, comments, non-code files — where there is no symbol to resolve.
- If Serena reports the project inactive, run `activate_project` once for the session.
- Editing stays with native Edit/Write. Do not use `replace_symbol_body` / `insert_after_symbol` / `insert_before_symbol` unless explicitly asked — keeps diffs reviewable.
