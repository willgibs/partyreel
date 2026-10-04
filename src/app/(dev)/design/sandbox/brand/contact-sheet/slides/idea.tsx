"use client";

import type { PhotoId } from "../../deck/media";
import { HEAD } from "../../deck/deck";
import {
  Copy,
  Display,
  Kicker,
  type Screen,
  SlideFoot,
  SlideRoot,
} from "../parts";
import { EdgeArrow, Print } from "../system";

/**
 * 02 THE IDEA: who it is for and what it promises, the personality as four
 * frames off the roll, and what the vision keeps from today and argues.
 */

const PROMISE =
  "Every frame from every guest, developed together into one album.";
const FOR =
  "For hosts and everyone they invite: a wedding, a birthday, a trip, a festival. One code on the table puts the whole room's photographs on one sheet, so the brand can be the paper and the photographs can be the colour.";

const TRAITS: readonly {
  n: string;
  word: string;
  line: string;
  photo: PhotoId;
  focus?: string;
}[] = [
  {
    n: "01",
    word: "Candid",
    line: "The blink beside the keeper. Every frame counts.",
    photo: "party-dj",
  },
  {
    n: "02",
    word: "Crafted",
    line: "A photo lab's care: the border, the edge, the type.",
    photo: "reception-table",
  },
  {
    n: "03",
    word: "Witty",
    line: "A lab's humour in the margins, never on the photograph.",
    photo: "party-balloons",
  },
  {
    n: "04",
    word: "Alive",
    line: "Everyone's roll at once: a party still going, never a dusty album.",
    photo: "concert-confetti",
  },
];

const KEPT = [
  "No brand hue, warmed to paper and ink",
  "The five lamps, kept as light for the reel's wall",
  "The hashvatar, as the latent image",
  "The light edge, where film is projected",
  "Photographs at a 2 px corner",
  "The display, in ink; Inter to read",
];
const ARGUED = [
  "Status as lights: now the lab's marks",
  "Urbanist: now Bricolage Grotesque, more ink",
  "The silver body: now warm paper",
  "The aurora: the latent image, the colour of a photograph about to be",
];

function Items({ items, size }: { items: readonly string[]; size: number }) {
  return (
    <ul
      style={{
        margin: 0,
        padding: 0,
        listStyle: "none",
        display: "grid",
        gap: size * 0.62,
      }}
    >
      {items.map((t) => (
        <li
          key={t}
          className="cs-read"
          style={{
            display: "flex",
            gap: 10,
            fontSize: size,
            lineHeight: `${Math.round(size * 1.38)}px`,
          }}
        >
          <span
            className="cs-edge"
            style={{
              fontSize: size * 0.8,
              height: Math.round(size * 1.38),
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

function Trait({
  t,
  w,
  line,
}: {
  t: (typeof TRAITS)[number];
  w: number;
  line: number;
}) {
  return (
    <div style={{ width: w }}>
      <Print
        photo={t.photo}
        focus={t.focus}
        w={w}
        edge={[t.n, t.word]}
        edgeSize={w > 200 ? 12 : 10}
        border={w > 200 ? 14 : 8}
        flat
      />
      <Copy size={line} style={{ marginTop: 10 }}>
        <strong
          className="cs-display"
          style={{
            fontSize: line + 3,
            letterSpacing: "-0.02em",
            color: "var(--cs-ink)",
          }}
        >
          {t.word}.
        </strong>{" "}
        {t.line}
      </Copy>
    </div>
  );
}

export function IdeaSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <IdeaDesk /> : <IdeaPhone />;
}

function IdeaDesk() {
  return (
    <SlideRoot screen="1440">
      <div
        className="absolute"
        style={{ left: 64, top: HEAD["1440"] + 40, width: 610 }}
      >
        <Kicker>Positioning</Kicker>
        <Display size={46} style={{ marginTop: 18, lineHeight: 1.0 }}>
          <span data-bd-read="promise">{PROMISE}</span>
        </Display>
        <Copy size={17} lead={26} style={{ marginTop: 22, maxWidth: 560 }}>
          {FOR}
        </Copy>
        <Kicker style={{ marginTop: 44 }}>Kept from today, and argued</Kicker>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 32,
            marginTop: 18,
          }}
        >
          <div>
            <p
              className="cs-read"
              style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}
            >
              Kept
            </p>
            <Items items={KEPT} size={14} />
          </div>
          <div>
            <p
              className="cs-read"
              style={{ fontSize: 13, fontWeight: 600, margin: "0 0 10px" }}
            >
              Argued
            </p>
            <Items items={ARGUED} size={14} />
          </div>
        </div>
      </div>
      <div
        className="absolute"
        style={{ left: 740, top: HEAD["1440"] + 40, width: 636 }}
      >
        <Kicker>Personality</Kicker>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 300px",
            columnGap: 36,
            rowGap: 30,
            marginTop: 22,
          }}
        >
          {TRAITS.map((t) => (
            <Trait key={t.n} t={t} w={300} line={14} />
          ))}
        </div>
      </div>
      <SlideFoot screen="1440" />
    </SlideRoot>
  );
}

function IdeaPhone() {
  return (
    <SlideRoot screen="375">
      <div
        className="absolute"
        style={{ left: 16, right: 16, top: HEAD["375"] + 24 }}
      >
        <Kicker style={{ fontSize: 11 }}>Positioning</Kicker>
        <Display size={31} style={{ marginTop: 12, lineHeight: 1.02 }}>
          <span data-bd-read="promise">{PROMISE}</span>
        </Display>
        <Copy size={15} lead={22} style={{ marginTop: 14 }}>
          {FOR}
        </Copy>
        <Kicker style={{ fontSize: 11, marginTop: 30 }}>Personality</Kicker>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            columnGap: 16,
            rowGap: 20,
            marginTop: 14,
          }}
        >
          {TRAITS.map((t) => (
            <Trait key={t.n} t={t} w={163} line={13} />
          ))}
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 30 }}>Kept from today</Kicker>
        <div style={{ marginTop: 12 }}>
          <Items items={KEPT} size={14} />
        </div>
        <Kicker style={{ fontSize: 11, marginTop: 24 }}>Argued</Kicker>
        <div style={{ marginTop: 12 }}>
          <Items items={ARGUED} size={14} />
        </div>
      </div>
      <SlideFoot screen="375" />
    </SlideRoot>
  );
}
