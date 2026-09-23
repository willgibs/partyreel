# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-09-23

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: the loose ends, milestone 27, and the event-safety board

Will's message of 2026-09-23 (the plan: `~/.claude/plans/great-work-however-1-dapper-twilight.md`, its top section):
- **The rulings round's loose ends**, in two production lanes and a lab lane. First a live defect: a one-field event
  save (a QR style, the review switch) also reset visibility, pause, both door switches and moderation to their
  defaults, opening a password or private album and approving every held upload. Then the round's Now lines, the
  identity contract (dropping `allow_anonymous_uploads`), the Guests room showing a confirmed guest's address to the
  host alone (his ruling: "only the host sees it"), and one storage aggregate (`host_storage_summary`, applied).
- **Milestone 27** (his yes) after the lanes' alias red-team; the identity contract right after its pass; then a real
  TEST subscription on partyreel.com with his final clicks (Checkout, then the change-plan confirm page).
- **A block for bad actors** (his concept): the `event-safety` board on his three answers (a block puts the person out
  and removes their uploads; approve newcomers, close to newcomers and an invite list; all free on every plan).
- **The reel round** waits on his desk review: the rolling live composer and the video window reader are on the tree
  (harnesses `/design/lab/tools/reel-live` and `/design/lab/tools/reel-video`), six boards on the desk; its plan is
  the same file's reel section (the expand migration first, the drop migration after the red-team).

## The desk

25 standing boards at `/design/lab?key=` (a light guard, not a secret; the value is in `.env.local`), in leverage
order: `media-viewer`, `reel-view`, `reel-front`, `reel-screen`, `reel-cut`, `reel-host`, `reel-story`, `identity-door`,
`identity-claims`, `identity-profile`, `guest-capture`, `voice-guest`, `host-curation`, `host-storage`, `export-flow`,
`admin-triage`, `help-center`, `emails`, `site-chrome`, `profile-page`, `privacy-hero`, `album-motion`, `loose-ends`,
`contact-page`, `press-page`.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-26` (`df173c2e`); `admin.partyreel.com` is served by the
  `partyreel-admin` project (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel` (`=app`, so `/admin` is a 404 there).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves `9a5eac29`: save gone and a guest
  only by uploading, the storage guard, every standing board current, both engines (old reel live). No push
  deploys; each `[preview]` record gets one build by API ([`usher/kit/README.md`](../usher/kit/README.md)).
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

- **His desk review**: the six reel boards first; every standing board is current with the rulings of 2026-09-22.
- **The Stripe clicks** once milestone 27 is live: a test card and Subscribe on Stripe Checkout as willg97, then Back
  and Confirm on the change-plan confirm page (staged for him when he is ready).
