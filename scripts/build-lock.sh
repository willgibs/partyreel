#!/bin/zsh
# build-lock.sh <command...>: runs a production build (or any heavy command) one at a time across every lane on this
# machine. Parallel builds are what strain it; dev servers and tests stay parallel. The lock is a directory (mkdir is
# atomic); a lock whose holder has died is broken so a killed lane never blocks the rest.
LOCK="${BUILD_LOCK:-/tmp/partyreel-build.lock}"
waited=0
while ! mkdir "$LOCK" 2>/dev/null; do
  holder=$(cat "$LOCK/pid" 2>/dev/null)
  if [[ -n "$holder" ]] && ! kill -0 "$holder" 2>/dev/null; then rm -rf "$LOCK"; continue; fi
  (( waited == 0 )) && echo "build-lock: waiting for the build held by pid ${holder:-?}"
  waited=1; sleep 5
done
echo $$ > "$LOCK/pid"
trap 'rm -rf "$LOCK"' EXIT INT TERM
"$@"
