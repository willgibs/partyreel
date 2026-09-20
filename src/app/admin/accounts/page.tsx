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
import { accountTierLabel, searchAccounts } from "@/lib/db/queries/accounts";
import { formatBytes } from "@/lib/utils";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Accounts" };

export default async function AdminAccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { q } = await searchParams;
  const accounts = await searchAccounts(q);

  return (
    <div className="space-y-6">
      <div>
        <PageHeading>Accounts</PageHeading>
        <p className="text-sm text-muted-foreground">
          Host accounts: tier, storage, and billing. Read-only; make billing
          changes in Stripe.
        </p>
      </div>

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

      {accounts.length > 0 ? (
        /* An account row carries five numbers, which is what `density=hybrid`
           put in a table: the divide-y stack this replaces gave storage no
           column at all, so the one number an operator opens this page for was
           the one it could not line up. */
        <div className="overflow-hidden rounded-float border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead className="text-right">Storage</TableHead>
                <TableHead className="text-right">Cap</TableHead>
                <TableHead className="text-right">Last seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                // A null cap is Pro's unlimited, never a cap of zero: the
                // over-capacity purge sweep reads it the same way.
                const cap = account.storage_cap_bytes;
                const over = cap !== null && account.storage_used_bytes > cap;
                return (
                  <TableRow
                    key={account.id}
                    tone={over ? "warning" : undefined}
                  >
                    <TableCell className="max-w-0">
                      {/* The name cell is the door, and the row is not: a `<tr>`
                          is not a reliable containing block for an absolutely
                          positioned overlay, so a whole-row hit area here would
                          be a target that works in one engine and not another. */}
                      <Link
                        href={`/admin/accounts/${account.id}`}
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
                      {cap === null ? "Unlimited" : formatBytes(cap)}
                    </TableCell>
                    <TableCell
                      suppressHydrationWarning
                      className="text-right whitespace-nowrap text-muted-foreground"
                    >
                      {new Date(account.last_active_at).toLocaleDateString()}
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
