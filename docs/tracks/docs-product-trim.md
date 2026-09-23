---
track: docs-product-trim
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "adbb90e0"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/PRD.md
  - docs/PRICING.md
  - content/blog/AUTHORING.md
  - content/help/AUTHORING.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/constants/tiers.ts
  - docs/systems/billing-caps.md
---

# lp/docs-product-trim

**Goal.** `docs/PRD.md`, `docs/PRICING.md` and the two content authoring guides state current truth in the present tense: no dates, rounds, "ruled" or "built" provenance, cut numbers or narratives; every number and claim checked against the code; the pricing doc gains Pro's case. A docs-only lane: no behaviour changes.

## The brief

**Will's words for this (2026-09-22):** "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight that distills future-facing efforts. It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'." The four reshape lanes already did this for the ROADMAP, ASSETS, the system docs and the rulings log; these four files were outside them.

**The rule:** a doc states the current rule, fact or state in the present tense, with at most a one-line why. Delete dates ("locked 2026-05-29"), provenance ("ruled + BUILT", "Will's decision"), phase and cut labels ("Phase 3", "Cut 4b"), and narratives; a stale line is deleted, never marked. Keep every heading that another doc or the code links to (`git grep -n "PRICING.md#\|PRD.md#" -- src docs content CLAUDE.md` before renaming anything) and every fact an agent needs (the tier table, the caps, the Stripe price table with its env keys, the grandfathering policy stated as policy, the unit economics).

**Verify every number and claim** against `src/lib/constants/tiers.ts` (the single source of pricing and limits; `public.tier_limits()` mirrors it) and the code it names; a claim the code contradicts is corrected to the code, and listed in the Handoff.

**Pro's case, a new line in `PRICING.md`'s model section (from the rulings the docs-rules lane distilled):** "Pro's case is what one big event needs (videos, more storage, the longer reel), never only hosting again: most paid hosts hold one event, a wedding above all, so a line that sells Pro as 'for your next event' loses them."

