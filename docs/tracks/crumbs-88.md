---
track: crumbs-88
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5cf32baf"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/event-feed/event-cards-row
  - src/components/app/event-feed/event-hub-head-cover
  - src/components/app/create-event-wizard
  - src/app/(app)/dashboard/actions
  - src/app/(app)/dashboard/new/
  - src/lib/db/mutations/events
  - src/lib/db/queries/dashboard
  - src/components/app/dashboard/stage
  - src/components/app/share/as-guest-view
  - src/components/auth/account-door
  - src/app/(auth)/auth/callback/
  - src/app/(auth)/adopt-door-name
  - src/lib/guest/confirm-beat
  - src/components/app/event-settings/event-page
  - src/components/app/user-menu
  - src/components/guest/reel/live-reel-view
  - supabase/migrations/
  - docs/systems/design-system.md
  - docs/systems/dashboard.md
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/profiles-social.md
  - docs/systems/disposable-mode.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/database-security.md
---

# lp/crumbs-88

**Goal.** Small things a person can hit, from red-team 57 and Immediate's app lines, fixed at their source; Create's retry made unable to make a second event.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**The items, in order (each an Immediate line in `docs/ROADMAP.md`, quoted by its opening words; the Orchestrator retires each at your record):**
1. **"Host: on the hub, once the band folds, the Review pill's 99+ badge"** (red-team 57, LOW): at 375 the folded pill shows no word and its 99+ badge covers the Review icon, so it reads only "99+"; at 1440 the badge also sits over the icon. Anchor the badge at the glyph's shoulder so it grows outward, every count from 1 to 99+, at 375, 820 and 1440, light and dark.
2. **"Design: the hub cover's address link"** (red-team 57, NIT): the house focus ring in place of the browser's own outline.
3. **"Create: a Create whose answer is lost after the server made the event"**: Try again makes a second event (a Free host's one event spent on a duplicate). A client key for the attempt, made once per Create and sent with each try, unique per host, so a retry returns the event the first try made (a migration: a nullable column, its unique index per host, its column grant in the same file, as `docs/systems/database-security.md` requires for a host table write; the free-tier cap and every trigger on `events` read as they stand). Prove the duplicate refused and the first returned inside `begin; ... rollback;` (that doc's recipe) and never apply it: the Orchestrator applies it through the Advisor and the protocol after your handoff, so your Handoff names the file's md5 and every caller. Milestone 38's live build shares this database and sends no key: it must keep creating events meanwhile (the header says so).
4. **"Host: the dashboard's stage wall shows a disposable album's sealed photographs"**: hold the wall to what guests see (`hubCovered`, `host-cover.ts`).
5. **"Host: the host's view-as-guest cover"** (`as-guest-view.tsx`) names its kinds as the guest's first paint does.
6. **"Account: a magic link that signs Create account into an existing address"**: the one-line banner the line describes.
7. **"Guest door: a confirm by the emailed link"**: the name beat after a full reload, as the in-page confirm says it.
8. **"Design: Settings' date range at a phone"**: one gutter for both rows.
9. **"Design: the account menu's \"Plan and storage · Event Pass\""**: one line at both widths.
10. **"Reel: the live reel's \"Hide the controls\""** (red-team 56b, LOW): a visible focus, and Tab moving past "Make your own".
11. **The system docs crumbs-87 left stale** (its Handoff, `git show a7991bc30^2:docs/tracks/crumbs-87.md`, "System-doc edits"): each named line refined in place to what shipped (`design-system.md`'s one needs-you token, `dashboard.md`'s This week, `guest-flow.md`'s link words and card flag, `host-app.md`'s email-first hold, the sleeping invite list and the fold's halo room, `profiles-social.md`'s blocks and `getBlockedAmong`, `disposable-mode.md`'s two clocks); a line deleted where it is no longer true, nothing appended.

**Nearby lanes running (never edit their paths):** the boards create-wizard r5, guests-room r1, presence r1, after-party r1 and no-signal r1 (each its own `src/app/(dev)/design/sandbox/<board>/` only). If an item needs a line outside your owns, list it as an exception in your Handoff.

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as its recommended answer and is listed again under the Handoff's calls to overrule.

1. **How long does a Create's key live?** Recommended, built: one wizard visit (minted at the first Create press, kept across Back and edits; a reload is a new Create). A retry after a lost answer then returns the first event as it was made even if she edited the name since (Settings renames it), where a key per press would meet a Free host's cap with her first event standing.
2. **A retry whose first event she has deleted since?** Recommended, built: a fresh event with no key (the key is spent: the index spans deleted rows, so a restore can never put two live rows on one key, and deleting the first says she did not want it).
3. **What says "signed you into the account you already had" for a link?** Recommended, built: the one line Will's `existing=tell` asked for, on `/dashboard` under the head, with her own address, a dismiss and the code's "Not you?" (this device's sign-out); drawn for the Create account door's magic link and for Google through the same callback, and only for a landing of exactly `/dashboard`.
4. **How does the album hear the name a tapped link adopted?** Recommended, built: a two-minute cookie bound to the album (`pr_told_name`), spent by the album's mount, never a query (a name is a person's own).
5. **Does the stage's "in the album" count, and her tiles' covers, hold to the seal with the wall?** Recommended: not in this lane (they are SQL homes, `event_covers`, `event_stills`, `event_card_stats`: a migration); the wall alone is held here and the rest is the first Deferred line below.

## System-doc edits (in place, owned facts only)

crumbs-87's stale lines, each refined in place (`f58fbb833`):
- `design-system.md`: "A count that needs her is one token" names every surface that wears it (the dashboard's marks and rows, the card's chip, Review's count) and the stage's white figures beside its dot.
- `dashboard.md`: "This week" says its tally counts the stage's own event.
- `guest-flow.md`: "open → the full experience" and "The link's image" say the title and line follow `accepting_uploads` and the card's foot follows `?add`.
- `host-app.md`: "An email first" (a gate that lets go gives names-only back, device-bound), the Invited bullet (a list nobody is on, under another door, sleeps), "A setting with no effect right now" (the fold's box leaves a halo's room).
- `profiles-social.md`: the block bullet (Follow nowhere a block stands either way, `getBlockedAmong`) and Connections (`followBarred`).
- `disposable-mode.md`: "The wait's clock" says the hub's held card names both clocks as its line does.

This lane's own facts, in their homes: `host-app.md` (a Create is one event however many times it is asked; See it as a guest's cover counts by kind), `dashboard.md` (the live wall draws only unsealed photographs; the existing-account line a link draws), `guest-flow.md` (a confirmation by the emailed link is the same beat after a reload), `disposable-mode.md` (the host's exemption is her dashboard's except where a surface draws what a guest could be shown: the stage's wall).

Not mine to edit, for their owners: `auth-accounts.md`'s "You already had an account" bullet could take one clause for the link's `intent=create` mark (`dashboard.md`'s new bullet points at it); `reel.md`'s `inert` line stays true (the reel's away layers are now also `visibility: hidden`, the why in `live-reel.css` and pinned by `live-reel-view.test.tsx`).

## Deferred (ROADMAP one-liners, each naming its bucket and area)

- Immediate · The host app · Create: once `20261007120000_event_create_key.sql` is applied and `types.ts` regenerated, retire the typed seam in `lib/db/mutations/events.ts` (`CREATE_KEY`'s cast, the `Object.assign` that puts the key on the insert, `eventUnderKey`'s 42703 branch and the tests that pin it); it still compiles after the regen, so nothing forces it (crumbs-88).
- Upcoming · The host app · Host: her dashboard's tile covers and stills (`event_covers`, `event_stills`) and the stage's "in the album" count (`event_card_stats`) are exempt from a disposable album's seal for her own session, so sealed photographs and the full count show there while the hub and the stage's wall (held since crumbs-88) cover them; hold the three SQL homes to the guests' view, or say on the cards why they are hers (a migration) (crumbs-88).
- Upcoming · Accounts and profiles · Account: the "signed you into the account <email> already had" line reads three lines at 375 (sentence, Not you?, dismiss); a lighter form would sit quieter (crumbs-88, NIT).

## Handoff (replaces the chat report)

- **Commits** on `lp/crumbs-88`, pushed: `ba2b343b0` (items 1 to 3), `4af4485a0` (items 4 to 10), `7edc7eb3e` (item 2's halo room), `f58fbb833` (item 11), then this manifest alone. launch-prep moved to `33de1b63e` since the cut (presence-r1's board under `src/app/(dev)/design/sandbox/presence/`, and records): nothing of mine reads it and the trial merge is clean, so no sync commit.
- **Gates** on `f58fbb833` (the work head; the manifest commit after it changes `docs/tracks/crumbs-88.md` alone), each on its own exit code: typecheck 0; lint 0, no warnings; test 0 (1,085 files, 13,748 tests); build 0 (`scripts/build-lock.sh`); `lab:smoke --base http://localhost:3131` 0 (188 checks, 0 failing). The logs live in the lane's scratch, pruned with it.
- **Lane check** `git diff --name-only origin/launch-prep...HEAD`: 47 files before this manifest, 36 under owns, 11 outside, each one item's own file: `room-card.css`, `room-card-door.tsx`, `room-card-door.test.tsx` (item 1: the folded badge and its `data-len` live in the door card, not `event-cards-row`); `share/event-link-row.tsx`, `share/event-share.test.tsx` (item 2: the cover's address link); `dashboard/[eventId]/as-guest.server.ts` (item 5: one type line, `stats.kinds?`); `dashboard/page.tsx`, `dashboard/page.test.tsx` (item 6: the one `signed_in` parameter and the line's slot); `lib/guest/use-confirm-return.ts`, `.test.tsx` (item 7: the album's mount claim tells the adopted name); `guest/reel/live-reel.css` (item 10: the visibility rule beside `live-reel-view.tsx`).
- **The items**, each a ROADMAP Immediate line for the Orchestrator to retire at its record:
  1. Review's folded badge: `room-card.css` pins it by its LEFT edge at the glyph's shoulder so a wider count grows outward, and from 800px the pill's gap widens by the count's characters (`data-len`, `room-card-door.tsx`); two CSS pins and the per-count cases in `room-card-door.test.tsx` (both pins fail on the old sheet). Measured live at 375, 820 and 1440, light and dark, every count from 1 to 99+: the badge's overlap with the glyph is the one-digit badge's own at every count, none over the word, and "99+" ends inside the 4px gap at 375.
  2. The cover's address link wears `focus-halo` with room around its words (`event-link-row.tsx`; `event-share.test.tsx` "wears the house's halo on both its stops"); measured live by Tab at 1440: the browser's outline is gone, the halo's shadows are drawn.
  3. A Create is one event: `createEvent` reads the host's event under the key before the insert and again when the insert is refused (`lib/db/mutations/events.ts`), `createEventInWizard(input, attempt)` takes a uuid-shaped key and refuses anything else, the wizard sends one a visit; `events-create-key.test.ts` (14 tests, 9 fail on the old code), `events-create-key-migration.test.ts`, `create-event-wizard.test.tsx`, `actions.test.ts`, `create-flow.test.tsx`. The migration and its proof: see below. Live, with the migration unapplied: a real Create ran keyless through the 42703 fallback, and the wizard's POST carried `[values, "<uuid>"]`.
  4. The stage's wall takes the seal's own filter (`getStagePhotos` + `unsealedFilter(nowIso())`, `lib/db/queries/dashboard.ts`; `dashboard.test.ts`: sealed ahead, reached, unsealed, an all-sealed wall, the `or` tree); live, the stage drew the 4 unsealed photographs of the test event's 17.
  5. The view-as-guest cover names its kinds (`as-guest-view.tsx`: `stats.kinds`, then the live album's words; `as-guest-view.test.tsx`, three tests); live, its count glyph read "4 photos".
  6. A Create account link (and Google) that signs into an existing address lands `/dashboard?signed_in=existing` and the page draws the one line: `auth/callback/existing-account.ts`, `route.ts`, `account-door.tsx` (the mark, never on the admin host), `account-door-existing-banner.tsx`, `dashboard/page.tsx`; tests in `route.test.ts`, `account-door.test.tsx`, `account-door-existing-banner.test.tsx`, `page.test.tsx`. Live: the line at 1440 on one line and at 375 on three, Dismiss and "Not you?" (to /login) worked, and the address is cleaned.
  7. A confirm by the emailed link tells the name after the reload: `adopt-door-name.ts` returns the name it adopted, the callback leaves it in a two-minute cookie bound to the album (`adopt-door-name-told.ts`), `takeToldName` (`confirm-beat.ts`) spends it and `use-confirm-return.ts` reports the beat; tests in all five files.
  8. Settings' range at a phone: one column under 640px, both fields one width on one gutter, the remove a quiet text link there (`event-page.tsx`); measured live at 375 (both fields 32 to 343, links aligned at 32) and 1440 unchanged.
  9. "Plan and storage · Event Pass" on one line: `whitespace-nowrap` and the plan at 11px, no wider menu (`user-menu.tsx`); measured live at 375 and 1440 for Free, Pro, Max and Event Pass.
  10. Hide the controls: the away layers are `visibility: hidden` after their fade (Radix's focus scope reads visibility, never `inert`, so the inert last control stranded Tab) and the control wears `focus-halo` (`live-reel.css`, `live-reel-view.tsx`; two tests that fail on the old code); measured live: before, Tab stuck on "Make your own"; after, Tab wraps to Close and Shift+Tab mirrors it, the halo drawn on the timeline.
  11. The docs: the six files under System-doc edits, `f58fbb833`.
- **Assets requested from Will**: none.
- **Board ideas**: Radix's focus scope reads `visibility` and `display`, never `inert`, so any trapped layer whose last control sits in an inert but still-visible region can strand Tab as the reel's did (`ui/dormant.tsx`'s asleep content inside a popup is the candidate): one keyboard walk of the popups with a dormant row last [unverified].
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: one migration, none of the rest.
  - `supabase/migrations/20261007120000_event_create_key.sql`, md5 `8a1e9e56ee5dae9f248b4a200f7721ee` at `f58fbb833`, NOT applied: a nullable `events.create_key uuid`, a unique index on (host_id, create_key) over keyed rows, and `grant insert (create_key)` to `authenticated` (INSERT only, anon none, no revoke). Its rolled-back foot ran twice: RED on today's schema (step 0 green, 1 to 9 red, 10 green by absence) and GREEN from the file's final bytes (all eleven rows ok: the duplicate refused and the first returned, the Free cap read as it stands, per-host keys, write-once, a deleted event keeps its key, every trigger like for like, nothing reads it); a read after it found no column, no index and none of its fixtures. A drift read just before: no column, no index. The header's apply protocol (0) to (4) is the order: before the alias build that carries the lane (an earlier build is never harmed; a build that arrives first creates keyless and says so once a Create in Sentry), the advisors' delta none, then regenerate `types.ts` and retire the seam (the Deferred line).
  - Every caller: `createEvent` (`lib/db/mutations/events.ts`: the key's read, the insert, the re-read) ← `createEventInWizard` (`app/(app)/dashboard/actions.ts`: validates the uuid's shape) ← `CreateEventWizard` (`components/app/create-event-wizard.tsx`: one key a visit). No RPC, trigger, policy or view reads the column (the foot's step 10 and `events-create-key-migration.test.ts`); milestone 38's build names no such column and keeps creating events (the foot's step 3).
- **Test data**: one event, "crumbs-88 (disposable)" (`b53de580-9a0b-48aa-b643-1e53be23fdd3`, willg97's, made through Create), soft-deleted through the product's Delete event (`purge_at` 2026-11-06). The headless Chrome, its driver and my dev server are stopped.
- **Calls his to overrule**: questions 1 to 5 as built; the folded badge pinned by its left edge (a card's or tile's resting badge stays right-anchored, which protects the title); the range stacked under 640px with a text-link remove; the plan name at 11px in place of a wider menu.
- **Look at first**: the migration's header and foot; then the two callback paths no local walk can reach (only willg97 signs in here and a PKCE exchange needs a real emailed code), the told name to an album and the Create account link for an existing address, which a milestone red-team should tap once from a real email; then Review's folded 99+ at 375, 820 and 1440 in both themes.
