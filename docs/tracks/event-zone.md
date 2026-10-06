---
track: event-zone
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8bb4e103"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20261005220000_event_zone.sql
  - src/lib/event/zone
  - src/lib/validation/event
  - src/lib/db/mutations/events.ts
  - src/lib/db/queries/events.ts
  - src/lib/events/gallery-access.server
  - src/app/(guest)/e/[token]/page
  - src/components/guest/gallery-order
  - src/components/guest/live-gallery
  - src/components/app/create-event-wizard/
  - src/components/app/event-settings/
  - src/app/(app)/dashboard/[eventId]/as-guest.server
  - src/components/app/share/as-guest-view
  - docs/systems/guest-flow.md
  - docs/systems/disposable-mode.md
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - src/lib/shared/album-order.ts
  - src/lib/dashboard/viewer-day.ts
---

# lp/event-zone

**Goal.** Every guest's album turns at the same moment: the party keeps its own time zone, so the night in order and the develop's 9 am are one morning, the party's, for every reader wherever they are.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline; "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3133 is yours; 3000 is Will's desk.

**Will's ask (2026-10-05):** "It feels unfair to unlock the album at different times for certain guests based on geographical location. Is there a way to standardize this?" Today the album's turn (album-order, merged: newest first while the party is on, the night in order from 9 am the morning after its last day) happens in each READER's zone: the guest page feeds `albumTurnAt(facts, zone)` (`src/lib/shared/album-order.ts`) the zone `resolveViewerZone` reads from the request, so a guest in London sees the night in order eight hours before one in Los Angeles. A disposable's develop is already one instant for everyone (`events.develops_at`, a timestamptz), but its 9 am default is the host's browser zone at the moment she picked it (the ROADMAP's develop-zone line: a destination wedding set from home develops in the home morning).

Each change pinned by a test that fails on the old code:
1. **One moment for everyone.** The party keeps its own zone: `events.time_zone`, an IANA name, in one migration (`supabase/migrations/20261005220000_event_zone.sql`): additive, nullable for the rows that exist, the host's column-locked write re-granted exactly (database-security.md's workflow; a rolled-back check at its foot). Milestone 37's live build shares the database and never reads it. The Orchestrator has the Advisor read the file before the apply. Every reader's album turns at one instant: 9 am the morning after the last day in the party's zone, computed once on the server and handed to the page as an instant (never a zone), so no reader's clock or geography moves it. A row with no zone (test data only) keeps one fallback, said in one place.
2. **Captured, never asked.** Create writes the host's own zone (her browser's `Intl` zone, validated on the server against the runtime's supported zones) with the event's dates; a Settings date edit keeps it, or writes it where it is missing. A host who never travels never sees a zone.
3. **The develop's 9 am reads the party's zone too** (Create's develop row and Settings' camera page), so the default develop and the turn are the same morning; the ROADMAP's develop-zone line closes.
4. **A party far from home (a call, recommended):** where Settings shows a time (the develop's hour) and the party's zone is not the host's own, the time names its place ("9:00 AM in Mexico City"), and Settings offers the party's zone as one quiet choice for a host planning from away: never in Create, never a raw IANA list as the first thing she meets. If it costs more than it is worth now, build 1 to 3 and write 4 as a Deferred line with its reason.
5. **See it as a guest** shows the guests' order after the turn (ROADMAP: `as-guest-view.tsx` hands `LiveGallery` no order): hand it the same server-computed instant.
6. **Edge cases, each a test:** a range (its LAST day); both DST nights in the party's zone; a party in Auckland read from Los Angeles and London (one instant); a zone the runtime cannot read, refused by the server; a row without a zone; a disposable (the develop instant wins, as today); a date edited in Settings from another zone (recommended: a date edit never moves the party's zone; only the explicit choice in 4 does).

