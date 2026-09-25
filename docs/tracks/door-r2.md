---
track: door-r2
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "afd3a267"            # the launch-prep SHA the branch was cut from
board: identity-door
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/identity-door/
  - src/app/(dev)/design/sandbox/identity-claims/
  - src/app/(dev)/design/sandbox/identity-profile/
  - src/app/(dev)/design/sandbox/guest-capture/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-door.json
  - src/components/guest/entry-modal.tsx
  - src/components/guest/entry-shell.tsx
  - src/components/guest/guest-name-step.tsx
  - src/components/guest/guest-name-menu.tsx
  - src/components/auth/account-door.tsx
  - src/components/ui/floating-layer.ts
  - src/app/(dev)/design/sandbox/voice-guest/spec.ts
  - src/app/(dev)/design/sandbox/reel-cut/scene.tsx
---

# lp/door-r2

**Goal.** Draw `identity-door` round 2: the guest's door with a look that feels alive, carried from the welcome through Will's new chooser to the guest's own menu, with every phone frame drawn with the keyboard up. His flow is settled; the look is the question.

## The brief

Will's answers and notes: `docs/reviews/identity-door.json` (round 1, with the Orchestrator's three notes). His words on the welcome: "I hate our welcome flow UI right now - doesn't feel alive or engaging, which is critical to making users want to continue, not just feel they have to for the sake of the host. We should also blur and subtle overlay behind welcome to feel more focused." On the sheets: "the rest of the options' designs feel ugly, but I think it's more due to the current bland design of the sheets themselves."

**One ask, `look`**: which direction makes the door feel alive enough that the guest wants to keep going, from the welcome to her menu. Three or four directions, each naming the approved pattern it borrows from, so "alive" is graded against something he already likes. Candidates (improve or replace any):
- `lit`: the blurred album's own sampled colour spills onto the sheet's top edge, the event name large with the host's face, the count ticking as photos land.
- `peek`: three of the album's newest stills fan out of the sheet's top edge in the tile's own material and answer each step (her name lands on the front tile's credit as she types, the code step brightens them, the menu card wears a small fan). Recommended: it sells the reward, which is his test.
- `ticket`: the welcome is a photographic card that Continue shrinks to a stub riding the top of every later step, ending as the menu card's header.
- `host`: the host's face leads, and the host's own description is the greeting when there is one. The door never invents words for a host.

Every direction keeps these: the panel is opaque (`floating-layer.ts` has no translucent panels), so the blur and the overlay belong to the scrim behind; motion lives only in the sheet (the reel tile behind stays still); reduced motion shows still frames.

**Drawn as ground, the same in every direction** (his flow, being built in production tonight):
- The welcome alone.
- The chooser, on name-only events only: "Continue as guest" (primary), "Create account", "Log in".
- The guest's name step with the email as a one-line ghost tap, a full-width row at least 44px tall; a tap turns it into the labelled field, with focus moving inside the tap. Measured today, the round-1 line wraps at 16px in its 277px at 375; `text-working` (14px) fits at 375 but not at 320: say what it does at both.
- A verification event: one screen of name and email under the one-line gate reason, verbatim from `DOOR_WEAR.gate`, then the code screen. Create account reuses that screen; Log in asks only the email.
- The "You're in" beat.
- The menu: her name over "Unverified", above a card reading "Save this event for later" with Add your email (once an email is added: "Email not confirmed", Confirm your email, and a quiet Change or remove it).
- The welcome's words at today's text, since `voice-guest.welcome` owns them.
- The consent line, the back chevron, and the held door with no close.
- The album behind, drawn from production components (the header, the stats line, the Highlight reel tile as a still, the album), with new arrivals glowing through the blur.

**Frames.** A `stage` knob: Arriving, Typing, Accounts, Inside. Each stage is one 1440 frame above three 375 frames, the way `reel-cut/scene.tsx` lays them out:
- Arriving: welcome · chooser · name with its field focused.
- Typing: name with the email opened · name and email under the gate reason · code.
- Accounts: Log in · Create account's name and email · the "You're in" beat.
- Inside: the menu card with name only · with an email added · the change-or-remove sheet.

On the keyboard frames:
- Every 375 frame with a field draws an iOS keyboard: one flat SVG in the board folder, sized from a real simulator screenshot (about 335pt on 375x812, with the suggestions bar).
- The sheet's bottom sits on the keyboard's top and its height is the visible area minus 12px, with the primary action pinned at the sheet's foot. This is the rule production is adopting.
- Caption, measured off each frame: whether the primary action and the focused field clear the keyboard; how much album shows above the sheet; the scrim's blur and opacity; "Unverified" appearing exactly once.

The scrim is its own element, never a blur on an ancestor of the album; a `scrim` knob compares the direction's own with today's (10% black, 4px blur). Headless capture may drop a backdrop blur: `lab:demo` reports it UNPAINTED, and it is judged by eye.

**Calls the board carries, his to overrule** (production builds them tonight):
- Google and the password link leave the verification door and live under Log in.
- The "account you already had" hold runs only when this device holds uploads a claim would move.
- A typed, unconfirmed email can be changed or removed from the card. A confirmed one only changes, on the account page, confirmed at both addresses.
- The phone door leaves vaul for the one responsive Sheet, made keyboard-safe.
- The chooser says "Log in", and the menu's Sign in row becomes "Log in" too.

**Neighbouring boards, adapted inside their round 1, every option kept** (none has a ledger, so none can open a round 2):
- `identity-claims.pointer`: the moment can now come at the door, before any upload (the verification door, Create account, Log in). Draw each option in both places and give `pointerScreen` a door frame.
- `identity-profile.prompt`: `follow` means right after her email confirms, at the album's follow moment or at the door's "You're in"; its preview adds the door frame.
- `guest-capture.tracker`: its `menu` option becomes a Your photos row in her menu, under the card, since `menu=sheet` was not picked.

The rows of `touchpoints.ts` for these four boards are yours, nothing else in that file. Ask nothing another open board asks (`node usher/kit/board-card.mjs --desk`).

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
