/**
 * Pure request-header → forensic-facts shaping (trust-safety-forensics.md A3-lite). Extracted from the capture seam
 * so the shaping is unit-testable without a live Request. No I/O; runs anywhere Headers exists
 * (Node 22 / edge / Vitest).
 *
 * SCOPE GUARD: this is the ENTIRE per-upload capture set the ruling allows — IP, timestamp
 * (DB-side default), UA, UA client hints, Vercel coarse geo. The pre-strip EXIF capture is
 * counsel-gated (trust-safety-forensics.md decision 1); do not widen this without that sign-off.
 */

export type ForensicRequestFacts = {
  /** The client IP as Vercel resolved it (raw, by ruling; the table is deny-all). */
  ip: string | null;
  userAgent: string | null;
  /** Every `sec-ch-*` request header, verbatim (low-entropy hints arrive unprompted on Chromium). */
  clientHints: Record<string, string> | null;
  /** The `x-vercel-ip-*` coarse geo headers (city is URI-decoded); null when none present. */
  geo: Record<string, string> | null;
};

// Vercel sets x-real-ip to the true client IP; x-forwarded-for's FIRST hop is the fallback
// (later hops are proxies). Header order matters: prefer the platform-resolved value.
function extractIp(headers: Headers): string | null {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (!fwd) return null;
  const first = fwd.split(",")[0]?.trim();
  return first || null;
}

const GEO_HEADERS = [
  "x-vercel-ip-country",
  "x-vercel-ip-country-region",
  "x-vercel-ip-city",
  "x-vercel-ip-latitude",
  "x-vercel-ip-longitude",
  "x-vercel-ip-timezone",
  "x-vercel-ip-postal-code",
] as const;

export function extractForensicRequestFacts(
  headers: Headers,
): ForensicRequestFacts {
  const hints: Record<string, string> = {};
  headers.forEach((value, name) => {
    if (name.toLowerCase().startsWith("sec-ch-"))
      hints[name.toLowerCase()] = value;
  });

  const geo: Record<string, string> = {};
  for (const name of GEO_HEADERS) {
    const value = headers.get(name);
    if (!value) continue;
    // Vercel URI-encodes the city (e.g. S%C3%A3o%20Paulo); decode for readability, keep the raw
    // value if decoding throws (malformed input must never lose the capture).
    if (name === "x-vercel-ip-city") {
      try {
        geo[name] = decodeURIComponent(value);
      } catch {
        geo[name] = value;
      }
    } else {
      geo[name] = value;
    }
  }

  return {
    ip: extractIp(headers),
    userAgent: headers.get("user-agent"),
    clientHints: Object.keys(hints).length ? hints : null,
    geo: Object.keys(geo).length ? geo : null,
  };
}
