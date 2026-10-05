/**
 * A FAKE GOOGLE DRIVE behind a `fetch` stub, for the Worker's suite: files with their parents, sizes, MD5s, bin and
 * our private marks; resumable sessions that take a whole PUT or chunks with Content-Range, answer 308 with Range,
 * and answer `bytes * /size` status queries; folder listings; and the failures section 5 names, each armed by a test
 * (Drive full, Google's day, "slow down" N times, a lost grant, an admin's policy, a parent gone, a stored MD5 that is
 * not what was sent, an expired session). Nothing touches the network.
 */
import { createHash } from "node:crypto";

export type FakeFile = {
  id: string;
  name: string;
  parents: string[];
  size: number;
  md5: string;
  trashed: boolean;
  appProperties: Record<string, string>;
  modifiedTime?: string;
  description?: string;
  mimeType?: string;
};

type Session = {
  uri: string;
  meta: {
    name: string;
    parents: string[];
    mimeType: string;
    appProperties: Record<string, string>;
    modifiedTime?: string;
    description?: string;
  };
  total: number;
  received: Uint8Array[];
  receivedBytes: number;
  done: FakeFile | null;
  expired: boolean;
};

export type FakeDriveFailures = {
  /** Every upload start answers 403 storageQuotaExceeded. */
  quota?: boolean;
  /** Every upload start answers 403 dailyLimitExceeded. */
  daily?: boolean;
  /** The next N Google calls answer 429. */
  rate?: number;
  /** Every call answers 401. */
  auth?: boolean;
  /** Every upload start answers 403 domainPolicy. */
  domain?: boolean;
  /** Upload starts into this parent answer 404 (the folder is gone). */
  goneParent?: string;
  /** The next finished upload stores this MD5 instead of the bytes' own. */
  corruptMd5?: string;
};

const md5 = (bytes: Uint8Array) =>
  createHash("md5").update(bytes).digest("hex");

function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function googleError(status: number, reason: string): Response {
  return json(
    { error: { code: status, errors: [{ reason, message: reason }] } },
    status,
  );
}

async function bodyBytes(
  body: BodyInit | null | undefined,
): Promise<Uint8Array> {
  if (!body) return new Uint8Array(0);
  return new Uint8Array(await new Response(body as BodyInit).arrayBuffer());
}

export class FakeDrive {
  files = new Map<string, FakeFile>();
  sessions = new Map<string, Session>();
  calls: { method: string; url: string }[] = [];
  deleted: string[] = [];
  failures: FakeDriveFailures = {};
  private next = 1;

  /** A file already in her Drive (an earlier send's, or one she made). */
  add(file: Partial<FakeFile> & { size: number }): FakeFile {
    const f: FakeFile = {
      id: file.id ?? `file-${this.next++}`,
      name: file.name ?? "a file",
      parents: file.parents ?? ["root"],
      size: file.size,
      md5: file.md5 ?? "0".repeat(32),
      trashed: file.trashed ?? false,
      appProperties: file.appProperties ?? {},
    };
    this.files.set(f.id, f);
    return f;
  }

  view(file: FakeFile) {
    return {
      id: file.id,
      size: String(file.size),
      md5Checksum: file.md5,
      trashed: file.trashed,
      appProperties: file.appProperties,
    };
  }

  /** The stub to hand the adapter. */
  fetch: typeof fetch = async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const method = (init?.method ?? "GET").toUpperCase();
    this.calls.push({ method, url: url.href });
    if (this.failures.auth) return googleError(401, "authError");
    if ((this.failures.rate ?? 0) > 0) {
      this.failures.rate = (this.failures.rate ?? 0) - 1;
      return googleError(429, "rateLimitExceeded");
    }

    // A resumable session's own address.
    const session = this.sessions.get(url.href);
    if (session && method === "PUT") return this.put(session, init);

