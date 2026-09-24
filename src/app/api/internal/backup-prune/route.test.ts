/**
 * THE BACKUP-PRUNE CONFIRM (M17), on the clamping PostgREST fake: a full batch of MAX_ROWS ids is
 * checked in chunks inside the URL budget and answers the exact gone set; a batch past MAX_ROWS is
 * refused; and a chunk that fails fails the whole confirm (an id never asked about would otherwise
 * read as gone, and its backup copy as prunable).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAX_ROWS } from "@/lib/db/read-all";
import {
  asSupabase,
  createFakePostgrest,
  type FakePostgrest,
} from "@/lib/db/testing/fake-postgrest";

const state = vi.hoisted(() => ({ fake: null as FakePostgrest | null }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  env: {},
  serverEnv: {},
  assertPruneApiEnv: () => ({ PRUNE_API_SECRET: "prune-secret" }),
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/email/send", () => ({ sendOnce: vi.fn(async () => true) }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => asSupabase(state.fake!),
}));

const { POST } = await import("@/app/api/internal/backup-prune/route");

function uuid(n: number): string {
  return `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
}

function request(body: unknown): Request {
  return new Request("https://partyreel.test/api/internal/backup-prune", {
    method: "POST",
    headers: {
      authorization: "Bearer prune-secret",
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  // 5,000 media rows: ids 0..4,999 exist.
  state.fake = createFakePostgrest({
    tables: {
      media: Array.from({ length: 5_000 }, (_, i) => ({ id: uuid(i) })),
    },
  });
});

describe("POST /api/internal/backup-prune", () => {
  it("checks a full batch in chunks inside the URL budget and answers the exact gone set", async () => {
    // 1,000 ids: 700 still have a row, 300 are gone.
    const ids = [
      ...Array.from({ length: 700 }, (_, i) => uuid(i * 7)),
      ...Array.from({ length: 300 }, (_, i) => uuid(10_000 + i)),
    ];
    expect(ids).toHaveLength(MAX_ROWS);
    const response = await POST(
      request({ mediaIds: ids, objectsScanned: 1_000, mode: "dryrun" }),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      trip: boolean;
      goneIds: string[];
    };
    expect(body.trip).toBe(false);
    expect(body.goneIds.sort()).toEqual(ids.slice(700).sort());

    const reads = state.fake!.requests.filter(
      (r) => r.name === "media" && r.method === "GET",
    );
    expect(reads.length).toBeGreaterThan(5);
    expect(
      state.fake!.requests.every((r) => !r.failed && r.urlLength <= 8_000),
    ).toBe(true);
  });

  it("refuses a batch past MAX_ROWS", async () => {
    const ids = Array.from({ length: MAX_ROWS + 1 }, (_, i) => uuid(i));
    const response = await POST(
      request({ mediaIds: ids, objectsScanned: 1, mode: "dryrun" }),
    );
    expect(response.status).toBe(400);
  });

  it("fails the whole confirm when any chunk fails, never a partial gone set", async () => {
    // The media table is unreadable: every chunk errors, and the first stops the rest.
    delete (state.fake!.tables as Record<string, unknown>).media;
    const response = await POST(
      request({
        mediaIds: Array.from({ length: 400 }, (_, i) => uuid(i)),
        objectsScanned: 400,
        mode: "live",
      }),
    );
    expect(response.status).toBe(500);
  });

  it("refuses a caller without the bearer", async () => {
    const unauthorized = new Request(
      "https://partyreel.test/api/internal/backup-prune",
      {
        method: "POST",
        body: JSON.stringify({
          mediaIds: [uuid(1)],
          objectsScanned: 1,
          mode: "dryrun",
        }),
      },
    );
    expect((await POST(unauthorized)).status).toBe(401);
  });
});
