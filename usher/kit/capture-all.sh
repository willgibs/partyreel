#!/bin/zsh
# capture-all.sh <dir> [port]: every board on the desk, in desk order, through one dev server; the pictures for a review sheet.
# Its default port is capture.sh's (3140, outside the gate's and the lanes'), since it too kills what holds it.
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT/../.."
source "$KIT/kit-env.sh"
DIR="$1"; PORT="${2:-3140}"
export DESIGN_PREVIEW_KEY="$(kit_env DESIGN_PREVIEW_KEY)"
# The desk's own order: every folder under sandbox/ with a spec, by its desk place (board-card reads the specs).
BOARDS=$(node "$KIT/board-card.mjs" --desk 2>/dev/null | awk '{print $2}')
[ -n "$BOARDS" ] || { echo "capture-all: board-card found no board"; exit 1; }
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; kit_free_port $PORT; sleep 1
# The server starts on an empty dev cache, as the gate's does (gate 123: a cache warmed on another tree can hand a frame
# a stale chunk that reloads it for ever), unless another dev server runs from this tree (the gate's, on 3130, shares
# it): src/lib/gate-dev-cache-policy.test.ts holds this line between the stop and the start.
OTHERS=$(for p in $(pgrep -f 'next dev'); do lsof -a -p $p -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'; done | grep -Fxc "$PWD")
if [ "$OTHERS" = 0 ]; then rm -rf .next/dev; else echo "dev cache kept: another dev server runs from this tree"; fi
(pnpm dev -p $PORT >"/tmp/dev$PORT.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
for b in ${(f)BOARDS}; do
  curl -s -o /dev/null "http://localhost:$PORT/design/lab/$b?key=$DESIGN_PREVIEW_KEY"
  perl -e 'alarm 900; exec @ARGV' node scripts/lab-demo.mjs --board "$b" --base http://localhost:$PORT --save-shots "$DIR" 2>&1 | grep -E "steps, " | sed "s/^/$b: /"
done
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; kit_free_port $PORT
echo "CAPTURE-ALL DONE: $(ls "$DIR" 2>/dev/null | wc -l | tr -d ' ') pictures in $DIR"
