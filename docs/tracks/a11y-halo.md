---
track: a11y-halo
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "462cea3f"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/admin/
  - src/components/app/event-feed/bulk-bar.tsx
  - src/components/app/event-feed/bulk-bar.test.tsx
  - src/components/app/event-feed/checklist.tsx
  - src/components/app/event-feed/checklist.test.tsx
  - src/components/app/event-feed/hub-reel.tsx
  - src/components/app/event-feed/hub-reel.test.tsx
  - src/components/app/event-feed/review-section.tsx
  - src/components/app/event-feed/room-card.ts
  - src/components/app/event-feed/room-card.test.ts
  - src/components/app/event-feed/room-card.css
  - src/components/app/event-feed/room-card-door.test.tsx
  - src/components/app/event-feed/selectable-media-grid.tsx
  - src/components/app/event-feed/selectable-media-grid.test.tsx
  - src/components/guest/file-dropzone.tsx
  - src/components/guest/follow-moment-card.tsx
  - src/components/guest/follow-moment-card.test.tsx
  - src/components/guest/gallery-empty-state-sheet.tsx
  - src/components/guest/guest-account-menu.tsx
  - src/components/guest/guest-name-menu.tsx
  - src/components/guest/guest-name-menu.test.tsx
  - src/components/guest/guest-name-step.tsx
  - src/components/guest/password-gate.tsx
  - src/components/guest/password-gate.test.tsx
  - src/components/guest/reel/live-reel-view.tsx
  - src/components/guest/reel/live-reel-view.test.tsx
  - src/components/guest/upload/sending-stand-in.tsx
  - src/components/guest/upload/stack-tile.tsx
  - src/components/guest/upload/stack-tile.test.tsx
  - src/components/guest/door/ask-step.tsx
  - src/components/guest/door/unlisted-ask.tsx
  - src/components/app/create-event-wizard/name-step.tsx
  - src/components/ui/responsive-menu.tsx
  - src/components/ui/responsive-menu.test.tsx
  - src/components/ui/display.test.ts
  - src/components/marketing/faint-copy-policy.test.tsx
  - src/app/globals.css
  - src/app/(dev)/design/(shell)/_shell/sidebar.tsx
  - src/app/(dev)/design/(shell)/library/index-list.tsx
  - src/app/(dev)/design/gallery/knobs.tsx
  - src/app/(dev)/design/sandbox/customize/settings.tsx
  - src/app/(dev)/design/sandbox/demo-framing/hero.tsx
reads:                  # single-sources you depend on: never duplicate, never edit
  - CLAUDE.md
  - docs/systems/testing-verification.md
  - docs/systems/guest-flow.md
---

# lp/a11y-halo

**Goal.** The halo and the working words at every call site identity-r5-wiring could not own (the guest's pages, the hub, /admin, the create step, the menus, the lab's own five), and the two accessibility tokens that read under 4.5:1 (`--faint`'s captions, paper's warning text) lifted on every ground. A production lane: the whole gate, no board.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version.

