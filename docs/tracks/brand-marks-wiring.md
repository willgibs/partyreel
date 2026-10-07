---
track: brand-marks-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/brand/
  - src/components/shared/logo.tsx
  - src/components/shared/logo.test.tsx
  - src/app/icon.svg
  - src/app/apple-icon.png
  - src/app/favicon.ico
  - src/app/manifest.ts
  - src/app/opengraph-image.tsx
  - public/icons/
  - kit/logo/
  - scripts/build-press-kit.mjs
  - src/app/globals.css
  - src/app/theme.css
  - src/app/globals-theme-contract.test.ts
  - src/components/ui/badge.tsx
  - src/components/ui/sonner.tsx
  - src/components/ui/sonner.test.tsx
  - src/components/ui/display.test.ts
  - src/components/ui/identity-traits.test.ts
  - src/components/app/dashboard/marks.tsx
  - src/components/app/dashboard/needs-you.test.tsx
  - src/components/dev/glow-contrast.ts
  - src/components/dev/glow-contrast.test.ts
  - src/components/marketing/chrome/footer-contract.test.ts
  - src/lib/reel/engine/canvas2d.ts
  - src/app/(guest)/e/[token]/card/route.tsx
  - src/app/(dev)/design/sandbox/brand/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/brand-marks.json
  - src/app/(dev)/design/sandbox/brand-marks/spec.ts
  - docs/systems/design-system.md
  - kit/README.md
  - docs/ASSETS.md
---

# lp/brand-marks-wiring

**Goal.** The brand's marks and tokens as Will picked at brand-marks r1: his v1 wordmark finished, the ember Ring as the icon everywhere an icon lives, the room's own black as every piece of the room on paper, and the status set as a clear hierarchy of states.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**From Will's batch (2026-10-07; `docs/reviews/brand-marks.json` round 1; the board `src/app/(dev)/design/sandbox/brand-marks/` draws each option on production's surfaces):**
- **`wordmark=finished`:** his letters exactly, parted only so no two touch (a hair at large sizes; a small cut a step more for the bars: Pa, yr, ee), legible from 16 px to a poster. His note is the rule to keep: "it's a bit bold, so at any size, it still packs a bit of a punch ... the wordmark should present as a singular group to present clearly, rather than feel spaced out and spread focus": the bars' cut must still read as one bold group, never spaced. Write that philosophy into design-system.md's wordmark line.
- **`icon=ember`:** the puck in its ring, key-lit from the top-left by the house ember, deepening to an ember red at the bottom-right; a whole ring at every size. It replaces the stand-in everywhere an icon lives: `src/app/icon.svg`, `favicon.ico`, `apple-icon.png`, the manifest's icons (`public/icons/`, maskable included), `Logo markOnly` (lucide's `Aperture` today), the reel's watermark badge (`canvas2d.ts`'s REAL-LOGO seam), the card route's placeholder tile, and the press kit (`kit/logo/`, `scripts/build-press-kit.mjs`, kit/README.md's Sources). Update ASSETS 19: the Ring is the v1 now; a bespoke take is brand-marks r2's (a board this wave).
- **`plate=room`:** every piece of the room on paper (`.surface-ink`: the foot's slab, a menu or a toast on a light page, the code's plate) is the room's own black, its light as bright as in the room. His note: "the contrast feels a lot richer, almost vibrant ... The deeper black also makes the color in the footer (top glow, media) pop much more."
- **`status=amber`, with his invitation to your best version:** "green for clear success ... The warning color also allows a bit of distinction between failure and warning states, so less intense states feel less intimidating. Open to your favorite version of this color palette for states. Also open to your new best ideas on how to apply them ... including all three to allow for a clearer hierarchy of states rather than simply red or not red." The Orchestrator's call, his to overrule: four tiers, each a point and its word on both grounds: **Standby** half-lit with no hue (waiting on us or the line); **Ready** a clear green (done); **a warning** amber, deepening toward orange on white so it stands (look soon, nothing lost: near a limit, a reconnect); **a fault** red, the one red that also means a count that needs her (the tally, `--needs-you`) and Live, the only point that breathes. Map every state production shows to its tier (about 129 files read status colours: change values at their source in `globals.css` and `theme.css` and rename nothing, so no consumer is swept), the dashboard's green `LiveDot` turned red, and list the map in design-system.md.

