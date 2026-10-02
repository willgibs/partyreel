"use client";

import { formatCount } from "@/lib/format/count";

import { COVER_PX, GuestPage, HerTile, type RowItem, Rows } from "./album";
import { MODEL_WORDS, type ModelId } from "./model";
import {
  type AlbumKind,
  CoverLine,
  FACTS,
  GuestsFoot,
  Wait,
  type WaitId,
} from "./wait";

/**
 * PRIYA'S ALBUM WHILE PHOTOS WAIT, as one model and one wait draw it: the
 * page production ships with the wait under its cover, in the words of the
 * model picked. `moment` is the frame's beat:
 *  - `landing`: her photo has just landed (her newest marked with its pass of
 *    light), the cover on screen as she meets it;
 *  - `scrolled`: the page scrolled past the cover, the shutter at the foot;
 *  - `loupe`: one of hers opened where it stands, to take back.
 */
export type Moment = "landing" | "scrolled" | "loupe";

/** How far a scrolled frame scrolls: the cover gone, the album's top under the frame's top. */
const SCROLL = COVER_PX - 4;

export function WaitPage({
  model,
  wait,
  album,
  wide,
  moment,
}: {
  model: ModelId;
  wait: WaitId;
  album: AlbumKind;
  wide: boolean;
  moment: Moment;
}) {
  const facts = FACTS[album];
  const m = MODEL_WORDS[model];
  const words = album === "held" ? m.held : m.developing;
  const landing = moment === "landing";
  const loupe = moment === "loupe";
  // ★ HER UPLOADS' ROUND STANDS WHERE PRODUCTION SHOWS IT TODAY: on an album held for approval
  // (`trackerShows`). A developing album has none today, which is half of what this board answers.
  const waitingHers = album === "held" ? facts.hers.length : 0;
  const coverWait = wait === "cover" && words !== null;
  return (
    <GuestPage
      wide={wide}
      mediaCount={0}
      waitingHers={waitingHers}
      eyebrow={m.chip ? m.chip[album] : undefined}
      ground={
        coverWait
          ? { kind: "stills", stills: facts.hers.map((s) => s.still) }
          : { kind: "light" }
      }
      line={coverWait ? <CoverLine facts={facts} words={words} /> : undefined}
      scrolled={moment === "scrolled" ? SCROLL : undefined}
    >
      {words === null ? (
        <ApartHeld wide={wide} landing={landing} inline={m.inline ?? ""} />
      ) : (
        <Wait
          id={wait}
          facts={facts}
          words={words}
          wide={wide}
          landing={landing}
          loupe={loupe}
        />
      )}
      <GuestsFoot guests={album === "held" ? 8 : 11} />
    </GuestPage>
  );
}

/**
 * APPROVAL APART (`model=apart`): a held album is no wait, it is the live
 * album, and until Maya lets anyone in it holds only Priya's own, in place,
 * marked as hers alone. Everyone else's waits unseen and uncounted.
 */
function ApartHeld({
  wide,
  landing,
  inline,
}: {
  wide: boolean;
  landing: boolean;
  inline: string;
}) {
  const hers = FACTS.held.hers;
  const perRow = wide ? 6 : 2;
  const items: RowItem[] = hers.map((s, i) => ({
    kind: "node",
    key: s.id,
    ratio: s.still.w / s.still.h,
    node: (
      <HerTile
        shot={s}
        mark={i === 0 ? inline : undefined}
        landing={landing && i === 0}
      />
    ),
  }));
  while (items.length % perRow)
    items.push({
      kind: "node",
      key: `sp${items.length}`,
      ratio: 1,
      node: null,
    });
  return (
    <div data-tw-wait="apart">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
        <p
          className="px-0.5 text-working text-muted-foreground tabular-nums"
          data-tw-title=""
        >
          {`${formatCount(hers.length)} photos · only you see them for now`}
        </p>
      </div>
      <Rows items={items} perRow={perRow} />
      <p className="mt-4 px-0.5 text-sm text-muted-foreground" data-tw-clock="">
        {`Each shows to everyone once Maya approves it.`}
      </p>
    </div>
  );
}
