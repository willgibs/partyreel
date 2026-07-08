import { describe, expect, it } from "vitest";

import {
  DEFAULT_STYLE_ID,
  isTreatment,
  resolveStyleEntry,
  STYLE_CATALOG,
  STYLE_IDS,
  styleThemeId,
} from "./style-registry";
import { THEME_IDS, THEMES } from "./themes";

describe("style registry", () => {
  it("is the 8 moods + 6 treatments = 14 styles", () => {
    expect(STYLE_CATALOG).toHaveLength(14);
    expect(STYLE_CATALOG.filter((s) => s.kind === "mood")).toHaveLength(8);
    expect(STYLE_CATALOG.filter((s) => s.kind === "treatment")).toHaveLength(6);
  });

  it("has unique ids matching STYLE_IDS", () => {
    expect(new Set(STYLE_IDS).size).toBe(STYLE_IDS.length);
    expect(STYLE_IDS).toEqual(STYLE_CATALOG.map((s) => s.id));
  });

  it("mood ids === THEME_IDS and each mood's id === its themeId", () => {
    const moodIds = STYLE_CATALOG.filter((s) => s.kind === "mood").map((s) => s.id);
    expect(moodIds).toEqual(THEME_IDS);
    for (const s of STYLE_CATALOG.filter((m) => m.kind === "mood")) {
      expect(s.themeId).toBe(s.id);
    }
  });

  it("every style resolves to a real ReelTheme kit", () => {
    for (const s of STYLE_CATALOG) {
      expect(THEMES[s.themeId]).toBeDefined();
      expect(styleThemeId(s.id)).toBe(s.themeId);
    }
  });

  it("treatments carry their designed native themeIds", () => {
    const t = Object.fromEntries(
      STYLE_CATALOG.filter((s) => s.kind === "treatment").map((s) => [s.id, s.themeId]),
    );
    expect(t).toEqual({
      polaroid: "warm",
      filmstrip: "classic",
      scattered: "warm",
      framed: "editorial",
      carddeck: "punchy",
      parallax: "classic",
    });
  });

  it("resolveStyleEntry falls back to the default for unknown/null ids", () => {
    expect(resolveStyleEntry(DEFAULT_STYLE_ID).id).toBe(DEFAULT_STYLE_ID);
    expect(resolveStyleEntry(null).id).toBe(DEFAULT_STYLE_ID);
    expect(resolveStyleEntry(undefined).id).toBe(DEFAULT_STYLE_ID);
    expect(resolveStyleEntry("").id).toBe(DEFAULT_STYLE_ID);
    expect(resolveStyleEntry("not-a-style").id).toBe(DEFAULT_STYLE_ID);
    // The default is a media-first mood, so unknown ids never accidentally read as a treatment.
    expect(isTreatment("not-a-style")).toBe(false);
  });

  it("isTreatment distinguishes the two families", () => {
    expect(isTreatment("classic")).toBe(false);
    expect(isTreatment("dreamy")).toBe(false);
    expect(isTreatment("polaroid")).toBe(true);
    expect(isTreatment("parallax")).toBe(true);
  });
});
