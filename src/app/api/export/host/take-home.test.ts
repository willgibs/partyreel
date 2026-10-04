/**
 * THE HOST'S TWO SETS (take-home r1, `host=two`): Originals to keep, Phone size to post tonight, each pictured by
 * the album with its size. The REAL route runs on the clamping fake; R2's presigner is stood in (a link is its
 * key, so a test reads which copy it names).
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
vi.mock("@/lib/r2/presign", () => ({
  presignDownload: async (p: {
    key: string;
    downloadFilename?: string;
    stable?: boolean;
  }) =>
    `https://r2.example/${p.key}${p.downloadFilename ? `?name=${p.downloadFilename}` : ""}${p.stable ? "&stable" : ""}`,
}));

const { POST } = await import("./route");

const EVENT_ID = "00000000-0000-4000-8000-00000000e000";
const uuid = (i: number) =>
  `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`;
const at = (i: number) =>
  `2026-09-23T10:${String(Math.floor(i / 60) % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.000000+00:00`;
const MB = 1024 * 1024;

/**
 * Maya's album in miniature: 10 photographs, 8 with their phone-size copy and 2 from before it (none), 2 clips,
 * 1 hidden photograph with a copy, and 1 in the bin.
 */
function album(): FakeRow[] {
  const rows: FakeRow[] = [];
  const add = (i: number, over: Partial<FakeRow>) =>
    rows.push({
      id: uuid(i),
      event_id: EVENT_ID,
      type: "photo",
      status: "approved",
      original_key: `events/${EVENT_ID}/photo/${uuid(i)}/original.jpg`,
      preview_key: `events/${EVENT_ID}/photo/${uuid(i)}/preview.webp`,
      phone_key: `events/${EVENT_ID}/photo/${uuid(i)}/phone.jpg`,
      phone_bytes: Math.round(0.55 * MB),
      file_size_bytes: Math.round(2.9 * MB),
      created_at: at(i),
      ...over,
    });
  for (let i = 0; i < 8; i++) add(i, {});
  for (let i = 8; i < 10; i++) add(i, { phone_key: null, phone_bytes: null });
  for (let i = 10; i < 12; i++)
    add(i, {
      type: "video",
      original_key: `events/${EVENT_ID}/video/${uuid(i)}/original.mp4`,
      preview_key: null,
      phone_key: null,
      phone_bytes: null,
      file_size_bytes: 22 * MB,
    });
  add(12, { status: "hidden" });
  add(13, { status: "removed" });
  return rows;
}

