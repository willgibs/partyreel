---
track: popups
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: popups
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/popups/
  - src/app/(dev)/design/sandbox/profile-page/
  - src/app/(dev)/design/sandbox/contact-page/
  - src/app/(dev)/design/sandbox/event-safety/
  - src/app/(dev)/design/sandbox/help-center/
  - src/app/(dev)/design/sandbox/host-storage/
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/components/ui/sheet.tsx
  - src/components/ui/dialog.tsx
  - src/components/lab/exploration.ts
  - docs/systems/design-system.md
---

# lp/popups

**Goal.** Open the `popups` board: which surface each kind of popup should use (a sheet, a side panel, a centred dialog, a full page or in place), drawn on real screens at 375 and 1440, so the app stops reaching for one pattern by default.

## The brief

**Will's ask**, from his `identity-claims` r1 note on his build 10 sitting: "Are we using sheets everywhere now? Feels like a less common pattern for users in general, especially used for everything. Many popups would benefit from a different layout/UI." In chat (2026-09-27) he chose a board for it, first on the desk.

**What production uses** (an inventory taken 2026-09-26):
- the Sheet (`src/components/ui/sheet.tsx`; its opt-in `responsive` prop makes a side panel from 640px and a bottom sheet on phones) in 12 files;
- the centred Dialog (`src/components/ui/dialog.tsx`) in 19 files, about 20 sites;
- no AlertDialog;
- custom full-screen Radix overlays in 5 files.

**Who meets which:**
- **A guest meets mostly sheets:** the door (`guest/entry-shell.tsx`), add email (`guest/add-email-dialog.tsx`), confirm email (`auth/confirm-email-dialog.tsx`), share (`guest/guest-share.tsx`), report (`guest/report-dialog.tsx`), and the upload's intent and failure sheets (`guest/upload/`).
- **A host meets both.**
  - Sheets: event settings, pricing and the share sheet.
  - Dialogs: confirmations, the QR designer, the slug, the bin's purge, bulk actions, account deletion and the avatar cropper.
  - The admin has a destructive sheet.
- **Surfaces drawn this batch reach for sheets too:** the upload tracker (`guest-capture`'s "Your uploads", being built by `guest-door`) and the claims review (`identity-claims` r1's banner opens a side sheet).

**The questions.** One per kind of popup, not per screen. The kinds:
- confirmations (delete, discard, leave);
- short forms (rename, add or change an email, report);
- lists to work through (the claims review, the upload tracker, a guest list);
- share (the share sheet, the QR);
- pickers and plans (pricing);
- anything the inventory shows as a kind of its own.

Draw each option on the real screens it would change, at 375 and 1440, with the keyboard up where a field is focused: a bottom sheet, a side panel, a centred dialog, a full page, in place (expanding where it was tapped), and any form specific to the kind. Offer the fix at its source: a rule the components follow (the Sheet's and the Dialog's variants), not a page-by-page choice.

**Out of scope:** the door and its change and confirm sheets stay lit held sheets (`identity-door`, his pick).

**Merge in, every option kept:** surface questions already standing on other boards ask this same decision.
- Move `profile-page`'s `view-all` ("How should the full guest list open from the faces row?") and `quick-look` here.
- Sweep `contact-page`, `event-safety`, `help-center` and `host-storage` for questions whose options are surfaces, and move each here.
- Leave any question that decides something other than the surface.

**Register** the board directly after `identity-door` in `registry.ts`, `boards.ts` and `touchpoints.ts`. Its lines are your named exceptions; the Orchestrator puts it first in `DESK_ORDER`. Author with `defineExploration`; the newest board is the worked example.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The board at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board <board> --base http://localhost:<port>` pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

Each is built as recommended and drawn on the board as a carried call (its id in brackets), his to overrule.

- **Are pickers and plans one kind, as the brief grouped them?** Two asks, `choices` and `plans`: an action sheet
  cannot hold a price list and a wide dialog is a lot of furniture for Take a photo, so no one surface fit both
  without a fallback. Overrule: the plans answer applies to the choices too. [`two-kinds`]
- **Which kinds does the inventory add beyond the brief's five?** `settings` (the longest sheet in the app, his own
  2026-09-20 pick) and `peek` (moved in); the rest stay as they are: the door's held sheets, the viewer, the reel and
  clip maker, menus, search, the photo cropper and Welcome to Pro. [`left-alone`]
