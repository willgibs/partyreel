import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Reading } from "@/lib/db/queries/accounts";
import type { StuckCredit } from "@/lib/db/queries/pass-credits";
import { formatCount } from "@/lib/format/count";

import { creditDollars, stuckLine } from "./credits";
import type { PortalCheck } from "./portal-check";
import { NO_READING } from "./uploads";

/**
 * THE ACCOUNTS LIST'S TWO BILLING CHECKS (credit-watch), each read live on the view: every pass-to-Pro credit stuck
 * past its hour, each linked to the account its Retry is on (`queries/pass-credits.ts`), and whether Stripe's
 * change-plan configuration lists every Pro price we sell (`portal-check.ts`). Quiet when whole, the band's warning when
 * something waits on the operator, and No reading, with why, when a check could not run: never a calm line over a
 * reading that was not taken.
 */
export function BillingChecks({
  stuck,
  portal,
}: {
  stuck: Reading<{ total: number; rows: StuckCredit[] }>;
  portal: PortalCheck;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing checks</CardTitle>
        <CardDescription>Read live on each view.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <section aria-label="Pass-to-Pro credits" className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Pass-to-Pro credits</span>
            <StuckSummary stuck={stuck} />
          </div>
          <StuckList stuck={stuck} />
        </section>
        <section aria-label="Change plan in Stripe" className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-muted-foreground">Change plan in Stripe</span>
            <PortalSummary portal={portal} />
          </div>
          <PortalDetail portal={portal} />
        </section>
      </CardContent>
    </Card>
  );
}

function StuckSummary({
  stuck,
}: {
  stuck: Reading<{ total: number; rows: StuckCredit[] }>;
}) {
  if (!stuck.ok) return <span className="text-destructive">{NO_READING}</span>;
  if (stuck.value.total === 0) {
    return <span className="text-muted-foreground">None stuck</span>;
  }
  return (
    <Badge variant="warning">{`${formatCount(stuck.value.total)} stuck`}</Badge>
  );
}

function StuckList({
  stuck,
}: {
  stuck: Reading<{ total: number; rows: StuckCredit[] }>;
}) {
  if (!stuck.ok) {
    return (
      <p className="text-caption break-words text-muted-foreground">
        {stuck.message}
      </p>
    );
  }
  const { total, rows } = stuck.value;
  if (total === 0) return null;
  const more = total - rows.length;
  return (
    <>
      <ul className="space-y-1">
        {rows.map((credit) => (
          <li
            key={credit.stripe_session_id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
          >
            <Link
              href={`/admin/accounts/${credit.profile_id}#credits`}
              prefetch={false}
              className="min-w-0 truncate font-medium hover:underline hover:underline-offset-4"
            >
              {credit.displayName?.trim() || credit.email || credit.profile_id}
            </Link>
            <span className="text-caption text-muted-foreground tabular-nums">
              {`${creditDollars(credit.credit_cents)} · ${stuckLine(credit.kind, credit.since)}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground">
        {more > 0
          ? `And ${formatCount(more)} more, the oldest shown first. `
          : ""}
        Each account&apos;s page has its Retry, which runs the webhook&apos;s
        own credit path for that checkout now.
      </p>
    </>
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
