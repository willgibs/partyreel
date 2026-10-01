---
track: crumbs-33
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "65dbedb2"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/admin/reports/
  - src/lib/db/queries/reports.ts
  - src/lib/db/queries/reports.test.ts
  - src/lib/reports/migration.test.ts
  - src/lib/db/mutations/account.ts
  - src/lib/db/mutations/account.test.ts
  - src/lib/utils.ts
  - src/lib/utils.test.ts
  - src/app/(guest)/u/[slug]/page.tsx
  - src/lib/shared/album-rows.ts
  - src/lib/shared/album-rows.test.ts
  - src/lib/album/links.ts
  - src/lib/album/links.test.ts
  - src/components/ui/tooltip.tsx
  - src/components/ui/tooltip.test.tsx
  - src/components/shared/media-lightbox.tsx
  - src/components/admin/report-queue.tsx
  - src/components/admin/report-queue.test.tsx
  - src/lib/admin/reports.ts
  - src/lib/admin/reports.test.ts
  - src/lib/db/migration-guards.test.ts
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
  - supabase/migrations/20261001100000_report_strikes_one_home.sql
  - supabase/migrations/20261001110000_newsletter_follows_the_address.sql
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - docs/systems/trust-safety-forensics.md
  - docs/systems/database-security.md
  - docs/systems/auth-accounts.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
---

# lp/crumbs-33

**Goal.** Six ROADMAP items: a child-abuse report's line telling the operator its address's live strikes, the newsletter row following an email change, one pinned date formatter, the rows engine's ties settled the same in every engine, the viewer's link asks coalesced over a burst, and a tooltip-wrapped control that takes a touch tap on Android.

## The brief

