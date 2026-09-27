---
track: door-r3-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
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

- **The keep screen "as drawn", against one heading scale.** The board drew the keep as guest-capture's offer
  sheet: a "Sent" row with its mark, then the ask centred a step smaller (subsection). Recommended and built: the
  drawn Sent row (`beat=lit`'s check beside "Sent", over where it went), and the ask on the door's page step from the
  left, as every other step reads (`password-left`'s own reason, and the brief's one heading scale). The drawn
  centred ask is one edit in `KeepOffer` (`save-account-prompt.tsx`).
- **The keep's lamp rests.** The board drew it blooming; production rests it on a measurement (a bloom's wash under
  the sheet's top words reads 2:1 in dark). Recommended and built: it rests, and the keep's beat is its lit check.
- **The line under her name, how small.** Recommended and built: the working step (14px, the email row's size
  under it), one rung under the field's 16px; the caption step (12px) reads as legal print on a phone.
- **The like door closes.** "Takes the door's held sheet" read as the door's sheet (lit, responsive, no field
  focused on open) with its X, Escape and the backdrop, because a like is optional and a held sheet would trap a
  guest who tapped a heart. Recommended and built.
- **Where the text reveal runs, and its clock.** Recommended and built: wherever words arrive in place (the door's
  first step as the sheet lands, "You're in", the unlock's words, "Check your email", the upload step's own views, a
  line that changes under a beat), standing down on every step that arrives by the side-by-side move; the
  recipe's 500ms and 40ms stagger, past the 300ms UI ceiling as the door's once-per-event moments (bible 5). A
  shorter clock is one number in `door.css`.
- **"You're in" arrives in place.** No slide under the beat; the step it replaces fades where it stood
  (`EntryStepTransition`'s `place`). Recommended and built.
- **The demo's welcome in lit, as the board drew it** (the event's name at the welcome's hero size inside its own
  sentence, its promises on pools), since `RoleStep`'s design is the welcome's. Recommended and built.
- **The step container's gutter.** It reaches 12px into the sheet's padding, so the clip no longer shaves a focused
  field's ring (every full-width field, the code's outer slots) or cuts the keep mark's glow; a slide's 16px now fades
  inside the margin rather than against the column. Recommended and built.
- **The confirm and add sheets keep their desk focus** (Radix focuses the first field at a desk; a phone focuses
  the panel). Only the like door took the door's no-field-focused rule at both widths, the ROADMAP's complaint.
  Recommended: leave them (typing at a desk is the fast path); one prop each to change.

## System-doc edits (in place, owned facts only)

- none by the lane: `guest-flow.md` and `design-system.md` are reads, so their lines are in the Handoff.

## Deferred (ROADMAP one-liners, bucket named)

- Help-sync, the guest door: `the-email-code-didnt-arrive` and `sign-in-options-and-passwords` call the code screen
  "Enter your code" (it heads "Check your email" now), and `how-guests-join-and-upload` says "Nobody has to prove a
  name" (the line under her name is "You can change it anytime.") (from `door-r3-wiring`).
- The lab: the keyboard bench's code replica (`(shell)/lab/tools/keyboard-sheet/keyboard-bench.tsx`) still draws the
  old code screen ("Enter your code", "…to sign in"); redraw it as production's (from `door-r3-wiring`).
- Design system: the house bounce lives only on `[data-mkt]` (`--mkt-ease-pop`), so the door's success check writes
  the same value inline (`door/lit.css`); one theme token would serve both (from `door-r3-wiring`).
- Guest: the album's failure sheet (`upload/failure-sheet.tsx`) still heads with a Sheet's card title while the same
  failure inside the door's upload step heads on the page step (`door/heading.tsx`), the one guest sheet outside the
  door's scale (the popups' kinds head by their own table, `ui/popup.tsx`) (from `door-r3-wiring`).

## Handoff (replaces the chat report)

- Work commits, pushed: `67f3756f` (identity-door r3's five on the lit door, one heading scale, the like door on
  the door's sheet), `a0c7a976` (`identity-door` retired, one commit on `3eade6c6`'s template). Sync `f0dd5fa5`
  (merge of origin/launch-prep at `ce0edd9f`: popups-wiring, demo-doors, hero-card r1, claims-r3): popups-wiring
  touched this lane's reads (`guest-flow.md`, `design-system.md`) and both lanes' retirements met in the three
  registration files; each side had deleted its own board's line and kept the other's, so the resolution drops both
  (identity-door and popups), hero-card's lines kept. The head is in the chat line.
