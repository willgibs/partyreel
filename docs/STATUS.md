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

## The current round: round 12, built from his desk on build 41

- **Milestone 33 is live** (`f210dfaf`, 2026-10-02): batch 10 and round 11 whole (the doorway, event-ready's checklist and
  Settings steps, the privacy lens and the press band, every download ending, the strip's last leaks), red-teamed on
  build 40 and proven on build 42. The legal text is rewritten once, right before launch (his word).
- **Round 12 runs on `launch-prep`** from his answers of 2026-10-02 (20 on seven boards): the wirings of the heads (the
  cover, the shared hub, the shutter), the dashboard (the stage, this week, the live wall, seasons) and disposable mode's
  server, then the door's walk-through, the camera and its rooms; and the lab's second layer.

## The desk

Empty until round 12's boards land: identity r2 (viewfinder atom by atom, its voice first), host-dashboard r2,
event-header r2, create-wizard r2 (the room's flow) and demo-framing r4 (the hero's stage), in that desk order.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-33` (`f210dfaf`, 2026-10-02 19:40Z), both projects READY; the
  read-only walk PASS (the pages, a German browser's dates, /press to /about#press, the demo's door, a dead link's soft
  404, the dashboard and a hub's checklist head signed in); the admin portal waits on partyr33l's session.
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 44 (`ece3f8a1`, 2026-10-03
  01:35Z): round 12's production whole (the door first, the walk-through, the album's camera, both of red-team 43's
  MEDIUMs fixed) and its seven boards; its red-team is walking.
  Vercel installs with pnpm 9.14.4, `package.json`'s `packageManager`.
- **The shared database** runs every migration through 2026-10-02, `disposable_foundation` last (20261002223236: the
  develop and the camera's roll, applied by protocol after the Advisor's Q10); no build of either project reads a
  dropped thing. Until milestone 34, a sealed TEST album stays readable through partyreel.com's older app-side reads. The album-log prune runs nightly with the purge,
  its first production run green (2026-10-02 04:48Z: one row pruned over 58 albums).
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 8,900 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
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

- His desk (above, once round 12's boards land); the calls file's 90 calls to overrule (his decisions A and B answered 2026-09-30, C, #60's reopen
  window, 2026-10-01); the phone checks and the walks only he can drive (`tracks/orchestrator.md`).
