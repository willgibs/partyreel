/**
 * ★ ONE PARTYREEL FOLDER A GOOGLE ACCOUNT, HOWEVER OFTEN SHE RECONNECTS (drive-hardening; the Drive re-walk's two
 * "Partyreel" folders, the Advisor's Q35). A Disconnect forgets every Google id the connection held, the Partyreel
 * folder's with it, so the next connection's first press made a second "Partyreel" in her My Drive and her albums sat
 * split between the two. The app now marks the folder it makes (`appProperties`, private to Partyreel) and a press
 * that knows no live folder looks for that mark first (`ensureRoot`, `findRootFolder`), never for the name (a folder
 * of hers may share it); a folder she binned or deleted is made again, marked. Fails on the code before the lane, which
 * made a new folder whenever the connection knew none.
 *
 * Against a fake Google (the folders, `files.list` by our mark, `files.create`, `files.delete`) and the database's
 * compare-and-set on the connection's root (`cloud_connection_root`), modelled.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const claimRoot = vi.fn();
const markReady = vi.fn();
const readAlbumNaming = vi.fn();
const refolderSend = vi.fn();

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ rpc: vi.fn() }),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({}) }));
vi.mock("@/lib/env", () => ({
  assertDriveEnv: () => ({}),
  env: {},
  serverEnv: {},
}));
vi.mock("@/lib/observability/sentry", () => ({
  captureError: vi.fn(),
  captureWarning: vi.fn(),
}));
vi.mock("@/lib/db/queries/drive", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/db/queries/drive")>()),
  claimRoot: (...args: unknown[]) => claimRoot(...args),
  markReady: (...args: unknown[]) => markReady(...args),
  readAlbumNaming: (...args: unknown[]) => readAlbumNaming(...args),
  refolderSend: (...args: unknown[]) => refolderSend(...args),
}));

const { adoptRootFolder, makeSendFolders, makeNewAlbumFolder } =
  await import("@/lib/drive/service.server");
const { findAlbumFolder, findRootFolder, DriveCallError } =
  await import("@/lib/drive/google");
const { DRIVE_FOLDER_COLOR, DRIVE_ROOT_FOLDER_NAME } =
  await import("@/lib/export/drive-names");

const CONNECTION = "c0000000-0000-4000-8000-000000000001";
const JOB = "j0000000-0000-4000-8000-000000000001";
const EVENT = "e0000000-0000-4000-8000-000000000001";
const FOLDER_MIME = "application/vnd.google-apps.folder";
/**
 * Our mark, as her Drive keeps it: pinned literally, since a later rename would orphan every Partyreel folder already
 * made (a reconnect would no longer find one, and make another).
 */
const MARK = { pr_root: "1" } as const;

type Folder = {
  id: string;
  name: string;
  parents: string[];
  trashed: boolean;
  appProperties: Record<string, string>;
  color?: string;
  createdAt: number;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

/** Her Drive's folders as Partyreel's `drive.file` access sees them, behind a `fetch` stub. */
class FolderDrive {
  folders = new Map<string, Folder>();
  calls: { method: string; url: URL; body: Record<string, unknown> | null }[] =
    [];
  deleted: string[] = [];
  /** Lists answer 500 (Google's own trouble). */
  failLists = false;
  /** Ids Google's listing still answers first though files.get no longer has them (its index trails by moments). */
  ghosts: string[] = [];
  private made = 0;

  add(folder: Partial<Folder> & { id: string; createdAt: number }): Folder {
    const f: Folder = {
      name: "Partyreel",
      parents: ["root"],
      trashed: false,
      appProperties: {},
      ...folder,
    };
    this.folders.set(f.id, f);
    return f;
  }

  /** The folders a press made (files.create), in order. */
  creates(): Record<string, unknown>[] {
    return this.calls
      .filter((c) => c.method === "POST")
      .map((c) => c.body ?? {});
  }

  /** The `q` of every list. */
  lists(): URL[] {
    return this.calls
      .filter((c) => c.method === "GET" && c.url.pathname === "/drive/v3/files")
      .map((c) => c.url);
  }

  fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = (init?.method ?? "GET").toUpperCase();
    const body =
      typeof init?.body === "string"
        ? (JSON.parse(init.body) as Record<string, unknown>)
        : null;
    this.calls.push({ method, url, body });
    if (url.pathname === "/drive/v3/files" && method === "GET") {
      if (this.failLists)
        return json({ error: { errors: [{ reason: "backendError" }] } }, 500);
      const q = url.searchParams.get("q") ?? "";
      const mark =
        /appProperties has \{ key='([^']+)' and value='([^']+)' \}/.exec(q);
      let list = [...this.folders.values()];
      if (/trashed = false/.test(q)) list = list.filter((f) => !f.trashed);
      if (mark)
        list = list.filter((f) => f.appProperties[mark[1]!] === mark[2]);
      if (url.searchParams.get("orderBy") === "createdTime")
        list.sort((a, b) => a.createdAt - b.createdAt);
      const pageSize = Number(url.searchParams.get("pageSize") ?? "100");
      const ids = [...this.ghosts, ...list.map((f) => f.id)];
      return json({
        files: ids.slice(0, pageSize).map((id) => ({ id })),
      });
    }
    if (url.pathname === "/drive/v3/files" && method === "POST") {
      const id = `made-${++this.made}`;
      this.add({
        id,
        name: String(body?.name ?? ""),
        parents: (body?.parents as string[] | undefined) ?? ["root"],
        appProperties:
          (body?.appProperties as Record<string, string> | undefined) ?? {},
        color: body?.folderColorRgb as string | undefined,
        createdAt: 1_000 + this.made,
      });
      expect(body?.mimeType).toBe(FOLDER_MIME);
      return json({ id });
    }
    if (url.pathname.startsWith("/drive/v3/files/")) {
      const id = decodeURIComponent(
        url.pathname.slice("/drive/v3/files/".length),
      );
      if (method === "DELETE") {
        this.deleted.push(id);
        this.folders.delete(id);
        return new Response(null, { status: 204 });
      }
      const f = this.folders.get(id);
      if (!f) return json({ error: { errors: [{ reason: "notFound" }] } }, 404);
      return json({ id: f.id, trashed: f.trashed });
    }
    return json({ error: { errors: [{ reason: "badRequest" }] } }, 400);
  };
}