Six items the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **The strikes on the queue** (from `hide-strikes`; Will's call B, 2026-09-30: three strikes that lapse 180 days after each dismissal, "I don't want to prevent a well-meaning reporter from a second report if I simply disagree with the first"). "Nothing in the portal shows a strike", so the operator cannot know when a Dismiss is an address's third and takes its instant hide away for 180 days.
  - A child-abuse report's line, and its sheet, say how many live strikes its address holds and what a Dismiss would make of it. The address itself is never shown: the count rides `reports.reporter_hash`.
  - The rule has one home. `create_report` holds it today (`c_strikes`, `c_strike_lapse` in `supabase/migrations/20260930120000_hide_strikes.sql`), and the portal's count must be the same rule, never a copy that can drift. A SQL function both read is one shape; a parity test is another.
  - Adding a confirm to the operator's Dismiss is a product question (a Question with your recommendation), not a default.
- **The newsletter row and an email change** (from `identity-email`): "an email change leaves `newsletter_signups` on the old address, so the `/account` marketing switch reads the new one and turning it off cannot remove the old row". The switch must remove what it reads, before any newsletter sender ships. Move the row with the change, or key the switch on the account: your call, recommended in a Question.
- **One pinned date formatter** (from `hardening`): `formatEventDate` (`src/lib/utils.ts`), the claim card's `formatUploadTimestamp` and the profile's joined date render in the runtime's locale, the SSR and hydration drift `formatCount` closed for counts. ★ The desk's boards import `formatEventDate` (`event-ready`'s `hub.tsx` and `readiness.ts`, `locked-door`'s `fixtures.ts` and `furniture.tsx`): its en-US output stays byte for byte what it is today.
- **The rows engine's near-ties** (from `album-guest-wiring`): it "settles near-ties on the last bit of `Math.log` and `**`, which Node and a browser round differently (5 to 10% of inputs)". Make `layoutRows`' cost comparisons tie-robust in `src/lib/shared/album-rows.ts`. The served first paint still hydrates without a re-lay.
- **The viewer's link asks** (from `album-guest-wiring`): "a held arrow key walking the 1,145-photo probe made 1,092 asks and a photograph 100 steps on waited 1 to 6 s for its link". Coalesce a burst's asks (`src/lib/album/links.ts` batches per tick only). Measure before and after on localhost: the probe is the Scale probe album.
- **A tooltip's touch tap on Android** (design system): "`ui/tooltip`'s arrow at `sideOffset` 0 plus radix's open-on-focus loses a touch tap on any tooltip-wrapped control on Android Chrome". The shared fix belongs to `ui/tooltip` or `ActionTooltip`; the viewer's own guard can then go, if it becomes redundant.

**SQL:** a change the database needs is a migration file in `supabase/migrations/` with its rolled-back proof at its foot, red first on today's schema (`database-security.md`, Workflow). Never applied by you: the Orchestrator applies it by protocol and regenerates the types. A file that replaces a function starts from its newest definition. Grants: `anon` and `authenticated` get nothing by default.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The portal and the account's email change cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door`, `event-ready` and `disposable-mode` describe the door, the hub and the guest page. Change no word or behaviour their asks describe. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. `crumbs-34` runs beside you on help, marketing and Sentry's init (`content/help/`, `src/components/marketing/`, `src/lib/constants/events.ts`, `src/lib/constants/marketing-nav.ts`, `src/lib/glass.ts`, `src/lib/observability/sentry.ts`): don't touch them.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

1. **Should the operator's Dismiss ask a confirm when it is an address's third strike?** Recommended and built: **no
   confirm**. The line says it before the press, on the card and in the report whole, and marks the one press that
   ends the hide ("A Dismiss makes 3, and its reports stop hiding right away until Dec 2, 2026 UTC", in the
   foreground); the toast's Undo, and the closed line's reopen for 30 days, take the strike back, because the count
   reads the reports as they stand. A confirm would slow the front's one-press verdict on every harm report for a
   rare case. If he wants one: it is one line (`dismissEndsTheHide` is the predicate) opening the portal's own
   confirm only on that press.
2. **The newsletter row through an email change: move it with the address, or key the switch on the account?**
   Recommended and built: **move it**, inside `handle_user_email_change` (20261001110000). The opt-in is the person's
   consent, not a mailbox's, so it follows them as `guests.email` already does; a row keyed on the account would
   still hold the old address for the first sender to mail; and the trigger is the one place every change passes (both
   codes, a link tapped in another browser, an operator's update), where app code sees only a change made in the same
   browser. An address already on the list keeps its own row and the old one goes. The switch also asks in the list's
   own form (lower case, trimmed), so it removes exactly the row it reads ON.

## System-doc edits (in place, owned facts only)

- `admin-observability.md`, Reports, the instant hide: the rule's one home is `report_strikes`, which `create_report`
  asks and the queue reads; the line on the card and in the report whole, and what it never shows.
- `auth-accounts.md`, "The copies follow inside GoTrue's commit": the newsletter row moves with the address, never
  raising, and why there.
- `notifications-analytics-growth.md`, the newsletter opt-in: the switch removes what it reads, in the list's form.
- `design-system.md`: the `rows` note gains the tie rule (`TIE`); the tooltip gotcha rewritten as the fix and its
  mechanism (the viewer's own guard gone).
- `guest-flow.md`: the first paint's parenthesis (the served plan spares a layout; the engines no longer disagree)
  and the link store's two in flight.

## Deferred (ROADMAP one-liners, bucket named)

- Hardening: counts still print in the runtime's locale: `formatLimit` (`src/lib/constants/tiers.ts`, the pricing
  table's caps) and the pricing cards' photo and hour counts (`pass-card.tsx`, `plan-cards.tsx`, `configurator.tsx`,
  `comparison-table.tsx`, all `toLocaleString()`); route each through `formatCount` (from `crumbs-33`, which left the
  marketing tree to `crumbs-34`).

## Handoff (replaces the chat report)

- **Commits, pushed:** work `d13327ad`, sync `d660c529` (merge of `ba12a618`: crumbs-34 landed in two of this lane's
  reads, `admin-observability.md` and `design-system.md`, in sections it does not edit), system docs `1a79eaab`, this
  manifest last. Scratch: `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-33/` (`walk/` the scripts and their
  logs, `sql/` the proofs as run, the Library captures `lib-*.png`).
- **Gates on the synced tree** (code identical at `1a79eaab`), each on its own exit code: `pnpm typecheck` 0, `pnpm lint`
  0, `pnpm test` 0 (680 files, 8,126 tests), `zsh scripts/build-lock.sh pnpm build` 0 (no warning), `pnpm lab:smoke
  --base http://localhost:3131` 0 (157 checks, 0 failing; logs `gate-*.txt` in scratch). No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths above, this file and the five
  `docs/systems/` files under System-doc edits. No exception.
- **The items** (each test red on today's code, then green):
  1. **Strikes on the queue.** `20261001100000_report_strikes_one_home.sql` moves the rule (what a strike is, 180 days,
     three) into `report_strikes(text[])`, one jsonb, INVOKER, the service role's alone; `create_report` asks it for its
     bar (its body 20260930120000's with only the inline count replaced) and `listOpenEntries` reads it (`readStrikes`,
     a seam that reads a missing function as no reading). A child-abuse report's line, on its card and in the report
     whole, says its address's live strikes and what a Dismiss would make of them, foregrounded when the Dismiss is the
     one that ends the hide; the address never shows. Proved rolled back on the live schema: red on today's (steps 1,
     2, 3 and 6; 4 and 5, today's bar, pass either side), green with the file, nothing left (the file's foot); first on
     a throwaway Postgres 17, where five mutations each failed their own step. Tests: `migration-guards.test.ts` 27
     (reshaped: the count moved, the scar kept), `reports/migration.test.ts`, `queries/reports.test.ts`,
     `admin/reports.test.ts`, `report-queue.test.tsx`; the Library's queue draws the line (`lib-front-1440.png`,
     `lib-front-375.png`, `lib-peek-1440.png`).
  2. **The newsletter row with an email change.** `20261001110000_newsletter_follows_the_address.sql`: the trigger moves
     the account's row to its new address (a listed address keeps its own row; never a unique violation, which would
     stop every change), and the `/account` switch reads and removes in the list's own form (`account.ts`). Proved
     rolled back on the live schema: red on today's body (1 and 3), green with the file, no `nl-` account or row left
     (the live list held 0 rows, so nothing needs a backfill). Tests: `migration-guards.test.ts` 31 (2 of 3 red without
     the file), `account.test.ts` (red on today's module).
  3. **One pinned date formatter.** `formatEventDate` and the profile's Joined (`formatMonthYear`) print en-US read in
     UTC whatever the runtime; `formatEventDate`'s en-US output compared byte for byte with today's over 111,768
     days across six zones, no difference. `utils.test.ts` (3 red on today's) refuses a date in the runtime's locale
     anywhere in the product. A German-locale Chrome on the dated probe's album: today "25. September 2026" with
     React's "Hydration failed" error, now "September 25, 2026" and none (`walk/locale-before.txt`,
     `locale-after.txt`). The claim card's `formatUploadTimestamp` no longer exists (claims-wiring removed it).
  4. **The rows engine's ties.** `layoutRows` replaces its best only past a tie (`TIE`, a billionth of the cost), the
     first met standing; `bandFor` names `Math.pow` so a test can be another engine. A simulated second engine (Math.log
     and Math.pow a last bit off) broke 221 of 1,260 layouts of 1,145 photographs on today's engine, none now
     (`ties-scale-before.txt`, `ties-scale-after.txt`); `album-rows.test.ts`' own case is red on today's. The probe
     album loaded 10 times (1440 and 375): 0 hydration errors (`walk/album-hydrate-after.txt`).
  5. **The viewer's link asks.** At most two requests out; what a burst asks meanwhile goes as one, its newest first; a
     request stalled 8 s gives its place up (`links.ts`; `links.test.ts`, 3 red on today's). A held arrow key on the
     probe, localhost: 100 steps made 55 to 58 asks and the hundred-and-first photograph's link took 380 to 966 ms,
     now 14 to 19 asks and 38 to 152 ms; the whole album (1,144 steps) made 1,091 asks with the last link 7.7 s late,
     now 292 to 321 and 0.2 to 0.5 s (`walk/walk-before.txt`, `walk-after.txt`).
  6. **A tooltip's touch tap.** `ui/tooltip`: a focus a finger or pen began never opens it, and the arrow (with radix's
     span around it) takes no pointer; the viewer's capture guard is gone (`tooltip.test.tsx`, 2 red on today's).
     Real Chrome's touch pipeline: the Library's demo lost 3 taps of 3 on its top edge today and 0 now, a cursor's
     click unharmed (`tooltip-before.txt`, `tooltip-after.txt`); the viewer with today's tooltip and no guard lost
     Close 3 of 3 (the click went to `body`), with the fix and no guard 0 (`viewer-taps-noguard.txt`,
     `viewer-taps-after.txt`). The mechanism: the entrance slides the arrow's box over the trigger's edge, and either
     half of the fix alone carries the tap (`tooltip-arrow-only.txt`).
