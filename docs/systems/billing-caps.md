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

- **`tier_limits()` mirrors `tiers.ts`,** held by `tier-limits-parity.test.ts`, which parses the newest migration
  defining it and throws on anything it cannot read. A limit only TypeScript knows is a suggestion: the reel's length
  cap is mirrored in SQL and re-derived from the host's own tier at render and mint, never taken from the client.
  Changing the function's return columns is DROP + CREATE (grants: [database-security.md](database-security.md)).
- **`create_media` enforces two bounds.** ACTIVE bytes (`host_active_bytes()`: non-removed media in non-deleted
  events) against the cap plus a 10% write headroom (`capWithWriteHeadroom` mirrors it, so the over-cap sweep engages
  at the same line), and a monthly INGRESS meter (`storage_ledger.cumulative_bytes`) against
  `monthly_ingress_cap()`: static for Free, a multiple of the effective cap for paid tiers, so the abuse bound scales
  with the plan. The ingress bound is a backstop, never marketed (`content-policy.test.ts` fails content that names
  it). `host_active_bytes()` is the one SQL definition every cap check reads.
- **Three counters, deliberately different; never reconcile them.** The cap reads active bytes, so a delete frees
  room at once; the monthly ledger never decrements (it is also the delete-and-re-upload churn defense);
  `storage_used_bytes` is the PHYSICAL meter only (up on create, down only in `purge_media_rows`) and gates nothing.
- ★ **Every storage figure a host or the storage guard reads is `host_storage_summary(uuid)`** (through
  `getHostStorageSummary`, on the admin client with the `getUser()` id): one sum each for active and Deleted bytes,
  whatever the album's size. Deleted is only what the host can restore: a guest's own withdrawal counts in neither
  number, because a guest's own delete is gone everywhere for the host. `storage-summary.test.ts` reads both filters
  off the migrations, and a failed read throws, because the guard would read a swallowed failure as an empty account
  and sell any size.
- **Video is a paid feature** (`tier != 'free'`). The authoritative gate sits at the top of the tier-caps block of
  BOTH `create_media` and `create_media_as_host`, after `tier_limits()` loads: in the universal-limits block above it
  the tier is not loaded yet, and the check would silently pass everything. The upload contexts return an advisory
  `video_blocked` the presign routes fail fast on, worded around the EVENT for a guest so the host's plan never
  leaks.
- The `tier_type` enum carries an unused `max`: coerce a database tier with `toBillingTier()` (`max` becomes
  `pro`, anything unknown `free`) before indexing `tiers.ts`. Dropping an enum value is not worth its risk.
- A Free profile's null `storage_cap_bytes` falls back to the `tier_limits()` default.
- ★ **Reel artifact bytes are exempt from the cap,** so a Free host near the cap keeps the feature that sells the
  product. The exemption is safe only while one artifact per event holds (a re-render overwrites one stable key, and a
  test pins it); plural reels per event would re-decide it first.

## Plan changes

- **One plan at a time for Pro; passes stack.** Checkout refuses everything, a pass included, for an active Pro: a
  second subscription double-bills one cap, a size or cadence change is change-plan's, and cancelling is the
  portal's. `resolveEntitlement()` decides from `profiles`, never the request body. Another pass is another ledger row
  (one more event slot and another pass's storage, for its own year), and a pass holder may start Pro, the prorated
  credit consuming their passes. A pass write never flattens a Pro cap (the recompute's WHERE carries
  `.neq("tier","pro")`). Pro caps never stack, as a max or a sum: every webhook would resolve two live entitlements,
  and "whose media survives when one plan ends?" has no honest answer.
- ★ **No plan change leaves a host storing more than the new cap,** so we never remove a host's media or carry their
  excess ourselves. One check, `checkPlanChange`, guards every purchase that REPLACES the cap: any Pro checkout (a
  pass holder's included) and any Pro-to-Pro size or cadence change, a downgrade included. An Event Pass only adds
  room, so it is never refused; cancelling is as normal. The check compares ACTIVE bytes (`getHostStorageSummary`,
  never re-derived) with the target plan's PLAIN cap from `tiers.ts`, never the 10% headroom (a courtesy at upload,
  not room to buy into), and it ignores the current tier, so a Free host in the over-cap grace meets the same line.
  A refusal (409 `over_new_cap`) names the smallest size that fits, rounding the stored figure and the gap UP so doing
  exactly what it says is enough. A Pro Checkout session closes 31 minutes out (Stripe's floor is 30 by its own
  clock), so the check it passed stays true. The backstops stay: the webhook does no usage check, and the 45-day
  over-cap grace catches what the check cannot see (a cancellation, a pass running out, a dashboard change, growth
  between the check and Stripe's confirm).
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
  `[start_at, expires_at)` window: a purchase stacks a fresh year from its own instant; a renewal (the cheaper price,
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

## Verifying billing

Checkout and the webhook cannot run on localhost: verify on the launch-prep alias with the test card `4242 4242 4242
4242`. The Chrome MCP cannot drive Stripe-hosted pages, so the card entry is the human's; read the result through the
Supabase MCP (`profiles.tier`, `storage_cap_bytes`), and exercise the downgrade by cancelling immediately through the
Stripe MCP (`stripe_api_write`). A change-plan session is verified through the API instead: create one for a TEST
customer with a live subscription and read back `configuration` (the tagged id), `flow.type`,
`flow.subscription_update_confirm.items` (one item, the target price, quantity 1) and `flow.after_completion.type`
(`redirect`); an unused session URL expires in 5 minutes. A portal configuration's products read back only with
`GET /v1/billing_portal/configurations/<id>?expand[]=features.subscription_update.products` (the list omits them).
