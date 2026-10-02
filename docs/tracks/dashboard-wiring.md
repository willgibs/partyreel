---
track: dashboard-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "7a875407"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/page
  - src/app/(app)/dashboard/loading
  - src/components/app/dashboard/
  - src/lib/dashboard/
  - src/components/app/event-card
  - src/lib/db/queries/event-card
  - src/lib/db/queries/pulse
  - src/lib/db/queries/dashboard
  - src/components/app/notification-bell
  - src/lib/notifications/build
  - docs/systems/dashboard.md
  - docs/systems/notifications-analytics-growth.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/host-dashboard.json
  - src/app/(dev)/design/sandbox/host-dashboard/
  - src/lib/events/readiness.ts
  - docs/systems/host-app.md
---

# lp/dashboard-wiring

**Goal.** Wire host-dashboard's picks into production: the party of the moment leads on a stage of its own photographs, this week's parties say their one step, a live party's photographs land on the stage, and the events below are grouped by when; the board's four carried calls taken.

## The brief

**Why.** Will answered `host-dashboard` r1 on 2026-10-02 (`docs/reviews/host-dashboard.json`). The drawings and their tested rules are `src/app/(dev)/design/sandbox/host-dashboard/` (`model.ts`, `dashboard.tsx`; read only: its r2 lane is cut after you merge). His words, verbatim:
- `purpose=stage`: "This is by far my favorite due to the fact that in 1 event dashboards (which every user will experience creating their first and only event, until adding more), the experience feels much more alive that expecting many more events to populate. For example, if I'm getting Partyreel for my wedding, I'm likely to only have that one event for a while (maybe ever), and this makes the host dashboard experience much more engaging on that 1 event. We'll have to decide which one gets featured in different cases, such as no dates on multiple events."
- `needs=week`: "This stacks amazingly with the featured event. Loving the new UI over our previous simple gallery cards, which felt generic and bland."
- `events=seasons`: "This feels like something a host may have custom preferences on (such as filter, sort, gallery vs table/list, etc). Ideally it's a bit customizable, so in a layout with 40 events as you presented, the host isn't always having to scroll to the very bottom if they're trying to bounce between old events back-to-back (like saving old photos from old events). That's where this stacked organization becomes more cumbersome, where it actually impedes quicker access sometimes. Likely worth a second round of ideas. Best selection is likely some Frankenstein across all three, but if that fails, we can always revert back to an option here."
- `arrivals=live`: "I didn't really like the 'Just arrived' strip on the last dashboard, so if we simple display the featured event with that type of gallery preview to see what's happening, think that's a perfect direction for including that idea. Doesn't need its own section for sure."

