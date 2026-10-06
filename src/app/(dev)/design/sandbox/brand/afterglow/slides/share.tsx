"use client";

import type { CSSProperties } from "react";

import type { SlideProps } from "../../deck/contract";
import { PARTY, Photo, Qr } from "../../deck/media";
import { Note, Scaled, Wall } from "../kit";
import { Wordmark } from "../marks";
import { SlideRoot } from "../root";
import { type Ground, ROOM, type RowSpec, wallOf } from "../system";
import { inkOf, useTake } from "../take";
import { LitCode } from "./d-parts";
import { Label, useMeasure } from "./parts";

/**
 * 13 THE QR CARD: one event's code on two objects, either side of its first
 * photograph.
 *
 * ★ THE TABLE CARD IS PRINTED, so its ground is the take's `onPaper.print`
 * (Aperture: an ink card, a piece of the room printed; Ink and Cast: the
 * take's paper as card stock), and the code stands on its white plate in the
 * take's Bloom on that ground, lit by the seed (the card is printed before the
 * first photograph). It clips what it holds, so no light leaves the card.
 *
 * ★ THE SHARE CARD IS IN THE ROOM IN EVERY TAKE: it is a picture in a thread,
 * and photographs play in the room. Its one light is the album's own Seam,
 * born under its four photographs; the code on it is never lit.
 *
 * The table card is drawn at A6 (105 by 148 mm, 397 by 559 at 96 to the inch)
 * and shown at its true proportion, as large as the slide allows.
 */

const MM = 96 / 25.4;
const CARD = { w: Math.round(105 * MM), h: Math.round(148 * MM) };

/** The table card at its own size, printed on the take's `onPaper.print`. */
function TableCard() {
  const take = useTake();
  const print = take.onPaper.print;
  const t = inkOf(take, print);
  const dark = print === "room";
  return (
    <div
      className="relative flex flex-col items-center overflow-hidden text-center"
      data-bd-card={print}
      style={{
        width: CARD.w,
        height: CARD.h,
        borderRadius: 3,
        background: dark ? ROOM.room.hex : take.paper.card.hex,
        color: t.fg,
        paddingTop: 40,
      }}
    >
      <p
        className="ag-title"
        data-bd-read="the card's name"
        style={{ fontSize: 38, letterSpacing: "-0.035em", color: t.fg }}
      >
        {PARTY.name}
      </p>
      <p style={{ fontSize: 13.5, color: t.muted, marginTop: 7 }}>
        {PARTY.date}
      </p>
      <div style={{ marginTop: 46 }}>
        <LitCode q={164} ground={print} />
      </div>
      <p
        className="ag-subtitle"
        data-bd-contrast="the card's ask on its stock"
        style={{ fontSize: 22, marginTop: 46, color: t.fg }}
      >
        Scan to add your photos
      </p>
      <p style={{ fontSize: 12, color: t.muted, marginTop: 7 }}>
        No app required. {PARTY.url}
      </p>
      <div
        className="absolute inset-x-0 flex justify-center"
        style={{ bottom: 28 }}
      >
        <Wordmark height={13} color={t.fg} read="the card's wordmark" />
      </div>
    </div>
  );
}

/**
 * The card as an object standing on the table: its top edge catching the key
 * light, a dense line of contact where it meets the cloth, and the soft dark
 * the table keeps round its foot. Nothing here is light: it is the card's
 * body, in the table's own warm shadow.
 */
