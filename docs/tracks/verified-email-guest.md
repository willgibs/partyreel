---
track: verified-email-guest
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "bc28580b"          # the launch-prep SHA the branch was cut from
board: none            # the identity reshape, wave 1: the door, the credit, the capture flow; no board
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/
  - src/lib/guest/
  - src/app/(guest)/
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/media-lightbox.test.tsx
  - src/components/shared/anonymous-info.tsx
  - src/components/shared/unverified-mark.tsx
  - src/components/social/guest-list.tsx
  - src/components/social/guest-list.test.tsx
  - src/components/auth/account-door.tsx
  - src/components/auth/account-door.test.tsx
  - docs/systems/guest-flow.md
  - docs/systems/auth-accounts.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/validation/profile.ts
  - src/lib/validation/upload.ts
  - src/lib/events/gallery-access.ts
  - src/lib/media/uploader-identity.ts
  - src/lib/db/queries/guest-events.ts
  - src/lib/db/queries/social.ts
  - src/components/app/media-grid.tsx
  - src/components/app/user-menu.tsx
  - src/components/shared/masonry.tsx
  - src/components/shared/set-name-step.tsx
  - src/components/social/follow-button.tsx
  - src/components/ui/
  - src/lib/constants/marketing-voice.ts
  - docs/design/rulings.md
---

# lp/verified-email-guest

**Goal.** Wave 1 of the identity reshape: Will's `address=none` on `guest-verify` round two and his note (2026-09-21, build `5e210ef`), verbatim in `docs/design/rulings.md` under "the identity reshape", with his four answers at approval: anonymity leaves the product; the host's switch becomes Require verified emails (on by default); off, a guest types a display name at the door and uploads under it with a small unverified mark; the capture flow after a name-only guest's first upload is wired as the working version. This lane is the guest's door, the credit and the capture flow, on the applied schema. The brief below is the whole reading.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `bc28580b`)

- The name step (`entry-modal.tsx`: `EntryModalHandle.openToName("join" | "edit")`, `nameOpen` ORed into `open`;
  `EventExperience.openAdd` routes a signed-out visitor at a names-mode event to it when there is no session OR a
  session with no stored name, holds `pendingAdd`, and never for the demo; `onNamed` closes the shell and opens the
  intent sheet programmatically), `src/lib/guest/join.ts` (`joinEvent({qrToken, displayName?})`, `renameGuest`; the
  queue's silent join calls the first without a name), `use-stored-name.ts` (`pr_guest_name_<qr_token>` beside the
  session and `pr_guest_name_last` as the prefill; `collectStoredSessionTokens` skips both), the guest header's
  third state (`GuestNameMenu`: the name, "Name not verified", "Confirm your email", "Change name", "Sign in" over a
  new `DOOR_WEAR.signin`), the reworded gate line and teaser pill, `DOOR_WEAR.save` (heading "Keep your photos";
  reason "Confirm your email and this event stays on your profile, with every photo you added. Confirming makes a
  free account.") and `.like`, the pill's mark (`unverified-mark.tsx`: the `MineMark` material; the popover copy;
  "Confirm your email" on the guest's own credit; the host's extra sentence), `anonymous-info.tsx` deleted, "A guest"
  for legacy rows, the guest list (`guest-list.tsx`: the unverified chip with the mark and no link; a Follow on
  handled chips for a signed-in viewer; the empty line "Nobody has added photos yet."), the offer card
  (`save-account-prompt.tsx` with `{n}` threaded; `pr_pending_offer_<qr_token>` written when the door opens and
  consumed on the next mount by the slot's owner, `claim-handle-prompt.tsx`, so the redirect paths land the same
  sequence; the claim awaited before `save_event`; the typed name lands on the profile through `updateDisplayNameAction` when the
  profile has none, since wave 0 left `claim_anonymous_uploads` unchanged), the follow moment (`follow-moment-card.tsx`; the host's card from
  `getHostCard` resolved in `page.tsx`; "Claim your handle" folded in as its second line), the 403
  `verification_required` handling (the failure sheet's line for the remaining files, the session dropped, the gate
  at the next Add; signed in, a silent re-join). `guest-flow.md` ("Upload lives IN the gallery", the door, the
  identity block minus the server lane's lines) and `auth-accounts.md:4,112-114` refined in place.
- Tests (each new file opens with `// @contract-for:`): `entry-modal.test.tsx` (the name step never auto-opens; free
  dismiss POSTs nothing; Add photos POSTs qr_token and display_name and hands the token up; a reserved name refused
  in place; edit mode; the demo never opens it), `entry-steps.test.ts` (the flag maps to `teaser`),
  `guest-upload.test.tsx` (a stored session with a name never joins; a signed-in silent join carries no name; the
  403 path fills the failure sheet and drops the session), `join.test.ts`, `session-tokens.test.ts` (ignores the name
  keys), `save-account-prompt.test.tsx` (the sentences; Maybe later; the pending flag consumed on mount; the follow
  card once; no host card; the handle line when the profile has none), `media-lightbox.test.tsx` (unverified marked
  with the action on one's own, verified plain, legacy "A guest"; the host's sentence), `guest-list.test.tsx` (the
  unverified chip, the Follow on a handled chip), `guest-header.test.tsx` (the third state's four items),
  `account-door.test.tsx` (the three wears). No new floating primitive (said in the Handoff).
- Owns: `src/components/guest/`, `src/lib/guest/`, `src/app/(guest)/`, `src/components/shared/media-lightbox.tsx`
  (+ test), `src/components/shared/anonymous-info.tsx` (deleted), `src/components/shared/unverified-mark.tsx` (new),
  `src/components/social/guest-list.tsx` (+ test), `src/components/auth/account-door.tsx` (+ test),
  `docs/systems/guest-flow.md`, `docs/systems/auth-accounts.md`. Reads: `src/lib/validation/profile.ts`,
  `src/lib/validation/upload.ts`, `src/lib/events/gallery-access.ts`, `src/lib/media/uploader-identity.ts`,
  `src/lib/db/queries/guest-events.ts`, `src/lib/db/queries/social.ts`, `src/components/app/media-grid.tsx`,
  `src/components/app/user-menu.tsx`, `src/components/shared/masonry.tsx`, `src/components/shared/set-name-step.tsx`,
  `src/components/social/follow-button.tsx`, `src/components/ui/`, `src/lib/constants/marketing-voice.ts`,
  `docs/design/rulings.md`. The drawn door and offer (`sandbox/guest-verify/address.tsx`, `collision.tsx`) are read
  at boot and never listed as reads: the lab lane deletes the folder (R2.14).
- His to overrule: the name step at the first Add rather than at arrival; the code-led mail; the teaser kept; the
  tile unmarked; the follow moment's words; "A guest"; the failure sheet as the flip's surface.

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
