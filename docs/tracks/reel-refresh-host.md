---
track: reel-refresh-host
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "74794b60"            # the launch-prep SHA the branch was cut from
board: reel-host
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-screen/
  - src/app/(dev)/design/sandbox/reel-host/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
  - docs/reviews/reel-view.json
  - docs/reviews/reel-front.json
  - docs/reviews/reel-screen.json
  - src/app/(dev)/design/sandbox/reel-view/spec.ts
  - src/app/(dev)/design/sandbox/reel-front/spec.ts
  - src/app/(dev)/design/sandbox/host-curation/spec.ts
---

# lp/reel-refresh-host

**Goal.** The reel's host-side and big-screen boards re-cut under Will's batch-1 answers and his merge rule: the screen board becomes the reel on a big screen (idle and start, drawn on the view), and the host board takes the merged questions (how the reel reaches a screen, what tells the host about waiting uploads), the host's reel defaults, and a new ask for the progression to the reel.

## The brief

**Will's answers on `reel-view` round 1 (2026-09-24, verbatim):**
- `chrome=thin` "I do like the idea of having one subtle timeline bar to give users something to reach for when controls are hidden. The cursor movement from the reach will open controls. We should have a clean animation (libraries.dev gooey would be sick, else something morphy or at least fluid) for when the timeline opens to controls. The 'close' icon should also hide/show with controls. All controls should have clear tooltip labels on hover. We could also add a control to toggle whether the event's QR code is shown in the reel while playing (good for big screens to get everyone in). On mobile, rather than expecting a random click to open controls (which it could), we could also make a tap on the subtle timeline (more clear as clickable) open/close the reel controls."
- `controls=weighted` "I like this to give each action set its own space, but let's drop the text label from "Add Yours" and make that a single icon button in the top row. "Make Your Own" lives as the primary action beneath. By this point, it's likely the host or guest photos have already been added. Don't need to push quite as hard versus clean media presentation and letting users know they can make their own reels."
- `arrival=chip` "By placing in the top left, it can be further refined into a subtle feed with temporary stacking (limited depth) if high-frequency uploading leads to 2+ notifications at once before they disappear (feed could be not just names, but even 'X +12' or something better). It also doesn't become a centerpiece of the reel, like option 1 frames it as. Including the new item announcements is a really cool way to make the reel feel live/realtime versus just a slideshow of any album."
- `tap=lightbox`
- `posture=follow` "Reel media presentation should feel like a full-screen experience so that, if used on big screens at events, it fills them."
- `pacing=unhurried` "Let's make 3 seconds the default, but this should be adjustable in the reels lightbox controls. For something like this where there's a huge array of user preferences, makes more sense to make it customizable."
- `loop=continues`
- `reduced=paused`

**Will's answers on `reel-front` round 1 (2026-09-24, verbatim):**
- `tile=crossfade` "This allows us to control the design and ensure it stays less busy than a potentially super fast, distracting, overwhelming version. The different images differentiate the reel vs album media stills. However, I'd love to see other design ideas for this differentiation. This could be very polished/refined or taken in a better direction.."
- `verbs=watch-make` "However, since we have the event name in the header above, let's change the reel heading text to 'Highlight reel', and instead of having a 'Make your own' badge, replace the reel style and number of moments text beneath the new 'Highlight reel' heading with a 'Make your own clip to share' description. Guests don't need to see the reel style (likely don't even know what that is) or number of moments (the album beneath can have a subtle total items number label). 'The Reel' badge in top left could be replaced with something better."
- `states=nothing` "We don't necessarily need to fill that slot with a clear empty state UI or progression, especially to guests. It can simply be missing/nothing until minimum reached. However, in the host's event page, some sort of progression UI would be super helpful so they know how to unlock a reel for their event with it being such a core feature. Would be easy for a host to open an event with 1 image and think "where's my reel??". Could even drop the minimum to 2 so they bounce back and forth if that works with our engine."
- `yours=toast` "This toast is more clear than adjusting a reel label that may be scrolled past, but should likely be a more clear 'The host added your uploads' with a 'Watch reel' action if guests are deeper in the album but want to check it out immediately. The more generic 'The host added your uploads' intentionally avoids numbers in case all weren't, and to avoid having to update a live number in the toast so it simply appears once when at least 1+ guest media will be in the reel with moderation enabled. For moderated events, it'd likely also be nice to have some sort of UI (maybe a queue-esque modal or something opened by a floating icon button beside add photos or something) for guests to track either their upload batch's progress or approval status, so they aren't left wondering which images are in or where they are."
- `door=stills` "This feels a bit less busy and lets us potentially use a bit of motion in our welcome flow without clashing with a moving reel behind."
- `closed=plays`
- `hub=labelled` "However, let's add a more calm living thumbnail behind this card version as a full background with overlay to make the Reel card feel more alive than the rest."

