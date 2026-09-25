# Database & security

Open this before you:
- add or change an RPC: its class, its grants, the advisor set it must leave intact;
- add a column or a table, or touch a grant;
- write a read or a function that can pass 1,000 rows;
- limit a route against abuse;
- write, prove or apply a migration.

The model is [CLAUDE.md](../../CLAUDE.md)'s: RLS is the boundary, every Server Function and route re-checks `getUser()`, and a guest
without an account holds capability tokens (the event link's `qr_token`, a guest's `session_token`) that SECURITY
DEFINER RPCs validate inside; `anon` never touches a table. A feature's own RPC semantics live in its doc.

## The RPC inventory and the advisor set

`get_advisors` (security) after every schema change reads 15 `rls_enabled_no_policy`, 5 in lint `0028` and 32 in
`0029`; the live reel's drop (`20260924110000`, held for the reel lane's alias build) takes them to 14, 4 and 27.
Leaked Password Protection is on, so its WARN never shows. A function in the wrong list means a grant slipped.

- **Anon capability reads (`0028`, and `0029` too; by design, never revoke):** `get_event_by_qr_token`,
  `get_event_media_by_qr_token`, `get_upload_context`, `get_public_profile`, and the stored reel's
  `get_event_reel_by_qr_token` until the drop. Each only READS visibility-gated state, the opaque token being the
  authorization. `get_upload_context` stays anon because every guest presign calls it.
  - ★ **An anon read never discloses more than the page it backs.** `get_event_by_qr_token` redacts the
    description, date, custom slug and host name (the name too, for `private`) from a non-owner of a gated event;
    an unlocked viewer's fields come back through a self-guarded admin re-read inside `getEventByQrToken`. Its
    switches and the reel's defaults (`accepting_uploads`, `require_verified_email`, `require_upload_to_view`,
    `show_reel`, `reel_style_id`, `reel_hold_sec`) come back unredacted, as presentation settings. A leak is fixed
    in the payload, never by revoking the grant. `get_public_profile`'s attended arm applies the album's own gates ([profiles-social.md](profiles-social.md)).
  - ★ **A RETURNS TABLE is the allow-list, and changing one is DROP + CREATE, which drops the grants:** re-grant
    `anon` and `authenticated` explicitly. `get_event_by_qr_token` also keeps the PUBLIC EXECUTE its recreates
    inherited.
- ★ **Server-mediated RPCs (service-role only, in neither list).** An anon EXECUTE on a write RPC is the attack
  surface itself: PostgREST calls it directly, past every route guard, which buys cap evasion, an unthrottled
  password oracle and victim-email poisoning. So each revokes EXECUTE from `public`, `anon` and `authenticated`, and
  its route calls it on the admin client with server-derived values (the R2-HEAD size, the `getUser()` id, the
  confirmed address from `auth.users`): `create_media`, `create_media_as_host`, `create_guest`,
  `verify_event_password`, `create_report`, `capture_guest_email`, `remove_my_upload_by_session`,
  `set_guest_display_name` and `set_guest_pending_email` (their routes are part of the gate: profanity and reserved
  names cannot be checked in SQL, and `attach_email` is limited), and `get_upload_gate`, a read kept here so no token
  can be probed through it (only `resolveViewerDecision` calls it).
  - **The upload's size is the R2 HEAD's, never the client's.** The complete seam passes the HEAD size, and
    because `create_media*` are service-role only, nobody can call them with a spoofed one: a PUT-big-claim-tiny
    upload would beat the cap. `media.file_size_bytes` mirrors the stored object and every storage meter derives
    from it (the pipeline: [uploads-and-r2.md](uploads-and-r2.md)).
