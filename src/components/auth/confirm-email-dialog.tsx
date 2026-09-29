"use client";

import type { ReactNode } from "react";

import { AccountDoor, DOOR_WEAR } from "@/components/auth/account-door";
import { DOOR_SCRIM, DoorLamp } from "@/components/guest/door/lit";
import { DOOR_SHEET } from "@/components/guest/entry-shell";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { currentAlbum } from "@/lib/guest/album-return";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
import {
  lastClaimPlayedMoment,
  reportConfirmBeat,
} from "@/lib/guest/confirm-beat";

/**
 * THE CONFIRM DOOR ON AN ALBUM, ONE OBJECT FOR THE PLACES THAT OPEN IT OVER THE ALBUM (guest by
 * upload, 2026-09-22): the Unverified mark on a guest's own credit and the header's name menu (which
 * also opens it as Log in). The ask after a first upload is the door's own last screen now (the keep,
 * `save-account-prompt.tsx`), which wears the same account door inside the held sheet. Save is gone
 * ("uploading to an event is now effectively saving"), so the door does one thing, in one order:
 *
 *   1. the account door in its `keep` wear (or `signin`), whose words hold before an upload too,
 *      since the name menu offers it the moment a name is typed;
 *   2. on a verified code, the CLAIM, awaited: the guest's uploads (and with them their events)
 *      become the account's before anything redraws, because a refresh that overtook the claim
 *      would redraw the very credit the guest just paid an email to fix;
 *   3. the ONE BEAT (`confirm-beat.ts`): when the claim plays the follow moment its card says
 *      everything; otherwise the claim's other events are reported, and the page settles the name
 *      her photos now carry before it says both once;
 *   4. then the opener's own follow-through (a dismissal, a refresh).
 *
 * ★ IT WEARS THE DOOR'S LIGHT (`identity-door` r2, `look=lit`): the lit scrim and the album's lamp
 * on its free edge, since it is the door's own sheet opened again over the album. And the door's
 * heading and padding (`DOOR_SHEET`, `door/heading.tsx`): its title on the page step every door
 * step heads with, never a Sheet's card title, so one guest meets one size of heading; the door
 * draws it, so the code screen can head itself "Check your email" in its place (`code=mail`).
 *
 * A Google or magic-link confirmation never reaches step 2 here: it leaves the page and comes back
 * to the album's mount-time claim instead. That is why every opener writes the return marker
 * (`markPendingOffer`, lib/guest/album-return.ts) BEFORE it opens this, and why the follow moment
 * itself is the album page's decision, not this door's: the page hears every claim, from here or
 * from its own mount, and plays the moment only when this album's uploads actually moved.
 *
 * The Sheet owns the title and the description for a11y (radix wires aria-labelledby and
 * -describedby to them), so the words come from the door's own wear table rather than being retyped;
 * an opener may override the description alone, for a fact only it knows.
 *
 * ★ IT WEARS THE ONE RESPONSIVE SHEET (door-flow), like every other guest surface: a bottom sheet in
 * a hand, a side panel at a desk, never a centred box. Its phone half stands on the keyboard while
 * the email or the code is being typed, with the code button pinned at its foot, and no field takes
 * focus when it opens (the Sheet's own rules), so the confirm door types as calmly as the album's
 * own door.
 */
export function ConfirmEmailDialog({
  open,
  onOpenChange,
  wear = "keep",
  description,
  hintEmail,
  onConfirmed,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `keep` confirms (and usually CREATES); `signin` is for somebody who already has an account. */
  wear?: "keep" | "signin";
  /** Replaces the wear's reason line when the opener knows something the table cannot. */
  description?: string;
  /**
   * An address typed at the album's door this visit, so the field opens on it. A convenience,
   * never an authorization: the code still has to land in that mailbox.
   */
  hintEmail?: string | null;
  /** The opener's follow-through, after the claim has landed. */
  onConfirmed?: () => void | Promise<void>;
  /** One extra control under the field (the offer card's newsletter switch). */
  children?: ReactNode;
}) {
  const copy = DOOR_WEAR[wear];
  // Built at render from where the guest is standing, so a magic link or the Google round trip
  // comes back to this album (a custom slug included) and its mount-time claim.
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${window.location.pathname}`
      : "/auth/callback";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        responsive
        className={DOOR_SHEET}
        overlayClassName={DOOR_SCRIM}
        data-door-lit=""
      >
        <DoorLamp edge="free" />
        {/* The dialog's name and description; the door draws the same words for the eye. */}
        <SheetTitle className="sr-only">{copy.heading}</SheetTitle>
        <SheetDescription className="sr-only">
          {description ?? copy.reason}
        </SheetDescription>
        <AccountDoor
          head={{ title: copy.heading, reason: description ?? copy.reason }}
          // The guest door's field and button: 16px (no iOS focus zoom) and the 44px primary.
          inputClassName="h-11 text-base"
          buttonSize="cta"
          buttonClassName="h-11"
          wear={wear}
          methods={{ code: true, google: true, password: wear === "signin" }}
          emailRedirectTo={emailRedirectTo}
          chrome="none"
          // Confirming CREATES for most people; signing in does not, and saying "you already had an
          // account" to somebody who just pressed Log in is noise rather than a warning.
          intent={wear === "signin" ? "signin" : "create"}
          // Undefined rather than null when there is nothing to hint: the door seeds its field from
          // this once, and a null would read as a hint of empty rather than as no hint.
          hintEmail={hintEmail ?? undefined}
          onVerified={async () => {
            const claimed = await claimAnonymousUploads({ silent: true });
            // The one beat: nothing to report when the claim played the follow moment (every
            // opener wrote the album's marker before opening this), whose card says it all.
            const album = claimed?.album ?? currentAlbum();
            if (album && !lastClaimPlayedMoment(album)) {
              // The page settles the name (it is the one place that may reach the account's
              // Server Function) and says the beat once.
              reportConfirmBeat({
                album,
                name: null,
                elsewhere: claimed?.elsewhere ?? 0,
                settle: true,
              });
            }
            await onConfirmed?.();
          }}
        >
          {children}
        </AccountDoor>
      </SheetContent>
    </Sheet>
  );
}
