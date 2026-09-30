---
track: hide-strikes
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "963a2fb8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/migration-guards.test.ts
  - docs/systems/testing-verification.md
  # added at the lane's plan (each file before its first edit): the brief's migration, and the two comments
  # that state the bar in words (the brief's "every line that states the bar"); no other lane claims them
  - supabase/migrations/20260930120000_hide_strikes.sql
  - src/lib/reports/reporter.server.ts
  - src/components/guest/report-dialog.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/admin-observability.md
  - docs/systems/database-security.md
  - docs/systems/trust-safety-forensics.md
  - supabase/migrations/20260929140000_triage_r2.sql
---

# lp/hide-strikes

**Goal.** Will's call B: the instant hide's bar becomes three dismissed child-abuse reports in a rolling 180 days, each lapsing 180 days after its dismissal, so a well-meaning reporter he once disagreed with keeps the hide; one migration replacing create_report, proved rolled back, with every line that states the bar rewritten.

## The brief

**Why.** Will overruled call B on 2026-09-30: the instant hide's bar becomes three strikes that lapse. His words: "I think we should shift into something like a three-strike policy that lapses after 180 days. I don't want to prevent a well-meaning reporter from a second report if I simply disagree with the first."

Today one dismissed child-abuse report from an address bars its instant hides for good. The rule is in `create_report` (`supabase/migrations/20260929140000_triage_r2.sql:1114-1117`): `exists (… reporter_hash = p_reporter_hash and kind = 'child' and status = 'dismissed')`.

**Build (recommended): three strikes in a rolling 180 days.**
- A strike is a child-abuse report from that address (its `reporter_hash`) that the operator dismissed. It lapses 180 days after its dismissal.
- An address holding three live strikes has lost the instant hide. Its report is still filed the same and heads the queue, as today.
- Undoing a dismissal takes its strike back, since the count reads the reports as they stand.
- Everything else about the hide stays: never the event's own host, 3 an address and 5 an event in 24 hours, advisory-locked, a confirmed address only.
- Name the numbers (3 strikes, 180 days) once, where the rule lives, with a WHY comment quoting his reason.

**The migration** replaces `create_report` (create or replace, with the same signature and the same grants: revoke from public, then grant exactly as today; see `docs/systems/database-security.md`).
- It reads the dismissal's time from whichever column records when a report was dismissed; find it. If none does, add one written at the close and backfilled from the best column there is, and say so under Questions.
- A rolled-back proof sits at the file's foot, in `triage_r2.sql`'s shape, and shows:
  - an address with two live strikes still hides;
  - a third strike bars it;
  - a strike 181 days old no longer counts;
  - an undone dismissal no longer counts;
  - the other limits still hold.
- Run the proof yourself with the Supabase MCP's `execute_sql`, inside `begin; … rollback;`. Otherwise your SQL is read-only, and you never call `apply_migration`: the Orchestrator applies the file by protocol.
- Its guard goes in `src/lib/db/migration-guards.test.ts`: the winning `create_report` counts strikes within the window. It must fail on today's migration set.

**The words.** Every place that states the bar says the new rule:
- `docs/systems/admin-observability.md` (the instant hide);
- `docs/systems/testing-verification.md`: willg97's and partyr33l's addresses each carry one dismissed child-abuse report. That is one strike now, so both can instant-hide again; say what a red-team may walk;
- any help article, form or queue line that states the bar (grep for it).

**Verify:**
- the gate;
- the guard red on today's migration set;
- the rolled-back proof's rows, quoted in your Handoff.

This merges after milestone 31 ships. Prod's code calls `create_report` with the same signature, so the Orchestrator applies the migration by protocol once it is merged.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which dismissals are strikes?** Built: every child-abuse report from the address that the operator dismissed
  (the brief's definition, and the old bar's own reach), so a dismissed album report, or an item report whose hide
  a 24-hour limit refused, is a strike too, though neither took anything down. The alternative counts only a
  dismissed report whose hide took its item down: one conjunct, `r.hid_at is not null` (a dismissal keeps
  `hid_at`). Recommended: as built. A false report of the worst kind is what he disagreed with, hidden or not, and
  "three dismissed" is the rule an operator can hold in her head.
