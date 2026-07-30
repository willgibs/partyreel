// The Ken-Burns motion characters, PORTED from Reel.tsx computeMotion (the source of truth for every
// constant here; change that file and this one together or the parity harness will show the drift).
// Pure math over the plan's seeded ClipMotion, shared by the live canvas player and the encode loop.
//
// The invariant carried over: baseZoom = 1 + 2*panFrac + 0.015 sizes the overscan so a cover-fit clip
// never reveals an edge at any frame (pan <= overscan margin throughout). Each style spends that
// motion budget differently; all four are ported (they are a few lines each) so later mood ports get
// them for free even though this slice only ships Cinematic (freezeGo).

import type { ClipMotion } from "./layout";
import type { MotionStyle } from "./reel-types";
import { EASE, interp } from "./easing";

/** The per-frame transform of a clip's media (CSS-property semantics: translate, then rotate, then scale). */
export type Move = { scale: number; tx: number; ty: number; rotate: number };

export function computeMotion(
  style: MotionStyle,
  frame: number,
  dur: number,
  m: ClipMotion,
  width: number,
): Move {
  const baseZoom = 1 + 2 * m.panFrac + 0.015;
  const panPx = m.panFrac * width;
  const p = dur > 0 ? frame / dur : 0;

  if (style === "punch") {
    const snap = interp(
      frame,
      [0, Math.min(10, dur)],
      [1 + Math.max(m.punch, 0.12), 1],
      EASE,
    );
    const drift = interp(
      frame,
      [0, dur],
      [baseZoom, baseZoom + m.zoomDelta * 0.5],
    );
    return {
      scale: drift * snap,
      tx: interp(frame, [0, dur], [0, m.panX * panPx * 0.4]),
      ty: interp(frame, [0, dur], [0, m.panY * panPx * 0.4]),
      rotate: 0,
    };
  }

  if (style === "float") {
    const ph = m.panX * Math.PI;
    return {
      scale: interp(frame, [0, dur], [baseZoom, baseZoom + m.zoomDelta]),
      tx: Math.sin(p * Math.PI * 1.2 + ph) * m.panX * panPx,
      ty: Math.sin(p * Math.PI * 1.2 + ph + 1.2) * m.panY * panPx,
      rotate: Math.sin(p * Math.PI * 2 + ph) * 0.5,
    };
  }

  if (style === "freezeGo") {
    const go = interp(p, [0.45, 1], [0, 1], EASE);
    return {
      scale: baseZoom + go * m.zoomDelta,
      tx: go * m.panX * panPx,
      ty: go * m.panY * panPx,
      rotate: 0,
    };
  }

  // drift (default): gentle linear push + pan, with an optional small entry punch.
  const punch = m.punch
    ? interp(frame, [0, Math.min(7, dur)], [1 + m.punch, 1], EASE)
    : 1;
  return {
    scale: interp(frame, [0, dur], [baseZoom, baseZoom + m.zoomDelta]) * punch,
    tx: interp(frame, [0, dur], [0, m.panX * panPx]),
    ty: interp(frame, [0, dur], [0, m.panY * panPx]),
    rotate: 0,
  };
}

/**
 * The FIT-media damping from clip-media.tsx: a contained photo must read as an intentionally framed
 * object, so the cover Ken-Burns collapses to a gentle centered breathe (22% of the zoom, no pan/spin).
 */
export function dampForFit(move: Move): Move {
  return { scale: 1 + (move.scale - 1) * 0.22, tx: 0, ty: 0, rotate: 0 };
}
