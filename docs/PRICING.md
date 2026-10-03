# Partyreel — Pricing & tiers

> ROLE: the plans: their prices, limits and model, Pro's case, what running it costs us (vendor prices, the code's
> request patterns, a party and a month at scale, the levers), and the Stripe and email setup a human runs, the
> test-to-live cutover included. · NOT HERE: the product why (→ [`PRD.md`](PRD.md) "Monetization and
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
- **The monthly ingress meter** (bytes uploaded per month; never refunded on delete; unmarketed) is the anti-abuse
  guard, because storage caps alone don't stop delete-and-re-upload bandwidth burn. Every plan's bound is a multiple
  of its effective storage cap (`INGRESS_CAP_MULTIPLIER`, 3; Free's is 300 MB), so the bound scales with the room a
  host has, needs no new figure per plan and stays silently tunable. It is generous by design (3× is a
  full extra refill of headroom), because the one outcome worth engineering against is a false positive quietly
  blocking a paying host; nothing in `/admin` shows a host's meter, and there is no manual override.
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
  it earns at either cadence once its backup is counted ("What it costs us": a plan, full), so starting conservative
  leaves deepening as a later gift. The yearly Stripe prices live on the SAME products as the monthly ones (one
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
  dashboard's "Renew Event Pass" button and the pre-expiry nudge email (14 days out) point at it. The renewal holds at
  $15 because a typical album costs us $3 to $5 a year and a renewal adds almost no ingress, so it is priced as an
  easy yes (revisit if full-use renewals cluster). At expiry without renewal the account recomputes down (eventually
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

Each action the code takes (file and line), priced at the vendor's own page, read 2026-10-03; ≈ marks an assumption,
ours to change, and each total is its count times its price.

| Line | Price |
| --- | --- |
| [R2](https://developers.cloudflare.com/r2/pricing/), `partyreel` | $0.015 a GB-month; Class A (PUT, List, multipart) $4.50 and Class B (GET, HEAD) $0.36 a million; egress, deletes and aborts free; 10 GB, 1M A and 10M B free a month |
| R2 Infrequent Access, `partyreel-backup` | $0.01 a GB-month; A $9.00 and B $0.90 a million; $0.01 a GB read back; 30 days minimum |
| [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [Queues](https://developers.cloudflare.com/queues/platform/pricing/) | $5 a month for 10M requests and 30M CPU-ms, then $0.30 and $0.02 a million; 1M Queue operations, then $0.40 a million, three a message |
| [Vercel](https://vercel.com/pricing) | Hobby is [non-commercial](https://vercel.com/docs/limits/fair-use-guidelines); Pro $20 a month with a $20 credit. [Functions](https://vercel.com/docs/functions/usage-and-pricing) (iad1, 2 GB): $0.60 a million invocations, $0.128 a CPU-hour (I/O waits free), $0.0106 a GB-hour while a request is in flight. CDN: Pro's default [Flat Rate](https://vercel.com/docs/pricing/flat-rate-cdn) holds 1M requests and 1 TB, then $20 (10M), $100 (50M), $300 (150M) a month; [on demand](https://vercel.com/docs/pricing/regional-pricing/iad1), $2 a million requests and $0.15 a GB delivered; origin transfer $0.06 a GB |
| [Supabase](https://supabase.com/pricing) | Pro $25 a month with Micro; 100,000 MAU, then $0.00325 each; 250 GB egress, then $0.09 a GB; Realtime 500 peak connections, then $10 a thousand, and 5M messages, then $2.50 a million, a broadcast counting [one plus one a listener](https://supabase.com/docs/guides/platform/manage-your-usage/realtime-messages); compute Large $110 to 8XL $1,870 a month |
| [Resend](https://resend.com/pricing), [Sentry](https://sentry.io/pricing/) | email free to 3,000 a month (100 a day), $20 for 50,000, $1,150 for 2.5M; errors free to 5,000, Team $26 a month billed yearly for 50,000 |

**What an action does to them** (paths under `src/lib` unless named):

- **An upload** is two function calls (`upload/uploader.ts:300,382`) with about seven database round trips
  (`src/app/api/r2/presign-upload/route.ts:24,89`, `src/app/api/r2/complete-upload/route.ts:49,74,95`,
  `forensics/capture.ts:50,62`) and an R2 HEAD (`upload/server-pipeline.ts:439`), beside the browser's PUTs straight
  to R2: the original (16 MB parts from 100 MB, with Create, ListParts and Complete: `media/limits.ts:83-85`,
  `upload/server-pipeline.ts:202-220,404-423`), the ~60 KB preview (`:158-173`) and each photo's ≈1 MB phone copy.
  The backup adds three Queue operations, an IA HEAD, a GET and an IA PUT an object
  (`workers/backup/src/index.ts:96-107`). A photo: ~$0.00005 once, $0.00011 a month kept.
- **An open album** hears one Realtime ping per media row a guest would see change (the trigger,
  `supabase/migrations/20260611220000_gallery_doorbell.sql:70-72`; the send,
  `20261002200000_disposable_foundation.sql:477`) and syncs within ~2.4 s (`guest/refresh-coalescer.ts:38-39`), a
  hidden tab whose socket lives too (`guest/use-gallery-doorbell.ts:19-21,46-51`); under it, a poll every 60 s, or
  12 s with no socket, stopped while hidden (`shared/use-live-poll.ts:19-21,52-58`). A sync resolves its viewer
  (`events/album-viewer.server.ts:65-115`), then answers 304 off one row or a delta
  (`src/app/api/album/guest/sync/route.ts:107-201`); the client then asks links for the new ids, a second call signing
  three URLs an id (`src/app/api/album/guest/media/route.ts:57-82`), at most 200 ids, re-minted hourly for up to 600
  recent ones (`events/album-wire.ts:208,215`, `album/links.ts:124`). ★ The proxy runs before every API call
  (`src/proxy.ts:133`), asking Supabase Auth about a signed-in caller (`supabase/middleware.ts:48`), so each is two
  invocations. Whole (both, the CDN request, transfer, egress): ≈$4 a million 304s, $5 a million deltas, $11 a million
  links calls, each ~3 to 5 ms of database (`pg_stat_statements`); a ping is $2.50 a million times one plus its
  listeners.
- **A view** is one GET of the tile's preview (`src/components/app/media-grid.tsx:18`); the viewer reads its original
  once, `no-store` (`media/share-save-held.ts:9`), and the live reel, past its 48 decoded stills
  (`reel/engine/asset-cache.ts:25`), re-reads each still and every clip window `no-store` a play
  (`reel/engine/assets.ts:86`, `reel/engine/video/window-reader.ts:114`). A re-mint is a new URL, so a browser keeps a
  tile about an hour (`r2/presign-bucket.ts:15,24`); the SDK signs one in ~170 µs of CPU (measured; a 200-id batch,
  ~100 ms).
- **A zip** HEADs or lists, then GETs each object once (`workers/export/src/check.ts:43,72,98`, `index.ts:174`), 2,000
  items or 20 GB a part at most (`export/build-manifest.ts:17-18`): ~$0.0007 of R2 a full part.
- **The jobs** cost ~$0: a cron function of at most 60 s a day (`vercel.json:5`, `src/app/api/cron/purge/route.ts:85`)
  listing at most 20 R2 pages (`lifecycle/sweeps/orphans.ts:44`); a daily reconcile checking the primary's first 5,000
  objects against the backup (`workers/backup/src/index.ts:156-171`); a weekly prune scanning 5,000 backup objects and
  deleting at most 500 media (`workers/backup/src/prune-strategy.ts:20,27`).
- **A confirmed guest** is a Supabase Auth code over Resend (`src/components/auth/email-sign-in.tsx:290`): an email and
  an MAU. Lifecycle mail goes once a state (`email/send.ts:85`).

**One party**, the reference: 200 guests over five hours, 2,000 photos and 100 clips (≈30 s); ≈20 clients with the
album's socket up on average (open albums and two wall screens), ≈100 guests confirming, ≈400 visits the week after.

| | Amount | Cost |
| --- | --- | --- |
| Storage | 12.1 GB: originals 10.0, phone copies 2.0, previews 0.1 | $0.30 a month kept, $0.12 of it the backup |
| Upload and backup operations | 6,200 objects | $0.10 |
| Vercel | ~68,000 calls (37,400 syncs, 22,600 links calls), each run twice with the proxy; 0.8 GB delivered | $0.56 |
| Supabase | 44,100 Realtime messages (2,100 pings to 21); 0.65 GB egress | $0.17 |
| R2 reads | ~142,000 GETs | $0.05 |
| Confirmed guests | 100 MAU, 110 emails | $0.42 past 100,000 MAU |
| **Total** | | **$1.30 once and $0.30 a month: ~$4.90 the first year, against a $24 pass** |

The live album is $0.55 of it: about one Realtime message and 1.2 function calls for every upload times every album
open when it lands, so a party twice the size costs four times as much to keep live.

**A month at scale.** ≈ Each active host holds one event: one in five the reference party, the rest a Free event at
its cap (29 photos, 20 guests, 10 confirming); parties kept a year, Free events six months (the inactivity sweep).

| A month | 1,000 hosts | 100,000 hosts |
| --- | --- | --- |
| Vercel | $127 (Pro, $57 of functions and $71 of CDN on demand, less the $20 credit) | $12,700 |
| Supabase | $36 (Pro, 9M Realtime messages) | $15,000 (MAU $9,100, Realtime $2,600, an 8XL $1,860, egress $1,200) |
| R2 operations, Workers, Resend, Sentry | $75 | $4,700 |
| Storage after a year, with the backup | $740 (29 TB) | $74,000 (2,900 TB) |
| **Total** | **~$240 before storage: ~$270 the first month, ~$980 a year in** | **~$32,500 before storage, ~$106,500 a year in** |

What breaks first: ★ **Supabase's spend cap**, on by default
([billing FAQ](https://supabase.com/docs/guides/platform/billing-faq)), stops an item past its quota until the next
cycle ([cost control](https://supabase.com/docs/guides/platform/cost-control)): at 1,000 hosts the 5M Realtime messages
run out mid-month and albums fall back to their poll, and past 100,000 MAU (about 1,000 parties a month) new
sign-ins stop; it must be off before launch traffic, with a budget alert. Then **Realtime's ceiling**, 500
connections and 500 messages a second with the cap, 10,000 and 2,500 without
([limits](https://supabase.com/docs/guides/realtime/limits)), against 100,000 hosts' Saturday peak of ≈37,000 open
albums (a refused socket falls back to the 12 s poll: graceful, and dearer). Then **the database**: ~4 ms a sync or
links call, so that peak (~3,900 calls a second) keeps ~16 vCPUs busy.

**The levers, by saving:**

1. **The live album's fan-out.** (a) Widen the coalescer to 15 s and keep hidden tabs from syncing on a ping: about
   half the doorbell's syncs and links calls, ~$0.20 a party, ~$4,800 a month at 100,000 hosts with a smaller database;
   a few lines, and others' photos land up to 15 s later (hers at once). (b) Take the proxy off the API routes, which
   verify for themselves: half the invocations and an Auth round trip a call, ~$0.10 a party; auth-adjacent, so
   reviewed as such. (c) Let a delta carry its new items' links: one call where there were two, ~$0.08 a party.
   (d) Before ~10,000 concurrent viewers, one push per album instead of one sync per viewer: a Durable Object per live
   album sending the delta over WebSockets
   ([outgoing messages free](https://developers.cloudflare.com/durable-objects/platform/pricing/)), ~$0.50 a party and
   ~$12,000 a month at 100,000, clear of both ceilings; weeks, and a new moving part. (e) Bill Vercel's CDN on
   demand while the app is request-heavy and byte-light: $71 against Flat Rate's $100 tier at 1,000 hosts.
2. **The backup**, 40% of storage and accrue-only. (a) Back up originals alone (previews and phone copies are remade,
   or fall back to the original): a sixth of its bytes and two thirds of its writes, ~$6,000 a month at 100,000 hosts,
   ~$60 at 1,000; a line in the Worker. (b) Let the prune keep up: it runs dry until the launch switch, deletes at most
   500 media a week and rescans from the head, so a deleted byte otherwise stays at $0.01 a GB-month; it needs a cursor
   and caps sized to the deletions. (c) Past ~100 TB (~$1,000 a month), a cheaper home:
   [B2](https://www.backblaze.com/cloud-storage/pricing) at $6.95 a TB with free API calls and
   [Object Lock](https://www.backblaze.com/docs/cloud-storage-object-lock), ~$9,000 a month at 100,000, or
   [S3 Glacier Deep Archive](https://aws.amazon.com/s3/storage-classes/glacier/) at $0.00099 a GB-month, read back
   asynchronously.
3. **Confirmed guests**, ~$0.0043 each past 100,000 MAU (~$10,600 a month at 100,000 hosts). The lever, confirming a
   guest without an Auth user, is auth work: revisit near 70,000 MAU.
4. **A media domain on Cloudflare**, with the DNS move: an R2 custom domain behind Cache Rules and a WAF HMAC token
   ([Pro](https://blog.cloudflare.com/adjusting-pricing-introducing-annual-plans-and-accelerating-innovation/), $25 a
   month, [unlocks it](https://developers.cloudflare.com/waf/custom-rules/use-cases/configure-token-authentication/);
   the WAF [runs before the cache](https://developers.cloudflare.com/ruleset-engine/reference/phases-list/)) serves
   tiles from the edge with no Class B on a hit (~$800 a month at 100,000 hosts), over HTTP/2 and 3 instead of R2's six
   HTTP/1.1 connections, with a CORS answer a browser may keep, so the `no-store` re-reads end. Small in dollars, large
   in speed. A Worker checking the signature instead bills every request, a cache hit too, at $0.30 a million: nearly
   the $0.36 of the Class B read it saves.
5. **A lean presigner:** SigV4 by hand (`node:crypto`, the day's key cached) signs in ~4 µs against the SDK's ~170 µs
   (measured): ~$100 to $200 a month at 100,000 hosts, and a 200-id batch ~100 ms sooner.
6. **The site's own images:** 33 local files, each transformation kept 31 days in two formats
   ([the cache key](https://vercel.com/docs/image-optimization)): under $5 a month, so build-time pre-optimization
   waits; user media stays off `next/image`, with no remote image host in `next.config.ts`.

**A plan, full.** Storage with its backup is $0.025 a GB-month, and a photo's phone copy adds ~30% the cap never
counts. Full, 100 GB costs $2.50 to $3.20 a month, 500 GB $12.50 to $16, 2 TB $51 to $66 (against $39, or $32.50
yearly), and the 75 GB pass $1.90 to $2.40 ($23 to $29 a year against $24): the top plan loses money full, and 500 GB
and the pass run thin.

**No cold storage for the recoverable tail.** Infrequent Access is a third cheaper but adds a $0.01 a GB retrieval fee
and a 30-day minimum, so on a 30-day tail the saving is small and one restore costs more than it saved. The lever if
the tail grows: an R2 lifecycle rule moving tail objects to Infrequent Access (a Class A transition each), next to no
app code.

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

- **The email rate limit** (Authentication → Rate Limits → "Rate limit for sending emails") is editable only with
  custom SMTP on (Supabase starts it at 30 an hour) and sits at 100 an hour; raising it before a large
  Require-verified-emails event is in ROADMAP's launch checkpoint.
- **The quota is shared**: auth codes and lifecycle email draw on one Resend quota, so a crowd confirming emails in
  one evening can reach the free tier's daily cap; the paid tier lifts it.
- **Verify a change** by requesting a sign-in code at `/login`: it arrives from `noreply@partyreel.com` (never
  `…mail.app.supabase.io`), and the send shows in Resend → Emails.
