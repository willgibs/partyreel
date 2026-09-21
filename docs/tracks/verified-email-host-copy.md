---
track: verified-email-host-copy
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "bc28580b"          # the launch-prep SHA the branch was cut from
board: none            # the identity reshape, wave 1: the switch and every sentence; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-settings/
  - src/components/app/event-settings-form.tsx
  - src/components/app/checkout-button.tsx
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/lib/events/guest-experience-summary.ts
  - src/lib/events/guest-experience-summary.test.ts
  - src/lib/reel/quick-add.ts
  - src/lib/reel/quick-add.test.ts
  - src/lib/reel/engine/assets.ts
  - src/components/ui/confirm-switch.tsx
  - src/components/ui/confirm-switch.test.tsx
  - src/components/marketing/sections/
  - src/components/marketing/faq-data.ts
  - src/components/marketing/mock-parity.test.ts
  - src/app/(marketing)/(cinema)/features/guests/page.tsx
  - src/lib/constants/marketing-voice.ts
  - src/lib/constants/legal-terms.tsx
  - src/lib/constants/legal-privacy.tsx
  - src/lib/constants/legal.ts
  - src/lib/content/llms.ts
  - src/lib/content/help-redirects.ts
  - content/help/
  - content/blog/
  - docs/PRD.md
  - docs/PRICING.md
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/media/uploader-identity.ts
  - src/lib/validation/event.ts
  - src/lib/db/queries/social.ts
  - src/components/shared/media-lightbox.tsx
  - src/components/social/guest-list.tsx
  - src/lib/content/blog-redirects.ts
  - src/lib/content-policy.test.ts
  - src/lib/no-em-dash-policy.test.ts
  - next.config.ts
  - docs/design/rulings.md
---

# lp/verified-email-host-copy

**Goal.** Wave 1 of the identity reshape: Will's `address=none` on `guest-verify` round two and his note (2026-09-21, build `5e210ef`), verbatim in `docs/design/rulings.md` under "the identity reshape", with his four answers at approval: anonymity leaves the product; the host's switch becomes Require verified emails (on by default); off, a guest types a display name at the door and uploads under it with a small unverified mark; the capture flow after a name-only guest's first upload is wired as the working version. This lane is the host's switch, the host's surfaces and every sentence in the product, the marketing, the help and the legal pages that named the old concept. The brief below is the whole reading.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `bc28580b`)

- The switch (`uploads-section.tsx`: no inversion; `name="require_verified_email"`, `confirmWhen` on OFF; the copy
  above; `useWatch` renamed), `event-settings-form.tsx:80`, `confirm-switch.tsx:84` and its test fixture,
  `guest-experience-summary.ts` (+ test: eight sentences, "confirm their email" / "under a name they choose"), the
  Guests room (`guests/page.tsx` opting the room into unverified names and its line; `event-settings/profile-social-card.tsx:141-145`:
  "When this is on, every guest who added photos is listed by name on the album, for anyone who can open it. A name
  with no verified email behind it wears a small mark."), `host-app.md:46,92-96`, `profiles-social.md:21`, the reel's
  bucket rename (`quick-add.ts:57-66` + test :225; `engine/assets.ts`'s word). Marketing (the inventory in the facts;
  every sentence em-dash free; `marketing-voice.ts` gains "NEVER WRITE 'ANONYMOUS': every upload carries a name,
  verified or marked"; `mock-parity.test.ts` and `use-album-fill.test.ts` re-pinned), the album section's "Anonymous"
  fixtures become a named, marked guest, the blog posts (eight, `family-reunion-photo-sharing.mdx` included),
  `llms.ts:101`, `checkout-button.tsx`'s word. Help: `require-accounts-to-upload-explained.mdx` renamed
  `require-verified-emails-explained.mdx` and rewritten whole, a `help-redirects.ts` on the `blog-redirects.ts`
  pattern with one spread in `next.config.ts` (an exception line) and a test on the `blog.test.ts:448` pattern; the
  thirteen other articles reworded; "reports are anonymous" untouched. Legal: Terms 1.2 and Privacy 1.3 (`legal.ts:32`),
  `legal-terms.tsx:109` (the display-name paragraph gains the event-typed name), `:120`, `:123`, `legal-privacy.tsx:146`,
  `:288`, `:293` (the opt-out "upload without signing in where the host allows it" goes, since a name-only guest is
  listed too; "do not upload to that event" stays); the no-rights-tracking rule untouched. `PRD.md:10,19,27,32`,
  `PRICING.md:54-55,64-65`. THE SWEEP, last: `git grep -in anonymous` across `src/`, `content/`, `docs/`, every hit
  in the Handoff with its fate (rewritten here; another lane's, named; another sense, left), so the word leaves the
  product by inspection, not by memory.
- Owns: `src/components/app/event-settings/`, `src/components/app/event-settings-form.tsx`,
  `src/components/app/checkout-button.tsx`, `src/app/(app)/dashboard/[eventId]/guests/`,
  `src/lib/events/guest-experience-summary.ts` (+ test), `src/lib/reel/quick-add.ts` (+ test),
  `src/lib/reel/engine/assets.ts`, `src/components/ui/confirm-switch.tsx` (+ test), `src/components/marketing/sections/`,
  `src/components/marketing/faq-data.ts`, `src/components/marketing/mock-parity.test.ts` (never
  `src/components/marketing/mdx/` or `mdx-components.tsx`: the Orchestrator's), `src/app/(marketing)/(cinema)/features/guests/page.tsx`,
  `src/lib/constants/marketing-voice.ts`, `src/lib/constants/legal-terms.tsx`, `src/lib/constants/legal-privacy.tsx`,
  `src/lib/constants/legal.ts`, `src/lib/content/llms.ts`, `src/lib/content/help-redirects.ts` (new), `content/help/`,
  `content/blog/`, `docs/PRD.md`, `docs/PRICING.md`, `docs/systems/host-app.md`, `docs/systems/profiles-social.md`.
  Reads: `src/lib/media/uploader-identity.ts`, `src/lib/validation/event.ts`, `src/lib/db/queries/social.ts`,
  `src/components/shared/media-lightbox.tsx`, `src/components/social/guest-list.tsx`, `src/lib/content/blog-redirects.ts`,
  `src/lib/content-policy.test.ts`, `src/lib/no-em-dash-policy.test.ts`, `next.config.ts`, `docs/design/rulings.md`.
  Help and legal are written last, against the two production lanes' merged truth (a sync before the handoff).
- His to overrule: "Use names only" and the dialog's sentences; the help article's new slug; the legal versions bumped.

## The verdict map (every answer of the batch; this lane wires only its own board's)

(no verdict map: one verdict and a note, verbatim in docs/design/rulings.md under "the identity reshape", and his four answers at approval; the brief above is the Orchestrator's whole reading)

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

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board <board>` ok (a board)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Calls his to overrule on the alias, one line each
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them)
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