function CardObject({ scale }: { scale: number }) {
  const take = useTake();
  const dark = take.onPaper.print === "room";
  const w = Math.round(CARD.w * scale);
  const h = Math.round(CARD.h * scale);
  return (
    <div className="relative" style={{ width: w, height: h }}>
      <div
        aria-hidden
        className="absolute"
        style={{
          left: -w * 0.16,
          right: -w * 0.22,
          bottom: -h * 0.045,
          height: h * 0.1,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgb(30 18 8 / 0.42), transparent)",
          filter: `blur(${Math.max(3, Math.round(w * 0.02))}px)`,
        }}
      />
      <div
        aria-hidden
        className="absolute"
        style={{
          left: -w * 0.02,
          right: -w * 0.04,
          bottom: -Math.max(2, h * 0.006),
          height: Math.max(5, h * 0.016),
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgb(24 14 6 / 0.75), transparent)",
        }}
      />
      <div
        className="relative overflow-hidden"
        style={{
          width: w,
          height: h,
          borderRadius: 3,
          boxShadow: [
            // The card's top edge catching the light from the top-left.
            dark
              ? "inset 0 1px 0 rgb(255 255 255 / 0.14)"
              : "inset 0 1px 0 rgb(255 255 255 / 0.9)",
            dark ? "" : "inset 0 0 0 1px rgb(40 26 12 / 0.06)",
            "0 1px 2px rgb(20 12 4 / 0.22)",
            `${Math.round(w * 0.03)}px ${Math.round(h * 0.02)}px ${Math.round(w * 0.09)}px -${Math.round(w * 0.03)}px rgb(20 12 4 / 0.38)`,
          ]
            .filter(Boolean)
            .join(", "),
        }}
      >
        <Scaled w={CARD.w} view={CARD.h} scale={scale}>
          <TableCard />
        </Scaled>
      </div>
    </div>
  );
}

/**
 * The album's top row on the share card, cut near square so it carries the
 * card: four of the wedding's own stills (the table already stands behind the
 * printed card, so it is not shown twice).
 */
const SHARE_ROW: readonly RowSpec[] = [
  [
    { id: "wedding-toast", a: 1.08, focus: "52% 60%" },
    { id: "wedding-rings", a: 1, focus: "40% 50%" },
    { id: "wedding-golden", a: 1.04, focus: "58% 50%" },
    { id: "wedding-arch", a: 1.08, focus: "46% 70%" },
  ],
];

/** A Seam's box, opaque at its edge and spent by its foot. */
const SPENT = "linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)";

/** The link's card, 1200 by 630, once the album has filled, in the room. */
function ShareCard() {
  const take = useTake();
  const t = inkOf(take, "room");
  const { WallSeam } = take.light;
  const wall = wallOf(SHARE_ROW, 1200, 6);
  const reach = 96;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: 1200,
        height: 630,
        background: ROOM.room.hex,
        color: t.fg,
      }}
    >
      <div className="absolute inset-x-0 top-0" style={{ height: wall.height }}>
        <Wall tiles={wall.tiles} />
      </div>
      {/* ★ The Seam is spent before the name, whatever a take's light does
          past its reach: its lower half fades to nothing, so no take's light
          can end in a hard line at the foot of its box. Where a take's light
          is already spent there (Aperture, Ink), this changes nothing. */}
      <div
        className="absolute inset-x-0"
        style={{
          top: wall.height,
          height: reach,
          WebkitMaskImage: SPENT,
          maskImage: SPENT,
        }}
      >
        <WallSeam tiles={wall.bottom} width={1200} ground="room" reach={reach} />
      </div>
      <div
        className="absolute"
        style={{ left: 64, top: wall.height + reach - 6 }}
      >
        <p
          className="ag-title"
          data-bd-read="the share card's name"
          style={{ fontSize: 86, letterSpacing: "-0.04em", color: t.fg }}
        >
          {PARTY.name}
        </p>
        <p
          className="ag-readout"
          style={{
            fontSize: 17,
            color: t.muted,
            marginTop: 14,
            letterSpacing: "0.08em",
          }}
        >
          {PARTY.photos.toLocaleString("en-US")} photos from {PARTY.guests}{" "}
          guests
        </p>
      </div>
      <div className="absolute" style={{ left: 64, bottom: 50 }}>
        <Wordmark height={26} color={t.fg} read="the share card's wordmark" />
      </div>
      <div
        className="absolute flex items-end"
        style={{ right: 56, bottom: 46, gap: 22 }}
      >
        <p
          style={{
            fontSize: 19,
            color: t.muted,
            textAlign: "right",
            lineHeight: 1.35,
            paddingBottom: 4,
          }}
        >
          See everyone&apos;s photos,
          <br />
          and add yours.
        </p>
        <div style={{ background: "#ffffff", padding: 12, borderRadius: 14 }}>
          <Qr size={128} color="#121214" />
        </div>
      </div>
    </div>
  );
}

