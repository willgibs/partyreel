"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY, type PhotoId } from "../../deck/media";
import { ink, SlideRoot } from "../root";
import { GROUND, lightOfPhotos, Readout, StatusLight } from "../system";
import {
  BrowserWindow,
  Btn,
  Note,
  PhoneView,
  type RowSpec,
  SiteFooter,
  SiteNav,
  Wall,
  wallOf,
  WallSeam,
} from "./kit";

/**
 * 10 A DARK PAGE: /features/album in the room. The album is the page's
 * subject, a wall of one wedding's photographs edge to edge (Maya & Jay's:
 * golden hour, the aisle, the rings, the floor, the toast, the balloons, the
 * table, the arch), and its light is the Seam born in place under it: each
 * photograph's own bottom edge, sampled segment by segment, falls into the
 * room directly beneath it (gold under the toast, cream under the balloons,
 * amber under the table, green under the arch). The copy starts past the
 * light's reach. A viewport later the page ends on its own ground, the foot's
 * top edge lit by the album's light: no ink slab.
 *
 * Words are the site's own (`feature-pages.ts`, `full-quality.tsx`).
 */

const H1 = "Every photo, from every guest, in one place.";
const SUB = "One code in the room. Every phone uploads into the same album, live, at full quality.";
const CLAIMS = [
  ["Originals, not copies", "Photos land at full resolution. Nothing is recompressed on the way in."],
  ["Video too", "Videos upload the same way photos do, from the same sheet, into the same album."],
  ["Download one, or all of it", "Every original is there to take, one at a time or the whole album at once."],
] as const;

/** The bottom row carries `EDGE` data, so its light can be born in place; anchored at the foot so the crop keeps that edge. */
const DESK_ROWS: readonly RowSpec[] = [
  [
    { id: "wedding-golden", a: 1.5 },
    { id: "wedding-petals", a: 0.75, focus: "50% 26%" },
    { id: "reception-hall", a: 1.5 },
    { id: "wedding-rings", a: 1.5 },
    { id: "party-dj", a: 1.5 },
  ],
  [
    { id: "wedding-toast", a: 2, focus: "50% 100%" },
    { id: "party-balloons", a: 1.5, focus: "50% 100%" },
    { id: "reception-table", a: 1.5, focus: "50% 100%" },
    { id: "wedding-arch", a: 2, focus: "50% 100%" },
  ],
];

const PHONE_ROWS: readonly RowSpec[] = [
  [
    { id: "wedding-golden", a: 1.5 },
    { id: "wedding-petals", a: 0.75, focus: "50% 24%" },
  ],
  [
    { id: "wedding-rings", a: 1.5 },
    { id: "party-dj", a: 1.5 },
  ],
  [
    { id: "wedding-toast", a: 1.5, focus: "50% 100%" },
    { id: "wedding-arch", a: 1.5, focus: "50% 100%" },
  ],
];

const ALBUM: PhotoId[] = [...new Set(DESK_ROWS.flat().map((t) => t.id))];
const ALBUM_LIGHT = lightOfPhotos(ALBUM);

/** What follows the light: the album's own readouts, past its reach. */
function AlbumLine({ size }: { size: "desk" | "phone" }) {
  const t = ink("room");
  const desk = size === "desk";
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-baseline" style={{ gap: desk ? 16 : 10, flexWrap: "wrap" }}>
        <span className="ag-subtitle" style={{ fontSize: desk ? 22 : 19 }}>
          {PARTY.name}
        </span>
        <Readout style={{ color: t.faint }}>
          {PARTY.photos.toLocaleString("en-US")} photos from {PARTY.guests} guests
        </Readout>
      </div>
      <StatusLight state="ready" ground="room" wordContrast={desk ? "status word under the wall" : undefined}>
        3 just added
      </StatusLight>
    </div>
  );
}

/** The first screen at a desk, drawn at 1440 by 900. */
function AlbumDesk() {
  const t = ink("room");
  const wallW = 1328;
  const wall = wallOf(DESK_ROWS, wallW, 6);
  const top = 288;
  const reach = 112;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: GROUND.room.hex, color: t.fg }}>
      <SiteNav ground="room" screen="desk" active="Features" />
      <div className="absolute flex items-end justify-between" style={{ left: 96, right: 96, top: 116 }}>
        <div>
          <Readout style={{ color: t.faint }}>The live album</Readout>
          <h1
            className="ag-title"
            data-bd-contrast="the H1 on the room"
            aria-label={H1}
            style={{ fontSize: 54, marginTop: 14, color: t.fg }}
          >
            <span className="block">Every photo, from every guest,</span>
            <span className="block">in one place.</span>
          </h1>
        </div>
        <p className="ag-lede" style={{ fontSize: 17.5, color: t.muted, maxWidth: 340, paddingBottom: 4 }}>
          {SUB}
        </p>
      </div>
      <div className="absolute" style={{ left: 56, top, width: wallW, height: wall.height }}>
        <Wall tiles={wall.tiles} />
      </div>
      <div className="absolute" style={{ left: 56, top: top + wall.height, width: wallW, height: reach }}>
        <WallSeam tiles={wall.bottom} width={wallW} reach={reach} />
      </div>
      <div className="absolute" style={{ left: 96, right: 96, top: top + wall.height + reach + 12 }}>
        <AlbumLine size="desk" />
      </div>
    </div>
  );
}

