import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireAdmin } from "@/lib/auth/admin-context";
import { PageHeading } from "@/components/shared/page-heading";

export const metadata: Metadata = { title: "Security" };

// Reaching this page means the layout's AAL2 gate passed, so two-factor is active.
// For now it's an informational status + the break-glass recovery note; richer
// factor management (reset, recovery codes) can land later.
export default async function SecurityPage() {
  const ctx = await requireAdmin();

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <PageHeading>Security</PageHeading>
        <p className="text-sm text-muted-foreground">
          Account protections for the operations portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-foreground" />
            <CardTitle className="text-base">
              Two-factor authentication
            </CardTitle>
          </div>
          <CardDescription>
            Required for portal access, and active on{" "}
            {ctx.email ?? "your account"}.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Lost your authenticator? An owner can remove the factor from the
          Supabase dashboard (Authentication, then Users, then your account,
          then MFA). You will re-enroll on the next sign-in.
        </CardContent>
      </Card>
    </div>
  );
}
