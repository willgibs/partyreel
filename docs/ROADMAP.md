# Partyreel — What's next

> ROLE: what might be next, in five buckets: Immediate (the next lanes), Upcoming (concrete, queued behind it), Before
> launch (bigger work, each its own round, weighted by PROGRAM's "The order to launch"), Launch (the launch round's
> switches) and After launch (post-launch work, ideas and maybes). · NOT HERE: how a system works (→
> [`systems/`](systems)), what shipped (→ `git log`; a merge commit carries its lane's summary), where things stand (→
> [`STATUS.md`](STATUS.md)). · GROWS BY: one line per task, placed by `usher/kit/record.py` in its bucket and area
> (never appended to a pile), present tense, at most a one-line why; a line moves when its urgency changes and is
> deleted the day it ships or is dropped (git keeps it).

**Provisional.** A line is a candidate, never a spec or an invariant, and it never bends today's implementation; it
becomes real when a plan picks it up. The don't-revert layer is [`systems/`](systems).

**Immediate holds at most 40 lines** (`record.py` refuses one more, and `record-depth-policy.test.ts` holds it): a line
moves to Upcoming before another lands. Within a bucket the areas run foundation upward, from the platform and its data
to the surfaces built on them. A line marked `[unsure: …]` is real but its want is Will's to confirm.

## Immediate

### Platform, data and cost

- Docs: a prune pass over `PRICING.md`, `systems/billing-caps.md`, `systems/reel.md` and `PRD.md` by CLAUDE.md's "Keeping the docs healthy" (docs-prune counted about 92 history and restatement lines there on 2026-10-04, never applied) (scratch-synthesis).

### Security and abuse

- Auth: around 19:19Z on 2026-10-06 a red-team's host sign-in cookies and two guests' welcome cookies vanished in three browser contexts at once (the guests' httpOnly cookie survived), with no request or action of theirs; once, not seen again in 40 minutes; another session signing willg97 out may explain it (red-team 56b, unexplained). [unsure: once, not seen again in 40 minutes; another session's sign-out may explain it]
- QA hardening: a per-guest `presign` abuse kind (`src/lib/security/abuse-rate-limit.ts`), so one script cannot spend a host's hourly breaker (20,000 uploads across her albums, `meter_upload`) for every other guest; the pipeline already answers 429 with `Retry-After` (`src/lib/upload/server-pipeline.ts`).

### Uploads, media and exports

- Uploads: a complete sent the instant a dropped line came back hung about 2 minutes before its retry (red-team 56b, NIT).
- Uploads: the heal re-asks a kept complete on the browser's `online` event at once, so a Retry all pressed as the line comes back is a second complete beside the heal's; `healLost` could ride the queue's `runSoon`, or wait a tick for a press (uploads-bursts).
- Uploads: a HEIC from a browser that cannot decode it (desktop Chrome) gets no preview, since the uploading browser makes previews, so its tile is blank wherever the original cannot draw; derive it server-side, or give `MediaTile` (`media-grid.tsx`) a named stand-in.

### The guest's album

- Reel: the live reel's "Hide the controls" takes focus with no visible indicator, and Tab stops moving at "Make your own" (Shift+Tab still moves) (red-team 56b, LOW).
- Guests: in a 45-photo send the in-flight recorder counted the album's direct tiles dipping (21, then 18, then 21) mid-run, on the builds before and after uploads-bursts alike: a red-team look (uploads-bursts). [unsure: red-team 56b's burst walk counted 92 rows, each once, but named no tile dip]
- Guests: drop the one-file presign and complete bodies (`server-pipeline.ts`'s `splitBurst(...) === null` arms, kept for a tab loaded before bursts).
- Guest door: the name door's `account` mode has no caller (only `requestNameDoor("edit")` is ever asked: `lib/guest/name-door.ts`, `guest-name-step.tsx`, `entry-modal.tsx`'s `openToName`); remove it.
- Guest door: a confirm by the emailed link (a full reload) adopts her typed name on the server (`adopt-door-name.ts`) with no beat, so she is never told the name her photos carry or offered its Change, as the in-page confirm does (`confirm-beat.ts`).

### Accounts and profiles

- Account: a magic link that signs Create account into an existing address says nothing, where the code says so (`auth/account-door.tsx`); a one-line banner on `/dashboard` from `(auth)/auth/callback/route.ts`, on `checkExistingAccount`'s test.

### The host app

