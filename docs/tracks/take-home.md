---
track: take-home
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "96c6dcdc"            # the launch-prep SHA the branch was cut from
board: take-home
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/take-home/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/uploads-and-r2.md
  - docs/systems/guest-flow.md
  - src/components/shared/media-lightbox-parts/actions.tsx
  - src/components/guest/event-experience.tsx
  - src/lib/media/share-save.ts
---

# lp/take-home

**Goal.** A new board: how guests and hosts take photographs home, from Will's note: a guest's one-press Download all against Select, Select all, Save; a host's originals beside an optimized download for quick posts; and what a guest's Save gives.

## The brief

**Why.** Will's note from his live walk on 2026-10-02, verbatim: "I was also thinking that 'download all' being such an easy clickable button for guests may shoot us in the foot. for the guest event page, may be easier to drop the direct 'download all' in favor of hitting select then selecting all, then save (the slight friction could reduce our resource expenditure massively if less guests grab everything just because it's an easy 1-click, once they're selecting they may as well get exactly what they want). host benefits massively from everything at full quality, could also include an optimized download option (like to grab everything on a phone for quick social posts, not the version that gets saved to a backup hard drive to keep forever later)."

**Facts for the board** (state them in its context layer, plainly): Cloudflare R2 charges nothing for downloads (egress); what a guest's Download all costs is the export Worker's run time and R2's read operations, both small, so the question is mostly what serves guests and hosts best. A guest's Save on a phone opens the share sheet with the file (`src/lib/media/share-save.ts`); its speed is the `save-speed` lane's (running now: Save is to feel immediate). Downloads end and say how (`export-ends`).

**The board** (`take-home`, new; desk 70, independent of the others; surface `shared`): every option drawn on production's album (the cover and the shutter as built) and its viewer, at 375 and 1440, guest and host. Asks yours to shape, for instance:
- `guest`: how a guest takes photographs home (one-press Download all as today; Select, Select all, Save; Save one at a time from the viewer; or your better answer), with what each costs her in taps and what it costs the platform.
- `host`: how a host takes everything home (originals for the archive beside an optimized set for quick posts; how each is named and offered).

**Who asks what this round:** identity owns the atoms (draw in production's); the hub's head and its rooms are `event-header` r2's; a delayed album's wait is `the-wait`'s.

**The direction** (Will's notes, 2026-10-02): bespoke and experiential, sleek and modern, sophisticated (never tilted or playful-messy), minimal yet high-information with far less text, media as the colour. Who it is for, his words: "remaining a modern consumer app usable for anyone at any event ... would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests." And: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." His role: "I'm just the tastemaker ... drive your best ideas ... as the world's leading design engineer." Draw your boldest real answers; he picks and steers. Atoms are identity's board (draw in production's).

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/take-home/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `take-home`, its title, `surface`, `desk: 70` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

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
