# Tracks: the claims, handoffs and records of every parallel branch

> ROLE: the per-track ledger of the elevation program. One file per `lp/<track>` branch: what it
> claims, what it will not touch, how it is verified, its handoff, and the record the Orchestrator
> folds into the CHANGELOG. Read this directory to see what every open track is working on.
> BELONGS HERE: one manifest per track (`<track>.md`), plus `orchestrator.md` for the integration
> branch's own work. · NOT HERE: the program's rules (→ [`../PROGRAM.md`](../PROGRAM.md)), shipped
> history (→ [`../CHANGELOG.md`](../CHANGELOG.md)), what is next (→ [`../ROADMAP.md`](../ROADMAP.md)).
> GROWS BY: a stub per spawned track; the agent fills it; the Orchestrator flips it to `integrated`
> at the merge and deletes it at the milestone that ships it (git history keeps it, like the
> `decisions/t1-*` tombstones).

## Why this exists

On 2026-09-02 three agent tracks integrated in one evening with 11 merge conflicts, 7 of them in
the shared docs, plus one duplicated single-source that no test could see. Agents had no way to see
each other: the only coordination was a branch name, and the handoff report was a chat message that
never entered the repo. This directory is that missing artifact. A manifest makes a track's lane
visible before its first push, keeps the shared docs out of every branch, and turns the handoff into
something a later session can read.

## The lifecycle

`open` → `handed-off` → `integrated` → deleted at the milestone that ships it.

- **open**: the Orchestrator commits a stub on `launch-prep` when it spawns a track (the agent adopts
  it), or the agent creates one at boot from the template below. Either way it is committed ALONE
  and pushed before any other work.
- **handed-off**: the agent has filled Handoff and Record, run the pre-handoff sync and the lane
  check, set `status: handed-off`, and pushed. The chat report is one line.
- **integrated**: flipped by the Orchestrator inside the merge commit, with `merged: "<sha>"`.

## Claims are path prefixes

`owns` lists repo-relative path PREFIXES (directories end in `/`), never globs. Everything outside a
track's prefixes is forbidden to it. Nobody may claim `docs/CHANGELOG.md`, `docs/STATUS.md`,
`docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `AGENTS.md`, `src/lib/db/types.ts` or this
directory: those are the Orchestrator's. `src/lib/track-manifests.test.ts` fails `pnpm test` when
two non-integrated tracks overlap or a manifest is malformed.

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
| `docs/tracks/<track>.md` | fill it (their own) | stub it, flip it, delete it |
| `docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `PROGRAM.md`, `CLAUDE.md` | never | folds each manifest's Record and Deferred at integration |
| `docs/systems/*.md` | in place, only for a fact inside their owned paths, listed in the manifest | reads every listed edit by eye at the merge |
| `content/<x>/AUTHORING.md` | whoever owns `content/<x>/` | promotes shared vocabulary to `src/components/marketing/mdx/spec-shared.tsx` |
| `src/components/marketing/mdx/spec-shared.tsx` | never (read it) | grows it by promotion |
| `src/lib/env.ts`, migrations, Workers, Vercel / Stripe / Supabase config | propose in Handoff | applies |

## The template

Copy everything below into `docs/tracks/<track>.md` and fill it in.

```md
---
track: <track>
status: open            # open -> handed-off -> integrated (deleted at the milestone that ships it)
cut: "<sha>"            # the launch-prep SHA the branch was cut from
preview: false          # true = every push builds partyreel-git-lp-<track>; flip for Will's eyes
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/some/dir/
  - src/some/file.ts
reads:                  # shared single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
---

# lp/<track>

**Goal.** One paragraph, from the init.
**Rulings in force.** Will's rulings this track works under (or "none").
**Verify on.** The pages or flows the handoff is judged on, local and the branch preview.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; preview partyreel-git-lp-<track>-partyreel.vercel.app
- Synced with launch-prep at <sha> (or: launch-prep had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (the CHANGELOG paragraph, past tense, at most 12 lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
```

## Spawning a track from a stub

When the Orchestrator has committed a stub, the manifest IS the init. The whole prompt for the new
session:

> You are an AGENT on Partyreel's elevation program. Track `<track>`: your manifest is committed at
> `docs/tracks/<track>.md` and is your whole init (goal, rulings, owned paths, verification). Boot per
> `docs/PROGRAM.md` "Agent boot", build, then hand off by filling the manifest's Handoff and Record,
> setting `status: handed-off`, and pushing. The chat report is one line: "handed off at <sha>".

## The queue (not yet cut; no manifest until their wave opens)

The wave plan is in [`../STATUS.md`](../STATUS.md). These tracks cannot be stubbed yet because their
claims overlap a live track; they open when it integrates.

| track | after | owns (prefixes) | rulings up front |
| --- | --- | --- | --- |
| `marketing-followons` | `lp/marketing-feature-pages` integrates and `legal-billing-truth` lands | `src/app/(marketing)/`, `src/components/marketing/` (except `system/page-hero.tsx` beyond the trio ruling), `src/app/(marketing)/marketing.css`, `src/lib/constants/contact.ts`, `src/app/not-found.tsx` | the blur-rise trio becomes a NAMED third `entrance` register with the h1 visible at paint; the visibility word "Public" on `access-switch.tsx`; Report on `privacy-faq.ts`; the EXIF clause on `never-rides-along.tsx` and `feature-pages.ts`; `/contact` onto cinema with no identity revisit; one reply line; the root 404 tint |
| `glow-engine-defects` | the library round (shipped) and `legal-billing-truth` | `src/components/shared/glow.tsx`, `src/lib/shared/use-in-view-once.ts`, `src/lib/shared/sampled-palette.ts`, `src/components/dev/glow-contrast.ts`, the engine block of `src/app/globals.css` (by ruling) | none; no placements (those are Will-paced rounds): the unarmed bloom band rests, `useInViewOnce` gains a viewport-relative arming option (default unchanged), the sampler loads `previewUrl` through `decodeImage`, `effectiveAlpha` models base + band, the compiled-away `@supports not` settled, every `BorderBeam` wrapper pins `theme` |
| `marketing-mobile` | `marketing-followons` | all of `src/app/(marketing)/`, `src/components/marketing/`, `marketing.css`, alone in its wave | none up front, many during; judged on Will's phone, reduced motion and a classic scrollbar included; gating for launch |

## Previews

The build gate (`scripts/vercel-ignore-build.mjs`) builds an `lp/<track>` push when the branch has
no manifest yet, when its manifest says `preview: true` or `status: handed-off`, or when the commit
message carries `[preview]`. A manifest with `preview: false` and `status: open` skips the build, so
the integration preview never queues behind work in progress on the one-at-a-time Hobby plan.
