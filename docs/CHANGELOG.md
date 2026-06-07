# Partyreel — Changelog (shipped history)

> ROLE: the shipped-history archive — what shipped, when, with what commit + verification. Read this for "when/how did X ship," NOT to learn how the system works today.
> BELONGS HERE: dated, per-initiative shipping + verification narratives. · NOT HERE: how the system works now (→ [`systems/`](systems)), what's next (→ [`ROADMAP.md`](ROADMAP.md)), current state (→ [`STATUS.md`](STATUS.md)), why-decisions (→ [`adr/`](adr)).
> GROWS BY: append (newest on top). This is the ONE deliberately append-only doc — it is kept OFF the orient path, so its length never muddies a fresh agent.

Dates are when the work was shipped + verified on partyreel.com (test data is disposable). Commits are
included where recorded; the full original prose lives in git history. The foundational build (Phases
0–4 + 6) is summarized at the bottom.

---

## 2026-06-07 — Documentation consolidation (in progress)

- **Phase 1 — system reference layer** (`be7dd8e`): added `docs/systems/` (12 per-system reference docs +
  a folder index, +1,146 lines) holding the per-system gotchas/invariants, each with a maintenance-contract
  header. Additive (no existing doc changed). Gate-verified (286 links resolve, all landmine keywords
  present) + validated by fresh subagents constrained to `docs/systems/` (3 trap tests refused+cited; a
  targeted plan navigated correctly). Master plan: the docs-consolidation initiative (keep all knowledge,
  restructure so CLAUDE.md stays lean + depth loads on demand).

## 2026-06-06 → 06-07 — Media durability (ADR-0013): all 3 pillars

- **Pillar A — orphan-sweep circuit-breaker** (`6f151c5`): the cron's orphan sweep now deletes nothing +
  alerts (Sentry + a deduped operator email) when `media` is empty or the orphan set is pathological, so a
  DB fault can't wipe the un-backed-up R2 bucket.
- **Pillar B — real-time media backup** (`workers/backup/`, 2026-06-06): a Cloudflare Worker (R2
  `object-create` → Queue → consumer + a daily reconciliation `scheduled()`) copies every `events/` object
  to a Bucket-Locked 2nd R2 bucket (WNAM, IA, ≥35-day WORM). DR-drill-verified: ~15 s replication, the lock
  blocks deletion, restore works, >100 MB multipart copy byte-identical. Workers Paid ~$5/mo, zero egress.
- **Pillar C — off-site DB backup** (2026-06-07): a nightly `pg_dump` → `partyreel-backup/db/` via
  [`db-backup.yml`](../.github/workflows/db-backup.yml), restore-verified (every table's row count matched
  prod into a throwaway Postgres 17); hardened with a post-upload byte-size verify + Node-24 opt-in.
  Findings: R2 has no native versioning/replication; Bucket Lock GA + free; R2↔R2 egress free.

## 2026-06-06 — Infrastructure ownership migration → partyr33l@gmail.com ("P3")

Every backing service moved off the founder's personal accounts to the dedicated owner account P3:
Supabase (project ref unchanged, now P3 "Partyreel Team" Pro org), Cloudflare R2 (new account, bucket
re-created), Stripe (same acct, ownership transferred), Sentry (same org, ownership transferred), Resend
(new acct, domain re-verified), Google OAuth (new client), and the in-app operator (`partyr33l@gmail.com`
= is_admin + MFA; `hi@willgibs.com` retired). Verified live (Google + email-OTP sign-in, R2 upload, Stripe
upgrade→downgrade, admin AAL2). Deferred: Vercel hosting (willgibs Hobby → P3 Pro at launch), domain + DNS
(GoDaddy → P3 Cloudflare), GitHub repo (→ P3 at sale).

## 2026-06-04 — Security hardening (ADR-0014)

- **Phase 1 — events write-grant lockdown** (migration `…163011`, `ba8c08f`): closed a live CVE — `events`
  kept Supabase's default grant, so a free host could PATCH `event_password_hash`/`custom_slug`/
  `require_email`/`qr_token`/`purge_at` to steal Pro features. Root-cause lesson: a column-level
  `revoke update(col)` is a SILENT NO-OP while a table-level grant stands (the prior column-revokes did
  nothing; `has_column_privilege` confirmed all 17 columns writable). Fix mirrors the media/profiles
  column-lock + trigger-derived `purge_at` + the `enforce_event_pro_gates` trigger +
  `events_password_requires_hash` CHECK. Verified by a 16/16 rolled-back matrix + a LIVE authenticated PATCH
  (every forbidden column → 403; a granted column → 204).
- **Phase 2 — broad white-hat sweep** (`cc5671e`/`9ba3a80`/`3cc3489`, migrations `…175656`/`…180225`):
  least-privilege grant sweep across ALL tables; closed an **upload size-spoof cap-evasion** (re-derive the
  real `file_size_bytes` from an R2 HEAD at complete — proven live: a `size_bytes:1` upload stored the real
  50 KB); a **venue-NAT-aware unlock rate-limiter** (count failures + clear-on-success; deny-all
  `unlock_attempts`; proven live: 20 wrong → 429 + Retry-After 900, correct → cleared). 15/15 rolled-back
  matrix; advisors unchanged.

