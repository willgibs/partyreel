"use client";

import { useState } from "react";
import Link from "next/link";

import { UnverifiedMark } from "@/components/shared/unverified-mark";
import { FollowButton } from "@/components/social/follow-button";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import type { ProfileCardItem } from "@/lib/social/cards";

/**
 * The named "Guests" list (profiles-social.md: renders ONLY when the host turned on
 * show_guest_list). One presentational component for BOTH surfaces (the host event
 * page section and the guest album), so the two can never drift. Items arrive fully
 * hydrated (avatar URLs, never storage paths).
 *
 * A guest WITH a handle links to /u/<slug>; one without renders as a plain chip
 * (no dead link, no "claim a handle" nudge on someone else's album).
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
 * ★ THE EXPANSION HERE IS THE INTERIM, AND IT SAYS SO. He asked for an
 * exploration of HOW View all opens ("modal, sheet, page, going down existing
 * spot on page") and that is round two's board (profile-reach). Until it lands,
 * the row expands IN PLACE, a page of names at a time, which is the option that
 * cannot be wrong: it adds no new surface for the winner to have to remove, and
 * the thousand-guest edge case is answered by the page size rather than by a
 * container. Replace the expanded branch with round two's winner; the faces row
 * itself is ruled.
 *
 * ★ WHY THIS FILE IS A CLIENT ISLAND NOW. It was server-renderable and the
 * chips still are, but "expand in place" is state, and the alternative was a
 * second component wrapping this one on both surfaces, which is exactly the
 * drift the one-component rule exists to prevent. Its props stay plain data, so
 * both server callers pass what they always passed.
 */

/** A guest with no proof: a `guests` row carrying a typed name and nothing else. */
export type UnverifiedGuestEntry = {
  kind: "unverified";
  id: string;
  displayName: string | null;
};

/**
 * What the list renders. The profile half is left EXACTLY as it was, with `kind`
 * optional, because the retired `profile-page` sandbox board still feeds this
 * component its own fixtures and a wiring lane never breaks the props of a
 * module the lab imports.
 */
export type GuestListItem =
  | (ProfileCardItem & { kind?: "profile" })
  | UnverifiedGuestEntry;

function isUnverified(item: GuestListItem): item is UnverifiedGuestEntry {
  return item.kind === "unverified";
}

/** Above this many uploaders the list condenses to the faces row. Exported so
 *  the CALLERS can drop their own count from the heading: the row says the
 *  number itself, and it must render once rather than twice. */
export const GUEST_LIST_FACES_THRESHOLD = 12;

/** Faces on the row before the +N. Six fits 375 beside the sentence. */
const FACES = 6;

/** One page of names when the row is opened. */
const PAGE = 24;

const CHIP =
  "flex h-8 items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1 text-sm";

// item.seed is seedFor(item.id), hydrated onto every ProfileCardItem by
// withAvatarUrls (lib/social/cards.ts) — one colour per person, the same
// place avatarUrl is resolved, so a guest list of two dozen strangers is
// two dozen distinct hues rather than one repeated grey disc. An unverified
// entry carries no seed and wears the plain disc: a colour is an identity on
// every other surface, and this one has not been proven.
function Face({ item }: { item: GuestListItem }) {
  const unverified = isUnverified(item);
  return (
    <Avatar size="sm" seed={unverified ? undefined : item.seed}>
      {!unverified && <AvatarImage src={item.avatarUrl ?? undefined} alt="" />}
      <AvatarFallback className="text-[10px]">
        {(item.displayName ?? "?").slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function Chips({
  items,
  viewerId,
  followingIds,
}: {
  items: GuestListItem[];
  viewerId?: string | null;
  followingIds?: ReadonlySet<string>;
}) {
  return (
    <ul className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => {
        if (isUnverified(item)) {
          return (
            <li key={item.id}>
              {/* No link, and no nudge: there is no page behind a name nobody
                  proved, and telling somebody else's guest to go and prove it
                  is not this album's business. The mark carries the why. */}
              <span className={`${CHIP} text-muted-foreground`}>
                <Face item={item} />
                <span className="max-w-40 truncate">
                  {item.displayName ?? "A guest"}
                </span>
                <UnverifiedMark name={item.displayName} />
              </span>
            </li>
          );
        }
        const chip = (
          <>
            <Face item={item} />
            <span className="max-w-40 truncate">
              {item.displayName ?? "Guest"}
            </span>
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
            {item.slug ? (
              <Link
                href={`/u/${item.slug}`}
                className={`${CHIP} text-foreground transition-transform duration-150 ease-emphasis outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100`}
              >
                {chip}
              </Link>
            ) : (
              <span className={`${CHIP} text-muted-foreground`}>{chip}</span>
            )}
            {canFollow && item.slug && (
              <FollowButton
                profileId={item.id}
                slug={item.slug}
                initialFollowing={false}
              />
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
}: {
  items: GuestListItem[];
  /** The signed-in viewer, so a Follow can appear on somebody else's chip. */
  viewerId?: string | null;
  /** Who this viewer already follows: no Follow on a chip that would be a no-op. */
  followingIds?: ReadonlySet<string>;
}) {
  // How many names are showing. 0 = the condensed row (the list is past the
  // threshold and nobody has opened it yet).
  const [shown, setShown] = useState(0);

  if (items.length === 0) {
    // [] means the host's key is ON and nobody has added a photograph yet. null
    // (the key is off) never reaches this component: both callers gate on it,
    // which is what getEventGuestList's null-against-[] return is for. ★ The
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
      <Chips items={items} viewerId={viewerId} followingIds={followingIds} />
    );
  }

  if (shown === 0) {
    const faces = items.slice(0, FACES);
    return (
      // THE WHOLE ROW IS THE BUTTON, not a "View all" beside it: the faces are
      // what a thumb aims at, and a few characters of text next to a row of
      // portraits is the wrong hit area on the surface this ships on.
      <button
        type="button"
        onClick={() => setShown(PAGE)}
        aria-expanded={false}
        className="flex items-center gap-3 rounded-full text-left transition-transform duration-150 ease-emphasis outline-none focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.99] motion-reduce:active:scale-100"
      >
        <AvatarGroup>
          {faces.map((item) => (
            <Face key={item.id} item={item} />
          ))}
          <AvatarGroupCount className="size-6 text-[10px]">
            +{items.length - faces.length}
          </AvatarGroupCount>
        </AvatarGroup>
        <span className="text-sm text-muted-foreground">
          {items.length} guests added photos
        </span>
      </button>
    );
  }

  const page = items.slice(0, shown);
  const rest = items.length - page.length;
  return (
    <div className="space-y-2">
      <Chips items={page} viewerId={viewerId} followingIds={followingIds} />
      {rest > 0 && (
        <button
          type="button"
          onClick={() => setShown((n) => n + PAGE)}
          className={`${CHIP} border-dashed pl-3 text-muted-foreground transition-transform duration-150 ease-emphasis outline-none hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-[0.97] motion-reduce:active:scale-100`}
        >
          Show {rest > PAGE ? PAGE : rest} more
        </button>
      )}
    </div>
  );
}
