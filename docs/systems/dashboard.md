# The host dashboard

Open this before you change `/dashboard`: its stage, the week, her events (the Display menu and the Recent row), the
storage ring or the claims review. Creating an event, the event page, moderation and the Guest cards (the events an account added to) are
[host-app.md](host-app.md)'s; the bell's words are [notifications-analytics-growth.md](notifications-analytics-growth.md)'s.

`/dashboard` is today's page: the viewer's own day in its head, the party of the moment on a stage of its own
photographs, this week's other parties each with its one step, then the events she opened lately and all her events,
laid out her way. Every rule is pure under `lib/dashboard/` (`when.ts`, `attention.ts`, `moment.ts`, `stage.ts`,
`display.ts`, `opened.ts`, composed by `home-view.ts`; each file's header holds its rule), the page only reads, and the
composition is `components/app/dashboard/home.tsx`.

- ★ **"Today" is the viewer's calendar day, never the server's:** Vercel runs on UTC, so from evening on west of UTC the
  server's today is already tomorrow. The page reads the viewer's zone from `x-vercel-ip-timezone` (validated, else
  the server's own) through `viewer-day.ts`, and the week, the phases, the Event Pass expiry and the grace deadline
  (`format/date-in-zone.ts`) all read that day. The zone is used only to render and is never stored or logged.
- **An event's days are the dates its host set** (a day or a range, `lib/events/dates.ts`), **else the viewer's
  calendar day of its newest approved upload** (`when.ts`); an undated empty album has no day and waits under Coming
  up. The inferred day places an event but never dates it, since the host never set it: `whenOf` reads the host's
  dates only ("No date"), the stage never says "tonight" of an undated album, and the week holds dated parties only.
- **The stage** leads with `momentEvent` (`moment.ts`): the event on its day, else the nearest within a month either
  way, else on a quiet day the newest made. Before its day it shows the code and readiness's essentials, on its day
  the live wall, after it the album and its numbers ("in the album", never "photos", since the count includes video).
  - **With no photograph yet it is lit by the event's own lamp** (`stage-lit.tsx`): one of the five `--lamp-*`, picked
    by its id and never changing (`lampOf`), only ever as light in a gradient (the set is not in `@theme`), fuller from
    the week before its first day through its last (`lampNear`), the code on its plate (the code card, 176 px) and
    Settings' five steps laid flat under the name (`stageRailOf`: `settingsSteps` and the checklist's own head, so a
    tick here is a tick in the hub). Where readiness was not read (its day, after it) the numbers say it in the rail's
    place, so a party's day never loses its counts. Its first photograph takes the light over.
- **The live wall listens and never refreshes the page** (a refresh per photograph would presign every event's covers
  again): on its day the stage hears the album's doorbell and asks `readStageLiveAction`
  (`lib/dashboard/stage-action.ts`) for its wall and counts on `useLivePoll`'s cadence, re-running the same pure rules.
  ★ The action proves the event is the caller's (`getEvent`, RLS) before it reads the door on the service role.
- **One item an event** (`itemFor`, `attention.ts`): the queues in every phase, the day's own steps on its day, before
  it the first essential readiness leaves undone (`lib/events/readiness.ts`, never a copy), then the code printed the
  day before. A party long over speaks only when someone waits, since a paused album after its day is a finished
  party, not a step; room is the storage ring's to say.
- **This week** is every other party within seven days of its nearest day, either way, each with its item or its quiet
  line; a queue on a party further off waits on its tile's mark and in the bell.
- **The reads go only where the page will speak** (`dashboard/page.tsx`, each round bounded: `READY_READS`,
  `DAY_READS`): readiness's reads for the week's parties and a stage before their day, the day's counts for events on
  their day, the wall and the guest count for the stage alone. A rule never guesses an unread fact: an event with no
  readiness read says no setup step.
- **Her events are one collection she shapes** (`events-section.tsx`, rules in `display.ts`): "Your events N" (hosted
  and added to, the stage's own event drawn once above it, the bin never counted), a search from nine, and one Display
  menu: the layout (gallery, table, list), the order and its direction, what shows (whose, when, a year), the groups
  (none or by year) and the covers' size, each laid out instantly on the client, a number on the button for what
  differs from the default, a line under the head saying it and one Reset. Quiet by default: covers, the newest first,
  nothing grouped or filtered. The sort says "In the album", never "photos".
  - ★ **Her choices are kept on her account** (`profiles.events_display`, sparse: only what differs from the defaults,
    narrowed on every read by `resolveDisplay`, never trusted; the column's CHECK is an envelope, not the key list).
    `setEventsDisplayAction` writes her own row and revalidates nothing; the page resolves them before the first byte.
    Recent's fold is kept with them but is never a menu choice (no badge, no Reset).
  - ★ **Back restores the page from the client's router cache, drawn from before her last choice** (read in a browser:
    the same render stamp, the layout reset), so the section remembers the tab's last choice, and a search for ten
    minutes, by account (`remembered`): the server's copy alone would revert a layout she chose the moment she pressed
    into an event and back.
  - ★ **The bin stays reachable** (`offersDisplay`): Display shows from a second event or whenever Deleted holds one,
    because Restore lives only here; an account with only deleted events is told so and one press shows them.
  - **The Recent row** (from seven events, `RECENT_FROM`): the four she opened last, hosted events only, never the
    stage's or this week's (`recentRowsOf`, decided on the server), folding to small covers. Opens are
    `events.host_opened_at`, stamped by `HomeShell`'s one listener on every press into an event
    (`noteEventOpenedAction`, at most once a minute an event, as her under RLS); a navigation takes priority over a
    pending Server Function in Next 16, so a press never waits for its stamp. The hub stamps itself too (`HubOpened`,
    the same action, on mount), so a deep link (the bell, an email) counts: ★ one Server Function call a hub visit,
    never a poll (the minute's filter spares the write, not the call), so a press from here asks twice, the second
    finding no row to move.
  - The groups by when (`seasonsOf`, `HomeView.events.seasons`) are still composed because the host-dashboard board's
    drawings read them; the section does not.
- **A tile** (`event-tile.tsx`) is the dashboard's own atom; `EventCard` draws a profile's public cards. Every range's
  dash is `dashRange`'s (`lib/utils.ts`, shared with `formatEventDate`), and the tiles take turns dissolving to their
  next still (`cover-cycle.tsx`).
- **The storage ring is unconditional** (a host with no events still has a plan); its popover is the meter, both ways
  out doors (See plans, and the size list counting down to her plan's cap). The over-cap grace banner is its own red
  alert under the head, never in the ring, since its deadline costs her media (`grace-banner.tsx`). New event stays
  live at the cap: the create route is the refusal.
- **The claims review** appears when `getMyClaimableGuestRows()` finds rows typed under the account's own CONFIRMED
  email at a names-mode door before that email was proved. A banner line above the events opens it
  (`claims-review.tsx`), one event at a time (`claims-card.tsx`), each with a few of its own approved photographs
  presigned on the server; a password or private album shows a lock and the count, never a preview. Every decision is
  written as it is made, one event a call (`claims-actions.ts`): Claim through `claim_guest_rows_by_email`, Not mine
  through `disown_guest_rows_by_email` once its confirm dialog at the card says Delete, since it removes those uploads
  ([guest-flow.md](guest-flow.md)); an event she never reaches waits, and the banner counts it.
  - ★ **A double tap never answers the next event:** every answer writes and a claim has no undo, so an answer names
    its card, a card waits for its write, and an arriving card holds its answers for `SETTLE_MS`
    (`claims-batch.ts`, `claims-card.tsx`).
  - ★ **The album link never rides the list** (a Not mine is an event she was never at): a claimed row's Open album and
    Follow come from the claim's own follow-up read (`getClaimedEventNext`), for an event she is now a guest of.
  - The writes never revalidate: the review refreshes the page behind itself as each lands. The (app) layout's silent
    claim lands after the page drew its rows, so its caller (`ClaimUploadsOnAuth`) refreshes the route itself once it
    moved uploads.
  - A disowned name leaves the guest list and the Guests room with its uploads; its guest row survives, empty, for the
    device that minted it. A nameless profile meets the name gate first ([auth-accounts.md](auth-accounts.md)),
    prefilled from the newest claimable row's typed name. The toast as the review closes counts what it added and
    points at the page, unless the page setup's invitation is about to take the banner's place
    ([profiles-social.md](profiles-social.md)): one pointer at a time.
