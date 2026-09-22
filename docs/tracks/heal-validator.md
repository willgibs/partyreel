---
track: heal-validator
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "63fb9ae8"          # the launch-prep SHA the branch was cut from
board: none            # production follow-up: the door-fixes re-check's one finding (the edge 304s a matching validator and drops the cookie); no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/guests/gallery/route.ts
  - src/app/api/guests/gallery/route.test.ts
  - docs/systems/guest-flow.md
  - docs/systems/testing-verification.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/guest/session-cookie.ts
  - src/lib/events/gallery-fingerprint.ts
  - src/components/guest/live-gallery.tsx
---

# lp/heal-validator

**Goal.** A production follow-up cut by the Orchestrator from the re-check on the `launch-prep` alias (2026-09-22, build `36fcde3c`, the door round whole): the one finding it made, fixed in place. No board, no new ruling, nothing reopened: the rulings this wiring answers are in `docs/design/rulings.md` under "the door as three steps" and "the door's first look", and every one stands as wired. The lane's brief follows; read it end to end before the first edit.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `63fb9ae8`)

- What this is: `door-fixes` answered 200 at the origin while a cookie heal is pending, believing Vercel stripped `Set-Cookie` from the function's own 304. The re-check on the alias at `36fcde3c` (the deployment `dpl_8jzy8pPouMm5qT2QTubZ6D8qkJeZ`, source commit `36fcde3c` confirmed through the Vercel API) showed the truth is one step upstream: VERCEL'S EDGE ITSELF answers 304 whenever the request's `If-None-Match` equals the ETag on the function's 200, and it drops `Set-Cookie` in that conversion. Measured: `POST /api/guests/gallery` with a contributor's token in the body, no cookie and `If-None-Match: "g3-nomatch"` answered 200 with the ETag and `Set-Cookie`; the identical request with the matching validator answered `HTTP/2 304` with the ETag echoed and no cookie, `x-vercel-cache: MISS` both times (the function ran both times). So the origin's status is irrelevant: a response the browser MUST receive cannot carry a validator the browser might present. One change, nothing else.
- The fix, in `src/app/api/guests/gallery/route.ts`: when a heal is pending (`bodyToken && bodyToken !== cookieToken`, the block that appends `Set-Cookie`), the response carries NO `ETag` header (delete it from `headers` before answering; keep `Cache-Control: private, no-store`); the 304 guard stays as it is (a settled cookie with a matching validator still answers 304 with the ETag). Rewrite the route's head comment and the inline comment to the true mechanism: the edge, not the function, synthesizes the 304 from a 200 whose ETag matches the request's validator, stripping `Set-Cookie`; a validator-less 200 is the one response that always reaches the browser. Check the poll client in `src/components/guest/live-gallery.tsx`: if it keeps its last validator when a response has no ETag, the next poll (the cookie now written) answers 304 as before; if it clears it, the next poll answers 200 once and then 304s resume; either is fine, and the contract test pins whichever the client does, in `live-gallery.test.tsx` only if a line there is needed (add `src/components/guest/live-gallery.tsx` and its test to your owns for that line alone, listed in the Handoff with why). Contract tests in `src/app/api/guests/gallery/route.test.ts`: a pending heal answers 200 with `Set-Cookie` and NO `ETag`; a pending heal with a matching validator answers 200 (never 304); a settled cookie with a matching validator answers 304 with the ETag; a settled cookie with a stale validator answers 200 with the ETag and no cookie.
- Docs: `docs/systems/guest-flow.md`'s heal line refined to the mechanism (one sentence); `docs/systems/testing-verification.md` gains one ★ bullet under the instrument traps: Vercel's edge honors `If-None-Match` against the function's ETag on the alias and answers 304 itself, dropping `Set-Cookie`, so a header on a matching conditional response must be curled on the alias with a non-matching validator before it is believed (2026-09-22, the door round).
- Owns: `src/app/api/guests/gallery/route.ts`, `src/app/api/guests/gallery/route.test.ts`, `docs/systems/guest-flow.md` (the heal line), `docs/systems/testing-verification.md` (the one bullet). Reads, never edits: `src/lib/guest/session-cookie.ts`, `src/lib/events/gallery-fingerprint.ts`, `src/components/guest/live-gallery.tsx` (unless the one line above is needed).
- Tests: the contracts above; `pnpm test` whole; the gate with every exit code; `lab:smoke`. The alias proof is the Orchestrator's after the merge: the matching-validator curl answering 200 with the cookie and no ETag.
- His to overrule: no validator on a heal response (rather than a changed one, which would cost one extra full answer).

