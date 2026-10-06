"use client";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { Wordmark } from "../marks";
import { SlideRoot } from "../root";
import { LitPhoto, Readout } from "../system";
import { groundOf, inkOf, useTake } from "../take";
import { useMeasure } from "./parts";

/**
 * 01 THE COVER: ONE PHOTOGRAPH, TWO GROUNDS.
 *
 * The take's whole argument in one picture: a photograph stands across the
 * cut between the room and the take's paper, and its light behaves on each
 * side as that ground's physics says (the room's Bloom on the left, the
 * take's paper form on the right), the same object either side of the cut.
 * Every take draws this one composition, so the three covers differ only in
 * what the light becomes on paper, which is the round's question.
 */

const PHOTO: PhotoId = "wedding-toast";

export function CoverSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const room = inkOf(take, "room");
  const paper = inkOf(take, "paper");
  const { Bloom, Symbol } = take.light;
  const source = { photo: PHOTO } as const;

  if (m.desk) {
    const cut = 820;
    const pw = 600;
    const ph = 400;
    const px = cut - pw / 2;
    const py = 268;
    // The photograph's light, drawn twice round the one photograph and
    // clipped at the cut: the room's form on the left, paper's on the right.
    const lit = (ground: "room" | "paper") => (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          clipPath:
            ground === "room"
              ? `inset(0 ${m.w - cut}px 0 0)`
              : `inset(0 0 0 ${cut}px)`,
        }}
      >
        <div className="absolute" style={{ left: px, top: py, width: pw, height: ph }}>
          <Bloom source={source} ground={ground} size={pw} radius={2}>
            <div style={{ width: pw, height: ph }} />
          </Bloom>
        </div>
      </div>
    );
    return (
      <SlideRoot screen={screen} ground="room">
        <div
          className="absolute inset-y-0 right-0"
          style={{ left: cut, background: groundOf(take, "paper").hex }}
        />
        {lit("room")}
        {lit("paper")}
        <LitPhoto
          id={PHOTO}
          ground="room"
          style={{
            position: "absolute",
            left: px,
            top: py,
            width: pw,
            height: ph,
          }}
        />
        <Readout
          className="absolute"
          style={{ left: m.pad, top: m.top, color: room.faint }}
        >
          Afterglow · round two
        </Readout>
        <h1
          className="ag-display absolute"
          data-bd-read="the take's name"
          style={{
            left: m.pad - 6,
            top: m.top + 30,
            fontSize: 132,
            color: room.fg,
          }}
        >
          {take.name}
        </h1>
        <p
          className="absolute"
          style={{
            left: m.pad,
            top: m.top + 176,
            width: 420,
            fontSize: 21,
            lineHeight: 1.4,
            letterSpacing: "-0.012em",
            color: room.muted,
            textWrap: "pretty",
          }}
        >
          {take.words.line}
        </p>
        <Readout
          className="absolute"
          style={{ right: m.w - cut + 24, top: py - 34, color: room.faint }}
        >
          In the room
        </Readout>
        <Readout
          className="absolute"
          style={{ left: cut + 24, top: py - 34, color: paper.faint }}
        >
          On paper
        </Readout>
        <p
          className="ag-body absolute"
          style={{
            left: cut + 64,
            bottom: 64,
            width: 400,
            fontSize: 15,
            color: paper.muted,
            textWrap: "pretty",
          }}
        >
          {take.words.coverPaper}
        </p>
        <span
          className="absolute flex items-center"
          style={{ left: m.pad, bottom: 64, gap: 16 }}
        >
          <Symbol size={34} ground="room" />
          <Wordmark height={26} color={room.fg} read="wordmark on the cover" />
        </span>
      </SlideRoot>
    );
  }

  // The phone: the cut runs across, the room above, paper below, the
  // photograph standing across it.
  const cut = 640;
  const pw = 300;
  const ph = 200;
  const px = (m.w - pw) / 2;
  const py = cut - ph / 2;
  const lit = (ground: "room" | "paper") => (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        clipPath:
          ground === "room"
            ? `inset(0 0 ${m.h - cut}px 0)`
            : `inset(${cut}px 0 0 0)`,
      }}
    >
      <div className="absolute" style={{ left: px, top: py, width: pw, height: ph }}>
        <Bloom source={source} ground={ground} size={pw} radius={2}>
          <div style={{ width: pw, height: ph }} />
        </Bloom>
      </div>
    </div>
  );
  return (
    <SlideRoot screen={screen} ground="room">
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: cut, background: groundOf(take, "paper").hex }}
      />
      {lit("room")}
      {lit("paper")}
      <LitPhoto
        id={PHOTO}
        ground="room"
        style={{ position: "absolute", left: px, top: py, width: pw, height: ph }}
      />
      <Readout
        className="absolute"
        style={{ left: m.pad, top: m.top, color: room.faint }}
      >
        Afterglow · round two
      </Readout>
      <h1
        className="ag-display absolute"
        data-bd-read="the take's name"
        style={{ left: m.pad - 3, top: m.top + 24, fontSize: 72, color: room.fg }}
      >
        {take.name}
      </h1>
      <p
        className="absolute"
        style={{
          left: m.pad,
          top: m.top + 110,
          width: m.inner,
          fontSize: 18,
          lineHeight: 1.42,
          color: room.muted,
          textWrap: "pretty",
        }}
      >
        {take.words.line}
      </p>
      <span
        className="absolute flex items-center"
        style={{ left: m.pad, top: m.top + 236, gap: 12 }}
      >
        <Symbol size={26} ground="room" />
        <Wordmark height={20} color={room.fg} read="wordmark on the cover" />
      </span>
      <Readout
        className="absolute"
        style={{ left: m.pad, top: py - 30, color: room.faint }}
      >
        In the room
      </Readout>
      <Readout
        className="absolute"
        style={{ left: m.pad, top: py + ph + 56, color: paper.faint }}
      >
        On paper
      </Readout>
      <p
        className="ag-body absolute"
        style={{
          left: m.pad,
          top: py + ph + 84,
          width: m.inner,
          fontSize: 15,
          color: paper.muted,
          textWrap: "pretty",
        }}
      >
        {take.words.coverPaper}
      </p>
    </SlideRoot>
  );
}
