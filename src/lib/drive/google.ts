/**
 * THE APP'S SIDE OF GOOGLE (drive-export.md, "OAuth" and "The token store"): the consent URL, the code exchange, a
 * refresh, a revoke, the ID token's facts, her Drive's room, and the folders a send lands in. Metadata only: no media
 * byte ever passes through the app (the Worker streams R2 into Google), so `media-cost-policy.test.ts` holds unchanged.
 *
 * Every address is `GOOGLE_URLS`' (pinned by `google-urls.test.ts`), every call carries a ceiling (Google answers in
 * well under a second; a hung call must not hold a route), and `fetch` is injectable so the tests drive every answer.
 *
 * Pure of env and DB: the routes pass the client id and secret in.
 */
import { createHash, randomBytes } from "node:crypto";

import {
  DRIVE_FILE_SCOPE,
  DRIVE_SCOPES,
  GOOGLE_ISSUERS,
  GOOGLE_URLS,
} from "@/lib/drive/google-urls";
import { DRIVE_FOLDER_COLOR } from "@/lib/export/drive-names";

type Fetch = typeof fetch;

/** Every Google call's ceiling. */
export const GOOGLE_TIMEOUT_MS = 10_000;

const FOLDER_MIME = "application/vnd.google-apps.folder";

// ── PKCE and the state ──────────────────────────────────────────────────────────────────────────

/** A 32-byte random value, base64url: the state, and the PKCE verifier. */
export function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

