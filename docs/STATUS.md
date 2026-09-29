# Partyreel — Status (you are here)

> ROLE: what is true right now, rewritten in place. The rules are [`PROGRAM.md`](PROGRAM.md); how each system works is
> [`systems/`](systems); what might be next is [`ROADMAP.md`](ROADMAP.md); what runs this minute is
> [`tracks/orchestrator.md`](tracks/orchestrator.md); what shipped is `git log`.

**Updated:** 2026-09-29

## The era

Pre-launch continuous elevation. The product is built and live at partyreel.com with zero real users, Stripe in TEST mode
and the launch switches unspent ([`ROADMAP.md`](ROADMAP.md) → Launch checkpoint). Work rides `launch-prep` in rounds: a
catalog in the lab, Will's verdicts on the desk, then the wiring; partyreel.com changes only at tagged milestone merges.
Nothing is protected: every page, the host app and the guest pages are open to be reconceived from the ground up.

## The current round: batch 8, from the desk at zero

- **Milestone 30 is live** (`7846a4c9`, 2026-09-29): batch 7 whole. Batch 8 rides `launch-prep` toward milestone 31.
  The legal text is rewritten once, right before launch (his word).
- **Batch 7 landed whole** (builds 16 to 19, red-teamed live): the block, the free/pro shift, the guest voice, the
  hero's card, the export flow, triage's round one, the help and the emails' wrapper, and their follow-ups.
- **Will's sitting on build 19** is transcribed (2026-09-29: 41 answers on ten boards, the desk whole). Wave A wires
  every event-settings pick (settings rebuilt as four sentences, the doors Public, Private and Only me with approval,
  closing and an invite list, the Guests room's invites) and draws two rounds, the door family and the disposable
  camera; `crumbs-12` fixes the hub row and the thin headings. App work leads (his note); the marketing and admin picks
  wait in their ledgers.

## The desk

Build 21's desk: `locked-door` r2 (four asks: the door family's direction first) and `disposable-mode` r2 (eight: the
camera first). Two older asks wait on the rounds that replace their boards (demo-framing's `names`, press-page's
`a-human`).

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-30` (`7846a4c9`, 2026-09-29), both projects READY: sixteen
  public pages and both sign-in pages with no exception, `/pricing` at 100 MB, the lab and `/admin/reels` 404, the admin
  door redirects; the signed-in pass PASS (the renew return, the hub past 1,000, the list always on, the look's
  Block, Settings whole, the reel, the owner's password album, the slug refusal). `admin.partyreel.com` is served by `partyreel-admin`
  (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel` (`=app`).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 21: the two rounds for his desk
  and `crumbs-12` (the hub row in his order, every heading at 700, "30 days"); build 20 was red-teamed live, every
  journey PASS.
- **The shared database** runs seven migrations applied 2026-09-29 (the block, the free shift, the operator removal purge,
  the help's feedback, the pass reminders switch, likes on private albums, the slug family), which partyreel.com's milestone-30 build now
  matches; no Free account holds more than 100 MB.
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 6,000 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
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

- The hold's redesign and the child-abuse report's instant hide are decided (`triage-r2-wiring`); Q1, the real-upload check and the iPhone check are his in the
  morning on his phone (`tracks/orchestrator.md`). The claims walk is the Orchestrator's to stage (his word).
