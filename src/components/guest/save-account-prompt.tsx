"use client";

import { useState } from "react";
import { MailCheck } from "lucide-react";

import { AccountDoor, DOOR_WEAR } from "@/components/auth/account-door";
import { DoorHeading } from "@/components/guest/door/heading";
import { DoorCheck } from "@/components/guest/door/lit";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { formatCount } from "@/lib/format/count";
import {
  developTimeWords,
  TRACKER_SEALED_WORDS,
  TRACKER_WORDS,
} from "@/lib/guest/upload-tracker";

/**
 * THE KEEP: THE DOOR'S LAST SCREEN (`guest-capture` r1, Will's `moment=first` and
 * `shape=sheet-step`: "I like bubbling it up front and center, so its clearly visible to either
 * input email or dismissed... At this point, we've already gotten the guest's value to the host
 * (uploads), so we're simply trying to capture the guest as a Partyreel user now.").
 *
 * The instant her first file lands, the door does not close onto the album: its last screen is the
 * ask to keep what she added, in the same held sheet that offered the optional email a minute
 * earlier. It says her photo went ("Sent", and where it went), then the offer, then Confirm your
 * email (the account door, in this sheet) or Maybe later (the door closes onto the album, and the
 * ask is put down for this event on this device: `lib/guest/keep-ask.ts`). The machine that raises
 * it is `computeDoor`'s `keep` rule; the modal owns the sequence a confirmation runs.
 *
 * ★ IT OFFERS THE EVENT, WITH HERS COUNTED INSIDE IT (`voice-guest` r2, Will's `keep=warm`: "'Keep
 * this event' is best because they likely already have their own photos saved, the incentivize is
 * everything else in the event"). That is the whole difference between an offer and a growth card:
 * "Keep this event" is about the thing in front of her, "create a free account" is about us.
 *
 * ★ CONFIRMING CLAIMS, AND THE CLAIM IS THE WHOLE KEEP: the photographs become the account's and
 * the event comes with them (a Guest card on the dashboard). "In your account", never "on your
 * profile": a profile publishes nothing until its owner chooses it.
 *
 * ★ AND THE NEWSLETTER SWITCH RIDES THIS DOOR, its one place in the product: "Send me occasional
 * Partyreel updates", written only on a confirmation made here, through `/api/guests/capture-email`,
 * which derives the address from the confirmed session (never from this page).
 *
 * The file keeps its name (the offer card it held is retired into this step): the lab's touchpoints
 * read the capture's words here.
 */

/** The keep's title, and her name menu's card's (`guest-name-menu.tsx`): the ask's two homes. */
export const KEEP_TITLE = "Keep this event";

/**
 * The offer's two sentences: the event first, and the future ("to come back to anytime"), with her
 * photographs counted inside it, one of them said in the singular. The event by name where it has
 * one; "this event" otherwise, so the sentence never reads with a hole in it.
 */
export function keepCopy(
  count: number,
  eventName?: string | null,
): { title: string; reason: string } {
  const event = eventName?.trim() || "this event";
  const photos =
    count === 1
      ? "your photo"
      : count > 1
        ? `your ${formatCount(count)} photos`
        : "your photos";
  return {
    title: KEEP_TITLE,
    reason: `Confirm your email and ${event} stays in your account with ${photos}, to come back to anytime.`,
  };
}

/**
 * Where what she sent went: into the album (the host's, by name, when the host has one), or, where what she adds
 * waits, waiting in her uploads' own words for it (one state, one name): for the album to develop, with its time,
 * on an album with a develop time ahead (`TRACKER_SEALED_WORDS`, red-team 43), else for approval
 * (`TRACKER_WORDS.waiting`). Never "joined the album" for a photograph the album does not show yet.
 */
export function keepSentLine(input: {
  count: number;
  held: boolean;
  /** The album's develop time while it is ahead (`uploadsWait`'s `developsAt`): what she sent is sealed until then. */
  developsAt?: string | null;
  hostName?: string | null;
}): string {
  const { count, held } = input;
  const host = input.hostName?.trim();
  const subject =
    count === 1 ? "Your photo" : `Your ${formatCount(count)} photos`;
  const verb = count === 1 ? "is" : "are";
  if (input.developsAt) {
    const when = developTimeWords(input.developsAt);
    return `${subject} ${verb} ${TRACKER_SEALED_WORDS.toLowerCase()}${when ? `, ${when}` : ""}.`;
  }
  if (held) {
    return `${subject} ${verb} ${TRACKER_WORDS.waiting.toLowerCase()}.`;
  }
  return `${subject} joined ${host ? `${host}’s album` : "the album"}.`;
}

