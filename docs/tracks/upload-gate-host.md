---
track: upload-gate-host
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d83ec75"          # the launch-prep SHA the branch was cut from
board: none            # production: the host's Require an upload to view switch and its sentences; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/
  - src/components/app/event-settings-form.tsx
  - src/lib/validation/event.ts
  - src/lib/validation/event.test.ts
  - src/lib/db/mutations/events.ts
  - src/lib/events/guest-experience-summary.ts
  - src/lib/events/guest-experience-summary.test.ts
  - content/help/require-an-upload-to-view-explained.mdx
  - content/help/event-settings-explained.mdx
  - content/help/who-can-see-your-event.mdx
  - src/lib/content/help.ts
  - docs/systems/host-app.md
  - docs/PRD.md
  - docs/PRICING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/confirm-switch.tsx
  - src/lib/constants/tiers.ts
  - supabase/migrations/20260922003000_require_upload_to_view.sql
  - src/lib/db/types.ts
  - content/help/require-verified-emails-explained.mdx
  - docs/design/rulings.md
---

# lp/upload-gate-host

**Goal.** The host's side of Will's door ruling (2026-09-21, verbatim in `docs/design/rulings.md` under \"the door as three steps\"): the switch Require an upload to view in the event settings, its confirm on the ON edge, the guest-experience sentences composed for it, its help article and the two it touches, and the docs lines. Wave 0 landed the schema, so code against real types. The guest side is `door-steps`, cut beside this lane on disjoint owns; never touch its files. No board, no new ruling; the brief below is the approved plan's; read it end to end before the first edit.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `8d83ec75`)

- What this is: the host's side of Will's door ruling (2026-09-21, verbatim in `docs/design/rulings.md` "the door as three steps"; read it first). Wave 0 landed the schema: `events.require_upload_to_view` (off by default, host-writable), `get_event_by_qr_token` returning it, and the gate's read. This lane gives the host the switch and every sentence around it; the guest side (the door, the gate's enforcement) is `door-steps`, cut beside this lane on disjoint owns; this lane never touches `src/components/guest/`, `src/lib/guest/` or `src/lib/events/gallery-access*`.
- THE SWITCH (`src/components/app/event-settings/uploads-section.tsx`, the `ConfirmSwitch` pattern of Require verified emails at :169-185, asking on the ON edge this time, `confirmWhen: (next) => next`, the first switch to ask in that direction, which the primitive's ★ allows): label "Require an upload to view"; the description in the two-clause shape of its sibling: "On: guests add one photo or video before they can see the full album, so nobody just looks. Off (the default): the album opens once a guest has given a name, or confirmed their email."; `dialogTitle` "Ask for a photo before the album?"; the consequence line: "Guests will see a few preview photos and add one of their own before the album opens. If uploads are closed or the album is full, the album opens anyway. You can turn this off anytime."; `confirmLabel` "Ask for a photo"; `cancelLabel` "Leave it open"; a quiet hint under the switch when Accepting uploads is off: "Has no effect while uploads are closed." Free on every tier: `GATED_EVENT_SETTINGS` in `src/lib/constants/tiers.ts` stays `["password", "custom_slug"]` (untouched, the form's comment says so).
- THE FLOW: `src/lib/validation/event.ts` (`require_upload_to_view: z.boolean().default(false)` in `createEventSchema` with a ★ comment naming the ruling; `updateEventSchema` follows by `.partial()`), `src/lib/db/mutations/events.ts` (the insert list at :76 and the patch list at :155 gain the column), `src/components/app/event-settings-form.tsx` (`defaultValues` at :80; the not-tier-gated comment at :64-66 names it too), the `useWatch` trio at `uploads-section.tsx:55-63` becomes a quartet feeding the summary.
- THE SUMMARY (`src/lib/events/guest-experience-summary.ts`, one more input `requireUploadToView`): COMPOSE the ON sentences, never append a clause (the names branch would otherwise read "view and add photos under a name they choose and add a photo before they can see everything"). Open, names, ON: "Guests give a name and add a photo, then see everything."; open, verified, ON: "Guests confirm their email and add a photo, then see everything."; the password variants lead with "Guests enter the password, then ..."; uploads closed makes the switch moot and the OFF sentences stand ("... Uploads are closed."); the eight OFF sentences stand exactly as they are (`guest-experience-summary.test.ts` pins them whole; add the ON pins).
- THE HELP: a new article `content/help/require-an-upload-to-view-explained.mdx` on `require-verified-emails-explained.mdx`'s spine (frontmatter `category: privacy-and-safety`, `order`, `keywords`; `<Path>Dashboard › Your event › Settings › Guest uploads › Require an upload to view</Path>`; an "Off (the default)" / "On" / "Which to choose" spine; the fail-open in plain words; the `<Callout type="info">` pattern "This isn't a password"); `event-settings-explained.mdx:29-34` gains the bullet in the Guest uploads list; `who-can-see-your-event.mdx` refined where it lists what gates the album. The slug registered wherever the help index needs it (`src/lib/content/help.ts`, only if a registration exists there); `help-ui-labels.test.ts` pins every `<UiLabel>` to a shipped string, so quote the switch's labels exactly.
- DOCS: `docs/systems/host-app.md:93-108` gains the switch's own bullet beside Require verified emails (the default, the fail-open, free on every tier); `docs/PRD.md` and `docs/PRICING.md` one line each where Require verified emails is mentioned ("free on every tier").
- Owns: `src/components/app/event-settings/`, `src/components/app/event-settings-form.tsx`, `src/lib/validation/event.ts`, `src/lib/validation/event.test.ts`, `src/lib/db/mutations/events.ts`, `src/lib/events/guest-experience-summary.ts`, `src/lib/events/guest-experience-summary.test.ts`, `content/help/require-an-upload-to-view-explained.mdx`, `content/help/event-settings-explained.mdx`, `content/help/who-can-see-your-event.mdx`, `src/lib/content/help.ts`, `docs/systems/host-app.md`, `docs/PRD.md`, `docs/PRICING.md`. Reads, never edits: `src/components/ui/confirm-switch.tsx`, `src/lib/constants/tiers.ts`, `supabase/migrations/20260922003000_require_upload_to_view.sql`, `src/lib/db/types.ts`, `content/help/require-verified-emails-explained.mdx`, `docs/design/rulings.md`.
- Tests: `validation/event.test.ts` (the default false; the update schema carries it), `guest-experience-summary.test.ts` (the ON sentences, the OFF eight unchanged), `help-ui-labels.test.ts`, `help.test.ts` and `help-slug-pins.test.ts` (a new slug), `mock-parity.test.ts` stays green (the settings mock pins "Require verified emails" only); `lab:smoke` whole; the gate with every exit code. Verified by hand on :3133 signed in as the host on a disposable event: the switch flips ON through its dialog, saves, reads back, the summary sentence both ways, the hint under closed uploads.
- His to overrule: the switch confirming on the ON edge and its three labels; the composed sentences; the new article's slug.

