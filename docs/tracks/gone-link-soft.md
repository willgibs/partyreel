---
track: gone-link-soft
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
