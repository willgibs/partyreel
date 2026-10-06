#!/bin/zsh
# capture.sh <board> <dir> [port]: every option of every open step of one board as PNGs, through the lab's own demo runner
# (`--save-shots`, added 2026-09-20) on a dev server this script starts and stops; the pictures feed review-sheet.mjs.
# It kills whatever holds its port first, so the default, 3140, sits outside the gate's 3130 and the lanes' 3131 to 3139.
# The tree the kit sits in: the primary checkout for the Orchestrator, a worktree for a lane testing the kit.
cd "$(cd "$(dirname "$0")" && pwd)/../.."
source usher/kit/kit-env.sh
BOARD="$1"; DIR="$2"; PORT="${3:-3140}"
export DESIGN_PREVIEW_KEY="$(kit_env DESIGN_PREVIEW_KEY)"
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; kit_free_port $PORT; sleep 1
# The server starts on an empty dev cache, as the gate's does (gate 123: a cache warmed on another tree can hand a frame
# a stale chunk that reloads it for ever), unless another dev server runs from this tree (the gate's, on 3130, shares
# it): src/lib/gate-dev-cache-policy.test.ts holds this line between the stop and the start.
OTHERS=$(for p in $(pgrep -f 'next dev'); do lsof -a -p $p -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'; done | grep -Fxc "$PWD")
if [ "$OTHERS" = 0 ]; then rm -rf .next/dev; else echo "dev cache kept: another dev server runs from this tree"; fi
(pnpm dev -p $PORT >"/tmp/dev$PORT.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
curl -s -o /dev/null "http://localhost:$PORT/design/lab/$BOARD?key=$DESIGN_PREVIEW_KEY"
perl -e 'alarm 600; exec @ARGV' node scripts/lab-demo.mjs --board "$BOARD" --base http://localhost:$PORT --save-shots "$DIR" 2>&1 | tail -6; RC=${pipestatus[1]}
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; kit_free_port $PORT
echo "captured: $(ls "$DIR" 2>/dev/null | wc -l | tr -d ' ') pictures in $DIR"; exit $RC
