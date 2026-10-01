# Partyreel — What's next

> ROLE: what might be next: the open tasks, the major-overhaul buckets, the launch checkpoint. · NOT HERE: how a
> system works (→ [`systems/`](systems)), what shipped (→ `git log`; a merge commit carries its lane's summary),
> where things stand (→ [`STATUS.md`](STATUS.md)), speculative ideas (tracked outside these docs).
> GROWS BY: one line per task under its bucket, present tense, at most a one-line why; a line is deleted the day it
> ships or is dropped (git keeps it).

**Provisional.** A line is a candidate, never a spec or an invariant, and it never bends today's implementation; it
becomes real when a plan picks it up. The don't-revert layer is [`systems/`](systems).

**Deferring work:** add one line under the matching bucket below (never an inline "Deferred:" note elsewhere), so an
overhaul finds its whole task list here when it runs. Picking a task up follows CLAUDE.md's working loop.

## Now (concrete, pick-up-able; one line each, the provenance in git)

New lines land at the head of this list (`usher/kit/record.py`); the cross-cutting ones stay here, and the groups
below hold the rest by surface.

- Admin: the portal's page-content links (`queue-list.tsx`, `inbox-pane.tsx`, `moderation-grid.tsx`, `triage-filter.tsx`, `health-band.tsx`, `operator-alerts.tsx`) still prefetch, two auth reads a distinct route and one more a long inbox's row; the chrome's `prefetch={false}` applies to them too (from `crumbs-35`).
- Guest: a guest's own upload landing is measured in Chrome only (the re-keyed tile is `complete` at mount, no fade); one upload walked on an iPhone in Safari would show any flash between the in-flight tile leaving and hers showing (from `crumbs-35`).
- Hardening: counts still print in the runtime's locale: `formatLimit` (`src/lib/constants/tiers.ts`, the pricing table's caps) and the pricing cards' photo and hour counts (`pass-card.tsx`, `plan-cards.tsx`, `configurator.tsx`, `comparison-table.tsx`, all `toLocaleString()`); route each through `formatCount` (from `crumbs-33`).
- Admin: a dismissed child-abuse report's closed line could say whether it is still a live strike and until when, so an operator reading past dismissals sees what each costs its address, and that its Undo takes it back (a board idea from `crumbs-33`).
- Housekeeping: one `INACTIVE_MONTHS` in `lifecycle/inactivity.ts` for the seven copies of `Math.round(INACTIVE_DAYS / 30)` (`spec-shared.tsx`, `jsonld.tsx`, `llms.ts`, `album-copy.ts`, `media-lives.tsx`, `faq-data.ts`, `events.ts`) (from `crumbs-34`).
- Marketing: the blog's `family-reunion-photo-sharing` ("no expiry clock on it and no countdown to a deletion") and `group-trip-photo-sharing` ("an event has no end date") say the rule with no word of the Free plan's idle removal beside it; the first links to `event-album-no-expiry-date`, which carries the exception (from `crumbs-34`).
- Marketing: an `id="faq"` on every FAQ band (the events template, `FeatureFaq`), so the footer's FAQ link meets each page's own questions, not only /pricing's (`OWN_FAQ_ROUTES`, from `crumbs-34`).
- Host app: `HostAddProvider.openAdd` scrolls the page to the top ("the panel lives at the top, below the command strip") though the upload panel opens under the album's own header; the reel card's Add photos is its one caller, and `host-add-provider.tsx` and `host-upload.tsx` still describe the retired command strip and floating Add pill (from `crumbs-34`).
- Code hygiene: `DemoTicket` has one bare caller (the Library specimen), and `components/lab/scene.tsx` still names the retired boards (from `marketing-refresh`; the rest of its line, `GuestListItem`'s `kind` and the cards' `seed`, landed in crumbs-32).
- Billing: in a hand, Back from Stripe (Checkout, change-plan's confirm, the billing portal), left by a full navigation from inside the plan sheet (a cover, a place), lands on the sheet's same-URL entry with nothing open, one dead Back: `popup-back.ts` now takes its entry with a `Link`'s click, not a `location.href` (from crumbs-32).
- The lab and the kit: a section-level failure grammar: the album's card is the product's first "this part could not load" while the page stands; the reel tile, the Guests list and the hub's rooms could share one drawn primitive rather than each growing its own (a board idea from `crumbs-28`).
- The lab and the kit: a quote-parity test in the shape of `src/components/marketing/mock-parity.test.ts` for the boards' hand-quoted production pieces (the lightbox capsule's actions, the Download album menu's rows, the review verbs): Report, Download album and Reject had drifted until an audit read them (a board idea from `desk-tune-2`).
- Marketing: one 404 grammar across the site: with unknown slugs on the root's screen, the cinema box draws only for a cinema page's own `notFound()`, and none throws one today; retire it, or give the root's screen the cinema skin (a board idea from `stale-link`).
- The lab: a Library specimen for `HostMediaGrid`'s arrival (a card whose button adds a photograph to a fake store, a link minted only when asked), so `lab:demo` holds what the hub's live push does and localhost cannot reach signed in: this lane's scratch page (`_scratch/crumbs-25/`, never committed) is its first draft (from `crumbs-25`).
- Host: every Settings save revalidates the hub, and a tap that moves the address during its round trip followed by a second within about 40 ms of its answer reloads the page (within about 120 ms, the save's data is dropped): Next replays an interrupted revalidating action with a refresh, which the second tap meets (the matrix in `lib/history-entry.ts`); hold the panel's page moves while a save is in flight if it is ever met (from `crumbs-24`).
- The lab and the kit: the desk (`/design/lab`) pictures first too, each open step's stage as a thumbnail in the queue, so a sitting's options are seen before any is opened; and at a phone, number-only tabs beside the shown one's name, so a four-option ask shows every option in one row (today the row scrolls, its cut edge faded) (from `lab-focus`).
- The lab and the kit: the Library draws only the older Dialog and Sheet, never a `PopupContent`, so the popup's arrival guard had no specimen to drive; a specimen (a card that opens a `settings` popup with rows that count their taps) lets `lab:demo` hold it (from `crumbs-23`).
- Marketing: the 404 itself warns "preloaded but not used" four times a load (`marketing.css` and the home hero's, river's and backdrop's sheets): its header and footer links prefetch `/`, `/pricing`, `/login`, `/contact`, `/features` and `/help`, and the client preloads their sheets unused (from `crumbs-22`).
- The lab and the kit: a legibility pass for boards that put words over motion, the one `privacy-hero-r4` ran by hand (`_scratch/privacy-hero-r4/cap2.mjs`: every animation under the words seeked through the Web Animations API, the words hidden, the 95th-percentile ground under each line box against the line's own colour across the whole loop), would let a board prove its words readable on screen rather than by eye; `lab:demo` is its natural home (from `privacy-hero-r4`).
- Marketing: if the privacy hero's lens wins, its veil is a full-viewport backdrop filter (`glass-behind`) under a moving pane; measure a phone on the alias at its wiring, with a pre-blurred still (drawn once, as the beam's dimmed shots are) as the fallback (from `privacy-hero-r4`).
- Guests: the lens (one photograph's worth of clarity in the lightbox's ground) is the album's own privacy gesture; the door family's wait or a private album's gate could wear it rather than a still card (from `privacy-hero-r4`).
- The lab and the kit: the Library could draw the portal's two new states (a report whose item is gone, a covered Albums tile) beside its queue specimen, since the portal cannot be signed in locally (from `crumbs-21`).
- Auth: the sign-in email step pressed before hydration is safe now but says nothing (a waiting cue on its button would), and a signed-out press on /pricing's Get Pro lands the dashboard after signing in, since the return list holds only the app's pages; returning to /pricing widens it to a marketing page, his call (from `crumbs-20`).
- Host: `/account` sets no trail (plainly empty since `crumbs-19`, where it once wore the last event's); a one-step `Partyreel > Account` is three lines, his call (from `crumbs-19`).
- Marketing: `/features/qr`'s hero could take the demo card and its stream whatever the home picks: "One scan and they're in." over the album pouring out of the code, drawn on `demo-framing`'s `stage=centre` second screen (from `demo-framing-r2`).
- The lab and the kit: a loop's score, a timeline read off the engine its frames run (`sandbox/demo-framing/score.tsx`), as a kit piece for motion boards; a motion option is otherwise judged only by watching it (from `demo-framing-r2`).
- Marketing: the album page's hero from 768 to 1279 draws the phone's strip stretched across a laptop (small frames in a wide strip, the album 430 tall); a tablet geometry of its own, as the home hero's `hero-stream.ts` has, could fill it (a board idea from `album-motion-wiring`).
- Marketing: the album hero's handover has two places (a right-hand frame dissolves over the album's right half while its row opens at the head on the left, which his note accepts); a board could ask whether a light along the album's top edge, or the right arm landing further in, should join them (a board idea from `album-motion-wiring`).
- The lab and the kit: `CopyLink` builds from the six lab params, so a board's own switches (`?welcome=gate&was=dom`) never ride the copied link, against `board-state.tsx`'s "the URL is the share format" (from `crumbs-16`).
- The lab and the kit: `src/components/lab/dock.tsx` exports `AppliedBadge`, `ReplayButton` and `MotionToggle`, imported nowhere (from `window-notes`).
- The lab and the kit: the desk's end-of-walk message has no place for a note about the whole program (it reaches the Orchestrator only through chat); a "for the whole program" note composing `note: "..."` would give the transcript's bare note a producer (`_desk/review-message.ts`, `review-session.tsx`) (a board idea from `window-notes`).
- Host: the dashboard card says Closed for paused uploads (`statusLabel`, `app/(app)/dashboard/page.tsx`) while the hub's Settings card words the gate Only people already in as "Private · Closed" (`doorLabel`): one word, two states; the card could say Paused, the code's own word (from `event-ready`).
- Host: at 375 the album's "Before the first photo" wraps to two lines under Add photos and View (`event-feed/event-gallery.tsx`); it retires with the launch list if `event-ready`'s `list` moves it (from `event-ready`).
- The lab and the kit: a portalled frame is not its own world: a production `<Link>` pressed in it navigates the lab (boards carry `stopLinks` or `Inert`), radix layers portal to the lab's document, and a `loading="lazy"` image never loads; `Frame` swallowing links and handing radix a frame-scoped portal container would let a board draw production whole (from `event-ready`).
- The lab and the kit: `Strip` (phones side by side in one `Fit`, laptops stacked) and the 375/1440 Screen knob are copied in `locked-door` and `event-ready`; the front door could carry both (from `event-ready`).
- Host: board ideas from `event-ready`: a host's own "See it as a guest" (the help tells her to fake it with a private window); the dashboard card's code chip wearing the hub's door once `door` is picked; What needs you after the month's Share the album (from `event-ready`).
- Guests: `entry-modal.tsx` exports neither `WelcomeStep` nor `SuccessStep`, so the door family board and the help center's door screens quote both class for class; exported (or moved beside `door/`), both draw the real welcome and "You're in" (from `desk-tune`).
- Guests: the door family's next round or wiring draws what the board leaves out: production's ask (`AskStep`, "Maya lets each guest in", Ask to join) as a fifth door state, and the welcome at a door Maya answers or an invite list, which shows her face and no date (a board idea from `desk-tune`).
- Marketing: when `about-press` folds /press into /about, `CONTACT_TOPICS.press.hint` in `constants/contact.ts` links /press ("Open the press kit"): retarget or drop it, and add the directory's Press row only if About carries the kit; `contact.test.ts` fails on a dead page (from `contact-wiring`).
- Marketing: the careers application form still ends on a toast and a bare drawn check (`careers/[slug]/application-form.tsx`); `contact-receipt.tsx` takes plain data and could serve both, which is also the "two parallel copies of one contract" line (from `contact-wiring`).
- Growth: a contact hint's links and the receipt's onward link fire no `track` event, so how much a topic's answers deflect is unmeasured (from `contact-wiring`).
- Marketing: as-you-type answers on /contact: the page already ships the help search index for the palette, so the subject and message could rank help articles live beside a topic's fixed links, no model and no new service, the deflection his r1 note wants before the help chat exists (a board idea from `contact-wiring`).
- The lab and the kit: the Library carrying the contact receipt (`ContactReceipt` takes plain data) as a `Surfaces` entry, so its motion is judged without sending (from `contact-wiring`).
- The lab and the kit: a no-behaviour lane proves itself with a differential walk (the same requests to its dev server and to the alias, the answers diffed), as `crumbs-15` did for the door, reports and proof routes; a kit script would make it the default (from `crumbs-15`).
- The lab and the kit: once no lane cut before the lab revamp's merge is open, `merge-lane.sh`'s transitional block (the retired `touchpoints.ts` and `(shell)/lab/boards.ts` kept deleted, `registry.ts` kept ours) goes (from `lab-revamp`).
- The lab and the kit: a `lab:demo --every-state` pass that walks each step's `configs` through every option, now that `--state` exists (from `lab-revamp`).
- The lab and the kit: the Library's own board ideas: a `Surfaces` family (live frames of each route, guest entries included), its sidebar open by default, and a plain-text view of each Library page (from `library-lean`).
- Marketing: whether a unit beside a price ("from", "one-time", a clip's count) wears the heading face at all (from `crumbs-12`).
- The lab and the kit: a board's `opening.earlier` is authored; the ledger's own notes from the round before could ride in a fold under it, word for word, so his exact sentence is one press away from the summary (from `lab-revamp`).
- Marketing: `/features/album`'s getting-in section (the phone's three screens) goes wider than its tight two columns on a desk, a line where a paragraph stands, and three new visuals, with the marketing revamp (`loose-ends` r1; its 3.2 s pace stays).
- Security: the impersonation words (`support`, `billing`, `verify`, `security`, `official`, `refund`) are refused only as whole slugs, so `/e/billing-update` or `/e/verify-account` stay claimable; refusing them as any part would take `staff-party` and `help-desk-bash` too, Will's call when a board asks it (from `crumbs-11`).
- Marketing: /features/guests' guest-list card lost its one live control (the switch); a board could draw what governs the list now (a guest who added a photo is on it; the host's Block takes them off) on the card, where the switch taught by being flipped (from `crumbs-8`).
- Marketing: every demo door opens the one demo whatever its page (the /events objects, the footer, the nav's pane), so /events/conferences opens the same party; a party per event type is a board once the one demo lands (from `demo-framing`).
- Help: the four email-code screens quote `AccountDoor`'s post-send code view as markup, since no prop reaches it; an exported code view would make them the real piece (from `help-wiring`).
- Admin: `/admin/help-feedback` could take a last-30-days window beside all time once the counts grow (from `help-wiring`).
- Marketing: /contact's chips under its search could take /help's drop-from-the-field treatment; the palette already drops there (from `help-wiring`).
- Exports: a part's "saved" needs the Worker to report a finished stream (a signed call into `export_log`, or a status the walk polls); the walk says "downloading" meanwhile (from `export-wiring`).
- Admin: `/admin/exports` counts mints only; a check that found objects gone and a stream's skips live in the Worker's logs (`export-check`, `export-stream`), and a report back into `export_log` would put them on the page (from `export-wiring`).
- Host: the Guests room, always on now and home to the Blocked foot, is still the flat chip list drawn when it was opt-in; how it reads at 200 guests with blocks at its foot is a board (from `safety-wiring`).
- Guests: a way to ask the host to take a photo down, short of a report: the help article and admin-triage's `steer` both say "ask the host first", and nothing in the product lets a guest ask; a board (from `triage-r2`).
- Admin: an operator release for a squatted custom link, from a report on `/e/<slug>`, now that a free account can hold one (from `pricing-wiring`).
- Billing follow-ons: measure one iPhone photo and one 10 s video uploaded at the camera's defaults on the alias (`media.file_size_bytes`); if the browser stores a JPEG or a recompressed video at 1.3x or more, retune `AVG_PHOTO_BYTES` / `VIDEO_BYTES_PER_MIN` to what we store (from `pricing-wiring`).
- Marketing: /pricing's table, /reel's clip table and pro-vs-event-pass each carry a clip-length row that reads 60 s on every plan now; it could fold into the mark's row (from `pricing-wiring`).
- Marketing: /pricing's Free card lists six lines to Pro's five, so the pair's balance wants a look (from `pricing-wiring`).
- Guests: a returning guest whose only uploads wait on an empty held album meets the empty state's "Add the first photo" with her badge beside Invite, since the row's Add returns only for this visit's files (`galleryEmpty`); counting her waiting rows would move the Add a beat after they load, so it wants a layout that does not jump (from `voice-wiring`).
- Guests: her uploads draw a plain placeholder for an earlier visit's held photo (nothing outside the album is presigned for a guest); a thumbnail presigned for its uploader's own ticket alone would let her see which one waits (from `voice-wiring`).
- Host: a "See it as a guest" row in settings could open the album as a guest meets it, with the door's steps; every door setting is about what a guest meets, and today a host can only guess (from `event-settings`).
- Host: the settings kind's head in a hand says the event's name twice (the back arrow and the line under the bar); popups could drop the line wherever the back arrow names it (from `event-settings`).
- Marketing: a disposable-camera page, and the site's link that opens Create's step with the camera picked (`pick=step`), once the camera ships (from `disposable-mode`).
- Guests: the password gate titles a password album "{name} is private" (`password-gate.tsx`), the word the private lock owns; whichever words `locked-door`'s `lock` takes, the gate may want its own (from `locked-door`).
- Guests: a door held over nothing (the ghost river under `DOOR_SCRIM`) reads as a flat grey slab in light mode, here and on the password door; a lighter scrim where nothing real stands behind would lift both (from `locked-door`).
- Guests: a locked door could open by itself the moment the host lets her in (the album's doorbell or a slow poll), at the cost of a listener on every locked page, a blocked one's included (from `locked-door`).
- Host: a keyboard cannot reach a toast while a modal holds focus (Radix's trap pulls sonner's alt+T back into the modal), so the size list's Undo is pointer-only while it is open; a keyboard way to it may want a design, not only a focus rule (from `crumbs-7`).
- Host: the Review room says "Review" twice at its top (the page's heading and the section's amber label over the grid) (from `crumbs-7`).
- Billing follow-ons: the size list's per-event totals walk every active item's size (one keyset walk per 150 events); a `host_event_storage()` aggregate would answer one row per event once an account outgrows about 30,000 items (from `storage-wiring`).
- Library: the StorageMeter entry's own specimen opens the size list over the real Server Functions (a signed-out Library reads "Couldn't load"); the StorageList entry is the inert one (from `storage-wiring`).
- Host: the review peek could credit who sent the photograph (the retired board's `viewer` option carried the face-led credit); a host judging a stranger's photograph may want the name before the verdict (from `curation-wiring`).
- Guests: with events waiting under her email the moment card stands 411px at 375 (the keep, the told name, the waiting row, the host, the handle; 306 with none) under Add photos; a board could ask whether the handle's row waits for her next visit when the waiting row stands, keeping the album close under the upload (from `pointer-wiring`).
- Tests: `help-ui-labels.test.ts` reads `src/app/(dev)/` as shipped source, so a lab board quoting a retired string masks a stale help label (help-center's old stub hid "Tap to retry" in two articles); skipping `(dev)/` masks nothing else today (from `help-refresh`).
- The lab and the kit: a real `MarketingHeader` drawn in a board's frame reads the lab page's scroll, so it hides (`use-scroll-direction.ts`) and glazes (`header-shell.tsx`'s sentinel) once the reader scrolls down to the frame; hero-card pins it with a scoped style, and demo-framing draws the same header (privacy-hero pins its own since its round four), so one pin in the kit's frame would fix both (from `hero-r2`).
- The lab and the kit: `PopupQuote` (a popup kind drawn still in a frame, its shape read off `popup-kinds.ts` on production's own shape classes) was local to `event-safety/kinds.tsx` (in git at `99510977^`) and copied `popup.tsx`'s private content and overlay strings; a kit candidate beside `Several` and `ScrollHere`, or `popup.tsx` exports the two (from `safety-refresh`).
- The lab and the kit: `ui/responsive-menu.tsx` cannot be drawn in a lab frame (it portals to the lab page and reads the lab page's media query), so a board can only quote its private `DESK_ROW` and `HAND_ROW` (export-flow did); exported row classes or a shape-and-container seam would let a board draw the real menu (from `flow-refresh`).
- The lab and the kit: `MasonryColumns` and `GuestMasonry` inside a lab frame lose every lazy image to `abortUnfinishedImages`, and under `pnpm dev` Strict Mode's rehearsal unmount runs the same cleanup on a tile still loading, which the remount keeps stripped: a board drawing an album grid is judged blind in dev and draws blank tiles in a frame (from `flow-refresh`, `marketing-refresh`).
- Identity: the claims review's end ("All sorted") could hold the page setup's invitation itself, the one pointer inside the place she just finished rather than a card under it after she closes it (from `claims-wiring`).
- Design system: the house bounce lives only on `[data-mkt]` (`--mkt-ease-pop`), so the door's success check writes the same value inline (`door/lit.css`); one theme token would serve both (from `door-r3-wiring`).
- Guest: the album's failure sheet (`upload/failure-sheet.tsx`) still heads with a Sheet's card title while the same failure inside the door's upload step heads on the page step (`door/heading.tsx`), the one guest sheet outside the door's scale (from `door-r3-wiring`).
- Guest door: at a desk the lamp runs down the panel's left edge, so the welcome's pools stand in its own wash and read faint there; a board could ask whether the desk lamp stops short of the promises, or the pools step up at a desk (from `door-r3-wiring`).
- Profiles and social: the guest look's strip (a name's count and four of its pictures in this album, and a page's shown events) needs a read by guest row or account, presigned and gated like the album; `social/guest-peek.tsx` takes it under the name (from `popups-wiring`).
- The Library: no specimen for the popup kinds (`PopupContent` per kind, the responsive menu, the code card, the look), its Sheet and Dialog specimens older than the table; a Library round draws each kind's shapes side by side at 1440 and 375 with the keyboard up (from `popups-wiring`).
- Code hygiene: `DestructiveSheet`, `GuardedSwitch`, `PricingSheet`, `QrDesignerDialog`, `ExportDialog`, `UploadIntentSheet`, `EventShareSheet` and `EventSettingsSheet` name surfaces they no longer are (a line per caller for their next owners); `create-flow.test.tsx`'s "the card chip goes to the sheet" (it opens the card) (from `popups-wiring`).
- Guest door: the name door's `account` mode has no caller since the told name's Change opens its own small form (`entry-modal.tsx`'s `openToName("account")`, `guest-name-step.tsx`) (from `popups-wiring`).
- Shared: the viewer's two questions (`media-lightbox-parts/actions.tsx`) and the demo modal onto their popup kinds (each named as left alone in `popup-kinds.test.ts`); the claims card goes with `claims-wiring` (from `popups-wiring`).
- Marketing: the demo pointers still plain same-tab links: the event objects (`events/event-object.tsx`), /how-it-works' proof (`how-it-works/demo-door.tsx`) and the footer's phone link (`marketing-footer.tsx`); each is one `DemoDoor` (`system/demo-modal/demo-door.tsx`) (from `demo-doors`).
- Marketing: the nav's Features pane draws the demo frame in the top 16:9 of a pane stretched to the two-column list's height, leaving an empty well under it (from `demo-doors`).
- The lab: a portalled `Frame` copies the lab's `<html>` theme class once per load (`frame.tsx`'s `themeClass` never re-subscribes), so the lab's theme toggle leaves every open frame in the old theme until a reload (from `claims-r3`).
- Marketing: the event pages' table and tent cards (`sections/events/event-object.tsx`) print a code and "Scan to add your photos" but no address; the custom address under the code would carry the one-link idea onto the objects that stand in for the product there (from `hero-card`).
- Shared: `AvatarGroup` (`ui/avatar.tsx`) overlaps a fixed 8 px at every size, hiding a third of a 24 px face and its initial; an overlap that is a share of the face (`hero-card`'s `Faces`) fixes it wherever a face row reads it (from `hero-card`).
- Guests: her tracker draws a picture only for what is in the album; her earlier held or refused items show a placeholder, since a guest is never presigned media outside the album (`grid-items.ts`), so drawing them needs an own-media presign rule (from `guest-door`).
- Guests: a refusal reaches her tracker at its next read (mount or opening), since the album's sync moves only in and out of approved; a live refusal needs its own signal (from `guest-door`).
- Guest door: a full-reload confirm return that moves nothing of this album plays no moment, so it says the other events but not the told name (the typed name reaches the account through `adoptDoorName` with no beat to carry it) (from `guest-door`).
- Marketing: a landscape phone gets a small, scrolling contained player (812x375 draws it 325 wide); a landscape posture that fills the glass could be drawn once the films land (from `reel-marketing`).
- Profile: the setup's small follow-ons (from `profile-setup`): a chosen event that can never appear (its album is not open) says so on its picker tile; the user menu's handle-less "Your profile" and event settings' "Claim your handle to publish the page" open `/account/profile` directly rather than through Account's door; the invitation's button carries its reason rather than repeating its title.
- Docs: `testing-verification.md`'s presign-roll soak still frames a refreshed link as "the 30-minute bucket rolls"; the guest album's links now re-mint per id at `ALBUM_LINK_REMINT_MS` (an hour) instead (the teaser still uses the bucket, and the host album's own timing is unverified); the section's opening wants its own pass (from `album-docs`).
- Code hygiene: `TILE_SIZES`, `resolveTileSize`, `useTileSize` and `TileSizeControl` serve only the Library's gallery demos now that every album is rows; retire them with the demos' control (from `album-guest-wiring`).
- Code hygiene: `src/components/ui/dialog.tsx`'s `fullScreen` comment says Radix's scroll lock lives on Content; it lives on the Overlay, which `fullScreen` omits, so a takeover built on it scrolls the page under it and keeps a desk's scrollbar (no product surface uses it today; the reel view's fix is the shape) (from `album-guest-wiring`).
- Billing: a host who pays in both Checkout tabs holds two live subscriptions and the profile follows the last grant's, so cancelling that one drops them to Free while the other bills, and account deletion cancels only the followed one; on a downgrade of the followed subscription, list the customer's other live subscriptions (one Stripe read) and grant from one, and warn the operator when a grant re-points a profile away from a still-set subscription (from `hardening`).
- Clips: a guest's Add to event in the creator follows its queue item (uploading, held for review, refused) instead of reading Added on hand-off (from `reel-clip-wiring`).
- The reel: `buildReelProps` caps on the mood timeline, so a treatment runs past or short of its length; the lab's builders could share the clip's own-clock fit (`clip-selection.ts`).
- Albums: prune `album_changes` tombstones (one row per item ever, a purged item's included) with a per-event watermark that answers resync below it, as a job with its `/admin` health signal (from `album-pages`).
- Album: the count row could carry the guest's own share as a quiet phrase that is the filter ("28 photos & videos · 8 yours"), so Yours is in plain sight whichever mark wins (today it is two taps into View); from `mark-r3`.
- Guest: the approval toast's server half, so an upload approved after the visit that made it is told on the next visit (the queue lives in memory).
- The lab and the kit: the lab shell's `:has()` rule invalidates the whole page subtree on any DOM insertion (about 7,800 elements restyled per album arrival inside a board, masonry and rows alike); scope it.
- Album: a photo that wraps from the end of one row to the start of the next glides diagonally across the album; a crossfade at both ends may read calmer (an `album-columns` arrival refinement, from `album-rows`).
- The reel: production's `StyleWall` groups the looks as "Looks" and "Layouts" while the creator's tray also has a "Layout" chip (the orientation); `reel-clip-wiring` names the treatments apart (the `reel-cut` r2 board says moods and treatments).
- The voice: one line for the QR's ask across paper and screen (the printed sign's "Scan to add your photos" against the view's "Scan to add yours"), a `voice-guest` question.
- The lab and the kit: seven catalog entry pages log next/image dev warnings from their specimens (`loading="eager"` on an LCP image; `sizes="100vw"` on a `fill` image narrower than the viewport), and the components family page scrolls sideways at 1440 (its `w-screen` breakouts).
- Identity: the viewer's credit takes a face and a door from an `uploaderFace` (`avatarUrl`, `seed` from `seedFor`, `href` `/u/<slug>`) that `getUploaderIdentities` and the item mappers do not resolve yet; `src/components/shared/media-lightbox-parts/credit.tsx` is the seam (today every credit draws the plain disc and none is a door).
- Guest album: the phone's Back closes the open photograph (pushState and popstate) instead of leaving the album; `?photo=` rides replaceState today.
- Guests: the "The host added your uploads" toast ends with the visit (the upload queue lives in memory); the tracker's own-rows read (`/api/guests/mine` `{statuses: true}`) could carry it across a reload or a return.
- Analytics: every visit to an event's link counts as one Link visit since the album lost its own address (`37707d80`), so scans and shared-link opens are indistinguishable; tag the QR's encoded URL with a marker the event page records and then strips (`history.replaceState`), so the two count apart.
- Engineering: `scripts/seed-demo-event.mjs` and `scripts/backfill-strip-exif.mjs` carry `readAllPages` and `inChunks` in miniature because `read-all.ts` imports `must-query` through the `@/` alias plain Node cannot resolve; a relative import there lets the scripts import the one helper.
- Lifecycle: over-capacity's auto-reduce reads a lapsed host's whole active set before it acts (whole, but not budgeted inside one account), so past roughly 100,000 active items one account could spend the sweep's share; page the reduce itself.
- The lab and the kit: `fake-postgrest` reads a dotted filter on a to-many embed (`media.status` on `events -> media`) as a filter on the parent and drops the row; teach it to filter the embedded rows, so `pulse.ts`' strip read can take the plain `.eq("media.status", ...)` form.
- Admin: the album drill-in (`/admin/albums/[eventId]`) reads and presigns every item; a paged drill-in past a few thousand items.
- Performance: `standby_hosts` (like the `removed_media` sweep) scans every removed row platform-wide on each page; past about a million media rows a partial index on removed media (`where status = 'removed'`) keeps the nightly host discovery an index scan.
- Profile: My uploads and My likes stop at 200 with an honest note (`get_my_uploads`, `get_my_likes`); a cursor and a load-more.
- Engineering: one drop-aware migration reader shared by `row-cap-policy.test.ts`, `row-cap-sql.test.ts` and `migration-guards.test.ts` (each has its own; `latestDefinition` sees creates only).
- Host: `restore_event`'s `media_still_removed` (20260729190000, line 441) counts a guest's withdrawals too; no screen shows it today, and a future "N items stay in Deleted" line must count `removed_by_uploader = false` only.
- Tests: `src/app/(guest)/u/[slug]/owner-mode.test.ts`'s allowed-reader list could name `listEvents` (the owner-RLS read `owner-sections.tsx` now makes; its regexes catch only `get*` names).
- Guest: the next person on a shared phone skips the welcome, and with it the legal consent line (`pr_welcome_<qr>` survives every sign-out and the ticket drop); decide whether it goes with the tickets.
- Legal: the Terms say a profile block "removes each of you from the other's social surfaces" (`legal-terms.tsx:427`) while a block covers following only; the event-safety wiring rewrites the section.
- Billing follow-ons: `host-storage`'s wiring needs a per-account, per-item size query (today's `getHostStorageSummary` is an aggregate and `listEventMedia` is per event) and the plan sheet's refusal face on the trigger the board picks.
- The voice: after the guest journey's board (`voice-guest`), the host app's lines, then marketing's main lines, each won one line at a time in its real place, across all main and micro copy.
- Guest: the name step's field carries `autoFocus` (`guest-name-step.tsx:356`) though the password gate drops it for the iOS keyboard; check on a real iPhone.
- Housekeeping: more files with no importer or Library-only, beyond the lines above: `features.ts` and `features-layout.ts` (read only by their tests), `anonymous-info.tsx` (Library only).
- Housekeeping: comments that state retired facts: `getHostAvatarUrl` (`lib/avatar/seed.ts`), `resolveGalleryAccess` (several), `body-token-source.test.ts` (`lib/guest/session-cookie.ts`, `api/guests/route.ts`; the pin is `session-cookie.test.ts`), `claim-handle-prompt.tsx` on what the claim writes, `profile-slug-control.tsx`'s "EVENT slugs stay Pro", the root `not-found.tsx`'s glow, `contact-sheet.tsx`'s deleted file, `workers/backup/src/index.ts:296`'s "Cost & scaling", `share-urls.ts`'s "database-security.md0", and comments citing numbered rulings no doc holds (`upload-lock.ts`, `entitlement.ts`, `tiers.ts:181`, `request-facts.ts`, `preserve.ts`).
- Housekeeping: three applied migrations have no file in the repo (`reel_style_catalog`, `reel_style_catalog_drop_legacy_overload`, `reel_caps_ingress_multiplier_parity_reapply`): recover each from `supabase_migrations.schema_migrations` into `supabase/migrations/`.
- The lab: re-check `testing-verification.md`'s Browser-pane `resize_window` no-op traps against the current tool, which emulated 1440x900 for the systems lane.
- Profile: a confirmed account with no handle has no page, so the owner mode's likes and connections are unreachable for it (the events its uploads are in reach its dashboard as Guest cards); the setup at `/account/profile` and the dashboard's invitation put a page one guided step away, but an account that declines one still needs a home for them that needs no handle.
- The `/pricing` h1 (`GOLDEN_LINES.pricing`, "Start free, upgrade when you host again.") sells Pro as hosting again; redraw it on what one big event gains (a voice ask; `PRICING.md` holds Pro's case).
- The toast sweep: where a control can show its own result, no toast fires (65 call sites unreviewed).
- `help-palette.tsx` builds its own floating panel outside `src/components/ui` (a hand-worn `rounded-float` and `shadow-layer`), so `floating-layer.test.ts` cannot hold it.
- `/design/lab/proposals` and the `docs/specs` reader have nothing to show now (a board's argument lives in its `spec.ts`): retire the route and its `status.ts`, or keep it for a board that writes a document.
- Code hygiene: unmounted components (`ghost-grid.tsx`, `floating-add-button.tsx`, `event-filter-pills.tsx`; `filter-chips.tsx` and `tile-size-control.tsx` drawn only in the Library), three unused props passed to `EventCardQr` (`events-section.tsx`), and comments describing retired designs (`sonner.tsx` and `guest-masonry.tsx:35-38`, `masonry.tsx:180-182`, `globals.css:745-747`, `gallery-skeleton.tsx:15-16`, `enter-event-prompt.tsx:7-12`, `marketing-voice.ts:75`, `next.config.ts:106`).
- A real-device pass, an iPhone first: the file-picker upload end to end; the responsive Sheet's phone half with a focused input and the home indicator (it carries no `env(safe-area-inset-bottom)`; vaul's `repositionInputs` is the fallback engine for that half); whether the export's form-POST attachment saves on iOS Safari; the arrival choreography on a real gated event; Add photos' rows opening the picker from inputs parked in the page, and the keyboard-safe dialog over a real keyboard (account deletion's password, Report a person, the told name's form); the code screen with a real iPhone keyboard up (16px above it, measured with the keyboard state forced).
- Help: no article mentions the demo; a round picks that article's slug and audience deliberately.
- Help: `ArticleFeedback` records nothing (it calls no endpoint); a per-article count in `/admin` answers which articles fail (the `help-center` board's `feedback` ask shapes it).
- Help: `defaultAudience` (`lib/content/help.ts`) guesses host for two categories where most articles override it; a per-article audience pass.
- Design: teach `cn()` the two shadow utilities (one `theme: { shadow: [...] }` line in `src/lib/utils.ts`): tailwind-merge files them under shadow colour, so `cn("shadow-layer", "shadow-none")` keeps both.
- Design: `use-sortable-grid.ts` sets a hand-typed pick-up `box-shadow` from JS during a drag (allow-listed by name); it reads `var(--shadow-layer)`.
- Design: the surviving `text-[10px]` sites move to `text-micro` in any lane that opens their files (naming, not sizing).
- Design: the app's light mode owes its own answer for lit surfaces before any dark-versus-light work (the Aurora is dark-ground only).
- Design: a mark over media, if one ships (the shimmer is banked as a delight moment), needs from the glow engine a play-once sweep, a `runId` re-key for every shape (only a one-shot has one), an additive blend over a photograph, and `[data-glw-edge-rest]` under its travelling ring; `SectionLight` ships without a dither until the grain tile lands (ASSETS row 15).

The lab and the kit:
- `Several` (an option drawn as several screens: phones side by side on equal columns, laptops stacked and cut short) and `ScrollHere` (scroll a frame's sheet or page to the card a decision is about) were local to `event-safety` (in git at `99510977^`), and `voice-guest`'s `Pair` (at `438149ac^`) is the same idea as `Several`: front-door candidates, taken in by the first board that draws several screens per option or scrolls a frame to its card (`src/components/lab/index.ts`).
- The kit's `Frame` exposes its pixel height to children (a CSS variable): a percentage `min-h-full` inside a frame collapses to 0 px, so a full-bleed child reaches for `fixed` or a hard-coded screen height today.
- A bare `Frame` ignores the lab's Fit, so a 1920 frame stays 1:1 and the stage head's scale control seems dead.
- A `Frame` seeds its state from the parent's first render, before `useBoardState` reads the URL, and the correcting `lab:set` lands before the frame has hydrated (a board opened at `?ground=cinema` painted every card on the app's dark).
- A fully answered ask is unreachable by `?session=<board>.<ask>` even by a direct link (`_desk/queue.ts`'s `boardWork` walks only asks with no ledger answer), against `lab-demo.mjs`'s claim that an answered step stays measurable.
- `BoardSection` hands its board one unkeyed child, so a board effect keyed on a module constant freezes when the board's own control swaps the drawn option; the kit keys the child, or every measuring board threads a change token.
- A production hero mounted on a board arrives invisible until `Reveal` sees it (`PageHero`'s subhead and actions hold `data-mkt-cut`'s backwards state); the kit owes boards a settled-state rule.
- The dock draws every control as a pill row; above about eight options a select gives the dock back a screen (`ControlKnobs`, `board-state.tsx`).
- `.lab-dock` at 1280 and up keeps its note column's `14rem` floor beside a long option row (the column patch: `git show bb64f398:docs/tracks/overtaken.md`, Handoff).
- A lab `<breakpoint>:` utility loses to production's class on a shared element (layer order, measured in `design.css`), so a board writes its media query in its own sheet; compiling the lab as a superset of production's utilities that wins wholesale is a round of its own.
- The lab imports production modules the wiring lanes reshape (`git grep -l 'from "@/' 'src/app/(dev)'` lists them); boards on lab fixtures free a wiring lane to reshape them.
- Every standing board is an exploration, so `_desk/sample-spec.ts`, the desk's dry run and the catalog path only the fixture walks (`Catalog`, `Walk`, `defineBoard`'s page shape, the review grammar's `item:` clause) can go together (keep `/design/lab/sample`'s responsive-variant proof, or move it; `ItemVerdictRow` stays for the Library review below).
- `pnpm design:specimens`, so `specimens.generated.json` regenerates by name (today `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`).
- Mount `ItemVerdictRow` with `LIBRARY_VERDICTS` on a Library entry's page, so a scroll through the components fills `docs/reviews/_library.json`.
- Fold the gallery's `RefSection` into the shell's `Section` (one anchor shape).
- No Library specimen for `HowItWorksStepper` (a full-width section; a `gallery-demos` entry shows it) or `ui/toggle-group.tsx` (one product call site).
- No Library specimen for `PricingSheet`, `LockChip` or `WelcomeToPro`: a live demo would put a real Checkout door in the lab, so a static specimen once the gallery can mock the door.
- `/design/library/components` logs a next/image warning on a hero specimen (`mkt-wedding-golden-01.jpg`, `fill` with `sizes="100vw"` not rendered at full width); give that plate a real `sizes`.
- `/design/library/patterns`' `RouteErrorMock` still draws the old digest chip and no help line.
- `lab/tools/motion/motion-playground.tsx` names `/design/lab/rounding` as a specimen; point it at `/design/library/foundations#radius`.
- A few boards still fade `text-muted-foreground/N` by hand (`git grep 'text-muted-foreground/' 'src/app/(dev)'`); each moves onto `text-faint` when its board is next touched.
- Banked: the tucked-artifact card at 375 (the conference and trip cards, the artifact tucked above the copy floor) for a surface where a visual could tuck: `git show 9f5e6a76^:src/app/(dev)/design/sandbox/event-identity/cards.tsx`.
- The design lab on its own subdomain: a second Vercel project on the same code, and a `design.partyreel.com` mapping that rewrites the two route prefixes and `_data/legacy-routes.ts` in one place.

Marketing:
- The feature pages after the album one (curation, guests, privacy, QR, sharing), one ground-up round each in nav order, the album page as the model; the privacy hero's round four is on the desk.
- Marketing glass: the header's `GlassLayer`, the overlays and the set-pieces over photographs, onto the app's glass material (the banked Glass exploration across marketing and app); until then the nav labels sit at `text-muted-foreground` under the transparent bar and are hard to read over a bright cinema hero.
- `ScreenLamp` casts a full-bleed seam under the sharing and guests heroes where a screen's light is a pool; compose each its own light.
- Brand: the day the v1 icon lands (ASSETS row 19), one pass: `Logo`'s `markOnly` branch (a placeholder tile with no production caller), `src/app/icon.svg`, `favicon.ico`, `apple-icon.png` and `manifest.ts`, the reel watermark's badge and wordmark in `src/lib/reel/engine/canvas2d.ts` (its REAL-LOGO seam; the wordmark path can ride a `Path2D`), and the press kit (`scripts/build-press-kit.mjs` rebuilds the committed zip: the marks and the app icon, which show the retired Aperture glyph today, plus the wordmark in white and in ink, which the kit has never carried).
- A partners page with its own focus (planners and venues; Will reaches partners directly, with free Event Passes for upcoming couples), never shared with press, which folds into `/about`; until then planners read the site as hosts.
- Post-launch event types: `/events/birthdays`, `/events/memorials`.
- `/pricing` opens on paper but the cinema layout pins `themeColor: #040405`, so a phone's browser chrome is dark over a white first screen; the answer is group-level (the layout forbids a per-page `viewport`).
- Tab into the hidden header costs the reader about 482 px of scroll position (Chrome's scroll-into-view against a sticky element); a keydown-on-Tab return would pre-empt it.
- The phone sheet's foot actions (Log in, Start free, Dashboard) carry no `trackAttrs` while the header's do.
- `navigation-menu.tsx`'s cross-slide still spells `data-[motion=…]` inline; swap it onto `floatingCrossSlide` (identical values).
- The mega panel hand-writes a description per event type beside `EVENT_TYPES.teaser`; one source, in a lane that owns `marketing-nav.ts`.
- `src/lib/constants/events.ts` sits outside the content policy's claim scan.
- The blog's tags: the family-reunion post carries `parties` while its subject reads as a trip, and `blog-tags.ts` has no `trips` tag; `guest-album-for-photographers-and-planners`, `wedding-album-password` and `wedding-photo-sharing-app-vs-shared-albums` carry an audience tag and no link into a type page.
- The blog's follow-ons: real `/blog/page/[n]` routes; a "Start here" strip past about 40 posts; the featured card's eyebrow as the post's purpose; a founder-voice post (Will's pick first); the `compared` posts re-verified on each refresh.
- The EXIF claim's "for the common formats" clause is missing on its last two sites: `features/privacy/never-rides-along.tsx` and `constants/feature-pages.ts`.
- The legal pages carry no print styles (only the glow engine carries `@media print` and `forced-colors` rules; copy its pattern).
- Inline code in help and blog prose has no plate (the wrappers set it sans and nothing else); give it the muted plate.
- `SectionShell`'s subhead carries no size class (16 px inherited) while `PageHero`'s rides the `subhead` step; put it on the ladder.
- /qr's pull quote (`features/qr/print-shop.tsx`) is the last flat `text-3xl` figure, a `font-heading` paragraph the heading scan does not read; give it a step by role.
- About 26 `bg-muted/N` sites in marketing become sections carrying `.surface-mat` (declared, worn three times).
- An a11y pass on `--faint` (about 3:1 on the page and the mat): the sites that read as body copy move up a step.
- `live-demo.tsx`'s mock panel wears a literal `rounded-[14px]`; the token its role calls for.
- `MediaTile` serves the marketing stand-ins' source files (about 2 MB each into a 287 px tile, 16.8 MB for the album hero), so marketing stills want a derivative.
- `HERO_FIXTURES`, `HERO_FRAME_H` and `HERO_SEED_COUNT` (`album-fill-fixtures.ts`) serve only tests: fold them into the tests or delete them.
- The home's how-it-works passage renders as `id="how-it-works"` while `section-ids.ts` and its file still call the slot `film-strip`; rename both, with `index.ts` and `home-sections.test.ts`.
- The cinema and paper 404s (a `notFound()` inside a marketing route) render in a fixed `min-h-[60vh]` box with the tile strip while the root 404 fills the screen with the trail; one grammar, or rule the root the only one with the trail.
- A 404 reached through a dynamic marketing route (`/help/nope`) carries the bare `Partyreel` title while the root and paper 404s say Page not found.
- One copy-with-a-receipt primitive for `marketing/press/copy-button.tsx` and `shared/error-digest.tsx`.
- The careers form and `/contact` are two parallel copies of one contract (validation, limiter, insert, receipt): one contract, a honeypot named for nothing real (today `website`), and an end-to-end test for the actions (none exists).
- `sections/careers/contact-sheet.tsx` and `press/press-sheet.tsx` are photography proof sheets named like contact surfaces; rename them when next touched.
- The hero's warm-up (the lamp arriving neutral and warming into the wall) is built and pulled; it returns when Will can judge the swap on a visible screen.
- The QR-to-album handoff wants its own ground-up visual round; the pour (photographs leaving one object and landing in another) is banked for a real "photos dump here" moment.
- The backdrop's entering photograph could offset with pointer speed (one line in `backdrop-engine.ts`).
- A swipe row of cards (`snap-x`, the next card peeking) for a future gallery-type section, never the plan cards.
- The footer's AI assistant row drops to ChatGPT alone if first impressions warrant (Claude's `?q=` prefills without submitting).
- `/features/album`'s h1 is the one of six that wraps to three lines at 1440 (44 characters in `max-w-3xl` at 80 px); shorter copy is Will's call.

The app:
- Host: `lib/shared/use-active-section.ts` and `event-feed/event-filter-pills.tsx` lost their last importer with `event-feed.tsx`; delete them, and the comments that still name `event-feed-action-bar.tsx` (`bulk-tools.tsx`, `bulk-select-mock.tsx`, `floating-layer.ts`, `type-ladder-policy.test.ts`).
- Guest: the last-removal line reads the album's fullness at render (`albumFull`, the page's second gate read); an album that fills or frees mid-visit keeps the old line until a refresh (the poll could carry it at one gate read per poll).
- Social: `social/guest-list.tsx:216` draws "A guest" for a null `displayName`, a label the product retired (a nameless credit shows nothing).
- Host: no test covers `useReviewTriage`.
- Host: the gallery doorbell rings only when the approved-visible set changes, so a pending upload never wakes the host; the hub's store bridges it by polling the host's version (12s with the socket down, 60s up), which a host channel rung on every arrival (a migration on `media_gallery_doorbell`) would make instant.
- Host: the event settings sheet as a board once the lab revamp lands: its sections (a Media group for the uploads and the reel, from Will's "maybe media in general", 2026-09-25) and one save model (today one Save button beside instant-save cards).
- Host: a size sort (largest or smallest first) beside Newest and Oldest first, the host's way to the heaviest files (Will, 2026-09-22); it needs a size the album's manifest does not carry yet.
- Host: empty states draw "nothing here yet" four ways (`shared/empty-state.tsx`, `dashboard/empty-section-teaser.tsx`, `dashboard/events-empty-teaser.tsx`, `event-feed/feed-section-empty.tsx`) and the Likes section two ways for one interaction (`EmptySectionTeaser` when the server knows it is empty, `my-likes-gallery.tsx`'s bare `EmptyState` after the last unlike); one grammar (`empty-state.tsx`'s comment calls `quiet` the default while the code defaults to `icon`).
- Host: the ghost pack's file list is built three times (`guest/gallery-empty-state.tsx`'s `GUEST_GHOST_FRAMES`, and a list each in `dashboard/events-empty-teaser.tsx` and `dashboard/empty-section-teaser.tsx`); one exported list.
- Host: `guest/file-dropzone.tsx` is rendered only by the host's manual add (`app/host-upload.tsx`), and its "Tap to choose, or drag them here" is half wrong on a phone; move it to the host's side and word it for a hand.
- Host: one label for creating an event (the dashboard says New event, the empty teaser Create your first event, the welcome Create my first event, the app's 404 Create an event).
- Host: the wizard's QR swatches encode `/e/` plus 32 zeroes (`previewJoinUrl`), a 404 when a host test-scans one; say they are samples, or encode the real link once the event exists.
- Host: the hub's header at 375 is unmeasured against "immediately visible at the top of the page"; if the cards row does not clear the fold, the header compresses (the code to about 96, the metadata folding) before anything is cut.
- Host: the restore toast never reads `mediaStillRemoved` (`restore-event-button.tsx`), so an event restored with media still removed says nothing of it.
- Host: bulk Restore-all and Empty-bin for the recovery bins.
- Host: cross-gallery sort and filter for the Uploads section (`get_my_uploads` is filter-ready; a like-count sort).
- Host: help deep links from the app (settings to their articles); the user menu and the 404 are its only `/help` links.
- Account: the existing-account notice for a magic link (the other half of `existing=tell`): a one-line banner on `/dashboard` when Create account signed an existing address in (`checkExistingAccount`, `(auth)/actions.ts`, is the shared rule).
- Account: the signup's Pick a password step (`password-sign-in.tsx`) has no strength meter while `/account`'s change form wears `PasswordStrengthMeter`.
- Routes: `/account`, `/welcome` and `/u/[slug]` carry no `loading.tsx` (the profile awaits an RPC and two presign rounds before it paints).
- Profile: the event cards presign the cover's original (`queries/social.ts` reads `original_key`: 1920 wide, multi-megabyte, `loading="lazy"`), so a card paints black for seconds where the preview derivative the dashboard's cards read lands at once.
- Profile: an attended card whose guest added only video draws `EventCard`'s lock fallback (`href: null`); it deserves its own empty face.
- Profile: three hand-rolled toggles do one job (`FollowButton`, the profile menu's block, the Connections card's buttons); one control, one contract.
- Profile: the overflow menu opens over the person's own name at 375.
- Profile: `src/lib/validation/report.test.ts` has no person-arm cases (both subjects, neither, a cross-subject `media_id`).
- Guest: a name-only guest whose session drops re-joins on the same device as a second guest row with the same name, so the guest list shows one person twice; key the re-join on `pr_device_id` (the same row) or de-dupe the list by name and device (Will's to pick).
- Guest: `get_event_by_qr_token` does not return `events.max_upload_bytes`, so the upload sheet's terms line states the product's limits rather than the host's own cap; add the column (with the types and `queries/guest-events.ts`) and `uploadTermsLine`'s `capBytes` seam takes it.
- Guest: the album, the door and the report dialog carry no link to `/help` (only the guest 404s do).
- Guest: the media viewer's own image and video have no loading state (a tile has a skeleton; the opened photograph pops in when the full-size presign lands, the slowest picture in the product on venue Wi-Fi).
- Guest, the demo: the per-tile Save and Share and the export routes enforce no `isDemo` server-side (the guest export serves the demo album in full; the UI hides the rest); decide whether the demo's capability token carries a read-only claim.
- Exports: the mint has no timeout and no cancel (a hung request leaves the toast spinning and Download disabled until a reload), the dialog prints raw integers ("2440 items"), and the album's bulk Download mints with hidden items in and no confirmation.
- Exports: the Worker skips an R2 object it cannot find in silence, so an album emptied between mint and stream downloads as a valid, empty zip; a failed-export state.
- Exports: zip follow-ons: an async build-to-R2 job past the cap; a custom `export.partyreel.com`.
- Media: preview-variant follow-ons: a server-side backfill for pre-feature media; preview bytes on the storage meter; the admin moderation feed's preview; AVIF if quality demands.
- Media: the client-side strip fails open on HEIC/HEIF/AVIF (item-based ISOBMFF) and WebM (EBML), and a JPEG's MPF secondary images keep their own Exif; strip those.
- Media: forensic capture follow-ons, all gated: the pre-strip client-side EXIF capture (counsel-gated), proactive hashing at scale, widening the CSAM scanner past proxied traffic ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)).
- Admin: `/admin/forensics` renders no per-upload identity (neither the typed name nor the unproved address reaches a table); an uploader column on the held-media table needs `listHeldMedia` (`queries/forensics.ts`) to read it.
- Admin: `/admin/reports` cannot reach a reported person's account (suspend, clear a bio, remove a handle), so the operator acts out of band and only closes the report.
- Admin: `report_status`'s `reviewed` is written by no code path while the marketing and legal copy promise every report is reviewed; a verdict writes it, or the promise changes.
- Admin: `ModerationGrid` imports live server actions at module scope; take the action as a prop, as `TriageStatusControl` does.
- Admin: `DistributionChart` hard-codes `YAxis width={28}` (`metrics-charts.tsx`), so a four-digit tick renders as its last three digits the day a count reaches 1,000.
- Admin: the MFA enrolment secret (`admin/mfa-enroll.tsx`) is a bare `<code>`, so preflight sets it in the mono stack; `font-sans`, or the muted plate.
- Admin: `/admin/exports` has no heartbeat (exports sit outside the jobs catalog).
- Admin: "Check the runbook" (`admin/not-found.tsx`, `HELP_BY_AREA`'s admin row) is plain text until a runbook page exists for the operator.
- Admin: an immediate hard-purge for egregious content in `/admin/albums`.
- UI: `ui/drawer` and `ui/tabs` have no product caller (adopt or retire them), and `action-tooltip.tsx`'s comment claims a 200 ms root delay the provider sets to 0.
- Errors: `/dashboard/<not-a-uuid>` crashes into the app's boundary with a Postgres `22P02` (two server events and one `render:app` per visit) where `notFound()` is the truth; `getEvent` (`queries/events.ts`) refuses a malformed id before the query.
- Errors: a `render:root` Sentry area, so the root `error.tsx` and `global-error.tsx` stop sharing `render:global` (`observability/sentry.ts`, `route-error.tsx`).
- Errors: a `?boundary=global` probe mode that crashes the root layout: `/design/lab/tools/boom` lands on the root boundary, so `global-error.tsx` has no probe.

## Major overhauls (each its own planning round; drop related deferred tasks here)

- **Generated media: one Higgsfield month.** Every image and every video on the site is generated inside ONE paid month
  once more of the site is shaped, landing before launch: the 12 stand-in stills in every marketing page's chrome, the
  blog's OG cards and RSS feed, the conference and trip stills, the demo event's album, and every open
  [`ASSETS.md`](ASSETS.md) row.
  - Its agent opens with deep research into Higgsfield's tooling and prompting (Soul 2.0 and its moodboards, Soul ID, the video models) and writes every final image and video prompt itself; an ASSETS row names the slot and what a frame must survive, never the picture.
  - Before buying, it sweeps ASSETS for every image and video ask so nothing needs a second month, and it runs question-first: the look as round one, each slot's frame staged after it.
  - Re-check the plans at the start (last read: $19 / $59 / $129 a month for 270 / 1,200 / 3,000 credits; a Soul 2.0 image costs 0.12 credits, so the video decides the tier; Plus's free images and unlimited Kling are website-only; the MCP spends credits).
  - Outputs stay ours after cancelling but are not exclusive, and Higgsfield may train on them. The AI disclosure is one sentence at the end of the Terms' Disclaimers and never a mark on an image; no row, field or test tracks where an image came from.
- **QA hardening: the remaining fix queue.**
  - #13 a `presign` abuse kind (`action_attempts` is kind-generic; it needs the `Retry-After`/429 vocabulary the pipeline lacks).
  - #37/#38 persist the pagination cursor for the backup reconcile and the orphan sweep: both restart at the bucket head every run, so nothing past the per-run cap is ever examined.
  - Replay a dead letter from `/admin/jobs` (the DLQ has no consumer, and adding one in `wrangler.jsonc` changes delivery semantics).
  - A per-day `job_signals` aggregate once `sent_emails` outgrows a 24-hour head-count (the `sent_at` index first).
  - A dedicated `JOB_API_SECRET` instead of reusing `PRUNE_API_SECRET` as the internal-jobs bearer (three env homes, a Worker secret and a GitHub secret).
  - #44 say whether the `preservation/` prefix (legal-hold evidence) is backed up: the backup Worker copies `events/` only.
  - Cache `.next/cache` in CI if the wall time bites (only the pnpm store is cached).
  - A report-only CSP, then an enforced one (a per-request nonce through the streaming render and an inventory of every inline style; its own project), and `X-Frame-Options` / CSP `frame-ancestors` once that question settles.
  - Sweep the dynamic app routes for the JSX landmine: a text node holding an HTML entity loses its leading space, so a bolded lead-in glues to the next word; no lint or test catches it.
  - A `deletion_requested_by` column, so an operator-triggered deletion is distinguishable from a self-serve one.
  - #11 the >90-minute presign-roll soak and #12 upload retry, fixed in code and never verified live (the soak traps are in [`systems/testing-verification.md`](systems/testing-verification.md)).
- **Notification system** (the foundational features come first, so it knows what needs notifying; the extension point is [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md)):
  - The announcements overhaul, with per-item announcement un-read toggling.
  - New bell signals: link-activity "new since last seen" deltas; billing `past_due` alerts (a denormalized flag on `profiles`).
  - A durable per-item feed and real-time push.
- **Admin deployment:** its own Sentry project (it shares `partyreel`'s DSN).
- **Admin / operations portal** ([`systems/admin-observability.md`](systems/admin-observability.md)):
  - Its look, one exploration once the app work settles: a dashboard with the F1 film's own UI as Will's reference (never a generic F1 look): minimalist, dense without crowding, alive with motion graphics, and real colour in the charts in both modes (`--chart-1..5` feed only admin, so `loose-ends`' two chart asks fold in here).
  - The portal at a phone, for an operator glancing at health away from a desk.
  - An operator-action audit log: what was done, by whom, with an Undo where one exists (`admin_actions` is a proposal).
  - Per-announcement edit and read receipts.
  - Live Stripe subscription health on the account detail.
  - At very large scale, the prune and reconcile bucket scans move to a merge-join, a deletion tombstone or a shared copy-state index ([`systems/durability-backups.md`](systems/durability-backups.md)).
- **Vercel / Next.js optimization:**
  - Dashboard Suspense streaming, deferred post-launch: completions died inside radix `TabsContent`, and boundaries outside it displayed but never hydrated on this page while the guest page's identical shape works; revisit in the PPR / `cacheComponents` era, with `/design/lab/tools/stream-probe`, the blocking page and `loading.tsx` as the baseline.
  - The `(app)` dashboard's first-load latency (about 1 to 3 s to hydrate: the layout fans out `getUser`, notifications, profile and avatar, then the page adds events and storage).
  - Front Vercel with Cloudflare: DNS sits at GoDaddy, and the move gets its own runbook (the nameserver switch, the three `_vercel` ownership TXTs, Resend's SPF/DKIM/DMARC records, the apex, `www` and `admin` records, proxying off for Vercel-hosted names).
  - A Vercel Spend-Management hard cap and alerts.
  - Revisit the `proxy.ts` per-request `getUser` matcher scope.
  - A large-gallery presigned-read strategy (per-media proxy or pagination beyond the stable buckets).
  - The Realtime concurrent-connection quota (one socket per open guest tab) at launch scale.
  - `cacheComponents` / `"use cache"` adoption post-launch (the deferral's why: [`systems/architecture.md`](systems/architecture.md)).
- **Emails: one exploration once the features settle** (the extension point is [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md)). Nothing new sends before it, and the policy is right from the first send so nothing lands in spam (Will, `emails` r1). His picks are its ground:
  - A transactional-email automation system.
  - The identity mail (`moments=identity`): one mail after a guest confirms at the keep while other events wait under her address, in the dashboard banner's own words.
  - The guest's one-shot "here is your album" mail (`guest=link`): only to an unconfirmed address on a row with a completed upload, capped per event, one time, through `sendOnce` with kind `guest_event_link` and dedupe `guest_id`, carrying a "this wasn't me" link that detaches the address.
  - The let-in mail (`letin=left`), with the join doors: sent only when she has left, meaning her waiting door has stopped checking in (about 30 s quiet) at the moment the host lets her in; a door still checking in simply opens.
  - The reports queue's Ask for proof mail: `ops_flags.report_proof_mail_enabled` stays off until this round and is switched on in it, never before (Will, 2026-09-30).
  - The reporter's closing note (`reporter=note`): one mail as a report closes, the same words whatever was decided ("We've handled your report about …. Thank you for telling us."), with who sent it kept only until then.
  - The sign-in code mail, a Supabase template (`code=promise`): the code first, easy to copy, and a primary button beneath as the one-tap way in ("Tap to confirm"); iOS fills a code from Mail when the digits sit beside the word "code".
  - Newsletters and updates from "Will @ Partyreel" (his `sender` note). Some filters read an "@" in a display name as a spoofed address; "Will at Partyreel" says the same.
    - Marketing is the one kind of mail that needs a postal address (a PO box or a virtual mailbox), a working unsubscribe and consent.
    - The first send carries the unsubscribe, since a signed-out subscriber has no removal path (an account holder has `/account`'s switch), and a one-click `List-Unsubscribe` header (RFC 8058); the renewal nudge's unsubscribe opens the signed-in switch until then.
  - The invite mail: guests invited by Partyreel itself (an email or a text on the host's behalf), beside the share-sheet Invite that sends nothing; its spam and deliverability rules come first.
  - The develop mail: a disposable roll's reveal calls its guests back ("your roll developed"), the return moment Will named in `disposable-mode` r1.
  - A direct test for `sendOnce`'s claim-then-send dedupe (a mocked Resend, or a rolled-back Supabase-MCP check).
- **The support-automation arc:** a help chat before launch (bottom-right, answering from the help center and the site on a cheap AI Gateway model, rate-limited under a spend cap, its cost to Will before any spend; Libraries.dev's agent-interaction effects, access asked at the cut); AI-default first responses keyed on `contact_submissions.topic`, and auto-routing rules in `/admin/support` (a topic is a pipeline); published language keeps committing to outcomes only (the promise-neutralization doctrine, [`systems/marketing-content.md`](systems/marketing-content.md)).
- **The AI-SEO content arc:**
  - `.md` mirrors of key pages (the llms spec's optional convention).
  - The `/u/[slug]` sitemap and robots decision (a profile publishes nothing until its owner chooses; a slug feed).
  - A WebSite `SearchAction` (it needs a real `?q=` route).
  - AI-referral analytics (UA-tagged hits on `/llms.txt`).
  - `FAQPage` JSON-LD per help article (each is a clean question-and-answer pair).
- **Billing follow-ons:**
  - Grandfathering at the first price change: the policy is in [`PRICING.md`](PRICING.md) "Grandfathering"; the build maps several historical Price IDs per plan in `planForPriceId`, the newest being the public offer.
  - Per-pass dashboard management: which stacked pass a renewal extends, per-pass expiry rows in the storage meter (today the soonest-expiring one renews, billing-caps.md).
  - Revoke the latent table-level TRUNCATE, REFERENCES and TRIGGER grants `anon` and `authenticated` hold on all 22 public tables (Supabase's default grant; PostgREST issues none of them, so none is reachable) in the next security pass.
  - Revoke the PUBLIC EXECUTE `get_event_by_qr_token` carries through its recreates (anon, authenticated and service_role hold it explicitly), in the same pass.
- **Share studio (QR and share-content configurator):** an in-app generator for polished share outputs, so hosts never build their own; it builds on the QR designer in the share sheet and doubles as a growth lever (every output carries the QR).
  - A disposable event's own wrapper as its printed table card and poster: the camera and the code wearing one design (from `disposable-mode` r2).
  - A gallery of printable QR designs to pick from (the print stock ships in one design).
  - Card presets (minimal ink and photo-backed), and stock cover images per common event type plus generic sets (hosts rarely have a cover before the event).
  - Toggles for the link, the date and the cover; phone and story formats beside printable ones; several file types; drag-and-drop placement as the stretch goal.
  - The share sheet grows sections for posters and an invite when they exist.
- **The reel:** the stretch shipped in milestone 29 (guest, host, clip, teardown, sweep, the stored reel's drop); what is left is `reel-marketing` after his `reel-story` r2. Ideas at zero storage, since a reel is a recipe:
  - A host featuring one clip on the album, and a shareable clip link.
  - Host pins that open each loop.
  - The uploader's own video window (a trim on `media.clip_start_seconds`/`clip_end_seconds`).
  - A screen link that bypasses the host sign-in (a capability of its own).
  - A counted client event for clips made per event (no server write exists, by design).
  - Drop the dormant `media.highlight_score` and `clip_*` once the round settles (their names sit in the host's column-scoped select list, so the drop edits that list in the same commit).
- **User profiles and social discovery** (not launch-gating; the consent one-way door is decided in [`systems/profiles-social.md`](systems/profiles-social.md)):
  - The social feed and discovery (depends on the Notification system).
  - Guest-list sort by upload count (a nudge to contribute).
  - The follow graph has no consumer worth the graph: the Following chip left the dashboard and no query reads your followers or the events of the hosts you follow; a followed-hosts feed is new work.
- **Lab explorations no board asks yet** (each is a board when a seat frees; its brief rechecks the desk for overlap first):
  - The host's own words on a Public album's welcome (the event's description, in her voice) (from `locked-door` r2).
  - The privacy hero's two runners-up, kept: the sweep (tiles clearing in one pass of light) as a generic hero's foundation, and the aperture (a blurred photograph breathing in a hairline ring), polished, as a minimalist CTA card's background (their code: `git show cdc979a6:"src/app/(dev)/design/sandbox/privacy-hero/concepts-layer.tsx"`, `SweepConcept` and `ApertureConcept`, with `concepts.ts` and `concepts.css` beside it).
  - Finding one photograph in a thousand (sort, date, person, kind), in the guest album and the host gallery.
  - What an album becomes weeks after the party, since events never end (a keepsake, an anniversary, a nudge to export), narrowed away from `export-flow`.
  - What a host learns about their own event (views, contributors, the photograph everyone liked).
  - The product with a keyboard and a screen reader, end to end.
  - Which surfaces have a dark mode, who can switch, and what a guest gets.
  - One card family for every shared link (the OG routes), and what a shared album's card shows.
  - What a like is here: who sees it, who is told, why the counts are the host's.
  - Whether an album installs to a phone, and who is ever asked to.
  - A failed card, a lapsed pass and a cancelled subscription, as surfaces.
  - The in-app notifications' design (the bell, its panel, a state signal versus one that clears), beside the Notification system bucket.
  - The marketing reading surfaces, one board each: a feature page's shape and `/features` as an index; the blog's index and article; Privacy and Terms made scannable; `/about`; applying, from the role page to the operator's inbox; what an AI reader is handed (`llms.txt`).

## Launch checkpoint (far off — a bucket; tasks get assigned here, handled together at launch)

**The clean launch point** ("launch when everything's done"): every published claim is true, every promised path
exists, every backend job is operable from `/admin`, and the switches below flip in a known order with nothing else
pending. Open on the agent side: the two help-catalog gaps left (the restore toast, the report promise), the EXIF
clause's last two sites, legal pages that print, the marketing site at phone widths, the demo event on curated media.
**The `[human]` switches, in order:** counsel sign-off, the DMCA agent, the `privacy@` and `help@` mailboxes →
`LEGAL_PARTY` and both documents effective → Stripe live (the 4 products and 8 prices, the live webhook, the default portal
without plan switching and the change-plan configuration re-created with its `partyreel_purpose=change_plan` tag, the
10 env values, one real-card smoke) → Vercel Pro (the analytics vendor, the
Spend cap, Cloudflare fronting and CSAM scanning at the DNS move, the Realtime quota) → secrets Sensitive,
leaked-password protection, the Sentry alert rule, one DB-backup test-restore → the test-data reset, the demo token
repointed, `PRUNE_MODE=live`, "Allow new users to sign up" back ON (off until launch, so only test accounts exist) →
the program teardown.

- A demo event set and ready on every environment: nothing guards `NEXT_PUBLIC_DEMO_QR_TOKEN` (inlined at build), so a deploy without it ships a footer without the code.
- Enable leaked-password protection (HaveIBeenPwned) `[human]`: not Pro-gated, so it can flip any time; the long-standing advisor WARN.
- Enable passkeys `[human]`: the Supabase dashboard (Auth) with the RP id on the apex, then `NEXT_PUBLIC_PASSKEYS=1` (the account page's card is wired and dark).
- Raise Supabase Auth's email rate limit `[human]` (100 an hour project-wide; Authentication, Rate Limits) before a large Require-verified-emails event: a 150-guest door in one hour outruns it (the door names the refusal, and the switch is the host's live valve).
- Pick the web-analytics vendor at the Vercel Hobby → Pro cutover `[eng+human]`: Hobby collects pageviews only; Pro activates the wired custom-event taxonomy but bills usage. PostHog gives 1M events a month free, then $0.00005 an event ($50 a million) against Vercel's about $30 a million, and past about 15M events a month its volume tiers ($0.0000295) undercut Vercel, with funnels and session replay beside; the others are Cloudflare Web Analytics (free, shallow), self-hosted Umami and GA4 (free, with a consent banner and ad-block losses; the move if Google Ads enter). The swap is one file (`src/lib/analytics/web.ts`, [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md)); the same pick decides whether `(app)` mounts the delegated click listener (its `trackAttrs` are inert today).
- Google's account chooser says "to continue to ddafaemglzmuekbtjwzn.supabase.co" and points at that host's policies (a launch-trust question, Will's call): a custom auth domain (Supabase's custom domain add-on, a recurring cost) or the OAuth consent screen's branding, checked against Google's current rules first (from milestone 30's production pass).
- The legal pass, once, right before launch (Will, 2026-09-29): the Terms and the Privacy Policy rewritten whole against the shipped product and its system docs, then counsel signs the result. Until then they lag production, since signups stay off; no lane edits or drafts them, and no milestone waits on them. The drafts gathered so far are a start: the Questions in `git show 5d8c57c9:docs/tracks/safety-wiring.md` (the guest list always on, the host's block and its kept address) and `git show c6bd5f5f:docs/tracks/triage-wiring.md` (the reports clause), the private count's sentence, and a reporter's confirmed address kept only until the report closes (admin-triage r2's `proof=confirm`).
- The counsel sign-off gate `[human]` ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)): the privacy policy's and the Terms' forensic-capture disclosure (IP, UA, geo and device UUID per upload), the CSAM incident runbook and NCMEC registration ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)), the retention schedule (media-lifetime rows, one-year preservation), the pre-strip EXIF capture go/no-go; the eight-item checklist: `git show 44090827:docs/decisions/t1-forensic-csam-policy.md`.
- NCMEC CyberTipline ESP registration `[human]` (the prep note is in trust-safety-forensics.md); if denied, report actively anyway.
- Enable the Cloudflare CSAM Scanning Tool at the DNS move `[human]`: free, and it scans only proxied traffic, so it cannot see presigned R2 media (say so plainly; trust-safety-forensics.md "NCMEC registration").
- Stripe test → live `[eng+human]`: re-create the 4 products and 8 prices in live (three Pro products carrying six recurring prices, monthly and annual each; the Event Pass product carrying the two one-time prices), named WITHOUT the em-dash the test products carry (those names render in Checkout and the portal), and swap the 10 env values (code unchanged); the runbook is [`PRICING.md`](PRICING.md) "Stripe setup".
- Verify a change-plan session `[eng]` at the live cutover, the walk that passes in TEST: a Pro Checkout provisions Pro through both webhooks; Change plan opens Stripe's confirm page for one price at quantity 1; Back returns to the app; Confirm bills the proration and the webhook raises the cap.
- Revisit the paid-ingress `INGRESS_CAP_MULTIPLIER` (3× the storage cap, billing-caps.md) before the Pro launch `[eng]`: confirm it holds at real scale.
- The monthly ingress meter's operator surface `[eng]`: nothing in `/admin` shows a host's meter and nothing can lift it, while `PRICING.md`'s posture is that a false positive must never quietly block a paying host; beside the multiplier revisit.
- Legal go-live `[human]`, after counsel signs: (1) fill `LEGAL_PARTY` in [`src/lib/constants/legal.ts`](../src/lib/constants/legal.ts) (entity, state, address, DMCA agent) and flip both documents' `status` to `effective` with an `effectiveDate`; `legal.test.ts` refuses a bracketed placeholder once effective, and the flip needs one line of that test (the rehearsed diff: `git show b19e008e^:docs/tracks/legal-billing-truth.md`, Handoff); (2) register the DMCA designated agent with the Copyright Office ($6, renewed every three years) so the Terms' safe-harbor section is true; (3) create the `privacy@partyreel.com` mailbox both documents name, routed to the support inbox.
- Swap the demo event to curated media `[eng+content]`: repoint `NEXT_PUBLIC_DEMO_QR_TOKEN` to a dedicated event with approved media (ASSETS row 5).
- A committed automated RPC integration suite `[eng]`, replacing the per-change rolled-back MCP checks: blocked on `SUPABASE_DB_URL` (the SESSION string on port 5432, never the 6543 transaction pooler) in the three secret places `[human, 15 minutes]`, then a `postgres` devDependency and a third vitest project whose include skips cleanly when the var is unset, so `pnpm test` stays green without it; every test runs BEGIN, exercises the RPC under `set local role`, asserts, ROLLBACKs, then re-asserts row counts. The fully isolated alternative is the Supabase CLI with the Docker local stack (pre-wired in `supabase/config.toml`, db 54322), picked only if production-DB test traffic ever becomes uncomfortable; detail: `git show 44090827:docs/decisions/rpc-suite-blocked.md`.
- Confirm the Sentry email-alert rule fires `[human]`.
- Configure the app project's Vercel firewall `[eng+human]`: no custom configuration exists (the API answers "not found"), so volumetric abuse meets only the defaults.
- Set `crons.disabledAt` on `partyreel-admin` `[eng]`: a second stop behind the purge route's surface guard, so the admin project never runs the purge cron.
- The pre-launch test-data hard reset `[eng]` (the deletion-aware prune ships, so no timing constraint remains).
- Flip the backup prune to live `[human]`: set `PRUNE_MODE=live` in `workers/backup/wrangler.jsonc` and redeploy once the primary is populated (it ships in dry-run, deleting nothing), with the shared `PRUNE_API_SECRET` set in Vercel and by `wrangler secret put`; see [`systems/durability-backups.md`](systems/durability-backups.md).
- Revisit the git workflow for production `[eng]`: when the program ends, decide the standing workflow (straight to `main` for speed, or branches and PR previews once real users arrive).
- **The elevation-program teardown** `[eng]`, when the program's final milestone merges: re-enable Vercel SSO deployment protection (`ssoProtection: all_except_custom_domains`); delete the temporary Stripe TEST webhook endpoint `we_1U1I3GPtjqmVkBwkjUqWGpvR` (the launch-prep preview endpoint; it must NOT survive into the live cutover); remove the preview origin from the R2 `partyreel` bucket CORS and the Supabase auth redirect allow-list; remove the branch-scoped Vercel env vars (`NEXT_PUBLIC_SITE_URL`, `STRIPE_WEBHOOK_SECRET` at launch-prep) and every `DESIGN_PREVIEW_KEY` row on both projects (Production, the unscoped Preview and launch-prep; the two Production rows still hold the old value); delete the `launch-prep` branch and the `lp/*` remnants; decide the post-program fate of the `lp/*` build gate (`vercel.json` `ignoreCommand` → [`scripts/vercel-ignore-build.mjs`](../scripts/vercel-ignore-build.mjs), part of the git-workflow item above); and revert CLAUDE.md's git section to the post-program rule.
- Close the AWS Remotion sub-account (console) `[human]`: the reel renders on the device, so the sub-account under `partyr33l@gmail.com` (the `remotion-lambda-role` / `remotion-user` IAM and the deployed Remotion site and function) has no use.
- Toggle the critical secrets to Vercel "Sensitive" `[human]`: pre-launch every env var is non-sensitive so values stay swappable; at launch the Supabase service-role key, Stripe and its webhook, `CRON_SECRET`, `PRUNE_API_SECRET` and `UNLOCK_COOKIE_SECRET` flip to Sensitive.
- One DB-backup test-restore `[human]`: prove the backup restores before it is the only copy.
- The `help@partyreel.com` mailbox `[human]`: the help center and the documents name it; confirm the receipt path once it exists.
- The marketing site tuned at phone widths, judged on Will's phone `[eng+human]`: every round so far was judged at desktop.
- A per-account throttle on the deletion request `[eng]`: beyond Supabase Auth's own OTP limits it is unlimited; it needs a live session plus a password or an emailed code, so the exposure is a borrowed session rather than a stranger, and the throttle is cheap insurance.
- Submit the apex to the HSTS preload list `[human]`: a one-way door for the domain and every future subdomain (`max-age` already meets the list's requirement; the header ships without `preload` on purpose).

## Speculative / longer-horizon backlog

Bigger ideas that need product reshaping or a decision before they are roadmap-ready (co-hosts, a referral program,
guest-to-full-user conversion, host 2FA, proactive CSAM filtering, NSFW and host trust-level configs, a content CMS, a
Backblaze B2 cross-vendor backup tier, …) are tracked **outside these docs** to keep this file to actual upcoming
work. Pull one in here (as a Now task or a new overhaul bucket) when it is ready.
