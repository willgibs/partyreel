import { describe, expect, it } from "vitest";

import {
  DEFAULT_RETURN_PATH,
  isAllowedReturnPath,
  safeReturnPath,
  withWelcomeMarker,
  withoutWelcomeMarker,
} from "./return-path";

/**
 * THE ONE STRING A BROWSER FOLLOWS WITHOUT ASKING (`back=finish`, 2026-09-20).
 *
 * Stripe's `success_url` is built from a value a client POSTs, and Stripe
 * validates none of it. This pins the ALLOW-LIST behaviour rather than the
 * regexes: every legal return shape is accepted, and everything else, however
 * it is dressed, becomes the dashboard. A future edit that loosens a shape into
 * a prefix match turns most of the second block red.
 */

const EVENT = "9f1c2b3a-4d5e-6f70-8192-a3b4c5d6e7f8";

describe("the paths a purchase may come back to", () => {
  it("accepts the three app pages that mount the welcome modal", () => {
    for (const path of [
      "/dashboard",
      `/dashboard/${EVENT}`,
      `/dashboard/${EVENT}?room=settings`,
      `/dashboard/${EVENT}?room=share`,
      "/account",
    ]) {
      expect(isAllowedReturnPath(path), path).toBe(true);
      expect(safeReturnPath(path)).toBe(path);
    }
  });

  it("accepts an uppercase event id, because Postgres prints uuids either way", () => {
    expect(isAllowedReturnPath(`/dashboard/${EVENT.toUpperCase()}`)).toBe(true);
  });
});

describe("everything else becomes the dashboard, silently", () => {
  // Each of these has broken a hand-rolled redirect guard somewhere in the
  // wild; the list is the reason this is an allow-list and not a blocklist.
  const hostile = [
    "https://evil.example/steal",
    "http://evil.example",
    "//evil.example",
    "/\\evil.example",
    "\\\\evil.example",
    "javascript:alert(1)",
    "data:text/html,<script>",
    "/dashboard/../admin",
    "/dashboard%2f..%2fadmin",
    "/dashboardx",
    "/dashboard/",
    "/dashboard?upgraded=1",
    `/dashboard/${EVENT}?room=settings&next=https://evil.example`,
    `/dashboard/${EVENT}/reel`,
    "/admin",
    "/account/delete",
    "",
    "   /dashboard",
  ];

  it.each(hostile)("refuses %j", (value) => {
    expect(isAllowedReturnPath(value)).toBe(false);
    expect(safeReturnPath(value)).toBe(DEFAULT_RETURN_PATH);
  });

  it("refuses a control character even inside an otherwise legal path", () => {
    expect(isAllowedReturnPath("/dashboard\n")).toBe(false);
    expect(isAllowedReturnPath("/account\r\nLocation: https://evil.example")).toBe(
      false,
    );
  });

  it("refuses anything that is not a string", () => {
    for (const value of [undefined, null, 42, {}, ["/dashboard"], true]) {
      expect(isAllowedReturnPath(value)).toBe(false);
      expect(safeReturnPath(value)).toBe(DEFAULT_RETURN_PATH);
    }
  });
});

describe("the marker that opens the modal once", () => {
  it("joins with ? or & depending on what the path already carries", () => {
    expect(withWelcomeMarker("/dashboard")).toBe("/dashboard?welcome=pro");
    expect(withWelcomeMarker(`/dashboard/${EVENT}?room=settings`)).toBe(
      `/dashboard/${EVENT}?room=settings&welcome=pro`,
    );
  });

  it("round-trips: stripping it leaves exactly the path we started from", () => {
    for (const path of ["/dashboard", "/account", `/dashboard/${EVENT}?room=share`]) {
      expect(withoutWelcomeMarker(withWelcomeMarker(path))).toBe(path);
    }
  });
});
