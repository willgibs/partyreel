"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Mail, MailCheck, Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  AccountDoor,
  DOOR_WEAR,
  type DoorWear,
} from "@/components/auth/account-door";
import { AddEmailDialog } from "@/components/guest/add-email-dialog";
import { UNVERIFIED_LABEL } from "@/components/shared/unverified-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SAVE_FAILED,
  SAVED_TO_DASHBOARD,
  markPendingSave,
  saveEvent,
} from "@/lib/events/save-event";
import { claimAnonymousUploads } from "@/lib/guest/claim-uploads";
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
 * the two cannot drift). The email row is the capture door, `save`'s wear, the
 * same act the offer card under the album offers, with the same result: the
 * uploads claimed, then the event saved to the dashboard. "Change name" reopens the
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
  eventId,
  sessionToken,
  emailAttached = false,
  onRenamed,
}: {
  /** The name this device typed at this event. */
  name: string;
  /** Needed by the add-email dialog; omitted on a page with no event behind it. */
  qrToken?: string;
  /** The event itself, so confirming here saves it; omitted with `qrToken`. */
  eventId?: string;
  /** The capability the address lands on. Without one there is no row to add to. */
  sessionToken?: string | null;
  /** This device put an unconfirmed address on this event's row (the device flag). */
  emailAttached?: boolean;
  /** Fired after a confirmation lands, so the header can re-resolve itself. */
  onRenamed?: () => void;
}) {
  const router = useRouter();
  const [door, setDoor] = useState<DoorWear | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  // The event a confirmation here keeps, as the offer card's door keeps it.
  const keep = eventId && qrToken ? { eventId, qrToken } : null;
  /* Both ways into the confirm door (the row, and the add-email dialog's
     "Confirm it now instead") write the save intent BEFORE it opens: Google and
     a magic link leave the page, and the event page finishes the save on the
     way back from exactly this intent. */
  const openConfirm = () => {
    if (keep) markPendingSave(keep.eventId);
    setDoor("save");
  };
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${window.location.pathname}`
      : "/auth/callback";
  const copy = door ? DOOR_WEAR[door] : null;
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
          <DropdownMenuItem onSelect={() => setDoor("signin")}>
            <LogIn /> Sign in
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={door !== null} onOpenChange={(o) => !o && setDoor(null)}>
        <DialogContent>
          {/* The Dialog owns the title and the description for a11y (radix
              wires aria-labelledby / -describedby to these), so the words come
              from the door's own wear table rather than being retyped here. */}
          <DialogHeader>
            <DialogTitle>{copy?.heading ?? DOOR_WEAR.save.heading}</DialogTitle>
            {/* ★ AND THE ONE PLACE THE WEAR'S OWN SENTENCE IS OVERRIDDEN: a guest
                who added an address at the door is about to meet an EMPTY field,
                because nothing kept what they typed. Saying so is the difference
                between a door that looks broken and one that is being honest
                about a rule the guest benefits from. */}
            <DialogDescription>
              {door === "save" && emailAttached
                ? "Enter the email you added and we will send a code."
                : (copy?.reason ?? DOOR_WEAR.save.reason)}
            </DialogDescription>
          </DialogHeader>
          {door && (
            <AccountDoor
              wear={door}
              methods={{ code: true, google: true, password: door === "signin" }}
              emailRedirectTo={emailRedirectTo}
              chrome="none"
              // Confirming from here CREATES for most people; signing in does
              // not, and saying "you already had an account" to somebody who
              // just pressed Sign in is noise rather than a warning.
              intent={door === "signin" ? "signin" : "create"}
              onVerified={async () => {
                // Awaited: the refresh below redraws every credit on the page,
                // and a claim still in flight would redraw them unconfirmed.
                await claimAnonymousUploads({ silent: true });
                // Confirming keeps the event, as the offer card's door does,
                // in its words. Sign in promises only that the photographs
                // join the account, which the claim above already did.
                if (door === "save" && keep) {
                  if (await saveEvent(keep)) toast.success(SAVED_TO_DASHBOARD);
                  else toast.error(SAVE_FAILED);
                }
                setDoor(null);
                onRenamed?.();
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

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