- **Authenticated-only (`0029`, never `0028`: that split is the security property).** SECURITY DEFINER with
  `revoke … from public, anon` and `grant … to authenticated`, authorizing inside on `auth.uid()` and ownership:
  `get_host_upload_context`, `set_event_password` / `clear_event_password`, `set_event_slug` / `clear_event_slug`,
  `check_slug_available`, `has_password` / `verify_current_password` / `mark_password_set`, `get_my_uploads` /
  `remove_my_upload`, `claim_anonymous_uploads`, `list_guest_rows_by_email` / `claim_guest_rows_by_email` /
  `disown_guest_rows_by_email`, `restore_media` / `restore_event` / `purge_media_now`, `like_media` /
  `get_my_likes` / `get_event_like_counts`, `follow_user` / `block_user`, and the stored reel's `add_to_reel`,
  `reorder_reel`, `upsert_reel_config` and `set_reel_guest_visible` until the drop.
  - `claim_anonymous_uploads` stays browser-callable because nothing in it is spoofable: the held `session_token`s
    authorize it and `user_id is null` guards against theft.
  - ★ **The claim by address never takes an address.** The three `*_guest_rows_by_email` functions key on the
    caller's own CONFIRMED address, read from `auth.users` under definer privilege, so nothing can answer "is this
    address a Partyreel guest?", and an unconfirmed caller gets an empty set even for their own address.
  - **A like is only as visible as its media.** `like_media` accepts media the caller can see; `get_my_likes`
    re-applies that predicate, so a like on media that has since closed never presigns; `get_event_like_counts` is
    host-gated and the only count path, so no count reaches a guest.
  - ★ **The stored reel keeps two predicates** until the drop: membership (host UI, counts, `reorder_reel`'s guard)
    is `status in ('approved','hidden')`; the timeline, guests and publishing are `approved` only. An approved-only
    reorder guard would brick a reel holding hidden items.
- **SECURITY INVOKER is the default for a new read** (in neither list): a grant that reached the wrong role reads
  only that role's own rows, where a DEFINER body would read everyone's. The dashboard cards' `event_stills` (up to
  12 previewed, approved photos an event, one jsonb) is this shape, authenticated-only: another host's event is
  simply absent, and it may name only media columns the host's SELECT grant holds.
- **Service-role only, never in either list:** the server-mediated set above, `action_rate`, `purge_media_rows`,
  `record_link_hit`, `host_active_bytes`, `host_storage_summary`, `monthly_ingress_cap`, and the trigger functions,
  whose EXECUTE is revoked from the client roles and which still fire (EXECUTE is checked when a trigger is
  created, never when it fires).
- ★ **Every SECURITY DEFINER function pins `set search_path = ''` and fully qualifies every name** (`public.events`,
  `auth.users`, `extensions.crypt`): an unpinned path lets a caller shadow a name and run it as the owner. No
  DEFINER body uses dynamic SQL.
- **Deny-all tables** (RLS on, no policy, service role only: the accepted `rls_enabled_no_policy` set): `guests`,
  `reports`, `sent_emails`, `newsletter_signups`, `unlock_attempts`, `action_attempts`, `contact_submissions`,
  `job_applications`, `event_passes`, `job_runs`, `export_log` (an HMAC of the IP, never the IP), `ops_flags` (the
  kill switches), `upload_forensics` and `forensic_audit_log` (raw IP by design; the deny-all is the containment:
  [trust-safety-forensics.md](trust-safety-forensics.md)), and `reel_render_log` until the drop.

## Grants

Host table writes are column-locked ([CLAUDE.md](../../CLAUDE.md)): RLS gates the row, Supabase's default grant gives `authenticated`
every column, so a host-writable table revokes at the table level and re-grants only its columns (the traps are
under Gotchas).

- **`profiles`:** hosts write `announcements_seen_at` and `welcomed_at`, nothing else, so a new column is
  fail-closed. Never grant `email` (every transactional email goes there, so a client write is a mail-redirect
  primitive), `display_name` or `bio` (public text, written on the admin client after validation and the profanity
  check: [auth-accounts.md](auth-accounts.md)), `deletion_requested_at` (no un-request path exists), or `slug`, `tier*`, `event_slots`,
  `storage_*`, `is_admin`, `stripe_*`, `avatar_updated_at`, `password_set_at`.
