---
track: rooms-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(app)/dashboard/[eventId]/
  - src/components/app/event-feed/event-cards-row
  - src/components/app/event-feed/room-card
  - src/components/app/event-feed/reel-card
  - src/components/app/event-feed/review-room
  - src/components/app/share/
  - src/lib/event/sections
  - src/lib/notifications/build
  - src/components/app/dashboard/act-door
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/event-header/
  - docs/reviews/event-header.json
  - src/app/(guest)/e/[token]/page.tsx
  - src/components/guest/event-experience.tsx
  - docs/systems/database-security.md
  - docs/systems/guest-flow.md
---

# lp/rooms-wiring

**Goal.** Wire event-header's rooms=over: every room opens one predictable way over the hub (Review, Guests and Settings in one panel at a desk and a screen on a phone, the reel full screen), and See it as a guest is new: a true guest render, a phone over the dimmed hub.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers (event-header r2, his desk on build 45, 2026-10-03), in full:**
- rooms=over: "This feels phenomenally more fluid, natural, and intuitive. As a guest screen is a really cool idea."
- facts=strip and doors=? go to event-header r3, cut after you merge: leave the head's facts and the cards' look as they are. His doors note, so you leave room for it: "For today's cards, I don't love filling the highlight reel anymore. we have images in event head and gallery below, this crowds it too much... option 3, on the cover in glass... slides right into the sticky menu on scroll (important for all options to have their version in cleanly doing so)."
- His round-12 words this answers: "Currently hate how some actions open a sheet, some are a new page, some (reel) seems to flash a guest album as it loads the slideshow... Very unpredictable handling across actions stemming from the same row. Annoying that I have to go all the way into and all the way back."

**Build:**
1. **Review, Guests and Settings share one right-edge panel over the hub at a desk, and a screen on a phone**, one way in and out. Review (`review-room.tsx`) and Guests leave their route pages. Their addresses redirect into `?room=review` and `?room=guests`, as `settings/page.tsx` already does for Settings.
2. **The reel opens full screen**, its curtain as `crumbs-52` and `crumbs-54` made it.
3. **See it as a guest** (new; it does not exist in `src/`): a phone over the dimmed hub at a desk, a whole screen on a phone. It must be a true guest render, because the host's session is the owner everywhere and every SQL home exempts her from the seal. It needs a server read that sees what a let-in guest sees: no owner select, sealed shots hidden, no owner controls.
   - Build it as a route of its own under `[eventId]/`. Never edit the guest page itself (`wait-wiring` owns it).
   - It reuses the guest experience's components with that read's props.
   - Write its design as a Question with your recommendation and build that.
   - Security pins prove it grants nothing: no write, no ticket, no row a guest could not see.
4. **Every old way in keeps answering:** the bell (`notifications/build.ts`), the door act (`act-door.tsx`), the Reel card, the sheet's guests link, and `sections.ts`'s legacy `?eventTab=`.
5. **The sticky band stays**, and its doors open the same rooms.

**Constraints:**
- `wait-wiring` owns the hub's head (`event-hub-head.tsx`) and `event-gallery.tsx`. It may add one line to the hub page, so merge kindly with it.
- `identity-wiring` merges first: sync onto it.
- Red first.
- Prefetch a room's chunk on intent, so a panel opens at once.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3134`; `pnpm lab:demo --board event-header` at 1440 and 375 (its PREMISE moves: report what its drawings no longer match); Vitest red first for each room's open and close (address, focus, Back), every legacy entry landing, See it as a guest's read (a sealed album shows no sealed shot; no owner control; no write); captures at 1440 and 375 of each room over the hub and See it as a guest, in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- **See it as a guest, its design** (the brief's Question). BUILT, recommended: a page of its own,
  `/dashboard/<id>/as-guest`, in a route group without the host's shell (`(as-guest)`, `(print)`'s reason), framed
  in the hub's stage: a phone over the dimmed hub at a desk (390x844 fitted to the window, "What your guests see"
  and the door's words over it, Back to your hub, Open it in a new tab), the whole screen under a bar naming the
  event in a hand. A LOOK, NEVER A DOOR: the guests' own read (the door's pass, the guests' seed loader, decided as a
  guest past every step, never the owner), the guest page's own pieces drawn inert; she scrolls it, presses nothing
  (no join, ticket, upload, like, report, claim or download; no visit counted). Only me is the shut door every guest
  meets. Overrule: let her open a photograph and play the reel inside it (a read-only mode in the guest page's own
  components, wait-wiring's and take-home's files), or add what a NEW guest meets first (the welcome, the ask) as a
  second view.
- **One panel for the three rooms.** BUILT, recommended: Review and Guests stand in Settings' panel as it ships (the
  settings kind's 448px, its head: the room's name over the event's, the close in its corner), so the three are one
  panel to the pixel; Review's own row keeps its count in words and its actions, two tiles across. The board drew each
  room's own page heading leading a 512px panel, its close outside the panel's edge. Overrule: the board's (one
  `floating-layer.ts` row for the width, identity's; the head in `room-panel.tsx` and Settings' sheet).
