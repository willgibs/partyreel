# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-09-22

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: the reel, reconceived

The reel becomes the event's own live montage of everything the album shows (from the third item, no host action, no
stored file; the host's mood as the default and each viewer's own switch; a first-class venue screen), and a cut is
anyone's, made on their device (saved or shared as a file; "Add to the album" on a paid event). Video in the reel is a
window of the original fetched by range and decoded on the viewer's device. The plan:
`~/.claude/plans/great-work-however-1-dapper-twilight.md`.

- **On the tree:** the rolling live composer and the video window reader, with their harnesses at
  `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video` (a 20-minute soak on the alias held: no stall, the
  clock never backward, zero failures, the heap flat at 13 to 19 MB); six boards on the desk (the view, the album's head,
  the venue screen, the creator, the host's side, the marketing story).
- **Next:** his desk review of the six; then the wiring (the expand migration first; the old reel stays live on the
  alias until one build replaces it; the drop migration after the red-team).
- **Alongside:** the reshape (the docs carry rules, never history): four lanes, listed in
  [`tracks/orchestrator.md`](tracks/orchestrator.md).

## The desk

23 standing boards at `/design/lab?key=`, in leverage order: `media-viewer`, `reel-view`, `reel-front`, `reel-screen`,
`reel-cut`, `reel-host`, `reel-story`, `identity-door`, `identity-claims`, `identity-profile`, `guest-capture`,
`host-curation`, `export-flow`, `admin-triage`, `help-center`, `emails`, `site-chrome`, `profile-page`, `privacy-hero`,
`album-motion`, `loose-ends`, `contact-page`, `press-page`. Six asks on the older boards carry a badge naming the reel
round (`src/app/(dev)/design/sandbox/overtaken.ts`) until the boards are rechecked against it.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-26` (`df173c2e`); `admin.partyreel.com` is served by the
  `partyreel-admin` project (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel` (`=app`, so `/admin` is a 404 there).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves `c65d6ec1`: the six reel boards and
  both engines, with the old reel still live. No push deploys; each `[preview]` record gets one build by API
  ([`usher/kit/README.md`](../usher/kit/README.md) "Deploy to the alias").
- **Data:** disposable test data only; the accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md). The disposable events stay in the states the
  last red-teams left until Will says restore.
- **Tests:** about 3,870 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
- **Jobs:** the daily purge cron, the media-backup Worker and the daily DB-backup Action are live; the deletion-aware
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

- **His desk review**: the six reel boards first (each board's look-at-first is on its own page), the two harnesses,
  then the identity boards and the older standing boards.
- **The preview key's rotation**, his call, ideally after his review (a local dev log printed it into the Orchestrator's
  transcript on 2026-09-22; it is in no commit).
