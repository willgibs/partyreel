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
and how the meter counts is a fact no host can feel).

1. **Where the count lives.** The presign writes the ledger (the declared bytes and the item) through one new
   service-role RPC, `meter_upload`, under the host's profiles lock, after every gate and before any URL is minted;
   `create_media*` no longer read or write the monthly meter. Recommended. Its cost: from the migration's apply until
   this code runs on a deployment, an upload that deployment starts counts nowhere (its old presign meters nothing, its
   complete no longer does), and partyreel.com shares the database, so it should be redeployed with the alias.
   Rejected: a per-upload presign record so the complete could tell (a table, its prune, and a late complete that
   counts twice).
2. **The presign refuses a file that will not fit the storage cap** (active bytes plus the declared ones past the cap
   and its 10%) before it counts it. Today that file uploads whole and is refused at complete; once the presign counts,
   every such try would also spend the month's uploads for nothing (fifty guests' 2 GB clips at a nearly full album, a
   third of a Pro 100 GB month). Recommended.
3. **A preview heavier than its original refuses the preview, never the upload:** no PUT is minted for it, the original
   uploads and its tile serves the original, and the presign's answer says why in `preview_refused` (a 2 MB-plus one
   too). The browser's 640 px WebP can outweigh a small, heavily compressed original, so refusing the upload would fail
   a real guest's photo. Recommended.
4. **An account's uploads an hour: 20,000** (every upload into its events, the host's and her guests'), counted on the
   month's ledger row by clock hour, refused at presign (429, Retry-After to the hour's end) in words, a guest's about
   the album. The 2,000-guest wedding averages ≈2,000 an hour and might peak near 4,000; a venue with three at once
   ≈12,000; the busiest hour on record is 1,200 (a seeded album). Recommended.
