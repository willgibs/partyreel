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
import { Label, useMeasure } from "./parts";

/**
 * 04 COLOUR AND STATUS: THE GROUNDS, WHERE COLOUR COMES FROM, AND A STATE.
 *
 * One table read across the cut: every row is drawn in the room on the left
 * and on this take's paper on the right, so each thing meets its paper form
 * on one line. The grounds and their three inks; colour's three sources in
 * their order (the photographs, the seed, the house's one dusk sky), each
 * lit by the take's own Ring and receipt on both grounds; and status, a
 * point and its word, never a light.
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
    line: "Where there is neither: one dusk sky, never a spectrum.",
    source: { house: true },
  },
];

const STATES: readonly { id: StatusId; word: string }[] = [
  { id: "standby", word: "3 waiting for you" },
  { id: "ready", word: "12 approved" },
  { id: "fault", word: "1 upload failed" },
];

const short = (t: Tone) => `oklch ${t.l} ${t.c} ${t.h}`;

/** A state's value on a ground, as the system writes it (`terse` where a phone's line is short). */
const valueOf = (id: StatusId, g: Ground, terse = false) => {
  const v = STATUS[id][g];
  if (v) return short(v);
  return terse ? "No hue" : "No hue: the ground's ink";
};

/** The source itself, drawn: its photograph, its seed's orb, or the one sky. */
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
  // The house is ONE sky, lit from the key at the top-left and spent to
  // violet in its shadow: never five lamps laid side by side.
  return (
    <div
      aria-label="The house's dusk sky"
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
 * A GROUND'S SWATCH: the tone itself, its name and its oklch inside it in the
 * ground's own inks, and where it is the ground words sit on, the three ink
 * steps set on it as "Aa".
 */
function Swatch({
  name,
  tone,
  ground,
  inks,
  w,
  h,
}: {
  name: string;
  tone: Tone;
  ground: Ground;
  inks?: boolean;
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
      {inks ? (
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

/** A small column head over a table's column. */
function Head({
  ground,
  children,
  style,
}: {
  ground: Ground;
  children: ReactNode;
  style?: CSSProperties;
}) {
  return (
    <Label ground={ground} style={{ position: "absolute", ...style }}>
      {children}
    </Label>
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
    const a = m.top;
    const b = a + 176;
    const c = b + 368;
    const swH = 96;
    const art = { w: 120, h: 80 };
    const rowH = 104;
    const ring = 48;
    // The paper forms keep a column of their own; the take's line stands beside it.
    const fw = 252;
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
        <Head ground="room" style={{ left: m.pad, top: a }}>
          The grounds · the room
        </Head>
        <div
          className="absolute flex"
          style={{ left: m.pad, top: a + 28, gap: 16 }}
        >
          {(
            [
              ["Room", ROOM.room, true],
              ["Card", ROOM.card, false],
              ["Display", ROOM.display, false],
              ["Well", ROOM.well, false],
            ] as const
          ).map(([name, tone, inks]) => (
            <Swatch
              key={name}
              name={name}
              tone={tone}
              ground="room"
              inks={inks}
              w={(rw - 48) / 4}
              h={swH}
            />
          ))}
        </div>
        <Head ground="paper" style={{ left: px, top: a }}>
          Paper · {take.paper.name}
        </Head>
        <div
          className="absolute flex"
          style={{ left: px, top: a + 28, gap: 16 }}
        >
          <Swatch
            name="Paper"
            tone={take.paper.ground}
            ground="paper"
            inks
            w={(pw - 16) / 2}
            h={swH}
          />
          <Swatch
            name="Card"
            tone={take.paper.card}
            ground="paper"
            w={(pw - 16) / 2}
            h={swH}
          />
        </div>

        {/* Colour is light, and it has a source. */}
        <Head ground="room" style={{ left: m.pad, top: b }}>
          Colour is light, and it has a source
        </Head>
        <Head ground="paper" style={{ left: px, top: b }}>
          The same sources on paper
        </Head>
        {SOURCES.map((row, i) => {
          const y = b + 30 + i * rowH;
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
                <div style={{ width: 268 }}>
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
                    gap={38}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <div
          className="absolute flex items-center"
          style={{
            left: px + fw + 32,
            top: b + 30,
            width: pw - fw - 32,
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
        <div
          className="absolute"
          style={{
            left: px,
            top: b + 30 + rowH * 3,
            width: fw,
            borderTop: `1px solid ${paperRule}`,
          }}
        />
        <div
          className="absolute"
          style={{
            left: m.pad,
            top: b + 30 + rowH * 3,
            width: rw,
            borderTop: `1px solid ${roomRule}`,
          }}
        />

        {/* Status: a point and its word. */}
        <Head ground="room" style={{ left: m.pad, top: c }}>
          Status is a point and its word
        </Head>
        <Head ground="paper" style={{ left: px, top: c }}>
          The same states on paper
        </Head>
        {STATES.map((s, i) => {
          const y = c + 30 + i * 40;
          const st = STATUS[s.id];
          return (
            <div key={s.id}>
              <div
                className="absolute flex items-center"
                style={{
                  left: m.pad,
                  top: y,
                  width: rw,
                  height: 40,
                  borderTop: `1px solid ${roomRule}`,
                }}
              >
                <span style={{ width: 196 }}>
                  <StatusLight state={s.id} ground="room">
                    {s.word}
                  </StatusLight>
                </span>
                <span
                  className="ag-body"
                  style={{
                    width: 82,
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
                <span
                  className="ag-num"
                  style={{
                    width: 150,
                    fontSize: 12,
                    color: room.faint,
                    textAlign: "right",
                  }}
                >
                  {valueOf(s.id, "room")}
                </span>
              </div>
              <div
                className="absolute flex items-center"
                style={{
                  left: px,
                  top: y,
                  width: pw,
                  height: 40,
                  borderTop: `1px solid ${paperRule}`,
                }}
              >
                <span style={{ width: 220 }}>
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
                </span>
                <span
                  className="ag-num"
                  style={{
                    flex: 1,
                    fontSize: 12,
                    color: paper.faint,
                    textAlign: "right",
                  }}
                >
                  {valueOf(s.id, "paper")}
                </span>
              </div>
            </div>
          );
        })}
        <div
          className="absolute"
          style={{
            left: m.pad,
            top: c + 30 + 3 * 40,
            width: rw,
            borderTop: `1px solid ${roomRule}`,
          }}
        />
        <div
          className="absolute"
          style={{
            left: px,
            top: c + 30 + 3 * 40,
            width: pw,
            borderTop: `1px solid ${paperRule}`,
          }}
        />
        <p
          className="ag-caption absolute"
          style={{
            left: m.pad,
            top: c + 30 + 3 * 40 + 14,
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
  // below, every row in its paper form.
  const cut = 1010;
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
        <Label ground="room">The grounds · the room</Label>
        <div className="grid grid-cols-2" style={{ gap: 14, marginTop: 14 }}>
          <Swatch
            name="Room"
            tone={ROOM.room}
            ground="room"
            inks
            w={sw}
            h={86}
          />
          <Swatch name="Card" tone={ROOM.card} ground="room" w={sw} h={86} />
          <Swatch
            name="Display"
            tone={ROOM.display}
            ground="room"
            w={sw}
            h={86}
          />
          <Swatch name="Well" tone={ROOM.well} ground="room" w={sw} h={86} />
        </div>
        <Label ground="room" style={{ marginTop: 40 }}>
          Colour is light, and it has a source
        </Label>
        <div className="flex flex-col" style={{ marginTop: 12 }}>
          {SOURCES.map((row, i) => (
            <div
              key={row.key}
              className="flex items-center"
              style={{
                gap: 14,
                padding: "14px 0",
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
                <Ring source={row.source} ground="room" size={34} glyph="add" />
              </div>
            </div>
          ))}
        </div>
        <Label ground="room" style={{ marginTop: 34 }}>
          Status is a point and its word
        </Label>
        <div className="flex flex-col" style={{ marginTop: 12 }}>
          {STATES.map((s) => (
            <div
              key={s.id}
              style={{ padding: "11px 0", borderTop: `1px solid ${roomRule}` }}
            >
              <div className="flex items-center justify-between">
                <StatusLight state={s.id} ground="room">
                  {s.word}
                </StatusLight>
                <span
                  className="ag-num"
                  style={{ fontSize: 11.5, color: room.faint }}
                >
                  {valueOf(s.id, "room", true)}
                </span>
              </div>
              <p
                className="ag-body"
                style={{ fontSize: 13, color: room.muted, marginTop: 4 }}
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
        <p className="ag-caption" style={{ marginTop: 12, color: room.faint }}>
          Waiting was amber, and read as the brand. Now it is the camera&apos;s
          standby: half-lit, with no hue.
        </p>
      </div>

      <div
        className="absolute flex flex-col"
        style={{ left: m.pad, top: cut + 36, width: m.inner }}
      >
        <Label ground="paper">Paper · {take.paper.name}</Label>
        <div className="flex" style={{ gap: 14, marginTop: 14 }}>
          <Swatch
            name="Paper"
            tone={take.paper.ground}
            ground="paper"
            inks
            w={sw}
            h={86}
          />
          <Swatch
            name="Card"
            tone={take.paper.card}
            ground="paper"
            w={sw}
            h={86}
          />
        </div>
        <Label ground="paper" style={{ marginTop: 36 }}>
          The same sources on paper
        </Label>
        <p
          className="ag-body"
          style={{
            fontSize: 13.5,
            color: paper.muted,
            marginTop: 8,
            textWrap: "pretty",
          }}
        >
          {take.words.colourPaper}
        </p>
        <div className="flex flex-col" style={{ marginTop: 10 }}>
          {SOURCES.map((row) => (
            <div
              key={row.key}
              className="flex items-center"
              style={{
                gap: 18,
                padding: "16px 0",
                borderTop: `1px solid ${paperRule}`,
              }}
            >
              <SourceArt row={row} w={54} h={36} />
              <div style={{ marginLeft: 8 }}>
                <Lit
                  source={row.source}
                  ground="paper"
                  ring={34}
                  receipt={110}
                  gap={34}
                />
              </div>
            </div>
          ))}
        </div>
        <Label ground="paper" style={{ marginTop: 30 }}>
          The same states on paper
        </Label>
        <div className="flex flex-col" style={{ marginTop: 12 }}>
          {STATES.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between"
              style={{ padding: "11px 0", borderTop: `1px solid ${paperRule}` }}
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
              <span
                className="ag-num"
                style={{ fontSize: 11.5, color: paper.faint }}
              >
                {valueOf(s.id, "paper", true)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </SlideRoot>
  );
}
