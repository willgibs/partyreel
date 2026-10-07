"use client";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { EmptyAlbum, GuestAlbum, type Place } from "./album";
import { Face, type Palette } from "./face";
import { COVER, NEW_PARTY, PARTY, PRIYA, WEDDING } from "./fixtures";
import { HubScreen, type HubWay } from "./hub";
import { type Ground, groundOf, type Screen, SCREENS, screenOf } from "./knobs";
import { type HoverWay, PartyRow, type RowBeat } from "./row";
import {
  find,
  findAll,
  inView,
  Loupe,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
  Zoom,
} from "./scene";
import { SeedGround, SeedSeam, type SeedWay } from "./seed";
import { PRESENCE } from "./spec";

/**
 * THE PREVIEWS, one per option, each a surface drawn as its moments: the
 * frames production would show, the option's faces placed in them. `spec.ts`
 * says what each decision is; each drawing's file says what is production's
 * and what is a stand-in (`album.tsx`, `hub.tsx`, `row.tsx`, `face.tsx`,
 * `seed.tsx`).
 *
 * ★ A LATER QUESTION IS DRAWN IN THE EARLIER ANSWERS: every face wears the
 * colour answer (asked first), the pointer waits on the album's answer (the
 * row stands where it puts it), and every row wears the pointer answer, so a
 * pick on one question shows on every frame that holds a face.
 *
 * ★ THE NEWEST IS RINGED AS THE CARRIED CALL TAKES IT (`lands`): a flare as a
 * photo lands, then a fine ring. A frame at an instant draws the row AT REST
 * (the fine ring), never mid-flare, so no frame carries a colour of the ring's
 * that the question it answers is not about (the creative director's pass).
 *
 * ★ WHERE THE DETAIL IS A FEW PIXELS, IT IS DRAWN CLOSER, AND SAYS SO: a
 * face's colour, a pointer's lift, the hub's line and doors are judged at
 * twice their size (`Loupe`, `Zoom`), beside the surface at its true size.
 */

/* ── what the frames read ──────────────────────────────────────────────── */

const WEARS: Record<string, string> = {
  held: "ringed in light",
  flare: "flaring in its photograph's light",
  fine: "in a fine ring",
};

/** How far a face stands lifted, off its computed transform's matrix (its sixth term is the vertical move). */
function liftOf(win: Window, el: HTMLElement): number {
  const m = /matrix\(([^)]+)\)/.exec(win.getComputedStyle(el).transform);
  return m ? Number(m[1]!.split(",")[5]) || 0 : 0;
}

/** What the newest wears as it is painted: a ring the sheet draws (a pill's tiny faces draw none). */
function shownRing(row: HTMLElement): string | undefined {
  const face = row.querySelector<HTMLElement>("[data-pr-wears]");
  const ring = face?.querySelector<HTMLElement>(".pr-ring");
  if (!face || !ring) return undefined;
  return ring.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
    ? face.dataset.prWears
    : undefined;
}

/** How a frame's faces are drawn, read off its first face. */
function paletteIn(scope: HTMLElement): string | undefined {
  const face = scope.querySelector<HTMLElement>("[data-slot='avatar']");
  if (!face) return undefined;
  if (face.hasAttribute("data-pr-lit")) return "lit faces";
  if (face.hasAttribute("data-pr-warm")) return "warm faces";
  return "wheel faces";
}

