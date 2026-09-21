import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { GuestList } from "@/components/social/guest-list";
import { Button } from "@/components/ui/button";
import { SetCrumbs } from "@/components/shared/crumbs";
import { PageHeading } from "@/components/shared/page-heading";
import { getEvent } from "@/lib/db/queries/events";
import { getEventGuestList } from "@/lib/db/queries/social";
import { withAvatarUrls } from "@/lib/social/cards";

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
 */
export default async function EventGuestsPage({ params }: PageProps) {
  const { eventId } = await params;
  const event = await getEvent(eventId);
  if (!event) notFound();

  const entries = await getEventGuestList(event.id, { includeUnverified: true });
  const items = entries ? await withAvatarUrls(entries) : null;

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
        <GuestList items={items} />
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
