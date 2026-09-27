---
track: profile-setup
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/account/
  - src/components/social/
  - src/app/(guest)/u/
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/dashboard/
  - src/lib/db/queries/profile
  - src/lib/db/queries/social
  - src/lib/db/mutations/profile
  - src/lib/db/mutations/social
  - supabase/migrations/
  - src/app/(dev)/design/sandbox/identity-profile/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-profile.json
  - docs/reviews/identity-claims.json
  - docs/systems/database-security.md
  - docs/systems/auth-accounts.md
  - docs/systems/host-app.md
  - src/app/(dev)/design/sandbox/profile-page/spec.ts
---

# lp/profile-setup

**Goal.** A person sets up their page on purpose: `identity-profile` r1's five answers built (a three-screen setup wizard with a one-time show-all choice, the cover picker, events hidden until chosen, an invitation after the first claim, a quiet count on a private page), plus `identity-claims`' `after=profile` (the finish toast points to the page); then the identity-profile board retires.

## The brief

**The answers** (`docs/reviews/identity-profile.json`). Every option is drawn on `src/app/(dev)/design/sandbox/identity-profile/`, which is the spec, and all five confirm the board's recommendations.

- **`setup=wizard`:** three screens (handle; then name and photo; then which events show), one at a time, the way the event wizard (`/dashboard/new`) works. His note: "Their first profile setup should be a guided wizard to provide all helpful context. Then, follow-up edits can feel more like account settings for quick direct edits." So the wizard is for the first time. Account's cards stay the place for later direct edits (`src/app/(app)/account/page.tsx`: "Profile" :347-370, "Public profile" `#public-profile` :375-401). The wizard lives under `/account`; name its route early and announce it in the Handoff, so `guest-door` can point the album's "Claim a handle" row at it.
- **`attended=picker`:** choosing which events show is visual: tap an event's own cover to show it, and the chosen ones lift off the grid. Build it for the wizard's events step and in Account, replacing the switch list (`src/components/social/attended-events-visibility.tsx`), so there is one way to choose. That is a call his to overrule.
- **`default=off`:** a newly attended event starts hidden, every time. His note: "maybe there's a clean way to allow users to make a one-time selection (maybe within the profile setup wizard) to select and show all/hide all initially, then direct handling of events under profile from there." So the wizard's events step opens with a one-time choice (show all, hide all, or choose), applied once to the events she has then. Later events still start hidden.
- **`prompt=claim`:** once she finishes claiming events from the dashboard, a card invites her to set up her page next (near the claims card, `src/app/(app)/dashboard/page.tsx:472`). It is gone once the page is set up or she dismisses it.
- **`page=count`:** a claimed page with nothing shown says so quietly. His note: "This design should be simplified into a more '2 private events' tone. Doesn't need to do a ton of explaining, similar to option 1. However, it helps differentiate an active private user from a no-events private user with no public events."
  - **The count's rule (the board's):** only what this viewer could ever confirm counts, so a gated event (an upload-to-view door) stays out of it.
  - **Today:** `/u/[slug]` says "No events here yet" (`src/app/(guest)/u/[slug]/page.tsx:330-335`), and `get_public_profile` (last defined in `supabase/migrations/20260923150000_identity_contract.sql:147`) returns no private count.
  - **Build it server-side** under the same rule the page's events obey, never leaking a number that viewer could not confirm. If it needs SQL, write the migration: the Orchestrator applies it through the Supabase MCP after a rolled-back check. Revoke `anon` EXECUTE explicitly unless an anonymous viewer must call it (`database-security.md`). Test the scoping with a second viewer and anonymously.
- **`identity-claims` r1 `after=profile`** (confirmed): the finish toast (`src/components/app/dashboard/claims-card.tsx:141-147`) gains a second line, "Choose what shows on your page", linking to the setup, or to the page's choices once it is set up. The rest of the claims flow is `identity-claims` r2's question, being drawn now: touch only the toast.

**Writes** go through the existing paths: `profile_shown_events`' owner-only writes (`src/lib/db/mutations/social.ts`), and the handle through the slug control's action.

**`profile-page`'s open questions** (`src/app/(dev)/design/sandbox/profile-page/spec.ts`) sit on the same page: build nothing they ask. If the empty page's count reaches one of them, say so in the Handoff.

**Then retire `identity-profile`** in your branch, in one commit: its folder, and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (your named exceptions; the album-columns retirement `95c8aa56` is the template). The Orchestrator deletes its ledger.

**Verify:**
- everything that runs without a sign-in, locally first; the signed-in wizard is allow-listed, so the Orchestrator's red-team walks it live as willg97;
- the wizard at 375 and 1440;
- the count from a second viewer and anonymously;
- the claims finish toast.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

