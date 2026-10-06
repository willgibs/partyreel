#!/bin/zsh
# usage: S=<scratchpad> desk-refresh.sh <sha>: Will's local desk (`http://localhost:3000/design/lab?key=`) at a
# launch-prep sha. Checks out the desk's detached worktree (`../partyreel-wt/desk`, found through `git worktree list`),
# installs, stops whatever listens on :3000, builds with the localhost site URL through the build lock (so Google's
# chooser returns to the desk and sign-in works there), starts `pnpm start -p 3000` detached, and checks that the lab's
# `sentry-release` names the sha. About a minute plus the build. Its install and build logs go to $S; the server's own
# log, which outlives the session, to `../partyreel-wt/desk-server.log`. The desk's `.env.local` is a symlink to the
# primary checkout's, so Will's env lands there too. Local only: a cloud session cannot reach the desk.
set -u
SHA="${1:?usage: desk-refresh.sh <sha>}"
: "${S:?set S to this session's scratchpad (every kit script writes its logs there)}"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
DESK="${DESK:-$(git -C "$ROOT" worktree list --porcelain | awk '/^worktree .*\/desk$/ { print $2; exit }')}"
[[ -n "$DESK" && -d "$DESK" ]] || { echo "NO DESK WORKTREE (git worktree list has no .../desk)"; exit 1; }
LOG="$DESK/../desk-server.log"
KEY="$(cd "$ROOT" && source usher/kit/kit-env.sh && kit_env DESIGN_PREVIEW_KEY)"
cd "$DESK" || exit 1
echo "[$(date -u +%H:%M:%SZ)] fetch + checkout $SHA in $DESK"
git fetch origin --quiet && git checkout --quiet --detach "$SHA" || { echo "CHECKOUT FAILED"; exit 1; }
echo "[$(date -u +%H:%M:%SZ)] install"
source "$ROOT/usher/kit/kit-env.sh"
pnpm install --frozen-lockfile --prefer-offline > "$S/desk-install.log" 2>&1 || { echo "INSTALL FAILED ($S/desk-install.log)"; exit 1; }
echo "[$(date -u +%H:%M:%SZ)] stopping port 3000"
# The server and the pnpm that started it: kill both, by the port, never by a process name (other lanes run next too).
for pid in $(lsof -ti tcp:3000 -sTCP:LISTEN); do
  ppid=$(ps -o ppid= -p $pid | tr -d ' ')
  kill $pid; [[ -n "$ppid" && "$ppid" != "1" ]] && kill $ppid 2>/dev/null
done
for i in {1..20}; do lsof -ti tcp:3000 -sTCP:LISTEN >/dev/null || break; sleep 0.5; done
echo "[$(date -u +%H:%M:%SZ)] build"
rm -rf .next
NEXT_PUBLIC_SITE_URL=http://localhost:3000 zsh scripts/build-lock.sh pnpm build > "$S/desk-build.log" 2>&1
rc=$?
echo "[$(date -u +%H:%M:%SZ)] build exit $rc"
[[ $rc -eq 0 ]] || { echo "BUILD FAILED ($S/desk-build.log)"; exit 1; }
echo "[$(date -u +%H:%M:%SZ)] start"
nohup pnpm start -p 3000 >> "$LOG" 2>&1 < /dev/null &
disown
for i in {1..60}; do curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/ 2>/dev/null | grep -q 200 && break; sleep 1; done
code=$(curl -s -o "$S/desk-lab.html" -w '%{http_code}' "http://localhost:3000/design/lab?key=$KEY")
stamp=$(grep -o 'sentry-release=[0-9a-f]*' "$S/desk-lab.html" | head -1 | sed 's/sentry-release=//')
echo "[$(date -u +%H:%M:%SZ)] DESK READY lab=$code release=${stamp:0:12} expected=$SHA"
[[ "$code" == 200 && "$stamp" == "$SHA"* ]] || { echo "DESK STAMP MISMATCH"; exit 1; }
