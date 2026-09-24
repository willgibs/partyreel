#!/bin/zsh
# negative.sh: the standing negative control for the kit's refusals. A check is only real if it can fail loudly, and a
# refusal proven once by accident decays toward decorative. Every known-bad input below must be REFUSED; a refusal that has
# gone quiet is this script's own failure. It tests the kit it sits in, against the tree it sits in (a lane's worktree
# for a kit lane); touches no real doc. Run it after any kit change and before a day's first integration, never by habit.
set -u; setopt nonomatch
KIT="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$KIT/../.." && pwd)"; T=$(mktemp -d); RC=0
ok() { echo "ok    $1"; }; bad() { echo "FAIL  $1"; RC=1; }
cd "$REPO"
# 1. integrate.sh refuses a lane that does not exist, before any gate log is written
S="$T" zsh "$KIT/integrate.sh" no-such-lane deadbeefcafe body-type /dev/null > "$T/integrate.out" 2>&1
grep -q "^INTEGRATE DONE red" "$T/integrate.out" && ! ls "$T"/gate*.log >/dev/null 2>&1 && ok "integrate.sh refuses a missing lane and starts no gate" || bad "integrate.sh did not refuse a missing lane"
# 1b. hand-merge.sh refuses a lane that does not exist and a head that is not the sha named, before touching the tree
BEFORE=$(git -C "$REPO" status --short); S="$T" zsh "$KIT/hand-merge.sh" no-such-lane deadbeef /dev/null > "$T/hm1.out" 2>&1; grep -q "^REFUSED" "$T/hm1.out" && [ "$(git -C "$REPO" status --short)" = "$BEFORE" ] && ok "hand-merge.sh refuses a missing lane and leaves the tree as it was" || bad "hand-merge.sh missing lane"
# 1c. every merge and gate script refuses to run with no scratchpad, before it touches anything
for script in integrate.sh merge-lane.sh hand-merge.sh gate-lane.sh demo-rerun.sh; do env -u S zsh "$KIT/$script" no-such-lane deadbeef none /dev/null > "$T/nos.out" 2>&1; [ $? -ne 0 ] && grep -q "set S" "$T/nos.out" && ok "$script refuses to run without S" || bad "$script ran without S"; done
# 2. merge-lane.sh refuses a full-length sha (it compares short ones) and leaves the tree untouched
BEFORE="$(git status --short)"; S="$T" zsh "$KIT/merge-lane.sh" no-such-lane deadbeefcafe0123456789deadbeefcafe01234567 /dev/null > "$T/merge.out" 2>&1; [ "$(git status --short)" = "$BEFORE" ] && ! grep -q "^MERGED" "$T/merge.out" && ok "merge-lane.sh refuses a bad lane and leaves the tree as it was" || bad "merge-lane.sh merged or changed the tree on a bad lane"
# 3. record.py refuses a changelog and a STATUS row, and writes nothing: what shipped lives in the merge commit, STATUS is a snapshot
mkdir -p "$T/docs"; echo '{"changelog": "x"}' > "$T/rec0.json"; echo '{"status": [{"id": "x", "state": "y"}]}' > "$T/rec1.json"
(cd "$T" && python3 "$KIT/record.py" rec0.json > "$T/rec0.out" 2>&1); R0=$?; (cd "$T" && python3 "$KIT/record.py" rec1.json > "$T/rec1.out" 2>&1); R1=$?
[ $R0 != 0 ] && [ $R1 != 0 ] && grep -q "no CHANGELOG" "$T/rec0.out" && grep -q "snapshot" "$T/rec1.out" && ok "record.py refuses a changelog and a STATUS row" || bad "record.py accepted a changelog or a STATUS row"
# 4. record.py refuses a ROADMAP retirement that matches nothing, and writes nothing
printf '%s\n' "## Now" "" "- a line" > "$T/docs/ROADMAP.md"; echo '{"retire_roadmap": ["no such line"]}' > "$T/rec.json"
(cd "$T" && python3 "$KIT/record.py" rec.json > "$T/rec.out" 2>&1); grep -q "need exactly one" "$T/rec.out" && grep -q "^- a line" "$T/docs/ROADMAP.md" && ok "record.py refuses an unmatched retirement and writes nothing" || bad "record.py retired nothing but reported success, or wrote"
# 5. moltbook.mjs refuses to send the key anywhere but www.moltbook.com (the guard is in the client's one fetch path)
grep -q 'the key goes nowhere but www.moltbook.com/api/v1' "$KIT/moltbook.mjs" && grep -q 'startsWith("https://www.moltbook.com/api/v1/")' "$KIT/moltbook.mjs" && ok "moltbook.mjs keeps the key on www.moltbook.com" || bad "moltbook.mjs lost its host guard"
# 6. review-sheet.mjs refuses to run without a paste, and reports zero verdicts on a paste with no review line (never a crash)
node "$KIT/review-sheet.mjs" > "$T/rs1.out" 2>&1; [ $? = 1 ] && grep -q "usage" "$T/rs1.out" && ok "review-sheet.mjs refuses to run without a paste" || bad "review-sheet.mjs ran without a paste"
printf '%s\n' "# build 0000000" "not a review line" > "$T/empty.txt"; S="$T" node "$KIT/review-sheet.mjs" "$T/empty.txt" "$T/empty.html" > "$T/rs2.out" 2>&1 && grep -q "0 verdicts" "$T/rs2.out" && ok "review-sheet.mjs reports zero verdicts on a paste with none" || bad "review-sheet.mjs crashed or invented verdicts on an empty paste"
# 7. scope.sh passes no code as docs and no rendered path as inert: the light gate and a lab-less gate are only as safe as
#    this classing, and a path it does not know (newdir/) must widen the gate
printf '%s\n' "src/app/page.tsx" "src/lib/a.test.ts" "content/help/a.md" "src/x/notes.md" "docs/tool.ts" "package.json" "pnpm-lock.yaml" "next.config.ts" "public/a.png" "supabase/migrations/1.sql" "workers/export/index.ts" "scripts/lab-smoke.mjs" "newdir/a" > "$T/code.txt"
printf '%s\n' "src/app/page.tsx" "src/components/ui/button.tsx" "content/blog/a.md" "docs/tool.ts" "package.json" "next.config.ts" "public/a.png" "scripts/lab-demo.mjs" "newdir/a" > "$T/lab.txt"
zsh "$KIT/scope.sh" < /dev/null > /dev/null 2>&1; USAGE=$?
[ "$(zsh "$KIT/scope.sh" code < "$T/code.txt")" = "$(cat "$T/code.txt")" ] && [ "$(zsh "$KIT/scope.sh" lab < "$T/lab.txt")" = "$(cat "$T/lab.txt")" ] && [ $USAGE = 2 ] && ok "scope.sh passes no code as docs, no rendered path as inert, and no call without a class" || bad "scope.sh let a code or rendered path through"
# 8. record.py counts STATUS as record-depth-policy.test.ts does (a trailing newline ends a line, it adds none): OVER at 81, not at 80
echo '{}' > "$T/rec2.json"; seq 80 > "$T/docs/STATUS.md"; (cd "$T" && python3 "$KIT/record.py" rec2.json > "$T/cap80.out" 2>&1); seq 81 > "$T/docs/STATUS.md"; (cd "$T" && python3 "$KIT/record.py" rec2.json > "$T/cap81.out" 2>&1)
grep -q "STATUS 80 of 80 lines$" "$T/cap80.out" && grep -q "STATUS 81 of 80 lines (OVER)" "$T/cap81.out" && ok "record.py's cap reads 80 lines as under and 81 as OVER" || bad "record.py counts STATUS unlike the test"
# the costs the refusals were written for, re-read from the system as it is now (a report, never a refusal; cost-readings.mjs)
node "$KIT/cost-readings.mjs" 2>&1 | cut -c1-400 || echo "cost readings: the script failed (read it before the next integration)"
rm -rf "$T"; echo "negative control: $([ $RC = 0 ] && echo all refusals hold || echo A REFUSAL HAS GONE QUIET)"; exit $RC
