#!/bin/zsh
# usage: S=<scratchpad> gate-lane.sh <N> <board>   (the Orchestrator's own dev server on :3130)
N="$1"; BOARD="$2"
: "${S:?set S to this session's scratchpad (every kit script writes its logs there)}"
cd /Users/gibby/local/ai/partyreel
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
export DESIGN_PREVIEW_KEY="$(grep '^DESIGN_PREVIEW_KEY=' .env.local | cut -d= -f2- | tr -d '"')"
echo "GATE$N on $(git rev-parse --short HEAD) $(date -u)"
# the contention nobody's manifest names (siliconsadie, m/builds, 2026-09-20): the load beside the exit codes, so a
# timed-out step can be read against what the machine was doing (gate 62's two timeouts sat under a load of seven).
echo "LOAD $(uptime | sed -E 's/.*load averages?: //')"
# the catalog's specimen code first: a gallery-demos.tsx change leaves specimens.generated.json stale, and pnpm test
# would only say so late
node "src/app/(dev)/design/gallery/collect-specimens.mjs" >/dev/null 2>&1; echo "EXIT[specimens]=$?"
pnpm lint; echo "EXIT[pnpm lint]=$?"
pnpm -s vitest run 2>&1 | tail -15; echo "EXIT[pnpm test]=${pipestatus[1]}"
# production builds take turns across every lane on the machine (dev servers and tests stay parallel)
zsh scripts/build-lock.sh pnpm build 2>&1 | tail -12; echo "EXIT[pnpm build]=${pipestatus[1]}"
lsof -ti tcp:3130 | xargs -r kill 2>/dev/null; sleep 1
(pnpm dev -p 3130 >"$S/dev3130.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:3130/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
echo "dev ready after ${i}x2s"
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:3130/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
echo "lab ready after ${j}x2s"
pnpm -s lab:smoke --base http://localhost:3130 2>&1 | tee "$S/gate$N-smoke.log" | tail -8; echo "EXIT[lab:smoke]=${pipestatus[1]}"
# the harness's own negative control (the toasts finding, 2026-09-20): one step known to MOVE (seed-avatar.look, four looks) is
# pressed first; if IT reads FROZEN the harness is blind on this run and a frozen step below is the harness, not the board.
perl -e 'alarm 240; exec @ARGV' pnpm -s lab:demo --only seed-avatar.look --base http://localhost:3130 > "$S/gate$N-sight.log" 2>&1; if grep -qE "seed-avatar.look +ok" "$S/gate$N-sight.log"; then echo "HARNESS sees (seed-avatar.look moved)"; else echo "HARNESS BLIND on this run: a FROZEN step below is the harness, not the board"; fi
# a cold frame compile under load stalls CDP past its 60 s (gate 62, 2026-09-20: two TIMED OUT steps, green on the warm re-run):
# one retry on the warm server; both logs kept; the exit is the last attempt's.
DEMO=1; for a in 1 2; do perl -e 'alarm 420; exec @ARGV' pnpm -s lab:demo --board "$BOARD" --base http://localhost:3130 2>&1 | tee "$S/gate$N-demo-$a.log" | tail -14; DEMO=${pipestatus[1]}; [ "$DEMO" = 0 ] && break; echo "lab:demo attempt $a red; retrying warm"; done; cp "$S/gate$N-demo-$a.log" "$S/gate$N-demo.log"; echo "EXIT[lab:demo $BOARD]=$DEMO"
lsof -ti tcp:3130 | xargs -r kill 2>/dev/null
echo "GATE$N DONE $(date -u)"
