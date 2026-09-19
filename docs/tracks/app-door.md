---
track: app-door
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "e442fc55"         # the launch-prep SHA the branch was cut from
board: app-door         # round one: login and signup, the door into the host app
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/app-door/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/auth-accounts.md
  - docs/systems/guest-flow.md
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/auth/callback/route.ts
  - src/app/(app)/layout.tsx
  - src/app/(app)/welcome/page.tsx
  - src/lib/welcome.ts
  - src/components/auth/login-form.tsx
  - src/components/auth/password-sign-in.tsx
  - src/components/auth/email-sign-in.tsx
  - src/components/shared/legal-consent-line.tsx
  - src/components/auth/google-icon.tsx
  - src/components/guest/enter-event-prompt.tsx
  - src/components/guest/save-account-prompt.tsx
  - src/components/guest/save-event-button.tsx
  - src/components/guest/entry-modal.tsx
  - src/lib/guest/entry-steps.ts
  - src/lib/validation/auth.ts
  - src/components/app/user-menu.tsx
  - src/components/shared/app-shell.tsx
  - src/components/marketing/chrome/marketing-header.tsx
  - src/app/(dev)/design/sandbox/guest-shape/spec.ts
  - src/app/(dev)/design/sandbox/app-shape/spec.ts
---

# lp/app-door

**Goal.** Round one of `app-door`: LOGIN AND SIGNUP, the door into the host app, reconceived from the ground up.
Will (2026-09-19, `docs/design/rulings.md`, "stack the lab"): "login/signup" is one of the surfaces he named,
"absolutely everything is up for relitigation or reconcepting from the ground up"; a board that keeps nothing is
deleted at no cost. Six to eight decisions with `defineExploration`, each drawn on the REAL auth components with
fixtures (a new host arriving from "Start free", a returning host, a guest becoming a host from an album; the
Google button, the code screen and the password screen as still previews, never a live call), at 375 and 1440, a
recommendation each, every number measured. **Not in this round:** any production byte; the guest gate's own
shape and steps (`guest-shape`'s `door` and `account` decisions, on the desk: draw on them, never re-ask them);
Supabase's providers and settings (what is enabled stays enabled); any credential typed by anyone.

**What is measured (the tree at the cut).** `/login` is a bare card afloat: no header or footer, a 384 px column at
`py-16`, the Logo above, "Welcome to Partyreel", "Sign in to create events and collect photos from your guests. No
app, no fuss.", a password form with a code toggle and "Continue with Google", the consent line beneath; the same
href behind the marketing header's "Log in" and "Start free". Creating an account is the password view's "Create
account": one email carrying a code and a link, the code typed in page, then "Pick a password", then `/dashboard`,
which sends a host with no display name to `/welcome` (a required name step, then a three-step tutorial that
repeats the marketing copy, skippable, inside the app chrome at 512 px). A returning host meets the same card; an
expired link says "That sign-in link didn't work. It may have expired."; a wrong password, a Google-only account
and an unknown email share one deliberately generic line; an existing email under "Create account" silently
signs that account in. FOUR account surfaces exist with four feature sets and three tones: `/login` (password,
code, Google), the guest gate's `EnterEventPrompt` (code and password, no Google, the most choreographed motion in
the product), the save prompt (code and Google, no password) and the likes prompt (its near copy); only two of the
four carry the Terms line; `login-form.tsx` redraws the Google "G" by hand; the signup's password step has no
strength meter while the account page's change form does; no passkeys, no Apple. Nine seams are listed in the
Orchestrator's map (`docs/tracks/orchestrator.md`, "The app round's map", the door paragraph); read them. The
behaviour pins: `auth.test.ts` (the password floor of 8, legacy sign-in at 1, the 72-byte cap, confirm-match),
`entry-steps.test.ts` (the step order, owner and demo never gated), `welcome.test.ts` (the two onboarding
predicates); they guard function, the look is open.

