import { AbsoluteFill, Img, useVideoConfig } from "remotion";
import { Video } from "@remotion/media";

import { fitClip, type FitMode } from "./framing";
import type { ClipBackdrop } from "./reel-types";

// The shared media primitive every style renders clips through. It owns: the COVER-vs-FIT decision (media
// that matches the reel orientation fills; mismatched media is contained, leaving designed negative space,
// never zoom-cropped), the style's BACKDROP for that space (themed / paper / a soft blurred-fill), the
// grade, the photo/poster/(export)video paths, and the highlight-only HALATION bloom. All CSS/inline →
// WYSIWYG in Lambda. The Ken-Burns transform is computed by the caller + passed in (so each style keeps its
// own motion).

export type MediaMotion = { scale: number; tx: number; ty: number; rotate: number };

export type ClipMediaProps = {
  url: string;
  type: "photo" | "video";
  mediaWidth?: number;
  mediaHeight?: number;
  trimStartSec?: number;
  /** Video only — how many frames of the clip play (for trimAfter). */
  durationInFrames?: number;
  posterMode: boolean;
  /** CSS filter color grade. */
  grade: string;
  /** The Ken-Burns motion (caller-computed), applied identically to the media + its halation. */
  motion?: MediaMotion;
  /** Highlight-only bloom strength (0 = none). Blooms from highlights, never floods shadows. */
  halation?: number;
  /** What fills the negative space when the media is FIT (doesn't fill the frame). */
  backdrop?: ClipBackdrop;
  /** Solid backdrop color for backdrop "theme". */
  background?: string;
  /** Paper color for backdrop "paper". */
  paper?: string;
  /** Force a fit mode; else auto from media dims vs the reel dims. */
  fit?: FitMode;
  /** A designed margin (fraction) insetting the media box in BOTH modes (e.g. Editorial's paper card). */
  inset?: number;
};

function motionStyle(motion: MediaMotion | undefined): React.CSSProperties {
  if (!motion) return {};
  return {
    scale: String(motion.scale),
    translate: `${motion.tx}px ${motion.ty}px`,
    rotate: `${motion.rotate}deg`,
  };
}

export const ClipMedia: React.FC<ClipMediaProps> = (p) => {
  const { width: rw, height: rh, fps } = useVideoConfig();
  const fit: FitMode = p.fit ?? fitClip(p.mediaWidth, p.mediaHeight, rw, rh);
  const objectFit = fit === "cover" ? "cover" : "contain";
  // The cover Ken-Burns (a big base-zoom + pan, sized to never reveal a cover edge) drifts a CONTAINED
  // photo around its negative space + over-scales it. For FIT media, damp to a gentle, centered breathe so
  // it reads as an intentional framed photo with designed space — not a floating crop.
  const applied: MediaMotion | undefined =
    fit === "fit" && p.motion
      ? { scale: 1 + (p.motion.scale - 1) * 0.22, tx: 0, ty: 0, rotate: 0 }
      : p.motion;
  const mv = motionStyle(applied);

  // A fit (contained) photo floats as a framed object — a soft drop-shadow lifts it off the negative
  // space. (An inset/paper card brings its own shadow, so skip the double.)
  const isFramed = fit === "fit" && (p.inset ?? 0) <= 0;
  const mediaFilter = isFramed
    ? `${p.grade} drop-shadow(0 14px 40px rgba(0,0,0,0.42))`
    : p.grade;

  // The inset media box (a designed margin, e.g. Editorial); default the full frame.
  const m = p.inset ?? 0;
  const pct = `${m * 100}%`;
  const boxStyle: React.CSSProperties =
    m > 0
      ? { position: "absolute", top: pct, right: pct, bottom: pct, left: pct }
      : { position: "absolute", inset: 0 };

  // The base media element.
  let media: React.ReactNode;
  if (p.type === "video" && !p.posterMode) {
    const startFrame = Math.round((p.trimStartSec ?? 0) * fps);
    media = (
      <Video
        src={p.url}
        muted
        trimBefore={startFrame}
        trimAfter={startFrame + (p.durationInFrames ?? fps * 3)}
        objectFit={objectFit}
        style={{ width: "100%", height: "100%", filter: mediaFilter, ...mv }}
      />
    );
  } else {
    media = (
      <Img
        src={p.url}
        style={{ width: "100%", height: "100%", objectFit, filter: mediaFilter, ...mv }}
      />
    );
  }

  // Highlight-only bloom: crush the shadows/mids to black in the blur-pass (brightness↓ + contrast↑) so it
  // blooms from genuine highlights and never washes the dark regions into a haze (the old halation bug).
  const halation =
    p.halation && p.type !== "video" ? (
      <Img
        src={p.url}
        style={{
          width: "100%",
          height: "100%",
          objectFit,
          filter: `${p.grade} brightness(0.5) contrast(2.4) saturate(1.15) blur(18px)`,
          mixBlendMode: "screen",
          opacity: p.halation,
          ...mv,
        }}
      />
    ) : null;

  // The backdrop that fills the negative space (only visible when the media is FIT / inset).
  const showBackdrop = fit === "fit" || m > 0;
  const baseColor =
    p.backdrop === "paper"
      ? (p.paper ?? "#f2efe7")
      : p.backdrop === "none"
        ? "transparent"
        : (p.background ?? "#0a0a0a");

  return (
    <AbsoluteFill style={{ backgroundColor: showBackdrop ? baseColor : "transparent" }}>
      {showBackdrop && p.backdrop === "blur" ? (
        // A soft blurred-fill of the media itself behind the contained sharp media (the Noir look).
        <Img
          src={p.url}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: `${p.grade} brightness(0.55) blur(46px)`,
            transform: "scale(1.1)",
          }}
        />
      ) : null}
      <div style={{ ...boxStyle, overflow: "hidden" }}>
        {media}
        {halation}
      </div>
    </AbsoluteFill>
  );
};
