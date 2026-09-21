---
track: verified-email-guest
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- none raised mid-lane. Every open call in the brief was taken on its recommendation and is listed under
  "Calls his to overrule" below, as the lane's rules ask.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/guest-flow.md`, ROLE line: `allow_anonymous_uploads` account gate -> the
  `require_verified_email` switch (its gate and its name-only door).
- `docs/systems/guest-flow.md`, the Flow's lightbox bullet: the attribution pill reshaped ("[name] [mark]
  [Host] · i+1 of N"), every upload carries a name, "A guest" for legacy rows, `anonymous-info.tsx` retired
  in place for the Library, and WHY the mark carries its own door (the `canDelete` seam, not a second one).
- `docs/systems/guest-flow.md`, the Flow's "Save is not in this row" paragraph: the capture flow's three
  beats, the `pr_pending_offer_<qr_token>` marker, why the follow moment offers the host alone.
- `docs/systems/guest-flow.md`, the upload act's bullets: a new one for the mid-run 403
  `verification_required` (the silent re-join for a confirmed viewer, the dropped session and one failure
  sheet for a name-only guest).
- `docs/systems/guest-flow.md`, The ARRIVAL: a new bullet for the name step as a SECOND door through the
  same shell (imperative, at the first Add, always free, nothing posted until Add photos, the two storage
  keys and why they are not capabilities).
- `docs/systems/guest-flow.md`, Auth-aware header island: the third state, the no-sign-out rule, and the
  `name-door.ts` channel between the sibling islands.
- `docs/systems/auth-accounts.md`, ROLE line: the NOT-HERE pointer renamed to the name-only door and
  `require_verified_email`.
- `docs/systems/auth-accounts.md`, "ONE account door": worn FIVE ways now (the two new guest surfaces),
  the words asking for a confirmed email rather than an account, and `signin` as the fifth wear.
- `docs/systems/auth-accounts.md`, the existing-account gotcha: every guest-side wear AWAITS the claim
  before it refreshes, and the claim does not name the profile (`updateDisplayNameAction` does).
- NOT touched, by the round's split: `guest-flow.md`'s "Joining + identity" block is the server lane's
  exception line.

## Deferred (ROADMAP one-liners, bucket named)

- Now: delete `src/components/shared/anonymous-info.tsx` with its Library entry
  (`design/(shell)/library/patterns/gallery-demos.tsx`, its `for` line in `rules/component-notes.ts`) in one
  change; the product mounts it nowhere since the identity reshape, and a wiring lane never deletes a module
  the lab imports.
- Now: give `unverified-mark.tsx` a real gallery specimen (both tones, over a photograph and on a chip); it
  ships `unspecimened` because its tones only mean anything against what is behind them and the gallery file
  belongs to no lane this round.
- Now: collapse the guest page's two wave seams once `verified-email-server` is on the tree: the
  `socialSeam` cast in `(guest)/e/[token]/page.tsx` back to plain named imports, the
  `"require_verified_email" in event` read to the plain field, and the `(item as { isVerified?: boolean })`
  read in `media-lightbox.tsx` (+ its test's intersection type).
- Now: the guest list's Follow wears the default Button size beside an `h-8` chip (`FollowButton` is a
  read for this lane and hard-codes it); a size prop, or the chip row redrawn, is a one-line follow-up.

## Handoff (replaces the chat report)

- BOARD commit `efb874f0` (the whole lane's wiring); SYNC-MERGE commit `5d4963ee` (launch-prep had moved to
  `91c8c065`: `verified-email-lab`, `reshape-viewer-curation`, `reshape-studio-export`). One conflict, in the
  generated `docs/design/library.md`, resolved by regenerating (`pnpm design:rules`), never by hand.