function useAlbum(rows: FakeRow[], owner = "host-1") {
  fake = createFakePostgrest({
    user: { id: owner },
    tables: {
      events: [{ id: EVENT_ID, name: "Maya & Jay", host_id: "host-1" }],
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

beforeEach(() => useAlbum(album()));

describe("the panel's sizes and pictures", () => {
  it("says every set at phone size too: a copy where there is one, the original where not, a clip as taken", async () => {
    const { status, body } = await post({ step: "summary" });
    expect(status).toBe(200);
    expect(body.summary.shown.photo).toEqual({
      count: 10,
      bytes: 10 * Math.round(2.9 * MB),
      phone: 8 * Math.round(0.55 * MB) + 2 * Math.round(2.9 * MB),
    });
    expect(body.summary.shown.video).toEqual({
      count: 2,
      bytes: 44 * MB,
      phone: 44 * MB,
    });
    expect(body.summary.hidden.photo).toEqual({
      count: 1,
      bytes: Math.round(2.9 * MB),
      phone: Math.round(0.55 * MB),
    });
  });

  it("pictures the sets by the album's newest shown photographs' tiles, six at most, never a clip or a hidden one", async () => {
    const { body } = await post({ step: "summary" });
    expect(body.pictures).toHaveLength(6);
    expect(body.pictures[0]).toBe(
      `https://r2.example/events/${EVENT_ID}/photo/${uuid(9)}/preview.webp&stable`,
    );
    for (const url of body.pictures as string[]) {
      expect(url).not.toContain(uuid(12));
      expect(url).not.toContain("/video/");
    }
  });
});

describe("Phone size at a desk: a zip of the copies", () => {
  it("signs the photographs' copies (their originals where they have none), named for phone size", async () => {
    const { status, body } = await post({
      step: "mint",
      types: "photo",
      size: "phone",
    });
    expect(status).toBe(200);
    const verified = verifyExportToken(SECRET, body.token, Date.now());
    expect(verified.ok).toBe(true);
    if (!verified.ok) return;
    const keys = verified.payload.items.map((i) => i.key);
    expect(keys).toHaveLength(10);
    expect(keys.filter((k) => k.endsWith("/phone.jpg"))).toHaveLength(8);
    expect(keys.filter((k) => k.endsWith("/original.jpg"))).toHaveLength(2);
    expect(verified.payload.zipName).toBe("maya-jay-phone-size.zip");
    expect(body.bytes).toBe(
      8 * Math.round(0.55 * MB) + 2 * Math.round(2.9 * MB),
    );
  });

  it("an originals zip is exactly what it was", async () => {
    const { body } = await post({ step: "mint", types: "all" });
    const verified = verifyExportToken(SECRET, body.token, Date.now());
    if (!verified.ok) throw new Error("no token");
    expect(
      verified.payload.items.every((i) => /\/original\.(jpg|mp4)$/.test(i.key)),
    ).toBe(true);
    expect(verified.payload.zipName).toBe("maya-jay.zip");
  });
});

describe("Phone size in a hand: the links a Save fills its sheets from", () => {
  it("answers each shown photograph at phone size, oldest first, with its name and its bytes", async () => {
    const { status, body } = await post({
      step: "save",
      types: "photo",
      size: "phone",
    });
    expect(status).toBe(200);
    expect(body.more).toBe(false);
    expect(body.items).toHaveLength(10);
    expect(body.items[0]).toEqual({
      id: uuid(0),
      type: "photo",
      url: `https://r2.example/events/${EVENT_ID}/photo/${uuid(0)}/phone.jpg?name=maya-jay-00000000.jpg`,
      name: "maya-jay-00000000.jpg",
      bytes: Math.round(0.55 * MB),
    });
    expect(body.items[9].url).toContain(`${uuid(9)}/original.jpg`);
    expect(body.items[9].bytes).toBe(Math.round(2.9 * MB));
  });

  it("takes the hidden ones only when she asks, and never the bin", async () => {
    const shown = await post({ step: "save", types: "photo", size: "phone" });
    const all = await post({
      step: "save",
      types: "photo",
      size: "phone",
      include_hidden: true,
    });
    expect(shown.body.items.map((i: { id: string }) => i.id)).not.toContain(
      uuid(12),
    );
    expect(all.body.items.map((i: { id: string }) => i.id)).toContain(uuid(12));
    expect(all.body.items.map((i: { id: string }) => i.id)).not.toContain(
      uuid(13),
    );
  });

  it("is her own event's alone", async () => {
    useAlbum(album(), "someone-else");
    const { status } = await post({
      step: "save",
      types: "photo",
      size: "phone",
    });
    expect(status).toBe(403);
  });

  it("says when a set runs past one Save, and answers its first 2,000", async () => {
    const many: FakeRow[] = Array.from({ length: 2_050 }, (_, i) => ({
      id: uuid(i),
      event_id: EVENT_ID,
      type: "photo",
      status: "approved",
      original_key: `events/${EVENT_ID}/photo/${uuid(i)}/original.jpg`,
      preview_key: null,
      file_size_bytes: 1000,
      created_at: at(i),
    }));
    useAlbum(many);
    const { body } = await post({
      step: "save",
      types: "photo",
      size: "phone",
    });
    expect(body.items).toHaveLength(2_000);
    expect(body.more).toBe(true);
  });
});
