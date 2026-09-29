#!/bin/zsh
# usage: S=<scratchpad> gate-lane.sh <N> <board>: the integration's gate on the merge at HEAD, on the Orchestrator's own
# port (:3130; GATE_PORT moves it, for a kit lane testing the kit on its own). It gates what the lane never gated,
# read from the merge's two parents through scope.sh:
#   light: the merge differs from the lane's head (HEAD^2) only in docs, so every code path in it is one the lane's own
#     gate ran on, and `pnpm test` (which parses the docs the lab reads) is the whole gate;
#   full: lint, `pnpm test` and the build; then the lab (lab:smoke, and lab:demo on the lane's board) only when the lane's
#     own diff (HEAD^1 to HEAD) holds a path the lab renders.
# A HEAD with one parent (a gate at a record, or at a round's close) and FULL=1 take the full gate with the lab. Every
# step prints EXIT[step]=<its own exit code> (<seconds>s), its whole output in $S/gate<N>-<slug>.log; the last line,
# `GATE<N> DONE ... red steps: <n>`, is the one to wait on (a milestone's gate runs alone, with no integrate.sh to count).
N="$1"; BOARD="$2"
: "${S:?set S to this session's scratchpad (every kit script writes its logs there)}"
KIT="$(cd "$(dirname "$0")" && pwd)"; cd "$KIT/../.."
PORT="${GATE_PORT:-3130}"
source ~/.nvm/nvm.sh >/dev/null 2>&1; nvm use >/dev/null 2>&1
export DESIGN_PREVIEW_KEY="$(grep '^DESIGN_PREVIEW_KEY=' .env.local | cut -d= -f2- | tr -d '"')"
echo "GATE$N on $(git rev-parse --short HEAD) $(date -u)"
# the contention nobody's manifest names (siliconsadie, m/builds, 2026-09-20): the load beside the exit codes, so a
# timed-out step can be read against what the machine was doing (gate 62's two timeouts sat under a load of seven).
echo "LOAD $(uptime | sed -E 's/.*load averages?: //')"

# needs <code|lab> <from> <to>: the paths between two commits that need that check. A diff or a scope that fails
# answers with a line naming itself, so a broken probe widens the gate and never narrows it.
needs() {
  local d o
  d=$(git diff --no-renames --name-only "$2" "$3" 2>&1) || { print -r -- "(git diff $2 $3 failed)"; return; }
  o=$(print -r -- "$d" | zsh "$KIT/scope.sh" "$1") || { print -r -- "(scope.sh $1 failed)"; return; }
  print -r -- "$o"
}
first() { print -r -- "$(print -r -- "$1" | wc -l | tr -d ' ') path(s), first $(print -r -- "$1" | head -1)"; }
SCOPE=full; LABS="(no merge to scope by)"
if [ "${FULL:-}" = 1 ]; then echo "SCOPE full: forced (FULL=1)"; LABS="(forced)"
elif ! git rev-parse -q --verify 'HEAD^2' >/dev/null; then echo "SCOPE full: HEAD has one parent, so no lane head to scope by"
else
  CODE=$(needs code 'HEAD^2' HEAD); LABS=$(needs lab 'HEAD^1' HEAD)
  if [ -z "$CODE" ]; then SCOPE=light; echo "SCOPE light: the merge differs from the lane's head only in docs; pnpm test is the gate"
  else echo "SCOPE full: code the lane never gated, $(first "$CODE")"; fi
fi