- **For the next build's red-team** (the portal and an email change cannot run signed in on localhost):
  - The queue, once 20261001100000 is applied: an open child-abuse report from willg97's address (two live strikes)
    reads "This address has 2 strikes of 3. A Dismiss makes 3, and its reports stop hiding right away until <date>",
    foregrounded; a report from hi@willgibs.com reads "no strikes"; an unconfirmed reporter's has no line; nothing
    shows an address. A walk that ends in Dismiss spends a strike (testing-verification.md): Dismiss then Undo from
    the closed line, and the count comes back.
  - The newsletter row, once 20261001110000 is applied (Will types the two codes): a test account opted in on the
    offer card changes its address on `/account`; the switch still reads ON, OFF removes the row, and
    `newsletter_signups` holds neither address after.
  - An Android phone: in a viewer, Close tapped on its lower edge closes, Copy link and Share land, no tooltip flashes.
  - A German-locale browser on an album with an event date: the date in English, no hydration error.
- **Assets requested from Will:** none.
- **Board ideas:** a dismissed child-abuse report's closed line could say whether it is still a live strike and until
  when, so an operator reading past dismissals sees what each costs its address, and that its Undo takes it back.
- **Proposed migrations** (applied by protocol, never by this lane):
  - `20261001100000_report_strikes_one_home.sql`: replaces `create_report`, so the Advisor first (the pickup). Either
    order with the deploy is safe; then regenerate `types.ts` (`report_strikes` appears) and drop the typed seam, the
    cast in `readStrikes` (`src/lib/db/queries/reports.ts`). Advisors: expected delta none.
  - `20261001110000_newsletter_follows_the_address.sql`: replaces `handle_user_email_change`, which runs inside
    GoTrue's commit; nothing to regenerate, no deploy needed. Advisors: expected delta none.
  - No Worker, Vercel, Stripe or env change.
- **The PREMISE lines** (`lab:smoke`): `disposable-mode` (8 asks) and `locked-door` (4 asks) describe `guest-flow.md`,
  which this lane touched in two places only, the first paint's reason in parentheses and the link store's two in
  flight; neither is a word or behaviour those asks describe (the door's family, shape, wait and lost; the guest
  page's camera, wall, peek and the viewer's Save and Share, which still land on a tap), so they hold.
- **Calls his to overrule:**
  - No confirm on a third-strike Dismiss (Question 1); the row moves with the address (Question 2).
  - The strike line shows on a phone's card too, which has no Dismiss: it says what a desk's Dismiss would make of it.
  - A tap (finger or pen) never opens a tooltip; a keyboard's focus and a cursor's hover still do.
  - Two link requests out at once; a stalled one gives its place up after 8 s.
  - Joined reads en-US in UTC, as the server always printed it, never the viewer's zone.
  - A tie in the rows engine now goes to the partition met first (the shorter last row), so an album with tied
    partitions may break differently from before, the same in every engine.
- **Look at first:** `supabase/migrations/20261001100000_report_strikes_one_home.sql` (it replaces `create_report`),
  then the queue's line in the Library (`/design/library/admin-report-cards`).
