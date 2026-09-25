---
track: save-sheet
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- The work commit and the sync commit, pushed (or: launch-prep had not moved); the head is in the chat line
- Every claim names its artifact (a commit, a log line, a path), so the Orchestrator checks rather than believes.
- Gates on the synced tree, each on its own exit code, and the sha they ran on
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The items, one line each
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Board ideas: an improvement you saw beyond your lane, one line each (the Orchestrator may open a board for it)
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Calls his to overrule, one line each
- Look at first: ...
