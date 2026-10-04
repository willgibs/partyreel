"use client";

import type { CSSProperties, ReactNode } from "react";

import type { SlideProps } from "../deck/contract";
import { HEAD } from "../deck/deck";
import { Photo, type PhotoId, Reel } from "../deck/media";
import { ink, SlideRoot } from "./root";
import {
  bandOf,
  Bloom,
  conicOf,
  GROUND,
  INK,
  lightOfEdge,
  lightOfPhoto,
  lightOfPhotos,
  LitPhoto,
  Readout,
  Ring,
  Seam,
} from "./system";

/**
 * 05 THE SIGNATURE: the light, in three forms with one job each, drawn on
 * real photographs; its paper register beside the room's own (the solve: on
 * paper the room's register is a stain, the paper register is light); and
 * where it never goes.
 */

const ALBUM: readonly PhotoId[] = [
  "wedding-toast",
  "wedding-rings",
  "reception-table",
  "wedding-golden",
  "wedding-arch",
  "party-balloons",
];

/** The Ring: the album's foot, the photographs fading to the room under the shutter. */
function RingPanel({ w, h }: { w: number; h: number }) {
  const tile = Math.floor((w - 6) / 3);
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h, background: GROUND.well.hex, borderRadius: 4 }}>
      <div className="grid grid-cols-3" style={{ gap: 3 }}>
        {ALBUM.map((id) => (
          <LitPhoto key={id} id={id} style={{ width: tile, height: tile }} />
        ))}
      </div>
      {/* The album fades to the room under the shutter: the Ring stands on the
          room, never on a photograph. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: h * 0.62,
          background: `linear-gradient(to bottom, transparent 0%, ${GROUND.room.hex} 62%)`,
        }}
      />
      <div className="absolute inset-x-0 flex justify-center" style={{ bottom: h * 0.11 }}>
        <Ring light={lightOfPhotos(ALBUM)} ground="room" size={Math.round(w * 0.15)} label="Add photos" />
      </div>
    </div>
  );
}

/** The Seam: light born at the cover photograph's foot, in the foot's own colours. */
function SeamPanel({ w, h }: { w: number; h: number }) {
  const t = ink("room");
  const cover = Math.round(h * 0.52);
  return (
    <div className="relative overflow-hidden" style={{ width: w, height: h, background: GROUND.room.hex, borderRadius: 4 }}>
      <LitPhoto id="reception-table" style={{ width: w, height: cover }} focus="50% 62%" />
      <div className="absolute inset-x-0" style={{ top: cover, height: h - cover }}>
        <Seam
          light={lightOfEdge("reception-table", "bottom")}
          ground="room"
          reach={Math.round(h * 0.34)}
        />
        <div className="absolute" style={{ left: 22, bottom: 20 }}>
          <p className="ag-subtitle" style={{ fontSize: Math.round(w * 0.058) }}>
            Maya &amp; Jay
          </p>
          <Readout style={{ color: t.faint }}>31 guests · 1,284 photos</Readout>
        </div>
      </div>
    </div>
  );
}

/** The Bloom: behind the one live subject, here the reel as it plays. */
function BloomPanel({ w, h }: { w: number; h: number }) {
  const t = ink("room");
  const rw = Math.round(w * 0.74);
  const rh = Math.round((rw * 9) / 16);
  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: w, height: h, background: GROUND.room.hex, borderRadius: 4, gap: 26 }}>
      <div style={{ width: rw, height: rh }}>
        <Bloom light={lightOfPhoto("festival-lights")} ground="room" blur={Math.round(rw * 0.13)} style={{ height: "100%" }}>
          <div className="ag-photo size-full" data-ground="room">
            <Reel id="hero-candidate-02" />
          </div>
        </Bloom>
      </div>
      <Readout style={{ color: t.faint }}>The reel, playing</Readout>
    </div>
  );
}

function FormCaption({ name, line, w }: { name: string; line: string; w: number }) {
  const t = ink("room");
  return (
    <div style={{ width: w }}>
      <p className="ag-subtitle" style={{ fontSize: 22 }}>
        {name}
      </p>
      <p className="ag-body" style={{ color: t.muted, fontSize: 14, marginTop: 4 }}>
        {line}
      </p>
    </div>
  );
}

