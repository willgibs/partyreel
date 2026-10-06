---
track: identity-r5-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
