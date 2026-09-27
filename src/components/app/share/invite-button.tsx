"use client";

import { QrCode } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trackAttrs } from "@/lib/analytics/events";

import { useEventShare } from "./event-share-provider";

/**
 * AN "INVITE" ON THE EVENT PAGE, for a door the page renders on the server (the
 * launch list): it opens the page's own code card, the one the header's code
 * opens (`popups` r1, `share=card`: every share opens the card first, and the
 * door reads Invite). A client island this small is the whole cost of the
 * launch list staying a server component.
 */
export function InviteButton({ location }: { location: string }) {
  const { openCode } = useEventShare();
  return (
    <Button
      size="sm"
      onClick={openCode}
      {...trackAttrs("cta_click", { cta: "event-code", location })}
    >
      <QrCode /> Invite
    </Button>
  );
}
