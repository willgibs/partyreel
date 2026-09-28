---
track: event-settings
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "69afdbc5"            # the launch-prep SHA the branch was cut from
board: event-settings
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-settings/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/host-app.md
  - docs/systems/design-system.md
  - docs/systems/billing-caps.md
---

# lp/event-settings

**Goal.** Draw a new board, `event-settings` r1: the host's event settings designed from the ground up, as streamlined as possible, on Will's word, with event-safety's "who can join" and its four staged questions reshaped onto the new structure.

## The brief

**His words** (event-safety's `choose`, answered `?`, in `git show 69afdbc5:docs/reviews/event-safety.json`): "I genuinely believe our event settings are some of our ugliest, most unintuitive UI despite being some of the most critical to handling events. Would prefer a dedicated exploration into revamping how settings are designed from the ground up. Should be made as streamlined as possible - nesting, disabled features, pro locks, groups, UI design, everything." His principle, from another note: "we only want to add configs where the potential friction offers real benefit/value."

**Start from production and question every row.** Today's settings are `src/components/app/event-settings/` (`event-settings-sheet.tsx` and its sections: details, visibility, uploads, the highlight reel, profile and social, the danger zone), opened as popups' settings kind (an unfocused side panel at a desk, its own screen in a hand) from `src/app/(app)/dashboard/[eventId]/settings/`. Draw the widest good set of structures, not reskins. Candidates to weigh, not a list to copy:
- groups by what a host is deciding (who gets in, what guests can add, what the album shows, the reel, danger);
- one sentence per group summarizing the current state, with detail nested behind it;
- presets ("a wedding", "a party") versus switches;
- what a disabled feature looks like (hidden, greyed with its reason, or a quiet line);
- the one Pro lock.

**The ground his other answers set:**
- The guest list is always on (event-safety `room`, his note: "Always on for everyone"), so its switch is gone; `safety-wiring` is removing it now.
- A per-event block is being built (`safety-wiring`). Blocking lives on a person's look, and the blocked list at the Guests room's foot, not in settings.
- **Will's free/pro shift (his note on event-safety's `choose`, 2026-09-28), being built by `pricing-wiring`:** Free gains the password, the custom link and 60-second reels. Pro keeps videos, storage past Free's new 100 MB cap, unlimited events and no reel watermark. So in settings, the only Pro lock left is videos.

**Who can join moves here.** Port event-safety's `choose` and the four asks staged behind it (`waiting`, `queue`, `inside`, `editor`) from `git show 69afdbc5:"src/app/(dev)/design/sandbox/event-safety/spec.ts"` and its drawings. His three closed doors are "Approve newcomers", "Close to newcomers" and "An invite list", all free, with everyone already in staying in. Reshape them onto your structure, staged behind your structure question with `after`, so each is still one pick. His answered doors carry as carried calls: `newcomer=same` (a newcomer meets the same closed screen a blocked person does) and `unlisted=ask` (ask the host to let her in, with "use a different email" as a second action). `locked-door` is polishing that screen, so don't draw its words here.

**Shape:** the first question is the structure. Later questions (a group's own layout, the join doors) are staged behind it. Draw each option on the real dashboard at 1440 (the panel beside the album) and 375 (its own screen).

**Registration:** register the board directly after `help-center` in `registry.ts`, `boards.ts` and `touchpoints.ts` (its lines are your named exceptions; `DESK_ORDER` is the Orchestrator's). event-safety retires in `safety-wiring`, so never register after it. Author with `defineExploration`; the newest board is the worked example. `node usher/kit/board-card.mjs --desk` lists the open asks: ask nothing another board asks.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
