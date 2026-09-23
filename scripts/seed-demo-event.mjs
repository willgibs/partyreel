/**
 * Seed the curated demo event from a folder of media, as if a host had uploaded it.
 *
 * The marketing site points at a REAL event (NEXT_PUBLIC_DEMO_QR_TOKEN -> src/lib/demo.ts), so the
 * demo album has to be real rows over real R2 objects. Uploading a curated set by hand through the
 * browser is slow and unrepeatable; seeding raw DB rows is worse (a media row with no object renders
 * broken and poisons every later check). This script is the third way: it drives the SAME write path
 * the product does, from Node.
 *
 * What "the same write path" means here, concretely:
 *   - keys come from mediaObjectKey (src/lib/r2/keys.ts), never hand-built;
 *   - EXIF/GPS is stripped with the SAME stripper the uploader runs at step 0
 *     (src/lib/media/strip-metadata.ts) before anything reads a size;
 *   - a ~640px WebP preview is generated per item (photo downscale / video poster frame at ~0.1s),
 *     sized by the SAME pure math the browser uses (src/lib/media/preview-size.ts), and PUT to the
 *     reserved `preview` variant, so tiles serve the small file like every real upload;
 *   - file_size_bytes comes from an R2 HEAD after the PUT (database-security.md), never from the local file;
 *   - the row itself is written by create_media_as_host, the service-role-only RPC the host complete
 *     route calls. NEVER insert into `media` directly: the RPC is what keeps the storage ledger,
 *     profiles.storage_used_bytes and the cap checks honest (uploads-and-r2.md invariant).
 * The result is indistinguishable from a host batch upload: guest_id null, status approved.
 *
 * Usage:
 *   node scripts/seed-demo-event.mjs <folder>
 *   node scripts/seed-demo-event.mjs <folder> --name "Partyreel Demo" --host willg97@gmail.com
 *   node scripts/seed-demo-event.mjs <folder> --dry-run     # plan only, no writes
 *
 * Defaults: --name "Partyreel Demo"; --host = whoever owns the event with that name today.
 *
 * IDEMPOTENT BY REPLACEMENT. A re-run wipes the event's media first (R2 objects, then rows via
 * purge_media_rows so storage_used_bytes is decremented) and seeds the folder fresh, so the same
 * command always lands the same album. The event itself is reused (same id, same qr_token, so the
 * marketing QR keeps working); it is created only when the name does not exist yet.
 *
 * Requires: ffmpeg + ffprobe on PATH (dimensions, durations, preview/poster encoding; Node has no
 * image codecs and adding an npm dependency is out of this script's lane). Reads env from
 * .env.local: R2_* plus NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (service role, because the
 * media/ledger/storage columns are service-role-write-only by design). Never hard-code a key here.
 */
import { execFile } from "node:child_process";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { promisify } from "node:util";

