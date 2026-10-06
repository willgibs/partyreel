---
track: identity-r5-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "b5042226"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/ui/
  - src/app/globals.css
  - src/components/app/event-settings/
  - src/components/app/dashboard/
  - src/components/app/create-event-wizard/
  - src/components/app/storage/
  - src/components/app/export/
  - src/components/app/event-blocks/
  - src/components/app/account-avatar-form.tsx
  - src/components/app/account-delete-card.tsx
  - src/components/app/account-delete-card.test.tsx
  - src/components/app/account-security-form.tsx
  - src/components/app/avatar-cropper.tsx
  - src/components/app/display-name-form.tsx
  - src/components/app/notification-prefs-form.tsx
  - src/components/app/notification-prefs-form.test.tsx
  - src/components/app/event-password-control.tsx
  - src/components/app/event-slug-control.tsx
  - src/components/app/event-slug-control.test.tsx
  - src/components/app/notification-bell.tsx
  - src/components/app/user-menu.tsx
  - src/components/app/user-menu.test.tsx
  - src/components/app/event-card.tsx
  - src/components/app/event-card.test.tsx
  - src/components/app/event-card-qr.tsx
  - src/components/app/recently-deleted-grid.tsx
  - src/components/app/recently-deleted-grid.test.tsx
  - src/components/app/create-event-wizard.tsx
  - src/components/app/create-event-wizard.test.tsx
  - src/components/app/share/as-guest-stage.tsx
  - src/components/app/share/as-guest-stage.test.tsx
  - src/components/app/share/code-card.tsx
  - src/components/app/share/event-link-row.tsx
  - src/components/shared/
  - src/components/auth/
  - src/components/social/
  - src/components/marketing/
  - src/components/reel/
  - src/app/(app)/account/
  - src/app/(guest)/u/
  - src/app/(app)/dashboard/[eventId]/guests/
  - src/app/(dev)/design/sandbox/identity/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity.json
  - docs/systems/design-system.md
---

# lp/identity-r5-wiring

**Goal.** Will's identity r5 picks wired into production: the house set (fields sunk as wells, keys flat, the chosen afloat) on every atom, one home each, and working = words (the arc, with the key's words turning to what it does) on every key that waits; with it the door page's parts in the set's construction, red-team 56's halo sweep inside these owns, and Settings' roll-of-one words. The identity board retires with its picks built.

## The brief

**The round's direction (Will, standing since round 13):** never dev-tool-ish; a host of 1 to about 10 events first, scaling to hundreds; delight where it costs nothing in clarity; nothing depends on a timeline; immediate, or a clear state and a way to stop it; no AI managing it; cost designed like the architecture; production is the working version, a pick the best of what was drawn, never a rule.

**Will's picks to wire (identity r5, desk 5, 2026-10-06; `docs/reviews/identity.json`):**
- **set = house** ("The house mix: sunk, flat, afloat"): a field is a well; keys lie flat (ink, a tone, a clear key with keys' hairline), as Afterglow's decks draw them; what is chosen floats (white on its lift on paper, graphite lit in the room). It lands on Input, Textarea and Select, Button's variants, chips, segments, tabs, radio cards and Switch, one home each, beside production's corner ladder and boxes. Round 4's notes stand under it: he leans to the lighter chosen on both grounds.
- **loading = words** ("The words say it: Saving, with the arc"): the arc (a third of a ring turning round a faint whole ring, in the key's own ink, in its icon's place beside its words; still under reduced motion, a ring a third filled), and the key's words turn to what it is doing (Saving, Unlocking, Creating your event), as production's own Saving already does. ★ Not `still`: no "Still saving" past four seconds; he did not pick that option.
The board is the spec: `src/app/(dev)/design/sandbox/identity/` (its `house` and `words` frames at 1440 and 375, both grounds, every screen). Once both picks are built, the board retires with this lane (its folder is yours; `docs/reviews/identity.json` goes at the Orchestrator's record).

**Riding the wiring (each built, each in your Handoff):**
- identity r5's two ROADMAP lines: the door page's parts that are not atoms (Settings' door: the password's panel, "31 guests are already in", the consequence lines) take the set's construction; a working key holds the wider of its two widths from its first paint, so nothing beside it moves.
- Red-team 56's LOW (identity-wiring): many controls keep their own ring, not the halo: all of Settings' first screen, the style cards, film boxes, stepper, Max-size select, Add an end date and Change time zone; Account's bell and menu (17 call sites on shadcn's old ring); "Show password"'s eye and the header links wear only the browser's outline. The ROADMAP's halo-sweep line counts 118 lines spelling `focus-visible:ring-*` (`grep -rn "focus-visible:ring" src --include=*.tsx`): sweep every one inside your owns onto the halo, one home.
- Red-team 56's identity NITs: a menu trigger keeps the halo after a mouse choice; "Select" shrinks over 150 ms instead of at once.
- Red-team 56's roll-of-one words in Settings (your files): at a roll of 1, Settings says "A roll of 1 shots each. Removing one frees its frame." (`camera-settings.tsx`) and the stepper's "shots each" (`roll-control.tsx`): say one shot as one, and say what removing a shot does there truly.
- ★ Outside your owns, on purpose: `src/components/guest/`, `src/components/app/event-feed/`, `src/components/admin/`, `src/components/app/pricing/`, `src/components/app/drive/` and `src/components/app/share/as-guest-view.tsx` are other lanes' this round (crumbs-85, billing-orphans, drive-crumbs). Their call sites keep working on the atoms you change; the halo sweep and the working words at their call sites (the door's Unlock above all) are your Handoff's Deferred line for a follow-up lane, never edits of yours.

