---
track: emails
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "d909cb13"          # the launch-prep SHA the branch was cut from
board: emails           # round one: every email Partyreel sends, the surface that arrives in someone else's inbox
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/app/(dev)/design/sandbox/emails/
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/design/rulings.md
  - docs/design/guidance.md
  - docs/systems/lifecycle-recovery.md
  - docs/systems/notifications-analytics-growth.md
  - docs/systems/auth-accounts.md
  - docs/PRICING.md
  - src/lib/email/templates.ts
  - src/lib/email/templates.test.ts
  - src/lib/email/send.ts
  - src/lib/env.ts
  - src/app/api/cron/purge/route.ts
  - src/app/(marketing)/(paper)/contact/actions.ts
  - src/app/(marketing)/(cinema)/careers/actions.ts
  - src/components/app/notification-prefs-form.tsx
  - src/lib/social/notification-prefs.ts
  - src/lib/notifications/build.ts
  - src/components/auth/email-sign-in.tsx
  - src/components/shared/logo.tsx
  - src/lib/brand/wordmark.ts
  - src/lib/constants/site.ts
  - src/app/theme.css
  - src/app/(dev)/design/sandbox/contact-page/spec.ts
---

# lp/emails

**Goal.** Round one of `emails`: EVERY EMAIL PARTYREEL SENDS, the one surface of the product that arrives in someone
else's inbox, reconceived from the ground up. Will (2026-09-19, `docs/design/rulings.md`, "the overnight round"): explore
every surface, everything unprotected, "at worst, net neutral and fully deleted". Six to eight decisions with
`defineExploration`, each drawn as the REAL templates rendered from `src/lib/email/templates.ts` (pure functions, no
imports; call them with fixture options and draw the HTML inside an inbox mock: a From, a To, a Subject row, then the
body) at a phone's inbox width and a laptop's, a recommendation each, every number measured; no preview imports
`send.ts` or `client.ts` (both `server-only`) and nothing can send. **Not in this round:** any production byte; the
contact form's own receipt, urgency and topic (`contact-page`, on the desk: this board touches only that mail's shell);
where a Checkout door lands (`app-pricing`); the in-app bell's shape; the Supabase auth templates themselves (they live
in the dashboard, out of the repo: the board draws the code email as a labelled static mock only).

**What is measured (the tree at the cut).** Ten templates, all HTML-only (no `text` twin), all from `EMAIL_FROM`
(`Partyreel <noreply@partyreel.com>`), all sent once through `sendOnce` (deduped on `sent_emails(kind, dedupe_key)`; no
direct test). Six to hosts from the lifecycle cron: the over-cap trio (grace start, a 45-day grace; the reminder seven
days out; reduced, pointing to Trash with a 30-day window), the renewal nudge (14 days before a pass expires; its
button says "Renew Event Pass" and links `/dashboard`, not Checkout), the inactivity pair (a warning 14 days out; removed,
the 180-day free sweep). Their shared `layout()` is a plain div at `max-width: 480px`, a button in `#e11d48` (a rose the
product never uses: the brand is ink, `BRAND_HEX` `#101010`, and theme.css says brand never takes colour), no wordmark
(the logo is an inline SVG on `currentColor` with no raster twin), a footer of one line ("Partyreel · you're receiving
this because you host an event with us"), no unsubscribe, no address. Four to operators (the contact relay and the
careers relay, Reply-To the sender; the orphan-sweep and backup-prune breaker alerts), each hand-rolling its own
near-identical `max-width: 560px` wrapper rather than the shared one. To guests: NONE (the capture-email route only stores
an address; the "email me the album link" send is deferred by name in `notifications-analytics-growth.md`). The auth
mails (the six-digit sign-in code, reused for signup, forgot-password and the deletion re-verify) are Supabase dashboard
templates over Resend SMTP, not in the repo. The notification preferences card shows four live-looking switches (reel
ready, album shared, uploads digest, new follower) for mails that do not exist ("SHAPED for R5: nothing sends yet"); only
the marketing opt-in is real. No welcome mail, no reel-ready mail, no moderation-outcome mail (the bell absorbs them; a
voluntary delete is never emailed, by doctrine). The pins: `templates.test.ts` pins the copy of three of ten (the
system-removal wording, a concrete 30-day window, never "reply to this email"); `notification-prefs.test.ts` pins the
column mapping; nothing pins layout, brand or rendering.

