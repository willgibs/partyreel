import { describe, expect, it } from "vitest";

import { filesUnder, read } from "@/testing/source-tree";

/**
 * WHERE THE CARD'S HOST LINES AND A PERSON'S PHOTOGRAPHS MAY COME FROM (guests-room r1, `card=standing`). The card a
 * name opens (`GuestPeek`) draws an address, a standing and Block only where a surface hands them, and a guest's side
 * of it has none of them; the look's reads (`guest-look.ts`) prove the host themselves or stand behind the album's
 * gate. These pins are the other half, read off the tree: only the host's own surfaces hand the card its host lines,
 * and only the room's read and the look's Server Functions import the look's reads. A new host surface is a
 * deliberate edit to a list below, never a silent one.
 */

const tsx = () =>
  filesUnder("src").filter(
    (file) => file.endsWith(".tsx") && !file.endsWith(".test.tsx"),
  );

/** The attribute text of every `<GuestPeek ...>` opening tag in a source file. */
function peekTags(source: string): string[] {
  const tags: string[] = [];
  for (const match of source.matchAll(/<GuestPeek(?![\w$])/g)) {
    const start = (match.index ?? 0) + match[0].length;
    let depth = 0;
    let end = start;
    for (; end < source.length; end++) {
      const c = source[end];
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) break;
    }
    tags.push(source.slice(start, end));
  }
  return tags;
}

const ROOM = "src/app/(app)/dashboard/[eventId]/guests";

describe("the card's host lines", () => {
  /** Files whose card is handed this prop, sorted. */
  const handing = (prop: RegExp) =>
    tsx()
      .filter((file) => peekTags(read(file)).some((tag) => prop.test(tag)))
      .sort();

  it("★ an address only from the host's own surfaces (and the guest list's own prop, which no file hands it)", () => {
    expect(handing(/\bemail\s*=|\{\.\.\./)).toEqual([
      `${ROOM}/at-the-door.tsx`,
      `${ROOM}/room-guests.tsx`,
      "src/components/app/event-blocks/blocked-section.tsx",
      "src/components/app/event-blocks/credit-look.tsx",
      "src/components/social/guest-list.tsx",
    ]);
  });

  it("★ Block only from the room and the host's credit (and the guest list's own prop, which no file hands it)", () => {
    expect(handing(/\bblock\s*=/)).toEqual([
      `${ROOM}/room-guests.tsx`,
      "src/components/app/event-blocks/credit-look.tsx",
      "src/components/social/guest-list.tsx",
    ]);
  });

  it("★ a standing tonight only from the Guests room", () => {
    expect(handing(/\bstanding\s*=/)).toEqual([
      `${ROOM}/at-the-door.tsx`,
      `${ROOM}/room-guests.tsx`,
      "src/components/app/event-blocks/blocked-section.tsx",
    ]);
  });
});

describe("the look's reads", () => {
  it("★ are imported by the room's read and the look's Server Functions alone", () => {
    const importers = filesUnder("src")
      .filter((file) => /\.(ts|tsx)$/.test(file))
      .filter((file) => !/\.test\.tsx?$/.test(file))
      .filter((file) =>
        /from\s+["'][^"']*queries\/guest-look["']/.test(read(file)),
      )
      .sort();
    expect(importers).toEqual([
      `${ROOM}/look-actions.ts`,
      `${ROOM}/look.ts`,
      `${ROOM}/room.server.ts`,
    ]);
  });

  it("★ look.ts takes only a type from them, so the card that imports it never loads a server read", () => {
    expect(read(`${ROOM}/look.ts`)).toMatch(
      /import type \{[^}]*\} from "@\/lib\/db\/queries\/guest-look"/,
    );
  });

  it("★ the card loads the look's Server Functions only as a strip first asks, never at import", () => {
    const photos = read(`${ROOM}/look-photos.tsx`);
    expect(photos).not.toMatch(/from\s+["'][^"']*guests\/look-actions["']/);
    expect(photos).toMatch(
      /import\(\s*["'][^"']*guests\/look-actions["']\s*\)/,
    );
  });
});
