---
track: crumbs-66
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b83614f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/events/visibility-labels
  - src/components/guest/event-experience-head.tsx
  - src/components/app/dashboard/events-section.tsx
  - src/components/app/event-feed/hub-reel
  - src/components/guest/reel/live-reel-view
  - scripts/compute-model/run.mjs
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/crumbs-66

**Goal.** Small fixes from red-team 53b and the round's deferred lines: the door's honest words in the hub, the album cover's sharp photos, Reset's focus, the hub reel's develop words, and the compute harness's join wait.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**★ Local only:** nothing of yours requests the alias, partyreel.com or any *.vercel.app (Hobby's Active CPU). Port 3000 is Will's desk.

**The fixes**, each pinned by a test that fails on the old code:
1. **Red-team 53b's NIT, copy:** the hub's "What a guest needs" list says "Anyone with the link or the code comes in." even when the door asks for a confirmed email, where Settings says "after confirming an email" (`src/lib/events/visibility-labels.ts`, `DOOR_STEP_LINES.public`). Say what the door really asks, from the same facts Settings reads.
2. **Red-team 53b's NIT, images:** the album header's rotating cover photos are 640 px files stretched to full width with no `srcset` (`event-experience-head.tsx`). Serve the size the screen needs from the variants that already exist (`docs/systems/uploads-and-r2.md`: the phone copy and previews). Never a new image transform: Vercel's image optimizer bills, and the compute budget counts every call.
3. **The Display quiet line's Reset** (`events-section.tsx`) drops the focus to the body, as the menu's did before crumbs-65; hand it to the Display button on its press.
4. **The hub's reel before the develop** says nothing of the develop. Its dock says "Guests get it at the develop." (the prop is `live-reel-view.tsx`'s, the wiring `hub-reel.tsx`'s, the time the Reel card's `developsAt`).
5. **The compute harness:** `pnpm compute:model`'s first scenario after its warmup (guest-join-upload) can time out at the door's name step in a full run, and an errored scenario leaves its phones polling under the next scenarios' labels. Harden the join's wait and close a scenario's devices on error (`scripts/compute-model/run.mjs`).

Wiring rigor (these ship): the whole gate. The board check is `lab:smoke` only, since no board changes.

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