**The decisions (suggested; yours to recut, never forced apart).** ONE SHELL (today's two idioms, the hosts' 480 and the
operators' 560; one shell for all ten with a host and an operator foot; one shell and the operator mails plain text);
THE BRAND (staged after ONE SHELL: bare with the rose button, as today; ink only, the button in the brand's ink; a raster
wordmark at the head; the marketing chrome, aurora and all); THE SENDER (`Partyreel <noreply@>` for everything, as today;
a person for host mail, "Will at Partyreel", with a reply that reaches someone; operator alerts tagged in the subject);
THE FOOT (one line, as today; an unsubscribe and a postal address on the commercial-leaning mails only, the renewal and
the over-cap trio; on every mail); THE CODE (the sign-in mail as a labelled mock of what the dashboard template could be:
six digits large and alone; the digits with a button beneath; the button alone); THE MOMENTS (which moments deserve a
mail: today's ten, none to a guest; the four dormant switches' mails shipped, drawn; the switches retired); THE GUEST'S
(staged after THE MOMENTS: nothing, as today; a receipt carrying the album link when a guest leaves an address; the
receipt and one "your photographs are in" after the party). Optional if it fits the budget: THE DARK INBOX (staged after
THE BRAND: the shell as it inverts in a dark inbox today, unknown; a shell that declares light; a shell drawn for both).
The plain-text twin, the renewal button's destination and the untested `sendOnce` are Deferred lines, not decisions.

**Binds.** The bible; the copy rulings (no em-dashes; the copy is open, bible 21); the voice rulings as precedent; the
lifecycle doctrine (tier-one mail has no switch: sign-in, billing, storage and deletion warnings); the never-send rule
(a preview never imports `send.ts` or `client.ts`; `templates.ts` is safe to import from a client file); the email
medium's own constraints (inline styles, tables where a client needs them, an image needs a raster); reduced motion is
moot but the inbox mock honours it. Mobbin is encouraged, never required: transactional email, receipts, codes, "your
photos are ready" mails.

## Verify, and the gate

- Each step its own exit code: `pnpm design:rules`, the specimen collector, `pnpm typecheck`, `pnpm lint` (the 8
  known warnings), `pnpm test`, `pnpm build`, `pnpm lab:smoke --base http://localhost:3135`,
  `pnpm lab:demo --board emails` (0 failing), with `DESIGN_PREVIEW_KEY` in the environment, never on a command line.
- Every option at 375 and 1440 as rendered templates with fixture options, nothing sent; a capture of every option
  beside its words, the picture checked against the words; the reading budget.

## Questions (what the goal leaves open; a recommended answer each; the Orchestrator relays them and quotes the answer back)

- Will is away this whole round: none escalated. Every open call carries its own recommendation and `because`/`overrule`
  reasoning inside `spec.ts` itself (the mechanism `defineExploration` exists for); nothing here rose to a product
  ambiguity that needed a tie broken outside the board.

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none: this round owns no `docs/systems/` facts and ships no production byte, so nothing there is stale yet.

## Deferred (ROADMAP one-liners, bucket named)

- Bucket: Now. From `emails` (2026-09-19, the lab): all ten shipped mails are HTML-only, no `text/plain` twin (a
  deliverability gap `sendOnce` doesn't address); the fix is additive (a `text` string beside each `html`) and
  orthogonal to every decision on this board.
- Bucket: Now. From `emails`: `sendOnce`'s claim-then-send dedupe (the whole anti-double-send guarantee) has no direct
  test (`send.ts`'s own header says so); a rolled-back Supabase-MCP check or a mocked-Resend Vitest would close it.
- Bucket: Now. From `emails`: `docs/PRICING.md`'s "Follow-up (code)" line says the Resend-code button has no cooldown;
  `email-sign-in.tsx` already ships one (`RESEND_COOLDOWN_S`, `resendIn`, the countdown label): the doc line is stale
  and should be deleted, not built.
- (The renewal nudge's "Renew Event Pass" button linking `/dashboard` and the notification card's four dormant
  switches are already on the ROADMAP's "Now" bucket under the overnight round's line; this board's `foot` and
  `moments` decisions answer them, so the wiring round is what actually closes those two, not a fresh Deferred line.)

## Handoff (replaces the chat report)

- Head `cbd518a1` (the code; this manifest fill-in is one small commit on top of it, pushed together), synced with
  launch-prep at `9f976f7c` (it moved by one commit, `docs/tracks/orchestrator.md` only, a fast-forward merge; the
  gate re-ran clean after).
- Gates on the synced tree: typecheck ok, lint ok (8 known warnings, 0 new), test ok (2533), build ok (254 pages);
  `pnpm lab:smoke --base http://localhost:3135` ok (373 checks, 0 failing; `emails` reads 514/1200 words);
  `pnpm lab:demo --base http://localhost:3135 --board emails` ok (8 steps, 0 failing, every step's options measured
  as visibly different, no CLIPPED/UNLABELLED/NO DOCK).
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = `src/app/(dev)/design/sandbox/emails/*` (owned) +
  the three registration files (`registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts`, one line each at the head
  per the registration exception) + `docs/design/library.md` (regenerated by `pnpm design:rules`, committed as the
  generator wrote it) + this manifest. No exceptions outside what the boot brief allowed.
- The decisions, one line each:
  - `shell`: should every Partyreel email share one wrapper?; two wrappers as today / one wrapper, two feet / operator
    mail goes plain text; recommended **one wrapper, two feet**.
  - `brand` (after `shell`): how should the shell carry the brand?; bare with the rose button / ink only / the
    wordmark at the head / the wordmark and the aurora; recommended **the wordmark at the head**.
  - `sender`: who should a Partyreel email say it's from?; noreply as today / a person for host mail / operator
    subjects tagged; recommended **operator subjects, tagged**.
  - `foot`: should every email carry an unsubscribe and an address?; one line as today / on the commercial-leaning
    four / on every mail; recommended **on the commercial-leaning four**.
  - `code`: what should the sign-in mail show first? (a labelled mock; the real template is a Supabase dashboard
    asset, out of the repo); six digits alone / digits and a button beneath / the button alone; recommended
    **digits, and a button beneath**.
  - `moments`: which moments should actually send a mail?; today's ten, switches stay / build the four dormant
    mails / retire the four switches; recommended **retire the four switches**.
  - `guest` (after `moments`): should a guest ever get a mail from Partyreel?; nothing as today / the album link,
    once / the link and one after the party; recommended **the album link, once**.
  - `dark` (after `brand`, the optional eighth): how should the shell read in a dark inbox?; undeclared as today /
    declares light / drawn for both; recommended **declares light**.
- Assets requested from Will: none (the brand ladder's wordmark option reuses the existing inline SVG,
  `src/lib/brand/wordmark.ts`; no new raster or generated asset needed).
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Look at first: `brand`, then `dark`. `brand` is the cheapest real fix on the board (the rose CTA is an
  off-brand colour nothing else in the product uses; the wordmark option costs zero new assets). `dark` is the
  one genuine bug this round found rather than designed around: today's shell declares a text colour and no
  background, so a dark-mode inbox client renders the real copy as near-black text on its own dark ground,
  effectively illegible: drawn side by side with a light pane so the difference reads at a glance.

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). Round one of `emails` asked eight decisions on the ten real
`templates.ts` functions, drawn inside a built inbox mock at a phone's width and a laptop's: one shell or two and
what it wears, who it's from, an unsubscribe, what the out-of-repo sign-in mail could show, which moments deserve
to exist, whether a guest is ever one, and the shell in a dark inbox. `shell`/`brand`/`dark` re-skin the real
extracted heading/body/button/footer; the rest call the real functions unmodified. Found along the way: the mock's
own chrome was theme-token-based and went illegible in the app's dark mode (fixed), and `shell`'s first two options
measured as the same picture until the operator's envelope became three real states (fixed). Recommendations:
one wrapper (two feet); the wordmark at the head; operator subjects tagged; the foot on the commercial-leaning
four; digits with a button beneath; retire the four dormant switches; the album link once; the shell declares
light. Three Deferred lines; no Questions, assets or System-doc edits.
