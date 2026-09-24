/**
 * THE GUEST'S "DOWNLOAD ALL", MEASURED WHOLE (the 1,000-row round, C11).
 *
 * The export's byte sizes are the 20 GB ceiling's only input, and the album is read whole now (C7),
 * so the size read has to reach every item. It was one `.in("id", ids)` over the whole album: every
 * id in a single URL, which fails outright past about 200 ids, and `sizeById.get(id) ?? 0` would
 * have under-counted the ceiling for any id it missed. These run the route on the fake PostgREST
 * (which fails a URL past 8,000 characters, as postgrest-js does) with albums past 2,000 items:
 * every size is read, in chunks whose URLs stay under the limit, and an unmeasured row is never
 * counted as zero bytes.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { summarizeMedia } from "@/lib/export/build-manifest";
import { IN_CHUNK } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
  type FakeRow,
} from "@/lib/db/testing/fake-postgrest";

vi.mock("server-only", () => ({}));

const getEventByQrToken = vi.fn();
vi.mock("@/lib/db/queries/guest-events", () => ({
  getEventByQrToken: (...a: unknown[]) => getEventByQrToken(...a),
}));
const resolveViewerDecision = vi.fn();
const loadGalleryRowsForAccess = vi.fn();
vi.mock("@/lib/events/gallery-access.server", () => ({
  resolveViewerDecision: (...a: unknown[]) => resolveViewerDecision(...a),
  isEventOwner: vi.fn().mockResolvedValue(false),
  loadGalleryRowsForAccess: (...a: unknown[]) => loadGalleryRowsForAccess(...a),
}));
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: vi.fn().mockResolvedValue(true),
}));
vi.mock("@/lib/guest/session-cookie", () => ({
  readGuestSessionCookie: vi.fn().mockResolvedValue(null),
}));
vi.mock("@/lib/demo", () => ({ isDemoToken: () => false }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) },
  }),
}));
const mintExport = vi.fn();
vi.mock("@/lib/export/export-service", () => ({
  exportSummary: (rows: Parameters<typeof summarizeMedia>[0]) =>
    summarizeMedia(rows),
  mintExport: (...a: unknown[]) => mintExport(...a),
  mintResponse: () =>
    new Response(JSON.stringify({ ok: true }), { status: 200 }),
}));

/** The fake the admin client answers from; each test seeds its own. */
let fake: FakePostgrest;
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(fake),
}));

const { POST } = await import("@/app/api/export/guest/route");

const QR = "d02631f1bfb3455188d224e41bf9510f";

function uid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

/** `n` approved items: the gallery rows the loader hands the route, and the media table's sizes. */
function album(n: number) {
  const rows = Array.from({ length: n }, (_, i) => ({
    id: uid(i + 1),
    type: i % 10 === 0 ? ("video" as const) : ("photo" as const),
    original_key: `events/probe/photo/${i}/original.jpg`,
    preview_key: null,
    width: 320,
    height: 240,
    duration_seconds: null,
    created_at: "2026-09-23T23:13:38.122749+00:00",
  }));
  const media: FakeRow[] = rows.map((r, i) => ({
    id: r.id,
    file_size_bytes: 1000 + i,
  }));
  return { rows, media };
}

