"use client";

import type { ReactNode } from "react";

import { openAlbumWords } from "@/app/(guest)/e/[token]/card/words";
import { EVENT_CARD_SIZE } from "@/lib/guest/event-card";

import { Card, CardAt, type CardOf, type CardWay } from "./card";
import { COVER, MORNING, WEDDING, WEEK } from "./fixtures";
import { find, findAll, parts, type Reader, Scene, Story } from "./scene";

/**
 * THE CARD EVERY SHARED LINK WEARS (the `card` question): the family chat at
 * a phone, where a card is met (the album pasted the morning after, one
 * photo's link, the album a week on), then each card at its true size, and a
 * gated album's pair (a password album's, a Private one's).
 *
 * ★ THE CHAT IS NOBODY'S APP: a plain thread in the house's own type, bubbles
 * and an unfurl drawn the way every messenger draws one (the picture, the
 * title, the line, the address), so the card is judged where it lands rather
 * than as a poster.
 */

/** What a frame's cards carry: how each is drawn, read off its own markup. */
const readCards: Reader = (root) => {
  const cards = findAll(root, "[data-ap-card]");
  if (cards.length === 0) return null;
  return cards.map((c) => c.getAttribute("data-ap-card")).join(", ");
};

/** The chat's unfurls: how many, and what each card is. */
const readChat: Reader = (root) => {
  const chat = find(root, "[data-ap-chat]");
  if (!chat) return null;
  const unfurls = findAll(root, "[data-ap-unfurl]");
  return parts(
    `${unfurls.length} links unfurled`,
    unfurls.map((u) => u.getAttribute("data-ap-unfurl")).join(", "),
  );
};

/** One message: who sent it, its words, and the link's unfurl under them. */
function Message({
  from,
  mine = false,
  words,
  unfurl,
}: {
  from: string;
  mine?: boolean;
  words: string;
  unfurl?: ReactNode;
}) {
  return (
    <div
      className={mine ? "flex flex-col items-end" : "flex flex-col items-start"}
    >
      {mine ? null : (
        <span className="mb-1 px-3 text-xs text-muted-foreground">{from}</span>
      )}
      <div
        className={
          mine
            ? "max-w-[82%] overflow-hidden rounded-2xl rounded-br-md bg-foreground text-background"
            : "max-w-[82%] overflow-hidden rounded-2xl rounded-bl-md bg-muted text-foreground"
        }
      >
        {unfurl}
        <p className="px-3.5 py-2 text-[15px] leading-snug">{words}</p>
      </div>
    </div>
  );
}

/** A link's unfurl, as a messenger draws one: the card, then its title, its line and its address. */
function Unfurl({
  kind,
  picture,
  title,
  line,
}: {
  kind: string;
  picture: ReactNode;
  title: string;
  line?: string;
}) {
  return (
    <div data-ap-unfurl={kind} className="bg-black/5 dark:bg-white/5">
      {picture}
      <div className="px-3.5 pt-2 pb-1">
        <p className="text-[13px] leading-snug font-semibold">{title}</p>
        {line ? (
          <p className="text-[12px] leading-snug opacity-70">{line}</p>
        ) : null}
        <p className="mt-0.5 text-[11px] opacity-50">partyreel.com</p>
      </div>
    </div>
  );
}

/** A photo's own link unfurls as that photograph, in every option (today's rule). */
function PhotoPicture({ width }: { width: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- a stand-in photograph
    <img
      src={COVER.src}
      alt=""
      data-ap-card="photo"
      style={{
        width,
        height: (width * 2) / 3,
        objectFit: "cover",
        objectPosition: COVER.focus,
      }}
    />
  );
}

/** The family chat: the album the morning after, a photo's link, the album a week on. */
function Chat({ way }: { way: CardWay }) {
  const bubble = 268;
  const live = openAlbumWords(WEDDING.name, true);
  const kept = openAlbumWords(WEDDING.name, false);
  const photo = openAlbumWords(WEDDING.name, false, true);
  const card = (of: CardOf, moment = WEEK) => (
    <CardAt width={bubble}>
      <Card way={way} of={of} moment={moment} />
    </CardAt>
  );
  return (
    <div data-ap-chat="" className="flex min-h-screen flex-col bg-background">
      <div className="flex h-14 items-center justify-center border-b border-border text-sm font-semibold">
        The Lins
      </div>
      <div className="flex flex-col gap-4 px-3 py-4">
        <p className="text-center text-xs text-muted-foreground">
          Sunday 9:12 AM
        </p>
        <Message
          from="Maya"
          words="Everyone's photos from last night! Add yours"
          unfurl={
            <Unfurl
              kind={`album live: ${way}`}
              picture={card("live", MORNING)}
              title={live.title}
              line={live.description}
            />
          }
        />
        <Message
          from="Aunt Rosa"
          words="This one!!"
          unfurl={
            <Unfurl
              kind="one photo"
              picture={<PhotoPicture width={bubble} />}
              title={photo.title}
              line={photo.description}
            />
          }
        />
        <p className="text-center text-xs text-muted-foreground">
          Saturday 4:40 PM
        </p>
        <Message
          mine
          from="Priya"
          words="the whole wedding, you have to see this"
          unfurl={
            <Unfurl
              kind={`album kept: ${way}`}
              picture={card("keepsake")}
              title={kept.title}
              line={kept.description}
            />
          }
        />
      </div>
    </div>
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
      measure={readCards}
    >
      <Card way={way} of={of} moment={of === "live" ? MORNING : WEEK} />
    </Scene>
  );
}

export function CardStory({ way }: { way: CardWay }) {
  return (
    <Story>
      <Scene
        id={`ap-card-chat-${way}`}
        w={375}
        h={812}
        ground="paper"
        title="The family chat, at a phone"
        measure={readChat}
      >
        <Chat way={way} />
      </Scene>
      <TrueSize
        id={`ap-card-live-${way}`}
        title="The album's card the morning after (1200 × 630)"
        way={way}
        of="live"
      />
      <TrueSize
        id={`ap-card-kept-${way}`}
        title="Its card a week on"
        way={way}
        of="keepsake"
      />
      <Scene
        id={`ap-card-gated-${way}`}
        w={1200}
        h={330}
        ground="room"
        title="A password album's card, and a Private one's"
        measure={readCards}
      >
        <div className="flex gap-6 p-0">
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
