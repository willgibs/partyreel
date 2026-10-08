"use client";

import "./sky.css";

import {
  ImageUp,
  ListChecks,
  PencilLine,
  QrCode,
  Settings,
  Users,
} from "lucide-react";
import { type CSSProperties, type ReactNode, useMemo } from "react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { fitChroma } from "@/lib/avatar/gradient";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { useAlbum } from "./album";
import {
  Cover,
  DayFace,
  DoorOver,
  Offer,
  Poster,
  PremiereActs,
  PremiereWords,
  TileBox,
} from "./common";
import {
  INTENSITY,
  type Lamp,
  type Light,
  type Moment,
  NIGHT,
  type OtherEvent,
  PRIVATE_LINK,
  SAMPLED,
  type StillId,
} from "./fixtures";
import type { GuestPageProps, HostPageProps, Kit, PageProps } from "./kit";
import type { Ground, Side } from "./knobs";
import { linkLight, seedLight } from "./light";
import {
  AddButton,
  Byline,
  Code,
  Faces,
  Guestbook,
  Name,
  Note,
  Ring,
  Round,
  SoftAct,
  Status,
  Tally,
  WatchButton,
} from "./parts";
import { GuestShell, HostShell } from "./shell";

/**
 * SKY: THE ALBUM'S LIGHT OVER THE PAGE (Will's favourite, take two: the glow
 * born at the page's top). The head has no photograph: the album's own light,
 * read from its photographs, lies across the top of the page edge to edge
 * like a sky at dusk and falls into the room before the album begins, so the
 * bar stands on it and nothing cuts the head (his "option 3's edge-to-edge
 * visual ... allows the UI to take center stage").
 *
 *  - The sky is bands, never pools, each the full width, added the way light
 *    adds, so it has no point of focus. Its top edge is the album's heaviest
 *    colour as a pale light (the wedding's gold as champagne, the rooftop's
 *    violet as lavender), and the album's cool lights carry the fall below it
 *    (rose, then violet), so it reads as this album's light and never dims a
 *    warm colour into brown.
 *  - The head is a title page, centred: the name, the host and the day with
 *    the faces and their count, her note as its epigraph and the guestbook's
 *    door as its answer, and the acts in the dock's own order (Invite, Add,
 *    the reel), so when they dock at the foot nothing changes place.
 *  - Hers is the guest's head with her tools in one place: a quiet row of her
 *    rooms under her acts, each with its word and its count, and what needs
 *    her (Review's 8 waiting) is the row's one white press while Add steps
 *    back to glass; Wednesday's offer is likewise her only white press. The
 *    bar is the app's alone.
 *  - Before the first photo the sky is the party's seed, continuing the light
 *    Create's close lit her code in; at her arrival (desk or phone) the code
 *    Create flies over lands on her title page above Invite, and once a guest
 *    has opened it the code rests behind Invite.
 *  - After her close the reel leads; the one moment is the reel's poster at
 *    the centre of the sky at its fullest. The card is the title page in
 *    small: its light and one mark (an open album's name, set as large as it
 *    fits in up to three lines; a Private album's, the house's wordmark over
 *    its link's light). A party's tile is its seed's sky over its day.
 *  - No day dividers (one gallery, X10) and no mail (X11) are drawn.
 */

/* ── the sky's lights ───────────────────────────────────────────────────── */

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/** A photograph's light chroma: its own intensity, lifted, inside the room's range (light.tsx's, retyped). */
const chromaOf = (id: StillId) =>
  Math.min(0.15, Math.max(0.07, INTENSITY[id] * 1.15));

/**
 * A SKY'S LIGHTS: every hue the album's photographs give off, weighted by its
 * share and its photograph's intensity (`albumVotes`' reading), the three
 * heaviest kept. ★ ITS FAMILIES ARE WIDER THAN THE RING'S: a sky's band is a
 * hue family, so hues within 40° are one light (the Ring's key splits them at
 * 24°); read the narrow way, the wedding's gold splits into gold and a mustard
 * that edges its rose out, and the cover's six alone read the arch's green as
 * the third light, which dimmed is olive, never light.
 */
