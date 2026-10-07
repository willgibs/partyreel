"use client";

import type { CSSProperties, ReactNode } from "react";

import { EMBER } from "../icon/light";
import type { ScreenId } from "../knobs";
import {
  cssOf,
  EMBER_TOKENS,
  floors,
  type Grade,
  GRADES,
  LAMPS_AS_EMBER,
  type Reading,
  themeColor,
  type Tone,
} from "./grades";

/**
 * THE GRADE AS ITS TOKENS, READ AT A GLANCE, by `globals.css`'s names: each
 * ground's ladder, deepest step first, one row a token with its value; the
 * three inks set on the surfaces they stand on, each ratio printed in its
 * own ink; the lines; on paper the two pieces of the room (the plate the
 * foot is made of, its seam lit with the ember, and the display a menu is
 * made of); and the ember's four stops with the five lamps relit along it.
 *
 * ★ PAINTED WITH THE VALUES THEMSELVES: the sheet's frame wears no paste, so
 * every colour here is the grade's own number, never a class's, and the
 * sheet is the grade, not a picture of one.
 *
 * ★ TODAY RIDES ALONG: where a grade moves a step off graphite, a strip of
 * today's value runs down the ladder's left edge, so a cast or a step deeper
 * is read beside what is built rather than remembered.
 *
 * ★ IT FITS ITS FRAME: 620 tall at a desk, 1280 on a phone (`story.tsx`), so
 * a row added here is a row taken from somewhere else.
 */

const TODAY = GRADES.graphite;

/** Both ladders stand as tall (the room's nine steps, paper's six), so the rows below line up across the sheet. */
const LADDER = 171;

/** A value as the sheet prints it: the numbers globals.css writes inside `oklch()`. */
const short = (t: Tone) =>
  `${t.l} ${t.c} ${t.h}${t.a === undefined ? "" : ` / ${t.a}%`}`;

/** A ratio, to two places under ten, where a floor is read. */
const times = (r: number) => (r >= 10 ? r.toFixed(1) : r.toFixed(2));

const same = (a: Tone, b: Tone) => cssOf(a) === cssOf(b);

const tabular: CSSProperties = { fontVariantNumeric: "tabular-nums" };