- Gates on `f0dd5fa5`, the synced tree, each on its own exit code (logs `partyreel-wt/_scratch/door-r3-wiring/g2-*.log`):
  `pnpm typecheck` 0; `pnpm lint` 0 (0 errors, 5 warnings, none in a touched file); `pnpm test` 0 (506 files, 5667
  tests); `zsh scripts/build-lock.sh pnpm build` 0; `pnpm lab:smoke --base http://localhost:3132` 0 (247 checks, 0
  failing). The same five were green before the sync on `a0c7a976` (`g-*.log`: 500 files, 5638 tests; 247 checks).
  The door's modern CSS was read back out of the built chunks (the `[data-door-line]` starting style and stand-down,
  the check's keyframes, the `not-has` keyboard padding, the important slot height, the clone's `[data-entry-exit] *`).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file, and the brief's named
  exceptions for the retirement: `src/app/(dev)/design/touchpoints.ts`, `src/app/(dev)/design/sandbox/registry.ts`,
  `src/app/(dev)/design/(shell)/lab/boards.ts` (identity-door's lines only).
- `icons=lit` (`door/lit.tsx`, `door/lit.css`): the welcome's and the demo's promises lead with pools of the lamp's
  hues in turn (`DoorPool`, 36px, the glyph in ink); the Lock beside "Almost in" (password and gate) and the name
  step's envelope take the lamp's light (`DoorGlyph`, 3:1 as a graphic in both registers); every control keeps its
  monochrome glyph (`controls-stay`).
- `chooser=told` (`door/chooser.tsx`): the sentence goes and each way in carries its small line ("Just your name",
  "Every photo you add stays with you", "The photos you add join your account") as its accessible description, the
  sentence staying the sheet's description; Log in as drawn (outline, beside Create account).
- `hint=change` (`guest-name-step.tsx`, `guestNameHint`): "You can change it anytime." at the working step (his note:
  smaller) in `join` and `profile`; Change name (`edit`, `account`) shows none, the field described only when a line
  exists.
- `code=mail` (`auth/email-sign-in.tsx`, `auth/account-door.tsx`): `AccountDoor` draws the surface's heading (its new
  `head`, the door's scale) and, while a code is out, "Check your email" over "We sent a 6-digit code to <address>."
  in its place (the gate keeping "Almost in"), on every code screen `EmailSignIn` draws: the gate, Create account, Log
  in, the keep's, the confirm sheet's, the like door's, and `/login`'s centred heading (the answer's own scope); the
  six slots across the full width (48px), described by the sent line; "Or tap the link in the same email." (no "to sign
  in"); the resend. "Use a different email", or a code screen that unmounts (the existing-account hold, Log in's
  password), brings the surface's heading back (`sentAt(null)` at unmount). One home for the words
  (`CODE_SCREEN_TITLE`, `codeSentLine`).
- The keyboard line: `DOOR_SHEET` (`entry-shell.tsx`, the padding every door sheet wears) keeps 16px under a screen
  with no sticky primary while the keyboard is up (`data-[keyboard=open]:not-has-[[data-sheet-primary]]:pb-4`), where
  `pb-0` had left the code screen's last line on the keyboard's edge. Measured in headless Chrome with the Sheet's own
  keyboard state forced (`--kb-inset` 310, the iPhone 17's code keyboard): the resend row's bottom sits 16px above
  the sheet's foot, the slots in view (`kbcode` in `door-shots.mjs`). Not on a phone: the iOS Simulator tool needs
  `xcode-select` pointed at Xcode (sudo), so a real keyboard look is the red-team's.
- `beat=lit` (`entry-modal.tsx` SuccessStep, `password-gate.tsx`, `save-account-prompt.tsx`, `door/lit.css`): "You're
  in" leads with a check blooming in the lamp's hues (`DoorCheck`: conic light, ink check on paper, white in the dark
  room) that arrives as transitions.dev's success check (fade, turn from 80deg, 10px blur, bob, the stroke drawing 80ms
  behind; 500ms, smooth-out as `--ease-emphasis`, the bob on the house bounce written inline), its words revealed
  140ms behind, the view arriving IN PLACE (`EntryStepTransition`'s new `place`: no slide, the step it replaces fading
  where it stood). The password's unlock button fills with the album's light (the house five at a locked event),
  crossfading over the primary, its check drawing and "You're in" revealed (white on the dark register's light
  measured 4.8 to 5.4:1, ink on paper 10.9:1 or better). The keep heads with "Sent" beside a lit check (its glow scaled
  to its 36px), read aloud now (it was hidden), the lamp resting as measured. Motion captured in slow motion (x10);
  reduced motion shows the end state at mount (captured).
- The text reveal (`door.css`, `[data-door-line]`, transitions.dev's texts-reveal: 12px out of a 3px blur, 40ms apart,
  500ms). RUNS where words arrive in place: the door's first step (the welcome's five lines, measured staggered 0 to
  160ms), "You're in", the unlock's words and "Opening the album", "Check your email" (measured revealing in place), the
  upload step's own views. STANDS DOWN on a step that arrives by the side-by-side move (measured: the chooser's heading
  carries no transition while its layer slides, and the layer is `data-settled` after). The exit clone replays nothing
  (`[data-entry-exit] *`).
