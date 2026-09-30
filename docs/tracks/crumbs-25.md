---
track: crumbs-25
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "07eec9ba"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/app/(marketing)/(cinema)/not-found.tsx
  - src/components/app/host-media-grid.tsx
  - src/lib/adopt-typed-value.ts
  - src/app/globals.css
  # added by the lane, each with its reason:
  - src/app/(guest)/e/[token]/not-found.screen.tsx   # (new) the screen that was the file's body, loaded only through the one boundary
  - src/app/(marketing)/(cinema)/not-found.screen.tsx  # (new) the cinema group's screen
  - src/app/(guest)/u/[slug]/not-found.tsx           # the guest profile's 404: the same GuestBar cost (about 14.7 KB of HTML on every profile), the same fix
  - src/app/(guest)/u/[slug]/not-found.screen.tsx    # (new)
  - src/app/(app)/not-found.tsx                      # the host app's 404: about 3.5 KB of HTML on every dashboard page (the cinema's is 4 KB), the same fix
  - src/app/(app)/not-found.screen.tsx               # (new)
  - src/app/admin/not-found.tsx                      # the operations portal's 404: about 2.2 KB on every admin page, the same fix
  - src/app/admin/not-found.screen.tsx               # (new)
  - src/components/shared/failure-grammar.test.tsx   # its file lists name the 404 files whose bodies moved behind the boundaries (the scars stay, the paths follow)
  - src/app/not-found.lazy.tsx                      # the one boundary: a loader per group screen joins the root's two (a boundary per group cost 1.3 KB gz on every page of its group: measured)
  - src/app/(dev)/design/sandbox/locked-door/today.tsx  # ONE-LINE EXCEPTION (two lines): the board draws the 404 "as it ships" by importing the route's default export, which now renders the lazy reference; it imports the screen instead
  - src/app/(dev)/design/sandbox/locked-door/spec.ts    # ONE-LINE EXCEPTION: its `lives` gains the moved screen file, so the next change to the 404's drawing raises the board's PREMISE line
  - src/app/not-found.test.ts                        # perf-404's eager-import walk, widened to every group 404 (its walker lives here)
  - src/app/group-not-found.lazy.test.tsx            # (new) each group's 404 draws through its boundary, whole
  - src/app/(dev)/design/(shell)/library/index-list.tsx           # the fields the policy moved onto the hook (the Library's search)
  - src/app/(dev)/design/(shell)/library/index-list.hydrate.test.tsx  # (new) a search typed before hydration filters the list (red on the bare field)
  - src/app/(dev)/design/(shell)/_shell/sidebar.tsx               # the sidebar's filter
  - src/app/(dev)/design/gallery/knobs.tsx                        # the specimen text knob (its own component now, so a hook can sit beside its early return)
  - src/app/(dev)/design/(shell)/lab/tools/reel-live/harness.tsx  # the harness's seed field
  - src/components/lab/item-verdict.tsx                           # the reviewer's note on an item
  - src/components/lab/step.tsx                                   # ONE-LINE EXCEPTION (a few lines): the dock's note field composes the hook's ref with the desk's own
  - src/lib/adopt-typed-value-policy.test.ts         # (new) the policy: a text field adopts early typing or says why it need not
  - src/app/(dev)/design/design.css                  # the lab's own exemption from the guard (a patch for the same cause) goes when the guard's fix is proven to cover the stage's fit
  - src/app/reduced-motion-guard.test.ts             # (new) the guard's shape: it clamps what declares a transition and creates none
  - src/components/app/host-media-grid.test.tsx      # (new) the host album holds a live arrival at the door
  - src/components/app/event-uploads.test.tsx        # (new) the hub hands the grid the way to ask for a held arrival's link, and it asks the album's link store
  - src/components/app/event-uploads.tsx             # the hub hands the grid the way to ask for a held arrival's link (`onNeedLinks`)
  - src/components/shared/use-arrival-gate.ts        # (moved from components/guest/: two surfaces, one gate)
  - src/components/shared/use-arrival-gate.test.tsx  # (moved with it)
  - src/components/guest/use-arrival-gate.ts         # the move's other half (deleted)
  - src/components/guest/use-arrival-gate.test.tsx   # the move's other half (deleted)
  - src/components/guest/gallery-rows.tsx            # its one import path
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/host-app.md
  - docs/systems/design-system.md
