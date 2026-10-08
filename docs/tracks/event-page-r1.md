---
track: event-page-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c04da309"            # the launch-prep SHA the branch was cut from
board: event-page
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-page/
  - src/app/(dev)/design/sandbox/presence/
  - src/app/(dev)/design/sandbox/signature/
  - src/app/(dev)/design/sandbox/after-party/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRD.md
  - docs/PROGRAM.md
  - docs/systems/design-system.md
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
  - docs/reviews/presence.json
  - docs/reviews/signature.json
  - docs/reviews/after-party.json
  - docs/reviews/create-wizard.json
  - docs/reviews/brand-marks.json
  - docs/reviews/batches/2026-10-07-b0eb89bc9.txt
  - src/components/guest/event-experience-head.tsx
  - src/components/guest/event-experience.tsx
  - src/components/app/event-feed/event-hub-head.tsx
  - src/components/app/event-feed/event-cards-row.tsx
  - src/app/(guest)/e/[token]/card/route.tsx
---

# lp/event-page-r1

**Goal.** Board event-page r1: the event page redrawn from the ground up as one whole, host and guest alike, led by Will's favourite idea (the head with no slideshow, its UI standing on a glow sampled from the album's media, the gallery teasing the scroll), every state drawn and the system's reach shown where it lands.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint, and restraint is the brand; delight where it costs nothing in clarity; attention earned, never yelled (the one thing that needs her may draw the eye, beautiful and inviting, nothing crowds a screen, words in compact groups with room around them); simple on top, deep underneath (each visible piece the door to the features behind it); one product on both sides (host and guest one interface where they can); nothing depends on a timeline (no date reshapes an album by itself); immediate, or a clear state and a way out; never dev-tool-ish; production the working version. PRD.md's "Will's product principles" hold each with its reason.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in look runs on your own port in a headless Chrome of your own through `usher/kit/redteam/signin.mjs` (testing-verification.md), never Will's browser pane or his Chrome; never kill a process by its name, by port or pid only.

**The brand as it now stands** (`docs/reviews/brand-marks.json` round 1, wired this wave by brand-marks-wiring): Aperture (light lives in the dark; on paper it stays inside a piece of the room); the wordmark Will's v1 finished, one bold group at every size; the icon the ember Ring; a piece of the room on paper is the room's own black; the status set Standby half-lit with no hue, Ready green, a warning amber, a fault red shared with the tally's "needs you", Live the one red that breathes. Draw in it; never ask it again.

