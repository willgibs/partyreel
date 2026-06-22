/**
 * PURE builders for the "Download all" zip export — the summary breakdown (drives the config
 * modal's live count/size) and the signed-manifest item list (what the Worker zips). Env-free /
 * DB-free, so it's Vitest-loadable; the export routes do the (authz'd) row fetching and feed
 * normalized rows in here.
 *
 * `file_size_bytes` is the AUTHORITATIVE per-object size the cap + the summary use — the route
 * sources it from `listEventMedia` (host) or an admin read of the access-resolved ids (guest),
 * never from the client. The cap bounds the Worker's worst-case CPU (CRC32 over the bytes) and
 * guards against an accidental huge download.
 */
import type { ExportItem } from "@/lib/export/export-token";
import { buildDownloadFilename } from "@/lib/media/download-filename";
import type { MediaKind } from "@/lib/media/limits";
import { slugify } from "@/lib/slug";

/** v1 caps — keep the Worker well under its 300s CPU ceiling + block accidental megabundles. */
export const MAX_EXPORT_ITEMS = 2000;
export const MAX_EXPORT_BYTES = 20 * 1024 * 1024 * 1024; // ~20 GB

/** The media-type filter the modal chips drive. */
export type ExportTypeFilter = "all" | "photo" | "video";

/** Status as it matters to the export: `approved` is the default ("shown") set; everything else
 *  non-removed is the host-only "Include hidden" expansion. */
type ExportStatus = "approved" | "hidden" | "pending" | "removed";

/** The minimal authoritative row the builders need (mapped from MediaRow / the guest admin read). */
export type ExportMediaRow = {
  type: MediaKind;
  original_key: string;
  file_size_bytes: number;
  status: ExportStatus;
};

type Bucket = { count: number; bytes: number };

/**
 * Per-(visibility-bucket × type) totals. `shown` = approved (what guests see / the host default);
 * `hidden` = the host-only delta added by "Include hidden" (hidden + pending). The modal renders
 * these and computes any (type × include-hidden) combination client-side, instantly, with no extra
 * round-trip. Guest summaries always have a zeroed `hidden`.
 */
export type ExportSummary = {
  shown: { photo: Bucket; video: Bucket };
  hidden: { photo: Bucket; video: Bucket };
};

function emptySummary(): ExportSummary {
  return {
    shown: { photo: { count: 0, bytes: 0 }, video: { count: 0, bytes: 0 } },
    hidden: { photo: { count: 0, bytes: 0 }, video: { count: 0, bytes: 0 } },
  };
}

export function summarizeMedia(rows: ExportMediaRow[]): ExportSummary {
  const s = emptySummary();
  for (const r of rows) {
    if (r.status === "removed") continue; // never counted (defensive; callers exclude them)
    const group = r.status === "approved" ? s.shown : s.hidden;
    const b = group[r.type];
    b.count += 1;
    b.bytes += r.file_size_bytes;
  }
  return s;
}

export type ExportManifestResult =
  | {
      ok: true;
      items: ExportItem[];
      zipName: string;
      totalBytes: number;
      itemCount: number;
    }
  | { ok: false; reason: "empty" | "over_cap" };

/**
 * Apply the modal's filters to the authoritative rows and produce the signed-manifest item list
 * (key + friendly in-zip name). `includeHidden` (host only) expands `approved` → all-non-removed;
 * the guest always passes false (and its rows are approved anyway). Rejects an empty selection and
 * anything over the cap (the modal surfaces both gracefully).
 */
export function buildExportManifest(params: {
  rows: ExportMediaRow[];
  eventName: string;
  types: ExportTypeFilter;
  includeHidden: boolean;
}): ExportManifestResult {
  const { rows, eventName, types, includeHidden } = params;

  const items: ExportItem[] = [];
  let totalBytes = 0;
  for (const r of rows) {
    if (r.status === "removed") continue;
    if (!includeHidden && r.status !== "approved") continue;
    if (types !== "all" && r.type !== types) continue;
    items.push({
      key: r.original_key,
      name: buildDownloadFilename({
        eventName,
        key: r.original_key,
        type: r.type,
      }),
    });
    totalBytes += r.file_size_bytes;
  }

  if (items.length === 0) return { ok: false, reason: "empty" };
  if (items.length > MAX_EXPORT_ITEMS || totalBytes > MAX_EXPORT_BYTES) {
    return { ok: false, reason: "over_cap" };
  }

  const zipName = `${slugify(eventName) || "partyreel"}.zip`;
  return { ok: true, items, zipName, totalBytes, itemCount: items.length };
}
