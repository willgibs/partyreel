// The flat REEL STYLE CATALOG — the single source of truth for the 14 styles a host can pick: 8 media-first
// "moods" (the Motion engine parameterized by a ReelTheme, all rendered via the shared <Reel>) + 6 stylized
// "treatments" (each its own designed composition). A mood's styleId IS its themeId; a treatment carries a
// NATIVE themeId (the grade it was designed around).
//
// This module is PURE (imports only ./themes for the ThemeId union — no `remotion`), so SERVER code
// (build-reel-props, render-service) can import it to resolve a styleId -> theme + validate ids without dragging
// the remotion runtime into the Next server build. The styleId -> COMPONENT + per-style DURATION dispatch lives
// in the sibling remotion module ./style-render (client/worker only). Keep the two halves in lockstep.

import { THEME_IDS, THEME_LABELS, type ThemeId } from "./themes";

export type StyleKind = "mood" | "treatment";

export type StyleEntry = {
  /** The stable id persisted in highlight_reels.style_id + folded into the render hash. */
  id: string;
  /** The human label shown in the composer's style picker. */
  label: string;
  kind: StyleKind;
  /** The ReelTheme kit this style renders with (mood: === id; treatment: its designed native grade). */
  themeId: ThemeId;
};

// The 6 stylized treatments — ids/labels/native themeIds mirror the design lab (reel-lab.tsx TREATMENTS).
const TREATMENTS: StyleEntry[] = [
  { id: "polaroid", label: "Polaroid stack", kind: "treatment", themeId: "warm" },
  { id: "filmstrip", label: "Film strip", kind: "treatment", themeId: "classic" },
  { id: "scattered", label: "Scattered prints", kind: "treatment", themeId: "warm" },
  { id: "framed", label: "Framed gallery", kind: "treatment", themeId: "editorial" },
  { id: "carddeck", label: "Card deck", kind: "treatment", themeId: "punchy" },
  { id: "parallax", label: "Layered parallax", kind: "treatment", themeId: "classic" },
];

// The 8 media-first moods (styleId === themeId) followed by the treatments. Order = the catalog's display order.
export const STYLE_CATALOG: StyleEntry[] = [
  ...THEME_IDS.map(
    (id): StyleEntry => ({ id, label: THEME_LABELS[id], kind: "mood", themeId: id }),
  ),
  ...TREATMENTS,
];

export const STYLE_IDS: string[] = STYLE_CATALOG.map((s) => s.id);

export const DEFAULT_STYLE_ID = "classic";

const BY_ID = new Map(STYLE_CATALOG.map((s) => [s.id, s]));

/** Resolve a stored styleId to its catalog entry, falling back to the default (Cinematic mood) for unknown ids. */
export function resolveStyleEntry(styleId: string | null | undefined): StyleEntry {
  return BY_ID.get(styleId ?? "") ?? BY_ID.get(DEFAULT_STYLE_ID)!;
}

/** The ReelTheme kit id a style renders with — feed to resolveTheme() (server-safe, no remotion). */
export function styleThemeId(styleId: string | null | undefined): ThemeId {
  return resolveStyleEntry(styleId).themeId;
}

/** Whether a styleId is one of the stylized treatments (vs a media-first mood). */
export function isTreatment(styleId: string | null | undefined): boolean {
  return resolveStyleEntry(styleId).kind === "treatment";
}
