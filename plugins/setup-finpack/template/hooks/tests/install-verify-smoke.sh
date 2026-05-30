#!/usr/bin/env bash
# Smoke test: install quest-system into a throwaway project, then run the
# verifier there and assert it passes. Also asserts the verifier FAILS when a
# required command is missing. This catches drift between the install command
# list, the REMOTE_COMMANDS list, and the verifier's required_commands list
# (exactly the bug class where start-quest.md went missing from two of three).
#
# Exit 0 on all pass, 1 on any fail. Invoked by run-all.sh; runnable directly.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INSTALL="$ROOT/scripts/install-quest-system.sh"
VERIFY="$ROOT/hooks/quest-system-verify.sh"

PASS=0
FAIL=0

pass() { printf '  PASS  install-verify :: %s\n' "$1"; PASS=$((PASS+1)); }
fail() { printf '  FAIL  install-verify :: %s\n' "$1"; FAIL=$((FAIL+1)); }

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Install into the temp project. QUEST_SKIP_SERENA keeps the test from touching
# the developer's real MCP config.
if ( cd "$tmp" && QUEST_SKIP_SERENA=1 bash "$INSTALL" ) >/dev/null 2>&1; then
  pass "install script exits 0"
else
  fail "install script exits 0"
fi

# Verifier should pass against a complete install.
if ( cd "$tmp" && bash "$VERIFY" ) >/dev/null 2>&1; then
  pass "verifier passes on complete install"
else
  fail "verifier passes on complete install"
fi

# Verifier should fail when a required command is removed.
rm -f "$tmp/.claude/commands/start-quest.md"
if ( cd "$tmp" && bash "$VERIFY" ) >/dev/null 2>&1; then
  fail "verifier fails when start-quest.md is missing"
else
  pass "verifier fails when start-quest.md is missing"
fi

echo
echo "install-verify smoke: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
