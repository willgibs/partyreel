/**
 * CONNECT GOOGLE DRIVE, STEP ONE (drive-export.md, "The flow"): `GET /api/drive/connect?next=<path>`, reached from our
 * own promise step (what Partyreel makes in her Drive, what it can and cannot see, how to end it), never cold.
 *
 * `getUser()` (else sign-in, returning to the page she came from), the account's limiter (a few a minute), then a
 * 32-byte state and a PKCE verifier into the signed `pr_drive_oauth` cookie (Path=/api/drive/callback, ten minutes,
 * the account it was started for), and a 302 to Google's consent with this host's own callback: Google matches the
 * redirect address exactly, so each deployment names itself (partyreel.com's and the desk build's are registered).
 *
 * Not set up on this deployment (no Google client or Worker yet): back to `next` with `?drive=unavailable`, said in
 * words there, never a broken redirect.
 */
import { NextResponse, type NextRequest } from "next/server";

import {
  authorizationUrl,
  pkceChallenge,
  randomToken,
} from "@/lib/drive/google";
import {
  connectLanding,
  DRIVE_CALLBACK_PATH,
  DRIVE_OAUTH_COOKIE,
  DRIVE_OAUTH_TTL_MS,
  sealIntent,
  withDriveReturn,
} from "@/lib/drive/oauth-cookie";
import { assertDriveEnv, assertUnlockEnv, driveConfigured } from "@/lib/env";
import { loginPath } from "@/lib/auth/return-path";
import { checkAccountAbuseRate } from "@/lib/security/abuse-rate-limit-store";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Plain http only for a local dev host (the desk build); everywhere else the cookie is Secure. */
function isLocalHttp(url: URL): boolean {
  return (
    url.protocol === "http:" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  );
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const next = connectLanding(url.searchParams.get("next"));
  const back = (word: Parameters<typeof withDriveReturn>[1]) =>
    NextResponse.redirect(
      new URL(withDriveReturn(next, word), url.origin),
      303,
    );

  if (!driveConfigured()) return back("unavailable");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.redirect(new URL(loginPath(next), url.origin), 303);

  const gate = await checkAccountAbuseRate("drive_connect", user.id);
  if (!gate.allowed) return back("failed");

  const env = assertDriveEnv();
  const { UNLOCK_COOKIE_SECRET } = assertUnlockEnv();
  const state = randomToken();
  const verifier = randomToken();
  const cookie = sealIntent(UNLOCK_COOKIE_SECRET, {
    state,
    verifier,
    uid: user.id,
    next,
    exp: Date.now() + DRIVE_OAUTH_TTL_MS,
  });

  const response = NextResponse.redirect(
    authorizationUrl({
      clientId: env.GOOGLE_DRIVE_CLIENT_ID,
      redirectUri: new URL(DRIVE_CALLBACK_PATH, url.origin).toString(),
      state,
      codeChallenge: pkceChallenge(verifier),
    }),
    302,
  );
  response.cookies.set(DRIVE_OAUTH_COOKIE, cookie, {
    httpOnly: true,
    secure: !isLocalHttp(url),
    sameSite: "lax",
    path: DRIVE_CALLBACK_PATH,
    maxAge: Math.floor(DRIVE_OAUTH_TTL_MS / 1000),
  });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
