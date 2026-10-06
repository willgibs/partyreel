---
track: crumbs-85
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/lib/guest/
  - src/components/app/event-feed/
  - src/components/app/share/as-guest-view.tsx
  - src/components/app/share/as-guest-view.test.tsx
  - src/app/(app)/dashboard/[eventId]/as-guest.server.ts
  - src/app/(app)/dashboard/[eventId]/as-guest.server.test.ts
  - src/lib/shared/album-order.ts
  - src/lib/shared/album-order.test.ts
  - src/lib/event/
  - src/lib/disposable/
  - src/lib/upload/
  - src/app/api/r2/
  - src/app/(guest)/e/
  - src/lib/media/strip-metadata.ts
  - src/lib/media/strip-metadata.test.ts
  - src/app/not-found.tsx
  - src/app/(marketing)/(cinema)/not-found.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - docs/systems/uploads-and-r2.md
---

# lp/crumbs-85

**Goal.** Red-team 56's findings fixed before milestone 38 (the MEDIUM: a guest sending from the head of an album in order sees her progress and Stop where she is; the roll of one's counts at the guest's side; the stored MOV's write time, the hub's develop place, the 404's double robots meta), and with them the album's time made whole: the follow-ups event-zone, capture-time and guest-requests left on the guest's album and camera.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**Why now.** Red-team 56 walked everything merged since milestone 37 (the album in order, one moment for every guest, capture time, the hub's doors, Settings' roll, Back a layer at a time) and found no HIGH, one MEDIUM and small findings; milestone 38 waits on this lane, then a short re-walk of the MEDIUM. With them ride the follow-ups event-zone, capture-time and guest-requests left on the same album and its clock, so the album's time is whole before the milestone.

**Red-team 56's findings (each fixed and walked):**
1. **MEDIUM (album-order):** in an album shown in order, a guest who sends from the head sees no progress until it lands, because her stack (the sending progress and its Stop) stands at the album's end (seen at 375 on a throttled send). Her own sending state must be where she is when she sends, whatever the album's order, with Stop in reach (Will's standing rule: immediate, or a clear state and a way to stop it).
2. **LOW, the guest's side (settings-wiring):** at a roll of 1, a guest holding two shots reads "1 shot… 1 of 1" beside both. Settings' half of this finding (its "shots each" and "Removing one frees its frame") is identity-r5-wiring's, in its files.
3. **NITs:** the stored MOV's track header keeps the export's write time (`strip-metadata.ts`: the capture-time lane keeps only the time it was taken); the hub's develop time is unnamed beside Settings' "in Makassar" (the ROADMAP's line: the head cover's "until it develops tomorrow at 9 am" and the cards read her own clock; name the party's place as Settings does, `zone-words.ts`); the 404s carry two robots metas (`app/not-found.tsx` and `(cinema)/not-found.tsx` set `robots: noindex, nofollow` beside the noindex Next injects: one is enough).

**The album's time, from the ROADMAP's Now (each line retired in your Handoff):**
- A develop time taken away while a guest has the album open is still obeyed until she reloads (`event-experience.tsx` hands the turn `liveDevelopsAt ?? event.develops_at`, and `useLiveUploadsWait` answers null both before the sync speaks and for none): tell the two apart.
- `patchForStyle` (`lib/disposable/album-style.ts`) and `defaultDevelopAt` (`reveal.ts`) read the browser's zone, so Create and Settings hand them the party's 9 am as the time to keep (`developToKeep`): take the zone directly and retire that seeding.
- album-order's `GuestAlbumOrder` (a zone) and event-zone's `AlbumOpening` (an instant) are one idea in two types: fold the opening into album-order, its `zone` becoming `morningAfter`.
- A far party's guest page says a develop time in both clocks ("9 am in Bali, 6 pm yours") where the guest's zone is not the party's.
- A zoneless Exif wall clock is read in the party's own zone (`events.time_zone`) rather than the uploader's browser's: the claim carries the bare wall clock for the server to read in the event's zone (`fromZoneInput(bareWallClock, partyZoneOf(zone))`, DST-safe); the complete route gains one read of the zone on the upload's hot path (`readPartyZone`), so say what it costs a burst.
- The album camera's shots (canvas JPEGs, no Exif) carry no capture time, so one sent long after it was taken sorts by its arrival: hand `uploadBurst` its `takenAt` as the claim (`camera-screen.tsx`, a `BurstFile` field).
- A capture time far outside the album's own days (a throwback, a camera a year off) leads the night in order: seat it at the night's edge in the in-order view, the wire keeping the true time.
- The door's camera (`entry-modal.tsx`'s `AlbumCamera`) is handed no word on uploads, so it still asks a closed album again on the calm cadence: hand it `uploadsWord` and `onAskUploadsWord` as the album's own camera has them (`guest-upload.tsx`).
- At the held door the album's camera still says "Every shot goes straight in" and draws its shots sending while they wait for the let-in (`lib/guest/camera/words.ts`'s `cameraSubLine`, `album-camera.tsx`): a held reveal says it ("They go in once you're let in").
- `gallery-empty-state-wait.test.tsx:373` names a capture in the Mac's old scratch (`_scratch/crumbs-61/cap-4-*.jpg`), gone with it: drop the path, keep the mechanism.

Out of scope (other lanes this round): Settings' files (identity-r5-wiring), Drive (drive-crumbs), billing and `/admin` (billing-orphans). The far-from-home chooser opening on her past cities stays a ROADMAP line (it lives in Settings). No migration is expected; if one becomes the right answer, write it as a file and say so under Questions (the Orchestrator applies it through the Advisor).

**Starts from.** CLAUDE.md's working loop, `docs/systems/guest-flow.md`, `disposable-mode.md`, `uploads-and-r2.md` and `host-app.md` (their ★ lines first), and production as it is; the tests say what has to keep working.

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke`; then live on your own production build at :3000 (CLAUDE.md, "Local dev vs. live testing"): the MEDIUM as red-team 56 saw it (a guest's join on a disposable album of yours in order, at 375, a throttled send from the head: her progress and Stop in sight), one instant from two zones, a camera shot's capture time kept, a far party's guest page in both clocks. Test data only, named "(disposable)", listed in your Handoff.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

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
