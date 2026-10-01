# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-10-01

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: batch 9, from the desk

- **Milestone 31 is live** (`7bd3b947`, 2026-09-30): batch 8 whole, 40 lanes, red-teamed live through build 30 and its
  one MEDIUM (a stale guest link's own screen) fixed and proven before the merge: event settings rebuilt around the
  door (Public, Private with its gates, Only me, an invite list, the Videos switch), a shared phone that keeps each
  guest's photos her own, the reports queue rebuilt, the hub's rooms and live album, lighter pages, the lab rebuilt.
  The legal text is rewritten once, right before launch (his word).
- **Batch 9 rides `launch-prep`**: crumbs-28 to crumbs-40, hide-strikes (his call B) and demo-stall, every migration
  applied; builds 33 to 36 red-teamed, build 36's one MEDIUM fixed by `crumbs-45` (merged). Milestone 32 ships it once
  build 37 proves the fix on the alias (his yes, 2026-10-01). Handed off and merging after it: `crumbs-41` (admin, data
  and billing, his call #60 among them), `crumbs-42` (the host app) and `crumbs-43` (guests); `strip-gaps` and
  `export-ends` run. App work leads (his note); the wiring of each board follows his picks.

## The desk

Six boards, made true of production on build 31 (a re-read of every claim they make): `locked-door` r2 (four asks),
`event-ready` r1 (five), `privacy-hero` r4 (one: which veil), `disposable-mode` r2 (eight), `demo-framing` r2 (three)
and `about-press` r1 (two), in that order.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-31` (`7bd3b947`, 2026-09-30), both projects READY: its pages
  load, a stale guest link and an unknown profile draw their own screens (200, noindex), the lab and `/admin` 404 on the
  apex, the admin door redirects; the signed-in walk PASS (the dashboard, a hub's rooms and trail, Settings' rows and
  back arrow and the browser's Back, the door page, the Guests room, the demo's viewer; no console error).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 36 (`eb38b6be`, 2026-10-01
  19:00Z): build 35 plus crumbs-36 to crumbs-40, its red-team walking; the desk is the same six boards (no board moved
  since build 31). Vercel installs with pnpm 9.14.4, `package.json`'s `packageManager`.
- **The shared database** runs every migration applied through 2026-10-01, crumbs-37's and crumbs-38's four last (the
  album log's watermarks and its prune, `media_removed_idx`, the feeds' cursor, the told news); no build of either
  project reads a dropped thing. The album-log prune runs nightly once milestone 32 ships; until then only a hand-run
  of build 36's purge on the alias runs it.
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 7,900 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
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

- His desk (above); the calls file's 64 calls to overrule (his decisions A and B answered 2026-09-30, C, #60's reopen
  window, 2026-10-01); the phone checks and the walks only he can drive (`tracks/orchestrator.md`).
