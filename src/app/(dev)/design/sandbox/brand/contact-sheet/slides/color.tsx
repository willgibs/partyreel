"use client";

import { GUESTS, type PhotoId, Photo, Seeded } from "../../deck/media";
import { HEAD } from "../../deck/deck";
import { Copy, Display, Kicker, type Screen, SlideFoot, SlideRoot } from "../parts";
import {
  Edge,
  eventEdge,
  GROUND,
  Mark,
  OLD_WAITING,
  PARTY_EDGE,
  Print,
  STATUS,
  Status,
  type StatusState,
  type Swatch,
} from "../system";

/**
 * 04 COLOR AND STATUS: the achromatic base with its values, where colour
 * comes from (photographs and people), and the status set drawn in situ, on
 * prints beside the event's edge, on paper and in the room, so "the status
 * never reads as the brand" is seen. Every claimed ratio is measured by the
 * deck off the frame (`data-bd-contrast`).
 */

const SWATCHES: readonly Swatch[] = [
  GROUND.paper,
  GROUND.print,
  GROUND.sheet,
  GROUND.ink,
  GROUND.ink2,
  GROUND.faint,
  GROUND.room,
  GROUND.roomInk,
  GROUND.roomMuted,
];

const ORDER: readonly StatusState[] = ["waiting", "done", "failed"];
const THUMBS: Record<StatusState, PhotoId | null> = {
  waiting: "wedding-toast",
  done: "festival-crowd",
  failed: null,
};

function Chip({ s, w }: { s: Swatch; w: number }) {
  return (
    <div style={{ width: w }}>
      <div
        style={{
          height: 54,
          background: s.hex,
          boxShadow: "inset 0 0 0 1px rgb(22 18 15 / 0.1)",
          borderRadius: 2,
        }}
      />
      <p className="cs-read" style={{ margin: "8px 0 0", fontSize: 13, lineHeight: "17px", fontWeight: 600 }}>
        {s.name}
      </p>
      <p className="cs-read cs-tnum" style={{ margin: 0, fontSize: 11.5, lineHeight: "16px", whiteSpace: "nowrap" }}>
        {s.oklch}
      </p>
      <p className="cs-read cs-muted" style={{ margin: 0, fontSize: 12, lineHeight: "16px" }}>
        {s.role}
      </p>
    </div>
  );
}

/** One status, in situ: its mark drawn on a print as a grease pencil would, its word under it. */
function OnPrint({
  state,
  w,
  room,
  measure,
}: {
  state: StatusState;
  w: number;
  room: boolean;
  measure: string;
}) {
  const s = STATUS[state];
  const reg = room ? s.room : s.paper;
  const photo = THUMBS[state];
  const ratio = 4 / 5;
  const b = room ? 0 : Math.round(w * 0.06);
  const ih = Math.round((w - 2 * b) / ratio);
  const h = ih + 2 * b;
  const image = photo ? <Photo id={photo} /> : null;
  return (
    <div style={{ width: w }}>
      <div style={{ position: "relative", width: w, height: h }}>
        {room ? (
          <div
            style={{
              width: w,
              height: h,
              overflow: "hidden",
              borderRadius: 2,
              background: "#1c1814",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.22), 0 0 0 1px rgb(255 255 255 / 0.06)",
              opacity: state === "failed" ? 0.9 : 1,
            }}
          >
            {image}
          </div>
        ) : (
          <Print w={w} ratio={ratio} border={b}>
            {image ?? <div style={{ position: "absolute", inset: 0, background: GROUND.sheet.hex }} />}
          </Print>
        )}
        {state === "waiting" && (
          <Mark
            kind="circle"
            size={Math.round(w * 1.55)}
            color={reg.hex}
            weight={2.4}
            circling
            style={{ position: "absolute", left: -w * 0.27, top: (h - w * 1.55) / 2 }}
          />
        )}
        {state === "done" && (
          <Mark
            kind="tick"
            size={Math.round(w * 0.58)}
            color={reg.hex}
            weight={3.6}
            draw
            delay={900}
            style={{ position: "absolute", right: -w * 0.18, bottom: -w * 0.1 }}
          />
        )}
        {state === "failed" && (
          <Mark
            kind="cross"
            size={Math.round(w * 0.86)}
            color={reg.hex}
            weight={3.4}
            draw
            delay={1300}
            style={{ position: "absolute", left: w * 0.07, top: (h - w * 0.86) / 2 }}
          />
        )}
      </div>
      <p className="cs-read" style={{ margin: "14px 0 0", fontSize: 14, lineHeight: "18px", fontWeight: 600 }}>
        <span style={{ color: reg.hex }} data-bd-contrast={measure}>
          {s.word}
        </span>
      </p>
      <p
        className="cs-read cs-tnum"
        style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "16px", color: room ? GROUND.roomMuted.hex : GROUND.ink2.hex }}
      >
        {s.tool}, {reg.ratio}
      </p>
    </div>
  );
}

