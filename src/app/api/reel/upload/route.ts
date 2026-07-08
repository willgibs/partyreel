/**
 * The CLIENT-ENCODE reel export endpoint (Plan A Phase C): the host's browser encodes the mp4 via
 * WebCodecs and this route brokers the three phases (begin → mint → finalize; the contract lives in
 * src/lib/reel/upload-contract.ts, the logic in render-service.ts). Authz is the shared reel gate
 * (resolveOwnEvent): getUser() + an own-event RLS read per request; the render service then re-derives
 * the ENTIRE reel
 * config (tier, length clamp, watermark, membership, hash) server-side, so nothing about the export
 * identity is client-trusted. The only client inputs that matter are the byte count (bounded by the
 * server budget AND the content-length-signed presign) and the opaque hash echo (compared against a
 * fresh recompute at every phase). User-facing copy: no em-dashes.
 */
import { NextResponse } from "next/server";

import { resolveOwnEvent } from "@/lib/reel/own-event";
import {
  beginClientReelUpload,
  finalizeClientReelUpload,
  mintClientReelUpload,
} from "@/lib/reel/render-service";
import { reelUploadBodySchema } from "@/lib/reel/upload-contract";
import { clientIp } from "@/lib/security/unlock-rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Map a service failure reason to its HTTP response (shared vocabulary across the three phases). */
function failure(reason: string, retryAfterSec?: number): NextResponse {
  switch (reason) {
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
          headers: { "Retry-After": String(retryAfterSec ?? 3600) },
        },
      );
    case "config_changed":
      return NextResponse.json(
        {
          ok: false,
          code: "config_changed",
          message:
            "Your reel changed while exporting. Start the download again to get the latest version.",
        },
        { status: 409 },
      );
    case "too_large":
      return NextResponse.json(
        {
          ok: false,
          code: "too_large",
          message: "That video is larger than a reel should be.",
        },
        { status: 413 },
      );
    case "upload_incomplete":
      return NextResponse.json(
        {
          ok: false,
          code: "upload_incomplete",
          message: "We couldn't find your uploaded video. Please try again.",
        },
        { status: 409 },
      );
    default:
      return NextResponse.json(
        {
          ok: false,
          code: "error",
          message: "Couldn't save your reel video. Please try again.",
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
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const parsed = reelUploadBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const ev = await resolveOwnEvent(input.event_id);
  if (!ev) {
    return NextResponse.json({ ok: false, code: "forbidden" }, { status: 403 });
  }
  const ip = clientIp(request.headers);

  switch (input.phase) {
    case "begin": {
      const out = await beginClientReelUpload({ eventId: ev.id, ip });
      if (!out.ok) return failure(out.reason, out.retryAfterSec);
      return NextResponse.json(out);
    }
    case "mint": {
      const out = await mintClientReelUpload({
        eventId: ev.id,
        ip,
        hash: input.hash,
        sizeBytes: input.size_bytes,
      });
      if (!out.ok) return failure(out.reason, out.retryAfterSec);
      return NextResponse.json({
        ok: true,
        uploadUrl: out.uploadUrl,
        headers: out.headers,
      });
    }
    case "finalize": {
      const out = await finalizeClientReelUpload({
        eventId: ev.id,
        hash: input.hash,
      });
      if (!out.ok) return failure(out.reason);
      return NextResponse.json({
        ok: true,
        status: out.status,
        downloadUrl: out.downloadUrl,
      });
    }
  }
}
