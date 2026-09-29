---
track: hero-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
