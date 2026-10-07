---
track: account-moments-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "3dde5801"            # the launch-prep SHA the branch was cut from
board: account-moments
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/account-moments/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/account-moments.json
  - docs/systems/profiles-social.md
  - src/app/(app)/me/page.tsx
  - src/components/social/relation-toggle.tsx
  - src/components/app/dashboard/page-invite-card.tsx
---

# lp/account-moments-r2

**Goal.** Board account-moments r2: what a follow says when it lands, asked again and polished from Will's split note, and the invitation on her page redrawn beautiful and inviting, never loud.

## The brief

**The round's direction (Will, standing):** delight where it costs nothing in clarity; attention earned, never yelled (PRD.md: the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); never dev-tool-ish; world-class tastemakers; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3135 is yours; 3000 is Will's desk. A signed-in look runs on your own port through `usher/kit/redteam/signin.mjs` (testing-verification.md).

**Round 2, from Will's batch (2026-10-06; `docs/reviews/account-moments.json` round 1):** block = line, tidy = stays and me-page = private are built (account-moments-wiring merged: the blocked well, Connections' rows that stay with names opening `GuestPeek`, `/me` wearing her page's head marked private): they leave the asks and join the opening as settled. Two asks remain, each drawn on production as it now is:

- **follow, unclear to him, asked again.** His note, whose wording is the point: "I'm split here. I'd like to know what you think, and you're welcome to run another round of exploration if helpful. On the first or first few follow actions, the additional context may be helpful to understand what that entails. However, as follow becomes a common action for some users, it might get annoying to have that hint bubble up every time. Imagine following 1000+ users on Instagram and being told 1000 times what a follow does. You'd think "alright, I get it". Our solutions also need to be a bit more polished." The Orchestrator's view, told him in chat: a first follow says once that only she sees whom she follows, and every later follow is the button alone, so the thousandth is quiet; beside it, a Following state that carries the privacy itself, so nothing ever needs saying. Draw real contenders on Maya's page, polished, each with its steady state as well as its first time: say it once (the first follow per account; whether that memory lives on the server or the device is a Question with its cost), the button carries it (a quiet private mark on Following that explains itself only when asked), said where follows live (Connections) and never at the press, and today's button alone as the control. Reword the ask so its question is plain.
- **invite, picked as today's visible card, redrawn.** His note: "We can do much better than the design itself, but I think the more visible presentation wins here. The whole goal of this page is to be activated and become public, so it doesn't make a ton of sense to minimize the main flow that opens that up. Making it more minimal may lead users to think it's already active if they don't notice the set up blurb. This design should feel very beautiful and inviting, but not yelling or in your face." Two or three takes on the visible invitation on the wired `/me` (her own head above it, marked private), each beautiful and inviting, never loud, in Afterglow's Aperture (brand r2's pick: `docs/reviews/brand.json`); the consent model never drawn away (a page is public only by her choice; claiming a handle is the consent act).

**Nearest standing asks (ask nothing they ask):** brand-marks r1 and signature r1 (the marks, the tokens, where the light lives); a guests-room board will polish the Guests room's person rows and `GuestPeek` later, so the card's own look is not this board's.

**The method:** a helper per option on the invitation's takes; one fresh-eyes pass; a board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/account-moments/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `account-moments`, its title, `surface`, `desk: 50` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **`connections` dropped from `follow`, a finding.** Drawn as briefed (the press says nothing; the private line stands
  on her Following list in Connections), it landed on today's answer plus one line: its first frame was today's
  byte for byte, and the fresh-eyes pass named it the safety net `once` already relies on. Recommended: fold it into
  `once` as its standing note (her first follow says the line at the press; Connections keeps it for whenever she
  looks), so the ask is three real contenders: today, once, mark. Overrule: bring it back as a fourth.
- **Where "once" is remembered** (the board's carried call `once-memory`). Recommended: on the server, read from her
  following list being empty before the press (the follow Server Function answers `first`): no new column, the same on
  every device. Or: the device (a new phone hears it again; a private window every time), or a stored flag (a
  migration and a write).
- **First follow, or first few** (carried `once-few`, from his "the first or first few follow actions"). Recommended:
  her first; Connections keeps the line standing. Or: her first three (her list under three before the press), read
  the same way.
- **Every face she can follow from carries the line, if `once` wins.** Her likeliest first follow at a wedding is not
  Maya's page but the album's moment card right after she confirms (`guest/follow-moment-card.tsx`, the host's quiet
  Follow), then a guest's look (`GuestPeek`), the viewer's credit look and the claims review. Recommended: the line is
  part of the relation's one contract (`useRelation` hands `first` to its face, each face draws the line under its own
  Follow), so no face spends the one telling silently. The board draws Maya's page, as briefed.
