/**
 * HER UPLOADS, A PAGE AT A TIME (crumbs-38: "My uploads and My likes stop at 200 with an honest note"; "a cursor
 * and a load-more"). Pinned: a page asks one row past itself, so `next` is a cursor exactly when more exist and the
 * extra row is never shown; the cursor is the last SHOWN row's own `(created_at, id)`, its time passed back exactly
 * as the server wrote it; a page after a cursor names it to the function; her own events' uploads carry `isHost`
 * from the function's own arm flag.
 *
 * HER UPLOADS OFFER NO HEART WHERE A LIKE WOULD BE REFUSED (a ROADMAP carry-over from `crumbs-8`:
 * "her Uploads feed shows a heart on a private album's photo that now always refuses").
 *
 * `like_media` likes nothing on a private album but its host's, and a block reads its event as private
 * to the account it holds, so the feed asks each album her GUEST uploads sit in how it reads to her, and
 * marks those uploads `likeable: false`. Pinned: her own events are never asked (a host likes on her own
 * private album), each album is asked once however many uploads it holds, an open or password album
 * keeps its heart, and an album that cannot be read keeps its heart too (a courtesy, never a gate).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

type Row = {
  id: string;
  created_at: string;
  type: "photo" | "video";
  original_key: string;
  preview_key: string | null;
  event_name: string;
  event_date: string | null;
  event_qr_token: string;
  is_host_upload: boolean;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
};

let rows: Row[] = [];
/** What each call asked the function, in order. */
const calls: Record<string, unknown>[] = [];
const supabase = {
  rpc: async (name: string, args: Record<string, unknown>) => {
    expect(name).toBe("get_my_uploads");
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

/** How each album reads to her, by token; a token missing here fails its read. */
let reads: Record<string, "open" | "password" | "private"> = {};
const asked: string[] = [];
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: async (token: string) => {
    asked.push(token);
    const visibility = reads[token];
    if (!visibility) throw new Error("get_event_by_qr_token failed");
    return { ok: true, data: { id: `event-${token}`, visibility } };
  },
}));

const { getMyUploadCards, readMyUploadsPage, MY_FEED_PAGE } =
  await import("./my-uploads");

/** A PostgREST timestamp, microseconds and all: the cursor must hand it back exactly. */
const at = (i: number) =>
  `2026-09-${String(10 + (i % 18)).padStart(2, "0")}T12:00:00.${String(100000 + i).padStart(6, "0")}+00:00`;

function upload(id: string, token: string, hostArm = false): Row {
  return {
    id,
    created_at: at(Number(id.replace(/\D/g, "")) || 0),
    type: "photo",
    original_key: `key-${id}`,
    preview_key: null,
    event_name: `Album ${token}`,
    event_date: null,
    event_qr_token: token,
    is_host_upload: hostArm,
    width: 4,
    height: 5,
    duration_seconds: null,
  };
}

beforeEach(() => {
  rows = [];
  reads = {};
  asked.length = 0;
  calls.length = 0;
});

