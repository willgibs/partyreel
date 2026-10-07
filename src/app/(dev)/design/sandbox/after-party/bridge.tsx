"use client";

import "@/components/app/event-feed/event-hub-head-seam.css";
import "./bridge.css";

import { ArrowRight, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  footButton,
  RoomFoot,
  RoomGround,
  RoomHead,
  RoomPage,
} from "@/components/app/create-event-wizard/room";
import {
  chromaOf,
  edgeBand,
  edgeHues,
  type EdgeLight,
  fillGreys,
  intensityOf,
  SEGMENTS,
  type Thumb,
  threeAtMost,
} from "@/components/app/event-feed/event-hub-head-edge";
import { type BoardState, Fit, Frame } from "@/components/lab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";
import { type AlbumStyle, STYLE_NAMES } from "@/lib/disposable/album-style";
import { cn } from "@/lib/utils";

import { ClosedLine, Cover, GuestAlbum, InviteRound, ReelRound } from "./album";
import { type BridgeWay, guestScreen } from "./answers";
import { WEDDING, WEEK } from "./fixtures";
import { type Screen, SCREENS } from "./knobs";
import {
  actsIn,
  find,
  findAll,
  inView,
  parts,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";

/**
 * WHERE A GUEST WHO WANTS HER OWN PARTY IS TAKEN (the `bridge` question):
 * Priya, signed out, ten minutes into Maya & Jay's album a week on, with a
 * birthday next month. Three frames an answer, as the moment runs: the
 * album's top (the header's corner, the one way production gives her), the
 * album's end, and where the way lands.
 *
 * ★ THE ALBUM IS TODAY'S IN EVERY ANSWER, a week on and closed (the board's
 * today for the `over` and `keepsake` questions): the cover's acts without
 * Add, the closed line under it. Only the corner, the end and the landing
 * are this question's, so the three answers differ there and nowhere else.
 *
 * ★ EACH ANSWER, AS ITS OWN ADVOCATE:
 *  - `home` is today exactly: production's quiet ghost Start for free, a link
 *    to `/`, and the home page itself, the real route in a frame, at its top.
 *  - `header` keeps the corner's weight (production's ghost button, the same
 *    size and place) and changes its words and its way: "Make one like this"
 *    speaks of the album she is in, never of our price, and leads through
 *    sign-up into Create already answered in this album's style. What that
 *    buys her is drawn, not captioned: Create's two style questions (the
 *    album's style, the code's look) are carried, so its steppers are two
 *    (her name, then her code) where an unstyled Create's are four, and its
 *    first foot is Create event; a chip under the question names what was
 *    carried, Change beside it.
 *  - `end` is `header` and one line more, where production marks the album's
 *    end: past the last photograph, before Guests, the album's own light
 *    (production's Seam, born at the last row's edge in that row's own
 *    colours: on paper inside a strip of the room, the album's last floor),
 *    and past it one quiet line in the album's voice, "Your party next?" and
 *    Make one like this, into the same Create. Restraint is the craft: no
 *    card, no button, no mark of ours; the light is the album's, never
 *    Partyreel's, and the screen's only one (a closed album's dock carries no
 *    shutter).
 *
 * ★ WHAT RIDES ALONG AND WHAT NEVER DOES: the album's two style answers
 * (`STYLE`: Live, and the code's Classic look), never its name, its guests or
 * its photographs. Her event is her own: the name she types is hers.
 *
 * ★ SHE SIGNS UP FIRST, in every answer: Create sits behind an account
 * (`/dashboard/new`, the (app) gate), so the way is `/login?intent=create`
 * with Create as its `next`. The door is production's (`AccountDoor`), the
 * same in every answer, so it is said in the landing's title rather than
 * drawn as a frame that would not differ.
 *
 * ★ THE LIGHT IS READ, NEVER TYPED: the last row's photographs are read off
 * their own pixels by production's edge read (`event-hub-head-edge.ts`, as
 * the hub's light reads its cover), at each tile's own size, so the light
 * under the grass is the grass's. (A tile's crop is read centred, as the
 * hub's is; the board's tiles hold a few stills a little off centre.)
 *
 * ★ STAND-INS, SAID ONCE: the photographs, faces and counts are the board's
 * (`fixtures.ts`); every press is inert; `?like=` is this drawing's name for
 * the album Create is styled from.
 */

/* ── what the album carries ────────────────────────────────────────────── */

/**
 * MAYA & JAY'S STYLE: the two answers Create asks that the album already
 * gave (`events.capture` and `moderation_mode` as a style, `events.qr_style`).
 * The only things that ride: never the album's name, guests or photographs.
 */
const STYLE: { style: AlbumStyle; look: QrStyleKey } = {
  style: "live",
  look: "classic",
};

/** The album's public slug, as its pretty link prints it: the album Create is styled from. */
const SLUG = new URL(WEDDING.pretty).pathname.split("/").pop() ?? "";

/** The two ways a corner leads: today's, and into Create (through sign-up) in this album's style. */
const WAYS = {
  home: { words: "Start for free", href: "/" },
  create: {
    words: "Make one like this",
    href: `/login?intent=create&next=${encodeURIComponent(`/dashboard/new?like=${SLUG}`)}`,
  },
} as const;

const wayFor = (way: BridgeWay) => (way === "home" ? WAYS.home : WAYS.create);

/* ── the header's corner ───────────────────────────────────────────────── */

/**
 * The corner signed out, as `guest-header.tsx` draws it: production's quiet
 * ghost button around a link. Only its words and its way are an answer's.
 */
function Corner({ way }: { way: BridgeWay }) {
  const { words, href } = wayFor(way);
  return (
    <Button asChild variant="ghost" size="sm">
      <a href={href} tabIndex={-1} data-ap-way="">
        {words}
      </a>
    </Button>
  );
}

/* ── the album's end, in its own light ─────────────────────────────────── */

/** How wide a photograph is read, and how small for its intensity: the hub's own sizes (`event-hub-head-light.tsx`). */
const THUMB_W = 192;
const INTENSITY_PX = 32;

/** A photograph read small, as the hub's light reads one: its pixels at `THUMB_W`, and its light's chroma. */
async function readStill(
  src: string,
): Promise<{ thumb: Thumb; c: number } | null> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const { naturalWidth: nw, naturalHeight: nh } = img;
  if (!nw || !nh) return null;
  const w = Math.min(THUMB_W, nw);
  const h = Math.max(1, Math.round((w * nh) / nw));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const small = document.createElement("canvas");
  small.width = INTENSITY_PX;
  small.height = INTENSITY_PX;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const sctx = small.getContext("2d", { willReadFrequently: true });
  if (!ctx || !sctx) return null;
  ctx.drawImage(img, 0, 0, w, h);
  sctx.drawImage(img, 0, 0, INTENSITY_PX, INTENSITY_PX);
  return {
    thumb: { w, h, px: ctx.getImageData(0, 0, w, h).data },
    c: chromaOf(
      intensityOf(sctx.getImageData(0, 0, INTENSITY_PX, INTENSITY_PX).data),
    ),
  };
}

