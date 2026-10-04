"use client";

import type { SlideProps } from "../deck/contract";
import { HEAD } from "../deck/deck";
import { PARTY, Seeded } from "../deck/media";
import { ink, SlideRoot } from "./root";
import {
  GROUND,
  HOUSE,
  INK,
  type Light,
  LightChips,
  lampTone,
  LAMPS,
  lightOfPhoto,
  lightOfPhotos,
  lightOfSeed,
  LitPhoto,
  Readout,
  RETIRED_WARNING,
  Ring,
  STATUS,
  type StatusId,
  StatusLight,
  type Tone,
} from "./system";

/**
 * 04 COLOUR AND STATUS. The base is achromatic (production's grounds and
 * inks, kept); colour is light, and light has a source (the photographs, the
 * seed, the house five, in that order); a status is a point and its word,
 * drawn here in an album beside the album's own light and its photographs, so
 * "a status never reads as the brand" is seen, not claimed. Every value
 * printed is the value drawn; every contrast claimed is measured off the frame.
 */

const SCENE_PHOTOS = [
  "wedding-toast",
  "party-balloons",
  "reception-table",
] as const;
const SCENE_LIGHT = lightOfPhotos(SCENE_PHOTOS);

const short = (t: Tone) => `${t.l} ${t.c} ${t.h}`;

function Swatch({ name, t, w }: { name: string; t: Tone; w: number }) {
  const r = ink("room");
  return (
    <div style={{ width: w }}>
      <div
        style={{
          height: 58,
          background: t.hex,
          borderRadius: 3,
          boxShadow: "inset 0 0 0 1px rgb(255 255 255 / 0.1)",
        }}
      />
      <p className="ag-caption" style={{ marginTop: 8, fontWeight: 500 }}>
        {name}
      </p>
      <p className="ag-caption ag-num" style={{ color: r.faint, fontSize: 11 }}>
        {short(t)}
      </p>
    </div>
  );
}

