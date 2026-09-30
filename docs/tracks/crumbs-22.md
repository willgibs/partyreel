---
track: crumbs-22
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "39426a2f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  # the brief's own (item 1: the 404's sheet)
  - src/app/not-found.tsx
  - src/components/shared/trail/
  # items 2 and 3: the FAQ (find-in-page; the thin wrapper gone)
  - src/components/marketing/faq-accordion.tsx
  - src/components/marketing/faq-accordion.test.tsx
  - src/components/marketing/sections/home/faq-accordion.tsx   # deleted
  - src/components/marketing/sections/home/faq.tsx             # a caller of the wrapper
  - src/app/(marketing)/(cinema)/pricing/page.tsx              # the other caller
  - src/components/marketing/sections/pricing/pricing-page.test.ts
  - src/app/(marketing)/marketing.css                    # content-visibility joins the panel's collapse clock
  # item 4: the reduced mail
  - src/lib/email/templates.ts
  - src/lib/email/templates.test.ts
  # item 5: one useHydrated (its home, and all eight copies)
  - src/lib/shared/use-hydrated.ts
  - src/lib/shared/use-hydrated.test.tsx
  - src/lib/shared/use-hydrated-one-home.test.ts
  - src/app/(marketing)/(cinema)/contact/contact-form.tsx
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/app/event-feed/bulk-bar.test.tsx      # its source pin named the retired inline store
  - src/components/app/share/event-share-provider.tsx
  - src/app/(dev)/design/theme-toggle.tsx
  - src/components/guest/entry-modal.tsx                 # copy 5 of 8
  - src/components/app/user-menu.tsx                     # copy 6 of 8
  - src/components/dev/motion-tuner.tsx                  # copy 7 of 8
  - src/lib/use-media-query.ts                           # one comment named entry-modal's flag
  - src/components/guest/event-experience.tsx            # one comment named the two inline flags
  # item 6: one layerIsUp (its home, and the four copies)
  - src/components/ui/layer-is-up.ts
  - src/components/ui/layer-is-up.test.tsx
  - src/components/app/event-feed/review-keys.ts
  - src/components/admin/report-queue.tsx
  - src/components/shared/masonry.tsx
  - src/components/shared/claim-ask.tsx                  # the fourth copy, merged in by shared-claims (6e53b319); nobody holds it now
  - src/components/ui/popup-kinds.ts                     # the alertdialog note points at layerIsUp
  # item 7: the refresh-then-write audit
  - src/lib/history-entry.ts                             # the header's edge note, refined with what was measured
  - src/lib/refresh-then-write-policy.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
---

# lp/crumbs-22

**Goal.** Seven small ROADMAP items: the 404's sheet no longer preloaded on every page, a closed FAQ answer found by find-in-page again, the FAQ's thin wrapper gone, the reduced mail's contradiction reworded, one useHydrated and one layerIsUp in one home each, and the refresh-then-write reload audited on the guest page.

## The brief

Seven items the ROADMAP holds, each fixed at its root with a test that fails on today's code where a test can hold it:

- **Every page preloads the 404's sheet.** A root `not-found.tsx`'s CSS is preloaded on every route (`/`, `/pricing`, `/help`, `/login`, `/about`): `src/components/shared/trail/trail.css`, one "preloaded but not used" warning a load, site-wide. Fold the trail's rules into the global sheet or load the 404's `Trail` lazily, whichever keeps the 404 drawn as today, and read the warning gone in a browser.
- **Find-in-page no longer opens a closed FAQ answer.** A closed answer is `inert`, so on /events and /features the browser's find skips it, as the native `<details>` never did. `hidden="until-found"` with a `beforematch` handler that opens it is the accordion's form of that. Keep the one-open-at-a-time behaviour and the headings.
- **`HomeFaqAccordion`** (`sections/home/faq-accordion.tsx`) is a thin wrapper over `FaqAccordion`, kept only because `pricing-page.test.ts` pins its name: delete it and pin `FaqAccordion`.
- **The reduced mail contradicts itself.** It says "You're over your limit, so upgrade or free up space first, then restore them" just after saying the removal brought the account back under its plan. It means a restore would put it over again, so say that (`src/lib/email/templates.ts`; the email tests and the voice's rules hold).
- **`useHydrated` has four per-file copies** (`contact-form.tsx`, `event-feed/bulk-bar.tsx`, `share/event-share-provider.tsx`, the lab's `theme-toggle.tsx`): one `useSyncExternalStore` hook in one home ends them.
- **"Another layer is up" is hand-rolled three times** (`review-keys.ts`, `report-queue.tsx`, `masonry.tsx`), and two missed `alertdialog` until `crumbs-20`: one `layerIsUp()` in one home keeps them in step.
- **A refresh followed by an address write reloads the page.** Next reloads when a `router.refresh()` is followed within about 20 ms by a write that applies a URL on an entry the client pushed. `crumbs-16` found it and no caller was audited. `guest/event-experience.tsx` refreshes the most. Audit every handler that refreshes and writes the address together (`lib/history-entry.ts` now holds whose an entry is), fix any that can meet it, and pin what you find.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- the 404 and the FAQ's find-in-page driven in a browser on your dev server.

**Paths:** your owns are a start (the two one-home hooks' files included once you name them). A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The hub's Settings reel switch and its own back arrow race, and the page reloads.** The audit found it and I built no fix. No handler refreshes and then writes the address (`refresh-then-write-policy.test.ts` pins that over all 46 `router.refresh()` calls); the exposure is two gestures inside one round trip: `settings-state.tsx` refreshes after the reel switch, and a tap on the page's back arrow (`entry.replace`, a native `replaceState` with a URL) before the refresh lands discards it and reloads onto the same URL, nothing lost. Recommended: leave it (the flash is rare and mild; the Deferred line carries the fix). The two ways to end it are design choices inside the hub: hold the address write until the refresh's transition settles, or refresh when the sheet closes (which would lose the Reel card updating beside the panel at a desk). His call if the flash is worth either.
- **The 404's trail loads lazily; it was not folded into `globals.css`.** The brief allowed either; both end the preload (measured on `next start`). Lazy adds nothing to any page's stylesheet and takes the trail's code (about 3 KB gzipped) off every route; the fold would have kept the 404 byte for byte and added about 1 KB of CSS to every page. Built: lazy (`trail.lazy.tsx`). His to overrule: the fold is the `@import` and dropping the wrapper.
- **The reduced mail's sentence.** "You're over your limit, so upgrade or free up space first" became "Putting them all back would take you over your plan again, so upgrade or free up space first" (`templates.ts`). The voice's and his to reword.
- **A closed FAQ answer is found by find-in-page where the browser has `hidden="until-found"` (Chromium, Firefox); Safari has not shipped it and keeps `inert`, so its find still skips them.** Recommended: accept it (a native `<details>` would have been found in Safari, and the pick left `<details>` for the heading-in-summary trap).

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the confirm's role bullet: anything asking whether a layer is up asks `layerIsUp()` (`ui/layer-is-up.ts`, the one home of the roles), not a selector.
- `docs/systems/marketing-content.md`: the FAQ bullet (a closed answer is `hidden="until-found"` where `onbeforematch` exists, its `beforematch` opens the question, React writes any `hidden` string as a plain `hidden`, the collapse's `content-visibility` clock, `inert` elsewhere) and the root 404 bullet (the trail loads lazily, and why: a root `not-found.tsx`'s tree rides every route's payload).

## Deferred (ROADMAP one-liners, bucket named)

- Marketing (performance): the root 404's whole tree rides every route's payload (Next serialises each layout's `not-found` into it): against a root 404 that renders nothing, `/login`, `/pricing`, `/about` and `/help` each carry about 110 KB more HTML (16 to 23 KB gzipped) and 43 to 56 KB more gzipped JS (10% of `/login`'s), on `next start` with the trail already lazy (its own code had added 3 KB more), so the fix is structural (a self-contained `global-not-found`, or the 404's chrome behind one client boundary), and the guest album, not measured, carries it by the same mechanism (from `crumbs-22`).
- Marketing: the 404 itself warns "preloaded but not used" four times a load (`marketing.css` and the home hero's, river's and backdrop's sheets): its header and footer links prefetch `/`, `/pricing`, `/login`, `/contact`, `/features` and `/help` and the client preloads their sheets unused; unrelated to the trail, present before and after (from `crumbs-22`).
- Host: the hub's Settings reel switch refreshes the router, and a tap on the page's back arrow or a row inside the refresh's round trip reloads the page (a native `replace` on an entry the hub pushed discards the pending refresh; measured with the same calls on `/pricing` under `next dev`, the matrix in `lib/history-entry.ts`'s header); write first and refresh after, or hold the address write until the refresh's transition settles (from `crumbs-22`).
- Housekeeping: `ui/popup.tsx`'s `EPHEMERAL_LAYER` spells the menu and listbox pair `ui/layer-is-up.ts` holds (`EPHEMERAL_ROLES`); `popup.tsx` is `crumbs-23`'s, so it was left (from `crumbs-22`).

## Handoff (replaces the chat report)

- **Commits, pushed:** `e9fcb167` (the work), `ede92506` (the 404's trail lazy instead of folded; `popup.tsx` and `globals.css` back to launch-prep's bytes), `36cf6901` (the refresh-then-write policy's `ALLOWED` list), `009f2682` (a doc fact's wording), `3c18e35d` (gate 88's timeout: the refresh-then-write scan parses only the files that say `refresh`), `d7b97e85` (a sync: `shared-claims` had merged into launch-prep at `6e53b319`), `26685002` (gate 90's catch: `claim-ask.tsx`, new from `shared-claims`, wrote a fourth dialog selector by hand at line 37; it now asks `layerIsUp({ except: "[data-claim-ask]" })`, its own marked confirm left out, and it also waits behind an open listbox, none of which is in the DOM at rest on the (app) layout or the album page: the palettes' lists and Radix Select's options exist only while open), `5295680c` (a sync to `2228b119`: types and records; `perf-404`'s manifest, briefly on launch-prep, is not in the tree), then this manifest alone. `crumbs-23` owning `ui/popup.tsx` is why `ede92506` gave it back (the lane guard refuses two live owners); `claim-ask.tsx` joined `owns` because `shared-claims` is merged and nobody holds it.
- **Gates on `36cf6901`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (634 files, 7,517 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3135` 0 (175 checks, 0 failing, on `pnpm dev`) and 0 under `next start --production` (181, 0 failing). No board, so no `lab:demo`. Gate 88's integration timed out the tree scan of `refresh-then-write-policy.test.ts` at 5.6 s (vitest's default is 5 s; load 12): `3c18e35d` gives it a cheaper scan and no timeout, reading each file once (shared by the file's two tree tests) and parsing only the about fifty that say `refresh` (0.2 s a tree test at load 9, where they had taken 1.7 and 2.5 s at load 15; a file without the word cannot hold a refresh); on it `pnpm typecheck` 0, `pnpm lint` 0 and `pnpm test` 0 under the build lock (634 files, 7,520 tests, the three new ones pinning the prefilter's spellings), and no non-test file changed since `36cf6901`, so the build and the smoke stand. The two sibling whole-tree scans (`use-hydrated-one-home.test.ts`, `layer-is-up.test.tsx`) are unchanged: 0.7 and 0.9 s alone at load 12. The lab:smoke PREMISE lines name three boards whose asks describe `marketing-content.md` (about-press, demo-framing) and `event-experience.tsx` (disposable-mode): what changed there is a doc fact on the FAQ and the 404 and one comment. Gate 90 (the Orchestrator's) was green but for the layer policy's scan finding `claim-ask.tsx:37`; on `5295680c` plus this manifest `pnpm typecheck` is 0, `pnpm lint` 0 (no warnings) and `pnpm test` 0 under the build lock (635 files, 7,554 tests, `claim-ask.test.tsx`'s calm-moment wait among them), and the one product file changed since the build and the smoke ran is `claim-ask.tsx`, whose only edit is the selector.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): 40 files plus this one, every one under an `owns` prefix except the two system docs listed above; `src/components/guest/event-experience.tsx` (a comment), `src/lib/use-media-query.ts` (a comment) and `src/components/ui/popup-kinds.ts` (a comment) are in `owns` for that.
- **The items, one line each** (each test red on the old code where a test can hold it, and named):
  1. **The 404's sheet no longer preloaded on every page:** `not-found.tsx` draws the trail through `trail.lazy.tsx`, a client module's `next/dynamic` import (a real split), so the trail's code and `trail.css` load with the 404 and on no other route; `trail-lazy.test.ts` walks the 404's eager import graph (red against `origin/launch-prep`'s `not-found.tsx`: four failing, the sheet, the trail's code, the wrapper, the lazy edge) and `trail.lazy.test.tsx` holds the wrapper. Read in a browser on `next start`: `preload as=style` 0 in the HTML of `/`, `/pricing`, `/help`, `/login`, `/about`, `/events`, `/features/album`, and no warning on a fresh tab at `/pricing`; the 404 draws with the computed styles it had (20 cards, `.trl-*` values equal to the baseline read on dev), at 1440 and 375 by screenshot, its server HTML holding the stage, the words and the lazy sheet.
  2. **A closed FAQ answer is found by find-in-page again:** `faq-accordion.tsx` sets `hidden="until-found"` by hand on each closed panel (React 19.2 writes any `hidden` string as a plain `hidden`, measured with `renderToStaticMarkup`) where `onbeforematch` exists, listens for `beforematch` on the list and opens that question (one open at a time, the headings and buttons untouched), and falls back to `inert` elsewhere; `marketing.css` lists `content-visibility` beside the height clock with `allow-discrete` so a closing answer stays drawn until it has collapsed. `faq-accordion.test.tsx` (two failing on the old component: hidden until found, opened by `beforematch`; the inert fallback, the server's markup, the CSS clock and the headings pinned). Driven on `next start` at `/events`: 5 of 5 closed panels `hidden="until-found"`, none inert; a fragment link into a closed answer (the browser's own reveal path; this pane has no Ctrl+F) fired `beforematch`, opened that question and closed the open one; a collapse held `content-visibility: visible` while the height ran 56, 41, 1, 0 and hid it at the end, an open drew at once.
  3. **`HomeFaqAccordion` deleted** (`sections/home/faq-accordion.tsx`); `faq.tsx` and `pricing/page.tsx` render `FaqAccordion` (the home keeps `mt-10`, pricing's `Reveal` still carries the one gap: `mt-0`, read in a browser: 40 and 0 px); `pricing-page.test.ts` pins `<FaqAccordion items={PRICING_FAQ_ITEMS} className="mt-0" />` and `faq-accordion.test.tsx` refuses a second accordion file.
  4. **The reduced mail:** `overCapReducedEmail` says putting them all back would take the account over its plan again; `templates.test.ts` (red on the old words: "You're over your limit" straight after "back under your plan").
  5. **One `useHydrated`:** `lib/shared/use-hydrated.ts` and all eight hand-written copies gone (the four named, plus `entry-modal.tsx`, `user-menu.tsx`, `motion-tuner.tsx` and the FAQ's own); `use-hydrated-one-home.test.ts` (red on the old tree: eight copies listed), `use-hydrated.test.tsx` (false to the server and the hydrating render, true after, no mismatch); `bulk-bar.test.tsx`'s source pin named the retired inline store, so it now renders the bar on the server (`title` attributes, no tooltip) and on the client, and keeps its real scar (SSR'd Radix tooltips broke hydration once).
  6. **One `layerIsUp()`:** `ui/layer-is-up.ts` (dialog, confirm, menu, listbox; `except` leaves the caller's own layer out, `dialogsOnly` is the album address's wait), asked by `review-keys.ts`, `report-queue.tsx` (gains `listbox`), `masonry.tsx` (unchanged in what it counts) and `claim-ask.tsx` (gains `listbox`; its own marked confirm is the `except`); `layer-is-up.test.tsx` (red on the old tree at `report-queue.tsx:292`, `review-keys.ts:64` and `masonry.tsx:189`, and on `claim-ask.tsx:37` once `shared-claims` landed; a real confirm is an `alertdialog` and counts).
  7. **The refresh-then-write reload, audited:** measured on `/pricing` under `next dev` in Chrome 152 (fourteen scenarios; the matrix, the mechanism and the corrected window are in `lib/history-entry.ts`'s header): the window is the refresh's whole round trip (about 190 ms here), not 20 ms; a native URL write in it is a `restore` that discards the pending refresh (`dispatchAction`) and reloads onto the same URL when the router's last rendered address differs from the one applied, which any earlier native query-moving write leaves true (a helper-pushed entry, or a deep-linked one after its first replace); the write before the refresh, Back, `router.push`/`replace`, a URL-less `pushState` and a write back to the rendered URL are safe. All 46 `router.refresh()` calls in 26 files read: none is followed, in its own function, by a call that applies a URL, `event-experience.tsx`'s ten included; `refresh-then-write-policy.test.ts` pins that (its scan follows `useOwnedEntry`, `useEventShare`, `useReelParam` and same-file writers; 30 tests, the shapes it refuses and passes named). The two-gesture exposure is the Question and the Deferred line above.
- **Assets requested from Will:** none.
- **Board ideas:** the root 404's payload tax (Deferred, first line) is a structural fix worth a look at the wiring round, not a board; a board would only be the 404's own look, which did not change.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the reduced mail's words; lazy over fold for the 404's trail; Safari keeps `inert` (find skips its closed answers); the eight `useHydrated` copies migrated including three outside the four named (`entry-modal.tsx`, `user-menu.tsx`, `motion-tuner.tsx`), so a policy test could refuse a ninth without an allow-list; `report-queue.tsx` now also yields its keys to an open listbox, as the review room's do, and `claim-ask.tsx` now also waits behind one; the hub Settings race left unfixed (Questions).
- **Look at first:** `/events` in Chrome, a phrase from a closed answer (the panel opens, the open one closes); the 404 at 1440 and 375 (unchanged); the header of `src/lib/history-entry.ts` (what was measured); the first Deferred line (110 KB of HTML and 43 to 56 KB of gzipped JS on every page from the root 404).
