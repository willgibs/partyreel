"use client";

import type { SlideProps } from "../../deck/contract";
import { GUESTS, PARTY, type PhotoId, Seeded } from "../../deck/media";
import { Glyph, PhoneView } from "../kit";
import { Wordmark } from "../marks";
import { SlideRoot } from "../root";
import {
  alpha,
  LitPhoto,
  Readout,
  ROOM,
  type Source,
  VOICE,
} from "../system";
import { groundOf, inkOf, useTake } from "../take";
import { Heading, Label, useMeasure } from "./parts";

/**
 * 06 WITHOUT MEDIA: BEFORE THE FIRST PHOTOGRAPH, THE SEED IS THE LIGHT.
 *
 * Will's round-one note holds: the hashvatar is the one thing that already
 * feels right on a screen with no media. The slide is the room with a sheet
 * of paper in its corner: the guest's empty album on a phone (the seed glowing
 * where the photograph will be, the Ring lit by it), the handover from the
 * seed to the photographs as three moments on one line, and the host's light
 * dashboard, where each event's cover is its seed in the take's paper form.
 *
 * ★ THE PAPER CORNER IS WHERE THE TAKES DIFFER, so it is a ground, never a
 * panel inside the room: it runs off the slide's right and bottom edges, and
 * its covers are drawn at their own size (never scaled), so a take's paper
 * form (a well, a print, a fall of colour) is judged at the pixels it ships.
 */

/** The slide's line; "the seed" never parts across a break. */
const TITLE = "Before the first photograph, the seed is the light.";

/** The three events on the host's dashboard, before any photograph. */
const EVENTS = [
  { name: PARTY.name, date: "Sat 12 Sept", seed: PARTY.seed, guests: 31 },
  { name: "Lena turns 30", date: "Fri 2 Oct", seed: "event-lena-30", guests: 18 },
  // A warm seed beside the teal and the violet: three events are three
  // unrelated hues, the way hashes fall, and never two of one.
  { name: "Ines & Tom", date: "Sat 17 Oct", seed: "event-tom-and-ines", guests: 54 },
] as const;

const FIRST: PhotoId = "wedding-toast";
const ALBUM: readonly PhotoId[] = ["wedding-toast", "wedding-rings", "reception-table"];

type Step = {
  name: string;
  /** Its name in a phone's narrow column. */
  short: string;
  line: string;
  source: Source;
  tiles: "seed" | readonly PhotoId[];
};

const STEPS: readonly Step[] = [
  {
    name: "The seed's light",
    short: "The seed",
    line: "Before anything lands: the event's own hue.",
    source: { seed: PARTY.seed },
    tiles: "seed",
  },
  {
    name: "The first photograph",
    short: "The first photo",
    line: "It lands where the seed was; the light turns.",
    source: { photos: [FIRST] },
    tiles: [FIRST],
  },
  {
    name: "The photographs' light",
    short: "The album",
    line: "From now on the album lights itself.",
    source: { photos: ALBUM },
    tiles: ALBUM,
  },
];

/**
 * The guests on the album's head, ordered as neighbours on the wheel (teal to
 * violet to rose): each orb is its person's own colour, and four of them read
 * as one company, never as a spectrum.
 */
const FACES = ["Lena", "Sam", "Theo", "Maya"].map(
  (n) => GUESTS.find((g) => g.name === n) ?? GUESTS[0],
);

/* ── the guest's empty album, drawn at 375 by 812 ──────────────────────────── */

function EmptyAlbum() {
  const take = useTake();
  const t = inkOf(take, "room");
  const { SeedCover, Ring } = take.light;
  return (
    <div
      className="relative"
      style={{ width: 375, height: 812, background: groundOf(take, "room").hex, color: t.fg }}
    >
      <div className="absolute flex items-center justify-between" style={{ left: 20, right: 20, top: 62, height: 40 }}>
        <Wordmark height={17} color={t.fg} />
        <Glyph name="share" size={21} weight={1.8} style={{ color: t.muted }} />
      </div>
      <div className="absolute" style={{ left: 20, right: 20, top: 128 }}>
        <p className="ag-title" style={{ fontSize: 34, color: t.fg }}>
          {PARTY.name}
        </p>
        <p style={{ fontSize: 15, color: t.muted, marginTop: 6 }}>{PARTY.date}</p>
        <div className="flex items-center" style={{ marginTop: 16 }}>
          {FACES.map((g, i) => (
            <Seeded
              key={g.seed}
              seed={g.seed}
              style={{
                width: 26,
                height: 26,
                marginLeft: i ? -7 : 0,
                boxShadow: `0 0 0 2.5px ${ROOM.room.hex}`,
              }}
            />
          ))}
          <Readout style={{ color: t.muted, marginLeft: 12 }}>
            {PARTY.guests} guests
          </Readout>
        </div>
      </div>
      {/* Where the first photograph will be: the seed's own light. */}
      <SeedCover
        seed={PARTY.seed}
        ground="room"
        style={{ position: "absolute", left: 20, top: 284, width: 335, height: 280, borderRadius: 4 }}
      />
      <div className="absolute" style={{ left: 20, right: 20, top: 590 }}>
        <p className="ag-subtitle" data-bd-read="the empty album's line" style={{ fontSize: 23, color: t.fg }}>
          {VOICE.guestEmpty}
        </p>
        <p style={{ fontSize: 15, lineHeight: 1.45, color: t.muted, marginTop: 6 }}>
          Add the first photo. Everyone sees it land.
        </p>
      </div>
      <div className="absolute inset-x-0 flex justify-center" style={{ top: 704 }}>
        <Ring source={{ seed: PARTY.seed }} ground="room" size={70} label="Add photos" />
      </div>
    </div>
  );
}

