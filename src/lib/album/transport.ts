/**
 * THE BROWSER'S TRANSPORT: the paged album's routes over `fetch`, one for a guest (the event's
 * `qr_token` and the device's session token in the BODY, never a URL: a capability in a query string
 * ends up in a log, a referrer and somebody's history) and one for the host (their session cookie).
 *
 * The poll is conditional: the validator the store holds rides `If-None-Match`, and a 304 comes back
 * as `{ status: 304 }` with no body read. Anything that is not a 200 or a 304 throws, and the store
 * keeps what it had (store.ts).
 *
 * ★ AN OPEN ALBUM'S KEY AT THE CDN rides each real answer's `x-album-edge` (edge-version.ts), read here
 * into `edgeKey` and checked for its shape (a wire value is data); `guestAlbumVersion` is the cheap ask
 * the store's poll makes with it. The host's routes never name one.
 */
import {
  ALBUM_EDGE_HEADER,
  ALBUM_TOKEN_HEADER,
  albumVersionUrl,
  edgeKeyOf,
  edgeWindowOf,
  readVersionAnswer,
  servedFromCache,
  type AlbumVersionReply,
} from "@/lib/album/edge-version";
import type { AlbumTransport, SyncResult } from "@/lib/album/store";
import type {
  AlbumCursor,
  AlbumLinksBody,
  AlbumManifestPageBody,
  GuestWhoTuple,
  HostWhoTuple,
} from "@/lib/events/album-wire";

type Fetch = typeof fetch;

async function postJson(
  fetcher: Fetch,
  url: string,
  body: unknown,
  headers: Record<string, string> = {},
): Promise<Response> {
  return fetcher(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

async function syncOver(
  fetcher: Fetch,
  url: string,
  body: Record<string, unknown>,
  req: { since: number | null; etag: string | null },
): Promise<SyncResult> {
  const res = await postJson(
    fetcher,
    url,
    req.since === null ? body : { ...body, since: req.since },
    req.etag ? { "If-None-Match": req.etag } : {},
  );
  const edgeKey = edgeKeyOf(res.headers.get(ALBUM_EDGE_HEADER));
  if (res.status === 304) return { status: 304, edgeKey };
  if (!res.ok) throw new Error(`album sync: ${res.status}`);
  return {
    status: 200,
    etag: res.headers.get("etag"),
    body: await res.json(),
    edgeKey,
  };
}

async function jsonOf<T>(res: Response, label: string): Promise<T> {
  if (!res.ok) throw new Error(`${label}: ${res.status}`);
  return (await res.json()) as T;
}

/** A guest's transport. `sessionToken` is read at each call (a join can mint one mid-visit). */
export function guestAlbumTransport(opts: {
  qrToken: string;
  sessionToken?: () => string | null;
  fetch?: Fetch;
}): AlbumTransport<GuestWhoTuple> {
  const fetcher = opts.fetch ?? fetch;
  const base = () => {
    const token = opts.sessionToken?.() ?? null;
    return token
      ? { qr_token: opts.qrToken, session_token: token }
      : { qr_token: opts.qrToken };
  };
  return {
    sync: (req) => syncOver(fetcher, "/api/album/guest/sync", base(), req),
    manifest: async (after: AlbumCursor) =>
      jsonOf<AlbumManifestPageBody>(
        await postJson(fetcher, "/api/album/guest/manifest", {
          ...base(),
          after,
        }),
        "album manifest",
      ),
    links: async (ids: string[]) =>
      jsonOf<AlbumLinksBody<GuestWhoTuple>>(
        await postJson(fetcher, "/api/album/guest/media", { ...base(), ids }),
        "album links",
      ),
  };
}

/**
 * THE CHEAP ASK: an open album's version, from the CDN (edge-version.ts), for the store's poll.
 *
 *  - The capability rides a header, never the URL: the URL names the album by the key a real sync handed
 *    the device, and the window its clock is in, set by the server's own time once a `clock` answer gave it.
 *  - ★ NOTHING OF THE VIEWER RIDES (`credentials: "omit"`): no cookie, so nothing the route could answer
 *    personally even reaches it.
 *  - ★ AN ORDINARY REQUEST (`cache: "default"`): a `no-store` or `no-cache` fetch adds `Pragma: no-cache`,
 *    which sends the CDN back to the function, so every lit phone would reach it again. The answer's own
 *    `max-age=0, must-revalidate` keeps the browser from reusing it unasked.
 *
 * The reply says whether the CDN answered from its cache (`servedFromCache`): a room is asking this album too.
 * Anything that is not a 200 with a readable answer throws: the store then asks the album itself.
 */
export function guestAlbumVersion(opts: {
  qrToken: string;
  fetch?: Fetch;
  now?: () => number;
}): (key: string) => Promise<AlbumVersionReply> {
  const fetcher = opts.fetch ?? fetch;
  const now = opts.now ?? Date.now;
  /** The server's clock less this device's, from the last `clock` answer. */
  let offset = 0;
  return async (key) => {
    const res = await fetcher(
      albumVersionUrl(key, edgeWindowOf(now() + offset)),
      {
        method: "GET",
        headers: { [ALBUM_TOKEN_HEADER]: opts.qrToken },
        credentials: "omit",
        cache: "default",
      },
    );
    if (!res.ok) throw new Error(`album version: ${res.status}`);
    const answer = readVersionAnswer(await res.json());
    if (!answer) throw new Error("album version: an answer it cannot read");
    if (answer.kind === "clock") offset = answer.now - now();
    return { answer, fromCache: servedFromCache(res.headers) };
  };
}

/** The host's transport for one of their events. */
export function hostAlbumTransport(opts: {
  eventId: string;
  fetch?: Fetch;
}): AlbumTransport<HostWhoTuple> {
  const fetcher = opts.fetch ?? fetch;
  const root = `/api/album/host/${encodeURIComponent(opts.eventId)}`;
  return {
    sync: (req) => syncOver(fetcher, `${root}/sync`, {}, req),
    manifest: async (after: AlbumCursor) =>
      jsonOf<AlbumManifestPageBody>(
        await postJson(fetcher, `${root}/manifest`, { after }),
        "album manifest",
      ),
    links: async (ids: string[]) =>
      jsonOf<AlbumLinksBody<HostWhoTuple>>(
        await postJson(fetcher, `${root}/media`, { ids }),
        "album links",
      ),
  };
}
