"use client";

import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { longDate } from "@/lib/dashboard/when";
import { formatCount } from "@/lib/format/count";
import { cn } from "@/lib/utils";

import { type Host, TODAY } from "./fixtures";

/**
 * AN EVENT'S PAGE, STOOD IN: what Try it opens when an event is pressed, so a
 * reviewer can bounce between old events the way Jo does, into one and back
 * out to the dashboard. Its name, its day and its photographs, and a way back;
 * nothing of the hub's own head (`event-header`'s) or of saving its photographs
 * (`take-home`'s) is drawn or asked here.
 */
export function StandIn({
  host,
  id,
  wide,
  onBack,
}: {
  host: Host;
  id: string;
  wide: boolean;
  onBack: () => void;
}) {
  const hosted = host.hosted.find((e) => e.id === id);
  const guest = host.guests.find((g) => g.eventId === id);
  const name = hosted?.name ?? guest?.name ?? "";
  const when = hosted
    ? hosted.date
      ? longDate(hosted.date, TODAY)
      : "No date"
    : (guest?.dateLabel ?? "");
  const photos = host.albums[id]?.length
    ? host.albums[id]!
    : guest?.coverUrl
      ? [guest.coverUrl]
      : [];
  const count = hosted?.approved ?? 0;
  return (
    <section data-hd-stand-in={id} aria-label={name} className="space-y-5">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="-ml-2"
        data-hd-back=""
      >
        <ArrowLeft /> Your events
      </Button>
      <div className="space-y-1">
        <h1 className="font-heading text-page">{name}</h1>
        <p className="text-sm text-muted-foreground">
          {hosted
            ? `${when} · ${count > 0 ? `${formatCount(count)} in the album` : "Nothing in the album yet"}`
            : `${when} · ${guest?.byline ?? ""}`}
        </p>
      </div>
      {photos.length > 0 && (
        <ul className={cn("grid gap-1", wide ? "grid-cols-6" : "grid-cols-3")}>
          {photos.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="relative aspect-square overflow-hidden rounded-[var(--radius-tile)] bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a fixture still at a crop */}
              <img
                src={url}
                alt=""
                className="absolute inset-0 size-full object-cover"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
