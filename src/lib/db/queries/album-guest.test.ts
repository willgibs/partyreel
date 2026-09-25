import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * THE GUEST READS CARRY THEIR OWN GATE: an open album reads; a password album reads with its signed
 * unlock cookie or for its OWNER (who never holds the cookie); a private one never, whatever a caller
 * hands in. The service role is never even asked past the gate, and a refusal is a null, never an
 * exception (the plan's throw is what crashed the host's own password album, build 10).
 */
vi.mock("server-only", () => ({}));

const isUnlocked = vi.fn();
vi.mock("@/lib/events/unlock-cookie", () => ({
  isUnlocked: (...a: unknown[]) => isUnlocked(...a),
}));
// The owner, as the page and the routes decide it (`getUser()` then the explicit host_id match);
// its own tests are gallery-access-owner.server.test.ts's.
const isRequestOwner = vi.fn();
vi.mock("@/lib/events/gallery-access-owner.server", () => ({
  isRequestOwner: (...a: unknown[]) => isRequestOwner(...a),
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

const READ = {
  version: 1,
  albumMax: 1,
  attrVersion: 0,
  approved: 0,
  hidden: null,
  pending: null,
  changes: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  isUnlocked.mockResolvedValue(false);
  isRequestOwner.mockResolvedValue(false);
  readAlbumVersions.mockResolvedValue({
    version: 1,
    albumMax: 1,
    attrVersion: 0,
  });
  readAlbumChanges.mockResolvedValue(READ);
  readAlbumAttribution.mockResolvedValue(new Map());
  createAdminClient.mockReturnValue(emptyAdmin());
});

const calls = () =>
  readAlbumVersions.mock.calls.length +
  readAlbumChanges.mock.calls.length +
  readAlbumAttribution.mock.calls.length +
  createAdminClient.mock.calls.length;

/** Every read the module offers, against one event: the five a caller can reach. */
async function readAll(event: typeof OPEN | typeof PASSWORD | typeof PRIVATE) {
  return {
    versions: await guest.readGuestAlbumVersions(event),
    plan: await guest.planGuestAlbumSync(event, null),
    page: await guest.readGuestManifestPage(event, null, 10),
    media: await guest.readGuestAlbumMedia(event, IDS, { attribute: true }),
    attribution: await guest.readGuestAttribution(event, IDS),
  };
}

describe("every guest read carries the gate", () => {
  it("a password album WITHOUT its cookie, to anyone but its host, reads nothing through any of the five", async () => {
    const out = await readAll(PASSWORD);
    expect(Object.values(out)).toEqual([null, null, null, null, null]);
    expect(calls()).toBe(0);
    expect(isUnlocked).toHaveBeenCalledWith("e-pw");
    expect(isRequestOwner).toHaveBeenCalledWith("e-pw");
  });

  it("★ its HOST reads it with no cookie at all, through all five (build 10's blocker)", async () => {
    isRequestOwner.mockResolvedValue(true);
    const out = await readAll(PASSWORD);
    expect(out.versions).toEqual({ version: 1, albumMax: 1, attrVersion: 0 });
    expect(out.plan?.part.kind).toBe("manifest");
    expect(out.page).toEqual({ entries: [], next: null });
    expect(out.media).toEqual({ rows: [], identities: new Map() });
    expect(out.attribution).toEqual(new Map());
    expect(readAlbumChanges).toHaveBeenCalledWith("e-pw", "album", 0, 0);
    expect(isRequestOwner).toHaveBeenCalledWith("e-pw");
  });

  it("the unlock cookie answers first: an unlocked guest never costs an owner check", async () => {
    isUnlocked.mockResolvedValue(true);
    const out = await readAll(PASSWORD);
    expect(Object.values(out).every((v) => v !== null)).toBe(true);
    expect(isRequestOwner).not.toHaveBeenCalled();
  });

  it("an open album reads for anyone, asking neither the cookie nor the owner", async () => {
    const out = await readAll(OPEN);
    expect(Object.values(out).every((v) => v !== null)).toBe(true);
    expect(isUnlocked).not.toHaveBeenCalled();
    expect(isRequestOwner).not.toHaveBeenCalled();
  });

  it("a private album reads nothing, not even for its host, and asks nobody", async () => {
    isRequestOwner.mockResolvedValue(true);
    isUnlocked.mockResolvedValue(true);
    const out = await readAll(PRIVATE);
    expect(Object.values(out)).toEqual([null, null, null, null, null]);
    expect(calls()).toBe(0);
    expect(isUnlocked).not.toHaveBeenCalled();
    expect(isRequestOwner).not.toHaveBeenCalled();
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

describe("planGuestAlbumSync: one gate for the whole plan", () => {
  it("★ a refusal is a null, never a throw, and reads nothing", async () => {
    await expect(guest.planGuestAlbumSync(PASSWORD, null)).resolves.toBeNull();
    await expect(guest.planGuestAlbumSync(PASSWORD, 3)).resolves.toBeNull();
    expect(calls()).toBe(0);
  });

  it("asks the gate ONCE for a manifest's two reads, so they can never disagree", async () => {
    isRequestOwner.mockResolvedValue(true);
    const plan = await guest.planGuestAlbumSync(PASSWORD, null);
    expect(plan?.part.kind).toBe("manifest");
    // The snapshot, then the first page: two reads behind one answer.
    expect(readAlbumChanges).toHaveBeenCalledTimes(1);
    expect(createAdminClient).toHaveBeenCalledTimes(1);
    expect(isUnlocked).toHaveBeenCalledTimes(1);
    expect(isRequestOwner).toHaveBeenCalledTimes(1);
  });

  it("plans a delta from the version the client holds", async () => {
    isUnlocked.mockResolvedValue(true);
    const plan = await guest.planGuestAlbumSync(PASSWORD, 1);
    expect(plan?.part).toMatchObject({ kind: "delta", v: 1 });
    expect(readAlbumChanges).toHaveBeenCalledWith("e-pw", "album", 1, 501);
  });

  it("a FAILED read still throws: a broken album is not a locked one", async () => {
    readAlbumChanges.mockRejectedValue(new Error("album: changes since"));
    await expect(guest.planGuestAlbumSync(OPEN, null)).rejects.toThrow(
      "album: changes since",
    );
  });
});

describe("the refused answer", () => {
  it("is the album locked behind its password, exactly the decision for a guest without the cookie", () => {
    expect(guest.ALBUM_REFUSED).toEqual({ access: "none", gate: "password" });
  });
});
