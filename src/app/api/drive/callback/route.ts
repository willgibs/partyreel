/**
 * CONNECT GOOGLE DRIVE, STEP TWO (drive-export.md, "The flow"): `GET /api/drive/callback?code&state`, where Google
 * sends her back.
 *
 * ★ REFUSED, AND THE COOKIE CLEARED, UNLESS THE COOKIE IS THERE, ITS SIGNATURE HOLDS, ITS STATE EQUALS THE QUERY'S, AND
 * `getUser()` IS THE ACCOUNT IT NAMES. The last is the lock: an attacker's code can never connect the attacker's Drive
 * to a victim's account (every later send would land in the attacker's Drive).
 *
 * Then the code exchange (the client secret and the PKCE verifier), and three things Google must have given: the
 * `drive.file` scope (granular consent lets her untick it: "tick the box", and the half-grant is revoked), a refresh
 * token (prompt=consent makes Google send one; without it a connection would die in an hour), and an ID token naming
 * our client, Google and the future (`sub` is the identity; the address prints only when verified). The tokens are
 * sealed in this runtime and kept; another Google account replacing hers has its own grant revoked; a notice goes to
 * her account's own address at every new connection (a stolen session could otherwise point her sends at a
 * stranger's Drive in silence). She lands where she started, `?drive=` saying how it went.
 */
import { after, NextResponse, type NextRequest } from "next/server";

import { constantTimeEquals } from "@/lib/crypto/constant-time";
import {
  driveRoom,
  exchangeCode,
  grantsDriveFile,
  readIdToken,
  revokeToken,
} from "@/lib/drive/google";
import {
  DRIVE_CALLBACK_PATH,
  DRIVE_OAUTH_COOKIE,
  openIntent,
  withDriveReturn,
  type DriveReturn,
} from "@/lib/drive/oauth-cookie";
import { DRIVE_HINT_COOKIE, DRIVE_HINT_MAX_AGE_S } from "@/lib/drive/links";
import { notifyConnected } from "@/lib/drive/mail.server";
import { tokenKeys } from "@/lib/drive/service.server";
import { openToken, sealToken } from "@/lib/drive/tokens.server";
import { recordRoom, upsertConnection } from "@/lib/db/queries/drive";
import { assertDriveEnv, assertUnlockEnv, driveConfigured } from "@/lib/env";
import { captureError, captureWarning } from "@/lib/observability/sentry";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const intent = (() => {
    try {
      return openIntent(
        assertUnlockEnv().UNLOCK_COOKIE_SECRET,
        request.cookies.get(DRIVE_OAUTH_COOKIE)?.value,
        Date.now(),
      );
    } catch {
      return null;
    }
  })();
  const land = (word: DriveReturn, next = intent?.next ?? "/dashboard") => {
    const response = NextResponse.redirect(
      new URL(withDriveReturn(next, word), url.origin),
      303,
    );
    // The cookie is single-use: cleared on every answer, whatever it was.
    response.cookies.set(DRIVE_OAUTH_COOKIE, "", {
      path: DRIVE_CALLBACK_PATH,
      maxAge: 0,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };

  if (!driveConfigured()) return land("unavailable");
  if (!intent) return land("failed");

  const state = url.searchParams.get("state") ?? "";
  if (!state || !constantTimeEquals(state, intent.state)) {
    captureWarning("security", "drive_callback_state_mismatch", {});
    return land("failed");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== intent.uid) {
    // ★ The lock: a callback carried into another account's session connects nothing.
    captureWarning("security", "drive_callback_wrong_account", {
      signedIn: Boolean(user),
    });
    return land("failed");
  }

  const error = url.searchParams.get("error");
  if (error) return land(error === "access_denied" ? "declined" : "failed");
  const code = url.searchParams.get("code");
  if (!code) return land("failed");

  const env = assertDriveEnv();
  const granted = await exchangeCode({
    clientId: env.GOOGLE_DRIVE_CLIENT_ID,
    clientSecret: env.GOOGLE_DRIVE_CLIENT_SECRET,
    code,
    redirectUri: new URL(DRIVE_CALLBACK_PATH, url.origin).toString(),
    verifier: intent.verifier,
  });
  if (!granted.ok) {
    captureWarning("export", "drive_code_exchange_failed", {
      error: granted.error,
      status: granted.status,
    });
    return land("failed");
  }
  if (!grantsDriveFile(granted.scopes)) {
    // She unticked the box: the half-grant is no connection, and it is not left standing at Google.
    after(() =>
      revokeToken(granted.refreshToken ?? granted.accessToken).then(
        () => undefined,
      ),
    );
    return land("needs_permission");
  }
  if (!granted.refreshToken) {
    captureWarning("export", "drive_no_refresh_token", {});
    after(() => revokeToken(granted.accessToken).then(() => undefined));
    return land("failed");
  }
  const identity = readIdToken(
    granted.idToken,
    env.GOOGLE_DRIVE_CLIENT_ID,
    Date.now(),
  );
  if (!identity) {
    captureWarning("export", "drive_id_token_refused", {});
    after(() => revokeToken(granted.refreshToken!).then(() => undefined));
    return land("failed");
  }

  const keys = tokenKeys();
  const ctx = { userId: user.id, provider: "google_drive" as const };
  let outcome;
  try {
    outcome = await upsertConnection({
      userId: user.id,
      sub: identity.sub,
      email: identity.email,
      emailVerified: identity.emailVerified,
      name: identity.name,
      scopes: granted.scopes,
      refreshCt: sealToken(
        granted.refreshToken,
        { ...ctx, purpose: "refresh" },
        keys,
      ),
      accessCt: sealToken(
        granted.accessToken,
        { ...ctx, purpose: "access" },
        keys,
      ),
      accessExpiresAt: new Date(
        Date.now() + granted.expiresIn * 1000,
      ).toISOString(),
      refreshExpiresAt:
        granted.refreshExpiresIn !== null
          ? new Date(Date.now() + granted.refreshExpiresIn * 1000).toISOString()
          : null,
    });
  } catch (e) {
    captureError("export", e, { action: "drive_connect_upsert" });
    after(() => revokeToken(granted.refreshToken!).then(() => undefined));
    return land("failed");
  }

  const connectionId = outcome.connectionId;
  const oldRefresh =
    outcome.outcome === "other"
      ? openToken(outcome.oldRefreshCt, { ...ctx, purpose: "refresh" }, keys)
      : null;
  after(async () => {
    // Another Google account's grant goes (a different grant from the new one, so revoking it touches nothing of hers).
    if (oldRefresh) await revokeToken(oldRefresh);
    // Her Drive's room, once, for the first free-space line (best-effort: the press asks again).
    try {
      const room = await driveRoom(granted.accessToken);
      await recordRoom({
        connectionId,
        limit: room.limit,
        usage: room.usage,
        resume: false,
      });
    } catch {
      // The press asks again.
    }
    await notifyConnected({
      userId: user.id,
      connectionId,
      googleEmail: identity.emailVerified ? identity.email : null,
      replaced: outcome.outcome === "other" ? outcome.oldEmail : null,
    });
  });

  const response = land(outcome.outcome === "other" ? "switched" : "connected");
  // The hint that this browser's host uses Drive (her pages listen for her sends only where it stands: `links.ts`).
  response.cookies.set(DRIVE_HINT_COOKIE, "1", {
    path: "/",
    maxAge: DRIVE_HINT_MAX_AGE_S,
    sameSite: "lax",
    secure: url.protocol === "https:",
    httpOnly: false,
  });
  return response;
}