let drive: FolderDrive;
/** The connection row's root (`cloud_connections.root_folder_id`), as `cloud_connection_root` keeps it. */
let connectionRoot: string | null;

beforeEach(() => {
  drive = new FolderDrive();
  connectionRoot = null;
  vi.stubGlobal("fetch", drive.fetch);
  claimRoot
    .mockReset()
    .mockImplementation(
      async (input: {
        connectionId: string;
        candidate: string | null;
        expected: string | null;
      }) => {
        if (connectionRoot === input.expected && input.candidate !== null) {
          connectionRoot = input.candidate;
          return { root: input.candidate, won: true };
        }
        return { root: connectionRoot, won: false };
      },
    );
  markReady.mockReset().mockResolvedValue(true);
  readAlbumNaming.mockReset().mockResolvedValue({
    name: "Maya & Jay",
    eventDate: "2026-09-12",
    eventEndDate: null,
  });
  refolderSend.mockReset().mockResolvedValue(true);
});

/** A press's facts as `cloud_export_create` answers them, for the connection as it stands. */
function facts(
  over: { rootFolderId?: string | null; folderId?: string | null } = {},
) {
  return {
    connectionId: CONNECTION,
    items: 5,
    bytes: 1_679_247,
    albumName: "Maya & Jay",
    eventDate: "2026-09-12",
    eventEndDate: null,
    rootFolderId: null,
    folderId: null,
    ...over,
  };
}

const marked = (f: Folder) => f.appProperties.pr_root === MARK.pr_root;

