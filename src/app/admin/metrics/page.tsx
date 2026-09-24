import type { Metadata } from "next";
import {
  Link as LinkIcon,
  HardDrive,
  Images,
  Mail,
  Users,
  Wallet,
} from "lucide-react";

import { MetricCard } from "@/components/admin/metric-card";
import {
  DistributionChartLazy as DistributionChart,
  TrendChartLazy as TrendChart,
  type DistributionDatum,
  type TrendSeries,
} from "@/components/admin/metrics-charts.lazy";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { getPlatformMetrics } from "@/lib/db/queries/metrics";
import { formatCount } from "@/lib/format/count";
import { formatBytes } from "@/lib/utils";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Metrics" };

// The one count format (`lib/format/count.ts`): en-US grouping, single-sourced, so this page and the
// rest of the admin never disagree on how a number reads.
const num = formatCount;
const plural = (n: number, singular: string) =>
  `${num(n)} ${n === 1 ? singular : `${singular}s`}`;
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

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const SIGNUP_SERIES: TrendSeries[] = [
  { key: "count", label: "Signups", color: "var(--color-brand)" },
];
// ONE HONEST FIGURE (the 1,000-row round's follow-on, 2026-09-24): "album views" retired as its own
// writer when the album got one link (`37707d80`), so a separate line for it had sat flat at zero for
// thirty days beside a "QR scans" that kept climbing. `linkVisits` folds both counts (aggregate.ts),
// matching what the host's own event page already shows for one event.
const ENGAGEMENT_SERIES: TrendSeries[] = [
  { key: "linkVisits", label: "Link visits", color: "var(--color-brand)" },
];

export default async function AdminMetricsPage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const { accounts, content, engagement, growth, revenue } =
    await getPlatformMetrics();

  // Pro is the one bar tinted with the accent (paid emphasis); the rest stay grayscale.
  const tierMixData: DistributionDatum[] = [
    { label: "Free", value: accounts.tierMix.free },
    { label: "Pro", value: accounts.tierMix.pro, color: "var(--color-brand)" },
    {
      label: "Event Pass",
      value: accounts.eventPassHolders,
      color: "var(--color-chart-3)",
    },
  ];
  const mediaTypeData: DistributionDatum[] = [
    { label: "Photos", value: content.photos },
    { label: "Videos", value: content.videos },
  ];
  const sourceData: DistributionDatum[] = growth.bySource.map((s) => ({
    label: s.source,
    value: s.count,
  }));

  return (
    <div className="space-y-8">
      <div>
        <PageHeading>Metrics</PageHeading>
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

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="New signups (30 days)">
          <TrendChart data={accounts.signupTrend} series={SIGNUP_SERIES} />
        </ChartCard>
        <ChartCard title="Tier mix">
          <DistributionChart data={tierMixData} />
        </ChartCard>
      </div>

      <Section title="Content and storage">
        <MetricCard label="Events" value={num(content.events)} icon={Images} />
        <MetricCard
          label="Media"
          value={num(content.media)}
          sub={`${plural(content.photos, "photo")}, ${plural(content.videos, "video")}`}
        />
        <MetricCard
          label="Storage used"
          value={formatBytes(accounts.totalStorageBytes)}
          icon={HardDrive}
        />
      </Section>

      <Section title="Engagement">
        <MetricCard
          label="Link visits"
          value={num(engagement.linkVisits)}
          icon={LinkIcon}
          sub="Every visit to an event's link, scanned or shared, bots filtered"
        />
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Link visits (30 days)">
          <TrendChart data={engagement.trend} series={ENGAGEMENT_SERIES} />
        </ChartCard>
        <ChartCard title="Media by type">
          <DistributionChart data={mediaTypeData} />
        </ChartCard>
      </div>

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

      {sourceData.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Newsletter by source">
            <DistributionChart data={sourceData} />
          </ChartCard>
        </div>
      ) : null}

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
              <CardTitle>Revenue unavailable</CardTitle>
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
