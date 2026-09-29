---
track: crumbs-12
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **Every heading at the face's one weight, card titles included?** The design doc's tiers put card titles at 600
  and sheet, dialog and popup titles came out at 500; his "our standard heavier weight" reads as one weight.
  Recommended and built: 700 everywhere (`font-heading` alone), the tier retired; a heading that should weigh
  otherwise is a change to the utility, which moves every heading at once.
- **The weight rule as a test, where library-lean retired the look-only ones?** Recommended and built: keep it
  (`type-ladder-policy.test.ts`, the third block). It guards a cascade trap rather than a look: the class string
  names the heading face while the stylesheet's order paints a lighter one, it came back twice, and shadcn's
  generator writes a weight onto every title it adds. Overrule by deleting the block.
- **The price qualifiers stay a small muted 500?** "from" and "one-time" beside a price (`price-pop.tsx`'s
  `Qualifier`) and a clip's count unit (`clip-hero.tsx`) inherit the heading face at 500 under a 700 figure.
  Recommended and built: left alone, since a unit inside a figure is not a heading (the price register's own call).
- **/terms reads "By us.We may terminate"** (the same SWC trap as "30days": `legal-terms.tsx`'s Termination
  paragraph, a `</strong>` then a text holding `60 days&rsquo; notice`). Recommended: fix it now, `’` for that one
  `&rsquo;` (a character, no word changes), by the Orchestrator's hand since the legal file is Will's, and delete
  its `DEBTS` entry in `jsx-text-space-policy.test.ts` with it; otherwise the pre-launch rewrite carries it, and the
  scan refuses the shape in the new text.

## System-doc edits (in place, owned facts only)

- `design-system.md` (Type): "Weight rides on the step" (CardTitle 600) becomes one heading weight, 700, whose one
  home is the `font-heading` utility, with the trap that a weight class beside it wins and the policy that refuses it.
- `host-app.md` (The event page), one line in `settings-wiring`'s file, named here as the exception: the cards row
  reads "Highlight reel, Guests, Review, Settings". The order is this lane's fact and this lane merges first.

## Deferred (ROADMAP one-liners, bucket named)

- Now · Marketing: the home's pricing teaser breaks Pro's price after its 9 at 1440 ("from $9" over "/mo"): its
  digits are inline-blocks in a column about 200 px wide (`pricing-teaser.tsx`, `price-pop.tsx`; seen in
  `_scratch/crumbs-12/after/crops/home-pricing-teaser-1440.png`, and at 500 before this lane too) (from `crumbs-12`).
- Now · Lab: `type-ladder-policy`'s weight rule and `jsx-text-space-policy`'s scan both skip the lab, where 19
  `font-heading` lines still carry a lighter weight (the admin-triage, contact-page, disposable-mode and
  event-settings boards, the keyboard bench) and `lab/kit/page.tsx:141` reads "sandbox/<name>/renders bare" (the SWC
  trap); the lab revamp could take both rules in (from `crumbs-12`).
- Refine, not add · Code hygiene ("`pnpm lint`'s four standing warnings"): `contact-form.tsx`'s React Compiler skip
  on `form.watch` is fixed here (`useWatch`), so three remain: `album-fill-grid.tsx`'s two, `review-session.tsx`'s
  `step`.

## Handoff (replaces the chat report)

- **Commits, pushed:** `05a82f75` (the manifest's added claims), `e353af4f` (the work: order, fades, weights),
  `91033d0d` (the system docs), `3319ad63` (the claims for the Orchestrator's addition), `dbc4fbac` ("30days").
  The branch left `origin/launch-prep` at `54bdec34` (records past the manifest's `18491027`). No sync: it has moved
  only by records since (`bbd3df6c` to `77a4bd44`, docs alone). The head is this manifest's commit.
- **Gates on `dbc4fbac`**, each on its own exit code (logs in `../partyreel-wt/_scratch/crumbs-12/gate/final/`):
  `pnpm typecheck` 0; `pnpm lint` 0 (three warnings, none in a file of this lane's: Deferred); `pnpm test` 0 (567
  files, 6,470 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3134` 0 (157
  checks). No board, so no `lab:demo`.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns`, this file,
  `design-system.md` (a system-doc fact) and `host-app.md` (the one-line exception above). `theme.css` and
  `marketing.css` return untouched: the lost weight lived in class strings, not in the ladder or the marketing sheet,
  and `globals.css` changed in comments only.
- **1 · The order.** `EVENT_ROOMS` (`src/lib/event/sections.ts`) is reel, Guests, Review, Settings; the row, the
  phone's grid (it fills by rows: reel and Guests over Review and Settings, `_scratch/crumbs-12/fades/harness-375-*.png`)
  and the help's picture follow. The picture (`desk-screens.tsx` `reel-card`) draws `EVENT_ROOMS`' first two doors in
  order, the reel card marked wherever it sits (`before/crops/help-reel-card-step-1440.png` against `after/…`); its
  caption and its step's words stay true. Pinned: `event-hub.test.tsx` "runs in his order". Not done, and why:
  `content/help/your-event-page-explained.mdx` still names the cards in the old order (its description and "The
  cards"); `content/help/` is `settings-wiring`'s, whose words sweep can take it (a relay).
- **2 · The fades.** The scroller moved to `edge-fade-scroller.tsx`: `toggleAttribute` for each flag, and a measure
  after every render. `event-hub.test.tsx` drives it (no fade on a row that fits, the right at the start, both in the
  middle, the left at the end, the re-measure): on the old `dataset = undefined` code all three fail, without the
  re-measure one does (run). The source pin that read the flags' names, green for the bug's whole life, is reshaped
  with its scar. A throwaway harness route (deleted) drove the real scroller over `room-card.ts`'s real shells in
  headless Chrome (`_scratch/crumbs-12/fades/fades.txt` and PNGs): the four doors fit at rest at 1440, 1024, 768, 640
  and 375 (no fade anywhere, the phone's grid included); once the Invite pill joins, the tiles at 768 and 640 and the
  stuck pills at 375 run past the screen and fade right at the start, both ways mid-row and left at the end, each
  read off the computed mask. The built CSS carries the rules. Not seen on the real hub: it cannot be signed in
  locally, and the alias runs `launch-prep`.
- **3 · The thin headings.** The source: a stock `font-medium`/`font-semibold` beside `font-heading` wins, because
  Tailwind emits the custom `@utility` ahead of the stock weights (compiled with Tailwind's own `compile`). The weight
  classes left CardTitle (600), DialogTitle, SheetTitle and both PopupTitles (500), the quiet EmptyState (400), the
  hub's card labels (`event-cards-row.tsx`, `reel-card.tsx`), the contact and application receipts, the admin list
  titles, the reel's "Scan to add yours", the keep offer's "Sent", the guest peek's name, the home and /pricing FAQ
  questions (the button inside the h3), the home teaser's and the configurator's prices, the help and /reel pictures
  of those, and the Library's ladder and identity specimen. Census (headless Chrome, every Urbanist text's computed
  weight, 1440 and 375; `before/census.json`, `after/census.json`): off-weight lines 10 on /pricing, 18 on the home,
  2 on the help article, 2 on /reel and 7 in the Library before; after, only the price qualifiers (a question above)
  and the lab shell's badges. /contact, /features/curation, a blog post (its prose h3), /about, /press, /careers,
  /how-it-works, /features/qr and the demo album read every heading at Urbanist 700 (`after-extra/`, `after-demo/`).
  Crops at 1440 and 375 in `before/crops/` and `after/crops/`. The contact page's directory titles were already 700
  in production: the small, thin ones Will saw were the board's (`beside.tsx`), which contact-wiring replaces. The
  guard: `type-ladder-policy.test.ts` refuses a weight class beside the face across `src/` outside the lab's boards
  and tools (it failed on a CardTitle `font-semibold` and an EmptyState branch's `sm:font-normal`, put back to test).
  `contact-form.tsx`'s `form.watch` became `useWatch` (the warning in a touched file; picking a topic still shows its
  hint, driven headlessly).
- **4 · "30days" (the Orchestrator's addition).** The cause is SWC: it drops the leading space of a JSX text after an
  expression or an element when the text runs over several lines and holds an entity, and a `{" "}` does not hold
  (prettier folded it back on both sites). So each window and its word are one string (`{`${N} days`}`) in the
  host's Remove confirm and both times in the reports lede; the build ships "restore it for ", `${…} days`, ". Guests"
  and "back for ", `${…} days`, ", then" (grepped in `.next`). `jsx-text-space-policy.test.ts` compiles through SWC
  itself, since this runner's JSX transform keeps the space (a render here read "30 days" on the broken code): SWC's
  premise, both sites compiled and rendered (both fail on the old code, run), and a scan of `src/` outside the lab. The
  scan found one more in production, `/terms` (a question above, carried as the test's one debt), and one in the lab
  (Deferred). `live-album-stage.tsx:184` is one line and reads right in the built chunk.
- **Assets requested from Will:** none.
- **Board ideas:** the price qualifiers and a clip's count unit ride the heading face at 500 under a 700 figure; a
  board could ask whether a unit wears the heading face at all.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Relays to running lanes:** `settings-wiring`, the help article's card order (item 1) and its board's `hub.tsx`
  drawing the row's labels at 500; `disposable-mode` r2, its `host.tsx:445` draws the row's label at 500 where
  production's is 700 from this merge.
- **Calls his to overrule:** every card title at 700 (was 600: settings, /pricing, the Library); sheet, dialog and
  popup titles at 700 (was 500, the phone bar's title too); the quiet empty state's title at 700 (was 400: the public
  profile's empty line); the FAQ questions at 700 (was 600); the home teaser's and the configurator's prices at 700
  (were 500 and 600), matching /pricing's cards; the help's picture of the row opening on the reel card, Guests beside
  it ("24 guests" a placeholder).
- **Look at first:** the hub at 1440 (the reel card first, no fade at rest) and on a phone (reel and Guests over
  Review and Settings; stuck with the Invite pill, a fade only toward what is hidden); a settings card and the
  settings sheet's title at 700; the home's FAQ and pricing teaser. For the next red-team: the hub at 1440, 768 and
  375, resting and stuck, with and without the Invite pill; the host viewer's Remove confirm ("restore it for 30
  days"); `/admin/reports`' lede.
