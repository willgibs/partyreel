---
track: first-event-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "40e2c2c1"          # the launch-prep SHA the branch was cut from
board: first-event     # wired by this lane; the board retires (its eight asks ruled whole)
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/app/create-event-wizard.tsx
  - src/components/app/qr-preset-picker.tsx
  - src/app/(app)/dashboard/new/
  - src/app/(app)/dashboard/page.tsx
  - src/components/app/share/event-share-sheet.tsx
  - src/components/app/share/share.css
  - src/components/app/share/event-share.test.tsx
  - src/components/app/event-share-dialog.tsx
  - src/components/app/event-card-qr.tsx
  - src/components/app/event-qr.tsx
  - src/components/app/print/
  - src/app/(print)/
  - src/app/(app)/dashboard/[eventId]/page.tsx
  - src/app/api/events/[eventId]/live/
  - src/lib/events/host-fingerprint.ts
  - src/lib/events/host-fingerprint.test.ts
  - src/lib/qr/
  - src/components/app/event-uploads.tsx
  - src/components/app/event-feed/launch-list.tsx
  - src/components/app/event-feed/launch-list.test.tsx
  - src/components/app/event-feed/event-gallery.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/app/event-feed/event-hub.test.tsx
  - src/app/(dev)/design/sandbox/first-event/
  - src/app/globals.css
  - docs/systems/host-app.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/guest/use-gallery-doorbell.ts
  - src/lib/guest/refresh-coalescer.ts
  - src/lib/events/gallery-fingerprint.ts
  - src/components/shared/masonry.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/marketing/chrome/footer-qr.tsx
  - src/components/marketing/system/demo-ticket.tsx
  - src/components/marketing/sections/features/qr/print-shop.tsx
  - src/lib/constants/tiers.ts
  - src/lib/constants/qr-presets.ts
  - src/lib/dashboard/next-step.ts
  - src/components/app/pricing/
  - src/components/app/event-settings/
  - src/components/ui/sheet.tsx
  - src/app/api/
  - src/app/legal-print.test.ts
  - src/components/shared/lit-edge-contract.test.ts
  - docs/reviews/first-event.json
  - docs/design/rulings.md
---

# lp/first-event-wiring

**Goal.** A lane from the sixth batch's queue (the Orchestrator's plan, "The queue after wave one"; Will's answers of 2026-09-20 verbatim in `docs/design/rulings.md`, "the sixth batch"; the wiring lanes of that batch are on `launch-prep`). Read the brief end to end before the first edit; where it names his words, they bind; where it says recommended, draw that first. His verdicts and every note are in `docs/reviews/<board>.json` and verbatim in `docs/design/rulings.md` (the
section "the fifth batch"); the Orchestrator's reading of every verdict is below under "The verdict map", and this lane's
brief follows it. Read the brief end to end before the first edit; where it says "his to overrule", build the recommended
answer and list it in the Handoff.

## The brief (from the Orchestrator's plan; the bracketed line numbers are the tree at `69a9a177`)

- THE REVIEW SHEET FIRST: `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/b97eafa6-025b-4736-847b-48f80c42ec24/scratchpad/review-sheets/c75734b9-third.html` (16 verdicts pictured from the fresh capture of `c75734b9`): open your board's section first, each of his verdicts beside the picture of the option he chose, his sentence verbatim.
- **The wizard** (`asks=one`, `style=step`, `landing=beat`): step 1 is one BIG name field (the option's "name under a
  cursor": a single-line field at the section rung, borderless with a rule beneath, autofocus, the placeholder as today;
  the note and the date leave the wizard: they are edited on the event under its header through the settings sheet, which
  already holds both); step 2 is the style step REDESIGNED (`qr-preset-picker.tsx`: the four presets as larger swatches on
  a container-query grid, the check pop kept, one line "You can change this later from Share"; the swatches keep the
  placeholder link at the real density: the row does not exist yet, and his verdict keeps the step before the press);
  Create; then step 3 becomes THE BEAT: one screen once, by construction (only Create reaches it): the real code large in
  a plain mat with the event's name (the paper register; the `DemoFrame` composition borrowed, not its component: the
  event has no photograph yet), two doors (Print the table cards → the print route in a new tab; Share the link → copy and
  the native share), one primary door "Go to your event"; `EventSlugControl` leaves the wizard for the share sheet where it
  already lives. `max-w-xl` stays; the stepper's three labels become the two steps and the beat.
