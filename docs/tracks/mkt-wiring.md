---
track: mkt-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "a5c42530"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/privacy-hero/
  - src/app/(dev)/design/sandbox/about-press/
  - src/app/(marketing)/(cinema)/features/privacy/
  - src/components/marketing/sections/features/privacy/
  - src/components/marketing/system/page-hero
  - src/app/(marketing)/(cinema)/about/
  - src/app/(marketing)/(cinema)/press/
  - src/components/marketing/press/
  - src/lib/constants/about
  - src/lib/constants/press
  - src/app/sitemap
  - src/lib/constants/marketing-nav
  - src/lib/constants/contact
  - src/lib/content/llms
  - src/app/llms.txt/
  - src/app/llms-full.txt/
  - docs/systems/marketing-content.md
  - src/app/(dev)/design/(shell)/library/marketing/gallery-demos.tsx
  - src/app/(dev)/design/gallery/playgrounds.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/privacy-hero.json
  - docs/reviews/about-press.json
  - src/components/marketing/jsonld.tsx
  - src/app/keyframe-uniqueness.test.ts
  - public/press/
---

# lp/mkt-wiring

**Goal.** Wire Will's two marketing picks: privacy-hero's lens behind /features/privacy's words, and about-press's press-kit band on /about (facts none) with /press redirected there; both boards retired.

## The brief

**privacy-hero r4: `veil=lens`.** Will's note: "This feels like a far cleaner design. Great work." The lens is a 240px clear pane that rests on things, never faces.
- **Where it goes:** production's home is `src/app/(marketing)/(cinema)/features/privacy/page.tsx`, whose hero is short today with nothing behind it. `page-hero.tsx` already accepts a `backdrop`.
- **The port:** bring the lens from the board's `veils.ts` (`LENS`, `lensKeyframes`, `scrimShape`), `veil-layers.tsx` and `veils.css` into `src/components/marketing/sections/features/privacy/`, minus the lab-only `CANVAS` and `Mode`.
- **Spots:** the board drew only 1440x930 and 375x760, with resting spots placed on objects in the stand-in `wedding-toast`. Choose proportional spots or a set per breakpoint, and say which in your Handoff.
- **Contrast:** measure the words' 7:1 at every width.
- **Keyframes:** keep their names unique (`keyframe-uniqueness.test.ts`).
- **Performance:** a full-screen blur under a moving pane must be measured. Ship a pre-blurred still as the fallback for reduced motion and weak devices.
- **The asset:** round 4 asked for one 2880x1860 photograph. Name it under your Handoff's "Assets requested from Will" (the Orchestrator files the ASSETS row) and ship on the stand-in.

**about-press r1: `kit=band`, `facts=none`.**
- **The band:** the board's `KitBand` (`kit.tsx`) on `/about`, before the closing section, with `id="press"`. It carries four plates, one download and the usage line.
- **The redirect:** `/press` becomes a temporary (307) redirect to `/about#press`, through `redirect()` in `press/page.tsx`, NOT `next.config.ts`. `press/opengraph-image.tsx` goes.
- **The press components:** `components/marketing/press/{press-sheet,press-section,copy-button}.tsx` lose their only user and go.
- **What `constants/press.ts` keeps exporting:**
  - `FOUNDED_YEAR`, imported by `components/marketing/jsonld.tsx`;
  - `PRESS_FACTS`, which feeds `/llms-full.txt`;
  - `PRESS_KIT`, which the band's plates read.
- **References that move to `/about#press`:**
  - `sitemap.ts`;
  - `marketing-nav.ts` and `contact.ts`, with their tests, adding the contact directory's Press row;
  - `src/lib/content/llms.ts` and its test, where `PRESS_BOILERPLATE` moves into the llms builder and the Press link is retargeted;
  - the `llms.txt` and `llms-full.txt` routes.
- **What stays:** `public/press/*`, the zip, `build-press-kit.mjs`, `build-press-qr.mjs` and `press-kit.test.ts`.
- **For the record:** name the ROADMAP lines your change retires (about :41, :230, :231, and :98's Press row) in your Handoff.

**Retire both boards** by deleting their sandbox folders; their ledgers are the Orchestrator's. The Library files you own (`library/marketing/gallery-demos.tsx`, `gallery/playgrounds.tsx`) render `page-hero.tsx`, so follow any change to its props.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; `pnpm lab:demo --board demo-framing --base http://localhost:3133` (it imports the nav); /features/privacy and /about read at 1440, 1024, 768 and 375 with reduced motion in a headless Chrome of your own, the words' contrast measured on the moving lens, a performance trace of the lens at 375; `curl -sI localhost:3133/press` answering 307 to /about#press.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
