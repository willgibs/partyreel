# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-10-06

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: round 15, milestone 39 forming

- **Milestone 38 is live** (`90ab891c2`, 2026-10-06 21:37Z; its merge commit says what it holds), red-teamed by 56 and
  56b (no HIGH or MEDIUM open); the legal text is rewritten once, right before launch.
- **Milestone 39 forms on `launch-prep`:** the second wave merged (crumbs-86's ten small things, halo-last's last four
  halos, marketing-crumbs' site brought to today's product, upload-sums' storage summed by the database, its migration
  live). It ships after the storage sums' signal lane (the Advisor's condition), red-team 57 and Will's yes
  (`tracks/orchestrator.md`).
- **The Orchestrator moves to Will's Mac** (a local seat, fresh weekly limit) from the cloud session on
  hi@willgibs.com's account, which wound down at its consolidation point; Drive's and the backup's Workers deploy from a
  seat holding the Cloudflare token.
- **Vercel's Hobby Active CPU** reads about 3.89 of 4 hours over 30 days (2026-10-06; the peak rolls off in early
  November): nothing of ours runs on Vercel but what Will asks for by name; desks and red-teams run locally (`CLAUDE.md`).

## The desk

Will's desk (`localhost:3000/design/lab?key=fiesta`; he refreshes it: `git pull && S=/tmp zsh usher/kit/desk-refresh.sh
<sha>`) holds brand r2's take, event-header r6 and desk 7's moments (a host's party, a guest's night, her account,
Create's last steps), all on the alias too; his review batch for them opens the next seat. Desk 6 next.

## Live state

- **Prod:** partyreel.com is `main` at milestone 38 (`90ab891c2`), both projects READY; its tag `milestone-38` waits on
  a push from Will's Mac (a cloud seat's git access refuses tag pushes). Its crons: the purge at 04:00 UTC and the
  spend watch at 05:00. Send to Google Drive reads "not set up" until its Worker deploys (`DRIVE_WORKER_URL` is set at
  that deploy).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves `bbfcc544` (2026-10-06 19:45Z), deployed
  once on Will's word for his desk review; no other deploy until he asks. Vercel installs with pnpm 9.14.4.
- **The shared database** runs every migration through `upload_sums` (2026-10-06), each by protocol (the Advisor read
  each before its apply, the file's md5 matched), each an expand the older build ran beside; no build of either project
  reads a dropped thing. Advisors stand at 27 / 4 / 36 ([`systems/database-security.md`](systems/database-security.md)).
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 13,300 green. The gate is local to each seat: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
- **Jobs:** the daily purge cron (Vercel Hobby fires it between 04:00 and 05:00 UTC; the album-log prune rides it), the
  spend watch daily at 05:00 UTC (hourly at launch), the media-backup Worker and the daily DB-backup Action are live, and
  the export Worker checks itself daily at 05:30 UTC (`/admin/jobs`); the deletion-aware backup prune runs dry
  (`PRUNE_MODE=live` is a launch flip); the backup's reconcile and restore (`RESTORE_MODE` dryrun) deploy with Drive's
  Worker from a seat holding the Cloudflare token.
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

- His desk review batch (the next seat's first prompt); milestone 39's yes after the storage sums' signal lane and
  red-team 57; the `milestone-38` tag from his Mac and the Cloudflare token for the Workers; the calls lab's open
  questions (X1 the develop time, X2 a Vercel token for the limits watch, X3 a Cloudflare analytics token, X5 the
  CDN-cached album, X6 the operator's uploads credit, X8 the policy tests' style picks) and the calls built for him to
  overrule; the two backup copies with old EXIF to delete and the six retired Stripe price names to drop; Vercel Pro or
  the window; the walks only he can drive (`tracks/orchestrator.md`).
