import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HubCover } from "./event-hub-head";

/**
 * THE HUB'S HEAD, WITH THE ALBUM'S FACTS AS A STRIP (`event-header` r3, Will's `facts=strip`): what the cover keeps
 * and where the strip stands. The strip's own contract is `event-hub-head-strip.test.tsx`'s; this is the composition: the
 * album's number is said once, at the strip's end, so the line under the title keeps what the strip does not carry.
 */

vi.mock("@/components/app/share/event-code-door", () => ({
  EventCodeDoor: () => <div data-testid="code" />,
}));
vi.mock("@/components/app/share/event-link-row", () => ({
  EventLinkRow: () => <div data-testid="link" />,
}));
vi.mock("./event-gallery-live", () => ({
  EventLive: () => <span data-testid="live" />,
}));
// No album store (the Library's specimen): the head draws the counts and arrivals it is handed.
vi.mock("./host-album", () => ({
  useHostAlbum: () => null,
  useHubEntries: () => null,
  useHubCounts: () => null,
}));

const cover = (over: Partial<Parameters<typeof HubCover>[0]> = {}) => (
  <HubCover
    name="Maya & Jay"
    date="2026-09-12"
    counts={{ album: 214, guests: 31, views: 486 }}
    prettyUrl="https://partyreel.com/e/maya-and-jay"
    eventLink="https://partyreel.com/e/3f0c1d2e"
    code={{
      qrStyle: "classic",
      door: "approve",
      acceptingUploads: true,
      waiting: 2,
    }}
    stills={[]}
    toBar={false}
    {...over}
  />
);

describe("the hub's head", () => {
  it("★ says the album's facts as the strip along the cover's foot, below the name and the code", () => {
    const { container } = render(cover());
    const strip = container.querySelector("[data-hub-strip]");
    expect(strip).not.toBeNull();
    const name = screen.getByRole("heading", { level: 1 });
    const code = screen.getByTestId("code");
    // The strip stands after the name and the code in the cover's own order, spanning under both.
    for (const above of [name, code]) {
      expect(
        above.compareDocumentPosition(strip!) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    }
    expect(strip!.parentElement).toBe(code.parentElement!.parentElement);
  });

  it("ends the strip in the page's album count", () => {
    const { container } = render(cover());
    expect(container.querySelector("[data-hub-strip-count]")?.textContent).toBe(
      "214",
    );
  });

  it("★ says the album's number once: the line under the title carries no photos count of its own", () => {
    render(cover());
    expect(screen.queryByRole("button", { name: /photos/i })).toBeNull();
    expect(screen.getAllByText("214")).toHaveLength(1);
  });

  it("keeps the date, the guests, the views and the Live mark on the line under the title", () => {
    const { container } = render(cover());
    expect(container.textContent).toContain("September 12, 2026");
    expect(
      screen.getByRole("button", { name: "31 guests" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "486 views" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("live")).toBeInTheDocument();
    expect(screen.getByTestId("link")).toBeInTheDocument();
  });

  it("says a day's range as it always has, and nothing of a date that was never set", () => {
    const { container, rerender } = render(
      cover({ date: "2026-10-02", endDate: "2026-10-04" }),
    );
    expect(container.textContent).toContain("October 2");
    rerender(cover({ date: null }));
    expect(container.textContent).not.toContain("2026");
  });

  it("holds an album with no photographs as the quiet line, for any event", () => {
    const { container } = render(
      cover({ counts: { album: 0, guests: 0, views: 0 } }),
    );
    expect(container.textContent).toContain("No photos yet");
    expect(container.querySelector("[data-hub-strip-count]")).toBeNull();
  });

  it("hands the strip the arrivals of a head outside the hub's store", () => {
    const nowMin = Date.now() / 60_000;
    const { container } = render(
      cover({ arrivals: [nowMin - 500, nowMin - 300, nowMin - 2] }),
    );
    expect(
      container.querySelector("[data-hub-strip]")?.hasAttribute("data-landing"),
    ).toBe(true);
  });
});
