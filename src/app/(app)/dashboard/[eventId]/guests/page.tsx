import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { AtTheDoor, type DoorPerson } from "@/app/(app)/dashboard/[eventId]/guests/at-the-door";
import { GuestsInvite } from "@/app/(app)/dashboard/[eventId]/guests/guests-invite";
import { InvitedSection } from "@/app/(app)/dashboard/[eventId]/guests/invited-section";
import { BlockedSection } from "@/components/app/event-blocks/blocked-section";
import type { GuestListItem } from "@/components/social/guest-list";
import { GuestList } from "@/components/social/guest-list";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import {
  resolveViewerZone,
  serverZone,
  VIEWER_ZONE_HEADER,
} from "@/lib/dashboard/viewer-day";
import { getDoorQueue, getInviteList } from "@/lib/db/queries/event-doors";
import { getEventBlocks } from "@/lib/db/queries/event-blocks";
import { getEvent } from "@/lib/db/queries/events";
import { getConfirmedGuestAddresses } from "@/lib/db/queries/guest-addresses";
import { getEventGuestList } from "@/lib/db/queries/social";
import { seedFor } from "@/lib/avatar/seed";
import { askedAgo } from "@/lib/event/door/words";
import { blockedSince, deletedUntil } from "@/lib/events/event-blocks";
import { eventUrl } from "@/lib/events/share-urls";
import { getSiteUrl } from "@/lib/site-url";
import { splitGuestList, withAvatarUrls } from "@/lib/social/cards";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ eventId: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  return { title: event ? `Guests · ${event.name}` : "Guests" };
}

/**
 * THE GUESTS ROOM. The named list of every guest who added photos, a verified name and an unverified
 * one (the small mark) alike, ALWAYS (Will, event-safety `room=always`, 2026-09-28: "make the guest
 * list always on, so a host doesn't have to turn it on or learn special handling"): the invitation to
 * turn the list on is gone with the switch. Opts INTO the unverified union (`includeUnverified: true`):
 * this room is the host's own full read, unlike the album's guest-facing caller (the identity reshape,
 * 2026-09-21: unproven=shown-marked, never hidden from the one person the mark exists for).
 *
 * ★ AND THE HOST SEES A CONFIRMED GUEST'S ADDRESS UNDER THE NAME (Will, 2026-09-23: "Guests should not
 * see other confirmed guests' emails, making them more comfortable knowing only the host sees it").
 * The same address the host's viewer shows under an uploader's name, for the listed profile cards
 * only, read AFTER `getEvent` has proved the host (and proved again inside
 * `getConfirmedGuestAddresses`). This page is the one caller of that module; the album renders the
 * same `GuestList` and never passes `emails`.
 *
 * ★ AND THE DOOR'S TWO LISTS (event-settings r1): At the door heads the room (`queue=room`: Let in and
 * Decline on each newcomer who waits), and Invited follows the guests (`editor=both`: the invite list,
 * each address Joined or Not yet), with Invite the room's main action while it is empty and a quiet
 * one after.
 *
 * ★ EVERY NAME'S LOOK CAN BLOCK ITS PERSON, QUIETLY, AND THE BLOCKED ARE LISTED AT THE FOOT (event-
 * safety `entry=all`, `blocked=foot`): the look stays social with Block its last, smallest line
 * (`blockFrom`, passed by this room alone), and under the guests a quiet Blocked section says who,
 * since when, and Let back in, the one place a blocked person is still named, since they leave the
 * list above and every count. Its rows are read on the host's own client (RLS: the host's own
 * events), after `getEvent` has proved the host.
 */
export default async function EventGuestsPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  // The blocked list's dates in the host's own zone (the dashboard's day rule, viewer-day.ts).
  const zone = resolveViewerZone(
    (await headers()).get(VIEWER_ZONE_HEADER),
    serverZone(),
  );
  // ★ THE DOOR'S TWO LISTS (event-settings r1), read on the service role only now that `getEvent` has
  // proved the host (RLS): who waits at the door, and the invite list.
  const [entries, blocked, queue, invited, siteUrl] = await Promise.all([
    getEventGuestList(event.id, { includeUnverified: true }),
    getEventBlocks(event.id, {
      since: (iso) => blockedSince(iso, zone),
      until: (iso) => deletedUntil(iso, zone),
    }),
    getDoorQueue(event.id),
    getInviteList(event.id),
    getSiteUrl(),
  ]);
  // When each asked, said on the server, so the first paint and the client agree.
  // eslint-disable-next-line react-hooks/purity -- a server component renders once per request
  const now = Date.now();
  const atTheDoor: DoorPerson[] = queue.people.map((person) => ({
    guestId: person.guestId,
    userId: person.userId,
    name: person.name,
    email: person.email,
    asked: askedAgo(person.askedAt, now),
    seed: person.userId ? seedFor(person.userId) : null,
  }));

  // The union splits before hydration (lib/social/cards.ts owns why): only a profile card has an
  // avatar to resolve, so `withAvatarUrls` runs on that half alone; the unverified half rejoins
  // as-is, after it, matching the query's own cards-then-unverified order. Only a profile card can
  // carry an address (an unverified entry's id is its guest row's, and a name nobody proved never
  // shows one), so only the cards' ids are asked for, and only their addresses reach the page.
  const { cards, unverified } = splitGuestList(entries);
  const [hydrated, emails] = await Promise.all([
    withAvatarUrls(cards),
    getConfirmedGuestAddresses(
      event.id,
      cards.map((card) => card.id),
    ),
  ]);
  const items: GuestListItem[] = [...hydrated, ...unverified];
  // ★ INVITE IS THE ROOM'S MAIN ACTION WHILE IT IS EMPTY, and a quiet one after (`editor=both`).
  const empty =
    items.length === 0 && queue.total === 0 && invited.length === 0;
  const invite = (
    <GuestsInvite
      eventId={event.id}
      eventName={event.name}
      joinUrl={eventUrl(siteUrl, event.qr_token)}
      qrStyle={event.qr_style}
      prominent={empty}
    />
  );

  return (
    <div data-route-fade className="space-y-6">
      <SetCrumbs
        trail={[
          { label: "Partyreel", href: "/dashboard" },
          { label: event.name, href: `/dashboard/${event.id}` },
          { label: "Guests" },
        ]}
      />
      <div className="flex items-center justify-between gap-3">
        <PageHeading>Guests</PageHeading>
        {empty ? null : invite}
      </div>
      <AtTheDoor eventId={event.id} people={atTheDoor} total={queue.total} />
      {empty ? (
        <div
          data-guests-empty=""
          className="flex flex-col items-start gap-3 rounded-lg border border-dashed p-5"
        >
          <p className="text-sm text-muted-foreground">
            Nobody has added photos yet. Invite your guests: they scan the code
            or open the link, and add from their own phones.
          </p>
          {invite}
        </div>
      ) : (
        <GuestList
          items={items}
          emails={emails}
          blockFrom={{ eventId: event.id }}
        />
      )}
      <InvitedSection
        eventId={event.id}
        invited={invited.map((i) => ({ email: i.email, joined: i.joined }))}
        listIsTheDoor={event.door === "invite"}
      />
      <BlockedSection eventName={event.name} people={blocked} />
    </div>
  );
}
