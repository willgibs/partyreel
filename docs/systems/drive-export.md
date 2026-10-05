# Send to Google Drive

Open this before you:
- touch connecting a Google account, the token store or any call to Google (`src/lib/drive/`, `/api/drive/*`);
- change a send: the press, its snapshot, its names, its lanes, its words, its mails;
- change the `partyreel-drive` Worker, its queue or the protocol it shares with the app;
- operate it: a stop, a stuck send, a dead lane, the breaker, a leaked secret.

Elsewhere: what it means for R2 ([uploads-and-r2.md](uploads-and-r2.md) "Send to Google Drive"), the grants and the
advisor set ([database-security.md](database-security.md)), the jobs console and the spend watch
([admin-observability.md](admin-observability.md)), holds and takedowns
([trust-safety-forensics.md](trust-safety-forensics.md)).

A host connects her Google account once and sends an album's originals (exactly her Download panel's Originals) into
her own Drive: `My Drive / Partyreel / Maya & Jay · 12 Sep 2026 / 2026-09-12 21.14.05 · Priya.jpg`. Every plan has it.
A Cloudflare Worker streams each original from R2 into a Google resumable upload; the app is the one oracle (the
Worker holds no database credential, no refresh token, no key and no client secret: it leases work and an hour of
access from signed internal routes). Its doors are Take it home's Originals card (Send to Drive beside Download), Your
events (several albums from one list) and What's using space (the album it shows); the send shows on the album it
sends (`send-strip.tsx`); Account's Google Drive card is the connection. The database's half is migration
20261005120000, whole in one file with its rolled-back check at its foot.

