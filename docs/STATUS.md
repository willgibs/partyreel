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
  wait in their ledgers. The lab is one self-registering folder per board (lab-revamp stage two).

## The desk

Build 25's desk: `locked-door` r2 (four asks: the door family's direction first), `disposable-mode` r2 (eight: the camera
first) and `event-ready` r1 (five), every ask with its context. Build 26 adds `demo-framing` r2 (three: the demo's
address in a host's own words, its stage beside the stream, the hero's touch) and `about-press` r1 (two: the press kit
on /about and its facts); the two older asks retired into them as carried calls.

## Live state

- **Prod:** partyreel.com is `main` at tag `milestone-30` (`7846a4c9`, 2026-09-29), both projects READY: sixteen
  public pages and both sign-in pages with no exception, `/pricing` at 100 MB, the lab and `/admin/reels` 404, the admin
  door redirects; the signed-in pass PASS (the renew return, the hub past 1,000, the list always on, the look's
  Block, Settings whole, the reel, the owner's password album, the slug refusal). `admin.partyreel.com` is served by `partyreel-admin`
  (`NEXT_PUBLIC_SURFACE=admin`) and the apex by `partyreel` (`=app`).
- **The alias** (`https://partyreel-git-launch-prep-partyreel.vercel.app`) serves build 25 (`c038e4eb`), red-teamed live
  23 of 23 (Settings whole, the doors, triage, the contact note, the FAQ and the egg, the desk); its finds are
  `crumbs-19`'s. Build 26 follows menu-depth's merge.
- **The shared database** runs eleven migrations applied 2026-09-29 (the block, the free shift, the operator removal
  purge, the help's feedback, the pass reminders switch, likes on private albums, the slug family, the doors, the triage
  rebuild, the invite list's admit, and schema-pass part 1: six unused columns and their indexes dropped, `anon`'s table
  access and the client roles' default grants closed, three length checks). partyreel.com's milestone-30 build was
  walked signed in after part 1, 5 of 5; part 2 (the contract) applies after milestone 31 ships.
- **Data:** every event, media item and account is test data, free to change, reset or delete (Will, 2026-09-25);
  signups stay off until launch, so nothing real arrives. The accounts and fixtures are in
  [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** about 7,250 green. The gate is local: typecheck, lint, test, build, `lab:smoke`, `lab:demo`.
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

- His desk (above); Q1, Measure a phone, the real-upload check and the iPhone check in the morning on his phone; the
  calls file's 34 calls and its two decisions, the proof mail and the instant-hide bar (`tracks/orchestrator.md`).
