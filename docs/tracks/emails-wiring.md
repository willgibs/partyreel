---
track: emails-wiring
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "62938ef6"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - src/lib/email/
  - src/lib/lifecycle/sweeps/passes.ts
  - src/components/app/notification-prefs-form.tsx
  - src/components/app/notification-prefs-form.test.tsx
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
  - scripts/build-email-wordmark.mjs
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
  checkout route, untouched) and hands a signed-in holder to Stripe in one tap; a refusal shows the route's own
  sentence, led by the button it points to (an ended pass: See plans; Pro: Open your plan). Overrule: link
  `/account#plan` (the Plan card, first on the page, its Renew one tap away) and build no page.
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

- `docs/systems/lifecycle-recovery.md`: "Renewal" (the switch, read through `resolveNotificationPrefs` before any
  send; a failed read stops the sweep; the button opens `/account/renew`) and "Sending email" (`sendOnce` takes
  `text`; the one shell: light only, the hosted wordmark on its plate and its rebuild script, the foot, no address,
  the renewal nudge's unsubscribe, the operator tag).
- `docs/systems/profiles-social.md`: "Email preferences follow the consent tiers" (one send has a switch, the renewal
  nudge's; the card draws only live switches; the three columns nothing reads wait on Will's yes; "No send path
  reads them" retired).

## Deferred (ROADMAP one-liners, bucket named)

- Emails: the reduced mail says "You're over your limit, so upgrade or free up space first, then restore them" just
  after saying the removal brought the account back under its plan; it means a restore would put it over again, and
  its words could say so (this round kept every body word as it was).
- Emails: the renewal nudge's unsubscribe opens a signed-in switch; a one-click `List-Unsubscribe` header (RFC 8058)
  waits for the newsletter's first send, which needs one anyway.

## Handoff (replaces the chat report)

- **Commits, all pushed on `lp/emails-wiring`:** `376c9468` owns and questions; `ae90e9ae` the retirement alone;
  `c9c2f54e` the work; `266c6a40` the sync (merge of `origin/launch-prep` at `bf3bbdac`: help, export and
  triage-wiring; no conflict, their retirements beside this one auto-merged); `6463f9c6` the grant guard; this
  manifest is the head. `launch-prep` had not moved again at the handoff.
- **Gates on the synced tree, each on its own exit code** (logs in `../partyreel-wt/_scratch/emails-wiring/`):
  `pnpm typecheck` 0 and `pnpm lint` 0 (0 errors; 4 warnings, all in three files this lane never touched:
  `review-session.tsx`, `contact-form.tsx`, `album-fill-grid.tsx`) and `pnpm test` 0 (551 files, 6272 tests) on
  `6463f9c6`; `zsh scripts/build-lock.sh pnpm build` 0 (`/account/renew` dynamic) and
  `pnpm lab:smoke --base http://localhost:3133` 0 (194 checks, 0 failing) on `266c6a40`, which differs from
  `6463f9c6` by one test file.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD`): the owned paths, this file, the two system docs
  above, and the retirement's named exceptions (`sandbox/registry.ts`, `(shell)/lab/boards.ts`, `touchpoints.ts`:
  the emails board's own lines, nothing else).
- **The items:**
  - One shell: `composeMail` (`src/lib/email/templates.ts`) renders all ten; the four operator alerts wear the host
    card at 560; only the foot's words differ.
  - The text twin: every template returns `{ subject, html, text }` from the same parts; `SendOnceArgs.text` is
    required and sent (`send.ts`), so Resend never writes its own; the six callers pass it, one line each.
  - The wordmark: `public/email/wordmark-v1.png` (244x76, 2,944 bytes), the kit's own path in ink on a white plate
    (8px padding and corner), at `https://partyreel.com/email/wordmark-v1.png` (`SITE_URL`: a mail outlives every
    deployment), width, height and alt set; `scripts/build-email-wordmark.mjs` rebuilds it (sharp through Next, no
    new package); `templates.test.ts` pins its pixels to twice the declared size.
  - The doc-check (caniemail, tested 2026-09-16): linked SVG still fails in Outlook for Windows through 2016 and
    Outlook for Mac 2016 (Gmail now rasterises it), so the PNG stands; Gmail's iOS and Android apps now honour
    `color-scheme` for the one value `light only`, as Apple Mail does; Outlook does not.
  - Light only: the meta pair and the `:root` CSS as `light only`; a #ffffff card on the mat (#f2f2f7), ink #101010
    (`BRAND_HEX`), the foot #57575d (7.2:1), the divider #dadadf. The button's ink border is invisible in light and
    keeps the button's edge when a client recolours.
  - The inbox preview: a hidden preheader carries each host mail's first line (the form's own message for contact and
    careers), so no inbox opens on the wordmark's name; iOS's date links render as the text around them.
  - Tagged: all four operator subjects start `[Partyreel]` (`OPERATOR_TAG`; contact and careers gained it).
  - The foot: a divider and one reason line per host mail (the Questions' words), each operator alert's own line; no
    postal address on any mail (tested against street, box and ZIP shapes); the renewal nudge alone carries
    "Unsubscribe from Event Pass reminders", to `/account#event-pass-reminders` (`src/lib/email/links.ts`).
  - The switch: `notification_prefs.notify_pass_renewal`, `notifyPassRenewal` (default on), written by
    `setNotificationPrefs`, read through one select list (`NOTIFICATION_PREF_COLUMNS`); the parity test counts added
    columns and now pins the card's insert and update grants.
  - The sweep: `renewal_nudges` reads its candidates' switches (chunked, through `resolveNotificationPrefs`) before
    any send, skips and counts the ones turned off (`opted_out` on its tally), and a failed read throws before any
    send (`passes.test.ts`).
  - The three dead switches left Email preferences; nothing reads or writes their columns now (`UNREAD` in the parity
    test), so their drop needs no code change first. The card's rows stack the hint under the name (Label is a flex
    row, which wrapped the name into a three-line column at 375), as `profile-social-card.tsx` draws the pair.
  - Renew goes where it says: `/account/renew` posts the Plan card's own renewal body once (a ref holds a doubled
    effect) and leaves for Stripe with `location.replace`, so Back returns to the mail; a refusal shows the route's
    sentence, a failure offers Try again, a signed-out visit goes to `/login` (`renew-checkout.test.tsx`).
  - `content/help/notifications-and-emails.mdx` names the switch and the one mail it turns off.
  - The visual pass (`../partyreel-wt/_scratch/emails-wiring/`): the ten as files (`mails/*.html`, `*.txt`) and 120
    captures at 375 and 1440 in six readings (`shots/`; contact sheets `sheet-*.png`): no horizontal overflow; the
    wordmark loads; `prefers-color-scheme: dark` and Chrome's forced dark with the declarations kept are
    byte-identical to light; with the declarations stripped (a recolouring client) and under a full invert, every
    word, button, divider and the wordmark stay legible; with images blocked the alt "Partyreel" holds the head.
    The renew page's four states and the card at 375 and 1440, light and dark (`ui/*.png`).
  - The SQL: the migration proved on the live schema in one rolled-back `execute_sql`, 17/17 (`proof.sql`,
    `proof-result.txt`: the grants, anon's nothing, the lazy insert, RLS on another account's row, `user_id` still
    un-updatable, the sweep's read); afterwards the column is absent and the table still empty.
  - Nothing new sends, and nothing was sent to any inbox.
- **Assets requested from Will:** none (the wordmark is the kit's own mark).
- **Board ideas:** a mail's button through sign-in: every host mail's button lands a signed-out host on the
  dashboard after sign-in (`/login` takes no return path and the `(app)` gate redirects bare), so Renew Event Pass
  and Manage storage only finish for a host already signed in on that browser; the checkout's allow-list
  (`return-path.ts`) is the shape a safe return would reuse.
- **Proposed migrations / Worker / Vercel / Stripe / env changes:** `supabase/migrations/20260928160000_pass_renewal_pref.sql`
  (one column, one additive grant, one comment), applied before a build carrying this lane serves `/account` or runs
  the cron (before it, the card reads the defaults with a `social_schema_missing` capture per read and a save fails
  with its toast, and `renewal_nudges` fails its read and sends nothing, loudly); then regenerate `types.ts`, after
  which the three casts marked "the generated types learn notify_pass_renewal" (`passes.ts`, `queries/social.ts`,
  `mutations/social.ts`) say nothing and can go. No Worker, Vercel, Stripe or env change.
- **Calls his to overrule:** the four Questions above; the card's rows stacked; the hidden preview line; the shell's
  measures (a 560 card, 32 padding and 24 on a phone, heading 20/28, body 15/24, foot 13/20, the mat ground); the
  refusal's button order by reason; the three unread columns no longer read or written (partyreel.com's current
  build still selects them until the milestone ships).
- **Look at first:** build 18's red-team on the alias, signed in through the chooser: `/account` Email preferences
  shows two switches, stacked; Event Pass reminders off, reload, still off; `/account#event-pass-reminders` lands
  on its row; `/account/renew` as willg97 (Pro) says "You're on Pro, which already includes everything a pass adds."
  with Open your plan first, and as hi@willgibs (Free) the ended-pass sentence with See plans first. Then
  `sheet-light-375.png` and `sheet-autodark-375.png`. Until build 18 reaches partyreel.com, a mail the alias sends
  (the contact and careers alerts) shows the wordmark's alt text, since the image lives there; the crons run on
  production only, so no host mail meets it.
