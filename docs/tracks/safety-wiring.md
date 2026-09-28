---
track: safety-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "69afdbc5"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - supabase/migrations/20260928120000_event_blocks.sql
  - src/lib/db/mutations/event-blocks
  - src/lib/db/queries/event-blocks
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/components/social/guest-peek
  - src/components/social/guest-list
  - src/components/app/event-settings/profile-social-card
  - src/components/app/share/event-sheets
  - src/app/(guest)/e/[token]/page.tsx
  - src/lib/db/mutations/social
  - src/lib/db/queries/social
  - content/help/profiles-guest-lists-and-following.mdx
  - src/app/(dev)/design/sandbox/event-safety/
  - src/components/app/event-blocks/
  - src/lib/events/closed-door
  - src/lib/events/event-blocks
  - src/lib/events/album-viewer.server
  - src/app/(guest)/e/[token]/card/route.tsx
  - src/app/api/guests/route.ts
  - src/app/api/guests/route.test.ts
  - src/app/api/guests/name/
  - src/app/api/guests/email/
  - src/app/api/guests/mine/
  - src/app/api/guests/remove/
  - src/app/api/guests/unlock/
  - src/app/api/export/guest/
  - src/app/api/album/guest/
  - src/lib/db/mutations/guest.ts
  - src/lib/db/mutations/guest.test.ts
  - src/components/shared/media-lightbox-parts/credit.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/app/(app)/dashboard/[eventId]/review/page.tsx
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/(app)/dashboard/actions.ts
  - src/components/app/event-settings/event-settings-sheet.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/db/migration-guards.test.ts
  - src/lib/social/public-profile-visibility.test.ts
  - src/lib/db/queries/profile.private-count.test.ts
  - content/help/reporting-and-safety.mdx
  - content/help/what-guests-can-and-cant-see.mdx
  - content/help/display-name-and-profile-photo.mdx
  - content/help/your-event-page-explained.mdx
  - content/help/who-can-see-your-event.mdx
  - content/help/your-public-profile-following-and-blocking.mdx
  - content/help/event-settings-explained.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/event-safety.json
  - docs/systems/trust-safety-forensics.md
  - docs/systems/profiles-social.md
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
---

# lp/safety-wiring

**Goal.** Build Will's event-safety answers: a per-event block (new, with a migration the Orchestrator applies), reachable softly from every person's look, invisible to the person blocked, listed at the Guests room's foot, undone with a choice to restore their uploads; and the guest list always on. Then retire event-safety.

## The brief

**His answers** (`docs/reviews/event-safety.json`, each note there in full), on the terms he set when the board opened (`src/app/(dev)/design/sandbox/event-safety/spec.ts`'s header):
- A block is "Out, uploads removed": per event, the host's to make and undo. The person cannot join, upload, open the album, like or claim, and every refusal is re-checked per request. Their uploads leave for Deleted in the same step. They meet a plain closed door, never the word "blocked".
- It keys on the account, the confirmed address or the guest row, never a device or an IP. On a names-only party it holds on one browser, so the block's confirmation offers Require verified emails.
- It is free on every plan.
- `entry=all`, with his note: every road opens the person's look (the viewer's face-led credit, a name in the Guests room, the uploader in Review), and the look stays social ("making this screen open into a block-heavy view feels far less social, more administrative"). Block is a minor, subtle action in it, for the host alone. Pressing Block opens the one block screen, a destructive confirm through `DestructiveSheet` or the popups' confirm kind.
- `door=private`: a blocked person meets the private album's lock screen (`src/app/(guest)/e/[token]/page.tsx`'s private branch). It must answer exactly as a private album does, in response and timing, so nobody can tell a block from a private album ("Sneaky block").
- `blocked=foot`: under the Guests room's guests, a quiet Blocked section: who, since when, Let back in.
- `restore=ask`: letting someone back in confirms, with "Also restore their uploads" off by default. His note: the likely case is a second chance with the offending uploads kept removed; the toggle covers an accidental block.
- `room=always`, his note: "make the guest list always on, so a host doesn't have to turn it on or learn special handling ... Always on for everyone."
  - Today it is `events.show_guest_list`, default false. The code and the guest list's reads treat it as always on (a function replacement where SQL reads it), and the switch leaves settings and the share sheets.
  - Dropping the column is a destructive migration, not yours: leave it unread and name it in your Handoff.
  - The Terms and Privacy lines about staying off a guest list (`legal-terms.tsx`, `legal-privacy.tsx`) change. Don't edit them: put your proposed wording under Questions, since legal words are Will's. The help follows (`profiles-guest-lists-and-following.mdx` and any other article that says the list is optional).
- `newcomer=same` and `unlisted=ask` are doors of join modes that don't exist yet. `event-settings` (a board) is asking how "who can join" is set, so build neither.

**The migration** (write it; the Orchestrator applies it and regenerates the types):
- A table for blocks, RLS on, the host's own events only. `anon` gets no table access. Every function created revokes EXECUTE from `public` AND `anon` explicitly. SECURITY DEFINER RPCs for block and let-back-in, re-checking the caller is the event's host.
- Every guest path's function re-checks the block: the album's read, the join, `create_media` and the upload's presign, likes, and both kinds of claim (`claim_anonymous_uploads` for this device's tokens, and the claims review's rows).
- A function you replace starts from its newest definition in `supabase/migrations/`.
- Exercise every refusal inside a rolled-back transaction: a blocked account, a blocked address and a blocked guest row each refused on every path; the host allowed; another host refused.
- Its file is `supabase/migrations/20260928120000_event_blocks.sql`. Add any further file to `owns` before writing it.

**Then retire `event-safety`** in one commit (its folder and its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`, as named exceptions). Its `choose` and the four staged asks are moving to the new `event-settings` board, which ports them from git, so nothing is lost. The ledger is the Orchestrator's to delete.

**Paths:** your owns are a start. A path you need beyond them (the viewer's credit, Review's peek, the dashboard's actions, `event-experience.tsx`): add it to `owns` in your manifest before editing, or name a one-line exception. `pricing-wiring` will replace `tier_limits()`; never replace that function.

**Verify:**
- Vitest for every rule, and the rolled-back SQL checks above.
- The look, the block screen, the Blocked section and Let back in at 1440 and 375.
- `pnpm lab:smoke` whole.
- Build 16's red-team walks it live (partyr33l blocked at a willg97 test event).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

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
