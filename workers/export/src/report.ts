/**
 * THE WORKER'S WORD BACK TO THE APP (`export-ends`): what a check found, when a stream began and how it
 * ended, and the Worker's own daily heartbeat, each a signed POST into the app's `/api/export/report`.
 *
 * The app goes blind the moment the browser's download manager takes a zip, and the Worker cannot reach
 * the database (no binding, no key), so this is the one way "saved", a short zip and a failure reach the
 * app, the walk's toast and `/admin/exports`. The app stays the one writer of `export_log`.
 *
 * ★ SIGNED WITH THE EXPORT SECRET, IN A DOMAIN OF ITS OWN. A report is `${body}.${hmacHex("report:" +
 * body)}`, body = base64url(JSON). A token's MAC is over its bare body, and a base64url body never holds
 * a ":", so no report can pass as a token and no token as a report, with no second secret to keep in
 * step. The twin that verifies it is the app's `src/lib/export/report.ts`; the format is one contract,
 * pinned by the same vector in both test suites.
 *
 * ★ ONLY A TOKEN THAT ASKS IS REPORTED ON. The app signs the address it wants reports at into the token
 * (`report`); a token without one (partyreel.com's app before this lane) is answered exactly as before
 * and never reported on, so the reports, the check's `reports: true` and the stream's 204 are all
 * opt-in by the token, and `compat.test.ts` holds every older app's answers equal.
 */
import type { ExportManifestPayload } from "./export-token";

export const REPORT_VERSION = 1;

/** The one path a report may be sent to, on whatever origin the token names. */
export const REPORT_PATH = "/api/export/report";

/** How a stream ended, as the walk and the portal read it. */
export type StreamOutcome = "saved" | "short" | "stopped" | "failed" | "empty";

export type Report =
  /** The check's count (`found` of `items`), or that R2 could not answer it. */
  | {
      v: number;
      kind: "check";
      jti: string;
      at: number;
      items: number;
      found: number;
    }
  | {
      v: number;
      kind: "check";
      jti: string;
      at: number;
      items: number;
      error: "unavailable";
    }
  /** The zip's first file is on its way (the stream began). */
  | { v: number; kind: "start"; jti: string; at: number }
  /**
   * How the stream ended: `files` is how many went into the zip whole, `missing` the media ids the zip
   * does not hold whole (the skipped ones for a short zip; every one for a zip that never closed, or
   * held nothing).
   */
  | {
      v: number;
      kind: "end";
      jti: string;
      at: number;
      outcome: StreamOutcome;
      files: number;
      missing: string[];
    }
  /** The daily self-check: the Worker's switch, and whether it could read the bucket. */
  | {
      v: number;
      kind: "heartbeat";
      at: number;
      mode: "on" | "off";
      r2: "ok" | "error";
    };

const isLocalHost = (host: string) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "[::1]" ||
  host.endsWith(".localhost");

/**
 * Where reports go, when an address is one this Worker will post to: https at the app's report path,
 * or plain http to a local host (a lane's `wrangler dev` beside its `next dev`). Anything else is
 * treated as no ask at all: the download goes ahead unreported, never refused, since a bad address is
 * the app's bug and never the guest's.
 */
export function reportAddress(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 2048) return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const secure =
    url.protocol === "https:" ||
    (url.protocol === "http:" && isLocalHost(url.hostname));
  if (!secure || url.username || url.password) return null;
  if (url.pathname !== REPORT_PATH || url.search || url.hash) return null;
  return url.href;
}

/** The address a verified token asks reports at, or null for a token that asks none. */
export function reportAddressOf(payload: ExportManifestPayload): string | null {
  return reportAddress((payload as { report?: unknown }).report);
}

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toHex(buffer: ArrayBuffer): string {
  return [...new Uint8Array(buffer)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** A report as the wire carries it: `${body}.${hmacHex("report:" + body)}`. */
export async function signReport(
  secret: string,
  report: Report,
): Promise<string> {
  const body = toBase64Url(JSON.stringify(report));
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    enc.encode(`report:${body}`),
  );
  return `${body}.${toHex(mac)}`;
}

/** A report's own ceiling: the app answers in well under a second, and waitUntil allows 30. */
export const REPORT_TIMEOUT_MS = 10_000;

/**
 * Post one report. Never throws (it runs after the answer, inside `waitUntil`): a report the app does not
 * take is logged (`export-report`) and dropped, and the walk that was waiting for it says what it can
 * without it.
 */
export async function sendReport(
  url: string,
  secret: string | undefined,
  report: Report,
): Promise<boolean> {
  if (!secret) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=UTF-8" },
      body: await signReport(secret, report),
      // A redirect would turn the POST into a GET; the app's report path answers where it is.
      redirect: "manual",
      signal: AbortSignal.timeout(REPORT_TIMEOUT_MS),
    });
    if (res.status >= 200 && res.status < 300) return true;
    console.warn(
      JSON.stringify({
        at: "export-report",
        kind: report.kind,
        status: res.status,
      }),
    );
    return false;
  } catch (error) {
    console.warn(
      JSON.stringify({
        at: "export-report",
        kind: report.kind,
        error: String(error),
      }),
    );
    return false;
  }
}
