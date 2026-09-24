/**
 * Pins the reel MEMBERSHIP read (R3 Track A) and its whole read (the 1,000-row round).
 *
 * `reel_items` rows outlive their media, so a raw read of the junction table returns GHOSTS - and
 * those ghosts silently inflated the section count and bricked drag-reorder (the client can only ever
 * send the ids it can SEE, while reorder_reel's set-equality guard compared against the inflated set).
 * The predicate is therefore part of the READ, and it is deliberately WIDER than the reel's render
 * identity: hidden items stay MEMBERS, only removed ones are dropped.
 *
 * `add_to_reel` caps nothing, so a reel can outgrow PostgREST's 1,000-row read: the list pages, and
 * the hub's "N clips" is a head count under the same predicate. Every pin runs on the clamping fake
 * (`src/lib/db/testing/fake-postgrest.ts`), which applies the embed's `!inner` and its filter the way
 * PostgREST does, so the ANSWER is pinned; the one shape pinned besides is the FK-hinted inner join,
 * which no amount of type-checking verifies and which a well-meaning refactor could quietly widen
 * back to "select every row".
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

let fake: FakePostgrest;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(fake),
}));

const { countReelItems, listReelItems } = await import("./reel");

/** A timestamp as Postgres returns it (microseconds, an explicit offset). */
const at = (second: number) =>
  `2026-09-23T12:${String(Math.floor(second / 60) % 60).padStart(2, "0")}:${String(second % 60).padStart(2, "0")}.000000+00:00`;
/** A 36-character id that sorts as its index does. */
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;

/** A media row, keyed by id, that a member's embed reads live. */
function mediaRow(id: string, status: string): FakeRow {
  return { id, event_id: "evt-1", status };
}

/** A member whose `media` embed is the live media row, or null once the row is purged. */
function member(
  mediaId: string,
  position: number,
  addedAt: string,
  eventId = "evt-1",
): FakeRow {
  const row: FakeRow = {
    event_id: eventId,
    media_id: mediaId,
    position,
    added_at: addedAt,
  };
  Object.defineProperty(row, "media", {
    enumerable: false,
    get: () => fake.tables.media.find((m) => m.id === mediaId) ?? null,
  });
  return row;
}

function useReel(media: FakeRow[], members: FakeRow[]) {
  fake = createFakePostgrest({ tables: { media, reel_items: members } });
}

beforeEach(() => {
  useReel(
    [
      mediaRow("m-approved", "approved"),
      mediaRow("m-hidden", "hidden"),
      mediaRow("m-pending", "pending"),
      mediaRow("m-removed", "removed"),
    ],
    [
      member("m-approved", 1, at(1)),
      member("m-hidden", 2, at(2)),
      member("m-pending", 3, at(3)),
      member("m-removed", 4, at(4)),
      // A purged photo: its curation row survived, its media row did not.
      member("m-purged", 5, at(5)),
      // Another event's member never reaches this event's read.
      member("m-approved", 0, at(0), "evt-2"),
    ],
  );
});

describe("listReelItems", () => {
  it("keeps approved and HIDDEN members and drops every ghost", async () => {
    // Hidden items are still the host's curation (shown dimmed, un-hideable), so they must stay
    // members - approved-only membership would re-brick reorder for any reel containing one. A
    // removed photo and a purged one are the ghosts; pending was never a member's state.
    expect(await listReelItems("evt-1")).toEqual(["m-approved", "m-hidden"]);
  });

  it("inner-joins media through the explicit foreign key", async () => {
    await listReelItems("evt-1");
    // !inner is what makes a ghost DISAPPEAR rather than come back with a null media; the FK hint
    // keeps the embed unambiguous now that reel_items relates to `events` too (PGRST201).
    const url = decodeURIComponent(fake.requests[0].url);
    expect(url).toContain("media!reel_items_media_id_fkey!inner(status)");
    expect(fake.requests[0].filters).toContainEqual({
      column: "media.status",
      op: "in",
      value: ["approved", "hidden"],
    });
  });

  it("orders by curated position, then add time, then id", async () => {
    useReel(
      ["a", "b", "c", "d"].map((id) => mediaRow(id, "approved")),
      [
        member("d", 2, at(9)),
        // A bulk add fires add_to_reel in parallel, so two members can share a position and even an
        // add time; the id is what keeps the Studio's order the same on every read.
        member("c", 1, at(5)),
        member("b", 1, at(5)),
        member("a", 1, at(7)),
      ],
    );
    expect(await listReelItems("evt-1")).toEqual(["b", "c", "a", "d"]);
  });

  it("reads a 2,300-member reel whole, ties across the page boundary included", async () => {
    // Positions tie in runs of three (parallel adds) and add times in runs of six, so the 1,000th
    // and 1,001st members share BOTH, and only the cursor's last branch (media_id) walks on.
    const media = Array.from({ length: 2300 }, (_, i) =>
      mediaRow(uuid(i), i % 10 === 3 ? "hidden" : "approved"),
    );
    const members = media.map((m, i) =>
      member(String(m.id), Math.floor(i / 3), at(Math.floor(i / 6))),
    );
    expect(members[999].position).toBe(members[1000].position);
    expect(members[999].added_at).toBe(members[1000].added_at);
    useReel(media, [...members].reverse());

    const ids = await listReelItems("evt-1");

    expect(ids).toEqual(media.map((m) => m.id));
    expect(fake.requests.map((r) => r.limit)).toEqual([
      MAX_ROWS,
      MAX_ROWS,
      MAX_ROWS,
    ]);
    expect(fake.requests.every((r) => !r.failed)).toBe(true);
  });

  it("throws on a failed read instead of reading as an empty reel", async () => {
    // An empty list would read as "0 clips" and hand the filmstrip a set reorder_reel refuses.
    delete fake.tables.reel_items;
    await expect(listReelItems("evt-1")).rejects.toThrow(/reel: membership/);
  });
});

describe("countReelItems", () => {
  it("counts the members under the same predicate, ghosts left out", async () => {
    expect(await countReelItems("evt-1")).toBe(2);
    expect(fake.requests[0]).toMatchObject({ method: "HEAD", returned: 0 });
  });

  it("counts 2,300 members exactly, where a list's length would stop at 1,000", async () => {
    const media = Array.from({ length: 2300 }, (_, i) =>
      mediaRow(uuid(i), "approved"),
    );
    useReel(
      media,
      media.map((m, i) => member(String(m.id), i, at(i % 3600))),
    );
    expect(await countReelItems("evt-1")).toBe(2300);
  });

  it("throws on a failed count rather than reading it as zero", async () => {
    delete fake.tables.reel_items;
    await expect(countReelItems("evt-1")).rejects.toThrow(
      /reel: membership count/,
    );
  });
});
