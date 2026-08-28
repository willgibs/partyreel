# Partyreel — Status (you-are-here)

> ROLE: the live snapshot — what's true right now, where the program stands, what's blocked on Will.
> BELONGS HERE: the era statement, the round-status table, live/deployed state, infrastructure, Will's
> open decision queue. · NOT HERE: the program's rules/definitions (→ [`PROGRAM.md`](PROGRAM.md)),
> shipped history (→ [`CHANGELOG.md`](CHANGELOG.md)), how systems work (→ [`systems/`](systems)),
> what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place + prune (a snapshot — keep it short and current).

**Updated:** 2026-08-27

## The era

Partyreel is in **pre-launch continuous elevation**: the full product is built and live at
**partyreel.com** with **zero real users**, **Stripe in TEST mode**, and the launch switches deliberately
unspent (they accrete in [`ROADMAP.md`](ROADMAP.md) → Launch checkpoint and never flip mid-program).
The **elevation program** ([`PROGRAM.md`](PROGRAM.md)) is the only active thread: work rides the
`launch-prep` integration branch, verified between milestones on the preview alias
`https://partyreel-git-launch-prep-partyreel.vercel.app` (allow-listed in Supabase/R2/Stripe-TEST like
prod); partyreel.com changes only at tagged milestone merges. Every session is an **Agent** unless Will
designates it **the Orchestrator** — see CLAUDE.md "Sessions & roles" + PROGRAM.md before touching
anything shared.

## Where the program stands

| Round ([definitions](PROGRAM.md)) | Status |
| --- | --- |
| R0 bootstrap + EXIF hotfix | ✅ milestone-0 (2026-07-03) |
| R1 Decision Studio / T1 rulings | ✅ 2026-07-05 (ADR-0019…0022) |
| R2 Reel Engine + Foundation | ✅ milestone-1 (2026-07-08) |
| QA hardening insert (Q1-Q4 + write spine) | ✅ milestone-1.5 (2026-07-29); remainder = the [ROADMAP QA bucket](ROADMAP.md) |
| R3 + R3.1 Reel Experience + Lambda teardown | ✅ milestone-2 (2026-08-06) |
| **Track B marketing identity build** | **✅ built through the help arc (2026-08-25 → 08-27)** — six rounds on `launch-prep` (paper/cinema chapter system + theming → feature expansion + mega-menu → the motion system → routes-complete → the R6 help-center arc + elevation passes). The voice thesis ("The whole event, in one album.") is byte-pinned in `src/lib/constants/marketing-voice.ts`; truth: [`systems/marketing-content.md`](systems/marketing-content.md) + [`systems/design-system.md`](systems/design-system.md). Next marketing goal comes from Will (rising-tides posture). |
| R4 Growth (Share Studio) / R4b Social P4 | Profiles+social P1-P3 shipped early (rode milestone-2); Share Studio + the P4 feed not started |
| R5 Notifications · R6 App polish · R7 Admin · R8 Hardening | not started (content: their [ROADMAP](ROADMAP.md) buckets) |

**Consolidation round (2026-08-27):** the repo became the single boot surface for parallel sessions
(PROGRAM.md born, this file rewritten, era reframe across docs, branch/worktree debris removed) and
**milestone-3** capped it: prod = the full marketing identity build + consolidation.

**The pricing round (2026-08-27, on `launch-prep`, unmerged):** `/pricing` rebuilt from zero
(Biograph-informed IA: identity pair + pass ticket + unlock grid + find-your-size calculator + full
comparison matrix + FAQ) AND the Event Pass economics it markets made TRUE first —
**[ADR-0025](adr/0025-event-pass-economics.md)**: passes STACK (the `event_passes` ledger +
`profiles.event_slots`) and Pass→Pro converts as PRORATED CREDIT (Stripe customer balance). All four
checkout branches red-teamed live on the preview (the $17.42 proration verified wire-accurate in
session metadata). Webhook E2E (a COMPLETED purchase provisioning through the new ledger) waits for
the milestone merge: Stripe delivers to the endpoint registered for prod, which still runs `main`'s
webhook. Lab sitting pending (below).

## Live state

- **Prod (partyreel.com)** = `main` @ tag `milestone-3`. **Preview** = `launch-prep` tip at the alias
  above (branch-scoped env + Stripe TEST preview webhook + Supabase redirect + R2 CORS wired).
