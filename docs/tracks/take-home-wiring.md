---
track: take-home-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5dc4dee8"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/live-gallery
  - src/components/guest/guest-action-dock
  - src/components/app/export/
  - src/lib/export/
  - src/lib/media/share-save
  - src/lib/media/preview-size
  - src/components/shared/media-lightbox-parts/actions
  - src/lib/upload/
  - src/lib/r2/
  - src/lib/guest/use-upload-queue
  - src/app/api/r2/
  - src/app/api/export/
  - src/app/api/guests/mine/
  - src/app/api/album/
  - src/app/api/events/
  - src/lib/lifecycle/
  - workers/export/
  - supabase/migrations/20261003110000_
  - src/lib/media-cost-policy
  - docs/systems/uploads-and-r2.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/app/(dev)/design/sandbox/take-home/
  - docs/reviews/take-home.json
  - docs/systems/database-security.md
  - docs/systems/durability-backups.md
  - next.config.ts
---

# lp/take-home-wiring

**Goal.** Wire take-home's picks: Select, then Save for a guest (no one-tap Download all), Save into Photos at phone size with each choice's size shown, the host's two downloads (Originals, Phone size), and the phone-size copy (2048 px) every new photo gets, known by every purge and listing.

## The brief

**The round's direction (Will, round 13, carried by every lane):** never dev-tool-ish (the viewfinder's corners survive only as a focus mark, never a style, and so does nothing of their loading state); a host of 1 to about 10 events first, scaling to hundreds; "all work no play is a boring consumer product": delight where it costs nothing in clarity; nothing depends on a timeline (undated, morning-only and multi-day events all read well); "everything should feel as immediate/responsive/snappy, and anything taking longer should provide clear state feedback and potential interruptibility"; Partyreel runs with no AI managing it (every operator fix ships its `/admin` control); cost is designed like the architecture (every image and video action multiplies at scale). Production is the working version: a pick is the best of what was drawn, never a rule. Milestone 34 (round 12) ships to `main` while you read: build nothing heavy (no `pnpm build`, no lab crawl) before the Orchestrator's message that its gate has ended; read, plan and write tests meanwhile.

**Will's answers (take-home r1, his desk on build 45, 2026-10-03), in full:**
- guest=select.
- save=light: "However, let's subtly preview the file size beside images versus files options so they can clearly see that saving to files seems to be a more \"high quality\" download if needed, such as deciding the optimized photos into images may not fully cut it. otherwise it's easy to assume it's the same quality and only a path selection, with no way to get higher quality."
- host=two.
- And the same night: the phone-size copy never counts against a host's storage. His cost rule is "every single image action matters": guest media must never be billed by Vercel.

**Build:**
1. **Select, then Save** (`select`) replaces the guest's Download all: a bar (Cancel, count, Yours, All), tile checks, the shutter turned to Save.
2. **Save** (`light`) puts her picks into Photos at phone size through the share sheet. The originals stay a zip in Files, and each choice shows its size ("24 photos · 15 MB" beside "Originals · 72 MB"), so Files reads as the full-quality path.
3. **The host's Download** (`two`) opens a panel: Originals to keep, Phone size to post tonight. Each is pictured by the album, with its size.
4. **The phone-size copy:**
   - a 2048 px JPEG of every new photo, made in the browser at upload as the preview is (`src/lib/upload/preview.ts`): a third key variant `phone` in `src/lib/r2/keys.ts`, minted at presign and pinned at complete;
   - capped at 4 MB and at half its original's bytes, checked at complete;
   - never counted against storage, like the preview;
   - best-effort: a photo without one falls back to its original everywhere.
   - Videos stay as taken. No backfill: every photo today is test data.
5. **One migration** in `supabase/migrations/20261003110000_*.sql`, which you write and never apply:
   - `media.phone_key` and `media.phone_bytes`;
   - `create_media`'s DROP and CREATE (every overload) with two defaulted arguments, so old callers still work, and its grants restated exactly.
   - The Orchestrator's Advisor reads it before it is applied.
