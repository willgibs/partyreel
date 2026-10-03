---
track: upload-meter
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "015ff8e6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/r2/presign-upload/
  - src/app/api/r2/complete-upload/
  - src/lib/upload/server-pipeline
  - src/lib/security/abuse-rate-limit
  - supabase/migrations/20261003210500_
  - docs/systems/billing-caps.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/PRICING.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
  - src/lib/constants/tiers.ts
---

# lp/upload-meter

**Goal.** The meter sees every byte a host can make us store: a presign's declared bytes count against the month's uploads (an abandoned upload simply counts), a preview is never heavier than its original, and two unpublished breakers far past any party stop a script (an account's uploads an hour, its events a day); and the join limiter fits a 2,000-guest wedding on one venue Wi-Fi.

## The brief

**Why.** Will's pricing rethink (2026-10-03): "Ideally, no pro user can ever exceed our costs to support them." PRICING.md's "What it costs us" (cost-atlas, merged at `ec3ee1ae`) proves that promise per plan, but only under its preconditions ("The levers", "The preconditions"): rule 2 holds only once they ship, whichever ladder Will picks, so they are launch blockers. Read that section first, and the Advisor's Q16 review in its record (the pickup's cost-atlas row).

**What breaks today** (PRICING.md, at file:line):
- **An upload never completed.** A presigned PUT lives two hours and is not single-use (`r2/presign.ts:48`); the ledger is written only by `create_media`, and the backup copies the object on its PUT, so abandoned bytes are stored and backed up unmetered.
- **A preview** can weigh 2 MB beside a one-byte original, and nothing refuses it.
- **No limiter** sits on presign or complete: a script's tiny files are unbounded in count. Nothing limits creating events.
- **The join limiter** (`security/abuse-rate-limit.ts:59-64`) allows 400 joins a quarter-hour per (address, event). A 2,000-guest wedding on one venue Wi-Fi meets it in its arrival hour (the Advisor's Q16), and "no guest limit" is published.

**Build:**
1. **The presign counts.** A presign's declared bytes (the presigned Content-Length binds them, so declared equals real) count against the month's uploads at presign, and never again at complete. A refused or abandoned upload still counts: the meter never refunds (PRICING.md's Model). The host's and the guest's paths both.
   - The ledger write is SQL: write the migration for the Orchestrator under your reserved prefix (the Advisor reads it, then it is applied by protocol), its rolled-back check at its foot, red then green.
   - It must keep the plan's published allowance exactly as the meter reads it today for a completed upload, and never count a file twice.
2. **A preview never heavier than its original,** refused at presign in words.
3. **Two unpublished breakers, far past any party:** an account's uploads an hour, and its events created a day (≈100). Each sits where the code already limits (the abuse limiter or the presign's own reads), and each is refused in words, never silently.
4. **The join limiter sized for the wedding.** The per-(address, event) backstop holds a 2,000-guest wedding's arrival on one Wi-Fi. Breadth stays the real guard against a scraper.
5. **Facts in `billing-caps.md`,** in place.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree, each step on its own exit code; `pnpm lab:smoke --base http://localhost:3131`; red first for every item (logged); the migration's rolled-back check red then green on the live schema; a real upload, guest and host, counted once at presign and never at complete (SQL before and after).

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and listed as Will's to overrule; none is a one-way door (the breakers are unpublished,
and how the meter counts is a fact no host can feel). The first handoff (`fec419da`) counted the month at the presign;
the Advisor's Q19 overruled it for the reason its own Question 9 found (a ticket holder could spend a host's month with
presigns she never fills), and this handoff is that rework.

1. **Where the count lives: at complete, on what landed, once** (Q19, built). `create_media*` stay exactly as applied;
   every single PUT is minted at its key's `staging/` twin and the complete copies it into `events/` before the row, so
   an unsent byte never counts, a phantom presign stores nothing, a retried PUT counts once and an abandoned one never
   reaches `events/`. The month's allowance reads as it always did, since it is the same check on the same size.
