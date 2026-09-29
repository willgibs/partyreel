import { describe, expect, it } from "vitest";

import {
  buildExportManifest,
  EXPORT_CURSOR_RE,
  type ExportMediaRow,
  MAX_EXPORT_BYTES,
  MAX_EXPORT_ITEMS,
  summarizeMedia,
} from "@/lib/export/build-manifest";

const EID = "11111111-1111-1111-1111-111111111111";
const uuid = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
function key(mid: string, ext = "jpg", kind = "photo") {
  return `events/${EID}/${kind}/${mid}/original.${ext}`;
}
/** A second apart from the first row on: the export's order is the rows' own time. */
const at = (n: number) =>
  new Date(Date.UTC(2026, 8, 23, 20) + n * 1000).toISOString();

let serial = 0;
function row(over: Partial<ExportMediaRow> = {}): ExportMediaRow {
  const n = ++serial;
  return {
    id: uuid(n),
    type: "photo",
    original_key: key(uuid(n)),
    file_size_bytes: 1000,
    status: "approved",
    created_at: at(n),
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
      expect([r.part, r.parts, r.next]).toEqual([1, 1, null]);
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
      buildExportManifest({
        ...base,
        types: "video",
        rows: [row({ type: "photo" })],
      }),
    ).toEqual({ ok: false, reason: "empty" });
  });

  it("zips oldest first, whatever order the rows arrive in", () => {
    const [a, b, c] = [row(), row(), row()];
    const r = buildExportManifest({ ...base, rows: [c, a, b] });
    expect(r.ok && r.items.map((i) => i.key)).toEqual(
      [a, b, c].map((x) => x.original_key),
    );
  });

  it("names Yours' zip after the event and the set", () => {
    const r = buildExportManifest({
      ...base,
      rows: [row()],
      zipLabel: "yours",
    });
    expect(r.ok && r.zipName).toBe("sarah-toms-wedding-yours.zip");
  });
});

/**
 * ★ A REQUEST FROM BEFORE THE WALK KEEPS THE OLD REFUSAL. Only a walk (a client that sends `part`)
 * is ever handed a part; a tab still running the old app would take part 1 and believe it had the
 * album, so it hears `over_cap` exactly as it always did (host route.test.ts pins the 413).
 */
