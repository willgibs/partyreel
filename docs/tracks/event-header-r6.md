---
track: event-header-r6
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: event-header
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-header.json
  - docs/systems/design-system.md
  - src/app/(dev)/design/sandbox/brand/spec.ts
  - src/components/app/event-feed/room-card.ts
  - src/components/app/share/event-code-door.tsx
---

# lp/event-header-r6

**Goal.** Board event-header round 6 (desk 20): first the Seam made Afterglow's own, proven on screen against the brand's slides at every width on both grounds, then a second round on Will's r5 notes: the cards with each count riding its glyph as a badge (points' idea, capped at 99+) and colour back for a count that needs attention, offered at its source (one status token the cards and the code's corner share). About two asks, each answered with real contenders drawn whole on production's hub. No production byte: the wiring follows his pick.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**Where the board stands.** Round 4 picked the cards doors ('more pronounced than the glass capsule, without shouting'), wired into production by event-header-wiring (the cards over a plain dissolve, folding into pills when stuck). Round 5 drew three polished takes in Afterglow's language (`keys`, `seam` recommended, `points`). Will picked none; his note, whole, is the round's direction (`docs/reviews/event-header.json`, round 5):

> Is seam implemented here correctly? I see a streak of horizontal brightness behind the cards, only a few pixels tall. While you check, a couple additional notes. First, I think I like the card design where we add the count as a badge on the card icons (option 3), so each card's content can be absorbed in one glance (title & count very close, rather than having to look on the left side for the title and the right side for the count separately). Can max at 99+ so it never overflows into card title. Also, I noticed we removed the color here but kept it on the QR - at least for counts that need attention, I think it's helpful to use some sort of color to draw the eye when needed, else it's really easy for the bland counts to be scrolled past and not handled. With all this said, please run a second round of exploration after ensuring the seam is built correctly.

**First: the Seam, made right (a correction, not an ask).** The Orchestrator traced it (2026-10-06); start from this, then prove it yourself on screen. r5's Seam is not Afterglow's. The lane's first draft (`c6e1aabb`, `cards-seam.css`) copied brand r1's Seam faithfully (a 64 px glow on three soft pools, the photograph's edge 8 px above the cards, the cards' tops catching the light); its fresh-eyes pass (`c68b505b`) rebuilt it into a stripe: a 1 px near-white core and 2 px of gold, a 12 px fall at 22%, under opaque cards a third of the way down them (`.eh-seam-under`, z-index -1), so it shows only in the 12 px gaps between cards: Will's streak. Against the brand: about a tenth of its reach at a quarter of its strength (brand r2's kit: 'a seam drawn faint reads as smoke', its shortest Seam still 104 / 72 px at 0.9; 'quieter is shorter, never paler'); one uniform bar where Afterglow pools three soft ellipses across the edge (22, 50 and 78% of the width) and samples the edge's own colours segment by segment (`brand/afterglow/signature.tsx`); under the most-pressed controls, where Afterglow keeps words and controls past the light's reach (`slides/dark-page.tsx`: 'The event's line starts past the light's reach'; `slides/pages.tsx`, a full-width cover with a 170 px Seam and the heading below it); its source unseen (the photograph's foot sits under production's scrim, about 76% black at the cut, and one merged lamp stands in for the edge's colours); on paper brand r1's gold hairline, which every brand r2 take replaces; and with no motion of its own, the whole line flashed for about 260 ms as the pills unfolded. The brand's own definition: `brand/afterglow/system.tsx` (light born bright at its source and spent fast; 'a seam is a lit line, a hot core and a short glow'; reach 120 px in the room), `ag.css` (the pools and the 1 to 1.5 px source line faded at both ends), `signature.tsx`'s nevers (over a photograph, behind words, on a control's fill, a wash, two in one view). On paper the answer is brand r2's, and Will has not picked it yet: draw paper per its recommended take, Aperture (no light on paper; the Seam lives on a dark strip of the room under the photograph, at least 30 px tall, its light inside it: `aperture/light.tsx`, `ap.css`), with a knob for Ink (a printed rule, at least 2 px, and credits) and Cast (a hard 8 to 12 px band); a knob, never an ask, since brand r2's take is his open ask. Prove the corrected Seam at 1440, 820 and 375, on both grounds, at rest and through the fold (no flash), at 1x and 2x, against the brand's own slides side by side; your fresh-eyes pass reads the light against the brand, and never makes it fainter to make it safe. Say in the board's About, one line each, what changed from r5 and why. Production's hub still wears round 4's dissolve with no light: the board's Seam is the board's until his pick is wired.

**Then the second round, on his notes.** Shape the asks yourself (`after` stages one behind another where an answer changes the next); the two decisions his note opens:
- **The card.** Each count rides its glyph as a badge (`points`' idea) so title and count read in one glance, capped at '99+' so it never reaches the title (`formatCount` has no cap today; the cap is the badge's own, one home). Options are real contenders for how that card reads, as far apart as the real answers are (where the badge sits and what it is, what the glyph carries when nothing waits, how the card reads across a room), each drawn whole on both grounds, at every width, through the fold into pills.
- **The colour of a count that needs attention.** Afterglow's status set made waiting hueless on purpose (`afterglow/system.tsx`: Standby has no hue, Ready green, Fault red, 'the light never speaks'; `slides/color.tsx`: 'Waiting was amber, and read as the brand. Now it is the camera's standby: half-lit, with no hue'), and in round 3 he called the old yellow dull; the code's corner (`EventCodeDoor`'s count, `bg-warning`) is the one count that kept a colour. Offer the fix at its source: each option is the status set's own 'needs you' state, drawn on the cards and on the code's corner together, so one token serves both and the two can never disagree again; say in each option how it keeps Afterglow's one light to a screen (a status colour is not a light), and draw at least one option that answers within the hueless set, so his pick weighs colour against the brand's own answer. This is also the waiting colour desk 6's brand-marks board would ask (not cut yet): answered here, where he saw the problem, brand-marks inherits his pick.

