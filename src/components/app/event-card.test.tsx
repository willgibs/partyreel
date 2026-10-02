import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventCard, RoleMarker } from "./event-card";

// Behavior pins (never styles) for the V3 stat-forward card: which chrome shows
// per variant, the amber chip threshold, and the guest-private href-null contract.
describe("EventCard (V3 stat-forward)", () => {
  it("hosted: renders the QR slot, links to the event, and shows the amber chip only when pending > 0", () => {
    const { rerender } = render(
      <EventCard
        variant="hosted"
        href="/dashboard/e1"
        name="Maya and Jay"
        coverUrl="https://example.test/cover.jpg"
        dateLabel="June 14"
        itemsLabel="12 items"
        statusLabel="Open"
        pendingCount={3}
        qrSlot={<button data-testid="qr">qr</button>}
      />,
    );
    expect(screen.getByTestId("qr")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/dashboard/e1");
    expect(screen.getByText("3 to review")).toBeInTheDocument();

    rerender(
      <EventCard
        variant="hosted"
        href="/dashboard/e1"
        name="Maya and Jay"
        coverUrl="https://example.test/cover.jpg"
        dateLabel="June 14"
        itemsLabel="12 items"
        statusLabel="Open"
        pendingCount={0}
        qrSlot={<button data-testid="qr">qr</button>}
      />,
    );
    expect(screen.queryByText(/to review/)).not.toBeInTheDocument();
  });

  it("guest-private (href null) renders no link and the private name (lock fallback)", () => {
    const { container } = render(
      <EventCard
        variant="guest"
        href={null}
        name="Private event"
        coverUrl={null}
        dateLabel="The host made this event private"
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Private event")).toBeInTheDocument();
    // Naming no face of its own, an unlinked card is the locked album the dashboard means by it.
    expect(
      container.querySelector("[data-face]")?.getAttribute("data-face"),
    ).toBe("locked");
  });

  /**
   * ★ A MISSING LINK IS NOT A LOCK (crumbs-44). A profile's attended card has no link because
   * attendance is not a capability grant, while its album is open by the RPC's own gate; one whose
   * party is all video has no photograph to cover it, and it wore the lock read off `href: null`,
   * telling every visitor an open album was locked. It names its own face now.
   */
  it("an attended card with no cover wears the face it names (all video), never the lock", () => {
    const { container, rerender } = render(
      <EventCard
        href={null}
        name="Sam's birthday"
        coverUrl={null}
        dateLabel="May 30"
        empty="video"
        action={<RoleMarker role="guest" />}
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const face = () => container.querySelector("[data-face]");
    expect(face()?.getAttribute("data-face")).toBe("video");
    expect(container.querySelector(".lucide-lock")).toBeNull();
    expect(face()?.querySelector(".lucide-film")).not.toBeNull();

    // A cover, when the album has one, is the face: no empty face is drawn under it.
    rerender(
      <EventCard
        href={null}
        name="Sam's birthday"
        coverUrl="https://example.test/preview.webp"
        dateLabel="May 30"
        empty="video"
      />,
    );
    expect(face()).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.test/preview.webp",
    );
  });

  it("a linked card with no cover is waiting for a photograph, whatever its variant", () => {
    const { container } = render(
      <EventCard
        href="/e/abc"
        name="Office Summer Party"
        coverUrl={null}
        dateLabel="Aug 2"
      />,
    );
    expect(
      container.querySelector("[data-face]")?.getAttribute("data-face"),
    ).toBe("photo");
  });

  it("guest: an event you added photos to wears the Guest marker and a byline, never a QR or a review chip", () => {
    render(
      <EventCard
        variant="guest"
        href="/e/abc"
        name="A friend's wedding"
        coverUrl="https://example.test/cover.jpg"
        dateLabel="July 2"
        byline="Hosted by Sam"
      />,
    );
    expect(screen.getByText("Guest")).toBeInTheDocument();
    expect(screen.getByText(": added photos here")).toBeInTheDocument(); // sr-only
    expect(screen.getByText("Hosted by Sam")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/e/abc");
    expect(screen.queryByText(/to review/)).not.toBeInTheDocument();
  });

  it("the marker is one object for the dashboard and the profile: RoleMarker says Host or Guest", () => {
    const { rerender } = render(<RoleMarker role="host" />);
    expect(screen.getByText("Host")).toBeInTheDocument();
    rerender(<RoleMarker role="guest" />);
    expect(screen.getByText("Guest")).toBeInTheDocument();
  });

  it("trash: renders the countdown status + a restore action and never a link", () => {
    render(
      <EventCard
        variant="trash"
        href={null}
        name="Old party"
        coverUrl={null}
        dateLabel="May 2"
        statusLabel="30 days left"
        action={<button data-testid="restore">restore</button>}
      />,
    );
    expect(screen.getByText("30 days left")).toBeInTheDocument();
    expect(screen.getByTestId("restore")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("living: a card with stills paints its cover first and takes its turn; one still is a plain cover", () => {
    // `reel-host`, his `pulse` note: the dashboard's cards dissolve through their stills in turn.
    const { container, rerender } = render(
      <EventCard
        href="/dashboard/e1"
        name="Maya and Jay"
        coverUrl="cover.jpg"
        dateLabel="June 14"
        living={{ id: "e1", stills: ["cover.jpg", "next.jpg"] }}
      />,
    );
    const layer = container.querySelector("[data-living='2']");
    expect(layer).not.toBeNull();
    expect(layer?.querySelector("img.opacity-100")?.getAttribute("src")).toBe(
      "cover.jpg",
    );

    rerender(
      <EventCard
        href="/dashboard/e1"
        name="Maya and Jay"
        coverUrl="cover.jpg"
        dateLabel="June 14"
        living={{ id: "e1", stills: ["cover.jpg"] }}
      />,
    );
    expect(container.querySelector("[data-living]")).toBeNull();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "cover.jpg",
    );
  });
});
