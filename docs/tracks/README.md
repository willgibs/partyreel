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
- **integrated**: flipped by the Orchestrator inside the merge commit, with `merged: "<sha>"` (the
  branch head that was merged; the merge commit itself is cited in the CHANGELOG).

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
> `docs/tracks/<track>.md` and is your whole init (goal, rulings, owned paths, verification). Design law
> is the bible on `/design/rules` and the component contracts on `/design`; everything else is
> precedent: take the big swing, in the lab first. Boot per
> `docs/PROGRAM.md` "Agent boot", build, then hand off by filling the manifest's Handoff and Record,
> setting `status: handed-off`, and pushing. The chat report is one line: "handed off at <sha>".

## The queue (not yet cut; no manifest until their wave opens)

The library phase closed with the "less is more" reset (2026-09-12: the bible, contracts on the
components, the look-pins gone). The first two rows cut together at the reset's close (Will,
2026-09-12: the gallery and the home hero in parallel); the rest follow the wave plan in
[`../STATUS.md`](../STATUS.md). The rounding and tweaking GUI round (Orchestrator-run) opens after
`design-gallery` integrates, then the light rulings.

| track | after | owns (prefixes) | reads (never claim) | rulings up front |
| --- | --- | --- | --- | --- |
| `design-gallery` | now, with `home-hero` (Will, 2026-09-12) | `src/app/(dev)/design/{page.tsx,layout.tsx,catalog.ts,lab-nav.tsx,mode-shell.tsx,theme-toggle.tsx,design.css}`, `src/app/(dev)/design/{components,compositions,patterns,foundations,marketing,reference}/` | `src/app/(dev)/design/rules/` (the bible and the artifact; add a contract by tagging its test), `touchpoints.ts` and `sandbox/` (`home-hero`'s), `src/components/dev/` (the tuner; the rounding round's), every production component the library renders | the library as the agents' reference, so the bible stays short: a per-component page or permalink with its specimen, its variants and its contracts; a declared variants model per component (CVA where it exists); one reusable config panel beside a specimen (the board-local sliders in `glow-doctrine-variants.tsx` and `reel-parity/parity.tsx` are the precedent); the five family pages become the organized gallery; notes for all 84, not 11; `component-index.test.ts` keeps every file rendered or excused |
| `marketing-followons` | the library phase | `src/app/(marketing)/` except `(cinema)/features/`, `src/components/marketing/` except `sections/features/` and `system/page-hero.tsx`, `src/app/(marketing)/marketing.css`, `src/lib/constants/contact.ts`, `src/app/not-found.tsx` | `src/lib/constants/feature-pages.ts`, `system/page-hero.tsx` | `/contact` onto cinema with no identity revisit (the `(paper)` group retires with it); the root 404 tint; whatever single-source homes the library phase leaves it to re-point |
| `features-qr`, `features-curation`, `features-sharing`, `features-guests`, `features-privacy` (one track each, nav order, two to three at a time) | `marketing-followons` | `src/app/(marketing)/(cinema)/features/<page>/`, `src/components/marketing/sections/features/<page>/` | `src/lib/constants/feature-pages.ts` (propose the page's new strings in Handoff), `sections/features/shared/`, `system/`, `frames/`, `mock-parity.test.ts` (append under a `// <page>` comment) | the album is the model, section for section; the brief per page is in git: `git show 0f52503:docs/tracks/marketing-feature-pages.md` ("For the per-page tracks that follow"); the corrections that must hold (Require accounts defaults ON; Anonymous is anonymous; a guest deletes their own upload; a private page shows no name and no count; no big-screen mode; nothing locked at lapse; EXIF "for the common formats"); `features-privacy` also: "Public" on `access-switch.tsx`, Report on `privacy-faq.ts`, the EXIF clause on `never-rides-along.tsx` |
| `marketing-mobile` | the five page tracks | all of `src/app/(marketing)/`, `src/components/marketing/`, `marketing.css`, alone in its wave | | none up front, many during; judged on Will's phone, reduced motion and a classic scrollbar included; gating for launch |
| `home-hero` | now, with `design-gallery`; its own focus round (Will, 2026-09-11 and 2026-09-12) | `src/components/marketing/sections/home/cinema-hero.tsx`, its boards under `src/app/(dev)/design/sandbox/`, and the two registration lines a board needs in `touchpoints.ts` and `c/[touchpoint]/page.tsx` (ruled exception) | `src/components/marketing/system/`, `src/app/globals.css`, the bible on `/design/rules` | a design problem, not a lighting one: boards in the lab first, Will's rulings, then the wiring; the hero stays UNLIT by ruling meanwhile (the wall is the ground, not a source) |
| `design-lab-subdomain` | the library phase (Will, 2026-09-11) | a second Vercel project on the same repo, `src/app/(dev)/design/` and the build wiring | `src/lib/design-gate/`, `src/components/dev/`, every production component the library renders | one repo so agents keep learning from production source; the lab leaves the product's build; the gate and `/api/design-gate` stay where they are (production depends on them); architecture, not a saving (2.5 MB marginal, measured) |
| `admin-subdomain` | `design-lab-subdomain` (Will, 2026-09-11) | `src/app/admin/`, `src/lib/admin/`, `src/components/admin/`, the host gate | `src/lib/db/`, `src/lib/supabase/` | closed to regular users, fully open to the Orchestrator and agents; `admin.partyreel.com` already exists as a project domain and the portal is already host-gated, so this is about a separately deployable surface; architecture, not a saving (1.5 MB marginal, measured) |

## Previews

The build gate (`scripts/vercel-ignore-build.mjs`) builds an `lp/<track>` push when the branch has
no manifest yet, when its manifest says `preview: true` or `status: handed-off`, or when the commit
message carries `[preview]`. A manifest with `preview: false` and `status: open` skips the build, so
the integration preview never queues behind work in progress on the one-at-a-time Hobby plan.

`main` always builds. `launch-prep` builds ON REQUEST since 2026-09-11: say `[preview]` in the
commit message of the push whose alias you mean to walk. Building it on every push was most of a
Vercel storage overage, and CI runs the four-step gate on every push either way.