**Starts from.** CLAUDE.md's working loop, the bible's ten, `docs/systems/design-system.md` (the halo, the shrink and the bright edge each have one home in `globals.css`; refine its lines in place) and production as it is; the tests say what has to keep working.

**Verify on.** The whole gate on the synced tree, each step on its own exit code; `pnpm lab:smoke` (the Library draws every atom); signed in as a test host (`usher/kit/redteam/signin.mjs` once lab-kit-3 lands it, otherwise a walk listed for Will's desk): Tab through Account and Settings on paper at 375 and 1440, a menu on paper and a dialog in the room, Save in Settings and Create event under a throttled network to see the working words, reduced motion on and off.

Model: Opus. Cut 2026-10-06 by the cloud-seated Orchestrator; you run in a cloud session of your own (the spawn prompt's boot).

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` when the lane changes anything under `src/` but tests (it crawls what the change reaches: the Library, and every board whose drawings import a changed file); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- Q1 · A working key is busy, never off: `working` keeps its focus and face (`aria-busy` + `aria-disabled`, a second press
  swallowed) rather than `disabled`, which dropped focus to the page mid-save. Recommended and built; call sites that
  also pass `disabled` for their own reasons keep the face while working. Will's to overrule.
- Q2 · Off, a key with a face settles clear (faint words inside a quiet hairline), the board's off state, not
  production's half-strength slab. Built as the board drew it. Will's to overrule.
- Q3 · Create's foot: while the event is made the foot is the key it becomes ("Creating your event" with the arc),
  turning to Get it ready in place, instead of a line of text standing in for the key. Built. Will's to overrule.
- Q4 · A control filling a box that clips (Settings' rows, the radio cards' stretched buttons, the password field's
  eye, a tile's overlay) draws the halo INSIDE (`halo-inset`), since outside it was clipped away. Built; the one new
  construction the board never drew. Will's to overrule.
- Q5 · The camera's line now says the ceiling: "One shot each. Removing it frees the frame for another, up to 3 shots
  in all." (and "A roll of 12 shots each. Removing one frees its frame for another, up to 36 shots in all."). The
  ceiling (`ROLL_RETAKES` = 3 rolls a period) is what makes "frees its frame" true. Will's to overrule the words.

## System-doc edits (in place, owned facts only)

- `docs/systems/design-system.md`: "The atoms' focus and press" refined (error drawn inside, `halo-inset`, the quiet
  hand-back); two sections added beside it, "The atoms' set: sunk, flat, afloat" and "Working: the arc and its words";
  the head's contract line no longer names identity's retired sheets.

## Deferred (ROADMAP one-liners, bucket named)

- Design: the halo sweep and the working words at other lanes' call sites: 37 `focus-visible:ring` lines in 27 files
  (guest 8, admin 5, event-feed 5, pricing 3, drive 1, the lab's own 5), and their keys that wait ("Unlocking…" at the
  guest's door, `guest/password-gate.tsx`, above all; Publishing, Opening billing, Starting, Asking) onto Button's
  `working`/`workingLabel`.
- Design: the Library's Button page shows no working specimen (`(shell)/library/components/gallery-demos.tsx`, not this
  lane's): add one beside Disabled (`working` with `workingLabel="Saving"`).
- Design: "Select" shrinking over 150 ms (red-team 56's NIT) did not reproduce on the atom (an outline key reads
  `scale: 0.96` in the first frame of a press, measured in headless Chrome); the album toolbar's Select
  (`event-feed/gallery-actions.tsx`) is another lane's: walk it there.
- Design: `frame-pause.test.tsx` still names `/design/sandbox/identity/scene` as a sample src (a string, no route);
  rename it to a living scene when one exists.

## Handoff (replaces the chat report)

- Work commits `971ce898` (the set, working = words, the sweep, the door, the roll words, the board retired) and
  `ad12f172` (the auth keys' own press removed, the passkey's words); sync merge `21d31185` (origin/launch-prep at
  `e4c2d7c3`, clean). This manifest's commit is the head.
- Gates on the synced tree `21d31185`, each its own exit code: `pnpm typecheck` 0, `pnpm lint` 0 (no warnings),
  `pnpm test` 0 (1053 files, 13169 passed, 2 skipped), `zsh scripts/build-lock.sh pnpm build` 0, `pnpm lab:smoke --base
  http://localhost:3131` 0 (a first cold run timed out on `/design/library` at 20 s, the dev server's first compile; the
  warm re-run passed every check). No `lab:demo`: no board.
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, with two exceptions:
  `docs/systems/design-system.md` (the system doc the manifest names for the halo, the shrink and the edge, refined in
  place) and `scripts/lab-smoke.mjs` (its `SCENES` named the retired board's scene route, which "leaves with its
  board"; now `[]`, or the crawl 404s).
- The house set: THE HOUSE SET'S GROUNDS (tokens on paper, room/ink and display) and three utilities in globals.css,
  `field-well` (Input, Textarea, Select, the OTP slots, Settings' Max size), `afloat`/`afloat-card` (segments, chips,
  tabs, Settings' and the display menu's radio cards), `toggle-thumb` (Switch); Button's variants flat on the tokens
  (ink, tone, clear+hairline, ghost, red tint; off settles clear). Each writes its own shadow slot, so the halo
  composes over all of them.
- Working = words: `working-arc` in globals.css; Button `working` + `workingLabel` (two faces in one grid cell, the
  width held from first paint: measured 136 px resting and working on the consequence line's key); 30 keys in
  owns moved (Saving, Removing, Sending, Deleting, Signing in, Finishing, Adding a passkey, Creating your event); the
  field-status and slow-claim spinners are the arc; ConsequenceLine's key works in words.
- Create event: the foot is one key, working as "Creating your event", then Get it ready (`create-event-wizard.tsx`).
- Settings' door in the set: the step segments on a track with the chosen afloat, the gates as radio cards with ring
  radios, the password's panel clear inside a hairline, "already in" and the consequence line flat tones, the
  password state a success Badge (`door-page.tsx`, `event-password-control.tsx`, `consequence-line.tsx`); the style
  cards, choices, film boxes and the hold segments likewise (`camera-settings.tsx`, `roll-control.tsx`, `reel-page.tsx`).
- Red-team 56's LOW: 90 `focus-visible:ring` call sites in owns swept onto `focus-halo` (`halo-inset` where a box
  clips), the bell and the user menu among them; the header's logo link and crumbs and every "Show password" eye wear
  the halo. One left on purpose: Create's name opts out (`focus-visible:ring-0`).
- Red-team 56's NITs: a menu trigger after a mouse choice now wears no halo (`ui/quiet-focus.ts`, measured: after a
  mouse choice `data-quiet-focus` and no halo; after a keyboard choice the halo); "Select" deferred above.
- Roll of one: `cameraLine()` in `camera-settings.tsx` with its test; the stepper already said "shot each".
- The identity board is deleted (`src/app/(dev)/design/sandbox/identity/`); `docs/reviews/identity.json` is the
  Orchestrator's to record.
- Verified in headless Chrome on the dev server: computed bodies of field, keys, chosen segment, active tab and thumb
  on paper and in the room; Settings' door at 1440 on paper and 375 in the room; the arc's 800 ms loop and its single
  0.01 ms play under reduced motion; `halo-inset`'s inset band in the built CSS.
- Walks for Will's desk (no `signin.mjs` in this tree): signed in as a test host, Tab through Account and Settings on
  paper at 375 and 1440; a menu on paper and a dialog in the room; Save in Settings (the door's Set password) and
  Create event under a throttled network to see the working words; reduced motion on and off.
- Assets requested from Will: none.
- Board ideas: the brand and event-header boards' open asks describe globals.css, which this lane changed
  (lab:smoke's PREMISE note): re-read them before his next sitting.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none. No test data left.
- Calls his to overrule: Q1 to Q5 above.
- Look at first: Settings' door in the room at 375 (the gates afloat), then Create's foot while it works.
