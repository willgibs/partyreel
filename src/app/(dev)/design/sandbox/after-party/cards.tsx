"use client";

import type { ReactNode } from "react";

import type { BoardState } from "@/components/lab";
import { cn } from "@/lib/utils";

import { openAlbumWords } from "@/app/(guest)/e/[token]/card/words";
import { EVENT_CARD_SIZE } from "@/lib/guest/event-card";

import { Card, CardAt, type CardOf, type CardWay } from "./card";
import { MORNING, still, WEDDING, WEEK } from "./fixtures";
import type { Ground } from "./knobs";
import { findAll, type Reader, Scene, Story } from "./scene";

/**
 * THE CARD EVERY SHARED LINK WEARS (the `card` question), judged where it
 * lands: two chats at a phone, then each card at its true size, then a gated
 * album's pair.
 *
 * ★ TWO CHATS, BOTH GROUNDS: the family's the morning after, on paper (Maya
 * pastes the album, Aunt Rosa one photo's link), and a week on, the phone of a
 * friend who wasn't there as Priya's link reaches him, in dark mode, where a
 * dark card meets a dark thread.
 * A bubble is 268 px wide (a phone's 260 to 300), and every caption reads the
 * card's own type at that width off its markup, so legibility is measured,
 * never claimed.
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

/** A face's name off a computed family: the app's two by name, else the first named. */
const faceOf = (family: string) =>
  /urbanist/i.test(family)
    ? "Urbanist"
    : /inter/i.test(family)
      ? "Inter"
      : (family.split(",")[0] ?? "").replace(/["']/g, "").trim();

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
      : `its light (${named}): its colours, never a photograph`;
  }
  if (drawn === "today") return "the name card as today, no photograph";
  if (drawn === "named") return "a name card, no photograph";
  return null;
}

/** A card's type at the size it is drawn: the name's and its line's px, and the scale it stands at. */
function sizes(card: HTMLElement, win: Window) {
  const name = card.querySelector<HTMLElement>("[data-ap-name]");
  const foot = card.querySelector<HTMLElement>("[data-ap-foot]");
  const k = card.getBoundingClientRect().width / EVENT_CARD_SIZE.width;
  if (!name || !foot || !(k > 0)) return null;
  const px = (el: HTMLElement) =>
    Math.round(parseFloat(win.getComputedStyle(el).fontSize) * k);
  return {
    name: px(name),
    foot: px(foot),
    face: faceOf(win.getComputedStyle(name).fontFamily),
    words: (name.textContent ?? "").trim(),
    line: (foot.textContent ?? "").trim(),
    mark: card.querySelector("[data-ap-mark]")?.getAttribute("data-ap-mark"),
  };
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
    return `the album: ${what}; its name ${at.name} px, its line ${at.foot} px`;
  });
  if (said.some((s) => s === null)) return null;
  return `${said.join(" · ")} (a ${BUBBLE} px bubble)`;
};

/** A card at its true size: what it carries, its name's face and size, its line, its mark. */
const readCard: Reader = (root, win) => {
  const card = findAll(root, "[data-ap-card]")[0];
  if (!card) return null;
  const what = carries(card);
  const at = sizes(card, win);
  if (!what || !at) return null;
  return [
    what,
    `the name in ${at.face} ${at.name} px`,
    `'${at.line}'`,
    at.mark === "tile" ? "the aperture tile" : "the wordmark, small",
  ].join("; ");
};

/** A gated pair: what each door's card carries. */
const readGated: Reader = (root) => {
  const cards = findAll(root, "[data-ap-card]");
  if (cards.length < 2) return null;
  const said = cards.map((c) => {
    const what = carries(c);
    if (!what) return null;
    const who = c.dataset.apGeneric === undefined ? "password" : "Private";
    const name = (c.querySelector("[data-ap-name]")?.textContent ?? "").trim();
    return `${who}: ${what}, '${name}'`;
  });
  return said.some((s) => s === null) ? null : said.join(" · ");
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
function AlbumPicture({
  way,
  of,
  moment,
}: {
  way: CardWay;
  of: CardOf;
  moment: typeof MORNING;
}) {
  return (
    <CardAt width={BUBBLE}>
      <Card way={way} of={of} moment={moment} />
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

/** The family chat the morning after: the album, live, and one photo's link. */
function MorningChat({ way }: { way: CardWay }) {
  const album = openAlbumWords(WEDDING.name, true);
  const photo = openAlbumWords(WEDDING.name, true, true);
  return (
    <Thread ground="paper" title="The Lins">
      <Stamp>Sunday 9:12 AM</Stamp>
      <Message
        ground="paper"
        from="Maya"
        words="Everyone's photos from yesterday! Add yours"
        unfurl={
          <Unfurl
            link="album"
            picture={<AlbumPicture way={way} of="live" moment={MORNING} />}
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
            picture={<AlbumPicture way={way} of="keepsake" moment={WEEK} />}
            title={kept.title}
            line={kept.description}
          />
        }
      />
    </Thread>
  );
}

/** A card at its true size in a frame of its own. */
function TrueSize({
  id,
  title,
  way,
  of,
}: {
  id: string;
  title: string;
  way: CardWay;
  of: CardOf;
}) {
  return (
    <Scene
      id={id}
      w={EVENT_CARD_SIZE.width}
      h={EVENT_CARD_SIZE.height}
      ground="room"
      title={title}
      measure={readCard}
    >
      <Card way={way} of={of} moment={of === "live" ? MORNING : WEEK} />
    </Scene>
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
      <TrueSize
        id={`ap-card-live-${way}`}
        title="The album's card the morning after, at its true size (1200 × 630)"
        way={way}
        of="live"
      />
      <TrueSize
        id={`ap-card-kept-${way}`}
        title="Its card a week on, as its keepsake (1200 × 630)"
        way={way}
        of="keepsake"
      />
      <Scene
        id={`ap-card-gated-${way}`}
        w={1200}
        h={330}
        ground="room"
        title="A password album's card, and a Private one's"
        measure={readGated}
      >
        <div className="flex gap-6">
          <CardAt width={588}>
            <Card way={way} of="password" moment={WEEK} />
          </CardAt>
          <CardAt width={588}>
            <Card way={way} of="private" moment={WEEK} />
          </CardAt>
        </div>
      </Scene>
    </Story>
  );
}
