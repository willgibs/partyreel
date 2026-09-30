---
track: stale-link
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "443296ab"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(guest)/e/[token]/page.tsx
  - src/app/(guest)/u/[slug]/page.tsx
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
