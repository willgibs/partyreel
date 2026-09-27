---
track: claims-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "7e99254c"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/dashboard/
  - src/app/(app)/dashboard/
  - src/lib/db/queries/claims
  - src/components/social/follow-button
  - src/components/guest/follow-moment-card
  - src/lib/guest/confirm-beat
  - supabase/migrations/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-claims.json
  - src/app/(dev)/design/sandbox/identity-claims/
  - src/components/ui/popup-kinds.ts
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
  - docs/systems/profiles-social.md
---

# lp/claims-wiring

**Goal.** The claims review as Will answered it across two rounds: a slim banner that opens the review in the lists panel, one event at a time with its own photos, each decision saved as it's made with the deletion confirmed at the Not mine card, and every claimed event offering Open album and a quieter Follow; the moment card takes the quieter Follow too.

## The brief

**His answers** (`docs/reviews/identity-claims.json`; the board `src/app/(dev)/design/sandbox/identity-claims/` draws them as its ground, `batch.ts` its one pure reducer on the RPCs' semantics, which is the spec):
- r1: `ticket=banner` (one slim line above the feed with a Review button, the feed untouched: "This allows users to handle when they'd like to, rather than filling the screen with a tall card immediately"), `pass=cards` (one event at a time, each with its own small preview; deciding advances), `confirm=dialog`, `after=profile` (built: the finish toast's page line).
- r2: `save=once` (a claim is added as she taps it and joins Your events; a Not mine is deleted once its dialog says so; closed early, what she did stays done), `confirm=card` (the dialog opens at the Not mine card for that one event while its photos are in view; "Individual, immediate handling 1 by 1 is likely best for claims here..."), `next=both` (Open album on every claimed row, and a small Follow beside it where the host has a page).
- `pointer` is round 3's, open on his next desk: build nothing for it (the album says what it says today); its pick is wired later.

**Where it opens:** the review is `popups`' `lists=panel`: `PopupContent kind="list"` (`src/components/ui/popup.tsx`, the table `ui/popup-kinds.ts`): a side panel at a desk, its own screen in a hand whose Back closes it. Its deletion dialog is the confirm kind over it (`stacked`).

**Today** (`src/components/app/dashboard/claims-card.tsx`, `src/app/(app)/dashboard/claims-actions.ts`, `src/lib/db/queries/claims.ts`): one card of rows, one Finish (`claim_guest_rows_by_email` then `disown_guest_rows_by_email` for the rest), one dialog over the leftovers, one toast. `save=once` needs no SQL: both RPCs take an id list, so each decision is one call with one event id. ★ **The double tap** (`claims-r3` found it on the board): with each decision saved as made, a double tap on Claim claimed the next event too; an answer names its card, an arriving card holds its answers 250 ms, and a card waits for its write before the next comes up.

**The cards' photos:** `pass=cards` shows each event's own small preview, which the ticket's read lacks: a few preview keys per claimable event, presigned on the server (`src/lib/r2/`, never a raw key to the browser), none for a password event (its card shows a lock and the count, as the board drew it). If this needs SQL, write the migration (an extra read or a column on the list RPC's answer; `database-security.md`: RLS or a SECURITY DEFINER RPC, `getUser()`, `anon` revoked explicitly, only her own claimable rows); the Orchestrator applies it after a rolled-back check.

**The quieter Follow:** a `FollowButton` variant (`src/components/social/follow-button.tsx`) for the claimed row, and the moment card takes it too (`src/components/guest/follow-moment-card.tsx`; his guest-capture note, "Follow doesn't have to be pushed as hard as a feature relative to uploads/verifications/etc.", a ROADMAP line this closes).

**Two ROADMAP lines this closes:** the moment card's two other-events lines (uploads already added elsewhere, from the one beat; rows waiting to decide) stay apart or fold into one, said once (`follow-moment-card.tsx`, `src/lib/guest/confirm-beat.ts`); and the finish toast's page line (`after=profile`) and the page invitation card (`prompt=claim`, `page-invite-card.tsx`) stop pointing to the same page in one beat.

**Verify:** the review at 375 and 1440 (a signed-in host with claimable rows: stage them with the test accounts in `testing-verification.md`, or on the lab's ground where sign-in blocks you; the live walk is the red-team's): one event at a time, Claim saved at once, Not mine's dialog at the card, a double tap claiming one, Open album and the quieter Follow, closing early keeping what she did; `pnpm lab:smoke` whole. `host-app.md` and `guest-flow.md` lines in the Handoff.

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
