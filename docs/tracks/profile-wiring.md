---
track: profile-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b30445d9"          # the launch-prep SHA the branch was cut from
board: none             # a wiring round: profile-page r1's eight picks to production; the board stays for round two (profile-reach)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/u/
  - src/components/social/
  - src/components/guest/guest-header.tsx
  - src/components/guest/guest-upload.tsx
  - src/components/guest/guest-upload.test.tsx
  - src/components/guest/claim-handle-prompt.tsx
  - src/components/guest/claim-handle-prompt.test.tsx
  - src/app/(app)/account/
  - src/lib/db/mutations/social.ts
  - src/lib/db/queries/social.ts
  - src/lib/validation/profile.ts
  - src/lib/validation/profile.test.ts
  - src/lib/validation/report.ts
  - src/lib/constants/legal-terms.tsx
  - src/components/app/event-settings/profile-social-card.tsx
  - src/components/marketing/sections/features/guests/profiles-section.tsx
  - content/help/your-public-profile-following-and-blocking.mdx
  - content/help/profiles-guest-lists-and-following.mdx
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/event-feed/event-feed.tsx
  - src/app/api/reports/route.ts
  - src/app/admin/reports/
  - src/lib/db/queries/reports.ts
  - supabase/migrations/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/reviews/profile-page.json
  - docs/systems/profiles-social.md
  - docs/systems/database-security.md
  - src/components/guest/guest-bar.tsx
  - src/components/shared/not-found-screen.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/lib/validation/profanity.ts
  - src/lib/social/cards.ts
  - src/lib/social/public-profile-visibility.test.ts
  - src/lib/constants/tiers.ts
  - src/lib/db/types.ts
  - src/app/(dev)/design/sandbox/profile-page/spec.ts
  - src/app/(dev)/design/sandbox/profile-page/profile.tsx
  - src/app/(dev)/design/sandbox/profile-page/album.tsx
---

# lp/profile-wiring

