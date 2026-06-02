# Partyreel — Status

> **You-are-here, short and current.** What's live, what's pending a human, what's in flight.
> For the feature map read [`SYSTEMS.md`](SYSTEMS.md); for backlog/deferred work + the
> pick-up-a-task loop read [`ROADMAP.md`](ROADMAP.md); for how to work in the repo read
> [`CLAUDE.md`](../CLAUDE.md).

**Updated:** 2026-06-02

## Where we are

**The v1 foundation is built and verified in production.** The focused phased roadmap is
complete — the project is now in **one-off task mode** (a goal → its own small plan → build →
verify on partyreel.com → record). Shipped + live-verified: host auth, the create wizard + QR
designer + first-time welcome, guest join/upload, galleries, moderation + the purge-cron
lifecycle, the storage-cap tier model + Stripe (Pro subs, Event Pass, portal), the growth loop
(branded share/SEO/guest email capture), link analytics, the notification center, the album
lightbox + per-item download, and the **unified live guest event page** (live polling gallery +
in-page share). Full map in [`SYSTEMS.md`](SYSTEMS.md). Canonical domain **partyreel.com**; R2 bucket `partyreel`
provisioned (CORS `ExposeHeaders: ETag` + abort-incomplete-multipart rule).

**Only scaffolded:** Phase 5 — the highlight reel (DB scaffold only; the *build* stays tabled
pending a product + architecture decision — see ROADMAP). Its **marketing framing is now
confirmed** (2026-05-31): a core value prop — an auto-compiled, host-customizable, shareable/
downloadable reel of the event's favorite moments — featured as such on the new site.

## In flight / pending verification

- **Profile photos + display names (3-part build) — Phase 1 (avatar upload) SHIPPED to `main`, live
  verification in progress (2026-06-02).** Hosts upload an avatar on `/account` via an interactive
  circular cropper → 512px WebP re-encoded client-side → `POST /api/account/avatar` → a DETERMINISTIC
  R2 key `avatars/<id>/avatar.webp` (overwrite-on-replace = **zero orphans by construction**; DELETE is
  R2-first). `profiles.avatar_updated_at` (migration `…213758`, service-role-write-only) is the
  existence marker; the `<Avatar>` in the account card + the **UserMenu** shows the presigned image,
  else the initial letter. Advisors **UNCHANGED** (column add, no new RPC); typecheck/lint/**test 225**
  green. Decided with Will: interactive cropper · 512px "sharp & generous" · show on the guest byline.
  **Phase 2** = display-name editing (drop the email-prefix `handle_new_user` fallback + backfill so
  "no name set" is a real state); **Phase 3** = the guest "Hosted by" avatar + name gate (guest RPC
  DROP+CREATE+re-grant). Plan: [profile-photos plan](../../.claude/plans/we-recently-created-an-silly-muffin.md).
- **Account email + password (ADR-0011) — SHIPPED + LIVE-VERIFIED on partyreel.com (2026-06-02).** A
  traditional email+password login, in PARALLEL with OTP/magic-link/Google (the password is one more
  credential on the same `auth.users` row, so every path reaches the same account). `/login` now **leads
  with password** ([password-sign-in.tsx](../src/components/auth/password-sign-in.tsx)) with "Create
  account" (OTP-verify then set), "Forgot password?" (→ reuse OTP → `/account?reset=1`), "Email me a code
  instead", and Google. New **`/account`** page (UserMenu → Account) sets/changes the password
  (`updateUser` on the browser client; a `verify_current_password` RPC re-confirms the old one before a
  change). Three authenticated-only RPCs (`has_password`, `verify_current_password`, `mark_password_set`;
  migrations `…200420` + `…210158`) — advisors **+3 authenticated (0029), 0 anon (0028)**;
  typecheck/lint/**test 210**/build green.
- **LIVE-TEST FINDING + FIX (the headline catch):** GoTrue writes a non-null bcrypt `encrypted_password`
  PLACEHOLDER for email OTP/magic-link signups (`providers=['email']`; Google = NULL), so the first
  `has_password()` mislabeled OTP-origin hosts as "has password" → `/account` showed CHANGE mode (asking
  for a current password they never set). Fixed: a service-role `profiles.password_set_at` stamped by
  `mark_password_set()` after each `updateUser`; `has_password()` reads the flag (migration
  `…210158_account_password_set_flag`). Re-deployed + re-verified.
- **Chrome-MCP verified on prod (full matrix):** create-account via real Gmail OTP → set password →
  dashboard; returning password login; wrong / no-password / post-change-old password all give the SAME
  generic error (no enumeration leak); min-8 + confirm-mismatch validation; CHANGE mode wrong-current
  (error + session intact) then right-current (changed, persists); OTP-origin passwordless → `/account`
  SET mode → add password → flag stamped → CHANGE mode → **password login works** (the all-paths case);
  `/account?reset=1` forces SET mode → set new; "Forgot password?" → code view + reset note; Supabase's
  "new password must differ from old" surfaced cleanly. DB-confirmed `password_set_at` flips correctly.
  Google-origin add-password + admin-subdomain password sign-in are structurally identical (flag-based
  `has_password`; in-page nav, no new redirect-allow-list) — not separately driven live. **Human
  dashboard tasks DONE** (signups ON, Confirm-signup `{{ .Token }}`, min length 8, Secure-password-change
  OFF, Require-current-password OFF); **DEFERRED: leaked-password protection (Pro-gated).** Disposable
  test aliases `hi+pwtest1/2@willgibs.com` left in place (purge with other test data pre-launch).
