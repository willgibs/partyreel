---
track: reel-refresh-cut
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
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

- **The guest-facing noun.** Every string a guest reads should say "clip" (his own tile copy) or keep "cut"? Taken: clip, everywhere a guest reads it (the finish header, both mark lines, the blocked toast and tooltip, the wait stack, the export modal, every `CutStill` alt); "cut" stays the board's own name, the folder and every identifier, unchanged, since nothing here asks which word to use. Recorded on the board itself too (`reel-cut`'s own `carried`). Overrule: if "cut" should stay the guest-facing word too, the touched strings revert; nothing structural moves.
- **`reel-story.teaser`'s recommendation.** Flipped from `engine` (the live canvas) to the new `crossfade` option, since the album's own tile settled on exactly that treatment (reel-front, ruled) and a live engine mount now doubles a cost the shipped product declined to pay. Overrule: if the section is closer to a hero moment than a proof point, `film` (the graded produced asset) reads more cinematic than any crossfade of stills.
- **`reel-story.help`'s recommendation.** Flipped from `the-reel` to the new `highlight-reel` option: today's shipped name, now doubly reinforced as the album tile's own heading. Overrule: if a reader's first confusion is mixing the always-on reel up with a personal cut, `live-reel` heads that off explicitly.
- **`reel-front.signature`'s recommendation.** A new ask, no prior pick to weigh against: recommended `graded` (a held-back wash and a thin letterbox over the take's own stills) as the cheapest way to say "footage from the reel", never another album photo. Overrule: if the album's own material alone should carry the whole difference, `plain` (the take's own crossfade, undressed) is the honest baseline.
- **`reel-front.badge`'s recommendation.** Recommended `none`, matching the manifest's own given (the tile draws bare there) over `live` or `glyph`: the heading already says "Highlight reel", so a corner chip repeats work the card already does. Overrule: if the corner should still say the one thing a badge always could, that this updates on its own, `live` is the smallest true upgrade over silence.
- **Retiring reel-front's live-canvas engine.** `engine.ts`, `propsFor` and every `buildReelProps` fixture that fed it are deleted (git holds them): round one's `tile=crossfade` verdict means nothing left open on this board ever needs a live frame again, and carrying a dead module for a settled question is what "the board only carries what is still open" (the `profile-page` precedent) means literally. Overrule: a future round that wants to re-litigate crossfade against a live mount rebuilds it from git history rather than reopening this one on a guess.

## System-doc edits (in place, owned facts only)

- None: no `docs/systems/` fact lives inside this lane's owned paths.

## Deferred (ROADMAP one-liners, bucket named)

- **Now:** once `reel-story.help` lands (Highlight reel vs the-reel), recheck `site-chrome`'s own footer/nav link wording for the reel against whichever name won.

## Handoff (replaces the chat report)

- Work commit: `dd3dc19a` — "reel-refresh-cut: re-cut reel-cut and reel-story, open reel-front round 2". No sync commit: `origin/launch-prep` had not moved (still `0ab6b0fe`, this lane's own cut point, confirmed by `git merge-base --is-ancestor origin/launch-prep HEAD` at hand-off).
- Every claim below names its artifact.
- Gates on the synced tree (== this tree; `launch-prep` unmoved), each its own exit code, all green:
  - `pnpm design:rules` — exit 0; no diff (`rules.generated.json`, `docs/design/library.md` unchanged — no contract, policy or `touchpoints.ts` line this round touched).
  - `node "src/app/(dev)/design/gallery/collect-specimens.mjs"` — exit 0; no diff (`specimens.generated.json` unchanged).
  - `pnpm typecheck` — exit 0.
  - `pnpm lint` — exit 0, 0 errors; 7 warnings, all pre-existing in files this lane never touched (confirmed by re-diffing the warning list before and after).
  - `pnpm test` — exit 0; 431 files, 4700 passed, 1 pre-existing skip.
  - `pnpm build` — exit 0.
  - `pnpm lab:smoke --base http://localhost:3134` — 502 checks, 0 failing.
  - `pnpm lab:demo --board reel-cut --base http://localhost:3134` — 9 steps, 0 failing.
  - `pnpm lab:demo --board reel-story --base http://localhost:3134` — 7 steps, 0 failing (one advisory: `steps`' `grow-cut`/`grow-clip` read as the same picture — expected, a deliberate one-word A/B the ask's own `means` text names).
  - `pnpm lab:demo --board reel-front --base http://localhost:3134` — 2 steps, 0 failing (one advisory: `badge`'s `live`/`glyph` marks read as the same picture at full-page diff scale, both being small quiet marks by design; `signature`'s own three-way "same picture" on the FIRST run was a real bug — `stacked`'s decorative layers were fully hidden behind a larger, later front layer — fixed in the same commit and reverified clean, 0 "same picture" notes).
  - Captures: 59 PNGs at 1440 (every option, every ask, all three boards) via `lab:demo --save-shots`, in this lane's scratch `captures/` directory; several spot-checked directly (the "Save to Photos" finish, the `stacked`/`graded`/`frame` signature treatments, the "Highlight reel" teaser crossfade) and read correctly.
  - The stacking rule: `node usher/kit/board-card.mjs --desk` plus a per-board read on `reel-screen`, `reel-host`, `media-viewer`, `help-center` and `site-chrome` (the nearest open asks in each surface this round touches) found no repeat: none of them ask the view's own chrome, the tile's signature or corner mark, the reel's guest-facing noun, or the reel category's name.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the three owned folders only (`src/app/(dev)/design/sandbox/{reel-cut,reel-front,reel-story}/*`, 15 files); no exceptions, pasted in this session's own record.
- The items, one line each:
  - `reel-cut.entry`: both doors named in the ask's own words; `beneath` annotated as the tile's own door.
  - `reel-cut.noencode`: redrawn on the weighted dock's now-empty primary slot AND the album tile's own description line (a second `Scene`, `TileDescriptionEcho`).
  - `reel-cut.finish`: Save reads "Save to Photos" in all three shapes (`four`, `share`, `save`).
  - `reel-cut`'s `ReelView`: wears the decided chrome (six-icon weighted dock, top-left arrival chip, bottom-right code plate, no event name) instead of a neutral placeholder.
  - `reel-cut` noun sweep: every guest-facing string says "clip"; the board, the folder and every identifier keep "cut".
  - `reel-story.help`: gains "Highlight reel", now recommended.
  - `reel-story.steps` / `.pricing`: gain a "clip" sibling option beside the existing "cut" one.
  - `reel-story.teaser`: gains the album tile's own crossfade, now recommended.
  - `reel-story`: every "third photo" is "second" (fixtures, spec and surfaces).
  - `reel-front` round two: `signature` (four options: `plain`, `graded`, `stacked`, `frame`) and `badge` (`none`, `live`, `glyph`) open; round one's seven asks retired to the ledger, carried as ground on `TileCard`.
  - `reel-front`: `engine.ts` and its dead fixtures deleted with round one's own crossfade verdict.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each: the five recommendation flips and the engine deletion, each listed under Questions above.
- Look at first: `reel-front.signature` (the four new tile treatments over the take's own stills, the round's most visual ask) and `reel-cut.entry`/`.noencode` (the two-door chrome).
