/**
 * Partyreel "Download all" zip-export Worker.
 *
 * Flow: the browser form-POSTs a signed manifest token (minted + authorized by the app). We verify the
 * HMAC + expiry + per-key layout, then stream a STORE-only zip of the named R2 objects straight from the
 * PRIMARY bucket to the response — bytes never buffer fully (one object in-flight) and never touch Vercel.
 *
 * SECURITY: we NEVER authorize here. A valid signature ⇒ the app authorized this exact set at mint. We add
 * a per-key layout re-check (defense-in-depth) so a read can only ever hit a canonical `events/…` object.
 */
import { makeZip } from "client-zip";

import { type ExportItem, verifyExportToken } from "./export-token";

interface Env {
  PRIMARY: R2Bucket;
  EXPORT_SIGNING_SECRET: string;
  EXPORT_MODE?: string;
}

/** Lazily pull each object as the zip stream demands it (bounded memory). A raced-deleted object is
 *  SKIPPED, never fatal — aborting mid-stream would corrupt an already-started download. */
async function* streamFiles(
  items: ExportItem[],
  env: Env,
): AsyncGenerator<{
  input: ReadableStream<Uint8Array>;
  name: string;
  size: number;
}> {
  for (const it of items) {
    const obj = await env.PRIMARY.get(it.key);
    if (!obj) continue;
    yield { input: obj.body, name: it.name, size: obj.size };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
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

    const zip = makeZip(streamFiles(result.payload.items, env));
    return new Response(zip, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${result.payload.zipName}"`,
        "Cache-Control": "no-store",
      },
    });
  },
} satisfies ExportedHandler<Env>;