- Every claim below names its artifact, so the Orchestrator checks rather than believes.
- **Gates on the synced tree**, each on its own exit code: `pnpm design:rules` ok (221 components, 1757
  contracts, 18 policies) · specimens ok (140 specimens on 101 entries) · `pnpm typecheck` ok · `pnpm lint`
  ok, exit 0, **9 warnings** (one below the 10 baseline: the lab lane's merge took `overtaken.ts`'s two
  unused consts with `guest-verify`; none is in a file this lane touched) · `pnpm test` ok, **3340 passed,
  1 skipped, 320 files** · `pnpm build` ok, **255 pages** · `pnpm lab:smoke --base http://localhost:3132`
  ok, **415 checks, 0 failing**. No `lab:demo`: no board (a wiring lane).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`) = the owned paths plus FOUR exceptions,
  each a line the round's own rules ask for:
  - `src/app/(dev)/design/rules/component-notes.ts` — the `for` lines for the four new components (the
    ownership rule: "every new component gets its `for` line"), plus one rewritten line saying
    `anonymous-info.tsx` is retired. No lane owns this file this round; `gallery.test.ts` and
    `component-index.test.ts` fail without it.
  - `src/app/(dev)/design/rules/rules.generated.json` and `docs/design/library.md` — generated by
    `pnpm design:rules`, which is the gate's own first step. (`specimens.generated.json` did not change.)
  - `src/lib/upload/uploader.ts` — THREE lines: `code?: string` on `UploadOutcome` and the presign/complete
    branches passing it through. Unowned this round. Without it the queue cannot tell a refused FILE from a
    spent SESSION, which is the whole of the mid-run flip below; the field is additive and the host upload
    path is untouched.
  - the manifest itself.
- **The items, one line each** (no board; the brief's list):
  - the name step: BUILT as a second door through the entry shell (`openToName("join" | "edit")`,
    `nameOpen` ORed into `open`, never in `computeEntry`); verified locally at 1440 (a right-edge panel) and
    375 (a bottom sheet with the album teased through the blur above it).
  - `EventExperience.openAdd`: BUILT as the one router for all three Add affordances, holding `pendingAdd`;
    verified end to end locally (typing a name closed the door and the intent sheet opened itself).
  - `src/lib/guest/join.ts` + `use-stored-name.ts` + `name-door.ts`: BUILT; `join.test.ts` pins the refusal
    translation, `session-tokens.test.ts` pins that the two name keys are never read as capabilities.
  - the header's third state (`guest-name-menu.tsx` over the new `DOOR_WEAR.signin`): BUILT; verified
    locally (the name, "Name not verified", the three rows), and Change name reached the modal across the
    sibling islands.
  - `unverified-mark.tsx`: BUILT in MineMark's material with its OWN door (see the calls below); the
    lightbox's credit, the guest list's chips.
  - `anonymous-info.tsx`: RETIRED IN PLACE, not deleted — `git grep -l "from \"@/" src/app/\(dev\)` lists it
    (the Library's `gallery-demos.tsx`), and a wiring lane never deletes a module the lab imports. The
    delete is one Library change, on the ROADMAP's Now list.
  - the capture flow (the offer card's count and marker, `claim-handle-prompt.tsx` as the slot's owner,
    `follow-moment-card.tsx`): BUILT and unit-pinned; NOT seen running, because it needs a real upload
    (see "Look at first").
  - the guest list's union and the chip Follow: BUILT behind the server lane's seam (see below).
  - the mid-run 403 `verification_required`: BUILT; pinned in `guest-upload.test.tsx` (the session dropped,
    the rest refused once, the server's own sentence on the sheet).
  - No new floating primitive: the two new doors are `ui/dialog`, the name step rides the existing entry
    shell, the mark is `ui/popover`.
- **Calls his to overrule on the alias**, one line each:
  - The name step is asked at the FIRST ADD, never at arrival (looking costs nothing; a name becomes a fact
    about the album only when something is put in it).
  - "A guest" for rows minted before the reshape (his own listed call, carried).
  - The mark carries its OWN door rather than a prop. The lightbox's credit sits three modules deep under
    `shared/masonry.tsx`, which this lane may not touch, so a threaded way out would simply not exist at the
    one place he expects a guest to want it ("want to correct that immediately by verifying").
  - "This is mine" reuses the lightbox's existing `canDelete` seam rather than a second prop meaning the
    same thing; a surface that passes none (the demo, a locked album) gets the stranger's wording.
  - The offer card's HEADING stays "Keep these photos" and the COUNT rides the sentence under it. The
    heading is quoted verbatim by a shipped help article, and the stable heading + counted sentence reads
    better than a heading that changes length with the number.
  - `DOOR_WEAR.gate` is NOT reworded: he ruled that sentence verbatim (`gate=ask`) and it already says
    "confirm your email". What moved is `save`, `like`, the entry modal's gate description and the teaser
    pill's fallback line.
  - The header's third state has NO sign-out row (there is no session to end, and clearing the token would
    orphan the photographs that device can still remove).
  - The Follow on a guest-list chip appears only for a signed-in viewer, on somebody else, with a handle,
    whom they do not already follow (one owner-scoped `getMyFollowing` read on the page).
  - The follow moment offers the HOST alone; the other guests carry their own Follow in the list below.
  - Two guests with one typed name are two chips (his own listed call, carried).
- **The help articles this lane makes stale** (a `help-sync` lane rewrites them):
  - `content/help/save-an-event-and-find-your-uploads.mdx` — the after-upload card now asks for a confirmed
    email rather than "a free account with the same email code", and its trigger reads "Confirm your email",
    not "Save". Its `<UiLabel>Keep these photos</UiLabel>` still matches, deliberately.
  - any article describing an uploader credit as "Anonymous", or the host switch as "allow anonymous
    uploads" (the `verified-email-host-copy` lane owns `content/help/` and is sweeping for the word).
- **Assets requested from Will**: none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Look at first** (and the one thing localhost cannot show):
  1. THE CAPTURE FLOW, on the alias, signed out, on a names-mode event: add a photograph, then the offer
     card ("Keep these photos", counting them) -> Confirm your email -> the follow moment with the host row
     and the handle line. **Not verifiable locally**: the R2 PUT from `localhost:3132` fails CORS, so the
     run ends on the failure sheet ("Network error during upload") and the offer card is never reached. The
     failure sheet itself rendered correctly with the server's own sentence and Retry.
  2. The name door at 375 and 1440 (the shell's two postures), and the header's third state after it.
  3. The credit's mark, once the server lane's `GridMedia.isVerified` is on the tree: until then every
     credit reads as verified by construction (the structural read treats `undefined` as verified, so a name
     is never marked on a guess).
- **Two seams wait on `verified-email-server`, and both are correct on either side of its merge** (both on
  the ROADMAP's Now list to collapse): `socialSeam` in `(guest)/e/[token]/page.tsx` (it reads
  `getEventGuestList`'s second argument and `getHostCard` through one narrow cast — before the merge the
  list is the profile cards alone and the follow moment shows no host row, both already handled downstream),
  and the `isVerified` / `require_verified_email` structural reads.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-21). Wave 1's guest lane wired the identity reshape's whole
guest side: the name door as a second, imperative step through the entry shell, asked at the first Add and
routed for all three Add affordances with the tap held; `lib/guest/join.ts` as the route's two calls, the
typed name stored beside the session as a label and never a capability; the credit reshaped around
`unverified-mark.tsx` (MineMark's material, the host's extra sentence, its own `save` door on your own
upload) with "Anonymous" gone and "A guest" left for legacy rows; the capture flow as the working version
(the offer card counting what landed, a marker that makes a magic-link round trip land the same beat, the
follow moment with the host and the handle line); the header's third state over a fifth door wear; and the
mid-run verification flip handled as a spent session rather than one refused file.
