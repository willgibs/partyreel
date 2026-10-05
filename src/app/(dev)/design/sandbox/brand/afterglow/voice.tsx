"use client";

import type { SlideProps } from "../deck/contract";
import { HEAD } from "../deck/deck";
import type { PhotoId } from "../deck/media";
import { ink, SlideRoot } from "./root";
import {
  Bloom,
  GROUND,
  lightOfEdge,
  lightOfPhoto,
  LitPhoto,
  Readout,
  Seam,
  StatusLight,
  VOICE,
} from "./system";

/**
 * 07 TYPE, IMAGERY, MOTION. Urbanist and Inter, kept and tuned, set in the
 * voice's own lines; four photography principles on the stills; the clocks: the
 * light slow, the interface instant, everything lit and still at rest.
 */

const IMAGERY: readonly { id: PhotoId; focus?: string; line: string }[] = [
  {
    id: "wedding-toast",
    line: "Real light in the frame: string lights, a stage, the sun.",
  },
  {
    id: "wedding-arch",
    focus: "50% 40%",
    line: "Any hour: a garden at noon is as much Partyreel as a floor at 2 am.",
  },
  {
    id: "party-dj",
    line: "Mid-moment and shot by guests, never posed for us.",
  },
  {
    id: "reception-table",
    line: "Never under a tint: the light goes round a photograph, never on it.",
  },
];

function Faces({ desk }: { desk: boolean }) {
  const t = ink("paper");
  const face = (name: string, family: string, weight: number, role: string) => (
    <div className="flex-1">
      <p
        style={{
          fontFamily: family,
          fontWeight: weight,
          fontSize: desk ? 96 : 72,
          lineHeight: 1,
          letterSpacing: weight > 600 ? "-0.04em" : "-0.02em",
        }}
      >
        Aa
      </p>
      <p
        className="ag-body"
        style={{ fontSize: 14, fontWeight: 600, marginTop: 10 }}
      >
        {name}
      </p>
      <p className="ag-caption" style={{ color: t.muted, marginTop: 2 }}>
        {role}
      </p>
    </div>
  );
  return (
    <div>
      <Readout style={{ color: t.faint }}>Type, kept and tuned</Readout>
      <div className="flex" style={{ gap: 28, marginTop: 14 }}>
        {face(
          "Urbanist 700",
          "var(--font-display)",
          700,
          "To be loud. Tighter as it grows: −4.5% at display, −3% at titles.",
        )}
        {face(
          "Inter 400, 500, 600",
          "var(--font-sans)",
          400,
          "To read, and in spaced capitals, what a camera prints.",
        )}
      </div>
      <p className="ag-caption" style={{ color: t.muted, marginTop: 18 }}>
        <span style={{ color: t.fg, fontWeight: 600 }}>
          One italic in the whole brand:
        </span>{" "}
        the wordmark&apos;s.
      </p>
    </div>
  );
}

