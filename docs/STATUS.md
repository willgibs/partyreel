# Partyreel — Status (you-are-here)

> ROLE: the live snapshot — what's true right now, where the program stands, what's blocked on Will.
> BELONGS HERE: the era statement, the round-status table, live/deployed state, infrastructure, Will's
> open decision queue. · NOT HERE: the program's rules/definitions (→ [`PROGRAM.md`](PROGRAM.md)),
> shipped history (→ [`CHANGELOG.md`](CHANGELOG.md)), how systems work (→ [`systems/`](systems)),
> what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place + prune (a snapshot — keep it short and current).

**Updated:** 2026-09-02

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
| **Track B marketing identity build** | **✅ built through the help arc (2026-08-25 → 08-27)** — six rounds on `launch-prep` (paper/cinema chapter system + theming → feature expansion + mega-menu → the motion system → routes-complete → the R6 help-center arc + elevation passes). The voice thesis ("The whole event, in one album.") is byte-pinned in `src/lib/constants/marketing-voice.ts`; truth: [`systems/marketing-content.md`](systems/marketing-content.md) + [`systems/design-system.md`](systems/design-system.md). The help CATALOG was written fresh on `lp/help-catalog` (2026-09-01; integrated 2026-09-02 at `3cff3a7`: 59 articles across ten categories, the account shelf, the article vocabulary, four honesty tests). Next marketing goal comes from Will (rising-tides posture). |
| **Round 3 (A + B): the operating model + the library round** | **✅ milestone-17 (2026-09-02)**: track manifests + two guards + the build gate on request; the lab distilled (26 boards to [`decisions/design-record.md`](decisions/design-record.md), `/design/marketing`, `/design/record`, the CSS split: the home's main sheet 304,277 → 265,358 bytes). Part C (the roadmap as tracks + the wave-1 inits) is next. |
| R4 Growth (Share Studio) / R4b Social P4 | Profiles+social P1-P3 shipped early (rode milestone-2); Share Studio + the P4 feed not started |
| R5 Notifications · R6 App polish · R7 Admin · R8 Hardening | not started (content: their [ROADMAP](ROADMAP.md) buckets) |

**Consolidation round (2026-08-27):** the repo became the single boot surface for parallel sessions
(PROGRAM.md born, this file rewritten, era reframe across docs, branch/worktree debris removed) and
**milestone-3** capped it: prod = the full marketing identity build + consolidation.

**The agent-merge sequence (opened 2026-08-28, all five merged 2026-08-31).** Five Agent branches built in parallel
(`lp/about`, `lp/blog-redesign`, `lp/careers-identity`, `lp/glow-doctrine`, `lp/press-kit`); Will
hands them over one at a time as they are ready, and the Orchestrator's job on each is to adopt what
is genuinely better and synthesize the rest onto the shared system (rising tides, not a stack of
one-offs). **`lp/about` merged and shipped at milestone-9** (the design unchanged; the route moved
into the `(cinema)` group and `(spotlight)`/`CinemaChapter` came out, `PageHero` born, /about's h1
restored). Will's ruling from that round, now doctrine: **every utility page takes the cinema-hero /
paper-body / ink-footer rhythm by joining the `(cinema)` group** — legal, privacy and contact
included as they are reworked. Truth: [`systems/marketing-content.md`](systems/marketing-content.md)
+ [`systems/design-system.md`](systems/design-system.md).

**`lp/press-kit` merged and shipped at milestone-10**, the second branch of the sequence. It had
already moved `/press` into `(cinema)` with a `PaperChapter` body on its own, so
there was no architecture to settle; the design merged unchanged. Will's note was the work: the h1
takes `PageHero`'s **`display` step** (the masthead tier /about uses) and the tracking squeeze is now
standard for that step rather than an /about beat, with a **one-or-two-word contract** on it. Doing it
properly split the step's left side-bearing out as `leadIn`, gated on `align="left"` — which fixed a
shipped bug too, since /about's masthead is centred and had been sitting 3.6px left of centre on prod
since milestone-9 — and closed an LCP hole, since `.mkt-line` paints an h1 at `opacity: 0` until
hydration. Will's last note before the merge became a rule: **at the display step the H1 matches its
NAV LABEL** (a 160px "Media" under a footer link reading "Press" is a non-sequitur), so the H1 is
"Press" and the descriptor moved into a "Media assets" eyebrow.
**`lp/blog-redesign` merged and shipped at milestone-11**, the third branch of the sequence: /blog
rebuilt on Will's V4 composite, and the post page given an identity. It arrived at the cinema/paper
architecture on its own, so the round's work was synthesis (the reading spine extended to /help so
one shared component runs ONE behaviour, the set-change clocks de-named from "blog" since the
selectors were already page-neutral, the index-masthead recorded as the third H1 register) plus two
red-team findings: the exit beat ran under reduced motion (the rule cited the review queue's
convention but took only half of it), and `useFlip` had NO tests despite being shared with the admin
event feed.
**`lp/careers-identity` merged and shipped at milestone-12**, the fourth branch of the sequence.
/careers went from a
template instance to a page that argues in photographs; it reached `(cinema)` on its own, so the
round's work was Will's three rulings (the h1 back on the site ladder, the philosophy indices circled
in the page's own hand, the two morph delegates collapsed into one), two measured fixes (the hero was
lazy-loading half of itself ABOVE THE FOLD; the emblem fallback could hand an unwritten role a mark
that claims something), the seven tests the round shipped none of, two a11y gaps found by
keyboard-driving the preview, and a doc repair. It also carried a real rising tide of its own: the
overlay header's glass wash, retuned off Will's note and now 300/220 on the symmetric S for EVERY
marketing page. ★ Its `marketing-content.md` AUTO-MERGED into a broken state with no conflict, which
is the transferable lesson: a clean merge report on a doc means the text reconciled, not the facts.
Full narrative: [CHANGELOG](CHANGELOG.md).

