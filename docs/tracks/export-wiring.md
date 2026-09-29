---
track: export-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "2e385f61"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/export/
  - src/lib/export/
  - src/app/api/export/
  - workers/export/
  - content/help/download-photos-videos-and-albums.mdx
  - content/help/browse-the-album.mdx
  - src/app/(dev)/design/sandbox/export-flow/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/export-flow.json
  - docs/systems/uploads-and-r2.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
---

# lp/export-wiring

**Goal.** Build Will's six `export-flow` answers into Download: the Yours row, a toast that stays with a subtle cancel, a one-line refusal for an empty zip, a big album walked through as parts in plain words, and a phone's Download all saved to Files; then retire export-flow.

## The brief

**His answers** (`docs/reviews/export-flow.json`, each note there; the board's drawings in `src/app/(dev)/design/sandbox/export-flow/`):
- `means=mine`: a Yours row at the menu's top downloads her own uploads. His note: it "does support getting any pictures/videos you took live in-app". Yours is filtered on the server by her own capability token or account, never an id list from the browser.
- `wait=toast`: the toast keeps her in the loop where she is ("rather than at the top of the page"). The Orchestrator's read of his "flag this if bad call": a good call, so long as the toast stays until the zip is ready and carries the stuck state's cancel.
- `stuck=retry`, his note: "include a subtle x icon on the right side to cancel if desired. Interruptibility is a huge win in UX." A cancel stops the wait and, where the Worker can, the work.
- `hollow=refuse`: a wholly empty zip is refused, in one clean line (his note: "Copy should be cleaner and 1 line"). A short zip keeps his `failed=exact` style from the board.
- `cap=split`, his note: "Download all should be as easy as possible, even over 2000 items/20GB. Would hate for someone to think they downloaded everything then delete the event not knowing. However, rather than messily saying ', in 2 zips' that should just be made clear and walked through in the download flow. Nobody in my family would understand 'in 2 zips'."
  - Over the limit, Download all walks her through the parts in plain words ("Part 1 of 2") and says plainly when every part is saved.
- `phone=?`, his note, built as the answer (the board's `zip`): "Download all does not need to download straight into native photos the way individual media should. This can be catered toward the best big download path(s), like saving directly to files." A single photo keeps its Save to Photos.

**★ The export Worker** (`workers/export/`, `partyreel-export`) is one deployment that partyreel.com (milestone 29's app) uses too. Every change stays backward compatible with that app's requests: new parameters optional, old responses unchanged. Prove it with a test that replays milestone 29's request shapes (`git show milestone-29:src/lib/export/export-service.ts`). The Orchestrator deploys the Worker after your merge (`wrangler whoami` first). Name what the deploy needs (a secret, a route) in your Handoff; never deploy it yourself.

**Then retire `export-flow`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's.

**Paths:** the guest album's Download all entry lives in guest files (`live-gallery.tsx`, `gallery-skeleton.tsx`): add what you need to `owns`, or name a one-line exception. `help-wiring` holds the tracker and the guest's name menu this batch.

**★ The block's door stays on every export path.** `safety-wiring` merged the per-event block: `src/app/api/export/guest/route.ts` asks the closed door (`src/lib/events/closed-door.server.ts`), so a blocked person's export answers exactly as a private album's. Every path you add or reshape, Yours included, keeps that check, pinned by a test.

**Verify:**
- Vitest for the parts, the cancel, the empty refusal and Yours' server filter; the Worker's own tests, the compatibility replay included.
- The menu and the toast at 1440 and 375.
- `pnpm lab:smoke` whole.
- The next build's red-team walks it short of any download.

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
