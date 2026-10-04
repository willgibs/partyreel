"use client";

import type { SlideProps } from "../deck/contract";
import { HEAD } from "../deck/deck";
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
 * 02 THE IDEA: the positioning, the personality, and what the vision keeps
 * and argues of what Partyreel already has. A reading slide, so it is paper,
 * as the vision's own page rule says; and the one photograph on it wears its
 * light in the paper register, which is the argument against today's fence.
 */

const POSITIONING = {
  claim: ["Light is the brand.", "The photographs make it."],
  body: "For hosts and their guests, at any event and any hour: one album that holds everyone's photographs and glows with their light. Only Partyreel's colour is sampled from the photographs themselves, so every album wears its own event, and no two glow alike.",
};

const TRAITS = [
  ["Luminous", "It glows and never shouts: light, never paint."],
  ["Generous", "The photographs take the brightest place on every screen."],
  [
    "Alive",
    "Photos land, light ignites, the album fills while the party goes on.",
  ],
  ["Exact", "A camera's instruments: small hard lights and true words."],
] as const;

const LEDGER = [
  [
    "Waiting",
    "Changed",
    "It loses its amber: a half-lit standby point with no hue.",
  ],
  [
    "The hashvatar",
    "Promoted",
    "The event's light before its first photograph.",
  ],
  [
    "The shutter",
    "Changed",
    "Its face goes dark, so the photographs stay brightest.",
  ],
  [
    "Light on paper",
    "Argued",
    "A paper register of its own, where today it is switched off.",
  ],
] as const;

