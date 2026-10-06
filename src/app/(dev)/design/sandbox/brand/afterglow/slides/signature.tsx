"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY, type PhotoId } from "../../deck/media";
import { SlideRoot } from "../root";
import { type Ground, LitPhoto, Readout } from "../system";
import { cardOf, groundOf, inkOf, useTake } from "../take";
import { Caption, Heading, Label, useMeasure } from "./parts";

/**
 * 05 THE SIGNATURE: THREE FORMS, ONE LIGHT, ON BOTH GROUNDS.
 *
 * The round's core comparison: the Ring, the Seam and the Bloom drawn in the
 * room (the top band) and then on the take's paper (the bottom band), the same
 * three moments on the same photographs, so paper is shown as convincingly as
 * the room and the three takes differ here, form by form, and nowhere else.
 */

const ALBUM: readonly PhotoId[] = [
  "wedding-toast",
  "wedding-rings",
  "reception-table",
  "wedding-golden",
  "wedding-arch",
  "party-balloons",
];

const CREDITS = ["Maya & Jay", "31 guests", "1,284 photos"] as const;

/** The Ring: an album's foot, the photographs giving way to the ground under the shutter. */
function RingPanel({ ground, w, h }: { ground: Ground; w: number; h: number }) {
  const take = useTake();
  const { Ring } = take.light;
  const bg = ground === "room" ? "#0b0b0d" : cardOf(take, "paper").hex;
  const tile = Math.floor((w - 6) / 3);
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: w, height: h, background: bg, borderRadius: 4 }}
    >
      <div className="grid grid-cols-3" style={{ gap: 3 }}>
        {ALBUM.map((id) => (
          <LitPhoto
            key={id}
            id={id}
            ground={ground}
            style={{ width: tile, height: tile * 0.72 }}
          />
        ))}
      </div>
      {/* The album gives way to the ground under the shutter: the Ring
          stands on its ground, never on a photograph. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: h * 0.66,
          background: `linear-gradient(to bottom, transparent 0%, ${bg} 58%)`,
        }}
      />
      <div
        className="absolute inset-x-0 flex justify-center"
        style={{ bottom: Math.round(h * (ground === "room" ? 0.13 : 0.12)) }}
      >
        <Ring
          source={{ photos: ALBUM }}
          ground={ground}
          size={Math.round(Math.min(w, 420) * 0.15)}
          label="Add photos"
        />
      </div>
    </div>
  );
}

/** The Seam: light born at the cover photograph's foot, the event under it. */
function SeamPanel({ ground, w, h }: { ground: Ground; w: number; h: number }) {
  const take = useTake();
  const t = inkOf(take, ground);
  const { Seam } = take.light;
  const bg = ground === "room" ? groundOf(take, "room").hex : cardOf(take, "paper").hex;
  const cover = Math.round(h * 0.46);
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: w, height: h, background: bg, borderRadius: 4 }}
    >
      <LitPhoto
        id="reception-table"
        ground={ground}
        style={{ width: w, height: cover, borderRadius: 0 }}
        focus="50% 62%"
      />
      <div className="absolute inset-x-0" style={{ top: cover, height: h - cover }}>
        <Seam
          source={{ photo: "reception-table", edge: "bottom" }}
          ground={ground}
          reach={Math.round(h * (ground === "room" ? 0.34 : 0.3))}
          width={w}
          credits={CREDITS}
        />
        <div className="absolute" style={{ left: 20, bottom: 14 }}>
          <p
            className="ag-subtitle"
            style={{ fontSize: Math.round(Math.min(w, 420) * 0.052), color: t.fg }}
          >
            {PARTY.name}
          </p>
          <Readout style={{ color: t.faint }}>Saturday 12 September</Readout>
        </div>
      </div>
    </div>
  );
}

/** The Bloom: behind the one live subject, here the reel as it plays. */
function BloomPanel({ ground, w, h }: { ground: Ground; w: number; h: number }) {
  const take = useTake();
  const t = inkOf(take, ground);
  const { ReelBloom } = take.light;
  const bg = ground === "room" ? groundOf(take, "room").hex : cardOf(take, "paper").hex;
  // A paper form may reach past its subject (a take's mount, its shadow), so
  // the reel leaves it room: the contract's margin, an eighth of the subject.
  const rw = Math.round(Math.min(w * 0.56, h * 0.95));
  const rh = Math.round((rw * 9) / 16);
  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{
        width: w,
        height: h,
        background: bg,
        borderRadius: 4,
        gap: Math.round(rw * 0.13) + 12,
      }}
    >
      <ReelBloom
        reel="hero-candidate-02"
        ground={ground}
        width={rw}
        radius={2}
        style={{ width: rw, height: rh }}
      />
      <Readout style={{ color: t.faint }}>The reel, lit by the shot it shows</Readout>
    </div>
  );
}