function skyVotes(ids: readonly StillId[]): Light {
  const votes: { h: number; w: number; c: number }[] = [];
  for (const id of ids)
    for (const lamp of SAMPLED[id]) {
      const w = lamp.w * INTENSITY[id];
      const near = votes.find((v) => hueGap(v.h, lamp.h) < 40);
      if (near) {
        const d = ((lamp.h - near.h + 540) % 360) - 180;
        near.h = (near.h + d * (w / (near.w + w)) + 360) % 360;
        near.w += w;
        near.c = Math.max(near.c, chromaOf(id));
      } else votes.push({ h: lamp.h, w, c: chromaOf(id) });
    }
  const top = votes.sort((a, b) => b.w - a.w).slice(0, 3);
  const sum = top.reduce((n, v) => n + v.w, 0) || 1;
  return top.map((v) => ({ h: v.h, w: v.w / sum, c: v.c }));
}

/**
 * THE ALBUM'S SKY, read off every photograph the frame's album holds (this
 * head has no cover, so its light is the whole album's), memoized per album:
 * the wedding's gold, violet and rose; the rooftop's violet, gold and rose.
 */
function useSky(): Light {
  const album = useAlbum();
  return useMemo(() => skyVotes(album.stills.map((s) => s.id)), [album]);
}

/** The light before the first photograph (the party's seed), or the album's once it has some. */
function useLightOf(moment: Moment): Light {
  const album = useAlbum();
  const sky = useSky();
  const empty = moment.album === 0;
  return useMemo(
    () => (empty ? seedLight(album.seed) : sky),
    [empty, album.seed, sky],
  );
}

/* ── the sky, drawn ─────────────────────────────────────────────────────── */

/**
 * GOLD, AMBER AND ORANGE NEVER FALL: a warm light spent over the room's black
 * passes through brown long before it reaches nothing (the board's guard), so
 * a warm light is drawn bright and pale, where it is born; a rose, a violet or
 * a blue still reads as light when it is dim, so those carry the fall.
 */
const golden = (h: number) => h >= 25 && h <= 110;

/** How warm a light is: the fall's rose (the warmest cool light) before its deepest. */
const warmth = (l: Lamp) =>
  Math.cos((hueGap(l.h, 60) * Math.PI) / 180) + (l.dl ?? 0) * 4;

/** A hue `t` of the way from `a` to `b`, the short way round. */
const towards = (a: number, b: number, t: number) => {
  const d = ((b - a + 540) % 360) - 180;
  return (a + d * t + 360) % 360;
};

const r1 = (n: number) => Math.round(n * 10) / 10;
const r3 = (n: number) => Math.round(n * 1000) / 1000;

/** One stop of the sky: where (percent of its height), its colour (OKLCH) and how much of it. */
type Stop = { at: number; l: number; c: number; h: number; a: number };

/**
 * THE SKY'S STOPS, A DUSK OF THIS ALBUM'S OWN: the album's heaviest light at
 * the top edge, pale where it is born (champagne for the wedding's gold,
 * lavender for the rooftop's violet), its own colour as it spreads, then the
 * album's rose, then its deepest light, then night, spent by the byline so no
 * muted word stands in it. The colours are interpolated in OKLCH the short
 * way round, so a gold top reaches its rose through coral, never through a
 * grey or a brown. A warm key with no cool light beside it falls to a wine,
 * as the house ember's coral does; one hue at three depths (a seed's) falls
 * into its own deeper shade, at a little over half the strength, or it reads
 * as paint.
 */
