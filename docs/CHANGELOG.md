# Partyreel — Changelog (the last two rounds)

> ROLE: what shipped in the current round and the one before, with the commits and the verification.
> BELONGS HERE: at most two dated entries, newest first, each at most 160 lines. · NOT HERE: how the
> system works now (→ [`systems/`](systems)), what is next (→ [`ROADMAP.md`](ROADMAP.md)), the live
> state (→ [`STATUS.md`](STATUS.md)). GROWS BY: a new entry at a round's close, and the third-oldest
> entry deleted in the same commit. Everything older is in git: `git log --oneline` for the commits,
> `git show 932fdee9:docs/CHANGELOG.md` for the last full archive (5,495 lines, 2026-07-02 to 09-16),
> `git show dd77fc9e:docs/CHANGELOG.md` for the Library x Lab round's entry, `git show 52e9afa2:docs/CHANGELOG.md` for the revamp's,
`git show d2db2629:docs/CHANGELOG.md` for the stepped review round's, `git show 449d9b52:docs/CHANGELOG.md` for the wind-down's, `git show 22438704:docs/CHANGELOG.md` for the ladders-and-the-dock round's, `git show b30445d9:docs/CHANGELOG.md` for the overnight round's, `git show 69a9a177:docs/CHANGELOG.md` for the morning sitting's round's.

---

## 2026-09-20 — The night sitting: the fifth batch and its wiring (`69a9a177` onward)

**What Will did.** The fifth batch (build `69a9a17`) answered the four boards at the head of the desk whole: 30 verdicts,
three `?` each with his own answer in the note. `voice`: bible 20 ruled permissive ("No app is a big benefit we're allowed
to mention"; the rule was against "we're not cloud storage, we're not vsco") and the line becomes "No app required."
since events may require accounts; his hero sentence ("Your guests took the best photos and videos at your event.
Partyreel collects them with one easy link. No more chasing group chats the next day."); the curation h1 kept ("I do not
like three-line headings on desktop"); "For videos and unlimited events."; "Your first album starts here" and "The album
starts with you" (one voice on both empty surfaces); his gate line ("For safety, the host has requested you confirm your
email. One tap and you're in.") with a big ask by name, "1+ exploratory tracks" on skipping email confirmation for a
verified/unverified badge; today's upload toast, with "I'd like to redesign our toasts". `body-type`: 16 / 14 (the admin
may go denser) / fluid / 10 as the floor with 12 kept for the labels he named / 12 on 0.08em / `leading=length`;
`buttons=ladder` "not a direct selection, more work required". `glass`: Frost ("maybe worth a second round ... so we can
nail our glass from the start"), one grade, the album behind, his tiles rule (nothing on a mobile card but an active
like, a play mark and a subtle count; every action in the lightbox), white on the reel ("may be worth exploring making
this the standard"), the row as a bar, dark on paper. `app-shape`: the pulse ("worth more dashboard explorations ...
across all host states"), cover cards AND a row/table behind a toggle, the hub with the gallery beneath and a clickable
QR left of the title, crumbs with the cards going sticky, sharing as a comprehensive sheet with a view-transition
mini-modal off the QR and a subtle copy link under the metadata, settings as a sheet, the personal on the profile page
and money on the account page, one shape on a phone. In plan mode: the glass wiring waits for round two; the questions
his rulings reach on ten other boards are neither killed nor redrawn (his two paragraphs in rulings.md: badged in place,
an agent's line, a trash, an answer overriding); the button rung goes to a lab round two. Ten lanes cut at the record
(five now, `overtaken` after `lab-tides`, four as seats free); the four ledgers of retired boards deleted (the README's
rule); then his night instruction: the seats run all night on unexplored surfaces and the Orchestrator gets
`PartyreelAI/`, a folder of its own.

**Next.** The five lanes' handoffs, `lab-tides`' merge and `overtaken`, the waiting four, the night's explorations; his
eye on the alias in the morning.

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

- **`seed-avatar` merged at `a80fe1e1`** (2026-09-19, Opus; cut `8225bc35`; lab-only): round one of the seeded default
  avatar, his ask by name the same evening ("I like the gradient over dither for our purposes"). hashvatar's gradient mode
  pulled apart from its source (FNV-1a into mulberry32, one OKLCH hue per identity, six blurred polygons composited on a
  canvas, a rAF loop, no light source at all) and rebuilt as ours: one pure function from a string to a CSS
  `background-image`, zero dependencies, no canvas, renderable in a Server Component so the guest list can draw it,
  credited to hashvatar (MIT) in the file; the lightness fitted by bisection into the window where a near-white initial
  clears 4.5:1 and the disc 3:1 on paper AND ink, the chroma gamut-clamped at the real hue and lightness, the light placed
  in the upper third, no motion by default; thirteen contract tests hold a thousand seeds to determinism, a filled wheel
  and the floors (the contract published on the library page at the record). Seven decisions drawn on every real avatar
  surface with `profile-page`'s twenty-four guests and today's grey in the same frame, phone first: `look` (recommended the
  lit sphere, the only shape still an object at 24 px), `the-crowd` (every guest in full colour; 19 distinct colours
  across 24 discs against today's one), `palette` (the whole wheel; twelve hues over twenty-four guests repeat as a
  pattern), `letter` (the initial at every size), `seed` (the account id; a colour that moves when a typo is fixed is not
  an identity colour), `after-upload` (the orb waiting underneath the photograph, the only option reaching the two
  surfaces that show an empty disc during a presign), `motion` (never). Four calls his: two of the brief's options recut
  (`look`'s "orb with the initial" was the `letter` question asked twice, so it became `flat`; `palette`'s album-sampled
  set coupled a person's colour to an event, so it became one warm arc; a sampled palette would be a second round);
  `the-crowd` asked as a decision rather than shown as a proof; the 64 px account control and the 80 px identity row sit
  outside the `Avatar` contract's three sizes (the wiring lane hands them `background()` directly rather than growing a
  fourth size); the chip's initial already renders at 12 px, not the 10 `guest-list.tsx` asks for (the wiring lane decides
  once in `avatar.tsx`). Look at first: `the-crowd` at 375, then `look` at 24 px. Its id sits after `app-vocabulary` on
  the desk. Gate 39 green on the final tree (design:rules, the specimens, lint with the 8 known warnings, 2665
  tests, build 255 pages, `lab:smoke` 460 checks whole, `lab:demo` 7 steps on `seed-avatar` with 0 failing).

**Next.** His eye on the alias (the profile, the chrome, the event pages) and his sitting on `site-chrome` round two, `profile-page` round two, `seed-avatar` and the other twenty-five boards; `lab-tides` still running.
