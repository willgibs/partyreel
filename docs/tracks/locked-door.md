---
track: locked-door
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "18491027"            # the launch-prep SHA the branch was cut from
board: locked-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/locked-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/locked-door.json
  - docs/reviews/event-settings.json
  - src/components/guest/
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
---

# lp/locked-door

**Goal.** Draw `locked-door` r2, widened into the door family: the welcome that opens, the waiting door while the host decides, the one shut door for every newcomer turned away, and the previous guest's line, designed together as one family, shared or bespoke per screen.

## The brief

**His r1 answers** (`docs/reviews/locked-door.json`, 2026-09-29):
- `lock=host`, not a direct selection: "I'd like to see more polished/creative explorations off of this and option 2 (today's lit), as well as maybe one fresh one. Today's closed screen falls short, but I'm still not in love with our door design either. Curious if we can unlock something perfect for everything, whether shared or bespoke to each screen."
- `previous=private`: "if I knew I was previously a guest at an event and hit a screen that felt like I was blocked as a newcomer, I'd get frustrated and try to find the \"right\" way in. Differentiating these lets me know that it was changed to private." Settled: `settings-wiring` builds this line now on today's screen; draw it inside every option, never ask it again.
- From `event-settings` r1, `waiting=held` ("The lit door waits, and opens itself"): "This could definitely be redesigned to be a more engaging waiting experience."