function skyStops(light: Light): Stop[] {
  const lamps = [...light].slice(0, 3).sort((a, b) => b.w - a.w);
  const key = lamps[0]!;
  const warm = golden(key.h);
  if (lamps.every((l) => hueGap(l.h, key.h) < 30)) {
    const h = key.h;
    if (warm)
      // A warm seed (a gold, an amber) is pale where it is born and falls as the house ember does, through coral and
      // rose to a wine: dimmed in its own hue it would be brown.
      return [
        { at: 0, l: 0.92, c: 0.07, h: h + 8, a: 0.56 },
        { at: 10, l: 0.84, c: 0.1, h, a: 0.44 },
        { at: 22, l: 0.72, c: 0.12, h: 28, a: 0.3 },
        { at: 36, l: 0.6, c: 0.13, h: 5, a: 0.18 },
        { at: 52, l: 0.5, c: 0.12, h: 350, a: 0.08 },
        { at: 72, l: 0.44, c: 0.1, h: 345, a: 0.02 },
        { at: 88, l: 0.4, c: 0.1, h: 345, a: 0 },
      ];
    // A cool seed: its lighter depth at the edge, its deeper as it falls.
    const fall = (h + 348) % 360;
    return [
      { at: 0, l: 0.9, c: 0.07, h, a: 0.5 },
      { at: 10, l: 0.8, c: 0.1, h, a: 0.4 },
      { at: 24, l: 0.68, c: 0.12, h: towards(h, fall, 0.5), a: 0.27 },
      { at: 42, l: 0.56, c: 0.12, h: fall, a: 0.14 },
      { at: 62, l: 0.48, c: 0.11, h: fall, a: 0.05 },
      { at: 80, l: 0.42, c: 0.1, h: fall, a: 0.015 },
      { at: 92, l: 0.4, c: 0.1, h: fall, a: 0 },
    ];
  }
  const cool = lamps
    .slice(1)
    .filter((l) => !golden(l.h))
    .sort((a, b) => warmth(b) - warmth(a));
  // The album's rose (its warmest cool light), and its deepest: the other cool light, or the key's own deeper shade.
  const rose = cool[0]?.h ?? 350;
  const deep = warm ? (cool[1]?.h ?? cool[0]?.h ?? 330) : key.h;
  const top = warm ? key.h + 10 : key.h + 6;
  return [
    { at: 0, l: 0.93, c: warm ? 0.09 : 0.07, h: top, a: 0.82 },
    { at: 8, l: 0.85, c: warm ? 0.11 : 0.1, h: key.h, a: 0.64 },
    {
      at: 18,
      l: 0.74,
      c: 0.12,
      h: towards(key.h, rose, warm ? 0.3 : 0.5),
      a: 0.5,
    },
    { at: 30, l: 0.62, c: 0.14, h: rose, a: 0.35 },
    { at: 44, l: 0.54, c: 0.14, h: towards(rose, deep, 0.5), a: 0.21 },
    { at: 62, l: 0.46, c: 0.13, h: deep, a: 0.085 },
    { at: 80, l: 0.4, c: 0.11, h: deep, a: 0.022 },
    { at: 92, l: 0.36, c: 0.1, h: deep, a: 0 },
  ];
}

/** The sky's one layer: its stops at a reach and a strength, each colour fitted into the display's gamut. */
function skyLayer(light: Light, reach: number, strength: number) {
  const stops = skyStops(light).map((s) => {
    const fit = fitChroma({ l: s.l, c: s.c, h: s.h });
    const a = Math.min(0.92, s.a * strength);
    return `oklch(${s.l} ${r3(fit.c)} ${Math.round(s.h)} / ${r3(a)}) ${r1(Math.min(96, s.at * reach))}%`;
  });
  return `linear-gradient(in oklch to bottom, ${stops.join(", ")})`;
}

type Vars = CSSProperties & Record<`--${string}`, string | number>;

/**
 * THE SKY, drawn absolutely in a `relative` box (its box is the sky's height:
 * the room on the page, a card, a tile), under the words. `reach` scales how
 * far into the box it falls, `strength` how bright; it is spent before the
 * box's foot, so no edge ever cuts it.
 */
function Sky({
  light,
  reach = 1,
  strength = 1,
  grain = true,
}: {
  light: Light;
  reach?: number;
  strength?: number;
  grain?: boolean;
}) {
  const vars: Vars = {
    background: skyLayer(light, reach, strength),
    "--ep-sky-end": `${r1(Math.min(96, 92 * reach))}%`,
  };
  return (
    <span aria-hidden data-ep-glow="sky" className="ep-sky-field" style={vars}>
      {grain ? <span className="ep-sky-grain" /> : null}
    </span>
  );
}

/** The page's sky: the frame's album's light, or its seed's before the first photo. */
function PageSky({ moment }: { moment: Moment }) {
  return <Sky light={useLightOf(moment)} />;
}

/* ── the guest's page ───────────────────────────────────────────────────── */

