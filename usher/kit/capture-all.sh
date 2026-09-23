#!/bin/zsh
# capture-all.sh <dir> [port]: every board on the desk, in desk order, through one dev server; the pictures for a review sheet.
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
cd /Users/gibby/local/ai/partyreel
DIR="$1"; PORT="${2:-3137}"; KIT="$(cd "$(dirname "$0")" && pwd)"
eval "$(sed -n 7p "$KIT/gate-lane.sh")"   # the key line, the gate's own way
BOARDS=$(node -e 'import("./src/app/(dev)/design/touchpoints.ts").catch(()=>null)' 2>/dev/null); [ -n "$BOARDS" ] || BOARDS=$(node "$KIT/board-card.mjs" --desk 2>/dev/null | awk '{print $2}')
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; sleep 1
(pnpm dev -p $PORT >"/tmp/dev$PORT.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
for b in ${(f)BOARDS}; do
  curl -s -o /dev/null "http://localhost:$PORT/design/lab/$b?key=$DESIGN_PREVIEW_KEY"
  perl -e 'alarm 900; exec @ARGV' pnpm -s lab:demo --board "$b" --base http://localhost:$PORT --save-shots "$DIR" 2>&1 | grep -E "steps, " | sed "s/^/$b: /"
done
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null
echo "CAPTURE-ALL DONE: $(ls "$DIR" 2>/dev/null | wc -l | tr -d ' ') pictures in $DIR"
