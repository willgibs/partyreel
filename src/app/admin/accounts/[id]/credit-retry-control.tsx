"use client";

import { useState } from "react";
import { RotateCw } from "lucide-react";

import { retryPassCreditAsOperatorAction } from "@/app/admin/accounts/actions";
import { DestructiveSheet } from "@/components/admin/destructive-sheet";
import { Button } from "@/components/ui/button";

/**
 * What Retry does, one line each: the promise the panel makes before it runs (credit-watch). It is the webhook's own
 * credit path, so each line is the claim's rule, never a second one. Exported for its test.
 */
export function retryTouches(passCount: number): string[] {
  const passes = passCount === 1 ? "the 1 pass" : `the ${passCount} passes`;
  return [
    "Grants the credit as Stripe customer balance only if no grant is on record, looking on Stripe's side first, so it is granted once ever",
    `Converts exactly ${passes} this checkout named into Pro credit, never a pass bought since`,
    "If another checkout of hers credited these passes first, settles this one instead and grants nothing",
    "If a delivery holds the claim right now, does nothing and says so",
  ];
}

/**
 * THE OPERATOR'S RETRY OF A STUCK PASS-TO-PRO CREDIT (credit-watch): drawn beside a credit stuck past its hour on the
 * account's page, it runs the webhook's own path for that checkout (`retryPassCreditAsOperatorAction`). The portal's
 * one confirmation, reversible (nothing is destroyed: it does what the host paid for), lists what it reaches; the
 * credit's line above it says where it stands once it ran, since the page reads it again.
 */
export function CreditRetryControl({
  userId,
  sessionId,
  passCount,
}: {
  userId: string;
  sessionId: string;
  passCount: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCw /> Retry the credit
      </Button>
      <DestructiveSheet
        open={open}
        onOpenChange={setOpen}
        title="Retry this credit?"
        lede="Runs the webhook's own credit path for this checkout now, as a delivery from Stripe would."
        verb="Retry the credit"
        touches={retryTouches(passCount)}
        severity="reversible"
        successMessage="The credit ran. Its line says where it stands now."
        onConfirm={() => retryPassCreditAsOperatorAction(userId, sessionId)}
      />
    </>
  );
}