/** The idea in one picture: the order of brightness on every screen. */
function Order({ desk }: { desk: boolean }) {
  const t = ink("paper");
  const box = { width: desk ? 112 : 92, height: desk ? 72 : 60 };
  const steps = [
    {
      name: "The photographs",
      line: "The brightest thing on any screen.",
      art: <LitPhoto id="wedding-toast" ground="paper" style={box} />,
    },
    {
      name: "Their light",
      line: "What they give off, at an edge.",
      art: (
        <div className="flex items-center justify-center" style={box}>
          <LightChips
            light={SAMPLED["party-balloons"]}
            register="paper"
            height={desk ? 10 : 8}
            className="w-full"
          />
        </div>
      ),
    },
    {
      name: "Everything else",
      line: "A quiet ground of ink and paper.",
      art: (
        <div
          className="flex flex-col justify-center"
          style={{ ...box, gap: 6 }}
        >
          {[92, 70, 82].map((w) => (
            <span
              key={w}
              style={{
                width: `${w}%`,
                height: 4,
                borderRadius: 2,
                background: "rgb(20 20 22 / 0.16)",
              }}
            />
          ))}
        </div>
      ),
    },
  ];
  return (
    <div>
      <Readout style={{ color: t.faint }}>The order of brightness</Readout>
      <div
        className="flex items-start"
        style={{ gap: desk ? 18 : 10, marginTop: 14 }}
      >
        {steps.map((s, i) => (
          <div
            key={s.name}
            className="flex items-start"
            style={{ gap: desk ? 18 : 10 }}
          >
            <div style={{ width: desk ? 150 : 92 }}>
              {s.art}
              <p
                className="ag-body"
                style={{
                  fontSize: desk ? 14 : 12.5,
                  fontWeight: 600,
                  marginTop: 10,
                }}
              >
                {s.name}
              </p>
              <p
                className="ag-caption"
                style={{ color: t.muted, marginTop: 2 }}
              >
                {s.line}
              </p>
            </div>
            {i < steps.length - 1 ? (
              <span
                className="ag-subtitle"
                style={{
                  color: t.faint,
                  fontSize: desk ? 22 : 18,
                  marginTop: desk ? 22 : 18,
                }}
              >
                ›
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export function Idea({ screen }: SlideProps) {
  const t = ink("paper");
  const desk = screen === "1440";
  const traits = (
    <div
      className="grid"
      style={{
        gridTemplateColumns: "1fr 1fr",
        columnGap: desk ? 40 : 18,
        rowGap: desk ? 26 : 16,
      }}
    >
      {TRAITS.map(([name, line]) => (
        <div key={name}>
          <p className="ag-subtitle" style={{ fontSize: desk ? 24 : 19 }}>
            {name}
          </p>
          <p
            className="ag-body"
            style={{ color: t.muted, marginTop: 4, fontSize: desk ? 14 : 12.5 }}
          >
            {line}
          </p>
        </div>
      ))}
    </div>
  );
  const ledger = (
    <div className="flex flex-col">
      {LEDGER.map(([name, verdict, line], i) => (
        <div
          key={name}
          className="grid items-baseline"
          style={{
            gridTemplateColumns: desk ? "200px 118px 1fr" : "1fr auto",
            columnGap: 14,
            rowGap: 2,
            padding: desk ? "9px 0" : "10px 0",
            borderTop: i ? `1px solid rgb(20 20 22 / 0.09)` : undefined,
          }}
        >
          <span className="ag-body" style={{ fontSize: 14, fontWeight: 500 }}>
            {name}
          </span>
          <Readout style={{ color: verdict === "Argued" ? t.fg : t.faint }}>
            {verdict}
          </Readout>
          <span
            className="ag-body"
            style={{
              color: t.muted,
              fontSize: 13.5,
              gridColumn: desk ? undefined : "1 / -1",
            }}
          >
            {line}
          </span>
        </div>
      ))}
    </div>
  );
  const proof = (w: number, h: number) => (
    <div style={{ width: w, height: h }}>
      <Bloom
        light={lightOfPhoto("reception-table")}
        ground="paper"
        style={{ height: "100%" }}
      >
        <LitPhoto id="reception-table" ground="paper" className="size-full" />
      </Bloom>
    </div>
  );

  if (!desk)
    return (
      <SlideRoot screen={screen} ground="paper">
        <div
          className="absolute inset-x-0 px-6"
          style={{ top: HEAD[screen] + 28 }}
        >
          <Readout style={{ color: t.faint }}>Positioning</Readout>
          <h2 className="ag-title mt-3" style={{ fontSize: 34 }}>
            {POSITIONING.claim.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </h2>
          <p className="ag-body mt-4" style={{ color: t.muted, fontSize: 15 }}>
            {POSITIONING.body}
          </p>
          <div className="mt-10 flex justify-center">{proof(250, 166)}</div>
          <p className="ag-caption mt-5 text-center" style={{ color: t.faint }}>
            On paper too: the light is the photograph&apos;s.
          </p>
          <div className="mt-10">
            <Order desk={false} />
          </div>
          <Readout className="mt-11 block" style={{ color: t.faint }}>
            Personality
          </Readout>
          <div className="mt-4">{traits}</div>
          <Readout className="mt-11 block" style={{ color: t.faint }}>
            What it changes from today
          </Readout>
          <div className="mt-2">{ledger}</div>
        </div>
      </SlideRoot>
    );

  return (
    <SlideRoot screen={screen} ground="paper">
      <div className="absolute" style={{ left: 96, top: 112, width: 600 }}>
        <Readout style={{ color: t.faint }}>Positioning</Readout>
        <h2 className="ag-title" style={{ fontSize: 54, marginTop: 18 }}>
          {POSITIONING.claim.map((l) => (
            <span key={l} className="block">
              {l}
            </span>
          ))}
        </h2>
        <p
          className="ag-lede"
          data-bd-contrast="muted body on paper"
          style={{ color: t.muted, fontSize: 17.5, marginTop: 22 }}
        >
          {POSITIONING.body}
        </p>
        <Readout className="block" style={{ color: t.faint, marginTop: 52 }}>
          Personality
        </Readout>
        <div style={{ marginTop: 18 }}>{traits}</div>
        <div style={{ marginTop: 40 }}>
          <Order desk />
        </div>
      </div>
      <div className="absolute" style={{ left: 800, top: 112, width: 544 }}>
        <div className="flex items-end gap-6">
          {proof(268, 179)}
          <p
            className="ag-caption"
            style={{ color: t.faint, maxWidth: 200, paddingBottom: 2 }}
          >
            On paper too: the light is the photograph&apos;s, born thin and
            bright at its edges.
          </p>
        </div>
        <Readout className="block" style={{ color: t.faint, marginTop: 50 }}>
          What it changes from today
        </Readout>
        <div style={{ marginTop: 8 }}>{ledger}</div>
        <div className="flex" style={{ gap: 24, marginTop: 34 }}>
          <TodayAndNow />
        </div>
      </div>
    </SlideRoot>
  );
}

/**
 * TODAY AND NOW, side by side (the creative director's pass): today's light is
 * a haze of the house five that comes from no photograph; Afterglow's is the
 * light of the photograph it surrounds.
 */
function TodayAndNow() {
  const t = ink("paper");
  const box = { width: 260, height: 112, borderRadius: 6 } as const;
  return (
    <>
      <div>
        <div
          className="relative overflow-hidden"
          style={{ ...box, background: "#0a0a0b" }}
        >
          <div
            aria-hidden
            className="absolute"
            style={{
              inset: "-30%",
              background:
                "radial-gradient(40% 50% at 35% 55%, oklch(0.72 0.17 25 / 0.55), transparent), radial-gradient(35% 45% at 60% 45%, oklch(0.7 0.14 255 / 0.5), transparent), radial-gradient(30% 40% at 50% 70%, oklch(0.68 0.16 305 / 0.45), transparent)",
              filter: "blur(18px)",
            }}
          />
          <div
            className="absolute rounded"
            style={{
              left: 86,
              top: 32,
              width: 88,
              height: 48,
              background: "#f4f4f5",
            }}
          />
        </div>
        <p className="ag-caption" style={{ color: t.muted, marginTop: 8 }}>
          Today: a haze from no photograph.
        </p>
      </div>
      <div>
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ ...box, background: "#0a0a0b" }}
        >
          <div style={{ width: 132, height: 78 }}>
            <Bloom
              light={lightOfPhoto("wedding-toast")}
              ground="room"
              blur={14}
              style={{ height: "100%" }}
            >
              <LitPhoto
                id="wedding-toast"
                ground="room"
                className="size-full"
              />
            </Bloom>
          </div>
        </div>
        <p className="ag-caption" style={{ color: t.muted, marginTop: 8 }}>
          Afterglow: the light of the photograph it surrounds.
        </p>
      </div>
    </>
  );
}
