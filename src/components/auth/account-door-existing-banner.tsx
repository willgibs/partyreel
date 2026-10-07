"use client";

import { useEffect, useState } from "react";
import { UserCheck, X } from "lucide-react";

import { EXISTING_PARAM } from "@/app/(auth)/auth/callback/existing-account";
import { signOutHere } from "@/components/auth/sign-out";
import { Button } from "@/components/ui/button";
import { forgetGuestTickets } from "@/lib/guest/use-stored-session";

/**
 * "SIGNED YOU INTO THE ACCOUNT <EMAIL> ALREADY HAD", FOR A LINK (crumbs-88; Will's `existing=tell`, 2026-09-20: "With the
 * streamlined magic link email login, it may feel easy to confuse 'create account' and 'login' screens. This makes that
 * mistake seamless, but still flags it just in case"; and "it should be dismissible and provide an action if it was a
 * mistake"). The code says it inside the door (`AccountDoor`'s ExistingAccount step); a tapped link or Google's round trip
 * leaves the page, so the callback lands the dashboard marked (`/dashboard?signed_in=existing`, after the server's own test
 * on the caller's own row: `auth/callback/existing-account.ts`) and this is the one line the mark draws, under the head.
 *
 * ★ THE SAME TWO WAYS OUT THE CODE GIVES: dismiss it, or "Not you?" (this device's sign-out, as the account menu's, which
 * also puts down the guest tickets this device holds, so the next person's photographs are never credited to her), after
 * which the door is the page she meets with its field clear.
 *
 * ★ THE ADDRESS IS HER OWN SESSION'S, never the mark's (the page reads it off her profile), so a hand-typed mark says only
 * what she already is, signed in as herself.
 *
 * ★ IT CLEANS ITS ADDRESS the moment it mounts (`replaceState`, no request): the mark is the arrival's, so a reload or a
 * bookmark never says it again, and nothing the page refreshes for is held to a mark.
 */
export function ExistingAccountBanner({ email }: { email: string | null }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(EXISTING_PARAM)) return;
    url.searchParams.delete(EXISTING_PARAM);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  if (!open) return null;

  return (
    <div
      data-existing-account=""
      role="status"
      className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
    >
      <span className="flex min-w-0 items-start gap-2.5 text-sm text-foreground">
        <UserCheck
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <span className="text-pretty">
          {email ? (
            <>
              Signed you into the account{" "}
              <span className="font-medium [overflow-wrap:anywhere]">
                {email}
              </span>{" "}
              already had.
            </>
          ) : (
            <>Signed you into the account you already had.</>
          )}{" "}
          <button
            type="button"
            onClick={() => {
              // The menu's own order: the tickets this device holds go first, then the sign-out leaves for /login.
              forgetGuestTickets();
              void signOutHere();
            }}
            className="focus-halo rounded-sm text-muted-foreground underline underline-offset-4 outline-none hover:text-foreground"
          >
            Not you?
          </button>
        </span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Dismiss"
        className="-my-1 -mr-2 shrink-0"
        onClick={() => setOpen(false)}
      >
        <X aria-hidden />
      </Button>
    </div>
  );
}