---

# lp/crumbs-25

**Goal.** Four follow-ups from the latest lanes: the group 404s off their groups' pages, early typing kept in every field a person lands on, the host album's live arrival landing decoded, and the reduced-motion guard never making a measured size stale.

## The brief

Four items the latest lanes deferred (ROADMAP's lines), each fixed at its root with a test that fails on today's code where a test can hold it:

- **The group 404s ride their groups' pages**, as the root's did before `perf-404`. The guest link's own 404 (`src/app/(guest)/e/[token]/not-found.tsx`) costs every album load about 17.5 KB of HTML (6 KB gzipped, most of it `GuestBar`'s wordmark path), and the `(cinema)` one about 5 KB (1 KB gzipped) on every cinema page. `perf-404` measured both on `next start` against each drawing nothing. Give each the root's shape: one client boundary, as `app/not-found.site.tsx` is. Measure before and after, and keep each 404 drawn exactly as today.
- **Early typing kept everywhere a person lands and types at once.** About 32 files draw a bare `<input>`, and any that is controlled and drawn open on the server loses text typed before hydration, which `Input` and `Textarea` no longer do (`crumbs-23`). Route them through `useAdoptTypedValue` (`src/lib/adopt-typed-value.ts`), starting with the pages a person lands on and types into at once, and hold the rule with a policy test.
- **The host album's live arrival** still lands the way the guest's did before `crumbs-23`'s `use-arrival-gate.ts`: no link at push, so a shimmer and a fade. Put the same gate over `HostMediaGrid`, and fold `useArrivedIds` onto `useArrivalMarks`.
- **The reduced-motion guard.** In `globals.css` it sets `transition-duration: 0.01ms !important` on every element and leaves `transition-property` at `all`, so every script-written style becomes a transition, and a size read in the same task as its write is the old one. The lab's whole stage exempts its own boxes (`design.css`, `lab-focus`). A production measurer that writes then reads (the masonry, the lightbox's settle) may read stale sizes. Name the properties the guard covers, or exempt what measures, and prove a measurer reads the new size under reduced motion.

**Verify:**
- the gate;
- each item's test red on today's code and green on yours;
- the 404s and the fields driven in a browser on your dev server, with the numbers on `next start`.

The signed-in host album cannot run on localhost, so name its steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start (the fields you move onto the hook, a measurer you fix): add each to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule.

