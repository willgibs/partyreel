#!/bin/zsh
# usage: S=<scratchpad> demo-rerun.sh <board> [attempts]: the gate's lab:demo step alone on :3130 (GATE_PORT moves it, as
# in gate-lane.sh), for a gate whose only red is a demo timeout (a cold compile under load times out CDP at 60 s)
: "${S:?set S to this session's scratchpad}"
cd "$(dirname "$0")/../.."
source usher/kit/kit-env.sh
BOARD="$1"; N="${2:-2}"; PORT="${GATE_PORT:-3130}"
export DESIGN_PREVIEW_KEY="$(kit_env DESIGN_PREVIEW_KEY)"
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; kit_free_port $PORT; sleep 1
# The server starts on an empty dev cache, as the gate's does (gate 39, 2026-10-06: after the gate's server was
# OOM-killed mid-demo, a server started on its cache answered every lab route 404; green on an empty one), unless
# another dev server runs from this tree: src/lib/gate-dev-cache-policy.test.ts holds this line between the stop and
# the start.
OTHERS=$(for p in $(pgrep -f 'next dev'); do lsof -a -p $p -d cwd -Fn 2>/dev/null | sed -n 's/^n//p'; done | grep -Fxc "$PWD")
if [ "$OTHERS" = 0 ]; then rm -rf .next/dev; else echo "dev cache kept: another dev server runs from this tree"; fi
(pnpm dev -p $PORT >"$S/dev$PORT.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
curl -s -o /dev/null "http://localhost:$PORT/design/lab/$BOARD?key=$DESIGN_PREVIEW_KEY"; echo "warmed $BOARD"
RC=1
for a in $(seq 1 $N); do
  perl -e 'alarm 420; exec @ARGV' node scripts/lab-demo.mjs --board "$BOARD" --base http://localhost:$PORT 2>&1 | tee "$S/demo-rerun-$BOARD-$a.log" | tail -6; RC=${pipestatus[1]}; echo "EXIT[lab:demo $BOARD attempt $a]=$RC"
  [ "$RC" = 0 ] && break
done
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; kit_free_port $PORT
exit $RC
