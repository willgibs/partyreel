---
track: refresh-guest
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "5b17e8f3"            # the launch-prep SHA the branch was cut from
board: voice-guest
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/voice-guest/
  - src/app/(dev)/design/sandbox/guest-capture/
  - src/app/(dev)/design/sandbox/media-viewer/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-guest

**Goal.** The guest's voice, capture and the media viewer. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `voice-guest` (7x4; range: same 3 tones reused 7x): "THE REGISTERS ARE THE SAME FOUR KEYS ON EVERY DECISION". Worth trying: Try a voice outside warm/bright/exact for at least one line.
- `guest-capture` (5: 3,3,3,2,3; range: thin on "name"): guest-shape/gallery-width material "worn here as law"; name ask binary. Worth trying: Give "name" a genuine third path beyond silent or confirm.
- `media-viewer` (1: 4; range: 4 real variants): scope cut to "the OTHER own-item mark"; shipped capsule untouchable. Worth trying: Fine now; watch this board running out of open questions.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `voice-guest`, `guest-capture`, `media-viewer`.

## Questions (a recommended answer each; the Orchestrator relays them)

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- One round. Work commit `759b77fa` on `lp/refresh-guest`, pushed. No sync commit: `origin/launch-prep` moved five
  commits (`75631277` → `b2ffc4eb`, all Orchestrator record/cut commits for other lanes) while this ran, but
  `git diff --stat 75631277 origin/launch-prep -- src/app/\(dev\)/design/sandbox/voice-guest/
  src/app/\(dev\)/design/sandbox/guest-capture/ src/app/\(dev\)/design/sandbox/media-viewer/
  src/app/\(dev\)/design/sandbox/gallery-fixtures.ts src/app/\(dev\)/design/touchpoints.ts
  src/app/\(dev\)/design/sandbox/registry.ts "src/app/(dev)/design/(shell)/lab/boards.ts"` is empty, so this hands
  off on its base per the Orchestrator's sync rule.
- Gates, all on `759b77fa`: `pnpm typecheck` clean; `pnpm lint` 0 errors (7 pre-existing warnings, none in this
  lane's files); `pnpm test` 427 files / 4584 tests passing; `pnpm build` exit 0 (full route manifest generated,
  no compile or type error); `pnpm lab:smoke --base http://localhost:3135` 313 checks, 0 failing (this lane's
  reading, outside every closed fold: `guest-capture` 335/1200, `voice-guest` 616/1200, `media-viewer` 127/1200
  words); `pnpm lab:demo --base http://localhost:3135` for all three: `voice-guest` 7 steps / 0 failing / 5
  options on every ask (was 4); `guest-capture` 5 steps / 0 failing / `name` now 3 options (was 2); `media-viewer`
  1 step / 0 failing / unchanged at 4 options.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = exactly the 11 files under `owns` (all three
  board directories) plus `touchpoints.ts` (the one listed exception; both rows it touches, `guest-capture` and
  `voice-guest`, are this lane's own).
- The items, one line each:
  - `voice-guest`: a fifth register, `tender` (soft and tender), added to all seven asks (`welcome`, `ask`,
    `landed`, `failed`, `empty`, `waiting`, `keep`) in `lines.ts`, `spec.ts` and `board.tsx`, so the board is not
    the same three tones reused seven times (the audit's own line). Every existing `recommended` left as is;
    this only widens the range.
  - `guest-capture`: `name` gains a third option, `told` (writes the name silently exactly as `silent` does, then
    a toast says it: "You're on as Priya. Change it in Account."), now the ask's `recommended` over the
    silent-or-confirm binary. The toast is a new component, `NameToldNotice` (`parts.tsx`), positioned at the
    shipped Toaster's own offset (`ui/sonner.tsx`'s `top: 5rem`); `measureName` reports the toast's own words
    AND, honestly, how many pixels of the moment card's own top it covers while it is up (45px at 375, measured
    off the frame, not designed away).
  - `media-viewer`: no new option on `mine`, on the audit's own read (already four real directions, "fine now,
    watch this board running out of open questions"); comments only.
  - All three boards: comments reworded to keep the same facts without "ruled"/"law" framing (`spec.ts`,
    `lines.ts`, `scene.tsx` on `voice-guest`; `spec.ts`, `scene.tsx` on `guest-capture`; `page-parts.tsx`,
    `viewer.tsx` on `media-viewer`). `media-viewer/board-r1.tsx` (round one's retired, unimported preview code,
    kept as `site-chrome`'s own precedent for a round two) left untouched: it renders nowhere today, so it reads
    as history rather than a live comment.
  - `touchpoints.ts`: `guest-capture`'s row corrected from four decisions to five (`tracker` already existed in
    `spec.ts` before this lane and was simply never added to the row; caught while updating the row for `told`)
    and its `asks`/`note`/`variants` now name all five; `voice-guest`'s row names the fourth register.
- Assets requested from Will: none (every new option reuses the existing fixtures; the toast is built from
  `lucide-react`'s `Check`, already imported).
- Board ideas: none beyond this lane's own three boards.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - `voice-guest`: a fifth register on every one of the seven asks, not only the one line the audit's "worth
    trying" asked for, on the read that a register only proves itself once it is tested across more than one
    line. If that reads as diluting rather than widening, the four originals still stand on their own and
    `tender` is one option to drop per ask, not a structural change to undo.
  - `guest-capture.name`: `told` is now the recommendation over `silent`. If a toast covering the moment card's
    own heading for a moment reads as clutter rather than care, `silent` costs her nothing to notice at all (the
    ask's own `overrule`).
  - `media-viewer.mine`: left at four options on the audit's "fine now". If a genuinely different fifth
    direction is still wanted (not another shape variant: an interaction-revealed mark with nothing at rest,
    which this static-preview board cannot picture honestly today), that is a real option this round skipped
    rather than one that does not exist.
- One doc-accuracy note outside every `owns`: CLAUDE.md's orientation table still points to
  `docs/design/README.md` for "what guides design work"; `library-lean` retired that path and the fact now
  opens `docs/systems/design-system.md`. CLAUDE.md is the Orchestrator's alone to edit, so this is a note, not a
  fix made here.
- Look at first: `voice-guest.welcome`'s fifth pill (`tender`), the clearest single read of the new register,
  then `guest-capture.name`'s third pill (`told`), already the board's own recommendation.
