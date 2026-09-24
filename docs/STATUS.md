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

## The current round: closed at milestone 28; next, Will's desk review

- **Milestone 28 is live** (`1076d3d7`, 2026-09-24): no read stops at 1,000 rows (PostgREST's live `max_rows` is 1,000,
  write responses uncapped): every list reads whole (`readAllPages`), every count counts, every id list chunks, every
  set-returning RPC pages, every sweep reports what it left, legal hold is decided in one answer; `row-cap-policy.test.ts`
  and a Sentry tripwire keep it so. A claimed guest ticket uploads only for its signed-in owner, and a guest's own delete
  is final and reaches no host surface.
- **A block for bad actors** (his concept): the `event-safety` board on his three answers (a block puts the person out
  and removes their uploads; approve newcomers, close to newcomers and an invite list; all free on every plan).
- **The reel round** waits on his desk review: the rolling live composer and the video window reader are on the tree
  (harnesses `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`), six boards on the desk; its plan is
  `~/.claude/plans/great-work-however-1-dapper-twilight.md`'s reel section (the expand migration first, the drop after
  the red-team).

## The desk

26 standing boards at `/design/lab?key=` (a light guard, not a secret; the value is in `.env.local`), in leverage
order: `media-viewer`, `reel-view`, `reel-front`, `reel-screen`, `reel-cut`, `reel-host`, `reel-story`, `identity-door`,
`identity-claims`, `identity-profile`, `guest-capture`, `voice-guest`, `host-curation`, `host-storage`, `event-safety`, `export-flow`,
`admin-triage`, `help-center`, `emails`, `site-chrome`, `profile-page`, `privacy-hero`, `album-motion`, `loose-ends`,
`contact-page`, `press-page`.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-28` (`1076d3d7`, 2026-09-24), both projects READY and passed: the
  guest poll serves the scale probe's 1,145 photos (1,000 at milestone 27) then 304, the dashboard (1,145 items, 20 to
  review), `/account`, a real upload through production's pipeline, the lab 404s without its key, the admin door
  redirects, no new runtime error or Sentry issue. `admin.partyreel.com` is served by `partyreel-admin`
  (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel` (`=app`).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves `6e67494b` (build 4), red-teamed
  2026-09-24 in Will's Chrome: the scale probe whole for the host (1,145 on the card, the hub and Download all; Review's
  20 oldest; the bin's 30, no withdrawal) and for a guest (the poll 1,145 then 304); a kept ticket never credits the next
  account (a planted foreign ticket re-joined as the signer; signed-out presigns with confirmed tickets 403); a guest's
  own delete reads "deleted from the event right away and can't be recovered" and reaches no host surface. The admin
  portal's live look waits on Will's TOTP. No push deploys; each `[preview]` record gets one build by API
  ([`usher/kit/README.md`](../usher/kit/README.md)).
- **Data:** disposable test data only; the accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md). The disposable events stay in the states the
  last red-teams left until Will says restore.
- **Tests:** about 4,640 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
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

- **His desk review**: 26 boards; the six reel boards first, and the new `event-safety`.
- **A look at the admin portal** (it needs his TOTP): `/admin`, `/admin/metrics`, `/admin/jobs` and the scale probe's
  album under `/admin/albums`, now reading whole.
