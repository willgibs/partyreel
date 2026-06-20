import { EventCardQr } from "@/components/app/event-card-qr";
import { EventCard } from "@/components/app/event-card";
import { EmptySectionTeaser } from "@/components/app/dashboard/empty-section-teaser";
import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { FeedSection } from "@/components/app/dashboard/feed-section";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";

import { requireDesignKey } from "../gate";
import {
  FilterChipsDemo,
  QrPresetPickerDemo,
} from "../reference/composition-demos";
import { RefHeader, RefSection, Spec } from "../reference/reference-ui";
import { SAMPLE } from "../reference/sample-data";

// THE LIVE COMPOSITIONS REFERENCE: the real PRODUCT components, imported from
// production and rendered from sample props (no DB, no R2). This is the "browse
// the live app UI" half. The data/provider-heavy components (the media grids
// behind LikesProvider, the moderation masonry, the auth-gated buttons) are
// deferred (noted below) until they get a small in-lab harness.
export default async function CompositionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireDesignKey(searchParams);

  const qrSlot = (
    <EventCardQr
      eventId="demo"
      eventName={SAMPLE.eventName}
      qrToken={SAMPLE.qrToken}
      qrStyle={SAMPLE.qrStyle}
      siteUrl={SAMPLE.siteUrl}
    />
  );

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pt-8 pb-20">
      <RefHeader
        eyebrow="Reference · live"
        title="Compositions"
        blurb="The real product components, imported from production and rendered from sample props. This is the live app UI, the way it ships, browsable without seeding an event."
      />

      <RefSection
        title="Event card"
        blurb="The dashboard's atomic unit (V3 stat-forward), in each of its states."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Hosted" hint="QR chip + review chip">
            <EventCard
              variant="hosted"
              href="#"
              name={SAMPLE.eventName}
              coverUrl={SAMPLE.cover}
              dateLabel={SAMPLE.dateLabel}
              itemsLabel="128 items"
              statusLabel="Open"
              pendingCount={3}
              qrSlot={qrSlot}
            />
          </Spec>
          <Spec label="No cover" hint="dark gallery fallback">
            <EventCard
              variant="hosted"
              href="#"
              name="Office Summer Party"
              coverUrl={null}
              dateLabel="Aug 2"
              itemsLabel="0 items"
              statusLabel="Open"
              pendingCount={0}
            />
          </Spec>
          <Spec label="Saved" hint="byline + status">
            <EventCard
              variant="saved"
              href="#"
              name="Priya &amp; Sam"
              coverUrl={SAMPLE.cover2}
              dateLabel="May 30"
              byline="Hosted by Priya"
              statusLabel="Password"
            />
          </Spec>
          <Spec label="Deleted" hint="dimmed + countdown">
            <EventCard
              variant="trash"
              href={null}
              name="Old Test Event"
              coverUrl={SAMPLE.cover3}
              dateLabel="Mar 11"
              statusLabel="6 days left"
            />
          </Spec>
        </div>
      </RefSection>

      <RefSection
        title="Dashboard chrome"
        blurb="The ambient storage meter (open it for the capacity + billing) and the feed filter chips."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Storage meter" hint="ambient · popover">
            <StorageMeter
              storageUsed={1_200_000_000}
              storageCap={5_000_000_000}
              storagePct={24}
              standbyBytes={0}
              overBudget={false}
              passExpiry={null}
              planName="Pro"
              hasBilling
              isEventPass={false}
            />
          </Spec>
          <FilterChipsDemo />
        </div>
      </RefSection>

      <RefSection
        title="Share suite"
        blurb="The QR chip opens the share dialog (the styled QR, copy link, customize); the preset picker styles the code."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Spec label="Share chip" hint="tap to open the dialog">
            <div className="flex items-center gap-3">
              {qrSlot}
              <span className="text-sm text-muted-foreground">
                Opens the share dialog
              </span>
            </div>
          </Spec>
          <QrPresetPickerDemo />
        </div>
      </RefSection>

      <RefSection
        title="Teasers"
        blurb="The empty-state teasers that keep the dashboard inviting before content lands."
      >
        <div className="space-y-3">
          <Spec label="Events empty (hero)" hint="create-first">
            <EventsEmptyTeaser />
          </Spec>
          <Spec label="Section teaser (slim)" hint="parameterized">
            <EmptySectionTeaser
              heading="Your uploads"
              blurb="Photos you add to any event show up here."
            />
          </Spec>
          <Spec label="Feed section" hint="labeled wrapper">
            <FeedSection heading="Your likes">
              <p className="text-sm text-muted-foreground">
                The labeled section the feed uses for each content group.
              </p>
            </FeedSection>
          </Spec>
        </div>
      </RefSection>

      <p className="mt-10 rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm text-muted-foreground">
        Deferred (need a provider, real media, or auth): the media grids behind
        LikesProvider, the moderation and bin masonry, the notification bell, and
        the checkout / billing buttons. These get an in-lab harness later, or land
        here naturally when S3 builds the moderation gallery.
      </p>
    </main>
  );
}
