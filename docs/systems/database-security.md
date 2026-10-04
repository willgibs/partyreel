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

`get_advisors` (security) after every schema change reads 19 `rls_enabled_no_policy`, 4 in lint `0028` and 36 in
`0029`.
Leaked Password Protection is on, so its WARN never shows. A function in the wrong list means a grant slipped.

- **Anon capability reads (`0028`, and `0029` too; by design, never revoke):** `get_event_by_qr_token`,
  `get_event_media_by_qr_token`, `get_upload_context` and `get_public_profile`. Each only READS visibility-gated
  state, the opaque token being the authorization. `get_upload_context` stays anon because every guest presign calls
  it.
  - ★ **An anon read never discloses more than the page it backs.** `get_event_by_qr_token` redacts the
    description, date, custom slug and host name (the name too, for `private`) from a non-owner of a gated event;
    an unlocked viewer's fields come back through a self-guarded admin re-read inside `getEventByQrToken`. Its
    switches, the reel's defaults and the host's per-file cap (`accepting_uploads`, `require_verified_email`,
    `require_upload_to_view`, `show_reel`, `reel_style_id`, `reel_hold_sec`, `accepts_video`, `max_upload_bytes`) come
    back unredacted, as presentation settings. A leak is fixed
    in the payload, never by revoking the grant. ★ To an account or confirmed address the event blocked, it reads the
    event as `private`, so every caller's private branch serves the block ([guest-flow.md](guest-flow.md)). `get_public_profile`'s attended arm applies the album's own gates ([profiles-social.md](profiles-social.md)).
  - ★ **A response the edge shares asks with NO caller.** A public `Cache-Control` hands the first viewer's answer
    to every next one, and these reads answer a session personally (the block above), so a shared response reads
    through `createAnonClient` (`lib/supabase/anon.ts`: the publishable key, no session, no cookie), never the
    request client; the share card drew a blocked viewer's answer behind a public cache once
    ([guest-flow.md](guest-flow.md)). A response that must differ per viewer is `private, no-store`.
  - ★ **A RETURNS TABLE is the allow-list, and changing one is DROP + CREATE, which drops the grants:** re-grant
    `anon` and `authenticated` explicitly, and revoke from `public`: the four hold EXECUTE by name, and no function
    in `public` holds PUBLIC's.
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
  `remove_my_upload`, `claim_anonymous_uploads` / `claim_ticket_asks` / `claim_asked_uploads`,
  `list_guest_rows_by_email` / `claim_guest_rows_by_email` /
  `disown_guest_rows_by_email`, `restore_media` / `restore_event` / `purge_media_now` / `empty_deleted` (Empty Deleted, a batch a call), `like_media` /
  `get_my_likes` / `get_event_like_counts`, `follow_user` / `block_user`, the per-event block's two host acts,
  `block_from_event` / `let_back_in`, and the door's four, `set_event_door` / `let_in_at_door` / `add_event_invites` /
  `remove_event_invite` ([guest-flow.md](guest-flow.md)).
  - The three claims by ticket stay browser-callable because nothing in them is spoofable: the held `session_token`s
    authorize them, `user_id is null` guards against theft, and ★ one rule, `whose_ticket`, decides whose each ticket
    is, so on a shared phone a stranger's typed address never moves and a stranger's typed name moves only on the
    account's own answer ([guest-flow.md](guest-flow.md)). `claim_ticket_asks` also answers which held tickets were
    typed under an address that is not the caller's, WHETHER and never WHAT (no address, album or id leaves).
  - ★ **The claim by address never takes an address.** The three `*_guest_rows_by_email` functions key on the
    caller's own CONFIRMED address, read from `auth.users` under definer privilege, so nothing can answer "is this
    address a Partyreel guest?", and an unconfirmed caller gets an empty set even for their own address. Its answer is
    the allow-list: names, counts, the event's door and up to four of the row's own approved preview keys from an open
    album, never the album's link (a claim's follow-up read gives that, for an event the caller is now a guest of).
  - **A like is only as visible as its media.** `like_media` accepts media the caller can see, and on a private album
    only its host's like (every guest of one gets the not_found a blocked account gets, so a known photo id tells
    neither apart); `like_many` (authenticated, SECURITY INVOKER, at most 2,000 ids a call) sends each id through it,
    so `like_media` stays the only insert; `get_my_likes` re-applies that predicate, so a like on media that has since
    closed never presigns.
    The counts are host-only through two paths, `get_event_like_counts` and `media_like_counts`, so no count reaches
    a guest. ★ And a count only for a row she can meet: `get_event_like_counts` (hers to call straight through
    PostgREST) leaves out an operator's removal, an asked row and a withdrawal, restating `media_host_all`'s own
    conjuncts (a DEFINER count cannot inherit the policy, so a guard holds it to the policy's latest USING);
    `media_like_counts` is asked only for ids her RLS read returned.
- **SECURITY INVOKER is the default for a new read** (in neither list): a grant that reached the wrong role reads
  only that role's own rows, where a DEFINER body would read everyone's. The dashboard cards' `event_stills` (up to
  12 previewed, approved photos an event, one jsonb) is this shape, authenticated-only: another host's event is
  simply absent, and it may name only media columns the host's SELECT grant holds.
