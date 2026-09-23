---
track: systems-trim
status: handed-off      # open -> handed-off; deleted in the merge commit that integrates it
cut: "45e249a4"            # the launch-prep SHA the branch was cut from
board: none
owns:                   # path PREFIXES (dirs end in /); everything else is forbidden; no globs
  - docs/systems/
  - docs/SYSTEMS.md
reads:                  # single-sources you depend on: never duplicate, never edit
  - src/lib/
  - src/app/(dev)/design/_data/docs.ts
  - CLAUDE.md
---

# lp/systems-trim

**Goal.** Trim the system docs to current truth: present-tense facts, gotchas and invariants, with no dated narratives, provenance or retired-feature stories.

## The brief

THE RESHAPE (Will, 2026-09-22). His words: "Our goal isn't to preserve a historical log of all of our decisions - a huge history is simply dead weight... It's important to use your intuition and decide what should carry from our history/decisions (gotchas, rules, knowledge, tips, patterns, etc) but not build a textbook of 'The History of Building Partyreel'. Our Library and Lab should work the same way - the Library establishes all of our working rules (global and per component) for new agents to pull from, without giving them a backlog of history to distill anything. Doesn't matter what we've done before - agent tasks follow current rules and seek best solution at every point."

The rule for every line you keep: it states a current rule, fact, gotcha or task in the present tense, with at most a one-line why. Dates, "was", provenance ("from X (2026-09-19)"), narratives of what shipped when and stories of retired boards go: git holds them. Nothing true and still binding is lost: when unsure whether a fact still holds, check the code, and keep it if it does. The CHANGELOG is already retired (the merge commits carry what shipped); the rulings log `docs/design/rulings.md` retires in the `docs-rules` lane. Four lanes run at once on disjoint files: `docs-rules`, `systems-trim`, `roadmap-lean`, `pointer-sweep`.

YOUR PART: the system docs (`docs/systems/*.md`, `docs/SYSTEMS.md`), about 578 KB, trimmed to current truth.

1. In every doc: rewrite dated narratives as present-tense facts (drop the date, keep the fact: "(found live 2026-07-21)", "(Will, 2026-09-18)", "ruled 2026-06-20"); delete narratives of what shipped when, retired features, superseded decisions and provenance chains (check the code when unsure whether a fact still holds); keep every ★ gotcha, invariant and don't-revert with its one-line why; keep facts true to the code as it is today (the reel sections of `host-app.md` and `guest-flow.md` describe the shipped reel that the reel round replaces at its wiring: they stay, trimmed and true to today's code).
2. Never rename, remove or reorder a heading: anchors are linked from code comments, the Library and other docs (`src/app/(dev)/design/_data/docs.ts` reads sections of `design-system.md` and `marketing-content.md` by id, and the Library reads ★ lines). Body text only.
3. Every mention of `rulings.md` or `CHANGELOG` states the rule instead.
4. Each doc ends noticeably shorter, never less true. `docs/SYSTEMS.md` stays the index: one row per system, present tense (its highlight-reel section becomes a plain row).

HANDOFF EXTRAS: per doc, bytes before and after; every fact you found stale against the code, one line each (what it said, what is true).

**Binds.** The bible and the policies (`/design/library`), the contracts of every component under a path you own, and
CLAUDE.md's working loop. `DESIGN_PREVIEW_KEY` rides the environment, never a command line or a log you print. A record doc
(`docs/STATUS.md`, `docs/ROADMAP.md`, `docs/PROGRAM.md`, `CLAUDE.md`, `docs/ASSETS.md`, `docs/tracks/orchestrator.md`,
`docs/reviews/`) is edited only when your `owns` names it. Stage explicitly; never `--no-verify` or force-push; every commit ends
with the `Co-Authored-By` line naming the model you actually run on.

**Verify on.** `pnpm design:rules`, `pnpm test` and `pnpm lint`, each on its own exit code (docs-only: say so and skip the build); the Library's doctrine pages at 1440 on your port :3132 render every section they link.

## Questions (a recommended answer each; the Orchestrator relays them)

- none (every open call was taken on the brief's recommendation; each is under "Calls his to overrule")

## System-doc edits (in place, owned facts only)

- Every `docs/systems/*.md` and `docs/SYSTEMS.md`, trimmed in place to present-tense truth: one commit per doc, then
  the fixes from five fresh-context adversarial reviews (my six docs; host/auth/billing; guest/profiles;
  db/uploads/admin/testing; design-system; marketing-content) and one cross-doc consistency review, every finding
  checked against the code before it was written.
- Relayed from roadmap-lean, placed as current rules and checked: auth-accounts (Supabase Auth's rate limits, as
  dashboard state; a Google-only host is never remembered on /login), billing-caps (Checkout's `consent_collection`
  stays off), testing-verification (a capture beyond the viewport drops a backdrop-filter layer, a new landmine;
  a lazy `MediaTile` in a lab frame never loads), design-system (nothing re-tunes `--lamp-1..5` on paper; a gallery
  arrival never wears the glow engine's sweep), profiles-social and database-security (the guest model in the
  prefs rule and "guests without an account"). Not placed: READING_BAND as "the one scroll readout" (the feed's
  scroll-spy and the article TOC keep their own bands) and "a headed capture drops layers headless keeps"
  (lab-demo.mjs documents the reverse risk).
- Relayed from docs-rules, placed: host-app (a landmine at the head of the reel section: the stored reel is ruled
  out; an unclaimed name leaves the guest list with its uploads), guest-flow (the accepted names-mode gap), the
  sweep's stale lines (the halo lights the album hero, blog cards keep their own scrim, the dead ghost grid, the
  anonymous wording), and no pointer to `rulings.md` or `docs/specs/` survives (design-system's one `docs/specs/`
  mention states the lab reader's rule).
- Relayed from docs-product-trim: billing-caps already checks the mode with `list_available_accounts_or_orgs`;
  lifecycle-recovery's heading becomes "(the "Deleted" filters)" (grep: nothing links to its anchor).

## Deferred (ROADMAP one-liners, bucket named)

- Now: `create_guest` copies an UNCONFIRMED sign-up's auth address into `guests.email`, which the host's SELECT
  grant (`id, event_id, user_id, email, created_at`) exposes through PostgREST, against "an unproven address never
  reaches the host": null it until `verified_at`, or narrow the grant (20260922120000_guest_pending_email.sql,
  20260729180000_qa_q3_escalation_guards.sql:328).
