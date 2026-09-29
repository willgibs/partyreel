"use client";

import { useState } from "react";

import { EventSettingsForm } from "@/components/app/event-settings-form";
import { DangerZoneSection } from "@/components/app/event-settings/danger-zone-section";
import { HighlightReelCard } from "@/components/app/event-settings/highlight-reel-card";
import { ProfileSocialCard } from "@/components/app/event-settings/profile-social-card";
import { Button } from "@/components/ui/button";
import {
  Popup,
  PopupBody,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
} from "@/components/ui/popup";
import type { Tier } from "@/lib/constants/tiers";
import type { HostEvent } from "@/lib/db/queries/events";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

/**
 * SETTINGS AS A PANEL BESIDE THE ALBUM (Will, `settings=sheet`: "This does feel
 * cleaner and accessible than a page of cards per event" — and the reason it is
 * not a page is that the album it GOVERNS stays beside it. A host changing who
 * can see this event watches the photographs it applies to while they change
 * it).
 *
 * ★ ITS KIND IS `settings` (`popups` r1, `settings=panel`, Will 2026-09-27): his
 * panel at a desk, unchanged; in a hand the whole screen under a back arrow
 * that names the event, the longest form in the app with nothing above it, and
 * no strip of album over seventeen controls. It rides `?room=settings`, so the
 * page already puts it in history (`routed`).
 *
 * ★ IT OPENS UNFOCUSED, at every width (his note: "Let's not open focused, so
 * more settings are visible and one tap away rather than always having to
 * escape typing in the event name input"): the kind's `deskFocus` is the panel
 * itself, so Radix no longer drops the caret into the event's name.
 *
 * ★ THE PAGE OF CARDS IS NOT REBUILT HERE. `EventSettingsForm` is imported
 * whole — it is the orchestrator over details / visibility / uploads / danger,
 * all reading one form through `useFormContext` — so the sheet and the old
 * route can never disagree about what a setting does. What changed is the
 * frame around it.
 *
 * ★ THE UNSAVED GUARD SURVIVED THE MOVE, AND GREW A THIRD DOOR. The route
 * guarded a hard nav and its back-LINK; the panel's ways out are the scrim,
 * Escape, the close button and, in a hand, its back arrow. All of them land on
 * `requestClose`, so a dirty form confirms before the panel goes (a centred
 * dialog over it, the carried call `stacked`), and `beforeunload` still covers
 * a reload.
 *
 * ★ THE BIN IS NOT HERE. His `settings` note folded it into the album ("The
 * photo bin joins the album as a filter"), so "Deleted" names exactly one thing
 * in the product now and it is a view of the album.
 *
 * ★ THE ORDER: the form's cards (Details, Visibility, Guest uploads) and its one
 * Save, then the instant cards, the Highlight reel first (`reel-host`, Will
 * 2026-09-25: its own section, placed after Guest uploads), then Profile (the
 * guest list is always on, so it has no switch here), and the Danger zone LAST,
 * so the one irreversible act on the sheet is never the thing between a host
 * and a setting.
 */
export function EventSettingsSheet({
  open,
  onOpenChange,
  event,
  tier,
  pendingCount,
  social,
  reelSample,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: HostEvent;
  tier: Tier;
  pendingCount: number;
  /** Null pre-apply (the graceful runtime seam), exactly as on the old route. */
  social: {
    displayInProfile: boolean;
    hostHasSlug: boolean;
  } | null;
  /** One of the event's own photographs to show the reel's looks on, or null before the first. */
  reelSample: string | null;
}) {
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  useUnsavedChangesGuard(dirty);

  function requestClose(next: boolean) {
    if (next) {
      onOpenChange(true);
      return;
    }
    if (dirty) {
      setConfirmOpen(true);
      return;
    }
    onOpenChange(false);
  }

  return (
    <>
      <Popup open={open} onOpenChange={requestClose}>
        <PopupContent kind="settings" routed>
          <PopupHeader
            title="Settings"
            description={event.name}
            back={event.name}
          />

          {/* ★ BLOCK FLOW, as the form lays its own cards, NEVER A FLEX COLUMN: the body is
              the scroller, a flex column shrinks its children to fit it, and a Card clips
              (`overflow-hidden`), which zeroes its automatic minimum height. So a column
              crushed every card past the form to its padding, Delete event (its only home)
              with them. Block flow never shrinks a card: the body scrolls. */}
          <PopupBody className="space-y-6 pb-6">
            <EventSettingsForm
              event={event}
              tier={tier}
              pendingCount={pendingCount}
              onDirtyChange={setDirty}
            />
            <HighlightReelCard
              eventId={event.id}
              showReel={event.show_reel}
              styleId={event.reel_style_id}
              holdSec={event.reel_hold_sec}
              sampleStill={reelSample}
            />
            {social && (
              <ProfileSocialCard
                eventId={event.id}
                displayInProfile={social.displayInProfile}
                hostHasSlug={social.hostHasSlug}
              />
            )}
            <DangerZoneSection eventId={event.id} eventName={event.name} />
          </PopupBody>
        </PopupContent>
      </Popup>

      <Popup open={confirmOpen} onOpenChange={setConfirmOpen}>
        <PopupContent kind="confirm">
          <PopupHeader
            title="Discard changes?"
            description="You have unsaved changes. Closing settings will discard them."
          />
          <PopupFooter>
            <PopupClose asChild>
              <Button variant="outline">Keep editing</Button>
            </PopupClose>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                setDirty(false);
                onOpenChange(false);
              }}
            >
              Discard changes
            </Button>
          </PopupFooter>
        </PopupContent>
      </Popup>
    </>
  );
}
