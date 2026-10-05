"use client";

import { Photo, type PhotoId } from "../../deck/media";
import { HEAD } from "../../deck/deck";
import {
  Copy,
  Display,
  Kicker,
  type Screen,
  SlideFoot,
  SlideRoot,
  trackFor,
} from "../parts";
import { Edge, EdgeArrow, GROUND, PARTY_EDGE, Print, vars } from "../system";

/**
 * 07 TYPE, IMAGERY, MOTION: the three faces and a short ladder set in real
 * lines; how photographs are chosen and shown; and the three motions, each a
 * live specimen that rests complete under reduced motion.
 */

const LADDER: readonly {
  role: string;
  size: string;
  show: number;
  face: "display" | "read" | "edge";
  text: string;
}[] = [
  {
    role: "Hero",
    size: "112 / 48",
    show: 74,
    face: "display",
    text: "Every frame.",
  },
  {
    role: "Section",
    size: "56 / 34",
    show: 40,
    face: "display",
    text: "Watch it develop.",
  },
  {
    role: "Title",
    size: "28 / 24",
    show: 28,
    face: "display",
    text: "Maya & Jay",
  },
  {
    role: "Read",
    size: "17 / 16",
    show: 17,
    face: "read",
    text: "Your guests took the best photos and videos at your event.",
  },
  {
    role: "Caption",
    size: "13",
    show: 13,
    face: "read",
    text: "312 photos from 48 guests",
  },
  { role: "Edge", size: "11", show: 11, face: "edge", text: "" },
];

const PRINCIPLES = [
  "Candid, from inside the party: a guest's angle, never a set-up.",
  "The whole roll: the blur and the blink beside the keeper.",
  "As shot. No filters, grain, leaks or sepia: the craft is in the paper, never on the picture.",
  "Every frame credited on its edge.",
  "Daylight as much as dark: a noon garden is as much Partyreel as a dance floor.",
];

const CANDID: readonly PhotoId[] = [
  "party-dj",
  "wedding-toast",
  "festival-crowd",
  "wedding-arch",
  "reception-hall",
  "wedding-rings",
];
const ADVANCE: readonly PhotoId[] = [
  "wedding-rings",
  "party-balloons",
  "concert-confetti",
  "reception-table",
];
const LOUPE: readonly PhotoId[] = [
  "festival-lights",
  "wedding-golden",
  "reception-hall",
  "party-dj",
  "wedding-toast",
  "festival-crowd",
  "wedding-arch",
  "concert-confetti",
];

