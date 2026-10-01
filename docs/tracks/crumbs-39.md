---
track: crumbs-39
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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
  - src/components/app/dashboard/filter-chips.test.tsx
  - src/components/shared/tile-size-control.test.tsx
  - src/lib/constants/features.test.ts
  - src/lib/dashboard/filters.ts
  - src/lib/dashboard/filters.test.ts
  - src/lib/shared/tile-size-cookie.ts
  - src/lib/shared/tile-size-cookie.test.ts
  - src/lib/shared/use-tile-size.ts
  - src/components/app/dashboard/events-section.tsx
  - src/components/guest/guest-action-dock.tsx
  - src/components/shared/unverified-mark.tsx
  - src/app/(dev)/design/(shell)/library/patterns/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/patterns/interactive-demos.tsx
  - src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx
  - src/app/(dev)/design/(shell)/library/compositions/composition-demos.tsx
  - src/app/(dev)/design/gallery/specimens.generated.json
  - content/blog/AUTHORING.md
  - src/components/guest/guest-masonry.tsx
  - src/components/guest/guest-masonry.test.tsx
  - src/components/guest/gallery-rows.test.tsx
  - src/components/shared/masonry.tsx
  - src/app/(dev)/design/album-scale/album-scale.tsx
  - src/components/marketing/sections/features/album/album-fill-grid.tsx
  - src/components/marketing/sections/features/album/everywhere-stage.tsx
  - src/components/marketing/sections/how-it-works/guest-pictures.tsx
  - src/components/marketing/sections/how-it-works/host-pictures.tsx
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - src/app/globals.css
  - src/app/layout.tsx
  - src/app/api/guests/route.ts
  - src/app/(dev)/design/(shell)/library/marketing/gallery-demos.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/components/marketing/sections/careers/contact-sheet.tsx
  - src/components/marketing/sections/features/curation/bulk-tools.tsx
  - src/components/marketing/sections/home/curation.tsx
  - src/components/social/profile-slug-control.tsx
  - src/components/ui/sonner.tsx
  - src/lib/avatar/seed.ts
  - src/lib/constants/marketing-voice.ts
  - src/lib/events/upload-lock.ts
  - src/lib/forensics/preserve.ts
  - src/lib/guest/session-cookie.ts
  - src/lib/shared/use-in-view-sentinel.ts
  - src/lib/shared/use-in-view-sentinel.test.tsx
  - src/lib/stripe/entitlement.ts
  - src/lib/stripe/entitlement.test.ts
  - src/lib/constants/tiers.ts
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

Each is built on its recommended answer and listed in the Handoff as Will's to overrule.

- Does `resolveRowStep` keep reading a legacy 300/240/180 width now that no surface writes one? Recommended: keep (four lines, pinned in `tile-size-cookie.test.ts`), and drop it with the launch test-data reset.
- Is `GuestMasonry` deleted (read only by its own test; its header said the marketing stage and the lab's boards draw it, and neither does), its three head-stack pins moved onto `GalleryRows`? Recommended: yes. It went beyond the named files, in a commit of its own (8c8b62dd) that reverts alone.
- Does the portal rule cover every link in `components/admin` and `app/admin` (16), not only the six files the ROADMAP line named? Recommended: yes, the same two auth reads a prefetch, the same one-prop fix, one scan holding all of it.
- Does the Library's dialog entry draw a Takeover specimen (the entry's own line promised the fullScreen takeover and drew only the modal)? Recommended: yes, and it is where the lock was seen.
- Does `text-[10px]` in pictured type (18 in the two how-it-works pictures, one in the careers contact sheet) stay? Recommended: yes, design-system.md keeps type drawn inside a picture off the ladder; the brief's `text-micro` rule met it nowhere else.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: the ★ on `cn()` and the shadow utilities, now `SHADOW_TOKENS` (crumbs-39 item "cn() and the shadow utilities").
- `docs/systems/admin-observability.md`: "The chrome's links never prefetch" becomes "No link in the portal prefetches", naming the source scan that holds the pages' and content components' links.
- `docs/systems/guest-flow.md`: the two "residue only the Library mounts" sentences (`floating-add-button.tsx`, `anonymous-info.tsx`) are deleted with their files.
- `docs/systems/marketing-content.md`: the "dead scaffold" sentence on `constants/features.ts` and `features-layout.ts` is deleted with them.
- `docs/systems/design-system.md` (second line): "`drawer.tsx` (vaul's, drawn only by the Library's gallery now)" is deleted from the floating-layer paragraph: the file and vaul are gone.
- `docs/systems/design-system.md` (third line): the album tile section's "the guest album (`GuestMasonry` wraps it)" says `GalleryRows`.
- `docs/systems/design-system.md` (fourth line): the GlowFilter bullet's "the root `not-found.tsx` renders the footer" says the root 404, `not-found.site.tsx`.

