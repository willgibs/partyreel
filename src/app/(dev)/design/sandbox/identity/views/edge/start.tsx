"use client";

import { EventsEmptyTeaser } from "@/components/app/dashboard/events-empty-teaser";
import { HomeHead } from "@/components/app/dashboard/home-head";
import { StorageMeter } from "@/components/app/dashboard/storage-meter";
import { longDate } from "@/lib/dashboard/when";

import { HostFrame } from "../settings";

/**
 * A NEW HOST'S DASHBOARD: the case for the carried call `hand-cards` (A4,
 * "the dashboard's two teaser cards"), the one place a teaser stands, so the
 * call is judged where it is met rather than described.
 *
 * A host on her first day, before her first event: production's head over the
 * photographic promise (`EventsEmptyTeaser`, its faint ghost cards and "Your
 * first album starts here"), which identity-wiring kept as the dashboard's own
 * rather than the one empty atom (`ui/empty.tsx`). Its slim sibling
 * (`EmptySectionTeaser`) lives on her own page's private sections now, not the
 * dashboard, so it is not drawn here.
 *
 * ★ THE LIGHT EDGE DOES NOT REACH IT IN ANY OPTION: the teaser is faint
 * photographs and a key, no card that ends in the house ring, so the three
 * options draw it alike; it is on this ask to be seen, beside the hand-made
 * cards Settings and the hub keep.
 */
export function StartScreen() {
  return (
    <HostFrame>
      <div data-app-wide="" data-home="" className="space-y-7 lg:space-y-9">
        <HomeHead
          day={longDate("2026-10-04")}
          line="No events yet · Free"
          storage={
            <StorageMeter
              activeBytes={0}
              deletedBytes={0}
              storageCap={2 * 1024 ** 3}
              makeRoom={false}
              passExpiry={null}
              planName="Free"
              hasBilling={false}
              isEventPass={false}
              tier="free"
            />
          }
        />
        <EventsEmptyTeaser />
      </div>
    </HostFrame>
  );
}
