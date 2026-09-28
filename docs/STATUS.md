# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-09-28

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: batch 7, the desk to zero

- **Milestone 29 is live** (`ab30a7f8`, 2026-09-26). Batches 4 to 7 ride `launch-prep` toward milestone 30.
- **Batch 6 landed whole** (sixteen lanes, builds 13 to 15, red-teamed live).
- **Will's sitting on build 15** is transcribed (2026-09-28, 21 answers): the hero's `guests` card, the guest voice's
  last three, host-storage's prices, event-safety's block, export-flow's six. Wave A draws three new boards
  (event-settings, locked-door, disposable-mode) and builds the per-event block; wave B wires pricing (his free/pro
  shift: Free at 100 MB with the password, custom link and 60 s reels), the voice, the export flow and the hero.

## The desk

Build 16's desk: 48 open asks.
- **From build 15** (31): `emails`, `privacy-hero`, `album-motion`, `loose-ends`, `contact-page`, `press-page`.
- **New** (17): `event-settings` (nine, its structure first), `locked-door` (two), `disposable-mode` (six).

`admin-triage` r2 and the wiring follow. His aim is zero before his other to-dos.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-29` (`ab30a7f8`, 2026-09-26), both projects READY and passed:
  the scale probe's guest poll answers the paged manifest whole (1,145) then a 304, the dashboard and the probe's hub
  (1,145 items, 20 to review) as willg97, his own password album with `?reel` and `?reel=screen` and its Download all
  (1 photo) while a signed-out viewer meets the password door, eleven public pages and both sign-in pages with no
  console error, the lab and `/admin/reels` 404, the admin door redirects, no runtime error.
  `admin.partyreel.com` is served by `partyreel-admin` (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel`
  (`=app`).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 16 (`49269fad`): the desk's 48
  open asks with the three new boards, loading clean headless. A lab-only round, the red-team's carve-out; build 17
  carries the wiring and its red-team.
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 5,700 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
- **Jobs:** the daily purge cron (Vercel Hobby fires it at 04:48 UTC; its first run on milestone 28's sweeps was green:
  every sweep ok, none stopped early, the orphan scan read 1,368 objects and deleted none, the standby budget's one host
  willg97 with the withdrawals out), the media-backup Worker and the daily DB-backup Action are live; the deletion-aware
  backup prune runs dry (`PRUNE_MODE=live` is a launch flip).
- **The repo is public for the interim** (GitHub Actions minutes); private again when the budget clears.

## Infrastructure

Every backing service runs under the owner account **partyr33l@gmail.com ("P3")**: **Supabase** `ddafaemglzmuekbtjwzn`
(Pro, daily backups, the public `avatars` bucket); **Cloudflare R2** `8bd90d2f6a374d6cdff2f379e929b060`, buckets
`partyreel` and `partyreel-backup`; **Stripe** `acct_1TcStrPtjqmVkBwk` (TEST; the live cutover is a launch task);
**Sentry** org `partyreel`; **Resend** (`partyreel.com` verified; auth email rides Resend SMTP); **Google OAuth** P3 web
client; the in-app operator `partyr33l@gmail.com` (`is_admin` and TOTP MFA); **Vercel** on the P3 team (two projects on one
repo, `partyreel` and `partyreel-admin`; Hobby; the Pro cutover, DNS to Cloudflare and the repo transfer are launch
cutovers). "Allow new signups" is off until launch (his choice: the product changes freely); anonymous sign-ins off. Configured once, never redone: the R2 buckets,
credentials, CORS and the abort-multipart rule; the apex domain; `CRON_SECRET`; `profiles.is_admin`; the Stripe TEST
products, prices, webhook, Billing Portal and their env values; Supabase TOTP MFA with the admin callback in the redirect
allow-list (break-glass: delete the factor in `auth.mfa_factors`); the Sentry project and its env; the backup Worker
and Action secrets; the prune crons and `PRUNE_API_SECRET`.

## Waiting on Will

- **His desk to zero**, then the stacked to-dos (`tracks/orchestrator.md`): the claims review's live walk, Q1, the
  private count's legal clause, a real-upload check, the iPhone Save check and one copy call.
