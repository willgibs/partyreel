---
track: identity-door
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "50c03129"          # the launch-prep SHA the branch was cut from
board: identity-door   # a new board: the identity flows, the door sheet with an email
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/
  - src/components/auth/account-door.tsx
  - src/components/shared/unverified-mark.tsx
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/components/lab/
  - src/app/(dev)/design/touchpoints.ts
  - docs/design/rulings.md
  - docs/systems/guest-flow.md
---

# lp/identity-door

**Goal.** A NEW lab board on Will's word (2026-09-22, rulings.md "guest identity" and "the morning after the identity round": "I'd like to run most of this through the lab once our foundation is complete"; the foundation is whole on the alias): the door sheet with the optional email, the sign-in nudge, the verified gate's framing, the guest menu's two states and where Remove your email lives (five asks). A catalog to select from, the shipped state one option among three or four per ask, the same guest in the same world, at 1440 and 375; nothing here wires production. The Lane section at the foot of the Orchestrator's plan file carries every ask and option; this manifest's brief is a copy of it.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `50c03129`)

- What this is: the identity round is whole on the alias (rulings.md "guest identity: name only, unconfirmed email, verified account" and "the morning after the identity round", every sentence his; the plan `~/.claude/plans/great-work-however-1-dapper-twilight.md` is the Orchestrator's record and you may read it whole). Will's word for this board: "We'll do a lot of lab work later to redesign here" and "I'd like to run most of this through the lab once our foundation is complete (including the flow around 'pointed to from the follow moment after a confirmation', event claim UI, profile setup, etc - this introduces lots of new UI and flows)". The foundation is complete; this is the lab work. A board is a CATALOG to select from (bible 22; every option a working picture of the same guest in the same world, Priya at Maya and Jay's wedding, the media-viewer world the `guest-capture` board uses); every ask carries its context as a lede of at most 240 characters; the shipped state is always one of the options, drawn honestly. DECIDED, NOT ASKED: the model itself (three levels, the per-event name until the claim, the typed address inert and never shown, the public mark's two states and its word "Unverified", the removal of unclaimed uploads at Finish, nothing on a profile until chosen). The board is a Sonnet lab lane: lightweight, fast, at 1440 and 375, a favourite lands in the Library as a working version later on his verdicts. THIS BOARD: the door sheet's redesign around the optional email and the guest's own surfaces. The shipped door: welcome, then the name step ("What should we call you?", "Your name goes on the photos you add, so the host knows who to thank.", the field, "Just a name. Nobody has to prove a name.", then "Email (optional)" with "Come back to this album anytime, with every photo you add.", Continue), then the upload step; a verified-required event shows no field and its gate reads "The host has asked guests to confirm an email for safety. One tap and you're in."; the guest menu reads "Unverified" + Add your email (a one-field dialog, "Confirm it now instead") or "Email not confirmed" + Confirm your email (an empty code door: "Enter the email you added and we will send a code."); the offer card after the first upload is prefilled for the visit.
- ASKS (five, each three or four options, the shipped one among them): `field` (how the optional email sits: a second field always shown under the name; a ghost line "Add an email to come back anytime" that opens the field on tap; the email as its own soft step after the name with "Skip"); `nudge` (the sign-in path for a member at a names-mode door: a ghost link "Already on Partyreel? Sign in and your photos go with it" under the field; a row on the welcome step; nothing, the menu's Sign in is enough); `gate` (the verified-required screen's benefit framing: the one line as shipped; the line plus two guest benefits as a short list, "save the event, come back anytime"; the host named in an eyebrow with the reason under it); `menu` (the guest menu's two states: the label and rows as shipped; a card at the menu's head that explains the state in one line with the one action; the actions as a single "Your photos" row that opens a sheet); `remove` (where "Remove your email" lives for a guest who typed one: a row in the menu; inside the confirm door as a quiet link; nowhere until the email is confirmed).
- Build from the kit (`src/components/lab/`; the `guest-capture` board is the precedent for a board over the guest world: its `spec.ts`, `fixtures.ts`, `parts.tsx`, `scene.tsx`, `board.tsx`); the shipped components in `src/components/guest/` are the truth for the shipped option, never edited; register the board in `src/app/(dev)/design/sandbox/registry.ts`, `src/app/(dev)/design/(shell)/lab/boards.ts` and `src/app/(dev)/design/touchpoints.ts` (your own lines only, the registration exception; append the id after `guest-capture` in DESK_ORDER, the Orchestrator reorders at the merge); no em-dash anywhere; every string inside the registry test's limits.
- Owns: `src/app/(dev)/design/sandbox/identity-door/`. Reads, never edits: `src/components/guest/`, `src/components/auth/account-door.tsx`, `src/components/shared/unverified-mark.tsx`, `src/app/(dev)/design/sandbox/guest-capture/`, `src/components/lab/`, `src/app/(dev)/design/touchpoints.ts`, `docs/design/rulings.md`, `docs/systems/guest-flow.md`.
- Tests: the registry tests; `lab:smoke` whole; `pnpm lab:demo --board identity-door --base http://localhost:3134` (every option at 1440 and 375, captured to your scratch); the gate with every exit code.
- His to overrule: the five questions are his; nothing in this lane wires production.

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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Board commit `6cf2c90a` (the board, its four parts files and the three registrations); sync-merge commit `7c6d3345`
  (`origin/launch-prep`, which had moved: the name-gate merge, the reel round's reconception and retirement of
  `reel-studio`, and the sibling `identity-profile` board landing first); pushed. Both are stable commits on
  `lp/identity-door`; this line names them rather than this manifest's own commit, per the boot brief.
- Every claim below names its artifact (a commit hash, a log line, a file path), so the Orchestrator checks rather
  than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree (all re-run after the sync-merge, each its own exit code): `pnpm design:rules` ok (16
  standing boards, 1237 contracts on 163 components, regenerated `docs/design/library.md` and
  `rules.generated.json`); `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` ok (140 specimens on 101
  entries, unchanged); `pnpm typecheck` ok; `pnpm lint` ok (9 known warnings, none in a file this lane touched, exit
  0); `pnpm test` ok (338 files, 3692 passed, 1 skipped); `pnpm build` ok (257 static pages, exit 0). `pnpm lab:smoke
  --base http://localhost:3134` ok (434 checks, 0 failing; `identity-door` reads 304 words against the 1200 budget).
  `pnpm lab:demo --board identity-door --base http://localhost:3134` ok (5 steps, 0 failing, every option pair
  differing by 14.67% to 67.69% of pixels, no UNPAINTED, no layout findings).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `docs/design/library.md` (generated),
  `src/app/(dev)/design/(shell)/lab/boards.ts`, `src/app/(dev)/design/sandbox/registry.ts`,
  `src/app/(dev)/design/touchpoints.ts` (the registration exception, own lines only, resolved against a same-spot
  collision with `identity-profile`'s own head-of-list registration by keeping both, per the coordinator's own
  word that the Orchestrator reorders at the merge), and the five files under
  `src/app/(dev)/design/sandbox/identity-door/`. Nothing else; no record doc touched.
- The items, one line each:
  - `field`: recommended **ghost** (a quiet line, "Add an email to come back anytime", that opens the real field on
    tap; interactive in the lab, real local state) over `shown` (both fields always open, as shipped) and `step` (a
    second sheet screen with a back-chevron and "Skip for now"). A kept one becomes the Library's door name step.
  - `nudge`: recommended **underfield** (a quiet centred link under the fields, "Already on Partyreel? Sign in and
    your photos go with it") over `welcome` (the same sentence as a third row on the real WelcomeStep, quoted
    verbatim from `entry-modal.tsx`) and `none` (nothing new; a small honest chip notes the menu already carries
    Sign in). A kept one becomes the Library's door name step or welcome step.
  - `gate`: recommended **list** (the ruled sentence unchanged, plus two guest benefits as a short list, "Save the
    event to your profile" / "Come back anytime, with every photo you add") over `line` (as shipped) and `eyebrow`
    (the host's name replaces "Almost in"). A kept one becomes the Library's verified-gate step.
  - `menu`: recommended **rows** (the label and action rows, as shipped) over `card` (a card explaining the state
    with one action) and `sheet` (a single "Your photos" row opening a bigger sheet). A kept one becomes the
    Library's guest account menu.
  - `remove`: recommended **quiet-link** (a quiet "Remove this email instead" inside the confirm door, mirroring
    the shipped Add-email dialog's own idiom) over `menu-row` (a persistent row) and `nowhere` (as shipped, no
    control until confirmed). A kept one becomes the Library's confirm-email dialog.
- Calls his to overrule on the alias, one line each:
  - Every recommendation above is his to overrule; this is a catalog, not a wiring lane.
  - `gate`'s `eyebrow` option runs against his own 2026-09-21 ruling against naming a host in a header (long-name
    layout safety, `rulings.md` "the door's first look"); kept in the catalog because the brief asked for it by
    name, with the tension written into that ask's `overrule` line rather than dropped silently.
  - The `gate` and `remove` asks imagine Maya's own wedding with Require verified emails on and with an email
    already typed, respectively, rather than a second fictional event; both stay inside guest-capture's own world
    (Priya, Maya and Jay, 14 June) on the brief's own instruction to share it.
- The help articles this lane makes stale: none (a lab catalog wires nothing; no shipped surface or help article
  changed).
- Assets requested from Will: none (the board reuses the twelve stock `MARKETING_IMAGES` stills, bible 18).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- A defect found and fixed in the same change, not carried to the wiring stage since nothing here ships: a number
  immediately followed by literal text split across a JSX line break can lose the space between them under this
  build's compiler (confirmed by reading the rendered DOM through an isolated headless Chrome, not by eye: "48
  photos" rendered as "48photos"). Fixed in `parts.tsx`'s `GateBody` heading and `scene.tsx`'s `EventGround` stats
  line by combining each into one template-literal string, matching the real shipped precedent in
  `enter-event-prompt.tsx`. Worth a wider grep across the app for the same pattern, flagged here rather than
  chased platform-wide from a lab lane.
- Look at first: the `field` and `nudge` asks together (the ghost-line reveal is a real interactive control worth
  pressing by hand); the `gate` list's two benefit lines for tone; the `menu` sheet option's slightly crowded
  "opens" affordance between its two panels, a rough edge worth a second pass only if that option is the one kept.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). The door sheet's redesign catalog: five asks over Priya at Maya and
Jay's wedding, one step earlier in her walk than `guest-capture` finds her (where the optional email sits against
her name, where a member's sign-in path lives, the verified gate's benefit framing, the guest menu's shape, and
where undoing an email lives), every "as shipped" option quoting real shipped copy and every other option inert,
quoted markup on no session and no network. Registered after `guest-capture` in `DESK_ORDER` per the manifest, its
head-of-list registration combined cleanly with sibling `identity-profile`'s own. A JSX whitespace defect (a number
beside text losing its space across a line break) found and fixed in passing, worth a platform-wide grep later. The
board waits on the desk for his verdicts; a kept option lands in the Library as the door's working version.
