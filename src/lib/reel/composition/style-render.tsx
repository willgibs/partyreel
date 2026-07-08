import { createElement } from "react";
import { AbsoluteFill } from "remotion";

import { planReel } from "../engine/layout";
import { Reel } from "./Reel";
import type { ReelProps } from "../engine/reel-types";
import { resolveStyleEntry } from "../engine/style-registry";
import { CardDeck, cardDeckDuration } from "./treatments/card-deck";
import { FilmStrip, filmStripDuration } from "./treatments/film-strip";
import { FramedGallery, framedGalleryDuration } from "./treatments/framed-gallery";
import { LayeredParallax, layeredParallaxDuration } from "./treatments/layered-parallax";
import { PolaroidStack, polaroidStackDuration } from "./treatments/polaroid-stack";
import { ScatteredPrints, scatteredPrintsDuration } from "./treatments/scattered-prints";

// The REMOTION half of the style catalog: styleId -> composition component + per-style duration, plus the
// StyleDispatch root the player + Lambda Root render. This module imports `remotion` + Reel + the treatments,
// so ONLY client/worker code may import it (the server keeps to the pure ./style-registry + ./layout). The
// pure ./style-registry is the source of truth for ids/kind/theme; this file just maps those ids to code.

type StyleImpl = { component: React.FC<ReelProps>; duration: (p: ReelProps) => number };

// The 6 stylized treatments (media-first moods all render via <Reel> + planReel below).
const TREATMENT_IMPL: Record<string, StyleImpl> = {
  polaroid: { component: PolaroidStack, duration: polaroidStackDuration },
  filmstrip: { component: FilmStrip, duration: filmStripDuration },
  scattered: { component: ScatteredPrints, duration: scatteredPrintsDuration },
  framed: { component: FramedGallery, duration: framedGalleryDuration },
  carddeck: { component: CardDeck, duration: cardDeckDuration },
  parallax: { component: LayeredParallax, duration: layeredParallaxDuration },
};

/** The composition component for a styleId — a treatment FC, or <Reel> for any media-first mood. */
export function styleComponent(styleId: string | null | undefined): React.FC<ReelProps> {
  const entry = resolveStyleEntry(styleId);
  return (entry.kind === "treatment" && TREATMENT_IMPL[entry.id]?.component) || Reel;
}

/** The total frame count for a styleId — the treatment's own duration fn, or planReel for a mood. Pure
 *  arithmetic over props.clips (no remotion hooks), so it's safe in calculateMetadata + the player useMemo. */
export function styleDuration(styleId: string | null | undefined, props: ReelProps): number {
  const entry = resolveStyleEntry(styleId);
  const impl = entry.kind === "treatment" ? TREATMENT_IMPL[entry.id] : undefined;
  const frames = impl ? impl.duration(props) : planReel(props).totalFrames;
  return Math.max(1, frames);
}

// --- The free-tier wordmark, hoisted out of Reel.tsx so StyleDispatch stamps it uniformly across ALL styles
// (a treatment reel must never export unmarked). CSS/inline only → identical in the player + Lambda.
const FONT_STACK =
  'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const Watermark: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: 104,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 22px",
          borderRadius: 999,
          backgroundColor: "rgba(10,10,10,0.34)",
          border: "1px solid rgba(255,255,255,0.16)",
          color: "rgba(255,255,255,0.96)",
          fontFamily: FONT_STACK,
          fontSize: 34,
          fontWeight: 600,
          letterSpacing: 0.3,
          textShadow: "0 2px 10px rgba(0,0,0,0.5)",
        }}
      >
        <span
          style={{
            width: 16,
            height: 16,
            borderRadius: 4,
            backgroundColor: "#8b5cf6",
            boxShadow: "0 1px 6px rgba(0,0,0,0.4)",
          }}
        />
        partyreel.com
      </div>
    </AbsoluteFill>
  );
};

/** The composition/player ROOT — dispatches to the styleId's component, then stamps the free-tier wordmark
 *  on top so every style (mood or treatment) marks uniformly. */
export const StyleDispatch: React.FC<ReelProps> = (props) => {
  // createElement (not <Comp/>) — styleComponent returns a STABLE module-level FC from the registry; the JSX
  // form trips react-hooks/static-components (which guards against per-render-created components), and calling
  // it as a plain function would break the treatments' useCurrentFrame/useVideoConfig hooks.
  return (
    <AbsoluteFill>
      {createElement(styleComponent(props.styleId), props)}
      {props.watermark ? <Watermark /> : null}
    </AbsoluteFill>
  );
};
