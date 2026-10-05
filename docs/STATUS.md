# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-10-05

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: round 15, from his desk on build 51

- **Milestone 36 is live** (`28bd6d62`, 2026-10-04 21:00Z): round 15's Ladder A, trash in storage, the round's wirings,
  the plan limits watch and the compute fixes, red-teamed on builds 52 and 53 and locally (53b). The legal text is
  rewritten once, right before launch (his word).
- **`launch-prep` holds milestone 37's work**: 17 lanes since milestone 36 (uploads in bursts, hand-signed links, the S3
  SDK loaded on first send, upload cancel, the uploads line, the admin's uploads view, crumbs-66 to 74), red-team 54
  walking it locally; desk 3's four boards merged behind desk 2.
- **Vercel's Hobby Active CPU** reads about 3.92 of 4 hours over 30 days (2026-10-05; the 2026-10-03 peak rolls off in
  early November): nothing of ours runs on Vercel but what Will asks for by name; desks and red-teams run on a local
  production build at port 3000 (`CLAUDE.md`, "Local dev vs. live testing").

## The desk

Desk 2 is Send to Google Drive alone (nine asks), on Will's local desk (`http://localhost:3000/design/lab?key=fiesta`,
pinned at `94d66338`). Desk 3's four boards (identity r4, customize r1, event-header r4, host-dashboard r4) are merged on
`launch-prep`, the desk pass clean, served the moment desk 2 is answered; desk 4 is brand r1 alone; then the small
moments and the brand applied:
`../partyreel-wt/_scratch/desk/round-15-plan.md`.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-36` (`28bd6d62`, 2026-10-04 21:00Z), both projects READY; the
  read-only walk PASS (the public pages 200, the lab 404, the cron 401 to a stranger, Ladder A on /pricing with no
  "ingress", HSTS, nosniff and frame-ancestors, the admin domain at its login). Production's pass prices are Ladder A's
  TEST prices. Its crons: the purge at 04:00 UTC and the spend watch (now with the plan limits) at 05:00.
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 53 (`31a73a46`, 2026-10-04
  14:35Z), idle under the CPU limit; the desk build at port 3000 is the working copy of `launch-prep`.
  Vercel installs with pnpm 9.14.4, `package.json`'s `packageManager`.
- **The shared database** runs every migration through 2026-10-04, each by protocol: round 13's
  (`approval_never_with_a_develop`, `phone_copy`, `event_end_date`, `spend_watch`, `event_dates_finite`,
  `upload_meter`, `doorbell_moment`) and round 15's (`deleted_counts`, `ladder_a`, `camera_clip`, `dashboard_display`
  20261004084757), each an expand milestone 35 runs beside; no build of either project reads a dropped thing. The
  album-log prune runs nightly with the purge.
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 11,120 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
- **Jobs:** the daily purge cron (Vercel Hobby fires it anywhere between 04:00 and 05:00 UTC, seen at 04:48; its first run on milestone 28's sweeps was green:
  every sweep ok, none stopped early, the orphan scan read 1,368 objects and deleted none; the standby budget's sweep
  retired with trash-in-storage), the spend watch daily at 05:00 UTC (hourly at launch), the media-backup Worker and the daily DB-backup Action are live, and the export
  Worker checks itself daily at 05:30 UTC (`/admin/jobs`); the deletion-aware
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

- Desk 2 (Drive, on the local desk); Claude in Chrome on willg97 (red-team 54's host walks); milestone 37's yes after
  red-team 54; the calls lab's open questions (X1 the develop time, X2 a Vercel token for the limits watch, X3 a
  Cloudflare analytics token, X5 the CDN-cached album, X6 the operator's uploads credit) and the calls built for him to
  overrule; Vercel Pro or the window; the 26 policy tests; the walks only he can drive (`tracks/orchestrator.md`).
