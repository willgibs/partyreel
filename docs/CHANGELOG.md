# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's,
`git show d2db2629:docs/CHANGELOG.md` for the stepped review round's, `git show 449d9b52:docs/CHANGELOG.md` for the wind-down's, `git show 22438704:docs/CHANGELOG.md` for the ladders-and-the-dock round's.

---

## 2026-09-19 — The morning sitting: the third batch on the overnight desk (`22438704` onward)

**What Will did.** The third batch (build `5910d48`) answered three overnight boards. `error-pages` whole: one grammar,
a guided way out, the strip kept to marketing (and tried as the icon: "It may look better as a replacement for the icon
above"), the digest always, every surface's own chrome, the private lock in the family with a homepage link, a portal 404
on the admin host, a way home on the global crash. `event-type-pages` whole with a steer: one template "so that we can
get all four beautiful quickly", heroes "custom and themed for its own page" inside shared patterns, the host alone, a
demo door that "needs a total redesign", four types, the 2x2 grid with the cards redesigned, the phone gap; and "all
event pages need a fresh visual identity as they've been falling behind". `how-it-works` seven of eight (`phone` a `?`):
both names kept, the host, six cleaner steps, bespoke pictures, one scroll with a NEW Host/Guest toggle, a demo proof
without a centred portrait video, one folded close, the footer's demo heading a size down. Three lanes cut: `errors-wiring`,
`loop-wiring` (built now, design-led, by his answer in plan mode) and `event-identity` (a ground-up round first, by his
answer). Two notes for the record only: kids are never a target user; a partners page for planners before launch.

- **`loop-wiring` merged at `ef948322`** (2026-09-19, Opus; cut `22438704`): `/how-it-works` rebuilt on the round-one
  picks, design-led. One scroll of six steps with a Host/Guest segmented toggle above them, a step set per side out of
  one new single source (`lib/constants/how-it-works.ts`, read by the page, a new shared overview stepper in
  `sections/shared/how-it-works-stepper.tsx` with its `@contract-for` test, and the app's welcome tutorial, whose three
  now derive from the host's first three); twelve bespoke pictures in the six FrameCard quotes' place, the host's as
  objects on a desk, the guest's as one phone with a companion beside each screen. The numbers stay put when the toggle
  flips (one Reveal per index; the swap its own 200ms `@starting-style` rise). The payoff is the demo as a finished
  album, a real code encoding `/demo` and no video; the close is one band with the free-storage line in its subhead;
  the pair is renamed across the spine's foot and the mega panel's card ("Read the full how-to") and the help hub ("See
  the loop, start to finish"); the footer's demo heading dropped a rung to sit level with a closing H2 (52px against
  52px at 1440). On the home the stepper took the three scene cards' place under the film strip, which stays with its
  lamp. The board retired, and `ReelPayoff`, `PricingPointer`, `SideChip` and `step-frames.tsx` with it; `phone=?`
  dissolved (its three options never left the host's side; the guest half is a phone now). Gate 31 green on the merged tree (lint 0 with the 8 known warnings, 2,553 tests, build 254 pages, `lab:smoke` 453 checks whole with the board gone from its table, `lab:demo` 8 steps on `site-chrome`). Five calls his to
  overrule on the alias: the stepper in the scene cards' place with the strip kept; the guest set's six moments (scan,
  the door, add, the room filling, save, the reel arriving); the demo proof without a video, the demo three times at
  the foot of the page as a decreasing ladder; the demo's promise naming what it is ("A real Partyreel album, curated
  by the host who ran it, open with no sign-up") rather than counting what is in it; "See full pricing" as the close's
  second button. Three ROADMAP lines (the `film-strip` section id's misnomer, the article's five steps against the
  page's six, no Library specimen for the stepper).

- **`errors-wiring` merged at `98909b34`** (2026-09-19, Opus; cut `22438704`): Will's eight verdicts on `error-pages`
  landed as production and the board retired. `NotFoundScreen` became the one primitive every failure page draws from,
  with a `visual` slot typed as a union with `icon` (no screen says the same thing twice), a `help` slot in its own
  stagger step and a `digest` slot rendering the new `error-digest.tsx` (the sentence, the code, a Copy with a receipt
  that survives a rejecting clipboard); `RouteError` folded into it and kept the reporting effect, which a source scan
  refuses inside the primitive. A new root `src/app/error.tsx` closed the gap where a crash inside a route group's OWN
  layout skipped every branded boundary. The strip took the icon's place on the group 404s and the marketing 500, the
  root 404 kept `Compass` over its trail, the guest crash gained a session-less `GuestBar`, the private lock joined the
  family with a homepage link under the real `GuestHeader`, the admin host answers `/features` and `/nope` as the portal
  through one build-inlined `surface()` branch (no route, no proxy change), and the last-resort screen gained a plain
  anchor home and a copyable code. Sentry, proved locally on a production build: nine crash renders, nine `render:*`
  events; twenty-odd 404 loads, none. Gate 32 green on the merged tree (lint 0 with the 8 known warnings, 2,565 tests, build 254 pages, `lab:smoke` 453 checks whole with the board gone from its table, `lab:demo` 8 steps on `site-chrome`). Five calls his to overrule on the alias: the strip as the icon on both
  marketing screens; `Compass` on the root 404; the admin's "Check the runbook." unlinked; `/contact` on the auth
  crash; the marketing 404 gaining no help line (it already carries the help center as an action and contact in its
  footnote). Six ROADMAP lines from the lane (a `render:root` area, a probe for `global-error` now that the boom probe
  lands on the root boundary, the Library's crash mock a round behind, one copy-with-a-receipt primitive, the group
  404s' `min-h-[60vh]` box, a runbook page); the probe's comment refreshed in the record.

- **`event-identity` merged at `d528e98a`** (2026-09-19, Opus; cut `22438704`; lab-only): round one of the event
  pages' visual identity, from the ground up, as seven decisions rather than a page, every option drawn on weddings and
  on conferences at 1440 and 375 with a measured caption: the hero's theme with the lockup held identical across the
  four options (the room behind the words, the photographs arriving, one bespoke lit object, today; recommended
  `object`, the only theme that is the type's own on all four pages with no new photography), the second section
  staged behind it (recommended `statement`), the arc zoomed down so its rhythm reads at once (recommended `chapter`,
  a full-width photograph as the turn to paper), the 2x2 card four ways (recommended `frame`), the proof rebuilt around
  the demo (recommended `door`), the reading copy measured against the ladder live in the frame (recommended
  `reading`, the two reading slots only; `body-type` lands the rest), the phone against a real 812px fold
  (recommended `split`). Gate 33 green on the merged tree (lint 0 with the 8 known warnings, 2565 tests, build 254 pages, `lab:smoke` 461 checks whole, `lab:demo` 7 steps on `event-identity`). Three calls carried on their recommendations: the hub wears the winning hero theme
  over a cross-event ground and keeps its all-dark ruling (one decision in round two if he wants it asked); the seven
  are answered on what is drawn, the two missing photo sets being what makes the winner whole rather than a condition
  on it; `the-ladder` stops short of the body ladder. Two slot asks (ASSETS rows 24 and 25: a conference room and a
  trip room, five landscape stills each, and one portrait card still per type) and a conditional third (row 26, a
  highlight render per type only if `the-proof=flanked` wins). Two ROADMAP lines (a per-type highlight render;
  `AlbumStream`'s fixed photograph set). The direct picks of `event-type-pages` wire after this round is ruled.

**Next.** His sitting on the desk, `event-identity` first (the hero's theme at 1440, then `the-proof=door`), then the
other twenty-seven boards; `/how-it-works`, the home's stepper and every failure page on the alias for his eye.


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

- `how-it-works` integrated (`e623e65e`; cut `449d9b52`): the page that tells the loop beside the article that tells it too,
  eight decisions on the real page pieces at 1440 and 375, every option measured in windows and by the first product
  picture's depth: the pair (both kept, each its own name), who (the undecided host, as today), the steps (six two-sided,
  step one's sentence made true), the pictures (the site's own frames), the shape (a two-column ledger, host and guest,
  stacked below `sm`), the proof (a door to the live demo), the phone (the real `PhoneFrame`), the close (one closing
  section). One call carried (the optional close asked). The lane ran its demo without `--base` and read "0 steps" as a
  desk-wide fault; the Orchestrator's gate on its own port found the eight steps (the ROADMAP's `lab:demo` default line
  stands). Four ROADMAP lines (the step-count trap, the label collision, the unread single source, the catalogue gap).

- `event-type-pages` integrated (`cee7768c`; cut `1cf54457`): the event-type landing pages, the hub and the four types, as
  eight decisions on the real pieces (`PageHero`, `EventHeroMedia`, the directory's grammar, `BuiltFor`, `ReelAngleBand`)
  at 1440 and 375: one page or four (one template, as today), the hero's picture (the split, as today, per the code's own
  manifest note), one hero (every page on `PageHero`, closing a gap-5 against gap-6 drift), who is greeted (one quiet
  guest line), the proof (a demo door in the arc, in `demo-event`'s own promise wording), how many (four, unchanged), the
  directory (two-up, as today), the phone (the measured 183 px FAQ-to-close gap halved, a small stylesheet change). Two
  calls flagged for his eye (a fifth type and a planner line are unresearched, per the product-defining rule). Seven
  ROADMAP lines (a stale blog tag, three unlinked posts, triplicated nav copy, a policy scan gap, a stale comment, the
  hub's missing OpenGraph image, a stale doc line).

- `error-pages` integrated (`3d30582f`; cut `1feccb00`, the round's last): every failure page as one grammar, eight
  decisions on the real not-found pieces and recreations of the three error boundaries with the Sentry effect removed
  (no lab press reported an event), at 1440 and 375: one grammar (one primitive with per-surface words: `RouteError`
  folds into `NotFoundScreen` for one added prop at zero visual cost), the ways out (a quiet help or contact line
  everywhere), the picture (marketing only, as today), the code (always, with Copy), the surround (the surface's own
  chrome always: a guest crash has no header today), the private event (the not-found family wearing a lock), the
  admin's 404 (a portal screen with no marketing links), the global crash (Try again and a way home). Three calls
  carried. A lab gotcha fixed in the board (stacked chromes with `vh` minimums compound against the frame). Three
  ROADMAP lines (no root `error.tsx`; the group 404s' fixed 60 vh box; the stale "may have ended" line deleted).

**Next.** The round is closed: twelve boards on the desk for his sitting, every seat free, zero questions asked of him
mid-lane (every call carried on its lane's recommendation and listed above). The alias serves the closing record (`5910d489`; the
window freed on its own), seven deployments pruned, the wiring lanes' surfaces red-teamed on it signed out and clean (the
signed-in half waits on his account chooser); then his batches.
