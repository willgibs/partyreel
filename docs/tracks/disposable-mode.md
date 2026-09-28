---
track: disposable-mode
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "69afdbc5"            # the launch-prep SHA the branch was cut from
board: disposable-mode
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/disposable-mode/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/billing-caps.md
  - docs/PRD.md
---

# lp/disposable-mode

**Goal.** Draw a new board, `disposable-mode` r1: a disposable-camera way of running an event inside Partyreel (guests shoot in-app only, a shot limit, photos that develop later), so Partyreel covers POV's whole audience without being built around it.

## The brief

**His words** (export-flow's `means`, `git show 69afdbc5:docs/reviews/export-flow.json`):
- "some of our main competitors are built around a 'disposables' idea (check out https://pov.camera/), and if we simply restricted both a guest's ability to add with only taking live photos in-app (no library uploads) plus an upload count limit, that's effectively a disposables mode we could market as well, but simply within our product rather than being built around it. Swallow all of https://pov.camera/ future potential users."
- "Remember, we're building a platform that is meant to feel limitless but effortless, so hosts shouldn't have to feel they're having to study docs or fight UI to set up an event how they'd like."

**What POV does** (research it yourself too): a host sets shots per guest, a reveal time, a guest count and a style. Guests join by QR with no app (an App Clip or the web) and shoot with an in-app camera (filters, a timestamp). Photos stay hidden until the reveal. It is free under about 10 guests, and sells photobooks.

**The Orchestrator's first ideas, to weigh against the best you find:**
- **One choice at creation**, "How do guests add photos? Anything / Disposable camera". Disposable sets defaults (24 shots each, developing at 9 am the next day), each changeable later.
- **The guest's camera:** the album's own web camera, no app, like the door. A big shutter, "18 shots left", no retakes, no library, an optional film look (grain, a date stamp).
- **The reveal:** shots develop at the host's time, or on the host's Develop. Until then guests see "142 shots developing", and the reveal opens with the live reel.
- **Where Partyreel wins:** the live reel and wall, the album link after, curation.

**Be honest about the limits in the drawings:** camera-only is a rule of the page (the file picker offers only the camera); the server can enforce the shot count per guest; a photo's capture time can flag an old library shot, but nothing proves a shot was taken live.

**Weigh the pricing:** Will's new Free is 100 MB (about 30 photos at iPhone defaults; `pricing-wiring` is building it), and a 24-shot, 10-guest disposable event is about 700 MB. So where the mode sits between Free, Event Pass and Pro is a real question (POV's lever is guest count).

**Shape, a few decisions, each drawn whole on the real surfaces:**
- how a host picks it (the create wizard, `src/components/app/create-event-wizard.tsx`, and settings);
- the guest's camera, at 375;
- the reveal;
- the shot count and its price lever.

Stage later questions behind earlier ones where one depends on another.

**Registration:** register directly after `contact-page` in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). Author with `defineExploration`; ask nothing another standing board asks.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

The board's six decisions are Will's to answer on the desk. The calls the lane took on its own recommendation are
carried on the board itself (`carried` in `spec.ts`, drawn above its sections), each his to overrule:

- `shots`: how many shots each? 24, a roll's worth, set when the camera is turned on; 10, 36 or any number in Settings.
- `count`: whose count is it across phones? A confirmed email's (verified emails is the default); a typed name's is
  her phone's, so clearing it starts a new roll. Overrule: the camera turns Require verified emails on and keeps it on.
- `spent`: does a deleted shot give its frame back? No, a shot counts the moment it is taken (the anti-churn rule).
- `host-first`: does the host see the roll before it develops? Yes, as it lands, to take out what should not be in
  the reveal (Partyreel's curation, POV's own host review).
- `after`: once developed, the camera stays open, camera-only and counted; a late shot joins the album at once.
- `door`: at a disposable event the door's upload step opens the camera (no library row) and the welcome says the roll.
- `proof`: the page offers only its camera and the server counts every shot; nothing proves a shot was live.
  Overrule: flag a shot whose capture time is older than the party.

## System-doc edits (in place, owned facts only)

- none (an exploration ships no production byte; the camera's facts land in guest-flow.md and billing-caps.md with
  its wiring)

## Deferred (ROADMAP one-liners, bucket named)

