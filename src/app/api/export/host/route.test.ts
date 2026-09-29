/**
 * THE HOST'S DOWNLOAD ALL SEES THE WHOLE ALBUM (C5, the 1,000-row round, 2026-09-23).
 *
 * The route builds its summary and its zip manifest from `listEventMedia`. Read through one PostgREST
 * request, a 2,500-item album arrived as its newest 1,000: the summary under-counted, and the
 * manifest's 2,000-item cap (MAX_EXPORT_ITEMS, a 413) could never fire, so the zip silently left out
 * the oldest 1,500. On the clamping fake (`src/lib/db/testing/fake-postgrest.ts`), which cuts an
 * unpaged read at 1,000 exactly as the platform does, the album now arrives whole and the cap fires
 * past 2,000.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { verifyExportToken } from "@/lib/export/export-token";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

const SECRET = "test-export-signing-secret";
let fake: FakePostgrest;

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => asSupabase(fake),
}));
vi.mock("@/lib/supabase/request-auth", () => ({
  getRequestAuth: async () => ({ supabase: asSupabase(fake), user: fake.user }),
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));
vi.mock("@/lib/env", () => ({
  assertExportEnv: () => ({
    EXPORT_SIGNING_SECRET: SECRET,
    EXPORT_WORKER_URL: "https://export.example",
  }),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureWarning: () => {},
  captureError: () => {},
}));
vi.mock("@/lib/security/abuse-rate-limit-store", () => ({
  abuseHashes: () => ({ ipHash: "ip", scopeHash: "scope" }),
  checkAbuseRate: async () => ({ allowed: true }),
  recordAbuseEvent: async () => {},
}));

const { POST } = await import("./route");

const EVENT_ID = "00000000-0000-4000-8000-00000000e000";
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const at = (i: number) =>
  `2026-09-23T${String(Math.floor(i / 3600) % 24).padStart(2, "0")}:${String(Math.floor(i / 60) % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000000+00:00`;

/** `approved` approved photos, then `hidden` hidden and `pending` pending, and 40 in the bin. */
function album(approved: number, hidden = 0, pending = 0): FakeRow[] {
  const statuses = [
    ...Array<string>(approved).fill("approved"),
    ...Array<string>(hidden).fill("hidden"),
    ...Array<string>(pending).fill("pending"),
    ...Array<string>(40).fill("removed"),
  ];
  return statuses.map((status, i) => ({
    id: uuid(i),
    event_id: EVENT_ID,
    type: "photo",
    status,
    original_key: `events/${EVENT_ID}/photo/${uuid(i)}/original.jpg`,
    preview_key: null,
    file_size_bytes: 1000,
    created_at: at(i),
  }));
}

function useAlbum(rows: FakeRow[]) {
  fake = createFakePostgrest({
    user: { id: "host-1" },
    tables: {
      events: [{ id: EVENT_ID, name: "Garden party", host_id: "host-1" }],
      media: rows,
      ops_flags: [{ key: "export_enabled", enabled: true }],
      export_log: [],
    },
  });
}

async function post(body: Record<string, unknown>) {
  const res = await POST(
    new Request("https://partyreel.test/api/export/host", {
      method: "POST",
      body: JSON.stringify({ event_id: EVENT_ID, ...body }),
    }),
  );
  return { status: res.status, body: await res.json() };
}

beforeEach(() => {
  useAlbum(album(2300, 100, 100));
});

describe("the host export reads the whole album", () => {
  it("summarizes all 2,500 live items, where one read would have counted 1,000", async () => {
    const { status, body } = await post({ step: "summary" });
    expect(status).toBe(200);
    expect(body.summary.shown.photo).toEqual({ count: 2300, bytes: 2_300_000 });
    expect(body.summary.hidden.photo).toEqual({ count: 200, bytes: 200_000 });
    const pages = fake.requests.filter((r) => r.name === "media");
    expect(pages.every((r) => !r.failed && r.limit === 1000)).toBe(true);
  });

  it("refuses a 2,300-photo album with the cap's 413", async () => {
    const { status, body } = await post({ step: "mint" });
    expect(status).toBe(413);
    expect(body.code).toBe("over_cap");
    expect(fake.tables.export_log.at(-1)).toMatchObject({
      outcome: "rejected_cap",
    });
  });

  it("mints a 1,999-photo album whole, every item in the signed manifest", async () => {
    useAlbum(album(1999));
    const { status, body } = await post({ step: "mint" });
    expect(status).toBe(200);
    const verified = verifyExportToken(SECRET, body.token, Date.now());
    expect(verified.ok).toBe(true);
    if (verified.ok) expect(verified.payload.items).toHaveLength(1999);
    expect(fake.tables.export_log.at(-1)).toMatchObject({
      outcome: "minted",
      item_count: 1999,
    });
  });

  it("narrows a Download selected to its ids, the oldest photographs included", async () => {
    // The selection reaches past the newest 1,000: its items are among the album's oldest.
    const selected = Array.from({ length: 1500 }, (_, i) => uuid(1000 + i));
    const { status, body } = await post({ step: "mint", ids: selected });
    expect(status).toBe(200);
    const verified = verifyExportToken(SECRET, body.token, Date.now());
    expect(verified.ok && verified.payload.items).toHaveLength(1300);
    // 1,300 of the selection are approved; the other 200 (hidden and held) need Include hidden.
    const withHidden = await post({
      step: "mint",
      ids: selected,
      include_hidden: true,
    });
    const all = verifyExportToken(SECRET, withHidden.body.token, Date.now());
    expect(all.ok && all.payload.items).toHaveLength(1500);
  });

  it("refuses a selection past the cap in the bulk verbs' words, before reading anything", async () => {
    const tooMany = Array.from({ length: 2001 }, (_, i) => uuid(i));
    const { status, body } = await post({ step: "mint", ids: tooMany });
    expect(status).toBe(400);
    expect(body).toEqual({
      ok: false,
      code: "bad_request",
      message: "Select up to 2,000 items at a time.",
    });
    expect(fake.requests).toHaveLength(0);
    // Any other malformed body stays a bare bad_request.
    const other = await post({ step: "mint", ids: ["not-a-uuid"] });
    expect(other.body).toEqual({ ok: false, code: "bad_request" });
  });
});

