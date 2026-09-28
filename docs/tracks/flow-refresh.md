---
track: flow-refresh
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e199f43f"            # the launch-prep SHA the branch was cut from
board: export-flow
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/export-flow/
  - src/app/(dev)/design/sandbox/emails/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/guest-flow.md
---

# lp/flow-refresh

**Goal.** Refresh `export-flow`'s five stale asks onto the Download menu and Will's new notes, and `emails`' two reached asks (the other waiting events after `pointer=line`, a guest's mail after the keep step), with `emails.guest` absorbing the two mail questions leaving event-safety and admin-triage.

## The brief

**A refresh, not a new round.** Keep each board's `round.n`, and say in `round.changed` what moved. Change only the asks named below: every other ask keeps its id, question, options, recommendation and drawing exactly, because Will may be answering those on build 12 while you work, and his answers must still transcribe. Where a frame draws production, draw production as it is at your base: open the files, never trust a spec's own claim about "today" (a read-only audit on 2026-09-28 found the drawings below out of date; each finding cites its evidence, check it before you build on it). Offer the fix at its source, and keep every road an option still holds. Your boards' `touchpoints.ts` rows are yours (their text, `asks` and `lives`; nothing else in that file). `node usher/kit/board-card.mjs <board>` prints what a board asks. Author with `defineExploration` as the boards already do.

**export-flow.** Download is a menu now: a row starts its bundle at once (`src/components/app/export/export-dialog.tsx` on `src/components/ui/responsive-menu.tsx`, popups `choices=menu`, `3e7952e3`). On a phone it is rows near the thumb with Cancel beneath. desk-trim `6daf1e66` and crumbs-4 `2d2bd7f8` both flagged the board's framing as still the old centred sheet.
- `means`: "today" and `mine` are still drawn as the old sheet (a description line, chips, a size foot, a Download button). mine-none `89095cff` removed the own-tile mark `mine` argues from, and "Yours" is in the View menu beside Download all. Redraw on the menu, `mine` as a "Yours" row at its top.
- `wait` (reached): Will's voice-guest note ("notify the user where they are without real interruption, if we even need to notify them at all") and the shipped menu, which closes on tap, remove the ground for the recommended `panel`. Reframe as today's toast (`use-export-download.ts`) against a quiet line under the header, with progress on the Download button itself as a likely third. Move the recommendation off `panel`.
- `stuck` is current and asked after `wait`; only its `panel` version follows `wait`'s.
- `hollow` (reached): the Worker still skips missing files silently (`workers/export/src/index.ts`). His voice-guest `failed=exact` ("2 of 8 didn't upload", Retry both) sets how a partial failure is said. Draw `offer` in that style ("142 of 148 are in your zip", Try again for the 6), then ask only whether a wholly empty zip is refused. `after` has no way to fix the failure, so it loses to `offer`.
- `cap`: a bundle over the limit is a disabled menu row, and the note under the rows names no number. Redraw on the menu:
  - `near`: the note naming 2,000;
  - `split`: the row reading "in 2 zips";
  - `auto`: the row saying how many were left out.
- `phone`: redraw on the phone's menu rows; `both` becomes a "Save to Photos" row above the bundle rows (save-sheet `88c43fe7`'s one-tap Save is the precedent), `zip` the rows alone.

**emails.**
- `moments` (reached): Will's `identity-claims` answer `pointer=line` keeps the event self-contained. A guest's other waiting events are acknowledged and handled on her dashboard later, with nothing pointing her out of the event before she uploads. claims-wiring `19ff4d33` built the dashboard banner. Redraw `identity` as a mail sent after she confirms at the keep step, echoing the banner ("11 photos from 4 events are waiting for you"), never from a confirmation before her first upload.
- `guest`: the keep step (`6f06207e`) asks every first uploader to confirm her email, which sends a code mail, so `none` ("nothing ever arrives") is false, and `link` lands at the keep's own moment. Draw the code mail as today, and narrow `link` to one mail for a guest who chose Maybe later but typed an address and uploaded (ROADMAP's deferred one-shot mail). It also absorbs two questions leaving other boards, every option kept:
  - event-safety `waiting`'s mail half: a held or unlisted guest mailed when she is let in;
  - admin-triage `notice`'s `both`: a mail to a confirmed reporter.

  If they are two decisions, split them rather than force one.