/**
 * THE ROOM'S FOOT: before the first photo the room has no album head under
 * the acts, so in the room it keeps that height as air and the sky falls as
 * far as it does over a party (the sky is drawn in the room's height, never
 * past it). On paper the room is a dark band ending above the album's head,
 * so it keeps room under its last white press for that press's own shadow
 * (`shadow-layer` reaches about 46 px), or the shadow spills onto the paper
 * as a grey smudge under the band.
 */
const roomOf = (moment: Moment, ground: Ground, desk: boolean) =>
  cn(
    "ep-sky-room",
    ground === "paper"
      ? moment.album === 0
        ? "pb-3"
        : "pb-6"
      : moment.album === 0
        ? "pb-12"
        : desk && "pb-2",
  );

/**
 * THE GUESTBOOK'S DOOR, THE EPIGRAPH'S ANSWER (X12, under the surface): her
 * note says what the album is for, and one quiet line under it is how a guest
 * answers her (a note, a voice memo, a video; open after her close too, since
 * notes come days after the photos stop), or, on her side, how many have.
 * Tight to the note, so the two read as one group; never a hero.
 */
function Answer({ side }: { side: "guest" | "host" }) {
  return <Guestbook side={side} form="line" className="mt-2.5" />;
}

/** A hairline between two groups on one line. */
function Rule() {
  return <span aria-hidden className="h-4 w-px shrink-0 bg-foreground/15" />;
}

/** The acts in the dock's own order: Invite, the Add (the reel once kept), the reel (Take them home once kept). */
function GuestActs({ moment }: { moment: Moment }) {
  if (!moment.open)
    return (
      <>
        <Round act="invite" />
        <WatchButton />
        <Round act="home" />
      </>
    );
  return (
    <>
      <Round act="invite" />
      <AddButton
        label={moment.album === 0 ? "Add the first photo" : "Add photos"}
      />
      {moment.album > 1 ? <Round act="reel" /> : null}
    </>
  );
}

/**
 * THE TITLE PAGE: the name; who hosts it and when, with the faces (one line
 * at a desk, where the width allows it, two at a phone); her note as its
 * epigraph, balanced, with the guestbook's door as its answer; the acts. Four
 * groups, each with room round it.
 */
function GuestPage({
  screen,
  ground,
  moment,
  scroll,
  beat,
  count,
}: GuestPageProps) {
  const desk = screen === "1440";
  const head = (
    <div
      className={cn(
        "flex flex-col items-center px-5 text-center",
        desk ? "pt-12" : "pt-9",
      )}
    >
      <Name className={cn("text-title", desk && "max-w-4xl")} />
      {desk ? (
        <div className="mt-5 flex items-center justify-center gap-x-5">
          <Byline />
          {moment.guests > 0 ? (
            <>
              <Rule />
              <Faces moment={moment} size={30} />
            </>
          ) : null}
        </div>
      ) : (
        <>
          <Byline className="mt-3.5 justify-center" />
          <Faces moment={moment} align="center" className="mt-4" />
        </>
      )}
      <Note
        className={cn(
          "mx-auto mt-4 text-center text-balance",
          desk ? "max-w-2xl" : "max-w-[20rem]",
        )}
      />
      <Answer side="guest" />
      <div
        className={cn(
          "flex items-center justify-center gap-2",
          desk ? "mt-7" : "mt-6",
        )}
      >
        <GuestActs moment={moment} />
      </div>
    </div>
  );
  return (
    <GuestShell
      screen={screen}
      ground={ground}
      moment={moment}
      head={head}
      glow={<PageSky moment={moment} />}
      scroll={scroll}
      beat={beat}
      count={count}
      roomClass={roomOf(moment, ground, desk)}
    />
  );
}

/* ── her page: the guest's head, her tools in one quiet row ─────────────── */