- **The legal pages need one clause for the count (not this lane's files; a one-way door's wording).** The Terms
  ("Profiles and social features") and the Privacy Policy both say nothing you attend appears on your profile until
  you turn it on (`src/lib/constants/legal-terms.tsx:422`, `legal-privacy.tsx:311`). "2 private events" is a number of
  exactly those events, though only of the ones the visitor could already see her on through their hosts' guest lists.
  Recommended: add to both, "A profile with nothing on it may say how many events it keeps private, counting only
  events whose guest lists the visitor can already see." Before partyreel.com carries the count; nobody reads it until
  then.

- **The wizard's route is `/account/profile`** (named at boot, for `guest-door`'s "Claim a handle" row). Once a page
  exists it redirects to `/account#public-profile`: the wizard is the first time, Account holds the later edits.
- **"Set up" means a claimed handle.** Finish writes her event choices first and claims the handle last, so an
  abandoned or failed setup never leaves a public page half-chosen; the name and photo on screen two save as her
  account's own (they credit her wherever she uploads, not only on the page).
- **Account's Public profile card, before a handle exists, is the wizard's door** (one line and Set up your page); the
  handle, bio and picker appear once the page does. Every door already aimed at `#public-profile` (the user menu, event
  settings, the guest prompts) reaches the wizard through it, with none of their files touched.
- **The invitation reaches every confirmed guest with an event her page could show and no handle, once no claim is
  waiting**: it appears the moment a claim's Finish settles, and also for a guest who never had anything to claim (a
  Require verified emails party, the default, makes no claim). Claimers only would need a stamp at Finish inside the
  claims flow `identity-claims` r2 is redrawing.
- **Not now dismisses the invitation on this device** (an httpOnly cookie, the events view's precedent): no schema.
  Every device at once would be a `profiles` column.
- **The empty page reads "2 private events"**, one quiet line with no icon and no explanation; a page with none reads
  "No events here yet", now also one quiet line. The count is the guest arm's (a hosted event its host kept off the
  page is nothing a visitor could confirm from here), and the RPC returns it only while the page shows nothing, so the
  anonymous read discloses no more than the page it backs.
- **A picker tile follows its album's masking, as the dashboard's Guest cards do**: an open album shows its cover, a
  password album its name with no cover, a private album neither ("Private event").
- **The claims toast's pointer rides a Finish that added photos**; "Done. Nothing was added to your account." gets none.
- **Finish lands on her page** (`/u/<handle>`), so the flow returns somewhere useful.
- **The wizard's events step is the guest arm**: events she hosts keep their per-event switch in the event's settings.
- **The bio stays out of the wizard** (screen two is name and photo, as drawn); Account shows it once the page exists.

## System-doc edits (in place, owned facts only)

