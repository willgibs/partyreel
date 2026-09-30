---
track: gone-link-soft
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "96d154d6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/proxy.ts
  - src/proxy.test.ts
  - src/lib/gone-link/
  - src/lib/supabase/middleware.ts
  - src/lib/supabase/middleware.test.ts
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/e/[token]/page.test.tsx
  - src/app/(guest)/u/[slug]/page.tsx
  - src/app/(guest)/u/[slug]/page.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/profiles-social.md
  - docs/systems/guest-flow.md
---

# lp/gone-link-soft

**Goal.** Build 30's MEDIUM: on Vercel a stale guest link or an unknown profile shows the site's generic 404, because Vercel serves its /404 for the 404 status the proxy sets. Take the proxy's gone-link read out, so each page draws its own not-found screen, server-drawn and noindex, under a 200 (a soft 404).

## The brief

**Why.** Build 30's red-team found that `stale-link`'s 404 regressed on Vercel. An unknown `/e/<token>` or `/u/<handle>` answers 404 with the root's page ("We lost this page", `x-matched-path: /404`, `x-vercel-cache: HIT`, 83,371 B). It should show the guest's own screen ("This event link didn't work") or the profile's ("There's nobody at this address").

The cause: Vercel serves its `/404` for a 404 status the proxy sets on a request it sends on (`updateSession(request, { status: 404 })`, so `NextResponse.next({ status: 404 })`), and the page never renders. `next start` honours the status on the page's own render, which is why the lane's measurements passed; its "Look at first" named this Vercel risk. The proxy's rewrites to the root not-found under a 404 (the surface rule, the lab's gate) are unaffected, because Vercel serves the same page they render. This blocks milestone 31, so the lane is small and exact.

**Do (recommended; build it): a soft 404.**
- Take the gone-link read out of the proxy. The pages already draw their own not-found screens in the HTML, titled from their not-found metadata with `noindex`. They answer 200, as `lib/gone-link`'s own fallback already does on a slow or failed read.
- Delete what only served the status: `lib/gone-link`, `updateSession`'s `status` option if nothing else passes it, and their tests.
- Reshape the tests that pin the proxy's status; each keeps its real scar.
- Correct every comment and doc that says the status is the proxy's: `e/[token]/page.tsx`, `u/[slug]/page.tsx`, `supabase/middleware.ts`, `docs/systems/marketing-content.md` and `docs/systems/profiles-social.md`.

This also takes one database read off every album and profile page load.

Under Questions, write the alternative you did not build: a true 404 that keeps the page's own screen needs a path Vercel does not intercept. Name any you find in Vercel's and Next's current docs, and mark it unverified until a deploy proves it.

**Keep:**
- unknown cinema slugs answering the site's 404 (stale-link's shape, which works on Vercel: the red-team passed it);
- the demo;
- the card route (`/e/<token>/card`);
- the surface rule's and the lab gate's 404 rewrites.

**Verify:**
- The gate.
- Tests red on today's code where behaviour changed: the proxy no longer reads or sets a status for these paths.
- On `next start` (`zsh scripts/build-lock.sh pnpm build`, then `pnpm start -p 3133`), check `/e/<unknown token>`, `/e/<a deleted event's token>` (find one with a read-only SQL query) and `/u/<unknown handle>`. Each should answer 200 with its own screen in the HTML before any script, titled "Event not found · Partyreel" or "Profile not found · Partyreel", with `noindex`.
- A found album (the demo) and a found profile, unchanged.

The alias proof is the Orchestrator's after the merge: it deploys and curls. In your Handoff, give the exact curl checks for it.

