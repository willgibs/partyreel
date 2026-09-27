---
track: popups
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
