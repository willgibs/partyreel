---
track: emails
status: open            # open -> handed-off; deleted in the merge commit that integrates it
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

- none yet

## System-doc edits (in place, owned facts only; the Orchestrator reads each by eye)

- none yet

## Deferred (ROADMAP one-liners, bucket named)

- none yet

## Handoff (replaces the chat report)

- Head <sha>, pushed; synced with launch-prep at <sha> (or: it had not moved)
- Gates on the synced tree: typecheck ok, lint ok, test ok (N), build ok (M pages); `pnpm lab:smoke` ok; `pnpm lab:demo --board emails` ok
- Lane check: `git diff --name-only origin/launch-prep...HEAD` = owned paths + this file (exceptions and why)
- The decisions, one line each: `<id>: the question; the options; the recommendation`
- Assets requested from Will: none, or one per line: `what · spec (size, grade, count, format) · replaces <stand-in id>`
- Proposed migrations / Worker / Vercel / Stripe / env changes: none
- Look at first: ...

## Record (one paragraph, past tense, at most eight lines; the Orchestrator fills the merge SHA)

Merged into `launch-prep` at `<sha>` (<date>). ...
