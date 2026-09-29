---
track: crumbs-15
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "818555b8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/reports/
  - src/lib/db/mutations/report.ts
  - src/lib/db/mutations/report.test.ts
  - src/lib/db/queries/event-doors.ts
  - src/lib/db/queries/event-blocks.ts
  - src/lib/db/queries/social.ts
  # added at boot (2026-09-29): every other path a seam reaches, found by the grep, the two Handoffs and the compiler
  - src/lib/db/triage-seam.ts
  - src/lib/db/queries/reports.ts
  - src/app/admin/reports/actions.ts
  - src/lib/lifecycle/reclaim.ts
  - src/lib/lifecycle/sweeps/removed-media.ts
  - src/lib/db/mutations/media.ts
  - src/lib/db/mutations/media.test.ts
  - src/lib/db/mutations/event-doors.ts
  - src/lib/db/mutations/guest.ts
  - src/lib/db/mutations/events.ts
  - src/lib/db/queries/events.ts
  - src/lib/db/queries/event-doors.test.ts
  - src/lib/db/queries/social.test.ts
  - src/app/api/album/guest/owner-gate.test.ts
  - src/lib/db/mutations/event-doors.test.ts
  - src/lib/db/queries/guest-events.ts
  - src/lib/events/closed-door.server.ts
  - src/lib/events/closed-door.server.test.ts
  - src/lib/events/album-viewer.server.test.ts
  - src/app/api/guests/door/
  - src/lib/db/mutations/event-blocks.ts
  - src/lib/db/mutations/event-blocks.test.ts
  - src/lib/db/queries/event-blocks.test.ts
  - src/app/(app)/account/social-actions.ts
  # added at handoff: the test of an owned file, which the two typed reads it pins reshaped
  - src/lib/db/queries/reports.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/systems/trust-safety-forensics.md
---

# lp/crumbs-15

**Goal.** Drop the missing-schema seams the doors and the triage rebuild carried until their migrations applied, now dead code, changing no behaviour.

## The brief

