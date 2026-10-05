---
track: crumbs-74
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "f160671c"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/db/queries/guest-events-admin.ts
  - src/components/guest/event-experience-head.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(guest)/e/[token]/page.tsx
---

# lp/crumbs-74

**Goal.** The album cover's count names its kinds from the first byte ("12 photos", "3 videos", "12 photos · 3 videos") instead of both nouns until the live source arrives.

## The brief

**The fix** (ROADMAP): the cover's count glyph says both nouns until the album's live source names its kinds, because the first paint's `getGalleryStats` (`src/lib/db/queries/guest-events-admin.ts`) knows only `approvedTotal`.
- Carry the photo and video counts there, from the same read with no extra query if the row already holds them; one aggregate if not, never a per-row scan.
- Name them from the first byte, so the first paint and the live source agree: no flash of the both-nouns wording.
- Pin it with a test that fails on the old code.

Watch the cost: the guest page is the dearest call in the compute model (`../partyreel-wt/_scratch/compute-model/report.md`), so the first paint must not get heavier. Measure the read before and after and say both.

Wiring rigor: the whole gate. Nothing of yours requests the Vercel alias, partyreel.com or any *.vercel.app. Port 3131 is yours. Work economically, with no helper agents; push a WIP commit at each step (this account's weekly usage is at its end; a successor may resume you).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule (all two-way doors).

- **A mix on the cover: "12 photos · 3 videos" (the brief's example) or "15 photos & videos"?** Recommended and built: "15 photos & videos", the one home's word for a mix (`setNoun`, which the live album, the album's own line, the Save sheet and the dock already say). The brief's split would flash into "15 photos & videos" the moment the live album arrives (the goal is that the two agree), and its accessible name would no longer hold the visible number (15). The kinds a first paint now names are the photographs-only and clips-only albums ("12 photos", "1 video"), which is where both nouns was wrong. If Will wants a mix split on the cover, it is one edit to `albumCountWords`'s mix branch (`lib/export/take-home.ts`): the first paint and the live album both say it through that, but so do the album's own line and (via `setNoun`) the Save sheet, which he should see together.
- **Kinds withheld at a lock.** Recommended and built: `stats.kinds` is null unless this request is past the lock (`pastTheLock`: an open album, a password album it unlocked, or a door's pass), so a locked page's payload still carries the name and the count alone (the lock's rule; the page's redaction note says props serialize into the flight payload). Verified on the real flight payload of a password album's locked page: `"stats":{"approvedTotal":1,"guestCount":0,"kinds":null}`.
- **A teaser's first paint says both nouns.** Recommended and built: the live album cannot see into a teaser's nine and says both nouns, so a first paint that named the kinds there would flash the other way. To name kinds at a teaser too, `gallery-live.tsx`'s `countWords` would take the page's `stats.kinds` as the teaser's fallback; not worth a change to the live source for a teaser's tooltip.
- **The cost is one more head request.** Recommended and built (measured below, in the Handoff): no per-row scan, no change to the poll. If Will wants the first paint exactly as light as before, a SQL function returning the album's approved count and its videos in one statement (a migration, the Orchestrator's) would replace both heads, and `approvedCount` would read it; not proposed here: +1 request is within the noise of a page whose guest scan alone is two row pages.

## System-doc edits (in place, owned facts only)

- `docs/systems/guest-flow.md`: the Stats bullet (`{approvedTotal, guestCount, kinds}`, what `kinds` costs, where it is null) and "One true count" (the first paint names its kinds through the one `albumCountWords`, now in `lib/export/take-home.ts`).

## Deferred (ROADMAP one-liners, bucket named)

- Guests: the host's view-as-guest cover (`as-guest-view.tsx`) wires no live words, so its count says both nouns for good; `getGalleryStats` already reads `kinds` for it (its `stats` types name only the two numbers), so type them in and pass them as the cover's `mediaKinds`.

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
