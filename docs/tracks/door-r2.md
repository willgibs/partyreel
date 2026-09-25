---
track: door-r2
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **What does the winning look show at a password event, where the welcome stands over a locked page that shows no
  pixel of the album?** Recommended: nothing of the album until the password lands. `peek` fans three face-down prints
  (the sleeve's own blank backs), `ticket`'s card rests on the locked page's ghost river, `lit` takes the house five
  (law 3's no-media branch), `host` is unchanged; the photographs arrive with the unlock. Not drawn: the board's flow is
  name-only and verification events, and the wiring after his pick carries it (Deferred).
- **Does the door ship the winner's own scrim or today's?** Recommended: the winner's own, one number for every step
  of the door (`peek` 20px blur at 22% black; `lit` 28px at 30% and 72% brightness, the lightbox's blur and saturation;
  `ticket` 16px at 25%; `host` 10px at 14%), since his note asked for a blur and a soft overlay and today's 4px at 10%
  is the baseline he called bland. The `scrim` knob draws each against today's.
- **If `host` wins, how much of a long description does the greeting show?** Recommended: three lines, the rest a tap
  away; the album page already shows it whole.

## System-doc edits (in place, owned facts only)

- none: a lab round ships no production byte, and this lane owns no system doc.

## Deferred (ROADMAP one-liners, bucket named)

- Now: Guest door: at a password event the winning `identity-door` look shows no photograph before the unlock (`peek`
  face-down prints, `ticket` the ghost river, `lit` the house five); the look's wiring carries it.
- Now: Lab: the door board's keyboard is drawn at the manifest's 335 pt, never measured; door-flow's simulator walk
  (software keyboard on, Safari's form bar in view) trues `KEYBOARD_H` in `sandbox/identity-door/keyboard.tsx`.

## Handoff (replaces the chat report)

- **Commits, pushed on `lp/door-r2`:** `3f997277` (the round-two board and the three neighbours), `53410193` (door-flow's
  keyboard rule, captions, the ghost tap's plus), then this manifest. **No sync:** launch-prep moved (mark-r3's merge, the
  door-flow and identity-email cuts), nothing in my `reads` changed, and `git merge-tree --write-tree HEAD
  origin/launch-prep` merges clean (mark-r3 edited `touchpoints.ts`'s media-viewer row, mine the four boards' rows).
- **Gates on `53410193`, each its own exit code, all 0:** `pnpm typecheck`; `pnpm lint` (6 warnings, none in a touched
  file); `pnpm test` (449 files, 4888 tests); `zsh scripts/build-lock.sh pnpm build`; `pnpm lab:smoke --base
  http://localhost:3138` (278 checks, 0 failing; identity-door reads 586 of 1200 words); `pnpm lab:demo --board
  identity-door --base http://localhost:3138` (`identity-door.look` ok, 4 options, the stage moves by up to 51.88%,
  painted, 2.9 screens); and `--only` on the three redrawn neighbour steps: `identity-claims.pointer` ok (17.20%),
  `identity-profile.prompt` ok (28.63%), `guest-capture.tracker` ok (80.75%).
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = the four owned board folders, plus
  `src/app/(dev)/design/touchpoints.ts` (the manifest's own exception: the four boards' rows, identity-door's and
  identity-claims' edited, the other two still true), plus this file.
- **Items:**
  - `identity-door` r2 (`sandbox/identity-door/spec.ts`): one ask, `look`, four options, `peek` recommended; knobs
    `stage` (Arriving, Typing, Accounts, Inside), `scrim` (own or today's), `greeting` (Maya wrote a description or
    not); round one's asks gone (the ledger keeps them), its line in `history`; the seven calls in `carried`.
  - Frames (`scene.tsx`): each stage is one 1440 frame over three 375 frames, reel-cut's layout; every caption is read
    off its own frame (`board.tsx` readers).
  - Ground (`steps.tsx`, `ground.tsx`, `door.tsx`): his flow at production's words (the welcome at today's text,
    `DOOR_WEAR.gate` verbatim, the chooser in his order, the menu card as he amended it, the change-or-remove sheet),
    the album behind from `PosterCard`, `MediaTile` and `GALLERY_COLUMNS` with two arrivals held at the `data-arrived`
    rim, the scrim its own element.
  - The directions (`looks.tsx`, `identity-door.css`): `lit` (the screen lamp: hues sampled by `useSampledPalette`, paper
    or dark register by theme, the count ticking 48 to 50), `peek` (the sleeve: three newest stills out of the free
    edge, her credited slot on the name, held at the gate, brightened at the code, opened at the beat, a small fan on
    her card), `ticket` (the reel tile's crossfading card torn to a stub, stamped at You're in, heading her card),
    `host` (the identity line and her description as a message). All motion is CSS behind `no-preference`, still under
    reduced motion.
  - Keyboard (`keyboard.tsx`): one flat SVG in JSX so it wears the theme, 335 pt with the QuickType bar, letters (name,
    email) and the number pad (the code, offered From Mail); Return reads "next" on the name, "go" on an email.
  - The ghost tap: 44px, `text-working`, a trailing plus, one line at 375 with 15px to spare; at 320 "anytime" steps
    aside ("Add an email to come back", still one line), measured on screen by a 320 probe in the frame.
  - Neighbours, every option kept: `identity-claims.pointer` drawn at the album and at the door's You're in (context
    and options reworded); `identity-profile.prompt`'s `follow` adds the door frame; `guest-capture.tracker`'s `menu`
    is a Your photos row under her menu's card, then the list it opens. Each stacks its frames so the option stays one
    phone wide, and each round line says it was redrawn.
  - Two lab traps met and answered in place (WHY-comments): a board's Tailwind variant loses to production's utility on
    the same element (the ghost tap's query moved to the board's CSS), and `Row` is a kit-owned name (`MenuRow`).
- **Assets requested from Will:** `A portrait of Maya, the host · 512x512 square, warm and candid, JPEG, 1 · replaces the
  wedding-golden crop at HOST.avatar in sandbox/identity-door/fixtures.ts`.
- **Board ideas:**
  - The album's arrival light is white, so behind a blurred scrim on a light page it barely reads; a scrim-safe arrival
    (the photograph's own light blooming) would let the door's album read as live in both themes.
  - At 1440 the held door's content sits at the top of a 900px panel with its lower half empty in every direction; a
    board could ask whether the door's panel anchors, centres or fills at a desk.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none.
- **Calls his to overrule:**
  - The seven in the board's carried list (Google and the password under Log in; the hold only with uploads to move; a
    typed email changed or removed from the card; the one responsive Sheet, keyboard-safe; "Log in" on the chooser and
    the menu; the ghost line's words; the chooser's "How would you like to join?").
  - The keyboard rule is drawn as door-flow builds it, a sheet as tall as its content up to the visible area minus 12
    px, so tall steps leave 12px of album and short ones (the code) more; my brief said the height is that number.
  - Create account's line is production's own `keep` wear line (door-flow gives `identify` a reason only on a
    verification event); Log in's is the `signin` line in the future tense ("the photos you add here").
  - With the keyboard up `peek`'s fan rides small inside the sheet; at 1440 it comes out of the panel's left edge, its
    one free edge.
- **Look at first:** `/design/lab/identity-door?session=identity-door.look&key=`: `peek` at Arriving (the fan out of the
  welcome's edge), then Typing (held at the gate, brightened at the code), then `ticket` at Accounts (the stamp); flip
  `scrim` to today's on any of them to see what the blur and the overlay buy.
