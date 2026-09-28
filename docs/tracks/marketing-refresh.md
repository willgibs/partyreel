---
track: marketing-refresh
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: album-motion
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/sandbox/loose-ends/
  - src/app/(dev)/design/sandbox/press-page/
  - src/app/(dev)/design/sandbox/site-chrome/
  - src/app/(dev)/design/sandbox/profile-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/marketing-refresh

**Goal.** Refresh `album-motion`'s `fall` against the album's real arrival, `loose-ends`' `review-photo` and `press-page`'s `who-for`; move `hero-tablet` off loose-ends to hero-card round 2; retire `site-chrome` and `profile-page`, whose open asks Will's built picks already answer.

## The brief

**A refresh, not a new round.** Keep each board's `round.n`, and say in `round.changed` what moved. Change only the asks named below: every other ask keeps its id, question, options, recommendation and drawing exactly, because Will may be answering those on build 12 while you work, and his answers must still transcribe. Where a frame draws production, draw production as it is at your base: open the files, never trust a spec's own claim about "today" (a read-only audit on 2026-09-28 found the drawings below out of date; each finding cites its evidence, check it before you build on it). Offer the fix at its source, and keep every road an option still holds. Your boards' `touchpoints.ts` rows are yours (their text, `asks` and `lives`; nothing else in that file). `node usher/kit/board-card.mjs <board>` prints what a board asks. Author with `defineExploration` as the boards already do.

**album-motion `fall`** (stale since milestone 29): its context and the case for `bloom` rest on "a real arrival grows into its column under a fading glow". Milestone 29 replaced that in both albums with album-columns r2's `arrival=push` (album-rows `30ac9b74`, album-window `eefe54d7`, retire-album-columns `70e634a6`): a new photo opens its row from the left edge, clipped rather than scaled, and only the glow fades (`src/components/shared/arrival.css`). The hero's album stage also still draws `GuestMasonry`, which the real album dropped for rows. `stream-engine.ts` still ships `glide`. Re-grade the four falls, plus one that opens its row, against the push, on a stage laid out in rows.

**loose-ends:**
- `review-photo`: the board's own 09-21 reshape dims the queue tile and adds a clock badge in every option, `today` included. Production's `review-switch.tsx` draws neither, and `rings` is recommended for legibility under that dim. Draw `today` undimmed, as production is, or name the dim and badge in `lands`.
- `hero-tablet` leaves this board: it sized the hero around an object hero-card is replacing. `hero-r2` draws every card option at 900 and owns that question now. Remove the ask and its drawing.
- **Untouched:** `chart-light`, `chart-dark`, `faq-look`, `phone-cycle`, `everywhere-pill`.

**press-page `who-for`:** one false clause. /contact's topic has read "Press & partnerships" since 08-28 (`src/lib/constants/contact.ts`), not "a Press topic but no Partnerships one" (`spec.ts`), and that bears on `two-doors`. Fix the context before it is asked. The other six asks are untouched.

**Retire two boards**, one commit each or together: their folders, and their lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (the `RULINGS` rows, `SandboxId`, `DESK_ORDER`; named exceptions). Their ledgers are the Orchestrator's to delete at the record.
- `site-chrome`'s three r2 asks are answered by Will's reel-story notes, built at `9277f933` and `77cfdfe9`:
  - `foot-after`: the photo pile is back under every close, and the demo link sits in the credit's place;
  - `foot-alone`: staged on it, it now draws one footer either way;
  - `foot-phone`: a phone's demo door is the link itself, in a new tab.
- `profile-page`'s two:
  - `way-back` is answered by popups `peek=card`: a name opens a quick look in place, with "Open full profile" one deliberate tap away (`src/components/social/guest-peek.tsx`);
  - `head` was answered `guest` in round 1 and is built (`/u/[slug]` mounts `GuestHeader`); round 2 reopened it only for way-back's pill.

Name any production gap you see in your Handoff; don't fix it here.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board (`album-motion`, `loose-ends`, `press-page`) at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board album-motion --base http://localhost:<port>`; `pnpm lab:demo --board loose-ends --base http://localhost:<port>`; `pnpm lab:demo --board press-page --base http://localhost:<port>`, each pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The push draws from the head's side only?** Recommended and built: yes, the left. A newest-first album opens top
  left, so every frame lands over the head; one born on the right would cross under the words, or go in where nothing
  opens. Carried on the board (`call:side`). If he says both sides: `LANES` in `album-motion/push-engine.ts` gains the
  mirror, every frame still opens the head, and a right-hand photograph reappears on the left.
