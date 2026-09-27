"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { dismissPageInviteAction } from "@/app/(app)/account/profile/actions";
import { PROFILE_SETUP_PATH } from "@/app/(app)/account/profile/invite";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

/**
 * THE INVITATION (`identity-profile` r1, `prompt=claim`: "once Priya finishes claiming events from
 * the dashboard, a card invites her to set up her page next", with the board's reason: a person who
 * just finished claiming events is already thinking about her identity across them).
 *
 * The dashboard decides whether it renders (`shouldInviteToPage`, account/profile/invite.ts): no
 * page yet, no claim waiting, an event her page could show, not dismissed. It sits where the claim
 * ticket stood, so it arrives the moment Finish settles the ticket away. It is gone once the page is
 * set up (the handle it waits on) or she says Not now, which is remembered on this device.
 *
 * The accent ring marks the one card on the page that is an invitation rather than a fact (the
 * drawn option's own `ring-brand/40`).
 */
export function PageInviteCard() {
  const [dismissed, setDismissed] = useState(false);
  const [pending, startTransition] = useTransition();

  if (dismissed) return null;

  function notNow() {
    // Hidden at once: a dismissal answers instantly, and the cookie write only makes it last.
    setDismissed(true);
    startTransition(async () => {
      const result = await dismissPageInviteAction().catch(() => ({
        ok: false,
      }));
      if (!result.ok) {
        setDismissed(false);
        toast.error("Couldn't hide that just now. Please try again.");
      }
    });
  }

  return (
    <Card data-page-invite className="ring-brand/40">
      <CardHeader>
        <CardTitle>Set up your page</CardTitle>
        <CardDescription>
          Choose what shows before anyone sees it.
        </CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href={PROFILE_SETUP_PATH}>Set up your page</Link>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={notNow}
        >
          Not now
        </Button>
      </CardFooter>
    </Card>
  );
}
