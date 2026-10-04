"use client";

import type { SlideProps } from "../../deck/contract";
import { CROWD, GuestRow, ON } from "../system";
import { isDesk, Kicker, SlideGround } from "./kit";

/**
 * 02 THE IDEA. One sentence the whole system hangs on, who it is for and why
 * only Partyreel can say it, five traits, and the ledger against today: what
 * the vision keeps and what it argues. The guest row is the slide's rule.
 */

export const POSITIONING = [
  {
    k: "For",
    v: "The host who wants the whole event, and the 18 to 50 people who shot it.",
  },
  {
    k: "Promise",
    v: "Everyone's photos in one album, and everyone in its color.",
  },
  {
    k: "Only Partyreel",
    v: "An album made by its guests can wear them. No two events share a mix.",
  },
] as const;

export const TRAITS = [
  { t: "Generous", l: "Everyone gets a color, a credit and a place in the row." },
  { t: "Social", l: "A crowd, never a catalogue: people fill every screen photos have not." },
  { t: "Bright", l: "Daylight grounds, big friendly type, joy as the default." },
  { t: "Cheeky", l: "A wink where it costs nothing: a full stop that is a person." },
  { t: "Grown-up", l: "Grey chrome, one color source, and it never talks over a photograph." },
] as const;

export const KEEPS = [
  "Achromatic chrome: viewfinder's greys, ink and paper",
  "The light edge on media and framed screens",
  "The display: every pop-out is the camera's screen",
  "The hashvatar, unchanged, promoted to the brand's material",
  "Inter to read, photographs at the 2 px corner",
] as const;

export const ARGUES = [
  "Status leaves light: a lit dot is a person now, so a state is a flat tag",
  "The five lamps become the house mix: five house guests, still never UI paint",
  "The aurora steps back as the signature: people bring the color",
  "Bricolage Grotesque replaces Urbanist for loud type: warmer, and it says what we are",
] as const;

function Ledger({
  title,
  items,
  desk,
}: {
  title: string;
  items: readonly string[];
  desk: boolean;
}) {
  return (
    <div>
      <Kicker tone="paper">{title}</Kicker>
      <ul className="ev-body" style={{ marginTop: 10, fontSize: desk ? 15 : 14 }}>
        {items.map((it) => (
          <li
            key={it}
            style={{
              padding: "7px 0",
              borderTop: `1px solid ${ON.paper.line}`,
              color: ON.paper.ink,
            }}
          >
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Idea({ screen }: SlideProps) {
  const desk = isDesk(screen);
  if (!desk) return <IdeaPhone screen={screen} />;
  return (
    <SlideGround tone="paper" screen={screen}>
      <div className="absolute" style={{ left: 72, top: 96, width: 760 }}>
        <Kicker tone="paper">The idea</Kicker>
        <h2 className="ev-display" style={{ fontSize: 76, marginTop: 18, lineHeight: 0.94 }}>
          An event&apos;s color is the people in it.
        </h2>
      </div>
      <dl className="absolute ev-body" style={{ left: 900, top: 120, width: 468, fontSize: 16 }}>
        {POSITIONING.map((p) => (
          <div key={p.k} style={{ marginBottom: 18 }}>
            <dt className="ev-label" style={{ color: ON.paper.muted }}>
              {p.k}
            </dt>
            <dd style={{ marginTop: 5, color: ON.paper.ink }}>{p.v}</dd>
          </div>
        ))}
      </dl>
      <div className="absolute" style={{ left: 72, top: 372 }}>
        <GuestRow people={CROWD} max={31} size={30} initials={false} />
      </div>
      <div
        className="absolute grid"
        style={{ left: 72, top: 436, width: 1296, gridTemplateColumns: "repeat(5, 1fr)", gap: 28 }}
      >
        {TRAITS.map((t) => (
          <div key={t.t}>
            <p className="ev-head" style={{ fontSize: 30 }}>
              {t.t}
            </p>
            <p className="ev-body" style={{ fontSize: 15, marginTop: 8, color: ON.paper.muted }}>
              {t.l}
            </p>
          </div>
        ))}
      </div>
      <div
        className="absolute grid"
        style={{ left: 72, top: 596, width: 1296, gridTemplateColumns: "1fr 1fr", gap: 56 }}
      >
        <Ledger title="Keeps from today" items={KEEPS} desk />
        <Ledger title="Argues" items={ARGUES} desk />
      </div>
    </SlideGround>
  );
}

function IdeaPhone({ screen }: SlideProps) {
  return (
    <SlideGround tone="paper" screen={screen}>
      <div style={{ padding: "28px 20px 0" }}>
        <Kicker tone="paper">The idea</Kicker>
        <h2 className="ev-display" style={{ fontSize: 46, marginTop: 14, lineHeight: 0.95 }}>
          An event&apos;s color is the people in it.
        </h2>
        <div style={{ marginTop: 22 }}>
          <GuestRow people={CROWD} max={13} size={26} initials={false} total={31} />
        </div>
        <dl className="ev-body" style={{ marginTop: 22, fontSize: 15 }}>
          {POSITIONING.map((p) => (
            <div key={p.k} style={{ marginBottom: 14 }}>
              <dt className="ev-label" style={{ color: ON.paper.muted }}>
                {p.k}
              </dt>
              <dd style={{ marginTop: 4 }}>{p.v}</dd>
            </div>
          ))}
        </dl>
        <div style={{ marginTop: 10 }}>
          {TRAITS.map((t) => (
            <div key={t.t} style={{ padding: "10px 0", borderTop: `1px solid ${ON.paper.line}` }}>
              <p className="ev-head" style={{ fontSize: 22 }}>
                {t.t}
              </p>
              <p className="ev-body" style={{ fontSize: 14, marginTop: 4, color: ON.paper.muted }}>
                {t.l}
              </p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22, display: "grid", gap: 22 }}>
          <Ledger title="Keeps from today" items={KEEPS} desk={false} />
          <Ledger title="Argues" items={ARGUES} desk={false} />
        </div>
      </div>
    </SlideGround>
  );
}