/**
 * THE LAST ROW'S OWN LIGHT, read off the album as laid and off its
 * photographs' own pixels, by production's edge read (`edgeHues`): the tiles
 * whose foot is the album's foot, each one's visible edge in sixths at its
 * own size, then the strip's six (`SEGMENTS`) each the edge of the
 * photograph standing over it, a grey sixth borrowing its neighbour's
 * (`fillGreys`), at most three hues kept (`threeAtMost`), as soft as the
 * row's own photographs are (`chromaOf`). Null where nothing can be read.
 */
async function lastRowLight(rows: Element): Promise<EdgeLight | null> {
  const tiles = [...rows.children].map((el) => {
    const s = (el as HTMLElement).style;
    return {
      left: parseFloat(s.left),
      width: parseFloat(s.width),
      height: parseFloat(s.height),
      foot: parseFloat(s.top) + parseFloat(s.height),
      src: el.querySelector("img")?.getAttribute("src") ?? "",
    };
  });
  if (!tiles.length) return null;
  const foot = Math.max(...tiles.map((t) => t.foot));
  const last = tiles.filter((t) => Math.abs(t.foot - foot) < 1 && t.src);
  const reads = await Promise.all(
    last.map(async (t) => {
      const read = await readStill(t.src).catch(() => null);
      return read
        ? { ...t, c: read.c, edge: edgeHues(read.thumb, t.width, t.height) }
        : null;
    }),
  );
  const row = reads.filter((r): r is NonNullable<typeof r> => r !== null);
  if (!row.length) return null;
  const right = Math.max(...row.map((t) => t.left + t.width));
  const raw = Array.from({ length: SEGMENTS }, (_, i) => {
    const x = ((i + 0.5) / SEGMENTS) * right;
    const over = row.find((t) => x >= t.left && x <= t.left + t.width);
    if (!over?.edge) return null;
    const j = Math.floor(((x - over.left) / over.width) * SEGMENTS);
    return over.edge[Math.min(SEGMENTS - 1, Math.max(0, j))] ?? null;
  });
  const filled = fillGreys(raw, null);
  if (!filled) return null;
  return {
    hues: threeAtMost(filled),
    c: row.reduce((n, t) => n + t.c, 0) / row.length,
  };
}