- **The mark's glyph.** The lock is the app's private glyph (`/me`'s "Only you can see this page."), but on a Following
  pill it can read as Maya's page being locked (Instagram's grammar): stated in its cost. Recommended: keep the lock if
  he picks `mark`; `EyeOff` (the code's "Only me") is the fallback.
- **A lit invitation is a light at rest.** design-system.md keeps a beam to its live state, with Get Pro's card the one
  exception lit at rest; `plate` and `window` light /me's invitation at rest, a second exception. Recommended: the
  invitation is /me's one live subject until she goes public, so it may hold the page's one light; if he picks either,
  the placement passes to signature-r1 (where the app's lights live) as a placed light, never decided here.
- **The plate's black.** Both lit takes wear the room's own near-black on paper (`dark`, as the hub's Seam strip
  does), not `.surface-ink`'s graphite, which design-system.md names for a dark leaf on paper: on graphite the light's
  fade read brown. Recommended: the room's black for a plate that holds light; brand-marks r1 owns the token ("the
  room's blacks and the plate"), and its pick replaces this one.

## System-doc edits (in place, owned facts only)

- none: a board lane changes no production fact.

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- none: whichever answers Will picks are the wiring lane's to build (the Questions above carry what it needs).

## Handoff (replaces the chat report)

- Work commit `4b460c239`, pushed to `origin/lp/account-moments-r2`; no sync commit: launch-prep moved (brand-marks r1,
  signature r1, storage-sums-signal, album-moments-wiring merged, and records), but none of it touches my `reads` or a
  production file the board imports (`git diff --name-only 943da5387 origin/launch-prep` against both), and my diff is
  my folder alone, so it cannot conflict.
- Gates on `4b460c239` (the board's light gate, PROGRAM's "Speed over proof"), each on its own exit code, logged in
  `../partyreel-wt/_scratch/account-moments-r2/gate.log`: `pnpm typecheck` 0; `pnpm lint` 0 (no warning);
  `pnpm vitest run src/app/(dev)/design/sandbox/registry.test.ts` 0 (32/32); `pnpm test:rules` 0 (85 files, 1461
  tests); `pnpm lab:smoke --base http://localhost:3135` 0 (21 checks, the board 587 words of 1200);
  `pnpm lab:demo --board account-moments --base http://localhost:3135` 0 (2 steps: `follow` 3 options of 3 frames,
  the stage moving up to 58%; `invite` 4 options, up to 65%; both start within half a screen at 1440 and 375).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the seventeen paths under
  `src/app/(dev)/design/sandbox/account-moments/` (`relations.tsx` deleted, `follow.tsx` and the three `invite-*`
  takes with their sheets new) + this file; no exception.
- Measured on screen (headless Chrome over the dev server, reduced motion emulated; every frame captured at 375 and
  1440, on paper and in the room, `../partyreel-wt/_scratch/account-moments-r2/final/`, `s4/`): each caption read off
  its frame (`scene.tsx`'s `data-am-read`) says its option's words; the two motions (the once line opening its row,
  a plate's light arriving) are off under reduced motion; at 375 "Your uploads" starts within the first screen in
  every invitation (the tallest, `window`, at 631px).
- The items, two asks, production's answer one option of each:
  - `follow` (reworded: "How should Priya learn that only she sees who she follows, without hearing it on every
    follow?"), the same three moments a frame each and one sentence ("Only you see who you follow. Maya just sees
    one more follower."): today's button alone / said once, at her first follow, under the button (rec.;
    Connections keeps the line standing) / Following wears a private mark, its words on a tap, hover or key
    (`TapTooltip`, the code's corner-mark construction). Carried: `once-memory`, `once-few`.
  - `invite` ("Which invitation should stand on Priya's page until she makes it public?"), on /me as wired: today's
    card / one lit plate in her own light (her photographs' colours read at runtime along its top edge) / her
    address set as an invitation (her name pencilled on a reply card's blank, "Make it yours", a paper card in
    either theme) / her events on one lit plate (rec.; her two covers, each "Not shown yet", their own light under
    each). A Photos knob (wedding, party night) swaps her photographs, so the plates' light is seen to be hers.
- The method, as briefed: a helper drew each invitation take; one creative director's fresh-eyes pass (its notes
  taken: `connections` folded into `once`, the once line under the button at a desk and opening its row, one
  sentence everywhere, the mark's words aligned in the column, the plate compacted and retitled, the address on one
  frame with its name pencilled, the window redrawn as the cross it proposed, the photo knob); its one note not
  taken: drawing `once` on the album's moment card (a Question above instead).
- Assets requested from Will: none (the marketing stills every board reuses).
- Board ideas:
  - A production `Seam` atom: the hub's light is bound to its cover (`event-hub-head-light.tsx`), so the plate
    re-typed its masks and bands; signature r1's placed lights will want the same one.
  - At 375 the app header's back crumb ("‹ Partyreel") beside the Partyreel wordmark reads as a stutter on Account
    (production's `AppShell`; seen in this board's Connections frames).
  - The lab's `sm:` trap (design.css) bit this board twice (a row's height, a pill's padding): each fix is a line in
    the board's own sheet, but a lane only learns it from a frame that looks wrong.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. Wiring notes, if picked: `once` needs the
  follow Server Function to answer `first` (a head-only count of her follows before the insert; no column); the lit
  takes read her uploads' previews through the sampler's `decodeImage` (about six 16KB GETs a /me view, no Vercel or
  database); `window` falls back to the plate for an account with no event to show; `address` prints the setup's
  own first suggestion only once its availability is read, and the host from `siteUrl`.
- Calls his to overrule: the seven under Questions; the invitation's new words where a take chose them ("Your page,
  when you're ready" on both plates, "Make it yours" on the address); the plate at a desk a 26rem card rather than
  the column's width; the address a paper card in the room.
- Look at first: `invite` at 375 (the cross, `window`, against the compact plate), then `follow`'s first frames side
  by side (the line once against the lock on every Following).
- Test data left: none (no write reached a service; every act in a frame is inert).
