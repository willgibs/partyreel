---
track: door-r3
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "0b2af407"            # the launch-prep SHA the branch was cut from
board: identity-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-door.json
  - src/components/guest/
  - src/components/auth/
  - src/app/(dev)/design/sandbox/voice-guest/spec.ts
  - src/app/(dev)/design/sandbox/guest-capture/parts.tsx
  - docs/systems/guest-flow.md
---

# lp/door-r3

**Goal.** Draw `identity-door` round 3: the door's remaining icons and copy redesigned within lit, so every screen a guest meets wears one look.

## The brief

**From his r2 sitting.** He picked `look=lit` (overruling `peek`) and wrote: "The remaining icon + copy items could likely be redesigned within this as well." In chat (2026-09-27) he chose to see them drawn first. This round draws them. Meanwhile `guest-door` is wiring lit's own pieces in production now (the scrim, the lamp, the welcome's hero, the live count, the menu card's edge) and keeps production's icons and words until his r3 picks.

**What lit left as drawn** (in `sandbox/identity-door/steps.tsx`):
- the welcome: its Camera and Images rows (the icons only; the rows' words are `voice-guest`'s `welcome`), Continue and the consent line;
- the chooser: its heading and three buttons;
- the name step: heading, reason, hint and the ghost tap;
- the gate: the Lock eyebrow and the reason;
- the code screen: heading, slots, "Or tap the link…", and Resend · Use a different email;
- Log in and Create account;
- the "You're in" beat: the Check, "You're in", "Welcome to the party";
- the change sheet, the back chevron and the close X;
- the menu: the name over "Unverified", "Save this event for later", the email row, "Change or remove it", Change name, Log in.

**Never drawn at all:**
- the password step;
- the upload step, production's real last step;
- the demo's welcome;
- the stalled refresh;
- the new keep-what-you-added screen, which `guest-door` is building as the door's last screen (`guest-capture` r1 `sheet-step`, drawn as `OfferSheet` in `sandbox/guest-capture/parts.tsx`).

**Draw from production, not the board.** The board has drifted: the chooser's "How would you like to join?" against production's "How do you want to join?", the ghost tap's trailing Plus, the menu's Mail icons. Production's words and icons are "today": `src/components/guest/entry-modal.tsx`, `door/chooser.tsx`, `guest-name-step.tsx`, `identify-step.tsx`, `door/signin-step.tsx` (then `src/components/auth/account-door.tsx` and `email-sign-in.tsx`), `password-gate.tsx`, `upload-step.tsx`, `guest-name-menu.tsx`, `add-email-dialog.tsx`.

**The questions.** Split them by screen group or by dimension (the icons' language across the door, the voice of its steps, its beats), whichever gives Will one real decision per question. Grade each option against today's.

**Ask nothing `voice-guest` asks** (`sandbox/voice-guest/spec.ts`): its `welcome` (the welcome rows' words), `ask` (the password step's words) and `landed` (the stack tile's landing words). Draw those parts as they are today. The board's `touchpoints.ts` rows are yours, and nothing else in that file; `node usher/kit/board-card.mjs --desk` lists every open ask.

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
