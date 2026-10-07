---
track: no-signal-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "c685648d"            # the launch-prep SHA the branch was cut from
board: no-signal
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/no-signal/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - docs/PRD.md
  - docs/reviews/brand.json
---

# lp/no-signal-r1

**Goal.** Board no-signal r1, the gap audit's second design gap: a party with no signal, what a guest sees and keeps when the line drops mid-send or never comes, and what resumes when it returns, drawn on production in Aperture with each option's engineering cost named.

## The brief

**The round's direction (Will, standing):** world-class tastemakers, never "a junior designer told to build a rainbow app"; light, never paint, and restraint is the brand; delight where it costs nothing in clarity; attention earned, never yelled (the one thing that needs her may draw the eye, beautiful and inviting, nothing crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); never dev-tool-ish; production the working version.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app, and nothing deploys. Port 3136 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in look runs on your own port in a headless Chrome of your own through `usher/kit/redteam/signin.mjs` (testing-verification.md), never Will's browser pane or his Chrome; never kill a process by its name, by port or pid only.

**The vision you draw in (brand r2, `docs/reviews/brand.json` round 2: take = aperture; its board `src/app/(dev)/design/sandbox/brand/`):** Afterglow's light, never paint, colour from the photographs, then the event's seed, then the house; drawn only as a Ring, a Seam or a Bloom, one to a screen, still until something happens; a status a point and its word; on paper the light lives in pieces of the room the page holds. brand-marks r1 and signature r1 are on the next desk (the marks, tokens and status set; where the light lives in the app): draw on today's tokens and never ask what they ask.

**The gap (app-gaps-r1, gap 8; its ledger `../partyreel-wt/_scratch/app-gaps-r1/ledger.md`):** capture does not survive a dead zone. A send without a line ends "2 of 2 didn't upload… Retry" with no resume when the line returns; a camera shot taken offline is re-sent only while the camera stays open; nothing outlives the tab (no service worker; iOS kills background tabs, so a closed or killed tab loses an unsent photo). The ROADMAP's lab line ("a party with no signal") holds the material: unsent originals kept on the device (IndexedDB) and resumed on the next open with a "3 waiting to send" chip, Background Sync where it exists, and whether a camera shot spends the roll when taken or when it lands (Will's).

**Draw it true to the platform:** doc-check before you draw a cost (Context7, MDN, WebKit's own notes): what iOS Safari keeps and evicts (its storage quotas, eviction under pressure, ITP's cap on script-written storage for a site she has not used in days), where Background Sync and a service worker's fetch exist and where they do not, how large a video can be held whole on a phone. Each option's `costs` names its engineering in a line (what it needs that production lacks), so Will weighs the build beside the feeling. The send stack as wired (album-moments: each photo glowing as it lands, one toast at the end) is production's working version: draw on it.

**Asks you shape (each one decision, real contenders far apart; three or four):** what she sees the moment the line drops mid-send (the stack's state and its words: what happened, that nothing is lost, the one way to put it right); what is kept and where (the tab only, or the device); when it resumes (by itself when the line returns, on her next open, or both, and what tells her); and the roll's rule for a Disposable's shot taken offline (spent when taken or when it lands), drawn both ways, recommended, and flagged as Will's one-way door.

**Will's open decisions you never presume** (`docs/calls.md`, X9 to X17): who Partyreel may contact outside the app (X11: no email or push is assumed; where a moment would need one, the option's `costs` says so), words in the album (captions, a guestbook), co-hosts, an event's inner shape (days, chapters), prints. A board draws a decision's surfaces only once he picks its model; until then an option may lean on one only as a named Question in your Handoff.

**Never asked here:** the send's glow and its toast (album-moments, wired), Create, the host's hub, the camera's re-shoots (camera-wiring, wired).

**The method:** a helper per option holding the whole brief, a creative director's fresh-eyes pass, one refinement on everything it names; asset gaps as Higgsfield asks in the Handoff (docs/ASSETS.md's form), the stand-in shipped meanwhile. A board's light gate (PROGRAM's "Speed over proof in exploration").

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/no-signal/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `no-signal`, its title, `surface`, `desk: 14` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