function Ladder({ narrow = false }: { narrow?: boolean }) {
  return (
    <div style={{ display: "grid", gap: narrow ? 14 : 24 }}>
      {LADDER.map((r) => (
        <div
          key={r.role}
          style={{
            display: "grid",
            gridTemplateColumns: narrow ? "1fr" : "92px 1fr",
            alignItems: "baseline",
            gap: narrow ? 4 : 12,
          }}
        >
          <span className="cs-edge cs-faint" style={{ fontSize: 11 }}>
            {r.role} {r.size}
          </span>
          {r.face === "edge" ? (
            <Edge items={PARTY_EDGE} size={11} />
          ) : r.face === "display" ? (
            <span
              className="cs-display"
              style={{
                fontSize: narrow ? Math.min(r.show, 52) : r.show,
                letterSpacing: trackFor(r.show),
                lineHeight: 1,
              }}
            >
              {r.text}
            </span>
          ) : (
            <span
              className="cs-read"
              style={{ fontSize: r.show, lineHeight: 1.45 }}
            >
              {r.text}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function Bullets({
  items,
  size = 14,
}: {
  items: readonly string[];
  size?: number;
}) {
  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        display: "grid",
        gap: 9,
      }}
    >
      {items.map((t) => (
        <li
          key={t}
          className="cs-read cs-muted"
          style={{
            display: "flex",
            gap: 10,
            fontSize: size,
            lineHeight: `${Math.round(size * 1.42)}px`,
          }}
        >
          <span
            className="cs-edge"
            style={{
              fontSize: size * 0.8,
              height: Math.round(size * 1.42),
              color: GROUND.ink.hex,
              flex: "none",
            }}
            aria-hidden
          >
            <EdgeArrow />
          </span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

/** The develop, looping as a specimen. */
function DevelopSpecimen({ w }: { w: number }) {
  return (
    <Print
      photo="party-balloons"
      w={w}
      border={Math.round(w * 0.05)}
      develop={{ loop: true }}
      edge={["Develop", "2.4 s"]}
      edgeSize={9}
    />
  );
}

/** The frame advance: a strip that steps one frame, holds, steps again. */
function AdvanceSpecimen({ w }: { w: number }) {
  const fw = Math.round((w - 20) / 2.6);
  const fh = Math.round(fw / 1.5);
  const step = fw + 6;
  const run = [...ADVANCE, ...ADVANCE];
  return (
    <div
      className="cs-strip"
      style={{ width: w, padding: "22px 0 10px", overflow: "hidden" }}
    >
      <Edge
        items={["Advance", "180 ms", ...PARTY_EDGE.slice(1, 3)]}
        size={9}
        repeat={2}
        className="cs-edge-dim"
        style={{ position: "absolute", left: 10, right: 0, top: 7 }}
      />
      <div
        style={{
          display: "flex",
          gap: 6,
          paddingLeft: 10,
          ...vars({ "--cs-step": `${step}px` }),
        }}
        className="cs-advance"
      >
        {run.map((p, i) => (
          <div
            key={`${p}-${i}`}
            className="cs-strip-frame"
            style={{ width: fw, height: fh }}
          >
            <Photo id={p} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** The loupe: one frame of a sheet lifts under the finger, held, then set down. */
function LoupeSpecimen({ w }: { w: number }) {
  const cols = 4;
  const fw = Math.floor((w - 20 - (cols - 1) * 5) / cols);
  const fh = Math.round(fw / 1.5);
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${fw}px)`,
        gap: 5,
        width: w,
        boxSizing: "border-box",
        background: GROUND.sheet.hex,
        padding: 10,
      }}
    >
      {LOUPE.map((p, i) => {
        const lifted = i === 5;
        return (
          <div
            key={p}
            style={{
              position: "relative",
              width: fw,
              height: fh,
              zIndex: lifted ? 2 : 1,
            }}
          >
            <div
              className={lifted ? "cs-loupe" : undefined}
              style={{
                position: "absolute",
                inset: 0,
                transformOrigin: "50% 92%",
              }}
            >
              {lifted && (
                <div
                  className="cs-loupe-shadow"
                  style={{
                    position: "absolute",
                    inset: -3,
                    background: GROUND.print.hex,
                    boxShadow: "0 10px 22px -6px rgb(22 18 15 / 0.45)",
                    opacity: 0,
                  }}
                />
              )}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  overflow: "hidden",
                  borderRadius: 1,
                }}
              >
                <Photo id={p} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Motion({ w, gap = 18 }: { w: number; gap?: number }) {
  return (
    <div style={{ display: "grid", gap }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
        <div style={{ width: Math.round(w * 0.46), flex: "none" }}>
          <DevelopSpecimen w={Math.round(w * 0.46)} />
        </div>
        <Copy size={13} lead={18}>
          <strong style={{ color: GROUND.ink.hex }}>The develop.</strong> A
          photo rises from paper white through warm midtones, 2.4 s, once, as it
          arrives.
        </Copy>
      </div>
      <div>
        <AdvanceSpecimen w={w} />
        <Copy size={13} lead={18} style={{ marginTop: 8 }}>
          <strong style={{ color: GROUND.ink.hex }}>The frame advance.</strong>{" "}
          One crisp step, 180 ms, then the frame holds: the reel, a carousel.
        </Copy>
      </div>
      <div>
        <LoupeSpecimen w={w} />
        <Copy size={13} lead={18} style={{ marginTop: 8 }}>
          <strong style={{ color: GROUND.ink.hex }}>The loupe.</strong> A frame
          lifts 1.6 times under the finger, 140 ms in, 100 ms back.
        </Copy>
      </div>
      <Copy size={13} lead={18}>
        <strong style={{ color: GROUND.ink.hex }}>At rest.</strong> Under
        reduced motion every print is developed, nothing advances, and the loupe
        is a tap.
      </Copy>
    </div>
  );
}

export function VoiceSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <VoiceDesk /> : <VoicePhone />;
}

function VoiceDesk() {
  return (
    <SlideRoot screen="1440">
      <div
        className="absolute"
        style={{ left: 64, top: HEAD["1440"] + 42, width: 540 }}
      >
        <Kicker>Type</Kicker>
        <Display size={36} style={{ marginTop: 16, lineHeight: 1 }}>
          Bricolage Grotesque
        </Display>
        <Copy size={14} lead={20} style={{ marginTop: 8, maxWidth: 500 }}>
          ExtraBold at its display cut: ink traps made for ink on paper. Inter
          reads. Antonio prints the edge and nothing else; no monospace
          anywhere.
        </Copy>
        <div style={{ marginTop: 28 }}>
          <Ladder />
        </div>
      </div>
      <div
        className="absolute"
        style={{ left: 652, top: HEAD["1440"] + 42, width: 330 }}
      >
        <Kicker>Imagery</Kicker>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "157px 157px",
            gap: 16,
            marginTop: 18,
          }}
        >
          {CANDID.map((p) => (
            <Print key={p} photo={p} w={157} border={7} flat />
          ))}
        </div>
        <div style={{ marginTop: 22 }}>
          <Bullets items={PRINCIPLES} size={14} />
        </div>
      </div>
      <div
        className="absolute"
        style={{ left: 1022, top: HEAD["1440"] + 42, width: 354 }}
      >
        <Kicker>Motion</Kicker>
        <div style={{ marginTop: 18 }}>
          <Motion w={354} gap={16} />
        </div>
      </div>
      <SlideFoot screen="1440" />
    </SlideRoot>
  );
}

function VoicePhone() {
  return (
    <SlideRoot screen="375">
      <div
        className="absolute"
        style={{ left: 16, right: 16, top: HEAD["375"] + 24 }}
      >
        <Kicker style={{ fontSize: 11 }}>Type</Kicker>
        <Display size={32} style={{ marginTop: 12, lineHeight: 1 }}>
          Bricolage Grotesque
        </Display>
        <Copy size={14} lead={20} style={{ marginTop: 8 }}>
          ExtraBold at its display cut: ink traps made for ink on paper. Inter
          reads. Antonio prints the edge and nothing else.
        </Copy>
        <div style={{ marginTop: 20 }}>
          <Ladder narrow />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 32 }}>Imagery</Kicker>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginTop: 14,
          }}
        >
          {CANDID.slice(0, 4).map((p) => (
            <Print key={p} photo={p} w={164} border={7} flat />
          ))}
        </div>
        <div style={{ marginTop: 18 }}>
          <Bullets items={PRINCIPLES} size={14} />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 32 }}>Motion</Kicker>
        <div style={{ marginTop: 14 }}>
          <Motion w={343} gap={18} />
        </div>
      </div>
      <SlideFoot screen="375" />
    </SlideRoot>
  );
}
