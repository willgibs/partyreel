"use client";

import "./event-page.css";

import type { BoardState } from "@/components/lab/exploration";

import { AlbumProvider } from "./album";
import { AddPair, Chat, CreateClose, CreateLink, Dashboard } from "./common";
import {
  LUNCH,
  MADE,
  NIGHT,
  OTHERS,
  ROOFTOP,
  WAITING,
  WEDNESDAY,
  WEEK,
} from "./fixtures";
import type { Kit } from "./kit";
import { type Ground, groundIn, momentIn, SCREENS, sideIn } from "./knobs";
import {
  find,
  parts,
  readFirstScreen,
  type Reader,
  Scene,
  Story,
  textOf,
} from "./scene";

/**
 * ONE WHOLE DESIGN ON THE STAGE: the moment and the side the knobs ask for,
 * each in its frames, left to right as the moment runs. Every design is read
 * in exactly these frames, so the comparison is the design and nothing else.
 *
 *  - Before the first photo: Maya's arrival from Create (a laptop) and the
 *    morning the code is out (her phone); a guest's, the first guest at a
 *    phone and a laptop.
 *  - Photos landing: a guest's first screen, the same page scrolled in as her
 *    photo lands (the Add answering), and a laptop; Maya's page at a laptop
 *    and her phone.
 *  - After her close: Maya's Wednesday (the offer), the one moment as she
 *    closes, her page a week on; a guest's one moment at her first visit
 *    after, and her page a week on at a phone and a laptop.
 *  - Beyond the page: the card in a chat, the dashboard's tiles, the door's
 *    sheet over the album, and the Add at rest and answering.
 */

const P = SCREENS["375"];
const D = SCREENS["1440"];

/** The moment's h2, for a frame that is the one moment. */
const readPremiere: Reader = (root) => {
  const h = find(root, "[data-ep-premiere-words] h2");
  return h ? `"${textOf(h)}", shown once` : null;
};

/** Create's seat: the card's two rows at 68 px. */
const readCreate: Reader = (root) => {
  const cards = root.ownerDocument.querySelectorAll("[data-ep-card-at]");
  return cards.length ? `${cards.length} cards at 68 px` : null;
};

/** What a chat's cards carry. */
const readChat: Reader = (root) => {
  const cards = root.ownerDocument.querySelectorAll("[data-ep-card-at]");
  return cards.length ? `${cards.length} cards in the thread` : null;
};

/** The dashboard's tiles, and how many stand before their first photo. */
const readTiles: Reader = (root) => {
  const all = root.ownerDocument.querySelectorAll("[data-ep-tile-of]");
  const none = root.ownerDocument.querySelectorAll('[data-ep-tile-of="none"]');
  return all.length
    ? `${all.length} tiles, ${none.length} before their first photo`
    : null;
};

/** The door's sheet, once it has risen. */
const readDoor: Reader = (root) => {
  const sheet = find(root, "[data-entry-sheet]");
  return sheet
    ? `the sheet stands at ${Math.round(sheet.getBoundingClientRect().top)}px`
    : null;
};

/** The Add's state, off its own hooks. */
const readAdd: Reader = (root) => {
  const ring = find(root, "[data-ep-ring]");
  const shutter = find(root, '[data-slot="shutter"]');
  return shutter
    ? parts(
        `the Add ${shutter.getAttribute("data-state") ?? "idle"}`,
        ring ? `its light ${ring.getAttribute("data-ep-ring")}` : "",
      )
    : null;
};

function Shot({
  id,
  w,
  h,
  ground,
  title,
  measure = readFirstScreen,
  children,
}: {
  id: string;
  w: number;
  h: number;
  ground: Ground;
  title: string;
  measure?: Reader;
  children: React.ReactNode;
}) {
  return (
    <Scene id={id} w={w} h={h} ground={ground} title={title} measure={measure}>
      {children}
    </Scene>
  );
}

