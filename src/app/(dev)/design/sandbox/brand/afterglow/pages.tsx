"use client";

import type { SlideProps } from "../deck/contract";
import { HEAD } from "../deck/deck";
import type { PhotoId } from "../deck/media";
import { Wordmark } from "./marks";
import { ink, SlideRoot } from "./root";
import {
  Bloom,
  type Ground,
  GROUND,
  HOUSE,
  INK,
  lightOfPhoto,
  lightOfPhotos,
  LitPhoto,
  Readout,
  Seam,
} from "./system";

/**
 * 08 DARK AND LIGHT: each page wholly one ground, chosen by its job, never by
 * the hour. Where photographs play, the room; where people read and decide,
 * paper. Inside a page the rhythm is the light at its own edges and the
 * media's own sections, never a cut to another ground; the footer is the
 * page's own ground with a seam at its top.
 */

type Page = { name: string; ground: Ground; photo?: PhotoId; why: string };

const PAGES: readonly Page[] = [
  {
    name: "Home",
    ground: "room",
    photo: "party-balloons",
    why: "The reel plays",
  },
  {
    name: "Features",
    ground: "room",
    photo: "reception-table",
    why: "Albums play",
  },
  {
    name: "Events",
    ground: "room",
    photo: "wedding-petals",
    why: "Every event's photos",
  },
  {
    name: "Reel",
    ground: "room",
    photo: "festival-lights",
    why: "The reel itself",
  },
  { name: "Pricing", ground: "paper", why: "Deciding" },
  { name: "Help", ground: "paper", why: "Reading" },
  {
    name: "About",
    ground: "paper",
    photo: "wedding-toast",
    why: "A story, read",
  },
  { name: "Blog", ground: "paper", photo: "wedding-rings", why: "Reading" },
  { name: "Legal", ground: "paper", why: "Reading" },
];

function Bars({
  n,
  w,
  ground,
  gap = 4,
}: {
  n: number;
  w: number[];
  ground: Ground;
  gap?: number;
}) {
  const c =
    ground === "room" ? "rgb(255 255 255 / 0.16)" : "rgb(20 20 22 / 0.13)";
  return (
    <div className="flex flex-col" style={{ gap }}>
      {Array.from({ length: n }, (_, i) => (
        <span
          key={i}
          style={{
            width: `${w[i % w.length]}%`,
            height: 3,
            borderRadius: 2,
            background: c,
          }}
        />
      ))}
    </div>
  );
}

