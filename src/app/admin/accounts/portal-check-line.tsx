"use client";

import { use } from "react";

import { Badge } from "@/components/ui/badge";
import { formatCount } from "@/lib/format/count";

import type { PortalCheck } from "./portal-check";
import { NO_READING } from "./uploads";

/**
 * THE CHANGE-PLAN CONFIGURATION'S LINE ON THE ACCOUNTS LIST (credit-watch), streamed: the check asks Stripe (two calls,
 * about half a second), so the page hands it over as a promise and the list draws at once, the line saying it is asking
 * until Stripe answers (`BillingChecks`' Suspense). Quiet when whole, the band's warning naming each price missing or
 * the tag missing, and No reading with why when the check could not run.
 */
export function PortalCheckLine({ check }: { check: Promise<PortalCheck> }) {
  const portal = use(check);
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground">Change plan in Stripe</span>
        <PortalSummary portal={portal} />
      </div>
      <PortalDetail portal={portal} />
    </>
  );
}

/** The line while Stripe is asked: the same row, its answer said to be on its way. */
export function PortalCheckAsking() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-muted-foreground">Change plan in Stripe</span>
      <span role="status" className="text-muted-foreground">
        Asking Stripe…
      </span>
    </div>
  );
}

function PortalSummary({ portal }: { portal: PortalCheck }) {
  switch (portal.state) {
    case "whole":
      return (
        <span className="text-muted-foreground">
          {`Lists all ${formatCount(portal.sold)} Pro prices`}
        </span>
      );
    case "missing":
      return (
        <Badge variant="warning">
          {`${formatCount(portal.missing.length)} of ${formatCount(portal.sold)} missing`}
        </Badge>
      );
    case "no_configuration":
      return <Badge variant="warning">None tagged</Badge>;
    case "unread":
      return <span className="text-destructive">{NO_READING}</span>;
  }
}

function PortalDetail({ portal }: { portal: PortalCheck }) {
  switch (portal.state) {
    case "whole":
      return null;
    case "missing":
      return (
        <p className="text-caption text-muted-foreground">
          {`The tagged configuration (${portal.configurationId}) does not list ${portal.missing
            .map((price) => `${price.label} (${price.priceId})`)
            .join(
              ", ",
            )}. Stripe refuses a switch to ${portal.missing.length === 1 ? "it" : "each"}, a failure the host meets, until the configuration lists ${portal.missing.length === 1 ? "it" : "them"} (PRICING.md, Stripe setup).`}
        </p>
      );
    case "no_configuration":
      return (
        <p className="text-caption text-muted-foreground">
          No active portal configuration carries partyreel_purpose=change_plan
          with subscription updates on, so every switch between Pro plans is
          refused until one does (PRICING.md, Stripe setup).
        </p>
      );
    case "unread":
      return (
        <p className="text-caption break-words text-muted-foreground">
          {portal.message}
        </p>
      );
  }
}
