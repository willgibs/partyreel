---
track: event-header
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "26743369"            # the launch-prep SHA the branch was cut from
board: event-header
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/event-header/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/components/app/share/
  - src/components/app/event-feed/event-cards-row.tsx
  - src/components/shared/crumbs.tsx
  - src/components/guest/event-experience.tsx
  - src/components/guest/guest-header.tsx
  - src/components/guest/guest-action-dock.tsx
  - src/components/guest/guest-share.tsx
  - docs/systems/host-app.md
  - docs/systems/guest-flow.md
---

# lp/event-header

**Goal.** Open the event headers' redesign board: the host hub's head and the guest album's head reconceived as bespoke, polished heads, drawn from the production tonight's wirings leave.

## The brief

**Why.** Will, on `event-ready`'s `door` (answered `mark`, wired tonight), verbatim:

> I think the mark keeps the header from getting too crowded with text where icons will likely work 99% of the time, and we could add tooltips to clarify on the mark. As a broader note, I'd like to explore redesigning the event headers for both hosts and guests entirely. Similar to the host dashboard, we're getting much closer to the final feature set, so we can be more confident in more bespoke polished design now.

**The heads today:**
- **The host hub** (`dashboard/[eventId]/page.tsx`, the head region):
  - the shell's crumbs;
  - the scannable code, with tonight's corner mark;
  - the title and its detail row (date, count, guests, views, Live);
  - the link row;
  - since tonight, the readiness checklist at the head until done;
  - below it, the room row (Review, Highlight reel, Guests, Settings), sticky on scroll.
- **The guest album** (`event-experience.tsx`'s head and actions, `guest-header.tsx`, `guest-action-dock.tsx`):
  - the title, "Hosted by", the counts and the description;
  - a full-width Add photos button, Invite, and a dock once they scroll away.

**Asks, yours to shape:**
- `host`: the hub's head.
- `guest`: the album's head.
- Whether the two share one grammar.

The door's reveal (`locked-door` r3) ends on the album's head, so read its brief for the moment it hands to.

**The direction, one for every board this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential,** with the disposable-mode boards' creativity as the bar. On those boards: "These are so much cooler than the current host dashboard, standard event pages for both host and guest, and other areas of our app. Really creates a bespoke, experiential feeling. Going off my previous notes about wanting to redesign most of our app and especially breaking away from the shadcn generic AI build feel, this is the kind of creativity I like to see."
- **Sleek and modern,** never vintage ("our far more modern app design, which is only getting sleeker as we iterate").
- **Sophisticated, never playful-messy:** "for grids, I'd prefer not to get messy and begin tilting anything, the slight rotation may make us feel too playful for more sophisticated events".
- **Minimal yet high-information,** with far less text ("Many parts could be reshaped into more minimal yet high-info-conveyance UI, very text heavy right now").
- **The bible's ten** (`/design/library`): media is the color, premium is the floor, elegant simplicity.
- **His role:** "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Draw your boldest real contenders, as far apart as the real answers are.

**Who asks what tonight, so no two boards ask one decision:**
- `identity` owns the atoms: buttons, fields, chips, cards, sheets, menus, toasts, tooltips, avatars, and the controls' materials, type and motion.
- `host-dashboard` owns the dashboard page.
- `event-header` owns the hub's head and the guest album's head.
- `create-wizard` owns the create wizard.
- `locked-door` r3 owns the door's reveal and idle loops.
- `disposable-mode` r3 owns the disposable camera, its waiting room and its save.
- `demo-framing` r3 owns the home hero's stage and the demo's door.

A page board draws composition, layout, hierarchy and its page's own expression in production's atoms. It names any new atom an option needs, and spends no option on a button's style.

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/event-header/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `event-header`, its title, `surface`, `desk: 50` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` (it crawls what your change reaches, the board and the desk; `--all` for the whole lab); `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Is "whether the two share one grammar" an ask of its own?** Recommended and built: no. It is `host`'s option "The
  album's head, hers", drawn in whatever head he picks for `guest` (`guest` declares no `today`, so before he answers it
  draws in the recommendation), so picking it is the one grammar and the board never asks it twice: a separate ask
  would draw one picture under two names whenever his two picks match.
- **Where does the Highlight reel live under a new head?** Recommended and built: inside the head (the cover's living
  stills and its play, the door's view and its play, the name's numeral); the reel's tile above the album goes
  (carried `reel`).
- **Words or glyphs for the counts?** Recommended and built: glyphs, their words on hover and a tap, from his mark note;
  today keeps its words; at a phone the cover leaves the counts to the album's own label right under it (carried
  `glyphs`).
- **Is the guest's header part of the head?** Recommended and built: yes; over the cover it stands on the photograph
  in white with no rule; elsewhere it is today's (carried `header`).
- **What does a cover show?** Recommended and built: the reel's own opening stills (the server's pick, `readHubReel`:
  who uploaded, how liked), dissolving on the living clock; never simply the newest upload; an empty album shows the
  house light, warm. A cover Maya pins herself would be a new column (a board idea below), not drawn.
