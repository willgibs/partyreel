// THE HARNESS'S FIXTURE SERVER (the reel round, 2026-09-22). A tiny range-capable GET for the
// files in ../../fixtures, so the window reader meets in the lab exactly the shape it meets in
// production: a `206 Partial Content` with `Content-Range`, `Accept-Ranges` and `Content-Length`.
//
// WHY A ROUTE AND NOT `public/`: two reasons, both deliberate. The bucket's real CORS precondition
// (Range in AllowedHeaders, Content-Range / Accept-Ranges / Content-Length in ExposeHeaders) is not
// this lane's to land, so the harness must not depend on anything remote; and `public/` belongs to
// no one lane, while this folder does. It also means the 206 path is OURS, and a change in how Next
// serves static files can never silently turn this harness into a whole-file read.
//
// The lab's gate already covers it: src/proxy.ts runs designGateOpen on every /design request, so
// this answers a 404 in production without a key, like every other lab route.

import { readFile, stat } from "node:fs/promises";
import path from "node:path";

// Dev-only fixtures read off the working tree at request time (the lab is not traced into the
// production bundle), so nothing here may be cached or prerendered.
export const dynamic = "force-dynamic";

const FIXTURE_DIR = path.join(
  process.cwd(),
  "src/app/(dev)/design/(shell)/lab/tools/reel-video/fixtures",
);

const TYPES: Record<string, string> = {
  ".mov": "video/quicktime",
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".jpg": "image/jpeg",
};

/** A strict allow-list, which is also the whole path-traversal story: no slashes, no dots, no `..`. */
const SAFE_NAME = /^[a-z0-9-]+\.(mov|webm|mp4|jpg)$/;

function parseRange(
  header: string | null,
  size: number,
): { start: number; end: number } | null | "unsatisfiable" {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;
  // A suffix range ("bytes=-500"): the LAST n bytes. Demuxers use it to find a trailing index.
  if (rawStart === "") {
    const length = Number(rawEnd);
    if (!Number.isFinite(length) || length <= 0) return "unsatisfiable";
    return { start: Math.max(0, size - length), end: size - 1 };
  }
  const start = Number(rawStart);
  if (!Number.isFinite(start) || start >= size) return "unsatisfiable";
  const end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
  if (end < start) return "unsatisfiable";
  return { start, end };
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ name: string }> },
): Promise<Response> {
  const { name } = await ctx.params;
  if (!SAFE_NAME.test(name)) {
    return new Response("no such fixture", { status: 404 });
  }

  const file = path.join(FIXTURE_DIR, name);
  let size: number;
  try {
    size = (await stat(file)).size;
  } catch {
    return new Response("no such fixture", { status: 404 });
  }

  const type = TYPES[path.extname(name)] ?? "application/octet-stream";
  const base: Record<string, string> = {
    "content-type": type,
    "accept-ranges": "bytes",
    // The reader fetches no-store by contract; say so from this side too, so a stale body can
    // never stand in for a range read during a soak.
    "cache-control": "no-store",
  };

  const range = parseRange(request.headers.get("range"), size);
  if (range === "unsatisfiable") {
    return new Response(null, {
      status: 416,
      headers: { ...base, "content-range": `bytes */${size}` },
    });
  }

  // These files are a few hundred KB: reading and slicing keeps the range arithmetic in one place
  // and cannot leak a file handle. A real original would stream; a fixture does not need to.
  const bytes = await readFile(file);
  if (!range) {
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: { ...base, "content-length": String(size) },
    });
  }

  const slice = new Uint8Array(
    bytes.buffer,
    bytes.byteOffset + range.start,
    range.end - range.start + 1,
  );
  return new Response(slice, {
    status: 206,
    headers: {
      ...base,
      "content-length": String(slice.byteLength),
      "content-range": `bytes ${range.start}-${range.end}/${size}`,
    },
  });
}

/** Some demuxers probe with HEAD before the first range. Same headers, no body. */
export async function HEAD(
  request: Request,
  ctx: { params: Promise<{ name: string }> },
): Promise<Response> {
  const response = await GET(request, ctx);
  return new Response(null, {
    status: response.status === 206 ? 200 : response.status,
    headers: response.headers,
  });
}