**`lp/glow-doctrine` merged into `launch-prep` 2026-08-31 (`2bf18dc`), closing the sequence.** The
fifth and last branch, and the only one proposing a SYSTEM rather than a page: SPILL (light falling
from a lit thing) and its sibling BEAM (an object lit because it IS the live subject), 4 + 4 laws, a
six-item never-list, 13 argued placements, the engine behind them, and `border-beam` v1.4.0 vendored
under MIT. **Merged ADOPT-ONLY on Will's ruling: the branch touched zero production bytes and the
merge kept it that way**, so every placement becomes its own paced round instead of arriving as a wave
of effects. **Shipped at MILESTONE-13** (`main` @ tag `milestone-13`, `f3e6cbb`, 2026-09-01), which is
unlike the four page milestones before it: it changes no production byte, so prod gained TOOLS rather
than a surface. The agent-merge sequence CLOSES here, and all five branches, remotes, worktrees and
local branches are cleaned up (~5.6 GB of stale worktrees reclaimed). `launch-prep` is now free for
the integration rounds.

**The wiring sequence Will ruled (2026-09-01): every Glow integration round across marketing and app
first, THEN the lab review** (keep what earns a place in a streamlined design-system library, wipe the
stale rest). Position: **R0 the engine ✅ · R1 the home page's light ✅ · R2 chapter pacing ✅ (opener A/B pending Will)**
(all on `launch-prep`, unmerged) → R3 the library + the lab's dead weight → R4 radius, globally → then the
guest surfaces, the Get Pro beam + the lit surface, the publish beat, and branching agents per page.

**MILESTONE-16 (2026-09-02): prod = the legal round and the help catalog, red-teamed live.** `main` @
tag `milestone-16` (`9b61419`), prod READY + red-teamed at the merge SHA across rounds 0 to 2b, the blog,
legal and help (guards, negatives, metadata, the home's arc and lamps, legal and help surfaces, 375
under a classic scrollbar, console clean). One finding logged: the root 404's light `theme-color` over
its dark lit page. Full narrative: [CHANGELOG](CHANGELOG.md).

