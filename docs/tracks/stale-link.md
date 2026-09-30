---
track: stale-link
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "443296ab"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/page.test.tsx
  - src/app/(guest)/e/[token]/card/card.test.tsx
  - src/app/(guest)/e/[token]/not-found.tsx
  - src/app/(guest)/e/[token]/not-found.metadata.ts
  - src/app/(guest)/e/[token]/not-found.screen.tsx
  - src/app/(guest)/u/[slug]/page.tsx
  - src/app/(guest)/u/[slug]/page.test.tsx
  - src/app/(guest)/u/[slug]/not-found.tsx
  - src/app/(guest)/u/[slug]/not-found.metadata.ts
  - src/app/(guest)/u/[slug]/not-found.screen.tsx
  - src/app/(guest)/u/[slug]/owner-mode.test.ts
  - src/app/not-found.test.ts
  - src/app/(marketing)/(cinema)/blog/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/careers/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/events/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/help/[slug]/page.tsx
  - src/app/(marketing)/(cinema)/not-found.tsx
  - src/app/(marketing)/marketing-dynamic-params-policy.test.ts
  - src/lib/gone-link/
  - src/lib/supabase/middleware.ts
  - src/lib/supabase/middleware.test.ts
  - src/proxy.ts
  - src/proxy.test.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/marketing-content.md
  - docs/systems/architecture.md
---

# lp/stale-link

**Goal.** A stale QR code, a gone profile and an unknown cinema slug each answer with a server-drawn not-found screen and a 404 status, never a white page waiting on a script.

## The brief

