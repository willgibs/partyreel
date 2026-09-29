---
track: crumbs-19
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "cdc979a6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/shared/crumbs.tsx
  - src/components/shared/crumbs.test.tsx
  - src/components/shared/app-shell.tsx
  - src/components/marketing/help/step-screens/door-screens.tsx
  - src/components/marketing/help/step-screens/registry.ts
  - content/help/report-a-problem-as-a-guest.mdx
  - src/components/app/share/event-share-provider.tsx
  - src/components/app/share/event-share-provider.test.tsx
  - src/components/app/share/event-share.test.tsx
  - src/components/ui/popup-back.ts
  - src/components/ui/popup-back.test.tsx
  - src/lib/guest/reel-url.ts
  - src/lib/guest/reel-url.test.ts
  - src/components/shared/route-skeleton.tsx                             # the hold: a route's skeleton keeps the last trail on the bar until the page lands
  - src/components/shared/route-skeleton.test.tsx
  - src/lib/history-entry.ts                                             # new: the one helper (marker, restamp, address witness, one Back) the hub's sheet, a phone's place and the reel stand on
  - src/lib/history-entry.test.tsx
  - src/lib/guest/reel-url-history.test.tsx                              # new: the reel's hook against Next's patched history (reel-url.test.ts is the node project's, no DOM)
  - src/lib/history-state-policy.test.ts                                 # one line: its "sees the calls it exists for" pin names the provider's four writes, which move into the helper
  - src/components/marketing/help/step-screens/step-screens.test.ts      # its quote lists pin the album form's title the three screens no longer draw
  - docs/systems/host-app.md                                             # the two places' bullet and the crumb trail's
  - docs/systems/reel.md                                                 # the `?reel` address bullet
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
---

# lp/crumbs-19

**Goal.** Build 25's red-team finds and crumbs-18's three follow-ups: the app bar's trail cleared on a route that sets none, the guest report article's screens showing the photo's own Report, the hub's sheet closed once on a double close, the reel's history entry kept through a refresh, and a test that pins code by text distance retired.

## The brief

Build 25's red-team finds (`../partyreel-wt/_scratch/redteam-25/ledger.txt`, BUG-A and NIT-a), each fixed at its root with a test that fails on today's code:

- **BUG-A LOW: the app bar keeps a trail its route never set.** `SetCrumbs` (`src/components/shared/crumbs.tsx`) never clears on unmount, on purpose (clearing would blank the bar for a frame on every route change; the incoming route's own `SetCrumbs` replaces it), and `/dashboard` and `/account` render none. So after an event's delete redirects to `/dashboard`, the bar still reads `Partyreel > <the deleted event>`; the hub, the browser's Back to `/dashboard`, or the account menu's Account keep the last event's trail until a reload. The fix keeps what the comment protects: no blank frame between two routes that both set a trail (the layout effect writes before paint), and a route that sets none shows none. Tying the trail to the path that set it is one shape (the bar shows a trail only while `usePathname()` is the path that claimed it); every route setting its own is another. Pick the one with the fewest ways to go stale, and walk it on your dev server: the host's pages need a signed-in session localhost cannot give, so a test in `crumbs.test.tsx` carries the proof and your Handoff names the walk for the next build's red-team.
- **NIT-a LOW: the guest report article's screens draw the other form.** `content/help/report-a-problem-as-a-guest.mdx` leads with a photo's own Report (the flag beside Save and Share, the form opening with the photo named), but all three of its step screens (`report-open`, `report-reason`, `report-sent`: `ReportScreen` in `src/components/marketing/help/step-screens/door-screens.tsx`, described in `registry.ts`) draw `Report this event`, the album's form; none shows the photo's Report or its "This photo, and only this one" line. Draw the photo's report as it shipped (read the shipped lightbox's Report and its form; the screens redraw a portalled popup's shell, as `ReportScreen`'s header says), keep the article's words true to them, and keep the help tests and every policy since green (the capitalized-phrase guard among them). The callout's instant-hide words are `crumbs-18`'s ("can be hidden"): not yours.
- **The hub's sheet closes once on a double close.** `closeSheet` (`src/components/app/share/event-share-provider.tsx`) called twice before the first Back's popstate lands calls `history.back()` twice and leaves the hub (`crumbs-18` measured it with two same-tick clicks on the X; a person's double tap needs a slow popstate). `crumbs-18` recommends a closing flag that clears when the sheet leaves the URL, with a timeout as its floor, so a popstate that never comes cannot strand the panel open.
- **The reel's entry through a refresh.** `guest/reel-url.ts` keeps its own "this entry is ours" marker (`prReelPushed`), and a `router.refresh()` strips it (`crumbs-18` measured the `?reel` entry's state as `{}` after one on the demo album), so by reading `close()` replaces in place and leaves a dead entry. Drive it first, then fix it at its root. Three places now keep the marker each their own way (the provider's `?room=`, `ui/popup-back.ts` since `crumbs-18`'s address witness, and the reel); if one helper (marker, restamp, address witness) serves all three, build it and move them onto it.
- **A test that pins code by text distance.** `share/event-share.test.tsx` holds `openSheet` within 400 characters of `history.pushState`; `event-share-provider.test.tsx` holds the behavior, so the scan goes.

Every history call follows Next 16's patched API: read `docs/systems/host-app.md`'s bullet on the two places and `src/lib/history-state-policy.test.ts` first, and use `src/lib/test-utils/next-history.ts`'s stand-in in tests.

**Verify:** the gate; every item's test red on today's code and green on yours; the article's three screens looked at on your dev server at 375 and at a desk; the reel's refresh driven on the demo album (signed out, so localhost reaches it). The host's hub and pages need a signed-in session localhost cannot give: name their steps for the next build's red-team in your Handoff.

**Paths:** your owns are a start. A path you need beyond them (a page under `src/app/(app)/` if every route sets its own trail): add it to `owns` in your manifest before editing, or name a one-line exception.

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
