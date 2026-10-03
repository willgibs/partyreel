import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * THE HUB, READY FOR GUESTS (Will's `event-ready` picks, 2026-10-02): the checklist at the head of the hub,
 * Settings' steps and the Settings card all read one set of facts the page gathers.
 *
 * The page is a server component over a session, the album's store and a dozen reads, so what is pinned
 * here is how it hands the facts on (`event-not-found.test.tsx` holds that none of them is read before the
 * event is found). Each of these fails silently: a checklist under the album reads as a footnote, a code
 * "opened" by a number the header does not show contradicts the eye beside it, and two sets of facts let
 * the hub and Settings disagree about one tick.
 */
const PAGE = readFileSync(
  join(process.cwd(), "src/app/(app)/dashboard/[eventId]/page.tsx"),
  "utf8",
);

describe("the hub's ready wiring", () => {
  it("★ stands the checklist at the head of the hub: under the cards, over the album", () => {
    const cards = PAGE.indexOf("<EventCardsRow");
    const list = PAGE.indexOf("<EventChecklist");
    const album = PAGE.indexOf("<EventGallery");
    expect(cards, "the cards").toBeGreaterThan(-1);
    expect(list, "the checklist under the cards").toBeGreaterThan(cards);
    expect(album, "the album under the checklist").toBeGreaterThan(list);
  });

  it("★ counts the code's first open as the header's own Views number", () => {
    expect(/const views = linkStats\.qrScans/.test(PAGE)).toBe(true);
    expect(/opened: views,/.test(PAGE)).toBe(true);
  });

  it("hands the checklist and Settings' steps the same facts", () => {
    expect(/facts=\{readyFacts\}/.test(PAGE)).toBe(true);
    expect(/ready=\{readyFacts\}/.test(PAGE)).toBe(true);
  });

  it("lets the checklist and the Settings card step aside together once the event's date is behind", () => {
    expect(
      /const over = checklistOver\(event\.event_date, today\)/.test(PAGE),
    ).toBe(true);
    expect(/over=\{over\}/.test(PAGE)).toBe(true);
    expect(
      /const guestNeeds = over \? 0 : stepsLeft\(readyFacts\)/.test(PAGE),
    ).toBe(true);
  });

  it("reads that day as the viewer's, never the server's", () => {
    expect(
      /resolveViewerZone\(\s*headerList\.get\(VIEWER_ZONE_HEADER\)/.test(PAGE),
    ).toBe(true);
  });

  it("★ hands the Reel card the album's develop time, so it never says live for guests over an album no guest can see yet", () => {
    // Red-team 43's NIT: until a develop time ahead every guest's album is empty, so the card says it goes live then
    // (`reel-card.tsx`'s `developsAt`); a page that left the field off would read as it did before.
    expect(/reel = \{[\s\S]*?developsAt: event\.develops_at,/.test(PAGE)).toBe(
      true,
    );
  });

  it("dresses the code in its door and who waits at it", () => {
    // ★ Reshaped on purpose (`event-header` r1, `host=shared`): the code stands on the head's cover
    // (`HubCover`), so the page hands the door and its waiting count to the head, and the head hands
    // them to the code, unchanged.
    const head = PAGE.slice(PAGE.indexOf("<HubCover"));
    const props = head.slice(0, head.indexOf("/>"));
    expect(props).toContain("door: event.door");
    expect(props).toContain("waiting: doorCounts.waiting");
    const cover = readFileSync(
      join(process.cwd(), "src/components/app/event-feed/event-hub-head.tsx"),
      "utf8",
    );
    const door = cover.slice(cover.indexOf("<EventCodeDoor"));
    const handed = door.slice(0, door.indexOf("/>"));
    expect(handed).toContain("door={code.door}");
    expect(handed).toContain("waiting={code.waiting}");
  });
});

/**
 * EVERY ROOM OVER THE HUB (Will, event-header r2 `rooms=over`): the place the address names is read once on the server,
 * its room's own data comes with it, and the old deep links land in their rooms. Behaviour is the island's and the
 * rooms' own tests'; what only the page can say is pinned here.
 */
describe("the hub's rooms", () => {
  it("★ reads the Guests room with the hub while the address names it, and never otherwise", () => {
    expect(PAGE).toMatch(/const place = resolveEventSheet\(room\)/);
    expect(PAGE).toMatch(
      /place === "guests"\s*\?\s*\(async \(\) =>\s*readGuestsRoom\(/,
    );
    expect(PAGE).toMatch(/guestsRoom=\{guestsRoom\}/);
  });

  it("★ mints Review's queue with the first window when the address names Review", () => {
    expect(PAGE).toMatch(
      /if \(place === "review"\) \{[\s\S]*?ENTRY_PENDING[\s\S]*?firstWindow\.push/,
    );
    expect(PAGE).toMatch(/readHostLinksBody\(supabase, event, firstWindow\)/);
  });

  it("hands the island the event, so a press on an old way into a room inside the hub opens it in place", () => {
    expect(PAGE).toMatch(
      /<EventShareProvider initialSheet=\{place\} eventId=\{event\.id\}>/,
    );
  });

  it("sends a retired ?section= or ?eventTab= link to the room that holds it now", () => {
    expect(PAGE).toMatch(
      /const legacy = legacyRoomAddress\(eventId, section, eventTab\);\s*if \(legacy\) redirect\(legacy\);/,
    );
  });
});
