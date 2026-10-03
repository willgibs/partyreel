"use client";

import Link from "next/link";

import { DOOR_FOOT, DoorWords } from "@/components/guest/door/door-page";
import { LiveCount } from "@/components/guest/door/lit";
import { LegalConsentLine } from "@/components/shared/legal-consent-line";
import { Button } from "@/components/ui/button";
import { formatEventDate } from "@/lib/utils";

/**
 * THE INVITATION, AT THE DOORWAY (`locked-door` r2, Will's `family=doorway` and `shape=shared`): the
 * welcome is the door's page, never a sheet over the album. An open door onto a Public album, the
 * album itself seen through it; a shut one at a gate, its light under it. Its words stay today's
 * (voice-guest settled them; the round asked how the door looks): "You're invited to", the album's
 * name as the headline, who is hosting and when where the door may say it, the two promises, and the
 * one way on, Continue, with the consent line every guest passes once.
 *
 * ★ ONE PRIMARY, AND IT IS ALWAYS "CONTINUE". No second exit ("View the album" when nothing follows, or
 * a ghost "Just browsing"): there is always something behind the welcome (a name at the very least),
 * and the album is the reward the door's asks pay for, not a lobby. Still "Continue" on a revisit,
 * never "Back": back never points both ways, and this button only ever moves forward again.
 *
 * ★ WHO IS HOSTING, ONLY WHERE THE DOOR SAID IT (Will, 2026-10-02: "Only what's shown today"): a Public
 * album's welcome names its host and its date; the welcome where the host lets each guest in or a list
 * keeps names her and no date; a password album's names neither (the page's `shellEvent` is redacted at
 * access `none`), so the byline hides itself there.
 */

/**
 * The invitation's first promise, in the album's own kinds (build 23's NIT-9): a photos-only album (a
 * Free event, or the host's Videos switched off) says photos, since its picker then takes nothing else.
 */
export function welcomeAddLine(acceptsVideo: boolean): string {
  return acceptsVideo
    ? "Add your photos and videos in seconds. No app required."
    : "Add your photos in seconds. No app required.";
}

/**
 * "Hosted by Maya · September 12, 2026" on one line under the album's name (the doorway's centred
 * column): whichever of the two the door may say, the host's name set in the foreground ink.
 */
export function HostedBy({
  hostName,
  eventDate,
  eventEndDate,
}: {
  hostName?: string | null;
  eventDate?: string | null;
  /** The last day of a range, or null for one day. */
  eventEndDate?: string | null;
}) {
  const host = hostName?.trim();
  if (!host && !eventDate) return null;
  return (
    <p className="text-working leading-snug text-muted-foreground">
      {host && (
        <>
          Hosted by <span className="font-medium text-foreground">{host}</span>
        </>
      )}
      {host && eventDate && " · "}
      {eventDate && formatEventDate(eventDate, eventEndDate)}
    </p>
  );
}

/**
 * The second promise, the count as social proof: ticking as photographs land behind the door
 * (`LiveCount`, the page's live number), its words separate strings beside the number so the tick has a
 * node of its own to move.
 */
function CountLine({ count }: { count: number }) {
  if (count <= 0)
    return <>{"Everyone's shots land in one album, yours included."}</>;
  return (
    <>
      {"Everyone's shots land in one album. "}
      <LiveCount value={count} />
      {count === 1 ? " is already inside." : " are already inside."}
    </>
  );
}

/** THE WELCOME'S WORDS AND ITS WAY ON, under the doorway. */
export function WelcomeWords({
  eventName,
  hostName,
  eventDate,
  eventEndDate,
  mediaTotal = 0,
  acceptsVideo,
  onContinue,
}: {
  eventName: string;
  /** Null at a gate (the page's redaction), where the byline hides itself. */
  hostName?: string | null;
  eventDate?: string | null;
  /** The last day of a range, blanked with the date at a gate. */
  eventEndDate?: string | null;
  /** The album's live count, the header's own number. */
  mediaTotal?: number;
  /** Whether this album takes a video from a guest: the invitation promises only what the picker takes. */
  acceptsVideo: boolean;
  onContinue?: () => void;
}) {
  const byline =
    hostName?.trim() || eventDate ? (
      <HostedBy
        hostName={hostName}
        eventDate={eventDate}
        eventEndDate={eventEndDate}
      />
    ) : undefined;
  return (
    <div data-welcome-step="" className="flex w-full flex-col items-center">
      <DoorWords
        eyebrow={<>You&rsquo;re invited to</>}
        title={<span data-door-lit-name="">{eventName}</span>}
        titleAs="h1"
        byline={byline}
        lines={[
          welcomeAddLine(acceptsVideo),
          <CountLine key="count" count={mediaTotal} />,
        ]}
      />
      <div className={DOOR_FOOT}>
        <Button onClick={onContinue} size="cta" className="w-full">
          Continue
        </Button>
        {/* The acceptance line rides the door every guest passes once; links open in a new tab so the
            door she is standing at survives the tap. */}
        <LegalConsentLine newTab className="text-center" />
      </div>
    </div>
  );
}

/**
 * THE DEMO'S OWN ARRIVAL, AT THE SAME DOORWAY. It is the SAME "welcome" step every guest gets
 * (entry-steps.ts), wearing different words, so its design stays the welcome's: a redesign redraws both
 * together. Three things a visitor here needs that the guest's welcome does not give: what this is (a
 * real album, standing in for theirs), where they are standing (in a guest's shoes, at somebody's
 * party), and the one thing to try. Its two promises mirror the welcome's, said to a prospective HOST.
 * No consent line: looking around a demo agrees to nothing. ★ NO "LOOK AROUND" HERE: that is the demo's
 * own skip on the upload step, where looking around is the alternative being offered.
 */
export function RoleWords({
  eventName,
  hostName,
  onContinue,
}: {
  eventName: string;
  hostName?: string | null;
  onContinue?: () => void;
}) {
  const host = hostName?.trim();
  return (
    <div data-welcome-step="" className="flex w-full flex-col items-center">
      <DoorWords
        eyebrow="A live demo"
        title={
          <>
            <span className="block text-page">You&rsquo;re a guest at</span>
            <span data-door-lit-name="" className="block">
              {eventName}
            </span>
          </>
        }
        titleAs="h1"
        byline={
          <p className="text-working text-muted-foreground">
            This is a real album, exactly as {host ? `${host}’s` : "the host’s"}{" "}
            guests see it.
          </p>
        }
        lines={[
          "Add a photo the way a guest would. Nothing you add is saved.",
          "One code did all of this. Yours takes about a minute.",
        ]}
      />
      <div className={DOOR_FOOT}>
        <Button onClick={onContinue} size="cta" className="w-full">
          Continue
        </Button>
        <Button
          asChild
          variant="ghost"
          className="w-full text-muted-foreground"
        >
          <Link href="/">Start your own</Link>
        </Button>
      </div>
    </div>
  );
}