describe("★ the Partyreel folder, one a Google account", () => {
  it("after a same-account Disconnect and Connect, a send finds the folder the app made before rather than making another", async () => {
    // Her first connection's Partyreel folder (and its album), and an older folder of hers that only shares the name.
    drive.add({ id: "hers", createdAt: 1 });
    drive.add({
      id: "ours",
      createdAt: 2,
      appProperties: { ...MARK },
    });
    drive.add({
      id: "first-album",
      name: "Maya & Jay · 12 Sep 2026",
      parents: ["ours"],
      createdAt: 3,
    });

    // The new connection knows no folder: the Disconnect forgot it with the row.
    const { folderId } = await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts({ rootFolderId: null, folderId: null }),
      accessToken: "access",
    });

    expect(claimRoot).toHaveBeenCalledWith({
      connectionId: CONNECTION,
      candidate: "ours",
      expected: null,
    });
    expect(connectionRoot).toBe("ours");
    // No second Partyreel folder: the one folder made is the album's, inside ours.
    expect(drive.creates()).toEqual([
      expect.objectContaining({
        name: "Maya & Jay · 12 Sep 2026",
        parents: ["ours"],
      }),
    ]);
    expect(
      [...drive.folders.values()].filter(
        (f) => f.name === DRIVE_ROOT_FOLDER_NAME && marked(f),
      ),
    ).toHaveLength(1);
    expect(drive.folders.get(folderId)!.parents).toEqual(["ours"]);
    expect(markReady).toHaveBeenCalledWith(JOB, folderId, false);
    expect(drive.deleted).toEqual([]);

    // Found by our mark, wherever she moved it (no parent clause), never by its name.
    const [list] = drive.lists();
    const q = list!.searchParams.get("q")!;
    expect(q).toContain("appProperties has { key='pr_root' and value='1' }");
    expect(q).toContain("trashed = false");
    expect(q).not.toContain("in parents");
    expect(q).not.toContain("name");
  });

  it("finds it for Send to a new folder too, and puts the new album folder inside it", async () => {
    drive.add({
      id: "ours",
      createdAt: 2,
      appProperties: { ...MARK },
      parents: ["a-folder-she-moved-it-into"],
    });
    expect(
      await makeNewAlbumFolder({
        userId: "u",
        jobId: JOB,
        eventId: EVENT,
        connectionId: CONNECTION,
        rootFolderId: null,
        fallbackName: "Maya & Jay",
        accessToken: "access",
      }),
    ).toBe(true);
    expect(drive.creates()).toEqual([
      expect.objectContaining({ parents: ["ours"] }),
    ]);
  });

  it("makes it on her first send, marked and in our colour, in My Drive", async () => {
    await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts(),
      accessToken: "access",
    });
    const [root, album] = drive.creates();
    expect(root).toEqual({
      name: DRIVE_ROOT_FOLDER_NAME,
      mimeType: FOLDER_MIME,
      folderColorRgb: DRIVE_FOLDER_COLOR,
      appProperties: { ...MARK },
    });
    expect(album).toEqual(expect.objectContaining({ parents: ["made-1"] }));
    // The album's folder carries its own mark (drive-crumbs), never the root's, and not our colour.
    expect(album).toHaveProperty("appProperties", { pr_event: EVENT });
    expect(album).not.toHaveProperty("folderColorRgb");
    expect(connectionRoot).toBe("made-1");
  });

  it("makes it again, marked, when she binned it (a binned folder is never taken back)", async () => {
    drive.add({
      id: "binned",
      createdAt: 2,
      trashed: true,
      appProperties: { ...MARK },
    });
    connectionRoot = "binned";
    await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts({ rootFolderId: "binned", folderId: "album-in-the-bin" }),
      accessToken: "access",
    });
    expect(claimRoot).toHaveBeenCalledWith({
      connectionId: CONNECTION,
      candidate: "made-1",
      expected: "binned",
    });
    expect(drive.folders.get("made-1")).toMatchObject({
      appProperties: { ...MARK },
      trashed: false,
    });
    expect(drive.folders.get("binned")!.trashed).toBe(true);
  });

  it("keeps the connection's own folder while it stands, asking Google nothing more", async () => {
    drive.add({ id: "known", createdAt: 2 });
    drive.add({ id: "album", parents: ["known"], createdAt: 3 });
    connectionRoot = "known";
    const { folderId } = await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts({ rootFolderId: "known", folderId: "album" }),
      accessToken: "access",
    });
    expect(folderId).toBe("album");
    expect(drive.lists()).toEqual([]);
    expect(drive.creates()).toEqual([]);
    expect(claimRoot).not.toHaveBeenCalled();
  });

  it("two presses at once leave one: the loser takes the winner's, and never deletes a folder it found", async () => {
    drive.add({
      id: "ours",
      createdAt: 2,
      appProperties: { ...MARK },
    });
    // The other press got there first, with the folder it settled on.
    connectionRoot = "the-winners";
    drive.add({ id: "the-winners", createdAt: 5 });
    await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts(),
      accessToken: "access",
    });
    expect(drive.creates()).toEqual([
      expect.objectContaining({ parents: ["the-winners"] }),
    ]);
    expect(drive.deleted).toEqual([]);
  });

  it("two presses at once with none to find: the loser undoes the folder it made itself, by its own id", async () => {
    claimRoot.mockImplementationOnce(async () => ({
      root: "the-winners",
      won: false,
    }));
    await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts(),
      accessToken: "access",
    });
    expect(drive.deleted).toEqual(["made-1"]);
    expect(drive.creates()[1]).toEqual(
      expect.objectContaining({ parents: ["the-winners"] }),
    );
  });

  it("★ a loser never undoes the folder it made when the winner took that very one (found by its mark first)", async () => {
    // The other press listed our new folder by its mark and claimed it before this press's own claim landed.
    claimRoot.mockImplementationOnce(async () => {
      connectionRoot = "made-1";
      return { root: "made-1", won: false };
    });
    const { folderId } = await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts(),
      accessToken: "access",
    });
    expect(drive.deleted).toEqual([]);
    expect(drive.folders.has("made-1")).toBe(true);
    expect(drive.folders.get(folderId)!.parents).toEqual(["made-1"]);
  });

  it("never takes back the very folder it just found binned or gone, while Google's listing still shows it", async () => {
    drive.ghosts = ["gone-root"];
    connectionRoot = "gone-root";
    await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts({ rootFolderId: "gone-root", folderId: "album" }),
      accessToken: "access",
    });
    expect(claimRoot).toHaveBeenCalledWith({
      connectionId: CONNECTION,
      candidate: "made-1",
      expected: "gone-root",
    });
    expect(drive.folders.get("made-1")).toMatchObject({
      appProperties: { ...MARK },
    });
  });

  it("a connection gone while its folder was made (a Disconnect mid-press) undoes that folder and ends the press", async () => {
    claimRoot.mockImplementationOnce(async () => ({ root: null, won: false }));
    await expect(
      makeSendFolders({
        jobId: JOB,
        eventId: EVENT,
        facts: facts(),
        accessToken: "access",
      }),
    ).rejects.toThrow(/connection went/);
    expect(drive.deleted).toEqual(["made-1"]);
    expect(markReady).not.toHaveBeenCalled();
  });

  it("a lookup Google cannot answer fails the press (pressed again it finds it), never making a second folder", async () => {
    drive.add({
      id: "ours",
      createdAt: 2,
      appProperties: { ...MARK },
    });
    drive.failLists = true;
    await expect(
      makeSendFolders({
        jobId: JOB,
        eventId: EVENT,
        facts: facts(),
        accessToken: "access",
      }),
    ).rejects.toBeInstanceOf(DriveCallError);
    expect(drive.creates()).toEqual([]);
    expect(claimRoot).not.toHaveBeenCalled();
  });
});