- **Which standing asks move here?** `profile-page.view-all` (lists) and `.quick-look` (peek), `host-storage.where`
  (lists: its account page, the album's own list and the sheet from the meter are `page`, `inline` and `sheet`) and
  `event-safety.sheet`, what Block opens (confirm: a sheet, Undo on a toast, in place). They stay: `contact-page.receipt`
  (it decides an email and a reference, not only the surface), `event-safety.blocked` and `.queue` (places in the
  host's app, not popups); `help-center` asks nothing whose options are surfaces.
- **Can a centred dialog hold a field on a phone?** Only once it learns the Sheet's keyboard rule, so every
  field-holding dialog is drawn centred in what the keyboard leaves; today's `DialogContent` is not keyboard-safe.
  Overrule: a dialog with a field becomes the Sheet under 640. [`keyboard-dialog`]
- **How does an answer reach every popup of its kind?** Each popup names its kind and one table beside
  `floating-layer.ts` gives Dialog and Sheet the surface. [`one-table`]
- **Where does the host's whole share kit go if Share opens something smaller?** One tap behind it (Everything, as
  today), in whatever `settings` gets: it holds a field. [`kit`]
- **What opens when a popup is asked for from inside another?** A confirmation or a form sits over it as a centred
  dialog; a plan or another place replaces it in a hand, and Back returns. [`stacked`]
- **Does the upload failure sheet follow `lists`?** No: it opens by itself when a run ends. [`failure-sheet`]
- **Which frame leads a stage?** The three phones, where most options part (the Sheet and a side panel are one
  panel at a desk); `peek` leads with the laptop, where its card at the name lives.

## System-doc edits (in place, owned facts only)

- none (a board: production is unchanged, so no system fact moved)

## Deferred (ROADMAP one-liners, bucket named)

- Now: `DialogContent` has no overflow scroll and no keyboard rule, so account deletion's password and Report a
  person's textarea take focus on open and sit under an iPhone keyboard today, whatever `popups` answers
  (`account-delete-card.tsx`, `profile-actions-menu.tsx`).
- Now: the "Like this" door (`likes-provider.tsx`) is the one account door drawn as a centred dialog, its email field
  focused on open; it takes the door's held sheet when wired.

## Handoff (replaces the chat report)

- **Commits, pushed:** the work `c238a48c`; the sync `479928b7` (a merge of `origin/launch-prep` at `1d50cd1a`, no
  conflict: door-r3, claims-r2, story-r3, reel-marketing and profile-setup had landed); the stage order `7c5c4dd4`.
- **Gates on the synced tree at `7c5c4dd4`**, each on its own exit code: `pnpm typecheck` 0; `pnpm lint` 0 (five
  warnings, none in a touched file); `pnpm test` 0 (491 files, 5514 tests); `zsh scripts/build-lock.sh pnpm build` 0
  (258 pages); `pnpm lab:smoke --base http://localhost:3138` 0 (266 checks, 0 failing; `popups` 863 of 1200
  words); `pnpm lab:demo --board popups --base http://localhost:3138` 0 (8 steps, 0 failing). Its three "same
  picture" lines are pairs identical at a desk by construction (the tool compares the laptop frame): `lists` and
  `settings` sheet = panel, `forms` dialog = screen. `lab:demo` on the three boards that lost asks: `profile-page`
  2 steps, `event-safety` 12, `host-storage` 4, 0 failing each. At 375 and 1440 with reduced motion emulated, the
  board page and all eight steps log no console error or warning and never scroll sideways at 375.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned prefixes (`popups/`, `profile-page/`,
  `event-safety/`, `host-storage/`) plus the three named exceptions, each only the board's own registration directly
  after `identity-door`: `sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts` (its `SandboxId`, its
  `RULINGS` row and `DESK_ORDER`, which `registry.test.ts` requires to name every board; the Orchestrator moves it
  first). `contact-page/` and `help-center/` are untouched (nothing to move).
- **The board, `popups` r1**, eight asks, each option a rule drawn on the kind's real screens (three in a hand, the
  laptop on the kind's knob), every caption read off its frame:
  - `lists`: the Sheet · a side panel with its own screen in a hand (recommended) · a page · a capped centred list ·
    in place (today); the guest list at 240, her uploads, the claims review, Maya's largest files.
  - `confirm`: a centred dialog sized to its words (recommended, today) · the Sheet · Undo wherever it can be undone ·
    the button asks again in place; blocking Rick, removing three photos, deleting an account with its password
    focused.
  - `forms`: the Sheet on the keyboard (today) · a small centred dialog above the keyboard (recommended) · its own
    screen in a hand · in place; reporting the wedding, reporting Theo, changing her name, every field focused.
  - `choices`: the Sheet · a small centred dialog · a menu at the button, rows at the foot (recommended) · in place;
    Add photos, Download album, the code's style.
  - `share`: the Sheet (today) · his code card for every share (recommended) · the phone's own share sheet.
  - `plans`: the Sheet (today) · a wide dialog, its own screen in a hand (recommended) · a plan page.
  - `settings`: the Sheet as he picked it (today) · a side panel, its own screen in a hand (recommended) · a page · a
    large dialog with its sections beside.
  - `peek`: the Sheet · a card at the name, a sheet in a hand (recommended) · the mini-modal · straight to the page
    (today).
- **Moved, every option kept:** `profile-page` loses `view-all` and `quick-look` with the knobs and code only they
  drew (`album.tsx`, the look and list showcases, the guest-list fixtures, two readers); `host-storage` loses `where`
  (`surfaces.tsx`, the album-scope fixture) and `order` is no longer staged behind it; `event-safety` loses its Block
  question (the block's sheet, toast and inline row, Rick's uploads, the toast's CSS; `UnblockDialog` stays for
  `restore`). No answer is lost: none of the four had one in a ledger.
- **Assets requested from Will:** none (the phone's share sheet is a flat stand-in for the system's own, never ours to
  ship).
- **Board ideas:**
  - The sublayer trap bit this board too: `sm:max-w-md` beside production's `max-w-[calc(100%-2rem)]` drew a 1408 px
    dialog at 1440 (fixed with an inline width), which backs ROADMAP's `traps.ts` line.
  - Copy nits the inventory found: the Add photos sheet writes "{host}'s album" with a straight apostrophe where the
    failure sheet curls it, and the host's native share text says "and" where the guest's says "&".
  - The QR designer has no Cancel and the clip's "Add to event" has no close; `popups.confirm` and `choices` answers
    should give both their way out when wired.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:** `one-table`, `two-kinds`, `keyboard-dialog`, `stacked`, `kit`, `failure-sheet`,
  `left-alone` (on the board), and the phones leading each stage.
- **Look at first:** `popups.lists` in a hand (the Sheet against a side panel's own screen is the board's central
  contrast), then `popups.confirm`, whose context quotes his own claims answer.