**Will's answers on `reel-screen` round 1 (2026-09-24, verbatim):** `qr=corner`; `name=none`; `caption=?` "We addressed what happens when media is added while the reel is open in a previous question already answered."; `pacing=?` "This was also addressed in the previous question. Noticing some repeats; calling an end to the review here". And in chat: "I noticed the same 2 questions of "how long to hold an image in the reel slideshow" and "how to announce new media added in slideshow" were asked almost back-to-back in the 'reel's full-screen view' and 'the reel on the wall' boards. The 'reel fullscreen view' had much better UI for it so I answered those and marked the following repeats as not clear, but didn't want to keep going."

**His rule for repeats (2026-09-24, verbatim):** "One contextual note from the repeats I encountered: one was substantially better than the other. If we do discover repeats, we should attempt to keep all options in play and, instead of removing one, merge options under the same question." And the program's own rule (`docs/PROGRAM.md` 6-7): stacked boards never overlap in what they ask; when a ruling reaches a question still open elsewhere, the question is adapted to the current context with every road that could still beat the current path kept open as an option, and only a question already solved at its best is removed.

**His ruling in chat (2026-09-24): "The view is the wall."** One full-screen view serves phones, laptops and event screens; there is no separate wall mode. "Play on a screen" opens the same view with the event's code shown and a one-tap Start that takes fullscreen and keeps the screen awake; the viewer's hold setting applies.

**His answers are now givens on every drawing:**
- **The view** has a slim glass bar at rest that morphs into the dock; one top row of icons (play/pause, Include videos, Style, Hold, Show the code, Add yours as an icon) with "Make your own" as the single primary beneath; a top-left arrival chip that stacks into a short feed; full-bleed posture; a 3 s default hold adjustable in the dock; the event's code as a white plate bottom right ("Scan to add yours" plus the address); no event name on screen.
- **The view is the wall:** "Play on a screen" opens the same view with the code on and a one-tap Start.
- **The album's tile** is a slow crossfade headed "Highlight reel" and described "Make your own clip to share": no style name, no moment count, no corner badge. For guests it is absent below the minimum, which drops to TWO.
- **A moderated event's guest** gets a toast once: "The host added your uploads" with "Watch reel".
- **The media viewer** has a face-led credit top-left, the floating action capsule, the neighbours peeking, pinch, swipe-down, and Save to Photos first on a phone.

