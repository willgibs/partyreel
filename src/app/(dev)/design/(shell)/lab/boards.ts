import type { ComponentType } from "react";

import { AlbumHeroBoard } from "@/app/(dev)/design/sandbox/album-hero/board";
import { BrandVoiceBoard } from "@/app/(dev)/design/sandbox/brand-voice/board";
import { FloatingSurfacesBoard } from "@/app/(dev)/design/sandbox/floating-surfaces/board";
import { GlowDoctrineBoard } from "@/app/(dev)/design/sandbox/glow-doctrine/board";
import { GlowMomentsBoard } from "@/app/(dev)/design/sandbox/glow-moments/board";
import { LightBoard } from "@/app/(dev)/design/sandbox/light/board";
import { MediaKitBoard } from "@/app/(dev)/design/sandbox/media-kit/board";
import { RiverVisualBoard } from "@/app/(dev)/design/sandbox/river-visual/board";
import { RoundingBoard } from "@/app/(dev)/design/sandbox/rounding/board";
import type { SandboxId } from "@/app/(dev)/design/touchpoints";

/**
 * THE BOARDS' CLIENT COMPONENTS (the Library x Lab round, 2026-09-15): the one
 * map from a standing board's id to the composition that renders it. A board
 * gets an entry here only while it stands in sandbox/ (touchpoints.ts sets
 * `board` on the same ids; touchpoints.test.ts pins the two lists equal);
 * when its ruling lands, both go and docs/design/rulings.md keeps the
 * history. Retiring one is therefore ATOMIC across three files plus the
 * board's directory: touchpoints.ts (which owns SandboxId), this map and
 * sandbox/registry.ts. The palette, home-hero and type-scale all left
 * that way on 2026-09-17.
 *
 * `legacy` marks a board that predates the kit's template (it draws its own
 * header, index and asks); the migration wave clears the flag board by board,
 * and the desk reads the spec (sandbox/registry.ts) for the rest.
 */
export type BoardEntry = { Component: ComponentType; legacy?: true };

export const BOARD_COMPONENTS: Record<SandboxId, BoardEntry> = {
  "glow-doctrine": { Component: GlowDoctrineBoard },
  "glow-moments": { Component: GlowMomentsBoard },
  light: { Component: LightBoard },
  "floating-surfaces": { Component: FloatingSurfacesBoard },
  "brand-voice": { Component: BrandVoiceBoard },
  "media-kit": { Component: MediaKitBoard },
  rounding: { Component: RoundingBoard },
  "album-hero": { Component: AlbumHeroBoard },
  "river-visual": { Component: RiverVisualBoard },
};
