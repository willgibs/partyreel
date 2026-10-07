"use client";

import type { ReactNode } from "react";

import type { BoardState } from "@/components/lab";
import { cn } from "@/lib/utils";

import { openAlbumWords } from "@/app/(guest)/e/[token]/card/words";
import { EVENT_CARD_SIZE } from "@/lib/guest/event-card";

import { Card, CardAt, type CardOf, type CardWay, ROUTE_FAMILY } from "./card";
import { still, WEDDING } from "./fixtures";
import type { Ground } from "./knobs";
import { find, findAll, type Reader, Scene, Story } from "./scene";

/**
 * THE CARD EVERY SHARED LINK WEARS (the `card` question), judged where it
 * lands: two chats at a phone first (the bubble is where the decision is
 * made), then one sheet of the cards at half size.
 *
 * ★ TWO CHATS, BOTH GROUNDS: the family's the morning after, on paper (Maya
 * pastes the album, Aunt Rosa one photo's link), and a week on, the phone of a
 * friend who wasn't there as Priya's link reaches him, in dark mode, where a
 * dark card meets a dark thread.
 * A bubble is 268 px wide (a phone's 260 to 300), and every caption reads the
 * card's own type at that width off its markup, so legibility is measured,
 * never claimed.
 *
 * ★ ONE SHEET AT HALF SIZE (600 by 315 a card, the creative director's pass):
 * the album the morning after beside it a week on, its two halves, and a
 * password album's card under them beside a Private one's. A new way's two
 * halves are one picture, nothing on it to go stale in a pasted chat, and the
 * caption reads that off the two cards' markup; today's differ by their line.
 * It stands on paper, so a dark card's edge is a card's edge.
 *
 * ★ THE CHAT IS NOBODY'S APP: a plain thread in the house's own type and
 * greys, an unfurl drawn the way every messenger draws one (the picture, the
 * title, the line, the address), never a real messenger's colour or chrome.
 *
 * ★ THE KEEPSAKE CARD IS THE SAME WHICHEVER WAY THE PARTY ENDED (the `over`
 * answer): a closed album and a wrapped one both name the plain address (the
 * wiring note in the round's report), so this story never reads that answer.
 */

/** A phone's link bubble: its card's width. */
const BUBBLE = 268;

/** The sheet: each card at half its size, a gutter between and around. */
const HALF = EVENT_CARD_SIZE.width / 2;
const GUTTER = 24;

/** Aunt Rosa's favourite: a photograph no card carries (past the cover's first four), so no picture shows twice. */
const ROSA = still("wedding-rings");

/* ── what the frames read ──────────────────────────────────────────────── */

/** A hue as a word, for a caption: where it sits on the wheel. */
function hueWord(h: number): string {
  const names: readonly [number, string][] = [
    [20, "red"],
    [45, "coral"],
    [75, "gold"],
    [100, "yellow"],
    [165, "green"],
    [205, "teal"],
    [265, "blue"],
    [300, "violet"],
    [345, "pink"],
    [360, "red"],
  ];
  return names.find(([upTo]) => h < upTo)?.[1] ?? "red";
}