function SourceRow({
  n,
  name,
  line,
  light,
  art,
  desk,
}: {
  n: number;
  name: string;
  line: string;
  light: Light;
  art: React.ReactNode;
  desk: boolean;
}) {
  const r = ink("room");
  const values = light
    .slice(0, desk ? 3 : 1)
    .map((x) => lampTone(x, "room").oklch)
    .join("  ");
  return (
    <div className="flex items-center" style={{ gap: desk ? 22 : 16 }}>
      <div
        className="flex shrink-0 items-center justify-center"
        style={{ width: desk ? 104 : 76, height: desk ? 70 : 56 }}
      >
        {art}
      </div>
      <div className="min-w-0 flex-1">
        <p className="ag-body" style={{ fontSize: 14 }}>
          <span className="ag-num" style={{ color: r.faint }}>
            {n}{" "}
          </span>
          <span style={{ fontWeight: 600 }}>{name}</span>
          <span style={{ color: r.muted }}> {line}</span>
        </p>
        <LightChips
          light={light}
          register="room"
          height={6}
          className="mt-2.5 w-full"
        />
        <p
          className="ag-num mt-1.5"
          style={{
            color: r.faint,
            fontSize: 10.5,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {values}
        </p>
      </div>
      <Ring
        light={light}
        ground="room"
        size={desk ? 34 : 28}
        glyph="none"
        breathe={false}
      />
    </div>
  );
}

/** The album in situ: photographs, the album's own light (its shutter), and three states. */
function Scene({
  desk,
  ground = "room",
  photos = SCENE_PHOTOS,
  tile,
}: {
  desk: boolean;
  ground?: "room" | "paper";
  photos?: readonly (typeof SCENE_PHOTOS)[number][];
  tile: number;
}) {
  const r = ink(ground);
  const on = ground === "room" ? "on the album" : "on the paper album";
  return (
    <div
      style={{
        background:
          ground === "room" ? GROUND.roomCard.hex : GROUND.paperCard.hex,
        borderRadius: 16,
        padding: desk ? 18 : 12,
        boxShadow:
          ground === "paper" ? "0 1px 2px rgb(0 0 0 / 0.06)" : undefined,
      }}
    >
      <div className="flex" style={{ gap: 3 }}>
        {photos.map((id) => (
          <LitPhoto
            key={id}
            id={id}
            ground={ground}
            style={{ width: tile, height: Math.round(tile * 0.72) }}
          />
        ))}
      </div>
      <div
        className="flex items-center justify-between"
        style={{ marginTop: desk ? 20 : 16 }}
      >
        <div className="flex flex-col" style={{ gap: desk ? 13 : 12 }}>
          <StatusLight
            state="standby"
            ground={ground}
            contrast={`standby point ${on}`}
            wordContrast={`status word ${on}`}
          >
            3 waiting for you
          </StatusLight>
          <StatusLight
            state="ready"
            ground={ground}
            contrast={`ready point ${on}`}
          >
            12 approved
          </StatusLight>
          <StatusLight
            state="fault"
            ground={ground}
            contrast={`fault point ${on}`}
          >
            1 upload failed
          </StatusLight>
        </div>
        <div
          className="flex flex-col items-center"
          style={{ gap: 12, paddingRight: desk ? 22 : 10 }}
        >
          <Ring
            light={SCENE_LIGHT}
            ground={ground}
            size={desk ? 56 : 48}
            label="Add photos"
          />
          <Readout style={{ color: r.faint }}>The album&apos;s light</Readout>
        </div>
      </div>
    </div>
  );
}

function StatusTable({ desk }: { desk: boolean }) {
  const r = ink("room");
  return (
    <div className="flex flex-col">
      {(Object.keys(STATUS) as StatusId[]).map((id, i) => {
        const s = STATUS[id];
        return (
          <div
            key={id}
            className="grid items-center"
            style={{
              gridTemplateColumns: desk
                ? "16px 78px 1fr 146px 184px"
                : "16px 1fr",
              columnGap: 12,
              rowGap: 3,
              padding: "9px 0",
              borderTop: i ? "1px solid rgb(255 255 255 / 0.08)" : undefined,
            }}
          >
            <span
              className="ag-point"
              data-state={id}
              style={{ color: s.room.hex, width: 8, height: 8 }}
            />
            <span
              className="ag-body"
              style={{ fontSize: 13.5, fontWeight: 600 }}
            >
              {s.name}
            </span>
            <span
              className="ag-caption"
              style={{
                color: r.muted,
                gridColumn: desk ? undefined : "2 / -1",
              }}
            >
              {s.means}
            </span>
            <span
              className="ag-caption ag-num"
              style={{
                color: r.faint,
                gridColumn: desk ? undefined : "2 / -1",
              }}
            >
              Room {short(s.room)}
            </span>
            <span
              className="ag-caption ag-num flex items-center gap-2"
              style={{
                color: INK.paper.muted.hex,
                background: GROUND.paper.hex,
                borderRadius: 4,
                padding: "3px 8px",
                justifySelf: "start",
                gridColumn: desk ? undefined : "2 / -1",
              }}
            >
              <span
                className="ag-point"
                data-state={id}
                style={{ color: s.paper.hex, width: 8, height: 8 }}
              />
              Paper {short(s.paper)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Why({
  desk,
  ground = "room",
}: {
  desk: boolean;
  ground?: "room" | "paper";
}) {
  const r = ink(ground);
  return (
    <div className="flex items-start" style={{ gap: desk ? 18 : 14 }}>
      <div
        className="ag-never shrink-0"
        style={{
          width: 44,
          height: 44,
          borderRadius: 3,
          background: RETIRED_WARNING.hex,
          color: GROUND[ground].hex,
        }}
      />
      <p
        className="ag-body"
        style={{ fontSize: desk ? 14 : 13.5, color: r.muted }}
      >
        <span style={{ color: r.fg, fontWeight: 600 }}>Waiting was amber</span>
        {` (oklch ${short(RETIRED_WARNING)}): after the hashvatar, the commonest colour in the app, so it read as the brand. Waiting is a pause, not a warning: now it is the camera's standby, half-lit and breathing, with no hue at all.`}
      </p>
    </div>
  );
}

export function ColorSlide({ screen }: SlideProps) {
  const desk = screen === "1440";
  const r = ink("room");
  const sources = [
    {
      name: "The photographs.",
      line: "Sampled from what is on the screen, at its own intensity.",
      light: lightOfPhoto("party-dj"),
      art: (
        <LitPhoto
          id="party-dj"
          style={{ width: desk ? 104 : 76, height: desk ? 70 : 52 }}
        />
      ),
    },
    {
      name: "The seed.",
      line: "Before the first photograph: the event's own hue, at three depths.",
      light: lightOfSeed(PARTY.seed),
      art: (
        <Seeded
          seed={PARTY.seed}
          style={{ width: desk ? 60 : 48, height: desk ? 60 : 48 }}
        />
      ),
    },
    {
      name: "The house.",
      line: "Where neither exists: the five lamps.",
      light: HOUSE,
      art: (
        <div className="flex" style={{ gap: 5 }}>
          {LAMPS.map((x) => (
            <span
              key={x.n}
              style={{
                width: desk ? 14 : 10,
                height: desk ? 14 : 10,
                borderRadius: 99,
                background: x.hex,
              }}
            />
          ))}
        </div>
      ),
    },
  ];
  const grounds = (
    <div className="flex flex-wrap" style={{ gap: desk ? 12 : 10 }}>
      <Swatch name="Room" t={GROUND.room} w={desk ? 92 : 98} />
      <Swatch name="Card" t={GROUND.roomCard} w={desk ? 92 : 98} />
      <Swatch name="Display" t={GROUND.display} w={desk ? 92 : 98} />
      <Swatch name="Well" t={GROUND.well} w={desk ? 92 : 98} />
      <Swatch name="Paper" t={GROUND.paper} w={desk ? 92 : 98} />
      <Swatch name="Paper card" t={GROUND.paperCard} w={desk ? 92 : 98} />
    </div>
  );
  const inks = (
    <div
      className="flex flex-wrap items-center"
      style={{ gap: desk ? 18 : 12 }}
    >
      {(["fg", "muted", "faint"] as const).map((k) => (
        <span
          key={`r${k}`}
          className="ag-subtitle"
          style={{ color: INK.room[k].hex, fontSize: 22 }}
        >
          Aa
        </span>
      ))}
      <span
        className="flex items-center"
        style={{
          gap: desk ? 18 : 12,
          background: GROUND.paper.hex,
          padding: "6px 12px",
          borderRadius: 4,
        }}
      >
        {(["fg", "muted", "faint"] as const).map((k) => (
          <span
            key={`p${k}`}
            className="ag-subtitle"
            style={{ color: INK.paper[k].hex, fontSize: 22 }}
          >
            Aa
          </span>
        ))}
      </span>
      <span className="ag-caption" style={{ color: r.faint }}>
        Ink: three steps on each ground, solid greys at hue 286.
      </span>
    </div>
  );

  if (!desk)
    return (
      <SlideRoot screen={screen} ground="room">
        <div
          className="absolute inset-x-0 px-5"
          style={{ top: HEAD[screen] + 26 }}
        >
          <Readout style={{ color: r.faint }}>The ground is quiet</Readout>
          <div className="mt-4">{grounds}</div>
          <div className="mt-5">{inks}</div>
          <Readout className="mt-10 block" style={{ color: r.faint }}>
            Colour is light, and it has a source
          </Readout>
          <div className="mt-4 flex flex-col gap-6">
            {sources.map((s, i) => (
              <SourceRow key={s.name} n={i + 1} {...s} desk={false} />
            ))}
          </div>
          <Readout className="mt-10 block" style={{ color: r.faint }}>
            Status is a point and its word
          </Readout>
          <div className="mt-4">
            <Scene desk={false} tile={101} />
          </div>
          <div className="mt-3">
            <StatusTable desk={false} />
          </div>
        </div>
        <div
          className="absolute inset-x-0 bottom-0 px-5"
          style={{
            top: 1404,
            background: GROUND.paper.hex,
            color: INK.paper.fg.hex,
          }}
        >
          <div className="mt-7">
            <Scene
              desk={false}
              ground="paper"
              photos={["wedding-toast", "party-balloons", "reception-table"]}
              tile={101}
            />
          </div>
          <div className="mt-6">
            <Why desk={false} ground="paper" />
          </div>
        </div>
      </SlideRoot>
    );

  const p = ink("paper");
  return (
    <SlideRoot screen={screen} ground="room">
      <div className="absolute" style={{ left: 64, top: 92, width: 640 }}>
        <Readout style={{ color: r.faint }}>The ground is quiet</Readout>
        <div style={{ marginTop: 14 }}>{grounds}</div>
        <div style={{ marginTop: 16 }}>{inks}</div>
        <Readout className="block" style={{ color: r.faint, marginTop: 34 }}>
          Colour is light, and it has a source
        </Readout>
        <div className="flex flex-col" style={{ marginTop: 14, gap: 16 }}>
          {sources.map((s, i) => (
            <SourceRow key={s.name} n={i + 1} {...s} desk />
          ))}
        </div>
      </div>
      <div className="absolute" style={{ left: 772, top: 92, width: 604 }}>
        <Readout style={{ color: r.faint }}>
          Status is a point and its word
        </Readout>
        <div style={{ marginTop: 14 }}>
          <Scene desk tile={187} />
        </div>
        <div style={{ marginTop: 10 }}>
          <StatusTable desk />
        </div>
      </div>

      {/* The same states on paper, beside paper's own light. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ top: 686, background: GROUND.paper.hex, color: p.fg }}
      >
        <div
          className="absolute flex items-center"
          style={{ left: 64, top: 0, bottom: 0, gap: 22 }}
        >
          <div className="flex" style={{ gap: 3 }}>
            {(["wedding-arch", "wedding-rings"] as const).map((id) => (
              <LitPhoto
                key={id}
                id={id}
                ground="paper"
                style={{ width: 150, height: 108 }}
              />
            ))}
          </div>
          <div className="flex flex-col" style={{ gap: 13, marginLeft: 8 }}>
            <StatusLight
              state="standby"
              ground="paper"
              contrast="standby point on paper"
              wordContrast="status word on paper"
            >
              3 waiting for you
            </StatusLight>
            <StatusLight
              state="ready"
              ground="paper"
              contrast="ready point on paper"
            >
              12 approved
            </StatusLight>
            <StatusLight
              state="fault"
              ground="paper"
              contrast="fault point on paper"
            >
              1 upload failed
            </StatusLight>
          </div>
          <div
            className="flex flex-col items-center"
            style={{ gap: 12, marginLeft: 26 }}
          >
            <Ring
              light={lightOfPhotos(["wedding-arch", "wedding-rings"])}
              ground="paper"
              size={52}
              label="Add photos"
            />
            <Readout style={{ color: p.faint }}>The album&apos;s light</Readout>
          </div>
        </div>
        <div className="absolute" style={{ left: 772, top: 44, width: 604 }}>
          <Why desk ground="paper" />
        </div>
      </div>
    </SlideRoot>
  );
}
