---
track: wizard-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/create-event-wizard
  - src/app/(app)/dashboard/new/
  - src/components/app/qr-preset-picker
  - src/lib/events/readiness
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/create-wizard/
  - docs/reviews/create-wizard.json
  - docs/systems/host-app.md
---

# lp/wizard-wiring

**Goal.** Wire Create as the room in Will's layout with create-wizard r2's picks (flow=carry, look=places, beat=develop), its add step left to create-wizard r3.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers.**

create-wizard r2, his desk on build 45, 2026-10-03, in full:
- flow=carry.
- add=? "These are all presented well already. This is really tough for me to decide, so let's run a second exploration so I can pick from an even more polished option set. Really important we can cleanly (yet beautifully) nail the distinction for hosts here, without overcomplicating or decision paralysis." (create-wizard r3 explores it after you merge.)
- look=places.
- beat=develop: "This is a beautiful screen and allows everything to breathe, with lots of our aurora identity infused. The steps beneath could be designed better, while remaining somewhat minimal."

Round 12's settled layout, his words: "Always keep the question up top so users aren't searching for the spot of the new one in a centered group each time." "The name screen, for example, would be 'Name your event' up top, input center, continue bottom." "Love the subtle steppers up top now." On lit: "This screen presents more cleanly with less going on (first win), but also keeps hosts in the event flow"; See it as a guest is "a final payoff, not mid-point distraction".

**Build:**
1. **Create as the room:** subtle steppers on top, the question just under them in one place, the answer's space in the centre, one button at the foot, from the board's drawings.
2. **flow=carry:** each answer rises into the head, above hairline steppers that press back.
3. **look=places:** the code where guests meet it, with four swatches re-dressing the code card and the room's screen.
4. **beat=develop:** the sample develops into her code; Print and Share stand as rounds; Settings' steps beneath are redesigned and kept minimal.
5. **The add step waits** for create-wizard r3's wiring, along with any create-time capture or develop fields. Production's Create keeps Name, Style and Ready meanwhile. The board's night slider belongs to the add step.

**Constraints:**
- `identity-wiring` merges first: sync onto it.
- `rooms-wiring` owns `host-app.md`: list your doc lines in your Handoff for the record.
- Red first.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3135`; `pnpm lab:demo --board create-wizard` at 1440 and 375 (its PREMISE moves: report what its drawings no longer match); Vitest red first for each screen's question in one place, Back, the carry, the swatches, the develop beat and the at-cap door; captures of every screen at 1440 and 375, paper and room, in your Handoff.

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
