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
import { requireAdmin } from "@/lib/auth/admin-context";
import { accountTierLabel, searchAccounts } from "@/lib/db/queries/accounts";
import { formatBytes } from "@/lib/utils";

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
        <h1 className="text-2xl font-semibold tracking-tight">Accounts</h1>
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
        <div className="divide-y rounded-lg border">
          {accounts.map((account) => (
            <Link
              key={account.id}
              href={`/admin/accounts/${account.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {account.display_name?.trim() || account.email || "(no name)"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {account.email ?? account.id}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                <span>{formatBytes(account.storage_used_bytes)}</span>
                <Badge variant="secondary">
                  {accountTierLabel(account.tier)}
                </Badge>
              </div>
            </Link>
          ))}
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
