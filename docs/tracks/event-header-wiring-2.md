---
track: event-header-wiring-2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/event-feed/event-hub-head
  - src/components/app/event-feed/event-cards-row
  - src/components/app/event-feed/room-card
  - src/components/app/event-feed/reel-card
  - src/components/app/share/event-code-door
  - src/app/globals.css
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - docs/reviews/brand.json
  - src/app/(dev)/design/sandbox/brand/spec.ts
  - docs/systems/host-app.md
  - docs/systems/design-system.md
---

# lp/event-header-wiring-2

**Goal.** The hub's cards as Will picked at event-header r6: the Seam made Afterglow's own, each count a badge on its glyph's shoulder only where it needs her, one 'needs you' colour (tally) worn by the badges, their pills and the code's corner; then the board retires.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/event-header.json` round 6):** card = shoulder, attention = tally; and brand r2's take = aperture (`docs/reviews/brand.json`), which settles the board's Paper knob. Wire event-header r6 into production's hub exactly as the board draws it: `src/app/(dev)/design/sandbox/event-header/` (`seam.tsx`, `cards.tsx`, `cards.css`, `edge.ts`, its spec's opening, terms and carried calls) is your spec.

- **The Seam, as r6 corrected it** (a correction he saw, never an ask): the edge's own colours, sixth by sixth, pooled in three soft ellipses and crossing with each photograph, at the brand's reach (120 px at a desk, 72 in a hand, full strength); the cards standing on the cover's foot so the light falls past them into the page and nothing pressed sits inside it; the cover's scrim lifted at its foot so the edge the light is born at is seen; the fold never flashing it; on paper no light at all, Aperture's form: a strip of the room (the board's Paper knob at `aperture`).
- **card = shoulder:** the count a badge on the glyph's shoulder only where it needs her or is hers to act on (Review's waiting, the door's asks); every other glyph bare, its line its words; 99+ in the badge alone, the accessible name keeping the whole number ("Review: 140 waiting").
- **attention = tally:** one status token, "needs you": the camera's red the palette already holds (the live mark's), solid and hard-edged, never a light, worn by every waiting count (the badges, their pills when folded, and the code's corner, `EventCodeDoor`, whose retired waiting amber it replaces, closing the ROADMAP's Design line on it). One home in `globals.css` for both grounds; the Seam stays the screen's one light. A brand-marks board (desk 6) draws the whole status set next with this token given, so name it plainly.
- **The carried calls, every one taken (he overruled none):** the cards on the cover's foot; a hand's one row of five tiles (glyph, count, short word); 99+ in the badge alone; the folded band's ends (the face left, the code a pill right, the doors between); every glyph ink, the reel's too; a tablet's five tiles across (640 to 1088); the fold dissolving over 150 ms under reduced motion, nothing travelling; Settings' card saying Paused while uploads are paused.
- **The edge's colours in production:** the board reads each still's bottom edge at runtime (`edge.ts`); production may read at runtime or at upload (the ROADMAP's Upcoming "the Seam's edge sampler as production code" line). Choose by correctness and cost (a canvas read of an R2 image needs CORS on its origin; the cover's crop changes per width; a still not yet read needs a quiet stand-in), name the cost per hub view, and if it takes a column, write that migration only as a proposal for the Orchestrator (no schema change rides this lane unasked).
- **Retire the board** once its picks are built: delete `src/app/(dev)/design/sandbox/event-header/` (check that nothing else imports it; `registry.test.ts` and `pnpm lab:smoke` stay green); its ledger is the Orchestrator's to delete at the record.

**Nearby lanes this wave (never edit their paths):** the Guests room and its rows (host-moments-wiring), Create (create-wizard-wiring), the album's arrivals (album-moments-wiring). `globals.css` is yours alone this wave: a token another lane needs is named in your Handoff.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** the hub signed in on your port, each card at rest and folded at 1440, 820 and 375, in the room and on paper; a reversal mid-fold; a peak at 99+; Tab through the cards and the pills; the code's corner counting the door's asks in tally; reduced motion.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The Seam's colours: read at runtime or stored at upload?** Recommended and built: at runtime, in the browser
  (`event-hub-head-light.tsx`, its maths `event-hub-head-edge.ts`). The cover's crop changes with its width and its
  height (a long name grows it), so a colour stored at upload is one crop's guess; upload would also need a column, a new
  argument on the SECURITY DEFINER insert, the manifest's wire, and a backfill no server can decode. Correct by
  construction at runtime: each cover preview read once a page (CORS, `no-store`, `decodeImage`), drawn 192px wide,
  its edge re-read from that copy at every size with no new request. Cost per hub view: at most six preview GETs of
  about 16KB (R2 Class B, $0.36 a million past the free ten million a month; egress free; no Vercel CPU, no database),
  the first at once and the rest at idle; a photograph without a preview (its tile is the full original) is never read.
  No migration. ROADMAP's Design line on "the Seam's edge sampler as production code" is closed by this.
- **What the Seam wears before (or without) a read.** Built: unlit until the first photograph is read, then the light
  arrives once over 1.2s (a throttled phone stayed quietly unlit ~25s, never a wrong colour); an unread or unreadable
  photograph borrows a read one's light; a cover with no photograph, or none whose preview can be read, wears the house's
  dusk (Afterglow's light before a photograph); every preview refused warns once a page (`hub_light_unread`, Sentry,
  area `media`), since a refused origin would otherwise dim every hub silently.
- **Stuck pills from 640 to 800px.** The board's pills (124px, glyph and word) need 788px of band, so a 768px iPad held
  upright would run the band off its edges. Built: from 640 to 800 a pill is its glyph and its badge in a 56px slot
  (production's own threshold for the word); the word joins it from 800. A hand's slots (under 640) are the board's.
- **The hub's loading skeleton follows the new geometry.** `src/components/shared/route-skeleton.tsx` is no lane's; left
  as it was, the album would jump by the Seam's reach as the page streamed in. Built: its HubSkeleton draws the row and
  the light's box in the row's own classes (`hub-row`, `hub-band`, `hub-doors`, `hub-light`), importing their sheets,
  so it can no longer drift (a lane-check exception, below).
- **The door's face flag `amber` renamed `needs`.** The colour it named is retired; the flag means "needs her" now and
  wears `--needs-you`. One line in the Library's demo (`composition-demos.tsx`, `HUB_CARDS`) followed (a lane-check
  exception, below).

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the head's foot (the cards on it, the Seam born at its edge, the numbers the cover, the row
  and the light share, the hub's own scrim); a new bullet for the Seam's colours (read at runtime off the visible crop,
  previews only, the stand-ins, the one clock); the code's corner in the needs-you status; the cards row (the shoulder
  badge and its cap, the widths 640/740/800/1088, the fold's cascade, reversal and reduced-motion dissolve, the band's
  ends and material, the skeleton).
- `docs/systems/design-system.md`: one bullet for the `--needs-you` token (what wears it, its values per ground, never a
  glow, no utility).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Design: the dashboard's waiting marks (`dashboard/marks.tsx`, `events-row-list.tsx`, `event-card.tsx`) and Review's
  own section count (`event-feed/review-section.tsx`) still wear the waiting amber; a count that waits on her is
  `--needs-you` now (event-header-wiring-2).
- Library: the hub-cover specimen (`HubCoverDemo`) draws the cover without its row, so the foot's clearance for the
  cards reads as an empty band; draw it with the row, as `HubBandDemo` does (event-header-wiring-2).
- Design: the band's code pill arrives without the fold when the cover's code leaves the screen after the band has
  stuck (its sentinel reports a beat later), so it pops in; fold it in on its own arrival (event-header-wiring-2).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/event-header-wiring-2`:** `cd9de136a` (the work) and `01aab3748` (Aperture's strip in the
  room's own surfaces, the page's kept reads bounded, the Seam named in design-system.md's light section); this manifest
  is the head. No sync: launch-prep moved only by record commits since the cut (`e6fa3cc8f` to `82eba7047`: PROGRAM,
  ROADMAP, STATUS, tracks).
- **Gates on `01aab3748`, each on its own exit code:** `pnpm typecheck` 0 (`zsh scripts/build-lock.sh`); `pnpm lint` 0;
  `pnpm test` 0, 1,059 files and 13,339 tests, run with the component setup's dummies exported
  (`NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key`, the
  Orchestrator's word: six node files fail at import without them, on launch-prep's tip too); an earlier run under a
  load average of ~50 timed out 37 unrelated component tests at 5s and the rerun was clean; `zsh scripts/build-lock.sh
  pnpm build` 0, no warning; `pnpm lab:smoke --base http://localhost:3131` 0, 222 checks (scope all: globals.css).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned prefixes (page.tsx, `event-hub-head*`
  with the new `-edge` and `-light`, `event-cards-row*`, `room-card*`, `reel-card.test.tsx`, `event-code-door*`,
  globals.css, the board's folder, deleted) + this file + the system docs (host-app.md, design-system.md, record
  subtractively) + two exceptions: `src/components/shared/route-skeleton.tsx` (no lane's; its HubSkeleton now draws the
  row and the light's box in their own classes, or the album jumps by the Seam's reach as the hub streams in: Question
  four) and one line of `src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx` (`amber: true` to
  `needs: true` in `HUB_CARDS`, the face flag's rename: Question five).
- The Seam made Afterglow's: the cards on the cover's foot, the photograph running on under them (14 / 20px) to its own
  edge, the light falling from it at the brand's reach (72 / 104 / 120px) in the room and in Aperture's 30 / 36px strip
  of the room on paper, the album 8px past it; measured at 320 to 1440 (`walk/*.json` in the lane's scratch).
- The light's colours: each cover preview read once a page (CORS, `no-store`), its edge re-read at every cover size
  (`event-hub-head-edge.ts`), previews only (the Scale probe's 1,200 preview-less photographs: 0 R2 reads, the house's
  dusk); on the cover's own clock (slot animations' `currentTime` equal to the stills', 6,433ms both); held to the first
  under reduced motion.
- The cover's scrim lifts at its foot on the hub alone (`.hub-seam [data-event-head="hub"] .head-scrim`); the fade
  into the page is gone.
- `card=shoulder`: Review's waiting and the door's asks a badge on the glyph's shoulder in the status, capped at 99+
  ("Review: 130 waiting" in the name, walked); Settings' steps left and Paused a quiet badge on a hand's tile and a
  pill only (walked paused at 375); every glyph the ink, the reel's too; the line in the ink when it names what waits.
- `attention=tally`: `--needs-you` and `--needs-you-foreground` in globals.css for paper and the room (white figures
  5.18:1 and 4.64:1), worn by the badges, the pills and the code's corner (its amber gone; lock and count in tally
  measured on the Library's specimen); the corner takes the house's halo. **Another lane needing the status names these
  two tokens** (no Tailwind mapping: `bg-(--needs-you)`).
- The carried calls: a hand's one row of five tiles (titles whole at 320, 10.5px there); a tablet's five tiles from
  640, the long names from 740; the band's ends (face left, its name truncating to its column from 1088, code right as a
  pill of the band's material); reduced motion dissolves the band's contents over 150ms (measured: lead and doors,
  opacity only); Paused on Settings.
- The fold: Review first, 12ms a step out (measured 0 / 12 / 24); a reversal 110ms in starts from where each skin is
  (heights 43 to 53px mid-flight), fixed in this lane (the board and my first pass cancelled the flights before reading).
- The board retired (`src/app/(dev)/design/sandbox/event-header/` deleted; nothing imported it; `registry.test.ts` and
  lab:smoke green); its ledger (`docs/reviews/event-header.json`) is the Orchestrator's.
- Tests reshaped on purpose, scars kept: the compact `1.2K` numeral (now the badge's 99+), the reel's violet (now the
  ink), the flip-at-once under reduced motion (now the dissolve), the cover's fade sibling (now none). Deleted: "the
  light that follows the pointer"
  (r6's sheet drew none: the Seam is the screen's one light). New: `event-hub-head-edge.test.ts` (17),
  `event-hub-head-light.test.tsx` (9, the cover's `HOLD_SEC` read from its source), the row's light, ends and cascade.
- **Test data, listed for deletion:** willg97's event `6ab7f2fa-9600-4256-90c6-32a2ad9b7e6f`, "event-header-wiring-2
  (disposable)" (136 seeded photos through `seed-demo-event.mjs`, moderated, 105 in Review, door approve, uploads
  paused, dated 2026-10-04).
- Assets requested from Will: none.
- Board ideas: the guest album's cover could end on the same Seam past its actions, so a guest's first screen wears the
  hub's one light; the board's head drew the when as one quiet line over the name and the link under the code (since r2),
  where production keeps the line of date, guests, views and Live under the title with the link under it: worth asking
  whether that drawing was ever meant to be wired.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the edge is read at runtime: no column).
- ROADMAP for the record: the Design lines "the Seam's edge sampler as production code" and "the hub code's corner count
  ... still wears the retired waiting amber" are done; the three Deferred lines above are new.
- Calls his to overrule: the runtime read (Question one); the stand-ins (two); pills without their word from 640 to 800
  (three); no light following the pointer and no hover lift on a card (r6's sheet drew neither); the waiting badge keeps
  its tick-down on return; a tablet's tile line truncates from 640 to 739 ("Private · You let in", whole in the name);
  the band's name truncates to its column from 1088 to about 1250.
- **Walks I could not drive (for the desk):** the code's corner counting a real ask at the hub's door in tally (an ask
  needs a confirmed account waiting at an approve door; the kit refuses hi@willgibs.com, which holds a second factor,
  and a lane creates no account); a real phone's thumb on the hand's slots.
- Look at first: the hub at 1440 in the room on a cover of real photographs (the Seam in the edge's colours under the
  cards), then 375 on paper (the strip of the room), then scroll for the band and Tab through it.
