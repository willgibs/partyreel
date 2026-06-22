import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Flag,
  Images,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { countApplicationsByStatus } from "@/lib/db/queries/applications";
import { countOpenReports } from "@/lib/db/queries/reports";
import { countContactByStatus } from "@/lib/db/queries/support";
import { PageHeading } from "@/components/shared/page-heading";

export const dynamic = "force-dynamic";

// Portal landing. Re-checks authz as its own entry point. The card grid is the nav home; the
// badge on each card is the pending-work count (new submissions/applications, open reports).
export default async function AdminHomePage() {
  const ctx = await requireAdmin();
  if (ctx.aal !== "aal2") return null;

  const [newSupport, newApplicants, openReports] = await Promise.all([
    countContactByStatus("new"),
    countApplicationsByStatus("new"),
    countOpenReports(),
  ]);

  const surfaces = [
    {
      href: "/admin/metrics",
      icon: BarChart3,
      title: "Metrics",
      description: "Platform-wide signups, storage, engagement, and revenue.",
      count: 0,
    },
    {
      href: "/admin/support",
      icon: LifeBuoy,
      title: "Support",
      description: "Contact form submissions to triage.",
      count: newSupport,
    },
    {
      href: "/admin/applicants",
      icon: Users,
      title: "Applicants",
      description: "Job applications to review.",
      count: newApplicants,
    },
    {
      href: "/admin/accounts",
      icon: Wallet,
      title: "Accounts",
      description: "Look up host accounts, billing, and storage.",
      count: 0,
    },
    {
      href: "/admin/reports",
      icon: Flag,
      title: "Reports",
      description: "Review guest-reported content and act on it.",
      count: openReports,
    },
    {
      href: "/admin/albums",
      icon: Images,
      title: "Albums",
      description: "Browse recent uploads and remove unsafe media.",
      count: 0,
    },
    {
      href: "/admin/announcements",
      icon: Megaphone,
      title: "Announcements",
      description: "Publish messages to every host's notification bell.",
      count: 0,
    },
    {
      href: "/admin/security",
      icon: ShieldCheck,
      title: "Security",
      description: "Two-factor and portal-access protections.",
      count: 0,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <PageHeading>Operations</PageHeading>
        <p className="text-sm text-muted-foreground">
          Internal tools for running Partyreel. Content and announcements land
          in an upcoming round.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {surfaces.map(({ href, icon: Icon, title, description, count }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/20">
              <CardHeader>
                <div className="mb-1 flex items-center justify-between">
                  <Icon className="size-5 text-muted-foreground" />
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <CardTitle className="flex items-center gap-2 text-base">
                  {title}
                  {count > 0 ? <Badge>{count}</Badge> : null}
                </CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
