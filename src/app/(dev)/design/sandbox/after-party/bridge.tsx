"use client";

import "./bridge.css";

import { CalendarPlus, Check, LifeBuoy, LogIn, Pencil } from "lucide-react";
import { type ComponentProps, useEffect, useRef, useState } from "react";

import {
  footButton,
  RoomFoot,
  RoomGround,
  RoomHead,
  RoomPage,
} from "@/components/app/create-event-wizard/room";
import { DoorLamp } from "@/components/guest/door/lit";
import { KEEP_TITLE } from "@/components/guest/save-account-prompt";
import { type BoardState, Fit, Frame } from "@/components/lab";
import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { QR_PRESETS, type QrStyleKey } from "@/lib/constants/qr-presets";
import { HELP_CENTER_HREF } from "@/lib/content/help-links";
import { type AlbumStyle, STYLE_NAMES } from "@/lib/disposable/album-style";
import { hueOfOklch, publishDoorHues } from "@/lib/guest/door-light";
import { useSampledPalette } from "@/lib/shared/sampled-palette";
import { cn } from "@/lib/utils";

import { GuestAlbum } from "./album";
import {
  type BridgeWay,
  guestScreen,
  keepsakeIn,
  type KeepsakeWay,
  overIn,
  type OverWay,
} from "./answers";
import { ALBUM, PRIYA, WEDDING, WEEK } from "./fixtures";
import { keepsakeTop } from "./keepsake";
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
 * Maya & Jay's album a week on, and Priya with a birthday next month. Four
 * frames an answer, as the moment runs: the album's top for a stranger (the
 * header's corner), the same top for a guest who joined by her name (her
 * corner is her name menu, open), the album's end, and where the way lands.
 *
 * ★ THE ALBUM WEARS THE EARLIER ANSWERS (the question is staged after
 * `keepsake`): its cover and what stands under it are the keepsake answer's,
 * Add as the `over` answer leaves it, through the keepsake story's own
 * `keepsakeTop`, so the corner is judged against the cover Will just chose
 * and the two questions never draw the keepsake two ways. The stranger has
 * nothing of hers in it (`newcomer`); the guest who joined has her nine.
 *
 * ★ THE CORNER REACHES ONLY A STRANGER (`guest-header.tsx`): Start for free
 * is the empty slot's, and a guest who has joined sees herself there
 * instead: her name menu at a name-only party (`guest-name-menu.tsx`), her
 * account menu where she confirmed her email, the default
 * (`guest-account-menu.tsx`). So a way that lives in the corner's link alone
 * never reaches a guest who joined. Her name menu is drawn open in every
 * answer: `home` exactly as built (nothing in it leads to a party of her
 * own), `header` and `end` with one quiet row more, Make one like this, the
 * corner's words and way, its glyph the app's own for a new event
 * (`home-head.tsx`'s New event). (The account menu would take the same row,
 * straight into Create with no sign-up; one frame draws the menu the
 * question's signed-out guest holds.)
 *
 * ★ EACH ANSWER, AS ITS OWN ADVOCATE:
 *  - `home` is today exactly: production's quiet ghost Start for free, a link
 *    to `/`, her name menu as built, and the home page itself, the real route
 *    in a frame, at its top.
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
 *    end: past the last photograph, before Guests, "Your party next? Make one
 *    like this" in the page's quiet ink, the closed line's own grammar. No
 *    light, no card, no arrow, no mark of ours: the album's one light stays
 *    the album's, so a line of Partyreel's earns no glow of its own (the
 *    bible's seventh, and attention earned).
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
 * ★ STAND-INS, SAID ONCE: the photographs, faces and counts are the board's
 * (`fixtures.ts`); every press is inert; her menu is production's own parts
 * recomposed and held open (the built menu opens only to a press, and a modal
 * menu would lock the lab page's own scroll); `?like=` is this drawing's name
 * for the album Create is styled from.
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

/* ── her corner once she's joined: her name menu ───────────────────────── */

/** The album's newest twelve, the window production's lamp reads (`album-light.tsx`'s `LOOKBACK`). */
const NEWEST = ALBUM.slice(0, 12).map((s) => s.src);

/**
 * HER MENU'S CARD WEARS THE ALBUM'S LIGHT, as built: production's page
 * samples its newest previews and hands the hues to every lamp
 * (`AlbumLightSampler`, through `door-light.ts`'s store), so this reads the
 * board's newest twelve by production's own sampler and hands them the same
 * way, never a typed hue. Until it lands the lamp wears the house five, as a
 * page's does.
 */
function useAlbumLamp() {
  const colors = useSampledPalette(NEWEST, "dark");
  useEffect(() => {
    if (!colors) return;
    const hues = colors.map(hueOfOklch).filter((h): h is number => h !== null);
    if (hues.length >= 3) publishDoorHues(hues);
  }, [colors]);
}

/**
 * ★ A MENU HELD OPEN NEVER TAKES THE LAB'S FOCUS: Radix focuses a menu's
 * content as it opens, which in a frame would pull the keyboard off the lab
 * page (the keys Will compares options with) and into the frame. Its open
 * focus is declined; Radix keeps that prop off the public type
 * (`MenuContentImplPrivateProps`) and passes it through all the same.
 */
const HELD_OPEN = {
  onOpenAutoFocus: (event: Event) => event.preventDefault(),
} as unknown as ComponentProps<typeof DropdownMenuContent>;

/**
 * PRIYA'S NAME MENU, OPEN, AS `guest-name-menu.tsx` DRAWS IT for a guest
 * who joined by her name and added her nine: her name over Unverified, the
 * keep's card lit by the album and its one act, Change name, Log in and Help
 * center. With `make`, one row more in the second group, the corner's own
 * words and way: after Log in, Help center keeping its place at the menu's
 * foot, a plain row on the icon rail like its neighbours (quiet: no card, no
 * fill, nothing the eye is pulled to).
 */
function NameMenu({ make }: { make: boolean }) {
  useAlbumLamp();
  return (
    <DropdownMenu open modal={false}>
      <DropdownMenuTrigger
        aria-label="Your name on this album"
        tabIndex={-1}
        className="flex focus-halo items-center gap-2 rounded-full outline-none"
      >
        <Avatar size="sm" seed={PRIYA.seed}>
          <AvatarFallback className="text-[10px]">
            {PRIYA.name.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-28 truncate text-sm">{PRIYA.name}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-60"
        data-ap-menu=""
        {...HELD_OPEN}
      >
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate leading-tight font-medium">
            {PRIYA.name}
          </span>
          <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
            {UNVERIFIED_LABEL}
          </span>
        </DropdownMenuLabel>
        <div
          data-menu-card
          className="relative isolate m-1 overflow-hidden rounded-md bg-muted/60 p-3"
        >
          <DoorLamp edge="card" />
          <p className="text-reading text-pretty text-foreground">
            {KEEP_TITLE}
          </p>
          <DropdownMenuItem className="mt-2 h-8 justify-center bg-primary font-medium text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground">
            Add your email
          </DropdownMenuItem>
        </div>
        <DropdownMenuItem>
          <Pencil /> Change name
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogIn /> Log in
        </DropdownMenuItem>
        {make ? (
          <DropdownMenuItem asChild>
            <a href={WAYS.create.href} tabIndex={-1} data-ap-menu-way="">
              <CalendarPlus /> {WAYS.create.words}
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <a
            href={HELP_CENTER_HREF}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}
          >
            <LifeBuoy /> Help center
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── the album's end ───────────────────────────────────────────────────── */

/**
 * PAST THE LAST PHOTOGRAPH (the `end` answer): one quiet line in the album's
 * own voice and size, the grammar of the line production stands under its
 * cover (`ClosedLine`, and a wrapped album's `QuietAdd`): the words in the
 * page's muted ink, the one press in its own ink, into the same Create.
 * Nearer the last row (24px) than Guests is to it (40px), so it reads as the
 * album's own last word, never a heading for the faces under it.
 */
function EndLine() {
  return (
    <p
      data-ap-past=""
      className="mt-6 text-center text-reading text-balance text-muted-foreground"
    >
      Your party next?{" "}
      <a
        href={WAYS.create.href}
        tabIndex={-1}
        className="rounded-md font-medium text-foreground underline-offset-4 hover:underline"
      >
        {WAYS.create.words}
      </a>
    </p>
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
 * read-only: the real step's `autoFocus` would pull the lab's page to it),
 * standing on its rule alone (`ap-name-field`, `bridge.css`).
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
              data-ap-name-field=""
              className={cn(
                "cr-name-field ap-name-field h-auto rounded-none border-0 bg-transparent px-0 py-0 text-center shadow-none",
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

/**
 * The cover the album wears (the keepsake answer it is drawn in): its white
 * act where it has one, the rest beside it (or in the dock, where a title
 * page hands them there), her strip where it shows, and the line under it.
 * Null until the cover has drawn.
 */
function coverOf(root: HTMLElement, win: Window): string | null {
  if (!find(root, "[data-event-head]")) return null;
  const acts = find(root, "[data-ap-acts]");
  const all =
    acts && inView(acts, win) ? actsIn(root, win, "[data-ap-acts]") : [];
  const white = acts?.querySelector<HTMLElement>("[data-variant='on-photo']");
  const dock = actsIn(root, win, "[data-ap-dock]");
  const lead = white
    ? `"${textOf(white)}" in white${all.length > 1 ? `, ${all.filter((a) => a !== textOf(white)).join(" and ")} beside it` : ""}`
    : all.length
      ? `no white act, only ${all.join(" and ")}`
      : dock.length
        ? `no acts, ${dock.join(" and ")} in the dock`
        : "no acts";
  const page = find(root, "[data-ap-title]") ? "a title page, " : "";
  const hers = find(root, "[data-ap-hers-word]");
  const under =
    find(root, "[data-ap-closed]") ?? find(root, "[data-ap-quiet-add]");
  return [
    `the cover: ${page}${lead}`,
    hers ? `her strip "${textOf(hers)}"` : "",
    under ? `under it "${textOf(under)}"` : "",
  ]
    .filter(Boolean)
    .join(", ");
}

/** A stranger's top: what the corner says, in what weight, where it leads, and the cover it stands over. */
const readTop: Reader = (root, win) => {
  const corner = find(root, "[data-ap-corner] [data-ap-way]");
  if (!corner || !inView(corner, win)) return null;
  const weight = `${corner.getAttribute("data-variant")} ${win.getComputedStyle(corner).fontSize}`;
  return parts(
    `the corner: "${textOf(corner)}" (${weight}), ${wayOf(corner.getAttribute("href"))}`,
    coverOf(root, win),
  );
};

/** A joined guest's top: her name menu, open, row by row, and whether anything in it leads to a party of her own. */
const readMenu: Reader = (root, win) => {
  const menu = find(root, "[data-ap-menu]");
  if (!menu || !inView(menu, win)) return null;
  const who = textOf(menu.querySelector("[data-slot='dropdown-menu-label']"));
  const card = textOf(menu.querySelector("[data-menu-card] p"));
  const rows = [...menu.querySelectorAll<HTMLElement>("[role='menuitem']")]
    .map((r) => textOf(r))
    .filter(Boolean);
  const way = menu.querySelector<HTMLElement>("[data-ap-menu-way]");
  return parts(
    `her corner: her name menu, open ("${who}"), the card "${card}", then ${rows.join(", ")}`,
    way
      ? `"${textOf(way)}" goes ${wayOf(way.getAttribute("href"))}`
      : "nothing in it leads to a party of her own",
    coverOf(root, win),
  );
};

/** The album's end: what stands past the last photograph, and the dock. */
const readEnd: Reader = (root, win) => {
  const guests = find(root, "section[aria-label='Guests']");
  if (!guests || !inView(guests, win)) return null;
  const line = find(root, "[data-ap-past]");
  const end =
    line && inView(line, win)
      ? `past the last photo, one quiet line (${win.getComputedStyle(line).fontSize}): "${textOf(line)}", ${wayOf(line.querySelector("a")?.getAttribute("href") ?? null)}; then Guests and Report`
      : "past the last photo: Guests, then Report, nothing of ours";
  const dock = actsIn(root, win, "[data-ap-dock]");
  return parts(end, dock.length ? `the dock: ${dock.join(", ")}` : "no dock");
};

/** Whether a field stands in a box (a rim, or a ground of its own) or on its rule alone. */
function boxed(field: HTMLElement, win: Window): boolean {
  const cs = win.getComputedStyle(field);
  return cs.boxShadow !== "none" || cs.backgroundColor !== "rgba(0, 0, 0, 0)";
}

/**
 * Create's first screen: its question, where its head says she stands (the
 * room's own words for a reader, "Step 1 of N", and its hairlines), what it
 * carried, how her name stands, and its foot.
 */
const readCreate: Reader = (root, win) => {
  if (!find(root, "[data-app-room]")) return null;
  const step = textOf(find(root, "[data-room-head] .sr-only"));
  const carried = find(root, "[data-ap-carried-words]");
  const field = find(root, "[data-ap-name-field]") as HTMLInputElement | null;
  if (!field) return null;
  return parts(
    `"${textOf(find(root, "[data-room-heading]"))}", ${step.toLowerCase()} (${findAll(root, "[data-room-step]").length} hairlines)`,
    carried ? `carried: ${textOf(carried)}, with Change` : "nothing carried",
    `her name "${field.value}" ${boxed(field, win) ? "in a box over its rule" : "on its rule alone"}`,
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

/**
 * Maya & Jay's album a week on, as the earlier answers leave it, with what
 * this answer places: the corner (a stranger's) or her name menu (a guest
 * who joined, with her nine), and the album's end.
 */
function AlbumAt({
  way,
  keepsake,
  over,
  screen,
  scroll,
  joined = false,
}: {
  way: BridgeWay;
  keepsake: KeepsakeWay;
  over: OverWay;
  screen: Screen;
  scroll: "top" | "end";
  joined?: boolean;
}) {
  const top = keepsakeTop(keepsake, over, screen, !joined);
  return (
    <GuestAlbum
      screen={screen}
      moment={WEEK}
      corner={
        joined ? <NameMenu make={way !== "home"} /> : <Corner way={way} />
      }
      cover={top.cover}
      under={top.under}
      past={way === "end" ? <EndLine /> : undefined}
      scroll={scroll}
      // Scrolled to the end, the cover's acts have gone and the dock stands (no shutter: Add is gone or receded).
      dock={scroll === "end" ? "look" : top.dock}
    />
  );
}

export function BridgeStory({ way, s }: { way: BridgeWay; s: BoardState }) {
  const screen = guestScreen(s);
  const keepsake = keepsakeIn(s);
  const over = overIn(s);
  const { w, h } = SCREENS[screen];
  const tall = screen === "1440" ? 640 : h;
  // Every frame's id names the answers it is drawn in, so a frame re-reads when an earlier answer changes.
  const drawn = `${way}-${keepsake}-${over}-${screen}`;
  const album = { way, keepsake, over, screen };
  return (
    <Story>
      <Scene
        id={`ap-bridge-top-${drawn}`}
        w={w}
        h={tall}
        ground="paper"
        title="Signed out, a week on: the album's top"
        measure={readTop}
      >
        <AlbumAt {...album} scroll="top" />
      </Scene>
      <Scene
        id={`ap-bridge-menu-${drawn}`}
        w={w}
        h={tall}
        ground="paper"
        title="Joined by her name: her menu, open"
        measure={readMenu}
      >
        <AlbumAt {...album} scroll="top" joined />
      </Scene>
      <Scene
        id={`ap-bridge-end-${drawn}`}
        w={w}
        h={tall}
        ground="paper"
        title="Past the last photo: the album's end"
        measure={readEnd}
      >
        <AlbumAt {...album} scroll="end" />
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
