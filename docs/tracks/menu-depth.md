---
track: menu-depth
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b0296cfa"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/dropdown-menu.tsx
  - src/components/ui/dropdown-menu.test.tsx
  - src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx
  - src/app/(dev)/design/gallery/specimens.generated.json   # the collector's copy of that file's JSX; specimens.test.ts refuses it stale
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

- **Answered: the authority for this edit.** Asked whether to remove the dropdown menu's render-time throw on a third
  submenu level and keep its guidance as a comment, Will answered "Remove it (Recommended)" (2026-09-29). The lane
  removes the throw and what only fed it, keeps the guidance as a comment on `DropdownMenuSub`, and changes nothing
  else about the menu. The permission classifier did not refuse the edit this time (nothing stopped, the brief's stop
  rule never fired).

## System-doc edits (in place, owned facts only)

- `design-system.md`, the submenu bullet (`bce9bf7b`): "a third throws" is now guidance with its reason (two levels read
  simpler, a branch that wants a third is a group of its own under its name, and `Sub` nests as deep as Radix allows).
  crumbs-18's merge had touched other bullets of this file, none of this one; the sync was clean.
- Relayed: none.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/menu-depth`:** `053e18f8` the first Question quotes his answer and the specimen artifact
  joins `owns`, before any code was touched · `bce9bf7b` the work: the throw, its context and its Provider out of
  `dropdown-menu.tsx`, the assertion out of the test, the Library's note and its artifact, the doc bullet · `46208228`
  the guidance carries a measured reason · `9d5b2aec` **the sync**: `git merge origin/launch-prep` at `92a17054`
  (crumbs-18's merge touched `design-system.md`, which this lane owns, and `host-app.md`, which it reads; a clean merge)
  · and this manifest. launch-prep has since moved once more, by the demo-framing-r2 board alone (`0632f2c9`, its own
  folder, which imports nothing of this lane's), so no second sync.
- **Gates, each on its own exit code, on `9d5b2aec`** (docs-only commit after it; logs in
  `../partyreel-wt/_scratch/menu-depth/gate3-*.log`): typecheck 0; lint 0, no warnings; test 0 (618 files, 7,238 tests);
  `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (138 checks, 0 failing; its
  scope was the `event-ready` board, which imports `dropdown-menu.tsx`, the Library and the shell). No board, so no
  `lab:demo`. Before the sync: typecheck, lint and test on `46208228` (`gate2-*.log`; 615 files, 7,219 tests), and
  build and lab:smoke on `bce9bf7b` (`gate-build.log`, `gate-lab-smoke.log`; 137 checks), each 0.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`) = `src/components/ui/dropdown-menu.tsx`,
  `src/components/ui/dropdown-menu.test.tsx`, `src/app/(dev)/design/(shell)/library/components/gallery-demos.tsx`,
  `docs/systems/design-system.md` (all `owns`), this file, and one named exception, added to `owns` in `053e18f8`
  before it was touched: `src/app/(dev)/design/gallery/specimens.generated.json`, the collector's derived copy of
  `gallery-demos.tsx`'s JSX, which `specimens.test.ts` refuses stale (regenerated with
  `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`; only the menu specimen's comment changed).
- **Items:**
  - `dropdown-menu.tsx` (`bce9bf7b`, `46208228`): `DropdownMenuDepthContext`, the depth read in `DropdownMenuSub`, the
    render-time throw and the Provider are gone (nothing else fed them; the `React` import stays for the prop types).
    The guidance stands where the throw stood, on `DropdownMenuSub`: two levels read simpler, a branch that wants a
    third is a group of its own under its name, and nothing enforces it; the top-of-file "TWO LEVELS" block, which only
    introduced the context, went with it. The portal, the 96px floor and every other part are untouched.
  - `dropdown-menu.test.tsx`: "refuses a third level" is dropped with its scar (the review-note argument) and the
    reason that expired (that a cap had to be structural); the header and the describe title stop promising it, and `vi`
    goes with its spy. The portal test stays as it was, with its real scar.
  - The Library's menu specimen note and `design-system.md`'s bullet say it as guidance with its reason.
  - **Walked** (numbers in `../partyreel-wt/_scratch/menu-depth/walk-notes.txt`): (1) a throwaway vitest probe of three
    nested `Sub`s threw on `5ac671e8` and renders on `bce9bf7b`, every panel portalled. (2) The real `UserMenu`'s Theme
    submenu, on a probe page with the component on the current dropdown beside a copy of it on the base dropdown, by
    hover and by click: identical geometry at 375 (opens left, `[18,228,121,126]`, inside the screen) and at 1373
    (`[1016,228,121,126]`), portalled and painting; and in the lab's `event-ready` phone frame the same menu opens,
    hovers and clicks, and choosing Light switched the theme and closed the menu. (3) **Live:** on the `launch-prep`
    alias (a launch-prep build, so the base code) the Library specimen's "Who can upload" submenu, by hover and by
    click, measures exactly what the lane tree measures (`[273,603,209,126]`, portalled, painting). The probes were
    deleted, never committed. The signed-in account menu on the alias was not driven (see Look at first).
  - **A third level, seen once the throw was out:** it composes, opens by keyboard at 375 and by a stepwise mouse at
    1373, and on the account menu's geometry (end-aligned) the second panel opens left and the third opens back to the
    right, over its own parent's rows; the comment says so. One instant pointer jump from the Theme row straight into
    the second panel closed the stack at 375 (cause not investigated; a stepwise path did not).
- **Assets requested from Will:** none.
- **Board ideas:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the guidance sits on `DropdownMenuSub` and the top-of-file block is gone, worded as a
  synthesis with no quote or date; the comment adds the measured reason above, which is mine and not his; the test's
  describe title and header no longer say "never a third".
- **Look at first:** `git diff origin/launch-prep...HEAD -- src/components/ui/dropdown-menu.tsx` (thirty-odd lines).
  **For the alias red-team after the merge** (the signed-in account menu cannot run on localhost, and this change is not
  on the alias until its build; the live numbers above are the base code's, to hold it to): open the account menu, then
  Theme: hover opens it beside the panel, a click opens it and it paints, ArrowRight opens and ArrowLeft closes it, and
  choosing an item closes the whole menu; at 375 the picker opens left and stays inside the screen; and
  `/design/library/dropdown-menu`'s Manage, then "Who can upload", at `[273,603,209,126]` on a 1373-wide window.
