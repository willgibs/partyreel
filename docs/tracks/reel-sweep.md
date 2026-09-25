---
track: reel-sweep
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e13a98d6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/marketing/
  - src/app/(marketing)/(cinema)/
  - src/app/(marketing)/(paper)/
  - src/lib/constants/marketing-
  - src/lib/constants/legal
  - content/help/
  - content/blog/
  - src/lib/content/
  - src/app/llms.txt/
  - src/app/llms-full.txt/
  - docs/systems/reel.md
  - docs/systems/guest-flow.md
  - docs/systems/host-app.md
  - docs/systems/billing-caps.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/marketing-content.md
  - docs/systems/admin-observability.md
  - docs/SYSTEMS.md
  - docs/PRD.md
  - docs/PRICING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/reel-story.json
  - src/app/(dev)/design/sandbox/reel-story/spec.ts
  - src/lib/events/gallery-reel.ts
  - src/lib/reel/defaults.ts
  - src/lib/constants/tiers.ts
---

# lp/reel-sweep

**Goal.** Retell the reel everywhere a person reads about it: the highlight reel is live and belongs to the event, a clip is yours to make and share. Marketing's settled pieces, the help center, the legal pages, the admin words and the system docs, with `docs/systems/reel.md` born as the reel's one home. "Clip" is the noun throughout.

## The brief

Will's `reel-story` answers are in `docs/reviews/reel-story.json` (round 1); round 2 is drawing tonight (`story-r2`).

**The model you write.** The highlight reel belongs to the event: alive from the second approved, reel-eligible photo, a looping montage of what the album shows, playing in a tile at the album's head and full screen in a view that is also the screen for a party wall; uploads splice in, hides drop out; no host action, no file, no download; it obeys the album's gate; its look is the event's default mood and hold, and any viewer can switch on their own device. A clip is yours: anyone with album access starts one from the reel with Make your own, picks moments, a look, a layout and a length, and it renders on the device and saves or shares as a file, never stored; on a paid event Add to event puts it in the album as an ordinary video, metered and moderated, which the reel never plays. Free clips carry a small mark and run 30 seconds; the live reel and the screen carry no mark on any plan. No music, no beat-sync, no end-card, curated randomness, never a timeline. The names: "Highlight reel", "clip", "Make your own", "Add to event".

