---
track: reel-refresh-cut
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "74794b60"            # the launch-prep SHA the branch was cut from
board: reel-front
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-cut/
  - src/app/(dev)/design/sandbox/reel-story/
  - src/app/(dev)/design/sandbox/reel-front/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/PROGRAM.md
  - docs/reviews/reel-view.json
  - docs/reviews/reel-front.json
  - docs/reviews/media-viewer.json
  - src/app/(dev)/design/sandbox/reel-view/spec.ts
  - src/app/(dev)/design/sandbox/help-center/fixtures.ts
---

# lp/reel-refresh-cut

**Goal.** The creator and marketing boards re-cut under Will's batch-1 answers (both doors into the creator, Save to Photos, his words Highlight reel and clip, a minimum of two), and reel-front's second round: how the tile reads as the reel, and what replaces its chip.

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

**Will's answers on `media-viewer` round 1 (2026-09-24, verbatim, ask=option then his note):**
- `opening=grow`
- `holds=pills` "This is more of a selection on the floating UI versus tucking at the bottom. More visible in the lightbox. Additionally, it gives more room for longer guest names by stacking the actions. I'm still open to any redesign ideas, but of these, this is my favorite selection. Don't love our 'own photo' marker or placement."
- `who=face` "This is already a great step in the right direction of my previous note about redesigning the floating UI"
- `next=peek` "I almost selected the filmstrip, but I like this balance of a more focused lightbox with the quick ability to exit the lightbox and continue in the gallery. However, where we have more room on desktop lightboxes, a more subtle film strip may be cool to include."
- `closeup=pinch`
- `video=auto` "However, the sound icon will need to be moved based on a prior selection of moving the uploader credit chip. Video should also have at least a scrubber (right word for time control UI bar?) to control the video (to rewatch or skip to certain points)."
- `wayout=down` "Also clicking on any blank space around the media should close. At some point, I requested an agent to make the clickable sides larger (so it wasn't a small button for back/next) and now if I tap anywhere on the left or right side, it goes the neighboring media. Feels weird when I tap the empty space expecting a close."
- `link=file` "By default, share should send the picture itself, since it's the expected behavior. However, we could also include a 'copy link' share action that sends a link to the photograph, like in the option 2 demo. Multiple share options is good. Additionally, I noticed that when clicking download, there wasn't a clean flow to get media into my iPhone's native Photos library, just downloading to my Files app. Most users would likely prefer a priority option of native photo library (especially on mobile), with the rest as secondary options. We're not looking to reduce ways to download, just include the expected native way as the default."

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

**What the three boards become** (every option kept unless solved at its best; list every move under Questions as his to overrule):
- **`reel-cut`** (round 1, re-cut):
  - **The header:** its "the reel view's chrome is drawn neutrally here" becomes his chrome.
  - **`entry`** is drawn from both doors: the view's primary "Make your own" and the tile's "Make your own clip to share". `beneath` is essentially the tile's door now; say so and keep it.
  - **`noencode`** is redrawn on the weighted dock, where removing the primary empties the main slot, and on the tile's description.
  - **`finish`** draws Save as "Save to Photos" (his `link` note: the phone's library first, a download second); Share already sends the file.
  - **The noun:** the guest-facing word follows his copy, "clip". Wherever a board asks the word, "cut" stays as an option.
  - `room`, `looks`, `moments`, `blocked`, `wait` and `mark` stay; redraw only what his givens change.
- **`reel-story`** (round 1, re-cut):
  - **`help`** gains "Highlight reel" as an option. His heading made it the tile's name; it is today's category name, and it was missing.
  - **`steps` and `pricing`** draw his "clip" beside "cut".
  - **`teaser`** gains the crossfade tile as a fourth option.
  - Every "third photo" becomes "second".
- **`reel-front` round 2** (carry all seven r1 answers as decided):
  - **`signature`:** how the tile reads as the reel rather than the album. Three or four polished directions over the real crossfade, whose stills come from the reel's own take, not the album's newest; his r1 crossfade is one of them. His words: "The different images differentiate the reel vs album media stills. However, I'd love to see other design ideas for this differentiation. This could be very polished/refined or taken in a better direction."
  - **`badge`:** the replacement for "The reel" chip ("could be replaced with something better"), with none as one option.
  - Draw at 375 and 1440, headed "Highlight reel" with his description line.

**Boundaries.** Only the three sandbox folders. `reel-screen` and `reel-host` are `reel-refresh-host`'s.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

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
- Gates on the synced tree, each on its own exit code
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