/** The album's mark, as her Drive keeps it: pinned literally (a rename would orphan every album folder already made). */
const ALBUM_MARK = { pr_event: EVENT } as const;

// ★ drive-crumbs (drive-export.md, "Sending again never duplicates and never lies"): after a same-account Disconnect
// and Connect, sending an album again sent it whole into a second same-named album folder, the forget having dropped
// the first one's id with its files'.
describe("★ the album's folder, found by its mark after a reconnect", () => {
  it("sends into the folder an earlier connection made, and says it was found so each file is looked up first", async () => {
    drive.add({ id: "ours", createdAt: 2, appProperties: { ...MARK } });
    drive.add({
      id: "first-album",
      name: "Maya & Jay · 12 Sep 2026",
      parents: ["ours"],
      createdAt: 3,
      appProperties: { ...ALBUM_MARK },
    });
    // A folder of hers sharing the name is never taken for it.
    drive.add({
      id: "hers",
      name: "Maya & Jay · 12 Sep 2026",
      parents: ["ours"],
      createdAt: 1,
    });

    const result = await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts({ rootFolderId: null, folderId: null }),
      accessToken: "access",
    });

    expect(result).toEqual({ folderId: "first-album", found: true });
    expect(drive.creates()).toEqual([]);
    expect(markReady).toHaveBeenCalledWith(JOB, "first-album", true);
    const q = drive.lists()[1]!.searchParams.get("q")!;
    expect(q).toBe(
      `appProperties has { key='pr_event' and value='${EVENT}' } and mimeType = '${FOLDER_MIME}' and trashed = false`,
    );
    expect(q).not.toContain("in parents");
  });

  it("makes a new one, marked, when hers is in the bin (never taking a binned folder back)", async () => {
    drive.add({ id: "ours", createdAt: 2, appProperties: { ...MARK } });
    drive.add({
      id: "binned-album",
      parents: ["ours"],
      createdAt: 3,
      trashed: true,
      appProperties: { ...ALBUM_MARK },
    });
    const result = await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts({ rootFolderId: null, folderId: null }),
      accessToken: "access",
    });
    expect(result).toEqual({ folderId: "made-1", found: false });
    expect(drive.creates()).toEqual([
      expect.objectContaining({
        parents: ["ours"],
        appProperties: { ...ALBUM_MARK },
      }),
    ]);
    expect(markReady).toHaveBeenCalledWith(JOB, "made-1", false);
  });

  it("never takes back the album folder it just found binned or gone, while Google's listing still shows it", async () => {
    drive.add({ id: "known", createdAt: 2 });
    connectionRoot = "known";
    drive.ghosts = ["album-just-gone"];
    const result = await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts({ rootFolderId: "known", folderId: "album-just-gone" }),
      accessToken: "access",
    });
    expect(result.found).toBe(false);
    expect(result.folderId).toBe("made-1");
  });

  it("another album's folder is never this one's", async () => {
    drive.add({ id: "ours", createdAt: 2, appProperties: { ...MARK } });
    drive.add({
      id: "other-album",
      parents: ["ours"],
      createdAt: 3,
      appProperties: { pr_event: "e0000000-0000-4000-8000-000000000002" },
    });
    const result = await makeSendFolders({
      jobId: JOB,
      eventId: EVENT,
      facts: facts(),
      accessToken: "access",
    });
    expect(result).toEqual({ folderId: "made-1", found: false });
  });

  it("Send to a new folder marks the new folder too", async () => {
    drive.add({ id: "ours", createdAt: 2, appProperties: { ...MARK } });
    await makeNewAlbumFolder({
      userId: "u",
      jobId: JOB,
      eventId: EVENT,
      connectionId: CONNECTION,
      rootFolderId: "ours",
      fallbackName: "Maya & Jay",
      accessToken: "access",
    });
    expect(drive.creates()).toEqual([
      expect.objectContaining({ appProperties: { ...ALBUM_MARK } }),
    ]);
  });

  it("findAlbumFolder strips anything but a uuid's letters from the query (nothing can close its quote)", async () => {
    expect(
      await findAlbumFolder("access", "x' or name contains 'y", drive.fetch),
    ).toBeNull();
    const q = drive.lists()[0]!.searchParams.get("q")!;
    const value = /value='([^']*)' \}/.exec(q)?.[1];
    expect(value).toMatch(/^[0-9a-f-]*$/);
    expect(q).not.toContain("name contains");
  });
});

