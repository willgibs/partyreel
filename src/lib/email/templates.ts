/**
 * Plain, dependency-free transactional email templates (no react-email). Each returns
 * `{ subject, html }`. Keep copy short + action-oriented; one clear CTA. These are the
 * fast-follow lifecycle emails — sent at most once per state via sendOnce().
 */

// Escape user-controlled text (e.g. event names) before interpolating into email HTML.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(
  heading: string,
  bodyHtml: string,
  cta?: { href: string; label: string },
) {
  const button = cta
    ? `<p style="margin:24px 0;"><a href="${cta.href}" style="background:#e11d48;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600;">${cta.label}</a></p>`
    : "";
  return `<div style="font-family:ui-sans-serif,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#111;">
  <h1 style="font-size:18px;font-weight:700;">${heading}</h1>
  ${bodyHtml}
  ${button}
  <p style="color:#888;font-size:12px;margin-top:32px;">Partyreel · you're receiving this because you host an event with us.</p>
</div>`;
}

export function overCapGraceStartEmail(opts: {
  capLabel: string;
  deadline: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Partyreel storage is over the limit",
    html: layout(
      "You're over your storage limit",
      `<p>Your account is now using more than your plan's ${opts.capLabel}. You have until <strong>${opts.deadline}</strong> to upgrade or remove some media. After that, we'll automatically reduce your storage (largest files first) to fit your plan — removed items stay recoverable for a short window.</p>`,
      { href: opts.dashboardUrl, label: "Manage storage" },
    ),
  };
}

export function overCapReminderEmail(opts: {
  deadline: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Reminder: your Partyreel storage will be reduced soon",
    html: layout(
      "A few days left to resolve your storage",
      `<p>Heads up — on <strong>${opts.deadline}</strong> we'll automatically reduce your storage to fit your plan if you're still over the limit. Upgrade or remove some media to keep everything.</p>`,
      { href: opts.dashboardUrl, label: "Manage storage" },
    ),
  };
}

export function overCapReducedEmail(opts: { dashboardUrl: string }): {
  subject: string;
  html: string;
} {
  return {
    subject: "We reduced your Partyreel storage to fit your plan",
    html: layout(
      "Your storage was reduced",
      `<p>Because your account stayed over its limit, we removed your largest files to bring it back under your plan. Removed items are recoverable for a short time — reply to this email if you need them back, or upgrade to restore more headroom.</p>`,
      { href: opts.dashboardUrl, label: "View your plan" },
    ),
  };
}

export function renewalNudgeEmail(opts: {
  expiresOn: string;
  renewUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Partyreel Event Pass expires soon",
    html: layout(
      "Renew your Event Pass",
      `<p>Your Event Pass expires on <strong>${opts.expiresOn}</strong>. Renew to keep your event and its media online for another year — when a pass lapses, the account drops to the Free plan.</p>`,
      { href: opts.renewUrl, label: "Renew Event Pass" },
    ),
  };
}

export function inactivityWarningEmail(opts: {
  eventName: string;
  deadline: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Partyreel event will be removed soon",
    html: layout(
      "Keep your event active",
      `<p>Your event <strong>${esc(opts.eventName)}</strong> hasn't been used in a while. To keep free accounts tidy, we remove events after 6 months of inactivity — yours is set for removal on <strong>${opts.deadline}</strong>. Just sign in or open it before then to keep it.</p>`,
      { href: opts.dashboardUrl, label: "Keep my event" },
    ),
  };
}

export function inactivityRemovedEmail(opts: {
  eventName: string;
  recoverableUntil: string;
  dashboardUrl: string;
}): { subject: string; html: string } {
  return {
    subject: "Your Partyreel event was removed (recoverable for now)",
    html: layout(
      "Your event was removed",
      `<p>Your event <strong>${esc(opts.eventName)}</strong> was removed after 6 months of inactivity (a free-account policy). It's still recoverable until <strong>${opts.recoverableUntil}</strong> — reply to this email if you need it back. After that it's permanently deleted.</p>`,
      { href: opts.dashboardUrl, label: "Go to Partyreel" },
    ),
  };
}
