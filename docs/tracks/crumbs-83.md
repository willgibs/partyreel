---
track: crumbs-83
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b4e4c064"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/history-entry
  - src/components/ui/popup-back
  - src/components/shared/media-lightbox
  - src/components/shared/masonry
  - src/components/app/pricing/
  - src/components/app/checkout-button
  - src/components/app/manage-billing-button
  - src/components/app/storage/
  - src/components/guest/door/wait-picks
  - src/lib/upload/uploader
  - src/lib/guest/use-upload-queue
  - src/lib/db/queries/social
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/media/limits.ts
---

# lp/crumbs-83

**Goal.** Eight bugs a person can hit: Back and Forward around the viewer and popups, Stripe's doors tapped twice, the door's wait chooser on a camera album, the uploader's refusals named at their source, and the Guests card counting only guests' shots.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3132 is yours; 3000 is Will's desk.

**Eight ROADMAP lines, bugs a person can hit, each quoted whole (read the code each names first; the ROADMAP line retires at the Orchestrator's record):**
- Guests: a photograph opened from a shared link (`?photo=`) has no entry under it, so the phone's Back leaves the album with the photograph open; a base entry written under a deep-linked viewer (the album's address replaced, the photograph's pushed) would make Back close the photograph first (`masonry.tsx`; Will's call, since the close already lands in the album in place) (back-layers).
- Engineering: a popup whose act navigates (a server action's redirect, `router.push`) leaves its entry under the next page, so Back from there lands on a same-address entry with nothing open (one dead Back) (back-layers).
- Engineering: Forward onto a closed popup's history entry closes the popup beneath it (before back-layers too) (back-layers).
- Billing: the storage list's goal strip (`storage/storage-list-body.tsx`, `window.location.assign`) leaves for Stripe past `PricingDoors`' `leave`, so on a phone it still leaves over the list's own history entry (and the plan sheet's, when opened from it); route it through `leave` (pricing-doors).
- Billing: Checkout, Manage billing and Switch re-enable the moment Stripe's address is assigned, so a second tap while Stripe's page loads opens a second session; hold "Starting…" until `pagehide`, and read `pageshow` from the cache (pricing-doors).
- Host: `countWaitingGuestShots` (`queries/social.ts`) counts shots on a guest ticket the host later claimed (`guests.user_id` is the host), whom no list shows, so her own claimed-ticket shots read as "their guests join"; leave that ticket out (a join on the ticket's account) when it earns the read.
- Guests: the held door's wait chooser (`door/wait-picks.tsx`) still offers the photo library on a camera album, so a library photo can wait for the roll; offer the album's camera there, as the door's step now does.
- Guests: the uploader refuses a wrong type and a file over its ceiling with no code (`prepare()` and `validateUpload` in `uploader.ts`), so the queue gives them one from the file (`localRefusalCode`); tag them at the source and drop the queue's copy.

Each fix pinned by a test that fails on the old code, and walked on your port at 375 and 1440 where a person meets it (the history ones on a real Back and Forward in a headless Chrome of your own). The first line is marked Will's call: build the recommended answer (Back closes the photograph first), write it under Questions with what the close does today, and list it as his to overrule. The Stripe doors are TEST mode only: never complete a checkout; a door's press is proved up to the moment it leaves (the `pagehide` hold and a `pageshow` return from the back-forward cache), and a signed-in walk that reaches Stripe goes to the Orchestrator's desk list. The door's wait chooser and the uploader's refusal codes are walked as a guest on a camera album and a photo album. `countWaitingGuestShots` is proved with a rolled-back SQL fixture or the function's own test seam.

A ninth, the gate's flake in your folder: `src/components/app/storage/storage-list.test.tsx`'s first test waits the default second for the list's first render and timed out while another lane's build held nine cores (the Orchestrator's gate 24; it passes on a quiet machine): give that first render's wait the time a loaded machine needs, with its reason, and look for the same one-second first wait in the file's siblings.

Docs: `docs/systems/guest-flow.md`, `host-app.md` and `billing-caps.md` belong to open lanes (event-zone, credit-watch): write the lines they need under your Handoff's proposed doc lines for the Orchestrator to place; `docs/systems/uploads-and-r2.md` is free for the refusal codes.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

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
