"use client";

import { useEffect, useRef } from "react";

import { AddsPage } from "@/components/app/event-settings/adds-page";
import { DoorPage } from "@/components/app/event-settings/door-page";
import { EventPage } from "@/components/app/event-settings/event-page";
import { ReelPage } from "@/components/app/event-settings/reel-page";
import type { SettingsPage } from "@/components/app/event-settings/settings-pages";
import { SettingsRows } from "@/components/app/event-settings/settings-rows";
import { SettingsProvider } from "@/components/app/event-settings/settings-state";
import {
  Popup,
  PopupBody,
  PopupContent,
  PopupHeader,
} from "@/components/ui/popup";
import type { Tier } from "@/lib/constants/tiers";
import type { DoorCounts } from "@/lib/db/queries/event-doors";
import type { HostEvent } from "@/lib/db/queries/events";
import { SETTINGS_GROUP_TITLES } from "@/lib/events/guest-experience-summary";

/** Each page's head: the group's own title, the one its row stands under. */
const PAGE_TITLE: Record<SettingsPage, string> = {
  door: SETTINGS_GROUP_TITLES.door,
  adds: SETTINGS_GROUP_TITLES.adds,
  reel: SETTINGS_GROUP_TITLES.reel,
  event: SETTINGS_GROUP_TITLES.event,
};

/**
 * SETTINGS AS A PANEL BESIDE THE ALBUM (Will, `settings=sheet`: "This does feel cleaner and accessible
 * than a page of cards per event", and the album it GOVERNS stays beside it), rebuilt from the ground
 * up (event-settings r1, 2026-09-29): four rows, each a sentence of where its group stands with its key
 * words live, each opening its own page under a back arrow (`opens=page`).
 *
 * ★ ITS KIND IS `settings` (`popups` r1, `settings=panel`): his panel at a desk; in a hand the whole
 * screen under a back arrow that names the event. It rides `?room=settings`, and a page rides beside it
 * (`&setting=door`, `settings-pages.ts`), so a link opens straight onto a page and a reload lands where
 * the host was. One level in, the head is the page's own and its back arrow goes UP to the four rows
 * (the popup's `up`), at a desk a small back row over the title, in a hand the bar's own arrow.
 *
 * ★ IT OPENS UNFOCUSED, at every width (his note: "Let's not open focused, so more settings are visible
 * and one tap away"): the kind's `deskFocus` is the panel itself.
 *
 * ★ NOTHING WAITS ON A SAVE, SO NOTHING GUARDS THE CLOSE. Every control saves itself (a typed field when
 * it is left), so the retired form's Save, its dirty state and its "Discard changes?" are gone with it:
 * Back, the X, Escape and the scrim simply close, from any page, a deep link included
 * (`event-share-provider.tsx`).
 */
export function EventSettingsSheet({
  open,
  onOpenChange,
  page,
  onOpenPage,
  onClosePage,
  event,
  tier,
  counts,
  pendingCount,
  social,
  reelSample,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The page open inside Settings, or null for the four rows. */
  page: SettingsPage | null;
  onOpenPage: (page: SettingsPage) => void;
  onClosePage: () => void;
  event: HostEvent;
  tier: Tier;
  /** The door's own numbers (who is in, who waits, the list), read for the host. */
  counts: DoorCounts;
  pendingCount: number;
  /** Null when the event is not the host's own to read (`getEventSocialSettings`): the card hides. */
  social: {
    displayInProfile: boolean;
    hostHasSlug: boolean;
  } | null;
  /** One of the event's own photographs to show the reel's looks on, or null before the first. */
  reelSample: string | null;
}) {
  const guestsHref = `/dashboard/${event.id}/guests`;

  // ★ FOCUS FOLLOWS THE LEVEL: into a page, onto its way back up; back up, onto the row that opened it.
  // The control that was pressed is gone with the level it stood on, and focus must never fall to the
  // page behind the panel.
  const cameFrom = useRef<SettingsPage | null>(null);
  useEffect(() => {
    if (!open) return;
    if (page) {
      cameFrom.current = page;
      document
        .querySelector<HTMLElement>("[data-popup-up]")
        ?.focus({ preventScroll: true });
      return;
    }
    const from = cameFrom.current;
    cameFrom.current = null;
    if (from) {
      document
        .querySelector<HTMLElement>(`[data-settings-open="${from}"]`)
        ?.focus({ preventScroll: true });
    }
  }, [open, page]);

  // ★ THE STATE OUTLIVES THE PANEL: the provider stands outside the popup, whose content unmounts as it
  // closes, so a change saved a moment ago is still what the rows say when Settings opens again, before
  // the row it wrote has come back.
  return (
    <SettingsProvider
      event={event}
      tier={tier}
      counts={counts}
      pendingCount={pendingCount}
      social={social}
      reelSample={reelSample}
    >
      <Popup open={open} onOpenChange={onOpenChange}>
        <PopupContent kind="settings" routed>
          {page ? (
            <PopupHeader
              title={PAGE_TITLE[page]}
              up={{ label: "Settings", onUp: onClosePage }}
            />
          ) : (
            <PopupHeader
              title="Settings"
              description={event.name}
              back={event.name}
            />
          )}
          {/* ★ BLOCK FLOW, NEVER A FLEX COLUMN THAT SHRINKS ITS CHILDREN: the body is the scroller, and a
              card clips, so a column once crushed every card past the first to its padding (build 17).
              The popup's body keeps its children whole whatever a caller lays out. */}
          <PopupBody
            className="space-y-6 pb-6"
            data-settings-page={page ?? "rows"}
          >
            {page === "door" ? (
              <DoorPage guestsHref={guestsHref} />
            ) : page === "adds" ? (
              <AddsPage />
            ) : page === "reel" ? (
              <ReelPage />
            ) : page === "event" ? (
              <EventPage />
            ) : (
              <SettingsRows onOpenPage={onOpenPage} />
            )}
          </PopupBody>
        </PopupContent>
      </Popup>
    </SettingsProvider>
  );
}