**The decisions (suggested; yours to recut, never forced apart).** SURFACES (how many account surfaces the
product has: four bespoke dialogs as today; one shared object with the methods as props, drawn in all four places;
one full door reached from everywhere); THE LEAD (what a door leads with: the password as today; an email code
with Google beside it and the password an account-page add-on; Google first, the email second); THE PAGE (what
`/login` is: the bare card; the door with the product beside it, a photograph or the album on one side at 1440
and stacked in a hand; the door in the guest gate's own language, the sheet and the arrival beat, since a guest
already learned it); WELCOME (what `/welcome` accomplishes: the tutorial as today; the name step alone, the
how-it-works folded into the empty dashboard; a first-event wizard that ends on a live QR); EXISTING (an email
that already has an account at "Create account": the silent reuse; "this email has an account, signing you in";
a stop and a sign-in door); FAILURE (how the door fails: one generic line as today, and why it is generic; a line
per method with the reset inline; the failure as a step of its own); THE RETURN (a returning host's door: the same
card; "welcome back" with their last event behind the form; one tap where the browser remembers them). Optional if
it fits the budget: THE TERMS LINE (where it appears; the recommendation is every account surface, which is a
finding as much as a decision). The `guest-shape` board is the worked example for a shape board on real
components with fixtures (its fixtures, its quoted portal-bound shells, its measured captions); copy its
approach, import nothing from another board's directory.

