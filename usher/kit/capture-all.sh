#!/bin/zsh
# capture-all.sh <dir> [port]: every board on the desk, in desk order, through one dev server; the pictures for a review sheet.
# Its default port is capture.sh's (3140, outside the gate's and the lanes'), since it too kills what holds it.
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT/../.."
DIR="$1"; PORT="${2:-3140}"
export DESIGN_PREVIEW_KEY="$(grep '^DESIGN_PREVIEW_KEY=' .env.local | cut -d= -f2- | tr -d '"')"
# The desk's own order: every folder under sandbox/ with a spec, by its desk place (board-card reads the specs).
BOARDS=$(node "$KIT/board-card.mjs" --desk 2>/dev/null | awk '{print $2}')
[ -n "$BOARDS" ] || { echo "capture-all: board-card found no board"; exit 1; }
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