- Now: the hub link row, the code mini-modal and the print sheet DISPLAY a claimed slug as `<site>/<slug>`, a path
  with no route (they copy and encode the permanent link); build it with the uncalled `preferredEventUrl`
  (dashboard/[eventId]/page.tsx:123, (print)/dashboard/[eventId]/print/page.tsx:59).
- Now: on the hub the lightbox's Add to reel renders nothing and the album's bulk Add to reel shows but writes
  nothing (only the reel room mounts `ReelProvider`), while the reel builder tells hosts to "use Select in the
  gallery" (reel-builder.tsx:288); moot at the reel round's wiring, else drop the doors.
- Now (his call): checkout lets stacked Event Passes above the chosen Pro size start Pro, shrinking the cap into
  over-cap grace (api/stripe/checkout/route.ts compares no sizes); decide whether a move may shrink a cap.
- Now: `get_public_profile`'s attended arm admits any signed-in viewer where the album asks for a confirmed email
  (20260922122000_profile_shown_events.sql:129 vs (guest)/e/[token]/page.tsx:232).
- Now: copy still says "Trash" where the product says "Deleted" (danger-zone-section.tsx:78 "It moves to Trash",
  album-copy.ts:154,169), and the /blog index's closing CtaBand says "No app or account for your guests." against
  the never-promise-no-account rule ((cinema)/blog/page.tsx:52; /events/[slug]'s "nothing but their phones" is
  borderline).
- Now: the guest name step's field carries `autoFocus` (guest-name-step.tsx:356) though the password gate drops it
  for the iOS keyboard; check on a real iPhone.
- Housekeeping: no importer or Library-only, beyond the ROADMAP's event-feed/TrashSection line: `ghost-grid.tsx`,
  `event-filter-pills.tsx`, `getFollowedHostEventCards` (queries/social.ts), `features.ts` + `features-layout.ts`
  (read only by their tests), `floating-add-button.tsx` and `anonymous-info.tsx` (Library only); `PosterCardChip`
  keeps its own blur pane off Crystal (reel/poster-card.tsx:147, moot at the reel wiring).
- Housekeeping: code comments that state retired facts: `getHostAvatarUrl` (lib/avatar/seed.ts),
  `resolveGalleryAccess` (several), `body-token-source.test.ts` (lib/guest/session-cookie.ts, api/guests/route.ts;
  the pin is session-cookie.test.ts), claim-handle-prompt.tsx on what the claim writes, queries/accounts.ts's "only
  cross-host profiles reader", profile-slug-control.tsx's "EVENT slugs stay Pro", the root not-found.tsx's glow,
  contact-sheet.tsx's deleted file, workers/backup/src/index.ts:296's "Cost & scaling" heading, share-urls.ts's
  "database-security.md0", and comments citing numbered rulings no doc holds (guest-download-plan.ts,
  guest-reel-payload.ts, guest-reel-overlay.tsx, upload-lock.ts, reel-builder.tsx, entitlement.ts, tiers.ts:181,
  request-facts.ts, preserve.ts).
- Housekeeping: three applied migrations have no file in the repo (`reel_style_catalog`,
  `reel_style_catalog_drop_legacy_overload`, `reel_caps_ingress_multiplier_parity_reapply`), and the ROADMAP's
  counsel line points at "trust-safety-forensics.md D2", a label that doc no longer has.
- Launch checkpoint: configure the app project's Vercel firewall (no custom configuration exists: the API answers
  "not found"), and set `crons.disabledAt` on partyreel-admin as a second stop behind the purge route's surface guard.
- Lab tooling: re-check testing-verification.md's Browser-pane `resize_window` no-op traps against the current tool,
  which reported emulating 1440x900 in this lane.

## Handoff (replaces the chat report)

