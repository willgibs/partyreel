---
track: save-sheet
status: handed-off            # open -> handed-off; deleted in the merge commit that integrates it
cut: "614bb68e"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/media/share-save
  - src/components/shared/media-lightbox-parts/actions
  - src/components/reel/clip-finish
  - src/components/reel/clip-creator.tsx
  - src/lib/reel/client-save
  - content/help/a-clip-wont-finish-or-save.mdx
  - content/help/make-your-own-clip.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/guest-flow.md
  - docs/systems/reel.md
  - docs/systems/uploads-and-r2.md
---

# lp/save-sheet

**Goal.** On an iPhone, Save opens the system sheet in one tap, in the photo viewer and in the clip's finish, because that sheet already carries every way to keep the file (Save Image or Save Video into Photos, Save to Files); the two-item menu (Save to Photos, Download file) goes. Everywhere else Save stays the plain download it already is.

## The brief

Will checked Save on his iPhone: "Save to Photos" opens the system sheet with every save action in it, Save to Files included, so the menu's second item, Download file, asks a question the sheet already answers. His words: we may not need to differentiate between save to photos or download file when download is clicked, just open the save sheet, unless differentiating helps other devices. It does not elsewhere: Android's download already lands in the gallery and a desk downloads, and both already have one plain Save.

The shape:
- `src/lib/media/share-save.ts`: `saveChoices(platform)` answers one choice on iOS, the sheet with the file; its comments say why (the sheet carries Photos and Files alike). The lapsed-activation path stays (a slow fetch comes back `needs-tap` with the file in hand, and Save becomes the one-tap "Ready"), and so does the fallback to the plain download for a file past `SHARE_FILE_MAX_BYTES` or a browser whose sheet would refuse the file.
- The viewer (`media-lightbox-parts/actions.tsx`): on iOS, Save is one button through its idle, preparing and ready states; the dropdown goes.
- The clip's finish (`clip-finish.tsx`): on iOS, Save is one tap to the sheet; the creator's lapsed-tap toast (`clip-creator.tsx`) names the button as it now reads.
- `src/lib/reel/client-save.ts`: its comment stops naming iOS's Download file.
- Help tracks shipped reality: `a-clip-wont-finish-or-save.mdx` and `make-your-own-clip.mdx` describe one Save that opens the phone's own sheet on an iPhone.
- Tests: the decision tree's tests and the two surfaces' pins reshaped, each with its reason.

