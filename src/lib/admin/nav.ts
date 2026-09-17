import {
  Activity,
  BarChart3,
  Film,
  Fingerprint,
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
//
// WHICH PART OF THE PORTAL A SURFACE BELONGS TO. Twelve entries in one
// unbroken column is the anonymous list the floating-surfaces board set out to
// kill (Will, `direction=card`, 2026-09-17), and the grouping is a property of
// the SURFACE, not of the menu drawing it: it lives here so the menu never has
// to hold a second copy of this list to know what goes where.
export type NavGroup =
  | "Watching"
  | "Inboxes"
  | "Accounts and content"
  | "Operations";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: NavGroup;
};

// The order here is the order the menu draws, groups included: NAV_GROUPS reads
// it rather than declaring a second one.
export const NAV: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    icon: LayoutDashboard,
    group: "Watching",
  },
  {
    href: "/admin/metrics",
    label: "Metrics",
    icon: BarChart3,
    group: "Watching",
  },
  {
    href: "/admin/support",
    label: "Support",
    icon: LifeBuoy,
    group: "Inboxes",
  },
  {
    href: "/admin/applicants",
    label: "Applicants",
    icon: Users,
    group: "Inboxes",
  },
  { href: "/admin/reports", label: "Reports", icon: Flag, group: "Inboxes" },
  {
    href: "/admin/accounts",
    label: "Accounts",
    icon: Wallet,
    group: "Accounts and content",
  },
  {
    href: "/admin/albums",
    label: "Albums",
    icon: Images,
    group: "Accounts and content",
  },
  {
    href: "/admin/reels",
    label: "Reels",
    icon: Film,
    group: "Accounts and content",
  },
  {
    href: "/admin/announcements",
    label: "Announcements",
    icon: Megaphone,
    group: "Operations",
  },
  {
    href: "/admin/forensics",
    label: "Forensics",
    icon: Fingerprint,
    group: "Operations",
  },
  // The backend-job console (admin-portal P8): heartbeats, kill switches, missed-run health.
  { href: "/admin/jobs", label: "Jobs", icon: Activity, group: "Operations" },
  {
    href: "/admin/security",
    label: "Security",
    icon: ShieldCheck,
    group: "Operations",
  },
];

/** NAV as the menu draws it: the groups in first-appearance order, each with its rows. */
export function navGroups(): { group: NavGroup; items: NavItem[] }[] {
  const out: { group: NavGroup; items: NavItem[] }[] = [];
  for (const item of NAV) {
    const last = out.at(-1);
    if (last?.group === item.group) last.items.push(item);
    else out.push({ group: item.group, items: [item] });
  }
  return out;
}

/**
 * Which nav entry is active for a pathname. `/admin` (Overview) is a prefix of every other route, so it
 * matches ONLY exactly; every other entry matches its exact path or a sub-path (so `/admin/accounts/[id]`
 * highlights Accounts, `/admin/albums/[eventId]` highlights Albums). Pure — unit-tested.
 */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}
