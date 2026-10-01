---
track: crumbs-32
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d53b02cb"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/export-dialog.tsx
  - src/components/ui/popup-back.ts
  - src/components/shared/guest-list.tsx
  - src/lib/social/cards.ts
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
---

# lp/crumbs-32

**Goal.** Seven ROADMAP items: the owner's Delete true on her guest page, an export walk surviving a reload, the bulk bars' 44px targets, a place popup's link leaving no dead Back, a guest's own upload landing once, the over-cap banner's door to the size list, and two dead optional props gone.

## The brief

Seven items the ROADMAP holds (each is its line there; find it by the words quoted), each fixed at its root with a test that fails on today's code:

- **The owner's Delete on her guest page** (from `crumbs-31`).
  - "the owner's Delete on a photo she just added on her album's guest page" says the guest's "can't be recovered" until the album's next sync hands the tile its `isHost`, though `remove_my_upload`'s host arm puts it in her Deleted.
  - After a reload that page offers her no Delete on her own uploads at all: `canDeleteIds` reads guest rows only, where the hub offers it.
  - Make both true from the first frame.
- **A reload mid-export** (from `export-wiring`): "a walk lives in the page, so a reload mid-walk forgets it". Keep its cursor in sessionStorage, so the next part is offered again.
- **The bulk bars' touch targets** (build 15's red-team): "in a hand the bulk bars' icon buttons are 28 by 28 and Download sits 32px from Remove to Deleted". Give them the 44px the peek's verdicts use, and keep the destructive one apart.
- **A link inside a place popup** (from `claims-wiring`): it "navigates away and leaves the place's same-URL history entry behind, one dead Back" (the claims review's Open album, the look's Open full profile). The place takes its entry back as a link inside it navigates (`ui/popup-back.ts`).
- **A guest's own upload fading in twice** (from `crumbs-23`, "unmeasured"). `MediaTile`'s `sameObject` is false across her object URL and the presigned preview, so the landing resets to the shimmer and fades in a second time. Measure it in a local walk first, then make the swap seamless if it is real, or retire the line with the measurement if it is not.
- **The over-cap banner's door** (from `storage-wiring`): "the over-cap grace banner says 'largest files first' with no door". It opens the size list with her own cap as the goal.
- **Code hygiene** (from the marketing refresh): `GuestListItem`'s optional `kind` (`guest-list.tsx`) and the optional `seed` in `lib/social/cards.ts` have no lab caller left to protect. Remove what nothing reads.

**Verify:**
- the gate;
- each item's test red on today's code;
- on localhost, drive what runs there.

The hub, the host's own guest page and the export walk cannot run signed in on localhost, so name their steps for the next build's red-team in your Handoff.

**Will's desk is up:** `locked-door`, `event-ready` and `disposable-mode` describe the door, the hub and the guest page. Change no word or behaviour their asks describe; `entry-modal.tsx` and the door stay untouched. If the lab crawl's PREMISE line names a board, say in your Handoff why its asks still hold.

**Paths:** your owns are a start. Add each file to `owns` in your manifest before editing, or name a one-line exception. No SQL.

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
