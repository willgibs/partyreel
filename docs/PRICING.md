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
- **The monthly ingress meter** (bytes uploaded per month; never refunded on delete) is the anti-abuse guard, because
  storage caps alone don't stop delete-and-re-upload bandwidth burn. Every plan's bound is a multiple of its effective
  storage cap (`INGRESS_CAP_MULTIPLIER`, 3; Free's is 300 MB), so the bound scales with the room a host has. **A limit
  a host could meet is published** (Will, 2026-10-03): the monthly uploads become a row of the pricing table with a
  hover explainer, each plan's number gracious for nearly everyone, so nobody meets a limit nobody told them of; only a
  circuit breaker no real host meets stays unpublished. Published, the number only moves up, so it is sized with the
  plan's price ("What it costs us"); until the table carries it, the site says only that a monthly limit exists. The
  one outcome worth engineering against is still a false positive blocking a paying host; nothing in `/admin` shows a
  host's meter, and there is no manual override.
- **A marketed number can only ever move UP.** Grandfathering makes every published limit sticky, so each one lands at
  the conservative-but-generous end: raising a limit later is a gift, lowering it is a broken promise. That asymmetry,
  not precision, is what picks these numbers.
- **No watermarks on photos, the album or the live reel, any tier** (only a free event's clips carry a small mark).
- **The universal per-file limit** (every plan) lives in `lib/media/limits.ts`: **10 GB per file, photos and videos
  alike.** Size is the only per-file gate (a host may set a lower one per event), and there is no duration cap.

## Tiers

| Plan           | Price                      | Storage | ≈ holds                              | Events                      |
| -------------- | -------------------------- | ------- | ------------------------------------ | --------------------------- |
| **Free**       | $0                         | 100 MB  | 29 photos (photos only)              | 1                           |
| **Pro 100 GB** | $9/mo or $90/yr            | 100 GB  | 29,257 photos or 26 hours of video   | unlimited                   |
| **Pro 500 GB** | $19/mo or $190/yr          | 500 GB  | 146,286 photos or 131 hours of video | unlimited                   |
| **Pro 2 TB**   | $39/mo or $390/yr          | 2 TB    | 599,186 photos or 538 hours of video | unlimited                   |
| **Event Pass** | $24 one-time, $15 to renew | 75 GB   | 21,943 photos or 20 hours of video   | 1 per pass, each for a year |

The ≈ column is `formatCapacity` in `tiers.ts`, the phrase /pricing, the plan sheet, the help and the blog print; the
site derives it from the GB and never types it. **It assumes an iPhone at its default camera settings, and every
surface says so**, because an estimate with no camera behind it is a random claim: a 24 MP High
Efficiency photo at about 3.5 MB and a minute of 1080p at 30 fps at about 65 MB, from Apple's own figures (the
derivation and the sources are the constants' comment). `ESTIMATE_BASIS` is the phrase and `ESTIMATE_BASIS_NOTE` the
working.

- **Annual Pro is exactly ×10 the monthly, marketed as "two months free"** (a Vitest pin holds each yearly label at
  10× its sibling). Why not deeper: the top plan's margin is the limit, and a full 2 TB plan already costs more than
  it earns at either cadence once its backup is counted ("What it costs us": the worst month), so starting
  conservative leaves deepening as a later gift. The yearly Stripe prices live on the SAME products as the monthly ones (one
  product per size, so the size reads the same in Checkout and on Stripe's confirm page); env keys
  `STRIPE_PRICE_PRO_{100,500,2TB}_YR`. A Pro host moves between sizes and cadences from the app's plan sheet (her
  three sizes under one Monthly / Yearly toggle, the saving tagged beside Yearly and computed from these labels;
  `/api/stripe/change-plan`, `proration_behavior: always_invoice`), and a pass holder's prorated credit lands as
  customer balance, which pays the NEXT invoice: on yearly, that is a year out (never lost).
- **A plan change never leaves a host storing more than the new cap** (Will, 2026-09-22). Any Pro purchase or Pro
  size change must hold what the host already stores (active bytes against the plan's plain cap); a smaller one
  is refused with the numbers ("You're storing 140 GB. Pro 100 GB holds 100 GB, so remove 40 GB first, or choose
  Pro 500 GB.") until they remove enough. An Event Pass is never refused (passes stack). So Partyreel never
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
- **Event Pass economics.** Passes **STACK**: each purchase is a ledger row granting +1 event slot and +75 GB for its
  own one-year window (`event_passes` + `profiles.event_slots`). Moving to Pro converts every live pass into
  **PRORATED CREDIT**: the unused fraction of what was actually paid becomes Stripe customer balance that pays down
  upcoming Pro invoices (nothing banked, nothing lost), at a Pro size that holds what the passes store. The renewal ($15, `STRIPE_PRICE_EVENT_PASS_RENEWAL`) is sold
  only to a holder with a pass window active now (read from the ledger at checkout) and chains a new window onto the
  soonest-expiring active pass: it extends, never resets, and an unopened renewal year credits at 100%. The
  dashboard's "Renew Event Pass" button and the pre-expiry nudge email (14 days out) point at it. The renewal is $15
  because a typical album costs us $3 to $5 a year, an easy yes; a full 75 GB pass costs ≈$32 a year to keep with no
  re-upload at all, so at today's size the renewal holds only at typical use ("What it costs us": the worst month). At expiry without renewal the account recomputes down (eventually
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
   active media at the cap and its 10% headroom, Deleted full, the month's uploads at their allowance, the backup
   holding all of it, plus the live cost of its events. It is provable only once the backup's prune keeps up and the
   live album grows with viewers × time, never uploads × viewers; the levers below buy both.
3. **Guards are circuit breakers, not budgets.** Every vendor without a cap gets one of ours (`spend-watch`): past 10×
   the trailing peak it alerts and flips the switch that stops the vector, with its `/admin` card. Growth is never a
   10× day; a looped function is.

| Line | Price |
| --- | --- |
| [R2](https://developers.cloudflare.com/r2/pricing/), `partyreel` | $0.015 a GB-month (each day's peak, averaged); Class A (PUT, List, multipart) $4.50 and Class B (GET, HEAD) $0.36 a million; egress, deletes and aborts free; 10 GB, 1M A and 10M B free a month |
| R2 Infrequent Access, `partyreel-backup` | $0.01 a GB-month; A $9.00 and B $0.90 a million; $0.01 a GB read back; 30 days minimum |
| [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [Queues](https://developers.cloudflare.com/queues/platform/pricing/), [Durable Objects](https://developers.cloudflare.com/durable-objects/platform/pricing/) | $5 a month for 10M requests and 30M CPU-ms, then $0.30 and $0.02 a million; 1M Queue operations, then $0.40 a million, three a message; a Durable Object $0.15 a million requests, outgoing WebSocket messages free |
| [Vercel](https://vercel.com/pricing) | Hobby is [non-commercial](https://vercel.com/docs/limits/fair-use-guidelines); [Pro](https://vercel.com/docs/plans/pro-plan) $20 a seat a month with a $20 credit. [Functions](https://vercel.com/docs/functions/usage-and-pricing) and the proxy, [billed alike](https://vercel.com/docs/routing-middleware) (iad1): $0.60 a million invocations, $0.128 a CPU-hour (I/O waits free), $0.0106 a GB-hour while a request is in flight. CDN: Pro's [Flat Rate](https://vercel.com/docs/pricing/flat-rate-cdn) holds 1M requests and 1 TB, then $20 (10M), $100 (50M), $300 (150M) a month; [on demand](https://vercel.com/docs/pricing/regional-pricing/iad1), $2 a million requests and $0.15 a GB |
| [Supabase](https://supabase.com/pricing) | Pro $25 a month, Micro in its $10 credit; 100,000 MAU, then $0.00325 each; 250 GB egress (every service, the database's answers too), then $0.09 a GB; disk 8 GB, then $0.125 a GB; Realtime 500 peak connections, then $10 a thousand, and 5M messages, then $2.50 a million, a broadcast counting [one plus one a listener](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages); compute Small $15, Medium $60, Large $110 to 8XL $1,870 a month, changed by hand |
| [Resend](https://resend.com/pricing), [Sentry](https://sentry.io/pricing/) | email free to 3,000 a month (100 a day), Pro $20 for 50,000 with no daily cap, then $0.90 a thousand; errors free to 5,000, Team $26 a month billed yearly for 50,000 |
| [Stripe](https://stripe.com/pricing) | 2.9% + 30¢ a charge, [0.7% more on a subscription](https://stripe.com/billing/pricing), 1.5% more on an international card: $0.62 of $9 (6.9%), $0.98 of $19, $1.70 of $39 (4.4%), $3.54 of $90 a year, $1.00 of a $24 pass, $0.74 of a $15 renewal |
| Fixed, at launch | ≈$98 a month: Vercel Pro $20, Supabase Pro $25, Workers Paid $5, Resend Pro $20, Sentry Team $26, the domain ≈$2; [Cloudflare Pro](https://www.cloudflare.com/plans/) $25 ($20 billed yearly) with the media domain; the database's compute is the first line to step |

### The atlas

Each way a host can make us spend, with its price, its class, what bounds it today, its worst for one host and what
bounds it better. ≈ The operations behind the per-item figures: a call ≈3 ms of CPU, ≈4 ms a database round trip and
20 ms an Auth one, 2 GB held for the wall time with no sharing, the proxy a second invocation.

**(a) Bytes-months, priced by the cap**

- **Active media.** $0.025 a GB-month with its backup. Bounded by the cap and its 10% write headroom
  (`supabase/migrations/20261003110000_phone_copy.sql:236`, `capWithWriteHeadroom`, `constants/tiers.ts:402`).
  Worst: 1.1 × the cap.
- **The copies.** A ≈60 KB preview and a photograph's ≈1 MB phone copy, never metered: ≈30% on a photo's bytes, nearly
  nothing on a video's. The phone copy fits within 4 MB and half its original (`media/preview-size.ts:92,112-121`);
  the preview within 2 MB, checked at presign only and at no ratio to its original (`upload/server-pipeline.ts:176-178`,
  `media/preview-size.ts:21`), which may be one byte (`validation/upload.ts:170,175`). Worst: ≈1.3 × the media for a
  real host; unbounded for a flood of tiny files, each carrying up to 2 MB unmetered. Better: a preview never outweighs
  its original (refused at presign; the tile serves the original, which is smaller anyway).
- **Deleted.** Up to one cap for 30 days, the oldest out first (`lifecycle/recently-deleted.ts:14,22`,
  `lifecycle/sweeps/standby-budget.ts:109`), so the primary holds up to 2.1 × the cap; a restore and a re-delete starts
  an item's 30 days over, so the bin stays full with no upload at all. Worst: ≈$0.033 a GB of cap a month with its
  backup. Better: published as the bin's size; a re-delete within 30 days keeping its first date (a breaker no real host
  meets). Infrequent Access for the tail would save a third, but its 30-day minimum and $0.01 a GB read back make one
  restore cost more than it saved.
- **The backup.** Every object a PUT creates, copies included (`workers/backup/src/index.ts:96-107`, no key filter at
  `:527-535`), into Infrequent Access under a 35-day lock. Accrue-only today: the prune runs dry
  (`workers/backup/wrangler.jsonc:55`) and, live, deletes at most 500 media a week after scanning 5,000 objects from the
  head of the listing (`workers/backup/src/prune-strategy.ts:20,27`), so a deleted byte stays at $0.013 a GB-month,
  copies included, for good. Worst: unbounded (a 100 GB plan re-filled 3× a month carries ≈$50 a month of backup a year
  in). Better: the prune keeps up (a cursor, caps sized to the deletions, `PRUNE_MODE=live`), the invariant's
  precondition, then the backup holds the live set and 43 days of uploads (the 36-day gate and the weekly cadence);
  then originals only, once something can remake the copies.
- **Re-uploading (delete and re-upload).** ≈$0.0165 of operations a GiB of photos uploaded (each one three PUTs, two
  HEADs, three backup copies at $10.26 a million, nine Queue operations, four invocations) and $0.0013 a GiB of clips,
  plus 43 days of backup. Bounded by the monthly meter, 3 × the effective cap a calendar month, never refunded
  (`constants/tiers.ts:224`, `phone_copy.sql:86,224-229`). Worst at 3×: $0.049 of operations and $0.069 of backup a GB
  of cap a month. Better: the monthly uploads published per plan and sized with its price.

**(b) Per-request constants**

- **An upload.** Two calls a file, one file at a time (`upload/uploader.ts:314,405`), about seven database round trips
  (`src/app/api/r2/presign-upload/route.ts:24,89`, `src/app/api/r2/complete-upload/route.ts:49,74,95`,
  `forensics/capture.ts:50,62`), the browser's PUTs straight to R2 (16 MB parts from 100 MB:
  `media/limits.ts:83-85`) and two HEADs (`upload/server-pipeline.ts:506,586`): ≈$0.056 a thousand photos and $0.040 a
  thousand clips, the backup included. No limiter sits on presign or complete, and the meter counts bytes, so the
  number of items is unbounded: ≈$0.06 a thousand tiny files. Better: an hourly upload breaker per account, far past any
  party (spend-watch's alert first).
- **An upload never completed.** A presigned PUT lives two hours and is not single-use (`r2/presign.ts:48`), the ledger
  is written only by `create_media`, and the backup copies the object on its PUT; the orphan sweep reclaims the
  primary's copy after 24 hours, at most 20 pages a night from the head of the listing
  (`lifecycle/sweeps/orphans.ts:11-13,44`), so past the first 20,000 keys never. Worst: unbounded, unmetered bytes
  (≈$0.012 a GB in the backup's 36 days, and the primary's for good). Better: a presign's declared bytes count against
  the month's uploads (an abandoned one simply counts), and the sweep's cursor.
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
- **A page open indefinitely.** A visible tab polls every 60 s, every 12 s with no socket (`shared/use-live-poll.ts:19-21`),
  and re-mints up to 600 links an hour after a sync (`album/links.ts:124`, `album/store.ts:302`): ≈$0.15 of polls and
  $0.04 of re-mints a month, and one connection while visible. Nothing ends it.
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
  links call is left for windows, the reel tile's stills and re-mints. Calls and messages still grow as uploads × visible
  tabs, a beat apart. A sync costs ≈$3.50 a million as a 304 and $4 as a delta, each run twice with the proxy
  (`src/proxy.ts:118,133-134`). Worst: the 2,000-guest wedding, ≈$33 in an evening before `album-calm`, ≈$11 after.
  Next: one ping a beat or one push per album.
- **The guest count on every sync.** Every 200 sync, and every page load, walks every guest upload and guest row of
  its event to print "from M guests" (`src/app/api/album/guest/sync/route.ts:201`,
  `db/queries/guest-events-admin.ts:229-234`, `db/queries/social.ts:941-989`): ≈96 B a row of JSON, ≈28 gzipped, of
  database egress past 250 GB at $0.09 a GB, and the database's CPU, ≈5 billion rows read at the wedding. Better: count
  once per album a beat.
- **Attribution's re-mint.** A rename, a confirmation or a claim after an upload moves the album's attribution
  (`supabase/migrations/20260926100000_album_version.sql:16`) and stales every held link (`album/links.ts:154`): every
  open tab re-mints up to 600 at its next sync, ≈100 ms of the SDK's presigning a 200 ($20 a million such calls).
  Better: attribution rides the sync; a lean presigner.
- **A guest.** Nothing bounds the guests of an event (`create_guest`,
  `supabase/migrations/20260930140000_one_account_one_ticket.sql:111,273`); the join limiter counts per address and
  event, 400 a quarter-hour (`security/abuse-rate-limit.ts:59-64`). A confirmed guest is a Supabase user
  (`src/components/auth/email-sign-in.tsx:290,335`): an MAU at $0.00325 past 100,000 and ≈1.1 code emails at $0.0009
  past Resend Pro's 50,000, ≈$0.0042 at scale and nothing below it. Linear in guests: 1,000 confirming, $4.24 at
  scale. Better, near 70,000 MAU: confirming a guest without an Auth user.
- **An event.** Pro keeps unlimited (`constants/tiers.ts:195-199`), and nothing limits creating them
  (`db/mutations/events.ts:114-118`). The dashboard reads every event (`db/queries/events.ts:92-110`) and presigns up to
  four stills each (`:203`), and the bell reads them all again when anything waits
  (`db/queries/notifications.ts:35-37,141-144`): ≈2,000 presigns and ≈0.3 s of CPU a load at 500 events. Worst: O(events)
  a load; a flood of empty events is database rows. Better: the dashboard pages; an unpublished creation breaker
  (≈100 a day an account).
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
  static assets, so Flat Rate's included 1 TB holds ≈1.2M first visits a month. The proxy runs before every page and
  API call and asks Auth about a signed-in caller (`src/proxy.ts:118`, `supabase/middleware.ts:48`), and a route handler
  misses React's `cache()`, so a signed-in album request asks Auth three times (`events/album-viewer.server.ts:74,99`).
  Better: the proxy off the API routes, which verify for themselves; one `getUser()` a request; a lean presigner.
- **Realtime's connections.** The cycle's peak, $10 a thousand past 500. With the spend cap on, Pro stops at 500
  connections and 500 messages a second, 10,000 and 2,500 without ([limits](https://supabase.com/docs/guides/realtime/limits));
  past the first a new socket is refused, past the second the project's sockets are dropped, and an album falls back to
  its 12 s poll. Better: `album-calm`, since a hidden tab leaves its channel and realtime-js closes a socket left with
  none.
- **The jobs.** ≈$0 a day: the purge cron, 60 s at most (`vercel.json:5`, `src/app/api/cron/purge/route.ts:85`); the
  reconcile HEADs the first 5,000 objects daily (`workers/backup/src/index.ts:77`); the prune lists 5,000 weekly; the
  export heartbeat; the nightly database dump into the backup's `db/` (`.github/workflows/db-backup.yml:35,158`), which
  nothing prunes, ≈$0.01 a GB-month a night kept.
- **Observability.** Sentry traces 10% (`observability/sentry.ts:103`) and replays only on an error
  (`src/instrumentation-client.ts:31-32`), its plan dropping what passes the quota; Web Analytics runs on the marketing
  pages only (`src/app/(marketing)/layout.tsx:31`), $3 a 100,000 events past 50,000 on Pro.
- **Stripe's fee**, on every charge (the table above), and **a Free account**: 100 MB, ≈$0.003 a month with its copies,
  its creation bounded by Auth's limits and its event resting after 180 quiet days (`lifecycle/inactivity.ts:7`).

**(c) Bounds.** Published today: storage, events, a file's 10 GB, Free's photos only and its 180-day rest. By Will's word
(2026-10-03) the monthly uploads join them as a row of the pricing table, and so does any limit a host could meet, such
as Deleted's size and 30 days (the site still names only that a monthly limit exists, `content-policy.test.ts:164`
fencing the word). Unpublished, because no real host meets them: Auth's hourly email limit and spend-watch's 10×, and
the breakers still to add (an account's uploads an hour, its events a day, a preview no heavier than its original, a
re-delete's first date). "No guest limit" (`src/components/marketing/jsonld.tsx:86`, the FAQ,
`content/llms.ts:120`) and "unlimited events" (`src/components/marketing/sections/pricing/unlock-grid.tsx:53`,
`constants/marketing-voice.ts:130`) stay true, because a guest is a constant and an event pages; the Terms already
reserve "reasonable limits on upload volume, download bundling and other activity"
(`constants/legal-terms.tsx:188,193`).

### The worst month

Per GB of cap, photographs (a video's copies weigh nothing), the backup's prune keeping up unless named:

| Case | A GB of cap a month |
| --- | --- |
| Full, nothing deleted or re-uploaded | $0.036 (video $0.028) |
| Today's rules: full, Deleted full, re-uploaded 3× | $0.159: primary $0.041, backup $0.069, operations $0.049 |
| The same, the prune dry, a year in | $0.587 |
| Re-uploaded 2× | $0.124 |
| Re-uploaded 1× | $0.089 (video $0.057) |
| Re-uploaded 1×, the backup holding originals only | $0.075 |

Today every paid plan breaks rule 2 at its worst month: Pro 100 GB costs $15.94 against $8.38 net of Stripe, Pro 500 GB
$79.69 against $18.02, Pro 2 TB $326 against $37.30 (full and never re-uploaded, still $73), and the 75 GB pass $143 a
year against $23, its $15 renewal the same against $14.27 (a full pass kept a year, $32). A one-time pass is the tightest
case, since its single price carries a year: a full pass costs ≈$0.45 to $0.55 a GB a year to keep (its deletions and a
refill included), so its renewal's price sets its size, and its uploads fit an allowance over its year (the event and a
refill) better than a monthly one.

### The archetypes

| Archetype | Today | After `album-calm` and the levers | Against |
| --- | --- | --- | --- |
| Cheap: a Free event at its cap (29 photos, 20 guests, 10 confirming) | $0.06 its month at scale, then $0.003 a month | the same | $0 |
| Typical: Pro, three parties kept (36 GiB), one more a quarter | $1.39 a month | $1.17 | $9 ($8.38 net) |
| Expensive: Pro 100 GB full, Deleted full, re-filled 3× a month, a 2,000-guest wedding a month | $55 a month ($98 with the prune dry, a year in) | $16.36 (re-filled 1×) | $9 |
| Guest-heavy: the wedding's live album and its guests alone | $37 an evening | $11.40 after `album-calm`, $5.53 after the levers | |
| Video-heavy: Pro 100 GB full of video, re-filled 3× | $8.82 a month (full and still, $2.75) | $5.71 (1×) | $9 |
| Churn: Pro 100 GB re-filled 3× a month, photographs | $15.94 a month ($58.67 with the prune dry, a year in) | $8.92 (1×) | $9 |
| Always-open: one screen on the reel all month | $0.54 a month and a connection | $0.39 | |
| The 2,000-guest wedding (1,000 confirming, 9,500 photos, 500 clips, ≈200 tabs over five hours): 58 GiB kept, $1.46 a month | $39 once: the live album $33 (960,000 syncs, 557,000 links calls, 2M messages, 143 GiB of egress gzipped, $65 raw), its guests $4.24, page loads $1.35, uploads $0.56 | $13 after `album-calm`, $7.44 after the levers | the plan that holds it |
| Photographer or venue: Pro 2 TB full, refreshed 1× a month, eight parties a month | $194 a month ($338 at 3×) | $160 | $39 ($37.30 net) |

The reference party (200 guests over five hours, 2,000 photos and 100 clips of ≈30 s, ≈20 tabs with the socket up,
≈100 confirming, ≈400 visits the week after) stores 12.1 GiB ($0.30 a month) and costs $1.47 once today (its live album
$0.76: 39,000 syncs, 20,500 links calls, 44,100 messages), $0.90 after `album-calm` and $0.82 after the levers.

### Breakeven and light-per-heavy

The fixed ≈$98 a month (≈$123 with Cloudflare Pro) is covered by 14 typical Pro hosts at $9, each netting ≈$7.20 (18
with Cloudflare Pro), or by about 64 passes a year at today's $24, each netting ≈$18.55. The expensive host above,
lever by lever (Pro 100 GB at $9):

| Step | Its month | Against $8.38 | Typical hosts to cover it |
| --- | --- | --- | --- |
| As built (the prune dry, a year in; 3× uploads; the live album as built) | $97.72 | −$89.35 | 12.4 |
| The prune keeps up | $54.99 | −$46.61 | 6.5 |
| `album-calm` | $29.24 | −$20.87 | 2.9 |
| The guest count once a beat; attribution in the sync | $26.70 | −$18.32 | 2.5 |
| One ping a beat | $23.38 | −$15.00 | 2.1 |
| Uploads published at 1× the cap | $16.36 | −$7.98 | 1.1 |
| The backup holding originals only | $14.95 | −$6.58 | 0.9 |

Pro 2 TB at its worst loses $289 a month as built (40 typical hosts) and $145 at 1× (20): no lever reaches it at $39,
so it is priced or sized away in the ladder Will picks.

### Each vendor's guard

| Vendor | Its own control (read 2026-10-03) | Before launch | At launch |
| --- | --- | --- | --- |
| Supabase | The [spend cap](https://supabase.com/docs/guides/platform/cost-control), on or off: on, an item past its quota is refused until the next cycle (MAU, Realtime, egress, disk; never compute); no budget and no alert. The Management API reads request counts and metrics, never billable usage, and cannot flip the cap | Cap on; Auth's email limit at 100 an hour | Cap off (Will), `spend-watch` reading our own tables at 10× the trailing peak; Auth's email limit at ≈10× the trailing peak hour and never under the largest door expected (≈2,000 an hour), a runaway's ceiling then ≈$1.80 an hour; compute stepped by hand |
| Vercel | Hobby's limits are hard, a hit pausing the feature for 30 days. Pro's [Spend Management](https://vercel.com/docs/spend-management): an on-demand budget ($200 for a new team), web, email and SMS notices at 50, 75 and 100%, a webhook, and Pause Production Deployments (every project, minutes late, each resumed by hand) | Hobby | Pro (required for commercial use); Spend Management at ≈10× the trailing month's on-demand, its webhook to `spend-watch`, the pause on as the ceiling |
| Cloudflare | No cap: [budget alerts](https://developers.cloudflare.com/billing/manage/budget-alerts/) (account-wide, one email a period, informational) and per-product usage notifications on a Pro zone | A $10 budget alert; the Workers' own caps (5,000 reconciled and 500 pruned a run, the export's 300 s of CPU) | Budget alerts at steps ($25, $100, $500); `spend-watch`; the same caps |
| Resend | Free's 3,000 a month and 100 a day refuse past them; Pro's overage only when switched on | Free | Pro, overage on, bounded by Auth's limit and `sendOnce` |
| Sentry | The plan's quota drops what passes it | Developer (free) | Team, on-demand off |

### The levers

**The preconditions**, which nobody sees: the prune keeps up (a cursor and caps sized to the deletions, with the
launch's `PRUNE_MODE=live`: the backup goes from every byte ever uploaded to the live set and 43 days, a re-filled
100 GB plan $43 a month cheaper a year in); a presign's declared bytes count against the month's uploads, and a preview
is never heavier than its original (the two unmetered holes close); a re-delete within 30 days keeps its first date;
an account's uploads an hour and events a day get breakers far past any party. Each is small; rule 2 holds only with
them.

**The win-wins, by saving** (each cuts our cost and is something a guest or a host feels):

1. **`album-calm`** (merged at `fdd0dc9b`): others' arrivals in a 15 s beat, a hidden tab silent and off its channel,
   the delta carrying its links. Measured on production builds, one guest's 20 uploads with four albums open: the two
   visible albums' calls 84 to 26 (the 8 links calls left are the reel tile re-picking its stills), the two hidden
   ones' 81 to 1 (the return's one sync, carrying all 20 links), Realtime messages 100 to 60. Fewer sockets at the
   peak; a big party stops machine-gunning tiles.
2. **The guest count once a beat:** count an album's guests once a beat (a counter beside its version, or a cache keyed
   by it), never by walking every guest upload on every sync and page load. ≈$2.30 of egress and ≈0.9 billion row reads
   a wedding after `album-calm` (≈5 billion as built), and the database's next step at scale. Small. Big albums open
   faster.
3. **The proxy off the API routes, one `getUser()` a request:** half the invocations of every call, and two of a
   signed-in album request's three Auth round trips. Small, auth-adjacent, so reviewed as such. Every call answers
   sooner.
4. **One ping a beat, then one push per album:** the trigger rings at most once an album a beat, so Realtime's messages
   go from uploads × listeners to beats × listeners (≈$3.30 a wedding, and clear of 500 a second): small. Then a
   Durable Object per live album pushes the delta over WebSockets (outgoing messages free), ending the per-viewer sync
   and both Realtime ceilings: weeks, and a new moving part. Arrivals land together for everyone.
5. **A lean presigner:** SigV4 by hand (`node:crypto`, the day's key cached) in ≈4 µs against the SDK's ≈170 µs
   (measured): a 600-link re-mint from ≈100 ms of CPU to ≈3, a 500-event dashboard from ≈340 ms to ≈9. Medium. Albums
   and dashboards answer sooner.
6. **Attribution rides the sync:** a confirmation sends the changed names, never a re-mint of every open tab's 600
   links. Medium. A confirmed guest's name reaches every album in the same beat.
7. **The dashboard and the storage list page:** a first page of events, per-event sums in SQL, the hub's Reel card from
   the take's head, so a 5,000-event account costs what a 50-event one does and "unlimited events" stays true by
   engineering. Medium. Big accounts load faster.
8. **The screen rests:** a visible tab an hour without change backs its poll off to five minutes, the doorbell still
   ringing at once: ≈$0.15 a screen a month. Small. Nothing on screen changes.
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
Beyond the tables above it holds the `Plan` records with their Stripe price env keys, `MAX_EVENTS`, the ingress model
(every plan derives `INGRESS_CAP_MULTIPLIER` (3) × its storage cap through `monthlyIngressCap`; no tier keeps a static
`MONTHLY_INGRESS_BYTES` today), `GATED_EVENT_SETTINGS` (empty; `password` and `custom_slug` are the settings it can
gate), `MAX_REEL_SECONDS` (60 on every tier), the estimate's basis (`AVG_PHOTO_BYTES`, `VIDEO_BYTES_PER_MIN`,
`ESTIMATE_BASIS`), and the display helpers `friendlyCapacity` and `formatCapacity`. The DB `tier_type` enum still lists a retired `max` (coerced by
`toBillingTier()`), and the SQL `tier_limits()` must mirror the file (`tier-limits-parity.test.ts` guards it).

## Stripe setup

The catalog lives in TEST mode and is created with the Stripe MCP; the webhook endpoint and the default Billing Portal
configuration are dashboard jobs, the change-plan portal configuration is an API job (the dashboard edits only the
default one), and the env values are the human's to paste.

**Check the mode before any write.** The Stripe MCP reaches one account in one mode: `list_available_accounts_or_orgs`
shows its `livemode` (false today), and every call names a `livemode` that must match it. A write in the wrong mode
lands resources in the wrong catalog.

**The catalog: 4 products, 8 prices.** One product per storage size, so the size shows in Checkout and on Stripe's
confirm page for a plan change, and **each yearly price rides the SAME product as its monthly sibling**, so a size
reads as one product at either cadence.

| Product              | Price      | Type      | Test Price ID                    | Env key                           |
| -------------------- | ---------- | --------- | -------------------------------- | --------------------------------- |
| Partyreel Pro 100 GB | $9 / mo    | recurring | `price_1TcTbgPtjqmVkBwk7qfplvly` | `STRIPE_PRICE_PRO_100`            |
| Partyreel Pro 100 GB | $90 / yr   | recurring | `price_1U9FInPtjqmVkBwkKKmtg9LL` | `STRIPE_PRICE_PRO_100_YR`         |
| Partyreel Pro 500 GB | $19 / mo   | recurring | `price_1TcTbtPtjqmVkBwkIT8mPznE` | `STRIPE_PRICE_PRO_500`            |
| Partyreel Pro 500 GB | $190 / yr  | recurring | `price_1U9FInPtjqmVkBwkcadWJaH3` | `STRIPE_PRICE_PRO_500_YR`         |
| Partyreel Pro 2 TB   | $39 / mo   | recurring | `price_1TcTbwPtjqmVkBwkHQpJuYOr` | `STRIPE_PRICE_PRO_2TB`            |
| Partyreel Pro 2 TB   | $390 / yr  | recurring | `price_1U9FIoPtjqmVkBwkiaviRh0Y` | `STRIPE_PRICE_PRO_2TB_YR`         |
| Partyreel Event Pass | $24 once   | one-time  | `price_1TcUcDPtjqmVkBwkJCypwyVb` | `STRIPE_PRICE_EVENT_PASS`         |
| Partyreel Event Pass | $15 renew  | one-time  | `price_1TcVuOPtjqmVkBwkTCXTKOIs` | `STRIPE_PRICE_EVENT_PASS_RENEWAL` |

The three Pro products are named with an em-dash in the test catalog ("Partyreel Pro — 100 GB"), and those names
render in Checkout and in the portal, which makes them user-facing copy: the live catalog is created without one.

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
  `subscription_update` on over **all six Pro prices** (both cadences on each product),
  `default_allowed_updates: ["price"]`, quantity adjustment off, `proration_behavior: always_invoice`,
  `billing_cycle_anchor: unchanged`, no period-end scheduling; cancellation, invoice history and customer update
  off; payment-method update on (Stripe requires it beside subscription updates). The app finds it by that tag (no
  env value) and only ever opens it as a one-price confirm flow after the storage check. TEST:
  `bpc_1UIhooPtjqmVkBwkcLe9YgYN`.

**The ten env values** are the whole Stripe surface, and therefore the whole cutover: pasted into `.env.local` and
Vercel, then a redeploy. Only the first two are secrets; the eight price IDs are public ids.

- `STRIPE_SECRET_KEY`: the mode's secret key (`sk_test_…` today).
- `STRIPE_WEBHOOK_SECRET`: the `whsec_…` from the webhook endpoint.
- `STRIPE_PRICE_PRO_100` / `_500` / `_2TB`: the three monthly Pro prices.
- `STRIPE_PRICE_PRO_100_YR` / `_500_YR` / `_2TB_YR`: the three annual Pro prices.
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
   with **both** a monthly and a yearly price (100 GB $9/$90, 500 GB $19/$190, 2 TB $39/$390), named without the
   em-dash, and the Event Pass product with **both** one-time prices ($24 purchase, $15 renewal). Capture the eight
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
  Require-verified-emails event is in ROADMAP's launch checkpoint.
- **The quota is shared**: auth codes and lifecycle email draw on one Resend quota, so a crowd confirming emails in
  one evening can reach the free tier's daily cap; the paid tier lifts it.
- **Verify a change** by requesting a sign-in code at `/login`: it arrives from `noreply@partyreel.com` (never
  `…mail.app.supabase.io`), and the send shows in Resend → Emails.