const FORMS = [
  ["The Ring", "Round what adds a photograph, and the icon. It fills as photographs go, and stands on the room."],
  ["The Seam", "Where the media ends and the ground begins: born at the edge in the edge's own colours, spent before the words."],
  ["The Bloom", "Behind the one live subject: the code, the reel. It ignites once and rests lit."],
] as const;

/** The paper solve: the room's register dropped on paper is a stain; paper's own is light. */
function PaperSolve({ w, h, desk }: { w: number; h: number; desk: boolean }) {
  const p = ink("paper");
  const half = (w - 16) / 2;
  const light = lightOfEdge("reception-table", "bottom");
  const photoW = half - 48;
  const photoH = Math.round(photoW * 0.4);
  const one = (register: "room" | "paper") => (
    <div className="relative" style={{ width: half }}>
      <div className="relative" style={{ marginLeft: 24, width: photoW }}>
        <LitPhoto id="reception-table" ground="paper" style={{ width: photoW, height: photoH }} focus="50% 70%" />
        <div className="relative" style={{ height: desk ? 64 : 58 }}>
          {register === "paper" ? (
            <Seam light={light} ground="paper" reach={desk ? 52 : 46} drift={false} />
          ) : (
            <div
              aria-hidden
              className="absolute inset-x-0 top-0"
              style={{
                height: desk ? 64 : 58,
                background: bandOf(light, "room"),
                opacity: 0.62,
                WebkitMaskImage: "linear-gradient(to bottom, #000, transparent)",
                maskImage: "linear-gradient(to bottom, #000, transparent)",
              }}
            />
          )}
        </div>
      </div>
      <p className="ag-caption" style={{ color: register === "paper" ? p.fg : p.faint, marginLeft: 24, marginTop: 2, fontWeight: register === "paper" ? 600 : 400 }}>
        {register === "paper" ? "Paper's register: a line, then a short glow." : "The room's register on paper: a stain."}
      </p>
    </div>
  );
  return (
    <div style={{ width: w, height: h, background: GROUND.paper.hex, color: p.fg, borderRadius: 4, paddingTop: desk ? 22 : 18 }}>
      <Readout style={{ color: p.faint, marginLeft: 24 }}>On paper</Readout>
      <div className="flex" style={{ gap: 16, marginTop: desk ? 16 : 14 }}>
        {one("room")}
        {one("paper")}
      </div>
    </div>
  );
}

/** One never: a thumbnail of the mistake, crossed in the ground's ink. */
function Never({ label, children, w }: { label: string; children: ReactNode; w: number }) {
  const t = ink("room");
  return (
    <div style={{ width: w }}>
      <div className="ag-never relative overflow-hidden" style={{ width: w, height: Math.round(w * 0.7), borderRadius: 4, color: INK.room.fg.hex }}>
        {children}
      </div>
      <p className="ag-caption" style={{ color: t.muted, marginTop: 8 }}>
        {label}
      </p>
    </div>
  );
}