/** The PKCE S256 challenge of a verifier. */
export function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * THE CONSENT URL. `prompt=consent select_account`: the chooser always (sign-in's shared-laptop rule) and consent
 * always, which is what makes Google return a refresh token on a reconnect. `access_type=offline` for that refresh
 * token; `include_granted_scopes=false` so nothing else she granted rides along. PKCE beside the client secret (RFC
 * 9700's advice; Google takes it from web clients too), with the signed state cookie bound to `getUser()` as the lock.
 */
export function authorizationUrl(input: {
  clientId: string;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  const url = new URL(GOOGLE_URLS.authorize);
  url.searchParams.set("client_id", input.clientId);
  url.searchParams.set("redirect_uri", input.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DRIVE_SCOPES.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent select_account");
  url.searchParams.set("include_granted_scopes", "false");
  url.searchParams.set("state", input.state);
  url.searchParams.set("code_challenge", input.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

// ── Tokens ──────────────────────────────────────────────────────────────────────────────────────

export type GrantedTokens = {
  accessToken: string;
  /** Seconds. */
  expiresIn: number;
  refreshToken: string | null;
  /** A time-based grant's remaining life, seconds (a Workspace user's choice), else null. */
  refreshExpiresIn: number | null;
  scopes: string[];
  idToken: string | null;
};

export type TokenFailure = {
  ok: false;
  /** Google's `error` (invalid_grant: revoked, expired, unused six months, a time-based grant run out). */
  error: string;
  status: number;
};

async function postForm(
  fetchImpl: Fetch,
  url: string,
  form: Record<string, string>,
): Promise<Response> {
  return fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
    signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    cache: "no-store",
  });
}

function readTokens(body: Record<string, unknown>): GrantedTokens | null {
  const accessToken =
    typeof body.access_token === "string" ? body.access_token : null;
  const expiresIn =
    typeof body.expires_in === "number" ? body.expires_in : null;
  if (!accessToken || expiresIn === null) return null;
  return {
    accessToken,
    expiresIn,
    refreshToken:
      typeof body.refresh_token === "string" ? body.refresh_token : null,
    refreshExpiresIn:
      typeof body.refresh_token_expires_in === "number"
        ? body.refresh_token_expires_in
        : null,
    scopes:
      typeof body.scope === "string"
        ? body.scope.split(/\s+/).filter(Boolean)
        : [],
    idToken: typeof body.id_token === "string" ? body.id_token : null,
  };
}

/** The code exchange (the callback): the client secret and the PKCE verifier. */
export async function exchangeCode(
  input: {
    clientId: string;
    clientSecret: string;
    code: string;
    redirectUri: string;
    verifier: string;
  },
  fetchImpl: Fetch = fetch,
): Promise<({ ok: true } & GrantedTokens) | TokenFailure> {
  let res: Response;
  try {
    res = await postForm(fetchImpl, GOOGLE_URLS.token, {
      client_id: input.clientId,
      client_secret: input.clientSecret,
      code: input.code,
      code_verifier: input.verifier,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri,
    });
  } catch (e) {
    return {
      ok: false,
      error: `unreachable: ${String(e).slice(0, 120)}`,
      status: 0,
    };
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const tokens = res.ok ? readTokens(body) : null;
  if (!tokens) {
    return {
      ok: false,
      error: typeof body.error === "string" ? body.error : `HTTP ${res.status}`,
      status: res.status,
    };
  }
  return { ok: true, ...tokens };
}

/** A refresh. `revoked` is Google's invalid_grant: the connection is gone, her tokens are wiped at once. */
export async function refreshAccess(
  input: { clientId: string; clientSecret: string; refreshToken: string },
  fetchImpl: Fetch = fetch,
): Promise<
  | {
      ok: true;
      accessToken: string;
      expiresIn: number;
      refreshToken: string | null;
    }
  | (TokenFailure & { revoked: boolean })
> {
  let res: Response;
  try {
    res = await postForm(fetchImpl, GOOGLE_URLS.token, {
      client_id: input.clientId,
      client_secret: input.clientSecret,
      refresh_token: input.refreshToken,
      grant_type: "refresh_token",
    });
  } catch (e) {
    return {
      ok: false,
      revoked: false,
      error: `unreachable: ${String(e).slice(0, 120)}`,
      status: 0,
    };
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  const tokens = res.ok ? readTokens(body) : null;
  if (!tokens) {
    const error =
      typeof body.error === "string" ? body.error : `HTTP ${res.status}`;
    return {
      ok: false,
      revoked: error === "invalid_grant",
      error,
      status: res.status,
    };
  }
  return {
    ok: true,
    accessToken: tokens.accessToken,
    expiresIn: tokens.expiresIn,
    refreshToken: tokens.refreshToken,
  };
}

/**
 * Revoke a token at Google, tried three times (Disconnect, account deletion, another Google account replacing this
 * one). ★ Google revokes the token's whole grant (the user and this client), so a same-account reconnect never calls
 * this on the token it replaces: that would revoke the grant the new token rides. A 400 means the token is already
 * dead (revoked elsewhere, expired): done, not a failure.
 */
export async function revokeToken(
  token: string,
  fetchImpl: Fetch = fetch,
): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await postForm(fetchImpl, GOOGLE_URLS.revoke, { token });
      if (res.ok || res.status === 400) return true;
    } catch {
      // A dropped call is tried again.
    }
  }
  return false;
}

// ── The ID token ────────────────────────────────────────────────────────────────────────────────

export type GoogleIdentity = {
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

/**
 * The ID token's facts. It came straight from Google's token endpoint over TLS, so its signature needs no check
 * (Google's own guidance); its audience must be our client, its issuer Google, and it must not have expired. `sub`,
 * never the address, is the identity; the address prints only when Google says it is verified.
 */
export function readIdToken(
  idToken: string | null,
  clientId: string,
  nowMs: number,
): GoogleIdentity | null {
  if (!idToken) return null;
  const parts = idToken.split(".");
  if (parts.length !== 3) return null;
  let claims: Record<string, unknown>;
  try {
    claims = JSON.parse(
      Buffer.from(parts[1]!, "base64url").toString("utf8"),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
  const aud = claims.aud;
  const audOk =
    aud === clientId || (Array.isArray(aud) && aud.includes(clientId));
  const issOk =
    typeof claims.iss === "string" &&
    (GOOGLE_ISSUERS as readonly string[]).includes(claims.iss);
  const expOk = typeof claims.exp === "number" && claims.exp * 1000 > nowMs;
  const sub =
    typeof claims.sub === "string" &&
    claims.sub.length > 0 &&
    claims.sub.length <= 255
      ? claims.sub
      : null;
  if (!audOk || !issOk || !expOk || !sub) return null;
  return {
    sub,
    email: typeof claims.email === "string" ? claims.email.slice(0, 320) : null,
    emailVerified:
      claims.email_verified === true || claims.email_verified === "true",
    name: typeof claims.name === "string" ? claims.name.slice(0, 200) : null,
  };
}

/** Whether Google granted the one scope a connection needs. */
export function grantsDriveFile(scopes: readonly string[]): boolean {
  return scopes.includes(DRIVE_FILE_SCOPE);
}

// ── Drive metadata ──────────────────────────────────────────────────────────────────────────────

/** A Drive call that did not answer as hoped: the status and Google's reason, for words and signals. */
export class DriveCallError extends Error {
  constructor(
    readonly status: number,
    readonly reason: string | null,
    message: string,
  ) {
    super(message);
    this.name = "DriveCallError";
  }
}

async function driveCall(
  fetchImpl: Fetch,
  accessToken: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const res = await fetchImpl(url, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    cache: "no-store",
  });
  return res;
}

async function failure(res: Response, what: string): Promise<DriveCallError> {
  const body = (await res.json().catch(() => null)) as {
    error?: { errors?: { reason?: string }[]; message?: string };
  } | null;
  const reason = body?.error?.errors?.[0]?.reason ?? null;
  return new DriveCallError(
    res.status,
    reason,
    `${what}: HTTP ${res.status}${reason ? ` (${reason})` : ""}`,
  );
}

export type DriveRoom = {
  /** Null: no limit (an unlimited Drive, or a Workspace's pooled one, which is advisory). */
  limit: number | null;
  usage: number;
};

/** Her Drive's room (about.get, `storageQuota`): metadata only. */
export async function driveRoom(
  accessToken: string,
  fetchImpl: Fetch = fetch,
): Promise<DriveRoom> {
  const res = await driveCall(
    fetchImpl,
    accessToken,
    `${GOOGLE_URLS.about}?fields=storageQuota`,
  );
  if (!res.ok) throw await failure(res, "about.get");
  const body = (await res.json()) as {
    storageQuota?: { limit?: string; usage?: string };
  };
  const limit = body.storageQuota?.limit
    ? Number(body.storageQuota.limit)
    : null;
  const usage = Number(body.storageQuota?.usage ?? 0);
  return {
    limit: limit !== null && Number.isFinite(limit) ? limit : null,
    usage: Number.isFinite(usage) ? usage : 0,
  };
}

/** A file or folder of ours: whether it is still there and out of the bin. Null when Google no longer has it. */
export async function driveFileState(
  accessToken: string,
  fileId: string,
  fetchImpl: Fetch = fetch,
): Promise<{ id: string; trashed: boolean } | null> {
  const res = await driveCall(
    fetchImpl,
    accessToken,
    `${GOOGLE_URLS.files}/${encodeURIComponent(fileId)}?fields=id,trashed&supportsAllDrives=false`,
  );
  if (res.status === 404) return null;
  if (!res.ok) throw await failure(res, "files.get");
  const body = (await res.json()) as { id?: string; trashed?: boolean };
  return body.id ? { id: body.id, trashed: body.trashed === true } : null;
}

/**
 * A folder we just made: its id, as a handle only `undoFolder` takes. ★ The app's one deletion in her Drive is
 * undoing its own write of seconds ago (a second Partyreel folder two presses made at once); a recorded folder or a
 * sent file is never passed here, by construction of the type.
 */
export type CreatedFolder = {
  readonly id: string;
  readonly createdAtMs: number;
  readonly __created: true;
};

/** Make a folder (under `parentId`, or in My Drive), our colour on the Partyreel folder. */
export async function createFolder(
  accessToken: string,
  input: { name: string; parentId?: string | null; colored?: boolean },
  fetchImpl: Fetch = fetch,
): Promise<CreatedFolder> {
  const res = await driveCall(
    fetchImpl,
    accessToken,
    `${GOOGLE_URLS.files}?fields=id`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: input.name,
        mimeType: FOLDER_MIME,
        ...(input.parentId ? { parents: [input.parentId] } : {}),
        ...(input.colored ? { folderColorRgb: DRIVE_FOLDER_COLOR } : {}),
      }),
    },
  );
  if (!res.ok) throw await failure(res, "files.create (folder)");
  const body = (await res.json()) as { id?: string };
  if (!body.id)
    throw new DriveCallError(res.status, null, "files.create (folder): no id");
  return { id: body.id, createdAtMs: Date.now(), __created: true };
}

/** Undo a folder this very request made (seconds old, never recorded). Best-effort: an empty folder left is harmless. */
export async function undoFolder(
  accessToken: string,
  folder: CreatedFolder,
  fetchImpl: Fetch = fetch,
): Promise<void> {
  if (Date.now() - folder.createdAtMs > 60_000) return;
  await driveCall(
    fetchImpl,
    accessToken,
    `${GOOGLE_URLS.files}/${encodeURIComponent(folder.id)}`,
    {
      method: "DELETE",
    },
  ).catch(() => undefined);
}
