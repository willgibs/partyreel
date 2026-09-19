---
track: export-flow
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "5649285b"          # the launch-prep SHA the branch was cut from
board: export-flow      # round one: getting everything out, for a host and for a guest
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/export-flow/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/uploads-and-r2.md
  - docs/systems/database-security.md
  - src/components/app/export/export-dialog.tsx
  - src/components/app/export/download-all-button.tsx
  - src/components/app/export/use-export-download.ts
  - src/app/api/export/host/route.ts
  - src/app/api/export/guest/route.ts
  - src/lib/export/export-service.ts
  - src/lib/export/build-manifest.ts
  - src/lib/events/gallery-access.ts
  - src/lib/media/download-filename.ts
  - workers/export/src/index.ts
  - src/app/admin/exports/page.tsx
  - src/components/app/event-feed/event-feed.tsx
  - src/components/app/event-feed/gallery-actions.tsx
  - src/components/app/host-media-grid.tsx
  - src/components/guest/live-gallery.tsx
  - src/components/shared/media-lightbox.tsx
  - src/components/marketing/mock-parity.test.ts
  - src/components/marketing/sections/features/sharing/downloads-section.tsx
  - src/components/marketing/sections/features/sharing/zip-modal-demo.tsx
  - src/components/marketing/sections/features/album/album-copy.ts
  - content/help/download-photos-videos-and-albums.mdx
  - src/lib/constants/marketing-media.ts
  - src/app/(dev)/design/sandbox/app-vocabulary/gallery-controls.tsx
  - src/app/(dev)/design/sandbox/guest-shape/spec.ts
  - src/app/(dev)/design/sandbox/app-vocabulary/spec.ts
---

# lp/export-flow

