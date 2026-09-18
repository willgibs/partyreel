import { Download } from "lucide-react";

import { NAV, type NavItem } from "@/lib/admin/nav";

/**
 * ONE OPERATOR'S DAY, AND EVERY OPTION ON THIS BOARD WEARS IT.
 *
 * The manifest names the day: two backend runs in trouble, nine open support
 * items, three open reports, one account over its cap. Every decision draws the
 * SAME numbers, so a shape is judged on how it handles a real Tuesday rather
 * than on how much data its author happened to give it. Nothing here touches
 * the database: the lab never calls `requireAdmin` and never reads with the
 * service role, so this file is the whole world the previews live in.
 *
 * ★ EVERY TIME IS A PRE-FORMATTED STRING, NEVER A Date. The real admin renders
 * `toLocaleString()` under `suppressHydrationWarning` because the server's
 * timezone and the browser's disagree (React #418, admin-observability.md). A
 * board has no reason to reproduce that trap: the strings below are what the
 * operator would read, fixed, so a capture taken twice is the same capture.
 */

/* ── The backend jobs (the console's four, as /admin/jobs knows them) ────── */

export type JobState = "ok" | "failed" | "missed" | "paused" | "running";

export type JobRow = {
  id: string;
  label: string;
  description: string;
  host: string;
  cadence: string;
  state: JobState;
  /** What the badge says, in the console's own vocabulary. */
  health: string;
  lastRun: string;
  outcome: string;
  reported: string | null;
  note: string | null;
  canRunNow: boolean;
};

export const JOB_ROWS: JobRow[] = [
  {
    id: "purge_cron",
    label: "Purge sweep",
    description:
      "Frees real storage: hard-deletes media past its recoverable tail, orphaned objects, expired passes and the over-capacity lifecycle.",
    host: "Vercel Cron",
    cadence: "Daily, 04:00 UTC",
    state: "failed",
    health: "Last run failed",
    lastRun: "Today, 04:00",
    outcome: "Failed, 41 s",
    reported: "media swept 1,204, objects deleted 0",
    note: "R2 refused 12 keys: AccessDenied on the second prefix.",
    canRunNow: true,
  },
  {
    id: "backup_reconcile",
    label: "Backup reconcile",
    description:
      "The media backup's backstop: copies any event object the real-time queue missed into the locked second bucket.",
    host: "Cloudflare Worker",
    cadence: "Daily, 05:00 UTC",
    state: "missed",
    health: "Overdue",
    lastRun: "Sunday, 05:00",
    outcome: "Failed, 2 min",
    reported: "objects copied 0, listed 8,411",
    note: "Nothing reported since. Two runs have not fired.",
    canRunNow: false,
  },
  {
    id: "backup_prune",
    label: "Backup prune",
    description:
      "Reclaims backup objects whose media is gone from both the database and the primary bucket. The only job that deletes from the last-resort copy.",
    host: "Cloudflare Worker",
    cadence: "Weekly, Mondays 06:00 UTC",
    state: "paused",
    health: "Paused",
    lastRun: "Monday, 06:00",
    outcome: "Skipped, 0.2 s",
    reported: "dry run true",
    note: "Held off until launch, on purpose.",
    canRunNow: false,
  },
  {
    id: "db_backup",
    label: "Database backup",
    description:
      "The off-site Postgres dump into the locked backup bucket. Survives a whole account loss, and the media backup is worthless without the rows.",
    host: "GitHub Actions",
    cadence: "Daily, 06:00 UTC",
    state: "ok",
    health: "Healthy",
    lastRun: "Today, 06:00",
    outcome: "Succeeded, 52 s",
    reported: "dump 412 MB, tables 31",
    note: null,
    canRunNow: false,
  },
];

export type RunRow = {
  started: string;
  job: string;
  outcome: "Succeeded" | "Failed" | "Skipped" | "Running";
  trigger: "Schedule" | "Manual";
  took: string;
  note: string;
};

