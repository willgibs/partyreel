---
track: claims-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "ce0edd9f"            # the launch-prep SHA the branch was cut from
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

Each is built as recommended and is Will's to overrule.

- **The moment card's two other-events lines** (the ROADMAP line `claims-r2` left). They can only meet once
  `pointer` puts a line about the waiting events on the moment card, and `pointer` is round three's, open on his next
  desk. Recommended: fold them into one, said once, where that line exists (its row carries both halves, "Your uploads
  from 2 other events came too, and 4 more have photos waiting for you." with its one Review, and the success line
  drops `ELSEWHERE_LINE` then), so "other events" is never said twice about two different sets. Built: nothing, as the
  brief says (the album says what it says today); the decision rides onto `pointer`'s wiring (Deferred). Overrule: keep
  them apart, a done line and a to-do row.
- **One pointer to her page a beat** (the same line's other half). Recommended and built (`toastPointsToPage`,
  `claims-batch.ts`): the page's invitation is the pointer where it is about to stand (no page, not put away, nothing
  left waiting), so the closing toast says only "Added 9 photos to your account." then; everywhere else the toast keeps
  "Choose what shows on your page" (a page of hers, events still waiting behind the banner, the invitation put away).
  Overrule: the invitation waits for her next visit and the toast always points.
- **Which photographs a card shows.** Recommended and built: up to four of the row's own uploads, approved and live, on
  an open album only, which is what the album shows anyone; a held or hidden upload shows none (an address is not proof
  she took it), and a private album is locked with the count like a password one (the Guest card's own masking, and
  the guest album's `visibility = 'open'` rule). Overrule: include her held uploads too (her tracker shows a guest her
  own pending ones), at the cost of showing an address's owner what its album shows nobody yet.

## System-doc edits (in place, owned facts only)

The four docs are this lane's `reads`, so the lines are here for the Orchestrator to apply in place:

- `host-app.md`, "Open this before you": "the Guest cards, the claim ticket" becomes "the Guest cards, the claims
  review".
- `host-app.md`, the claim ticket bullet becomes: "**The claims review** appears when `getMyClaimableGuestRows()`
  finds rows typed under the account's own CONFIRMED email at a names-mode door before that email was proved: one
  banner line above the events with Review, which opens the list kind (`claims-review.tsx`: a side panel at a desk,
  its own screen in a hand) and goes through them one event at a time (`claims-card.tsx`), each with up to four of its
  own approved photographs from an open album, presigned on the server (a password or private album shows a lock and
  the count). Every decision is written as it is made, one event a call (`claims-actions.ts`): Claim through
  `claim_guest_rows_by_email`, Not mine through `disown_guest_rows_by_email` once its confirm dialog at the card says
  Delete, since that is the guest saying those uploads were not theirs; an event she never reaches waits, and the
  banner counts it. ★ An answer names its card, a card waits for its write, and an arriving card holds its answers
  250 ms, so a double tap never claims the next event (`claims-batch.ts`). ★ The album link never rides the list (a
  Not mine is an event she was never at): a claimed row's Open album and quieter Follow come from the claim's own
  follow-up read (`getClaimedEventNext`), for an event she is now a guest of. The writes never revalidate; the review
  refreshes the page behind itself as each lands and keeps its own account of her decisions. A disowned name leaves the
  guest list and the Guests room with its uploads, and the empty guest row survives for the device that minted it. A
  nameless profile meets the name gate first ([auth-accounts.md](auth-accounts.md)), prefilled from the newest
  claimable row's typed name. One toast as the review closes counts what that opening added, its second line pointing
  at the page unless the page setup's invitation is about to take the banner's place
  ([profiles-social.md](profiles-social.md)): one pointer a beat."
