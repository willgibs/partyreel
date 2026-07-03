/**
 * One-off backfill: strip EXIF/GPS metadata from ORIGINALS already stored in R2.
 *
 * New uploads are stripped client-side at the upload seam (src/lib/upload/uploader.ts
 * step 0); this script sweeps the objects uploaded BEFORE that shipped. It imports the
 * SAME pure stripper (src/lib/media/strip-metadata.ts) - never fork the logic. Node
 * >= 22.18 type-strips .ts imports natively (the repo pins 22.21.1 via .nvmrc), so no
 * tsx/esbuild step is needed.
 *
 * Usage:
 *   node scripts/backfill-strip-exif.mjs             # DRY-RUN (default): report only
 *   node scripts/backfill-strip-exif.mjs --live      # actually PUT + fix the DB ledger
 *   node scripts/backfill-strip-exif.mjs --prefix events/<eventId>/   # narrow the sweep
 *
 * What --live does per changed object:
 *   1. PUT the stripped bytes back under the SAME key + content-type (images shrink;
 *      videos keep their exact length - boxes are blanked in place).
 *   2. media.file_size_bytes := new size. INVARIANT (ADR-0014): this column mirrors the
 *      R2 HEAD size, and the storage-cap meter is derived from it - it must track the
 *      replaced object.
 *   3. profiles.storage_used_bytes -= delta and the upload-month storage_ledger row's
 *      cumulative_bytes -= delta (clamped at 0), so the cap meters stay consistent with
 *      the shrunk objects. Read-modify-write via PostgREST is fine here: this is a
 *      one-off script run while traffic is quiet; create_media increments server-side
 *      atomically, so any racing upload would only make our clamped decrement conservative.
 *
 * Reads env from .env.local (gitignored) via Node's loadEnvFile; requires R2_* plus
 * NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (service role - the media/profiles/
 * storage_ledger columns are service-role-write-only by design).
 *
 * Memory note: each object is loaded fully (GetObject -> buffer). Fine for the current
 * disposable test data; a future multi-GB-original sweep should chunk via ranged reads
 * (the stripper's ByteReader already supports it - see planIsobmffPatches).
 */
import {
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

// --- args ------------------------------------------------------------------

const args = process.argv.slice(2);
const LIVE = args.includes("--live");
const prefixArg = args.find((a) => a.startsWith("--prefix"));
const PREFIX = prefixArg
  ? ((prefixArg.includes("=")
      ? prefixArg.split("=")[1]
      : args[args.indexOf(prefixArg) + 1]) ?? "events/")
  : "events/";

// --- env -------------------------------------------------------------------

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
const SUPABASE_URL = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const SUPABASE_SECRET_KEY = LIVE
  ? requireEnv("SUPABASE_SECRET_KEY")
  : process.env.SUPABASE_SECRET_KEY;

// --- shared stripper (the ONE implementation; see module docblock) ----------

let stripMetadataBytes, hasGpsMetadata, MIME_TO_EXT;
try {
  ({ stripMetadataBytes, hasGpsMetadata } = await import(
    new URL("../src/lib/media/strip-metadata.ts", import.meta.url)
  ));
  ({ MIME_TO_EXT } = await import(
    new URL("../src/lib/media/limits.ts", import.meta.url)
  ));
} catch (e) {
  console.error(
    "Couldn't import the TypeScript stripper. This script relies on Node's native type\n" +
      "stripping (default since 22.18; repo pins 22.21.1 in .nvmrc). Run `nvm use` or\n" +
      "retry with: node --experimental-strip-types scripts/backfill-strip-exif.mjs",
  );
  console.error(e?.message ?? e);
  process.exit(1);
}

const EXT_TO_MIME = Object.fromEntries(
  Object.entries(MIME_TO_EXT).map(([mime, ext]) => [ext, mime]),
);

// --- clients -----------------------------------------------------------------

// Mirrors src/lib/r2/client.ts (which is `server-only` and can't be imported here).
// The WHEN_REQUIRED checksum options are LOAD-BEARING against R2: without them the SDK
// injects CRC32 headers R2 rejects (silent 0-byte objects / SignatureDoesNotMatch).
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: "WHEN_REQUIRED",
  responseChecksumValidation: "WHEN_REQUIRED",
});

const supabase = SUPABASE_SECRET_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

// --- helpers ------------------------------------------------------------------

