---
track: trash-in-storage
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "4c25f9af"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/lifecycle/
  - src/components/app/storage/
  - src/lib/db/queries/storage
  - src/app/(app)/dashboard/storage-actions
  - src/app/api/stripe/change-plan/
  - supabase/migrations/20261003220000_
  - docs/systems/billing-caps.md
  - docs/systems/lifecycle-recovery.md
  - docs/PRD.md
  - docs/PRICING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/host-app.md
  - docs/systems/admin-observability.md
  - src/lib/constants/tiers.ts
---

# lp/trash-in-storage

**Goal.** Deleted counts in storage (Will, 2026-10-03): a plan's cap holds everything a host keeps, her albums and her Deleted together, so deleting no longer frees room until an item leaves Deleted for good (by her, by the 30-day purge, or, with her account setting on, the oldest first when a new upload needs room). The storage chart shows used and deleted apart; the standby budget and every guard it needed retire.

## The brief

**Will's words (2026-10-03), in full:** "Let's include trash in storage. I know that's a huge change in our structure, but a much more elegant way to handle everything. One of those simpler solutions that prevents more edge cases to deal with, like the deletion timer. Storage visual chart can show used vs delete separately, and maybe an account setting toggle to auto-delete trash if needed by FIFO if active space needs more storage, else 30 day permanent delete from trash. think that's a very clear mental model for users, and they only ones who would be frustrated by not being able to use more that your full active storage space would be those looking to abuse anyway. if you'd rather not have to delete permanently from your trash to free space, upgrade your plan. seems like a Rising Tides miss up until now. Also prevents us from paying for any overage beyond backup cost at full 1:1 (i think), which is awesome."

**Why.** Today (PRD "Data retention and lifecycle"): a host's delete frees her room at once, and her Deleted bin holds up to one more storage cap, oldest evicted first (the standby budget, `lifecycle/sweeps/standby-budget.ts`). That doubled what a plan can store, and needed a re-delete guard to stop a restore-and-delete cycle hoarding (PRICING.md's preconditions). Will's model replaces both: one number, everything kept, under the cap.

**Build:**
1. **The cap counts Deleted.** Everything a host's account stores, active and in Deleted, is what her plan's cap holds. Name it once in SQL as the one read every cap check uses: `create_media*`'s refusal at the cap plus its 10%, the presign's `meter_upload` room check, a plan change's "you're storing" check (`/api/stripe/change-plan`), and the over-capacity grace. A guest's own withdrawal still purges that night (it never sits in her Deleted).
2. **Deleting frees nothing until an item leaves Deleted for good:** her own "delete forever" (and an "Empty Deleted"), the 30-day purge, or the account setting below. Restore always fits, since it is already counted.
3. **The account setting**, in Will's words "auto-delete trash if needed by FIFO if active space needs more storage": when a new upload needs room and the setting is on, the oldest items in Deleted leave for good first, as many as it takes. Otherwise the upload is refused with the room it needs and what is in Deleted. It works for the host's own uploads and her guests' alike, at the moment the room is needed (presign or complete: your design), and the bytes stop counting at once even while R2's deletes follow through the existing purge.
   - **Question, with your recommendation:** its default. My lean is on, because a full Deleted must never refuse a guest's photo at a party (PRICING's own rule: blocking a real event by mistake is the failure worth engineering against), and the setting says plainly what it does.
