# Testing & verification — live-testing tool gotchas

> ROLE: the home for the ways the test TOOLING (not the product) lies during a LIVE check. Read when a live (Chrome-MCP) result disagrees with what you expect.
> BELONGS HERE: live-testing tool blind-spots (Chrome MCP, the Vercel preview chrome) + the "hand the human the look" pattern. · NOT HERE: the local-FIRST-then-live POLICY (→ [`../../CLAUDE.md`](../../CLAUDE.md) "Local dev vs live testing"), unit-test infra / Vitest mocks (→ [design-system.md](design-system.md)), perf-measurement caveats (→ [`../perf/v1-baseline.md`](../perf/v1-baseline.md)).
> GROWS BY: integrate-in-place — add a note when a new tool blind-spot burns a loop; refine in place, don't append dated blocks.

The **policy** (test locally first, then deploy for the allow-list-gated flows + a final adversarial pass)
lives in [`CLAUDE.md`](../../CLAUDE.md). This doc is the **downstream** half: once you ARE driving the live
site, these are the ways the *test tooling* misreports, so a working change looks broken. The meta-rule:

> **When a live result smells like a tooling limitation rather than a real product bug, STOP before you
> build instrumentation or "fix" working code — hand the human the 10-second look ("does X actually show on
> your screen?").** Chasing a tool-blindness ghost is how you burn a loop and ship a change for a bug that
> never existed; a human eyeball confirms reality far cheaper than more tooling.

## Test accounts + fixtures (live testing runs on disposable test data ONLY)

- **Accounts:** `willg97@gmail.com` = the host (Pro) · `hi@willgibs.com` = a Free host ·
  `partyr33l@gmail.com` = the operator/admin (TOTP MFA). Google sign-in via the account CHOOSER is
  authorized for switching; typing a password/OTP is never allowed — stop and ask Will (CLAUDE.md
  "Local dev vs. live testing").
- **Media fixtures:** real images/videos live at `/Users/gibby/local/ai/partyreel-test-media`. Seed
  via REAL uploads through the product, never raw DB rows — a `media` row with no R2 object renders
  broken images and poisons later checks.

## Chrome MCP blind spots

- ★ **The Chrome MCP's tab is usually a BACKGROUND tab (`document.hidden === true`), and that changes
  ★ A fourth costume (the blog-library round, 2026-09-01): in the Browser pane the tab can report
  `document.visibilityState === "hidden"` even after `tabs_select`, and a hidden document records NO
  paint timing at all: `PerformanceObserver` for `largest-contentful-paint` / `first-contentful-paint`
  returns zero entries, not a slow number. An LCP read from the pane is therefore meaningless; measure
  vitals from a foreground Chrome tab.
  what the page does, not just what you see** (round 2, 2026-09-01). Three consequences, all of which
  read as product bugs and are not: (1) every `useAmbientPause` consumer reports `data-paused="true"`,
  so lamps sit on their base and marquees freeze; (2) `loading="lazy"` images below the fold **never
  load**, so anything that reads them (the DOM palette sampler, a contrast measurement) silently gets
  nothing -- force `img.loading = "eager"` before measuring, which is legitimate for a measurement; and
  (3) `await img.decode()` on an image that is never going to load **hangs the CDP evaluate for the
  full 45s timeout** and reports the renderer as frozen. Always race a decode against a timeout. Also
  from the same session: **a screenshot taken right after a programmatic scroll jump can capture a
  stale, all-black frame** even when computed styles say everything is visible. A 2px nudge did not
  fix it; a real scroll (`scrollBy(-80)` then `scrollBy(80)`, ~300ms apart, then ~700ms) did. Treat a
  single black frame as a capture artifact until a second read agrees. `matchMedia` is the honest way
  to know the profile's motion setting (it was ON here); do not infer it from an animation reading
  `none`. And do not append a query string to the URL you navigate to: the tool then refuses to run
  page JavaScript at all ("Cookie/query string data").

- **Ephemeral `sonner` toasts are invisible.** The Chrome MCP reads the DOM in an isolated world and toasts
  are short-lived, so a *working* success/error toast reads as "nothing happened." Don't chase it: assert
  off the underlying state change instead (the RPC's effect, a new row, a redirect, a network response),
  screenshot off that, or hand the human the look. (Unit tests mock `sonner` globally — see
  [design-system.md](design-system.md).)
- **The in-app Browser pane runs with `document.hidden === true`, which suspends the whole rendering
  loop.** In a non-interactive session the pane is never actually visible, and `tabs_select` does not change
  that. Everything the spec ties to the "update the rendering" steps therefore never runs between tool
  calls: **rAF** (so a playing canvas screenshots frozen, and any rAF frame-time sampler records ZERO
  frames — do not try to measure jank this way), **ResizeObserver** and **IntersectionObserver** delivery
  (so a Radix NavigationMenu viewport stays 0×0 because its measured size vars never arrive, and a
  scroll-sentinel header never flips to `stuck`), and **CSS transition progress** (a mid-transition
  `getComputedStyle` returns the START value forever, so an element reads as "never animated"). Each
  `screenshot` call forces ONE frame, which is why a panel often appears only on the second or third
  screenshot after the hover that opened it — and why a Radix layer whose unmount waits on
  `animationend` (Sheet, Dialog) can read as STILL MOUNTED at `data-state="closed"` long after a
  close: force a frame or two (screenshots), then re-probe, before judging presence. What still works, and is the right thing to lean on: computed
  styles, `getBoundingClientRect`, DOM/attribute assertions, real hovers/clicks, and reading a state's
  styling by flipping its `data-*` attribute by hand. Assert the MECHANISM (durations, easings,
  `transition-property`, `--tw-enter-*`, ancestor `backdrop-filter`), not the frames. The trap hiding
  inside "computed styles work": an element with a TRANSITION on the probed property. Observed 2026-08-28
  (the contact round): a label whose className provably flipped kept returning its PRE-change computed
  background through forced reflows — its `transition-colors` was frozen at progress 0 — while a fresh
  `cloneNode` (no running transition) resolved the end state correctly. For a state-driven restyle on a
  transitioning element: clone-probe, or drive real Chrome. Motion FEEL and
  `prefers-reduced-motion` (not emulable here) are never tooling-judgeable — those are the human's session.
- **Focus states do not paint while `document.hasFocus()` is false**, and `matches(':focus')` returns
  false with them, even though `document.activeElement` is correct. Any `:focus-*` styling is therefore
  unverifiable from a backgrounded seat: an `!important` `a:focus{outline}` control refuses to paint
  too, which is the check that proves it is the seat and not the CSS. Hand a keyboard pass to the human
  rather than "fixing" working CSS. (Found on the press sheet's light table, whose keyboard twin is
  `:focus-within` — see [design-system.md](design-system.md).)
- **Browser downloads land in an iCloud dir, and the network panel can lie about them.** In Will's Chrome,
  downloads save to `~/Library/Mobile Documents/com~apple~CloudDocs/cloud/downloads/` — NOT `~/Downloads`
  (confirmed 2026-08-06; a "missing" export zip was sitting there). For the export Worker specifically, the
  network panel has shown phantom/transient 503s while the stream actually succeeded — `wrangler tail
  partyreel-export` is ground truth for whether the Worker was invoked and what it returned (a bad HMAC is
  a clean "Forbidden", never a 503).
- **Isolated-world DOM + timing artifacts.** Because the MCP executes in an isolated world, buffered or
  just-painted state can be missing and timing/race effects can read as failures. The perf-baseline doc hit
  the same isolated-world caveat measuring LCP ([`../perf/v1-baseline.md`](../perf/v1-baseline.md)).
  - **Clicks aimed during an ENTER animation miss (real Chrome too).** `find`/ref clicks and any
    coordinates read while a menu/panel is still animating in aim at the MID-FLIGHT rect (a
    cross-slide had a nav link 250px right of its settled spot; the click "dismissed the menu, no
    navigation" — twice, and it looked like a product bug). Wait for the enter to settle, re-read
    `getBoundingClientRect`, then click.
  - **`javascript_tool` writes don't cross into the app's world.** A `document.documentElement.style.set
    Property('--x', …)` (or any DOM mutation) from `javascript_tool` does NOT reach the app's MAIN-world
    `getComputedStyle` readers (e.g. a hook's runtime `readMs`) — so you can't inject a CSS var to widen/slow
    a JS-read animation for easier capture (burned a loop on the S4 motion tuner). Reading inline style back
    in the SAME call + CSS-read vars DO reflect; only the cross-world *app* read is blind. Drive the real
    control instead (a slider, a click).
  - **Capturing a transient animation: use ONE `browser_batch`.** A sub-second beat/exit is gone before a
    SEPARATE screenshot tool call lands (each round-trip is ~1.5-2s, so it overshoots even a 1s window). Put
    the trigger + a short `wait` + the `screenshot` in a SINGLE `browser_batch` (in-browser-sequential →
    minimal latency) to land mid-animation; or assert the MECHANISM deterministically (computed
    `transition-delay`/`-duration`/the data-attr per element) instead of chasing the frame.
  - **An animated route can SCREENSHOT as dimmed/empty while the DOM is fully visible.** On the S4-animated
    settings route the MCP screenshot showed only a faded header (form area black) AND `getBoundingClientRect`
    on a control returned `0,0,0,0` — yet the computed styles up the whole tree were `display:block/flex`,
    `opacity:1`, `visible`, with real heights. So the page IS rendered for a real user; the CAPTURE is the
    liar, and "clicks" land on nothing because the tool's view is off. Verify visibility via computed style on
    the element + ancestors (not the screenshot), and for the interaction itself hand the human the 10-second
    look (the S5 anon-confirm modal was verified this way). Don't "fix" working UI chasing the dimmed frame.
    The careers round hit the same liar in a third costume: frames came back with the page's TEXT LAYER
    missing entirely (also all-black and all-white frames) while `elementsFromPoint`, `getComputedStyle`
    and `getBoundingClientRect` all agreed the type was painted, opaque and topmost. Forcing a repaint
    (any style write) or simply taking a SECOND screenshot returns the true frame, so never treat one
    screenshot as evidence that something is absent. ★ A FOURTH costume, the careers MERGE
    (2026-08-29): the second screenshot trick stops working entirely once the pane is HIDDEN
    (`innerWidth` reads 0 and every capture comes back black) and `resize_window` silently no-ops on
    the Chrome side while reporting success. DOM reads stay honest in both. When neither browser will
    paint, stop fighting them and verify geometry + computed style by hand, then look at the
    DEPLOYED preview, where both have always worked.

- ★ **A BROWSER EXTENSION IN THE CHROME PROFILE MANUFACTURES A HYDRATION MISMATCH** (careers merge,
  2026-08-29, ~15 minutes). The dev overlay reported "1 Issue" on every marketing page, and React's
  report pointed at `GlassLayer`'s `className` with a `+`/`-` pair — which reads as a real SSR/client
  divergence on SHARED CHROME, on a file the round had just edited. It was neither. The actual
  mismatch was `cz-shortcut-listen="true"` injected on `<body>` by an extension (React's own message
  lists this cause last, and it is easy to skim past), and once ANY mismatch occurs React prints the
  surrounding subtree with markers on nodes that never differed. **The 10-second disproof**: compare
  the curl'd server HTML against the live `element.className`. Byte-identical means the diff is
  display noise. It reproduced on /pricing too, which is the other tell — a fault in one round's file
  does not follow you to a page that round never touched. Confirm on the deployed preview
  (production build, extension-free): a clean console there closes it.

- ★ **A HIDDEN PANE CAN ALSO SCREENSHOT SOLID BLACK, on a page that is rendering perfectly** (glow
  merge, 2026-08-31). Same `document.hidden === true` root cause as the entries above, one more costume:
  on a dark surface the forced single frame can come back as a uniform fill of the body background, so
  it looks like the page failed to render rather than like the capture failed. **Do not diagnose from
  the image.** Ask the DOM instead, which settles it in one call: read `document.visibilityState`, then
  `document.elementFromPoint(innerWidth/2, innerHeight/2)` plus the target's `getBoundingClientRect()`,
  `color` and `opacity`. If elementFromPoint returns the element you scrolled to, with a real colour and
  opacity 1, the page is fine and the capture is not. ★ Rule the OTHER cause out first, because it looks
  identical and it is your own bug: a scroll past `document.documentElement.scrollHeight` also yields an
  empty frame. Check `scrollY` against `scrollHeight - innerHeight` before blaming the pane; both were
  true in the same session here, and the overshoot was the one worth fixing.
- ★ **AN OCCLUDED TAB NEVER DELIVERS THE FIRST IntersectionObserver CALLBACK** (careers merge,
  2026-08-29). With `document.hidden === true`, anything revealed ON ARRIVAL stays at its hidden rest
  state forever: the careers hero's h1 read `opacity: 0` with `.is-shown` absent, minutes after load,
  on a page that renders perfectly for a human. This is the NASTIEST of the family, because it is
  indistinguishable from the arrival-default bug the blog round exists to prevent, and the honest
  reading of the measurement is "the H1 never paints." **One scroll disproves it** (a scroll forces a
  delivery, and `.is-shown` lands immediately). Reveals further down the page fire normally, because
  scrolling to them IS the nudge - so the symptom is oddly selective, which makes it more convincing,
  not less. Sibling of the suspended-rAF trap; check `document.hidden` before believing either.

- **`read_console_messages` returns an ACCUMULATED buffer, not the current page's.** Reading it right
  after navigating to a second origin returns the FIRST origin's errors, which reads as "the bug
  followed me to prod." Same round, same fifteen minutes. Check the URLs inside the messages before
  believing what page they came from.

## Long-lived-session tests (the presign-roll soak)

Testing "the album survives the evening" (refreshed presigns adopted as the 30-min stable bucket rolls,
QA #11) has TWO setup traps that both produce a false "broken" reading, and neither is a product bug:

- **A HIDDEN tab never polls, on purpose.** `live-gallery.tsx` stops the fallback poll interval on
  `visibilitychange` (frugality + correctness) and calls `refresh()` immediately when the tab returns to
  visible. So a backgrounded soak tab collects ZERO polls, never adopts refreshed URLs, and looks dead after
  ~90 min. The soak tab must stay **foregrounded** for the whole window (which is also the real scenario:
  a host leaving the album up on a screen). Verify the setup mid-run with
  `performance.getEntriesByType("resource")` filtered to `/api/guests/gallery` — zero entries means the tab
  was hidden, not that the poll is broken. The return-to-visible refresh is itself the recovery path worth
  asserting: a phone that sleeps past the expiry repaints on wake.
- **The DEMO event cannot test it at all.** `liveEnabled` is false in demo mode ("the curated media is static
  and the simulated tiles are local-only, so skip it entirely"), so the demo `/e/` link never polls no matter
  what. Run the soak on a REAL test event's link.

## Dev-server CSS (localhost only)

- ★ **`next dev` can serve STALE Tailwind CSS, and there are TWO causes. The first is that TURBOPACK
  REUSES CHUNK FILENAMES.** Dev chunk URLs are not content-hashed
  (`[root-of-the-server]__0l0bs12._.css`), so any browser holding that URL in cache — including one
  that last saw it from a DIFFERENT WORKTREE on the same port — happily serves you another tree's
  stylesheet, or a truncated one. It has now cost four rounds. The symptoms are all "correct code
  against a stale bundle": a brand-new utility with no effect (2026-08-28,
  `lg:grid-cols-[1fr_1.6fr]` + `min-h-36`; every class that "worked" pre-existed elsewhere in the
  repo, which is what makes it invisible), "the class is in the DOM, the breakpoint matches, and no
  rule exists" (the press round, two hours), a hydration mismatch, and — the careers round —
  `w-[52%]` computing to `0px` while a `grid-cols-[repeat(auto-fill,…)]` collapsed to one full-width
  column. It reaches the SERVED PAGE too, not just CSS: the same round had correct markup in
  `curl` while the browser rendered the previous layout, fixed instantly by a `?v=2` on the URL.
  **The second cause is an ORPHANED SERVER.** `preview_stop` does not reliably reap `next-server`,
  so an orphan can keep winning the port and serve a bundle compiled before your files existed,
  which is why restarts and even an `.next` wipe can appear not to help. Its ugliest face is a page
  that renders with NO stylesheet at all, because the prerendered HTML references chunk hashes the
  running server no longer has (they 404/500).
  **The fixes, cheapest first:** add a unique query param to the URL (or to each
  `<link rel=stylesheet>` href) — a fresh URL, no restart, works mid-session; confirm exactly ONE
  server owns the port (`ps aux | grep "[n]ext-server"` and
  `lsof -nP -iTCP -sTCP:LISTEN | grep 3000`, else `pkill -f next-server` and start one); use a port
  no sibling worktree has used; or verify on the preview deploy. **Never run `pnpm build` while any
  server is up** — it rewrites `.next` underneath it and produces the same stale-hash 404s.
  **The 5-second ground truth** is the build, not the dev server:
  `grep -r "<value>" .next/static/chunks/*.css` (CSS escapes `%` as `\%` and `/` as `\/`, so grep
  the escaped form or you will "prove" a class is missing when it is there). A new-to-the-repo
  utility with no effect in dev is NOT proof the class is wrong — never rewrite working classes
  chasing dev.

- ★ **`rm -rf .next/cache` is NOT enough, and the tell is a stylesheet that is TRUNCATED rather than
  stale** (round 1, 2026-09-01). Turbopack's dev output lives in **`.next/dev/`**, which the `cache`
  wipe does not touch, so a restart can serve a chunk that is minutes old (check its mtime — it will
  look fresh) and still be missing part of your CSS. The symptom here was surgical: everything in
  `globals.css` up to ~line 1026 was present in the served chunk and the entire spill engine from
  ~line 1387 was absent, so `[data-glw]` computed `position: static` and both lamps -- including the
  SHIPPED footer one -- silently rendered as unstyled divs. It reads exactly like a CSS syntax error
  you just introduced. **Rule it out in 30 seconds before touching source:** the production build is
  ground truth (`grep -c data-glw` in `.next/static/chunks/*.css` — it was there, 96 selectors), and
  the source's own brace balance is checkable in a few lines of python. Then `rm -rf .next` (the whole
  directory, not `cache`) and restart; it came back immediately. Cost ~20 minutes of hunting a
  non-existent parse error in a file the build was compiling correctly.

- **The Preview MCP starts the dev server in the SHARED git root, not your worktree.** `preview_start`
  resolves the project by git common dir, which every worktree shares, so from `../partyreel-wt/<track>`
  it runs `pnpm dev` in `/Users/gibby/local/ai/partyreel` (the Orchestrator's checkout) and serves
  THAT branch. The tell is a 404 on a route you just wrote, or a page missing your change; confirm with
  the first line of `preview_logs`, which prints the cwd. Verifying against it is worse than not
  verifying, because it looks like a pass. **From a worktree, run `pnpm dev -p <unused port>` via Bash
  instead** (the one standing exception to "never use Bash for dev servers": the managed path cannot
  reach your tree), then drive it with `navigate` / `read_page` / `javascript_tool` as usual, and pick a
  port no sibling worktree owns (the orphaned-server trap above).

- **`next dev` can render paper surfaces DARK under a dark session theme.** With `html.dark` present
  (system-dark + no stored theme), Turbopack's dev CSS ordering lets the dark token block beat the
  `.surface-paper` re-light, so a PaperChapter (and the whole `(paper)` route group) shows dark tokens
  and the pricing pair's ink inversion flips white. **The production build resolves correctly** (verified
  2026-08-27: preview with `html.dark` → paper `lab(98.84)`), so this is a dev-only capture lie, not a
  product bug — do NOT "fix" theme CSS chasing it. Verify paper surfaces on the preview deploy, or set
  an explicit light theme on the localhost origin first. Bonus trap from the same session: a STORED
  `theme` in an origin's localStorage (from past app testing) can mask system-theme behavior entirely —
  the preview origin carried `theme: "light"` for weeks of walks.

## Vercel preview chrome

- **The dev Toolbar overlaps the UI and does not exist for real guests.** Vercel injects a dev **Toolbar**
  for logged-in team members (a floating circle on the right-middle edge) that overlaps app UI but is
  invisible to real, logged-out guests. Don't treat it as a layout bug or let it block a click: navigate by
  keyboard, or dismiss it. Anonymous curl / real guest sessions never see it.

- **Agent `lp/*` preview origins mislead in three ways; none are product bugs.** (1) They are in NO
  Supabase/R2/Stripe allow-list, so sign-in, upload, email round-trips, and checkout fail there BY DESIGN —
  the policy home is CLAUDE.md "Local dev vs. live testing"; red-team those flows on the launch-prep alias.
  (2) They build with the UNSCOPED preview env: `NEXT_PUBLIC_SITE_URL` inlines to the prod URL (absolute
  QR/share/OG links point at partyreel.com) but `DESIGN_PREVIEW_KEY` IS present on the UNSCOPED
  `preview` target as well as the `@launch-prep`-scoped one, so **the `/design` lab opens on any `lp/*`
  alias** with `?key=` (verified 2026-08-28: 200 with the key, 404 without) and an Agent can hand Will a
  lab round for a ruling straight off its own branch preview. Confirm scope with
  `GET /v9/projects/partyreel/env` rather than assuming. (3) Each alias is a FRESH origin — no stored
  `theme` in localStorage, so system-theme behavior can differ from the long-lived launch-prep origin
  (the stored-theme trap above).
