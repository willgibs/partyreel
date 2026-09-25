---
track: owner-album
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4840c3c6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/album-guest
  - src/lib/events/gallery-access
  - src/app/api/album/guest/
  - src/app/(guest)/e/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/database-security.md
---

# lp/owner-album

**Goal.** The host opening their own password event's guest page (the album, `?reel`, `?reel=screen`, so "Play on a screen" too) reads it as the owner it is, instead of crashing: the one blocker build 10's red-team found, fixed before milestone 29.

## The brief

**The failure** (build 10's red-team, reproduced three times, the only server errors on the deployment): signed in as the host, `/e/e0b1f5fcb4754992b02850b46644126a` ("Alias red-team (disposable)", a password event, one photo) answers "Something went wrong" plain, with `?reel` and with `?reel=screen`; the server logs `Error: album: the guest read refused a full-access viewer` as an unhandled rejection and the process exits 128. The page resolves the owner to full access (`isEventOwner`, `gallery-access.server.ts`), but the album's reads gate on `albumReadable()` (`src/lib/db/queries/album-guest.ts`), which lets a password album through only with the unlock cookie, which the owner never holds; `gallery-access.server.ts:336` then throws, and `/api/album/guest/sync` throws the same way at line 171, while the sync and media routes answer the owner `locked` / `access: none`. The page and the routes disagree about the owner.

**The fix:** one idea of the owner across the page and the three routes (`sync`, `media`, `manifest`): the owner passes every gate, as the rest of the guest page already does, decided server-side from `getUser()` (never `getSession()`) against the event's `host_id` through the existing `isEventOwner` (fail closed on a failed read). A refusal must never throw into an unhandled rejection: a read that is refused answers as locked, never a 500. Nothing widens for anyone else: a signed-in non-owner without the unlock cookie, an anonymous viewer and a stale cookie stay refused exactly as today, and the unlock-cookie path is unchanged.

**Tests** (the security boundary is the point): the owner reads a password album through the page's seed and all three routes; a signed-in stranger, an anonymous viewer and a wrong event's cookie are refused through each; an open event is unchanged; a thrown read becomes a locked answer. Verify locally with the routes and the page's seed; the alias's check is the Orchestrator's on build 11 (the Chrome account chooser as willg97). Put any `guest-flow.md` or `database-security.md` line the fix changes in your Handoff for the Orchestrator.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

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