**The help catalog and the legal round integrated (2026-09-02).** `lp/legal-docs` merged at `988aac3`
and `lp/help-catalog` at `3cff3a7`, both gates green on the merged trees (1489 tests, 245 static pages
after the catalog), both verified on the launch-prep alias; four integration decisions inside the
agents' work are in the [CHANGELOG](CHANGELOG.md) (one over-cap source, bare-number spec components,
the shared heading anchor, the per-shelf llms cap). Awaiting Will's look, then milestone-16.

**MILESTONE-15 (2026-09-02): prod = the blog library.** `main` @ tag `milestone-15` (`c46621f`), prod
READY + verified at the merge SHA (the rail's counts, sitemap 23, llms 8, a redirect, Article +
FAQPage on a post, the shared capacity phrase on /pricing, console clean). Will: "Well done. Please
continue." Full narrative: [CHANGELOG](CHANGELOG.md).

**MILESTONE-14 (2026-09-02): prod = rounds 0 to 2b.** `main` @ tag `milestone-14` (`54bd519`), prod
READY + verified at the merge SHA (the light system, the lit 404, the film strip's backlight, the Pro
beam, the media-forward cards, the re-paced home with the adjacency rule, the reel's pool, the
sideways-scroll fix). Will's acceptance: "This looks way better. It still needs plenty of work later,
but please go ahead and merge to main." Full narrative: [CHANGELOG](CHANGELOG.md). The blog library
(`lp/blog-library`, the Agent's handoff at `661205f`) merged into `launch-prep` right after, at
`e70d241`, gate green on the merged tree (1337 tests, 155 static pages); the one conflict was the
CHANGELOG's top, and the three auto-merged docs were read by eye.

**Round 2 (2026-09-01)** turned the chapter idea into a recorded PACING PRINCIPLE (a chapter is an
attention arc; each opener bespoke; core marketing pages only) and re-paced the home page against it:
two quiet guest-side sections wind chapter 1 down before the live demo, now its centred closing anchor;
the event cards went media-forward and lost their light (measured legibility, fixed twice); and the
payoff chapter's opener went out as two bespoke treatments; **Will ruled for A, "lights down"** (merged after its light was
held to the screen's width; `lp/reel-b` deleted), and his second pass re-paced the page again: no two
sections back to back share a layout, the straddle is off the home, and the album opens the paper
chapter as the host's masthead. Radius knobs are staged on the marketing tuner for round 4. Full narrative: [CHANGELOG](CHANGELOG.md).

**Round 1 (2026-09-01)** put the first new light on the site, in two passes. The first lit the hero and
the album straddle; both drew a visible rectangle (verified in the wrong browser, and placed where no
source sits above the ground) and were **pulled the same day** on Will's call. The second chose its
surfaces from a screenshot survey of the whole page: the **film strip's backlight**, a seam off the
strip's own bottom edge sampling its eight frames (approved: "the lamp acting as almost a backlight"),
and the **Pro card's beam** from the lab's reference implementation; the card tilt and cursor glare
were retired, and the event cards' own light was tried three ways and dropped for scarcity at round 2.
What stayed from the first pass: `GlowFilter` as a root-layout singleton, the DOM sampler, the dev-only
missing-host guard, and the engine's reduced-motion fix (the band had been resting at the MIDPOINT of
its sweep at full strength, permanently, for anyone who asked for less motion). Two lab-fidelity findings went to the lab review: moment 05's specimen is vertically
inverted from its own production surface and overstates the overhang by 2.5x, and moment 09's lamp does
not exist at all. Full narrative: [CHANGELOG](CHANGELOG.md).

Still open from the merge, all recorded in [ROADMAP](ROADMAP.md): **Law 3 on real GUEST media** — the
canvas taints on presigned R2 URLs, but the fix is far smaller than logged (the R2 CORS rule is already
live and proven by the shipping reel encoder, so it is a loader swap); **the lit surface** amends "Dark:
NO shadows anywhere"; and **the ground picks the sibling** (ink takes the beam, paper takes spill in the
paper register), which came out of two beam surfaces being specified on grounds they do not have and now
blocks R2 the same way.