- **One-link consolidation — Part 1 (data + routing) SHIPPED + LIVE-VERIFIED** (commit `37707d8`).
  Collapsed the two-token model (the `/e/[qr_token]` event page + the separate `/a/[share_token]` album)
  to ONE link per event: **`/e/[qr_token]`**, where the host's configs
  (`visibility`/`accepting_uploads`/`require_email`) drive what a guest sees ("view-only album after the
  event" = `accepting_uploads=false`). Migration `…183720_one_link_consolidation`:
  `create_report`/`verify_event_password`/`save_event` re-keyed to `qr_token`, `get_saved_events` returns
  `qr_token`, **`get_public_album` DROPPED + the `share_token` column DROPPED**. Advisors: **anon list
  9 → 8** (get_public_album gone), no new entries; rolled-back RPC contract check passed. Deleted `/a/`
  (page + OG) + moved the per-event OG to `/e/`; saved cards now link `/e/`; the report control moved to
  `/e/`; the host dashboard + create-wizard show ONE link + **config-aware copy**; `MakeYourOwn` retired.
  typecheck/lint/test (201)/build green. ADR-0010 (supersedes the ADR-0004 two-token split).
  **Chrome-MCP verified on prod:** an old `/a/[share_token]` URL now **404s** (route gone, deploy live);
  the single `/e/[qr_token]` event page renders (header → upload → one Share card → gallery); the
  reworked `get_saved_events` returns `qr_token` (DB-confirmed) and the dashboard **Saved** card links
  `/e/<32-char qr_token>` (NOT `/a/`, JS-asserted) with a server-presigned cover; and the **host event
  page now shows ONE link** ("One link does it all." — QR + `https://partyreel.com/e/…` + config-aware
  "Anyone with this link can view and add photos." + a single "74 views" metric, no Album-link column);
  and the per-event **OG moved to `/e/`** (the link's `og:image` resolves from
  `/e/<qr_token>/opengraph-image-…`, `og:title` = the event name). (Other config-aware copy states +
  report-from-`/e/` are contract-checked/gate-verified — the only live event is the configured demo, so
  the `!isDemo` report footer can't be exercised on it.)
- **One-link consolidation — Part 2 (event-page flow redesign) SHIPPED + LIVE-VERIFIED** (commit
  `d4b0902`). The disjoint flow (share card wedged between upload + gallery; Save in a third spot) is
  fixed: header (title + host) → a quiet **[Save event] [Invite]** action row → upload (only when
  accepting) → gallery, contiguous. `GuestShare` became an **Invite trigger + dialog** (QR + copy +
  share + download folded behind one button — no inline QR mid-page); **uploads-off removes the upload
  panel entirely** (the view-only state of the one page) with a quiet "uploads closed" line; and the
  page RSC now gates `needsEmailVerification` on `accepting_uploads` too (**uploads-off wins → view-only,
  never a verify prompt** — fixes a latent require_email-on-a-closed-event awkwardness). All
  poll/optimistic/session machinery preserved; press feedback (`active:scale`) on the row buttons.
  typecheck/lint/test (201)/build green. **Chrome-MCP cross-state matrix on prod (a spun-up non-demo QA
  event, configs flipped via the Supabase MCP, signed-out + signed-in + 402px mobile):** open+uploads-on
  (row + contiguous upload→gallery), the Invite dialog (QR + copy/share/download), uploads-off
  (view-only line, no panel), password (gate → unlock → full + row), private (locked screen),
  require_email+uploads-on (VerifyEmailPrompt in the upload slot, gallery visible), **require_email +
  uploads-off (NO verify prompt → view-only, the precedence fix)**, signed-out Save (create-account
  dialog), and demo (Save hidden, Invite shown, gallery tiles contiguous). The config rework + the
  one-link follow-on are now fully COMPLETE. **Part 2's locked-but-deferred items:** none — the redesign
  shipped as the chosen "Quiet action row" with the post-upload `SaveAccountPrompt` kept.
- **Host-side media upload (two-way media flow) — SHIPPED + LIVE-VERIFIED on partyreel.com**
  (commit `06554ff`). The host can now add media directly from the event page (e.g. a photographer's
  batch), not just curate guest uploads. New `create_media_as_host` + `get_host_upload_context` RPCs
  (migration `…_host_uploads`, applied) — the AUTHENTICATED twin of the guest upload RPCs:
  `auth.uid()` + event-ownership auth, same per-file limits + cap/ingress enforcement (host uploads
  **count against the plan**), `status='approved'` always, `guest_id=NULL`. Authenticated-only
  (advisors confirm: 2 new lint-0029 entries, 0 new anon/0028). Shared `uploadFile` now takes the
  endpoint pair + identity; new `/api/host/r2/*` routes; `HostUpload` + `EventUploads` ("Add photos"
  in the Uploads card header). Rolled-back RPC contract check + `typecheck`/`lint`/`test` (191) green.
  **Chrome-MCP verified on prod (host `willg97@gmail.com`):** Add-photos toggle reveals the dropzone →
  upload → "Added to the album" → grid count 3→4; DB-confirmed the new row is `guest_id=NULL` +
  `status='approved'` with `storage_used_bytes` +103 and monthly ingress +103 (exact); the item shows
  in the public `/a/` album (guests see it); console clean. Verification artifact soft-removed (album
  back to 3).
- **Config/permissions rework — a 3-phase initiative** (master plan: access → uploads/identity →
  accounts/saved events). **Phase 1 (3-state access + Pro password protection) SHIPPED +
  LIVE-VERIFIED** (commits `ea02f32` + `c0721bc`): `events.is_public` → an `event_visibility` enum
  (`open|password|private`); Pro-only password gate (bcrypt via `set/clear_event_password`; the 9th
  anon RPC `verify_event_password`; a signed httpOnly unlock cookie; password media served only via a
  cookie-guarded server admin-read — the anon RPCs gate on `visibility='open'`); settings redesigned
  into "Visibility & access" (`ToggleGroup` + conditional password sub-panel) + "Guest uploads"
  cards; `UNLOCK_COOKIE_SECRET` set in Vercel; verified on a phone (gate + wrong-password reject +
  unlock persists across album + 12 s poll; Private locks; Open unchanged; hash absent from client
  payloads). ADR-0007. **Phase 2 (uploads & identity) IN PROGRESS — cut 2a (video = Pro-only) SHIPPED +
  LIVE-VERIFIED** (commit `6bdd0bd`). A free host's event is photos-only for guests AND the host:
  the `tier='free'` video gate sits at the top of the tier-caps block in BOTH `create_media` +
  `create_media_as_host` (authoritative); `get_upload_context`/`get_host_upload_context` gained an
  advisory `video_blocked` flag the presign routes fail fast on; the host upload picker hides video on
  Free (`videosAllowedForTier`) + a read-only "Video uploads" settings status row; pricing reframed
  (video = Pro/Event-Pass). Migration `…_phase2a_video_pro_gate` applied; advisors **UNCHANGED** (no
  new RPC/grant); rolled-back RPC contract checks pass; typecheck/lint/test (202)/build green.
  **Chrome-MCP verified on prod (host `willg97@gmail.com`, Free):** the settings "Video uploads →
  Photos only" row + upgrade link; the host picker forced to `accept="image/*"` ("Add photos", no
  video); a guest video presign on the deployed API returned **403 `video_not_allowed`** ("This event
  accepts photos only.") while a photo presign returned **200** (the guest dropzone still OFFERS video —
  the tier never leaks; rejection is server-side); pricing page shows Free = "Photos only", paid =
  "Photos and video". **Cut 2b (remove guest display names) SHIPPED + LIVE-VERIFIED** (commit
  `6d33e3b`). Dropped `guests.display_name` + `events.require_display_name`; `create_guest` is now
  2-arg `(p_qr_token, p_email)` + `get_event_by_qr_token` drops `require_display_name` (both
  DROP+CREATE+re-grant; advisors UNCHANGED; the HOST "Hosted by" byline is a separate
  `profiles.display_name` and is untouched); the just-in-time guest join is now **field-less + silent**
  (an email-only prompt remains for `require_email` events, still unverified until 2c);
  `validation/join.ts` deleted. Migration `…071249_phase2b_drop_guest_display_names`;
  typecheck/lint/test (198)/build green. **Chrome-MCP verified on prod** (on a spun-up real
  non-demo event, since willg97's only event is the configured demo): a guest file-pick triggered a
  SILENT join (NO dialog) → real `create_guest` (a guest with NO `display_name`, `email` null) → real
  upload (`guest_id` set, status approved) → gallery, with real `/api/guests` + `/api/r2/*` network
  calls (the demo event by contrast makes ZERO `/api` calls — simulated). The `guests` table is
  confirmed column-less of `display_name`; the host settings dropped the "Require a display name"
  toggle (Require email + the Video row intact). **Cut 2c (verified-email OTP + shared `<EmailSignIn>`)
  SHIPPED** (commit `2b389d6`). "Require email" is now a VERIFIED email (Supabase
  native OTP — 6-digit code primary + magic-link fallback): `create_guest` derives `user_id` + `email`
  from `auth.uid()` (require_email = a confirmed session), keeping its 2-arg signature
  (create-or-replace → no re-grant, advisors UNCHANGED, NO deploy window). New `guests.user_id`
  (account-from-guest). The require-email collection moved to a PAGE-LEVEL gate on `/e/` (swaps the
  upload slot for `<VerifyEmailPrompt>`, gallery stays); a shared `<EmailSignIn>` (hand-authored
  `input-otp`) backs both the host `/login` and the guest prompt; "Switch guest" now `signOut()`s.
  Migration `…144343_phase2c_guest_user_id_verified_email`; typecheck/lint/test (197)/build green; the
  `/login` OTP UI render-verified locally (6 slots + link fallback). **Human prereqs DONE** (Will set
  the apex `…/auth/callback**` allowlist + the `{{ .Token }}` email template; anon sign-ins stay off).
  **LIVE-VERIFIED on partyreel.com (Chrome-MCP, host willg97):** Google sign-in → `/auth/callback` →
  `/dashboard` (the login refactor is regression-safe); on a spun-up temp `require_email` event, a
  signed-out `POST /api/guests` returned **422 `email_required`** ("A verified email is required…") and
  `/e/` SSR'd the `<VerifyEmailPrompt>` (viewing still allowed), while the SAME event opened by the
  **verified** willg97 showed the **dropzone** (no prompt) → an upload **stamped `guests.user_id` =
  willg97's auth id + `guests.email`** (account-from-guest, end-to-end). `create_guest`'s
  verified-identity branch is also rolled-back-contract-proven. **OTP-length fix (caught live):** the
  Supabase "Email OTP Length" was **8**, mismatching the 6-slot input (verify would've failed); Will
  set it to **6** (Supabase's email-OTP minimum), and a new `OTP_LENGTH` constant in
  [email-sign-in.tsx](../src/components/auth/email-sign-in.tsx) now pins the input to the dashboard
  setting (hand-synced pair). The only un-pressed step is typing the 6-digit code in the OTP UI
  (`verifyOtp`) — blocked by the **built-in email rate limit** (429, handled gracefully), which the
  custom-SMTP follow-up fixes; the UI renders (6 slots) and the verified-session path is proven via the
  Google flow above. ADR-0008. **Follow-up DONE (2026-06-02):** custom SMTP wired to Resend (the
  built-in ~2/hr cap that blocked the live OTP keystroke is lifted; see Blocked-on-a-human → Resend for close-out). **Phase 3 (accounts & saved events) BUILT + gate-green — this
  COMPLETES the config rework.** A signed-in visitor can SAVE an event to their dashboard ("Saved"
  tab); it is FREE (the account-from-guest growth driver). New `saved_events` table (per-user RLS,
  both FKs `on delete cascade`) + `save_event(token)` capability RPC (authenticated-only; resolves the
  event from the page's token, refuses private/your-own, idempotent) + `get_saved_events()`
  visibility-masking read (authenticated-only; cover NULL for password/private, returns `share_token`
  NOT `qr_token` — the capability split). Advisors: **+2 authenticated (0029), 0 anon (0028)**;
  `saved_events` policied (no INFO). The **Save button is the always-visible growth lever** (shown to
  signed-out visitors too → a "create a free account to save" dialog: shared `<EmailSignIn>` + Google;
  a `pr_pending_save_` flag completes the save after a redirect sign-in), mounted on `/e/` header +
  `/a/` album footer. The post-upload `<SaveAccountPrompt>` REPLACED the newsletter `EmailCapturePrompt`
  (deleted) — account-first, newsletter opt-in folded into the save dialog. Dashboard reframed into
  "Your events" + "Saved" tabs over a shared cover-art `<EventCard>` (the whole dashboard gained
  covers). Migration `…162326_phase3_saved_events`; rolled-back RPC/RLS contract check passed;
  typecheck/lint/test (201)/build green. ADR-0009. **LIVE-VERIFIED end-to-end on partyreel.com
  (Chrome-MCP, 2026-06-02, commit `7ab930f`):** the FULL account-from-guest growth loop — a
  logged-out visitor on an album tapped **Save event** → "create a free account to save" dialog → a
  brand-NEW email → custom SMTP delivered the confirm email (**from `noreply@partyreel.com`** — Resend
  domain DNS-verified) → the link created a **new free account** (`handle_new_user`) and the
  `pr_pending_save_` flag **auto-completed the save** on return (button → "Saved"); DB-confirmed a new
  `profiles` row + `saved_events` row. Dashboard reframe renders ("Your events" empty state +
  "**Saved (1)**" tabs); the Saved card shows the **cover** + "Hosted by …" byline + unsave; **unsave**
  (✕) drops it; **masking** (event → private) renders a locked "Private event" card with NO
  cover/name/link leak; **cascade** (event deleted) auto-removed the save (DB-confirmed). Fixture (a
  temp operator-owned event) torn down. **Two config findings (NOT code) → Blocked-on-a-human:** (a)
  Supabase **"Allow new signups" must be ON at launch** (account-from-guest is dead for new users
  without it); (b) the **"Confirm signup" email template needs `{{ .Token }}`** so a new user also gets
  the 6-digit code (new-user email is link-only today → only the link path works, which it does).
- **Admin / operations portal — Round 1 (perimeter + auth foundation) SHIPPED + LIVE-VERIFIED on
  `admin.partyreel.com`.** A new portal in this SAME app: one `requireAdmin()` seam
  ([admin-context.ts](../src/lib/auth/admin-context.ts)) = `getUser()` + `is_admin` + **free TOTP
  MFA (AAL2)**; host-isolated session; the report review migrated out of `(app)/admin` into
  `/admin/reports`; Overview + Security pages. Solo-admin-now / team-later (the seam is the
  future-RBAC swap point, see SYSTEMS "Admin / operations portal"). **Chrome-MCP verified end-to-end:**
  `partyreel.com/admin` → 404 (apex never serves it); subdomain root → `/admin` → `/login` redirect;
  Google login as `hi@willgibs.com` lands on the subdomain (the `?next=` callback bug is fixed) →
  MFA enroll → AAL2 → portal; Overview/Reports/Security render; report **Dismiss + Action** work
  through `requireAdminAction` (DB-confirmed: resolved_by = admin, dismissed item's media untouched);
  console clean. Two fixes shipped during verification: the host-aware callback (commit `8c7a237`) and
  a pre-existing report-timestamp hydration error (React #418, `21a9526`); the QR render (`c44536d`).
  **Round 2 (Sentry error tracking) BUILT + gate-green** (`7d997cb`): `@sentry/nextjs` app-wide, errors
  + 10% tracing + on-error Session Replay (media-blocked, text-masked), DSN-gated no-op, manual captures
  at the swallowed paths (upload finalizer / webhook provisioning / all 7 cron sweeps / admin actions),
  everything else via `onRequestError`. Build clean under Turbopack (post-build source maps).
  **Live-verified on prod (2026-06-01):** a deliberate bad-signature webhook POST created Sentry issue
  `JAVASCRIPT-NEXTJS-2` with the `area:webhook` tag + clean PII (resolved as a test). Client Session
  Replay is configured (on-error, media-blocked) but not yet exercised by a real client error.
  **Phase 3 (support & moderation inbox) SHIPPED + LIVE-VERIFIED** (`e0903c2`): `/admin/support` +
  `/admin/applicants` triage the previously write-only `contact_submissions` + `job_applications`
  (status `new`/`in_progress`/`closed` + reply-from-inbox `mailto` + Overview count badges); reports
  gained an Open/All history filter (resolved rows read-only). Additive migration (`handled_by`/
  `handled_at` + status CHECK, RLS unchanged); advisors clean. Chrome-verified: status change
  (DB-confirmed `handled_by`/`handled_at`), filters, mailto, reports history, apex 404, no hydration
  errors. **Phase 4 (accounts & billing) SHIPPED + LIVE-VERIFIED** (`9282aa6`): `/admin/accounts` is a
  read-only host browser, search by email/name plus a detail view of tier + subscription/Event-Pass state +
  ACTIVE storage vs effective cap (and the raw `storage_used_bytes` counter) + event/media counts + a
  test/live-aware Stripe customer deep-link. No migration, no writes (the Stripe webhook stays the sole tier
  writer); the service-role reads reuse the over-capacity sweep's active-bytes query. Chrome-verified on
  `admin.partyreel.com`: both real accounts list + search-filter; willg97's detail matched Supabase exactly
  (52.5 KB active vs 2 GB cap, 2.6 MB raw counter, 1 event / 3 media), the operator's zero-state renders, both
  Stripe links resolve to the right TEST-mode customer (`cus_…`), apex `/admin/accounts` 404s, console clean.
  **Phase 5 (proactive album moderation) SHIPPED + LIVE-VERIFIED** (`d812ccc`): `/admin/albums` is the
  operator's proactive counterpart to the reactive Reports queue, a recent-uploads feed across all events
  (status-filterable) + an album drill-in (event metadata + per-status counts + the full media grid), with
  direct soft-remove (pulls from every public album/gallery instantly; the 7-day purge cron reclaims the
  bytes) + restore within the grace. Reuses the report-action soft-remove shape + the R2 presign /
  `MediaTile` / `MediaLightbox` render path; writes go through `requireAdminAction` (AAL2) + the
  service-role client. No migration, no new RPC. Chrome-verified on `admin.partyreel.com`: feed + filters +
  drill-in render; removed an approved item → DB `status='removed'` + `removed_at`, `get_public_album` 3→2
  and the public `/a/` album showed 2; restored it → 3 again, DB cleared; apex `/admin/albums` 404s; console
  clean. **Phase 6a (analytics dashboard, numbers + live revenue) SHIPPED + LIVE-VERIFIED** (`53c82b3`):
  `/admin/metrics` shows platform KPIs across four families (accounts / content+storage / engagement /
  growth) as stat cards + a live Stripe revenue card (MRR + balance, best-effort). Migration-free:
  service-role aggregator (head-counts + small fetches → pure, unit-tested reducers) + the existing
  `getStripe` client; "Media" inner-joins events to stay consistent with the active-events count.
  Chrome-verified on `admin.partyreel.com`: every KPI matched a direct Supabase cross-check (1 account /
  free, 1 event, 3 active media, 26 QR scans, 4 album views) and the revenue card matched the Stripe MCP
  (test-mode: $0 MRR / 0 subs, $0 available, $41.15 pending); apex `/admin/metrics` 404s; console clean.
  **Phase 6b (charts) SHIPPED + LIVE-VERIFIED** (`7dce416`, console fix `bb460b6`): `recharts` trend +
  distribution charts on `/admin/metrics` (signup + scans/views lines, tier / media-type / newsletter-source
  bars), grayscale + the coral accent. Per-day trends are pure builders over the SAME rows P6a fetched (no
  new query); recharts `ResponsiveContainer` is seeded with `initialDimension` (no ResponsiveContainer warning),
  and `react-is` is pinned to React 19 via a pnpm override (the zod-override pattern). Chrome-verified on
  `admin.partyreel.com`: charts render + reconcile with the KPIs (QR scans 26 / album views 4 / 1 signup /
  2 photos + 1 video), console clean. **Phase 7 (header nav dropdown + operator alerts + announcements UI)
  SHIPPED + LIVE-VERIFIED** (`b1df0d7`): the 8+ -item nav bar is now a single active-aware dropdown
  ([admin-nav.tsx](../src/components/admin/admin-nav.tsx)); a header operator-alerts bell surfaces pending
  work portal-wide (from the existing count queries); and `/admin/announcements` is an operator
  compose/publish surface (optional CTA link + scheduling + delete) writing the existing announcements
  table that hosts read via the unchanged notification bell. Migration-free (reuses DropdownMenu,
  requireAdminAction + the admin client, the RHF + zodResolver form pattern). Chrome-verified on
  `admin.partyreel.com`: nav dropdown shows the active section + all surfaces, the alerts bell matched the
  DB (all-zero → "Nothing pending"), a publish → DB host-visible → delete round-trip, apex
  `/admin/announcements` 404s, console clean. **This completes the planned admin-portal phases (R1–P7); the
  blog/help/careers CMS stays deferred (that content is edited in-repo).**
- **Marketing polish arc — R1–R4 all deployed + live-tested on partyreel.com; R5 (home pass) built + Preview-verified, deploy pending. The 5-round arc is COMPLETE.**
  Post-build-out polish in focused rounds (see ROADMAP "Marketing polish arc"). **R1** renamed the section
  to **Events** (`/use-cases` → `/events`, nav `Events ▾`; **no 301s** — old `/use-cases*` 404). **R2** built
  the **media-frame library** ([frames/](../src/components/marketing/frames): `BrowserFrame` base + `AlbumFrame`
  / `GalleryFrame` / `ReelFrame` / `PhoneFrame` / `QrFrame`) and retrofitted `/features` into 8 distinct,
  frame-rich sections (+ scrubbed 29 em-dashes). Both **deployed + Chrome-tested on partyreel.com**.
  **R3 — interactive demo** (env-gated via `NEXT_PUBLIC_DEMO_QR_TOKEN`, no schema change): a real scannable
  demo QR on the `/features` hero + a home **"Try the live demo"** CTA, and `/e/[demo qr_token]` runs in
  **demo mode** — simulated client-side uploads via the optimistic-tile path, never persisted (see SYSTEMS
  "Interactive demo"). **Verified via the gate + Preview MCP AND live on partyreel.com (Chrome MCP)**:
  typecheck/lint/**150 tests**/build green with the env UNSET; on prod (pointed at the Share Step Test event)
  the home CTA + `/features` real QR render, tapping the QR → demo event with banner + curated media, the
  just-in-time name prompt → a simulated upload prepended a `blob:` tile that **Supabase confirmed wrote zero
  new `media`/`guests` rows**, gone on refresh (console + network clean). Caught + fixed a real bug pre-deploy:
  the new public env var was added to the `env.ts` schema but not its `parsePublic()` reader, so it would've
  stayed `undefined` in prod. **Forward copy policy: no em-dashes in site/app copy** (CLAUDE.md + memory).
  **R4 — event landing-page retrofit** gave each of the 4 event pages a DISTINCT hero frame + a DISTINCT
  "Built for X" layout (bento / rows / quadrants / timeline) and turned the `/events` hub into a
  frame-preview showcase (`EVENT_PRESENTATION` + the `eventFrame()` resolver + `BuiltFor`; see SYSTEMS
  "Marketing site"), scrubbing all event-copy em-dashes (+ a no-em-dash guard, now **152 tests**). **Built +
  verified via the gate + Preview MCP** (all 4 landing pages with the right hero frame — conferences = a
  DECORATIVE QR, not `LiveQr` — + the right benefit layout, the hub's 4 frames height-aligned in a
  fixed-stage, mobile 1-col, console clean); **deployed + Chrome-tested live on partyreel.com** (all 4 pages
  + the hub render the distinct frames; conferences QR confirmed decorative). **R5 — home pass (closes the
  arc)**: the home `FeatureHighlights` teaser now leads with a `GalleryFrame` spotlight + a benefit list, and
  the Events teaser shows the shared **`EventFrameCards`** (the SAME frame-preview cards as the `/events` hub,
  single-sourced in [event-frame-cards.tsx](../src/components/marketing/event-frame-cards.tsx) so they never
  drift); scrubbed the home + site-wide footer/`site.ts` em-dashes. **Built + verified via the gate + Preview
  MCP** (both teasers, the hub unchanged by the refactor, mobile, console clean, balanced frame density —
  hero→gallery-spotlight→event-cards→reel-spotlight alternation); **deploy + Chrome spot-check pending**.
  _(Two follow-ups since shipped + deployed: (1) the **remaining-pages em-dash sweep + a durable AST guard**
  ([no-em-dash-policy.test.ts](../src/lib/no-em-dash-policy.test.ts)) — the **whole marketing surface is now
  em-dash-clean AND regression-guarded**; (2) the **`/events` hub is enriched** into a full landing page (hero
  + SEO overview + the shared cards + a cross-event benefits 4-up + an aggregate FAQ with FAQPage JSON-LD,
  single-sourced in `EVENTS_HUB`; the shared `FaqAccordion` also backs each `[slug]`) — **built + Preview-verified,
  deploy pending**. (3) the **`(app)`/`(guest)`/email em-dash sweep is DONE** — recast all ~30 in the host/guest/
  auth UI + email templates + lib errors, and **widened the AST guard to the whole app** (`app`+`components`+
  `lib`, + the `&mdash;` entity), so the ENTIRE user-facing surface is em-dash-free + regression-guarded
  (**built + verified, deploy pending**); no remaining em-dash debt. R3's demo is wired to the **Share Step
  Test** stand-in event; swapping in curated media is a pre-launch item.)_
- **Marketing site full build-out COMPLETE — all 7 rounds, deployed + live-tested on partyreel.com.**
  Expanding the scaffolded marketing site to a launch-ready full site (Features / Use cases / Help
  / Contact / Careers / Blog), designed as-if-complete (7-round plan in `.claude/plans/`). R1
  landed the IA + design foundation: a `marketing-nav.ts` single-source, a config-driven header
  (dropdown-capable) + a real mobile `Sheet` menu (there was none), a multi-column footer,
  Org/Website JSON-LD + a shared `SITE_URL`/brand constant, and two **global, shared-with-the-app**
  changes — the **#FB4817** accent (replaces the old coral) + a wider `Container` (`max-w-7xl`).
  Verified via Preview MCP (accent = exact `rgb(251,72,23)`, desktop nav + mobile Sheet + footer,
  no console errors; typecheck/lint/113 tests clean). **Round 2** added `/features` (capability
  deep-dive; `features.ts` single-source feeding the home teaser too) + elevated the highlight reel
  to a confident marquee (video-player frame), plus a global **Inter** type refresh with tighter
  heading tracking (both shared with the app). **Round 3** added the `/use-cases` hub + 4 umbrella
  landing pages (weddings / parties / conferences / trips) off one `[slug]` template — per-slug OG +
  breadcrumb/FAQ JSON-LD, a shared `album-frame`, the `Use cases ▾` dropdown — and fixed the OG
  cards' stale brand color (now single-sourced `BRAND_HEX = #FB4817`). **Round 4** shipped `/contact`:
  a deny-all `contact_submissions` table (migration `20260531090115`) written by a Server Action via
  the service-role admin client, the first react-hook-form form, and a **best-effort** Resend
  notification (`sendOnce` + `replyTo`; the DB row is authoritative — see
  [ADR-0005](adr/0005-marketing-form-submissions.md)). **Deployed + tested live via Chrome MCP** — the
  full battery passed: happy path → DB row + delivered email, validation, honeypot (no row), XSS
  stored literal + `esc()`-escaped in the email. Resend sending is set in Vercel;
  `CONTACT_NOTIFY_EMAIL=hi@willgibs.com` (displayed `help@` fixed via `SUPPORT_EMAIL`; `help@`
  receiving via forwarding is a pre-launch TODO). **Round 5** added `/careers` — a mission-focused hub
  with varied sections + 2 roles (a neutral General Application + a fully-specified, remote/equity-
  framed **Reels Engineer** owning the reel) + a deny-all `job_applications` table (migration
  `20260531171514`) reusing the R4 form pattern. **Deployed + Chrome-tested live** (the full form battery
  passed against `job_applications` — happy path → row + email, validation, honeypot, XSS-escaped).
  **Round 6** shipped the **Help center** (`/help` + `/help/[slug]`): a new in-repo **MDX content
  pipeline** (`content/help/*.mdx` + gray-matter + `next-mdx-remote/rsc` + build-time zod frontmatter
  validation — see [ADR-0006](adr/0006-mdx-content-pipeline.md)) feeding a categorized index with
  **client-side search** + per-article pages (on-this-page TOC, related articles, Breadcrumb/Article
  JSON-LD, Contact CTA); **12 launch articles**; first-party MDX components (Callout / AlbumShowcase /
  inline **spec components** reading the limits/tiers single sources) + a `prose-help`
  `@tailwindcss/typography` theme; a header **`Resources ▾`** dropdown + footer column (Help + Contact;
  Company → Careers). **No DB changes.** **Deployed + Chrome-tested live on partyreel.com** — index +
  search (results/empty), articles' prose/specs/TOC-anchors/related/JSON-LD, 404, dark mode, mobile
  Sheet, sitemap; one papercut caught + fixed live (`scroll-mt-24` so TOC jumps clear the sticky header).
  **Round 7 (Blog) — the FINAL round** — shipped **`/blog`** (date-sorted index + a client-side **tag
  filter**) + **`/blog/[slug]`** posts (byline from a client-safe **named-author registry** —
  `partyreel-team` default + `will-gibson`; reading time; TOC; related; per-post `next/og` card; **Article
  JSON-LD with a `Person` author**) + a **build-static RSS 2.0 feed** (`/blog/feed.xml`,
  `dynamic="force-static"`, hand-rolled, no dep), all reusing the R6 pipeline via a generalized
  **`collection.ts`** core (`help.ts`/`blog.ts` are now thin wrappers). **4 launch posts**; Blog joins the
  **`Resources ▾`** header dropdown + footer column. **No DB changes.** **Built + verified via Preview MCP
  + the full gate** (typecheck/lint/**148 tests**/build — build SSGs `/blog`, the 4 posts, their OG cards,
  and the feed); deploy + a Chrome spot-check pending. **The 7-round marketing build-out is complete.**
  _(Remaining tracked follow-up in ROADMAP: a Features/Use-cases quality uplift + a reusable media-frame
  component library.)_
- **Unified guest event page** (`/e/[qr_token]`) — **shipped + deployed** (commit `f073451`):
  header + just-in-time upload + a **live polling gallery** + in-page QR/share, all driven by the
  host's `is_public`/`accepting_uploads` state. Verified on **partyreel.com**: render + native
  Share (feature-detected) + the **live poll** (an injected approved photo appeared at the top
  within ~12 s, no reload) + the QR-enlarge dialog; and on localhost the **3-state matrix**
  (private-lock / accepting-off / full), the lightbox, and the optimistic-upload path. _(Real
  file-picker uploads can't be driven via the Chrome MCP — the optimistic-tile path is client-only
  logic, verified locally.)_ The album lightbox + per-item download (commit `8a4f3ae`) is also
  fully verified, incl. the host-gallery lightbox + Save while signed in.
- **The email-driven lifecycle flows are deployed but NOT yet live-verified** — over-capacity
  grace→auto-reduce, the Event-Pass renewal nudge ($15 checkout), and free-tier inactivity
  warn/remove all send via Resend, which **isn't configured yet** (see below). Verify each once
  `EMAIL_FROM` + a sending domain are set (a test email arrives + doesn't re-send; the
  grace/renewal/inactivity transitions fire).
- _(Test data on prod is disposable — host test account `willg97@gmail.com` with one "Share Step
  Test" event holding 3 seeded test media from verification; operator/admin `hi@willgibs.com`. **Note:** that
  event currently backs the live demo (`NEXT_PUBLIC_DEMO_QR_TOKEN` = its `qr_token`), so repoint the env var
  before deleting/repurposing it.)_

## Blocked on a human ("manual instrument")

The agent can't do these — they need a human in a dashboard:

- **Sentry R2 leftovers (env + capture DONE + smoke-verified).** Remaining: (1) confirm the **email
  alert rule** fires, Sentry auto-creates a default "new issue" rule and the smoke test just created
  issue `JAVASCRIPT-NEXTJS-2`, so check the inbox; if nothing arrived, add one via Sentry → Alerts →
  Create Alert → Issues + enable Settings → Account → Notifications → Issue Alerts (the MCP can't create
  alert rules). (2) The **privacy-policy** session-recording line (drafted in ROADMAP near-term) lands
  when the `/privacy` stub becomes the real policy.
- **Resend + custom SMTP for auth emails — DONE + LIVE-VERIFIED 2026-06-02.** Auth emails (OTP /
  magic link + confirm/reset) route through Resend SMTP (`smtp.resend.com:465`, sender
  `Partyreel <noreply@partyreel.com>`, 60 s min interval); "Rate limit for sending emails" raised
  2 → 100/hr (Resend's ~100/day is the real ceiling — bump at launch on paid Resend). **Verified via
  the Phase 3 save flow:** a new-signup confirm email arrived **from `noreply@partyreel.com`** (not
  `…mail.app.supabase.io`) and completed account creation — so the Resend sending domain (DNS) is
  verified, which also un-darks the transactional lifecycle email (same domain). Per-IP auth limits
  were raised (2026-06-02: "Sign-ups and sign-ins" + "Token verifications" 30 → 150 / 5 min per IP).
  Runbook + cost caveat: [`PRICING.md`](PRICING.md). **Code follow-up (roadmapped):** a 60 s cooldown
  on the OTP "Resend code" button to match the min interval. _(SMS / anonymous / Web3 limits unused.)_
- **"Allow new user signups" — DONE (ON as of 2026-06-02; keep ON for launch).** (Authentication →
  Sign In / Providers.) When OFF, `DISABLE_SIGNUP` blocks OTP, magic link, AND Google for ALL new users,
  so account-from-guest (Phase 2c verified email + Phase 3 save-to-account) AND account email+password
  create (ADR-0011, same OTP signup path) all depend on it. Keep **anonymous sign-ins OFF** (separate
  toggle, stays off per ADR-0008).
- **`{{ .Token }}` in the "Confirm signup" email template — DONE (2026-06-02).** The template now renders
  the 6-digit code (`{{ .Token }}`) above the `{{ .ConfirmationURL }}` link fallback, so a brand-NEW
  signup can complete the in-app OTP UI (not only the link). This unblocks BOTH account-from-guest and
  account email+password create (ADR-0011) — both use the same OTP confirm for new users.
- **Account password dashboard settings (ADR-0011) — DONE 2026-06-02, except leaked-password.** Set:
  "Minimum password length" = **8** (= `MIN_PASSWORD_LENGTH` in [validation/auth.ts](../src/lib/validation/auth.ts)),
  "Email OTP length" = 6, **"Secure password change" OFF** and **"Require current password when updating"
  OFF** — we enforce the current-password re-check ourselves via the `verify_current_password` RPC (so the
  session isn't disrupted; the native toggles would conflict with the two-step flow).
- **DEFERRED (pre-launch) — "Prevent use of leaked passwords" (HaveIBeenPwned).** Pro-plan-gated, so it
  waits for the Supabase Pro upgrade. This is the long-standing "leaked-password WARN" advisor, now
  ACTIONABLE since account passwords ship (ADR-0011). Enable it when upgrading to Pro.
- **Stripe test → live (before launch)** — re-create products/prices in LIVE + swap the 5 env
  vars to `sk_live_…` / live `whsec_` / live price IDs (code needs no change). Checklist:
  [`PRICING.md`](PRICING.md) "Test → Live cutover". _(Currently TEST mode, verified.)_
- **`MONTHLY_INGRESS_BYTES.pro`** is still `null` (unmetered) — tune it before Pro launch.
- **The interactive-demo event (polish-arc R3) — _pre-launch polish, NOT blocking._** `NEXT_PUBLIC_DEMO_QR_TOKEN`
  is set in Vercel + deployed, pointed at the **Share Step Test** event as a stand-in (live-tested). Before
  launch, swap it to a dedicated event with **catchy approved media** (public + accepting uploads) — its mostly
  test media (a couple solid-color photos + a color-bars video that shows black until played) is fine for now
  but not the showcase you want. Just update the env var to the new event's `qr_token` (+ `.env.local`).
- **Supabase CLI** isn't installed locally; migrations are applied via the **Supabase MCP**
  (`apply_migration`). To use `pnpm db:types` / `db:push`, install the CLI +
  `supabase link --project-ref ddafaemglzmuekbtjwzn`.

**Already done (don't redo):** R2 bucket + creds + CORS + lifecycle rule, the apex
`partyreel.com` domain, `CRON_SECRET` (Vercel), `profiles.is_admin = true` for the operator, and
the Stripe **TEST** products/prices + webhook endpoint + Billing Portal + the 5 env vars.
**Admin portal go-live (done):** Supabase TOTP MFA enabled + `admin.partyreel.com/auth/callback`
in the redirect allow-list; `admin.partyreel.com` added in Vercel (same project) with
`NEXT_PUBLIC_ADMIN_HOST` set; `hi@willgibs.com` enrolled TOTP (holds the factor). Break-glass if
the authenticator is lost: delete the factor in the Supabase dashboard (`auth.mfa_factors`).
**Sentry (R2):** the `javascript-nextjs` project + DSN + the 4 env vars are set in Vercel + deployed;
capture smoke-verified on prod (org `partyreel`).

## After any change

Advance this file, the [`SYSTEMS.md`](SYSTEMS.md) entry if a feature changed, and the
[`ROADMAP.md`](ROADMAP.md) box/backlog — same change. Re-run `get_advisors` after DDL (the
expected set is the 8 anon capability RPCs + the deny-all INFOs + the leaked-password WARN (now
ACTIONABLE post-ADR-0011 — enable HaveIBeenPwned; +2 authenticated-only RPCs `has_password` /
`verify_current_password`) — see SYSTEMS "Security & data model").
