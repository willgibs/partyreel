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

- **`next dev` can serve STALE Tailwind CSS that's missing newly-introduced utilities** — resistant to
  server restarts AND an `.next` wipe in the observed case (2026-08-28: a brand-new
  `lg:grid-cols-[1fr_1.6fr]` + `min-h-36` never reached the browser; every class that "worked"
  pre-existed elsewhere in the repo, which is what makes this trap invisible). `pnpm build` emitted them
  correctly (`grep -r "<value>" .next/static/chunks/*.css` is the 5-second ground-truth check). So: a
  new-to-the-repo utility that has no effect in dev is NOT proof the class is wrong — check the build
  CSS, then verify on the preview deploy. Don't rewrite working classes chasing dev.

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
  QR/share/OG links point at partyreel.com) and `DESIGN_PREVIEW_KEY` is now present (an UNSCOPED `preview`
  row was added 2026-08-28 alongside the `@launch-prep` one, so `/design` opens on any `lp/*` alias with
  `?key=`; verified 200 with the key and 404 without). (3) Each alias is a FRESH origin — no stored `theme` in localStorage, so system-theme
  behavior can differ from the long-lived launch-prep origin (the stored-theme trap above).
