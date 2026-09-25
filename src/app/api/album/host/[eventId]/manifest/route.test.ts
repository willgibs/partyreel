import { beforeEach, describe, expect, it, vi } from "vitest";

/** The rest of a long host manifest: signed in, their own event, a cursor in and the next page out. */
vi.mock("server-only", () => ({}));

let user: { id: string } | null = { id: "host-1" };
const client = { auth: { getUser: async () => ({ data: { user } }) } };
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => client }));
const getEvent = vi.fn();
vi.mock("@/lib/db/queries/events", () => ({
  getEvent: (...a: unknown[]) => getEvent(...a),
}));
const readHostManifestPage = vi.fn();
vi.mock("@/lib/db/queries/album-host", () => ({
  readHostManifestPage: (...a: unknown[]) => readHostManifestPage(...a),
}));

const { POST } = await import("@/app/api/album/host/[eventId]/manifest/route");

const EVENT_ID = "e0000000-0000-4000-8000-000000000001";
const AFTER = [5, "00000000-0000-4000-8000-000000000001"];

function post(body: unknown) {
  return POST(
    new Request(`https://partyreel.com/api/album/host/${EVENT_ID}/manifest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ eventId: EVENT_ID }) },
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  user = { id: "host-1" };
  getEvent.mockResolvedValue({ id: EVENT_ID, name: "E" });
  readHostManifestPage.mockResolvedValue({ entries: [], next: null });
});

describe("a host manifest page", () => {
  it("reads on the host's own RLS client after the cursor", async () => {
    const body = await (await post({ after: AFTER })).json();
    expect(body).toEqual({
      ok: true,
      access: "full",
      gate: null,
      entries: [],
      next: null,
    });
    expect(readHostManifestPage).toHaveBeenCalledWith(
      client,
      EVENT_ID,
      AFTER,
      3000,
    );
  });

  it("401, 404 and a malformed cursor", async () => {
    expect((await post({ after: [1, "x"] })).status).toBe(400);
    getEvent.mockResolvedValue(null);
    expect((await post({ after: AFTER })).status).toBe(404);
    user = null;
    expect((await post({ after: AFTER })).status).toBe(401);
  });
});
