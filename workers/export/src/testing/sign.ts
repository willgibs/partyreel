/**
 * The app's side of the wire, for the Worker's tests, in Web Crypto (the Worker's own types know no
 * node:crypto or Buffer): sign a token as `src/lib/export/export-token.ts` does, and read a report back.
 */

const enc = new TextEncoder();

export function toBase64Url(text: string): string {
  let bin = "";
  for (const b of enc.encode(text)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function fromBase64Url(b64url: string): string {
  const bin = atob(b64url.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export async function hmacHex(secret: string, text: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(text));
  return [...new Uint8Array(mac)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** A token as the app signs it: `${body}.${hmacHex(body)}`, body = base64url(JSON). */
export async function signToken(
  secret: string,
  payload: Record<string, unknown>,
): Promise<string> {
  const body = toBase64Url(JSON.stringify(payload));
  return `${body}.${await hmacHex(secret, body)}`;
}

/** A token's payload, read back (no check: the tests' own tokens). */
export function payloadOf(token: string): Record<string, unknown> {
  return JSON.parse(fromBase64Url(token.split(".")[0])) as Record<
    string,
    unknown
  >;
}

/** A report off the wire: its payload, and whether its MAC is the report domain's under `secret`. */
export async function readReport(
  secret: string,
  wire: string,
): Promise<{ report: Record<string, unknown>; signed: boolean }> {
  const [body, mac] = wire.split(".");
  return {
    report: JSON.parse(fromBase64Url(body)) as Record<string, unknown>,
    signed: mac === (await hmacHex(secret, `report:${body}`)),
  };
}

/** Let the event loop turn (on real ticks: the tests freeze only the clock) until `ready` holds. */
export async function until(ready: () => boolean): Promise<void> {
  for (let i = 0; i < 100 && !ready(); i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