**What to build.**
- **The stage**: the party of the moment leads, drawn from its own photographs: the one on its day, else the nearest within a month, else the next coming. When none is dated or near, my working rule (his "which one gets featured" is r2's question): the event with the latest activity, else the newest made. Say the rule in your Questions with what you saw.
- **This week** (`needs=week`): every party within a week of its date, before or after, each with its one step or its Ready; older queues stay in the bell, so forty events never stack forty steps. This retires the ROADMAP's "Uploads are paused on X" line for parties long over.
- **The live wall** (`arrivals=live`): on a party's own day its newest photographs land on the stage as they arrive; every other day nothing; Just arrived goes.
- **Seasons** (`events=seasons`) as the working events section (r2 explores the customizable collection he describes): coming up, just past, earlier this year, then each year folded into a line, the freshest drawn largest.
- **The carried calls, taken:** `head` (the day, then the storage ring and New event in one slim row; the Dashboard title and the full-width storage line go), `tile` (its photograph, or its date before it has one, its name and when, at most a mark in each top corner; the QR chip and the pills move off), `finished` (a party long over speaks only when someone waits at its door or in its queue), `busier` (on a shared night the busier leads: people waiting first, then photographs landing).
- Readiness is production's one function (`src/lib/events/readiness.ts`); the bell keeps its words for a queue; the grace banner, the claims review and the page invite keep their places; New event stays live at the cap.

**Boundaries.**
- A cover rule (a sealed disposable album's included, from a parallel lane) lives in `event_covers` and the queries, never in `event-card.tsx`, which also draws a profile's public cards.
- A new read goes in a new file under `src/lib/db/queries/dashboard*`; `src/lib/db/queries/events.ts` and `src/components/app/living-stills.tsx` are shared and stay as they are.
- The hub (`[eventId]/`) is `header-wiring`'s; Create is `create-wizard`'s board.
- System docs: `dashboard.md` (moved out of host-app.md today; three comments in your files still point at host-app.md for it), `notifications-analytics-growth.md` for the bell.

**The direction, one for every board and wiring this round** (Will's notes, 2026-10-02):
- **Bespoke and experiential**, sleek and modern (never vintage), sophisticated (never playful-messy: "for grids, I'd prefer not to get messy and begin tilting anything"), minimal yet high-information with far less text, and the bible's ten (`/design/library`: media is the color, premium is the floor).
- **Who it is for**, his words with this desk: "Want to ensure we feel bespoke without getting too dev-tool-ish, remaining a modern consumer app usable for anyone at any event (it's okay if grandma and grandad slip through, would rather frame this as cool to a younger expected host/guest crowd, probably 18 [parties] to 50ish [event guests, conference attendees). Don't want to build a boring app just for the least tech-friendly guests. Seems like our core entry -> upload -> view path is pretty clear for anyone."
- **His role**: "I'm just the tastemaker at this point - let's act accordingly, drive your best ideas across our site/app/platform as the world's leading design engineer." Build and draw your boldest real answer; he picks and steers.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:3132`; the dashboard read in a headless Chrome of your own at 1440 and 375 for a host with one event and with many (a week before, on the night, the morning after, a year on), reduced motion honoured; signed-in steps localhost cannot drive are named for build 43's red-team.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Which event leads when none is dated or near** (his "which one gets featured"; the working rule, with what I saw).
  Create asks no date (the wizard has no date field; the date is Settings' welcome), so "no dates on multiple events"
  is every new host's case, not an edge. Built: an event's day is its host's date, else the viewer's day of its newest
  approved upload (`src/lib/dashboard/when.ts`, `dayOf`); the stage leads with the one on its day (a dated party
  first, then an undated album landing today; of two, the busier), else the nearest within 30 days by its day (a day
  behind weighs a day and a half ahead), else the next coming, else the latest activity, else the newest made
  (`moment.ts`, pinned in `moment.test.ts`). Recommended: keep as the working rule; r2 may add a host's own "feature
  this one" if he wants the choice in hand.
- **An undated album is live on a day its photographs land, and grouped by when they last landed.** Built: "Live
  today · N in the last hour" and the live wall for an undated album taking photographs today (never "tonight": its day
  is evidence, not a date); its tile says No date; it sits under Just past or in its year by its photographs; an undated
  empty album waits under Coming up; the stage asks "Add the date" under its name (Settings' event page). Recommended:
  keep; the alternative, one "No date" group, is one wall again at forty undated events.
- **The at-cap line retires.** The head says "N events · Plan"; at the cap New event opens its own refusal (`limit=door`).
  The board drew Maya at her one-event cap with no line, and it was a permanent upsell over every Free host's one event.
  Recommended: keep.
- **The rows view stays one toggle away; the lens is one row of counts; a search arrives from nine events.** His
  seasons note asks for more choice, not less, and `density=cover`'s "Let's do both" is production; the row of counts
  (All, Hosting, Guest, Deleted) is the board's drawn lens bar. Recommended: keep until r2's customizable collection.
- **The storage ring shows at a phone too** (the board drew it at 1440 only): with the band gone it is the storage
  step's only home; in a hand it rides the line under the day. Recommended: keep.

## System-doc edits (in place, owned facts only)

- `docs/systems/dashboard.md`: rewritten in place for the page as built (an event's day, the stage and its rule, the
  live wall's one read, one item an event and `finished`, the week, where the reads go, the groups by when and the
  lens, the tile, the ring); the viewer's day and the claims review kept, their pointers moved off host-app.md.
- `docs/systems/notifications-analytics-growth.md`: none needed; the bell is unchanged and holds what the page leaves
  to it.

## Deferred (ROADMAP one-liners, bucket named)

- Host: the stage's live read is a Server Function, which Next dispatches one at a time with the page's other actions
  (a claim pressed mid-poll waits a beat); a GET route handler under `src/app/api/` would run beside them (from
  `dashboard-wiring`).
- Host: a disposable album's host cover (`peek=covered`, UI later): the stage's wall reads approved photographs on the
  host's client, which the seal exempts, so the covered album covers the wall too when it lands (from
  `dashboard-wiring`).
- Host: `EventCard`'s dashboard-only props (`qrSlot`, `pendingCount`, `itemsLabel`, `living`, the trash variant) and
  `event-card-qr.tsx` have no production caller since the tile; the Library's specimens are their last users, so they
  go with those entries (from `dashboard-wiring`).
- Docs: host-app.md (:303, :317) and guest-flow.md (:721) still name "the pulse" where a waiting newcomer or a restore
  shows; it is the dashboard's stage, its week and its tiles' marks now (from `dashboard-wiring`).

## Handoff (replaces the chat report)

- **Commits:** `9a9ce389` (the rewire), `86fde85c` (the wall's Just now only while photographs land; the skeleton's
  acts at the stage's foot), pushed to `origin/lp/dashboard-wiring`. No sync: since the base `26596e48`, launch-prep
  moved by record docs alone (`git diff --name-only 26596e48 origin/launch-prep`: `docs/STATUS.md`,
  `docs/tracks/orchestrator.md`). The head is this manifest's commit, in the chat line.
- **Gates on `86fde85c`**, each on its own exit code (logs `partyreel-wt/_scratch/dashboard-wiring/gate2-*.log`):
  typecheck 0; lint 0; test 0 (755 files, 8,963 tests); `build-lock.sh pnpm build` 0; `lab:smoke --base
  http://localhost:3132` 0 (149 checks, 0 failing; scope create-wizard, event-header, host-dashboard, identity, the
  Library and the shell).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): every path under `owns`, this manifest, and four
  exceptions:
  - `src/components/shared/route-skeleton.tsx`: its `pulse` shape delegates to the dashboard's own
    `components/app/dashboard/dashboard-skeleton.tsx` (56 lines out), so the page and its skeleton change in one place;
    `route-skeleton.test.tsx` still pins the delegation and the trail's hold.
  - `src/components/app/pricing/gated-sites.test.ts`: the page's at-cap line and the band's storage step are gone, so
    they leave its list of pricing doors; the ring's popover (`storage-meter.tsx`) stays in it.
  - `content/help/your-dashboard-explained.mdx` rewritten for the page as built, and one line each in
    `hide-remove-and-restore.mdx`, `storage-plans-and-limits.mdx`, `how-partyreel-works.mdx` (their `updated` moved)
    and `AUTHORING.md`'s house term (the Show menu is the row of counts): the articles quote the page's controls,
    `help-ui-labels.test.ts` and `help-product-doors.test.ts` hold them to the source, and no lane owns content/help
    this wave.
  - `src/app/(dev)/design/(shell)/library/compositions/gallery-demos.tsx`: two ledes made true (StorageMeter is the
    ring; EventCard is a profile's card); no specimen changed.
- **The items:**
  - The stage (`purpose=stage`): `momentEvent` leads; before its day the code on its plate (opens the code card) and
    readiness's ticks, Invite and Print; on its day the live wall; after it the calm album, "in the album", guests,
    Share the album. Lit by its own lead photograph, blurred (`components/app/dashboard/stage.tsx`).
  - The live wall (`arrivals=live`): the album's doorbell plus `useLivePoll`'s cadence ask `readStageLiveAction`
    (`lib/dashboard/stage-action.ts`; `getEvent` proves the host before the door is read) for nine photographs, the
    counts, the door and the last hour; the stage re-runs the same pure rules, so its act follows its numbers. Just
    arrived and `getPulse` are gone.
  - This week (`needs=week`): every other dated party within seven days either way, nearest first, its one item with
    its act (`ActDoor`: a real link, the print page in a tab, or Invite's code card) or its quiet line; cards from
    `md`, a list in a hand (`week-row.tsx`).
  - One item an event (`attention.ts`) with the carried `finished` call: the queues in every phase, paused and the
    reel on the day, readiness's first essential then Print before it, nothing after it but someone waiting; this
    answers ROADMAP 36.
  - Grouped by when (`events=seasons`, `seasons.ts`): Coming up, Just past, earlier this year, each year folded into a
    line whose covers open their events and whose Show opens it; As a guest at the foot; the stage's event never below
    it; the row of counts, the search from nine, the rows view and its sort one toggle away (`events-section.tsx`).
  - The `tile` call (`event-tile.tsx`): photograph or date face, name and when, Live and one state in the corners, a
    dot under 15rem; no QR chip, no pills (answers ROADMAP 84 and 114's corner mark). `EventCard` unchanged for the
    profile.
  - The `head` call (`home-head.tsx`): the day as the h1, "N events · Plan", the storage ring (the meter's popover
    unchanged, amber from 85) and New event; the Dashboard title, its "X of N used" and the at-cap line gone.
  - The `busier` call: two on one night, people waiting first, then today's arrivals (counted, `countArrivalsSince`).
  - Reads (`lib/db/queries/dashboard.ts`, all RLS, bounded): each event's newest arrival (one row an event, chunked),
    the day's counts, the stage's nine, the hub's opens; readiness's reads only for the week before its day and a stage
    before its own (at most 12), the day's counts at most 6, the wall and guests for the stage alone.
  - The skeleton is the page's own shape (`dashboard-skeleton.tsx`); three stale `host-app.md` pointers and
    next-step's "launch list" comments (ROADMAP 46's first half) fixed.
- **Verified in a headless Chrome of my own** at 1440 and 375, against an uncommitted scratch route that rendered the
  production composition (`DashboardHome` through `buildHomeView`) over the host-dashboard board's fixtures: Maya (one
  event) a week before, on the night, the morning after, a year on and undated-live; Jo (forty) a week before, on the
  night, the morning after, a year on; the rows view, dark mode, an empty account, the skeleton
  (`_scratch/dashboard-wiring/*.png`). Reduced motion: the live dot's ping computes `animation-name: none` and the
  wall's tiles a 1e-05 s transition (ping and 0.24 s without it). The page's reads are pinned by `page.test.tsx` and
  `queries/dashboard.test.ts` (fake-postgrest past 1,000 rows); the action's refusals by `stage-action.test.ts`.
- **For build 43's red-team** (localhost cannot sign in): the dashboard signed in as willg97 (Pro, many) and
  hi@willgibs.com (Free, one) at 1440 and 375; an event dated today, a guest phone uploading: the wall and its numbers
  move within seconds, and on a review-held event at the approve; someone asking at the door turns the act into "Let N
  in" (doorbell or the minute's poll); an undated event taking photographs reads Live today; the plate's code card,
  Invite and Print, Add the date to Settings; the lens, the search, the rows toggle, Restore under Deleted; the ring's
  popover doors; from devtools, `readStageLiveAction` with another host's event id answers null; a viewer west of UTC
  after 5 pm reads her own day.
- **Assets requested from Will:** none.
- **Board ideas:** the profile's public cards wearing the dashboard's tile (one atom on both surfaces); a host's own
  pin for the stage ("feature this one", his "which one gets featured" as a choice); Library entries for the two atoms
  the board named, the tile and the storage ring.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** "Live tonight" from 5 pm of a dated party's day (and "Live today" whenever a photograph
  landed in the last hour), "Yesterday" never "Last night"; the stage's album number "in the album", never "photos" (it
  counts video); the wall's newest marked Just now only while photographs land; the week holds dated parties only;
  before its day the stage reads and draws no guest count; marks as dots on a tile under 15rem; a folded year's covers
  each open their event; the plate and Share the album open the code card; Most waiting counts people at a door; the
  stage 420 to 560 px tall at a desk, tiles at the board's 3:2 where the cards were 16:10.
- **Look at first:** the stage on an event dated today with photographs landing (the live wall and its act), then an
  undated event, then forty events grouped by when.