- **The test addresses hold two and five strikes, not one each.** Live on 2026-09-30, by their keyed hashes:
  willg97's address holds two dismissed child-abuse reports and partyr33l's five, all dismissed 2026-09-29;
  hi@willgibs.com's holds none. So after the apply willg97's hides again with room for one more dismissal, and
  partyr33l's stays barred until 2027-03-28, when its third strike lapses. Recommended: keep them. They are
  disposable data the launch round's test-data reset clears, and a red-team walks the hide from hi@willgibs.com's
  address on willg97's albums. The alternative is deleting the operator's five now. testing-verification.md says
  it as it stands.

## System-doc edits (in place, owned facts only)

- `docs/systems/admin-observability.md` (a `reads` doc; the brief names the edit): the instant hide's bar refined in
  place: three strikes, each a dismissed child-abuse report lapsing 180 days after its `resolved_at`, an Undo taking
  its strike back, with his reason.
- `docs/systems/testing-verification.md`: the test addresses' strikes as they stand live (willg97's two, partyr33l's
  five until 2027-03-28, hi@willgibs.com's none) and what a red-team may walk.

## Deferred (ROADMAP one-liners, bucket named)

- Now, Database: a CHECK pairing a report's closed status with its `resolved_at` (open exactly when it is null): the
  instant hide's strikes lapse from it, and a close written without it (only raw SQL can today; live has none of 20)
  would count as no strike (from `hide-strikes`).

## Handoff (replaces the chat report)

- **Commits, pushed:** plan `710b0239` (this manifest: owns gained the migration and the two comments, the
  Questions), work `ca59cf1e`. No sync: launch-prep moved only by `b799daef`, a record commit (ROADMAP,
  orchestrator.md, kit/README.md), which touches nothing of this lane's.
- **Gates on `ca59cf1e`, each on its own exit code** (logs in `partyreel-wt/_scratch/hide-strikes/`):
  `pnpm typecheck` 0; `pnpm lint` 0, no warning anywhere; `pnpm test` 0 (655 files, 7,846 tests); `pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3134` 0 (129 checks, 0 failing; scope the Library and the shell, no board).
  The dev server is killed by its port.
- **The guard red on today's set:** migration-guards #27 run before the migration existed: 3 of its 4 pins fail (the
  strike count, the numbers, the old bar gone); the fourth, the signature and the grant, passes by design, since
  neither moves (`_scratch/hide-strikes/guard-red-on-todays-set.log`). Green with the migration.
