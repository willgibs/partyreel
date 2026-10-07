---
track: after-party-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c685648d"            # the launch-prep SHA the branch was cut from
board: after-party
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/after-party/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRD.md
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/reviews/brand.json
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/card/words.ts
  - content/help/share-the-album-after-the-event.mdx
---

# lp/after-party-r1

**Goal.** Board after-party r1, the gap audit's highest design gap: what an album becomes once its party is over, for a guest returning by its link, for whoever the link is shared with, and for the host the morning after, drawn on production in Aperture.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint, and restraint is the brand; delight where it costs nothing in clarity; attention earned, never yelled (the one thing that needs her may draw the eye, beautiful and inviting, nothing crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); never dev-tool-ish; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3135 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in look runs on your own port in a headless Chrome of your own through `usher/kit/redteam/signin.mjs` (testing-verification.md), never Will's browser pane or his Chrome; never kill a process by its name, by port or pid only.

**The vision you draw in (brand r2, `docs/reviews/brand.json` round 2: take = aperture; its board `src/app/(dev)/design/sandbox/brand/`):** Afterglow's light, never paint, colour from the photographs, then the event's seed, then the house; drawn only as a Ring, a Seam or a Bloom, one to a screen, still until something happens; a status a point and its word; on paper the light lives in pieces of the room the page holds. brand-marks r1 and signature r1 are on the next desk (the marks, tokens and status set; where the light lives in the app): draw on today's tokens and never ask what they ask.

**The gap (app-gaps-r1, ranked first of the design gaps; its ledger `../partyreel-wt/_scratch/app-gaps-r1/ledger.md`, gap 7):** after the party nothing changes. The album at `/e/[token]` reads the morning after as it did at the party, with Add as its hero; the shared card (`/e/[token]/card`) draws the album's name alone, never its photographs; the host gets no recap of what her party made; a guest's "Start for free" leads to the home page, never into Create carrying this album's style; nothing marks an anniversary. crumbs-87 made the link's words follow the album's state (`card/words.ts`: adding open, or the album to look through), the one piece already built. The ROADMAP's lab line ("the album after its party") lists the material: a phase-aware album (live, then keepsake: its title, a card carrying its photographs, Add receding), the host's morning-after recap (Share, Make a clip, Download), a guest-to-host bridge into Create carrying this album's style, an anniversary, one card family for every shared link.

**The rules it lives inside:** events never expire (their dates only say when they happen; deletion is the only exit), and nothing depends on a timeline, so the album's phase is read from its state (her closing of adding, the moment the product already knows) and a date is at most a suggestion she confirms, never a switch; an undated or multi-day party reads as well. Privacy is the frame of every card: a card carries photographs only where the album's door lets anyone with the link see them, never a Private album's (today's private card), never a photo hidden, removed or waiting for review, and never a guest's face against the guest rules (`docs/systems/profiles-social.md`).

**Asks you shape (each one decision, real contenders far apart; three to five):** what tells the album its party is over; what the album becomes for a guest who returns by the link (what leads, where Add goes, her own photos); the shared card and its family; the host's morning after (where a recap lives, what it offers); the guest who wants her own party (the bridge into Create). Ask what the drawing shows is open, never what is settled.

**Will's open decisions you never presume** (`docs/calls.md`, X9 to X17): who Partyreel may contact outside the app (X11: no email or push is assumed; where a moment would need one, the option's `costs` says so), words in the album (captions, a guestbook), co-hosts, an event's inner shape (days, chapters), prints. A board draws a decision's surfaces only once he picks its model; until then an option may lean on one only as a named Question in your Handoff.

**Never asked here:** where the light lives (signature r1), the guest row of faces (presence r1), the invitation on her page (account-moments r2), Create's close and a kind of event (create-wizard r5), the host's picks (the cover, a best-of: their own later board), the marketing site (the order to launch holds it back).

**The method:** a helper per option holding the whole brief, a creative director's fresh-eyes pass, one refinement on everything it names; asset gaps as Higgsfield asks in the Handoff (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/after-party/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `after-party`, its title, `surface`, `desk: 12` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- Q1. Is "no date turns the album by itself" a rule here, or a call Will may overrule? Built: a rule (the brief's, from
  PRD's "Nothing depends on a timeline"), said in the opening's settled lines; the morning after may only OFFER a step
  (the `wrap` option), and his customize note ("we have a good idea of when the event is over to flip") stands in
  `earlier`. The carried `date` call was dropped after the creative director's pass as a copy of that settled line.
  Recommended: keep it a rule; a keepsake that begins at the morning after by itself would be a round-2 option.
