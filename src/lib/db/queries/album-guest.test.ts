import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE GUEST READS CARRY THEIR OWN GATE: an open album reads, a password album reads only with its
 * signed unlock cookie, and a private one never, whatever a caller hands in. The service role is never
 * even asked past the gate.
 */
vi.mock("server-only", () => ({}));

const isUnlocked = vi.fn();
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: (...a: unknown[]) => isUnlocked(...a),
}));
const readAlbumVersions = vi.fn();
const readAlbumChanges = vi.fn();
const readAlbumAttribution = vi.fn();
vi.mock("@/lib/db/queries/album-state", () => ({
  readAlbumVersions: (...a: unknown[]) => readAlbumVersions(...a),
  readAlbumChanges: (...a: unknown[]) => readAlbumChanges(...a),
  readAlbumAttribution: (...a: unknown[]) => readAlbumAttribution(...a),
}));
const createAdminClient = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => createAdminClient(),
}));
// The album's keyset helpers, without the module's own server client (and its env) behind them.
vi.mock("@/lib/db/queries/guest-events", () => ({
  albumCursorOf: (row: { created_at: string; id: string }) => ({
    at: row.created_at,
    id: row.id,
  }),
  olderThan: (after: { at: string; id: string }) =>
    `created_at.lt.${after.at},and(created_at.eq.${after.at},id.lt.${after.id})`,
}));

const guest = await import("@/lib/db/queries/album-guest");

const OPEN = { id: "e-open", visibility: "open" as const };
const PASSWORD = { id: "e-pw", visibility: "password" as const };
const PRIVATE = { id: "e-priv", visibility: "private" as const };
const IDS = ["00000000-0000-4000-8000-000000000001"];

/** A PostgREST builder that answers every chain with an empty page. */
function emptyAdmin() {
  const builder: Record<string, unknown> = {};
  for (const m of ["select", "eq", "in", "order", "limit", "or", "neq"]) {
    builder[m] = () => builder;
  }
  builder.then = (resolve: (v: unknown) => void) =>
    resolve({ data: [], error: null });
  return { from: () => builder };
}

beforeEach(() => {
  vi.clearAllMocks();
  isUnlocked.mockResolvedValue(false);
  readAlbumVersions.mockResolvedValue({
    version: 1,
    albumMax: 1,
    attrVersion: 0,
  });
  readAlbumChanges.mockResolvedValue({
    version: 1,
    albumMax: 1,
    attrVersion: 0,
    approved: 0,
    hidden: null,
    pending: null,
    changes: [],
  });
  readAlbumAttribution.mockResolvedValue(new Map());
  createAdminClient.mockReturnValue(emptyAdmin());
});

const calls = () =>
  readAlbumVersions.mock.calls.length +
  readAlbumChanges.mock.calls.length +
  readAlbumAttribution.mock.calls.length +
  createAdminClient.mock.calls.length;

describe("every guest read carries the gate", () => {
  it("a password album WITHOUT its cookie reads nothing, through any of the five", async () => {
    expect(await guest.readGuestAlbumVersions(PASSWORD)).toBeNull();
    expect(await guest.readGuestAlbum(PASSWORD, 0, 10)).toBeNull();
    expect(await guest.readGuestManifestPage(PASSWORD, null, 10)).toBeNull();
    expect(
      await guest.readGuestAlbumMedia(PASSWORD, IDS, { attribute: true }),
    ).toBeNull();
    expect(await guest.readGuestAttribution(PASSWORD, IDS)).toBeNull();
    expect(calls()).toBe(0);
    expect(isUnlocked).toHaveBeenCalledWith("e-pw");
  });

  it("a private album reads nothing, and never asks for a cookie", async () => {
    expect(await guest.readGuestAlbum(PRIVATE, 0, 10)).toBeNull();
    expect(
      await guest.readGuestAlbumMedia(PRIVATE, IDS, { attribute: true }),
    ).toBeNull();
    expect(calls()).toBe(0);
    expect(isUnlocked).not.toHaveBeenCalled();
  });

  it("a password album WITH its cookie reads, and so does an open one", async () => {
    isUnlocked.mockResolvedValue(true);
    expect(await guest.readGuestAlbum(PASSWORD, 3, 501)).not.toBeNull();
    expect(readAlbumChanges).toHaveBeenCalledWith("e-pw", "album", 3, 501);
    expect(await guest.readGuestAlbumVersions(OPEN)).toEqual({
      version: 1,
      albumMax: 1,
      attrVersion: 0,
    });
  });

  it("the guest's attribution never asks for an address", async () => {
    await guest.readGuestAlbumMedia(OPEN, IDS, { attribute: true });
    await guest.readGuestAttribution(OPEN, IDS);
    for (const call of readAlbumAttribution.mock.calls)
      expect(call[2]).toEqual({ withEmail: false });
  });

  it("the demo's rows are read with no attribution at all", async () => {
    const out = await guest.readGuestAlbumMedia(OPEN, IDS, {
      attribute: false,
    });
    expect(out).toEqual({ rows: [], identities: null });
    expect(readAlbumAttribution).not.toHaveBeenCalled();
  });
});
