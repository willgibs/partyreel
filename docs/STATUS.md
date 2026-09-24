# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-09-24

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: Will's desk review, batch 1 wired and the desk re-cut

- **Milestone 28 is live** (`1076d3d7`, 2026-09-24): no read stops at 1,000 rows (every list reads whole, every count
  counts, every id list chunks, every set-returning RPC pages, every sweep reports what it left; `row-cap-policy.test.ts`
  and a Sentry tripwire keep it so); a claimed guest ticket uploads only for its owner; a guest's own delete is final.
- **A block for bad actors**: the `event-safety` board (a block puts the person out
  and removes their uploads; approve newcomers, close to newcomers and an invite list; all free on every plan).
- **Desk review batch 1** (2026-09-24): `media-viewer`, `reel-view` and `reel-front` answered, `reel-screen` stopped on
  two repeats; the reel's view is also the wall. Wiring: the media viewer and the reel's guest side (held unmerged until
  the cut and host lanes, so one alias build replaces the stored reel); the desk re-cut (repeats
  become one question, every option kept), with the rounds he asked for; the plan is the plan file's head.
- **The lean round**: the boot-time docs sharpened (a lane reads
  about 1,800 words at boot, from 5,400), the bible to ten principles, the Library to the brand kit, the catalog and
  the ten with the look tests gone, the system docs cut to how the systems work and their gotchas, and a root `kit/`
  brand kit Will can copy for outside agents.
- **Since milestone 28 (`clocks-and-counts`):** counts grouped, chart ticks that fit, the admin's times in UTC, one Link
  visits figure, the host's dashboard on the viewer's own day (`x-vercel-ip-timezone`), the backup's CLI pinned.

## The desk

27 standing boards at `/design/lab?key=`, in leverage order: `album-columns`, `reel-screen`, `reel-host`, `reel-cut`, `reel-story`, `reel-front` (r2), `media-viewer` (r2), `reel-view`, `identity-door`,
`identity-claims`, `identity-profile`, `guest-capture`, `voice-guest`, `host-curation`, `host-storage`, `event-safety`, `export-flow`,
`admin-triage`, `help-center`, `emails`, `site-chrome`, `profile-page`, `privacy-hero`, `album-motion`, `loose-ends`,
`contact-page`, `press-page`.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-28` (`1076d3d7`, 2026-09-24), both projects READY and passed: the
  guest poll serves the scale probe's 1,145 photos (1,000 at milestone 27) then 304, the dashboard (1,145 items, 20 to
  review), `/account`, a real upload through production's pipeline, the lab 404s without its key, the admin door
  redirects, no new runtime error or Sentry issue. `admin.partyreel.com` is served by `partyreel-admin`
  (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel` (`=app`).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves `3e4261f5` (build 5, 2026-09-24):
  batch 1's re-cut desk and the media viewer, checked live in Will's Chrome (it grows from its tile, the face credit,
  the capsule, the peek and the desk filmstrip, the arrows, `?photo=`, a blank tap closes; every re-cut board loads with
  no console error). The stored reel stays until the reel round's own build. No push deploys; each `[preview]` record
  gets one build by API ([`usher/kit/README.md`](../usher/kit/README.md)).
- **Data:** disposable test data only; the accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md). The disposable events stay in the states the
  last red-teams left until Will says restore.
- **Tests:** about 4,780 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
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
cutovers). "Allow new signups" stays on; anonymous sign-ins stay off. Configured once, never redone: the R2 buckets,
credentials, CORS and the abort-multipart rule; the apex domain; `CRON_SECRET`; `profiles.is_admin`; the Stripe TEST
products, prices, webhook, Billing Portal and their env values; Supabase TOTP MFA with the admin callback in the redirect
allow-list (break-glass: delete the factor in `auth.mfa_factors`); the Sentry project and its env; the backup Worker
and Action secrets; the prune crons and `PRUNE_API_SECRET`.

## Waiting on Will

- **His desk review**, on the refreshed boards once the refresh wave lands (it supersedes build 5's), `album-columns` first.
- **A 10-second iPhone check** on build 5's album: Save to Photos lands in Photos; a shared photo arrives as a photo.