function post(body: unknown) {
  return POST(
    new Request("https://partyreel.com/api/export/guest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

function galleryOf(rows: ReturnType<typeof album>["rows"]) {
  return {
    rows,
    identities: undefined,
    teaserTotal: null,
    approvedTotal: rows.length,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  getEventByQrToken.mockResolvedValue({
    ok: true,
    data: {
      id: "evt-1",
      visibility: "open",
      qr_token: QR,
      name: "Scale probe",
    },
  });
  resolveViewerDecision.mockResolvedValue({ access: "full", gate: null });
});

describe("the size read reaches every item (C11)", () => {
  it("the old shape fails outright: every id of a 2,300-item album in one URL", async () => {
    const { rows, media } = album(2300);
    fake = createFakePostgrest({ tables: { media } });
    const { data, error } = await fake
      .from("media")
      .select("id, file_size_bytes")
      .in(
        "id",
        rows.map((r) => r.id),
      );
    expect(data).toBeNull();
    expect(error?.message).toBe("TypeError: fetch failed");
  });

  it("measures all 2,300 items, in chunks whose URLs stay under the limit", async () => {
    const { rows, media } = album(2300);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    const res = await post({ step: "summary", qr_token: QR });
    const body = (await res.json()) as {
      ok: boolean;
      summary: ReturnType<typeof summarizeMedia>;
    };

    const bytes = media.reduce((sum, m) => sum + Number(m.file_size_bytes), 0);
    const { photo, video } = body.summary.shown;
    expect(photo.count + video.count).toBe(2300);
    expect(photo.bytes + video.bytes).toBe(bytes);
    expect(video.count).toBe(230);
    // Ceil(2,300 / 150) requests, each at most IN_CHUNK ids and under the URL limit, none failed.
    expect(fake.requests).toHaveLength(Math.ceil(2300 / IN_CHUNK));
    for (const request of fake.requests) {
      const ids = request.filters.find((f) => f.op === "in")?.value as string[];
      expect(ids.length).toBeLessThanOrEqual(IN_CHUNK);
      expect(request.urlLength).toBeLessThan(8000);
      expect(request.failed).toBe(false);
    }
  });

  it("mints over the whole album too, never a clipped one", async () => {
    const { rows, media } = album(2100);
    fake = createFakePostgrest({ tables: { media } });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));
    mintExport.mockResolvedValue({ ok: true, token: "t", workerUrl: "w" });

    await post({ step: "mint", qr_token: QR });

    const input = mintExport.mock.calls[0][0] as {
      rows: { file_size_bytes: number; status: string }[];
    };
    expect(input.rows).toHaveLength(2100);
    expect(input.rows.every((r) => r.status === "approved")).toBe(true);
    expect(input.rows.at(-1)?.file_size_bytes).toBe(1000 + 2099);
  });

  it("an item whose size cannot be read is left out, never counted as zero bytes", async () => {
    const { rows, media } = album(1200);
    // One row vanished between the album read and the size read (a purge racing the request).
    fake = createFakePostgrest({
      tables: { media: media.filter((m) => m.id !== uid(1111)) },
    });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    const res = await post({ step: "summary", qr_token: QR });
    const { summary } = (await res.json()) as {
      summary: ReturnType<typeof summarizeMedia>;
    };

    expect(summary.shown.photo.count + summary.shown.video.count).toBe(1199);
  });

  it("a failed chunk aborts the export rather than approving an unmeasured album", async () => {
    const { rows } = album(400);
    // No media table at all: every chunk answers an error.
    fake = createFakePostgrest({ tables: {} });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    await expect(post({ step: "summary", qr_token: QR })).rejects.toThrow(
      "export/guest: media sizes",
    );
  });

  it("the teaser measures its nine in one request", async () => {
    const { rows, media } = album(9);
    fake = createFakePostgrest({ tables: { media } });
    resolveViewerDecision.mockResolvedValue({
      access: "teaser",
      gate: "account",
    });
    loadGalleryRowsForAccess.mockResolvedValue(galleryOf(rows));

    const res = await post({ step: "summary", qr_token: QR });
    const { summary } = (await res.json()) as {
      summary: ReturnType<typeof summarizeMedia>;
    };

    expect(summary.shown.photo.count + summary.shown.video.count).toBe(9);
    expect(fake.requests).toHaveLength(1);
  });

  it("a locked album is refused before anything is read", async () => {
    fake = createFakePostgrest({ tables: { media: [] } });
    resolveViewerDecision.mockResolvedValue({
      access: "none",
      gate: "password",
    });

    const res = await post({ step: "summary", qr_token: QR });

    expect(res.status).toBe(403);
    expect(loadGalleryRowsForAccess).not.toHaveBeenCalled();
    expect(fake.requests).toHaveLength(0);
  });
});