## Deferred (ROADMAP one-liners, bucket named)

- Admin: `src/app/admin/albums/[eventId]/page.tsx`'s two links (`← Albums`, the host's account) still prefetch: crumbs-37 owned the page this round; `admin-prefetch-policy.test.ts` lists it as `PENDING` and fails when it is fixed, so its entry goes with the fix.
- Admin: `reports/person-report-list.tsx`'s `@handle` link is a relative `/u/<slug>`, a path the admin host's allow-list (`lib/surface`) answers with its 404; it wants the app's absolute address in a new tab (a bug found while taking its prefetch off; `prefetch={false}` is all this lane did to it).
- Code hygiene: `resolveRowStep`'s legacy 300/240/180 read (`tile-size-cookie.ts`) can go at the launch test-data reset: nothing writes a width.
- Code hygiene: `masonry.tsx`'s masonry layout (`distributeColumns`, `placeColumns`, the CSS-columns pre-measure box) has no product caller: every album is `rows`, the review queue `uniform`; only the lab's `/design/album-scale` harness draws it.
- Housekeeping: about a hundred `QA #N` labels outside the five files this lane swept (`db/migration-guards.test.ts`, `api/stripe/webhook/route.ts`, `lifecycle/sweeps/*`, ...) cite a review's numbering no doc holds; each is a reason that wants its own words.
- Retire from the ROADMAP: lines 20, 123, 124, 154, 155, 163 and 168 are done; line 238 was already true before the cut (`event-filter-pills.tsx`, `use-active-section.ts` and every comment naming `event-feed-action-bar.tsx` are gone); and inside lines 155 and 163 these were already fixed or true when read: `enter-event-prompt.tsx` and the app's `ghost-grid.tsx` (files gone), `EventCardQr`'s props (every call passes only what it reads since popups-wiring), `database-security.md0`, the backup Worker's "Cost & scaling" pointer, `claim-handle-prompt.tsx`, `gallery-skeleton.tsx` and `request-facts.ts` (true as written).

## Handoff (replaces the chat report)

