/**
 * A LINK THAT NAMES NOTHING ANSWERS 404, AND THE SERVER DRAWS IT (stale-link, 2026-09-30): a stale QR code, a
 * mistyped album link, a handle nobody holds.
 *
 * ★ WHY THE PROXY DECIDES THE STATUS. Next 16.2.6 gives a page no way to set its own status. A `notFound()` thrown
 * while a page renders is served as Next's error shell (`<html id="__next_error__">` and an empty body, the not-found
 * drawn by the client once its script has run: `app-render.js`, `ErrorApp`), so a guest on a cold phone met a white
 * page, and a reader with no script met it for good; and a page that draws its own not-found answers 200. The one
 * status a server-drawn page can carry is the one set BEFORE it renders, and the proxy is the only code that runs
 * then (the docs' own advice for a real 404: `loading.md`, "Status codes"). So the proxy asks the database the one
 * question the page would, and when the link names nothing it sends the request on with a 404; the page, finding the
 * same nothing, draws its segment's not-found itself (`e/[token]/page.tsx`, `u/[slug]/page.tsx`), which Next renders
 * with the not-found's own head because the status is already 404 (measured on `next start`).
 *
 * ★ THE PAGE STAYS THE ONE JUDGE OF WHAT TO DRAW; THIS ONLY SETS THE STATUS. Each read is the page's own RPC asked by
 * nobody (`createAnonClient`), and each RPC's "nothing" is the same for every caller: an unknown or deleted token
 * (`get_event_by_qr_token` filters `deleted_at` and nothing else a caller changes; a private or blocked album still
 * answers a row), a handle nobody holds (`get_public_profile`'s lookup is the slug alone). So the two agree by
 * construction. Any doubt, an error or an answer slower than `TIMEOUT_MS`, is "not gone": the page then draws its
 * not-found at 200, still server-drawn and still noindex, and never the white shell.
 *
 * ★ THE COST: one RPC before every PAGE LOAD of `/e/<token>` and `/u/<handle>`, whose server time is about 10 to 25
 * ms for a link and 15 to 45 for a handle (measured against the shared database; from this machine the round trip adds
 * its own ~30 ms, which Vercel's iad1 beside it does not). Never on the router's own fetches (a client navigation or a
 * prefetch, `isDocumentRequest`), and never for the demo, which exists by construction.
 */
import "server-only";

import { isDemoToken } from "@/lib/demo";
import { createAnonClient } from "@/lib/supabase/anon";

/** How long the proxy waits on the database before letting the page answer alone. */
export const TIMEOUT_MS = 750;

/** A path the database decides exists: the guest link (`/e/<token or custom slug>`) or a public profile. */
export type GoneLinkLookup =
  | { kind: "guest-link"; token: string }
  | { kind: "profile"; slug: string };

// Exactly the page's own path, one segment and nothing under it (`/e/<token>/card` is the card route, which answers
// for itself). A trailing slash is the same page.
const LINK_PATH = /^\/(e|u)\/([^/]+)\/?$/;

/**
 * Which lookup a path is, if any. The segment is decoded the way Next decodes the page's param, so the proxy asks
 * about exactly the token or handle the page will; a segment that does not decode names nothing we can ask about.
 */
export function goneLinkLookup(pathname: string): GoneLinkLookup | null {
  const match = LINK_PATH.exec(pathname);
  if (!match) return null;
  let value: string;
  try {
    value = decodeURIComponent(match[2]);
  } catch {
    return null;
  }
  if (!value) return null;
  return match[1] === "e"
    ? { kind: "guest-link", token: value }
    : { kind: "profile", slug: value };
}

// The Fetch Metadata destinations of a page load: a tab's, or a frame's.
const PAGE_DESTINATIONS = new Set(["document", "iframe", "frame"]);

/**
 * A page load: a GET or a HEAD whose `Sec-Fetch-Dest` is a document, or that sends none (an unfurler, a crawler, a
 * link checker: whoever reads the status). A Server Action is a POST.
 *
 * ★ NOT THE ROUTER'S OWN FETCHES, AND NOT BY ITS HEADERS: the proxy never sees them. Next strips `RSC`,
 * `Next-Router-State-Tree` and `Next-Router-Prefetch` from the request a proxy reads (`proxy.md`, "RSC requests and
 * rewrites"), so a client navigation or a prefetch looks like a page load but for the browser's own `Sec-Fetch-Dest`,
 * which is `empty` on a `fetch()`. Those are skipped on purpose: there the app is already running and draws the page's
 * not-found as the payload arrives, and a 404 on the payload would send the router to a full reload of the link
 * (`fetch-server-response.js`: a response that is not ok is handled "like a mpa navigation"). So a navigation inside
 * the app gets the same screen at 200 with no reload, a prefetch costs no read, and only a page load pays for the
 * status it carries. Next's reason for stripping, an RSC request answered differently from the page, does not bite:
 * both draw the same not-found, and only the status differs.
 */
export function isDocumentRequest(request: {
  method: string;
  headers: Headers;
}): boolean {
  if (request.method !== "GET" && request.method !== "HEAD") return false;
  const destination = request.headers.get("sec-fetch-dest");
  return destination === null || PAGE_DESTINATIONS.has(destination);
}

/** Whether the database says, in time, that this link names nothing. Anything short of a clear "nothing" is false. */
async function isGone(lookup: GoneLinkLookup): Promise<boolean> {
  try {
    const supabase = createAnonClient();
    const signal = AbortSignal.timeout(TIMEOUT_MS);
    if (lookup.kind === "guest-link") {
      const { data, error } = await supabase
        .rpc("get_event_by_qr_token", { p_qr_token: lookup.token })
        .abortSignal(signal);
      return !error && Array.isArray(data) && data.length === 0;
    }
    // The page's own normalisation (`getPublicProfile`), so both ask about the same handle.
    const { data, error } = await supabase
      .rpc("get_public_profile", { p_slug: lookup.slug.trim().toLowerCase() })
      .abortSignal(signal);
    return !error && data === null;
  } catch {
    return false;
  }
}

/**
 * The status the proxy sends a request on with: 404 for a document request whose link names nothing, and nothing
 * otherwise (the page's own answer stands).
 */
export async function goneLinkStatus(request: {
  method: string;
  headers: Headers;
  nextUrl: { pathname: string };
}): Promise<404 | undefined> {
  if (!isDocumentRequest(request)) return undefined;
  const lookup = goneLinkLookup(request.nextUrl.pathname);
  if (!lookup) return undefined;
  if (lookup.kind === "guest-link" && isDemoToken(lookup.token))
    return undefined;
  return (await isGone(lookup)) ? 404 : undefined;
}
