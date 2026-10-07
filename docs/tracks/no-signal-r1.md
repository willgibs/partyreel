---
track: no-signal-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "c9aa06af"            # the launch-prep SHA the branch was cut from (c685648d plus the pickup records)
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

- **Scope: three asks; keep and resume asked as one ladder.** The brief named four (the drop, keep, resume, the roll).
  Asked apart, keep and resume would offer what cannot be built (a resume at her next open needs the phone's keep), so
  they are one ladder, `carry`: `retry` (today: the open page, until her Retry), `return` (the open page sends by
  itself when she comes back to it with the line back), `phone` (her phone keeps a copy of each until it lands, sent
  when the line is back or at her next open). Android's Background Sync (a first service worker, Chromium alone; on
  an iPhone it lands on the phone rung's answer) is the carried call `background` (taken: not yet; overrule: build it
  now). The drop is staged after the carry and drawn in its words; the roll stands alone, its costs phrased to hold in
  every carry. Recommended: as built.
- **The roll's rule, Will's one-way door (the brief's flag).** Drawn both ways: `lands` (today, read from the code: a
  shot that fails for want of a line is taken off the count and the reel at once, so he shoots past his roll offline,
  and the server refuses the extras as the line returns, said only on the album's sheet once the camera closes) and
  `taken` (recommended: like film, a press spends its frame on the device at once; the count steps down offline and
  every shot he took lands). One-way because the count is the roll's promise and guests learn it, and `taken` puts a
  share of the roll's truth on the device. Its wiring's own decisions, each with a recommendation (the roll helper's):
  taking back a waiting shot waits until it lands (the ceiling stays the server's one ledger; its line in a dead zone
  "Waiting for your connection. You can take it back once it's in."); the roll's end offline withholds "Take a shot
  back to free its frame" while shots wait (a take-back needs the line), the waiting line in its place (drawn); a
  waiting shot the phone lets go (a cleared page under the page's keep, Safari's 7 days under the phone's) gives its
  frame back and is lost, so the count is the server's roll plus the waiting shots this device still holds; a second
  tab or device spending the same last frames is refused at the server, as today (accept); no button on the waiting
  line (the shots go by themselves; the carried `check` covers venue Wi-Fi); a new period while shots wait (a develop
  time added) lands them in the new roll, spending its frames (accept, note).
- **The words: the house's own vocabulary for the line.** The board says "No connection" (the state's word) and
  "Waiting for your connection" (a row, a sheet's head: the export walk's word, crumbs-71), never "No signal", which is
  false on a crowded stadium's full bars (E6's own picture) and on venue Wi-Fi with no internet; "kept on this phone",
  never "safe" (Safari clears a site's storage after 7 days away, a private tab on close); and no Try again while the
  phone is offline (crumbs-71's rule: a press there can only fail). The board's title keeps the brief's name.
  Recommended: as built.
- **The drop asks the container, never its words.** Over the party (a sheet), in the send's own place (the stack
  standing by), or in her list (her uploads): each speaks its carry's words, so in a carry that keeps her photos the
  sheet says "2 waiting for your connection", and today's failure sheet is drawn verbatim only in today's carry (the
  creative director's pass). Recommended: as built.
- **Albums that wait (the host's yes, a develop) have no stack to stand by in.** Carried call `waits`: her uploads
  (already there on those albums) hold what waits, a row half-lit, "Waiting for your connection"; overrule: today's
  sheet there. The Add's ring while photos wait is production's sending ring held still, its waiting look signature
  r1's to finish (carried `ring`). Recommended: as built.

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte, and nothing the board met contradicts a system doc (what production
  gets wrong is listed under Deferred, for a crumbs lane).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Before launch · The guest's album: the album's failure sheet offers Retry on a roll refusal (`upload-refusal.ts` has
  no `roll_spent` case, so `retryCanPass` is true): Retry both and each row's Retry over shots the roll refuses again,
  under a Not now that promises a later go; class it as the file's own (no Retry, "Take another to add one."), as the
  camera already does (`shots.ts:121`) (no-signal r1's roll helper).
- Before launch · The guest's album: the send's toast ("Your photo joined Maya's album.") fires beside the failure
  sheet at one run's end (`useSendToast`'s `quiet` leaves the sheet out), a "joined" over "2 of 3 didn't upload"; quiet
  it while the sheet stands, or let the sheet say what joined (no-signal r1's drop helper).
- Upcoming · The lab and the kit: at 375 a step of three phones stands at about 29%, its bottom third empty and a few
  pixels' words unreadable; stack or swipe a step's frames at a phone's width (no-signal r1's creative director).

## Handoff (replaces the chat report)

- Commits on `lp/no-signal-r1`, pushed: `c656537dd` (the first draw), `bc2145d7a` (each question drawn to its best by a
  helper: the carry, the drop, the roll), `9e4ffdb2c` (the creative director's refinement), `db7d4beb6` (the readers
  find an open layer by its slot, `layer-is-up.test.tsx`'s rule); this manifest's commit is the head. Cut from
  `c9aa06afb`; no sync: launch-prep moved only by records since (`cb44675ec`, `f0beab803`, `efda4c701`, `4e142c25e`),
  none touching this lane's reads.
- Gates on `db7d4beb6`, each on its own exit code (logs in `../partyreel-wt/_scratch/no-signal-r1/`, `gate-exits.txt`):
  `pnpm typecheck` 0 (`gate-typecheck.log`), `pnpm lint` 0 (`gate-lint.log`), the board's own `registry.test.ts` 0
  (64 passed, `gate-registry.log`), `pnpm test:rules` 0 (85 files, 1489 tests, `gate-test-rules.log`), `pnpm lab:smoke
  --base http://localhost:3136` 0 (5 checks, 0 failing; the board 952 words of 1200, `gate-lab-smoke.log`), `pnpm
  lab:demo --board no-signal --base http://localhost:3136` 0 (3 steps, 0 failing, every option drawn at 1440 by 900 and
  375 by 812, `gate-lab-demo.log`; and the drop in the phone world, `--state carry=phone`, 0,
  `gate-lab-demo-drop-phone.log`). A board's light gate (no full test run, no build).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/no-signal/` (15 files)
  + this file.
- carry (first; recommended `phone`): how far her unsent photos are carried: today's open page until her Retry, the
  open page sent by itself as she comes back to it, or her phone keeping a copy until each lands; two fixed moments a
  rung (12:40 am, she comes back to the open page with the line back; 9:10 am, she opens the album after the page
  closed in the night) beside a two-lane night (`NightStrip`: where her two photos are at each beat, lit, waiting or
  lost).
- drop (staged after carry, drawn in its words; recommended `standby`): what she sees when the line drops mid-send:
  a sheet over the party (today's failure sheet verbatim in today's carry), the send standing by in its own place (the
  stack's pane "No connection" over the carry's promise, the stand-in, the Add's ring held at what landed, nothing
  opening), or her uploads holding them (the stack steps out; production's round at the foot widened to "2 waiting to
  send"); each at the drop, at 11:44 as she sends one more, and on her press.
- roll (the one-way door; recommended `taken`): today's count, true to the code (4 left through six presses, two shots
  refused upstairs on the album's sheet, whose Retry cannot pass), against film's (the count stepping down, the roll's
  end leading with what waits, all four in); under both a ledger of his presses and the reel at twice its size.
- Platform truths the costs rest on, doc-checked 2026-10-07 (MDN, caniuse, WebKit's blog): Background Sync and
  Background Fetch Chromium-only (no Safari on any platform, so no iOS browser); Safari 17+ quota up to 60% of the disk,
  whole-origin LRU eviction under pressure, script-written storage deleted after 7 days of Safari use with no tap (a
  home-screen web app exempt, `persist()` by heuristics); private browsing keeps nothing past the tab; `onLine` says
  online on Wi-Fi with no internet (hence the carried `check`); a photograph is one PUT under 100 MB, so a drop part way
  sends it again from the start (hence no held bar).
- For the wiring lane (drawn, not built): the phone's keep has a precedent in `door/wait-picks-store.ts` (IndexedDB,
  filed under the album and its owner, put down unread when the owner differs), so a waiting send filed under the album
  and her ticket keeps a shared phone from sending one guest's photos under another's name; the copy must be written
  as she sends (a page an iPhone suspends can be cleared before any drop is seen); a waiting file never reached the
  server, so its Remove is the page's own put-down, not `remove_my_upload`.
- Assets requested from Will: none.
- Board ideas: the install board (ROADMAP's "whether an album installs to a phone") gains a reason: a home-screen
  album is exempt from Safari's 7-day eviction, can be granted `persist()`, and can be told "they went in" by push
  (X11), so the phone's keep outlives a quiet week · a guest's own "what happened to my photos" (her sends, what
  landed, what waits, what was refused and why) across albums, after the carry is wired.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule (the board's carried calls): `whole` (every file whole, copied as she sends; overrule: the
  camera's shots alone), `next-open` (by itself as the album opens; overrule: asked first), `check` (a tiny static
  file, no function; overrule: the phone's word alone), `background` (not yet; overrule: build Android's now), `waits`
  (her uploads on albums that wait; overrule: today's sheet there), `ring` (production's ring held; overrule: its hue
  drained here); and the lane's: keep and resume as one ladder, the house's vocabulary ("No connection", "Waiting for
  your connection"), the drop asked as a container.
- Look at first: the drop in the phone world (`?session=no-signal.drop&carry=phone`): standby's first frame (the
  stack's pane "No connection / Kept on this phone", the Add's ring with its 2) beside the sheet's "2 waiting for your
  connection"; then the carry's 9:10 frame flipped from `return` to `phone` (lost, then sending what it kept); then the
  roll's ledger, `lands` against `taken`.
