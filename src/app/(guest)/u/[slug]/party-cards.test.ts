import { describe, expect, it } from "vitest";

import { partyCards } from "./party-cards";

/**
 * What each card of a person's grid claims (`party-cards.ts`): a hosted card links to the album its
 * host published, an attended card links nowhere, and ★ no card is ever drawn locked here, since
 * every album on a profile is one the page's own rules let this visitor see a line of. A video-only
 * party wore the lock until crumbs-44, read off its missing link.
 */
const covers = (entries: [string, string][] = []) => new Map(entries);

const hosted = (
  id: string,
  event_date: string | null,
  visibility = "open",
) => ({
  id,
  name: `Hosted ${id}`,
  event_date,
  visibility: visibility as "open" | "password" | "private",
  qr_token: `qr-${id}`,
  custom_slug: id === "h-slug" ? "summer" : null,
});

const attended = (id: string, event_date: string | null) => ({
  id,
  name: `Attended ${id}`,
  event_date,
});

describe("partyCards", () => {
  it("★ an attended party that is all video wears the video face; one a gate dropped wears the plain one", () => {
    const cards = partyCards(
      {
        hosted_events: [],
        attended_events: [
          attended("a-photo", "2026-09-01"),
          attended("a-video", "2026-08-01"),
          attended("a-raced", "2026-07-01"),
        ],
      },
      covers(),
      {
        covers: covers([["a-photo", "signed:preview"]]),
        videoOnly: new Set(["a-video"]),
      },
    );
    const byId = new Map(cards.map((c) => [c.id, c]));

    expect(byId.get("a-photo")).toMatchObject({
      href: null,
      coverUrl: "signed:preview",
      role: "guest",
    });
    expect(byId.get("a-video")).toMatchObject({
      href: null,
      coverUrl: null,
      empty: "video",
    });
    // A race with the RPC (the album closed between the two reads) proves nothing about video.
    expect(byId.get("a-raced")).toMatchObject({
      coverUrl: null,
      empty: "photo",
    });
    expect(cards.some((c) => c.empty === "locked")).toBe(false);
  });

  it("a hosted card links to the album its host published and says which door it has", () => {
    const cards = partyCards(
      {
        hosted_events: [
          hosted("h-open", "2026-09-02"),
          hosted("h-slug", "2026-09-01", "password"),
          hosted("h-private", null, "private"),
        ],
        attended_events: [],
      },
      covers([["h-open", "signed:cover"]]),
      { covers: covers(), videoOnly: new Set() },
    );
    expect(cards.map((c) => [c.id, c.href, c.statusLabel, c.coverUrl])).toEqual(
      [
        ["h-open", "/e/qr-h-open", null, "signed:cover"],
        ["h-slug", "/e/summer", "Password", null],
        ["h-private", "/e/qr-h-private", "Private", null],
      ],
    );
    expect(cards.every((c) => c.role === "host" && c.empty === "photo")).toBe(
      true,
    );
  });

  it("merges both kinds into one year, newest first, the undated last", () => {
    const cards = partyCards(
      {
        hosted_events: [hosted("h1", "2026-05-01"), hosted("h2", null)],
        attended_events: [
          attended("a1", "2026-06-01"),
          attended("a2", "2026-04-01"),
        ],
      },
      covers(),
      { covers: covers(), videoOnly: new Set() },
    );
    expect(cards.map((c) => c.id)).toEqual(["a1", "h1", "a2", "h2"]);
  });
});

describe("partyCards: a range of days (20261003120000)", () => {
  it("carries a range's last day on both kinds of card, and none where the payload has none", () => {
    const cards = partyCards(
      {
        hosted_events: [{ ...hosted("h1", "2026-10-03"), event_end_date: "2026-10-05" }],
        attended_events: [
          { ...attended("a1", "2026-09-04"), event_end_date: "2026-09-06" },
          attended("a2", "2026-08-01"),
        ],
      },
      covers(),
      { covers: new Map(), videoOnly: new Set() },
    );
    expect(cards.map((c) => [c.id, c.eventDate, c.eventEndDate])).toEqual([
      ["h1", "2026-10-03", "2026-10-05"],
      ["a1", "2026-09-04", "2026-09-06"],
      ["a2", "2026-08-01", null],
    ]);
  });
});
