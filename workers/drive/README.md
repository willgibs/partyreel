# partyreel-drive

Send to Google Drive's Worker (`docs/systems/drive-export.md`). It leases work and an hour of `drive.file` access
from the app's signed internal routes, streams each original from R2 into a Google resumable upload, and reports
back. It holds no database credential, no refresh token, no key and no Google client secret.

## Setup (the Orchestrator's, once)

```bash
cd workers/drive
npm ci
# The lanes' queue and its dead letters, each kept 14 days (the default is four: a lane waiting out an outage must
# not expire). Retention is the queue's own setting, never wrangler.jsonc's.
npx wrangler queues create partyreel-drive --message-retention-period-secs 1209600
npx wrangler queues create partyreel-drive-dlq --message-retention-period-secs 1209600
# (On an existing queue: npx wrangler queues update <name> --message-retention-period-secs 1209600)
# The one secret, equal to the app's DRIVE_WORKER_SECRET (generate once: openssl rand -base64 48).
npx wrangler secret put DRIVE_WORKER_SECRET
npx wrangler deploy
```

Then the app's env: `DRIVE_WORKER_URL` = this Worker's `*.workers.dev` origin, `DRIVE_WORKER_SECRET` = the same
secret. `DRIVE_APP_URL` (wrangler.jsonc) names the app every lane leases from: the launch-prep alias until the
milestone that ships Drive, then partyreel.com (a redeploy).

## A local walk against the desk build (no deploy)

The desk build at `http://localhost:3000` is where the live connect walk runs. A deployed Worker cannot reach a
laptop, so the walk runs this Worker locally beside it:

```bash
cd workers/drive
printf 'DRIVE_WORKER_SECRET=<the app'"'"'s value>\n' > .dev.vars
# wrangler.walk.jsonc: this Worker, the REAL bucket read from the laptop ("remote": true), the desk build as its app.
npx wrangler dev -c wrangler.walk.jsonc --port 8787 --test-scheduled   # needs `wrangler login` for the bucket
# the desk build's .env.local: DRIVE_WORKER_URL=http://localhost:8787 (and the same DRIVE_WORKER_SECRET)
# the sweep by hand: curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"
```

## Tests

`npm test`: the protocol twin's vectors (pinned equal to the app's), one original against a fake Drive and a fake
bucket (every end section 5 names), a lane's slice and its ends, the closing check, the sweep, the queue's readings,
and that no log ever carries a token.

## Kill switches

`DRIVE_MODE` = `off` and a redeploy: every lane ends at once and the sweep enqueues nothing. Without a redeploy, the
app's `drive_export_enabled` switch (/admin/exports) pauses every lease inside its own transaction.
