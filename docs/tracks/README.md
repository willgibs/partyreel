# Tracks: the lane, the init and the handoff of every open branch

> ROLE: one manifest per open `lp/<track>` branch: its lane, its brief, its questions, its handoff
> and the record the Orchestrator folds into the CHANGELOG. Read this directory to see what every
> open track is doing. BELONGS HERE: `<track>.md` per open or handed-off track, and
> `orchestrator.md` for the integration branch's own work. · NOT HERE: the program's rules (→
> [`../PROGRAM.md`](../PROGRAM.md)), what shipped (→ [`../CHANGELOG.md`](../CHANGELOG.md)), what is
> next (→ [`../ROADMAP.md`](../ROADMAP.md)). LIFECYCLE: a manifest is cut with its track and deleted
> in the merge commit that integrates it; git keeps it (`git show <merge sha>^:docs/tracks/<track>.md`).

## The lifecycle

`open` → `handed-off` → deleted at the merge. **open**: the Orchestrator commits the stub on
`launch-prep` when it cuts the track (the agent adopts it), or the agent writes one at boot from the
template; committed alone and pushed before any other work. **handed-off**: Handoff and Record
filled, the pre-handoff sync and the lane check done, `status: handed-off`, pushed; the chat report
is one line. A second round of the same work is a fresh manifest cut from Will's notes on the first,
never without them.

## Claims are path prefixes

`owns` lists repo-relative path PREFIXES (directories end in `/`), never globs; everything outside a
track's prefixes is forbidden to it. Nobody claims `docs/CHANGELOG.md`, `docs/STATUS.md`,
`docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `AGENTS.md`, `src/lib/db/types.ts`,
`docs/ASSETS.md`, `docs/design/rulings.md`, `docs/reviews/` or this directory: those are the
Orchestrator's. `src/lib/track-manifests.test.ts` fails `pnpm test` when two live tracks overlap or
a manifest is malformed.

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

Lane check, pasted into Handoff (every line must sit under an `owns` prefix, be this manifest, or be
a `docs/systems/` file listed under System-doc edits):

```bash
git diff --name-only origin/launch-prep...HEAD
```

## Who edits what

| file | agents | the Orchestrator |
| --- | --- | --- |
| `docs/tracks/<track>.md` | fill it (their own) | stub it, flip it, delete it at the merge |
| `docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `PROGRAM.md`, `CLAUDE.md` | never | folds each manifest's Record and Deferred at integration |
| `docs/systems/*.md` | in place, only for a fact inside their owned paths, listed in the manifest | reads every listed edit by eye at the merge |
| `content/<x>/AUTHORING.md` | whoever owns `content/<x>/` | promotes shared vocabulary to `src/components/marketing/mdx/spec-shared.tsx` |
| `src/components/marketing/mdx/spec-shared.tsx` | never (read it) | grows it by promotion |
| `src/lib/env.ts`, migrations, Workers, Vercel / Stripe / Supabase config | propose in Handoff | applies |
| `docs/ASSETS.md` (the asset log) | never (ask in Handoff, one bullet per asset) | folds each ask into a row at integration; Will marks a row delivered; the wiring round marks it wired |
| `docs/design/rulings.md` (Will's rulings, verbatim and dated) | never (read it; rendered at `/design/library/rulings`) | appends a section from a review message or from chat, with what it became |
| `docs/reviews/` (the ledgers and the grammar) | never (a board's review panel composes a message; the UI never writes; a grammar change goes in Handoff verbatim) | transcribes Will's pasted line with `pnpm lab:review`; lands a grammar change at the merge |

## The template

Copy everything below into `docs/tracks/<track>.md` and fill it in.

```md
---
track: <track>
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "<sha>"            # the launch-prep SHA the branch was cut from
board: <board id>       # the board this track returns (none for a production sweep)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/some/dir/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
---

# lp/<track>

**Goal.** One paragraph: what comes back (a catalog of how many ideas, on which board, on which real
pages), and what is not in this round.
**Binds.** The bible, the contracts of every component under a path you own, and the policies;
everything else is precedent (`docs/design/README.md#what-binds-you`). Will's notes on the last
round, quoted from `docs/reviews/<board>.json`, and the rulings this track works under
(`docs/design/rulings.md`).
**Verify on.** For a catalog: the board at 1440 and 375 with reduced motion honoured, every item's
verdict and note reaching the desk and the composed line, the board under its reading budget
(`pnpm lab:smoke`), every step's options changing its stage (`pnpm lab:demo --board <board>`). For a
wiring round: the pages or flows the handoff is judged on, local and live.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board <board>` ok (a board)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
```

## Spawning a track from a stub

The manifest is the init. The whole prompt for the new session:

> You are an AGENT on Partyreel's elevation program. Track `<track>`: your manifest is committed at
> `docs/tracks/<track>.md` and is your whole init (goal, what binds, owned paths, verification,
> Will's notes on the last round). Return a catalog, not a paper: each item a polished variant with a
> live preview on a production ground and a one-line label, built so Will reacts to each item on its
> own; you choose the presentation and the count, and where the question is not a set of things (a
> voice, a scale) you build the comparison the question needs on real pages; asks only for what is
> not one item; the argument collapsed; the smoke refuses a board over its reading budget. Read his
> notes on the last round first. Anything the goal leaves open goes under the manifest's Questions
> with your recommended answer, and you carry on with the recommendation. Design law is the bible on
> `/design/library/rules` and the component contracts on `/design/library`; everything else is
> precedent: rising tides (bible 22), from the ground up, in the lab first. Boot per
> `docs/PROGRAM.md` "Agent boot", build, then hand off by filling the manifest's Handoff and Record,
> setting `status: handed-off`, and pushing. The chat report is one line: "handed off at <sha>".

## Previews and CI

An `lp/<track>` push builds a preview only when its commit message carries `[preview]`, and only the
Orchestrator adds it; a round's review surface is the launch-prep alias, built once at the round
close; the Orchestrator prunes deployments (`scripts/prune-vercel-deployments.mjs`) after every
integration. CI is not the gate, the four local steps are: `ci.yml` runs on `main` and `launch-prep`
pushes that touch code (record commits say `[skip ci]`) and on PRs to `main`; an `lp/*` push runs it
only on `[ci]`.
