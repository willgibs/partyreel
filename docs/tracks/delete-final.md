---
track: delete-final
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "f44300ec"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/media-lightbox.tsx
  - src/components/shared/media-lightbox.test.tsx
  - content/help/
  - src/app/(app)/dashboard/[eventId]/review/
  - supabase/migrations/20260923160000_withdrawn_out_of_standby.sql
  - src/lib/billing/storage-summary.test.ts
  - src/lib/db/queries/media.ts
  - src/lib/db/queries/media.test.ts
  - src/lib/export/
  - src/app/(dev)/design/sandbox/voice-guest/lines.ts
  - src/components/app/my-uploads-gallery.tsx
  - src/app/(guest)/u/[slug]/owner-sections.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/guest-flow.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/billing-caps.md
  - supabase/migrations/20260923140000_host_storage_summary.sql
  - supabase/migrations/20260729190000_qa_writespine_guards.sql
  - src/lib/db/queries/storage.ts
  - src/lib/lifecycle/recently-deleted.ts
---

# lp/delete-final

**Goal.** A guest's own delete is final and says so: the confirm reads that it is deleted from the event right away and can't be recovered (no window), no host surface shows or restores a guest-withdrawn item, and the host's Recently deleted figure counts only what the host can restore.

## The brief

**Will's words (2026-09-23), verbatim.** "if a guest deletes their own uploads, it should not be recoverable by the host. If I'm a guest and accidentally upload a wrong photo and move to delete it, I want it gone everywhere, not still visible to the host as well. In regards to the copy kept by our backup/redundancy systems, we can change the guest-facing copy to something closer to 'deleted immediately from event and cannot be recovered' so they don't confuse a 30-day hold with a host still having access. Feels like a much more confident deletion."

**What is already true (the Orchestrator checked):** a guest's own delete (`remove_my_upload` signed in, `remove_my_upload_by_session` without an account) marks the row `removed_by_uploader`; `restore_media` refuses such a row (`20260729190000_qa_writespine_guards.sql`, "a guest's self-deletion is private to the host"); the host's Deleted list excludes it (`src/lib/db/queries/media.ts:68-97`); the exports read approved items; the Privacy policy already says "An upload that a guest removes themselves, signed in or not, cannot be restored by that event's host." The object stays in storage until its purge (30 days, the trust-and-safety hold) and the backups keep their own copy; that backend retention stays.

**What changes:**
1. **The guest's own delete confirm** (`src/components/shared/media-lightbox.tsx`, "Delete this upload?"): the body becomes words close to Will's, "It's deleted from the event right away and can't be recovered." No window, no "permanently deleted after N days" (that reads like a hold the host can reach). The require-upload consequence sentence that follows it (the album closes until you add another) stays. Every other guest-facing sentence about a guest's OWN delete follows (find each: the profile owner mode's uploads, the help article `content/help/find-your-uploads-and-events.mdx:55` which quotes the confirm, any other article, the voice board's today line if it quotes it). The HOST's removal copy keeps its window ("moves to Deleted, where you can restore it for 30 days"): that one is the host's and is recoverable.
2. **Gone everywhere for the host:** audit every host surface for a guest-withdrawn item and pin the answer with a test where one is missing: the album grid and the viewer, the Deleted list and restore (already), Review (a pending upload the guest deletes leaves the queue), the dashboard's "Just arrived" strip and pulse, the hub's counts, the export and Download all, the old stored reel's items and its guest payload, like counts, the admin-free host reads. Fix any place that still shows one.
3. **The host's storage figure:** the meter's "+ X in Recently deleted" line (and the account page's equivalent) reads `host_storage_summary`'s `standby_bytes`, which today counts guest-withdrawn bytes the host can neither see nor restore. Write `supabase/migrations/20260923160000_withdrawn_out_of_standby.sql`: `create or replace` of `host_storage_summary(uuid)` (same signature, same grants re-stated: service-role only) where `standby_bytes` counts only what the host can restore (removed media NOT `removed_by_uploader`, plus media in a soft-deleted event), and a guest-withdrawn row counts in neither number; its rolled-back check at the foot (a guest-withdrawn row moves neither figure; a host removal moves standby; active still equals `host_active_bytes`). Update `src/lib/billing/storage-summary.test.ts`'s parity pin to the new standby filter. The Orchestrator applies the file at the merge; lanes never call `apply_migration`. (The purge cron's bin BUDGET gets the same rule in the 1,000-row lane, which owns `src/app/api/cron/purge/`; do not touch that file.)
4. **Docs:** `docs/systems/guest-flow.md`'s "A withdrawal is final for the host" line states the copy and the figure; `docs/systems/lifecycle-recovery.md` and `billing-caps.md` where they define standby.