/** Only ORIGINAL media objects (events/<eventId>/<photo|video>/<mediaId>/original.<ext>).
 *  Previews are client-regenerated (already clean) and reel.mp4 is a derived render. */
function classifyKey(key) {
  const seg = key.split("/");
  if (seg.length !== 5 || seg[0] !== "events") return null;
  if (seg[2] !== "photo" && seg[2] !== "video") return null;
  if (!seg[4].startsWith("original.")) return null;
  const ext = seg[4].slice("original.".length).toLowerCase();
  const mime = EXT_TO_MIME[ext];
  if (!mime) return null;
  return { eventId: seg[1], mediaId: seg[3], mime };
}

async function listOriginals() {
  const found = [];
  let token;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: PREFIX,
        ContinuationToken: token,
      }),
    );
    for (const obj of page.Contents ?? []) {
      const info = classifyKey(obj.Key ?? "");
      if (info) found.push({ key: obj.Key, size: obj.Size ?? 0, ...info });
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return found;
}

const fmt = (n) => n.toLocaleString("en-US");

// --- main -----------------------------------------------------------------------

console.log(
  `backfill-strip-exif ${LIVE ? "*** LIVE ***" : "(dry-run; pass --live to write)"}  bucket=${R2_BUCKET} prefix=${PREFIX}`,
);

const objects = await listOriginals();
console.log(`Found ${fmt(objects.length)} original media object(s).\n`);

const stats = {
  total: objects.length,
  clean: 0,
  changed: 0,
  failedOpen: 0,
  gps: 0,
  bytesSaved: 0,
  errors: 0,
};
// mediaId -> { newSize, delta } for the DB ledger pass (live only).
const dbFixes = [];

for (const obj of objects) {
  try {
    const got = await s3.send(
      new GetObjectCommand({ Bucket: R2_BUCKET, Key: obj.key }),
    );
    const bytes = await got.Body.transformToByteArray();
    const gps = hasGpsMetadata(bytes, obj.mime);
    if (gps) stats.gps++;
    const res = await stripMetadataBytes(bytes, obj.mime);
    const tag = gps ? " [GPS]" : "";

    if (!res.stripped) {
      stats.failedOpen++;
      console.log(`  skip (fail-open, format not stripped): ${obj.key}${tag}`);
      continue;
    }
    if (!res.changed) {
      stats.clean++;
      // "clean" = nothing we CAN strip. A [GPS] tag here means the GPS lives in a
      // trailing appendage the stripper deliberately leaves (an MPF secondary image's
      // own Exif - see strip-metadata.ts); hasGpsMetadata scans trailers since the
      // motion-photo fix, so this line is no longer blind to that vector.
      console.log(
        gps
          ? `  clean-but-GPS (trailing appendage retains its own Exif; not stripped): ${obj.key}`
          : `  clean: ${obj.key}`,
      );
      continue;
    }

    stats.changed++;
    const delta = bytes.length - res.data.length;
    stats.bytesSaved += delta;
    if (!LIVE) {
      console.log(
        `  WOULD PUT: ${obj.key}${tag}  ${fmt(bytes.length)} -> ${fmt(res.data.length)} bytes`,
      );
      continue;
    }
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: obj.key,
        Body: Buffer.from(
          res.data.buffer,
          res.data.byteOffset,
          res.data.byteLength,
        ),
        ContentType: got.ContentType ?? obj.mime,
      }),
    );
    console.log(
      `  PUT: ${obj.key}${tag}  ${fmt(bytes.length)} -> ${fmt(res.data.length)} bytes`,
    );
    if (delta !== 0)
      dbFixes.push({ mediaId: obj.mediaId, newSize: res.data.length, delta });
  } catch (e) {
    stats.errors++;
    console.error(`  ERROR: ${obj.key}: ${e?.message ?? e}`);
  }
}

// --- DB ledger consistency (live only) --------------------------------------------

