# Partyreel export Worker (`partyreel-export`)

Streaming **"Download all"** zip-export Worker (uploads-and-r2.md — heavy/streaming work runs off Vercel). The
browser form-POSTs a signed manifest token (minted + authorized by the Next app); this Worker verifies the
HMAC + expiry + per-key layout, then streams a **store-only zip** of the named R2 objects straight from the
`partyreel` bucket to the response. Bytes never buffer fully and never touch Vercel.

It is **not** part of the Next app or the Vercel build — deploy it separately with `wrangler`.

## How it fits

```
browser ── form POST t=<token> ──▶ partyreel-export Worker ── R2.get(key) ──▶ stream zip ──▶ browser
                                         ▲
            app mints + signs the token (authorizes once, at mint) — the Worker never authorizes
```

The Worker trusts the **signature**, not the claims: a valid HMAC means the app already authorized exactly
this object set. The token carries `{ v, jti, scope, eventId, zipName, items:[{key,name}], exp }`; the format
is shared with `src/lib/export/export-token.ts` (the app signs with node:crypto, this Worker verifies with
Web Crypto — `src/export-token.ts` is the twin). `EXPORT_SIGNING_SECRET` must be IDENTICAL on both sides.

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

For local `wrangler dev`, put `EXPORT_SIGNING_SECRET=<value>` in a gitignored `.dev.vars`.

## Smoke test (the lib-lock gate)

Confirm `client-zip` runs on `workerd` and emits extractor-valid archives:

```bash
# with a freshly minted token for a small album (mint via the app, or sign one with the shared secret):
curl -s -X POST "$EXPORT_WORKER_URL" --data-urlencode "t=$TOKEN" -o /tmp/album.zip
unzip -t /tmp/album.zip   # must report "No errors detected"
```

## Knobs (`wrangler.jsonc`)

- `EXPORT_MODE` var — redeploy-layer kill-switch (`"on"` default; `"off"` + redeploy hard-halts). The app's
  `export_enabled` DB flag is the no-redeploy layer (flip it from `/admin`).
- `limits.cpu_ms: 300000` — store-zip CPU is CRC32 over the bytes (I/O wait isn't billed); the app caps each
  export (<=2000 items / ~20 GB) so the worst case stays well under the 5-min ceiling.

## Operability

`observability.enabled` is on → request logs + errors land in the Cloudflare dashboard. The Worker can't reach
the DB (no binding), so EXPORT observability for the admin portal lives app-side: every export ATTEMPT is
written to `export_log` at mint and surfaced at `/admin` (recent exports + the kill-switch). A raced-deleted
object is skipped (logged) rather than failing the whole stream.
