"use client";

import { useState } from "react";

import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { FollowButton } from "@/components/social/follow-button";
import { GuestPeek } from "@/components/social/guest-peek";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import type { BlockTarget } from "@/lib/events/event-blocks";
import type { ProfileCardItem } from "@/lib/social/cards";

/**
 * The named "Guests" list, ALWAYS ON (Will, event-safety `room=always`, 2026-09-28:
 * "Always on for everyone"). One presentational component for BOTH surfaces (the
 * host's Guests room and the guest album), so the two can never drift. Items arrive
 * fully hydrated (avatar URLs, never storage paths).
 *
 * ★ EVERY NAME OPENS A LOOK (`popups` r1, `peek=card`, Will 2026-09-27): a
 * card beside the name at a desk, the Sheet in a hand (`guest-peek.tsx`). A
 * name with a page reaches it from the look's Open full profile; a name without
 * one still opens the look, where before it opened nothing (and still no dead
 * link, no "claim a handle" nudge on someone else's album).
 *
 * ★ NAME-ONLY GUESTS ARE ON IT NOW, MARKED (Will, at the identity reshape's
 * approval, 2026-09-21, verbatim: "Listed, with the mark"). Anonymity left the
 * product, so the old exclusion ("anonymous uploads never appear") excludes
 * nothing that still exists: what it would exclude today is a person who typed a
 * name and put twelve photographs in the album, which is the opposite of what a
 * guest list is for. They arrive as `{ kind: "unverified" }` entries after the
 * profile cards (`getEventGuestList(id, { includeUnverified })`), wear the mark
 * with its own explanation, and link nowhere: there is no page behind a name
 * nobody proved. ★ ONE ENTRY PER GUEST ROW, not per person, which is his
 * `allowance=open` world showing through: two people can type one name and they
 * are two guests until one of them proves otherwise (his to overrule).
 *
 * ★ AND A HANDLED CHIP CAN BE FOLLOWED, by a signed-in viewer who is not already
 * following them and is not themselves. The album is where a guest meets the
 * other guests; making them open a profile first to do the one thing a profile
 * is for was a door with nothing behind it.
 *
 * ★ ABOVE TWELVE IT BECOMES A ROW OF FACES (Will, `list=faces`, 2026-09-19:
 * "This is the condensed version once we exceed a certain count, but let's add
 * an option to expand that into the full list. For bigger lists, we should
 * continue to have pagination to expand into groups. I can imagine an edge case
 * with a thousand guests, and you click 'View All', and all of a sudden you
 * have a page 100 screens tall all at once"). Twenty-four signed-in uploaders
 * is an ordinary wedding, and at a phone that is the tallest thing between the
 * album and the footer.
 *
 * ★ AND THE ROW OPENS THE LIST AS A LIST (`popups` r1, `lists=panel`, which
 * answered his "modal, sheet, page, going down existing spot on page"): a side
 * panel beside the album at a desk, and in a hand the whole screen under a back
 * arrow, the phone's own Back closing it. Inside, still a page of names at a
 * time: the thousand-guest edge case is answered by the page size, never by the
 * container.
 *
 * ★ WHY THIS FILE IS A CLIENT ISLAND. The panel and the looks are state, and
 * the alternative was a second component wrapping this one on both surfaces,
 * which is exactly the drift the one-component rule exists to prevent. Its
 * props stay plain data, so both server callers pass what they always passed.
 *
 * ★ THE HOST SEES A CONFIRMED GUEST'S ADDRESS UNDER THE NAME, AND NOBODY ELSE
 * DOES (Will, 2026-09-23: "Guests should not see other confirmed guests'
 * emails, making them more comfortable knowing only the host sees it"). The
 * address arrives through `emails`, which ONLY the Guests room passes (read by
 * `getConfirmedGuestAddresses`, which proves the host itself); the album never
 * does, and social.guest-identity.test.ts holds that. It is keyed by user id, so
 * only a profile card can wear one: an unverified entry's id is a guest row's,
 * and a name nobody proved never shows an address even if one were somehow
 * handed over. It shows in the chips and in the opened names panel alike (both
 * are `Chips`); the faces row names nobody, so it shows none.
 *
 * ★ AND THE HOST ALONE CAN BLOCK FROM A NAME'S LOOK (event-safety `entry=all`):
 * `blockFrom`, like `emails`, is passed only by the Guests room, and each look
 * gets the one way the room knows its person (a confirmed guest's account, a
 * typed name's row). A person the host blocked is not on this list at all.
 */

