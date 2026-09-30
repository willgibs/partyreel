---
track: perf-404
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "9c4897ad"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/not-found.tsx
  - src/app/not-found.lazy.tsx         # the one client boundary the 404 loads through
  - src/app/not-found.site.tsx         # the site's 404 (chrome, trail, words), reached only through the boundary
  - src/app/not-found.test.ts          # the 404's eager import graph (trail-lazy.test.ts's walk, moved and widened)
  - src/app/not-found.lazy.test.tsx    # the boundary draws each surface's 404
  - src/components/shared/trail/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/architecture.md
---

# lp/perf-404

**Goal.** The root 404 costs nothing on a page that isn't one: its tree off every route's payload, the 404 drawn exactly as today.

## The brief

**The root 404 rides every page.** `crumbs-22` measured it on `next start` (`git show $(git log --format=%h --grep='^merge: crumbs-22' -1)^2:docs/tracks/crumbs-22.md`, its first Deferred line). Next serialises each layout's `not-found` into that route's payload, so `/login`, `/pricing`, `/about` and `/help` each carry, against a root 404 that renders nothing:
- about 110 KB more HTML (16 to 23 KB gzipped);
- 43 to 56 KB more gzipped JS (10% of `/login`'s).

That is with the 404's trail already lazy. A guest album carries it too, by the same mechanism, but was not measured.

**Make the 404 cost nothing on a page that is not one**, keeping the 404 exactly as it draws today, at 1440 and at 375, and every route group's own not-found as it is (the app's, the guest's `/e/` and `/u/`, the marketing cinema's, the admin's). Two shapes, to compare:
- Next 16's `global-not-found` (doc-check it against `node_modules/next/dist/docs` first: its status in 16.2.6, what it replaces, and what it asks of the root layout);
- the 404's chrome behind one client boundary that loads only when a 404 renders.

Pick the one with the fewest ways to go wrong and say why.

**Measure before and after on `next start`:** each public route's HTML and gzipped JS (`/login`, `/pricing`, `/about`, `/help`, `/`, and a guest album by its token), in a table in your Handoff. Hold the result with a test that fails on today's code: a budget, or the 404's import graph kept off the root layout's.

**Verify:**
- the gate;
- the 404 (an unknown marketing path, an unknown `/e/` token, an unknown app route) looked at on `next start` at 1440 and at 375, before and after;
- the numbers.

**Paths:** your owns are a start. A path you need beyond them (a route group's `not-found.tsx`, a shared layout): add it to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none (the brief delegated the pick; the calls below are his to overrule)

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`: "The 404 pages" (the root 404's chrome lives in `app/not-found.site.tsx`; the
  root `not-found.tsx` draws nothing itself, with what the inline chrome cost every page and the one boundary; why
  `global-not-found` is no substitute in 16.2.6; the trail's code and sheet arrive in the site screen's chunk, the
  `trail.lazy.tsx` lines and the "still rides every page" line deleted) and one clause of the nav-clocks bullet ("the
  root 404 renders this header").

## Deferred (ROADMAP one-liners, bucket named)

- Guest (performance): the group 404s ride their groups' pages by the same mechanism: the guest link's own 404 costs
  every album load about 17.5 KB of HTML (6 KB gzipped, most of it `GuestBar`'s wordmark path) and the `(cinema)` one
  about 5 KB (1 KB gzipped) on every cinema page, measured on `next start` against both drawing nothing; one client
  boundary per group, as the root's, would take them off (from `perf-404`).

## Handoff (replaces the chat report)

- **Commits, pushed:** `675477af` (owns: the boundary, the site screen and the two tests claimed; `app/layout.tsx`
  released, unused), `5f24f616` (the work), `715c32f4` (the system doc), `71a9fed8` (one number in it: the inline
  chrome's JS cost against the floor is 43 to 56 KB, not 41), then this manifest alone. **No sync:**
  launch-prep moved to `4f945068` (crumbs-23 at `bacd6624`, its types and records), touching no path under `owns` and
  nothing the 404's graph reaches, and in `reads` only `architecture.md`'s own crumbs-23 facts;
  `git merge-tree --write-tree HEAD origin/launch-prep` merges cleanly.
- **Gates on `715c32f4`, each on its own exit code** (logs `../partyreel-wt/_scratch/perf-404/gate-*.log`; since
  then only `71a9fed8`'s doc number and this manifest changed, no code):
  `pnpm typecheck` 0; `pnpm lint` 0 (no warnings); `pnpm test` 0 (635 files, 7,559 tests);
  `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3134` 0 on `pnpm dev` (176 checks)
  and 0 under `next start` with `--production --key` (182 checks). No board, so no `lab:demo`. The smoke's PREMISE lines
  name about-press's and demo-framing's asks as describing `marketing-content.md`: the edit touched its 404 section
  and one clause of the nav-clocks bullet, none of their subjects.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `docs/systems/marketing-content.md` (System-doc
  edits), this file, `src/app/not-found.tsx`, `not-found.lazy.tsx`, `not-found.site.tsx`, `not-found.test.ts` (moved
  from `trail/trail-lazy.test.ts`), `not-found.lazy.test.tsx`, and under `src/components/shared/trail/`: `trail.css`,
  `trail.tsx` (comments), `trail.lazy.tsx` and `trail.lazy.test.tsx` (deleted). No exception.
- **The pick: one client boundary, not `global-not-found`, because it has the fewest ways to go wrong, and a built
  prototype of the other says so** (throwaway, `_scratch/perf-404/gnf.json`, `shots/gnf/`). Doc-checked
  (`node_modules/next/dist/docs/.../not-found.md`) and read in Next's source (`next-app-loader`, `app-render`'s
  `createNotFoundLoaderTree`): `global-not-found` is still experimental in 16.2.6 (a `next.config.ts` flag, which the
  build prints under "Experiments (use with caution)"); it replaces the root layout for UNMATCHED URLs only, so it must
  carry its own copy of the document (html and body, both fonts, `globals.css`, `Providers` for the theme the admin
  screen follows, the Toaster, `GlowFilter`, a title spelled without the root template); a thrown `notFound()` with no
  nearer boundary (the lab's pages, the print sheet) still falls to the root `not-found.tsx`, and without one draws
  Next's bare "404 | This page could not be found." (the prototype's `/design/library/<nope>?key=`, `shots/gnf/`); and
  Next puts it on every route's root layer, so its client islands still load on every page: the prototype cut the HTML
  to the floor plus 3 KB but left the gzipped JS 2.6 to 2.7 KB ABOVE today's on all six routes. The boundary needs no
  config, touches no layout, and keeps unmatched and thrown 404s on one drawing.
- **What shipped:** `app/not-found.tsx` keeps the metadata, the viewport and the surface branch and renders one
  reference into `app/not-found.lazy.tsx` (`"use client"`; `next/dynamic` loads `SiteNotFound` from
  `app/not-found.site.tsx`, the header, trail, words and footer that were inline, or `AdminNotFoundScreen` on the admin
  host). SSR stays on, so the 404's HTML holds the whole screen, the trail's sheet as a stylesheet link and the screen's
  chunks as preloads (`html/after/_perf_404_nope.html`).
- **The numbers**, on `next start`, before = launch-prep `63754c0a` (built twice, identical), after = `715c32f4`,
  floor = `63754c0a` with the root `not-found.tsx` returning null (`before.json`, `before2.json`, `after-final.json`,
  `floor.json`). HTML fetched with `accept-encoding: identity`, gzipped at zlib's default level; JS = every
  `<script src>`, every `<link rel=preload as=script>` and every chunk the inline RSC payload names, each gzipped from
  `.next/static` and counted once (a link's later prefetches are the linked route's, not counted). Re-run:
  `node ../partyreel-wt/_scratch/perf-404/measure.mjs --base <next start> --dir <tree>`.

  | route | HTML, KB: before → after (floor) | HTML gzipped | gzipped JS, KB: before → after (floor) |
  |---|---|---|---|
  | `/login` | 200.3 → 89.0 (88.6) | 35.9 → 19.9 | 571.7 → 517.4 (515.9) |
  | `/pricing` | 431.1 → 324.0 (323.7) | 75.4 → 53.3 | 533.8 → 492.5 (490.8) |
  | `/about` | 314.2 → 207.1 (206.8) | 57.9 → 42.3 | 524.1 → 482.8 (481.0) |
  | `/help` | 527.1 → 420.1 (419.7) | 89.6 → 67.8 | 528.8 → 487.8 (485.7) |
  | `/` | 664.7 → 557.6 (557.2) | 93.3 → 77.4 | 572.6 → 531.2 (529.5) |
  | `/e/<demo token>` (a guest album) | 246.7 → 135.3 (135.5) | 42.4 → 26.4 | 718.0 → 663.7 (663.1) |
  | 404, unknown path (the 404 itself) | 189.5 → 77.0 | 43.4 → 21.6 | 468.7 → 473.5 |
  | 404, unknown `/e/` token (the guest's 404) | 146.8 → 35.7 | 26.3 → 10.7 | 718.0 → 663.7 |
  | admin surface `/login` | 119.3 → 89.0 | 21.4 → 19.9 | 516.0 → 517.4 |
  | admin surface, a refused path | 60.7 → 28.9 | 11.7 → 10.2 | 464.5 → 421.0 |

  Every public route sheds 107 to 112 KB of HTML (15.6 to 22.1 KB gzipped) and 40.9 to 54.3 KB of gzipped JS, and
  sits within 0.3 KB of HTML and 0.6 to 2.2 KB of gzipped JS of the floor: the residue is the boundary's one chunk,
  about 1.5 KB gzipped (`next/dynamic`'s runtime and two loaders, `chunks/1830900zi-mh_.js` in the gate build).
- **Held by a test red on today's code:** `src/app/not-found.test.ts` (crumbs-22's walk, moved and widened) refuses a
  component, a client island or a stylesheet among the root 404's eager imports and pins the boundary's two lazy
  edges, the site screen still reaching the chrome, the words, the trail and `trail.css`, and the root layout reaching
  neither screen; against `63754c0a`'s `not-found.tsx` 4 fail (the boundary, "draws nothing itself", "no client
  island", the lazy edges). `src/app/not-found.lazy.test.tsx` renders the root `NotFound` through the boundary on each
  surface: the chrome and the words in the trail's stage on the app surface and unset; the portal's screen and nothing
  of the site's on the admin host.
- **The 404 drawn as today, looked at on `next start`** (`_scratch/perf-404/shots/`, `shoot.mjs`, `pngdiff.mjs`):
  the unknown marketing path, `/account/<nope>`, `/dashboard/<uuid>/<nope>` and an unknown `/e/` token at 1440 and 375,
  reduced motion, the trail's random still hidden (its facts compared instead: 20 and 11 photographs, the stage's box):
  every pixel identical before and after, title, robots, theme colour and boxes identical; dark scheme identical (a
  first-run 12-level wobble in the footer pile's photographs recurred between two builds of the SAME baseline, so it is
  the images, not this); the thrown 404 (`/design/library/<nope>?key=`) identical before and after and to the unmatched
  one; the admin host's refused path (built with `NEXT_PUBLIC_SURFACE=admin`) identical in light and dark. The 404's
  server markup, scripts and ids aside, is line for line the same (295 lines, 0 differ), so a reader without scripting
  gets the same page; a soft navigation (`router.push` from `/pricing`) draws the whole 404 with the trail; `pnpm dev`
  logs no hydration warning (its one note is Next's dev LCP hint on a trail photograph). With motion the trail walks
  at both widths (`shots/after-motion/`).
- **Live:** no `lp/*` push deploys, so the alias still serves launch-prep's 404 (its `/login` read 214.6 KB at this
  handoff, "We lost this page" in its payload); after the merge its `/login` should lose about 110 KB and the phrase,
  and the 404 should draw as it does now: the Orchestrator's look on the alias.
- Assets requested from Will: none.
- Board ideas: none (the 404's look did not change).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- **Calls his to overrule:** the client boundary over `global-not-found` (above); the admin host's screen goes behind
  the same boundary, for one rule (`not-found.tsx` draws nothing), though on the admin surface it is a wash in bytes
  (`/login` −30 KB of HTML, 1.5 KB gzipped, and +1.4 KB of gzipped JS; the refused path itself −32 KB of HTML and −43.5
  KB of gzipped JS); the trail's own lazy wrapper retires, since the whole screen is now the lazy chunk (one lazy edge,
  not two; both were preloaded from the 404's HTML anyway); the 404 page itself ships 4.8 KB more gzipped JS (the
  chrome's server parts now travel as client code in its chunk) against 112 KB less HTML (21.8 KB gzipped).
- **Look at first:** the table; `src/app/not-found.tsx` (it renders one reference); `src/app/not-found.test.ts`'s
  "draws nothing itself"; the 404 at 1440 and 375 (unchanged).