import {
  DeleteObjectsCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { createClient } from "@supabase/supabase-js";

const execFileAsync = promisify(execFile);

// --- args ------------------------------------------------------------------

/** The demo event's fixed name. The marketing demo is ONE event reused forever, not a new one per
 *  run: NEXT_PUBLIC_DEMO_QR_TOKEN pins its qr_token, and every printed QR in the wild points at it. */
const DEFAULT_EVENT_NAME = "Partyreel Demo";

const argv = process.argv.slice(2);

function flag(name) {
  const i = argv.indexOf(`--${name}`);
  if (i >= 0) return argv[i + 1];
  const inline = argv.find((a) => a.startsWith(`--${name}=`));
  return inline ? inline.slice(name.length + 3) : undefined;
}

const DRY_RUN = argv.includes("--dry-run");
const EVENT_NAME = flag("name") ?? DEFAULT_EVENT_NAME;
const HOST_EMAIL = flag("host");
const folderArg = argv.find((a) => !a.startsWith("--"));

if (!folderArg) {
  console.error(
    "Usage: node scripts/seed-demo-event.mjs <folder> [--host <email>] [--name <event name>] [--dry-run]",
  );
  process.exit(1);
}
const FOLDER = resolve(folderArg);

// --- env -------------------------------------------------------------------

try {
  // Resolved against THIS file, not the cwd, so the script runs from anywhere.
  process.loadEnvFile(new URL("../.env.local", import.meta.url).pathname);
} catch {
  // No .env.local (real env vars already exported) - proceed with process.env as-is.
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
const SUPABASE_SECRET_KEY = requireEnv("SUPABASE_SECRET_KEY");
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://partyreel.com";

// --- shared single-sources (imported, never re-implemented) -----------------

// Node >= 22.18 type-strips .ts imports natively (.nvmrc pins 22.21.1), the same trick
// backfill-strip-exif.mjs uses. Only leaf modules work: a .ts file with a RUNTIME `@/...` or
// extensionless relative import cannot resolve here (that is why classifyMime is rebuilt below
// from limits.ts's own arrays rather than imported from validators.ts).
let mediaObjectKey,
  parseMediaIdFromKey,
  ACCEPTED_PHOTO_MIME,
  ACCEPTED_VIDEO_MIME,
  MAX_UPLOAD_BYTES,
  MIME_TO_EXT,
  MAX_PREVIEW_BYTES,
  PREVIEW_QUALITY,
  previewTargetSize,
  shouldSkipPreview,
  stripMetadataBytes,
  readJpegOrientation;
try {
  ({ mediaObjectKey, parseMediaIdFromKey } = await import(
    new URL("../src/lib/r2/keys.ts", import.meta.url)
  ));
  ({ ACCEPTED_PHOTO_MIME, ACCEPTED_VIDEO_MIME, MAX_UPLOAD_BYTES, MIME_TO_EXT } =
    await import(new URL("../src/lib/media/limits.ts", import.meta.url)));
  ({
    MAX_PREVIEW_BYTES,
    PREVIEW_QUALITY,
    previewTargetSize,
    shouldSkipPreview,
  } = await import(
    new URL("../src/lib/media/preview-size.ts", import.meta.url)
  ));
  ({ stripMetadataBytes, readJpegOrientation } = await import(
    new URL("../src/lib/media/strip-metadata.ts", import.meta.url)
  ));
} catch (e) {
  console.error(
    "Couldn't import the TypeScript single-sources. This script relies on Node's native type\n" +
      "stripping (default since 22.18; repo pins 22.21.1 in .nvmrc). Run `nvm use` first.",
  );
  console.error(e?.message ?? e);
  process.exit(1);
}

/** ext (no dot) -> MIME, inverted from the ONE key/ext map. `jpeg` and `qt` are filesystem spellings
 *  MIME_TO_EXT does not carry (it holds the CANONICAL ext per MIME, which is what keys use). */
const EXT_TO_MIME = {
  ...Object.fromEntries(
    Object.entries(MIME_TO_EXT).map(([mime, ext]) => [ext, mime]),
  ),
  jpeg: "image/jpeg",
  qt: "video/quicktime",
};

/** Mirrors classifyMime (src/lib/media/validators.ts) off the same arrays; see the import note. */
function classifyMime(mime) {
  if (ACCEPTED_PHOTO_MIME.includes(mime)) return "photo";
  if (ACCEPTED_VIDEO_MIME.includes(mime)) return "video";
  return null;
}

/** Formats ffmpeg cannot decode here (no libheif in the usual build). macOS `sips` converts them to
 *  a temporary PNG purely so we can MEASURE and make a preview; the ORIGINAL bytes still go to R2. */
const NEEDS_TRANSCODE_TO_MEASURE = new Set(["heic", "heif", "avif"]);

// --- clients ---------------------------------------------------------------

// Mirrors src/lib/r2/client.ts (which is `server-only` and can't be imported here). The
// WHEN_REQUIRED checksum options are LOAD-BEARING against R2: without them the SDK injects CRC32
// headers R2 rejects (silent 0-byte objects / SignatureDoesNotMatch).
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

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// --- small helpers ---------------------------------------------------------

const fmt = (n) => n.toLocaleString("en-US");
const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;

/** Write in-memory bytes to a path ffmpeg can read. */
async function writeBytes(path, bytes) {
  await writeFile(
    path,
    Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength),
  );
}

function fail(message) {
  console.error(`\n${message}`);
  process.exit(1);
}

async function requireTool(bin) {
  try {
    await execFileAsync(bin, ["-version"]);
  } catch {
    fail(
      `${bin} is not on PATH. It measures dimensions/durations and encodes the tile previews.\n` +
        `Install it (brew install ffmpeg) and re-run.`,
    );
  }
}

// --- media probing + preview generation (the Node stand-ins for the browser) ---

/**
 * True dimensions + duration, as the BROWSER would report them (display orientation, not stored
 * orientation): a JPEG with an Exif Orientation of 5-8 and a video with a 90/270 display matrix both
 * report swapped width/height in the DOM, and media.width/height feed the masonry geometry. Getting
 * this wrong tilts every portrait tile in the gallery.
 */
async function probe(path, kind, bytes) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-show_streams",
    "-show_format",
    "-of",
    "json",
    path,
  ]);
  const parsed = JSON.parse(stdout);
  const stream = (parsed.streams ?? []).find((s) => s.codec_type === "video");
  if (!stream?.width || !stream?.height) return null;

  let width = stream.width;
  let height = stream.height;
  let rotation = 0;

  if (kind === "video") {
    // Rotation lives in a display-matrix side_data (modern) or the legacy `rotate` tag.
    const side = (stream.side_data_list ?? []).find(
      (d) => d.rotation !== undefined,
    );
    rotation = Number(side?.rotation ?? stream.tags?.rotate ?? 0) || 0;
  } else {
    // Exif Orientation 5-8 are the quarter-turns. The stripper KEEPS this tag (a rebuilt one-tag
    // Exif), so the browser rotates the original on render and must be matched here.
    const orientation = bytes ? readJpegOrientation(bytes) : null;
    if (orientation && orientation >= 5 && orientation <= 8) rotation = 90;
  }
  if (Math.abs(rotation) % 180 === 90) [width, height] = [height, width];

  // format.duration is what <video>.duration reports (the container's, not the stream's).
  const durationRaw = parsed.format?.duration ?? stream.duration;
  const duration = kind === "video" ? Number(durationRaw) : null;
  return {
    width,
    height,
    duration: Number.isFinite(duration) && duration > 0 ? duration : null,
  };
}

