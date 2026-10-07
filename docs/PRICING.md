# Partyreel — Pricing & tiers

> ROLE: the plans: their prices, limits and model, Pro's case, what running it costs us (the three rules, vendor
> prices, the atlas of every cost a host can drive, each plan's worst month, the archetypes, the breakeven, each
> vendor's guard, the levers), and the Stripe and email setup a human runs, the test-to-live cutover included. · NOT HERE: the product why (→ [`PRD.md`](PRD.md) "Monetization and
> anti-abuse (the why behind the schema)" and "Data retention and lifecycle"), the engineering (cap enforcement, the
> webhook and provisioning: → [`systems/billing-caps.md`](systems/billing-caps.md)), the lifecycle sweeps
> (→ [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md)).
> GROWS BY: refined in place; [`src/lib/constants/tiers.ts`](../src/lib/constants/tiers.ts) is the source of every
> plan number, and where this doc and the code disagree, the code wins; a vendor price is re-read from its page and
> dated.

Stripe runs in TEST mode (account `acct_1TcStrPtjqmVkBwk`); going live is a launch switch ("Test to live cutover"
below).

## Model

- **Storage-based, not item counts.** A plan is a total stored-bytes cap. `profiles.tier` is the **billing category**
  (`free | pro | event_pass`); the granted cap lives in `profiles.storage_cap_bytes` (set by the Stripe webhook from
  the purchased plan), so Pro's storage selector is just different caps under `tier="pro"`.
- **Deleted counts in storage** (Will, 2026-10-03): the cap holds everything a host keeps, her albums and her Deleted
  together, so deleting frees nothing until an item leaves Deleted for good (her Delete permanently or Empty Deleted,
  the 30-day purge, or, with Make room from Deleted on, the default, the oldest first when an upload needs room). One
  number under one cap is the clear model, what a plan stores is its cap and its 10% write headroom whatever she
  deletes, and a host who would rather not delete for good to free space moves up a size. A full Deleted never refuses
  a guest's photo while the setting is on, which is why it is on.
- **Stripe Prices are the billing truth**, referenced by env key; `tiers.ts` carries the plan shape and the display
  labels, and `tier_limits()` in SQL mirrors its limits. A price change is a new Stripe Price, its env value (a
  redeploy) and the label, together.
- **Pro's case is what one big event needs (video, more storage, clips with no mark), never only hosting again:**
  most paid hosts hold one event, a wedding above all, so a line that sells Pro as "for your next event" loses them.
