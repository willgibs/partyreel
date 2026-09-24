#!/bin/zsh
# usage: merge-lane.sh <track> <handoff-sha> <merge-msg-file>
set -e
TRACK="$1"; HSHA="$2"; MSG="$3"
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT/../.."
trap 'echo "STEP FAILED"; exit 1' ERR
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
: "${S:?set S to this session's scratchpad}"
[ -n "$TRACK" ] && [ -n "$HSHA" ] && [ -f "$MSG" ] || { echo "usage: merge-lane.sh <track> <sha> <msgfile>"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "tree not clean"; git status --short; exit 1; }
git fetch -q origin
if git show-ref --verify --quiet "refs/heads/lp/$TRACK"; then
  [ "$(git rev-parse "lp/$TRACK")" = "$(git rev-parse "origin/lp/$TRACK")" ] || { echo "local lp/$TRACK differs from origin"; exit 1; }
else
  git branch "lp/$TRACK" "origin/lp/$TRACK"
fi
[ "$(git rev-parse --short "lp/$TRACK")" = "$HSHA" ] || { echo "lane head moved: $(git rev-parse --short "lp/$TRACK")"; exit 1; }
git show "lp/$TRACK:docs/tracks/$TRACK.md" | grep -q '^status: handed-off' || { echo "manifest not handed-off"; exit 1; }
echo "stale by $(git rev-list --count "lp/$TRACK..HEAD") commits"
git -c merge.conflictStyle=diff3 merge --no-ff --no-commit "lp/$TRACK" >/dev/null 2>&1 || true
python3 - <<'PY'
# diff3 hunks: <<<<<<< ours | ||||||| base | ======= theirs | >>>>>>>. Result = theirs' lines (its additions and the
# lines both sides kept, in theirs' order), then ours' pure additions; a line the base had that EITHER side dropped is
# left out (a retirement stays retired). Two RULINGS rows added at one anchor still get the row-closing splice.
files=["src/app/(dev)/design/sandbox/registry.ts","src/app/(dev)/design/(shell)/lab/boards.ts","src/app/(dev)/design/touchpoints.ts"]
for f in files:
    lines=open(f).read().split('\n')
    if not any(l.startswith('<<<<<<< ') for l in lines): print(f,"clean"); continue
    out=[]; i=0; n=0
    while i<len(lines):
        if lines[i].startswith('<<<<<<< '):
            j=next(x for x in range(i,len(lines)) if lines[x].startswith('|||||||') or lines[x]=='=======')
            base=[]
            if lines[j].startswith('|||||||'):
                k=lines.index('=======',j); base=lines[j+1:k]
            else: k=j
            e=next(x for x in range(k,len(lines)) if lines[x].startswith('>>>>>>> '))
            ours=lines[i+1:j]; theirs=lines[k+1:e]
            ours_add=[l for l in ours if l not in base and l not in theirs]
            theirs_add=[l for l in theirs if l not in base]
            kept=[l for l in base if l in ours and l in theirs]
            rulings = any('id: "' in l for l in ours_add) and any('id: "' in l for l in theirs_add)
            if rulings: out += theirs + ['      ],','    },','  },','  {'] + ours_add
            else: out += [l for l in theirs if (l in theirs_add or l in kept)] + ours_add
            i=e+1; n+=1
        else: out.append(lines[i]); i+=1
    open(f,'w').write('\n'.join(out)); print(f,"hunks resolved:",n)
PY
grep -l '^<<<<<<<' "src/app/(dev)/design/sandbox/registry.ts" "src/app/(dev)/design/(shell)/lab/boards.ts" "src/app/(dev)/design/touchpoints.ts" 2>/dev/null && { echo "MARKERS LEFT"; exit 1; }
git add -- "src/app/(dev)/design/sandbox/registry.ts" "src/app/(dev)/design/(shell)/lab/boards.ts" "src/app/(dev)/design/touchpoints.ts"
git rm -qf "docs/tracks/$TRACK.md"
node "src/app/(dev)/design/gallery/collect-specimens.mjs" >/dev/null
git add -u -- "src/app/(dev)/design"
[ -z "$(git diff --name-only --diff-filter=U)" ] || { echo "UNMERGED LEFT:"; git diff --name-only --diff-filter=U; exit 1; }
# every board on the desk must keep its RULINGS row (board id = its sandbox directory, by convention)
python3 - <<'PY2'
import re,sys
reg=open("src/app/(dev)/design/sandbox/registry.ts").read()
tp=open("src/app/(dev)/design/touchpoints.ts").read()
ids=re.findall(r'from "\./([a-z0-9-]+)/spec"',reg)
missing=[i for i in ids if 'id: "%s"'%i not in tp]
print("desk boards:",len(ids),"RULINGS rows missing:",missing)
sys.exit(1 if missing else 0)
PY2
# The integration's one typecheck, and only for code the lane never typechecked: the staged merge against the lane's
# head (scope.sh). With docs alone between them, every code file is one the lane's own gate typechecked. The gate's
# `next build` checks the same program again but drops test files' errors (next's runTypeCheck.js), so this is the one
# that covers the other. A killed dev server leaves a truncated .next/dev/types/validator.ts that the typecheck reads
# (2026-09-20): clear it first; and `cmd || VAR=$?` keeps zsh's ERR trap quiet so the RED line below prints the reason
# instead of a bare STEP FAILED.
UNGATED=$(git diff --cached --no-renames --name-only "lp/$TRACK")
CODE=$(print -r -- "$UNGATED" | zsh "$KIT/scope.sh" code)
TC=0; T0=$SECONDS
if [ -n "$CODE" ]; then
  rm -rf .next/dev
  pnpm typecheck >"$S/$TRACK-typecheck.log" 2>&1 || TC=$?
  echo "typecheck: $(print -r -- "$CODE" | wc -l | tr -d ' ') code path(s) the lane never gated, first $(print -r -- "$CODE" | head -1) ($(( SECONDS - T0 ))s)"
else echo "typecheck: skipped, the merge differs from the lane's head only in docs"; fi
T0=$SECONDS; RT=0; pnpm -s vitest run "src/app/(dev)/design/sandbox/registry.test.ts" "src/app/(dev)/design/touchpoints.test.ts" >"$S/$TRACK-registry-tests.log" 2>&1 || RT=$?
echo "typecheck $TC registry-tests $RT ($(( SECONDS - T0 ))s)"
[ "$TC" = 0 ] && [ "$RT" = 0 ] || { echo "RED before commit; merge left staged"; [ "$TC" = 0 ] || grep -E "error TS" "$S/$TRACK-typecheck.log" | head -5; tail -30 "$S/$TRACK-registry-tests.log"; exit 1; }
git commit -q -F "$MSG"
echo "MERGED $(git rev-parse --short HEAD)"; git status --short | wc -l
