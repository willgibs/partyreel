"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";

import { settingsPageHref } from "@/components/app/event-settings/settings-pages";
import { CodeCard, readableLink } from "@/components/app/share/code-card";
import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";
import type { ItemTarget } from "@/lib/dashboard/attention";
import type { ShareFacts } from "@/lib/dashboard/home-view";

/** Where a target leads on an event's hub, as a link (Invite opens the code card instead). */
export function targetHref(
  eventId: string,
  to: Exclude<ItemTarget, "invite">,
): string {
  switch (to) {
    case "guests":
      return `/dashboard/${eventId}/guests#at-the-door`;
    case "review":
      return `/dashboard/${eventId}/review`;
    case "door":
    case "adds":
      return settingsPageHref(eventId, to);
    case "print":
      return `/dashboard/${eventId}/print`;
    case "hub":
      return `/dashboard/${eventId}`;
  }
}

/**
 * ONE ACT'S DOOR, from the stage or the week: a real link into the event (a modified click opens a tab,
 * as every door in the host app does), the code on paper in a tab of its own (the dashboard survives the
 * print dialog), or Invite, which opens the code card right here (`popups` r1, `share=card`, Will
 * 2026-09-27: every share's first surface is his code card, opened by an Invite), its Everything one
 * press behind, on the event's own kit.
 */
export function ActDoor({
  eventId,
  eventName,
  share,
  label,
  to,
  location,
  ...button
}: {
  eventId: string;
  eventName: string;
  share: ShareFacts;
  label: string;
  to: ItemTarget;
  /** Where the door is, for the analytics a click carries. */
  location: string;
} & Pick<ComponentProps<typeof Button>, "variant" | "size" | "className">) {
  const router = useRouter();
  const track = trackAttrs("cta_click", { cta: `act-${to}`, location });
  if (to === "invite") {
    return (
      <CodeCard
        who="host"
        eventName={eventName}
        joinUrl={share.joinUrl}
        prettyUrl={readableLink(share.joinUrl)}
        qrStyle={share.qrStyle}
        location={location}
        onEverything={() => router.push(`/dashboard/${eventId}?room=share`)}
        trigger={
          <Button type="button" {...button} {...track}>
            {label}
          </Button>
        }
      />
    );
  }
  return (
    <Button asChild {...button}>
      <Link
        href={targetHref(eventId, to)}
        {...(to === "print"
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
        {...track}
      >
        {label}
      </Link>
    </Button>
  );
}