## The verdict map (every answer of the batch; this lane wires only its own board's)

(no verdict map: Will's three points, his addition and his three answers, verbatim in docs/design/rulings.md under "the door as three steps"; the brief above is the whole ruling as the approved plan carried it)

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

- none: the brief's copy and structure were complete, and no genuinely new one-way-door decision came
  up. The discretionary fills (the password-variant composed sentences, the new article's body, where
  each docs line landed) are listed under Handoff "Calls his to overrule" and "Look at first" instead.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/host-app.md` (after the "Require verified emails" bullet): a new bullet for "Require an
  upload to view" — the column, the ON-edge ConfirmSwitch, FREE for any tier, the fail-open, the ticket
  punched once, `get_upload_gate` service-role-only, `guestExperienceSummary()` composing fresh.
- `docs/PRD.md` "Safety and moderation": the stale "Host access options ... are a fast-follow" line
  (naming `require-upload-to-view` as future work) corrected to shipped, both it and the password now
  named as live capability-token RPCs.
- `docs/PRICING.md`: one clause beside the "Require verified emails" tier-gating bullet, naming the new
  switch free on every tier too.

## Deferred (ROADMAP one-liners, bucket named)

- Docs: the four `privacy-and-safety` help articles after `require-verified-emails-explained.mdx`
  (`photo-metadata-and-location`, `how-long-media-is-kept`, `reporting-and-safety`,
  `your-data-and-deleting-your-account`) could each have their `order` bumped by one so the new
  `require-an-upload-to-view-explained` (parked at `order: 7`, the end of the category, to avoid an
  edit outside this lane's owns) sits at `order: 3`, right after its identity sibling. Cosmetic only
  (the article is live and linked either way); a `help-sync`-style bucket item.

## Handoff (replaces the chat report)

- Head `b33b28c8`, pushed; synced with launch-prep at `0bd23041` (merged `origin/launch-prep`'s tip
  `23f2d832`, four record/journal commits, no overlap with this lane's owns — clean automatic merge).
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree (each run twice, before and after the sync merge, both green): `design:rules`
  ok (no diff — no contract/policy/`for`/touchpoints.ts change), specimens ok (no diff — 140 specimens on
  101 entries), typecheck ok, lint ok (8 known warnings, none in a file this lane touched; the manifest's
  own 2026-09-21 baseline of 10 has since moved down), test ok (3431 passed, 2 pre-existing skips, 324
  files), build ok (257 static pages, 0 warnings in the build log). `pnpm lab:smoke --base
  http://localhost:3133` ok (420 checks, 0 failing, both before and after the sync). No board: `lab:demo`
  doesn't apply.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` (before the manifest commit) = exactly
  this lane's 13 owned files touched (3 `content/help/*.mdx`, `docs/PRD.md`, `docs/PRICING.md`,
  `docs/systems/host-app.md`, `event-settings-form.tsx`, `uploads-section.tsx`, `mutations/events.ts`,
  `validation/event.ts` + its test, `guest-experience-summary.ts` + its test); after this commit, +
  `docs/tracks/upload-gate-host.md` itself. No exceptions taken.