/** A page in miniature: its ground, its opener, its quiet sections and its foot. */
function MiniPage({ p, w, h }: { p: Page; w: number; h: number }) {
  const room = p.ground === "room";
  const ink2 = INK[p.ground];
  const light = p.photo ? lightOfPhoto(p.photo) : HOUSE;
  const pad = Math.round(w * 0.08);
  const head = Math.round(h * 0.075);
  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: w,
        height: h,
        background: GROUND[p.ground].hex,
        borderRadius: 5,
        boxShadow: room
          ? "inset 0 0 0 1px rgb(255 255 255 / 0.08)"
          : "inset 0 0 0 1px rgb(20 20 22 / 0.1)",
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ height: head, padding: `0 ${pad}px` }}
      >
        <Wordmark height={Math.round(w * 0.052)} color={ink2.fg.hex} />
        <span className="flex" style={{ gap: 3 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 2,
                borderRadius: 1,
                background: ink2.faint.hex,
              }}
            />
          ))}
        </span>
      </div>
      <div style={{ padding: `${Math.round(h * 0.03)}px ${pad}px 0` }}>
        {room && p.photo ? (
          <>
            <div style={{ height: Math.round(h * 0.2) }}>
              <Bloom
                light={light}
                ground="room"
                blur={Math.round(w * 0.08)}
                ignite={false}
                style={{ height: "100%" }}
              >
                <LitPhoto id={p.photo} className="size-full" />
              </Bloom>
            </div>
            <div style={{ marginTop: Math.round(h * 0.05) }}>
              <Bars n={2} w={[80, 56]} ground="room" />
            </div>
          </>
        ) : (
          <>
            <Bars n={2} w={[86, 60]} ground={p.ground} gap={5} />
            <div style={{ marginTop: 8 }}>
              <Bars n={3} w={[92, 88, 70]} ground={p.ground} gap={3} />
            </div>
            {p.photo ? (
              <LitPhoto
                id={p.photo}
                ground="paper"
                style={{
                  width: "100%",
                  height: Math.round(h * 0.15),
                  marginTop: 10,
                }}
              />
            ) : null}
          </>
        )}
        <div style={{ marginTop: Math.round(h * 0.06) }}>
          <Bars n={4} w={[94, 90, 76, 84]} ground={p.ground} gap={3} />
        </div>
      </div>
      {/* The foot: the page's own ground, its top edge lit. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{ height: Math.round(h * 0.2) }}
      >
        <Seam
          light={light}
          ground={p.ground}
          reach={Math.round(h * (room ? 0.12 : 0.06))}
          drift={false}
        />
        <div style={{ padding: `${Math.round(h * 0.07)}px ${pad}px 0` }}>
          <Bars n={2} w={[40, 60]} ground={p.ground} gap={3} />
        </div>
      </div>
    </div>
  );
}

/** The rhythm inside one page: its sections as bands, each named. */
type Band = "lit" | "quiet" | "media" | "foot";

function Rhythm({
  ground,
  w,
  title,
  rows,
}: {
  ground: Ground;
  w: number;
  title: string;
  rows: readonly (readonly [string, Band])[];
}) {
  const room = ground === "room";
  const t = ink(ground);
  const bw = Math.round(w * 0.36);
  const bh = 34;
  const photos: PhotoId[] = [
    "wedding-toast",
    "party-balloons",
    "reception-table",
    "wedding-rings",
  ];
  return (
    <div
      style={{
        width: w,
        background: GROUND[ground].hex,
        borderRadius: 8,
        padding: 18,
        color: t.fg,
        boxShadow: room ? undefined : "inset 0 0 0 1px rgb(20 20 22 / 0.08)",
      }}
    >
      <Readout style={{ color: t.faint }}>{title}</Readout>
      <div className="flex flex-col" style={{ gap: 6, marginTop: 12 }}>
        {rows.map(([label, kind]) => (
          <div key={label} className="flex items-center" style={{ gap: 16 }}>
            <div
              className="relative shrink-0 overflow-hidden"
              style={{
                width: bw,
                height: bh,
                borderRadius: 3,
                background: room ? GROUND.roomCard.hex : GROUND.paperCard.hex,
              }}
            >
              {kind === "lit" ? (
                <div
                  className="absolute"
                  style={{ left: "30%", right: "30%", top: 8, bottom: 8 }}
                >
                  <Bloom
                    light={room ? lightOfPhoto("festival-lights") : HOUSE}
                    ground={ground}
                    blur={8}
                    ignite={false}
                    style={{ height: "100%" }}
                  >
                    <div
                      className="size-full"
                      style={{
                        background: room ? "#0b0b0d" : GROUND.paperCard.hex,
                        borderRadius: 2,
                        boxShadow: "inset 0 0 0 1px rgb(127 127 127 / 0.25)",
                      }}
                    />
                  </Bloom>
                </div>
              ) : kind === "media" ? (
                <div
                  className="absolute inset-0 flex"
                  style={{ gap: 2, padding: 4 }}
                >
                  {photos.map((id) => (
                    <LitPhoto
                      key={id}
                      id={id}
                      ground={ground}
                      style={{ flex: 1, height: "100%" }}
                    />
                  ))}
                </div>
              ) : kind === "foot" ? (
                <Seam
                  light={room ? lightOfPhotos(photos) : HOUSE}
                  ground={ground}
                  reach={18}
                  drift={false}
                />
              ) : (
                <div
                  className="absolute"
                  style={{ left: 10, top: 11, width: "70%" }}
                >
                  <Bars n={2} w={[90, 60]} ground={ground} gap={5} />
                </div>
              )}
            </div>
            <p
              className="ag-caption"
              style={{
                color: kind === "quiet" ? t.muted : t.fg,
                fontWeight: kind === "quiet" ? 400 : 600,
              }}
            >
              {label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

const HOME_RHYTHM = [
  ["Opener, lit: the reel and its Bloom", "lit"],
  ["How it works: quiet", "quiet"],
  ["The live album: the media is the colour", "media"],
  ["Curation and privacy: quiet", "quiet"],
  ["The foot: the room, its Seam", "foot"],
] as const;

const PRICING_RHYTHM = [
  ["Opener: the plans", "quiet"],
  ["The Pro card, lit: its Bloom", "lit"],
  ["Every plan, compared: quiet", "quiet"],
  ["Questions: quiet", "quiet"],
  ["The foot: paper, its Seam", "foot"],
] as const;

export function PagesSlide({ screen }: SlideProps) {
  const t = ink("paper");
  if (screen === "375") {
    const mw = 98;
    const mh = 150;
    return (
      <SlideRoot screen={screen} ground="paper">
        <div
          className="absolute inset-x-0 px-5"
          style={{ top: HEAD[screen] + 26 }}
        >
          <Readout style={{ color: t.faint }}>Dark and light</Readout>
          <h2 className="ag-title mt-3" style={{ fontSize: 30 }}>
            Where photographs play, the room. Where people read and decide,
            paper.
          </h2>
          <p className="ag-body mt-3" style={{ color: t.muted, fontSize: 14 }}>
            Each page is wholly one ground, by its job, never by the hour.
          </p>
          <div
            className="mt-7 grid grid-cols-3"
            style={{ columnGap: 16, rowGap: 18 }}
          >
            {PAGES.map((p) => (
              <div key={p.name}>
                <MiniPage p={p} w={mw} h={mh} />
                <p
                  className="ag-caption"
                  style={{ marginTop: 7, fontWeight: 600 }}
                >
                  {p.name}
                </p>
                <p className="ag-caption" style={{ color: t.faint }}>
                  {p.ground === "room" ? "Room" : "Paper"}:{" "}
                  {p.why.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-col" style={{ gap: 12 }}>
            <Rhythm
              ground="room"
              w={335}
              title="Inside the home"
              rows={HOME_RHYTHM}
            />
            <Rhythm
              ground="paper"
              w={335}
              title="Inside pricing"
              rows={PRICING_RHYTHM}
            />
          </div>
          <p className="ag-caption mt-6" style={{ color: t.muted }}>
            A garden wedding at noon and a floor at 2 am share every page. The
            app follows the host&apos;s theme; the album&apos;s well is always
            the room.
          </p>
        </div>
      </SlideRoot>
    );
  }
  const mw = 128;
  const mh = 214;
  return (
    <SlideRoot screen={screen} ground="paper">
      <div
        className="absolute flex items-end justify-between"
        style={{ left: 64, right: 64, top: 92 }}
      >
        <div>
          <Readout style={{ color: t.faint }}>Dark and light</Readout>
          <h2
            className="ag-title"
            style={{ fontSize: 38, marginTop: 12, maxWidth: 760 }}
          >
            Where photographs play, the room. Where people read and decide,
            paper.
          </h2>
        </div>
        <p
          className="ag-body"
          style={{
            color: t.muted,
            fontSize: 15,
            maxWidth: 420,
            paddingBottom: 4,
          }}
        >
          Each page is wholly one ground, by its job, never by the hour: a
          garden wedding at noon and a floor at 2 am share every page.
        </p>
      </div>
      <div className="absolute flex" style={{ left: 64, top: 236, gap: 20 }}>
        {PAGES.map((p) => (
          <div key={p.name} style={{ width: mw }}>
            <MiniPage p={p} w={mw} h={mh} />
            <p className="ag-caption" style={{ marginTop: 9, fontWeight: 600 }}>
              {p.name}
            </p>
            <p className="ag-caption" style={{ color: t.faint }}>
              {p.ground === "room" ? "Room" : "Paper"}: {p.why.toLowerCase()}
            </p>
          </div>
        ))}
      </div>
      <div className="absolute flex" style={{ left: 64, top: 556, gap: 24 }}>
        <Rhythm
          ground="room"
          w={498}
          title="Inside the home: the room"
          rows={HOME_RHYTHM}
        />
        <Rhythm
          ground="paper"
          w={498}
          title="Inside pricing: paper"
          rows={PRICING_RHYTHM}
        />
      </div>
      <div className="absolute" style={{ left: 1108, top: 566, width: 268 }}>
        <p className="ag-body" style={{ fontSize: 14, color: t.muted }}>
          <span style={{ color: t.fg, fontWeight: 600 }}>
            The rhythm is light, never a cut.
          </span>{" "}
          A page opens lit, ramps down through quiet sections, lets its media be
          the colour, and ends on its own ground with a seam at the foot. No
          black chapters on paper, no paper chapters in the room, no ink slab
          for a footer.
        </p>
        <p className="ag-caption" style={{ color: t.faint, marginTop: 14 }}>
          The app follows the host&apos;s own theme; the album&apos;s well is
          always the room.
        </p>
      </div>
    </SlideRoot>
  );
}
