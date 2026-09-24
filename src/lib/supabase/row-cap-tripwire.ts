/**
 * THE ROW-CAP TRIPWIRE: a warning in Sentry the first time a response comes back CLIPPED at
 * PostgREST's 1,000 rows (the 1,000-row round, 2026-09-23).
 *
 * WHY: PostgREST cuts a read at `max_rows` with no error and no flag (`src/lib/db/read-all.ts` holds
 * the rules), so a clipped read looks exactly like a complete one to the code that made it. The
 * static guard (`row-cap-policy.test.ts`) refuses the shapes that CAN clip; this catches the one
 * that DID, in production, from the only place that still knows: the response's `Content-Range`.
 *
 * It wraps the fetch every Supabase client is built with (`global: { fetch }` in `server.ts`,
 * `admin.ts` and `client.ts`) and, once a response resolves, reads `Content-Range`
 * (`<start>-<end>/<total>`). It calls `capture` when all of these hold:
 *
 *  - the URL is a REST request (`/rest/v1/`): the same fetch carries auth, storage and realtime;
 *  - it is a GET (a table, a view, or an RPC called with `get`), or a POST to `/rest/v1/rpc/`
 *    (a function call): writes are never clipped, a PATCH returned all 1,040 rows it touched;
 *  - the response spans at least `MAX_ROWS` rows;
 *  - the caller did not bound it: no `limit` query parameter at or under `MAX_ROWS` (a `limit`
 *    above the cap is clipped all the same), and for a function call no `p_limit` in its JSON body.
 *    A paged read (`readAllPages` asks `limit=1000`) and a paged function are never flagged.
 *
 * ONCE PER `METHOD path` PER PROCESS, per sink: the first clip names the read, and a busy page does
 * not flood the project. The warning carries the PATH ONLY, never the query string, which can hold
 * tokens, addresses and ids.
 *
 * IT NEVER CHANGES A RESPONSE: it reads one header, never the body, never throws (a failure of its
 * own is swallowed; the fetch's own failure passes through untouched), and a HEAD, a non-REST URL
 * and a write go straight through.
 *
 * ★ SENTRY IS IMPORTED LAZILY, on the first hit. The three clients are imported all over the app
 * and its tests; a static import would pull `@sentry/nextjs` into every one of those module graphs
 * for a path that should never run.
 */
import { MAX_ROWS } from "@/lib/db/read-all";

/** What a warning names: the request's method and its path, never its query string. */
export type RowCapHit = { method: string; path: string };

/** Where a hit goes. The default sends a Sentry warning; a test or a script passes its own. */
export type RowCapCapture = (hit: RowCapHit) => void;

const captureInSentry: RowCapCapture = (hit) => {
  void import("@/lib/observability/sentry")
    .then(({ captureWarning }) => captureWarning("db", "row_cap_hit", hit))
    .catch(() => {});
};

/** The `METHOD path`s each sink has already heard about, for the life of the process. */
const heard = new WeakMap<RowCapCapture, Set<string>>();

/**
 * A fetch that behaves exactly like `inner` and warns once per read that came back clipped.
 * With no `inner`, it calls the global `fetch` at request time (as supabase-js's own default does),
 * so a fetch patched after the client was built is still the one that runs.
 */
export function withRowCapTripwire(
  inner?: typeof fetch,
  capture: RowCapCapture = captureInSentry,
): typeof fetch {
  const send: typeof fetch = inner ?? ((input, init) => fetch(input, init));
  const tripwire = (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    const read = readOf(input, init);
    if (!read) return send(input, init);
    return send(input, init).then((response) => {
      try {
        if (clipped(response) && !read.bounded) warnOnce(capture, read);
      } catch {
        // The tripwire only ever observes: nothing it does may fail the request.
      }
      return response;
    });
  };
  return tripwire as typeof fetch;
}

type Read = { method: string; path: string; bounded: boolean };

/** The request as the tripwire sees it, or null when it is not a read it watches. */
function readOf(input: RequestInfo | URL, init?: RequestInit): Read | null {
  try {
    // A string (what supabase-js passes), a URL, or a Request; no `instanceof`, so a realm or a
    // runtime without the global `Request` class reads the same.
    const href =
      typeof input === "string"
        ? input
        : "href" in input
          ? input.href
          : input.url;
    if (!href.includes("/rest/v1/")) return null;
    const method = (
      init?.method ??
      (typeof input === "object" && "method" in input ? input.method : "GET")
    ).toUpperCase();
    const url = new URL(href);
    const rpc = url.pathname.includes("/rest/v1/rpc/");
    if (method !== "GET" && !(method === "POST" && rpc)) return null;
    const limit = url.searchParams.get("limit");
    const limited = limit !== null && Number(limit) <= MAX_ROWS;
    const paged =
      rpc &&
      (hasNumber(url.searchParams.get("p_limit")) || bodyHasLimit(init?.body));
    return { method, path: url.pathname, bounded: limited || paged };
  } catch {
    return null;
  }
}

/** A `p_limit` in a function call's JSON body (supabase-js sends the arguments as a string). */
function bodyHasLimit(body: RequestInit["body"] | undefined): boolean {
  if (typeof body !== "string") return false;
  try {
    const args: unknown = JSON.parse(body);
    return (
      typeof args === "object" &&
      args !== null &&
      hasNumber((args as { p_limit?: unknown }).p_limit)
    );
  } catch {
    return false;
  }
}

/** A limit that bounds: a number, not a null (a null `p_limit` is today's unlimited read). */
function hasNumber(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  return (
    typeof value === "string" &&
    value.trim() !== "" &&
    Number.isFinite(Number(value))
  );
}

/** Did the response span at least MAX_ROWS rows? `Content-Range: 0-999/*` does. */
function clipped(response: Response): boolean {
  const range = response.headers.get("content-range");
  const span = range ? /^\s*(\d+)-(\d+)\//.exec(range) : null;
  return span !== null && Number(span[2]) - Number(span[1]) + 1 >= MAX_ROWS;
}

function warnOnce(capture: RowCapCapture, read: Read): void {
  let seen = heard.get(capture);
  if (!seen) heard.set(capture, (seen = new Set()));
  const key = `${read.method} ${read.path}`;
  if (seen.has(key)) return;
  seen.add(key);
  capture({ method: read.method, path: read.path });
}
