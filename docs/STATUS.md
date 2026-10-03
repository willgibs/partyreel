# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-10-03

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: round 13, from his desk on build 45

- **Milestone 34 is live** (`2aae7331`, 2026-10-03): round 12 whole (the album's cover and the shutter, the dashboard
  reconceived, the door as the first byte with its walk-through, disposable albums with the camera and the develop,
  Save immediate, leaving made clear), red-teamed on builds 43 to 45. The legal text is rewritten once, right before
  launch (his word).
- **Round 13 runs on `launch-prep`** from his answers of 2026-10-03 (25 on seven boards): the wirings of identity's
  voice, layers and status, the one waiting experience, taking photos home (with a phone-size copy of every photo), the
  rooms over the hub with See it as a guest, and Create as the room; event date ranges; a cost model of every vendor;
  and six boards' next rounds.

## The desk

Empty until round 13's boards land: identity r3 (actions and fields as one system), host-dashboard r3, the-wait r2
(the arrival), event-header r3 (facts and doors), create-wizard r3 (the add step) and demo-framing r5 (the hero).

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-34` (`2aae7331`, 2026-10-03 07:50Z: round 12 whole), both
  projects READY; the read-only walk PASS (the home, pricing, how it works, help, login, a dead link's soft 404, the
  lab hidden; no console error or exception).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 45 (`dc74034c`, 2026-10-03 04:30Z):
  round 12 whole, red-team 44's findings fixed, the deletion made clear, and the seven boards; red-team 45 found no
  MEDIUM (a LOW and two NITs on the ROADMAP).
  Vercel installs with pnpm 9.14.4, `package.json`'s `packageManager`.
- **The shared database** runs every migration through 2026-10-03: `disposable_foundation` (20261002223236: the
  develop and the camera's roll, applied by protocol after the Advisor's Q10), then a column comment on
  `profiles.deletion_requested_at` (20261003030842); no build of either project reads a dropped thing. The album-log prune runs nightly with the purge,
  its first production run green (2026-10-02 04:48Z: one row pruned over 58 albums).
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 9,550 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
- **Jobs:** the daily purge cron (Vercel Hobby fires it anywhere between 04:00 and 05:00 UTC, seen at 04:48; its first run on milestone 28's sweeps was green:
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

- His next desk (round 13's boards, on build 47); the calls file to overrule (tonight's 91 to 115 beside the earlier
  ones); the cost model's levers to decide; the walks only he can drive (`tracks/orchestrator.md`): the camera on his
  iPhone, Record Video's size, a deletion and its Cancel deletion on hi@willgibs.com, a password door, reduced motion
  over the doors, Save into Photos at phone size.
