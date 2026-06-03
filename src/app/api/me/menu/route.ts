import { NextResponse } from "next/server";

import { getProfileMenu } from "@/lib/db/queries/profile";
import { presignAvatarUrl } from "@/lib/r2/avatar-url";
import { createClient } from "@/lib/supabase/server";

// presignAvatarUrl signs with the R2 secret (S3 SDK → Node); this route also reads auth cookies.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The data the guest event-page header island needs to render a logged-in visitor's account
// menu (avatar + name) and the owner-only "Manage event" link. It is fetched ONLY after the
// island detects a local session (getSession), so anonymous event crowds never hit it — that's
// what keeps the page's zero-server-getUser() invariant on the common path.
//
// getUser() re-validates the JWT here (the proxy/cookie is not an authz boundary). Name + avatar
// reuse the exact pair the (app) layout uses, so presigning stays server-side and the raw R2 key
// never reaches the browser. Ownership of the viewed event is an RLS-scoped select: the events
// owner policy returns the row only when host_id = auth.uid(), so a non-owner gets null and
// host_id never leaks to the client.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, code: "unauthorized", message: "Sign in." },
      { status: 401 },
    );
  }

  const menu = await getProfileMenu(user.id);
  const avatarUrl = await presignAvatarUrl(user.id, menu.avatarMarker);

  // Optional ownership check for the viewed event (drives the "Manage event" link). Keyed by the
  // event id the page already exposes to the client; RLS scopes the read to the owner, so this is
  // false for a non-owner and never reveals who the host is.
  let ownsThisEvent = false;
  const eventId = new URL(request.url).searchParams.get("event");
  if (eventId) {
    const { data: owned } = await supabase
      .from("events")
      .select("id")
      .eq("id", eventId)
      .maybeSingle();
    ownsThisEvent = Boolean(owned);
  }

  return NextResponse.json({
    ok: true,
    email: user.email ?? null,
    displayName: menu.displayName,
    avatarUrl,
    ownsThisEvent,
  });
}
