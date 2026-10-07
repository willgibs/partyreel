---
track: album-moments-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e094108"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/shared/arrival
  - src/components/shared/arrival.css
  - src/components/shared/use-arrival-gate
  - src/components/shared/album-window
  - src/components/shared/album-tile
  - src/lib/shared/album-window
  - src/lib/shared/album-rows
  - src/components/guest/guest-upload
  - src/components/guest/upload/
  - src/components/guest/gallery-rows
  - src/components/guest/live-gallery
  - src/components/guest/event-experience
  - src/components/guest/reel/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/guest-moments.json
  - src/app/(dev)/design/sandbox/guest-moments/spec.ts
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - docs/systems/disposable-mode.md
---

# lp/album-moments-wiring

**Goal.** Three beats of a guest's night as Will picked at guest-moments r1: her own photo glowing as everyone's, a short toast when her send has landed, a batch landing whole in its places, and the reel opening on its first photograph.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3134 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-06; `docs/reviews/guest-moments.json` round 1):** own = glow, batch = settle, opening = still. The board (`src/app/(dev)/design/sandbox/guest-moments/`) draws each on production's own album, rows engine and arrival lights: that drawing is your spec. Its limit and where are camera-wiring's.

- **own = glow:** her own photo, landing on her phone, wears the same rim and wash as any arrival (2 s): one light for every photo new to the album, on her phone as on the host's. The sweep retires (`arrival.ts`'s "your own never glows, it sweeps"; reshape its test with the scar of why). His note: "I'm not sure we need to mark guest uploads to avoid crowding gallery view, and marking the first specifically makes it easy to get lost in the gallery when more uploads follow. If we can pop up a temporary toast, whether when their uploads begin landing or the last one completes (your call, and we're always open to even better ideas you may have), that's likely enough for them to feel confident about the upload success and go find their media in the album if they'd like."
- **The send's toast (the Orchestrator's call on his "your call", his to overrule):** when a send's last photo has landed, one short toast says what landed in that album's truth, never at the start (the stack already shows a send while it runs): in a Live album how many are in, with a press that shows hers (the album's Yours view); in a Review album that they went to the host to approve (her stack is hidden there and approval already says "One of yours is in the album" later); a send with refusals keeps today's failure sheet and the toast counts only what landed. It reverses `guest-upload.tsx`'s "No upload toasts" (an error toast has usually gone by the time she looks): keep that reason for errors, which stay in the sheet's Retry. A better idea than a toast is welcome as a Question with a drawing in your captures.
- **batch = settle:** each photo of a batch is whole in its place from the first frame its place opens, glowing; the neighbours still glide; it waits for its slowest photo at the gate that already waits for each to draw (2 s at most): never an empty place at the top (carried call BM3: the glow stays on others' photos).
- **opening = still:** the reel's curtain is its first photograph, already on the page as the cover (`event-experience-head.tsx`'s `CoverStills`, slot 0 eager, `pickCoverIds` the reel's own opening), standing at once with Close beside it; the reel starts from it; a reel opening on a video uses its poster; a sealed album (no stills) keeps a quiet dark with Close. Fold in the ROADMAP's two curtain lines: a returning guest's hard `?reel` on a slow link painting the album's head before the black (the curtain placed before the head, from the first byte), and the hub's Reel card leaving its owner on black with no ceiling (a seed or view chunk that never lands).

**Nearby lanes this wave (never edit their paths):** the camera and its roll (camera-wiring), the hub (event-header-wiring-2), `globals.css` (event-header-wiring-2's alone: name a token you need in your Handoff).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`; a local red-team of every surface you change, antagonistic (the error cases, the cross-tenant and abuse paths, malformed input, a throttled network, reduced motion, Tab with the halo, a screen reader's names), at 375 and 1440, in the room and on paper where both exist; the walks you could not drive listed for the desk. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired.

**The walk for this lane:** on your port, two guests and the host on one Live album: her send of six landing (the glow, the toast, its press), a send with one refused, a Review album's send, a batch of others' landing at the top on a throttled line, the reel opened from a shared link and from the hub's Reel card on a slow line, a sealed album's reel.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

- **Q1. The send's toast says what landed in the keep's own words, with Show yours.** "Your 6 photos joined Maya's
  album." (a Live album), "Your photo develops as Maya lets it in." (Review), "Your 2 shots develop with everyone's at
  9 am." (a develop time ahead), in the singular for one and "uploads" for a mix (`keepSentLine`, one name for each
  fate wherever it is said). *Recommend: as built.* (Alternative: a shorter "6 in the album".)
- **Q2. Where hers wait (Review, a develop ahead), Show yours opens her uploads** (where they stand, "Developing"); in
  a Live album it turns the album to Yours and brings it into view. The brief named no press for Review. *Recommend:
  as built*, so every toast has the one way to go find her media.
- **Q3. A send with a refusal speaks twice at once, as briefed:** the failure sheet ("1 of 2 didn't upload",
  "Everything else is in Maya's album.") and the toast counting what landed, in the same second (walk 2). *Recommend:
  as built*; the alternative is the toast waiting for the sheet to close, or the sheet's Everything-else line standing
  down where the toast says it.
- **Q4. Where the toast stays quiet, and is spent:** the door's keep (a signed-out guest's first send: its "Sent" line
  says it, live as the rest land), the door's own upload step, the camera while it is open (its own words), and the
  reel's view (its arrivals name her). A camera's run that ends with the camera closed does toast ("Your 3 shots
  develop ..."). *Recommend: as built.*
- **Q5. The demo's toast has no press** (its photographs are nobody's, so it has no Yours). *Recommend: as built.*
- **Q6. The opening still holds still** where the board drew a slow push on it: the page's curtain and the view are
  two elements with no shared clock, and a push begun on one restarted on the other at the hand-off. *Recommend: as
  built* (the reel's own motion starts with its first frame).
- **Q7. While the reel opens, Close stands and the dock waits** (the board drew Close alone), and the controls'
  first-sight beat runs from the first frame on screen, not from a press made a second earlier. *Recommend: as built.*
- **Q8. The curtain's ceiling: 12 s, "The reel is taking a while." with Try again** (the page asked again) beside
  Close. *Recommend: as built*; a seed, the view's chunk and the first stills all fit inside it on a slow phone.
- **Q9. Opened from the cover's round, the reel opens on the cover's slot 0** (the brief's "slot 0"), even when the
  cover's dissolve shows another of its six at the press (walk 12 pressed during "…2" and opened on "…3"). *Recommend:
  as built*; the alternative (the still the cover shows at the press) is a board idea below.
- **Q10. A batch past the fetch cap (12) waits, unfetched, with its batch** rather than going straight in, and reduced
  motion holds a batch too (let in at once there, it stood as grey places for 150 ms, walk 10). *Recommend: as built.*

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the arrival grammar (one light, her own glows and never waits; a batch lands whole at
  its slowest; the settle's lift; the hold under reduced motion), the send's toast (a bullet in the upload section),
  the live reel's curtain (the first photograph pinned, Close, the in-place modal, the ceiling, the memoized seed
  boundaries).
- `docs/systems/reel.md`: the view opens on its first photograph (the pin, `opensOn`, the crossfade, the quiet dark);
  the Reel card's soft navigation now meets the photograph with Close, not a black.
- `docs/systems/design-system.md`: "An arrival pushes" refined in place to "An arrival settles" (this lane's change
  to a fact that lives there).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming · The host app: Hub: the Reel card shows nothing while its soft navigation is pending (13 s to the curtain
  on a 120 KB/s line, measured by album-moments-wiring's walk 6); `useLinkStatus` could dim it. (The half of the
  reel's-black ROADMAP line the curtain's ceiling did not close; the other half and the hard-`?reel` line are done.)

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/album-moments-wiring`:** `f3dbae593` (the four picks), `7050f8d55` (the walk's fixes: one
  pinned opening photograph, no hydration blink, the settle under reduced motion), `879bbfd5e` (the curtain an in-place
  modal), `60c46a3d7` (the system docs), then this manifest. **No sync:** launch-prep moved (account-, create-wizard-,
  event-header-, camera- and host-moments-wiring, records, the vitest env fix `e949f5501`) and none touched a file of
  this lane; the one read that moved, `disposable-mode.md`, changed only the camera's roll (PROGRAM.md's sync rule).
- **Gates on `60c46a3d7`, each on its own exit code** (logs in `_scratch/album-moments-wiring/`): `pnpm typecheck`
  exit 0 (`gate-typecheck.log`); `pnpm lint` exit 0, no warnings (`gate-lint.log`); `pnpm test` exit 0, 1,059 files,
  13,342 tests (`gate-test.log`), run with the env dummies exported (`NEXT_PUBLIC_SUPABASE_URL=https://test.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=test-publishable-key`, the Orchestrator's word until a sync brings `e949f5501`);
  `zsh scripts/build-lock.sh pnpm build` exit 0 (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3134` exit
  0, 225 checks, 0 failing (`gate-labsmoke.log`). No board: no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths, this file and the three system docs
  above, plus these exceptions, each the retired sweep's or the opening's reach into a file no lane owns:
  - `src/components/shared/masonry.tsx`, `masonry.test.tsx`: the grid's `landedIds` seam (the sweep's set) and its two
    pins go; one light, one set.
  - `src/components/app/host-media-grid.test.tsx`: the shared gate's two reshaped pins (the overflow waits with its
    batch; reduced motion holds), on the host's album that runs the same gate.
  - `src/components/marketing/sections/shared/arrival-light.tsx`: the site's pictures of a landing wear the one light
    (the sweep's CSS is gone; `kind` stays as whose landing a picture shows, `data-arrival-kind`).
  - `src/components/guest/gallery-empty-state.css`: one comment line that named the retired `data-landed`.
  - `src/lib/reel/live/source.ts`, `source.test.ts`: `opensOn`, so the take leads with the photograph standing (three
    lines and two pins; the fix at its source, the cover keeping its deal while the take re-plans).
  - `src/app/(dev)/design/album-scale/album-scale.tsx` and `src/app/(dev)/design/sandbox/guest-moments/album.tsx`: the
    sweep's number leaves the dev scale page, and the guest-moments board keeps its own for its drawing of the option
    that lost (the board retires once this lane and camera-wiring are both in: all five of its asks are wired).
- **The items:**
  - own=glow: her own photograph glows (2 s) as anyone's, on her phone as on the host's; `arrivalMarks` takes hers out
    of what waits at the door, the gate lights hers the moment it stands; the sweep retired everywhere it was drawn.
  - batch=settle: one answer's arrivals are one batch, let in whole at its slowest photograph (2 s at most from
    intake); the newcomer stands whole, lifted over the neighbours gliding out of its place (`data-entering`, the grid
    `isolate`d); the host's album the same; reduced motion holds too.
  - The send's toast (`upload/send-toast.ts`, at the page) with Show yours (`live-gallery-lens.ts` turns the album to
    Yours and brings it into view; her uploads where hers wait); errors stay the failure sheet's.
  - opening=still: the curtain is the page's first child (before the head, from the first byte), the cover's slot 0
    pinned for the view and the take, a quiet dark where the album has none, Close that works before the album or the
    page has arrived, Escape, a 12 s ceiling with Try again, an in-place modal; the view stands the same still with
    Close until its first frame, the dock waiting, the take opening on it.
  - Found on the walk and fixed: the cover's stills (and the curtain's) blinked out 100 to 450 ms as the page hydrated
    over a seed already streamed (the seed boundaries memoized, an arrived Flight seed read at once; this was
    production's cover too).
- **Walked locally on :3134** (ledger `_scratch/album-moments-wiring/rt/ledger.txt`, captures beside it): two guests
  and the host on one Live album (Priya's six glowing and standing; her toast and its press; a send with a `.txt`
  refused; a Review album's send and its press to her uploads; Theo's batches on a throttled line (96 KB/s) and an open
  one, filmed at the settle; the host's hub album taking a batch); the reel from a shared link (the still at 188 ms, the
  view on the same still, its first frame at about 1 s, five loads with no blink), from the hub's Reel card on a slow
  line (120 KB/s: the curtain with its still and Close in its first frame), from the cover's round at 1440, and a sealed
  album's (the quiet dark with Close, gone as the album dropped `?reel`); the ceiling (the view's chunk held: 12.2 s);
  Tab and Escape on the curtain; reduced motion; the accessibility tree with the curtain alone and with the view.
  **Not driven, for the desk:** a real phone's slow line and its haptics of the toast; VoiceOver itself (the AX tree
  was read, not a spoken pass); Safari's hydration of the in-place curtain.
- **Test data, listed for deletion** (willg97's, made through an RLS insert as `createEvent` makes them, media through
  the product's own uploads): events `be95e898-70e7-4186-9689-bf677306a085` ("album-moments-wiring (disposable)
  Live", 40 photographs, six guest rows), `def11cbb-aa37-4cc7-977f-2bfc6ce4c3ef` ("… Review", three pending, one guest)
  and `883a6edc-0135-4f2d-b947-b90ed75a92bc` ("… Sealed", no media, one guest).
- Assets requested from Will: none.
- Board ideas: the reel opened from the cover's round could open on the still the cover shows at that instant (its
  dissolve's phase), not slot 0 (Q9); the send's toast and the failure sheet's "Everything else" line could be one
  voice where both speak (Q3).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: Q1 to Q10 above, each built as recommended.
- **Look at first:** Priya's phone on a Live album, a send of three (the glow on each, the toast at the end, Show
  yours); then a shared reel link (`/e/<token>?reel`) on a throttled line: the first photograph with Close from the
  first frame, the reel starting from it.
