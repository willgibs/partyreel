---
track: app-door
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board app-door` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
