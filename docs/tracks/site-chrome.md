---
track: site-chrome
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "ee45b8f3"          # the launch-prep SHA the branch was cut from
board: site-chrome      # round one: the marketing header, the mega panel, the mobile menu and the footer
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/site-chrome/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/marketing-content.md
  - src/components/marketing/chrome/marketing-header.tsx
  - src/components/marketing/chrome/header-shell.tsx
  - src/components/marketing/chrome/marketing-nav.tsx
  - src/components/marketing/chrome/mega-panel.tsx
  - src/components/marketing/chrome/mobile-menu.tsx
  - src/components/marketing/chrome/nav-indicator.tsx
  - src/components/marketing/chrome/nav-indicator-target.ts
  - src/components/marketing/chrome/portal-skin.ts
  - src/components/marketing/chrome/marketing-footer.tsx
  - src/components/marketing/chrome/footer-contract.test.ts
  - src/components/marketing/chrome/footer-demo.tsx
  - src/components/marketing/chrome/footer-glow.tsx
  - src/components/marketing/chrome/footer-qr.tsx
  - src/lib/constants/marketing-nav.ts
  - src/lib/constants/marketing-nav.test.ts
  - src/app/(marketing)/layout.tsx
  - src/app/(marketing)/(cinema)/layout.tsx
  - src/app/(marketing)/(paper)/layout.tsx
  - src/app/(marketing)/marketing.css
  - src/components/shared/logo.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/lib/demo.ts
  - src/lib/constants/ask-ai.ts
  - src/app/(auth)/login/page.tsx
  - src/app/(dev)/design/sandbox/pricing-page/scene.tsx
  - src/app/(dev)/design/sandbox/admin/chrome.tsx
  - src/app/(dev)/design/sandbox/glass/spec.ts
  - src/app/(dev)/design/sandbox/voice/spec.ts
---

# lp/site-chrome

