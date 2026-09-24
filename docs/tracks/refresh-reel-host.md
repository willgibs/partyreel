---
track: refresh-reel-host
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "75631277"            # the launch-prep SHA the branch was cut from
board: reel-screen
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/reel-screen/
  - src/app/(dev)/design/sandbox/reel-host/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/gallery-fixtures.ts
---

# lp/refresh-reel-host

**Goal.** The reel on a screen and the host's side of the reel: the refresh gates the reel round's wiring, so it goes first. Each open board refreshed under the new guidance: its strong options kept and improved, bolder directions added, and nothing fenced by an earlier pick or rule.

## The brief

**The refresh.** Design is now guidance and nothing is treated as finished, so every open board gets refreshed. The boards hold good ideas, but many were drawn fenced in by earlier picks and rules. This refresh improves on what each board has. Will runs through the refreshed boards once, the picks are wired, and any surface stays open to later rounds with fresh ideas.

- **Keep and improve.** Keep each board's strong options and make them better. Add bolder directions, so each ask has as many options as it has real directions: a binary ask gains a real third, and a set of variations on one idea gains a genuinely different one.
- **Each ask on its own case.** No earlier pick, rule or other board's answer fences an option: "worn as law", "never re-judged" and "givens" go. A question retired earlier may come back if its premise has since changed. His notes on record are direction; answered asks stay answered.
- **Start from the Library's recipe** (`/design/library`): the brand kit, the ten, production as it is now (open the live surface and look at it at 1440 and 375), the tests that have to keep passing, then a creative shot. The album's grid is being explored on its own board (`album-columns`), so draw the album as production has it.
- **The same shape as before:** one question per decision, in plain words, every option drawn on the real surface.
- **Comments too.** Rewrite your boards' comments the same way: each keeps its reason and drops any authority ("Will ruled", "law").
- **The one listed exception to your owns:** your board's row in `touchpoints.ts`, if what the board asks changed.