/** The day as her phone's line says it: short, so the line stays one line whatever her status says. */
const shortDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** Her line under the name, one quiet line: the day, her status, and the views (her code's own count). */
function HostLine({
  moment,
  desk,
  className,
}: {
  moment: Moment;
  desk: boolean;
  className?: string;
}) {
  const album = useAlbum();
  return (
    <div
      data-ep-host-line=""
      className={cn(
        "flex items-center justify-center gap-x-3 text-sm whitespace-nowrap text-muted-foreground",
        className,
      )}
    >
      {desk ? (
        <Byline host={false} />
      ) : album.date ? (
        <span>{shortDay(album.date)}</span>
      ) : null}
      <Status moment={moment} />
      {moment.views > 0 ? (
        <span className="tabular-nums">{formatCount(moment.views)} views</span>
      ) : null}
    </div>
  );
}

type RoomKey = "review" | "guests" | "settings";

const ROOMS: readonly {
  id: RoomKey;
  word: string;
  icon: ReactNode;
  count: (m: Moment) => number;
}[] = [
  {
    id: "review",
    word: "Review",
    icon: <ListChecks />,
    count: (m) => m.review,
  },
  { id: "guests", word: "Guests", icon: <Users />, count: (m) => m.door },
  { id: "settings", word: "Settings", icon: <Settings />, count: () => 0 },
];

/** What waits on her now, if anything: Review's uploads first, then the people at her door. */
const needsHer = (moment: Moment): RoomKey | null =>
  moment.review > 0 ? "review" : moment.door > 0 ? "guests" : null;

/**
 * HER ROOMS, ONE QUIET ROW UNDER HER ACTS (her tools' one place; the bar is
 * the app's alone): each a press into its room with its word, in the muted
 * ink with no ground of its own. What waits on her is the row's one white
 * press, its count on it ("Review 8"), the head's one white press; another
 * room that waits keeps the tally's hard red on its shoulder. The guests' own
 * count is the faces row's, never said again here.
 */
function HerRooms({
  moment,
  className,
}: {
  moment: Moment;
  className?: string;
}) {
  const lead = needsHer(moment);
  return (
    <nav
      aria-label="This event"
      data-ep-rooms="sky"
      className={cn(
        "flex flex-wrap items-center justify-center gap-1",
        className,
      )}
    >
      {ROOMS.map((r) => {
        const n = r.count(moment);
        const leads = r.id === lead;
        return (
          <Button
            key={r.id}
            type="button"
            variant={leads ? "on-photo" : "ghost"}
            size="sm"
            tabIndex={-1}
            data-ep-room={r.id}
            data-ep-needs={leads ? "" : undefined}
            className={cn("gap-1.5", !leads && "text-muted-foreground")}
          >
            {r.icon}
            {r.word}
            {n ? (
              leads ? (
                <span className="font-semibold tabular-nums">{n}</span>
              ) : (
                <Tally n={n} />
              )
            ) : null}
          </Button>
        );
      })}
    </nav>
  );
}

/**
 * HER ACTS, the guest's in the dock's order: before the first photo Invite
 * leads (white, the code's own glyph) with Add photos beside it; at the party
 * Invite, Add, the reel, Add white only while nothing waits on her (a room
 * that needs her, or Wednesday's offer, holds the one white press, and Add
 * steps back to glass); once kept, Share and the reel.
 */
function HostActs({ moment, yields }: { moment: Moment; yields: boolean }) {
  if (!moment.open)
    return (
      <>
        <Round act="invite" label="Share the album" />
        <WatchButton />
      </>
    );
  if (moment.album === 0)
    return (
      <>
        <Button
          type="button"
          variant={yields ? "glass" : "on-photo"}
          size="cta"
          tabIndex={-1}
          data-ep-act="invite"
        >
          <QrCode /> Invite guests
        </Button>
        <SoftAct>Add photos</SoftAct>
      </>
    );
  return (
    <>
      <Round act="invite" />
      {yields ? (
        <SoftAct icon={<ImageUp />}>Add photos</SoftAct>
      ) : (
        <AddButton />
      )}
      <Round act="reel" />
    </>
  );
}

/**
 * WHERE CREATE'S CODE LANDS: her code stands on her title page while nobody
 * has opened it yet (her arrival from Create, at a desk or a phone, Ready for
 * guests on her line), the one time it leads, right above Invite guests, so
 * the code and its door read as one. It is production's own code door
 * (`Code`), which carries the morph's name, so "Go to your event" flies
 * Create's code straight down the centre into a code of the same face (never
 * into a glyph) while the room cross-fades into the same seed's sky. Once a
 * guest has opened it, the code rests behind Invite (the round's own glyph).
 */
const codeLeads = (moment: Moment) =>
  moment.open && moment.album === 0 && moment.views === 0;

/**
 * HER PAGE: the guest's title page with her line in the byline's place and
 * her rooms under her acts. Her arrival from Create is the checklist made part
 * of the event: Ready for guests on her line, the welcome note offered where
 * the note will stand, her code landing above Invite, Add photos beside it;
 * no line stands in for the faces before anyone has added (the empty album
 * already says where her guests' photos land). Her side of the guestbook
 * answers her note as the guest's does. Wednesday's offer stands apart at the
 * head's foot, a quiet notice holding her one white press.
 */
function HostPage({ screen, ground, moment, arrival, offer }: HostPageProps) {
  const desk = screen === "1440";
  const yields = Boolean(offer) || needsHer(moment) !== null;
  const head = (
    <div
      className={cn(
        "flex flex-col items-center px-5 text-center",
        desk ? "pt-12" : "pt-9",
      )}
    >
      <Name className={cn("text-title", desk && "max-w-4xl")} />
      {desk && moment.guests > 0 ? (
        <div className="mt-5 flex items-center justify-center gap-x-5">
          <HostLine moment={moment} desk />
          <Rule />
          <Faces moment={moment} size={30} />
        </div>
      ) : (
        <>
          <HostLine moment={moment} desk={desk} className="mt-3.5" />
          <Faces moment={moment} align="center" className="mt-4" />
        </>
      )}
      {arrival ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          tabIndex={-1}
          className="mt-3 text-muted-foreground"
        >
          <PencilLine /> Add a welcome note
        </Button>
      ) : (
        <>
          <Note
            className={cn(
              "mx-auto mt-4 text-center text-balance",
              desk ? "max-w-2xl" : "max-w-[20rem]",
            )}
          />
          {moment.guests > 0 ? <Answer side="host" /> : null}
        </>
      )}
      {codeLeads(moment) ? <Code moment={moment} className="mt-7" /> : null}
      <div
        className={cn(
          "flex items-center justify-center gap-2",
          codeLeads(moment) ? "mt-4" : desk ? "mt-7" : "mt-6",
        )}
      >
        <HostActs moment={moment} yields={yields} />
      </div>
      <HerRooms moment={moment} className="mt-3" />
      {offer ? (
        <div className="ep-sky-notice mt-5">
          <Offer className="justify-center text-center" />
        </div>
      ) : null}
    </div>
  );
  return (
    <HostShell
      screen={screen}
      ground={ground}
      moment={moment}
      head={head}
      glow={<PageSky moment={moment} />}
      roomClass={roomOf(moment, ground, desk)}
    />
  );
}

