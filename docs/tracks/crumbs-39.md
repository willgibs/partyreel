---
track: crumbs-39
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "3925f9f0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/sections/features/shared/ghost-grid.tsx
  - src/components/shared/floating-add-button.tsx
  - src/components/app/dashboard/filter-chips.tsx
  - src/components/shared/tile-size-control.tsx
  - src/components/ui/dialog.tsx
  - src/components/shared/anonymous-info.tsx
  - src/lib/constants/features.ts
  - src/lib/constants/features-layout.ts
  - src/lib/utils.ts
  - src/lib/type-ladder-policy.test.ts
  - src/components/ui/dialog.test.tsx
  - src/components/admin/queue-list.tsx
  - src/components/admin/inbox-pane.tsx
  - src/components/admin/moderation-grid.tsx
  - src/components/admin/triage-filter.tsx
  - src/components/admin/health-band.tsx
  - src/components/admin/operator-alerts.tsx
  - src/components/admin/admin-not-found-screen.tsx
  - src/components/admin/admin-prefetch-policy.test.ts
  - src/app/admin/page.tsx
  - src/app/admin/not-found.screen.tsx
  - src/app/admin/accounts/page.tsx
  - src/app/admin/accounts/[id]/page.tsx
  - src/app/admin/albums/page.tsx
  - src/app/admin/help-feedback/page.tsx
  - src/app/admin/reports/person-report-list.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/design-system.md
  - docs/systems/admin-observability.md
  - docs/systems/guest-flow.md
---

# lp/crumbs-39

**Goal.** A hygiene sweep of seven ROADMAP lines: unmounted components and files no product page reads, comments that describe retired designs or state retired facts, the tile-size tools the rows retired, ui/dialog's fullScreen scroll lock, cn() knowing the shadow utilities, and the portal's content links that still prefetch.

## The brief

Seven lines the ROADMAP holds (each is its line there; find it by the words quoted). Each is removed or made true, with a test where one can hold it. Delete only what typecheck, lint and the build prove nothing reads, and drop a Library specimen only with its entry:

- **Unmounted components** (code hygiene): `ghost-grid.tsx`, `floating-add-button.tsx`, `event-filter-pills.tsx`; `filter-chips.tsx` and `tile-size-control.tsx` drawn only in the Library; three unused props passed to `EventCardQr` (`events-section.tsx`); and the comments describing retired designs that line lists.
- **More files with no importer** (housekeeping): `features.ts` and `features-layout.ts` (read only by their tests) and `anonymous-info.tsx` (Library only).
- **Comments that state retired facts** (housekeeping): the line's list, each corrected or cut. A comment citing a numbered ruling no doc holds keeps its reason in plain words.
- **The tile-size tools** (from `album-guest-wiring`): `TILE_SIZES`, `resolveTileSize`, `useTileSize` and `TileSizeControl` "serve only the Library's gallery demos now that every album is rows; retire them with the demos' control".
- **`ui/dialog.tsx`'s `fullScreen`** (from `album-guest-wiring`): its comment says Radix's scroll lock lives on Content; it lives on the Overlay, which `fullScreen` omits, "so a takeover built on it scrolls the page under it and keeps a desk's scrollbar (no product surface uses it today; the reel view's fix is the shape)". Fix the lock, not only the comment.
- **`cn()` and the shadow utilities** (design): "one `theme: { shadow: [...] }` line in `src/lib/utils.ts`: tailwind-merge files them under shadow colour, so `cn("shadow-layer", "shadow-none")` keeps both".
- **The portal's content links** (from `crumbs-35`): `queue-list.tsx`, `inbox-pane.tsx`, `moderation-grid.tsx`, `triage-filter.tsx`, `health-band.tsx` and `operator-alerts.tsx` "still prefetch, two auth reads a distinct route and one more a long inbox's row; the chrome's `prefetch={false}` applies to them too".

A `text-[10px]` met in a file you open moves to `text-micro` (naming, not sizing).

**Verify:**
- the gate (`lab:smoke` reaches the Library, whose specimens this touches);
- each item's test or the build's proof.

**Will's desk is up:** change no word or behaviour the desk's six boards describe. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. No SQL. Three lanes run beside you, so don't touch their files:
- `crumbs-36` owns the pricing sections, the marketing copy files (`faq-data.ts`, `jsonld.tsx`, `spec-shared.tsx`, `album-copy.ts`, `media-lives.tsx`, `llms.ts`, `events.ts`), `lib/lifecycle/inactivity.ts`, `host-add-provider.tsx`, `host-upload.tsx`, the two blog posts, `report-queue.tsx` and `lib/admin/reports.ts`;
- `crumbs-37` owns the album's sync, the purge cron, the over-capacity sweep and the admin album drill-in;
- `crumbs-38` owns the profile's lists, the viewer's credit (`media-lightbox-parts/credit.tsx`) and the guest's upload queue and toasts.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the ★ on `cn()` and the shadow utilities, now `SHADOW_TOKENS` (crumbs-39 item "cn() and the shadow utilities").
- `docs/systems/admin-observability.md`: "The chrome's links never prefetch" becomes "No link in the portal prefetches", naming the source scan that holds the pages' and content components' links.

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

## Where I am

_Agent crumbs-39 (Sonnet 5.5), booted 2026-10-01 in `/Users/gibby/local/ai/partyreel-wt/crumbs-39`, dev port 3134, scratch `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-39/`._

**Done**
- `cn()` shadow tokens: `SHADOW_TOKENS` in `src/lib/utils.ts`, red-first test in `src/lib/type-ladder-policy.test.ts`, design-system.md's ★ refined.
- `ui/dialog.tsx` fullScreen scroll lock: the takeover now renders an Overlay that draws nothing (Radix's RemoveScroll is the Overlay's); `src/components/ui/dialog.test.tsx` was red on the takeover before. Still to do for it: look at the Library's fullScreen demo in a browser (no visual change, no scrollbar strip).
- The portal's links: all 16 `<Link>`s in `components/admin` and `app/admin` that prefetched now say `prefetch={false}` (the six named files hold 7 of them; the other 9 are the admin 404 screens and seven page-level links), and `src/components/admin/admin-prefetch-policy.test.ts` reads the source of both directories (red first: 16 offenders), with one pending page, crumbs-37's `albums/[eventId]/page.tsx`, whose two links take the prop when its lane lands (the test fails when that page is fixed, so its entry is deleted then). `text-[10px]` moved to `text-micro` in `operator-alerts.tsx` (2) and `admin-not-found-screen.tsx` (1), whose stale header sentence about the Ops badge is corrected.

**In progress / next, in this order**
1. Dead components and the tile-size tools, with their Library specimens and the system-doc lines that name them.
2. `EventCardQr`'s unused props.
3. The comment sweep (ROADMAP lines 155 and 163), each verified against current code; `text-[10px]` to `text-micro` in any file opened.
4. The gate, `lab:smoke`, the handoff.

**Measured, so a successor does not redo it**
- Already gone before the cut (the ROADMAP lines are stale on them): the app's `components/guest/ghost-grid.tsx`, `event-filter-pills.tsx`, `lib/shared/use-active-section.ts`, `enter-event-prompt.tsx`; the `getHostAvatarUrl`-era and "Cost & scaling" and `database-security.md0` comment items.
- The proof that a file changed in comments only: `node /Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-39/comment-only.mjs origin/launch-prep <files>` (TypeScript printer with comments removed, both sides compared; CSS stripped of block comments). It lives in the scratch directory, not the repo.