function InSitu({ w, gap, room }: { w: number; gap: number; room: boolean }) {
  return (
    <div>
      <Edge
        items={eventEdge(undefined, ["3 arriving"])}
        size={11}
        style={{ color: room ? GROUND.roomMuted.hex : GROUND.ink2.hex }}
      />
      <div style={{ display: "flex", gap, marginTop: 18 }}>
        {ORDER.map((st) => (
          <OnPrint
            key={st}
            state={st}
            w={w}
            room={room}
            measure={`${STATUS[st].word} ${room ? "in the room" : "on paper"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Source({ w, orb }: { w: number; orb: number }) {
  return (
    <div style={{ width: w }}>
      <Print photo="party-balloons" w={w} edge={[...PARTY_EDGE.slice(1, 3), "Sam"]} edgeSize={10} border={12} />
      <Copy size={14} lead={20} style={{ marginTop: 12 }}>
        <strong style={{ color: GROUND.ink.hex }}>Photographs.</strong>{" "}Every hue on a screen is someone&rsquo;s.
      </Copy>
      <div style={{ display: "flex", gap: Math.round(orb * 0.28), marginTop: 22 }}>
        {GUESTS.map((g) => (
          <Seeded key={g.seed} seed={g.seed} style={{ width: orb, height: orb }} />
        ))}
      </div>
      <Copy size={14} lead={20} style={{ marginTop: 12 }}>
        <strong style={{ color: GROUND.ink.hex }}>People.</strong>{" "}Each guest&rsquo;s seeded light, on their avatar and on a print not yet developed.
      </Copy>
    </div>
  );
}

function NotAmber({ size = 14 }: { size?: number }) {
  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span
          className="cs-read"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, minWidth: 104 }}
        >
          <span style={{ width: 9, height: 9, borderRadius: 9, background: OLD_WAITING.hex, flex: "none" }} />
          <span style={{ color: OLD_WAITING.hex }} data-bd-contrast="today's waiting amber on paper">
            Waiting
          </span>
        </span>
        <Copy size={size} lead={Math.round(size * 1.42)}>
          Today&rsquo;s waiting, {OLD_WAITING.oklch}: the commonest colour on a screen with no photographs, so it read as the brand, and a dull one.
        </Copy>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
        <span style={{ minWidth: 104 }}>
          <Status state="waiting" size={14} measure="blue pencil on paper" />
        </span>
        <Copy size={size} lead={Math.round(size * 1.42)}>
          Now a circle in blue pencil, a mark a hand makes and lifts when the state ends. Beside photographs and people it reads as a note on the sheet, never as ours.
        </Copy>
      </div>
    </div>
  );
}

export function ColorSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <ColorDesk /> : <ColorPhone />;
}

function ColorDesk() {
  return (
    <SlideRoot screen="1440">
      <div className="absolute" style={{ left: 64, top: HEAD["1440"] + 42, width: 452 }}>
        <Display size={52} style={{ lineHeight: 0.98 }}>
          No colour of our own.
        </Display>
        <Copy size={16} lead={24} style={{ marginTop: 18 }}>
          Warm paper and deep ink, so a photograph is always the brightest colour on a screen. Colour comes from two places only: the photographs, and the people in them.
        </Copy>
        <Kicker style={{ marginTop: 34 }}>Why waiting is no longer amber</Kicker>
        <div style={{ marginTop: 16 }}>
          <NotAmber size={13} />
        </div>
      </div>
      <div className="absolute" style={{ left: 566, top: HEAD["1440"] + 42 }}>
        <Kicker>Where colour comes from</Kicker>
        <div style={{ marginTop: 18 }}>
          <Source w={322} orb={30} />
        </div>
      </div>
      <div className="absolute" style={{ left: 940, top: HEAD["1440"] + 42, width: 436 }}>
        <Kicker>Status, beside the edge</Kicker>
        <div style={{ marginTop: 18 }}>
          <InSitu w={116} gap={44} room={false} />
        </div>
        <div className="cs-on-room" style={{ marginTop: 22, background: GROUND.room.hex, padding: "18px 20px 18px" }}>
          <InSitu w={106} gap={39} room />
        </div>
      </div>
      <div className="absolute" style={{ left: 64, top: 688, right: 64 }}>
        <Kicker>The base: paper, ink and the room, with no hue</Kicker>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          {SWATCHES.map((s) => (
            <Chip key={s.name} s={s} w={136} />
          ))}
        </div>
      </div>
      <SlideFoot screen="1440" />
    </SlideRoot>
  );
}

/** The base as a list, for a phone: a chip, its name and role, its full value. */
function SwatchList() {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {SWATCHES.map((s) => (
        <div key={s.name} style={{ display: "grid", gridTemplateColumns: "44px 1fr", gap: 12, alignItems: "center" }}>
          <div style={{ height: 34, background: s.hex, boxShadow: "inset 0 0 0 1px rgb(22 18 15 / 0.1)", borderRadius: 2 }} />
          <div>
            <p className="cs-read" style={{ margin: 0, fontSize: 13, lineHeight: "17px" }}>
              <strong>{s.name}</strong> <span className="cs-tnum">{s.oklch}</span>
            </p>
            <p className="cs-read cs-muted" style={{ margin: 0, fontSize: 12, lineHeight: "16px" }}>
              {s.role}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ColorPhone() {
  return (
    <SlideRoot screen="375">
      <div className="absolute" style={{ left: 16, right: 16, top: HEAD["375"] + 24 }}>
        <Display size={36} style={{ lineHeight: 1 }}>
          No colour of our own.
        </Display>
        <Copy size={15} lead={22} style={{ marginTop: 12 }}>
          Warm paper and deep ink, so a photograph is always the brightest colour on a screen. Colour comes from the photographs, and the people in them.
        </Copy>
        <Kicker style={{ fontSize: 11, marginTop: 26 }}>Status, beside the edge</Kicker>
        <div style={{ marginTop: 14 }}>
          <InSitu w={96} gap={27} room={false} />
        </div>
        <div className="cs-on-room" style={{ marginTop: 18, background: GROUND.room.hex, padding: "16px 0", marginInline: -16 }}>
          <div style={{ paddingInline: 16 }}>
            <InSitu w={96} gap={27} room />
          </div>
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 26 }}>Why waiting is no longer amber</Kicker>
        <div style={{ marginTop: 12 }}>
          <NotAmber size={13} />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 26 }}>Where colour comes from</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: 14, marginTop: 12, alignItems: "start" }}>
          <Print photo="party-balloons" w={150} border={8} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 34px)", gap: 8 }}>
            {GUESTS.map((g) => (
              <Seeded key={g.seed} seed={g.seed} style={{ width: 34, height: 34 }} />
            ))}
          </div>
        </div>
        <Copy size={13} lead={19} style={{ marginTop: 10 }}>
          <strong style={{ color: GROUND.ink.hex }}>Photographs</strong>, and{" "}
          <strong style={{ color: GROUND.ink.hex }}>people</strong>: each guest&rsquo;s seeded light, on their avatar and on a print not yet developed.
        </Copy>
        <Kicker style={{ fontSize: 11, marginTop: 26 }}>The base, with no hue</Kicker>
        <div style={{ marginTop: 12 }}>
          <SwatchList />
        </div>
      </div>
      <SlideFoot screen="375" />
    </SlideRoot>
  );
}
