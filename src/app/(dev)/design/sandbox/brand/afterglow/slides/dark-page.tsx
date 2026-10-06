"use client";

import type { SlideProps } from "../../deck/contract";
import { PARTY, type PhotoId } from "../../deck/media";
import { SiteFooter, SiteNav, StatusLight, Wall } from "../kit";
import { SlideRoot } from "../root";
import { Readout, ROOM, type RowSpec, wallOf } from "../system";
import { useInk, useTake } from "../take";
import { DeskStage, deskOf, PhoneStage } from "./c-parts";

/**
 * 10 A DARK PAGE: /features/album, in the room.
 *
 * The album is the page's subject: one wedding's photographs as a justified
 * wall, edge to edge, and the page's one light is the Seam born in place under
 * its bottom row (`take.light.WallSeam`): each photograph's own light falls
 * into the room directly beneath it, so the light under the toast is the
 * toast's and the light under the arch is the arch's. The event's line starts
 * past the light's reach. A scroll later the page ends on its foot, whose top
 * edge the album's light reaches once more, quieter.
 *
 * ★ THE BOTTOM ROW IS CHOSEN FOR ITS EDGES: every photograph in it carries its
 * bottom edge's sampled light (`EDGE`) and is cropped from its foot, so what
 * glows under each one is the strip of picture it really ends on.
 *
 * Words are the site's own (`feature-pages.ts`, `full-quality.tsx`).
 */

const H1 = "Every photo, from every guest, in one place.";
const SUB =
  "One code in the room. Every phone uploads into the same album, live, at full quality.";
const CLAIMS = [
  [
    "Originals, not copies",
    "Photos land at full resolution. Nothing is recompressed on the way in.",
  ],
  [
    "Video too",
    "Videos upload the same way photos do, from the same sheet, into the same album.",
  ],
  [
    "Download one, or all of it",
    "Every original is there to take, one at a time or the whole album at once.",
  ],
] as const;

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

/** The page's photographs: the foot's light is theirs. */
const ALBUM: readonly PhotoId[] = [
  ...new Set(DESK_ROWS.flat().map((t) => t.id)),
];

/** The event's line, past the light's reach: the album's own readouts. */
function AlbumLine({ desk }: { desk: boolean }) {
  const t = useInk("room");
  return (
    <div className="flex items-center justify-between">
      <div
        className="flex items-baseline"
        style={{ gap: desk ? 16 : 10, flexWrap: "wrap" }}
      >
        <span className="ag-subtitle" style={{ fontSize: desk ? 22 : 19 }}>
          {PARTY.name}
        </span>
        <Readout style={{ color: t.faint }}>
          {PARTY.photos.toLocaleString("en-US")} photos from {PARTY.guests}{" "}
          guests
        </Readout>
      </div>
      <StatusLight
        state="ready"
        ground="room"
        wordContrast={desk ? "the status word under the wall" : undefined}
      >
        3 just added
      </StatusLight>
    </div>
  );
}

/** The page's left and right edge at a desk: the nav's own. */
const MARGIN = 72;
/** The wall at a desk: on the page's edges, 6 px between prints. */
const DESK_WALL = { top: 304, width: 1440 - 2 * MARGIN, gap: 6, reach: 112 };

/** The first screen at a desk, drawn at 1440 by 900. */
function AlbumDesk() {
  const take = useTake();
  const t = useInk("room");
  const { WallSeam } = take.light;
  const w = DESK_WALL;
  const wall = wallOf(DESK_ROWS, w.width, w.gap);
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: ROOM.room.hex, color: t.fg }}
    >
      <SiteNav ground="room" screen="desk" active="Features" />
      <div
        className="absolute flex items-end justify-between"
        style={{ left: MARGIN, right: MARGIN, top: 120 }}
      >
        <div>
          <Readout style={{ color: t.faint }}>The live album</Readout>
          <h1
            className="ag-title"
            aria-label={H1}
            data-bd-contrast="the H1 on the room"
            style={{ fontSize: 54, marginTop: 14, color: t.fg }}
          >
            <span className="block">Every photo, from every guest,</span>
            <span className="block">in one place.</span>
          </h1>
        </div>
        <p
          className="ag-lede"
          style={{
            fontSize: 17.5,
            color: t.muted,
            maxWidth: 340,
            paddingBottom: 4,
            textWrap: "pretty",
          }}
        >
          {SUB}
        </p>
      </div>
      <div
        className="absolute"
        style={{
          left: MARGIN,
          top: w.top,
          width: w.width,
          height: wall.height,
        }}
      >
        <Wall tiles={wall.tiles} />
      </div>
      <div
        className="absolute"
        style={{
          left: MARGIN,
          top: w.top + wall.height,
          width: w.width,
          height: w.reach,
        }}
      >
        <WallSeam
          tiles={wall.bottom}
          width={w.width}
          ground="room"
          reach={w.reach}
        />
      </div>
      <div
        className="absolute"
        style={{
          left: MARGIN,
          right: MARGIN,
          top: w.top + wall.height + w.reach + 10,
        }}
      >
        <AlbumLine desk />
      </div>
    </div>
  );
}