- **`events`:** hosts write the settings columns and `insert(host_id)`, and `update(deleted_at)` for a soft delete
  only. `event_password_hash`, `custom_slug`, `qr_token` and `purge_at` are RPC, trigger or default only. SELECT is
  table-level (RLS scopes the rows), so a new column reads with no grant.
- **`media`:** UPDATE `status` and `removed_at` only; `purge_at` comes from a trigger; the removal provenance
  (`removed_by_uploader`, `removed_by_system`, `removed_by_admin`, `status_before_removed`) is RPC, trigger or
  service role only; `reel_eligible` is readable and written once, by `create_media*`. **SELECT is column-scoped
  too:** the hold columns and the provenance are not granted, so a host cannot detect a legal hold, an
  `authenticated` `select("*")` on media ERRORS, host reads enumerate `MEDIA_HOST_COLUMNS` (a parity test pins it
  to the grant), and a new column stays invisible to hosts until it joins both.
- **`guests`:** no client role reads or writes it; every reader is the service role or a definer function, because
  it holds `session_token` (the plaintext upload capability) and both addresses. The token also rides the
  `pr_guest_<eventId>` cookie ([guest-flow.md](guest-flow.md)), ★ as a READ capability only: every write route takes it from the body
  (`session-cookie.test.ts`), so the cookie adds no CSRF surface.
- **`media_likes`:** owner RLS on select and delete; `like_media` is the only write (a raw insert would let a user
  like, then presign through `get_my_likes`, media they cannot see).
- **`reel_items`** (until the drop): host RLS on select and delete; `add_to_reel` and `reorder_reel` (the ids must
  equal the reel's set exactly, else `stale`) are the only writes.
- ★ **TWO EMAIL COLUMNS, AND ONLY `verified_at` IS PROOF.** `guests.email` is only ever a confirmed address of the
  row's own account: `create_guest` copies the session's address only beside its `email_confirmed_at`, the claims
  write the caller's confirmed address as they stamp its `user_id`, and `capture_guest_email` fills an empty one only
  when the row's own account is the confirmed owner (it reads `auth.users` itself: a session token names a row, and
  on a shared phone that is whoever joined last). `guests.pending_email` is only ever a typed, unproved address:
  never shown, attributed, mailed on its own or expired. Only a claim that proves it moves an address across. The
  code holds the same line: `resolveUploaderIdentity` returns no address for an unverified row, `getEventGuestList`
  selects neither column, and the capture route requires `email_confirmed_at` (a bare `user.email` is satisfied by
  an unconfirmed sign-up). The one exception, `upload_forensics.guest_pending_email`, is capture-only.
- ★ **A grant cannot express a transition, so BEFORE triggers refuse the two dangerous ones.** `update(status)` would
  also buy un-remove, and `update(deleted_at)` un-delete, past the restore RPCs' guards. The triggers tell a direct
  PostgREST write (`current_user` is `authenticated` or `anon`) from an RPC or the service role (inside a DEFINER
  body it is the owner) and refuse leaving `status = 'removed'` (use `restore_media`) and clearing `deleted_at` (use
  `restore_event`); the undelete re-fires the event limit. Prefer this shape to a revoke whenever a column's
  legitimate writers are RPCs. A held row is skipped, never refused ([trust-safety-forensics.md](trust-safety-forensics.md)).
