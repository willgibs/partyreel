"use client";

import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { HEAD, useSlide } from "../../deck/deck";
import { alpha, type Ground, Readout } from "../system";
import { useInk } from "../take";
import { useMeasure } from "./parts";

/**
 * THE PIECES SLIDES 02, 03 AND 04 SHARE (the idea, the marks, colour and
 * status): where the room gives way to paper at a desk, a hairline in a
 * ground's own ink, a headline fitted to its column, and a specification's
 * rows.
 */

/**
 * WHERE THE ROOM GIVES WAY TO PAPER AT A DESK: the cover's own cut, so the
 * system slides that compare the two grounds side by side (the marks, colour)
 * keep the line the deck opened on.
 */
export const CUT = 820;

/**
 * The paper column's top at a desk. ★ THE RUNNING HEAD MUST READ ON WHAT IS
 * UNDER IT: the deck draws a slide's head light unless its tone says "split",
 * which draws the head's right half dark over paper. So the paper reaches the
 * top only where the deck draws this slide's head split; anywhere else it
 * starts under the head's band, which stays the room.
 */
export function usePaperTop(): number {
  const { vision, id, screen } = useSlide();
  if (screen !== "1440") return 0;
  return vision.tone?.[id] === "split" ? 0 : HEAD["1440"];
}

/** A hairline in a ground's own ink: a rule that is the ink, thinned, never a grey of its own. */
export function useHairline(ground: Ground, pct = 14): string {
  const t = useInk(ground);
  return alpha(t.fg, pct);
}

/**
 * A HEADLINE FITTED TO ITS COLUMN, one line a line. ★ A TAKE'S HEADLINE IS ITS
 * OWN WORDS, so its length is not this slide's to know: each line is set
 * whole at `max` and the face is brought down until the widest line fits
 * `width`, measured off the drawn lines (they scale linearly with the size),
 * and measured again once the frame's faces have loaded.
 */
export function FitLines({
  lines,
  max,
  width,
  color,
  read,
  style,
}: {
  lines: readonly string[];
  max: number;
  width: number;
  color: string;
  read?: string;
  style?: CSSProperties;
}) {
  const box = useRef<HTMLHeadingElement | null>(null);
  const [size, setSize] = useState(max);
  const key = lines.join("\n");
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    let live = true;
    const fit = () => {
      if (!live) return;
      const now =
        parseFloat(
          el.ownerDocument.defaultView?.getComputedStyle(el).fontSize ?? "",
        ) || max;
      const widest = Math.max(
        1,
        ...[...el.children].map((c) => c.getBoundingClientRect().width),
      );
      setSize(Math.min(max, Math.floor(((now * width) / widest) * 10) / 10));
    };
    fit();
    void el.ownerDocument.fonts?.ready.then(fit);
    return () => {
      live = false;
    };
  }, [key, max, width]);
  return (
    <h2
      ref={box}
      className="ag-title"
      data-bd-read={read}
      style={{ fontSize: size, color, width, ...style }}
    >
      {lines.map((l) => (
        <span
          key={l}
          style={{
            display: "block",
            width: "max-content",
            whiteSpace: "nowrap",
          }}
        >
          {l}
        </span>
      ))}
    </h2>
  );
}

/**
 * A SPECIFICATION'S ROWS: a small label and its line, hairlines between, the
 * way a rule is written down. At a desk the label stands in its own column;
 * on a phone it stands over its line.
 */
export function SpecRows({
  ground,
  rows,
  label = 112,
  size,
  style,
}: {
  ground: Ground;
  rows: readonly (readonly [ReactNode, ReactNode])[];
  /** The label column's width at a desk (px). */
  label?: number;
  /** The line's size (px). */
  size?: number;
  style?: CSSProperties;
}) {
  const t = useInk(ground);
  const { desk } = useMeasure();
  const rule = useHairline(ground, 13);
  const fs = size ?? (desk ? 15 : 14.5);
  return (
    <div style={{ borderBottom: `1px solid ${rule}`, ...style }}>
      {rows.map(([k, v], i) => (
        <div
          key={i}
          style={{
            display: desk ? "grid" : "block",
            gridTemplateColumns: desk ? `${label}px 1fr` : undefined,
            columnGap: 20,
            padding: desk ? "13px 0 14px" : "12px 0 13px",
            borderTop: `1px solid ${rule}`,
          }}
        >
          <Readout
            style={{
              color: t.faint,
              display: "block",
              paddingTop: desk ? Math.round((fs * 1.5 - 14) / 2) : 0,
              marginBottom: desk ? 0 : 5,
            }}
          >
            {k}
          </Readout>
          <p
            className="ag-body"
            style={{
              fontSize: fs,
              lineHeight: 1.5,
              color: t.fg,
              textWrap: "pretty",
            }}
          >
            {v}
          </p>
        </div>
      ))}
    </div>
  );
}