- Marketing: a disposable-camera page, and the site's link that opens Create with the camera already on
  (`pick=line`'s door), once the camera ships (from `disposable-mode`).
- Reel: what the room's screen shows while a roll develops (the count ticking, then the roll's premiere at the
  reveal), asked once `reveal` is answered (from `disposable-mode`).

## Handoff (replaces the chat report)

- **The work commit** `90805f8e` (the board, its three registrations), pushed to `origin/lp/disposable-mode` from
  base `35601390`. launch-prep has since moved (`661f41dc` locked-door, `ba7d20aa` pricing-wiring's cut): neither
  touches a `reads` doc, and `git merge-tree --write-tree HEAD origin/launch-prep` merges clean (exit 0), so no sync
  commit (PROGRAM.md's Sync rule). The head is in the chat line.
- **Gates on `90805f8e`**, each on its own exit code, logs in `/Users/gibby/local/ai/partyreel-wt/_scratch/disposable-mode/`:
  `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0, 0 errors, 5 warnings none in a touched file
  (`gate-lint.log`); `pnpm test` 0, 520 files, 5,863 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0
  (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3133` 213 checks, 0 failing, the board at 792 of 1,200
  words (`gate-smoke.log`); `pnpm lab:demo --board disposable-mode --base http://localhost:3133` 6 steps, 0 failing,
  every step's options moving the stage (15 to 99 percent, `gate-demo.log`).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `src/app/(dev)/design/sandbox/disposable-mode/`
  (ten files) plus the three registrations the brief names, `sandbox/registry.ts`, `(shell)/lab/boards.ts` and
  `touchpoints.ts` (the `SandboxId` union, the row and `DESK_ORDER`, each directly after `contact-page`; `DESK_ORDER`
  is included because `registry.test.ts` fails a board missing from it), and this file.
- **The items** (`spec.ts`; every frame titled with its option, every caption read off the frame):
  - `camera`: the phone's own camera (drawn with its own Retake), the album's own live camera (recommended), a
    disposable drawn; three phones, then two.
  - `look`, staged after `camera`: the photograph as taken, one film look on by default (recommended: warm, grain
    and a seven-segment date, drawn as SVG), three looks the host picks.
  - `reveal`: at 9 am the next day (recommended), on the host's Develop, an hour after each shot, straight away.
  - `waiting`, staged after `reveal`: the darkroom's count, a frame for every shot (recommended), her own for her.
  - `pick`: one line under Create's name (recommended), two cards, a step of its own, Settings only with a one-time
    offer on the new event; Create at 375 and 1440 (the Screen knob), Settings as the settings kind at both.
  - `price`: storage at full size, storage at a lab scan's size (recommended), a guest count, a paid camera; the
    Shots each knob moves every figure. The lab size is measured, not guessed: the six test photographs re-encoded
    at a 1600 px long edge average 254 KB plain and 368 KB with grain (`measure-shot.log`), so 0.4 MB rounds up and
    Free's 100 MB develops about 250 shots, ten rolls of 24, POV's own free line. The drawing also found that a
    guest-count lever cannot hold ten rolls of 36 inside 100 MB (144 MB, read off the tile with the knob at 36).
- **Assets requested from Will**: six stills shot the way a disposable shoots a party (direct flash at night,
  candid, a little crooked) · 1600 px long edge, JPEG, 3:2 and 2:3 · replaces `ROLL_STILLS` and `SCENE` in
  `fixtures.ts` (today the twelve marketing stand-ins, which read as professional work).
- **Board ideas**: a printed roll (the developed roll as prints or a book, POV's photobook) once there is revenue to
  justify a print partner; the door's welcome at a disposable event (the carried call `door`) drawn on
  `locked-door`'s door family once it is built.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none for this lane. The wiring would add the
  camera's columns to `events` (how guests add, shots each, when it develops, the look), a per-person shot count
  inside `create_media` (held by `safety-wiring` this batch), and a developing state the album's reads withhold;
  when `pricing-wiring` lands, `fixtures.ts`' `FREE_BYTES` and `FULL_SHOT_BYTES` read `tiers.ts` (`AVG_PHOTO_BYTES`).
- **Calls his to overrule**: the six decisions' recommendations above, and the seven carried calls under Questions.
- **Look at first**: `camera` (the phone's Retake beside the album's own shutter), then `price` (the lab-size
  finding, with the knob at 36).
