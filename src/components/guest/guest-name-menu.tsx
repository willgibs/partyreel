"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, MailCheck, Pencil } from "lucide-react";

import { ConfirmEmailDialog } from "@/components/auth/confirm-email-dialog";
import { AddEmailDialog } from "@/components/guest/add-email-dialog";
import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { markPendingOffer } from "@/lib/guest/album-return";
import { requestNameDoor } from "@/lib/guest/name-door";

/**
 * THE HEADER'S THIRD STATE (the identity reshape, 2026-09-21).
 *
 * The guest header knew two people: a stranger ("Start for free") and a
 * signed-in visitor (their account menu). The reshape made a third real, and
 * they are the commonest person at a name-only party: somebody who typed a name,
 * added photographs, and is now SOMEBODY on this album without holding an
 * account. Leaving them on the stranger's CTA meant the one surface that says
 * who you are said nothing about who they had just become, and gave them no way
 * to change a name they had mistyped in a dark room.
 *
 * ★ FOUR ROWS, AND EACH IS A DIFFERENT PERSON'S NEXT MOVE. The label says the
 * name and marks it unconfirmed (the same words the mark uses, read from it, so
 * the two cannot drift). The email row is the capture door (`ConfirmEmailDialog`,
 * the `keep` wear), the same act the offer card under the album offers, with the
 * same result: the uploads claimed, and the event with them (guest by upload,
 * 2026-09-22: no save step any more). "Change name" reopens the
 * door in edit mode through `lib/guest/name-door.ts`, because this header is a
 * SIBLING island of the page that owns the modal. "Sign in" is the `signin`
 * wear, for the one person the others do not fit: somebody who already has an
 * account and wants tonight's photographs in it.
 *
 * ★ THIS IS THE ONE SURFACE THAT KNOWS ABOUT THE UNCONFIRMED ADDRESS (Will,
 * 2026-09-22: publicly every unconfirmed guest is handled the same, so the mark
 * says "Unverified" whether or not an address was typed; "only the guest's own
 * menu says 'Email not confirmed'"). It reads the DEVICE FLAG, never an address
 * — nothing stores one — so the two states it draws are:
 *   name only        → "Unverified" under the name, and "Add your email"
 *                      (`add-email-dialog.tsx`), the second chance at the
 *                      door's optional field once the album has made its case.
 *   email attached   → "Email not confirmed" under the name, and "Confirm your
 *                      email" straight into the code door — which opens EMPTY,
 *                      because the address was never kept, and says so.
 * There is no "Remove your email" row this round: the detach exists on the RPC
 * for the dashboard's "Not mine", and the shape of a removal here is the lab's.
 *
 * ★ NO SIGN-OUT ROW, on purpose. There is no session to end: the capability is
 * a token in this browser's storage and the name beside it. Clearing them would
 * orphan the photographs this device can still remove, and a guest who wants a
 * different name has the row above.
 */
export function GuestNameMenu({
  name,
  qrToken,
  sessionToken,
  emailAttached = false,
  onRenamed,
}: {
  /** The name this device typed at this event. */
  name: string;
  /** The album's canonical token: the add-email dialog needs it, and the return marker is keyed on it. */
  qrToken?: string;
  /** The capability the address lands on. Without one there is no row to add to. */
  sessionToken?: string | null;
  /** This device put an unconfirmed address on this event's row (the device flag). */
  emailAttached?: boolean;
  /** Fired after a confirmation lands, so the header can re-resolve itself. */
  onRenamed?: () => void;
}) {
  const router = useRouter();
  const [door, setDoor] = useState<"keep" | "signin" | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  /* Every way into a door here (the email row, the add-email dialog's "Confirm
     it now instead", and Sign in, whose claim carries the same photographs)
     writes the album's return marker BEFORE it opens: Google and a magic link
     leave the page, and the marker is what lands the follow moment when they
     come back. */
  const openDoor = (wear: "keep" | "signin") => {
    markPendingOffer(qrToken ?? null);
    setDoor(wear);
  };
  const openConfirm = () => openDoor("keep");
  /* Only offer the second chance where it can actually land: a row has to exist
     for the address to go on. Without a token the menu keeps the confirm row,
     which mints its own row on the way through. */
  const canAddEmail = Boolean(qrToken && sessionToken) && !emailAttached;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label="Your name on this album"
          className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {/* No seed: a colour is an identity on every other surface of this
              product, and this one has not been proven (unverified-mark.tsx). */}
          <Avatar size="sm">
            <AvatarFallback className="text-[10px]">
              {name.slice(0, 1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="max-w-28 truncate text-sm">{name}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate leading-tight font-medium">{name}</span>
            {/* The public word, unless this device knows better about itself. */}
            <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
              {emailAttached ? "Email not confirmed" : UNVERIFIED_LABEL}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {canAddEmail ? (
            <DropdownMenuItem onSelect={() => setAddOpen(true)}>
              <Mail /> Add your email
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={openConfirm}>
              <MailCheck /> Confirm your email
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => requestNameDoor("edit")}>
            <Pencil /> Change name
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openDoor("signin")}>
            <LogIn /> Sign in
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmEmailDialog
        open={door !== null}
        onOpenChange={(o) => !o && setDoor(null)}
        wear={door ?? "keep"}
        // ★ THE ONE PLACE THE WEAR'S OWN SENTENCE IS OVERRIDDEN: a guest who
        // added an address at the door is about to meet an EMPTY field, because
        // nothing kept what they typed. Saying so is the difference between a
        // door that looks broken and one that is being honest about a rule the
        // guest benefits from.
        description={
          door === "keep" && emailAttached
            ? "Enter the email you added and we will send a code."
            : undefined
        }
        onConfirmed={() => {
          // The claim has landed (the door awaited it); the refresh redraws
          // every credit on the page confirmed, and the album plays the follow
          // moment itself when it hears this album's uploads moved.
          setDoor(null);
          onRenamed?.();
          router.refresh();
        }}
      />

      {/* Mounted only where it can act (a row exists to carry the address), and
          its "Confirm it now instead" hands straight over to the door above. */}
      {qrToken && sessionToken && (
        <AddEmailDialog
          qrToken={qrToken}
          sessionToken={sessionToken}
          open={addOpen}
          onOpenChange={setAddOpen}
          // No callback: the dialog writes the device flag and the same store
          // the header subscribes to re-labels this menu on its own.
          onConfirmInstead={openConfirm}
        />
      )}
    </>
  );
}
