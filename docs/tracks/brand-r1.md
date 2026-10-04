---
track: brand-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "e8d11584"            # the launch-prep SHA the branch was cut from
board: brand
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/brand/
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
---

# lp/brand-r1

**Goal.** brand round 1, 'what the agency returned': three cohesive brand visions, each a complete system (positioning, wordmark and icon, palette with a status set that never reads as the brand, the aurora's role or another signature, the hashvatar as atmosphere, type, imagery, motion, the marketing pages' dark or light philosophy) applied to six touchpoints as sketches, each by its own agency-team helper; one ask, which vision.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**The method this round (Will's two-level rounds, made yours).** He has watched boards improve most when a first pass picks the direction with a full context and a second pass spends a full context on that direction's best version, and drift or overcomplicate past that without his feedback. So:
- **A foreground helper per option (or trait family)**, holding this whole brief and thinking only about its one option; you coordinate, compose and keep the board one voice. Run helpers in the foreground (a background helper's notice never reaches you).
- **One fresh-eyes pass, then stop:** after the drawings, a helper that sees only this brief and your captures answers "of each direction, what is its best version?", and you refine once from it. No third round: Will's feedback is the next one.
- **The budget is stated below** and is not yours to grow.

**Will's note (2026-10-04), in his words, because the wording is the point:** "for dashboards, pages, or screens with no media (empty state or non-media screen), the hashvatar avatar does an incredible job at adding a beautiful, minimal visual that stays a bit subtle while avoiding a fully achromatic screen. The reason I mentioned the current warning color is bland is 2 fold: first, it's a bit dull as a warning color itself. second, as the most common app color besides the hashvatar avatar, it almost presents as a brand color, and an incredible boring one at that. we should not present with that warning color feeling like our brand color, and could likely improve the status color on their own as well. the aurora is meant to be the foundation of our brand visual identity to pair off of the media-forwardness (never fights the media, only accentuates it, or can create atmospheric experience where no media exists). however, it's implementation has felt a bit half-baked so far. we started designing with it, then it was pretty cool so we found some ways to use it, but partyreel still has no real brand visual identity yet as a whole, nor does it feel truly infused into the platform across marketing and app. two or more explorations would be huge here around these ideas, your call on how: brand identity workshop (if we hired a $60k branding agency, what would they return? our logo is barely v1, no icon, and everything else is just what we've come up with so far - let's pretend a dedicated agency returned cohesive, bespoke visions, within our ideas and otherwise), aurora infusion (...), marketing page themes (...) ... take everything i've said, zoom out a little, and find what's highest leverage to solve this. can be paced in lab as needed, rather than all rushed at once. don't want decision conflicts if earlier selections shape later. more focused per round, solving optimally everywhere per step."

**This board is the first, highest step: brand r1, "what the agency returned."** Its answer shapes everything after it (the hero, the marketing pages' themes, the status colors, the aurora's role, the faces of presence, the icon), so those are drawn only after his pick, each on its own focused board. Here: **three cohesive brand visions**, each made by its own "agency team" helper with a full context, presented like an agency's deck, then a creative director's fresh-eyes pass, one refinement, stop.

**Each vision is a complete system:**
- positioning and personality in a few lines;
- a wordmark and an app icon, drawn as SVG (today's `src/components/shared/logo.tsx` is a v1 and there is no icon);
- the palette: an achromatic base and its signature color source, plus a status set (waiting, success, error) that never reads as the brand, shown beside the signature so that is seen, not claimed;
- the aurora's role (today scattered across `globals.css`, Create's room, the album feature page; the aurora strip around the floating upload button is the touch he liked), or the vision's own alternative signature;
- the hashvatar (`src/lib/avatar/gradient.ts`, the seeded mesh) as the atmosphere of screens without media;
- type, imagery and motion principles;
- the marketing pages' dark or light philosophy (his direction: each page fully dark or fully light, never forced black and white chapters; cinema, ink and display fight each other today).

**Each vision applied to about six touchpoints, as sketches captioned "to judge the system, not the design"** (the applied boards come later and must not be drawn here early): the home hero, a dark marketing page, a light page, the hub's empty state, the QR or share card, the icon on a phone's home screen. Real photographs on every one (the fixtures in `/Users/gibby/local/ai/partyreel-test-media/`): the media rule ("never fights the media, only accentuates it") is the one constraint he restated, and the creative director's pass judges each vision against it.

**Range:** at least one vision grows from our own ideas (the aurora, an achromatic base, media-forward); at least one goes elsewhere entirely. Never three variations of one idea.

**What every vision inherits** from the boards Will answers before this one (it may argue against any only in its note): achromatic chrome with no brand hue; the light edge at the reach he picks; the five house lamps as light (`globals.css` `--lamp-1..5`, re-keyable, never removed); the hashvatar as the atmosphere of screens without media; identity's atoms (their form: identity r4 is choosing it now).

**One ask:** which vision, with a note for what to carry from the others. Big presentation pages per vision, read at 1440 and on a phone. An asset the visions need and we lack becomes an asset ask naming its slot and its theme (dark or light), for the Higgsfield month (`docs/ASSETS.md` is the Orchestrator's: list them in your Handoff).

Create the board with `pnpm new-board brand "The brand" --surface shared --desk 5` (it sits above every board its answer shapes).

**Budget:** three agency-team helpers (each may split into its system and its applications if the work asks), one creative director's pass, one refinement.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/brand/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `brand`, its title, `surface`, `desk: 5` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