The two lanes that merged today, `settings-wiring` (`7c0fbcb1`) and `triage-r2-wiring` (`1b29be3a`), each wrote typed and runtime seams so their code ran before their migrations applied (a missing schema read as today's three doors, `doors_schema_missing`; the report route's fallback while `create_report`'s new signature and columns were missing). Both migrations are applied now (`event_doors` at `20260929131041`, `triage_r2` at `20260929131921`) and `src/lib/db/types.ts` is regenerated (`6c64d5c8`), so the seams are dead code: triage_r2's header step (6) says to drop them. Find every one (`grep -rn "schema_missing\|schemaMissing\|SCHEMA_MISSING" src`, and the seams each lane's Handoff names: `git show 7c0fbcb1^2:docs/tracks/settings-wiring.md`, `git show 1b29be3a^2:docs/tracks/triage-r2-wiring.md`) and remove them, reading the regenerated types directly, with each test reshaped on purpose keeping its scar and saying why. Change no behaviour: the doors and the reports act exactly as they do on build 23.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each recommended answer is BUILT and his to overrule; none is a one-way door (a later change restores a seam).

- **The two older seams the grep names go with the doors' and the triage's.** `blocks_schema_missing` (event-safety
  r1, applied 2026-09-28) and `social_schema_missing` (profiles-social, applied 2026-07-08) match the brief's grep and
  their files are in `owns`: the same dead code from migrations applied long ago, and the social seam's own comment
  says to delete its catches "if you want post-apply failures to surface louder". Built: both go. The overrule: keep
  them, and only the doors and the triage go.
- **A missing schema is now an error like any other read's, never a degraded answer.** The seams answered "today's
  three doors", "no held door", "nobody is blocked" (the fail-open one), "filed the old way" and "the held rows only",
  each captured. After the apply an absent object can only be a regression, so it throws (a route's 500, the page's
  error boundary, Sentry) exactly as a broken read does everywhere else. Nothing changes on build 23, where every
  object exists. The overrule: leave a degraded answer for the reads whose absence is safe.
- **What only the seam used goes with it.** `readDoorStanding` loses its `visibility` argument (its only reader was
  today's three doors), `checkInAtDoor` its `null` answer and the route's branch for it, `setEventDoor` its
  `not_ready` code and the `updateEvent` fallback, and `isTicketBlocked` (`queries/event-blocks.ts`) goes with its
  tests, because the seam's `standingWithoutDoors` was its only caller (`event_door_standing` folds the block in;
  the SQL function `event_ticket_blocked` stays). The overrule: keep `isTicketBlocked` as an unused helper.
- **Not in this lane, left standing** (Deferred below): the same shape from other applied migrations
  (`isDeletionSchemaMissing`, the claims' defensive reads, `NotificationPrefsRow`), which neither the grep nor the two
  Handoffs name.

## System-doc edits (in place, owned facts only)

- `guest-flow.md`, the held door's check-in line (a one-line exception, it is in `reads`): "a missing schema or event
  answers `moved`" becomes "a missing event answers `moved`", because a missing schema now throws.
- `host-app.md`, the Guest cards' line (a one-line exception, not mine): `readEventGates` no longer "reads Only me
  before the doors' migration"; the clause goes.

## Deferred (ROADMAP one-liners, bucket named)

- Lifecycle: `isDeletionSchemaMissing` and the `not_provisioned` answers of the account deletion
  (`lifecycle/account-deletion.ts`, `db/mutations/account.ts`, the purge route's `skipped`) are the same dead seam for
  migration 20260902130000, applied and typed, and neither the grep nor the two Handoffs name it (from `crumbs-15`).
- Guest: `queries/claims.ts` reads `preview_keys` and `event_visibility` off an untyped row "until the types are
  regenerated" (migration 20260927200000, applied and typed), `social/notification-prefs.ts` declares
  `NotificationPrefsRow` by hand for the same reason, and `queries/guest-events.ts` still defaults the reel's
  `show_reel`, `reel_style_id`, `reel_hold_sec` and `reel_eligible` for "an RPC from before the expand" (the reel's
  migrations, applied and typed; the doors' own `accepts_video` beside them is read straight) (from `crumbs-15`).

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/crumbs-15`:** `d719b232` owns widened and the questions · `8795382a` the triage seams ·
  `789d0492` the doors', the blocks' and the social seams · `b71e947d` the two system-doc lines · `41d61e33` the
  typed slug read, one comment, one formatting · and this manifest. **No sync:** launch-prep moved (35 commits at
  `4d8e9e0e`: crumbs-14, lab-revamp stage two, records), and nothing in it touches my `reads` or any path near the
  doors, blocks, reports, social or lifecycle code (`git diff --name-only 850b9cd9 origin/launch-prep` meets mine at
  `docs/systems/host-app.md` alone, on different lines); `git merge-tree --write-tree HEAD origin/launch-prep` is
  clean (exit 0), so Agent boot's sync rule does not fire.
- **Gates, each on its own exit code, on `41d61e33`** (the manifest commit adds no code; logs in
  `../partyreel-wt/_scratch/crumbs-15/final-*.log`): typecheck 0; lint 0 (no warning); test 0 (599 files, 6,878
  tests; the base was 597 files, 6,833: the two new door test files and the reshaped ones);
  `build-lock.sh pnpm build` 0; `lab:smoke --base http://localhost:3131` 0 (171 checks, 0 failing, `final-smoke.log`).
  No board, so no `lab:demo`. `prettier --check` on my 34 changed source files: five carry drift that was already
  there at the base (the same diff counts at `850b9cd9`), none of it mine.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the owned paths + this file, and these
  exceptions, each with its why:
  - `docs/systems/guest-flow.md` (one line, in `reads`) and `docs/systems/host-app.md` (one clause, not mine): the two
    system-doc lines the seams made stale, both named above.
  - `src/app/(app)/account/page.tsx` (two comment lines) and `src/components/app/event-settings/event-settings-sheet.tsx`
    (one comment line): each named the seam ("no-op gracefully pre-apply", "Null pre-apply"); comments only.
  - `src/lib/db/queries/reports.test.ts`: the test of an owned file, added to `owns` at this handoff.
- **Items:**
  - Triage seams gone (`8795382a`): `db/triage-seam.ts` deleted; `createReport` is one typed `create_report` call
    (the three-argument fallback, `schemaMissing` and the route's `reports_schema_missing` warning gone);
    `readKeptForPurge`, `readKeptMediaIds`, the removed-media sweep's `defer_kept_due_media`, `report_queue_facts` and
    every read and write of the admin reports (`reports.kind`, `hid_at`, `proof_*`) on the typed client;
    `readProofAsk` and `answerProof` lose their 42703 maps.
  - Doors' seams gone (`789d0492`): `isDoorSchemaMissing` with its `doors_schema_missing` capture,
    `standingWithoutDoors` and the untyped `rpc()`; `readDoorStanding(eventId, caller)` with no `visibility`,
    `checkInAtDoor` never null (the route's `moved` branch for it gone), `setEventDoor` without `not_ready` or the
    `updateEvent` fallback; a signed-out caller's absent account id is omitted from the wire, never sent as null;
    `allow_videos`, `gate` and `accepts_video` read straight off the typed rows (`accepts_video` is never null: its
    SQL is `allow_videos` (NOT NULL) and a `coalesce`d tier test).
  - Blocks' seams gone: `isBlockSchemaMissing`, `isTicketBlocked` (its only caller was the seam's), the untyped
    `rpc()` and the hand-typed `BlockRow`; `getEventBlocks` on the typed host client. Social seam gone:
    `isSocialSchemaMissing` with its `social_schema_missing` capture and every catch that swallowed a missing schema
    (each read throws); `checkProfileSlugAction` answers `available: true` on any read error (a blip;
    `setProfileSlug` stays authoritative); `getMyProfileSlug` reads the typed row. `askToJoin` and the host's
    `hostRpc` (doors and blocks) call the typed client, `hostRpc` taking the typed call as a closure.
  - Every removed seam test reshaped on purpose with its scar and the reason in a comment: the door route's
    "a check-in that cannot be read answers no word at all", the reports route's "answers 200 and alerts no one when
    the answer names no album", `media.test.ts`'s "deletes no object at all when what the purge must keep cannot be
    asked" (per code, the missing function included), `report.test.ts`, `event-blocks.test.ts` ("any failure throws:
    a broken read never impersonates nobody is blocked", per code), `owner-gate.test.ts` and
    `album-viewer.server.test.ts` (the world now answers the door's SQL question, as a stranger for everyone).
    `queries/event-doors.test.ts` and `mutations/event-doors.test.ts` are new (the typed reads and acts, the omitted
    account id, a failed read throws, each answer read defensively); `queries/reports.test.ts` gains the urgent count
    and the answer link's ask.
  - Two system-doc lines, in place: `guest-flow.md`'s held-door check-in ("a missing event answers `moved`") and
    `host-app.md`'s `readEventGates` (no longer "reads Only me before the doors' migration").
  - **The local walk, against the live database** (artifacts in `../partyreel-wt/_scratch/crumbs-15/`): the same
    requests to my dev server (3131) and to the alias (build 23, the old seams), answers byte-identical. The door
    check-in route, 12 cases (a waiting, an in and a no-row ticket on an Approve album, no ticket, a short one, a
    non-string, an unknown link twice, `{}`, malformed JSON, an array, a ticket at a password album) plus a blocked
    ticket (`door-local.txt`,
    `door-alias.txt`, `door-local-final.txt` on the final tree; the waiting row's `waiting_seen_at` is stamped, the
    in row's is not); the reports route, 11 cases (dead link with and without a kind, another event's media, a bad
    kind, no token, `{}`, malformed JSON, the person arm signed out, and two reports filed on each build whose rows
    match in shape: `reports-local.txt`, `reports-alias.txt`); the answer link's page and route, 11 cases (the asked
    link shows the question and the album, an unknown or malformed token reads "already been used", a malformed,
    empty or missing answer is refused, the answer lands once and the token dies with it, the second is a 404 gone:
    `proof-local.txt`, `proof-alias.txt`). Then the changed reads and writes run for real on the live schema through a
    scratch vitest (`walk-live.test.ts.txt`, answers in `walk-live.out`, 11 tests green): the standing of a waiting,
    an in, a stranger, the host and a missing event; nine tickets throwing on both reads; the host's counts, queue,
    invite list and pulse; `readEventGates` over 400 ids in chunks; the block reads; `createReport` in four reporter
    shapes (the address rides only beside its hash) and both refusals; `answerProof`; `readProofAsk`;
    `countUrgentReports`; `listOpenEntries`; `kept_media_ids` over 200 real ids; `askToJoin`'s refusals. All the data
    was one disposable event ("crumbs-15 door walk"), its 13 reports, 2 guests, 2 invites and one block, deleted and
    read back at zero (no report open anywhere then); the two RT23 events were read, never written.
- **Assets requested from Will:** none.
- **Board ideas:** none. One kit note: the differential walk (the same requests to the lane's dev server and to the
  alias, diffed) is the cheapest proof a no-behaviour lane can give; `walk-door.sh`, `walk-reports.sh` and
  `walk-proof.sh` in the scratch are its shape, if the kit's runbook wants a line.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule** (each built as recommended, none a one-way door: a later change restores a seam):
  - The two older seams the grep names go with the doors' and the triage's (`blocks_schema_missing`,
    `social_schema_missing`). The overrule: keep them.
  - A missing schema is an error like any other read's, never a degraded answer (a check-in the database cannot
    answer is a 500 the door reads as still waiting; the slug check answers available). The overrule: leave a degraded
    answer for the reads whose absence is safe.
  - What only the seam used goes with it: `readDoorStanding`'s `visibility`, `checkInAtDoor`'s `null`,
    `setEventDoor`'s `not_ready` and its fallback, `isTicketBlocked`. The overrule: keep `isTicketBlocked` unused.
- **Look at first:** what I could not drive is every signed-in surface (sign-in cannot run on localhost, and the
  operator's sign-in needs Will's code), so the alias round after the merge is where they run, each a typed call the compiler
  proves and the unit tests pin: a host changes a disposable album's door (Public, Approve, Public) and opens Guests
  and Blocked with a block preview (`hostRpc`'s closure, the queue, invite and count reads); `/account` with its
  social sections (`queries/social.ts` is the largest diff, all try/catch removal and re-indentation); the operator's
  `/admin/reports` queue and Ask for proof; a host's Delete permanently on a removed item of a disposable album and
  the purge cron's next run in `/admin/jobs` (`kept_media_ids`, `defer_kept_due_media`, which I did not call, since it
  writes).