/**
 * THE WHOLE PAGE ON A PHONE, drawn at 375 wide: the opener, the wall and its
 * Seam, a quiet section, the foot. Each section's top is set from the measured
 * height of the one above it.
 *
 * ★ THE OPENER CARRIES NO BUTTONS, as the desk's does not: the phone's nav
 * already holds "Start free", and the room they would take is the air the
 * wall, the quiet section and the foot need inside the phone slide.
 */
const PHONE = {
  /** The wall: 22 px under the opener's last line. */
  wall: 362,
  /** The Seam's reach under the wall's bottom row. */
  reach: 88,
  /**
   * The quiet section: 56 px under the event's line, so that at the foot's
   * scroll (the desk slide's phone) the line sits wholly under the status
   * bar rather than peeking out below it.
   */
  quiet: 976,
  /** The foot: 44 px under the last claim. */
  foot: 1354,
  /** The page's end: the foot's 301 px of words and a home indicator's 29. */
  page: 1684,
} as const;

function AlbumPhone() {
  const take = useTake();
  const t = useInk("room");
  const { WallSeam } = take.light;
  const wall = wallOf(PHONE_ROWS, 375, 4);
  const { reach } = PHONE;
  const top = PHONE.wall;
  return (
    <div
      className="absolute inset-x-0 top-0 overflow-hidden"
      style={{ height: PHONE.page, background: ROOM.room.hex, color: t.fg }}
    >
      <SiteNav ground="room" screen="phone" active="Features" />
      <div className="absolute" style={{ left: 20, right: 20, top: 134 }}>
        <Readout style={{ color: t.faint }}>The live album</Readout>
        <h1
          className="ag-title"
          aria-label={H1}
          style={{
            fontSize: 35,
            marginTop: 12,
            color: t.fg,
            textWrap: "balance",
          }}
        >
          {H1}
        </h1>
        <p
          className="ag-lede"
          style={{
            fontSize: 15.5,
            lineHeight: 1.5,
            color: t.muted,
            marginTop: 14,
            textWrap: "pretty",
          }}
        >
          {SUB}
        </p>
      </div>
      <div className="absolute inset-x-0" style={{ top, height: wall.height }}>
        <Wall tiles={wall.tiles} />
      </div>
      <div
        className="absolute inset-x-0"
        style={{ top: top + wall.height, height: reach }}
      >
        <WallSeam tiles={wall.bottom} width={375} ground="room" reach={reach} />
      </div>
      <div
        className="absolute"
        style={{ left: 20, right: 20, top: top + wall.height + reach + 4 }}
      >
        <AlbumLine desk={false} />
      </div>
      {/* A quiet section: no light, the room and its words. */}
      <div
        className="absolute"
        style={{ left: 20, right: 20, top: PHONE.quiet }}
      >
        <Readout style={{ color: t.faint }}>Full quality</Readout>
        <h2
          className="ag-title"
          style={{ fontSize: 27, marginTop: 10, textWrap: "balance" }}
        >
          Everything they shoot, at the size they shot it.
        </h2>
        <div className="flex flex-col" style={{ gap: 12, marginTop: 20 }}>
          {CLAIMS.map(([title, body]) => (
            <div key={title}>
              <p style={{ fontSize: 15, fontWeight: 600 }}>{title}</p>
              <p
                className="ag-body"
                style={{ fontSize: 14, color: t.muted, marginTop: 2 }}
              >
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
      <SiteFooter
        page="room"
        screen="phone"
        source={{ photos: ALBUM }}
        height={PHONE.page - PHONE.foot}
        style={{ top: PHONE.foot }}
      />
    </div>
  );
}

const LABEL = "The Seam, in place";

export function DarkPageSlide({ screen }: SlideProps) {
  const take = useTake();
  const note = take.words.notes.darkPage;
  if (screen === "375")
    return (
      <SlideRoot screen={screen} ground="room">
        <PhoneStage
          ground="room"
          pageH={PHONE.page}
          page={<AlbumPhone />}
          label={LABEL}
          note={note}
        />
      </SlideRoot>
    );
  return (
    <SlideRoot
      screen={screen}
      ground="room"
      style={{ background: deskOf(take, "room") }}
    >
      <DeskStage
        ground="room"
        url="partyreel.com/features/album"
        page={<AlbumDesk />}
        phone={<AlbumPhone />}
        phonePage={PHONE.page}
        phoneScroll={PHONE.page - 812}
        phoneCaption="A scroll later: its foot, 375 wide"
        label={LABEL}
        note={note}
      />
    </SlideRoot>
  );
}
