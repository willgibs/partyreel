---
track: disposable-mode
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "18491027"            # the launch-prep SHA the branch was cut from
board: disposable-mode
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/disposable-mode/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/disposable-mode.json
  - docs/systems/guest-flow.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/billing-caps.md
  - docs/systems/reel.md
  - src/components/guest/
  - src/lib/constants/tiers.ts
  - docs/PRD.md
---

# lp/disposable-mode

**Goal.** Draw `disposable-mode` r2: the camera that could define Partyreel, the waiting room while the roll develops, what the room's screen shows until the reel premieres the roll, whether the host peeks, the Create step, video on paid plans, and whether a download wears the look.

## The brief

**His r1 answers** (`docs/reviews/disposable-mode.json`, 2026-09-29):
- `camera=viewfinder`: "I'd like to explore this a bit more, I like both options 2 and 3. Let's preserve those and continue finding more disposable camera designs that can define Partyreel. Really marketable feature, needs to be cool."
- `look=stocks`: "it'd be ideal if this was a reversible filter so the original media is preserved, but we're not creating two storage copies of every image with a separate stylized version ... so it can be swapped/turned off anytime."
- `reveal=morning`: "This should be a host config so they can either choose immediate uploads/visibility or set a 'develop' time guests can see to get them excited and in the loop. It creates that 'return' payoff moment where everyone sees the final album ... how do disposables best work with the live reel, or reels/clips in general? Seems like if implemented wrong, disposables kills the 'reel' side of Partyreel ... Maybe host has slideshow access either way to play live at event to encourage usage, but guests just don't have reel or gallery until they 'develop'."
- `waiting=count`, not a direct selection: "make this an atmospheric 'waiting room', where there's a live count (reasonable server usage) as new media is added. There could be an intriguing mystery stack of media in the center, make the 'waiting room' a fullscreen experience. A guest should also have access to their uploads from this screen, maybe even their uploaded media becomes the media stack in the waiting room with a way to manage (like delete an upload). Really excited to see your creative ideas here too, don't get locked to mine."
- `pick=step`: "one of the biggest choices to make for an event, so it deserves its own focused step for hosts to make that decision with plenty of context for each experience-type provided ... Ideally, it's very streamlined for hosts to switch between."
- `price=full`: "I'd rather have the original resolution images from my event and pay a little extra for more storage ... videos should also work in pro disposable events."

**Settled, drawn as given and never asked again** (his answers and the Orchestrator's replies he approved, 2026-09-29):
- The reveal is a host setting: straight away, or a develop time guests can see (9 am the next day by default), with Develop now. The reel becomes the reveal: it premieres the whole roll at develop time, and from then guests have the album, the reel and clips like any event. A reel is a recipe, so the premiere costs nothing.
- 24 shots each by default, the host's to change; the server counts them. Camera-only is a rule of the page: a photo's capture time can flag a library shot, and the board says so honestly.
- The looks are Warm, Cool and B&W, the host's pick, never baked: applied when a photo is shown and in the reel (rendered on the device), the original untouched and the look switchable any time.
- Full size, storage decides: Free takes about 30 shots at an iPhone's defaults; a real party needs the Event Pass.
- With review on, a shot develops once it is approved.
- Switching later goes both ways, any time, since the link and the QR belong to the event: album to disposable keeps what is in and new shots join the roll; disposable to album develops the roll at once. `settings-wiring` builds the consequence line that says so before it happens.

**The questions** (the widest good set each, on the real surfaces at 1440 and 375, graded against r1's picks):
1. The camera: r1's viewfinder and drawn disposable kept and pushed, plus new designs that could define Partyreel. The camera permission prompt drawn with each: the first press, a refusal, an iPhone asking again.
2. The waiting room: his idea whole, and the lane's own. The live count rides the album's existing poll (no new traffic); the stack is her own uploads, each deletable.
3. The room's screen until the reveal: the darkroom building to the premiere, or his live slideshow to keep people shooting.
4. Whether the host peeks before the reveal (review needs it; the surprise wants it hidden).
5. The Create step, with context for each experience.
6. Video on Event Pass and Pro: how the camera takes a clip, and how clips count against shots.
7. Whether a downloaded photo wears the look.

**Measure, and say it on the board:** the viewfinder's real capture size on an iPhone and an Android (a frame from the live camera against the camera app's photo). The "full size" promise depends on it.

**Ask nothing `locked-door` r2 asks:** its waiting door is before joining; this waiting room is inside the album. The board's `touchpoints.ts` rows are yours (nothing else in that file); the round bumps in place, r1's ledger stays, and r2's asks replace r1's in `asks`. The wiring follows these picks and `settings-wiring`'s merge, since it rewrites the guest path.

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
