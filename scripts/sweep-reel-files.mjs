/**
 * One-shot sweep: delete every stored reel .mp4 left over from the retired stored-reel model
 * (events/<eventId>/reel/reel.mp4 — `reelOutputKey`, src/lib/r2/keys.ts). The live reel replaces it
 * and stores nothing (`reel-teardown`, docs/tracks/reel-teardown.md): `reelOutputKey` itself, the
 * purge cron's append and account-deletion.ts's append all stay untouched through one deprecation
 * window, and the commit that removes them comes only after a DRY run here reports zero, in a later
 * lane, once the drop migration (supabase/migrations/20260924110000_live_reel_drop.sql) has landed.
 *
 * ★ WHY A SEPARATE SWEEP, NOT THE ORPHAN CRON: `reelOutputKey` is deliberately non-media-shaped (4
 * path segments, no mediaId), so the orphan sweep's own key parser returns null for it and leaves it
 * alone ("not ours -> never delete", r2/keys.ts). Nothing else ever lists or deletes this prefix in
 * bulk, so the one stored reel the drop migration's own inventory found (the "Partyreel Demo" event,
 * 2026-09-24) — and any other host's, from before this sweep runs — needs its own one-shot pass.
 *
 * Usage:
 *   node scripts/sweep-reel-files.mjs             # DRY-RUN (default): count only, deletes nothing
 *   node scripts/sweep-reel-files.mjs --apply      # actually delete
 *
 * The Orchestrator runs this after the drop migration lands (Will's yes).
 *
 * Mirrors src/lib/r2/delete.ts's list/delete semantics exactly (chunked at the 1,000-key S3/R2 cap;
 * deleting an already-absent key is a SUCCESS, so a re-run after a partial failure is idempotent) —
 * that module (and src/lib/r2/client.ts) is `server-only` and cannot be imported from a plain Node
 * script (see backfill-strip-exif.mjs for the identical constraint), so this script keeps its own
 * tiny S3 client rather than forking a second copy of the KEY LAYOUT (the shape below is a literal
 * match of `reelOutputKey`'s output, not a re-derivation of it).
 */
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  S3Client,
} from "@aws-sdk/client-s3";

// --- args --------------------------------------------------------------------

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");

// --- env ---------------------------------------------------------------------

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local (e.g. CI with real env vars) - proceed with process.env as-is.
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name} (set it in .env.local). Aborting.`);
    process.exit(1);
  }
  return v;
}

const R2_ACCOUNT_ID = requireEnv("R2_ACCOUNT_ID");
const R2_ACCESS_KEY_ID = requireEnv("R2_ACCESS_KEY_ID");
const R2_SECRET_ACCESS_KEY = requireEnv("R2_SECRET_ACCESS_KEY");
const R2_BUCKET = requireEnv("R2_BUCKET");

// --- client (mirrors src/lib/r2/client.ts; that module is server-only and cannot be imported here) ---

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  // ↓↓↓ DO NOT REMOVE — without these, requests silently corrupt against R2.
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

// --- the key shape (a literal match of reelOutputKey(eventId) in src/lib/r2/keys.ts) ---

const REEL_OUTPUT_KEY_RE = /^events\/[^/]+\/reel\/reel\.mp4$/;

async function listReelOutputKeys() {
  const found = [];
  let token;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: "events/",
        ContinuationToken: token,
      }),
    );
    for (const obj of page.Contents ?? []) {
      const key = obj.Key ?? "";
      if (REEL_OUTPUT_KEY_RE.test(key)) {
        found.push({ key, size: obj.Size ?? 0 });
      }
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return found;
}

/** Chunked delete at the 1,000-key S3/R2 cap (mirrors deleteR2Objects). Quiet: an absent key is a success. */
async function deleteKeys(keys) {
  const MAX_DELETE_KEYS = 1000;
  let deleted = 0;
  const errored = [];
  for (let i = 0; i < keys.length; i += MAX_DELETE_KEYS) {
    const chunk = keys.slice(i, i + MAX_DELETE_KEYS);
    const out = await s3.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    const errors = out.Errors ?? [];
    for (const e of errors) {
      errored.push({ key: e.Key ?? "", code: e.Code, message: e.Message });
    }
    deleted += chunk.length - errors.length;
  }
  return { deleted, errored };
}

const fmt = (n) => n.toLocaleString("en-US");

// --- main ----------------------------------------------------------------------

console.log(
  `sweep-reel-files ${APPLY ? "*** APPLY ***" : "(dry-run; pass --apply to delete)"}  bucket=${R2_BUCKET}`,
);

const objects = await listReelOutputKeys();
const totalBytes = objects.reduce((sum, o) => sum + o.size, 0);
console.log(
  `Found ${fmt(objects.length)} stored reel .mp4(s), ${fmt(totalBytes)} bytes total.\n`,
);
for (const o of objects) {
  console.log(
    `  ${APPLY ? "delete" : "would delete"}: ${o.key}  (${fmt(o.size)} bytes)`,
  );
}

let result = { deleted: 0, errored: [] };
if (APPLY && objects.length > 0) {
  result = await deleteKeys(objects.map((o) => o.key));
  for (const e of result.errored) {
    console.error(`  ERROR: ${e.key}: ${e.code} ${e.message ?? ""}`);
  }
}

console.log(`
Summary ${APPLY ? "(APPLY)" : "(dry-run)"}:
  found:    ${fmt(objects.length)}
  ${APPLY ? "deleted" : "would delete"}: ${fmt(APPLY ? result.deleted : objects.length)}
  errors:   ${fmt(result.errored.length)}
`);
process.exit(result.errored.length > 0 ? 1 : 0);
