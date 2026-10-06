"use client";

import { ImageUp, Play, QrCode } from "lucide-react";

import {
  AlbumCover,
  HeadStills,
} from "@/components/guest/event-experience-head";
import { EntryShell } from "@/components/guest/entry-shell";
import { PasswordGate } from "@/components/guest/password-gate";
import { Button } from "@/components/ui/button";

import { DATE, EVENT, NAME, STILLS } from "../fixtures";

import { useInUse } from "./in-use";
import { busy, byText, pin } from "./pins";
import type { ScreenProps } from "./screen-props";
import { typeInto } from "./type-into";

/**
 * THE GUEST'S DOOR, WITH HER PASSWORD TYPED: Ines scans the code at the
 * wedding, the album is private, so the door asks for its password; she has
 * typed it, the field in focus and Unlock under her thumb, or (working)
 * Unlock checks it.
 *
 * ★ PRODUCTION'S DOOR: the album's cover behind (`AlbumCover`, the white Add
 * and the glass rounds standing on its photograph), the door's own sheet over
 * it (`EntryShell`, held, as a gate holds it) and the password step inside it
 * (`PasswordGate`), so every set is judged on the one form every guest at a
 * private album meets. ★ NOTHING IS SENT: the step only posts on a submit, and
 * nothing here submits (the scene refuses every form's submit too).
 */

/** The password typed, as she types it. */
const typed = () => {
  const field = document.querySelector<HTMLInputElement>(
    'input[aria-label="Event password"]',
  );
  if (field) typeInto(field, "maya-and-jay");
  return field;
};
const unlock = () => byText<HTMLButtonElement>("button", "Unlock");

function doorScript(
  moment: ScreenProps["moment"],
): readonly (readonly [number, () => void])[] {
  if (moment === "working")
    return [
      [900, typed],
      [1150, () => busy(unlock(), "Unlocking")],
    ];
  return [[900, () => pin(typed(), "focus")]];
}

export function GuestGateScreen({ moment }: ScreenProps) {
  useInUse(doorScript(moment));
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
