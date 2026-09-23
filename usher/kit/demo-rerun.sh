#!/bin/zsh
# usage: demo-rerun.sh <board> [attempts]: the gate's lab:demo step alone on :3130 (a cold compile under load times out CDP at 60 s)
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
cd /Users/gibby/local/ai/partyreel
BOARD="$1"; N="${2:-2}"; S=${S:-/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad}
export DESIGN_PREVIEW_KEY="$(grep '^DESIGN_PREVIEW_KEY=' .env.local | cut -d= -f2- | tr -d '"')"
lsof -ti tcp:3130 | xargs -r kill 2>/dev/null; sleep 1
(pnpm dev -p 3130 >"$S/dev3130.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:3130/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:3130/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
curl -s -o /dev/null "http://localhost:3130/design/lab/$BOARD?key=$DESIGN_PREVIEW_KEY"; echo "warmed $BOARD"
RC=1
for a in $(seq 1 $N); do
  perl -e 'alarm 420; exec @ARGV' pnpm -s lab:demo --board "$BOARD" --base http://localhost:3130 2>&1 | tee "$S/demo-rerun-$BOARD-$a.log" | tail -6; RC=${pipestatus[1]}; echo "EXIT[lab:demo $BOARD attempt $a]=$RC"
  [ "$RC" = 0 ] && break
done
lsof -ti tcp:3130 | xargs -r kill 2>/dev/null
exit $RC