**Leave the reel's lines alone** in both docs (PRD step 5, PRICING's watermark and reel-length lines): they describe what ships until the reel round's wiring replaces the stored reel, and that round's sweep lane rewrites them. `content/help/` and `content/blog/` articles are not yours; only the two `AUTHORING.md` guides.

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm test` (the content and docs policies), `pnpm lint`; no build needed for a docs-only lane. The Handoff lists every line changed for a fact (what the doc said, what the code says) and every heading kept for a link.

## Questions (a recommended answer each; the Orchestrator relays them)

Each was taken as recommended and built; none is a one-way door.

- **The reel's lines in the two authoring guides** (the Studio and panel house terms, "no music in the reel", the free reel's mark, the reel bullet, `<ReelSeconds>` / `<ReelStyleCount />`): recommended and taken, left alone like the PRD's and PRICING's, for the reel round's sweep lane.
- **PRICING's ≈ column**: recommended and taken, kept and set to `formatCapacity`'s exact output (the site's own phrase) rather than dropped.
- **The Supabase SMTP runbook**: recommended and taken, kept in PRICING.md (`assertResendEnv()`'s error sends a reader there) and trimmed to the settings, the rate limit and the quota; the alternative is a move to `auth-accounts.md` with `env.ts`'s pointer changed, which is outside this lane.
- **PRICING's over-capacity and Event Pass provisioning paragraphs**: recommended and taken, removed (the PRD and `lifecycle-recovery.md` hold the lifecycle, `billing-caps.md` the ledger mechanics); PRICING keeps the setup facts and a pointer.
- **The PRD's "Planned: co-hosts, invite-only guests"**: recommended and taken, deleted (the ROADMAP keeps speculative ideas outside the docs); the one-owner fact (`events.host_id`, the billing and storage anchor) stays.
- **The blog guide's ratified metadata line**: recommended and taken, the shipped "Location data is stripped in the browser before a photo ever uploads, for the common formats." replaces the old EXIF line.
- **The bin's word in the blog guide**: recommended and taken, the guide states the split ("Deleted", the app's word; the marketing pages and posts say "the Trash") and a Deferred line asks for one word; the help guide keeps "Deleted".
- **Numbers in help descriptions**: recommended and taken, rule 4 says a description cannot hold a component, so leave the number out where the answer survives and match the constant exactly where it cannot (rather than banning numbers there; ten articles carry one).
- **The ingress meter's admin view and override**: recommended and taken, PRICING states they do not exist (the posture stays as the why) and a Deferred line carries the build.
- **"Test → Live cutover (reference guide)"**: recommended and taken, renamed "Test to live cutover" so `.env.example:41`'s quoted "Test to live" names it exactly.

## System-doc edits (in place, owned facts only)

- none (two stale lines in `systems-trim`'s files are listed in the Handoff instead)

## Deferred (ROADMAP one-liners, bucket named)

- Now: Pricing: `/pricing` and `llms.txt` sell the public host page as paid (`comparison-table.tsx` "Public host page" off on Free, `unlock-grid.tsx` "Free hosts stay unlisted.", `plan-cards.tsx`, `pass-card.tsx`, `llms.ts`), while a handle and "Show on my profile" are free on every plan (`profile-slug-control.tsx`; no tier check in `setProfileSlug` or `setEventSocialSettings`); redraw the paid list.
- Now: Copy: one word for the bin: the app's filters, storage meter and lifecycle emails say "Deleted", the delete-event dialog "Trash" (`danger-zone-section.tsx`), the create wizard "the bin" (`create-event-wizard.tsx`), the marketing pages and blog posts "the Trash", legal "recovery bin"; the help guide allows only "Deleted".
- Now: Copy: the "no expiry" durability lines (`constants/about.ts` "Albums do not expire…", the privacy page's `media-lives.tsx` "The album stays up until you delete it.") leave out the Free-plan inactivity removal that the help guide's rule 7 reconciles.
- Now: Help: ten article descriptions type a marketed number no spec component can reach in frontmatter (`hide-remove-and-restore`, `how-long-media-is-kept`, `moderate-and-curate-your-album`, `password-protect-your-event`, `what-happens-when-storage-fills-up`, `turn-off-uploads-or-cap-file-size`, `what-the-free-plan-includes`, `how-long-an-event-pass-lasts`, `pro-vs-event-pass`, `what-you-can-upload`): a test tying each to its constant, or the number out of the description.
- Now: Help: `hide-remove-and-restore.mdx` says Remove is "permanently deleted after a short grace period" beside its own 30 days in Deleted.
- Now: Stale comments: `spec-shared.tsx`'s Steps header ("the mono numeral rail", "mono BY RULING"; the numerals are the UI face's tabular figures, bible 7), `help/page.tsx` ("nine categories"), `blog-tags.ts:6` ("one of each at most"; two purposes are legal).
- Launch checkpoint: The monthly ingress meter's operator surface `[eng]`: nothing in `/admin` shows a host's meter and nothing can lift it, while PRICING.md's posture is that a false positive must never quietly block a paying host; beside the multiplier revisit.

## Handoff (replaces the chat report)

- **Commits:** the work `f839e3c4`; the sync merges `d611efbd`, `09ae503a` and `88239463` (launch-prep moved three times during the lane; the last is the tree the gates ran on). All pushed with this manifest; the head is in the chat line.
- **Gates on `88239463`**, each its own exit code (logs in the scratchpad, `i1` to `i7`): `pnpm design:rules` 0 (no diff); `collect-specimens.mjs` 0 (no diff); `pnpm typecheck` 0; `pnpm lint` 0 (9 warnings, none in a lane file: the lane touches only Markdown); `pnpm test` 0 (350 files, 3,867 passed, 1 skipped); `pnpm build` 0; `pnpm lab:smoke --base http://localhost:3131` 0 (487 checks, 0 failing; a dummy key from the environment, port killed after). No `lab:demo`: no board.
- **Lane check** (`git diff --name-only origin/launch-prep...HEAD` at `88239463`), plus this manifest in the handoff commit:
  `content/blog/AUTHORING.md` · `content/help/AUTHORING.md` · `docs/PRD.md` · `docs/PRICING.md`
- **How the claims were checked:** the code by path (below); two read-only verification agents swept the authoring guides and every finding acted on was re-read by hand; Stripe TEST read through the Stripe MCP (`list_available_accounts_or_orgs`, `GetPrices`, `GetWebhookEndpoints`, `GetBillingPortalConfigurations`); `.env.local`'s eight price ids compared to the table without printing them; Cloudflare's R2 pricing page, Supabase's SMTP and rate-limit docs, Stripe's customer-balance and portal docs, and Resend's pricing (Context7).

