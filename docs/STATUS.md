# Partyreel — Status

> **You-are-here, short and current.** What's live, what's pending a human, what's in flight.
> For the feature map read [`SYSTEMS.md`](SYSTEMS.md); for backlog/deferred work + the
> pick-up-a-task loop read [`ROADMAP.md`](ROADMAP.md); for how to work in the repo read
> [`CLAUDE.md`](../CLAUDE.md).

**Updated:** 2026-05-31

## Where we are

**The v1 foundation is built and verified in production.** The focused phased roadmap is
complete — the project is now in **one-off task mode** (a goal → its own small plan → build →
verify on partyreel.com → record). Shipped + live-verified: host auth, the create wizard + QR
designer + first-time welcome, guest join/upload, galleries, moderation + the purge-cron
lifecycle, the storage-cap tier model + Stripe (Pro subs, Event Pass, portal), the growth loop
(branded share/SEO/guest email capture), link analytics, and the notification center. Full map
in [`SYSTEMS.md`](SYSTEMS.md). Canonical domain **partyreel.com**; R2 bucket `partyreel`
provisioned (CORS `ExposeHeaders: ETag` + abort-incomplete-multipart rule).

**Only scaffolded:** Phase 5 — the highlight reel (DB scaffold only; deliberately tabled
pending a product + architecture decision — see ROADMAP).

## In flight / pending verification

- **Album lightbox + per-item download** is built + **locally verified** (lightbox open / ←→ nav /
  Esc close + photo & video, desktop and mobile; the forced-download header curl-confirmed against
  R2 — `Content-Disposition: attachment` with the friendly filename) but **not yet deployed**. Push
  to partyreel.com, then confirm a real **Save** click downloads and the **host-gallery** lightbox
  works while signed in (`willg97@gmail.com`). _(Two seeded test media — 1 photo, 1 video — were
  added to the "Share Step Test" album for the local check; disposable, fine to delete.)_
- **The email-driven lifecycle flows are deployed but NOT yet live-verified** — over-capacity
  grace→auto-reduce, the Event-Pass renewal nudge ($15 checkout), and free-tier inactivity
  warn/remove all send via Resend, which **isn't configured yet** (see below). Verify each once
  `EMAIL_FROM` + a sending domain are set (a test email arrives + doesn't re-send; the
  grace/renewal/inactivity transitions fire).
- _(Test data on prod is disposable — current host test account is `willg97@gmail.com` with one
  "Share Step Test" event; the operator/admin account is `hi@willgibs.com`.)_

## Blocked on a human ("manual instrument")

The agent can't do these — they need a human in a dashboard:

- **Resend** — set `RESEND_API_KEY` + `EMAIL_FROM` (`Partyreel <noreply@partyreel.com>`, no
  quotes in Vercel) + **verify a sending domain (DNS)**. Until then transactional email is dark.
- **Stripe test → live (before launch)** — re-create products/prices in LIVE + swap the 5 env
  vars to `sk_live_…` / live `whsec_` / live price IDs (code needs no change). Checklist:
  [`PRICING.md`](PRICING.md) "Test → Live cutover". _(Currently TEST mode, verified.)_
- **`MONTHLY_INGRESS_BYTES.pro`** is still `null` (unmetered) — tune it before Pro launch.
- **Supabase CLI** isn't installed locally; migrations are applied via the **Supabase MCP**
  (`apply_migration`). To use `pnpm db:types` / `db:push`, install the CLI +
  `supabase link --project-ref ddafaemglzmuekbtjwzn`.

**Already done (don't redo):** R2 bucket + creds + CORS + lifecycle rule, the apex
`partyreel.com` domain, `CRON_SECRET` (Vercel), `profiles.is_admin = true` for the operator, and
the Stripe **TEST** products/prices + webhook endpoint + Billing Portal + the 5 env vars.

## After any change

Advance this file, the [`SYSTEMS.md`](SYSTEMS.md) entry if a feature changed, and the
[`ROADMAP.md`](ROADMAP.md) box/backlog — same change. Re-run `get_advisors` after DDL (the
expected set is the 7 anon capability RPCs + the deny-all INFOs + the unrelated leaked-password
WARN — see SYSTEMS "Security & data model").
