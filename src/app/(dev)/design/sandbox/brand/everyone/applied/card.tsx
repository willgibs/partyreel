"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY, Qr } from "../../deck/media";
import { Wordmark } from "../marks";
import { isDesk, Pic, SlideGround } from "../slides/kit";
import {
  BASE,
  CROWD,
  GuestRow,
  HOST,
  HOUSE_ROW,
  ON,
  Orb,
  type Person,
} from "../system";
import { Caption, Scaled } from "./kit";

/**
 * 13 THE QR CARD. The table card Maya prints (4 by 6 inches, drawn at true
 * size at 96 px to the inch) and the share card her link unfurls into (1200
 * by 630). Both are paper, both carry the code clean in ink on white with
 * nothing over it, and both end in people.
 *
 * ★ PRINT PREDATES THE GUESTS: the table card is printed before anyone has
 * scanned, so its foot seats Maya and the house guests beside her, standing
 * in for everyone still to come, with the wordmark (her full stop) after them.
 * The share card is drawn live, so it wears the real row: "31 guests are in",
 * the newest arriving.
 */

/**
 * THE CARD'S PEOPLE, AS A ROW: the host first with her initial, then the
 * house guests standing in for everyone still to come. A row, not the trail:
 * at a card's foot the wordmark is 20 px tall, and a trail at its full stop's
 * size would be six-pixel dots, which read as a rule rather than as people.
 */
function HostAndHouse({ size }: { size: number }) {
  const people: readonly Person[] = [HOST, ...HOUSE_ROW];
  return (
    <div
      className="ev-row"
      style={{
        ["--ev-row-overlap" as string]: `${-Math.round(size * 0.24)}px`,
      }}
    >
      {people.map((p, i) => (
        <Orb
          key={p.seed}
          seed={p.seed}
          size={size}
          initial={i === 0 ? "M" : undefined}
          ring={Math.max(1.5, Math.round(size * 0.08))}
          ringColor={BASE.white.hex}
          style={{ zIndex: people.length - i }}
          title={i === 0 ? HOST.name : "A house guest"}
        />
      ))}
    </div>
  );
}

/* ── the table card: 4 by 6 inches ─────────────────────────────────────── */

const IN = 96;

function TableCard() {
  const w = 4 * IN;
  const h = 6 * IN;
  return (
    <div
      className="ev-print relative overflow-hidden"
      style={{ width: w, height: h, backgroundColor: BASE.white.hex }}
    >
      <Pic
        id="wedding-golden"
        focus="50% 38%"
        style={{ width: w, height: 196, borderRadius: 0 }}
      />
      <div className="absolute" style={{ left: 28, right: 28, top: 222 }}>
        <p
          className="ev-display"
          data-bd-read="the event on the table card"
          style={{ fontSize: 48, color: BASE.ink.hex }}
        >
          {PARTY.name}
        </p>
        <p
          className="ev-body"
          style={{ fontSize: 13, color: BASE.muted.hex, marginTop: 8 }}
        >
          {PARTY.date}
        </p>
      </div>
      <div
        className="absolute flex items-start"
        style={{ left: 22, right: 28, top: 318, gap: 18 }}
      >
        {/* The quiet zone is the card's own white: four modules clear on every side. */}
        <div style={{ padding: 6, flex: "none" }}>
          <Qr size={150} color={BASE.ink.hex} />
        </div>
        <div style={{ paddingTop: 10 }}>
          <p
            className="ev-head"
            data-bd-contrast="the card's ask on paper"
            style={{ fontSize: 23, lineHeight: 1.05, color: BASE.ink.hex }}
          >
            Scan to add your photos
          </p>
          <p
            className="ev-body"
            style={{ fontSize: 13, color: BASE.muted.hex, marginTop: 10 }}
          >
            No app required
          </p>
          <p
            className="ev-body"
            style={{
              fontSize: 10.5,
              color: BASE.muted.hex,
              marginTop: 16,
              lineHeight: 1.35,
            }}
          >
            partyreel.com/e/
            <br />
            {PARTY.slug}
          </p>
        </div>
      </div>
      <div
        className="absolute flex items-center justify-between"
        style={{ left: 28, right: 28, bottom: 26 }}
      >
        <HostAndHouse size={22} />
        <Wordmark
          height={20}
          dot={HOST.seed}
          read="wordmark on the table card"
        />
      </div>
    </div>
  );
}

