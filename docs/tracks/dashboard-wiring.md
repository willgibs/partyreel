---
track: dashboard-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