- **Data:** disposable test data only (3 profiles / 3 events / ~16 media rows). Test accounts +
  fixtures: [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** 1162 green (`pnpm test`); the full gate is typecheck + lint + test + build.
- **Jobs:** the daily purge cron + the media-backup Worker + the **daily DB-backup GitHub Action
  (green, runs ~06:30 UTC)** are all live; the deletion-aware backup prune ships in **dry-run**
  (`PRUNE_MODE=live` is a launch-checkpoint flip).

## Infrastructure

All backing services run under the dedicated owner account **partyr33l@gmail.com ("P3")**:

- **Supabase** project `ddafaemglzmuekbtjwzn` (P3 "Partyreel Team", Pro; daily backups on; the public
  `avatars` Storage bucket). ⚠️ the MCP may be connected read-only (DB tool group → `permission`
  error) → re-auth with the DB scope or use the dashboard SQL editor.
- **Cloudflare R2** account `8bd90d2f6a374d6cdff2f379e929b060` — bucket `partyreel` (primary, ENAM) +
  `partyreel-backup` (Bucket-Locked, WNAM).
- **Stripe** `acct_1TcStrPtjqmVkBwk` (**TEST** mode — live cutover is a launch task). **Sentry** org
  `partyreel`. **Resend** (`partyreel.com` verified; auth email rides Resend SMTP). **Google OAuth**
  P3 web client. In-app operator `partyr33l@gmail.com` (`is_admin` + TOTP MFA).
- **"Allow new signups" must stay ON** (account-from-guest + email+password create depend on it;
  anonymous sign-ins stay OFF per ADR-0008).
- **Deferred cutovers** (not blocking): Vercel Hobby → Pro at launch (hosting moved to the P3 Vercel
  team 2026-08-05), DNS hosting (GoDaddy → P3 Cloudflare), the GitHub repo (`willgibs/partyreel` →
  P3 at sale).

**Already configured — DO NOT redo:** R2 buckets + creds + CORS + abort-multipart lifecycle rule; the
apex domain; `CRON_SECRET`; `profiles.is_admin`; the Stripe TEST products/prices + webhook + Billing
Portal + the 5 env vars; Supabase TOTP MFA + `admin.partyreel.com/auth/callback` in the redirect
allow-list + `NEXT_PUBLIC_ADMIN_HOST` (break-glass: delete the TOTP factor in the Supabase dashboard,
`auth.mfa_factors`); the Sentry project + DSN + 4 env vars; the media-backup Worker + the DB-backup
Action secrets; the prune crons + shared `PRUNE_API_SECRET`. (All Vercel-side items were recreated on
the P3 project during the 2026-08-05 hosting migration — the list still holds.)

## Will's open decision queue

1. **The next program goal** (continue marketing under rising-tides, or open R4/R5/R6/R7).
2. **Marketing batch-1 media contact sheet** — the 4 Unsplash items need a per-batch OK.
3. **The five copy-alternative picks** + the Sitting-1 `/design` lab rulings (incl. the frozen `/reel`
   items and the real-phone QR ticket-scan check).
4. **The MonoCaption sweep question** — does the R6 mono ruling extend to press facts / legal status
   lines / GoDeeper captions ([ROADMAP](ROADMAP.md) "Elevation-program deferred queue").
5. **His-side inits:** the help-content Agent ([`content/help/AUTHORING.md`](../content/help/AUTHORING.md))
   and the legal Agent (the `LegalArticle` shell) — both ready to spawn via the PROGRAM.md Agent template.
6. **The pricing-round sitting:** `/design/c/pricing-plan-cards` (the pair's visual identity: Media
   burst / Stacked photos / Quiet ink) + `/design/c/pricing-calculator` (Album fill vs the shipped
   Receipt meter) — the ratified directions wire into /pricing after the ruling.
7. **Annual Pro pricing numbers** (whenever ready — monthly-only was the ruled scope this round; the
   toggle slot is reserved, [ROADMAP](ROADMAP.md) "Billing follow-ons").

## Pre-launch / human-blocked

The launch-gated tasks live in [`ROADMAP.md`](ROADMAP.md) → **Launch checkpoint** (tagged
`[human]`/`[eng]`/`[content]`). History (what shipped, when, with narrative): [`CHANGELOG.md`](CHANGELOG.md).
