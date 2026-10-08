"use client";

import {
  ImageUp,
  ListChecks,
  PencilLine,
  QrCode,
  Settings,
  Users,
} from "lucide-react";
import { type ReactNode, useMemo } from "react";

import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { fitChroma, hex } from "@/lib/avatar/gradient";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { useAlbum, useAlbumLight } from "./album";
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
  AppBar,
  Byline,
  Code,
  Faces,
  GuestBar,
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
 * RISE: THE ALBUM'S LIGHT, RISING (Will's favourite, take one: the glow born
 * at the gallery). The head has no photograph: it is the room, calm, one
 * group of words on the page's left line, and the album starts on the first
 * screen. The album's light is born in the room just above the album, a
 * horizon under the head's acts, and rises through the whole head to its top;
 * a band of dark stands between it and the album, so the light never sits on
 * a photograph (the Seam's colour-against-colour clash, gone).
 *
 *  - The light: the album's two or three colour families (`useAlbumLight()`,
 *    stable as photos land, the same at a phone and a desk), broad along the
 *    horizon, no column and no point of focus. A warm light is born a pale
 *    warm white (dim gold is brown paint) and falls as dusk does, through
 *    rose into the album's cool hue up to the top, so a candlelit wedding
 *    stands under its own dusk and a neon roof under violet. Even and quiet:
 *    the head's last row keeps 4.5:1 over it. Before the first photo the
 *    party's seed is the light, a little fuller (the empty page needs it).
 *  - The head, the guest's: the name, the host and the day, the faces (the
 *    one count of guests), her note and the guestbook's door as its answer,
 *    then the acts in the dock's own order (Invite, Add, the reel).
 *  - Hers is the guest's group with her tools added (one product): her line
 *    (her status, the day, the views), her note (or "Add a welcome note" while
 *    it is empty) and her notes, the same acts, and her rooms in one quiet row
 *    under them. What waits on her is her head's one white press ("Review 8"),
 *    Add stepping back to glass; Wednesday's offer likewise. Her code stands
 *    on her head at her arrival, where Create's flight lands (beside her
 *    words, at a desk and a phone alike); once guests have it, it folds into
 *    Invite.
 *  - The one moment has a centre: the reel's poster in full light, the words
 *    and the acts above it in the album's light, born over the poster's edge.
 *  - Its card says little and large: the name over the album's light rising
 *    from the card's foot (a Private album's: the wordmark over its link's).
 *  - One gallery, never divided (no day dividers, no chapters), and no mail:
 *    what a moment would want one for is named in the option's costs.
 */

/* ── the light's colour ─────────────────────────────────────────────────── */

type Lch = { l: number; c: number; h: number };

const wrap = (h: number) => ((h % 360) + 360) % 360;
/** Light never goes olive (light.tsx's guard, retyped): the band the eye reads as olive once dimmed is pulled to gold or green. */
const unOlive = (h: number) => (h > 92 && h < 128 ? (h < 110 ? 80 : 138) : h);
const tone = (l: number, c: number, h: number): Lch =>
  fitChroma({ l, c, h: unOlive(wrap(h)) });
/** Golds, ambers and oranges: the hues a dim light turns to brown. */
const isWarm = (h: number) => {
  const u = unOlive(wrap(h));
  return u >= 18 && u <= 100;
};

/** Two tones mixed in OKLab (never through a grey), `u` of the way from `a` to `b`. */
function mixTone(a: Lch, b: Lch, u: number): Lch {
  const ra = (a.h * Math.PI) / 180;
  const rb = (b.h * Math.PI) / 180;
  const A = a.c * Math.cos(ra) + (b.c * Math.cos(rb) - a.c * Math.cos(ra)) * u;
  const B = a.c * Math.sin(ra) + (b.c * Math.sin(rb) - a.c * Math.sin(ra)) * u;
  return fitChroma({
    l: a.l + (b.l - a.l) * u,
    c: Math.hypot(A, B),
    h: wrap((Math.atan2(B, A) * 180) / Math.PI),
  });
}