/** The whole page on a phone, drawn at 375 wide: opener, a quiet section, the foot. */
const ALBUM_PHONE_H = 1702;

function AlbumPhone() {
  const t = ink("room");
  const wall = wallOf(PHONE_ROWS, 375, 4);
  const top = 424;
  const reach = 92;
  const foot = 1362;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: GROUND.room.hex, color: t.fg }}>
      <SiteNav ground="room" screen="phone" active="Features" />
      <div className="absolute" style={{ left: 20, right: 20, top: 132 }}>
        <Readout style={{ color: t.faint }}>The live album</Readout>
        <h1 className="ag-title" style={{ fontSize: 35, marginTop: 12, color: t.fg }}>
          {H1}
        </h1>
        <p className="ag-lede" style={{ fontSize: 15.5, lineHeight: 1.5, color: t.muted, marginTop: 14 }}>
          {SUB}
        </p>
        <div className="flex" style={{ gap: 10, marginTop: 22 }}>
          <Btn ground="room" size="md">
            Start free
          </Btn>
          <Btn ground="room" kind="secondary" size="md">
            See how it works
          </Btn>
        </div>
      </div>
      <div className="absolute inset-x-0" style={{ top, height: wall.height }}>
        <Wall tiles={wall.tiles} />
      </div>
      <div className="absolute inset-x-0" style={{ top: top + wall.height, height: reach }}>
        <WallSeam tiles={wall.bottom} width={375} reach={reach} />
      </div>
      <div className="absolute" style={{ left: 20, right: 20, top: top + wall.height + reach + 6 }}>
        <AlbumLine size="phone" />
      </div>
      {/* A quiet section: no light, the room and its words. */}
      <div className="absolute" style={{ left: 20, right: 20, top: 1018 }}>
        <Readout style={{ color: t.faint }}>Full quality</Readout>
        <h2 className="ag-title" style={{ fontSize: 27, marginTop: 10 }}>
          Everything they shoot, at the size they shot it.
        </h2>
        <div className="flex flex-col" style={{ gap: 12, marginTop: 18 }}>
          {CLAIMS.map(([title, body]) => (
            <div key={title}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{title}</p>
              <p className="ag-body" style={{ fontSize: 14, color: t.muted, marginTop: 2 }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter ground="room" screen="phone" light={ALBUM_LIGHT} height={ALBUM_PHONE_H - foot} style={{ top: foot }} />
    </div>
  );
}

const PROOF =
  "The light under the album is the album's own: each photograph's edge, where it is, gold under the toast and green under the arch.";

export function DarkPageSlide({ screen }: SlideProps) {
  const t = ink("room");
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <div className="absolute inset-x-0 top-0 overflow-hidden" style={{ height: ALBUM_PHONE_H }}>
          <AlbumPhone />
        </div>
        <div
          className="absolute inset-x-0"
          style={{ top: ALBUM_PHONE_H, paddingInline: 20, paddingTop: 22, borderTop: "1px solid rgb(255 255 255 / 0.08)" }}
        >
          <Note ground="room" label="The Seam, in place">
            {PROOF}
          </Note>
        </div>
      </SlideRoot>
    );
  return (
    <SlideRoot screen={screen} ground="room" style={{ background: GROUND.display.hex }}>
      <BrowserWindow
        width={1000}
        ground="room"
        url="partyreel.com/features/album"
        style={{ position: "absolute", left: 48, top: 92 }}
      >
        <AlbumDesk />
      </BrowserWindow>
      <PhoneView
        width={300}
        ground="room"
        pageH={ALBUM_PHONE_H}
        scroll={ALBUM_PHONE_H - 812}
        style={{ position: "absolute", right: 48, top: 92 }}
      >
        <AlbumPhone />
      </PhoneView>
      <Readout className="absolute" style={{ right: 48, top: 742, width: 300, textAlign: "center", color: t.faint }}>
        A scroll later: its foot, 375 wide
      </Readout>
      <Note ground="room" label="The Seam, in place" width={640} style={{ position: "absolute", left: 48, top: 780 }}>
        {PROOF}
      </Note>
    </SlideRoot>
  );
}