- **The new atoms the options need (identity's to style, named here as the brief asks):** photo-filled type (the name's
  letters as windows onto the reel, `.eh-photo-type`, a wash per theme, ink where colours are forced); the shutter (one
  round Add ringed in the album's light, the ring its progress while hers send); a white primary and glass rounds on a
  photograph (the cover); the code chip (the code's glyph on its white mat where a scannable code has no room, since
  `StyledQr` refuses a code under the module floor); the number door (a numeral that opens its room).

## System-doc edits (in place, owned facts only)

- none (an exploration: production is unchanged, so `guest-flow.md` and `host-app.md` still say what is true)

## Deferred (ROADMAP one-liners, bucket named)

- none

## Handoff (replaces the chat report)

- **Commits, pushed:** `a27cc7fb` (the board drawn), `040f6b42` (the arrivals and their Replay, the photo-filled name on
  both sides, the album's light from its source, the shared head's face in the stuck row), `6953926f` (the empty
  states), then this manifest. No sync: launch-prep moved past the base `e4e04eb0` (crumbs-47, host-dashboard, demo-r3
  and create-wizard merged, and records), touching no file this board imports; `guest-flow.md`, a read, took crumbs-47's
  Back and flip facts, which no drawing here shows, so PROGRAM's Sync rule does not call for one.
- **Gates on `6953926f`'s tree, each on its own exit code:** `pnpm typecheck` 0; `pnpm lint` 0; `pnpm test` 0 (745
  files, 8,832 tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3135` 0 (5
  checks, the board at 607 of 1,200 words); `pnpm lab:demo --board event-header --base http://localhost:3135` 0 (3 steps,
  every option drawn, both screens' reach held), again 0 with `--width 375`, and again 0 wearing `--state
  guest-screen=1440 --state album=empty --state host-screen=375 --state moment=before`.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the 10 files under
  `src/app/(dev)/design/sandbox/event-header/` + this file. No exceptions.
- **The board `event-header`** (surface shared, desk 50, round 1): three asks, `guest` the root, `host` and `stays`
  waiting on it and drawn in his pick. Every option is two real frames (as Priya lands and scrolled into the album; as
  Maya opens her hub and scrolled), with the Screen knobs (a guest's 375 first, a host's 1440 first), The album (214
  photos, or empty for the first guest) and The moment (tonight, or the week before with the checklist at the head).
  His `door=mark` note is quoted in `opening.earlier`. The party is Maya and Jay's, the door boards' wedding, so the
  door's reveal lands on this album.
- **`guest`:** today's head · the cover (recommended: the reel's own stills dissolving edge to edge under the name, Add
  photos white on them, the reel and Invite in glass beside it) · the doorway, left open (the door she walked through as
  the album's emblem, the newest photos through it, its light coming from it) · the name, filled with the party (the
  name set as large as the column takes, its letters windows onto the reel's stills, the counts as numerals).
- **`host`:** today's head · the album's head, hers (recommended: his guest pick worn by the hub; under the cover, the
  code on its white mat in the cover's corner like the room's screen, the room cards under it, the cover's still
  carried into the stuck row) · the numbers are the doors (one band: the code, the name, five live numbers that open
  their rooms, the room cards gone) · the album first (one slim sticky line, a code chip and the rooms as pills).
- **`stays`:** the dock, as today (production's `GuestActionDock`) · one shutter (recommended) · the head as a bar at the
  top.
- **The arrival:** Replay the arrival, in the board's dock and every step's stage head, remounts the frames: the cover's
  still settles from a step closer, the door lands in the head's corner from mid-screen, the name's letters rise out of
  a blur, the words rise in order as production's reveal raises its header, the hub fades up, and what stays arrives as
  the head leaves. Under reduced motion every head stands whole and still (`event-header.css`).
- **Captions are read off the frames** (`scene.tsx`, `measureHead`): where the album's first photo lands and what share
  of the screen that is, the head's words, where the primary sits and its height, the code's size, what stays and its
  height.
- **Production's own pieces in the frames:** `AppShell`, `NotificationBell`, `UserMenu`, `EventShareProvider`,
  `EventCodeDoor`, `EventLinkRow`, `ReelCard`, the room cards' shell (`room-card.ts`), `EventChecklist`,
  `FeedSectionHeader`, `FeedSectionEmpty`, `GuestActionDock`, `PosterCard`, `Doorway`, `LivingStills`,
  `GalleryEmptyState`, `GhostRiver`, `StyledQr`; the rest is quoted from them in their own order and words.
- **Assets requested from Will:** none (the bootstrap stills at crops; production's cover is the album's own photos).
- **Board ideas:** host-dashboard's `purpose=stage` (an event on a stage of its own photographs) and this board's
  `host=shared` under the cover are one object: the stage could open into the hub with the same cover, one picture from
  the dashboard to the hub · locked-door r3's reveal lands on whichever head `guest` picks: under the cover the open
  door's view grows into the cover, under the doorway the door itself lands in the head's corner (this board's arrival),
  so one wiring lane can take both picks · a cover Maya pins herself (a column on `events`, a migration), the reel's pick
  standing until she does · identity's redressed hub head (one of its three screens) is today's composition, so its
  pick and this board's meet at one wiring.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none (a pinned cover, a board idea, would be one).
- **Calls his to overrule:** the three carried on the board (`spec.ts` `carried`): the reel inside the head, glyphs over
  words, the guest's header as part of the head; the grammar folded into `host`; the cover leading with the reel's
  stills; and each ask's recommendation: `guest=cover`, `host=shared`, `stays=shutter`.
- **Look at first:** `/design/lab/event-header?session=event-header.guest`, the cover at 375, then Replay the arrival;
  then The album's "Empty, the first guest"; then the doorway at 1440 (the light from the door); then `host`, the
  album's head, hers, at 1440 (Maya's code in the cover's corner).