5. **An account's events a day: 100** in any 24 hours, a deleted one included (a create-and-delete loop counts),
   in `enforce_event_limit` on a creation only (a restore is not one), after the plan's own limit (the published
   sentence when both hold), refused in words. The busiest day on record is 34 (the red-teams' host). Recommended.
6. **The join limiter's backstop: 3,000 a quarter-hour per (address, event)**, from 400: every guest of the 2,000-guest
   wedding joining in one quarter-hour on one Wi-Fi, with half again for a second phone, a re-join, an ask or a remove,
   which ride the same count (and it gates every guest's own-uploads read there). Breadth unchanged. Recommended.
7. **The meter fails CLOSED:** a meter that cannot answer refuses the presign (503, "Couldn't start the upload. Please
   try again.") and is reported, because nothing behind it counts the upload any more; the limiters fail open because
   a capability stands behind each. Recommended.
8. **A retry counts again:** the uploader asks a new presign for a retried file, so a guest whose PUT dropped spends her
   file twice (the meter never refunds). Recommended to accept (a 3× month); the alternative is the uploader
   re-trying its live PUT URL before a new presign (a client change, Deferred).
9. ★ **The count at presign opens a griefing door (found in this lane's own red-team; the brief's design, built as
   briefed).** A declared size costs nothing to claim, so anyone holding a ticket to an album can spend its host's month
   with presigns she never fills: a Pro 100 GB month (300 GiB) in 30 requests of 10 GiB, an Event Pass's (225 GiB) in
   23, Free's (300 MiB) in 3 (each presign may declare up to the room left, which a phantom never fills). Default albums
   need a confirmed account for a ticket (one ticket an account an album), so one account is enough; a name-only album's
   tickets are free. Today the same harm needs the bytes themselves (300 GiB of real uploads for Pro 100 GB). And with no
   meter in `/admin` and no override, a host so spent cannot upload until the month turns: the one outcome PRICING.md
   says is worth engineering against. Pre-launch nobody is exposed. **Recommended: ship this count now (it closes the
   abandoned-upload cost hole, which is real today), and before launch move the count to what landed, by staging:** a
   single PUT goes to a `staging/` key the backup never copies and a bucket rule deletes after a day, and the complete
   copies it into place and counts its real bytes (a multipart never becomes an object until the complete assembles
   it), so an unsent byte never counts and an abandoned one never persists; `meter_upload` then keeps the breaker and the
   would-it-fit refusal at presign and counts nothing. Its cost: one copy a single PUT (≈$0.0045 a thousand), a lifecycle
   rule and the backup Worker's filter (backup-prune's), a heavier complete. The alternative: a reservation a presign,
   settled at complete, released by a nightly check when nothing landed, plus a per-ticket bound on unfinished bytes
   (a new table, a job and its `/admin` card, and a phantom still holds the month for a day). Either is Will's call
   with the Advisor; the migration's header names the risk so its review sees it.

## System-doc edits (in place, owned facts only)

- `docs/systems/billing-caps.md`, The cap model: "`create_media` enforces two bounds" became "Two bounds on every
  upload"; a ★ bullet on the month counted at the presign (`meter_upload`, its one writer, fail closed, the routes'
  words, the seed, the cost named); a bullet on the two breakers; the three counters' ledger line says it is what was
  presigned; the clip line says its presign counts it.

## Deferred (ROADMAP one-liners, bucket named)

- Launch checkpoint: a presign's declared bytes can be spent by a ticket that never sends them (upload-meter Q9):
  before launch, count what landed (staging recommended) or reserve and release.
- Now: the uploader retries a dropped PUT on its live URL before it asks a new presign, so a flaky network spends a
  file once (upload-meter Q8).
- Now: an upload reads the host's active bytes three times (the context, the meter, create_media), each a sum over her
  media under her lock but the first; one maintained counter (PRICING lever 7's per-event sums) makes each O(1).
- Now: the venue-shaped limiter kinds still sized for a 400-join venue (rename and attach_email 60, export 100 a
  quarter-hour per address and album) meet the 2,000-guest wedding's end of night; size them as the join was.

## Handoff (replaces the chat report)

- **Look at first:** Question 9, before the migration is applied: counting a presign's declared bytes lets anyone
  holding a ticket spend a host's month with presigns she never fills (a Pro 100 GB month in 30 requests), where today
  that harm costs the bytes themselves. Built as briefed (pre-launch, nobody exposed); staging recommended before
  launch. Then the apply order: APPLY BEFORE PUSH, and redeploy partyreel.com in the same sitting (below).
- **Commits**, pushed to `origin/lp/upload-meter`: `a4684412` the work; `b0a24025` billing-caps.md, Question 9 (named
  in the migration's header) and the Deferred lines; `c759a682` the host breaker's words ("Your albums have taken a lot
  of uploads this hour") and two wording fixes. No sync: since the cut, launch-prep moved only by record commits
  (`881ab2d5`, `7cf4045c`, docs/tracks alone). The head is this manifest's commit, in the chat line.
- **Gates on `c759a682`**, each on its own exit code, logs in `../_scratch/upload-meter/`: `pnpm typecheck` 0
  (`gate-typecheck.log`), `pnpm lint` 0 (`gate-lint.log`), `pnpm test` 0, 871 files and 10,385 tests
  (`gate-test.log`), `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`), `pnpm lab:smoke --base
  http://localhost:3131` 0, 148 checks and 0 failing (`gate-lab-smoke.log`). No board, so no lab:demo.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 20 paths): owned, the migration, the two presign
  and complete route dirs' files, the five `src/lib/upload/server-pipeline*` files, the two
  `src/lib/security/abuse-rate-limit*` files, `docs/systems/billing-caps.md` and this file. Seven exceptions, each why:
  - `src/app/api/host/r2/presign-upload/route.ts`: the host strategy's words for the meter's refusals (the engine's new
    required `meterRefusal`; the brief's "the host's and the guest's paths both"), its month sentence one constant.
  - `src/lib/db/mutations/events.ts` and `events.test.ts`: the create action prints the daily breaker's sentence ahead
    of its plan-limit branch, which would tell a Pro host "the event limit for your plan" and offer an Upgrade; the
    test's fake builder gains `insert`.
  - `src/lib/db/migration-guards.test.ts`: the create_media* "ingress meter" guard reshaped on purpose (the check moved
    to the presign), its scar kept.
  - `src/lib/upload/phone-copy-migration.test.ts`: "never metered" no longer pins the ledger's insert (gone from
    create_media*), and "who may call them" reads the grants in the winning file; scars kept.
  - `src/app/api/r2/phone-copy.test.ts`: one line, its admin stub answers the meter.
  - `scripts/seed-demo-event.mjs`: meters each file before its PUT, since it drives the product's write path and
    create_media no longer counts. Not run (it reseeds the marketing demo, the Orchestrator's); `node --check` only.
- **The items:**
  1. The presign counts: `meter_upload` (migration `20261003210500_upload_meter.sql`, called by
     `src/lib/upload/server-pipeline-meter.ts` from the engine after every gate and before any URL) counts the declared
     bytes and the item under the host's profiles lock, after the breaker, the month (the same `monthly_ingress_cap()`
     and strict line create_media read at complete) and the room (the cap and its 10%, so a file the complete would
     refuse never spends the month); `create_media*` neither check nor count the month. Host and guest both. Never
     twice: the complete never asks the meter (`complete-upload/route.test.ts`), and no winning body but
     `meter_upload` writes the ledger (`server-pipeline-meter-migration.test.ts`). It fails CLOSED.
  2. A preview never heavier than its original: refused at presign in words (`preview_refused`, in the preview's slot),
     the original presigned and counted; a preview past 2 MB now says so too (it was silent).
  3. The breakers: an account's uploads a clock hour, 20,000 (`meter_upload`; 429 with `Retry-After`; a guest's words
     name the album, the host's her albums), and its creations in 24 hours, 100 (`enforce_event_limit` on INSERT only,
     after the plan's limit; the wizard prints "You've created a lot of events today. Try again tomorrow.").
  4. The join backstop: 400 to 3,000 a quarter-hour per (address, event), breadth unchanged.
  5. `billing-caps.md` in place (System-doc edits).
- **Red first, then green** (`../_scratch/upload-meter/red-green.log`):
  - the live red walk on today's code (`meter-walk.mjs --mode red`: real guest routes on localhost:3131 against the
    live database and R2): the presign +0, the complete +101,450, an abandoned 242,662 bytes in R2 counted nothing, a
    2,000,000-byte preview beside a 1,000-byte original minted (5/5);
  - the migration's rolled-back proof on the live schema: red 11/11 failing on what each lacks, green 12/12 (both at
    the file's foot), nothing persisted after either (checked); the green run's bodies hash as the file's
    (`fnhash.mjs`);
  - TS: 34 red with the implementation stashed (`red-ts.log`), the touched suites 507/507 green (`green-ts.log`), then
    the whole suite;
  - live, this code against the unmigrated database: the presign fails CLOSED (503 `server_error`, nothing minted, the
    ledger unchanged), on `b0a24025`'s tree and again on `c759a682`'s (`closed-check.mjs`).
- **Pending the apply (the brief's last Verify on):** a real upload, guest and host, counted once at presign and never
  at complete, needs the migration applied and this code deployed (without it the presign fails closed, by design).
  Its SQL is proved by the rolled-back proof (steps 3 and 4: the meter +3,000,000 bytes and +1 item; the host's and the
  guest's completes +0 with the physical and active bytes +5,400,000) and its routes in Vitest; the live walk is one
  command for the guest (`node ../_scratch/upload-meter/meter-walk.mjs --base <alias> --event
  340fcc7b-6c41-48f6-a143-6ef9f6724f4b --mode green`) and two console steps for the host with the ledger's SQL
  (`../_scratch/upload-meter/host-walk.md`).
- **Live test data left**, all in the export wiring probe (disposable): the red walk's photograph (media
  `89c38bbb-ece9-4d81-9652-4b91d50c0633`, 101,450 B, its object in R2), three name-only guest rows ("Meter walk",
  "Meter closed" twice), and willg97's October ledger +101,450 (the meter never refunds). The abandoned object was
  deleted from R2.
- **Assets requested from Will:** none.
- **Board ideas:**
  - A host's month in `/admin` (its bytes, its items, the hour) with an operator's reset for a griefed or mistaken
    month: PRICING says nothing shows a host's meter and there is no override, and Question 9 makes one urgent.
  - Staged uploads (Question 9's recommendation) as their own lane before launch, with backup-prune's Worker filter.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** `supabase/migrations/20261003210500_upload_meter.sql`,
  APPLY BEFORE PUSH (this code fails closed without it), and redeploy partyreel.com in the same sitting: it shares the
  database, and until it runs this code its uploads count nowhere. Its drift check (verified live 2026-10-03):
  create_media `e83666cd…`, create_media_as_host `21f0397f…`, enforce_event_limit `0bc03722…`; after it, the four bodies
  hash `81d65fec…`, `db8c00fa…`, `42fb725f…` and meter_upload `d7015409…`; advisors expected 19 / 4 / 35, unchanged.
  Then regenerate the types and drop the `untyped` seam in `src/lib/upload/server-pipeline-meter.ts`. No Worker,
  Vercel, Stripe or env change.
- **Docs outside the lane this makes stale** (the Orchestrator's to refine; each a line):
  - `uploads-and-r2.md`: the complete route "records the row through `create_media*`, which writes the ledger" (the
    presign's meter writes it now); "No request rate limiter sits on the four routes but one" (the presign's hourly
    breaker, in SQL); the preview bullet (capped at its original too, refused in words).
  - `database-security.md`: `meter_upload` joins the service-role-only inventory and the one-profiles-lock list.
  - `PRICING.md`, What it costs us: the copies' preview, "An upload", "An upload never completed", "A guest" (400 is
    3,000), "(c) Bounds" and the preconditions still name these as to add.
- **Calls his to overrule:** Questions 1 to 9, each built as recommended: the count at presign and its window; the
  room checked before the count; the preview refused, never the upload; 20,000 an hour; 100 a day; 3,000 a
  quarter-hour; fail closed; a retry counts again; ship the count now and stage before launch.

## Where I am

- 2026-10-03: booted; plan and Questions written (above).
- 2026-10-03 20:35Z: the work committed at `a4684412`; red and green logged.
- 2026-10-03 21:00Z: handed off (the Handoff above).
