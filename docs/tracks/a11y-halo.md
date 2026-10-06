---
track: a11y-halo
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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
