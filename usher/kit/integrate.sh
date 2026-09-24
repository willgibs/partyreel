#!/bin/zsh
# integrate.sh <track> <handoff-sha> <board> <msgfile>: one lane's integration as ONE chain that cannot run past a red:
# the merge (merge-lane.sh, gated on its exit AND its "MERGED <sha>" line; the sha shortened to 8 because the merge script
# compares short shas), then the next gate number (from the highest gate<N>.log in $S), then every EXIT line read and
# counted. The gate scopes itself from the merge's parents (gate-lane.sh; FULL=1 in the environment forces the full gate).
# Run it detached and wait on "INTEGRATE DONE": (nohup zsh usher/kit/integrate.sh t sha board msg > $S/integrate-t.log 2>&1 &)
# Born 2026-09-20 from two mistakes in one day: a gate started on the merge script's tail (a full sha aborted it silently),
# and a lane's branch pruned before the merge line was read.
set -u
TRACK="$1"; HSHA="${2:0:8}"; BOARD="$3"; MSG="$4"
# S is this session's scratchpad, required: a default would write one session's logs into another's.
: "${S:?set S to this session's scratchpad}"
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT/../.."
[ -z "$(git status --short)" ] || { echo "tree not clean:"; git status --short | head -5; echo "INTEGRATE DONE red"; exit 1; }
zsh "$KIT/merge-lane.sh" "$TRACK" "$HSHA" "$MSG" > "$S/merge-$TRACK.log" 2>&1; ME=$?
MSHA=$(grep "^MERGED " "$S/merge-$TRACK.log" | awk '{print $2}')
[ "$ME" = 0 ] && [ -n "$MSHA" ] || { echo "MERGE RED (exit $ME):"; tail -12 "$S/merge-$TRACK.log"; echo "INTEGRATE DONE red"; exit 1; }
grep -E "^desk boards:|^typecheck" "$S/merge-$TRACK.log"; echo "MERGED $MSHA"
LAST=$(ls "$S" 2>/dev/null | sed -nE 's/^gate([0-9]+)\.log$/\1/p' | sort -n | tail -1); N=$(( ${LAST:-0} + 1 ))
zsh "$KIT/gate-lane.sh" "$N" "$BOARD" > "$S/gate$N.log" 2>&1
grep -q "GATE$N DONE" "$S/gate$N.log" || { echo "GATE $N did not finish"; tail -5 "$S/gate$N.log"; echo "INTEGRATE DONE red"; exit 1; }
grep -E "^SCOPE|^LAB|^HARNESS|^EXIT|^build: |Tests  |checks|steps|retrying" "$S/gate$N.log"
RED=$(grep -cE "^EXIT\[[^]]+\]=[1-9]" "$S/gate$N.log")
echo "gate $N red steps: $RED$(grep -qE '^EXIT\[lab:demo [^]]+\]=[1-9]' "$S/gate$N.log" && echo " (a red lab:demo may be the harness: read $S/gate$N-demo.log per step before calling it)")"
echo "INTEGRATE DONE $([ "$RED" = 0 ] && echo green || echo red) merged=$MSHA gate=$N"
exit "$RED"
