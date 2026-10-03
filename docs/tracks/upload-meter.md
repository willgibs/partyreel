---
track: upload-meter
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ada60bba"            # the launch-prep SHA the branch was cut from
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

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...

## Where I am

- 2026-10-03: booted; plan and Questions written (above).
- 2026-10-03 20:35Z: the work is committed at `a4684412` (the migration with its live red 11/11 and green 12/12
  rolled-back proof at its foot; the engine's meter; both strategies' words; the preview; both breakers; the join
  backstop; the create action's words; the seed; two reshaped pins). Red and green logged at
  `../_scratch/upload-meter/red-green.log` (the live red walk, the SQL red and green, the TS red 34 failing and green
  507/507). Typecheck and lint green. Next: billing-caps.md, the whole gate, lab:smoke, the Handoff.
