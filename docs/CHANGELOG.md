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

**Next.** The lanes' handoffs, integrated in the program's order with the red-team per lane on the alias (the events
lane's subhead step is site-wide: an event page and a feature page both measured); his sitting on the other twenty-five
boards.

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