- **The door** (`limit=door`): the page passes `atCap`, the cap itself (`profile.event_slots ?? MAX_EVENTS[tier]`, so the
  copy says "holds one event" or "holds N events" from the number, never a literal one) and the event(s) at the cap (name,
  id) computed server-side with the dashboard's own cap math; the wizard SNAPSHOTS the prop once at mount
  (`useState(() => atCap)`) and renders the DOOR from that snapshot when nothing was created in this session, so the
  post-create RSC refresh (which re-renders `/dashboard/new` with `atCap` true: `revalidatePath` refreshes the current
  route, client state kept) can never swap the beat for the door (the comment at `/dashboard/new/page.tsx:17-24` rewritten
  with this; a contract test re-renders with `atCap` flipped after a creation and asserts the beat). The door: the plan's
  sentence with the number, the event's name, two actions: Delete it (→ the event's settings sheet at `?room=settings`,
  where delete lives) and Upgrade (`PricingSheet` on `room`); the dashboard's disabled New event button becomes a live
  link to the route so the door is reachable ("never absent" kept); the server's `enforce_event_limit` refusal stays as
  the guard (the wizard's toast + sheet, `gated-sites.test.ts` green).
- **The hand** (`hand=same`): `share/event-share-sheet.tsx` REDESIGNED at 375 inside the same responsive Sheet: the code
  as large as the sheet's width carries (measured against the module floor), the title one line, the actions a row
  (Copy link, Share, Open), the download menu and the designer door beneath, the readable link section kept, a Print door
  added; `event-share.test.tsx`'s pins kept (the permanent link, the in-place confirm and its live region, one
  `view-transition-name` holder, the sheets outside the gallery). The legacy `event-share-dialog.tsx` RETIRES: its one
  caller (`event-card-qr.tsx`) links to the event's `?room=share`; the stale `host-app.md` line goes with it. The
  mini-modal stays (app-shape r1's ruling; his to overrule).
- **Paper** (`venue=sheet`): a print route in ITS OWN route group so the app shell's sticky header never prints:
  `src/app/(print)/dashboard/[eventId]/print/page.tsx` with a bare `layout.tsx` (its own `getUser()`, the event by RLS,
  `notFound()` otherwise; the same `/dashboard` prefix so the proxy's auth gate covers it); the code rendered by the
  zero-JS server renderer `FooterQr` (imported from `marketing/chrome/footer-qr.tsx`, never edited: it imports only
  `qrcode-generator` and `cn`, no marketing CSS, and the app surface subtracts only `/admin`); three stock pieces in
  `src/components/app/print/`: a table-card sheet (nine cards to a page), a sign (one to a page), a poster (one to a
  page), each carrying the real code, the event's name, one line ("Scan to add your photos") and the short link, in ONE
  design in the paper register, laid out in physical units under one opt-in hook (`data-print-stock`); print-ready
  through the browser's print (a PDF is one press; a Print button calls `window.print()`). The house's print doctrine
  binds (`globals.css:2748-2786`, `legal-print.test.ts`): NO `@page` anywhere (it cannot be scoped and re-sizes every page
  printed in the session), every `@media print` rule lives in `globals.css` scoped to the hook, so `src/app/globals.css`
  is RELEASED to this lane for the batch (the Orchestrator's manifest drops the line at the cut and takes it back at the
  merge: the `toasts-wiring` precedent, `e48c9a1d`), the block small and scoped. The module floor promoted from the
  board's `frame.tsx` into `src/lib/qr/module-floor.ts` (`modulePx`, `MODULE_FLOOR_PX`) with a test asserting every
  printed size clears it at Letter and A4. The gallery of designs is a ROADMAP line (the Orchestrator's, at the record).
- **The empty event** (`empty=list`): `event-uploads.tsx`'s zero state becomes `event-feed/launch-list.tsx`: the three
  things the app knows for a new event (Set the date if `event_date` is null → `?room=settings`; Write a note for guests
  if `description` is null → `?room=settings`; Print the table cards → the print route), each a door with one line; the
  pending variant ("Everything's in Review") kept; the "Share the code" door under it kept (the code is in the header
  already, so it is the fourth thing only while the list has fewer than three); the album takes the room back at the
  first item (`albumCount > 0`; `event-hub.test.tsx:117`'s expression kept).
- **Live** (`first=live`): two facts bound the design: the doorbell trigger rings only when the APPROVED-visible set
  changes (`supabase/migrations/20260611220000_gallery_doorbell.sql:28-45`: a pending upload wakes nobody), and the hub
  page is eleven queries plus three presigns per item, so a refresh on a timer would be the most expensive poll in the
  product. So: the hub subscribes to the doorbell (`use-gallery-doorbell.ts`, read; generic: `qrToken`, `enabled`,
  `onRefresh`) and refreshes the page's RSC payload (`router.refresh()`) ONLY on a ping or on a changed fingerprint,
  never on a timer; a small host route `src/app/api/events/[eventId]/live/route.ts` (the host's `getUser()` and RLS)
  answers `{ etag, pending }` from a host fingerprint in `src/lib/events/host-fingerprint.ts` (the visible set's ids and
  the pending count; the guest's `gallery-fingerprint.ts` is the shape to copy, not to reuse: it is access-shaped), polled
  on the guest's hybrid cadence (the shared `use-live-poll.ts` the guest lane extracts, or the two numbers inline until
  it lands) and answering 304 when nothing moved, so hold-for-approval arrivals reach the host too; `HostMediaGrid` keeps
  the previous item ids in a ref (ids are stable across refreshes; presigned URLs roll every 30 minutes, an accepted
  refetch) and passes the new ones as `arrivedIds` with `--arrival-glow-ms` written on the album box, `stagger` STAYS
  OFF (`data-static` only disables the mount fade; the glow is an animation on `::after` and runs regardless; the seeded
  first-render stagger is what the emil contract forbids on the host album); a Live pip in the header's metadata row while
  the channel is subscribed; the count and the launch list re-render from the server on the same refresh. The cost per
  refresh is measured on the alias and written in the Handoff; widening the doorbell trigger for pending arrivals on a
  host channel is a migration and a ROADMAP line (the Orchestrator's), not this lane's.
- The board retires under the retirement exception (the house convention: `RulingId` kept, the row's `ruled`/`shipped`
  rewritten as shipped and its `lives` list refreshed (the deleted dialog leaves it), no `board` block; `SandboxId` and
  `DESK_ORDER` lose it; `sandbox/first-event/` deleted, its `modulePx` promoted first; the board's fifteen-minus-one
  `first-event.*` entries in `sandbox/overtaken.ts` removed in the same commit so the lane's own gate stays green once the
  board is gone from `registry.ts` (`overtaken.test.ts:108-116` refuses a key naming a retired board; the desk lane removes
  the same lines, and identical deletions merge clean)). Exception lines listed with why: the `for` lines at the head of
  `rules/component-notes.ts`; the new `qr` hosts (the beat's mat, the print stock) in `lit-edge-contract.test.ts`'s closed
  `HOSTS` table (that test is the guest lane's this batch, so these lines are applied after syncing past it if it landed
  first, else listed for the Orchestrator: the `demo-frame-wiring` precedent); the print block in `globals.css` (released). `host-app.md`'s create flow, QR designer, event page (share,
  the empty album, the live hub) sections refined in place. New `for` lines (the wizard, the picker, the launch list, the print stock, the module floor)
  with `// @contract-for:` tests: the wizard (one field gates step 1; the door renders at cap before any creation and
  never after a creation in the session; Create ends on the beat once), the picker (four presets, the value round-trips),
  the launch list (the items follow the event's nulls; empty at the first photograph), the print page (three pieces, the
  real code, the floor), the share sheet's kept pins, the grid's `arrivedIds` diff (pure).
- Owns, BY FILE: `src/components/app/create-event-wizard.tsx`, `src/components/app/qr-preset-picker.tsx` (its
  `value`/`onChange`/`joinUrl` props kept: the Library's composition passes them), `src/app/(app)/dashboard/new/`,
  `src/app/(app)/dashboard/page.tsx` (the create door's line), `src/components/app/share/event-share-sheet.tsx`,
  `src/components/app/share/share.css` (the code's size rules), `src/components/app/share/event-share.test.tsx`,
  `src/components/app/event-share-dialog.tsx` (deleted), `src/components/app/event-card-qr.tsx`, `src/components/app/event-qr.tsx`,
  `src/components/app/print/` (new), `src/app/(print)/` (new: the route group, its layout, the print page),
  `src/app/(app)/dashboard/[eventId]/page.tsx`, `src/app/api/events/[eventId]/live/` (new), `src/lib/events/host-fingerprint.ts`
  (new, with its test), `src/lib/qr/` (new), `src/components/app/event-uploads.tsx`, `src/components/app/event-feed/launch-list.tsx`
  (new), `src/components/app/event-feed/event-gallery.tsx`, `src/components/app/host-media-grid.tsx` (the real path: it is
  not under `event-feed/`), `src/components/app/event-feed/event-hub.test.tsx`, `src/app/(dev)/design/sandbox/first-event/`,
  `src/app/globals.css` (released for the batch), `docs/systems/host-app.md`. Reads (every one exists on disk today; the
  manifest test refuses a missing read): `src/lib/guest/use-gallery-doorbell.ts`, `src/lib/guest/refresh-coalescer.ts`,
  `src/lib/events/gallery-fingerprint.ts`, `src/components/shared/masonry.tsx` (the guest lane's: `arrivedIds` and
  `data-arrived` exist today, pinned at `masonry.test.tsx:279-289`; the shared glow stylesheet, the hold hook
  `src/lib/shared/arrival.ts` and the poll hook `src/lib/shared/use-live-poll.ts` land with that lane and are ANNOUNCED
  by name: sync past it before handing off if it has merged, else ship arrivals with the attribute and the inline cadence
  and the glow follows at the second merge), `src/components/guest/live-gallery.tsx` (the cadence and the hold to copy),
  `src/components/marketing/chrome/footer-qr.tsx`, `src/components/marketing/system/demo-ticket.tsx`,
  `src/components/marketing/sections/features/qr/print-shop.tsx`, `src/lib/constants/tiers.ts`, `src/lib/constants/qr-presets.ts`,
  `src/lib/dashboard/next-step.ts`, `src/components/app/pricing/`, `src/components/app/event-settings/`, `src/components/ui/sheet.tsx`,
  `src/app/api/` (an existing host route as the precedent for the live route's auth and shape), `src/app/legal-print.test.ts`,
  `src/components/shared/lit-edge-contract.test.ts`, the ledger, rulings.md, the review sheet.
- Tests: the contracts above; `gated-sites.test.ts`, `qr-presets.test.ts`, `event-share.test.tsx`, `event-hub.test.tsx`,
  `masonry.test.tsx:279-289` green; `lab:smoke` whole; the gate. Red-team: signed in as the Free test host (`hi@willgibs`,
  one event: the door at the cap, Delete and Upgrade), and as `willg97` (a new event end to end: the big name, the picker,
  the beat, the print page at Letter and A4 in the print preview, the launch list, a guest's upload arriving live on the
  hub at 1440 and 375); signed out nothing of this lane shows but the printed code's scan (the disposable event).
- His to overrule: the mini-modal kept; the legacy dialog retired; the stock's one design and the three pieces; the
  launch list's three items; `router.refresh()` as the live mechanism; the beat's composition without a photograph; the
  swatches on the placeholder link; the door's two actions.

## The verdict map (every answer of the batch; this lane wires only its own board's)

**`guest-shape` r1 (seven; five wire now, `chrome` goes to round two, `dialogs` follows the sheet ruling):**
- `door=today` (overrules `one`): the welcome, then the gate: two screens on a gated event stay. "To be clear, this is
  directly approving the welcome then gate, not this sheet design": the SEQUENCE is ruled, the shell is not; with
  `dialogs=stands` the shell is the one responsive Sheet the hub landed (a bottom sheet in a hand). At a desk a door is
  not a side panel: the Sheet gains a `desk` prop (`side` | `center`) so the door wears the same primitive centred.
- `nothing=river`: the river, at one depth, on both the locked page and the empty album (nine local stand-in frames,
  never the event's own; a locked page leaks exactly what it leaks today).
- `chrome=dock` with "warrants a second round": NOT wired now. Round two on `chrome` alone, drawn with Save already
  moved (his `account=after`) and the dock's two remaining actions (Add, Invite): where a guest's actions live so they
  are FOUND on landing ("one of the last places a guest's eye will reach") and REACHABLE deep in the album ("always
  accessible, no matter how deep"). The floating Add pill's fate rides this round.
- `live=land`: a new photograph grows into its column under a glow that fades, the album re-flows around it, nothing
  else moves. The tile's arrival state is the tile's (the glass lane's file); the guest's live gallery sets it.
- `yours=?` with his rule, verbatim: "A guest can delete any photo they've personally uploaded, ever." A product
  feature that does not exist today (the board's options were never / a window / a 'yours' strip): the viewer's Remove
  on a guest's own photographs, forever, under an account; on the same device session for an anonymous guest (the
  only identity there is). A SECURITY-DEFINER RPC that deletes only the caller's own media (the guest row or the
  account, never a client claim), the same purge path as a host delete, never restorable by the host (a person's
  withdrawal is theirs). His to confirm at approval: whether a guest's removal is final for the host too.
- `account=after` (overrules `one`): the account is asked once, at the door; keeping the album becomes a one-tap
  offer after a guest's first photograph lands, not a form above the album. Save leaves the chrome (round two draws
  the chrome without it).
- `dialogs=stands`: Invite, Save, Report and Download all wear the one responsive Sheet (the desk lane conceded it).

**`app-vocabulary` r1 (seven; four wire now, two stand, `gallery-controls` gets a narrow round two):**
- `empty-states=stands`: the earlier ruling (the pulse's designed empty state) decides; nothing new is wired.
- `loading=asneeded`: one shared skeleton primitive wired to exactly the routes with a real pre-paint wait (the
  dashboard, the event hub, the Studio); the dashboard's and the hub's `loading.tsx` become the one component, the
  Studio gains its first (the ROADMAP line closes).
- `tile-grammar=stands` + "If unifying components or keeping them distinct also helps, that's your call": the earlier
  ruling (glass's tiles rule) decides what a tile shows; the CALL is taken: ONE `MediaTile` for every album grid (guest,
  host, bin, profile feeds, selection) with the three marks as state, the desktop hover actions as a per-surface prop
  and select as a mode; the admin's moderation tile stays its own (a report, not an album). Owned by the glass lane,
  which rewrites every tile's marks anyway.
- `bulk-toolbar=icon` + his three notes: icons on both bars (ReviewActions and GalleryBulkBar become one `BulkBar`
  with an actions prop); tooltips open IMMEDIATELY on hover, never delayed; "every action on a photograph lives in the
  lightbox" was a MOBILE rule and the desk keeps hover controls on cards; and the side-by-side tooltip: moving across
  the bar's icons slides one tooltip panel between them (the transitions.dev "page side by side" shape), the delight of
  this lane, reduced motion a plain swap.
- `gallery-controls-home=cluster` + "Am I overriding anything with this answer, or does this work with the glass?":
  NO override, and the desk badge's reasoning was a slip: glass's `row=bar` ruled the host TILE's hover row (like,
  download, hide as one pane of the material); the cluster is the gallery's section header on paper, and wears no
  glass at all. Both hold, in different places. His crowding worry (download,
  tile size, sort, filter, select) is a narrow round two on this board: where the host gallery's five controls live (a
  View menu holding tile size, sort and filter beside the two verbs; the sticky pill row; a control sheet at 375).
- `gallery-controls-persistence=device`: localStorage, per browser, no profile column.
- `confirm-switch=primitive`: one `ConfirmSwitch` owns the glyph and the deferred-open dance; the two hand-rolled
  copies in the settings sheet's uploads section retire into it.

**`seed-avatar` r1 (seven; all wire now, with a bug fixed first and `look` re-asked in round two):**
- The BUG, before anything: "the avatar doesn't fully fill its container, and you can see horizontal edges within";
  "reveals the color underneath the photograph on the edges". Found and fixed in the production `Avatar` (the drawing
  the board reuses), with a contract test that the image covers the disc at 24, 32 and 40 with no gap.
- `look=diagonal` (overrules `orb`): two hues on a diagonal is the working version. His question ("is this the best
  that hashvatar had to offer? The preview ones ... felt much more alive and rich") is round two on `look` alone: three
  richer looks measured against the same three floors (hashvatar's own multi-stop gradient mode as it renders on its
  site, a two-throw mesh, the diagonal with a lit seam), drawn on the wired avatar.
- `the-crowd=full`, `palette=wheel`, `letter=always`: every guest full colour, all 360 degrees, the initial at every
  size in a fitted ink.
- `seed=account` + "ensure the account ID randomness leads to a variety across the color wheel": the account id is
  the seed; the generator's crowd test (a thousand ids fill every 30-degree bucket) becomes the contract on the
  production path, fed real id shapes (UUIDs), so a concentration is a red test.
- `after-upload=under`: the colour waits underneath and the photograph paints over it; `motion=none`: still, always.

**`admin` r1 (seven; all wire now):** the portal opens on the numbers (four figures, a fortnight's trend, the queue
beneath); a rail plus a command palette (the help palette's primitive if it is one); hybrid density (a table for data
on `ui/table.tsx`, a list beside the message for prose inboxes); a state's colour reaches the row (a failed run tints
its row with a leading edge: "Makes it a bit harder to miss"); every destructive act opens one sheet sized to the
damage (the responsive Sheet; only the permanent act makes you type); the health band under the bar on every page with
a chip in the bar, gone on a good day; a 44 px tool bar with a breadcrumb, a live tag, the health chip and an initial.
His three answers on badged asks (`home`, `density`, `chrome`) override app-shape's reach and are echoed there; the
desk lane had written "stands" on all three.

**`app-door` r1 (seven; all wire now, `welcome` re-asked in round two, `return` flagged):**
- `lead=code`: one email field; the same address signs in or creates the account; Google beside it; a password drops
  to a quiet link.
- `surfaces=one` + "any login components that feel similar could be unified into one object worn 4ways": one account
  object with the methods as props and one consent line, each wear passing the reason it asks (the /login page, the
  guest gate's step, the keep-the-album offer after upload, the create-account moment a like opens). The admin's
  second factor stays its own step after the object (a different purpose).
- `welcome=tour` (overrules `first`): the name, then the tour; event creation becomes the tour's closing primary CTA
  (skippable, as in the preview) so the wizard stays its own focused thing. "Could use a huge redesign to feel more
  alive" is round two on `welcome` alone: three tours drawn on the real screens.
- `page=beside`: /login with the product beside it (real photographs on the right half of a laptop, a band above the
  door in a hand).
- `existing=tell` + his note: the same single step, one line naming the address and saying we signed you into the
  account it already had; dismissible; with an action if it was a mistake ("Not you? Sign out" / "Use another email").
- `failure=paths`: the line, shorter, with the recoveries as real buttons under it; a visual redesign inside the lane.
- `return=tap` + "If this is a bad idea, please flag it": FLAGGED, in one sentence: a press that signs anyone in
  without a credential is never acceptable, and a passkey IS a credential, so the option is right exactly as far as
  passkeys reach. The lane wires it as: a passkey registered on the account page ("Sign in faster on this device"),
  offered once after a code sign-in; the /login door shows the one-press button when this device holds one, the Google
  one-press when a Google session is live, and `back`'s welcome-back line with one field otherwise. If Supabase Auth
  has no passkey factor on this tree (the doc check decides), the lane ships `back` and lists passkeys as the follow-up.

**`glass` r2 (two; the board retires at its wiring):** `material=crystal` (overrules the lane's Frost: 4 percent black,
the pane separating by its edges), `edge=double` (a 28 percent lip and a 10 percent hairline all round). The wiring
lane: the `--glass-*` token set and one `.glass` utility; the lightbox's backdrop (the album blurred at half
brightness); the tiles' three marks and the removed chips (with the rose mark carrying its own contrast: no material
saves it over a bright photograph); the host's row as one bar; dark glass on paper; the reel's controls in the one
material (round one's white on the reel is superseded by "one material everywhere", his own words); then `glass`
retires and the material lands in the Library.

## The ownership rules every lane follows this round

- One manifest owner per path; no two lanes' `owns` overlap, not even by a shared prefix. A second lane's single-line
  edit in another lane's file rides the lane-check exception line of its Handoff ("exceptions and why"), applied AFTER
  syncing past the owner's merge, never before. `merge-lane.sh` aborts only on real git conflicts (same or adjacent
  lines, a delete against a modify), so distinct hunks merge clean; the pre-handoff sync carries the first lane's hunks.
- `ladder-wiring` owns explicit FILES (its real footprint, about seventy: `git grep -lE
  'text-\[(7|8|9|11|13|15|17)px\]|text-\[0\.8rem\]|tracking-\[0\.14em\]' -- src ':!src/app/(dev)'`), never a prefix
  another lane sits under; a file whose only sizes are stock classes equal to a step needs no edit at all.
- The app-shape lanes build on stock classes that EQUAL a step (`text-sm` 14, `text-xs` 12, `text-base` 16,
  `text-[10px]`) and never on the announced step names: Tailwind v4 emits no utility for an undeclared `--text-working`,
  the element silently inherits, and nothing in the gate sees it. The names are a mechanical swap after a lane syncs
  past the ladder's merge, or a follow-up.
- A wiring lane never deletes, renames or breaks the props of a module the lab imports: every module
  `git grep -l "from \"@/" src/app/\(dev\)` resolves to (`filter-chips`, `trash-section`, `storage-meter`, `feed-section`,
  `empty-section-teaser`, `event-card`, `app-shell`, `feed-section-header`, `event-filter-pills`, `review-section`,
  `use-review-triage`, `recently-deleted-grid`, `event-settings/*`, `event-slug-control`, `my-uploads-gallery`,
  `lib/dashboard/filters.ts`, `media-grid`, `host-selection-provider`, `review-actions`, `gallery-actions`, `styled-qr`,
  `host-media-grid`, `export-dialog`, `download-all-button`, `selectable-media-grid`, `review-grid`, `feed-section-empty`,
  `qr-preset-picker`, `enter-event-prompt`, `gallery-empty-state`, `likes-provider`, `password-gate`, and more): a retired file stays on disk with a head comment
  naming the boards that draw it; `AppShell` and `EventCard` props stay backward compatible; `pnpm design:rules` when
  `component-notes.ts`'s AppShell contract changes.
- `docs/systems/host-app.md` is split by heading: `home-wiring` edits inside `## Dashboard landing`, `## Events & the
  create flow`, `## First-time host welcome`; `hub-wiring` inside `## QR designer`, `## Custom event link (slug)`, `## The
  event page`, `## Moderation & curation` and one Reel-card door line in `## Reel curation`; nobody touches the H1, the
  ROLE block or `## See also` (the Orchestrator rewrites the H1 at the record); edits stay inside a section body, never
  on a heading line or the blank line before the next heading; the second lane to land syncs first.
- `src/lib/single-source-policy.test.ts` refuses one UPPER_SNAKE export from two `src/lib` modules: `home-wiring`'s
  `lib/dashboard/*` and `hub-wiring`'s `lib/event/*` never both export a `SECTION_LABEL`; `voice-wiring` deletes the four
  sibling Pro lines rather than re-exporting one.
- `content/help/` and `content/blog/` belong to `voice-wiring` alone. The app-shape lanes change what several help
  articles describe (the dashboard, the event page, sharing, settings): each lists the articles it makes stale in its
  Handoff (help how-tos track shipped reality), and one `help-sync` follow-up (Sonnet) rewrites them after both land.
- Every new door a wiring lane adds (the QR and its mini-modal, the copy button, the list toggle, the menu rows, the
  cards) carries `trackAttrs` as the chrome's doors do; every new component gets its `for` line in
  `rules/component-notes.ts` and a `// @contract-for:` test, so it lands in the Library with its `new` badge
  (`pnpm design:rules`); the sheets, the mini-modal and the table read `ui/floating-layer.ts`.
- ONE responsive Sheet for the product (a side panel at a desk, a bottom sheet in a hand, on `ui/sheet.tsx` with
  `ui/drawer.tsx` retired or folded): `hub-wiring` builds it for settings and sharing, and it is the sheet
  `guest-shape`'s dialogs, `profile-page`'s quick-look and `app-pricing`'s object inherit ("apply this sheet concept
  everywhere"); its contract test is the one others reuse.

**Binds.** The bible (`/design/library`), the contracts of every component under a path you own, and the policies;
Will's notes in the ledger and rulings.md; the ownership rules above; CLAUDE.md's working loop (doc-check via Context7
first: Next 16, Tailwind v4, zod v4 and Supabase SSR drift). `DESIGN_PREVIEW_KEY` rides the environment, never a command
line. Never edit a record doc (`docs/CHANGELOG.md`, `STATUS.md`, `ROADMAP.md`, `ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/design/rulings.md`, `docs/reviews/`); a `docs/systems/` fact inside your lane is refined in place and listed below.
Stage explicitly; never `--no-verify` or force-push; the `Co-Authored-By` trailer on every commit.

**Verify on.** For a production lane: the gate on the synced tree (`pnpm design:rules`, the specimen collector
`node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, `pnpm typecheck`, `pnpm lint` with the 8 known warnings, `pnpm test`,
`pnpm build`), each on its own exit code; `pnpm lab:smoke --base http://localhost:<your port>` whole; the surfaces the Handoff is
judged on, local at 1440 and 375 (the Orchestrator red-teams them on the alias). For a lab lane: the board at 1440 and 375 with
reduced motion honoured, `pnpm lab:smoke` whole, `pnpm lab:demo --board <board> --base http://localhost:<your port>` pressing
every step (a backdrop-filter step reports UNPAINTED in headless Chrome: capture it by hand and say so). One process at a
time on this machine; your dev server on your own port, killed by port before a build, a test run and the handoff.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Every claim below (a retirement, a migration, a gate, a fix) names its artifact (a commit hash, a log line, a file path), so
  the Orchestrator checks rather than believes; a claim with no artifact is read as unverified.
- Gates on the synced tree: design:rules ok, specimens ok, typecheck ok, lint ok (8 known), test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board <board>` ok (a board)
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each: `<id>: <the builder's verdict>; a kept one becomes <the Library entry it lands as>`
- Calls his to overrule on the alias, one line each
- The help articles this lane makes stale, one line each (a `help-sync` lane rewrites them)
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
