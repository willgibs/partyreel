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

## Chrome MCP blind spots

- **Ephemeral `sonner` toasts are invisible.** The Chrome MCP reads the DOM in an isolated world and toasts
  are short-lived, so a *working* success/error toast reads as "nothing happened." Don't chase it: assert
  off the underlying state change instead (the RPC's effect, a new row, a redirect, a network response),
  screenshot off that, or hand the human the look. (Unit tests mock `sonner` globally — see
  [design-system.md](design-system.md).)
- **Isolated-world DOM + timing artifacts.** Because the MCP executes in an isolated world, buffered or
  just-painted state can be missing and timing/race effects can read as failures. The perf-baseline doc hit
  the same isolated-world caveat measuring LCP ([`../perf/v1-baseline.md`](../perf/v1-baseline.md)).
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

## Vercel preview chrome

- **The dev Toolbar overlaps the UI and does not exist for real guests.** Vercel injects a dev **Toolbar**
  for logged-in team members (a floating circle on the right-middle edge) that overlaps app UI but is
  invisible to real, logged-out guests. Don't treat it as a layout bug or let it block a click: navigate by
  keyboard, or dismiss it. Anonymous curl / real guest sessions never see it.
