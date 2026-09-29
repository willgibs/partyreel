---
track: demo-framing
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "7550bd0d"            # the launch-prep SHA the branch was cut from
board: demo-framing
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/demo-framing/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/marketing/sections/home/hero-stream.ts
  - src/components/marketing/sections/home/cinema-hero-card.tsx
  - src/lib/demo.ts
  - docs/systems/marketing-content.md
---

# lp/demo-framing

**Goal.** Draw `demo-framing` round 1: the story the demo tells, on the home hero's link card and the demo album it opens, so Will lands the framing before the demo event is made or renamed to match.

## The brief

**His note** (2026-09-29): "I don't love our working title of 'Mia & Theo', it feels kind of weird for a demo name. Before we create a dedicated demo event for the home hero (or even just modify our current demo), let's land on the best framing of it."

**Where it stands:**
- The home hero's object is the link card (hero-card r2's `guests` pick, `sections/home/cinema-hero-card.tsx`): the address `partyreel.com/e/<slug>` with the domain faint and the slug in ink, its code, four prints each credited to a guest's face, and a count of the rest (34 guests). Its content is one constant, `OBJECT_EVENT` and `OBJECT_PRINTS` in `hero-stream.ts`: the slug `mia-and-theo` and a wedding's four photographs, one a toast marked as a video.
- Pressing it opens the demo (the modal at a desk, a new tab on a phone). The demo is one event, "Partyreel Demo" at `/e/partyreel-demo`, opened by its token (`src/lib/demo.ts`), with 9 photographs and 3 named guests. It matches neither the card's wedding nor its 34.
- The card's printed address must open the event the card opens: a homepage address that 404s, or a slug any host could claim, is not acceptable. The demo event takes the chosen slug, which the unique index then holds for good.
- Every image is generated in one Higgsfield month before launch, so the framing names what ASSETS rows 33 (the card's four photographs) and 34 (its four guest faces) and the demo album will show.

**Round one's asks**, each with a recommended answer, drawn on the card:
1. `story`: what party the demo is. The widest good set:
   - a wedding (the event that buys an Event Pass);
   - a milestone birthday;
   - a weekend away with friends;
   - a family reunion;
   - a work party;
   - any better idea you find.

   Draw each on the card with its slug and its four prints, and as the head of the demo album it opens.
2. `names`, after `story`: who the demo names.
   - couples' first names (today's, the kind he flagged);
   - the host's own voice ("Our wedding");
   - an occasion with no names ("Saturday at the lake");
   - a family name ("The Parkers' 40th");
   - a playful or brand-forward line, if one earns its place.
3. `demo`: which event the card opens.
   - one demo everywhere: today's, renamed to the story and its album re-seeded to match;
   - a dedicated hero event with its own album, while the general demo stays;
   - the card as an illustration whose press opens the general demo, so the printed address must then be the demo's own.
4. Anything else the framing must settle (the chip's count, the guests' names or initials, whether the card carries a date) as carried calls.

**Draw it where it lives:**
- The card at 1440 and 375 on the hero's own stage. Draw a mock of `LinkCard` over its real pieces, labelled as a mock, since the production card reads one constant.
- Beside each story, the demo album's head: its title and its first row.
- Use stand-in photographs from the fixtures or the band's stills, each named as a stand-in.

**A new board:** register after `disposable-mode` in `registry.ts`, `boards.ts`, and `touchpoints.ts`' `RULINGS` and `DESK_ORDER` (a new board's named exceptions). `disposable-mode` is a board that stays this batch, whereas `export-flow`, `help-center` and `emails` retire with their wiring.

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
