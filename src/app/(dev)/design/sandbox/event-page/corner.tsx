"use client";

import "./corner.css";

import {
  Copy,
  Download,
  ImageUp,
  ListChecks,
  PencilLine,
  QrCode,
  Share2,
  Users,
} from "lucide-react";
import { type CSSProperties, useMemo } from "react";

import { Logo } from "@/components/shared/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { fitChroma, hex } from "@/lib/avatar/gradient";
import { formatCount } from "@/lib/format/count";
import { RangeText } from "@/lib/format/range-text";
import { cn, formatEventDate } from "@/lib/utils";

import { useAlbum, useAlbumLight } from "./album";
import {
  Cover,
  DoorOver,
  Offer,
  Poster,
  PremiereActs,
  PremiereWords,
  TileBox,
} from "./common";
import {
  INTENSITY,
  type Light,
  type Moment,
  NIGHT,
  type OtherEvent,
  PRIVATE_LINK,
} from "./fixtures";
import type { GuestPageProps, HostPageProps, Kit, PageProps } from "./kit";
import type { Ground, Side } from "./knobs";
import { linkLight, seedLight } from "./light";
import {
  AddButton,
  Code,
  Faces,
  Guestbook,
  Note,
  type RoomId,
  Rooms,
  Ring,
  Round,
  SoftAct,
  Status,
  Tally,
  WatchButton,
} from "./parts";
import { GuestShell, HostShell } from "./shell";

/**
 * CORNER: ONE KEY LIGHT, AS THE RING IS LIT (Will's favourite, take three: the
 * glow born at a corner). The head has no photograph across it: the album's
 * light enters at the room's top-right corner and falls across the room at a
 * slant, the way the brand's Ring is key-lit: hot where it enters, its own
 * colour as it spreads, its other hue as it falls away, spent before the
 * words. ★ IT HAS A FOCUS, ON PURPOSE, and an honest one: a key light draws
 * the eye to where it enters, so something worth the eye stands there: the
 * reel's poster on a guest's page, her code on hers.
 *
 *  - The head is a poster on one left line: the date, the name, one line (the
 *    host and the faces), the acts in the dock's own order (Invite, Add, the
 *    reel); then the host's note and its answer, the guestbook's door.
 *  - Hers: the same poster, her status leading the date, what needs her as
 *    her one white press ("Review 8"), and her side under the light: her code
 *    with its views, her rooms as a short list.
 *  - Before the first photo the key is the party's seed (her code arrives lit
 *    in it from Create, and stands in it); after her close the one moment
 *    stands the reel's poster in the corner the light comes from; the card is
 *    the poster in small: the light from its corner and one mark.
 */

/* ── the light ──────────────────────────────────────────────────────────── */

type Lch = { l: number; c: number; h: number };
type Vars = CSSProperties & Record<`--${string}`, string | number>;

const wrap = (h: number) => ((h % 360) + 360) % 360;
/** Light never goes olive (light.tsx's guard, retyped): the band the eye reads as olive once dimmed is pulled to gold or green. */
const unOlive = (h: number) => (h > 92 && h < 128 ? (h < 110 ? 80 : 138) : h);
const tone = (l: number, c: number, h: number): Lch =>
  fitChroma({ l, c, h: unOlive(wrap(h)) });

