---
track: name-gate
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "99a140b6"          # the launch-prep SHA the branch was cut from
board: none            # production, Will's ruling of 2026-09-22: a nameless account moves nowhere but the welcome page; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/
  - docs/systems/auth-accounts.md
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/welcome.ts
  - src/lib/validation/profile.ts
  - src/lib/db/queries/profile.ts
  - src/lib/supabase/request-auth.ts
  - src/proxy.ts
  - docs/design/rulings.md
---

# lp/name-gate

**Goal.** Will's ruling of 2026-09-22 (~11:52 EDT, rulings.md "the morning after the identity round"): "I wanted to ensure an account without a name wasn't moving around the app as a normal user. Name always required, even if one character." Today only the dashboard root and event creation send a nameless profile to /welcome; /account and every event room render for one. Close it at the group: every (app) route except /welcome redirects a nameless profile to /welcome, once, in one place (a nested `(named)` route group with its own layout, recommended), pinned by a source-level test; the two existing page-level redirects kept; one line in auth-accounts.md. The Lane section at the foot of the Orchestrator's plan file carries the shape; this manifest's brief is a copy of it.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `99a140b6`)

- What this is: Will (rulings.md "the morning after the identity round"): "I wanted to ensure an account without a name wasn't moving around the app as a normal user. Name always required, even if one character (or whatever your suggested/current rule)." Today every account is born nameless (the June rule in `20260608093939_lock_down_display_name_write.sql`: the welcome page's guarded, profanity-checked input is the only write path), and only TWO routes send a nameless profile to `/welcome`: `src/app/(app)/dashboard/page.tsx` (line ~111, `needsDisplayName(profile?.display_name) || shouldShowWelcome(profile?.welcomed_at)`) and `src/app/(app)/dashboard/new/page.tsx` (line ~43). `/account` and every `/dashboard/[eventId]/*` room render for a nameless account. Close it at the group: every (app) route except `/welcome` redirects a nameless profile to `/welcome`, once, in one place.
- THE SHAPE (recommended; take it unless it breaks): a nested route group. Move `src/app/(app)/dashboard/` and `src/app/(app)/account/` under `src/app/(app)/(named)/` (git mv; the URLs do not change: route groups add no segment) and give `(named)` its own `layout.tsx` that reads the display name and redirects: `const menu = await getProfileMenu(user.id)` is already read by the parent `(app)/layout.tsx` for the header, so read it again through the request-cached auth (`getRequestAuth()` from `src/lib/supabase/request-auth.ts`, then `getProfileMenu(user.id)` from `src/lib/db/queries/profile.ts`) and `if (needsDisplayName(menu.displayName)) redirect("/welcome")` (`needsDisplayName` from `src/lib/welcome.ts`; one non-blank character is a name, the schema in `src/lib/validation/profile.ts` is the rule and stays). `/welcome` stays directly under `(app)` (outside `(named)`), so the auth gate still covers it and no loop can form. Keep the two existing page-level redirects as they are (belt and braces; they also carry `shouldShowWelcome`). A WHY comment at the head of the new layout naming his sentence and the June rule. The alternative, if a nested group breaks something you can show (an import path the lab reads, a test that pins the folder): the same check at the top of `(app)/layout.tsx` guarded by the pathname from a header the proxy already sets, and say why in the Handoff.
- THE PIN: a source-level test `src/app/(app)/(named)/layout.test.ts` (or beside the layout you chose) that reads the layout's source and asserts it imports `needsDisplayName` and calls `redirect("/welcome")`, and that `src/app/(app)/welcome/` is NOT under `(named)` (a nameless account must reach the page that names it). Every existing test and the build stay green: `pnpm build` must still list every route at the same URL (paste the count from the build log in the Handoff).
- DOCS: `docs/systems/auth-accounts.md` gains one line under its invariants (a nameless account reaches only `/welcome` inside the app; the name is required, one character is enough); `docs/systems/host-app.md` "Dashboard landing" loses nothing but gains the group in one clause. Owned facts only.
- Owns: `src/app/(app)/` (the whole group: the moves, the new layout and its test; no page's content changes beyond its path), `docs/systems/auth-accounts.md`, `docs/systems/host-app.md`. Reads, never edits: `src/lib/welcome.ts`, `src/lib/validation/profile.ts`, `src/lib/db/queries/profile.ts`, `src/lib/supabase/request-auth.ts`, `src/proxy.ts`, `docs/design/rulings.md`.
- Tests: the pin; `pnpm test` whole; the gate with every exit code; `pnpm build`; `pnpm lab:smoke --base http://localhost:3133` (the lab's touchpoints link into `/dashboard` and `/account`; every URL must still answer). Your own check on :3133: a signed-in session cannot be minted locally (Google bounces to production), so prove the redirect with a unit of the layout's logic or a source pin, and say so. No live red-team is needed beyond the Orchestrator's on the alias.
- His to overrule: the nested group over a pathname header; the two page-level redirects kept.

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

- `docs/systems/auth-accounts.md`: the "Display name is REQUIRED..." bullet refined — the
  nameless-account gate now covers every `(app)` route but `/welcome` (`requireNamedProfile()`
  in `name-gate.ts`, called from `dashboard/layout.tsx` and `account/layout.tsx`); the stale
  "`/account` is exempt so it can be set there" line is gone.
- `docs/systems/host-app.md`: the "Dashboard landing" claim-ticket paragraph refined — the
  nameless-profile guard it points at is now named as the whole-tree `dashboard/layout.tsx`
  gate rather than only the dashboard root's own inline check.

## Deferred (ROADMAP one-liners, bucket named)

- none: the standing risk this track found (a future third top-level `(app)` route forgetting
  its own gate) is already closed by a pinned test, not a task waiting on the ROADMAP — see
  the item and "Look at first" below.

## Handoff (replaces the chat report)

- Board commit `3eb982ca`, pushed to `origin/lp/name-gate`; synced with launch-prep at merge
  `de001a18` (`origin/launch-prep` had moved 3 commits past the `99a140b6` cut — usher/moltbook
  bookkeeping and three new, unrelated track manifests spawned (`identity-door`,
  `identity-claims`, `identity-profile`); diffed before merging, none touched this lane's
  `owns` or `reads`; the merge was conflict-free).
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- Gates on the synced tree, each its own exit code (0 throughout): `pnpm design:rules` ok
  (1237 contracts on 163 components, +5 guards from `name-gate.test.ts`'s new
  `@contract-for`; regenerated `docs/design/library.md` and `rules.generated.json` —
  mechanical, see the lane-check exception below); the specimen collector ok (140 specimens on
  101 entries, unchanged); `pnpm typecheck` ok; `pnpm lint` ok (9 warnings on the tree today,
  none in any file this lane touched — the baseline moves, the exit code is the gate);
  `pnpm test` ok (3680 passed, 2 skipped, 338 files); `pnpm build` ok (135 route lines;
  `/account` and every `/dashboard/*` URL present, unchanged — no file moved).
  `pnpm lab:smoke --base http://localhost:3133` ok (428 checks, 0 failing). No board on this
  lane, so no `lab:demo`. Also checked by hand (no local signed-in session is mintable —
  Google bounces to production): `/dashboard`, `/dashboard/new`, `/account`, `/welcome`, and
  three `/dashboard/<uuid>/{guests,review,settings}` paths each 307 a signed-out visitor to
  `/login` with no crash, so the new layouts sit cleanly inside the existing auth gate.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(app)/account/layout.tsx`,
  `src/app/(app)/dashboard/layout.tsx`, `src/app/(app)/name-gate.ts`,
  `src/app/(app)/name-gate.test.ts`, `docs/systems/auth-accounts.md`,
  `docs/systems/host-app.md` (the six owned paths) + `docs/design/library.md`,
  `src/app/(dev)/design/rules/rules.generated.json`,
  `src/app/(dev)/design/rules/component-notes.ts` (three exceptions, why: the first two are
  `pnpm design:rules`'s own required output for the new contract test; the third is the one
  `for` line the gallery coverage test demands for that new target, naming and excusing
  `name-gate.ts` exactly as the neighbouring `account/page.tsx` entry already does — no other
  hand-authored change in any of the three).
- The item: `requireNamedProfile()` (`src/app/(app)/name-gate.ts`), called once each from new
  `dashboard/layout.tsx` and `account/layout.tsx`, closes the gate for every `(app)` route but
  `/welcome` — previously only `/dashboard` and `/dashboard/new` redirected a nameless
  profile; `/account` and every `/dashboard/[eventId]/*` room rendered normally for one. The
  two existing page-level redirects on `dashboard/page.tsx` and `dashboard/new/page.tsx` are
  unchanged. Pinned in `name-gate.test.ts`, which enumerates `src/app/(app)/`'s top-level
  directories at test time (not by hardcoded name) so a future third route without its own
  gate fails by name; also pins that nothing under `welcome/` imports the gate (no redirect
  loop).
- Calls his to overrule, one line: took the brief's escape hatch over its recommended nested
  `(named)` route group — moving `dashboard/`/`account/` would have required rewriting ~45
  import sites across the tree (mostly outside this lane's owns: every
  `src/app/admin/*/actions.ts`, several `src/components/admin/*` and
  `src/components/social/*`, `src/lib/auth/admin-context.ts`, `src/lib/errors/codes.test.ts`)
  that hardcode the old `@/app/(app)/dashboard/actions` / `@/app/(app)/account/actions`
  paths, and the brief's own suggested fallback (a pathname header) needs an edit to
  `src/proxy.ts`, which this track only reads; built two sibling layouts sharing one helper
  instead (full reasoning in `name-gate.ts`'s own comment; the Orchestrator has already
  reviewed and confirmed this call sound).
- The help articles this lane makes stale: none (no user-facing copy changed; the redirect
  already existed for `/dashboard`, silently).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `src/app/(app)/name-gate.ts` (the WHY comment covers both the
  `getProfile()`-over-`getProfileMenu()` choice and the two-layout-over-nested-group choice),
  `src/app/(app)/name-gate.test.ts` (the structural pin), and the `docs/systems/auth-accounts.md`
  bullet this lane rewrote. One edge considered and deliberately left alone:
  `src/app/(print)/dashboard/[eventId]/print/page.tsx` re-declares its own auth gate
  independently (by its own header comment's design) and does not check the name — left as-is
  because a nameless host can never own an event to print from (event creation already gates
  on name via the kept `dashboard/new/page.tsx` check), so there is no real exposure, and the
  route sits outside this lane's `owns` regardless.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Closed the nameless-account gap Will named
(rulings.md "the morning after the identity round"): every `(app)` route but `/welcome` now
redirects a nameless profile there through one `requireNamedProfile()` (`name-gate.ts`),
called from new `dashboard/layout.tsx` (the root, `/new`, every `/dashboard/[eventId]/*`
room) and `account/layout.tsx` — previously only the dashboard root and event creation
checked, and `/account` rendered normally for one. Took the brief's escape hatch over its
recommended nested `(named)` group: moving `dashboard/`/`account/` would have rewritten ~45
import sites across the tree, mostly outside this lane. Pinned structurally —
`name-gate.test.ts` enumerates `(app)`'s routes at test time, so a future ungated one fails by
name — rather than by page name. `auth-accounts.md` + `host-app.md` refined in place. Gate
green throughout (test 3680 passed / 2 skipped, build 135 routes); `pnpm lab:smoke` 428/428.
No live red-team: no session mints locally; the source pin proves the shape and the
Orchestrator's alias check covers the signed-in path.