/* ── the handover: three moments on one line ───────────────────────────────── */

/** One moment's album: the seed, the first photograph, or three. */
function Moment({ step, w, h }: { step: Step; w: number; h: number }) {
  const take = useTake();
  const { SeedCover } = take.light;
  const frame = { width: w, height: h, borderRadius: 3 } as const;
  if (step.tiles === "seed")
    return <SeedCover seed={PARTY.seed} ground="room" style={frame} />;
  if (step.tiles.length === 1)
    return <LitPhoto id={step.tiles[0]} ground="room" style={frame} />;
  // Three: the album's first row, the newest large and two beside it.
  const gap = 3;
  const big = Math.round((w - gap) * 0.62);
  const small = w - gap - big;
  const half = (h - gap) / 2;
  const [a, b, c] = step.tiles;
  return (
    <div className="relative" style={frame}>
      <LitPhoto id={a} ground="room" style={{ position: "absolute", left: 0, top: 0, width: big, height: h }} />
      <LitPhoto id={b} ground="room" style={{ position: "absolute", left: big + gap, top: 0, width: small, height: half }} />
      <LitPhoto
        id={c}
        ground="room"
        style={{ position: "absolute", left: big + gap, top: half + gap, width: small, height: half }}
      />
    </div>
  );
}

function Handover({
  w,
  frameW,
  frameH,
  ring,
  compact,
}: {
  w: number;
  frameW: number;
  frameH: number;
  ring: number;
  compact: boolean;
}) {
  const take = useTake();
  const t = inkOf(take, "room");
  const { Ring } = take.light;
  const col = w / STEPS.length;
  const lineY = frameH + Math.round(ring * 0.9);
  return (
    <div className="relative" style={{ width: w, height: lineY + ring / 2 + (compact ? 64 : 70) }}>
      {/* The line the light travels along, from the seed to the album. */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: col / 2,
          right: col / 2,
          top: lineY,
          height: 1,
          background: alpha(t.faint, 55),
        }}
      />
      {STEPS.map((s, i) => (
        <div
          key={s.name}
          className="absolute flex flex-col items-center"
          style={{ left: i * col, top: 0, width: col }}
        >
          <Moment step={s} w={frameW} h={frameH} />
          <div
            className="flex items-center justify-center"
            style={{
              marginTop: lineY - frameH - ring / 2,
              width: ring + 18,
              height: ring,
              background: groundOf(take, "room").hex,
            }}
          >
            <Ring source={s.source} ground="room" size={ring} glyph={compact ? "none" : "add"} />
          </div>
          <p
            className="ag-body text-center"
            style={{
              fontSize: compact ? 12.5 : 14,
              fontWeight: 600,
              lineHeight: 1.3,
              color: t.fg,
              marginTop: compact ? 10 : 14,
              width: col - 12,
              textWrap: "balance",
            }}
          >
            <span className="ag-num" style={{ color: t.faint }}>
              {i + 1}
            </span>{" "}
            {compact ? s.short : s.name}
          </p>
          {compact ? null : (
            <p
              className="ag-caption text-center"
              style={{ color: t.muted, marginTop: 3, width: col - 24, textWrap: "balance" }}
            >
              {s.line}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── the host's light dashboard: three events, no photograph yet ───────────── */

function EventCard({
  e,
  w,
  h,
  row,
}: {
  e: (typeof EVENTS)[number];
  w: number;
  h: number;
  /** A list row (the cover beside its words), for a phone. */
  row?: boolean;
}) {
  const take = useTake();
  const t = inkOf(take, "paper");
  const { SeedCover } = take.light;
  const cover = <SeedCover seed={e.seed} ground="paper" style={{ width: w, height: h, borderRadius: 3 }} />;
  const words = (
    <div>
      <p className="ag-subtitle" style={{ fontSize: row ? 17 : 18, color: t.fg }}>
        {e.name}
      </p>
      <p className="ag-num" style={{ fontSize: 13, color: t.muted, marginTop: 3 }}>
        {e.date} · {e.guests} guests
      </p>
    </div>
  );
  if (row)
    return (
      <div className="flex items-center" style={{ gap: Math.round(w * 0.22) }}>
        {cover}
        {words}
      </div>
    );
  return (
    <div className="flex flex-col" style={{ width: w, gap: Math.round(h * 0.2) }}>
      {cover}
      {words}
    </div>
  );
}

function EventsHead() {
  const t = inkOf(useTake(), "paper");
  return (
    <p className="flex items-baseline" style={{ gap: 10 }}>
      <span className="ag-subtitle" data-bd-read="the paper dashboard" style={{ fontSize: 24, color: t.fg }}>
        Your events
      </span>
      <span className="ag-num" style={{ fontSize: 14, color: t.muted }}>
        {EVENTS.length}
      </span>
    </p>
  );
}

/* ── the slide ─────────────────────────────────────────────────────────────── */

export function AtmosphereSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const paper = inkOf(take, "paper");
  const paperHex = groundOf(take, "paper").hex;

  if (m.desk) {
    // The phone stands in the room on the left; the words, the handover and
    // the paper corner share one column line to its right.
    const phoneW = 344;
    const col = 476;
    const cut = 540;
    const sheetX = col - 44;
    const colW = m.w - m.pad - col;
    const gap = 44;
    const cardW = Math.floor((colW - gap * 2) / 3);
    return (
      <SlideRoot screen={screen} ground="room">
        <div className="absolute" style={{ left: m.pad - 8, top: 112 }}>
          <PhoneView width={phoneW} ground="room" on="room">
            <EmptyAlbum />
          </PhoneView>
        </div>
        <div className="absolute" style={{ left: col, top: m.top, width: colW }}>
          <Heading
            ground="room"
            kicker="Without media"
            title={TITLE}
            width={760}
          />
        </div>
        <div className="absolute" style={{ left: col - 24, top: 272 }}>
          <Handover w={colW + 48} frameW={176} frameH={112} ring={34} compact={false} />
        </div>
        {/* The paper corner: the host's dashboard on the take's own stock. */}
        <div className="absolute right-0 bottom-0" style={{ left: sheetX, top: cut, background: paperHex }} />
        <div className="absolute" style={{ left: col, top: cut + 34, width: colW }}>
          <div className="flex items-start justify-between">
            <div>
              <Label ground="paper">On paper · {take.name}</Label>
              <div style={{ marginTop: 8 }}>
                <EventsHead />
              </div>
            </div>
            <p
              className="ag-body"
              data-bd-contrast="the paper caption"
              style={{ width: 400, fontSize: 14, color: paper.muted, textAlign: "right", textWrap: "pretty" }}
            >
              {take.words.seedPaper}
            </p>
          </div>
          <div className="flex" style={{ gap, marginTop: 24 }}>
            {EVENTS.map((e) => (
              <EventCard key={e.seed} e={e} w={cardW} h={Math.round(cardW * 0.5)} />
            ))}
          </div>
        </div>
      </SlideRoot>
    );
  }

  // The phone: stacked, the room above, the paper's own band below.
  const phoneW = 262;
  const cut = 1080;
  return (
    <SlideRoot screen={screen} ground="room">
      <div className="absolute" style={{ left: m.pad, top: m.top, width: m.inner }}>
        <Heading ground="room" kicker="Without media" title={TITLE} />
      </div>
      <div className="absolute" style={{ left: (m.w - phoneW) / 2, top: 228 }}>
        <PhoneView width={phoneW} ground="room" on="room">
          <EmptyAlbum />
        </PhoneView>
      </div>
      <div className="absolute" style={{ left: m.pad, top: 826 }}>
        <Label ground="room">The handover</Label>
      </div>
      <div className="absolute" style={{ left: m.pad - 6, top: 856 }}>
        <Handover w={m.inner + 12} frameW={100} frameH={68} ring={26} compact />
      </div>
      <div className="absolute inset-x-0 bottom-0" style={{ top: cut, background: paperHex }} />
      <div className="absolute" style={{ left: m.pad, top: cut + 32, width: m.inner }}>
        <Label ground="paper">On paper · {take.name}</Label>
        <div style={{ marginTop: 8 }}>
          <EventsHead />
        </div>
        <div className="flex flex-col" style={{ gap: 24, marginTop: 24 }}>
          {EVENTS.map((e) => (
            <EventCard key={e.seed} e={e} w={150} h={100} row />
          ))}
        </div>
        <p
          className="ag-body"
          data-bd-contrast="the paper caption"
          style={{ fontSize: 14, color: paper.muted, marginTop: 28, textWrap: "pretty" }}
        >
          {take.words.seedPaper}
        </p>
      </div>
    </SlideRoot>
  );
}