- One heading scale (`door/heading.tsx`, `DoorHeading`): every door step, the add, change and confirm sheets from her
  menu and the like door head on the page step from the left (the sheets headed with a Sheet's card title), padded as
  the door (`DOOR_SHEET`), their dialogs still named by sr-only titles.
- The like door (`likes/likes-provider.tsx`): the responsive Sheet in the door's light (scrim, lamp, heading), the
  guest door's 16px field and 44px primary, no field focused on open (the panel takes focus: measured at 375 from the
  viewer and at 1440 from a tile), closing with its X, Escape and the backdrop.
- Also: `password-left` (the password step's head from the left, its words and h1 untouched); the demo's welcome as
  the board drew it; the step container's 12px gutter (focus rings and the keep mark's glow no longer clipped).
- Pins: the chooser's descriptions and names, the hint in both kinds of mode, the code screen's heading swap on the
  gate, on Create account and back, `/login`'s swap and a surface handing the door no heading, the lit beat arriving in
  place, the pools, the unlock's light and drawn check, the keep's Sent row, the like door's sheet and focus, the step
  container's `place` and settling (`entry-step-transition.test.tsx`, new). Five pins reshaped on purpose, each saying
  which: the chooser's button names (now its buttons' accessible names), the hint's words, the code's heading
  ("Enter your code" became "Check your email"), the like door's dialog name, the add sheet's description.
- Verified locally on :3132 against the real Supabase with every send, sign-in and write intercepted in headless
  Chrome (the OTP send and verify, the join, the unlock, the presign, the R2 PUT and the completion; the refresh held
  where a fake session would crash the render): nothing reached an inbox or a table
  (`partyreel-wt/_scratch/door-r3-wiring/door-shots.mjs`). Every screen at 375 and 1440 in light and dark: welcome,
  chooser, name, the email opened, Change name, gate and its code, Create account and its code, Log in, its code and
  back, password and the unlock's frames, upload, the review, keep, its confirm and code, "You're in" (frames, slow
  motion, reduced motion), the demo's welcome and upload, her menu, the add, change and confirm sheets and the
  confirm's code, Log in from her menu, the like door, `/login` and its code: 194 captures in `matrix/`; the key flows
  re-walked on the synced tree in `synced/`.
