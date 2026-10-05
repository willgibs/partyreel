import { randomBytes } from "node:crypto";

import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { keyId, needsReseal, openToken, sealToken } = await import("./tokens.server");

const KEY = randomBytes(32).toString("base64");
const NEXT = randomBytes(32).toString("base64");
const ctx = { userId: "11111111-1111-4111-8111-111111111111", provider: "google_drive" as const, purpose: "refresh" as const };

describe("the token seal", () => {
  it("opens what it sealed, and keeps nothing readable in the stored string", () => {
    const sealed = sealToken("1//refresh-token-value", ctx, { current: KEY });
    expect(sealed.split(".")).toHaveLength(4);
    expect(sealed.startsWith(`v1.${keyId(KEY)}.`)).toBe(true);
    expect(sealed).not.toContain("refresh-token-value");
    expect(openToken(sealed, ctx, { current: KEY })).toBe("1//refresh-token-value");
  });

  it("★ binds a token to its account and its purpose: a row copied to another account opens nothing", () => {
    const sealed = sealToken("tok", ctx, { current: KEY });
    expect(openToken(sealed, { ...ctx, userId: "22222222-2222-4222-8222-222222222222" }, { current: KEY })).toBeNull();
    expect(openToken(sealed, { ...ctx, purpose: "access" }, { current: KEY })).toBeNull();
  });

  it("refuses a tampered, truncated or foreign string", () => {
    const sealed = sealToken("tok", ctx, { current: KEY });
    const parts = sealed.split(".");
    const body = Buffer.from(parts[3]!, "base64url");
    body[0] = body[0]! ^ 1;
    expect(openToken([parts[0], parts[1], parts[2], body.toString("base64url")].join("."), ctx, { current: KEY })).toBeNull();
    expect(openToken(parts.slice(0, 3).join("."), ctx, { current: KEY })).toBeNull();
    expect(openToken(`v2.${parts.slice(1).join(".")}`, ctx, { current: KEY })).toBeNull();
    expect(openToken(sealed, ctx, { current: NEXT })).toBeNull();
    expect(openToken(null, ctx, { current: KEY })).toBeNull();
  });

  it("rotates: a token sealed under the previous key still opens, and asks to be sealed again", () => {
    const old = sealToken("tok", ctx, { current: KEY });
    const keys = { current: NEXT, previous: KEY };
    expect(openToken(old, ctx, keys)).toBe("tok");
    expect(needsReseal(old, keys)).toBe(true);
    expect(needsReseal(sealToken("tok", ctx, keys), keys)).toBe(false);
  });

  it("refuses a key that is not 32 bytes", () => {
    expect(() => sealToken("tok", ctx, { current: Buffer.alloc(16).toString("base64") })).toThrow(/32 bytes/);
  });
});
