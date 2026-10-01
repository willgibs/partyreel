# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-09-30

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
- **Batch 9 rides `launch-prep`**: crumbs-28 and hide-strikes (his call B: three strikes that lapse after 180 days)
  red-teamed on build 33; crumbs-29 (a shared phone's one row, no door admitting a blocked ask; its three migrations
  applied), crumbs-30, crumbs-31 (the follow moment after a keep through Google), crumbs-32 and demo-stall (the lab
  check's stall, a Next dev bug, upstream's fix carried as a pnpm patch) on build 34, red-teamed PASS.
  `crumbs-34` (every published claim made true; Sentry quiet off Vercel) and `crumbs-33` (a report's live strikes on
  the queue, the newsletter row with an email change, four correctness fixes; its two migrations applied) are
  merged; `crumbs-35` (build 34's red-team finds) and `crumbs-36` (five deferred lines) run. App work leads (his note); the wiring of each board follows
  his picks.

## The desk

Six boards, made true of production on build 31 (a re-read of every claim they make): `locked-door` r2 (four asks),
`event-ready` r1 (five), `privacy-hero` r4 (one: which veil), `disposable-mode` r2 (eight), `demo-framing` r2 (three)
and `about-press` r1 (two), in that order.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-31` (`7bd3b947`, 2026-09-30), both projects READY: its pages
  load, a stale guest link and an unknown profile draw their own screens (200, noindex), the lab and `/admin` 404 on the
  apex, the admin door redirects; the signed-in walk PASS (the dashboard, a hub's rooms and trail, Settings' rows and
  back arrow and the browser's Back, the door page, the Guests room, the demo's viewer; no console error).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 34 (`65dbedb2`): milestone 31
  plus batch 9's seven lanes, red-teamed PASS (its small finds in `crumbs-35`); the desk is the same six boards (no board moved since build 31).
  Vercel installs with pnpm 9.14.4, `package.json`'s `packageManager`.
- **The shared database** runs every migration applied through 2026-10-01: schema-pass part 2 (the reel's three
  dormant media columns dropped once milestone 31 shipped), the instant hide's three strikes, and crumbs-33's two last
  (`report_strikes`, the strike rule's one home; the newsletter row moving with an email change); no build of either
  project reads a dropped thing.
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

- His desk (above); the calls file's 58 calls to overrule, his review on 2026-10-01 (his two decisions answered
  2026-09-30); the phone checks and the four walks only he can drive (`tracks/orchestrator.md`).