## 2026-06-03 → 06-04 — Recovery / "Recently deleted" (Phases 1–5 of 6)

- **Phase 1 — cap-meter refactor** (`23bc5a0`): the cap enforces against ACTIVE bytes
  (`host_active_bytes()` = non-removed media in non-deleted events), so deleting frees cap room
  immediately; `storage_used_bytes` becomes the physical-only meter.
- **Phase 1.5 — security hotfix** (`cde3dc6`): locked `media` writes to the moderation columns only
  (the default grant let a host PATCH `file_size_bytes=0` to beat the cap).
- **Phase 2 — unified window + standby budget**: ONE 30-day window (`RECENTLY_DELETED_WINDOW_DAYS`);
  `media.purge_at` trigger-derived (un-spoofable); an 8th cron sweep `sweepStandbyBudget` bounds
  deleted-but-stored bytes to 1× the cap (oldest-first).
- **Phase 3 — restore/purge RPCs**: `restore_media`/`restore_event`/`purge_media_now` (authenticated,
  ownership-gated; capacity-gated against the BASE cap; all-or-nothing event restore; jsonb `{ok,reason}`).
- **Phase 4 — host bin UI**: a dashboard "Recently deleted" events tab + a per-event removed-media section;
  the storage meter now shows ACTIVE bytes. Live-verified (meter reads 52.5 KB active not 2.6 MB physical;
  restore-at-cap refused with the exact "Free up X" toast).
- **Phase 5 — recovery notifications + email copy**: a `recovery_clearing` bell alert
  (`RECOVERY_PURGE_NUDGE_DAYS`=7); system-removal emails point to the in-app self-serve restore.
- **Phase 6** (pre-launch test-data hard reset) deferred to the launch checkpoint.

## 2026-06-03 — 404 / not-found pages

Five audience-aware `not-found.tsx` (root + per route group) sharing one animated core
(`NotFoundScreen` + single-sourced `MarketingNotFound`); fixed a live-caught double-chrome stacking bug
(the `(marketing)/not-found.tsx` boundary renders content-only). Live-verified: all five render, every
variant 404 + `noindex`, no leak.

## 2026-06-03 — Upload thumbnail previews + custom event slug

- **Upload thumbnails** (`04ab35b`/`238bee9`): camera-roll thumbnail previews on the upload queue,
  extracted to a shared `UploadThumbnail` (guest + host), routed through `videoPosterSrc()`. Live-verified.
- **Custom event slug** (ADR-0012, Phases 1+2): Pro/Event-Pass `/e/<slug>` alias (the permanent
  `/e/<qr_token>` + QR unchanged); `set_event_slug`/`clear_event_slug` (authenticated-only, tier-gated);
  `get_event_by_qr_token` resolves slug-or-token → canonical token; `EventSlugControl` with debounced live
  availability (`check_slug_available`) + change/remove warning + suggestion chip. Live-verified; a
  corrective migration revoked an MCP-default `anon` grant (the "MCP RPCs inherit anon EXECUTE" lesson).

## 2026-06-02 — Profile photos, display names, account password

- **Profile photos + display names** (3-part, migration `…213758`): avatar upload (cropper → 512px WebP →
  `POST /api/account/avatar` → deterministic `avatars/<id>/avatar.webp`, zero orphans by construction); the
  `/account` display-name editor (dropped the email-prefix fallback + a one-time backfill); the guest
  "Hosted by" avatar+name byline. Live-verified (R2 held at exactly 1 object through replace; 415/422 on
  bad bytes).
- **Account email + password** (ADR-0011, migrations `…200420` + `…210158`): a traditional email+password
  login alongside OTP/magic-link/Google. Headline live catch: GoTrue writes a non-null bcrypt PLACEHOLDER
  for OTP/magic-link signups, so the first `has_password()` mislabeled OTP-origin hosts → fixed with a
  service-role `password_set_at` flag stamped by `mark_password_set()`. Full Chrome-MCP matrix verified
  (create → set → login; generic anti-enumeration error; CHANGE-mode re-check; OTP-origin add-password).
- **Resend custom SMTP**: auth emails route via Resend SMTP (lifts the built-in ~2/hr cap that blocked live
  OTP); per-IP auth limits raised 30 → 150 / 5 min.

## 2026-06-01 → 06-02 — Config / permissions rework (ADR-0007/0008/0009)

- **Phase 1 — 3-state access + Pro password** (`ea02f32`+`c0721bc`, ADR-0007): `is_public` → an
  `event_visibility` enum (open/password/private); Pro password gate (bcrypt via
  `set/clear_event_password`; the anon `verify_event_password`; a signed unlock cookie; password media via a
  cookie-guarded server admin-read). Phone-verified.
