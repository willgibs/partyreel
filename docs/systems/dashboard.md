# The host dashboard

Open this before you change `/dashboard`: its bands, the events list, the Guest cards or the claims review. Creating an
event, the event page and moderation are [host-app.md](host-app.md)'s; the bell's words are
[notifications-analytics-growth.md](notifications-analytics-growth.md)'s.

`/dashboard` is a pulse, not an inbox, in four bands: what needs you, the storage line, your events, just arrived. It
has no filter chips and no personal feeds (those are the profile's owner mode, [profiles-social.md](profiles-social.md)).

- **What needs you** is one next best step per event from a pure rule, first match wins (`lib/dashboard/next-step.ts`:
  a queue, paused uploads, a reel one photo short, an event dated tomorrow), then the account's storage step. ★ It
  never renders as a void: a band wired to the review queue would be blank for every up-to-date host, so an empty
  result renders "Nothing needs you". Past three steps it folds behind a "+N more" chip, and a host with no events sees
  no band at all. ★ The reel step appears only at exactly one playable item with the switch and the lever on, and leaves at two
  (`getReelProgress`, the guest's `isReelEligible` spelled in SQL); at none the event's checklist speaks, and a step
  there would push "Print the code" out the evening before.
- **The storage line is unconditional** (a host with no events still has a plan); the over-cap grace banner is its own
  red alert, never inside the meter (`grace-banner.tsx`). ★ Both of its ways out are doors: See plans, and see what's
  using space, the size list counting down to her own plan's cap (the list's `fit` goal: the meter's number, nothing
  to switch, the bar's Remove the act), so she chooses what goes before the sweep takes the largest first. The meter's
  own door carries the same goal whenever she stores more than her cap.
- **Your events** counts through `event_card_stats`, and each hosted card's cover and stills come from
  `getEventCardStills` (`event_covers` and `event_stills` in one pass: the cover first, no photograph twice, four at
  most); "X of N used" is `countActiveEvents()`, a head count. ★ The cards take turns (`dashboard/cover-cycle.tsx`):
  every 3.5 s exactly one card dissolves to its next still, in reading order, wrapping; a card with one still or off
  screen sits out, and nothing moves in a hidden tab or under reduced motion. The grid's columns live once
  (`event-card-grid.ts`), shared with the loading skeleton. ★ A hosted card says Open or Paused (`uploadsLabel`, the
  hub code's own badge reads it too), never Closed: that is the door's word for Only people already in.
- **Just arrived** is the newest approved uploads in a window that widens until it holds twelve (`arrivals.ts`); its
  number is a head count, never a read's length. ★ These are the one host tiles that keep the `[data-media-tile]`
  arrival fade (no `data-static`): they literally just arrived. Their reads live in `db/queries/pulse.ts`, apart from
  the `events.ts` that every event room shares.
- ★ **"Today" is the viewer's calendar day, never the server's**: Vercel runs on UTC, so from evening on west of UTC the
  server's today is already tomorrow. The page reads the viewer's zone from the `x-vercel-ip-timezone` header
  (validated by constructing an `Intl` formatter, falling back to the server's zone) and computes the day DST-safely
  (`viewer-day.ts`); "N today", "an event dated tomorrow", the Event Pass expiry and the grace deadline
  (`format/date-in-zone.ts`) all read it. The zone is used only to render and is never stored or logged, so no privacy
  text changes for it.
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
  a claim it ran moved uploads, and the banner, the card and the Guest card follow. The refresh is the caller's, never
  a listener's in the page: the page segment streams in behind `dashboard/loading.tsx` after the layout, so the claim
  usually lands before the review mounts (a soft navigation and a hard load after sign-in alike). A disowned name leaves the guest list and the Guests room with its uploads, and the
  empty guest row survives for the device that minted it. A nameless profile meets the name gate first
  ([auth-accounts.md](auth-accounts.md)), prefilled from the newest claimable row's typed name. One toast as the review
  closes counts what that opening added, its second line pointing at the page unless the page setup's invitation is
  about to take the banner's place ([profiles-social.md](profiles-social.md)): one pointer a beat.