- **Commits, pushed to `origin/lp/crumbs-39`:** `de5e7932` (cn, dialog), `60d5c42b` (the portal's links), `3c2a5d71` (the dead components, constants and tile-size tools), `8c8b62dd` (GuestMasonry), `683b6ceb` (the comment sweep), `f76be8df` (the Takeover specimen); the sync `cc272a88` (merged `origin/launch-prep` at `a1f53468`, which carried crumbs-36: a clean automatic merge, whose message lacks the Co-Authored-By trailer: it was pushed before I saw that, and a pushed commit is never amended); then the manifest's own commit, whose sha is in the chat line.
- **Gates on the synced tree** (`cc272a88` and the manifest, no code after it), each on its own exit code, logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-39/`: `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0, no warnings (`gate-lint.log`); `pnpm test` 0, 681 files and 8,185 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0 (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3134 --production` on that build, 178 checks, 0 failing, the closed door shut (`gate-smoke-prod.log`); `pnpm lab:smoke --base http://localhost:3134` on `pnpm dev`, 172 checks, 0 failing (`gate-smoke-dev.log`). No board is returned, so no `lab:demo`. One earlier full run (before the sync) failed `src/app/not-found.lazy.test.tsx` on a one-second `findBy` while another lane's build held the machine: it passes alone three times of three and passed in the next full run.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` is this manifest, the four `docs/systems/` files listed above and paths under `owns`, with one exception: `next.config.ts`, a root file no manifest can claim (the test refuses a one-segment prefix), changed in comments only (two comment blocks reordered, the lab's trace comment corrected). `src/lib/constants/tiers.ts` (one `(QA #26)` label cut) was written while crumbs-36 owned it and is claimed here now that it has merged.
- **The items** (the ROADMAP line each retires is in Deferred):
  - `cn()` and the shadow utilities: `SHADOW_TOKENS` in `src/lib/utils.ts`; `type-ladder-policy.test.ts` pins the list against theme.css's self-mapped `--shadow-*` lines and `cn("shadow-layer", "shadow-none")`, a stock `shadow-md` in both orders, a shadow colour beside a token and the ring (red first: `expected 'shadow-lift shadow-none' to be 'shadow-none'`); design-system.md's star says so.
  - `ui/dialog.tsx` `fullScreen`: it renders an Overlay that draws nothing (Radix's RemoveScroll is the Overlay's), so the page is held still; `ui/dialog.test.tsx` holds the lock for both shapes (red first on the takeover: `data-scroll-locked` null). On 3134 in the Library's new Takeover specimen: opened, the body holds `data-scroll-locked`, a ten-tick wheel moves the page 0 px, the overlay is transparent with no backdrop filter, no console warning; closed (tab fronted), the lock, the room and the overlay leave together between 151 and 236 ms.
  - The portal's content links: all 16 `<Link>`s in `components/admin` and `app/admin` that prefetched say `prefetch={false}` (the six named files hold 7); `components/admin/admin-prefetch-policy.test.ts` reads both directories' source with the TypeScript parser (red first: 16 offenders; one pending page). Measured on production builds with headless Chrome over the DevTools protocol (`_scratch/crumbs-39/prefetch-probe.mjs`, the Library's compositions page, which renders the real band, queue, inbox, filter, alerts and tiles, scrolled end to end): the base, `origin/launch-prep` at `a1f53468` (a throwaway worktree, built, served on 3134, removed), 59 `_rsc` requests including `/admin/jobs`, `/admin/support`, `/admin/reports` and `/admin/applicants`; this lane's build, 46, none under `/admin` (the Library's own 15 paths prefetched, so prefetching was live in the same build).
  - The unmounted components and the files with no importer: `floating-add-button.tsx`, `filter-chips.tsx`, `tile-size-control.tsx`, `anonymous-info.tsx`, `constants/features.ts` and `features-layout.ts`, with their tests, their four Library entries (the artifact regenerated by `collect-specimens.mjs`) and the doc lines that called them residue; plus what died with them (`lib/dashboard/filters.ts` and its test). `ghost-grid.tsx` is mounted (the privacy page's access switch), so it stays with a corrected comment; the app's own ghost grid, `event-filter-pills.tsx`, `use-active-section.ts` and `enter-event-prompt.tsx` were already gone.
  - The tile-size tools: `TILE_SIZES`, `TileSize`, `DEFAULT_TILE_SIZE`, `TILE_SIZE_LABEL`, `resolveTileSize` and `useTileSize` gone with `TileSizeControl` and its demo; `resolveRowStep` is unchanged for every input (the test now adds prototype keys).
  - `GuestMasonry` (beyond the named files): deleted, its three head-stack pins moved to `gallery-rows.test.tsx` against the real wiring (the rule had none; one mutation-checked), the comments that named it repointed.
  - The comment sweep (ROADMAP 155 and 163): each item read against the code; 29 of the lane's modified code files differ from `origin/launch-prep` in comments only, proved by the TypeScript printer with comments removed (`_scratch/crumbs-39/comment-only.mjs`, CSS stripped of block comments); the sweep's only non-comment lines are a test id (`use-in-view-sentinel.test.tsx`) and a Library `for:` line (`library/marketing/gallery-demos.tsx`). The commit message of `683b6ceb` lists each.
  - `text-[10px]` to `text-micro`: `operator-alerts.tsx` (2) and `admin-not-found-screen.tsx` (1), the only two non-pictured files met.
- **Assets requested from Will:** none.
- **Board ideas:** the how-it-works pictures and the album-fill grid draw a green landed check the product replaced with a pass of light (`shared/arrival.css`): which should a picture show? · the curation mock draws the select bar floating at the card's bottom edge; the product's bar takes the album header's action row.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. (`workers/backup` is untouched; no Worker deploy is owed.)
- **Calls his to overrule:** the five in Questions: the legacy-width read kept; `GuestMasonry` deleted; the scan over every portal link; the Takeover specimen; pictured `text-[10px]` left.
- **The lab crawl's PREMISE lines** name four boards, and each ask still holds. `about-press` (`kit`, `facts`) and `demo-framing` (`slug`, `stage`, `touch`) through `marketing-content.md`, which lost one sentence about two dead constants files that neither board names. `disposable-mode` (camera, waiting, wall, peek, create, video, cost, save) through `guest-flow.md` and `tiers.ts`: `guest-flow.md` lost the two sentences calling the floating Add pill and `anonymous-info.tsx` residue (both files deleted), and `tiers.ts` lost one review-number label in the over-cap headroom comment; no ask names a pill, an Anonymous credit or the headroom, and no number or word moved. `locked-door` (family, shape, wait, lost) through `guest-flow.md`: the two deleted sentences sit in the dock's and the viewer's credit paragraphs, not the door's.
- **Look at first:** `admin-prefetch-policy.test.ts`'s `PENDING` (the one page still to fix); the Library's Takeover specimen at `/design/library/components` (Overlays); and the two deletions that went past the named files, `lib/dashboard/filters.ts` (in `3c2a5d71`) and `GuestMasonry` (in `8c8b62dd`), each a commit that reverts alone.
- **The portal's steps for the next build's red-team** (it cannot run signed in on localhost): on the admin host, signed in at AAL2, with the Network panel filtered to `_rsc`, load `/admin`, `/admin/reports` (the feed's tiles), `/admin/support` (a long inbox), `/admin/accounts` (a link a row) and `/admin/albums`, scroll each and hover its rows: no `_rsc` request for any `/admin/*` path; a click still lands on its page; and a page view's `GET /auth/v1/user` count stays at the chrome's two (`admin-observability.md`).

## Where I am

_Agent crumbs-39 (Sonnet 5.5), booted 2026-10-01 in `/Users/gibby/local/ai/partyreel-wt/crumbs-39`, dev port 3134, scratch `/Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-39/`._

**Handed off; nothing is in progress or left.** The gate ran on the synced tree (`cc272a88`), the dev server on 3134 is stopped, and the headless Chrome and the throwaway base worktree are gone. The Handoff above is the account; this section is what a respawned agent would need.

**Done, by commit**
- `de5e7932`: `cn()`'s `SHADOW_TOKENS`; the fullScreen dialog's invisible Overlay (the page lock).
- `60d5c42b`: `prefetch={false}` on all 16 portal `<Link>`s that prefetched; `admin-prefetch-policy.test.ts` (one `PENDING` page, crumbs-37's `albums/[eventId]/page.tsx`); `text-[10px]` to `text-micro` in the two portal files met.
- `3c2a5d71`: the unmounted components, `constants/features*`, `lib/dashboard/filters.ts` and the tile-size tools, with their Library entries (artifact regenerated) and doc lines.
- `8c8b62dd`: `GuestMasonry` deleted, its three head-stack pins moved onto `GalleryRows` (`gallery-rows.test.tsx`).
- `683b6ceb`: the comment sweep (ROADMAP 155 and 163), each item read against the code.
- `f76be8df`: the Library dialog entry's Takeover specimen.
- `cc272a88`: the sync with `origin/launch-prep` (crumbs-36 landed; clean).

**Measured, so a successor does not redo it**
- Already gone before the cut, so the ROADMAP lines are stale on them: the app's `components/guest/ghost-grid.tsx`, `event-filter-pills.tsx`, `lib/shared/use-active-section.ts`, `enter-event-prompt.tsx`; `EventCardQr`'s props; the `getHostAvatarUrl`-era, "Cost & scaling" and `database-security.md0` comment items.
- Prefetch, on production builds (headless Chrome over CDP, `_scratch/crumbs-39/prefetch-probe.mjs`, the Library's compositions page scrolled end to end): base `origin/launch-prep` 59 `_rsc` requests with `/admin/jobs|support|reports|applicants` among them; this lane 46, none under `/admin`, the Library's own 15 paths prefetched as the positive control. `next/link`'s `prefetch` only runs in a production build, so `pnpm dev` can never show one.
- A Radix `Presence` waits on `animationend`, and a Browser-pane tab that is not visible runs no animations: a dialog closed in a background tab stays mounted (`data-state="closed"`) until the tab is fronted, so time an exit with it fronted.
- A comment-only edit is proved by `node /Users/gibby/local/ai/partyreel-wt/_scratch/crumbs-39/comment-only.mjs origin/launch-prep <files>` (the TypeScript printer with comments removed, both sides compared; CSS stripped of block comments). It lives in the scratch directory, not the repo. 29 of the lane's modified code files pass it.
- Read and left as true: `claim-handle-prompt.tsx`, `gallery-skeleton.tsx`, the backup Worker's "Cost & scaling" pointer, `request-facts.ts`.
