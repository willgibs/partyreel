---
track: crumbs-52
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "fac5dc83"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/event-experience
  - src/lib/guest/reel-url
  - src/components/guest/reel/
  - src/components/app/event-feed/reel-card
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - src/app/(guest)/e/[token]/page.tsx
---

# lp/crumbs-52

**Goal.** Fix red-team 43's second MEDIUM at its cause: the hub's Highlight reel card (a client-side navigation to the album with ?reel) shows the album for 0.3 to 1 s before the reel, because the black curtain never stands on a soft navigation.

## The brief

**Why.** Will's note on the hub, 2026-10-02: "some (reel) seems to flash a guest album as it loads the slideshow". `header-wiring` fixed it for a typed or reloaded `?reel` (the server knows `reelAsked` and the page wears the reel's black from the first byte), but build 43's red-team found the real door still flashes, verbatim from its ledger:

"MEDIUM: W3 the hub's Reel card still shows the album before the reel (the curtain never stands on the real door). Surface: /dashboard/<id> Highlight reel card (Next Link to /e/<token>?reel, a client-side navigation). Steps: willg97 E3 hub > MutationObserver on the document (curtain [data-reel-curtain], album head, imgs, dialogs) + pushState hook > click the Reel card: drive 1: the album page committed (data-event-head=album, 9 then 15 imgs) with NO curtain at +19,368 ms, the reel dialog ('Highlight reel / Make your own') only at +20,339 ms (~970 ms of album); re-driven after a fresh load + screenshot: pushState +10,643, album with no curtain +10,686, reel +11,009 (~320 ms of album). The curtain was in the DOM at no point on either drive. Likely cause: on a soft navigation the reel param's store reads window.location before Next updates the URL, so the first head bridge says viewAsked false and event-experience.tsx:615 drops the curtain at once (useReelParam's useSyncExternalStore snapshot reads window.location.search). The SSR HTML of the same URL (fetched by the owner) does carry the curtain."

**Where:** `event-experience.tsx` (the curtain: `const [curtainDown, setCurtainDown] = useState(!reelAsked); if (!curtainDown && head && !head.reel.viewAsked) setCurtainDown(true);`, about line 689) and `src/lib/guest/reel-url.ts` (`useReelParam`'s `useSyncExternalStore` snapshot of `window.location`).

**Do:**
1. Prove the cause first, red: a test of the soft navigation's order (the page committing with `reelAsked` while the URL snapshot still lacks `?reel`) that drops the curtain on today's code.
2. Fix it at the cause so the curtain stands from the first frame on a soft navigation exactly as on a hard load, and goes only once the address truly stops asking (the view closed). For example, the curtain must not drop on a snapshot that predates the navigation, or the param must be read from Next's own navigation state.
3. Leave the hub's Reel card a client-side navigation unless the fix cannot hold otherwise (say why in your Handoff).

Will's standard: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback." Never the album flashing under the reel.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3134`; the soft navigation driven in a headless Chrome of your own from a page that links to `/e/<token>?reel` with a MutationObserver on the curtain and the album head (the curtain present at the album's first commit); the signed-in hub's real card is build 44's red-team step.

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
