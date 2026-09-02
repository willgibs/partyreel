---
track: product-truth
status: integrated
merged: "d752a9b"      # the branch head merged into launch-prep
cut: "efe8118"
preview: true
owns:
  - src/lib/db/mutations/host-media.ts
  - src/app/api/stripe/checkout/route.ts
  - src/app/(app)/dashboard/
  - src/components/app/visibility-selector.tsx
  - src/app/admin/albums/
  - src/lib/upload/uploader.ts
  - src/app/(guest)/e/
  - src/lib/db/queries/media.ts
  - content/help/the-qr-wont-scan-or-the-link-wont-open.mdx
reads:
  - src/lib/constants/tiers.ts
  - src/lib/db/types.ts
  - src/lib/media/limits.ts
---
# lp/product-truth

**Goal.** The app and guest surfaces say only true things. The help catalog's research (2026-09-01)
found nine gaps between the copy and the product; this track closes the app-side ones, numbered as
the catalog numbered them: **1** the `Video uploads are available on the Pro plan.` wrapper string omits
the Event Pass; **2** `?upgraded=1` is set by checkout and never read, so a purchase has no
confirmation (read it once on the dashboard, one toast, then strip it from the URL); **3** the settings
selector says "Public" while the event header chip says "Open" (the chip changes, see the ruling);
**4** `restoreEventAction.mediaStillRemoved` is never surfaced (surface it through a LOCAL result type
for that action, never by widening the shared `ActionResult`); **5** the ops-only "missing ETag" upload
error can reach a guest (a guest-facing message, the ops detail to the log); **7** `tiers.ts`'s comment
still cites a retired 5-min/2-GB video limit (one comment line, the single exception to the lane, see
below); **8a** the guest 404 says the event "may have ended" (events have no end date); **8b** the
open-event unfurl promises "no account" even when the event requires one (key it on
`allow_anonymous_uploads`, the real column); **9** `lifecycle-recovery.md` says a guest's self-deleted
upload is excluded from the host's Deleted list while `listRecentlyDeletedMedia` applies no such filter
(a live check settles which is true, then either the query or the doc line changes). Gap 6 (the privacy
FAQ's "flag a photo or video") and the marketing side of gap 3 belong to the marketing follow-ons track.
Size M.

**Rulings in force.** (1) **Visibility word: "Public"** (Will, 2026-09-02: "Public sounds much
clearer than open"): the event header chip changes from "Open" to "Public"; "Open" is reserved for the
accepting-uploads state and never describes visibility; help copy follows. (2) **Gap 9 default:** the
bin hides uploader-deleted rows, matching what `restore_media` refuses, unless the live check shows the
doc was right all along. (3) **The account-required unfurl line, proposed default:** keep the title;
the description becomes "Add your photos and videos. This event asks guests for an email." (Will rules
on the words at review; propose alternatives in Handoff if the copy reads wrong in place.)

**Also touches, by ruling (explain in the lane check):** one comment line in `src/lib/constants/tiers.ts`
(gap 7). Nothing else outside `owns`.

**Verify on.** Locally against the real Supabase (`pnpm dev` + the service-role routes) for everything
signed-out: the guest 404, the unfurl (`curl` the event page and read the OG tags, both
`allow_anonymous_uploads` states on disposable events), the upload error path; Vitest for the pure
pieces and a rolled-back RPC contract check for any query change. Sign-in is allow-list gated off
localhost, so list the signed-in surfaces (the dashboard toast, the header chip, the restore action,
the admin albums page) under "Look at first" in Handoff: the Orchestrator walks them on the
launch-prep alias at integration.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- `docs/systems/lifecycle-recovery.md` (the "Delete-own from the Uploads tab" bullet, gap 9): the
  exclusion of uploader-deleted rows from the host's bin is `listRecentlyDeletedMedia`'s OWN
  `removed_by_uploader = false` predicate, added here; the RLS policy does not filter it, so dropping
  that line un-hides the rows. The doc had claimed the exclusion since the marker shipped.
- `docs/systems/guest-flow.md` (the `open` bullet under "State follows `visibility`", gap 8b): the OG
  description keys on `allow_anonymous_uploads` too, so an account-required event's unfurl never
  promises "no account". The doc stated no unfurl or 404 copy, so nothing there was stale; this is the
  one new fact. The 404 (gap 8a) needed no doc line: `not-found.tsx` carries the reason in a ★ comment.

## Deferred (ROADMAP one-liners, bucket named)

- **Now (concrete, pick-up-able):** the restore toast should read `mediaStillRemoved` (the action now
  returns it) so a host restoring an event with items still binned is told so. The consumer is
  `src/components/app/restore-event-button.tsx`, outside this track's lane; the exact block is in
  Handoff below.
- **Now (concrete, pick-up-able):** give the visibility WORD a server-safe home (e.g.
  `src/lib/events/visibility-labels.ts`) so the RSC chip, the client selector and marketing's
  `access-switch.tsx` read one record. An RSC cannot dot into `visibility-selector.tsx` because it is
  `"use client"`, so the chip re-types "Public" today with a comment saying why.

## Handoff

- Head `b7d63e5` plus this manifest commit, pushed; preview
  `partyreel-git-lp-product-truth-partyreel.vercel.app` (`preview: true`).
- launch-prep had moved one docs commit past the stub SHA at boot, so the branch fast-forwarded onto
  `cd8da95` before any work (`cut` records `efe8118`, the SHA the stub named). Re-checked at handoff:
  `git rev-list --count HEAD..origin/launch-prep` = 0, so no merge was needed.
- Gates on that tree, each run to its own exit code, never piped: typecheck ok, lint ok (0 errors, the
  one pre-existing React-Compiler warning in `contact-form.tsx`), test ok (1519 in 176 files), build ok
  (244 pages).
- Lane check `git diff --name-only origin/launch-prep...HEAD`:
  `content/help/the-qr-wont-scan-or-the-link-wont-open.mdx` · `docs/systems/guest-flow.md` ·
  `docs/systems/lifecycle-recovery.md` · `docs/tracks/product-truth.md` ·
  `src/app/(app)/dashboard/[eventId]/actions.ts` · `src/app/(app)/dashboard/[eventId]/page.tsx` ·
  `src/app/(app)/dashboard/page.tsx` · `src/app/(app)/dashboard/upgraded-toast.tsx` ·
  `src/app/(guest)/e/[token]/not-found.tsx` · `src/app/(guest)/e/[token]/page.tsx` ·
  `src/components/app/visibility-selector.tsx` · `src/lib/constants/tiers.ts` ·
  `src/lib/db/mutations/host-media.ts` · `src/lib/db/queries/media.ts` · `src/lib/upload/uploader.ts`.
  Every line sits under an `owns` prefix, is this manifest, or is one of the two system docs listed
  above, with ONE exception: **`src/lib/constants/tiers.ts`**, the comment line ruled in this manifest
  for gap 7 (the retired 5-min / 2-GB video pair). That edit is comment-only, inside the
  `videosAllowedForTier` doc block, and touches no value. Two owned paths were NOT touched because they
  were already true: `src/app/api/stripe/checkout/route.ts` (its `?upgraded=1` was right; the missing
  half was a reader) and `src/app/admin/albums/` (it already prints Visibility "Public" and Uploads
  "Open" / "Closed", which is exactly the ruling, and is the model the dashboard chip now follows).
- Proposed migrations / Worker / Vercel / Stripe / env changes: **none**. No schema, config or
  migration was touched. The live SQL was read-only introspection (`pg_get_functiondef`, `pg_policy`,
  `information_schema`, counts), two disposable events created and hard-deleted for the guest checks,
  and one rolled-back `DO $$ … RAISE EXCEPTION $$` probe. Nothing else in prod was written.
- **The one-block patch the first Deferred item needs** (in `restore-event-button.tsx`, after
  `const result = await restoreEventAction(eventId);`):
  ```tsx
  if (result.ok) {
    toast.success("Event restored.", {
      description:
        result.mediaStillRemoved > 0
          ? `${result.mediaStillRemoved} item${result.mediaStillRemoved === 1 ? "" : "s"} stayed in the Trash. Restore them from inside the event.`
          : undefined,
    });
    return;
  }
  ```
  Callers that only narrow on `ok` compile unchanged today, so nothing is broken while this waits.
- **Copy Will may want to rule on**: the account-required unfurl says, per the manifest's proposed
  default, "Add your photos and videos. This event asks guests for an email." It reads well in a link
  preview and does not repeat the event name (the OG title already carries it). If he wants the
  mechanism named rather than the ask, the alternative is "Add your photos and videos. This event asks
  guests to sign in with an email."
- **Look at first** (signed-in surfaces, unreachable from localhost because sign-in is allow-list
  gated; all four are host-side except the last):
  1. **`/dashboard?upgraded=1`** as the Pro host — one toast ("You're on Pro." if the webhook has
     landed, else "Payment received."), then the URL becomes `/dashboard` with no reload and no second
     toast. Appending `?upgraded=2` must show NOTHING.
  2. **The event header chip** on `/dashboard/<id>` for an open event: it must read **Public**, with
     the accepting-uploads chip beside it still reading "Accepting uploads" / "Uploads paused". The
     settings selector on the same event already said Public.
  3. **Restore** on a soft-deleted event card (dashboard Trash): still toasts "Event restored." and the
     card still moves to Your events. The action now returns the count, and nothing reads it yet.
  4. **`/admin/albums/<id>`** as the operator: unchanged, and it is the reference for the word pair.
  5. Also worth a glance while signed in as the host: an event's **Trash** section, which now omits
     uploader-deleted items (there are none in prod today, so it should look identical).
- Verified locally against the real Supabase, signed out, on `pnpm dev -p 3007` (3000 belongs to
  another worktree; stopped before `pnpm build`), on two disposable events created and deleted for
  this: the anonymous event's unfurl keeps "No app, no account, just your phone."; the
  account-required one says the event asks guests for an email; a nonsense token 404s with the new
  copy; a soft-deleted event 404s identically (the deletion cause, demonstrated rather than asserted);
  the gated event page still renders its "free account" gate; `/dashboard?upgraded=1` signed out
  still 307s to `/login`. Dev log clean. Both events hard-deleted afterwards, and the gap-9 probe rolled
  back: `select count(*) … qr_token like 'pttruth%'` = 0, probe rows = 0.
- **How gap 9 was settled** (the live check the manifest asked for, read-only + a rolled-back probe):
  `pg_get_functiondef('restore_media')` on prod still contains `removed_by_uploader = false`, and
  `pg_policy` on `public.media` shows the single policy `media_host_all` gating only on
  `events.host_id = auth.uid()`, with no uploader clause. So the DOC was right about the intent and the
  QUERY was the liar, exactly the ruling's default: the bin now filters. A `DO $$ … RAISE EXCEPTION $$`
  probe inserted one host-removed and one uploader-deleted row on a disposable event and reported
  `bin_without_filter=2 bin_with_filter=1 uploader_deleted_rows=1 purge_at_stamped=t`, then rolled back
  — so the hidden row keeps its purge clock and its standby bytes, as the doc says. Prod holds zero
  `removed_by_uploader = true` rows today, so no live data moves.
- **Not in scope, seen in passing** (no action taken, for whoever owns them): the guest-side twin of
  gap 1 in `src/lib/db/mutations/guest.ts` says "This event doesn't accept videos.", which is true for
  a guest and deliberately does not name plans, so it needs nothing. And the ETag refusal in
  `uploader.ts` now reuses the file's existing "Something went wrong with that upload. Please try
  again." sentence; if an operator would rather a persistent misconfiguration told the guest to tell
  the host, that is a copy call, not a code one.

## Record (the CHANGELOG paragraph, past tense, at most 12 lines)

Merged into `launch-prep` at `<sha>` (2026-09-02). The app and guest surfaces stopped saying untrue
things: eight of the nine gaps the help-catalog research found closed here, the ninth being
marketing's. The host video refusal named both paid plans, not Pro alone; a completed Stripe Checkout
finally got a confirmation, read once from `?upgraded=1` then stripped from the URL and worded by the
server so it never claims a plan the webhook has not written; the event header chip started saying
"Public" for `visibility = 'open'`, leaving "Open" to mean accepting uploads; `restoreEventAction` got
its own result type so `mediaStillRemoved` leaves the action rather than dying in it, without widening
the shared `ActionResult` (the toast reading it is deferred, in an unowned component); the "missing
ETag" bucket misconfiguration went to the console and left the guest copy they can act on; `tiers.ts`
stopped citing a retired 5-min / 2-GB video limit; the guest 404 stopped blaming an event for "ending"
in a product with no end date; the unfurl stopped promising "no account" where one is required; and the
host's Trash stopped listing a guest's own deletion behind a Restore `restore_media` always refused.
