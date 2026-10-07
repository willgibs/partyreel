"use client";

import { EventCardsRow } from "@/components/app/event-feed/event-cards-row";
import { HubCover } from "@/components/app/event-feed/event-hub-head";
import {
  guestsCardFace,
  reviewCardFace,
  settingsCardFace,
} from "@/components/app/event-feed/room-card";
import { HostAddProvider } from "@/components/app/host-add-provider";
import { NotificationBell } from "@/components/app/notification-bell";
import { EventShareProvider } from "@/components/app/share/event-share-provider";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { SetCrumbs } from "@/components/shared/crumbs";
import type { QrStyleKey } from "@/lib/constants/qr-presets";
import { REEL_MINIMUM, reelState } from "@/lib/event/reel-progress";
import { type ReadyFacts, stepsLeft } from "@/lib/events/readiness";

import { Arrival, type ArrivalWay, HubAlbum, readyAtCreate } from "./arrival";
import {
  EVENT,
  EVENT_ID,
  HER_PHOTOS,
  NEW_FACTS,
  NOW_MINUTE,
  REAL_LINK,
  TOKEN,
  WITH_PHOTOS,
} from "./fixtures";

/**
 * HER EVENT, THE MOMENT SHE LANDS FROM CREATE: production's hub composed as `dashboard/[eventId]/page.tsx` composes it,
 * on the stand-in event Create just made (nothing in it, nobody in, never opened), or with her first photos in
 * (`close=photos`): the app's bar (production's shell, its bell and her menu), the cover with her code on its mat, the
 * five room cards on its foot, the checklist in the way asked (`arrival.tsx`), and the album.
 *
 * ★ NO STORE BEHIND IT, AS THE LIBRARY'S SPECIMENS STAND (`HubCoverDemo`, `ChecklistDemo`): every piece reads the facts
 * it is handed where the hub would read its album's store, and every door opens nothing (the frame holds each link).
 *
 * ★ THE SETTINGS CARD COUNTS WHAT THE ANSWER COUNTS: as built, the code is a step left ("1 left"); under `share` and
 * `done` the code is never Settings' to finish (the one line says it, or it is worth doing), so the card says the door.
 */
export function Hub({
  name,
  look,
  arrival,
  photos,
  shared = false,
}: {
  name: string;
  look: QrStyleKey;
  arrival: ArrivalWay;
  /** Her first photos are in (`close=photos`). */
  photos: boolean;
  /** She pressed Print, Share or Copy link in Create. */
  shared?: boolean;
}) {
  const stills = photos ? HER_PHOTOS : [];
  const facts: ReadyFacts = photos ? WITH_PHOTOS : NEW_FACTS;
  const left =
    arrival === "list"
      ? stepsLeft(facts)
      : arrival === "done"
        ? readyAtCreate(facts).needed.of - readyAtCreate(facts).needed.done
        : 0;
  const cards = [
    { id: "review" as const, ...reviewCardFace(false, 0) },
    {
      id: "guests" as const,
      ...guestsCardFace({ waiting: 0, guests: 0, shots: 0 }),
    },
    {
      id: "settings" as const,
      ...settingsCardFace({ left, accepting: true, door: "open" }),
    },
  ];
  const playable = stills.length;
  const reel = {
    state: reelState({ showReel: true, liveReelEnabled: true, playable }),
    have: Math.min(playable, REEL_MINIMUM),
    of: REEL_MINIMUM,
    viewHref: `/e/${TOKEN}?reel`,
    moderated: false,
    pending: 0,
  };
  return (
    <EventShareProvider initialSheet={null}>
      <HostAddProvider>
        <AppShell
          headerActions={
            <>
              <NotificationBell items={[]} badgeCount={0} />
              <UserMenu
                email="maya@example.com"
                displayName={EVENT.host}
                avatarUrl={null}
                seed="create-wizard-maya"
                planName="Free"
              />
            </>
          }
        >
          <div data-app-wide="" data-cw-hub={arrival} className="space-y-6">
            <SetCrumbs
              trail={[
                { label: "Partyreel", href: "/dashboard" },
                { label: name },
              ]}
            />
            <HubCover
              name={name}
              date={null}
              counts={{ album: stills.length, guests: 0, views: 0 }}
              prettyUrl={REAL_LINK}
              eventLink={REAL_LINK}
              code={{
                qrStyle: look,
                door: "open",
                acceptingUploads: true,
                waiting: 0,
              }}
              stills={stills}
              arrivals={stills.map(() => NOW_MINUTE)}
            />
            <EventCardsRow
              eventId={EVENT_ID}
              cards={cards}
              reel={reel}
              head={{ name, stills }}
            />
            <Arrival way={arrival} facts={facts} shared={shared} />
            <HubAlbum photos={stills} />
          </div>
        </AppShell>
      </HostAddProvider>
    </EventShareProvider>
  );
}