**Paths:** `crumbs-28` (handed off, merging after the milestone) edits `src/app/not-found.test.ts`'s `drawnBy` list. Touch that file only if you must, and say so in your Handoff.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **A stale link's status: the soft 404 built here, or a true 404 that keeps its own screen?** Recommended: **the
  soft 404** (built). The status has three readers, and each already gets the right answer: a guest's browser draws
  the same screen either way; an unfurler (an HTML-limited bot: Slackbot, WhatsApp, facebookexternalhit) reads "Event
  not found · Partyreel" and `noindex` from the head (measured with Slackbot's UA); a crawler meets `noindex`, which
  Next's own `loading.md` ("Status codes") says keeps a 200 out of the index. A true 404 puts a read (10 to 45 ms)
  back before every album and profile page load. **Overrule** → one of these, each UNVERIFIED until a deploy proves
  it on the alias:
  - (a, the likelier) the proxy rewrites a stale link, with NO status, to a route handler that relays the screen's
    HTML (a static page that draws it) under the handler's own 404 (Next `route.md`). The alias passes a route
    handler's own 404 through untouched: `/design/lab/tools/reel-video/fixture/<missing>?key=` answers 404 with
    `x-matched-path` its own route and its own body (`_scratch/gone-link-soft/fixture-headers.txt`).
  - (b) the proxy answers itself, `new NextResponse(<that HTML>, { status: 404 })` (Next `loading.md` "Status codes":
    "produce a 404 response"; `proxy.md` "Producing a response"; Vercel's Routing Middleware API: a middleware may
    return its own `Response`). An answer, not a request sent on, so Vercel's `/404` should not replace it; neither
    doc says.
  - Not viable: a rewrite under a 404 status (`loading.md`'s other suggestion) is the same routing-layer status as
    today's (the lab gate's rewrite lands on Vercel's `/404` on the alias, though to an unmatched path, so that alone
    does not decide it); a thrown `notFound()` (the white error shell); `global-not-found` (unmatched URLs only).

## System-doc edits (in place, owned facts only)

- `docs/systems/marketing-content.md`, "The 404 pages": the guest link and the profile draw their not-found and
  answer 200, noindex (a soft 404); the ★ landmine (a status the proxy sets on a request it sends on is Vercel's
  `/404`; the proxy's only 404s are its two rewrites to the root's own page); `lib/gone-link`'s sentence deleted.
- `docs/systems/profiles-social.md`, "`/u/[slug]` never gets a `loading.tsx`": the reason is the skeleton before the
  not-found; the proxy's 404 deleted, the soft 404 named.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Work commit `72625918`**, pushed. No sync: launch-prep moved by records only (`008e23cb`, `80248b83`:
  `docs/STATUS.md`, `docs/tracks/orchestrator.md`). Logs in `../partyreel-wt/_scratch/gone-link-soft/`.
- **Gates on `72625918`** (base `80af34f5`), each its own exit code: typecheck 0 (`typecheck.log`), lint 0
  (`lint.log`), test 0 (655 files, 7,842 tests; `test.log`), build 0 (`build.log`), `lab:smoke --production` on
  `next start` :3133 0 (181 checks, 0 failing, scope all since `src/proxy.ts` changed; `lab-smoke.log`);
  `format:check` clean. No board, so no `lab:demo`.