/**
 * The ask itself: what went, the offer, and the two ways on.
 *
 * ★ THE KEEP AS DRAWN (`identity-door` r3's carried call: the keep screen as guest-capture's offer
 * sheet), with its head a beat in the album's light (Will's `beat=lit`): "Sent" beside a check that
 * blooms in the lamp's hues, over where it went, then the ask. The ask heads with the door's one
 * heading scale, from the left like every step (the drawing centred it a step smaller; one heading
 * scale for every guest sheet is the door's rule, a call for Will to overrule). Its words are
 * `voice-guest` r2's `keep=warm` (`keepCopy`).
 */
export function KeepOffer({
  count,
  held,
  developsAt = null,
  hostName,
  eventName,
  onConfirm,
  onLater,
}: {
  /** The photographs of hers that landed this visit (live: it grows as the rest land). */
  count: number;
  /** What she adds waits (`uploadsWait`'s `waits`): for the host's approval, or for a develop time ahead. */
  held: boolean;
  /** The album's develop time while it is ahead: what she sent waits for it. */
  developsAt?: string | null;
  hostName?: string | null;
  /** The event she is keeping, by name (`keepCopy`'s "this event" without one). */
  eventName?: string | null;
  onConfirm: () => void;
  onLater: () => void;
}) {
  const copy = keepCopy(count, eventName);
  return (
    <div data-keep-step="offer" className="flex flex-col gap-5">
      {/* WHAT WENT: the beat of her first photo sent. A check in the album's light blooms beside
          "Sent" (its own success-check motion, wherever the keep arrives from), then where it
          went. Said to the eye and to a screen reader alike: the shell names the sheet with the
          offer, and this is what happened just before it. */}
      <div data-keep-sent className="flex items-center gap-3">
        <DoorCheck size="sent" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-heading text-card-title text-foreground">Sent</p>
          <p className="text-working text-muted-foreground">
            {keepSentLine({ count, held, developsAt, hostName })}
          </p>
        </div>
      </div>
      {/* For the eye; the shell announces the offer's two sentences as the sheet's name. */}
      <DoorHeading title={copy.title} reason={copy.reason} hidden />
      <div className="flex flex-col gap-2">
        <Button type="button" size="cta" className="w-full" onClick={onConfirm}>
          <MailCheck /> Confirm your email
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onLater}
        >
          Maybe later
        </Button>
      </div>
    </div>
  );
}

/**
 * CONFIRM YOUR EMAIL, IN THE SAME SHEET: the account door in its `keep` wear, opening on the
 * address she typed under her name this visit when she typed one (a convenience, never an
 * authorization: the code still has to land in that inbox). No second sheet over the held one:
 * one thing to answer, one way back (the door's own chevron, to the offer).
 */
export function KeepConfirm({
  qrToken,
  hintEmail,
  onVerified,
}: {
  qrToken: string;
  hintEmail?: string | null;
  /** The code confirmed; `newsletter` is the switch's answer. The modal runs the claim. */
  onVerified: (result: { newsletter: boolean }) => void | Promise<void>;
}) {
  const [optIn, setOptIn] = useState(false);
  // Built at render from the album she is standing on, so a magic link or the Google round trip
  // comes back to it (a custom slug included) and its mount-time claim plays the moment.
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${window.location.pathname}`
      : `/auth/callback?next=/e/${qrToken}`;
  return (
    <div data-keep-step="confirm">
      <AccountDoor
        // The door draws the heading, so the code screen can head itself "Check your email" in its
        // place (`code=mail`); the shell announces the same two sentences as the sheet's name.
        head={{
          title: DOOR_WEAR.keep.heading,
          reason: DOOR_WEAR.keep.reason,
        }}
        wear="keep"
        methods={{ code: true, google: true }}
        emailRedirectTo={emailRedirectTo}
        // The welcome carried the Terms line every guest passes once.
        consent={false}
        chrome="none"
        intent="create"
        // This device holds the tickets a claim would move (she just added to one), so a code the
        // address already had holds on "you already had an account" before anything is claimed.
        hold
        hintEmail={hintEmail ?? undefined}
        inputClassName="h-11 text-base"
        buttonSize="cta"
        buttonClassName="h-11"
        onVerified={() => onVerified({ newsletter: optIn })}
      >
        <div className="flex items-center gap-2">
          <Switch
            id="pr-keep-newsletter"
            size="sm"
            checked={optIn}
            onCheckedChange={setOptIn}
          />
          <Label
            htmlFor="pr-keep-newsletter"
            className="text-xs font-normal text-muted-foreground"
          >
            Send me occasional Partyreel updates
          </Label>
        </div>
      </AccountDoor>
    </div>
  );
}

/**
 * The newsletter's write, best-effort and never blocking: it must never fail the confirmation it
 * rides on. The route derives the confirmed address from the session (`getUser()`), so nothing here
 * can put somebody else's on the list.
 */
export async function captureKeepNewsletter(sessionToken: string | null) {
  if (!sessionToken) return;
  try {
    await fetch("/api/guests/capture-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_token: sessionToken,
        newsletter_opt_in: true,
      }),
    });
  } catch {
    // swallowed on purpose (see above)
  }
}
