#!/bin/zsh
# scope.sh code|lab: prints the paths on stdin (one per line, as `git diff --no-renames --name-only` prints them) that
# need the check named; nothing printed means the check has nothing to add. merge-lane.sh and gate-lane.sh pipe the
# integration's diffs through it, and negative.sh feeds it paths it must never let through.
#   code: the paths some gate step other than `pnpm test` reads: lint, the typecheck, the build or the lab's render.
#     Everything else is the docs class, which `pnpm test` alone covers: `docs/` (the lab reads its manifests, specs and
#     ledgers at request time, and docs.test.ts, tracks.test.ts, ledger.test.ts and track-manifests.test.ts parse every
#     one; a code file there would be linted and typechecked, so it stays code), `usher/` and `kit/` (outside tsconfig,
#     eslint, the build and the lab), and markdown anywhere but `content/` (the blog and help the build renders) and
#     `src/`.
#   lab: the paths the lab could render: everything but the docs class, tests, `supabase/` and `workers/` (nothing
#     under `src/` imports either).
# A path this does not know is code and the lab's, so a new directory widens the gate until it is classed here. A
# path git quotes (an unusual character) matches no class and is printed, which also widens it.
set -u
case "${1:-}" in code|lab) ;; *) print -u2 "usage: scope.sh code|lab < paths"; exit 2 ;; esac
docs() {
  case "$1" in
    docs/*.(ts|tsx|js|jsx|mjs|cjs|mts|cts|css)) return 1 ;;
    docs/*|usher/*|kit/*) return 0 ;;
    content/*|src/*) return 1 ;;
    *.md) return 0 ;;
  esac
  return 1
}
while IFS= read -r p; do
  [ -n "$p" ] || continue
  docs "$p" && continue
  if [ "$1" = lab ]; then case "$p" in *.test.ts|*.test.tsx|supabase/*|workers/*) continue ;; esac; fi
  print -r -- "$p"
done
exit 0