6. **The export Worker** (`workers/export/`) accepts the `phone` key: `isValidExportKey` pins original and preview today. The Orchestrator deploys it.
7. ★ **Every reader of the stored copies learns the third key.** About 31 files list `original_key` and `preview_key`: purge, reclaim, expired events, account deletion, the bin, `guests/mine`, the links routes, `grid-items.ts`. Find every one. Then add a guard test that refuses any purge or listing reading `preview_key` without `phone_key`, so nothing is ever orphaned in R2.
8. **The media-cost guard** (`src/lib/media-cost-policy.test.ts`) refuses three things:
   - `images.remotePatterns` or `domains` in `next.config`;
   - any `next/image` fed a presigned or user URL;
   - any route that streams R2 bytes through a function (`GetObjectCommand` stays in `src/lib/r2/presign.ts`).

**Constraints:**
- Uploads stay a presigned PUT straight to R2, and downloads presigned GETs. Nothing passes through Vercel.
- `use-upload-queue.ts` keeps its API (twelve files import it).
- Red first.
- `wait-wiring` owns `event-experience.tsx`, `guest-upload.tsx` and `event-gallery.tsx`. Any line you need there is an accepted exception: one line, listed in your Handoff.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate (CLAUDE.md's four steps, each on its own exit code); `pnpm lab:smoke --base http://localhost:3133`; `pnpm lab:demo --board take-home` at 1440 and 375; Vitest red first for the phone variant at presign and complete (its two caps), the guard over every reader of the stored copies, the cost guard, Select and Save's sizes, the host panel; a rolled-back MCP check of the migration; measured on your dev server in a headless Chrome of your own (uploads stood in at the network, as `disposable-camera` did): a 12 MP photo's phone copy's bytes and time to make at 375 with 4x CPU, and the share call stubbed (24 phone-size JPEGs handed over, the sizes shown); captures in your Handoff.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Android's Save to Photos.** Built: any phone whose sheet takes a JPEG saves through its sheet (`sheetCanSave`,
  `lib/export/take-home.ts`). Untested on a real Android, whose sheet offers apps rather than iOS's Save Images row,
  so her files may go to, say, Google Photos' upload rather than the phone's own gallery; the alternative there is
  plain downloads (they land in Downloads, which Android's galleries show). Recommended: as built until one Android
  try says otherwise.
- **The host's Phone size is photographs only.** Recommended and built: clips come as taken, with the originals (a
  clip has no copy; the panel says "Clips come as they were taken: 18 · 396 MB, with the originals.").
- **Her Save asks Photos or Files every time.** Recommended and built: no remembered choice, since the size beside each
  way is his note's point.
- **A Save into Photos is all or none.** Recommended and built: past one Save's 2,000 files Photos waits ("Up to
  2,000", and the note "Photos takes up to 2,000 at a time: the originals take them all.") and the originals' zip
  takes every one; saving the first 2,000 would say "Saved 2,000 photos" and leave the rest with nothing to show which.

## System-doc edits (in place, owned facts only)

- `docs/systems/uploads-and-r2.md`: "Open this before you" names taking photos home; the complete seam's variant pin
  takes `phone` (a photograph's alone, a `.jpg`); a new ★ line, every new photograph's phone-size copy, capped twice,
  never metered, its migration applied before the push; the preview line carries the copy and its measurement;
  "Download all" became "Taking photos home" (her choice with its sizes, the one engine and its all or none, his two
  sets, every purge deleting all three copies with its guard, no guest byte billed by Vercel, the Worker taking
  `phone`).

## Deferred (ROADMAP one-liners, bucket named)

- Now: Help: four articles still walk the guest's Download all (`content/help/browse-the-album.mdx`,
  `download-photos-videos-and-albums.mdx`, `share-the-album-after-the-event.mdx`, `how-long-media-is-kept.mdx`), as do
  marketing's sharing feature (`downloads-section.tsx`, `sharing-faq.ts`) and seven blog posts: Select, then Save into
  Photos or Files, and the host's two sets (from `take-home-wiring`).
