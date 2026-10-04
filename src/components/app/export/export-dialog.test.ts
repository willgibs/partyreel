/**
 * The old Download menu's line, as the take-home board still quotes it (`export-dialog.tsx`). The menu itself left
 * with take-home r1 (her Select, then Save; the host's two sets), and its tests with it; what it said stays pinned.
 */
import { describe, expect, it } from "vitest";

import { downloadMenuNote } from "@/components/app/export/export-dialog";

const note = (place: "files" | "downloads" | "desk", anyInParts = false) =>
  downloadMenuNote({ loading: false, failed: false, place, anyInParts });

describe("downloadMenuNote", () => {
  it("tells an iPhone its Files app, and a photograph's way into Photos", () => {
    expect(note("files")).toBe(
      "Each saves to your Files app. To keep a photo in Photos, open it and tap Save.",
    );
  });

  it("tells an Android phone its Downloads, and a desk nothing it knows", () => {
    expect(note("downloads")).toBe("Each saves to your Downloads.");
    expect(note("desk")).toBe("Each downloads as one file.");
  });

  it("says the parts only when a row needs them", () => {
    expect(note("desk", true)).toBe(
      "Each downloads as one file, a big album in parts.",
    );
  });

  it("says it is adding up, or that it could not", () => {
    expect(
      downloadMenuNote({
        loading: true,
        failed: false,
        place: "desk",
        anyInParts: false,
      }),
    ).toBe("Adding it up");
    expect(
      downloadMenuNote({
        loading: false,
        failed: true,
        place: "desk",
        anyInParts: false,
      }),
    ).toBe("Couldn't add it up. Close and try again.");
  });
});
