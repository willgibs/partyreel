# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-10-07 19:45Z

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: round 15, milestone 40 live, desk 9 waiting on Will

- **Milestone 40 is live** (`f1dfc6349`, 2026-10-08 07:40Z, tagged; its merge commit says what it holds): desk 8 wired
  (Create's payoff, no signal at a party, the Guests room, the brand's final marks), an album turning at her close, and
  an open album's version at the CDN (MISS, then HIT, on partyreel.com). Red-teamed by 58 and 58b (nothing above NIT
  open); the kit's screens retaken from partyreel.com. `launch-prep` equals `main`; the next round forms there.
- **Desk 9 waits on Will** (2026-10-08): the event-page board (the event page from the ground up, six whole designs, sky
  recommended) and brand-marks r2's icon. crumbs-94 closed red-team 58b's four NITs and the compute model's clock
  (gate 90). The Orchestrator sits on Will's Mac; its lanes run in local worktrees, paced by the 5-hour window and the
  week.
- **Vercel stays on Hobby** (Will, 2026-10-07): about 3.86 of 4 CPU-hours over 30 days, under the REFUSE line around
  2026-10-16; nothing of ours runs on Vercel but what Will asks for by name (`CLAUDE.md`).

## The desk

Will's desk (`localhost:3000/design/lab?key=fiesta`; refreshed by `S=<scratch> zsh usher/kit/desk-refresh.sh <sha>`)
answered desk 8 on 2026-10-07 (`docs/reviews/batches/2026-10-07-b0eb89bc9.txt`): brand-marks, signature, presence,
after-party, no-signal, guests-room, account-moments r2 and create-wizard r5, three asks unclear (atmosphere, recap,
card), now the event-page board's. It serves `ae16365c3`, milestone 40's code: event-page r1 (desk 4) opens first,
brand-marks r2's icon beside it; the Calls place holds 16 entries.

## Live state

- **Prod:** partyreel.com is `main` at milestone 40 (`f1dfc6349`, tagged `milestone-40`), both projects READY. Its
  crons: the purge at 04:00 UTC and the spend watch at 05:00. Drive's Worker (`partyreel-drive`, version `96513f29`)
  leases from partyreel.com every 15 minutes; `DRIVE_WORKER_URL` is set on production; Will's Drive walk is next.
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves `bbfcc544` (2026-10-06 19:45Z), deployed
  once on Will's word for his desk review; no other deploy until he asks. Vercel installs with pnpm 9.14.4.
- **The shared database** runs every migration through `crumbs_93` (2026-10-08, applied as 20261008050912), each by protocol (the
  Advisor's read, the file's md5 matched), each an expand the older build ran beside; no build reads a dropped thing.
  Advisors stand at 29 / 4 / 36 ([`systems/database-security.md`](systems/database-security.md)).
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 13,300 green. The gate is local to each seat: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
- **Jobs:** the daily purge cron (Vercel Hobby fires it between 04:00 and 05:00 UTC; the album-log prune rides it),
  the spend watch daily at 05:00 UTC (hourly at launch), the media-backup Worker and the daily DB-backup Action are
  live, and the export Worker checks itself daily at 05:30 UTC (`/admin/jobs`); the deletion-aware backup prune runs
  dry (`PRUNE_MODE=live` is a launch flip); the backup Worker's reconcile and restore (`RESTORE_MODE` dryrun) deployed
  2026-10-07 and read Needs a look until Will's two EXIF copies go; `BACKUP_WORKER_URL` is live with milestone 39's
  admin deploy.
- **The repo is public for the interim** (GitHub Actions minutes); private again when the budget clears.

## Infrastructure

Every backing service runs under the owner account **partyr33l@gmail.com ("P3")**: **Supabase** `ddafaemglzmuekbtjwzn`
(Pro, daily backups, the public `avatars` bucket); **Cloudflare R2** `8bd90d2f6a374d6cdff2f379e929b060`, buckets
`partyreel` and `partyreel-backup`; **Stripe** `acct_1TcStrPtjqmVkBwk` (TEST; the live cutover is a launch task);
**Sentry** org `partyreel`; **Resend** (`partyreel.com` verified; auth email rides Resend SMTP); **Google OAuth** one P3
project for sign-in and Drive (Drive's `drive.file` asked only at a host's first send, never at sign-up); the in-app
operator `partyr33l@gmail.com` (`is_admin` and TOTP MFA); **Vercel** on the P3 team (two projects on one repo,
`partyreel` and `partyreel-admin`; Hobby; the Pro cutover, DNS to Cloudflare and the repo transfer are launch cutovers).
"Allow new signups" is off until launch (his choice: the product changes freely); anonymous sign-ins off. Configured once,
never redone: the R2 buckets, credentials, CORS and the abort-multipart rule; the apex domain; `CRON_SECRET`;
`profiles.is_admin`; the Stripe TEST products, prices, webhook, Billing Portal and their env values; Supabase TOTP MFA
with the admin callback in the redirect allow-list (break-glass: delete the factor in `auth.mfa_factors`); the Sentry
project and its env; the backup Worker and Action secrets; the prune crons and `PRUNE_API_SECRET`.

## Waiting on Will

- His Drive walk on partyreel.com (P3's consent; drive-crumbs' Handoff lists what to press); the calls lab's (the
  desk's Calls place) open questions (X1 the develop time, X2 a Vercel token for the limits watch, X3 a Cloudflare
  analytics token, X5 the CDN-cached album, X6 the operator's uploads credit, X9 to X17 the gap audit's product
  decisions) and its 15 built calls he cannot see by using the product; the two backup copies with old EXIF to delete
  and the six retired Stripe price names to drop; the walks only he can drive (`tracks/orchestrator.md`).
