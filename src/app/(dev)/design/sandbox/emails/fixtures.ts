import {
  applicationReceivedEmail,
  contactFormEmail,
  inactivityRemovedEmail,
  inactivityWarningEmail,
  orphanBreakerEmail,
  overCapGraceStartEmail,
  overCapReducedEmail,
  overCapReminderEmail,
  pruneBreakerEmail,
  renewalNudgeEmail,
} from "@/lib/email/templates";

/**
 * ONE CAST, drawn once and reused by every template, so what moves between
 * options is the SHELL and never the story: three hosts (Maya over her Pro
 * cap, Priya's Event Pass expiring, Jordan's free event gone quiet) and two
 * outside senders (a reporter, a candidate). Every `{ subject, html }` below
 * is the REAL function in `src/lib/email/templates.ts`, called with fixture
 * options only: nothing on this board writes copy of its own for the ten
 * shipped mails. Dates are fixed strings, never `new Date()`, so a capture
 * never drifts from what the board showed the day it was taken.
 *
 * `templates.ts` is a plain, dependency-free module (no react-email, no
 * `send.ts`, no `client.ts`): safe to import here per the board's own bind,
 * and nothing below can send anything.
 */

const DASHBOARD_URL = "https://partyreel.com/dashboard";

export const HOSTS = {
  /** Pro, lapsed over cap: the over-cap trio. */
  maya: { name: "Maya Chen", email: "maya.chen@example.com" },
  /** Event Pass holder: the renewal nudge. */
  priya: { name: "Priya Anand", email: "priya.anand@example.com" },
  /** Free, gone quiet: the inactivity pair. */
  jordan: { name: "Jordan Reyes", email: "jordan.reyes@example.com" },
} as const;

type Host = (typeof HOSTS)[keyof typeof HOSTS];

export type HostMail = { to: Host; subject: string; html: string };

/** The six lifecycle mails a host can receive, each the real template + a fixture. */
export const HOST_MAILS: Record<
  | "graceStart"
  | "reminder"
  | "reduced"
  | "renewal"
  | "inactivityWarning"
  | "inactivityRemoved",
  HostMail
> = {
  graceStart: {
    to: HOSTS.maya,
    ...overCapGraceStartEmail({
      capLabel: "100 GB",
      deadline: "November 3, 2026",
      dashboardUrl: DASHBOARD_URL,
    }),
  },
  reminder: {
    to: HOSTS.maya,
    ...overCapReminderEmail({
      deadline: "November 3, 2026",
      dashboardUrl: DASHBOARD_URL,
    }),
  },
  reduced: {
    to: HOSTS.maya,
    ...overCapReducedEmail({
      recoverableUntil: "December 3, 2026",
      dashboardUrl: DASHBOARD_URL,
    }),
  },
  renewal: {
    to: HOSTS.priya,
    ...renewalNudgeEmail({
      expiresOn: "October 3, 2026",
      renewUrl: DASHBOARD_URL,
    }),
  },
  inactivityWarning: {
    to: HOSTS.jordan,
    ...inactivityWarningEmail({
      eventName: "Jordan's Housewarming",
      deadline: "December 20, 2026",
      dashboardUrl: DASHBOARD_URL,
    }),
  },
  inactivityRemoved: {
    to: HOSTS.jordan,
    ...inactivityRemovedEmail({
      eventName: "Jordan's Housewarming",
      recoverableUntil: "October 19, 2026",
      dashboardUrl: DASHBOARD_URL,
    }),
  },
};

export type HostMailId = keyof typeof HOST_MAILS;

const OPS_INBOX = "help@partyreel.com";

export type OperatorMail = {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
};

/** The four operator alerts, each hand-rolling its own near-identical wrapper today. */
export const OPERATOR_MAILS: Record<
  "contact" | "careers" | "orphan" | "prune",
  OperatorMail
> = {
  contact: {
    to: OPS_INBOX,
    replyTo: "sam.okafor@example.com",
    ...contactFormEmail({
      name: "Sam Okafor",
      email: "sam.okafor@example.com",
      subject: "A question before our launch piece",
      message:
        "We're covering three spring weddings that used Partyreel and want to confirm one detail about guest privacy before we file. Is there ten minutes this week?",
      topic: "Press & partnerships",
    }),
  },
  careers: {
    to: OPS_INBOX,
    replyTo: "riley.tran@example.com",
    ...applicationReceivedEmail({
      role: "Founding Designer",
      name: "Riley Tran",
      email: "riley.tran@example.com",
      links: "riley-tran.design",
      message:
        "I've led design at two small consumer apps and I'm looking for something earlier-stage. Your guest-upload flow is the best version of this I've seen in the wild.",
    }),
  },
  orphan: {
    to: OPS_INBOX,
    ...orphanBreakerEmail({
      reason: "candidates exceed 20% of total media",
      candidates: 812,
      mediaCount: 3_940,
      objectsScanned: 4_512,
    }),
  },
  prune: {
    to: OPS_INBOX,
    ...pruneBreakerEmail({
      reason: "source media count dropped sharply since last run",
      candidates: 44,
      mediaCount: 3_940,
      objectsScanned: 918,
      mode: "dry-run",
    }),
  },
};

export type OperatorMailId = keyof typeof OPERATOR_MAILS;

/** The sender identity every mail on this board shows today (env.EMAIL_FROM's documented value). */
export const SYSTEM_SENDER = {
  name: "Partyreel",
  email: "noreply@partyreel.com",
} as const;

/** The `sender` decision's alternative: a named person behind host mail. */
export const PERSON_SENDER = {
  name: "Will at Partyreel",
  email: "will@partyreel.com",
} as const;
