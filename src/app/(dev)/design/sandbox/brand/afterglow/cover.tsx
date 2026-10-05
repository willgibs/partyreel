"use client";

import type { SlideProps } from "../deck/contract";
import { HEAD } from "../deck/deck";
import { Lockup } from "./marks";
import { ink, SlideRoot } from "./root";
import {
  Bloom,
  LightChips,
  lightOfPhoto,
  LitPhoto,
  Readout,
  SAMPLED,
} from "./system";

/**
 * 01 THE COVER: one photograph in the room, and the light it gives off. The
 * photograph is the brightest thing on the slide; the colour round it is its
 * own (sampled: gold, a green-gold, the blue of the bridesmaids' dresses, at
 * the photograph's own soft intensity); the words stand in the dark the light
 * never reaches. A garden wedding at noon, on purpose: the light is the
 * event's, at any hour.
 */
const PHOTO = "party-balloons" as const;

function Sampling({ width, color }: { width: number; color: string }) {
  return (
    <div className="flex flex-col items-start gap-2.5" style={{ width }}>
      <LightChips
        light={SAMPLED[PHOTO]}
        register="room"
        height={5}
        className="w-28"
      />
      <Readout style={{ color }}>Its light, from this photograph</Readout>
    </div>
  );
}

export function Cover({ screen }: SlideProps) {
  const light = lightOfPhoto(PHOTO);
  const t = ink("room");
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <div
          className="absolute inset-x-0 flex flex-col items-start px-6"
          style={{ top: HEAD[screen] + 28 }}
        >
          <h1 className="ag-display" style={{ fontSize: 72 }}>
            Afterglow
          </h1>
          <p
            className="ag-lede"
            style={{
              color: t.muted,
              fontSize: 17,
              marginTop: 14,
              maxWidth: 290,
            }}
          >
            The brand is the light the photographs give off.
          </p>
        </div>
        <div
          className="absolute"
          style={{ left: 74, top: 292, width: 228, height: 342 }}
        >
          <Bloom
            light={light}
            ground="room"
            spread={4}
            blur={40}
            style={{ height: "100%" }}
          >
            <LitPhoto id={PHOTO} className="size-full" focus="42% 40%" />
          </Bloom>
        </div>
        <div className="absolute" style={{ left: 74, top: 676 }}>
          <Sampling width={260} color={t.faint} />
        </div>
        <div className="absolute" style={{ left: 24, bottom: 30 }}>
          <Lockup height={20} ground="room" read="lockup" />
        </div>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="room">
      <div
        className="absolute flex flex-col items-start"
        style={{ left: 96, top: 262, width: 600 }}
      >
        <h1
          className="ag-display"
          style={{ fontSize: 150 }}
          data-bd-contrast="title on the room"
        >
          Afterglow
        </h1>
        <p
          className="ag-lede"
          data-bd-contrast="line on the room"
          style={{ color: t.muted, fontSize: 24, marginTop: 28, maxWidth: 440 }}
        >
          The brand is the light the photographs give off.
        </p>
        <div style={{ marginTop: 40 }}>
          <Sampling width={440} color={t.faint} />
        </div>
      </div>
      <div
        className="absolute"
        style={{ left: 866, top: 124, width: 436, height: 654 }}
      >
        <Bloom
          light={light}
          ground="room"
          spread={6}
          blur={66}
          style={{ height: "100%" }}
        >
          <LitPhoto id={PHOTO} className="size-full" focus="42% 40%" />
        </Bloom>
      </div>
      <div className="absolute" style={{ left: 96, bottom: 72 }}>
        <Lockup height={28} ground="room" read="lockup" />
      </div>
    </SlideRoot>
  );
}