- No board (production lane); the brief above was the whole plan, built as specified. Calls made where
  the brief left the exact wording to fill in, below.
- Calls his to overrule (extending the brief's own three: the ON-edge confirm, the switch's three
  labels, the new article's slug):
  - The password-variant composed sentences (the brief gave the open-visibility examples verbatim and
    said the password ones "lead with 'Guests enter the password, then ...'"): "Guests enter the
    password, then give a name and add a photo, then see everything." and "...then confirm their email
    and add a photo, then see everything."
  - The new article's full body (structure was specified: Off/On/Which-to-choose spine, the fail-open in
    plain words, the "This isn't a password" callout; the sentences themselves are this lane's).
  - `who-can-see-your-event.mdx` gained a third heading ("Whether an upload is required first") rather
    than folding into "Whether guests confirm an email" — kept each gate its own single-purpose section,
    matching the file's existing shape.
  - `docs/PRD.md`'s edit target: "Require verified emails" isn't a literal phrase there, so the line
    fixed instead is "Safety and moderation"'s stale "are a fast-follow" note, which already named
    `require-upload-to-view` directly.
- The help articles this lane makes stale: none directly (this lane's three owned articles are
  consistent with the shipped switch). Not this lane's to fix, flagged for awareness: the guest-voiced
  join/upload articles (`how-guests-join-and-upload.mdx`, `save-an-event-and-find-your-uploads.mdx`,
  `require-verified-emails-explained.mdx` — all `door-steps`' owns) describe the pre-ruling "browse the
  teaser first" exemption that "No exit" retires; that's `door-steps`' copy to land or a `help-sync`
  follow-up once both door lanes are on the tree.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (wave 0 already landed the schema).
- Look at first:
  - The signed-in switch-flip walkthrough ("flips ON through its dialog, saves, reads back, the summary
    both ways, the hint under closed uploads") could NOT be driven on :3133: localhost is signed out in
    this environment and initiating a new sign-in is an allow-list-gated flow (CLAUDE.md "Local dev vs.
    live testing") this lane may not complete. Verified instead: the full logic by unit test (every
    sentence combination pinned, including the password variants and the closed-uploads moot case), the
    settings form/mutation/validation wiring by typecheck + build, and the three touched help pages
    rendered live on :3133 signed OUT at both 1440 and 375 (the new article, and the two edited siblings,
    all read correctly with working cross-links). The actual toggle-and-save walkthrough is the
    Orchestrator's on the alias once this merges.
  - The new article sits at `order: 7` (category end) rather than beside its identity sibling, to avoid
    touching four files this lane doesn't own — see Deferred.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). The host's side of Will's door ruling (2026-09-21, "the
door as three steps"): a fourth switch on the Guest uploads card, Require an upload to view, off by
default and free on every tier, the first switch in the card to confirm on the ON edge
(`confirmWhen: (next) => next`) rather than off. The schema (wave 0), validation, mutation and form carry
it end to end; the live guest-experience summary composes its ON sentences fresh rather than appending a
clause, with the eight pre-existing OFF sentences pinned unchanged. A new help article on
`require-verified-emails-explained.mdx`'s spine, a bullet in `event-settings-explained.mdx`, a new
section in `who-can-see-your-event.mdx`, and one line each in `host-app.md`, `PRD.md` (its stale
"fast-follow" note corrected to shipped) and `PRICING.md`. Gate green on the synced tree twice over
(typecheck, lint at 8 known warnings, 3431 tests, build at 257 pages, `lab:smoke` 420 checks); the
signed-in toggle-and-save walkthrough was blocked locally by the sign-in boundary and was this record's
to run on the alias. `door-steps` landed beside it on disjoint owns.
