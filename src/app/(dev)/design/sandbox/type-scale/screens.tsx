"use client";

import { useEffect } from "react";
import { CalendarPlus } from "lucide-react";

import { FeedSection } from "@/components/app/dashboard/feed-section";
import { EventCard } from "@/components/app/event-card";
import { PageHeading } from "@/components/shared/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { marketingImage } from "@/lib/constants/marketing-media";

/**
 * THE DASHBOARD, IN A REAL VIEWPORT (round six, 2026-09-16).
 *
 * ★ WHY A ROUTE AND NOT A STAGE. Five rounds drew the app inside a div, and a
 * div lies twice over: a Tailwind breakpoint prefix inside it reads the
 * BROWSER's width rather than the canvas's, so `sm:grid-cols-2` fires inside a
 * 375 canvas on a desktop, and every radix panel portals to the lab's own
 * body. Both are documented on `Stage` itself. This page is mounted in an
 * iframe laid out at exactly 1440x930 or 375x760, so `document` IS the canvas:
 * real breakpoints, real portals, real scroll, at true pixels.
 *
 * ★ AND THE LADDER ARRIVES AS CSS, NOT AS A PROP. Round five handed each
 * composition a `ladder` and set the sizes inline, which is a stand-in judged
 * as if it were the thing. Here the components are the production ones,
 * untouched, and the parent writes the SAME block a ruling would land into
 * this document. What moves, moves because the paste reaches it; what does not
 * move is a finding.
 *
 * ★ THE FINDING THIS SCREEN EXISTS TO SHOW. Three headings on this one page
 * are outside every register: the row heading is an 11px uppercase label
 * inside an h2 (FeedSection) and has no class worth aiming at; the event name
 * inside the production EventCard is a hand-rolled `font-heading text-xl` that
 * no hook reaches; and only the page title and the card title move at all. A
 * reviewer watching two of five headings move is reading the real reach of the
 * ruling rather than a caption about it.
 */

/* The dashboard's own stand-in data. The counts and the names are the board's;
   the components, the density and the breakpoints are production's. */
const EVENTS = [
  {
    name: "Mara and Tom",
    date: "Saturday 14 June",
    items: "214 items",
    status: "Open",
    still: "wedding-golden",
  },
  {
    name: "Ridgeway block party",
    date: "Sunday 8 June",
    items: "96 items",
    status: "Open",
    still: "party-balloons",
  },
  {
    name: "Anna turns thirty",
    date: "Friday 30 May",
    items: "41 items",
    status: "Closed",
    still: "party-dj",
  },
];

export function DashboardScreen() {
  // The lab shell's own chrome would otherwise paint over a screen served on a
  // design route; the ground is the app's light theme, set on the document so
  // `min-h-dvh` measures the frame.
  useEffect(() => {
    document.body.classList.add("surface-paper");
    return () => document.body.classList.remove("surface-paper");
  }, []);

  return (
    <>
      <style>
        {".lab-grid{display:block}.lab-nav,.lab-sidebar-pill{display:none}"}
      </style>
      <div className="surface-paper min-h-dvh bg-background text-foreground">
        <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <PageHeading>Dashboard</PageHeading>
              <p className="text-sm text-muted-foreground">
                3 of 10 events used
              </p>
            </div>
            <Button>
              <CalendarPlus /> New event
            </Button>
          </div>

          <FeedSection heading="Your events">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {EVENTS.map((event) => (
                <li key={event.name}>
                  <EventCard
                    href="#"
                    name={event.name}
                    coverUrl={marketingImage(event.still).src}
                    dateLabel={event.date}
                    itemsLabel={event.items}
                    statusLabel={event.status}
                  />
                </li>
              ))}
            </ul>
          </FeedSection>

          <FeedSection heading="Needs a look">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Four uploads waiting</CardTitle>
                  <CardDescription>
                    Guests added them after you closed the album.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Your storage is at 61 percent</CardTitle>
                  <CardDescription>
                    12.2 GB of 20 GB, across three events.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </FeedSection>
        </div>
      </div>
    </>
  );
}
