# The host dashboard

Open this before you change `/dashboard`: its stage, the week, the events grouped by when, the storage ring or the
claims review. Creating an event, the event page, moderation and the Guest cards (the events an account added to) are
[host-app.md](host-app.md)'s; the bell's words are [notifications-analytics-growth.md](notifications-analytics-growth.md)'s.

`/dashboard` is today's page: the viewer's own day in its head, the party of the moment on a stage of its own
photographs, this week's other parties each with its one step, then everything else grouped by when. Every rule is
pure under `lib/dashboard/` (`when.ts`, `attention.ts`, `moment.ts`, `seasons.ts`, `stage.ts`, composed by
`home-view.ts`; each file's header holds its rule), the page only reads, and the composition is
`components/app/dashboard/home.tsx`.

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
- **Everything else** is grouped by `seasonsOf` on the server (coming up, just past, earlier this year, then each year
  folded) and laid out on the client through the lens (All, Hosting, Guest, Deleted), a search and the rows view,
  whose choice is a cookie read before the first paint so the page never redraws into it. The stage's event is not
  drawn again below it.
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
