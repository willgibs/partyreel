#!/bin/zsh
# usage: S=<scratchpad> demo-rerun.sh <board> [attempts]: the gate's lab:demo step alone on :3130 (GATE_PORT moves it, as
# in gate-lane.sh), for a gate whose only red is a demo timeout (a cold compile under load times out CDP at 60 s)
: "${S:?set S to this session's scratchpad}"
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
cd "$(dirname "$0")/../.."
BOARD="$1"; N="${2:-2}"; PORT="${GATE_PORT:-3130}"
export DESIGN_PREVIEW_KEY="$(grep '^DESIGN_PREVIEW_KEY=' .env.local | cut -d= -f2- | tr -d '"')"
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; sleep 1
(pnpm dev -p $PORT >"$S/dev$PORT.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
curl -s -o /dev/null "http://localhost:$PORT/design/lab/$BOARD?key=$DESIGN_PREVIEW_KEY"; echo "warmed $BOARD"
RC=1
for a in $(seq 1 $N); do
  perl -e 'alarm 420; exec @ARGV' pnpm -s lab:demo --board "$BOARD" --base http://localhost:$PORT 2>&1 | tee "$S/demo-rerun-$BOARD-$a.log" | tail -6; RC=${pipestatus[1]}; echo "EXIT[lab:demo $BOARD attempt $a]=$RC"
  [ "$RC" = 0 ] && break
done
lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null
exit $RC