**Why now.** identity-r5-wiring (`94534554`) wired Will's house set and moved 90 call sites from shadcn's old ring onto the halo, but 37 `focus-visible:ring` lines in 27 files sat in other lanes' owns (ROADMAP Now, "the halo and the working words at the call sites identity-r5-wiring could not own"). Those lanes have merged, so the files are free, except three that wait for the morning: pricing's three (`src/components/app/pricing/`, billing-orphans') and Drive's album picker (`src/components/app/drive/`, drive-crumbs'), with the keys "Opening billing" (`checkout-button.tsx`, its test in pricing) and "Starting" (Drive's send steps). Leave those four sites and two keys as one ROADMAP line in your Deferred. Read identity-r5-wiring's merge message (`git show 94534554 --format=%B -s`) and globals.css's "THE FOCUS HALO" block first: the halo's construction, `halo-inset` where a box clips, `ui/quiet-focus.ts` for a menu trigger after a mouse choice, and how the halo composes over each shadow slot.

1. **The halo at every call site in your owns.** Each `focus-visible:ring-*` line onto `focus-halo` (or `halo-inset` where a box clips), the atom's own construction kept, a later utility composing over it never replacing it; crumbs-85's new `upload/sending-stand-in.tsx` among them, and the lab's own five (the shell's sidebar, the Library's index list, the gallery's knobs, the customize board's settings, demo-framing's hero). Every one keyboard-reached on its real surface at 1440 and 375 on each ground it stands on (paper, the room, a photograph).
2. **The working words at the keys that wait in your owns**, onto Button's `working` and `workingLabel` (the arc, the key's words turning to what it does, busy and focusable, never disabled; the calls lab's BJ1): "Unlocking" at the guest's password gate (`guest/password-gate.tsx`) above all, "Publishing" (`/admin`'s announcement), "Asking" (the door's ask step and the unlisted ask). Find any other key in your owns that waits on a request and says nothing.
3. **Two accessibility tokens, measured on every ground** (ROADMAP Now's two Accessibility lines): `--faint` (`globals.css`) sets informational captions (stat labels, counts, "We recommend") at about 3.6:1 on the light page and 3.4:1 on the mat, and 3.9:1 in the room: one darker step so every caption reaches 4.5:1 on each; and Account's "1 of 1 used" is `text-warning` amber on white, 1.85:1 on paper (11.9:1 in the room): a paper warning text that reads at 4.5:1, wherever `text-warning` stands on paper as words (the storage meter, the size list's over line, the review count), the warning fill (`bg-warning` under its foreground) left as it is. Prefer the token's own fix in `globals.css` (paper's value of the text token) over touching call sites; if a call site must move, name it in your Lane check. Measure each pair before and after (the numbers in your Handoff), and say where brand r2's open take (Afterglow's light on paper, on Will's desk) would retune them.
4. **Retire in your Handoff's list** the ROADMAP lines you close: the halo line (narrowed to the four sites left), `--faint`'s line and the paper warning line.

Out of scope: pricing's and Drive's files (above), the marketing site's own `text-warning` sites (a marketing lane's), the boards' folders beyond the two named, and any atom's construction (identity-r5-wiring's; the halo composes over it).

**Verify on.** The whole gate on the synced tree, each step on its own exit code, and `pnpm lab:smoke` (globals.css renders in every board); every changed control Tab-reached in a headless Chrome on your own dev server at 375 and 1440, light and dark, its halo read on screen; the password gate's working words proven in its component test (a pending unlock reads "Unlocking" with the arc, its focus kept, a second press swallowed), never by typing a password, an event's included; each token pair's contrast computed from the rendered colours, never from the source alone.

Model: Opus. Cut by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- Q1. The paper warning's words needed one line outside the owns: `src/app/theme.css`'s `--text-color-warning: var(--warning-ink)` (Tailwind v4 reads `--text-color-*` before `--color-*` for `text-*` alone, so the fill, border, glyph and stroke keep the amber), and `src/lib/type-ladder-policy.test.ts`'s parse of `--text-*` steps now skips `--text-color-*` (a colour key, not a type step). **Recommended: keep both** (the token's own fix, as the brief prefers; the alternative was moving 34 `text-warning` call sites in other lanes' files). A `@utility text-warning` in globals.css was tried and loses: Tailwind emits the theme's rule after it.
- Q2. Headless Chrome was refused here (creating the `--no-sandbox` wrapper was denied by this session's permission check, the same block launch-prep's pickup records for red-team 56b). **Recommended: the Tab-walk below is one desk walk for Will or a seat with a browser**; everything else was proven without one.

## System-doc edits (in place, owned facts only)

- none (no `docs/systems/` doc names the halo's call sites or these two tokens; the facts live in globals.css's comments beside the values)

## Deferred (ROADMAP one-liners, bucket named)

- Design (Now, replaces line 27): the halo and the working words at the four call sites that waited on their lanes: pricing's three `focus-visible:ring` lines (`src/components/app/pricing/`, its key "Opening billing" in `checkout-button.tsx`) and Drive's album picker (`src/components/app/drive/`, its send steps' "Starting") (a11y-halo).

## Handoff (replaces the chat report)

- Work `949dff92` (the halo, the working words, both tokens, tests), `1ca2b469` (comments carry the served ratios), sync `3b0b2132` (docs only), `c4d4a4c0` (globals.css back to the lane's own hunks: `pnpm format` had rewrapped four unrelated blocks, one the halo selector `identity-traits.test` reads, which failed the first synced run), sync `6fb4e873` (guest-moments-r1's board and docs), all pushed; the head is in the chat line.
- Gates on `6fb4e873` (the synced tree), each on its own exit code: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 0 (1,053 files, 13,212 passed, 2 skipped; on `c4d4a4c0` likewise, 13,206; the run before the fix also failed `album-camera.test.tsx`'s "Shot 1 taken" find under load, which passes alone and on this run, in a file this lane never touched), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base http://localhost:3131` 0 (204 checks).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = 38 owned paths + this file + 2 exceptions: `src/app/theme.css` (one line) and `src/lib/type-ladder-policy.test.ts` (its parse), both Q1.
- The halo: every `focus-visible:ring-*` in the owns onto `focus-halo` (35 lines in 25 files; `halo-inset` on the moderation grid's tile and the customize board's settings overlay; the password gate's eye was ringless and joins, `halo-inset`). A control on a photograph or the reel's black takes the photograph's ground (`data-surface="photo"`: the moderation tile, the hub reel's curtain close, the review arrivals pill, the review peek, the tile's preview key, the live reel's view, both upload stop keys) so its halo is the white line over a near-black band. `file-dropzone` and `guest-name-step` drop their `focus-visible:border-ring` (one mark). Left on purpose: `responsive-menu`'s rows keep the display cursor (identity-traits.test pins it), Create's name keeps its `focus-visible:ring-0` opt-out, the report queue's tiles keep their roving cursor outline (`focus-visible:outline-none` + the cursor ring on the wrapper).
- The working words (Button's `working`/`workingLabel`, busy and focusable, never disabled): Unlocking (`guest/password-gate.tsx`, pinned by its new test: "Unlocking" under the arc, `aria-busy`, not disabled, focus kept, a second click and an Enter submit swallowed, back to "Unlock" after a refusal), Publishing (`admin/announcement-compose.tsx`), Asking (`door/ask-step.tsx`, `door/unlisted-ask.tsx`; each now tracks which key works, so "Use a different email" says Signing out and the other key waits off), Verifying (`admin/mfa-enroll.tsx`, `admin/mfa-challenge.tsx`), Saving (`guest/follow-moment-card.tsx`, `guest/guest-name-step.tsx`, which said "Just a second…"), the admin confirm (`admin/destructive-sheet.tsx` gains `working`, default "Working": Deleting, Removing, Actioning, Holding, Sending at the owned callers), the report queue's phone acts (Taking it down, Holding) and its desk "Hold for forensics" (Opening the hold), the moderation grid's Restore (the arc). Each form's own submit guard holds the Enter key while it works.
- `--faint`, one step darker on every ground, measured on the SERVED colours (the dev server's compiled CSS, hex fallbacks; before from the source values): paper 0.6 → 0.525: body 3.64 → 4.95, card 3.87 → 5.29, dialog 3.91 → 5.34, mat 3.39 → 4.61 (`.surface-mat` restates it). Room 0.53 → 0.59: room 3.92 → 5.06, card 3.72 → 4.80, dialog 3.59 → 4.64. Slab (`.surface-ink`) 0.565 → 0.615: 4.22 → 5.18, card 3.75 → 4.62. Display on paper 0.56 → 0.62: screen 4.14 → 5.31, step 3.58 → 4.58. Display in the room 0.62 → 0.68: screen 3.88 → 4.91, step 3.04 → 3.88 (AA on the step needs 0.722, against `--display-muted`'s 0.77: the third step would stop being one; Call 4). Each stays a step under `--muted-foreground` (paper 7.48:1).
- The warning's words: a new `--warning-ink` on every set that declares `--warning` (+ `.surface-ink`), read by `text-warning` alone: paper oklch(0.53 0.12 70), a bronze of the amber's hue: body 1.75 → 4.95, card 1.86 → 5.30 (Account's "1 of 1 used"), mat 1.63 → 4.61; the room, the display and the slab read their own bright amber (12.59, 11.93 on the room's card, 10.22 on the slab). `bg-warning`, `border-warning`, `fill-`, `stroke-` and `ring-warning` keep `--warning` (the compiled `text-warning` reads `var(--warning-ink)`, `bg-warning` `var(--warning)`). Pinned: `ui/display.test.ts`'s "the warning's words" (every set that moves the amber moves its words; theme.css maps them). No call site moved.
- Brand r2 (Afterglow's light on paper) would retune both where it changes paper's grounds or the amber: a warmer or darker body or mat re-solves `--faint` against the new mat (the floor case, 4.61 today), and Afterglow's standby point replacing the amber re-derives `--warning-ink` as that hue at L≈0.53 (globals.css, THE WARNING'S WORDS).
- Not walked (Q2), the walk for a seat with a browser: Tab to each changed control at 375 and 1440, light and dark, and read its halo; above all the live reel's bar (`lr-bar-content`, bottom of its pane: if the pane clips, it wants `halo-inset`), the moderation tile and the upload stop keys on a photograph, the hub reel curtain's close, and the lab's five. Signed-out: the lab's five on `/design/...`; the host's hub and /admin need a signed-in seat.
- Assets requested from Will: none
- Board ideas: the room display's caption step (3.88:1 on a held row) wants a design answer, a fourth grey or a caption that never stands on the step.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Test data: none created.
- Calls his to overrule: 1) "Use a different email" says "Signing out" while it works; 2) the paper warning's words a bronze (0.53 0.12 70) rather than a darker amber; 3) the admin confirm's default working word "Working" where a caller outside the owns names none (`src/app/admin/jobs/*`); 4) the room display's faint at 4.91 on its screen and 3.88 on its step, kept a step under muted; 5) the report queue's Dismiss keys say nothing while they work (the dismissal is optimistic: the entry leaves at once, so there is no key left to speak).
- Look at first: the password gate at 375 while it unlocks (the arc and "Unlocking", the focus kept), then Account's "1 of 1 used" on paper in its bronze.
