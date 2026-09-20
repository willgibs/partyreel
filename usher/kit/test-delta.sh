#!/bin/zsh
# test-delta.sh <base-sha>: which tests exist at HEAD but not at <base-sha>, and the reverse.
# For a gate whose test COUNT moved with no test file in the diff: the count is data-driven somewhere
# (a manifest deleted at a merge takes its two generated tests with it; a board's rows and lives feed
# loops). Lists both trees with `vitest list` (collection only, nothing runs) on a throwaway worktree
# with node_modules linked in, and prints the sorted difference. Read-only for the repo; the worktree
# is removed on exit.
set -u
BASE="$1"; R="/Users/gibby/local/ai/partyreel"; T="${TMPDIR:-/tmp}/test-delta-$$"
[ -n "$BASE" ] || { echo "usage: test-delta.sh <base-sha>"; exit 1; }
cd "$R" || exit 1
source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1; nvm use 22.21.1 >/dev/null 2>&1
cleanup() { rm -f "$T/wt/node_modules" "$T/wt/.env.local"; git worktree remove --force "$T/wt" >/dev/null 2>&1; rm -rf "$T"; }
trap cleanup EXIT
mkdir -p "$T"
npx vitest list 2>/dev/null | sort > "$T/head.txt"
git worktree add -q "$T/wt" "$BASE" || exit 1
ln -s "$R/node_modules" "$T/wt/node_modules"; cp "$R/.env.local" "$T/wt/.env.local" 2>/dev/null
(cd "$T/wt" && npx vitest list 2>/dev/null | sort > "$T/base.txt")
echo "base $BASE: $(wc -l < "$T/base.txt" | tr -d ' ') tests · HEAD: $(wc -l < "$T/head.txt" | tr -d ' ') tests"
echo "--- gone since $BASE"; comm -23 "$T/base.txt" "$T/head.txt"
echo "--- new since $BASE"; comm -13 "$T/base.txt" "$T/head.txt"
