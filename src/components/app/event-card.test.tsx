import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventCard } from "./event-card";

// Behavior pins (never styles) for the V3 stat-forward card: which chrome shows
// per variant, the amber chip threshold, and the saved-private href-null contract.
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

  it("saved-private (href null) renders no link and the private name (lock fallback)", () => {
    render(
      <EventCard
        variant="saved"
        href={null}
        name="Private event"
        coverUrl={null}
        dateLabel="Saved June 1"
      />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByText("Private event")).toBeInTheDocument();
  });

  it("saved: shows the bookmark provenance glyph (no QR) and an unsave action", () => {
    render(
      <EventCard
        variant="saved"
        href="/e/abc"
        name="A friend's wedding"
        coverUrl="https://example.test/cover.jpg"
        dateLabel="July 2"
        byline="Hosted by Sam"
        action={<button data-testid="unsave">unsave</button>}
      />,
    );
    expect(screen.getByText("Saved event")).toBeInTheDocument(); // sr-only glyph label
    expect(screen.getByTestId("unsave")).toBeInTheDocument();
    expect(screen.getByText("Hosted by Sam")).toBeInTheDocument();
    expect(screen.queryByText(/to review/)).not.toBeInTheDocument();
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
});