- **Commits, pushed.** 34 work commits, one per doc and then the review fixes (905feba8 db82347d 488318c7 20a70358
  31a676b6 b9a29170 e58f6e39 0cf44d00 50f6e76b 6c441097 efb045e8 c6841d32 5a1f68b6 c87c02aa 6f02f264 c903e30b
  368698ea fb73bde8 3f4b82ee 2535ba4e e3b35be2 8ff88394 0c50c7af 4409d862 bc4d4b3c 70bd2c84 a3e03ab6 93edac58
  d5b13f6d 90dfca7e 8832a849 4e396bd9 4b9ff6a4 dfc9432b); synced with launch-prep three times by merge, never
  touching `docs/systems/`: 23fc14d7 (docs-rules, roadmap-lean, pointer-sweep), 4c552f9c (at ba735676:
  docs-product-trim and two recheck lanes) and 8a7eb958 (at c229e4e7: recheck-guest-identity, whose "in your
  account" copy rule dfc9432b carries into guest-flow.md). An earlier handoff commit, 846071e1, is superseded by
  this one.
- **Gates on the synced tree (8a7eb958 + dfc9432b), each on its own exit code; build skipped (docs-only lane):**
  `pnpm design:rules` 0 (228 components, 1916 contracts; no artifact diff), `pnpm test` 0 (350 files, 3863 passed,
  1 skipped), `pnpm lint` 0 (0 errors, 9 pre-existing warnings). Logs in the lane's scratch directory.
- **The Library's doctrine pages, at 1440 on :3132.** `/design/library/doctrine/design-system` and
  `/marketing-content` answer 200 and render 27 and 6 h2/h3 ids (every heading, the title skipped); every doctrine
  anchor on `/design/library/policies` (61), `/design/library/rules` (13) and the 28 component pages that carry a
  landmine resolves to a rendered id; looked at in the pane at 1440 (the header, the TOC, the Gotchas landmines).
  The Library attaches the same 34 component landmines as at the base (a replica of `landminesFor`), and the
  docs tests that pin design-system.md's sections pass. Checked on 4c552f9c; the later merge touched neither the
  two doctrine docs nor the Library's doc rendering. Server killed by port before the handoff.
- **Lane check:** `git diff --name-only origin/launch-prep...HEAD` = `docs/SYSTEMS.md` + the 17
  `docs/systems/*.md` (+ this manifest in this commit): all under `owns`.
- **Bytes, before -> after:** SYSTEMS.md 6162 -> 6170 · admin-observability 27803 -> 27054 · architecture
  11155 -> 10806 · auth-accounts 22782 -> 22615 · billing-caps 17307 -> 16599 · database-security 34021 -> 31969 ·
  design-system 126403 -> 105500 · durability-backups 12826 -> 12788 · guest-flow 73831 -> 66421 · host-app
  66317 -> 56568 · lifecycle-recovery 12365 -> 12637 · marketing-content 74915 -> 64303 ·
  notifications-analytics-growth 11846 -> 11850 · profiles-social 15464 -> 14932 · testing-verification
  33764 -> 30331 · trust-safety-forensics 9836 -> 9650 · uploads-and-r2 27551 -> 26214 · total 584348 -> 526407
  (-10%). Dates 185 -> 3 (two in a heading kept by rule; Stripe's `apiVersion` string).
- **Stale against the code (at the base, or caught mid-lane by the reviews), one line each:**
  - SYSTEMS.md: said "the daily purge cron (9 sweeps)"; true: 12 (src/app/api/cron/purge/route.ts, job_health last).
  - SYSTEMS.md: said the guest link is `/e/[qr_token]` and the tokens "achromatic"; true: the route is `(guest)/e/[token]`, the chrome cool-grey at hue 286 (src/app/globals.css).
  - architecture.md: said "the 9-sweep lifecycle"; true: 12 sweeps.
  - architecture.md: linked `README.md` as "the full index"; true: no such file, the index is docs/SYSTEMS.md.
  - architecture.md: the route-group map lacked `(print)`, `(dev)`, `demo/` and `/u/[slug]`; true: all four exist under src/app/.
  - architecture.md: said "the three daily jobs stay on the app surface"; true: only the Vercel purge cron is surface-bound (the Worker and the Action run off Vercel).
  - architecture.md: the jobs table omitted the Worker's weekly prune cron; true: `0 6 * * 1` (workers/backup/wrangler.jsonc).
  - architecture.md: said the Uploads/Trash tabs live on /dashboard; true: deleted events are the Deleted filter and Your uploads lives on /u/[slug] (removeMyUploadAction revalidates /dashboard + /u/[slug]).
  - architecture.md: said event create/delete revalidate `/dashboard/[eventId]` + `/dashboard`; true: `/dashboard` only (dashboard/actions.ts:92,205).
  - architecture.md: said `router.refresh()` appears only in guest in-page auth flows; true: host, social and admin components call it too.
  - architecture.md: said the `--gallery` tokens serve the lightbox backdrop and `SaveEventButton` tone="gallery"; true: they paint the EventCard no-cover placeholder and the marketing reel/gallery frames; the lightbox uses glass-behind and nothing passes tone="gallery".
  - lifecycle-recovery.md: said "11 sweeps"; true: 12, `job_health` (scanJobFreshness) last.
  - lifecycle-recovery.md: said the bin is a "Trash" tab (`value="deleted"`) and a per-event section; true: "Deleted" is a filter value on the events list (src/lib/dashboard/events-view.ts) and in the album's View menu (event-gallery.tsx); TrashSection is unmounted.
  - lifecycle-recovery.md: said the meter line reads "+X in Trash"; true: "+ X in Deleted (frees automatically)." (storage-meter.tsx:126).
  - lifecycle-recovery.md: said delete-own runs from "the Uploads tab" through one owner-context RPC; true: "Your uploads" on /u/[slug] and the guest album via `remove_my_upload`, a name-only guest via `remove_my_upload_by_session`, and `disown_guest_rows_by_email` also sets `removed_by_uploader`.
  - lifecycle-recovery.md: said `purge_media_rows` does "the atomic R2-then-row reclaim"; true: it deletes rows (never held ones) and decrements storage_used_bytes; callers delete R2 first (20260729150000_qa_q1_media_destruction_guards.sql).
  - lifecycle-recovery.md: set events' "stamped" purge_at against media's trigger-derived one; true: `events_set_purge_at` derives it too (20260604163011_lock_down_events_write_grant.sql).
  - durability-backups.md: said the fraction cap is 25% of objects scanned; true: once ≥50 are scanned (ORPHAN_RATIO_MIN_SCANNED, r2/orphan-guard.ts).
  - durability-backups.md: said reconciliation re-copies within 24 h ("next run continues"); true: every run lists from the start and stops at 5,000 objects (workers/backup/src/index.ts:77,150-167), so past 5,000 objects the tail is never reconciled.
  - trust-safety-forensics.md: the captured fields and the Record export omitted `guest_display_name` and `guest_pending_email`; true: both are captured and exported (src/lib/forensics/capture.ts).
  - notifications-analytics-growth.md: said saved events live in the unified "Events" tab; true: rows of kind `saved` in the dashboard's events list, under "All events" and the "Saved" filter.
  - notifications-analytics-growth.md: said the Save button mounts in the /e/ action row and the post-upload prompt; true: only inside SaveAccountPrompt, on AccountDoor wear="save" (save-account-prompt.tsx:150).
  - notifications-analytics-growth.md: said `/api/guests/email` was removed as dead code; true: it exists, the unproved-address door writing guests.pending_email (set_guest_pending_email); create_guest writes it too at the join.
  - notifications-analytics-growth.md: omitted that capture-email requires `email_confirmed_at` and rate-limits per IP (fail-open); true: both (api/guests/capture-email/route.ts).
  - notifications-analytics-growth.md: named the Vercel MCP tool `get_web_analytics`; true: the MCP exposes count_pageviews / aggregate_pageviews / count_events.
  - auth-accounts.md: said `profiles` is host-writable on `email`, `announcements_seen_at`, `welcomed_at`; true: only the last two; email is service-role only (20260729180000_qa_q3_escalation_guards.sql:309).
  - auth-accounts.md: said the Plan card's only search param is `?reset`; true: `?reset` and `?welcome` (account/page.tsx).
  - auth-accounts.md: said `getHostAvatarUrl`; true: `getHostAvatarSeed` (guest-events-admin.ts).
  - auth-accounts.md: said `claim_anonymous_uploads` stamps `user_id` only; true: under a confirmed session it also marks rows verified and names a nameless profile (20260922120000_guest_pending_email.sql §8).
  - auth-accounts.md: said `/account?reset=1` serves other entries and `/welcome` is "the ONLY place a name can be set" with OAuth prefill everywhere; true: nothing links to reset=1, /welcome is the one (app) route a nameless account reaches, /account and the guest door also write names, and only /welcome prefills.
  - auth-accounts.md: said the door is "worn by four surfaces"; true: five wears across six surfaces (account-door.tsx).
  - billing-caps.md: listed `tier_limits()` without `ingress_cap_multiplier`; true: five columns, paid ingress = multiplier × effective cap via monthly_ingress_cap() (20260707120000_reel_caps_ingress_multiplier.sql).
  - billing-caps.md: said the four upload fns and the over-cap sweep share `host_active_bytes()`; true: the SQL readers are the upload fns, get_upload_gate and the restore RPCs; the sweep and getHostStorageSummary compute it in TypeScript.
  - billing-caps.md: said both `get_upload_context` flags read host_active_bytes; true: `at_monthly_cap` reads monthly_ingress_cap().
  - billing-caps.md: said a pass holder cannot buy a second pass mid-move and no move may shrink a cap; true: passes stack, checkout refuses only an active Pro, and stacked passes above the chosen Pro size shrink into over-cap grace (api/stripe/checkout/route.ts).
  - billing-caps.md: said verify the Stripe mode with `retrieve_balance` and cancel with `cancel_subscription`; true: `list_available_accounts_or_orgs` → livemode, cancel through stripe_api_write (the retired tools are gone).
  - billing-caps.md: pointed `getStripe()` at env.ts / stripe/; true: src/lib/stripe/client.ts.
  - profiles-social.md: linked `following-section.tsx`; true: deleted, the feeds live in the profile's owner mode (owner-sections.tsx).
  - profiles-social.md: said only the host's Guests room opts into includeUnverified and the list shows "signed-in uploaders"; true: the guest album opts in too, and cards key on verified_at, never user_id alone.
  - profiles-social.md: listed the host feed's Guests section (`guestsCountInList`); true: the Guests room plus a count on the hub's card (event-feed.tsx has no importer).
  - profiles-social.md: the attended-arm gates lacked the anonymous-viewer `allow_anonymous_uploads` clause and the approved-upload requirement; true: both (20260922122000_profile_shown_events.sql).
  - profiles-social.md: said "no prefs UI yet" and get_public_profile is "the 4th" anon RPC; true: /account has the Email preferences card (no send reads it), and it is one of five.
  - profiles-social.md: said custom event slugs "stay Pro"; true: any paid tier (isSettingLocked = tier === "free", tiers.ts:304).
  - testing-verification.md: said the lab shell's nav is a Suspense trap in a 232px sidebar; true: no Suspense boundary, the sidebar is 240px (--lab-sidebar-w).
  - testing-verification.md: said an Agent can hand Will a round from its own lp/* preview; true: vercel.json's git.deploymentEnabled builds no lp/* or launch-prep push.
  - testing-verification.md: said lab:demo "draws the stage above the options and pins it"; true: it fails a step below --reach-limit (0.6 of 900px), clipped, unlabelled or with its dock off screen (scripts/lab-demo.mjs).
  - testing-verification.md: said the seed script needs ffmpeg; true: ffmpeg and ffprobe.
  - testing-verification.md: said live-gallery.tsx stops the poll on visibilitychange; true: the shared useLivePoll does, and the TTL is STABLE_DOWNLOAD_TTL_SECONDS (≤90 min).
  - admin-observability.md: said Accounts is read-only; true: it also deletes accounts (deleteAccountAsOperatorAction).
  - admin-observability.md: said queries/accounts.ts is the only cross-host profiles reader and reuses the over-cap query; true: four more service-role readers exist, and accounts computes active bytes itself.
  - admin-observability.md: said Albums render via toGridItems; true: toModerationFeedItems.
  - admin-observability.md: said create_report is an anon capability RPC and omitted the person-report arm; true: service-role only via /api/reports, plus the signed-in `reports.profile_id` arm.
  - admin-observability.md: omitted Reels and Exports; true: both are nav surfaces with ops_flags kill switches (src/lib/admin/nav.ts).
  - admin-observability.md: said redaction matches 32 hex with all three hooks in every runtime; true: 32 to 64 hex, and the replay hook runs on the client only (telemetry-redaction.ts).
  - admin-observability.md: said NEXT_PUBLIC_ADMIN_HOST preview is each project's own alias and crons.disabledAt "is worth" setting; true: only partyreel-admin uses its alias; crons.disabledAt is unset (Vercel API reads).
  - admin-observability.md: said "the other seven" sweeps ride the parent row; true: eight, the freshness scan included.
  - database-security.md: said the 0029 list was complete; true: upsert_reel_config is authenticated-only too.
  - database-security.md: said 11 deny-all tables; true: 14 (event_passes, job_runs, reel_render_log).
  - database-security.md: said 6 server-mediated RPCs; true: 10, and the service-role-only list lacked action_rate, monthly_ingress_cap, set_updated_at, enforce_follow_not_blocked.
  - database-security.md: omitted the `require_upload_to_view` events grant and the `/api/guests/email` cookie writer; true: both (20260922003000; api/guests/email/route.ts).
  - database-security.md: said the check mirrors `resolveGalleryAccess`; true: retired, now resolveGalleryDecision (src/lib/events/gallery-access.ts).
  - database-security.md: listed the profiles service-role-only columns without bio, slug, deletion_requested_at, event_slots, tier_expires_at; true: all five are service-role only.
  - database-security.md: said a trigger runs as the table owner; true: trigger-function EXECUTE is checked at trigger creation, and the invoker guards see the writer's role.
  - database-security.md: said get_event_by_qr_token redacts description, date and host; true: custom_slug too (20260922003000).
  - database-security.md: said password and custom slug are Pro-gated and the ceiling is MAX_EVENTS; true: any paid tier, and event_slots overrides the ceiling.
  - database-security.md: said the repo filename IS the applied version, the claim "drops a differing typed address", and get_my_uploads returns ≤200; true: apply_migration stamps its own version, a confirmed claim clears pending_email, and 200 is the app's argument.
  - uploads-and-r2.md: said the single-PUT presign signs content-type only; true: content-type + content-length, and an UploadPart presign content-length (r2/presign.ts:89,149).
  - uploads-and-r2.md: said the guest export mint checks resolveGalleryAccess; true: resolveViewerDecision.
  - uploads-and-r2.md: said attribution has three cases (Host / Anonymous / named); true: four (host, verified guest, unverified typed name with the mark and no address, nameless legacy "A guest") (media/uploader-identity.ts).
  - uploads-and-r2.md: said the lightbox backdrop is bg-black/90 and MediaTile reads type + url; true: GLASS_BEHIND on its own overlay, and MediaTile reads previewUrl too.
  - uploads-and-r2.md: said host add-photos runs event-uploads.tsx → host-upload.tsx and create_media_as_host authorizes via auth.uid(); true: event-feed/event-gallery.tsx, and the route's p_host_id plus ownership.
  - uploads-and-r2.md: said two presigns per item; true: three (inline, attachment, preview).
  - host-app.md: said `/settings` shares getEventCardStats (the reason pulse.ts is apart); true: only the dashboard calls it; events.ts is shared by every event room and the settings sheet.
  - host-app.md: said event-feed.tsx and its action bar stay on disk for the lab; true: nothing imports them.
  - host-app.md: said EventSlugControl is in the wizard's Share step; true: the share sheet is its only home.
  - host-app.md: said resolveGalleryAccess gates unverified guests; true: resolveGalleryDecision.
  - host-app.md: said the share-sheet code is ~416 px at a desk and the mini-modal's code is 80vw with navigator.share third; true: capped at 360 px; min(80vw, 260px) with Copy link, Share (where available), Everything.
  - host-app.md: said the print page tells the host its codes are always classic; true: no copy says so.
  - host-app.md: said the Review grid is natural-ratio masonry at grid-cols-3/4 with a "Review · N waiting" eyebrow and a FLIP; true: the uniform 4 / 5 layout, 3 across then auto-fill on --album-column, an amber header, no relocation.
  - host-app.md: said tile verbs are HostTileOverlay chips with a mobile Like + Download; true: one desk-only TileActionBar pane (hidden md:flex), phone tiles carry marks only.
  - host-app.md: said `useModeration(eventId)` and a command-bar Add plus a floating action; true: useModeration(eventId, applyOptimistic), and the album header's Add photos.
  - host-app.md: said ReelProvider wraps the whole feed and the lightbox and bulk-Select are working reel doors; true: only the reel room mounts it, so on the hub both are inert.
  - host-app.md: said the empty reel offers "Fill from gallery" and GET /api/reel/render survives as a dormant poll; true: the fill is quick-add, and the render route is gone (only /api/reel/upload and /api/reel/download).
  - host-app.md: said `upsert_reel_config(p_style_id, p_orientation, …)` and the seed is defaultReelSeed(eventId); true: p_event_id first, and the stored seed (defaultReelSeed is its first value).
  - host-app.md: said Download sits beside the Studio's sheets and the live route is "ONE select"; true: inside the Length sheet, and two RLS reads.
  - host-app.md: said to prove a QR preset on partyreel.com, and pointed a next/image trap at testing-verification.md; true: the launch-prep alias (CLAUDE.md), and that doc never held the trap.
  - guest-flow.md: said claim_anonymous_uploads never writes email; true: a confirmed claim stamps verified_at, copies the email, clears pending_email and the typed name, and names a nameless profile.
  - guest-flow.md: said the door's first upload writes `pr_contributed_<qr>`, fires the hold and refreshes; true: no such key, no hold; the client `contributed` flag drops the step and the poll's looser decision refreshes.
  - guest-flow.md: said the welcome's button can read "View the album" and its hero is 28px Instrument Serif; true: always "Continue", font-heading at text-page.
  - guest-flow.md: said the welcome is suppressed for the owner and the demo, and the hold reads "Opening the gallery"; true: the owner gets no sheet, the demo shows RoleStep, and it reads "Opening the album".
  - guest-flow.md: said `handleUnlocked` sets `proceeded` and "account-return never auto-opens"; true: `proceeded` is gone, autoOpen is true whenever a step exists.
  - guest-flow.md: said the name step's lede names the host and no gate autofocuses; true: it names nobody, and only the password gate lacks autofocus (the name field has autoFocus).
  - guest-flow.md: said the poll keeps rendered URL objects (staleness by design) and the ETag hashes access, teaserTotal, items and bucket; true: reconcileGalleryItems adopts changed rows, and the ETag also hashes gate and the verified mark.
  - guest-flow.md: said the lightbox Share is guest-only and --album-column is 220px (5/6/8 columns); true: the host gallery passes shareUrl too; the View menu sets 180/240/300 (220 is the fallback).
  - guest-flow.md: said GhostGrid is imported by a board and floating-add-button serves three lab surfaces; true: GhostGrid has no importer, and only the Library's demo mounts the button.
  - guest-flow.md: said GuestUpload owns onQueueChange and resolveGalleryAccess/computeEntry handle the demo; true: the queue lives in event-experience.tsx, the page short-circuits the demo to full, computeEntry is gone.
  - guest-flow.md: said the demo's welcome "reads permanently unseen" and only the poll pauses; true: per-mount state advanced by Continue, and both the doorbell and the poll are off.
  - guest-flow.md: said "Not mine" uses the email route's null detach and the email step is `<EmailSignIn>` + password; true: disown_guest_rows_by_email, and AccountDoor wear="gate".
  - guest-flow.md: said sign-out calls setStoredSession(qrToken, null); true: leaveGuestSession (clears storage and posts /api/guests/leave).
  - guest-flow.md: omitted POST /api/guests/email as a cookie writer; said needsName swaps the upload panel; true: it writes and is pinned; needsName feeds the door's profile mode.
  - guest-flow.md: said the teaser has a "+N more" caption and the download ladder has 4 rungs; true: no caption, "See all N photos & videos", and 5 rungs (guest-download-plan.ts).
  - design-system.md: said "zero-chroma is the identity" and "Saturate your neutrals was declined"; true: the chrome greys sit at hue 286, chroma 0.002 to 0.0105; only pure white and the chart greys are chroma 0 (src/app/globals.css).
  - design-system.md: said RULINGS renders at `/design/library/record`; true: no such route (legacy-routes.ts), RULINGS feeds the rules and influence pages and the desk.
  - design-system.md: said the workshop is "empty by default"; true: sandbox/ holds every board whose winner is not wired, in DESK_ORDER.
  - design-system.md: named `.mkt-fglow-base`/`.mkt-fglow-band` in marketing.css; true: gone (glow-contract.test.ts), the engine's `[data-glw-base]`/`[data-glw-band]` in globals.css.
  - design-system.md: said "Bible 11 (retiring)" and law 1 forbids the footer seam; true: bible 11 lets a lamp light a section without media (rules/bible.ts).
  - design-system.md: said the home has "three seams and one beam" with measured distances and an album straddle; true: the Aurora also sits on no-app.tsx and cinema-close.tsx, and no home straddle exists ((cinema)/page.tsx).
  - design-system.md: said the footer's photo pile wears the lift and restated the card-stack hairline; true: FooterDemo is a DemoFrame (a mat on shadow-layer, the plate on shadow-lift); `.mkt-stack-card` is unused.
  - design-system.md: said Button has eight sizes and the floating corner is an 8px panel around 4px rows; true: nine sizes; a 12px panel around 8px rows (ui/button.tsx, --radius-float).
  - design-system.md: listed per-primitive clocks (dropdown/popover 175/120, tooltip 150/100) and the marketing nav on 200/150; true: floatingClock instant 90/70, standard 200/150, edge 300/200, tooltip delay 0/300; the nav runs 200/130 (floating-layer.ts, providers.tsx, marketing.css).
  - design-system.md: said the panel backdrop-filter refusal lasts until the Glass exploration lands; true: permanent (floating-layer.test.ts, lib/glass.test.ts).
  - design-system.md: said the feed header is an 11px uppercase label with eight such labels; true: `text-label` (12px), and the policy names four label exceptions (type-ladder-policy.test.ts).
  - design-system.md: named iframe scene routes and gallery declarations at `(dev)/design/<family>/gallery-demos.tsx`; true: boards portal scene.tsx into Frame; declarations live at `(shell)/library/<family>/gallery-demos.tsx`.
  - design-system.md: said a lab dark override remains for two legacy boards and --save/--reel are icon-only hues; true: none remains (design.css), and `bg-reel` also fills buttons.
  - design-system.md: said the uniform grid is `grid-cols-3 sm:grid-cols-4`, masonry is CSS columns, and use-sortable-grid carries an unextracted FLIP; true: GALLERY_UNIFORM_COLUMNS, explicit columns via distributeColumns, and it calls runFlip (shared/masonry.tsx, use-flip.ts).
  - design-system.md: said the arrival's record is touchpoint 11's `decisionNote`, the host-review takeover preloads, three glass utilities, and the guest masonry sets `--tile-i`; true: no decisionNote exists, the preload is in use-review-triage.ts, four utilities (glass-mark-lit), and masonry.tsx sets it only when a grid passes `stagger`.
  - design-system.md: omitted `--info` (the Badge and table-row tone); true: it exists (globals.css).
  - design-system.md: said the halo has no production use; true: it lights the album page's hero (live-album-stage.tsx).
  - design-system.md: listed the blog library under CARD_COPY_SCRIM and the ghost grid in the gap table; true: blog cards keep their own lifting scrim (post-card.tsx), and GhostGrid has no importer.
  - marketing-content.md: linked `album/arrivals-stage.tsx` (broken); true: the hero is `album/arrivals-hero.tsx`, the fill grid drives only `everywhere-stage.tsx`.
  - marketing-content.md: linked `(marketing)/not-found.tsx` (broken) and said its layout renders the chrome; true: the layout has no chrome; the boundaries are `(cinema)/not-found.tsx` and `(paper)/not-found.tsx`, seven not-found files in all.
  - marketing-content.md: said "Require accounts to upload" is on by default and "anonymous is Anonymous (no name field)"; true: the switch is Require verified emails, every upload carries a name, and no surface says anonymous.
  - marketing-content.md: said a guest's own delete is private to the host; true: it leaves the album at once and the host's bin never sees it.
  - marketing-content.md: said the album page's chapter 2 is one document with three questions and three heroes sit under ScreenLamp; true: six desk beats and nine questions; only guests and sharing wear ScreenLamp.
  - marketing-content.md: said a registry test bands `directoryLine` and the QR door is the renderer on a white plate; true: no test pins copy; the album streams out of the code between the scrims (feature-door.tsx).
  - marketing-content.md: said home and /features read features.ts through FeatureSpotlight + FEATURE_PRESENTATION; true: FeatureSpotlight does not exist, only features.test.ts reads features.ts, /features is a FeatureDoor directory, the home order lives in section-ids.ts.
  - marketing-content.md: said every feature page pairs FAQ + GoDeeper with FAQs in *-faq.ts; true: /privacy has no GoDeeper row, /qr and /guests keep FAQ arrays in the page.
  - marketing-content.md: said the Resources card links the help article and the legal documents are v1.0; true: it links /how-it-works; legal is at 1.5 (legal.ts).
  - marketing-content.md: said LegalConsentLine sits only on /login and the guest welcome; true: AccountDoor renders it on every door except the guest gate (consent={false}).
  - marketing-content.md: said the blog h1 departs from the ladder, only two long-form surfaces take the spine, and 59 help articles; true: the blog h1 sits at `subsection`, help, blog and legal all take it, and the count is 60 (dropped).
  - marketing-content.md: said `.mkt-line` is 0,2,1 and mdx-components.tsx holds the vocabulary; true: 0,2,0 unlayered; it composes spec-shared, spec-help and spec-blog.
  - marketing-content.md: said the footer slab is --gallery* and its invitation a photo pile with a confetti glow that skips the root 404; true: `.surface-ink`, a DemoFrame from sm up, the --lamp-* spill engine, and it renders on the root 404.
  - marketing-content.md: said Start free sits above the no-demo early return, SITE_DESCRIPTION has six consumers, and robots.ts disallows only /admin, /login, /auth; true: both branches, four consumers, and /account, /welcome, /design too.
  - marketing-content.md: named EVENT_PRESENTATION, eventFrame(), event-frame-cards.tsx, reel-angle-band.tsx, event-hero-media.tsx; true: all gone from the code.
  - host-app.md (review): listed the lightbox and bulk-Select as reel doors beside the inert-hub fact; true: only the reel room's Moments picker and quick-add curate.
  - auth-accounts.md (review): said the (app) layout is the single sign-in gate and the Plan card billing's only home; true: (print) and admin gate themselves, and the storage meter carries Manage billing, Renew and Need more.
  - auth-accounts.md (review): said updateDisplayNameAction is the only display_name writer; true: claim_anonymous_uploads and claim_guest_rows_by_email also write it onto a nameless profile (20260922120000_guest_pending_email.sql).
  - profiles-social.md (review): said the room is counted on the hub's Guests card and the switches live on /u/[slug]; true: the card counts proved cards only while the room adds the named unverified; the switches are on /account.
  - guest-flow.md (review): said SetNameStep is mounted only by the Library and nothing reads allow_anonymous_uploads; true: /welcome mounts it; get_public_profile reads the flag and get_event_by_qr_token returns it.
  - guest-flow.md (review): dropped remove_my_upload_by_session's event checks, credited splitGuestList to the album, and quoted the follow line as "Claim your handle"; true: the row must belong to the media's live event; only the Guests room calls splitGuestList; the line reads "Claim a handle and your name becomes a page."
  - guest-flow.md (review): said the owner check avoids "the open-event RLS read" and named two centred Dialogs; true: no such read exists (events_host_all only), and Add your email is a third.
  - database-security.md (review): said get_upload_gate is called by the page and the poll alone, and both limiters guard a capability; true: resolveViewerDecision also serves /api/export/guest and /api/reel/download; the unlock limiter guards a password check and reports unlock_limiter.
  - database-security.md (review): implied volumetric DoS is handled; true: the app project has no custom Vercel firewall configuration (the API answers not found).
  - admin-observability.md (review): called the unset crons.disabledAt settled and Exports' count "failures"; true: the route's comment says worth setting; Exports counts every attempt that did not mint.
  - testing-verification.md (review): said a hidden tab never polls; true: useLivePoll stops only when a tab GOES hidden; a tab that loads hidden keeps its throttled interval.
  - uploads-and-r2.md (review): said the caption's explainer is anonymous-info.tsx and a legacy row shows an info popover; true: AttributionPill with UnverifiedMark's popover; "A guest" carries no explainer; anonymous-info.tsx is Library-only.
  - durability-backups.md: omitted the orphan sweep's own cap; true: 20 pages from the bucket head per run, objects older than 24 h only (ORPHAN_PAGE_CAP, ORPHAN_MIN_AGE_HOURS).
  - host-app.md: said video in the reel is Pro-only; true: paid-only (Pro and Event Pass; tier != 'free').
- **Calls his to overrule:**
  - SYSTEMS.md's highlight-reel section is a plain table row, its heading removed (the brief's item 4; grep finds no
    link to it).
  - lifecycle-recovery.md's heading renamed "(the "Deleted" filters)" on the relayed word (nothing links to it).
  - Two new landmines placed as relayed: host-app.md's "The stored reel is ruled out" (it describes the coming reel,
    which the brief otherwise kept out) and testing-verification.md's beyond-the-viewport capture.
  - Headings that carry a date or a status word stay as written (admin-observability's "(Will, 2026-09-18 and
    2026-09-20)", durability's "(BUILT — ships in dry-run)", trust-safety's two runbook headings); renaming them
    with their anchors is a follow-up.
  - Supabase Auth's limits are written as dashboard state (nothing in the repo holds them; the door's
    `rate_limited` refusal is checked).
  - The small docs end barely shorter (SYSTEMS 0%, lifecycle +2%, notifications 0%, auth -1%, durability -1%):
    they held little history and gained corrected facts; the big docs end 11 to 17% shorter.
  - Ruling ids, board and lane names were dropped even inside landmines (none names a Library component, so no
    landmine detaches); the Library's first-sentence titles were rewritten to state each trap.
  - `cut:` corrected to 45e249a4, the SHA this branch was cut from (cut-lane.py wrote its parent).
- **Look at first:** database-security.md's "TWO EMAIL COLUMNS, AND ONLY `verified_at` IS PROOF" landmine and the
  first Deferred line (an unconfirmed sign-up's address sits in `guests.email`, inside the host's SELECT grant);
  host-app.md's slug-display and inert-reel-door lines; design-system.md's opening (the working-rules stance) and
  its rewritten radius landmine.
- Assets requested from Will: none. Proposed migrations / Worker / Vercel / Stripe / env changes: none in this lane
  (the Vercel firewall and `crons.disabledAt` are Deferred launch lines).