2. **The room and the month refused at presign, advisory** (kept): `meter_upload` refuses a file that will not fit
   before a byte moves, in the route's words; `create_media*` hold both for real at complete.
3. **A preview heavier than its original refuses the preview, never the upload** (kept): `preview_refused` in words,
   the original presigned; past 2 MB says so too.
4. **An account's uploads an hour: 20,000** (kept), tallied by the meter, refused at presign (429, Retry-After).
5. **An account's events a day: 100** (kept), on a creation only, after the plan's own limit, in words.
6. **The join backstop: 3,000 a quarter-hour per (address, event)** (kept): the wedding's 2,000 at once, half again
   to spare.
7. **The meter fails OPEN** (Q19, reversed from the first handoff's closed): the complete's count and caps stand
   behind it, so an outage or a database without the migration lets the presign through, reported as a warning.
8. **A retry counts once** (dissolved by staging): whether the uploader re-PUTs or asks a new presign, only the
   complete that lands a file counts it.
9. **The griefing door** (closed by staging): declaring a size spends nothing, so a grief needs the bytes themselves,
   as before this lane.
10. **Completed uploads' staged objects wait for the lifecycle rule** rather than being deleted at complete: a day of
    a second copy of every single PUT (≈1/30 of a month's bytes for what is uploaded, R2 Standard), in exchange for a
    complete with no extra request. Recommended; the alternative is a best-effort `DeleteObjects` after the record
    (deletes are free, one request a complete).
11. **The staging copy's cost:** one CopyObject (Class A) a staged single PUT, so three a photograph with its preview
    and phone copy: ≈$0.0135 a thousand photographs, about a quarter more than the atlas's $0.056 for an upload's
    operations. Recommended (the bound it buys is worth it); PRICING's atlas line to refine (Docs below).

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`, The cap model: "`create_media*` enforce two bounds, on the HEAD's size, at
  complete"; a ★ bullet on the month counting what landed and staging; a bullet on the presign's advisory meter (no
  month, no lock, fail open, the routes' words); the two breakers with their constants (`c_uploads_an_hour`,
  `c_events_a_day`) as unpublished, so "no guest limit" and "unlimited events" stay true. The three-counters and clip
  lines are as before.

## Deferred (ROADMAP one-liners, bucket named)

- Now: an upload reads the host's active bytes three times (the context, the meter, create_media), the last under her
  lock; one maintained counter (PRICING lever 7's per-event sums) makes each O(1).
- Now: the venue-shaped limiter kinds still sized for a 400-join venue (rename and attach_email 60, export 100 a
  quarter-hour per address and album) meet the 2,000-guest wedding's end of night; size them as the join was.
- Now: a host's month in `/admin` (bytes, items, the hour's tally) with an operator's reset, since PRICING says nothing
  shows a host's meter and there is no override.

## Handoff (replaces the chat report)

- **Look at first, the deploy's three dependencies:**
  1. **The R2 lifecycle rule, the Orchestrator's to set, before (or with) the deploy that serves this code:**
     `npx wrangler r2 bucket lifecycle add partyreel staging-expire staging/ --expire-days 1` (bucket `partyreel`, rule
     `staging-expire`, prefix `staging/`, objects expire a day after their upload; R2 applies it within its own
     lifecycle cadence). Without it `staging/` keeps every single PUT's twin for good (never backed up, but stored).
     Check with `npx wrangler r2 bucket lifecycle list partyreel`. The bucket's default rule already aborts an
     abandoned multipart after 7 days (R2's own default).
  2. **The backup never copies `staging/`:** the notification subscription's `--prefix events/`
     (`workers/backup/README.md:57-58`, set outside the repo; `npx wrangler r2 bucket notification list partyreel`
     shows it) and, since backup-prune's `921a2135` (merged at `17e5faba`), the queue's own `isBackedUpKey`; the
     reconcile and the orphan sweep list `events/` alone (`index.ts`, `sweeps/orphans.ts`). I found the queue relied on
     the subscription alone and backup-prune closed it in code; confirm the deployed Worker carries it (the pickup's
     dry deploy). A CopyObject into `events/` is the object-create the backup copies (`R2EventMessage.action`).
  3. **The migration is an expand:** any order against the alias and partyreel.com, before build 49. The code without
     it fails open (verified live: 10/10 with no `meter_upload`).
- **Commits**, pushed to `origin/lp/upload-meter`: `423ded56` the rework (the migration as an expand, staging, the
  meter fail-open, the reverts, billing-caps.md); `1a7234ae` the sync merge of `origin/launch-prep` (backup-prune's
  merge touched `src/lib/r2/delete.ts`, which the complete's withdrawal uses). The head is this manifest's commit, in
  the chat line. The first handoff's commits (`a4684412`, `b0a24025`, `c759a682`) are under the rework.
- **Gates on the synced tree `1a7234ae`**, each on its own exit code, logs in `../_scratch/upload-meter/`:
  `pnpm typecheck` 0 (`gate3-typecheck.log`), `pnpm lint` 0 (`gate3-lint.log`), `pnpm test` 0, 871 files and 10,411
  tests (`gate3-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate3-build.log`), `pnpm lab:smoke --base
  http://localhost:3131` 0, 152 checks and 0 failing (`gate3-lab-smoke.log`). No board, so no lab:demo.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): owned, the migration, the presign and complete
  route dirs' files, the `src/lib/upload/server-pipeline*` files, the two `src/lib/security/abuse-rate-limit*` files,
  `docs/systems/billing-caps.md` and this file. Exceptions, each why:
  - `src/lib/r2/keys.ts`: `STAGING_PREFIX` and `stagingKeyFor` (the one home for key layout).
  - `src/lib/r2/presign.ts`: `copyObject`, beside the HEADs it serves (one Class A, no byte through a function).
  - `src/app/api/host/r2/presign-upload/route.ts`: the host strategy's words for the meter's refusals.
  - `src/app/api/host/r2/complete-upload/route.test.ts`: its R2 stub gains `headObject` and `copyObject` (two lines).
  - `src/app/api/r2/phone-copy.test.ts`: reshaped on purpose for staging (scar kept: both caps, both checks, no copy
    ever refusing the photograph).
  - `src/lib/db/mutations/events.ts` and `events.test.ts`: the create action prints the daily breaker's sentence
    ahead of its plan-limit branch (which would offer a Pro host an Upgrade).
  - Reverted to `launch-prep`, no longer in the diff: `migration-guards.test.ts`, `phone-copy-migration.test.ts`,
    `scripts/seed-demo-event.mjs` (create_media counts again, as applied).
- **The items:**
  1. The month counts what landed, once, at complete: staging (`server-pipeline.ts`: every single PUT minted at its
     staging twin; the complete HEADs it there, copies it into `events/` before the row, and withdraws its copies when
     the record is refused or throws; a multipart and a pre-staging PUT land as before), `create_media*` untouched.
  2. The presign's meter: `meter_upload` (migration `20261003210500`, an expand) refuses past the hour's breaker, the
     month and the room in each route's words and tallies the hour; no month, no lock; fails open.
  3. A preview never heavier than its original: refused in words (`preview_refused`), the original presigned.
  4. The breakers: 20,000 uploads a clock hour an account; 100 creations in 24 hours an account, on INSERT only.
  5. The join backstop: 400 to 3,000 a quarter-hour per (address, event).
  6. `billing-caps.md` in place (System-doc edits).
- **Red first, then green** (`../_scratch/upload-meter/red-green.log`):
  - the first handoff's live red walk on today's code (presign +0, complete +101,450, an abandoned 242,662 bytes
    stored and uncounted, a 2 MB preview beside 1,000 bytes minted);
  - the reworked migration's rolled-back proof on the live schema: red 10/10 of its steps failing on what each lacks
    (11 holds in both runs by design), green 12/12, nothing persisted (checked); the meter leaves the month and the
    host's row untouched (`xmax` unchanged across it, the control's lock visible), the complete counts once on its
    real size, host and guest; the bodies hash as the file (`meter_upload d13b9822…`, `enforce_event_limit 42fb725f…`,
    `create_media*` still `e83666cd…` / `21f0397f…`);
  - TS: the reworked tests 35 red against `fec419da`'s implementation (`red-ts-v2.log`), 569/569 green on the
    touched suites (`green-ts-v2.log`), then the whole suite;
  - live, the staging walk (`staging-walk.mjs`, real guest uploads through the reworked routes on localhost:3131
    against the live database and bucket, no migration, so the meter failing open): 10/10 on the rework and again on
    the synced tree: the PUTs at the staging twins, the presign +0, a twice-PUT original in `staging/` alone, the
    complete copying it and its preview into `events/` and counting +101,450 once, the row on the `events/` keys, an
    abandoned upload in `staging/` alone and uncounted, a phantom 99 MB presign storing and counting nothing, the
    heavy preview refused in words.
- **Pending a deploy:** the host's real upload through the alias (its path is the same engine, proved in Vitest and
  by the SQL proof's step 4): two console steps with the ledger's SQL, `../_scratch/upload-meter/host-walk.md`.
- **Live test data left**, all in the export wiring probe (disposable): three photographs (`89c38bbb…` from the first
  red walk, `de18a083…` and `1b5384fc…` from the staging walks), five name-only guest rows ("Meter walk", "Meter
  closed" twice, "Staging walk" twice), willg97's October ledger +304,350 (the meter never refunds). Every staged
  object the walks made was deleted (the lifecycle rule is not set yet).
- **Assets requested from Will:** none.
- **Board ideas:** a host's month in `/admin` with an operator's reset (Deferred above).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** `supabase/migrations/20261003210500_upload_meter.sql`
  (an expand; drift check: `enforce_event_limit` `0bc03722…`, no `meter_upload`, no `hour_*` column; after it,
  `meter_upload d13b9822…`, `enforce_event_limit 42fb725f…`; advisors 19 / 4 / 35 expected; then regenerate the types
  and drop the `untyped` seam in `src/lib/upload/server-pipeline-meter.ts`). The R2 lifecycle rule above. No Worker
  change (backup-prune's `isBackedUpKey` is the one this relies on), no Vercel, Stripe or env change.
- **Docs outside the lane this makes stale** (the Orchestrator's to refine):
  - `uploads-and-r2.md`: "The browser uploads straight to R2" and the complete "records the row through
    `create_media*`, which writes the ledger" (true, with staging between: a single PUT lands in `staging/` and the
    complete copies it in); the preview and phone-copy bullets (staged, the preview capped at its original too and
    refused in words, an over-cap staged copy never copied in); "No request rate limiter sits on the four routes but
    one" (the presign's hourly breaker).
  - `database-security.md`: `meter_upload` joins the service-role-only inventory (it takes no profiles lock, so it is
    in no lock list).
  - `PRICING.md`, What it costs us: "An upload" (three copies a photograph, the hourly breaker), "An upload never
    completed" (staging and its rule, done), the copies' preview, "A guest" (400 is 3,000), "(c) Bounds" and the
    preconditions (three of the four done).
  - `keys.ts`'s preservation comment says the backup replicates `preservation/` "like any object", which the
    subscription's prefix and now the queue's `isBackedUpKey` both contradict.
- **Calls his to overrule:** Questions 2 to 6 and 10 to 11 (the room and the month refused early; the preview refused
  alone; 20,000 an hour; 100 a day; 3,000 a quarter-hour; staged twins left to the rule; the copy's cost).

## Where I am

- 2026-10-03: booted; plan and Questions written; the first handoff at `fec419da` (the count at presign).
- 2026-10-03 21:30Z: reworked on the Advisor's Q19 (`423ded56`), synced (`1a7234ae`), the gate green on it; handed
  off again (the Handoff above).
