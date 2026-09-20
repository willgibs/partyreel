#!/bin/zsh
# usage: gate-lane.sh <N> <board>   (the Orchestrator's own dev server on :3137)
N="$1"; BOARD="$2"
cd /Users/gibby/local/ai/partyreel
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
S=/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad
export DESIGN_PREVIEW_KEY="$(grep '^DESIGN_PREVIEW_KEY=' .env.local | cut -d= -f2- | tr -d '"')"
echo "GATE$N on $(git rev-parse --short HEAD) $(date -u)"
# the generator first (gate 37, 2026-09-19: a touchpoints change left the rules artifact and docs/design/library.md stale, and pnpm test found it late)
pnpm -s design:rules >/dev/null 2>&1; echo "EXIT[design:rules]=$?"
node "src/app/(dev)/design/gallery/collect-specimens.mjs" >/dev/null 2>&1; echo "EXIT[specimens]=$?"
pnpm lint; echo "EXIT[pnpm lint]=$?"
pnpm -s vitest run 2>&1 | tail -15; echo "EXIT[pnpm test]=${pipestatus[1]}"
pnpm build 2>&1 | tail -12; echo "EXIT[pnpm build]=${pipestatus[1]}"
lsof -ti tcp:3137 | xargs -r kill 2>/dev/null; sleep 1
(pnpm dev -p 3137 >"$S/dev3137.log" 2>&1 &)
for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:3137/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
echo "dev ready after ${i}x2s"
for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:3137/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
echo "lab ready after ${j}x2s"
pnpm -s lab:smoke --base http://localhost:3137 2>&1 | grep -v "$DESIGN_PREVIEW_KEY" | tail -8; echo "EXIT[lab:smoke]=${pipestatus[1]}"
perl -e 'alarm 300; exec @ARGV' pnpm -s lab:demo --board "$BOARD" --base http://localhost:3137 2>&1 | grep -v "$DESIGN_PREVIEW_KEY" | tail -14; echo "EXIT[lab:demo $BOARD]=${pipestatus[1]}"
lsof -ti tcp:3137 | xargs -r kill 2>/dev/null
echo "GATE$N DONE $(date -u)"