/** Exif Orientation -> the ffmpeg filter that bakes it in. The preview is a NEW image with no Exif,
 *  so the rotation has to be applied to the pixels or every sideways photo gets a sideways tile. */
const ORIENTATION_FILTER = {
  2: "hflip",
  3: "hflip,vflip",
  4: "vflip",
  5: "transpose=0",
  6: "transpose=1",
  7: "transpose=3",
  8: "transpose=2",
};

/**
 * The ~640px WebP the tiles serve. Photos: downscale. Videos: the frame at ~0.1s (the first frame is
 * often black, the same reason videoPosterSrc appends #t=0.1). Best-effort BY CONTRACT, exactly like
 * generatePreview in the browser: any failure returns null and the tile falls back to the original.
 */
async function makePreview({
  srcPath,
  workDir,
  kind,
  width,
  height,
  duration,
  bytes,
}) {
  if (kind === "photo" && shouldSkipPreview(width, height)) return null;
  const target = previewTargetSize(width, height);
  const outPath = join(workDir, "preview.webp");
  const quality = String(Math.round(PREVIEW_QUALITY * 100));

  const filters = [];
  let inputArgs = [];
  if (kind === "photo") {
    const orientation = bytes ? readJpegOrientation(bytes) : null;
    const rotate = orientation ? ORIENTATION_FILTER[orientation] : null;
    if (rotate) filters.push(rotate);
    // -noautorotate pins the behaviour: some ffmpeg builds apply Exif rotation themselves, which
    // would double-rotate on top of the filter above. We always rotate explicitly.
    inputArgs = ["-noautorotate"];
  } else {
    const seek = duration ? Math.min(0.1, duration * 0.1) : 0.1;
    inputArgs = ["-ss", String(seek)];
  }
  filters.push(`scale=${target.width}:${target.height}:flags=lanczos`);

  try {
    await execFileAsync("ffmpeg", [
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      ...inputArgs,
      "-i",
      srcPath,
      "-frames:v",
      "1",
      "-vf",
      filters.join(","),
      "-c:v",
      "libwebp",
      "-quality",
      quality,
      "-f",
      "webp",
      outPath,
    ]);
    const buf = await readFile(outPath);
    if (buf.length === 0) return null;
    // The preview PUT is size-capped in the product (an unbounded preview would be a cap-evasion
    // vector); honour the same ceiling rather than storing something the app would have refused.
    if (buf.length > MAX_PREVIEW_BYTES) return null;
    return { bytes: buf, ...target };
  } catch {
    return null;
  }
}