// ★ drive-crumbs: Account's card said "Made at your first send" after a reconnect until her next press.
describe("★ a reconnect names her Partyreel folder at once", () => {
  it("takes the folder an earlier connection made, found by its mark, against a connection that knows none", async () => {
    drive.add({ id: "ours", createdAt: 2, appProperties: { ...MARK } });
    expect(await adoptRootFolder(CONNECTION, "access")).toBe("ours");
    expect(claimRoot).toHaveBeenCalledWith({
      connectionId: CONNECTION,
      candidate: "ours",
      expected: null,
    });
    expect(connectionRoot).toBe("ours");
    expect(drive.creates()).toEqual([]);
  });

  it("keeps a folder the connection already holds, and makes none when there is none to find", async () => {
    connectionRoot = "held";
    drive.add({ id: "ours", createdAt: 2, appProperties: { ...MARK } });
    expect(await adoptRootFolder(CONNECTION, "access")).toBe("held");
    expect(connectionRoot).toBe("held");

    drive = new FolderDrive();
    vi.stubGlobal("fetch", drive.fetch);
    claimRoot.mockClear();
    expect(await adoptRootFolder(CONNECTION, "access")).toBeNull();
    expect(claimRoot).not.toHaveBeenCalled();
    expect(drive.creates()).toEqual([]);
  });

  it("Google not answering is no failure of the connect: the press finds it later", async () => {
    drive.failLists = true;
    expect(await adoptRootFolder(CONNECTION, "access")).toBeNull();
    expect(claimRoot).not.toHaveBeenCalled();
  });
});

describe("findRootFolder", () => {
  it("asks for the oldest marked folder out of the bin, one answer, ids only", async () => {
    drive.add({ id: "newer", createdAt: 9, appProperties: { ...MARK } });
    drive.add({ id: "older", createdAt: 4, appProperties: { ...MARK } });
    drive.add({
      id: "binned",
      createdAt: 1,
      trashed: true,
      appProperties: { ...MARK },
    });
    expect(await findRootFolder("access", drive.fetch)).toBe("older");
    const url = drive.lists()[0]!;
    expect(url.searchParams.get("q")).toBe(
      `appProperties has { key='pr_root' and value='1' } and mimeType = '${FOLDER_MIME}' and trashed = false`,
    );
    expect(url.searchParams.get("orderBy")).toBe("createdTime");
    expect(url.searchParams.get("pageSize")).toBe("1");
    expect(url.searchParams.get("fields")).toBe("files(id)");
    expect(url.searchParams.get("spaces")).toBe("drive");
  });

  it("answers null when there is none", async () => {
    drive.add({ id: "hers", createdAt: 1 });
    expect(await findRootFolder("access", drive.fetch)).toBeNull();
  });
});
