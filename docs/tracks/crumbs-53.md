---
track: crumbs-53
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "4ff5c0ab"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - content/help/how-partyreel-works.mdx
  - content/help/day-of-checklist-for-hosts.mdx
  - content/help/share-the-album-after-the-event.mdx
  - content/help/turn-off-uploads-or-cap-file-size.mdx
  - content/help/print-or-display-your-qr.mdx
  - src/lib/constants/how-it-works
  - src/components/marketing/sections/features/album/album-copy
  - src/components/marketing/sections/features/album/getting-in-stage
  - docs/systems/reel.md
  - src/components/guest/foreign-ticket
  - src/lib/disposable/develop-words
  - src/components/app/event-settings/camera-settings
  - src/components/guest/upload-tracker
  - src/components/marketing/sections/features/album/everywhere
  - src/components/app/pricing/gated-sites
  - src/components/shared/route-skeleton
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/ROADMAP.md
  - docs/systems/guest-flow.md
  - docs/systems/dashboard.md
  - content/help/AUTHORING.md
---

# lp/crumbs-53

**Goal.** The next words and small homes made true after round 12: five help articles and three marketing lines still placing the reel at the album's top or the guest on a welcome screen, reel.md's retired tile, the welcome's cookie in its tests, one home for the develop time's words, and the hero fill's and the pulse's last names in code.

## The brief

**Why.** ROADMAP lines from `crumbs-51` and `door-reveal` (quoted there; retire each you finish by naming it in your Handoff, never by editing the ROADMAP):
1. **Help:** `how-partyreel-works.mdx` (:40), `day-of-checklist-for-hosts.mdx` (:53), `share-the-album-after-the-event.mdx` (:29) and `turn-off-uploads-or-cap-file-size.mdx` (:41) still play the reel "at the top" of the album, where the cover's round play button opens it (and the shutter's right-hand round deep in the album); `print-or-display-your-qr.mdx` (:50) has guests land on a "welcome screen", the doorway's page.
2. **Marketing:** `how-it-works.ts` (:130), `album-copy.ts` (:37) and `getting-in-stage.tsx` (:21) say a guest lands on "a welcome screen" that asks for a name; the welcome is the doorway's page and the name rises over it as a sheet (after the email where verification is on). Find each file by its name if a path above is off.
3. **Docs:** `reel.md` still draws the retired tile (:4, :9, :17, :50, :74, :144, :171, :187) and links Settings' `highlight-reel-card.tsx` (:152), now `event-settings/reel-page.tsx`; the reel's face is the album's cover (`guest-flow.md`'s album head).
4. **Tests:** `foreign-ticket.test.tsx` pins the welcome by the legacy `pr_welcome_<qr>` localStorage key; the flag is a cookie since `door-reveal`, so its five assertions read `document.cookie` (and `forgetWelcome`'s legacy put-down stays only if a test proves a reader).
5. **One home for the develop time's words:** the host's (`camera-settings.tsx`'s `DEVELOPS`) and the guest's (`upload-tracker.ts`'s `developTimeWords`) say one format twice; one formatter in `src/lib/disposable/` (a new `develop-words` file) holds both, under a test.
6. **Code hygiene:** the retired hero fill and the pulse live on in `everywhere-peek.test.tsx` (:239), `everywhere-section.tsx` (:14), `gated-sites.test.ts` (:94, :139) and `route-skeleton.test.tsx` (:45) (the dashboard page's own two at `dashboard/page.tsx` :109 and :295 are named in your Handoff, not edited: name the words they should say).

No product behaviour changes; words only where a test can hold them. Will's standard: far less text, never a tool's voice.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3133`; each changed help article read on your dev server at 375.

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
