# Partyreel — Status (you-are-here)

> ROLE: the live snapshot — what's true right now, where the program stands, what's blocked on Will.
> BELONGS HERE: the era statement, the round-status table, live/deployed state, infrastructure, Will's
> open decision queue. · NOT HERE: the program's rules/definitions (→ [`PROGRAM.md`](PROGRAM.md)),
> shipped history (→ [`CHANGELOG.md`](CHANGELOG.md)), how systems work (→ [`systems/`](systems)),
> what's next (→ [`ROADMAP.md`](ROADMAP.md)).
> GROWS BY: integrate-in-place + prune (a snapshot — keep it short and current).

**Updated:** 2026-09-14

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
anything shared. **The goal for this stretch** (Will, 2026-09-14): every page reaches a cohesive
informational flow, and every point of the design system and the marketing and app UI is elevated
platform-wide; nothing is protected and every element is judged from the ground up (rising tides,
bible 22), exploration rounds are light and iterative, and parallel agents run through the
Orchestrator, whose record is [`tracks/orchestrator.md`](tracks/orchestrator.md) (In flight, Waiting
on Will) and [`ASSETS.md`](ASSETS.md).

## Where the program stands

| Round ([definitions](PROGRAM.md)) | Status |
| --- | --- |
| R0 bootstrap + EXIF hotfix | ✅ milestone-0 (2026-07-03) |
| **The review wave: the bible's second edition + seven parallel tracks** | **🟡 in flight from 2026-09-14**: Will's rule-by-rule review rewrote nine rules and gave each a status on `/design/rules`; six lab boards (`palette`, `light`, `type-scale`, `floating-surfaces`, `brand-voice`, `media-kit`) and one production sweep (`kill-mono`) ran in parallel, each on its own preview, with the rounding and tweaking GUI round on the Orchestrator's side (`/design/c/rounding`, built; the sitting is yours); integrated so far: `brand-voice` (`749e29a`), `kill-mono` (`69af90d`: no mono face in the product, bible 7 is the two-faces rule), `type-scale` (`838a5f6`), `media-kit` (`797f692`: ★ the twelve stills are unlicensed for the recognizable people in them, a decision before launch), `floating-surfaces` (`e1f06d6`); the desk at `/design/c?key=` lists them, and the asks wait in [`tracks/orchestrator.md`](tracks/orchestrator.md). The record: [`tracks/orchestrator.md`](tracks/orchestrator.md); the asset log: [`ASSETS.md`](ASSETS.md). Then the composition pass (the ruled blocks stacked on the home arc and the dashboard), then the wiring rounds. |
| R1 Decision Studio / T1 rulings | ✅ 2026-07-05 (ADR-0019…0022) |
| R2 Reel Engine + Foundation | ✅ milestone-1 (2026-07-08) |
| QA hardening insert (Q1-Q4 + write spine) | ✅ milestone-1.5 (2026-07-29); remainder = the [ROADMAP QA bucket](ROADMAP.md) |
| R3 + R3.1 Reel Experience + Lambda teardown | ✅ milestone-2 (2026-08-06) |
| **Track B marketing identity build** | **✅ built through the help arc (2026-08-25 → 08-27)** — six rounds on `launch-prep` (paper/cinema chapter system + theming → feature expansion + mega-menu → the motion system → routes-complete → the R6 help-center arc + elevation passes). The voice thesis ("The whole event, in one album.") is ruled in `src/lib/constants/marketing-voice.ts` (no copy is pinned by a test since 2026-09-12; all copy is open since 2026-09-14); truth: [`systems/marketing-content.md`](systems/marketing-content.md) + [`systems/design-system.md`](systems/design-system.md). The help CATALOG was written fresh on `lp/help-catalog` (2026-09-01; integrated 2026-09-02 at `3cff3a7`: 59 articles across ten categories, the account shelf, the article vocabulary, four honesty tests). Next marketing goal comes from Will (rising-tides posture). |
| **The home hero, round three (tracks `hero-scan`, `hero-burst`, `hero-river`)** | **🟡 in flight from 2026-09-14**: round two was ruled the same day (the source: "if I scan this QR I get all of these images"; the reel and the gathering out); three variations off the source build in parallel on their own previews, the source first on the board as the reference. The ruling to come: which variation, its supporting elements and copy, the departures ruled in; then the wiring round (after `kill-mono`). |
| **The home hero, round two (tracks `hero-source`, `hero-reel`, `hero-gathering`)** | **✅ integrated and ruled 2026-09-14** (`e98d1a7`, `9d8af64`, `ef58913` on the shell `f28d521`): three concepts, the QR as the origin in each; Will ruled the source and named why the other two failed (the video reads as the product; the QR reads as a learn-more object). |
| **The home-hero board (track `home-hero`)** | **✅ integrated 2026-09-12 (`d63f6cc`, head `393bacc`)**: four heroes on `/design/c/home-hero?key=` with zero darkening layers over media against three on the shipped hero, the ruled copy verbatim, the h1 at paint in all four; no production byte changed. **Waits on your ruling** (the agent recommends V1, the contact sheet; V2 second); the wiring follows it. |
| **The gallery (track `design-gallery`)** | **✅ integrated 2026-09-12 (`7048ab1`, head `9ee41cd`)**: a component is declared once in its family's `gallery-demos.tsx` and three surfaces render from it (its family page, its permalink at `/design/library/<id>`, the searchable index of all 88 at `/design/library`); 15 config panels; `gallery.test.ts` refuses a declared variant the component does not have. Next: the rounding and tweaking GUI round. |
| **MILESTONE-24: the reset on prod** | **✅ 2026-09-12 (`592da24`)**: the 22-rule bible and the component contracts on `/design/rules`, the look-pins and copy-pins gone, ★ landmines only, the big swing licensed. `design-gallery` and `home-hero` spawned the same day. |
| **The "less is more" reset** | **✅ 2026-09-12 (`f79a711`, `91606e9`, the docs pass)**: the design law is the 22-rule bible on `/design/rules` (Will's, ratified at the plan) plus each component's contract (a test tagged `@contract-for`, on the component's library row); 433 derived rules, the verdict island and the annotations layer gone; the look-pins and copy-pins deleted (no copy is pinned by a test); ★ means landmine only (92 stars to 33 across the two design docs); agents are told to take the big swing. Next: `design-gallery` and `home-hero` cut together; the rounding GUI round after the gallery. |
| **MILESTONE-23: the cost round and round C's staging on prod** | **✅ 2026-09-12 (`d52b1e6`)**: sharp out of every function, `launch-prep` on request with the prune tool and 7-day retention, one cadence token with its knob, the rounding knobs on the playground, one FLIP. The sittings themselves were deferred at the merge; their tooling shipped. |
| **The Vercel cost round** | **✅ 2026-09-11**: 381 retained deployments pruned to 44 and a tool that keeps them pruned; preview retention cut to 7 days (canceled and errored to 1, production stays 30); `launch-prep` builds only on `[preview]`; sharp out of the function trace (16.6 MB of 51.1 off every deployment, image optimization verified identical). The lab and admin subdomains are queued as architecture rounds, not savings. |
| **The library phase, round C staged + the one FLIP** | **✅ 2026-09-11 (`d5e9389`)**: the lamps read `--spill-cadence` with a tuner knob for the 8s vs 11s sitting; the rounding knobs on the lab's playground too; the two FLIPs are one. Your three sittings are next (item 1 and item 7). |
| **MILESTONE-22: rounds A and B on prod** | **✅ 2026-09-11 (`ffa12b6`)**: the rules bible, the library's specimens and index, the three hero registers, six single sources, the MonoCaption sweep. Next: round C, your three sittings (the rules pass on `/design/rules`, the rounding on the tuner, the light rulings on the boards), each landed by the Orchestrator; then round D closes the phase. |
| **The library phase, rounds A and B** | **✅ 2026-09-11 (`84cd975`)**: the rules bible on `/design/rules` (433 rules, verdicts pending), the library's missing specimens and the component index, the three hero registers, six single sources, the MonoCaption sweep. Milestone-22 next; then Will's three sittings (round C). |
| **MILESTONE-21: one version again** | **✅ 2026-09-11 (`e2c159e`)**: the marketing branch on prod, the eight integrated manifests deleted, every `lp/*` branch and worktree pruned, `launch-prep` = `main`. The library phase is next, before any track cuts. |
| **Round 3 wave 2: the marketing branch** | **✅ integrated 2026-09-11 (`1e5d693`)**: the feature family on shared pieces (`PageHero`'s two entrances and stage slot, `ScreenLamp`, `FeatureDoor`, one FAQ band), the hub and /features/album to Will's bar, the five other feature pages awaiting their own rounds. Milestone-21 next: the consolidation to one version. |
| **Round 3 wave 1: six agent tracks** | **✅ milestones 18 and 19 (2026-09-02)**: CI on every push, the app and guest surfaces true, the launch runbook's billing half and the legal surface, every job operable from `/admin/jobs`, self-serve account deletion, the demo seed. Each track ran as an Orchestrator-spawned agent on its manifest and integrated in its own window. |
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

- **Prod (partyreel.com)** = `main` @ tag `milestone-24` (`592da24`). **Preview** = `launch-prep` tip at the alias
  above (branch-scoped env + Stripe TEST preview webhook + Supabase redirect + R2 CORS wired).
- **Data:** disposable test data only (3 profiles / 3 events / ~16 media rows). Test accounts +
  fixtures: [`systems/testing-verification.md`](systems/testing-verification.md).
- **Tests:** 1645 green (`pnpm test`); the full gate is typecheck + lint + test + build.
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

**The queue lives in two files now** (2026-09-14, so it survives parallel agents and parallel
reviews): [`tracks/orchestrator.md`](tracks/orchestrator.md) **Waiting on Will** carries every open
ruling with its link and the asks quoted from each board, and [`ASSETS.md`](ASSETS.md) carries every
asset a round has requested, with its spec, the stand-in it replaces and where it stands. The desk at
`/design/c?key=` on the launch-prep alias renders the open boards with their track previews.

**Pending now:** the home hero, round two (the board at `/design/c/home-hero?key=`, three concepts,
read in a FOREGROUND tab; say the concept, its eyebrow, its copy and the departures you rule in; the
wiring round cuts after `kill-mono` lands), and the six boards of the review wave as they hand off.
The asset asks are yours to produce whenever; stand-ins ship first. Everything else waits for the UI
era to land on what it lands on (Will's ruling at milestone-23, 2026-09-12), unless something blocks
or is high-leverage; the parked list moved whole to Waiting on Will.

**Tracks (the wave plan).** Wave 1 (`ci-workflow`, `legal-billing-truth`, `product-truth`,
`ops-hardening`, `account-deletion`, `demo-seed`) and wave 2's `glow-engine-defects` are integrated
(milestones 18 to 21; the record is the CHANGELOG). The library phase closed with the reset;
`design-gallery` and `home-hero` ran in parallel (2026-09-12), the three hero concepts the same way
(2026-09-14). **Now: the review wave**, seven tracks at once (`palette`, `light`, `type-scale`,
`floating-surfaces`, `brand-voice`, `media-kit`, `kill-mono`) with the rounding round on the
Orchestrator's side; then the composition pass and the wiring rounds (the hero's after `kill-mono`),
`voice-infusion` after `brand-voice` is ruled, then `marketing-followons`, the five feature-page
tracks, `marketing-mobile`; the lab and admin subdomains as architecture rounds; then the launch
round in the Launch checkpoint's human order.
(Annual Pro was ruled + built 2026-08-27: $90/$190/$390, two months free; nothing pricing-side remains
open.)

## Pre-launch / human-blocked

The launch-gated tasks live in [`ROADMAP.md`](ROADMAP.md) → **Launch checkpoint** (tagged
`[human]`/`[eng]`/`[content]`). History (what shipped, when, with narrative): [`CHANGELOG.md`](CHANGELOG.md).
