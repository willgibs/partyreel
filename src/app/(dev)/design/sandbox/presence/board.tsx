"use client";

import {
  type BoardState,
  ExplorationBoard,
  type PreviewsFor,
} from "@/components/lab";

import { EmptyAlbum, GuestAlbum, type Place } from "./album";
import { COVER, NEW_PARTY, PARTY, PRIYA, WEDDING } from "./fixtures";
import { HubScreen, type HubWay } from "./hub";
import { type Ground, groundOf, type Screen, SCREENS, screenOf } from "./knobs";
import { Face, type Palette } from "./face";
import { type HoverWay, PartyRow, type RingWay, type RowBeat } from "./row";
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
} from "./scene";
import { SeedGround, SeedSeam, type SeedWay } from "./seed";
import { PRESENCE } from "./spec";

/**
 * THE PREVIEWS, one per option, each a surface drawn as its moments: the
 * frames production would show, the option's row placed in them. `spec.ts`
 * says what each decision is; each drawing's file says what is production's
 * and what is a stand-in (`album.tsx`, `hub.tsx`, `row.tsx`, `seed.tsx`).
 *
 * ★ A LATER QUESTION IS DRAWN IN THE EARLIER ANSWERS: the newest's ring and
 * the pointer wait on the album's answer (the row stands where it puts it),
 * and every row anywhere wears the newest and pointer answers of the moment,
 * so a pick on one question shows on every frame that holds a row.
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

/** The row in view: where it stands, how many faces of how many, who is ringed and how, and any face lifted. */
const readRow: Reader = (root, win) => {
  const rows = findAll(root, "[data-pr-row]").filter((r) => inView(r, win));
  if (rows.length === 0) {
    // Today's list at the album's end (production's `GuestList`), or no faces in view at all.
    const today = findAll(root, "section[aria-label='Guests']").find((s) =>
      inView(s, win),
    );
    if (today) return `today's list at the album's end: "${textOf(today)}"`;
    return find(root, "[data-pr-album]") ? "no faces in view" : null;
  }
  const row = rows[0]!;
  const place = row.closest<HTMLElement>("[data-pr-place]")?.dataset.prPlace;
  const faces = row.querySelectorAll("[data-pr-face]").length;
  const count = textOf(row.querySelector("[data-pr-count]"));
  const wears =
    row.querySelector<HTMLElement>("[data-pr-wears]")?.dataset.prWears;
  const lifted = [...row.querySelectorAll<HTMLElement>("[data-pr-face]")]
    .map((f) => ({ f, y: liftOf(win, f) }))
    .filter((x) => x.y < -0.5)
    .sort((a, b) => a.y - b.y);
  const top = lifted[0];
  const name = textOf(row.querySelector("[data-pr-name]"));
  const where =
    place === "cover"
      ? "on the cover"
      : place === "bar"
        ? "in the album's bar"
        : "at the album's end";
  return parts(
    `the row ${where}`,
    `${faces} faces${count ? ` of ${count}` : ""}`,
    wears ? `the newest ${WEARS[wears] ?? wears}` : "the newest unringed",
    top
      ? `face ${Number(top.f.dataset.prFace) + 1} lifted ${Math.abs(top.y).toFixed(1)}px${name ? `, named "${name}"` : ""}`
      : undefined,
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
        : "no faces in view";
  const ring =
    row?.querySelector<HTMLElement>("[data-pr-wears]")?.dataset.prWears;
  return parts(where, ring ? `the newest ${WEARS[ring] ?? ring}` : undefined);
};

/** A new party's cover: what lights it. */
const readSeed: Reader = (root) => {
  const head = find(root, "[data-event-head]");
  if (!head) return null;
  const seed = head.querySelector<HTMLElement>("[data-pr-seed]");
  return seed
    ? seed.dataset.prSeed === "lamp"
      ? "the party's seed, a lamp in the dark"
      : "the party's seed, its mesh edge to edge"
    : "the house light";
};

/* ── the row, as every frame draws it ──────────────────────────────────── */

type RowLook = {
  ring: RingWay;
  hover: HoverWay;
  palette: Palette;
  beat?: RowBeat;
  /** A drawn instant, the pointer held where `pointer` says. */
  instant?: boolean;
  pointer?: number | null;
  play?: "ring" | "hover";
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
      ring={look.ring}
      beat={look.beat ?? "adding"}
      hover={look.hover}
      instant={look.instant}
      pointer={look.pointer ?? null}
      play={look.play}
      palette={look.palette}
    />
  );
}