// --- host + event resolution -----------------------------------------------

async function findUserByEmail(email) {
  const wanted = email.toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });
    if (error) fail(`Couldn't list users: ${error.message}`);
    const hit = (data?.users ?? []).find(
      (u) => (u.email ?? "").toLowerCase() === wanted,
    );
    if (hit) return hit;
    if ((data?.users ?? []).length < 200) break;
  }
  return null;
}

/** The host: --host <email> when given, else whoever owns the demo event today. */
async function resolveHostId() {
  if (HOST_EMAIL) {
    const user = await findUserByEmail(HOST_EMAIL);
    if (!user) fail(`No account found for ${HOST_EMAIL}.`);
    return { hostId: user.id, hostEmail: user.email };
  }
  const { data, error } = await supabase
    .from("events")
    .select("host_id")
    .eq("name", DEFAULT_EVENT_NAME)
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  if (error) fail(`Couldn't look up the demo event's host: ${error.message}`);
  if (!data) {
    fail(
      `No live event named "${DEFAULT_EVENT_NAME}" exists, so there is no default host.\n` +
        `Pass --host <email> to say who should own it.`,
    );
  }
  const { data: user, error: uErr } = await supabase.auth.admin.getUserById(
    data.host_id,
  );
  if (uErr) fail(`Couldn't read the demo host: ${uErr.message}`);
  return { hostId: data.host_id, hostEmail: user?.user?.email ?? "unknown" };
}

/**
 * The event, reused by (host, name) or created. Reuse is the point: the qr_token is the demo's
 * identity (printed QRs, NEXT_PUBLIC_DEMO_QR_TOKEN), so a re-seed must never mint a new one.
 * A created event copies the demo's live settings: open, live moderation, taking uploads.
 */
async function resolveEvent(hostId) {
  const { data: existing, error } = await supabase
    .from("events")
    .select(
      "id, name, qr_token, visibility, moderation_mode, accepting_uploads",
    )
    .eq("host_id", hostId)
    .eq("name", EVENT_NAME)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) fail(`Couldn't look up the event: ${error.message}`);
  if (existing) return { event: existing, created: false };

  if (DRY_RUN) {
    console.log(`  would CREATE event "${EVENT_NAME}"`);
    return { event: null, created: true };
  }
  // NEVER set qr_token: the DB default mints the unguessable capability token (mutations/events.ts).
  const { data: created, error: insErr } = await supabase
    .from("events")
    .insert({
      host_id: hostId,
      name: EVENT_NAME,
      visibility: "open",
      moderation_mode: "live",
      accepting_uploads: true,
      // The demo album asks nothing of a visitor, so Require verified emails is OFF (names mode).
      require_verified_email: false,
    })
    .select(
      "id, name, qr_token, visibility, moderation_mode, accepting_uploads",
    )
    .single();
  if (insErr) fail(`Couldn't create the event: ${insErr.message}`);
  return { event: created, created: true };
}

// --- the replace half (R2 objects first, then rows) -------------------------

