"use client";

import { useOptimistic, useTransition } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";

import { updateEventSocialSettingsAction } from "@/app/(app)/dashboard/actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * The ADR-0019 event keys, as their own settings card OUTSIDE the RHF form:
 * each toggle persists INSTANTLY on flip (these are deliberate one-key acts,
 * like the password/slug commits — a "Save changes" buffer would blur what the
 * host just consented to). Optimistic + reverted with a toast on failure.
 *
 * The guest-list copy is deliberately LOUD (the ruling): flipping it on names
 * EVERY signed-in uploader on the album, with no per-guest opt-in. The switch
 * label carries that sentence permanently — not a one-time confirm the host
 * forgets — so the consequence stays visible every time they visit.
 */
export function ProfileSocialCard({
  eventId,
  displayInProfile,
  showGuestList,
  hostHasSlug,
}: {
  eventId: string;
  displayInProfile: boolean;
  showGuestList: boolean;
  /** The host claimed /u/<slug> — without one the profile toggle still stores,
   *  but we say where the profile lives (guides to /account). */
  hostHasSlug: boolean;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    { displayInProfile, showGuestList },
    (
      state,
      patch: Partial<{ displayInProfile: boolean; showGuestList: boolean }>,
    ) => ({
      ...state,
      ...patch,
    }),
  );

  function persist(patch: {
    displayInProfile?: boolean;
    showGuestList?: boolean;
  }) {
    startTransition(async () => {
      setOptimistic(patch);
      const result = await updateEventSocialSettingsAction(eventId, patch);
      if (!result.ok) {
        // Revert by writing the inverse of what we tried.
        const revert: typeof patch = {};
        if (patch.displayInProfile !== undefined)
          revert.displayInProfile = !patch.displayInProfile;
        if (patch.showGuestList !== undefined)
          revert.showGuestList = !patch.showGuestList;
        setOptimistic(revert);
        toast.error("Couldn't save that setting.", {
          description: result.message,
        });
        return;
      }
      if (patch.showGuestList === true) {
        toast.success("Guest list is on.", {
          description:
            "Everyone signed in who uploaded is now named on the album.",
        });
      } else {
        toast.success("Setting saved.");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <Users className="size-4 text-muted-foreground" aria-hidden />
            Profile & guests
          </span>
        </CardTitle>
        <CardDescription>
          How this event shows up beyond its own link.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <Label
            htmlFor="display-in-profile"
            className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
          >
            <span className="text-sm font-medium text-foreground">
              Show on my profile
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              Lists this event, with its album link, on your public profile
              page.
              {!hostHasSlug &&
                " Claim your profile handle in Account settings to publish the page."}
            </span>
          </Label>
          <Switch
            id="display-in-profile"
            checked={optimistic.displayInProfile}
            onCheckedChange={(checked) =>
              persist({ displayInProfile: checked })
            }
          />
        </div>

        <div className="flex items-start justify-between gap-4 border-t border-border/60 pt-5">
          <Label
            htmlFor="show-guest-list"
            className="min-w-0 flex-1 cursor-pointer flex-col items-start gap-1 font-normal"
          >
            <span className="text-sm font-medium text-foreground">
              Show the guest list on the album
            </span>
            <span className="text-xs leading-relaxed text-muted-foreground">
              When this is on, EVERY guest who uploaded while signed in is
              listed by name on the album, for anyone who can open it. Guests
              who uploaded anonymously are never listed.
            </span>
          </Label>
          <Switch
            id="show-guest-list"
            checked={optimistic.showGuestList}
            onCheckedChange={(checked) => persist({ showGuestList: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
