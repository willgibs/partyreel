"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import {
  Address,
  Face,
  MarkGlyph,
} from "@/app/(app)/dashboard/[eventId]/guests/people";
import {
  ARRIVES,
  FOLD_FACES,
  Fold,
  ROW_BODY,
  ROW_LINE,
  ROW_PRESS,
  RoomGroup,
  Words,
} from "@/app/(app)/dashboard/[eventId]/guests/room-rows";
import { sinceWords } from "@/app/(app)/dashboard/[eventId]/guests/words";
import { FeedSectionHeader } from "@/components/app/event-feed/feed-section-header";
import type { GuestListItem } from "@/components/social/guest-list";
import { GuestPeek, type CardStanding } from "@/components/social/guest-peek";
import type { BlockTarget } from "@/lib/events/event-blocks";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

/**
 * THE GUESTS, IN THE GUESTS ROOM (guests-room r1, `rows=list`): every person who added to the album as one calm row, its
 * face, its name (the Unverified mark beside a typed one), the host's view of the address under it, and what they
 * added as a column at its end; the whole row one press, for the card every name opens (`card=standing`).
 *
 * ★ WHO ADDED MOST LEADS (the board's carried `guests-order`, the ROADMAP's "the guest list sorted by upload count"):
 * the night's photographers head her list, the first eight, then a fold that lets out a page at a time (Will,
 * `list=faces`: "you click 'View All', and all of a sudden you have a page 100 screens tall all at once"), wearing the
 * next faces so a fold of people still reads as people. Focus follows the fold onto the first row it let out.
 *
 * ★ HEADED GUESTS AND THEIR COUNT (the carried `guests-head`), the product's own word for the people who added, with
 * Invite at its end, where more people come in. The count is the one count (`getEventGuests`), whatever the rows below.
 *
 * ★ AND PEOPLE IN WITH NOTHING ADDED YET, AT ITS FOOT (the ROADMAP's "a guest let in who adds nothing is on no list"):
 * someone let in at the door, or who joined and has added nothing the album shows, is no guest by the one definition,
 * so the count leaves them out; but Let in no longer drops her out of the room. They wait in a quiet fold under the
 * guests, each a row whose card says she is in, with Block, until a photograph of hers lands and she is a guest.
 */

/** The first rows the list shows, and the page each fold lets out (`guest-list.tsx`'s own page of names). */
export const GUESTS_FIRST = 8;
export const GUESTS_PAGE = 24;

/** What a person added, as their row's column says it: by kind, a mix in Review's word for one. */
export function addedColumn(added: { photos: number; videos: number }): {
  n: number;
  word: string;
} {
  const n = added.photos + added.videos;
  if (added.photos > 0 && added.videos > 0) return { n, word: "uploads" };
  if (added.videos > 0) return { n, word: n === 1 ? "video" : "videos" };
  return { n, word: n === 1 ? "photo" : "photos" };
}

/**
 * THEIR COUNT, AS A COLUMN: the figure on tabular figures, a weight above its word, so the rows read down as one column
 * (they stand most first). ★ A SINGULAR KEEPS ITS PLURAL'S WIDTH: "1 photo" holds the "s" it drops, unseen, so its
 * figure stands under the figures above it rather than a letter right.
 */
function AddedColumn({ added }: { added: { photos: number; videos: number } }) {
  const { n, word } = addedColumn(added);
  return (
    <span className="shrink-0 text-caption text-muted-foreground tabular-nums">
      <span className="font-medium">{formatCount(n)}</span>
      {` ${word}`}
      {n === 1 ? <span className="invisible">s</span> : null}
    </span>
  );
}

/** Who Block would name, as the room knows a person: a confirmed guest's account here, a typed name's ticket. */
function blockOf(
  item: GuestListItem,
  eventId: string,
): { target: BlockTarget } {
  return "kind" in item
    ? { target: { kind: "row", guestId: item.id } }
    : { target: { kind: "account", eventId, userId: item.id } };
}

/** A row's one line: the host's view of the address, else what kind of name it is. */
function lineOf(item: GuestListItem, email: string | null): ReactNode {
  if ("kind" in item) return "Typed a name";
  if (email) return <Address email={email} chars={28} />;
  return item.slug ? `@${item.slug}` : "Confirmed their email";
}

function nameOf(item: GuestListItem): string {
  return "kind" in item ? item.displayName : (item.displayName ?? "Guest");
}

function faceOf(item: GuestListItem) {
  return {
    key: item.id,
    name: nameOf(item),
    seed: item.seed ?? null,
  };
}

/** The relations and facts a row reads to draw its person and their card. */
export type GuestRowsContext = {
  eventId: string;
  emails: ReadonlyMap<string, string>;
  added: ReadonlyMap<string, { photos: number; videos: number; since: string }>;
  following: ReadonlySet<string>;
  barred: ReadonlySet<string>;
};