- `guest-flow.md`, the follow moment's ★ paragraph: "offers the HOST alone:" becomes "offers the HOST alone, with the
  quieter Follow (`FollowButton`'s `quiet`, a small ghost button: his "Follow doesn't have to be pushed as hard"):".
- `guest-flow.md`, OWN DELETES CLOSE IT: "a disown at the claim ticket included" becomes "a Not mine in the claims
  review included".
- `guest-flow.md`, level 2 of THREE LEVELS OF TRUST: "Once confirmed, the address claims its rows from the dashboard's
  claim ticket; what it leaves unclaimed is removed" becomes "Once confirmed, the address claims its rows from the
  dashboard's claims review, one event at a time; what she says was not hers is removed once she confirms it, and what
  she never reaches waits".
- `guest-flow.md`, the accepted gap: "an address's owner disowns what was not theirs at Finish" becomes "an address's
  owner disowns what was not theirs in the claims review".
- `database-security.md`, "★ The claim by address never takes an address": append "Its answer is the allow-list:
  names, counts, the event's door and up to four of the row's own approved preview keys from an open album, never the
  album's link (a claim's follow-up read gives that, for an event the caller is now a guest of)."

## Deferred (ROADMAP one-liners, bucket named)

- Identity: when `identity-claims`' `pointer` is wired, its moment-card row and the card's other-events line
  (`ELSEWHERE_LINE`, `confirm-beat.ts`) say the other events once (the recommended fold, the first Question) (from
  `claims-wiring`).
- Shared: a link inside a hand's place popup (the claims review's Open album, the look's Open full profile) navigates
  away and leaves the place's same-URL history entry behind, one dead Back; the place could take its entry back as a
  link inside it navigates (`ui/popup-back.ts`) (from `claims-wiring`).
- Guest door: the moment card's Follow starts on Follow even when she already follows the host
  (`claim-handle-prompt.tsx` hands `FollowMomentCard` no follow state); reading it beside `getHostCard` ends it (from
  `claims-wiring`).
- Housekeeping, to the retired-facts line: the claim ticket's Finish, retired, is still named in
  `account/profile/invite.ts` (`shouldInviteToPage`'s note), `sandbox/admin-triage/spec.ts:334`, and as "claim
  ticket" in comments in `migration-guards.test.ts` and `validation/upload.test.ts` (from `claims-wiring`).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/claims-wiring`** (base `ce0edd9f`): `6feb1498` the work; `e2969dc4` the sync (merge of
  `origin/launch-prep` at `c449e06e`: door-r3-wiring and desk-trim, and `guest-flow.md`, one of this lane's reads,
  moved; no file overlaps). The head is in the chat line.
