import { NextResponse } from "next/server";

import { captureGuestEmail } from "@/lib/db/mutations/guest";
import { emailCaptureSchema } from "@/lib/validation/upload";

// POST captures a guest's email after they upload (the soft post-upload prompt),
// with an optional newsletter opt-in, via the capture_guest_email RPC. The opaque
// session_token is the capability (ADR-0004) — no account, no JWT.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Invalid request body." },
      { status: 400 },
    );
  }

  const parsed = emailCaptureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, code: "bad_request", message: "Enter a valid email." },
      { status: 400 },
    );
  }

  const { session_token, email, newsletter_opt_in } = parsed.data;
  const result = await captureGuestEmail({
    sessionToken: session_token,
    email,
    newsletterOptIn: newsletter_opt_in,
  });

  if (!result.ok) {
    const status =
      result.code === "invalid_session"
        ? 401
        : result.code === "invalid_email"
          ? 422
          : 500;
    return NextResponse.json(
      { ok: false, code: result.code, message: result.message },
      { status },
    );
  }

  return NextResponse.json({ ok: true });
}
