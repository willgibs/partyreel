/**
 * THE INTERNAL ROUTES' DOOR (`/api/internal/drive/*`): every word from the Worker is a POST whose body is the signed
 * word itself (`protocol.ts`), verified before anything is read. Unsigned, re-signed with a changed body, or stale
 * past five minutes: 401, and nothing happens. A deployment without the Drive values answers 503 (the Worker treats
 * any non-2xx as "the app cannot answer" and backs off), never a half-check.
 */
import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";

import { verifyDriveWord } from "@/lib/drive/protocol";
import { driveConfigured, serverEnv } from "@/lib/env";
import { captureWarning } from "@/lib/observability/sentry";

/** The largest word the Worker sends (a report of 50 items, a check page of 100): anything past it is refused. */
const MAX_BODY = 256 * 1024;

export async function readDriveWord<T extends { at: number }>(
  request: Request,
  schema: z.ZodType<T>,
  route: string,
): Promise<{ ok: true; word: T } | { ok: false; response: NextResponse }> {
  if (!driveConfigured() || !serverEnv.DRIVE_WORKER_SECRET) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, code: "unavailable" },
        { status: 503 },
      ),
    };
  }
  const text = await request.text().catch(() => "");
  if (!text || text.length > MAX_BODY) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, code: "malformed" },
        { status: 400 },
      ),
    };
  }
  const verdict = verifyDriveWord(
    serverEnv.DRIVE_WORKER_SECRET,
    text.trim(),
    schema,
    Date.now(),
  );
  if (!verdict.ok) {
    if (verdict.reason !== "malformed") {
      // A bad signature or a stale word is someone else's request, or a Worker whose secret drifted: worth a look.
      captureWarning("security", "drive_internal_refused", {
        route,
        reason: verdict.reason,
      });
    }
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, code: verdict.reason },
        { status: verdict.reason === "malformed" ? 400 : 401 },
      ),
    };
  }
  return { ok: true, word: verdict.word };
}

/** Every internal answer: JSON, never cached. */
export function internalJson(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}