★ Two transferable lessons from this round. **A guard whose name promises more than its assertion is
worse than no guard**: two here could not fail, and one of them was the only thing watching ~3,000
lines of vendored code. And **the lab and production are BOTH provisional** (three-way test now in
[`systems/design-system.md`](systems/design-system.md)): a minimal production surface is not evidence
against a lab specimen, which the Orchestrator got wrong twice before Will corrected it.

**MILESTONE-12 (2026-08-29): prod = the /careers round.** `main` @ tag `milestone-12` (`6ecb55a`),
prod READY + verified at the merge SHA. Will's acceptance: "You nailed the philosophy row on desktop.
Feels very on-brand compared to the branched version" (with a note that he will revisit both page
designs). Verified on partyreel.com at 1440: the h1 at 72px matching /pricing and /how-it-works
character for character, so the site ladder has no exceptions again; the contact sheet at 12 unique
images / 12 eager / 0 never-eager (it was lazy-loading half of itself above the fold); the three
philosophy marks at 48x32 evenly spaced at x = 112 / 533 / 955, aria-hidden, on the paper ink; the
role page's h1 at 60px with the rail at 240px, `align-self: stretch`, `position: sticky`; the emblem
at 96px; no overflow; console clean. BOTH morphs re-verified after the collapse (`/blog` card ->
article -> "Keep reading" hop, `/careers` card -> role -> back -> other role), each reporting exactly
one named plate at start and the target re-armed. Reduced motion forced on prod: 0 transitions
started, the navigation still completed. `/careers/nonsense` on the cinema 404 with
`theme-color: #040404`; sitemap 3 careers URLs; no `JobPosting` JSON-LD. ★ The transferable lesson is
the doc one: `marketing-content.md` AUTO-MERGED into a broken state with NO conflict (a decapitated
bullet, then a whole stale one describing the rejected first rebuild and linking a file that does not
exist). A clean merge report on a doc means the text reconciled, not the facts. Full narrative:
[CHANGELOG](CHANGELOG.md).

**MILESTONE-11 (2026-08-29): prod = the /blog round.** `main` @ tag `milestone-11` (`95ca799`), prod
READY + verified at the merge SHA. Will's acceptance: "It looks great." Verified on partyreel.com:
all ten blog URLs 200; one `<h1>` reading `Blog` at 20px, unmarked and `opacity: 1`; the 21:9
featured card straddling the paper by 80px with the library sharing its right edge; 3/2/1 columns and
no overflow at 1440/768/375; the two-beat filter keeping survivors on their same DOM nodes (so covers
do not re-develop); the cover morph firing twice with exactly one named plate each and the target
still armed after; the reading spine live on BOTH /blog and /help; the reduced-motion contract
re-checked against the shipped CSSOM; /about and /press re-measured unregressed. Two false alarms
resolved to test-tool artifacts, not faults: a blank card grid (unfocused-window repaint) and a spine
reading 0 (rAF suspended in a hidden tab). Full narrative + the one thing NOT verified live (an
urgency reorder on the event feed, since the test event has no review queue):
[CHANGELOG](CHANGELOG.md).

**MILESTONE-10 (2026-08-29): prod = the /press round.** `main` @ tag `milestone-10` (`b08903f`), prod
READY + verified at the merge SHA. Will's acceptance: "It all looks fantastic." Verified on
partyreel.com: one `h1` reading "Press" at 160px under a "Media assets" eyebrow, painting unmarked and
with no `margin-inline-start`, centred to 0.00px; skin `cinema` with `theme-color: #040404`; nav panel
15.06:1 and hero 17.79:1; all ten kit assets 200 and the zip downloaded from prod byte-identical to
the committed artifact, its QR re-encoding to `https://partyreel.com`; sheet 4/2 columns with an even
3px rebate; three spine sections on one right edge; deep links clearing the header; no overflow at
1440 or 375; console clean. **/about re-verified on the same build: masthead centred to 0.00px against
3.6px off centre on milestone-9** — the side-bearing gate fixed a page it was not aimed at.
★ The Browser-pane origin carried no `pr-no-track` for its first prod load (the Chrome profile did);
no insights request appears for it, so at most one pageview, and the flag was set before any further
checks.