describe("her uploads, a page at a time", () => {
  it("asks one row past the page, and a page that is all of them has no next", async () => {
    rows = [upload("m1", "tok-open"), upload("m2", "tok-open")];
    reads = { "tok-open": "open" };
    const page = await getMyUploadCards();
    expect(calls).toEqual([{ p_limit: MY_FEED_PAGE + 1 }]);
    expect(page.items.map((i) => i.id)).toEqual(["m1", "m2"]);
    expect(page.next).toBeNull();
  });

  it("★ a full page shows 200, never the extra row, and hands on the last shown row's own cursor", async () => {
    rows = Array.from({ length: MY_FEED_PAGE + 1 }, (_, i) =>
      upload(`m${i}`, "tok-open"),
    );
    reads = { "tok-open": "open" };
    const page = await getMyUploadCards();
    expect(page.items).toHaveLength(MY_FEED_PAGE);
    expect(page.items.map((i) => i.id)).not.toContain(`m${MY_FEED_PAGE}`);
    const last = rows[MY_FEED_PAGE - 1];
    // The time exactly as the server wrote it, microseconds and offset: a Date would round it to milliseconds and
    // the next page would skip or repeat the rows inside that millisecond.
    expect(page.next).toEqual({ at: last.created_at, id: last.id });
  });

  it("names the cursor to the function for the page after it", async () => {
    rows = [upload("m9", "tok-open")];
    reads = { "tok-open": "open" };
    const { getRequestAuth } = await import("@/lib/supabase/request-auth");
    const before = { at: at(8), id: "00000000-0000-4000-8000-000000000008" };
    const page = await readMyUploadsPage(await getRequestAuth(), before);
    expect(calls).toEqual([
      {
        p_limit: MY_FEED_PAGE + 1,
        p_before_created_at: before.at,
        p_before_id: before.id,
      },
    ]);
    expect(page.items.map((i) => i.id)).toEqual(["m9"]);
  });

  it("marks her own events' uploads from the function's arm flag, the guest arm's never", async () => {
    rows = [upload("h1", "tok-mine", true), upload("m1", "tok-open")];
    reads = { "tok-open": "open" };
    const { items } = await getMyUploadCards();
    expect(items.map((i) => [i.id, i.isHost])).toEqual([
      ["h1", true],
      ["m1", undefined],
    ]);
  });

  it("reads nothing signed out", async () => {
    const page = await readMyUploadsPage(
      { user: null, supabase: supabase as never },
      null,
    );
    expect(page).toEqual({ items: [], next: null });
    expect(calls).toEqual([]);
  });
});

describe("her uploads, and where a heart is offered", () => {
  it("★ marks the uploads on an album that reads private to her, and only those", async () => {
    rows = [
      upload("m1", "tok-private"),
      upload("m2", "tok-private"),
      upload("m3", "tok-open"),
      upload("m4", "tok-password"),
      // A block reads its event as private to the account it holds: the same answer.
      upload("m5", "tok-blocked"),
    ];
    reads = {
      "tok-private": "private",
      "tok-open": "open",
      "tok-password": "password",
      "tok-blocked": "private",
    };
    const { items } = await getMyUploadCards();
    const likeable = Object.fromEntries(items.map((i) => [i.id, i.likeable]));
    expect(likeable).toEqual({
      m1: false,
      m2: false,
      m3: undefined,
      m4: undefined,
      m5: false,
    });
    // One read an album, however many of her uploads it holds.
    expect([...asked].sort()).toEqual([
      "tok-blocked",
      "tok-open",
      "tok-password",
      "tok-private",
    ]);
  });

  it("never asks about her own events: a host likes on her own private album", async () => {
    rows = [upload("h1", "tok-mine", true), upload("h2", "tok-mine", true)];
    reads = { "tok-mine": "private" };
    const { items } = await getMyUploadCards();
    expect(asked).toEqual([]);
    expect(items.map((i) => i.likeable)).toEqual([undefined, undefined]);
  });

  it("keeps the heart where an album cannot be read: a courtesy, never a gate", async () => {
    rows = [upload("m1", "tok-unreadable"), upload("m2", "tok-private")];
    reads = { "tok-private": "private" };
    const { items } = await getMyUploadCards();
    expect(items.map((i) => [i.id, i.likeable])).toEqual([
      ["m1", undefined],
      ["m2", false],
    ]);
  });

  it("asks a few albums at a time, and every one of them, across a wide feed", async () => {
    rows = Array.from({ length: 40 }, (_, i) => upload(`m${i}`, `tok-${i}`));
    reads = Object.fromEntries(
      rows.map((r, i) => [
        r.event_qr_token,
        i % 2 === 0 ? ("private" as const) : ("open" as const),
      ]),
    );
    const { items } = await getMyUploadCards();
    expect(asked).toHaveLength(40);
    expect(items.filter((i) => i.likeable === false)).toHaveLength(20);
  });
});
