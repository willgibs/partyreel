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
prod); agent `lp/<track>` branches auto-deploy their own review previews (NOT allow-listed, UI-review
only); partyreel.com changes only at tagged milestone merges. Every session is an **Agent** unless Will
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

**The agent-merge sequence (opened 2026-08-28).** Five Agent branches built in parallel
(`lp/about`, `lp/blog-redesign`, `lp/careers-identity`, `lp/glow-doctrine`, `lp/press-kit`); Will
hands them over one at a time as they are ready, and the Orchestrator's job on each is to adopt what
is genuinely better and synthesize the rest onto the shared system (rising tides, not a stack of
one-offs). **`lp/about` merged** at `launch-prep` (the design unchanged; the route moved into the
`(cinema)` group and `(spotlight)`/`CinemaChapter` came out, `PageHero` born, /about's h1 restored).
Will's ruling from that round, now doctrine: **every utility page takes the cinema-hero / paper-body
/ ink-footer rhythm by joining the `(cinema)` group** — legal, privacy and contact included as they
are reworked. Truth: [`systems/marketing-content.md`](systems/marketing-content.md) +
[`systems/design-system.md`](systems/design-system.md). Four branches still with Will.

**MILESTONE-8 (2026-08-28): prod = the exec round.** `main` @ tag `milestone-8` (`4063f6e`), prod
READY + verified at the merge SHA: partyreel.com serves both analytics scripts with `view` + `event`
beacons POSTing 200 live, and the first prod pageviews read back through the re-authorized P3 Vercel
MCP same-hour (1 visitor / 4 pageviews — the verification session itself). Agent `lp/*` pushes now
auto-deploy review previews; the dashboard-side ignore command is CLEARED (verified null; the tracked
script is the single source) and the two merged `lp/*` remotes are deleted. Speed Insights 503s on
prod too, so that gate is the Hobby plan itself (silent; activates at the Pro cutover). Will's
approval: "All approved and ready for you to close"; his PostHog cost math rides the ROADMAP vendor
item.

**The exec round (2026-08-28, merged at milestone-8):** two
executive tasks ahead of the marketing rebuild. (1) **Agent branches now deploy**: the Vercel branch
gate moved into the repo (`vercel.json` `ignoreCommand` → `scripts/vercel-ignore-build.mjs`) and every
`lp/<track>` push auto-builds `partyreel-git-lp-<track>-partyreel.vercel.app` for Will's live review
BEFORE integration — probe-verified (an lp probe BUILT + served while a non-lp probe CANCELED;
launch-prep unaffected; probes deleted). The aliases are UI-review-only (in no allow-list, by design)
and share prod data. (2) **Marketing web analytics**: Vercel WA + Speed Insights v2, scoped by
mounting the one island in the (marketing) layout; the 7-event taxonomy ships wired-but-dormant
(custom events are Pro-only; pageviews collect NOW, free + hard-capped on Hobby), the `pr-no-track`
opt-out mutes both products (set in the test profile), the proxy skips `/_vercel/*`, and the privacy
draft discloses the counting. Live-verified on the preview: view + event beacons POST 200, the
opt-out silences everything, console clean, zero layout impact (Speed Insights vitals 503 on the
preview; prod recheck at milestone-8). Truth:
[`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md).

**MILESTONE-7 (2026-08-28): prod = the footer round.** `main` @ tag `milestone-7` (`a6dc857`), prod
READY + verified at the merge SHA: the ink slab live on partyreel.com. Will's feel-pass acceptance:
"It's beautiful." The Claude assistant-link caution banner ships as flagged (the revisit option is a
ROADMAP one-liner; `ask-ai.ts` carries the verified vendor behavior).

**The footer round (2026-08-28, merged to `launch-prep` at `dd159b2`; the SECOND Agent-handoff
integration):** the footer rebuilt as the ink slab by the `lp/footer-ink` Agent — three registers
(the server-rendered QR on a fanning photo pile, the full-column index with hub-linked titles + the
derived hiring badge, the `FOOTER_LEGAL` bar with /llms.txt), the seam glow split base+band so a
paused/reduced-motion arrival stays lit, the `--gallery*` token-redeclaration contrast fixes
(pinned by `footer-contract.test.ts`), and the browser-verified assistant deep-link row. Mechanics
verified live on the preview at the SHA; Will's preview feel pass approved same-day and the round
merged at milestone-7. Truth:
[`systems/marketing-content.md`](systems/marketing-content.md) +
[`systems/design-system.md`](systems/design-system.md).

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

- **Prod (partyreel.com)** = `main` @ tag `milestone-8`. **Preview** = `launch-prep` tip at the alias
  above (branch-scoped env + Stripe TEST preview webhook + Supabase redirect + R2 CORS wired).
- **Data:** disposable test data only (3 profiles / 3 events / ~16 media rows). Test accounts +
  fixtures: [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** 1204 green (`pnpm test`); the full gate is typecheck + lint + test + build.
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

1. **The next agent branch to hand over** (`lp/blog-redesign`, `lp/careers-identity`,
   `lp/glow-doctrine`, `lp/press-kit` — Will is still working the remaining four). `lp/about` is
   merged and on the preview awaiting his feel pass. Note for whoever integrates the next one:
   `lp/press-kit` edits `(paper)/about/page.tsx`, which this merge deleted, so expect a
   modify/delete conflict there (its edit is a link fix, re-apply at the new path);
   `lp/careers-identity` will conflict in `marketing.css` and `marketing-content.md`.
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
