---
track: door-r3
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

The board's five asks are Will's to answer on the desk; these are the lane's own calls, each built as recommended and
drawn on the board as a carried call.

- **The password step's head, centred as production has it, or from the left like every other step?** Recommended:
  from the left (built; carried call `password-left`), its words untouched since `voice-guest.ask` asks them. If a
  locked event should feel set apart, the centred block comes back.
- **Do the controls' glyphs move with `icons`?** Recommended: no (built; `controls-stay`): the back chevron, the close
  X, the password's eye, Google, the upload's two buttons and her menu's rows keep today's in every option, because an
  action icon stays monochrome at rest (`design-system.md`).
- **Which words does no ask move?** Recommended: his own (the chooser's three buttons, the name step's "so the host
  knows who to thank", "Save this event for later"), the gate's ruled line, and `voice-guest`'s welcome rows, password
  words, keep ask and landing, all drawn at today's (built; `held-words`).
- **The keep screen is drawn from guest-capture's `OfferSheet`** ("Sent", "Your photo joined Maya's album.", the keep
  ask, Confirm your email, Maybe later) inside the lit door sheet, with its primary at the door's `cta` rung; its head is
  a beat, so `beat` moves its mark. Recommended: as drawn; `guest-door`'s build is the truth where it differs.

## System-doc edits (in place, owned facts only)

- none (a lab-only round: no production byte, no system fact changed)

## Deferred (ROADMAP one-liners, bucket named)

- Guest door: `email-sign-in.tsx`'s code screen still says "Or tap the link in the same email to sign in" where the
  guest door says Log in everywhere else; every non-today `identity-door.code` option drops it, and if today wins the
  word still wants the fix (from `door-r3`).
- Guest door: the code screen has no primary, so with the keyboard up (`entry-shell.tsx`'s `data-[keyboard=open]:pb-0`
  hands the bottom space to a sticky primary) its last line sits about 6 px off the keyboard in the board's quote of
  its classes; check it on a phone (from `door-r3`).

## Handoff (replaces the chat report)

- Work commits `6cb53f94` (the board), `7883252b` (a password event over its locked page, the house five) and
  `a5229c2b` (prettier's line wrapping only), pushed; the manifest commit is the head in the chat line. No sync: launch-prep moved (story-r3, profile-setup, claims-r2 and
  mine-none merged) but none of it touches the door's components or this board, and
  `git merge-tree --write-tree HEAD origin/launch-prep` is clean.
- Gates on `a5229c2b`, each on its own exit code (logs in `partyreel-wt/_scratch/door-r3/g-*.log`): `pnpm typecheck` 0;
  `pnpm lint` 0 (0 errors, 6 warnings, none in a touched file); `pnpm test` 0 (484 files, 5478 tests);
  `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3136` 0 (261 checks, 0 failing;
  identity-door 521 words of 1200); `pnpm lab:demo --board identity-door --base http://localhost:3136` 0 (5 steps ok,
  every stage moving: icons 1.09%, chooser 4.86%, hint 2.20%, code 5.98%, beat 0.66%).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = the 14 paths under `sandbox/identity-door/`
  (`looks.tsx` deleted, lit's pieces moved to `lit.tsx`; `world.ts`, `glyphs.tsx`, `menu.tsx` new) + this file +
  `src/app/(dev)/design/touchpoints.ts`, the board's own row (the brief's named exception: its asks, why, lives, note,
  variants, and `tracks: ["door-r3"]`, as media-viewer's row names mark-r3).
- `icons` (recommended `lit`): today's grey glyphs, pools of the album's sampled light, or none, walked over every
  screen on a six-stage knob (arriving, proving, accounts, landing, inside, edges).
- `chooser` (recommended `told`): today's line over three buttons, each way in saying what it gives, Log in stepping
  down to a link, or the buttons alone under the event; at 1440, 375 and a 320 phone.
- `hint` (recommended `change`): "Nobody has to prove a name", "You can change it anytime" (no line on Change name
  itself), or nothing; drawn in the join, email-opened and Change name modes.
- `code` (recommended `mail`): today's code under the step's head ("to sign in"), "Check your email" heading it, or the
  code arriving under her filled email.
- `beat` (recommended `hers`): the success green, the check in the album's light, or what became hers ("You're in,
  Priya" in her colour; the photo she sent beside Sent).
- Five screens drawn for the first time, in lit: the password step (over the locked page, lit by the house five, as
  production lights it), the upload step, the demo's welcome, the stalled opening and the keep screen.
- Today is production, quoted (words, icons and classes), not round two's drifted board; round two's losing looks
  (peek, ticket, host) leave with their CSS, and every caption is read off its frame (words on the sheet, icons and
  their hues, the keyboard's clearances).
- Assets requested from Will: none.
- Board ideas: the change and confirm sheets from her menu head with a Sheet's card title while every door step heads
  with the page step, so one heading scale for every guest sheet (`popups` asks the surface, not the heading).
- Board ideas: the host's `/login` shares `EmailSignIn`'s code screen, so a `code` pick lands there too unless the
  wiring scopes it; a host-door question if the two should differ.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the four Questions above (the password step from the left, the controls unmoved, the held
  words, the keep screen as OfferSheet); and each ask's recommendation (lit, told, change, mail, hers).
- Look at first: `/design/lab/identity-door?key=`, the `icons` step with the stage knob on Proving and Edges (the
  password step and the demo's welcome, drawn for the first time), then `beat`.
