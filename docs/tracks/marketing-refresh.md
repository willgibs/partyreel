---
track: marketing-refresh
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: album-motion
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/album-motion/
  - src/app/(dev)/design/sandbox/loose-ends/
  - src/app/(dev)/design/sandbox/press-page/
  - src/app/(dev)/design/sandbox/site-chrome/
  - src/app/(dev)/design/sandbox/profile-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/marketing-refresh

**Goal.** Refresh `album-motion`'s `fall` against the album's real arrival, `loose-ends`' `review-photo` and `press-page`'s `who-for`; move `hero-tablet` off loose-ends to hero-card round 2; retire `site-chrome` and `profile-page`, whose open asks Will's built picks already answer.

## The brief

**A refresh, not a new round.** Keep each board's `round.n`, and say in `round.changed` what moved. Change only the asks named below: every other ask keeps its id, question, options, recommendation and drawing exactly, because Will may be answering those on build 12 while you work, and his answers must still transcribe. Where a frame draws production, draw production as it is at your base: open the files, never trust a spec's own claim about "today" (a read-only audit on 2026-09-28 found the drawings below out of date; each finding cites its evidence, check it before you build on it). Offer the fix at its source, and keep every road an option still holds. Your boards' `touchpoints.ts` rows are yours (their text, `asks` and `lives`; nothing else in that file). `node usher/kit/board-card.mjs <board>` prints what a board asks. Author with `defineExploration` as the boards already do.

**album-motion `fall`** (stale since milestone 29): its context and the case for `bloom` rest on "a real arrival grows into its column under a fading glow". Milestone 29 replaced that in both albums with album-columns r2's `arrival=push` (album-rows `30ac9b74`, album-window `eefe54d7`, retire-album-columns `70e634a6`): a new photo opens its row from the left edge, clipped rather than scaled, and only the glow fades (`src/components/shared/arrival.css`). The hero's album stage also still draws `GuestMasonry`, which the real album dropped for rows. `stream-engine.ts` still ships `glide`. Re-grade the four falls, plus one that opens its row, against the push, on a stage laid out in rows.

**loose-ends:**
- `review-photo`: the board's own 09-21 reshape dims the queue tile and adds a clock badge in every option, `today` included. Production's `review-switch.tsx` draws neither, and `rings` is recommended for legibility under that dim. Draw `today` undimmed, as production is, or name the dim and badge in `lands`.
- `hero-tablet` leaves this board: it sized the hero around an object hero-card is replacing. `hero-r2` draws every card option at 900 and owns that question now. Remove the ask and its drawing.
- **Untouched:** `chart-light`, `chart-dark`, `faq-look`, `phone-cycle`, `everywhere-pill`.

**press-page `who-for`:** one false clause. /contact's topic has read "Press & partnerships" since 08-28 (`src/lib/constants/contact.ts`), not "a Press topic but no Partnerships one" (`spec.ts`), and that bears on `two-doors`. Fix the context before it is asked. The other six asks are untouched.

**Retire two boards**, one commit each or together: their folders, and their lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (the `RULINGS` rows, `SandboxId`, `DESK_ORDER`; named exceptions). Their ledgers are the Orchestrator's to delete at the record.
- `site-chrome`'s three r2 asks are answered by Will's reel-story notes, built at `9277f933` and `77cfdfe9`:
  - `foot-after`: the photo pile is back under every close, and the demo link sits in the credit's place;
  - `foot-alone`: staged on it, it now draws one footer either way;
  - `foot-phone`: a phone's demo door is the link itself, in a new tab.
- `profile-page`'s two:
  - `way-back` is answered by popups `peek=card`: a name opens a quick look in place, with "Open full profile" one deliberate tap away (`src/components/social/guest-peek.tsx`);
  - `head` was answered `guest` in round 1 and is built (`/u/[slug]` mounts `GuestHeader`); round 2 reopened it only for way-back's pill.

Name any production gap you see in your Handoff; don't fix it here.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board (`album-motion`, `loose-ends`, `press-page`) at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board album-motion --base http://localhost:<port>`; `pnpm lab:demo --board loose-ends --base http://localhost:<port>`; `pnpm lab:demo --board press-page --base http://localhost:<port>`, each pressing every step.

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