/**
 * A guest with no proof: a `guests` row carrying a typed name and nothing else. ★ The name is never null:
 * a row with no name is on no list (`resolveEventGuests` drops it, the one count's rule), so there is no
 * nameless entry to draw, and no stand-in to invent for one ("A guest" was retired with the identity
 * reshape: a nameless credit shows nothing). The server's own entry (`UnverifiedGuestListEntry`) has the
 * same shape, and a look built from a credit carries the credit's name.
 */
export type UnverifiedGuestEntry = {
  kind: "unverified";
  id: string;
  displayName: string;
  /**
   * HER COLOUR: `seedFor` of her own guest row (`splitGuestList`, hashed on the server like every seed), never her
   * name, so a typed name cannot choose one and two "Sam"s are two colours. One colour per ticket: she returns on
   * another device as a new row and a new colour, which only an account cures, and it turns once to her account's
   * when she confirms and claims. Absent only on a road that has not read it (a look built from a credit whose
   * item carries no face).
   */
  seed?: string;
};

/**
 * What the list renders: a hydrated profile card, or a name nobody proved. A
 * profile card carries no `kind` (the database's own union, `getEventGuestList`),
 * so `"kind" in item` is the discriminator, here and in the look. Its seed may be
 * missing on one road only: a look built from a photograph's credit
 * (`credit-look.tsx`), whose item carries no face yet; every card that went
 * through `withAvatarUrls` and every entry that went through `splitGuestList` has one.
 */
export type GuestListItem =
  | (Omit<ProfileCardItem, "seed"> & { seed?: string })
  | UnverifiedGuestEntry;

function isUnverified(item: GuestListItem): item is UnverifiedGuestEntry {
  return "kind" in item;
}

/** Above this many uploaders the list condenses to the faces row. Exported so
 *  the CALLERS can drop their own count from the heading: the row says the
 *  number itself, and it must render once rather than twice. */
export const GUEST_LIST_FACES_THRESHOLD = 12;

/** Faces on the row before the +N. Six fits 375 beside the sentence. */
const FACES = 6;

/** One page of names when the row is opened. */
const PAGE = 24;

/** A name, as the button that opens its look: the chip's own face and words. */
const NAME_BUTTON =
  "transition-transform duration-150 ease-emphasis outline-none hover:bg-muted/60 focus-halo active:scale-[0.97] motion-reduce:active:scale-100";

const CHIP =
  "flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm";

/**
 * A chip that carries an address is two lines tall (the name, the address under
 * it: 20 + 16, 4px of padding and 1px of border above and below = 46px), and
 * its face moves in to 11px from the outer edge (10 of padding, 1 of border) so
 * the 24px avatar stays concentric with the capsule's end, 11px clear on every
 * side (23 = 12 + 11).
 */
const CHIP_WITH_ADDRESS =
  "flex max-w-full items-center gap-2 rounded-full border border-border py-1 pr-4 pl-2.5 text-sm";

/** The longest address a chip draws whole, and the most of it a domain may take. */
const ADDRESS_CHARS = 30;
const DOMAIN_CHARS = 20;

/**
 * A confirmed address, shortened FROM THE MIDDLE: the part before the @ gives
 * way first, because the domain is usually what tells a host whether an address
 * is real (his "fakeemail@domain.com"), and only a domain longer than
 * `DOMAIN_CHARS` loses its own end. Shortened as text rather than by CSS
 * ellipsis, which leaves a sliver of blank before the domain wherever a glyph
 * would not fit; the chip's `truncate` stays as the net for unusually wide ones.
 */
function shortAddress(email: string): string {
  if (email.length <= ADDRESS_CHARS) return email;
  // A cut never ends on the address's own punctuation: "1987…", not "1987.…".
  const cut = (text: string, chars: number) =>
    `${text.slice(0, chars).replace(/[._+-]+$/, "")}…`;
  const at = email.lastIndexOf("@");
  if (at <= 0) return cut(email, ADDRESS_CHARS - 1);
  const whole = email.slice(at);
  const domain =
    whole.length > DOMAIN_CHARS ? cut(whole, DOMAIN_CHARS - 1) : whole;
  const room = Math.max(3, ADDRESS_CHARS - domain.length - 1);
  const local = at <= room ? email.slice(0, at) : cut(email, room);
  return `${local}${domain}`;
}