/** The row in view: where it stands, how many faces of how many, who is ringed, and any face lifted and named. */
const readRow: Reader = (root, win) => {
  const rows = findAll(root, "[data-pr-row]").filter((r) => inView(r, win));
  if (rows.length === 0) {
    // Today's list at the album's end (production's `GuestList`), the door's count alone, or where the list went.
    const today = findAll(root, "section[aria-label='Guests']").find((s) =>
      inView(s, win),
    );
    if (today) return `today's list at the album's end: "${textOf(today)}"`;
    const door = find(root, "[data-pr-door]");
    if (door && inView(door, win))
      return `at the door: "${textOf(door)}", no faces`;
    const album = find(root, "[data-pr-album]");
    if (!album) return null;
    const at = album.dataset.prAlbum;
    return at === "cover" || at === "bar"
      ? `no list at the album's end: the row ${at === "cover" ? "on the cover" : "in the album's bar"} opens it`
      : "no faces in view";
  }
  const row = rows[0]!;
  const loupe = row.closest("[data-pr-loupe]") !== null;
  const place = row.closest<HTMLElement>("[data-pr-place]")?.dataset.prPlace;
  const faces = row.querySelectorAll("[data-pr-face]").length;
  const count = row.querySelector<HTMLElement>("[data-pr-count]");
  const naming = count?.hasAttribute("data-pr-naming") ?? false;
  const wears = shownRing(row);
  const top = [...row.querySelectorAll<HTMLElement>("[data-pr-face]")]
    .map((f) => ({ f, y: liftOf(win, f) }))
    .filter((x) => x.y < -0.5)
    .sort((a, b) => a.y - b.y)[0];
  const where = loupe
    ? "closer, at twice its size"
    : place === "cover"
      ? "on the cover"
      : place === "bar"
        ? "in the album's bar"
        : "at the album's end";
  return parts(
    `the row ${where}`,
    `${faces} ${paletteIn(row) ?? "faces"}${count && !naming ? ` of "${count.textContent}"` : ""}`,
    wears ? `the newest ${WEARS[wears] ?? wears}` : "the newest unringed",
    top
      ? `face ${Number(top.f.dataset.prFace) + 1} lifted ${Math.abs(top.y).toFixed(1)}px`
      : undefined,
    naming ? `the count says "${count?.textContent ?? ""}"` : undefined,
  );
};

/** The hub: where her guests are drawn, at rest or folded. */
const readHub: Reader = (root, win) => {
  const hub = find(root, "[data-pr-hub]");
  if (!hub) return null;
  const row = findAll(root, "[data-pr-row]").find((r) => inView(r, win));
  const glyph = findAll(root, "[data-slot='glyph-count']").find(
    (g) => inView(g, win) && /guest/.test(g.getAttribute("aria-label") ?? ""),
  );
  const folded = hub.dataset.prHub === "folded";
  const where = row
    ? row.closest(".hub-door")
      ? `faces on the Guests ${folded ? "pill" : "door"}`
      : "faces on the cover's line"
    : glyph
      ? `the people glyph, "${glyph.getAttribute("aria-label")}"`
      : folded
        ? "the Guests pill's glyph, as today"
        : "the Guests door's glyph, as today";
  const ring = row ? shownRing(row) : undefined;
  return parts(
    where,
    row ? paletteIn(row) : undefined,
    ring ? `the newest ${WEARS[ring] ?? ring}` : undefined,
  );
};

/** A new party's cover: what lights it. */
const readSeed: Reader = (root) => {
  const head = find(root, "[data-event-head]");
  if (!head) return null;
  const seed = head.querySelector<HTMLElement>("[data-pr-seed]");
  const seam = find(root, "[data-hub-light]");
  const way = seed
    ? seed.dataset.prSeed === "lamp"
      ? seed.dataset.prSide === "hub"
        ? "the room dark, the party's seed in the Seam alone"
        : "the party's seed, a lamp, its light pooled behind the name"
      : "the party's seed, its colour edge to edge"
    : "the house light";
  return parts(
    way,
    seam
      ? `the Seam ${seam.dataset.hubLight === "seed" ? "in the seed's light" : "in the house's"}`
      : undefined,
  );
};

/** A face at its largest: how it is drawn. */
const readFace: Reader = (root) => {
  const face = find(root, "[data-pr-own] [data-slot='avatar']");
  if (!face) return null;
  return face.hasAttribute("data-pr-lit")
    ? "lit: her hue as light falling across a disc of the room"
    : face.hasAttribute("data-pr-warm")
      ? "warm: her own mesh, its hue from the ember's arc"
      : "the wheel: her own mesh, any hue";
};