/* ── the one moment ─────────────────────────────────────────────────────── */

/**
 * THE MOMENT, WITH A CENTRE: the album's sky at its fullest across the whole
 * screen and, at its centre, the reel's poster (its opening photograph and
 * its play mark), the thing the eye lands on; the words over it lead with the
 * reward, the acts under it. Then the page as before.
 */
function Premiere({
  screen,
  ground,
  moment,
  side,
}: PageProps & { side: Side }) {
  const desk = screen === "1440";
  const album = useAlbum();
  const sky = useSky();
  return (
    <div
      data-ep-premiere="sky"
      className={cn(
        "ep-sky-lit relative isolate flex h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-foreground",
        ground === "paper" && "dark",
      )}
    >
      <Sky light={sky} reach={1.25} strength={1.1} />
      <div
        className={cn(
          "relative z-10 flex w-full flex-col items-center",
          desk ? "gap-7" : "gap-6",
        )}
      >
        <PremiereWords side={side} moment={moment} className="max-w-xl" />
        <Poster
          still={album.cover[0]!}
          className={
            desk ? "h-[300px] w-[534px]" : "aspect-video w-full max-w-[20rem]"
          }
        />
        <PremiereActs side={side} />
      </div>
    </div>
  );
}

/* ── its reach ──────────────────────────────────────────────────────────── */

/** The ways to set a name's words in `n` lines: every split, each line's words kept together. */
function splits(words: readonly string[], n: number): string[][] {
  if (n === 1) return [[words.join(" ")]];
  const out: string[][] = [];
  for (let i = 1; i <= words.length - n + 1; i++)
    for (const rest of splits(words.slice(i), n - 1))
      out.push([words.slice(0, i).join(" "), ...rest]);
  return out;
}

