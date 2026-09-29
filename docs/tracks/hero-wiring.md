---
track: hero-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "f83c6500"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/home/cinema-hero
  - src/components/marketing/sections/home/hero-stream
  - src/components/marketing/system/demo-ticket
  - src/app/(dev)/design/sandbox/hero-card/
  - src/app/(dev)/design/(shell)/library/marketing/gallery-demos.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/hero-card.json
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/hero-wiring

**Goal.** Build Will's `hero-card` round 2 answers into the home hero: the `guests` card as its object, the domain quieter so the slug leads, the bloom light behind it, and the composed tablet geometry; then retire hero-card.

## The brief

**His answers** (`docs/reviews/hero-card.json`, r2; the drawings in `src/app/(dev)/design/sandbox/hero-card/`: `cards.tsx`, `hero.tsx`, `tablet.ts`):
- `card=guests`, his note: "This option does a lot of small things 'right' ... Guest on the photos shows clear credits/guests feature, the split link feels less bulky (top partyreel link could be a subtler color to put focus on slug), QR taller because of the split link, feels much cleaner overall. Really like this mini digital invite-esque card direction to represent our platform."
  - The card becomes the hero's object (`DemoQr` in `sections/home/cinema-hero.tsx` mounts it; `demo-ticket.tsx`'s `DemoFrame` leaves the hero), and the band streams out of it on `hero-stream.ts`'s tables.
  - Its `partyreel.com/` sits a quieter tone than the slug, as his note asks.
  - Pressing it still opens the demo (the demo modal at a desk, a new tab on a phone: demo-doors' rule).
- `light=bloom`: the lamp behind the band, never over a photograph, its turbulence filter mounted where it renders.
- `tablet=tablet`, his note: "This looks phenomenally better than simply rounding tablet to either desktop or phone." The composed third table (`tablet.ts`, with its axis solved for an upright tablet) joins `hero-stream.ts` at tablet widths.
- The carried calls hold: the card stands still, the address as drawn, the floor at the band's axis on tall screens.

**The hero is the first paint:** keep it fast (the images as the band's are, one priority image at most, no layout shift), and read LCP and CLS before and after.

**Assets:** `docs/ASSETS.md` rows 33 and 34 unpark on this pick. Say in your Handoff what `guests` needs (the round said four portraits, one per print, and its album photographs); the Orchestrator updates the rows.

**Paths:** `pricing-wiring` holds `pricing-teaser.tsx` and `privacy.tsx` in `sections/home/` this batch: never edit them. Add any other path to `owns` before editing it (the chrome's `mega-panel.tsx` also mounts the demo's frame; `help-wiring` is queued to own the chrome, so touch it only if a signature must change, and say so in the Handoff).

**Then retire `hero-card`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's. `kit/`'s screens are re-captured after the next milestone, not by you.

**Verify:**
- The home at 1440, 900 by 1200 and 375, light and dark, reduced motion.
- `pnpm lab:smoke` whole.
- The live pass is build 17's red-team.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The address the card prints resolves to nothing, and anyone can claim it.** No event holds `mia-and-theo` (read on
  2026-09-28: the demo event's slug is `partyreel-demo`), so a visitor who types the homepage's address gets the 404,
  and any Pro or Event Pass host could claim the slug later and put a stranger's album behind an address our homepage
  prints (`RESERVED_SLUGS` is the app layer's, and `set_event_slug` is callable directly). **Recommended:** the demo
  event claims `mia-and-theo` (one row, the Orchestrator's: the unique index then holds it for good, and the typed
  address lands on the demo the card opens); nothing prints `partyreel-demo`. Built meanwhile: the address as drawn
  (the carried call). The fallback is `mia-and-theo` in `RESERVED_SLUGS`, which only closes the share sheet's door.

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`, "The demo's doors are objects built for their places": the home hero's door is
  the link card (the faint domain, the prints and their guests, its code the short `/demo` door and a symbol); `DemoFrame`
  is the Features pane's alone.
- `docs/systems/marketing-content.md`, "Every pointer to the demo is a demo door": the hero's object leaves the list of
  plain links.

## Deferred (ROADMAP one-liners, bucket named)

- Marketing: the base geometry's block sets its headline in three lines from about 470 to 767 wide (405 px against
  the 361 `GEO.base.blockH` is solved with, measured), so a short window at those widths runs the actions past the
  fold; a base `blockH` taken at 767, or a step in `h1Max`, ends it (from `hero-wiring`).
- Marketing: `chrome/mega-panel.tsx`'s note still calls `DemoFrame` "the object every demo door now shares"; it is the
  Features pane's alone since the link card took the hero, a line for the chrome's next owner (from `hero-wiring`).

## Handoff (replaces the chat report)

- **Commits**, pushed to `origin/lp/hero-wiring`: `a59f2cd5` retires hero-card; `bd4a61ac` this file (the Library's two
  entries into `owns`); `c9cbe3ba` the work; `ce76844f` the sync (origin/launch-prep at `62938ef6`: `registry.ts` and
  `touchpoints.ts` conflicted on the other lanes' retirements, resolved with host-storage, event-safety and hero-card
  all out); then this file alone.
- **Gates on `ce76844f`**, each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (4 warnings, all in files this
  lane never touched: `lab/_desk/review-session.tsx`, `contact/contact-form.tsx`, `features/album/album-fill-grid.tsx`);
  `pnpm test` 0 (530 files, 6019 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3133` 0 (197 checks, 0 failing). No board, so no `lab:demo`. The retirement was gated alone too (the
  work stashed): typecheck 0, lint 0, test 0 (520 files).
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = the owned paths and this file, plus
  `sandbox/registry.ts`, `(shell)/lab/boards.ts` and `touchpoints.ts` (the retirement's named exceptions) and
  `docs/systems/marketing-content.md` (the two facts under System-doc edits). `mega-panel.tsx` is untouched: `DemoFrame`'s
  sizes are `row` and `nav` now (the hero's two left with it) and the pane's `size="nav"` call is unchanged.
- **Items**:
  - The link card (`sections/home/cinema-hero-card.tsx`) is the hero's object, the `guests` drawing: ONE card in the
    markup, every length `calc(base + var(--hhs-k) * (lg - base))` with the sheet setting `--hhs-k` to 0, `TABLET_STEP`
    and 1, so its four prints load once and eagerly, as the band's lit frames do; `partyreel.com/e/` is `text-faint`
    over the slug in ink.
  - Pressing it is a `DemoDoor` (`source: hero-card`): at 1440 it opened the demo modal (`aria-haspopup=dialog`,
    `_scratch/hero-wiring/click-desk.png`), at 375 a new tab on the demo's URL. The retired `DemoQr` was a same-tab
    `Link` firing `cta_click` `demo-qr`.
  - The bloom (`CardLamp`, `cinema-hero.tsx`: the drawing's `Glow shape="bloom"`) is the section's first layer at the
    card's point, under every frame; its filter is the root layout's `GlowFilter`, in the same document (no `[Glow]`
    tripwire on the home or on the Library's specimen).
  - `hero-stream.ts` carries three geometries (`Geometry`: base, tablet from 768, lg from 1024). The tablet's table is
    `tablet.ts`'s, composed between the two ends with `axisPct` 38, and its block MEASURED: `blockH` 345, the tallest the
    range sets (at 1023; the drawing assumed the desk's 384), `blockW` 529 over 498px of ink at 900. One node set still
    serves all three (nine a side in each, tested); `Bp` stays as the two ends the album stream and the privacy field
    read.
  - The object's table (`OBJECT`: base and lg as drawn, the tablet composed) and its painted reach (`overOf`, the
    third print's face) are in `hero-stream.ts`, and the axis's floor is solved from the card: `axisMin` 133, 133 and
    128, so the hero's floor is 713 at a desk (744 before: a 720 laptop fits it whole again, the card 24px under the
    header's band, `_scratch/hero-wiring/short1440-1.png`) and 626 on a phone (650).
  - The card stands where the drawing does (the sandbox's `max()`, in the sheet's `.hhs-object`), read on the render: its
    box at 187 to 365 at 1440 by 900, 329 to 483 at 900 by 1200, 153 to 283 at 375 by 812, as the model says; a live
    resize across 767/768 and 1023/1024 swaps every size with no error (`_scratch/hero-wiring/resize.mjs`).
  - Tests: every band test runs on the three geometries; the scannability test became "the card's code draws as a
    code" (a whole pixel a module: the reason it had to scan left with the bare code); the 720 laptop's give-up is
    dropped; new ones hold the card under the header at the floor, the axis inside it and the block under it at every
    height, the inset over a frame's solid half-height, the tablet card as the composition, the prints' shared turns and
    their photographs in the manifest.
  - `demo-ticket.tsx`: `DemoFrame` is the nav pane's and the Library's; its notes rewritten. The Library's CinemaHero
    lede and hint and the demo-ticket entry say what exists.
  - Verified local, dark and light, motion and reduced, scripting off (the noscript rule's three geometries) at 1440 by
    900, 1440 by 720, 1440 by 1200, 1024 by 768, 900 by 1200, 900 by 700, 768 by 1024, 375 by 812 and 320 by 568:
    `_scratch/hero-wiring/{final1440,dev900,final375,final900light,red1440,red900,red375,light1440,light375,
    short1440,tall1440,win900,w768,w1024}-1.png`, `nojs-{1440,900,375}.png`, `resize-320.png`.
- **First paint**, local production builds, cache off, before (`62938ef6`) and after interleaved twice on :3133
  (`_scratch/hero-wiring/ab.sh`): LCP median 96 to 96 ms at 1440 by 900, 114 to 124 at 900 by 1200 (2x CPU), 128 to
  146 at 375 by 812 (4x CPU); CLS 0 in every run of both; the LCP element unchanged (the headline; the sentence at 375).
  The home's HTML +884 B gzipped; image preloads 13 to 17 (React preloads every eager image; none is preloaded by hand).
  The shared machine's noise is about 20 ms, and hiding the lamp measured the same. The card's stand-ins are three of
  the band's twelve, so Chrome reuses the band's cached 384w files for them and three of its four 96w preloads go
  unused (a console warning), until row 33's own photographs land.
- **Assets requested from Will**:
  - The card's album · four photographs of one wedding, one grade, 4:5 masters at 960x1200, legible at 68px wide (a
    print's window is 68x86 on a phone, 96x122 at a desk), none of them one of the band's twelve, one a toast a guest
    filmed (it wears the play mark) · replaces `OBJECT_PRINTS`' photographs (`hero-stream.ts`: wedding-petals,
    wedding-rings, reception-table, wedding-toast) · ASSETS row 33 (it asked six for round one's card).
  - Four guest portraits · square 256x256, one grade, a face centred and legible at 19px (26 at a desk), one per print ·
    replaces the seeded avatars (`OBJECT_PRINTS`' seeds) · ASSETS row 34 (it asked three).
- **ROADMAP lines this ends**: "the home hero's `axisMin` is solved for the old bare 144 px code" (done); "the demo
  pointers still plain same-tab links" loses the home hero's object (the event objects, /how-it-works' proof and the
  footer's phone link remain); the hygiene line's `cinema-hero.tsx:57-69` and `hero-stream.ts` (rewritten); the other
  hygiene line's `demo-ticket.tsx` comments and `gallery-demos.tsx` text (done; `components/lab/scene.tsx` remains).
- Board ideas: none beyond the Question and the two Deferred lines.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none (the Question's claim is one data row, the
  Orchestrator's, if taken).
- **Calls his to overrule**:
  - The domain in the faint step (the house's caption grey, 3.2:1 on paper), the quieter tone his note asked for,
    rather than a hand-set alpha.
  - The tablet's block measured (345) where the drawing assumed the desk's 384: nothing moves at 900 by 1200; a short
    window at tablet widths sits the composition 39px lower.
  - The axis's floor solved for the card: a short desk window fits the hero whole with the card 24px under the header,
    where the old floor gave it 38 and scrolled 24px.
  - The card's press counts as `demo_open` (`hero-card`), one of the demo's doors, where the plate's was a
    `cta_click`.
- **Look at first**: `/Users/gibby/local/ai/partyreel-wt/_scratch/hero-wiring/final1440-1.png` beside the drawing he
  picked (`sandbox1440-1-1.png`), `dev900-1.png` beside `sandbox1440-1-2.png`, then `short1440-1.png`.
