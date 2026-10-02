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
 *
 * ★ `/me` WEARS IT STANDING (`dismissible={false}`, crumbs-46). An account with no handle keeps her
 * uploads, likes and connections at /me, and the user menu's Your profile opens it, so the invitation
 * there is the one way from that page to the setup: a Not now would take it away from the page she
 * chose to open, and, being the dashboard's cookie, would hide the dashboard's too. The setup's button
 * stays where the dashboard's points (it does not go through /me: the card IS the invitation, and a
 * stop on the way would be the tap crumbs-44 took out of the menu's door).
 */
export function PageInviteCard({
  dismissible = true,
}: {
  /** False: no Not now, so the card stands wherever it is drawn. */
  dismissible?: boolean;
}) {
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
        <CardDescription>Nothing shows until you finish.</CardDescription>
      </CardHeader>
      <CardFooter className="flex-wrap gap-2">
        {/* ★ THE BUTTON CARRIES THE REASON (crumbs-44, from `profile-setup`): it repeated the
            title, so the card said "Set up your page" twice and why never. Choosing what shows is
            what the setup is for, and the line above is the promise that makes pressing it safe. */}
        <Button asChild size="sm">
          <Link href={PROFILE_SETUP_PATH}>Choose what shows</Link>
        </Button>
        {dismissible && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={notNow}
          >
            Not now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