/** A family's first name, unquoted. */
const firstOf = (family: string) =>
  (family.split(",")[0] ?? "").replace(/["']/g, "").trim();

/** The route's own face, by the family the lab loads its TTF under. */
const ROUTE_OWN = firstOf(ROUTE_FAMILY);

/**
 * THE FACE A CARD'S NAME PAINTS IN, read off the frame: the app's heading face
 * by name, and the route's own Geist only once this frame holds its TTF loaded
 * (`document.fonts`), so a caption never says Geist over a fallback. Null while
 * it loads (not settled); a file that failed says so.
 */
function faceOf(el: HTMLElement, win: Window): string | null {
  const family = win.getComputedStyle(el).fontFamily;
  if (ROUTE_OWN && firstOf(family) === ROUTE_OWN) {
    const faces: FontFace[] = [];
    win.document.fonts.forEach((f) => {
      if (firstOf(f.family) === ROUTE_OWN) faces.push(f);
    });
    if (faces.some((f) => f.status === "loaded"))
      return "Geist Regular, the route's own TTF, loaded here";
    if (faces.length > 0 && faces.every((f) => f.status === "error"))
      return "the route's Geist, its TTF failed to load";
    return null;
  }
  if (/urbanist/i.test(family)) return "Urbanist, a face the route would load";
  if (/inter/i.test(family)) return "Inter";
  return firstOf(family);
}

/** What a card carries, in words, read off its own markup. */
function carries(card: HTMLElement): string | null {
  const drawn = card.dataset.apCard;
  const photos = Number(card.dataset.apPhotos ?? 0);
  const light = card.dataset.apLight;
  if (drawn === "cover") return "its cover photograph";
  if (drawn === "strip") return `${photos} of its photographs`;
  if (drawn === "light" && light) {
    const [source, hues] = light.split(":");
    const named = (hues ?? "")
      .split(",")
      .map((h) => `${hueWord(Number(h))} ${h}°`)
      .join(", ");
    return source === "house"
      ? `the house ember (${named}), no album read`
      : `its light (${named}), never a photograph`;
  }
  if (drawn === "today") return "the name card as today";
  if (drawn === "named") return "its name alone";
  return null;
}

/** A card's words: its name, and the line under it where it has one. */
const wordsOf = (card: HTMLElement, part: "name" | "foot") =>
  (
    card.querySelector<HTMLElement>(`[data-ap-${part}]`)?.textContent ?? ""
  ).trim();

/** A card's type at the size it is drawn: its name's px and its line's (none on a new way's card). */
function sizes(card: HTMLElement, win: Window) {
  const name = card.querySelector<HTMLElement>("[data-ap-name]");
  const foot = card.querySelector<HTMLElement>("[data-ap-foot]");
  const k = card.getBoundingClientRect().width / EVENT_CARD_SIZE.width;
  if (!name || !(k > 0)) return null;
  const px = (el: HTMLElement) =>
    Math.round(parseFloat(win.getComputedStyle(el).fontSize) * k);
  return { name: px(name), foot: foot ? px(foot) : null };
}

/** The chat's links, in order: what each unfurls into, and how big its card's words stand in the bubble. */
const readChat: Reader = (root, win) => {
  const unfurls = findAll(root, "[data-ap-unfurl]");
  if (unfurls.length === 0) return null;
  const said = unfurls.map((u) => {
    if (u.dataset.apUnfurl === "photo") return "one photo: that photograph";
    const card = u.querySelector<HTMLElement>("[data-ap-card]");
    const what = card ? carries(card) : null;
    const at = card ? sizes(card, win) : null;
    if (!what || !at) return null;
    const line =
      at.foot === null ? "nothing under it" : `its line ${at.foot} px`;
    return `the album: ${what}; its name ${at.name} px, ${line}`;
  });
  if (said.some((s) => s === null)) return null;
  return `${said.join(" · ")} (a ${BUBBLE} px bubble)`;
};

/**
 * THE SHEET: what the album's card carries, whether the morning after's and a
 * week on's are one picture (their markup, compared whole) or what turns
 * between them, each door's card, then the face every name paints in (the
 * route's own, or one it would load), each read where it stands.
 */
const readSheet: Reader = (root, win) => {
  const order: readonly CardOf[] = ["live", "keepsake", "password", "private"];
  const cards = order.map((of) =>
    find(root, `[data-ap-of="${of}"] [data-ap-card]`),
  );
  const [live, kept, pass, shut] = cards;
  if (!live || !kept || !pass || !shut) return null;
  const names = cards.map((c) =>
    c?.querySelector<HTMLElement>("[data-ap-name]"),
  );
  const faces = names.map((n) => (n ? faceOf(n, win) : null));
  const said = cards.map((c) => (c ? carries(c) : null));
  if (faces.some((f) => f === null) || said.some((s) => s === null))
    return null;
  // The name's size on the card's own 1200: the card is drawn at half, and its type is read unscaled.
  const px = names.map((n) =>
    n ? `${Math.round(parseFloat(win.getComputedStyle(n).fontSize))} px` : "",
  );
  const halves =
    live.outerHTML === kept.outerHTML
      ? "one picture the morning after and a week on"
      : `its line turns from '${wordsOf(live, "foot")}' to '${wordsOf(kept, "foot")}'`;
  const own = wordsOf(live, "name");
  const named = (card: HTMLElement) =>
    wordsOf(card, "name") === own ? "" : `, '${wordsOf(card, "name")}'`;
  const face = faces.every((f) => f === faces[0])
    ? `every name in ${faces[0]}`
    : `the names in ${faces.join(", ")}`;
  return [
    `${said[0]}, its name ${px[0]}; ${halves}`,
    `password: ${said[2]}${named(pass)}, ${px[2]}`,
    `Private: ${said[3]}${named(shut)}, ${px[3]}`,
    face,
  ].join(" · ");
};

/* ── the chat ──────────────────────────────────────────────────────────── */

/** A thread at a phone: its title, its messages anchored to the foot as a chat stands, and its composer. */
function Thread({
  ground,
  title,
  children,
}: {
  ground: Ground;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      data-ap-chat={ground}
      className="flex min-h-screen flex-col bg-background text-foreground"
    >
      <div className="flex h-14 shrink-0 items-center justify-center border-b border-border text-[15px] font-semibold">
        {title}
      </div>
      <div className="flex flex-1 flex-col justify-end gap-3 px-3 pt-4 pb-3">
        {children}
      </div>
      <div className="flex shrink-0 items-center border-t border-border px-3 py-2.5">
        <div className="flex h-9 flex-1 items-center rounded-full border border-border px-4 text-[15px] text-muted-foreground">
          Message
        </div>
      </div>
    </div>
  );
}

/** When the next messages were sent. */
function Stamp({ children }: { children: ReactNode }) {
  return (
    <p className="py-1 text-center text-xs text-muted-foreground">{children}</p>
  );
}

/** One message: who sent it (a group names its sender), its link's unfurl, then its words. */
function Message({
  ground,
  from,
  mine = false,
  words,
  unfurl,
}: {
  ground: Ground;
  /** The sender a group chat names; none in a chat of two. */
  from?: string;
  mine?: boolean;
  words: string;
  unfurl?: ReactNode;
}) {
  // The house's greys, never a messenger's colour: ink for her own on paper, a lighter graphite in the room.
  const tone = mine
    ? ground === "paper"
      ? "bg-foreground text-background"
      : "bg-white/25 text-foreground"
    : "bg-secondary text-foreground";
  return (
    <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
      {from && !mine ? (
        <span className="mb-1 px-3 text-xs text-muted-foreground">{from}</span>
      ) : null}
      <div
        style={unfurl ? { width: BUBBLE } : undefined}
        className={cn(
          "max-w-[78%] overflow-hidden rounded-[20px]",
          mine ? "rounded-br-md" : "rounded-bl-md",
          tone,
        )}
      >
        {unfurl}
        <p className="px-3.5 py-2 text-[15px] leading-snug">{words}</p>
      </div>
    </div>
  );
}

/** A link's unfurl, as every messenger draws one: the picture, then its title, its line and its address. */
function Unfurl({
  link,
  picture,
  title,
  line,
}: {
  link: "album" | "photo";
  picture: ReactNode;
  title: string;
  line: string;
}) {
  return (
    <div data-ap-unfurl={link} className="bg-black/5 dark:bg-white/5">
      {picture}
      <div className="px-3.5 pt-2 pb-1.5">
        <p className="text-[13px] leading-snug font-semibold">{title}</p>
        <p className="text-[12px] leading-snug opacity-70">{line}</p>
        <p className="mt-0.5 text-[11px] opacity-50">partyreel.com</p>
      </div>
    </div>
  );
}

/** The album's card in a bubble. */
function AlbumPicture({ way, of }: { way: CardWay; of: CardOf }) {
  return (
    <CardAt width={BUBBLE}>
      <Card way={way} of={of} />
    </CardAt>
  );
}

/** A photo's own link unfurls as that photograph, its own shape, in every way (today's rule: the preview itself). */
function PhotoPicture() {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph, as an unfurler draws one
    <img
      src={ROSA.src}
      alt=""
      className="block object-cover"
      style={{ width: BUBBLE, height: Math.round(BUBBLE / ROSA.ratio) }}
    />
  );
}

/**
 * The family chat the morning after: the album, live, and one photo's link.
 * Maya's own words thank and point; the link's title and line do the inviting
 * (three "add yours" in one bubble read as the product talking, never her).
 */
function MorningChat({ way }: { way: CardWay }) {
  const album = openAlbumWords(WEDDING.name, true);
  const photo = openAlbumWords(WEDDING.name, true, true);
  return (
    <Thread ground="paper" title="The Lins">
      <Stamp>Sunday 9:12 AM</Stamp>
      <Message
        ground="paper"
        from="Maya"
        words="Thank you all for yesterday! Everyone's photos so far"
        unfurl={
          <Unfurl
            link="album"
            picture={<AlbumPicture way={way} of="live" />}
            title={album.title}
            line={album.description}
          />
        }
      />
      <Message
        ground="paper"
        from="Aunt Rosa"
        words="This one!!"
        unfurl={
          <Unfurl
            link="photo"
            picture={<PhotoPicture />}
            title={photo.title}
            line={photo.description}
          />
        }
      />
    </Thread>
  );
}

/**
 * A week on, on the phone of a friend who wasn't there, in dark mode: he asks,
 * and Priya's link arrives as the album's first sight, its keepsake.
 */
function WeekChat({ way }: { way: CardWay }) {
  const kept = openAlbumWords(WEDDING.name, false);
  return (
    <Thread ground="room" title="Priya">
      <Stamp>Saturday 4:40 PM</Stamp>
      <Message ground="room" mine words="How was the wedding?? Pics?" />
      <Message
        ground="room"
        words="So good. They're all in here"
        unfurl={
          <Unfurl
            link="album"
            picture={<AlbumPicture way={way} of="keepsake" />}
            title={kept.title}
            line={kept.description}
          />
        }
      />
    </Thread>
  );
}

/** The four links' cards at half size: the album the morning after and a week on, over the two doors'. */
function Sheet({ way }: { way: CardWay }) {
  const cells: readonly CardOf[] = ["live", "keepsake", "password", "private"];
  return (
    <div
      className="grid grid-cols-2"
      style={{ gap: GUTTER, padding: GUTTER, width: HALF * 2 + GUTTER * 3 }}
    >
      {cells.map((of) => (
        <div key={of} data-ap-of={of}>
          <CardAt width={HALF}>
            <Card way={way} of={of} />
          </CardAt>
        </div>
      ))}
    </div>
  );
}

export function CardStory({ way }: { way: CardWay; s: BoardState }) {
  return (
    <Story>
      <Scene
        id={`ap-card-morning-${way}`}
        w={375}
        h={812}
        ground="paper"
        title="The family chat, the morning after"
        measure={readChat}
      >
        <MorningChat way={way} />
      </Scene>
      <Scene
        id={`ap-card-week-${way}`}
        w={375}
        h={560}
        ground="room"
        title="A week on, at a friend who wasn't there (dark mode)"
        measure={readChat}
      >
        <WeekChat way={way} />
      </Scene>
      <Scene
        id={`ap-card-sheet-${way}`}
        w={HALF * 2 + GUTTER * 3}
        h={(EVENT_CARD_SIZE.height / 2) * 2 + GUTTER * 3}
        ground="paper"
        title="Its cards at half size: the morning after and a week on, over a password album's and a Private one's"
        measure={readSheet}
      >
        <Sheet way={way} />
      </Scene>
    </Story>
  );
}
