/**
 * Host reel .mp4 export: trigger (POST) + poll (GET).
 *
 * Authz: getUser() (never getSession) + an own-event RLS read (host_id match, NOT the open-event
 * policy). POST kicks off (or serves the cached) render via the render service; GET reports the render
 * state, finalizing from R2 when the mp4 has landed (the local-dev + resilience fallback for the
 * Lambda completion webhook). All the heavy lifting (kill-switch, limiter, presign, Lambda, lifecycle)
 * lives in the server-only render service.
 */
import { NextResponse } from "next/server";

import { z } from "zod";

import {
  getReelRenderState,
  type RenderOutcome,
  requestReelRender,
} from "@/lib/reel/render-service";
import { clientIp } from "@/lib/security/unlock-rate-limit";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ event_id: z.uuid() });

function bad() {
  return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
}

/** getUser + own-event (explicit host_id, not the open-event policy). Returns the event id + name. */
async function resolveOwnEvent(
  eventId: string,
): Promise<{ id: string; name: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: ev } = await supabase
    .from("events")
    .select("id, name")
    .eq("id", eventId)
    .eq("host_id", user.id)
    .maybeSingle();
  return ev ?? null;
}

/** Map the render outcome to its HTTP response. User-facing copy = no em-dashes. */
function renderResponse(outcome: RenderOutcome): NextResponse {
  if (outcome.ok) {
    return NextResponse.json(
      outcome.status === "ready"
        ? { ok: true, status: "ready", downloadUrl: outcome.downloadUrl }
        : { ok: true, status: "processing" },
    );
  }
  switch (outcome.reason) {
    case "empty":
      return NextResponse.json(
        {
          ok: false,
          code: "empty",
          message: "Add some photos to your reel first.",
        },
        { status: 400 },
      );
    case "paused":
      return NextResponse.json(
        {
          ok: false,
          code: "paused",
          message: "Reel videos are paused right now. Please try again later.",
        },
        { status: 503 },
      );
    case "rate_limited":
      return NextResponse.json(
        {
          ok: false,
          code: "rate_limited",
          message:
            "You've made a lot of reels in a short time. Please wait a bit.",
        },
        {
          status: 429,
          headers: { "Retry-After": String(outcome.retryAfterSec ?? 3600) },
        },
      );
    case "unconfigured":
      return NextResponse.json(
        {
          ok: false,
          code: "unconfigured",
          message: "Reel videos aren't available right now.",
        },
        { status: 500 },
      );
    default:
      return NextResponse.json(
        {
          ok: false,
          code: "error",
          message: "Couldn't start your reel video. Please try again.",
        },
        { status: 500 },
      );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return bad();
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return bad();

  const ev = await resolveOwnEvent(parsed.data.event_id);
  if (!ev) {
    return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  }

  const outcome = await requestReelRender({
    eventId: ev.id,
    ip: clientIp(request.headers),
  });
  return renderResponse(outcome);
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
