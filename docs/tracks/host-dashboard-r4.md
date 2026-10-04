---
track: host-dashboard-r4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d1a3a758"            # the launch-prep SHA the branch was cut from
board: host-dashboard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-dashboard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/host-dashboard-r4

**Goal.** host-dashboard round 4: the stage's corner (what leads it: Newest, Upcoming, Last opened, Latest photos) explored again, drawn with the whole lit stage around it, two to four directions each its best version; H6's dashboard details folded in.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**The method this round (Will's two-level rounds, made yours).** He has watched boards improve most when a first pass picks the direction with a full context and a second pass spends a full context on that direction's best version, and drift or overcomplicate past that without his feedback. So:
- **A foreground helper per option (or trait family)**, holding this whole brief and thinking only about its one option; you coordinate, compose and keep the board one voice. Run helpers in the foreground (a background helper's notice never reaches you).
- **One fresh-eyes pass, then stop:** after the drawings, a helper that sees only this brief and your captures answers "of each direction, what is its best version?", and you refine once from it. No third round: Will's feedback is the next one.
- **The budget is stated below** and is not yours to grow.

**Will's answers to host-dashboard r3 (2026-10-04):** events=menu and stage=lit (being wired now by `dashboard-wiring`: draw them as settled); rule=corner, with his note "I'd like to see another exploration of the design of this UI."

**Round 4: the corner, explored again.** We read "this UI" as the stage's corner menu (today a glass pill reading "✦ Newest ▾" at the stage's top right, its popover listing Newest, Upcoming, Last opened and Latest photos, each with the event it would lead with today; shown only past one event), so draw it **with the whole lit stage around it**, so his judgment covers it in place. Say plainly in the board's opening that this is the reading, and that he can say if he meant the dashboard whole. Two to four directions for choosing what leads the stage (the corner refined, and ideas that are not a corner at all), each its best version, at 1440 and 375. Until his pick the stage keeps today's rule (newest leads).
- **Call folded in** (drawn here, never asked elsewhere): H6, the dashboard's details as built: this week holds only dated events, the phrase "in the album", no plan-limit line, and the storage ring on a phone. An ask or a drawn case, whichever reads truer.
- `opening.settled`: events=menu and stage=lit (wired now), the r3 carried calls (kept, default, recent, newest, light) as built. `earlier`: his r3 note. `history`: r4, the corner again.

**Budget:** one helper per direction (two to four), one fresh-eyes pass, one refinement. `desk: 25`.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/host-dashboard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `host-dashboard`, its title, `surface`, `desk: 25` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- Did his "this UI" mean the corner menu or the dashboard whole? Built: the corner menu, drawn on the whole page,
  and the board's opening says the reading and asks him to say if he meant more.
- H6 as an ask or as carried calls? Built: an ask (`details`: all four as built, or one of them the other way, each
  drawn as built beside its other way at a phone), because carried calls show only on the whole board, never in his
  walk, and H6 left the calls lab to be seen.
- Which direction does the board recommend? Built: words (the stage's first words say why its event leads and are
  the control; nothing on the picture). His own pick, the corner refined, is the overrule line.

## System-doc edits (in place, owned facts only)

- none (the lane owns no system doc; the board's facts live in its spec and its files' headers)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits, pushed:** `5ab54c65e` (the board reshaped for round four; round three's retired options removed),
  `18ea459b3` (the three directions, each by its own helper), `f837aa229` (the one refinement, from the fresh-eyes
  pass), **sync `27b97a5d1`** (origin/launch-prep at `e5cad2fb4` merged: dashboard-wiring, hub-strip-wiring and
  camera-clip had landed on the board's reads), `ce77dc1a5` (every frame's stage is production's wired one). The
  manifest commit is the head in the chat line. launch-prep had not moved again at the handoff (`git fetch`, nothing
  in `HEAD..origin/launch-prep`).
- **Gates on the synced tree, `ce77dc1a5`, each on its own exit code** (logs in
  `../partyreel-wt/_scratch/host-dashboard-r4/gate/`): `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (889 files,
  10,753 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3136` 0 (4 checks;
  the board reads 400 words of 1,200); `pnpm lab:demo --board host-dashboard --base http://localhost:3136` 0 (2 steps,
  every option pictured) and again with `--width 375 --state screen=375` 0.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = files under
  `src/app/(dev)/design/sandbox/host-dashboard/` and this manifest. No exceptions.
- **The board, round four** (`spec.ts`): two asks, nothing staged. `chooser`, "How should a host choose what leads
  her stage?": three directions drawn whole on the lit stage at the Screen knob's 1440 or 375, three frames each (Nia
  choosing over her lit wedding; Ari with Latest photos kept, the control on a photograph; Try it on Jo's forty):
  - `corner` (`corner.tsx`): the glass pill says "Lead with Newest"; the house's quick choice (`ResponsiveMenu`: a
    menu under it at a desk, rows rising to the thumb at a phone, nothing past 375's edge); each rule over the face
    of the stage it would draw; the next stage rises in (240 ms) and the word slides (220 ms);
  - `words` (`words.tsx`, `words-say.tsx`), recommended: the stage's first words are the reason and the control
    ("YOUR NEWEST", "LATEST PHOTOS", "IN 2 DAYS"), the house's word-that-is-a-control with a chevron; pressing turns
    the stage into the four rules in its own type, the picture side previewing the pointed rule's event (its plate
    captioned with the event's name);
  - `deck` (`deck.tsx`): four tabs on the stage's top edge in fixed order, rules leading with the same event touching
    as tabs of one card, each card lit by its event, the deck's edges under the band; a press turns the deck (260 ms).
  `details` (H6): All four as built (recommended), or one the other way (undated albums join This week, said
  "Photos Sun, Nov 8"; the count says photos and videos; the head says "1 of 1 event"; the ring beside New event at
  a phone), each drawn as built beside its other way at 375 (Maya's one event, and Lena's week, a new fixture).
- **Every rule says why, in one voice** (`model.ts` `leadWhyOf`, `factOf`, `leadLine`; `chooser.tsx` `LeadProps.leads`):
  the event a rule leads with and the fact it read ("Nia & Alex's Wedding · made yesterday", "· nothing dated
  ahead", "· opened last", "Our Engagement Party · photos Sep 26", Newest's near party "in 2 days"), pinned in
  `model.test.ts` ("why a rule leads").
- **Every frame's stage is production's own** (`stage-copy.tsx`: production's wired `Stage`, lit stage included,
  copied with the round's slots `eyebrow`, `overlay`, `className`, `plateCaption`, `countWord`; `stage-view.tsx`),
  and ranges are production's words through `endDate` (`fixtures.ts`); the board's own lit drawing and range words
  retired, the range test reshaped to production's ("May 1–3, 2026"). Her events stay the board's drawing of
  production's Display menu (`collection.tsx`), because production's keeps each choice through a Server Function a
  frame must never call.
- **The method, inside its budget:** three foreground helpers, one per direction; one fresh-eyes helper that saw only
  the brief and the captures (`../partyreel-wt/_scratch/host-dashboard-r4/fresh/BRIEF.md`, `INDEX.md`); one
  refinement by the lane from its report (every row's fact; the words' reason alone with its chevron, the pointed row
  lit, the preview captioned; the deck's four touching tabs, 13 px at a phone, light-theme edges; the corner's chosen
  row without a keyboard outline on a pointer's open; H6 as before and after).
- **Captures** (`../partyreel-wt/_scratch/host-dashboard-r4/final/`): each direction at 1440 and 375, dark and
  `light/`, Jo after choosing Latest photos (`-chose-photos.3`), the words' pointing state (`words/states/`), and the
  details' five options. The capture script is `../partyreel-wt/_scratch/host-dashboard-r4/cap.mjs` (its own
  headless Chrome, reduced motion, presses and hovers).
- **Assets requested from Will:** none.
- **Board ideas:**
  - Last opened could say when ("opened yesterday") from production's `openedAt` once the chooser is wired; the
    board's trail is an order, so it says "opened last".
  - The fresh-eyes' missing fourth answer, the rule as a row of the Display menu with nothing on the stage, was not
    drawn: round three already asked the off-stage places (Customize, Settings) and he picked the corner.
  - Round three's lit stage lit its lamp once on arriving from Create; production's wired `LampLight` has no ignition
    (a host-moments question).
  - When the pick is wired, production's `Stage` takes the slot its direction needs (an eyebrow for words, an overlay
    for the corner, a wrapper and the band's light for the deck).
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - "This UI" read as the corner menu (the opening says so).
  - The board recommends words over his own corner pick: nothing on the picture, and the stage explains itself.
  - H6 is an ask, not carried calls, so the pictures reach his walk.
  - The words direction turns the stage to choose rather than opening the quick choice under the words (which covered
    the stage's name and read as the corner's popover moved left; its pictures are in
    `../partyreel-wt/_scratch/host-dashboard-r4/caps/words-1/`).
  - The deck's rules that agree are tabs of one card (always four tabs, fixed order), never one merged tab.
  - Round three's losing options (events bar, views and find; stage album, card and guest; rule tabs, head and
    settings) left the board with the round.
- **Look at first:** the `chooser` step at 1440, option 2 (words), frames 1 and 3 (Nia choosing, then press the
  phrase in Try it and point at a rule); then option 1's frame 1; then `details`, option 2 (the week).
