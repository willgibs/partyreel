/**
 * THE LIKE DOOR: `GET /dashboard/new/like/<token>`, every way a guest's Make one like this leads (the album header's
 * corner, her name menu, her account menu; `create-event-wizard/like.ts`).
 *
 * It keeps the album's token for half an hour in a cookie only Create's own page is sent (`LIKE_COOKIE`, path
 * `/dashboard/new`), then sends her on: signed in, straight into Create, which opens in the album's style; signed out,
 * to sign-up (`intent=create`) with Create as the return, so she lands back in it, through `/welcome` first when her
 * new account has no name yet. ★ A COOKIE, NEVER AN ADDRESS: a sign-in return carries a path and never a query
 * (`lib/auth/return-path.ts`), and the welcome keeps no return of its own, so the token rides the one place both pass
 * through untouched. Create puts it down the moment it has opened in the style.
 *
 * ★ IT GRANTS NOTHING AND READS NOTHING OF THE ALBUM: it is outside the (app) layout's gate (a route handler has no
 * layout), so it asks `getUser()` itself only to choose where she goes next; what the token lends is decided on
 * Create's page, through the album's own read and its door, as the visitor she is (`dashboard/new/page.tsx`). A token
 * of the wrong shape is no like: Create opens as it always does.
 */
import { NextResponse, type NextRequest } from "next/server";

import {
  LIKE_COOKIE,
  LIKE_COOKIE_PATH,
  LIKE_COOKIE_SECONDS,
  likeToken,
} from "@/components/app/create-event-wizard/like";
import { NEXT_PARAM } from "@/lib/auth/return-path";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/** Plain http only for a local dev host; everywhere else the cookie is Secure. */
function isLocalHttp(url: URL): boolean {
  return (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const url = new URL(request.url);
  const token = likeToken((await params).token);
  if (!token) {
    return NextResponse.redirect(new URL(LIKE_COOKIE_PATH, url.origin), 303);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next = user
    ? LIKE_COOKIE_PATH
    : `/login?intent=create&${NEXT_PARAM}=${encodeURIComponent(LIKE_COOKIE_PATH)}`;

  const response = NextResponse.redirect(new URL(next, url.origin), 303);
  response.cookies.set(LIKE_COOKIE, token, {
    path: LIKE_COOKIE_PATH,
    maxAge: LIKE_COOKIE_SECONDS,
    sameSite: "lax",
    secure: !isLocalHttp(url),
    // Create's own page puts it down the moment it has opened in the style (`forgetLike`), so its script must reach it.
    httpOnly: false,
  });
  // A door that answers per visitor is never a page a cache may keep.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