    if (
      url.hostname === "www.googleapis.com" &&
      url.pathname === "/upload/drive/v3/files" &&
      method === "POST"
    ) {
      if (this.failures.quota) return googleError(403, "storageQuotaExceeded");
      if (this.failures.daily) return googleError(403, "dailyLimitExceeded");
      if (this.failures.domain) return googleError(403, "domainPolicy");
      const meta = JSON.parse(String(init?.body ?? "{}"));
      if (
        this.failures.goneParent &&
        meta.parents?.includes(this.failures.goneParent)
      ) {
        return googleError(404, "notFound");
      }
      const uri = `https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=s${this.next++}`;
      const headers = new Headers(init?.headers);
      this.sessions.set(uri, {
        uri,
        meta: {
          name: meta.name,
          parents: meta.parents ?? [],
          mimeType: meta.mimeType,
          appProperties: meta.appProperties ?? {},
          modifiedTime: meta.modifiedTime,
          description: meta.description,
        },
        total: Number(headers.get("x-upload-content-length") ?? 0),
        received: [],
        receivedBytes: 0,
        done: null,
        expired: false,
      });
      return new Response(null, { status: 200, headers: { location: uri } });
    }

    if (
      url.hostname === "www.googleapis.com" &&
      url.pathname.startsWith("/drive/v3/files/")
    ) {
      const id = decodeURIComponent(
        url.pathname.slice("/drive/v3/files/".length),
      );
      const file = this.files.get(id);
      if (method === "DELETE") {
        if (!file) return googleError(404, "notFound");
        this.files.delete(id);
        this.deleted.push(id);
        return new Response(null, { status: 204 });
      }
      if (!file) return googleError(404, "notFound");
      return json(this.view(file));
    }

    if (
      url.hostname === "www.googleapis.com" &&
      url.pathname === "/drive/v3/files" &&
      method === "GET"
    ) {
      const q = url.searchParams.get("q") ?? "";
      const byMedia = /key='pr_media' and value='([^']+)'/.exec(q);
      const byParent = /'([^']+)' in parents/.exec(q);
      let list = [...this.files.values()].filter((f) => !f.trashed);
      if (byMedia)
        list = list.filter((f) => f.appProperties.pr_media === byMedia[1]);
      if (byParent) list = list.filter((f) => f.parents.includes(byParent[1]!));
      return json({ files: list.map((f) => this.view(f)) });
    }

    return googleError(400, "badRequest");
  };

  private async put(session: Session, init?: RequestInit): Promise<Response> {
    if (session.expired) return googleError(404, "notFound");
    const headers = new Headers(init?.headers);
    const range = headers.get("content-range");
    const bytes = await bodyBytes(init?.body);
    if (range && range.startsWith("bytes */")) {
      if (session.done) return json(this.view(session.done), 200);
      return session.receivedBytes > 0
        ? new Response(null, {
            status: 308,
            headers: { range: `bytes=0-${session.receivedBytes - 1}` },
          })
        : new Response(null, { status: 308 });
    }
    if (range) {
      const match = /bytes (\d+)-(\d+)\/(\d+)/.exec(range);
      if (!match || Number(match[1]) !== session.receivedBytes)
        return googleError(400, "badContentRange");
    } else if (session.receivedBytes !== 0) {
      return googleError(400, "badContentRange");
    }
    session.received.push(bytes);
    session.receivedBytes += bytes.length;
    if (session.receivedBytes < session.total) {
      return new Response(null, {
        status: 308,
        headers: { range: `bytes=0-${session.receivedBytes - 1}` },
      });
    }
    const all = new Uint8Array(session.receivedBytes);
    let at = 0;
    for (const chunk of session.received) {
      all.set(chunk, at);
      at += chunk.length;
    }
    const file: FakeFile = {
      id: `file-${this.next++}`,
      name: session.meta.name,
      parents: session.meta.parents,
      size: all.length,
      md5: this.failures.corruptMd5 ?? md5(all),
      trashed: false,
      appProperties: session.meta.appProperties,
      modifiedTime: session.meta.modifiedTime,
      description: session.meta.description,
      mimeType: session.meta.mimeType,
    };
    this.failures.corruptMd5 = undefined;
    this.files.set(file.id, file);
    session.done = file;
    return json(this.view(file), 200);
  }
}
