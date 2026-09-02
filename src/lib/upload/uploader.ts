/**
 * Browser-side upload orchestration, shared by the guest and host flows. Runs in a
 * client component. The caller passes the endpoint pair + identity fields (guest =
 * { session_token }; host = { event_id }) — the two pipelines are otherwise identical.
 *
 * Per file: measure dimensions/duration → client-validate → POST presign →
 * upload bytes DIRECTLY to R2 (single PUT or multipart, via XHR for progress) →
 * POST complete (which records the media row). The server derives the R2 key from
 * the identity (token or owned event); this module never constructs keys.
 *
 * XHR (not fetch) because only XHR exposes upload progress events. Reading a
 * multipart part's ETag requires the R2 bucket CORS to expose the ETag header.
 */
import { stripFileMetadata } from "@/lib/media/strip-metadata";
import { classifyMime, validateUpload } from "@/lib/media/validators";
import { getDeviceId } from "@/lib/upload/device-id";
import { generatePreview } from "@/lib/upload/preview";

type Measured = { width?: number; height?: number; duration?: number };

/** The optional preview PUT the presign route issues when the client declared a (capped) preview size. */
type PreviewPut = { key: string; url: string; headers: Record<string, string> };

type PresignResponse =
  | {
      ok: true;
      strategy: "single";
      media_id: string;
      key: string;
      content_type: string;
      url: string;
      headers: Record<string, string>;
      preview?: PreviewPut;
    }
  | {
      ok: true;
      strategy: "multipart";
      media_id: string;
      key: string;
      content_type: string;
      upload_id: string;
      part_size_bytes: number;
      parts: { partNumber: number; url: string }[];
      preview?: PreviewPut;
    }
  | { ok: false; code: string; message: string };

type CompleteResponse =
  | { ok: true; status: string }
  | { ok: false; code: string; message: string };

export type UploadOutcome =
  | { ok: true; status: string; mediaId: string; kind: "photo" | "video" }
  | { ok: false; message: string };

function measureFile(file: File, kind: "photo" | "video"): Promise<Measured> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    // Measurement is best-effort and MUST settle: Chrome defers <video> metadata
    // loading in hidden tabs (backgrounded mid-queue = loadedmetadata never fires),
    // which wedged the whole queue before its first network call. Same rationale as
    // preview.ts's waitEvent timeouts; the server re-validates size via R2 HEAD.
    let done = false;
    const settle = (m: Measured) => {
      if (done) return;
      done = true;
      clearTimeout(bail);
      resolve(m);
      URL.revokeObjectURL(url);
    };
    const bail = setTimeout(() => settle({}), 7000);
    if (kind === "photo") {
      const img = new Image();
      img.onload = () =>
        settle({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => settle({});
      img.src = url;
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () =>
      settle({
        width: video.videoWidth,
        height: video.videoHeight,
        duration: Number.isFinite(video.duration) ? video.duration : undefined,
      });
    video.onerror = () => settle({});
    video.src = url;
  });
}

function putWithProgress(args: {
  url: string;
  body: Blob;
  headers?: Record<string, string>;
  onProgress?: (fraction: number) => void;
}): Promise<XMLHttpRequest> {
  const { url, body, headers, onProgress } = args;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    for (const [name, value] of Object.entries(headers ?? {})) {
      xhr.setRequestHeader(name, value);
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr);
      else reject(new Error(`Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(body);
  });
}

/**
 * An upload failure whose message is ALREADY guest-ready copy. Anything else
 * that escapes gets the generic message instead, so a raw JS error string
 * ("Unexpected token '<'") can never reach a guest's screen.
 */
class UploadError extends Error {}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // fetch REJECTS only on a genuine transport failure (venue WiFi dropping,
    // a cell handoff, the tab going offline) and never on a 4xx/5xx. This is
    // the blip that used to wedge the whole batch.
    throw new UploadError(
      "Your connection dropped. Check your signal and try again.",
    );
  }
  try {
    return (await res.json()) as T;
  } catch {
    // A proxy/edge failure answers with an HTML error page, so .json() throws
    // on a response that arrived perfectly well.
    throw new UploadError(
      `The server didn't respond properly (${res.status}). Please try again.`,
    );
  }
}

/**
 * THE CONTRACT: uploadFile ALWAYS RESOLVES an UploadOutcome, never rejects.
 *
 * The queue runner awaits this once per file in a sequential loop. A rejection
 * escaping here used to break out of that loop entirely: the file stayed at
 * status "uploading" forever (so it never got the errored tile's retry
 * affordance) and every file still queued behind it was silently abandoned.
 * One dropped request on venue WiFi therefore killed the whole batch.
 *
 * The R2 PUT was already guarded; the presign/complete round-trips were not,
 * and neither were the best-effort media helpers. Rather than chase each one,
 * the whole pipeline is wrapped so the contract holds by construction: a new
 * `await` added below cannot reintroduce the wedge. (The queue ALSO catches,
 * belt and braces.)
 */
export async function uploadFile(args: {
  file: File;
  endpoints: { presign: string; complete: string };
  identity: Record<string, string>;
  onProgress?: (fraction: number) => void;
}): Promise<UploadOutcome> {
  try {
    return await runUpload(args);
  } catch (e) {
    if (e instanceof UploadError) return { ok: false, message: e.message };
    // An unexpected throw is a bug, not a guest-facing condition: keep it in
    // the console for triage, and show copy a guest can act on.
    console.error("uploadFile: unexpected failure", e);
    return {
      ok: false,
      message: "Something went wrong with that upload. Please try again.",
    };
  }
}