- **Red on today's code**: the reshaped proxy pin on launch-prep's `proxy.ts` fails: verbatim, the file cannot load
  (the real gone-link imports `server-only`); with gone-link mocked to 404 as its own test did, `/e/stale-token:
  expected [[request, { status: 404 }]] to strictly equal [[request]]` (`redcheck-proxy.log`). The middleware and page
  tests keep their assertions (that behaviour did not change): green on launch-prep's code too
  (`greencheck-oldcode.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths, the two system docs above, and
  three single-line exceptions, each a stale "the proxy's 404" left by stale-link: `src/app/(guest)/e/[token]/not-found.tsx`
  L10 and `src/app/(guest)/u/[slug]/not-found.tsx` L11 (both "…and the not-found whose head Next renders under the
  proxy's 404"), `src/app/(guest)/u/[slug]/owner-mode.test.ts` L73 ("the proxy's now (`lib/gone-link`)"). No lane
  owns them; `src/app/not-found.test.ts` untouched.
- The proxy reads nothing and sets no status for `/e/<token>` or `/u/<handle>`: `updateSession(request)` alone, with
  a ★ comment on why (`src/proxy.ts`). One database read comes off every album and profile page load.
- `src/lib/gone-link/` deleted with its test; `updateSession`'s `status` option deleted, nothing else passed it
  (`git diff f06634e5~1 -- src/lib/supabase/middleware.ts` is empty: its pre-stale-link shape).
- Tests: the proxy pin sends every page on with the request alone (a browser's load and an unfurler's, of a stale
  link, an unknown handle, the card route and `/pricing`); `middleware.test.ts` keeps rule 3's scar (the refreshed
  cookie on the response returned) and drops the status; the page tests' headers and names corrected.
- The pages are code-identical to launch-prep (comments stripped, the same hash for both pages and both
  `not-found.tsx`; `strip.cjs`): only their comments change, to say 200 and noindex.
- **`next start` :3133** (`next-start-check.log`, `check.mjs`): an unknown token, an unknown custom slug
  (`/e/no-such-album`), a deleted event's token (`/e/4b4ef53320684458b3239722ed36fa56`, from a read-only SELECT) and
  `/u/nobody-holds-this-handle` each answer 200, titled "Event not found · Partyreel" / "Profile not found · Partyreel"
  with `noindex, nofollow` in the head, for a browser's load and Slackbot's alike, the screen's h1 in the server HTML
  (about 20 KB in, ahead of the flight data), no error shell. The same after hydration in the Browser pane
  (`document.title`, the robots meta in head, navigation status 200). A client navigation's RSC fetch: 200 with the
  screen in its payload. Unchanged: the demo (200, "Add photos to Partyreel Demo · Partyreel"), `/u/willg` (200, "Will
  Gibson · Partyreel", indexable), the card route (200, image/png), `/blog/no-such-post` (404, the root's screen),
  keyless `/design` (404 by rewrite). Build 31 on the alias today: both stale links `HTTP/2 404`,
  `x-matched-path: /404`, "Page not found", "We lost this page" (`alias-before.log`).
- **The alias proof after build 32** (tried verbatim against `next start`). Expect, for both agents and all four
  paths, `HTTP/2 200`, `x-matched-path: /e/[token]` or `/u/[slug]`, the not-found title, `noindex, nofollow`, the
  screen's words, and never `__next_error__`:

  ```bash
  A=https://partyreel-git-launch-prep-partyreel.vercel.app
  UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
  for ua in "$UA" 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)'; do
    for p in /e/ffffffffffffffffffffffffffffffff /e/no-such-album /e/4b4ef53320684458b3239722ed36fa56 /u/nobody-holds-this-handle; do
      echo "== $p"; curl -s -i -A "$ua" -H 'sec-fetch-dest: document' "$A$p" | grep -aoE "^HTTP/[0-9.]+ [0-9]+|^x-matched-path: [^ ]*|<title>[^<]*</title>|<meta name=\"robots\" content=\"[^\"]*\"|This event link didn&#x27;t work|There&#x27;s nobody at this address|__next_error__"
    done
  done
  ```

  And unchanged (expect the demo 200 `/e/[token]` "Add photos to Partyreel Demo · Partyreel", `/u/willg` 200 "Will
  Gibson · Partyreel", the card 200 `image/png`, `/blog/no-such-post` and `/design` 404 `x-matched-path: /404`):

  ```bash
  D=$(grep '^NEXT_PUBLIC_DEMO_QR_TOKEN=' .env.local | cut -d= -f2)
  for p in /e/$D /u/willg /e/$D/card /blog/no-such-post /design; do echo "== $p"; curl -s -i -A "$UA" -H 'sec-fetch-dest: document' "$A$p" | grep -aoE "^HTTP/[0-9.]+ [0-9]+|^x-matched-path: [^ ]*|^content-type: [^;]*|<title>[^<]*</title>"; done
  ```

- Assets requested from Will: none.
- Board ideas:
  - `@supabase/ssr` 0.10.3's `setAll(cookies, headers)` hands the cache headers a response setting auth cookies must
    carry (`Cache-Control: private, no-cache, no-store…`, `Expires: 0`, `Pragma: no-cache`; its own types say so), and
    `updateSession` drops them. Vercel does not cache the proxy's own headers, so likely no leak today, but it is the
    library's contract and one loop in `src/lib/supabase/middleware.ts` (found in this lane's doc-check; not built:
    outside a milestone-blocking fix).
  - A malformed percent-encoding in any dynamic segment answers 500 on `next start` (`/e/%E0%A4%A`, and
    `/blog/%E0%A4%A`, which this lane never touched); the alias refuses such a URL before the app (curl got no
    response), so likely moot live.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the soft 404 itself (the Question above).
- Look at first:
  - **crumbs-28 merges cleanly after this** (`git merge-tree --write-tree origin/lp/crumbs-28 72625918`: no conflict;
    `merge-crumbs28.txt`). Two things of its to adjust at its merge: its sentence in marketing-content.md's 404
    paragraph ("draw theirs the same way with no read for the status") is now true of every page, so the contrast
    can go; and its Questions' overrule for a dead dashboard link ("a `lib/gone-link` twin … sends the request on with
    a 404") names a module this lane deleted and a status Vercel answers with its `/404`: strike it, or restate it as
    this lane's option (a).
  - **ROADMAP** (yours): the Guest (performance) line on an existence-only RPC "if the proxy's read stays" is moot,
    delete it; the Host (performance) line's "a status set before the render" is stale (crumbs-28 answers it).
  - `lab:smoke`'s PREMISE lines name about-press, demo-framing and locked-door because their asks cite files touched
    here; the edits there are the 404 paragraph and comments only, nothing their asks rest on.
