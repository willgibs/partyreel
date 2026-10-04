"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY, Qr } from "../../deck/media";
import { Wordmark } from "../marks";
import { ink, SlideRoot } from "../root";
import { GROUND, lightOfSeed, LitPhoto, Readout, Seam } from "../system";
import { Note, type RowSpec, Scaled, Wall, wallOf, WallSeam } from "./kit";

/**
 * 13 THE QR CARD: one event's code on two objects, either side of its first
 * photograph. The table card (printed, A6, at true size) carries the event's
 * own seed as its light, printed: a thin line and a short glow at its foot, in
 * paper's register. The share card (1200 by 630, the link's card once the
 * album has filled) is in the room and lit by the album: the photographs
 * along its top, their own light born in place beneath them. Each object has
 * one light; the code is never lit on the share card (the album is).
 *
 * The table card is drawn at A6 (105 by 148 mm, 397 by 559 at 96 to the inch):
 * a proposal, beside production's 62 by 84 mm card nine to a sheet, because a
 * code read from across a table wants room.
 */

const MM = 96 / 25.4;
const CARD = { w: Math.round(105 * MM), h: Math.round(148 * MM) };

const SEED_LIGHT = lightOfSeed(PARTY.seed);

/** The printed table card, at its own size. */
function TableCard() {
  return (
    <div
      className="relative flex flex-col items-center overflow-hidden text-center"
      style={{
        width: CARD.w,
        height: CARD.h,
        background: "#fdfdfc",
        color: "#121214",
        borderRadius: 3,
        padding: "34px 30px 0",
        boxShadow: "0 1px 1px rgb(20 20 22 / 0.06), 0 22px 44px -18px rgb(20 20 22 / 0.42), 0 2px 8px -2px rgb(20 20 22 / 0.12)",
      }}
    >
      <p className="ag-title" data-bd-read="the card's name" style={{ fontSize: 36, letterSpacing: "-0.035em" }}>
        {PARTY.name}
      </p>
      <p style={{ fontSize: 13, color: "#5d5d63", marginTop: 6 }}>{PARTY.date}</p>
      <div style={{ marginTop: 26 }}>
        <Qr size={212} color="#121214" />
      </div>
      <p className="ag-subtitle" style={{ fontSize: 22, marginTop: 22 }}>
        Scan to add your photos
      </p>
      <p style={{ fontSize: 12.5, color: "#6b6b70", marginTop: 6 }}>No app required. {PARTY.url}</p>
      <div className="absolute inset-x-0" style={{ bottom: 58 }}>
        <div className="flex justify-center">
          <Wordmark height={13} color="#121214" read="the card's wordmark" />
        </div>
      </div>
      {/* The event's own light, printed: born at the card's foot, spent below its words. */}
      <div className="absolute inset-x-0 bottom-0" style={{ height: 40 }}>
        <Seam light={SEED_LIGHT} ground="paper" edge="bottom" reach={40} drift={false} />
      </div>
    </div>
  );
}

/** The album's top row on the share card: its bottom edges carry their own light. */
const SHARE_ROW: readonly RowSpec[] = [
  [
    { id: "wedding-toast", a: 1.3, focus: "50% 100%" },
    { id: "party-balloons", a: 1.2, focus: "50% 100%" },
    { id: "reception-table", a: 1.2, focus: "50% 100%" },
    { id: "wedding-arch", a: 1.3, focus: "50% 100%" },
  ],
];