const FORM_NAMES = { ring: "The Ring", seam: "The Seam", bloom: "The Bloom" } as const;

function Band({
  ground,
  w,
  h,
  gap,
  captionW,
  stack,
}: {
  ground: Ground;
  w: number;
  h: number;
  gap: number;
  captionW: number;
  stack: boolean;
}) {
  const take = useTake();
  const forms = take.words.forms;
  const panels = [
    ["ring", <RingPanel key="r" ground={ground} w={w} h={h} />],
    ["seam", <SeamPanel key="s" ground={ground} w={w} h={h} />],
    ["bloom", <BloomPanel key="b" ground={ground} w={w} h={h} />],
  ] as const;
  return (
    <div className={stack ? "flex flex-col" : "flex"} style={{ gap }}>
      {panels.map(([id, panel]) => (
        <div key={id} className="flex flex-col" style={{ gap: 14 }}>
          {panel}
          <Caption ground={ground} name={FORM_NAMES[id]} width={captionW}>
            {forms[id][ground]}
          </Caption>
        </div>
      ))}
    </div>
  );
}

export function SignatureSlide({ screen }: SlideProps) {
  const take = useTake();
  const m = useMeasure();
  const room = inkOf(take, "room");

  if (m.desk) {
    const split = 474;
    const gap = 32;
    const pw = Math.floor((m.inner - gap * 2) / 3);
    return (
      <SlideRoot screen={screen} ground="room">
        <div
          className="absolute inset-x-0 bottom-0"
          style={{ top: split, background: groundOf(take, "paper").hex }}
        />
        <div className="absolute" style={{ left: m.pad, top: m.top - 6 }}>
          <Heading ground="room" kicker="The signature" title="Three forms, one light." size={40} />
        </div>
        <p
          className="ag-body absolute"
          style={{
            right: m.pad,
            top: m.top + 14,
            width: 470,
            fontSize: 15,
            color: room.muted,
            textAlign: "right",
            textWrap: "pretty",
          }}
        >
          Born from the photographs, at an edge. Never on them and never behind words; one to a screen, still until something happens.
        </p>
        <div className="absolute" style={{ left: m.pad, top: 186 }}>
          <Band ground="room" w={pw} h={186} gap={gap} captionW={pw} stack={false} />
        </div>
        <div className="absolute" style={{ left: m.pad, top: split + 28 }}>
          <Label ground="paper">On paper · {take.name}</Label>
        </div>
        <div className="absolute" style={{ left: m.pad, top: split + 60 }}>
          <Band ground="paper" w={pw} h={186} gap={gap} captionW={pw} stack={false} />
        </div>
        <p
          className="ag-caption absolute"
          style={{
            left: m.pad,
            bottom: 26,
            width: m.inner,
            color: inkOf(take, "paper").faint,
          }}
        >
          Never: over a photograph · behind words · on a control&apos;s fill · a wash across a page · two in one view.
        </p>
      </SlideRoot>
    );
  }

  const pw = m.inner;
  // Three panels and their captions, stacked, then the cut to paper.
  const split = 1222;
  return (
    <SlideRoot screen={screen} ground="room">
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: split, background: groundOf(take, "paper").hex }}
      />
      <div className="absolute" style={{ left: m.pad, top: m.top, width: m.inner }}>
        <Heading
          ground="room"
          kicker="The signature"
          title="Three forms, one light."
          lede="Born from the photographs, at an edge. Never on them and never behind words; one to a screen."
        />
      </div>
      <div className="absolute" style={{ left: m.pad, top: 262 }}>
        <Band ground="room" w={pw} h={190} gap={36} captionW={pw} stack />
      </div>
      <div className="absolute" style={{ left: m.pad, top: split + 28 }}>
        <Label ground="paper">On paper · {take.name}</Label>
      </div>
      <div className="absolute" style={{ left: m.pad, top: split + 60 }}>
        <Band ground="paper" w={pw} h={190} gap={36} captionW={pw} stack />
      </div>
    </SlideRoot>
  );
}
