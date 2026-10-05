# Billing, tiers & storage caps

Open this before you:
- change a price, a limit or what a tier unlocks (TypeScript and SQL move together);
- touch anything that decides whether an upload, a restore or a plan change fits;
- touch Stripe checkout, change-plan, the portal or the webhook;
- change the pricing sheet, a lock chip, the post-checkout receipt or the account page's Plan card;
- verify billing live.

The numbers, the Stripe catalog, both portal configurations, the ten env values and the test-to-live cutover are
[`../PRICING.md`](../PRICING.md)'s; the over-cap and lapsed-pass sweeps are [lifecycle-recovery.md](lifecycle-recovery.md)'s.

## The cap model

A tier is a total stored-bytes cap; nothing caps items per event. `tiers.ts` holds every price and limit and stays
client-import-safe (no env, no Price IDs: those map in the server-only `stripe/plans.ts`).

- **`tier_limits()` and `upload_allowance()` mirror `tiers.ts`,** held by `tier-limits-parity.test.ts`, which parses
  the newest migration defining each (the per-tier columns, and Pro's ladder of sizes) and throws on anything it cannot
  read. A limit only TypeScript knows is a suggestion: the clip's length
  cap is mirrored in SQL and reaches the creator only as the server's tier-derived `ClipFacts`, never the client's.
  Changing the function's return columns is DROP + CREATE (grants: [database-security.md](database-security.md)).
- ★ **The cap holds everything she stores, her albums and her Deleted together** (`host_storage_summary`: her albums
  `host_active_bytes()`, non-removed media in non-deleted events, beside the sum of `host_deleted_media`, exactly her
  two Deleted lists: [lifecycle-recovery.md](lifecycle-recovery.md)). A delete frees nothing; an item frees room only
  when it leaves Deleted for good, so nothing parked in Deleted outgrows the plan.
- **`create_media*` enforce two bounds,** on the HEAD's size, at complete. What she stores against the cap plus a 10%
  write headroom (`capWithWriteHeadroom` mirrors it, so the over-cap sweep engages at the same line), Deleted making
  the room first when her setting is on and the file fits beside her albums (`leave_deleted`, oldest first, exactly
  what the file needs, under the profiles lock), and the UPLOADS ALLOWANCE: her plan's own published number
  (`upload_allowance()`: Free's and one pass's from `tier_limits()`, a stack's one pass's for each pass her room holds,
  Pro's by its size, the smallest Ladder A size holding her cap) against what its window has used (`uploads_used()`).
  `host_storage_summary` is the one read every cap check makes.
- ★ **The allowance's window is a calendar month, or a pass's own year.** Free and Pro read this month's
  `storage_ledger.cumulative_bytes` (UTC, `YYYY-MM`, never decremented). A pass holder reads her live passes'
  `event_passes.uploaded_bytes`, which the two completes alone increment, on the live pass that ends soonest, under
  the profiles lock: so the year is the one she paid for, a renewal's year opens on its own row at zero, and a pass
  that ends takes its count with it (generous at a stack's edge, never a false refusal). Every upload still lands on
  the month's row too (spend-watch and the hour's breaker read it). ★ A pass the nightly recompute has not caught up
  with (her profile still a pass's, no window live) is refused at the completes in the allowance's words (the
  Advisor's Q26 F1), so nothing lands counted nowhere; the presign's meter still admits it for that day at most. A Pro
  profile with no cap on record is unmetered.
- **The allowance is published; only the breakers are not.** The pricing table's Uploads row prints each plan's
  number with its window (`uploadsLabel`); `content-policy.test.ts` fences the backstop's old name ("ingress") and the
  unpublished breakers' numbers, read from the SQL that sets them. The meter's wire keeps its names
  (`at_monthly_cap`, the `'monthly'` reason) for the allowance whatever its window, and the two presign routes refuse
  it "for now", never "for the month".
- **Make room from Deleted** (`profiles.make_room_from_deleted`, on by default, the one profiles column a host
  writes): on, a full plan's upload takes its room from Deleted, oldest first, so a full Deleted never refuses a
  guest's photo at a party; off, the upload is refused until she empties Deleted or moves up a size. It governs
  uploads alone: at the over-capacity deadline her own Deleted leaves first whatever it says, since the reduce is not
  an upload ([lifecycle-recovery.md](lifecycle-recovery.md)). The line an
  upload meets before its complete is `host_room_used` (her albums, plus Deleted while the setting is off): the
  presign's meter refuses past it and the three upload advisories answer "full" at it, so nobody is sent to upload a
  file the complete will refuse. The storage chart (`components/app/storage/storage-chart.tsx`, the storage ring's
  popover) draws her albums and her Deleted apart against the cap beside the switch (which asks only when it turns
  off) and Empty Deleted (which always asks); the ring's percent is everything she stores, amber only when what an
  upload must fit beside nears the cap (`readStorage`).
- ★ **The month counts what landed, once, at complete; staging makes "landed" exact** (upload-meter, the Advisor's
  Q19). Every single PUT (an original under the multipart threshold, every preview, every phone copy) is minted at its
  key's `staging/` twin (`stagingKeyFor`, `r2/keys.ts`), and the complete copies it into `events/` before its row is
  written (a refused or failed record deletes the copies again); a multipart becomes an object only at the complete's
  own assembly. So an unsent byte never counts, a phantom presign stores nothing, a dropped and retried PUT counts
  once, and an abandoned upload never reaches `events/`: the backup's subscription and reconcile and the orphan sweep
  read `events/` alone, and one R2 lifecycle rule deletes `staging/` a day on. Staging is the app's alone, so a
  grief needs real bytes: declaring a size spends nothing.
- **The presign's meter refuses early, and counts no month** (`meter_upload`, 20261003210500, through
  `upload/server-pipeline-meter.ts`): after every gate of its route and before any URL exists, it refuses past the
  hour's breaker, past the allowance (the complete's own line over the same window, read early) or past the room
  (`host_room_used`; the
  refusal carries `needed_bytes`, `deleted_bytes` and `makes_room`), each in the route's own words (a guest's name the
  album, never the plan: `meterRefusal`), and tallies the hour for an upload it admits. No profiles
  lock: its reads are advisory and the tally is one atomic upsert. It fails OPEN, as the limiters do, since the
  complete's count and caps stand behind it.
- **Two breakers far past any party, unpublished, refused in words,** so "no guest limit" and "unlimited events" stay
  true. An account's uploads a clock hour, 20,000 (`c_uploads_an_hour`), every guest's and her own into all her events,
  tallied on the month's row (`hour_started_at`, `hour_uploads`) by `meter_upload` and refused at presign (429 with
  `Retry-After` to the hour's end). An account's events created in any 24 hours, 100 (`c_events_a_day`), a deleted one
  included, in `enforce_event_limit` on a creation alone (its undelete trigger is a restore) and after the plan's own
  limit; the create action prints its sentence, never the plan limit's, since a Pro host has no event limit to upgrade
  past (`mutations/events.ts`). Each constant's WHY sits beside it in 20261003210500.
- **Four counters, deliberately different; never reconcile them.** The cap reads what she stores, Deleted included,
  so a delete frees nothing until the item leaves Deleted for good; the monthly ledger never decrements (it is also
  the delete-and-re-upload churn defense), and nor does a pass's `uploaded_bytes`, its year's twin; `storage_used_bytes`
  is the PHYSICAL meter only (up on create, down when a row is asked to leave or purged) and gates nothing.
- ★ **Every storage figure a host or the storage guard reads is `host_storage_summary(uuid)`** (through
  `getHostStorageSummary`, on the admin client with the `getUser()` id): her albums, her Deleted and the system's part
  of it, whatever the album's size, and what her plan holds is the first two together (`storedBytes`). Deleted is only
  what the host can restore: a guest's own withdrawal counts in no figure, because a guest's own delete is gone
  everywhere for the host. `storage-summary.test.ts` reads both definitions off the migrations, and a failed read
  throws, because the guard would read a swallowed failure as an empty account and sell any size.
- **Video is a paid feature** (`tier != 'free'`). The authoritative gate sits at the top of the tier-caps block of
  BOTH `create_media` and `create_media_as_host`, after `tier_limits()` loads: in the universal-limits block above it
  the tier is not loaded yet, and the check would silently pass everything. The upload contexts return an advisory
  `video_blocked` the presign routes fail fast on, worded around the EVENT for a guest so the host's plan never
  leaks. ★ A guest's video also needs the album's Videos switch (`events.allow_videos`, on by default, live on paid
  plans only): `create_media` refuses it in the plan's own words and `video_blocked` says so first, while
  `create_media_as_host` never reads the switch, as the per-upload cap binds guests alone.
- **The paid gates on event settings live in their setter RPCs and mirror `GATED_EVENT_SETTINGS`,** which is empty:
  `set_event_password` and `set_event_slug` name no tier, and `tiers-sql.test.ts` fails a gate added to one half only
  (an app lock over an open RPC is walked around; an RPC refusal under an open control is a broken button). With
  custom links on Free, `set_event_slug` also refuses `RESERVED_SLUGS` in SQL, parity-tested, because a host can call
  it past the server action.
- The `tier_type` enum carries an unused `max`: coerce a database tier with `toBillingTier()` (`max` becomes
  `pro`, anything unknown `free`) before indexing `tiers.ts`. Dropping an enum value is not worth its risk.
- A Free or pass profile's null `storage_cap_bytes` falls back to its tier's default cap (`effectiveStorageCap`) on every surface that prints or checks a cap, the operator's Accounts list included; only a Pro's null is unmetered.
- **A clip added to an event is an ordinary video:** `create_media*` meters it against the cap and the monthly meter
  like any upload, and the video gate refuses it on Free. The live reel and a clip kept on a device store nothing, so
  they cost nothing ([reel.md](reel.md)).

## Plan changes

- **One plan at a time for Pro; passes stack.** Checkout refuses everything, a pass included, for an active Pro: a
  second subscription double-bills one cap, a size or cadence change is change-plan's, and cancelling is the
  portal's. `resolveEntitlement()` decides from `profiles`, never the request body. Another pass is another ledger row
  (one more event slot and another pass's storage and uploads, for its own year), and a pass holder may start Pro, the prorated
  credit consuming their passes. A pass write never flattens a Pro cap (the recompute's WHERE carries
  `.neq("tier","pro")`). Pro caps never stack, as a max or a sum: every webhook would resolve two live entitlements,
  and "whose media survives when one plan ends?" has no honest answer.
- ★ **No plan change leaves a host storing more than the new cap,** so we never remove a host's media or carry their
  excess ourselves. One check, `checkPlanChange`, guards every purchase that REPLACES the cap: any Pro checkout (a
  pass holder's included) and any Pro-to-Pro size or cadence change, a downgrade included. An Event Pass only adds
  room, so it is never refused; cancelling is as normal. The check compares what she STORES, her Deleted included
  (`getHostStorageSummary`'s `storedBytes`, never re-derived), with the target plan's PLAIN cap from `tiers.ts`, never
  the 10% headroom (a courtesy at upload,
  not room to buy into), and it ignores the current tier, so a Free host in the over-cap grace meets the same line.
  A refusal (409 `over_new_cap`) names the smallest size that fits WITH its billing (a size has two prices), rounding
  the stored figure and the gap UP so doing exactly what it says is enough; what a host stores prints that one way on
  every surface that shows it (the meter, the Plan card, the size list), while a file's or an event's size prints to
  the nearest tenth. A Pro Checkout session closes 31 minutes out (Stripe's floor is 30 by its own
  clock), so the check it passed stays true. The backstops stay: the webhook does no usage check, and the 45-day
  over-cap grace catches what the check cannot see (a cancellation, a pass running out, a dashboard change, growth
  between the check and Stripe's confirm).
- ★ **A smaller Pro size also carries a smaller uploads allowance, and that is words, never a refusal.** A host whose
  month's uploads (`PlanFacts.monthUploadedBytes`: the ledger's month through `readHostMonthUploads`, whatever window
  her own plan counts) have reached the target size's allowance reads, on that size's card, that new uploads (her
  guests' too) would pause until the month turns (`uploadsPauseNote`): the webhook allows the switch, so
  `checkPlanChange` stays storage's alone. Only a real change of allowance she may press carries it, and a failed
  read omits the sentence, never the sheet. `/pricing`'s hop has no card to carry it (the page is tier-blind), so
  change-plan answers it beside the url as `notice` (only for a step down in the allowance, read after the storage
  check and while the portal session is made, a failed read answering none) and the CheckoutButton shows it, holding
  one reading before it leaves; the sheet's own switch ignores it, having said it on the card.
- **A Pro switch goes through `/api/stripe/change-plan`, never the general portal.** `/pricing` is static and
  tier-blind, so a Pro host's tap on a Pro size is refused at checkout (`already_subscribed`) and the button re-posts
  the same plan id to change-plan. After the subscription and storage checks, the route opens a portal session on
  the TAGGED configuration as a `subscription_update_confirm` flow for exactly one item (the target price, quantity 1)
  that redirects back to the app, so the host never meets that configuration's switcher. Proration, payment and 3DS
  stay Stripe's; the route writes nothing, and the webhook applies the new cap.
- **The change-plan configuration is found by its tag** (`metadata.partyreel_purpose=change_plan`), never an env
  value: listed once per warm instance and cached; with none tagged the route fails CLOSED (503 and a Sentry
  capture), never falling back to the default configuration; a stale id is forgotten and looked up once more. The
  general portal keeps the card, the invoices and cancelling, with its plan switching OFF: its quantity stepper has no
  maximum and could bill two or three times for one cap.
- **The prorated pass-to-Pro credit is honoured in the webhook, idempotently:** a customer-balance grant keyed
  `pass-credit-<sessionId>` (a Stripe idempotency key, so a retry never double-grants), then every live pass consumed
  (zero rows on replay), then `tier_expires_at` and `event_slots` cleared. A balance carries from invoice to invoice
  (Checkout's own first invoice never takes it), where an `amount_off` coupon would silently eat any credit above one
  invoice's total.
- **A subscription write nulls `event_slots` and `tier_expires_at` every time:** nothing banks behind Pro, and a stale
  stacked-pass slot count would cap a Pro host inside `enforce_event_limit`'s coalesce. The downgrade path then runs
  `recomputePassEntitlement`, so a live uncredited pass resurfaces instead of evaporating.
- **An Event Pass is a one-time payment on a ledger.** Checkout runs `mode: "payment"`, so no
  `customer.subscription.*` event fires: `checkout.session.completed` (`metadata.plan_id === "event_pass"`) mints one
  `event_passes` row (idempotent on `stripe_session_id`; `price_cents` is what was actually charged, so a promo
  prorates off the real payment) and `recomputePassEntitlement` derives the profile. Each row owns a
  `[start_at, expires_at)` window, and its uploads counted inside it: a purchase stacks a fresh year from its own
  instant; a renewal (the cheaper price,
  `metadata.renewal="1"`) starts at the soonest-expiring active pass's expiry (it extends, never resets, per window),
  and an unopened renewal year credits at 100% on a move to Pro. A renewal needs a window active NOW, read from the
  ledger at checkout, never the profile's label. `profiles.event_slots` is the concurrent-pass count and, when set,
  replaces `MAX_EVENTS` in `enforce_event_limit`.

## The webhook

- **The Stripe webhook, with the pass recompute (`recomputePassEntitlement`, which the webhook and the cron's
  `sweepExpiredPasses` call), is the SOLE writer** of `tier`, `storage_cap_bytes`, `stripe_subscription_id`,
  `event_slots` and `tier_expires_at`, always through the admin client. Checkout only persists `stripe_customer_id`
  and stamps credit metadata. None of these columns is client-writable ([database-security.md](database-security.md)).
- **Every entitlement write asserts exactly one matched row** (`applyEntitlement`) and throws otherwise, so a paid but
  unprovisioned host becomes a 5xx and a Stripe retry, never a silent 200. Nothing reconciles Stripe against
  `profiles` after the retry window: the assertion and its Sentry capture are the reconciliation.
- **Deliveries are ordered by `profiles.stripe_event_created_at` inside the WHERE clause** (atomic under concurrent
  delivery): `<=` for the absolute patch, so a replay is a no-op and two distinct same-second events both land. Zero
  matched rows is ambiguous, so a follow-up select tells a declined guard (200) from a missing profile (5xx). The
  customer-binding write leaves no stamp, because `customer.subscription.created` can carry an earlier `created` than
  its checkout session. Pass purchases skip the guard: the ledger's unique `stripe_session_id` makes them
  replay-safe.
- ★ **A downgrade lands only on the profile following the subscription it ends** (or following none): one customer can
  hold two subscriptions (two Checkout tabs, a stale session), so `resolveSubscriptionUpdate` names it and the write
  carries "is null or is that one" in the same WHERE as the recency guard; a declined one is a 200 that writes nothing.
  The pass checkout's pointer clear skips a Pro profile (a pass session lives a day).
- ★ **And one that would land asks first whether another still bills** (crumbs-41): the webhook lists the customer's
  subscriptions once and the profile follows the live one that stores the most, the newest on a tie
  (`successorSubscription`), never Free while it bills; a failed read is a 500 and a retry, never a Free guess. A grant
  that re-points a profile away from a subscription it still follows (the second tab's payment) raises
  `stripe_grant_repointed_subscription`, and a successor chosen beside others still live
  `stripe_customer_live_subscriptions_above_1`: both bill for one cap, which the operator settles in Stripe.
- **Provisioning is the pure `resolveSubscriptionUpdate`, returning absolute values,** so a redelivery is idempotent.
  `customer.subscription.deleted` and the ended states (`incomplete_expired`, `canceled`, `unpaid`, `paused`)
  downgrade to Free; `active`, `trialing` and `past_due` grant. ★ **`incomplete` changes nothing** (no write, no
  recency stamp): Checkout creates the subscription `incomplete` and it turns `active` when the first invoice is paid,
  the recency guard admits same-second deliveries in either order, and two TEST endpoints (the alias's and
  partyreel.com's) write the one database, so a downgrading `incomplete` could land after the `active` and leave a
  paying host on Free.
- **A subscription billed more than once for one cap is a warning, never a bigger cap:** any item quantity above 1
  raises `stripe_subscription_quantity_above_1` in Sentry, provisioning writes one plan's cap, and the operator
  settles the extra billing in Stripe.
- `apiVersion` is pinned to the installed SDK's bundled version and bumps deliberately with the SDK. `plans.ts` is
  server-only (it reads env), so tests exercise `provision.ts` instead.
- Checkout's `consent_collection` stays off: the Terms line rides the account door and the guest door's welcome step
  ([auth-accounts.md](auth-accounts.md)), so every paying host has met it.

## The in-app pricing surface

- ★ **Nothing in the app's pricing surface decides an entitlement.** The sheet, the lock chip and the receipt take the
  server-derived tier only as context for which sentence to render; checkout and change-plan re-resolve everything
  from `profiles` and Stripe, and the RPCs enforce it again; the sheet's own read when it opens
  (`/api/stripe/plan-facts`) is context too. So a forged prop or a hand-typed `?welcome=pro` changes a headline,
  never a permission. The receipt's `applied` is `tier !== "free"` read at render, never the URL marker: Stripe redirects the instant
  payment succeeds, routinely a second or two before the webhook, so the modal re-reads a bounded number of times.
  Every price on the surface comes from `tiers.ts`.
- ★ **The account page's Plan card (`#plan`) is billing's one home in the app,** and every fact on it is
  server-derived: the columns only the webhook and the pass recompute write, read through the RLS-scoped profile row.
  Its only search params are `?reset` and `?welcome` (Stripe's return marker, which opens the receipt and decides no
  plan); `plan-card.test.ts` pins the read path.
- ★ **Checkout's `success_url` comes from an exact-shape allow-list,** never a sanitized input (`return-path.ts`):
  `/dashboard`, `/dashboard/<uuid>` with an optional `room=share|settings`, and `/account`; anything else returns to
  `/dashboard`, so no client value leaves the origin, and Stripe validates none of it. The list is also the set of
  pages that mount `WelcomeToPro`, so a new shape mounts the modal in the same change.
- **A Pro host's plan is her three sizes under one Monthly / Yearly toggle** (`pro-price-list.tsx`), each card's
  holds line led by the size's use (`holdsPhrase`, `components/app/pricing/holds.ts`, the pricing page's phrases' one
  home): it opens on her billing, the tag beside Yearly is computed from the price labels (`cadence.ts`, the smallest whole-month saving
  across sizes), each card names its uploads (`uploadsPhrase`) and draws how full what she stores would make it, and
  the fit line reads at the billing on show. The list is quiet, offering no move, until her plan is read
  (`usePlanFacts`' `settled`); a read that fails keeps the Switches, since change-plan re-checks everything. `carry` still holds for a host choosing a first plan: one Pro size at one cadence beside Free.
- ★ **An estimate always carries its camera.** `formatCapacity` appends `ESTIMATE_BASIS` ("at an iPhone's default
  camera settings") by default; `basis: false` is only for a surface that says it once beside the figures (the sheet's
  cards over one `ESTIMATE_BASIS_NOTE`, a table under its caption).
- **A size too small for what she stores is a door, not a dead end** (`components/app/storage/`): its card flips in
  place to the numbers, and "See what's using space" opens the size list (her items largest first, read under RLS,
  Deleted at its head with Empty) with a goal strip that finishes that switch. The list frees room the one way room
  frees, Delete for good, behind a confirm (nothing comes back). The strip only ever calls change-plan, which checks
  again, and its button deletes what is only selected first ("Delete and switch", the same confirm), because a
  selection has freed nothing yet; it counts from what she stored before this visit's deletions, so nothing is counted
  twice, and a refused switch re-bases it on the refusal's fresher figure.

## Verifying billing

Checkout and the webhook cannot run on localhost: verify on the launch-prep alias with the test card `4242 4242 4242
4242`. The Chrome MCP cannot drive Stripe-hosted pages, so the card entry is the human's; read the result through the
Supabase MCP (`profiles.tier`, `storage_cap_bytes`), and exercise the downgrade by cancelling immediately through the
Stripe MCP (`stripe_api_write`). A change-plan session is verified through the API instead: create one for a TEST
customer with a live subscription and read back `configuration` (the tagged id), `flow.type`,
`flow.subscription_update_confirm.items` (one item, the target price, quantity 1) and `flow.after_completion.type`
(`redirect`); an unused session URL expires in 5 minutes. A portal configuration's products read back only with
`GET /v1/billing_portal/configurations/<id>?expand[]=features.subscription_update.products` (the list omits them).
