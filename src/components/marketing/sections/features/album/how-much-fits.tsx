import { Check } from "lucide-react";
import type { CSSProperties } from "react";

import { LearnMoreLink } from "@/components/marketing/sections/shared/learn-more-link";
import { MonoCaption } from "@/components/marketing/system/mono-caption";
import { Reveal } from "@/components/marketing/system/reveal";
import { SectionShell } from "@/components/marketing/system/section-shell";
import {
  formatLimit,
  friendlyCapacity,
  MAX_EVENTS,
  planById,
  plansForTier,
  videosAllowedForTier,
} from "@/lib/constants/tiers";
import { formatBytes } from "@/lib/utils";

/**
 * HOW MUCH FITS: the plans framed as album size, because that is the question
 * a host actually has ("is there a total cap, and what happens when we hit
 * it?"). Every number DERIVES from tiers.ts (caps, prices, event counts, the
 * friendly photo count) so this page can never disagree with /pricing, and the
 * cap behaviour beneath quotes the guest's real refusal. Nothing here about
 * write headroom or monthly meters, which are deliberately unmarketed.
 */

function Column({
  name,
  bytes,
  price,
  events,
  video,
  sizes,
  index,
}: {
  name: string;
  bytes: number;
  price: string;
  events: string;
  video: boolean;
  /** Pro's three sizes, as a third line of the checklist. */
  sizes?: string;
  index: number;
}) {
  const photos = friendlyCapacity(bytes).photos;
  return (
    <div
      data-mkt-reveal
      className="flex flex-col gap-4 rounded-2xl border bg-card p-6 ring-1 ring-foreground/5"
      style={{ "--i": 3 + index } as CSSProperties}
    >
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-heading text-lg">{name}</h3>
        <MonoCaption>{price}</MonoCaption>
      </div>
      <div>
        <p className="font-heading text-4xl tracking-tight tabular-nums">
          {formatBytes(bytes)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          about {photos.toLocaleString("en-US")} photos
        </p>
      </div>
      <ul className="flex flex-col gap-2 border-t pt-4 text-sm">
        <li className="flex items-center gap-2">
          <Check className="size-3.5 text-success" strokeWidth={2.5} />
          {video ? "Photos and video" : "Photos only"}
        </li>
        <li className="flex items-center gap-2">
          <Check className="size-3.5 text-success" strokeWidth={2.5} />
          {events}
        </li>
        {sizes && (
          <li className="flex items-center gap-2">
            <Check className="size-3.5 text-success" strokeWidth={2.5} />
            {sizes}
          </li>
        )}
      </ul>
    </div>
  );
}

export function HowMuchFits() {
  const free = planById("free");
  const pass = planById("event_pass");
  const pro = plansForTier("pro");
  const proSizes = pro.map((p) => formatBytes(p.storageBytes));
  const proSizeLine = `${proSizes.slice(0, -1).join(", ")}, or ${proSizes[proSizes.length - 1]}`;

  return (
    <SectionShell
      eyebrow="How much fits"
      heading="Room for the whole event."
      subhead="A plan is a total amount of album, not a count of photos. Every file draws from the same pool."
    >
      <Reveal className="mx-auto mt-12 grid max-w-5xl gap-4 sm:grid-cols-3">
        <Column
          name={free.name}
          bytes={free.storageBytes}
          price={free.priceLabel}
          events={`${formatLimit(MAX_EVENTS.free)} event`}
          video={videosAllowedForTier("free")}
          index={0}
        />
        <Column
          name={pass.name}
          bytes={pass.storageBytes}
          price={pass.priceLabel}
          events="One event per pass, for a year"
          video={videosAllowedForTier("event_pass")}
          index={1}
        />
        <Column
          name="Pro"
          bytes={pro[0].storageBytes}
          price={`from ${pro[0].priceLabel}`}
          events={`${formatLimit(MAX_EVENTS.pro)} events`}
          video={videosAllowedForTier("pro")}
          sizes={proSizeLine}
          index={2}
        />
      </Reveal>

      {/* The cap, honestly: what a full album does, in the guest's own words. */}
      <Reveal className="mx-auto mt-12 grid max-w-4xl gap-x-10 gap-y-6 sm:grid-cols-3">
        {[
          {
            title: "At the cap, uploads pause",
            body: "A guest sees “This album is full right now. The host needs to free up space.” Nothing already in the album changes.",
          },
          {
            title: "Deleting frees space at once",
            body: "Remove a batch and the room is back immediately. Your own uploads count toward the total too.",
          },
          {
            title: "Free events collect photos",
            body: "Pick a video on a free event and the guest sees “This event accepts photos only.” Video comes with Pro and Event Pass.",
          },
        ].map((fact, i) => (
          <div
            key={fact.title}
            data-mkt-reveal
            className="flex flex-col gap-1.5"
            style={{ "--i": i } as CSSProperties}
          >
            <h3 className="font-heading text-base">{fact.title}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {fact.body}
            </p>
          </div>
        ))}
        <div
          data-mkt-reveal
          className="sm:col-span-3"
          style={{ "--i": 3 } as CSSProperties}
        >
          <LearnMoreLink href="/pricing">Every plan, side by side</LearnMoreLink>
        </div>
      </Reveal>
    </SectionShell>
  );
}