/**
 * The address under a confirmed name. A shortened one is drawn for the eye
 * alone, with the whole address beside it for a screen reader and in the title.
 */
function Address({ email }: { email: string }) {
  const short = shortAddress(email);
  const look = "max-w-56 truncate text-caption text-muted-foreground";
  if (short === email) {
    return (
      <span title={email} className={look}>
        {email}
      </span>
    );
  }
  return (
    <>
      <span className="sr-only">{email}</span>
      <span aria-hidden title={email} className={look}>
        {short}
      </span>
    </>
  );
}

// item.seed is seedFor(item.id), hydrated onto every ProfileCardItem by
// withAvatarUrls and onto every unverified entry by splitGuestList
// (lib/social/cards.ts) — one colour per person, the same place avatarUrl is
// resolved, so a guest list of two dozen strangers is two dozen distinct hues
// rather than one repeated grey disc. A name nobody proved wears her own ROW's
// colour but never a photograph (she has none): the mark says what is not
// proven, and the colour is only the row's, so it lends her no claim.
function Face({ item }: { item: GuestListItem }) {
  const unverified = isUnverified(item);
  return (
    <Avatar size="sm" seed={item.seed}>
      {!unverified && <AvatarImage src={item.avatarUrl ?? undefined} alt="" />}
      <AvatarFallback className="text-[10px]">
        {(item.displayName ?? "?").slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

/** Who a name's Block would name, as the Guests room knows them (never on the album). */
function blockFor(
  item: GuestListItem,
  blockFrom: { eventId: string } | undefined,
): { target: BlockTarget } | undefined {
  if (!blockFrom) return undefined;
  return isUnverified(item)
    ? { target: { kind: "row", guestId: item.id } }
    : {
        target: {
          kind: "account",
          eventId: blockFrom.eventId,
          userId: item.id,
        },
      };
}

function Chips({
  items,
  viewerId,
  followingIds,
  emails,
  blockFrom,
}: {
  items: GuestListItem[];
  viewerId?: string | null;
  followingIds?: ReadonlySet<string>;
  emails?: ReadonlyMap<string, string>;
  blockFrom?: { eventId: string };
}) {
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => {
        if (isUnverified(item)) {
          return (
            <li key={item.id}>
              {/* No link, and no nudge: there is no page behind a name nobody
                  proved, and telling somebody else's guest to go and prove it
                  is not this album's business. The mark carries the why, and
                  sits BESIDE the name's button, never inside it (it is a
                  button of its own). */}
              <span className={`${CHIP} text-muted-foreground`}>
                <GuestPeek
                  item={item}
                  canFollow={false}
                  block={blockFor(item, blockFrom)}
                >
                  <button
                    type="button"
                    className={`-my-1 -ml-1 flex min-w-0 items-center gap-2 rounded-full py-1 pr-1 pl-1 ${NAME_BUTTON}`}
                  >
                    <Face item={item} />
                    <span className="max-w-40 truncate">
                      {item.displayName}
                    </span>
                  </button>
                </GuestPeek>
                <UnverifiedMark name={item.displayName} />
              </span>
            </li>
          );
        }
        // Looked up ONLY here, on the profile half: the unverified branch above
        // never reads the map (an address never sits under a name nobody proved).
        const email = emails?.get(item.id) ?? null;
        const chipClass = email ? CHIP_WITH_ADDRESS : CHIP;
        const name = (
          <span className="max-w-40 truncate">
            {item.displayName ?? "Guest"}
          </span>
        );
        const chip = (
          <>
            <Face item={item} />
            {email ? (
              <span className="flex min-w-0 flex-col text-left">
                {name}
                <Address email={email} />
              </span>
            ) : (
              name
            )}
          </>
        );
        // Only where it earns its space: a signed-in viewer, somebody else, a
        // real page to follow, and not one they already follow.
        const canFollow = Boolean(
          viewerId &&
          item.slug &&
          item.id !== viewerId &&
          !followingIds?.has(item.id),
        );
        return (
          <li key={item.id} className="flex items-center gap-1.5">
            <GuestPeek
              item={item}
              email={email}
              canFollow={canFollow}
              block={blockFor(item, blockFrom)}
            >
              <button
                type="button"
                className={`${chipClass} ${item.slug ? "text-foreground" : "text-muted-foreground"} ${NAME_BUTTON}`}
              >
                {chip}
              </button>
            </GuestPeek>
            {canFollow && item.slug && (
              <FollowButton profileId={item.id} initialFollowing={false} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function GuestList({
  items,
  viewerId,
  followingIds,
  emails,
  blockFrom,
}: {
  items: GuestListItem[];
  /** The signed-in viewer, so a Follow can appear on somebody else's chip. */
  viewerId?: string | null;
  /** Who this viewer already follows: no Follow on a chip that would be a no-op. */
  followingIds?: ReadonlySet<string>;
  /**
   * HOST-ONLY: a confirmed guest's address by user id, drawn under the name.
   * Only the Guests room passes it (`getConfirmedGuestAddresses`); a guest's
   * album never does, so no guest ever sees another guest's address.
   */
  emails?: ReadonlyMap<string, string>;
  /**
   * HOST-ONLY: the event a name's look can block its person from. Only the
   * Guests room passes it; the album never does.
   */
  blockFrom?: { eventId: string };
}) {
  if (items.length === 0) {
    // [] means nobody has added a photograph yet (the list is always on). ★ The
    // line dropped "signed-in" at the identity reshape: every uploader carries a
    // name now, so the old qualifier described a distinction the product no
    // longer has.
    return (
      <p className="text-sm text-muted-foreground">
        Nobody has added photos yet.
      </p>
    );
  }

  if (items.length <= GUEST_LIST_FACES_THRESHOLD) {
    return (
      <Chips
        items={items}
        viewerId={viewerId}
        followingIds={followingIds}
        emails={emails}
        blockFrom={blockFrom}
      />
    );
  }

  return (
    <GuestListPanel
      items={items}
      viewerId={viewerId}
      followingIds={followingIds}
      emails={emails}
      blockFrom={blockFrom}
    />
  );
}

/**
 * THE FACES ROW AND THE LIST IT OPENS (`lists=panel`). The whole row is the
 * button, not a "View all" beside it: the faces are what a thumb aims at, and a
 * few characters of text next to a row of portraits is the wrong hit area on
 * the surface this ships on.
 */
function GuestListPanel({
  items,
  viewerId,
  followingIds,
  emails,
  blockFrom,
}: {
  items: GuestListItem[];
  viewerId?: string | null;
  followingIds?: ReadonlySet<string>;
  emails?: ReadonlyMap<string, string>;
  blockFrom?: { eventId: string };
}) {
  // How many names the open list shows, a page at a time; back to one page
  // whenever it closes, so it always opens at its head.
  const [shown, setShown] = useState(PAGE);
  const faces = items.slice(0, FACES);
  const page = items.slice(0, shown);
  const rest = items.length - page.length;
  const count = `${items.length} guests added photos`;

  return (
    <Popup onOpenChange={(open) => !open && setShown(PAGE)}>
      <PopupTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-3 rounded-full text-left transition-transform duration-150 ease-emphasis outline-none focus-halo active:scale-[0.99] motion-reduce:active:scale-100"
        >
          <AvatarGroup>
            {faces.map((item) => (
              <Face key={item.id} item={item} />
            ))}
            <AvatarGroupCount className="size-6 text-[10px]">
              +{items.length - faces.length}
            </AvatarGroupCount>
          </AvatarGroup>
          <span className="text-sm text-muted-foreground">{count}</span>
        </button>
      </PopupTrigger>
      <PopupContent kind="list" data-guest-list-panel>
        <PopupHeader title="Guests" description={count} />
        <PopupBody className="space-y-2">
          <Chips
            items={page}
            viewerId={viewerId}
            followingIds={followingIds}
            emails={emails}
            blockFrom={blockFrom}
          />
          {rest > 0 && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className={`${CHIP} border-dashed pl-3 text-muted-foreground transition-transform duration-150 ease-emphasis outline-none hover:bg-muted/60 focus-halo active:scale-[0.97] motion-reduce:active:scale-100`}
            >
              Show {rest > PAGE ? PAGE : rest} more
            </button>
          )}
        </PopupBody>
      </PopupContent>
    </Popup>
  );
}