**This round widens the board into the door family.** "Our door design" is the door every guest meets (`src/components/guest/door/`: the lit door, the welcome's hero, the lamp; the chooser, the name and email steps). Draw every state of it as one family, so the door is judged whole rather than one screen at a time:
- the welcome that opens (a Public album, or a gate's first step);
- the waiting door while the host decides (approve newcomers), which opens itself the moment she is let in;
- the shut door, one screen for every newcomer turned away: an Only me album, a closed door, a decline, an address not on the invite list, a block (event-safety's `newcomer=same`: none may be told apart, so the words stay true of all five);
- the previous guest's line on the shut door, shown only to someone who was in (her cookie or account), which a blocked former guest reads too.

**The vocabulary is `settings-wiring`'s, built beside you:** what the link opens is Public, Private (a gate: a password, the host lets each person in, an invite list, or only people already in) or Only me; a gate stops newcomers, and only Only me and a block shut out someone already in.

**The questions** (the widest good set each, every option on the real surfaces at 1440 and 375, graded against today's):
1. The family's direction: the host's door (r1's option 4, the welcome's hero closed with the album's name and the host's face) pushed further, today's lit column (r1's option 2) pushed further, and one fresh direction, each drawn across all four states.
2. Whether the states share one design or each gets its own, drawn both ways.
3. The waiting door as a wait worth holding (his note), inside the family.
4. Whether the 404 (today's lock shares the not-found family, `src/components/shared/not-found-screen.tsx`) follows the shut door or keeps its own.

**Ask nothing `disposable-mode` r2 asks:** its waiting room is the camera's, inside the album after the door; a sibling in mood, not in job. The board's `touchpoints.ts` rows are yours (nothing else in that file); the round bumps in place, r1's ledger stays, and r2's asks replace r1's in `asks`. `node usher/kit/board-card.mjs --desk` lists every open ask.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Where does an address not on the invite list meet `unlisted=ask`?** Recommended and built: on the shut door
  itself, under the one message every cause reads, as the door's foot for that reader alone: Ask Maya to let me in
  (primary), Use a different email (secondary). Asking takes her to the waiting door; a declined ask meets the shut
  door with no ask. The message never moves, so a block still reads as the other four. `settings-wiring` builds the
  unlisted door now: if it puts the ask on its own step instead, the board's foot follows it (a carried call).
- **What may each direction's shut door show of the album?** Built as each direction's own, measured under every
  frame: the host's door names the album and shows the host's face (r1's `host` cost, which his answer took as the
  direction); the doorway names the album and the host in words; the lit column names neither ("the host"). Picking a
  direction picks its disclosure.
- **Is each direction judged in its own shape?** Recommended and built: yes. `family` draws each direction at its best
  (the host's door and the doorway one design throughout, the lit column and today the sheet that opens beside a page
  that does not), and `shape` then draws the picked direction all three ways, so the two decisions never blur.
- **The `pick` wait holds files on the phone before she is let in.** Built as a drawing only: nothing leaves the phone
  until the host lets her in (the upload queue already waits on a ticket for somebody else's session), and a decline
  sends nothing. Its proof is the wiring's.
- **What are the staged asks drawn in before `family` is answered?** Built: the recommendation (the doorway), so
  `family` declares no `today`. In today's door two of them have nothing to ask (today's shut door is already the
  404's sibling, and today's welcome is the sheet in every shape), which `lab:demo` read as frozen; once `family` is
  answered every step wears his answer. The reason sits in `spec.ts`'s header.
- **What does the host's door show at a password gate?** Built: the host (her face and "Hosted by Maya", never the
  date), where today's redacted page hides her. The door is hers, so her face is its plate; the `welcome` knob draws
  it and the caption measures it. The doorway and the lit column keep today's redaction there.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte; `guest-flow.md` and `design-system.md` describe production)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits.** Work: `c47159cd` (the board, its ten files under `sandbox/locked-door/`, and its `touchpoints.ts`
  row), pushed to `origin/lp/locked-door`; this manifest is the next commit, alone. No sync: since the base
  (`54bdec34`) launch-prep moved by record commits only (`git diff --name-only HEAD...origin/launch-prep` =
  `docs/ROADMAP.md`, `docs/STATUS.md`, `docs/tracks/orchestrator.md`), none into a read.
- **Gates on `c47159cd`, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0 (0 errors, 4 warnings, none
  in a touched file: `review-session.tsx`, `contact-form.tsx`, `album-fill-grid.tsx`); `pnpm test` 0 (566 files, 6462
  tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (161 checks; the
  board reads 556 words of 1200); `pnpm lab:demo --board locked-door --base http://localhost:3132` 0 (4 steps, 0
  failing; one expected same-picture pair, `shape` split and bespoke on the welcome frame, which differ in the wait).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/locked-door/*`
  (owned) + this file + `src/app/(dev)/design/touchpoints.ts` (the board's own row, bumped in place: the brief's named
  exception; nothing else in that file moved).
- **The items:**
  - `family` (4 options, 4 frames each at 375 with 1440 on the knob: a welcome at a Public album or a password gate,
    the wait, the shut door, that door for someone who was in): today, the host's door (Maya's portrait in a halo of
    the lamp's light, a glyph on its foot naming the state), the lit column (one centred emblem per state in a pool of
    light, the sheet's lamp standing down), the doorway (fresh: a door on the page whose leaf is the state, the album
    seen through it, the party's light under it when shut, an empty frame for the 404). Recommended: the doorway.
  - `shape` (after `family`): one design, two as today, each its own, drawn in the held direction. Recommended: one.
  - `wait` (after `shape`): still (as `settings-wiring` builds it), a wait to watch (the door breathes, its clock
    ticks, "Maya has been told you're here"), a wait to spend (her picks held on her phone), each beside the moment
    the door opens itself. Recommended: to spend.
  - `lost` (after `family`): the 404 keeps the not-found family, or wears the shut door's design, beside the shut
    door. Recommended: follows.
  - Settled lines drawn in every option: `previous=private` (the `was` knob: Dom reads Priya's words, word for
    word), `newcomer=same` (the `at` knob moves only the header and the foot), `unlisted=ask` on the shut door's foot,
    `back-in` for a phone with nothing confirmed. Every caption is read off its frame: words, the headline's lines,
    what of the album it shows, whose light it wears, the sheet's height, the foot.
- **Assets requested from Will:** `a host portrait · 512×512 square JPEG, a real-looking host at her own party in
  soft light · replaces the seeded initial on the host's plate (host.tsx's Plate, seed ld-maya)`. Optional: the board
  reads without it, but the host's door is judged on a face.
- **Board ideas:**
  - If the doorway wins, its reveal: walking through the opened door into the album (the reveal curtain as the door),
    drawn as motion options.
  - The host's own words on a Public album's welcome (the event's description, in her voice), bible 7 pushed.
  - Crumbs: the four standing lint warnings above (two unused imports, one unused variable, one skipped compile).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the unlisted ask on the shut door's foot; each direction's disclosure (the host's door
  shows Maya's face, the doorway her name, the lit column nothing); each direction judged in its own shape; `family`
  drawn in the recommendation until answered; the host's door showing the host at a password gate.
- **Look at first:** `/design/lab/locked-door?session=locked-door.family` at 375: press 4 (the doorway), then flip
  "The welcome at" to "A password gate" and "At the shut door" to "Lena, not on the list".
