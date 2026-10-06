---
track: crumbs-86
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "567e8710"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/mutations/event-passes.ts
  - src/lib/db/mutations/event-passes.test.ts
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/app/(guest)/u/[slug]/not-found.tsx
  - src/app/(app)/not-found.tsx
  - src/app/admin/not-found.tsx
  - src/app/group-not-found.lazy.test.tsx
  - src/components/app/create-event-wizard/add-step.tsx
  - src/components/app/event-settings/camera-settings.tsx
  - src/components/app/event-settings/delete-event-row.tsx
  - src/app/api/host/r2/complete-upload/
  - src/app/(as-guest)/dashboard/[eventId]/as-guest/page.tsx
  - src/app/(app)/dashboard/[eventId]/as-guest.server.ts
  - src/components/app/share/as-guest-view.tsx
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - src/components/app/event-blocks/blocked-section.tsx
  - src/lib/constants/tiers.ts
  - src/lib/constants/events.test.ts
  - src/lib/content/blog-keep-lines.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
---

# lp/crumbs-86

**Goal.** Ten small things a person or a maintainer can meet, from the ROADMAP's "Now": the 404s' one noindex, the host's own capture clock, See it as a guest's zone and first words, Create's and the camera's leftover seeding, billing's typed seam, two Library specimens, the lifecycle comments and Blocked's truncated address. Production code, the whole gate; no migration.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**The work (each line retired from the ROADMAP in your Handoff, quoted there by its first words):**
1. Code hygiene: drop billing-orphans' `orphansDb` seam (`src/lib/db/mutations/event-passes.ts`) now that `src/lib/db/types.ts` carries `adopt_pass_credit_orphans`.
2. Guests: the guest link's own 404 (`(guest)/e/[token]/not-found.tsx`) and the other groups' 404s still set their own robots metadata; the root's and the cinema's dropped theirs for Next's one noindex (the cinema's is marketing-crumbs' lane, running beside you: never touch `src/app/(marketing)/`).
3. Host: Create's add step (`create-event-wizard/add-step.tsx`) and Settings' camera (`event-settings/camera-settings.tsx`) still seed `patchForStyle` with `developToKeep`; `patchForStyle` now takes `{ zone: hostPartyZone(...) }` itself, so each drops the seeding.
4. Uploads: the host's complete route (`api/host/r2/complete-upload`) does not read `captured_wall`, so a host's own zoneless Exif clock stays read in her browser's zone; extend its schema as the guest's (`api/r2/complete-upload`). ★ No migration in this lane: if it needs SQL, stop that line and say so in your Handoff (upload-sums holds `create_media_as_host` this round).
5. Guests: See it as a guest says develop times in the host's own clock: its page (`(as-guest)/dashboard/[eventId]/as-guest/page.tsx`) could hand `AsGuestView` the party's zone for words, as the guest page does.
6. Host: See it as a guest says "the first photo" until its live source reports what waits; `readAsGuest` (`as-guest.server.ts`) can ask `albumWaits` as the guest page does and hand `waitingOnArrival` to `AsGuestView`, so its first byte says the Add's words.
7. Library: the Button page shows no working specimen (`library/components/gallery-demos.tsx`): add one beside Disabled (`working` with `workingLabel="Saving"`).
8. UI: the same file's tooltip specimen comment says the root provider's delay is 200 ms; it is 0.
9. Code hygiene: comments in `constants/tiers.ts` (the anti-abuse why), `event-settings/delete-event-row.tsx`, `constants/events.test.ts`, `content/blog-keep-lines.test.ts` and `app/group-not-found.lazy.test.tsx` still say events have "no end date" in the lifecycle sense; say "never expires", since Settings' end date only says when. (In `tiers.ts`, comments only: it is the pricing single source under a parity test.)
10. Host: Blocked's address column truncates a short address to "r." at 1440 in the Guests room's panel (`event-blocks/blocked-section.tsx`'s `truncate` beside the since-line).

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke`; each surface you change at 375 and 1440 in your own headless Chrome on a local production build at 3000, signed in as a test host through `usher/kit/redteam/signin.mjs` where it needs a host (a host upload with a zoneless Exif photograph from `node usher/kit/media-gen.mjs` for line 4).

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- Lane exceptions (three commits, each droppable alone). Recommended: take all three. (a) 2392a52c2, line 2: four boundary pins outside `owns` (`(guest)/e/[token]/page.test.tsx`, `(guest)/u/[slug]/page.test.tsx`, `(app)/dashboard/[eventId]/event-not-found.test.tsx`, `admin/record-not-found.test.tsx`) pinned `boundaryMetadata` by identity to `not-found.metadata.ts`. Dropping the boundary's robots means they now pin `{ title }` (one line each). The pages' own soft-404 robots are untouched. (b) 8f97babe0, line 7: a `working` Button attaches its own onClick, which a server module cannot pass into the Library's client page (`/design/library/button` answered 500 under lab:smoke). So the specimen draws through `WorkingButtonDemo` in `library/components/interactive-demos.tsx`, beside `TapTooltipDemo`. (c) Line 7's regenerated `design/gallery/specimens.generated.json`, a derived file its freshness test requires.
- Line 4 reads the zone by the body's `event_id` before ownership is proven (service role, `readPartyZone`, as the guest's complete does with the door's id). Recommended: keep it. The zone never leaves the server and only places a row that `create_media_as_host` refuses (not_owner → 404) unless the event is hers; a test pins that.

## System-doc edits (in place, owned facts only)

- none (the lane owns no `docs/systems/` doc). Stale lines outside the lane, for whoever owns them: `src/lib/upload/server-pipeline.ts:544` says "The host's route takes none" of `captured_wall` (it does now); `src/lib/event/zone-morning.ts`'s `developToKeep` head says the two callers retire the seeding when their files next move (Create's has; Settings' style switch has, and its reveal control still calls `developToKeep` on purpose, since it does not go through `patchForStyle`); `src/lib/event/zone.server.ts` heads itself "for a guest's render" and says the id is the door's (the host's complete now reads it too, by the body's id, line 4).

## Deferred (ROADMAP one-liners, bucket named)

- Now: pin See it as a guest's two new facts in its own tests (`as-guest.server.test.ts`: `waitingOnArrival` asked only under the guest page's guard and `partyZone` null when shut; `as-guest-view.test.tsx`: `waitingOnArrival` holds the Add off "the first photo" and the sheet says the party's clock). Both files sat outside crumbs-86's paths.
- Now: retire `zone-morning.ts`'s head line about the seeding, and `server-pipeline.ts:544`'s "The host's route takes none" (crumbs-86 did both).

## Handoff (replaces the chat report)

- Work: 884fa5ffd (lines 1, 3 to 10), 2392a52c2 (line 2), 8f97babe0 (line 7's client demo). Syncs: f8afb2c28, f9c655b1a (launch-prep at f5a20ce6f). All pushed; the head is in the chat line.
- Gates on f8afb2c28 (the first sync), each on its own exit code: typecheck 0, lint 0, test 0 (1055 files, 13272 passed, 2 skipped), `zsh scripts/build-lock.sh pnpm build` 0. lab:smoke `--base http://localhost:3131`: the first run's only failure was `/design/library` timing out on a cold dev compile. A warm re-run caught `/design/library/button` and `/components` answering 500 (the Working specimen), fixed in 8f97babe0, after which typecheck 0, lint 0, the `(dev)` tests 0 and lab:smoke 0 with 177 checks, 0 failing. The production build at 3000 for the walks was rebuilt on 8f97babe0 (exit 0). On f9c655b1a (the second sync, which brought drive-crumbs and touched none of this lane's files): typecheck 0, lint 0, test 0 (1056 files, 13293 passed, 2 skipped); the build and lab:smoke were not re-run there.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the owned paths + this file, plus the exceptions in Questions: 4 test files (line 2), `library/components/interactive-demos.tsx` and `design/gallery/specimens.generated.json` (line 7).
- 1 (ROADMAP "Code hygiene: drop billing-orphans' `orphansDb` seam"): `adoptPassCreditOrphans` calls the typed `createAdminClient().rpc`; typecheck 0 is the proof. Its tests are unchanged and green.
- 2 ("Guests: the guest link's own 404 ... still set their own robots metadata"): the guest link's, the profile's, the host app's and the portal's boundaries export `{ title }` only. Next's docs (`node_modules/next/dist/docs/.../not-found.md`, `streaming.md`) say Next injects the noindex on a 404 and on a mid-stream `notFound()`. On the production build `/no-such-page-86` answered 404 with one `noindex`; `/e/<bogus>` and `/u/<bogus>` (the pages' own soft 404s at 200) each still carry exactly one `noindex, nofollow`.
- 3 ("Host: Create's add step and Settings' camera still seed `patchForStyle`"): both hand `{ zone: hostPartyZone(...) }` to `patchForStyle`. Create's `fields()` takes it too. Walked at 1440 as willg97: Create's Disposable offered 9 am tomorrow (stored `2026-10-07T08:00Z`, London). With the party moved to Makassar, Settings' Live → Disposable stored `2026-10-08T01:00Z` (9 am in Makassar) from a London browser.
- 4 ("Uploads: the host's complete route ... does not read `captured_wall`"): the schema takes `captured_wall` and `createRecord` reads it in the party's zone, once a burst. Four route tests (`api/host/r2/complete-upload/route.test.ts`). Live: `media-gen.mjs --capture-fixtures`' `imageio-nozone.jpg` (wall 2026-10-03 21:14:05, no zone) uploaded by the host from a London browser into the Makassar party landed `captured_at 2026-10-03T13:14:05Z` (21:14:05 in Makassar; her browser read 20:14:05Z). No SQL.
- 5 ("Guests: See it as a guest says develop times in the host's own clock"): `readAsGuest` returns `partyZone` (her row's `time_zone`, null when shut), and `AsGuestView` wraps the album in `PartyZoneContext` and passes it to `waitWords`. Walked at 1440 and 375: "1 photo developing. All at once Thu, Oct 8 at 9 am in Makassar, 2 am yours".
- 6 ("Host: See it as a guest says "the first photo" until its live source reports what waits"): `readAsGuest` asks `albumWaits` under the guest page's own guard and `AsGuestView` holds `empty` off it. The page's raw HTML (fetched, before any script) said "Take photos", not "Take the first photo", over the walk album's one sealed shot.
- 7 ("Library: the Button page shows no working specimen"): "Working" stands beside Disabled, two keys `working workingLabel="Saving"`. On the production build both are `aria-busy`, `aria-disabled`, not `disabled`.
- 8 ("UI: the Library's tooltip specimen ... says ... 200 ms"): the comment says delay 0 / skip 300 (`providers.tsx`).
- 9 ("Code hygiene: comments in `constants/tiers.ts` ... say events have "no end date""): the five comments say "never expires". The scan regexes and the quoted copy they match are unchanged. In `tiers.ts` only the comment moved; prettier's reflow of its code was reverted.
- 10 ("Host: Blocked's address column truncates a short address to "r." at 1440"): the line breaks on the row's own width (`@container`, `@sm:`), not the screen's. On the host-moments board at 1440 (rows 412–413px) "ray.m@example.com" shows whole (no overflow) with the since-line under it. A live Guests room with a block was not walked: every blocked row of the test host's is on a deleted event.
- Assets requested from Will: none
- Board ideas: the cover's eyebrow ("Disposable · develops Thursday at 2 AM") says only the reader's clock where the sheet under it says both (`coverEyebrow` takes no zone, on the guest page too); one words call for a far party.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Test data left (willg97@gmail.com): event `9eb392f2-3e9c-49b8-b2c3-79500eb248d1` "crumbs-86 walk (disposable)" (Makassar, develops 2026-10-08T01:00Z) and its one media row `5b575c30-660b-4abb-8fcd-03324740ee9a`; delete both.
- Calls his to overrule: Blocked switches to one line at a 24rem row (`@sm`); Create's `fields()` now hands `patchForStyle` her zone as well (a passed time is refused by `confirm()` before it could matter).
- Boot: the permission check refused appending the three exports to the shell snapshot, so each command that ran the app, a build or a browser set them inline. `zsh` and `chrome-ns` were already there.
- Look at first: 2392a52c2 (the four out-of-lane pins), then 8f97babe0 (the Library's client demo).