**A thrown `notFound()` is a white page on a cold phone.** `crumbs-25` measured it (ROADMAP's line, from `crumbs-25`), with `curl` on `next start` for the guest link, the public profile and every cinema slug, and read the same on the alias and on partyreel.com for the guest link. A `notFound()` thrown while a page renders is served as Next's error shell: `<html id="__next_error__">`, a 58-byte body, drawn by the client once its script has run. So a guest scanning a stale QR code meets a white page until the script loads, and a reader with no script meets it for good.

An unmatched URL's 404 is rendered on the server, and this is Next 16.2.6's own path for a not-found thrown mid-render (`app-render.js`, `ErrorApp`). It was so before any recent lane.

**Serve each of these as a server-drawn screen with the 404 status:**
- the guest link (`/e/<token>`: unknown, deleted, or an album's own refusals that end in not-found);
- the public profile (`/u/<slug>`);
- every cinema slug page that calls `notFound()`.

Doc-check Next 16's options against `node_modules/next/dist/docs` before choosing: drawing the screen from the page itself with its status, a rewrite in the proxy to a route that renders the not-found, or what the docs give for a not-found status. Pick the one with the fewest ways to go wrong and say why. The proxy refreshes the session and is no security boundary, so read `src/proxy.ts` before touching it.

Keep each screen exactly as it draws today, at 1440 and at 375, and keep every route that should answer 200 answering 200. An album behind a door, a password or Only me is not a not-found: it keeps its own screen.

**Measure before and after on `next start`:** each case's status, body bytes and first-paint content, with scripts on and blocked, in a table in your Handoff. Hold it with a test that fails on today's code.

**Verify:**
- the gate;
- each screen looked at on `next start` with and without scripts.

**Paths:** your owns are a start (the cinema slug pages, the proxy if you choose it, each group's not-found): add each to `owns` in your manifest before editing, or name a one-line exception.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The proxy now asks the database about every page load of a guest link or a handle.** None of the brief's three
  options stands alone in Next 16.2.6: a page has no way to set its own status (no API; a thrown `notFound()` is the
  white error shell, `app-render.js` `ErrorApp`, and a page that draws its own not-found answers 200), and a status is
  only ever set before the render, by routing or the proxy (the docs' own advice for a real 404, `loading.md` "Status
  codes"). So the pages draw their own not-found and the proxy sets the 404, asking the page's own RPC as nobody
  (`lib/gone-link`) on each page load of `/e/<token>` and `/u/<handle>`: never a client navigation or a prefetch, never
  the demo. The cost is that read, about 10 to 25 ms of server time for a link and 15 to 45 for a handle; on
  `next start` from this machine, 30 ms from the database, an album load read 382 ms at the median against 318 ms for
  the same album by its exempt demo token. **Recommended: keep it**: a cost below perception on every load buys a
  stale QR code's guest the screen at first paint (1.96 s on Slow 4G at 4x CPU, from 6.02 s of white) and a reader with
  no script a screen at all. **Overrule** → delete the one `goneLinkStatus` call in `proxy.ts`: the pages keep drawing
  their own not-found, at 200 with noindex (a soft 404), and nothing is ever white again.
- **An unknown marketing slug now shows the site's 404, the paper page with the trail, where it showed the dark
  cinema box.** Exactly as today is out of reach at a fair price: the proxy would need every help, blog, careers and
  events slug (the help and blog ones are MDX files, and the careers and events lists import the marketing icons into
  a proxy that runs on every request), and the four pages would render a not-found into their own ISR cache. With
  `dynamicParams = false` Next answers an unknown slug before any render, as it answers a mistyped URL: the static,
  cached root 404, with its title ("Page not found"; after hydration it read "Partyreel"). **Recommended: accept
  it**: one 404 for a lost marketing visitor, the screen his `home=notfound` pick made for exactly them, and ROADMAP's
  open line on the two 404 grammars half-answered. **Overrule** → keep the box: a build-time slug list in the proxy
  and the four pages drawing the cinema screen themselves (a follow-up).

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`, The 404 pages: the thrown-`notFound()` line refined (its measured white time,
  why a server-drawn 404's status must be set before the render, the three links' answers, what still throws), and By
  audience (a bad marketing slug is the root's now).
- `docs/systems/profiles-social.md`: the `/u/[slug]` loading.tsx line (the 404 is the proxy's; the page draws its
  not-found at the top).

## Deferred (ROADMAP one-liners, bucket named)

- Host (performance): a `notFound()` thrown in the host app or the portal (a dashboard link to a deleted or not-yours
  event, a missing admin record) is still Next's white error shell on a cold load; the guest link's answer (the page
  draws its own not-found, a status set before the render) would reach it (from `stale-link`).
- Guest (performance): if the proxy's read stays, an existence-only RPC for a handle would halve its cost (the proxy
  runs `get_public_profile` whole, events arms included); a migration, so only if a handle's 15 to 45 ms matters
  (from `stale-link`).

## Handoff (replaces the chat report)

- **Work `f06634e5`, pushed.** launch-prep moved only by a record (`5b1b4503`, `docs/tracks/orchestrator.md`), so no
  sync.
- **Gates on `f06634e5`**, each on its own exit code: typecheck 0, lint 0, test 0 (655 files, 7,795 tests), build 0,
  `lab:smoke --base http://localhost:3133 --production` 0 (180 checks, 0 failing; scope all, since the proxy changed).
  No board, so no `lab:demo`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file + the two system docs
  above (Record subtractively).
- **The mechanism, and why it is the one with the fewest ways to go wrong** (the first Question): Next 16.2.6 has no
  status a page can set, and a `notFound()` thrown before the stream is exactly the error shell (read in
  `app-render.js`: a shell error renders `ErrorApp`, `<html id="__next_error__">` over the main flight data). A
  status set before the render is kept, and with it Next heads the page from the nearest not-found
  (`getRSCPayload`'s `errorType`), both measured on `next start`. So the page draws, the proxy sets the status, and
  the page stays the one judge of what exists: a failed or slow read (750 ms) leaves the status alone and the page
  still draws its screen. A proxy rewrite to a not-found route was the other shape: an unmatched target draws the root
  screen from its one static page (no per-path screen without a flash), and a matched one needs the same read.
- **The items:**
  - The proxy's 404 (`src/lib/gone-link/index.ts`, `src/proxy.ts`, `src/lib/supabase/middleware.ts`): the page's own
    RPC asked by nobody, on page loads only. ★ Next strips `RSC` and the router headers from a proxy's request
    (`proxy.md`, "RSC requests and rewrites"), so the router's own fetches are told apart by `Sec-Fetch-Dest`: a
    client navigation to a gone link stays in the same document, its flight fetch 200, and draws the screen with its
    title (driven in Chrome, `/u/willg` → `/e/<gone>` and `/u/<gone>`); a 404 there would have sent the router to a
    full reload. Tests: `gone-link.test.ts` 11, `proxy.test.ts` +2, `middleware.test.ts` 3 (the status survives a
    refresh rebuilding the response, with its cookie).
  - The guest link and the profile draw their own not-found screen (`page.tsx`, the screen directly, never
    `notFound()`), titled from `not-found.metadata.ts`, which their `not-found.tsx` reads too. The screen rather than
    the lazy boundary: importing the boundary widened two references to the page's 18 to 21 chunks on every found
    load (+1.1 KB raw, +90 B gzipped, measured); the screen's parts are already the page's, so found albums and
    profiles are byte for byte (44,387 and 46,639 before and after). `e/[token]/page.test.tsx` and
    `u/[slug]/page.test.tsx`, red on launch-prep (`NEXT_HTTP_ERROR_FALLBACK;404`, "Join event", "Profile").
  - The relay (build 28's red-team): "Event not found · Partyreel" after hydration, measured (the table) and pinned;
    the profile had the same bug ("Profile"), and the cinema's hydrated title was "Partyreel".
  - The four marketing `[slug]` pages declare `dynamicParams = false` (the second Question):
    `marketing-dynamic-params-policy.test.ts` sweeps every marketing page under a dynamic segment, red on launch-prep
    for all four.
  - Reshaped, each keeping its scar: `owner-mode.test.ts` (the not-found drawn before any boundary; the status is the
    proxy's now), `card.test.tsx` (an unknown link names no card of its own; "Join event" was only ever the hydrated
    title), `not-found.test.ts` (`drawnBy`: the page that draws its own screen may import it, on one line).
  - Kept 200 with their own screens: the password album and an Only me album (a disposable one, "stale-link probe",
    made for the check and soft-deleted after, when its link turned to the 404 at once).
- **Before → after on `next start`** (`_scratch/stale-link/measure.mjs`: the raw response, then headless Chrome with
  scripts blocked, with scripts on, and on Slow 4G at 4x CPU; screenshots at 1440 and 375 in `_scratch/stale-link/shots`,
  the guest link's and the profile's 404 with scripts on byte-identical before and after at both widths):

| case | status | HTML bytes | drawn body bytes | h1, scripts blocked | title after hydration | FCP ms, Slow 4G 4x CPU |
| --- | --- | --- | --- | --- | --- | --- |
| guest link, unknown | 404 | 18,949 → 55,846 | 38 → 15,817 | blank → "This event link didn't work" | Join event → Event not found | 6,020 → 1,952 |
| guest link, deleted | 404 | 19,014 → 55,885 | 38 → 15,817 | blank → "This event link didn't work" | Join event → Event not found | 6,036 → 1,960 |
| profile, unknown | 404 | 17,994 → 52,670 | 38 → 15,334 | blank → "There's nobody at this address" | Profile → Profile not found | 5,756 → 1,972 |
| help, unknown | 404 | 131,363 → 78,829 | 38 → 64,257 | blank → "We lost this page" (the root's) | Partyreel → Page not found | 6,364 → 1,816 |
| blog, unknown | 404 | 78,155 → 78,829 | 38 → 64,257 | blank → "We lost this page" (the root's) | Partyreel → Page not found | 6,288 → 1,816 |
| careers, unknown | 404 | 79,082 → 78,829 | 38 → 64,257 | blank → "We lost this page" (the root's) | Partyreel → Page not found | 6,308 → 1,840 |
| events, unknown | 404 | 78,518 → 78,829 | 38 → 64,257 | blank → "We lost this page" (the root's) | Partyreel → Page not found | 6,380 → 1,824 |
| unmatched URL (reference) | 404 | 78,829 | 64,257 | "We lost this page" | Page not found | 1,880 → 1,816 |
| album, open (demo token, exempt) | 200 | 121,144 → 121,088 (a seed per visit) | 78,671 → 76,842 | "Partyreel Demo" | Add photos to Partyreel Demo | 2,348 → 2,360 |
| album, by its custom slug | 200 | 121,003 → 120,830 (a seed per visit) | 78,612 → 76,666 | "Partyreel Demo" | Add photos to Partyreel Demo | 2,360 → 2,348 |
| album, password | 200 | 44,387 | 18,492 | the album's name | the album's name | 1,768 → 1,940 |
| album, Only me (after only) | 200 | 43,738 | 16,483 | "This album is closed" | Private event | 1,952 |
| profile, real | 200 | 46,639 | 18,466 | "Will Gibson" | Will Gibson | 2,000 → 2,000 |
| help, blog, careers, events, real | 200 | unchanged, each | unchanged | the page's own | the page's own | within 100 ms, each |

- **The read's price, measured:** on `next start` the same album answered at a median 382 ms by its custom slug (read)
  against 318 ms by its exempt demo token (15 each, alternating; the slug's own lookup is a little slower too); a gone
  link, 118 ms. From this machine the database is ~30 ms away; Vercel's iad1 sits beside its us-east-1.
- **Assets requested from Will:** none.
- **Board ideas:** one 404 grammar across the marketing site: with unknown slugs on the root's screen, the cinema box
  draws only for a cinema page's own `notFound()`, and none throws one today; retire it, or give the root's screen the
  cinema skin.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (an existence-only RPC for a handle only if
  the read stays and its cost matters: Deferred).
- **Calls his to overrule:** the proxy's read on every page load of a guest link or a handle (keep, or drop for a soft
  404); an unknown marketing slug on the root's 404 rather than the cinema box.
- **Look at first:** Vercel. On `next start` the proxy's `NextResponse.next({ status: 404 })` sets the page's status
  (the table); Vercel's Routing Middleware docs list `status` among `next()`'s options, and the lane cannot deploy.
  On the alias: `curl -sI <alias>/e/stale-link-nope-000` and `/u/stale-link-nope-000` should answer 404 with the
  screen in the HTML; a 200 there means the screen is still server-drawn with noindex (a soft 404) and the read buys
  nothing, which makes the first Question's overrule the answer. Then `lab:smoke`'s premise notes: locked-door (4
  asks), about-press (2) and demo-framing (3) describe files this touched; the screens draw byte for byte, and
  locked-door's `lost` pick would land in `not-found.screen.tsx`, which both paths draw.