**Goal.** Round one of `export-flow`: GETTING EVERYTHING OUT, the download-the-album act for a host and for a guest,
from the tap to the file in their hands, reconceived from the ground up. Will (2026-09-19, `docs/design/rulings.md`,
"the overnight round"): explore every surface, everything unprotected, "at worst, net neutral and fully deleted". Six
to eight decisions with `defineExploration`, each drawn on the REAL `ExportDialog` and download buttons with fixture
summaries (empty, small, over the cap, a teaser guest with no video) and controllable promise states (instant, slow, hung,
failed) standing in for the hook, phone first at 375 with 1440 on a knob, a recommendation each, every number measured;
no preview ever reaches `/api/export`, an `export_log` row, the limiter or the Worker. **Not in this round:** any
production byte; whether the guest's four dialogs become one sheet (`guest-shape`'s `dialogs`); the bulk bar's grammar
and the Download icon in it (`app-vocabulary`'s `bulk-toolbar`); tier gating of export sizes (`app-pricing`); the demo's
UI-only export skip (recorded); the viewer's per-item Save (`media-viewer`, a sibling lane); the reel's download
(`reel-studio`, a sibling lane); an "export ready" mail (`emails`, a sibling lane; nothing is asynchronous today).

**What is measured (the tree at the cut).** The host's header "Download" (the Gallery section only) and the bulk bar's
icon-only Download open one `ExportDialog`: "Download album" / "Pick what to bundle into your copy.", three chip cards
(Everything, Photos, Videos, with live counts from a summary fetch), an "Include hidden items" switch only when hidden
or pending items exist, a foot with the size ("…" and "Adding it up" while loading), the count ("Nothing selected" when
empty) and a Download button disabled while loading, empty, submitting or over the cap ("Too large to download all at
once. Pick photos or videos to split it up."); "Download selected" from the bulk bar skips the dialog and mints with
hidden items included. The click: a toast "Preparing your download…", a mint, a top-level hidden-form POST of a signed
token (120 s) to the Worker (never an iframe; Chrome blocks cross-origin iframe downloads), a toast "Your download is
starting.", then the browser's own download UI is the only progress and the dialog is already closed. The guest: a bare
"Download all" text link above the masonry (hidden in the demo and at no access), the same dialog without the switch,
capped server-side to exactly what their access returns (a teaser gets its nine photographs and never video, yet the
Videos chip renders and answers "Nothing selected"). The Worker is synchronous, one request in and one zip out, STORE
only, streaming R2 objects through, a missing object skipped silently (a raced-deleted album downloads as a valid, empty
zip); no job table, no persisted file, two kill switches (a DB flag in the admin, a Worker env). Originals byte for byte,
GPS and EXIF already stripped at upload, never re-encoded. The mint has no timeout or cancel (a hung mint leaves the toast
and a disabled button forever). No code, help or test says whether the form-POST attachment saves on iOS Safari. The
marketing mock says the cap is "deliberately unmentioned" while the album feature copy states "Up to 2,000 items" and
the dialog itself never says a number proactively. `/admin/exports` is a log and a kill switch, not a heartbeat. The
pins: the manifest builder, the token (both sides) and the filename tests, all function; `mock-parity.test.ts` pins the
literal copy between the marketing mock and the dialog ("Download album", the three chip labels); nothing touches the
dialog, the hook or either route.

**The decisions (suggested; yours to recut, never forced apart).** WHAT "DOWNLOAD" MEANS (to a guest at a party: the
whole album, as today; their own photographs first, the album beneath; a selection, tiles picked then taken); THE WAIT
(a toast and the browser's own bar, as today; progress inside the dialog, the dialog staying; the job in the background
with a line in the album and a notice when it lands, drawn); STUCK (a mint that never answers: the toast forever, as
today; a visible timeout with Retry; Cancel from the first second); EMPTY (a zip with nothing in it: silence, as today;
a check before the mint that says so; a line after the download); THE OBJECT (a zip, as today; a link that lasts, the
album page itself as the keepsake; a zip per kind, photographs and videos apart); THE CAP (unsaid until it bites, as
today; "up to 2,000 items" said in the dialog; said on the button); THE TEASER'S CHIPS (three chips for a guest who can
have only photographs, as today; the Videos chip gone; the chip present, disabled, with why); THE PHONE (staged after
THE OBJECT: the form-POST attachment and whatever iOS does, as today; the share sheet, the album offered to Photos; the
Files app named in the copy). Optional if it fits the budget: SELECTED (the bulk bar's direct mint with no confirmation,
as today; one light confirmation naming the count; the dialog with the selection pre-picked). The missing timeout, the
silent skip, the marketing contradiction and the heartbeat gap go under Deferred as ROADMAP lines whichever option wins.

**Binds.** The bible; the guest rulings (the host's event, minimal branding; a guest's reading copy at 15 to 16 px); the
never-mint rule (`ExportDialog` calls `useExportDownload()` directly with no seam: replace the hook or intercept `fetch`
scoped and restored, never carry a real `event_id` or `qr_token`, never touch `EXPORT_SIGNING_SECRET`, `EXPORT_MODE` or
the DB flag; `assertExportEnv()` throws when unset, so no fixture path reaches it); the parity pin (a renamed label in a
fixture is a fixture, never an edit to the dialog); the originals invariant (never re-encoded; metadata stripped at
upload); reduced motion honoured; no em-dashes; the copy is open (bible 21). Mobbin is encouraged, never required:
"download all" flows, export progress, share sheets on phones, "save to Photos" affordances.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132`,
  `pnpm lab:demo --board export-flow` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 375 and 1440 on the real dialog with fixture states, no request from a preview; a capture of every
  option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **Can a guest's own uploads be recognised well enough to bundle them?** `means=mine` rests on it.
  Recommended, and carried: yes. `media.guest_id` identifies a signed-in guest and the `uploads` row's
  `device_uuid` identifies an anonymous one, so the set exists server-side today; a guest who cleared
  their browser simply does not get the row, and the album bundle is what they see.
- **May the Worker tell the page anything at all?** Three answers want it (`wait=panel` needs to know the
  bytes started, `hollow=after` needs the skipped count, `stuck=timeout` only needs a clock). Recommended,
  and carried: yes, and cheaply, a `Set-Cookie` nonce on the zip response the page polls for, plus a header
  carrying how many of the manifest's items were really written. Both are Worker changes that land with the
  wiring, and the board draws what they would buy without assuming them.
- **Does the `split` answer to `cap` number its parts by items or by bytes?** Recommended, and carried: by
  items, `MAX_EXPORT_ITEMS` per part, because that is the Worker CPU ceiling the cap exists for; the byte
  cap stays a second, rarer guard.
- **SELECTED was cut for budget.** The bulk bar's direct mint (no confirmation, hidden items silently in)
  was the ninth suggested decision. Recommended, and carried: it belongs with `app-vocabulary`'s
  `bulk-toolbar` grammar rather than here, since the question is what that bar's icon means, not what a
  download is.
- **The dialog is reproduced, not opened.** The shipped `ExportDialog` is a radix `Dialog` that portals to
  the board page out of any lab frame, and opening it fetches a summary. Recommended, and carried: quote the
  shell and keep the body byte for byte (the precedent is `guest-shape/dialogs.tsx` on these same four guest
  dialogs), rather than add a seam to a shipped file this lane does not own.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none (this lane owns only its board directory)

## Deferred (ROADMAP one-liners, bucket named)

- App / reliability: the export mint has no timeout and no cancel, so a request that hangs leaves the toast
  spinning and the Download button disabled until the page is reloaded, with nothing said (`stuck`).
- App / reliability: the export Worker skips an R2 object it cannot find in silence, so an album emptied
  between the mint and the stream downloads as a valid zip with nothing in it and every surface behaves as
  if it worked (`hollow`).
- Marketing / copy: the zip mock says the caps are "deliberately unmentioned" while the album feature copy
  states "Up to 2,000 items" and the dialog itself never says a number; whichever `cap` option wins, all
  three have to agree.
- App / polish: the dialog prints raw integers, so a large album's chips read "2440" and its foot "2440
  items" with no thousands separator (`export-dialog.tsx`, both the chip count and the foot).
- Admin: `/admin/exports` is a log and a kill switch with no heartbeat, so a Worker that is down or an
  export that never completes is visible only as an absence of rows.
- Live check: no code, help or test says whether the top-level form-POST attachment actually saves on iOS
  Safari, which is the device most guests are on; one real iPhone answers it (`phone`).
- App / guest: the bulk bar's "Download selected" skips the dialog and mints with hidden items included,
  with no confirmation naming the count (`app-vocabulary`'s `bulk-toolbar`).

## Handoff (replaces the chat report)

- Head: this manifest commit on `lp/export-flow`, pushed; the code is `5d5ad24a`, synced with `origin/launch-prep` at `0c651986`
  (merge `28002ac3`: registration conflicts in `registry.ts`, `boards.ts` and `touchpoints.ts` resolved by
  keeping BOTH sides, and the RULINGS hunk spanned a row boundary exactly as warned, so `],` `},` `},` `{`
  was spliced back between the two sides; `docs/design/library.md` regenerated by `pnpm design:rules`).
- Gates on the synced tree, each on its own exit code: `pnpm design:rules` ok (123 components, 733
  contracts, 18 policies; it runs the specimen collector, there is no second command) · `pnpm typecheck` ok
  · `pnpm lint` ok (the 8 known warnings, none in this lane) · `pnpm test` ok (2,545) · `pnpm build` ok (254
  static pages) · `pnpm lab:smoke --base http://localhost:3132` ok (432 checks, 0 failing; the board reads
  685 words of a 1,200 budget) · `pnpm lab:demo --board export-flow --base http://localhost:3132` ok (8
  steps, 0 failing, every step draws its options; tallest 1.5 screens).
