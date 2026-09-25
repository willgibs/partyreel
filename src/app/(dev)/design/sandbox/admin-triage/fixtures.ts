import { marketingImage } from "@/lib/constants/marketing-media";
import { NAV, type NavItem } from "@/lib/admin/nav";

/**
 * ONE OPERATOR'S SATURDAY NIGHT, AND EVERY OPTION ON THIS BOARD WEARS IT.
 *
 * Three reports are open and four are closed, which is the same Tuesday the
 * `admin` board draws (`ALERTS.reports = 3`) moved to the hour a wedding is
 * actually running. Every decision below draws the SAME seven rows, so a shape
 * is judged on how it handles a real queue rather than on how much data its
 * author happened to give it. The fourth closed report (boards refresh,
 * 2026-09-24) is a removal several days old, neither "Yesterday" nor held: the
 * one row that tells `closed`'s 24-hour Undo and its 30-day `window` apart.
 *
 * ★ NOTHING HERE TOUCHES THE DATABASE. The lab never calls `requireAdmin`,
 * never reads with the service role and never presigns: a reported frame is a
 * `MARKETING_IMAGES` still like every other board's picture. So the pictures are
 * all lovely, which is the one thing a fixture cannot fake. Judge the SIZE and
 * the PLACE of the reported frame, never its content: the real one is whatever
 * a stranger flagged at eleven at night.
 *
 * ★ EVERY TIME IS A PRE-FORMATTED STRING, NEVER A Date. The real admin renders
 * `toLocaleString()` under `suppressHydrationWarning` because the server's
 * timezone and the browser's disagree (React #418, admin-observability.md).
 * A board has no reason to reproduce that trap, and a capture taken twice is
 * then the same capture.
 *
 * ★ AND THE IDS ARE REAL-SHAPED. A media id is a v4 UUID because the whole
 * `escalate` decision is about what it costs to move one from a report to the
 * forensics form: shortening it here would draw the problem smaller than it is.
 */

export type ReportStatus = "open" | "dismissed" | "actioned";

export type ReportRow = {
  /** The `reports` row id. Nothing renders it today. */
  id: string;
  /** The event's name, which is the card's title today. */
  event: string;
  /** The host who owns the album, which no surface shows on a report at all. */
  host: string;
  /** What the operator reads as the age of the report. */
  when: string;
  /** Exactly what the card says today: "item reported" or "album reported". */
  scope: "item" | "album";
  /** The reported frame, or null on an album-level report. */
  media: { id: string; image: string; type: "photo" | "video" } | null;
  /** The optional reason, capped at 2,000 characters by `reportSchema`. */
  reason: string | null;
  status: ReportStatus;
  /** Set on a closed report only. */
  resolved: { when: string; by: string; note: string | null } | null;
  /** True where a legal hold was set from this report (trust-safety-forensics.md). */
  held?: true;
};