**Goal.** Round one of `site-chrome`: THE MARKETING SITE'S CHROME, the header, the navigation and its mega panel, the
phone's menu and the footer that every marketing page wears, reconceived from the ground up. Will (2026-09-19,
`docs/design/rulings.md`, "the overnight round"): explore every surface, everything unprotected, "at worst, net neutral
and fully deleted". Six to eight decisions with `defineExploration`, each drawn on the REAL chrome pieces (the header,
`MegaPanel` with fixture `NavGroup`s, the mobile sheet, `MarketingFooter`, `FooterDemo` and `FooterQr`) in a true
`Frame` at 1440 and 375 over a real page beneath, a recommendation each, every number measured (the header's height,
the panel's height, the footer's height in windows). **Not in this round:** any production byte; what the header is MADE
of (the `GlassLayer` recipe is `glass` round two's, cut later from Will's notes: this board asks what the chrome holds
and how it behaves, never its blur); the app's own header and nav (`app-shape`); the ratified lines (`voice`); what the
demo door promises (`demo-event`: this board decides only whether and where the ticket and the footer's demo appear);
the bodies of `/pricing`, `/press`, `/contact`; the pages the panel links (`how-it-works`, `help-center`,
`event-type-pages`, sibling lanes: this board owns the labels and the doors, they own the pages).

**What is measured (the tree at the cut).** The header is 64 px (`--mkt-header-h`), sticky, never shrinking: the logo,
three panels (Features, Events, Resources) and a flat Pricing, "Log in" (a ghost, hidden below `sm`) and "Start free",
both to `/login`, and a hamburger below `md`; on paper it is always glass, on cinema it starts transparent over the hero
and crossfades to the same glass on scroll (an IntersectionObserver sentinel and a pre-paint check; an inert layer, never
a filter on the bar). The Features panel: "All features", seven rows, a "New here? See how it works" door to
`/how-it-works`, and a `DemoTicket` when the demo is set; Events: "All events", four rows, a card; Resources: no hub, four
rows (Help center, Blog, Press, Contact) and a card "How Partyreel works / The whole loop in four steps, from the help
center" to `/help/how-partyreel-works` (the article has five steps; the same panel offers two "how it works" doors with
nothing to tell them apart). The phone's menu is a full-screen sheet with the header row mirrored, a single-open
accordion and a foot of "Log in" / "Start free". One measured indicator pill (hover over focus over open, 180 ms). The
footer: a sign-off (the thesis alone when the demo is unset; else the QR, a photo pile and "Open the demo album", with a
secondary "Start free" from `lg`), an index (the brand block, the thesis, an "Ask ChatGPT / Claude" row, four columns,
the FAQ link hard-coded to `/#faq` which exists only on the home and `/pricing`), a legal bar. No newsletter field, no
theme toggle. The chrome has no idea a host is signed in (the only aware branch is `/login`'s server redirect); the
footer's only conversion action and its demo register vanish together when `DEMO_EVENT_URL` is unset; `logo.tsx`'s
`markOnly` branch has no production caller. The pins: `nav-indicator-target.test.ts` (the precedence), `marketing-nav.test.ts`
(the data contract: panels before links, Features and Events mirroring the page registries, Resources mirrored
header-to-footer, every href internal; a reshaped candidate diverges by construction and that is expected),
`footer-contract.test.ts` (the ink surface's tokens, no nested `.dark`, `FooterQr` a server component, `FooterGlow`
pausing through the shared `Glow`); nothing pins a pixel.

**The decisions (suggested; yours to recut, never forced apart).** THE SHAPE (panels, as today; flat links, no panel; the
logo and one door, the rest in the footer); WHAT IT HOLDS (staged after THE SHAPE: four groups, as today; three,
Resources folded into the footer; two and Pricing); THE RETURNING HOST (two doors to `/login` for everyone, as today;
"Dashboard" in the CTA's place when the browser knows a host; the host's avatar and one word); THE PHONE'S MENU (a
full-screen sheet with an accordion, as today; a bottom bar of four; a compact sheet of links only); ON SCROLL (stays at
64 px, as today; shrinks to a rail; hides on the way down and returns on the way up); THE FOOT'S JOB (a sign-off, a
sitemap and a close, as today; the sitemap alone; a second hero around the demo, the sitemap beneath); THE FOOT'S DOOR
(the CTA and the demo vanish together, as today; "Start free" always and the demo when it is set; the demo alone, the
CTA in the header's care); TWO DOORS, ONE LOOP (staged after THE SHAPE: two "how it works" doors unlabelled, as today;
one door; two doors named apart, the page and the article). The `/#faq` link, the dead `markOnly` branch and the
"four steps" card go under Deferred as ROADMAP lines whichever option wins (the count is `how-it-works`'s to settle).

**Binds.** The bible; the standing rulings on the `marketing-identity`, `marketing-decomposition` and
`marketing-hero-substrate` touchpoints as precedent (quote the ones about the header, the nav and the footer in the
board's words); the portal rule in `portal-skin.ts` (the mobile sheet portals to the body and must carry `data-mkt` and
the skin class or its clocks fall back); `usePathname` inside a portaled frame reads the LAB's path (fork the nav with
the active route as a prop, as `sandbox/admin/chrome.tsx` does, or frame a real route with `src`); a breakpoint judged
only inside a true `Frame` (the header's `md` split is meaningless in a plain stage); `FooterGlow` starts paused until
its observer fires (a cropped capture freezes it); the mirror invariants guard the shipped constant only; the copy is
open (bible 21), no em-dashes; reduced motion honoured. `MarketingHeader` already runs standalone in four boards
(`pricing-page/opening.tsx`, `contact-page/page-identity.tsx`, `privacy-hero/hero.tsx`, `album-motion/board.tsx`);
`pricing-page/scene.tsx` is the pattern for a page under a frame with `Reveal` forced. Mobbin is encouraged, never
required: marketing navs, mega menus, mobile menus, footers as sitemaps and as closes.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3135`,
  `pnpm lab:demo --board site-chrome` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 1440 and 375 in a true frame over a real page; a capture of every option beside its words, the
  picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board site-chrome` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