function Nevers({ w, cols }: { w: number; cols: number }) {
  const tw = Math.floor((w - (cols - 1) * 14) / cols);
  const th = Math.round(tw * 0.7);
  const light = lightOfPhoto("party-balloons");
  const box: CSSProperties = { position: "absolute", inset: 0 };
  return (
    <div className="flex flex-wrap" style={{ gap: 14, rowGap: 18, width: w }}>
      <Never label="Over a photograph" w={tw}>
        <Photo id="party-balloons" />
        <div style={{ ...box, background: bandOf(light, "room"), opacity: 0.5 }} />
      </Never>
      <Never label="Behind words" w={tw}>
        <div style={{ ...box, background: GROUND.roomCard.hex }} />
        <div style={{ ...box, background: conicOf(light, "room"), filter: "blur(14px)", opacity: 0.7, inset: "26%" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 4 }}>
          <span className="ag-subtitle" style={{ fontSize: Math.round(th * 0.2) }}>
            Your album
          </span>
        </div>
      </Never>
      <Never label="On a control's fill" w={tw}>
        <div style={{ ...box, background: GROUND.roomCard.hex }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="ag-body"
            style={{ background: bandOf(light, "room"), color: "#111", padding: "6px 14px", borderRadius: 99, fontWeight: 600, fontSize: 12 }}
          >
            Start free
          </span>
        </div>
      </Never>
      <Never label="A wash across a page" w={tw}>
        <div style={{ ...box, background: bandOf(lightOfPhoto("festival-lights"), "room"), opacity: 0.55 }} />
        <div style={{ ...box, background: "linear-gradient(to bottom, transparent, rgb(10 10 12 / 0.6))" }} />
      </Never>
      <Never label="Two in one view" w={tw}>
        <div style={{ ...box, background: GROUND.roomCard.hex }} />
        <div style={{ position: "absolute", left: "12%", top: "18%", width: "34%", height: "40%", background: conicOf(light, "room"), filter: "blur(10px)", opacity: 0.8 }} />
        <div className="absolute" style={{ right: "18%", bottom: "16%" }}>
          <Ring light={light} ground="room" size={Math.round(th * 0.26)} glyph="none" breathe={false} />
        </div>
      </Never>
    </div>
  );
}

export function SignatureSlide({ screen }: SlideProps) {
  const t = ink("room");
  const desk = screen === "1440";
  if (!desk) {
    const pw = 327;
    const ph = 200;
    return (
      <SlideRoot screen={screen} ground="room">
        <div className="absolute inset-x-0 px-6" style={{ top: HEAD[screen] + 26 }}>
          <Readout style={{ color: t.faint }}>The signature</Readout>
          <h2 className="ag-title mt-3" style={{ fontSize: 34 }}>
            Three forms, one light.
          </h2>
          <p className="ag-body mt-3" style={{ color: t.muted, fontSize: 14 }}>
            Born from the photographs, at an edge. Never on them, never behind words, one
            to a screen, on one slow clock.
          </p>
          <div className="mt-7 flex flex-col" style={{ gap: 22 }}>
            <div className="flex flex-col gap-3">
              <RingPanel w={pw} h={ph} />
              <FormCaption name={FORMS[0][0]} line={FORMS[0][1]} w={pw} />
            </div>
            <div className="flex flex-col gap-3">
              <SeamPanel w={pw} h={ph} />
              <FormCaption name={FORMS[1][0]} line={FORMS[1][1]} w={pw} />
            </div>
            <div className="flex flex-col gap-3">
              <BloomPanel w={pw} h={ph} />
              <FormCaption name={FORMS[2][0]} line={FORMS[2][1]} w={pw} />
            </div>
          </div>
          <div className="mt-8">
            <PaperSolve w={pw} h={226} desk={false} />
          </div>
          <Readout className="mt-9 block" style={{ color: t.faint }}>
            Never
          </Readout>
          <div className="mt-4">
            <Nevers w={pw} cols={3} />
          </div>
          <p className="ag-caption mt-6" style={{ color: t.muted }}>
            One clock: the light drifts once in 24 s; a bloom ignites in 1.4 s and rests
            lit; the interface answers at once.
          </p>
        </div>
      </SlideRoot>
    );
  }
  const pw = 408;
  const ph = 300;
  return (
    <SlideRoot screen={screen} ground="room">
      <div className="absolute flex items-end justify-between" style={{ left: 64, right: 64, top: 92 }}>
        <div>
          <Readout style={{ color: t.faint }}>The signature</Readout>
          <h2 className="ag-title" style={{ fontSize: 44, marginTop: 12 }}>
            Three forms, one light.
          </h2>
        </div>
        <p className="ag-body" style={{ color: t.muted, fontSize: 15, maxWidth: 470, paddingBottom: 4 }}>
          Born from the photographs, at an edge. Never on them, never behind words, one to
          a screen, on one slow clock.
        </p>
      </div>
      <div className="absolute flex" style={{ left: 64, top: 196, gap: 44 }}>
        {[RingPanel, SeamPanel, BloomPanel].map((P, i) => (
          <div key={FORMS[i][0]} className="flex flex-col" style={{ gap: 16 }}>
            <P w={pw} h={ph} />
            <FormCaption name={FORMS[i][0]} line={FORMS[i][1]} w={pw} />
          </div>
        ))}
      </div>
      <div className="absolute" style={{ left: 64, top: 622 }}>
        <PaperSolve w={600} h={256} desk />
      </div>
      <div className="absolute" style={{ left: 712, top: 626, width: 664 }}>
        <Readout style={{ color: t.faint }}>Never</Readout>
        <div style={{ marginTop: 14 }}>
          <Nevers w={664} cols={5} />
        </div>
        <p className="ag-caption" style={{ color: t.muted, marginTop: 16 }}>
          One clock: the light drifts once in 24 s; a bloom ignites in 1.4 s and rests lit;
          the interface answers at once.
        </p>
      </div>
    </SlideRoot>
  );
}