- **Free is nearly the whole experience, sized for a small gathering,** so what paid adds is a short list a host can
  read at a glance: video, more storage, unlimited events, clips with no mark. The password, the custom link and
  full-length clips are on every plan; Free keeps 100 MB (about 30 photos at an iPhone's defaults), photos only, one
  event and the mark on clips, so a real event is the reason to pay. Set before launch, so the only-move-up rule
  below starts from 100 MB.
- **No refunds, on a cancel or an account's deletion** (Will, 2026-10-03): a deletion cancels the plan at once and the
  rest of the period is not refunded, and the dialog says so; a refund would invite upgrading on the event's day and
  claiming most of it back days later.
- **The uploads allowance** (bytes uploaded, never refunded on delete) is the anti-abuse guard, because storage caps
  alone don't stop delete-and-re-upload churn, which the backup and every upload's operations bill. **A limit a host
  could meet is published** (Will, 2026-10-03), so every plan carries its own number in the pricing table's Uploads
  row, with its hover line: Free 300 MB a month, a pass 50 GB over its year, Pro 100 / 200 / 500 GB a month by size.
  It is never one multiple of the cap: its share of the room falls as the plans grow (3× a month on Free, 2× a year on
  a pass, then 2×, 1× and about ½× a month on Pro), because a big plan's month never re-fills it and the plan's worst
  month is what sizes its price ("What it costs us"). A pass counts its own year, on the pass, so its event can take
  the whole allowance in one night. Published, each number only moves up; a circuit breaker no real host meets stays
  unpublished. The one outcome worth engineering against is still a false positive blocking a paying host: `/admin/accounts`
  shows each host's meter against her allowance (read-only), and the override is the calls lab's X6 (an audited credit).
- **A marketed number can only ever move UP.** Grandfathering makes every published limit sticky, so each one lands at
  the conservative-but-generous end: raising a limit later is a gift, lowering it is a broken promise. That asymmetry,
  not precision, is what picks these numbers.
- **No watermarks on photos, the album or the live reel, any tier** (only a free event's clips carry a small mark).
- **The universal per-file limit** (every plan) lives in `lib/media/limits.ts`: **10 GB per file, photos and videos
  alike.** Size is the only per-file gate (a host may set a lower one per event), and there is no duration cap.

## Tiers

**Ladder A** (Will, 2026-10-03 and 10-04: "send it on pricing tier A with $99", the renewal at $19): an event, or a
year of them.

| Plan           | Price                      | Storage | Uploads             | ≈ holds                              | Events                      |
| -------------- | -------------------------- | ------- | ------------------- | ------------------------------------ | --------------------------- |
| **Free**       | $0                         | 100 MB  | 300 MB a month      | 29 photos (photos only)              | 1                           |
| **Event Pass** | $29 one-time, $19 to renew | 25 GB   | 50 GB over its year | 7,314 photos or 7 hours of video     | 1 per pass, each for a year |
| **Pro 50 GB**  | $9/mo or $90/yr            | 50 GB   | 100 GB a month      | 14,629 photos or 13 hours of video   | unlimited                   |
| **Pro 200 GB** | $29/mo or $290/yr          | 200 GB  | 200 GB a month      | 58,514 photos or 53 hours of video   | unlimited                   |
| **Pro 1 TB**   | $99/mo or $990/yr          | 1 TB    | 500 GB a month      | 299,593 photos or 269 hours of video | unlimited                   |

Each step is a host's next natural use, which is how the pricing page labels it (a plan is never named by its size
alone, since GB for GB a cloud drive is many times cheaper): the pass is one big event kept a year (a 200-guest wedding,
twice over), Pro 50 GB a season of parties, Pro 200 GB a planner's year, Pro 1 TB a venue's year, at a price a GB that
falls gently ($0.18, $0.145, $0.097) and never under the plan's worst month. Every card leads with the events it holds
(`BIG_PARTY` in `tiers.ts`: 200 guests' 2,000 photos and 100 half-minute clips, about 10 GB of originals) and keeps the
GB in its row; the pass says "one payment, no subscription", the line its market sells on.

**What it is priced against** (each rival's own page, read 2026-10-03). Of sixteen products that do what Partyreel does
(QR uploads, wedding albums, disposable cameras, live walls), fifteen sell one event for one price, and "no
subscription" is their loudest line; a wedding kept a year with video costs $29 to $99, the median $49
([GuestPix](https://guestpix.com/weddings-pricing/), [Wedibox](https://www.wedibox.com/pricing),
[GuestCam](https://guestcam.co/pricing) and [WedUploader](https://weduploader.com/pricing) at $49;
[WeddingSnap](https://www.weddingsnap.io/pricing), the one that publishes its GB, $39.99 for 50 GB a year). Almost none
meters storage: they meter uploads (free tiers of 50 to 100), guests (the disposable cameras:
[POV](https://pov.camera/pricing) asks $34.99 for 100) and time (uploads open a day to a year, albums kept a week to two
years), and they charge more for video (a $9.99 add-on at [Lense](https://lense.app/pricing) and
[Scene](https://scenedisposable.com/pricing)); a published renewal is rare (GuestPix's $49 a year). The free floor moved
with iOS 27: a [temporary shared album](https://support.apple.com/en-us/127875) guests add to on the web at full
resolution, free for 30 days. GB for GB, cloud storage is 9 to 19 times cheaper than Pro
([iCloud+](https://support.apple.com/en-us/108047), [Google One](https://one.google.com/about/plans)), and a
photographer's gallery ([Pixieset](https://pixieset.com/pricing/)) costs more than Pro at small sizes and a third of it
at 1 TB. What no rival offers together is no guest limit, no upload window and video of any length to 10 GB a file.

The ≈ column is `formatCapacity` in `tiers.ts`, the phrase /pricing, the plan sheet, the help and the blog print; the
site derives it from the GB and never types it. **It assumes an iPhone at its default camera settings, and every
surface says so**, because an estimate with no camera behind it is a random claim: a 24 MP High
Efficiency photo at about 3.5 MB and a minute of 1080p at 30 fps at about 65 MB, from Apple's own figures (the
derivation and the sources are the constants' comment). `ESTIMATE_BASIS` is the phrase and `ESTIMATE_BASIS_NOTE` the
working.

- **Annual Pro is exactly ×10 the monthly, marketed as "two months free"** (a Vitest pin holds each yearly label at
  10× its sibling). Why not deeper: a yearly price is every plan's thinnest at its worst month, Pro 50 GB's the
  thinnest of all (1.38×, "What it costs us": the worst month), so starting conservative leaves deepening as a later
  gift. The yearly Stripe prices live on the SAME products as the monthly ones (one product per size, so the size reads
  the same in Checkout and on Stripe's confirm page); env keys `STRIPE_PRICE_PRO_{50,200,1TB}_YR`. A plan id and its
  env key name its size (`pro_50`, `STRIPE_PRICE_PRO_50`), so a key never names a price it does not hold. A Pro host moves between sizes and cadences from the app's plan sheet (her
  three sizes under one Monthly / Yearly toggle, the saving tagged beside Yearly and computed from these labels;
  `/api/stripe/change-plan`, `proration_behavior: always_invoice`), and a pass holder's prorated credit lands as
  customer balance, which pays the NEXT invoice: on yearly, that is a year out (never lost).
- **Export is an off-ramp, never a one-click exit** (Will, 2026-10-05). Download and Send to Google Drive take every
  original home, so a month of Pro for one wedding is an easy opt-in with no fear of lock-in ("$9 for a month, export
  everything, don't renew", against the $29+ platforms); but nothing in an export suggests deleting what it sent:
  deleting stays where it already is (select and delete in an album, Delete event in Settings, What's using space),
  because stored media is what the storage tiers are paid for.
- **A plan change never leaves a host storing more than the new cap** (Will, 2026-09-22). Any Pro purchase or Pro
  size change must hold what the host already stores (her albums and her Deleted against the plan's plain cap); a
  smaller one is refused with the numbers ("You're storing 70 GB. Pro 50 GB holds 50 GB, so free 20 GB first, or
  choose Pro 200 GB, monthly.") until they free enough. An Event Pass is never refused (passes stack). So Partyreel never
  removes media, or pays for storage beyond the plan, because of a purchase; the 45-day over-capacity grace
  remains for a plan that ENDS. The mechanism: [`systems/billing-caps.md`](systems/billing-caps.md).
- **What Free gates.** **Video is paid** (Pro and the Event Pass; a free event is photos-only for guests AND the host,
  enforced at upload in `create_media` / `create_media_as_host` and mirrored client-side by `videosAllowedForTier`),
  and so is a clip without the mark. **No event setting is paid:** the password lock and the custom link are on every
  plan (`GATED_EVENT_SETTINGS` is empty, and the setter RPCs refuse no tier; the lock machinery stays for video, so
  a setting can be gated again in one list and one migration). **Require verified emails** and **Require an upload to
  view** are free on every plan: the first on by default (allowing a typed, unverified name is the opt-in), the
  second off. **A clip runs 60 s on every plan** (`MAX_REEL_SECONDS`: its length is the least of what a host pays
  for, and past 60 s a montage sags while losing its Reels and TikTok reach), and making one is free on
  every tier (a small mark on Free); the live reel itself has no cap and no mark anywhere, and adding a clip to the
  album is a video upload, so it is paid.
  The first-event experience must still shine; it sells the upgrade. **The upgrade triggers** (each opens the in-app
  pricing sheet on its own reason): a second event, outgrowing Free's 100 MB, or wanting video.
- **A custom link on Free is guarded against squatting** (a throwaway account can now hold one): `set_event_slug`
  refuses the reserved words in SQL (`RESERVED_SLUGS`, mirrored and parity-tested), since the RPC is callable past
  the server action; and a slug frees when its event is deleted, for good: a restore brings it back only while it is
  still free.
- **Event Pass economics.** Passes **STACK**: each purchase is a ledger row granting +1 event slot, +25 GB and its own
  50 GB of uploads for its own one-year window (`event_passes` + `profiles.event_slots`; its uploads counted on the row,
  `uploaded_bytes`). Moving to Pro converts every live pass into
  **PRORATED CREDIT**: the unused fraction of what was actually paid becomes Stripe customer balance that pays down
  upcoming Pro invoices (nothing banked, nothing lost), at a Pro size that holds what the passes store. The renewal ($19, `STRIPE_PRICE_EVENT_PASS_RENEWAL`) is sold
  only to a holder with a pass window active now (read from the ledger at checkout) and chains a new window onto the
  soonest-expiring active pass: it extends, never resets, and an unopened renewal year credits at 100%. The
  dashboard's "Renew Event Pass" button and the pre-expiry nudge email (14 days out) point at it. The renewal is $19
  (the Advisor's Q16): a typical album costs us $3 to $5 a year, an easy yes, and a full 25 GB pass ≈$10.72 a year to
  keep, so the renewal carries a full pass and its own year's 50 GB of uploads at 1.45× ("What it costs us": the worst
  month). Once sold it binds every holder who renews, so it is priced to outlast our vendors: $19 absorbs a 45% rise
  in what a pass costs us, where $15 absorbed 14%. At expiry without renewal the account recomputes down (eventually
  to Free, with the over-capacity grace if it holds more than Free's cap: [`PRD.md`](PRD.md) "Data retention and
  lifecycle"). /pricing surfaces the renewal price (the pass card, the table and the FAQ) through
  `EVENT_PASS_RENEWAL_PRICE_LABEL` in `tiers.ts`.

## Grandfathering

The policy for the first price change: a **paid subscription keeps its join-time rate for as long as the plan stays
active**. Grandfathered plans also **inherit beneficial changes** (price drops, storage bumps) but never adverse ones.
A lapse to Free **breaks** grandfathering; re-subscribing pays current pricing. Mechanically this means **several
historical Stripe Price IDs per plan**: `planForPriceId` (`src/lib/stripe/plans.ts`) must map every historical Price
ID to its plan (the newest is the public offer), and Price IDs stay out of the client-safe `tiers.ts`. Unbuilt:
`planForPriceId` maps one Price ID per plan, and the build lands with the first real price change
([`ROADMAP.md`](ROADMAP.md) "Billing follow-ons").

## What it costs us

Every vendor price is its own page, read raw on 2026-10-03; every count is the code's at its file and line (paths
under `src/lib` unless named); ≈ marks an assumption, ours to change; a total is its count times its price. Three rules
hold the model:

1. **One marketed axis, storage.** Whatever a host can make us spend is one of three classes: (a) bytes-months, priced
   by her cap (her media, its copies, Deleted, the backup, re-uploading); (b) a per-request constant, tiny by
   construction (an upload, a view, a sync, an email, a confirmed guest, Stripe's fee); (c) a bound: a published,
   gracious limit wherever a host could ever meet one (Will, 2026-10-03: a row in the pricing table with a hover
   explainer, the monthly uploads first), or a circuit breaker no real host meets (a script uploading without end, a
   looped function). A cost in none of the three is a bug, and a new feature names its class before it ships.
2. **No plan's worst month costs more than its price, net of Stripe.** The worst month is the cap's at its limits:
   her albums and her Deleted together at the cap and its 10% headroom, the month's uploads at their allowance, the
   backup holding all of it, plus the live cost of its events. It is provable only once the backup's prune keeps up and the
   live album grows with viewers × time, never uploads × viewers; the levers below buy both.
3. **Guards are circuit breakers, not budgets.** Every vendor without a cap gets one of ours (`spend-watch`): past 10×
   the trailing peak it alerts, and pauses the switch that stops the vector only where a false alarm costs no guest's
   moment (an uploads trip only offers its switch on the `/admin/jobs` card; some trips only alert). Growth is never a
   10× day; a looped function is.

| Line | Price |
| --- | --- |
| [R2](https://developers.cloudflare.com/r2/pricing/), `partyreel` | $0.015 a GB-month (each day's peak, averaged); Class A (PUT, List, multipart) $4.50 and Class B (GET, HEAD) $0.36 a million; egress, deletes and aborts free; 10 GB, 1M A and 10M B free a month |
| R2 Infrequent Access, `partyreel-backup` | $0.01 a GB-month; A $9.00 and B $0.90 a million; $0.01 a GB read back; 30 days minimum |
| [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [Queues](https://developers.cloudflare.com/queues/platform/pricing/), [Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/) | $5 a month for 10M requests and 30M CPU-ms, then $0.30 and $0.02 a million; 1M Queue operations, then $0.40 a million, three a message; a Durable Object $0.15 a million requests, outgoing WebSocket messages free |
| [Vercel](https://vercel.com/pricing) | Hobby is [non-commercial](https://vercel.com/docs/limits/fair-use-guidelines); [Pro](https://vercel.com/docs/plans/pro-plan) $20 a seat a month with a $20 credit. [Functions](https://vercel.com/docs/functions/usage-and-pricing) and the proxy, [billed alike](https://vercel.com/docs/routing-middleware) (iad1): $0.60 a million invocations, $0.128 a CPU-hour (I/O waits free), $0.0106 a GB-hour while a request is in flight. CDN: Pro's [Flat Rate](https://vercel.com/docs/pricing/flat-rate-cdn) holds 1M requests and 1 TB, then $20 (10M), $100 (50M), $300 (150M) a month; [on demand](https://vercel.com/docs/pricing/regional-pricing/iad1), $2 a million requests and $0.15 a GB |
| [Supabase](https://supabase.com/pricing) | Pro $25 a month, Micro in its $10 credit; 100,000 MAU, then $0.00325 each; 250 GB egress (every service, the database's answers too), then $0.09 a GB; disk 8 GB, then $0.125 a GB; Realtime 500 peak connections, then $10 a thousand, and 5M messages, then $2.50 a million, a broadcast counting [one plus one a listener](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages); compute Small $15, Medium $60, Large $110 to 8XL $1,870 a month, changed by hand |
| [Resend](https://resend.com/pricing), [Sentry](https://sentry.io/pricing/) | email free to 3,000 a month (100 a day), Pro $20 for 50,000 with no daily cap, then $0.90 a thousand; errors free to 5,000, Team $26 a month billed yearly for 50,000 |
| [Stripe](https://stripe.com/pricing) | 2.9% + 30¢ a charge, [0.7% more on a subscription](https://stripe.com/billing/pricing), 1.5% more on an international card: $0.62 of $9 (6.9%), $1.34 of $29, $3.86 of $99 (3.9%), $3.54 of $90 a year, $35.94 of $990, $1.14 of a $29 pass, $0.85 of a $19 renewal |
| Fixed, at launch | ≈$98 a month: Vercel Pro $20, Supabase Pro $25, Workers Paid $5, Resend Pro $20, Sentry Team $26, the domain ≈$2; [Cloudflare Pro](https://www.cloudflare.com/plans/) $25 ($20 billed yearly) with the media domain; the database's compute is the first line to step |

### The atlas

Each way a host can make us spend, with its price, its class, what bounds it today, its worst for one host and what
bounds it better. ≈ The operations behind the per-item figures: a call ≈3 ms of CPU, ≈4 ms a database round trip and 20
ms an Auth one, 2 GB held for the wall time with no sharing, the proxy a second invocation on a page that renders a
session, never on an API route. The compute model measured the CPU higher (Vercel's average ≈44 ms a call,
`VERCEL_CPU_SECONDS_PER_CALL` in [systems/admin-observability.md](systems/admin-observability.md); locally a quiet poll
≈17 to 26 ms and the guest page ≈250 to 420: [systems/architecture.md](systems/architecture.md) "Compute budget"), so
the CPU in the per-call lines below is low until they are re-run (`usher/kit/cost-model/`).

**(a) Bytes-months, priced by the cap**

- **Active media.** $0.025 a GB-month with its backup. Bounded, with Deleted, by the cap and its 10% write headroom
  (`supabase/migrations/20261003220000_deleted_counts.sql:511`, `capWithWriteHeadroom`, `constants/tiers.ts:402`).
  Worst: 1.1 × the cap, Deleted included.
- **The copies.** A ≈60 KB preview and a photograph's ≈1 MB phone copy, never metered: ≈30% on a photo's bytes, nearly
  nothing on a video's. The phone copy fits within 4 MB and half its original (`media/preview-size.ts:92,112-121`); the
  preview within 2 MB and its original's declared bytes, checked at presign only (`previewRefusal`,
  `upload/server-pipeline.ts`, `media/preview-size.ts:21`): past either, the preview alone is refused and its tile
  serves the original. Worst: ≈1.3 × the media for a real host.
- **Deleted.** Inside the cap, for 30 days (`supabase/migrations/20261003220000_deleted_counts.sql`: the cap reads
  `host_storage_summary`, her albums and her Deleted), so a restore-and-re-delete cycle stores nothing past it. An
  item leaves early only for good, its object waiting for that night's purge (`leave_deleted`), so a refill day's
  peak holds what left beside what arrived: at 2× a month (Pro 50 GB's allowance), ≈0.07 × the cap averaged. Worst:
  ≈$0.0013 a GB of cap a month. Infrequent Access for the tail would save a third, but its 30-day minimum and $0.01 a GB read back make one
  restore cost more than it saved.
- **The backup.** Every object a complete lands in `events/`, copies included (`backupOne`,
  `workers/backup/src/index.ts`; the queue skips any other key), into Infrequent Access under a 35-day lock. Accrue-only
  today: the prune runs dry (`PRUNE_MODE`, `workers/backup/wrangler.jsonc`), so a deleted byte stays at $0.013 a
  GB-month, copies included, for good. Worst: unbounded (Pro 50 GB re-filled at its 2× a month carries ≈$16 a month of
  backup a year in). Better: `PRUNE_MODE=live` (the prune's cursor and its caps sized to the deletions are built), the
  invariant's precondition, then the backup holds the live set and 43 days of uploads (the 36-day gate and the weekly
  cadence); then originals only, once something can remake the copies.
- **Re-uploading (delete and re-upload).** ≈$0.0165 of operations a GiB of photos uploaded (each one three PUTs, two
  HEADs, three backup copies at $10.26 a million, nine Queue operations, four invocations) and $0.0013 a GiB of clips,
  plus 43 days of backup. Bounded by each plan's published uploads allowance, never refunded (`upload_allowance`,
  `uploads_used`, 20261004100000): 3× the cap a month on Free, 2× a year on a pass, 2×, 1× and ≈½× a month on Pro.
  Worst at 2× (Pro 50 GB): $0.033 of operations and $0.050 of backup a GB of cap a month.

**(b) Per-request constants**

- **An upload.** A burst of up to 20 files takes one presign and as few completes as its landing allows, its bytes one
  file at a time (`upload/burst.ts`), about seven database round trips (`src/app/api/r2/presign-upload/route.ts:24,89`,
  `src/app/api/r2/complete-upload/route.ts:49,74,95`, `forensics/capture.ts:50,62`), the browser's PUTs straight to R2
  (16 MB parts from 100 MB: `media/limits.ts:83-85`) and two HEADs (`upload/server-pipeline.ts:506,586`): ≈$0.056 a
  thousand photos and $0.040 a thousand clips, the backup included. The presign's meter holds an account to 20,000
  uploads a clock hour, every guest's and her own, failing open (`meter_upload`'s `c_uploads_an_hour`): far past any
  party, so a flood of tiny files is ≈$0.06 a thousand, ≈$1.20 an hour at the breaker.
- **An upload never completed.** A presigned PUT lives two hours and is not single-use (`r2/presign.ts`), but a single
  PUT lands at its key's `staging/` twin, which only a complete copies into `events/`, and a multipart becomes an object
  only at the complete's assembly; the backup and the orphan sweep (resuming from its cursor) read `events/` alone, and
  R2's lifecycle rules delete `staging/` a day on and abort an unfinished multipart. Worst: the bytes a sender actually
  pushes, unmetered: a day at the primary's price in `staging/`, an unfinished multipart's parts until the abort rule;
  the backup never sees them.
- **A view, a Save, a zip.** GETs at $0.36 a million, egress free: a tile is one preview GET
  (`src/components/app/media-grid.tsx:18`); the viewer reads its original once, `no-store` (`media/share-save-held.ts`);
  Save mints at most 2,000 links and fetches three at a time (`export/take-home.server.ts:37`,
  `src/components/app/export/take-home-save.ts:61`); a zip heads or lists, then GETs each object once
  (`workers/export/src/check.ts:43,72,98`, `index.ts:174`), 2,000 items or 20 GB a part
  (`export/build-manifest.ts:22-23`). Bounded by the mint limiter, 15 albums an hour and 100 mints a quarter-hour an
  address, failing open (`security/abuse-rate-limit.ts:115-120`); a token replays for two minutes
  (`export/export-token.ts:30`); Save is unlimited. Worst: ≈$0.0007 a full part, so a thousand downloads of a 2,000-item
  album cost $0.72. Nothing better needed.
- **A page load or a refresh.** `/e/<token>` at full access is ≈18 round trips and ≈150 presigns
  (`src/app/(guest)/e/[token]/page.tsx:299,459,490`): ≈$0.00026 with a first visit's ≈0.85 MB of static assets, $0.00003
  a repeat, plus the guest count's walk below.
- **A page open indefinitely.** A visible tab polls every 60 s under its socket, every five minutes after ten untouched
  minutes, and not at all after two untouched hours (the reel's screen, `unattended`, only rests); with no socket, every
  12 s while the album moves and every minute once it is quiet (`shared/use-live-poll.ts`). It re-mints up to 600 links
  an hour after a sync (`album/links.ts:124`, `album/store.ts:302`): ≈$0.15 of polls a month at a minute, about a fifth
  at rest, $0.04 of re-mints, and one connection while visible.
- **The wall screen and the endless reel.** `?reel=screen` keeps its wake lock for good (`guest/screen-posture.ts:128-132`),
  plays a still every 3 s (`reel/defaults.ts:25`), re-read `no-store` past 48 decoded (`reel/engine/asset-cache.ts:25`,
  `reel/engine/assets.ts:86`), and re-reads every clip window (`reel/engine/video/window-reader.ts:114`) to 200 MiB a
  session (`reel/engine/video/budget.ts:51`): ≈$0.34 of GETs a month, $0.54 a screen with its polls. Linear in screens.
  Better: the media domain, where an edge hit costs no GET.
- **The live album.** One broadcast per guest-visible change (the trigger,
  `supabase/migrations/20260611220000_gallery_doorbell.sql:70-72`; the send,
  `20261002200000_disposable_foundation.sql:477`), billed one plus one a listener. Since `album-calm` (merged at
  `fdd0dc9b`), only a visible tab listens: it syncs once a batch, at its next tick of a 15 s clock with its own phase
  (`guest/refresh-coalescer.ts`, `ALBUM_BATCH_MS`), her own upload, a host's own write and a tab's return at once; a
  hidden tab leaves the channel and asks nothing until its return's one catch-up (`guest/use-gallery-doorbell.ts`,
  `shared/use-live-poll.ts`); a delta carries its newest 48 items' links (`events/album-wire-links.server.ts`), so a
  links call is left for windows, the reel tile's stills and re-mints. Calls and messages still grow as uploads ×
  visible tabs, a beat apart. A sync costs ≈$3.50 a million as a 304 and $4 as a delta, on an API route that runs no
  proxy (`src/proxy.ts`'s matcher). Worst: the 2,000-guest wedding, ≈$33 in an evening before `album-calm`, ≈$11 after.
  Next: one ping a beat or one push per album.
- **The guest count on every sync.** Every 200 sync, and every page load, walks every guest upload and guest row of its
  event to print "from M guests" (`src/app/api/album/guest/sync/route.ts:201`,
  `db/queries/guest-events-admin.ts:229-234`, `db/queries/social.ts:941-989`): ≈96 B a row of JSON, ≈28 gzipped, of
  database egress past 250 GB at $0.09 a GB, and the database's CPU, ≈0.9 billion rows read at the wedding. Better:
  count once per album a beat.
- **Attribution's re-mint.** A rename, a confirmation or a claim after an upload moves the album's attribution
  (`supabase/migrations/20260926100000_album_version.sql:16`) and stales every held link (`album/links.ts:154`): every
  open tab re-mints up to 600 at its next sync, the presigning signed by hand (`r2/sigv4.ts`), about a twelfth of the
  SDK's ≈100 ms a 200. Better: attribution rides the sync.
- **A guest.** Nothing bounds the guests of an event (`create_guest`,
  `supabase/migrations/20260930140000_one_account_one_ticket.sql:111,273`); the join limiter counts per address and
  event, 3,000 a quarter-hour, sized for the wedding (`security/abuse-rate-limit.ts`). A confirmed guest is a Supabase
  user (`src/components/auth/email-sign-in.tsx:290,335`): an MAU at $0.00325 past 100,000 and ≈1.1 code emails at
  $0.0009 past Resend Pro's 50,000, ≈$0.0042 at scale and nothing below it. Linear in guests: 1,000 confirming, $4.24 at
  scale. Better, near 70,000 MAU: confirming a guest without an Auth user.
- **An event.** Pro keeps unlimited (`MAX_EVENTS`, `constants/tiers.ts`), and a breaker refuses an account's 101st
  creation in any 24 hours, a deleted one included (`enforce_event_limit`, 20261003210500). The dashboard reads every
  event (`db/queries/events.ts:92-110`) and presigns up to four stills each (`:203`), and the bell reads them all again
  when anything waits (`db/queries/notifications.ts:35-37,141-144`): ≈2,000 presigns and ≈0.3 s of CPU a load at 500
  events. Worst: O(events) a load; a flood of empty events is at most 100 rows an account a day. Better: the dashboard
  pages.
- **A huge album.** The hub reads the whole manifest server-side while its client pages it again
  (`src/app/(app)/dashboard/[eventId]/page.tsx:271`, `event/host-album.server.ts:115-132`), and the storage list's
  overview reads every active media row of the account (`db/queries/storage-list.ts:184-205`): O(items) a load. Better:
  the Reel card reads the take's head; per-event sums in SQL.
- **Email.** Lifecycle mail goes once a state (`email/send.ts:68,85`), $0.90 a thousand past Resend Pro's 50,000. Codes
  are Supabase Auth's, over Resend SMTP, bounded by [Auth's limits](https://supabase.com/docs/guides/auth/rate-limits):
  emails a project an hour (`rate_limit_email_sent`, set at 100 in the dashboard), 30 requests a 5 minutes an address
  and one a minute a user, the form waiting 60 s (`src/components/auth/email-sign-in.tsx:55`). Worst: the project's
  hourly limit at $0.0009 each, $0.09 an hour today.
- **Hosting and functions.** No guest byte crosses Vercel (`media-cost-policy.test.ts`); a first visit is ≈0.85 MB of
  static assets, so Flat Rate's included 1 TB holds ≈1.2M first visits a month. The proxy runs only before a page that
  renders a session and on every path of the admin host, asking Auth about a signed-in caller (`src/proxy.ts`'s matcher,
  `supabase/middleware.ts`); an API route runs none, and a route handler misses React's `cache()`, so a signed-in album
  request asks Auth twice (`events/album-viewer.server.ts:74,99`). Better: one `getUser()` a request.
- **Realtime's connections.** The cycle's peak, $10 a thousand past 500. With the spend cap on, Pro stops at 500
  connections and 500 messages a second, 10,000 and 2,500 without
  ([limits](https://supabase.com/docs/guides/realtime/limits)); past the first a new socket is refused, past the second
  the project's sockets are dropped, and an album falls back to its 12 s poll. A hidden tab leaves its channel, and
  supabase-js closes a socket left with none 50 s on (`guest/use-gallery-doorbell.ts`), so only a visible tab holds a
  connection.
- **The jobs.** ≈$0 a day: the purge cron, 60 s at most (`vercel.json:5`, `src/app/api/cron/purge/route.ts:85`); the
  reconcile merges both buckets' listings daily from its cursor, a thousand keys a page
  (`workers/backup/src/reconcile-run.ts`); the prune walks the backup weekly from its cursor; the export heartbeat; the
  nightly database dump into the backup's `db/` (`.github/workflows/db-backup.yml:35,158`), which nothing prunes, ≈$0.01
  a GB-month a night kept.
- **Observability.** Sentry traces 10% (`observability/sentry.ts:103`) and replays only on an error
  (`src/instrumentation-client.ts:31-32`), its plan dropping what passes the quota; Web Analytics runs on the marketing
  pages only (`src/app/(marketing)/layout.tsx:31`), $3 a 100,000 events past 50,000 on Pro.
- **Stripe's fee**, on every charge (the table above), and **a Free account**: 100 MB, ≈$0.003 a month with its copies,
  its creation bounded by Auth's limits and its event resting after two quiet years (`lifecycle/inactivity.ts:7`).

**(c) Bounds.** Published, each a row of the pricing table with its hover line (Will, 2026-10-03: any limit a host could
meet): storage, uploads (each plan's own), events, guests (no limit), a file's 10 GB, Deleted's 30 days and that it
counts in storage, how long each plan keeps an album, Free's photos only and its two-year rest. The table's fine print
says the rest in one line, the fair-use line: every plan is for real events, and behind the table we watch only for
automated abuse, which we may slow or pause, resting on the Terms' "reasonable limits on upload volume, download
bundling and other activity" and their bar on getting around a plan's limits (`constants/legal-terms.tsx:188,193`).
Unpublished, because no real host meets them: an account's uploads a clock hour (20,000) and its events a day (100)
(`upload_meter`, 20261003210500), Auth's hourly email limit and spend-watch's 10×, and a preview no heavier than its
original; `content-policy.test.ts` fences the word "ingress" and the breakers' numbers. "No guest limit"
(`src/components/marketing/jsonld.tsx:86`, the FAQ, `content/llms.ts:120`) and "unlimited events"
(`src/components/marketing/sections/pricing/unlock-grid.tsx:53`, `constants/marketing-voice.ts:130`) stay true, because
a guest is a constant and an event pages.

### The worst month

Per GB of cap, photographs (a video's copies weigh nothing), Deleted inside the cap, the backup's prune keeping up
unless named:

| Case | A GB of cap a month |
| --- | --- |
| Full, nothing deleted or re-uploaded | $0.036 (video $0.028) |
| Re-uploaded 2× (Pro 50 GB's allowance) | $0.105: primary $0.022, backup $0.050, operations $0.033 |
| The same, the prune dry, a year in | $0.381 |
| Re-uploaded 1× (Pro 200 GB's) | $0.070 (video $0.042) |
| Re-uploaded ≈½× (Pro 1 TB's) | $0.052 |
| Re-uploaded 1×, the backup holding originals only | $0.056 |

With Deleted inside the cap the primary holds 1.1 × the cap (a refill day's peak aside), so what is left is churn: the
backup's 43 days of uploads and their operations. Every Ladder A plan keeps rule 2 at its worst month, before any
lever: Pro 50 GB costs $5.24 against $8.38 net of Stripe (1.60×; yearly 1.38×, the thinnest), Pro 200 GB $13.92
against $27.66 (1.99×; 1.67×), Pro 1 TB $52.90 against $95.14 (1.80×; 1.50×), the pass $12.48 a year against $27.86
(2.23×) and its $19 renewal, a year with its own 50 GB, the same against $18.15 (1.45×; a full pass kept a year with
no upload, $10.72). Free at its worst is $0.014 a month. A one-time pass is the tightest kind, since its single price
carries a year, which is why its renewal's price sets its size and its uploads count over its year (the event and a
second round) rather than a month. Each holds only while the prune keeps up: dry, Pro 50 GB's worst is $19.07 a
month.

### The archetypes

| Archetype | Today | After `album-calm` and the levers | Against |
| --- | --- | --- | --- |
| Cheap: a Free event at its cap (29 photos, 20 guests, 10 confirming) | $0.06 its month at scale, then $0.003 a month | the same | $0 |
| Typical: Pro 50 GB, three parties kept (36 GiB), one more a quarter | $1.39 a month | $1.17 | $9 ($8.38 net) |
| Expensive: Pro 200 GB full, Deleted inside, re-filled 1× a month (its allowance), a 2,000-guest wedding a month | $53 a month ($81 with the prune dry, a year in) | $18.55 | $29 ($27.66 net) |
| Guest-heavy: the wedding's live album and its guests alone | $37 an evening | $11.40 after `album-calm`, $5.53 after the levers | |
| Video-heavy: Pro 50 GB full of video, re-filled 2× (its allowance) | $2.88 a month (full and still, $1.38) | $2.88 | $9 |
| Churn: Pro 50 GB re-filled 2× a month, photographs | $5.24 a month ($19.07 with the prune dry, a year in) | $3.98 | $9 |
| Always-open: one screen on the reel all month | $0.54 a month and a connection | $0.39 | |
| The 2,000-guest wedding (1,000 confirming, 9,500 photos, 500 clips, ≈200 tabs over five hours): 58 GiB kept, $1.46 a month | $39 once: the live album $33 (960,000 syncs, 557,000 links calls, 2M messages, 143 GiB of egress gzipped, $65 raw), its guests $4.24, page loads $1.35, uploads $0.56 | $13 after `album-calm`, $7.44 after the levers | the plan that holds its ≈49 GB of originals: two passes ($58) or Pro 200 GB ($29 a month) |
| Photographer or venue: Pro 1 TB full, refreshed at its 500 GB a month, eight parties a month | $64.70 a month | $50.87 | $99 ($95.14 net) |

The reference party (200 guests over five hours, 2,000 photos and 100 clips of ≈30 s, ≈20 tabs with the socket up,
≈100 confirming, ≈400 visits the week after) stores 12.1 GiB ($0.30 a month) and costs $1.47 once today (its live album
$0.76: 39,000 syncs, 20,500 links calls, 44,100 messages), $0.90 after `album-calm` and $0.82 after the levers.

### Breakeven and light-per-heavy

The fixed ≈$98 a month (≈$123 with Cloudflare Pro) is covered by 14 typical Pro hosts at $9, each netting ≈$7.20 (18
with Cloudflare Pro), or by about 51 passes a year at $29, each netting ≈$23.41. The expensive host above, lever by
lever (Pro 200 GB at $29, the smallest size that holds the wedding):

| Step | Its month | Against $27.66 | Typical hosts to cover it |
| --- | --- | --- | --- |
| As built (the prune dry, a year in; its 1× uploads; the live album as built) | $80.77 | −$53.11 | 7.4 |
| The prune keeps up | $52.98 | −$25.32 | 3.5 |
| `album-calm` | $27.23 | +$0.43 | 0 |
| The guest count once a beat; attribution in the sync | $24.69 | +$2.97 | 0 |
| One ping a beat | $21.37 | +$6.29 | 0 |
| The backup holding originals only | $18.55 | +$9.10 | 0 |

No Ladder A plan needs another to carry it: each covers its own worst month (above), the biggest host's Pro 1 TB at
$52.90 against $95.14 (the plans' lines re-run for Ladder A on 2026-10-04, on the same model and prices).

### Each vendor's guard

| Vendor | Its own control (read 2026-10-03) | Before launch | At launch |
| --- | --- | --- | --- |
| Supabase | The [spend cap](https://supabase.com/docs/guides/platform/cost-control), on or off: on, an item past its quota is refused until the next cycle (MAU, Realtime, egress, disk; never compute); no budget and no alert. The Management API reads request counts and metrics, never billable usage, and cannot flip the cap | Cap on; Auth's email limit at 100 an hour | Cap off (Will), `spend-watch` reading our own tables at 10× the trailing peak; Auth's email limit at ≈10× the trailing peak hour and never under the largest door expected (≈2,000 an hour), a runaway's ceiling then ≈$1.80 an hour; compute stepped by hand |
| Vercel | Hobby's limits are hard, a hit pausing the feature for 30 days. Pro's [Spend Management](https://vercel.com/docs/spend-management): an on-demand budget ($200 for a new team), web, email and SMS notices at 50, 75 and 100%, a webhook, and Pause Production Deployments (every project, minutes late, each resumed by hand) | Hobby | Pro (required for commercial use); Spend Management at ≈10× the trailing month's on-demand, its webhook to `spend-watch`, the pause on as the ceiling |
| Cloudflare | No cap: [budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/) (account-wide, one email a period, informational) and per-product usage notifications on a Pro zone | A $10 budget alert; the Workers' own budgets (the reconcile's and the prune's deadlines and 95,000 subrequests a run, the prune's 30,000 media, the export's 300 s of CPU) | Budget alerts at steps ($25, $100, $500); `spend-watch`; the same caps |
| Resend | Free's 3,000 a month and 100 a day refuse past them; Pro's overage only when switched on | Free | Pro, overage on, bounded by Auth's limit and `sendOnce` |
| Sentry | The plan's quota drops what passes it | Developer (free) | Team, on-demand off |

### The levers

**The preconditions**, which nobody sees: the prune keeps up (built; it waits on the launch's `PRUNE_MODE=live`: the
backup goes from every byte ever uploaded to the live set and 43 days, a re-filled Pro 50 GB $14 a month cheaper a year
in). Rule 2 holds only with it.

**The win-wins, by saving** (each cuts our cost and is something a guest or a host feels):

1. **`album-calm`** (merged at `fdd0dc9b`): others' arrivals in a 15 s beat, a hidden tab silent and off its channel,
   the delta carrying its links. Measured on production builds, one guest's 20 uploads with four albums open: the two
   visible albums' calls 84 to 26 (the 8 links calls left are the reel tile re-picking its stills), the two hidden
   ones' 81 to 1 (the return's one sync, carrying all 20 links), Realtime messages 100 to 60. Fewer sockets at the
   peak; a big party stops machine-gunning tiles.
2. **The guest count once a beat:** count an album's guests once a beat (a counter beside its version, or a cache keyed
   by it), never by walking every guest upload on every sync and page load. ≈$2.30 of egress and ≈0.9 billion row reads
   a wedding (≈5 billion before `album-calm`), and the database's next step at scale. Small. Big albums open faster.
3. **One `getUser()` a request:** one of a signed-in album request's two Auth round trips (the proxy already skips every
   API route, half the invocations of every call). Small, auth-adjacent, so reviewed as such. Every call answers sooner.
4. **One ping a beat, then one push per album:** the trigger rings at most once an album a beat, so Realtime's messages
   go from uploads × listeners to beats × listeners (≈$3.30 a wedding, and clear of 500 a second): small. Then a
   Durable Object per live album pushes the delta over WebSockets (outgoing messages free), ending the per-viewer sync
   and both Realtime ceilings: weeks, and a new moving part. Arrivals land together for everyone.
5. **A lean presigner** (built: SigV4 by hand, `r2/sigv4.ts`, the day's key cached): ≈4 µs a link against the SDK's ≈170
   µs, so a 600-link re-mint costs ≈3 ms of CPU where it cost ≈100, and a 500-event dashboard ≈9 where it cost ≈340.
   Albums and dashboards answer sooner.
6. **Attribution rides the sync:** a confirmation sends the changed names, never a re-mint of every open tab's 600
   links. Medium. A confirmed guest's name reaches every album in the same beat.
7. **The dashboard and the storage list page:** a first page of events, per-event sums in SQL (built:
   `event_storage_sums`, upload-sums; an upload's summary read 228 ms to 1.8 ms at 5,000 events), the hub's Reel card
   from the take's head, so a 5,000-event account costs what a 50-event one does and "unlimited events" stays true by
   engineering. Medium. Big accounts load faster.
8. **The screen rests** (built as the poll's rest, `shared/use-live-poll.ts`): a visible tab ten untouched minutes polls
   every five, the doorbell still ringing at once, and past two untouched hours a page stops asking while the reel's
   screen only rests. Nothing on screen changes.
9. **A media domain on Cloudflare**, with the DNS move: an R2 custom domain behind Cache Rules and a WAF HMAC token
   ([Pro](https://www.cloudflare.com/plans/), $25 a month, [unlocks it](https://developers.cloudflare.com/waf/custom-rules/use-cases/configure-token-authentication/);
   the WAF [runs before the cache](https://developers.cloudflare.com/ruleset-engine/reference/phases-list/)) serves tiles
   from the edge with no GET on a hit, over HTTP/2 and 3 instead of R2's six HTTP/1.1 connections, with a CORS answer a
   browser may keep, so the reel's `no-store` re-reads end. Medium. Small in dollars, large in speed; a
   signature-checking Worker instead bills every request, a cache hit too, at $0.30 a million, nearly the $0.36 it
   saves.
10. **The backup holding originals only,** once something can remake the copies: today the preview and the phone copy
    are made in the uploader's browser and nothing server-side remakes either (a video's poster least of all), so a
    restore from originals alone leaves every tile blank (the Advisor, Q13: the Worker's filter never ships before a
    remake job). Then ≈23% of the backup's bytes and two thirds of its writes go ($0.014 a GB of cap at the worst
    month). Large. A restore is slower; nothing else shows. Past ≈100 TB, a cheaper home:
    [B2](https://www.backblaze.com/cloud-storage/pricing) at $6.95 a TB with free API calls and
    [Object Lock](https://www.backblaze.com/docs/cloud-storage-object-lock).
11. **Confirming a guest without an Auth user,** near 70,000 MAU: $0.00325 a confirmed guest. Large (auth work). A
    guest's confirm stays as it is.

The site's own images stay as they are: 33 local files, each transformation kept 31 days in two formats
([the cache key](https://vercel.com/docs/image-optimization)), under $5 a month; user media stays off `next/image`.

### What breaks first

The first large door: Supabase Auth's email limit, 100 codes an hour across the project, refuses a 2,000-guest wedding's
arrival hour. Then, with the spend cap on, Realtime's 500 connections (a socket refused falls back to the 12 s poll:
graceful, and dearer) and its 5M messages and 100,000 MAU a cycle, past which the item stops until the next. Then the
database: as built, a sync or a links call is ≈4 ms of it, plus the guest count's walk, so a Saturday evening's peak
sets the compute step.

## `tiers.ts`, the live source

[`src/lib/constants/tiers.ts`](../src/lib/constants/tiers.ts) is the source of truth: read it, never a doc copy.
Beyond the tables above it holds the `Plan` records with their uploads, their use and their Stripe price env keys,
`MAX_EVENTS`, the uploads allowance (`UPLOADS_BYTES`, `UPLOADS_WINDOW`, `uploadAllowance`, `uploadsLabel`),
`GATED_EVENT_SETTINGS` (empty; `password` and `custom_slug` are the settings it can gate), `MAX_REEL_SECONDS` (60 on
every tier), the estimate's basis (`AVG_PHOTO_BYTES`, `VIDEO_BYTES_PER_MIN`, `ESTIMATE_BASIS`), the big party a card
counts in (`BIG_PARTY`, `partiesHeld`), and the display helpers `friendlyCapacity` and `formatCapacity`. The DB
`tier_type` enum still lists a retired `max` (coerced by `toBillingTier()`), and the SQL `tier_limits()` and
`upload_allowance()` must mirror the file (`tier-limits-parity.test.ts` guards both).

## Stripe setup

The catalog lives in TEST mode and is created with the Stripe MCP; the webhook endpoint and the default Billing Portal
configuration are dashboard jobs, the change-plan portal configuration is an API job (the dashboard edits only the
default one), and the env values are the human's to paste.

**Check the mode before any write.** The Stripe MCP reaches one account in one mode: `list_available_accounts_or_orgs`
shows its `livemode` (false today), and every call names a `livemode` that must match it. A write in the wrong mode
lands resources in the wrong catalog.

**The catalog: 4 products, 8 prices.** One product per storage size, so the size shows in Checkout and on Stripe's
confirm page for a plan change, and **each yearly price rides the SAME product as its monthly sibling**, so a size
reads as one product at either cadence. Product names render in Checkout and in the portal, which makes them
user-facing copy: no em-dash.

| Product              | Price      | Type      | Env key                           |
| -------------------- | ---------- | --------- | --------------------------------- |
| Partyreel Pro 50 GB  | $9 / mo    | recurring | `STRIPE_PRICE_PRO_50`             |
| Partyreel Pro 50 GB  | $90 / yr   | recurring | `STRIPE_PRICE_PRO_50_YR`          |
| Partyreel Pro 200 GB | $29 / mo   | recurring | `STRIPE_PRICE_PRO_200`            |
| Partyreel Pro 200 GB | $290 / yr  | recurring | `STRIPE_PRICE_PRO_200_YR`         |
| Partyreel Pro 1 TB   | $99 / mo   | recurring | `STRIPE_PRICE_PRO_1TB`            |
| Partyreel Pro 1 TB   | $990 / yr  | recurring | `STRIPE_PRICE_PRO_1TB_YR`         |
| Partyreel Event Pass | $29 once   | one-time  | `STRIPE_PRICE_EVENT_PASS`         |
| Partyreel Event Pass | $19 renew  | one-time  | `STRIPE_PRICE_EVENT_PASS_RENEWAL` |

The TEST price ids live where the code reads them, the env values; Stripe's dashboard lists them by product. A price
the env no longer names (a retired size's, a subscription made before a price change) maps to no plan: the webhook
leaves that profile's entitlement untouched until the subscription ends, and Change plan refuses it (`foreign_price`).

**The webhook endpoint** (dashboard, Developers → Webhooks): `https://partyreel.com/api/stripe/webhook`, sending
`checkout.session.completed`, `customer.subscription.created` / `.updated` / `.deleted` and `invoice.payment_failed`;
its signing secret (`whsec_…`) is `STRIPE_WEBHOOK_SECRET`. The route acts on the first four: a failed payment reaches
it as the subscription's status (`past_due` keeps Pro through dunning; a subscription that ends drops the host to
Free). The test account also carries a temporary endpoint for the `launch-prep` alias, removed in ROADMAP's program
teardown.

**The Billing Portal: two configurations, two jobs.**

- **The default** (dashboard, Settings → Billing → Customer portal): payment-method update, invoice history,
  customer details and cancellation (at the period's end), with **plan switching OFF**. Its switcher cannot know what
  a host stores, and its quantity stepper (no maximum) could bill two or three times for one cap, so sizes and
  cadences never change here. TEST: `bpc_1TcTxWPtjqmVkBwkcAldFEZA`.
- **The change-plan configuration** (API only), tagged `metadata.partyreel_purpose=change_plan`:
  `subscription_update` on over **all six Pro prices** (both cadences on each of the three products),
  `default_allowed_updates: ["price"]`, quantity adjustment off, `proration_behavior: always_invoice`,
  `billing_cycle_anchor: unchanged`, no period-end scheduling; cancellation, invoice history and customer update
  off; payment-method update on (Stripe requires it beside subscription updates). The app finds it by that tag (no
  env value) and only ever opens it as a one-price confirm flow after the storage check. TEST:
  `bpc_1UIhooPtjqmVkBwkcLe9YgYN`.

**The ten env values** are the whole Stripe surface, and therefore the whole cutover: pasted into `.env.local` and
Vercel, then a redeploy. Only the first two are secrets; the eight price IDs are public ids.

- `STRIPE_SECRET_KEY`: the mode's secret key (`sk_test_…` today).
- `STRIPE_WEBHOOK_SECRET`: the `whsec_…` from the webhook endpoint.
- `STRIPE_PRICE_PRO_50` / `_200` / `_1TB`: the three monthly Pro prices.
- `STRIPE_PRICE_PRO_50_YR` / `_200_YR` / `_1TB_YR`: the three annual Pro prices.
- `STRIPE_PRICE_EVENT_PASS` and `STRIPE_PRICE_EVENT_PASS_RENEWAL`: the two one-time prices.

Five are hard-asserted at request time (`assertStripeEnv()`: the key, the webhook secret and the three monthly Pro
prices). The annual trio and the two pass prices are validated lazily by `priceIdForPlan()` /
`eventPassRenewalPriceId()`, so a missing one breaks exactly that checkout rather than the whole app (an unset annual
price fails only when a host picks yearly). `.env.example` lists all ten (`env-example-parity.test.ts` keeps it
honest).

**The Event Pass needs nothing more.** Its checkout is `mode: "payment"`, so no `customer.subscription.*` event ever
fires and the portal never shows a pass; provisioning rides `checkout.session.completed` (the ledger mechanics:
[`systems/billing-caps.md`](systems/billing-caps.md)).

## Test to live cutover

**The code needs ZERO changes to go live**: the keys, the webhook secret and the Price IDs are all env-referenced
(`STRIPE_*`), the change-plan portal configuration is found by its tag, the `apiVersion` pin is mode-independent,
and URLs come from `getSiteUrl()`. Going live is purely **re-creating the Stripe resources in LIVE mode and swapping
the env values**. Test and live are fully separate in Stripe (products, prices, webhook endpoints, both portal
configurations, coupons and API keys all exist per mode), so none of the test setup carries over.

**Prerequisite:** the Stripe account activated for live payments (business details and a bank account); live mode is
inert until then.

1. **Switch to live mode**: the Stripe MCP on the live account, or the dashboard in live mode. **Verify first:**
   `list_available_accounts_or_orgs` → `livemode: true`.
2. **Re-create the 4 products and 8 prices in LIVE** (the Stripe MCP or the dashboard): the three Pro products each
   with **both** a monthly and a yearly price (50 GB $9/$90, 200 GB $29/$290, 1 TB $99/$990), named without an
   em-dash, and the Event Pass product with **both** one-time prices ($29 purchase, $19 renewal). Capture the eight
   new **live** `price_…` IDs. Put each yearly price on the same product as its monthly sibling.
3. **Create the webhook endpoint in LIVE** (dashboard, live mode): the URL and the five events above; copy the
   **live** signing secret (`whsec_…`).
4. **Configure both portal configurations in LIVE**, as above: the default in the dashboard (card, invoices,
   customer details, cancellation; plan switching OFF), and the change-plan configuration through the API over
   **all six live Pro prices** with the SAME tag, `metadata.partyreel_purpose=change_plan`. No env value names it;
   until one live configuration carries the tag, a Pro host's Change plan answers "unavailable" (it fails closed,
   never onto the default).
5. **Swap the ten env values** in `.env.local` and **Vercel**, then redeploy: `STRIPE_SECRET_KEY` = `sk_live_…`,
   `STRIPE_WEBHOOK_SECRET` = the **live** `whsec_…`, and all eight `STRIPE_PRICE_*` IDs = the **live** price IDs.
   Ten values, one redeploy: a half-swapped set means an unswapped plan checks out against the wrong mode's price
   and 500s.
6. **Smoke-test carefully: real cards charge real money.** One real upgrade with a real card, confirm `tier='pro'`
   (Supabase MCP), then cancel and refund. The flow is proven in test mode (identical code), so this is a
   keys-and-resources check; add one **yearly** checkout and one **Change plan** switch (Stripe's confirm page for
   one price at quantity 1, then back in the app), which have never run against live keys.

**Rollback:** revert the ten env values to the test ones in Vercel and redeploy (live Stripe data persists, unused
while the keys are test).

## Email: Resend and Supabase Auth

**The provider is Resend** (the free tier sends 3,000 emails a month, at most 100 a day; the paid tier starts at $20
a month for 50,000, with no daily cap). All lifecycle email goes through `sendOnce()` (deduped on `sent_emails`), so
the daily cron sends at most once per state. Its env is `RESEND_API_KEY` and `EMAIL_FROM`
(`Partyreel <noreply@partyreel.com>`, on the verified `partyreel.com` sending domain), in `.env.local` and Vercel.

**Supabase Auth sends through the same domain over Resend SMTP** (the sign-in code and magic link, the confirm and
reset templates), because Supabase's built-in sender allows only a couple of emails an hour project-wide. It is set
in the dashboard (Authentication → Emails → SMTP Settings) or through the Management API's `config/auth` with a
personal access token; the Supabase MCP has no tool for it:

| Field                     | Value                                                                      |
| ------------------------- | -------------------------------------------------------------------------- |
| Sender email              | `noreply@partyreel.com` (matches `EMAIL_FROM`)                             |
| Sender name               | `Partyreel`                                                                |
| Host                      | `smtp.resend.com`                                                          |
| Port                      | `465` (implicit TLS; `587` STARTTLS also works)                            |
| Username                  | `resend`                                                                   |
| Password                  | the `RESEND_API_KEY` value, so rotating that key means updating this field |
| Minimum interval per user | 60 s (the sign-in form's `RESEND_COOLDOWN_S` matches it)                   |

- **The email rate limit** (Authentication → Rate Limits → "Rate limit for sending emails", or the Management API's
  `rate_limit_email_sent`) counts every email Auth sends across the whole project in an hour
  ([rate limits](https://supabase.com/docs/guides/auth/rate-limits), read 2026-10-03: 2 with Supabase's own sender,
  editable only with custom SMTP on, where it started at 30) and sits at 100 an hour. It is the code emails' bound and
  the first wall a large door meets ("What it costs us": what breaks first); raising it before a large
  Require-verified-emails event is in ROADMAP's Launch bucket.
- **The quota is shared**: auth codes and lifecycle email draw on one Resend quota, so a crowd confirming emails in
  one evening can reach the free tier's daily cap; the paid tier lifts it.
- **Verify a change** by requesting a sign-in code at `/login`: it arrives from `noreply@partyreel.com` (never
  `…mail.app.supabase.io`), and the send shows in Resend → Emails.
