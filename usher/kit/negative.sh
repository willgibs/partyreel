#!/bin/zsh
# negative.sh: the standing negative control for the kit's refusals (gracetargaryen, m/agents, 2026-09-20: "a check is
# only real if it can fail loudly"; a refusal proven once by accident decays toward decorative). Every known-bad input
# below must be REFUSED; a refusal that has gone quiet is this script's own failure. Run from the repo; touches no real doc.
set -u; setopt nonomatch
KIT="$(cd "$(dirname "$0")" && pwd)"; REPO=/Users/gibby/local/ai/partyreel; T=$(mktemp -d); RC=0
ok() { echo "ok    $1"; }; bad() { echo "FAIL  $1"; RC=1; }
cd "$REPO"
# 1. integrate.sh refuses a lane that does not exist, before any gate log is written
S="$T" zsh "$KIT/integrate.sh" no-such-lane deadbeefcafe body-type /dev/null > "$T/integrate.out" 2>&1
grep -q "^INTEGRATE DONE red" "$T/integrate.out" && ! ls "$T"/gate*.log >/dev/null 2>&1 && ok "integrate.sh refuses a missing lane and starts no gate" || bad "integrate.sh did not refuse a missing lane"
# 1b. hand-merge.sh refuses a lane that does not exist and a head that is not the sha named, before touching the tree
zsh "$KIT/hand-merge.sh" no-such-lane deadbeef /dev/null > "$T/hm1.out" 2>&1; grep -q "^REFUSED" "$T/hm1.out" && [ -z "$(git -C "$REPO" status --short)" ] && ok "hand-merge.sh refuses a missing lane and leaves the tree as it was" || bad "hand-merge.sh missing lane"
# 2. merge-lane.sh refuses a full-length sha (it compares short ones) and leaves the tree untouched
BEFORE="$(git status --short)"; zsh "$KIT/merge-lane.sh" no-such-lane deadbeefcafe0123456789deadbeefcafe01234567 /dev/null > "$T/merge.out" 2>&1; [ "$(git status --short)" = "$BEFORE" ] && ! grep -q "^MERGED" "$T/merge.out" && ok "merge-lane.sh refuses a bad lane and leaves the tree as it was" || bad "merge-lane.sh merged or changed the tree on a bad lane"
# 3. status-row.py refuses to touch a doc that already holds two rows for one id (on a copy)
mkdir -p "$T/docs" && printf '%s\n' "| \`dup\` | a | one |" "| \`dup\` | a | two |" > "$T/docs/STATUS.md"
(cd "$T" && python3 "$KIT/status-row.py" dup "three" > "$T/sr.out" 2>&1); grep -q "fold them by hand" "$T/sr.out" && [ "$(grep -c '^| `dup` |' "$T/docs/STATUS.md")" = 2 ] && ok "status-row.py refuses a duplicated id" || bad "status-row.py wrote over a duplicated id"
# 4. record.py refuses a ROADMAP retirement that matches nothing, and writes nothing
printf '%s\n' "## Now" "" "- a line" > "$T/docs/ROADMAP.md"; echo '{"retire_roadmap": ["no such line"]}' > "$T/rec.json"
(cd "$T" && python3 "$KIT/record.py" rec.json > "$T/rec.out" 2>&1); grep -q "need exactly one" "$T/rec.out" && grep -q "^- a line" "$T/docs/ROADMAP.md" && ok "record.py refuses an unmatched retirement and writes nothing" || bad "record.py retired nothing but reported success, or wrote"
# 5. moltbook.mjs refuses to send the key anywhere but www.moltbook.com (the guard is in the client's one fetch path)
grep -q 'the key goes nowhere but www.moltbook.com/api/v1' "$KIT/moltbook.mjs" && grep -q 'startsWith("https://www.moltbook.com/api/v1/")' "$KIT/moltbook.mjs" && ok "moltbook.mjs keeps the key on www.moltbook.com" || bad "moltbook.mjs lost its host guard"
# 6. review-sheet.mjs refuses to run without a paste, and reports zero verdicts on a paste with no review line (never a crash)
node "$KIT/review-sheet.mjs" > "$T/rs1.out" 2>&1; [ $? = 1 ] && grep -q "usage" "$T/rs1.out" && ok "review-sheet.mjs refuses to run without a paste" || bad "review-sheet.mjs ran without a paste"
printf '%s\n' "# build 0000000" "not a review line" > "$T/empty.txt"; S="$T" node "$KIT/review-sheet.mjs" "$T/empty.txt" "$T/empty.html" > "$T/rs2.out" 2>&1 && grep -q "0 verdicts" "$T/rs2.out" && ok "review-sheet.mjs reports zero verdicts on a paste with none" || bad "review-sheet.mjs crashed or invented verdicts on an empty paste"
rm -rf "$T"; echo "negative control: $([ $RC = 0 ] && echo all refusals hold || echo A REFUSAL HAS GONE QUIET)"; exit $RC
