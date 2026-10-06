"use client";

import type { CSSProperties, ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import { PARTY, type PhotoId, Seeded } from "../../deck/media";
import { StatusLight } from "../kit";
import { SlideRoot } from "../root";
import {
  duskGradient,
  type Ground,
  LitPhoto,
  ROOM,
  type Source,
  STATUS,
  type StatusId,
  type Tone,
} from "../system";
import { groundOf, inkOf, useTake } from "../take";
import { CUT, useHairline, usePaperTop } from "./a-parts";
import { useMeasure } from "./parts";

/**
 * 04 COLOUR AND STATUS: THE GROUNDS, WHERE COLOUR COMES FROM, AND A STATE.
 *
 * One table read across the cut: every row is drawn in the room on the left
 * and on this take's paper on the right, so each thing meets its paper form
 * on one line. The grounds and their three inks; colour's three sources in
 * their order (the photographs, the seed, the house's one ember), each lit by
 * the take's own Ring and receipt on both grounds; and status, a point and
 * its word, never a light.
 *
 * ★ PAPER BREATHES (the creative director's pass): the paper column carries
 * no heads and no values, only each thing's paper form and the take's one
 * line about it; a ground's oklch is printed on the two grounds alone.
 */

/** A photograph whose light is plainly two of its own colours: the hall's blue bunting and its warm wood. */
const PHOTO: PhotoId = "reception-hall";

type SourceRow = {
  key: string;
  name: string;
  line: string;
  source: Source;
};

const SOURCES: readonly SourceRow[] = [
  {
    key: "photo",
    name: "The photographs",
    line: "Sampled from what is on the screen, never louder than it.",
    source: { photo: PHOTO },
  },
  {
    key: "seed",
    name: "The seed",
    line: "Before the first photograph: the event's own hue.",
    source: { seed: PARTY.seed },
  },
  {
    key: "house",
    name: "The house",
    line: "Where there is neither: the icon's own ember, never a spectrum.",
    source: { house: true },
  },
];

const STATES: readonly { id: StatusId; word: string }[] = [
  { id: "standby", word: "3 waiting for you" },
  { id: "ready", word: "12 approved" },
  { id: "fault", word: "1 upload failed" },
];

const short = (t: Tone) => `oklch ${t.l} ${t.c} ${t.h}`;

/** The source itself, drawn: its photograph, its seed's orb, or the one ember. */
function SourceArt({ row, w, h }: { row: SourceRow; w: number; h: number }) {
  if (row.key === "photo")
    return (
      <LitPhoto id={PHOTO} ground="room" style={{ width: w, height: h }} />
    );
  if (row.key === "seed")
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: w, height: h }}
      >
        <Seeded seed={PARTY.seed} style={{ width: h, height: h }} />
      </div>
    );
  // The house is ONE ember, lit from the key at the top-left and deepening
  // as it turns away: one strip in one direction, never lamps side by side.
  return (
    <div
      aria-label="The house's ember"
      role="img"
      style={{
        width: w,
        height: h,
        borderRadius: 2,
        background: duskGradient("135deg"),
      }}
    />
  );
}

/**
 * A GROUND'S SWATCH: the tone itself and its name inside it in the ground's
 * own inks. Where it is the ground words sit on, it also carries the three
 * ink steps as "Aa" and its one oklch value.
 */
