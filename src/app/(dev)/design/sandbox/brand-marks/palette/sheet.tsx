"use client";

import type { ScreenId } from "../knobs";
import { EMBER_TOKENS, type Grade, type Ground } from "./grades";

/**
 * THE GRADE AS ITS TOKENS, by `globals.css`'s names: the room's ladder, the
 * well and the plate, paper's whites, each ground's three inks set on it, the
 * lines, and the ember's four stops. Every swatch is painted with the value
 * itself, so the sheet is the grade, not a picture of one.
 */

function Cap({ children }: { children: string }) {
  return (
    <span className="text-label font-semibold text-muted-foreground uppercase tabular-nums">
      {children}
    </span>
  );
}

/** One token: its swatch and its name, on the ground it belongs to. */
function Swatch({
  name,
  value,
  ink,
  w,
  read,
}: {
  name: string;
  value: string;
  ink: string;
  w: number;
  read?: string;
}) {
  return (
    <div
      className="flex flex-col justify-end"
      data-bm-read={read}
      data-bm-says={read ? value : undefined}
      style={{
        width: w,
        height: 92,
        padding: 10,
        borderRadius: 6,
        background: value,
        color: ink,
        boxShadow:
          "inset 0 0 0 1px color-mix(in oklab, currentColor 14%, transparent)",
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 600 }}>{name}</span>
      <span style={{ fontSize: 10.5, opacity: 0.72 }}>
        {value.replace("oklch", "")}
      </span>
    </div>
  );
}

/** A ground's three inks, set on it as words. */
function Inks({ g }: { g: Ground }) {
  return (
    <div
      className="flex items-baseline"
      style={{
        gap: 14,
        background: g.background,
        padding: "12px 14px",
        borderRadius: 6,
      }}
    >
      <span style={{ color: g.foreground, fontSize: 22, fontWeight: 600 }}>
        Aa
      </span>
      <span style={{ color: g.mutedForeground, fontSize: 22, fontWeight: 600 }}>
        Aa
      </span>
      <span style={{ color: g.faint, fontSize: 22, fontWeight: 600 }}>Aa</span>
      <span style={{ color: g.mutedForeground, fontSize: 12 }}>
        ink · muted · faint
      </span>
    </div>
  );
}

function Lines({ g }: { g: Ground }) {
  return (
    <div className="flex flex-col" style={{ gap: 10, padding: "4px 2px" }}>
      <span style={{ height: 1, background: g.border, width: "100%" }} />
      <span style={{ fontSize: 11, color: g.mutedForeground }}>--border</span>
      <span style={{ height: 1, background: g.input, width: "100%" }} />
      <span style={{ fontSize: 11, color: g.mutedForeground }}>--input</span>
    </div>
  );
}

export function GradeSheet({
  grade,
  screen,
}: {
  grade: Grade;
  screen: ScreenId;
}) {
  const desk = screen === "1440";
  const sw = desk ? 128 : 100;
  const room = grade.room;
  const paper = grade.paper;
  return (
    <div
      className="flex min-h-screen"
      style={{ flexDirection: desk ? "row" : "column" }}
    >
      <div
        className="flex flex-col"
        style={{
          flex: 1,
          background: room.background,
          color: room.foreground,
          padding: desk ? "44px 52px" : "26px 18px",
          gap: 22,
        }}
      >
        <span className="dark">
          <Cap>The room</Cap>
        </span>
        <div className="flex flex-wrap" style={{ gap: 10 }}>
          <Swatch
            name="--gallery"
            value={grade.well}
            ink={room.foreground}
            w={sw}
          />
          <Swatch
            name="--background"
            value={room.background}
            ink={room.foreground}
            w={sw}
            read="the room's black"
          />
          <Swatch
            name="--card"
            value={room.card}
            ink={room.foreground}
            w={sw}
          />
          <Swatch
            name="--popover"
            value={room.popover}
            ink={room.foreground}
            w={sw}
          />
          <Swatch
            name="--display"
            value={room.display}
            ink={room.foreground}
            w={sw}
          />
        </div>
        <Inks g={room} />
        <Lines g={room} />
        <div className="flex flex-col" style={{ gap: 10 }}>
          <span style={{ fontSize: 12, color: room.mutedForeground }}>
            The house ember, --ember-1 to 4
          </span>
          <div
            style={{
              height: 44,
              borderRadius: 6,
              background: `linear-gradient(in oklab 90deg, ${EMBER_TOKENS.join(", ")})`,
            }}
          />
        </div>
      </div>
      <div
        className="flex flex-col"
        style={{
          flex: 1,
          background: paper.background,
          color: paper.foreground,
          padding: desk ? "44px 52px" : "26px 18px",
          gap: 22,
        }}
      >
        <span className="surface-paper">
          <Cap>Paper</Cap>
        </span>
        <div className="flex flex-wrap" style={{ gap: 10 }}>
          <Swatch
            name="--background"
            value={paper.background}
            ink={paper.foreground}
            w={sw}
            read="paper's white"
          />
          <Swatch
            name="--card"
            value={paper.card}
            ink={paper.foreground}
            w={sw}
          />
          <Swatch
            name="--muted"
            value={paper.muted}
            ink={paper.foreground}
            w={sw}
          />
          <Swatch
            name="--foreground"
            value={paper.foreground}
            ink={paper.background}
            w={sw}
          />
          <Swatch
            name="the plate"
            value={grade.plate.background}
            ink={room.foreground}
            w={sw}
            read="the plate on paper"
          />
        </div>
        <Inks g={paper} />
        <Lines g={paper} />
        <div
          className="flex items-center"
          style={{
            gap: 16,
            padding: 16,
            borderRadius: 10,
            background: grade.plate.background,
            color: room.foreground,
          }}
        >
          <span
            style={{
              width: 44,
              height: 44,
              borderRadius: 99,
              background: grade.plate.card,
              boxShadow: `0 0 0 3px ${EMBER_TOKENS[1]}`,
            }}
          />
          <span style={{ fontSize: 13, color: room.mutedForeground }}>
            A piece of the room on paper: the plate, its light inside it.
          </span>
        </div>
      </div>
    </div>
  );
}
