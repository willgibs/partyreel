---
track: crumbs-3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "a1c8f89e"            # the launch-prep SHA the branch was cut from
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
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
  - docs/ROADMAP.md
---

# lp/crumbs-3

**Goal.** Six small leftovers from batch 4 and build 11's red-team, none a design decision: the lab dock's prefetch 404s, the door lamp's sampler walking past colourless previews, the teaser's loop paused under the open player, two copy nits, two help pages told the keep and the told name, and two lab trap lines.

## The brief

Each is small and independent; build each as a working version, and list anything that turned out to be a real choice as his to overrule.

1. **The lab dock's links 404 on prefetch** (build 11's red-team): `src/components/lab/dock.tsx` (about :185-204), Prev, Next and Desk are plain `next/link` with viewport prefetch; the prefetch drops `?key=`, so the design gate 404s it, 2-3 console errors per board load. `LabLink` sets `prefetch={false}` for exactly this reason: use it (or the same prop).

2. **The door's lamp falls back to the house five when the album's newest previews are colourless** (build 11's red-team: the 15-photo probe's three newest items are grey clip posters; 3,072 sampled pixels, none with colour, so the sampler returned nothing). Let it look past colourless previews to the newest that carry colour (a small bounded window, e.g. the dozen newest previews), and fall back to the house five only when none does (`src/components/guest/door/album-light.tsx`, `src/lib/guest/door-light.ts`, `src/lib/shared/sampled-palette.ts`). Still previews only, never an original. A call his to overrule: how far back it looks.

3. **The home teaser's muted loop keeps decoding under the open player** (ROADMAP, Marketing, from `reel-marketing`): `AmbientReelVideo` (`sections/reel/ambient-reel-video.tsx`) takes a `paused` prop that `ReelPlayScreen` (`sections/shared/reel-player.tsx`) sets while its player is up, and the loop resumes on close.

4. **Two copy nits** (ROADMAP, Shared, from `popups`): the Add photos sheet writes "{host}'s album" with a straight apostrophe (`guest/upload/intent-sheet.tsx:220`) where the failure sheet curls it: curl it. The host's native share text says "and" where the guest's says "&" (the host's share in `src/components/app/share/`, the guest's `guest-share.tsx`): make the two agree on the house style and say which.

5. **Two help pages told the door's keep and the told name** (ROADMAP, Help, from `guest-door`): `content/help/find-your-uploads-and-events.mdx` and `how-guests-join-and-upload.mdx` still call the keep a card under the first upload; it is the door's last screen after her first file lands (Maybe later puts it down for that event on that device), and a name typed at the door becomes the account's ("You're on as ...", with a Change). `guest-flow.md` is the truth. Leave `a-photo-is-missing-from-the-album` alone (it follows `host-curation`'s open `told`).

6. **Two lab trap lines** (ROADMAP, The lab): in `src/components/lab/traps.ts`, in its own grammar: the door's "You're in" is a held beat of about a second (`use-success-hold.ts`), never a place for a button (two boards drew one there); and the lab's utilities compile into a sublayer (`utilities.lab`) that loses to production's own layer, so a lab-only variant paired with a production class on one property silently loses (`hidden lg:contents` stayed hidden at 1440; `sm:max-w-md` beside production's `max-w-[calc(100%-2rem)]` drew a 1408px dialog).

