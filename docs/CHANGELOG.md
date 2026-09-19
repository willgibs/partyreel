# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's,
`git show d2db2629:docs/CHANGELOG.md` for the stepped review round's, `git show 449d9b52:docs/CHANGELOG.md` for the wind-down's, `git show 22438704:docs/CHANGELOG.md` for the ladders-and-the-dock round's, `git show b30445d9:docs/CHANGELOG.md` for the overnight round's.

---

## 2026-09-19 — The evening sitting: the fourth batch and its wiring (`b30445d9` onward)

**What Will did.** The fourth batch (build `e54d4eb`) answered three boards whole, 23 verdicts and no `?`. `event-identity`:
the hero's theme `object` ("conveys more about how we actually help that event (such as incorporating the QR)"), the
second section `statement` ("the UI could be improved a lot"), the arc `chapter` ("paper chapter with photo transition"),
the cards `frame` with a photograph for all four types ("a ton of design polish"; the tucked artifact at 375 banked), the
proof `door` (the river beautiful, the right half "could use a redesign", the asymmetry kept), the ladder `reading` with
his own sizes (the hero subhead 20 to 22 at desktop and 20 on a phone, the opening 18, "not a strict hard ruling"), the
phone `words` toward half-and-half with the visual crossing the fold; and the seven drawings "are not nearly good enough"
as a final page. `site-chrome`: the panels and all four groups kept ("far more full, established, and trustworthy"),
Dashboard for a returning host, the accordion sheet, the bar hiding on scroll (a circle-back once it looks beautiful over
paper), today's three footer registers ("would love to see a couple additional explorations of footers that work well
with that closing CTA pattern above"), Start free always ("we should always have a demo event set and ready"), one loop
pointed at from both nav doors. `profile-page`: the page as the core with a quick-look mini version added, the album's
header (with a worry about the way back), every party as one card group with a host or guest marker and no photographs
gallery, a bio line with the avatar centred on the name, block inside a Report menu ("a more scalable pattern"), everyone
named (his reasoning in rulings.md), the claim right after an upload ("Amazing capture method"), a faces row with a View
all whose shape he asked to see explored. Four answers in plan mode: both nav doors open the page; the profile's eight
wire now with round two in parallel; handles free for everyone ("We can keep custom event slugs as a pro feature, but
handles for everyone incentivizes guests to get deeper into our ecosystem"); the event pages wire now, design-led. Five
lanes cut at `b30445d9`: `events-wiring`, `chrome-wiring` and `profile-wiring` (Opus, production, judged on the alias),
`footer-close` and `profile-reach` (Sonnet: round two of `site-chrome` on the footer against the closing CTA, and of
`profile-page` on the three open pieces).

- **`profile-wiring` merged at `062498c3`** (2026-09-19, Opus; cut `b30445d9`): Will's eight verdicts on
  `profile-page` r1 as production. `/u/[slug]` moved onto the album's own `GuestHeader` in a new event-less mode with
  a guest-bar 404 beside it; hosted and attended parties became ONE grid of `EventCard`s marked Host or Guest, the
  attended covers presigned only through the three gates re-proved; the identity row gained a capped bio (160, one
  line, no links, profanity server-side, written only through the service role) outside its centring and the 375
  squeeze fixed; the menu became Report this person over Block with a real person report (`reports.profile_id`, a
  signed-in route arm, a People section on `/admin/reports`, no reporter stored); everyone signed in stays named and
  the promise moved in all three homes (the features section, two help articles); the handle went FREE for everyone
  (the two Pro gates and every "paid feature" line gone; custom event slugs stay Pro) and `ClaimHandlePrompt` offers
  it the moment an upload lands, sequenced with the save prompt and dismissable per event; the guest list condenses to
  six faces and a count above twelve, expanding in place twenty-four at a time (round two's winner replaces the
  interim). A `loading.tsx` was written and deleted when it turned a dead handle's 404 into a 200 (the Suspense shell
  flushes before the page runs; a landmine now in `profiles-social.md`). The two migrations were applied by the
  Orchestrator with the types regenerated and the typing seam dropped (`d29ce470`); the bio migration had rebuilt
  `get_public_profile` from the June body and dropped the July anonymous-viewer gate on the attended arm, restored by
  a corrective third migration (`20260919140000`) with the visibility guard re-pointed at the newest definition. Calls
  his to overrule on the alias: the threshold at twelve; six faces; the in-place interim; the bio at 160 with no
  links; the marker's words (Host / Guest); the person report shipping now; the after-upload copy and its door to
  `/account#public-profile`; a quiet "Not now" on the claim card; the bio in the Public profile card. Two lane
  incidents on the record: one force-push to its own branch to fix a manifest SHA (nothing lost; the rule stands) and
  the preview key echoed once into its own terminal (never committed). Gate 35 green on the merged tree (lint 0 with the 8 known warnings, 2648 tests, build 255 pages, `lab:smoke` 450 checks whole with two boards gone from its table, `lab:demo` 3 steps on `profile-page` round two; gate 34 on the tree before the last merge walked `site-chrome` round two's three).

- **`chrome-wiring` merged at `6c76a08c`** (2026-09-19, Opus; cut `b30445d9`): Will's four byte-changing verdicts on
  `site-chrome` r1 as production, the four as-today picks named. The bar leaves going down and returns coming up on
  both postures by transform alone (a new `use-scroll-direction.ts`, the site's one passive rAF-coalesced scroll
  listener; 8 px of committed movement past a one-header-height reveal zone to leave, any upward movement, the top or
  focus-within to return, never with a panel or the sheet open; `--mkt-header-h` stays `4rem` and its fourteen
  consumers never moved). A returning host meets one Dashboard button in the CTA's place, in the bar and the phone
  sheet, from `session-hint.tsx` on `useSyncExternalStore` with the server snapshot `false`, its signal the Supabase
  cookie prefix (readable by construction; no presence cookie, `middleware.ts` untouched). Start free moved above the
  footer's demo check and out of its `lg` gate, at every width in both states. The Resources card became the primary
  door to `/how-it-works` ("How it works", "The whole loop on one page, the host's side and the guest's."), the
  Features footnote the quieter second, and the help article left the chrome. Four contract tests beside the pieces.
  Calls his to overrule on the alias: the asymmetric hysteresis and eager return; the reveal zone; never hiding with a
  panel open; Dashboard as one button replacing both; Start free at every width; the card's flat label; a downward
  anchor jump taking the bar with it. Three ROADMAP lines (Tab into the hidden bar costs 482 px of scroll; the
  footer's `/#faq` still points home from `/pricing`; the phone sheet's foot actions carry no `trackAttrs`).

- **`events-wiring` merged at `6abab6a1`** (2026-09-19, Opus; cut `b30445d9`): the events hub and the four type pages
  rebuilt from the ground up on `event-identity`'s seven directions and `event-type-pages`' direct picks, both boards
  retired. One lit still life per type under the unchanged `PageHero` lockup in a `SectionLight` room (the wedding
  album open with the table card, the party prints with a tent card, the conference badge fan, the trip's photo
  wallet), each carrying the demo's REAL server-rendered code encoding `/demo`, so every hero is a door and none
  exists without a demo set; the statement in the paragraph's place (the claim on the chapter step, the quiet line at
  18, the long tail whole as one running line; the product filling where a type has no honest photograph); a
  full-width photograph with one line as the cut into ONE paper chapter holding the benefits alone; the photograph as
  the card for all four types, one anatomy at two sizes (the hub's 2x2 with its tilt, the home's row without;
  conferences and trips on named stand-ins until ASSETS rows 24 and 25 land); the river door with the reel beside it
  as a poster with the type's own angle, the promise the shipped sentence and no counts; `--text-subhead` retuned to
  20 at 375 and 22 at 1440 with `PageHero`'s subhead on it (measured on an event page and a feature page; the openings
  at 18); the phone half-and-half with the object crossing the fold and the FAQ-to-close gap halved. `events.ts`
  became the one home for every per-type photograph; the hub gained an OG card; `event-hero-media.tsx`,
  `reel-angle-band.tsx` and the home's `event-type-card.tsx` went. Calls his to overrule on the alias: the subhead
  ceiling at 22 site-wide (fifteen other readers came down about 2 px); the parties and trips objects; the real code
  inside every object; the stand-ins for conferences and trips; the door's promise without counts; the hub's
  cross-event object; the phone's trim (`subheadShort` is new copy); the directory card's name at the section step;
  `SectionShell`'s subhead left off the step (ROADMAP, `body-type`'s). Four slot asks folded into ASSETS rows 24 and
  25.