- Q2. Does the album's phase show as a word on the host's cover? Built: under `offer` and `wrap`, "Keepsake" (a point
  and its word, production's `Badge`) stands where the Live mark stood once adding is closed or the party is wrapped.
  Production's Live mark reads only the realtime connection (`EventLive`), so today a closed album's hub says LIVE
  beside its paused code. Recommended: yes; the status set itself is brand-marks r1's to draw.
- Q3. Does the morning-after recap offer Download all? Built: yes, the quietest of its three acts, after Share the
  album and Make a clip (the ROADMAP's own list). The creative director's pass asked to drop it, reading Will's
  drive-export note as against offramping; the note asks for it ("Just streamlining offramping media so they don't
  feel locked in") and refused only a one-click delete, so the opening now quotes that line. Recommended: keep it third.
- Q4. Where does a guest who joined find "Make one like this"? Built: `header` and `end` add a quiet row to her name
  menu, since a guest who joined by her name never sees the stranger's corner (the earlier helper's finding). Not
  drawn: a signed-in guest's account menu (`guest-account-menu.tsx`), the default party's case (an email first is on by
  default). Recommended: the same row in both menus.
- Q5. What does "this album's style" carry into Create? Built: its album style (Live, Review or Disposable) and its
  code's look, never its name, its guests or its photographs; for Maya & Jay (Live, Classic: Create's own defaults) it
  changes no answer and saves two screens, so Create asks only her name. Recommended: as built; a Disposable's roll
  size carries, its develop time never does.

## System-doc edits (in place, owned facts only)

- none (a board ships no production byte)

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Immediate › The host app: Create's name field draws a box at rest though NameStep means "one field on a rule, never
  in a box": Input's `field-well` keeps its rim in `--tw-inset-ring-shadow`, which `shadow-none` leaves; give
  `.cr-name-field` `background-color: transparent; box-shadow: none` (`create-room.css`, unlayered) (after-party-r1;
  app-gaps-r1's shots 02 and 24).
- Upcoming › The host app: the hub's Live mark (`EventLive`) reads only the realtime connection, so a closed album's hub
  says LIVE beside its paused code; it gives way to the album's phase (after-party r1's `over` answer) (after-party-r1).
- Upcoming › The guest's album: the event card route loads no font, so Satori paints its 700-weight name in Geist
  Regular and a wide gap before "event" ("A Partyreel  event"), and it still wears the placeholder aperture tile the
  site's own card left for the wordmark on 2026-09-17; the card's wiring loads its face (after-party-r1).

## Handoff (replaces the chat report)

- Work commits on `lp/after-party-r1`: `0c4e37c11` (the first draw) through `b7f1d3bf2` (the last work commit); the
  sync `6af53bf45` (origin/launch-prep at `311ae5aa0`: crumbs-89's `settings-state.tsx` and testing `host-event.ts`,
  which the over question's Settings frame mounts, and no-signal r1); all pushed; the head is in the chat line.
- Gates on the synced tree `6af53bf45`, each on its own exit code (logs in `../partyreel-wt/_scratch/after-party-r1/`),
  the board's light gate: `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0 (`gate-lint.log`); `pnpm test:rules`
  0, 85 files, 1,497 tests (`gate-rules.log`); `pnpm lab:smoke --board after-party --base http://localhost:3135` 0, 7
  checks, 795 of 1,200 words (`gate-smoke.log`); `pnpm lab:demo --board after-party --base http://localhost:3135` 0, 5
  steps, 0 failing, every step fitting at 1440 and 375 (`gate-demo.log`, its pictures in `shots/handoff/`). Each
  helper also ran its question at the other knob states (the guest's laptop, the host's phone, the room, `over=wrap`,
  `keepsake=reel`): all 0 failing.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/after-party/` (18 files)
  + this file; no exceptions.
- The items: board `after-party` r1, desk 12, five asks in this order (the host's two together):
  - `over`, what tells the album its party is over: switch (today) · offer, close adding offered once the photos stop
    (RECOMMENDED) · wrap, her wrap the morning after with Add still open.
  - `recap` (after over), where Maya meets her morning after: stage (today) · a plate heading her hub · her hub's cover
    turns · her home's stage made the recap (RECOMMENDED); a wrap, where picked, is said once, inside the recap.
  - `keepsake` (after over), what leads when a guest comes back: closed (today) · the reel, Watch the party
    (RECOMMENDED) · her own photos · a still title page; Add as the first answer leaves it.
  - `card`, what a pasted link's card shows: its name (today, in the route's own Geist) · its cover photograph
    (RECOMMENDED) · a strip of four · its light; the markup Satori-proven (`shots/card-satori/`).
  - `bridge` (after keepsake), how the album shows a guest the way to her own party: Start for free to the home page
    (today) · the corner and her menu into Create in this style (RECOMMENDED) · the same plus a line at the album's end.
  - Carried on the board, his to overrule: a card never carries the guest row; no email or push (X11); the anniversary
    waits on the recap's home.
  - Method: a helper per question, a creative director's fresh-eyes pass, one refinement on all sixteen of its changes
    but one (Q3, with its reason).
- Assets requested from Will: none (the stand-ins are the bootstrap stills; every answer draws the album's own photos).
- Board ideas:
  - The anniversary, a year on, as the recap's later moment, once he picks where the recap lives.
  - The keepsake's premiere: the reel opening by itself on a guest's return, with Skip (his the-wait r1 note), motion
    this board's stills could not judge.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none for this board. Conditional on his picks, for the
  wiring lane: `wrap` needs `events.wrapped_at` (a migration), with `generateMetadata`'s inviting flag read as
  `accepting_uploads && !wrapped_at`; the `cover` or `strip` card needs a server read of the cover's ids as an anonymous
  full-access viewer (`pickCoverIds` runs on the client today), JPEG output (their PNGs are 1.1 to 1.7 MB, past
  WhatsApp's reported 300 KB; `sharp` as a direct dependency) and an Urbanist-Bold TTF the route loads (Satori reads no
  WOFF2); the `light` card needs a stored light (a column written where the hub already samples). Measured per render:
  cover one photo fetch, strip four, name and light none (`card.tsx`'s notes).
- Calls his to overrule: Q1 to Q5 above (each built as recommended) and the board's three carried calls.
- Look at first: the `over` step, offer against wrap (`shots/handoff/loops/after-party.over.offer.1-1440.png`,
  `.over.wrap.1-1440.png`), then `recap.home` and `recap.hub`, `keepsake.still` against `keepsake.closed`, and the card
  sheet (`.card.cover.1-1440.png`). A pick's wiring notes live in its story's comments (`over.tsx`, `recap.tsx`,
  `keepsake.tsx`: a cover with no acts of its own must tell the dock it has no row to wait on, since
  `useInViewSentinel` starts in view; `card.tsx`; `bridge.tsx`).