/**
 * THE WALK, OVER THE HOST'S WHOLE ALBUM (`export-flow` r1, `cap=split`). A client that sends `part`
 * takes a 2,300-photo album in two parts, oldest first, every item in exactly one; the response says
 * where the Worker's check lives and what the part holds, so the client can read the check against it.
 */
describe("the host's walk", () => {
  it("takes 2,300 photographs as 2,000 then 300, every one once, with plain part names", async () => {
    useAlbum(album(2300));
    const first = await post({ step: "mint", part: 1 });
    expect(first.status).toBe(200);
    expect(first.body).toMatchObject({
      ok: true,
      part: 1,
      parts: 2,
      items: 2000,
      bytes: 2_000_000,
      workerUrl: "https://export.example",
      checkUrl: "https://export.example/check",
    });
    const one = verifyExportToken(SECRET, first.body.token, Date.now());
    if (!one.ok) throw new Error(one.reason);
    expect(one.payload.zipName).toBe("garden-party-part-1-of-2.zip");

    const second = await post({
      step: "mint",
      part: 2,
      after: first.body.next,
    });
    expect(second.body).toMatchObject({
      part: 2,
      parts: 2,
      items: 300,
      next: null,
    });
    const two = verifyExportToken(SECRET, second.body.token, Date.now());
    if (!two.ok) throw new Error(two.reason);
    expect(two.payload.zipName).toBe("garden-party-part-2-of-2.zip");

    const keys = [...one.payload.items, ...two.payload.items].map((i) => i.key);
    expect(new Set(keys).size).toBe(2300);
    // Oldest first: the album's first photograph opens part 1, its last closes part 2.
    expect(keys[0]).toContain(uuid(0));
    expect(keys.at(-1)).toContain(uuid(2299));
    expect(
      fake.tables.export_log.slice(-2).map((r) => [r.outcome, r.item_count]),
    ).toEqual([
      ["minted", 2000],
      ["minted", 300],
    ]);
  });

  it("signs the same v1 payload it always did, so partyreel.com's Worker streams a part too", async () => {
    useAlbum(album(2300));
    const { body } = await post({ step: "mint", part: 1 });
    const verified = verifyExportToken(SECRET, body.token, Date.now());
    if (!verified.ok) throw new Error(verified.reason);
    // Exactly milestone 29's keys, in its order: nothing a walk adds rides in the token.
    expect(Object.keys(verified.payload)).toEqual([
      "v",
      "jti",
      "scope",
      "eventId",
      "zipName",
      "items",
      "exp",
    ]);
    expect(verified.payload.v).toBe(1);
  });

  it("a selection past 20 GB is walked by its bytes", async () => {
    const rows = album(30);
    useAlbum(rows.map((r) => ({ ...r, file_size_bytes: 1.5 * 1024 ** 3 })));
    const ids = rows.slice(0, 30).map((r) => String(r.id));
    const { body } = await post({
      step: "mint",
      ids,
      include_hidden: true,
      part: 1,
    });
    // 30 live items at 1.5 GB: 13 fit under 20 GB (the 40 in the bin were never selectable).
    expect(body).toMatchObject({ part: 1, parts: 3, items: 13 });
  });

  it("an empty zip is refused in the one line", async () => {
    useAlbum(album(0));
    const { status, body } = await post({ step: "mint", part: 1 });
    expect(status).toBe(400);
    expect(body).toEqual({
      ok: false,
      code: "empty",
      message: "Nothing left to download.",
    });
  });

  it("refuses a position with no part to put it in, before reading anything", async () => {
    const { status } = await post({
      step: "mint",
      after: `1727130818122_${uuid(3)}`,
    });
    expect(status).toBe(400);
    expect(fake.requests).toHaveLength(0);
  });
});