/** The ladder, set in the voice's own lines at their real sizes. */
function Ladder({ desk }: { desk: boolean }) {
  const t = ink("paper");
  const rows: [string, string, React.ReactNode][] = [
    [
      "Display",
      desk ? "Urbanist 700 · 60 / 0.95 · −4.5%" : "Urbanist 700 · 40",
      <p
        key="d"
        className="ag-display"
        style={{ fontSize: desk ? 60 : 40, lineHeight: 0.98 }}
      >
        {VOICE.thesis}
      </p>,
    ],
    [
      "Title",
      desk ? "Urbanist 700 · 34 / 1.05 · −3%" : "Urbanist 700 · 26",
      <p key="t" className="ag-title" style={{ fontSize: desk ? 34 : 26 }}>
        {VOICE.hostEmpty}
      </p>,
    ],
    [
      "Lede",
      desk ? "Inter 400 · 18 / 1.45" : "Inter 400 · 16",
      <p
        key="l"
        className="ag-lede"
        style={{ fontSize: desk ? 18 : 16, color: t.muted, maxWidth: 820 }}
      >
        {VOICE.subhead}
      </p>,
    ],
    [
      "Readout",
      "Inter 600 · 11 · +10% · capitals",
      <div key="r" className="flex flex-wrap items-center" style={{ gap: 18 }}>
        <StatusLight state="standby" ground="paper">
          3 waiting
        </StatusLight>
        <StatusLight state="ready" ground="paper">
          12 approved
        </StatusLight>
        <Readout style={{ color: t.fg }}>1,284 photos</Readout>
      </div>,
    ],
  ];
  return (
    <div>
      <Readout style={{ color: t.faint }}>The ladder, in real lines</Readout>
      <div className="flex flex-col" style={{ marginTop: 10 }}>
        {rows.map(([name, spec, line], i) => (
          <div
            key={name}
            className={desk ? "grid items-baseline" : "flex flex-col"}
            style={{
              gridTemplateColumns: desk ? "220px 1fr" : undefined,
              gap: desk ? 24 : 6,
              padding: desk ? "11px 0" : "12px 0",
              borderTop: i ? "1px solid rgb(20 20 22 / 0.09)" : undefined,
            }}
          >
            <div>
              <p
                className="ag-body"
                style={{ fontSize: 13.5, fontWeight: 600 }}
              >
                {name}
              </p>
              <p className="ag-caption ag-num" style={{ color: t.faint }}>
                {spec}
              </p>
            </div>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageryColumn({ w }: { w: number }) {
  const t = ink("paper");
  const tw = Math.floor((w - 16) / 2);
  return (
    <div style={{ width: w }}>
      <Readout style={{ color: t.faint }}>Imagery</Readout>
      <div
        className="grid grid-cols-2"
        style={{ columnGap: 16, rowGap: 18, marginTop: 18 }}
      >
        {IMAGERY.map((m) => (
          <div key={m.id}>
            <LitPhoto
              id={m.id}
              focus={m.focus}
              ground="paper"
              style={{ width: tw, height: Math.round(tw * 0.68) }}
            />
            <p className="ag-caption" style={{ color: t.muted, marginTop: 8 }}>
              {m.line}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MotionColumn({ w }: { w: number }) {
  const t = ink("paper");
  const row = (n: string, line: string, art: React.ReactNode) => (
    <div className="flex items-center" style={{ gap: 16 }}>
      <div
        className="relative flex shrink-0 items-center justify-center"
        style={{ width: 88, height: 52 }}
      >
        {art}
      </div>
      <div>
        <p className="ag-body" style={{ fontSize: 14, fontWeight: 600 }}>
          {n}
        </p>
        <p className="ag-caption" style={{ color: t.muted }}>
          {line}
        </p>
      </div>
    </div>
  );
  return (
    <div style={{ width: w }}>
      <Readout style={{ color: t.faint }}>Motion</Readout>
      <div className="flex flex-col" style={{ gap: 20, marginTop: 20 }}>
        {row(
          "Light: when something happens",
          "Still at rest. A photograph landing swells its edge once; the Ring fills as files send.",
          <div
            className="relative overflow-hidden"
            style={{ width: 88, height: 52 }}
          >
            <div
              className="absolute inset-x-0 top-0"
              style={{
                height: 14,
                background: GROUND.paperCard.hex,
                boxShadow: "0 1px 0 rgb(0 0 0 / 0.04)",
              }}
            />
            <div className="absolute inset-x-0" style={{ top: 14, height: 38 }}>
              <Seam
                light={lightOfEdge("party-balloons", "left")}
                ground="paper"
                reach={30}
              />
            </div>
          </div>,
        )}
        {row(
          "Bloom: 1.4 s, once",
          "It ignites and rests lit. It never pulses.",
          <div style={{ width: 54, height: 38 }}>
            <Bloom
              light={lightOfPhoto("party-balloons")}
              ground="paper"
              blur={9}
              style={{ height: "100%" }}
            >
              <LitPhoto
                id="party-balloons"
                ground="paper"
                className="size-full"
              />
            </Bloom>
          </div>,
        )}
        {row(
          "Standby: 2.4 s",
          "The one state that breathes: it is not done.",
          <StatusLight state="standby" ground="paper" size={10} />,
        )}
        {row(
          "Interface: instant",
          "Under 200 ms, faster out than in.",
          <span
            className="ag-body"
            style={{
              background: "#141416",
              color: "#f5f5f6",
              fontSize: 12,
              fontWeight: 600,
              padding: "7px 14px",
              borderRadius: 16,
            }}
          >
            Start free
          </span>,
        )}
        {row(
          "Reduced motion",
          "Lit and still. Nothing is lost.",
          <span className="ag-readout" style={{ color: t.faint }}>
            At rest
          </span>,
        )}
      </div>
    </div>
  );
}

export function VoiceSlide({ screen }: SlideProps) {
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="paper">
        <div
          className="absolute inset-x-0 px-6"
          style={{ top: HEAD[screen] + 26 }}
        >
          <Faces desk={false} />
          <div className="mt-10">
            <Ladder desk={false} />
          </div>
          <div className="mt-10">
            <ImageryColumn w={327} />
          </div>
          <div className="mt-10">
            <MotionColumn w={327} />
          </div>
        </div>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="paper">
      <div className="absolute" style={{ left: 64, top: 96, width: 430 }}>
        <Faces desk />
      </div>
      <div className="absolute" style={{ left: 556, top: 96 }}>
        <ImageryColumn w={400} />
      </div>
      <div className="absolute" style={{ left: 1030, top: 96 }}>
        <MotionColumn w={346} />
      </div>
      <div className="absolute" style={{ left: 64, right: 64, top: 528 }}>
        <Ladder desk />
      </div>
    </SlideRoot>
  );
}
