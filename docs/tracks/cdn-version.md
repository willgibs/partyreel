---
track: cdn-version
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5ed23311"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/api/album/guest/sync/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/architecture.md
  - docs/systems/database-security.md
  - docs/PRD.md
---

# lp/cdn-version

**Goal.** Will's yes to X5: an open album's "has anything changed?" answer cached at the CDN for a few seconds, so a room of lit phones costs one call, never a private answer; and AB5's cadence livelier where the cache makes that free.

## The brief

**The round's direction (Will, standing; PRD.md's "Will's product principles" hold each with its reason):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity, and attention earned (the one thing that needs her may draw the eye, beautiful and inviting, while nothing yells or crowds a screen); nothing depends on a timeline; immediate, or a clear state and a way out (a failure says what happened, that nothing was lost, and the one easy way to put it right); Partyreel runs with no AI managing it (every operator fix ships its `/admin` control, zero silent failures); cost is designed like the architecture. Production is the working version: a pick is the best of what was drawn, never a rule.

**Local only:** nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app (Vercel's Hobby CPU sits at 97% of its 30-day window), and nothing deploys. Port 3131 is yours; 3000 is Will's desk, 3130 the Orchestrator's gate. A signed-in walk runs on your own port in a headless Chrome of your own: `usher/kit/redteam/` (its `signin.mjs` mints a test host's session on a localhost base, willg97@gmail.com or hi@willgibs.com, never the operator; `docs/systems/testing-verification.md`), never Will's browser pane or his Chrome. Test data is disposable and named so ("<track> (disposable)"), deleted or listed for deletion in the Handoff.

**X5, Will's yes (2026-10-07, the Calls place):** cache an open album's "has anything changed?" answer at the CDN for a few seconds: only an open album at full access, never a password album, a gated door or a blocked viewer, and the answer a version number alone, never photos or links. Today every lit phone asks the function itself (`src/app/api/album/guest/sync/route.ts`, the client's ask on its cadence: find it and claim it in your manifest at boot), so 100 phones cost 100 calls, on a Vercel Hobby plan near its CPU line.

**Doc-check before you build (Context7, Vercel's and Next 16's own docs):** how Vercel's CDN caches a route handler's response (`Cache-Control`'s `s-maxage` and `stale-while-revalidate`, `CDN-Cache-Control`, `Vercel-CDN-Cache-Control`), what keys the cache (the full URL, which carries the album's capability), and what a cached response must never carry (a `Set-Cookie`, anything per viewer). A capability URL cached for one viewer is served to every holder of it: prove antagonistically that no response which depends on the viewer (her door, a block, a password, a host's preview) is ever cached, and that an album turning private stops serving the cached open answer within its few seconds.

**AB5, kept with an invitation (Will: "if there's an even better version of this that helps us while providing a clean live experience, I'd love to hear it"):** where the live line is blocked an album asks every 12 s, slowing to a minute when quiet, stopping past two untouched hours until a touch; a party screen rests at 5 minutes. With the answer cached, a tighter cadence may cost nothing at the function: build it where the cache absorbs it, and name the numbers in your Handoff (calls a day at a 100-guest party, before and after, and what reaches the function).

**Record:** guest-flow.md's AB5 lines refined in place, with the cache's rule and its proof; the cost named against `usher/kit/cost-model/`'s per-call lines where they meet it.

**Lanes running beside you (never edit their paths; a line you need there is an exception in your Handoff, with why):** no-signal-wiring (the upload queue, `components/guest/upload/`, the roll's counting files), crumbs-91 (the album's order, the guest page `e/[token]/page.tsx`, `event-experience.tsx`, `as-guest*`, `settings-state*`, `lib/db/mutations/events.ts`), and the boards event-page-r1 and brand-marks-r2 (their folders).

**Wiring rigor:** the whole gate (CLAUDE.md), each step on its own exit code, through `scripts/build-lock.sh`. Verify what your change adds antagonistically (its error cases, malformed input, and the cross-tenant and abuse paths of anything that reaches data), walking your own new paths once at 375 and 1440 and reading the page's text and state before a screenshot; the wide walk across surfaces, themes and assistive settings is the milestone red-team's. WHY-comments where a choice is not obvious; a test reshaped on purpose keeps its real scar and says which reason expired. A Handoff states what the Orchestrator needs to integrate and record, never an essay.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, each naming its bucket and area)

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
- Calls for Will: only a decision built in that he cannot see by using the product (plans, billing and renewals; lifecycle and timing; deletion, retention and privacy; safety and moderation; what the product does on its own), one line each, or none. A design, wording or flow choice is never one: production and the lab show it
- Look at first: ...
