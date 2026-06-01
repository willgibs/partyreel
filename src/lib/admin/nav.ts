import {
  BarChart3,
  Flag,
  Images,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  ShieldCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

// Single source for the operator nav — the header dropdown ([admin-nav.tsx]) renders these. Each new
// operational surface adds one entry. Canonical /admin/* paths so they resolve on the subdomain + dev.
export type NavItem = { href: string; label: string; icon: LucideIcon };

export const NAV: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/metrics", label: "Metrics", icon: BarChart3 },
  { href: "/admin/support", label: "Support", icon: LifeBuoy },
  { href: "/admin/applicants", label: "Applicants", icon: Users },
  { href: "/admin/accounts", label: "Accounts", icon: Wallet },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/albums", label: "Albums", icon: Images },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
  { href: "/admin/security", label: "Security", icon: ShieldCheck },
];

/**
 * Which nav entry is active for a pathname. `/admin` (Overview) is a prefix of every other route, so it
 * matches ONLY exactly; every other entry matches its exact path or a sub-path (so `/admin/accounts/[id]`
 * highlights Accounts, `/admin/albums/[eventId]` highlights Albums). Pure — unit-tested.
 */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
