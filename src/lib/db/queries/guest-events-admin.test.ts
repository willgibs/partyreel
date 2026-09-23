/**
 * THE HOST'S CREDITS REACH EVERY ITEM IN A BIG ALBUM.
 *
 * `getUploaderIdentities` feeds the uploader credit on the host's album, its review room and its
 * reel pages, and the guest album's own credits. PostgREST clamps every response to `max_rows`
 * (1000 on this project) without saying so, so a single read gave an album past a thousand items
 * credits for its first thousand and silence for the rest. The read walks keyset pages by id now;
 * a recording fake stands in for the query builder, because the PAGING is the contract.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/events/unlock-cookie", () => ({ isUnlocked: vi.fn() }));
vi.mock("@/lib/db/queries/social", () => ({ getEventGuests: vi.fn() }));
vi.mock("@/lib/supabase/avatar-storage", () => ({ getAvatarUrl: vi.fn() }));

type MediaRow = {
  id: string;
  guest_id: string | null;
  guests: {
    user_id: string | null;
    email: string | null;
    display_name: string | null;
    verified_at: string | null;
    profiles: { display_name: string | null } | null;
  } | null;
};

/** The album: ids sort as strings, the way Postgres orders a uuid's text here. */
let media: MediaRow[] = [];
/** PostgREST's own clamp, which may be lower than the page the code asks for. */
let clamp = 1000;
/** A count that disagrees with the rows (a row removed between the count and a later page). */
let countBias = 0;
/** Every media page the code asked for: its `gt` cursor and whether it wanted a count. */
const pages: { after: string | null; counted: boolean }[] = [];

function mediaBuilder() {
  let after: string | null = null;
  let counted = false;
  let limit = Infinity;
  const builder = {
    select(_columns: string, options?: { count?: string }) {
      counted = options?.count === "exact";
      return builder;
    },
    eq: () => builder,
    order: () => builder,
    limit(n: number) {
      limit = n;
      return builder;
    },
    gt(_column: string, value: string) {
      after = value;
      return builder;
    },
    then(
      resolve: (value: {
        data: MediaRow[];
        count: number | null;
        error: null;
      }) => unknown,
    ) {
      pages.push({ after, counted });
      const rest = media.filter((m) => after === null || m.id > after);
      const data = rest.slice(0, Math.min(limit, clamp));
      return Promise.resolve({
        data,
        count: counted ? media.length + countBias : null,
        error: null,
      }).then(resolve);
    },
  };
  return builder;
}

function singleRow(row: Record<string, unknown>) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => Promise.resolve({ data: row, error: null }),
  };
  return builder;
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) =>
      table === "media"
        ? mediaBuilder()
        : table === "events"
          ? singleRow({ host_id: "host-1" })
          : singleRow({ display_name: "Maya" }),
  }),
}));

const { getUploaderIdentities, IDENTITY_PAGE } =
  await import("@/lib/db/queries/guest-events-admin");

/** `n` rows, alternating a named guest and a host upload, with zero-padded sortable ids. */
function album(n: number): MediaRow[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `m${String(i).padStart(6, "0")}`,
    guest_id: i % 2 === 0 ? `g${i}` : null,
    guests:
      i % 2 === 0
        ? {
            user_id: null,
            email: null,
            display_name: `Guest ${i}`,
            verified_at: null,
            profiles: null,
          }
        : null,
  }));
}

beforeEach(() => {
  media = [];
  clamp = 1000;
  countBias = 0;
  pages.length = 0;
});

describe("getUploaderIdentities: every item, however big the album", () => {
  it("reads a small album in ONE counted round trip", async () => {
    media = album(12);
    const identities = await getUploaderIdentities("event-1");
    expect(identities.size).toBe(12);
    expect(pages).toEqual([{ after: null, counted: true }]);
  });

  it("walks keyset pages past the thousand-row clamp, and credits the last item too", async () => {
    media = album(2 * IDENTITY_PAGE + 500);
    const identities = await getUploaderIdentities("event-1");
    expect(identities.size).toBe(2500);
    // The cursor is the last id of the page before, never an offset.
    expect(pages.map((p) => p.after)).toEqual([
      null,
      media[IDENTITY_PAGE - 1].id,
      media[2 * IDENTITY_PAGE - 1].id,
    ]);
    // Only the first page pays for the count.
    expect(pages.map((p) => p.counted)).toEqual([true, false, false]);
    const last = media[media.length - 1];
    expect(identities.get(last.id)).toMatchObject({ isHost: true });
    expect(identities.get(media[2498].id)).toMatchObject({
      displayName: "Guest 2498",
      isVerified: false,
    });
  });

  it("keeps walking when PostgREST clamps a page shorter than asked (a short page is not the end)", async () => {
    clamp = 400;
    media = album(1000);
    const identities = await getUploaderIdentities("event-1");
    expect(identities.size).toBe(1000);
    expect(pages).toHaveLength(3);
  });

  it("stops on an empty page when the count promised more than exists", async () => {
    media = album(3);
    countBias = 5;
    const identities = await getUploaderIdentities("event-1");
    expect(identities.size).toBe(3);
    expect(pages.map((p) => p.after)).toEqual([null, media[2].id]);
  });
});