export const REPORTS: ReportRow[] = [
  {
    id: "8d2f0b14-6a37-4c51-9f0e-2b7a41c9de83",
    event: "Hannah and Theo",
    host: "maya.whitlock@gmail.com",
    when: "Tonight, 22:41",
    scope: "item",
    media: {
      id: "c47d91a2-5e08-4b6f-8a13-0d5f7e2c9481",
      image: "wedding-toast",
      type: "photo",
    },
    reason:
      "That's my daughter in the background and she is twelve. Please take it down, I don't know the person who posted it and nobody asked us.",
    status: "open",
    resolved: null,
  },
  {
    id: "1f6c3a87-9d24-40be-b5c7-83a1e0f4d726",
    event: "Riverside Summer Party",
    host: "sam@riversideclub.co",
    when: "Tonight, 21:08",
    scope: "album",
    media: null,
    reason: null,
    status: "open",
    resolved: null,
  },
  {
    id: "4b9e57d0-2c16-4a83-a7f1-6e30b8c5d294",
    event: "Priya and Dev",
    host: "priya.n@outlook.com",
    when: "Tonight, 20:15",
    scope: "item",
    media: {
      id: "a05b6f39-71c4-4d2e-9b80-3f1a8e6c4057",
      image: "party-dj",
      type: "video",
    },
    reason: "wrong event",
    status: "open",
    resolved: null,
  },
  {
    id: "62a18e4c-0b73-49df-8c25-5d9f7a3b1e60",
    event: "Okafor Reunion",
    host: "chidi.okafor@gmail.com",
    when: "Yesterday, 19:52",
    scope: "item",
    media: {
      id: "e938c701-4a5d-4f18-b62c-71e0d4a9b385",
      image: "reception-table",
      type: "photo",
    },
    reason: "Someone has posted a photo of a receipt with a card number on it.",
    status: "actioned",
    resolved: {
      when: "Yesterday, 20:06",
      by: "partyr33l@gmail.com",
      note: "Card number legible in the frame. Removed, host not contacted.",
    },
  },
  {
    id: "9c4e1a72-6f83-4b09-bd2e-1a5d8f3c6e91",
    event: "Marlow Christening",
    host: "j.marlow@fastmail.com",
    when: "15 September, 09:10",
    scope: "item",
    media: {
      id: "b81f4d3a-9c27-4e56-8b0a-5f2d7c1e8963",
      image: "party-balloons",
      type: "photo",
    },
    reason: "This is my ex, please take it down.",
    status: "actioned",
    resolved: {
      when: "15 September, 09:24",
      by: "partyr33l@gmail.com",
      note: "Removed at the requester's ask, not a safety report.",
    },
  },
  {
    id: "d70f2b95-8e41-4c06-9a37-b5c82e1d6f49",
    event: "Lakeside Gala",
    host: "events@lakesidegala.org",
    when: "Thursday, 11:20",
    scope: "album",
    media: null,
    reason: "this whole album is spam",
    status: "dismissed",
    resolved: {
      when: "Thursday, 11:44",
      by: "partyr33l@gmail.com",
      note: null,
    },
  },
  {
    id: "af30c682-15b9-4e7d-8f24-9a6c0b3e5d17",
    event: "Northgate Formal",
    host: "office@northgate.sch.uk",
    when: "8 September, 23:37",
    scope: "item",
    media: {
      id: "7c2e4a86-3f09-4b51-a8d7-206e9c1f5b34",
      image: "festival-crowd",
      type: "photo",
    },
    reason:
      "There is a photo of a minor in here that should not be public. I have reported it to the school as well.",
    status: "actioned",
    resolved: {
      when: "8 September, 23:49",
      by: "partyr33l@gmail.com",
      note: "Held and preserved. CyberTipline reference on file.",
    },
    held: true,
  },
];

export const OPEN_REPORTS = REPORTS.filter((r) => r.status === "open");
export const CLOSED_REPORTS = REPORTS.filter((r) => r.status !== "open");

/** The still a reported frame draws. Throws on a typo rather than drawing a gap. */
export const frameOf = (row: ReportRow) =>
  row.media ? marketingImage(row.media.image) : null;

/* ── The siblings in the same nav group (the `one-idiom` decision) ───────── */

export type InboxKind = "report" | "support" | "applicant";

export type InboxRow = {
  kind: InboxKind;
  /** The heading the surface puts first today. */
  who: string;
  when: string;
  /** The one line of it a row can hold. */
  line: string;
  /** The status in that surface's OWN vocabulary, which is the whole finding. */
  status: string;
};

/**
 * ★ THREE VOCABULARIES FOR ONE NAV GROUP, drawn rather than described.
 * Support and Applicants run on `TRIAGE_STATUSES` (New, In progress, Closed)
 * through the shared `TriageStatusControl`; Reports hand-rolls Open, Reviewed,
 * Dismissed, Actioned with an Open/All filter; Albums next door hand-rolls a
 * fifth set. The rows below carry the word each surface would really show.
 */