/** One person's row: the whole row the press that opens their card. */
function PersonRow({
  item,
  ctx,
  quiet = false,
  arrives = false,
}: {
  item: GuestListItem;
  ctx: GuestRowsContext;
  /** In with nothing added yet: no column, and their card says so. */
  quiet?: boolean;
  arrives?: boolean;
}) {
  const email = "kind" in item ? null : (ctx.emails.get(item.id) ?? null);
  const added = ctx.added.get(item.id);
  const name = nameOf(item);
  const standing: CardStanding = quiet
    ? { tone: "in", line: "In", aside: "nothing in the album yet" }
    : {
        tone: "in",
        line: added?.since ? `In ${sinceWords(added.since)}` : "In",
      };
  const canFollow =
    !("kind" in item) &&
    !!item.slug &&
    !ctx.following.has(item.id) &&
    !ctx.barred.has(item.id);
  return (
    <li className={cn(ROW_LINE, arrives && ARRIVES)}>
      <GuestPeek
        item={item}
        email={email}
        canFollow={canFollow}
        block={blockOf(item, ctx.eventId)}
        standing={standing}
        added={
          quiet
            ? { photos: 0, videos: 0 }
            : added
              ? { photos: added.photos, videos: added.videos }
              : undefined
        }
      >
        <button
          type="button"
          data-guest-row={item.id}
          className={cn(ROW_BODY, ROW_PRESS)}
        >
          <Face
            name={name}
            seed={item.seed}
            photo={"kind" in item ? null : (item.avatarUrl ?? null)}
            className="size-10"
          />
          <Words
            name={name}
            mark={"kind" in item ? <MarkGlyph /> : undefined}
            line={quiet ? "Nothing in the album yet" : lineOf(item, email)}
          />
          {!quiet && added ? <AddedColumn added={added} /> : null}
        </button>
      </GuestPeek>
    </li>
  );
}

/** A list of rows a page at a time under a fold that lets out the next page, focus following it. */
function PagedRows({
  items,
  ctx,
  quiet = false,
  first,
  label,
}: {
  items: readonly GuestListItem[];
  ctx: GuestRowsContext;
  quiet?: boolean;
  first: number;
  label: string;
}) {
  const [count, setCount] = useState(first);
  const list = useRef<HTMLUListElement>(null);
  const shown = items.slice(0, count);
  const rest = items.slice(count);
  const next = Math.min(GUESTS_PAGE, rest.length);
  // ★ FOCUS FOLLOWS THE FOLD: the rows it held arrive under it, so the keyboard lands on the first of them rather than
  // falling to the page (a pointer's press keeps no halo there).
  const before = useRef(first);
  useEffect(() => {
    if (count === before.current) return;
    list.current?.children[before.current]
      ?.querySelector("button")
      ?.focus({ preventScroll: true });
    before.current = count;
  }, [count]);
  return (
    <>
      <ul ref={list} aria-label={label}>
        {shown.map((item, i) => (
          <PersonRow
            key={item.id}
            item={item}
            ctx={ctx}
            quiet={quiet}
            arrives={i >= first}
          />
        ))}
      </ul>
      {next === 0 ? null : (
        <Fold
          faces={rest.slice(0, FOLD_FACES).map(faceOf)}
          onPress={() => setCount((n) => n + GUESTS_PAGE)}
          data-guests-more=""
        >
          {`${formatCount(next)} more`}
          <span className="sr-only">{`, of ${formatCount(items.length)}`}</span>
        </Fold>
      )}
    </>
  );
}

/** Who added most first, then by name: the night's photographers lead her list. */
export function byAdded(
  items: readonly GuestListItem[],
  added: GuestRowsContext["added"],
): GuestListItem[] {
  const total = (item: GuestListItem) => {
    const a = added.get(item.id);
    return a ? a.photos + a.videos : 0;
  };
  return [...items].sort(
    (a, b) =>
      total(b) - total(a) ||
      nameOf(a).localeCompare(nameOf(b), undefined, { sensitivity: "base" }),
  );
}

/**
 * THE GUESTS SECTION: its head (GUESTS, the one count, Invite), the guests as rows (or, while there are none, the
 * room's own line for why), and the people in with nothing added yet folded at its foot.
 */
export function RoomGuests({
  items,
  quiet,
  ctx,
  invite,
  empty,
}: {
  items: readonly GuestListItem[];
  quiet: readonly GuestListItem[];
  ctx: GuestRowsContext;
  /** The room's quiet Invite, at the head's end. */
  invite: ReactNode;
  /** What stands where the rows would while nobody has added (the room's line: nobody yet, or a roll developing). */
  empty: ReactNode;
}) {
  const [quietOpen, setQuietOpen] = useState(false);
  const quietId = useId();
  const sorted = byAdded(items, ctx.added);
  return (
    <section
      id="guests"
      aria-label="Guests"
      data-guests=""
      className="space-y-2"
    >
      <FeedSectionHeader label="Guests" count={items.length} action={invite} />
      {items.length === 0 && quiet.length === 0 ? (
        empty
      ) : (
        <>
          {items.length === 0 ? empty : null}
          <RoomGroup>
            {items.length > 0 ? (
              <PagedRows
                items={sorted}
                ctx={ctx}
                first={GUESTS_FIRST}
                label="Guests who added"
              />
            ) : null}
            {quiet.length > 0 ? (
              <>
                <Fold
                  faces={quiet.slice(0, FOLD_FACES).map(faceOf)}
                  expanded={quietOpen}
                  controls={quietId}
                  onPress={() => setQuietOpen((o) => !o)}
                  data-guests-quiet=""
                >
                  {`${formatCount(quiet.length)} in, nothing added yet`}
                </Fold>
                {quietOpen ? (
                  <div id={quietId} className="border-t">
                    <PagedRows
                      items={quiet}
                      ctx={ctx}
                      quiet
                      first={GUESTS_PAGE}
                      label="In, nothing added yet"
                    />
                  </div>
                ) : null}
              </>
            ) : null}
          </RoomGroup>
        </>
      )}
    </section>
  );
}
