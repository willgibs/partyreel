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
    render(
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
