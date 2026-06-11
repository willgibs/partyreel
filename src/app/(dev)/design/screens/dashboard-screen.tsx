import Image from "next/image";
import { Plus, QrCode } from "lucide-react";

import { PHOTOS } from "./sample-photos";

/**
 * Screen 3: the host dashboard, desktop-leaning. A daily-driver surface, so the
 * chrome stays quiet in every direction (frequency test: no decorative motion
 * here). Status communication is typographic, not color-coded: the pending
 * count is the loudest thing on a card, and it is just ink.
 */
export function DashboardScreen() {
  return (
    <div aria-hidden className="py-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p data-dir-display className="text-2xl tracking-tight">
              Good evening, Will
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Two events live right now
            </p>
          </div>
          <button
            data-dir-press
            className="flex h-9 items-center gap-1.5 rounded-[var(--radius-action-sm)] bg-primary px-3.5 text-sm font-medium text-primary-foreground"
          >
            <Plus className="size-4" />
            New event
          </button>
        </div>

        {/* Stat strip: numbers lead, labels whisper. */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { value: "4", label: "Events" },
            { value: "312", label: "Photos & videos" },
            { value: "18.2 GB", label: "of 50 GB used", meter: 0.36 },
          ].map((stat) => (
            <div key={stat.label} data-dir-card className="p-4">
              <p data-dir-display className="text-xl">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {stat.label}
              </p>
              {stat.meter !== undefined && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/70"
                    style={{ width: `${stat.meter * 100}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Event cards: the cover photo carries ALL the color. */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              cover: PHOTOS[0],
              name: "Maya & Jay's Wedding",
              date: "June 14",
              status: "Live now",
              meta: "212 items · 96 QR scans",
              pending: 3,
            },
            {
              cover: PHOTOS[8],
              name: "Marlowe Launch Party",
              date: "May 30",
              status: "Open",
              meta: "100 items · 41 QR scans",
              pending: 0,
            },
          ].map((event) => (
            <div key={event.name} data-dir-card className="overflow-hidden p-0">
              <div className="relative aspect-[16/9]">
                <Image
                  src={event.cover}
                  alt=""
                  fill
                  sizes="360px"
                  className="object-cover"
                />
                {event.pending > 0 && (
                  <span className="absolute top-2.5 right-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                    {event.pending} to review
                  </span>
                )}
              </div>
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{event.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {event.date} · {event.meta}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {event.status}
                  </span>
                  <QrCode className="size-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
