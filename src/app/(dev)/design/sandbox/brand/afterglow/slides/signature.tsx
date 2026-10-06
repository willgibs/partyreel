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

/**
 * The Ring: an album's foot, the shutter on the ground under its last row.
 * ★ THE ALBUM ENDS ON A HARD EDGE, NEVER A WASH (the creative director's
 * pass): fading the photographs into the ground was a wash over them, which
 * the slide's own never forbids, so the row is cropped and the Ring stands on
 * clear ground below it.
 */
function RingPanel({ ground, w, h }: { ground: Ground; w: number; h: number }) {
  const take = useTake();
  const { Ring } = take.light;
  const bg = ground === "room" ? "#0b0b0d" : cardOf(take, "paper").hex;
  const gap = 3;
  const tile = Math.floor((w - gap * 2) / 3);
  const row = Math.round(h * 0.42);
  const size = Math.round(Math.min(w, 420) * 0.14);
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: w, height: h, background: bg, borderRadius: 4 }}
    >
      <div className="flex" style={{ gap }}>
        {ALBUM.slice(0, 3).map((id) => (
          <LitPhoto
            key={id}
            id={id}
            ground={ground}
            style={{ width: tile, height: row, borderRadius: 0 }}
          />
        ))}
      </div>
      <div
        className="absolute inset-x-0 flex justify-center"
        style={{ top: row + Math.round((h - row - size) / 2) }}
      >
        <Ring
          source={{ photos: ALBUM }}
          ground={ground}
          size={size}
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
  const bg =
    ground === "room" ? groundOf(take, "room").hex : cardOf(take, "paper").hex;
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
      <div
        className="absolute inset-x-0"
        style={{ top: cover, height: h - cover }}
      >
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
            style={{
              fontSize: Math.round(Math.min(w, 420) * 0.052),
              color: t.fg,
            }}
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
function BloomPanel({
  ground,
  w,
  h,
}: {
  ground: Ground;
  w: number;
  h: number;
}) {
  const take = useTake();
  const t = inkOf(take, ground);
  const { ReelBloom } = take.light;
  const bg =
    ground === "room" ? groundOf(take, "room").hex : cardOf(take, "paper").hex;
  // A paper form may reach past its subject (a take's mount, its shadow), so
  // the reel keeps the contract's margin clear on every side (an eighth of its
  // width) and the caption sits at the panel's foot, below that reach.
  const rw = Math.round(Math.min(w * 0.5, h * 0.8));
  const rh = Math.round((rw * 9) / 16);
  const top = Math.round((h - 28 - rh) / 2) - 4;
  return (
    <div
      className="relative"
      style={{ width: w, height: h, background: bg, borderRadius: 4 }}
    >
      <div className="absolute" style={{ left: Math.round((w - rw) / 2), top }}>
        <ReelBloom
          reel="hero-candidate-02"
          ground={ground}
          width={rw}
          radius={2}
          style={{ width: rw, height: rh }}
        />
      </div>
      <Readout
        className="absolute inset-x-0 text-center"
        style={{ bottom: 14, color: t.faint }}
      >
        The reel, lit by the shot it shows
      </Readout>
    </div>
  );
}

const FORM_NAMES = {
  ring: "The Ring",
  seam: "The Seam",
  bloom: "The Bloom",
} as const;

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
          <Heading
            ground="room"
            kicker="The signature"
            title="Three forms, one light."
            size={40}
          />
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
          Born from the photographs, at an edge. Never on them and never behind
          words; one to a screen, still until something happens.
        </p>
        <div className="absolute" style={{ left: m.pad, top: 186 }}>
          <Band
            ground="room"
            w={pw}
            h={186}
            gap={gap}
            captionW={pw}
            stack={false}
          />
        </div>
        <div className="absolute" style={{ left: m.pad, top: split + 28 }}>
          <Label ground="paper">On paper · {take.name}</Label>
        </div>
        <div className="absolute" style={{ left: m.pad, top: split + 60 }}>
          <Band
            ground="paper"
            w={pw}
            h={186}
            gap={gap}
            captionW={pw}
            stack={false}
          />
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
          Never: over a photograph · behind words · on a control&apos;s fill · a
          wash across a page · two in one view.
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
      <div
        className="absolute"
        style={{ left: m.pad, top: m.top, width: m.inner }}
      >
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
