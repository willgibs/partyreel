---
track: crumbs-21
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "2d2240a2"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/migration-guards.test.ts
  - src/app/admin/albums/
  - supabase/migrations/20260929230000_door_password_ends_asks.sql
  - supabase/migrations/20260929231000_report_keeps_its_item.sql
  - supabase/migrations/20260929232000_like_counts_shown.sql
  - src/lib/guest/use-upload-queue.ts
  - src/lib/guest/use-upload-queue.test.tsx
  - src/components/app/event-settings/door-page.tsx
  - src/components/app/event-settings/door-page.test.tsx
  - src/lib/db/queries/reports.ts
  - src/lib/db/queries/reports.test.ts
  - src/lib/admin/reports.ts
  - src/components/app/report-review.tsx
  - src/components/app/report-review.test.tsx
  - src/components/admin/report-queue.tsx
  - src/components/admin/report-queue.test.tsx
  - src/components/admin/moderation-grid.tsx
  - src/components/admin/moderation-grid.test.tsx
  - src/lib/r2/grid-items.ts
  - src/lib/r2/grid-items.covered.test.ts
  - src/lib/moderation/operator-actions.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
  - docs/systems/trust-safety-forensics.md
---

# lp/crumbs-21

**Goal.** Four data-integrity items from the ROADMAP: a waiting newcomer's ticket settled when her door moves, the admin album covering what a report of the worst kind names, what a report named outliving its photo's row, and the host's like counts limited to what she can see.

## The brief

Four items the ROADMAP holds, each fixed at its root with a test that fails on today's code:

