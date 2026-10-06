"use client";

import type { ReactNode } from "react";

import type { SlideProps } from "../../deck/contract";
import type { PhotoId } from "../../deck/media";
import { SlideRoot } from "../root";
import { type Ground, LitPhoto, Readout, ROOM } from "../system";
import { inkOf, useTake } from "../take";
import { FitLines, SpecRows } from "./a-parts";
import { Label, useMeasure } from "./parts";

/**
 * 02 THE IDEA: THE TAKE'S POSITIONING AND ITS PAPER RULE, SAID ONCE.
 *
 * A reading slide, so it is paper. On the left the take says what it is (its
 * headline and its argument) and, under it, the four lines round two polished
 * in every take. On the right the one demonstration: the same photograph
 * twice, its light in the room on a piece of the room and its light on this
 * take's paper, and under it the take's paper rule set as a specification.
 * The demonstration is the slide's picture, so it is drawn largest.
 */

/** A photograph whose light is unmistakably its own: the floor's blue and violet. */
const PHOTO: PhotoId = "party-dj";

/** ★ ROUND TWO'S POLISH, EVERY TAKE: written once here, so the three decks say it alike. */
const ROUND_TWO: readonly (readonly [string, string])[] = [
  [
    "No spectrum.",
    "Where there is no photograph, the house lights as one dusk sky.",
  ],
  [
    "Three hues at most,",
    "and never louder than the photograph they came from.",
  ],
  ["Fewer, larger lights:", "one to a screen."],
  ["Your v1 wordmark,", "untouched."],
];

/** The paper rule's four rows, as the take words them. */
function useRule(): readonly (readonly [string, string])[] {
  const { rule } = useTake().words;
  return [
    ["May appear", rule.may],
    ["Becomes", rule.becomes],
    ["Carried by", rule.carries],
    ["Never", rule.never],
  ];
}

/** Round two's lines: a lead in the full ink, the rest in the muted. */
function useRoundTwo(): readonly (readonly [string, ReactNode])[] {
  const t = inkOf(useTake(), "paper");
  return ROUND_TWO.map(([lead, rest], i) => [
    String(i + 1).padStart(2, "0"),
    <span key={lead} style={{ color: t.muted }}>
      <span style={{ color: t.fg, fontWeight: 600 }}>{lead}</span> {rest}
    </span>,
  ]);
}

/**
 * THE DEMONSTRATION: one photograph, its light drawn by the take on each
 * ground. In the room it stands on a panel of the room; on paper it stands on
 * the slide's own paper, so what the take does there is seen on the page it
 * argues for. ★ THE PANEL IS WIDER THAN THE PHOTOGRAPH BY THE LIGHT'S OWN
 * REACH, so no take's room glow is cut by its edge: the furthest reaching
 * (Cast's, the picture itself blurred) is spent within about a quarter of the
 * photograph's width. Paper has no panel to cut anything, so its cell is only
 * as wide as a paper form needs.
 */
function Demo({
  room,
  paper,
  ch,
  pw,
  gap,
  stack,
}: {
  /** Each cell's width (px): the room's panel, and paper's. */
  room: number;
  paper: number;
  ch: number;
  /** The photograph's width (px); it is 3:2. */
  pw: number;
  gap: number;
  stack: boolean;
}) {
  const take = useTake();
  const { Bloom } = take.light;
  const ph = Math.round((pw * 2) / 3);
  const source = { photo: PHOTO } as const;
  const cell = (ground: Ground) => {
    const cw = ground === "room" ? room : paper;
    return (
      <div className="flex flex-col" style={{ gap: 14 }}>
        <div
          className="relative flex items-center justify-center"
          style={{
            width: cw,
            height: ch,
            background: ground === "room" ? ROOM.room.hex : undefined,
            borderRadius: ground === "room" ? 4 : 0,
            overflow: ground === "room" ? "hidden" : "visible",
          }}
        >
          <Bloom source={source} ground={ground} size={pw} radius={2}>
            <LitPhoto
              id={PHOTO}
              ground={ground === "room" ? "room" : take.onPaper.subject}
              style={{ width: pw, height: ph }}
            />
          </Bloom>
        </div>
        {/* Each label stands under the edge of what it names: the room's
          panel, or on paper (where there is no panel) the photograph. */}
        <Label
          ground="paper"
          style={{
            marginLeft: ground === "room" ? 0 : Math.round((cw - pw) / 2),
          }}
        >
          {ground === "room" ? "In the room" : "On paper"}
        </Label>
      </div>
    );
  };
  return (
    <div
      data-bd-read="the same photograph on both grounds"
      className={stack ? "flex flex-col" : "flex"}
      style={{ gap }}
    >
      {cell("room")}
      {cell("paper")}
    </div>
  );
}