- **The reel's door.** BUILT, recommended: the guests' own view at `/e/<token>?reel`, full screen with its black from
  the first frame (crumbs-52, crumbs-54), its owner's close going Back to the hub, which returns from the router's
  cache. Overrule: a reel layer over the hub, the hub never unmounting (mounting the guests' live album and the reel's
  controller in the hub: a second copy of the guest page's reel machinery).
- **A room handing over to another** (Settings' "Let them in from Guests", the Guests room's "Change who can get in",
  a code card's Everything). BUILT, recommended: it replaces the room, so the close always lands on the hub.
  Overrule: stack them, Back returning to the room before.
- **The fifth door on a phone.** BUILT, recommended: as the board drew it, the third row's first place at half
  width. Overrule: the full row.

## System-doc edits (in place, owned facts only)

- `docs/systems/host-app.md`: the event page's intro and not-found line, the cards row (the fifth door, room
  addresses, intent warming), every room as a place over the hub (one panel, the reel's door, the old routes'
  redirects, the panel's keys), every place on `?room=` (hand-overs replace, old links open in place), the Guests
  room's read, the Review room's queue off the hub's album and its untitled head, the keys in the panel, and a new
  "See it as a guest" section.

## Deferred (ROADMAP one-liners, bucket named)

- Security: the app answers any site's frame (no `frame-ancestors`, no `X-Frame-Options`); `frame-ancestors 'self'`
  keeps See it as a guest's own frame and refuses every other (next.config.ts, take-home's and cost-model's file).
- Host: the dashboard's next-step chip (`lib/dashboard/next-step.ts`) still links `/guests#at-the-door`, answered by
  the route's redirect; `roomHref` would save the hop.

## Handoff (replaces the chat report)

- **Commits**, pushed on `lp/rooms-wiring`: the work at a0eea8bc (every room over the hub, every old way in, See it
  as a guest), 27e32593 (Review two tiles across in its panel), 53d34c97 (the room's keys inside its own panel),
  0b9aebc8 (the guests' view's shut door on the guest page's own door canvas); this manifest's WIP adfba6b4. **No sync
  commit:** launch-prep moved since the cut (wizard-wiring's merge feca808e, identity r3's 792dbc05, cost-model's
  cdefd776, records to a4b1fe49) in none of this lane's files or `reads`, and `git merge-tree --write-tree HEAD
  origin/launch-prep` is clean. `identity-wiring` had not merged at the handoff: the same trial merge onto
  `origin/lp/identity-wiring` (bf88802c) is clean too, so the sync onto it is the merge and the gate. Its panel and
  shimmer changes reach the rooms through `popup.tsx` and `skeleton.tsx`; the stage's own scrim is a call below.
- **Gates on 0b9aebc8**, each on its own exit code, logs in `../_scratch/rooms-wiring/`: `pnpm typecheck` 0
  (`typecheck.log`, on the tree committed as 0b9aebc8); `pnpm lint` 0 (`gate-lint.log`); `pnpm test` 0, 820 files and
  9,670 tests (`gate-test.log`); `zsh scripts/build-lock.sh pnpm build` 0, `/dashboard/[eventId]/as-guest` dynamic
  (`gate-build.log`); `pnpm lab:smoke --base http://localhost:3134` 0, 163 checks, 0 failing (`gate-smoke.log`);
  `pnpm lab:demo --board event-header --only event-header.<facts|doors|rooms> --width <1440|375>` 0 each, 1 step,
  0 failing (`gate-demo-<step>-<width>.log`; the board has no open step left, so each answered step is named).
- **Red first:** `sections.test.ts` (room addresses, the legacy `?eventTab=`, `roomOfHref`),
  `event-share-provider.test.tsx` (rooms open and close by Back, a deep link closes in place, a hand-over replaces,
  an in-hub link opens in place, Settings' page link), `build.test.ts` (the bell's rows), the routes' redirects
  (`review/page.test.tsx`, `guests/page.test.tsx`) all failed on production first; the guests' read's pins were
  mutation-checked (`isOwner: true` turns them red, as the old `review-keys.ts` turns the panel's keys red).
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): 44 owned paths and this file, and 12
  exceptions:
  - `src/app/(as-guest)/layout.tsx` and `src/app/(as-guest)/dashboard/[eventId]/as-guest/{page,loading}.tsx`: See it
    as a guest's address under `[eventId]/` without the host's shell (`(print)`'s reason); its read is the owned
    `[eventId]/as-guest.server.ts`.
  - `src/components/app/event-feed/review-section.tsx` (its head untitled where the panel titles it),
    `review-keys.ts` (the panel counts as the room's page), `host-album.tsx` (one comment line): the Review room's
    own pieces, outside the owned `review-room` prefix.
  - `src/app/not-found.test.ts`, `src/lib/db/queries/guest-addresses.test.ts`,
    `src/lib/db/queries/social.guest-identity.test.ts`: structural pins pointed at the code's new homes (the as-guest
    page's not-found, `room.server.ts` as the one read handing addresses, the room's list and the credit look's
    mounts), each pinning the same rule.
  - `src/components/app/dashboard/stage.test.tsx`, `week-row.test.tsx`, `src/components/app/event-feed/event-hub.test.tsx`:
    expectations following the owned `act-door.tsx` and the cards row to the `?room=` addresses.
- **Items**
  - Review, Guests and Settings in one panel over the hub (`share/room-panel.tsx`, Settings' kind: 448px at a desk,
    the whole screen in a hand), opened by `?room=` (`event-share-provider.tsx`): Back closes, a reload or a link
    reopens, focus returns to the door, a room handing over replaces.
  - Review over the hub (`review-room.tsx`'s `ReviewRoomFromHub`): its queue off the hub's own album (the links minted
    with the first window on a deep link), arrivals live, a failed read says so with Try again, two tiles across, its
    keys inside the panel.
  - Guests over the hub (`share/guests-panel.tsx`, `[eventId]/guests/guests-room.tsx`, `room.server.ts`,
    `readGuestsRoomAction`): served by the hub's render when the address names it, asked on a press, the newest read
    wins, Try again; its acts revalidate the hub alone.
  - The old routes redirect: `/review` and `/guests` to `?room=` with no reads, `/settings` through `roomHref`, the
    legacy `?eventTab=` to its room or the reel.
  - Every old way in opens in place: the bell's rows, the door acts, the Reel card's Review link, the sheet's guests
    link and any in-hub link to a room's address (`useRoomLinks`).
  - The cards row and the sticky band (the same row, stuck): each door writes its address and opens in place, warms
    its chunk on hover or focus and its read on press; a fifth card, As a guest.
  - The reel's door kept: the guests' view at `/e/<token>?reel`, full screen in its own black, its close going Back.
  - See it as a guest: `/dashboard/<id>/as-guest`, read as a let-in guest (`as-guest.server.ts`: the door's pass, the
    guests' seed loader, decided with `isOwner: false`), the guest page's own pieces drawn inert
    (`share/as-guest-view.tsx`; its live album polls the guests' routes, which leave every held and sealed row out
    for everyone), Only me the shut door; staged over the hub as a phone (`share/as-guest-stage.tsx`), Open it in a
    new tab.
  - Its pins (`[eventId]/as-guest.server.test.ts`): no sealed, held or hidden shot in the seed, links or count; never
    the owner; the pass never reaches the client; Only me reads nothing; no write, visit, guest cookie, join or owner
    read in its source.
  - `docs/systems/host-app.md`: the edits listed above. Its "Events and the create flow" lines are untouched, so
    wizard-wiring's queued lines place cleanly.
- **Captures** in `../_scratch/rooms-wiring/cap/`: production's components on a scratch harness over fixtures
  (sign-in cannot run on localhost; the harness stays out of the repo in `harness/tmp-rooms`): `hub-1440/375`,
  `review-1440/375`, `guests-1440/375`, `settings-1440/375`, `band-1440/375`, `as-guest-1440/375` (the phone over the
  hub; the whole screen in a hand), `guest-view-390` and `guest-shut-390` (the view open, and Only me's door),
  `guest-page-1440` (the guest page it copies), `inert-probe` (a real wheel scrolls it, a tap opens nothing).
- **Live red-team, owed on the alias once this merges** (no lane head deploys; signed in through the chooser,
  disposable events): each card and the band opens its room at 1440 and 375, Back closes, a reload on `?room=`
  reopens; the bell's Review and door rows land in their rooms; `/review` and `/guests` redirect; See it as a guest
  on an event holding a held and a sealed shot shows neither, writes nothing (Network: only the album's sync,
  manifest and links reads), counts no visit and sets no guest cookie; Only me shows the shut door; the admin account
  on the host's `/as-guest` meets not-found and a signed-out visit the sign-in; the Reel card full screen and back.
- **PREMISE** (`lab:demo` event-header at 1440 and 375): `rooms`: its `today` is no longer production (every room now
  opens over the hub), and `over` differs from production in Settings' head with the close inside the panel, 448px
  where it drew 512, the reel still the guests' own view, and the guests' view inert under its "Start for free"
  bar; `doors`: the fifth card now matches; `facts`: unchanged. The-wait's board draws four doors in its rooms row
  where production now has five.
- Assets requested from Will: none.
- Board ideas: See it as a guest beside the door (switch Open, Invite only and Private in Settings and watch the
  phone change); a guest's first minutes (the welcome, the ask) as a second view in the stage.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the five Questions above, each built as recommended; and the stage's scrim, the board's
  black at 70% with a blur, where identity-wiring's work layers dim by half and stay sharp (`floatingScrim`), kept
  as drawn unless he calls the stage a work layer.
- Look at first: `cap/as-guest-1440.png` (the phone over the hub) and `cap/review-1440.png` (a room in the one panel).
