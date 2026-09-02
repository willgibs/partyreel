import { NextResponse, type NextRequest } from "next/server";

import { constantTimeEquals } from "@/lib/crypto/constant-time";
import { serverEnv } from "@/lib/env";

/**
 * The design-gate PROBE (Track B): lets a STATIC page find out, client-side,
 * whether the visitor's `?key=` opens the design gate — the server-side
 * equivalent of isDesignGateOpen for surfaces that must stay prerendered
 * (awaiting searchParams in the page would flip the marketing home to
 * per-request rendering and put the ratified LCP budget at risk). The
 * key-gated marketing MotionTuner island (marketing-motion-tuner.tsx) is the
 * consumer.
 *
 * Gate parity with src/lib/design-gate/server.ts: dev accepts any key; production
 * requires the timing-safe DESIGN_PREVIEW_KEY match. Anything else is a bare 404,
 * keeping the standing invariant that the design gate is an indistinguishable 404
 * without the key. Never echoes the secret or the attempt. Lives under /api (robots
 * disallows it) rather than inside the lab so the lab can be reshaped without
 * moving a production dependency (the library round, 2026-09-02).
 */
export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get("key");
  if (!key) return new NextResponse(null, { status: 404 });
  if (process.env.NODE_ENV === "development") {
    return NextResponse.json({ open: true });
  }
  const secret = serverEnv.DESIGN_PREVIEW_KEY;
  if (!secret || !constantTimeEquals(key, secret)) {
    return new NextResponse(null, { status: 404 });
  }
  return NextResponse.json({ open: true });
}
