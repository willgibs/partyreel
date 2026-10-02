/**
 * WHAT THE WORKER SAID ABOUT ONE EXPORT, FOR THE WALK THAT STARTED IT (`export-ends`): has its stream begun,
 * and how did it end. The walk polls this between handing a zip to the browser and saying it is saved
 * (`components/app/export/export-walk.ts`), because the page goes blind the moment the browser's download
 * manager takes the file; the Worker's reports (`/api/export/report`) are what it can see instead.
 *
 * ★ READ BY THE EXPORT'S OWN NONCE, never by a session: the token's `jti`, 128 random bits the mint hands
 * only to the walk that asked for the zip. It answers the stream's state and the media ids the zip lacks,
 * which are that token's own items, so it tells its holder nothing the zip would not. An unknown nonce and
 * one with nothing heard yet answer the same `none`. POST, so the nonce never sits in a URL or a log.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { readStreamWord } from "@/lib/db/queries/exports";
import { JTI_RE } from "@/lib/export/report";
import { streamStateOf } from "@/lib/export/walk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ jti: z.string().regex(JTI_RE) });

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400, headers: noStore },
    );
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400, headers: noStore },
    );
  }

  try {
    const word = await readStreamWord(parsed.data.jti);
    return NextResponse.json(
      { ok: true, ...streamStateOf(word) },
      { headers: noStore },
    );
  } catch {
    // A read that failed is never "nothing heard": the walk asks again on its next tick.
    return NextResponse.json(
      { ok: false, code: "unavailable" },
      { status: 503, headers: noStore },
    );
  }
}
