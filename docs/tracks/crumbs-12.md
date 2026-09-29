---
track: crumbs-12
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "18491027"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/event/sections.ts
  - src/components/app/event-feed/event-cards-row.tsx
  - src/components/app/event-feed/event-hub.test.tsx
  - src/app/theme.css
  - src/app/(marketing)/marketing.css
  - src/app/globals.css
  - src/lib/type-ladder-policy.test.ts
  # Added at boot, where the brief's items live outside the cut's claims:
  - src/components/app/event-feed/edge-fade-scroller.tsx   # the row's scroller, its own module so a test can mount it (item 2)
  - src/components/marketing/help/step-screens/desk-screens.tsx   # the help's picture of the row follows the order (item 1)
  - src/components/app/event-feed/reel-card.tsx            # the heading weight's sources (item 3) from here down
  - src/components/ui/card.tsx
  - src/components/ui/dialog.tsx
  - src/components/ui/sheet.tsx
  - src/components/ui/popup.tsx
  - src/components/shared/empty-state.tsx
  - src/app/(marketing)/(paper)/contact/contact-form.tsx
  - src/app/(marketing)/(cinema)/careers/[slug]/application-form.tsx
  - src/components/admin/applicants-list.tsx
  - src/components/admin/support-list.tsx
  - src/components/guest/reel/live-reel-view.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/social/guest-peek.tsx
  - src/components/marketing/help/step-screens/door-screens.tsx
  - src/components/marketing/sections/home/faq-accordion.tsx
  - src/components/marketing/sections/home/pricing-teaser.tsx
  - src/components/marketing/sections/pricing/configurator.tsx
  - src/components/marketing/sections/reel/clip-section.tsx
  - src/components/marketing/sections/reel/screen-section.tsx
  - src/app/(dev)/design/(shell)/library/foundations/page.tsx
  - src/app/(dev)/design/(shell)/library/foundations/type-ladder.tsx
  # The Orchestrator's addition (build 20's red-team): "30days" in two places
  - src/components/shared/media-lightbox-parts/actions.tsx  # the host's Remove confirm
  - src/app/admin/reports/page.tsx                          # the reports lede
  - src/lib/jsx-text-space-policy.test.ts                   # the SWC trap's test
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/design-system.md
  - docs/systems/host-app.md
  - docs/reviews/event-settings.json
  - docs/reviews/contact-page.json
---

# lp/crumbs-12

**Goal.** Three of Will's direct fixes: the hub row reordered (Highlight reel, Guests, Review, Settings), its edge fades showing only where more of the row is hidden, and the thin headings restored to the standard heavier weight at their source.

## The brief

Three of Will's direct fixes from build 19's sitting (2026-09-29).

**1. The hub row's order** (his `event-settings` `queue` note: "the highlight reel card should be the first in the host events features row/grid. Then Guests, then Review, then Settings"). `EVENT_ROOMS` in `src/lib/event/sections.ts` is the one home; the help's step screens (`src/components/marketing/help/step-screens/desk-screens.tsx`) read it, so check their captions and pictures follow. The phone's 2x2 grid becomes reel and Guests over Review and Settings.

**2. The row's edge fades** (the same note: "those shadows were meant to be conditional when the row ran offscreen, not exist in the default desktop view ... conditional per scrollable side, so if you're at the first/last that shadow disappears"). The code already means that, but `Scroller` in `src/components/app/event-feed/event-cards-row.tsx` writes `el.dataset.overflowLeft = cond ? "" : undefined`: assigning `undefined` to a dataset key stores the string "undefined", so `data-[overflow-left]` matches at every width and both fades always show. Remove the attribute instead (`delete el.dataset.x`, or `toggleAttribute`). Test it: a row that fits shows no fade; scrolled to the start, the left fade is gone; at the end, the right. The row scrolls on a tablet and when it sticks on a phone; unstuck on a phone it is the grid.

**3. The thin headings** (his `contact-page` `beside` note: "The headings seem quite small and thin ... I have no idea where the thin app heading weights (maybe on the h3, h4?) came into play, but it looks very bad compared to our standard heavier weight"). Trace where headings lose weight across the app and marketing (the contact page's directory titles, `text-subsection`, are one case; the ladder's small steps in `src/app/theme.css`, the `font-heading` utility in `src/app/globals.css`, or a component's own class) and restore the standard heavier weight at the source, so every heading follows at once. Keep the ladder's order and its tests (`src/lib/type-ladder-policy.test.ts`): a test reshaped on purpose keeps its scar and says why. Before and after captures at 1440 and 375 of the pages it touches (the contact page, a feature page, the hub, a settings card).

**Not yours:** `settings-wiring` runs beside you on the hub's card data (`room-card.ts`, the hub page) and all of settings; leave them to it. `theme.css`, `marketing.css` and `globals.css` are released to you for this lane and return to the Orchestrator at your merge.

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

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