export function IdeaSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const t = inkOf(take, "paper");
  const rule = useRule();
  const roundTwo = useRoundTwo();

  if (m.desk) {
    const lw = 584;
    const rx = 712;
    const rw = m.w - m.pad - rx;
    // Both columns' lists start on one line, so their hairlines run level.
    const below = 500;
    return (
      <SlideRoot screen={screen} ground="paper">
        <div
          className="absolute"
          style={{ left: m.pad, top: m.top, width: lw }}
        >
          <Readout style={{ color: t.faint, display: "block" }}>
            The idea
          </Readout>
          <FitLines
            lines={take.words.headline}
            max={54}
            width={lw}
            color={t.fg}
            read="the take's headline"
            style={{ marginTop: 18, letterSpacing: "-0.034em" }}
          />
          <p
            className="ag-lede"
            style={{
              marginTop: 22,
              width: 560,
              fontSize: 17,
              lineHeight: 1.55,
              color: t.muted,
              textWrap: "pretty",
            }}
          >
            {take.words.argument}
          </p>
        </div>

        <div
          className="absolute"
          style={{ left: m.pad, top: below, width: lw - 24 }}
        >
          <Label ground="paper" style={{ marginBottom: 14 }}>
            Round two, in every take
          </Label>
          <SpecRows ground="paper" rows={roundTwo} label={34} />
        </div>

        <div className="absolute" style={{ left: rx, top: m.top }}>
          <Demo
            room={344}
            paper={rw - 344 - 24}
            ch={300}
            pw={230}
            gap={24}
            stack={false}
          />
        </div>

        <div className="absolute" style={{ left: rx, top: below, width: rw }}>
          <Label ground="paper" style={{ marginBottom: 14 }}>
            The rule on paper · {take.name}
          </Label>
          <SpecRows ground="paper" rows={rule} label={104} />
        </div>
      </SlideRoot>
    );
  }

  // The phone: the desk's reading order, stacked: what the take is, the
  // demonstration, its rule, then the four lines every take shares.
  return (
    <SlideRoot screen={screen} ground="paper">
      <div
        className="absolute flex flex-col"
        style={{ left: m.pad, top: m.top, width: m.inner }}
      >
        <Readout style={{ color: t.faint, display: "block" }}>The idea</Readout>
        <h2
          className="ag-title"
          data-bd-read="the take's headline"
          style={{
            marginTop: 14,
            fontSize: 32,
            color: t.fg,
            letterSpacing: "-0.032em",
          }}
        >
          {take.words.headline.map((l) => (
            <span key={l} style={{ display: "block", textWrap: "balance" }}>
              {l}
            </span>
          ))}
        </h2>
        <p
          className="ag-lede"
          style={{
            marginTop: 16,
            fontSize: 15.5,
            lineHeight: 1.52,
            color: t.muted,
            textWrap: "pretty",
          }}
        >
          {take.words.argument}
        </p>
        <div style={{ marginTop: 40 }}>
          <Demo
            room={m.inner}
            paper={m.inner}
            ch={236}
            pw={226}
            gap={28}
            stack
          />
        </div>
        <Label ground="paper" style={{ marginTop: 44, marginBottom: 12 }}>
          The rule on paper · {take.name}
        </Label>
        <SpecRows ground="paper" rows={rule} />
        <Label ground="paper" style={{ marginTop: 44, marginBottom: 12 }}>
          Round two, in every take
        </Label>
        <SpecRows ground="paper" rows={roundTwo} />
      </div>
    </SlideRoot>
  );
}
