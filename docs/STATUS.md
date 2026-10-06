# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-10-06

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: round 15, toward milestone 38

- **Milestone 37 is live** (`b67cdc1f2`, 2026-10-05 16:25Z); the legal text is rewritten once, right before launch.
- **`launch-prep` holds milestone 38**: the album turning at one moment for every guest (the party's zone), its Sort,
  Filter and arrivals pill; a photo's capture time kept, never the place or device; Will's house set and working words;
  the hub's doors as cards; Settings' roll; Back a layer at a time; the dashboard's chooser; the pass credit's integrity
  and stuck watch; the backup restoring and reconciling again; Drive's fixes and hardening; the lab's frames held still.
- **Red-team 56** walked it (no HIGH, one MEDIUM, small findings) and crumbs-85 fixed them; billing-orphans and
  drive-crumbs land the last of milestone 38's work once their SQL is approved, red-team 56b re-walks, then milestone 38
  on Will's yes, where Drive's Worker and the `partyreel-backup` Worker deploy (`tracks/orchestrator.md`, Next).
- **The Orchestrator sits in a claude.ai cloud session** (2026-10-06); each lane is a cloud session of its own.
- **Vercel's Hobby Active CPU** reads about 3.89 of 4 hours over 30 days (2026-10-06; the peak rolls off in early
  November): nothing of ours runs on Vercel but what Will asks for by name; desks and red-teams run locally (`CLAUDE.md`).

## The desk

Desk 5 is answered (identity r5: the house set and working words; event-header r5: no pick, with his note). Will's
desk (`localhost:3000/design/lab?key=fiesta`; he refreshes it: `git pull && S=/tmp zsh usher/kit/desk-refresh.sh <sha>`)
holds brand r2's take (Afterglow's light on paper) and, at the next refresh, event-header r6 (the cards' badges, then
the colour of what needs her) and guest-moments r1 (a guest's night, five asks). Then desk 6, the brand applied.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-37` (`b67cdc1f2`), both projects READY. Its crons: the purge at
  04:00 UTC and the spend watch at 05:00. Send to Google Drive reads "not set up" there until its Worker deploys with
  milestone 38 (production holds Drive's four secrets; `DRIVE_WORKER_URL` is set at the deploy).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 53 (`31a73a46`, 2026-10-04),
  idle under the CPU limit. Vercel installs with pnpm 9.14.4, `package.json`'s `packageManager`.
- **The shared database** runs every migration through `event_zone` (2026-10-06), each by protocol (the Advisor read
  each before its apply, the file's md5 matched), each an expand milestone 37 runs beside; no build of either project
  reads a dropped thing. Advisors stand at 26 / 4 / 36 ([`systems/database-security.md`](systems/database-security.md)).
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 13,200 green. The gate is local to each seat: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
- **Jobs:** the daily purge cron (Vercel Hobby fires it between 04:00 and 05:00 UTC; the album-log prune rides it), the
  spend watch daily at 05:00 UTC (hourly at launch), the media-backup Worker and the daily DB-backup Action are live, and
  the export Worker checks itself daily at 05:30 UTC (`/admin/jobs`); the deletion-aware backup prune runs dry
  (`PRUNE_MODE=live` is a launch flip); the backup's reconcile and restore (`RESTORE_MODE` dryrun) deploy at milestone 38.
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

- His desk (brand r2's take; event-header r6 at the next refresh); a browser for cloud walks (red-team 56b waits on it);
  milestone 38's yes after its last lanes and red-team 56b; the calls lab's open questions (X1 the develop time, X2 a
  Vercel token for the limits watch, X3 a Cloudflare analytics token, X5 the CDN-cached album, X6 the operator's uploads
  credit, X8 the policy tests' style picks) and the calls built for him to overrule; a Cloudflare token in the cloud
  environment if the Workers should deploy from there; the two backup copies with old EXIF to delete and the six retired
  Stripe price names to drop; Vercel Pro or the window; the walks only he can drive (`tracks/orchestrator.md`).