**Untouched on emails:** `shell`, `brand`, `sender`, `foot`, `code`, `dark` (Will may answer them on build 12).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** Each board (`export-flow`, `emails`) at 1440 and 375 with reduced motion honoured; `pnpm lab:smoke --base http://localhost:<port>` whole; `pnpm lab:demo --board export-flow --base http://localhost:<port>`; `pnpm lab:demo --board emails --base http://localhost:<port>`, each pressing every step.

## Questions (a recommended answer each; the Orchestrator relays them)

- **`wait`'s third, and `panel`'s place.** A menu that closes at the tap leaves a sheet that "holds until it lands"
  nothing to hold. Built: `panel` leaves, `button` (the Download that was tapped says Preparing, then Downloading) takes
  its slot and the recommendation, as the least interruption where she is; `stuck` and `hollow` are drawn on it. His to
  overrule: a fourth option, a menu held open until the browser has the zip.
- **`hollow`, narrowed.** His `failed=exact` settles a short zip, so the ask is only whether a wholly empty zip is
  refused. Built: `refuse` (recommended) and `offer`; `after` leaves (it loses to `offer`); a "What came back" knob
  (nothing, the default, or 142 of 148) keeps the settled short zip drawn. His to overrule: `after` as a losing third.
- **`emails.guest`, split.** A guest's link, a newcomer let in and a reporter's note are three triggers to three people.
  Built: `guest` (her link, once, after Maybe later), `letin` (event-safety `waiting`'s mail half, all three roads) and
  `reporter` (admin-triage `notice`'s `both`, with the outcome said as a genuine third), each drawn as two inboxes over
  the cases that tell its options apart. His to overrule: one wider ask.

## System-doc edits (in place, owned facts only)

- none (the lane owns no system-doc facts; both boards' changes are lab drawings)

## Deferred (ROADMAP one-liners, bucket named)

- none (ROADMAP's Emails line already names the guest's one-shot mail as `emails.guest`'s to draw)

## Handoff (replaces the chat report)

- **Commits.** The work: `65081452` (pushed). No sync: launch-prep moved only by merges outside both `reads`
  (storage-r2 `1413b3e6`, voice-r2 `0abfdeac`, triage-refresh `2acb7a56`) and records, and
  `git merge-tree --write-tree HEAD origin/launch-prep` (at `89b340fd`) is clean, `touchpoints.ts` included. The head
  is this manifest's commit.
- **Gates on `65081452`, each on its own exit code:** `zsh scripts/build-lock.sh pnpm typecheck` 0; `pnpm lint` 0 (5
  warnings, none in a file this lane touched); `pnpm test` 0 (510 files, 5,738 tests; run before the pacing note, on the
  same tree, so not re-run); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3136` 0
  (233 checks; export-flow 738 and emails 821 words of 1,200); `pnpm lab:demo --board export-flow` 0 (6 steps) and
  `--board emails` 0 (10 steps), one at a time, the dev server killed after. Nothing of this lane's was killed or lost.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the two owned board folders, this manifest, and
  `src/app/(dev)/design/touchpoints.ts` (the brief's exception: the two boards' rows only, their asks, lives, note and
  variants).
- **export-flow**, round 1 kept, `round.changed` says what moved:
  - Every ask drawn on the shipped Download menu, quoted from `ui/responsive-menu.tsx` (`menu.tsx`: rows at the thumb
    with Cancel under 640, a menu under the button at a desk), its material from `floating-layer.ts`, its words and
    arithmetic `export-dialog.tsx`'s; the old centred sheet (`dialog.tsx`, `KeepsakeLead` with it) is deleted.
  - The ground is production's (`surfaces.tsx`): the host's Album header with Add photos, Download, Select and View; the
    guest's count row with Download all and View; the album as justified rows of eager stills (the masonry ground drew
    every tile blank: its `abortUnfinishedImages` strips a lazy image's `src` inside a frame); sonner's toast where it
    ships now, top centre at 5rem, in the state tones, an error keeping its close.
  - `means`: `mine` is a Yours row at the menu's top; `picked` redrawn on the new ground.
  - `wait`: today's toast, a quiet line in the Yours line's grammar, and `button` in `panel`'s slot (recommended).
  - `stuck`: question, options and recommendation untouched; its toast moved with production's and its `button`
    drawing follows the wait's.
  - `hollow`: narrowed to the empty zip, `refuse` recommended; a `came` knob draws the short zip in his exact style.
  - `cap`: `near` names 2,000 or 20 GB and the rows over it; `split` reads "Everything, in 2 zips"; `auto` "Everything,
    440 left out". `phone`: `zip` today's rows, `both` a Save to Photos row above them, `batch` the share sheet.
  - `today` declared on `means`, `wait` and `phone`, so the staged asks default to today's wait; two carried calls on
    the board (`panel-leaves`, `after-leaves`).
- **emails**, round 1 kept: `moments.identity` is one mail after the keep's confirm, its subject `bannerWords`
  imported ("11 photos from 4 events are waiting for you"), and a proposed roster row now reads whole; `guest` narrows
  to the Maybe later guest's one link mail beside the confirming guest's code; `letin` and `reporter` are new asks
  (`inboxes.tsx`, two inboxes each); two carried calls (`three-asks`, `outcome-third`). `shell`, `brand`, `sender`,
  `foot`, `code` and `dark` are untouched in text and drawing: their lab:demo stage deltas are the base's to the
  hundredth (32.83, 25.35, 2.30, 21.86, 12.51, 25.82).
- **For triage-refresh and safety-refresh's handoffs:** `emails.reporter` holds admin-triage `notice`'s reporter mail
  (silence, the note, and the outcome as a third); `emails.letin` holds event-safety `waiting`'s mail half, its three
  roads as `none`, `always` and `left` (`left` recommended, as `waiting` recommended `both`).
- Assets requested from Will: none.
- **Board ideas:**
  - `ui/responsive-menu.tsx` cannot be drawn in a lab frame (it portals to the lab page and reads the lab page's media
    query), so export-flow quotes its private `DESK_ROW` and `HAND_ROW`; exported row classes or a shape and container
    seam would let a board draw the real menu.
  - `MasonryColumns` and `GuestMasonry` inside a frame lose every lazy image to `abortUnfinishedImages` (export-flow's
    base captures had tiles with no `src`); a board still grounding on them in a frame (profile-page's `profile.tsx` at
    `89b340fd`) draws blank tiles.
  - The shipped over-limit note advises "Pick photos or videos" when Photos is itself over (2,280 photos); `cap`
    replaces it, and a straight copy fix could name the rows over it if `cap` waits.
  - The Supabase code mail's words live only in the dashboard; recorded in `auth-accounts.md`, the boards could draw it
    as sent rather than as the `code` ask's stand-in subject.
  - `emails.foot` draws `commercial` and `every` as one picture on its two specimens (lab:demo's standing warning).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. (Answers would need them in their wiring:
  `hollow` a Worker that reports what it skipped; `reporter`'s note a way to keep who reported until the close.)
- **Calls his to overrule:** `panel` leaves `wait` for `button`; `after` leaves `hollow`; `emails.guest` is three asks;
  `reporter` recommends the note, which keeps who reported until the close, where the reports table keeps no one
  today; `means`'s Yours row uses a person icon; the toast moved to production's top centre on every drawing, `stuck`'s
  too.
- **Look at first:** export-flow `wait` (the three places) then `hollow` with the "What came back" knob; emails
  `reporter` (the privacy trade in `note`) and `moments.identity`.