**PRD.md, the lines changed for a fact (the doc said → the code says):**

- Vision and Guest: a guest "has no account, only a display name (a verified email when the host requires one)" → Require verified emails ships on (`require_verified_email default true`, migration `20260921150000`); a confirmed email is the account; a typed name wears "Unverified" (`guest-flow.md` "Joining + identity").
- "Planned: co-hosts … invite-only guests by email" → neither exists; deleted, the one-owner fact kept.
- Core loop: added the paid custom link, the in-browser metadata strip (`media/strip-metadata.ts`), Review for `hold_for_approval` (`uploads-section.tsx:144`), "Start for free" as the signed-out header link (`guest-header.tsx:214`), the post-upload offer as the capture flow (`save-account-prompt.tsx`).
- "surfaced only as a soft "you've hit this month's upload limit"" → the refusals read "You've hit this plan's upload limit for the month." (`api/host/r2/presign-upload/route.ts:57`) and "This album has hit its upload limit for the month." (`api/r2/presign-upload/route.ts:119`); reworded without a quote.
- "No watermarks; a clean growth badge on shared albums is a later design" → no badge exists; the future clause dropped and the line narrowed to uploads and the album (the free reel's mark stays in PRICING's untouched line).
- Upgrade triggers "a second event, or outgrowing the first one's storage" → the in-app triggers are video, password, custom link and room (`components/app/pricing/triggers.ts`); Free is photos-only (`videosAllowedForTier`); Pro is monthly or yearly; passes stack.
- Over capacity "a ~30-day in-app grace" → `OVER_CAP_GRACE_DAYS = 45`, with a start email and a reminder `OVER_CAP_REMINDER_DAYS = 7` before its end (`lifecycle/over-cap.ts`, `email/templates.ts`).
- The tail "~60 days recoverable behind the scenes with an emailed download link" → `RECENTLY_DELETED_WINDOW_DAYS = 30`, restored by the host from Deleted; the system-removal emails name the date and link the dashboard (`templates.ts:72,116`), a host's own delete is never emailed; the standby budget added (`RECENTLY_DELETED_BUDGET_MULTIPLIER = 1`, oldest first); inactivity counts edits and uploads too (`inactivity.ts`).
- "report it or an item anonymously … at `/admin`" → the album's report sheet sends the event only (`guest/report-dialog.tsx` posts `qr_token` and a reason; nothing sends `media_id`); a signed-in member reports a person (`social/profile-actions-menu.tsx`); the queue is `/admin/reports` on `admin.partyreel.com`.
- "proactive hash-matching is a later stage" → dropped (the ROADMAP carries the scanning items); the access line's dated em-dash clause and "(Pro / Event Pass)" → visibility (password on a paid plan), Require verified emails (free, on), Require an upload to view (free, off, fails open: migration `20260922003000`).
- "One domain, one app" → the ops portal is a second deployment on `admin.partyreel.com` (`architecture.md` "One tree, two deployments"); "guest galleries render on an always-dark surface" → the app follows the system theme (next-themes, `app/layout.tsx`) and no guest component paints the always-dark `--gallery` well.

**PRICING.md, the lines changed for a fact:**