/** A colour at a share of itself, as plain `rgba()` (no `oklch()` or `color-mix()`), so the card's light ports to its route as drawn. */
function rgba(color: Lch, share: number): string {
  const n = parseInt(hex(color).slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, share).toFixed(3)})`;
}

const gap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
};

/**
 * THE KEY LIGHT'S TONES, the Ring's own way: hot where it enters (nearly
 * white, a step toward gold where the key is warm), its own colour briefly as
 * it spreads, and its other hue as it falls away (the album's second light),
 * so its colour lives in the falloff; a one-hued light (a seed's) falls into
 * its own deeper shade, a warm one turning past coral into rose, the house
 * ember's direction.
 *
 * ★ DIM WARM IS BROWN (the first draw's fault): a gold or amber light spent
 * over the room's black at any real chroma falls through brown, so a warm key
 * is drawn pale (warm white, its colour a tint) and the dim end of its fall is
 * never gold: it is the light's heaviest COOL other hue, or coral. (The neon
 * rooftop's second light is the crowd's amber: taken as its falloff, violet
 * fell through brown; its magenta, the third, carries the fall instead.) A dim
 * blue, teal, violet or rose still reads as light, so the falloff may carry
 * real chroma.
 */
type Anchor = { tone: Lch; at: number };

const isWarm = (h: number) => h >= 18 && h <= 100;

function tonesOf(light: Light, vivid = 1): Anchor[] {
  const [key, ...rest] = [...light].sort((a, b) => b.w - a.w);
  const h = key!.h;
  const warm = isWarm(h);
  const other = rest.find((x) => gap(x.h, h) > 40 && !isWarm(x.h))?.h ?? null;
  const far =
    other !== null
      ? tone(0.75, 0.13 * vivid, other)
      : warm
        ? // A warm one-hued light (a gold seed's) falls on past coral into rose, the ember's own direction carried
          // beyond its brown: measured on the 34-character card, amber and coral falls read as brown at 68 px.
          tone(0.7, 0.12 * vivid, h - 75)
        : tone(0.75, 0.11 * vivid, h - 14);
  return [
    {
      tone: tone(0.96, (warm ? 0.025 : 0.03) * vivid, warm ? h + 10 : h),
      at: 0,
    },
    // A small lit object (a tile, a card) carries its colour richer than a room's head; a warm body never past its brown line.
    {
      tone: tone(0.9, warm ? Math.min(0.075, 0.06 * vivid) : 0.075 * vivid, h),
      at: 18,
    },
    { tone: far, at: 50 },
  ];
}

/** The tone at a point of the fall (0 to 100), between its anchors, in OKLab. */
function toneAt(anchors: Anchor[], at: number): Lch {
  let i = 0;
  while (i < anchors.length - 2 && at > anchors[i + 1]!.at) i++;
  const a = anchors[i]!;
  const b = anchors[i + 1]!;
  const u = Math.min(1, Math.max(0, (at - a.at) / (b.at - a.at)));
  const lab = (t: Lch) => {
    const r = (t.h * Math.PI) / 180;
    return [t.l, t.c * Math.cos(r), t.c * Math.sin(r)] as const;
  };
  const [la, aa, ba] = lab(a.tone);
  const [lb, ab, bb] = lab(b.tone);
  const A = aa + (ab - aa) * u;
  const B = ba + (bb - ba) * u;
  return fitChroma({
    l: la + (lb - la) * u,
    c: Math.hypot(A, B),
    h: wrap((Math.atan2(B, A) * 180) / Math.PI),
  });
}

/**
 * The fall's strength at each point: broad and soft, no spike at its source
 * (a spike reads as a lamp), spent by its edge.
 */
const FALL: readonly [number, number][] = [
  [1, 0],
  [0.9, 12],
  [0.7, 26],
  [0.46, 42],
  [0.24, 58],
  [0.1, 73],
  [0.03, 87],
];

/** The slant as one field: hot at the corner, its colour as it spreads, its other hue as it falls away. */
function slantLayer(light: Light, core: number, vivid = 1, cap = 1): string {
  const anchors = tonesOf(light, vivid);
  return `radial-gradient(closest-side, ${FALL.map(
    ([k, at]) => `${rgba(toneAt(anchors, at), core * Math.min(k, cap))} ${at}%`,
  ).join(", ")}, transparent 100%)`;
}

/**
 * The slant's shape: how far it reaches along its fall and across it (px), its
 * fall below the level, its strength, how richly it carries its colour, and
 * its `cap`: the share of its strength it may reach at the corner itself.
 * ★ A HEAD'S CORNER HOLDS THE BAR'S OWN CONTROLS (her face, the bell, a
 * guest's name): at full strength the light left a guest's name under 4.5:1
 * there, so a head's light is capped where it enters (measured, capped: the
 * bar's corner reads about L 0.45, white words above 7:1, the bell's muted
 * glyph about 3:1) and keeps its strength in the body of the fall.
 */
type Slant = {
  len: number;
  wide: number;
  tilt: number;
  core: number;
  vivid?: number;
  cap?: number;
};

const SLANT = {
  /**
   * The head at a desk: a long rake across the room's upper right, narrow
   * enough to be spent inside the shortest room (a new event's, ~360px) on
   * its own, so the foot's fade is a guard and never a visible edge.
   */
  desk: { len: 1000, wide: 340, tilt: 22, core: 0.64, cap: 0.52 },
  /** At a phone: high in its corner, falling steeper. */
  phone: { len: 450, wide: 250, tilt: 40, core: 0.64, cap: 0.52 },
  /** The one moment: from behind the reel's poster in the corner, across the whole screen. */
  momentDesk: { len: 1120, wide: 500, tilt: 32, core: 0.62 },
  momentPhone: { len: 600, wide: 320, tilt: 56, core: 0.6 },
  /** The card, 1200 by 630: a little stronger, since a chat draws it a quarter of its size, and Create at 68 px. */
  card: { len: 1080, wide: 470, tilt: 26, core: 0.78, vivid: 1.3 },
  /** A dashboard tile. */
  tile: { len: 280, wide: 150, tilt: 30, core: 0.8, vivid: 1.5 },
} as const satisfies Record<string, Slant>;

/** Where a light is centred, in px from its box's top and right edges. */
type From = { top: number; right: number };

/**
 * THE KEY LIGHT: a slanted field centred on its box's top-right corner (so
 * half its hot core lies beyond the box and none of it reads as a lamp), in a
 * clip the box's own size; `fade` spends what reaches the box's foot before
 * the foot, so no edge ever cuts it. Drawn under the words; on paper its box
 * is a piece of the room. `from` moves its centre in from the corner (px), to
 * an object standing there that gives the light off (the one moment's poster).
 *
 * ★ ITS GRAIN LIVES ONLY IN THE LIGHT (light.tsx's GlowField, the same fix): a
 * grain over the whole box lifted the room's unlit dark, so it is masked by
 * the slant's own fall.
 */
function KeyLight({
  light,
  slant,
  fade = 0,
  grain = true,
  from = { top: 0, right: 0 },
}: {
  light: Light;
  slant: Slant;
  fade?: number;
  grain?: boolean;
  from?: From;
}) {
  const background = useMemo(
    () => slantLayer(light, slant.core, slant.vivid, slant.cap),
    [light, slant.core, slant.vivid, slant.cap],
  );
  const vars: Vars = { "--ep-corner-fade": `${fade}px` };
  return (
    <span
      aria-hidden
      data-ep-light="corner"
      className="ep-corner-light"
      style={vars}
    >
      <span
        className="ep-corner-beam"
        style={{
          top: from.top,
          right: from.right,
          width: slant.len * 2,
          height: slant.wide * 2,
          transform: `translate(50%, -50%) rotate(${-slant.tilt}deg)`,
          background,
        }}
      >
        {grain ? <span className="ep-grain ep-corner-grain" /> : null}
      </span>
    </span>
  );
}

/**
 * The light this frame's album gives off: its photographs' once it has any,
 * its seed's before the first (the light Create's close lit her code in).
 */
function useRoomLight(moment: Moment): Light {
  const album = useAlbum();
  const photos = useAlbumLight();
  const seeded = useMemo(() => seedLight(album.seed), [album.seed]);
  return moment.album > 0 ? photos : seeded;
}

/**
 * HOW RICHLY THE ALBUM'S LIGHT CARRIES ITS COLOUR: by its photographs' own
 * intensity (a light is never louder than its photograph), so a neon rooftop
 * lights its room richer than a soft wedding; the seed's light, before any
 * photograph, at the house's own measure.
 */
function useVivid(moment: Moment): number {
  const album = useAlbum();
  return useMemo(() => {
    if (moment.album === 0) return 1;
    const mean =
      album.cover.reduce((n, s) => n + INTENSITY[s.id], 0) /
      Math.max(1, album.cover.length);
    return Math.min(1.35, Math.max(0.85, mean / 0.1));
  }, [album, moment.album]);
}

/** The room's light: the album's, from the top-right corner, at the width's own slant. */
function RoomLight({ desk, moment }: { desk: boolean; moment: Moment }) {
  const vivid = useVivid(moment);
  const slant = desk ? SLANT.desk : SLANT.phone;
  return (
    <KeyLight
      light={useRoomLight(moment)}
      slant={{ ...slant, vivid }}
      fade={desk ? 180 : 140}
    />
  );
}

/**
 * ★ ON PAPER THE ROOM KEEPS ITS OWN SHADOWS: a white act's long shadow spilled
 * past the band's foot as a grey smudge on the page (measured under Invite
 * guests at her arrival), so on paper the room clips what it holds; in the
 * room the page's ground is the band's own, and nothing there needs clipping.
 */
const PAPER_ROOM: Record<Ground, string | undefined> = {
  paper: "overflow-hidden",
  room: undefined,
};

/* ── the poster's words ─────────────────────────────────────────────────── */

/** The day as a poster's eyebrow, in the camera's spaced capitals; an undated party has none. */
function Eyebrow({ className }: { className?: string }) {
  const album = useAlbum();
  if (!album.date) return null;
  return (
    <p
      data-ep-eyebrow=""
      className={cn("text-label text-muted-foreground uppercase", className)}
    >
      <RangeText text={formatEventDate(album.date, null)} />
    </p>
  );
}

/** Hers leads with her status, then the day. */
function HostEyebrow({ moment }: { moment: Moment }) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <Status moment={moment} />
      <Eyebrow />
    </div>
  );
}

/** The poster's name, the event's one name: the title step, one line at a desk. */
function PosterName({ className }: { className?: string }) {
  const album = useAlbum();
  return (
    <h1
      className={cn(
        "font-heading text-title text-balance text-foreground",
        className,
      )}
    >
      {album.name}
    </h1>
  );
}

/**
 * THE POSTER'S ONE LINE (the settled rule: the faces under the name): who
 * hosts it, then her party's faces and their one count. At a phone four faces
 * keep it one line; before the first guest the host stands alone.
 */
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
        "flex flex-wrap items-center gap-x-2.5 gap-y-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <span className="flex items-center gap-2">
        <Avatar seed={album.host.seed} size="sm">
          <AvatarFallback>{album.host.name.charAt(0)}</AvatarFallback>
        </Avatar>
        {/* One run of words, so the row's gap parts her face from them and never "by" from her name. */}
        <span>
          Hosted by{" "}
          <span className="font-medium text-foreground">{album.host.name}</span>
        </span>
      </span>
      {moment.guests > 0 ? (
        <>
          <span aria-hidden className="opacity-60">
            ·
          </span>
          <Faces moment={moment} size={desk ? 28 : 24} shown={desk ? 6 : 4} />
        </>
      ) : null}
    </div>
  );
}

/**
 * AFTER THE POSTER, ITS EPIGRAPH: the host's welcome note (or, at her arrival,
 * its quiet door while it is empty), then its answer, the guestbook's door: a
 * guest's way to leave one (open after the close too: notes come days after
 * the photos stop), and her count of the notes left (once there are any).
 */
function Epigraph({
  side,
  moment,
  arrival = false,
  className,
}: {
  side: Side;
  moment: Moment;
  arrival?: boolean;
  className?: string;
}) {
  const notes = side === "guest" || moment.album > 0;
  return (
    <div
      data-ep-epigraph=""
      className={cn("flex flex-col items-start gap-2", className)}
    >
      {arrival ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          tabIndex={-1}
          className="-ml-2 text-muted-foreground"
        >
          <PencilLine /> Add a welcome note
        </Button>
      ) : (
        <Note />
      )}
      {notes && !arrival ? <Guestbook side={side} form="line" /> : null}
    </div>
  );
}

/* ── the guest's page ───────────────────────────────────────────────────── */

/**
 * A guest's acts in the dock's own order (Invite, Add, the reel), so nothing
 * changes place when the dock takes over at the foot. ★ AT A DESK THE REEL
 * LIVES IN THE LIGHT (its poster in the corner), so the row never says it
 * again: open, Invite and Add; kept, Invite and Take them home, the poster
 * being the keepsake's lead (after-party's `keepsake=reel`).
 */
function GuestActs({ moment, desk }: { moment: Moment; desk: boolean }) {
  const fill = desk ? undefined : "min-w-0 flex-1";
  if (!moment.open)
    return desk && moment.album > 1 ? (
      <>
        <Round act="invite" />
        <SoftAct icon={<Download />}>Take them home</SoftAct>
      </>
    ) : (
      <>
        <Round act="invite" />
        <WatchButton className={fill} />
        <Round act="home" />
      </>
    );
  return (
    <>
      <Round act="invite" />
      <AddButton
        label={moment.album === 0 ? "Add the first photo" : "Add photos"}
        className={fill}
      />
      {moment.album > 1 && !desk ? <Round act="reel" /> : null}
    </>
  );
}

/**
 * THE REEL WHERE THE LIGHT ENTERS (a guest's page at a desk): its poster, the
 * album's opening photograph, under the key light, so the light falls from
 * something worth the eye and the corner is never empty; it is the reel's
 * press too, at the right where the dock keeps the reel, and once the album
 * is kept it is the keepsake's lead ("Watch the party").
 */
function ReelInTheLight({ kept }: { kept: boolean }) {
  const album = useAlbum();
  return (
    <div data-ep-reel-poster="" className="flex shrink-0 flex-col gap-2.5">
      <Poster still={album.cover[0]!} className="h-[180px] w-[320px]" />
      <span
        className={cn(
          "text-xs",
          kept ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {kept ? "Watch the party" : "The highlight reel"}
      </span>
    </div>
  );
}

function GuestPage({
  screen,
  ground,
  moment,
  scroll,
  beat,
  count,
}: GuestPageProps) {
  const desk = screen === "1440";
  const reel = desk && moment.album > 1;
  const poster = (
    <div className="min-w-0">
      <Eyebrow />
      <PosterName className={desk ? "mt-3 max-w-4xl" : "mt-2"} />
      <HostLine
        moment={moment}
        desk={desk}
        className={desk ? "mt-4" : "mt-3"}
      />
      <div className={cn("flex items-center gap-2", desk ? "mt-6" : "mt-5")}>
        <GuestActs moment={moment} desk={desk} />
      </div>
      <Epigraph side="guest" moment={moment} className="mt-5" />
    </div>
  );
  const head = (
    <div
      className={cn(
        "flex items-start justify-between gap-16 px-5",
        desk ? "pt-16" : "pt-10",
        // Before the first photo the room ends under the epigraph: a little more foot, so nothing crowds the band's edge on paper.
        moment.album === 0 && "pb-4",
      )}
    >
      {poster}
      {reel ? <ReelInTheLight kept={!moment.open} /> : null}
    </div>
  );
  return (
    <GuestShell
      screen={screen}
      ground={ground}
      moment={moment}
      head={head}
      glow={<RoomLight desk={desk} moment={moment} />}
      scroll={scroll}
      beat={beat}
      count={count}
      roomClass={PAPER_ROOM[ground]}
    />
  );
}

/* ── her page ───────────────────────────────────────────────────────────── */

/** What waits on her now, if anything: the uploads in Review first, else the people at her door. */
function waitingOn(moment: Moment): "review" | "door" | null {
  if (!moment.open) return null;
  if (moment.review > 0) return "review";
  if (moment.door > 0) return "door";
  return null;
}

/** WHAT NEEDS HER, as her head's one white press: its room's word and its count on it. */
function NeedsHer({
  moment,
  on,
  className,
}: {
  moment: Moment;
  on: "review" | "door";
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="on-photo"
      size="cta"
      tabIndex={-1}
      data-ep-act="needs"
      className={className}
    >
      {on === "review" ? <ListChecks /> : <Users />}
      {on === "review" ? "Review" : "Guests"}
      <Tally n={on === "review" ? moment.review : moment.door} />
    </Button>
  );
}

/** The Add, stepped back to a glass round where her white press leads a phone's row. */
function AddRound() {
  return (
    <Button
      type="button"
      variant="glass"
      size="icon-cta"
      tabIndex={-1}
      data-ep-act="add"
      aria-label="Add photos"
    >
      <ImageUp />
    </Button>
  );
}

/** Invite guests, the white press before the first photo; at a phone it carries the code's glyph, since her code folds into it. */
function InviteGuests({
  glyph,
  className,
}: {
  glyph: boolean;
  className?: string;
}) {
  return (
    <Button
      type="button"
      variant="on-photo"
      size="cta"
      tabIndex={-1}
      data-ep-act="invite"
      className={className}
    >
      {glyph ? <QrCode /> : null}
      Invite guests
    </Button>
  );
}

/**
 * HER ACTS, in the dock's own order (Invite, Add, the reel), with one white
 * press: what needs her when something waits (Review 8; Add steps back to
 * glass), the offer's Close adding on Wednesday (Add glass), Invite guests
 * before the first photo, the reel once she has closed.
 */
function HostActs({
  moment,
  desk,
  offer,
}: {
  moment: Moment;
  desk: boolean;
  offer?: boolean;
}) {
  const fill = desk ? undefined : "min-w-0 flex-1";
  if (!moment.open)
    return (
      <>
        <SoftAct icon={<Share2 />}>Share</SoftAct>
        <WatchButton className={fill} />
      </>
    );
  if (moment.album === 0)
    return (
      <>
        <InviteGuests glyph={!desk} className={fill} />
        <SoftAct>Add photos</SoftAct>
      </>
    );
  const needs = offer ? null : waitingOn(moment);
  const stepped = needs !== null || offer;
  return (
    <>
      {needs ? <NeedsHer moment={moment} on={needs} className={fill} /> : null}
      <Round act="invite" />
      {stepped ? (
        desk ? (
          <SoftAct icon={<ImageUp />}>Add photos</SoftAct>
        ) : (
          <AddRound />
        )
      ) : (
        <AddButton className={fill} />
      )}
      <Round act="reel" />
    </>
  );
}

/**
 * Her rooms, less the one her white press already is: the room that needs her
 * steps out of the list and becomes her one white press, so it is never said
 * twice (its word or its count), and steps back in once nothing waits.
 */
function roomsOf(moment: Moment, offer?: boolean): RoomId[] {
  const needs = offer ? null : waitingOn(moment);
  const out: RoomId = needs === "door" ? "guests" : "review";
  return (["review", "guests", "settings"] as RoomId[]).filter(
    (r) => needs === null || r !== out,
  );
}

/** Her side, where the light falls: her code with its views riding it (or, new, its link), her rooms as a short list. */
function HerSide({ moment, offer }: { moment: Moment; offer?: boolean }) {
  const fresh = moment.album === 0 && moment.views === 0;
  return (
    <div data-ep-her="" className="flex shrink-0 items-start gap-6">
      <div className="flex flex-col items-center gap-2.5">
        <Code moment={moment} />
        <span className="text-xs text-muted-foreground tabular-nums">
          {fresh ? (
            <span className="flex items-center gap-1.5">
              Copy link <Copy className="size-3.5" aria-hidden />
            </span>
          ) : (
            `${formatCount(moment.views)} views`
          )}
        </span>
      </div>
      <Rooms
        moment={moment}
        rooms={roomsOf(moment, offer)}
        form="row"
        className="w-40 pt-0.5"
      />
    </div>
  );
}

/**
 * HER ARRIVAL AT A PHONE: Create's code lands on her head (the code itself,
 * where Create's flight ends), its two first acts stacked beside it; from the
 * morning after, once guests have it, it folds into Invite guests.
 */
function ArrivalAtAPhone({ moment }: { moment: Moment }) {
  return (
    <div data-ep-arrival="" className="flex items-center gap-4">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <InviteGuests glyph={false} className="w-full" />
        <SoftAct className="w-full">Add photos</SoftAct>
      </div>
      <Code moment={moment} />
    </div>
  );
}

function HostPage({ screen, ground, moment, arrival, offer }: HostPageProps) {
  const desk = screen === "1440";
  const fresh = moment.album === 0;
  const empty = fresh ? (
    <span>Your guests&apos; faces gather here as they add</span>
  ) : undefined;
  const head = desk ? (
    <div
      className={cn(
        // Her side hangs from the poster's top line, nearest the light's source.
        "flex items-start justify-between gap-16 px-5 pt-14",
        fresh && "pb-4",
      )}
    >
      <div className="min-w-0">
        <HostEyebrow moment={moment} />
        <PosterName className="mt-3" />
        <Faces moment={moment} size={28} className="mt-4" empty={empty} />
        {offer ? <Offer className="mt-6" /> : null}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <HostActs moment={moment} desk offer={offer} />
        </div>
        <Epigraph
          side="host"
          moment={moment}
          arrival={arrival}
          className="mt-5"
        />
      </div>
      <HerSide moment={moment} offer={offer} />
    </div>
  ) : (
    <div className={cn("px-5 pt-10", fresh && "pb-4")}>
      <HostEyebrow moment={moment} />
      <PosterName className="mt-2" />
      <Faces moment={moment} size={24} className="mt-3" empty={empty} />
      {offer ? <Offer className="mt-5" /> : null}
      {arrival ? (
        <div className="mt-5">
          <ArrivalAtAPhone moment={moment} />
        </div>
      ) : (
        <div className="mt-5 flex items-center gap-2">
          <HostActs moment={moment} desk={false} offer={offer} />
        </div>
      )}
      <Epigraph
        side="host"
        moment={moment}
        arrival={arrival}
        className="mt-4"
      />
      {/* Her rooms, the desk's short list laid along one line: words, never pills (no cockpit). */}
      <Rooms
        moment={moment}
        rooms={roomsOf(moment, offer)}
        form="row"
        className="ep-corner-rooms-line mt-2"
      />
    </div>
  );
  return (
    <HostShell
      screen={screen}
      ground={ground}
      moment={moment}
      head={head}
      glow={<RoomLight desk={desk} moment={moment} />}
      roomClass={PAPER_ROOM[ground]}
    />
  );
}

/* ── the one moment ─────────────────────────────────────────────────────── */

/** Where the moment's poster stands in the corner (px), so its light is centred on it. */
const MOMENT_POSTER = {
  desk: { top: 64, right: 64, w: 704, h: 396 },
  phone: { top: 84, right: 20, w: 320, h: 240 },
} as const;

/**
 * THE MOMENT, ITS SOURCE SHOWN: the reel's poster stands in the corner the
 * light has always come from, so the album is seen as the source of its own
 * light, falling from it across the room to the words in the lower left.
 * Shown once; then the page as before.
 */
function Premiere({
  screen,
  ground,
  moment,
  side,
}: PageProps & { side: Side }) {
  const desk = screen === "1440";
  const album = useAlbum();
  const light = useAlbumLight();
  const p = desk ? MOMENT_POSTER.desk : MOMENT_POSTER.phone;
  return (
    <div
      data-ep-premiere="corner"
      className={cn(
        "relative isolate min-h-screen overflow-hidden bg-background text-foreground",
        ground === "paper" && "dark",
      )}
    >
      <KeyLight
        light={light}
        slant={desk ? SLANT.momentDesk : SLANT.momentPhone}
        from={{ top: p.top + p.h / 2, right: p.right + p.w / 2 }}
      />
      <div className="relative z-10 min-h-screen">
        <div
          className="absolute"
          style={{ top: p.top, right: p.right, width: p.w, height: p.h }}
        >
          <Poster still={album.cover[0]!} className="size-full" />
        </div>
        <div
          className={cn(
            "absolute flex flex-col",
            desk
              ? "bottom-20 left-16 max-w-xl gap-8"
              : "inset-x-5 bottom-12 gap-7",
          )}
        >
          <PremiereWords side={side} moment={moment} align="start" />
          <PremiereActs side={side} align="start" />
        </div>
      </div>
    </div>
  );
}

/* ── its reach ──────────────────────────────────────────────────────────── */

/**
 * The name's size on the card: as large as the card allows, by its length
 * (one line to 12 characters, two to 22, three beyond), so a short name is a
 * poster's title and a long one (34 characters) still sets as one bold block,
 * never small: at 68 px the block is the card's one mark.
 */
const cardSize = (name: string) =>
  name.length <= 12 ? 200 : name.length <= 22 ? 176 : 140;

/**
 * THE CARD, THE POSTER IN SMALL: the room lit from its top-right corner and
 * one mark in its lower left, nothing else. Create draws it 68 px wide beside
 * its title and a chat under its title, so at 68 px it reads by its light and
 * the one mark, and at a chat's 268 the same two things are the whole poster.
 * An open album's mark is its one name, set as large as the card allows; its
 * light its photographs', or its seed's before the first (Create's). A Private
 * album's face is the house's wordmark over its link's light: never a name, a
 * photograph, a face or a sentence (the chat's title says "A Partyreel
 * album" under it).
 */
function Card({
  variant,
  moment,
}: {
  variant: "open" | "private";
  moment: Moment;
}) {
  const album = useAlbum();
  const room = useRoomLight(moment);
  const open = variant === "open";
  const link = useMemo(() => linkLight(PRIVATE_LINK), []);
  return (
    <div
      data-ep-card={variant}
      className="dark relative flex size-full flex-col justify-end overflow-hidden bg-[#0b0b0c] px-[84px] pb-[76px] text-foreground"
    >
      <KeyLight light={open ? room : link} slant={SLANT.card} grain={false} />
      {open ? (
        <p
          className="relative max-w-[1000px] font-heading text-balance"
          style={{
            fontSize: cardSize(album.name),
            lineHeight: 0.92,
            letterSpacing: "-0.04em",
          }}
        >
          {album.name}
        </p>
      ) : (
        <span className="relative inline-flex">
          <Logo className="h-[124px]" />
        </span>
      )}
    </div>
  );
}

/**
 * A party to come's day, set as the poster's own: its eyebrow and its date in
 * the lower left, or "No date" (the tile's words under it say "No photos yet",
 * so the face is where its day, or its lack of one, is said).
 */
function DayPoster({ event }: { event: OtherEvent }) {
  const d = event.date ? new Date(`${event.date}T12:00:00`) : null;
  return (
    <div className="absolute inset-x-0 bottom-0 flex flex-col items-start px-4 pb-3.5 text-foreground">
      {d ? (
        <>
          <span className="text-label text-muted-foreground uppercase">
            {d.toLocaleDateString("en-US", { weekday: "short" })} ·{" "}
            {d.toLocaleDateString("en-US", { month: "short" })}
          </span>
          <span className="font-heading text-section tabular-nums">
            {d.getDate()}
          </span>
        </>
      ) : (
        <span className="text-label text-muted-foreground uppercase">
          No date
        </span>
      )}
    </div>
  );
}

/** A tile: its photograph; before its first, its seed's key from the corner over its day, set as a poster. */
function Tile({ event }: { event: OtherEvent }) {
  const light = useMemo(() => seedLight(event.seed), [event.seed]);
  return (
    <TileBox className={event.cover ? "" : "dark bg-[#0b0b0c]"}>
      {event.cover ? (
        <Cover still={event.cover} />
      ) : (
        <>
          <KeyLight light={light} slant={SLANT.tile} grain={false} />
          <DayPoster event={event} />
        </>
      )}
    </TileBox>
  );
}

/** The door: the head's own key still falls from the screen's top-right corner, over the scrim, the sheet clean. */
function Door({ ground }: { ground: Ground }) {
  const light = useAlbumLight();
  return (
    <DoorOver
      page={<GuestPage screen="375" ground={ground} moment={NIGHT} />}
      light={() => (
        <span
          aria-hidden
          className="pointer-events-none fixed inset-x-0 top-0 z-[51] block h-[54%]"
        >
          <KeyLight
            light={light}
            slant={SLANT.phone}
            fade={140}
            grain={false}
          />
        </span>
      )}
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

export const CORNER: Kit = {
  id: "corner",
  GuestPage,
  HostPage,
  Premiere,
  Card,
  Tile,
  Door,
  Add,
};
