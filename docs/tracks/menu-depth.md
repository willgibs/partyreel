---
track: menu-depth
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "b0296cfa"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/dropdown-menu.test.tsx
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - docs/systems/design-system.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
---

# lp/menu-depth

**Goal.** On Will's word, remove the dropdown menu's render-time throw on a third submenu level, keeping its guidance as a comment and the sub-menu's portal test.

## The brief

**His answer** (2026-09-29): asked "The dropdown menu throws an error if anyone nests a third submenu level. That started as your note that two levels read simpler, and it hardened into a render-time crash. Production nests only one level. The permission system refused the lane's edit removing it. Remove the throw and keep the guidance as a comment?", Will answered "Remove it (Recommended)". The `unfence` lane's attempt was refused by the permission classifier before his answer; quote his answer in your manifest's first Question as the authority for this edit.

**Do:** in `src/components/ui/dropdown-menu.tsx`, remove the render-time throw on a third submenu level (`DropdownMenuDepthContext` and the throw in `DropdownMenuSub`, and whatever exists only to feed them); leave a comment where it stood: two levels read simpler, and a third branch flattens into a named group. In `dropdown-menu.test.tsx`, drop the throw's assertion with its scar and the reason that expired, and KEEP the test that a sub-menu portals out of the clipping panel (a real function). Then the words that describe the throw follow: `docs/systems/design-system.md`'s submenu bullet ("a third throws") and the Library's menu specimen notes (`src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx`,) say it as guidance with its reason. Production nests one level (`user-menu.tsx`): walk it on your dev server, the sub-menu opening and portalling exactly as before.

If the permission classifier refuses the edit again: stop, do not retry it in any form or through any other route, write what happened under Questions, and hand off.

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