**Boundaries.** Another lane (`upload-owner`) owns `src/components/guest/`, `src/lib/guest/`, `src/app/api/guests/`, `src/lib/upload/` and the r2 upload routes: if a guest-facing delete sentence lives there (for example `live-gallery.tsx`'s consequence line), list the exact line in your Handoff for the Orchestrator rather than editing it. The 1,000-row lane will own the purge cron and any query it pages; keep your query changes to the files named in your owns.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The stored reel mp4's stale rung can still carry a withdrawn photo** (outside this lane: `src/lib/reel/guest-download-plan.ts:14,40` and `src/app/api/reel/download/route.ts`). A guest whose device cannot encode is handed the host's stored mp4 even when it is stale (`fresh: false`), so a reel rendered before a guest withdrew a photo still shows that photo to other guests until the host renders again (the host's own path re-renders on a hash change; the live player and the guest payload's `item_ids` are approved-only and pinned). Recommended: under "gone everywhere", drop the stale rung for guests (stale + cannot encode becomes `ask_host`) inside the reel round's wiring, whose drop migration sweeps the stored files anyway.
- The brief's other recommended answers were built as written; the calls I took are below.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the invariant "A withdrawal is final for the host" now names the surfaces, the Deleted figure, the confirm's words and why no window, and the pin (hand-merged in the sync with `upload-owner`'s "UPLOADS ARE HELD TO THE SAME OWNER" bullet directly under it); the own-photographs bullet says the confirm never names the window and that the personal Uploads' host arm is `isHost`, with the host's words.
- `docs/systems/lifecycle-recovery.md`: `standby_budget` (the sweep's own sum counts a withdrawal; the meter's figure is narrower), the delete-own bullet (final for that host, in neither storage figure, the two confirms), the UI bullet (the meter's X is only what the host can restore).
- `docs/systems/billing-caps.md`: `host_storage_summary`'s Deleted filter is the negation less a guest's own withdrawal.

## Deferred (ROADMAP one-liners, bucket named)

- Now: `src/lib/db/queries/storage.ts`'s `tallyStorageRows` and its header (lines 8, 39, 47, 51) still define standby as "everything not active"; its row shape has no `removed_by_uploader` and no read calls it: retire it, or carry the marker.
- Now: `restore_event`'s `media_still_removed` (20260729190000, line 441) counts a guest's withdrawals too; no screen shows it today, and a future "N items stay in Deleted" line must count `removed_by_uploader = false` only.
- Now: `src/app/(guest)/u/[slug]/owner-mode.test.ts`'s allowed-reader list could name `listEvents` (the owner-RLS read `owner-sections.tsx` now makes; its regexes only catch `get*` names).

## Handoff (replaces the chat report)

- Work commit `c173313e`; sync merge `feb4c6c4` (launch-prep had moved to `d5b2187b`: `upload-owner` merged; `guest-flow.md` hand-merged). Both pushed.
- Gates on the synced tree (`feb4c6c4`), each on its own exit code: `pnpm design:rules` 0 (no diff); `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` 0 (no diff); `pnpm typecheck` 0; `pnpm lint` 0 (8 warnings, none in a touched file); `pnpm test` 0 (382 files: 4227 passed, 1 expected fail, which is `media.test.ts`'s tripwire below, 1 skipped as before); `pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (519 checks, 0 failing). No board, so no `lab:demo`. Logs in the lane's scratch directory (`sync-*.log`).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`: `content/help/find-your-uploads-and-events.mdx`, `content/help/hide-remove-and-restore.mdx`, `content/help/how-long-media-is-kept.mdx`, `content/help/report-a-problem-as-a-guest.mdx`, `content/help/reporting-and-safety.mdx`, `content/help/your-data-and-deleting-your-account.mdx`, `docs/design/library.md`, `docs/systems/billing-caps.md`, `docs/systems/guest-flow.md`, `docs/systems/lifecycle-recovery.md`, `docs/tracks/delete-final.md`, `src/app/(dev)/design/rules/rules.generated.json`, `src/app/(guest)/u/[slug]/owner-sections.tsx`, `src/components/app/my-uploads-gallery.tsx`, `src/components/shared/media-lightbox.test.tsx`, `src/components/shared/media-lightbox.tsx`, `src/lib/billing/storage-summary.test.ts`, `src/lib/db/queries/media.test.ts`, `src/lib/db/queries/media.ts`, `supabase/migrations/20260923160000_withdrawn_out_of_standby.sql`. That is owned paths, this file, the three listed system docs, and two files DERIVED by the gate's `pnpm design:rules` (`rules.generated.json`, `docs/design/library.md`): `media-lightbox.test.tsx`'s three new titles, collected as `unverified-mark.tsx` contracts by that file's existing `@contract-for` line. `voice-guest/lines.ts`, the Review route and `src/lib/export/` needed no change (no delete line in the first; the other two already drop removed rows, pinned).
- The items:
  1. The confirm (`media-lightbox.tsx`): a guest's own delete reads "It's deleted from the event right away and can't be recovered." with no window; the require-upload consequence line still follows. Pinned by meaning, not wording, in `media-lightbox.test.tsx` (no window, no "Deleted"; the consequence still appended); a mutation check reverting either branch fails them.
  2. A host's own upload on the personal Uploads (`remove_my_upload`'s host arm, restorable) keeps the host's words (Deleted, and the window), through one shared `HostRemovalWords` the curate group's Remove now uses too; `owner-sections.tsx` marks those items `isHost` off the viewer's own events (`listEvents()`, owner-RLS), because get_my_uploads splits its arms on the event's host.
  3. Host surfaces audited against a withdrawal; the new `src/lib/db/queries/media.test.ts` runs each read against one fixture (a withdrawal that is the event's NEWEST upload, one that is the bin's SOONEST purge) through an in-memory PostgREST stand-in that applies the filters a read sends: the album, viewer, Review and Download all (`listEventMedia`), Deleted (`listRecentlyDeletedMedia`), the home's pulse, the events list's counts and cover, the reel timeline (`resolveReelRenderContext`) and the guest RPC's items (read off the migration). Already pinned elsewhere and named in its header: `restore_media`'s refusal, the reel's membership, the guest count and Guests room, the zip manifest. Mutation-checked: dropping either `media.ts` filter fails its pin.
  4. The one leak left is outside the lane: the bell's "Items in Deleted are about to be cleared" nudge (`notifications.ts`) fires on a guest's withdrawal. Pinned as `it.fails` at `media.test.ts:308`, which fails the day its filter lands (checked by applying the fix locally and reverting).
  5. `supabase/migrations/20260923160000_withdrawn_out_of_standby.sql` (UNAPPLIED): `host_storage_summary`'s `standby_bytes` is only what the host can restore, `not (active) and not (m.status = 'removed' and m.removed_by_uploader)`, a withdrawal in neither number; the foot holds a six-step rolled-back check riding the real `remove_my_upload_by_session`. `storage-summary.test.ts` pins the new filter off the migrations (fails without the file, and with the withdrawal arm removed) and ties it to `restore_media`'s refusal and `get_upload_gate`'s spelling.
  6. Help, every sentence about a guest's own delete: `find-your-uploads-and-events` (the confirm's words and finality, plus the host-arm exception), `hide-remove-and-restore` (a withdrawal never appears in Deleted and leaves the meter's figure), `how-long-media-is-kept`, `your-data-and-deleting-your-account`, `reporting-and-safety`, `report-a-problem-as-a-guest`; checked rendered locally at 1440 and 375 (no horizontal scroll).
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: apply `supabase/migrations/20260923160000_withdrawn_out_of_standby.sql` (the lane never called `apply_migration`). Drift `md5(prosrc)` before: `69da923b75dc57e3b7720e2eb25e5af8` (read live 2026-09-23); after: `027f9b30ac11e31b60c7f1153239cd60` (the file's body; its whitespace-collapsed md5 `bdf9ba52c0c2d285c59679486beecf10` is what the live proof printed). Grants unchanged: service_role only (the file re-states the revoke and adds an explicit service_role grant). No `types.ts` change (same signature). Proof: the migration EXECUTEd verbatim, then the foot's check, in ONE `DO` block on the live schema, ending in the deliberate raise `ROLLED BACK: every host_storage_summary check held (hosts 2, withdrawal 274850 bytes, host removal 242438 bytes, deleted event 10332972 live bytes, body md5 bdf9ba52...)`; afterwards the live body md5, the 4 withdrawn rows, 1 host-removed row, 0 deleted events and willg97's standby 2516329 all read as before. Once applied, willg97's "+ X in Deleted" drops from about 2.5 MB to about 27 KB (four guests' withdrawals, 2489383 bytes, leave it). Apply before or with the cron lane's bin-budget rule: until then the sweep's own sum still counts withdrawals the meter no longer shows.
- For the Orchestrator, outside the lane (the brief: "keep your query changes to the files named in your owns"):
  - `src/lib/db/queries/notifications.ts:57`: add `.eq("removed_by_uploader", false)` after `.eq("status", "removed")`; then `it.fails` becomes `it` at `src/lib/db/queries/media.test.ts:308`.
  - `src/components/marketing/sections/features/album/album-faq.ts:36` says a guest deletes "From their dashboard" (stale) and not that it is final; suggested: "Yes, right on the album or from their profile, and it's gone for good: you can't restore it. As host you can remove anything."
  - `upload-owner`'s `live-gallery.tsx` consequence line needs nothing: it names no window.
- Calls his to overrule:
  - The confirm's words are the brief's: "It's deleted from the event right away and can't be recovered."
  - A host's own upload deleted from Your uploads keeps the host's words; the side effect is the "Host" badge in the viewer's credit capsule on those items. The alternative: carry `is_host_upload` through `my-uploads.ts` and `toMyUploadsItems` (three lines in two unowned files) and drop the extra `listEvents()` read.
  - "Only what the host can restore" means what the host's Deleted lists: an operator takedown or a held row stays in the figure (Deleted shows it; Restore refuses it discreetly); only a guest's withdrawal leaves.
  - Help fixed beyond the delete lines, inside paragraphs I was already editing: `hide-remove-and-restore`'s stale path ("Settings › Deleted" is now "View › Deleted"; the dashboard's "chip" is the Show menu) and `your-data`'s "your dashboard's Uploads" (now Your uploads on the profile) and "remove photos ... from the event's settings" (now from the album).
  - `it.fails` is new in this repo: a tripwire for a known leak outside the lane.
- Look at first: the migration (header, the standby filter, the foot); `media-lightbox.tsx`'s own-delete confirm; `owner-sections.tsx`'s `isHost` marking; `media.test.ts`. Live on alias build 4 (localhost cannot reach the confirm: an own upload needs sign-in or an upload, both allow-list-gated, so it is unverified by eye): as a name-only guest, upload then delete (the confirm's words; gone from the host's album, Review and Deleted); on willg97's profile, a host-arm item (the Host badge, the host's words) beside a guest-arm one (the final words); after the apply, willg97's "+ X in Deleted".