- **Service-role only, never in either list:** the server-mediated set above, `action_rate`, `article_feedback_summary`
  (an INVOKER read, one jsonb, behind the admin seam), `purge_media_rows`,
  `record_link_hit`, `host_active_bytes`, `host_storage_summary`, `leave_deleted` (the over-capacity deadline's first
  step, a batch a call), `tier_limits` and `monthly_ingress_cap` (INVOKER;
  every other caller is a DEFINER body), the paged album's reader
  `album_changes_since` (an INVOKER read the Next routes call after their own capability check) and its log's prune
  `album_prune_tombstones` (DEFINER: the tables grant the service role SELECT only), the develop's `develop_due` and
  `develop_due_sweep` (DEFINER: they write `sealed_until`, which no role holds; [disposable-mode.md](disposable-mode.md)),
  `media_like_counts`
  (an INVOKER read the host's links route and the hub page call after their `getEvent` check), the per-event block's
  reads (`event_ticket_blocked` and `event_blocked_guest_ids`, INVOKER; `blocked_events_for`, DEFINER because it
  reads `auth.users`, which the service role cannot) and its four predicates (INVOKER, run inside the guest paths'
  DEFINER bodies), the claims' `whose_ticket` (the same shape), and the trigger
  functions, whose EXECUTE is revoked from the client roles and which still fire (EXECUTE is checked when a trigger
  is created, never when it fires).
- **The owner's alone** (revoked from the service role too, so no role PostgREST serves can call them): helpers only
  a definer body reads, `event_door_asks` (a set no request can page) and `event_account_ticket` (a whole guest row,
  its ticket in it), Deleted's one definition `host_deleted_media` and the upload's line `host_room_used` (both
  SECURITY INVOKER, read only by the four capacity bodies), and the develop's five (`album_bits`, `album_doorbell`, `seal_disagrees`, `guest_roll`,
  `develop_rows`).
- ★ **Every SECURITY DEFINER function pins `set search_path = ''` and fully qualifies every name** (`public.events`,
  `auth.users`, `extensions.crypt`): an unpinned path lets a caller shadow a name and run it as the owner. No
  DEFINER body uses dynamic SQL.