/* ── the share card: 1200 by 630 ───────────────────────────────────────── */

function ShareCard({ pop = true }: { pop?: boolean }) {
  return (
    <div
      className="relative overflow-hidden"
      style={{ width: 1200, height: 630, backgroundColor: BASE.white.hex }}
    >
      <Pic
        id="wedding-toast"
        focus="58% 45%"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 540,
          height: 630,
          borderRadius: 0,
        }}
      />
      <div className="absolute" style={{ left: 600, top: 64, right: 60 }}>
        <p
          className="ev-display"
          style={{ fontSize: 100, color: BASE.ink.hex }}
        >
          {PARTY.name}
        </p>
        {/* Set for the size a message shows it (about a quarter): the name, the
            faces and the count must read there; the address and code are for a screen. */}
        <p
          className="ev-body"
          style={{ fontSize: 34, color: BASE.muted.hex, marginTop: 16 }}
        >
          {PARTY.date}
        </p>
        <div className="flex items-center" style={{ gap: 18, marginTop: 34 }}>
          <GuestRow
            people={CROWD}
            max={6}
            total={PARTY.guests}
            size={64}
            pop={pop}
          />
        </div>
        <p
          className="ev-body"
          style={{
            fontSize: 38,
            color: BASE.ink.hex,
            marginTop: 14,
            fontWeight: 600,
          }}
        >
          {PARTY.guests} guests are in
        </p>
      </div>
      <div
        className="absolute flex items-end justify-between"
        style={{ left: 600, right: 60, bottom: 52 }}
      >
        <div>
          <Wordmark height={40} dot={HOST.seed} />
          <p
            className="ev-body"
            style={{ fontSize: 21, color: BASE.muted.hex, marginTop: 12 }}
          >
            {PARTY.url}
          </p>
        </div>
        <Qr size={132} color={BASE.ink.hex} />
      </div>
    </div>
  );
}

/* ── the slide ─────────────────────────────────────────────────────────── */

export function ShareSlide({ screen }: SlideProps) {
  if (!isDesk(screen)) {
    const ts = 335 / (4 * IN);
    const ss = 335 / 1200;
    return (
      <SlideGround
        tone="paper"
        screen={screen}
        style={{ backgroundColor: BASE.step.hex }}
      >
        <div style={{ padding: "28px 20px 0" }}>
          <Scaled w={4 * IN} h={6 * IN} scale={ts} className="ev-print-lift">
            <TableCard />
          </Scaled>
          <Caption tone="paper" style={{ marginTop: 12 }}>
            The table card · 4 × 6 in, at {Math.round(ts * 100)}%
          </Caption>
          <div style={{ marginTop: 34 }}>
            <Scaled w={1200} h={630} scale={ss} className="ev-print-lift">
              <ShareCard />
            </Scaled>
          </div>
          <Caption tone="paper" style={{ marginTop: 12 }}>
            The share card · 1200 × 630, as a message shows it
          </Caption>
        </div>
      </SlideGround>
    );
  }
  const ss = 0.6;
  return (
    <SlideGround
      tone="paper"
      screen={screen}
      style={{ backgroundColor: BASE.step.hex }}
    >
      <div className="absolute" style={{ left: 128, top: 128 }}>
        <div className="ev-print-lift">
          <TableCard />
        </div>
        <Caption tone="paper" style={{ marginTop: 16 }}>
          The table card · 4 × 6 in, true size
        </Caption>
      </div>
      <div className="absolute" style={{ left: 600, top: 254 }}>
        <Scaled w={1200} h={630} scale={ss} className="ev-print-lift">
          <ShareCard />
        </Scaled>
        <Caption tone="paper" style={{ marginTop: 16 }}>
          The share card · 1200 × 630, at 60%
        </Caption>
      </div>
      <p
        className="ev-body absolute"
        style={{
          left: 600,
          top: 718,
          width: 560,
          fontSize: 15,
          color: ON.paper.muted,
        }}
      >
        Print comes before the guests, so house guests stand in beside Maya. The
        link is live, so it wears the real row.
      </p>
    </SlideGround>
  );
}
