---
track: defects-app
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "da64829f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/dashboard/
  - src/lib/events/
  - src/components/guest/
  - src/components/shared/
  - src/components/app/
  - src/components/auth/
  - src/app/(app)/
  - src/app/(print)/
  - src/app/(guest)/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - src/lib/constants/tiers.ts
---

# lp/defects-app

**Goal.** The app's defects the ROADMAP names are fixed at their source: the storage step's exit to /pricing, the album skeleton's tile size, the masonry gap read, the claimed slug shown on a path with no route, the two confirm paths that never save the event, and the app's word for the bin.

## The brief

**Why now:** these are open ROADMAP "Now" lines that state a defect against a rule already on record (the bible, the identity model, the shipped product), not a product decision. Each line is quoted below with its file references; check every one against the code before you change anything (a line can be stale), fix it at its source, and list in the Handoff the exact ROADMAP line each fix closes so the Orchestrator retires it. Where a fix would need a product or copy decision the line does not make, take the recommended answer given here, build it, and list it as his to overrule; never invent a decision the brief does not give. Everything is unprotected (Rising Tides), but this lane fixes defects: it does not redesign.

**The lines (from `docs/ROADMAP.md`'s Now list):**
1. The dashboard's storage step leaves the app for `/pricing` (`src/lib/dashboard/next-step.ts:139`) instead of the in-app plan sheet (every other pricing door in the app opens the sheet; the marketing page is a click away inside it); `gated-sites.test.ts` does not cover it: route it to the sheet and cover it.
2. The guest album's skeleton takes no tile size (`src/components/guest/event-experience.tsx:1005-1010`), so it lays 8 columns at 1920 before the album lands at 7: the skeleton reads the same tile size the album uses.
3. Check `src/components/shared/masonry.tsx:363`: it reads `--gap-gallery` unresolved (`max(3px, 4px)`), so the JS column count may parse no gap. Confirm it in a browser at 375 and 1440 before fixing; if it is real, resolve the computed value.
4. The hub link row, the code mini-modal and the print sheet DISPLAY a claimed slug as `<site>/<slug>`, a path with no route (they copy and encode the permanent link); build the displayed link with the uncalled `preferredEventUrl` (`src/lib/events/share-urls.ts`; `dashboard/[eventId]/page.tsx:123`, `(print)/dashboard/[eventId]/print/page.tsx:59`), so what a host reads is what works.
5. Confirming from the Unverified mark (`unverified-mark.tsx`) or the guest name menu (`guest-name-menu.tsx`) claims the uploads but never saves the event, so it lands in the account (Events you joined) and not on the dashboard, unlike the offer card's door (`SaveEventButton`): save it on those two paths too.
6. The bin's word in the app's own strings: the delete-event dialog says "It moves to Trash" (`danger-zone-section.tsx:78`), the create wizard "the bin" (`create-event-wizard.tsx`): use "Deleted", the app's filters' and emails' word. The marketing and help copy is `defects-copy`'s.

Verify each fix in a browser at 375 and 1440 where it is visible (local first; the sign-in-gated ones on what you can reach locally, and say which you could not).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The gate on the synced tree, each step on its own exit code: `pnpm design:rules`, `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:<port>`; the surfaces the Handoff is judged on, local at 1440 and 375.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