In the Handoff, name the ROADMAP lines each item closes (the Orchestrator retires them). Verify: the four new boards (`/design/lab/popups`, `identity-door`, `identity-claims`, `reel-story`) load with no console error on your dev server; the door's lamp on an album whose newest previews are grey; the teaser's loop paused while the player is open; `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md` (the door's lamp source line): "the album's three newest previews" narrowed
  to "the album's newest previews, within a bounded lookback past any that turn out colourless" (and the
  fallback clause widened to name that case), so the doc doesn't keep claiming a fixed three once
  `album-light.tsx`'s `LOOKBACK` is 12. Not in `owns`; a single-fact exception under CLAUDE.md's "Record
  subtractively" (the fact this lane's own item 2 changed).

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Work commits: six, one per item, `00f5d646`..`6ccda924` on top of the cut `1875a133`
  (`git log --oneline 1875a133..6ccda924`); this manifest's own commit follows and is the head reported in
  the chat line. `launch-prep` had not moved from the cut (re-fetched immediately before this handoff), so
  no sync commit.
- Gates, all run on `6ccda924` (the tree after all six work commits, before this manifest-only commit),
  each on its own exit code:
  - `pnpm typecheck`: clean.
  - `pnpm lint`: 0 errors; 5 pre-existing warnings, all in files this lane never touched
    (`_desk/review-session.tsx`, `(paper)/contact/contact-form.tsx`, `features/album/album-fill-grid.tsx`,
    `features/album/review-switch.tsx`).
  - `pnpm test`: 5615 passed, 0 failed, 499 files.
  - `zsh scripts/build-lock.sh pnpm build`: exit 0, full route manifest printed.
  - `pnpm lab:smoke --base http://localhost:3131`: 264 checks, 0 failing (includes the four named boards).
  - `board: none`, so no `lab:demo` run.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is the 12 owned files below plus this
  manifest, plus ONE exception: `docs/systems/guest-flow.md` (a single fact narrowed, listed above under
  System-doc edits; not in `owns`, sanctioned by CLAUDE.md's "Record subtractively"). No other file touched.
- The items, one line each:
  1. `src/components/lab/dock.tsx`: Prev/Next/Desk now carry `prefetch={false}`, same fix `LabLink` already
     uses and for the same reason (viewport prefetch drops `?key=`). Verified live: all four named boards
     load with an empty console and no keyless `/design/lab/*` request in the network log (checked
     individually: popups, identity-door, identity-claims, reel-story).
  2. `src/components/guest/door/album-light.tsx` (+ `door-light.ts`'s doc comment): the lamp's sampling
     window widened from a fixed newest-3 to a bounded newest-12 (`LOOKBACK`); `pickSpillHues` already
     discounts a pixel with no real chroma, so widening the pool lets whichever of the twelve DOES carry
     colour drive the light, and a window with none anywhere still falls back to the house five exactly as
     before. `sampled-palette.ts` needed no change (its per-pixel math was already correct; only the
     caller's window was too narrow). New test: "looks past a colourless run to a dozen newest previews,
     not only the newest three" (`album-light.test.tsx`), proving the window reaches ids 4-12, not just the
     old 1-3. A live re-check against a real album whose newest items are grey clip posters (build 11's
     exact probe) is the natural final confirmation; I did not reconstruct that fixture here.
  3. `ambient-reel-video.tsx` + `reel-player.tsx`: `AmbientReelVideo` takes a `paused` prop, OR'd with the
     existing `useAmbientPause` signal; `useReelPlayer` now returns `active` (`host !== null`), and
     `ReelPlayScreen` passes `paused={active}` to the teaser loop. Verified live: opening "Play a sample
     highlight reel" mounts the contained player (a second `<video>`, `role="dialog"`) and closing it
     unmounts cleanly back to one video, so `active` toggles correctly end to end. The video's own paused
     DOM state could not be visually confirmed in this pane: `document.hidden` stays true here (a documented
     tool limitation, `testing-verification.md`, "`useAmbientPause` consumers report paused"), which already
     forces every ambient video to paused regardless of my new prop, so it could not isolate the new signal.
  4. Two copy nits: `intent-sheet.tsx`'s "Everything you add joins {host}'s album." now curls its apostrophe
     (`’`), matching `failure-sheet.tsx`'s `&rsquo;` and the house pattern (`save-account-prompt.tsx`).
     `guest-share.tsx`'s native share text now says "and" instead of "&", matching the host's own three
     call sites (`event-code-modal.tsx`, `event-share-sheet.tsx`, `create-event-wizard.tsx` all already said
     "and"; the guest's was the one holdout), so house style is "and" for this line, said here per the brief.
  5. `find-your-uploads-and-events.mdx` and `how-guests-join-and-upload.mdx`: both stop calling the keep "a
     card"; it's the door reopening as its last screen. The fuller article also now says the typed name
     becomes the account's, with a Change if it's wrong, and that Maybe later is scoped to that event on
     that device (not gone for good). Both `updated` bumped to 2026-09-27. Verified live (rendered page
     text) on both routes.
  6. `src/components/lab/traps.ts`: two new entries, `a-button-in-the-success-hold` (the door's "You're in"
     is a ~900ms `useSuccessHold` beat, never a place for a control) and `lab-utility-loses-to-production`
     (a lab-only utility paired with a production class on one property silently loses to
     `utilities.lab`'s sub-layer). Verified live on `/design/lab/kit`: both render.
- Assets requested from Will: none.
- Board ideas: none beyond this lane's own six items.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - Item 2's window is 12 (`LOOKBACK` in `album-light.tsx`), a guess at "a small bounded window" per the
    brief; a real album's grey-poster run could be longer or shorter than the build-11 probe's three.
  - Item 4's "and" vs "&": picked "and" on a 3-to-1 count of existing native-share call sites; either is a
    one-line flip in `guest-share.tsx` if he'd rather standardize the other way.
- ROADMAP lines this closes (four of six items had one; items 1 and 2 were sourced straight from build 11's
  red-team report, never a ROADMAP line, so nothing to retire for them):
  - Marketing / `reel-marketing`'s teaser-loop line (item 3): closes whole.
  - Shared / `popups`'s copy-nits line (item 4): only the "two copy nits" half is done; its other half (a
    QR-designer Cancel and the clip's "Add to event" close, both waiting on `popups` being wired) is
    untouched and should stay open, so the line wants narrowing rather than deleting.
  - Help / `guest-door`'s keep/told-name line (item 5): only the `find-your-uploads-and-events` +
    `how-guests-join-and-upload` half is done; its `a-photo-is-missing-from-the-album` clause is
    untouched on purpose (the brief: "follows `host-curation`'s open `told`"), so this line also wants
    narrowing, not deleting.
  - The lab / trap-lines line (item 6): closes whole.
- Look at first: `src/components/guest/door/album-light.tsx` (the widened lookback, item 2, the only real
  logic change) and the two help articles' new prose (item 5, quick to eyeball for tone).
