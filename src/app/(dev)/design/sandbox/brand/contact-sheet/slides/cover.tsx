"use client";

import type { PhotoId } from "../../deck/media";
import { HEAD } from "../../deck/deck";
import { Wordmark } from "../marks";
import { Display, Kicker, type Screen, SlideRoot } from "../parts";
import { Edge, PARTY_EDGE, Print, Strip, type StripFrame, who } from "../system";

/**
 * 01 COVER: the key visual is the party's contact sheet, everyone's frames
 * side by side in the film's ink with the event's edge along each strip and
 * every frame credited to whoever shot it, and the keeper pulled from it as a
 * print. Everything develops as it lands.
 */

type Plan = readonly [PhotoId, string | undefined][];

/** Twenty frames off the twelve stills; a repeat is a burst, cropped anew. */
const ROLLS: readonly Plan[] = [
  [
    ["wedding-arch", "50% 35%"],
    ["wedding-toast", undefined],
    ["party-balloons", undefined],
    ["reception-table", undefined],
    ["wedding-rings", undefined],
  ],
  [
    ["concert-confetti", undefined],
    ["party-dj", undefined],
    ["festival-crowd", undefined],
    ["festival-lights", undefined],
    ["reception-hall", undefined],
  ],
  [
    ["wedding-golden", "30% 50%"],
    ["wedding-golden", "70% 40%"],
    ["party-balloons", "80% 30%"],
    ["wedding-toast", "20% 60%"],
    ["concert-confetti", "70% 50%"],
  ],
  [
    ["party-dj", "30% 50%"],
    ["wedding-arch", "50% 70%"],
    ["festival-lights", "60% 40%"],
    ["reception-table", "80% 50%"],
    ["festival-crowd", "40% 50%"],
  ],
];

function framesOf(r: number, first: number): StripFrame[] {
  return ROLLS[r].map(([photo, focus], i) => ({
    photo,
    focus,
    n: String(first + r * 5 + i),
    who: who(r * 3 + i),
  }));
}

export function CoverSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <CoverDesk /> : <CoverPhone />;
}

function CoverDesk() {
  const strips = [
    { x: 646, y: 82 },
    { x: 672, y: 279 },
    { x: 632, y: 476 },
    { x: 658, y: 673 },
  ];
  return (
    <SlideRoot screen="1440">
      {strips.map((s, r) => (
        <Strip
          key={r}
          frames={framesOf(r, 9)}
          frameW={200}
          gap={7}
          edgeSize={10}
          top={PARTY_EDGE}
          develop={{ delay: 250 + r * 380, duration: 1700 }}
          style={{ position: "absolute", left: s.x, top: s.y }}
        />
      ))}
      <Print
        photo="wedding-petals"
        w={286}
        ratio={2 / 3}
        border={16}
        tilt={-3}
        edge={["24", { text: "Lena", seed: who(5).seed }, "The keeper"]}
        edgeSize={10}
        develop={{ delay: 1500, duration: 2600 }}
        style={{ position: "absolute", left: 546, top: 412 }}
        read="the keeper print"
      />
      <div className="absolute" style={{ left: 64, top: HEAD["1440"] + 50, width: 480 }}>
        <Kicker>A brand for Partyreel</Kicker>
        <Display as="h1" size={124} style={{ marginTop: 28, lineHeight: 0.86 }}>
          <span data-bd-read="territory">
            Contact
            <br />
            Sheet
          </span>
        </Display>
        <p
          className="cs-read cs-muted"
          style={{ fontSize: 27, lineHeight: "35px", marginTop: 34, maxWidth: 440 }}
          data-bd-read="line"
        >
          Everyone&rsquo;s roll, developed together.
        </p>
      </div>
      <div className="absolute" style={{ left: 64, bottom: 64 }}>
        <Wordmark height={70} read="wordmark" />
        <Edge items={PARTY_EDGE} size={12} style={{ marginTop: 18 }} className="cs-muted" />
      </div>
    </SlideRoot>
  );
}

function CoverPhone() {
  const strips = [
    { x: 118, y: 286 },
    { x: 136, y: 424 },
    { x: 104, y: 562 },
  ];
  return (
    <SlideRoot screen="375">
      {strips.map((s, r) => (
        <Strip
          key={r}
          frames={framesOf(r, 9).slice(0, 3)}
          frameW={124}
          gap={5}
          pad={8}
          edgeSize={9}
          top={PARTY_EDGE}
          develop={{ delay: 250 + r * 380, duration: 1700 }}
          style={{ position: "absolute", left: s.x, top: s.y }}
        />
      ))}
      <Print
        photo="wedding-petals"
        w={164}
        ratio={2 / 3}
        border={10}
        tilt={-3}
        edge={["24", { text: "Lena", seed: who(5).seed }]}
        edgeSize={9}
        develop={{ delay: 1400, duration: 2600 }}
        style={{ position: "absolute", left: 18, top: 396 }}
        read="the keeper print"
      />
      <div className="absolute" style={{ left: 16, right: 16, top: HEAD["375"] + 22 }}>
        <Kicker style={{ fontSize: 11 }}>A brand for Partyreel</Kicker>
        <Display as="h1" size={62} style={{ marginTop: 14, lineHeight: 0.86 }}>
          <span data-bd-read="territory">
            Contact
            <br />
            Sheet
          </span>
        </Display>
        <p
          className="cs-read cs-muted"
          style={{ fontSize: 17, lineHeight: "24px", marginTop: 14 }}
          data-bd-read="line"
        >
          Everyone&rsquo;s roll, developed together.
        </p>
      </div>
      <div className="absolute" style={{ left: 16, right: 16, bottom: 26 }}>
        <Wordmark height={44} read="wordmark" />
        <Edge items={PARTY_EDGE} size={11} style={{ marginTop: 12 }} className="cs-muted" />
      </div>
    </SlideRoot>
  );
}
