import { redirect } from "next/navigation";
import { after } from "next/server";

import { NotificationBell } from "@/components/app/notification-bell";
import { UserMenu } from "@/components/app/user-menu";
import { AppShell } from "@/components/shared/app-shell";
import { ClaimUploadsOnAuth } from "@/components/shared/claim-uploads-on-auth";
import { touchHostActive } from "@/lib/db/mutations/profile";
import { getNotificationData } from "@/lib/db/queries/notifications";
import { getProfileMenu } from "@/lib/db/queries/profile";
import { buildNotifications } from "@/lib/notifications/build";
import { getAvatarUrl } from "@/lib/supabase/avatar-storage";
import { createClient } from "@/lib/supabase/server";

// Auth GATE for the host app. Every route in the (app) group renders inside
// this layout, so this one getUser() check protects all of them at once.
//
// WHY getUser() and never getSession(): getUser() re-validates the JWT with the
// Supabase Auth server; getSession() only decodes the cookie, which a client
// can spoof. The proxy (src/proxy.ts) keeps the cookie fresh but is NOT a
// security boundary — authz is enforced here AND must be re-checked inside every
// Server Function / RPC that touches data (RLS is the real boundary).
//
// WHY login/callback aren't in this group: they live in (auth). If /login sat
// under this gate, an anonymous visitor redirected to /login would re-trigger
// the gate → infinite loop.
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Bump the host's activity clock for free-tier inactivity removal — after the response,
  // throttled, best-effort (never blocks/breaks the gate). Covers sign-in + any host use.
  after(() => touchHostActive(user.id));

  // Derive-on-read notification summary for the bell + the account-menu profile (name + avatar),
  // in parallel — both run on every host page. getProfileMenu is a narrow read (display_name +
  // avatar marker); getAvatarUrl returns null when there's no avatar (the menu shows the
  // initial). The menu shows profiles.display_name (the EDITABLE name), so it matches /account and
  // the guest byline — not user_metadata.
  const [notificationData, menu] = await Promise.all([
    getNotificationData(),
    getProfileMenu(user.id),
  ]);
  const notifications = buildNotifications(notificationData);
  const avatarUrl = await getAvatarUrl(user.id, menu.avatarMarker);

  return (
    <AppShell
      headerActions={
        <>
          <NotificationBell
            items={notifications.items}
            badgeCount={notifications.badgeCount}
          />
          <UserMenu
            email={user.email ?? null}
            displayName={menu.displayName}
            avatarUrl={avatarUrl}
          />
        </>
      }
    >
      {/* Claim this browser's anonymous uploads once a host lands signed-in (loud: the account context).
          Self-guards + self-dedupes; the welcome/name gate lives in the page, not here, so it still fires
          during onboarding. */}
      <ClaimUploadsOnAuth />
      {children}
    </AppShell>
  );
}