- **Phase 2a — video Pro-only** (`6bdd0bd`): a `tier='free'` video gate at the top of the tier-caps block
  in both upload RPCs + an advisory `video_blocked` flag. Live-verified (guest video presign → 403).
- **Phase 2b — drop guest display names** (`6d33e3b`): removed `guests.display_name` +
  `events.require_display_name`; `create_guest` → 2-arg; the just-in-time join is now field-less + silent.
- **Phase 2c — verified-email OTP** (`2b389d6`, ADR-0008): "require email" = a verified email (native OTP);
  `create_guest` derives identity from `auth.uid()`; new `guests.user_id` (account-from-guest); a shared
  `<EmailSignIn>`. Caught live: the Supabase Email-OTP length was 8 vs a 6-slot input → pinned to 6
  (`OTP_LENGTH`).
- **Phase 3 — saved events** (`7ab930f`, ADR-0009): a signed-in visitor can save any event (FREE growth
  driver); `save_event`/`get_saved_events` (authenticated-only; visibility-masked); the always-visible Save
  button + the post-upload `<SaveAccountPrompt>` (replaced the newsletter prompt). Full account-from-guest
  loop live-verified end-to-end.

## 2026-06 — One-link consolidation (ADR-0010) + host upload

- **One link per event** — Part 1 (data + routing, `37707d8`): collapsed the two-token model to
  `/e/[qr_token]`; dropped `get_public_album` + the `share_token` column + the `/a/` route (anon advisor
  list 9 → 8). Part 2 (flow redesign, `d4b0902`): header → `[Save event] [Invite]` action row → upload →
  gallery, contiguous; uploads-off = the view-only state; `needsEmailVerification` gated on
  `accepting_uploads`. Full cross-state matrix live-verified.
- **Host-side media upload** (`06554ff`): the host adds media from the event page via `create_media_as_host`
  (authenticated twin of `create_media`; counts against caps; `status='approved'`; `guest_id=NULL`). Shared
  `uploadFile` + `/api/host/r2/*`. Live-verified (new row `guest_id=NULL`, `storage_used_bytes` +103).
- **Unified guest event page** (`f073451`) + the album lightbox + per-item download (`8a4f3ae`).

## 2026-06-01 → — Admin / operations portal (R1–P7)

Served on `admin.partyreel.com` by the same app; one `requireAdmin`/`requireAdminAction` seam + free TOTP
MFA (AAL2); host-isolated cookies.
- **R1 — perimeter + auth** (`8c7a237` host-aware callback, `21a9526` #418 fix, `c44536d` QR): subdomain
  routing, the seam, lockout-proof MFA, `AdminShell`, report review moved to `/admin/reports`.
- **R2 — Sentry** (`7d997cb`): `@sentry/nextjs` app-wide, DSN-gated no-op, on-error Session Replay
  (media-blocked, text-masked), manual captures only at swallowed paths. Live-verified via a deliberate
  bad-signature webhook → issue with `area:webhook` + clean PII.
- **P3 — support & moderation inbox** (`e0903c2`): `/admin/support` + `/admin/applicants` triage +
  Reports Open/All filter.
- **P4 — accounts & billing** (`9282aa6`): read-only host browser + tier/sub/active-storage/Stripe deep-link.
- **P5 — proactive album moderation** (`d812ccc`): cross-event uploads feed + drill-in + soft-remove/restore.
- **P6 — metrics** (`53c82b3` numbers + live Stripe revenue; `7dce416`/`bb460b6` recharts charts).
- **P7 — nav dropdown + operator-alerts bell + announcements compose/publish** (`b1df0d7`). The
  blog/help/careers CMS was deferred (content stays file-based).

## 2026-05 — Marketing site build-out + polish arc

- **7-round build-out**: foundation (nav single-source, config-driven header + mobile Sheet, footer,
  JSON-LD, the `#FB4817` accent) · `/features` · `/events` (hub + 4 type pages) · `/contact` (ADR-0005) ·
  `/careers` · `/help` (the MDX content pipeline, ADR-0006) · `/blog` (+ RSS, on the generalized
  `collection.ts` core). All deployed + Chrome-tested.
- **Polish arc (5 rounds + follow-ups)**: "Use cases" → "Events"; the media-frame library +
  `/features` retrofit; the interactive demo (env-gated `NEXT_PUBLIC_DEMO_QR_TOKEN`); event landing-page
  retrofit; the home pass; the enriched `/events` hub; and the whole-app em-dash sweep + the AST guard
  (`no-em-dash-policy.test.ts`).

## Foundational build (Phases 0–4 + 6) — pre-2026-06

The v1 foundation: the Supabase-native data layer + RLS (ADR-0001), the single-app route groups
(ADR-0002), browser→R2 presigned uploads (ADR-0003), anonymous-guest capability tokens (ADR-0004), host
auth + the create flow, guest join/upload + galleries, moderation + the purge-cron lifecycle, the
storage-cap tier model + Stripe (Pro subs, Event Pass, portal), and the growth loop (SEO + guest email
capture) + link analytics + the notification center. Full detail is in git history + the ADRs.
