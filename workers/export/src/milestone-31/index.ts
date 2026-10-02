// VENDORED, VERBATIM BELOW THIS HEADER: `git show milestone-31:workers/export/src/index.ts`, the Worker partyreel.com
// runs against since milestone 30 (and launch-prep's app until this lane's merge). compat.test.ts replays those apps'
// requests at it and at today's Worker and holds the answers equal. Never edit what follows; a new milestone that
// changes the contract vendors its own.

/**
 * Partyreel "Download all" zip-export Worker.
 *
 * Flow: the browser form-POSTs a signed manifest token (minted + authorized by the app). We verify the
 * HMAC + expiry + per-key layout, then stream a STORE-only zip of the named R2 objects straight from the
 * PRIMARY bucket to the response — bytes never buffer fully (one object in-flight) and never touch Vercel.
 *
 * SECURITY: we NEVER authorize here. A valid signature ⇒ the app authorized this exact set at mint. We add
 * a per-key layout re-check (defense-in-depth) so a read can only ever hit a canonical `events/…` object.
 *
 * ★ ONE DEPLOYMENT, TWO APPS: partyreel.com (milestone 29's app) and launch-prep's both post here, so
 * every path but `/check` answers exactly as it did at milestone 29 (`compat.test.ts` replays that
 * app's requests at the vendored milestone-29 Worker and at this one, answer for answer). `/check` is
 * new and additive: the app asks what a token's zip would hold before the browser takes it (`check.ts`).
 */
import { makeZip } from "client-zip";

import { CHECK_PATH, checkItems } from "./check";
import { type ExportItem, verifyExportToken } from "./export-token";

/*
 * ★ THIS MODULE EXPORTS ITS HANDLER AND NOTHING ELSE THAT RUNS. workerd reads every named export of
 * the entry module as an entrypoint, and refuses to START on one that is not a handler or a class
 * ("Incorrect type for map entry 'CHECK_PATH'", caught under `wrangler dev`; a dry-run build
 * passes it). A constant the tests need lives in `check.ts`.
 */

interface Env {
  PRIMARY: R2Bucket;
  EXPORT_SIGNING_SECRET: string;
  EXPORT_MODE?: string;
}

/**
 * ★ ANY ORIGIN MAY READ A CHECK, AND THAT IS SAFE: it carries no cookie and no credential, only the
 * token in its body, and it answers only which of that token's own objects exist, which the token's
 * holder could learn by downloading them. So the alias, partyreel.com and a lane's localhost all
 * read it with no list to keep in step.
 */
const CORS: Record<string, string> = { "Access-Control-Allow-Origin": "*" };

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...CORS,
    },
  });
}

/**
 * `POST /check`, the token as the whole `text/plain` body. ★ `text/plain`, NOT a form: it keeps the
 * request a CORS "simple" one (no preflight), and a Worker from before this path (which streams any
 * POST whose form carries `t`) answers it a bare 400 without reading an object, so an app that
 * reaches an older deployment loses one quick request and goes ahead with the zip.
 */
async function handleCheck(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...CORS,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }
  if (request.method !== "POST") {
    return json({ ok: false, reason: "method_not_allowed" }, 405);
  }
  if ((env.EXPORT_MODE ?? "on") === "off") {
    return json({ ok: false, reason: "paused" }, 503);
  }

  let token: string | null = null;
  try {
    token = (await request.text()).trim() || null;
  } catch {
    return json({ ok: false, reason: "bad_request" }, 400);
  }
  const verified = await verifyExportToken(
    env.EXPORT_SIGNING_SECRET,
    token,
    Date.now(),
  );
  if (!verified.ok) return json({ ok: false, reason: "forbidden" }, 403);

  try {
    const result = await checkItems(
      env.PRIMARY,
      verified.payload.items,
      request.signal,
    );
    if (result.missing.length > 0) {
      // The one place a hollow or short zip is seen before it is sent: observability keeps it.
      console.warn(
        JSON.stringify({
          at: "export-check",
          jti: verified.payload.jti,
          eventId: verified.payload.eventId,
          items: result.items,
          found: result.found,
        }),
      );
    }
    return json({ ok: true, ...result }, 200);
  } catch (error) {
    // The client left (the app's cancel): nobody is listening, and nothing more is read.
    if (request.signal?.aborted) return new Response(null, { status: 499 });
    console.error(
      JSON.stringify({
        at: "export-check",
        jti: verified.payload.jti,
        error: String(error),
      }),
    );
    return json({ ok: false, reason: "unavailable" }, 502);
  }
}

/** Lazily pull each object as the zip stream demands it (bounded memory). A raced-deleted object is
 *  SKIPPED, never fatal — aborting mid-stream would corrupt an already-started download. */
async function* streamFiles(
  items: ExportItem[],
  env: Env,
  jti: string,
): AsyncGenerator<{
  input: ReadableStream<Uint8Array>;
  name: string;
  size: number;
}> {
  let skipped = 0;
  for (const it of items) {
    const obj = await env.PRIMARY.get(it.key);
    if (!obj) {
      skipped += 1;
      continue;
    }
    yield { input: obj.body, name: it.name, size: obj.size };
  }
  // The README's promise kept: a skipped object is logged, never silent.
  if (skipped > 0) {
    console.warn(
      JSON.stringify({
        at: "export-stream",
        jti,
        items: items.length,
        skipped,
      }),
    );
  }
}

/** The stream, answering every request exactly as milestone 29's Worker does (`compat.test.ts`). */
async function handleStream(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  // Redeploy-layer kill-switch (the app's DB flag is the no-redeploy layer).
  if ((env.EXPORT_MODE ?? "on") === "off") {
    return new Response("Downloads are paused right now.", { status: 503 });
  }

  let token: string | null = null;
  try {
    const form = await request.formData();
    const t = form.get("t");
    token = typeof t === "string" ? t : null;
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const result = await verifyExportToken(
    env.EXPORT_SIGNING_SECRET,
    token,
    Date.now(),
  );
  if (!result.ok) return new Response("Forbidden", { status: 403 });

  const zip = makeZip(
    streamFiles(result.payload.items, env, result.payload.jti),
  );
  return new Response(zip, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${result.payload.zipName}"`,
      "Cache-Control": "no-store",
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).pathname === CHECK_PATH) {
      return handleCheck(request, env);
    }
    return handleStream(request, env);
  },
} satisfies ExportedHandler<Env>;