/** The last eight runs, newest first: the two failures are the day's news. */
export const RUN_ROWS: RunRow[] = [
  {
    started: "Today, 06:00",
    job: "Database backup",
    outcome: "Succeeded",
    trigger: "Schedule",
    took: "52 s",
    note: "412 MB",
  },
  {
    started: "Today, 04:00",
    job: "Purge sweep",
    outcome: "Failed",
    trigger: "Schedule",
    took: "41 s",
    note: "R2 AccessDenied on 12 keys",
  },
  {
    started: "Yesterday, 06:00",
    job: "Database backup",
    outcome: "Succeeded",
    trigger: "Schedule",
    took: "49 s",
    note: "408 MB",
  },
  {
    started: "Yesterday, 04:00",
    job: "Purge sweep",
    outcome: "Succeeded",
    trigger: "Schedule",
    took: "1.2 min",
    note: "1,180 swept",
  },
  {
    started: "Monday, 06:00",
    job: "Backup prune",
    outcome: "Skipped",
    trigger: "Schedule",
    took: "0.2 s",
    note: "Paused",
  },
  {
    started: "Sunday, 05:00",
    job: "Backup reconcile",
    outcome: "Failed",
    trigger: "Schedule",
    took: "2 min",
    note: "Queue unreachable",
  },
  {
    started: "Sunday, 04:00",
    job: "Purge sweep",
    outcome: "Succeeded",
    trigger: "Manual",
    took: "58 s",
    note: "962 swept",
  },
  {
    started: "Saturday, 06:00",
    job: "Database backup",
    outcome: "Succeeded",
    trigger: "Schedule",
    took: "47 s",
    note: "401 MB",
  },
];

/* ── The support inbox (nine open, as /admin/support reads them) ─────────── */

export type SupportRow = {
  id: string;
  name: string;
  email: string;
  topic: string;
  subject: string;
  message: string;
  received: string;
  waiting: string;
  status: "New" | "In progress" | "Closed";
};

export const SUPPORT_ROWS: SupportRow[] = [
  {
    id: "s1",
    name: "Marta Oyelaran",
    email: "marta.oyelaran@example.com",
    topic: "Billing",
    subject: "Charged twice for the same event pass",
    message:
      "Hi, I bought a pass for our reception on Friday and the card shows two charges of the same amount a minute apart. Only one pass appears on the event. Could you refund the second one? Happy to send the statement.",
    received: "Today, 09:14",
    waiting: "5h",
    status: "New",
  },
  {
    id: "s2",
    name: "Devon Pryce",
    email: "devon@pryce.studio",
    topic: "Uploads",
    subject: "Guests on older phones cannot upload video",
    message:
      "Photos go up fine but two guests with older iPhones got stuck at 90 percent on video every time. They tried both Safari and Chrome. Is there a size limit we should be telling people about?",
    received: "Today, 08:02",
    waiting: "6h",
    status: "New",
  },
  {
    id: "s3",
    name: "Aiko Tanaka",
    email: "aiko.tanaka@example.com",
    topic: "Account",
    subject: "Cannot sign in after changing my email",
    message:
      "I changed the address on my account last night and now the sign-in link goes to the old inbox, which I no longer have. Is there a way to move me across?",
    received: "Today, 07:41",
    waiting: "7h",
    status: "New",
  },
  {
    id: "s4",
    name: "Priya Raghunathan",
    email: "priya.r@example.org",
    topic: "Privacy",
    subject: "Guest asked us to remove their photos",
    message:
      "One of our guests would like every photo they appear in taken down. I can find some of them but not all. What is the right way to handle this?",
    received: "Yesterday, 19:55",
    waiting: "19h",
    status: "New",
  },
  {
    id: "s5",
    name: "Tomas Berg",
    email: "tomas.berg@example.com",
    topic: "Billing",
    subject: "Do you invoice, or card only?",
    message:
      "Our events team needs an invoice with a purchase order number on it. Can you do that on the Pro plan, or is it card only?",
    received: "Yesterday, 16:30",
    waiting: "22h",
    status: "New",
  },
  {
    id: "s6",
    name: "Grace Whitlock",
    email: "grace@whitlockevents.co",
    topic: "Uploads",
    subject: "QR code will not scan on the printed cards",
    message:
      "We printed 200 table cards and about a third of them will not scan. The rest are fine. Could the print be too small, and what size do you recommend?",
    received: "Yesterday, 14:08",
    waiting: "1d",
    status: "New",
  },
  {
    id: "s7",
    name: "Samir Haddad",
    email: "samir.haddad@example.com",
    topic: "Account",
    subject: "Transfer an event to a colleague",
    message:
      "I am leaving the company and my colleague needs to own the album. Can an event move to another account without losing the uploads?",
    received: "Monday, 11:20",
    waiting: "2d",
    status: "New",
  },
  {
    id: "s8",
    name: "Elena Costa",
    email: "elena.costa@example.net",
    topic: "Press",
    subject: "Press enquiry about the launch",
    message:
      "I write for a small events trade title and would like to cover how guest-powered albums work. Who is the right person to speak to?",
    received: "Monday, 09:02",
    waiting: "2d",
    status: "New",
  },
  {
    id: "s9",
    name: "Owen Delacroix",
    email: "owen.d@example.com",
    topic: "Privacy",
    subject: "What happens to our photos if we cancel?",
    message:
      "We are deciding between plans and the team wants to know exactly what happens to the album if we stop paying. Is there a grace period?",
    received: "Sunday, 21:44",
    waiting: "3d",
    status: "New",
  },
];

