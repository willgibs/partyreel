import type { ComponentType } from "react";

import { AlbumHeroBoard } from "@/app/(dev)/design/sandbox/album-hero/board";
import { GalleryWidthBoard } from "@/app/(dev)/design/sandbox/gallery-width/board";
import { RiverVisualBoard } from "@/app/(dev)/design/sandbox/river-visual/board";
import { VoiceBoard } from "@/app/(dev)/design/sandbox/voice/board";
import type { SandboxId } from "@/app/(dev)/design/touchpoints";

/**
 * THE BOARDS' CLIENT COMPONENTS (the Library x Lab round, 2026-09-15): the one
 * map from a standing board's id to the composition that renders it. A board
 * gets an entry here only while it stands in sandbox/ (touchpoints.ts sets
 * `board` on the same ids; touchpoints.test.ts pins the two lists equal);
 * when its ruling lands, both go and docs/design/rulings.md keeps the
 * history. Retiring one is therefore ATOMIC across three files plus the
 * board's directory: touchpoints.ts (which owns SandboxId), this map and
 * sandbox/registry.ts, and a lane touches only its own board's lines in each.
 *
 * `legacy` marks a board that predates the kit's template (it draws its own
 * header, index and asks); the migration wave clears the flag board by board,
 * and the desk reads the spec (sandbox/registry.ts) for the rest.
 */
export type BoardEntry = { Component: ComponentType; legacy?: true };

export const BOARD_COMPONENTS: Record<SandboxId, BoardEntry> = {
  voice: { Component: VoiceBoard },
  "gallery-width": { Component: GalleryWidthBoard },
  "album-hero": { Component: AlbumHeroBoard },
  "river-visual": { Component: RiverVisualBoard },
};