**Settled, build now:**
- `arc=live-first`, with the screen second and clips third (his call, handed to the Orchestrator: the party, then the morning after). The /reel page keeps its live style switcher as the engine's proof.
- `pricing=renamed`: "Clip length" 30s / 60s / 60s and "Clip watermark" Small mark / None / None.
- `steps=grow-clip`: the host's last step "Watch the reel grow" and the guest's "Make your clip".
- `help=highlight-reel`: the category and its nav entry are "Highlight reel".
- Every "no slideshow", "Create reel", "one reel per event", stored-mp4 or publish claim retold where it lives (features, how-it-works, the event pages' reel angles, `llms.ts`, the JSON-LD, the blog post, the pricing rows, cards and FAQ); `mock-parity` entries for any newly quoted UI label. The curation page's bulk-select mock (`bulk-tools.tsx`, `bulk-select-mock.tsx`) still draws and names Add to reel, which left the host's bulk bar.

**Not yours tonight** (round 2 decides them, and a later lane builds them): the home's closing section (its heading and the thesis line under it), the feature hub's reel card line, the /reel page's hero heading (today all three read `GOLDEN_LINES.reelThesis`), the event pages' reel side beside the demo door, and the home's reel teaser section. Leave those strings and sections as they are, even where they are stale.

**Help.** The category renamed. The articles: the reel; the screen (merging `show-the-album-live-on-a-screen`, dropping its stale password line: the host's screen bypasses every gate); make your own clip; looks, length and layout; a clip that won't export; adding a clip to the event. Retire the two articles the model made false, with redirects. UiLabel pins follow every label you quote.

**Legal.** Terms 1.5 gains one sentence: any guest with album access may make and share a clip for personal, non-commercial use, under the existing guest-content licence; the host's licence line swaps "highlight reels" for "clips". Privacy 1.6's purpose becomes "rendering the reel and clips on your device". `legal.ts`'s versions follow.

**Docs.** Birth `docs/systems/reel.md` as the reel's one home: the live reel, the take, the view and screen, the defaults and the lever, the clip, what `reel-clip-wiring` and `reel-teardown` put in their Handoffs (the limiter, the sweep, the lever's switch). The reel sections of `guest-flow.md` and `host-app.md` become pointers; `billing-caps.md` loses the old exemption; `notifications-analytics-growth.md` says the reel and clips carry no telemetry in v1; `SYSTEMS.md` lists `reel.md`; `PRD.md` and `PRICING.md` tell the new model. `uploads-and-r2.md` belongs to `album-pages` tonight: put any reel line it needs in `reel.md` instead. The docs keep none of the old model (host-made, one per event, stored, published, a downloadable mp4) and no history.

**Merge order.** You merge last among the reel lanes, quoting the strings `reel-clip-wiring` and `reel-teardown` ship (sync past them before you hand off).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole; every marketing page and help article you touched at 1440 and 375; `git grep` finds none of the retired claims ("Create reel", "one reel per event", "no slideshow", a stored reel download) outside the sections round 2 holds; the retired help slugs redirect; the content tests (help, llms, JSON-LD, mock-parity, UiLabel pins) green.

## Questions (a recommended answer each; the Orchestrator relays them)

- **The event pages' reel angles sit inside the held reel side.** The brief retells "the event pages' reel angles" and
  also holds "the event pages' reel side beside the demo door", where those five lines are the only place they render.
  Recommended, built: the five `reelAngle` strings (`constants/events.ts`) are retold now in round 1's settled
  `events=wall` register (the reel on the room's screen at that kind of event); the side itself (its layout, the
  "And it ends with a reel." line, the stored poster player, its caption and link) stays for round 2's `wall`.
- **Five help slugs move, two of them retired.** Recommended, built: `the-highlight-reel` and
  `reel-styles-length-and-layout` keep their slugs (rewritten); `show-the-album-live-on-a-screen` merges into
  `play-the-reel-on-a-screen`; `pick-and-reorder-reel-moments` becomes `make-your-own-clip`; `the-reel-wont-download`
  becomes `a-clip-wont-finish-or-save` (troubleshooting, where failures live); the two false ones retire, the download
  article to `make-your-own-clip` and the share article to `the-highlight-reel`. Every moved slug 308s
  (`help-redirects.ts`); `add-a-clip-to-the-event` is new. The category runs live-first: reel, screen, clip.
- **"Clip" also meant a video upload** in about a dozen marketing, help and blog lines ("Guests add clips straight to
  the album"). Recommended, built: those say "video" now, so "clip" names only what a viewer makes from the reel.
- **The /reel page's three chapters get honest file names.** The spec named `render-section.tsx`, `tier-section.tsx`
  and `guest-share-section.tsx` as the files to rebuild. Recommended, built: new `live-section.tsx`,
  `screen-section.tsx` and `clip-section.tsx` in that order (the clip chapter carries the renamed length and mark
  table), and the five stored-reel sections (the wysiwyg claim, the render story, the tier table, the guest share, the
  how-it-works reprise) are deleted; the switcher stays second as the engine's proof.
- **Four constants files outside `owns` carry settled picks.** `how-it-works.ts` (`steps=grow-clip`), `events.ts` (the
  angles), `press.ts` (the fact sheet, "the sweep's alone" per `reel-story`) and `careers.ts` (the reel engineer's
  posting sells the Studio) are unclaimed tonight. Built as listed exceptions; the owns list could carry them.

## System-doc edits (in place, owned facts only)

- `reel.md` born as the reel's one home: the model and its names, the payload facts, the take, the tile, the view and
  the screen, the host's side, the defaults and the lever (it fails open), the clip (the creator, the finish, Add to
  event and its `reel_clip_add` budget, the mark's caveat), the looks, and the stored reel's end on its clock.
- `guest-flow.md` and `host-app.md`: their reel sections are pointers; the NOT HERE line, the viewer decision's callers
  (no `/api/reel/download`), a withdrawal's list (the live reel) and the band's lever are refined in place.
- `billing-caps.md`: the reel-artifact exemption is gone; a clip added to an event is an ordinary metered video; the
  length cap reaches the creator as `ClipFacts`.
- `notifications-analytics-growth.md`: the reel and clips carry no telemetry in v1.
- `admin-observability.md`: the lever's fail-open joins the kill switches' failure directions.
- `marketing-content.md`: the album's own "no big-screen mode" now points at the reel's screen; the reel's nouns and
  its one mark as a shared claim; a `/reel` line.
- `SYSTEMS.md` lists `reel.md`; `PRD.md` and `PRICING.md` tell the live reel and the clip.

## Deferred (ROADMAP one-liners, bucket named)

- Docs, after tonight's claims release: `uploads-and-r2.md`'s "no request rate limiter sits on the four routes" gains
  its one exception, a guest's clip add (`reel_clip_add`, `reel.md`); `design-system.md`'s "add-to-reel violet" is the
  reel's violet (Make your own).

## Handoff (replaces the chat report)

- **Commits, pushed to `lp/reel-sweep`**: the work in `71e7bd62` (the retelling), `ffdfd8da` (`reel.md` and the docs),
  `4344de16`, `84773a8b`, `fc68a230` (the /reel tile's glyph and the creator's finish), `1c273126` (the creator's words
  pinned, identity-email's passages) and `5f1c0189` (the limiter's refusal); the manifest in `b7ce55e6`, `2bf6edb5` and
  this commit. **Two syncs**: `7e35f09d` past reel-clip-wiring and identity-email (the clip lane's six unwrapped reel
  articles resolved to this side, as it anticipated) and `341602b2` past reel-teardown and album-window (clean);
  `origin/launch-prep` (`055baee9`) is contained in the head.
- **Gates on `5f1c0189`, the synced tree, each on its own exit code**: `pnpm typecheck` 0 (after `rm -rf .next/dev`: a
  stale dev validator still named the deleted `/api/reel/*`); `pnpm lint` 0 (6 warnings, none in a touched file:
  `review-session.tsx`, `home-hero/shared.tsx`, `contact-form.tsx`, `album-fill-grid.tsx` twice, `review-switch.tsx`);
  `pnpm test` 0 (5,192 tests); `zsh scripts/build-lock.sh pnpm build` 0 (`/reel` static); `pnpm lab:smoke --base
  http://localhost:3133` 0 (280 checks). No board, so no `lab:demo`.
- **Lane check** (115 paths): every one under `owns` or this file, but five exceptions: the four constants files of the
  last Question (`how-it-works.ts`, `events.ts`, `press.ts`, `careers.ts`), and one line of `touchpoints.ts` (the
  `reel-screen` board's `lives` moves to `play-the-reel-on-a-screen.mdx`, since `links.test.ts` resolves every `lives`
  path on disk).
- **/reel** (`arc=live-first`): the hero's subhead and caption; the switcher's heading off the facets ("8 moods for the
  reel, 6 more for your clip."); `live-section.tsx` (the app's `PosterCard` with the tile's glyph over `LivingStills` on
  a laptop album), `screen-section.tsx` (the reel as the wall, the demo's real code bottom right, "Scan to add yours")
  and `clip-section.tsx` (the creator's laptop finish beside the renamed table); the five stored-reel sections deleted;
  the close "Your reel starts at the second photo.".
- **Pricing** (`pricing=renamed`): "Clip length" and "Clip watermark" with tips, the Free and Pro cards, the Pass
  ticket, the FAQ and "The 60-second clip" tile.
- **How it works** (`steps=grow-clip`): "Watch the reel grow" over the hub card at none, one and live plus Settings'
  Look row; "Make your clip" over the reel's view with its Make your own and the clip beside it (the step id `clip`).
- **Help** (`help=highlight-reel`): the shelf runs reel, screen, clip (`the-highlight-reel`, `play-the-reel-on-a-screen`,
  `make-your-own-clip`, `reel-styles-length-and-layout`, `add-a-clip-to-the-event`), `a-clip-wont-finish-or-save` in
  troubleshooting, every creator label a `<UiLabel>`; five slugs 308 (`help-redirects.ts`; each curled 308 on localhost
  to its successor); 20 other articles' reel lines retold (bulk select without Add to reel, likes that no longer claim
  to steer the reel, the event page's Highlight reel card, Settings' Highlight reel section and the sheet's real order,
  the dashboard band, storage, plans, the free plan, the day-of checklist's screen step, the QR article's callout),
  and 4 more where "clip" meant a video.
- **Legal**: Terms 1.7 (the clip sentence under the guest-content license, the host's license names clips, the service
  and limits lines, `the-reel` retold with its id kept); Privacy 1.7 ("rendering the reel and clips on your device",
  and who can see what).
- **The rest**: nav and footer say "Highlight reel" (the help category's rung too), JSON-LD's feature list, `llms.ts`
  (the reel's paragraphs, the plan table, "When it is not"), the press boilerplate and fact sheet, the careers posting
  and story, the five `reelAngle` lines in the wall register, `/features` (metadata, subhead), the album page (the
  take-home plate with Make your own, the big-screen FAQ), the sharing page's reel row, the bulk-select mock (Like,
  Hide, Download in the app's hues) and its copy on two pages, the live demo's card, "video" wherever "clip" meant an
  upload, and `pro-vs-event-pass`'s table (a profile handle is free on every plan).
- **Blog**: `highlight-reel-renders-on-your-phone` rewritten (title, standfirst, FAQ, `updated`), thirteen posts' reel
  lines retold and three more where "clip" meant a video, the AUTHORING brief's product section and rules.
- **mock-parity**: 17 new pins, the reel's words in the tile, view, hub card and Settings, and the creator's head and
  finish (`clip-room.tsx`, `clip-finish.tsx`).
- **identity-email's two passages**, as relayed: `your-data-and-deleting-your-account.mdx` and
  `display-name-and-profile-photo.mdx`.
- **Verified**: the retired claims ("Create reel", "one reel per event", "no slideshow", a reel download, "Share with
  guests", "Open studio", "Add to reel") have no hit in this lane's paths; what remains repo-wide is migration SQL
  history, two comments outside `owns` and one plain English "share with guests". Captures in
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/401f4a77-be99-4a42-82f6-e5fac8e4a4c5/scratchpad/reel-sweep/`:
  `final-reel-1440-0{1..6}.png` and `final-reel-375-0{1..4}.png` (no sideways scroll at either), `hiw-1440-0{1,2}.png`
  and `final-hiw-375-0{1,2}.png`, `pricing-1440-0{1,3}.png`, `unlock-1440-01.png`, `album-1440-01.png`,
  `curation-1440-01.png`, `events-1440-01.png`, `help-*-01.png`, `helpindex-1440-01.png`, `final-help-375-0{2,3}.png`;
  reduced motion (`rm-reel-1440-*.png`: both loops paused on their posters, the tile holding its first still).
- Assets requested from Will: none (the screen chapter's loop is `hero-candidate-02`, the recorded engine loop the
  page already carried).
- Board ideas:
  - `events.ts`'s FAQs answer "Do guests need an app or an account?" with "No.", which the account rule forbids (the
    content-policy fence misses the question form).
  - `constants/features.ts`'s dead REEL band still reads "Every event ends with a reel"; the scaffold and its test
    could go.
  - Two stale comments outside `owns`: `gallery-access.server.test.ts` ("the reel download") and `queries/analytics.ts`
    ("Share with guests").
  - The home's live demo could land the reel's own tile (the `LivingStills` dissolve) where its payoff card is a still.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule, one line each:
  - The five Questions above, each built as recommended.
  - /reel's chapter headings ("It starts at the second photo.", "Put it on the wall.", "Everyone leaves with a clip of
    their own.") and its close ("Your reel starts at the second photo.").
  - The hero subhead under the held heading, and its caption "Recorded from the reel's own engine".
  - The album page's third plate, "Clip the reel", drawn with the violet Make your own.
  - The nav's reel line, "The album, playing itself on any screen."
  - The help category's blurb, "The reel that plays itself, on a screen too, and the clips you make."
- Look at first: `/reel` at 1440 (the three chapters, then 375), `/help/the-highlight-reel` and
  `/help/make-your-own-clip`, `/how-it-works` step six from both sides, then `/pricing`'s clip rows.