**Goal.** Land Will's eight verdicts on `profile-page` r1 (his notes verbatim in `docs/design/rulings.md`, the fourth
batch) as production, judged on the alias: `exists=page` ("the full profile pages are the core of this"; the quick-look
mini version is round two's), `head=guest` (the album's own header; his worry about the way back is round two's),
`made-of=covers` with ONE group ("rather than a separate 'also at' section, maybe we could just have host/guest UI on each
event card to denote within a single group. Don't think we need the photographs gallery"), `identity=line` ("avatar
should be center aligned to the name/meta group... Should also have a few rules to prevent worst-case intent bios"),
`block=report` ("a more scalable pattern/menu"), `named=everyone` (his reasoning in rulings.md), `claim=after` ("Amazing
capture method without getting in the way of uploading photos") with the handle FREE by his answer in plan mode ("Free to
claim for everyone... We can keep custom event slugs as a pro feature, but handles for everyone incentivizes guests to
get deeper into our ecosystem"), `list=faces` ("the condensed version once we exceed a certain count, but let's add an
option to expand that into the full list. For bigger lists, we should continue to have pagination"); HOW View all opens
is round two's, so an interim ships here. NOT in this lane: the board `src/app/(dev)/design/sandbox/profile-page/` and its
registration lines (round two's, another lane); the quick-look; the way back; public counts on a profile (never).

**The doctrine binds** (`docs/systems/profiles-social.md`): a profile is public by existence; the follow graph is
owner-private and never counted in public; the attended arm passes three gates (`show_guest_list`, `profile_hidden_events`,
`visibility = 'open'`), pinned by `public-profile-visibility.test.ts` as a string guard on the migration text; attendance
is never a capability grant (no link to a party merely attended); the menu stays visible under a block; the guest list is
one read both surfaces call after their own gate, and `getEventGuestList`'s `null` (the host's key off) against `[]` (on,
empty) is load-bearing.

**The page** (`src/app/(guest)/u/[slug]/page.tsx`): on `GuestHeader` in a new event-less mode (no `qrToken`/`eventId`: the
logo home, the account menu when signed in, "Start for free" when not; the sign-out-by-token branch guarded); the
hand-rolled thin header goes. In the same path, two ROADMAP findings: `u/[slug]/not-found.tsx` on `GuestBar` +
`NotFoundScreen` (today the 404 falls through to the marketing chrome) and `u/[slug]/loading.tsx` (the RPC and two presign
rounds).

**The identity block**: the 375 squeeze fixed (the column `max-sm:basis-[calc(100%-6.25rem)]`, the actions `max-sm:w-full`,
the board's fix); the avatar aligned to the name/meta row with the bio rendered outside that row's centring, below it;
the bio: a new `profiles.bio` column (a migration file after `20260918120000_...`, `text`, a CHECK on length; written
through the service-role path like `setProfileSlug` or a column grant, your call stated; returned by `get_public_profile`,
whose migration the visibility test string-guards, so read that test before touching the function body); a `bioSchema`
beside `displayNameSchema` in `src/lib/validation/profile.ts` (trim, a cap around 160 characters, no URLs,
`containsProfanity` server-side in the account action as the display name has); the field in `/account`'s profile form;
`legal-terms.tsx` naming it beside the display name.

**One card grid**: hosted AND attended parties as `EventCard`s in one group, each with a host or guest marker (a new prop);
the "Also at" list goes; hosted cards link as today; attended cards carry no link and need covers: new query work in
`queries/social.ts` that presigns a cover by event id ONLY through the same three gates (`getPublicProfileCoverUrls` takes
hosted events only today and the attended arm returns no token). No count anywhere on the profile.

**The menu** (`components/social/profile-actions-menu.tsx`): one menu with Report this person and Block, the confirm copy
unchanged; the person report REAL and minimal (recommended, carried): a migration adding `reports.profile_id` (nullable)
with `event_id` relaxed to nullable under a CHECK that one of the two is set, the API route and `validation/report.ts`
accepting a profile report under the same rate limit, `/admin/reports` rendering a person row (the name, the handle link,
the reason): the operator's inbox is the health signal. If the admin branch proves outsized, ship Block only with the
row absent and say so under Questions.

**Everyone named**: the list already names every signed-in uploader; the promise moves: `profiles-section.tsx` takes the
board's replacement ("Claim a handle and you get a public page that carries your name from event to event. Skip it and
your name still appears on the albums you add photos to, with no page behind it."), and the two help articles with the
same promise say the same; `profiles-social.md` refined in place (the handle's gate line, the sentence).

**The claim, free**: the two Pro gates go (`mutations/social.ts`'s `tier === "free"` refusal, `account/page.tsx`'s
`slugLocked`) with the locked branch in `profile-slug-control.tsx` and every "Handles are part of Pro" line; custom EVENT
slugs stay Pro (`GATED_EVENT_SETTINGS` untouched). The after-upload line: a new `components/guest/claim-handle-prompt.tsx`
mounted in `guest-upload.tsx`'s `doneCount > 0` slot and sequenced with `SaveAccountPrompt` (signed out → save the account,
as today; signed in without a handle → "Your N photos are on this album under your name. Claim a handle and that name
becomes a page." with a Claim door to `/account`; signed in with a handle → nothing); `guest-upload.test.tsx` adjusted;
the plain-text "Claim your profile handle in Account settings" in `profile-social-card.tsx` becomes a link.

**The faces row** (`components/social/guest-list.tsx`, one component for both surfaces): above a threshold (more than
twelve uploaders, the board's `CAP`) a row of six faces, a `+N`, and "N guests added photos", the whole row one button; at
or under it the wrapping chips as today; the interim View all expands the chips in place, twenty-four at a time with
"Show more" (the list is already hydrated whole in the slot; nothing new crosses into `EventExperience`, which never
receives storage markers); the count leaves the callers' headings (`e/[token]/page.tsx`'s pill, `event-feed.tsx`'s count)
so it renders once. Round two's winner replaces the interim.

**Binds.** The bible; the doctrine above; `getUser()` in every Server Function and route handler (`database-security.md`);
the column-lock rule for host table writes; a migration is additive only, written here and APPLIED by the Orchestrator
(propose it in the Handoff; never `types.ts` by hand); `entry-modal`, `password-gate` and `guest-upload` pins guard
function; no em-dashes; the voice rulings for every new line; `component-notes.ts` `for:` lines for new files. Calls
that stay Will's, stated in the Handoff: the threshold at twelve; six faces; the in-place interim; the bio's cap and
rules; the marker's words (Host / Guest); the person report shipping now; the after-upload line's copy and its door.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8 known
  warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3133`; `DESIGN_PREVIEW_KEY` in the
  environment, never on a command line. New SQL: a rolled-back Supabase-MCP RPC check; `get_advisors` is the
  Orchestrator's after it applies.
- Tests, function never look (none exist for these surfaces): `// @contract-for:` tests for `guest-list.tsx` (the
  threshold, `null` against `[]`, the row a button, the in-place paging), `profile-actions-menu.tsx` (renders under a
  block; Report and Block both rows), `claim-handle-prompt.tsx` (the three states); `validation/profile.test.ts` for the
  bio; `guest-upload.test.tsx` adjusted; `public-profile-visibility.test.ts` green on the rewritten RPC.
- Locally at 1440 and 375 against the real Supabase with disposable data only: `/u/<a handle>` and a handle-less
  profile (the header, the grid with markers, the bio, the menu, the confirm), `/u/nope` under the guest bar, the guest
  album with the list on and off, the faces row above the threshold and the expansion, the after-upload line on a
  disposable event as a Free account without a handle, a person report landing in `/admin/reports`; the features
  sentence and the two articles. The Orchestrator repeats the list on the alias, signed in through Will's session.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **`u/[slug]/loading.tsx` was written and then DELETED, and the route must never get one.** A
  loading file wraps the whole route in Suspense, so Next flushes the shell before the page runs and
  `notFound()` can only swap the body: with it, a dead handle answered **200** (measured in dev AND
  against `next start`) while `/e/<bad token>` answered 404. Throwing from `generateMetadata` does
  not help (it resolves after the flush too). A public, indexable page that soft-404s teaches search
  engines that every dead handle is a real page. **Carried:** the page decides the 404 at the top and
  streams only the card grid behind an in-page `<Suspense>` with a skeleton at the cards' size, which
  is the half the wait was ever about. The ROADMAP finding is satisfied; the landmine is now a line
  in `profiles-social.md`.
- **The bio's write path is service-role, not a column grant** (the manifest left the call to me).
  A public free-text field that is client-writable is a PostgREST PATCH away from skipping the
  length, link and profanity checks, exactly as `display_name`'s write was locked down in
  20260608093939. The authenticated allowlist on `profiles` is untouched.
- **The person report SHIPPED; the admin branch was not outsized.** It is one nullable column, one
  route arm, one mutation and a People section on `/admin/reports` with its own small client list
  (the shared `ReportReviewList` is built around a presigned photograph and an event, neither of
  which a person report has, and it is not in this lane's owns). Block-only was the fallback and was
  not needed.
- **Three edits outside `owns`, each forced by a green gate, each minimal.**
  `src/lib/type-ladder-policy.test.ts`: the `u/[slug]` exception entry was DELETED (its two 11px
  labels became one, and both labels now size a child span, the form the policy's own note already
  blesses), so the tree carries one exception fewer.
  `src/app/(dev)/design/rules/component-notes.ts`: three `for:` lines, which the Binds require of new
  contract-carrying files. `docs/design/library.md` + `rules.generated.json`: regenerated by
  `pnpm design:rules`, a gate step.
- **`content/help/what-the-free-plan-includes.mdx` is now WRONG and is not in this lane** (it lists
  "a public profile handle" among the five things behind the paid badge). One line, a five-second
  fix, but another lane's file: Deferred below, and it should land before the alias pass so the help
  centre does not contradict the account page.
- **`src/lib/social/public-profile-visibility.test.ts` now guards a superseded body.** It parses the
  20260708120000 file's `get_public_profile`; migration 20260919120000 replaces that function. The
  same four assertions (every attended gate, no album capability, the hosted arm ungated) plus the
  bio key are re-asserted against the NEW file in `src/lib/validation/profile.test.ts`. It is in this
  lane's `reads`, so it was not edited: re-point or merge the two guards in the lane that owns it.
- **`src/lib/validation/report.test.ts` has no person-arm cases** for the same reason (the file is
  outside `owns`; only `report.ts` is in it). The schema's new refusals were exercised live instead
  (both subjects, neither subject, a cross-subject `media_id`, all 400).
- **The `profile-page` board's `list=wrap` option now draws the faces row**, because `album.tsx`
  imports the SHIPPED `GuestList` and its fixture cast is 24. Nothing is broken and the `list`
  decision is ruled, but `profile-reach` should know its round-two stage inherits the new shape.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/profiles-social.md`, refined in place, no appends:
  - "Surfaces" rewritten: one marked grid, the bio, the event-less `GuestHeader`, the account's bio.
  - the `profiles.slug` invariant: the Pro gate sentence REPLACED by "the handle is FREE for
    everyone", with the event slug named as the thing that stays Pro.
  - a new `profiles.bio` invariant beside it (same write class, the schema's four rules, the CHECK).
  - the one-guest-list-read invariant gains the threshold, the faces row and the callers' count rule.
  - two new invariants: the attended covers re-proving their three gates, and the person report
    (the column, the signed-in arm, the admin section, no reporter stored).
  - gotchas: the `loading.tsx` landmine (the 404 status), the after-upload claim's sequence and its
    door, and the marketing promise's three homes moving together.

## Deferred (ROADMAP one-liners, bucket named)

- Help content: `what-the-free-plan-includes.mdx` still sells the public profile handle as paid; drop
  it from the five paid things (the handle is free since 2026-09-19).
- Trust & safety: `/admin/reports` has no way to reach a reported person's ACCOUNT (suspend, clear a
  bio, remove a handle); the operator acts out of band today and only closes the report.
- Profiles: an attended card with no approved PHOTO (a guest who only added video) draws
  `EventCard`'s lock fallback, because `href: null` is what an unopenable card looks like. Honest,
  but a coverless attended card deserves its own empty face.

## Handoff (replaces the chat report)

- Head: this file's own commit on top of `eba8ee1a` (the last commit that touches code), pushed to
  `origin/lp/profile-wiring`; synced with `origin/launch-prep` at `304a813b` (merged, docs only, no
  conflicts). The gate below ran on `eba8ee1a`'s tree, which is that tree plus this paragraph.
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok (130 components, 826
  contracts, 18 policies) · specimen collector ok (131 specimens on 94 entries) · `pnpm typecheck` ok
  · `pnpm lint` ok (the 8 known warnings, 0 errors) · `pnpm test` ok (2603 passing, 246 files) ·
  `pnpm build` ok (254 pages) · `pnpm lab:smoke --base http://localhost:3133` ok (447 checks, 0
  failing). Port 3133 killed before each.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` is the owned paths, this file and
  `docs/systems/profiles-social.md`, plus the four exceptions named under Questions
  (`type-ladder-policy.test.ts`, `component-notes.ts`, and the two generated design-rules files).
- **The eight picks, one line each.**
  - `exists=page`: the full page stays the core; nothing here touches the quick-look (round two's).
  - `head=guest`: `/u/[slug]` runs the album's own `GuestHeader` in a new event-less mode (both props
    optional, the stored-session clear skipped, `/api/me/menu` called without an event); the
    hand-rolled thin header is gone, and a signed-in visitor keeps their account menu. A
    `not-found.tsx` on `GuestBar` + `NotFoundScreen` replaces the fall-through to marketing chrome.
  - `made-of=covers`: ONE grid. Hosted and attended cards together, newest first, each with a Host or
    Guest pill in `EventCard`'s top-right slot (no new prop on a card the dashboard shares); "Also at"
    is gone; attended cards carry no link and their covers presign only through the three gates,
    re-proved in `getPublicProfileAttendedCoverUrls`.
  - `identity=line`: the avatar centred on the name/meta row with the bio OUTSIDE it; the 375 squeeze
    fixed with `max-sm:` only; `profiles.bio` (160, one line, no links, profanity server-side) with
    its form beside the handle in the Public profile card.
  - `block=report`: one menu, Report this person above Block, the block confirm unchanged; a real
    report row, a signed-in route arm, a People section on `/admin/reports`.
  - `named=everyone`: the list is unchanged and the sentence moved, in all three homes (the features
    section and its mock, both help articles).
  - `claim=after`: the two Pro gates gone (the mutation's tier refusal, the account page's
    `slugLocked`) with every "paid feature" line; `ClaimHandlePrompt` owns the post-upload slot and
    renders one card by state; the event-settings line became a link.
  - `list=faces`: above twelve, six faces + `+N` + "N guests added photos", the whole row one button,
    expanding in place 24 at a time; both callers drop their heading count above the threshold.
- **The calls that stay his to overrule:** the threshold at twelve; six faces; the in-place expansion
  as the interim (round two replaces it); the bio at 160 with no links and one line; the marker's
  words (Host / Guest); the person report shipping now rather than Block-only; the after-upload copy
  ("Your N photos are on this album under your name. Claim a handle and that name becomes a page.")
  and its door to `/account#public-profile`. Three of mine on top: the claim card carries a quiet
  "Not now" (a per-event dismissal, so an upload never nags twice); the bio sits in the Public profile
  card rather than the Profile card above it; and `/u/[slug]` has NO `loading.tsx` (see Questions).
- Assets requested from Will: none.
- **Proposed migrations (WRITTEN, NOT APPLIED; the Orchestrator applies, runs `get_advisors` and
  regenerates `src/lib/db/types.ts`):**
  - `supabase/migrations/20260919120000_profile_bio.sql` adds `profiles.bio` + the
    `profiles_bio_len` CHECK (160) and REPLACES `get_public_profile` to return the bio, every gate
    reproduced verbatim. No grant changes; advisor delta none.
  - `supabase/migrations/20260919130000_person_reports.sql` adds `reports.profile_id` (nullable, FK
    to profiles, ON DELETE CASCADE), relaxes `event_id` to nullable under the `reports_subject_present`
    CHECK, and indexes the person arm. No grants, no policy; reports stays RLS-on / zero-policies.
    Advisor delta none.
  - Rolled-back check: both files were run as ONE transaction against the live project via the
    Supabase MCP and rolled back. All pass: the 161st bio character raises `check_violation`, `bio`
    has zero UPDATE grants to anon/authenticated, `get_public_profile` returns the `bio` key for a
    real handle, a report naming neither subject is refused, a person report inserts with no event,
    `create_report` still works, and `reports` is still RLS-on with zero policies.
  - Until they are applied: `profiles.bio` and `reports.profile_id` are read/written through the
    house pre-regen typing seam (`as unknown as SupabaseClient`, plus one structural read on the
    account page). Every one of those casts is commented and should be dropped with the regen.
- **What was verified locally, at 1440 and 375, and what was NOT.** RAN (captures in
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/profile-wiring/captures/`):
  `/u/willg` signed out (the guest header, the identity row, the Host-marked card, no horizontal
  overflow at 375 measured); `/u/nope` under the guest bar, answering a real 404 after the
  `loading.tsx` finding; the features sentence and both help articles rendered; the faces row drawn
  by the SHIPPED `GuestList` over 24 guests (the board's own frame imports it), 6 faces + `+18` +
  "24 guests added photos"; and the reports route red-teamed by hand (anonymous person report 401,
  both subjects 400, neither subject 400, a cross-subject `media_id` 400, the album arm still 404s a
  bogus token). NOT RUN, and why: everything behind sign-in cannot be driven on localhost (the
  allow-list), so the menu and its two dialogs, the follow button, the bio form, the account page,
  the after-upload claim card and `/admin/reports` were not exercised in a browser; the bio and the
  person report CANNOT work at all until the two migrations are applied; and no profile in the
  database has an attended event (the one cross-account guest row has no approved upload), so the
  Guest-marked card and a guest list past twelve have no real data behind them. I did not fabricate
  media rows to make them appear.
- Look at first: the Host/Guest pill on the cards (the words are his), and the faces row's sentence.
  Then, on the alias with the migrations applied: the bio on a long line at 375 (the avatar must stay
  level with the name), and a person report landing in `/admin/reports`.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). The eight verdicts on `profile-page` r1 landed as
production: the public profile moved onto the album's own header in a new event-less mode with a
guest-bar 404 beside it, hosted and attended parties became one grid of cards marked Host or Guest
with the attended covers presigned only through their three gates re-proved, the identity row gained
a capped moderated bio outside its centring, the menu gained Report this person over a real operator
queue, the handle went free for everyone and is now offered the moment an upload lands, the guest
list condensed to a faces row above twelve that pages in place, and the marketing promise moved to
match the product in all three of its homes. Two migrations were written, checked rolled back on the
live project, and left for the Orchestrator; a `loading.tsx` was written and deleted when it turned
a dead handle's 404 into a 200.
