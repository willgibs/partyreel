---
track: crumbs-88
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
