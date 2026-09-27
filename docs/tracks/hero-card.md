---
track: hero-card
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d202ed1"            # the launch-prep SHA the branch was cut from
board: hero-card
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/hero-card/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-story.json
  - src/components/marketing/
  - src/lib/constants/marketing-media.ts
  - docs/systems/marketing-content.md
  - docs/systems/design-system.md
---

# lp/hero-card

**Goal.** Open the `hero-card` board: the home hero's object reimagined as a compact event card, several photographs in an album with the code baked in, so a visitor reads at once "I make a shareable event and everyone uploads to it".

## The brief

**Will's ask** (his `reel-story` r3 note on `hero`, 2026-09-27): "let's design the item [to] be a compact version of an event card, not text-heavy (if at all) but kind of showcasing multiple images in an album rather than 1 and a QR code, plus whatever other design touches you can think of. This hero sets the stage for the platform, and this item inherently is the core to that as the source of the photo stream. Want visitors to get an immediate impression of 'oh, I make a shareable event and everyone uploads to it, cool!'. The QR code alone feels limiting, like our product revolves around QRs-only rather than a 'one link' concept, for which QRs are a huge contributor and key feature, but not defining. Reduces the idea of how easily this is to send a link in a group chat/email blast or simply write your custom link for people to copy/type."
And in chat: "I didn't mean to imply anything about the code itself being bad, only that as the center visual item in our home hero, a simple QR code doesn't fully convey our platform as much as the QR being baked into more an album-concept for the media to stream from. The QR does not need to be scannable in this visual, just tie the idea of the QR to the compact album visual." (The scannable code lives in the demo modal `demo-doors` is building, opened from a new "Try our demo event" eyebrow over the H1.)

**The object today:** `DemoFrame` at `size="hero"`/`"heroCompact"` (`src/components/marketing/system/demo-ticket.tsx`), mounted by `DemoQr` in `sections/home/cinema-hero.tsx:418-437`, one photograph in a mat with the code in its corner, the album streaming out of it on `hero-stream.ts`'s tables and loop. Its history: the retired `home-hero` board's seven rounds (git `85aa65d9`, retired at `00624e3b`) and `reel-story` r3's hero ask (git: `sandbox/reel-story/hero.tsx` at `8d202ed1`), whose measurements stand: today's object ends 7px over the headline at 375 with 100px of air above it (25 and 131 at 1440).

**The questions:** the object itself first (one decision: which compact event card), each option drawn in the real first screen (the site header, the band streaming out of the object on the band's own tables, the eyebrow over the H1, the headline and CTAs) at 1440 and 375, graded against today's object as the reference; the one-link idea visible (a link, a custom address, a QR as one of its faces, never the whole); several photographs, the stream's source; little or no text. A second question only if the object's own drawing raises one (e.g. whether it stands in a pool of its own light: ROADMAP's line from `story-r3`). Media made for its slot (the media registry's stand-ins; name any asset a pick would need: `docs/ASSETS.md` row 28 is parked on this board).

Register the board directly after `identity-claims` in `registry.ts`, `boards.ts` and `touchpoints.ts` (its lines are your named exceptions; the Orchestrator places it in `DESK_ORDER`). Author with `defineExploration`; the newest board is the worked example.

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