- `docs/systems/profiles-social.md`: the consent model's opt-in bullet (no EVENT until chosen, and the empty page's
  count scoped to the host's key; the cover picker is the one control; the wizard's one-time choice applies to the
  events she has at Finish); `getMyAttendedEvents` (the picker's events, masked
  through `guestEventCardProps`); the public profile (the empty page's count, its rule and its disclosure); handles
  (the setup at `/account/profile`, "set up" = a claimed handle, the order at Finish, the invitation and Not now).
- `docs/systems/host-app.md`: the claim ticket (the finish toast's second line; the invitation in the ticket's place).

## Deferred (ROADMAP one-liners, bucket named)

- Profile: the line on a handle-less account's owner mode (likes and connections unreachable without a handle) narrows
  rather than closes: the setup at `/account/profile` and the dashboard's invitation put a page one guided step away,
  but an account that declines one still reaches neither.

## Handoff (replaces the chat report)

- **Commits, pushed:** `62ee18cd` (these Questions, the route named at boot), `8e6bf232` (the work), `5c0f94ae` (the
  board retired, one commit), `756e4af3` (one consent-model line in profiles-social.md, docs only), and this manifest. **No sync commit:** launch-prep moved to `96f46a3f` (mine-none merged
  at `89095cff`, then records), which touches nothing in this lane's reads, and a trial `git merge --no-commit
  origin/launch-prep` auto-resolved cleanly (the three lab registry files included), then was aborted.
- **Gates on `5c0f94ae`, each on its own exit code** (logs: `/Users/gibby/local/ai/partyreel-wt/_scratch/profile-setup/gate*.log`,
  summary `gate.log`): `pnpm typecheck` 0; `pnpm lint` 0 (0 errors, 6 warnings, none in a touched file); `pnpm test` 0
  (491 files, 5,531 tests); `zsh scripts/build-lock.sh pnpm build` 0 (`/account/profile` in the route table);
  `pnpm lab:smoke --base http://localhost:3133` 0 (255 checks, 0 failing); `pnpm test` again on `756e4af3` (the doc
  line alone after the gate) 0, 5,531 tests (`gate-test-final.log`). `/design/lab/identity-profile` answers 404;
  the desk's remaining mentions are this track's own goal and other boards' prose.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path is under `owns`, this file, or a system
  doc listed above, except the retirement's three named exceptions, `src/app/(dev)/design/sandbox/registry.ts`,
  `src/app/(dev)/design/(shell)/lab/boards.ts` and `src/app/(dev)/design/touchpoints.ts` (the brief's own).
- **The route, for `guest-door`:** the setup is `/account/profile` (`PROFILE_SETUP_PATH`,
  `src/app/(app)/account/profile/invite.ts`); a set-up account is sent to `/account#public-profile`, so the album's
  "Claim a handle" row can point at it unconditionally.
- **Items:**
  - `setup=wizard`: `src/components/social/profile-setup-wizard.tsx` on `src/app/(app)/account/profile/page.tsx`;
    Finish is `finishProfileSetupAction` (choices, then the handle through `setProfileSlugAction`); the first screen
    opens on her display name as a free handle (`handle-suggestion.ts` over `slugify`, `firstFreeHandle`).
  - `attended=picker`: `AttendedEventTiles` / `AttendedEventsVisibility` (`src/components/social/attended-events-visibility.tsx`)
    in Account and on screen three; tiles from `getMyAttendedEventPicks`. The handle field is one piece for both
    places (`src/components/social/handle-field.tsx`, lifted out of `profile-slug-control.tsx`).
  - `default=off`: Show all / Keep all private on screen three, sent as a mode and applied server-side to the events
    she has at Finish (`applyShownEvents`, owner-RLS, chunked, `on conflict do nothing`).
  - `prompt=claim`: `PageInviteCard` in the claim ticket's place on `/dashboard`, decided by `shouldInviteToPage`;
    Not now is `dismissPageInviteAction` (httpOnly `pr_page_invite`, the account's seed).
  - `page=count`: `emptyPageLine` on `/u/[slug]`; `supabase/migrations/20260927100000_profile_private_count.sql`;
    `src/lib/db/queries/profile.private-count.test.ts` holds the count's predicate to the attended arm's.
  - `identity-claims` `after=profile`: the finish toast's second line (`claims-card.tsx`, prop `pageHref` from
    `pageChoicesHref`); only the toast was touched.
  - `identity-profile` retired (`5c0f94ae`); the ledger `docs/reviews/identity-profile.json` is yours to delete.
- **Proofs on the live schema, every one rolled back** (function md5 `4d0686c3...` unchanged after each):
  `_scratch/profile-setup/proof-result.json` (ten steps: anon 0 behind the upload door, the event's host 1, the owner
  1, a signed-in stranger 0, both doors open 2, a password album leaves it, withheld as null once a line or a hosted
  card shows, an unclaimed handle null, the grants); the migration's own foot check, dry-run: held; owner-RLS for the
  batch write: `insert ... on conflict do nothing` as `authenticated` is idempotent, another user's row refused 42501.
- **Captures** (the real components with fixture props, in an uncommitted harness, since the route needs a session):
  `_scratch/profile-setup/cdp/harness-375-light.png`, `harness-375-dark.png`, `harness-1440-light.png` (375 over
  device emulation: `scrollWidth` 375 of 375).
- Assets requested from Will: none.
- **Board ideas:**
  - A chosen event that can never appear (its host keeps the guest list off, or the album is not open) is chosen
    silently; the picker could say so on the tile.
  - The user menu's handle-less "Your profile" and event settings' "Claim your handle to publish the page" could open
    `/account/profile` directly (each reaches it through Account's door, one tap more).
  - The invitation's button repeats its title ("Set up your page", as drawn); it could carry the reason instead.
- **Proposed migrations:** `20260927100000_profile_private_count.sql`: apply any time (a key added, none removed; this
  build reads a missing key as no count, partyreel.com's ignores it); its header holds the protocol; expected advisor
  delta none; the types should not change (same signature, `Json`). Worker / Vercel / Stripe / env: none.
- **Calls his to overrule:** the Questions above, each built as answered; and the owner of an empty page gets "Choose
  what shows" under the count (one tap to her picker); the first screen arrives with her name as a free handle; a
  tile says its name and state, not its date (as drawn); an empty page's line drops production's explanation too.
- **Look at first:**
  - The first Question: the Terms and the Privacy Policy say nothing you attend appears on a profile until chosen, and
    the count is an aggregate of those events; their clause should land before partyreel.com carries it.
  - Apply the migration before the live walk: until it lands, every empty page says "No events here yet".
  - Walk the wizard as partyr33l@gmail.com (no handle, one attended event, so its dashboard shows the invitation) or
    hi@willgibs.com; willg97 holds `willg`, so `/account/profile` sends him to Account.
  - The count, live, once hi@willgibs.com's page exists with nothing shown: anonymously "No events here yet",
    willg97 (the host of "Gallery width (disposable)") "1 private event", partyr33l "No events here yet" (that album
    requires an upload to view).
  - The claims toast needs a claimable row (an address typed at a names-mode door before it was confirmed).
