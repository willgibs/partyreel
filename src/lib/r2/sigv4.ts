/**
 * ★ R2's PRESIGNED URLS, SIGNED BY HAND (compute-presign, 2026-10-04): SigV4's query-string presign for R2's
 * S3-compatible API on Node's `crypto` alone (the canonical request, the string to sign, and the derived signing key
 * cached per day, region and service). `presign.ts` mints every link through it, behind its own functions, so no
 * caller changed.
 *
 * WHY. The guest page is the dearest call (a 1,000-photo album's first load presigns up to 257 links), and the AWS
 * SDK's `getSignedUrl` was about 13% of its main-thread time: per link it clones the client's middleware stack, walks
 * S3's endpoint ruleset and serializes a command before it signs. A presign is two hashes over a few hundred bytes,
 * and this does only that (PRICING.md's lever 5; `presign.test.ts` races the two over 257 links).
 *
 * ★ BYTE-IDENTICAL TO THE SDK. Each URL is the one `getSignedUrl` minted for the same inputs and clock, which
 * `presign.test.ts` holds over a corpus (the SDK's presigner stays a dev dependency for that test alone): the
 * virtual-hosted host (`<bucket>.<account>.r2.cloudflarestorage.com`, as the SDK addresses every name R2 allows), each
 * key segment escaped with its `/` kept, the SDK's own query (`x-id` and `X-Amz-Content-Sha256=UNSIGNED-PAYLOAD`
 * included), the same signed headers, the same order. So a stable gallery link minted before this shipped is the same
 * link after it, and the browser's image cache never noticed the change. A change to what is signed (a new operation,
 * a new bound header) is proved against the SDK in that corpus before it ships.
 *
 * ★ NOTHING SECRET LEAVES, AND NOTHING IS SENT. The secret and the keys derived from it live in the presigner's
 * closure; no error, log or return carries them (an error names the input it refused, never a credential). It holds
 * no client and makes no request, so a GET signed here never becomes a byte read through a function
 * (`media-cost-policy.test.ts`).
 */
import "server-only";

import { createHash, createHmac } from "node:crypto";

const ALGORITHM = "AWS4-HMAC-SHA256";
/** The SDK's presigner binds no payload: the browser's body is checked by its bound length, never its hash. */
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
const REGION = "auto";
const SERVICE = "s3";
const SCOPE_TERMINATOR = "aws4_request";

/** SigV4's ceiling on a presigned URL's life (7 days); the SDK refused past it too. */
export const MAX_PRESIGN_TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * S3's test for a virtual-hosted bucket, as the SDK applies it (`isVirtualHostableS3Bucket`): one lowercase DNS label
 * of 3 to 63 characters. Every name R2 accepts passes, so a name that fails is a misconfiguration, refused loudly
 * rather than addressed some other way.
 */
const VIRTUAL_HOSTABLE_BUCKET = /^(?!-)(?!.*-$)[a-z0-9-]{3,63}$/;

/** An R2 account id is 32 hex characters; anything but a plain label would put something else in the host. */
const ACCOUNT_LABEL = /^[A-Za-z0-9-]{1,63}$/;

/**
 * An operation's query or header name: a plain token, so it escapes to itself and the canonical order is the URL's
 * order, and never one of SigV4's own (`X-Amz-*`, `host`), which this sets and a caller cannot override.
 */
const PLAIN_TOKEN = /^[A-Za-z0-9-]+$/;
const SIGV4_OWN = /^(x-amz-|host$)/i;

function assertOperationName(name: string, what: string): void {
  if (!PLAIN_TOKEN.test(name) || SIGV4_OWN.test(name)) {
    throw new Error(`sigv4: "${name}" cannot be a ${what} name here.`);
  }
}

const hexEscape = (c: string) =>
  `%${c.charCodeAt(0).toString(16).toUpperCase()}`;

/** RFC 3986 escaping as SigV4 (and the SDK) does it: `encodeURIComponent`, then the five characters it leaves bare. */
export function escapeUri(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, hexEscape);
}

export type R2SigningConfig = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

export type PresignRequest = {
  method: "GET" | "PUT";
  /** The object key, unescaped: each `/`-separated segment is escaped here and the slashes are kept. */
  key: string;
  /** The operation's own query parameters, unescaped (`x-id`, `partNumber`, `response-content-disposition`, ...). */
  query: Readonly<Record<string, string>>;
  /** Headers bound into the signature beside `host`, which the browser must then send verbatim. */
  headers?: Readonly<Record<string, string>>;
  expiresInSeconds: number;
  signingDate: Date;
};

export type R2Presigner = (request: PresignRequest) => string;

/**
 * A presigner for one bucket and one key pair. Hold it for the process (presign.ts memoizes it as `client.ts` memoizes
 * the S3 client), so the derived key is made once a day rather than four HMACs a link.
 */
