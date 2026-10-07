---
track: after-party-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
