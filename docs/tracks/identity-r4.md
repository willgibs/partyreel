---
track: identity-r4
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e8d11584"            # the launch-prep SHA the branch was cut from
board: identity
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/identity-r4

**Goal.** identity round 4: Will's mix of the three systems as seven quick trait asks (field, button, focus, selected, press, loading, toggles), each drawn on real screens wearing the picks before it, his leanings recommended (keys and wells, never the viewfinder focus, a lighter selection); the edge on nine real screens; calls A1 to A4 and H3 folded in; form only, never hue.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**The method this round (Will's two-level rounds, made yours).** He has watched boards improve most when a first pass picks the direction with a full context and a second pass spends a full context on that direction's best version, and drift or overcomplicate past that without his feedback. So:
- **A foreground helper per option (or trait family)**, holding this whole brief and thinking only about its one option; you coordinate, compose and keep the board one voice. Run helpers in the foreground (a background helper's notice never reaches you).
- **One fresh-eyes pass, then stop:** after the drawings, a helper that sees only this brief and your captures answers "of each direction, what is its best version?", and you refine once from it. No third round: Will's feedback is the next one.
- **The budget is stated below** and is not yours to grow.

**Will's answers to identity r3 (2026-10-04), in his words, because the wording is the point:**
- system=? "Honestly, I love parts of all of these. A configurator may be best here (and maybe other parts of lab), where I can mix and match across and tweak finely, rather than choose one option, when in reality, each option may have some winning traits and a meshed option would win. However, let's not overuse configurator - most of the time you do a perfect job of enough good directions and recommend a winning solution that we don't need to break down fine configs, but lots of fine options across these here that really define our platform. For example, keys and wells is my favorite foundation, but far from sold on the viewfinder focus (don't like it right now), tend to like a lighter surface for active selection items, etc."
- room=graphite (being wired now by `graphite-wiring`: draw it as settled).
- edge=? "Could you give me more real UI to see examples of each? The host menu gives me exactly one instance to compare against, which feels incomplete for something that sets a foundation like this."

**Round 4 is the mix, as seven quick asks, plus the edge.** No new lab machinery (the Advisor's Q29): the lab already composes asks, since every option's state is `{ [ask]: option }` and previews read the whole state, and a step is drawn wearing the picks already made. So the "configurator" is this board's own walk: seven trait asks, each drawn on the mix picked so far, any step revisitable, and his paste reads `field=well; button=key; focus=…` in the grammar `lab:review` already reads.
- **field:** well (keys: `--muted` fill, a shaded top inside edge, r9), ring (rings: a 1.5 px ring, r12), tone (ink: a tone fill, no line, r12). Recommended: well.
- **button:** key (bevelled, sinks on press), pill (rings), ink (ink's tone family). Recommended: key.
- **focus:** never the viewfinder's corners as a recommendation (he doesn't like them): rings' closing outline, ink's cursor, and two new marks you draw this round (a quiet halo of light, a lift, or better); the corners stay only as an option labelled "the r3 mark" so the fallback is there. Recommend the best of the new.
- **selected:** keys' raised lighter key on the well, an ink pill, a tone frame, and a still lighter step. Recommended from his note: a lighter surface.
- **press:** sink, shrink, blink. **loading:** breathing dots, an arc, a track filling. **toggles:** the three families (wells filling with ink; circles; tone to ink). Recommend each as the mix wants it.
- Every trait's options are drawn on real screens, never specimens alone: Settings' panel over the hub, Create's steps, the Add sheet, the door's steps, Account. Each step wears the earlier picks.
- **edge** (media, floating, every; recommended floating): each option on nine real screens, in paper and the room (graphite): the dashboard's Display popover, Settings' panel over the hub, the Add sheet, a delete confirm, toasts during uploads, the door's held sheet, the reel's Style menu, the account menu, a tooltip.
- **Calls folded in** (from his calls lab; each is a case on these screens or an ask here, never asked anywhere else): A1, the corner scale (panels 8 px, photos 2 px; counts and times at the 12 px label size); A2, a toast's lit glyph and the live mark's slow breath (or a steady light); A3, a dialog's half-black veil (heavy on paper?); A4, the dashboard's two teaser cards and the hand-made cards' thin outline; H3, Settings' date range as two fields joined by "to" (no range picker): a field case for `field`.
- **Form, never hue.** A brand round comes after this one (brand r1, drawn in parallel) and owns color: draw in today's achromatic chrome, the status lights as they are.
- `opening.settled`: voice=camera, layers=display, status=lights (wired since r2), room=graphite (wired now). `earlier`: his r3 notes above. `history`: r4, the mix. Retire r3's `system` and `edge` asks into this round's asks (the ledger keeps r3).

**Budget:** three helpers (focus marks; selection and press with toggles; the edge on the nine screens), one fresh-eyes pass, one refinement. The desk place stays `desk: 10`.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/identity/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `identity`, its title, `surface`, `desk: 10` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and is Will's to overrule; none is a one-way door.

- **Is the configurator the board's own walk, or new lab machinery?** Built: the walk (the Advisor's Q29). Seven trait
  asks (field, button, focus, selected, press, loading, toggles) and the edge, none staged behind another (`after`):
  each is drawn wearing every answer already decided (this sitting's store over the ledger's, `step.tsx`'s `wearing`)
  and an undecided one as its recommendation (`model.ts` `choiceOf`), so he composes the mix as he walks and can go
  back to any step. `lab:review --dry` reads `review identity r4: field=well; button=key; focus=halo; ...;
  call:veil=no` (all nine recorded, dry). Overrule: stage each trait behind the one before it.
- **Where does a trait open?** Built: on its own screen, caught in its moment (field: Settings' dates, the end being
  typed; button: Account; focus: the guest's door, the password in focus; selected: Settings' door; press: Create's
  Continue held; loading: the door's Unlock working; toggles: Account's preferences), at 375 with paper beside the
  room (two phones stand at the scale one does on a desk's step: `whole.ts`). The other four screens, the two
  every-state sheets and 1440 are one press away (Show, Screen, Ground). Overrule: open every trait on one screen.
- **The second new focus mark.** Built: `lit` (its own edge catches the light from above, a keyline of ink inside; a
  field lights up under it) in the slot the brief named "a lift", whose rise and shadow could not carry 3:1 without a
  ring and read as chosen on a raised segment (the focus helper's L1 and L2). Recommended: halo, whose paper bloom is
  a soft grey aura, which is what parts it from the outline (the fresh-eyes pass found the two one answer on paper
  with a white bloom). Overrule: draw a lift after all.
- **A press drawn beside its key at rest.** Built: the press step draws each ground as a pair, the key at rest and
  held (`moment=rest`), since a still shows a 1px travel or a 96% give only against the instant before it.
- **A3, the veil.** Taken other than as built: half-black in the room, a quarter on paper, where half read heavy (the
  fresh-eyes pass measured the page from 245 to 123); drawn so on every frame (`sheet/calls.ts`), so if he does not
  push back the wiring makes `floatingScrim` per ground. Overrule: half-black on both grounds, as built.
- **A4's teaser has no page with a Display menu on it** (the empty-events teaser renders only for a host with no
  events; the slim one lives on her profile's private sections now), so the edge's Lit knob carries a tenth place, a
  new host's dashboard, where `hand-cards` is seen; the edge lights it in no option.
- **Fields keep their own size.** Built: the field trait sets a 40px floor, never a height, a type size or a right
  padding (r3's sheet forced 40px and 14px type, which shrank the door's 44px field, would let iOS zoom a phone on
  focus, and ran the door's text under its eye). A key standing beside a field takes the field's height.
- **Create's name is not a field atom.** Built: the scene hands it no field slot (`scene/adopt.ts`; create-wizard's
  `asks=one` drew it as the name at its size on a rule); Create carries the keys, the close and its four looks
  (adopted as `swatch` atoms, which `selected` dresses).
- **The edge's `every` reaches paper.** Built: on paper the dark surfaces are photographs and ink keys, lit in white,
  and every dark key's top light turns up in the room (production lights media on dark grounds alone because its
  light is the foreground, ink on paper); without it `every` and `floating` drew one picture on the Display, the
  Add, the Style menu and paper (`lab:demo` warned "same picture" on the dashboard until then). Settings' place and
  the tooltip are drawn at a laptop whatever the width (Settings in a hand is a whole screen with no layer; a tap
  opens no tooltip).
- **Graphite drawn here until `graphite-wiring` lands** (`sheet/room.ts`: the room's `--display*` one step up, the
  edge's light two fifths); the sheet leaves once production wears it.

## System-doc edits (in place, owned facts only)

- none (the lane owns the board's folder alone; what it learned of production is in Deferred and the board ideas)

## Deferred (ROADMAP one-liners, bucket named)

- Design: Chrome draws an `outline` or a border width in whole CSS pixels (1.5px is drawn 1px at every device scale,
  measured by the focus helper); a 1.5px line in production is a box-shadow spread.
- Design: globals.css's bright edge (`[data-lit]`) draws its pixel on a padding ring that rounds to nothing under
  about half scale (a page zoomed out, the lab's laptop steps); a 1px transparent border under the same mask holds at
  every scale (identity board, `sheet/edge.ts`'s `ON`).
- Design: the live reel dock's Style and Hold keys never show their open fill (`data-state="closed"` with
  `aria-expanded="true"` while the menu is open); the Style menu's "Set for everyone" is a hand-drawn pill row, not
  the key atom.
- Design: the Display menu's group names (LAYOUT, ORDER, SHOW, GROUP, COVERS) and the door's "ALMOST IN" are spaced
  capitals outside the camera voice's counts, live and times.
- Design: Settings' date range at a phone: its two rows share no gutter (the end indented by "to", the × outside).
- Design: the door's password panel inside a chosen gate reads `--background`, so a lit chosen card (identity's
  raised or lighter) needs it on the card's own ground.
- Design: the account menu's "Plan and storage · Event Pass" wraps to two lines at both widths.

## Handoff (replaces the chat report)

- **Commits**, pushed to `origin/lp/identity-r4`: `29bbb8572` (the mix as seven traits, the edge on ten screens, the
  three helpers' first passes), `853dae330` (the one refinement from the fresh-eyes pass), the sync `d4e001c5a`
  (launch-prep at `18b6bb784`: dashboard-wiring's Display menu and hub-strip-wiring landed, and the board mounts both),
  `d9654688d` (the dashboard's place on production's own Display menu); this manifest's commit is the chat line's head.
- **Gates on `d9654688d`** (the synced tree), each on its own exit code, logs in
  `../partyreel-wt/_scratch/identity-r4/gate-*.log`: typecheck 0; lint 0 (no warnings); test 0 (889 files, 10,756
  tests); `build-lock.sh pnpm build` 0; `lab:smoke --base http://localhost:3132` 0 (10 checks, the board at 1,125
  words of its 1,200); `lab:demo --board identity` 0 at 1440 and with `--width 375` (8 steps, 0 failing, no "same
  picture"; every step 1.0 to 1.1 screens, the stage 0.30 down at a desk and 0.35 at a phone).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): only `src/app/(dev)/design/sandbox/identity/`
  and this file; no exception.
- **The items:**
  - `spec.ts`: round 4, eight asks (field, button, focus, selected, press, loading, toggles, edge) with the whole
    context layer, his r3 words in `earlier`, the settled lines (camera, display, lights wired; graphite as picked),
    eleven terms, nine carried calls (r3's four kept; A1 `corner-scale`, A2 `toast-light`, A3 `veil`, A4
    `hand-cards`, H3 `dates`); r3's `system` and `room` retired into the traits and the settled lines.
  - `sheet/`: one stylesheet per option, composed by registered layer variables (`--i-focus`, `--i-sel`,
    `--i-press`, `--i-body`, the travel and the scale) so no trait overwrites another; r3's whole-system and settled
    sheets deleted (production wears the voice, the display and the lights); `room.ts` graphite; `calls.ts` the veil
    as taken.
  - `views/`: Create's steps as a real screen (production's wizard, a stand-in create); every screen caught in the
    asked trait's moment (`pins.ts`), a press beside its rest; the edge's places on production's own: the
    dashboard's events section and Display menu, the hub (cover with its new strip, rooms, bulk bar) under a delete
    confirm, toasts and a tooltip, the reel's Style menu, a new host's dashboard.
  - `identity.test.ts`: the spec, the sheets and the recommendations one set of ids; the sheets name atoms only; the
    corners only in the r3 mark and never working; every focus option one mark on every control; no trait draws an
    atom's shadow, travel or scale outright.
- **Assets requested from Will:** none.
- **Board ideas:**
  - The bright edge's padding-ring technique fails under half scale everywhere it is worn (the photographs at a
    zoomed-out desk); a one-line fix in globals.css, drawn and measured here.
  - A `swatch` atom (a picture chosen among pictures: Create's looks, the reel's moods, the code's styles) that
    wears the selected trait, instead of each picker drawing its own ring.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule** (each a Question above or a carried call on the board): the walk as the configurator; each
  trait on its own screen at 375; `lit` in the lift's slot; a press beside its rest; the veil a quarter on paper; a
  new host's dashboard as A4's place; fields' 40px floor; Create's name out of the field atom; `every` reaching paper
  and dark keys; graphite drawn in the board; the carried calls `one-focus-mark`, `head-atoms`, `field-height`,
  `in-use`, `corner-scale`, `toast-light`, `veil`, `hand-cards`, `dates`.
- **Look at first:** the field step (Settings' dates on paper beside the room: the well's recess against the ring and
  the tone), then focus (the door: halo against outline on paper, where the aura parts them), then the edge on the
  dashboard's Display and the account menu (Lit), in the room.