**Binds.** The bible; the security invariants in `docs/systems/auth-accounts.md` (authorize with `getUser()` only;
no `signUp` with a password, ownership proven by a code before a password is written; the generic password error
is deliberate, so an option that makes it specific says what it gives away; identities auto-link only on a
verified email; the consent line is where Checkout's consent collection is not); Google's account chooser is the
only place a credential is entered and it is off the app; "Allow new signups" stays on; a passkey or a new
provider is a product-defining call for Will, drawn only as an option and flagged in Questions; no em-dashes; the
copy is open (bible 21). Mobbin is encouraged, never required: sign-up and sign-in flows, onboarding, magic-link
and code screens, "welcome back" states.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3132`,
  `pnpm lab:demo --board app-door` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 375 and 1440 on the real components with fixtures, no network call from a preview; a capture of
  every option beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- **Passkeys and Google One Tap, the product-defining call.** `return`'s third option ("One press, where the
  device remembers") draws a saved passkey and an already-chosen Google account. Neither ships and both are
  one-way doors: a passkey is WebAuthn plus a credential table, One Tap is a Google script on a signed-out
  page. **Recommendation:** treat the option as a picture of a future, not a wiring ask. If `tap` wins, cut a
  separate round for it; if `back` wins, ship the remembered door on device-local memory alone. Drawn and
  flagged, never assumed.
- **The Terms line on every account surface.** Measured on the board: today the guest gate and the Save
  dialog both create accounts with NO consent line on them (`surfaces/four/A guest` and `.../Save`, both
  screens), while `/login` and the guest welcome carry it. **Recommendation:** every surface that can create
  an account carries it, which is what `surfaces`'s "One object" gives by construction. This is a finding as
  much as a decision, so it is folded into that option rather than asked as an eighth question.
- **Remembering a host on the device.** `return`'s "Welcome back" option keeps a name, a masked address and
  the last event's cover ON THE DEVICE. A signed-out page cannot read any of that from the server (there is
  no session to authorise with), so it is localStorage or nothing; on a shared laptop it is a disclosure.
  **Recommendation:** device-local only, never a pre-auth server read, with "Not Nadia? Use a different
  account" clearing it. Confirm that trade before the wiring.
- **A first event made before the host has seen the app.** `welcome`'s "The name, then their first event"
  ends on a live QR, which means an event row exists before a host understands the product. Events have no
  end date and deletion is the only lifecycle exit (the anti-abuse core), and the free tier's event cap is
  real. **Recommendation:** the wizard's event is a real event and counts, with the last step skippable, so
  nobody is spent a slot they did not want. Confirm.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none. This lane owns only `sandbox/app-door/`, so the two `auth-accounts.md` facts it measured (the two
  consent-less account surfaces, and the hand-drawn Google "G" beside the shared icon) are carried as
  Deferred lines rather than edited into a doc this lane does not own.

## Deferred (ROADMAP one-liners, bucket named)

- App polish: the Save and Likes account prompts create accounts with no Terms line (measured 2026-09-19 on
  `app-door`: 0 of 2 guest surfaces carry it); land it with whichever `surfaces` option wins.
- App polish: `login-form.tsx` redraws the Google "G" by hand beside the shared `auth/google-icon.tsx` every
  other surface imports; a one-line cleanup under any answer on this board.
- App polish: the signup's "Pick a password" step has no strength meter while `/account`'s change form does.
- Lab tooling: `defineExploration` flattens each decision's `configs` into the board's controls and hands
  back duplicates, so every board using a shared knob dedupes by id in its own spec (`gallery-width`,
  `guest-shape` and now `app-door` all carry the same four-line filter); the constructor could dedupe.

## Handoff (replaces the chat report)

- **Head SHA:** `<HEAD>` (the gate below ran at `e6a216ad`, the merge commit and the last code commit; this
  manifest fill is the one commit on top, prose only, nothing the gate touches).
- **Synced:** `origin/launch-prep` had moved 24 commits (`app-pricing`, `contact-page`, `press-page` and
  `demo-event` merged). `git merge origin/launch-prep` (never rebase) at `e486afc8`, resolved by keeping BOTH
  sides' added lines in all three registration files; the naive keep-both left `touchpoints.ts` structurally
  broken where two RULINGS rows were added at the same anchor (my row's closing braces swallowed by the
  app-pricing row's opening), repaired by hand and caught by typecheck. `docs/design/library.md` was taken
  from `origin/launch-prep` and regenerated. Full gate re-run green after; every number below is post-merge.
- **The gate, each step its own exit code, on the synced tree:**
  - `pnpm design:rules`: ok (regenerated `docs/design/library.md`, `rules/rules.generated.json`).
  - `node src/app/(dev)/design/gallery/collect-specimens.mjs`: ok (131 specimens on 94 entries).
  - `pnpm typecheck`: exit 0.
  - `pnpm lint`: exit 0 (8 known warnings, 0 errors; none of the eight are mine).
  - `pnpm test`: exit 0 (241 files, 2521 tests).
  - `pnpm build`: exit 0 (254 static pages).
  - `pnpm lab:smoke --base http://localhost:3132`: exit 0 (331 checks, 0 failing; `app-door` reads at 595 of
    its 1200-word budget).
  - `pnpm lab:demo --board app-door --base http://localhost:3132`: exit 0 (7 steps, 0 failing, "every step
    draws its options"; stage movement 4.92% to 97.76%). The two lowest, `return` and `lead`, are one card
    changing its contents inside an unchanged page, by design.
- **Lane check**, `git diff --name-only origin/launch-prep...HEAD`:
  ```
  docs/design/library.md
  docs/tracks/app-door.md
  src/app/(dev)/design/(shell)/lab/boards.ts
  src/app/(dev)/design/sandbox/app-door/app-door.css
  src/app/(dev)/design/sandbox/app-door/board.tsx
  src/app/(dev)/design/sandbox/app-door/edges.tsx
  src/app/(dev)/design/sandbox/app-door/fixtures.ts
  src/app/(dev)/design/sandbox/app-door/methods.tsx
  src/app/(dev)/design/sandbox/app-door/shells.tsx
  src/app/(dev)/design/sandbox/app-door/spec.ts
  src/app/(dev)/design/sandbox/app-door/surfaces.tsx
  src/app/(dev)/design/sandbox/app-door/welcome.tsx
  src/app/(dev)/design/sandbox/registry.ts
  src/app/(dev)/design/touchpoints.ts
  ```
  Every line is inside `owns`, this manifest, or an allowed registration file (`sandbox/registry.ts`,
  `(shell)/lab/boards.ts`, `touchpoints.ts` with one RULINGS row after `river-visual`'s);
  `docs/design/library.md` is the generated artifact `pnpm design:rules` owns. Nothing outside that set.
- **The seven decisions, one line each (full text and every option in `spec.ts`):**
  1. **`lead` · What should the door ask a new host for first?** Email and password as today · one email and
     the code · Google first. **Recommend the code:** the other three surfaces already lead with it, it signs
     in and creates in one step, and it asks a host to remember nothing. Independent.
  2. **`surfaces` · How many account surfaces should the product have?** Four as today · one object worn four
     ways · one full door reached from everywhere. **Recommend one object:** the four differ only in why they
     ask, and the two that forgot the Terms line are what four copies cost. Independent; the knob draws
     `/login`, the guest gate and Save.
  3. **`welcome` · What should stand between a new account and the app?** The name then the three-step tour
     (4 screens) · the name alone (1 screen) · the name then their first event, ending on a live QR (3
     screens). **Recommend the first event:** nothing is real until a host has a code, and the tour is the
     marketing site read twice. Independent; every option draws its whole flow.
  4. **`page` · What should the /login page be?** (after `lead`) The bare card as today · the door with the
     product beside it · the door in the guest gate's own sheet. **Recommend beside:** measured, today's card
     is 13 percent of a laptop and photographs carry 0; beside makes it 50.
  5. **`existing` · What should happen when a new account's email already has one?** (after `lead`) Open it
     and say nothing, as today · open it and name it · ask which they meant. **Recommend naming it:** the
     code proves the address either way, so only the sentence is missing, and refusing before the code would
     leak whether the address exists.
  6. **`failure` · How should the door fail?** One line as today · the line with the ways out as buttons ·
     the failure as its own screen. **Recommend the buttons:** the sentence must stay vague, so the work it
     cannot do falls to what is under it; measured, today is 26 words of prose and 0 controls. Independent
     (the generic refusal is the password path's under every lead).
  7. **`return` · What should a host the browser already knows meet?** (after `page`) The same door for
     everyone, as today · welcome back with one field left · one press where the device remembers.
     **Recommend welcome back:** a returning host is most of this page's traffic and all it has to do is
     prove it is their Partyreel and take one field.
- **Assets requested from Will:** none. Every photograph on the board is one of the bootstrap 12 marketing
  stills, and the wall beside the door is exactly the surface the Higgsfield month's set will improve on its
  own; no new asset is needed to rule on any of the seven.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** none. Not one production byte; no preview
  touches the network (`shells.tsx`, `Still`).
- **Look at first:**
  - **`page`, at 1440.** It is the widest swing and the measured gap is the whole argument: 13 percent door
    and 0 percent photographs today against 50, and the sheet option against 100.
  - **`surfaces`, with the knob on "A guest at the door" and then "Save".** The caption under each is the
    seam in numbers: two ways in and NO Terms line on both of today's guest surfaces, three and a consent
    line on the shared object.
  - **`welcome`.** The only step that draws whole flows rather than screens; four numbered screens against
    one against three, with the third ending on a real scannable code.
  - **The captures**, 54 of them, at
    `/private/tmp/claude-501/-Users-gibby-local-ai-partyreel/924675e3-.../scratchpad/app-door-work/shots/`
    (throwaway, never in the repo). Five real defects came out of reading them against their own words and
    all five are fixed: a wall that filled a third of its half while the words promised a half, a caption
    that carried the previous option's numbers because the Probe never remounted, `instanceof` failing across
    the frame's realm so two doors "led with a button", a field count that missed the one input with no
    `type`, and a recovery option that drew Google and the code link twice.
  - **An operating note for the Orchestrator, not a ROADMAP line:** concurrent lanes on this machine SHARE
    the scratchpad path. A file named `capture.mjs` there was overwritten mid-session by another lane's
    script of the same name, and a fixed CDP port (9333) put this lane's driver on that lane's Chrome; it
    also left two stray directories in this worktree, removed before the commit. Lane scripts want a unique
    name, a directory of their own and a port they checked.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (2026-09-19). Round one of `app-door` put the door into the host app on
the desk as seven decisions with `defineExploration`, every option drawn on the shipped auth components with
fixtures at 1440 and 375: what the door asks for first, how many account surfaces the product has, what
stands between a new account and the app, what `/login` is as a page, what happens when a new account's email
already has one, how the door fails, and what a host the browser already knows meets. Four are independent
and three are staged behind the lead and the page. Nothing authenticates: every press is captured before its
handler, so no preview sends an email or calls Supabase, and every caption is read off the laid-out DOM. The
board measured the seam it was cut for, that two of the four account surfaces create accounts with no Terms
line on them, and the capture pass caught five defects before the handoff.
