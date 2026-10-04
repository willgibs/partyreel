"use client";

import type { CSSProperties } from "react";

import { HEAD } from "../../deck/deck";
import { PARTY, Qr } from "../../deck/media";
import { Display, Kicker, type Screen, SlideRoot } from "../parts";
import {
  Edge,
  eventEdge,
  GROUND,
  Latent,
  Print,
  Strip,
  type StripFrame,
  who,
} from "../system";
import { Scaled } from "./kit";

/**
 * 13 THE QR CARD: the table card is a print. Printed before a single
 * photograph exists, it carries the event's latent image (the same light as
 * the album's cover and its home-screen icon), the host's names first, her
 * real code and one line of how, and the event's edge knocked out of a band
 * along its foot: the only Partyreel on it is the stock name a film prints.
 * Beside it, the share card the album's link unfolds into once the party has
 * its photographs: the keeper as a print over the roll, and the same edge.
 *
 * What it proves: the brand is the paper and the edge, so the one object a
 * guest holds is the host's, and it still could only be Partyreel's.
 */

/** The table card's size: 5 by 7 in, at 96 px to the inch (true size on a desk). */
const CARD = { w: 480, h: 672 } as const;
const URL = `https://${PARTY.url}`;

/**
 * THE TABLE CARD at its own size (480 by 672, a 5 by 7 in print), drawn
 * whole: a print's border, the latent image, the names, the code and its
 * line, and the rebate band along its foot.
 */
export function TableCard({ style }: { style?: CSSProperties }) {
  const b = 28;
  return (
    <div
      className="cs-print"
      style={{
        position: "relative",
        width: CARD.w,
        height: CARD.h,
        overflow: "hidden",
        ...style,
      }}
      data-bd-read="the table card, 5 by 7 in"
    >
      <div
        style={{
          position: "absolute",
          left: b,
          top: b,
          width: CARD.w - 2 * b,
          height: 286,
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Latent seed={PARTY.seed} veil={0.85} />
      </div>
      <div
        style={{ position: "absolute", left: b, right: b, top: b + 286 + 30 }}
      >
        <Display size={58} style={{ lineHeight: 0.96 }}>
          {PARTY.name}
        </Display>
        <p
          className="cs-read cs-muted"
          style={{ margin: "10px 0 0", fontSize: 18, lineHeight: "25px" }}
        >
          {PARTY.kind}, {PARTY.date}
        </p>
      </div>
      <div
        style={{
          position: "absolute",
          left: b,
          right: b,
          top: 470,
          display: "flex",
          gap: 22,
          alignItems: "center",
        }}
      >
        <div
          style={{
            flex: "none",
            width: 152,
            height: 152,
            display: "grid",
            placeItems: "center",
          }}
        >
          <Qr value={URL} size={152} color={GROUND.ink.hex} />
        </div>
        <div>
          <p
            className="cs-read"
            style={{
              margin: 0,
              fontSize: 23,
              lineHeight: "28px",
              fontWeight: 650,
              letterSpacing: "-0.01em",
            }}
          >
            Scan to add your photos
          </p>
          <p
            className="cs-read cs-muted"
            style={{ margin: "8px 0 0", fontSize: 17, lineHeight: "23px" }}
          >
            Point your camera at the code. No app required.
          </p>
        </div>
      </div>
      <Edge
        items={eventEdge()}
        band
        size={12}
        height={30}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingLeft: b,
        }}
      />
    </div>
  );
}

const SHARE = { w: 1200, h: 630 } as const;

const SHARE_ROLL: readonly StripFrame[] = [
  { photo: "wedding-toast", n: "21", who: who(0) },
  { photo: "party-dj", n: "22", who: who(6) },
  { photo: "wedding-rings", n: "23", who: who(4) },
];

/**
 * THE SHARE CARD (1200 by 630), what the album's link unfolds into in a
 * thread once the party has its photographs: the names large enough to read
 * as a thumbnail, the keeper as a print over the roll, the code for a screen
 * across the room, and the edge with the album's true counts along its foot.
 */
export function ShareCard() {
  return (
    <div
      style={{
        position: "relative",
        width: SHARE.w,
        height: SHARE.h,
        overflow: "hidden",
        background: GROUND.paper.hex,
        color: GROUND.ink.hex,
      }}
      data-bd-read="the share card, 1200 by 630"
    >
      <div style={{ position: "absolute", left: 72, top: 70, width: 560 }}>
        <Display size={124} style={{ lineHeight: 0.9 }}>
          {PARTY.name}
        </Display>
        <p
          className="cs-read cs-muted"
          style={{ margin: "26px 0 0", fontSize: 38, lineHeight: "46px" }}
        >
          {PARTY.kind} album
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            marginTop: 64,
          }}
        >
          <div
            style={{
              background: GROUND.print.hex,
              padding: 10,
              boxShadow: "0 0 0 1px rgb(22 18 15 / 0.1)",
            }}
          >
            <Qr value={URL} size={128} color={GROUND.ink.hex} />
          </div>
          <p
            className="cs-read"
            style={{
              margin: 0,
              fontSize: 30,
              lineHeight: "36px",
              fontWeight: 600,
            }}
          >
            {PARTY.photos.toLocaleString("en-US")} photos
            <br />
            from {PARTY.guests} guests
          </p>
        </div>
      </div>
      <Strip
        frames={SHARE_ROLL}
        frameW={250}
        gap={8}
        pad={12}
        edgeSize={13}
        top={eventEdge()}
        style={{ position: "absolute", left: 640, top: 300 }}
      />
      <Print
        photo="wedding-petals"
        w={318}
        ratio={2 / 3}
        border={16}
        tilt={3}
        edge={["24", { text: "Lena", seed: who(5).seed }, "The keeper"]}
        edgeSize={13}
        style={{ position: "absolute", left: 760, top: 40 }}
      />
      <Edge
        items={eventEdge(undefined, [
          `${PARTY.guests} guests`,
          `${PARTY.photos} frames`,
        ])}
        band
        size={15}
        height={40}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingLeft: 72,
        }}
      />
    </div>
  );
}

