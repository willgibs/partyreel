# The host dashboard

Open this before you change `/dashboard`: its stage, the week, the events grouped by when, the storage ring, the Guest
tiles or the claims review. Creating an event, the event page and moderation are [host-app.md](host-app.md)'s; the
bell's words are [notifications-analytics-growth.md](notifications-analytics-growth.md)'s.

`/dashboard` is today's page: the viewer's own day in its head, the party of the moment on a stage of its own
photographs, this week's other parties each with its one step, then everything else grouped by when. Every rule is
pure under `lib/dashboard/` (`when.ts`, `attention.ts`, `moment.ts`, `seasons.ts`, `stage.ts`, composed by
`home-view.ts`), the page only reads, and the composition is `components/app/dashboard/home.tsx`.

- **An event's days are the dates its host set, else the viewer's calendar day of its newest approved upload**
  (`spanOf`; `getLastArrivals`, one row an event). A host may date a range of days, no times (`event_end_date`, its
  one shape `lib/events/dates.ts`): it is live on any day of it, its month after counts from its last day, and it is
  as near as its nearest day (`daysToEvent`), which the week, the stage and the groups all read; it folds into the
  year it began. Create asks no date, so most events start undated: an undated album is live on a day photographs
  land, just past the week after, and folds into its year; an undated empty album has no day and waits under Coming
  up. ★ The inferred day places an event, it never dates one: `whenOf` reads the host's dates only ("No date"), the
  stage never says "tonight" of an undated album, and the week holds dated parties only. ★ An end date only says when
  an event happens: nothing here (or anywhere) ends, locks, archives or purges by it.