/** A colour as plain `rgba()` (no `oklch()` or `color-mix()`), so a card's light ports to its route as drawn. */
function rgba(t: Lch, a = 1): string {
  const n = parseInt(hex(t).slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.max(0, Math.min(1, a)).toFixed(3)})`;
}

/**
 * ONE OF THE LIGHT'S SOURCES along the horizon: where it stands across
 * (percent), its share, and its three tones: the one it is born in (the
 * horizon's), its own colour as it spreads, and the one it falls into.
 *
 * ★ DIM WARM IS BROWN (the creative director's pass: the first rise was gold
 * at ~0.135 chroma spent over black, brown paint): a warm light is born a pale
 * warm white, its own colour only a tint, and falls as dusk does, through rose
 * into the album's cool hue (a dim rose, mauve or violet still reads as
 * light), or into mauve where the album has no cool hue. So the wedding's
 * candlelight keeps its warmth where it is born and never browns, and a neon
 * roof stands in violet.
 */
type Source = { x: number; w: number; born: Lch; body: Lch; far: Lch };

/**
 * THE ALBUM'S COLOUR FAMILIES AS SOURCES: its two or three lights (a third
 * only where it carries real weight), the heaviest broad across the middle,
 * the others at the sides. Read from the album's whole light, never its first
 * row: a newest-first row changes with every upload and with the width.
 */
function sourcesOf(light: Light): Source[] {
  const lamps = [...light].sort((a, b) => b.w - a.w);
  const kept = lamps.filter((l, i) => i < 2 || l.w >= 0.15);
  const cool = lamps.find((l) => !isWarm(l.h));
  const at =
    kept.length === 1 ? [50] : kept.length === 2 ? [36, 84] : [50, 12, 88];
  const top = kept[0]!.w || 1;
  return kept.map((lamp, i) => {
    const h = lamp.h;
    const warm = isWarm(h);
    const c = Math.min(0.13, lamp.c ?? 0.13);
    // The fall's tones carry real chroma at a modest lightness: spent thin over the room's black, a light keeps its
    // hue only where its chroma is real (at C ~0.11 the first draw's dusk read grey).
    const mauve = tone(0.64, 0.15, h - 75);
    return {
      x: at[i]!,
      w: lamp.w / top,
      born: warm ? tone(0.94, 0.045, h + 6) : tone(0.86, 0.09, h),
      body: warm ? tone(0.72, 0.13, h - 42) : tone(0.7, Math.max(0.14, c), h),
      far: warm
        ? cool
          ? mixTone(mauve, tone(0.62, 0.17, cool.h), 0.5)
          : mauve
        : tone(0.62, Math.max(0.16, c), h),
    };
  });
}

/** The sources as one band across, its colours blended in oklab, a lighter share fainter. */
function bandOf(sources: readonly Source[], pick: (s: Source) => Lch): string {
  const stops = [...sources]
    .sort((a, b) => a.x - b.x)
    .map((s) => `${rgba(pick(s), 0.62 + 0.38 * s.w)} ${s.x}%`);
  if (stops.length === 1) stops.push(stops[0]!.replace(/\d+%$/, "100%"));
  return `linear-gradient(in oklab 90deg, ${stops.join(", ")})`;
}

/* ── the light's shape ──────────────────────────────────────────────────── */

/**
 * A HORIZON'S OWN FALL: soft where it is born (no line is drawn there), a
 * long gentle tail, eased to nothing at its reach, so no ring of a stop shows.
 */
const FALL = [
  [0, 1],
  [6, 0.95],
  [14, 0.83],
  [25, 0.64],
  [38, 0.45],
  [53, 0.27],
  [68, 0.13],
  [83, 0.045],
  [100, 0],
] as const;

/**
 * A reach of the light: its strength where it is born, and how far it climbs,
 * in px (the horizon, the same at any height) or as a share of the room's
 * height (the glow and the sky, so a reach meets the room's top however tall).
 */
type Reach = { core: number; reach: number; px?: boolean };
/**
 * The light, dosed in three reaches, as a room takes a light from its floor:
 * the horizon (its born tones, close, luminous), the glow (each source's own
 * colour as it spreads), the sky (its fall's tones, quietly up to the top).
 */
type Dose = { horizon: Reach; glow: Reach; sky: Reach };

/**
 * The page's head over photographs: an even dusk, the sky long and flat (it
 * fills the whole head, top included, falling only to half), the glow and the
 * horizon gathering it where it is born.
 *
 * ★ THE LAST ROW STAYS READABLE (measured): the head's last row stands just
 * above the horizon, and on her page it is muted words (her rooms, the
 * moment's way back, the offer's line), which need 4.5:1. At the first draw's
 * strength the light behind them was L ~0.5 (2.4:1), so the light's sum there
 * stays near L 0.33 (about 5:1) and its brightest line, under them, near 0.4.
 */
const PAGE: Dose = {
  horizon: { core: 0.11, reach: 90, px: true },
  glow: { core: 0.075, reach: 0.5 },
  sky: { core: 0.17, reach: 2.6 },
};
/** Before the first photograph: the seed, a little fuller (the empty page is the one that needs light). */
const SEED: Dose = {
  horizon: { core: 0.13, reach: 100, px: true },
  glow: { core: 0.09, reach: 0.55 },
  sky: { core: 0.19, reach: 2.6 },
};

/**
 * HOW THE LIGHT STANDS ABOVE THE ALBUM: born `FADE + DARK` px over the
 * album's own head (its 24 px of air on top), eased to nothing over `FADE` px
 * below its birth, so some 30 px of the room's dark stand over the album's count
 * and Select, and the light never touches a photograph (the creative
 * director's pass: where the Seam stood, colour fought colour). Its birth is
 * `RISE_GAP` px under the head's last row, so its brightest line stands under
 * the words, never behind them. On paper the same measures keep it inside the
 * dark band, finished well before its foot.
 */
const FADE = 40;
const DARK = 2;
const RISE_GAP = 18;
/** The horizon under the head's last row, where the light is born. */
const HORIZON = RISE_GAP + FADE + DARK;
/** The room's foot under the horizon, as the shells draw it: the album's head (in the room), or 24 px of air. */
const footOf = (photos: boolean, ground: Ground) =>
  photos && ground === "room" ? 64 : 24;

/**
 * The fall as a mask, top to bottom: its stops placed up from its birth (in
 * px, or in the room's own height: `cqh`, the light's box being a size
 * container), its birth `fade` px above the field's foot, and below its birth
 * an eased fade to nothing.
 */
function fallMask({ core, reach, px }: Reach, fade: number): string {
  const up = [...FALL].reverse().map(([t, k]) => {
    const at = px
      ? `${((t * reach) / 100).toFixed(1)}px`
      : `${(t * reach).toFixed(1)}cqh`;
    return `rgba(0, 0, 0, ${(core * k).toFixed(3)}) calc(100% - ${fade}px - ${at})`;
  });
  // smoothstep, so the fade below has no edge of its own where it begins or ends
  const down = [0.2, 0.4, 0.6, 0.8, 1].map((u) => {
    const k = 1 - u * u * (3 - 2 * u);
    return `rgba(0, 0, 0, ${(core * k).toFixed(3)}) calc(100% - ${Math.round(fade * (1 - u))}px)`;
  });
  return `linear-gradient(to bottom, ${[...up, ...down].join(", ")})`;
}

/** One reach of the light: a band of colour across, faded up by its fall. */
function Layer({ background, mask }: { background: string; mask: string }) {
  return (
    <span
      className="absolute inset-0 block"
      style={{ background, maskImage: mask, WebkitMaskImage: mask }}
    />
  );
}

/**
 * THE RISING LIGHT, drawn behind a room's words: a field from the room's top
 * to its horizon (`birth` px above the room's foot), the sky reaching the top
 * quietly, the glow carrying each source's colour, the horizon luminous where
 * it is born, eased to nothing `fade` px below it, so no box ever cuts it. The
 * board's field (`ep-glow`), its breath of grain only where the light is
 * (light.tsx's rule).
 */
function RiseLight({
  sources,
  dose,
  birth,
  fade = FADE,
  grain = true,
}: {
  sources: readonly Source[];
  dose: Dose;
  birth: number;
  fade?: number;
  grain?: boolean;
}) {
  const grainMask = fallMask({ core: 1, reach: dose.sky.reach }, fade);
  return (
    <span
      aria-hidden
      data-ep-rise-light=""
      className="pointer-events-none absolute inset-x-0 top-0 z-0 block"
      style={{ bottom: birth, containerType: "size" }}
    >
      <span data-ep-glow="" className="ep-glow" style={{ bottom: -fade }}>
        <Layer
          background={bandOf(sources, (s) => s.far)}
          mask={fallMask(dose.sky, fade)}
        />
        <Layer
          background={bandOf(sources, (s) => s.body)}
          mask={fallMask(dose.glow, fade)}
        />
        <Layer
          background={bandOf(sources, (s) => s.born)}
          mask={fallMask(dose.horizon, fade)}
        />
        {grain ? (
          <span
            className="ep-grain"
            style={{ maskImage: grainMask, WebkitMaskImage: grainMask }}
          />
        ) : null}
      </span>
    </span>
  );
}

/** The room's light: the album's own over photographs, the party's seed before the first. */
function RoomLight({ ground, moment }: { ground: Ground; moment: Moment }) {
  const album = useAlbum();
  const light = useAlbumLight();
  const photos = moment.album > 0;
  const sources = useMemo(
    () => sourcesOf(photos ? light : seedLight(album.seed)),
    [photos, light, album.seed],
  );
  return (
    <RiseLight
      sources={sources}
      dose={photos ? PAGE : SEED}
      birth={footOf(photos, ground) + DARK + FADE}
    />
  );
}

/** The horizon under the head (and under Wednesday's offer), where the light is born. */
function Horizon({ children }: { children?: ReactNode }) {
  return (
    <>
      {children}
      <div aria-hidden data-ep-rise-horizon="" style={{ height: HORIZON }} />
    </>
  );
}

/* ── the guest's page ───────────────────────────────────────────────────── */

/** The acts in the dock's own order: Invite, the Add (the reel once kept), the reel (Take them home once kept). */
function GuestActs({ moment, desk }: { moment: Moment; desk: boolean }) {
  const grow = desk ? undefined : "min-w-0 flex-1";
  if (!moment.open)
    return (
      <>
        <Round act="invite" />
        <WatchButton className={grow} />
        <Round act="home" />
      </>
    );
  return (
    <>
      <Round act="invite" />
      <AddButton
        label={moment.album === 0 ? "Add the first photo" : "Add photos"}
        className={grow}
      />
      {moment.album > 1 ? <Round act="reel" /> : null}
    </>
  );
}

/**
 * THE GUEST'S HEAD, ONE GROUP ON THE LEFT LINE: the name; the host and the
 * day; the faces; her note and its answer, the guestbook's door (open after
 * her close too: notes come days after the photos stop); the acts.
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
    <div className={cn("px-5", desk ? "pt-12" : "pt-7")}>
      <div data-ep-rise-group="" className={desk ? "max-w-2xl" : undefined}>
        <Name className={desk ? "text-chapter" : "text-title"} />
        <Byline className={desk ? "mt-4" : "mt-3"} />
        <Faces
          moment={moment}
          size={desk ? 32 : 28}
          className={desk ? "mt-5" : "mt-4"}
        />
        <Note className={desk ? "mt-4" : "mt-3.5"} />
        <Guestbook side="guest" className="mt-2" />
        <div className={cn("flex items-center gap-2", desk ? "mt-7" : "mt-6")}>
          <GuestActs moment={moment} desk={desk} />
        </div>
      </div>
    </div>
  );
  return (
    <GuestShell
      screen={screen}
      ground={ground}
      moment={moment}
      head={head}
      between={<Horizon />}
      glow={<RoomLight ground={ground} moment={moment} />}
      scroll={scroll}
      beat={beat}
      count={count}
    />
  );
}

/* ── her page ───────────────────────────────────────────────────────────── */

type RoomKey = "review" | "guests" | "settings";

/** What waits on her now, if anything: Review's uploads first, then the people at her door. */
const needsHer = (moment: Moment): RoomKey | null =>
  moment.review > 0 ? "review" : moment.door > 0 ? "guests" : null;

/** Her code stands on her head until a guest has opened it (her arrival from Create); then it folds into Invite. */
const codeStands = (moment: Moment) => moment.open && moment.views === 0;

/**
 * HER ACTS, the guest's in the dock's order. Before the first photo Invite
 * guests leads (white, the code's glyph), Add photos beside it; at the party
 * Invite, Add, the reel, Add white only while nothing waits on her (what
 * needs her, or Wednesday's offer, holds the head's one white press, and Add
 * steps back to glass); once kept, Share and the reel.
 */
function HostActs({
  moment,
  desk,
  yields,
}: {
  moment: Moment;
  desk: boolean;
  yields: boolean;
}) {
  const grow = desk ? undefined : "min-w-0 flex-1";
  if (!moment.open)
    return (
      <>
        <Round act="invite" label="Share the album" />
        <WatchButton className={grow} />
      </>
    );
  if (moment.album === 0)
    return (
      <>
        <Button
          type="button"
          variant="on-photo"
          size="cta"
          tabIndex={-1}
          data-ep-act="invite"
          className={grow}
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
        <SoftAct icon={<ImageUp />} className={grow}>
          Add photos
        </SoftAct>
      ) : (
        <AddButton className={grow} />
      )}
      <Round act="reel" />
    </>
  );
}

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

/**
 * HER ROOMS, A QUIET ROW under her acts (her tools' one place; the bar is the
 * app's alone): each a press into its room with its word, in the muted ink
 * with no ground of its own, its first glyph on the left line. What waits on
 * her is the row's one white press with its count on it ("Review 8"), the
 * head's one white press; another room that waits keeps the tally's red on
 * its shoulder. The guests' own count is the faces row's, never said again.
 */
function QuietRooms({
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
      data-ep-rooms="quiet"
      className={cn("-ml-2.5 flex flex-wrap items-center gap-1", className)}
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
            className={cn(
              "gap-1.5",
              leads ? "ml-2.5" : "text-muted-foreground",
            )}
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

/** The day as her phone's line says it: short, so her status, the day and the views keep one line. */
const shortDay = (date: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** Her line under the name: her status, the day, and the views (her code's own count, once it has some). */
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
        "flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground",
        className,
      )}
    >
      <Status moment={moment} />
      {desk ? (
        <Byline host={false} />
      ) : album.date ? (
        <span>{shortDay(album.date)}</span>
      ) : null}
      {moment.views > 0 ? (
        <span className="tabular-nums">{formatCount(moment.views)} views</span>
      ) : null}
    </div>
  );
}

/** Her welcome note's door while it is empty (her arrival): quiet, where the note will stand. */
function AddNote({ className }: { className?: string }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      data-ep-add-note=""
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline [&>svg]:size-4",
        className,
      )}
    >
      <PencilLine />
      Add a welcome note
    </button>
  );
}

/** The notes guests have left her, a stand-in per moment (the guestbook's own count, said only at its door). */
const NOTES: Record<Moment["key"], number> = {
  made: 0,
  waiting: 0,
  night: 12,
  wednesday: 19,
  week: 19,
};

/**
 * WHERE CREATE'S CODE LANDS: production's own code door (`Code`, which
 * carries the morph's name), standing beside her name while nobody has opened
 * it, at a desk and a phone alike, a size down so her words lead; "Go to your
 * event" flies Create's code into a code of the same face, in the seed light
 * Create lit it in. Once a guest has it, it folds into Invite.
 */
function CodeLands({ moment, zoom }: { moment: Moment; zoom: number }) {
  return (
    <div data-ep-code-lands="" className="flex shrink-0">
      <span className="inline-flex" style={{ zoom }}>
        <Code moment={moment} />
      </span>
    </div>
  );
}

/**
 * HER PAGE: the guest's group with her tools added. Her line in the byline's
 * place, her note (or its door) with her notes as its answer, the acts, her
 * rooms; at her arrival her code beside her name.
 */
function HostPage({ screen, ground, moment, arrival, offer }: HostPageProps) {
  const desk = screen === "1440";
  const notes = NOTES[moment.key];
  const yields = Boolean(offer) || needsHer(moment) !== null;
  const stands = codeStands(moment);
  const words = (
    <>
      <HostLine
        moment={moment}
        desk={desk}
        className={desk ? "mt-4" : "mt-3"}
      />
      <Faces
        moment={moment}
        size={desk ? 32 : 28}
        className={desk ? "mt-5" : "mt-4"}
      />
      {arrival ? (
        <AddNote className={desk ? "mt-4" : "mt-3.5"} />
      ) : (
        <Note className={desk ? "mt-4" : "mt-3.5"} />
      )}
      {notes > 0 ? (
        <Guestbook side="host" notes={notes} className="mt-2" />
      ) : null}
    </>
  );
  const acts = (
    <>
      <div className={cn("flex items-center gap-2", desk ? "mt-7" : "mt-6")}>
        <HostActs moment={moment} desk={desk} yields={yields} />
      </div>
      <QuietRooms moment={moment} className={desk ? "mt-4" : "mt-3"} />
    </>
  );
  const head = desk ? (
    <div className="flex items-start gap-12 px-5 pt-12">
      <div data-ep-rise-group="" className="max-w-2xl min-w-0">
        <Name className="text-chapter" />
        {words}
        {acts}
      </div>
      {stands ? (
        <div className="mt-3">
          <CodeLands moment={moment} zoom={0.85} />
        </div>
      ) : null}
    </div>
  ) : (
    <div className="px-5 pt-6">
      <Name className="text-title" />
      {/* At a phone her code stands beside her line and her note (the name keeps its whole width), the size of the
          Invite press under it, so the flight's landing is a code of the same face, never a glyph. */}
      {stands ? (
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">{words}</div>
          <CodeLands moment={moment} zoom={0.62} />
        </div>
      ) : (
        words
      )}
      {acts}
    </div>
  );
  return (
    <HostShell
      screen={screen}
      ground={ground}
      moment={moment}
      head={head}
      between={
        <Horizon>
          {offer ? (
            <div className="px-5 pt-7">
              <Offer />
            </div>
          ) : null}
        </Horizon>
      }
      glow={<RoomLight ground={ground} moment={moment} />}
    />
  );
}

/* ── the one moment ─────────────────────────────────────────────────────── */

/** The moment's light: fuller than the head's, the room being its words alone. */
const MOMENT: Dose = {
  horizon: { core: 0.13, reach: 90, px: true },
  glow: { core: 0.09, reach: 0.5 },
  sky: { core: 0.19, reach: 2.2 },
};

/**
 * THE MOMENT, WITH ITS CENTRE: the reel's poster in full light, the screen's
 * one large thing, where the eye lands and where the reel starts; above it, on
 * the page's left line, the reward ("Everything's in") and the acts, standing
 * in the album's light, born over the poster's edge with the room's dark
 * between (the light never sits on the photograph). Shown once; then the page
 * as before.
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
  const sources = useMemo(() => sourcesOf(light), [light]);
  return (
    <div
      data-ep-premiere="rise"
      className={cn(
        "relative flex min-h-screen flex-col bg-background text-foreground",
        ground === "paper" && "dark",
      )}
    >
      <div className="relative isolate">
        <RiseLight sources={sources} dose={MOMENT} birth={DARK + FADE + 2} />
        <div className="relative z-10">
          {side === "host" ? <AppBar over screen={screen} /> : <GuestBar />}
          <div
            className={cn(
              "flex flex-col items-start gap-7 px-5",
              desk ? "pt-14" : "pt-9",
            )}
          >
            <PremiereWords
              side={side}
              moment={moment}
              align="start"
              className={desk ? "max-w-2xl" : undefined}
            />
            <PremiereActs side={side} align="start" />
          </div>
          <div aria-hidden style={{ height: HORIZON }} />
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3 pt-6 pb-3 sm:px-5 sm:pb-5">
        <Poster
          still={album.cover[0]!}
          className="min-h-[200px] w-full flex-1"
        />
      </div>
    </div>
  );
}

/* ── its reach ──────────────────────────────────────────────────────────── */

/** The card's own measures: 1200 by 630 (`EVENT_CARD_SIZE`), the left line its words keep, the measure they fill. */
const CARD = { w: 1200, h: 630, left: 80, measure: 1040, foot: 92 } as const;

/** Every way to set a name in `n` lines, words kept whole. */
function splits(words: readonly string[], n: number): string[][] {
  if (n === 1) return [[words.join(" ")]];
  const out: string[][] = [];
  for (let i = 1; i <= words.length - n + 1; i++)
    for (const rest of splits(words.slice(i), n - 1))
      out.push([words.slice(0, i).join(" "), ...rest]);
  return out;
}

/**
 * THE NAME AS LARGE AS THE CARD ALLOWS, in one to three lines on the left
 * line: Urbanist's bold, tracked tight, runs about 0.52 em a character, so a
 * line of the card's measure stands at 2,000 / its length, up to 190, 170 or
 * 140 px for one, two or three lines, the block within the card's height
 * over its horizon (a renderer cannot measure, so the size is read off the
 * words). "Maya & Jay's Wedding" stands in two lines at 170, "Grandma Rosa's
 * 90th Birthday Lunch" in three at 140: about 9 px at Create's 68, 31 px at a
 * chat's 268.
 */
function nameSet(name: string): { px: number; lines: string[] } {
  const words = name.split(/\s+/).filter(Boolean);
  const caps = [190, 170, 140];
  let best = { px: 0, lines: [name] };
  for (let n = 1; n <= Math.min(3, words.length); n++)
    for (const lines of splits(words, n)) {
      const longest = Math.max(...lines.map((l) => l.length));
      const px = Math.min(
        caps[n - 1]!,
        Math.floor(CARD.measure / (0.52 * longest)),
      );
      if (n * px <= CARD.h - CARD.foot - 70 && px > best.px)
        best = { px, lines };
    }
  return best;
}

/**
 * The card's light, as a renderer reads it: each source a broad pool born just
 * under the card's foot, its born tone fading into its fall's, and the sky
 * over all, in plain pixels and `rgba()` on the card's fixed box.
 */
function cardLight(sources: readonly Source[]): string {
  const at = (s: Source, k: number) => {
    // the born tone near the foot, the fall's tone above, interpolated in OKLab
    const u = Math.min(1, k * 1.6);
    const ra = (s.born.h * Math.PI) / 180;
    const rb = (s.far.h * Math.PI) / 180;
    const A =
      s.born.c * Math.cos(ra) +
      (s.far.c * Math.cos(rb) - s.born.c * Math.cos(ra)) * u;
    const B =
      s.born.c * Math.sin(ra) +
      (s.far.c * Math.sin(rb) - s.born.c * Math.sin(ra)) * u;
    return fitChroma({
      l: s.born.l + (s.far.l - s.born.l) * u,
      c: Math.hypot(A, B),
      h: wrap((Math.atan2(B, A) * 180) / Math.PI),
    });
  };
  const pools = sources.map((s) => {
    const x = Math.round((s.x / 100) * CARD.w);
    const strength = 0.56 * (0.62 + 0.38 * s.w);
    const stops = FALL.map(
      ([t, k]) => `${rgba(at(s, t / 100), strength * k)} ${t}%`,
    ).join(", ");
    return `radial-gradient(ellipse 760px 600px at ${x}px ${CARD.h + 40}px, ${stops})`;
  });
  const far = sources[0]!.far;
  const sky = `radial-gradient(ellipse 1500px 1050px at ${CARD.w / 2}px ${CARD.h + 40}px, ${FALL.map(
    ([t, k]) => `${rgba(far, 0.4 * k)} ${t}%`,
  ).join(", ")})`;
  return [...pools, sky].join(", ");
}

/**
 * THE CARD, THE HEAD IN SMALL: its light and one mark, read at Create's 68 px
 * by the light and the mark's shape (the title beside it there, and under it
 * in every chat, says the name), and beautiful at a chat's 268 px with any
 * name. An open album's mark is its name, as large as it fits, on the left
 * line over the album's light rising from the card's foot (its seed's before
 * its first photo: the card Create shows her is a just-made party's); a
 * Private album's is the house's wordmark over its link's light
 * (`linkLight`), no name, no photograph and no read of one.
 */
function Card({
  variant,
  moment,
}: {
  variant: "open" | "private";
  moment: Moment;
}) {
  const album = useAlbum();
  const albumLight = useAlbumLight();
  const open = variant === "open";
  const light = open
    ? moment.album > 0
      ? albumLight
      : seedLight(album.seed)
    : linkLight(PRIVATE_LINK);
  const sources = useMemo(() => sourcesOf(light), [light]);
  const set = open ? nameSet(album.name) : null;
  return (
    <div
      data-ep-card={variant}
      className="dark relative size-full overflow-hidden bg-[#0b0b0c] text-white"
      style={{ backgroundImage: cardLight(sources) }}
    >
      {set ? (
        <p
          className="absolute font-heading leading-[0.98] tracking-[-0.035em]"
          style={{ left: CARD.left, bottom: CARD.foot, fontSize: set.px }}
        >
          {set.lines.map((line) => (
            <span key={line} className="block whitespace-nowrap">
              {line}
            </span>
          ))}
        </p>
      ) : (
        <span
          className="absolute"
          style={{ left: CARD.left, bottom: CARD.foot + 8 }}
        >
          <Logo className="h-[132px]" />
        </span>
      )}
    </div>
  );
}

/** A tile's light before its first photograph: the seed's horizon at its foot, the tile's own corners keeping it. */
const TILE: Dose = {
  horizon: { core: 0.5, reach: 0.45 },
  glow: { core: 0.24, reach: 0.8 },
  sky: { core: 0.28, reach: 1.5 },
};

/** A party's tile before its first photo: the room with its seed's light rising from its foot, its day over it. */
function SeedTile({ seed }: { seed: string }) {
  const sources = useMemo(() => sourcesOf(seedLight(seed)), [seed]);
  return (
    <RiseLight sources={sources} dose={TILE} birth={0} fade={0} grain={false} />
  );
}

function Tile({ event }: { event: OtherEvent }) {
  return (
    <TileBox className={event.cover ? "" : "dark bg-[#0b0b0c]"}>
      {event.cover ? (
        <Cover still={event.cover} />
      ) : (
        <>
          <SeedTile seed={event.seed} />
          <DayFace event={event} />
        </>
      )}
    </TileBox>
  );
}

/**
 * THE DOOR'S LIGHT: the album's light rising from the sheet's free edge into
 * the album behind (signature r1's `door=seam`), its colour families broad
 * along the edge, born pale and falling into their own. Drawn as the sheet's
 * own glow, so it follows the sheet's corners (his craft note: a lit edge
 * keeps its object's corners) and fades on its own; outside the sheet's box
 * only (an outer shadow never paints inside its box), so nothing lands on it.
 */
function SheetLight({ box }: { box: DOMRect }) {
  const light = useAlbumLight();
  const sources = useMemo(() => sourcesOf(light), [light]);
  const corner = "calc(var(--radius-float) * 1.25)";
  const dx = (s: Source) => Math.round(((s.x - 50) / 100) * box.width * 0.8);
  return (
    <span
      aria-hidden
      data-ep-rise-door=""
      className="pointer-events-none fixed z-[51] block"
      style={{
        left: box.left,
        top: box.top,
        width: box.width,
        height: box.height,
        borderTopLeftRadius: corner,
        borderTopRightRadius: corner,
        boxShadow: [
          ...sources.map(
            (s) => `${dx(s)}px -2px 16px -6px ${rgba(s.born, 0.7)}`,
          ),
          ...sources.map(
            (s) => `${dx(s)}px -28px 76px -30px ${rgba(s.born, 0.42)}`,
          ),
          ...sources.map(
            (s) => `${dx(s)}px -56px 120px -40px ${rgba(s.far, 0.5)}`,
          ),
        ].join(", "),
      }}
    />
  );
}

/** The door: the album's light rising from the sheet's top edge into the album behind. */
function Door({ ground }: { ground: Ground }) {
  return (
    <DoorOver
      page={<GuestPage screen="375" ground={ground} moment={NIGHT} />}
      light={(box) => <SheetLight box={box} />}
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

export const RISE: Kit = {
  id: "rise",
  GuestPage,
  HostPage,
  Premiere,
  Card,
  Tile,
  Door,
  Add,
};
