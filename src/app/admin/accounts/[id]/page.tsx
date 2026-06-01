import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { getAccountDetail } from "@/lib/db/queries/accounts";
import { formatBytes } from "@/lib/utils";

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
        <h1 className="text-2xl font-semibold tracking-tight">
          {profile.display_name?.trim() || profile.email || "Account"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {profile.email ?? profile.id}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Billing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Tier">
            <Badge variant="secondary">{account.tierLabel}</Badge>
          </Row>
          <Row label="Subscription">{subscriptionLabel}</Row>
          {profile.tier_expires_at ? (
            <Row label="Pass expires">
              <span suppressHydrationWarning>
                {new Date(profile.tier_expires_at).toLocaleDateString()}
              </span>
            </Row>
          ) : null}
          {profile.storage_grace_until ? (
            <Row label="Over-cap grace until">
              <span suppressHydrationWarning>
                {new Date(profile.storage_grace_until).toLocaleDateString()}
              </span>
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
          <CardTitle className="text-base">Storage and usage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Active storage">
            {formatBytes(account.activeBytes)} of {capLabel}
          </Row>
          <Row label="Counter (real bytes)">
            {formatBytes(account.storageUsedBytes)}
          </Row>
          <Row label="Events">{account.eventCount}</Row>
          <Row label="Media">{account.mediaCount}</Row>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Created">
            <span suppressHydrationWarning>
              {new Date(profile.created_at).toLocaleString()}
            </span>
          </Row>
          <Row label="Last active">
            <span suppressHydrationWarning>
              {new Date(profile.last_active_at).toLocaleString()}
            </span>
          </Row>
          <Row label="User ID">
            <code className="text-xs">{profile.id}</code>
          </Row>
        </CardContent>
      </Card>
    </div>
  );
}
