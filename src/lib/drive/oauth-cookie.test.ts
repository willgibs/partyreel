import { createHmac } from "node:crypto";

import { describe, expect, it } from "vitest";

import { connectLanding, DRIVE_OAUTH_TTL_MS, openIntent, sealIntent, withDriveReturn } from "./oauth-cookie";

const SECRET = "unlock-cookie-secret-for-tests-0123456789";
const NOW = Date.parse("2026-10-05T12:00:00Z");
const intent = {
  state: "s".repeat(43),
  verifier: "v".repeat(64),
  uid: "11111111-1111-4111-8111-111111111111",
  next: "/dashboard",
  exp: NOW + DRIVE_OAUTH_TTL_MS,
};

describe("the connect's state cookie", () => {
  it("opens what it sealed, inside its ten minutes", () => {
    expect(openIntent(SECRET, sealIntent(SECRET, intent), NOW)).toEqual(intent);
  });

  it("★ refuses an expired, re-signed, tampered or malformed cookie", () => {
    const sealed = sealIntent(SECRET, intent);
    expect(openIntent(SECRET, sealed, intent.exp)).toBeNull();
    expect(openIntent("another-secret", sealed, NOW)).toBeNull();
    const [body, mac] = sealed.split(".");
    const forged = Buffer.from(JSON.stringify({ ...intent, uid: "22222222-2222-4222-8222-222222222222" })).toString("base64url");
    expect(openIntent(SECRET, `${forged}.${mac}`, NOW)).toBeNull();
    expect(openIntent(SECRET, `${body}.${mac}.x`, NOW)).toBeNull();
    expect(openIntent(SECRET, "", NOW)).toBeNull();
    expect(openIntent(SECRET, "x".repeat(5000), NOW)).toBeNull();
    expect(openIntent("", sealed, NOW)).toBeNull();
  });

  it("is a different signature from any other cookie under the same secret (its own domain)", () => {
    const sealed = sealIntent(SECRET, intent);
    const body = sealed.split(".")[0]!;
    expect(sealed.split(".")[1]).not.toBe(createHmac("sha256", SECRET).update(body).digest("hex"));
  });

  it("★ lands only on an app path: never another site", () => {
    expect(openIntent(SECRET, sealIntent(SECRET, { ...intent, next: "https://evil.example" }), NOW)).toBeNull();
    expect(openIntent(SECRET, sealIntent(SECRET, { ...intent, next: "//evil.example" }), NOW)).toBeNull();
    expect(connectLanding("https://evil.example")).toBe("/dashboard");
    expect(connectLanding("//evil.example/x")).toBe("/dashboard");
    expect(connectLanding("/account")).toBe("/account");
  });
});

describe("the return word", () => {
  it("joins the query, and goes before a fragment", () => {
    expect(withDriveReturn("/dashboard", "connected")).toBe("/dashboard?drive=connected");
    expect(withDriveReturn("/dashboard?x=1", "declined")).toBe("/dashboard?x=1&drive=declined");
    expect(withDriveReturn("/account#google-drive", "connected")).toBe("/account?drive=connected#google-drive");
  });
});