4. **The storage chart** (`src/components/app/storage/`): used and deleted shown apart against the cap, with words a host reads at a glance, and the setting beside it.
5. **Retire what the old model needed:** the standby budget's eviction (its sweep and its job, the job catalog's entry retired the way a job retires), the re-delete first-date idea (PRICING's precondition list), and every line that said "its room frees at once". The 30-day purge stays.
6. **System removals** (over-capacity, Free's inactivity) land in Deleted as today and count like any other. Say what that means for an over-cap account's grace, as a Question with your recommendation.
7. **The docs, in place:**
   - PRD's retention section;
   - `billing-caps.md`;
   - `lifecycle-recovery.md`;
   - PRICING.md's Model, its Deleted lines and the preconditions (the worst month drops the bin's doubling).
   - The help articles that promise "its room frees at once" are listed in your Handoff for a follow-up lane, never edited here.

One migration under your reserved prefix, written for the Orchestrator: the Advisor reads it, then it is applied by protocol. `create_media*` change, so restate their holders exactly, and include a rolled-back check, red then green, at its foot. Nothing live holds real data (Stripe is in TEST, zero real users), but partyreel.com shares the database: say what milestone 34 sees between the apply and the next milestone, or make it an expand.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; red first for the cap counting Deleted, a delete freeing nothing, restore always fitting, the setting on and off (her upload and a guest's), the over-cap path and the retired eviction; the migration's rolled-back check red then green; captures of the storage chart at 375 and 1440 (empty, half used with some deleted, full with the setting on and off).

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed under "Calls his to overrule".

- **Q1. The setting's default: ON** (the brief's lean, kept). A full Deleted must never refuse a guest's photo at a
  party, and the switch says what it does: "Make room from Deleted: when an upload needs room, the oldest items in
  Deleted are deleted for good first." `profiles.make_room_from_deleted`, default true, hers to write.
- **Q2. Where room is made: at the complete, never the presign.** The complete holds the host's profiles lock and
  judges the R2 HEAD's real size; a presign's size is the client's word, so a phantom presign (never sent) would
  otherwise empty a host's Deleted for nothing. The presign's meter refuses only what no eviction could fit (its line
  is active bytes with the setting on, everything stored with it off), so a guest is never sent to upload a file the
  complete will refuse. The guest presign's advisories (`get_upload_context`, `get_upload_gate`, the host's
  `get_host_upload_context`) read the same line, so Require an upload to view still fails open at a truly full album.
- **Q3. What leaves first:** items, oldest first by when each entered Deleted (a deleted event's photos at the event's
  deletion, largest first among them so the fewest go), never more than the upload needs; an event the eviction empties
  leaves Deleted with its last item. Held or reported items leave her count like any permanent delete, their bytes
  waiting on the keeper (`purge_asked_at`, as `purge_media_now` already does).