- The header's dated narrative → a ROLE header; the PRD's sections cited by their real headings ("Monetization and anti-abuse (the why behind the schema)", "Data retention and lifecycle"; the doc called them "Monetization & anti-abuse" and "Data retention & lifecycle").
- "Prices live in Stripe … so they change without a deploy" → an env change needs a redeploy (the doc's own cutover step 5) and the labels are code (`Plan.priceLabel`, "Display only").
- Pro's case added to Model, verbatim from the brief.
- Ingress "a MULTIPLIER of the effective storage cap" → paid plans only; Free is a flat 20 GB (`MONTHLY_INGRESS_BYTES.free`). "it carries admin visibility plus a manual override" → neither exists (nothing under `src/app/admin` reads `storage_ledger` or an ingress figure; no override column in `types.ts`).
- The per-file limit's "old 5-min/2-GB/50-MB trio … this doc had drifted" → deleted; a host's lower per-event cap added (`events.max_upload_bytes`, `UPLOAD_CAP_PRESETS` in `limits.ts`).
- The ≈ column "~500 photos; ~25k / ~10 hrs; ~125k / ~50 hrs; ~500k / ~200 hrs; ~19k / ~8.5 hrs" → `formatCapacity`: 512 photos; 25,600 / 11 hours; 128,000 / 57 hours; 524,288 / 233 hours; 19,200 / 9 hours. The pass's events "1 per pass/~1yr" → "1 per pass, each for a year" (`termDays: 365`).
- The annual why "~$372/yr" → $0.015 × 2,048 GB × 12 = $368.64, against $374.40 at 20% off.
- "video is Pro-only" → paid-only, Pro and the Event Pass (`videosAllowedForTier = tier !== "free"`).
- "any signed-in visitor can save an event" → `save_event` refuses a private event and your own (`save-event-button.tsx`).
- The renewal paragraph folded into Event Pass economics, checked: "Renew Event Pass" (`storage-meter.tsx:136`, `templates.ts:87`), the 14-day nudge (`RENEWAL_NUDGE_DAYS`), `EVENT_PASS_RENEWAL_PRICE_LABEL` on the pass card, table and FAQ.
- Over-capacity retention "into the Phase-3 7-day removed tail" → the tail is 30 days; the paragraph deleted (the lifecycle lives in the PRD).
- Grandfathering "(policy, ruled — not yet built)" → the policy stated, and "Unbuilt: `planForPriceId` maps one Price ID per plan" (`stripe/plans.ts`).
- Cold storage "evaluated + rejected (2026-05-29)" → present tense under Unit economics; R2's prices re-checked (Standard $0.015, IA $0.01, retrieval $0.01/GB, 30-day minimum, free egress); the reason restated (one restore's $0.01/GB outweighs the $0.005/GB-month saving).
- The catalog "re-verified against the test account 2026-09-02" → re-read by `GetPrices`: 8 active prices whose amounts and intervals match the table; the Pro names still carry the em-dash.
- The mode caveat "no per-call mode flag … `retrieve_balance` → `livemode`" (and cutover step 1) → `list_available_accounts_or_orgs` → `livemode` (false; the account is `acct_1TcStrPtjqmVkBwk`), and every call names a matching `livemode`; step 2's `create_product` / `create_price` made tool-agnostic.
- Webhook: added that the route acts on four of the five events (`webhook/route.ts` handles `checkout.session.completed` and `resolveSubscriptionUpdate`'s three; `invoice.payment_failed` falls through; `past_due` keeps Pro, `provision.ts` `ACTIVE_STATUSES`) and the temporary launch-prep endpoint (`we_1U1I3GPtjqmVkBwkjUqWGpvR`, in ROADMAP's teardown), both read by `GetWebhookEndpoints`.
- Portal: added cancellation at period end (`bpc_1TcTxWPtjqmVkBwkcAldFEZA`: `subscription_cancel.mode: at_period_end`, `subscription_update.proration_behavior: always_invoice`).
- "Verified in production — test mode (2026-05-29)" → deleted; the Event Pass wiring paragraph trimmed to what the setup needs.
- SMTP: the dated status line and "Follow-up (code): … no cooldown" → `RESEND_COOLDOWN_S = 60` ships (`email-sign-in.tsx:53`); "Keep Email OTP Length = 6" → deleted here (`auth-accounts.md`'s dashboard lockstep holds it); "Dashboard-only (no MCP/API path)" → the Management API's `config/auth` sets SMTP, the MCP does not; added that rotating `RESEND_API_KEY` means updating the SMTP password.
- The rate limit "Set it to ~100/hr … raise to 500–1000/hr at launch" → "sits at 100 an hour" (carried from ROADMAP's launch checkpoint; no agent tool reads the dashboard value), the raise pointed at that checkpoint.

**Headings:** kept for links: PRICING "Grandfathering" (ROADMAP "Billing follow-ons"), "Stripe setup" (ROADMAP's launch checkpoint, `env.ts:245,272`, `stripe/plans.ts:54`), "Test to live cutover" (was "Test → Live cutover (reference guide)"; `.env.example:41` quotes "Test to live"); PRD "Monetization and anti-abuse (the why behind the schema)" and "Data retention and lifecycle" unchanged. `git grep "PRICING.md#\|PRD.md#"` finds no anchor link. Renamed with no inbound link: "Tiers (locked 2026-05-29)", "Stripe setup (Cut 4b)", "Unit economics (sanity check)", "`tiers.ts` — the live source (snapshot removed)", and "Fast-follows — email (Resend) + over-capacity retention + Event Pass renewal" → "Email: Resend and Supabase Auth".

**content/blog/AUTHORING.md, the lines changed for a fact:**

- "(ADR-0006)" → no ADR exists in the tree; the shared pipeline named (`src/lib/content/collection.ts`).
- The example `title:` unquoted around ": " is invalid YAML and fails the build → quoted, as the real post is (`qr-code-for-wedding-photos.mdx:2`).
- description "the card blurb" → only the featured card shows it (`blog-list.tsx:613-615`); tags "paired with a purpose … anything else fails the build" → the schema checks one or two tags, no repeats, at most one audience (`blog.ts:58-74`), and pairing is advice; the hero is the newest post of the unfiltered library.
- author "(Will's ruling, 2026-08-28)" → dropped; updated "Nobody sets it at launch" → present tense.
- "a registered tag with no posts is a test failure" → an empty tag is dropped from the rail (`blog-index.ts:40-43`, pinned by `blog-index.test.ts`).
- The hero "21:9 letterbox" → 21:9 from a small screen up, 4:5 on a phone (`blog-list.tsx:584`); `grep 'id:'` also lists the reel ids `hero-candidate-01/02`, which fail the cover refine (`blog.ts`, `isMarketingImageId`).
- "the same photograph on two posts is at least two different plates" → six crop positions, and two pairs collide today (`best-way-to-share-event-photos` / `how-much-storage-for-event-photos` on `party-balloons` "50% 42%", `guest-upload-kit` / `photo-booth-alternative` on `wedding-toast` "50% 42%", recomputed from `blog-covers.ts`); "Will replaces the whole media set" → present tense.
- Rule 3: the typed-number test scans the title and description too (`blog.test.ts:385-428`); rule 14's FAQ sources gain the feature pages' `*-faq.ts` and `pricing-faq-data.ts`.
- Rule 10's metadata line "EXIF and GPS metadata are stripped in the browser before a photo ever uploads." → the shipped line "Location data is stripped in the browser before a photo ever uploads, for the common formats." (`jsonld.tsx:89`, `home/privacy.tsx:36`, `features.ts:197`, `llms.ts:108`); the old one survives only on `never-rides-along.tsx:27`, which ROADMAP already lists.
- Vocabulary: the ownership pointer "(docs/tracks/README.md)" → each spec file's header; AlbumShowcase "token-drawn" → eight manifest photographs in a browser frame (`spec-shared.tsx:319-373`); "all reading tiers.ts, limits.ts or the lifecycle constants" → `TeaserCount` reads `gallery-access.ts`, `ReelStyleCount` the style registry; the unit rule restated to the code (sizes render with their unit; the help aliases `RecoveryDays` and `UnlockHours` carry theirs).
- The product: "a one-tap code" → a six-digit code with a sign-in link in the same email (`email-sign-in.tsx`); "no password" → a password-locked album asks for its own; "NEVER write anonymous" narrowed (reporting an event is anonymous, `marketing-voice.ts:31-33`); "Originals are stored byte-for-byte" → as uploaded after the in-browser strip; the privacy line → the common-formats line with the formats the strip leaves alone (HEIC, HEIF, AVIF, WebM: `strip-metadata.ts`); the app's visibility labels Public, Password, Private (`visibility-labels.ts`).
- The product: Pro's "a public host page" → a handle and "Show on my profile" are free on every plan (`profile-slug-control.tsx`, `profile-social-card.tsx`); "a Trash window" → the app says "Deleted" (`filters.ts:36`, `events-view.ts:77`, `event-gallery.tsx:164`, `templates.ts:72`); "no host activity" → any activity (`inactivity.ts`); "Likes from anyone" → signed in, a signed-out tap opens the confirm-email step (`likes-provider.tsx`).
- "`docs/PRD.md` is stale; the code wins" → "Where a doc and the code disagree, the code wins"; "the help map lists the planned articles too" → every mapped article is written.

**content/help/AUTHORING.md, the lines changed for a fact:**

- "The help center UI is finished and ruled" → the `help-center` board is open (`sandbox/help-center/spec.ts`, `registry.ts`); "written fresh in the help-catalog round (2026-09-01): 59 articles" → 60 files, and the count is dropped (the map is the list).
- Adding a category: "its strip label and grid column (help/page.tsx)" → `stripLabel` is a registry field (`help.ts`), the grid column is in `help/page.tsx`.
- Keywords: "the related-articles scorer, which now needs at least one shared keyword" → `scoreRelated` is shared keywords × 2 plus 1 for the same category (`help.ts:293-300`; the stricter rule was reverted).
- Rule 4: "add one to `mdx-components.tsx`" → that file only composes the map; help-only components go in `spec-help.tsx`; the description caveat added (`help.test.ts` checks a description's length only).
- Rule 6: "no self-serve account deletion" → it ships (`AccountDeleteCard` on /account, `deleteMyAccountAction`; `your-data-and-deleting-your-account.mdx` documents it); "its three regex lists" → two pattern lists plus the em-dash strings (`content-policy.test.ts`); "Two it names by phrase" → the test names neither, and the reply line is `REPLY_LINE` (`constants/contact.ts:38`).
- Rule 9: "the `feature` entry names each rung" → troubleshooting's is `null` (`help.ts:143-144`).
- House terms: "chips (the filter row on the dashboard and the event page)" → retired: the dashboard's Show menu (All events, Saved, Deleted: `events-section.tsx`, `events-view.ts:62-64`) and the event page's View menu (`shared/view-menu.tsx`, `event-gallery.tsx:157-165`).
- Vocabulary: the README pointer → each file's header; Steps "the mono numeral rail" → the UI face's tabular figures (`spec-shared.tsx:424`, bible 7); AlbumShowcase and tables corrected as in the blog guide; the unit-carrying aliases named (`RecoveryDays`, `UnlockHours`, `InactivityMonths`, `EventPassTerm`).
- The map: `require-an-upload-to-view-explained` added under 09 at its order (every other slug, category and order matches `content/help/*.mdx`); "(G)" marks the category, not its articles.
- Truth sources: "the never-claim list … is in the marketing truth base and the content-policy test" → no truth base exists and no test fences it; the list (end-to-end encryption, point-in-time recovery, compliance certifications, multi-cloud) now sits in the guide beside `media-lives.tsx`'s why-comment.
- Process: "/llms.txt lists every article … a few dozen bytes" → at most `LLMS_HELP_PER_SHELF = 4` per category under 16,000 characters; `/llms-full.txt` carries every article with its description under 60,000 (`llms.ts`, `llms.test.ts`).

**For the Orchestrator at integration:**

- ROADMAP lines this lane closes: "`docs/PRICING.md`'s "Follow-up (code)" line …" (Now) and "A full `PRD.md` refresh to the shipped product" (Billing follow-ons); the pricing-h1 line's "(`PRICING.md` holds Pro's case)" is now true.
- Stale lines in `systems-trim`'s files: `billing-caps.md`'s "Stripe MCP runbook" checks the mode with `retrieve_balance` (the current MCP's check is `list_available_accounts_or_orgs`, as CLAUDE.md says); `lifecycle-recovery.md`'s "Host-facing recovery (the "Trash" tab)" names the label "Trash" (the app says "Deleted").
- For the reel round's sweep lane: the help guide's Studio and panel terms (the app writes "the studio" in lower case, `reel/page.tsx:31`; the code calls the sub-views sheets while the articles say both "Moments sheet" and "Length panel") and the blog guide's reel bullet were left for it.
- Assets requested from Will: none.
- Proposed migrations / Worker / Vercel / Stripe / env changes: none.
- Calls his to overrule: the ten under Questions, each taken as recommended.
- Look at first: PRICING.md "Model" and "Tiers" (Pro's case, the ingress correction, the ≈ column); then the first Deferred line (`/pricing` sells the free host page as paid); then the blog guide's "The product, in one place".
