---
track: event-settings
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

Each built on its answer and drawn on the board as a carried call or in every option, so it reaches Will where he reads:

- **What does the structure question hold?** Today's settings alone (Who can see as today's three, the lock and idle settings as today draws them), so five structures are compared holding the same things; the join modes are asked on their own step, in the structure he picks. Recommended and built.
- **Which screen first?** 375: settings is its own screen in a hand, where every row costs a scroll; 1440 on every knob (carried `phone-first`).
- **When does a change save?** As it is made, a field when you leave it, a consequential switch still confirming; no Save, so no Discard changes (carried `saves`).
- **How much does a setting say?** One line; the long explanations move into the confirm a consequential switch already opens (carried `one-line`).
- **Where does the size cap per upload go?** Under videos, Pro only, named Largest upload: its smallest step is 25 MB, so on Free it caps nothing a photo reaches (carried `size-cap`).
- **A switch another choice holds on?** Drawn on and still, its reason under it (a list and letting people in need a confirmed email) (carried `held-on`).
- **Where does Delete go?** A quiet red row at the foot of every new structure, still behind its confirm; the Danger zone card goes. Drawn in every option, so it rides the structure pick.
- **Where does Show on my profile go?** Into This event, beside the name, the note and the date; the Profile & guests card goes with the guest list's switch.
- **What happened to `choose`'s switches form?** Dropped: three switches of which one at most is on is one choice wearing three controls. The six-rung ladder stands in its place beside the two forms kept (two choices, the door in steps).
- **What stands behind a waiting door?** Nothing real, the ghost river (event-safety's `nothing-behind`, carried again because `waiting` moved here).

## System-doc edits (in place, owned facts only)

- none: a board ships no production byte, so no system doc changes.

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits**, pushed to `lp/event-settings`: `a1ae5c3a` (the board, round one) and `6eb970a8` (a group opened in place stands on its own shade). No sync commit: launch-prep moved (locked-door merged at `661f41dc`, pricing-wiring cut at `ba7d20aa`), but nothing landed in this lane's reads and `git merge-tree --write-tree HEAD origin/launch-prep` merges cleanly, so Agent boot calls for none.
- **Gates on `6eb970a8`**, each its own exit 0: `pnpm typecheck`; `pnpm lint` (0 errors; its 5 warnings all sit in files this lane never touched); `pnpm test` (520 files, 5,863 tests); `zsh scripts/build-lock.sh pnpm build`; `pnpm lab:smoke --base http://localhost:3131` (216 checks, 0 failing; event-settings reads 869 words of 1,200); `pnpm lab:demo --board event-settings --base http://localhost:3131` (9 steps, 0 failing, every step draws its options).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): everything under `src/app/(dev)/design/sandbox/event-settings/`, this file, and the brief's three named exceptions, the board's registration lines directly after help-center: `sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts` (its `SandboxId`, its row and its `DESK_ORDER` line, which `registry.test.ts` needs to hold; the Orchestrator places it).
- **The items**, nine decisions on Maya and Jay's wedding (Free, after his shift), every option drawn on the real dashboard at 1440 (the panel beside the album) and 375 (its own screen):
  - `structure` (first): today's seven cards (the reference, as they ship with his answers worn), four groups in view, a sentence per group with its detail one tap in (recommended), the settings read as sentences whose words are the controls, and presets over an Adjust fold. Each drawn as it opens (captioned with the screens it runs and the settings a host meets first: today 3.5 screens at 375, groups 2.2, summary 1, sentences 1, presets 1.9) and as Maya pauses uploads (captioned with where the act sits: today's is its Save, below the screen).
  - `opens` (after `structure=summary`): its own page under a back arrow (recommended) or in place.
  - `idle` (after `structure`): a setting that does nothing yet, the reel's look and hold with the reel off and A photo first with uploads paused, side by side: gone until it applies (recommended), greyed with its reason, or live with a note (today).
  - `lock` (after `structure`, a Plan knob for Pro): today's lock chip, a Videos switch that opens the plans, or one quiet line gone on Pro (recommended).
  - `join` (after `structure`, event-safety's `choose` reshaped): one choice of six from open to closed (recommended), two choices, or the door step by step, drawn on People you let in so the held-on email switch shows.
  - `waiting`, `queue`, `inside`, `editor`: event-safety's four staged asks, ported from `69afdbc5` with their drawings copied (event-safety retires in `safety-wiring`), staged behind `join` and drawn in the picked structure; the Guests room wears his `room=always` and `blocked=foot`.
  - Carried on the board: `phone-first`, `saves`, `one-line`, `size-cap`, `held-on`, `nothing-behind`, and his answered `newcomer=same` and `unlisted=ask`.
- **Assets requested from Will:** none.
- **Board ideas:**
  - A "See it as a guest" row in settings, opening the album as a guest meets it with the door's steps: every door setting is about what a guest meets, and today a host can only guess.
  - The settings kind's head in a hand says the event's name twice (the back arrow and the line under the bar); `popups` could drop the line wherever the back arrow already names it.
  - With videos the only lock left, `LockChip`'s password and custom link rows retire in `pricing-wiring`; if `lock=line` wins, settings has no chip left either, and the component could fold into the pricing sheet's trigger.
  - The hub's Settings card says "Public"; under the ladder it could say the rung ("Anyone with the link"), the one place a host sees the door from the hub.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. Wiring the join modes will need one (a join mode beside `events.visibility` and an invite list table, with the door's RPCs re-checking them), the wiring lane's to write.
- **Calls his to overrule:** the ten under Questions above, each drawn or carried on the board.
- **Look at first:** the structure step at 375 (`/design/lab/event-settings?session=event-settings.structure`): today's seven cards against the sentence per group, then the four groups; then flip the Screen knob to 1440 for the panel beside the album.
