/**
 * THE TWO LINES' WORDS (billing-integrity): `capLineOf` reads which line create_media* refused at, by the two sentences
 * the SQL raises, so each wrapper can say that line in its own voice; and every surface that says a line takes its words
 * from here, the presign routes and the completes' wrappers alike.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { liveFunction } from "@/lib/db/testing/migrations";
import {
  ALBUM_STORAGE_FULL,
  ALBUM_UPLOADS_SPENT,
  capLineOf,
  PLAN_STORAGE_FULL,
  PLAN_UPLOADS_SPENT,
} from "@/lib/upload/cap-words";

describe("capLineOf", () => {
  it("★ reads each line off the SQL's own sentence, in both writers as they stand", () => {
    for (const name of ["create_media", "create_media_as_host"]) {
      const code = liveFunction(name).code;
      expect(code, name).toContain(
        "raise exception 'Upload limit reached for this plan.'",
      );
      expect(code, name).toContain(
        "raise exception 'Storage capacity exceeded for this plan.'",
      );
    }
    expect(capLineOf("Upload limit reached for this plan.")).toBe("uploads");
    expect(capLineOf("Storage capacity exceeded for this plan.")).toBe(
      "storage",
    );
  });

  it("names no line for any other refusal", () => {
    for (const message of [
      "File exceeds the 10 GB maximum.",
      "File exceeds the size the host allows for this event.",
      "Video uploads are available on paid plans.",
      "You've taken all 24 shots on your roll.",
      "This event is not accepting uploads.",
      "",
    ]) {
      expect(capLineOf(message), message).toBeNull();
    }
  });
});

describe("one home for each line's words", () => {
  it("★ a guest's words name the album, never the plan; the owner's name her plan", () => {
    for (const words of [ALBUM_STORAGE_FULL, ALBUM_UPLOADS_SPENT]) {
      expect(words).toMatch(/album/i);
      expect(words).not.toMatch(/plan/i);
    }
    expect(PLAN_UPLOADS_SPENT).toMatch(/plan/);
    expect(PLAN_STORAGE_FULL).toMatch(/plan/);
    // "For now", never "for the month": a pass counts its uploads over its own year.
    for (const words of [ALBUM_UPLOADS_SPENT, PLAN_UPLOADS_SPENT]) {
      expect(words).toContain("for now");
      expect(words).not.toMatch(/month/i);
    }
  });

  it("★ no surface restates a line's sentence: each says it through this module", () => {
    const root = join(process.cwd(), "src");
    for (const file of [
      "app/api/r2/presign-upload/route.ts",
      "app/api/host/r2/presign-upload/route.ts",
      "lib/db/mutations/guest.ts",
      "lib/db/mutations/host-media.ts",
    ]) {
      const source = readFileSync(join(root, file), "utf8");
      for (const words of [
        ALBUM_STORAGE_FULL,
        ALBUM_UPLOADS_SPENT,
        PLAN_UPLOADS_SPENT,
        PLAN_STORAGE_FULL,
      ]) {
        expect(source, file).not.toContain(`"${words}"`);
      }
      expect(source, file).toContain('from "@/lib/upload/cap-words"');
    }
  });
});