export function Whole({ kit, s }: { kit: Kit; s: BoardState }) {
  const moment = momentIn(s);
  const side = sideIn(s);
  const ground = groundIn(s);
  const id = `ep-${kit.id}-${moment}-${side}`;
  const { GuestPage, HostPage, Premiere } = kit;

  if (moment === "reach")
    return (
      <Story>
        <Shot
          id={`${id}-create`}
          w={P.w}
          h={360}
          ground="room"
          title="Its card at 68 px: her link in Create, and a long name's"
          measure={readCreate}
        >
          <CreateClose
            card={
              <CreateLink card={<kit.Card variant="open" moment={MADE} />} />
            }
            long={
              <AlbumProvider album={LUNCH}>
                <CreateLink card={<kit.Card variant="open" moment={MADE} />} />
              </AlbumProvider>
            }
          />
        </Shot>
        <Shot
          id={`${id}-chat`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="Its card in a chat: Maya's album, and a Private one's"
          measure={readChat}
        >
          <Chat
            ground={ground}
            open={<kit.Card variant="open" moment={NIGHT} />}
            closed={<kit.Card variant="private" moment={NIGHT} />}
          />
        </Shot>
        <Shot
          id={`${id}-tiles`}
          w={1024}
          h={300}
          ground={ground}
          title="Maya's dashboard: a party before its first photo among them"
          measure={readTiles}
        >
          <Dashboard events={OTHERS} tile={(e) => <kit.Tile event={e} />} />
        </Shot>
        <Shot
          id={`${id}-door`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="The door's sheet over the album"
          measure={readDoor}
        >
          <kit.Door ground={ground} />
        </Shot>
        <Shot
          id={`${id}-add`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="The Add, closer: at rest, and as her photo lands (one Ring in every design)"
          measure={readAdd}
        >
          <AddPair atom={(beat) => <kit.Add ground={ground} beat={beat} />} />
        </Shot>
      </Story>
    );

  if (moment === "before")
    return side === "host" ? (
      <Story>
        <Shot
          id={`${id}-made`}
          w={D.w}
          h={D.h}
          ground={ground}
          title="Friday: just made, her first look from Create"
        >
          <HostPage screen="1440" ground={ground} moment={MADE} arrival />
        </Shot>
        <Shot
          id={`${id}-made-phone`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="Just made, at her phone"
        >
          <HostPage screen="375" ground={ground} moment={MADE} arrival />
        </Shot>
        <Shot
          id={`${id}-waiting`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="Saturday morning: 23 have opened it, nobody has added"
        >
          <HostPage screen="375" ground={ground} moment={WAITING} />
        </Shot>
      </Story>
    ) : (
      <Story>
        <Shot
          id={`${id}-first`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="Saturday morning: the first guest"
        >
          <GuestPage screen="375" ground={ground} moment={WAITING} />
        </Shot>
        <Shot
          id={`${id}-first-desk`}
          w={D.w}
          h={D.h}
          ground={ground}
          title="The first guest, at a laptop"
        >
          <GuestPage screen="1440" ground={ground} moment={WAITING} />
        </Shot>
      </Story>
    );

  if (moment === "after")
    return side === "host" ? (
      <Story>
        <Shot
          id={`${id}-offer`}
          w={D.w}
          h={D.h}
          ground={ground}
          title="Wednesday: no photos since Monday, closing offered"
        >
          <HostPage screen="1440" ground={ground} moment={WEDNESDAY} offer />
        </Shot>
        <Shot
          id={`${id}-premiere`}
          w={D.w}
          h={D.h}
          ground={ground}
          title="She closes adding: the one moment"
          measure={readPremiere}
        >
          <Premiere screen="1440" ground={ground} moment={WEEK} side="host" />
        </Shot>
        <Shot
          id={`${id}-week`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="A week on, her phone"
        >
          <HostPage screen="375" ground={ground} moment={WEEK} />
        </Shot>
      </Story>
    ) : (
      <Story>
        <Shot
          id={`${id}-premiere`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="Her first visit after the close: the one moment"
          measure={readPremiere}
        >
          <Premiere screen="375" ground={ground} moment={WEEK} side="guest" />
        </Shot>
        <Shot
          id={`${id}-week`}
          w={P.w}
          h={P.h}
          ground={ground}
          title="Then the album, a week on"
        >
          <GuestPage screen="375" ground={ground} moment={WEEK} />
        </Shot>
        <Shot
          id={`${id}-week-desk`}
          w={D.w}
          h={D.h}
          ground={ground}
          title="A week on, at a laptop"
        >
          <GuestPage screen="1440" ground={ground} moment={WEEK} />
        </Shot>
      </Story>
    );

  return side === "host" ? (
    <Story>
      <Shot
        id={`${id}-desk`}
        w={D.w}
        h={D.h}
        ground={ground}
        title="Saturday night: her page as photos land"
      >
        <HostPage screen="1440" ground={ground} moment={NIGHT} />
      </Shot>
      <Shot
        id={`${id}-phone`}
        w={P.w}
        h={P.h}
        ground={ground}
        title="The same, at her phone"
      >
        <HostPage screen="375" ground={ground} moment={NIGHT} />
      </Shot>
      <Shot
        id={`${id}-rooftop`}
        w={P.w}
        h={P.h}
        ground={ground}
        title="Another party, its own light: a neon rooftop"
      >
        <AlbumProvider album={ROOFTOP}>
          <HostPage screen="375" ground={ground} moment={NIGHT} />
        </AlbumProvider>
      </Shot>
    </Story>
  ) : (
    <Story>
      <Shot
        id={`${id}-first`}
        w={P.w}
        h={P.h}
        ground={ground}
        title="Saturday night: her first screen"
      >
        <GuestPage screen="375" ground={ground} moment={NIGHT} />
      </Shot>
      <Shot
        id={`${id}-in`}
        w={P.w}
        h={P.h}
        ground={ground}
        title="Scrolled in, the instant her photo lands"
        measure={readAdd}
      >
        <GuestPage
          screen="375"
          ground={ground}
          moment={NIGHT}
          scroll="album"
          beat="lands"
        />
      </Shot>
      <Shot
        id={`${id}-desk`}
        w={D.w}
        h={D.h}
        ground={ground}
        title="At a laptop"
      >
        <GuestPage screen="1440" ground={ground} moment={NIGHT} />
      </Shot>
      <Shot
        id={`${id}-rooftop`}
        w={P.w}
        h={P.h}
        ground={ground}
        title="Another party, its own light: a neon rooftop"
      >
        <AlbumProvider album={ROOFTOP}>
          <GuestPage screen="375" ground={ground} moment={NIGHT} />
        </AlbumProvider>
      </Shot>
    </Story>
  );
}
