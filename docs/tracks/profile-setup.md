---
track: profile-setup
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
