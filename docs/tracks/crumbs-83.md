---
track: crumbs-83
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

None is a one-way door (no migration, no stored shape, no Stripe or env change); each is built as its recommended answer
and listed again under the calls.

1. **Back under a deep-linked photograph (Will's call, the brief's first line).** What the close does today: a photograph
   opened from its address (a shared link, a bell's link) stood on the one entry the link made, so its X, a tap or a pull
   cleared `?photo=` in place and landed in the album, while the phone's Back left the album with the photograph still
   open. Recommended, built: the opening writes the album's entry beneath it (`?photo=` cleared in place, the photograph's
   address pushed with the viewer's marker, as a tile's open does), so Back closes the photograph onto the album and the
   next Back leaves; the X goes Back the same way. A reload of the photograph's own entry writes nothing more. To overrule:
   the six lines under `standsOnNoEntryOfOurs()` in `masonry.tsx`'s address open, and its two reshaped pins.
2. **Forward onto a closed popup's entry: undone, or carried on?** Recommended, built: undone (one step Back), the popup
   beneath untouched, since a closed popup cannot come back and a Forward carried past it would stand on a dead entry
   wherever nothing lies beyond (the old code closed the popup beneath and stood there). An entry a popup's act left
   UNDER the next page is stepped the way the press came (Back to the page beneath, Forward to the page above).
3. **The way out from two places (the size list over the plan).** Recommended, built: Back over both entries, the popups
   standing drawn, then Stripe's page pushed from the page's own entry, so one Back from Stripe returns to the page and
   nothing of theirs lies under or beyond it. The other answer, replacing the list's entry and letting the reload sweep
   step over the sheet's on the way home, costs a second page load on every Back from Stripe.
4. **The doors' hold: what lets it go.** Recommended, built: the page coming back from the browser's cache (`pageshow`,
   `persisted`), or `HOLD_FLOOR_MS` (15 s) on a page that never left (a load she stopped), so no door is left dead; every
   door stands down while one is leaving, the pressed one saying it is working. The other answer, holding to `pagehide`
   with no floor, leaves a stopped load's doors dead until a reload. Only the real way out holds: the Library's doors stop
   where they would leave and come back at once.
5. **The held door's camera shots live in the tab.** Recommended, built: the wait says "Keep this tab open." beside the
   camera's shots, since the device keeps a choice (`wait-picks-store.ts`, one record rewritten whole) and keeping a roll
   of shots that way would rewrite every shot at each new one; a per-file store is a Deferred line. And the camera's own
   bar at the held door still says "Every shot goes straight in" while its shots wait for the let-in: recommended, a
   follow-up (Deferred), since its words are `guest/camera/words.ts`'s, outside this lane.