/**
 * PAST THE LAST PHOTOGRAPH (the `end` answer): the album's own light at its
 * foot, then one quiet line past its reach, into Create in this style.
 */
function AlbumEnd() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [light, setLight] = useState<EdgeLight | null | "none">(null);
  useEffect(() => {
    // The rows are laid by production's engine at a known width, so their places stand from the first commit.
    const rows = ref.current
      ?.closest("[data-ap-album-box]")
      ?.querySelector("[data-ap-rows]");
    if (!rows) return;
    let gone = false;
    // A read that fails leaves the end unlit and says so (`none`), never a light that is guessed.
    void lastRowLight(rows)
      .catch(() => null)
      .then((read) => {
        if (!gone) setLight(read ?? "none");
      });
    return () => {
      gone = true;
    };
  }, []);
  const lit = light && light !== "none" ? light : null;
  return (
    <div ref={ref} data-ap-past="" className="ap-past">
      <div
        aria-hidden
        data-ap-light={
          lit
            ? [...new Set(lit.hues.map(Math.round))].join(" ")
            : light === "none"
              ? "none"
              : "unread"
        }
        className="ap-past-light"
      >
        <div className="dark ap-past-field">
          {lit ? (
            // Production's Seam: the edge's colours pooled in three soft ellipses, and the edge itself lit.
            <div className="hub-light-lit">
              <div
                className="hub-light-glow"
                style={{ background: edgeBand(lit, "glow") }}
              />
              <div
                className="hub-light-line"
                style={{ background: edgeBand(lit, "line") }}
              />
            </div>
          ) : null}
        </div>
      </div>
      <p
        data-ap-past-line=""
        className="ap-past-line text-reading text-muted-foreground"
      >
        Your party next?{" "}
        <a href={WAYS.create.href} tabIndex={-1} className="ap-past-go">
          Make one like this
          <ArrowRight aria-hidden />
        </a>
      </p>
    </div>
  );
}

/* ── Create, already in this style ─────────────────────────────────────── */

/**
 * What Create carried from the album: its style and its code's look, by the
 * names Create's own screens give them, a tick for answered, and Change.
 */
function Carried() {
  return (
    <span data-ap-carried="" className="ap-carried text-sm">
      <Check aria-hidden className="ap-carried-tick" />
      <span data-ap-carried-words="">
        {STYLE_NAMES[STYLE.style]} · {QR_PRESETS[STYLE.look].label} code
      </span>
      <button
        type="button"
        tabIndex={-1}
        data-ap-carried-change=""
        className="ap-carried-change"
      >
        Change
      </button>
    </span>
  );
}

/**
 * CREATE, OPENING IN THIS ALBUM'S STYLE: production's room (its head, its
 * question in one place, its foot), its two style screens answered by the
 * album, so its steppers are her name and her code, and its first foot is
 * Create event. The name is hers, typed (the field is NameStep's own markup,
 * read-only: the real step's `autoFocus` would pull the lab's page to it).
 */