- **The stage** leads with `momentEvent`: the one on its day (a host's date first, any day of a range, then an
  undated album landing today; two on one night, the busier: people waiting, then today's arrivals), else the nearest
  within 30 days either way (a day behind weighs 1.5 days ahead), else, on a quiet day, the newest made, dated or not
  (the event a host is setting up). Before its day it is the code on its plate and readiness's
  essentials as ticks; on its day the live wall (nine at a desk, three in a hand, calm until nine have landed); after,
  the calm album and its numbers ("in the album", never "photos": it counts video). Its line under the name says the
  whole range ("Friday, October 2 to Sunday, October 4"), its word counts down to the first day and dates the past from
  the last. Its acts are its one item's, else its phase's own.
- ★ **The live wall listens, it never refreshes the page.** On its day the stage hears the album's doorbell and asks
  `readStageLiveAction` (`lib/dashboard/stage-action.ts`) for its nine, its counts, its door and its last hour, on the
  product's hybrid cadence (`useLivePoll`); the stage keeps its facts and re-runs the same pure rules, so a person at
  the door changes the act as it changes the number. The action proves the event is the caller's (`getEvent`, RLS)
  before it reads the door on the service role. A fresh server drawing replaces what the doorbell moved.
- **One item an event** (`itemFor`): the queues in every phase (the door, then review), paused uploads and a reel one
  photo short on its day, and before its day the first essential readiness leaves undone (readiness is
  `lib/events/readiness.ts`, never a copy), then the code printed the day before. ★ A party long over speaks only when
  someone waits: a paused album after its day is a finished party, never a step. Room is the ring's, never an item.
- **This week** is every other party within seven days of its nearest day, either way, each with its item or its quiet
  line (Ready for guests, or the album's count). A queue on a party further off waits on its tile's mark and in the
  bell.
- **The reads go only where the page will speak.** Readiness's own reads (`getOpenedCounts`, the hub's opens; a closed
  door's count) are made for the week's parties before their day and a stage before its own, at most 12; the day's
  counts for events on their day, at most 6; the wall and the guest count for the stage alone. A rule never guesses an
  unread fact: an event with no readiness read says no setup step.
- **Everything else** is grouped by `seasonsOf` on the server (coming up, just past, earlier this year, then each year
  folded) and laid out on the client through the lens (one row of counts: All, Hosting, Guest, Deleted) and, from
  nine events, a search, both instant. The rows view (sorted by Newest, Most waiting, Name) stays one toggle away,
  the choice in a cookie read before the first paint. ★ The stage's event is never drawn below it.
- **A tile** is its photograph, or its date (a range's first day) before it has one, its name and when, and at most a
  mark in each top corner (Live; what waits, or its step while the week holds it); narrower than 15rem a mark is a dot
  with its words for a reader. A range's when is where it stands on its days ("Day 2 of 3"), its weekdays inside the
  week ahead ("Fri to Sun"), else its dates ("Oct 3 to 5"): "to", never a dash. The tile is the dashboard's own atom: `EventCard` still draws a profile's public cards. ★ The tiles take
  turns (`cover-cycle.tsx`): every 3.5 s one tile dissolves to its next still, in reading order; one still or off
  screen sits out, and nothing moves in a hidden tab or under reduced motion. The wall's tiles keep the
  `[data-media-tile]` arrival fade; every other host tile is `data-static`.
- **The storage ring is unconditional** (a host with no events still has a plan), beside New event; amber from 85
  percent. Its popover is the meter: both ways out are doors, See plans and see what's using space, the size list
  counting down to her own plan's cap (`fit`). The over-cap grace banner is its own red alert under the head, never in
  the ring (`grace-banner.tsx`). New event is live at the cap: the route is the refusal.
- ★ **"Today" is the viewer's calendar day, never the server's**: Vercel runs on UTC, so from evening on west of UTC the
  server's today is already tomorrow. The page reads the viewer's zone from `x-vercel-ip-timezone` (validated by
  constructing an `Intl` formatter, falling back to the server's zone), computes the day, its hour and an upload's day
  DST-safely (`viewer-day.ts`); the week, the phases, the Event Pass expiry and the grace deadline
  (`format/date-in-zone.ts`) all read it. The zone is used only to render and is never stored or logged.
- **The claims review** appears when `getMyClaimableGuestRows()` finds rows typed under the account's own CONFIRMED
  email at a names-mode door before that email was proved: one banner line above the events with Review, which opens
  the list kind (`claims-review.tsx`: a side panel at a desk, its own screen in a hand) and goes through them one event
  at a time (`claims-card.tsx`), each with up to four of its own approved photographs from an open album, presigned on
  the server (a password or private album shows a lock and the count). Every decision is written as it is made, one
  event a call (`claims-actions.ts`): Claim through `claim_guest_rows_by_email`, Not mine through
  `disown_guest_rows_by_email` once its confirm dialog at the card says Delete, since that is the guest saying those
  uploads were not theirs; an event she never reaches waits, and the banner counts it. ★ An answer names its card, a
  card waits for its write, and an arriving card holds its answers 250 ms, so a double tap never claims the next event
  (`claims-batch.ts`). ★ The album link never rides the list (a Not mine is an event she was never at): a claimed row's
  Open album and quieter Follow come from the claim's own follow-up read (`getClaimedEventNext`), for an event she is
  now a guest of. The writes never revalidate; the review refreshes the page behind itself as each lands and keeps its
  own account of her decisions. ★ The layout's own silent claim is a write the page follows too: it lands after the
  server drew the rows, so the claim's own caller (`ClaimUploadsOnAuth`, on the (app) layout) refreshes the route once
  a claim it ran moved uploads, and the banner, the card and the Guest tile follow. The refresh is the caller's, never
  a listener's in the page: the page segment streams in behind `dashboard/loading.tsx` after the layout, so the claim
  usually lands before the review mounts (a soft navigation and a hard load after sign-in alike). A disowned name leaves
  the guest list and the Guests room with its uploads, and the empty guest row survives for the device that minted it.
  A nameless profile meets the name gate first ([auth-accounts.md](auth-accounts.md)), prefilled from the newest
  claimable row's typed name. One toast as the review closes counts what that opening added, its second line pointing
  at the page unless the page setup's invitation is about to take the banner's place
  ([profiles-social.md](profiles-social.md)): one pointer a beat.
