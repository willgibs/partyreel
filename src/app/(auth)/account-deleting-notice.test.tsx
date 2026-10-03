import { act, render, screen } from "@testing-library/react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

/**
 * `/login`'S ANSWER TO A DELETED ACCOUNT'S LINK OR GOOGLE (lp/account-exit): conditional words (a
 * URL brought her), the purge's time in her own zone, and the contact line. The server paints the
 * request's zone; hydration paints the same, with nothing for React to report; the render after it
 * is the browser's own zone. The browser here is in Los Angeles, the request said New York.
 */

vi.mock("@/lib/lifecycle/purge-time", async (orig) => ({
  ...(await orig<typeof import("@/lib/lifecycle/purge-time")>()),
  browserZone: () => "America/Los_Angeles",
}));

const { AccountDeletingNotice } = await import("./account-deleting-notice");

const NOW = Date.parse("2026-10-02T19:00:00Z");
const ENDS = Date.parse("2026-10-03T05:00:00Z");

const notice = () => (
  <AccountDeletingNotice
    endsAt={ENDS}
    now={NOW}
    serverZone="America/New_York"
  />
);

describe("/login's notice for a deleted account's sign-in", () => {
  it("★ says it conditionally, with the time, and a way out", () => {
    render(notice());
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(
      "If you deleted your account, it’s still being erased.",
    );
    expect(alert).toHaveTextContent("If it’s still blocked after that,");
    expect(screen.getByRole("link", { name: "contact us" })).toHaveAttribute(
      "href",
      "/contact",
    );
  });

  it("★ paints the request's zone first, hydrates clean, then speaks the browser's", async () => {
    const container = document.createElement("div");
    container.innerHTML = renderToString(notice());
    expect(container.textContent).toContain("after 1:00\u00a0AM tomorrow");
    document.body.append(container);

    const errors: unknown[] = [];
    let root!: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(container, notice(), {
        onRecoverableError: (e) => errors.push(e),
      });
    });
    expect(errors).toEqual([]);
    expect(container.textContent).toContain("after 10:00\u00a0PM tonight");

    await act(async () => root.unmount());
    container.remove();
  });
});