async function deleteKeys(keys) {
  let deleted = 0;
  const errors = [];
  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    const out = await s3.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: { Objects: chunk.map((Key) => ({ Key })), Quiet: true },
      }),
    );
    const errs = out.Errors ?? [];
    for (const e of errs) errors.push(`${e.Key}: ${e.Code} ${e.Message}`);
    deleted += chunk.length - errs.length;
  }
  return { deleted, errors };
}

/** Every media-shaped object under the event (events/<id>/<kind>/<mediaId>/<variant>.<ext>). The
 *  rendered reel.mp4 is deliberately NOT media-shaped, so parseMediaIdFromKey skips it and a
 *  re-seed leaves it alone (highlight_reels.rendered_hash re-renders it when the media changes). */
async function listEventMediaObjects(eventId) {
  const keys = [];
  let token;
  do {
    const page = await s3.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET,
        Prefix: `events/${eventId}/`,
        ContinuationToken: token,
      }),
    );
    for (const obj of page.Contents ?? []) {
      if (obj.Key && parseMediaIdFromKey(obj.Key)) keys.push(obj.Key);
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

/**
 * Wipe the event's existing media so the run is a REPLACEMENT, not an append.
 * Order is R2-then-rows (the purge cron's order): an object with no row is a harmless orphan the
 * sweep reclaims, a row with no object renders broken. Rows go through purge_media_rows so
 * profiles.storage_used_bytes is decremented, which a direct delete would silently skip.
 */
async function wipeExistingMedia(eventId) {
  const { data: rows, error } = await supabase
    .from("media")
    .select("id, original_key, preview_key, legal_hold_at")
    .eq("event_id", eventId);
  if (error) fail(`Couldn't read the event's media: ${error.message}`);
  const existing = rows ?? [];
  if (existing.length === 0) {
    console.log("  no existing media to replace");
    return;
  }

  const held = existing.filter((r) => r.legal_hold_at);
  if (held.length > 0) {
    // purge_media_rows refuses held rows (trust-safety-forensics.md) and we must not orphan their objects either.
    console.log(
      `  ${held.length} row(s) under legal hold will be kept (they are never hard-deleted)`,
    );
  }
  const purgeable = existing.filter((r) => !r.legal_hold_at);
  console.log(
    `  replacing ${fmt(purgeable.length)} existing media row(s) + their objects`,
  );
  if (DRY_RUN) return;

  const keepKeys = new Set(
    held.flatMap((r) => [r.original_key, r.preview_key].filter(Boolean)),
  );
  // Sweep the whole event namespace, not just the enumerated row keys: a half-finished earlier run
  // can leave objects with no row, and those would linger forever under a reused event.
  const objectKeys = (await listEventMediaObjects(eventId)).filter(
    (k) => !keepKeys.has(k),
  );
  const { deleted, errors } = await deleteKeys(objectKeys);
  if (errors.length > 0) {
    fail(
      `R2 delete failed for ${errors.length} object(s); rows were NOT touched:\n  ${errors.join("\n  ")}`,
    );
  }
  console.log(`  deleted ${fmt(deleted)} R2 object(s)`);

  const { data: freed, error: purgeErr } = await supabase.rpc(
    "purge_media_rows",
    { p_media_ids: purgeable.map((r) => r.id) },
  );
  if (purgeErr) fail(`purge_media_rows failed: ${purgeErr.message}`);
  const freedBytes = (freed ?? []).reduce(
    (sum, r) => sum + Number(r.freed_bytes ?? 0),
    0,
  );
  console.log(
    `  purged ${fmt(purgeable.length)} row(s), freed ${mb(freedBytes)} of the host's storage`,
  );
}

// --- the seed half (one file = one upload) ----------------------------------

/** Folder -> the files we can upload, in name order (which becomes gallery order, oldest first). */
async function collectFiles(folder) {
  let entries;
  try {
    entries = await readdir(folder, { withFileTypes: true });
  } catch {
    fail(`Can't read the folder ${folder}.`);
  }
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isFile() || entry.name.startsWith(".")) continue;
    const ext = extname(entry.name).slice(1).toLowerCase();
    const mime = EXT_TO_MIME[ext];
    const kind = mime ? classifyMime(mime) : null;
    if (!kind) {
      console.log(`  skip (unsupported type): ${entry.name}`);
      continue;
    }
    files.push({
      path: join(folder, entry.name),
      name: entry.name,
      mime,
      kind,
    });
  }
  return files;
}

