---
track: host-dashboard
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "10705484"            # the launch-prep SHA the branch was cut from
board: host-dashboard
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/host-dashboard/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/dashboard/
  - src/lib/dashboard/
  - src/components/app/event-card.tsx
  - src/components/app/event-card-qr.tsx
  - src/components/app/notification-bell.tsx
  - src/lib/notifications/build.ts
  - src/lib/events/readiness.ts
  - docs/systems/host-app.md
  - docs/systems/notifications-analytics-growth.md
---

# lp/host-dashboard

**Goal.** Open the host dashboard's redesign board: what the page is for, what deserves attention at one event and at forty, how events present at scale, and what replaces "just arrived", drawn as whole bespoke pages from production.

## The brief

**Why.** Will, on `event-ready`'s `needs` (answered `?`, 2026-10-02), verbatim. Quote it in your `opening.earlier`, since `event-ready` retires tonight:

> May warrant another exploration. For users who create lots of events, I don't want this section to get super stacked with 40 'next' items for 40 events. In that case, this feature loses most of its value because it's flagging 40 things to do, not just the ones which are actually important. We already have notifications for some things like this - I'd like to rethink this section on the dashboard, from its purpose/benefit to its UI to what the absolute best thing overall to include in this space is. As a broader note, I'm also curious about redesigning the host dashboard and anything around it in general to better rethink the best UX/UI now that we're getting closer to a more full feature set. The 'next items', 'your events' and 'just arrived' aren't cutting it for me, individually or as a sum total.

`needs`'s three options were `quiet` (says nothing), `job` (always one job per event) and `count` ("Ready" or N left). The board recommended `job`.

**The page today** (`(app)/dashboard/page.tsx`, 548 lines), in order:
1. The title row: "X of N events used" and New event.
2. The grace banner.
3. **"What needs you"** (`next-step-band.tsx`, `lib/dashboard/next-step.ts`). It gives at most one step per event that needs something, plus storage over 85%, so 40 events can give 41 items. The band shows 3 and folds the rest behind "+N more".
4. The storage meter.
5. The claims review.
6. The page invite card.
7. **"Your events"**: filter, sort, cards or rows; no cap and no pagination.
8. **"Just arrived"**: up to 12 approved tiles across live events.

**The bell** (`notification-bell.tsx`, `lib/notifications/build.ts`) repeats the band's door and review rows with the same words and counts. Only the band shows paused, reel, print and storage. Only the bell shows pass expiring, recovery clearing and announcements.

**Asks.** Shape them to be progressive, about a minute each. Suggested, yours to reshape:
- `purpose`: what the dashboard is for.
- `needs`: what deserves attention at 1 event and at 40, with the bell's overlap resolved.
- `events`: how events present at scale.
- `arrivals`: what replaces "just arrived", or nothing.

Draw every option at 1 event and at 40 (fixtures). Readiness lives in `src/lib/events/readiness.ts` since ready-wiring (the hub's checklist reads it), so derive from production, never a sandbox import. `needs`' own derivations (`nextJob`, `readyWord` and their 6 tests) were deliberately left out of production: they are at `8698a5b8:src/app/(dev)/design/sandbox/event-ready/readiness.ts` for you to draw from. ready-wiring's board idea: "What needs you" could read `readiness()` per event, the hub's own function. The hub's head is `event-header`'s board.

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

**The board's shape.** The board is one folder, `src/app/(dev)/design/sandbox/host-dashboard/`, and nothing else names it: the registry finds it, and retiring it is deleting it. `spec.ts` is `defineExploration` (`src/components/lab/exploration.ts`) and pure data: its id `host-dashboard`, its title, `surface`, `desk: 25` (by leverage, lower first) and `lives` (the paths it redraws), its `opening` and `terms`, and every ask with its context layer (`where`, `when`, `matters` beside `lands`, each option's `gains` and `costs`, `because` in a line). `board.tsx` exports one component, `ExplorationBoard` with a preview per option (`PreviewsFor`). `registry.test.ts` holds all of it; `pnpm lab:smoke` and `pnpm lab:demo` run on the board your change reaches.

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
