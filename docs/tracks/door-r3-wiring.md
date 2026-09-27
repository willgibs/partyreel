---
track: door-r3-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "8d202ed1"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/components/guest/entry-
  - src/components/guest/door
  - src/components/guest/guest-name-
  - src/components/guest/identify-step
  - src/components/guest/password-gate
  - src/components/guest/upload-step
  - src/components/guest/add-email-dialog
  - src/components/guest/save-account-prompt
  - src/components/auth/
  - src/components/likes/likes-provider
  - src/lib/guest/door-light
  - src/lib/guest/entry-steps
  - src/lib/guest/use-success-hold
  - src/app/(dev)/design/sandbox/identity-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/identity-door.json
  - docs/systems/guest-flow.md
  - docs/systems/design-system.md
  - src/components/ui/sheet.tsx
---

# lp/door-r3-wiring

**Goal.** `identity-door` r3's five answers built on the lit door: lit icons, a chooser whose ways in say what they give, a smaller "You can change it anytime", "Check your email" heading every code screen, and a success beat in the album's light with motion; then the identity-door board retires.

## The brief

**His answers** (`docs/reviews/identity-door.json`, r3; each option drawn on `src/app/(dev)/design/sandbox/identity-door/` (`lit.tsx`, `glyphs.tsx`, `steps.tsx`, `menu.tsx`), which is the spec; production's door is `guest-door`'s lit build):
- `icons=lit`: each row leads with a round of the lamp's own sampled hue and the small glyphs take the same light, on every guest door screen (decorative icons only: the carried call `controls-stay` keeps the back chevron, the close X, the password's eye, Google, the upload's two buttons and her menu's rows as today).
- `chooser=told`: the sentence goes; each button carries a small line (Just your name; what an account keeps), Log in stepping down as drawn.
- `hint=change`: "You can change it anytime" under her name (Change name itself shows no line). His note: "Since this is a small note, the font size should be smaller on this line."
- `code=mail`: "Check your email" heads every code screen `EmailSignIn` draws (the gate, Create account, Log in, the confirm sheet, and the host's `/login`, which shares it, as the answer's own line said), the address, six slots full width, then the link and the resend; it drops "Or tap the link in the same email to sign in" (ROADMAP's line). Check the code screen's last line against the keyboard on a phone (ROADMAP: about 6px off it with no sticky primary).
- `beat=lit` (overruling `hers`): the check blooms in the album's colour and the button fills with it. His note: "Some motion (like https://transitions.dev/detail.html?t=success-check plus https://transitions.dev/detail.html?t=texts-reveal) could make this feel like a delight. The text pop in could be used across the flow, unless that conflicts with a transition like our page side-by-side." Study both references (fetch the pages), build the success check and the text reveal on the beat, and carry the text reveal across the door's steps where it does not fight `entry-step-transition.tsx`'s side-by-side move (say where it runs and where it stands down). Reduced motion: no motion, the end state.

**The carried calls, kept:** `password-left` (the password step's head from the left, its words untouched: `voice-guest.ask` asks them), `controls-stay`, `held-words` (his own words and `voice-guest`'s welcome rows, password words, keep ask and landing stay as today), and the keep screen as drawn.

**Also the door's:** one heading scale for every guest sheet (the change and confirm sheets from her menu head with a Sheet's card title while every door step heads with the page step: ROADMAP's line), and the "Like this" door (`src/components/likes/likes-provider.tsx`, today a centred dialog with its email field focused on open) takes the door's held sheet (ROADMAP's line).

**Out of this lane:** every other popup (`popups-wiring` owns `src/components/ui/` and the non-door popups; if the door needs one line in `sheet.tsx`, name it as an exception), the confirm return's toast (`confirm-beat.ts`, `popups-wiring`'s), the claims card.

**Then retire `identity-door`**, one commit (its folder, its lines in `registry.ts`, `boards.ts`, `touchpoints.ts`; named exceptions). `guest-flow.md` lines in the Handoff.

**Verify:** the door at 375 and 1440, light and dark, every screen (welcome, chooser, name in its modes, gate, code, log in, create account, password, upload, keep, You're in, the menu, both sheets), the beat's motion and reduced motion; `/login`'s code screen; `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

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