/**
 * One file, all the way through: strip -> measure -> preview -> PUT -> HEAD -> create_media_as_host.
 * Returns a summary row, or null when the item was skipped (with the reason already printed).
 */
async function seedFile(file, { hostId, eventId }) {
  const raw = new Uint8Array(await readFile(file.path));

  // Step 0, exactly as uploader.ts does it: strip BEFORE anything reads a size, so the size we
  // meter, the bytes we PUT and the bytes we measure are all the same bytes. Fail-open (HEIC, WebM,
  // anything unparseable) keeps the original, like the product.
  const stripped = await stripMetadataBytes(raw, file.mime);
  const bytes = stripped.changed ? stripped.data : raw;

  if (bytes.length > MAX_UPLOAD_BYTES) {
    console.log(`  skip (over the 10 GB ceiling): ${file.name}`);
    return null;
  }

  // ffmpeg needs a path, and the stripped bytes only exist in memory. For the formats ffmpeg cannot
  // decode we hand it a temporary PNG from `sips` instead; the ORIGINAL bytes still go to R2.
  const ext = extname(file.name).slice(1).toLowerCase();
  const workDir = await mkdtemp(join(tmpdir(), "prseed-src-"));
  const strippedPath = join(workDir, `src.${ext}`);
  await writeBytes(strippedPath, bytes);
  let probePath = strippedPath;
  if (NEEDS_TRANSCODE_TO_MEASURE.has(ext)) {
    const pngPath = join(workDir, "decoded.png");
    try {
      await execFileAsync("sips", [
        "-s",
        "format",
        "png",
        strippedPath,
        "--out",
        pngPath,
      ]);
      probePath = pngPath;
    } catch {
      console.log(
        `  warning: couldn't decode ${file.name} for measuring (no dimensions, no preview)`,
      );
    }
  }

  const measured = await probe(probePath, file.kind, bytes).catch(() => null);
  if (!measured) {
    console.log(
      `  warning: no dimensions for ${file.name} (tile falls back to 1:1)`,
    );
  }
  const preview = measured
    ? await makePreview({
        srcPath: probePath,
        workDir,
        kind: file.kind,
        width: measured.width,
        height: measured.height,
        duration: measured.duration,
        // The preview of a transcoded stand-in is already upright, so no Exif rotation to re-apply.
        bytes: probePath === strippedPath ? bytes : null,
      })
    : null;

  const orientation = measured
    ? measured.width > measured.height
      ? "landscape"
      : measured.width < measured.height
        ? "portrait"
        : "square"
    : "unknown";

  if (DRY_RUN) {
    await rm(workDir, { recursive: true, force: true });
    console.log(
      `  would upload ${file.name} (${file.kind}, ${measured ? `${measured.width}x${measured.height} ${orientation}` : "no dims"}, ` +
        `${mb(bytes.length)}${preview ? `, preview ${fmt(preview.bytes.length)} B` : ", no preview"})`,
    );
    return {
      name: file.name,
      kind: file.kind,
      orientation,
      bytes: bytes.length,
    };
  }

  // Server-built keys, from the ONE key source. The media id is generated here exactly as the
  // presign route generates it, and both variants share it.
  const mediaId = crypto.randomUUID();
  const key = mediaObjectKey({
    eventId,
    mediaId,
    kind: file.kind,
    variant: "original",
    ext: MIME_TO_EXT[file.mime],
  });
  const previewKey = preview
    ? mediaObjectKey({
        eventId,
        mediaId,
        kind: file.kind,
        variant: "preview",
        ext: "webp",
      })
    : null;

  await s3.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength),
      ContentType: file.mime,
    }),
  );
  if (preview) {
    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: previewKey,
        Body: preview.bytes,
        ContentType: "image/webp",
      }),
    );
  }
  await rm(workDir, { recursive: true, force: true });

  // AUTHORITATIVE size from R2, never the local file (database-security.md) - the same HEAD the complete route
  // does, so a partial PUT can never be metered as a full file.
  const head = await s3.send(
    new HeadObjectCommand({ Bucket: R2_BUCKET, Key: key }),
  );
  const realSize = Number(head.ContentLength ?? 0);

  const { data, error } = await supabase.rpc("create_media_as_host", {
    p_host_id: hostId,
    p_event_id: eventId,
    p_media_id: mediaId,
    p_type: file.kind,
    p_original_key: key,
    p_file_size_bytes: realSize,
    p_preview_key: previewKey ?? undefined,
    p_duration_seconds: measured?.duration ?? undefined,
    p_width: measured?.width ?? undefined,
    p_height: measured?.height ?? undefined,
  });
  if (error) {
    // Leave no orphan: the RPC refused (cap, tier, key), so the bytes have no business in R2.
    await deleteKeys([key, previewKey].filter(Boolean));
    console.error(`  FAILED ${file.name}: ${error.message}`);
    return null;
  }

  console.log(
    `  ${file.name} -> ${data.status} ${file.kind} ${measured ? `${measured.width}x${measured.height}` : "?"} ` +
      `(${mb(realSize)}${preview ? `, preview ${fmt(preview.bytes.length)} B` : ", no preview"})`,
  );
  return { name: file.name, kind: file.kind, orientation, bytes: realSize };
}

