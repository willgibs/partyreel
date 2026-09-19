"use client";

import Link from "next/link";
import {
  CalendarPlus,
  Heart,
  ImageOff,
  ImageUp,
} from "lucide-react";

import { EmptySectionTeaser } from "@/components/app/dashboard/empty-section-teaser";
import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { TrashSection } from "@/components/app/dashboard/trash-section";
import { FeedSectionEmpty } from "@/components/app/event-feed/feed-section-empty";
import { EventUploads } from "@/components/app/event-uploads";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

import { HOST_EVENT } from "./fixtures";

/**
 * "NOTHING HERE YET": the five real call sites, and what each of the three
 * answers would do to them.
 *
 * ★ THE LIKES TAB HAS TWO TREATMENTS FOR THE SAME EMPTY STATE, not one — a
 * sixth fact the manifest's five did not name. `dashboard/page.tsx` shows the
 * real `EmptySectionTeaser` when the server already knows Likes is empty; but
 * `my-likes-gallery.tsx` owns its OWN fallback (a bare `EmptyState`) for the
 * case its request could not predict — unliking the last photo client-side.
 * Same interaction, two different pictures, chosen by timing rather than by
 * design. `statusquo` draws both so the seam is visible.
 *
 * Every block below is the REAL component at its real call site's copy; nothing
 * here is a mock. `tiers` reassigns two of the five to a component that ALREADY
 * ships elsewhere in the product (never a new one), and `primitive` reassigns
 * all five to `EmptyState`, including one slot (Likes) that is already exactly
 * that — the one place today's code already agrees with `primitive`.
 */

const CARD =
  "rounded-lg border border-border bg-background/60 p-3";

function Block({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={CARD}>
      <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      {children}
    </div>
  );
}

/** `EventsEmptyTeaser`'s own copy, replayed through `EmptyState` (option
 *  `primitive`) so the two are compared on identical words. */
function HeroAsPrimitive() {
  return (
    <EmptyState
      icon={CalendarPlus}
      title="Your events land here"
      description="Create an event and your guests add photos and videos in seconds. No app, no account, just a QR code."
      action={
        <Button asChild size="lg">
          <Link href="/dashboard/new">
            <CalendarPlus /> Create your first event
          </Link>
        </Button>
      }
    />
  );
}

export type EmptyOption = "primitive" | "tiers" | "statusquo";

export function EmptyShowcase({ option }: { option: EmptyOption }) {
  return (
    <div className="min-h-full space-y-4 bg-background p-5 text-foreground">
      <Block label="Zero events (dashboard, a brand-new host)">
        {option === "primitive" ? <HeroAsPrimitive /> : <EventsEmptyTeaser />}
      </Block>

      <Block label="The Gallery section, no uploads yet (event page)">
        {option === "primitive" ? (
          <EmptyState
            icon={ImageOff}
            title="No uploads yet"
            description="Add photos with the button above, or share the QR code with guests."
          />
        ) : (
          <EventUploads eventId={HOST_EVENT.id} items={[]} pendingCount={0} />
        )}
      </Block>

      <Block label="Your uploads (dashboard tab, none yet)">
        {option === "primitive" ? (
          <EmptyState
            icon={ImageUp}
            title="Your uploads"
            description="Photos and videos you add to any event, yours or a friend's, collect here."
          />
        ) : option === "tiers" ? (
          // Reassigned to the section tier: the same component the Gallery
          // and Reel empties already use, given this call site's own words.
          <FeedSectionEmpty
            icon={ImageUp}
            title="Your uploads"
            desc="Photos and videos you add to any event, yours or a friend's, collect here."
          />
        ) : (
          <EmptySectionTeaser
            heading="Your uploads"
            blurb="Photos and videos you add to any event, yours or a friend's, collect here."
          />
        )}
      </Block>

      <Block label="Your likes (dashboard tab)">
        {option === "statusquo" ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-[10px] text-muted-foreground">
                Known empty at the server
              </p>
              <EmptySectionTeaser
                heading="Your likes"
                blurb="Tap the heart on any photo or video and it lands here, across every event."
              />
            </div>
            <div>
              <p className="mb-1.5 text-[10px] text-muted-foreground">
                Emptied by unliking the last one, client-side
              </p>
              <EmptyState
                icon={Heart}
                title="No likes yet"
                description="Tap the heart on any photo or video to save it here."
              />
            </div>
          </div>
        ) : option === "tiers" ? (
          <FeedSectionEmpty
            icon={Heart}
            title="No likes yet"
            desc="Tap the heart on any photo or video to save it here."
          />
        ) : (
          // primitive: this is the one slot today's code ALREADY renders this
          // way (my-likes-gallery.tsx's own client fallback).
          <EmptyState
            icon={Heart}
            title="No likes yet"
            description="Tap the heart on any photo or video to save it here."
          />
        )}
      </Block>

      <Block label="The Trash filter, nothing deleted (utility, no onboarding)">
        {option === "primitive" ? (
          <EmptyState
            title="Nothing in your trash"
            description="Deleted events stay recoverable for 30 days, then they clear automatically."
            variant="quiet"
          />
        ) : (
          <TrashSection deletedEvents={[]} coverUrls={new Map()} />
        )}
      </Block>
    </div>
  );
}
