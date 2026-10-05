/**
 * THE CLOSING CHECK'S PAGE, AGAINST A FAKE DRIVE: confirmed, missing, binned, not what we sent, a doubt left a doubt,
 * the album's folder in her bin, and duplicates counted (never binned).
 */
import { describe, expect, it } from "vitest";

import { checkPage } from "./check";
import { driveAdapter } from "./google-drive";
import { FakeDrive } from "./testing/fake-drive";

describe("a closing check's page", () => {
  it("confirms each file by its id, wherever she moved it, and names what is not as it should be", async () => {
    const drive = new FakeDrive();
    const folder = drive.add({ id: "album", size: 0 });
    const ok = drive.add({
      size: 10,
      md5: "a".repeat(32),
      parents: ["elsewhere"],
    });
    const binned = drive.add({ size: 10, trashed: true });
    const other = drive.add({ size: 11, md5: "a".repeat(32) });
    const out = await checkPage({
      drive: driveAdapter(drive.fetch),
      token: "t",
      folderId: folder.id,
      first: false,
      items: [
        { mediaId: "m1", fileId: ok.id, bytes: 10, md5: "a".repeat(32) },
        { mediaId: "m2", fileId: "gone", bytes: 10, md5: null },
        { mediaId: "m3", fileId: binned.id, bytes: 10, md5: null },
        { mediaId: "m4", fileId: other.id, bytes: 10, md5: null },
      ],
    });
    expect(out.results).toEqual([
      { mediaId: "m1", state: "ok" },
      { mediaId: "m2", state: "missing" },
      { mediaId: "m3", state: "trashed" },
      { mediaId: "m4", state: "mismatch" },
    ]);
    expect(out.finding).toBeUndefined();
  });

  it("pauses on the album's folder in her bin rather than resending the album", async () => {
    const drive = new FakeDrive();
    const folder = drive.add({ id: "album", size: 0, trashed: true });
    const out = await checkPage({
      drive: driveAdapter(drive.fetch),
      token: "t",
      folderId: folder.id,
      first: true,
      items: [],
    });
    expect(out).toEqual({ results: [], finding: "folder_gone" });
  });

  it("counts duplicates on the first page from the folder's own listing, binning nothing", async () => {
    const drive = new FakeDrive();
    drive.add({ id: "album", size: 0 });
    drive.add({
      size: 1,
      parents: ["album"],
      appProperties: { pr_media: "m1" },
    });
    drive.add({
      size: 1,
      parents: ["album"],
      appProperties: { pr_media: "m1" },
    });
    drive.add({
      size: 1,
      parents: ["album"],
      appProperties: { pr_media: "m2" },
    });
    const out = await checkPage({
      drive: driveAdapter(drive.fetch),
      token: "t",
      folderId: "album",
      first: true,
      items: [],
    });
    expect(out.duplicates).toBe(1);
    expect(drive.deleted).toEqual([]);
  });

  it("leaves a doubt a doubt: Google not answering is unknown, never missing", async () => {
    const drive = new FakeDrive();
    drive.add({ id: "album", size: 0 });
    const file = drive.add({ size: 5 });
    const adapter = driveAdapter(drive.fetch);
    const flaky = {
      ...adapter,
      getFile: async (t: string, id: string) =>
        id === file.id
          ? Promise.reject(new Error("reset"))
          : adapter.getFile(t, id),
    };
    const out = await checkPage({
      drive: flaky,
      token: "t",
      folderId: "album",
      first: false,
      items: [{ mediaId: "m1", fileId: file.id, bytes: 5, md5: null }],
    });
    expect(out.results).toEqual([{ mediaId: "m1", state: "unknown" }]);
  });
});