**Carried into the round (no ask of its own).** The doors' words for size and clarity, the voice's to finish (`marketing-voice.ts`): 'Guests' beside 'As a guest' invites a mis-tap ('Preview'?), 'Guests · 34 guests' says its noun twice, '1 left' and 'You let in' read unclear out of context. `facesOf` (`door-kit.tsx`) reads the Guests, Review and Settings faces from `room-card.ts` (`guestsCardFace`, `reviewCardFace`, `settingsCardFace`), as the Reel card's already is. r5's three takes leave the board as r6 replaces them (the board is its folder; files r6 no longer draws are deleted).

**Settled, never re-asked.** The cards family and its fold into pills when stuck; the guest row; G1, G2 and G4 as carried; the press and the focus are identity's (shrink and the halo); identity r5's set is the house set, wired into production's atoms in parallel by identity-r5-wiring, so compose production's atoms and they inherit it at the merge (a PREMISE re-read at integration). Open asks nearest yours: brand r2's `take` (Aperture, Ink, Cast), which you draw as a knob and never ask; check the desk for any other (`node usher/kit/board-card.mjs --desk`).

**Verify on.** The light gate (PROGRAM.md, 'Speed over proof in exploration'): typecheck, lint, the board's own tests, `pnpm lab:smoke` and `pnpm lab:demo --board event-header` at 1440 and 375, with reduced motion honoured. Measure every tile before it ships: a preview shows what its words claim, read on screen.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-header/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-header`, its title, `surface`, `desk: 20` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- Where the cards stand now the light must fall past them: built ON the cover's foot (the photograph runs 20px on under
  them, 14 in a hand, to its edge; the Seam falls from there; the album starts past its reach). The alternative is the
  cards under the light, a row in the page after the Seam. Drawn as the carried call `cards-on-cover`.
- The Seam's reach costs first-screen height: at 1440 the album starts 623px down in the room (r5: 559) and 539 on paper
  (Aperture). Recommended: keep the brand's reach (its kit: "a seam drawn faint reads as smoke", "quieter is shorter,
  never paler"); a shorter one is the brand's 104/72 and still never paler.
- A hand's cards: built as one row of five tiles, glyph, count on it and short word (r5 `points`, carried call
  `hand-row`), since the cover cannot hold production's two-by-two grid on its foot.
