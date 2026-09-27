---
track: crumbs-3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "19bd4c39"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/lab/dock.tsx
  - src/components/lab/traps.ts
  - src/components/guest/door/album-light
  - src/lib/guest/door-light
  - src/lib/shared/sampled-palette
  - src/components/marketing/sections/reel/ambient-reel-video.tsx
  - src/components/marketing/sections/shared/reel-player.tsx
  - src/components/marketing/sections/home/reel-teaser.tsx
  - src/components/guest/upload/intent-sheet.tsx
  - src/components/app/share/
  - src/components/guest/guest-share.tsx
  - content/help/find-your-uploads-and-events.mdx
  - content/help/how-guests-join-and-upload.mdx
  - .prettierignore
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
  - docs/ROADMAP.md
---

# lp/crumbs-3

**Goal.** Seven small leftovers from batch 4 and build 11's red-team, none a design decision: the lab dock's prefetch 404s, the door lamp's sampler walking past colourless previews, the teaser's loop paused under the open player, two copy nits, two help pages told the keep and the told name, two lab trap lines, and one prettier ignore.

## The brief

Each is small and independent; build each as a working version, and list anything that turned out to be a real choice as his to overrule.

1. **The lab dock's links 404 on prefetch** (build 11's red-team): `src/components/lab/dock.tsx` (about :185-204), Prev, Next and Desk are plain `next/link` with viewport prefetch; the prefetch drops `?key=`, so the design gate 404s it, 2-3 console errors per board load. `LabLink` sets `prefetch={false}` for exactly this reason: use it (or the same prop).

2. **The door's lamp falls back to the house five when the album's newest previews are colourless** (build 11's red-team: the 15-photo probe's three newest items are grey clip posters; 3,072 sampled pixels, none with colour, so the sampler returned nothing). Let it look past colourless previews to the newest that carry colour (a small bounded window, e.g. the dozen newest previews), and fall back to the house five only when none does (`src/components/guest/door/album-light.tsx`, `src/lib/guest/door-light.ts`, `src/lib/shared/sampled-palette.ts`). Still previews only, never an original. A call his to overrule: how far back it looks.

3. **The home teaser's muted loop keeps decoding under the open player** (ROADMAP, Marketing, from `reel-marketing`): `AmbientReelVideo` (`sections/reel/ambient-reel-video.tsx`) takes a `paused` prop that `ReelPlayScreen` (`sections/shared/reel-player.tsx`) sets while its player is up, and the loop resumes on close.

4. **Two copy nits** (ROADMAP, Shared, from `popups`): the Add photos sheet writes "{host}'s album" with a straight apostrophe (`guest/upload/intent-sheet.tsx:220`) where the failure sheet curls it: curl it. The host's native share text says "and" where the guest's says "&" (the host's share in `src/components/app/share/`, the guest's `guest-share.tsx`): make the two agree on the house style and say which.

5. **Two help pages told the door's keep and the told name** (ROADMAP, Help, from `guest-door`): `content/help/find-your-uploads-and-events.mdx` and `how-guests-join-and-upload.mdx` still call the keep a card under the first upload; it is the door's last screen after her first file lands (Maybe later puts it down for that event on that device), and a name typed at the door becomes the account's ("You're on as ...", with a Change). `guest-flow.md` is the truth. Leave `a-photo-is-missing-from-the-album` alone (it follows `host-curation`'s open `told`).

6. **Two lab trap lines** (ROADMAP, The lab): in `src/components/lab/traps.ts`, in its own grammar: the door's "You're in" is a held beat of about a second (`use-success-hold.ts`), never a place for a button (two boards drew one there); and the lab's utilities compile into a sublayer (`utilities.lab`) that loses to production's own layer, so a lab-only variant paired with a production class on one property silently loses (`hidden lg:contents` stayed hidden at 1440; `sm:max-w-md` beside production's `max-w-[calc(100%-2rem)]` drew a 1408px dialog).

7. **`.prettierignore` gains `src/app/(dev)/design/gallery/specimens.generated.json`** (ROADMAP, Code hygiene, from `reel-marketing`): `pnpm format` re-flows the collector's output into a thousand lines of churn.

In the Handoff, name the ROADMAP lines each item closes (the Orchestrator retires them). Verify: the four new boards (`/design/lab/popups`, `identity-door`, `identity-claims`, `reel-story`) load with no console error on your dev server; the door's lamp on an album whose newest previews are grey; the teaser's loop paused while the player is open; `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

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