**What an audit of your boards saw** (a starting point, not a rule):
- `reel-screen` (2: 3,3; range: distinct): round-1 "givens" (code corner, no name, min two) fixed before any option drawn. Worth trying: Let one "idle" option question the no-name/no-count rule itself.
- `reel-host` (7: 4,5,7,3,4,3,3; range: wide, real places): "HIS ANSWERS ARE GIVENS ON EVERY DRAWING" (chrome, code, minimum). Worth trying: Healthiest board; keep merging repeats into options, not deleting.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke` whole; `pnpm lab:demo --board <id>` pressing every step, for `reel-screen`, `reel-host`.

## Questions (a recommended answer each; the Orchestrator relays them)

- **reel-host gains an eighth ask, `home`: what the Reel card opens** (the view, a Reel room, a Reel sheet). The reel's plan already opens the view, but the stored reel's room goes with the teardown, the host wiring's entry is this card, and a room or a sheet are real alternatives for the host's reel controls. Recommended: keep the ask; the board recommends the view.
- **reel-screen `idle` now recommends `welcome`** (a title card with the event's name and day), trying `name=none` on the empty screen's own case: over a playing reel a name competes with the photographs, on an empty screen it is what a room expects. Recommended: keep; `seats` or `code` if a public screen should never name the event.
- **reel-screen `start` now recommends `window`** (no plate: the reel plays in the window at once and a pill asks for the fullscreen press) over the built `frame`, because a stray Escape behind a plate stops and dims the room's reel. Recommended: keep.
- **reel-screen gains `sound`** on the Orchestrator's relay of reel-cut's sound ask (silent as built, a speaker off until pressed, on with the Start press); an ambient bed is left to reel-cut's own ask, since music on a venue screen competes with the room's. Recommended: keep the ask; the board recommends silent.
- **reel-host `pulse` now recommends `band`** (the What needs you band's reel step, told the truth below two, gone at two) over `cover`: the band's "has no reel yet" step goes stale with the stored reel whatever is picked. Recommended: keep.
- **reel-host `open.link` became `open.send`**: the event's own link with the screen posture on, meeting the welcome like any guest (his "send that laptop a link as guest"), instead of a capability token. Recommended: keep.

## System-doc edits (in place, owned facts only)

- none (a lab-only lane)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits, pushed:** `a2395961` (both boards refreshed), `135b4a93` (reel-screen's `sound` ask; the corner code at the guest build's screen proportions), `8b3998e6` (touchpoints.ts back to its own formatting with only this lane's two rows). No sync commit: launch-prep moved (`refresh-guest`, `kit-streamline`) but nothing touched this lane's reads (`gallery-fixtures.ts` unchanged), and `git merge-tree --write-tree 8b3998e6 origin/launch-prep` exits 0 with no conflict.
- **Gates on `8b3998e6`, each its own exit code** (logs in the scratch dir `.../scratchpad/refresh-reel-host/`): `pnpm typecheck` 0 (`final-typecheck.log`); `pnpm lint` 0, no errors, 7 warnings all in files outside the lane (`final-lint.log`); `pnpm test` 0, 4584 passed (`final-test.log`); `scripts/build-lock.sh pnpm build` 0 (`final-build.log`); `lab:smoke --production` 0, 321 checks, reel-screen 499 and reel-host 657 words of 1200 (`final-smoke.log`); `lab:demo --board reel-screen` 0, 3 steps, and `--board reel-host` 0, 8 steps (`final-demo-*.log`).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the two owned board folders, `src/app/(dev)/design/touchpoints.ts` (the listed exception: the reel-screen and reel-host rows only, what each board asks now) and this file.
- **reel-screen, `idle`:** `welcome` (the event's name and day as a title card, the code in the printed sign's words, `STOCK_LINE`) and `seats` (two frames, the photograph there is in one, "One more photo starts the reel", the corner code where the reel keeps it, the empty seat breathing under full motion only) join `code`, `invite` and `stills`.
- **reel-screen, `start`:** `window` (no plate ever; a glass pill at the top asks for the fullscreen press over the playing reel) joins `frame`, `button` and `countdown`.
- **reel-screen, `sound`:** three options on the raised dock at a television's scale; the reel decodes pictures only today (`src/lib/reel/engine/video/window-reader.ts` reads the video track alone).
- **reel-screen, carried:** `look` dropped (the reel round's build fills every mood in landscape); `plate-code` says the guest build's plate hides the code; `after-start` added (the empty screen is drawn after the press; before it a quiet Start sits under its words, as the guest build has it). The corner code now wears the guest build's screen proportions (the ask 2vw, the address 1.25vw), so the raised dock never runs into it.
- **reel-host, `home`:** the view (the host's Play on a screen in its dock), a Reel room (a crumb, the reel playing large, Watch, Play on a screen, mood, hold, Show the reel; `parts-home.tsx`), a Reel sheet over the album with the same controls.
- **reel-host, `progress`:** `preview` (the Reel card lives a photograph early for the host alone, "Only you", "Guests see it at 2") joins the four.
- **reel-host, `pulse`:** drawn on production's dashboard (the title, New event, the real `NextStepBand` with the wedding's review step, the storage line, the real `EventCard`s); `band` and `quiet` join `counts`, `threshold` and `cover`; the question is now what the dashboard says about each event's reel.
- **reel-host, `open`:** `link` became `send` (above).
- **reel-host, drawn as production has it:** the crumb trail (the whole trail at a desk, one step back in a hand), the Live pip, the album as `event-gallery.tsx` draws it (its header verbs and the real `MasonryColumns`, the waiting tile in its `prefix` seat), "Before the first photo" over the launch list, the dashboard bar's bell; the quoted sheet takes the real sheet's `z-50` (the masonry's like marks painted over its panel without it).
- **Both boards' comments:** every reason kept, every authority and provenance line gone ("his ruling", "as he ruled it", "found live, 2026-09-22", "round one's finding"); the carried calls `screen-rec` and `look` went with their premises, `home-drawn` joined reel-host's.
- **Verified:** every reel-host option at the 375 knob and the progress path at 0, 1 and 2 (`m375/`), reel-screen at 1440 and 1920 (`after1/`, `m1440-*.png`, `m1920/`, which the 1440 capture window clips on the right), both board pages at a 375 phone (`page375-*.png`), the boards as they stood before (`before/`); reduced motion emulated in every capture (the Living crossfade holds its first still; the seat's pulse holds lit).
- **Production looked at first** (the recipe's pass): the launch-prep alias's hub, dashboard and cards row in Will's Chrome, whose hidden tab left sheets unpainted, so the settings and share sheets were read in their source; the guest build's screen posture from its lane's captures (`scratchpad/reel-guest-wiring/captures/1440-screen-*.png`).
- **Assets requested from Will:** none.
- **Board ideas:** one line for the code's ask across paper and screen (the printed sign's "Scan to add your photos" against the view's "Scan to add yours"), a `voice-guest` question. · Whatever `pulse` picks, `src/lib/dashboard/next-step.ts`'s reel step ("has no reel yet", into the stored reel's room) is the host wiring's to rewrite or retire.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** the six Questions above; and the carried calls `plate-code`, `one-photo`, `after-start` (reel-screen), `home-drawn`, `host-line` (reel-host).
- **Known and left:** `lab:demo` prints "same picture" for `pulse`'s `counts`, `threshold` and `quiet`, which differ by one text line under a card; each caption names the line.
- **Look at first:** reel-host `home` at 1440 and 375; reel-screen `idle.welcome` and `idle.seats`; reel-screen `start.window`; reel-host `pulse.band` on the real dashboard.