/** The whole list: how many faces, and how they are drawn. */
const readCrowd: Reader = (root) => {
  const crowd = find(root, "[data-pr-crowd]");
  if (!crowd) return null;
  const n = crowd.querySelectorAll("[data-slot='avatar']").length;
  return `${n} guests as the list opens them, ${paletteIn(crowd) ?? "faces"}`;
};

/* ── the row, as every frame draws it ──────────────────────────────────── */

type RowLook = {
  hover: HoverWay;
  palette: Palette;
  beat?: RowBeat;
  /** A drawn instant, the pointer held where `pointer` says. */
  instant?: boolean;
  pointer?: number | null;
  play?: "hover";
};

/** The party's row for a place: on the cover's photograph or the page, sized for its line. */
function rowFor(place: Place, screen: Screen, ground: Ground, look: RowLook) {
  const desk = screen === "1440";
  const photo = place === "cover";
  return (
    <PartyRow
      faces={PARTY}
      joiner={PRIYA}
      count={WEDDING.guests}
      shown={desk ? 8 : 6}
      size={photo ? (desk ? "lg" : "default") : desk ? "default" : "sm"}
      on={photo ? "photo" : "page"}
      ground={ground}
      ring="lands"
      // An instant is the row at rest (the fine ring); a live row is Theo's run landing, its flare spent on arrival.
      beat={look.beat ?? (look.instant ? "later" : "adding")}
      hover={look.hover}
      instant={look.instant}
      pointer={look.pointer ?? null}
      play={look.play}
      palette={look.palette}
    />
  );
}

/** The cover's photograph where its foot meets the row, for a loupe. */
const COVER_FOOT = { src: COVER.src, focus: "50% 78%" };

/** A frame cropped to the row's place: the cover's foot, or the bar. */
const CROP = {
  cover: { h: 380, offset: 196 },
  bar: { h: 300, offset: 120 },
} as const;

/* ── colour: how a face with no photograph is coloured ─────────────────── */

/** Priya's own face at its largest, as her page's head draws it (`profile-head.tsx`: the face, her name, when she joined). */
function OwnFace({ palette }: { palette: Palette }) {
  return (
    <div data-pr-own="" className="flex items-center gap-5 px-5 py-6">
      <Face
        seed={PRIYA.seed}
        name={PRIYA.name}
        palette={palette}
        size="xl"
        initial="text-2xl"
      />
      <div className="min-w-0">
        <p className="font-heading text-page">{PRIYA.name}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Joined September 2026
        </p>
      </div>
    </div>
  );
}

/**
 * ALL 38, AS THE LIST OPENS THEM: production's chips (`guest-list.tsx`'s
 * `CHIP`, a face and a name in a capsule, the list's own order, names A to
 * Z), every face in the palette asked. A palette parts most at a crowd's size.
 */
