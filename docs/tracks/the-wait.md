---
track: the-wait
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "d57d4486"            # the launch-prep SHA the branch was cut from
board: the-wait
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/the-wait/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/disposable-mode.md
  - docs/reviews/disposable-mode.json
  - src/app/(dev)/design/sandbox/disposable-mode/
  - docs/systems/guest-flow.md
  - src/components/guest/event-experience.tsx
  - src/components/app/event-settings/camera-settings.tsx
  - src/lib/disposable/
---

# lp/the-wait

**Goal.** A new board for the one waiting experience of a delayed album (held for the host's approval, or sealed until a develop time): the mental model hosts and guests hold first, then the guest's wait with her own shots and everyone's stacking, the arrival, the host's cover, and the words.

## The brief

**Why.** From Will's live walk on 2026-10-02, at a hold-for-approval album: his upload "landed" in the album, then vanished back to the empty state ("a new guest would likely think that's a bug, not very intuitive for uploading into a moderated review album"). His notes, verbatim:
- "Maybe the waiting for approval state (technically empty state, but items have been uploaded, just not approved) could explore a concept similar to the 'develop' room on disposable events, where it feels more like experiential progress versus empty state until something finally gets approved. has to be some cool way to represent that pending approval, but uploads are stacking idea. otherwise it feels like there's zero momentum across the event, unless the host is actively uploading during. the more i think about it, disposables mode is effectively just an optional step in between the event album operating normally for live uploads, and turning on moderation is basically just disposables mode but more visible to the host at upload time, less everything appears at once. maybe a better synthesis overall here, across systems and design for an easy mental model for hosts and guests?"
- And after it: "I don't want to suggest the correct solution to the right mental model across Moderation and disposables, but they both have that same feel of 'here's only your photos, you'll see the everyone else's on the develop date or when host approves'."

**What is built** (`disposable-foundation`, merged; `docs/systems/disposable-mode.md` is the model): two answers, how guests add (free uploads, or the album's camera with a roll) and when everyone sees what's added (right away, once the host approves each, or at a develop time); "disposable" a preset (the camera plus a develop time). A guest of a delayed album sees her own held and sealed items in her tracker (presigned for her alone, removable) and everyone else's only as `waiting: {count, minutes, developsAt}` on the sync, held and sealed counted together; never an id. Settings asks the two answers as one control (`camera-settings.tsx`'s `CaptureAndReveal`), a working version. Will's disposable-mode picks stand: the contact sheet (`waiting=sheet`: "You take shots, see that reel timeline populate, revisit the event page while developing to see your shots in similar small tiles, and you intuitively think 'oh, I'll be able to see everyone else's shots later in here'"), the live slideshow on the room's screen (`wall=slideshow`), the host's cover she can lift (`peek=covered`, "could probably polish this design more"), no look (`look=none`); its drawings are `src/app/(dev)/design/sandbox/disposable-mode/` (`waiting.tsx` among them: port what serves).

**The board** (`the-wait`, new, desk 35, surface `shared`), every option drawn on production's album (the cover and the shutter as built) at 375 and 1440, for a held album and a developing one. Its FIRST ask is the mental model itself, his to find: several syntheses drawn end to end (the host's Settings, the guest's wait, the moment everyone's arrive), such as two questions (how guests add; when everyone sees), named album styles, or one question of time; the schema serves any of them. Then, drawn in the model he picks: the guest's wait (her own shots lit and removable, everyone's "uploads stacking", momentum all night, never a landing that vanishes to the empty state; the contact sheet is an anchor option); the arrival (approval's trickle and the develop's reel premiere); the host's cover she lifts; and the words (the preset's name, "Disposable" or better; whether approve-plus-develop is ever offered). The room's screen is a Question: today the live slideshow plays only for the host's own signed-in session; a screen link anyone could open is his to decide, asked plainly with its privacy cost.

**Who asks what this round:** identity owns the atoms; the camera itself is `disposable-camera`'s wiring (running beside you: draw the camera only as it appears from the album); the hub's head is `event-header` r2's; how photographs leave is `take-home`'s.

**The direction** (Will's notes, 2026-10-02): bespoke and experiential, sleek and modern, sophisticated (never tilted or playful-messy), minimal yet high-information with far less text, media as the colour. Who it is for, his words: "remaining a modern consumer app usable for anyone at any event ... would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests." And: "Everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility." His role: "I'm just the tastemaker ... drive your best ideas ... as the world's leading design engineer." Draw your boldest real answers; he picks and steers.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/the-wait/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `the-wait`, its title, `surface`, `desk: 35` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