- `identity-door` retired (`a0c7a976`): the Orchestrator deletes `docs/reviews/identity-door.json`.
- `guest-flow.md`, for the Orchestrator, each in place:
  - "THE GUEST'S POPUPS OPEN THROUGH THEIR KINDS": "the DOOR and its held sheets (the confirm door
    `ConfirmEmailDialog`, the header menu's Add your email, `add-email-dialog.tsx`, and the like door, "Like this",
    `likes-provider.tsx`)", and after the sentence: "The door's family heads with the door's one heading scale
    (`door/heading.tsx`: the page step, from the left) and pads as `DOOR_SHEET` (`entry-shell.tsx`)."
  - "THE DOOR IS LIT", after "…her menu's card wear it too": "and the like door. Its light reaches the words
    (`icons=lit`): the welcome's promises lead with pools of its hues (`DoorPool`) and the small glyphs, the Lock beside
    "Almost in" and the envelope, take it (`DoorGlyph`); a control keeps its monochrome glyph. Every beat blooms in it
    (`beat=lit`: "You're in"'s check, the unlock's button, the keep's Sent; `DoorCheck`)."
  - The itinerary: "(the chooser's Continue as guest, Create account and Log in, each carrying its small line of what
    it gives; …".
  - The welcome: "two warm `text-base` rows, each on a pool of the lamp's hues".
  - The CONTINUOUS step container, after the exit clone: "★ "You're in" arrives IN PLACE (`place`): its check and words
    are its entrance, and the step it replaces fades where it stood. A sliding layer carries `data-settled` once its
    move lands, and the box reaches 12px into the sheet's padding so its clip never shaves a focus ring. ★ THE TEXT
    REVEAL (`[data-door-line]`, `door.css`): a heading's lines rise out of a blur, 40ms apart, wherever words arrive in
    place (the first step as the sheet lands, "You're in", the unlock's words, "Check your email", the upload step's
    own views) and stand down on a step that arrives by the side-by-side move; the exit clone replays no entrance."
  - The SUCCESS HOLD: "the gate stays PLANTED and its button fills with the album's light, its check drawing ("You're
    in" + `data-unlock-success`, `data-unlock-lit`). The email confirmation's hold shows "You're in" in place, its
    check blooming in the album's light with the success-check motion (the code machinery has no single button to
    morph)."
  - After the password gate's autofocus bullet: "- **Every code screen heads "Check your email"** (`code=mail`,
    `/login` included): `AccountDoor` draws it in the surface's heading's place (`head`), a gate keeping its "Almost
    in", then the address, six slots across the full width, "Or tap the link in the same email." and the resend;
    with no sticky primary the sheet keeps 16px above the keyboard (`DOOR_SHEET`)."
  - `guest-name-step.tsx`'s FOUR modes: "the line under the name reads "You can change it anytime." (`hint=change`, the
    working step); the two doors that change a name show none."
  - THE KEEP: "the door reopens on "Sent", beside a check blooming in the album's light, over what went".
- `design-system.md`, "The arrival choreography", for the Orchestrator: "The door's beats take transitions.dev's recipes
  at their 500ms, the same sanctioned exception: the text reveal (`[data-door-line]`, `door.css`) and the success
  check (`door/lit.css`, its bob on the house bounce written inline, since `--mkt-ease-pop` lives on `[data-mkt]`)."
- ROADMAP lines this closes or narrows: the board's dark wash and blooming keep (moot: the board retired; production's
  measured rim and resting keep stand); the "Like this" door (done); the code screen's "to sign in" (done); its last
  line against the keyboard (16px, measured with the keyboard state forced; a phone look stays the red-team's); the
  `/login` scope (it shares the pick, centred); one heading scale (done for the door's family; the album's failure
  sheet is a Deferred line); the door board's `KEYBOARD_H` (moot: retired); the centred-Dialog line narrows to
  `ExportDialog` alone (the confirm and add sheets were Sheets already, the like door is one now).
- Assets requested from Will: none.
- Board ideas: at a desk the door's lamp runs down the panel's left edge, so the welcome's pools stand in its own wash
  and read faint there (`matrix/welcome-1440-light-welcome.png`); a board could ask whether the desk lamp stops short
  of the promises, or the pools step up at a desk.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the nine under Questions (the keep's ask on the page step, the keep resting, the hint's
  size, the like door closing, the reveal's reach and clock, the beat in place, the demo's welcome, the gutter, the
  confirm and add sheets' desk focus).
- Look at first, on the alias: a verification event at 375 (the gate, "Check your email", a real code, "You're in"
  blooming with its motion); the password event's unlock; a first upload for the keep's Sent; a heart for the like
  door; `/login`'s code screen; then the code screen with a real iPhone keyboard up.
