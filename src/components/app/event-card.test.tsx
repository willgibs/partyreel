import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventCard, RoleMarker } from "./event-card";

// Behavior pins (never styles) for the V3 stat-forward card: which chrome shows
// per variant, and the guest-private href-null contract.
//
// ★ RESHAPED ON PURPOSE (crumbs-91; scar kept: a hosted card links to its album and
// wears its pills, and an unlinked one carries the action a page hands it). The
// hosted card wore the dashboard's chrome (the QR chip, the needs-you review chip,
// the item count, the living cover) until the dashboard's tile became its own
// (host-dashboard r1), and the trash card was the bin's until guest-by-upload
// retired it; no page draws either now, so those pins went with them.
describe("EventCard (V3 stat-forward)", () => {
  it("hosted: links to its album and wears its date and its door, with no marker of its own", () => {
    render(
      <EventCard
        variant="hosted"
        href="/e/abc"
        name="Maya and Jay"
        coverUrl="https://example.test/cover.jpg"
        dateLabel="June 14"
        statusLabel="Password"
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/e/abc");
    expect(screen.getByText("June 14")).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.queryByText("Guest")).not.toBeInTheDocument();
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

  it("guest: an event you added photos to wears the Guest marker and a byline", () => {
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
  });

  it("the marker is one object for the dashboard and the profile: RoleMarker says Host or Guest", () => {
    const { rerender } = render(<RoleMarker role="host" />);
    expect(screen.getByText("Host")).toBeInTheDocument();
    rerender(<RoleMarker role="guest" />);
    expect(screen.getByText("Guest")).toBeInTheDocument();
  });

  it("an unlinked card wears the action a page hands it in place of the guest marker, and never a link", () => {
    // A page's own marker (the profile hands every card its Host or Guest) takes the top-right,
    // so the guest variant's never stands beside it.
    render(
      <EventCard
        variant="guest"
        href={null}
        name="Sam's birthday"
        coverUrl="https://example.test/cover.jpg"
        dateLabel="May 30"
        action={<RoleMarker role="host" />}
      />,
    );
    expect(screen.getByText("Host")).toBeInTheDocument();
    expect(screen.queryByText("Guest")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