/** The link's card, 1200 by 630, once the album has filled. */
function ShareCard() {
  const t = ink("room");
  const wall = wallOf(SHARE_ROW, 1200, 6);
  const reach = 116;
  return (
    <div className="relative overflow-hidden" style={{ width: 1200, height: 630, background: GROUND.room.hex, color: t.fg }}>
      <div className="absolute inset-x-0 top-0" style={{ height: wall.height }}>
        <Wall tiles={wall.tiles} />
      </div>
      <div className="absolute inset-x-0" style={{ top: wall.height, height: reach }}>
        <WallSeam tiles={wall.bottom} width={1200} reach={reach} />
      </div>
      <div className="absolute" style={{ left: 64, top: wall.height + reach + 4 }}>
        <p className="ag-title" style={{ fontSize: 84, letterSpacing: "-0.04em" }}>
          {PARTY.name}
        </p>
        <p className="ag-readout" style={{ fontSize: 17, color: t.muted, marginTop: 16, letterSpacing: "0.08em" }}>
          {PARTY.photos.toLocaleString("en-US")} photos from {PARTY.guests} guests
        </p>
      </div>
      <div className="absolute" style={{ left: 64, bottom: 48 }}>
        <Wordmark height={26} color={t.fg} read="the share card's wordmark" />
      </div>
      <div className="absolute flex items-center" style={{ right: 56, bottom: 44, gap: 20 }}>
        <p style={{ fontSize: 19, color: t.muted, textAlign: "right", lineHeight: 1.35 }}>
          See everyone&apos;s photos,
          <br />
          and add yours.
        </p>
        <div style={{ background: "#ffffff", padding: 12, borderRadius: 14 }}>
          <Qr size={124} color="#121214" />
        </div>
      </div>
    </div>
  );
}

const PROOF =
  "One event, its code on two objects. Before the first photograph the card wears the event's own light, printed at its foot; once the album fills, the link's card wears the album's.";

export function ShareSlide({ screen }: SlideProps) {
  const t = ink("paper");
  if (screen === "375") {
    const s = 0.84;
    return (
      <SlideRoot screen={screen} ground="paper" style={{ background: "#e9e9ec" }}>
        <div className="absolute inset-x-0 px-5" style={{ top: 76 }}>
          <Readout style={{ color: t.faint }}>The table card, A6, shown at 84%</Readout>
          <div className="flex justify-center" style={{ marginTop: 18 }}>
            <Scaled w={CARD.w} view={CARD.h} scale={s} style={{ overflow: "visible" }}>
              <TableCard />
            </Scaled>
          </div>
          <Readout className="block" style={{ color: t.faint, marginTop: 40 }}>
            The share card, 1200 × 630
          </Readout>
          <div style={{ marginTop: 14, borderRadius: 6, overflow: "hidden", boxShadow: "0 0 0 1px rgb(20 20 22 / 0.1), 0 16px 32px -18px rgb(20 20 22 / 0.5)" }}>
            <Scaled w={1200} view={630} scale={335 / 1200}>
              <ShareCard />
            </Scaled>
          </div>
          <Note ground="paper" label="One light, two grounds" style={{ marginTop: 32 }}>
            {PROOF}
          </Note>
        </div>
      </SlideRoot>
    );
  }
  const shareW = 736;
  return (
    <SlideRoot screen={screen} ground="paper" style={{ background: "#e9e9ec" }}>
      {/* The setting: the table it stands on, a real photograph of one. */}
      <div className="absolute overflow-hidden" style={{ left: 48, top: 88, width: 560, height: 780, borderRadius: 4 }}>
        <LitPhoto id="reception-table" ground="paper" focus="34% 50%" style={{ position: "absolute", inset: 0 }} />
        <div className="absolute" style={{ left: (560 - CARD.w) / 2, bottom: 54 }}>
          {/* Its contact with the table. */}
          <div
            aria-hidden
            className="absolute"
            style={{ left: -18, right: -18, bottom: -16, height: 34, borderRadius: "50%", background: "radial-gradient(closest-side, rgb(30 20 10 / 0.45), transparent)" }}
          />
          <TableCard />
        </div>
      </div>
      <Readout className="absolute" style={{ left: 48, top: 876, color: t.faint }}>
        Table card · A6, 105 × 148 mm, at true size
      </Readout>
      <div className="absolute" style={{ left: 656, top: 196 }}>
        <Readout style={{ color: t.faint }}>Share card · 1200 × 630, once the album fills</Readout>
        <div style={{ marginTop: 14, borderRadius: 8, overflow: "hidden", boxShadow: "0 0 0 1px rgb(20 20 22 / 0.1), 0 30px 60px -30px rgb(20 20 22 / 0.55)" }}>
          <Scaled w={1200} view={630} scale={shareW / 1200}>
            <ShareCard />
          </Scaled>
        </div>
        <Note ground="paper" label="One light, two grounds" width={shareW} style={{ marginTop: 40 }}>
          {PROOF}
        </Note>
      </div>
    </SlideRoot>
  );
}
