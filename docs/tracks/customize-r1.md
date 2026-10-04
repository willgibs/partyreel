---
track: customize-r1
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "9a5c82fb"            # the launch-prep SHA the branch was cut from
board: customize
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/customize/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/app/event-settings/
  - src/lib/disposable/
  - src/lib/media/limits.ts
  - src/components/app/create-event-wizard.tsx
---

# lp/customize-r1

**Goal.** Will's ask: hosts shape their party their way. Learn how Linear makes deep control feel simple, find every arbitrary assumption a host meets (the camera's roll of 24 first), and draw the board `customize` r1: the roll's control, the pattern for options and account defaults, and the top preferences in it.

## The brief

**The round's direction (Will, standing since round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule.

**Will's ask (2026-10-04), in his words, because the feeling is the point:** "I feel we should allow hosts to customize the disposable shot limit. Some may prefer less, some may prefer more, but 24 seems like an arbitrary shot in the dark on our side. Wouldn't hurt to run a lab exploration to investigate where we've made more arbitrary assumptions, where host customizability UI or additional preferences in settings would enhance the experience. I always hate when I'm using an app and think 'why can't I do it *this* way, their way is brutal'. Exploring agent may be worth learning about Linear, and how their world-class team of designers nailed their app experience with deeply customizable workflows/features that feel insanely intuitively simple. Feels like you're picking up rocket ship control potential, but it all makes sense for a brand new user somehow. That feeling is a huge goal for us."

**Three things, in this order.**

**1. Learn how Linear does it** (their own docs, changelog and design writing, read today; one or two other products only if they teach something Linear does not). How deep control stays simple for a newcomer: opinionated defaults, options met at the point of use, display and view controls that appear where they matter, personal versus team (for us: account versus event) settings, templates, the command menu and keys, what they never make configurable and why. Write it as principles for Partyreel, each with the Linear example that shows it and a link, in your own words (never long quotes): `/Users/gibby/local/ai/partyreel-wt/_scratch/customize/linear.md`.

**2. Find our arbitrary assumptions:** every fixed number or behaviour a host or a guest meets that a real host might reasonably want otherwise. Will's example is the camera's roll of 24 (`events.roll_size` already exists per event, "24 unless a host names fewer"; re-shoots are a flat 3, his word). Read the code, not the docs: the camera and its roll, the develop's default time after the last day, the reel's hold and style, the door's defaults, uploads' per-file cap, what a guest must give at the door, Download's defaults, the album's order and density, the mails a host gets and when, and whatever else you find. Classify each: a host preference worth a control; a better default only; or a constraint that stays fixed (cost, abuse, a one-way door) with its reason in a line. Rank the preferences by how often a host would think "why can't I do it this way". `/Users/gibby/local/ai/partyreel-wt/_scratch/customize/audit.md`.

**3. The board `customize`, round 1:** draw the system that gives a host rocket-ship control while a newcomer sees a simple, finished product, in production's look (identity's wired picks), at 1440 and 375:
- **The roll** (his ask): the shot count in Create and in Settings, its bounds (fewer and more than 24), how a guest's camera reads a roll of 12 or of 36, and what changes for the re-shoots and the develop.
- **The pattern:** where a host meets an option (inline where it acts, a Settings room, a quiet "more" that opens on demand), defaults she can make her own ("use this for my new events": account-level defaults over event-level choices), presets beside fine control.
- **Two or three of the audit's top preferences,** drawn in that pattern, so he judges the pattern on real cases.

Each ask two to four options with your recommendation; delight where it costs nothing in clarity; never dev-tool-ish (a host is not configuring software, she is shaping her party). Cost and abuse stay designed in: a bigger roll costs nothing past the plan's cap and uploads, and anything near a plan's limits is a Question, never a guess (a customization sold as a paid perk is a pricing one-way door: ask).

**Questions to raise** in your manifest with a recommended answer each: the roll's bounds and default; which choices become account defaults; anything that would touch a plan's limits or the pricing table. Lab only: your board's folder and the two notes in scratch.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/customize/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `customize`, its title, `surface`, `desk: 15` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