# run <slug> <step> <tail lines> <command...>: one step on its own exit code, its log whole in $S, its tail here
RED=0
run() {
  local slug="$1" step="$2" n="$3" t=$SECONDS rc; shift 3
  "$@" > "$S/gate$N-$slug.log" 2>&1; rc=$?
  tail -n "$n" "$S/gate$N-$slug.log"; echo "EXIT[$step]=$rc ($(( SECONDS - t ))s)"
  [ "$rc" = 0 ] || RED=$(( RED + 1 ))
}
# The catalog's specimen code is regenerated and staged by the merge (merge-lane.sh, hand-merge.sh) before its commit;
# the gate reads the tree as committed, so a stale artifact is specimens.test.ts's red, never hidden by a rerun here.
if [ "$SCOPE" = light ]; then run test "pnpm test" 15 pnpm -s vitest run
else
  run lint "pnpm lint" 40 pnpm lint
  run test "pnpm test" 15 pnpm -s vitest run
  # production builds take turns across every lane on the machine (dev servers and tests stay parallel)
  # A tree merge-lane.sh typechecked green skips the build's second type pass (next.config.ts reads GATE_TYPECHECKED);
  # any other tree, a record committed before the gate included, keeps it.
  if [ -f "$S/typechecked-$(git rev-parse 'HEAD^{tree}')" ]; then run build "pnpm build" 12 env GATE_TYPECHECKED=1 zsh scripts/build-lock.sh pnpm build
  else run build "pnpm build" 12 zsh scripts/build-lock.sh pnpm build; fi
  grep -q '^build-lock: waiting' "$S/gate$N-build.log" && echo "(the build's seconds include a wait for the build lock)"
  grep -hE 'Compiled successfully in|Finished TypeScript in' "$S/gate$N-build.log" | sed -E 's/^[^A-Za-z]*/build: /'
  case "$LABS" in
    "") echo "LAB off: the lane brings nothing the lab renders" ;;
    "("*) echo "LAB on: $LABS" ;;
    *) echo "LAB on: the lane brings what the lab renders, $(first "$LABS")" ;;
  esac
  if [ -n "$LABS" ]; then
    lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null; sleep 1
    (pnpm dev -p $PORT >"$S/dev$PORT.log" 2>&1 &)
    for i in $(seq 1 60); do curl -s -o /dev/null -w '%{http_code}' http://localhost:$PORT/ 2>/dev/null | grep -q '^[23]' && break; sleep 2; done
    echo "dev ready after ${i}x2s"
    for j in $(seq 1 120); do curl -s -o /dev/null -w '%{http_code}' "http://localhost:$PORT/design/library?key=$DESIGN_PREVIEW_KEY" 2>/dev/null | grep -q '^200' && break; sleep 2; done
    echo "lab ready after ${j}x2s"
    run smoke "lab:smoke" 8 pnpm -s lab:smoke --base http://localhost:$PORT
    # lab:demo presses the open steps of one board (lab-demo.mjs filters the desk's steps by `<board>.`), so a lane
    # without a board has none to press.
    if [ "$BOARD" = none ]; then echo "lab:demo: no board, so no step of this lane's to press"
    else
      # a cold frame compile under load stalls CDP past its 60 s (gate 62, 2026-09-20: two TIMED OUT steps, green on the
      # warm re-run): one retry on the warm server; both logs kept; the exit is the last attempt's.
      t=$SECONDS; DEMO=1
      for a in 1 2; do
        perl -e 'alarm 420; exec @ARGV' pnpm -s lab:demo --board "$BOARD" --base http://localhost:$PORT > "$S/gate$N-demo-$a.log" 2>&1; DEMO=$?
        tail -14 "$S/gate$N-demo-$a.log"; [ "$DEMO" = 0 ] && break; echo "lab:demo attempt $a red; retrying warm"
      done
      cp "$S/gate$N-demo-$a.log" "$S/gate$N-demo.log"
      # The harness's sight, read from this run (the toasts finding, 2026-09-20: a blind run reads every step FROZEN):
      # a step that moved proves the harness sees, so a FROZEN beside it is the board's. A fixed step pressed first
      # cannot say so for long: seed-avatar.look read "skip" once its board closed, and HARNESS BLIND at every gate after.
      MOVED=$(grep -cE '^[a-z0-9-]+\.[^ ]+ +ok ' "$S/gate$N-demo.log"); FROZE=$(grep -cE '^[a-z0-9-]+\.[^ ]+ +FROZEN ' "$S/gate$N-demo.log")
      if [ "$MOVED" -gt 0 ]; then echo "HARNESS sees: $MOVED step(s) moved in this run, so a FROZEN step here is the board's"
      elif [ "$FROZE" -gt 0 ]; then echo "HARNESS unproven: no step moved in this run; read $S/gate$N-demo.log per step before calling a FROZEN the board's"; fi
      echo "EXIT[lab:demo $BOARD]=$DEMO ($(( SECONDS - t ))s)"; [ "$DEMO" = 0 ] || RED=$(( RED + 1 ))
    fi
    lsof -ti tcp:$PORT | xargs -r kill 2>/dev/null
  fi
fi
echo "GATE$N DONE $(date -u) (${SECONDS}s) red steps: $RED"
