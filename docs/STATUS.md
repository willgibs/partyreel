# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-09-25

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: batch 3, from Will's sitting on build 8

- **Milestone 28 is live** (`1076d3d7`, 2026-09-24): no read stops at 1,000 rows; a claimed guest ticket uploads only
  for its owner; a guest's own delete is final.
- **The reel stretch landed** (2026-09-25, overnight in auto mode): the live reel's guest and host sides, the clip
  creator (Make your own, Looks and Moments as tabs), the stored reel's server side gone, the reel retold across
  marketing, help and legal, and `docs/systems/reel.md` its home. The drop is applied and the stored files swept; until
  milestone 29 partyreel.com's host dashboard errors (milestone 28 reads the dropped `highlight_reels`).
- **Also landed**: the album fast at any size (windowed rows, a memoized tile, three density steps) and the paged
  album's data half (`album_state` and `album_changes`, links by id, a delta poll); a confirmed email changed at both
  addresses and deletion taking the address with it; four correctness fixes (the billing downgrade, the unlock
  cookie bound to the password, the orphan breaker's health, counts past 999); the door's new flow (his chooser, a
  keyboard-safe phone sheet); the host's album on the paged rows. Building: the guest's album onto them.

## The desk

22 boards at `/design/lab?key=`, in leverage order: `identity-door` (r2, the door's look), `reel-story` (r2),
`media-viewer` (r3), `identity-claims`, `identity-profile`, `guest-capture`, `voice-guest`, `host-curation`,
`host-storage`, `event-safety`, `export-flow`, `admin-triage`, `help-center`, `emails`, `site-chrome`, `profile-page`,
`privacy-hero`, `album-motion`, `loose-ends`, `contact-page`, `press-page`, then `album-columns` (answered; it retires
once the album's surfaces are wired).

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-28` (`1076d3d7`, 2026-09-24), both projects READY and passed: the
  guest poll serves the scale probe's 1,145 photos (1,000 at milestone 27) then 304, the dashboard (1,145 items, 20 to
  review), `/account`, a real upload through production's pipeline, the lab 404s without its key, the admin door
  redirects, no new runtime error or Sentry issue. `admin.partyreel.com` is served by `partyreel-admin`
  (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel` (`=app`).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 9 (the reel stretch, the
  album's engines, the identity and hardening lanes, and the three boards for his sitting). No push deploys; each
  `[preview]` record gets one build by API ([`usher/kit/README.md`](../usher/kit/README.md)).
- **Data:** disposable test data only; the accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md). The disposable events stay in the states the
  last red-teams left until Will says restore.
- **Tests:** about 5,300 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
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

- **His sitting on build 9**: `identity-door` r2 first, then `reel-story` r2 and `media-viewer` r3.
- **Milestone 29's yes** after build 10's red-team (it ends partyreel.com's dashboard error since the drop).
- **One dashboard minute**: Supabase's Change Email Address template gains `{{ .Token }}` (until then the change
  confirms by the link at both addresses).
- **A 10-second iPhone check** on the album: Save to Photos lands in Photos; a shared photo arrives as a photo.