**The board's carried calls, as taken:** the word alone in the bars and the foot (no lockup); the Ring is his v1 icon; the icon is the house's, never an event's light; live breathes; production's grade unchanged, the ember's stops joining it as tokens; the v1's near-touching pairs parted a hair at large sizes. **One exception:** `lamps` (the five house lamps into the ember) holds for the foot's seam and the confetti, but a photo-less event's lamp on the dashboard keeps its own hue: Will's presence note says the house ember on every event "will get very boring", and the event-page board (this wave) answers how a photo-less event is lit.

**ROADMAP lines you close (quoted by their opening words; the Orchestrator retires each at your record):** "The brand pass the day the v1 icon lands"; "the amber pill should be `--needs-you`" (marketing's, if it is a token change at the source; else leave it); the card route's "placeholder aperture tile left for the wordmark".

**Retire the brand board:** its one pick (`take=aperture`) is applied by your marks and tokens and by the event-page board's light, so delete `src/app/(dev)/design/sandbox/brand/` in your branch; the Orchestrator deletes `docs/reviews/brand.json` at your record.

**Refresh the kit** from kit/README.md's Sources at your handoff (the logo files; the screens are the Orchestrator's, captured from partyreel.com after the milestone).

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** brand-marks-wiring (`globals.css`, `theme.css`, the marks, `badge.tsx`), create-wizard-wiring-2 (Create, readiness, the checklist, `settings-rows.tsx`, the hub's `page.tsx`, the guest header and name menu), no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), guests-room-wiring (`dashboard/[eventId]/guests/`, `guest-peek.tsx`), account-moments-wiring-2 (FollowButton, RelationToggle, Connections, `/me`, `u/[slug]/`), crumbs-91 (the album's order, the guest page, `event-experience.tsx`, `as-guest*`, Immediate's lines), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended; every one is a design call Will sees by using the product, his to overrule.

- **Standby's colour:** `--info` is every ground's own muted ink (its words at AA), and the Badge's Standby point is
  half-lit in the word's own ink: no hue, as the Orchestrator's four tiers have it. Overrule: a faint cool hue.
- **Ready's words:** `text-success` reads a deeper green at AA on paper (`--success-ink`, 4.98:1, as `text-warning`
  reads its bronze), so "Copied" or "In your Drive" stands as text; a point, a fill and a check's disc keep the lit
  green (3.68:1). Overrule: one green for both, under AA as words (3.68:1).
- **The press kit's three icons:** the Ring on its tile for a light ground, the Ring alone (its light and its dark puck)
  for a dark ground, and the mono Ring in one ink (the ring and the puck, the gap the ground, a tab's bold proportions)
  for any surface. Overrule: the mono as the ring alone.
- **The reel's watermark:** on footage the mono Ring in white beside partyreel.com (scrim, the shipped default, and
  ghost); the dev-only badge is the icon itself on its tile. Overrule: the icon in colour on footage too.
- **Every app bitmap wears the home screen's cut** (the 180 apple icon, the 192 and both 512s, each shown at about 60
  points), the favicon's entries each its own size's cut, and `icon.svg` a tab's. Overrule: the 512 "any" icon in the
  master's thinner cut, for an install dialog drawn large.
- **The ember relights only what the brief named:** every unsampled lamp inside a piece of the room (the foot's seam)
  and the confetti; the Aurora's other unsampled lamps (`SectionLight`, the cinema and QR heroes, Create's code bloom)
  keep the five hues until the event-page board answers how a light with no photograph is lit. Overrule: the ember
  wherever there is no photograph.
