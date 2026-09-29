/**
 * THE GATES' REDIRECT CARRIES THE PAGE (crumbs-11). The (app) and (print) layouts send a signed-out
 * request to `loginPathForRequest()`, which reads the path the proxy handed over. A page on the
 * return allow-list rides along; a missing header, a page off the list or a forged value is the
 * bare /login it always was.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { REQUEST_PATH_HEADER } from "@/lib/auth/return-path";

const state = vi.hoisted(() => ({ header: null as string | null }));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers(
      state.header === null ? {} : { [REQUEST_PATH_HEADER]: state.header },
    ),
}));

const { loginPathForRequest } = await import("./login-redirect");

beforeEach(() => {
  state.header = null;
});

describe("loginPathForRequest", () => {
  it("carries a mail's button's page", async () => {
    state.header = "/account/renew";
    expect(await loginPathForRequest()).toBe("/login?next=%2Faccount%2Frenew");
    state.header = "/dashboard";
    expect(await loginPathForRequest()).toBe("/login?next=%2Fdashboard");
  });

  it("is the bare /login with no header, a page off the list or a forged value", async () => {
    expect(await loginPathForRequest()).toBe("/login");
    for (const header of [
      "/api/stripe/checkout",
      "//evil.example",
      "https://evil.example",
      "/account/renew?next=https://evil.example",
      "",
    ]) {
      state.header = header;
      expect(await loginPathForRequest(), header).toBe("/login");
    }
  });
});