async function runUpload(args: {
  file: File;
  // The presign/complete route pair to hit. Guest -> /api/r2/*; host -> /api/host/r2/*.
  // Both pairs return identical response shapes, so the orchestration below is shared.
  endpoints: { presign: string; complete: string };
  // Auth fields merged into BOTH request bodies: { session_token } (guest capability)
  // or { event_id } (host, authorized server-side via getUser()). Spread first so it
  // can never override a server-derived field.
  identity: Record<string, string>;
  onProgress?: (fraction: number) => void;
}): Promise<UploadOutcome> {
  const { file: pickedFile, endpoints, identity, onProgress } = args;

  const kind = classifyMime(pickedFile.type);
  if (!kind) return { ok: false, message: "That file type isn't supported." };

  // 0. Strip identifying metadata (EXIF GPS/device tags, XMP, MP4/MOV udta location)
  //    BEFORE anything reads a size: presign binds the R2 PUT's Content-Length to the
  //    size_bytes declared below, so the stripped bytes MUST be what every downstream
  //    step (measure -> validate -> preview -> presign -> PUT) sees. Lossless byte-level
  //    excision, never a pixel re-encode; JPEG orientation survives via a rebuilt minimal
  //    Exif. Best-effort like generatePreview: unparseable/exotic input (HEIC, WebM)
  //    comes back stripped:false with the ORIGINAL - a failed strip never blocks a guest.
  const cleaned = await stripFileMetadata(pickedFile);
  const file =
    cleaned.blob === pickedFile
      ? pickedFile
      : new File([cleaned.blob], pickedFile.name, {
          type: pickedFile.type,
          lastModified: pickedFile.lastModified,
        });

  const measured = await measureFile(file, kind);

  const localCheck = validateUpload({
    mime: file.type,
    sizeBytes: file.size,
  });
  if (!localCheck.ok) return { ok: false, message: localCheck.reason };

  // 0b. Generate a small WebP preview in the browser from the STRIPPED file (best-effort; null on
  //    skip/failure) - previews were already metadata-clean by canvas regeneration. Its size is sent
  //    to presign so the preview PUT can bind content-length (like the original) — no unbounded preview PUT.
  const preview = await generatePreview(file, kind, measured);

  // 1. Presign (server validates identity + caps and builds the key; issues an optional preview PUT).
  const presign = await postJson<PresignResponse>(endpoints.presign, {
    ...identity,
    content_type: file.type,
    size_bytes: file.size,
    duration_seconds: measured.duration,
    preview_size_bytes: preview?.blob.size,
  });
  if (!presign.ok) {
    return {
      ok: false,
      message: presign.message ?? "Couldn't start the upload.",
    };
  }

  // 2. Upload bytes directly to R2.
  const parts: { partNumber: number; eTag: string }[] = [];
  try {
    if (presign.strategy === "single") {
      await putWithProgress({
        url: presign.url,
        body: file,
        headers: presign.headers,
        onProgress,
      });
    } else {
      const partSize = presign.part_size_bytes;
      let uploadedBytes = 0;
      for (const part of presign.parts) {
        const start = (part.partNumber - 1) * partSize;
        const blob = file.slice(start, Math.min(start + partSize, file.size));
        const xhr = await putWithProgress({
          url: part.url,
          body: blob,
          onProgress: (frac) =>
            onProgress?.((uploadedBytes + frac * blob.size) / file.size),
        });
        uploadedBytes += blob.size;
        const eTag = xhr.getResponseHeader("ETag");
        if (!eTag) {
          // A missing part ETag is a BUCKET MISCONFIGURATION (R2 CORS stopped exposing
          // the ETag header), never something a guest did or can fix — so it follows the
          // uploadFile contract's rule below: the operator detail goes to the console for
          // triage, the guest gets copy they can act on. It used to name the header and
          // the bucket, which read like a broken app to the person holding the phone.
          console.error(
            "uploadFile: multipart part missing ETag (the R2 bucket CORS must expose the ETag header)",
            { partNumber: part.partNumber },
          );
          return {
            ok: false,
            message: "Something went wrong with that upload. Please try again.",
          };
        }
        parts.push({ partNumber: part.partNumber, eTag });
      }
    }
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Upload failed.",
    };
  }

  // 2b. Upload the preview (best-effort). A failure here NEVER fails the upload — the original is what
  //     matters; a missing preview just falls back to the original tile. preview_key is recorded only on
  //     a confirmed PUT.
  let previewKey: string | undefined;
  if (presign.preview && preview) {
    try {
      await putWithProgress({
        url: presign.preview.url,
        body: preview.blob,
        headers: presign.preview.headers,
      });
      previewKey = presign.preview.key;
    } catch {
      // swallow — no preview this time
    }
  }

  // 3. Complete (assembles multipart in R2, then records the media row).
  const complete = await postJson<CompleteResponse>(endpoints.complete, {
    ...identity,
    media_id: presign.media_id,
    key: presign.key,
    content_type: presign.content_type,
    size_bytes: file.size,
    duration_seconds: measured.duration,
    width: measured.width,
    height: measured.height,
    preview_key: previewKey,
    upload_id: presign.strategy === "multipart" ? presign.upload_id : null,
    parts,
    // CAPTURE-ONLY (ADR-0020): the durable device UUID for the deny-all forensic
    // record. Never read back, never product logic; omitted when storage is blocked.
    device_uuid: getDeviceId() ?? undefined,
  });
  if (!complete.ok) {
    return {
      ok: false,
      message: complete.message ?? "Couldn't finalize the upload.",
    };
  }

  // mediaId + kind let the caller optimistically render the upload in the gallery
  // (and dedupe it against the server poll by id).
  return { ok: true, status: complete.status, mediaId: presign.media_id, kind };
}
