---
track: desk-tune-4
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8fef7143"            # the launch-prep SHA the branch was cut from
board: the-wait
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/the-wait/
  - src/components/ui/glyph-count
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-action-dock.tsx
  - src/components/app/event-feed/reel-card.tsx
  - src/components/app/event-settings/camera-settings.tsx
  - src/app/(dev)/design/sandbox/identity/
---

# lp/desk-tune-4

**Goal.** Make the-wait's drawings true to production again before Will's sitting on build 45 (crumbs-52 moved two things they show, and three older slips), and let identity's voice and status sheets reach production's glyph-count number.

## The brief

**Why.** The pre-sitting desk pass (2026-10-03) re-read every board whose production moved since its cut. Four hold; the-wait moved, both from `crumbs-52` (merged `1cc96371`). A board must never show Will a product that no longer exists. Every question on it still stands: only drawings and a few words change, and no option's idea moves.

**The-wait's edits** (line numbers as read at `ece3f8a1`; confirm each):
1. **The camera album's Add.** The board draws `<ImageUp /> Add photos` on every cover (`album.tsx:164`) and a dock with no `camera` (`album.tsx:236`), while its developing album is the album's camera. Production now says "Take photos" with the Camera glyph on a camera album's cover Add (`event-experience.tsx:680-687`, `:1359`), and the shutter does too (`guest-action-dock.tsx:121`, `:177`, its `camera` prop, passed at `event-experience.tsx:1611`; an empty camera album says "Take the first photo"). Give the board's `GuestPage` a `camera` prop that draws the camera's words and glyph and passes `camera` to the dock, and set it wherever a camera album is drawn: `guest.tsx`'s WaitPage for developing, the 9 am frames in `arrival.tsx`, and `NameFrame` and `TwiceWait` in `words.tsx`. In `spec.ts:63`, "(the cover, Add photos, her uploads' round, the shutter)" becomes words true of both albums, as "(the cover and its Add, Take photos on the camera's album, her uploads' round, the shutter)".
2. **The hub's Reel card.** `host.tsx:140` draws a developing album's card as "Premieres at 9 am"; production says "Live at the develop" until the develop time (`reel-card.tsx:292`). Draw production's words; the held half's "Off until 2 photos" was never production's either (`reel-card.tsx:424`, "Starts at 2 photos").
3. **Three older slips, cheap now:** `host.tsx:148` draws the Settings card as "Reviewed"/"Disposable" where production shows the door ("Public", `page.tsx:330`); the name ask's `disposable` option (`spec.ts:402`) says "As built:" where Settings calls it "The album's camera" (`camera-settings.tsx:159`), so drop "As built:"; the cover beat in `words.tsx:287` leaves out her uploads' round, which the board's own carried call `round` says production shows.

**Identity's sheets and the glyph count.** `sandbox/identity/sheet/voice.ts:112-114` and `sheet/status.ts:152-153` style `[data-slot="glyph-count"] [data-n]`, but production's number span (`src/components/ui/glyph-count.tsx:103`) carries no `data-n`, so on the board and at the wiring those rules reach nothing. Add `data-n` to production's number span (an attribute only, no visual change; a test pins it), so identity's drawings show its voice on the real atom. Never edit identity's folder (its sheets already ask for the hook).

Nothing else on either board moves: no option, recommendation, ask or desk place.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/the-wait/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `the-wait`, its title, `surface`, `desk: 35` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3132`; `pnpm lab:demo --board the-wait --base http://localhost:3132` and `--width 375`, and `pnpm lab:demo --board identity --base http://localhost:3132` (the glyph count reaches its drawings); a Vitest pin for `data-n`; before and after captures of each changed frame in your Handoff.

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