- Host: the host's view-as-guest cover (`as-guest-view.tsx`) never names its kinds, where the guest's first paint now does (crumbs-74).
- Host: the dashboard's stage wall shows a disposable album's sealed photographs (`getStagePhotos` in `lib/db/queries/dashboard.ts`) while the hub covers them until the develop; hold the wall to what guests see (`hubCovered`, `host-cover.ts`).
- Host: `guest/file-dropzone.tsx` is rendered only by the host's manual add (`app/host-upload.tsx`), and its "Tap to choose, or drag them here" is half wrong on a phone; move it to the host's side and word it for the device in hand.
- Host: pin See it as a guest's two new facts in its own tests (`as-guest.server.test.ts`: `waitingOnArrival` asked only under the guest page's guard, `partyZone` null when shut; `as-guest-view.test.tsx`: `waitingOnArrival` holds the Add off "the first photo", and the sheet says the party's clock) (crumbs-86).
- Create: a Create whose answer is lost after the server made the event is held as failed, and Try again makes a second event (a Free host's one event spent on a duplicate); a client key for the attempt on `createEventInWizard`, unique per host, makes the retry return the first (a migration) (create-wizard-wiring).

### Admin and operations
- Storage sums: the restores take their rows without waiting under her lock (`restore_media` NOWAIT, `let_back_in` SKIP LOCKED from let_in's three-argument body, 20261007020000), closing `disown_guest_rows_by_email`'s race with a Restore and the older takedown and Delete-permanently ones (storage-sums-signal's Q2).

### Design system and accessibility

- Design: Settings' date range at a phone: its two rows share no gutter (the end indented by "to", the × outside).
- Design: the account menu's "Plan and storage · Event Pass" wraps to two lines at both widths.

### The lab and the kit

- The lab and the kit: `pnpm compute:model`'s lab-demo scenario reads 182.8 calls and 707 ms of CPU a step against its budget of 9 and 210 (2026-10-05, after desk 3's boards merged): find the frames that call the API (production components fetching live data inside a board) and stub them, or re-baseline the line; the lab is dev-only, so production's cost is untouched, but a slow desk costs Will's sittings.
- The lab: retire `/design/lab/proposals` and its `status.ts`; the `docs/specs` it renders is gone (a board's argument lives in its `spec.ts`).
- The lab: the motion playground (`lab/tools/motion/motion-playground.tsx`) still sends the reader to "the rounding board" and names `/design/lab/rounding`, both gone; point them at `/design/library/foundations#radius`.

### Code hygiene

- Code hygiene: the hub (`dashboard/[eventId]/page.tsx`) and the dashboard (`dashboard/page.tsx`) compute the storage percent inline; read `storageUsedPct` (`lib/events/readiness.ts`), its one home.
- Code hygiene: Settings' rail maps its steps to the checklist's items itself (`settings-rows.tsx`'s `GROUPS` and `STEP_ITEM`); read `SETTINGS_STEP_ITEMS` (`lib/events/readiness.ts`), the map Create's beat reads.
- Code hygiene: `device-tickets.test.tsx` still pins the welcome by the legacy `pr_welcome_<qr>` localStorage key; read `document.cookie` as `foreign-ticket.test.tsx` does, then drop `use-welcome-seen.ts`'s legacy put-down (`LEGACY_PREFIX`, its `localStorage` removals) and its pins in `use-welcome-seen.test.tsx`.
- Code hygiene: `EventCard`'s dashboard-only props (`qrSlot`, `pendingCount`, `itemsLabel`, `living`, the trash variant) and `event-card-qr.tsx` have no production caller; remove them with their Library specimens (`library/compositions/gallery-demos.tsx`).
- Code hygiene: drop `resolveRowStep`'s legacy pixel-width mapping (`LEGACY_WIDTH_STEP`, `lib/shared/tile-size-cookie.ts`); nothing writes a width any more and only test devices hold one.
- Code hygiene: five stale comments: `zone-morning.ts`'s head about the seeding (both callers retired it), `server-pipeline.ts:544`'s "The host's route takes none" of `captured_wall`, and `zone.server.ts`'s head "for a guest's render" (the host's complete reads it too, by the body's id) (crumbs-86); the Library's `pricing-demos.tsx` above `stripeAnswers` ("Starting…", "Opening…") and `pricing/leave.ts`'s "the button's "Starting…"", the key saying "Opening billing" now (halo-last).
- Code hygiene: drop the typed seams the regenerated types made needless, drive-crumbs' `markReady` cast (`src/lib/db/queries/drive.ts`, `cloud_export_ready`'s `p_found`) and upload-sums' `sumsDb` (`src/lib/db/queries/storage-list.ts`, `event_storage_sums`); and `row-cap-sql.test.ts`'s `SINGLE_ROW` reason for `host_storage_summary`, which still says "host_active_bytes beside two SUMs over host_deleted_media" (now her sums, her deleted events' rows and the aged removals, no GROUP BY).

## Upcoming

### Platform, data and cost

- Testing: make the 51 files that leak under `--no-isolate` hermetic (19 unit, 32 component, each leaking a module mock or module state into the next file in its worker), then `isolate: false` for the unit project (31.6 s against 85 s measured) (test-slim).
- Testing: a deterministic frame test for `trail.tsx:300`'s empty slot (its arm rides the animation clock: 78, 468, 3 and 0 hits in four full runs), so a per-directory coverage proof is exact run to run (test-slim).
- Testing: the next slim's kinds, measured on 2026-10-06: 327 copy pins (a 24-character literal asserted in a test and held verbatim in exactly one production file, across 141 files), 88 same-file runs of `it`s that differ only in literals, and the SQL guards' own "latest definition" parsers folded onto `liveFunction()` (test-slim).
- Engineering: a popup's entry a router refresh stripped of its marker, whose act then navigates, still leaves one dead Back under the next page (`ui/popup-back.ts` knows a spent entry by its marker alone) (crumbs-83).
- Engineering: a traversal of several entries at once (a long-press Back menu) that skips a spent entry left under a page leaves its side stale (`popup-back.ts`'s `windowAbove`); the Navigation API's entry index would know the side (crumbs-83).
- Cost: the stage's chooser reads its alternates' readiness on every load where she has a choice; read it lazily on the first open if the dashboard's read budget tightens, and count guests in SQL for `readStageGuestsAction` and the stage's own read, which read every approved media row (crumbs-82).
- Engineering: the rest of the tests that read `supabase/migrations/` by hand (`grep -l "supabase/migrations" src`, less `testing/migrations.*`) read each function's winning body through `testing/migrations.ts`'s `liveFunction`, so a dropped function never reads as defined.
- Cost: rows asked to leave (`empty_deleted`, `leave_deleted`) keep their R2 objects until the night's purge, so a refill day's R2 peak holds the old set beside the new (PRICING.md prices it under Deleted); reclaim them at once, R2 first.
- Platform: an arrival rings each visible listener once a changed row (`media_gallery_doorbell`, `notify_gallery_change`); a ping coalesced server-side, once an album every few seconds (a migration), cuts the visible albums' Realtime messages (PRICING.md's lever "One ping a beat, then one push per album"); design it with the host channel for moderated uploads (the app's Host line), which changes the same trigger.
- Housekeeping: about 90 `QA #N` labels in code comments (`git grep 'QA #[0-9]' -- src workers scripts`) cite a review numbering no doc holds; replace each with its reason in words.
- Housekeeping: the idle window typed by hand (`pricing-faq-data.ts`, `email/templates.ts`'s inactivity emails, `admin/jobs/catalog.ts`, the legal pages) follows `INACTIVE_MONTHS` by no test; derive or pin it like `faq-data.test.ts`.
- **QA hardening: the remaining fix queue.**
  - Replay a dead letter from `/admin/jobs`: the backup's dead-letter queue has no consumer (`workers/backup/wrangler.jsonc`), and adding one changes delivery semantics.
  - Legal-hold evidence under `preservation/` has no backup copy (the Worker copies `events/` only, `MEDIA_PREFIX`); decide whether a year of held evidence needs a second one.
- Vercel / Next.js optimization: one `getUser()` a request: a route handler misses React's `cache()`, so a signed-in album request asks Auth twice (`events/album-viewer.server.ts:74,99`; PRICING.md lever 3).
- Upkeep: a contract migration drops `standby_hosts` with its test pins and renames `host_storage_summary.standby_bytes` to `deleted_bytes` (DROP + CREATE) with `readHostStorageSummary`; since `upload_sums` the rename carries `host_storage_walk`'s OUT column, `storage_sums_drift`'s comparison and the `standby_bytes` keys of its answer, and `rebuild_storage_sums`' before and after (with whatever reads them, the storage sums' signal lane included).

### Security and abuse

- Security: the impersonation words (`support`, `billing`, `verify`, ...) are refused only as whole slugs (`reserved-slugs.ts`, `set_event_slug`), so `/e/billing-update` stays claimable; refusing them as a part would also take slugs like `staff-party`.

### Billing and pricing

- Pricing: `adopt_pass_credit_orphans`' orphan loop could also hold `and c.profile_id = p_host_id` (the Advisor's nit; billing-orphans).
- Pricing: re-run the atlas's per-call lines with `usher/kit/cost-model/` for today's paths (the CPU a call as measured, about 44 ms on Vercel's average and not about 3; a burst's one presign; staging's three copies a photo; no proxy on an API route; the wall screen resting, about $0.41 where it says $0.54), and decide the preview at complete: it is checked against its original's declared bytes at presign only, so a multipart original completed short could land a 2 MB preview beside a tiny original (re-check it against the original's HEAD at complete, or say so) (scratch-synthesis).
- Pricing: drop `consume_passes_for_pro_credit(uuid)` once no deployed build calls it (milestone 38 runs the claim), with `event-passes-migration.test.ts`'s pins on it; a contract migration (billing-integrity).
- Billing: the plan limits' Cloudflare reader `[eng+human]`: R2 operations and Workers requests through the GraphQL Analytics API, once Will mints a `CLOUDFLARE_ANALYTICS_TOKEN` (Account Analytics: Read) (the calls lab's X3).
- Pricing: rename the uploads meter's wire names to window-neutral ones (`at_monthly_cap`, the presign meter's `'monthly'` reason).
- Pricing: the plans' sheet opened by an event limit (Create's held Upgrade, the cap door's See Pro) leads "You are out of room", the storage trigger's words (`pricing-sheet.tsx`, `kind: "room"`); give the event limit words of its own (create-wizard-wiring).
- Pricing: `/pricing` opens on paper but the cinema layout pins `themeColor: #020202` (`(cinema)/layout.tsx`), so a phone's browser chrome is dark over a white first screen; the fix is group-level, since the layout keeps `viewport` off every page.

### Uploads, media and exports

- Drive: a check page throttled before its folder's duplicate listing skips the count, and once its cursor has moved no later page counts it (`first` is "cursor null"); count once a walk on the first page that answers (drive-crumbs).
- Drive: the closing check asks a non-rate `unknown` again every 90 s with no growth for the hour before a send reads Stuck; the Worker's cadence could back off on a repeated unknown (the Advisor; drive-crumbs).
- Downloads: Download all's zip names its entries `slug-id.ext` (`buildDownloadFilename`); name them when, then who, like a Drive copy, so an unzipped album sorts as the night happened (capture-time).
- Camera: a roll of one is refused as "You've taken all 1 shots on your roll." (`create_media`'s raise, mirrored by `rollSpentMessage` under `roll.test.ts`); say one shot as one the next time `create_media` is redefined (settings-wiring).
- Host (clip): the hub's reel view has no Make your own (its seam wants the host's plan and her own Add to event); wire it from the hub so she can make a clip before the develop.
- Camera: a host chooses her camera's clip length beside its roll (10, 20 or 30 s), on the customize board's pattern (`CAMERA_VIDEO_SECONDS` is one constant with its SQL mirror, so a per-event length is a column read by the two SQL constants, bounded by the 30 s ceiling); and the camera's first hint says how long a hold may run, since only the ring teaches it today.
- Uploads: two narrow races at a switch from Review to a develop time: an upload that read the old event row stays pending on an album that no longer reviews, and a second tab's approve at the save's instant shows before the develop; the proposed heal is a nightly pass approving any pending row on a live album.
- Exports: a short walk's Try again asks its missing ids as one zip only up to 2,000 (`MAX_EXPORT_ITEMS`) and past that restarts the whole walk (`export-walk.ts`); retaking each stopped part by its own cursor would fetch exactly what is missing.
- Media: carry Apple's MakerNote HDR headroom (tags 0x0021 and 0x0030) into the minimal Exif `strip-metadata.ts` rebuilds, on JPEG and HEIC, so a pre-iOS-18 HDR photo keeps its exact HDR rendering.
- Media: `event_covers` picks only approved photos, so an album of videos alone shows no cover on any card (dashboard, picker, profile); fall back to the newest previewed video's frame, photos first, in one migration.
- Clips: a guest's Add to event reads Added the moment it hands the clip to the page's upload queue (`clip-creator.tsx`'s `add`); it could follow its queue item instead (sending, held for review, failed).
- Lab exploration: a party with no signal: nothing waits on the device (no service worker; a closed tab loses an unsent photo, and iOS kills background tabs); unsent originals kept in IndexedDB and resumed on the next open with a "3 waiting to send" chip, Background Sync where it exists; whether a camera shot spends the roll when taken or when it lands is Will's (app-gaps-r1).
- Uploads: the same photo sent twice lands twice (re-picked to be sure, AirDropped around a party), spending storage and the uploads allowance and repeating in the zip, Drive and the reel; skip a byte-identical file per album (a hash of the stripped bytes before presign) and say it is already in (app-gaps-r1).
- Video: the album's viewer plays the original (up to 10 GB, HEVC by default on iPhones) with no fallback where the reel falls back to its poster (`lib/reel/engine/video/ladder.ts`); measure on real phones, then a light copy made in the uploading browser or a server transcode costed in the atlas (app-gaps-r1).

### The guest's album

- Guests: the held door keeps a choice on the device but never the camera's shots (`wait-picks-store.ts` rewrites one record whole), so a reload there loses them ("Keep this tab open." says so); a per-file record would keep them (crumbs-83).
- Guests: an undated album never turns: a host's "in order now" for it (no column now) (album-order).
- Guests: what a host lets guests take home (everything, as today; their own photos; just to look), a new export permission (customize r1's carried `take-home`) (settings-wiring).
- Guests: a password's unlock lasts 12 hours (`UNLOCK_TTL_SECONDS`, `lib/events/unlock-token.ts`), so a weekend's guests re-type it twice a day: the party's days plus a night.
- Guests: a sharper album cover: a purpose-made cover variant (about 1,280 px) made in the browser at upload beside the preview (`upload/preview.ts`, no transform), carried on the wire for the cover's ids only and drawn as the second `srcset` candidate of `HeadStills` (the phone copy, 2,048 px and about 330 KB, would cost a phone about 2 MB on the first screen).
- Guests: the guest's read carries the period's start (`sealed_from`), so an album turned disposable mid-party develops only its roll (today its photos from before the switch develop on the sheet too: `rollOfEntries`'s note).
- Guests: the account's other lists say a range's first day alone: the claims card (`list_guest_rows_by_email`), the As a guest cards (`getMyGuestEventCards`) and the credits on Yours and likes (`get_my_uploads`, `get_my_likes`); each read carries `event_end_date` to `formatEventDate`.
- Guests: the waiting sheet decodes a camera video's file for its picture where the queue already holds its first frame (`QueueItem.poster`); carry it through `HerShot`, `herShotsOf` (`lib/guest/upload-tracker.ts`) and `gallery-live.tsx`'s object-URL ledger.
- Guests: on Android, a `takePhoto` still that arrives on its side falls back to the frame (`pipelineStill` in `lib/guest/camera/capture.ts`); turning it by the track's angle would keep the larger picture (measure on a device).
- Guests: draw a photograph's phone-size copy (`phone_key`, 2048 px, a fifth of the bytes) in the phone's viewer for the original and on a desk's cover for the soft 640 px preview; only Save and export read it now (`phone-copies.server.ts`).
- Guests: a name-only guest whose browser cleared its storage (Safari's seven-day cap) re-joins as a second row under the same name (`/api/guests` always mints); adopt the `pr_guest_<eventId>` cookie's name-only row when the typed name matches.
- Guests: the password gate titles a password album "{name} is private" (`password-gate.tsx`), the word the shut door says to someone who was in ("This album is private", `door/shut-door.tsx`); give the gate its own words.
- Album: a photo the reflow moves from the end of one row to the start of the next glides diagonally across the album (`album-window.tsx`'s glide); a crossfade at both ends may read calmer.
- Guest: the last-removal line reads the album's fullness once, at render (`albumFull`, `e/[token]/page.tsx`), so an album that fills or frees mid-visit keeps the old line until a refresh; the poll could carry it at one gate read per poll.
- Guest: the door (`guest/door/`, `entry-modal.tsx`) and the report dialog (`guest/report-dialog.tsx`) carry no link to `/help`; the album reaches it through the guest's menu and the upload sheets.
- Guest, the demo: the guest export (`api/export/guest/route.ts`) and the per-tile Save and Share serve the demo album in full with no server-side demo check (the UI only hides them); decide whether the demo's token carries a read-only claim.
- Guests: the cover's eyebrow ("Disposable · develops Thursday at 2 AM", `coverEyebrow`) says only the reader's clock where the sheet under it says both; a far party's wants the party's clock too, on the guest page and See it as a guest (crumbs-86).
- Door: a camera-only Disposable's welcome says "Add your photos and videos in seconds." where its guests only use the album's camera; and the door page's hidden summaries (Private, Only people already in) say uploads are paused while they are open, a screen-reader check (app-gaps-r1).
- Lab exploration: the album after its party, the gap audit's highest design gap: a phase-aware album (live, then keepsake: its title, a card carrying its photographs, Add receding), the host's morning-after recap (Share, Make a clip, Download), a guest-to-host bridge into Create carrying this album's style, an anniversary; one card family for every shared link (`/e/[token]/card` draws the name alone) (app-gaps-r1).

### Accounts and profiles

- Profile: a tap on a link into `/u/<handle>` shows nothing until the page arrives (the route has no `loading.tsx`, on purpose); a pending state on those links through `useLinkStatus`, as `chrome-link.tsx` has, would answer the tap.
- Profile: deleting a photograph opened at `/u/<handle>?photo=` makes the next Show more jump to the top as the held answer lands (the viewer's same-tick address write before a revalidating action, Next 16.2.6, a row `lib/history-entry.ts` lacks). [unsure: crumbs-83 gave a photo opened at its address its own entry, which may have removed the cause; not re-walked]
- Account: the reset's Set a new password (`SetInitialPassword`, `auth/password-sign-in.tsx`) has no strength meter while `/account`'s change form and the event password wear `PasswordStrengthMeter`.
- Profiles: the owner mode's Connections chips (`/me`, `/u/<handle>`) link to pages where Account's names now open the look; the same look could serve them (account-moments-wiring).

### The host app

- Host: the Guests card's "N shots developing" is the page's read at render, so a hub left open across the develop says it until its next render (the cover's guests count has the same limit); a cure would be the album's poll carrying the sealed count, never a refresh (event-header-wiring).
- Host: the hub's delta carries a link for an approval or a Show of an item the hub already holds (the server cannot tell an arrival from a status flip); send the newest `t` the hub's manifest holds (a header on the sync, set by `HostAlbumProvider`'s fetch) so only an upsert newer than it carries.
- Host: "Max size per upload" stands only under the Videos switch (`videos-switch.tsx`), unreachable on Free though it caps photos too: its own row in What guests can add (customize r1's audit).
- Host: the host's dashboard session in `pnpm compute:model` (`--host-cookie-env NAME`, a fresh session cookie from the environment), measured once on the local desk; until then `model.mjs` prices a session as five guest-page loads (0.4% of a wedding's calls).
- Host app: a deleted event's card in the dashboard's Deleted gets its own Delete forever beside Restore (`events-section.tsx`'s per-row actions); today Empty Deleted takes every deleted event at once, or she restores one first.
- Host: a Settings date's `finish` (`event-page.tsx`) reads the draft, not the field, so an iPhone Clear that never reaches `onChange` (facebook/react#12313) would be lost; read the field on leaving, and check on a real iPhone that its wheel reports each notch as `input`.
- Host: the dashboard stage's live read (`readStageLiveAction`, `use-stage-live.ts`) is a Server Function, which Next queues behind the page's other actions, so a claim pressed mid-poll waits; serve it from a GET route under `src/app/api/`.
- Host: the checklist's code row ticks only on the hub's next render, since its opens are read with the page (`useLiveReadyFacts` in `checklist.tsx`); a light `event_link_totals` read while it waits, in a visible tab, ticks it as she test-scans.
- Host: an upload to a moderated event rings no doorbell, so the hub hears it by its poll (12 s, or 60 s with the socket up, `event-feed/host-album.tsx`); a host channel rung on each arrival (`media_gallery_doorbell`, a migration) makes it instant; design it with the coalesced ping (the Platform line above), which changes the same trigger.
- App: `dashboard/empty-section-teaser.tsx` and `events-empty-teaser.tsx` skip the `ui/empty.tsx` atom, so the profile's Likes is empty two ways; move both onto `Empty`, any ghost tiles onto `GUEST_GHOST_FRAMES` (three lists today).
- Host: one label for creating an event: the dashboard says New event (`dashboard/home-head.tsx`), the empty teaser Create your first event, the welcome Create my first event, the app's 404 Create an event.
- Host: an album's Deleted (`recently-deleted-grid.tsx`) restores and purges one item at a time; give it a Restore all and an Empty for that album (the storage chart's Empty Deleted takes every album's at once).
- Host: no setting links to its help article (only the user menu, the 404 and the error screen reach `/help`); deep-link Settings' pages (`event-settings/*-page.tsx`) through `lib/content/help-links.ts`.
- Create: Upgrade from Create's held limit or the cap door leaves through Checkout to `/dashboard` (`returnTo`), so the name, style and look she chose are gone; bring her back to `/dashboard/new` with the draft kept (create-wizard-wiring).
- Lab exploration: the hub's head as event-header's boards drew it since r2 (the when as one quiet line over the name, the link under the code) where production keeps date, guests, views and Live under the title with the link under it; whether that drawing should be wired (event-header-wiring-2's board idea).
- Lab exploration: turned-away demand: a host never learns guests were refused (a Free album's video, a full or closed album; `video_blocked` answers at presign and nothing records it), though PRICING's upgrade triggers turn on it; a count and where she meets it (the hub, the bell, the morning-after recap) (app-gaps-r1).
- Lab exploration: the host's picks: one mark of hers feeding the cover (dealt from the stills today), the reel's opening, the share card, the keepsake and a best-of download, where "Use as the cover", host pins and a featured clip sit in three buckets (app-gaps-r1).
- Host: the storage meter's door to the size list (`dashboard/storage-meter.tsx`) leaves her plan's name off its fit goal, so its list says "Fits your plan once these go" where the banner's says "Fits Pro 50 GB once these go"; pass `plan: planWithCap(tier, storageCap)` (`grace-banner.tsx`) there too (host-moments-wiring).
- Host: the door's quick choice (`settings-rows.tsx`'s `doorConsequence`) moves to a password already set while people wait and says nothing of their asks ending there (`events_door_to_password`), where the steps page asks first; say it, and ask, as the page does (host-moments-wiring).
- Hub: the Reel card shows nothing while its soft navigation is pending (13 s to the curtain on a 120 KB/s line); `useLinkStatus` could dim it (album-moments-wiring; the curtain's ceiling closed the other half).

### Admin and operations

- Admin: name the admin deployment's manifest for the portal ("Partyreel Ops", start `/admin`) now that it serves one (`src/app/manifest.ts`).
- Admin: the account view (`/admin/accounts/[id]`) shows its Drive connection with Pause and Disconnect (today on `/admin/exports#drive`, found by address).
- Admin: the operator's uploads credit (the calls lab's X6, on Will's word): a `credit_bytes` column `uploads_used` subtracts, one definer RPC, the `admin_actions` log, a control behind AAL2 and `destructive-sheet`, bounded credits; a migration (admin-uploads' Question).
- Admin: an operator release for a squatted custom link, reached from a report on `/e/<slug>`; nothing in `/admin` reads or frees an event's slug, and a free account can now hold one.
- Admin: `/admin/forensics`' held-media table names no uploader (`listHeldMedia`, `queries/forensics.ts`, reads none), so an operator opens each Record to learn it; an uploader column edits `trust-safety-forensics.md`'s "no page renders either" too.
- **Admin deployment:** its own Sentry project; the portal shares the app's DSN today.

### Design system and accessibility

- Design: the room display's caption step reads `--faint` at 3.88:1 on a held row (AA wants L 0.722, against `--display-muted`'s 0.77, so a third step would stop being one): a fourth grey, or a caption that never stands on the step (a11y-halo).
- Design: red-team 56's "Select shrinks over 150 ms" did not reproduce on the atom (an outline key reads `scale: 0.96` in a press's first frame); walk the album toolbar's own Select (`event-feed/gallery-actions.tsx`) (identity-r5-wiring). [unsure: not re-walked on the toolbar's own Select since identity-r5-wiring]
- Design: production's footer (`.surface-ink`) already is Aperture's black footer; lighting its top edge from the page's photographs is the cheapest first wiring, whichever take wins (brand-r2).
- Design: a press on the stage's chooser moves the old lead into This week or the list with no sign of where it went; a short shared-element move would say it (crumbs-82).
- Design: Crystal's lip and hairline compose through Tailwind's inset slots, so a glass round keeps them under the halo (the halo replaces its `box-shadow` while it holds focus, as the old ring did) (identity-wiring).
- Design: a quick layer that scrolls itself (the Display menu's popover, a long dropdown) scrolls an inner body, so its light stays whole when scrolled (identity-wiring).
- Design: the contact form's topic `SelectContent` names a corner of its own (`rounded-xl`), so its paper light is off concentric at the corners: wear the display's corner or name `--lit-r` (identity-wiring).
- Design: the album's arrivals pill (`album-window-news.tsx`) and the Review room's "N new" (`review-section.tsx`) are one idea drawn twice: one atom, perhaps leading with the newest arrival's own picture beside its count (album-order).
- Design: a `swatch` atom for a picture chosen among pictures (Create's looks, the reel's moods, the code's styles) wearing the selected trait, instead of each picker drawing its own ring (identity r4's idea).
- Design: the live reel's Style menu draws "Set for everyone" as a hand-drawn pill row, not the key atom (`live-reel-view.tsx`).
- Design: the Display menu's group names (LAYOUT, ORDER, SHOW, GROUP, COVERS) and the door's "ALMOST IN" are spaced capitals outside the camera voice's counts, live and times.
- Design: `[data-lit]`'s falloff takes its light as a colour the host sets, so one falloff serves media and layers.
- Design: Settings' step list and cards (`settings-rows.tsx`, `settings-furniture.tsx`, `delete-event-row.tsx`), the hub's checklist (`checklist.tsx`) and `attended-events-visibility.tsx` hand-roll a ringed card; each becomes the flat `Card`.
- Design: add the atoms production lacks (`checkbox`, `radio-group-item`, `slider`, `radio-card`, a check mark) and move Settings' hand-rolled radio groups (`door-page.tsx`, `camera-settings.tsx`) and the grid's check (`selectable-media-grid.tsx`) onto them.
- Design system: the house bounce (`--mkt-ease-pop`) is declared only on `[data-mkt]` (`marketing.css`), so the door's success check repeats its curve inline (`guest/door/lit.css`); one theme token would serve both.
- The voice: the QR's ask says two things, "Scan to add your photos" on paper (`lib/qr/stock.ts`'s `STOCK_LINE`, the event pages' cards) and "Scan to add yours" on screen (the live reel, Create's look step); one line for both.
- Design system: `help-palette.tsx` hand-wears its floating panel (`rounded-float`, `shadow-layer`, on the paper skin) instead of `ui/floating-layer.ts`'s, so no test holds it, though that contract counts the palette among the display's quick layers.
- Design system: the sortable grid's pick-up shadow is a hand-typed `box-shadow` set from JS during a drag (`lib/shared/use-sortable-grid.ts`); read `var(--shadow-layer)`.
- Design system: 120 `text-[10px]` sites (78 outside the lab) spell the micro size by hand; move them onto the `text-micro` token (`app/theme.css`), which also carries its own line height and tracking.
- Design system: about 30 `bg-muted/N` set-apart grounds in marketing (`git grep 'bg-muted/' src/components/marketing 'src/app/(marketing)'`) become sections wearing `.surface-mat`, which `globals.css` declares and nothing wears yet.
- Design: the help center's pictured menus (`help/step-screens/desk-screens.tsx`) draw the body's `floatingPanel`; draw them on `floatingDisplayPanel`, the display the real menus wear.
- Design: the hub's folded band brings its code pill in without the fold when the cover's code leaves the screen after the band has stuck (its sentinel reports a beat later), so it pops in; fold it in on its own arrival (event-header-wiring-2).

### Marketing and content

- Marketing: a signed-out Get Pro comes back to `/pricing` with the plan she pressed lost (the Pro card's slider, the configurator's answer); carry it in `sessionStorage` (never the URL) with a time-to-live and resume that checkout once (a product call: it opens a checkout on arrival) (pricing-doors).
- Marketing: the album page's Free bullet, its Stays step and FAQ and the pricing table's Kept row each say the keep rule by hand; one home lets a lifecycle change land once.
- Marketing: `/features/album`'s hero from 768 to 1279 px stretches the phone's strip across the width (the stream steps only at `STREAM_LG_MIN`, 1280); a tablet geometry, as the home hero's `hero-stream.ts` has, would fill it.
- Growth: the contact form's topic-hint links and the receipt's onward link fire no `track` event (`contact/contact-form.tsx` tracks only `contact_submit`), so how often a hint answers the question goes unmeasured.
- Help: the email-code screens (`help/step-screens/door-screens.tsx`) quote `AccountDoor`'s post-send code view as markup, since no prop reaches it; an exported code view would let them draw the real piece.
- Feature pages: `ScreenLamp` throws a full-bleed seam under the sharing and guests heroes (`features/sharing/page.tsx`, `guests/attribution-hero.tsx`) where a screen's light is a pool; give each its own light, as the home's `ReelScreenLamp` does.
- Blog: the index's later pages exist only as a client `?page=` (`(cinema)/blog/blog-list.tsx`), so give them real `/blog/page/[n]` routes; and the featured card's eyebrow says Latest where the post's purpose would tell more (`FeaturedCard`).
- Home: the how-it-works passage renders `id="how-it-works"` while its slot and file still say `film-strip` (`sections/home/section-ids.ts`, `index.ts`, `film-strip.tsx`, `home-sections.test.ts`); rename them to match.
- Feature pages: `/features/album`'s h1 (`constants/feature-pages.ts`) is the one of six that wraps to three lines at 1440 (44 characters at 80 px in `max-w-3xl`); a shorter, punchier line fixes it.
- The reel's contained player on a landscape phone `[eng]`: 812x375 draws it 325 wide and scrolling (`sections/shared/reel-player.tsx`); a posture that fills the glass, once the films land.
- The support-automation arc: as-you-type answers on /contact: the page already ships the help search index (the palette's), so the subject and message could rank help articles live beside a topic's fixed links, with no model and no new service, before the help chat exists.
- Help: `help/step-screens/desk-screens.tsx`'s `ReelCardPicture` still draws the retired tile and the living reel card (`mock-parity.test.ts` and `step-screens.test.ts` pin its "Live for guests" against `room-card.ts`, while the picture still types the line; redrawn, it takes `reelCardFace`); redraw it as the cards' reel card once the polish pick lands, then drop `ROOM_CARD_BASE` and `ROOM_CARD_QUIET` from `room-card.ts` (kept only for it) (event-header-wiring).
- Nav: tabbing into the hidden header scrolls the page about 482 px (Chrome scrolls focus into view against the sticky bar, `chrome/header-shell.tsx`); revealing the bar on a Tab keydown, before focus moves, would pre-empt it.
- Nav: `ui/navigation-menu.tsx`'s content spells its cross-slide inline (`data-[motion=…]`); move it onto `floatingCrossSlide` (`ui/floating-layer.ts`), the same slide, which also holds it to `motion-safe`.
- Help: `content/help/the-disposable-camera.mdx` says "A roll allows only so many retakes"; name the 3 re-shoots and the reel's newest frame (Take it back, Keep it), in `lib/guest/camera/words.ts`'s words (camera-wiring).

### The lab and the kit

- Lab: a `Graft`/`Press`/`Reveal` trio (draw a candidate's one piece into production's own page; press a production control until it took) lives in host-moments' `scene.tsx`; lift it into the kit when a second board wants it (host-moments-r1).
- The lab and the kit: `redteam/join.mjs` walks only a name-only door ("Continue as guest"); an album on the default confirm-an-email door needs Settings > Who can get in > Type a name first, so a walk of the email door has no tool (lab-kit-3).
- The lab and the kit: one capture tool in the kit: eight lanes each wrote their own URL capturer, each picking its DevTools port from a pid or at random; brand-r1's `shoot.mjs` interface (any URL, `--selector`, `--scheme`, `--reduced`, `--frames`, `--clipjs`), launched as `lab-demo.mjs` launches (port 0, then `DevToolsActivePort`) (scratch-synthesis).
- The lab and the kit: a function-body CLI over `src/lib/db/testing/migrations.ts`'s `liveFunction` (a function's newest definition, and its prosrc md5 for the drift check in `systems/database-security.md`), since two lanes re-derived both with regexes (scratch-synthesis).
- The lab: delete the boards' own pause bridges now that `Frame` holds a hidden option still (`brand/deck/deck.tsx` and `deck.css`'s `data-bd-paused`, `afterglow/kit.tsx`), and let `the-wait/motion.tsx`'s and `demo-framing/scene.tsx`'s `useOffStage` read the frame's own `data-lab-paused` (each in its board's next round) (lab-kit-2).
- Library: draw the Accounts' billing checks and the account page's credits card on the compositions page, the portal's one automated eye (AAL2 keeps `lab:smoke` off /admin) (credit-watch).
- Lab: the customize board's camera frame composes production's camera parts without `dark`, so a light session's frame shows paper's halo on black (the board's own wrapper; it leaves with the board) (identity-wiring).
- The lab and the kit: `DemoFrame` (`marketing/system/demo-ticket.tsx`), `InlineReelPlayer` and `ReelPlayScreen` (`marketing/sections/shared/`) hard-code `loading="lazy"`, and `PhotoSection` does with `sizes="100vw"`; an optional `loading` on each ends the last three LCP lines in the Library's console (`/design/library/demo-ticket` at 1440, `inline-reel-player` and `reel-player` at both widths), and an optional `sizes` on `PhotoSection` lets it leave its frame.
- The lab: a `lab:crawl` that walks every Library entry in headless Chrome at 1440 and 375, scrolls each through and reports what the console logged, since `lab:smoke` reads server HTML and a frame mounts on the client, so a scene in a frame is never rendered by it (`usher/kit/redteam/drv.mjs` is a DevTools driver to start from).
- The lab: event-header's `whenOf` (`fixtures.ts`) draws ranges with its own spaced dashes; draw them with production's `formatEventDate`, `longDays` and `dashRange`.
- The lab: inside a portalled frame, production code reading `window.matchMedia` answers for the lab's window (`ui/sheet.tsx`, `use-keyboard-inset.ts`, `help-palette.tsx`, `cinema-hero.tsx`, `demo-modal/opens.ts`, `live-reel-view.tsx`, `report-queue.tsx`); read the element's own `ownerDocument.defaultView`, as `album-stream.tsx` does.
- The lab: inside a portalled frame, production's `instanceof HTMLElement` answers false (`popup.tsx`'s open focus; `nodeType` answers in both), radix's focus trap listens on the lab's document, and a place popup drawn open pushes the lab tab's history (`useBackCloses`; `useOwnedEntry` could stand down under a Frame context).
- The lab: what a portalled `Frame` now frees, in its board's next round: demo-framing's own `GlowFilter`s (`hero.tsx`, `specimen.tsx`).
- The lab: on the desk at a phone, a staged row's `after "<question>"` tag runs past the row and is cut at the queue's edge (`afterLabel` in `lab/page.tsx`, drawn by `_shell/tag.tsx`, which is `whitespace-nowrap`); let it wrap or truncate.
- The lab and the kit: a quote-parity test like `components/marketing/mock-parity.test.ts` for the production words boards quote by hand (`event-header`'s rooms and reel, `the-wait`'s album), since a hand quote drifts unseen when production's words change.
- The lab and the kit: the 375/1440 Screen knob (`SCREENS`, `ScreenId`, `screenOf`) is copied in boards and `event-header` keeps its own phone-and-laptop `Strip`; the front door (`@/components/lab`) could carry both.
- The lab and the kit: a real `MarketingHeader` in a board's frame reads the lab page's scroll, so it hides and glazes; demo-framing pins it itself (`PINNED`, `sandbox/demo-framing/hero.tsx`), and one pin in the kit's `Frame` would serve every board.
- The lab: retire the page-shaped board path only `/design/lab/sample`'s fixture walks (`_desk/sample-spec.ts`, `defineBoard`, `Catalog`, `Walk`, the `item:` review clause), keeping `ItemVerdictRow`; rehome the breakpoint proof `design.css` cites.
- The lab: a package script that regenerates `specimens.generated.json` (today `node "src/app/(dev)/design/gallery/collect-specimens.mjs"`, the command the specimens test prints when it is stale).
- The Library: mount `ItemVerdictRow` with `LIBRARY_VERDICTS` on a Library entry's page (`library/[id]/page.tsx`), so a scroll through the components fills `docs/reviews/_library.json`, the redesign queue `/design/lab` already reads.
- Lab exploration: marketing-themes (desk 6, the brand applied): N4 the privacy page's lens (its clear spots a touch stronger than drawn, the moving pane slipping under the words between rests; its photograph is ASSETS 38), N7 the FAQ (bold headings a screen reader can list; the footer's FAQ link staying on the page only on pricing), N9 the album page's hero (two photo streams handing over in turn, a photograph every 1.9 s).
- Lab exploration: the aurora that answers, for desk 6's aurora board: light answering a real signal rather than looping: the Add's ring with libraries.dev's voice-glow envelope (quick to rise, slow to settle, an idle breath), a glow under the album camera's frame while a clip rolls (its mic is open, and a refused mic films silence), transitions.dev's gradient word re-keyed to the five lamps as the aurora's ink on paper, never on small badges.
- Library: Create's room specimen never fails (its stand-in always makes the event), so the held beat is pressed nowhere in the lab; a stand-in that fails once (`create-room-demo.tsx`) draws it (create-wizard-wiring).
- Library: the hub-cover specimen (`HubCoverDemo`) draws the cover without its row, so the foot's clearance for the cards reads as an empty band; draw it with the row, as `HubBandDemo` does (event-header-wiring-2).
- The lab and the kit: `pnpm compute:model` has not run end to end on Linux (its fixtures now come from `$PARTYREEL_TEST_MEDIA` or `media-gen.mjs`, and `--event-name` is new); milestone 38's run is its first (lab-kit-3).

### Code hygiene

- Code hygiene: the dashboard's retired "pulse" name lives on in `RouteSkeleton`'s `pulse` variant (`route-skeleton.tsx`, `dashboard/loading.tsx`, the Library's demos), `stage.ts`'s and `stage.tsx`'s `pulse`, `dashboard/page.tsx`'s comments and `pulse_door_waiting` seam, and `next-step.ts`'s comments; rename each for what it is.
- Code hygiene: rename `lib/guest/reel-tile.ts` (its header describes the retired reel tile; `tileStills` is the cover's first pass) and `GuestActionDock` (it draws the shutter), so the names say what they draw.
- Code hygiene: `masonry.tsx`'s masonry mode (`distributeColumns`, `placeColumns`, the CSS-columns pre-measure box) has no product caller, since every album is `rows`; retire it with its side of the `/design/album-scale` harness.
- Code hygiene: `DemoTicket` (`marketing/system/demo-ticket.tsx`) exists only for its Library specimen, which could draw it in the lab, and `components/lab/scene.tsx`'s header still lists twelve retired boards.
- Code hygiene: rename what is named for a surface it no longer is: `DestructiveSheet`, `GuardedSwitch`'s `sheet`, `PricingSheet`, `QrDesignerDialog`, `UploadIntentSheet`, `EventShareSheet`, `EventSettingsSheet`, and a test name in `create-flow.test.tsx`.
- Code hygiene: `MarketingNotFound`'s `strip` prop has one caller left, which passes `false`, so its strip branch can go (the help palette and the 500 screen import `MissingFrameStrip` themselves) (marketing-crumbs).

## Before launch

### Platform, data and cost

- Durability: a copy past one invocation's reach never completes (the queue's copy and the reconcile's each have 15 minutes; the DR drill copied about 1 MB/s, and the reconcile now logs each copy's `ms`), so a multi-GB video may have no backup; a multipart copy resumable across invocations (its upload id and parts in the Durable Object) closes it (backup-reconcile).
- **Notification system** (the features it notifies about come first, so it knows what needs notifying; the extension point is [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md)):
  - Per-announcement read state, so a host can mark one unread (today one `profiles.announcements_seen_at` marks them all read).
  - New bell signals (`getNotificationData`, `buildNotifications`): link activity new since last seen, and a billing `past_due` alert (a denormalized flag on `profiles`; only Change plan says a payment failed today).
  - A durable per-item feed and real-time push (the bell is derived on each host page load and refreshes on navigation).
- **Vercel / Next.js optimization:**
  - The `(app)` dashboard's first load (about 1 to 3 s to hydrate when last measured): the layout awaits auth, the bell, the menu and the avatar, and the page blocks on two rounds of reads behind `loading.tsx`; stream the slow reads in the guest page's shape (a page-body promise a client component `use()`s), proven deployed on `/design/lab/tools/stream-probe` first, since a Suspense boundary on this page once streamed but never hydrated.
- **Emails: one exploration once the features settle** (the extension point is [`systems/lifecycle-recovery.md`](systems/lifecycle-recovery.md)). Nothing new sends before it, and its sending policy is right from the first send so nothing lands in spam. It starts from:
  - The identity mail: one mail when a guest confirms her address at the door's Keep step while uploads in other events wait under that address, in the dashboard banner's own words.
  - The guest's one-time "here is your album" mail: only to an unconfirmed address on a row with a completed upload, capped per event, through `sendOnce` (kind `guest_event_link`, deduped on `guest_id`), carrying a "this wasn't me" link that detaches the address.
  - The let-in mail, with the join doors: sent only when she has left (her waiting door quiet for about 30 s) at the moment the host lets her in; a door still checking in simply opens.
  - The reports queue's Ask for proof mail, built and held off behind `ops_flags.report_proof_mail_enabled`: this exploration switches it on, never before.
  - The reporter's closing note: one mail as a report closes, the same words whatever was decided ("We've handled your report about …. Thank you for telling us."), with who sent it kept only until then.
  - The sign-in code mail (a Supabase template): the code first, easy to copy, and a primary button beneath as the one-tap way in ("Tap to confirm"); iOS fills a code from Mail when the digits sit beside the word "code".
  - Newsletters and updates from Will, as "Will @ Partyreel" (some filters read an "@" in a display name as a spoofed address; "Will at Partyreel" says the same).
    - Marketing is the one kind of mail that needs a postal address (a PO box or a virtual mailbox), a working unsubscribe and consent.
    - The first send carries an unsubscribe, since a signed-out subscriber has no way off the list (an account holder has `/account`'s switch), and a one-click `List-Unsubscribe` header (RFC 8058); until then the renewal nudge's unsubscribe opens the signed-in switch.
  - The invite mail: guests invited by Partyreel itself (an email or a text on the host's behalf), beside the share sheet's Invite that sends nothing; its spam and deliverability rules come first.
  - The develop mail: a disposable roll's reveal calls its guests back ("your roll developed").
- A committed RPC integration suite `[eng]`, replacing the per-change rolled-back MCP checks: blocked on `SUPABASE_DB_URL` (the session string on port 5432, never the 6543 transaction pooler) in the three secret places `[human, 15 minutes]`; then a `postgres` devDependency and a third vitest project that skips cleanly when the var is unset; each test runs BEGIN, calls the RPC under `set local role`, asserts, rolls back, then re-asserts row counts; detail: `git show 44090827:docs/decisions/rpc-suite-blocked.md`.
- Android, walked hard on real phones before launch `[eng+human]`: Save through the share sheet into the gallery (the phone-size set and its sizes), the camera (a still, a held clip, the mic's answer), uploads on a weak signal (a dropped request must not kill the batch), the door and the reel, on several makes and Chrome versions; nobody has tried Android Save on a device yet.
- An iPhone, walked hard on a real device before launch `[eng+human]`: the file-picker upload end to end; the responsive Sheet's phone half with a focused input and the home indicator (no `env(safe-area-inset-bottom)`); the export's form-POST download on iOS Safari; a real gated event's arrival, and a guest's own upload landing in Safari (any flash as the in-flight tile hands over to hers); the keyboard-safe dialogs over a real keyboard.
- QA hardening: a full Content-Security-Policy, report-only first, then enforced: a per-request nonce through the streaming render (set in the proxy) and an inventory of every inline style and third-party origin; it carries `FRAME_ANCESTORS`, which ships alone today (`src/lib/security-headers.ts`).

### Security and abuse

- A per-account throttle on the deletion request `[eng]`: beyond Supabase Auth's own OTP limits it is unlimited; it needs a live session plus a password or an emailed code, so the exposure is a borrowed session rather than a stranger, and the throttle is cheap insurance.
- Limiters `[eng]`: the venue-shaped kinds still sized for a 400-join venue (`rename` and `attach_email` 60, `export` 100 a quarter-hour per address and album, `src/lib/security/abuse-rate-limit.ts`) meet the 2,000-guest wedding's end of night; size them as `join` was.

### The guest's album

- Guests: when the door is next drawn, its pace is an ask beside today's (its held steps carry no X and swallow Escape, `entry-shell.tsx`; the walk through the doorway takes one second, `stage-walk.ts`'s `WALK_MS`; Keep your photos is left by Maybe later or the back arrow): an X and Escape that close a step, and a shorter walk, drawn as options.
- Guests: when the camera is next drawn, its words are an ask ("Take the first photo" then "Take photos", "Shot 6 taken." never for a refused shot: `lib/guest/camera/words.ts`; the Reel card's develop line, `reel-card.tsx`), drawn as options in the board's own camera.
- Guests: a way to ask the host to take a photo down, short of a report; the help center tells a guest to ask the host first, and nothing in the product lets her ask (a board for the viewer's actions, `media-lightbox-parts/actions.tsx`).
- Privacy: the notice's local-storage inventory (`lib/constants/legal-privacy.tsx`'s comment) names neither `pr_develop:<eventId>` nor `pr_roll:<qrToken>` (the period a device last held shots on); its paragraph's "small flags" covers both in words (camera-wiring).

### The host app

- Host: the preferences customize r1's audit ranked and no board drew, each for the next customize round: a cover she picks ("Use as the cover"), "Tell me when" (someone waiting at the door, Review waiting, the develop; after the Notification system), library photos on a Disposable counting against the roll, "Show who took each" for the album and the wall, a fresh roll each day of a range, uploads closing at the develop or the morning after, the strangers' peek of 9 or none, keep out of the reel and feature, a guest's starting tile size set for everyone (scratch-synthesis).
- **Share studio (QR and share-content configurator):** an in-app generator for polished share outputs, so hosts never build their own; it builds on the share sheet's QR designer and Print, its outputs land as share-sheet sections, and it doubles as a growth lever (every output carries the QR).
  - A gallery of printable QR designs to pick from (`print-stock.tsx` prints one design).
  - Card presets (minimal ink and photo-backed), and stock cover images per common event type plus generic sets (hosts rarely have a cover before the event).
  - Toggles for the link, the date and the cover; phone and story formats beside printable ones; several file types; drag-and-drop placement as the stretch goal.
  - The print stock draws the event's own code look, server-side as `FooterQr` draws the classic (`print-stock.tsx` prints the classic shape whatever the look).
  - The code's four looks (Bold's coral corners, "Playful dots") predate the room's design; redraw the set so Create's look step offers looks worth choosing.

### Admin and operations

- Admin: a report about a person (`/admin/reports`) can only be closed: nothing in `/admin` suspends an account, clears a bio or frees a handle (`admin/accounts/[id]` deletes only), so the operator acts out of band.
- **Admin / operations portal** ([`systems/admin-observability.md`](systems/admin-observability.md)):
  - Its look, one exploration once the app work settles: a dashboard with the F1 film's own UI as its reference (never a generic F1 look): minimalist, dense without crowding, alive with motion graphics, with real colour in the charts in both modes (`--chart-1..5` are greys today and feed only `/admin/metrics`).
  - The portal at phone width, for an operator glancing at health away from a desk (the reports queue and the inbox already have phone shapes).
  - An operator-action audit log: what was done, by whom, with an Undo where one exists; an operator's account deletion and its cancel reach only Sentry today (`src/app/admin/accounts/actions.ts`), and `admin_actions` is a proposal.
  - Per-announcement edit and read receipts.
  - Live Stripe subscription health on the account detail (`getAccountDetail` knows only whether one exists).
  - An operator runbook page in `/admin`, for the admin 404's and error screen's unlinked "Check the runbook" (`admin/not-found.screen.tsx`, `route-error.tsx`'s `HELP_BY_AREA`) to link; `/admin/forensics` cites the runbook by doc path today.

### Design system and accessibility

- Design: the hub doors' voice: "Guests" beside "As a guest" invites a mis-tap ("Preview"?), "Guests · 34 guests" says its noun twice, "1 left" and "You let in" read unclear out of context, and "0 guests" stands before anyone is in; for event-header's next round (event-header-r5).
- Design: the guest door's sheet wears three lamps (red, amber, green) along its top, a traffic light where Afterglow draws one light sampled from the cover's photograph; for the brand-applied boards (desk 6) (identity-r5).
- Accessibility: a keyboard cannot reach a toast while a modal holds focus (`ui/sonner.tsx`), and the rooms over the hub fire Undo toasts inside their panel (Review's triage, At the door's Decline); a keyboard way to Undo wants a design.
- Toasts: a sweep so no toast fires where its control can show its own result; about 200 `toast(` calls across 75 files have never been read against that.
- The brand pass the day the v1 icon lands `[eng]` (ASSETS row 19 names every seam it touches), adding the wordmark in white and in ink to the press kit (`scripts/build-press-kit.mjs`), which has never carried it.

### Marketing and content

- Marketing: a page for the disposable camera (shipped, and no `/features` page sells it), and its link into Create with the camera picked (`create-event-wizard.tsx`'s `STEPS`).
- **Generated media: one Higgsfield month.** Every image and every video on the site is generated in one paid month before launch, once more of the site is shaped: the 12 stand-in stills (`src/lib/constants/marketing-media.ts`: the marketing chrome, the blog's covers, OG cards and RSS feed) and every open [`ASSETS.md`](ASSETS.md) row, the demo event's album and the conference and trip stills among them; how the month runs and how a row asks: ASSETS.md "The source".
  - Before buying, sweep ASSETS for every image and video ask so nothing needs a second month; run it question-first, the look as round one and each slot's frame after it.
  - Re-check the plans and terms at the start (last read: $19 / $59 / $129 a month for 270 / 1,200 / 3,000 credits; a Soul 2.0 image costs 0.12 credits, so the video decides the tier; Plus's free images and unlimited Kling are website-only; the MCP spends credits; outputs stay ours after cancelling but are not exclusive, and Higgsfield may train on them).
  - When the privacy hero's photograph lands (ASSETS 38), re-measure the words' contrast over the pane's loop at each width (no script does it yet: pause the veil's animations, seek points of its loop, hide the words, take each text box's 95th-percentile backdrop luminance and keep each line's worst contrast) (the pools were sized on the stand-in), and look at the pane's four rests on it.
- **The support-automation arc:** a help chat before launch (bottom-right, answering from the help center and the site on a cheap AI Gateway model, rate-limited under a spend cap, its cost put to Will before any spend; Libraries.dev's agent-interaction effects, access asked when its lane starts); AI-default first responses keyed on `contact_submissions.topic`, and routing rules in `/admin/support` (a topic is a pipeline); published copy commits to outcomes, never to who answers, so both can change (the promise-neutralization doctrine, [`systems/marketing-content.md`](systems/marketing-content.md)).
- **The AI-SEO content arc:**
  - `.md` mirrors of key pages (the llms.txt spec's optional convention).
  - The `/u/[slug]` sitemap and robots decision (a slug feed or not): a claimed profile is public and indexable but in no sitemap (`src/app/sitemap.ts`, `src/app/robots.ts`), and it shows no event until its owner picks one.
  - A WebSite `SearchAction` in the JSON-LD (it needs a real `?q=` search route, which the site lacks).
  - AI-referral analytics (user-agent-tagged hits on `/llms.txt`).
  - `FAQPage` JSON-LD per help article, each a clean question-and-answer pair (the articles carry `ArticleJsonLd` and breadcrumbs today).
- The marketing site tuned at phone widths, judged on Will's phone `[eng+human]`.
- The marketing site on a real iPhone `[eng+human]`: the privacy lens on /features/privacy was never driven in WebKit, so its two mitigations (`isolation` on the pane's rounded clip, `will-change` on the filtered veil) wait on a first iPhone look.

### The lab and the kit

- **Lab explorations no board asks yet** (each is a board when a seat frees; its brief rechecks the desk for overlap first):
  - The host's own words on a Public album's welcome: the event's description, in her voice (`components/guest/door/welcome.tsx` shows the album's name, its host and its date, never the description).
  - Finding one photograph in a thousand (sort, date, person, kind), in the guest album, the host gallery and a person's own uploads across every album (the profile's Uploads, `get_my_uploads`, a like-count sort among them).
  - The product with a keyboard and a screen reader, end to end.
  - Which surfaces have a dark mode, who can switch, and what a guest gets.

## Launch

**The clean launch point** (launch when everything is done): every published claim is true, every promised path exists, every backend job is operable from `/admin`, and the switches below flip in a known order with nothing else pending.

**The `[human]` switches, in order:** counsel sign-off, the DMCA agent, the `privacy@` and `help@` mailboxes → `LEGAL_PARTY` and both documents effective → Stripe live ([`PRICING.md`](PRICING.md) "Test to live cutover") → Vercel Pro (the analytics vendor, the Spend cap, Supabase's cap and with it Realtime's ceiling, Cloudflare fronting and CSAM scanning at the DNS move; each vendor's launch column: PRICING.md "Each vendor's guard") → secrets Sensitive, the Sentry alert rule, one DB-backup test-restore → the test-data reset, the demo token repointed, `PRUNE_MODE=live`, "Allow new users to sign up" back ON (off until launch, so only test accounts exist) → the program teardown.

- The legal rewrite: `legal-privacy.tsx`'s location lines predate the full strip (273, "For the common photo and video formats ... A few formats are stored exactly as sent."; 279, naming JPEG, PNG, WebP, MP4, MOV; 282, "HEIC, HEIF and AVIF images and WebM videos are stored exactly as your device sends them"; 664, "for the common formats"); the truth: every format the service accepts is stripped, except a file its parser cannot walk safely, which is stored as sent (`src/lib/media/strip-metadata.ts`); and it says nothing of the capture time now kept (the file's minimal Exif keeps when it was taken, never the zone, place or device; `media.captured_at`).
- The legal rewrite: the Privacy Policy's reports lines ("Every report is reviewed before anything comes down", "filing one never removes content by itself", "Reports are stored without the reporter's identity") and the Terms' moderation paragraph ("reports are anonymous and are reviewed before anything is removed") predate the instant hide and the confirmed address a report keeps while open (its keyed hash after, on the worst kind); the rewrite takes them, with `legal-privacy.tsx`'s "never auto-hide" comment.
- A demo event set and ready on every environment: nothing guards `NEXT_PUBLIC_DEMO_QR_TOKEN` (optional in `src/lib/env.ts`, inlined at build), so a deploy without it ships a footer without the code.
- Enable passkeys `[human]`: the Supabase dashboard (Auth) with the RP id on the apex, then `NEXT_PUBLIC_PASSKEYS=1` (the account page's card is wired and dark).
- Raise Supabase Auth's email rate limit `[human]` (100 an hour across the project; Authentication, Rate Limits) before launch traffic: new events ask for confirmed emails by default, and a 150-guest door outruns it in an hour (the door names the refusal, and the host's switch is the live valve; the launch number is in PRICING.md "Each vendor's guard", the dashboard's maximum checked first).
- Pick the web-analytics vendor at the Vercel Hobby → Pro cutover `[eng+human]`: Hobby counts pageviews only; Pro turns on the wired custom events but bills them. Candidates: Vercel, PostHog (with funnels and session replay), Cloudflare Web Analytics (free, shallow), self-hosted Umami, and GA4 (free, with a consent banner and ad-block losses; the move if Google Ads enter). The swap is one file (`src/lib/analytics/web.ts`, [`systems/notifications-analytics-growth.md`](systems/notifications-analytics-growth.md)), and the pick decides whether `(app)` mounts the delegated click listener (its `trackAttrs` are inert today).
- The plan limits at launch `[eng]`: edit `src/lib/jobs/limits-watch-limits.ts` (the one home) for the launch plans: Vercel Pro's credit for Hobby's allowances (with Observability Plus its API answers Active CPU, so the estimate goes), Resend Pro's 50,000 a month, Workers Paid's 10M requests, each vendor's plan name, and the Supabase wording with the spend cap's state.
- Google Cloud stays free in production `[eng+human]` (Will: never pay here): project `partyreel-498522` (the Partyreel account) needs no billing account; before launch, check the Drive API's per-user quotas against a launch day.
- Google's account chooser says "to continue to ddafaemglzmuekbtjwzn.supabase.co" and points at that host's policies, a launch-trust question for Will: a custom auth domain (Supabase's custom-domain add-on, a recurring cost) or the OAuth consent screen's branding, checked against Google's current rules first.
- The legal pass, once, right before launch: the Terms and the Privacy Policy rewritten whole against the shipped product and its system docs, then counsel signs the result. Until then they lag production, since signups stay off: no lane edits or drafts them, and no milestone waits on them. Drafts so far: the Questions in `git show 5d8c57c9:docs/tracks/safety-wiring.md` (the guest list always on, the host's block and its kept address) and `git show c6bd5f5f:docs/tracks/triage-wiring.md` (the reports clause), the private count's sentence, and a reporter's confirmed address kept only until the report closes.
- The counsel sign-off gate `[human]` ([`systems/trust-safety-forensics.md`](systems/trust-safety-forensics.md)): the Privacy Policy's and the Terms' forensic-capture disclosure (IP, UA, geo and device UUID per upload), the CSAM incident runbook, the retention schedule (media-lifetime rows, one-year preservation), the pre-strip EXIF capture go/no-go; the eight-item checklist for counsel: `git show 7419d4d3d:docs/decisions/t1-forensic-csam-policy.md` ("Confirm-with-counsel checklist").
- NCMEC CyberTipline ESP registration `[human]` (what it needs: trust-safety-forensics.md "NCMEC registration"); if refused, report actively anyway.
- Enable the Cloudflare CSAM Scanning Tool at the DNS move `[human]`: free, and it scans only what Cloudflare proxies, so not presigned R2 media; say so plainly (trust-safety-forensics.md "NCMEC registration").
- Stripe test → live `[eng+human]`: the runbook is [`PRICING.md`](PRICING.md) "Test to live cutover".
- Legal go-live `[human]`, after counsel signs: (1) fill `LEGAL_PARTY` in [`src/lib/constants/legal.ts`](../src/lib/constants/legal.ts) (entity, state, address, DMCA agent) and flip both documents' `status` to `effective` with an `effectiveDate`; `legal.test.ts` refuses a bracketed placeholder once effective, and the flip needs one line of that test (the rehearsed diff: `git show b19e008e^:docs/tracks/legal-billing-truth.md`, Handoff); (2) register the DMCA designated agent with the Copyright Office ($6, renewed every three years) so the Terms' safe-harbor section is true; (3) create the `privacy@partyreel.com` mailbox both documents name, routed to the support inbox.
- Swap the demo event to curated media `[eng+content]`: repoint `NEXT_PUBLIC_DEMO_QR_TOKEN` to a dedicated event with approved media (ASSETS row 5).
- Confirm the Sentry email-alert rule fires `[human]`.
- Configure the app project's Vercel firewall `[eng+human]`: it has no custom configuration (the API answers "not found"), so volumetric abuse meets only the defaults.
- Set `crons.disabledAt` on `partyreel-admin` `[eng]`: a second stop behind the purge route's surface guard, so the admin project never runs the purge cron.
- The pre-launch test-data hard reset `[eng]`.
- Flip the backup prune to live `[human]`: `PRUNE_MODE=live` in `workers/backup/wrangler.jsonc` and a redeploy, once the primary holds real media (it ships in dry-run, deleting nothing; [`systems/durability-backups.md`](systems/durability-backups.md)).
- The git workflow for production `[eng]`, decided when the program ends: straight to `main` for speed, or branches and PR previews once real users arrive.
- **The elevation-program teardown** `[eng]`, when the program's final milestone merges: re-enable Vercel SSO deployment protection (`ssoProtection: all_except_custom_domains`); delete the temporary Stripe TEST webhook endpoint `we_1U1I3GPtjqmVkBwkjUqWGpvR` (the launch-prep preview endpoint; it must not survive into the live cutover); remove the preview origin from the R2 `partyreel` bucket's CORS and the Supabase auth redirect allow-list; remove the branch-scoped Vercel env vars (`NEXT_PUBLIC_SITE_URL`, `STRIPE_WEBHOOK_SECRET` at launch-prep) and every `DESIGN_PREVIEW_KEY` row on both projects (Production, the unscoped Preview and launch-prep); delete the `launch-prep` branch and the `lp/*` remnants; settle the `lp/*` build gate (`vercel.json`'s `ignoreCommand` → [`scripts/vercel-ignore-build.mjs`](../scripts/vercel-ignore-build.mjs), and its `git.deploymentEnabled`) with the git workflow above; and return CLAUDE.md's git section to the post-program rule.
- Close the AWS Remotion sub-account `[human]`: the reel renders on the device and nothing uses Remotion, so the sub-account under `partyr33l@gmail.com` (the `remotion-lambda-role` / `remotion-user` IAM, the deployed Remotion site and function) has no use.
- Toggle the secrets to Vercel "Sensitive" `[human]`: every env var stays non-sensitive before launch so values stay swappable; at launch every secret `src/lib/env.ts` reads flips.
- One DB-backup test-restore `[human]`: prove the backup restores before it is the only copy.
- The `help@partyreel.com` mailbox `[human]` (`SUPPORT_EMAIL`): the help center and the documents name it; confirm the receipt path once it exists.
- Submit the apex to the HSTS preload list `[human]`: a one-way door for the domain and every future subdomain (`max-age` already meets the list's requirement; the header ships without `preload` on purpose, `src/lib/security-headers.ts`).
- Release the first live prune run's hold `[human]`: after `PRUNE_MODE=live`, the first run holds on the test-data reset's backlog and a hold never releases itself; release it on the prune's card in `/admin/jobs` once its backlog reads as the reset's (`durability-backups.md`).
- The spend watch's cutover settings `[eng]`: hourly at Vercel Pro (`vercel.json`'s `0 * * * *`, the jobs catalog's `expectedEveryMs`, its cadence words), and `RESEND_DAILY_QUOTA` null at Resend Pro (`src/lib/jobs/spend-watch.ts`).
- Cost switches at the cutovers `[human]`: Vercel's CDN on Flat Rate or on demand, picked at the Pro cutover by the month's requests and bytes (PRICING.md prices both); Cloudflare Pro with the media domain at the DNS move (PRICING.md's lever "A media domain on Cloudflare").
- The legal rewrite: `/privacy`'s "Delete your account" (`legal-privacy.tsx`) and `/terms`' "Deletion is immediate and permanent" (`legal-terms.tsx`) say what a deletion does now: what anyone can see goes at once, the nightly purge erases the rest, then the address can start fresh, and her uploads in other albums can go in the same step.
- The legal rewrite: `/privacy`'s Cookies table (`legal-privacy.tsx`) says three cookies; `pr_welcome_<qr>` (a year, essential) is a fourth, not local storage, and the held door keeps her chosen photos in IndexedDB up to 14 days (`wait-picks-store.ts`).
- The legal rewrite: the Terms (`legal-terms.tsx:425`) and the Privacy Policy (`legal-privacy.tsx:311`) say blocking someone removes each of you from the other's social surfaces, while a profile block only severs follows (`block_user`).

### Launch-gated, from elsewhere

- Guests: measure on a real iPhone and an Android phone how many files and bytes one share sheet takes before it fails or stalls; Save packs 100 MB a sheet on an unmeasured guess (`SHEET_BYTES`, `lib/export/take-home.ts`).
- Billing: measure an iPhone photo and a 30 s video (about 19 MB at the camera's default) uploaded at the camera's defaults on the alias (`media.file_size_bytes`); at 1.3x or more, retune `AVG_PHOTO_BYTES` / `VIDEO_BYTES_PER_MIN` (`constants/tiers.ts`), which every published estimate reads.
- Analytics: every visit to an event's link records as `qr_scan` (`e/[token]/page.tsx`), so scans and shared-link opens are one count; tag the QR's encoded URL with a marker the page records and strips (`history.replaceState`) before real codes print.
- Vercel / Next.js optimization: front Vercel with Cloudflare: DNS sits at GoDaddy, and the move gets its own runbook (the nameserver switch, the three `_vercel` ownership TXTs, Resend's SPF/DKIM/DMARC records, the apex, `www` and `admin` records, proxying off for Vercel-hosted names).
- Vercel / Next.js optimization: the export Worker on its own `export.partyreel.com` (it answers on `*.workers.dev` today, `EXPORT_WORKER_URL`), with the DNS move to Cloudflare.

## After launch

Bigger ideas that need product reshaping or a decision before they are roadmap-ready (co-hosts, a referral program, host 2FA, proactive CSAM filtering, NSFW and host trust-level configs, a content CMS, a Backblaze B2 cross-vendor backup tier, …) read back with `git show e8d11584c^:docs/ROADMAP.md`; pull one in when it is ready.

### Platform, data and cost

- Durability: a maintenance script that rewrites a stored object in place (the EXIF backfill) refreshes the backup's copy past its lock too, or the reconcile reads the difference forever (backup-reconcile).
- QA hardening: a dedicated `JOB_API_SECRET` for `/api/internal/job-run`, whose callers (the backup Worker's heartbeat, the DB-backup Action) send `PRUNE_API_SECRET` today, so one leaked copy also opens the prune's confirm route; it needs the three env homes, a Worker secret and a GitHub secret.
- Vercel / Next.js optimization: `cacheComponents` / `"use cache"` adoption after launch (why it waits: [`systems/architecture.md`](systems/architecture.md)).

### Security and abuse

- Trust & safety: "Delete our copy from her Drive", an audited operator act for a takedown of an item a send delivered (it needs the connection's key at the time; written to `forensic_audit_log`).
- Trust and safety, each gated `[eng+human]`: CSAM scanning past proxied traffic (presigned R2 media goes unscanned) and proactive hashing at scale; a pre-strip EXIF capture only on counsel's sign-off (`systems/trust-safety-forensics.md`).

### Billing and pricing

- **Billing follow-ons:**
  - Grandfathering at the first price change (the policy: [`PRICING.md`](PRICING.md) "Grandfathering"): `planForPriceId` (`src/lib/stripe/plans.ts`) maps several historical Price IDs per plan, the newest the public offer.
  - Per-pass management in the dashboard: which stacked pass a renewal extends, and each pass's expiry in the storage meter (a renewal extends the soonest-expiring pass today, billing-caps.md).

### Uploads, media and exports

- Drive: live sync as the second version on the same queue, its decisions per `systems/drive-export.md`'s "The next versions" (only approved, visible items after a grace window; a `trash` act with its own audit; no lane held while idle; the guest-facing privacy text).
- Drive: Dropbox through `save_url`, the lease carrying a presigned GET (`systems/drive-export.md`, "The next versions").

### The guest's album

- **The reel:** ideas that cost no storage, since a reel is a recipe:
  - A host featuring one clip on the album, and a shareable clip link.

### Accounts and profiles

- **User profiles and social discovery** (not launch-gating; the consent model, a one-way door, is in [`systems/profiles-social.md`](systems/profiles-social.md)):
  - The social feed and discovery, a followed-hosts feed first (nothing reads the events of the hosts you follow), after the Notification system.
  - The guest list sorted by upload count, a nudge to contribute (`getEventGuestList`, `src/lib/db/queries/social.ts`, sorts by name).
  - The guest look's strip (a name's count and four of its pictures in this album, a page's shown events) under the name in `social/guest-peek.tsx`; it needs a read by guest row or account, presigned and gated like the album.

### The host app

- Host: the far-from-home chooser could open on the cities her past events kept, so a host who travels for parties starts where she last was (event-zone).
- Host: her usual for new parties (the style, the roll, the develop's hour), set in Account, only if hosts ask; never offered in Create (customize r1's `mine`) (settings-wiring).
- Dashboard: Last opened could say when ("opened yesterday") from production's `openedAt` (host-dashboard r4's idea).
- Dashboard: a guest album she opened is in neither Recent nor Last opened (only a host's own event is stamped); stamping one wants a table of its own.

### Admin and operations

- Jobs: the storage sums' check at scale: past about 2,000 hosts a pass outlasts a night and reads Needs a look each night; give it a share or a cron of its own, or check only the hosts whose sums moved plus a weekly whole pass (storage-sums-signal's Q3).

### The lab and the kit

- Lab exploration: the privacy hero's two runners-up: the sweep (tiles clearing in one pass of light) as a generic hero's foundation, and the aperture (a blurred photograph breathing in a hairline ring), polished, as a minimalist CTA card's background (their code: `git show cdc979a6:"src/app/(dev)/design/sandbox/privacy-hero/concepts-layer.tsx"`, `SweepConcept` and `ApertureConcept`, with `concepts.ts` and `concepts.css` beside it).
- Lab exploration: what a host learns about their own event (views, contributors, the photograph everyone liked).
- Lab exploration: whether an album installs to a phone, and who is ever asked to (`src/app/manifest.ts` installs the site's root, with no service worker).

### Code hygiene

- Code hygiene: her stage's rule and her Display share one jsonb (`profiles.events_display`), each written read-then-write, so two devices writing within a round trip keep the later write whole; a jsonb-merge RPC or the rule's own column if that ever matters (crumbs-82).
- Code hygiene: the dashboard's remembered choices (her layout, her stage's rule) never age, so another device's later choice shows in a long-lived tab only after a reload; age them out as the search's `QUERY_KEPT_MS` does if it is noticed (crumbs-82).
