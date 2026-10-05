import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/admin-context";
import {
  accountTierLabel,
  readAccountsUploads,
  searchAccounts,
} from "@/lib/db/queries/accounts";
import { readStuckPassCredits } from "@/lib/db/queries/pass-credits";
import { formatAdminDate } from "@/lib/format/admin-time";
import { captureWarning } from "@/lib/observability/sentry";
import { formatBytes } from "@/lib/utils";
import { PageHeading } from "@/components/shared/page-heading";

import { BillingChecks } from "./billing-checks";
import { accountCap, capLabel } from "./cap";
import { checkChangePlanConfiguration, type PortalCheck } from "./portal-check";
import {
  allowanceLabel,
  lapsedBadge,
  lapsedSinceDate,
  NO_READING,
  uploadsState,
  usedLabel,
} from "./uploads";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Accounts" };

/** The configuration check, told to Sentry when it could not run (its line says No reading; nothing else would). */
async function checkedPortal(): Promise<PortalCheck> {
  const check = await checkChangePlanConfiguration();
  if (check.state === "unread") {
    captureWarning(
      "admin",
      "accounts: change-plan configuration check failed",
      {
        message: check.message,
      },
    );
  }
  return check;
}

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { q } = await searchParams;
  // ★ The two billing checks (credit-watch) beside the search, each its own read that never fails the page: the
  // credits stuck past their hour, read with the accounts, and Stripe's change-plan configuration against every Pro
  // price we sell, asked now and NOT awaited (Stripe takes about half a second): its line streams in when it answers.
  const portal = checkedPortal();
  const [accounts, stuck] = await Promise.all([
    searchAccounts(q),
    readStuckPassCredits(),
  ]);
  if (!stuck.ok) {
    captureWarning("admin", "accounts: stuck credits read failed", {
      message: stuck.message,
    });
  }
  // ★ Every listed account's uploads in ONE read (`uploads_windows`, billing-locks: it was one `uploads_used` call a
  // row, 50 a page view), each figure still `uploads_used` asked with her own tier, the function the upload refusals
  // read, so no row can disagree with the refusal it warns of, and a pass holder with no live pass reads lapsed. A
  // failed read answers No reading for the rows it could not read and never fails the page, never a zero.
  const uploads = await readAccountsUploads(accounts);
  const unread = uploads.flatMap((u) => (u.used.ok ? [] : [u.used.message]));
  if (unread.length > 0) {
    captureWarning("admin", "accounts: uploads read failed", {
      unread: unread.length,
      of: accounts.length,
      message: unread[0],
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Accounts</PageHeading>
        <p className="text-sm text-muted-foreground">
          Host accounts: tier, storage, uploads, and billing. Read-only; make
          billing changes in Stripe.
        </p>
      </div>

      <BillingChecks stuck={stuck} portal={portal} />

      {/* Server-rendered GET search (no client JS). */}
      <form method="get" className="flex max-w-md gap-2">
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by email or name"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      {unread.length > 0 ? (
        <p role="alert" className="text-sm text-destructive">
          {`Uploads could not be read for ${unread.length} of ${accounts.length} ${accounts.length === 1 ? "account" : "accounts"} (marked ${NO_READING} in their rows). Check Sentry.`}
        </p>
      ) : null}

      {accounts.length > 0 ? (
        /* An account row carries its numbers, which is what `density=hybrid`
           put in a table: the divide-y stack this replaces gave storage no
           column at all, so the one number an operator opens this page for was
           the one it could not line up. Uploads sit beside storage the same
           way: what the window has used, then the allowance it is held to. */
        <div className="overflow-hidden rounded-float border">
          <Table>
            <TableHeader>
              <TableRow>
                {/* A share of its own: the name cell truncates (`max-w-0`), so left to the table's auto layout the column
                  collapses to the width of its longest word once the numbers beside it grow. */}
                <TableHead className="w-[30%] min-w-36">Account</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Storage</TableHead>
                <TableHead className="text-right">Cap</TableHead>
                <TableHead className="text-right">Uploads</TableHead>
                <TableHead className="text-right">Allowance</TableHead>
                <TableHead className="text-right">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account, index) => {
                // The account's REAL cap (`accountCap`): a Free or pass profile's null column is its
                // tier's own cap, as the over-capacity purge sweep reads it, and only a Pro with none on
                // record is unlimited. Reading every null as unlimited marked no Free account over.
                const cap = accountCap(account.tier, account.storage_cap_bytes);
                const over = cap !== null && account.storage_used_bytes > cap;
                // Her window against her plan's number: `at` is where every next upload is refused until the
                // window turns, and `lapsed` (a pass holder with no live pass) refuses every upload now, so
                // either takes the same warning as an account past its cap.
                const held = uploads[index];
                const state = uploadsState(held);
                const lapsed = state === "lapsed" ? held.lapsed : null;
                return (
                  <TableRow
                    key={account.id}
                    tone={
                      over || state === "at" || state === "lapsed"
                        ? "warning"
                        : undefined
                    }
                  >
                    <TableCell className="max-w-0">
                      {/* The name cell is the door, and the row is not: a `<tr>`
                          is not a reliable containing block for an absolutely
                          positioned overlay, so a whole-row hit area here would
                          be a target that works in one engine and not another. */}
                      <Link
                        href={`/admin/accounts/${account.id}`}
                        prefetch={false}
                        className="block hover:underline hover:underline-offset-4"
                      >
                        <span className="block truncate font-medium">
                          {account.display_name?.trim() ||
                            account.email ||
                            "(no name)"}
                        </span>
                        <span className="block truncate text-caption text-muted-foreground">
                          {account.email ?? account.id}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {accountTierLabel(account.tier)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBytes(account.storage_used_bytes)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground tabular-nums">
                      {capLabel(cap)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap tabular-nums">
                      {state === "unread" ? (
                        <span className="text-destructive">
                          {usedLabel(held)}
                        </span>
                      ) : lapsed ? (
                        // ★ No figure: a lapsed pass's window is no window, and its "0 B" read as room to spare
                        // while every upload was refused. The badge says why (an expiry, or a conversion to Pro
                        // credit whose Pro plan has not landed) and the date since when.
                        <span className="inline-flex items-center justify-end gap-2">
                          <Badge variant="warning">{lapsedBadge(lapsed)}</Badge>
                          {lapsedSinceDate(lapsed)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-end gap-2">
                          {state === "at" ? (
                            <Badge variant="warning">At limit</Badge>
                          ) : null}
                          {usedLabel(held)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground tabular-nums">
                      {allowanceLabel(held)}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap text-muted-foreground">
                      {formatAdminDate(account.last_active_at)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No accounts</CardTitle>
            <CardDescription>
              {q ? `No accounts match that search.` : "No accounts yet."}
            </CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
