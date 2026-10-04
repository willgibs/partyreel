#!/bin/zsh
# usage: merge-lane.sh <track> <handoff-sha> <merge-msg-file>
set -e
TRACK="$1"; HSHA="$2"; MSG="$3"
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT/../.."
trap 'echo "STEP FAILED"; exit 1' ERR
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
: "${S:?set S to this session's scratchpad}"
[ -n "$TRACK" ] && [ -n "$HSHA" ] && [ -f "$MSG" ] || { echo "usage: merge-lane.sh <track> <sha> <msgfile>"; exit 1; }
# ★ A LANE MERGES INTO launch-prep ALONE: `main` moves only at a milestone, and the desktop app can open a fresh session
# with the root on `main` (2026-10-01), where this merge would land in production's branch. KIT_BRANCH is negative.sh's.
BR="${KIT_BRANCH:-launch-prep}"
[ "$(git branch --show-current)" = "$BR" ] || { echo "the root is on $(git branch --show-current), not $BR: git checkout $BR first"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "tree not clean"; git status --short; exit 1; }
git fetch -q origin
if git show-ref --verify --quiet "refs/heads/lp/$TRACK"; then
  [ "$(git rev-parse "lp/$TRACK")" = "$(git rev-parse "origin/lp/$TRACK")" ] || { echo "local lp/$TRACK differs from origin"; exit 1; }
else
  git branch "lp/$TRACK" "origin/lp/$TRACK"
fi
# The head is compared whole: any unambiguous abbreviation of it passes, since git's own short form grows a character as
# the repository does (8 became 9 on 2026-10-04, and a comparison of short forms refused every lane).
WANT="$(git rev-parse -q --verify "$HSHA^{commit}" 2>/dev/null)"
[ -n "$WANT" ] && [ "$(git rev-parse "lp/$TRACK")" = "$WANT" ] || { echo "lane head moved: $(git rev-parse --short "lp/$TRACK") (asked for $HSHA)"; exit 1; }
git show "lp/$TRACK:docs/tracks/$TRACK.md" | grep -q '^status: handed-off' || { echo "manifest not handed-off"; exit 1; }
echo "stale by $(git rev-list --count "lp/$TRACK..HEAD") commits"
git -c merge.conflictStyle=diff3 merge --no-ff --no-commit "lp/$TRACK" >/dev/null 2>&1 || true
# No shared registry file is left to resolve: a board is its folder under sandbox/, so two lanes' boards never touch one
# file and a retirement is a folder deletion git merges by itself. A conflict in registry.ts is a real overlap, refused
# here before the `git add -u` below could stage its markers, and rebuilt by hand from both sides.
REG="src/app/(dev)/design/sandbox/registry.ts"
grep -l '^<<<<<<<' "$REG" 2>/dev/null && { echo "MARKERS LEFT"; exit 1; }
git rm -qf "docs/tracks/$TRACK.md"
node "src/app/(dev)/design/gallery/collect-specimens.mjs" >/dev/null
git add -u -- "src/app/(dev)/design"
[ -z "$(git diff --name-only --diff-filter=U)" ] || { echo "UNMERGED LEFT:"; git diff --name-only --diff-filter=U; exit 1; }
# the desk as the merge leaves it: every folder under sandbox/ with a spec (registry.test.ts holds each to its folder)
echo "desk boards: $(find "src/app/(dev)/design/sandbox" -mindepth 2 -maxdepth 2 -name spec.ts | wc -l | tr -d ' ')"
# The integration's one typecheck, run for code the lane never typechecked (the staged merge against the lane's head,
# through scope.sh) or on FULL=1 (a lane whose own gate is in doubt): with docs alone between them, every code file is
# one the lane's own gate typechecked. The gate's `next build` checks the same program again but drops test files'
# errors (next's runTypeCheck.js), so this is the one that covers the other. A killed dev server leaves a truncated
# .next/dev/types/validator.ts that the typecheck reads (2026-09-20): clear it first; and `cmd || VAR=$?` keeps zsh's
# ERR trap quiet so the RED line below prints the reason instead of a bare STEP FAILED.
UNGATED=$(git diff --cached --no-renames --name-only "lp/$TRACK")
CODE=$(print -r -- "$UNGATED" | zsh "$KIT/scope.sh" code)
TC=0; T0=$SECONDS
if [ -n "$CODE" ] || [ "${FULL:-}" = 1 ]; then
  rm -rf .next/dev
  pnpm typecheck >"$S/$TRACK-typecheck.log" 2>&1 || TC=$?
  # A green typecheck stamps the staged tree, so the gate's build of that exact tree skips its own type pass.
  [ "$TC" = 0 ] && touch "$S/typechecked-$(git write-tree)"
  if [ -n "$CODE" ]; then echo "typecheck: $(print -r -- "$CODE" | wc -l | tr -d ' ') code path(s) the lane never gated, first $(print -r -- "$CODE" | head -1) ($(( SECONDS - T0 ))s)"
  else echo "typecheck: forced (FULL=1) ($(( SECONDS - T0 ))s)"; fi
else echo "typecheck: skipped, the merge differs from the lane's head only in docs"; fi
T0=$SECONDS; RT=0; pnpm -s vitest run "src/app/(dev)/design/sandbox/registry.test.ts" "src/app/(dev)/design/_data/legacy-routes.test.ts" >"$S/$TRACK-registry-tests.log" 2>&1 || RT=$?
echo "typecheck $TC registry-tests $RT ($(( SECONDS - T0 ))s)"
[ "$TC" = 0 ] && [ "$RT" = 0 ] || { echo "RED before commit; merge left staged"; [ "$TC" = 0 ] || grep -E "error TS" "$S/$TRACK-typecheck.log" | head -5; tail -30 "$S/$TRACK-registry-tests.log"; exit 1; }
git commit -q -F "$MSG"
echo "MERGED $(git rev-parse --short HEAD)"; git status --short | wc -l
