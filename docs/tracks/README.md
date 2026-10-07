# Tracks: the lane, the init and the handoff of every open branch

> ROLE: one manifest per open `lp/<track>` branch: its lane, its brief, its questions and its handoff. Read this
> directory to see what every open lane is doing. BELONGS HERE: `<track>.md` per open or handed-off lane, and
> `orchestrator.md` (the Orchestrator's pickup: in flight, next, waiting on Will). NOT HERE: the program (→
> [`../PROGRAM.md`](../PROGRAM.md)), what shipped (→ `git log`: each merge commit carries its lane's summary), what
> is next (→ [`../ROADMAP.md`](../ROADMAP.md)). LIFECYCLE: a manifest is cut with its lane and deleted in the merge
> commit that integrates it.

## The lifecycle

`open` → `handed-off` → deleted at the merge. The Orchestrator cuts a manifest on `launch-prep` from a spec
(`usher/kit/cut-lane.py`), or an agent from a bare goal writes one from the template below. A lane adopts and hands
off its manifest by [`../PROGRAM.md`](../PROGRAM.md)'s "Agent boot", started by a prompt from its
"Starting a session". A second round of the same work is a fresh manifest cut from Will's notes on the first, never
without them.

## Claims are path prefixes

`owns` lists repo-relative path prefixes (directories end in `/`), never globs; everything outside a lane's prefixes
is forbidden to it. No lane claims the Orchestrator's records (`NEVER_OWNED` in `src/lib/track-manifests.test.ts`):
one is released to a lane only when the lane's whole job is that doc, and returns at its merge. That test fails
`pnpm test` when two live lanes overlap, a lane claims a record, or a manifest is malformed.

## The commands every agent runs

Peer sweep (what every live branch claims, with or without an Orchestrator):

```bash
for b in $(git branch -r --list 'origin/lp/*'); do echo "== $b"; git show "$b:docs/tracks/${b#origin/lp/}.md" 2>/dev/null | sed -n '1,14p'; done
```

Single-source lookup, before creating any exported constant or spec component:

```bash
git grep -n '<NAME>' HEAD $(git branch -r --list 'origin/lp/*') -- src/lib src/components/marketing/mdx
```

If it exists anywhere, import it or wait for it; never create a second home.

Lane check, pasted into the Handoff (every line must sit under an `owns` prefix, be this manifest, or be a
`docs/systems/` file listed under System-doc edits):

```bash
git diff --name-only origin/launch-prep...HEAD
```

## The template

What `usher/kit/cut-lane.py` writes; an agent from a bare goal copies it into `docs/tracks/<track>.md` and fills it.

```md
---
track: <track>
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "<sha>"            # the launch-prep SHA the branch was cut from
board: <board id>       # the board this lane returns (none for a production or docs lane)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/some/dir/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
---

# lp/<track>

**Goal.** One paragraph: what comes back (how many decisions, on which board, over which real pages), and what is not
in this lane.

## The brief

Everything the lane cannot find itself: the task's intent, synthesized (Will's exact words only where the wording is
the point), the calls already made, what to read, and a new board's place on the desk.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** For a board: 1440 and 375 with reduced motion honoured, `pnpm lab:smoke` on what the change reaches,
`pnpm lab:demo --board <board>` pressing every step. For a production lane: the gate on the synced tree,
`pnpm lab:smoke` when it changes anything under `src/` but tests, and the surfaces the Handoff is judged on, local and
live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
```