## The verdict map (every answer of the batch; this lane wires only its own board's)

**`voice` r1 (eight; the board RETIRES at its wiring, its voice written up from the wins):**
- `absence=named` + his rewrite: bible 20 is ruled PERMISSIVE (naming an absence a guest is wary of is allowed; the rule
  forbids defining Partyreel against something else, "we're not cloud storage, we're not vsco") AND the line changes
  everywhere: "No app, no account." becomes "No app required." because accounts may be required. The Orchestrator
  rewrites bible 20's `statement` and `why` in `rules/bible.ts` at the batch record (his words); the lane sweeps the 66 lines
  (every "no account" promise goes; "no app" stays as a benefit).
- `hero-sub=?` with his line: `SITE_SUBHEAD` becomes "Your guests took the best photos and videos at your event. Partyreel
  collects them with one easy link. No more chasing group chats the next day." (verbatim). `SITE_DESCRIPTION` (thesis +
  subhead) would reach ~200 characters: the lane gives the meta description its own line under 160 and says so.
- `feature-h1=today`: nothing moves; his "I do not like three-line headings on desktop" becomes a measurement on the
  alias of all six feature h1s at 1440 (`PageHero` `lg` = `text-title`, 80 px in `max-w-3xl`, likely two to three lines)
  and a proposal in the Handoff for any that wrap to three (shorter h1 copy, never the load-bearing width).
- `pro-line=video` with his line: "For videos and unlimited events." at `plan-cards.tsx:316`, single-sourced beside the
  other ruled lines in `marketing-voice.ts`; the four sibling one-liners (`pricing-teaser.tsx:37`, `faq-data.ts:47`,
  `how-much-fits.tsx:154`, `llms.ts:133,233`) aligned to the same order (videos first, unlimited events); two or three
  "slightly more engaging" phrasings offered in the Handoff for his overrule on the alias.
- `host-empty=album`: "Your first album starts here" in `events-empty-teaser.tsx:41-43`; its body line loses "No app, no
  account"; the CTA stays "Create your first event" into the wizard.
- `gate=ask` with his adjustment: the body of `enter-event-prompt.tsx:56-59` becomes "For safety, the host has requested
  you confirm your email. One tap and you're in." (verbatim; the eyebrow, the title and the password path unchanged). His
  "big one" (skip confirmation for a badge) is the `guest-verify` exploration below, not this lane.