/** The table the card stands on: linen under a paper wall, and the card's shadow on it. */
function Table({
  top,
  w,
  cardLeft,
  cardW,
}: {
  top: number;
  w: number;
  cardLeft: number;
  cardW: number;
}) {
  return (
    <>
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          width: w,
          top,
          bottom: 0,
          background: "linear-gradient(to bottom, #e4ddd2, #ece6dd 70%)",
          boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.5)",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          left: cardLeft - cardW * 0.04,
          width: cardW * 1.08,
          top: top - 10,
          height: 26,
          borderRadius: "50%",
          background:
            "radial-gradient(closest-side, rgb(22 18 15 / 0.32), rgb(22 18 15 / 0))",
        }}
      />
    </>
  );
}

export function ShareSlide({ screen }: { screen: Screen }) {
  return screen === "1440" ? <ShareDesk /> : <SharePhone />;
}

function ShareDesk() {
  const cardLeft = 96;
  const cardTop = HEAD["1440"] + 70;
  const tableTop = cardTop + CARD.h - 6;
  const shareScale = 0.6;
  return (
    <SlideRoot screen="1440" style={{ background: GROUND.sheet.hex }}>
      <Table top={tableTop} w={1440} cardLeft={cardLeft} cardW={CARD.w} />
      <Kicker
        style={{ position: "absolute", left: cardLeft, top: HEAD["1440"] + 30 }}
      >
        The table card, 5 by 7 in, at true size
      </Kicker>
      <TableCard
        style={{
          position: "absolute",
          left: cardLeft,
          top: cardTop,
          borderRadius: 3,
        }}
      />
      <div
        className="absolute"
        style={{
          left: 656,
          top: cardTop + CARD.h / 2 - (SHARE.h * shareScale) / 2 - 44,
        }}
      >
        <Kicker>The share card, 1200 by 630</Kicker>
        <Scaled
          w={SHARE.w}
          h={SHARE.h}
          scale={shareScale}
          style={{
            marginTop: 18,
            borderRadius: 10,
            boxShadow:
              "0 0 0 1px rgb(22 18 15 / 0.1), 0 24px 50px -24px rgb(22 18 15 / 0.4)",
          }}
        >
          <ShareCard />
        </Scaled>
        <div
          style={{
            width: SHARE.w * shareScale,
            marginTop: 14,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <p
            className="cs-read"
            style={{ margin: 0, fontSize: 14, lineHeight: "20px" }}
          >
            <strong style={{ fontWeight: 600 }}>{PARTY.name}</strong>
            <span className="cs-muted">
              : the album&rsquo;s link, unfolded in a thread
            </span>
          </p>
          <span className="cs-read cs-faint" style={{ fontSize: 13 }}>
            partyreel.com
          </span>
        </div>
      </div>
    </SlideRoot>
  );
}

function SharePhone() {
  const scale = 343 / CARD.w;
  const cardH = Math.round(CARD.h * scale);
  const shareScale = 343 / SHARE.w;
  const top = HEAD["375"] + 24;
  const tableTop = top + 32 + cardH - 4;
  return (
    <SlideRoot screen="375" style={{ background: GROUND.sheet.hex }}>
      <Table top={tableTop} w={375} cardLeft={16} cardW={343} />
      <div className="absolute" style={{ left: 16, top }}>
        <Kicker style={{ fontSize: 11 }}>The table card, 5 by 7 in</Kicker>
        <Scaled
          w={CARD.w}
          h={CARD.h}
          scale={scale}
          style={{ marginTop: 14, overflow: "visible" }}
        >
          <TableCard />
        </Scaled>
      </div>
      <div className="absolute" style={{ left: 16, top: tableTop + 70 }}>
        <Kicker style={{ fontSize: 11 }}>The share card, 1200 by 630</Kicker>
        <Scaled
          w={SHARE.w}
          h={SHARE.h}
          scale={shareScale}
          style={{
            marginTop: 14,
            borderRadius: 8,
            boxShadow:
              "0 0 0 1px rgb(22 18 15 / 0.1), 0 18px 36px -20px rgb(22 18 15 / 0.4)",
          }}
        >
          <ShareCard />
        </Scaled>
        <p
          className="cs-read"
          style={{
            margin: "12px 0 0",
            fontSize: 13,
            lineHeight: "19px",
            width: 343,
          }}
        >
          <strong style={{ fontWeight: 600 }}>{PARTY.name}</strong>
          <span className="cs-muted">
            : the album&rsquo;s link, unfolded in a thread
          </span>
        </p>
      </div>
    </SlideRoot>
  );
}
