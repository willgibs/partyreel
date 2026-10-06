"use client";

import type { CSSProperties, ReactNode } from "react";

import { HEAD, useSlide } from "../../deck/deck";
import type { ScreenId } from "../../knobs";
import { Readout, type Ground } from "../system";
import { useInk } from "../take";

/**
 * THE PIECES EVERY SHARED SLIDE IS LAID OUT WITH, so fourteen slides drawn by
 * several hands read as one deck: the slide's measure (its margins and where
 * its words may start under the running head), its heading block, and a
 * caption.
 *
 * ★ THE DECK'S GRID. At a desk a slide has 64 px margins and its words start
 * 100 px down (the running head's 56 px band plus air); on a phone 20 px
 * margins and 76 px down. Type sits on the shared steps (`ag.css`): a slide
 * title is Urbanist 700 at 44 (desk) or 30 (phone), a lede Inter at 17 or 15.
 */

export type Measure = {
  screen: ScreenId;
  desk: boolean;
  /** The slide's own size. */
  w: number;
  h: number;
  /** Its side margin. */
  pad: number;
  /** Where its words may start, under the running head. */
  top: number;
  /** The width inside its margins. */
  inner: number;
};

/** The slide's measure, from inside a slide. */
export function useMeasure(): Measure {
  const { screen, w, h } = useSlide();
  const desk = screen === "1440";
  const pad = desk ? 64 : 20;
  return {
    screen,
    desk,
    w,
    h,
    pad,
    top: desk ? HEAD["1440"] + 44 : HEAD["375"] + 24,
    inner: w - pad * 2,
  };
}

/**
 * A SLIDE'S HEADING: its eyebrow (a readout in the faint ink), its title and
 * an optional lede, on its ground. The title wraps at `width`.
 */
export function Heading({
  ground,
  kicker,
  title,
  lede,
  width,
  size,
  style,
}: {
  ground: Ground;
  kicker?: string;
  title: ReactNode;
  lede?: ReactNode;
  width?: number;
  /** The title's size (px); default 44 at a desk, 30 on a phone. */
  size?: number;
  style?: CSSProperties;
}) {
  const t = useInk(ground);
  const { desk } = useMeasure();
  const s = size ?? (desk ? 44 : 30);
  return (
    <div style={{ width, ...style }}>
      {kicker ? (
        <Readout style={{ color: t.faint, display: "block" }}>{kicker}</Readout>
      ) : null}
      <h2
        className="ag-title"
        data-bd-read="title"
        style={{
          fontSize: s,
          marginTop: kicker ? (desk ? 14 : 10) : 0,
          color: t.fg,
          textWrap: "balance",
        }}
      >
        {title}
      </h2>
      {lede ? (
        <p
          className="ag-lede"
          style={{
            fontSize: desk ? 17 : 15,
            lineHeight: 1.5,
            color: t.muted,
            marginTop: desk ? 14 : 10,
            textWrap: "pretty",
          }}
        >
          {lede}
        </p>
      ) : null}
    </div>
  );
}

/** A caption: a short name in the display face, and its line. */
export function Caption({
  ground,
  name,
  children,
  width,
  size,
  style,
}: {
  ground: Ground;
  name?: ReactNode;
  children?: ReactNode;
  width?: number;
  size?: number;
  style?: CSSProperties;
}) {
  const t = useInk(ground);
  const { desk } = useMeasure();
  return (
    <div style={{ width, ...style }}>
      {name ? (
        <p
          className="ag-subtitle"
          style={{ fontSize: size ?? (desk ? 20 : 18), color: t.fg }}
        >
          {name}
        </p>
      ) : null}
      {children ? (
        <p
          className="ag-body"
          style={{
            color: t.muted,
            fontSize: desk ? 14 : 13.5,
            marginTop: name ? 4 : 0,
            textWrap: "pretty",
          }}
        >
          {children}
        </p>
      ) : null}
    </div>
  );
}

/** A small label over a drawing (where it is: "In the room", "On paper"). */
export function Label({
  ground,
  children,
  style,
}: {
  ground: Ground;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const t = useInk(ground);
  return (
    <Readout style={{ color: t.faint, display: "block", ...style }}>
      {children}
    </Readout>
  );
}
