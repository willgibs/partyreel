/**
 * Host reel .mp4 export: render-state poll (GET).
 *
 * Authz: getUser() (never getSession) + an own-event RLS read (host_id match, NOT the open-event
 * policy). GET reports the render state, finalizing from R2 when a client-encoded mp4 has landed (the
 * resilience net if the browser's /api/reel/upload finalize call never arrived). The export itself is a
 * client-side WebCodecs encode brokered by /api/reel/upload; this route only reflects state.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import { resolveOwnEvent } from "@/lib/reel/own-event";
import { getReelRenderState } from "@/lib/reel/render-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad() {
  return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
}

export async function GET(request: Request) {
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId || !z.uuid().safeParse(eventId).success) return bad();

  const ev = await resolveOwnEvent(eventId);
  if (!ev) {
    return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  }

  const state = await getReelRenderState(ev.id, ev.name);
  return NextResponse.json({ ok: true, ...state });
}
