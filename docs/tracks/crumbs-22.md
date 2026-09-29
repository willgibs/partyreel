---
track: crumbs-22
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "39426a2f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/not-found.tsx
  - src/components/shared/trail/
  - src/components/marketing/faq-accordion.tsx
  - src/components/marketing/sections/home/faq-accordion.tsx
  - src/components/marketing/sections/pricing/pricing-page.test.ts
  - src/lib/email/templates.ts
  - src/app/(marketing)/(cinema)/contact/contact-form.tsx
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/app/share/event-share-provider.tsx
  - src/app/(dev)/design/theme-toggle.tsx
  - src/components/app/event-feed/review-keys.ts
  - src/components/admin/report-queue.tsx
  - src/components/shared/masonry.tsx
  - src/components/guest/event-experience.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
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