/* ── album: where the row stands ───────────────────────────────────────── */

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
  // Today's list at the foot is production's own; a new place draws the row.
  const row =
    place === "foot" ? undefined : rowFor(place, screen, ground, look);
  return (
    <Story>
      <Scene
        id={`pr-album-top-${place}-${screen}`}
        w={w}
        h={h}
        ground={ground}
        title="Her first screen"
        measure={readRow}
      >
        <GuestAlbum screen={screen} place={place} row={row} scroll="top" />
      </Scene>
      <Scene
        id={`pr-album-end-${place}-${screen}`}
        w={w}
        h={screen === "1440" ? 640 : h}
        ground={ground}
        title="Scrolled to the album's end"
        measure={readRow}
      >
        <GuestAlbum screen={screen} place={place} row={row} scroll="end" />
      </Scene>
    </Story>
  );
}

/* ── colour: how a face with no photograph is coloured ─────────────────── */

/** Priya's own face at its largest, as her page's head draws it (`profile-head.tsx`: the face, her name, when she joined). */
function OwnFace({ palette }: { palette: Palette }) {
  return (
    <div className="flex items-center gap-5 px-5 py-6">
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

const readFace: Reader = (root) => {
  const face = find(root, "[data-slot='avatar']");
  if (!face) return null;
  return face.hasAttribute("data-pr-lit")
    ? "lit: a disc of the room, her hue as light"
    : "a disc of her own colour";
};

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
          row={row("paper", "bar")}
          scroll="row"
          rowOffset={CROP.bar.offset}
        />
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

/* ── newest: how the row rings who added last ──────────────────────────── */

const BEATS: readonly { beat: RowBeat; title: string }[] = [
  { beat: "adding", title: "Theo's photos landing" },
  { beat: "later", title: "An hour later, nobody adding" },
  { beat: "joined", title: "Priya's first photo lands" },
];

/** The cover's photograph where its foot meets the row, for a loupe. */
const COVER_FOOT = { src: COVER.src, focus: "50% 78%" };

/** A frame cropped to the row's place: the cover's foot, the bar, or the album's end. */
const CROP: Record<Place, { h: number; offset: number }> = {
  cover: { h: 380, offset: 196 },
  bar: { h: 300, offset: 120 },
  foot: { h: 300, offset: 120 },
};

function NewestStory({
  ring,
  place,
  ground,
  hover,
  palette,
}: {
  ring: RingWay;
  place: Place;
  ground: Ground;
  hover: HoverWay;
  palette: Palette;
}) {
  const crop = CROP[place];
  return (
    <Story>
      <Loupe
        id={`pr-newest-play-${ring}-${place}`}
        w={600}
        h={150}
        ground={ground}
        photo={place === "cover" ? COVER_FOOT : undefined}
        title="Closer, playing: Theo's run lands, a quiet hour, Priya joins (twice its size)"
        measure={readRow}
      >
        {rowFor(place, "375", ground, { ring, hover, palette, play: "ring" })}
      </Loupe>
      {BEATS.map(({ beat, title }) => (
        <Scene
          key={beat}
          id={`pr-newest-${beat}-${ring}-${place}`}
          w={375}
          h={crop.h}
          ground={ground}
          title={title}
          measure={readRow}
        >
          <GuestAlbum
            screen="375"
            place={place}
            row={rowFor(place, "375", ground, {
              ring,
              hover,
              palette,
              beat,
              instant: true,
            })}
            scroll="row"
            rowOffset={crop.offset}
          />
        </Scene>
      ))}
    </Story>
  );
}

/* ── hover: how the row answers a pointer ──────────────────────────────── */

const HELD: readonly { at: number; title: string }[] = [
  { at: 0, title: "The pointer on Theo, the newest" },
  { at: 3, title: "The pointer on a face mid-row" },
];

function HoverStory({
  hover,
  place,
  ground,
  ring,
  palette,
}: {
  hover: HoverWay;
  place: Place;
  ground: Ground;
  ring: RingWay;
  palette: Palette;
}) {
  // Each held instant cropped to the row's own line: the name above it, the actions beside it.
  const h = place === "cover" ? 210 : 170;
  const offset = place === "cover" ? 118 : 90;
  return (
    <Story>
      <Loupe
        id={`pr-hover-play-${hover}-${place}`}
        w={780}
        h={170}
        ground={ground}
        photo={place === "cover" ? COVER_FOOT : undefined}
        title="Closer, playing: a pointer drifting along the row (twice its size)"
        measure={readRow}
      >
        {rowFor(place, "1440", ground, {
          ring,
          hover,
          palette,
          play: "hover",
        })}
      </Loupe>
      {HELD.map(({ at, title }) => (
        <Scene
          key={at}
          id={`pr-hover-${at}-${hover}-${place}`}
          w={1440}
          h={h}
          ground={ground}
          title={title}
          measure={readRow}
        >
          <GuestAlbum
            screen="1440"
            place={place}
            row={rowFor(place, "1440", ground, {
              ring,
              hover,
              palette,
              instant: true,
              pointer: at,
            })}
            scroll="row"
            rowOffset={offset}
          />
        </Scene>
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
      ring={look.ring}
      beat="adding"
      hover={line ? look.hover : "still"}
      palette={look.palette}
      label={line}
      className={line ? undefined : "pr-row-door"}
    />
  );
}

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
  return (
    <Story>
      <Scene
        id={`pr-hub-rest-${way}-${screen}`}
        w={w}
        h={screen === "1440" ? 640 : 760}
        title="Her hub, the doors at rest"
        measure={readHub}
      >
        <HubScreen screen={screen} people={people} door={door} />
      </Scene>
      <Scene
        id={`pr-hub-folded-${way}-${screen}`}
        w={w}
        h={screen === "1440" ? 300 : 360}
        title="Scrolled, the doors folded under the bar"
        measure={readHub}
      >
        <HubScreen screen={screen} doorFolded={pill} folded />
      </Scene>
    </Story>
  );
}

/* ── atmosphere: a party before its first photograph ───────────────────── */

function AtmosphereStory({ way }: { way: SeedWay }) {
  return (
    <Story>
      <Scene
        id={`pr-seed-album-${way}`}
        w={375}
        h={812}
        title="The first guest's album, nobody has added"
        measure={readSeed}
      >
        <EmptyAlbum
          screen="375"
          ground={<SeedGround seed={NEW_PARTY.seed} way={way} side="album" />}
        />
      </Scene>
      <Scene
        id={`pr-seed-hub-${way}`}
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
              <SeedGround seed={NEW_PARTY.seed} way={way} side="hub" />
            )
          }
          seam={
            way === "house" ? undefined : <SeedSeam seed={NEW_PARTY.seed} />
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
const ringOf = (s: BoardState): RingWay =>
  s.newest === "white" || s.newest === "photo" ? s.newest : "lands";
const hoverOf = (s: BoardState): HoverWay =>
  s.hover === "comb" || s.hover === "named" ? s.hover : "still";
const paletteOf = (s: BoardState): Palette =>
  s.colour === "warm" || s.colour === "lit" ? s.colour : "wheel";
const lookOf = (s: BoardState): RowLook => ({
  ring: ringOf(s),
  hover: hoverOf(s),
  palette: paletteOf(s),
});

const PREVIEWS: PreviewsFor<typeof PRESENCE> = {
  "album.foot": (s) => (
    <AlbumStory place="foot" screen={at(s)} ground={on(s)} look={lookOf(s)} />
  ),
  "album.cover": (s) => (
    <AlbumStory place="cover" screen={at(s)} ground={on(s)} look={lookOf(s)} />
  ),
  "album.bar": (s) => (
    <AlbumStory place="bar" screen={at(s)} ground={on(s)} look={lookOf(s)} />
  ),
  "colour.wheel": (s) => <ColourStory palette="wheel" look={lookOf(s)} />,
  "colour.warm": (s) => <ColourStory palette="warm" look={lookOf(s)} />,
  "colour.lit": (s) => <ColourStory palette="lit" look={lookOf(s)} />,
  "newest.white": (s) => (
    <NewestStory
      ring="white"
      place={placeOf(s)}
      ground={on(s)}
      hover={hoverOf(s)}
      palette={paletteOf(s)}
    />
  ),
  "newest.photo": (s) => (
    <NewestStory
      ring="photo"
      place={placeOf(s)}
      ground={on(s)}
      hover={hoverOf(s)}
      palette={paletteOf(s)}
    />
  ),
  "newest.lands": (s) => (
    <NewestStory
      ring="lands"
      place={placeOf(s)}
      ground={on(s)}
      hover={hoverOf(s)}
      palette={paletteOf(s)}
    />
  ),
  "hover.still": (s) => (
    <HoverStory
      hover="still"
      place={placeOf(s)}
      ground={on(s)}
      ring={ringOf(s)}
      palette={paletteOf(s)}
    />
  ),
  "hover.comb": (s) => (
    <HoverStory
      hover="comb"
      place={placeOf(s)}
      ground={on(s)}
      ring={ringOf(s)}
      palette={paletteOf(s)}
    />
  ),
  "hover.named": (s) => (
    <HoverStory
      hover="named"
      place={placeOf(s)}
      ground={on(s)}
      ring={ringOf(s)}
      palette={paletteOf(s)}
    />
  ),
  "hub.count": (s) => (
    <HubStory way="count" screen={desk(s)} look={lookOf(s)} />
  ),
  "hub.line": (s) => <HubStory way="line" screen={desk(s)} look={lookOf(s)} />,
  "hub.door": (s) => <HubStory way="door" screen={desk(s)} look={lookOf(s)} />,
  "atmosphere.house": <AtmosphereStory way="house" />,
  "atmosphere.lamp": <AtmosphereStory way="lamp" />,
  "atmosphere.field": <AtmosphereStory way="field" />,
};

export function PresenceBoard() {
  return <ExplorationBoard spec={PRESENCE} previews={PREVIEWS} />;
}