- Now: The lab: `export-dialog.tsx` keeps only `downloadMenuNote`, quoted by the take-home board and held by
  `mock-parity.test.ts`'s export-dialog entries; it goes when the board retires (from `take-home-wiring`).
- Now: Uploads: the browser prepares each file only when its turn comes (the strip, the measure, the preview and the
  phone copy: 523 ms from pick to presign at 4x CPU on a 12 MP photo, the copy about 290 ms of it); preparing the next
  while the current one uploads would hide it (from `take-home-wiring`).
- Now: Data: with 20261003110000 applied and the types regenerated, the typed seams go: `.overrideTypes` in the four
  sweeps, `reclaim.ts`'s `readPhoneKeys` and `phone-copies.server.ts`, the args objects beside `rpc("create_media*")`
  in `guest.ts` and `host-media.ts`, and `phone-copies.server.ts`'s 42703 fallback (from `take-home-wiring`).
- Now: Testing: under `pnpm dev` the guest album's tiles draw empty (React's props hold each tile's presigned src, the
  DOM's `<img>` has none), while `pnpm start` of the same head and the alias draw them; capture a guest album on a
  production build (from `take-home-wiring`; the probe is the lane scratch's `probe-tiles.mjs`).

## Handoff (replaces the chat report)

- **Commits, pushed** (`lp/take-home-wiring`): work 794b1cb6 (the phone-size copy, its migration, every reader of the
  stored copies, the export's two sizes), 00c12452 (Select then Save, the host's two sets), 292707bc (each set's own
  pictures; `uploads-and-r2.md`), ca21a66a (`sheetCanSave` a pure rule), fa63d250 (a Save is all or none), the WIP
  note b15fc875; syncs 5789dc9a (identity-wiring at 3d80670e and rooms-wiring at d6452566, on the Orchestrator's word)
  and 66837171 (records only: crumbs-55's manifest fix e459ca50, which the first sync's test run tripped on). The head
  is in the chat line.
- **Gates on 66837171**, each its own exit code (logs `_scratch/take-home-wiring/gate-final-*.log`): typecheck 0; lint
  0 (no warning); test 0 (836 files, 9,862 tests); build 0; `lab:smoke --base http://localhost:3133` 0 (164 checks, 0
  failing); `lab:demo --board take-home` at 1440 and at `--width 375`, 0 each ("found no open step": the board's
  asks are answered). On 5789dc9a the suite's one failure was launch-prep's own `crumbs-55.md` (`next.config.ts is
  too broad`), gone with e459ca50.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`, 73 files): owned paths and this file, plus ten
  exceptions, each with its why: `src/lib/validation/upload.ts` (+7: the copy's fields in the four upload schemas,
  which zod would strip); `src/app/api/host/r2/complete-upload/route.ts` (+4 −1: the host's complete records the
  verified copy); `src/lib/db/mutations/guest.ts` and `host-media.ts` (the `create_media*` wrappers pass
  `p_phone_key` and `p_phone_bytes`); `src/lib/db/mutations/media.ts` and `media.test.ts` (the bin's Delete
  permanently deletes the copies too, the brief's "the bin"); `src/lib/db/migration-guards.test.ts` (its
  `create_media` pins reshaped to the new signature, insert and grants); `src/lib/disposable/migration-guards.test.ts`
  (wait-wiring's, one line: the camera_rolls writer counted by kind, since a file replacing `create_media` restates
  its insert); `src/components/guest/gallery-rows.tsx` (+5: the selection handed to the one grid);
  `scripts/seed-demo-event.mjs` (the demo reset keeps a held row's copy). No file is shared with another open lane's
  branch, and wait-wiring's 20261003100000 replaces no function this migration restates.
- **Items:**
  - The phone-size copy: every new photograph's 2048 px JPEG (quality 0.82, laid on white) made in the browser after
    its preview (`generatePhoneCopy`), PUT at `events/<event>/photo/<id>/phone.jpg` (`phoneKeyFor`), minted at presign
    only when it fits 4 MB and half its original (`phoneCopyFits`), HEADed and pinned at complete (the same event and
    media, a photograph's, a `.jpg`), dropped and deleted past either cap, recorded in the `create_media*` insert,
    never metered.
  - The migration `20261003110000_phone_copy.sql`: `phone_key` and `phone_bytes` under three CHECKs (both or neither,
    its own key, within the caps) and no client grant; both RPCs dropped and recreated verbatim but for the two
    defaulted arguments last, their check and the insert's two columns; grants restated to the service role; its
    rolled-back proof at its foot (red 8/8 without it, green 9/9 with it, nothing persisted), pinned by
    `phone-copy-migration.test.ts`.
  - Every purge deletes all three copies (`MEDIA_KEY_COLUMNS`, `mediaKeysOf`): removed media, expired events, the
    standby budget, account deletion, the bin's Delete permanently, the demo seed; the orphan sweep already keys by
    media id.
  - `r2/stored-copies-policy.test.ts` refuses a purge that can forget a copy and a reader of `preview_key` that never
    names the third, in TS and SQL, with the display-only readers listed and why.
  - `media-cost-policy.test.ts` refuses a remote pattern, domain or loader, a `next/image` fed a link or beside a
    presigner, and `GetObjectCommand` anywhere but signed in `r2/presign.ts`; each detector proven not blind.
  - The export: every summary bucket says both sizes (`phone`); a mint takes `size` (a phone-size zip, by the copies'
    bytes); a `save` step mints one Save's links (oldest first, at most 2,000, `more` past it); a guest's `ids` get
    their own `selection`; a host's summary carries the album's `pictures`.
  - The export Worker takes the `phone` key (`isValidExportKey`, both copies; `compat.test.ts`: today's code streams a
    phone-size zip, milestone 29's and 31's Workers refuse it).
  - One Save engine (`take-home-save.ts`): the links at the tap, three reads at once, sheets of at most 100 MB, the
    sheet inside the tap while its activation holds and a Ready tap after, further parts as taps, a broken file tried
    twice and said, the x stopping it all, all or none past 2,000.
  - The guest's Select, then Save (`live-gallery*`, the dock): Select where Download all stood; the bar stuck to the
    top (Cancel, her newest picks, the count, Yours and All); checks on the tiles; the shutter turned to Save with its
    count; Escape to leave.
  - Her choice on a phone: Save to Photos at phone size beside Save to Files (Downloads on Android), the originals'
    zip, each with its size; at a desk, the originals' zip and no question.
  - The host's Download opens Take it home (`take-home-panel.tsx`, the plan popup): Originals, to keep, and Phone size,
    to post tonight, each pictured by the album's newest photographs with its size; Originals leads at a desk and
    Phone size in a hand (a Save into Photos where the sheet can and the set fits, else a phone-size zip); clips said
    beside; Include hidden items.
- **Measured and captured** after the sync in headless Chromes of the lane's own, stood in at the network: the guest's
  flows and the uploader on 66837171's production build (`pnpm start -p 3133`), the host's panel on its dev server (a
  temporary page, never committed); the copy's timing is the browser's own steps alone. Scratch
  `/Users/gibby/local/ai/partyreel-wt/_scratch/take-home-wiring/`:
  - A 12 MP photograph's copy: 601,592 B of its 3,671,488 B, made in 281 to 299 ms at 375 with 4x CPU (the preview
    45,586 B in 93 to 116 ms) (`measure-phone.json`).
  - The real uploader: the presign told `phone_size_bytes: 601592`, then three PUTs (the original 3,671,471 B after the
    strip, the preview 45,586 B WebP, the copy 601,592 B JPEG) and the complete naming `phone_key`; 523 ms from pick to
    presign at 4x CPU (`measure-upload.json`, `upload-*.png`).
  - Her Save of 24 picks, the sheet stubbed: Save to Photos "24 photos · 13.8 MB" beside Save to Files "Originals ·
    84 MB"; 24 phone-size JPEGs (14,438,208 B) handed to the sheet 298 ms after the tap, its activation alive; "Saved
    24 photos.", select mode closed (`measure-save.json`, `save-1-album-select.png` to `save-4-saved.png`).
  - The same on a party's network (each copy held 800 ms): "Getting 24 photos: 3.4 MB of 13.8 MB" and the shutter's
    "Saving 24 photos. Tap to stop.", then "24 photos ready." with Save and the shutter's Ready; the next tap opened the
    sheet with all 24 in hand, 7,049 ms after the first (`measure-save-slow-.json`, `save-slow-*.png`).
  - All of an album past one Save (stood in at 2,345): Save to Photos waits with "Up to 2,000" and the note
    (`measure-save-big-.json`, `save-big-3-choice-sizes.png`).
  - At a desk: her Save of 7 goes straight to the originals' zip ("Preparing your download…"), no question
    (`capture-desk.json`, `desk-*.png`).
  - His two sets at 1440 and 375 (`capture-panel.json`, `panel-1440.png`, `panel-375.png`).
- Assets requested from Will: none.
- **Board ideas:**
  - On a phone the viewer draws the photograph's phone copy (a few hundred KB instead of the original), its Save still
    the original.
  - A long press on a tile opens select mode with that tile picked.
  - The copies carry their photograph's capture time, so Photos files a Save by when it was taken, not when saved.
- **Proposed migrations and Worker changes:**
  - The migration `supabase/migrations/20261003110000_phone_copy.sql`, after the Advisor's read: apply BEFORE the app
    ships (the app names `p_phone_key` and `p_phone_bytes` whenever an upload has a copy, a PGRST202 without them, and
    every purge selects `phone_key`, a 42703), then regenerate the types (Deferred's seams).
  - The export Worker (`workers/export/`): deploy before the app can sign a phone-size zip (the deployed one refuses
    the `phone` key).
  - The backup Worker, on Will's yes: one line, the first statement of `backupOne` in `workers/backup/src/index.ts`
    (the queue and the reconcile both pass through it):
    `if (/^events\/[^/]+\/(?:photo|video)\/[^/]+\/(?:preview|phone)\.[a-z0-9]+$/.test(key)) return "exists"; // originals only: a preview or a phone copy comes from its original`
    The pattern is `DERIVED_COPY_RE` (`src/lib/r2/keys.ts`), pinned against `isDerivedCopyKey` in `keys.test.ts`. With
    it a restore brings back originals only and nothing remakes a copy: the restore then sets `phone_key` and
    `phone_bytes` null on the restored rows (a photograph without a copy saves its original), and each tile falls back
    from a missing preview to its original on its own.
- Proposed Vercel / Stripe / env changes: none.
- **Calls his to overrule:**
  - The four Questions above, each as built.
  - His two sets in the plan popup (wide at a desk, the whole screen in a hand), production's panel, not the board's
    own sheet.
  - The old Download menu retired: his Photos-only and Videos-only zips and her one-tap Yours and Everything are gone
    (her Select's Yours and All, his two sets).
  - A copy past either cap at complete is dropped and deleted and the photograph lands without one (best-effort, as the
    brief says), never a refused upload.
  - Phone links are minted only by a Save, never with the album's window; the viewer's Save still sends the original.
- **Disposable data:** guest rows named "Take-home probe" on the Scale probe album (its door, for the measurements);
  every upload was stood in, so no media row or R2 object was written.
- **Look at first:** `save-3-choice-sizes.png` (her choice, each way with its size), `panel-375.png` and
  `panel-1440.png` (his two sets), the migration's foot (its proof) and the backup line above.