- `empty=starts`: "The album starts with you" in `gallery-empty-state.tsx:69-76`; the CTA "Be the first to add a photo" stays.
- `moment=today`: `guest-upload.tsx:77` unchanged. His "redesign our toasts" is the `toasts` exploration below.
- The finding to write up (the lane, in `marketing-voice.ts`'s head comment and `docs/systems/`): the two deliberately
  identical questions (`host-empty`, `empty`) got one voice, the album noun and "starts".

**`body-type` r1 (seven; six wire now, `buttons` goes to round two on the same board):**
- `reading=16` (every guest-facing sentence; the 26 `text-[15px]` go), `working=14` (the app's body; the admin "can break
  away" toward density, so the admin's own sizes are mapped where equal and otherwise left for the `admin` board),
  `marketing=fluid` (16 at a phone to 18 at a desk, a clamp like the heading steps), `caption=10` read with his note as
  TWO bottom steps: the caption step stays 12 (the labels he named) and a `micro` step at 10 is the FLOOR (the event
  cards' metadata chips, count pips; nothing under 10 outside depicted type), `label=12-08` (every uppercase label,
  marketing and app, at 12 px on 0.08em; the Eyebrow atom and the 75 `tracking-[0.14em]` literals move; he may drop to 11
  later), `leading=length` (2 x size - 8: 10/12, 12/16, 14/20, 16/24, 18/28; the marketing clamp's leading a clamp too).
- `buttons=ladder` "not a direct selection, more work required": round two on `buttons` alone (below); the wiring lane
  leaves Button's sizes as today (the `sm` literal stays until the rung is ruled).
- The write-up: the steps as tokens with leading and tracking companions in `theme.css` beside the heading steps,
  `TYPE_STEPS` and `cn()` knowing them, the policy test extended from headings to body sizes (stock classes that equal a
  step are on the ladder; px literals and off-step stock sizes fail; depicted type and the named exceptions exempt), the
  Library's foundations page, `design-system.md`'s type section refined in place.

**`glass` r1 (seven; the recipe goes to round two FIRST, the wiring follows it in one lane):**
- `recipe=frost` with "worth a second round ... so we can nail our glass from the start", `reel=white` with "may be worth
  exploring making this the standard - I don't want to have separate glass treatments and would prefer to find a global
  that works everywhere": round two asks the ONE material (Frost, Crystal, White-on-Frost) on every glass surface at once.
- `grades=one`, `behind=album` (the album blurred at half brightness behind the lightbox), `row=bar` (one pane holding the
  host's three controls), `paper=dark` (dark glass over media whatever the theme): rulings that wire with the material.
- `tiles=?` with his rule: on a mobile image card nothing but an active like mark, a video play mark and a subtle like
  count (state, never a control); every action (like, download, select, hide) lives in the lightbox's controls, select
  handling multi-item. A standing ruling for `media-viewer`, `app-vocabulary`, `guest-shape` and `host-curation` (the
  carried call below), wired by the glass lane on the tiles it owns and by `media-viewer`'s wiring in the lightbox.

**`app-shape` r1 (eight; two wiring lanes now, round two on the home across host states; the board stays):**
- `home=pulse`: `/dashboard` becomes the front page ("what needs you, then what just arrived": the waiting queues and the
  storage line first, the photographs of the last hour, then your events); the five-chip inbox (`dashboard-feed.tsx`,
  `filter-chips.tsx`) goes. His "worth more dashboard explorations ... across all host states" is round two (below).
- `density=cover` + "let's do both": the events list keeps the cover cards AND gains a row/table view behind a toggle
  aligned right opposite "Your events" (sorting and filtering in the table); the choice persists per host; the board's
  `lands` says every list of events in the app (the bin, saved events, the hosts you follow) shares the shape.
- `event=hub` + his three additions: a row of cards (Review, Reel, Guests, Settings LAST; the board's "Album" card becomes
  Settings), the gallery BELOW the cards by default in most-recent order, a clickable QR code horizontally centred to the
  left of the title + metadata stack that opens the share mini-modal.
- `nav=crumbs`: a trail in the bar (Partyreel / the event / the room), the cards row going sticky as the album scrolls
  ("could pick up sticky-style from the cards"), and a creative way to keep Share reachable from the sticky row.
- `share=room` overridden by his `settings` note: sharing gets ONE comprehensive surface as a SHEET (the code, the link,
  the posters, the invite, the custom link claim, anything future), reached from the event's menu and from the mini-modal;
  the QR at the left of the title opens a view-transition-style mini-modal (a bigger scannable code, view/copy the link,
  a door to the sheet); a third, subtler event link with a copy button sits under the metadata line.
- `settings=sheet`: the settings page of cards becomes a sheet over the album (the album stays behind it); the photo bin
  joins the album as a filter; "Deleted" names one thing.
- `you=?` with his answer: a person's own photos, likes and connections live on the PROFILE page (an owner mode of
  `/u/[slug]`), where the avatar and profile settings can also be changed; plans, billing and profile management live on
  the ACCOUNT page (billing gets its first door: a Plan card); the avatar may be changed in both places. The user menu
  gets the two doors. The personal feeds leave the home.
- `phone=same`: one shape at both sizes, the crumb header narrowed, the cards row scrolling sideways with a conditional
  gradient at either edge, sticky after the page scrolls past the cards.

## The ownership rules every lane follows this round

- One manifest owner per path; no two lanes' `owns` overlap, not even by a shared prefix. A second lane's single-line
  edit in another lane's file rides the lane-check exception line of its Handoff ("exceptions and why"), applied AFTER
  syncing past the owner's merge, never before. `merge-lane.sh` aborts only on real git conflicts (same or adjacent
  lines, a delete against a modify), so distinct hunks merge clean; the pre-handoff sync carries the first lane's hunks.
- `ladder-wiring` owns explicit FILES (its real footprint, about seventy: `git grep -lE
  'text-\[(7|8|9|11|13|15|17)px\]|text-\[0\.8rem\]|tracking-\[0\.14em\]' -- src ':!src/app/(dev)'`), never a prefix
  another lane sits under; a file whose only sizes are stock classes equal to a step needs no edit at all.
- The app-shape lanes build on stock classes that EQUAL a step (`text-sm` 14, `text-xs` 12, `text-base` 16,
  `text-[10px]`) and never on the announced step names: Tailwind v4 emits no utility for an undeclared `--text-working`,
  the element silently inherits, and nothing in the gate sees it. The names are a mechanical swap after a lane syncs
  past the ladder's merge, or a follow-up.
- A wiring lane never deletes, renames or breaks the props of a module the lab imports: every module
  `git grep -l "from \"@/" src/app/\(dev\)` resolves to (`filter-chips`, `trash-section`, `storage-meter`, `feed-section`,
  `empty-section-teaser`, `event-card`, `app-shell`, `feed-section-header`, `event-filter-pills`, `review-section`,
  `use-review-triage`, `recently-deleted-grid`, `event-settings/*`, `event-slug-control`, `my-uploads-gallery`,
  `lib/dashboard/filters.ts`, `media-grid`, `host-selection-provider`, `review-actions`, `gallery-actions`, `styled-qr`,
  `host-media-grid`, `export-dialog`, `download-all-button`, `selectable-media-grid`, `review-grid`, `feed-section-empty`,
  `qr-preset-picker`, `enter-event-prompt`, `gallery-empty-state`, `likes-provider`, `password-gate`, and more): a retired file stays on disk with a head comment
  naming the boards that draw it; `AppShell` and `EventCard` props stay backward compatible; `pnpm design:rules` when
  `component-notes.ts`'s AppShell contract changes.
- `docs/systems/host-app.md` is split by heading: `home-wiring` edits inside `## Dashboard landing`, `## Events & the
  create flow`, `## First-time host welcome`; `hub-wiring` inside `## QR designer`, `## Custom event link (slug)`, `## The
  event page`, `## Moderation & curation` and one Reel-card door line in `## Reel curation`; nobody touches the H1, the
  ROLE block or `## See also` (the Orchestrator rewrites the H1 at the record); edits stay inside a section body, never
  on a heading line or the blank line before the next heading; the second lane to land syncs first.
- `src/lib/single-source-policy.test.ts` refuses one UPPER_SNAKE export from two `src/lib` modules: `home-wiring`'s
  `lib/dashboard/*` and `hub-wiring`'s `lib/event/*` never both export a `SECTION_LABEL`; `voice-wiring` deletes the four
  sibling Pro lines rather than re-exporting one.
- `content/help/` and `content/blog/` belong to `voice-wiring` alone. The app-shape lanes change what several help
  articles describe (the dashboard, the event page, sharing, settings): each lists the articles it makes stale in its
  Handoff (help how-tos track shipped reality), and one `help-sync` follow-up (Sonnet) rewrites them after both land.
- Every new door a wiring lane adds (the QR and its mini-modal, the copy button, the list toggle, the menu rows, the
  cards) carries `trackAttrs` as the chrome's doors do; every new component gets its `for` line in
  `rules/component-notes.ts` and a `// @contract-for:` test, so it lands in the Library with its `new` badge
  (`pnpm design:rules`); the sheets, the mini-modal and the table read `ui/floating-layer.ts`.
- ONE responsive Sheet for the product (a side panel at a desk, a bottom sheet in a hand, on `ui/sheet.tsx` with
  `ui/drawer.tsx` retired or folded): `hub-wiring` builds it for settings and sharing, and it is the sheet
  `guest-shape`'s dialogs, `profile-page`'s quick-look and `app-pricing`'s object inherit ("apply this sheet concept
  everywhere"); its contract test is the one others reuse.

**Binds.** The bible (`/design/library`), the contracts of every component under a path you own, and the policies;
Will's notes in the ledger and rulings.md; the ownership rules above; CLAUDE.md's working loop (doc-check via Context7
first: Next 16, Tailwind v4, zod v4 and Supabase SSR drift). `DESIGN_PREVIEW_KEY` rides the environment, never a command
line. Never edit a record doc (`docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/design/rulings.md`, `docs/reviews/`); a `docs/systems/` fact inside your lane is refined in place and listed below.
Stage explicitly; never `--no-verify` or force-push; the `Co-Authored-By` trailer on every commit.

**Verify on.** For a production lane: the gate on the synced tree (`pnpm design:rules`, the specimen collector
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` (10 known warnings on 2026-09-21; the number moves, the exit code is the gate, a warning in a file you touched is yours), `pnpm test`,
`pnpm build`), each on its own exit code; `pnpm lab:smoke --base http://localhost:<your port>` whole; the surfaces the Handoff is
judged on, local at 1440 and 375 (the Orchestrator red-teams them on the alias). For a lab lane: the board at 1440 and 375 with
reduced motion honoured, `pnpm lab:smoke` whole, `pnpm lab:demo --board <board> --base http://localhost:<your port>` pressing
every step (a backdrop-filter step reports UNPAINTED in headless Chrome: capture it by hand and say so). One process at a
time on this machine; your dev server on your own port, killed by port before a build, a test run and the handoff.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`: the `pr_guest_<eventId>` cookie paragraph's heal sentence refined from
  "only as a 200, never a 304 (`door-fixes`... Vercel drops `Set-Cookie` from a 304 in transit...)" to
  "only as a 200 with no ETag (`heal-validator`... Vercel's edge, not the function, converts a
  matching-validator 200 into a 304 and drops `Set-Cookie` doing it...)" — one sentence, in place.
- `docs/systems/testing-verification.md`: one new ★ bullet added directly after "Three instrument traps
  around builds and ports" (the only existing use of that phrase), naming that Vercel's edge decides a
  conditional response on the alias and a header on a matching one must be re-curled with a
  non-matching validator before it is believed.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Fix commit `a54e2476` (the four owned files), synced with `launch-prep` by merge at `8843b3e3`:
  `origin/launch-prep` had moved to `721ae5bd` for the unrelated `guest-email-migration` cut (wave 0,
  Lane 72) while this lane ran; merged clean, no conflicts, no overlap with any owned or read path.
  This manifest commit (on top of `8843b3e3`) is the actual head; per boot instructions its own sha is
  never named here — it rides the chat report ("handed off at `<sha>`") alone.
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- The fix: `src/app/api/guests/gallery/route.ts` now deletes the `ETag` header entirely on a
  pending-heal response (`headers.delete("ETag")` right after the `Set-Cookie` append), instead of the
  superseded `door-fixes` belief that the function's own status code was the lever. The 304 guard is
  otherwise byte-for-byte the same condition (`!healPending && If-None-Match === etag`); it now trips
  only for a settled cookie, since a pending-heal response carries nothing to match. Head comment and
  the inline 304-guard comment rewritten to the true mechanism (edge-synthesized 304 from a matching
  ETag, dropping Set-Cookie regardless of the function's status).
- Gates on the synced tree (all re-run post-merge, logs under this session's scratchpad
  `gate/8..14-*-synced.log`): design:rules ok, specimens ok, typecheck ok, lint ok (10 known warnings,
  same baseline, none in the four touched files), test ok (3501 passed, 2 skipped, 328 files), build ok
  (257 static pages). `pnpm lab:smoke --base http://localhost:3136` ok (421 checks, 0 failing; the one
  `/design/boom` 500 is a pre-existing deliberate error-boundary test page, unrelated). No `lab:demo`
  (`board: none`, a production lane, not a lab board).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly
  `docs/systems/guest-flow.md`, `docs/systems/testing-verification.md`,
  `src/app/api/guests/gallery/route.test.ts`, `src/app/api/guests/gallery/route.ts` — the owned paths,
  no exceptions, plus this manifest file once committed.
- Contract tests added/rewritten in `route.test.ts` (12/12 pass), matching the brief's four cases
  exactly: a pending heal (no request validator) answers 200 with `Set-Cookie` and no `ETag`; a pending
  heal with a matching `If-None-Match` still answers 200 (never 304) with no `ETag`; a settled cookie
  with a matching validator answers 304 with the `ETag`; a settled cookie with a stale validator
  answers 200 with the `ETag` and no cookie.
- The client check: `src/components/guest/live-gallery.tsx`'s `refresh()` needed NO edit. It already
  does `etagRef.current = res.headers.get("etag")` unconditionally after any non-304 response, which
  resolves to `null` when the header is absent — the brief's "clears it" branch ("either is fine"). Next
  poll then sends no `If-None-Match`, gets one more full 200, and 304s resume after that. Verified by
  re-running `live-gallery.test.tsx` standalone: 23/23 pass, untouched. `owns`/`reads` left as handed
  off (no line needed, so nothing added).
- The one item: `heal-validator`'s single fix, landed as described above; not a design/Library item (a
  backend header-and-comment correction, no board, no verdict to record as a working version).
- Calls his to overrule: none new — the brief's own pre-answered call is the one implemented as given
  ("no validator on a heal response, rather than a changed one, which would cost one extra full
  answer"). Nothing else required a judgment call.
- The help articles this lane makes stale: none (no guest-facing copy or behavior changed; the fix is
  header-only and invisible to a guest).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `src/app/api/guests/gallery/route.ts`'s rewritten head comment (the true edge
  mechanism) and the four new/rewritten contract tests in `route.test.ts`. The brief reserves the live
  proof for the Orchestrator after the merge: a matching-validator curl on the alias answering 200 with
  the cookie and no `ETag` (never a 304).

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Fixed the pending-heal response in
`src/app/api/guests/gallery/route.ts`: it now deletes the `ETag` header entirely rather than trusting
its own status code, because the re-check on the alias proved Vercel's edge, not the function, converts
a matching-validator 200 into a 304 and strips `Set-Cookie` doing it. The 304 guard's condition is
unchanged; it now only ever trips for a settled cookie, which has nothing left to heal. `route.test.ts`
pins the brief's four contracts (12/12 pass); `live-gallery.tsx` needed no edit, since it already
clears its held validator to null when a response carries none. `guest-flow.md`'s heal sentence and
`testing-verification.md` gained one line each describing the true mechanism. Gate green on the synced
tree (typecheck, lint at the 10-warning baseline, 3501 tests, a 257-page build); `lab:smoke` 421 checks,
0 failing. No board, no ruling, nothing his to overrule beyond the brief's own pre-answered call.