6. **The waiting count's extra read.** Recommended, built: made only when something waits (the count first, then the
   event's host and a count of her tickets' sealed shots through a join on the ticket's account, taken off), so an album
   holding nothing back costs one probe as before.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`: the ceiling's bullet says the browser's own refusals carry the server's codes
  (`prepare`), so every reader meets the refusal ladder's "choose another".
- `docs/systems/design-system.md` (no lane claims it): the places bullet says an entry whose popup has gone is stepped
  over the way the press was going, and the way out for Stripe goes Back over the places' entries without closing them.

## Deferred (ROADMAP one-liners, bucket named)

- Guests: at the held door the album's camera (wired by crumbs-83) still says "Every shot goes straight in" and draws
  its shots sending while they wait for the let-in (`guest/camera/words.ts`'s `cameraSubLine`, `album-camera.tsx`); a
  held reveal ("They go in once you're let in") would say it.
- Guests: the held door keeps a choice on the device but never the camera's shots (`wait-picks-store.ts` rewrites one
  record whole), so a reload there loses them ("Keep this tab open." says so); a per-file record would keep them.
- Engineering: a popup's entry a router refresh stripped of its marker, whose act then navigates, still leaves one dead
  Back under the next page (`ui/popup-back.ts` knows a spent entry by its marker alone).
- Engineering: a traversal of several entries at once (a long-press Back menu) that skips a spent entry left under a
  page leaves its side stale (`popup-back.ts`'s `windowAbove`), so a later Forward onto it is stepped Back; the Navigation
  API's entry index would know the side.

## Handoff (replaces the chat report)

- **Commits:** the work is `3a468cc08`, then `4642b25f8` (the history helper's header note, comments only); both pushed
  to `origin/lp/crumbs-83`; this manifest is the commit after them. **No sync:** `launch-prep` moved to `03a2027a8`
  (event-zone, drive-hardening, lab-kit-2 and credit-watch merged, records), none touching my `reads`
  (`src/lib/media/limits.ts`), and `git merge-tree --write-tree HEAD origin/launch-prep` merges clean (both sides edit
  `design-system.md`, in different bullets).
- **Gates**, each on its own exit code, logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-83/`:
  - on `4642b25f8`: `zsh scripts/build-lock.sh pnpm typecheck` exit 0 (`gate2-typecheck.log`); `pnpm lint` exit 0, no
    warning (`gate2-lint.log`); `zsh scripts/build-lock.sh pnpm test` exit 0, 1,022 files, 12,766 tests
    (`gate2-test.log`).
  - on `3a468cc08` (the next commit is comments only): the same three green (`gate-typecheck.log`, `gate-lint.log`,
    `gate-test.log`); `zsh scripts/build-lock.sh pnpm build` exit 0 (`gate-build.log`); `pnpm lab:smoke --base
    http://localhost:3132` exit 0, 181 checks, 0 failing (`gate-lab-smoke.log`), its PREMISE line: identity's 2 open
    asks (set, loading) describe `design-system.md` and `src/components/ui/`, which this lane touched for the popups'
    history only (no look of an asked atom).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`) = the owned prefixes (the masonry, popup-back,
  wait-picks, history-entry, uploader, use-upload-queue and social tests and `ui/popup-back-way-out.ts` sit under their
  prefixes) + this file + the System-doc edits above, plus these exceptions:
  - `src/components/guest/door/waiting-step.tsx` (a `camera` prop through `WaitingStep` and `WaitingDoor` to
    `WaitPicks`) and `src/components/guest/entry-modal.tsx` (hands the door's own camera to the held door, and preloads
    its chunk there too, a few lines): item 7's camera opener is the door's, held in `entry-modal.tsx`, and `WaitPicks`
    cannot reach it otherwise. `src/components/guest/entry-modal.test.tsx`: its pin, beside crumbs-76's camera pins.
  - `src/components/guest/guest-upload.test.tsx` and `src/components/guest/upload/failure-sheet.test.tsx`: item 8 drops
    the queue's copy; the first's stand-in uploader answered with no code and leaned on that copy (reshaped on purpose:
    its scar, no Retry on the uploader's own refusal, kept; it now answers the code the uploader answers), the second
    names the copy in a comment (one line).
  - `src/lib/history-state-policy.test.ts`, `bare-login-policy.test.ts`, `client-form-policy.test.ts`,
    `refresh-then-write-policy.test.ts`, `media-cost-policy.test.ts`: the Orchestrator's mid-lane ask (gate 29's load
    flake): each tree scan gets a module-level `testTimeout` budget with its reason (measured beside the other policy
    scans: 4.9 s, 4.4 s, 2.7 s, 2.1 s, 3.8 s), a module-level budget because a describe option re-indents each file.
- **The items**, each pinned by a test that fails on the old code: the new tests run against the base's sources in a
  throwaway worktree, **29 failed** (`old-code-check.log`; the guards beside them pass on both), and each walked on port
  3132 in a headless Chrome of my own (375 a phone's metrics, touch and UA; 1440 a desk; logs and `shots/` in the scratch):
  1. **Back under a deep-linked photograph** (`masonry.tsx`): pins `masonry.test.tsx` "★ a shared link's photograph: the
     phone's Back closes it onto the album", its reshaped close pin, the Next-patch pin (the album's entry carries
     `__NA`, nothing reloads) and the reload guard. Walk (`walk-viewer.log`, 12 of 12 at 375 and 1440, the real router,
     `navigation.entries()` read at each step): the link opens the photograph over `[album, album?photo]`, Back closes it
     onto the album, Forward reopens it, the X goes Back over its entry, a reload writes nothing more.
  2. **A popup whose act navigates** (`ui/popup-back.ts`, `spent` UNDER): pins `popup-back.test.tsx` "★ a place whose
     act goes on to another page", "★ a question over a place whose act goes on" (Next's own commit of the next page).
     Walk (`walk-popups.log`): the viewer's Report form open over the viewer, then Next's own `router.push("/")`; one
     Back from `/` lands on the viewer's entry, the form's stepped over, and Forward returns to `/`.
  3. **Forward onto a closed popup's entry** (`spent` OVER): pins "★ Forward onto a closed popup's entry leaves the
     popup beneath it open", "Forward onto a closed place's entry over the bare page is undone too". Walk
     (`walk-popups.log`, 9 of 9 with item 2's): Back closes the Report form alone, Forward is undone onto the viewer's
     entry with the form closed, and the viewer's Back is still one press away. At a desk no popup holds an entry.
  4. **The storage strip's way out** (`storage-list-body.tsx` by the doors' `leave`; `leave.ts` counts the places and
     steps out through `ui/popup-back-way-out.ts`): pins `pricing-sheet.back.test.tsx` "★ the strip's Switch takes both
     entries with it" (the real sheet, refusal, list and strip), `leave.test.tsx`'s four stacked pins, the reshaped
     `storage-list.test.tsx` strip pin, `popup-back.test.tsx` "★ the way out's own Back ... closes nothing". The live walk
     needs a signed-in Pro host: the desk list below.
  5. **Stripe's doors held** (`useLeaveHold` in `leave.ts`, the three buttons and the strip): pins in
     `checkout-button.test.tsx` (four: held through the load, the cache lets go, every door down, the floor),
     `manage-billing-button.test.tsx`, `change-plan-button.test.tsx`, and the guard "holds nothing for a way out that
     does not leave". Walk (`walk-hold.log`, 10 of 10 at 375 and 1440): `/pricing` signed out, its checkout route answered
     by the harness with a local page standing in for Stripe's, that page's load held 4 s; an in-page recorder saw
     "Starting…" and disabled for all 41 readings to `pagehide`, every Buy a pass disabled, a second press opening no
     second session (one route call), the page hiding into the cache, and Back bringing it out with every door usable.
     No Stripe request was made.
  6. **The Guests card's waiting shots** (`countWaitingGuestShots`): pins `social.test.ts` "★ leaves out the shots on a
     ticket the host claimed" (and the reshaped head-count pin, the 1,000-row pin with her tickets in it, the failed read
     that throws), the guard that an album with nothing waiting reads nothing more. The join's semantics on real
     PostgREST, read-only (`postgrest-count.mjs`): on an album SQL counts 5 guest shots, 3 on one account's tickets and 2
     on another's, the same head-count query answers 5, 3, 2 and 0 for an account with none.
  7. **The held door's wait on a camera album** (`wait-picks.tsx`): pins `wait-picks.test.tsx` (two) and
     `entry-modal.test.tsx` "★ the held door's wait offers the album's camera and no library, and its shot waits in the
     page's queue". A held door needs a confirmed guest at a door the host answers: the desk list. Walked instead
     (`walk-camera.log`, 4 of 4): a camera album's door at 375 and 1440 offers Take a photo and no picker, and opens the
     camera live (Chrome's fake device).
  8. **The uploader's refusal codes** (`uploader.ts`'s `prepare`; `localRefusalCode` gone): pins
     `uploader.burst.test.ts` "★ refused on the phone ... answer the server's codes" and `use-upload-queue.test.tsx` "★
     makes no code up". Walk (`walk-refusals.log`, 6 of 6 at 375 and 1440): a guest of a photo album sends a text file and
     an 11 GB movie (sparse, no bytes on disk) from the door's first-photo step; "2 of 2 didn't upload", each in its own
     sentence, no Retry, "Pick something else to add."
  9. **Gate 24's flake** (`storage-list.test.tsx`): every test's first wait is `firstRows`/`firstStrip` with a 10 s
     budget and its reason (the body is the list's lazy chunk; `-t` can make any test first), the file's tests given
     20 s; its siblings hold no such wait (`storage-chart.test.tsx` renders synchronously, the rest are pure).
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Proposed doc lines** (docs this lane does not own; for the Orchestrator to place):
  - `guest-flow.md`, the failure sheet's bullet: "The uploader refuses a wrong type or a file over its ceiling itself,
    before any request, and tags each with the code the server says for it (`unsupported_type`, `too_large`:
    `uploader.ts`'s `prepare`), so they meet the same rule." in place of the sentence naming `localRefusalCode`.
  - `guest-flow.md`, the viewer's bullet, after "the phone's Back over it are `shared/masonry.tsx`'s": "a photograph
    opened from its address writes the album's entry beneath its own, so Back closes it onto the album first".
  - `guest-flow.md`, the held door: "On a camera album the wait takes its shots with the door's own camera, never the
    library; they wait in the page's queue like a choice, in the tab alone."
  - `disposable-mode.md`: "The held door's wait chooser (`door/wait-picks.tsx`) still offers the library." becomes "The
    held door's wait takes its shots with the same camera (no picker); they wait for the let-in in the page's queue."; and
    `countWaitingGuestShots` gains "never the shots of a ticket the host claimed".
  - `host-app.md` (crumbs-84's now): the Guests card's `countWaitingGuestShots` gains "(never the shots of a ticket the
    host claimed: she is on no list)"; the history-entry bullet's "a place opened from a link closes in place" gains
    "(the photo viewer writes the album's entry under a photograph opened from its address, so it closes like a tile's)".
  - `billing-caps.md`, "Leaving for Stripe takes a phone sheet's own history entry with it": "With the size list stacked
    over the sheet (two places, two entries) the way out goes Back over both, the popups standing drawn, and pushes
    Stripe's page from the page's own entry (`ui/popup-back-way-out.ts`); the size list's goal strip leaves by this same
    `leave`. A door pressed holds every door until the page hides (`useLeaveHold`): a page back from the browser's cache
    lets them go, as does one that never left after `HOLD_FLOOR_MS`."
- **Desk list** (signed-in walks this lane cannot drive; TEST mode, never confirm a payment):
  1. A Pro host on a phone: the plan sheet, a size too small, See what's using space, the strip's Switch to Stripe's
     confirm page; one Back returns to the page, the next leaves it.
  2. The same sheet's Get Pro, Manage billing and Switch: each says it is working until Stripe's page shows; Back from
     Stripe finds them usable.
  3. A host on a phone: Settings' Delete event on a disposable album lands on the dashboard; one Back returns to the
     Settings room, never a same-address entry with nothing open.
  4. A confirmed guest at a held door on a camera album: Take a photo opens the camera, a shot waits ("Keep this tab
     open."), and being let in sends it.
- **Test data:** eight guest rows, no media, no report (`reports` in the walks' half hour: 0): "crumbs-83 walker",
  "crumbs-83 refusals 375", "crumbs-83 refusals 1440", "crumbs-83 probe" and two "crumbs-83 popups" on "crumbs-76 free
  (disposable)"; "crumbs-83 camera 375" and "crumbs-83 camera 1440" on "crumbs-76 camera (disposable)". The sparse 11 GB
  file is in the scratch folder (no blocks on disk).
- **Calls his to overrule:** the deep link's album entry (Q1); Forward onto a closed popup's entry undone (Q2); the way
  out from two places (Q3); the hold's floor and every door standing down (Q4); "Keep this tab open." for the camera's
  shots (Q5); the waiting count's extra read only when something waits (Q6).
- **Look at first:** Q1's walk (`shots/viewer-375-*.png`) and the desk list's first walk.
