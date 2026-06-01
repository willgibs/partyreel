import type { Metadata } from "next";
import {
  Eye,
  HardDrive,
  Images,
  Mail,
  QrCode,
  Users,
  Wallet,
} from "lucide-react";

import { MetricCard } from "@/components/admin/metric-card";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { getPlatformMetrics } from "@/lib/db/queries/metrics";
import { formatBytes } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Metrics" };

// Explicit en-US locale so the number/currency render is deterministic across server + client (no React
// #418 hydration mismatch — that bites only with locale-less toLocaleString).
const num = (n: number) => n.toLocaleString("en-US");
function money(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>
    </section>
  );
}

export default async function AdminMetricsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { accounts, content, engagement, growth, revenue } =
    await getPlatformMetrics();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Metrics</h1>
        <p className="text-sm text-muted-foreground">
          Platform-wide totals across every host and event. New and active count
          the last 30 days.
        </p>
      </div>

      <Section title="Accounts">
        <MetricCard
          label="Accounts"
          value={num(accounts.total)}
          icon={Users}
          sub={`${num(accounts.tierMix.free)} free, ${num(accounts.tierMix.pro)} pro, ${num(accounts.eventPassHolders)} event pass`}
        />
        <MetricCard label="New (30d)" value={num(accounts.newLast30)} />
        <MetricCard label="Active (30d)" value={num(accounts.activeLast30)} />
        <MetricCard
          label="Paid subscribers"
          value={num(accounts.paidSubscribers)}
        />
      </Section>

      <Section title="Content and storage">
        <MetricCard label="Events" value={num(content.events)} icon={Images} />
        <MetricCard
          label="Media"
          value={num(content.media)}
          sub={`${num(content.photos)} photos, ${num(content.videos)} videos`}
        />
        <MetricCard
          label="Storage used"
          value={formatBytes(accounts.totalStorageBytes)}
          icon={HardDrive}
        />
      </Section>

      <Section title="Engagement">
        <MetricCard
          label="QR scans"
          value={num(engagement.qrScans)}
          icon={QrCode}
        />
        <MetricCard
          label="Album views"
          value={num(engagement.albumViews)}
          icon={Eye}
        />
      </Section>

      <Section title="Growth">
        <MetricCard
          label="Newsletter signups"
          value={num(growth.newsletterTotal)}
          icon={Mail}
          sub={
            growth.bySource.length
              ? growth.bySource
                  .map((s) => `${num(s.count)} ${s.source}`)
                  .join(", ")
              : undefined
          }
        />
        <MetricCard
          label="Newsletter (30d)"
          value={num(growth.newsletterLast30)}
        />
        <MetricCard
          label="Emails sent (30d)"
          value={num(growth.emailsLast30)}
        />
      </Section>

      <Section title="Revenue">
        {revenue ? (
          <>
            <MetricCard
              label="MRR"
              value={money(revenue.mrrCents, revenue.currency)}
              icon={Wallet}
              sub={`${num(revenue.activeSubscriptions)} active ${revenue.activeSubscriptions === 1 ? "subscription" : "subscriptions"}`}
            />
            <MetricCard
              label="Balance available"
              value={money(revenue.availableCents, revenue.currency)}
            />
            <MetricCard
              label="Balance pending"
              value={money(revenue.pendingCents, revenue.currency)}
            />
          </>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Revenue unavailable</CardTitle>
              <CardDescription>
                Couldn&rsquo;t reach Stripe just now. Try again shortly.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </Section>
    </div>
  );
}
