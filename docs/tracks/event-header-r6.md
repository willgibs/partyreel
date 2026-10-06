---
track: event-header-r6
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
