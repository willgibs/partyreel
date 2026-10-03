"use client";

import { ImageUp, Play, QrCode } from "lucide-react";

import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { EntryShell } from "@/components/guest/entry-shell";
import { PasswordGate } from "@/components/guest/password-gate";
import { Button } from "@/components/ui/button";

import { DATE, EVENT, NAME } from "../fixtures";

import { STILLS } from "./add";
import { useInUse } from "./in-use";
import { typeInto } from "./type-into";

/**
 * THE GUEST'S DOOR, IN USE: Ines scans the code at the wedding, and the
 * album is private, so the door asks for its password; she has typed it and
 * the Unlock waits under her thumb.
 *
 * ★ PRODUCTION'S DOOR: the album's cover behind (`AlbumCover`), the door's own
 * sheet over it (`EntryShell`, held, as a gate holds it) and the password
 * step inside it (`PasswordGate`), so every system is judged on the one form
 * every guest at a private album meets. ★ NOTHING IS SENT: the step only
 * posts on a submit, and nothing here submits (the scene refuses every form's
 * submit too).
 */
export function GuestGateScreen() {
  useInUse([
    [
      900,
      () => {
        const field = document.querySelector<HTMLInputElement>(
          'input[aria-label="Event password"]',
        );
        if (!field) return;
        typeInto(field, "maya-and-jay");
        field.setAttribute("data-demo", "focus");
      },
    ],
  ]);
  return (
    <div className="min-h-screen bg-background">
      <AlbumCover
        ground={<HeadStills stills={STILLS} />}
        name={NAME}
        host={{ name: "Maya", avatarUrl: null, seed: "identity-host" }}
        date={DATE}
        description="Everything from tonight, in one place. Add what you take, whenever you get to it."
        mediaCount={214}
        guestCount={38}
        actions={
          <>
            <Button variant="on-photo" size="cta" className="min-w-0 flex-1">
              <ImageUp /> Add photos
            </Button>
            <Button
              variant="glass"
              size="icon-cta"
              aria-label="Watch the highlight reel"
            >
              <Play className="fill-current" />
            </Button>
            <Button variant="glass" size="icon-cta" aria-label="Invite">
              <QrCode />
            </Button>
          </>
        }
      />
      <EntryShell
        open
        dismissMode="held"
        onDismiss={() => {}}
        title={`${NAME} is private`}
        description="The album's password"
      >
        <PasswordGate token={EVENT.qr_token} eventName={NAME} />
      </EntryShell>
    </div>
  );
}
