/**
 * ★ THE PROMISE'S FOLDER SHOWS THREE DIFFERENT PHOTOGRAPHS (the walk: one photo twice, since `(i * 2) % n` repeats on
 * an album of two or four pictures). The album's first three, each once; fewer leave muted tiles, never a repeat.
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FolderPicture } from "./drive-parts";

function shown(pictures: string[], wide: boolean) {
  const { container, unmount } = render(
    <FolderPicture
      pictures={pictures}
      wide={wide}
      label="Partyreel / Arrival"
    />,
  );
  const imgs = [...container.querySelectorAll("img")].map((img) =>
    img.getAttribute("src"),
  );
  unmount();
  return imgs;
}

describe("the folder's photographs", () => {
  it("★ are the album's first three, each once, at a desk and in a hand", () => {
    for (const wide of [true, false]) {
      expect(shown(["a", "b", "c", "d"], wide)).toEqual(["a", "b", "c"]);
      expect(shown(["a", "b", "c", "d", "e"], wide)).toEqual(["a", "b", "c"]);
    }
  });

  it("leave muted tiles where the album has fewer, never one twice", () => {
    expect(shown(["a", "b"], false)).toEqual(["a", "b"]);
    expect(shown(["a"], true)).toEqual(["a"]);
    expect(shown(["a", "a", "b"], false)).toEqual(["a", "b"]);
    expect(shown([], false)).toEqual([]);
  });
});
