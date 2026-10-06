import Link from "next/link";
import { Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Reading } from "@/lib/db/queries/accounts";
import type { SettleCredit, StuckCredit } from "@/lib/db/queries/pass-credits";
import { formatCount } from "@/lib/format/count";

import { creditDollars, settleLine, stuckLine } from "./credits";
import type { PortalCheck } from "./portal-check";
import { PortalCheckAsking, PortalCheckLine } from "./portal-check-line";
import { NO_READING } from "./uploads";

/**
 * THE ACCOUNTS LIST'S TWO BILLING CHECKS (credit-watch), each read live on the view: every pass-to-Pro credit stuck
 * past its hour, each linked to the account its Retry is on (`queries/pass-credits.ts`), and whether Stripe's
 * change-plan configuration lists every Pro price we sell (`portal-check.ts`), streamed in its own Suspense so Stripe's
 * half second never holds the list. Quiet when whole, the band's warning when something waits on the operator, and No
 * reading, with why, when a check could not run: never a calm line over a reading that was not taken.
 */
export function BillingChecks({
  stuck,
  settle,
  portal,
}: {
  stuck: Reading<{ total: number; rows: StuckCredit[] }>;
  /** The credits only Stripe can settle, inside the month: two credits for one set of passes. */
  settle: Reading<{ total: number; rows: SettleCredit[] }>;
  /** The configuration check, asked when the page began and not awaited: its line streams in when Stripe answers. */
  portal: Promise<PortalCheck>;
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
          <SettleList settle={settle} />
        </section>
        <section aria-label="Change plan in Stripe" className="space-y-1.5">
          <Suspense fallback={<PortalCheckAsking />}>
            <PortalCheckLine check={portal} />
          </Suspense>
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

/**
 * The credits only Stripe can settle (credit-watch's red-team): two credits for one set of passes, which no retry fixes.
 * Said for a month, since nothing records the reversal; quiet when there is none, No reading when the read failed.
 */
function SettleList({
  settle,
}: {
  settle: Reading<{ total: number; rows: SettleCredit[] }>;
}) {
  if (!settle.ok) {
    return (
      <div className="space-y-0.5 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground">To settle in Stripe</span>
          <span className="text-destructive">{NO_READING}</span>
        </div>
        <p className="text-caption break-words text-muted-foreground">
          {settle.message}
        </p>
      </div>
    );
  }
  const { total, rows } = settle.value;
  if (total === 0) return null;
  const more = total - rows.length;
  return (
    <div className="space-y-1 pt-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-muted-foreground">To settle in Stripe</span>
        <Badge variant="warning">{`${formatCount(total)} to settle`}</Badge>
      </div>
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
              {`${creditDollars(credit.credit_cents)} · ${settleLine(credit.kind, credit.since)}`}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-caption text-muted-foreground">
        {more > 0
          ? `And ${formatCount(more)} more, the newest shown first. `
          : ""}
        Two credits for one set of passes: reverse one balance transaction in
        Stripe (her page names the checkout). Each is said for 30 days.
      </p>
    </div>
  );
}
