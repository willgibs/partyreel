# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-10-02

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: batch 10, toward his sitting

- **Milestone 32 is live** (`21697db1`, 2026-10-01): batch 9 whole (crumbs-28 to crumbs-40, crumbs-45, hide-strikes,
  demo-stall), red-teamed on builds 33 to 36 and build 36's one MEDIUM fixed and proven on build 37: the instant
  hide's three strikes, a shared phone's one ticket per account, My uploads and My likes past 200 with faces in the
  credits, the album log pruned under watermarks, every published claim made true. The legal text is rewritten once,
  right before launch (his word).
- **Batch 10 is merged on `launch-prep`** (Will, 2026-10-01: finish the round, then he answers the desk once, on settled
  production): crumbs-41 to crumbs-44, strip-gaps, export-ends (and its Worker), lab-sitting and mkt-polish, their seven
  migrations applied by protocol (the Advisor's Q7: all as written). Build 38 carries them to the alias for its red-team
  and one pass of the desk against it; then his sitting. No new lane until his paste.

## The desk

Six boards, made true of production on build 31 (a re-read of every claim they make): `locked-door` r2 (four asks),
`event-ready` r1 (five), `privacy-hero` r4 (one: which veil), `disposable-mode` r2 (eight), `demo-framing` r2 (three)
and `about-press` r1 (two), in that order.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-32` (`21697db1`, 2026-10-01 23:58Z), both projects READY; the
  read-only walk PASS (pages and German pricing, dead ends, the dashboard, Show more, the hub's Add, credits, the
  Report sheet, the admin door).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 40 (`26743369`, 2026-10-02
  09:05Z): build 39 plus round 11's five production lanes from his desk answers (the doorway as the door family,
  event-ready's checklist and Settings steps, the privacy lens and the press band, /me, the lab's prefetch); its
  red-team walking. The round's new boards follow in the night's final build. Vercel installs with pnpm 9.14.4.
- **The shared database** runs every migration through 2026-10-02, batch 10's seven last (the strike's lapse as a
  duration, the deleted events' index, the export Worker's reports, the host's cap on the album's read, a face moving
  the credits); no build of either project reads a dropped thing. The album-log prune runs nightly with the purge,
  its first production run green (2026-10-02 04:48Z: one row pruned over 58 albums).
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 8,700 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
- **Jobs:** the daily purge cron (Vercel Hobby fires it at 04:48 UTC; its first run on milestone 28's sweeps was green:
  every sweep ok, none stopped early, the orphan scan read 1,368 objects and deleted none, the standby budget's one host
  willg97 with the withdrawals out), the media-backup Worker and the daily DB-backup Action are live, and the export
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

- His desk (above); the calls file's 74 calls to overrule (his decisions A and B answered 2026-09-30, C, #60's reopen
  window, 2026-10-01); the phone checks and the walks only he can drive (`tracks/orchestrator.md`).