★ **Nothing in this flow deletes what it sent or suggests deleting it** (PRICING.md: "Export is an off-ramp, never a
one-click exit"). `cloud_export_act` cancels, resumes, retries and acknowledges, and no more; deleting stays where it
already is. Partyreel deletes nothing in her Drive except undoing a write it just failed, by the id Google returned for
that very write (`CreatedFolder` and the Worker's `CreatedFile` are branded so nothing else can be passed).

## The connection

- **Scopes `openid email https://www.googleapis.com/auth/drive.file`, never wider.** `drive.file` reaches only what
  Partyreel made (non-sensitive: brand verification only, no CASA). Every https address the Drive code and the Worker
  name is Google's own and in one list (`google-urls.ts`, pinned by `google-urls.test.ts` over every file).
- **Its own Web client, "Partyreel Drive"** (project partyreel-498522, apart from sign-in's client, which lives in
  Supabase), so revoking Drive never touches a sign-in grant. Redirect URIs exactly `https://partyreel.com/api/drive/callback`
  and `http://localhost:3000/api/drive/callback`; the alias has none, so a connect there answers Google's
  redirect_uri_mismatch. Its publishing status must stay **In production**: in Testing every refresh token dies in seven
  days.
- ★ **The callback's lock is `getUser()`.** `/api/drive/connect` (signed in, limiter `drive_connect`) writes
  `pr_drive_oauth` (HttpOnly, `Path=/api/drive/callback`, ten minutes, HMAC under `UNLOCK_COOKIE_SECRET` in its own
  `drive-oauth:` domain) with the state, the PKCE verifier, the account it was started for and where to land (one of
  the sign-in return shapes); the callback refuses, and clears the cookie, unless the cookie's signature and state hold
  AND the signed-in account is the one it names, so an attacker's code can never connect the attacker's Drive to a
  victim's account. Then: no `drive.file` in the grant (she unticked it) is `needs_permission` and the half-grant is
  revoked; no refresh token, or an ID token not naming our client, Google and the future, is refused.
- **Identity is `sub`, never the address;** "connected as" prints the address only when Google verified it.
- ★ **A same-account reconnect never revokes the token it replaces;** a different account's does. Google's revoke
  removes the whole grant (its docs: "invalidating the permissions previously granted"), and the new token rides that
  very grant. Another Google account replaces the row whole and ends its unfinished sends (`account_changed`). Every
  new connection mails the account's own address (`drive_connected`): a stolen session could otherwise point her sends
  at a stranger's Drive in silence.
- **Disconnect** (Account, an operator, account deletion): the row and its folders go first (running sends end
  `disconnected`; finished ones keep their counts and lose every Google id), then the grant is revoked, three tries.
  Google not answering keeps no key here; the words say so with myaccount.google.com/connections. Account deletion
  disconnects at the request (an isolated step after the stamp) and again before `deleteUser` (isolated: a grant
  Google keeps listing is inert without the key and never holds a person who asked to be forgotten).
- **`invalid_grant`** on a refresh wipes the tokens at once (`revoked`), pauses her sends `disconnected` and mails her
  to reconnect; the same `sub` back resumes them. A time-limited grant reads `failing` a day before its end, with the
  same mail.
- **The `pr_drive` hint cookie** (set at connect and at a press, cleared at Disconnect, readable by the page, worth
  nothing) is what lets her pages poll `/api/drive/status`: only a host who uses Drive polls, so a hub never spends
  Vercel CPU asking for nothing. It is a hint, never a gate.

## The tokens

- **AES-256-GCM in the Vercel runtime** (`tokens.server.ts`): `v1.<key id>.<iv>.<sealed>`, the associated data
  `drive:v1:<user>:<provider>:<purpose>`, so a ciphertext copied to another account or the access slot opens nothing.
  `DRIVE_TOKEN_KEY` seals; `DRIVE_TOKEN_KEY_PREVIOUS`, when set, still opens, and every write re-seals with the current
  key, so a rotation finishes itself as tokens refresh. A row neither key opens is a broken connection (Reconnect),
  never an error page.
- **A refresh is a claim** (`cloud_connection_token`): a row lock cannot span Google's HTTP call, so the one caller
  that finds under 20 minutes left wins `refresh_claimed_until` for 30 seconds; everyone else takes the cached access
  token or answers the lane `wait`. About one call to Google's token endpoint an hour a running connection.
- **The Worker gets an hour of access, sealed in the lease** (HKDF of `DRIVE_WORKER_SECRET` with `drive:token`, then
  AES-GCM bound to the lease's token), so a logged or captured lease yields nothing.

## A send

- **The press** (`POST /api/drive/exports`, one to 50 albums, limiter `drive_send`, her Drive's room asked first):
  `cloud_export_create` snapshots the album in ONE statement, so nothing is read into Vercel and nothing is cut at
  1,000. One unfinished send an album (a unique index): a second press opens the first. The app then makes the folders
  (the Partyreel folder asked again each press and made again if she binned it, compare-and-set so two presses leave
  one; the album's folder kept for its next send) and `cloud_export_ready` starts it.
- ★ **What a send holds is her Originals zip:** `chosenRows` over what `media_host_all` lets her read (not removed, no
  permanent delete she asked, approved unless she chose Include hidden items). A quiet legal hold is NOT a filter
  (her zip includes it; skipping it would be the one number where a hold shows). Pinned by `drive-snapshot.test.ts`.
- ★ **Sending again never duplicates and never lies.** A send takes the whole album; each item carries the file an
  earlier send on this connection left (`prior_file_id`), which the Worker asks Drive for first and records as kept
  when it is still there, whole and out of the bin; a file she deleted in Drive goes again. A re-leased item (a lane
  that died after Google stored it) is found by our `appProperties` (`pr_media`, `pr_job`, no parent clause: she may
  move anything) and recorded instead of sent.
- **Names: when, then who** (`src/lib/export/drive-names.ts`, the one naming function): the moment it reached the
  album in her browser's zone at the press, then the album's credit for its sender (never an address, never a mark),
  then the original's extension; Drive's `modifiedTime` is the same moment so Drive's own sort agrees. It takes a
  capture time the moment one is kept (null today: the upload keeps none). The ` (2)` is assigned in SQL under the
  connection's lock against the names other originals of the album hold, so two lanes never pick one name and the same
  original sent again keeps its own; `driveFileName` mirrors it under a test.
- **Lanes.** A Queue message is a lane (`{ v, connectionId }`); a connection runs at most three (two for half an hour
  after Google says slow down), however many albums she sends: they share them, oldest first, so whole albums finish in
  order. A kick enqueues only what is missing, once a minute. A lane leases a batch (at most 10 items or 1 GiB),
  sends, reports every 10 seconds, and after an 11-minute slice sends itself to the back of the queue, so a 1 TB host
  never blocks anyone. A lease answering `wait`, `paused` or `stopped` ends the lane (a paused connection costs
  nothing); only Google's slow down (a delay to `throttled_until`) and an app that cannot answer (60 seconds) re-queue.
- **One file:** a resumable upload; up to 128 MiB one PUT through a `FixedLengthStream`, past it 128 MiB chunks with
  the session reported before the first byte, so a resume asks Google where it stands (`bytes */size`) and never
  trusts our own count. Each lands checked against R2's MD5 (or one the Worker computes over a second read, for a
  multipart clip); a mismatch undoes the file this upload just made and the file goes again. A failure retries after
  1, 5, 30 and 60 minutes, and fails for good on its fifth attempt (Retry on the album).
- **The closing check** confirms every sent file by its id, a page of 100 at a time: a missing one goes once more;
  duplicates are counted from one listing of the album's folder, signalled (`drive_transfer`), never deleted (a copy
  she made on purpose carries our properties too). Then `done` ("every one checked") or `partly_done`.
- **Stops, each its own act in place** (`moments.ts`, the one table every place reads): Drive full (Check again, Get
  more space; its room is asked again every six hours for a week), lost access (Reconnect), the folder in her bin (Check
  again, Send to a new folder), her admin's policy, files that would not go (Retry, See which). A stop that needs her
  flags itself once app-wide (`attention_at`, acknowledged by her app as `seen`, so another device does not say it
  again), stands in the host's bell while it lasts (read only where the `pr_drive` hint is), and mails once; Google's
  day (we stop at 700 GB of its 750) resumes by itself, quietly in place, with its mail. Ours to fix (a dying lane, the
  breaker, an operator) says we are on it and asks nothing.
- **Nothing runs for ever:** 14 days sending or 30 paused ends it (`expired`, with its mail); a press that never got its
  folder ends in ten minutes (`failed_to_start`); an hour with work and no progress marks it stuck for /admin (never
  while the switch is off). Finished sends fold into one done mail an hour.

## Cost and guards

- **About $0.0003 a GB** (R2 reads, Worker CPU, queue operations, a lease per ten files and a report every 10 s on
  Vercel): a 25 GB album about two cents.
- **The account breaker:** `max(10 × her plan's storage, 5 GB)` reached Drive in any 30 days (since an operator's last
  Lift) refuses her press and pauses her sends (`breaker`, "we've been told"), with Sentry and the ops mail. A real
  host cannot meet it; it is an unpublished bound against one album sent, deleted from Drive and sent again.
- **The spend watch's `drive_bytes`** (a day's bytes, floor 1 TB) pauses `drive_export_enabled` on a trip; paused
  sends wait and lose nothing.
- The limiter's `drive_connect` (5 a minute an account) and `drive_send` (10 presses a minute), and her Drive's room
  (`about.get`) kept a minute on the connection, bound what a script pressing Send can cost.

## The Worker

`workers/drive/` (`partyreel-drive`): its own tests against a fake Drive and a fake bucket, deployed apart from the app
and from `partyreel-export` (a Drive fault never touches Download). Bindings: `PRIMARY` (R2, read), the queue
`partyreel-drive` (consumer and producer) and `partyreel-drive-dlq` (producer, for its depth), a cron every five
minutes, `DRIVE_MODE` (the redeploy kill switch), `DRIVE_APP_URL` and the secret `DRIVE_WORKER_SECRET` (equal to the
app's). ★ **Retention is the queue's own setting** (14 days, at create or update): the default four would expire a
lane waiting out an outage.
- **The protocol has a twin on each side** (`src/lib/drive/protocol.ts`, `workers/drive/src/protocol.ts`): every word
  is `base64url(json).hmac("drive:" + body)` under the shared secret, refused past five minutes, and both suites pin
  the same vectors. A replay is harmless by construction (every write is a transition keyed by its lease token, and a
  `sent` stays sent), so there is no nonce table.
- **A poison lane pauses its connection, never loops:** on its last attempt a lane reports itself dead
  (`/api/internal/drive/lanefail`); three in a day pause the connection's sends (`failing`) until an operator resumes.
- **The sweep** (`/api/internal/drive/sweep`, every five minutes): kicks a send that stopped moving, resumes Google's
  day, asks a full Drive's room again, ends what ran too long, trips breakers, folds the done mails, and once an hour
  writes the `drive_export` heartbeat with the queue's depths (`drive_queue`, `drive_dead_letters`).
- Its logs never carry a token, a secret, a lease or a session address (`log-safety.test.ts`).

## What a leak gives away

| Where | What it holds |
| --- | --- |
| The database | ciphertext, `account_email` and `sub` (personal data), and live `session_uri`s (a week to finish an upload with other bytes, which the MD5 check turns into a failed attempt) |
| The Worker | `DRIVE_WORKER_SECRET` and an hour of `drive.file` on the running hosts' Partyreel folders; no refresh token, no key, no client secret |
| Vercel's env | the client secret and the token key, which together open every refresh token |
| A browser | her own sends' progress columns (RLS and a column grant), never a folder id, the connection or a token |

## Operating it (`/admin/exports#drive`)

- **The switch** `drive_export_enabled` (off: no send starts, every lease answers `paused`, nothing is lost); its card
  carries the four readings and the Google client's idle clock (Google deletes a client unused for six months:
  attention past 150 days).
- **Every send still going and the week's that ended short,** each with Resume (any pause), Retry failed and Cancel.
- **The connections that need someone** (dying lanes, a standing breaker, an operator's pause, a lost grant) and any
  account's connection found by address, each with Pause (the whole connection, a reason kept), Resume, Lift breaker
  and Disconnect (revoked at Google, for an account's recovery).
- ★ **When a secret leaks:** for the client secret, make a new one beside the old in the Google console, move Vercel's
  `GOOGLE_DRIVE_CLIENT_SECRET`, disable the old; for the token key, set the old as `DRIVE_TOKEN_KEY_PREVIOUS` and a new
  `DRIVE_TOKEN_KEY` (`openssl rand -base64 32`), and drop the previous once every row re-sealed; for
  `DRIVE_WORKER_SECRET`, set a new one on both sides together (a lane whose word the app refuses re-queues a minute
  on, so the window between the two costs minutes, never a send).
  When the env itself leaked, then press **Revoke every connection**: every grant revoked at Google and every key
  wiped, each host mailed to reconnect, her sends resuming at it.
- No hand-run SQL: every state a send or a connection can reach has its control above.

## Choices, with their reasons

- **Every plan:** it costs about nothing, it is the honest way out, and it cannibalizes nothing (live sync, the
  automatic copy competitors charge for, is where a plan line would belong). Will's to overrule; a marketed number only
  moves up, so it can never leave Free once there.
- **Your events picks from a list,** not checks on the tiles: one list reads the same over the gallery, the table and
  the list Display options, and a host with two hundred albums picks from rows.
- **The folders are made by the app at the press,** where her access token already is, so the Worker only uploads.
- **Google's day is counted by the hour** (`cloud_export_sent_hours`), which also carries the breaker's 30 days and the
  spend watch's day, and outlives a disconnect so the breaker cannot be reset by one.
- **The spend watch reads a day, not an hour,** to ride the watch's `last_day` machinery.