describe("without a walk: the whole selection or the refusal", () => {
  const base = {
    eventName: "Garden",
    types: "all" as const,
    includeHidden: false,
  };

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

/**
 * THE WALK (`export-flow` r1, `cap=split`, Will: "Download all should be as easy as possible, even
 * over 2000 items/20GB ... Would hate for someone to think they downloaded everything then delete
 * the event not knowing"). An album past one zip's ceilings comes home in parts, every item in
 * exactly one, whatever happens to the album between the parts.
 */
describe("the walk", () => {
  const base = {
    eventName: "Garden Party",
    types: "all" as const,
    includeHidden: false,
  };

  /** Every part of a walk, in order, as the client takes them. */
  function walkAll(rows: ExportMediaRow[], between?: (part: number) => void) {
    const taken: string[][] = [];
    const said: [number, number][] = [];
    let after: string | null = null;
    for (let part = 1; part < 50; part++) {
      const r = buildExportManifest({ ...base, rows, walk: { part, after } });
      if (!r.ok) {
        expect(r.reason).toBe("empty");
        break;
      }
      taken.push(r.items.map((i) => i.key));
      said.push([r.part, r.parts]);
      if (!r.next) break;
      expect(r.next).toMatch(EXPORT_CURSOR_RE);
      after = r.next;
      between?.(part);
    }
    return { taken, said };
  }

  it("one zip's worth is one part, 1 of 1", () => {
    const rows = Array.from({ length: 12 }, () => row());
    const r = buildExportManifest({
      ...base,
      rows,
      walk: { part: 1, after: null },
    });
    expect(r.ok && [r.itemCount, r.part, r.parts, r.next]).toEqual([
      12,
      1,
      1,
      null,
    ]);
    expect(r.ok && r.zipName).toBe("garden-party.zip");
  });

  it("2,440 items: 2,000 then 440, every item once, the oldest first", () => {
    const rows = Array.from({ length: 2440 }, () => row());
    const { taken, said } = walkAll(rows);
    expect(taken.map((p) => p.length)).toEqual([2000, 440]);
    expect(said).toEqual([
      [1, 2],
      [2, 2],
    ]);
    expect(taken.flat()).toEqual(rows.map((r) => r.original_key));
  });

  it("closes a part at 20 GB before 2,000 items, and names each zip by its part", () => {
    const GB = 1024 * 1024 * 1024;
    // 30 clips of 1.5 GB: 13 fit under 20 GB, so 13, 13 and 4.
    const rows = Array.from({ length: 30 }, () =>
      row({ type: "video", file_size_bytes: 1.5 * GB }),
    );
    const names: string[] = [];
    let after: string | null = null;
    for (let part = 1; ; part++) {
      const r = buildExportManifest({ ...base, rows, walk: { part, after } });
      if (!r.ok) throw new Error(r.reason);
      expect(r.totalBytes).toBeLessThanOrEqual(MAX_EXPORT_BYTES);
      names.push(`${r.zipName} (${r.itemCount})`);
      if (!r.next) break;
      after = r.next;
    }
    expect(names).toEqual([
      "garden-party-part-1-of-3.zip (13)",
      "garden-party-part-2-of-3.zip (13)",
      "garden-party-part-3-of-3.zip (4)",
    ]);
  });

  it("an item deleted from a part already taken moves nothing: the next part starts where the last ended", () => {
    const rows = Array.from({ length: 4500 }, () => row());
    const all = rows.map((r) => r.original_key);
    const { taken } = walkAll(rows, (part) => {
      // After part 1 downloads, the host deletes ten photographs from it.
      if (part === 1) rows.splice(100, 10);
    });
    expect(taken.map((p) => p.length)).toEqual([2000, 2000, 500]);
    // Nothing after the deletion fell between two parts: every later item is in exactly one.
    expect(taken.flat()).toEqual(all);
  });

  it("an arrival during the walk lands in its last part", () => {
    const rows = Array.from({ length: 2100 }, () => row());
    const { taken, said } = walkAll(rows, (part) => {
      if (part === 1) rows.push(row());
    });
    expect(taken.map((p) => p.length)).toEqual([2000, 101]);
    expect(said.at(-1)).toEqual([2, 2]);
  });

  it("a walk that grows a part says so: the count is what is left, as of each mint", () => {
    const rows = Array.from({ length: 3990 }, () => row());
    const { said } = walkAll(rows, (part) => {
      // Twenty arrive after part 1: 4,010 in all is three parts now.
      if (part === 1) for (let i = 0; i < 20; i++) rows.push(row());
    });
    expect(said).toEqual([
      [1, 2],
      [2, 3],
      [3, 3],
    ]);
  });

  it("a part asked for after everything left was deleted is empty: the walk is done", () => {
    const rows = Array.from({ length: 2005 }, () => row());
    const first = buildExportManifest({
      ...base,
      rows,
      walk: { part: 1, after: null },
    });
    if (!first.ok || !first.next) throw new Error("expected a second part");
    const rest = rows.slice(0, 2000);
    expect(
      buildExportManifest({
        ...base,
        rows: rest,
        walk: { part: 2, after: first.next },
      }),
    ).toEqual({ ok: false, reason: "empty" });
  });

  it("orders rows that share a millisecond by id, so a part boundary never splits a tie twice", () => {
    const same = at(0);
    const rows = Array.from({ length: 2003 }, () => row({ created_at: same }));
    const { taken } = walkAll(rows);
    expect(taken.map((p) => p.length)).toEqual([2000, 3]);
    expect(new Set(taken.flat()).size).toBe(2003);
  });

  it("Yours' parts carry both words", () => {
    const rows = Array.from({ length: 2001 }, () => row());
    const r = buildExportManifest({
      ...base,
      rows,
      walk: { part: 1, after: null },
      zipLabel: "yours",
    });
    expect(r.ok && r.zipName).toBe("garden-party-yours-part-1-of-2.zip");
  });
});