/**
 * THE NAME AS LARGE AS THE CARD ALLOWS, in one to three balanced lines:
 * Urbanist at the heading's weight, tracked tight, runs about half an em a
 * character, so a line of the card's 1,040 px measure stands at 1,900 / its
 * length, up to 190, 170 or 140 px for one, two or three lines, the block
 * inside the card's height. The set with the largest type wins: "Maya & Jay's
 * Wedding" two lines at 158 px, "Grandma Rosa's 90th Birthday Lunch" three at
 * 135, each about 30 px tall at the chat's 268.
 */
function titleSet(name: string): { px: number; lines: string[] } {
  const words = name.split(/\s+/).filter(Boolean);
  const caps = [190, 170, 140];
  let best = { px: 0, lines: [name] };
  for (let n = 1; n <= Math.min(3, words.length); n++)
    for (const lines of splits(words, n)) {
      const longest = Math.max(...lines.map((l) => l.length));
      const px = Math.min(caps[n - 1]!, Math.floor(1900 / longest));
      if (n * px * 0.98 <= 480 && px > best.px) best = { px, lines };
    }
  return best;
}

/**
 * THE CARD, THE TITLE PAGE IN SMALL: its light and one mark, read at Create's
 * 68 px by the light and the mark's shape (the title beside it there, and
 * under it in every chat, says the name), and beautiful at a chat's 268 px
 * with any name. An open album's mark is its name, as large as it fits in up
 * to three lines, under the album's sky (its seed's before its first photo:
 * the card Create shows her is a just-made party's); a Private album's is the
 * house's wordmark over its link's light (`linkLight`), no name, no photograph
 * and no read of one. ★ A PORT FLATTENS THE BANDS: Satori draws no blend
 * mode, so the route's card lays the sky's stops out precomputed.
 */
function Card({
  variant,
  moment,
}: {
  variant: "open" | "private";
  moment: Moment;
}) {
  const album = useAlbum();
  const sky = useSky();
  const open = variant === "open";
  const light = open
    ? moment.album > 0
      ? sky
      : seedLight(album.seed)
    : linkLight(PRIVATE_LINK);
  const set = open ? titleSet(album.name) : null;
  return (
    <div
      data-ep-card={variant}
      className="dark relative flex size-full items-center justify-center overflow-hidden bg-[#0b0b0c] px-[80px] text-center text-white"
    >
      <Sky light={light} reach={1.15} strength={1.3} grain={false} />
      {set ? (
        <p
          className="relative font-heading leading-[0.98] tracking-[-0.035em]"
          style={{ fontSize: set.px }}
        >
          {set.lines.map((line) => (
            <span key={line} className="block whitespace-nowrap">
              {line}
            </span>
          ))}
        </p>
      ) : (
        <span className="relative">
          <Logo className="h-[170px]" />
        </span>
      )}
    </div>
  );
}

/** A tile: its photograph; before its first, its seed's sky over the day. */
function Tile({ event }: { event: OtherEvent }) {
  return (
    <TileBox className={event.cover ? "" : "dark bg-[#0b0b0c]"}>
      {event.cover ? (
        <Cover still={event.cover} />
      ) : (
        <>
          <Sky
            light={seedLight(event.seed)}
            reach={1.1}
            strength={1.5}
            grain={false}
          />
          <DayFace event={event} />
        </>
      )}
    </TileBox>
  );
}

/** The door's light: the album's sky kept lit over the top of the screen, above the scrim. */
function DoorSky() {
  return (
    <span
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[51] block h-[46%]"
    >
      <Sky light={useSky()} reach={1.1} strength={0.9} grain={false} />
    </span>
  );
}

/** The door: the album's sky stays lit over the top of the screen, above the scrim, the sheet clean. */
function Door({ ground }: { ground: Ground }) {
  return (
    <DoorOver
      page={<GuestPage screen="375" ground={ground} moment={NIGHT} />}
      light={() => <DoorSky />}
    />
  );
}

/** The Add: Aperture's Ring in the album's key, resting low, lifting as her photo lands. */
function Add({
  ground,
  beat,
}: {
  ground: Ground;
  beat: "rest" | "lands" | "unlit";
}) {
  return <Ring ground={ground} beat={beat} />;
}

export const SKY: Kit = {
  id: "sky",
  GuestPage,
  HostPage,
  Premiere,
  Card,
  Tile,
  Door,
  Add,
};
