/**
 * Remotion Lambda render-completion webhook. Lambda POSTs here on success / error / timeout for a reel
 * render; we verify the HMAC signature (validateWebhookSignature over the parsed body, header
 * X-Remotion-Signature) and hand the result to the render service, which flips highlight_reels to
 * 'ready' (success → confirmed by a HEAD of the R2 mp4) or back to 'pending' with an error.
 *
 * This is the "close the tab and it still finishes" path; the GET poll route's R2-HEAD finalize is the
 * primary/local-dev fallback (Lambda can't reach localhost), so both flips are idempotent. We ALWAYS
 * 200 once authenticated so Lambda doesn't retry a payload we've already handled (or one we ignore).
 */
import { assertReelRenderEnv } from "@/lib/env";
import {
  validateWebhookSignature,
  type WebhookPayload,
} from "@/lib/reel/lambda-client";
import { applyReelWebhook } from "@/lib/reel/render-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let secret: string;
  try {
    secret = assertReelRenderEnv().REEL_RENDER_WEBHOOK_SECRET;
  } catch {
    // Fail closed — an unconfigured render can't have produced a legit signed callback.
    return new Response("Reel render not configured", { status: 500 });
  }

  const raw = await request.text();
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  // Authenticate: the signature is sha512 HMAC over JSON.stringify(body) with our secret.
  try {
    validateWebhookSignature({
      secret,
      body,
      signatureHeader: request.headers.get("x-remotion-signature") ?? "",
    });
  } catch {
    return new Response("Invalid signature", { status: 401 });
  }

  const payload = body as WebhookPayload;
  const eventId =
    payload.customData && typeof payload.customData.eventId === "string"
      ? payload.customData.eventId
      : null;
  if (!eventId) return new Response("ok", { status: 200 }); // not ours / unparseable — ack + drop

  if (payload.type === "success") {
    await applyReelWebhook({
      eventId,
      renderId: payload.renderId,
      type: "success",
      costUsd: payload.costs?.estimatedCost ?? null,
    });
  } else if (payload.type === "error") {
    await applyReelWebhook({
      eventId,
      renderId: payload.renderId,
      type: "error",
      error: payload.errors?.[0]?.message ?? "render error",
    });
  } else {
    await applyReelWebhook({
      eventId,
      renderId: payload.renderId,
      type: "timeout",
      error: "render timed out",
    });
  }

  return new Response("ok", { status: 200 });
}