- **A waiting newcomer keeps her ticket when her door moves.** A newcomer waiting at `approve` or the invite list whose door then becomes a password keeps her waiting ticket, so once she unlocks, `get_upload_context` and `create_media` still refuse it as a private album's, and the host's At the door still lists her. The door's move settles her rows (`crumbs-17`'s find; it fixed the listed newcomer's admit in `20260929220000_door_invite_admits.sql`, the shape to read first).
- **The admin album draws the worst kind uncovered.** `/admin/albums/[eventId]` draws every item uncovered, one a child-abuse or sexual-content report names included; the reports inbox covers that set (`crumbs-17`'s NIT-7 keeps a covered kind covered in every list), and the album grid covers the same set, from the same rule in one home.
- **What a report named outlives its photo's row.** `reports.media_id` is `on delete set null`, so once a reported photo is purged (a removal's window ending, an uploader's withdrawal) its report reads as an album report under All. What the report named (that it was a photo or a video, and which) outlives the row, without keeping the bytes or anything the purge exists to remove.
- **The host's like counts answer ids no surface shows her.** `get_event_like_counts` returns a count for every media id in her event, a takedown's and a withdrawal's included; it answers only what her surfaces show.

The SQL is migrations: write them (one file or several, each one decision), prove each rolled back on the live schema through the Supabase MCP (read-only otherwise), hold each shape in `migration-guards.test.ts`, and never apply one (the Orchestrator applies by protocol). New objects in `public` grant `anon` and `authenticated` nothing by default (CLAUDE.md's landmine): a function revokes from `public` and grants exactly.

**Verify:** the gate; each item's test red on today's code and green on yours; the rolled-back proofs; the admin album and the door walked where localhost reaches them (the admin portal and a signed-in host cannot run there: name their steps for the next build's red-team in your Handoff).

**Paths:** your owns are a start (add each migration file, and any query or page the fixes reach, to `owns` in your manifest before editing). A path you need beyond them: add it, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Q1. When a door that takes asks (letting each person in, the invite list) becomes a password, what happens to the
  people waiting?** Built (recommended): their asks end. Each waiting ticket goes (never a row an upload names), they
  meet the password like anyone new, and At the door, the pulse and the bell drop them; the door page says so before it
  acts ("2 people are waiting at the door. A password asks them for it too.", confirm "Ask for the password"; a first
  password says it beside its field). Because: a password lets in whoever proves it, so a waiting ticket there only
  stands between her and it, and letting her ticket in would pass the password without it. Alternatives: the asks wait
  silently while the password stands (hidden from At the door, back if the door returns to letting each person in) and
  proving the password lets her in, which costs a second admit at the unlock and misses a phone whose unlock outlived
  the password's return; or let them in (passes the password: never). Closed and Only me keep their asks, as today.
- **Q2. How does a report keep what it named?** Built (recommended): `reports.media_id` drops its foreign key and keeps
  the id, `media_type` keeps the kind (written from the item by a trigger that also refuses an id naming nothing, as the
  key did at insert), backfilled, paired by a CHECK. Alternative: keep the key's ON DELETE SET NULL and add a second
  never-nulled pair (`named_media_id`, `named_type`), which keeps the key but says one fact twice.
- **Q3. What does the host's like count leave out?** Built (recommended): an operator's removal, an asked row and a
  withdrawal, the rows no surface of hers shows; her own removals (her Deleted), pending and hidden still count.
  `media_like_counts` is left as is (service role only, and both callers ask it only for ids her RLS read returned).
- **Q4. Where does the worst kind arrive covered in Albums?** Built (recommended): both views, the feed as well as the
  drill-in the brief named (NIT-7's rule is every list), with the inbox's cover, no View once there (the open report's
  View once stays the only look), and Remove and Restore kept (neither needs a look).

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`, the `waiting` bullet: only a door the host answers holds an ask; a password ends every
  ask (`events_door_to_password`) and her phone joins afresh past it (`use-upload-queue.ts`).
- `docs/systems/host-app.md`, the door's writer: the consequence line covers a password, which ends every ask.
- `docs/systems/database-security.md`, "A like is only as visible as its media": `get_event_like_counts` counts only a
  row she can meet, held to `media_host_all` by a guard.
- `docs/systems/admin-observability.md`, Reports: the covered rule reaches both Albums views from one home
  (`readCoveredItems`); a new bullet, what a report named outlives its item.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Host: Let back in on a newcomer declined at a door that has since become a password promises "They'll be able
  to open <event> and add photos again", where she meets the password like anyone new (`BlockedPerson.atDoor` reads
  waiting rows, which the password ended) (from `crumbs-21`).
- Now: Guests: an ask minted in the instant a door becomes a password (`create_guest` reads the door with no lock the
  host's move waits on) stays waiting at the password until the door moves again (from `crumbs-21`).

## Handoff (replaces the chat report)

- **Commits** (pushed to `lp/crumbs-21`): `9b5b2c91` (owns), `a126ddb5` (the password, the like counts), `55544401`
  (what a report named, the albums grid), `6a3e2442` (system docs), `42cab9d7` and `ba9d557f` (two test refinements);
  the manifest commit is the head in the chat line. **No sync**: since the cut launch-prep gained menu-depth's and
  crumbs-19's merges and records, none in this lane's paths or reads, and `git merge-tree --write-tree HEAD
  origin/launch-prep` (70a5b2e5) is clean (host-app.md's two edits sit in different paragraphs).
- **Gates**, each on its own exit code, logs in `../partyreel-wt/_scratch/crumbs-21/`: on `ba9d557f` `pnpm typecheck` 0,
  `pnpm lint` 0, `pnpm test` 0 (620 files, 7,281 tests; `head-*.log`); on `6a3e2442` (code-identical but for two test
  files) `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`) and `pnpm lab:smoke --base http://localhost:3134` 0
  (138 checks, 0 failing; `gate-smoke.log`). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths, this manifest and the four
  system docs listed above; nothing else. ★ `report-queue.tsx`, `report-queue.test.tsx` and `moderation-grid.test.tsx`
  are also crumbs-20's (its alertdialog confirms): a trial merge of `origin/lp/crumbs-20` (`b0e68451`) auto-merged all
  three and every shared test passed but `track-manifests.test.ts`'s overlap check, which the first merge's manifest
  deletion clears; this lane's one confirm lookup reads either role (`ba9d557f`).
- **The items**, each red on today's code and green on this lane's (the red runs named in each migration's foot and
  in the tests' own scars):
  1. A password ends every ask: `20260929230000_door_password_ends_asks.sql` (a trigger on every path to a password,
     never a row an upload names; the asks already stranded settled once); the phone's dead ticket joins afresh
     (`use-upload-queue.ts`, three tests); the door page says it first (`door-page.tsx`, two tests); six guards.
  2. The albums grid covers the worst kind: `readCoveredItems` in `lib/db/queries/reports.ts` is the rule's one home,
     read by the closed log and both Albums pages; a covered item is never signed (`grid-items.ts`,
     `grid-items.covered.test.ts` incl. a pin that every caller hands the set over) and draws the cover, the viewer
     stepping only through what is seen (`moderation-grid.tsx`, two tests).
  3. What a report named outlives its item: `20260929231000_report_keeps_its_item.sql`; the closed line and the open
     queue read a gone item as that item's (`report-review.tsx`, `report-queue.tsx`, `reports.ts`, seven tests); the
     kind rides a seam (`readNamedKinds`) that reads "unknown" until the apply; four guards.
  4. The host's like counts: `20260929232000_like_counts_shown.sql`, held to `media_host_all`'s latest USING conjunct
     by conjunct; two guards added, two reshaped with their scars (the verb and the old signature's drop).
- **Rolled-back proofs** on the live schema, each in its file's foot with its rows, red first, nothing persisted
  (re-read after each): the password (7 steps: grants, both host acts, W's dead ticket and fresh join past the
  password, D's block holding and lifting, closed / Only me / the list keeping Z's ask); the report (7 steps: the
  backfill with `updated_at` untouched by fingerprint, filing, the purge, the reopen keeping nothing of its album,
  the refusals, the grants); the like counts (3 steps). `get_advisors` read 18 / 4 / 33 before; expected delta none.
- **Proposed migrations** (apply by protocol, in any order; each header holds its drift query, md5s and ACLs):
  `20260929230000` (a trigger and its function; no regen; ★ it deletes the waiting tickets stranded at a password when
  it applies, 0 on 2026-09-29: drop that one statement if the apply should delete nothing, the guard allows it),
  `20260929231000` (regenerate `types.ts`: `reports.media_type`, the `media` relationship gone; the build runs on
  either side of the apply), `20260929232000` (no regen). Worker / Vercel / Stripe / env: none.
- **The red-team's steps for the build after the apply** (localhost reaches neither a signed-in guest nor the portal;
  the local walk was the Library's report queue, read back whole, and `lab:smoke`):
  1. The door: host `willg97` on a disposable album letting each person in; a second confirmed account asks (At the
     door lists her). Settings → Who can get in → A password: the box says "1 person is waiting at the door. A
     password asks them for it too."; set it. At the door, the pulse and the bell clear; her held door moves to the
     password step; she unlocks and adds a photo on the first try (no "Refresh and rejoin"). Again with a password
     already set: the consequence line and "Ask for the password".
  2. The albums grid: a guest reports a photo as sexual content; as `partyr33l` (AAL2) open `/admin/albums` and the
     album's drill-in: that tile reads Covered, no request signs it (Network), the viewer never opens it and steps past
     it; Remove works on it.
  3. What a report named: dismiss a report on a photo the host has removed, then Delete it permanently from her
     Deleted; `/admin/reports?status=all` draws "Photo, deleted" (never the album's plain square); Undo reopens it as
     "The photo was deleted." with Deleted, and its Action only closes.
  4. The like counts: as the host, `get_event_like_counts` straight through PostgREST on an album holding a liked
     takedown and a liked withdrawal answers neither id.
- **Assets requested from Will**: none.
- **Board ideas**: the Library could draw the portal's two new states (a report whose item is gone, a covered Albums
  tile) beside its queue specimen, since the portal cannot be signed in locally.
- **Calls his to overrule**: Q1 to Q4 as built; the password's words ("A password asks them for it too.", "Ask for the
  password"); the deleted item's words ("The photo was deleted.", the Deleted chip, "Close this report as Actioned?");
  every dead ticket now joins afresh in the upload queue, not only the password's.
- **Look at first**: the three migrations' headers and held proofs, then `use-upload-queue.ts`'s `DEAD_TICKET`, then
  `readCoveredItems` and `readNamedKinds` in `lib/db/queries/reports.ts`.
