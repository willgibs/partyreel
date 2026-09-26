# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-09-26

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: after milestone 29, Will's sitting on build 10

- **Milestone 29 is live** (`ab30a7f8`, 2026-09-26), batch 3 whole: the live reel in place of the stored one (its
  schema dropped, its files swept), every album paged and windowed on both surfaces, Will's door on the phone Sheet,
  an email change confirmed at both addresses, one-tap Save on an iPhone; 49 lanes since milestone 28, and
  `launch-prep` equals `main`.
- **Next**: his verdicts on build 10's desk become lanes (`reel-marketing`, the door's look, the mark's wiring), then
  the lab revamp ([`tracks/orchestrator.md`](tracks/orchestrator.md)).

## The desk

21 boards at `/design/lab?key=`, in leverage order: `identity-door` (r2, the door's look), `reel-story` (r2),
`media-viewer` (r3), `identity-claims`, `identity-profile`, `guest-capture`, `voice-guest`, `host-curation`,
`host-storage`, `event-safety`, `export-flow`, `admin-triage`, `help-center`, `emails`, `site-chrome`, `profile-page`,
`privacy-hero`, `album-motion`, `loose-ends`, `contact-page`, `press-page`.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-29` (`ab30a7f8`, 2026-09-26), both projects READY and passed:
  the scale probe's guest poll answers the paged manifest whole (1,145) then a 304, the dashboard and the probe's hub
  (1,145 items, 20 to review) as willg97, his own password album with `?reel` and `?reel=screen` and its Download all
  (1 photo) while a signed-out viewer meets the password door, eleven public pages and both sign-in pages with no
  console error, the lab and `/admin/reels` 404, the admin door redirects, no runtime error.
  `admin.partyreel.com` is served by `partyreel-admin` (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel`
  (`=app`).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 10 (`43b82591`), the desk for
  his sitting; everything past it shipped in milestone 29, so the next build carries his verdicts' lanes. No push
  deploys; each `[preview]` record gets one build by API ([`usher/kit/README.md`](../usher/kit/README.md)).
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 5,460 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
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

- **His sitting on build 10**: `identity-door` r2 first, then `reel-story` r2 and `media-viewer` r3.
- **A 10-second iPhone check, now on partyreel.com** (milestone 29 carries it): in an album (`partyreel.com/demo`), one
  tap on Save opens the system sheet (a photo, a video, a finished clip), and a shared photo arrives as a photograph.