- `99+` lives in the badge alone (`capCount`, `card-kit.tsx`); the accessible name keeps the whole number ("Review: 140
  waiting"). Carried call `cap-home`.
- The board's cover draws its own scrim (`CoverScrim`, `seam.tsx`), lifting at the foot so the Seam's source is seen;
  production's `.head-scrim` is set aside in the board's frames only. Wiring the pick means retuning production's scrim
  at the cut, which also serves the guest's cover.
- Paper's take is a knob (Aperture default, Ink, Cast), never asked: brand r2's `take` stays Will's open ask there.
- Recommended answers to the two asks: `card=shoulder` (his badge, only where it matters) then `attention=tally` (the
  palette's own recording red, a step deeper in the room so a white numeral holds 4.5:1; no new hue).

## System-doc edits (in place, owned facts only)

- none (the manifest lists no system doc; the board is its folder)

## Deferred (ROADMAP one-liners, bucket named)

- Design lab: the Seam's edge sampler as production code (each still's bottom edge read at upload, at the cover's crop
  per width, stored with the still), once his pick is wired; the board's runtime read (`edge.ts`) is its reference.

## Handoff (replaces the chat report)

- Commits: work `c296c100` (the Seam, the two asks, r5's takes deleted), fix `b766e1e2` (a pill's badge clear of its
  word), and this manifest commit; launch-prep moved only by two `[skip ci]` kit records (`608908a4`, `3ac35c76`), so
  no sync.
- Gates on `b766e1e2`, each its own exit code: `pnpm typecheck` 0; `pnpm lint` 0; the board's tests
  (`vitest run "src/app/(dev)" src/components/lab`) 0, 747 passed; `pnpm lab:smoke --base http://localhost:3131` 0, 4
  checks, 0 failing, the reading 1094 of 1200 words; `pnpm lab:demo --board event-header --base http://localhost:3131`
  0, 2 steps 0 failing at 1440 and 375 (reduced motion emulated). Light gate (PROGRAM.md); no build, no full test run.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/event-header/*` (owned)
  + this file. No exceptions.
- Supabase, Stripe, R2, Vercel: none touched. Test data left: none.
- The Seam, corrected (`seam.tsx`, `seam.css`, `light.ts`, `edge.ts`), drawn under every option; the board's About says
  what changed, one line each (`spec.ts` `opening.settled`, the "Seam, corrected" lines):
  - reach 120 / 104 / 72px at full strength (desk, tablet, hand), Afterglow's `RoomSeam` quoted (`ag.css`'s three pools
    at 22/50/78% and the 1.5px source line faded at both ends), vs r5's 12px fall at 22%;
  - the edge's own colours: `edge.ts` reads each still's last 4% of rows at the cover's real crop, six segments,
    chroma-weighted 15° buckets (production's `srgbToOklch`), at most three hue families (brand r2's polish). Checked:
    the toast's edge reads `51 140 51 51 51 51` against the brand's hand-sampled `EDGE` `50 141 52 69 51 40`. One light
    layer per still on the cover's own crossfade clock (`head-crossfade`, 6 × 4.6s); reduced motion holds the first;
  - the cards stand on the cover's foot, the light falls past them (nothing pressed in it); the captions read "5 doors
    on the cover's foot, 20px of photograph under them … the Seam reaching 120px under the cover's edge";
  - the cover's own scrim lifts at its foot (0.22 at the cut vs production's 0.8), so the source shows;
  - on paper no light laid on paper: Aperture's rebate (36px, 30 in a hand) with the light inside, Ink's rule
    (width/300, ≥2px) and credits in the cover's printed key (house ink before the first photograph), Cast's hard 12/8px
    band multiplied; the Paper knob;
  - the fold cannot flash it: the Seam is a page element under the cover, never in the band (captured mid-fold at 40,
    90, 140, 200, 500ms: continuous).
  - Proved on screen against the brand's own slides (the brand board's `05 The signature`, both grounds, and `10 A dark
    page`) at 1440, 820 and 375, room and paper, at rest, scrolled and mid-fold, at 1x and 2x (local captures; nothing
    committed).
- Ask 1, `card` (recommended `shoulder`): `shoulder` (badge on the glyph's shoulder only where a count needs her),
  `ring` (a ring of the token round the glyph, the count a tab at its foot), `numeral` (the count on a lit disc in the
  glyph's place, the glyph on its shoulder). Settings' steps left and paused stay production's words in the line at rest
  and ride the pill's glyph as a quiet badge (G4). New Moment `peak` (140 in Review, 12 at the door) shows the cap.
- Ask 2, `attention` (`after: card`, recommended `tally`): one status token (`--eh-needs`, `--eh-needs-on`,
  `cards.css`) worn by the badges, the numeral's disc, the ring and the code's corner (`[data-code-mark]:has(> span)`
  overrides production's `bg-warning` in the board's frames). Options: `ink` (hueless, the brand's own answer), `tally`
  (the palette's red), `cue` (a new blue). Numerals measured ≥4.5:1 white on tally/cue fills, both grounds.
- Carried (no ask): `facesOf` (`door-kit.tsx`) reads `guestsCardFace`, `reviewCardFace`, `settingsCardFace` and
  `reelCardFace` from `room-card.ts`. R5's `keys`, `seam`, `points` files and `doors.tsx` deleted.
- Assets requested from Will: none.
- Board ideas: the doors' words for the voice (`marketing-voice.ts`): "As a guest" beside "Guests" invites a mis-tap
  ("Preview"?), "Guests · 31 guests" says its noun twice, "1 left" and "You let in" read unclear out of context, "0
  guests" before anyone is in; brand-marks (desk 6, not cut) inherits his `attention` pick as its waiting colour; Ink's
  credits repeat the strip's counts, so a wiring of Ink might let the strip be the credits.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the cards on the cover's foot (`cards-on-cover`); one row in a hand (`hand-row`); 99+ in the
  badge alone (`cap-home`); the brand's full reach over first-screen height; Aperture as the paper default; `shoulder`
  then `tally` recommended.
- Look at first: `/design/lab/event-header?key=…` at 1440, room frame, scrolled slowly through the fold (the Seam's
  light and its source at the cover's foot), then Moment "peak" with `card=numeral`, then `screen=375`.
