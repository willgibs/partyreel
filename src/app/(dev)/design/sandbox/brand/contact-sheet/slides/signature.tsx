"use client";

import type { CSSProperties } from "react";

import { Photo } from "../../deck/media";
import { HEAD } from "../../deck/deck";
import { Copy, Display, Kicker, type Screen, SlideFoot, SlideRoot } from "../parts";
import {
  Edge,
  eventEdge,
  GROUND,
  Mark,
  PARTY_EDGE,
  Print,
  STATUS,
  Strip,
  type StripFrame,
  who,
} from "../system";

/**
 * 05 THE SIGNATURE: the edge and the border, drawn on photographs. The edge
 * is the film's own type along the album (every event prints its own); the
 * border is the paper round a photograph alone. Both frame the media and
 * neither ever touches it. Four forms, where they live, where they never go.
 */

const FORMS: readonly { n: string; title: string; line: string }[] = [
  { n: "1", title: "The edge line.", line: "Ink on paper: under a print, along an album's head." },
  { n: "2", title: "The border.", line: "A photograph alone sits as a print, its edge in the border." },
  { n: "3", title: "The rebate.", line: "The edge knocked out of the film's ink: a strip, a hero's foot, the footer." },
  { n: "4", title: "The frame edge.", line: "Every frame's number, and who shot it." },
];

const STRIP: readonly StripFrame[] = [
  { photo: "wedding-toast", n: "31", who: who(1) },
  { photo: "reception-hall", n: "32", who: who(2) },
  { photo: "party-dj", n: "33", who: who(3) },
  { photo: "wedding-rings", n: "34", who: who(4) },
  { photo: "festival-crowd", n: "35", who: who(6) },
];

/** A numbered tag on the demo, in the edge's own voice. */
function Tag({ n, style }: { n: string; style?: CSSProperties }) {
  return (
    <span
      className="cs-edge"
      style={{
        position: "absolute",
        width: 20,
        height: 20,
        justifyContent: "center",
        fontSize: 11,
        letterSpacing: 0,
        background: GROUND.ink.hex,
        color: GROUND.paper.hex,
        borderRadius: 2,
        ...style,
      }}
      aria-hidden
    >
      {n}
    </span>
  );
}

function Forms({ size = 14 }: { size?: number }) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      {FORMS.map((f) => (
        <div key={f.n} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <span style={{ position: "relative", width: 20, height: 20, flex: "none", marginTop: 1 }}>
            <Tag n={f.n} style={{ left: 0, top: 0 }} />
          </span>
          <Copy size={size} lead={Math.round(size * 1.42)}>
            <strong style={{ color: GROUND.ink.hex }}>{f.title}</strong>{" "}
            {f.line}
          </Copy>
        </div>
      ))}
    </div>
  );
}

/** The do and the don't, side by side, each a photograph. */
function DoDont({ w }: { w: number }) {
  const ih = Math.round(w / 1.5);
  return (
    <div style={{ display: "flex", gap: 20 }}>
      <div style={{ width: w }}>
        <Print photo="wedding-arch" w={w} border={Math.round(w * 0.05)} edge={PARTY_EDGE.slice(1)} edgeSize={9} />
        <Copy size={13} lead={18} style={{ marginTop: 10 }}>
          <strong style={{ color: STATUS.done.paper.hex }}>Do.</strong>{" "}
          Under the photograph, in its border.
        </Copy>
      </div>
      <div style={{ width: w }}>
        <div style={{ position: "relative", width: w, height: ih + Math.round(w * 0.1) }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: Math.round(w * 0.05),
              width: w,
              height: ih,
              overflow: "hidden",
              borderRadius: 2,
            }}
          >
            <Photo id="wedding-arch" />
            <Edge
              items={PARTY_EDGE}
              size={10}
              style={{ position: "absolute", left: 10, right: 10, top: Math.round(ih * 0.45), color: "#fff" }}
            />
          </div>
          <Mark
            kind="cross"
            size={Math.round(w * 0.5)}
            color={STATUS.failed.paper.hex}
            weight={3.2}
            draw
            delay={900}
            style={{ position: "absolute", left: w * 0.25, top: Math.round(w * 0.05) + (ih - w * 0.5) / 2 }}
          />
        </div>
        <Copy size={13} lead={18} style={{ marginTop: 10 }}>
          <strong style={{ color: STATUS.failed.paper.hex }}>Never.</strong>{" "}
          On the photograph, or stacked into a wall.
        </Copy>
      </div>
    </div>
  );
}

const LIVES =
  "The album's head, the code card, a hero's foot, the footer, and under any print that stands alone.";