The system docs belong to the Orchestrator: put these lines in your Handoff, each refined in place: `guest-flow.md` (about line 216, "Save offers Save to Photos first on iOS"), `reel.md` (about line 195, the finish's Save), `uploads-and-r2.md` (about line 109, the CORS readers).

The label on the one button is Save (the sheet names the destinations); say so under your calls. Verify on a local server at 375 with an iOS user agent through the decision tree's tests and the rendered buttons; the real sheet is Will's ten-second check on build 11, so name it in your Handoff's look-at-first.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- none: the brief pre-answered the one open call (drop the second choice everywhere the system sheet already
  covers it, in Will's own words), so nothing here was a fresh one-way door needing a product/UX call.

## System-doc edits (in place, owned facts only)

- none owned: `guest-flow.md`, `reel.md` and `uploads-and-r2.md` are this lane's `reads`, not `owns`, and the
  brief's own instruction is to hand their refined lines to the Orchestrator rather than edit them here — see
  "System-doc lines for the Orchestrator" under Handoff below.

## Deferred (ROADMAP one-liners, bucket named)

- none: everything the brief listed landed in the work commit; nothing pushed to a later round. (No ROADMAP
  line named this track either way — it was cut straight from Will's iPhone check, not a ROADMAP "Now" line.)

## Handoff (replaces the chat report)

- Work commit `37325628` (full `373256288b57730b9d067e0fc8a9a385afe4c8c1`), pushed to `lp/save-sheet`. No sync
  commit: `origin/launch-prep` moved by two commits after this lane's cut (`cb4a5de2` "cut: album-docs...",
  `17e6ace6` "pickup: build 10 live..."), and both touch only `docs/tracks/album-docs.md` (a new manifest),
  `docs/STATUS.md` and `docs/tracks/orchestrator.md` — no code, nothing in this lane's `owns` or `reads`,
  neither a merge of another lane's code — so per Agent boot's Sync rule none was needed. The manifest commit
  is this one; the head is in the chat line.
- Every claim below names its artifact (a commit, a test name, a path/line), so the Orchestrator checks rather
  than believes.
- Gates, all run on `37325628`'s tree (`pnpm format` afterward reported all 8 checked files "unchanged", so
  the gate's tree and the committed tree are identical):
  - `pnpm typecheck`: exit 0 ("Types generated successfully").
  - `pnpm lint`: exit 0, 0 errors; 6 pre-existing warnings, all in files this lane never touched
    (`_desk/review-session.tsx`, `sandbox/home-hero/shared.tsx`, `(paper)/contact/contact-form.tsx`'s
    `react-hooks/incompatible-library` note, `marketing/sections/features/album/{album-fill-grid,review-switch}.tsx`).
  - `pnpm test`: 482 test files / 5395 tests, all passed.
  - `zsh scripts/build-lock.sh pnpm build`: exit 0, no errors (the `/help/[slug]` SSG pass includes both
    edited articles).
  - `pnpm lab:smoke --base http://localhost:3131`: 272 checks, 0 failing (whole suite, run because this lane
    changes non-test files under `src/`). `/design/boom` shows a 500 in the smoke log by design (confirmed
    directly in `tools/boom/page.tsx`'s own comment: a permanent boundary probe that throws on purpose) —
    pre-existing, unrelated to this lane.
  - `pnpm lab:demo` not run: this manifest's `board: none`.
  - Extra: both edited help articles fetched live off the dev server (`curl localhost:3131/help/...`) and
    grepped for the new copy, confirming the MDX pipeline serves the change, not just the build log.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` (11 files once this manifest lands) = the 7
  `owns` prefixes' 8 files + this manifest, plus 2 exceptions (their pins asserted exactly the menu this lane
  removed, so they had to move with it — Agent boot step 6's "a single line in another lane's file is an
  exception, listed with why"):
  - `src/components/reel/clip-creator.test.tsx` — one test ("on iOS, Save offers Save to Photos first, then
    Download file") reshaped for the one-button behavior, plus one doc-comment line.
  - `src/components/shared/media-lightbox.test.tsx` — one test ("offers Save to Photos first and the file
    second on iOS") reshaped the same way.
  Neither file's other ~470/~1300 lines were touched, and no live lane's manifest claims either file
  (checked every `docs/tracks/*.md`'s `owns`).
- The items:
  - `saveChoices(platform)` (`src/lib/media/share-save.ts`) now answers one choice, not two: `["photos"]` on
    iOS, `["file"]` elsewhere; its own comment and the module's top "★ iOS HAS ONE WEB DOOR" note say why
    (the sheet already carries Photos and Files alike). Verified: `share-save.test.ts`'s reshaped "offers the
    sheet alone on iOS..." case.
  - The viewer's Save (`media-lightbox-parts/actions.tsx`, `ActionCapsule`): the iOS branch is one button
    through idle ("Save"), preparing ("Preparing to save") and ready ("Ready to save. Tap to save.") alike;
    the `DropdownMenu` (and its now-unused `FileDown`/`Images` imports) is gone. Verified:
    `media-lightbox.test.tsx`'s reshaped iOS pin (clicks Save, asserts the real `navigator.share` call fired
    with the file and `queryByRole("menuitem")` is null) beside the untouched desk/Android pin.
  - The clip finish's Save door (`clip-finish.tsx`, `FinishDoors`): one button always, calling
    `onSave(saveChoices(platform)[0])` instead of branching iOS-dropdown-vs-plain-button itself; the
    `DropdownMenu`/`ChevronDown`/`FileDown`/`Images` imports are gone. Verified: `clip-creator.test.tsx`'s
    reshaped iOS pin, same shape as the viewer's.
  - `clip-creator.tsx`'s lapsed-tap toast now reads "Tap Save once more to open it" (was "...Save to
    Photos..."), matching the button's own label and Share's parallel toast.
  - `client-save.ts`'s header comment stops naming iOS's "Download file": `saveBlobLocally` is iOS's silent
    fallback only now (the sheet refused, or the fetch failed), never a menu pick, alongside its unchanged
    job as Android/desk's plain Save.
  - Both help articles (`a-clip-wont-finish-or-save.mdx`'s "I can't find the saved file",
    `make-your-own-clip.mdx`'s Save bullet) describe the one sheet, not a choice between two named buttons;
    neither wraps Apple's own sheet labels ("Save Video"/"Save Image"/"Save to Files") in `<UiLabel>`, since
    that component is reserved for Partyreel's own UI strings (its comment: "readers should recognize these
    exact words in the product") and those three are the OS's words, not ours.
- Assets requested from Will: none.
- Board ideas: the bulk export dialog (`/design/lab/export-flow`, `sandbox/export-flow/board.tsx`) still
  offers an iOS "Save to Photos first, the zip to Files second" two-way choice in its own Foot. This lane
  didn't touch it (a zip, not a single photo/video; its own board with its own ledger already), but Will's
  save-sheet reasoning here may apply there too — worth a look if that board comes up again.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule:
  - The one button's label stays plain "Save" everywhere on iOS — idle, preparing and ready alike, never
    "Save to Photos" — since the sheet itself now names every destination and the brief said so directly.
  - The lapsed-tap toast reads "Tap Save once more to open it" (dropped "to Photos"), mirroring Share's own
    "Tap Share once more to open it" exactly.
  - The two help articles name the sheet's own destinations ("Save Video (or Save Image)... Save to Files")
    in plain prose rather than as `<UiLabel>` chips, since those are iOS's words, not Partyreel's.
- System-doc lines for the Orchestrator (this lane doesn't own `docs/systems/`, so these are refined-in-place
  suggestions, not edits — each replaces the line named, it doesn't sit beside it):
  - `guest-flow.md:216` — replace "Save offers Save to Photos first on iOS (the system sheet with the file is
    the one web path into Photos) and the plain download elsewhere" with "Save offers the system sheet in one
    tap on iOS (its Save Image/Save Video is the one web path into Photos, and the same sheet already carries
    Save to Files) and the plain download elsewhere".
  - `reel.md:194-195` — replace "Save follows the platform ([`share-save.ts`](../../src/lib/media/share-save.ts):
    on iOS Save to Photos, then Download file), naming the file after the event (`-clip.mp4`)" with "Save is
    one tap into the platform's own action ([`share-save.ts`](../../src/lib/media/share-save.ts): the system
    sheet on iOS, the download elsewhere), naming the file after the event (`-clip.mp4`)".
  - `uploads-and-r2.md:109` — replace "the viewer's Share and Save to Photos, fetch with `cache: "no-store"`"
    with "the viewer's Share and Save, fetch with `cache: "no-store"`" (the button's own label dropped "to
    Photos"; the internal function `saveToPhotos` is unchanged and still the CORS reader named here).
  Heads up for whoever applies these: `album-docs` (cut at `cb4a5de2`, after this lane's base) is also queued
  to write lines into `guest-flow.md` and `reel.md` — sequence or diff against its landing so the two sets of
  edits don't clobber each other.
- Look at first: the real system sheet on an iPhone (Safari) on the `launch-prep` alias, both surfaces — the
  guest album/host gallery viewer's Save on an approved photo AND video, and the reel's "Make your own"
  finish's Save on a finished clip. Confirm one tap opens the sheet directly (no intermediate menu) and the
  sheet's own "Save Video"/"Save Image"/"Save to Files" all still work. This is the ten-second check the
  manifest names for build 11 (Will's own iPhone). Everything else here is decision-tree logic and copy,
  already pinned by tests at an iOS user agent (jsdom can't drive the real `navigator.share` sheet, so the
  live tap is the one thing this lane could not verify itself).
