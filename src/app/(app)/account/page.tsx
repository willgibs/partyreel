import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountAvatarForm } from "@/components/app/account-avatar-form";
import { AccountSecurityForm } from "@/components/app/account-security-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { hasPassword } from "@/lib/db/queries/account";
import { getProfile } from "@/lib/db/queries/profile";
import { presignAvatarUrl } from "@/lib/r2/avatar-url";

export const metadata: Metadata = { title: "Account" };

// Account settings (ADR-0011). Renders under the (app) gate, so getUser() already ran;
// getProfile re-checks defensively. Next 16: searchParams is a Promise. ?reset=1 arrives
// from the forgot-password flow (after a fresh OTP verify) and forces the Security form
// into "set" mode so the host can pick a new password without knowing the old one.
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const [profile, passwordSet, { reset }] = await Promise.all([
    getProfile(),
    hasPassword(),
    searchParams,
  ]);
  if (!profile) redirect("/login");

  const avatarUrl = await presignAvatarUrl(
    profile.id,
    profile.avatar_updated_at,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground">Manage how you sign in.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>
            Your photo and the email tied to your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccountAvatarForm
            avatarUrl={avatarUrl}
            displayName={profile.display_name}
            email={profile.email}
          />
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Email</p>
            <p className="text-sm text-muted-foreground">
              {profile.email ?? "No email on file"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            {reset === "1"
              ? "Set a new password. You can still sign in with a code or with Google."
              : passwordSet
                ? "Change your password. You can still sign in with a code or with Google."
                : "Add a password so you can sign in with your email and password. Signing in with a code or with Google keeps working too."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccountSecurityForm
            hasPassword={passwordSet}
            resetMode={reset === "1"}
          />
        </CardContent>
      </Card>
    </div>
  );
}