**MILESTONE-9 (2026-08-28): prod = the /about round.** `main` @ tag `milestone-9` (`279c8d6`), prod
READY + verified at the merge SHA. Will's preview acceptance: "Looks fantastic." Verified on partyreel.com: one `h1`
("Partyreel", 160px, the optical trim applied) painting at opacity 1 with no reveal mark, so the LCP
rule holds in the shipped markup; `data-mkt-skin="cinema"` with `theme-color: #040404` and near-black
body, so both overscroll edges match the dark hero and the ink footer; `--popover` dark again, which
is the white-dropdown regression closed; the seam landing EXACTLY on the album's midline at 1440 and
the album entirely on the dark with 116px of clearance at 375; no horizontal overflow either width;
both analytics scripts served; console clean. The test profile's `pr-no-track` flag is still set on
the prod origin, so this pass added nothing to the analytics baseline.

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

- **Prod (partyreel.com)** = `main` @ tag `milestone-16`. **Preview** = `launch-prep` tip at the alias
  above (branch-scoped env + Stripe TEST preview webhook + Supabase redirect + R2 CORS wired).
- **Data:** disposable test data only (3 profiles / 3 events / ~16 media rows). Test accounts +
  fixtures: [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** 1489 green (`pnpm test`); the full gate is typecheck + lint + test + build.
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
Portal + the 10 Stripe env values; Supabase TOTP MFA + `admin.partyreel.com/auth/callback` in the redirect
allow-list + `NEXT_PUBLIC_ADMIN_HOST` (break-glass: delete the TOTP factor in the Supabase dashboard,
`auth.mfa_factors`); the Sentry project + DSN + 4 env vars; the media-backup Worker + the DB-backup
Action secrets; the prune crons + shared `PRUNE_API_SECRET`. (All Vercel-side items were recreated on
the P3 project during the 2026-08-05 hosting migration — the list still holds.)

## Will's open decision queue

**Round 2, after Will's second pass (2026-09-01):** (i) the payoff opener **RULED: A**, "lights
down", merged after the width fix; `lp/reel-b` deleted. (ii) **Two provisional headers stay
provisional by ruling** — `noApp` "Nothing to install. Nothing to sign up for." and `fullQuality`
"Everything they shoot, at the size they shot it."; he will send alternatives. (iii) **The album
opener is done**: the paper chapter opens on the host's masthead, and only the provisional `album`
line remains his. (iv) The four event teasers are equalised (57 to 64 characters) so the titles share a
baseline; the conference still's legibility (median 5.6:1, brightest 5% at 4.27:1) waits on the
manifest fill.

1. **The light system's remaining rulings.** Rounds 0 and 1 are both on `launch-prep` (2026-09-01) and
   three of the five are closed:
   ~~(a) the beam's chroma register~~ **CLOSED by evidence** — it is not a second palette. The values
   are our own five hues through `oklchToSrgb` at effect-grade chroma, hue held exactly: a DERIVED
   register of the lamp set, now named in [design-system.md](systems/design-system.md) and pinned by
   test. It cannot be tokenised (the vendored file regex-parses `rgb()` strings).
   ~~(e) the root 404's lit seam~~ **RULED: keep it lit** (Will, 2026-09-01), with a reason that is
   doctrine rather than a one-off — *a 404 that feels alive keeps a visitor exploring, while a flat one
   makes giving up feel fine.*
   (d) **the cadence, and its SHAPE changed at round 1.** All three lamps ship at `--glw-dur: 11s`
   against the engine's ruled 8s, so the question is no longer "the footer alone with nothing else
   moving" but the **system's register**: the whole home page at 11s against the whole page at 8s.
   Ask for it whenever.
   (b) **the lit surface**, which amends "Dark: NO shadows anywhere" and is already on the Get Pro
   specimen; it and the Get Pro beam are entangled (three of four beam specimens wear `[data-lit]`), so
   they want one round.
   (c) **the publish beat's violet**, unruled, where a ratified state colour meets law 3's ban on them.
   (f) NEW, and it blocks the next round — **the guest surfaces follow the VISITOR's theme.**
   `/e/[token]` has no forced skin, but the doorbell arrival, the locked door and the awaiting-media
   skeleton were all argued on cinema. That is the same ground mismatch that killed the QR beam and
   dropped the help palette. Needs a ruling before R2 can be built.
2. **Everything through wave 1 is on prod (MILESTONE-18, 2026-09-02).** `launch-prep` and `main`
   agree at `225716c`. One track is open: `lp/marketing-feature-pages` (Will's, cut at
   `7a189ae`, 16 commits ahead and 41 behind; its code lane is clean and its four doc edits are
   reconciled at integration). Every track's claim and handoff lives in [`docs/tracks/`](tracks).
3. **A revisit of /blog and /careers** — Will's own note at the milestone-12 merge: "I'll definitely
   revisit both of these page designs." Approved and shipped as they are; the revisit is his, not a
   defect list. (The `PageHero` sweep and the mobile pass below are separate and already logged.)
4. **Marketing batch-1 media contact sheet** — the 4 Unsplash items need a per-batch OK.
5. **The five copy-alternative picks** + the Sitting-1 `/design` lab rulings (incl. the frozen `/reel`
   items and the real-phone QR ticket-scan check). (The contact-identity ruling landed 2026-08-28:
   the desk + note composite, wired same-day; the nav feel pass cleared same-day at milestone-6.)
6. **The MonoCaption sweep question** — does the R6 mono ruling extend to GoDeeper captions (press
   facts settled 2026-08-28, the legal status lines 2026-09-01: Inter) ([ROADMAP](ROADMAP.md)
   "Elevation-program deferred queue").
7. **Tracks (the wave plan, 2026-09-02; three to four concurrent).** Open: `lp/marketing-feature-pages`
   (Will's). **Wave 1, stubbed in [`docs/tracks/`](tracks)** (each stub is the track's whole init; the
   one-line prompt is in [`tracks/README.md`](tracks/README.md)): `ci-workflow`, `legal-billing-truth`
   and `product-truth` were SPAWNED 2026-09-02 as Orchestrator-run agents in `../partyreel-wt/<track>`;
   **`ci-workflow` integrated at `192c708` (CI runs the gate on every push now) `legal-billing-truth` integrated at `2f98157`, and `product-truth` integrated the same day at `1352bb7`** (its signed-in surfaces walked on the alias); `ops-hardening`, `account-deletion` and `demo-seed` are ready for
   Will's sessions or the next window, as slots free. Integration: 1 + 2 together → a
   milestone; 4b (its migration applied first) then 3 → a milestone. **Wave 2** after the marketing
   branch and `legal-billing-truth` land: `marketing-followons`, `glow-engine-defects`, the demo seed
   run. **Wave 3:** `marketing-mobile` alone on the marketing surface. **Wave 4:** the Will-led rounds
   (the home hero, the rounding, the lit surface, the guest surfaces, the publish beat), then the launch
   round in the Launch checkpoint's human order.
8. **The account-required unfurl line** (from `product-truth`, on prod since milestone-18): it now
   reads "Add your photos and videos. This event asks guests for an email."; the alternative if you would
   rather name the mechanism is "...asks guests to sign in with an email." One word from you settles it.
9. **The purchase toast, a ten-second look:** open `/dashboard?upgraded=1` as the Pro host on prod or
   the alias; one toast should say "You're on Pro." and the flag should vanish from the URL. The
   browser tooling could only see it indirectly (a background tab throttles hydration).
10. **`SUPABASE_DB_URL` into `.env.local`** (15 minutes, his): unblocks the committed RPC integration
   suite ([`decisions/rpc-suite-blocked.md`](decisions/rpc-suite-blocked.md)).
(Annual Pro was ruled + built 2026-08-27: $90/$190/$390, two months free — nothing pricing-side
remains open.)

## Pre-launch / human-blocked

The launch-gated tasks live in [`ROADMAP.md`](ROADMAP.md) → **Launch checkpoint** (tagged
`[human]`/`[eng]`/`[content]`). History (what shipped, when, with narrative): [`CHANGELOG.md`](CHANGELOG.md).
