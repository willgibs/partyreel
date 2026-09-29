"use client";

import { useState, useTransition } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

import { signOutEverywhereAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popup,
  PopupClose,
  PopupContent,
  PopupFooter,
  PopupHeader,
  PopupTrigger,
} from "@/components/ui/popup";
import { forgetGuestTickets } from "@/lib/guest/use-stored-session";

/**
 * SIGN OUT EVERYWHERE, the last card of the account's security corner
 * (auth-accounts.md, "Signing out").
 *
 * The account menu's Sign out ends this device's session alone, so the one act
 * that reaches every device lives here, beside how the account signs in, which
 * is where a person looks when a phone goes missing or a shared computer is
 * still signed in. It is never a menu row: it is rare, and it signs out devices
 * the person is not holding.
 *
 * ★ THE CONFIRM SAYS "THIS ONE INCLUDED", because this device leaving too is the
 * one consequence the name does not tell, and the press lands on /login.
 */
export function SignOutEverywhereCard() {
  const [open, setOpen] = useState(false);
  const [pending, startSigningOut] = useTransition();

  function onConfirm() {
    startSigningOut(async () => {
      // The device half of every guest ticket, as the menu's Sign out puts it
      // down on submit; the action expires the cookie half on its response.
      forgetGuestTickets();
      const result = await signOutEverywhereAction();
      // Success never answers: the action leaves for /login. Only a refusal
      // comes back, and the popup stays open for another try.
      if (result && !result.ok) toast.error(result.message);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign out everywhere</CardTitle>
        <CardDescription>
          Signing out from your account menu signs out only this device. If a
          phone goes missing or a shared computer is still signed in, sign out
          of every device at once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Popup
          open={open}
          onOpenChange={(next) => {
            // Mid-press the confirm holds: the page is on its way to /login.
            if (!pending) setOpen(next);
          }}
        >
          <PopupTrigger asChild>
            <Button variant="outline">
              <LogOut /> Sign out everywhere
            </Button>
          </PopupTrigger>
          <PopupContent kind="confirm">
            <PopupHeader
              title="Sign out everywhere?"
              description="You'll be signed out on every device, this one included. You can sign back in on any of them."
            />
            <PopupFooter>
              <PopupClose asChild>
                <Button variant="outline" disabled={pending}>
                  Stay signed in
                </Button>
              </PopupClose>
              <Button onClick={onConfirm} disabled={pending}>
                {pending ? "Signing out…" : "Sign out everywhere"}
              </Button>
            </PopupFooter>
          </PopupContent>
        </Popup>
      </CardContent>
    </Card>
  );
}
