"use client";

import type { ReactNode } from "react";
import { Copy, Download, Share2 } from "lucide-react";

import { FooterQr } from "@/components/marketing/chrome/footer-qr";
import { Button } from "@/components/ui/button";

import { EVENT } from "./fixtures";
import { Dashboard, GuestAlbum, HostHub } from "./grounds";
import { CodeCard, kitParts, OsShareSheet } from "./kit";
import { type PhoneScene, Scenes } from "./scene";
import { BottomSheet, type Parts, SidePanel, type Size } from "./surfaces";

/**
 * SHARE: what opens FIRST when someone asks to share. Priya's Invite
 * (`guest-share.tsx`, a sheet), Maya's Share on the dashboard's card
 * (`?room=share`, her whole kit in a sheet), and Maya's Share on the event
 * (his code card, `event-code-modal.tsx`, the one share surface he already
 * picked). The kit behind Everything is the board's `kit` carried call.
 */

export type ShareOption = "sheet" | "card" | "native";
export type ShareScreen = "invite" | "dashboard" | "hub";

export const shareAtOf = (v: string | undefined): ShareScreen =>
  v === "dashboard" || v === "hub" ? v : "invite";

const OPTION_TITLE: Record<ShareOption, string> = {
  sheet: "The one Sheet, as today",
  card: "His code card, for every share",
  native: "The phone's own share sheet",
};

const SCREEN_TITLE: Record<ShareScreen, string> = {
  invite: "Priya taps Invite",
  dashboard: "Maya taps Share on the dashboard",
  hub: "Maya taps Share on the event",
};

/** `guest-share.tsx`'s sheet: the code, then Share (where the browser has
 *  one: a phone, never a laptop), Copy link and Download. */
function inviteParts(size: Size): Parts {
  return {
    title: "Invite guests",
    description: `Share the link or let them scan the code to join ${EVENT.name} and add photos.`,
    body: (
      <div className="flex flex-col items-center gap-4 pb-6">
        <div className="rounded-xl bg-white p-3">
          <FooterQr value={`https://${EVENT.url}`} size={232} />
        </div>
        <div className="flex w-full flex-wrap justify-center gap-2">
          {size === "phone" && (
            <Button size="sm" tabIndex={-1} data-pop-primary="">
              <Share2 /> Share
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            tabIndex={-1}
            data-pop-primary={size === "desk" ? "" : undefined}
          >
            <Copy /> Copy link
          </Button>
          <Button variant="outline" size="sm" tabIndex={-1}>
            <Download /> Download
          </Button>
        </div>
      </div>
    ),
  };
}

function ground(screen: ShareScreen, size: Size, overlay: ReactNode) {
  if (screen === "invite")
    return <GuestAlbum size={size} view="top" overlay={overlay} />;
  if (screen === "dashboard")
    return <Dashboard size={size} overlay={overlay} />;
  return <HostHub size={size} share={{}} overlay={overlay} />;
}

function draw(option: ShareOption, screen: ShareScreen, size: Size): ReactNode {
  const who = screen === "invite" ? "guest" : "host";
  const phone = size === "phone";
  let surface: ReactNode;
  if (option === "native" && phone) surface = <OsShareSheet />;
  else if (option === "card" || option === "native" || screen === "hub")
    // His code card: every share under `card`, a desk under `native` (it has
    // no share sheet of its own), and the event's own Share today.
    surface = <CodeCard size={size} who={who} />;
  else {
    const parts = screen === "invite" ? inviteParts(size) : kitParts();
    surface = phone ? (
      <BottomSheet parts={parts} />
    ) : (
      <SidePanel parts={parts} />
    );
  }
  return ground(screen, size, surface);
}

const PHONES: readonly ShareScreen[] = ["invite", "dashboard", "hub"];

export function SharePreview({
  option,
  at,
}: {
  option: ShareOption;
  at: ShareScreen;
}) {
  const phones: PhoneScene[] = PHONES.map((screen) => ({
    title: SCREEN_TITLE[screen],
    node: draw(option, screen, "phone"),
  }));
  return (
    <Scenes
      id={`share-${option}-${at}`}
      title={OPTION_TITLE[option]}
      laptop={draw(option, at, "desk")}
      laptopTitle={SCREEN_TITLE[at]}
      phones={phones}
    />
  );
}
