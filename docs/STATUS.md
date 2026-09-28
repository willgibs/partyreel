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

## The current round: batch 6 whole, the desk to zero

- **Milestone 29 is live** (`ab30a7f8`, 2026-09-26). Batches 4 to 6 ride `launch-prep` toward milestone 30.
- **Will's sitting on build 12, part one** is transcribed (2026-09-28, 20 answers). An audit found 30 of the other
  boards' 68 asks drawn before his recent picks were built, and 5 already answered.
- **Batch 6's wave 1 landed whole** (eight lanes, gates green): hero-card, voice-guest and host-storage in their second
  rounds; event-safety, admin-triage, export-flow, emails, help-center, contact-page, album-motion, loose-ends and
  press-page redrawn on production as it stands; site-chrome and profile-page retired as answered.
- **Wave 2 landed whole** (build 14): his curation picks in the review room (Reject, the peek's verdict, the keys,
  Undo, the "N new" line), the pointer's one line, the voice lines and small fixes, and the storage list with its
  goal strip and inline refusal; identity-claims and host-curation retired. Build 14's red-team findings are fixed
  (`crumbs-7`: a toast's Undo over an open modal, the peek's keys, the "N new" pill).

## The desk

Build 13's desk: 71 open asks on 13 boards, in desk order `hero-card` r2 (the card, then its light and the tablet),
`voice-guest` r2, `host-storage` r2, `event-safety`, `export-flow`, `admin-triage`, `help-center`, `emails`,
`privacy-hero`, `album-motion`, `loose-ends`, `contact-page`, `press-page`. His aim is zero before his other to-dos.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-29` (`ab30a7f8`, 2026-09-26), both projects READY and passed:
  the scale probe's guest poll answers the paged manifest whole (1,145) then a 304, the dashboard and the probe's hub
  (1,145 items, 20 to review) as willg97, his own password album with `?reel` and `?reel=screen` and its Download all
  (1 photo) while a signed-out viewer meets the password door, eleven public pages and both sign-in pages with no
  console error, the lab and `/admin/reels` 404, the admin door redirects, no runtime error.
  `admin.partyreel.com` is served by `partyreel-admin` (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel`
  (`=app`).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 14 (`1b26221c`): batch 6
  whole, the desk `hero-card` r2 first; every desk page loads with no console error (14 pages, headless) and the four
  retired boards answer 404. Its red-team passed every signed-out journey; the host and admin pass waits on Will's
  Chrome (walked on the Library's specimens meanwhile), and its findings are in `crumbs-7`.
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
