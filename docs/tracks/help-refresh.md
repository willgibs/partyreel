---
track: help-refresh
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: help-center
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/contact-page/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/marketing-content.md
---

# lp/help-refresh

**Goal.** Refresh `help-center`'s three stale asks (the hub as the page really is, the article after the lit door and the keep step, a help link where Will's notes allow one) and `contact-page`'s two (the real form as today, the receipt without a modal), fixing one false claim in `contact-page.topic`.

## The brief

**A refresh, not a new round.** Keep each board's `round.n`, and say in `round.changed` what moved. Change only the asks named below: every other ask keeps its id, question, options, recommendation and drawing exactly, because Will may be answering those on build 12 while you work, and his answers must still transcribe. Where a frame draws production, draw production as it is at your base: open the files, never trust a spec's own claim about "today" (a read-only audit on 2026-09-28 found the drawings below out of date; each finding cites its evidence, check it before you build on it). Offer the fix at its source, and keep every road an option still holds. Your boards' `touchpoints.ts` rows are yours (their text, `asks` and `lives`; nothing else in that file). `node usher/kit/board-card.mjs <board>` prints what a board asks. Author with `defineExploration` as the boards already do.

**help-center:**
- `hub` (misdrawn from the start): `sheet`, "as today", puts the index straight under the hero. Since `49e010ff` (08-27) the real page has a row of ten category buttons in the hero, then "Start here", the filmstrip, then the index, so today is already close to `hybrid`. Redraw today accurately and reframe the question on it.
- `article`: crumbs-3 `4fb763b0` and crumbs-4 `2d2bd7f8` rewrote `how-guests-join-and-upload.mdx` to match the lit door and the keep step ("You can change it anytime.", the confirm step's words, a callout for the keep). The board still shows "Nobody has to prove a name" and a four-box code screen, where production has six boxes under "Check your email". Redraw the steps from the current article and the screens from the door as it ships, adding the keep step.
- `from-product` (reached): `contextual` draws a help link on a failed photo tile, which production never shows and Will's note rules out (no notices inside media cards; "notify the user where they are without real interruption"). Put it on the failure sheet under voice-guest `failed=exact`'s line (Retry both), or on her uploads' not-added row (its words are voice-guest round 2's; draw today's). The guest menu drawing predates door-flow `c0b113cd`: production has the "Save this event for later" card and says "Log in", not "Sign in", and Report sits at the album's foot, not in the header.
- **Untouched:** `who-first`, `feedback`, `dead-end`, `search`.

**contact-page:**
- `page` (misdrawn since round 1, `dbd046a6`): `desk`, "as today", shows the light hero over a generic text column, but the real page opens on the stationery form and its facts. Redraw `desk` with the real form, so it differs from `chapter` only in the hero.
- `receipt` (reached): drop `modal`. Will's no-interruption note argues against it, and no popup kind fits a receipt (`welcome-to-pro.tsx` is an explicit exception in `popup-kinds.test.ts`). Keep card, email and reference, with `card` still recommended.
- `topic`: fix the `optional` option's claim that the press and careers doors pre-pick a topic; only help articles do (`?about=`). The question and options are otherwise untouched.
- **Untouched:** `reach`, `urgency`, `beside`.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board (`help-center`, `contact-page`) at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board help-center --base http://localhost:<port>`; `pnpm lab:demo --board contact-page --base http://localhost:<port>`, each pressing every step.

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