function CreateCarried() {
  const type = "font-heading text-chapter md:text-title";
  return (
    <RoomGround screen="name">
      <RoomHead
        step={{ at: 1, of: 2 }}
        close={{ href: "/dashboard", label: "Close" }}
      />
      <RoomPage
        question="Name your event"
        questionId="ap-bridge-create-q"
        sub={<Carried />}
      >
        <div className="w-full max-w-[760px]">
          <div className="cr-name relative">
            <Input
              readOnly
              tabIndex={-1}
              value="Priya’s 30th"
              aria-labelledby="ap-bridge-create-q"
              className={cn(
                "cr-name-field h-auto rounded-none border-0 bg-transparent px-0 py-0 text-center shadow-none",
                "focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
                type,
              )}
            />
          </div>
          <span
            aria-hidden
            className="cr-name-rule mt-4 block h-0.5 w-full rounded-full md:mt-5"
          />
          <p className="mt-3 min-h-5" />
        </div>
      </RoomPage>
      <RoomFoot>
        <Button type="button" size="cta" tabIndex={-1} className={footButton}>
          Create event
        </Button>
      </RoomFoot>
    </RoomGround>
  );
}

/* ── the home page, the real route ─────────────────────────────────────── */

/**
 * The dev server's own badge (Next's devtools, `nextjs-portal`) is no part of
 * the page production serves, so the frame hides it: what Will sees is the
 * home page as a guest would meet it.
 */
const PRODUCTION_ONLY = "nextjs-portal{display:none!important}";

/**
 * A REAL ROUTE IN A FRAME, ITS CAPTION READ OFF ITS OWN DOCUMENT (the route
 * is same-origin): read on a schedule until it answers, since a route loads
 * and hydrates on its own clock.
 */