**Coordination with the open lanes:** `src/lib/shared/album-order.ts` is capture-time's this round (its `takenAtOf`); `albumTurnAt` already takes a zone, so call it with the party's, and write any change it truly needs under Questions. `src/app/(app)/dashboard/actions.ts` is crumbs-82's: carry the zone on the validated values (`src/lib/validation/event.ts`) into `src/lib/db/mutations/events.ts`; if the action itself must change, write it under Questions and the Orchestrator sequences it after crumbs-82's merge. `src/lib/dashboard/viewer-day.ts` (crumbs-82's) stays the dashboard's own day rule; the guest page stops reading it for the turn. `src/lib/db/types.ts` is regenerated by the Orchestrator after the apply: a narrow typed seam until then, named in your Handoff.

The docs say the new truth, each in its home: guest-flow.md (the turn is one moment, the party's), disposable-mode.md (the develop's zone), host-app.md (Create and Settings: the zone captured, the far-from-home choice). Wiring rigor: the whole gate; the guest page walked on your port at 375 and 1440 from two emulated zones (CDP `Emulation.setTimezoneOverride` in a headless Chrome of your own), the turn landing at the same instant; Create and Settings need port 3000's sign-in: list those walks for the Orchestrator's desk walk.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

1. **The one fallback for a party with no zone** (a row from before the column, test data only, or a stored zone the
   runtime cannot read): UTC, said once (`PARTY_ZONE_FALLBACK`, `src/lib/event/zone.ts`). Recommended: even there every
   reader meets one moment, and a row takes its host's zone with her next save of a time. The other answer (the
   reader's zone, as before) keeps the unfairness on those rows.
2. **A browser zone the server cannot read at Create** ("Etc/Unknown", a zone newer than Node's ICU): stored as none and
   reported to Sentry (`storedZone`), and the create goes ahead. The other answer refuses the create, which strands a
   host over her own device.
3. **A date edit never moves the party's zone; only the chosen city does** (the brief's recommendation): the captured
   zone is written only under `time_zone is null`.
4. **The far-from-home choice is built, not deferred.** It is one quiet line under the dates on Settings' event page,
   and never in Create. At home: "Party in another time zone?", naming no zone. Away: "On Mexico City time · 4:12 PM
   there now · Change". It opens a form popup on her own zone with a search over cities, countries and destinations.
   Where the party's zone is not hers, the develop time is the party's clock throughout Settings: the field reads and
   writes it, and every line names the place ("Develops Sun, Oct 4, 9:00 AM in Mexico City."). A far time always names
   its day and never says "tomorrow", because a relative day read across two zones is nobody's. The other answer for
   the field: keep her own clock and only name the place in the words.
5. **Picking another city never moves a develop time already set**: the instant keeps its moment and is said in the new
   city's clock. The other answer re-anchors a default develop to the new city's 9 am, silently moving a time she may
   have chosen.
6. **The guest page's one read of the zone** (`readPartyZone`, service role, dated albums only, beside the door's and the
   gate's reads, never after them). The other answer carries the zone on `get_event_by_qr_token`: a DROP + CREATE of an
   anon RPC with its redaction (a gated album's zone hidden with its date) and edits to three files outside this lane.
   Worth it only if the read shows in the compute model.
7. **The search's other names**: a hand-kept table for about 80 zones ("Bali" finds Makassar, "Tuscany" finds Rome,
   "Cabo" finds Mazatlan, "India" finds Kolkata), matched to the browser's list by the zone each name resolves to. The
   other answer is city names alone, where a host planning a Bali wedding types "Bali" and finds nothing.
8. **On a phone the chooser moves no focus into its search** (the house popup's rule for a hand: no keyboard springs up
   uninvited); she taps the field. At a desk the search takes focus. Built as the house already does it.

Proposed for the Orchestrator (outside my owns, so untouched):
- `src/lib/shared/album-order.ts` (one of my `reads`) has two comments that are now false: `albumTurnAt`'s "★ `zone` IS
  THE READER'S, until the event keeps its own" (about line 196) and `GuestAlbumOrder.zone`'s "the reader's, for the
  browser to keep reading it in" (about line 292). Suggested words: "`zone` is the party's (`events.time_zone`, read on
  the page's server: `albumOpening`)" and "the zone the turn's 9 am was read in (the party's), a server-side input never
  handed to the browser (`AlbumOpening` carries the instant)". The Deferred line below folds the two types into one.
- `docs/systems/database-security.md`'s value-gates line could name `events_time_zone_shape` beside `events_qr_style_len`:
  an envelope, since the app reads the zone with its own `Intl`.
- ROADMAP lines 25 and 26 close ("See it as a guest lays the album newest first after the turn"; "the develop's 9 am is
  the host's browser zone, and the album's turn each reader's own").
- capture-time's Deferred line (ROADMAP 20, a zoneless Exif wall clock read in the party's zone): the conversion is one
  call, `fromZoneInput(bareWallClock, partyZoneOf(zone))` (`zone-words.ts`, DST-safe, seconds kept as of 9658878ef).
  The whole change is a few lines, not one: the complete route reads the zone (`readPartyZone(eventId)`, one read on
  the upload's hot path, which the compute model counts), and the claim has to carry the bare wall clock.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`, the album's order paragraph: the turn is one moment for every reader, the party's
  (`events.time_zone`, UTC the one fallback). The page's server reads the zone and hands the browser an instant, never a
  zone. See it as a guest is handed the same opening. Capture-time's facts are kept.
- `docs/systems/disposable-mode.md`, the host's control: the default develop is the party's 9 am, the morning its album
  turns (`developToKeep`). Far from home the develop time is the party's clock and names its place, and an instant is
  never moved by a zone.
- `docs/systems/host-app.md`: Create and its flow (the zone is captured, written where missing, and moved only by the
  chosen city), Settings (the far-from-home choice under the dates), and See it as a guest (its album in the guests'
  order; Sort answers nothing there).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: a develop time taken away while a guest has the album open is still obeyed until she reloads.
  `event-experience.tsx` hands the turn `liveDevelopsAt ?? event.develops_at`, and `useLiveUploadsWait` answers null both
  before the sync speaks and for "none"; tell the two apart (event-zone's review; the expression predates the lane).
- Host: the hub's own develop words (the head cover's "What your guests see until it develops tomorrow at 9 am", the
  cards) read her own clock; a party far from home could name its place there as Settings does (`zone-words.ts`)
  (event-zone).
- Engineering: `patchForStyle` (`album-style.ts`) and `defaultDevelopAt` (`reveal.ts`) read the browser's zone, so
  Create and Settings hand them the party's 9 am as the time to keep (`developToKeep`); taking the zone directly would
  retire that seeding (event-zone).
- Engineering: album-order's `GuestAlbumOrder` (a zone) and event-zone's `AlbumOpening` (an instant) are one idea in two
  types; fold the opening into album-order, its `zone` becoming `morningAfter` (event-zone).

## Handoff (replaces the chat report)

- **Commits, pushed:** the work is 3b9b56fdc (items 1, 2, 3, 5 and 6), 9a483d5f7 (item 4), 67c8541b4 (the docs) and
  9658878ef (the fresh-eyes review's fixes); the sync is ea3a6fb0e (`git merge origin/launch-prep` at 9b123769a,
  capture-time). launch-prep has since moved to e7ac98fee (credit-watch, crumbs-82, records). None of that touches a file
  of mine or the code in my `reads`, so per PROGRAM.md there is no second sync. The head is this manifest's commit (the
  chat line).
- **Gates on the synced tree at 9658878ef**, each on its own exit code: typecheck 0; lint 0; test 0 (1,027 files, 12,796
  tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3133` 0 (190 checks, 0
  failing). There is no board, so no lab:demo. Logs: `_scratch/event-zone/gate2-*.log`. An earlier full gate at
  67c8541b4 was green too (`gate-*.log`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 50 owned paths plus this file, with six exceptions
  (one or two lines each):
  - `src/components/guest/event-experience.tsx` (no lane): the `albumOrder` prop's type becomes `AlbumOpening` (an
    instant, never a zone), and the hook's call takes `developsAt` instead of the days. The instant had to pass through
    it.
  - `src/app/(as-guest)/dashboard/[eventId]/as-guest/page.tsx` (no lane): one prop, `albumOrder={read.albumOrder}`.
  - `src/app/(guest)/e/[token]/card/card.test.tsx` (no lane): one mock of `@/lib/event/zone.server`, since it imports
    the page.
  - `src/lib/db/mutations/events.test.ts` and `src/lib/reel/defaults-action.test.ts`: one mock each of the reporter the
    event write now imports. The manifest owns `events.ts`, and its test file falls outside the literal prefix.
  - `src/lib/disposable/reveal.ts` (no lane): one header sentence that had become false (that the host's control
    computes the default in her own zone).
- **The items:**
  1. One moment for everyone. `events.time_zone` comes in `supabase/migrations/20261005220000_event_zone.sql`:
     nullable, under the envelope CHECK `events_time_zone_shape`, with the host's additive insert and update grant, and
     nothing in the database reads it. The guest page reads it on the service role (`src/lib/event/zone.server.ts`) and
     hands the browser `AlbumOpening.morningAfter` (`zone-morning.ts`); the hook turns at that instant
     (`gallery-order.ts`). The pin, red on the old page: `page.first-paint.test.tsx`'s "★ one moment for every guest" (a
     party in Auckland read from Los Angeles and London gets one instant; no zone in the payload).
  2. Captured, never asked. Create sends `captured_zone` (`add-step.tsx`'s `fields`). The schema field is lenient and
     never refuses (`validation/event.ts`). The write stores the zone where readable, else none plus a Sentry warning
     (`storedZone`). A Settings save of a time carries her zone to a zoneless row (`capturedZoneFor`), filled under
     `time_zone is null`. Pins: `zone-writes.test.ts`, `settings-state.test.tsx`, `add-step.test.tsx`,
     `validation/event.test.ts`.
  3. The develop's 9 am is the party's: `developToKeep` and `developDefaultIn`, in Create and on the camera page. Pins:
     `zone-morning.test.ts`, the far describe in `camera-settings.test.tsx`, and add-step's Auckland case.
  4. A party far from home is built (Questions 4, 5, 7, 8): `party-zone.tsx`, `zone-places.ts`, `zone-words.ts`, and
     the camera page's far words and field. Pins: `party-zone.test.tsx`, the zone-places and zone-words tests, and the
     far describe in `camera-settings-develop-time.test.ts`.
  5. See it as a guest gets the guests' order: `readAsGuest`'s `albumOrder` (the seed's first-paint sort and the
     view's order). Pins: `as-guest.server.test.ts`'s "★ it lays the album in the order every guest meets", and
     `as-guest-view.test.tsx`.
  6. The edge cases, each a test: a range (its last day); both clock changes in Los Angeles and Auckland; Auckland read
     from Los Angeles and London; an unreadable zone (refused in words as a chosen city, dropped and reported when
     captured, the fallback on a read); a row without a zone (UTC); a disposable (the develop wins); a date edited from
     another zone (the zone never moves: `zone-writes.test.ts` and step 4 of the SQL check).
- **The rolled-back SQL check**, live through the Supabase MCP, 2026-10-06 about 01:00Z:
  - Drift first: no `time_zone` column, no such constraint, 155 events, nothing names the column.
  - RED: fixtures ok; steps 1 to 4 red on the missing column.
  - GREEN, with the file's statements between `begin;` and the block: all five steps ok, the CHECK printed as
    `CHECK (((time_zone IS NULL) OR (((char_length(time_zone) >= 1) AND (char_length(time_zone) <= 64)) AND (time_zone ~
    '^[A-Za-z][A-Za-z0-9_+/-]*$'::text))))`.
  - Afterwards nothing had persisted: no column, no fixtures.
  - `get_advisors` runs after the apply (the Orchestrator's, the header's step 3); expected delta: none.
- **The walks**, local on 3133, in a headless Chrome of my own (`scripts/compute-model/chrome.mjs`):
  - The album: my own disposable one, "Event zone walk (disposable)", `4c529616-a01e-4a90-a337-097cd78e25c8`, token
    `927dd0b9fdea4d12a0a35f8efb882b73`, willg97's, four photos through `seed-demo-event.mjs`, and a name-only ticket
    ("Zone Walker") from `create_guest`.
  - The readers: Pacific/Kiritimati and America/Los_Angeles, each through Vercel's header and
    `Emulation.setTimezoneOverride`, at 375 and 1440.
  - Dated 2026-10-05, the turn was 2026-10-06T09:00Z for all four reads, newest first. Under the old rule the Kiritimati
    reader would already have been turned.
  - Dated 2026-10-04, the turn was 2026-10-05T09:00Z for all four, in order.
  - No zone in any page, and curl as three readers on the final tree gave one instant.
  - Before the apply the zone reads null (the column is missing), so the instant shown is the fallback's.
  - The Library's Settings specimen at 375 and 1440, as a host in Los Angeles, showed the quiet question, the chooser on
    her own zone, "bali" finding Makassar, "On Makassar time · 9:20 AM there now", and on the camera page "Develops Sun,
    Oct 11, 9:00 AM in Makassar." with the field at the party's 09:00.
  - Captures: `_scratch/event-zone/*.png`.
- **For the Orchestrator's desk walk** (port 3000's sign-in), after the apply:
  - Create an event: its row's `time_zone` is the browser's zone.
  - Settings' date save on a zoneless event fills the zone; the same save from an emulated other zone on a zoned event
    leaves it as it was.
  - The far-from-home choice on a real event writes `time_zone`, and the camera page names the place.
  - See it as a guest on a dated album past its morning shows it in order.
  - Give the walk album a zone (`update public.events set time_zone = 'Pacific/Kiritimati' where id =
    '4c529616-a01e-4a90-a337-097cd78e25c8'`) and read it from two zones: one instant, the party's.
- **Assets requested from Will:** none.
- **Board ideas:**
  - Guests: a far party's guest page could say a develop time in both clocks ("9 am in Bali, 6 pm yours") where the
    guest's zone is not the party's.
  - Host: the chooser could open on the cities her past events kept, a host who travels for parties starting where
    she last was.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** `20261005220000_event_zone.sql`, with the Advisor
  reading it first. Apply it before the alias build that carries the lane, since its Create inserts the column. Then
  regenerate the types and retire the seam: `zoneOfRow`, `withZone`, and the untyped `select("time_zone")` in
  `zone.server.ts`.
- **Calls his to overrule:** Questions 1 to 8 above.
- **Look at first:** `page.first-paint.test.tsx`'s "★ one moment for every guest" describe with `zone-morning.ts`; the
  migration's header; and the Library's Settings specimen (This event, then "Party in another time zone?").
