import { describe, expect, it } from "vitest";

import {
  buildExportManifest,
  type ExportMediaRow,
  MAX_EXPORT_ITEMS,
  summarizeMedia,
} from "@/lib/export/build-manifest";

const EID = "11111111-1111-1111-1111-111111111111";
function key(mid: string, ext = "jpg", kind = "photo") {
  return `events/${EID}/${kind}/${mid}/original.${ext}`;
}
function row(over: Partial<ExportMediaRow> = {}): ExportMediaRow {
  return {
    type: "photo",
    original_key: key("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    file_size_bytes: 1000,
    status: "approved",
    ...over,
  };
}

describe("summarizeMedia", () => {
  it("buckets approved as shown and hidden+pending as hidden, split by type", () => {
    const s = summarizeMedia([
      row({ type: "photo", status: "approved", file_size_bytes: 100 }),
      row({ type: "photo", status: "approved", file_size_bytes: 200 }),
      row({ type: "video", status: "approved", file_size_bytes: 900 }),
      row({ type: "photo", status: "hidden", file_size_bytes: 50 }),
      row({ type: "video", status: "pending", file_size_bytes: 70 }),
      row({ type: "photo", status: "removed", file_size_bytes: 9999 }), // ignored
    ]);
    expect(s.shown.photo).toEqual({ count: 2, bytes: 300 });
    expect(s.shown.video).toEqual({ count: 1, bytes: 900 });
    expect(s.hidden.photo).toEqual({ count: 1, bytes: 50 });
    expect(s.hidden.video).toEqual({ count: 1, bytes: 70 });
  });
});

describe("buildExportManifest", () => {
  const base = {
    eventName: "Sarah & Tom's Wedding 🎉",
    types: "all" as const,
    includeHidden: false,
  };

  it("includes only approved by default, names files via the download slug", () => {
    const r = buildExportManifest({
      ...base,
      rows: [
        row({ status: "approved" }),
        row({ status: "hidden" }),
        row({ status: "pending" }),
      ],
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.itemCount).toBe(1);
      expect(r.zipName).toBe("sarah-toms-wedding.zip");
      expect(r.items[0].name).toMatch(/^sarah-toms-wedding-[0-9a-f]{8}\.jpg$/);
    }
  });

  it("includeHidden expands approved -> all non-removed", () => {
    const r = buildExportManifest({
      ...base,
      includeHidden: true,
      rows: [
        row({ status: "approved" }),
        row({ status: "hidden" }),
        row({ status: "pending" }),
        row({ status: "removed" }), // still excluded
      ],
    });
    expect(r.ok && r.itemCount).toBe(3);
  });

  it("filters by media type", () => {
    const rows = [
      row({ type: "photo" }),
      row({ type: "photo" }),
      row({ type: "video" }),
    ];
    const videos = buildExportManifest({ ...base, types: "video", rows });
    expect(videos.ok && videos.itemCount).toBe(1);
    const photos = buildExportManifest({ ...base, types: "photo", rows });
    expect(photos.ok && photos.itemCount).toBe(2);
  });

  it("rejects an empty selection", () => {
    expect(
      buildExportManifest({ ...base, types: "video", rows: [row({ type: "photo" })] }),
    ).toEqual({ ok: false, reason: "empty" });
  });

  it("rejects over the item cap", () => {
    const rows = Array.from({ length: MAX_EXPORT_ITEMS + 1 }, () => row());
    expect(buildExportManifest({ ...base, rows })).toEqual({
      ok: false,
      reason: "over_cap",
    });
  });

  it("rejects over the byte cap", () => {
    const huge = row({ file_size_bytes: 21 * 1024 * 1024 * 1024 });
    expect(buildExportManifest({ ...base, rows: [huge] })).toEqual({
      ok: false,
      reason: "over_cap",
    });
  });
});