export function createR2Presigner(config: R2SigningConfig): R2Presigner {
  const { accountId, accessKeyId, secretAccessKey, bucket } = config;
  if (!VIRTUAL_HOSTABLE_BUCKET.test(bucket)) {
    throw new Error(
      `sigv4: "${bucket}" is not an R2 bucket name (one lowercase label of 3 to 63: letters, digits, inner hyphens).`,
    );
  }
  if (!ACCOUNT_LABEL.test(accountId)) {
    throw new Error("sigv4: the R2 account id is not a plain host label.");
  }
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("sigv4: the R2 key pair is incomplete.");
  }
  // The SDK reads its endpoint through URL, which lowercases a host; this matches it for any account id.
  const host = `${bucket}.${accountId.toLowerCase()}.r2.cloudflarestorage.com`;

  // ★ THE DERIVED KEY, cached per day, region and service: SigV4 chains four HMACs from the secret through the scope,
  // and nothing in them moves within a day (a stable link's bucket starts on its own UTC day, since the 30-minute
  // buckets divide a day). A warm process signs on a day or two at once (a request across midnight), so the map keeps
  // the last few and drops the oldest.
  const derivedKeys = new Map<string, Buffer>();
  const signingKey = (day: string): Buffer => {
    const scope = `${day}/${REGION}/${SERVICE}`;
    const cached = derivedKeys.get(scope);
    if (cached) return cached;
    let key: Buffer | string = `AWS4${secretAccessKey}`;
    for (const part of [day, REGION, SERVICE, SCOPE_TERMINATOR]) {
      key = createHmac("sha256", key).update(part).digest();
    }
    const derived = key as Buffer;
    if (derivedKeys.size >= 4) {
      derivedKeys.delete(derivedKeys.keys().next().value as string);
    }
    derivedKeys.set(scope, derived);
    return derived;
  };

  return ({ method, key, query, headers, expiresInSeconds, signingDate }) => {
    if (!key) throw new Error("sigv4: an empty key has no URL.");
    if (
      !Number.isSafeInteger(expiresInSeconds) ||
      expiresInSeconds < 1 ||
      expiresInSeconds > MAX_PRESIGN_TTL_SECONDS
    ) {
      throw new Error(
        `sigv4: a presign lives 1 s to 7 days (asked ${expiresInSeconds}).`,
      );
    }
    // `20261004T193000Z`: the ISO instant without its milliseconds or separators (throws on an invalid Date).
    const longDate = signingDate
      .toISOString()
      .replace(/\.\d{3}Z$/, "Z")
      .replace(/[-:]/g, "");
    const day = longDate.slice(0, 8);
    const scope = `${day}/${REGION}/${SERVICE}/${SCOPE_TERMINATOR}`;

    // The path: each segment escaped, the slashes kept, nothing normalized (S3 keys are opaque: `a//b` and `./x` are
    // keys of their own, so the SDK signs them as written and so does this).
    const path = `/${key.split("/").map(escapeUri).join("/")}`;

    // The bound headers by lowercase name, each value trimmed with its inner whitespace collapsed (SigV4's rule).
    const canonicalHeaders: Record<string, string> = { host };
    for (const [name, value] of Object.entries(headers ?? {})) {
      assertOperationName(name, "header");
      canonicalHeaders[name.toLowerCase()] = value.trim().replace(/\s+/g, " ");
    }
    const headerNames = Object.keys(canonicalHeaders).sort();
    const signedHeaders = headerNames.join(";");

    for (const name of Object.keys(query)) assertOperationName(name, "query");
    const params: Record<string, string> = {
      ...query,
      "X-Amz-Algorithm": ALGORITHM,
      "X-Amz-Content-Sha256": UNSIGNED_PAYLOAD,
      "X-Amz-Credential": `${accessKeyId}/${scope}`,
      "X-Amz-Date": longDate,
      "X-Amz-Expires": String(expiresInSeconds),
      "X-Amz-SignedHeaders": signedHeaders,
    };
    const names = Object.keys(params).sort();
    const canonicalQuery = names
      .map((name) => `${name}=${escapeUri(params[name])}`)
      .join("&");

    const canonicalRequest = [
      method,
      path,
      canonicalQuery,
      ...headerNames.map((name) => `${name}:${canonicalHeaders[name]}`),
      "",
      signedHeaders,
      UNSIGNED_PAYLOAD,
    ].join("\n");
    const stringToSign = [
      ALGORITHM,
      longDate,
      scope,
      createHash("sha256").update(canonicalRequest).digest("hex"),
    ].join("\n");
    const signature = createHmac("sha256", signingKey(day))
      .update(stringToSign)
      .digest("hex");

    // The URL's query is the canonical one with the signature in its sorted place (the SDK sorts them all together).
    params["X-Amz-Signature"] = signature;
    const search = Object.keys(params)
      .sort()
      .map((name) => `${name}=${escapeUri(params[name])}`)
      .join("&");
    return `https://${host}${path}?${search}`;
  };
}
