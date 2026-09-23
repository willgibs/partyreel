---
track: delete-final
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