- **Value gates are CHECKs and triggers:** `events_password_requires_hash` (no `password` visibility without a hash)
  and `enforce_event_limit` (the tier's `MAX_EVENTS`, or `event_slots` when set; raises 23514). The paid gates on the
  event password and custom slug live inside their setter RPCs.
- ★ **Every capacity decision locks the host's `profiles` row `for update` first.** The cap, ingress and event-slot
  checks are check-then-act over aggregates no row lock can hold, so two concurrent uploads, restores or creates
  would each read N-1 and both admit. `create_media`, `create_media_as_host`, `restore_media`, `restore_event` and
  `enforce_event_limit` each take exactly ONE profiles lock, the host's, as their first lock, so no deadlock is
  constructible; never lock a second host's row in these bodies.
- **The guest write path inherits the read gate:** `create_guest` refuses a `private` event and requires
  `p_unlock_proven` for `password` (the server derives it: the database cannot read the unlock cookie), and
  `get_upload_context` returns `visibility` so presign and complete re-check it per request ([uploads-and-r2.md](uploads-and-r2.md)).

## Gotchas

- **A column-level `revoke update(col)` is a silent no-op while a table-level grant stands:** revoke insert, update
  and delete on the TABLE first, then grant the columns; verify with `has_column_privilege`.
- ★ **And a table-level revoke cascades to every column grant.** Right when you re-grant the whole list; a loaded gun
  when you mean to add one column, because every write naming another column then fails with "permission denied
  for table" and the host app is down. Adding a column is a bare additive `grant insert (col), update (col)`.
- **An RPC created through the Supabase MCP inherits an anon EXECUTE** (the MCP default-grant landmine) that a bare
  `revoke … from public` leaves behind. Every grant block revokes from `public` and from each client role the
  function must not keep, then grants exactly; a drop-and-recreate re-inherits the default, so it restates its
  grants in full.
- ★ **A new junction table silently breaks PostgREST embeds (PGRST201).** Two FKs to already-related tables make
  PostgREST infer a second path, and an existing bare `events!inner(...)` embed between them throws at runtime,
  invisible to typecheck, lint and build. Pin every cross-table embed to its FK
  (`events!media_event_id_fkey!inner(...)`; filters still say `events.col`); adding a table with two FKs, grep the
  embeds between those tables and check one against live PostgREST.
- ★ **A trigger's Realtime broadcast can no-op silently.** `realtime.send()` swallows its insert failure into a
  WARNING, and `realtime.messages` has no partitions until a client first subscribes, so on a project that never had
  a realtime connection a trigger's broadcast does nothing: verify with a real subscription, not SQL. The gallery
  doorbell wraps `realtime.send` in its own exception guard so a Realtime outage never fails a media write.

## Rate limits

- **Limit abuse, never volume.** An event puts a crowd behind one venue or CGNAT IP, so a per-IP volume cap 429s the
  party. The album-password unlock counts failures and clears on success (`unlock_attempts`); every other guest
  write, the exports and the reel routes ride the abuse limiter (`action_attempts` through `action_rate`), keyed on
  cross-event BREADTH (one IP touching many distinct events is a scraper; a venue is one event) with a high
  per-(IP, event) backstop. `action_attempts.kind` is free text, so a new kind needs no migration.
- **Both fail OPEN,** because a real gate stands behind each (the password; the capability or the session), and a
  failing limiter records into its own signal (`unlock_limiter`, `abuse_limiter`) so a dead one never looks idle.
- ★ **The public forms (`/contact`, `/careers`) are the one limiter that fails CLOSED:** nothing stands behind them,
  so failing open would open a pipe to the monthly email quota the breaker alerts also send on. Their scope is the
  bare IP; the check runs after the honeypot (a caught bot must not spend a shared office's budget) and before the
  insert and the send, and the swallowed error is captured where it is swallowed.
- Volumetric DoS is the Vercel edge firewall's job, not the app's; the guest OTP door is throttled only by Supabase
  Auth ([auth-accounts.md](auth-accounts.md)).

## Set-returning functions and the row cap

PostgREST cuts every table read and every set-returning RPC at `max_rows` (1,000, `[api]` in `supabase/config.toml`)
with no error; writes are not cut. The TypeScript side is `src/lib/db/read-all.ts`.
- A set-returning function pages on a keyset cursor (`p_after…` / `p_before…` on a total order) and a `p_limit`
  clamped in SQL to 1,000, or returns one row (a scalar, a `jsonb`, a `uuid[]`). ★ A null `p_limit` reads everything,
  written `limit case when p_limit is null then null else least(p_limit, 1000) end`: `least` ignores a null, so a bare
  `least(p_limit, 1000)` silently caps the unbounded call. `row-cap-sql.test.ts` holds every winning definition to
  this, each exception on its `SINGLE_ROW` or `CALLER_BOUNDED` list with its reason.
- Prefer SECURITY INVOKER; a new DEFINER function is service-role only, so the advisor lists never grow.
- ★ `readAllPages` takes a short page as the end, so the live `max_rows` must never go below 1,000.
- The shapes the row-cap fixes read, with their keys and their rolled-back checks, are in `20260924010000_row_cap_album`,
  `20260924020000_row_cap_host` and `20260924030000_row_cap_sweeps`.

## Workflow (every schema change)

1. Write the migration. It lands through the Supabase MCP's `apply_migration` (no local CLI), and the repo file is the
   applied SQL: never edit an applied migration, add a new one. `apply_migration` stamps its own version, so match a
   live migration to its file by name.
2. `get_advisors` against the set above, above all a new RPC's anon or authenticated placement.
3. Regenerate `src/lib/db/types.ts`.
4. A rolled-back RPC contract check: the RPCs inside a `DO $$ … RAISE EXCEPTION $$` block, so nothing persists.

`db/migration-guards.test.ts` and `forensics/migration-guards.test.ts` pin the load-bearing SQL facts, latest wins
across the files (a body is its last definition; grants and policies replay statement by statement), so a later
`create or replace` that drops one fails the gate. A new load-bearing fact earns a guard there.

- ★ **Pre-flight on a throwaway local cluster before handing off.** Homebrew `postgresql@17`: `initdb` into a scratch
  dir, the socket under `/private/tmp` (a scratchpad path passes the 103-byte socket limit), and `LC_ALL=C` or the
  postmaster dies "multithreaded during startup". Load a stand-in with the real column types, defaults and
  constraints of the touched tables, the Supabase roles, an `auth.uid()` / `auth.users` stub, the CURRENT bodies of
  every replaced function and the touched grants; apply the file verbatim; run the contract check, then a probe of
  the deployed build's paths under `set local role authenticated` / `anon`. It cannot see live drift, but it is the
  only thing that catches a wrong GRANT before production, and `pg_get_functiondef` before and after is a real diff to
  hand over.
- ★ **Apply before push when an RPC signature changes:** PostgREST resolves an RPC by argument NAME, so code passing a
  new argument before the migration lands fails every call.
- **Verify a hand-passed payload:** hash-compare each live `prosrc` with the repo file, collapsing whitespace before
  trimming (★ `btrim(text)` trims spaces only, so the body's edge newlines make every hash differ).
- ★ **A backfill fires no row trigger that writes another column.** `media_set_updated_at` stamps `updated_at` on
  every update, and the gallery ETag and the host's recency reads key on it: disable exactly the writing triggers,
  run the one statement, re-enable them in the same file, and prove it with a before-and-after fingerprint of the
  untouched columns. A guard fails a migration that disables a trigger without enabling it.
- **A rolled-back check rides EXISTING events:** creating one trips `enforce_event_limit`, so lock one by UPDATE,
  setting `event_password_hash` alongside for the CHECK. An `auth.users` insert inside it fires `handle_new_user`,
  which is how a check gets an unconfirmed account.
- **An unapplied migration is proved on the live schema inside `begin; … rollback;` in ONE `execute_sql` call:** the
  call returns the LAST row-returning statement's result even after the rollback, so a temp `proof` table carries
  every step to a final `select`, and each `DO` block traps its own failure (an error would skip the rollback).
