-- Defense-in-depth CHECK on media.file_size_bytes — the stopgap half of the H1 cap-evasion fix.
--
-- WHY: a 2026-06-08 live pentest proved create_media (granted to anon, directly PostgREST-callable) trusts
-- the client's p_file_size_bytes with NO lower bound. A single anon call with a NEGATIVE size drove the
-- host's storage_used_bytes / host_active_bytes / storage_ledger to -1 TiB, since the cap meter is
-- SUM(file_size_bytes) — handing the attacker ~1 TiB of "free" headroom against a 2 GiB cap. There was no
-- CHECK on the column at all, so negative + over-ceiling values inserted freely. This constraint is the
-- belt-and-suspenders that kills the catastrophic NEGATIVE-underflow variant for BOTH create_media and
-- create_media_as_host at the table level (fires on every INSERT, regardless of role/RPC/route).
--
-- This is the IMMEDIATE, zero-collision stopgap. The full fix (make the RPCs server-only so the client can
-- never supply a size at all — the R2-HEAD size in the complete-upload route becomes the sole authority)
-- is the deferred "server-mediation" remediation tracked in docs/systems/database-security.md + the
-- security-hardening initiative; it waits behind the parallel uploader-attribution work to avoid colliding
-- on the guest-identity RPCs. The size=1 UNDERCOUNT (claim 1 byte for a real object) is NOT closed here —
-- it needs that server-only RPC change; this constraint only bounds the range.
--
-- ⚠️ int4 overflow: 10 * 1024^3 = 10,737,418,240 overflows int4 even when compared to a bigint column, so
-- the ceiling literal is forced with 10::bigint (mirrors MAX_UPLOAD_BYTES in src/lib/media/limits.ts and
-- c_max_upload_bytes in the create_media* RPCs). Range is [0, 10 GiB]; real uploads are always > 0 (the
-- complete route's headObjectSize rejects a non-positive size), and the RPCs already reject > 10 GiB —
-- this just makes the DB the floor/ceiling of record. Safe to add: prod has 0 media rows (verified).

alter table public.media
  add constraint media_file_size_bytes_range
  check (file_size_bytes >= 0 and file_size_bytes <= 10::bigint * 1024 * 1024 * 1024);