- **The stage's rows laid plain, without the guest album's `double` rhythm?** Recommended and built: plain
  (`rows-hero.tsx` mounts the one grid in `layout="rows"` with no rhythm). The stills are all landscape, so a feature
  row turns up often, and on a stage two rows tall it is one photograph. Carried (`call:rows`).
- **The hero's stage moves to the rows whichever fall wins?** Recommended: yes, named in `fall`'s `lands`: the live
  stage still mounts `GuestMasonry` (`live-album-stage.tsx`), which both albums left at milestone 29.
- **The recommendation moves from bloom to push?** Recommended and built: push, the one fall whose album takes the
  photograph in (clipped, never scaled, one glow at a time). Bloom was drawn for the grow-and-fade rule the push
  replaced; glide stays the closest of the first four and still ships.
- **review-photo: the brief's two roads (`today` undimmed, or the dim and badge named in `lands`).** Took undimmed,
  every option on production's `review-switch.tsx` as it stands. The middle plate is the HOST's queue, which the
  host's review grid draws plainly (`review-grid.tsx`); the dim and clock are the GUEST's `WaitingTile` grammar, which
  the switch already carries as the phone plate's "Waiting for the host" pill. Re-read undimmed at 56px, rings stays
  recommended with its case restated.
- **who-for, one step past the context:** `lands` now names the split two doors would need (/contact's one "Press &
  partnerships" topic, and the DB CHECK that mirrors it, `20260828001000_contact_topic.sql`), and the two-doors
  drawing's partner note stopped repeating the false claim. The recommendation (one-page) is unchanged.

## System-doc edits (in place, owned facts only)

- none: no production byte moved; what the lane found in production is below, for the lanes that own it.

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit (refines ROADMAP's `bloom` line): `gather`, `cascade` and `bloom` all live in the shared engine
  only for the board and leave it unless picked; `push` lives only in `album-motion/` (`push-engine.ts`,
  `push-stream.tsx`) and becomes an engine recipe with an arrival hook only if picked.
- The lab and the kit (refines the "A guest" line): `profile-page/album.tsx` retired with its board; host-curation's
  and host-storage's halves stand.
- The lab and the kit (refines the "No app, no account." line): `site-chrome/foot.tsx` retired with its board;
  `help-center/who-first.tsx` stands.
- The lab and the kit: under `pnpm dev` a client-rendered album tile paints empty: Strict Mode's rehearsal unmount runs
  the tile's ref cleanup in `masonry.tsx`, whose `abortUnfinishedImages` strips the src of a photograph still loading,
  and the remount keeps the stripped node. Every board drawing an album grid is judged blind in dev (album-motion's
  stage at the base drew broken tiles); a production build paints them.
- Marketing: `album-stream.css` shows the stream's desk composition from 1024 while `stream-engine.ts` solves and
  tests it for 1280 (`STREAM_LG_MIN`, whose comment says the sheet agrees), and `album-stream.tsx` exports a second
  `STREAM_LG_MIN` of 1024.
- Marketing: /features/album's Review hint (`album-copy.ts`, `YOUR_CALL.hints.review`) still quotes the retired toast
  "Guests see: Sent, waiting for host approval" under a switch whose pill says "Waiting for the host" (`held=tile`;
  `guest-upload.test.tsx:302`: the waiting tile answers, never that toast).
- Code hygiene: `review-switch.tsx` imports `useEffect` unused (one of the gate's five warnings) and its `Traveller`
  keeps a `dim` prop nothing passes.
- Code hygiene: with profile-page and site-chrome gone, `GuestListItem`'s optional `kind` (`guest-list.tsx:95`) and
  the optional `seed` in `lib/social/cards.ts:19` have no lab caller left to protect; `DemoTicket` has one bare
  caller left (the Library specimen), and its comments (`demo-ticket.tsx:31`, `:143`), `gallery-demos.tsx:1138`'s
  Library text and `components/lab/scene.tsx:23` still name the retired boards.

## Handoff (replaces the chat report)

- **Commits, pushed:** `b21eaca6` (the retirement), `7beda324` (the three refreshes), `c3d6c252` (album-motion's
  carried calls). No sync: launch-prep moved only by `e541cb05`, a records commit (`docs/STATUS.md`,
  `docs/tracks/orchestrator.md`).
- **Gates on `c3d6c252`, each its own exit code** (logs in `partyreel-wt/_scratch/marketing-refresh/`):
  `build-lock.sh pnpm typecheck` 0; `pnpm lint` 0 (0 errors, the 5 standing warnings in `review-session.tsx`,
  `contact-form.tsx`, `album-fill-grid.tsx` and `review-switch.tsx`, none touched); `build-lock.sh pnpm test` 0
  (510 files, 5,734 tests); `build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3138` 0 (223
  checks, 0 failing); `pnpm lab:demo --board album-motion` 0 (1 step, 5 options drawn), `--board loose-ends` 0
  (6 steps), `--board press-page` 0 (7 steps).
- **Re-run under the memory crunch:** the first `lab:demo --board loose-ends` timed out on review-photo
  (`Runtime.evaluate` 60s, load average near 40) and the first `--board press-page` never got its Chrome's debugging
  port; both passed re-run alone, and the whole gate re-ran on `c3d6c252`, heavy steps under the lock one at a time.
  The typecheck and test before `7beda324` ran outside the lock, before the pacing note. Nothing was lost; no Chrome
  or capture script of this lane is left running, and the dev server on :3138 is stopped.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): everything under `album-motion/`,
  `loose-ends/`, `press-page/`, `site-chrome/` and `profile-page/`, this file, and the three named exceptions:
  `(shell)/lab/boards.ts` and `sandbox/registry.ts` (the two retired boards' lines only) and `touchpoints.ts` (the
  retired rows, `SandboxId` and `DESK_ORDER` entries, and my three boards' rows).
- **album-motion `fall`** (round 1 kept): all five stand on the hero recomposed over the album in rows
  (`rows-hero.tsx`: `ArrivalsHero`'s lockup, `LiveAlbumStage` with the one grid in rows); the four are production's
  `AlbumStream`, re-graded against the push; a fifth, `push` (`push-engine.ts`, `push-stream.tsx`): singles from the
  head's side on the home hero's curve, never scaled, arriving falling straight over the head, and half through the
  edge the stage prepends that photograph with its glow so the rows open it from its left edge. One every 1875ms,
  evenly (the quicker lane launches later), each arrival a new photograph, the clock kept across a loop restart,
  reduced motion a still rest state; its caption is measured as the engine's solve measures the others.
- **loose-ends:** `hero-tablet` and its drawing gone (hero-card r2 owns 900); `review-photo` redrawn on production
  (undimmed, unbadged, the "Waiting for the host" pill, the type tokens) and re-graded at 56px on screen; title "Five
  loose ends".
- **press-page `who-for`:** the context's false clause fixed (/contact's topic "Press & partnerships" since 08-28,
  `45122266`); the other six asks untouched, and their lines too (the diff is the spec's four edits and the one note).
- **Retired:** `site-chrome` (foot-after, foot-alone and foot-phone answered by `9277f933` and `77cfdfe9`) and
  `profile-page` (way-back by popups `peek=card`, `guest-peek.tsx`'s "Open full profile"; head built, `/u/[slug]`
  mounts `GuestHeader`), in the house convention (`95c8aa56`): RULINGS rows deleted whole. Their ledgers stand for
  the record.
- **Verified by eye** (captures in `_scratch/marketing-refresh/caps/`): the push at 1440 and 375 in bursts (a frame
  goes in behind the edge over the head, the head tile opens from its left edge with the rim, the neighbours glide;
  `sheet-push-arrival.jpg`, `sheet-push375b.jpg`), on a production build with the photographs painted
  (`prod-push-1440.png`, `sheet-prod-push.jpg`), under reduced motion (`am-push-1440-reduced.png`), and across a
  reduced-motion switch mid-visit (arrivals resume at fresh numbers); the four falls over the rows
  (`am-glide-1440.png`); review-photo's three queues at 56px (`toast-plates.png`, `rings-plates.png`,
  `arch-plates.png`); two-doors fitting its frame at both widths (656 of 700, 962 of 1350); each board page at 375
  with no sideways scroll.
- **Assets requested from Will:** none new. The album stage's stills are all 3:2 landscapes, so any stage in rows reads
  as landscape rows; ASSETS row 22's replacement set could carry a party's real mix (mostly 3:4 portraits, a
  landscape in four).
- **Board ideas:** none beyond the Deferred lines.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the push from the head's side only; the stage's rows plain; the stage moving to the rows
  whichever fall wins; push over bloom as the recommendation; review-photo undimmed rather than the dim named in
  `lands`; who-for's `lands` and two-doors note naming the /contact split.
- **Look at first:** `/design/lab/album-motion` at 1440, watching two or three arrivals open the head, then 375;
  then loose-ends' review-photo (press Review inside a tile for the queue); then press-page's two-doors.
