---
track: halo-last
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "28ac0f81"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/pricing/pro-price-list.tsx
  - src/components/app/pricing/lock-chip.tsx
  - src/components/app/pricing/cadence-toggle.tsx
  - src/components/app/checkout-button.tsx
  - src/components/app/pricing/checkout-button.test.tsx
  - src/components/app/drive/album-picker.tsx
  - src/components/app/drive/send-steps.tsx
  - src/components/app/drive/send-steps.test.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/design-system.md
---

# lp/halo-last

**Goal.** The halo and the working words at the four call sites that waited on their lanes (a11y-halo's last line): pricing's three `focus-visible:ring` lines and its key "Opening billing", and Drive's album picker and its send steps' "Starting". Production code, the whole gate.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**The work.** a11y-halo put the house's focus halo and its working words (a key that says what it is doing while it does it) at every call site in reach; four waited on lanes that held their files, both merged now: pricing's three `focus-visible:ring-2 focus-visible:ring-ring/50` lines (`pro-price-list.tsx`, `lock-chip.tsx`, `cadence-toggle.tsx`) and its key "Opening billing" (`checkout-button.tsx`), and Drive's album picker (`drive/album-picker.tsx`) with its send steps' "Starting" (`drive/send-steps.tsx`). Wear exactly what a11y-halo wore elsewhere: read its merge (`git log --grep 'merge lp/a11y-halo' -1 --format=%B`) and the halo's home in `docs/systems/design-system.md` and `src/app/globals.css`, and compose the house's own atoms (`ui/button.tsx`'s `working` and `workingLabel`), never a new ring. Retire the ROADMAP line ("Design: the halo and the working words at the four call sites...") in your Handoff.

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke`; a Tab walk in your own headless Chrome on a local production build at 3000 (signed in as the test host through `usher/kit/redteam/signin.mjs`): /pricing's sheet, the account page's Plan card and the Send to Google Drive picker, each changed control at 375 and 1440, light and dark, the halo seen on focus and the working words seen while each key works (a throttled network makes them visible).

Model: Sonnet. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

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

- Work commits 8a4ac74e6 (the seven owned files) and the pricing-demos test fix; sync merge of launch-prep f5a20ce6f
  (it had moved); pushed on lp/halo-last.
- Gates on the synced tree 6b7651d40: typecheck 0, lint 0, test 0 (13,289 passed), `lab:smoke` 0 (155 checks, run on
  the pre-sync tree 95571696; its first pass timed out on a cold /design/library compile, the rerun was clean).
  `pnpm build` 0 (run on the tree before the sync).
- Lane check: owned paths + this file, plus ONE exception: `src/app/(dev)/design/(shell)/library/compositions/pricing-demos.test.tsx`
  (it pinned the checkout key's old "Starting" name and `disabled`; now "Opening billing" and `aria-busy`).
- Items: pricing's three rings (pro-price-list, lock-chip, cadence-toggle) and Drive's picker row are `focus-halo`
  (the row `halo-inset`: a stretched button in a clipping list); the checkout key is `working` + `workingLabel="Opening
  billing"` (disabled kept only for `away`, other doors); the Drive send key is `working={pressing}` +
  `workingLabel="Starting"`, the hand-made Loader2 swap and `cursor-progress` dropped. Busy keys are `aria-busy`, no
  longer `disabled`, so tests assert that.
- ROADMAP: retire the line "Design: the halo and the working words at the four call sites...".
- Tab walk: NOT DRIVEN. This container holds no signed-in test-host session, so the account Plan card and the Drive
  picker at 375/1440, light/dark, and the working words on a throttled network are Will's desk (Tab through /pricing's
  sheet, Account > Plan, Dashboard > Send to Google Drive; press Get Pro and Send to Drive on a slow network).
- Stale comments (not owned): `pricing-demos.tsx:69` and `pricing/leave.ts:16` still say "Starting…".
- Assets: none. Board ideas: none. Migrations / env: none. Calls his to overrule: the key's word is "Opening billing" (the
  brief's), though the same key also opens plan changes.
- Look at first: the checkout key's working face, and the picker row's inset halo.