function RouteScene({
  id,
  src,
  w,
  h,
  title,
  measure,
}: {
  id: string;
  src: string;
  w: number;
  h: number;
  title: string;
  measure: Reader;
}) {
  const box = useRef<HTMLDivElement | null>(null);
  const [said, setSaid] = useState("measuring");
  useEffect(() => {
    const read = () => {
      try {
        const frame = box.current?.querySelector("iframe");
        const doc = frame?.contentDocument;
        const win = frame?.contentWindow;
        if (!doc?.body || !win || doc.URL === "about:blank") return;
        const text = measure(doc.body, win);
        if (text) setSaid(text);
      } catch {
        // A document mid-load (or one a reader navigated off the origin): the next read catches it.
      }
    };
    const timers = [600, 1500, 3000, 5000, 8000, 12000].map((ms) =>
      window.setTimeout(read, ms),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [measure, src]);
  return (
    <div ref={box} className="surface-paper">
      <Fit w={w}>
        <Frame
          id={id}
          src={src}
          w={w}
          h={h}
          title={title}
          caption={said}
          css={PRODUCTION_ONLY}
        />
      </Fit>
    </div>
  );
}

/* ── what the frames read ──────────────────────────────────────────────── */

/** Where a link goes, in words, read off its own `href` (`/login` with no `next` lands on the dashboard, `signInLanding`). */
function wayOf(href: string | null): string {
  if (!href) return "nowhere";
  if (href === "/") return "to the home page";
  const [path, query = ""] = href.split("?");
  if (path === "/login") {
    const next = new URLSearchParams(query).get("next");
    if (next?.startsWith("/dashboard/new?like="))
      return "to sign-up, then Create in this album's style";
    return `to sign-up, then ${next ?? "the dashboard"}`;
  }
  return `to ${href}`;
}

/** The album's top: what the corner says, in what weight, and where it leads. */
const readTop: Reader = (root, win) => {
  const corner = find(root, "[data-ap-corner] [data-ap-way]");
  if (!corner || !inView(corner, win)) return null;
  const weight = `${corner.getAttribute("data-variant")} ${win.getComputedStyle(corner).fontSize}`;
  return parts(
    `the corner: "${textOf(corner)}" (${weight})`,
    wayOf(corner.getAttribute("href")),
  );
};

/** The album's end: what stands past the last photograph, in what light, and the dock. */
const readEnd: Reader = (root, win) => {
  const guests = find(root, "section[aria-label='Guests']");
  if (!guests || !inView(guests, win)) return null;
  const past = find(root, "[data-ap-past]");
  const light = find(root, "[data-ap-light]")?.getAttribute("data-ap-light");
  if (past && light === "unread") return null;
  const lit =
    light === "none"
      ? "unlit (no edge to read)"
      : `in the last row's own light (hues ${light})`;
  const end =
    past && inView(past, win)
      ? `past the last photo, ${lit}: "${textOf(find(root, "[data-ap-past-line]"))}"; then Guests and Report`
      : "past the last photo: Guests, then Report, nothing of ours";
  const dock = actsIn(root, win, "[data-ap-dock]");
  return parts(end, dock.length ? `the dock: ${dock.join(", ")}` : "no dock");
};

/**
 * Create's first screen: its question, where its head says she stands (the
 * room's own words for a reader, "Step 1 of N", and its hairlines), what it
 * carried, and its foot.
 */
const readCreate: Reader = (root) => {
  if (!find(root, "[data-app-room]")) return null;
  const step = textOf(find(root, "[data-room-head] .sr-only"));
  const carried = find(root, "[data-ap-carried-words]");
  return parts(
    `"${textOf(find(root, "[data-room-heading]"))}", ${step.toLowerCase()} (${findAll(root, "[data-room-step]").length} hairlines)`,
    carried ? `carried: ${textOf(carried)}, with Change` : "nothing carried",
    `the foot: "${textOf(find(root, "[data-room-foot] button"))}"`,
  );
};

/** The home page as it loads: its headline, and where its own Start free leads her next. */
const readHome: Reader = (root, win) => {
  const h1 = find(root, "main h1");
  if (!h1 || !textOf(h1)) return null;
  const start = findAll(root, "a[href]").find(
    (a) => inView(a, win) && textOf(a).toLowerCase() === "start free",
  );
  return parts(
    `the home page: "${textOf(h1)}"`,
    start
      ? `her way on: its "${textOf(start)}", ${wayOf(start.getAttribute("href"))}`
      : undefined,
  );
};

/* ── the story ─────────────────────────────────────────────────────────── */

/** Maya & Jay's album a week on, signed out, as today but for what the answer places. */
function AlbumAt({
  way,
  screen,
  scroll,
}: {
  way: BridgeWay;
  screen: Screen;
  scroll: "top" | "end";
}) {
  return (
    <GuestAlbum
      screen={screen}
      moment={WEEK}
      corner={<Corner way={way} />}
      cover={
        <Cover
          screen={screen}
          moment={WEEK}
          actions={
            <>
              <ReelRound />
              <InviteRound />
            </>
          }
        />
      }
      under={<ClosedLine />}
      past={way === "end" ? <AlbumEnd /> : undefined}
      scroll={scroll}
      dock={scroll === "end" ? "look" : null}
    />
  );
}

export function BridgeStory({ way, s }: { way: BridgeWay; s: BoardState }) {
  const screen = guestScreen(s);
  const { w, h } = SCREENS[screen];
  const tall = screen === "1440" ? 640 : h;
  return (
    <Story>
      <Scene
        id={`ap-bridge-top-${way}-${screen}`}
        w={w}
        h={tall}
        ground="paper"
        title="Signed out, a week on: the album's top"
        measure={readTop}
      >
        <AlbumAt way={way} screen={screen} scroll="top" />
      </Scene>
      <Scene
        id={`ap-bridge-end-${way}-${screen}`}
        w={w}
        h={tall}
        ground="paper"
        title="Past the last photo: the album's end"
        measure={readEnd}
      >
        <AlbumAt way={way} screen={screen} scroll="end" />
      </Scene>
      {way === "home" ? (
        <RouteScene
          id={`ap-bridge-lands-home-${screen}`}
          src="/"
          w={w}
          h={tall}
          title="Where Start for free lands: the home page, as it is"
          measure={readHome}
        />
      ) : (
        <Scene
          id={`ap-bridge-lands-create-${way}-${screen}`}
          w={w}
          h={tall}
          ground="room"
          title="After she signs up: Create, in this album's style"
          measure={readCreate}
        >
          <CreateCarried />
        </Scene>
      )}
    </Story>
  );
}