const NEVER =
  "Over a photograph. As a heading or a sentence. Inside a button. Alone, belonging to nothing, or stacked into a block, which is how an edge turns into a terminal.";
const AURORA =
  "The aurora steps back to the projector: light spilled from a photograph on the reel's wall, in the room, never on paper.";

export function SignatureSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <SignatureDesk /> : <SignaturePhone />;
}

function SignatureDesk() {
  return (
    <SlideRoot screen="1440">
      <div className="absolute" style={{ left: 64, top: HEAD["1440"] + 42, width: 790 }}>
        <Display size={50} style={{ lineHeight: 1 }}>
          Every event prints its own edge.
        </Display>
        <Copy size={16} lead={24} style={{ marginTop: 16, maxWidth: 720 }}>
          The edge is the film&rsquo;s own type along the album: the event&rsquo;s frame mark, its name, its date, every frame and who shot it. The border is the paper round a photograph alone. Both frame the media; neither ever touches it.
        </Copy>
      </div>
      <div className="absolute" style={{ left: 64, top: 262 }}>
        <Print
          photo="wedding-golden"
          w={600}
          border={24}
          edge={eventEdge(undefined, ["31 guests", "1284 frames"])}
          edgeSize={11}
          develop={{ delay: 300, duration: 2600 }}
          read="the edge under a print"
        />
        <Tag n="2" style={{ left: 610, top: 4 }} />
        <Tag n="1" style={{ left: 610, top: 386 }} />
      </div>
      <div className="absolute" style={{ left: 64, top: 702 }}>
        <Strip frames={STRIP} frameW={140} gap={6} edgeSize={10} top={PARTY_EDGE} />
        <Tag n="3" style={{ left: 776, top: 4 }} />
        <Tag n="4" style={{ left: 776, top: 118 }} />
      </div>
      <div className="absolute" style={{ left: 880, top: HEAD["1440"] + 46, width: 496 }}>
        <Kicker>Its forms</Kicker>
        <div style={{ marginTop: 16 }}>
          <Forms size={14} />
        </div>
        <Kicker style={{ marginTop: 26 }}>Where it lives</Kicker>
        <Copy size={14} lead={20} style={{ marginTop: 10 }}>
          {LIVES}
        </Copy>
        <Kicker style={{ marginTop: 20 }}>Where it never goes</Kicker>
        <Copy size={14} lead={20} style={{ marginTop: 10 }}>
          {NEVER}
        </Copy>
        <div style={{ marginTop: 22 }}>
          <DoDont w={232} />
        </div>
        <Copy size={13} lead={19} style={{ marginTop: 16 }}>
          {AURORA}
        </Copy>
      </div>
      <SlideFoot screen="1440" />
    </SlideRoot>
  );
}

function SignaturePhone() {
  return (
    <SlideRoot screen="375">
      <div className="absolute" style={{ left: 16, right: 16, top: HEAD["375"] + 24 }}>
        <Display size={34} style={{ lineHeight: 1 }}>
          Every event prints its own edge.
        </Display>
        <Copy size={15} lead={22} style={{ marginTop: 12 }}>
          The film&rsquo;s own type along the album: the event&rsquo;s mark, name, date, every frame and who shot it. The border is the paper round a photograph alone. Neither ever touches the media.
        </Copy>
        <div style={{ position: "relative", marginTop: 22 }}>
          <Print
            photo="wedding-golden"
            w={343}
            border={14}
            edge={eventEdge(undefined, ["31 guests"])}
            edgeSize={10}
            develop={{ delay: 300, duration: 2600 }}
            read="the edge under a print"
          />
        </div>
        <div style={{ position: "relative", marginTop: 18, marginRight: -16, overflow: "hidden" }}>
          <Strip frames={STRIP.slice(0, 3)} frameW={110} gap={5} pad={8} edgeSize={9} top={PARTY_EDGE} />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 26 }}>Its forms</Kicker>
        <div style={{ marginTop: 12 }}>
          <Forms size={14} />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 24 }}>Where it lives</Kicker>
        <Copy size={14} lead={20} style={{ marginTop: 8 }}>
          {LIVES}
        </Copy>
        <Kicker style={{ fontSize: 11, marginTop: 20 }}>Where it never goes</Kicker>
        <Copy size={14} lead={20} style={{ marginTop: 8 }}>
          {NEVER}
        </Copy>
        <div style={{ marginTop: 20 }}>
          <DoDont w={161} />
        </div>
        <Copy size={14} lead={20} style={{ marginTop: 16 }}>
          {AURORA}
        </Copy>
      </div>
      <SlideFoot screen="375" />
    </SlideRoot>
  );
}