function Crowd({ palette }: { palette: Palette }) {
  const people = [...PARTY].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div data-pr-crowd="" className="px-4 py-4">
      <p className="mb-3 text-label font-semibold text-muted-foreground uppercase">
        Guests
      </p>
      <ul className="flex flex-wrap items-center gap-1.5">
        {people.map((p) => (
          <li
            key={p.seed}
            className="flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm"
          >
            <Face
              seed={p.seed}
              name={p.name}
              palette={palette}
              size="sm"
              initial="text-[10px]"
            />
            <span className="max-w-40 truncate">{p.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ColourStory({ palette, look }: { palette: Palette; look: RowLook }) {
  const row = (ground: Ground, at: Place) =>
    rowFor(at, "375", ground, { ...look, palette, instant: true });
  return (
    <Story>
      <Loupe
        id={`pr-colour-loupe-${palette}`}
        w={600}
        h={150}
        ground="room"
        photo={COVER_FOOT}
        title="Closer: the row on the cover (twice its size)"
        measure={readRow}
      >
        {row("room", "cover")}
      </Loupe>
      <Scene
        id={`pr-colour-cover-${palette}`}
        w={375}
        h={CROP.cover.h}
        ground="room"
        title="On a photograph: the cover"
        measure={readRow}
      >
        <GuestAlbum
          screen="375"
          place="cover"
          palette={palette}
          row={row("room", "cover")}
          scroll="row"
          rowOffset={CROP.cover.offset}
        />
      </Scene>
      <Scene
        id={`pr-colour-paper-${palette}`}
        w={375}
        h={CROP.bar.h}
        ground="paper"
        title="On paper: the album's bar"
        measure={readRow}
      >
        <GuestAlbum
          screen="375"
          place="bar"
          palette={palette}
          row={row("paper", "bar")}
          scroll="row"
          rowOffset={CROP.bar.offset}
        />
      </Scene>
      <Scene
        id={`pr-colour-crowd-${palette}`}
        w={375}
        h={470}
        ground="paper"
        title="All 38, as the list opens them"
        measure={readCrowd}
      >
        <Crowd palette={palette} />
      </Scene>
      <Scene
        id={`pr-colour-own-${palette}`}
        w={375}
        h={140}
        ground="paper"
        title="Priya's own face, at its largest"
        measure={readFace}
      >
        <OwnFace palette={palette} />
      </Scene>
    </Story>
  );
}

/* ── album: where the row stands ───────────────────────────────────────── */

/**
 * EACH PLACE'S MOMENTS: today's list on her first screen and at the album's
 * end, where it stands; the cover on her first screen, on a bright photograph
 * and at the door (the privacy frame: a count alone); the bar on her first
 * screen and scrolled to it. At a desk a frame is cut to the cover's height,
 * so a place's frames stand together.
 */
function AlbumStory({
  place,
  screen,
  ground,
  look,
}: {
  place: Place;
  screen: Screen;
  ground: Ground;
  look: RowLook;
}) {
  const { w, h } = SCREENS[screen];
  const desk = screen === "1440";
  // Today's list at the foot is production's own; a new place draws the row.
  const row =
    place === "foot" ? undefined : rowFor(place, screen, ground, look);
  const base = { screen, place, row, palette: look.palette } as const;
  const frames: {
    key: string;
    title: string;
    album: Parameters<typeof GuestAlbum>[0];
    height: number;
  }[] = [
    {
      key: "top",
      title: "Her first screen",
      album: { ...base, scroll: "top" },
      height: desk ? 720 : h,
    },
  ];
  if (place === "foot")
    frames.push({
      key: "end",
      title: "Scrolled to the album's end",
      album: { ...base, scroll: "end" },
      height: desk ? 640 : h,
    });
  if (place === "cover")
    frames.push(
      {
        key: "bright",
        title: "On a bright photograph",
        album: { ...base, scroll: "top", cover: "bright" },
        height: desk ? 720 : h,
      },
      {
        // Cut to the cover: behind a door the album under it is the door's (a teaser, a lock), never these rows.
        key: "door",
        title: "At the door: the count alone, no faces",
        album: { ...base, scroll: "top", cover: "door" },
        height: 560,
      },
    );
  if (place === "bar")
    frames.push({
      key: "bar",
      title: "Scrolled to the album's bar",
      album: { ...base, scroll: "row", rowOffset: desk ? 120 : 160 },
      height: desk ? 420 : 520,
    });
  return (
    <Story>
      {frames.map((f) => (
        <Scene
          key={f.key}
          id={`pr-album-${f.key}-${place}-${screen}`}
          w={w}
          h={f.height}
          ground={ground}
          title={f.title}
          measure={readRow}
        >
          <GuestAlbum {...f.album} />
        </Scene>
      ))}
    </Story>
  );
}

/* ── hover: how the row answers a pointer ──────────────────────────────── */

const HELD: readonly { at: number; title: string }[] = [
  { at: 0, title: "Closer: the pointer on Theo, the newest" },
  { at: 3, title: "Closer: the pointer on a face mid-row" },
];

function HoverStory({
  hover,
  place,
  ground,
  palette,
}: {
  hover: HoverWay;
  place: Place;
  ground: Ground;
  palette: Palette;
}) {
  const photo = place === "cover" ? COVER_FOOT : undefined;
  return (
    <Story>
      <Loupe
        id={`pr-hover-play-${hover}-${place}`}
        w={780}
        h={170}
        ground={ground}
        photo={photo}
        title="Closer, playing: a pointer drifting along the row (twice its size)"
        measure={readRow}
      >
        {rowFor(place, "1440", ground, { hover, palette, play: "hover" })}
      </Loupe>
      {HELD.map(({ at, title }) => (
        <Loupe
          key={at}
          id={`pr-hover-${at}-${hover}-${place}`}
          w={780}
          h={150}
          ground={ground}
          photo={photo}
          title={title}
          measure={readRow}
        >
          {rowFor(place, "1440", ground, {
            hover,
            palette,
            instant: true,
            pointer: at,
          })}
        </Loupe>
      ))}
    </Story>
  );
}

/* ── hub: where her guests stand ───────────────────────────────────────── */

function hubRow(screen: Screen, look: RowLook, form: "line" | "door" | "pill") {
  const line = form === "line";
  return (
    <PartyRow
      faces={PARTY}
      count={WEDDING.guests}
      shown={line ? (screen === "1440" ? 6 : 5) : form === "door" ? 3 : 2}
      size={line ? "sm" : form === "door" ? "xs" : "xxs"}
      on={line ? "photo" : "page"}
      ring="lands"
      beat="later"
      hover={line ? look.hover : "still"}
      palette={look.palette}
      // The line's own number follows the faces (hub.tsx, in the glyph count's type), so the row says none of its own.
      label={false}
      className={line ? undefined : "pr-row-door"}
    />
  );
}

/**
 * HER HUB, CLOSER FIRST: the cover's line and the doors, at rest and folded,
 * at twice their size (the faces are 16 to 22px at a desk), then the hub
 * whole with its doors at rest.
 */
function HubStory({
  way,
  screen,
  look,
}: {
  way: HubWay;
  screen: Screen;
  look: RowLook;
}) {
  const { w } = SCREENS[screen];
  const people = way === "line" ? hubRow(screen, look, "line") : undefined;
  const door = way === "door" ? hubRow(screen, look, "door") : undefined;
  const pill = way === "door" ? hubRow(screen, look, "pill") : undefined;
  const closer = screen === "1440" ? 200 : 170;
  return (
    <Story>
      <Zoom
        id={`pr-hub-line-${way}-${screen}`}
        w={w}
        h={closer}
        focus="[data-pr-hub-facts]"
        title="Closer: the cover's line (twice its size)"
        measure={readHub}
      >
        <HubScreen screen={screen} people={people} door={door} />
      </Zoom>
      <Zoom
        id={`pr-hub-doors-${way}-${screen}`}
        w={w}
        h={closer}
        focus=".hub-doors"
        title="Closer: the doors at rest"
        measure={readHub}
      >
        <HubScreen screen={screen} people={people} door={door} />
      </Zoom>
      <Zoom
        id={`pr-hub-pills-${way}-${screen}`}
        w={w}
        h={screen === "1440" ? 140 : 130}
        focus=".hub-band[data-stuck]"
        title="Closer: scrolled, the doors folded under the bar"
        measure={readHub}
      >
        <HubScreen screen={screen} doorFolded={pill} folded />
      </Zoom>
      <Scene
        id={`pr-hub-rest-${way}-${screen}`}
        w={w}
        h={screen === "1440" ? 640 : 760}
        title="Her hub, whole"
        measure={readHub}
      >
        <HubScreen screen={screen} people={people} door={door} />
      </Scene>
    </Story>
  );
}

/* ── atmosphere: a party before its first photograph ───────────────────── */

function AtmosphereStory({ way, palette }: { way: SeedWay; palette: Palette }) {
  return (
    <Story>
      <Scene
        id={`pr-seed-album-${way}-${palette}`}
        w={375}
        h={812}
        title="The first guest's album, nobody has added"
        measure={readSeed}
      >
        <EmptyAlbum
          screen="375"
          ground={
            <SeedGround
              seed={NEW_PARTY.seed}
              way={way}
              side="album"
              palette={palette}
            />
          }
        />
      </Scene>
      <Scene
        id={`pr-seed-hub-${way}-${palette}`}
        w={1440}
        h={640}
        title="Maya's hub the morning after she made it"
        measure={readSeed}
      >
        <HubScreen
          screen="1440"
          empty
          ground={
            way === "house" ? undefined : (
              <SeedGround
                seed={NEW_PARTY.seed}
                way={way}
                side="hub"
                palette={palette}
              />
            )
          }
          seam={
            way === "house" ? undefined : (
              <SeedSeam seed={NEW_PARTY.seed} palette={palette} />
            )
          }
        />
      </Scene>
    </Story>
  );
}

/* ── the map ───────────────────────────────────────────────────────────── */

const at = (s: BoardState) => screenOf(s.screen);
const desk = (s: BoardState) => screenOf(s.desk, "1440");
const on = (s: BoardState) => groundOf(s.ground);
const placeOf = (s: BoardState): Place =>
  s.album === "cover" || s.album === "bar" ? s.album : "foot";
const hoverOf = (s: BoardState): HoverWay =>
  s.hover === "comb" || s.hover === "settled" ? s.hover : "still";
const paletteOf = (s: BoardState): Palette =>
  s.colour === "warm" || s.colour === "lit" ? s.colour : "wheel";
const lookOf = (s: BoardState): RowLook => ({
  hover: hoverOf(s),
  palette: paletteOf(s),
});

const PREVIEWS: PreviewsFor<typeof PRESENCE> = {
  "colour.wheel": (s) => <ColourStory palette="wheel" look={lookOf(s)} />,
  "colour.warm": (s) => <ColourStory palette="warm" look={lookOf(s)} />,
  "colour.lit": (s) => <ColourStory palette="lit" look={lookOf(s)} />,
  "album.foot": (s) => (
    <AlbumStory place="foot" screen={at(s)} ground={on(s)} look={lookOf(s)} />
  ),
  "album.cover": (s) => (
    <AlbumStory place="cover" screen={at(s)} ground={on(s)} look={lookOf(s)} />
  ),
  "album.bar": (s) => (
    <AlbumStory place="bar" screen={at(s)} ground={on(s)} look={lookOf(s)} />
  ),
  "hover.still": (s) => (
    <HoverStory
      hover="still"
      place={placeOf(s)}
      ground={on(s)}
      palette={paletteOf(s)}
    />
  ),
  "hover.comb": (s) => (
    <HoverStory
      hover="comb"
      place={placeOf(s)}
      ground={on(s)}
      palette={paletteOf(s)}
    />
  ),
  "hover.settled": (s) => (
    <HoverStory
      hover="settled"
      place={placeOf(s)}
      ground={on(s)}
      palette={paletteOf(s)}
    />
  ),
  "hub.count": (s) => (
    <HubStory way="count" screen={desk(s)} look={lookOf(s)} />
  ),
  "hub.line": (s) => <HubStory way="line" screen={desk(s)} look={lookOf(s)} />,
  "hub.door": (s) => <HubStory way="door" screen={desk(s)} look={lookOf(s)} />,
  "atmosphere.house": (s) => (
    <AtmosphereStory way="house" palette={paletteOf(s)} />
  ),
  "atmosphere.lamp": (s) => (
    <AtmosphereStory way="lamp" palette={paletteOf(s)} />
  ),
  "atmosphere.field": (s) => (
    <AtmosphereStory way="field" palette={paletteOf(s)} />
  ),
};

export function PresenceBoard() {
  return <ExplorationBoard spec={PRESENCE} previews={PREVIEWS} />;
}