/* ── The accounts list (one over cap, as /admin/accounts reads it) ───────── */

export type AccountRow = {
  id: string;
  name: string;
  email: string;
  tier: "Free" | "Pro" | "Studio";
  used: string;
  cap: string;
  /** Share of the cap, 0 to 1.2, for the meter. */
  fill: number;
  events: number;
  billing: string;
  overCap?: true;
};

export const ACCOUNT_ROWS: AccountRow[] = [
  {
    id: "a1",
    name: "Whitlock Events",
    email: "grace@whitlockevents.co",
    tier: "Pro",
    used: "214 GB",
    cap: "200 GB",
    fill: 1.07,
    events: 18,
    billing: "Active",
    overCap: true,
  },
  {
    id: "a2",
    name: "Marta Oyelaran",
    email: "marta.oyelaran@example.com",
    tier: "Pro",
    used: "118 GB",
    cap: "200 GB",
    fill: 0.59,
    events: 4,
    billing: "Active",
  },
  {
    id: "a3",
    name: "Devon Pryce",
    email: "devon@pryce.studio",
    tier: "Studio",
    used: "902 GB",
    cap: "2 TB",
    fill: 0.44,
    events: 61,
    billing: "Active",
  },
  {
    id: "a4",
    name: "Aiko Tanaka",
    email: "aiko.tanaka@example.com",
    tier: "Free",
    used: "1.8 GB",
    cap: "2 GB",
    fill: 0.9,
    events: 1,
    billing: "None",
  },
  {
    id: "a5",
    name: "Tomas Berg",
    email: "tomas.berg@example.com",
    tier: "Free",
    used: "0.4 GB",
    cap: "2 GB",
    fill: 0.2,
    events: 1,
    billing: "None",
  },
  {
    id: "a6",
    name: "Samir Haddad",
    email: "samir.haddad@example.com",
    tier: "Pro",
    used: "77 GB",
    cap: "200 GB",
    fill: 0.39,
    events: 9,
    billing: "Past due",
  },
];

/* ── What is waiting, as one ranked queue (the console home reads this) ──── */

export type QueueKind = "job" | "account" | "report" | "support" | "applicant";

export type QueueItem = {
  id: string;
  kind: QueueKind;
  /** ok, warn or fail: the row's own severity, before any colour policy. */
  level: "fail" | "warn" | "info";
  what: string;
  detail: string;
  waiting: string;
  action: string;
  href: string;
};

/**
 * WORST FIRST, AND THE ORDER IS THE WHOLE IDEA. A card grid sorts by surface,
 * which is a fact about the portal; this sorts by what it costs to ignore,
 * which is a fact about the day. Storage that is silently not being reclaimed
 * outranks a press enquiry, and no grid can say so.
 */
export const QUEUE: QueueItem[] = [
  {
    id: "q1",
    kind: "job",
    level: "fail",
    what: "Purge sweep failed",
    detail: "R2 refused 12 keys, so no storage was reclaimed today",
    waiting: "10h",
    action: "Open the console",
    href: "/admin/jobs",
  },
  {
    id: "q2",
    kind: "job",
    level: "fail",
    what: "Backup reconcile is overdue",
    detail: "Two runs have not fired since Sunday",
    waiting: "2d",
    action: "Open the console",
    href: "/admin/jobs",
  },
  {
    id: "q3",
    kind: "report",
    level: "warn",
    what: "3 reports are open",
    detail: "Oldest was filed on Sunday evening",
    waiting: "3d",
    action: "Review",
    href: "/admin/reports",
  },
  {
    id: "q4",
    kind: "account",
    level: "warn",
    what: "Whitlock Events is over its cap",
    detail: "214 GB against a 200 GB Pro cap, uploads are blocked",
    waiting: "1d",
    action: "Open the account",
    href: "/admin/accounts",
  },
  {
    id: "q5",
    kind: "support",
    level: "info",
    what: "9 support messages are unanswered",
    detail: "Oldest has been waiting three days",
    waiting: "3d",
    action: "Open the inbox",
    href: "/admin/support",
  },
  {
    id: "q6",
    kind: "applicant",
    level: "info",
    what: "2 applications are unread",
    detail: "Both for the same listing",
    waiting: "4d",
    action: "Open the inbox",
    href: "/admin/applicants",
  },
];

/* ── The numbers (what /admin/metrics reads) ─────────────────────────────── */

export const KPIS = [
  { label: "Hosts", value: "1,084", sub: "+37 this week" },
  { label: "Events", value: "3,910", sub: "212 live now" },
  { label: "Storage in use", value: "4.1 TB", sub: "of 9.4 TB paid for" },
  { label: "Monthly revenue", value: "$2,340", sub: "+$180 this month" },
];

