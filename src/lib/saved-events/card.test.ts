import { describe, expect, it } from "vitest";

import { savedEventCardProps, type SavedEventRow } from "./card";

function row(overrides: Partial<SavedEventRow>): SavedEventRow {
  return {
    event_id: "e1",
    saved_at: "2026-06-02T00:00:00Z",
    name: "Summer Party",
    host_display_name: "Alex",
    event_date: "2026-07-04",
    visibility: "open",
    has_password: false,
    qr_token: "qr123",
    cover_key: "events/e1/cover.jpg",
    accessible: true,
    ...overrides,
  };
}

describe("savedEventCardProps", () => {
  it("open event: links to the album, shows cover + byline", () => {
    const card = savedEventCardProps(row({}), "https://cdn/cover.jpg");
    expect(card.accessible).toBe(true);
    expect(card.savedAt).toBe("2026-06-02T00:00:00Z"); // threaded for the merged-tab recency sort
    expect(card.href).toBe("/e/qr123"); // the single event link
    expect(card.name).toBe("Summer Party");
    expect(card.coverUrl).toBe("https://cdn/cover.jpg");
    expect(card.byline).toBe("Hosted by Alex");
    expect(card.passwordProtected).toBe(false);
  });

  it("password event: accessible with no cover (gated media never leaks)", () => {
    // The RPC returns cover_key=null for password events, so coverUrl is null here.
    const card = savedEventCardProps(
      row({ visibility: "password", has_password: true, cover_key: null }),
      null,
    );
    expect(card.accessible).toBe(true);
    expect(card.href).toBe("/e/qr123");
    expect(card.name).toBe("Summer Party");
    expect(card.coverUrl).toBeNull();
    expect(card.passwordProtected).toBe(true);
  });

  it("private event: fully masked, disabled, never carries a cover", () => {
    // The RPC masks everything; even if a cover URL is somehow passed, it's dropped.
    const card = savedEventCardProps(
      row({
        visibility: "private",
        accessible: false,
        name: null,
        host_display_name: null,
        event_date: null,
        qr_token: null,
        cover_key: null,
      }),
      "https://cdn/should-not-appear.jpg",
    );
    expect(card.accessible).toBe(false);
    expect(card.href).toBeNull();
    expect(card.name).toBe("Private event");
    expect(card.byline).toBeNull();
    expect(card.coverUrl).toBeNull();
    expect(card.dateLabel).toBe("The host made this event private");
  });

  it("accessible event with no date shows a neutral label", () => {
    const card = savedEventCardProps(row({ event_date: null }), null);
    expect(card.dateLabel).toBe("No date set");
  });
});
