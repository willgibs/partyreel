---
track: crumbs-18
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "37d0b23f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/reporting-and-safety.mdx
  - content/help/hide-remove-and-restore.mdx
  - src/components/marketing/help/step-screens/phone-document.tsx
  - src/components/app/share/event-share-provider.tsx
  - src/components/app/share/event-share-provider.test.tsx
  - src/components/ui/popup-back.ts
  - src/components/app/media-grid.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/marketing-content.md
---

# lp/crumbs-18

**Goal.** Five small app items found this session: the host's report help article brought to what shipped, the help's phone screens mounting once, the hub's sheet history on a double tap and a reload, phone popups after a refresh, and a pushed arrival that no longer fades in.

## The brief

Five small app items this session's lanes found, each fixed at its root with a test that fails on today's code:

- **Help tracks shipped reality: the host's report article.** `content/help/reporting-and-safety.mdx` still describes the report before triage's rebuild: the form "covers the event as a whole", "Reports are anonymous", "nothing is taken down automatically the moment one arrives" (a confirmed child-abuse report now hides at once), and "never reaches your Deleted" against `hide-remove-and-restore.mdx`'s "It shows in Deleted" (settle which is true in production and make both say it). A photo has its own Report now, and the guest article (`report-a-problem-as-a-guest.mdx`, rewritten by `crumbs-16`) links to it. Check every claim against what shipped (`git show 1b29be3a^2:docs/tracks/triage-r2-wiring.md` names it); run the help tests and every policy since (the capitalized-phrase guard among them). Marketing and legal words are not yours.
- **The help's phone screens mount twice.** `src/components/marketing/help/step-screens/phone-document.tsx` mounts the phone's children into the iframe's first `about:blank` document at once and again on `load`: the shape the lab's `Frame` had (`src/components/lab/frame.tsx`, fixed by `crumbs-16`: wait for the first `load` unless the document already reads `about:srcdoc`, pinned by `frame.test.tsx`). Drive it in a browser to confirm, then give it the same fix and a test of the same kind.
- **The host's hub: a double tap on Settings (or Share) pushes two history entries** (`openSheet` in `src/components/app/share/event-share-provider.tsx` never checks the sheet is already open), so the first close goes Back to the panel still open; and a reload drops the sheet's marker, so a panel reloaded onto closes by replace and leaves a duplicate entry. The provider's `pushedRef` (crumbs-16) is the start of "this entry is ours" outliving what holds it today.
- **Phone popups after a refresh.** `src/components/ui/popup-back.ts` keeps a marker on the entry that a `router.refresh()` rewrites away (Next's refresh commits the entry with its own state alone), so by reading, a phone's place-shaped popup closed after a refresh skips its `history.back()` and leaves a dead entry. Drive it at 375 (a popup that refreshes while open) before you fix it; `pushedRef` is the fix's shape.
- **A pushed arrival fades in anyway.** `MediaTile` (`src/components/app/media-grid.tsx`) runs its 300 ms load fade even on a photograph that is complete at mount (`loaded` lands a render late), so a pushed arrival whose bytes are already there wipes in over a photograph fading in, against the album's `arrival=push` ("only its glow fades"). A photograph already complete at mount shows at once.

The history API is Next 16's patched one: read `docs/systems/host-app.md`'s bullet on the two places and `src/lib/history-state-policy.test.ts` before touching any history call, and use `src/lib/test-utils/next-history.ts`'s stand-in in tests.

**Verify:** the gate; each item walked on your dev server where localhost reaches it (the signed-in hub cannot run there: name its steps for the next build's red-team in your Handoff).

**Paths:** your owns are a start. A path you need beyond them: add it to `owns` in your manifest before editing, or name a one-line exception.

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
