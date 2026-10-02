# Partyreel export Worker (`partyreel-export`)

Streaming **"Download all"** zip-export Worker (uploads-and-r2.md — heavy/streaming work runs off Vercel). The
browser form-POSTs a signed manifest token (minted + authorized by the Next app); this Worker verifies the
HMAC + expiry + per-key layout, then streams a **store-only zip** of the named R2 objects straight from the
`partyreel` bucket to the response. Bytes never buffer fully and never touch Vercel.

It is **not** part of the Next app or the Vercel build — deploy it separately with `wrangler`.

## How it fits

```
browser ── POST /check (the token as text/plain) ──▶ partyreel-export ── R2.head / R2.list ──▶ JSON counts
browser ── form POST t=<token> ─────────────────────▶ partyreel-export ── R2.get(key) ──▶ stream zip ──▶ browser
                                                          │  ▲
            app mints + signs the token (authorizes once, at mint) — the Worker never authorizes
                                                          │
                                  signed reports ─────────┴──▶ app /api/export/report ──▶ export_log, job_runs
```

The Worker trusts the **signature**, not the claims: a valid HMAC means the app already authorized exactly
this object set. The token carries `{ v, jti, scope, eventId, zipName, items:[{key,name}], exp, report? }`; the
format is shared with `src/lib/export/export-token.ts` (the app signs with node:crypto, this Worker verifies with
Web Crypto — `src/export-token.ts` is the twin). `EXPORT_SIGNING_SECRET` must be IDENTICAL on both sides.

**The check** (`POST /check`, `src/check.ts`): the app asks, in a `fetch` it can read, what the zip would hold
before the browser takes the file (a top-level form POST the page can never read back): `{ ok, items, found,
missing: [mediaId] }`, readable from any origin (no credential rides it, and it names only the token's own
objects). An empty answer is refused in one line and no file is sent; a short one is counted; a refusal (`403`
forbidden, `503` paused) is said in the app's toast rather than replacing the page. It reads no bytes: a small
folder by `head`, a big one from its listing. A client that leaves stops it (`enable_request_signal`).

**The reports** (`src/report.ts`, `src/stream.ts`): a token that names a report address (`report`, the minting
app's own `/api/export/report`) is reported on. Its check answers `reports: true` and the app hears the count; its
stream finds the zip's first object before answering (none: a `204`, which keeps the album page with no file, and an
`empty` report), says when it began, and says how it ended once it has: `saved`, `short` (with the ids it skipped),
`stopped` (the client left) or `failed` (an object read broke it). Each report is a POST signed with the export
secret over `report:` and its body (no token can pass as a report), sent through `waitUntil`, never retried; the app
keeps it on the export's `export_log` row, and the walk's toast reads "saved" only from it.

**The heartbeat** (`src/heartbeat.ts`, the `scheduled` handler, `30 5 * * *`): once a day the Worker reads its
bucket (`list`, one key) and signs what it found to the first of `HEARTBEAT_URLS` that takes it (every app shares
one database). The app records it as the `export` job (`/admin/jobs`, `/admin/exports`), whose switch is
`export_enabled`, so a dead, bucket-less or mis-keyed Worker reads Missed or Failed.

**One deployment, every app.** partyreel.com and the launch-prep alias post here whatever milestone each runs,
so a request an older app sends is answered exactly as the Worker it was built against answered it:
`src/compat.test.ts` replays milestone 29's requests at the vendored `src/milestone-29/` Worker and milestones 30
to 32's at `src/milestone-31/`, holding every answer equal (status, headers, body bytes, object reads), and shows
today's tokens still stream at both. Everything the reports add is asked for by the token alone.

## Setup (one-time)

```bash
cd workers/export
npm install
npm run typecheck && npm test

# Secret — MUST equal the app's EXPORT_SIGNING_SECRET (Vercel + .env.local):
wrangler secret put EXPORT_SIGNING_SECRET

# Deploy (prints the *.workers.dev URL → set it as EXPORT_WORKER_URL in the app env):
npm run deploy
```

For local `wrangler dev`, put `EXPORT_SIGNING_SECRET=<value>` in a gitignored `.dev.vars`. A local Worker
(`http://localhost:8787`) set as the app's `EXPORT_WORKER_URL` is asked for reports at the local app; a deployed one
never is (it cannot reach a laptop).

## Smoke test (the lib-lock gate)

Confirm `client-zip` runs on `workerd` and emits extractor-valid archives:

```bash
# with a freshly minted token for a small album (mint via the app, or sign one with the shared secret):
curl -s -X POST "$EXPORT_WORKER_URL" --data-urlencode "t=$TOKEN" -o /tmp/album.zip
unzip -t /tmp/album.zip   # must report "No errors detected"

# the check, as the app asks it (the same token, the whole text/plain body):
curl -s -X POST "$EXPORT_WORKER_URL/check" -H 'Content-Type: text/plain' --data "$TOKEN"
# → {"ok":true,"items":N,"found":N,"missing":[]}   (and "reports":true for a token that asks)
```

## Knobs (`wrangler.jsonc`)

- `EXPORT_MODE` var — redeploy-layer kill-switch (`"on"` default; `"off"` + redeploy hard-halts). The app's
  `export_enabled` DB flag is the no-redeploy layer (flip it from `/admin`).
- `HEARTBEAT_URLS` var — where the daily heartbeat goes, space-separated, tried in order: partyreel.com, then the
  launch-prep alias while partyreel.com's app has no report path.
- `triggers.crons` — the heartbeat's clock; `app/admin/jobs/catalog.ts`'s `export` entry names the same one (a
  test holds them equal).
- `limits.cpu_ms: 300000` — store-zip CPU is CRC32 over the bytes (I/O wait isn't billed); the app caps each
  zip (<=2000 items / ~20 GB; a bigger album comes in parts, one zip each) so the worst case stays well under the
  5-min ceiling.
- `compatibility_flags: ["enable_request_signal"]` — `request.signal` fires when a client leaves, so a cancelled
  check stops reading and a reported stream knows it was stopped. The unreported stream's answers are unchanged.

## Operability

`observability.enabled` is on → request logs + errors land in the Cloudflare dashboard. The Worker can't reach
the DB (no binding), so it reports what it saw to the app (above): every export ATTEMPT is written to `export_log`
at mint, the Worker's word fills the same row, and `/admin/exports` shows the outcome, the kill-switch and the
heartbeat. It still logs a check that finds objects gone (`export-check`), a stream that skipped or did not finish
(`export-stream`), a report the app did not take (`export-report`) and a heartbeat nobody took (`export-heartbeat`).