- **Gates on the synced tree at `e2969dc4`**, each its own exit code, logs in `../partyreel-wt/_scratch/claims-wiring/`:
  `pnpm typecheck` 0; `pnpm lint` 0 (0 errors, the 5 standing warnings, none in a touched file); `pnpm test` 0 (510
  files, 5,720 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (245
  checks, 0 failing). No board in this lane, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned paths, this file, and four exceptions:
  `src/lib/db/migration-guards.test.ts` (the migration's load-bearing facts earn their guards there, per
  database-security.md: the previews' gate, and the file-pinned "replaces the no-argument signature" guard reshaped to
  replay every create and drop of the function across the set, its scar kept, since this file DROPs and CREATEs the
  three-argument signature); `src/components/ui/popup-kinds.test.ts` (its LEFT_ALONE line for `claims-card.tsx`, which
  no longer opens a bare Dialog); `content/help/find-your-uploads-and-events.mdx` and
  `content/help/your-dashboard-explained.mdx` (`help-ui-labels.test.ts` failed on "Claim all"; both follow the review).
- **The items:**
  - The banner (`ticket=banner`): one line above the events, "11 photos from 4 events are (still) waiting for you",
    with Review; the review never opens by itself (`claims-review.tsx`, rendered always so a refresh never unmounts an
    open review).
  - The review is the list kind (`PopupContent kind="list"`): a 448 side panel at a desk, focus on the panel; its own
    screen in a hand under "Dashboard", the phone's Back closing it.
  - One event at a time (`pass=cards`, `claims-card.tsx`): the name, the date where the album shows one, "Added as
    Priya · 4 photos", up to four of its own photographs, a lock and the count for a password or private album; the
    progress in segments ("2 of 4"), one bar past twelve; the cards behind peek.
  - Saved as decided (`save=once`, `claims-actions.ts`): Claim writes one event at once; Not mine asks the confirm
    kind stacked over the panel at that card (`confirm=card`), "Permanently delete the 2 photos and videos added under
    your email at this event?", and only Delete writes; Go back writes nothing and returns focus to Not mine. Closed
    early, what she did stays done and the banner counts the rest as still waiting.
  - The double tap claims one (`claims-batch.ts`, pinned there and in `claims-review.test.tsx`): an answer names its
    card, a card waits for its write (and holds the top if a refresh behind it drops the row), an arriving card holds
    its answers 250 ms, reduced motion or not; a spinner only past 300 ms.
  - `next=both`: each claimed row offers Open album and the quieter Follow ("Follow Tom") where the host has a page,
    from `getClaimedEventNext`, read after the claim and only for an event she is now a guest of (none for a private
    album, herself as host, or a block either way).
  - The quieter Follow: `FollowButton`'s `quiet` (ghost, muted, `sm`; `name` where nothing beside it says who), on the
    claimed row and the moment card (ROADMAP line closed). ★ A follow that landed now stays followed where nothing
    re-reads the server (the moment card's used to spring back to Follow as its action ended; pinned).
  - One pointer a beat: the closing toast's page line yields to the invitation about to take the banner's place.
  - The previews (`20260927200000_claim_previews.sql`): `list_guest_rows_by_email` appends `event_visibility` and
    `preview_keys`; `getMyClaimableGuestRows({ previews: true })` merges an event's rows, four at most, presigns them
    stable, and reads the two columns defensively until the types regenerate; the welcome page presigns nothing.
  - "gone": an answer that lands after its event stopped waiting drops the card with "<event> isn't waiting for you
    anymore.", never reported as done.
  - Verified at 375 and 1440 (and ~894 and light) on a scratch harness mounting the real component with its writes
    stubbed, deleted after and never staged: every state above, measured, in
    `../partyreel-wt/_scratch/claims-wiring/verify-local.md`. The signed-in dashboard ran only as the mounted
    component: its live walk is the red-team's (below).
- **Assets requested from Will:** none.
- **Board ideas:** the review's end ("All sorted") could hold the page setup's invitation itself, the one pointer
  inside the place she just finished rather than a card under it after she closes it.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** `supabase/migrations/20260927200000_claim_previews.sql`
  (DROP + CREATE of `list_guest_rows_by_email(timestamptz, uuid, integer)`, `event_visibility` and `preview_keys`
  appended, grants restated authenticated-only). Drift before: the live body's md5 `a015e8252e27d0b23f45c93bcfaab810`
  equals `20260924020000`'s. Its rolled-back check (at its foot) held on the live schema on 2026-09-27: 22 rows under
  one confirmed address equal a hand tally with the event open, password and private; paged at 1 in the unpaged order;
  unconfirmed and signed out list nothing; one signature, DEFINER, the empty search_path, authenticated only; the live
  function unchanged after (md5 re-read). After applying: the body's md5 `2ab25b907b52401504a6a630f6ee0023`, advisors
  unchanged (it stays in 0029), regenerate `types.ts`. Apply before the merge so the previews ship with the review
  (the code runs without them either way). Vercel, Stripe, env: none.
- **Calls his to overrule:** an event she never reaches waits, only a Not mine deletes (r3's carried `unreached`,
  built); a review that only deleted closes with no toast (each Delete had its dialog); the card drops the old ticket's
  "last added" stamp (the board's call: the date says when), so a password event's card shows no date at all; a
  claimed private album offers neither Open album nor Follow (the Guest card's masking); the claimed row's Follow names
  the host, the moment card's does not (its row already does); a review closed with nothing left leaves focus on the
  page, the banner that opened it gone.
- **Look at first:** `src/components/app/dashboard/claims-review.tsx` (the whole review, its header naming each pick),
  then the migration's check. The live walk, the red-team's, on the alias once merged and applied: give a test
  account's confirmed address (lowercased) to a few name-only guest rows with live uploads on disposable test events,
  one at a password event (`update public.guests set pending_email = '<address>', pending_email_at = now() where id in
  (...)`), sign that account in through the chooser, and walk the review at 375 and 1440: a card's photographs, Claim
  (a Guest card joins Your events behind it), Not mine and its dialog, Delete (a disowned upload never reaches the
  host's bin), a double tap, closing early, Open album and Follow. A Delete removes those uploads for good.