- **The event's card signs with the wordmark alone** (display cut, 52px, the card's white), where the aperture tile and
  its typed name stood; the event's name still leads. Overrule: the wordmark quieter (the old zinc grey).

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the grounds line (the display on paper is the room's black); a new line, a piece of
  the room on paper is the room's own black; "Status is light" refined into the four tiers with the map of every state
  production shows; the brand line (the wordmark's one home, its two cuts and Will's rule for every cut, as the brief
  asked); a new line for the icon (the Ring, its one home, what draws it, `marks.test.ts`); a new line for the house
  ember (`--ember-1..4`, `--ember-lamp-1..5`, what they relight and what keeps the five); the toast line's tiers.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming › Design system and accessibility: Design: states still drawn in another tier's token (design-system.md's
  four tiers), each its surface's to move: Standby in green (`ui/progress.tsx` fills every meter in `--success`, so an
  upload or a Drive send under way reads done; the "Sending to Google Drive" toasts in `storage-door.tsx`,
  `take-home-panel.tsx` and `event-experience.tsx` are successes) and in amber (`upload-tracker.tsx`'s Developing);
  a warning in red (`grace-banner.tsx` and `goal-strip.tsx` over the cap inside the grace, the password gate's
  cooldown); a fault in amber (Drive's "Couldn't" notices in `send-steps.tsx`, `send-strip.tsx`'s warning toasts)
  (brand-marks-wiring).
- Upcoming › Admin and operations: Admin: the portal's states in another tier's token: in progress drawn amber
  (`storage-sums-view.ts`, `reconcile-view.ts`, `restore-view.ts`), a failure amber (`drive-words.ts`'s stopped sends
  and its "Lanes dying" pause, `outcome-word.ts`'s refused Too large and Empty, failed copies), near a limit red
  (`limits-card.tsx`'s Critical and stale readings, `drive-section.tsx`'s Google client line), and a count that waits
  on the operator amber (`admin-bar.tsx`'s "N jobs need you", `queue.ts`'s open reports) where a count that waits is
  the tally (brand-marks-wiring).
- Upcoming › Marketing and content: Marketing: live drawn green on the site (`demo-modal/demo-door.tsx`'s LiveDot and
  its ring, `home/live-demo.tsx`, `live-album-stage.tsx`'s Live now, `feature-door.tsx`'s Filling live,
  `review-modes.tsx`'s Live icon): live is the recording red that breathes, as the app's `LiveDot` and the Badge's
  `live` draw it (brand-marks-wiring).
- Upcoming › The host app: Drive: the album tile's Standby dot (`drive-tile-mark.tsx`, `bg-info`) is now the page's
  muted ink on glass, the same grey as its stopped dot: draw it half-lit in the glass's white, as the Badge draws
  Standby (brand-marks-wiring).
- Upcoming › The host app: Mail: every mail's head wears the wordmark as drawn at 22px (`public/email/wordmark-v1.png`):
  `scripts/build-email-wordmark.mjs` on the small cut into `wordmark-v2.png`, and `templates.ts`'s `WORDMARK` pointed
  at it, so his three near-touching pairs stop blotting (brand-marks-wiring).
- Upcoming › The lab and the kit: Library: the Logo specimens (`library/patterns/gallery-demos.tsx`) still call the
  mark "a stand-in" until the v1 icon arrives, and draw the display size in the small cut: the Ring by name, and
  `cut="display"` on the 48px specimen (the specimens' JSON regenerated) (brand-marks-wiring).
- Upcoming › Marketing and content: About: the press band's words (`ABOUT_PRESS_KIT.body`) name "the mark, the app
  icon, the share card and a QR code"; the kit now carries the wordmark in ink and in white beside the icon
  (brand-marks-wiring).

## Handoff (replaces the chat report)

- **Commits, pushed:** the work `b34b047fe`; the sync `87687d611` (launch-prep at `f0623106f` merged: it brings
  `9086b48f5`'s calls ledger and test, since at the cut the ledger held 29 entries and `calls.test.ts` "refuses the
  31st entry" failed on the base; nothing merged touches this lane's paths); the follow-up `b756ad1dc` (the badge's
  icon painted once per size, a Ring of no size drawn as a tab's); this manifest the head.
- **Gates on `b756ad1dc` (the synced tree), each its own exit code:** `zsh scripts/build-lock.sh pnpm typecheck` 0;
  `pnpm lint` 0; `zsh scripts/build-lock.sh pnpm test` 0 (1100 files, 13974 tests); `zsh scripts/build-lock.sh pnpm
  build` 0 (no warning); `pnpm lab:smoke --base http://localhost:3131` 0 (231 checks, 0 failing); `pnpm lab:demo --board
  brand-marks --base http://localhost:3131` 0 (no open step).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the brand board's 41
  deleted files, and these exceptions: `docs/systems/design-system.md` (the system-doc facts above); `kit/README.md`
  (a read, but the brief names its Sources: the logo table and the Sources line now say the Ring, and "no brand hue"
  allows the icon's ember); `public/press/` and `src/lib/constants/press.ts` (the press kit the brief and the ROADMAP's
  brand-pass line name: the regenerated marks, the app icon, the share card, the zip, four new wordmark files and their
  rows, every row's bytes); `src/app/(marketing)/marketing.css` (the confetti's five aliases to `--ember-lamp-*`, the
  brief's `lamps` call); `src/components/marketing/chrome/marketing-footer.tsx` (one comment said the slab is lifted to
  0.165 so it is no hole: now the room's black); `src/app/(dev)/design/sandbox/brand-marks/palette/grades.test.ts`
  (brand-marks-r2's folder, two lines: it pinned the lifted plate to production, which now wears the room plate, so it
  pins `GRADES.room`; r2 may retire the answered asks with it).
- The wordmark, finished: `src/lib/brand/wordmark.ts` keeps his path as the source and draws two cuts (small under
  48px, display from 48px), measured gaps in its table and `wordmark.test.ts`; `Logo` draws the small cut (`cut` names
  the display), the social card and the event card the display cut; the philosophy is design-system.md's brand line.
- The icon, the ember Ring: `src/lib/brand/ring.ts` (the board's numbers, one home) draws `Logo markOnly` (`size`
  picks the cut), the reel watermark (`canvas2d.ts`: the mono Ring on footage, the icon as the badge, the REAL-LOGO
  seam gone) and every file through `scripts/build-press-kit.mjs`: `src/app/icon.svg`, `favicon.ico` (16, 32, 48,
  256), `apple-icon.png`, `public/icons/` (192, 512, 512 maskable), `kit/logo/`, `public/press/`; `marks.test.ts` holds
  every SVG to its source, the press PNGs to the kit's.
- The plate, the room's own black: `.surface-ink` is `.dark`'s ladder, its states the room's and its lamps the ember;
  paper's `--display` and `--display-step` the room's body and dialog (the footer, menus and toasts on paper).
- The status set, four tiers at their sources (no consumer swept): `--info` Standby (muted ink), `--success` a clear
  green with `--success-ink` for words, `--warning` amber turned orange on paper (3.02:1 on the mat, the floor), the
  red unchanged; the Badge's point 8px and solid, Standby half-lit, live breathing as a point (theme.css's
  `live-signal`); the dashboard's `LiveDot` the breathing red; `display.test.ts` pins every point at 3:1 and every
  state's words at 4.5:1 on paper's three grounds and the room's.
- The ember: `--ember-1..4` and `--ember-lamp-1..5` in globals.css, held to `ring.ts` by `ring.test.ts`; the foot's
  seam and the confetti glow as the ember; a photo-less event's lamp on the dashboard keeps the five.
- ROADMAP lines: "The brand pass the day the v1 icon lands" is done (the Ring in every icon file, the press kit carries
  the wordmark in ink and in white); the card route's "placeholder aperture tile left for the wordmark" is gone (that
  line's font clause stays); "the amber pill should be `--needs-you`" stays: the pills are utilities in marketing's
  pictures (`host-pictures.tsx`, `review-queue-demo.tsx`, `review-switch.tsx`), not a token at a source.
- The brand board retired: `src/app/(dev)/design/sandbox/brand/` deleted (41 files, nothing imported it);
  `docs/reviews/brand.json` is the Orchestrator's.
- Test data: none (a local session minted for willg97@gmail.com through `signin.mjs` on :3131 read the dashboard;
  nothing written).
- Assets requested from Will: none. ASSETS row 19 (agents never edit the log), for the Orchestrator to write: `| 19 |
  The icon's bespoke take | Will's own drawing on the ember Ring, if brand-marks r2's pick asks for one: SVG, square,
  legible at 16 px, with a mono version for footage | the Ring, the v1 since brand-marks r1 (src/lib/brand/ring.ts,
  drawn into every icon file by scripts/build-press-kit.mjs) | parked until brand-marks r2's pick |`.
- Board ideas: one state point for every surface (`StatusPoint`: the Badge's 8px point, Standby half-lit, live
  breathing), so the Drive tile, the dashboard's marks and the admin's lines stop drawing their own dots; whether
  every light with no photograph is the house ember (the Aurora's unsampled lamps on marketing), after the event-page
  board.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls for Will: none.
- Look at first: `/about` at 375, its press band and the foot on paper (the room's black, the ember seam);
  `/design/library/badge?key=` light and dark (the four tiers); the tab's icon on any page; `/e/<token>/card` and
  `/opengraph-image`; the parity tool's watermark (`/design/lab/tools/reel-parity?key=`, scrim and badge).
