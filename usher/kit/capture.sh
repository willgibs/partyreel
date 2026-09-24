#!/bin/zsh
# capture.sh <board> <dir> [port]: every option of every open step of one board as PNGs, through the lab's own demo runner
# (`--save-shots`, added 2026-09-20) on a dev server this script starts and stops; the pictures feed review-sheet.mjs.
# It kills whatever holds its port first, so the default, 3140, sits outside the gate's 3130 and the lanes' 3131 to 3139.
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
cd /Users/gibby/local/ai/partyreel
BOARD="$1"; DIR="$2"; PORT="${3:-3140}"
export DESIGN_PREVIEW_KEY="$(grep '^DESIGN_PREVIEW_KEY=' .env.local | cut -d= -f2- | tr -d '"')"
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; sleep 1
(pnpm dev -p $PORT >"/tmp/dev$PORT.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
curl -s -o /dev/null "http://localhost:$PORT/design/lab/$BOARD?key=$DESIGN_PREVIEW_KEY"
perl -e 'alarm 600; exec @ARGV' pnpm -s lab:demo --board "$BOARD" --base http://localhost:$PORT --save-shots "$DIR" 2>&1 | tail -6; RC=${pipestatus[1]}
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null
echo "captured: $(ls "$DIR" 2>/dev/null | wc -l | tr -d ' ') pictures in $DIR"; exit $RC
