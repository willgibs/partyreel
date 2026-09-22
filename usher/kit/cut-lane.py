#!/usr/bin/env python3
"""cut-lane.py <cut-sha> <spec.json> [<spec.json> ...]: writes docs/tracks/<track>.md for each lane spec.

A spec is one JSON object: {"track", "board" ("none" for a production or docs lane), "owns": [prefixes],
"reads": [paths], "goal": "<one paragraph>", "brief": "<markdown: everything the lane needs>", "verify": "<optional>"}.
Specs live in the scratchpad and die with the round; nothing accumulates here. The manifest is the lane's whole init:
a lane never reads the Orchestrator's plan. Run `pnpm vitest run src/lib/track-manifests.test.ts` and
`zsh usher/kit/negative.sh` after cutting, then commit the manifests alone.
"""
import json, pathlib, sys

if len(sys.argv) < 3:
    sys.exit(__doc__)
cut = sys.argv[1][:8]
LAB_VERIFY = ("The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; "
              "`pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.")
PROD_VERIFY = ("The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, "
               "`node \"src/app/(dev)/design/gallery/collect-specimens.mjs\"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, "
               "`pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at "
               "1440 and 375.")

for arg in sys.argv[2:]:
    s = json.loads(pathlib.Path(arg).read_text())
    track, board = s["track"], s.get("board", "none")
    owns = "\n".join(f"  - {p}" for p in s["owns"])
    reads = "\n".join(f"  - {p}" for p in s.get("reads", [])) or "  - CLAUDE.md"
    verify = s.get("verify") or (LAB_VERIFY if board != "none" else PROD_VERIFY)
    doc = f"""---
track: {track}
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "{cut}"            # the launch-prep SHA the branch was cut from
board: {board}
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
{owns}
reads:                  # single-sources you depend on: never duplicate, never edit
{reads}
---

# lp/{track}

**Goal.** {s["goal"].strip()}

## The brief

{s["brief"].strip()}

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** {verify}

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
"""
    out = pathlib.Path("docs/tracks") / f"{track}.md"
    out.write_text(doc)
    print(f"{track}: {len(s['owns'])} owns, {len(s.get('reads', []))} reads, {doc.count(chr(10))} lines -> {out}")
