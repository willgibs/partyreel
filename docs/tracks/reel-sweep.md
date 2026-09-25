---
track: reel-sweep
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