- **Deny-all tables** (RLS on, no policy, no client grant, service role only: the accepted `rls_enabled_no_policy`
  set): `guests`, `reports`, `sent_emails`, `newsletter_signups`, `unlock_attempts`, `action_attempts`,
  `contact_submissions`, `job_applications`, `event_passes`, `job_runs`, `export_log` (an HMAC of the IP, never the
  IP), `ops_flags` (the kill switches), `upload_forensics` and `forensic_audit_log` (raw IP by design; the deny-all is
  the containment: [trust-safety-forensics.md](trust-safety-forensics.md)), `album_state` and `album_changes` (the
  paged album's versions and change log: service_role SELECT only, written by the deferred triggers and the log's
  prune alone), `camera_rolls` (the camera's ledger, service_role SELECT only, written by `create_media` alone),
  `article_feedback` (the help center's feedback beacon: a slug, Yes or No and a time, no identity of any kind), and
  `storage_ledger` (the monthly ingress meter: its readers are the upload gates, DEFINER, and the service role).

## Grants

Host table writes are column-locked ([CLAUDE.md](../../CLAUDE.md)): RLS gates the row and the grant names the
columns. A table created before `20260929160000` took Supabase's default grant of everything to `authenticated`, which
is why each host-writable one revokes at the table level and re-grants only its columns (the traps are under Gotchas);
a table created since starts with no client grant, so its migration grants exactly what its callers use.

- **The client roles hold only what their callers use** (`20260929160000`). `anon` holds no privilege on any table:
  it reads through the four capability RPCs, every policy is `to authenticated`, and an anon table read is a 42501.
  `authenticated` holds SELECT and its writes only on a table a policy serves, and TRUNCATE, REFERENCES, TRIGGER and
  MAINTAIN (Supabase's latent default; PostgREST issues none) on none.

- **`profiles`:** hosts write `announcements_seen_at`, `welcomed_at` and `make_room_from_deleted`, nothing else, so a new column is
  fail-closed. Never grant `email` (every transactional email goes there, so a client write is a mail-redirect
  primitive), `display_name` or `bio` (public text, written on the admin client after validation and the profanity
  check: [auth-accounts.md](auth-accounts.md)), `deletion_requested_at` (no un-request path exists), or `slug`, `tier*`, `event_slots`,
  `storage_*`, `is_admin`, `stripe_*`, `avatar_updated_at`, `password_set_at`.
- **`events`:** hosts write the settings columns and `insert(host_id)`, and `update(deleted_at)` for a soft delete
  only. `event_password_hash`, `custom_slug`, `qr_token` and `purge_at` are RPC, trigger or default only. SELECT is
  table-level (RLS scopes the rows), so a new column reads with no grant.
- **`media`:** UPDATE `status` and `removed_at` only; `purge_at` and `let_in_at` (the approval toast's news) come
  from triggers; the removal provenance (`removed_by_uploader`, `removed_by_system`, `removed_by_admin`,
  `status_before_removed`) is RPC, trigger or service role only; `reel_eligible` is readable and written once, by
  `create_media*`. **SELECT is column-scoped too:** the hold columns, the provenance and `let_in_at` are not
  granted, so a host cannot detect a legal hold, an `authenticated` `select("*")` on media ERRORS, host reads
  enumerate `MEDIA_HOST_COLUMNS` (a parity test pins it to the grant as the migrations leave it, drops replayed, so a
  column leaves the list before its drop lands), and a new column stays invisible to hosts until it joins both.
  ★ `media_host_all`'s USING also leaves out an operator's removal (`status = 'removed' and removed_by_admin`): a
  policy may test a column its role cannot SELECT, so the host loses the row on every read and write without ever
  reading the flag ([lifecycle-recovery.md](lifecycle-recovery.md)).
- **`guests`:** no client role reads or writes it; every reader is the service role or a definer function, because
  it holds `session_token` (the plaintext upload capability) and both addresses. The token also rides the
  `pr_guest_<eventId>` cookie ([guest-flow.md](guest-flow.md)), ★ as a READ capability only: every write route takes it from the body
  (`session-cookie.test.ts`), so the cookie adds no CSRF surface.
- **`event_blocks`:** the host SELECTs its own events' rows (RLS) and nothing else: no client role writes it (the
  two acts do) and `anon` reads nothing.
- **`media_likes`:** owner RLS on select and delete; `like_media` is the only write (a raw insert would let a user
  like, then presign through `get_my_likes`, media they cannot see).
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
  and `enforce_event_limit` (the tier's `MAX_EVENTS`, or `event_slots` when set; raises 23514). A column the host
  writes straight through PostgREST carries the app's own bound, since her session passes no schema:
  `events_name_len` (1 to 80) and `events_description_len` (at most 2,000) mirror `validation/event.ts` under a parity
  guard, and `events_qr_style_len` (1 to 32) is an envelope, never the preset list, so a new preset needs no
  migration. A paid gate on an event setting lives inside its setter RPC, mirroring `GATED_EVENT_SETTINGS` (none
  today: [billing-caps.md](billing-caps.md)).
- ★ **Every capacity decision locks the host's `profiles` row `for update` first.** The cap, ingress and event-slot
  checks are check-then-act over aggregates no row lock can hold, so two concurrent uploads, restores or creates
  would each read N-1 and both admit. `create_media`, `create_media_as_host`, `restore_media`, `restore_event` and
  `enforce_event_limit` each take exactly ONE profiles lock, the host's, as their first lock, so no deadlock is
  constructible; never lock a second host's row in these bodies. `leave_deleted` and `empty_deleted` take the host's
  row first too, and the restores take it before the item's, so a restore and an upload making room never act on one
  row at once.
- ★ **A mint of an ask reads the door under the event row's share lock** (`create_guest`, `ask_to_join`,
  `20260930100000`). Every move of the door writes that row (`set_event_door` locks it `for no key update`,
  `set_event_password`'s update takes the same lock), and the triggers that end or admit the asks read only what has
  committed, so an unlocked join minted in the move's instant was never seen by them. The share lock is each body's
  first, taken holding nothing, and joins never wait on each other but for one account's at one album: a confirmed
  join takes an advisory lock on the two after it (`event_account_ticket`) and answers the ticket she holds, so two
  of hers that race answer one row. A new body that mints a waiting ticket takes the share lock too
  (`migration-guards.test.ts` refuses one that does not).
- ★ **An album's version row is every transaction's LAST lock** (`20260926100000_album_version`). A per-event
  counter taken mid-transaction would sit between locks the writers already order differently (`purge_media_rows`
  locks media before profiles, `create_media` profiles first, a multi-event disown, claim or sweep touches events in
  row order) and could close a cycle. So the album's immediate triggers only note event ids in transaction-local
  settings, and its DEFERRED constraint triggers write at COMMIT, the first bumping every event the transaction
  touched in ONE pass in event-id order: a transaction holding an album row waits on nothing but album rows, and
  every commit phase takes them in one order. Each table's note trigger sorts before its stamp by name
  (`*_album_note` < `*_album_stamp`), which a `set constraints all immediate` path depends on. A new writer of
  `album_state` or `album_changes` goes through that flush or not at all (a guard refuses any other writer), but for
  the log's prune (`album_prune_tombstones`, 20261001150000), a transaction of its own that holds nothing else and
  takes each album's version row before its change rows, album by album in event-id order.
- ★ **A write that holds an event row never waits on a media row** (`20261002200000`). A host's save of `develops_at`
  rewrites the album's sealed rows inside her UPDATE, so it takes only the media rows it can lock at once (SKIP
  LOCKED, the next read healing the rest), and no upload and no develop locks the event row: each closed deadlock
  cycles with a restore (profiles, then the event) and a purge or a takedown (a media row, then profiles), measured.
  The camera's roll counts under the host's profiles lock and then its own advisory lock, which nothing else takes
  ([disposable-mode.md](disposable-mode.md)).
- **The guest write path inherits the read gate:** `create_guest` refuses a `private` event and requires
  `p_unlock_proven` for `password` (the server derives it: the database cannot read the unlock cookie), and
  `get_upload_context` returns `visibility` so presign and complete re-check it per request ([uploads-and-r2.md](uploads-and-r2.md)).

## Gotchas

- **A column-level `revoke update(col)` is a silent no-op while a table-level grant stands:** revoke insert, update
  and delete on the TABLE first, then grant the columns; verify with `has_column_privilege`.
- ★ **And a table-level revoke cascades to every column grant.** Right when you re-grant the whole list; a loaded gun
  when you mean to add one column, because every write naming another column then fails with "permission denied
  for table" and the host app is down. Adding a column is a bare additive `grant insert (col), update (col)`.
- **A new table or sequence in `public` reaches no client role until its migration grants one, and a new function
  reaches one only through PUBLIC** (`20260929160000` closed the MCP default-grant landmine at its source: the
  migrating role's defaults hand `anon` and `authenticated` nothing; the service role keeps its defaults). PUBLIC's
  EXECUTE on a new function is Postgres's own default, which a per-schema default cannot revoke (Supabase's guide adds
  `revoke execute on functions from public` in schema public; it changes nothing, proved rolled back), so every grant
  block revokes from `public`, then grants exactly, and a drop-and-recreate re-inherits PUBLIC's, so it restates its
  grants in full. A table a client must reach takes its grant in the same migration, or its read is a 42501.
- ★ **A read that asks the invite list's match is a SECURITY DEFINER body.** `event_door_lists_account` reads
  `auth.users`, which the service role cannot, so an INVOKER function the server calls that asks it fails with a
  permission error at run time, invisible to typecheck: `event_door_counts` (INVOKER) reads the list's count through
  `event_door_waiting_listed` (DEFINER, service role only, empty `search_path`), the read-only twin of
  `event_door_admit_listed`. Both read the door's asks from one set, `event_door_asks` (every door act that lets an
  ask in reads it, so a blocked ask is never let in by a door's opening), and a change to who the list names moves
  that one body.
- ★ **A new junction table silently breaks PostgREST embeds (PGRST201).** Two FKs to already-related tables make
  PostgREST infer a second path, and an existing bare `events!inner(...)` embed between them throws at runtime,
  invisible to typecheck, lint and build. Pin every cross-table embed to its FK
  (`events!media_event_id_fkey!inner(...)`; filters still say `events.col`); adding a table with two FKs, grep the
  embeds between those tables and check one against live PostgREST.
- ★ **A trigger's Realtime broadcast can no-op silently.** `realtime.send()` swallows its insert failure into a
  WARNING, and `realtime.messages` has no partitions until a client first subscribes, so on a project that never had
  a realtime connection a trigger's broadcast does nothing: verify with a real subscription, not SQL. The gallery
  doorbell wraps `realtime.send` in its own exception guard so a Realtime outage never fails a media write.
- ★ **A `date` or `timestamptz` column admits `'infinity'`, which passes any `>=` CHECK:** a range's end of `'infinity'`
  was on or after every date, an owner's raw write stored it, and every reader silently fell back on a value that is no
  day. So each such column names `isfinite(...)` (`events_develops_at_finite`, `media_sealed_until_finite`,
  `events_event_date_finite`, and `events_end_date_on_or_after` for the end); how far a day may be from today is the app's
  window (`lib/events/dates.ts`), never the column's.

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
  insert and the send, and the swallowed error is captured where it is swallowed. The help center's feedback beacon
  (`help_feedback`, scope the IP and the article, breadth across articles) fails closed for the same reason, at no real
  cost: its limiter and its insert share one database.
- **The account kinds (`email_change`) key on the signed-in user's id** (HMAC'd, in its own domain), have no breadth,
  and fail CLOSED like the public forms: the limiter is the only bound on the `email_exists` oracle.
- Volumetric DoS is the Vercel edge firewall's job, not the app's; the guest OTP door is throttled only by Supabase
  Auth ([auth-accounts.md](auth-accounts.md)).

## Set-returning functions and the row cap

PostgREST cuts every table read and every set-returning RPC at `max_rows` (1,000, `[api]` in `supabase/config.toml`)
with no error; writes are not cut. The TypeScript side is `src/lib/db/read-all.ts`.
- A set-returning function pages on a keyset cursor (`p_after…` / `p_before…` on a total order) and a `p_limit`
  clamped in SQL to 1,000, or returns one row (a scalar, a `jsonb`, a `uuid[]`). ★ A null `p_limit` reads everything,
  written `limit case when p_limit is null then null else least(p_limit, 1000) end`: `least` ignores a null, so a bare
  `least(p_limit, 1000)` silently caps the unbounded call. `row-cap-sql.test.ts` holds every winning definition to
  this, each exception on its `SINGLE_ROW` or `CALLER_BOUNDED` list with its reason, or on `INTERNAL` when no role
  PostgREST serves can call it (checked from the grants).
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
