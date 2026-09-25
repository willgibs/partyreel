"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

import { DOOR_NAME_KEY } from "@/app/(auth)/door-name-key";
import { AccountDoor, DOOR_WEAR } from "@/components/auth/account-door";
import type { DoorVerified } from "@/components/auth/email-sign-in";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCount } from "@/lib/format/count";
import { checkDisplayName, type JoinRefusal } from "@/lib/guest/join";
import { collectStoredSessionTokens } from "@/lib/guest/session-tokens";
import { readLastName, setLastName } from "@/lib/guest/use-stored-name";
import { DISPLAY_NAME_MAX_LENGTH } from "@/lib/validation/profile";

/**
 * THE NAME AND THE EMAIL, ON ONE SCREEN, CONFIRMED BY A CODE: a verification event's only way in,
 * and a name-only event's "Create account".
 *
 * ★ ONE PATH FOR A NEWCOMER AND A MEMBER (Will, `identity-door` r1 `nudge`: "with magic link/codes,
 * there should be no different handling between create account vs login (new vs existing user
 * guests), since we're simply collecting name + email to send the magic link either way"). The
 * code signs a member in and creates a newcomer's account alike, so this screen never asks which
 * one the guest is.
 *
 * ★ THE NAME RIDES THE CODE REQUEST, never a second trip: it is checked here with the one name
 * policy (`checkDisplayName`), kept by the modal for the confirmation's four writes (a profile with
 * no name takes it), written to `pr_guest_name_last` as the same-browser fallback, and sent as the
 * new user's metadata (`DOOR_NAME_KEY`) so a guest who confirms by the emailed LINK, in another tab
 * or on another device, still lands named (`/auth/callback` adopts it: `adopt-door-name.ts`).
 * A code the account already had keeps that account's own name: the hint under the field says so
 * before they confirm, rather than after they see somebody else's version of their name.
 *
 * ★ GOOGLE AND THE PASSWORD LINK LIVE UNDER LOG IN (a call for Will to overrule): this screen asks
 * for exactly what it needs, a name and an address, and one button.
 *
 * ★ "THE ACCOUNT YOU ALREADY HAD" SPEAKS ONLY WHEN IT GUARDS SOMETHING. Its hold exists so a
 * guest's photographs are never claimed onto an account they are about to sign out of; on a device
 * holding no guest tickets there is nothing to claim, so a newcomer and a member land the same way
 * (a call for Will to overrule). A ticket is the row a claim would move, so holding any is the
 * honest reading of "uploads a claim would move" without a server round trip.
 */
export function IdentifyStep({
  qrToken,
  verification,
  mediaTotal,
  storedName,
  onTypedName,
  onVerified,
}: {
  qrToken: string;
  /** A verification event's door (the gate line shows) rather than a name-only event's Create account. */
  verification: boolean;
  /** Approved media count, for the verification door's "N photos are waiting". */
  mediaTotal?: number;
  /** The name this device already typed at THIS event, if any (the mid-visit flip). */
  storedName?: string | null;
  /** The checked name, the moment the code is requested with it. */
  onTypedName: (name: string) => void;
  /** The code confirmed: the modal's four writes follow. */
  onVerified: (result: DoorVerified) => void | Promise<void>;
}) {
  const [name, setName] = useState(() => storedName ?? readLastName() ?? "");
  const [refusal, setRefusal] = useState<JoinRefusal | null>(null);
  // Read once, when the screen arrives: the tickets that could be claimed are the ones held now.
  const [claimable] = useState(deviceHoldsTickets);
  const copy = identifyCopy({ verification, mediaTotal });

  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=/e/${qrToken}`
      : `/auth/callback?next=/e/${qrToken}`;

  return (
    <div
      data-identify-step={verification ? "gate" : "create"}
      className="flex flex-col gap-4"
    >
      {/* Rendered for the EYE and hidden from the a11y tree: the shell already announces these two
          sentences as the sheet's accessible name and description (`entrySheetCopy`). */}
      <div aria-hidden>
        {verification && (
          <p className="mb-1.5 flex items-center gap-1.5 text-label font-medium text-muted-foreground uppercase">
            <Lock className="size-3" />
            {DOOR_WEAR.gate.heading}
          </p>
        )}
        <p className="font-heading text-page text-balance">{copy.title}</p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {copy.reason}
        </p>
      </div>
      <AccountDoor
        wear={verification ? "gate" : "keep"}
        methods={{ code: true }}
        emailRedirectTo={emailRedirectTo}
        // The welcome carries the Terms line every guest passes once.
        consent={false}
        chrome="none"
        intent={claimable ? "create" : "signin"}
        hold={claimable}
        inputClassName="h-11 text-base"
        buttonSize="cta"
        leading={
          <div className="space-y-1.5">
            <Label htmlFor="pr-identify-name">Your name</Label>
            <Input
              id="pr-identify-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (refusal) setRefusal(null);
              }}
              onKeyDown={(e) => {
                // Return moves on to the address, the next field of the same form.
                if (e.key !== "Enter") return;
                e.preventDefault();
                e.currentTarget.form
                  ?.querySelector<HTMLInputElement>('input[type="email"]')
                  ?.focus();
              }}
              placeholder="Your name"
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              autoComplete="name"
              autoCapitalize="words"
              inputMode="text"
              enterKeyHint="next"
              aria-invalid={refusal ? true : undefined}
              aria-describedby="pr-identify-name-hint"
              className="h-11 text-base"
            />
            {refusal ? (
              <p
                id="pr-identify-name-hint"
                className="text-reading text-destructive"
              >
                {refusal.message}
              </p>
            ) : (
              <p
                id="pr-identify-name-hint"
                className="text-reading text-muted-foreground"
              >
                If you already have a Partyreel account, its name is the one
                that shows.
              </p>
            )}
          </div>
        }
        beforeSend={() => {
          const checked = checkDisplayName(name);
          if (!checked.ok) {
            setRefusal(checked.refusal);
            return false;
          }
          setLastName(checked.name);
          onTypedName(checked.name);
          return { data: { [DOOR_NAME_KEY]: checked.name } };
        }}
        onVerified={onVerified}
      />
    </div>
  );
}

/** Whether this device holds any guest ticket, the rows a claim would move. Never throws. */
function deviceHoldsTickets(): boolean {
  try {
    return collectStoredSessionTokens().length > 0;
  } catch {
    // Blocked storage holds nothing a claim could read either.
    return false;
  }
}

/**
 * The screen's two sentences in one place: the step renders them, and the shell announces them.
 *
 * ★ THE VERIFICATION DOOR SELLS THE ALBUM, AND THE HOST'S REASON IS VERBATIM. Its title is the
 * true count (the header's own always-both-nouns rule, so one album's size is worded the same way
 * everywhere it is said), and its reason is `DOOR_WEAR.gate`, which Will ruled word for word.
 * Create account's reason is the keep promise, which is what confirming actually buys.
 */
export function identifyCopy(input: {
  verification: boolean;
  mediaTotal?: number;
}): { title: string; reason: string } {
  const { verification, mediaTotal } = input;
  if (!verification) {
    return {
      title: "Create your account",
      reason:
        "Confirm your email and every photo you add here stays in your account.",
    };
  }
  return {
    title:
      mediaTotal && mediaTotal > 0
        ? `${formatCount(mediaTotal)} ${mediaTotal === 1 ? "photo" : "photos"} & videos ${mediaTotal === 1 ? "is" : "are"} waiting`
        : "See all the photos",
    reason: DOOR_WEAR.gate.reason,
  };
}
