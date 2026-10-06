# kit-env.sh: sourced by the kit's zsh scripts (from the repo root) so they run alike on Will's Mac and a cloud seat.
# - nvm only where it exists: a cloud container has none, and a bare `source ~/.nvm/nvm.sh` under `set -e` killed every
#   merge there before it started (the cloud seat's first day, 2026-10-06; negative.sh holds it). KIT_NODE pins a version.
# - kit_env NAME: the value from this checkout's .env.local when the file holds it, else the process environment (a
#   cloud seat holds the app's variables there). Never printed by the kit.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true
  nvm use ${KIT_NODE:-} >/dev/null 2>&1 || true
fi
kit_env() {
  local v=""
  [ -f .env.local ] && v="$(grep "^$1=" .env.local | tail -1 | cut -d= -f2- | tr -d "\"'")"
  print -r -- "${v:-${(P)1:-}}"
}
# kit_port_pids PORT: what listens on a port. lsof's, and fuser's where lsof sees no socket (a cloud container, where a
# kill by `lsof -ti tcp:` freed nothing and a stale server kept the port, 2026-10-06); fuser answers nothing on the Mac.
kit_port_pids() { { lsof -ti tcp:$1 -sTCP:LISTEN 2>/dev/null; fuser $1/tcp 2>/dev/null; } | tr -s ' \t' '\n' | grep -E '^[0-9]+$' | sort -u; }
# kit_free_port PORT: stops whatever kit_port_pids names (beside the scripts' own lsof kill, which the Mac answers).
kit_free_port() { local p; p=($(kit_port_pids $1)); [ ${#p} -gt 0 ] && kill $p 2>/dev/null; true; }
