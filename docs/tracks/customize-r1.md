---
track: customize-r1
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The roll's bounds and default.** Recommended: any count from 1 to 99 (two digits on the camera's count and
  caption), film's 12, 24 and 36 offered at a glance, 24 unless she picks (the middle of film's scale; 27, a shop
  disposable's own count, is the playful alternative). Built as the `roll` ask's recommendation (`both`). Wiring:
  `events_roll_size_range` from 1..24 to 1..99 (a migration), `ROLL_SHOTS` split into a default and a most under
  `roll.test.ts`'s parity, `roll-view.ts`'s `capOf` clamp, `settings-state.tsx`'s values and patch (it reads
  `rollSize` and never writes it) and the update schema in `validation/event.ts`; re-shoots stay roll + 3
  (camera-clip's).
- **Which choices become her usual (account defaults).** Recommended: the album style, the roll's size, the develop's
  hour (a time of day, never a date), the album's order and what guests take home; never a password, a custom link,
  dates, the note or the name. Kept on her account (her own row, a migration), read by Create and by
  `events_reveal_stamp`'s fallback, which today writes 24 back whenever the camera comes on. Built as the `mine` ask's
  recommendation (`offer`).
- **Plan limits and pricing.** Recommended: every customization here free on every plan, none sold as a perk: a bigger
  roll costs nothing past the plan's storage cap and monthly uploads, which already bound every album (Free's 100 MB
  simply fills sooner, said by its own cap line). A paid perk would be a pricing one-way door: his call; this lane
  built none.
- **A Disposable taking photos from the phone's library** (the audit's #7: a camera album takes the camera only).
  Recommended: not now; it changes what a Disposable is (his camera picks), so its own board if he wants it.

## System-doc edits (in place, owned facts only)

- none (a lab-only lane: no production byte changed; the audit's findings wait in `_scratch/customize/audit.md` for
  the lane that wires them)

## Deferred (ROADMAP one-liners, bucket named)

- Now: "Max size per upload" stands only under the Videos switch, unreachable on Free though it caps photos too: its
  own row in What guests can add (customize-r1's audit).
- Now: turning the camera off and back on writes the roll back to 24 (`events_reveal_stamp`'s coalesce): keep her
  size, or her usual once account defaults exist.
- Now: a password's unlock lasts 12 hours (`unlock-token.ts`), so a weekend's guests re-type it twice a day: the
  party's days plus a night.
- Now: the develop's 9 am is the host's browser zone: keep the zone it was picked in beside the time, so a destination
  wedding set from home develops in the party's own morning.
- Speculative: every guest reads a 12-hour clock and en-US dates: the reader's own locale.

## Handoff (replaces the chat report)

- **Commits**: the work `bfcc63e1e` (the board's folder) and this manifest, both pushed to `lp/customize-r1`. No sync:
  launch-prep moved (pricing-wiring, camera-clip's cut, drive-export-r1), but nothing in this lane's reads, its
  imports or this file (`git log e2ef36922..origin/launch-prep --` those paths is empty).
- **Gates** on `bfcc63e1e`'s tree, each its own exit code (logs in `_scratch/customize-r1/`), the first four through
  `build-lock.sh`: `pnpm typecheck` 0 (`gate-typecheck.log`); `pnpm lint` 0 (`gate-lint.log`); `pnpm test` 0, 877
  files and 10,571 tests (`gate-test.log`); `pnpm build` 0 (`gate-build.log`); `pnpm lab:smoke --base
  http://localhost:3133` 0, 6 checks, the board's reading 705 of 1,200 words (`gate-smoke.log`); `pnpm lab:demo
  --board customize --base http://localhost:3133` 0, 4 steps, 0 failing (`gate-demo-375.log`), and again with
  `--state screen=1440`, 4 steps, 0 failing (`gate-demo-1440.log`); every frame saved (`shots4`, `shots5`) and read.
- **Lane check**: `git diff --name-only origin/launch-prep...HEAD` = the twelve files under
  `src/app/(dev)/design/sandbox/customize/` + this file; no exception.
- **Items**:
  - `_scratch/customize/linear.md`: Linear's lessons as twelve principles for Partyreel, each with its Linear example
    and link (the 86 facts behind them, with URLs, in `_scratch/customize-r1/linear-facts.md`).
  - `_scratch/customize/audit.md`: every fixed number or behaviour a host or guest meets, classified (13 preferences
    ranked, better defaults, the fixed with their reasons, pricing apart); its evidence by file and line in
    `_scratch/customize-r1/audit-sweep.md` (120 items).
  - The board `customize` (desk 15, host): `roll`, `home`, `mine` and `order`, every option drawn on production's
    surfaces at 375 and 1440 (Settings with inert writes, Create's room, the camera's parts round a still, the guest's
    cover and rows, the hub, Account); five carried calls (bounds, create, take-home, taken, which).
  - Per the Orchestrator's scoping: no ask about a running camera's moments (Q6, D3) or the re-shoots (a flat 3,
    settled); nothing of host-dashboard's settled answers; `home` is an event's own settings, never a view preference
    (its `album` option is a line of live words on her album), and `order` keeps three options, no guest's own toggle.
- **Assets requested from Will**: none (the marketing stills and the guest ghost pack stand in).
- **Board ideas**:
  - "Tell me when": a host's mail when people wait at a let-in door, photos wait in Review or the album develops, and
    the guests' at a develop; her usual with a per-party follow, custom or off (the audit's #4; the mails first).
  - The cover's photo: "Use as the cover" on a photo's own menu (the audit's #3; event-header's head).
  - Lowering a roll mid-party, a moment for the moments boards: recommended it asks first and ends the rolls already
    past the new size, every shot taken staying; raising adds frames at once.
  - Names on the album and the wall: "Show who took each" (the audit's #8).
  - A fresh roll each day of a range, the need under "more shots" for a weekend (the audit's #9).
- **Proposed migrations / Worker / Vercel / Stripe / env changes**: none this round; wiring the roll's bounds and her
  usual each needs a migration (the first two Questions).
- **Calls his to overrule**: each ask's recommendation (`roll`: both; `home`: words; `mine`: offer; `order`: turns),
  and the five carried calls drawn above the board.
- **Look at first**: `/design/lab/customize?session=customize.roll` at 375 (a guest's camera at 12 and at 36), then
  `customize.home`.
