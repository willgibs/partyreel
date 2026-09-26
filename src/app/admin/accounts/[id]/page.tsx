import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { getAccountDetail } from "@/lib/db/queries/accounts";
import { getAccountDeletionState } from "@/lib/lifecycle/account-deletion";
import { formatAdminDate, formatAdminTimestamp } from "@/lib/format/admin-time";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";
import { PageHeading } from "@/components/shared/page-heading";
import { DeleteAccountControl } from "./delete-account-control";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Account" };

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

export default async function AdminAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { id } = await params;
  const account = await getAccountDetail(id);
  if (!account) notFound();
  const deletion = await getAccountDeletionState(id);

  const { profile } = account;
  const capLabel =
    account.effectiveCapBytes === null
      ? "Unlimited"
      : formatBytes(account.effectiveCapBytes);
  const subscriptionLabel = account.hasSubscription
    ? "Active subscription"
    : profile.tier === "event_pass"
      ? "Event Pass"
      : "None";

  return (
    <div className="max-w-2xl space-y-6">
      <Link
        href="/admin/accounts"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Accounts
      </Link>

      <div>
        <PageHeading>
          {profile.display_name?.trim() || profile.email || "Account"}
        </PageHeading>
        <p className="text-sm text-muted-foreground">
          {profile.email ?? profile.id}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Tier">
            <Badge variant="secondary">{account.tierLabel}</Badge>
          </Row>
          <Row label="Subscription">{subscriptionLabel}</Row>
          {profile.tier_expires_at ? (
            <Row label="Pass expires">
              <span>{formatAdminDate(profile.tier_expires_at)}</span>
            </Row>
          ) : null}
          {profile.storage_grace_until ? (
            <Row label="Over-cap grace until">
              <span>{formatAdminDate(profile.storage_grace_until)}</span>
            </Row>
          ) : null}
          <Row label="Stripe">
            {account.stripeCustomerUrl ? (
              <a
                href={account.stripeCustomerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-foreground underline"
              >
                View customer
                <ExternalLink className="size-3.5" />
              </a>
            ) : (
              "No customer"
            )}
          </Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage and usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Active storage">
            {formatBytes(account.activeBytes)} of {capLabel}
          </Row>
          <Row label="Counter (real bytes)">
            {formatBytes(account.storageUsedBytes)}
          </Row>
          <Row label="Events">{formatCount(account.eventCount)}</Row>
          <Row label="Media">{formatCount(account.mediaCount)}</Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Created">
            <span>{formatAdminTimestamp(profile.created_at)}</span>
          </Row>
          <Row label="Last active">
            <span>{formatAdminTimestamp(profile.last_active_at)}</span>
          </Row>
          <Row label="User ID">
            <code className="rounded bg-muted px-1.5 py-0.5 font-sans text-xs tabular-nums select-all">
              {profile.id}
            </code>
          </Row>
        </CardContent>
      </Card>

      {/* The operator half of self-serve deletion: for the person who writes in
          from an address they can no longer sign in with, and for a takedown
          that ends in closing the account. Once requested there is no trigger
          left to press, only the state, because deletion has no undo. */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-destructive">
            {deletion.requestedAt ? "Deletion in progress" : "Delete account"}
          </CardTitle>
          <CardDescription>
            {deletion.requestedAt
              ? "The profile is anonymised and the account cannot sign in. The purge cron finishes the hard delete."
              : "Immediate and permanent, exactly as if the account holder had done it themselves."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {deletion.requestedAt ? (
            <>
              <Row label="Requested">
                <span>{formatAdminTimestamp(deletion.requestedAt)}</span>
              </Row>
              <Row label="Events left to purge">
                {formatCount(deletion.eventCount)}
              </Row>
              {deletion.heldEventCount > 0 && (
                <Row label="Blocked by a legal hold">
                  <Badge variant="secondary">
                    {formatCount(deletion.heldEventCount)}
                  </Badge>
                </Row>
              )}
              {deletion.eventCount === 0 && (
                <p className="text-muted-foreground">
                  Nothing left to purge. The next run removes the sign-in
                  record.
                </p>
              )}
            </>
          ) : (
            <DeleteAccountControl
              userId={profile.id}
              identifier={profile.email ?? profile.id}
              eventCount={deletion.eventCount}
              heldEventCount={deletion.heldEventCount}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
