# Partyreel — Status (you-are-here)

> ROLE: the live snapshot — what's true right now, where the program stands, what's blocked on Will.
> BELONGS HERE: the era statement, the round-status table, live/deployed state, infrastructure, Will's
> open decision queue. · NOT HERE: the program's rules/definitions (→ [`PROGRAM.md`](PROGRAM.md)),
> shipped history (→ [`CHANGELOG.md`](CHANGELOG.md)), how systems work (→ [`systems/`](systems)),
> what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place + prune (a snapshot — keep it short and current).

**Updated:** 2026-08-28

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

**MILESTONE-6 (2026-08-28): prod = the nav round.** `main` @ tag `milestone-6` (`bfa69ba`), prod
READY + verified at the merge SHA: the rebuilt header interaction live on partyreel.com. Will's
feel-pass acceptance: "Feels much better." The next agreed step: circle back to the `lp/footer-ink`
handoff (the second Agent track awaiting integration).

**The nav round (2026-08-28, merged to `launch-prep` at `50e6f23`; the program's FIRST Agent-handoff
integration):** the marketing header's interaction rebuilt on the floating-layer contract by the
`lp/nav-interaction` Agent — one shared dropdown clock, the swap-gated box morph, origin-aware growth,
the measured hover indicator, the header glass moved to an inert opacity layer, `PRIMARY_NAV`
reordered (panels contiguous, Pricing last; Vitest-pinned), and the full-screen mobile menu with
one-at-a-time disclosures. Mechanics verified live on the preview at the SHA; Will's feel pass
approved same-day and the round merged at milestone-6.
Truth: [`systems/marketing-content.md`](systems/marketing-content.md)
+ [`systems/design-system.md`](systems/design-system.md).

**MILESTONE-5 (2026-08-28): prod = the contact round.** `main` @ tag `milestone-5` (`2cabc1e`),
prod READY + verified at the merge SHA: the composite /contact identity live, the neutralized copy
across every surface, llms.txt carrying the new posture. Will's acceptance: "good enough for rising
tides" (the identity revisit is a ROADMAP one-liner; he is "not in love yet").

**The contact round (2026-08-28, merged at milestone-5):** /contact rebuilt as the
connected front door (a required topic Select routing each note + in-form deflection hints, the
page-wide ⌘K help palette + embedded search band, the numbered self-serve directory;
`contact_submissions.topic` structured intake feeding the notify-email tag + `/admin/support`), and
the **site-wide promise neutralization** (Will's ruling: no human-response, no human-moderation, no
never-automate language anywhere incl. both legal drafts; the standard reply line "Every note gets a
reply, usually within a day."; enforced by a wrap-proof content-policy fence). The first visual
build failed Will's bar ("wireframe feel") and the identity was REDONE from zero the same day via
the `contact-identity` lab: his composite ruling = the desk structure + the stationery note dress
(photo stamp + letterhead) on the Biograph gray panel with white fields. Truth:
[`systems/marketing-content.md`](systems/marketing-content.md).

**MILESTONE-4 (2026-08-28): prod = the pricing round + the AI-discoverability layer.** `main` @ tag
`milestone-4` (`62220cb`), prod READY + verified at the merge SHA: /pricing (stacks, wall, toggle),
/llms.txt + /llms-full.txt live, robots welcoming 14 AI crawlers, SoftwareApplication schema
sitewide, and the webhook E2E on the NEW code (API subscription create→cancel: pro with
`event_slots` null → free, ledger untouched; the pass-purchase E2E staged for Will's test-card
completion). The AI layer's strategy: llms.txt as the forward bet, crawlability + grounded
retrievable facts as the real play ([`systems/marketing-content.md`](systems/marketing-content.md)).

**The pricing round (2026-08-27, on `launch-prep`, merged at milestone-4):** `/pricing` rebuilt from zero
(Biograph-informed IA: identity pair + pass ticket + unlock grid + find-your-size calculator + full
comparison matrix + FAQ) AND the Event Pass economics it markets made TRUE first —
**[ADR-0025](adr/0025-event-pass-economics.md)**: passes STACK (the `event_passes` ledger +
`profiles.event_slots`) and Pass→Pro converts as PRORATED CREDIT (Stripe customer balance). All four
checkout branches red-teamed live on the preview (the $17.42 proration verified wire-accurate in
session metadata). Webhook E2E (a COMPLETED purchase provisioning through the new ledger) waits for
the milestone merge: Stripe delivers to the endpoint registered for prod, which still runs `main`'s
webhook. **Sitting ruled same-day and wired** (`20057e1`): cards = V2 Stacked photos, calculator =
V1 Album fill, and the price register swapped off Geist Mono (money in Urbanist, values in Inter)
after Will's mono flag; both rulings recorded on the touchpoints.

## Live state

- **Prod (partyreel.com)** = `main` @ tag `milestone-6`. **Preview** = `launch-prep` tip at the alias
  above (branch-scoped env + Stripe TEST preview webhook + Supabase redirect + R2 CORS wired).
- **Data:** disposable test data only (3 profiles / 3 events / ~16 media rows). Test accounts +
  fixtures: [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** 1184 green (`pnpm test`); the full gate is typecheck + lint + test + build.
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

1. **The `lp/footer-ink` handoff** — the agreed next step ("we'll circle back for the footer
   branch"): Will opens the round, the Orchestrator reviews + integrates per the nav-round pattern.
2. **Marketing batch-1 media contact sheet** — the 4 Unsplash items need a per-batch OK.
3. **The five copy-alternative picks** + the Sitting-1 `/design` lab rulings (incl. the frozen `/reel`
   items and the real-phone QR ticket-scan check). (The contact-identity ruling landed 2026-08-28:
   the desk + note composite, wired same-day; the nav feel pass cleared same-day at milestone-6.)
4. **The MonoCaption sweep question** — does the R6 mono ruling extend to press facts / legal status
   lines / GoDeeper captions ([ROADMAP](ROADMAP.md) "Elevation-program deferred queue").
5. **His-side inits:** the help-content Agent ([`content/help/AUTHORING.md`](../content/help/AUTHORING.md))
   and the legal Agent (the `LegalArticle` shell) — both ready to spawn via the PROGRAM.md Agent template.
(Annual Pro was ruled + built 2026-08-27: $90/$190/$390, two months free — nothing pricing-side
remains open.)

## Pre-launch / human-blocked

The launch-gated tasks live in [`ROADMAP.md`](ROADMAP.md) → **Launch checkpoint** (tagged
`[human]`/`[eng]`/`[content]`). History (what shipped, when, with narrative): [`CHANGELOG.md`](CHANGELOG.md).
