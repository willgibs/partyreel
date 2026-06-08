# ADR-0014 — Data-layer security posture (white-hat hardening)

- **Status:** Accepted + shipped (2026-06-04). The two-phase security initiative after the recovery roadmap.
- **Phase:** post-roadmap security (the plan was session-archived; the shipped result is in [CHANGELOG.md](../CHANGELOG.md) + [`../systems/database-security.md`](../systems/database-security.md)).
- **Builds on:** ADR-0004 (anonymous capability tokens), ADR-0001 (Supabase-native RLS), ADR-0007 (password unlock).

## Context

After the recovery roadmap, the founder asked for a white-hat sweep of the whole data layer: ensure no
user can escalate privileges, inject SQL, read/write another tenant's data, or poison uploads, tested as
hard as possible. A 3-agent audit + a Plan-agent validation + authoritative live DB scans found the
surface **largely sound** already: every SECURITY DEFINER RPC is `set search_path = ''` with no unsafe
dynamic SQL; `profiles` was column-locked (`tier`/`is_admin`/`storage_*`/`stripe_*` service-role-only);
RLS coverage is complete; cross-tenant scoping holds (every host RPC re-derives ownership from
`auth.uid()`, never a client `host_id`); raw R2 keys never reach the browser; the presign routes derive
the object key server-side. But the sweep surfaced **one real vulnerability** plus the remaining
least-privilege + abuse-hardening work.

## Decision

**1. Authoritative upload size (closes a real cap-evasion).** `create_media` / `create_media_as_host`
recorded the CLIENT-supplied `file_size_bytes`, and the storage-cap meter is `SUM(media.file_size_bytes)`
(`host_active_bytes()`). The presigned PUT signs only `content-type` (content-length is unconstrained),
so a scripted client could PUT a real 2 GB file and tell `/api/r2/complete-upload` it was 1 KB, defeating
the cap (and the monthly-ingress churn defense). This is the **insert-side twin of the Phase-1.5 `media`
PATCH cap-evasion**. FIX: both complete-upload routes re-derive the real size server-side via an R2 HEAD
(`headObjectSize` in [r2/presign.ts](../../src/lib/r2/presign.ts)) AFTER the object exists, and pass THAT
to the RPC (fail closed with `bad_key` if the object is missing); the client size is now an advisory
presign hint only. **`duration_seconds` / `width` / `height` stay client-supplied and are explicitly
NON-AUTHORITATIVE** — the now-authoritative byte cap is the cost boundary; the 5-minute video limit is a
soft product limit (re-deriving duration needs media parsing, not worth it). Do not treat the DB duration
check as a security boundary.

**2. Least-privilege grant sweep.** Supabase's default grant gives `authenticated`/`anon` table-level
INSERT/UPDATE/DELETE on every column; RLS gates the ROW, not which columns change. Phase 1 locked
`events`; Phase 2 swept the rest so every table's write-grant surface matches its real write paths:
`saved_events` (keep DELETE for the RLS unsave + SELECT; INSERT only via the `save_event` RPC),
`highlight_reels` (no app RLS writer), `media` (anon's moot grant), `profiles` (moot INSERT/DELETE), and
the 9 deny-all tables (every write is a SECURITY DEFINER RPC or the service-role admin client). **THE
LESSON (Phase 1's CVE root cause):** a column-level `revoke update(col)` is a SILENT NO-OP while a
table-level grant stands — you MUST `revoke insert,update,delete … from authenticated,anon` at the TABLE
level first, then re-grant the legit columns, and confirm with `has_column_privilege` + `get_advisors`.
The locked models are now `profiles`, `media`, `events`.

**3. Venue-NAT-aware unlock rate-limiter.** The album-password unlock endpoint had no rate-limiting
(4-char passwords are brute-forceable by anyone with the public link). A naive per-IP limit would lock
out a venue crowd sharing ONE WiFi NAT/CGNAT IP. DESIGN: count ONLY FAILED attempts, and a SUCCESS clears
that IP's failures. Legit guests entering the correct shared password SUCCEED (never counted), and their
successes keep clearing any attacker's failures on the shared IP; a lone remote attacker (no successes)
accumulates failures and gets a 429. A high per-event GLOBAL cap backstops distributed/botnet attacks.
Storage is the deny-all `unlock_attempts` table (service-role only); only HMAC hashes of the qr_token +
(qr_token+ip) are stored (no raw IP/token — privacy), pruned daily by the cron. The limiter is
defense-in-depth: it FAILS OPEN on any error (bcrypt + the generic 401 remain the password gate), and the
4-char password minimum stays (the limiter is the defense). Pure decision in
[unlock-rate-limit.ts](../../src/lib/security/unlock-rate-limit.ts); the HMAC + DB counters in the
server-only [unlock-rate-limit-store.ts](../../src/lib/security/unlock-rate-limit-store.ts).

## Verification

- **Phase 1 (`events`):** a 16/16 rolled-back contract matrix (the CVE columns
  `event_password_hash`/`custom_slug`/`qr_token`/`purge_at`/`host_id`/`require_email`(free) + DELETE flip
  to permission-denied; createEvent/updateEvent/softDelete + the `set_event_purge_at` /
  `enforce_event_pro_gates` triggers + the `events_password_requires_hash` CHECK intact) + a LIVE
  authenticated HTTP-PATCH proof (403 on every forbidden column, 204 on a granted one).
- **Phase 2:** a LIVE size-spoof proof (a `size_bytes:1` complete stored the real 50 KB); a post-sweep
  `has_*_privilege` snapshot (only `saved_events`=DELETE remains; SELECT untouched; `file_size_bytes`
  still blocked) with advisors UNCHANGED; a LIVE unlock 429/clear proof (20 wrong → 429 + `Retry-After:
  900`; 3 wrong + correct → 200 + the IP's failures cleared to 0); a 15/15 rolled-back matrix (privilege
  escalation — tier/is_admin/storage/stripe unwritable; cross-tenant — host B can't read/write/restore/
  purge host A's data via any RPC or RLS); an authoritative function scan (every secdef fn `search_path=''`,
  no unsafe dynamic SQL).

## Consequences

- The host's direct write surface everywhere now matches exactly what the app legitimately writes;
  everything else flows through SECURITY DEFINER RPCs (owner context) or the service-role admin client.
- **Deferred (a future edge/abuse-hardening pass — logged in the plan):** per-IP rate-limiting for the
  other anon-ish endpoints — `create_report` (report spam) and the presign routes (dangling multipart
  orphans). Not blocking; noted so it isn't lost.
- `unlock_attempts` is deny-all, so it adds the expected `rls_enabled_no_policy` INFO advisor (the same
  accepted class as `sent_emails`/`reports`/etc.). No new 0028/0029 findings from any Phase 2 change.