- **`footer-close` merged at `2aa1dc5e`** (2026-09-19, Sonnet; cut `b30445d9`; lab-only): `site-chrome` round two on
  the footer alone, his ask by name. Round one's eight asks retired for three, every option drawn under the rebuilt
  `/how-it-works` close or under `/about`'s close with none: `foot-after` (today's sign-off, a quiet strip, one merged
  ink composition, the index first; recommended the quiet strip, the full sign-off being the repetition he flagged),
  `foot-alone` staged behind it (recommended today's full invitation wherever nothing else closes the page: four real
  routes end on it), `foot-phone` (recommended today's hidden pile with a link). The board's stale `text-chapter`
  became `text-section`. On the desk.

- **`profile-reach` merged at `73cde345`** (2026-09-19, Sonnet; cut `b30445d9`; lab-only): `profile-page` round two on
  the three pieces his notes left open, on the same board, round one's eight ruled asks replaced rather than accreted,
  a 240-name fixture beside round one's 24 so a group's cost is measured at both scales: `view-all` (in place in
  groups of 24 as the interim ships, a sheet over the album, the centred modal, its own page; recommended the sheet,
  the only one that keeps the album's height untouched at either scale with no paging clicks), `quick-look` (a bottom
  sheet on both screens, the same card as a popover at 1440 with the sheet kept at 375, straight to the page;
  recommended the split, the popover measuring 320 by 263 at a desk), `way-back` (a "Back to <event>" pill under the
  header, a row in the account menu, nothing beyond the browser's back; recommended the pill, the only one that
  reaches a signed-out guest). No saved captures this round (the lane's capture script hit two bugs it fixed and one
  it could not; every option was read by eye at both screens instead). On the desk.

**Next.** His eye on the alias (the profile, the chrome, the event pages) and his sitting on `site-chrome` round two and `profile-page` round two and the other twenty-five boards; `lab-tides` still running.

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