/** Fourteen days of scans and album views, for the trend on the metrics card. */
export const TREND = Array.from({ length: 14 }, (_, i) => {
  const day = `2026-09-${String(2 + i).padStart(2, "0")}`;
  const scans = 120 + Math.round(40 * Math.sin(i / 2.3) + i * 6);
  const views = 70 + Math.round(24 * Math.sin(i / 2.3 + 1) + i * 4);
  return { day, scans, views };
});

/** The tier mix, for the distribution on the metrics card. */
/**
 * ★ THE NUMBERS ADD UP TO THE HOSTS FIGURE, AND THEY STAY UNDER A THOUSAND.
 * `DistributionChart` hard-codes its Y axis at 28 px wide, so a four-digit
 * tick renders as its last three characters (measured on the first capture
 * pass: a 902 bar put a "1000" tick on screen as "000"). That is a production
 * defect in `src/components/admin/metrics-charts.tsx`, flagged in the handoff
 * rather than patched from this lane; the mix is picked to stay clear of it so
 * a clipped axis never distracts from the question being asked.
 */
export const TIER_MIX = [
  { label: "Free", value: 702 },
  { label: "Pro", value: 318 },
  { label: "Studio", value: 64 },
];

/* ── The portal's surfaces, as the nav and the card grid know them ───────── */

/**
 * THE TWELVE, JOINED TO THE PRODUCTION NAV RATHER THAN RETYPED. `NAV`
 * (`src/lib/admin/nav.ts`) owns the order, the labels, the four groups and the
 * icons; this file adds the only two things a board needs and a single source
 * has no business holding: what is pending today, and the one line a card in
 * the grid shows.
 */
type Extra = { count: number; blurb: string };

const EXTRA: Record<string, Extra> = {
  "/admin": { count: 0, blurb: "Everything waiting on you, worst first." },
  "/admin/metrics": {
    count: 0,
    blurb: "Signups, storage, engagement and revenue.",
  },
  "/admin/support": { count: 9, blurb: "Contact form submissions to triage." },
  "/admin/applicants": { count: 2, blurb: "Job applications to review." },
  "/admin/reports": { count: 3, blurb: "Guest-reported content to act on." },
  "/admin/accounts": { count: 1, blurb: "Host accounts, billing and storage." },
  "/admin/albums": {
    count: 0,
    blurb: "Recent uploads, and the remove control.",
  },
  "/admin/reels": { count: 0, blurb: "Render queue and its kill switch." },
  "/admin/announcements": {
    count: 0,
    blurb: "Publish to every host's notification bell.",
  },
  "/admin/forensics": {
    count: 0,
    blurb: "Legal holds and evidence preservation.",
  },
  "/admin/jobs": {
    count: 2,
    blurb: "Every backend job, its runs and its switch.",
  },
  "/admin/security": { count: 0, blurb: "Two-factor and portal access." },
};

export type NavEntry = NavItem & Extra;

export const SURFACES: NavEntry[] = NAV.map((n) => ({
  ...n,
  ...(EXTRA[n.href] ?? { count: 0, blurb: "" }),
}));

/**
 * ★ THE HOME'S GRID AND THE NAV DISAGREE IN PRODUCTION, and the board draws
 * that rather than tidying it away. `src/app/admin/page.tsx` shows nine cards
 * including Exports, which has no nav entry at all; the nav shows Reels,
 * Forensics and Jobs, which have no card. So an operator's two ways of finding
 * a surface list two different portals, and three of the twelve are reachable
 * only from a menu. The grid option below is those nine, exactly.
 */
export const HOME_CARDS: NavEntry[] = [
  ...[
    "/admin/metrics",
    "/admin/support",
    "/admin/applicants",
    "/admin/accounts",
    "/admin/reports",
    "/admin/albums",
    "/admin/announcements",
  ].map((href) => SURFACES.find((s) => s.href === href)!),
  {
    href: "/admin/exports",
    label: "Exports",
    icon: Download,
    group: "Operations",
    count: 0,
    blurb: "Recent album downloads and the download kill switch.",
  },
  SURFACES.find((s) => s.href === "/admin/security")!,
];

/** The four groups in first-appearance order, each with its rows. */
export function surfaceGroups(): { group: string; items: NavEntry[] }[] {
  const out: { group: string; items: NavEntry[] }[] = [];
  for (const item of SURFACES) {
    const last = out.at(-1);
    if (last?.group === item.group) last.items.push(item);
    else out.push({ group: item.group, items: [item] });
  }
  return out;
}

/** What the header bell counts today. */
export const ALERTS = { support: 9, applicants: 2, reports: 3 };

export const OPERATOR = "partyr33l@gmail.com";
