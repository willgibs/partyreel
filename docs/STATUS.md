# Partyreel — Status (you-are-here)

> ROLE: the live snapshot — what's true right now + what's blocked on a human.
> BELONGS HERE: current state, the infrastructure summary, the pre-launch pointer, "after any change". · NOT HERE: shipped history (→ [`CHANGELOG.md`](CHANGELOG.md)), how systems work (→ [`systems/`](systems)), what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place + prune (it's a snapshot — keep it short and current; move shipped narrative to CHANGELOG).

**Updated:** 2026-06-09

## Where we are

The **v1 foundation is built and verified in production** — the focused phased build is complete and the
project is in **one-off-task mode** (a goal → its own small plan → build → verify on partyreel.com →
record). Everything live is mapped in [`SYSTEMS.md`](SYSTEMS.md) (the index → the `systems/` deep docs);
the dated shipping history is in [`CHANGELOG.md`](CHANGELOG.md). Live + verified: host auth (incl. email+
password), the create wizard + QR designer + first-time welcome + custom slug, the unified guest event
page (live polling gallery, 3-state visibility, verified-email gate, saved events), guest + host upload,
moderation + the daily lifecycle cron + the "Recently deleted" recovery, the storage-cap tier model +
Stripe (Pro subs, Event Pass, portal), the growth loop + link analytics + the notification bell, the
album lightbox + per-item download, the admin portal (R1–P7), the marketing site (7 rounds + polish arc),
media durability (all 3 pillars + the deletion-aware backup prune, shipping in dry-run), and the
data-layer security hardening. Canonical domain
**partyreel.com**.

**Only scaffolded:** the highlight reel (DB scaffold only; the build is tabled pending a worker-platform
decision — see [ROADMAP.md](ROADMAP.md)).

**In flight:** the gated-gallery initiative — P1 (server-enforced `none/teaser/full` view access + the
real-photo teaser) shipped 2026-06-09; the unified entry modal (P2) + the host "Require guest accounts"
relabel (P3) are next ([ROADMAP.md](ROADMAP.md)).

## Infrastructure

All backing services run under the dedicated owner account **partyr33l@gmail.com ("P3")** (the migration
is recorded in [`CHANGELOG.md`](CHANGELOG.md)):

- **Supabase** project `ddafaemglzmuekbtjwzn` (P3 "Partyreel Team", Pro; daily backups on; the public
  `avatars` Storage bucket holds profile photos). ⚠️ the P3
  Supabase **MCP may be connected read-only** — the DB tool group returns a `permission` error if so;
  re-auth with the DB scope or use the dashboard SQL editor.
- **Cloudflare R2** account `8bd90d2f6a374d6cdff2f379e929b060` — bucket `partyreel` (primary, ENAM) +
  `partyreel-backup` (Bucket-Locked, WNAM).
- **Stripe** `acct_1TcStrPtjqmVkBwk` (**TEST** mode — live cutover is a launch task). **Sentry** org
  `partyreel`. **Resend** (`partyreel.com` verified; auth email routes via Resend SMTP). **Google OAuth**
  P3 web client. In-app operator `partyr33l@gmail.com` (`is_admin` + TOTP MFA).
- **"Allow new signups" must stay ON** (account-from-guest + email+password create all depend on it;
  anonymous sign-ins stay OFF per ADR-0008).
- **Deferred cutovers** (not blocking): Vercel hosting (still willgibs **Hobby** → P3 **Pro** at launch),
  domain + DNS (GoDaddy → P3 Cloudflare), the GitHub repo (`github.com/willgibs/partyreel` → P3 at sale).

## Pre-launch / human-blocked

The launch-gated + human/config tasks live in [`ROADMAP.md`](ROADMAP.md) → **Launch checkpoint** (each
tagged `[human]`/`[eng]`/`[content]`): leaked-password protection, Stripe test→live, `MONTHLY_INGRESS_BYTES.pro`,
the real `/privacy` page, the demo-event swap, the committed RPC suite, the Sentry email-alert-rule check,
the pre-launch test-data reset, the backup-prune live-flip (`PRUNE_MODE=live`, post-launch).
Resolved config (custom SMTP, "allow signups" ON, the `{{ .Token }}`
template, the account-password dashboard settings) is recorded in [`CHANGELOG.md`](CHANGELOG.md).

**Already configured — DO NOT redo:** R2 buckets + creds + CORS + abort-multipart lifecycle rule; the apex
`partyreel.com` domain; `CRON_SECRET` (Vercel); `profiles.is_admin` for the operator; the Stripe **TEST**
products/prices + webhook endpoint + Billing Portal + the 5 env vars; Supabase TOTP MFA +
`admin.partyreel.com/auth/callback` in the redirect allow-list + `NEXT_PUBLIC_ADMIN_HOST` in Vercel
(`partyr33l@gmail.com` holds the TOTP factor; break-glass = delete it in the Supabase dashboard,
`auth.mfa_factors`); the Sentry project + DSN + 4 env vars; the media-backup Worker + the DB-backup GitHub
Action secrets; the deletion-aware prune (deployed in dry-run, both crons) + its shared `PRUNE_API_SECRET`
(Vercel + the Worker).

## After any change

Advance this file (you-are-here), the owning [`systems/`](systems) doc (refine in place), the
[`ROADMAP.md`](ROADMAP.md) bucket, and move any shipping narrative to [`CHANGELOG.md`](CHANGELOG.md) — same
change. Re-run `get_advisors` after any DDL and confirm the expected set (see
[`systems/database-security.md`](systems/database-security.md)).
