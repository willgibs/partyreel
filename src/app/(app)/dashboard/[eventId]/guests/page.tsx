import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import type { GuestListItem } from "@/components/social/guest-list";
import { GuestList } from "@/components/social/guest-list";
import { Button } from "@/components/ui/button";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import { getEvent } from "@/lib/db/queries/events";
import { getConfirmedGuestAddresses } from "@/lib/db/queries/guest-addresses";
import { getEventGuestList } from "@/lib/db/queries/social";
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
 * THE GUESTS ROOM. The named list of every guest who added photos, a
 * verified name and an unverified one (the small mark) alike, or the
 * discovery teaser when the host key is off — `getEventGuestList` returns
 * null in that case (and at the pre-apply seam), exactly as it did when this
 * was a section. Opts INTO the unverified union (`includeUnverified: true`):
 * this room is the host's own full read, unlike the album's guest-facing
 * caller (the identity reshape, 2026-09-21 — unproven=shown-marked, never
 * hidden from the one person the mark exists for).
 *
 * The teaser's door now opens the SETTINGS SHEET on the hub rather than the
 * retired settings route, because the consented flip lives there with the LOUD
 * copy that spells out what turning it on does.
 *
 * ★ AND THE HOST SEES A CONFIRMED GUEST'S ADDRESS UNDER THE NAME (Will,
 * 2026-09-23: "Guests should not see other confirmed guests' emails, making
 * them more comfortable knowing only the host sees it"). The same address the
 * host's viewer shows under an uploader's name, for the listed profile cards
 * only, read AFTER `getEvent` has proved the host (and proved again inside
 * `getConfirmedGuestAddresses`). This page is the one caller of that module;
 * the album renders the same `GuestList` and never passes `emails`. The room
 * still shows nothing while the host's guest list is off (`getEventGuestList`
 * answers null), so no address shows then either.
 */
export default async function EventGuestsPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  const entries = await getEventGuestList(event.id, { includeUnverified: true });
  // The union splits before hydration (lib/social/cards.ts owns why): only a
  // profile card has an avatar to resolve, so `withAvatarUrls` runs on that
  // half alone; the unverified half rejoins as-is, after it, matching the
  // query's own cards-then-unverified order. GuestList (verified-email-guest's)
  // renders the mix: a hydrated card gets its avatar and link, an unverified
  // entry gets neither, both the small mark.
  let items: GuestListItem[] | null = null;
  let emails: Map<string, string> | undefined;
  if (entries) {
    const { cards, unverified } = splitGuestList(entries);
    // Only a profile card can carry an address (an unverified entry's id is
    // its guest row's, and a name nobody proved never shows one), so only the
    // cards' ids are asked for, and only their addresses reach the page.
    const [hydrated, addresses] = await Promise.all([
      withAvatarUrls(cards),
      getConfirmedGuestAddresses(
        event.id,
        cards.map((card) => card.id),
      ),
    ]);
    items = [...hydrated, ...unverified];
    emails = addresses;
  }

  return (
    <div data-route-fade className="space-y-6">
      <SetCrumbs
        trail={[
          { label: "Partyreel", href: "/dashboard" },
          { label: event.name, href: `/dashboard/${event.id}` },
          { label: "Guests" },
        ]}
      />
      <PageHeading>Guests</PageHeading>
      {items ? (
        <GuestList items={items} emails={emails} />
      ) : (
        <FeedSectionEmpty
          icon={Users}
          title="Introduce your guests"
          desc="Turn on the guest list to name everyone who added photos, right on the album. Unverified names wear a small mark."
          action={
            <Button asChild variant="outline" size="sm">
              <Link href={`/dashboard/${event.id}?room=settings`}>
                Guest list settings
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
