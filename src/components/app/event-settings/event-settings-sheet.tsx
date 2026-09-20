"use client";

import { useState } from "react";

import { EventSettingsForm } from "@/components/app/event-settings-form";
import { ProfileSocialCard } from "@/components/app/event-settings/profile-social-card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Tier } from "@/lib/constants/tiers";
import type { HostEvent } from "@/lib/db/queries/events";
import { useUnsavedChangesGuard } from "@/lib/use-unsaved-changes-guard";

/**
 * SETTINGS AS A SHEET OVER THE ALBUM (Will, `settings=sheet`: "This does feel
 * cleaner and accessible than a page of cards per event" — and the reason it is
 * a sheet rather than a page is that the album it GOVERNS stays behind it. A
 * host changing who can see this event watches the photographs it applies to
 * while they change it).
 *
 * ★ THE PAGE OF CARDS IS NOT REBUILT HERE. `EventSettingsForm` is imported
 * whole — it is the orchestrator over details / visibility / uploads / danger,
 * all reading one form through `useFormContext` — so the sheet and the old
 * route can never disagree about what a setting does. What changed is the
 * frame around it.
 *
 * ★ THE UNSAVED GUARD SURVIVED THE MOVE, AND GREW A THIRD DOOR. The route
 * guarded a hard nav and its back-LINK; a sheet has no back-link, and the ways
 * out are the scrim, Escape and the close button. All three land on
 * `requestClose`, so a dirty form confirms before the panel goes, and
 * `beforeunload` still covers a reload.
 *
 * ★ THE BIN IS NOT HERE. His `settings` note folded it into the album ("The
 * photo bin joins the album as a filter"), so "Deleted" names exactly one thing
 * in the product now and it is a view of the album.
 */
export function EventSettingsSheet({
  open,
  onOpenChange,
  event,
  tier,
  pendingCount,
  social,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: HostEvent;
  tier: Tier;
  pendingCount: number;
  /** Null pre-apply (the graceful runtime seam), exactly as on the old route. */
  social: {
    displayInProfile: boolean;
    showGuestList: boolean;
    hostHasSlug: boolean;
  } | null;
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
      <Sheet open={open} onOpenChange={requestClose}>
        <SheetContent
          responsive
          className="overflow-y-auto"
          aria-describedby={undefined}
        >
          <SheetHeader>
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>{event.name}</SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-6 px-4 pb-6">
            <EventSettingsForm
              event={event}
              tier={tier}
              pendingCount={pendingCount}
              onDirtyChange={setDirty}
            />
            {social && (
              <ProfileSocialCard
                eventId={event.id}
                displayInProfile={social.displayInProfile}
                showGuestList={social.showGuestList}
                hostHasSlug={social.hostHasSlug}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discard changes?</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Closing settings will discard them.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Keep editing</Button>
            </DialogClose>
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
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