if (LIVE && dbFixes.length > 0) {
  if (!supabase) {
    console.error(
      "SUPABASE_SECRET_KEY missing - objects were replaced but the DB was NOT updated!",
    );
    process.exit(1);
  }
  console.log(
    `\nUpdating the DB ledger for ${fmt(dbFixes.length)} shrunk object(s)...`,
  );

  const ids = dbFixes.map((f) => f.mediaId);
  const { data: rows, error } = await supabase
    .from("media")
    .select("id, event_id, file_size_bytes, created_at")
    .in("id", ids);
  if (error) {
    console.error(`  media lookup failed: ${error.message}`);
    process.exit(1);
  }
  const rowById = new Map((rows ?? []).map((r) => [r.id, r]));

  const eventIds = [...new Set((rows ?? []).map((r) => r.event_id))];
  const { data: events, error: evErr } = await supabase
    .from("events")
    .select("id, host_id")
    .in("id", eventIds);
  if (evErr) {
    console.error(`  events lookup failed: ${evErr.message}`);
    process.exit(1);
  }
  const hostByEvent = new Map((events ?? []).map((e) => [e.id, e.host_id]));

  // Per-host + per-(host, upload-month) delta aggregation, then clamped decrements.
  const hostDelta = new Map();
  const ledgerDelta = new Map(); // `${hostId}|${period}` -> bytes
  for (const fix of dbFixes) {
    const row = rowById.get(fix.mediaId);
    if (!row) {
      // Orphan object (media row already purged): the PUT was still correct; nothing to ledger.
      console.log(
        `  no media row for ${fix.mediaId} (orphan object) - skipping DB update`,
      );
      continue;
    }
    const { error: updErr } = await supabase
      .from("media")
      .update({ file_size_bytes: fix.newSize })
      .eq("id", fix.mediaId);
    if (updErr) {
      console.error(
        `  media ${fix.mediaId} size update failed: ${updErr.message}`,
      );
      stats.errors++;
      continue;
    }
    const hostId = hostByEvent.get(row.event_id);
    if (!hostId) continue;
    hostDelta.set(hostId, (hostDelta.get(hostId) ?? 0) + fix.delta);
    const period = String(row.created_at).slice(0, 7); // YYYY-MM of the original upload
    const lk = `${hostId}|${period}`;
    ledgerDelta.set(lk, (ledgerDelta.get(lk) ?? 0) + fix.delta);
  }

  for (const [hostId, delta] of hostDelta) {
    const { data: prof, error: pErr } = await supabase
      .from("profiles")
      .select("storage_used_bytes")
      .eq("id", hostId)
      .single();
    if (pErr || !prof) {
      console.error(`  profiles read failed for ${hostId}: ${pErr?.message}`);
      stats.errors++;
      continue;
    }
    const next = Math.max(0, prof.storage_used_bytes - delta);
    const { error: uErr } = await supabase
      .from("profiles")
      .update({ storage_used_bytes: next })
      .eq("id", hostId);
    if (uErr) {
      console.error(`  profiles update failed for ${hostId}: ${uErr.message}`);
      stats.errors++;
    } else {
      console.log(
        `  host ${hostId}: storage_used_bytes -${fmt(delta)} -> ${fmt(next)}`,
      );
    }
  }

  for (const [lk, delta] of ledgerDelta) {
    const [hostId, period] = lk.split("|");
    const { data: led } = await supabase
      .from("storage_ledger")
      .select("id, cumulative_bytes")
      .eq("host_id", hostId)
      .eq("period", period)
      .maybeSingle();
    if (!led) continue; // no ledger row for that month (nothing to shrink)
    const next = Math.max(0, led.cumulative_bytes - delta);
    const { error: lErr } = await supabase
      .from("storage_ledger")
      .update({ cumulative_bytes: next })
      .eq("id", led.id);
    if (lErr) {
      console.error(
        `  storage_ledger update failed for ${lk}: ${lErr.message}`,
      );
      stats.errors++;
    } else {
      console.log(
        `  ledger ${hostId} ${period}: cumulative_bytes -${fmt(delta)} -> ${fmt(next)}`,
      );
    }
  }
}

// --- summary -----------------------------------------------------------------------

console.log(`
Summary ${LIVE ? "(LIVE)" : "(dry-run)"}:
  originals scanned:   ${fmt(stats.total)}
  with GPS metadata:   ${fmt(stats.gps)}
  ${LIVE ? "stripped + replaced" : "would strip"}: ${fmt(stats.changed)}  (${fmt(stats.bytesSaved)} bytes of metadata removed)
  already clean:       ${fmt(stats.clean)}  (clean-but-GPS lines above = Exif inside a JPEG trailing appendage, a conscious keep)
  fail-open (kept):    ${fmt(stats.failedOpen)}  (HEIC/HEIF/AVIF/WebM, unfixable MPF index, or unparseable - see strip-metadata.ts)
  errors:              ${fmt(stats.errors)}
`);
process.exit(stats.errors > 0 ? 1 : 0);