- **Q4. The over-cap grace (the brief's item 6): it reads what she keeps by choice,** everything stored but the
  system's own removals waiting in Deleted. At the deadline, what she already deleted leaves for good first (oldest
  first, whatever her setting: nothing she kept is touched while her own Deleted can cover it), then her largest files
  move to Deleted as today, recoverable for 30 days. Those count like anything in Deleted, so until they purge her
  uploads are refused (or, with the setting on, take room from them, oldest first); restoring one comes back only while
  it fits beside what she keeps (today's gate, kept for system removals alone), so a restore-and-reduce cycle cannot
  keep an over-cap account over for good. Her own deletions always restore. The grace mails say "free up space" for
  "remove some media", and the reduce mail says what left Deleted.
- **Q5. A guest's own withdrawal purges that night, every album** (the brief's sentence; today only a camera shot's
  does, and the rest waited 30 days counted nowhere: storage nobody's plan pays for). A hold or an open report still
  keeps it, as it keeps any row.
- **Q6. The size list frees room with Delete for good.** Remove to Deleted frees nothing now, so the list's act on a
  selection is Delete for good (behind a confirm: there is no Undo), Deleted heads the list with Empty Deleted, and the
  goal strip counts what those free; Download stays.
- **Q7. Restore always fits** for her own deletions (already counted); an item or event past its 30 days is no longer
  restorable even before the night's purge takes it, so what she can restore is exactly what she is counted for.
- **Q8. Empty Deleted lives beside the chart** (account-wide, behind a confirm), marking every item to leave for good
  at once (its bytes stop counting; R2 follows in the night's purge, as the eviction does). A Delete forever on a
  deleted event's own card is Deferred.
- **Q9. Milestone 34 between the apply and the next milestone:** an expand (see the migration's head): it keeps
  `standby_hosts` and `host_storage_summary`'s two columns, so its meter, guard and nightly sweeps keep working; what it
  meets is the new cap on uploads (Deleted counts; with the setting on, the oldest of Deleted makes room), restore
  without a gate, and a guest withdrawal purging that night.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md` "The cap model": the cap holds her albums and her Deleted together
  (`host_storage_summary`); `create_media*` make room from Deleted under her setting; Make room from Deleted and the line
  an upload meets (`host_room_used`); the storage chart; the meter's numbered room refusal; the three counters (a delete
  frees nothing; the physical meter drops when a row is asked); the summary's figures (`storedBytes`). "Plan changes":
  the guard compares what she stores, Deleted included. "The in-app pricing surface": the cards and the size list's
  Delete for good, Deleted at its head, "Delete and switch".
- `docs/systems/lifecycle-recovery.md`: the 30-day window (inclusive start; every guest withdrawal purges that night);
  "Deleted counts in storage" (`host_deleted_media`, the one definition); `leave_deleted` (order, asking, the emptied
  event, the lock order); making room and Empty Deleted; restore always fits (the system removals' gate, past 30 days
  not hers, the lock first); the over-capacity grace on kept bytes, her own Deleted first at the deadline; the standby
  sweep gone from the drain list.
- `docs/PRD.md` "Data retention and lifecycle"; `docs/PRICING.md` the Model, the atlas's Active media and Deleted lines,
  rule 2, the bounds, the worst month, the archetypes, the lever table and the preconditions (recomputed with
  `_scratch/cost-atlas`'s model, the bin set to a refill day's peak: `_scratch/trash-in-storage/atlas2/`).
- Exceptions, one line each, outside the lane: `docs/SYSTEMS.md` (its map row named the standby budget),
  `docs/systems/trust-safety-forensics.md` (an operator's removal: "the standby budget never counts or evicts it" became
  Deleted never counts it nor makes room from it), `docs/systems/disposable-mode.md` (the camera's withdrawal rule is
  now every album's, and the cap reads what the host stores).
- For the Orchestrator, in docs this lane reads and never edits:
  - `database-security.md`: the advisor line (`0029` 35 → 36 with `empty_deleted`); the authenticated-only list gains
    `empty_deleted`; the service-role-only list gains `host_room_used` and `leave_deleted`; `host_deleted_media` is the
    owner's alone (as `event_door_asks`); hosts write `profiles.make_room_from_deleted` too; the capacity-lock bullet:
    `leave_deleted` and `empty_deleted` take the host's profiles row first, and the restores take the caller's own row
    first.
  - `host-app.md:484`: "Remove is soft ...: it frees storage at once" (it moves to Deleted and still counts until it
    leaves for good).

## Deferred (ROADMAP one-liners, bucket named)

- Upkeep: the contract migration once a milestone serves this lane's build (partyreel.com no longer calling it): drop
  `standby_hosts` (and its pins in `upkeep-migrations.test.ts`, `deleted-events-index-guards.test.ts`,
  `reports/migration.test.ts`, the sweeps describe of `db/migration-guards.test.ts`, and ROADMAP's `standby_hosts`
  performance line), and rename `host_storage_summary.standby_bytes` to `deleted_bytes` (DROP + CREATE) with
  `readHostStorageSummary` (trash-in-storage).
- Host app: a deleted event's own Delete forever on its Deleted card; today Empty Deleted takes every deleted event at
  once, or one event's items after its restore (trash-in-storage).
- Admin: the account view shows what an account stores and its Deleted beside its active bytes (`getAccountDetail`)
  (trash-in-storage).
- Help: the articles listed in the Handoff say Deleted counts in storage, and the help gains Make room from Deleted,
  Empty Deleted and the storage chart (trash-in-storage).
- Cost: an asked row nothing keeps waits for the night's purge, so a refill day's R2 peak holds the old set beside the
  new (PRICING's ≈0.11 × the cap at 3×); reclaiming those at once, R2 first, would drop it (trash-in-storage).
- Host app: `get_host_upload_context`'s early "Storage is full for your plan" could carry the meter's numbers too (only
  when her albums alone sit at the line) (trash-in-storage).

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/trash-in-storage`:** `a530a272` the Questions; `a04a1ff9` the migration; `cfb2f850` the code;
  `0bd36746` the sync (a merge of `origin/launch-prep` at `44b2a954`, crumbs-62 and pricing-research in, no conflict);
  `db56a97b` the docs and the over-capacity cases; `2dbaf352` the host's room words and the Library's polish;
  `58ec63e6` a comment in the migration's head; `36f43004` this file; `e968be9d` the second sync (`0e45140f`, docs
  only: ROADMAP and the pickup); then this file alone.
- **Gates on the synced tree, `e968be9d`** (logs in `../partyreel-wt/_scratch/trash-in-storage/`, exits in
  `gate-exits-synced.txt`): `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (877 files, 10,535 tests,
  `gate-test-synced.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build-synced.log`),
  `pnpm lab:smoke --base http://localhost:3131` 0 (154 checks, `gate-lab-smoke-synced.log`). The same five green on
  `2dbaf352` before it (`gate-exits.txt`). No board, so no `lab:demo`.
- **Red first, each:** the migration's foot (`supabase/migrations/20261003220000_deleted_counts.sql:1396`, RESULT at
  `:1875`): LIVE RED without its statements 13/15 failing on what each lacks, GREEN with them 15/15, run again on the
  final file (`_scratch/.../green2_min.sql`), nothing persisted (a read afterwards: no column, none of the four
  functions, `create_media` still `e83666cd`). It covers the cap counting Deleted (steps 2-3), a delete freeing nothing
  (4), making room oldest first for her upload and a guest's (5), past what Deleted can free (6), `leave_deleted` (7),
  Empty Deleted (8), restore always fitting (9), the meter's line by the setting (10), the advisories (11), the
  withdrawal's night (12), Let back in (13), every grant (14), the bodies' hashes (15). The over-capacity path:
  `src/lib/lifecycle/sweeps/over-capacity.test.ts`'s four new cases fail 3 of 4 on the old sweep
  (`red-over-capacity.log`) and pass 10/10 on this one (`green-over-capacity.log`). The retired eviction: the cron's
  budgeted list (`src/app/api/cron/purge/route.test.ts`) without it, its sweep and tests deleted, `operator-removal.test.ts`
  on `leave_deleted`. The UI: `storage-list.test.tsx` (17), `storage-chart.test.tsx` (11), `storage-figures.test.ts`.
- **Captures** (`_scratch/trash-in-storage/captures/`, the Library's real components in a headless Chrome of mine):
  `chart-{empty,half,full-on,full-off}-{375,1440}.png` and their `-dark` twins, the entry pages, the ring's popover in
  situ (`meter-popover-{375,1440}.png`), the size list and its confirm (`size-list-*.png`). The four states are the
  Library's new StorageChart entry (`/design/library/storage-chart`). Driven by hand in my own pane tab too: Delete for
  good asks, deletes and says what it freed; Empty asks and empties.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is 34 owned paths, this file, and 44 exceptions:
  - every reader of the summary's figures, now `storedBytes` (her albums and her Deleted): the dashboard, account,
    event and new-event pages (and two page tests), `lib/events/readiness.ts` (a comment), the checkout and plan-facts
    routes (and tests), `lib/billing/plan-facts.ts`, the pricing sheet (and test) and `pro-price-list.tsx` (its "shrinks
    Deleted" note retired), `lib/billing/storage-guard.ts` (the refusal says "free", not "remove");
  - the ring's popover holds the chart: `components/app/dashboard/storage-meter.tsx`; the grace banner's words
    (`grace-banner.tsx` and its test); the over-cap mails (`lib/email/templates.ts` and its test);
  - the standby sweep retired: `app/api/cron/purge/route.ts` and its test, `app/admin/jobs/catalog.ts` (a comment's
    count), `lib/jobs/sweep-tally.test.ts`;
  - the SQL guards that read the new bodies, each reshaped with its scar named: `lib/db/migration-guards.test.ts`,
    `lib/db/row-cap-sql.test.ts`, `lib/disposable/migration-guards.test.ts`, `lib/forensics/migration-guards.test.ts`,
    `lib/upload/phone-copy-migration.test.ts`, `lib/upload/server-pipeline-meter-migration.test.ts` (narrow: the
    winner may be a later in-place replace), `lib/billing/storage-summary.test.ts`;
  - the meter's numbers into the owner's words (narrow, after crumbs-62 merged): `lib/upload/server-pipeline-meter.ts`
    and its test, `app/api/host/r2/presign-upload/route.ts` (one case calls `roomRefusalWords`);
  - the Library and the sandbox: `composition-demos.tsx`, `gallery-demos.tsx`, `specimens.generated.json`,
    `sandbox/host-dashboard/dashboard.tsx`;
  - comments naming the retired eviction: `lib/db/queries/media.ts`, `lib/forensics/legal-hold.ts`;
  - the three doc lines under System-doc edits.
- **The items:**
  - The migration (an expand): Deleted defined once, the summary's third figure, the cap holding everything stored,
    Make room from Deleted at the complete, the meter's and the advisories' line, restore always fits, Empty Deleted,
    every withdrawal purging that night, Let back in no longer erroring on a row that left for good (a latent CHECK
    error RED step 13 found live).
  - The storage chart in the ring's popover: albums and Deleted apart against the cap, one sentence when it matters,
    Make room from Deleted (asks only when it turns off), Empty Deleted (asks). The ring is everything stored, amber on
    what an upload must fit beside.
  - The size list frees room the one way room frees: Delete for good behind a confirm, Deleted at its head with Empty,
    the strip's "Delete and switch"; Download stays. Remove to Deleted and its Undo retired.
  - The plan's guard, the sheet and the Plan card read what she stores, her Deleted included.
  - The over-capacity grace reads what she keeps by choice; at the deadline her own Deleted leaves first, then her
    largest files; the mails say which, and that an upload may take Deleted's room before its date.
  - The standby budget retired: its sweep, its tests, its cron slot.
  - The host's upload refusal says the room the file needs and how her setting lets her make it.
- **Help, for a follow-up lane (never edited here):** `content/help/storage-plans-and-limits.mdx` (the description's
  "Deleting frees room at once", the "Anything in Deleted" line, the ring's paragraph);
  `what-happens-when-storage-fills-up.mdx` (the description's "it frees instantly", "Space comes back the moment you
  do", "Restore refuses", the lapse paragraph's order); `hide-remove-and-restore.mdx` ("Its space comes back to your plan
  immediately", "Restoring needs room"); `upgrade-downgrade-or-cancel.mdx` ("Removing frees space the moment you do it
  ... A smaller size also shrinks Deleted"); `messages-guests-might-see.mdx` (the full album's row: "uploads resume at
  once"); `how-long-media-is-kept.mdx` (the lapsed pass's order, and Deleted's section); `how-long-an-event-pass-lasts.mdx`
  (the lapse's trimming order). And the pricing FAQ's "space frees immediately"
  (`src/components/marketing/sections/pricing/pricing-faq-data.ts:55`), `pricing-wiring`'s to take.
- **Assets requested from Will:** none.
- **Board ideas:** the chart and its setting were drawn from production patterns with no board: a board could weigh the
  bar against a two-arc ring, where the setting lives (the popover alone, or the Plan card too) and the amber rule. An
  account-wide Deleted screen (everything in it, oldest first, with Restore), which the size list's Deleted row would open.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** `supabase/migrations/20261003220000_deleted_counts.sql`,
  by the protocol at its head: the drift read (its md5s; checked again 2026-10-03, unchanged), the rolled-back proof at
  its foot, apply verbatim BEFORE this lane's build deploys (it calls `empty_deleted` and `leave_deleted`, reads
  `system_bytes`, writes `make_room_from_deleted`), advisors 19/4/35 → 19/4/36, then regenerate `src/lib/db/types.ts`
  and drop the typed seams: `src/lib/db/queries/storage.ts` (`SummaryRow`), `src/app/(app)/dashboard/storage-actions.ts`
  (`untyped`), `src/lib/lifecycle/leave-deleted.ts` (the client cast), `src/components/app/storage/storage-figures.ts`
  (`makeRoomFrom`'s parameter). Milestone 34 and build 50 keep working (the head says what they meet). No Worker,
  Vercel, Stripe or env change.
- **Calls his to overrule:** Q1 the setting on by default; Q2 room made at the complete, never the presign; Q3 what
  leaves first (oldest first, a deleted event's own largest first, never more than the upload needs); Q4 the grace on what she keeps, her
  own Deleted first at the deadline, a system removal's restore gated; Q5 every guest withdrawal purges that night;
  Q6 the size list's Delete for good and Empty; Q7 restore always fits, nothing past 30 days; Q8 Empty Deleted beside
  the chart (a deleted event's own Delete forever deferred); Q9 an expand, milestone 34 meeting the new cap.
- **Look at first:** the captures (`captures/chart-*-375.png`, `meter-popover-375.png`); `create_media`'s cap block
  (`supabase/migrations/20261003220000_deleted_counts.sql:494`) and `leave_deleted` (`:201`); the deadline's order in
  `src/lib/lifecycle/sweeps/over-capacity.ts:345`. And the smoke's PREMISE lines: open asks on `host-dashboard` (3),
  `event-header` (2) and `the-wait` (1) describe files this change touched, to re-read before his next sitting.
  ROADMAP's "an upload reads the host's active bytes three times" now reads what she stores (`host_room_used` at the
  context and the meter, the summary at the complete, twice when it makes room): its counter idea still holds.

## Where I am

- Handed off; the Handoff above is the record.
