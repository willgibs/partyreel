---
track: the-wait
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The room's screen link (his to decide).** Should the room's screen get a link of its own that opens without
  signing in as Maya? Today the live slideshow plays only for her own signed-in session, which keeps it private but
  puts her whole account on a venue's laptop. **Recommended: yes, guarded**: the link plays the slideshow and nothing
  else (no album, no Save, no Download all), Maya turns it off in one press from her hub, and it ends at the develop.
  **Its privacy cost, plainly:** whoever holds the link (the DJ's laptop, a forwarded text) watches every photo as it
  lands, from anywhere, a developing album's sealed roll included before 9 am; a photo she hides or removes is the
  only recall. Drawn on the board as the carried call `screen`; nothing is built.
- **Does taking one of hers back ask first?** Recommended: no, one press, her uploads list's own path (it says
  Removing, and on a roll the shot comes back at once). Overrule: it asks first, since a camera shot she takes back is
  purged that night. The board's carried call `remove`.
- **Does her uploads' round stay beside Add once the wait shows hers?** Recommended: yes, as production has it on both
  albums since door-reveal (a sealed one reads "Waiting to develop"): the list stays her one place for all of hers.
  Overrule: it goes, one place for hers, not two. The board's carried call `round`.

## System-doc edits (in place, owned facts only)

- none: the board is lab-only; what it decides lands in `disposable-mode.md` and `guest-flow.md` with its wiring.

## Deferred (ROADMAP one-liners, bucket named)

- Now: on a developing album, Add reads "Add the first photo" again the moment her first sealed shot lands this
  visit: `inFlightUploads` keeps a held file (`mediaStatus === "pending"`) but not a sealed one
  (`event-experience.tsx`, `galleryEmpty`), and `waitingOnArrival` answers only on the next paint; the-wait's wiring
  retires the empty state under a wait entirely, or one clause there sooner.

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/the-wait`:** work `c994bf60` (the board, 14 files in its folder) and `3b638f88` (the
  model's question in plain words, frame titles that fit the stage); sync `1022067f` (origin/launch-prep `219cec81`:
  door-reveal had merged into this lane's reads, `guest-flow.md` and `event-experience.tsx`, and into the cover and
  her uploads' round the drawings mount); work `0014b95b` (her round on both albums with production's "Waiting to
  develop", the as-built model in production's two words, the board's account of today true after the sync). Since,
  launch-prep took only crumbs-51 (help, `host-app.md`, admin, marketing) and records: nothing this lane reads or
  mounts (`git diff --name-only 219cec81 origin/launch-prep`), so no second sync. The head is in the chat line.
- **Gates on `0014b95b`, the synced tree, each on its own exit code** (logs `../partyreel-wt/_scratch/the-wait/gate-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (789 files, 9,345 tests); `zsh scripts/build-lock.sh pnpm build` 0;
  `pnpm lab:smoke --base http://localhost:3132` 0 (22 checks; the-wait reads 853 words of 1,200); `pnpm lab:demo
  --board the-wait --base http://localhost:3132` 0 and the same `--state screen=1440` 0 (6 steps each, 0 failing,
  every option drawn and moving, every stage above half the first screen, every frame whole above the dock at 1440
  and 375). Every frame at both knobs, reduced motion, is saved in `../partyreel-wt/_scratch/the-wait/final/{p,w}/`;
  on the synced head the board page and every step log no console error or warning (a fresh headless Chrome each;
  every step at 375, and the model, the wait and the cover at 1440 too).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the 14 files under
  `src/app/(dev)/design/sandbox/the-wait/` + this manifest. No exceptions.
- **The board, `the-wait` round 1 [desk 35, surface shared], lab only:** every guest frame is production's album
  (the real `AlbumCover`, Add, her uploads' round with its real store, `GuestActionDock` when scrolled) with only the
  wait drawn in; the as-built Settings is the real `CaptureAndReveal`; Maya's hub is the real `HubCover` on the
  rooms' own shell; 375 first, 1440 on the Screen knob; a held album (38 waiting, none let in) and a developing one
  (142 sealed, 9 am) throughout; motion only where it shows state, none under reduced motion.
  - `model` (first, his to find): two questions as built · album styles · one question of time · approval apart, each
    end to end (Settings, held and developing at 10:40 pm, 11:20 pm as 24 arrive). **Recommended: one question of time.**
  - `wait` (after `model`): the contact sheet (his anchor) · uploads stacking · the night's reel · the cover carries
    it, each held as her photo lands, developing scrolled to the shutter, one of hers opened to take back.
    **Recommended: the contact sheet.**
  - `arrival` (after `wait`): into place · it develops in place · the premiere first, as Maya's 24 arrive and as the
    roll develops at 9 am. **Recommended: it develops in place.**
  - `cover` (after `model`): the card polished · what her guests see · frosted, hold to peek, each covered, lifted and
    on a held album. **Recommended: what her guests see.**
  - `name` (after `model`): Disposable · Film · Darkroom, each in Create, on the cover and the morning after.
    **Recommended: Disposable.**
  - `both` (after `model`): never, the cover is her check · a switch under the develop · approval a switch of its own.
    **Recommended: never.**
- **Assets requested from Will:** none (the stills are the marketing set every board reuses).
- **Board ideas:** the night on a dial as a host's view of her party's rhythm (his disposable-mode r3 note; event-header
  r2 now recommends it for the hub's facts, so its wiring can carry it into the album's area too); a frame of the
  wait on the room's screen once `screen` is answered (what the slideshow shows of a held album, which today is
  nothing until Maya approves).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. (A screen link, if he says yes, is a
  capability on the event: its own lane, a migration and its revoke.)
- **Calls his to overrule** (the board's carried calls, each under Questions above): `screen` a link of its own,
  guarded; `remove` one press, no confirm; `round` her uploads' round stays on both albums.
- **Look at first:** `/design/lab/the-wait?session=the-wait.model` (the model, which every later step wears), then the
  `wait` step's first two frames; and the Deferred line above, a real production bug a one-clause fix closes
  before the wait's wiring.
