---
track: verified-email-host-copy
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- The brief's `legal.ts:32` line reads "Terms 1.2 and Privacy 1.3", but the tree at the cut already had Privacy
  at 1.2 and Terms at 1.3 (the guest-self-delete round, 2026-09-20) — the literal numbers named are lower than
  or equal to what already shipped, which the file's own rule ("bump on any material change") never does.
  Recommended and taken: bump each by its next tenth from where it stood — Privacy 1.2 → 1.3 (matching the
  brief's number for Privacy exactly), Terms 1.3 → 1.4 (the brief's "1.2" read as the slot, not the target,
  since 1.2 is Terms' OWN two-rounds-ago version) — both with a dated comment line naming the identity reshape,
  on the file's established pattern. His to overrule if "1.2" for Terms was meant literally (which would mean
  rolling Terms' version backward, not currently supported by the file's model).

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/host-app.md`: the `events` model line now names `require_verified_email` (the identity
  reshape) beside the legacy `allow_anonymous_uploads`, and the "Require accounts to upload" toggle
  paragraph is rewritten whole for the renamed, non-inverted switch (no more accounts-required framing;
  OFF is a typed, unverified name, never anonymous), dropping the stale "dashboard event-detail access
  line" caller claim `guestExperienceSummary()` never actually had a second caller for.
- `docs/systems/profiles-social.md`: three facts refined — the "What it does" summary's guest-list line
  (every guest who added photos renders named now, not just signed-in ones); the escape-hatches sentence
  (uploading without signing in no longer keeps a guest off the list; turning the switch off trades a
  confirmed name for a marked one, never for no name); `getEventGuestList`'s own line (the `includeUnverified`
  option and what unions in, now that `verified-email-server` landed it).
- One line NOT changed, flagged rather than guessed: `profiles-social.md`'s `notification_prefs` paragraph
  ("an anonymous email-only guest receives nothing beyond the one-shot...") is ambiguous whether it means an
  event guest (which the reshape would affect: no OFF-mode guest has an email on file at all, so "email-only"
  cannot describe them) or a different one-shot email capture outside the join/upload flow. Left untouched;
  worth a look from whoever owns `notification_prefs` next.

## Deferred (ROADMAP one-liners, bucket named)

- ROADMAP → Now: `src/app/(dev)/design/(shell)/library/components/interactive-demos.tsx` still quotes the
  retired switch verbatim (`label="Require accounts to upload"`, `dialogTitle="Allow anonymous uploads?"`) in
  a Library demo of `ConfirmSwitch`; no wave-1 lane owns it, so it drifted from the real control this round's
  sweep would otherwise have caught. A one-line copy fix whenever a lane next touches that file.
- ROADMAP → Now: `docs/systems/database-security.md` and `docs/systems/uploads-and-r2.md` still describe the
  pre-reshape "anonymous guest" identity model (no lane owns either this round); both want a pass once the
  identity reshape's three production lanes are all on `launch-prep` to true them up to `require_verified_email`
  / the unverified-mark model.

## Handoff (replaces the chat report)

- Work commit `b371aac3` (the switch, marketing, blog, help, legal — 70 files); a second commit `a93f2421`
  (post-merge integration fixes, below); pushed. Synced with launch-prep at `3d489efa` (the final merge
  commit on this branch, HEAD; never quoted here as this lane's own — see the closing chat line for it).
  **Unusual sync path, stated plainly**: `origin/launch-prep` moved twice while this lane ran (other
  tracks' records, then `verified-email-lab`'s), and rather than wait idle on the two production lanes
  this lane reads (`src/lib/db/queries/social.ts` server-owned, `src/components/social/guest-list.tsx`
  guest-owned), this lane merged `origin/lp/verified-email-server` and `origin/lp/verified-email-guest`
  directly the moment each hit "handed off" — both well ahead of the Orchestrator's own merge into
  `launch-prep` at the time. That surfaced and fixed two real integration bugs (below) before they could
  reach `launch-prep` at all. Once the Orchestrator's own merges of both landed on `launch-prep`, this lane
  did one more ordinary sync (`3d489efa`) to converge on the exact same tree; it carried a single real
  conflict (`src/app/(guest)/e/[token]/page.tsx`, both sides having independently written the identical
  one-line fix to the same dead branch — resolved by keeping the code line and the shorter of the two
  comments, `origin/launch-prep`'s own).
- Every claim below names its artifact so the Orchestrator checks rather than believes.
- **Gates, run clean on the fully-synced tree** (`3d489efa`), each its own exit code: `pnpm design:rules` 0
  (no diff in `rules.generated.json` / `docs/design/library.md`) · specimen collector 0 (no diff) ·
  `pnpm typecheck` 0 · `pnpm lint` 0 (12 warnings, saved in this lane's scratch as `lint-final.log`; the
  2026-09-21 baseline was 10, the number moved as the manifest says it will, none in a file this lane
  touched) · `pnpm test` 0 (323 files, 3401 passed / 1 skipped) · `pnpm build` 0 (255 pages,
  `ƒ /help/require-verified-emails-explained`'s sibling static path among them) · `pnpm lab:smoke --base
  http://localhost:3133` 0 (413 checks, 0 failing). Port 3133 killed before this lane's build, its test runs
  and this handoff. No board this round (`board: none`), so no `lab:demo`.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` (on the synced tree, `3d489efa`) = 71
  files. 68 are this lane's own `owns` paths (including the delete + rename that retired
  `content/help/require-accounts-to-upload-explained.mdx` in favor of the new slug). **Three exceptions,
  each a single, documented reason:**
  - `next.config.ts` — the one sanctioned spread line (this lane's manifest names it directly): imports
    `HELP_REDIRECTS` and adds its `/help/<old> → /help/<new>` 308, on the exact shape `BLOG_REDIRECTS`
    already used there.
  - `src/lib/content/help.test.ts` — not literally in this lane's `owns`, but the natural home for
    `help-redirects.ts`'s retired-slug test (the `blog.test.ts` "retired slugs" `describe` block, mirrored
    exactly): no lane owns `help.test.ts` by name this round, and a new redirect module without a test on it
    would be the actual lane-rule violation.
  - `src/app/(guest)/e/[token]/page.tsx` — `verified-email-guest`'s file, one line, applied only after
    syncing past that lane's own merge (both the direct branch merge and, later, the real `launch-prep`
    merge). Detail directly below.
- **Two integration bugs found and fixed, neither this lane's own code, both caught only by merging
  `verified-email-server` and `verified-email-guest` together early**:
  - `uploads-section.tsx`'s `ConfirmSwitch.checked` (this lane's own file) took `field.value` directly once
    the inversion was dropped, and `require_verified_email` types as `boolean | undefined` on the RHF INPUT
    generic (`updateEventSchema.partial()`); the old inverted read (`!field.value`) had coincidentally always
    normalized it to a strict boolean, so removing the inversion (per the brief) exposed a real gap `tsc`
    caught. Fixed with `?? true`, matching the schema default and the pattern already used for `useWatch`
    just above it in the same file (commit `a93f2421`).
  - `src/app/(guest)/e/[token]/page.tsx` carried a dual-path shim (read `require_verified_email` if present,
    else fall back to `!allow_anonymous_uploads`) written by `verified-email-guest` before it could see
    `verified-email-server`'s landed `GuestEvent` type, which guarantees `require_verified_email` unconditionally.
    Once both were merged together the fallback branch became unreachable and `tsc` refused it (`Property
    'allow_anonymous_uploads' does not exist on type 'never'`) — a bug neither lane could have caught alone,
    since each was green against its own understanding of the shared type. Fixed to a direct
    `event.require_verified_email` read (commit `a93f2421`); the Orchestrator's own later merge of both lanes
    hit the identical gap and wrote the identical one-line fix independently, which is exactly the conflict
    `3d489efa` resolved (both sides correct, kept the shorter comment).
  - Also fixed in `a93f2421`, found only once `pnpm test` ran against the real `content/help/` collection
    loader post-merge: four `content/help/*.mdx` `description` frontmatter fields (mine, written to explain
    the new behavior fully) ran past `HELP_DESCRIPTION_MAX` (200; `help.ts:178`) — `profiles-guest-lists-and-following.mdx`,
    `reporting-and-safety.mdx`, `require-verified-emails-explained.mdx`, `what-guests-can-and-cant-see.mdx`.
    Trimmed under the limit without losing the "confirmed or marked" framing; re-verified with a precise
    `gray-matter` length check across every `content/help/*.mdx`, not just these four.
- **`guests/page.tsx`'s own wiring** (this lane's file): calls the now-landed `getEventGuestList(event.id, {
  includeUnverified: true })`, splits the union with `verified-email-server`'s `splitGuestList` before
  hydrating only the profile-card half through `withAvatarUrls` (an unverified entry has no avatar to
  resolve), recombines in the query's own cards-then-unverified order, and passes the result as
  `verified-email-guest`'s own `GuestListItem` type. Visually confirmed on the synced tree via the browser
  pane (`/features/guests` and `/features/privacy` at 1440 and 375; not saved to scratch, browser-pane-native
  only, so read as observed-not-artifacted): the wall's "Theo" chip and the guest-list-card mock both carry
  the small unverified-mark dot; the renamed help article resolves at its new slug and renders its full ToC;
  the old slug 308s to it (`curl`-verified, an actual artifact: `Status: 308`, `Redirect URL:
  http://localhost:3133/help/require-verified-emails-explained`).
  The real, auth-gated Guests room and Settings sheet are unverified locally (no session in this pane) and
  are the Orchestrator's to red-team on the alias, per the standing protocol.
- **The items, one line each** (no board this round — the goal was one verdict and a note, wired directly;
  see the manifest's Goal): the switch (renamed, non-inverted, both copy states written), the eight
  `guestExperienceSummary` sentences, the Guests room (opted into the unverified union), the guest-list
  settings copy (verbatim per the brief), the reel's bucket rename, fourteen marketing surfaces under
  `sections/` (the two feature pages' "Anonymous" fixtures → a named, marked guest "Theo", carried
  consistently across four components on two pages), `marketing-voice.ts`'s new rule, ten blog posts + both
  `AUTHORING.md` guides, seventeen help articles (one renamed and rewritten whole, sixteen reworded) + a new
  redirect module + its test, two legal documents (each a dated version bump + three reworded passages),
  `PRD.md` and `PRICING.md`.
- **Calls his to overrule, one line each:**
  - The switch's exact copy throughout (label "Require verified emails"; the description's two sentences;
    the confirm dialog's title, description, and both button labels) — brief-directed in shape, not in exact
    wording.
  - The version-number question in "Questions" above (Terms → 1.4 vs. a literal reading of "Terms 1.2").
  - `require-accounts-to-upload-explained.mdx`'s new slug, `require-verified-emails-explained` (unnamed in
    the brief beyond "renamed").
  - "Theo" as the one recurring named example of an unverified guest, reused across `attribution-hero.tsx`,
    `attribution-stage.tsx`, `album-fill-fixtures.ts` and `guest-list-section.tsx` on two feature pages, rather
    than a different name on each.
  - The visual mark itself on marketing surfaces (a `size-1.5 bg-warning` dot beside the name, with a
    `title`/`aria-label` explanation) — designed to echo the sandbox's ruled "same small dot the avatar
    wears" pattern (`sandbox/guest-verify/unproven.tsx`, read for reference, never imported), since no
    shipped product component for the mark existed in this lane's own tree at write time.
  - `getEventGuestList`'s union rejoin order in `guests/page.tsx` (hydrated cards, then unverified entries) —
    matches the query's own documented order, but the visual grouping (cards before unverified, never
    interleaved) is this lane's read of "listed, with the mark," not an explicit brief line.
- **The help articles this lane makes stale: none outstanding.** This lane owns `content/help/` outright this
  round and rewrote every article its own sweep found stale (seventeen, listed above) in the same pass, rather
  than flagging them for a follow-up `help-sync` lane.
- **THE SWEEP** (`git grep -in anonymous` across `src/`, `content/`, `docs/`, run fresh on the synced tree,
  `3d489efa`; full output saved in this lane's scratch as `anonymous-post-merge.txt`, 323 lines across 120
  files): every hit under this lane's `owns` is accounted for above (rewritten, or — three cases — verified
  as a different sense and deliberately left: `src/lib/reel/engine/assets.ts`'s `img.crossOrigin = "anonymous"`
  is the DOM `HTMLImageElement` CORS attribute, a Web-platform literal, not product vocabulary; `docs/PRD.md`'s
  and `content/help/report-a-problem-as-a-guest.mdx` + `reporting-and-safety.mdx`'s "reports are anonymous"
  lines describe who FILES a report, untouched per the brief). Every remaining hit outside this lane's `owns`,
  by fate:
  - **Another lane's, named** — the great majority. `verified-email-server`'s own surface (`uploader-identity.ts`
    + test, `gallery-access.ts` + test, `grid-items.ts`, `db/queries/*`, `db/mutations/*`, `social.ts`, `event.ts`
    + test, `upload.ts` + test) and `verified-email-guest`'s own (`anonymous-info.tsx` — modified, not deleted,
    their own call; `unverified-mark.tsx`, `guest-list.tsx` + test, `media-lightbox.tsx` + test, `event-experience.tsx`,
    `live-gallery.tsx`, `guest-header.tsx`, `enter-event-prompt.tsx`, `claim-uploads.ts`, `account-door.tsx`,
    `e/[token]/*`, `u/[slug]/*`) are both now visible in this tree only because this lane merged them early to
    verify its own contract against real code; their own word choices are each lane's own call, already
    accounted for in their own Handoffs, and this lane did not re-sweep them.
  - **Another sense, left** — `src/lib/auth/admin-context.ts` + `src/lib/surface/index.ts` (`status: "anonymous"`,
    the admin portal's own signed-out gate, unrelated to guest identity); `src/components/marketing/chrome/session-hint.tsx`
    (a signed-out web visitor, the same sense `checkout-button.tsx`'s comment used before this lane's edit);
    `src/lib/shared/sampled-palette.ts` (a second `crossOrigin="anonymous"` DOM reference, same as
    `engine/assets.ts`); `docs/systems/profiles-social.md`'s own remaining "anonymous strangers"/"viewer may
    be anonymous" lines (an unauthenticated web visitor reading a public page) and "anonymous enumeration
    surface" (an abuse-prevention term, unauthenticated API probing) — both pre-existing senses this lane's
    own edits left alone by design.
  - **No wave-1 owner this round, flagged rather than fixed** — moved to Deferred above:
    `interactive-demos.tsx`'s stale `ConfirmSwitch` Library demo; `docs/systems/database-security.md` and
    `uploads-and-r2.md` (both still describe the pre-reshape model; neither is in any wave-1 lane's `owns`);
    a handful of sandbox fixtures (`sandbox/gallery-fixtures.ts`, `sandbox/media-viewer/fixtures.ts`,
    `library/patterns/gallery-demos.tsx`) outside `verified-email-lab`'s three-file `owns` this round.
  - **Record docs and generated files, untouched on purpose**: `docs/CHANGELOG.md`, `ROADMAP.md`, `STATUS.md`,
    `docs/design/rulings.md`, `docs/SYSTEMS.md`, `docs/tracks/orchestrator.md` (record docs, forbidden to this
    lane); `src/lib/db/types.ts`, `rules.generated.json`, `specimens.generated.json` (generated, never
    hand-edited).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Look at first**: `src/components/app/event-settings/uploads-section.tsx` (the switch itself, the shape
  every other surface's copy describes), then `content/help/require-verified-emails-explained.mdx` (the
  full rewrite, whole-article), then this Handoff's "Two integration bugs" note above before touching
  `src/app/(guest)/e/[token]/page.tsx` again — it is already converged with `launch-prep`'s own fix.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Wave 1's host-copy lane wired the identity reshape's whole
sentence: the settings switch renamed to Require verified emails with no inversion, `guestExperienceSummary`'s
eight sentences retold, the Guests room opted into the unverified union, the guest-list copy set verbatim,
the reel's bucket renamed. Marketing's "Anonymous" fixtures became a named, marked guest across two feature
pages; ten blog posts and one help article renamed and rewritten whole (sixteen more reworded) carried the
same sentence to readers; two legal documents gained a dated version and three reworded passages. Merged
`verified-email-server` and `verified-email-guest` in early (both had handed off) to verify against real
code rather than the plan alone, which found and fixed two real cross-lane integration bugs before either
reached `launch-prep`. The sweep accounted for every remaining "anonymous" outside this lane's own surface,
by lane, by sense, or flagged for a future pass. Gate green throughout (typecheck, lint, 3401 tests, a
255-page build, `lab:smoke` 413/0).
