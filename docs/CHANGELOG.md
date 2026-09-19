# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's,
`git show d2db2629:docs/CHANGELOG.md` for the stepped review round's, `git show 449d9b52:docs/CHANGELOG.md` for the wind-down's.

---

## 2026-09-19 — The overnight round: twelve boards cut from read-only maps and integrated while Will slept (`d1923907` onward)

**What Will did.** He signed off for the night with two messages (verbatim in `docs/design/rulings.md`): burn the week's
unspent tokens on lab explorations, "at worst, net neutral and fully deleted"; find the surfaces without him, eight slots,
then "12 more agent slots throughout the night... paced by a fixed amount of parallel explorations"; no questions until
morning. Twelve read-only maps (Sonnet, one per surface) found the seams recorded in `tracks/orchestrator.md` ("The overnight
round's maps"); twelve boards were cut from them, six seats at a time, every open call carried on the lane's recommendation
and relayed here for his morning. The records follow in the order the lanes handed off.


- `host-curation` integrated (`ff09a50f`; cut `d909cb13`, the overnight round's first): the host's act of reviewing what
  guests send as eight decisions on the shipped review surface, the triage machine forked so nothing reaches a mutation:
  the queue (the album's own shapes; today's 4:5 grid at 375 judges a stranger's photograph at 112 by 140, seven at once),
  the verb (Reject at the door, Hide after), the peek (a look you can act in), keys (arrows with a hint row), undo (on the
  toast), arrivals (a line that says how many), the count (three that agree and lead somewhere), told (never; the most
  overrulable). Five calls carried on their recommendations (the recut first root relitigates his 2026-06-22 uniform-grid
  ruling and says so). A shipped bug found in the frame: the hidden-media dim has never rendered (ROADMAP, Now).

- `help-center` integrated (`5118c141`; cut `d909cb13`): where a host or a guest with a problem lands, seven decisions on the
  real help pieces with hand-authored bodies for three articles at 1440 and 375: who the hub greets first (the device
  implies it: a phone opens guest-voiced, a laptop host-voiced), whether the index sheet survives (doors, then the sheet),
  the how-to's shape (the real screen beside each step), help from inside the product (a link at the moment of trouble),
  feedback (a counted beacon), troubleshooting's dead end (a rung of its own), search's reach (a visible trigger, kept
  local). Four calls carried on their recommendations (the phone ask skipped; the beacon's table and the screen option's
  content cost belong to the wiring). Two ROADMAP lines (FAQ structured data; the audience default).

- `reel-studio` integrated (`d10149bd`; cut `d909cb13`): the highlight reel from the studio to a guest's hands as eight
  decisions on local replicas at 1440 by 900 with 375 on a knob, every reel frame drawn once per style and shared by all
  24 options, nothing reaching an RPC or an encode: the door (the poster card itself tappable), the room (a workbench, the
  reel large with the open work beside it; today's wall draws four 348 px frames into a 360 px panel and not one fits
  whole), the styles (the rail, revived; staged behind the room), the moments (the pool; today's sheet covers 72 percent
  of the reel it recuts), a blocked tile (a caption), sharing (an Undo), the wait (progress in the player), how a guest
  watches (today's overlay, the one "today" win). Four calls carried (Download folded into the room; the sheet option
  replaced by the bench rather than reopening his route ruling; the guest's third option kept to the container; the
  1280 px poster card around a 360 px reel, his to overrule). Six ROADMAP lines.

- `emails` integrated (`2135ce6e`; cut `d909cb13`): every email Partyreel sends as eight decisions on the ten real templates
  called with fixture options inside a built inbox mock at 375 and 1440, nothing sent: one shell (one wrapper, two feet),
  the brand (the wordmark at the head, no new asset), the sender (operator subjects tagged), the foot (an unsubscribe and
  an address on the commercial-leaning four), the sign-in mail as a labelled mock (digits with a button beneath), the
  moments (retire the four dormant switches), the guest's (the album link, once), the dark inbox (the shell declares
  light: today's declares a text colour and no background, near-illegible in a dark client). No questions; three ROADMAP
  lines (no plain-text twin; `sendOnce` untested; a stale `PRICING.md` line about the resend cooldown).

- `media-viewer` integrated (`596ca8dd`; cut `d909cb13`): what a photograph opens as, eight decisions on the real viewer's
  pieces over one open wedding, 375 first with 1440 on a knob, four roots and four staged, every caption measured in the
  frame: the opening (the photograph grows out of its tile), what stands beside it (one strip at the foot), who took it (the
  name and the time on the chrome's own line), the next one (the neighbours peek at the edges), how close (pinch inside the
  viewer; a face in a group photograph is 36 px across on a phone today), a video (a play badge), the way out (swipe it
  back down into the album), an address (the album's link with the photograph on it). Three calls carried (a guest's
  photograph never leaves as a file; one shape binds the host's viewer; a zoomed photograph owns both axes until it
  settles). One asset asked (a real vertical clip, row 23). Three ROADMAP lines (the viewer has no arrival; `MediaTile`'s
  lazy loading resolves against the top window inside an iframe; six surfaces disagree about what a viewer holds).

- `admin-triage` integrated (`30db05e5`; cut `d909cb13`): the operator's act on a report as eight decisions on presentational
  forks of the admin pieces with one Saturday night's fixtures, inside the `admin` board's shape worn as settled: what a
  report looks like (the picture beside the reason, a row each: 341 px to 272), a wordless one (nothing drawn), what a
  verdict costs (a required line that IS the record, into the column empty since the founding migration), what a closed
  one leaves (one line with a day's Undo: three answered reports from 844 px to 158), the legal-hold door (pre-filled from
  the report), the phone (see it and stop it; the rail takes 62 percent of a 375 screen today), four inboxes (one control
  taking each surface's words), who is told (silence, by doctrine, until he rules). Four calls carried. Six captures
  caught defects the gate could not. Five ROADMAP lines, one on the lab itself (a responsive Tailwind variant never
  reaches a board's frame). The smoke crawler's 400-page cap ran out at 24 boards (every step is a page); raised to 800.

- `export-flow` integrated (`afde9ca3`; cut `5649285b`): getting everything out for a host and a guest as eight decisions on
  the real dialog's shell and body reproduced over fixture summaries run through the shipped arithmetic, phone first, a
  scoped `fetch` guard refusing every export request: what Download hands a guest (their own shots first, the album under),
  the Videos chip for a teaser (stays and says why), the wait (the dialog holds until it lands), a mint that never answers
  (it gives up and offers Try again), a hollow zip (it says what did not make it), the 2,000-item cap (the product splits
  it and never refuses), what keeping the album means (the link first, the zip under it), the phone (the copy names where
  the file lands). Five calls carried (a guest's own uploads are identifiable server-side; the Worker may tell the page a
  nonce and a written count; parts split by items; SELECTED left to `app-vocabulary`'s bar; the dialog reproduced, not
  opened). Seven ROADMAP lines: the app goes blind at the tap (no timeout, a silent skip, no iOS answer).

- `profile-page` integrated (`b75cd30a`; cut `c74a509d`): what a person is on Partyreel beyond one album as eight decisions
  over one cast at one wedding, phone first, two roots with four and two staged behind them, the social controls forked so
  no press reaches a row: whether a person has a page at all (the page), what stands above it (the album's own header),
  what it is made of (every party as a card: an attendee's first screen goes from 2 percent picture to 48), what the top
  says (one line of their own, capped and moderated), how a person blocks (inside a Report menu, drawn as a future), who an
  album names (everyone signed in, and the marketing sentence that denies it corrected), when a handle is offered (right
  after their photographs land, free to claim), how the guest list draws (a row of faces: 450 px in twelve rows becomes 24
  in one). Eight calls carried on their recommendations (two loosenings of the ruled privacy scope, the handle's Pro gate,
  the sentence over the list, the bio's moderation, the person-report inbox, the 404 and the phone step cut). A shipped
  defect: `/u/[slug]`'s identity row squeezes the name column to about 90 px at 375. Six ROADMAP lines.

- `site-chrome` integrated (`6a7e6f2f`; cut `ee45b8f3`): the marketing header, the mega panel, the phone's menu and the footer
  as eight decisions in a true frame over a real page at 1440 and 375, the nav forked with its route as a prop, the
  material left to `glass` round two: the shape (flat links, the mega panel retired), what it holds (three groups,
  Resources folded into the footer), the returning host ("Dashboard" from a presence-only cookie hint, never a name), the
  phone's menu (a flat sheet), on scroll (64 px, as today), the foot's job (a closing invitation), the foot's door ("Start
  free" always, the demo when set), two doors to one loop (one door). Three calls carried (retire the 2026-08-28 nav round
  whole; a marketing island may read presence only; the header-to-footer mirror pin becomes a footer-column guard). Four
  captures caught defects invisible in review. Four ROADMAP lines (the `/#faq` row; "four steps"; nav labels under a
  transparent bar over a bright photograph; the dead `markOnly` branch).

**Next.** The remaining lanes of the round (on the seats: `media-viewer`, `admin-triage`, `emails`, `profile-page`, `how-it-works`;
queued: `export-flow`, `site-chrome`, `event-type-pages`, `error-pages`), then the alias rebuilt when Vercel's window frees and the
red-team of the wiring lanes' surfaces; his sitting on the desk in the morning.

## 2026-09-18 — The ladders and the dock: both ladders wired, the lab's step rebuilt, four question-first boards cut (`00e82dba` onward)

**What Will did.** The eighth batch (`00e82dba`) answered both ladders (`type-phone` r1: "Everything should be
addressed in our design system type ladder"; `rounding` r7: family C, quarters, dead rungs dropped, the gap pinned);
the Terms got their generated-media sentence. The ninth (`d62dac22`) closed album-hero r3 (`composition=none`: "my
calm instruction messed us up - now it feels too boring") and river-visual r2, and answered `proportion` with the lab
itself. The calm lesson is PROGRAM.md's: a relative note is answered against a reference, never a cap and a test.

- `ladders-wiring` (`5a5c6eb4`, `d2db2629`; bible 5 and 8 ruled): the type ladder's law became the ORDER (`prose` 24 at a
  phone, `subhead`, 126 headings onto their step) and the corners family C in quarters (8 / 12 / 4, `cta` on 46 sites).
  The lab's step rebuilt (`d37be90e`): the preview is the page, the answer a dock, `lab:demo` fails CLIPPED, UNLABELLED,
  NO DOCK. The glow boards retired; `lab:smoke` passes whole. Four boards cut (`33f1de95`); `gallery-width` r1 measured
  its columns inside a `Frame` at 1280, 1512 and 1920 (the tile 240, the width full, the words at the edge, the host the same).
- The Orchestrator changed seats mid-round (a weekly limit; a second account resumed three lanes: Fable orchestrating, boards
  on Sonnet, wiring on Opus). Integrated: `heroes` (`6b5ea1bf`), `ghost-wiring` (`31c94253`: the river on the empty album,
  `src/components/shared/river/`), `river-card` (`3ed62f0c`: the river in the real QR door, 3.0 px a module), `voice`
  (`e0b92af6`: eight real lines, bible 20 first), `body-type` (`130236c2`: the body and label ladder, seven measured
  decisions; two questions his), `glass` (`30aaf705`: four recipes, Frost recommended, every cost measured), `loose-ends`
  (`b83b7c3d`: six ROADMAP lines as seven decisions; four chart aliases fixed at `0681652c`).
- **milestone-25** (`bf9cbd74`): `main` merged from `707d99a2` on Will's word, 1,138 commits: Graphite, the ladders, the
  Aurora, the wordmark, the river; the lab gated.
- `admin` (`d6305818`: the portal's shape as seven decisions on the real components with a Tuesday of fixtures: a ranked home,
  a rail plus a palette, density, the state chip, destructive acts, a health band, a 44 px bar), `admin-split` (`7f3738ba`:
  `src/lib/surface` decides which surface a build serves; the cutover closed with milestone-26) and `admin-jobs` (`3ad58b1c`:
  the jobs console through one pure `jobHealth`, nine jobs, the Worker's depth reading, the purge's sweeps as jobs (QA #27),
  the limiters reporting (QA #19); the migration applied, the Worker `d7b16bcc`) integrated.
- `backdrop-wiring` (`9795e370`): `full-quality` wears a switching full-bleed pool behind the glass plate with the band
  trigger and the foot rail, a still under reduced motion; his fold as one line (chapter one closes on the photograph; his
  to overrule). 5.12:1; row 20 at 1200 px. `gallery-wiring` (`666ee8bc`): galleries declare a column WIDTH, one rule in
  `shared/masonry.tsx`: 2 / 5 / 6 / 8 columns at 375 / 1280 / 1512 / 1920, the album 20 px from each edge, the words at 632;
  two calls for Will. `trail-wiring` (`73451c79`): the trail in `src/components/shared/trail/` at his numbers on the root
  404, the shy fade a feathered window (4.90:1); the group 404s keep their strip, his to widen. All three boards retired.
- `app-shape` (`aa338766`): the host app's shape as eight decisions on one host's Saturday night on the shipped `AppShell`,
  `EventCard`, `FilterChips`, `StorageMeter` and the grids: what the home opens on, how an event draws, what its page is (a
  front page with a door into each room), how seven routes are reached, sharing, settings, You, a bar at the thumb. Four
  questions carried. `guest-shape` (`beee6325`): the guest experience's shape as seven decisions on one wedding in four
  access states, phone first: the door after the scan (one screen), an empty album (the river), the chrome docked at the
  foot, whether the album admits it is filling, one sheet for four dialogs, a window to take a photograph back, one voice for
  the account. Three questions carried. `app-vocabulary` (`e442fc55`): the vocabulary under both shapes as seven decisions:
  three empty-state tiers, one loading primitive only where a route waits, two of four tile grammars unified, icons on both
  bulk toolbars (measured at 375), the tile-size control remembered per device, one confirm switch.
- `contact-page` (`a8afce0c`; cut `e442fc55`): how someone reaches a person at Partyreel, six decisions on the real desk
  over a host mid-event, a planner and a reporter: whether a form is required (it leads), what the sender holds afterwards
  (the card; a receipt is a send to an unverified address), urgency (a promise per topic), the topic (required), the page
  against the cinema rhythm (the desk inside a cinema frame), what stands beside the form (the directory). Three findings deferred.
- `press-page` (`060dfdf4`; cut `e442fc55`): what Partyreel hands the world about itself, seven decisions on the real
  `PageHero`, `PressSection`, `PressSheet` and copy buttons: who the page is for (one page), the sheet (eight plates; the
  marks are ASSETS row 19), the words (a paragraph and a line), the facts (rows plus the machine-readable copy), a human (a
  role address), the close (the contact door with Press pre-picked), the arc (today's). One question his: "Live now" pre-launch.
- `demo-event` (`e3a2c1b6`; cut `391c40e9`): the demo as the product's first impression, seven decisions on the shipped
  guest page in demo mode and the real doors, laptop first: the arrival (a screen that hands them a role), the framing (a
  mark in a header that stays), the upload as the moment (then the turn), the way out (the blanked Save slot becomes "Start
  your own"), what a door promises (the party named), the phone scanned off the laptop (one session), how many parties
  (one). Three questions carried (the entry-modal pin; the pairing's transport; the demo's server side is UI-only). Seven defects fixed.
- `app-pricing` (`0379c529`; cut `e442fc55`): pricing inside the app as eight decisions on the shipped chrome with four
  hosts, every number from `tiers.ts`, no preview reaching Stripe: what a click opens (a sheet in a hand, a dialog at a
  laptop), what it opens on (the reason they clicked), how much it holds (fitted: 58 percent of a laptop window against
  parity's 95), how `/pricing` stays a click away (a quiet line), the pass (one line and a button), the doors (plus a plan
  row in the user menu; the third option is app-shape's `you`), how a locked control asks (a lock chip), what Checkout
  returns to (the control itself, open). Three questions carried; five defects fixed.
- `pricing-page` (`f79a8037`; cut `1928c3c4`): the marketing pricing page as eight decisions, one per part, every option
  the real pieces with a measured caption and every price from `tiers.ts`: the opening (a fork: the first price 426 px
  down against 735), the pair (Pro takes the row, Free one line beneath), the size (three rows), the pass (an equal card),
  the calculator (today's wall), the sheet (the table alone: 2,676 px to 2,053), the close (four questions open), the
  phone (a swipe row, 1,250 px against 1,850). Three questions carried; three defects fixed.
- `app-door` (`2960db15`; cut `e442fc55`): login and signup as seven decisions on the shipped auth components, no preview
  touching the network: what the door asks first (the code), how many account surfaces (one object worn four ways; 0 of 2
  guest surfaces carry the Terms line), what stands before the app (the name, then a first event ending on a live QR),
  what `/login` is (the door with the product beside it: 13 percent of a laptop today, 50 beside), an existing email (open
  it and say so), failure (the ways out as buttons), a host the browser knows (welcome back, one field). Four questions
  carried; five defects fixed.
- `first-event` (`728513ee`; cut `060dfdf4`): a host's first event from "Create" to a code on the table, eight decisions in
  three beats on the real create card, the preset picker and real `StyledQr` plates, every caption reporting the module
  edge against the 3 px scan floor: what creating asks (the name), where the style is chosen (after, on the real code), a
  Free host at the limit (the form says so), how the code reaches the venue (stock the app prints), where the host lands
  (a beat of its own), what a host holds out (the code alone, full screen), the empty event (a launch list), the first
  photograph (it lands while she looks). Six questions carried; two product misses (swatches at 2.3 px a module; a preview
  link that 404s). Seven defects fixed.
- `guest-upload` (`1649506c`; cut `a8afce0c`): the moment a guest adds a photograph as eight decisions, phone first, on
  the shipped guest components over one wedding, nothing uploading: the tap (two inputs, one carrying `capture`), sending
  (no chrome until two seconds), held (the guest's own photograph waits under a clock), failed (the tile keeps its reason
  and a Retry), the batch (one stacked tile: nine tiles hold 43 percent of a phone screen, one holds 11), the landing (the
  banked shimmer spent once), the warning (the terms at the act; a named stand-in), the words (12 px to 15 px). Four
  questions carried (the camera input drops multi-select; a guest seeing their own held item; a tile before its bytes;
  body-type's floor). Four defects fixed.
- `river-wiring` (`5297cb07`): the album pours out of a real scannable code a tenth down a tall 4:5 door, the card
  streaming behind the copy; the card engine folded into the shared river as one `origin`; `CARD_COPY_SCRIM` on every
  media-forward card; `/demo` a 307. Two questions carried. Both boards retired. `privacy-concept` (`6c99e128`): round
  three, three concepts on the page's theme (a breathing aperture, tiles taking turns clearing, sealed cards).
  `album-wiring` (`2ca47448`): the live album under the host's header at 896, its foot dissolving, lit by the halo,
  photographs falling in at the home hero's pace, the stream a pure engine in `src/components/shared/album-stream/`;
  `album-motion` open with three variations. Three calls his to overrule. Both boards retired.
- **milestone-26** (`df173c2e`): `main` merged from `353ad884` (48 commits) after Will's sign-in on the admin preview: the
  surface module, the jobs console, the sub-sweeps, the static chart aliases; the cutover closed the same night (the domain
  moved by his click, the apex on `NEXT_PUBLIC_SURFACE=app`) and the one purge run on the app surface closed the runbook on
  2026-09-19.



**The second sitting.** The first batch (build `93d00ff`): `cursor-backdrop` r1 whole ("I absolutely love the rail of the
foot") with the ruling that full-image sections are chapter transitions, never at every cut; `image-trail` begun. The
second (build `9720798`, 2026-09-19): `image-trail`, `album-page`, `river-card` and `gallery-width` whole; `privacy-hero`
r2 a `?`; four wiring lanes cut.

**Next.** His sitting on the desk (`voice`, `glass`, `loose-ends`, `body-type`, `admin`, `app-shape`, `guest-shape`,
`app-vocabulary`, privacy-hero round three, `album-motion`); five boards from his stacking steer; then the wiring lanes.