// --- main -------------------------------------------------------------------

await requireTool("ffmpeg");
await requireTool("ffprobe");

const folderStat = await stat(FOLDER).catch(() => null);
if (!folderStat?.isDirectory()) fail(`Not a folder: ${FOLDER}`);

console.log(
  `seed-demo-event ${DRY_RUN ? "(dry-run; nothing is written)" : "*** LIVE ***"}  folder=${basename(FOLDER)}  bucket=${R2_BUCKET}`,
);

const { hostId, hostEmail } = await resolveHostId();
console.log(`Host: ${hostEmail} (${hostId})`);

const { event, created } = await resolveEvent(hostId);
if (event) {
  console.log(
    `Event: "${event.name}" ${event.id} ${created ? "(created)" : "(reused)"} visibility=${event.visibility} moderation=${event.moderation_mode}`,
  );
}

const files = await collectFiles(FOLDER);
if (files.length === 0) fail(`No supported media in ${FOLDER}.`);
console.log(`\nFound ${fmt(files.length)} file(s) to seed.\n`);

if (event) await wipeExistingMedia(event.id);

console.log("");
const seeded = [];
for (const file of files) {
  // event is null only in a dry run that would have CREATED it; seedFile returns before it needs
  // an id in that case.
  const row = await seedFile(file, { hostId, eventId: event?.id ?? null });
  if (row) seeded.push(row);
}

const photos = seeded.filter((r) => r.kind === "photo").length;
const videos = seeded.filter((r) => r.kind === "video").length;
const orientations = new Set(seeded.map((r) => r.orientation));
const totalBytes = seeded.reduce((sum, r) => sum + r.bytes, 0);

console.log(`
Summary ${DRY_RUN ? "(dry-run)" : "(LIVE)"}:
  seeded:       ${fmt(seeded.length)} of ${fmt(files.length)}  (${fmt(photos)} photo, ${fmt(videos)} video)
  orientations: ${[...orientations].join(", ") || "none"}
  bytes:        ${mb(totalBytes)}`);

if (orientations.size < 2) {
  console.log(
    "  note: every item has the same orientation. A mixed set shows the masonry gallery better.",
  );
}

if (event?.qr_token) {
  console.log(`
NEXT_PUBLIC_DEMO_QR_TOKEN=${event.qr_token}
  guest link: ${SITE_URL}/e/${event.qr_token}`);
}
console.log("");

process.exit(seeded.length === files.length ? 0 : 1);
