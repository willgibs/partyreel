"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn, MailCheck, Pencil } from "lucide-react";

import {
  AccountDoor,
  DOOR_WEAR,
  type DoorWear,
} from "@/components/auth/account-door";
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
 * the two cannot drift). "Confirm your email" is the capture door, `save`'s
 * wear, the same act the offer card under the album offers. "Change name"
 * reopens the door in edit mode through `lib/guest/name-door.ts`, because this
 * header is a SIBLING island of the page that owns the modal. "Sign in" is the
 * new `signin` wear, for the one person the others do not fit: somebody who
 * already has an account and wants tonight's photographs in it.
 *
 * ★ NO SIGN-OUT ROW, on purpose. There is no session to end: the capability is
 * a token in this browser's storage and the name beside it. Clearing them would
 * orphan the photographs this device can still remove, and a guest who wants a
 * different name has the row above.
 */
export function GuestNameMenu({
  name,
  onRenamed,
}: {
  /** The name this device typed at this event. */
  name: string;
  /** Fired after a confirmation lands, so the header can re-resolve itself. */
  onRenamed?: () => void;
}) {
  const router = useRouter();
  const [door, setDoor] = useState<DoorWear | null>(null);
  const emailRedirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback?next=${window.location.pathname}`
      : "/auth/callback";
  const copy = door ? DOOR_WEAR[door] : null;

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
            <span className="truncate text-xs leading-tight font-normal text-muted-foreground">
              {UNVERIFIED_LABEL}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDoor("save")}>
            <MailCheck /> Confirm your email
          </DropdownMenuItem>
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
            <DialogDescription>
              {copy?.reason ?? DOOR_WEAR.save.reason}
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
                setDoor(null);
                onRenamed?.();
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
