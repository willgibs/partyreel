// @contract-for: src/components/marketing/chrome/session-hint.tsx
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";

import { HeaderActions } from "./session-hint";

/**
 * THE RETURNING HOST (`returning=dashboard`, Will 2026-09-19). Three things
 * have to hold or this stops being the thing he picked, and each one is a
 * different kind of failure:
 *
 *  1. THE SERVER SNAPSHOT IS ALWAYS SIGNED OUT. About fifty marketing routes
 *     are statically prerendered, so the HTML in the cache can only ever carry
 *     the stranger's bar. Getting this wrong ships one host's chrome to
 *     everyone, and it would never show up in a browser you are signed into.
 *  2. THE LABEL SWAPS ON THE SIGNAL, to ONE primary door, in the CTA's place.
 *  3. THE SIGNAL IS A SESSION, not anything else shaped like one. The PKCE
 *     verifier a SIGNED-OUT visitor carries mid-OAuth is the adversarial case:
 *     its cookie name starts with the same prefix.
 *
 * Function, never look: no class, clock or colour is asserted below. What is
 * NOT asserted, deliberately, is that the hint is correct. It is a hint; the
 * (app) layout's getUser() is the boundary and RLS is the boundary under that.
 */

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/`;
}
function clearCookie(name: string) {
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

const SESSION = "sb-ddafaemglzmuekbtjwzn-auth-token";
const VERIFIER = "sb-ddafaemglzmuekbtjwzn-auth-token-code-verifier";

afterEach(() => {
  for (const name of [SESSION, `${SESSION}.0`, `${SESSION}.1`, VERIFIER])
    clearCookie(name);
});

describe("the returning host's hint", () => {
  it("prerenders the stranger's bar even for a signed-in reader", () => {
    setCookie(SESSION, "base64-ey...");
    const html = renderToStaticMarkup(<HeaderActions />);
    expect(html).toContain("Log in");
    expect(html).toContain("Start free");
    expect(html).not.toContain("Dashboard");
  });

  it("offers Log in and Start free to a stranger", () => {
    render(<HeaderActions />);
    expect(screen.getByRole("link", { name: "Log in" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(
      screen.getByRole("link", { name: "Start free" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
  });

  it("swaps both doors for ONE way back in, to the real route", () => {
    setCookie(SESSION, "base64-ey...");
    render(<HeaderActions />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Start free" })).toBeNull();
  });

  it("reads a chunked session, which is what a real one usually is", () => {
    setCookie(`${SESSION}.0`, "base64-ey...");
    setCookie(`${SESSION}.1`, "...rest");
    render(<HeaderActions />);
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  });

  it("never reads a mid-OAuth verifier as a session", () => {
    // A SIGNED-OUT visitor who clicked Continue with Google carries this.
    setCookie(VERIFIER, "some-verifier");
    render(<HeaderActions />);
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });

  it("never reads an emptied cookie as a session", () => {
    setCookie(SESSION, "");
    render(<HeaderActions />);
    expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull();
  });
});
