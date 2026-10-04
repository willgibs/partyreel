---
track: identity-r4
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