/** The readout's voice: what a camera prints. */
function Cap({ ink, children }: { ink: Tone; children: ReactNode }) {
  return (
    <span
      style={{
        color: cssOf(ink),
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </span>
  );
}

function Head({
  name,
  where,
  bar,
  ink,
}: {
  name: string;
  where: string;
  bar: string;
  ink: Tone;
}) {
  return (
    <div className="flex items-baseline justify-between" style={{ gap: 12 }}>
      <Cap ink={ink}>{name}</Cap>
      {/* One string: an entity in a JSX text after a sibling is the shape the
          build drops a space from (jsx-text-space-policy.test.ts). */}
      <span style={{ color: cssOf(ink), fontSize: 11, ...tabular }}>
        {`${where} · the browser’s bar ${bar}`}
      </span>
    </div>
  );
}

type Step = { name: string; tone: Tone; was: Tone; read?: string };

/**
 * A ground's surfaces as one ladder, deepest at the top, so every parting is
 * an edge and every name reads whole. Both grounds' ladders stand the same
 * height, so the rows under them line up across the sheet.
 */
function Ladder({
  steps,
  ink,
  quiet,
  height,
}: {
  steps: readonly Step[];
  ink: Tone;
  quiet: Tone;
  height: number;
}) {
  const moved = steps.some((s) => !same(s.tone, s.was));
  const row = height / steps.length;
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div style={{ borderRadius: 8, overflow: "hidden" }}>
        {steps.map((s) => (
          <div
            key={s.name}
            className="flex items-center"
            data-bm-read={s.read}
            data-bm-says={s.read ? cssOf(s.tone) : undefined}
            style={{
              height: row,
              background: cssOf(s.tone),
              color: cssOf(ink),
              gap: 10,
            }}
          >
            {moved ? (
              <span
                aria-hidden
                style={{
                  alignSelf: "stretch",
                  width: 28,
                  flex: "none",
                  background: cssOf(s.was),
                }}
              />
            ) : null}
            <span
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                paddingLeft: moved ? 0 : 10,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              {s.name}
            </span>
            <span
              style={{
                paddingRight: 10,
                fontSize: 10,
                opacity: 0.72,
                whiteSpace: "nowrap",
                ...tabular,
              }}
            >
              {short(s.tone)}
            </span>
          </div>
        ))}
      </div>
      <span style={{ color: cssOf(quiet), fontSize: 10.5 }}>
        {moved
          ? "Deepest first. The strip at the left of each step is graphite's, today."
          : "Deepest first, exactly as production declares them."}
      </span>
    </div>
  );
}

type Inks = readonly [Tone, Tone, Tone];

/** A surface's three inks set on it, each ratio printed in its own ink. */
function InkSet({
  label,
  on,
  inks,
  reading,
  desk,
}: {
  label: string;
  on: Tone;
  inks: Inks;
  reading: Reading;
  desk: boolean;
}) {
  const ratios = [reading.ink, reading.muted, reading.faint];
  return (
    <div
      style={{
        flex: "1 1 0",
        minWidth: 0,
        background: cssOf(on),
        borderRadius: 8,
        padding: desk ? "9px 12px 11px" : "8px 9px 9px",
      }}
    >
      <div
        style={{
          color: cssOf(inks[1]),
          fontSize: 10.5,
          marginBottom: 4,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
      <div className="flex" style={{ gap: desk ? 16 : 9 }}>
        {inks.map((t, i) => (
          <div key={i} style={{ color: cssOf(t) }}>
            <div
              style={{
                fontSize: desk ? 24 : 18,
                fontWeight: 600,
                lineHeight: 1.15,
              }}
            >
              Aa
            </div>
            <div style={{ fontSize: 11, marginTop: 2, ...tabular }}>
              {times(ratios[i])}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InkRow({
  ink,
  children,
  desk,
}: {
  ink: Tone;
  children: ReactNode;
  desk: boolean;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <div className="flex" style={{ gap: desk ? 10 : 6 }}>
        {children}
      </div>
      <span style={{ color: cssOf(ink), fontSize: 10.5 }}>
        <Name>--foreground</Name>, <Name>--muted-foreground</Name>,{" "}
        <Name>--faint</Name> on each, the ratio in its own ink; the floor is{" "}
        <Name>--faint</Name> at 4.5:1.
      </span>
    </div>
  );
}

/** A token's name never breaks at its dashes. */
function Name({ children }: { children: string }) {
  return <span style={{ whiteSpace: "nowrap" }}>{children}</span>;
}

/** The lines, drawn as the hairlines they are, with their values. */
function Lines({
  lines,
  ink,
}: {
  lines: readonly { name: string; tone: Tone }[];
  ink: Tone;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 9 }}>
      {lines.map((l) => (
        <div key={l.name} className="flex items-center" style={{ gap: 12 }}>
          <span style={{ flex: 1, height: 1, background: cssOf(l.tone) }} />
          <span
            style={{ color: cssOf(ink), fontSize: 10.5, whiteSpace: "nowrap" }}
          >
            {l.name} <span style={tabular}>{short(l.tone)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/** The ember's stops where they stand along it, mixed in oklab as the Ring mixes them. */
const EMBER_LINE = `linear-gradient(90deg in oklab, ${EMBER.map((s, i) => `${EMBER_TOKENS[i]} ${s.t * 100}%`).join(", ")})`;

/** `oklch(0.87 0.15 80)` as the sheet prints it. */
const bare = (css: string) => css.replace(/^oklch\(|\)$/g, "");

/** The house ember, its four stops where they stand, and the five lamps relit along it. */
function Ember({
  ink,
  quiet,
  desk,
}: {
  ink: Tone;
  quiet: Tone;
  desk: boolean;
}) {
  return (
    <div className="flex flex-col" style={{ gap: 6 }}>
      <span style={{ color: cssOf(quiet), fontSize: 10.5 }}>
        The house ember, <Name>--ember-1</Name> to 4, with the five lamps relit
        along it
      </span>
      <div style={{ position: "relative", paddingBottom: 30 }}>
        <div style={{ height: 30, borderRadius: 6, background: EMBER_LINE }} />
        {EMBER.map((s, i) => (
          <span
            key={`stop-${i}`}
            className="flex flex-col"
            style={{
              position: "absolute",
              top: 35,
              left: `${s.t * 100}%`,
              transform: `translateX(${s.t === 0 ? "0" : s.t === 1 ? "-100%" : "-50%"})`,
              alignItems:
                s.t === 0 ? "flex-start" : s.t === 1 ? "flex-end" : "center",
              color: cssOf(ink),
              fontSize: 10,
              lineHeight: 1.3,
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontWeight: 600 }}>--ember-{i + 1}</span>
            <span style={{ color: cssOf(quiet), ...tabular }}>
              {bare(EMBER_TOKENS[i])}
            </span>
          </span>
        ))}
      </div>
      <div className="flex" style={{ gap: 6, marginTop: 8 }}>
        {LAMPS_AS_EMBER.map((t, i) => (
          <div
            key={t}
            className="flex items-center"
            style={{ flex: "1 1 0", minWidth: 0, gap: 6 }}
          >
            <span
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                flex: "none",
                background: t,
              }}
            />
            <span
              className="flex flex-col"
              style={{
                minWidth: 0,
                color: cssOf(quiet),
                fontSize: 10,
                lineHeight: 1.3,
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <span style={{ color: cssOf(ink) }}>--lamp-{i + 1}</span>
              {/* A phone's fifth of a row holds the name alone. */}
              {desk ? <span style={tabular}>{bare(t)}</span> : null}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * A PIECE OF THE ROOM ON PAPER: its ground, its inks and their ratios, the
 * step it carries; the plate with the foot's seam lit inside it, the light
 * never on the page itself.
 */
function Piece({
  name,
  value,
  ground,
  step,
  stepName,
  inks,
  reading,
  seam,
  read,
  desk,
}: {
  name: string;
  value: Tone;
  ground: Tone;
  step: Tone;
  stepName: string;
  inks: Inks;
  reading: Reading;
  seam?: boolean;
  read?: string;
  desk: boolean;
}) {
  const ratios = [reading.ink, reading.muted, reading.faint];
  return (
    <div
      data-bm-read={read}
      data-bm-says={read ? cssOf(value) : undefined}
      style={{
        position: "relative",
        overflow: "hidden",
        // ★ Side by side at a desk, stacked on a phone; stacked, a share of
        // nothing (`1 1 0` with `overflow: hidden`) would fold it to a line.
        flex: desk ? "1 1 0" : "none",
        minWidth: 0,
        background: cssOf(ground),
        borderRadius: 10,
        padding: desk ? "14px 14px 12px" : "12px 11px 11px",
        color: cssOf(inks[0]),
      }}
    >
      {seam ? (
        <>
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: "6%",
              right: "6%",
              top: -26,
              height: 44,
              background: EMBER_LINE,
              filter: "blur(16px)",
              opacity: 0.5,
            }}
          />
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              height: 1.5,
              background: EMBER_LINE,
            }}
          />
        </>
      ) : null}
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: 11, fontWeight: 600 }}>{name}</div>
        <div
          style={{
            color: cssOf(inks[1]),
            fontSize: 9.5,
            marginBottom: 7,
            ...tabular,
          }}
        >
          {short(value)}
        </div>
        <div className="flex items-end" style={{ gap: desk ? 14 : 9 }}>
          {inks.map((t, i) => (
            <div key={i} style={{ color: cssOf(t) }}>
              <div
                style={{
                  fontSize: desk ? 22 : 18,
                  fontWeight: 600,
                  lineHeight: 1.15,
                }}
              >
                Aa
              </div>
              <div style={{ fontSize: 11, marginTop: 2, ...tabular }}>
                {times(ratios[i])}
              </div>
            </div>
          ))}
          <div
            style={{
              marginLeft: "auto",
              background: cssOf(step),
              borderRadius: 6,
              padding: "6px 8px",
              minWidth: 0,
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 600 }}>{stepName}</div>
            <div
              style={{
                color: cssOf(inks[1]),
                fontSize: 9.5,
                whiteSpace: "nowrap",
                ...tabular,
              }}
            >
              {short(step)}
            </div>
          </div>
        </div>
      </div>
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
  const { room, paper, slab, mat, display, gallery } = grade;
  const bar = themeColor(grade);
  const on = floors(grade);
  const half: CSSProperties = {
    // Equal halves side by side at a desk; stacked on a phone, each its own
    // height, the last one growing to the frame's foot.
    flex: desk ? "1 1 0" : "1 0 auto",
    minWidth: 0,
    padding: desk ? "26px 34px 26px" : "20px 16px 22px",
    gap: desk ? 15 : 14,
  };
  return (
    <div
      className="flex min-h-screen"
      style={{ flexDirection: desk ? "row" : "column" }}
    >
      <div
        className="flex flex-col"
        style={{ ...half, background: cssOf(room.background) }}
      >
        <Head
          name="The room"
          where=".dark"
          bar={bar.room}
          ink={room.mutedForeground}
        />
        <Ladder
          height={LADDER}
          ink={room.foreground}
          quiet={room.faint}
          steps={[
            { name: "--gallery", tone: gallery.well, was: TODAY.gallery.well },
            {
              name: "--background",
              tone: room.background,
              was: TODAY.room.background,
              read: "the room's black",
            },
            { name: "--muted", tone: room.muted, was: TODAY.room.muted },
            { name: "--card", tone: room.card, was: TODAY.room.card },
            { name: "--popover", tone: room.popover, was: TODAY.room.popover },
            {
              name: "--secondary",
              tone: room.secondary,
              was: TODAY.room.secondary,
            },
            { name: "--accent", tone: room.accent, was: TODAY.room.accent },
            {
              name: "--display",
              tone: display.room.display,
              was: TODAY.display.room.display,
            },
            {
              name: "--display-step",
              tone: display.room.step,
              was: TODAY.display.room.step,
            },
          ]}
        />
        <InkRow ink={room.faint} desk={desk}>
          <InkSet
            desk={desk}
            label="on --background"
            on={room.background}
            inks={[room.foreground, room.mutedForeground, room.faint]}
            reading={on.room}
          />
          <InkSet
            desk={desk}
            label="on --card"
            on={room.card}
            inks={[room.foreground, room.mutedForeground, room.faint]}
            reading={on.roomCard}
          />
          <InkSet
            desk={desk}
            label="on --display"
            on={display.room.display}
            inks={[
              display.room.foreground,
              display.room.muted,
              display.room.faint,
            ]}
            reading={on.roomScreen}
          />
        </InkRow>
        <Lines
          ink={room.faint}
          lines={[
            { name: "--border", tone: room.border },
            { name: "--input", tone: room.input },
          ]}
        />
        <Ember ink={room.mutedForeground} quiet={room.faint} desk={desk} />
      </div>
      <div
        className="flex flex-col"
        style={{ ...half, background: cssOf(paper.background) }}
      >
        <Head
          name="Paper"
          where=":root, .surface-paper"
          bar={bar.paper}
          ink={paper.mutedForeground}
        />
        <Ladder
          height={LADDER}
          ink={paper.foreground}
          quiet={paper.faint}
          steps={[
            { name: "--accent", tone: paper.accent, was: TODAY.paper.accent },
            {
              name: "--secondary",
              tone: paper.secondary,
              was: TODAY.paper.secondary,
            },
            {
              name: "--muted, the mat",
              tone: paper.muted,
              was: TODAY.paper.muted,
            },
            {
              name: "--background",
              tone: paper.background,
              was: TODAY.paper.background,
              read: "paper's white",
            },
            { name: "--card", tone: paper.card, was: TODAY.paper.card },
            {
              name: "--popover",
              tone: paper.popover,
              was: TODAY.paper.popover,
            },
          ]}
        />
        <InkRow ink={paper.faint} desk={desk}>
          <InkSet
            desk={desk}
            label="on --background"
            on={paper.background}
            inks={[paper.foreground, paper.mutedForeground, paper.faint]}
            reading={on.paper}
          />
          <InkSet
            desk={desk}
            label="on --card"
            on={paper.card}
            inks={[paper.foreground, paper.mutedForeground, paper.faint]}
            reading={on.paperCard}
          />
          <InkSet
            desk={desk}
            label="on the mat"
            on={mat.background}
            inks={[paper.foreground, paper.mutedForeground, mat.faint]}
            reading={on.mat}
          />
        </InkRow>
        <Lines
          ink={paper.faint}
          lines={[
            { name: "--border", tone: paper.border },
            { name: "--input", tone: paper.input },
          ]}
        />
        <div className="flex flex-col" style={{ gap: 6 }}>
          <span style={{ color: cssOf(paper.faint), fontSize: 10.5 }}>
            Pieces of the room on paper, the light inside them
          </span>
          <div
            className="flex"
            style={{
              gap: desk ? 10 : 8,
              flexDirection: desk ? "row" : "column",
            }}
          >
            <Piece
              desk={desk}
              name="The plate, .surface-ink"
              value={slab.background}
              ground={slab.background}
              step={slab.card}
              stepName="its --card"
              inks={[slab.foreground, slab.mutedForeground, slab.faint]}
              reading={on.slab}
              seam
              read="the plate on paper"
            />
            <Piece
              desk={desk}
              name="The display, a menu on paper"
              value={display.paper.display}
              ground={display.paper.display}
              step={display.paper.step}
              stepName="--display-step"
              inks={[
                display.paper.foreground,
                display.paper.muted,
                display.paper.faint,
              ]}
              reading={on.paperScreen}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