/** The share card shown at `w`, framed as a picture in a thread. */
function ShareShown({ w, style }: { w: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: w,
        borderRadius: Math.max(6, Math.round(w * 0.012)),
        overflow: "hidden",
        boxShadow:
          "0 0 0 1px rgb(20 20 22 / 0.1), 0 2px 4px rgb(20 20 22 / 0.06), 0 30px 60px -30px rgb(20 20 22 / 0.55)",
        ...style,
      }}
    >
      <Scaled w={1200} view={630} scale={w / 1200}>
        <ShareCard />
      </Scaled>
    </div>
  );
}

/**
 * THE TABLE: the card standing on Maya and Jay's own reception table, the
 * still soft behind it the way a lens at a table sees it.
 */
function TableScene({
  w,
  h,
  card,
  style,
}: {
  w: number;
  h: number;
  /** The card's drawn height. */
  card: number;
  style?: CSSProperties;
}) {
  const scale = card / CARD.h;
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: w, height: h, borderRadius: 4, ...style }}
    >
      {/* Soft, never smeared: the table must still read as a table. */}
      <div
        className="absolute"
        style={{ inset: -12, filter: `blur(${Math.max(2, w * 0.004)}px)` }}
      >
        <Photo id="reception-table" focus="64% 64%" />
      </div>
      <div
        className="absolute flex justify-center"
        style={{ left: 0, right: 0, bottom: cardFoot(h) }}
      >
        <CardObject scale={scale} />
      </div>
    </div>
  );
}

/** How far above the scene's foot the card stands: on the cloth, near the lens. */
const cardFoot = (h: number) => Math.round(h * 0.06);

export function ShareSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const ground: Ground = "paper";

  if (m.desk) {
    const sceneW = 584;
    const sceneH = m.h - m.top - 64;
    const card = Math.round(sceneH * 0.78);
    // The right column spans the table card exactly: the note level with its
    // top, the share card's foot on its foot, two objects on one line.
    const cardTop = m.top + sceneH - cardFoot(sceneH) - card;
    const cardBottom = cardTop + card;
    const rx = m.pad + sceneW + 64;
    const rw = m.w - m.pad - rx;
    const sh = Math.round((rw * 630) / 1200);
    return (
      <SlideRoot screen={screen} ground={ground}>
        <TableScene
          w={sceneW}
          h={sceneH}
          card={card}
          style={{ position: "absolute", left: m.pad, top: m.top }}
        />
        <Note
          ground={ground}
          label="Printed for the table, shared in the room"
          width={rw - 64}
          size={16}
          style={{ position: "absolute", left: rx, top: cardTop }}
        >
          {take.words.notes.share}
        </Note>
        <Label
          ground={ground}
          style={{ position: "absolute", left: rx, top: cardBottom - sh - 30 }}
        >
          Share card · 1200 × 630, once the album fills
        </Label>
        <ShareShown
          w={rw}
          style={{ position: "absolute", left: rx, top: cardBottom - sh }}
        />
        <Label
          ground={ground}
          style={{
            position: "absolute",
            left: m.pad,
            top: m.top + sceneH + 16,
          }}
        >
          Table card · A6, 105 × 148 mm
        </Label>
      </SlideRoot>
    );
  }

  // The phone: the card as wide as the scene allows, the table above it.
  const sceneH = 848;
  const card = Math.round(((m.inner - 24) * CARD.h) / CARD.w);
  return (
    <SlideRoot screen={screen} ground={ground}>
      <div
        className="absolute"
        style={{ left: m.pad, top: m.top, width: m.inner }}
      >
        <Label ground={ground}>Table card · A6, 105 × 148 mm</Label>
        <TableScene
          w={m.inner}
          h={sceneH}
          card={card}
          style={{ marginTop: 14 }}
        />
        <Label ground={ground} style={{ marginTop: 48 }}>
          Share card · 1200 × 630
        </Label>
        <ShareShown w={m.inner} style={{ marginTop: 14 }} />
        <Note
          ground={ground}
          label="Printed for the table, shared in the room"
          style={{ marginTop: 44 }}
        >
          {take.words.notes.share}
        </Note>
      </div>
    </SlideRoot>
  );
}
