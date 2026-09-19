---
track: profile-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/profiles-social.md`: the handle's gate (free for everyone, the event slug still Pro), the marketing sentence, the bio, the person report; list the lines here.

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The picks landed, one line each, and the calls his to overrule
- Assets requested from Will: none, or one per line
- Proposed migrations / Worker / Vercel / Stripe / env changes: the two migration files by name, what each adds, the rolled-back check's result
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