**This board zooms out (PROGRAM's "Fast, focused rounds"), and why:** the event head has been improved piece by piece for six rounds (event-header r1 to r6, then presence, signature and after-party each slotting a part in), and Will asks for the whole now that the final app is clear: "attempting redesigns as the ultimate sum total synergy of potential event head components working together, rather than how each individual component next slots in best individually one-at-a-time ... which leads to a product that feels like features were added as we went along, not a cohesive product where they all work intuitively together." So your first ask's options are whole designs, each a complete page whose parts work together, and the rounds after it settle the assumptions it sweeps in. Ask a part on its own only where it truly stands alone.

**His revision, the brief's heart (2026-10-07, his words, since their wording is the point):**
1. **His favourite, by far, to deep-dive:** "removed the slideshow & media background from the head completely, keeping the UI and filling the bg more with a sampled glow from the media (curious where source would look best - from gallery, page top, side, corner, floating offcenter, etc) to allow the head UI to take center stage without background conflict (glow would enhance, living subtly behind without a point of focus to distract attention), and let the media in the gallery below tease that scroll to get into the gallery content ... the slideshow kind of shouts, and especially with its contained media being unpredictable, tends to fight the UI overlaid above it. In this direction, the seam would be reshaped into that top glow, and the event head would feel much calmer so it's a gentler landing and an easy scroll into content."
2. "keep this general head shape but remove the seam from an event page with media to prevent the conflict of both fighting with color for attention, and simply reshape it to enhance the empty state of a more achromatic event page. Once content begins arriving, it becomes less prominent and infuses into UI like the shutter button to keep the brand visual identity in play."
3. "turning the slideshow into more of a featured card above the action stack, similar to how a featured post on a blog page may present ... so it isn't the only component running fully edge-to-edge, and harshly cutoff by the nav above and sections below."
Draw several genuinely different takes on the first (where the glow is born and how the calm head composes its parts), pushed apart, and the second and third whole beside them as contrasts; today's page is the reference.

**Every whole design is drawn in every state that matters, host and guest, at a phone and a desk:** a new event just made (no photos, nobody has the code yet: the checklist's entry, `arrival` below); a live party with photos landing; before any photo (presence's `atmosphere`, below); the album closed by her and become its keepsake, with the one moment that presents it (after-party's `over`, `keepsake` and `recap`, below). And its reach, one frame each, where the language lands beyond the page: the event's card in a chat (after-party's `card`), the dashboard's event cards (a photo-less event's light: brand-marks' carried `lamps` call yields here), the door's sheet over the album (signature's `door`), and the Add at rest and answering (signature's `add`).

**The inputs, his picks and notes (`docs/reviews/*.json`; never asked again part by part, composed into each whole):**
- **presence r1:** the guest row stays the faces he loves (`colour=wheel`: the hashvatar's own vibrant colour, "not these directions"); faces under the event's name make the page social, "not just a cloud storage folder album" (`album=cover`); the comb at a desk (`hover=comb`); faces on the host's line as on the guest's, one interface (`hub=line`). His head note: the guest and view counts under the title, the guest count again on the Guests card, the media count on the activity bar and again atop the gallery "feels very scattered, not a clean presentation, repeated info": each fact said once, where it belongs; "Whole head can be redesigned to fit"; he hates the bar cutting the hero and the hero the only full-width piece. `atmosphere` came back unclear: he likes a party's own light varying by event (always the house ember "will get very boring"), never a floating lamp that draws the eye before the title and Add, and an edge-to-edge light that lets the UI lead, with no Seam fighting it.
- **signature r1:** one light per view, the brand's identity felt through the experience, "getting away from what felt like one-off uses of aurora" (`album=follow`); the Add's ring answering each of her photos as it lands (`add=answer`); one light on the door at the album's edge (`door=seam`) with his craft note (paired corners; a leak never cut off by a box's clip: design-system.md's new line); the camera's light answering the room's sound while a clip rolls (`clip=seam`). Create's room is wired dark this wave (create-wizard-wiring-2).
- **after-party r1:** Close adding offered to her two days after the last photo, never done for her (`over=offer`); the keepsake led by the reel, only once she closes (`keepsake=reel`), with his caution: guests come back the next day to add, and a trip dated one day may run all week; `recap` unclear: one reward moment, shown once when we confidently know (her close), "an 'everything is ready!' type of delight", after which everything works as before; `card` unclear: our own polished card over a guest photo that may read sloppy, varied by the event's own light or seed, with a private album's fallback built in; "Make one like this" at the album's end, polished and quiet, perhaps beneath the guests (`bridge=end`; the header corner and menu and Create's like-entry are create-wizard-wiring-2's). AY1, Will's answer: an album's order turns at her close, never on a date (crumbs-91 wires it).
- **create-wizard r5:** a just-made event "still feels like a lot going on": simple on top, "feature-rich nested behind a more subtle, minimal feel", each visible piece the top-level entry to the features under it (his example: making a clip found inside the reel, never Add, Make a clip, Watch and Download shouting at once); the checklist as "a very natural/seamless entry into the event, rather than just a solo component somewhere down the event page", with better words (`arrival=done` is wired: a new event is ready, its checklist one line).

**The rules every frame keeps:** a face shows only where the album shows its Guests (past every door; never at a teaser, a lock or the demo); a card carries no Private album's photograph, nor a hidden or waiting one, nor a face; no date reshapes an album by itself; one light per view, still until something happens; production's components where they serve, and anything redrawn where the whole asks it (nothing is protected).

**Material from the ROADMAP's lines (quote them where an option answers one):** "Lab exploration on wiring the board-drawn hub head", "the host's picks feeding the cover, reel opening, share card, keepsake and best-of", "the Live mark says LIVE on a closed album", "Lab exploration presence r2", after-party r2's anniversary and keepsake premiere, "the Guests card's ... guests count are frozen at render", "one face size and caption rule", "the aurora that answers", "the guest door's sheet wears three lamps".

**Retire three boards into this one:** presence, signature and after-party's answers are this board's inputs, so at your handoff their folders (`src/app/(dev)/design/sandbox/presence/`, `signature/`, `after-party/`) are deleted in your branch, after you have carried into your own folder whatever fixtures or drawings you reuse (a board never imports another's folder); the Orchestrator deletes their ledgers at your record. Your opening's `earlier` and `settled` carry their substance.

**Will's open decisions you never presume** (the desk's Calls place, `docs/calls.json`): who Partyreel may contact outside the app (X11: no email or push is assumed; where a moment would need one, the option's `costs` says so), words in the album (X12), co-hosts (X9), what a follow is for (X17), prints (X16). An option may lean on one only as a named Question in your Handoff.

**Never asked here:** the marks and tokens (brand-marks r1, wiring now), Create's room and its close (wired now), the Guests room (wired now), the offline states (no-signal, wired now), following and her own page (account-moments).

**The method:** a helper per option holding the whole brief, a creative director's fresh-eyes pass, one refinement on everything it names; asset gaps as Higgsfield asks in the Handoff (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-page/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-page`, its title, `surface`, `desk: 4` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **A Private album's card light** (the board's carried `private-light`): from its link alone (`linkLight(token)` in
  `event-page/light.tsx`, a light seeded by the token), so a private album's card and a missing one's are drawn alike;
  never the event's own seed, which takes a lookup a stranger could probe for whether an album stands behind a link.
  Recommended as drawn, in every design.
- **When a guest meets the one moment** (carried `guest-moment`): on a guest's next visit after Maya closes adding, once
  on that device; Maya's the instant she closes; then the page as before. Recommended as drawn. No mail brings anyone
  back for it (X11): each new design's `costs` says so, as the coordinator relayed; the creative director's pass found
  the five identical clauses noise and would say it once in the opening, his to pick.
- **What Live means on her page** (carried `live`): Live (the one red that breathes) only while photos are landing, the
  hub strip's own quarter hour; an open album gone quiet says Open in Ready's green (production today wears Live
  whenever the hub's socket is up). Recommended as drawn.
- **The guestbook's door after her close** (X12, its own board settles it): drawn open in every design (a note to the
  hosts often comes days after the photos stop), after the host's note, the host's count never a tally. Recommended
  open.

## System-doc edits (in place, owned facts only)

- none (a board lane; its wiring notes are in the Handoff)

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Upcoming · The lab and the kit: a step keeps every option's frames mounted, so a whole-design board loads all its
  options' pages at once (event-page r1: up to 30 iframes on one moment, each a full page of photographs); mount a
  hidden option's frames on its first view (`src/components/lab/step.tsx`).

## Handoff (replaces the chat report)

- Work commit `7197d73fa`, sync commit `90a885c48` (merge of origin/launch-prep at `136ba134c`: my reads moved, the
  checklist and readiness from create-wizard-wiring-2, the card route and system docs from brand-marks-wiring,
  crumbs-91, no-signal-wiring), and `a99b80610` (today redrawn as production now stands after the sync: the card signs
  with the wordmark alone, a stranger's corner says Make one like this), pushed; the head is in the chat line.
- Gates on the synced tree, the content of `a99b80610`, each on its own exit code (logs in
  `../partyreel-wt/_scratch/event-page-r1/gate/`): `pnpm typecheck` 0 (`typecheck.log`), `pnpm lint` 0 with no warning
  (`lint.log`), the board's tests (`registry.test.ts`) 0, 32 passed (`board-tests.log`), `pnpm test:rules` 0, 86 files
  and 1,475 tests (`rules.log`), `pnpm lab:smoke --base http://localhost:3136 --board event-page` 0, 717 words of
  1,200 (`smoke.log`), `pnpm lab:demo --board event-page --base http://localhost:3136` 0, "1 steps, 0 failing"
  (`demo.log`); before the sync the same steps passed, and `lab:demo` also with `--state moment=reach` and with
  `--state moment=after --state side=host` (`demo-reach.log`, `demo-after-host.log`). The light gate (PROGRAM's "Speed
  over proof in exploration"): no full test run, no production build.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/event-page/` (23 new
  files), `presence/`, `signature/` and `after-party/` deleted (all four owned), and this file.
- The items:
  - Board `event-page` r1 (desk 4): one ask, "Which event page should every party have, whole, on both sides?", six
    whole designs, each a `Kit` (`kit.ts`) drawn in one set of frames (`whole.tsx`) at every moment the knobs pick
    (before the first photo, photos landing, after her close, beyond the page), on both sides and both grounds:
    today (the reference), rise, sky (recommended), corner, quiet ("the cover kept, lit only while empty") and
    featured. Photos landing also draws a neon rooftop beside the wedding (`album.tsx`'s context), so each light shows
    it varies by party; her arrival is drawn at a desk and a phone; beyond the page, Create's 68 px link (with a
    34-character name), the chat (an open album's card and a Private one's), the dashboard's tiles, the door's sheet,
    and the Add closer.
  - Every design keeps the rules: each fact once, faces under the name on both sides, what needs her as her head's one
    white press, the head's acts in the dock's order, her note on her head, the guestbook's door after it, Live only
    while photos land, the moment's reward-first words (`PremiereWords`) with a centre, the card read by its light and
    one mark at 68 px.
  - Will's later inputs folded in: X10 (one gallery, no dividers), X12 (the guestbook's quiet door), X11 (no mail
    drawn, its cost named), the card's second seat (create-wizard-wiring-2's `BeatLink`), Create's code landing on her
    head at arrival (each design's own place for it).
  - presence, signature and after-party retired into it: their folders deleted, their fixtures, light, frames and
    production recompositions carried into `event-page/`; the Orchestrator deletes their ledgers at this record.
  - Method: a helper per option on one context pack (`../partyreel-wt/_scratch/event-page-r1/helper-brief.md`, then
    `helper-addendum.md` and `helper-addendum-2.md`), a creative director's fresh-eyes pass (its shots in
    `_scratch/event-page-r1/cd/`; it picked sky, which the board recommends), one refinement on everything it named;
    the final overview of every design in `_scratch/event-page-r1/ov3/` and one contact sheet per design in `sheets/`.
  - Wiring notes for whichever design he picks: every card's light is drawn in CSS the card route's Satori cannot draw
    (oklch, `color-mix`, blend modes), so its port precomputes rgba stops; rise's glow measures its reach in container
    units because Chrome refuses a radial-gradient size that mixes a percentage and a length (`calc(66% - 42px)`); a
    Private card's light reads its link's token, never the event.
- Assets requested from Will: none (the stand-ins are the twelve marketing stills).
- Board ideas: the round after his pick settles what this one swept in (where her tools sit: a row, the bar or cards;
  the card's face; the photo-less tile's light); one album-light module (`lib/shared/album-light.ts`) feeding the
  head's light, the card, the tile and the Ring from the album's own sampled reads, so they never disagree.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls for Will: none (a board builds nothing; its three carried calls hold the decisions it took).
- Look at first: `/design/lab/event-page?key=…`, its one step on Photos landing, sky (recommended) beside rise: the
  wedding's gold dusk and the rooftop's lavender in the last frame; then Before the first photo on Maya's side (her
  arrival, where Create's code lands) and Beyond the page (the card at 68 px with the long name).
