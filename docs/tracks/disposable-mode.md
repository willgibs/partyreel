---
track: disposable-mode
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

The board's eight asks are his to answer on the desk; these are the calls the lane took and built on, each drawn
on the board's "Calls the lane carried" (`spec.ts`, `carried`), his to overrule:

- `size`, what size a shot from the album's camera is: the largest a phone gives a page, an iPhone's live-video
  frame (at most 4032 by 3024 by WebKit's own capture source, `AVVideoCaptureSource.mm`'s `generatePresets` taking
  the camera's video formats; Safari 27 ships no ImageCapture, caniuse) without night mode, and Android's full photo
  through ImageCapture. If not: the phone's own camera app on an iPhone (24 MP and night mode, its Retake with it).
  NOT MEASURED ON A PHONE: the board's dock carries Measure a phone for it (Look at first).
- `refused`, what a guest does after Don't Allow: turn it back on (aA, Website Settings, Camera, Allow) and Try
  again, or Use your phone's camera one photo at a time, counted the same, so nothing is a dead end (bible 3).
- `spent`, whether deleting a shot from her stack refunds the frame: no, a frame is spent when she shoots it, and
  Delete takes the shot out for everyone, the host included (the guest's own removal, final).
- `ten`, a video's length: 10 seconds, about three photos' room at 1080p by tiers.ts's own estimates.
- `sound`, whether a video carries sound: yes, so a paid event's first press asks for the camera and the microphone
  in one prompt (drawn in `video`).
- Two lane calls in the board's shape: video is two asks (how it is taken, what it costs; the second staged behind
  the first), since the brief's one question has two winners; and a video is never called a clip anywhere on the
  board (reel.md: the clip is the reel's).

## System-doc edits (in place, owned facts only)

- none: an exploration ships no production byte, and the capture-size facts wait for a phone's measure and the
  wiring's own doc.

## Deferred (ROADMAP one-liners, bucket named)

- Now: "Guest: the disposable camera's capture size measured on a real iPhone and an Android (the `disposable-mode`
  board's Measure a phone, a minute a phone on the alias) before any surface promises a size; the numbers go in
  uploads-and-r2.md with the camera's wiring (from `disposable-mode` r2)."

## Handoff (replaces the chat report)

- **Commits, pushed**: the work `0755cde2` (the board) and `f6da48df` (the hub row as production now draws it, and
  no weight beside `font-heading` anywhere on the board); the sync `f8c535bd` (merge of origin/launch-prep at
  `9232736f`, which carried crumbs-12's `3e27e6fc`: the hub row's order and every heading at 700, announced by the
  Orchestrator mid-lane). launch-prep then moved to `e2b4d59e` with locked-door r2 alone (its own sandbox folder, its
  touchpoints.ts row, records); `git merge-tree --write-tree HEAD origin/launch-prep` is clean and none of my
  `reads` moved, so no second sync. The head is this manifest's commit.
- **Gates on `f6da48df`** (the synced tree), each on its own exit code, logs in
  `../partyreel-wt/_scratch/disposable-mode/gate2-*.log`: `pnpm typecheck` 0; `pnpm lint` 0 (0 errors, 4 warnings,
  all in files this lane never touched: `review-session.tsx`, `contact-form.tsx`, `album-fill-grid.tsx`); `pnpm test`
  0 (567 files, 6470 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base
  http://localhost:3133` 0 (165 checks, 0 failing; disposable-mode 776 words of 1200); `pnpm lab:demo --board
  disposable-mode --base http://localhost:3133` 0 (8 steps, 0 failing, every step drawing its options). Typecheck,
  lint and test ran on the tree committed as `f6da48df`, just before the commit; build and the lab steps on the
  commit. The board at 375 (`scrollWidth` 375, no sideways scroll) and at 1440; reduced motion stops the room's
  safelight and the pile's landing (`animationName` read `none` under the emulation, `dm-land` without it).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): `src/app/(dev)/design/sandbox/disposable-mode/`
  (owned), `src/app/(dev)/design/touchpoints.ts` (this board's own row only: the manifest's grant) and this file.
  `guest.tsx` is deleted (round one's album page, drawn by nothing now).
- **The items**:
  - The camera (`camera`, recommended `reel`): four cameras, each at framing her seventh, the moment after, and the
    phone asking three ways (7:48 pm her first press, Don't Allow, 10:40 pm an iPhone asking again, with the page's
    own line under Safari's prompt): round one's viewfinder pushed (24 ticks round the shutter, one going dark a
    shot), round one's drawn disposable pushed (an optical window with its bright-line frame, the counter as a dial,
    the ready light, a wheel that locks the shutter until she winds), a camera that shoots on a reel (the live
    picture over a strip of 24 frames, exposed ones dark with their minutes, the edge print in the host's names), and
    the event's own paper disposable (the host's names printed huge on a wrapper, a die-cut window and counter, a
    barcode; its first press pulls the wrapper's tab). `cam-*.tsx`.
  - The waiting room (`waiting`, recommended `pile`): his darkroom whole (her face-down stack), her shots coming up
    in the tray (latent images), the party's pile landing live (face-down backs, hers with a folded corner, "+1 just
    now", no name), her roll out of its canister; each opens her shots face up with a Delete, and the delete
    confirms in the guest's own removal's words with the carried `spent`; 1440 on the knob. `waiting.tsx`.
  - The room's screen (`wall`, recommended `slideshow`): the darkroom building to 9 am, his live slideshow ("On
    this screen only. Phones get it all at 9 am."), a glimpse of each new shot; 16:9, at rest and as Priya's shot
    lands, the reel's own arrival chip and corner code quoted. `wall.tsx`.
  - The host's peek (`peek`, recommended `covered`): as it lands (marked Developing, one tile flagged "Taken before
    the party?", the settled capture-time line), covered with Look anyway and Develop now, she waits (her Review
    queue with review on, Develop now's confirm with it off); Review and 1440 on knobs; the hub row in
    production's order at 700. `host.tsx`.
  - Create's step (`create`, recommended `cards`): two big cards, one phone that shows the choice, the two row by
    row; the camera's three defaults once it is picked, drawn in the camera he picks; 1440 on the knob. `host.tsx`,
    `thumbs.tsx`.
  - Taking a video (`video`, recommended `hold`) and what it costs (`cost`, recommended `one`), both staged behind
    the camera and drawn in it: hold, a Photo and Video switch, a button of its own; one shot, three, a count of
    their own; the microphone's prompt drawn.
  - Saving the look (`save`, recommended `save`): the original always, Save wears it with Download all original,
    hers to choose, always; Save in the viewer, her Photos, Download all; 1440 on the knob. `viewer.tsx`.
  - The looks applied at display and never baked (`film.tsx`), the roll's look a knob on every photographic ask.
  - Measure a phone (`measure.tsx`, the board's dock): opens the rear camera at its largest ideal (4032 by 3024),
    takes a frame as the page would (JPEG 0.92), `takePhoto` where ImageCapture exists, and the camera app's photo
    through `capture`, printing one line to copy; nothing leaves the phone. Driven end to end on Chrome's fake camera
    (a 3840 by 2160 frame and takePhoto read back).
- **Assets requested from Will**: none (the twelve marketing stills stand in for the camera and the roll).
- **Board ideas**:
  - The event's own wrapper as its printed table card and poster: the camera and the code wearing one design.
  - The kit: `defineExploration` keeps the first control of an id, so an ask whose id equals a config knob's
    silently swallows the knob (this board's `screen` ask ate the Screen knob until it became `wall`); a registry
    check could refuse the collision.
  - The premiere on the wall: at 9 am the reel's screen could count down and play the roll as an event of its own.
- **Records for the Orchestrator**: ROADMAP's lab line (:21) lists this board among the lab's lighter headings; it
  carries none now (`f6da48df`). ROADMAP :54 names `pick=line`'s door, but his round one pick was `step`, so the
  site's link would open Create's step with the camera picked.
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none.
- **Calls his to overrule**: the five carried calls above (size, refused, spent, ten, sound); each ask's
  recommendation (reel, pile, slideshow, covered, cards, hold, one, save); video as two asks.
- **Look at first**: the camera step (`/design/lab/disposable-mode?session=disposable-mode.camera`); then his one
  action, a minute a phone once this is on the alias: the board's Measure a phone on his iPhone and on an Android
  (Open the camera, Take a frame, the camera app's photo), and paste the line back, since the full-size promise and
  the `size` call ride on it.