function Swatch({
  name,
  tone,
  ground,
  main,
  w,
  h,
}: {
  name: string;
  tone: Tone;
  ground: Ground;
  /** The ground itself: its inks and its value are printed on it. */
  main?: boolean;
  w: number;
  h: number;
}) {
  const t = inkOf(useTake(), ground);
  const edge =
    ground === "room" ? "rgb(255 255 255 / 0.11)" : "rgb(20 20 22 / 0.1)";
  return (
    <div
      className="relative"
      style={{
        width: w,
        height: h,
        background: tone.hex,
        borderRadius: 6,
        boxShadow: `inset 0 0 0 1px ${edge}`,
      }}
    >
      {main ? (
        <span
          className="absolute flex items-baseline"
          style={{ left: 14, top: 10, gap: 10 }}
        >
          {(["fg", "muted", "faint"] as const).map((k) => (
            <span
              key={k}
              className="ag-subtitle"
              style={{ color: t[k], fontSize: 24 }}
            >
              Aa
            </span>
          ))}
        </span>
      ) : null}
      <span className="absolute" style={{ left: 14, bottom: 11 }}>
        <span
          className="block"
          style={{ color: t.fg, fontSize: 13, fontWeight: 600 }}
        >
          {name}
        </span>
        {main ? (
          <span
            className="ag-num block"
            style={{
              color: t.faint,
              fontSize: 11,
              letterSpacing: "0.01em",
              marginTop: 1,
            }}
          >
            {short(tone)}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** A source's light on one ground: the take's Ring round the shutter, and its receipt. */
function Lit({
  source,
  ground,
  ring,
  receipt,
  gap,
}: {
  source: Source;
  ground: Ground;
  ring: number;
  receipt: number;
  gap: number;
}) {
  const { Ring, Receipt } = useTake().light;
  return (
    <div className="flex items-center" style={{ gap }}>
      <Ring source={source} ground={ground} size={ring} glyph="add" />
      <Receipt source={source} ground={ground} width={receipt} height={8} />
    </div>
  );
}

/** One of the slide's two statements, set as a heading over its rows (never a label in capitals). */
function Statement({
  children,
  size,
  style,
}: {
  children: ReactNode;
  size: number;
  style?: CSSProperties;
}) {
  const t = inkOf(useTake(), "room");
  return (
    <p
      className="ag-subtitle"
      style={{ fontSize: size, color: t.fg, ...style }}
    >
      {children}
    </p>
  );
}

export function ColorSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const paperTop = usePaperTop();
  const room = inkOf(take, "room");
  const paper = inkOf(take, "paper");
  const roomRule = useHairline("room", 12);
  const paperRule = useHairline("paper", 12);
  const { Ring } = take.light;

  if (m.desk) {
    const px = CUT + m.pad;
    const rw = CUT - m.pad - 56;
    const pw = m.w - m.pad - px;
    // Three bands, each read across the cut.
    const swH = 96;
    const b = m.top + swH + 48;
    const rows = b + 40;
    const rowH = 100;
    const c = rows + rowH * 3 + 44;
    const states = c + 40;
    const stateH = 40;
    const art = { w: 120, h: 80 };
    const ring = 40;
    // The paper forms keep a column of their own; the take's line stands
    // beside it, with air between.
    const fw = 236;
    return (
      <SlideRoot screen={screen} ground="room">
        <div
          className="absolute"
          style={{
            left: CUT,
            top: paperTop,
            right: 0,
            bottom: 0,
            background: groundOf(take, "paper").hex,
          }}
        />

        {/* The grounds. */}
        <div
          className="absolute flex"
          style={{ left: m.pad, top: m.top, gap: 16 }}
        >
          {(
            [
              ["Room", ROOM.room, true],
              ["Card", ROOM.card, false],
              ["Display", ROOM.display, false],
              ["Well", ROOM.well, false],
            ] as const
          ).map(([name, tone, main]) => (
            <Swatch
              key={name}
              name={name}
              tone={tone}
              ground="room"
              main={main}
              w={(rw - 48) / 4}
              h={swH}
            />
          ))}
        </div>
        <div
          className="absolute flex"
          style={{ left: px, top: m.top, gap: 16 }}
        >
          <Swatch
            name={`Paper · ${take.paper.name}`}
            tone={take.paper.ground}
            ground="paper"
            main
            w={Math.round((pw - 16) * 0.58)}
            h={swH}
          />
          <Swatch
            name="Card"
            tone={take.paper.card}
            ground="paper"
            w={Math.round((pw - 16) * 0.42)}
            h={swH}
          />
        </div>

        {/* Colour is light, and it has a source. */}
        <Statement
          size={19}
          style={{ position: "absolute", left: m.pad, top: b }}
        >
          Colour is light, and it has a source.
        </Statement>
        {SOURCES.map((row, i) => {
          const y = rows + i * rowH;
          return (
            <div key={row.key}>
              <div
                className="absolute flex items-center"
                style={{
                  left: m.pad,
                  top: y,
                  width: rw,
                  height: rowH,
                  gap: 22,
                  borderTop: `1px solid ${roomRule}`,
                }}
              >
                <SourceArt row={row} w={art.w} h={art.h} />
                <div style={{ width: 270 }}>
                  <p
                    className="ag-subtitle"
                    style={{ fontSize: 17, color: room.fg }}
                  >
                    <span
                      className="ag-num"
                      style={{ color: room.faint, marginRight: 8 }}
                    >
                      {i + 1}
                    </span>
                    {row.name}
                  </p>
                  <p
                    className="ag-body"
                    style={{
                      fontSize: 13.5,
                      color: room.muted,
                      marginTop: 3,
                      textWrap: "pretty",
                    }}
                  >
                    {row.line}
                  </p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <Lit
                    source={row.source}
                    ground="room"
                    ring={ring}
                    receipt={112}
                    gap={30}
                  />
                </div>
              </div>
              <div
                className="absolute flex items-center"
                style={{
                  left: px,
                  top: y,
                  width: fw,
                  height: rowH,
                  borderTop: `1px solid ${paperRule}`,
                }}
              >
                <div style={{ marginLeft: 16 }}>
                  <Lit
                    source={row.source}
                    ground="paper"
                    ring={ring}
                    receipt={104}
                    gap={36}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div
          className="absolute"
          style={{
            left: m.pad,
            top: rows + rowH * 3,
            width: rw,
            borderTop: `1px solid ${roomRule}`,
          }}
        />
        <div
          className="absolute"
          style={{
            left: px,
            top: rows + rowH * 3,
            width: fw,
            borderTop: `1px solid ${paperRule}`,
          }}
        />
        <div
          className="absolute flex items-center"
          style={{
            left: px + fw + 44,
            top: rows,
            width: pw - fw - 44,
            height: rowH * 3,
          }}
        >
          <p
            className="ag-body"
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: paper.muted,
              textWrap: "pretty",
            }}
          >
            {take.words.colourPaper}
          </p>
        </div>

        {/* Status: a point and its word. */}
        <Statement
          size={19}
          style={{ position: "absolute", left: m.pad, top: c }}
        >
          Status is a point and its word.
        </Statement>
        {STATES.map((s, i) => {
          const y = states + i * stateH;
          const st = STATUS[s.id];
          return (
            <div key={s.id}>
              <div
                className="absolute flex items-center"
                style={{
                  left: m.pad,
                  top: y,
                  width: rw,
                  height: stateH,
                  borderTop: `1px solid ${roomRule}`,
                }}
              >
                <span style={{ width: 210 }}>
                  <StatusLight state={s.id} ground="room">
                    {s.word}
                  </StatusLight>
                </span>
                <span
                  className="ag-body"
                  style={{
                    width: 92,
                    fontSize: 14,
                    fontWeight: 600,
                    color: room.fg,
                  }}
                >
                  {st.name}
                </span>
                <span
                  className="ag-body"
                  style={{ flex: 1, fontSize: 13.5, color: room.muted }}
                >
                  {st.means}
                </span>
              </div>
              <div
                className="absolute flex items-center"
                style={{
                  left: px,
                  top: y,
                  width: fw,
                  height: stateH,
                  borderTop: `1px solid ${paperRule}`,
                }}
              >
                <StatusLight
                  state={s.id}
                  ground="paper"
                  contrast={
                    s.id === "ready" ? "ready point on paper" : undefined
                  }
                  wordContrast={
                    s.id === "standby" ? "status word on paper" : undefined
                  }
                >
                  {s.word}
                </StatusLight>
              </div>
            </div>
          );
        })}
        <div
          className="absolute"
          style={{
            left: m.pad,
            top: states + stateH * 3,
            width: rw,
            borderTop: `1px solid ${roomRule}`,
          }}
        />
        <div
          className="absolute"
          style={{
            left: px,
            top: states + stateH * 3,
            width: fw,
            borderTop: `1px solid ${paperRule}`,
          }}
        />
        <p
          className="ag-caption absolute"
          style={{
            left: m.pad,
            top: states + stateH * 3 + 14,
            width: rw,
            color: room.faint,
          }}
        >
          Waiting was amber, and read as the brand. Now it is the camera&apos;s
          standby: half-lit, with no hue.
        </p>
      </SlideRoot>
    );
  }

  // The phone: the room above, every row in its room form; the cut; paper
  // below, every row in its paper form, with the air paper is given.
  const cut = 1016;
  const sw = (m.inner - 14) / 2;
  return (
    <SlideRoot screen={screen} ground="room">
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: cut, background: groundOf(take, "paper").hex }}
      />
      <div
        className="absolute flex flex-col"
        style={{ left: m.pad, top: m.top, width: m.inner }}
      >
        <div className="grid grid-cols-2" style={{ gap: 14 }}>
          <Swatch
            name="Room"
            tone={ROOM.room}
            ground="room"
            main
            w={sw}
            h={90}
          />
          <Swatch name="Card" tone={ROOM.card} ground="room" w={sw} h={90} />
          <Swatch
            name="Display"
            tone={ROOM.display}
            ground="room"
            w={sw}
            h={90}
          />
          <Swatch name="Well" tone={ROOM.well} ground="room" w={sw} h={90} />
        </div>
        <Statement size={18} style={{ marginTop: 42 }}>
          Colour is light, and it has a source.
        </Statement>
        <div className="flex flex-col" style={{ marginTop: 14 }}>
          {SOURCES.map((row, i) => (
            <div
              key={row.key}
              className="flex items-center"
              style={{
                gap: 14,
                padding: "15px 0",
                borderTop: `1px solid ${roomRule}`,
              }}
            >
              <SourceArt row={row} w={84} h={56} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="ag-subtitle"
                  style={{ fontSize: 16, color: room.fg }}
                >
                  <span
                    className="ag-num"
                    style={{ color: room.faint, marginRight: 7 }}
                  >
                    {i + 1}
                  </span>
                  {row.name}
                </p>
                <p
                  className="ag-body"
                  style={{
                    fontSize: 13,
                    color: room.muted,
                    marginTop: 2,
                    textWrap: "pretty",
                  }}
                >
                  {row.line}
                </p>
              </div>
              <div style={{ marginRight: 8 }}>
                <Ring source={row.source} ground="room" size={32} glyph="add" />
              </div>
            </div>
          ))}
        </div>
        <Statement size={18} style={{ marginTop: 38 }}>
          Status is a point and its word.
        </Statement>
        <div className="flex flex-col" style={{ marginTop: 14 }}>
          {STATES.map((s) => (
            <div
              key={s.id}
              style={{ padding: "12px 0", borderTop: `1px solid ${roomRule}` }}
            >
              <StatusLight state={s.id} ground="room">
                {s.word}
              </StatusLight>
              <p
                className="ag-body"
                style={{ fontSize: 13, color: room.muted, marginTop: 5 }}
              >
                <span style={{ color: room.fg, fontWeight: 600 }}>
                  {STATUS[s.id].name}
                </span>
                {" · "}
                {STATUS[s.id].means}
              </p>
            </div>
          ))}
        </div>
        <p className="ag-caption" style={{ marginTop: 14, color: room.faint }}>
          Waiting was amber, and read as the brand. Now it is the camera&apos;s
          standby: half-lit, with no hue.
        </p>
      </div>

      <div
        className="absolute flex flex-col"
        style={{ left: m.pad, top: cut + 44, width: m.inner }}
      >
        <div className="flex" style={{ gap: 14 }}>
          <Swatch
            name={take.paper.name}
            tone={take.paper.ground}
            ground="paper"
            main
            w={sw}
            h={90}
          />
          <Swatch
            name="Card"
            tone={take.paper.card}
            ground="paper"
            w={sw}
            h={90}
          />
        </div>
        <p
          className="ag-body"
          style={{
            fontSize: 14,
            color: paper.muted,
            marginTop: 44,
            textWrap: "pretty",
          }}
        >
          {take.words.colourPaper}
        </p>
        <div className="flex flex-col" style={{ marginTop: 16 }}>
          {SOURCES.map((row) => (
            <div
              key={row.key}
              className="flex items-center"
              style={{
                gap: 20,
                padding: "18px 0",
                borderTop: `1px solid ${paperRule}`,
              }}
            >
              <SourceArt row={row} w={54} h={36} />
              <div style={{ marginLeft: 8 }}>
                <Lit
                  source={row.source}
                  ground="paper"
                  ring={32}
                  receipt={110}
                  gap={34}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col" style={{ marginTop: 44 }}>
          {STATES.map((s) => (
            <div
              key={s.id}
              style={{ padding: "13px 0", borderTop: `1px solid ${paperRule}` }}
            >
              <StatusLight
                state={s.id}
                ground="paper"
                contrast={s.id === "ready" ? "ready point on paper" : undefined}
                wordContrast={
                  s.id === "standby" ? "status word on paper" : undefined
                }
              >
                {s.word}
              </StatusLight>
            </div>
          ))}
        </div>
      </div>
    </SlideRoot>
  );
}