- Lane check, `git diff --name-only origin/launch-prep...HEAD`:
  `docs/design/library.md` (generated) · `src/app/(dev)/design/(shell)/lab/boards.ts` (one line) ·
  `src/app/(dev)/design/sandbox/export-flow/{board.tsx,dialog.tsx,export-flow.css,fixtures.ts,spec.ts,surfaces.tsx}` ·
  `src/app/(dev)/design/sandbox/registry.ts` (two lines) · `src/app/(dev)/design/touchpoints.ts` (both
  unions plus one RULINGS row after `river-visual`). Every line is inside `owns` or the registration
  exception; this manifest is the only doc touched.
- The decisions, one line each (four roots, four staged; the recommendation last):
  - `means`: what Download hands a guest at a party; the whole album as today / their own shots first with
    the album under / tap what you want then take it. **Their own shots first.**
  - `chips` (after `means`): what the Videos chip does for a guest who can only ever have photographs; three
    chips as today / the Videos chip goes / the chip stays and says why. **The chip stays and says why.**
  - `wait`: what the album shows while the zip is being made; a toast then the browser as today / the dialog
    holds until it lands / a line under the header and carry on. **The dialog holds until it lands.**
  - `stuck` (after `wait`): what happens when the mint never comes back; it spins as today / it gives up and
    offers Try again / Cancel from the first second. **It gives up and offers Try again.**
  - `hollow` (after `wait`): what is said when the zip comes back hollow; nothing as today / it says what did
    not make it / nothing downloads at all. **It says what did not make it.**
  - `cap`: what the dialog does about the 2,000 item limit; unsaid until it blocks as today / said in the
    foot when it is close / the product splits it and never refuses. **The product splits it.**
  - `object`: what the dialog offers as keeping the album; one zip as today / the link first with the zip
    under it / no dialog, it just starts. **The link first.**
  - `phone` (after `object`): what a phone does with the file; the attachment and whatever iOS does as today
    / the copy names where it lands / hand it to the phone's share sheet. **The copy names where it lands.**
- Mobbin: not used this round (encouraged, never required).
- Captures, every option at 375 and at 1440, forty-eight PNGs plus the measured captions:
  `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-0148-4e81-9dca-d9c2f1952d0a/scratchpad/export-flow/shots/`
  (`captions.txt` holds each tile's head, its words and the caption measured off the frame's own DOM).
- Assets requested from Will: none. Every tile is a bootstrap still from `MARKETING_IMAGES`.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none in this round. Three answers, if ruled,
  imply a Worker change at the wiring (a response cookie and a written-count header); nothing is applied here.
- Look at first: `means` at 375 (the guest's own bundle is the round's one product idea), then `cap` (the
  refusal already tells the host to do by hand what the product could do for them), then `object` at 375
  (the album's address in the download dialog). The three staged reliability questions, `stuck`, `hollow`
  and `phone`, are the map's real defects and are cheap to rule.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). The take-it-home act came back as eight decisions rather
than a page: four roots (what Download hands a guest, the wait, the 2,000 item limit, what keeping the album
means) and four staged behind them (the teaser's third chip, a mint that never answers, a zip that comes back
hollow, where the file lands on a phone), every option drawn on the download dialog over a fixture summary
run through the shipped arithmetic, phone first at 375 with 1440 on the knob. The dialog's shell was quoted
because the shipped one is a radix Dialog that portals out of any lab frame and fetches on open; its body is
the shipped body class for class, both grounds carry the REAL triggers drawn inert, and a scoped fetch guard
refused every `/api/export` request for as long as a preview was mounted. Reading each capture against its own
caption caught four defects in the board and one in an option, including a reader that reported the opposite
of what its option claimed.