**How a board changes** (`docs/PROGRAM.md` "A round returns DECISIONS"; the Library's working rules):
- **The spec.** A board's questions live once, in its `spec.ts`. Every option is drawn, and a missing preview is a type error. Every frame of the reel is drawn by the real engine over the fixture album.
- **Rounds.** A board that already has his answers (a ledger in `docs/reviews/<id>.json`) opens its next round with the decided asks carried as givens. A board with none keeps round 1 and simply re-cuts its asks.
- **The stacking rule.** Before you finish, read every open ask on every standing board (`node usher/kit/board-card.mjs --desk`) and list in your Handoff each ask of yours beside the nearest open one elsewhere, with why they differ. No two open asks on the desk may repeat.
- **The gate** includes `pnpm lab:smoke` and `pnpm lab:demo --board <each board you touched>`. Capture every board at 1440 and 375 to your scratch directory.
- **Registration.** `registry.ts`, `boards.ts` and `touchpoints.ts`' `DESK_ORDER` are the Orchestrator's. A round bump lives in your board's own files; if a registry line truly must change, it is a single listed exception.

**What the two boards become** (every option kept unless the question is solved at its best; list every move under Questions as his to overrule):
- **`reel-screen` becomes "the reel on a big screen"** (round 2; retitle it):
  - **Carried as decided:** `qr=corner`, `name=none`.
  - **Gone, as answered:** `caption` (the screen's arrival is the view's chip; drop its top-right chip too) and `pacing` (its three holds, 3.6, 5 and 7 s, are steps of the view's Hold control now).
  - **Redrawn on the view:**
    - `idle`: what a screen shows before the minimum. Nothing counts up in public (his `states=nothing`). `code` fits both answers; `invite` and `stills` are redrawn without the name and without a public count. "Third photo" becomes "second".
    - `start`: the one-tap plate, redrawn without the name.
  - **Moved to `reel-host`:** `open` and `review`, which are the host's questions.
  - The header's "already decided" list is rewritten to his answers: the wall is the view, the code in a corner, no name, the hold the viewer's own.
- **`reel-host`** (round 1, nothing answered; re-cut):
  - `style` is reframed as "where the host's reel defaults (mood and hold) live": the view's own Style and Hold set the event's default when the host moves them, a Settings card, or both. Style already sits in the view for every viewer.
  - `switch` ("Show the reel") gains the progression card as a home.
  - **One merged `open` question** ("how does a host put the reel on a screen"): `reel-host.screen` + `reel-screen.open`. Options: the hub card (both boards' recommendation), a control in the view (redrawn on his dock), the share sheet, Settings beside "Show the reel". The screen link (a capability token needing expiry and revocation) stays an option, marked as its own later build.
  - **One merged `review` question** ("does anything tell the host that waiting uploads are not in the reel"): `reel-host.review` + `reel-screen.review` + the options of `host-curation.count` (that lane removes its copy; name them in yours). Options: a host-only chip on the screen, the room line, the arrival feed carrying "3 waiting" for the host only, Review's header, nothing. On a screen the only words are the code's, per `name=none`, so draw what each option puts on the screen honestly.
  - `pulse` is redrawn for a minimum of two and his crossfade.
  - `cut` is unchanged (he dislikes the own-photo marker, which the `marked` option leans on).
  - **A new ask:** the host's progression to the reel. His note: "some sort of progression UI would be super helpful so they know how to unlock a reel ... Would be easy for a host to open an event with 1 image and think "where's my reel??"". Three or four options on the host's event page (for example a card that fills as items arrive, a line on the Reel card, a step in the next-steps band), drawn at 375 and 1440.
  - His hub note, the living background behind the labelled Reel card, is a given on every hub drawing.

**Boundaries.** Only the two sandbox folders. The other reel boards are `reel-refresh-cut`'s; the standing boards are `desk-refresh-standing`'s, whose `host-curation.count` leaves in favour of your merged `review`.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Every call below was taken on its recommendation and built; each is his to overrule. Those marked (call) also ride the
board itself as a carried call above its sections, as does each board's `look` call (Sunset on every reel frame).

- **reel-screen, which television opens the board?** Took 1440 by 810 (the same composition; every length is a share of
  the screen), with a real 1920 on the knob. At the lab's 1:1 default a 1920 frame scrolls sideways on a laptop and
  `lab:demo` keeps only the window, so round one's corner code reached the capture cut in half.
- **reel-screen, does the code ride the Start plate?** Took yes, in its corner on all three plates: the room can scan
  while the host is still at the laptop. (call `plate-code`)
- **reel-screen, which idle option leads?** Took `code` (round one led with `invite`): the one option both his answers
  already describe (no name, no count). `invite` and `stills` redrawn without the name and without a count; "third"
  became "second".
- **reel-screen, what is idle drawn at?** Took one photograph, the only count under the minimum of two with a picture;
  `stills` says "with none yet, the code alone". (call `one-photo`)
- **reel-screen, the countdown's honesty.** Took: its option says at zero it plays in the window, because only a press
  can take fullscreen (a browser rule the old option skipped).
- **reel-host, which door onto a big screen leads?** Took `view` (one more icon in the dock's top row, at a
  laptop-sized window only), over the hub door both old boards recommended: his ruling made the screen a posture of the
  view, and a public event's venue computer then never needs the host signed in. (call `screen-rec`)
- **reel-host, the merged `review`.** Took seven options: `wired` (host-curation `count.three` and both boards'
  `nothing`, which drew the same picture), `agree` (`count.deeplink`), `card` (`count.one`), `header`
  (reel-host `roomsays`), `feed` (reel-host `viewsays` redrawn on his arrival feed), `chip` (reel-screen `host`),
  `room` (reel-screen `room`). Recommended `feed`. The merge makes the count options exclusive with the reel ones; a
  pick of `feed` can still take `agree`'s one-number fix at the wiring.
- **reel-host, does a host-only feed line reach a screen?** Took no: the screen posture drops it, so only `chip` and
  `room` ever put words beside the code. (call `host-line`)
- **reel-host, how `review` is drawn.** Took one 1440 frame per option, the screen at half a 1920 wall (container
  units) beside the host's phone at 375, because `lab:demo` keeps only a stage's largest frame and two frames would
  have sent five of seven options to the sheet as the same resting screen. No viewport knob on this ask.
- **reel-host, the reel's defaults (`style`).** Took `view` (the host's own moves set it, the popover says so),
  `sheet` (a Settings card: the eight moods as engine frames and the hold's seven steps) and `both` (Settings plus an
  explicit "Set for everyone" in the host's popover). Recommended `both` (the old board led with `sheet`): a host
  slowing the hold for a wall would otherwise slow every phone.
- **reel-host, `switch`.** Added `card` (a reel card above the album that counts to two, then holds the switch);
  `inview` redrawn on his dock (in a hand it rides its own capsule above the row). Recommendation unchanged.
- **reel-host, `pulse`.** `live` and `threshold` were one rule (the line from the minimum), so `live` became `counts`
  ("1 more photo starts the highlight reel", then "Highlight reel live"); "clips" left the line (a clip is the guest's
  own cut now). `cover` crossfades the reel's own stills at his tile's calm pace. Recommendation unchanged.
- **reel-host, `progress` (new).** Took four options (`card`, `band`, `tile`, `step`), recommended `card`, drawn at
  none, one and two photographs on a new `items` knob (default one). Below the minimum the non-card options leave the
  Reel card plain ("Not yet"), so only `card` changes it.
- **reel-host, smaller calls.** The Reel card's value line from the minimum is "{n} items" (his `labelled` pick as
  reel-front drew it); every sheet opens over the hub with the real sheet's scrim; the hub's album is a plain tile grid
  (no question is about it); `cut` is verbatim, its confirm now fits a 375 frame; the reel-host knob is labelled
  "Viewport" on a board about big screens.
- **Registration (the Orchestrator's, not edited here).** `touchpoints.ts`'s rows still say "The reel on the wall" and
  the round-one notes; the replacement text is in the Handoff.

## System-doc edits (in place, owned facts only)

- none (a lab-only lane: no system fact inside these two folders changed)

## Deferred (ROADMAP one-liners, bucket named)

- The lab and the kit: `lab:demo` compares only a stage's largest frame, so a question whose every option is two
  surfaces at once had to draw one composite frame (reel-host `review`); comparing the union of a stage's frames would
  let such a board use two real viewports.
- The lab and the kit: a frame wider than the window (a 1920 television) is clipped in `lab:demo`'s captures at the
  lab's 1:1 default (reel-screen r1's corner code reached the capture cut in half); the demo could capture a `Fit`
  box's full scroll width.
- The lab and the kit: `usher/kit/board-card.mjs --desk` counts answers across every round, so reel-screen r2 reads
  "2 asks, 2 answered" with both open; it could count the spec's own round, as `queue.ts` does.

## Handoff (replaces the chat report)

- **Commits, pushed.** Work: `44fb3637` (both boards re-cut) and `76e5e2ef` (a small album's hub counts its own
  guests and crossfades only its own photographs). Sync merges, one per landing: `90146e2b` (reel-refresh-cut),
  `b9c8e138` (desk-refresh-standing), `84b72588` (media-viewer-wiring). The head is in the chat line.
- **Gates on the synced tree `84b72588`, each on its own exit code** (logs in the scratch dir, `g4-*.log`):
  `pnpm design:rules` 0 (no diff) · `collect-specimens.mjs` 0 (no diff) · `pnpm typecheck` 0 · `pnpm lint` 0 (7
  warnings, none in a touched file) · `pnpm test` 0 (434 files, 4,779 passed, 1 skipped) · `pnpm build` 0 ·
  `pnpm lab:smoke --base http://localhost:3133` 0 (499 checks, 0 failing; reading: reel-screen 393, reel-host 597, of
  1,200) · `pnpm lab:demo --board reel-screen` 0 (2 steps, 0 failing) · `pnpm lab:demo --board reel-host` 0 (7 steps,
  0 failing; `pulse`'s `counts` and `threshold` warn "same picture": they truly differ by the one short line under the
  one-photo event).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the 21 paths below plus this file; no exceptions.
  `sandbox/reel-host/`: `board.tsx`, `fixtures.ts`, `parts-counts.tsx` (new), `parts-curation.tsx`,
  `parts-dashboard.tsx`, `parts-hub.tsx`, `parts-living.tsx` (new), `parts-reel-view.tsx` (deleted, replaced by
  `parts-view.tsx`), `parts-screen.tsx` (new), `parts-settings.tsx`, `parts-share.tsx`, `parts-view.tsx` (new),
  `scene.tsx`, `spec.ts`, `stills.tsx` (new). `sandbox/reel-screen/`: `board.tsx`, `fixtures.ts`, `parts.tsx`,
  `spec.ts`, `stills.tsx`, `wall.tsx`. Only `board.tsx` and `spec.ts` are imported from outside (`boards.ts`,
  `registry.ts`), and their exports (`ReelHostBoard`, `REEL_HOST`, `ReelScreenBoard`, `REEL_SCREEN`) are unchanged.
- **Items.**
  - reel-screen r2, retitled "The reel on a big screen": `idle` and `start` redrawn on the view (no name, no public
    count, the code in its corner); `qr` and `name` carried; `caption` and `pacing` gone as answered; `open` and
    `review` moved to reel-host; the header's decided list rewritten to his answers.
  - reel-screen's engine: two stills (the take's opening shot, and the one photograph as a reel of one), Sunset.
  - reel-host re-cut, seven asks in leverage order: `progress` (new), `open` (merged), `review` (merged, seven
    options), `style` (the reel's defaults), `switch` (+`card`), `pulse` (redrawn for two), `cut` (verbatim).
  - The view drawn on his givens (`parts-view.tsx`): the glass bar at rest, the weighted dock with one icon row and
    "Make your own" beneath, the arrival feed ("Theo Calder +2"), Close with the dock, a tooltip open where a question
    is about a control, the code plate, no event name; `device` props rather than breakpoints.
  - Every reel frame on reel-host is the engine's over the reel's own take (`planTake`), and the eight moods are
    engine frames of one photograph, where the old board used an album photo behind a chrome and gradient swatches.
  - The hub quoted at rest with his living Reel card (a calm crossfade under an overlay) on every drawing from the
    minimum up; the launch list quoted for an event with no photographs.
  - `review`'s composite: the screen in container units at half a 1920 wall, the host's phone at 375, one frame.
- **Captures** (scratch dir `reel-refresh-host/`): `final-1440/` (every option of both boards, from `lab:demo`),
  `final-375/` (every reel-host option but `review`, which is one composite), `final-1920/` (reel-screen at a real
  television's pixels), `final-items/` (`progress` at none and at two); the board pages at 375 and 1440 are
  `board-*-375.png` and `board-*-1440.png`; reduced motion was emulated on every capture.
- **The stacking rule** (every open ask on the desk read after both syncs; mine beside the nearest elsewhere):
  - `reel-screen.idle` · `reel-host.progress`: the same moment below the minimum, but the room's television (public,
    no name, no count) against the host's own page (private, where the count is the point).
  - `reel-screen.idle` · `reel-cut.noencode`: a screen before a reel exists, against a device that cannot cut.
  - `reel-screen.start` · `reel-host.open`: the first thing the screen shows once opened, against where its door sits.
  - `reel-host.progress` · `reel-front.signature` and `badge`: the host's hub below the minimum, against the guest
    tile once it plays (guests see nothing below it).
  - `reel-host.open` · `reel-cut.entry`: two doors out of the reel, one to a screen, one to the creator.
  - `reel-host.review` · `guest-capture.tracker`, `host-curation.arrivals`, `voice-guest.waiting`: telling the HOST a
    queue waits (and whether a screen says so), against telling the GUEST her batch's state, what the queue does when
    a photo lands mid-review, and the words on a held tile. `host-curation.count` left that board for this one.
  - `reel-host.style` · `reel-cut.looks`: the live reel's default mood and hold for everyone, against the looks a guest
    picks for her own cut.
  - `reel-host.switch` · `event-safety.choose`: whether the reel shows at all, against who may join.
  - `reel-host.pulse` · `reel-front.signature`: the dashboard card's cover, against the album tile's treatment; a
    dependency (a live cover may adopt whichever signature wins), not a repeat.
  - `reel-host.cut` · `reel-cut.finish`: what the album does once a host's cut is added, against the finish screen's
    offer to add it.
- **Registration text for `touchpoints.ts`** (the Orchestrator's file; not edited here):
  - `reel-screen`: title "The reel on a big screen"; ruled "open: the live reel on a venue's television, as the view:
    what the screen shows before the reel starts at the second photo, and the one-tap Start plate"; why "The view is
    the wall: Play on a screen opens the reel's own view full bleed on a television, the code in its corner, all night.";
    note "Two decisions on the view as a venue's television, at 1440 by 810 with a real 1920 on the knob, over Mia and
    Theo's wedding, every reel frame the real engine: what the screen shows before the reel starts at the second
    photo, and what the host presses to start it"; variants "Before it starts", "The Start plate".
  - `reel-host`: ruled "open: the way to the reel before it starts, how a host puts it on a big screen, what tells a
    host about waiting uploads, the reel's defaults, the Show the reel switch, the dashboard's line, and a host's own
    cut"; note "Seven decisions on the real hub, settings sheet, share sheet, dashboard and the view as ruled, over Mia
    and Theo's wedding at 1440 with 375 on the knob: how the page shows the way to the reel below two photographs,
    where the door to a big screen sits, what tells a host that uploads wait (drawn on the screen and the host's
    phone), where the reel's defaults live, where Show the reel sits, how the dashboard says the reel is live, and what
    a host's own cut does to the album"; variants "The way to the reel", "Onto a big screen", "Waiting uploads", "The
    reel's defaults", "Show the reel", "The dashboard's line", "A host's own cut, added".
- **Assets requested from Will:** none.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule** (each argued under Questions):
  - reel-screen opens on 1440, a real 1920 on the knob.
  - The code rides every Start plate.
  - `idle` leads with `code`.
  - idle is drawn at one photograph.
  - `open` leads with the view's dock control, not the hub door.
  - `review` is seven merged options led by `feed`, and the screen posture drops a host-only line.
  - `style` leads with `both`, the view's side made an explicit "Set for everyone".
  - `switch` gains `card`.
  - `pulse`'s `live` became `counts`.
  - `progress` leads with `card`, and the Reel card says "Not yet" below the minimum everywhere else.
  - Sunset is the look on every frame of both boards.
- **Look at first:** reel-host `review` (one step, seven composites: the screen and the host's phone side by side);
  reel-host `progress` with the `items` knob at none, one and two; reel-host `open` at 1440 and 375 (the view's control
  is laptop-only, and the hub's fifth door sits past a phone row's edge); reel-screen `start` on the 1920 knob.
