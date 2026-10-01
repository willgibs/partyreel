/**
 * HER LIKES, A PAGE AT A TIME (crumbs-38: "My uploads and My likes stop at 200 with an honest note"; "a cursor and a
 * load-more"). The rules are her uploads' (`my-uploads.test.ts`); pinned here on the likes' own keyset: the cursor is
 * the last shown like's `(liked_at, media id)`, never the media's own upload time, named to the function as
 * `p_before_liked_at` and `p_before_id`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Row = {
  id: string;
  liked_at: string;
  type: "photo" | "video";
  original_key: string;
  preview_key: string | null;
  event_id: string;
  event_name: string;
  event_date: string | null;
  event_qr_token: string;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
};

let rows: Row[] = [];
const calls: Record<string, unknown>[] = [];
const supabase = {
  rpc: async (name: string, args: Record<string, unknown>) => {
    expect(name).toBe("get_my_likes");
    calls.push(args);
    return { data: rows, error: null };
  },
};
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ user: { id: "her" }, supabase }),
}));
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async ({ key }: { key: string }) => `signed:${key}`,
}));
// The uploads module's own reads are never reached from the likes feed; stub the ones it imports.
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: async () => {
    throw new Error("the likes feed asks no album");
  },
}));
vi.mock("@/lib/media/uploader-faces", () => ({
  ownUploadCredit: async () => {
    throw new Error("the likes feed reads no face");
  },
}));

const { getMyLikeCards, readMyLikesPage } = await import("./my-likes");
const { MY_FEED_PAGE } = await import("./my-uploads");

const likedAt = (i: number) =>
  `2026-09-20T08:${String(i % 60).padStart(2, "0")}:00.${String(500000 + i).padStart(6, "0")}+00:00`;

function like(i: number): Row {
  return {
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    liked_at: likedAt(i),
    type: "photo",
    original_key: `key-${i}`,
    preview_key: null,
    event_id: "ev-1",
    event_name: "Album",
    event_date: null,
    event_qr_token: "tok",
    width: 4,
    height: 5,
    duration_seconds: null,
  };
}

beforeEach(() => {
  rows = [];
  calls.length = 0;
});

describe("her likes, a page at a time", () => {
  it("asks one past the page; a page that is all of them has no next", async () => {
    rows = [like(1), like(2)];
    const page = await getMyLikeCards();
    expect(calls).toEqual([{ p_limit: MY_FEED_PAGE + 1 }]);
    expect(page.items).toHaveLength(2);
    expect(page.next).toBeNull();
  });

  it("★ hands on the last shown like's (liked_at, media id), and never shows the extra row", async () => {
    rows = Array.from({ length: MY_FEED_PAGE + 1 }, (_, i) => like(i));
    const page = await getMyLikeCards();
    expect(page.items).toHaveLength(MY_FEED_PAGE);
    expect(page.next).toEqual({
      at: rows[MY_FEED_PAGE - 1].liked_at,
      id: rows[MY_FEED_PAGE - 1].id,
    });
  });

  it("names the cursor as the likes' own arguments", async () => {
    rows = [like(7)];
    const before = { at: likedAt(8), id: like(8).id };
    await readMyLikesPage(
      { user: { id: "her" } as never, supabase } as never,
      before,
    );
    expect(calls).toEqual([
      {
        p_limit: MY_FEED_PAGE + 1,
        p_before_liked_at: before.at,
        p_before_id: before.id,
      },
    ]);
  });

  it("reads nothing signed out", async () => {
    const page = await readMyLikesPage({ user: null, supabase } as never, null);
    expect(page).toEqual({ items: [], next: null });
    expect(calls).toEqual([]);
  });
});
