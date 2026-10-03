"use client";

import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

import { CodeCard, readableLink } from "@/components/app/share/code-card";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import { roomHref } from "@/lib/event/sections";

/**
 * INVITE, IN GUESTS, ON EVERY DOOR (event-settings r1, `editor=both` with Will's note: "the guests page
 * could use invite as a feature (maybe main action from empty state, or as an action somewhere once
 * guests start joining) which is not exclusive to invite-only event gates, simply helping the host
 * invite guests as part of sharing"). It opens the event's code card (`popups` r1, `share=card`:
 * Invite, then Share), whose Share hands a ready message and the link to the phone's own share sheet
 * where there is one, with the code on the card and the whole kit one tap behind.
 *
 * ★ IT SENDS NOTHING. Mail on the host's behalf is the email exploration's, banked. So: the room's main
 * action while it is empty, and a quiet one after.
 */
export function GuestsInvite({
  eventId,
  eventName,
  joinUrl,
  qrStyle,
  prominent,
  onEverything,
}: {
  eventId: string;
  eventName: string;
  /** The permanent link: what the code encodes and what gets copied and shared. */
  joinUrl: string;
  qrStyle: string;
  /** The room is empty: Invite is its main action. */
  prominent: boolean;
  /**
   * The card's Everything. Over the hub (`rooms=over`) it hands the room to the share kit in place; anywhere else it
   * goes to the hub with the kit open.
   */
  onEverything?: () => void;
}) {
  const router = useRouter();
  return (
    <CodeCard
      who="host"
      eventName={eventName}
      joinUrl={joinUrl}
      prettyUrl={readableLink(joinUrl)}
      qrStyle={qrStyle}
      location="guests-room"
      onEverything={
        onEverything ?? (() => router.push(roomHref(eventId, "share")))
      }
      trigger={
        <Button
          type="button"
          size={prominent ? "default" : "sm"}
          variant={prominent ? "default" : "outline"}
          data-guests-invite={prominent ? "main" : "quiet"}
          {...trackAttrs("cta_click", {
            cta: "event-code",
            location: "guests-room",
          })}
        >
          <UserPlus /> Invite
        </Button>
      }
    />
  );
}