export const INBOX: InboxRow[] = [
  {
    kind: "report",
    who: "Hannah and Theo",
    when: "22:41",
    line: "That's my daughter in the background and she is twelve.",
    status: "Open",
  },
  {
    kind: "support",
    who: "Elena Marsh",
    when: "22:02",
    line: "My guests can't upload, the code just spins on their phones.",
    status: "New",
  },
  {
    kind: "report",
    who: "Riverside Summer Party",
    when: "21:08",
    line: "No reason provided.",
    status: "Open",
  },
  {
    kind: "applicant",
    who: "Tobias Reiner",
    when: "20:44",
    line: "Applying for the Founding Designer role, portfolio attached.",
    status: "New",
  },
  {
    kind: "report",
    who: "Priya and Dev",
    when: "20:15",
    line: "wrong event",
    status: "Open",
  },
  {
    kind: "support",
    who: "Danny Cole",
    when: "19:30",
    line: "Can I move an album to a different account after the wedding?",
    status: "In progress",
  },
  {
    kind: "support",
    who: "Ruth Bellamy",
    when: "18:11",
    line: "The download zip stops at about 400 photos every time.",
    status: "New",
  },
];

/* ── The forensics side (the `escalate` decision) ────────────────────────── */

export type HoldRow = {
  mediaId: string;
  event: string;
  since: string;
  preserved: boolean;
  reason: string;
};

export const HOLDS: HoldRow[] = [
  {
    mediaId: "7c2e4a86-3f09-4b51-a8d7-206e9c1f5b34",
    event: "Northgate Formal",
    since: "8 September, 23:49",
    preserved: true,
    reason: "report af30c682, CyberTipline filing",
  },
];

export type AuditRow = { when: string; what: string; on: string; who: string };

export const AUDIT: AuditRow[] = [
  {
    when: "8 September, 23:51",
    what: "Record downloaded",
    on: "7c2e4a86",
    who: "partyr33l@gmail.com",
  },
  {
    when: "8 September, 23:49",
    what: "Preserved",
    on: "7c2e4a86",
    who: "partyr33l@gmail.com",
  },
  {
    when: "2 September, 09:14",
    what: "Hold released",
    on: "b1d44e07",
    who: "partyr33l@gmail.com",
  },
];

/**
 * The uploader behind tonight's first report, as `/admin/accounts` knows them.
 * The runbook's step 2 says to preserve the surrounding CONTEXT as well as the
 * one frame, so what else this person has in this album is part of the act.
 */
export const UPLOADER = {
  label: "Guest, no account",
  device: "pr_device 3f9c2a...",
  email: "kerry.oshea@gmail.com",
  inThisEvent: 14,
  acrossEvents: 2,
  firstSeen: "Tonight, 21:52",
};

/* ── The rail (the `admin` board's answer, worn as settled) ──────────────── */

export type NavEntry = NavItem & { count: number };

/** The counts the operator's night really carries; everything else is quiet. */
const COUNTS: Record<string, number> = {
  "/admin/support": 9,
  "/admin/applicants": 2,
  "/admin/reports": 3,
};

export const SURFACES: NavEntry[] = NAV.map((n) => ({
  ...n,
  count: COUNTS[n.href] ?? 0,
}));

export function surfaceGroups(): { group: string; items: NavEntry[] }[] {
  const out: { group: string; items: NavEntry[] }[] = [];
  for (const item of SURFACES) {
    const last = out.at(-1);
    if (last?.group === item.group) last.items.push(item);
    else out.push({ group: item.group, items: [item] });
  }
  return out;
}

export const REPORTS_SURFACE =
  SURFACES.find((s) => s.href === "/admin/reports") ?? SURFACES[0];
export const FORENSICS_SURFACE =
  SURFACES.find((s) => s.href === "/admin/forensics") ?? SURFACES[0];
export const SUPPORT_SURFACE =
  SURFACES.find((s) => s.href === "/admin/support") ?? SURFACES[0];

export const ALERTS = { support: 9, applicants: 2, reports: 3 };
export const OPERATOR = "partyr33l@gmail.com";
