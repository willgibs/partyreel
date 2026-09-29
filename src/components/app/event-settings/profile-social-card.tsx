"use client";

import { useOptimistic, useTransition } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";
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
 * The profiles-social.md event key, as its own settings card OUTSIDE the RHF form:
 * the toggle persists INSTANTLY on flip (a deliberate one-key act, like the
 * password/slug commits: a "Save changes" buffer would blur what the host just
 * consented to). Optimistic, and reverted with a toast on failure.
 *
 * ★ THE GUEST LIST HAS NO SWITCH (Will, event-safety `room=always`, 2026-09-28:
 * "I honestly can't think of many (if any) cases where a host would want everyone
 * uploading into a shared album together, but keeping the guest uploaders
 * secret. I think we should just make the guest list always on ... we only want
 * to add configs where the potential friction offers real benefit/value. This
 * doesn't seem to."). Every guest who added photos is named on the album, so the
 * card that held that switch keeps only the host's own profile.
 */
export function ProfileSocialCard({
  eventId,
  displayInProfile,
  hostHasSlug,
}: {
  eventId: string;
  displayInProfile: boolean;
  /** The host claimed /u/<slug> — without one the profile toggle still stores,
   *  but we say where the profile lives (guides to /account). */
  hostHasSlug: boolean;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    displayInProfile,
    (_state, next: boolean) => next,
  );

  function persist(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      const result = await updateEventSocialSettingsAction(eventId, {
        displayInProfile: next,
      });
      if (!result.ok) {
        setOptimistic(!next);
        toast.error("Couldn't save that setting.", {
          description: result.message,
        });
        return;
      }
      toast.success("Setting saved.");
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <span className="flex items-center gap-2">
            <UserRound className="size-4 text-muted-foreground" aria-hidden />
            Profile
          </span>
        </CardTitle>
        <CardDescription>
          How this event shows up beyond its own link.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              page.{" "}
              {/* A door rather than directions: the sentence used to name a
                  card on another page and leave the host to go find it, and
                  the handle is free now, so there is nothing in the way. */}
              {!hostHasSlug && (
                <Link
                  href="/account#public-profile"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Claim your handle to publish the page
                </Link>
              )}
            </span>
          </Label>
          <Switch
            id="display-in-profile"
            checked={optimistic}
            onCheckedChange={(checked) => persist(checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