- **The rolled-back proof on the live schema** (`execute_sql`, `begin;` + the file verbatim + its foot's block + the
  select + `rollback;`, one call), every step ok:
  `setup` ok (event 55bcdbe0…, items A-E) · `1 two live strikes hide` ok (hid true) · `2 a third strike bars` ok (hid
  false; the report filed open, the address kept, the item up) · `3 a strike 181 days old lapses` ok (barred at 179
  days, hid at 181) · `4 an undone dismissal lapses` ok (barred, then hid after the reopen's own write) · `5 only a
  dismissed child report strikes` ok (hid beside an actioned, an open and a dismissed `sexual` one) · `6 the other
  limits hold` ok (unconfirmed, the host, an album report, another kind, a fourth from one address and a sixth in one
  event all hid nothing; the clear control hid) · `7 shape and grants` ok (md5 `ee5079e8ebf56b253c878a0ce34435e9`,
  `{postgres=X/postgres,service_role=X/postgres}`). The file's body hashes to that md5 locally, so the proof applied
  the file. After: live `create_report` md5 back to `a34941458f04cf6678bddeb3d2dac842`, ACL the same, no proof row
  left, the event's six items up. **The same block alone on today's live body is red at 1, 3, 4, 5 and 7**, where
  the rule moved, and ok at setup, 2 and 6. Both tables: `_scratch/hide-strikes/proof-results.txt`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `docs/systems/admin-observability.md`,
  `docs/systems/testing-verification.md`, `docs/tracks/hide-strikes.md`, `src/components/guest/report-dialog.tsx`,
  `src/lib/db/migration-guards.test.ts`, `src/lib/reports/reporter.server.ts`,
  `supabase/migrations/20260930120000_hide_strikes.sql`. All owned (three added to owns at the plan, before their first
  edit: the cut named no migration, and the two comments state the bar), this file, and admin-observability.md under
  System-doc edits. `crumbs-28` also edits migration-guards.test.ts (one comment near line 797); this lane only
  appends #27 and its header line, so the two merge cleanly.
- **The migration** (`20260930120000_hide_strikes.sql`): `create or replace` of `create_report` with the same seven
  named arguments, DEFINER, empty `search_path`, the service role's one grant restated; the body is live's
  (md5-checked) with only the bar replaced: `(select count(*) … r.status = 'dismissed' and r.resolved_at > now() -
  c_strike_lapse) < c_strikes`, the two numbers declared once (`c_strikes constant integer := 3`,
  `c_strike_lapse constant interval := interval '180 days'`) under his words; the comment says the new bar.
- **The dismissal's time is `reports.resolved_at`**, found, no column added: `closeReports` writes it with the
  status at every close and `reopenReports` clears both (`src/app/admin/reports/actions.ts`); live, 20 dismissed
  reports, none without it, and no open one with one.
- **The guard** (`src/lib/db/migration-guards.test.ts` #27, latest wins, comments stripped): the strike conjunct, the
  two numbers (`180` once in the body), the old `not exists` bar gone and `r.status = 'dismissed'` read once, the
  signature the deployed route calls by name, and the revoke-then-grant in the winning file.
  `src/lib/reports/migration.test.ts` still pins the dismissed clause, which the strike count carries; untouched.
- **The words:** admin-observability.md's instant hide and testing-verification.md's test addresses rewritten; two
  comments that quoted the bar (`reporter.server.ts`'s hash note, `report-dialog.tsx`'s `instantHideLine` note)
  rewritten. The help articles (`reporting-and-safety.mdx`, `report-a-problem-as-a-guest.mdx`), the form's line and
  the queue's `reporterWords` say only that a confirmed email *can* hide, never the bar, so they stand.
- **Assets requested from Will:** none.
- **Board ideas:** Admin: a child-abuse report's line in the queue could say how many live strikes its address holds
  (the hash is kept), so the operator knows when a Dismiss is the third and takes the hide away for 180 days; today
  nothing in the portal shows a strike.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** `20260930120000_hide_strikes.sql`, applied by the
  Orchestrator by its own APPLY PROTOCOL once merged (after milestone 31 ships): expect the new md5
  `ee5079e8ebf56b253c878a0ce34435e9`, the same ACL, `get_advisors` delta none; then its foot's block alone, all ok.
  No types regeneration and no deploy (the deployed route calls the same seven names on either side). Nothing else.
- **Calls his to overrule:** the two Questions' answers (every dismissed child-abuse report is a strike, hidden or
  not; the test strikes kept). And two small ones: a strike exactly 180 days old has lapsed (`>`), and a dismissed
  report with no `resolved_at` counts as no strike (only raw SQL could write one; the Deferred CHECK closes it).
- **Live walk after the apply** (the milestone's red-team; nothing live to walk before it): from willg97's address on
  hi@willgibs.com's album, a child-abuse report of a photo hides it (two strikes); Dismiss it (the third); a second
  report of another photo is filed and heads the queue unhidden; the dismissal's Undo takes the strike back (and
  hides its photo again); a third report hides. Close the walk's reports with Mark actioned: one more Dismiss bars
  willg97's address until 2027-03-28.
- **Look at first:** the strike conjunct and the declare in the migration, then its foot's steps 3 and 4 (each
  strike is dismissed at a time of its own while its row is created now, so a count on `created_at` or `updated_at`
  would fail them).
