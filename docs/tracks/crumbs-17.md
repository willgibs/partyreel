---
track: crumbs-17
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5a027e53"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260929220000_door_invite_admits.sql
  - src/components/app/event-settings/settings-rows.tsx
  - src/lib/events/event-blocks.ts
  - src/components/admin/report-queue.tsx
  - src/lib/admin/reports.ts
  - src/app/admin/forensics/page.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/systems/trust-safety-forensics.md
---

# lp/crumbs-17

**Goal.** Fix what build 23's red-team found on the doors and the reports: the invited guest left waiting at the door, the host's Report on her own album, the operator's host-or-guest line, the uncovered dismissed worst kind, and eleven small nits; plus two dead seams crumbs-15 found.

## The brief

**Build 23's live red-team** (2026-09-29; its ledger, with every step and id, is `/Users/gibby/local/ai/partyreel-wt/_scratch/redteam-23/ledger.txt`) found these on settings-wiring's doors and triage-r2-wiring's reports. Fix each at its root, with a test that fails on today's code:

- **BUG-2, MEDIUM: an invited guest who had asked stays at the door after she joins.** On the invite-list door she asks and waits; the host adds her address to the list; she comes in and adds a photo. Her waiting row is never admitted (neither the invite nor her join touches it; the join mints a new `in` row), so the Guests room shows her At the door (Let in, Decline) beside her guest-list entry and her "Joined" address, the pulse and the bell keep counting "1 person at the door", and Decline there would block a guest already in. Listing an address that waits at the door should let that person in, once, everywhere the door counts. This likely replaces a SQL function: start from its newest definition in `supabase/migrations/`, keep its grants exactly (revoke EXECUTE from `anon` explicitly unless guests must call it: CLAUDE.md's landmine), write the migration file, and prove it inside one rolled-back transaction through the Supabase MCP. You never apply it: the Orchestrator does, by protocol.
- **BUG-3, LOW: the host sees Report on her own album through its `/e/` link.** Every photo, her own uploads included, shows "Report this photo", and the page's foot shows Report; the "never on the host's own album" rule rests on `viewerIsHost`, which only the dashboard grids pass.
- **LOW-2: the operator cannot tell a host's report from a guest's**: the host's own report reads "Signed-in guest, can be asked" on its tile (`components/admin/report-queue.tsx`, `lib/admin/reports.ts`).
- **NIT-7: a dismissed child-abuse report's photo shows uncovered** in the Dismissed list. The worst kind stays covered wherever it appears; treat this one as safety, not polish.
- **NIT-8:** after Dismiss then Undo, the reopened report reads "no confirmed email", because the close wipes the address; say what is true after a reopen.
- **NIT-6:** the report form promises "It's hidden … the moment you send this" before a child report the daily limit stops from hiding; promise only what will happen.
- **NIT-1:** after the ask at the invite list's shut door, one extra welcome step comes before the held door.
- **NIT-2:** the upload-failure sheet offers Retry for "This event accepts photos only", which can never pass.
- **NIT-3:** Let back in for a declined newcomer says "able to open … and add photos again" and "can join again", yet she returns to the held door and still needs Let in (`lib/events/event-blocks.ts`).
- **NIT-4:** after Let back in, the Guests room shows her nowhere until a reload.
- **NIT-5:** "The 1 person waiting at the door stay out" should read "stays" (`event-settings/settings-rows.tsx`).
- **NIT-9:** on a Free event (photos only) the welcome says "photos and videos".
- **NIT-10:** "1 uploads".
- **NIT-11:** the Forensics holds table prints a literal `…` after each media id (`app/admin/forensics/page.tsx`).
- **Two dead seams** `crumbs-15` found (ROADMAP, Lifecycle and Guest): `isDeletionSchemaMissing` and the account deletion's `not_provisioned` answers; `queries/claims.ts`'s untyped reads, `NotificationPrefsRow` declared by hand (`schema-pass` has since touched `social/notification-prefs.ts`: check before you cut) and `queries/guest-events.ts`'s reel defaults. Remove what is dead, each test reshaped with its scar; change no behaviour there.

**Verify:** the gate; each fix walked on your dev server where localhost can reach it (the signed-in host and the operator's portal cannot run there: name what the next build's red-team must walk, as its steps, in your Handoff).

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception. Three files belong to running lanes and stay theirs: `components/app/share/event-share-provider.tsx`, `app/(app)/account/email-section.tsx` and `components/marketing/help/help-search-signal.ts` (`crumbs-16`).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

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
