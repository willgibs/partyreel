import Link from "next/link";
import { ArrowRight, Flag, ShieldCheck } from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";

// Portal landing. Re-checks authz as its own entry point (the layout already
// gated, but every page re-verifies). The card grid is the nav home; each new
// operational surface (support, accounts, analytics, content) adds a card here.
const SURFACES = [
  {
    href: "/admin/reports",
    icon: Flag,
    title: "Reports",
    description: "Review guest-reported content and act on it.",
  },
  {
    href: "/admin/security",
    icon: ShieldCheck,
    title: "Security",
    description: "Two-factor and portal-access protections.",
  },
];

export default async function AdminHomePage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Operations</h1>
        <p className="text-sm text-muted-foreground">
          Internal tools for running Partyreel. Support, accounts, analytics,
          and content land in upcoming rounds.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {SURFACES.map(({ href, icon: Icon, title, description }) => (
          <Link key={href} href={href} className="group">
            <Card className="h-full transition-colors group-hover:border-foreground/20">
              <CardHeader>
                <div className="mb-1 flex items-center justify-between">
                  <Icon className="size-5 text-muted-foreground" />
                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
