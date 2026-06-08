import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Newsletter opt-in capture (H3 server-mediation). capture_guest_email is service-role-only now, so this
// route is the only caller. The email is derived from the VERIFIED session here (getUser), NEVER from the
// client body, which closes the victim-email poisoning surface. The guest session_token (capability) ties
// the opt-in to the guest row. Signed-in-only by design (the opt-in lives in the account-first save flow).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json(
      { ok: false, code: "unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }
  const sessionToken =
    body && typeof body === "object" && "session_token" in body
      ? (body as { session_token: unknown }).session_token
      : null;
  const newsletterOptIn =
    body && typeof body === "object" && "newsletter_opt_in" in body
      ? Boolean((body as { newsletter_opt_in: unknown }).newsletter_opt_in)
      : false;
  if (typeof sessionToken !== "string" || sessionToken.length === 0) {
    return NextResponse.json(
      { ok: false, code: "bad_request" },
      { status: 400 },
    );
  }

  // Email comes from the verified session, not the client. Best-effort: a newsletter write must never
  // surface an error to the user (the caller swallows it), so we 200 even on a DB error.
  const admin = createAdminClient();
  const { error } = await admin.rpc("capture_guest_email", {
    p_session_token: sessionToken,
    p_email: user.email,
    p_newsletter_opt_in: newsletterOptIn,
  });
  if (error) {
    return NextResponse.json({ ok: false, code: "failed" }, { status: 200 });
  }
  return NextResponse.json({ ok: true });
}
