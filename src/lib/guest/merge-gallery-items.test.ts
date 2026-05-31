import { describe, expect, it } from "vitest";

import type { GridMedia } from "@/components/app/media-grid";
import { mergeGalleryItems } from "@/lib/guest/merge-gallery-items";

function item(id: string, url = `https://r2/${id}`): GridMedia {
  return { id, type: "photo", url, downloadUrl: url };
}

describe("mergeGalleryItems", () => {
  it("prepends optimistic items before server items", () => {
    const result = mergeGalleryItems([item("a"), item("b")], [item("c")]);
    expect(result.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("drops an optimistic item once its server version arrives (dedupe by id)", () => {
    const optimistic = [item("a", "blob:local")];
    const server = [item("a", "https://r2/a"), item("c")];
    const result = mergeGalleryItems(optimistic, server);
    // 'a' appears once, and it's the SERVER (presigned) version, not the blob.
    expect(result.map((m) => m.id)).toEqual(["a", "c"]);
    expect(result.find((m) => m.id === "a")?.url).toBe("https://r2/a");
  });

  it("returns server items when there are no optimistic ones", () => {
    expect(
      mergeGalleryItems([], [item("c"), item("d")]).map((m) => m.id),
    ).toEqual(["c", "d"]);
  });

  it("returns optimistic items when the server is empty", () => {
    expect(mergeGalleryItems([item("a")], []).map((m) => m.id)).toEqual(["a"]);
  });
});
