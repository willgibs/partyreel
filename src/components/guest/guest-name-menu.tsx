"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, Pencil } from "lucide-react";

import { ConfirmEmailDialog } from "@/components/auth/confirm-email-dialog";
import {
  AddEmailDialog,
  PENDING_EMAIL_REMOVABLE,
} from "@/components/guest/add-email-dialog";
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
 * THE HEADER'S THIRD STATE.
 *
 * The guest header knows three people: a stranger ("Start for free"), a
 * signed-in visitor (their account menu), and the commonest person at a
 * name-only party: somebody who typed a name, added photographs, and is now
 * SOMEBODY on this album without holding an account. Left on the stranger's
 * CTA, the one surface that says who you are would say nothing about who they
 * had just become, and give them no way to change a name they had mistyped in a
 * dark room.
 *
 * ★ HER NAME, THEN THE CARD, THEN TWO ROWS (Will, `identity-door` r1 `menu=card`: "add the name +
 * 'Unverified' stack above the 'add your email' card in the menu, and change the 'You're
 * Unverified' copy in the card to 'Save this event for later' to feel more beneficial. This keeps
 * their name in the menu, keeps one instance of unverified, but shifts adding their email to a
 * direct benefit instead of scare tactics").
 *   - The label: her name over "Unverified" (the mark's own word, read from it, so the two cannot
 *     drift), or over "Email not confirmed" once an address was added. "Unverified" appears
 *     exactly once in this menu.
 *   - The card: "Save this event for later", and the one act that does it. Name only: "Add your
 *     email" (`add-email-dialog.tsx`, the second chance at the door's optional field). An
 *     address added: "Confirm your email" straight into the code door (which opens EMPTY,
 *     because the address was never kept, and says so), with a quiet "Change or remove it".
 *   - "Change name" reopens the door in edit mode through `lib/guest/name-door.ts`, because this
 *     header is a SIBLING island of the page that owns the modal.
 *   - "Log in", the chooser's word, for somebody who already has an account and wants tonight's
 *     photographs in it.
 *
 * ★ THIS IS THE ONE SURFACE THAT KNOWS ABOUT THE UNCONFIRMED ADDRESS. Publicly
 * every unconfirmed guest is handled the same, so the mark says "Unverified"
 * whether or not an address was typed, and only the guest's own menu says
 * "Email not confirmed". It reads the DEVICE FLAG, never an address (nothing
 * stores one).
 *
 * ★ A PENDING ADDRESS CAN BE CHANGED, AND REMOVED (`PENDING_EMAIL_REMOVABLE`, the one line that
 * flips it). No host ever sees a pending address and the upload record keeps what was typed, so
 * withdrawing one loses nothing accountable, while a name-only guest has no account to delete. A
 * CONFIRMED address is changed only on the account page, confirmed at both addresses.
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
  // The address sheet: open, and which of its two acts. The mode outlives the close so the sheet
  // never re-titles itself while it is still leaving.
  const [emailSheetOpen, setEmailSheetOpen] = useState(false);
  const [emailSheetMode, setEmailSheetMode] = useState<"add" | "change">("add");
  const openEmailSheet = (mode: "add" | "change") => {
    setEmailSheetMode(mode);
    setEmailSheetOpen(true);
  };
  /* Every way into a door here (the card's confirm, the add-email sheet's "Confirm
     it now instead", and Log in, whose claim carries the same photographs)
     writes the album's return marker BEFORE it opens: Google and a magic link
     leave the page, and the marker is what lands the follow moment when they
     come back. */
  const openDoor = (wear: "keep" | "signin") => {
    markPendingOffer(qrToken ?? null);
    setDoor(wear);
  };
  const openConfirm = () => openDoor("keep");
  /* The address sheet only where it can actually land: a row has to exist for
     the address to go on. Without a token the card keeps the confirm act, which
     mints its own row on the way through. */
  const hasRow = Boolean(qrToken && sessionToken);

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
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate leading-tight font-medium">{name}</span>
            {/* The public word, unless this device knows better about itself. */}
            <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
              {emailAttached ? "Email not confirmed" : UNVERIFIED_LABEL}
            </span>
          </DropdownMenuLabel>
          {/* THE CARD: the benefit, then the one act that buys it. Its actions are menu items,
              so arrow keys and typeahead reach them like every other row. */}
          <div data-menu-card className="m-1 rounded-md bg-muted/60 p-3">
            <p className="text-reading text-pretty text-foreground">
              Save this event for later
            </p>
            {emailAttached || !hasRow ? (
              <DropdownMenuItem
                onSelect={openConfirm}
                className="mt-2 h-8 justify-center bg-primary font-medium text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
              >
                Confirm your email
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => openEmailSheet("add")}
                className="mt-2 h-8 justify-center bg-primary font-medium text-primary-foreground focus:bg-primary/90 focus:text-primary-foreground"
              >
                Add your email
              </DropdownMenuItem>
            )}
            {emailAttached && hasRow && (
              <DropdownMenuItem
                onSelect={() => openEmailSheet("change")}
                className="mt-1 justify-center py-1 text-xs text-muted-foreground underline-offset-4 focus:bg-transparent focus:text-foreground focus:underline"
              >
                {PENDING_EMAIL_REMOVABLE ? "Change or remove it" : "Change it"}
              </DropdownMenuItem>
            )}
          </div>
          <DropdownMenuItem onSelect={() => requestNameDoor("edit")}>
            <Pencil /> Change name
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openDoor("signin")}>
            <LogIn /> Log in
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
      {hasRow && qrToken && sessionToken && (
        <AddEmailDialog
          qrToken={qrToken}
          sessionToken={sessionToken}
          mode={emailSheetMode}
          open={emailSheetOpen}
          onOpenChange={setEmailSheetOpen}
          // No callback: the sheet writes the device flag and the same store
          // the header subscribes to re-labels this menu on its own.
          onConfirmInstead={openConfirm}
        />
      )}
    </>
  );
}
