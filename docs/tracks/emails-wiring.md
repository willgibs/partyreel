---
track: emails-wiring
status: open            # open -> handed-off; deleted in the merge commit that integrates it
cut: "62938ef6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/email/
  - src/lib/lifecycle/sweeps/passes.ts
  - src/components/app/notification-prefs-form.tsx
  - src/lib/social/notification-prefs
  - src/lib/db/mutations/social.ts
  - public/email/
  - supabase/migrations/20260928160000_pass_renewal_pref.sql
  - src/app/(dev)/design/sandbox/emails/
  - src/lib/lifecycle/sweeps/passes.test.ts
  - src/lib/lifecycle/sweeps/inactivity.ts
  - src/lib/lifecycle/sweeps/over-capacity.ts
  - src/lib/lifecycle/sweeps/orphans.ts
  - src/app/(marketing)/(cinema)/careers/actions.ts
  - src/app/(marketing)/(paper)/contact/actions.ts
  - src/app/api/internal/backup-prune/route.ts
  - src/lib/db/queries/social.ts
  - src/app/(app)/account/renew/
  - src/components/app/renew-checkout
  - content/help/notifications-and-emails.mdx
reads:                  # single-sources you depend on: never duplicate, never edit
  - docs/reviews/emails.json
  - docs/systems/lifecycle-recovery.md
  - docs/systems/profiles-social.md
  - docs/systems/database-security.md
---

# lp/emails-wiring

**Goal.** Build Will's `emails` r1 answers on the ten mails that already send (one shell, the wordmark, light only, every operator subject tagged, a foot under a divider with no address, a plain-text twin), retire the three switches for mail nothing sends, and add no new send; then retire the emails board.

## The brief

**His answers** (`docs/reviews/emails.json`, each note there in full; the drawings in `src/app/(dev)/design/sandbox/emails/`, where every option is the real `templates.ts` function):
- `shell=unified`: one `layout()` for all ten; the four operator alerts move onto it, and only the foot differs (host or operator).
- `brand=wordmark`: the wordmark at the head, and the button leaves the rose (`#e11d48`) for the brand's ink, as the board drew it. Gmail and Outlook render no SVG in mail, so the wordmark is a hosted PNG made from `kit/logo/` (2x for mail, width and height set, alt "Partyreel"), at an absolute URL that resolves from every deploy that sends. Doc-check the clients' support (caniemail) before choosing.
- `dark=light`: declare light (the `color-scheme` and `supported-color-schemes` meta and CSS) on an explicit white card. His note: "less opportunity for error as well (such as mismatched theme styles)". Gmail's apps and Outlook invert anyway, so choose colours that survive a forced invert, and set the wordmark on its own light plate: black ink on a transparent PNG vanishes on an inverted ground.
- `sender=tagged`: every operator subject carries "[Partyreel]" (two of the four do today); host mail stays "Partyreel <noreply@partyreel.com>". His note adds a third voice, "Will @ Partyreel", for newsletters and updates: banked with the newsletter, nothing to build.
- `foot=commercial`, as his note refines it ("Can we remove the address for now, or is that a legal thing? If so, lets replace the address with the 'you're receiving this because...' note under the divider"):
  - No postal address on any mail. US CAN-SPAM asks for one only on marketing mail, and all ten are account or service mail.
  - Every host mail's foot is a divider, then a "You're receiving this because..." line true to that mail.
  - The unsubscribe goes on the renewal nudge alone: a link to a new Email preferences switch ("Event Pass reminders"). Its column is a migration you write and the Orchestrator applies (host writes are column-locked), and `passes.ts` honours it.
  - The over-cap three keep only the reason line: they warn before files are removed (largest first), so a switch there could let a host lose photos unwarned. This is the Orchestrator's call, and Will's to overrule.
  - Keep each over-cap subject and first line about the account's state, the upgrade second, so each mail stays informational.
- `moments=identity`: the three switches for mail no code path sends leave Email preferences: An album you joined was shared, New uploads to your events, Someone followed you. Their columns stay, since dropping them is destructive and asked of Will later.
- His note on `moments`: "I want to target emails in a later exploration once we feel more final on all features rather than allow them to start sending everywhere ... Really want to be good about our email policy from the start so we never hit spam." So nothing new sends. The identity mail, `guest=link`, `letin=left`, `reporter=note` and `code=promise` are banked in ROADMAP by the Orchestrator; build none of them.
- Two ROADMAP lines ride along:
  - a `text/plain` twin beside every `html`, from the same parts, sent by `send.ts`;
  - the renewal nudge's "Renew Event Pass" goes where it says: it links `/dashboard` today (`passes.ts:176`), not the pass's checkout.

**Paths:** the templates' other callers (the other sweeps in `src/lib/lifecycle/sweeps/`, the contact and careers actions, `src/app/api/internal/backup-prune/route.ts`) change only if a signature must. Add any path to `owns` before editing it.

**Then retire `emails`** in one commit: its folder and its lines in `registry.ts`, `boards.ts` and `touchpoints.ts` (named exceptions). The ledger is the Orchestrator's.

**Verify:**
- Vitest: every template's html and text through the shell, each foot, the tag on all four operator subjects, no address anywhere, the renewal switch honoured by the sweep.
- A rolled-back SQL check on the new column's grants.
- Each of the ten rendered to a local file and looked at in a light and a dark reading (`prefers-color-scheme: dark`, then a forced invert), at 375 and 1440.
- Send nothing to a real inbox.
- `pnpm lab:smoke` whole.

**Starts from.** CLAUDE.md's working loop, the bible's ten and production as it is; the tests say what has to keep
working.

**Verify on.** The gate on the synced tree (CLAUDE.md's four steps), each step on its own exit code; `pnpm lab:smoke --base http://localhost:<port>` whole when the lane changes anything under `src/` but tests (the Library renders the product's components); and the surfaces the Handoff is judged on, local and live.

## Questions (a recommended answer each; the Orchestrator relays them)

- **Where does the renewal nudge's Renew Event Pass land?** A mail link cannot POST, and the renewal Checkout is a
  POST. Built: `/account/renew`, a page that starts the same renewal the Plan card's Renew starts (the existing
  checkout route, untouched) and hands a signed-in holder to Stripe in one tap; a refusal (the pass ended, the account
  is on Pro) shows the route's own sentence with a way on. Overrule: link `/account#plan` (the Plan card, first on the
  page, its Renew one tap away) and build no page.
- **The foot's reason line, per host mail.** Built, one true to each: the over-cap three "...because your Partyreel
  account is over its storage limit" / "...is still over..." / "...because we removed files from your Partyreel
  account"; the renewal nudge "...because you hold a Partyreel Event Pass." with the unsubscribe; the inactivity pair
  "...because you host <event> on Partyreel's Free plan" / "...because <event> was removed from your Partyreel
  account". Overrule: one line for all six ("...because you have a Partyreel account").
- **The unsubscribe's words and landing.** Built: "Unsubscribe from Event Pass reminders", landing on the switch
  (`/account#event-pass-reminders`, sign-in first when signed out), not a one-click unsubscribe. Overrule: a signed
  one-click link (a token route), banked with the newsletter's first send.
- **Who sees the Event Pass reminders switch.** Built: every account (a Free host may buy a pass later, and the row
  costs nothing). Overrule: pass holders only.

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
