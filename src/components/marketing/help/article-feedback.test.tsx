import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ArticleFeedback } from "@/components/marketing/help/article-feedback";

/**
 * THE BEACON, AS A READER MEETS IT (help-center r1 `feedback=beacon`: "One insert per click,
 * visible only in admin; the reader sees the same thank-you or sorry"). Pinned: one post a click
 * (a double-click included), the body the route expects, and a screen that never depends on the
 * answer, a refused or failed post included.
 */
const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function body(call: unknown[]): unknown {
  return JSON.parse((call[1] as RequestInit).body as string);
}

describe("ArticleFeedback", () => {
  it("posts one Yes, with the article's slug, and thanks the reader", () => {
    render(<ArticleFeedback slug="an-upload-wont-finish" />);
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("/api/help/feedback");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("content-type")).toBe(
      "application/json",
    );
    // The click must land even when the reader follows "Up next" straight away.
    expect(init.keepalive).toBe(true);
    expect(body(fetchMock.mock.calls[0])).toEqual({
      slug: "an-upload-wont-finish",
      helpful: true,
    });
    expect(screen.getByText(/Glad it helped/)).toBeTruthy();
  });

  it("posts one No and routes the reader to contact, prefilled with the article", () => {
    render(<ArticleFeedback slug="you-cant-sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(body(fetchMock.mock.calls[0])).toEqual({
      slug: "you-cant-sign-in",
      helpful: false,
    });
    const link = screen.getByRole("link", { name: "Tell us what was missing" });
    expect(link.getAttribute("href")).toBe("/contact?about=you-cant-sign-in");
  });

  it("sends one post however fast the reader clicks", () => {
    render(<ArticleFeedback slug="you-cant-sign-in" />);
    const yes = screen.getByRole("button", { name: "Yes" });
    fireEvent.click(yes);
    fireEvent.click(yes);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "No" })).toBeNull();
  });

  it("shows the same thank-you when the post fails or is refused", () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    render(
      <ArticleFeedback
        slug="you-cant-sign-in"
        next={{
          slug: "the-email-code-didnt-arrive",
          title: "The email code didn't arrive",
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Yes" }));
    expect(screen.getByText(/Glad it helped/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "The email code didn't arrive" }),
    ).toBeTruthy();
  });

  it("never breaks the page when the browser refuses to send at all", () => {
    fetchMock.mockImplementation(() => {
      throw new TypeError("keepalive unsupported");
    });
    render(<ArticleFeedback slug="you-cant-sign-in" />);
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(screen.getByText(/Sorry about that/)).toBeTruthy();
  });
});