1. **How does a group's 404 come off its group's pages, and which groups?** **Recommended, built: the root's shape, in the root's one boundary, for all five.** Each `not-found.tsx` (the guest link's, the guest profile's, the cinema group's, the host app's, the portal's) keeps its metadata and renders one reference into `app/not-found.lazy.tsx`, whose loaders name each screen (`not-found.screen.tsx` beside its `not-found.tsx`); `not-found.test.ts` refuses a component, a client island or a stylesheet among any of their eager imports and names every `not-found.tsx` under `app/`. The brief named two; the other three carry the same mechanism at 14.7, 3.5 and 2.2 KB of HTML per page, and the profile's is the guest link's own cost. ★ One boundary, not one per group, and measured: a boundary per group (built first) put its own copy of `next/dynamic`'s runtime, 1.3 KB gzipped, on every page of its group, more than the cinema group's 4 KB of HTML had cost.
2. **Does the typing rule cover the design lab, and every text field?** **Recommended, built: yes, all of `src/`.** `adopt-typed-value-policy.test.ts` reads the JSX: a raw controlled text `<input>` or `<textarea>` adopts through the hook or its file counts it, with why (a honeypot, a field only a press mounts, the desk's summary note). What it found bare and drawn open on the server moved onto the hook: the Library's search, its sidebar filter, the specimen text knob, the reel harness's seed, a reviewer's note on an item and the dock's note on a question. Every production text field was already `Input` or `Textarea`, so there is no production page left to start with.
3. **Does the host's album hold an arrival at the door as the guest's does?** **Recommended, built: yes, the same gate, the same numbers** (2 s at most, 12 at once, never the seed, never under reduced motion), moved to `components/shared/` since two surfaces read it. The host's own upload is an arrival to her album as it was (it glowed before): no sweep is added. One change follows from folding onto `useArrivalMarks`: an id is lit once a visit, so a photograph put back from the bin glows the first time only (it glowed each time before).
4. **How does the reduced-motion guard stop making measured sizes stale?** **Recommended, built: the guard stops creating transitions nobody declared**, rather than naming a property list (which would override a declared `height` or `width` transition and starve its `transitionend`) or exempting each measurer (which leaves the next one to be found by a bug). Its default `transition-property` is `none`, unimportant and in the base layer, so a declared transition outranks it and is still clamped to `0.01ms` with its `transitionend`, and an element that declares none gets none. The lab's own exemption in `design.css`, a patch for the same cause, is deleted: proven redundant on `fitStage` (below).

## System-doc edits (in place, owned facts only)

Five `docs/systems/` files, each fact refined in its one home (none is under `owns`; they are the lane check's listed exception):
- `marketing-content.md`: "The 404 pages": the root bullet becomes "no `not-found.tsx` draws anything itself" (the mechanism, the five groups' costs, the ONE boundary and why, brotli against gzip, and that a thrown `notFound()` is served as Next's error shell and drawn by the client whatever the screen is).
- `architecture.md`: the typed-text bullet gains the policy test and what a field it misses does (words on screen, state at `""`).
- `guest-flow.md`: the arrival gate's path (`shared/`), and "only the guest album gates" is gone.
- `host-app.md`: the hub's arrival line: decided in the render, the shared gate, `HubRows.onNeedLinks`, the list that only grows.
- `design-system.md`: the reduced-motion bullet says what the guard covers and why its property is `none`.

## Deferred (ROADMAP one-liners, bucket named)

- Guest (performance, UX): a `notFound()` thrown inside any page is served as Next's error shell (`<html id="__next_error__">`, an empty body, drawn by the client once its script has run), so a stale QR's 404 is a white page on a cold phone, and for a reader with no script for good; measured with `curl` on `next start` for the guest link, the profile and every cinema slug (58 bytes of body), and read the same on the alias and on partyreel.com for the guest link, against an unmatched URL's 404, which is server-rendered. It is Next 16.2.6's path for a not-found thrown while the page renders (`app-render.js`, `ErrorApp`), and it was so before this lane. A fix would draw the guest link's screen from the page itself (with a 404 status) rather than through `notFound()` (from `crumbs-25`).
- Host, guest: "an id in this render that was not in the last" is still written twice (`newItemIds` in `host-media-grid.tsx`, `newArrivalIds` in `lib/guest/reconcile-album-items.ts`, which also answers nothing for an empty first snapshot); one pure function in `lib/shared/arrival.ts` beside `arrivalMarks` would keep the arrival grammar's first sentence in one place (from `crumbs-25`).
- The lab: a Library specimen for `HostMediaGrid`'s arrival (a card whose button adds a photograph to a fake store, a link minted only when asked), so `lab:demo` holds what the hub's live push does and localhost cannot reach signed in: this lane's scratch page (`_scratch/crumbs-25/`, never committed) is its first draft (from `crumbs-25`).

## Handoff (replaces the chat report)

- **Commits, pushed** (`git log origin/lp/crumbs-25`): the claims `32e02875`; the work `8a40a4d4` (the five 404s), `e414c519` (the typing policy and its fields), `837cd055` (the host album's gate), `9b443a3e` (the guard); the follow-ups `3147bb9c` (the hub's `onNeedLinks` pinned, two comments); then this manifest alone. **No sync:** launch-prep moved twice since the cut (`48139aa1` crumbs-26's cut, `47b15b80` its pickup: records only, STATUS and `tracks/`), touching nothing under `owns` or `reads`; `git merge-tree --write-tree HEAD origin/launch-prep` merges cleanly. crumbs-26 owns none of my paths; it reads `design-system.md`, whose one bullet I refined.
- **Gates on `3147bb9c`, each on its own exit code** (logs `../partyreel-wt/_scratch/crumbs-25/gate2/`): `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (650 files, 7,747 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 on `pnpm dev` (174 checks; scope the whole lab, since the shell's sidebar changed; its PREMISE lines name about-press, demo-framing, disposable-mode, event-ready and locked-door, whose asks describe the system docs and files this lane refined: re-read them before his next sitting). No board of mine, so no `lab:demo` of my own; but the lane deleted the lab stage's reduced-motion exemption, so `lab:demo` (which emulates reduced motion) ran on the whole desk at `9b443a3e` (`gate/demo-all.log`: 23 steps, 0 failing, 9 min 1 s; only comments, tests and this manifest changed since).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every file is under `owns`, this manifest, or the five `docs/systems/` files above. Exceptions, each named in `owns` with its reason: `src/app/(dev)/design/sandbox/locked-door/today.tsx` (two lines) and `spec.ts` (one line), since the board draws the 404 "as it ships" from the route's default export, a lazy reference now (it imports the screen; its `lives` gains the moved file); `src/components/lab/step.tsx` (a few lines: the dock's note composes the hook's ref with the desk's own). Beyond the brief's two 404 files: the profile's, the host app's and the portal's (Q1), the shared gate's move (Q3), `design.css` (Q4).
- **The items, each red on today's code and green on this** (redness proved by running the new test against the old files in a throwaway worktree at `a79c7af7`, `_scratch/crumbs-25/baseline`):
  1. **The group 404s ride no page of their groups** (`8a40a4d4`). All five (the brief named the guest link's and the cinema group's; the profile's is the same `GuestBar` cost, the host app's and the portal's the same mechanism) keep their metadata and render one reference into the ONE boundary, `src/app/not-found.lazy.tsx`, whose loaders name the `not-found.screen.tsx` beside each. Tests: `not-found.test.ts` (32 of its 51 red on the old files: the eager-import walk widened to every group 404, a sweep naming every `not-found.tsx` under `app/`, and the boundary's importers) and `group-not-found.lazy.test.tsx` (5 of 6 red: each 404 rendered through the boundary, whole, in its own box); `failure-grammar.test.tsx` follows the moved bodies (its scars stay).
  2. **Early typing kept in every field** (`e414c519`). Every production text field was already `Input` or `Textarea` (crumbs-23); the ROADMAP's "about 32 files" were file pickers, sliders, checkboxes, radios, honeypots, palettes that a press mounts, and six controlled fields the lab draws open on the server (the Library's search and its sidebar filter, the specimen text knob, the reel harness's seed, a reviewer's note on an item, the dock's note on a question), which moved onto the hook. `adopt-typed-value-policy.test.ts` holds the rule (2 of its 8 red on the old files, naming six files and seven fields; its exceptions are exact counts per file, so the sidebar's filter, in a file that excuses its editor-root field, is caught: "allows 1, draws 2"); `index-list.hydrate.test.tsx` (2 red on the bare field) holds the one whose effect shows: typed before hydration, the Library's field kept its words while its list went on showing all 108 entries; adopted, the list reads "0 of 108".
  3. **The host album's live arrival lands complete** (`837cd055`, `3147bb9c`). `HostMediaGrid` derives what arrived in the render an id first shows in (`useAlbumArrivals`), and `useArrivalGate` (moved to `components/shared/`) holds it out of the rows until its link has landed and its photograph is decoded, asks for the link itself (`HubRows.onNeedLinks`, wired in `event-uploads.tsx`) and lights the glow at landing; `useArrivedIds`'s timers are `useArrivalMarks`'s now. Tests: `host-media-grid.test.tsx` (9; 5 red on the old grid), `event-uploads.test.tsx` (2; 1 red on the old hub).
  4. **The reduced-motion guard makes no stale size** (`9b443a3e`). `globals.css`: the default `transition-property` is `none` under reduced motion (unimportant, in the base layer), so a declared transition outranks it and still ends, and an element that declares none gets none; `design.css`'s exemption for the lab stage is deleted. `reduced-motion-guard.test.ts` (1 red on the old sheet).
- **The numbers** (`next start`; before = launch-prep `a79c7af7` built in `_scratch/crumbs-25/baseline`, after = `3147bb9c`; `_scratch/crumbs-25/measure.mjs --base <next start> --dir <tree>`, perf-404's instrument with the group routes and brotli added, `before.json`, `final2.json`, and a `floor.json` with both named group 404s drawing nothing; HTML fetched with `accept-encoding: identity`, JS counted as perf-404 counted it):

  | route | HTML KB | HTML gz | HTML br | gz JS KB |
  |---|---|---|---|---|
  | `/e/<demo-token> (guest album)` | 135.5 → 118.3 | 27.7 → 20.2 | 18.0 → 16.9 | 667.3 → 667.1 |
  | `/report/<demo-token>` | 44.5 → 44.5 | 11.0 → 11.0 | 9.7 → 9.7 | 429.1 → 429.3 |
  | `/pricing` | 324.0 → 319.9 | 53.3 → 52.7 | 29.3 → 28.9 | 492.5 → 492.7 |
  | `/about` | 207.1 → 202.8 | 42.3 → 41.8 | 21.9 → 21.4 | 482.8 → 482.1 |
  | `/help` | 420.1 → 415.9 | 67.8 → 72.4 | 40.8 → 40.3 | 487.8 → 488.0 |
  | `/features` | 235.9 → 231.7 | 45.4 → 45.0 | 23.8 → 23.3 | 482.9 → 483.1 |
  | `/contact` | 239.1 → 234.9 | 56.9 → 56.0 | 36.0 → 35.5 | 514.5 → 514.7 |
  | `/blog` | 218.9 → 214.6 | 45.4 → 44.7 | 25.1 → 24.6 | 487.5 → 486.9 |
  | `/` | 557.6 → 553.4 | 77.4 → 76.5 | 38.8 → 38.3 | 531.2 → 531.4 |
  | `/login (control)` | 89.5 → 89.5 | 20.2 → 20.3 | 12.5 → 12.5 | 518.0 → 518.3 |
  | `404: guest, unknown /e/ token` | 35.9 → 18.6 | 10.8 → 3.7 | 9.9 → 3.4 | 667.3 → 667.1 |
  | `404: cinema, /help/<nope>` | 132.6 → 128.4 | 36.4 → 35.3 | 27.5 → 26.8 | 494.2 → 494.4 |
  | `404: cinema, /blog/<nope>` | 80.7 → 76.4 | 21.9 → 21.0 | 14.4 → 13.7 | 488.2 → 488.4 |
  | `404: root, unknown path` | 77.0 → 77.0 | 21.6 → 21.6 | 14.1 → 14.1 | 473.6 → 473.9 |

  The guest album sheds 17.2 KB of HTML (the guest 404 drawing nothing sits at 117.8: `floor.json`); on the wire that is 7.5 KB gzipped but 1.1 KB in brotli, which a host serves, so the win is mostly parse and flight-decode work on a cold phone, not bytes; every marketing page sheds 4.1 to 4.3 KB (0.4 to 0.5 KB in brotli). Every page pays about 0.25 KB gzipped of JS for the five loaders in the one boundary's chunk (`/login` 518.0 to 518.3; chunk layout moves a few pages by a few hundred bytes either way). `/help`'s gzip column rises 4.6 KB on a 4.2 KB smaller document: gzip's 32 KB window lost a repeated block the change moved out of its reach (brotli, a 16 MB window, falls 0.5 KB). A first attempt, one boundary per group, was measured and dropped: each chunk carried its own copy of `next/dynamic`'s runtime (1.3 KB gzipped on every page of the group), a net loss on the marketing pages.
  **The 404s themselves, unchanged to the pixel** (`shoot.mjs` and `pngdiff.mjs`, `shots/before` against `shots/after`): the guest link's and the cinema group's (`/help/`, `/blog/`, `/careers/`, `/events/` slugs) at 1440 and 375: 30 of 30 identical in light, dark and with scripts off; the runs with motion differ only in the footer's animated glow (a delta of at most 2), as a baseline run against itself does. Soft navigation from `/pricing` draws each of them whole. First `h1` on Slow 4G with a 4x slower CPU (`timing.mjs`, 5 runs each): the guest link's 404 at 3.77 s against 4.86 s (31 requests against 46), the profile's at 3.73 s against 4.47 s, the cinema group's at 4.09 s against 4.04 s. Reduced motion, baseline against final, 19 pages at two widths and two schemes (`paths.txt`, `diff-light.txt`, `diff-dark.txt`): every page identical but the live demo album (its height differs between two loads of the same build), the home at 375 in dark (the same 35,688 pixels a baseline run differs from itself by) and the photo pile on `/pricing` at 375 in dark (a 509-pixel wobble in its photographs). In `pnpm dev` the three group 404s log one "script tag while rendering React component" error, on the baseline too (the error shell is client-rendered); nothing else, and the Library's `HostMediaGrid` specimen logs nothing.
- **The guard, measured** (headless Chrome 154, reduced motion emulated; `guard-proof.mjs`, `fit-probe.mjs`, `masonry-probe.mjs`): a plain element written `width: 300px` and read in the same task reads 100 under the old guard and 300 under the new on `/pricing`, `/login` and the Library (the old guard is the same page with its one declaration removed through the CSSOM); a declared button transition still ends in about 25 ms under both. The lab-focus failure on the lab's own `fitStage` (locked-door, family): old guard and no exemption, zoom 0.123 (375) and 0.130 (1440); new guard and no exemption, 0.247 and 0.523, what the exemption gave, so the exemption goes. The production masonry (the Library's album-stream, 1440, 900, 600, 1200) ends every full row at its container's edge under both guards: its ResizeObserver measures again a frame later, so no stale read reached its layout; the measurer the guard made stale was the lab's stage, and the fix is at the guard so the next one cannot be. Overlays under reduced motion, final and baseline builds, 5 of 5 each: the nav dropdown, the help palette, the mobile menu, an FAQ answer and the album's viewer open and close (`rm-interactions.mjs`).
- **The host album's arrival, driven where localhost reaches** (a scratch page simulating the hub's store, never committed: a link minted only when asked, a foreign-origin URL; the old grid is a copy of `a79c7af7`'s beside the new one, `host-arrival-probe.mjs`): old, the tile mounts with no `<img>` and the photograph arrives 150 ms later `complete:false` and fades; new, about 190 ms after the delta the tile mounts with `complete:true`, `naturalWidth 900`, `data-instant`, `data-entering`, `data-arrived`, no shimmer; at 900 ms of latency it lands at 1.84 s the same way; a link that takes 2.6 s is laid at 2.0 s as before; under reduced motion it is laid at once.
- **Assets requested from Will:** none.
- **Board ideas:** a Library specimen for `HostMediaGrid`'s arrival (a card whose button adds a photograph to a fake store), so `lab:demo` holds what the hub's live push does and localhost cannot reach signed in (Deferred, last line); the stale QR's white page (Deferred, first line).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **ROADMAP lines this retires** (`docs/ROADMAP.md` at `a79c7af7`): 22 (the guard), 24 (the group 404s), 25 (the host album's arrival), 27 (the bare inputs) and 271 (`useArrivedIds`); it adds the three Deferred lines above.
- **Calls his to overrule:** one boundary for every 404, and all five, not the two named; every page carries 0.2 to 0.3 KB of loaders for it; a group's screen costs one request after the boundary's own (the browser draws a group 404 either way); the typing rule covers the lab, with seven counted exceptions; the gate moved to `components/shared/`, and a photograph put back from the bin glows the first time in a visit only; the guard's default property is `none` and the lab's own exemption is deleted (a layout property a component DOES declare stays stale in the same task at any duration, as it does with motion allowed: read it through `getAnimations()`).
- **Look at first** (the steps the next build's red-team runs on the alias; the signed-in hub and the portal do not run on localhost):
  1. *The hub's album, live* (two tabs: the hub, and a guest's album where photographs are added): a MutationObserver on `[data-album-grid]` for new `[data-media-tile]`: its `<img>` at insertion reads `complete: true`, the tile `data-instant`, `data-entering`, `data-arrived`, no opacity transition; it lands a beat after the count moves (its link and photograph first), not with it; `data-arrived` is gone about 2 s after it landed, not after the delta; a burst of thirteen or more holds at most twelve and lays the rest; a tab hidden then shown lays what waited.
  2. *A held upload approved in another tab*, and one put back from the bin: the same landing; the second time in one visit is an ordinary tile.
  3. *The group 404s on the alias, after build 28*: `/e/<demo token>` no longer carries "This event link didn't work" in its HTML (it reads once now, in the payload) and `/pricing` no longer carries "We lost this page"; a stale `/e/<token>` at 375 draws its screen (white until the script has run, as before); `/u/<nope>` and a bad `/help/<slug>` draw theirs; signed in, `/dashboard/<unknown uuid>` draws "We couldn't find that event" inside AppShell with the tab title "Event not found", and `/admin/accounts/<unknown>` "We couldn't find that page" inside AdminShell.
  4. *Reduced motion* (the OS setting) on the hub: Settings, Share and the album's viewer open and close and are never stuck; the marketing nav's dropdown and the help palette likewise.
  5. *The Library at 1440* (`/design/library?key=`): typing into the search at once, before the page has loaded, filters the list when it does.
